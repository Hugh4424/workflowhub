#!/usr/bin/env bash
set -euo pipefail
quality_root="${WORKFLOWHUB_TASK_ROOT:-$(pwd)}"
mkdir -p "$quality_root/quality/tests/m16-final-aggregate"
aggregate_path="$quality_root/quality/tests/m16-final-aggregate.json"
browser_status=0
if bash tests/fixtures/workflow-evolution/run-browser-qa.sh; then browser_status=0; else browser_status=$?; fi
if [[ "$browser_status" -ne 0 ]]; then
  node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" "$browser_status" pending pending pending null
  exit "$browser_status"
fi
manifest_path="${WORKFLOWHUB_BROWSER_MANIFEST:-$quality_root/quality/evidence/browser-qa/m16-monitor/manifest.json}"
export WORKFLOWHUB_BROWSER_MANIFEST="$manifest_path"
review_path="$quality_root/quality/tests/m16-final-aggregate/review.json"
node tests/fixtures/workflow-evolution/run-final-review-chain.mjs "specs/workflowhub-m16-evolution-20260831/spec.md" "$review_path" >/dev/null
node tests/fixtures/workflow-evolution/validate-final-review-chain.mjs "$review_path" >/dev/null
focused_status=0
if npx vitest run tests/contract/workflow-evolution-candidates.test.mjs tests/contract/workflow-evolution-ledgers.test.mjs tests/contract/generate-iteration-brief.test.mjs tests/contract/check-skill-updates.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/workflow-evolution-governance.test.mjs tests/e2e/workflow-evolution-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism; then focused_status=0; else focused_status=$?; fi
if [[ "$focused_status" -ne 0 ]]; then node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" 0 "$focused_status" pending pending "$review_path"; exit "$focused_status"; fi
repository_test_status=0
if npm test >/tmp/workflowhub-m16-npm-test.log 2>&1; then repository_test_status=0; else repository_test_status=$?; fi
if [[ "$repository_test_status" -ne 0 ]]; then node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" 0 0 "$repository_test_status" pending "$review_path"; exit "$repository_test_status"; fi
repository_check_status=0
if npm run check >/tmp/workflowhub-m16-npm-check.log 2>&1; then repository_check_status=0; else repository_check_status=$?; fi
node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" 0 0 0 "$repository_check_status" "$review_path"
exit "$repository_check_status"
