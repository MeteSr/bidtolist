#!/usr/bin/env bash
# BidtoList — Backend Test Coordinator
#
# Runs each canister's test.sh in parallel, collects output to per-canister
# log files, prints them sequentially once all suites finish, and exits
# non-zero if any canister failed.
#
# Usage:
#   bash scripts/test-backend.sh             # Run all canisters
#   bash scripts/test-backend.sh listing     # Run only specified canisters

set -uo pipefail   # no -e so individual failures don't abort the coordinator

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Verify replica is running ─────────────────────────────────────────────────
if ! icp network ping local >/dev/null 2>&1; then
  echo "❌  No running replica found. Run: make start && make deploy"
  exit 1
fi

# ── Canister list ─────────────────────────────────────────────────────────────
ALL_CANISTERS=(listing agent fee)

if [ $# -gt 0 ]; then
  CANISTERS=("$@")
else
  CANISTERS=("${ALL_CANISTERS[@]}")
fi

# ── Result tracking ───────────────────────────────────────────────────────────
declare -a PASSED=()
declare -a FAILED=()
declare -a SKIPPED=()
declare -a ACTIVE=()
declare -a PIDS=()

LOG_DIR=$(mktemp -d /tmp/test-backend-XXXXXX)

echo "============================================"
echo "  BidtoList — Backend Test Suite"
echo "============================================"
echo "  Launching ${#CANISTERS[@]} canister suite(s) in parallel"
echo ""

# ── Launch all suites in parallel ────────────────────────────────────────────
for CANISTER in "${CANISTERS[@]}"; do
  TEST_SCRIPT="$REPO_ROOT/backend/$CANISTER/test.sh"

  if [ ! -f "$TEST_SCRIPT" ]; then
    echo "  ⬜ $CANISTER — no test.sh, skipping"
    SKIPPED+=("$CANISTER")
    continue
  fi

  CANISTER_ID=$(icp canister id "$CANISTER" -e local 2>/dev/null || echo "")
  if [ -z "$CANISTER_ID" ]; then
    echo "  ⬜ $CANISTER — not deployed, skipping"
    SKIPPED+=("$CANISTER")
    continue
  fi

  date +%s > "$LOG_DIR/$CANISTER.start"
  bash "$TEST_SCRIPT" > "$LOG_DIR/$CANISTER.log" 2>&1 &
  PIDS+=($!)
  ACTIVE+=("$CANISTER")
  echo "  ▶ $CANISTER launched (pid $!)"
done

echo ""
echo "  Waiting for ${#ACTIVE[@]} suite(s)..."
echo ""

# ── Collect results in launch order ──────────────────────────────────────────
for i in "${!ACTIVE[@]}"; do
  CANISTER="${ACTIVE[$i]}"
  PID="${PIDS[$i]}"
  START_S=$(cat "$LOG_DIR/$CANISTER.start")

  if wait "$PID"; then
    END_S=$(date +%s)
    ELAPSED=$(( END_S - START_S ))
    echo "   ✅  $CANISTER passed (${ELAPSED}s)"
    PASSED+=("$CANISTER")
  else
    END_S=$(date +%s)
    ELAPSED=$(( END_S - START_S ))
    echo ""
    echo "── [$CANISTER FAILED — full output] ──────────────────────────────────"
    cat "$LOG_DIR/$CANISTER.log"
    echo ""
    ASSERTIONS=$(grep -n " ↳ ❌ " "$LOG_DIR/$CANISTER.log" || true)
    if [ -n "$ASSERTIONS" ]; then
      echo "   ── Assertion failures ─────────────────────────────────────────"
      echo "$ASSERTIONS"
      echo ""
    fi
    echo "   ── Last 20 lines (exit context) ───────────────────────────────"
    tail -20 "$LOG_DIR/$CANISTER.log"
    echo ""
    echo "   ❌  $CANISTER FAILED (${ELAPSED}s)"
    FAILED+=("$CANISTER")
  fi
done

rm -rf "$LOG_DIR"

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL=$(( ${#PASSED[@]} + ${#FAILED[@]} + ${#SKIPPED[@]} ))

echo "============================================"
echo "  Test Coverage Summary"
echo "============================================"
printf "  %-18s  %s\n" "Canister" "Result"
printf "  %-18s  %s\n" "------------------" "--------"

for C in "${PASSED[@]}";  do printf "  %-18s  ✅ Pass\n" "$C"; done
for C in "${FAILED[@]}";  do printf "  %-18s  ❌ FAIL\n" "$C"; done
for C in "${SKIPPED[@]}"; do printf "  %-18s  ⬜ Skip\n" "$C"; done

echo ""
printf "  Total:   %d  |  " "$TOTAL"
printf "Pass: %d  |  " "${#PASSED[@]}"
printf "Fail: %d  |  " "${#FAILED[@]}"
printf "Skip: %d\n"  "${#SKIPPED[@]}"
echo "============================================"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌  ${#FAILED[@]} canister test(s) failed: ${FAILED[*]}"
  exit 1
fi

echo ""
echo "✅  All ${#PASSED[@]} canister test(s) passed!"
exit 0
