#!/usr/bin/env bash
set -euo pipefail

DEPLOY_SCRIPT_VERSION="0.4.3"
ENV=${1:-local}

echo "============================================"
echo "  BidtoList — Deployment ($ENV) v${DEPLOY_SCRIPT_VERSION}"
echo "============================================"

# ── Identity setup ────────────────────────────────────────────────────────────
if [ "$ENV" != "local" ] && [ -n "${DFX_IDENTITY_PEM:-}" ]; then
  echo "▶ Loading ICP identity from DFX_IDENTITY_PEM secret..."
  IDENTITY_FILE=$(mktemp /tmp/icp-identity-XXXXXX.pem)
  printf '%s' "$DFX_IDENTITY_PEM" > "$IDENTITY_FILE"
  icp identity import ci-deploy --from-pem "$IDENTITY_FILE" --storage plaintext 2>/dev/null || true
  icp identity default ci-deploy
  rm -f "$IDENTITY_FILE"
  echo "  ✓ Identity loaded"
elif [ "$ENV" = "local" ]; then
  # Local network seeds the default identity with ICP and cycles automatically.
  # Do not create a new identity — a fresh identity has 0 cycles and cannot create canisters.
  echo "  ✓ Using default local identity (pre-seeded with cycles): $(icp identity principal 2>/dev/null || echo 'anonymous')"
fi

# ── Mops toolchain ────────────────────────────────────────────────────────────
echo "▶ Initializing mops toolchain..."
mops toolchain init 2>/dev/null || true
MOC_BIN=$(mops toolchain bin moc 2>/dev/null) || MOC_BIN=""
if [ -z "$MOC_BIN" ]; then
  echo "  First call failed — clearing tmp cache and retrying..."
  rm -rf .mops/_tmp
  mops toolchain init 2>/dev/null || true
  MOC_BIN=$(mops toolchain bin moc) || { echo "  ERROR: cannot resolve moc binary"; exit 1; }
fi
echo "  ✓ moc ready: $MOC_BIN"

# ── ic-wasm ───────────────────────────────────────────────────────────────────
if ! command -v ic-wasm >/dev/null 2>&1; then
  for _dfx_bin in "$HOME/.local/share/dfx/bin" "$HOME/.dfinity/bin"; do
    if [ -x "$_dfx_bin/ic-wasm" ]; then
      export PATH="$_dfx_bin:$PATH"
      break
    fi
  done
fi
if ! command -v ic-wasm >/dev/null 2>&1; then
  echo "▶ Downloading ic-wasm 0.9.11..."
  _TMP=$(mktemp -d)
  curl -sSfL \
    "https://github.com/dfinity/ic-wasm/releases/download/0.9.11/ic-wasm-x86_64-unknown-linux-musl.tar.xz" \
    -o "$_TMP/ic-wasm.tar.xz"
  tar -xJf "$_TMP/ic-wasm.tar.xz" -C "$_TMP"
  mkdir -p "$HOME/.local/bin"
  cp "$(find "$_TMP" -name "ic-wasm" -type f | head -1)" "$HOME/.local/bin/ic-wasm"
  chmod +x "$HOME/.local/bin/ic-wasm"
  export PATH="$HOME/.local/bin:$PATH"
  rm -rf "$_TMP"
fi
echo "  ✓ ic-wasm: $(ic-wasm --version 2>/dev/null | head -1)"

# ── Local network ─────────────────────────────────────────────────────────────
if [ "$ENV" = "local" ]; then
  echo "▶ Starting local ICP network..."
  if icp network ping local >/dev/null 2>&1; then
    echo "  ✓ Local network already running"
  else
    icp network stop 2>/dev/null || true
    icp network start -d
    echo "  ✓ Local network started"
  fi
fi

