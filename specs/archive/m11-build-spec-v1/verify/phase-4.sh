set -euo pipefail
cd /Users/Hugh/Hugh/Project/workflowhub
fail() { echo "FAIL: $*" >&2; exit 1; }

echo "=== 文件存在性 ==="
test -f workflows/spec-specify/SKILL.md || fail "spec-specify SKILL.md missing"
test -f workflows/spec-specify/templates/spec-template.md || fail "spec-template.md missing"
test -f workflows/spec-clarify/SKILL.md || fail "spec-clarify SKILL.md missing"

echo "=== config registry ==="
grep -q "spec-specify" config/workflowhub.yaml || fail "spec-specify not in registry"
grep -q "spec-clarify" config/workflowhub.yaml || fail "spec-clarify not in registry"

echo "=== reuse-registry 格式校验（skill 名锚定 + 类别列 \$3 + 来源列 \$4） ==="
SPEC_LINE=$(grep "^| spec-specify " reuse-registry.md) || fail "spec-specify row not found in reuse-registry"
SPEC_CAT=$(echo "$SPEC_LINE" | awk -F'|' '{print $3}' | xargs)
SPEC_SRC=$(echo "$SPEC_LINE" | awk -F'|' '{print $4}' | xargs)
test "$SPEC_CAT" = "外部改造适配" || fail "spec-specify category expected '外部改造适配', got '$SPEC_CAT'"
test -n "$SPEC_SRC" || fail "spec-specify source path empty"

CLAR_LINE=$(grep "^| spec-clarify " reuse-registry.md) || fail "spec-clarify row not found in reuse-registry"
CLAR_CAT=$(echo "$CLAR_LINE" | awk -F'|' '{print $3}' | xargs)
CLAR_SRC=$(echo "$CLAR_LINE" | awk -F'|' '{print $4}' | xargs)
test "$CLAR_CAT" = "外部改造适配" || fail "spec-clarify category expected '外部改造适配', got '$CLAR_CAT'"
test -n "$CLAR_SRC" || fail "spec-clarify source path empty"

echo "=== AC6: frontmatter name 不得用 speckit-* 前缀（允许注释中来源注明） ==="
grep -q "^name: speckit-" workflows/spec-specify/SKILL.md && fail "AC6 违: spec-specify frontmatter name 含 speckit-* 前缀" || true
grep -q "^name: speckit-" workflows/spec-clarify/SKILL.md && fail "AC6 违: spec-clarify frontmatter name 含 speckit-* 前缀" || true

echo "=== 路径引用完整 ==="
grep -q "workflows/spec-specify/SKILL.md" workflows/build-spec/SKILL.md || fail "spec-specify path ref missing"
grep -q "workflows/spec-clarify/SKILL.md" workflows/build-spec/SKILL.md || fail "spec-clarify path ref missing"

echo "=== 三 SKILL.md 均含 collector 指令 ==="
for f in workflows/spec-specify/SKILL.md workflows/spec-clarify/SKILL.md workflows/build-spec/SKILL.md; do
  grep -q "recordSkeleton" "$f" || fail "$f missing recordSkeleton"
done

echo "=== M6 骨架不回归 ==="
grep -q "What real threat does this defend against" workflows/build-spec/SKILL.md || fail "F10 gate missing"
grep -q "spec_ref" workflows/build-spec/SKILL.md || fail "spec_ref missing"
grep -q "requirements" workflows/build-spec/SKILL.md || fail "requirements missing"

echo "=== 宪法/baseline 步骤存在性检查（不验完整性，完整性归 verify-code） ==="
grep -q "constitution-checklist" workflows/build-spec/SKILL.md || fail "constitution-checklist ref missing"
grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count naming missing"

echo "PASS: all Phase 4 checks passed"
