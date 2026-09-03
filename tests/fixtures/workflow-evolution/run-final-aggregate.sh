#!/usr/bin/env bash
set -euo pipefail
quality_root="${WORKFLOWHUB_TASK_ROOT:-$(pwd)}"
mkdir -p "$quality_root/quality/tests/m16-final-aggregate"
aggregate_path="$quality_root/quality/tests/m16-final-aggregate.json"
browser_status=0
browser_qa_script="${WORKFLOWHUB_BROWSER_QA_SCRIPT:-tests/fixtures/workflow-evolution/run-browser-qa.sh}"
if bash "$browser_qa_script"; then browser_status=0; else browser_status=$?; fi
if [[ "$browser_status" -ne 0 ]]; then
  node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" "$browser_status" pending pending pending null
  exit "$browser_status"
fi
manifest_path="${WORKFLOWHUB_BROWSER_MANIFEST:-$quality_root/quality/evidence/browser-qa/m16-monitor/manifest.json}"
export WORKFLOWHUB_BROWSER_MANIFEST="$manifest_path"
review_staging_path="${WORKFLOWHUB_REVIEW_PATH:-$quality_root/quality/tests/m16-final-aggregate/review.json}"
case "$review_staging_path" in
  "$quality_root"/*) ;;
  *) echo "review output must stay inside the task quality root" >&2; exit 32 ;;
esac
review_chain_script="${WORKFLOWHUB_REVIEW_CHAIN_SCRIPT:-tests/fixtures/workflow-evolution/run-final-review-chain.mjs}"
review_status=0
if node "$review_chain_script" "specs/archive/workflowhub-m16-evolution-20260831/spec.md" "$review_staging_path" >/dev/null; then review_status=0; else review_status=$?; fi
if [[ "$review_status" -eq 31 || "$review_status" -eq 32 ]]; then exit "$review_status"; fi
if [[ "$review_status" -ne 0 ]]; then exit 32; fi
review_sha256="$(node -e 'const { createHash } = require("node:crypto"); const { readFileSync } = require("node:fs"); process.stdout.write(createHash("sha256").update(readFileSync(process.argv[1])).digest("hex"));' "$review_staging_path")"
review_ref="quality/reviews/${review_sha256}.json"
review_path="$quality_root/$review_ref"
mkdir -p "$(dirname "$review_path")"
if [[ "$review_staging_path" != "$review_path" ]]; then
  if [[ -e "$review_path" ]]; then
    if ! cmp -s "$review_staging_path" "$review_path"; then
      echo "content-addressed review receipt already exists with different bytes" >&2
      exit 32
    fi
    rm -f "$review_staging_path"
  else
    if ! ln "$review_staging_path" "$review_path" 2>/dev/null; then
      if [[ ! -e "$review_path" ]] || ! cmp -s "$review_staging_path" "$review_path"; then
        echo "content-addressed review receipt publication conflicted" >&2
        exit 32
      fi
    fi
    rm -f "$review_staging_path"
  fi
fi
if [[ -n "${WORKFLOWHUB_REVIEW_REF:-}" && "${WORKFLOWHUB_REVIEW_REF}" != "$review_ref" ]]; then
  echo "review_ref must bind the content-addressed review output" >&2
  exit 32
fi
review_validation_status=0
validator_args=("$review_path")
if [[ -n "${WORKFLOWHUB_WH_REVIEW_REQUEST:-}" && -f "$WORKFLOWHUB_WH_REVIEW_REQUEST" ]]; then
  validator_args+=("$WORKFLOWHUB_WH_REVIEW_REQUEST")
fi
if node tests/fixtures/workflow-evolution/validate-final-review-chain.mjs "${validator_args[@]}" >/dev/null; then review_validation_status=0; else review_validation_status=$?; fi
if [[ "$review_validation_status" -ne 0 ]]; then exit 32; fi
focused_status=0
if npx vitest run tests/contract/workflow-evolution-candidates.test.mjs tests/contract/workflow-evolution-ledgers.test.mjs tests/contract/generate-iteration-brief.test.mjs tests/contract/check-skill-updates.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/workflow-evolution-governance.test.mjs tests/e2e/workflow-evolution-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism; then focused_status=0; else focused_status=$?; fi
if [[ "$focused_status" -ne 0 ]]; then node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" 0 "$focused_status" pending pending "$review_ref" "$review_sha256"; exit "$focused_status"; fi
repository_test_status=0
if npm test >/tmp/workflowhub-m16-npm-test.log 2>&1; then repository_test_status=0; else repository_test_status=$?; fi
if [[ "$repository_test_status" -ne 0 ]]; then node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" 0 0 "$repository_test_status" pending "$review_ref" "$review_sha256"; exit "$repository_test_status"; fi
repository_check_status=0
if npm run check >/tmp/workflowhub-m16-npm-check.log 2>&1; then repository_check_status=0; else repository_check_status=$?; fi
node tests/fixtures/workflow-evolution/atomic-write-final-aggregate.mjs "$aggregate_path" 0 0 0 "$repository_check_status" "$review_ref" "$review_sha256"
exit "$repository_check_status"
