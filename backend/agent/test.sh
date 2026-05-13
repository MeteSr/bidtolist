#!/usr/bin/env bash
# BidtoList Agent Canister — integration tests
# Run against a local replica: make start && make deploy && bash backend/agent/test.sh
set -euo pipefail

CANISTER="agent"
NETWORK="local"

echo "============================================"
echo "  BidtoList — Agent Canister Tests"
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

# ── [2] getAllProfiles — expect empty initially ───────────────────────────────
echo ""
echo "── [2] getAllProfiles() — expect empty initially ────────────────────────"
icp canister call "$CANISTER" getAllProfiles "()" --query -e "$NETWORK"

# ── [3] getMyProfile — expect null ───────────────────────────────────────────
echo ""
echo "── [3] getMyProfile() — expect null ─────────────────────────────────────"
icp canister call "$CANISTER" getMyProfile "()" --query -e "$NETWORK"

# ── [4] isVerifiedAgent (self) — expect false ─────────────────────────────────
echo ""
echo "── [4] isVerifiedAgent(self) — expect false ─────────────────────────────"
icp canister call "$CANISTER" isVerifiedAgent "(principal \"$MY_PRINCIPAL\")" --query -e "$NETWORK"

# ── [5] addAdmin (idempotent) ─────────────────────────────────────────────────
echo ""
echo "── [5] addAdmin(self) ───────────────────────────────────────────────────"
icp canister call "$CANISTER" addAdmin "(principal \"$MY_PRINCIPAL\")" -e "$NETWORK" || echo "  ↳ already admin — ✓"

# ── [6] getProfilesByCounty — expect empty ────────────────────────────────────
echo ""
echo "── [6] getProfilesByCounty(Volusia) — expect empty ─────────────────────"
icp canister call "$CANISTER" getProfilesByCounty "(\"Volusia\")" --query -e "$NETWORK"

# ── [7] metrics — final ───────────────────────────────────────────────────────
echo ""
echo "── [7] metrics() — final ────────────────────────────────────────────────"
icp canister call "$CANISTER" metrics "()" --query -e "$NETWORK"

echo ""
echo "============================================"
echo "  ✅ Agent canister tests complete!"
echo "============================================"
