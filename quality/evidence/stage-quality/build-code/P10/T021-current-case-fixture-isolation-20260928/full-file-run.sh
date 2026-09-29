#!/usr/bin/env bash
set -euo pipefail
proof_dir="$PWD/quality/evidence/stage-quality/build-code/P10/T021-current-case-fixture-isolation-20260928"
backup_dir="$(mktemp -d /tmp/workflowhub-p10-node-modules.XXXXXX)"
restore_node_modules() {
  if [ -L node_modules ] && [ "$(readlink node_modules)" = "/Users/Hugh/Hugh/Project/workflowhub/node_modules" ]; then
    unlink node_modules
  fi
  if [ -d "$backup_dir/original-node-modules" ]; then
    mv "$backup_dir/original-node-modules" node_modules
  fi
  rmdir "$backup_dir" 2>/dev/null || true
}
trap restore_node_modules EXIT HUP INT TERM
{
  printf 'cwd=%s\n' "$PWD"
  printf 'start_utc=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf 'platform=%s\n' "$(uname -srm)"
  printf 'node=%s\n' "$(node --version)"
  printf 'npm=%s\n' "$(npm --version)"
  printf 'npx=%s\n' "$(command -v npx)"
  printf 'original_node_modules=%s\n' "$(stat -f '%HT %N' node_modules)"
  printf 'temporary_node_modules_target=%s\n' '/Users/Hugh/Hugh/Project/workflowhub/node_modules'
} > "$proof_dir/full-file-environment.txt"
printf '%s\n' 'npx vitest run tests/contract/build-code-case-reconciliation.test.mjs' > "$proof_dir/full-file-command.txt"
sha256sum tests/contract/build-code-case-reconciliation.test.mjs workflows/build-code/case-reconciliation.mjs runtime/evidence/freshness.mjs runtime/stage/stage-runner.mjs vitest.config.mjs > "$proof_dir/full-file-source-sha256.before.txt"
mv node_modules "$backup_dir/original-node-modules"
ln -s /Users/Hugh/Hugh/Project/workflowhub/node_modules node_modules
set +e
npx vitest run tests/contract/build-code-case-reconciliation.test.mjs > "$proof_dir/full-file-stdout.txt" 2> "$proof_dir/full-file-stderr.txt"
test_status=$?
set -e
printf '%s\n' "$test_status" > "$proof_dir/full-file.exit"
printf 'end_utc=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> "$proof_dir/full-file-environment.txt"
sha256sum tests/contract/build-code-case-reconciliation.test.mjs workflows/build-code/case-reconciliation.mjs runtime/evidence/freshness.mjs runtime/stage/stage-runner.mjs vitest.config.mjs > "$proof_dir/full-file-source-sha256.after.txt"
sha256sum "$proof_dir/full-file-stdout.txt" "$proof_dir/full-file-stderr.txt" > "$proof_dir/full-file-output-sha256.txt"
printf 'test_exit=%s\n' "$test_status"
exit "$test_status"
