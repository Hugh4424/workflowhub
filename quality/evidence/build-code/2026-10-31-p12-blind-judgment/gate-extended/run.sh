#!/bin/sh
# 用同一份扩展门禁重跑两份交付；每次输出连同退出码一起落到 run-<标签>.txt。
# 运行前：本目录下 A/、B/ 各含 src/stage.mjs（交付原字节）、fixtures/（交付原字节）、gate/stage.test.mjs（本扩展门禁）。
set -u
here=$(cd "$(dirname "$0")" && pwd)
for label in A B; do
  out="$here/run-$label.txt"
  (
    cd "$here/$label" || exit 99
    node --test gate/stage.test.mjs
    echo "exit_code=$?"
  ) > "$out" 2>&1
  tail -n 1 "$out"
done
echo "written: run-A.txt run-B.txt"
