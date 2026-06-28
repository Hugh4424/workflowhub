#!/usr/bin/env bash
set -euo pipefail
cd /Users/Hugh/Hugh/Project/workflowhub
fail() { echo "FAIL: $*" >&2; exit 1; }

test -f workflows/spec-specify/SKILL.md || fail "SKILL.md missing"
grep -q "name: spec-specify" workflows/spec-specify/SKILL.md || fail "frontmatter name"
grep -q "task-id" workflows/spec-specify/SKILL.md || fail "task-id not found"

test -f workflows/spec-specify/templates/spec-template.md || fail "template missing"
CHAPTER_COUNT=$(grep -c "用户场景\|功能需求\|验收\|不做\|影响范围" workflows/spec-specify/templates/spec-template.md)
test "$CHAPTER_COUNT" -ge 4 || fail "template chapters ($CHAPTER_COUNT < 4)"

# 去耦约束声明逐一断言（三类缺一即 fail；不 OR 模糊通过，防止"去耦约束"四字就过关）
grep -q "不执行.*git" workflows/spec-specify/SKILL.md || fail "缺 git 类去耦声明"
grep -q "不读.*\.specify/" workflows/spec-specify/SKILL.md || fail "缺 .specify 类去耦声明"
grep -q "不调用.*speckit" workflows/spec-specify/SKILL.md || fail "缺 speckit 类去耦声明"

grep -q "recordSkeleton" workflows/spec-specify/SKILL.md || fail "metrics wiring missing"
grep -q "checklists/requirements" workflows/spec-specify/SKILL.md || fail "checklist generation not found"

echo "PASS: all Phase 1 checks passed"
