#!/usr/bin/env bash
# P11 坏输入实验：每条迁移断言一个故障，一次只改一处。
# 故障全部在仓外临时副本做；仓内测试与材料字节不动。
# 用法：bash runbook.sh   （在任意目录执行；脚本自定位证据目录）
set -u

REPO=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028
EVID="$(cd "$(dirname "$0")" && pwd)"
TMP=/tmp/p11-badinput-20261031
KEEP=/tmp/p11-badinput-20261031-pristine
SPEC=skills/spec-specify/templates/spec-template.md
PHASE=skills/spec-plan/templates/phase-template.md
READER=runtime/stage/stage-content-contracts.mjs

build() {
  rm -rf "$TMP" "$KEEP"
  mkdir -p "$TMP/tests/contract" "$TMP/specs/archive" "$KEEP"
  ( cd "$REPO" && cp -R runtime skills workflows tools contracts metrics core scripts \
      "$TMP/" && cp package.json vitest.config.mjs "$TMP/" )
  cp "$REPO/tests/contract/acceptance-plan.test.mjs" \
     "$REPO/tests/contract/n11-plan-quality.test.mjs" "$TMP/tests/contract/"
  cp -R "$REPO/specs/archive/workflowhub-build-code-efficiency-verify-merge-20261026" \
     "$TMP/specs/archive/"
  ln -s "$REPO/node_modules" "$TMP/node_modules"
}

# run <矿名> <工作目录> <vitest 参数...>；stdout 与退出码分别落原件
run() {
  local name=$1 dir=$2; shift 2
  ( cd "$dir" && node node_modules/vitest/vitest.mjs run "$@" \
      > "$EVID/$name.stdout.txt" 2>&1; echo $? > "$EVID/$name.exit" )
}

keep() { cp "$TMP/$1" "$KEEP/$(basename "$1").orig"; }
restore() { cp "$KEEP/$(basename "$1").orig" "$TMP/$1"; }
patch() { diff -u "$KEEP/$(basename "$1").orig" "$TMP/$1" > "$EVID/$2.patch"; }

build
# 副本忠实性：未改字节应与仓内同结果
run 00-mirror-baseline "$TMP" tests/contract/acceptance-plan.test.mjs tests/contract/n11-plan-quality.test.mjs

# ---- M1：spec 模板七 label 必须被读成字段 ----
keep "$SPEC"
perl -0pi -e 's/；成本类别=测试标准中本条测试面所需的命令级成本//' "$TMP/$SPEC"
patch "$SPEC" 01-spec-template
run 01-M1-filtered "$TMP" tests/contract/acceptance-plan.test.mjs \
  -t "real templates and planning steps carry seven fields"
run 01-M1-full "$TMP" tests/contract/acceptance-plan.test.mjs
restore "$SPEC"

# ---- M2：phase 模板完整作者例必被真实 reader 无错消费 ----
keep "$PHASE"
perl -0pi -e 's/^- \*\*RED\/GREEN gate_cmd\*\*：[^\n]*\n//m' "$TMP/$PHASE"
patch "$PHASE" 02-phase-template-missing-duty
run 02-M2-filtered "$TMP" tests/contract/acceptance-plan.test.mjs \
  -t "real templates and planning steps carry seven fields"
run 02-M2-full "$TMP" tests/contract/acceptance-plan.test.mjs
restore "$PHASE"

# ---- M2b：同一读法下的缺项半边必报缺 ----
keep "$PHASE"
perl -0pi -e 's/^- \*\*Test tier \/ skill\*\*：.*$/- **Test tier \/ skill**：TODO/m' "$TMP/$PHASE"
patch "$PHASE" 03-phase-template-placeholder
run 03-M2b-filtered "$TMP" tests/contract/acceptance-plan.test.mjs \
  -t "real templates and planning steps carry seven fields"
run 03-M2b-full "$TMP" tests/contract/acceptance-plan.test.mjs
restore "$PHASE"

# ---- M3：缺 RED/GREEN gate_cmd 必被具名为该字段 ----
# 读取器只剩这一缺陷：该职责的缺项不再进 field_gaps。
keep "$READER"
perl -0pi -e 's/if \(missingTaskField\(value\)\) \{/if (missingTaskField(value) \&\& field !== "RED\/GREEN gate_cmd") {/' "$TMP/$READER"
patch "$READER" 04-reader-drops-gate-cmd
run 04-M3-filtered "$TMP" tests/contract/n11-plan-quality.test.mjs \
  -t "rejects missing RED/GREEN gate_cmd"
run 04-M3-full "$TMP" tests/contract/n11-plan-quality.test.mjs
restore "$READER"

# ---- M4：缺 expected_exit 必被具名为该字段 ----
keep "$READER"
perl -0pi -e 's/if \(missingTaskField\(value\)\) \{/if (missingTaskField(value) \&\& field !== "expected_exit") {/' "$TMP/$READER"
patch "$READER" 05-reader-drops-expected-exit
run 05-M4-filtered "$TMP" tests/contract/n11-plan-quality.test.mjs \
  -t "rejects missing expected_exit"
run 05-M4-full "$TMP" tests/contract/n11-plan-quality.test.mjs
restore "$READER"

# ---- 真实交付：仓内当前字节原样 ----
run 06-real-delivery "$REPO" tests/contract/acceptance-plan.test.mjs tests/contract/n11-plan-quality.test.mjs
