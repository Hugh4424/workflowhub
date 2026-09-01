#!/usr/bin/env bash
set -u
suite="${1:-}"
if [[ "$suite" != "pool-tax" && "$suite" != "ledger-brief" && "$suite" != "monitor" && "$suite" != "governance" ]]; then
  exit 24
fi
case "$suite" in
  pool-tax) tests=(tests/contract/workflow-evolution-candidates.test.mjs) ;;
  ledger-brief) tests=(tests/contract/workflow-evolution-ledgers.test.mjs tests/contract/generate-iteration-brief.test.mjs tests/contract/check-skill-updates.test.mjs) ;;
  monitor) tests=(tests/contract/build-reflection-page.test.mjs) ;;
  governance) tests=(tests/contract/workflow-evolution-governance.test.mjs tests/e2e/workflow-evolution-current.test.mjs tests/contract/public-behavior-baseline.test.mjs) ;;
esac
phase="${GATE_PHASE:-red}"
baseline="tests/fixtures/workflow-evolution/red-baseline.v1.json"
baseline_output="quality/tests/m16-${suite}-baseline-output.txt"
suite_output="quality/tests/m16-${suite}-suite-output.txt"
mkdir -p "$(dirname "$baseline_output")"
npx vitest run tests/contract/stage-reflection-e2e-constructed.test.mjs --poolOptions.forks.singleFork --no-fileParallelism >"$baseline_output" 2>&1
baseline_status=$?
npx vitest run "${tests[@]}" --poolOptions.forks.singleFork --no-fileParallelism >"$suite_output" 2>&1
status=$?
if [[ "$suite" == "pool-tax" && "$phase" != "red" ]]; then
  npx vitest run tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-reflection-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism >>"$suite_output" 2>&1 || status=$?
fi
cat "$suite_output"
baseline_hash="$(shasum -a 256 "$baseline" | awk '{print $1}')"
output_hash="$(shasum -a 256 "$suite_output" | awk '{print $1}')"
node tests/fixtures/workflow-evolution/check-red-authenticity.mjs "$suite" "$phase" "$status" "$baseline_status" "$baseline_hash" "$output_hash"
