#!/bin/sh
# One reproducible walkthrough pass. Records real exit codes and raw outputs,
# then assembles the ledger. No output is edited by hand.
#
# W2 uses the checker from the main repo (/Users/Hugh/Hugh/Project/workflowhub),
# because the same-named file inside this worktree is stale (12 KB vs 17 KB) and
# still only recognises WPn package headings. The worktree copy is not used.
set -u
E=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-31-p6-walkthrough
W=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028
T=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c07-real-page-verification-20261028
CHECKER=/Users/Hugh/Hugh/Project/workflowhub/tools/cli/check-stage-steps.mjs
MATERIAL=$W/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028
cd "$W" || exit 9
echo "started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

node "$E/w1-entry-route-replay.mjs" > "$E/01-entry-route-replay.json" 2>&1; c1=$?
node "$CHECKER" --stage=make-decision --task-path="$T" --material-root="$MATERIAL" --repo-root="$W" > "$E/02-steps-ledger.txt" 2>&1; c2=$?
node "$CHECKER" --stage=make-decision --task-path="$T" --material-root="$MATERIAL" --repo-root="$W" --json > "$E/02-steps-ledger.json" 2>&1; c2j=$?
node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs > "$E/03-contract-test.txt" 2>&1; c3=$?
node "$E/w4-runlist-check.mjs" > "$E/04-runlist-15x15.json" 2>&1; c4=$?

printf '{"w1":%s,"w2":%s,"w2j":%s,"w3":%s,"w4":%s}\n' "$c1" "$c2" "$c2j" "$c3" "$c4" > "$E/exit-codes.json"
cat "$E/exit-codes.json"
node "$E/w5-ledger.mjs"
echo "finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
