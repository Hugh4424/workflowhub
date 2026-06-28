#!/usr/bin/env bash
set -euo pipefail
cd /Users/Hugh/Hugh/Project/workflowhub
fail() { echo "FAIL: $*" >&2; exit 1; }

test -f workflows/spec-clarify/SKILL.md || fail "SKILL.md missing"
grep -q "name: spec-clarify" workflows/spec-clarify/SKILL.md || fail "frontmatter name"
grep -q "task-id" workflows/spec-clarify/SKILL.md || fail "task-id not found"

# 10 维分类逐一断言（任一缺失即 fail，不用计数阈值）
grep -q "Functional Scope" workflows/spec-clarify/SKILL.md || fail "dim1 Functional Scope missing"
grep -q "Domain.*Data Model\|Data Model\|Domain & Data" workflows/spec-clarify/SKILL.md || fail "dim2 Domain & Data Model missing"
grep -q "Interaction.*UX\|UX Flow\|Interaction & UX" workflows/spec-clarify/SKILL.md || fail "dim3 Interaction & UX missing"
grep -q "Non-Functional Quality\|Non-Functional" workflows/spec-clarify/SKILL.md || fail "dim4 Non-Functional Quality missing"
grep -q "Integration.*External\|Integration.*Dependencies" workflows/spec-clarify/SKILL.md || fail "dim5 Integration & Dependencies missing"
grep -q "Edge Cases\|Edge Cases.*Failure" workflows/spec-clarify/SKILL.md || fail "dim6 Edge Cases missing"
grep -q "Constraints.*Tradeoff\|Constraints & Trade" workflows/spec-clarify/SKILL.md || fail "dim7 Constraints & Tradeoffs missing"
grep -q "Terminology.*Consistency\|Terminology" workflows/spec-clarify/SKILL.md || fail "dim8 Terminology & Consistency missing"
grep -q "Completion Signal\|Completion Signals" workflows/spec-clarify/SKILL.md || fail "dim9 Completion Signals missing"
grep -q "Misc.*Placeholder\|Misc / Place" workflows/spec-clarify/SKILL.md || fail "dim10 Misc / Placeholders missing"

# 交互纪律
grep -q "one question at a time\|一次.*一题\|ONE question" workflows/spec-clarify/SKILL.md || fail "no one-at-a-time discipline"
grep -q "maximum.*5\|最多.*5\|不超过.*5" workflows/spec-clarify/SKILL.md || fail "no q-limit <=5"

# 去耦约束声明逐一断言（三类缺一即 fail；与 Phase 1 对齐，不 OR 模糊通过）
grep -q "不调.*check-prerequisites" workflows/spec-clarify/SKILL.md || fail "缺 check-prerequisites 去耦声明"
grep -q "不读.*\.specify" workflows/spec-clarify/SKILL.md || fail "缺 .specify 去耦声明"
grep -q "不执行.*git" workflows/spec-clarify/SKILL.md || fail "缺 git 去耦声明"
grep -q "coverage\|覆盖率" workflows/spec-clarify/SKILL.md || fail "no coverage summary"
grep -q "recordSkeleton" workflows/spec-clarify/SKILL.md || fail "metrics wiring missing"

echo "PASS: all Phase 2 checks passed"
