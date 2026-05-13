#!/usr/bin/env bash
# BidtoList — Canister Status
set -uo pipefail

NETWORK=${NETWORK:-local}

echo "============================================"
echo "  BidtoList Canister Status ($NETWORK)"
echo "============================================"

for canister in listing agent fee; do
  echo ""
  echo "── $canister ──────────────────────────────"
  icp canister status "$canister" -e "$NETWORK" 2>&1 | head -8 || echo "  (not deployed)"
done

echo ""
