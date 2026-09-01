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
npx vitest run "${tests[@]}" --poolOptions.forks.singleFork --no-fileParallelism
status=$?
node tests/fixtures/workflow-evolution/check-red-authenticity.mjs "$suite" "${GATE_PHASE:-red}" "$status"
