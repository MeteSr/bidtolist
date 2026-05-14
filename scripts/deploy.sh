#!/usr/bin/env bash
set -euo pipefail

DEPLOY_SCRIPT_VERSION="0.3.0"
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
else
  _PRINCIPAL=$(icp identity principal 2>/dev/null || echo "2vxsx-fae")
  if [ "$_PRINCIPAL" = "2vxsx-fae" ]; then
    echo "▶ Creating local deploy identity (bidtolist-local)..."
    if ! icp identity new bidtolist-local --storage plaintext 2>/dev/null && \
       ! icp identity new bidtolist-local 2>/dev/null; then
      _ID_PEM=$(mktemp /tmp/btl-deploy-XXXXXX.pem)
      openssl genpkey -algorithm Ed25519 -out "$_ID_PEM" 2>/dev/null
      icp identity import bidtolist-local --from-pem "$_ID_PEM" --storage plaintext 2>/dev/null || true
      rm -f "$_ID_PEM"
    fi
    icp identity default bidtolist-local 2>/dev/null || true
    echo "  ✓ Identity: $(icp identity principal)"
  fi
fi

# ── Mops toolchain ────────────────────────────────────────────────────────────
echo "▶ Initializing mops toolchain..."
mops toolchain init 2>/dev/null || true
MOC_BIN=$(mops toolchain bin moc 2>/dev/null) || MOC_BIN=""
if [ -z "$MOC_BIN" ]; then
  rm -rf .mops/_tmp
  mops toolchain init 2>/dev/null || true
  MOC_BIN=$(mops toolchain bin moc) || { echo "  ERROR: cannot resolve moc binary"; exit 1; }
fi
echo "  ✓ moc ready: $MOC_BIN"

# ── ic-wasm ───────────────────────────────────────────────────────────────────
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

CANISTERS=(listing agent fee)
DEPLOY_PRINCIPAL=$(icp identity principal)

if [ "$ENV" = "local" ]; then
  echo "▶ Minting local cycles..."
  icp cycles mint 500000000000000 -e local >/dev/null 2>&1 || true

  echo "▶ Deploying canisters..."
  for canister in "${CANISTERS[@]}"; do
    echo "  → $canister"
    icp deploy "$canister" -e local 2>&1 | tail -3
  done

  echo "▶ Saving local canister IDs to .dfx/local/canister_ids.json..."
  mkdir -p ".dfx/local"
  python3 - <<'PYEOF'
import json, subprocess
ids = {}
for name in ["listing", "agent", "fee"]:
    result = subprocess.run(["icp","canister","id",name,"-e","local"],
                            capture_output=True, text=True)
    cid = result.stdout.strip()
    if cid:
        ids[name] = {"local": cid}
json.dump(ids, open(".dfx/local/canister_ids.json","w"), indent=2)
print(f"  ✓ Saved {len(ids)} canister IDs")
PYEOF

  # ── Wire fee canister from listing canister ────────────────────────────────
  echo "▶ Wiring cross-canister references..."
  LISTING_ID=$(icp canister status listing -e local --id-only 2>/dev/null || echo "")
  FEE_ID=$(icp canister status fee -e local --id-only 2>/dev/null || echo "")
  AGENT_ID=$(icp canister status agent -e local --id-only 2>/dev/null || echo "")
  if [ -n "$LISTING_ID" ] && [ -n "$FEE_ID" ]; then
    icp canister call listing setFeeCanisterId "(\"$FEE_ID\")" -e local 2>/dev/null && echo "  ✓ listing → fee wired" || true
    icp canister call fee setListingCanisterId "(\"$LISTING_ID\")" -e local 2>/dev/null && echo "  ✓ fee ← listing wired" || true
    if [ -n "$AGENT_ID" ]; then
      icp canister call listing setAgentCanisterId "(\"$AGENT_ID\")" -e local 2>/dev/null && echo "  ✓ listing → agent wired" || true
      icp canister call agent setListingCanisterId "(\"$LISTING_ID\")" -e local 2>/dev/null && echo "  ✓ agent → listing wired" || true
    fi
    # Admin init — addAdmin is now controller-gated on first call; deploy principal is the controller
    icp canister call listing addAdmin "(principal \"$DEPLOY_PRINCIPAL\")" -e local 2>/dev/null || true
    icp canister call agent addAdmin "(principal \"$DEPLOY_PRINCIPAL\")" -e local 2>/dev/null || true
    icp canister call fee addAdmin "(principal \"$DEPLOY_PRINCIPAL\")" -e local 2>/dev/null || true
    echo "  ✓ Admin principal registered"
    # Enable homeowner verification gate now that admin is set
    icp canister call listing enableVerification "()" -e local 2>/dev/null && echo "  ✓ Homeowner verification enabled" || true
  fi
