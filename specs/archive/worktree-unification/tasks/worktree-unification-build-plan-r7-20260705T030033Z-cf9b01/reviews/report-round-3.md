# 审查报告 — worktree-unification-build-plan-r7-20260705T030033Z-cf9b01 (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

speckit-analyze, plan-eng-review, and review were applied in read-only skill-file fallback mode against spec.md, plan.md, tasks.md, data-contracts.md, constitution, and prior round findings. B3, B4, and B5 are closed in data-contracts.md. B6 and B8 remain open. Additional blocking gaps remain in fake gate commands and FR traceability for task-id normalization / commit traceability.

## Findings

- [blocking] 位置: specs/worktree-unification/plan.md:215 | 问题: Prior B8 remains open. plan.md still says build-spec/SKILL.md may be edited if target_repo_root/worktree_root read logic is missing, while line 75 marks the same file as read-only and forbidden. line 217 and line 256 repeat the same write permission. Executing this plan can still modify a forbidden file. | 建议: Make build-spec/SKILL.md strictly read-only everywhere. Remove the '补充最小必要条文（一行）' permission from plan.md lines 215, 217, and 256, matching tasks.md T005.
- [blocking] 位置: specs/worktree-unification/tasks.md:17 | 问题: Prior B6 remains open. T001 '两者缺失 fail-loud' gate pipes node stderr/stdout into grep, so the node process exit code is swallowed. The command proves only that some output existed, not that parseTaskDir failed non-zero as required. | 建议: Rewrite the gate to capture node exit code and stderr separately, then assert both: node exit code is non-zero and stderr is non-empty. Example shape: run node with `2>$_ERR`, save `_node_rc=$?`, then `test $_node_rc -ne 0 && test -s "$_ERR"`.
- [blocking] 位置: specs/worktree-unification/tasks.md:39 | 问题: T003 gate_cmd still uses raw grep with expected exit 1 as the passing condition. That is not a reliable machine gate under the contract because pass should return exit 0 and negative checks must be explicitly inverted. | 建议: Change the fallback-deletion gate to `! grep -Eq "自动创建 worktree|auto.*create.*worktree|worktree add" workflows/build-code/SKILL.md` and document exit 0 as the pass result.
- [blocking] 位置: specs/worktree-unification/tasks.md:66 | 问题: Prior B6/T006 remains open. T006 has no dedicated `gate_cmd` block, and its first check still uses `git show ... | grep -E ...` with '应无输出'. No match makes grep return 1, so the passing condition is still a non-zero command unless inverted. | 建议: Add a real `gate_cmd` block for T006. Invert the forbidden-file diff check with `! git show HEAD -- specs/worktree-unification/ | grep -Eq ...`, and keep stage-result/evidence checks as separate exit-0 gates.
- [blocking] 位置: specs/worktree-unification/tasks.md:29 | 问题: FR-WORKTREE-MAKEDECISION-002 requires task-id two-step normalization before validation, but T002 only says branch naming uses `workflowhub/{task-id}` and task-id matches the regex. The conversion rule from spec.md is not landed in any task, so inputs like `Worktree Unification` may fail instead of being normalized. | 建议: Extend T002 to implement the full normalization contract: lowercase, replace non-alphanumeric with hyphen, collapse repeated hyphens, trim edge hyphens, then validate `^[a-z]+(-[a-z]+){1,2}$` and fail-loud if still invalid.
- [blocking] 位置: specs/worktree-unification/tasks.md:37 | 问题: FR-WORKTREE-COMMIT-004 and Business Impact Scope require per-stage/per-phase commit traceability, especially for build-code phases, but no task implements or verifies build-code per-phase commit trigger behavior. Existing commit gates only check the latest git log message after individual task edits. | 建议: Add an explicit task or extend T003 to update/verify build-code per-phase commit behavior: each file-changing phase must produce `workflowhub(build-code/<phase-name>): ...`, and no-change phases must record a no-change reason in stage-result or journal.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Prior B8 remains open. plan.md still says build-spec/SKILL.md may be edited if target_repo_root/worktree_root read logic is missing, while line 75 marks the same file as read-only and forbidden. line 217 and line 256 repeat the same write permission. Executing this plan can still modify a forbidden file.
- 必须修复：Prior B6 remains open. T001 '两者缺失 fail-loud' gate pipes node stderr/stdout into grep, so the node process exit code is swallowed. The command proves only that some output existed, not that parseTaskDir failed non-zero as required.
- 必须修复：T003 gate_cmd still uses raw grep with expected exit 1 as the passing condition. That is not a reliable machine gate under the contract because pass should return exit 0 and negative checks must be explicitly inverted.
- 必须修复：Prior B6/T006 remains open. T006 has no dedicated `gate_cmd` block, and its first check still uses `git show ... | grep -E ...` with '应无输出'. No match makes grep return 1, so the passing condition is still a non-zero command unless inverted.
- 必须修复：FR-WORKTREE-MAKEDECISION-002 requires task-id two-step normalization before validation, but T002 only says branch naming uses `workflowhub/{task-id}` and task-id matches the regex. The conversion rule from spec.md is not landed in any task, so inputs like `Worktree Unification` may fail instead of being normalized.
- 必须修复：FR-WORKTREE-COMMIT-004 and Business Impact Scope require per-stage/per-phase commit traceability, especially for build-code phases, but no task implements or verifies build-code per-phase commit trigger behavior. Existing commit gates only check the latest git log message after individual task edits.

