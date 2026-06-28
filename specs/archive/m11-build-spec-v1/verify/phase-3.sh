set -euo pipefail
cd /Users/Hugh/Hugh/Project/workflowhub
fail() { echo "FAIL: $*" >&2; exit 1; }

grep -q "spec-specify" workflows/build-spec/SKILL.md || fail "spec-specify not integrated"
grep -q "spec-clarify" workflows/build-spec/SKILL.md || fail "spec-clarify not integrated"
grep -q "constitution-checklist\|F1\|F2\|F3" workflows/build-spec/SKILL.md || fail "constitution check missing"
# baseline 5 指标名逐一断言（任一缺失即 fail；值完整性归 verify-code 阶段）
grep -q "missed_step_rate" workflows/build-spec/SKILL.md || fail "missed_step_rate missing"
grep -q "test_execution_rate" workflows/build-spec/SKILL.md || fail "test_execution_rate missing"
grep -q "review_execution_rate" workflows/build-spec/SKILL.md || fail "review_execution_rate missing"
grep -q "rework_rounds" workflows/build-spec/SKILL.md || fail "rework_rounds missing"
grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count missing"

# 人审检查点：HUMAN_REVIEW_CHECKPOINT marker 必须恰好出现 1 次（多于或少于 1 都 fail）
REVIEW_COUNT=$(grep -c "HUMAN_REVIEW_CHECKPOINT" workflows/build-spec/SKILL.md)
test "$REVIEW_COUNT" -eq 1 || fail "HUMAN_REVIEW_CHECKPOINT count expected 1, got $REVIEW_COUNT"

grep -q "What real threat does this defend against" workflows/build-spec/SKILL.md || fail "F10 gate missing"

STAGE_COUNT=$(grep -c "spec_ref\|requirements" workflows/build-spec/SKILL.md)
test "$STAGE_COUNT" -ge 2 || fail "stage-result contract ($STAGE_COUNT < 2)"

METRICS_COUNT=$(grep -c "recordSkeleton\|updateOwnResult" workflows/build-spec/SKILL.md)
test "$METRICS_COUNT" -ge 2 || fail "metrics wiring ($METRICS_COUNT < 2)"

echo "PASS: all Phase 3 checks passed"
