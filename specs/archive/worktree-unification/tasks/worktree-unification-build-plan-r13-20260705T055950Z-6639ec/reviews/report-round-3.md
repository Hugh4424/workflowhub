# 审查报告 — worktree-unification-build-plan-r13-20260705T055950Z-6639ec (round 3)

- verdict: escalate_to_human
- provenance: single-context

## Summary

Round-12 T008 make-decision coverage and close commit prefix are fixed in tasks.md. Round-12 T005 fake standalone gate is only partially fixed because the real build-spec/build-plan integration is still not gated. Round-12 data-contracts.md Contract 4 finding is unchanged, so round 3 escalates to human.

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:123 | 问题: Round-12 Contract 4 finding remains open. Owner side and coverage still list only make-decision, build-code per phase, and verify-code close, while spec.md FR-WORKTREE-COMMIT-004 defines the commit coverage denominator as make-decision, build-spec, build-plan, build-code, verify-code, and verify-code close. Version notes also still say only make-decision/build-code/verify-code close are covered. | 建议: Update Contract 4 Owner side, Per-stage commit coverage, and Version Compatibility Notes to include build-spec, build-plan, and verify-code stage commit/no-change obligations, matching spec.md FR-WORKTREE-COMMIT-004 and tasks.md T008.
- [blocking] 位置: specs/worktree-unification/tasks.md:74 | 问题: T005 requires build-spec/SKILL.md and build-plan/SKILL.md to use core/worktree-context.mjs, but its gates only check that those files mention target_repo_root/worktree_root and fail-loud. They do not verify either SKILL.md actually calls core/worktree-context.mjs, so the real consumer path can still bypass the tested script. | 建议: Add blocking gates that verify both workflows/build-spec/SKILL.md and workflows/build-plan/SKILL.md explicitly reference/call core/worktree-context.mjs, and keep the missing/full-field script tests as the shared implementation verification.
- [blocking] 位置: specs/worktree-unification/tasks.md:75 | 问题: T005 introduces a new delivery file core/worktree-context.mjs and says it is created in build-code stage, but plan.md source scope still allows only core/task-dir-parser.mjs plus the stage SKILL.md files and narrow build-spec/build-plan exceptions. No Stage 2 task creates core/worktree-context.mjs, so execution ownership and scope are contradictory. | 建议: Either remove the new core script and verify an existing real entry path, or update plan.md scope/source list plus tasks.md dependency ownership so a specific task creates core/worktree-context.mjs before T005 verifies it.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Round-12 Contract 4 finding remains open. Owner side and coverage still list only make-decision, build-code per phase, and verify-code close, while spec.md FR-WORKTREE-COMMIT-004 defines the commit coverage denominator as make-decision, build-spec, build-plan, build-code, verify-code, and verify-code close. Version notes also still say only make-decision/build-code/verify-code close are covered.
- 必须修复：T005 requires build-spec/SKILL.md and build-plan/SKILL.md to use core/worktree-context.mjs, but its gates only check that those files mention target_repo_root/worktree_root and fail-loud. They do not verify either SKILL.md actually calls core/worktree-context.mjs, so the real consumer path can still bypass the tested script.
- 必须修复：T005 introduces a new delivery file core/worktree-context.mjs and says it is created in build-code stage, but plan.md source scope still allows only core/task-dir-parser.mjs plus the stage SKILL.md files and narrow build-spec/build-plan exceptions. No Stage 2 task creates core/worktree-context.mjs, so execution ownership and scope are contradictory.

