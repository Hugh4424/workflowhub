#!/usr/bin/env bash
set -euo pipefail

source_root=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919
evidence_dir="$source_root/quality/evidence/stage-quality/build-code/P4/T006-indexed-source-negative-20260928"
copy_root=$(mktemp -d /tmp/card04-p4-index.XXXXXX)
printf '%s\n' "$copy_root" > "$evidence_dir/isolated-copy-path.txt"
rsync -a --exclude=.git --exclude=quality --exclude=node_modules --exclude=specs/archive "$source_root/" "$copy_root/"
ln -s /Users/Hugh/Hugh/Project/workflowhub/node_modules "$copy_root/node_modules"

cmp "$evidence_dir/frozen-test.mjs" "$copy_root/tests/contract/post-acceptance-chain-source-index.test.mjs"
cmp "$evidence_dir/stage-runner-before.mjs" "$copy_root/runtime/stage/stage-runner.mjs"

python3 - "$copy_root/runtime/stage/stage-runner.mjs" <<'PY'
from pathlib import Path
import sys

source = Path(sys.argv[1])
before = source.read_text()
needle = '      source_ids: sourceIds,\n'
assert before.count(needle) == 1
source.write_text(before.replace(needle, '      source_ids: acId === "AC-29" ? [] : sourceIds,\n', 1))
PY
cp "$copy_root/runtime/stage/stage-runner.mjs" "$evidence_dir/stage-runner-mutated.mjs"
cmp "$evidence_dir/frozen-test.mjs" "$copy_root/tests/contract/post-acceptance-chain-source-index.test.mjs"

printf '%s\n' 'node node_modules/vitest/vitest.mjs run tests/contract/post-acceptance-chain-source-index.test.mjs --poolOptions.forks.singleFork --no-fileParallelism' > "$evidence_dir/command.txt"
(
  cd "$copy_root"
  set +e
  node node_modules/vitest/vitest.mjs run tests/contract/post-acceptance-chain-source-index.test.mjs --poolOptions.forks.singleFork --no-fileParallelism > "$evidence_dir/red-raw.txt" 2>&1
  printf '%s\n' "$?" > "$evidence_dir/red-exit.txt"
)

cp "$evidence_dir/stage-runner-before.mjs" "$copy_root/runtime/stage/stage-runner.mjs"
cmp "$evidence_dir/stage-runner-before.mjs" "$copy_root/runtime/stage/stage-runner.mjs"
cmp "$evidence_dir/frozen-test.mjs" "$copy_root/tests/contract/post-acceptance-chain-source-index.test.mjs"
(
  cd "$copy_root"
  set +e
  node node_modules/vitest/vitest.mjs run tests/contract/post-acceptance-chain-source-index.test.mjs --poolOptions.forks.singleFork --no-fileParallelism > "$evidence_dir/green-isolated-raw.txt" 2>&1
  printf '%s\n' "$?" > "$evidence_dir/green-isolated-exit.txt"
)

sha256sum "$evidence_dir/frozen-test.mjs" "$evidence_dir/stage-runner-before.mjs" "$evidence_dir/stage-runner-mutated.mjs" "$copy_root/tests/contract/post-acceptance-chain-source-index.test.mjs" "$copy_root/runtime/stage/stage-runner.mjs" > "$evidence_dir/isolated-hashes.txt"
