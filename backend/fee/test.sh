#!/usr/bin/env bash
# BidtoList Fee Canister — integration tests
# Run against a local replica: make start && make deploy && bash backend/fee/test.sh
set -euo pipefail

CANISTER="fee"
NETWORK="local"

echo "============================================"
echo "  BidtoList — Fee Canister Tests"
echo "============================================"

if ! icp network ping "$NETWORK" >/dev/null 2>&1; then
  echo "❌ replica not running. Run: make start && make deploy"
  exit 1
fi
CANISTER_ID=$(icp canister id "$CANISTER" -e "$NETWORK" 2>/dev/null || echo "")
if [ -z "$CANISTER_ID" ]; then
  echo "❌ $CANISTER not deployed. Run: make deploy"
  exit 1
fi

MY_PRINCIPAL=$(icp identity principal 2>/dev/null || echo "2vxsx-fae")
echo "Test principal: $MY_PRINCIPAL"

# ── [1] Metrics ───────────────────────────────────────────────────────────────
echo ""
echo "── [1] metrics() ────────────────────────────────────────────────────────"
icp canister call "$CANISTER" metrics "()" --query -e "$NETWORK"

# ── [2] getMyFees — expect empty ─────────────────────────────────────────────
echo ""
echo "── [2] getMyFees() — expect empty ──────────────────────────────────────"
icp canister call "$CANISTER" getMyFees "()" --query -e "$NETWORK"

# ── [3] addAdmin (idempotent) ─────────────────────────────────────────────────
echo ""
echo "── [3] addAdmin(self) ───────────────────────────────────────────────────"
icp canister call "$CANISTER" addAdmin "(principal \"$MY_PRINCIPAL\")" -e "$NETWORK" || echo "  ↳ already admin — ✓"

# ── [4] getAllFees (admin) — expect empty ─────────────────────────────────────
echo ""
echo "── [4] getAllFees() — expect empty ──────────────────────────────────────"
icp canister call "$CANISTER" getAllFees "()" --query -e "$NETWORK"

# ── [5] getFeesDue (admin) — expect empty ────────────────────────────────────
echo ""
echo "── [5] getFeesDue() — expect empty ─────────────────────────────────────"
icp canister call "$CANISTER" getFeesDue "()" --query -e "$NETWORK"

# ── [6] Final metrics ─────────────────────────────────────────────────────────
echo ""
echo "── [6] metrics() — final ────────────────────────────────────────────────"
icp canister call "$CANISTER" metrics "()" --query -e "$NETWORK"

echo ""
echo "============================================"
echo "  ✅ Fee canister tests complete!"
echo "============================================"
