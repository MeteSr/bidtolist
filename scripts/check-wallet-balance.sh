#!/usr/bin/env bash
# BidtoList — Wallet Cycles Pre-flight Check
#
# Verifies the deploy identity's cycles wallet has enough cycles to create
# new canister slots before deploy begins. Fails fast rather than crashing
# mid-deploy and leaving the app partially deployed.
#
# Usage (pre-deploy in CI):
#   bash scripts/check-wallet-balance.sh
#
# Environment:
#   DFX_IDENTITY_PEM  — PEM content for the deploy identity (required in CI)
#   DFX_WALLET_ID     — cycles wallet canister ID (required in CI)
#   DFX_NETWORK       — target network (default: ic)
#   MIN_WALLET_CYCLES — minimum required cycles (default: 5T)

set -uo pipefail

DFX_NETWORK="${DFX_NETWORK:-ic}"
MIN_WALLET_CYCLES="${MIN_WALLET_CYCLES:-5000000000000}"   # 5T

# dfx 0.24+ requires a dfx.json in the working directory even for identity/wallet
# operations. This repo uses icp.yaml (icp-cli) instead, so we create a minimal
# dfx.json stub for the duration of this script.
_DFX_JSON_CREATED=0
if [ ! -f dfx.json ]; then
  printf '{"version":1}' > dfx.json
  _DFX_JSON_CREATED=1
fi
_cleanup() {
  [ "$_DFX_JSON_CREATED" -eq 1 ] && rm -f dfx.json
  rm -f "${PEM_FILE:-}"
}
trap _cleanup EXIT

if [ -n "${DFX_IDENTITY_PEM:-}" ]; then
  PEM_FILE=$(mktemp /tmp/ci-identity-XXXXXX.pem)
  printf '%s' "$DFX_IDENTITY_PEM" > "$PEM_FILE"
  # dfx 0.24+ wants: import <name> <file> --storage-mode plaintext
  dfx identity import ci-deploy "$PEM_FILE" --storage-mode plaintext 2>/dev/null || \
    dfx identity import --storage-mode=plaintext ci-deploy "$PEM_FILE" 2>/dev/null || true
  dfx identity use ci-deploy
  if [ -n "${DFX_WALLET_ID:-}" ]; then
    dfx identity set-wallet "$DFX_WALLET_ID" --network "$DFX_NETWORK"
  fi
fi

echo "============================================"
echo "  BidtoList — Wallet Pre-flight Check"
echo "  Network  : $DFX_NETWORK"
echo "  Minimum  : $MIN_WALLET_CYCLES cycles ($(( MIN_WALLET_CYCLES / 1000000000000 ))T)"
echo "============================================"

BALANCE_OUT=$(dfx wallet balance --network "$DFX_NETWORK" 2>&1)
if [ $? -ne 0 ]; then
  echo "❌  Could not query wallet balance: $BALANCE_OUT"
  echo "    Ensure DFX_IDENTITY_PEM is set and the wallet exists."
  exit 1
fi

if echo "$BALANCE_OUT" | grep -qi "TC\|trillion"; then
  TC=$(echo "$BALANCE_OUT" | grep -oE '[0-9]+\.[0-9]+|[0-9]+' | head -1)
  BALANCE=$(echo "$TC * 1000000000000" | bc | cut -d. -f1)
else
  BALANCE=$(echo "$BALANCE_OUT" | grep -oE '[0-9]+' | head -1)
fi

if [ -z "$BALANCE" ] || ! [[ "$BALANCE" =~ ^[0-9]+$ ]]; then
  echo "❌  Could not parse wallet balance from: $BALANCE_OUT"
  exit 1
fi

echo "  Wallet balance: $BALANCE cycles ($(echo "scale=3; $BALANCE / 1000000000000" | bc)T)"

if [ "$BALANCE" -lt "$MIN_WALLET_CYCLES" ]; then
  echo ""
  echo "❌  INSUFFICIENT CYCLES — need at least ${MIN_WALLET_CYCLES} cycles to deploy."
  echo "    Top up via: dfx wallet --network $DFX_NETWORK send <amount>"
  echo "    Or via the NNS dapp: https://nns.ic0.app"
  exit 1
fi

echo ""
echo "✅  Wallet pre-flight passed — sufficient cycles to deploy."
exit 0