else
  echo "▶ Building backend canisters..."
  for canister in "${CANISTERS[@]}"; do
    echo "  → $canister"
    icp build "$canister" -e "$ENV"
  done

  echo "▶ Installing backend canisters..."
  for canister in "${CANISTERS[@]}"; do
    echo "  → $canister"
    icp canister install "$canister" -e "$ENV" --mode upgrade 2>/dev/null || \
    icp canister install "$canister" -e "$ENV" --mode install
  done

  echo "▶ Wiring cross-canister references..."
  LISTING_ID=$(icp canister status listing -e "$ENV" --id-only 2>/dev/null || echo "")
  FEE_ID=$(icp canister status fee -e "$ENV" --id-only 2>/dev/null || echo "")
  AGENT_ID=$(icp canister status agent -e "$ENV" --id-only 2>/dev/null || echo "")
  if [ -n "$LISTING_ID" ] && [ -n "$FEE_ID" ]; then
    icp canister call listing setFeeCanisterId "(\"$FEE_ID\")" -e "$ENV" 2>/dev/null && echo "  ✓ listing → fee wired" || true
    icp canister call fee setListingCanisterId "(\"$LISTING_ID\")" -e "$ENV" 2>/dev/null && echo "  ✓ fee ← listing wired" || true
    if [ -n "$AGENT_ID" ]; then
      icp canister call listing setAgentCanisterId "(\"$AGENT_ID\")" -e "$ENV" 2>/dev/null && echo "  ✓ listing → agent wired" || true
      icp canister call agent setListingCanisterId "(\"$LISTING_ID\")" -e "$ENV" 2>/dev/null && echo "  ✓ agent → listing wired" || true
    fi
    # addAdmin is controller-gated on first call; safe to call on every deploy (idempotent after init)
    icp canister call listing addAdmin "(principal \"$DEPLOY_PRINCIPAL\")" -e "$ENV" 2>/dev/null || true
    icp canister call agent addAdmin "(principal \"$DEPLOY_PRINCIPAL\")" -e "$ENV" 2>/dev/null || true
    icp canister call fee addAdmin "(principal \"$DEPLOY_PRINCIPAL\")" -e "$ENV" 2>/dev/null || true
    echo "  ✓ Admin principal registered"
    icp canister call listing enableVerification "()" -e "$ENV" 2>/dev/null && echo "  ✓ Homeowner verification enabled" || true
  fi
fi

# ── Frontend ──────────────────────────────────────────────────────────────────
if [ "${SKIP_FRONTEND:-0}" = "1" ]; then
  echo ""
  echo "✅ BidtoList deployed to $ENV (frontend skipped)"
  exit 0
fi

echo "▶ Building frontend..."
cd frontend

LISTING_ID=$(icp canister status listing -e "$ENV" --id-only 2>/dev/null || echo "")
AGENT_ID=$(icp canister status agent -e "$ENV" --id-only 2>/dev/null || echo "")
FEE_ID=$(icp canister status fee -e "$ENV" --id-only 2>/dev/null || echo "")
[ -n "$LISTING_ID" ] && export CANISTER_ID_LISTING="$LISTING_ID"
[ -n "$AGENT_ID"   ] && export CANISTER_ID_AGENT="$AGENT_ID"
[ -n "$FEE_ID"     ] && export CANISTER_ID_FEE="$FEE_ID"

VITE_STRIPE_PUBLISHABLE_KEY="${VITE_STRIPE_PUBLISHABLE_KEY:-}" npm run build
cd ..

echo "▶ Deploying frontend..."
icp deploy frontend -e "$ENV" 2>/dev/null || \
  icp canister install frontend -e "$ENV" --mode upgrade 2>/dev/null || true

echo ""
echo "✅ BidtoList deployed to $ENV"
