#!/usr/bin/env bash
# BidtoList — Backend Smoke Tests
#
# Verifies all three canisters are live and responding to their metrics query.
# Requires a running local replica with deployed canisters.
#
# Usage:
#   bash scripts/test-backend.sh             # Test all canisters
#   bash scripts/test-backend.sh listing     # Test a specific canister

set -euo pipefail

NETWORK=${NETWORK:-local}
PASS=0
FAIL=0

# Verify replica is reachable — use ping, not canister status (which triggers inspect).
if ! icp network ping "$NETWORK" >/dev/null 2>&1; then
  echo "❌  No running replica found. Run: make start && make deploy"
  exit 1
fi

ALL_CANISTERS=(listing agent fee)

if [ $# -gt 0 ]; then
  CANISTERS=("$@")
else
  CANISTERS=("${ALL_CANISTERS[@]}")
fi

echo "============================================"
echo "  BidtoList Backend Smoke Tests ($NETWORK)"
echo "============================================"

# $1 canister  $2 display label  $3 method  $4 candid args
run_test() {
  local canister="$1"
  local desc="$2"
  local method="$3"
  local args="$4"
  printf "  %-30s" "$desc"
  if result=$(icp canister call "$canister" "$method" "$args" -e "$NETWORK" 2>&1); then
    echo "✓"
    PASS=$((PASS + 1))
  else
    echo "✗  $result"
    FAIL=$((FAIL + 1))
  fi
}

for canister in "${CANISTERS[@]}"; do
  echo ""
  echo "── $canister ──────────────────────────────"
  case "$canister" in
    listing)
      run_test listing "metrics()"            "metrics"            "()"
      run_test listing "getOpenBidRequests()" "getOpenBidRequests" "()"
      ;;
    agent)
      run_test agent "metrics()"              "metrics"            "()"
      run_test agent "getAllProfiles()"        "getAllProfiles"      "()"
      ;;
    fee)
      run_test fee   "metrics()"              "metrics"            "()"
      ;;
    *)
      echo "  Unknown canister: $canister"
      FAIL=$((FAIL + 1))
      ;;
  esac
done

echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "============================================"

[ "$FAIL" -eq 0 ]
