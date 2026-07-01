#!/bin/bash
# Phase-4 AC scan for m13c-build-plan-deepening
set -e
cd /Users/Hugh/Hugh/Project/workflowhub-m13c-build-code

echo "=== AC Scan: m13c-build-plan-deepening (phase-4) ==="
echo "timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "worktree: $(pwd)"
echo "git HEAD: $(git rev-parse HEAD 2>/dev/null || echo unknown)"
echo ""

echo "--- AC-01: skills/spec-research/SKILL.md exists with research.md output ---"
test -f skills/spec-research/SKILL.md && echo "PASS: file exists" || echo "FAIL: file missing"
grep -n "research.md" skills/spec-research/SKILL.md | head -10 || echo "FAIL: no research.md mention"
echo ""

echo "--- AC-02: workflows/build-plan/SKILL.md calls spec-research ---"
grep -n "spec-research" workflows/build-plan/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-03: workflows/build-plan/SKILL.md has data-contracts step ---"
grep -n "data-contracts" workflows/build-plan/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-04: data-contracts step before tasks.md decomposition ---"
grep -n "Step 1.5: Produce data-contracts\|Step 2: spec-plan\|Step 3: spec-tasks" workflows/build-plan/SKILL.md || echo "FAIL"
echo ""

echo "--- AC-05: simplicity-guard called in build-plan ---"
grep -n "simplicity-guard" workflows/build-plan/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-06: minimal-path field in stage-result ---"
grep -n "minimal-path\|minimal_path" workflows/build-plan/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-07: plan-reviewer called (no new skill file) ---"
grep -n "plan-reviewer" workflows/build-plan/SKILL.md | head -10 || echo "FAIL"
test -d skills/spec-plan-review && echo "FAIL: new spec-plan-review skill exists" || echo "PASS: no new spec-plan-review skill"
echo ""

echo "--- AC-08: plan-eng-review.md output path ---"
grep -n "plan-eng-review.md" workflows/build-plan/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-09: plan-reviewer failure non-blocking ---"
grep -n "plan-reviewer\|escalate to human\|non-blocking" workflows/build-plan/SKILL.md | grep -i "plan-reviewer\|escalate" | head -10 || echo "FAIL"
echo ""

echo "--- AC-10: ambiguity_items[] in spec-analyze ---"
grep -n "ambiguity_items" skills/spec-analyze/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-11: escalation_path in spec-analyze ---"
grep -n "escalation_path" skills/spec-analyze/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-12: no-placeholder rule in spec-tasks ---"
grep -n "no-placeholder\|TODO\|TBD\|placeholder" skills/spec-tasks/SKILL.md | head -15 || echo "FAIL"
echo ""

echo "--- AC-13: blocking_item semantics in spec-tasks ---"
grep -n "blocking_item" skills/spec-tasks/SKILL.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-14: STOP/Knowledge + upstream_delta in spec-tasks ---"
grep -n "STOP\|Knowledge\|upstream_delta" skills/spec-tasks/SKILL.md | head -20 || echo "FAIL"
echo ""

echo "--- AC-15: reuse-registry.md upstream_delta column + spec-research row ---"
grep -n "upstream_delta\|spec-research" reuse-registry.md | head -10 || echo "FAIL"
echo ""

echo "--- AC-16: task_dir parser real consumer calls (parseTaskDir grep hit) ---"
grep -rn "parseTaskDir\|task-dir-parser" skills/spec-research/SKILL.md workflows/build-plan/SKILL.md skills/spec-analyze/SKILL.md skills/spec-tasks/SKILL.md || echo "FAIL"
echo ""

echo "--- AC-17: task_dir parser test file exists ---"
test -f core/task-dir-parser.test.mjs && echo "PASS: core/task-dir-parser.test.mjs exists" || echo "FAIL"
test -f core/task-dir-parser.mjs && echo "PASS: core/task-dir-parser.mjs exists" || echo "FAIL"
echo ""

echo "--- AC-18: independent 3rd-review artifacts exist ---"
test -f specs/m13c-build-plan-deepening/3rd-review-report.md && echo "PASS: 3rd-review-report.md exists" || echo "FAIL"
find specs/m13c-build-plan-deepening/3rd-review-work -type f 2>/dev/null | head -5 || echo "FAIL"
echo ""

echo "--- AC-19: simplicity-guard exists + build-spec references it ---"
test -f skills/simplicity-guard/SKILL.md && echo "PASS: skills/simplicity-guard/SKILL.md exists" || echo "FAIL"
grep -n "simplicity-guard" workflows/build-spec/SKILL.md | head -5 || echo "FAIL"
echo ""

echo "=== End AC Scan ==="