# ── Pre-flight checks (non-local networks only) ───────────────────────────────
if [ "$ENV" != "local" ]; then
  echo ""
  echo "============================================"
  echo "  Pre-flight Checks ($ENV)"
  echo "============================================"
  PREFLIGHT_FAILED=0

  # Identity must not be anonymous
  CURRENT_PRINCIPAL=$(icp identity principal 2>/dev/null || echo "2vxsx-fae")
  if [ "$CURRENT_PRINCIPAL" = "2vxsx-fae" ]; then
    echo "  ✗ ICP identity is anonymous — switch with: icp identity default <name>"
    PREFLIGHT_FAILED=1
  else
    echo "  ✓ ICP identity principal: $CURRENT_PRINCIPAL"
  fi

  # Network must be reachable
  echo -n "  Checking network reachability ($ENV)... "
  if icp network ping "$ENV" >/dev/null 2>&1; then
    echo "✓"
  else
    echo "✗"
    echo "  ✗ ICP network '$ENV' is not reachable — check your connection or icp.yaml"
    PREFLIGHT_FAILED=1
  fi

  # VITE_STRIPE_PUBLISHABLE_KEY — warn only; app functions without it (no Stripe.js)
  if [ -z "${VITE_STRIPE_PUBLISHABLE_KEY:-}" ]; then
    echo "  ⚠️  VITE_STRIPE_PUBLISHABLE_KEY is not set — Stripe payment links won't work in the frontend"
  else
    echo "  ✓ VITE_STRIPE_PUBLISHABLE_KEY is set"
  fi

  if [ "$PREFLIGHT_FAILED" -ne 0 ]; then
    echo ""
    echo "❌ Pre-flight failed. Fix the issues above and retry."
    exit 1
  fi
  echo ""
fi

# ── DRY_RUN short-circuit ─────────────────────────────────────────────────────
if [ "${DRY_RUN:-0}" = "1" ]; then
  echo ""
  echo "✅ DRY_RUN=1 — env and network validation passed. Exiting without deploying."
  exit 0
fi

CANISTERS=(listing agent fee)
LOG_DIR=$(mktemp -d /tmp/icp-deploy-XXXXXX)
trap 'rm -rf "$LOG_DIR"' EXIT
DEPLOY_PRINCIPAL=$(icp identity principal)

# ── Seed icp-cli state from canister_ids.json (non-local only) ───────────────
if [ "$ENV" != "local" ] && [ -f "canister_ids.json" ] && command -v python3 >/dev/null 2>&1; then
  mkdir -p ".icp/data/mappings"
  ENV="$ENV" python3 - <<'PYEOF'
import json, os
env = os.environ.get("ENV", "")
src = json.load(open("canister_ids.json"))
flat = {k: v[env] for k, v in src.items() if isinstance(v, dict) and v.get(env)}
dest = f".icp/data/mappings/{env}.ids.json"
json.dump(flat, open(dest, "w"), indent=2)
print(f"  ✓ Seeded {len(flat)} canister IDs into {dest}")
PYEOF
fi

# ── Determine which canisters need new slot creation ─────────────────────────
CANISTERS_TO_CREATE=()
if [ "$ENV" != "local" ] && [ -f "canister_ids.json" ] && command -v python3 >/dev/null 2>&1; then
  for _c in "${CANISTERS[@]}" frontend; do
    _id=$(python3 -c "import json; d=json.load(open('canister_ids.json')); print(d.get('$_c',{}).get('$ENV',''))" 2>/dev/null || echo "")
    [ -z "$_id" ] && CANISTERS_TO_CREATE+=("$_c")
  done
else
  CANISTERS_TO_CREATE=("${CANISTERS[@]}" frontend)
fi

