#!/usr/bin/env bash
# BidtoList Listing Canister — integration tests
# Run against a local replica: make start && make deploy && bash backend/listing/test.sh
set -euo pipefail

CANISTER="listing"
NETWORK="local"

echo "============================================"
echo "  BidtoList — Listing Canister Tests"
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

# ── [2] getOpenBidRequests ────────────────────────────────────────────────────
echo ""
echo "── [2] getOpenBidRequests() — expect empty list initially ───────────────"
icp canister call "$CANISTER" getOpenBidRequests "()" --query -e "$NETWORK"

# ── [3] getMyBidRequests ──────────────────────────────────────────────────────
echo ""
echo "── [3] getMyBidRequests() ───────────────────────────────────────────────"
icp canister call "$CANISTER" getMyBidRequests "()" --query -e "$NETWORK"

# ── [4] getMyProposals ────────────────────────────────────────────────────────
echo ""
echo "── [4] getMyProposals() ─────────────────────────────────────────────────"
icp canister call "$CANISTER" getMyProposals "()" --query -e "$NETWORK"

# ── [5] isHomeownerVerified (self) — expect false before verification ─────────
echo ""
echo "── [5] isHomeownerVerified(self) — expect false ─────────────────────────"
icp canister call "$CANISTER" isHomeownerVerified "(principal \"$MY_PRINCIPAL\")" --query -e "$NETWORK"

# ── [6] addAdmin (idempotent) ─────────────────────────────────────────────────
echo ""
echo "── [6] addAdmin(self) ───────────────────────────────────────────────────"
icp canister call "$CANISTER" addAdmin "(principal \"$MY_PRINCIPAL\")" -e "$NETWORK" || echo "  ↳ already admin — ✓"

# ── [7] verifyHomeowner (admin action) ────────────────────────────────────────
echo ""
echo "── [7] verifyHomeowner(self) ────────────────────────────────────────────"
icp canister call "$CANISTER" verifyHomeowner "(principal \"$MY_PRINCIPAL\")" -e "$NETWORK"

# ── [8] isHomeownerVerified — now expect true ─────────────────────────────────
echo ""
echo "── [8] isHomeownerVerified(self) — expect true ──────────────────────────"
icp canister call "$CANISTER" isHomeownerVerified "(principal \"$MY_PRINCIPAL\")" --query -e "$NETWORK"

# ── [9] createBidRequest ──────────────────────────────────────────────────────
echo ""
echo "── [9] createBidRequest() ───────────────────────────────────────────────"
icp canister call "$CANISTER" createBidRequest "(record {
  address       = \"123 Main St, Daytona Beach, FL 32114\";
  county        = \"Volusia\";
  bedrooms      = 3 : nat;
  bathrooms     = 2 : nat;
  sqft          = 1500 : nat;
  askingPrice   = 350000 : nat;
  description   = \"Smoke test listing\";
  bidDeadlineNs = 9_999_999_999_999_999_999 : int
})" -e "$NETWORK"

# ── [10] getOpenBidRequests — expect 1 listing ────────────────────────────────
echo ""
echo "── [10] getOpenBidRequests() — expect 1 listing ─────────────────────────"
icp canister call "$CANISTER" getOpenBidRequests "()" --query -e "$NETWORK"

# ── [11] Final metrics ────────────────────────────────────────────────────────
echo ""
echo "── [11] metrics() — final ───────────────────────────────────────────────"
icp canister call "$CANISTER" metrics "()" --query -e "$NETWORK"

echo ""
echo "============================================"
echo "  ✅ Listing canister tests complete!"
echo "============================================"