if [ ${#CANISTERS_TO_CREATE[@]} -eq 0 ]; then
  echo "▶ All canister IDs found in canister_ids.json — upgrade deploy, skipping slot creation"
else
  echo "▶ ${#CANISTERS_TO_CREATE[@]} new canister slot(s) needed: ${CANISTERS_TO_CREATE[*]}"
fi

# ── Fund cycles ledger from dfx wallet (non-local fresh deploy only) ─────────
if [ "$ENV" != "local" ] && [ ${#CANISTERS_TO_CREATE[@]} -gt 0 ] && [ -n "${DFX_WALLET_ID:-}" ] && [ -n "${DFX_IDENTITY_PEM:-}" ]; then
  echo "▶ Configuring dfx wallet for cycles-funded canister creation..."
  _DFX_PEM=$(mktemp /tmp/dfx-pem-XXXXXX.pem)
  printf '%s' "$DFX_IDENTITY_PEM" > "$_DFX_PEM"
  dfx identity import --storage-mode=plaintext ci-deploy "$_DFX_PEM" 2>/dev/null || true
  dfx identity use ci-deploy
  dfx identity set-wallet "$DFX_WALLET_ID" --network ic
  rm -f "$_DFX_PEM"
  echo "  ✓ dfx wallet: $DFX_WALLET_ID"

  _FUND=$(( ${#CANISTERS_TO_CREATE[@]} * 1500000000000 ))
  echo "▶ Depositing ${_FUND} cycles (${#CANISTERS_TO_CREATE[@]} × 1.5T) for $DEPLOY_PRINCIPAL..."
  if dfx canister call um5iw-rqaaa-aaaaq-qaaba-cai deposit \
    "(record { to = record { owner = principal \"$DEPLOY_PRINCIPAL\"; subaccount = null }; memo = null; created_at_time = null })" \
    --with-cycles "$_FUND" \
    --wallet "$DFX_WALLET_ID" \
    --network ic; then
    echo "  ✓ Cycles ledger funded"
  else
    echo "  ⚠️  Cycles ledger deposit failed — ensure wallet has ≥ ${_FUND} cycles."
  fi
fi

if [ "$ENV" = "local" ]; then
  # ── Local: mint cycles + all-in-one icp deploy ────────────────────────────
  echo "▶ Minting local cycles (100T)..."
  icp cycles mint 100000000000000 -e local >/dev/null 2>&1 || true
  echo "  ✓ Cycles minted"

  # Top up each existing canister — minting funds the deployer account, not the
  # canisters themselves. Wasm reinstalls cost cycles proportional to binary size.
  # dfx canister deposit-cycles is reliable for local; icp cycles transfer is a fallback.
  echo "▶ Topping up existing local canisters (10T each)..."
  for _c in "${CANISTERS[@]}"; do
    _cid=$(icp canister status "$_c" -e local --id-only 2>/dev/null || echo "")
    if [ -z "$_cid" ]; then
      echo "  (skipping $_c — not yet deployed)"
      continue
    fi
    if dfx canister deposit-cycles 10000000000000 "$_cid" --network local >/dev/null 2>&1; then
      echo "  ✓ $_c topped up"
    elif icp cycles transfer 10000000000000 "$_cid" -e local >/dev/null 2>&1; then
      echo "  ✓ $_c topped up (via icp cycles transfer)"
    else
      echo "  ⚠️  $_c top-up failed — deploy may fail if canister is low on cycles"
    fi
  done

  echo ""
  echo "▶ Deploying canisters (local)..."
  for canister in "${CANISTERS[@]}"; do
    echo -n "  $canister... "
    if icp deploy "$canister" -e local >"$LOG_DIR/$canister.deploy.log" 2>&1; then
      echo "✓"
    else
      echo "FAILED"
      cat "$LOG_DIR/$canister.deploy.log"
      exit 1
    fi
  done

else
  # ── Non-local: three-phase deploy (create → build → install) ────────────────
  echo ""
  echo "▶ Phase 1/3 — Creating canister slots..."
  for canister in "${CANISTERS[@]}"; do
    echo -n "  $canister... "
    _known_id=""
    if [ -f "canister_ids.json" ] && command -v python3 >/dev/null 2>&1; then
      _known_id=$(python3 -c "import json; d=json.load(open('canister_ids.json')); print(d.get('$canister',{}).get('$ENV',''))" 2>/dev/null || echo "")
    fi
    if [ -n "$_known_id" ]; then
      echo "exists ($_known_id)"
      continue
    fi
    if icp canister create "$canister" -e "$ENV" --cycles 1500000000000 >"$LOG_DIR/$canister.create.log" 2>&1; then
      echo "created"
    else
      EXISTING_ID=$(icp canister status "$canister" -e "$ENV" --id-only 2>/dev/null || echo "")
      if [ -n "$EXISTING_ID" ]; then
        echo "exists ($EXISTING_ID)"
      else
        echo "FAILED"
        cat "$LOG_DIR/$canister.create.log"
        exit 1
      fi
    fi
  done

  echo ""
  echo "▶ Phase 2/3 — Compiling canisters..."
  BUILD_FAILED=()
  for canister in "${CANISTERS[@]}"; do
    echo -n "  $canister... "
    if icp build "$canister" >"$LOG_DIR/$canister.build.log" 2>&1; then
      echo "✓"
    else
      echo "✗"
      BUILD_FAILED+=("$canister")
    fi
  done
  if [ ${#BUILD_FAILED[@]} -gt 0 ]; then
    echo "❌ Build failed for: ${BUILD_FAILED[*]}"
    for c in "${BUILD_FAILED[@]}"; do cat "$LOG_DIR/$c.build.log"; done
    exit 1
  fi

  echo ""
  echo "▶ Phase 3/3 — Installing canisters..."
  INSTALL_FAILED=()
  for canister in "${CANISTERS[@]}"; do
    echo -n "  $canister... "
    if icp canister install "$canister" --mode auto -e "$ENV" >"$LOG_DIR/$canister.install.log" 2>&1; then
      echo "✓"
    else
      echo "✗"
      INSTALL_FAILED+=("$canister")
    fi
  done
  if [ ${#INSTALL_FAILED[@]} -gt 0 ]; then
    echo "❌ Install failed for: ${INSTALL_FAILED[*]}"
    for c in "${INSTALL_FAILED[@]}"; do cat "$LOG_DIR/$c.install.log"; done
    exit 1
  fi
fi

rm -rf "$LOG_DIR"

echo ""
echo "============================================"
echo "  Deployed Canister IDs"
echo "============================================"
LISTING_ID=$(icp canister status listing -e "$ENV" --id-only 2>/dev/null || echo "")
AGENT_ID=$(icp canister status agent   -e "$ENV" --id-only 2>/dev/null || echo "")
FEE_ID=$(icp canister status fee     -e "$ENV" --id-only 2>/dev/null || echo "")
for canister in "${CANISTERS[@]}"; do
  ID=$(icp canister status "$canister" -e "$ENV" --id-only 2>/dev/null || echo "not deployed")
  echo "  $canister: $ID"
done

# Validate all IDs are present
CANISTER_ID_FAILED=0
for canister in "${CANISTERS[@]}"; do
  ID=$(icp canister status "$canister" -e "$ENV" --id-only 2>/dev/null || echo "")
  if [ -z "$ID" ]; then
    echo "  ✗ $canister: missing canister ID"
    CANISTER_ID_FAILED=1
  fi
done
if [ "$CANISTER_ID_FAILED" -ne 0 ]; then
  echo "❌ One or more canister IDs are missing."
  exit 1
fi

# ── Write canister IDs to .env ────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Writing Canister IDs to .env"
echo "============================================"
for canister in "${CANISTERS[@]}"; do
  ID=$(icp canister status "$canister" -e "$ENV" --id-only 2>/dev/null || echo "")
  VAR_NAME="CANISTER_ID_$(echo "$canister" | tr '[:lower:]' '[:upper:]')"
  if grep -q "^${VAR_NAME}=" .env 2>/dev/null; then
    sed -i "s|^${VAR_NAME}=.*|${VAR_NAME}=${ID}|" .env
  else
    echo "${VAR_NAME}=${ID}" >> .env
  fi
  echo "  ✓ ${VAR_NAME}=${ID}"
done
if grep -q "^DFX_NETWORK=" .env 2>/dev/null; then
  sed -i "s|^DFX_NETWORK=.*|DFX_NETWORK=${ENV}|" .env
else
  echo "DFX_NETWORK=${ENV}" >> .env
fi

# ── Persist canister IDs to canister_ids.json ─────────────────────────────────
if [ "$ENV" != "local" ] && command -v python3 >/dev/null 2>&1; then
  echo ""
  echo "============================================"
  echo "  Persisting Canister IDs to canister_ids.json"
  echo "============================================"
  ENV="$ENV" python3 - <<'PYEOF'
import json, os, subprocess
env = os.environ.get("ENV", "")
canisters = ["listing", "agent", "fee"]
d = json.load(open("canister_ids.json")) if os.path.exists("canister_ids.json") else {}
for name in canisters:
    r = subprocess.run(["icp", "canister", "status", name, "-e", env, "--id-only"],
                       capture_output=True, text=True)
    cid = r.stdout.strip()
    if cid:
        d.setdefault(name, {})[env] = cid
        print(f"  ✓ {name}: {cid}")
json.dump(d, open("canister_ids.json", "w"), indent=2)
PYEOF
fi

# ── Cycles balance check (non-local) ─────────────────────────────────────────
if [ "$ENV" != "local" ]; then
  echo ""
  echo "============================================"
  echo "  Cycles Balance Check"
  echo "============================================"
  WARNING_CYCLES=500000000000   # 500B
  TOP_UP_TO=2000000000000       # 2T
  for canister in "${CANISTERS[@]}"; do
    STATUS_OUT=$(icp canister status "$canister" -e "$ENV" 2>&1) || {
      echo "  ⚠️  Could not get status for $canister"
      continue
    }
    BALANCE_RAW=$(echo "$STATUS_OUT" | grep -i "^Cycles:" | head -1 | awk '{print $2}' | tr -d '_,') || BALANCE_RAW=""
    if [ -z "$BALANCE_RAW" ] || ! [[ "$BALANCE_RAW" =~ ^[0-9]+$ ]]; then
      echo "  ⚠️  Could not parse cycles for $canister"
      continue
    fi
    if [ "$BALANCE_RAW" -lt "$WARNING_CYCLES" ]; then
      NEEDED=$(( TOP_UP_TO - BALANCE_RAW ))
      echo "  ⚠️  $canister low on cycles (${BALANCE_RAW}) — topping up ${NEEDED}..."
      icp cycles transfer "$NEEDED" "$canister" -e "$ENV" && echo "  ✓ topped up" || echo "  ✗ top-up failed"
    else
      echo "  ✓ $canister OK (${BALANCE_RAW} cycles)"
    fi
  done
fi

# ── Wiring cross-canister references ─────────────────────────────────────────
echo ""
echo "============================================"
echo "  Wiring Cross-Canister References"
echo "============================================"
if [ -n "$LISTING_ID" ] && [ -n "$FEE_ID" ]; then
  icp canister call listing setFeeCanisterId   "(\"$FEE_ID\")"     -e "$ENV" 2>/dev/null && echo "  ✓ listing → fee" || true
  icp canister call fee     setListingCanisterId "(\"$LISTING_ID\")" -e "$ENV" 2>/dev/null && echo "  ✓ fee → listing" || true
fi
if [ -n "$LISTING_ID" ] && [ -n "$AGENT_ID" ]; then
  icp canister call listing setAgentCanisterId   "(\"$AGENT_ID\")"   -e "$ENV" 2>/dev/null && echo "  ✓ listing → agent" || true
  icp canister call agent   setListingCanisterId "(\"$LISTING_ID\")" -e "$ENV" 2>/dev/null && echo "  ✓ agent → listing" || true
fi

# ── Admin init ────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Bootstrapping Admins"
echo "============================================"
echo "  Deployer: $DEPLOY_PRINCIPAL"
for canister in "${CANISTERS[@]}"; do
  icp canister call "$canister" addAdmin "(principal \"$DEPLOY_PRINCIPAL\")" -e "$ENV" 2>/dev/null && \
    echo "  ✓ $canister admin set" || echo "  ⚠️  $canister addAdmin failed (may already be set)"
done

# Enable homeowner verification gate
icp canister call listing enableVerification "()" -e "$ENV" 2>/dev/null && \
  echo "  ✓ Homeowner verification enabled" || true

# ── Controller hardening ──────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Controller Hardening"
echo "============================================"
if [ "$ENV" != "local" ]; then
  if [ -n "${BACKUP_CONTROLLER_PRINCIPAL:-}" ]; then
    echo "  ⚠️  icp canister settings --add-controller not yet confirmed in icp-cli."
    echo "     Set manually via dfx until icp-cli documents this."
    echo "     BACKUP_CONTROLLER_PRINCIPAL=${BACKUP_CONTROLLER_PRINCIPAL}"
  else
    echo "  ⚠️  BACKUP_CONTROLLER_PRINCIPAL not set — canisters controlled only by deploy identity."
  fi
else
  echo "  (skipped — local network)"
fi

# ── Frontend build + deploy ───────────────────────────────────────────────────
if [ "${SKIP_FRONTEND:-0}" = "1" ]; then
  echo ""
  echo "✅ BidtoList deployed to $ENV (frontend skipped)"
  exit 0
fi

echo ""
echo "============================================"
echo "  Building Frontend"
echo "============================================"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DFX_NETWORK="$ENV"
[ -n "$LISTING_ID" ] && export CANISTER_ID_LISTING="$LISTING_ID"
[ -n "$AGENT_ID"   ] && export CANISTER_ID_AGENT="$AGENT_ID"
[ -n "$FEE_ID"     ] && export CANISTER_ID_FEE="$FEE_ID"
VITE_STRIPE_PUBLISHABLE_KEY="${VITE_STRIPE_PUBLISHABLE_KEY:-}"

echo "▶ npm run build (frontend)..."
if (cd "$REPO_ROOT/frontend" && VITE_STRIPE_PUBLISHABLE_KEY="$VITE_STRIPE_PUBLISHABLE_KEY" npm run build); then
  echo "  ✓ Frontend built"
else
  echo "  ✗ Frontend build failed — aborting"
  exit 1
fi

echo ""
echo "============================================"
echo "  Deploying Frontend Canister"
echo "============================================"
echo "▶ icp deploy frontend -e $ENV..."
if icp deploy frontend -e "$ENV"; then
  FRONTEND_ID=$(icp canister status frontend -e "$ENV" --id-only 2>/dev/null || echo "unknown")
  echo "  ✓ Frontend canister deployed ($FRONTEND_ID)"
  if [ "$FRONTEND_ID" != "unknown" ] && [ "$ENV" != "local" ] && command -v python3 >/dev/null 2>&1; then
    python3 - <<PYEOF
import json, os
d = json.load(open("canister_ids.json")) if os.path.exists("canister_ids.json") else {}
d.setdefault("frontend", {})["$ENV"] = "$FRONTEND_ID"
json.dump(d, open("canister_ids.json", "w"), indent=2)
print("  ✓ canister_ids.json updated with frontend: $FRONTEND_ID")
PYEOF
  fi
else
  echo "  ✗ Frontend canister deploy failed"
  exit 1
fi

echo ""
echo "✅ BidtoList deployed to $ENV"
