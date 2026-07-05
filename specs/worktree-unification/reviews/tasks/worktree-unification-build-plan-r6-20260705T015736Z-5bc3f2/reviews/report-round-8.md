# 审查报告 — worktree-unification-build-plan-r6-20260705T015736Z-5bc3f2 (round 8)

- verdict: revise_required
- provenance: single-context

## Summary

Round 8 delta review: B1 appears fixed for build-plan/SKILL.md read-only scope. B3, B4, and B5 remain open because data-contracts.md is unchanged and still carries the old worktree path, old task_dir model, and hardcoded fallback. B6 is only partially addressed: tasks now contain gate_cmd text, but T001/T006 are not reliable runnable gates. B8 is partially addressed for T001/T005 commit/no-change gates. Because repeated prior blocking issues remain, verdict is revise_required.

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: Prior B3 remains open: Contract 1 still says worktree.json lives at `{worktree_root}/worktree.json`, while the review contract/prior finding requires the authoritative path under `{{task_tracking_root}}/tasks/{task-id}/worktree.json`. The delta did not modify data-contracts.md, yet cross-artifact-analysis.md claims blocking=0. | 建议: Update Contract 1 File path to the task_tracking_root task directory path and align owner/consumer wording with spec.md/plan.md before claiming B3 closed.
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: Prior B4 remains open: Contract 2 still describes consumers拼接 `{task_dir}/{task-id}/`, which omits the required `/tasks/{task-id}` segment and conflicts with plan.md/tasks.md paths using `${WORKFLOWHUB_TASK_DIR}/tasks/{task-id}`. Executing from this contract can write/read the wrong directory. | 建议: Change Contract 2 so parser returns `task_tracking_root`, and every consumer path is `{{task_tracking_root}}/tasks/{task-id}/...`; remove the old `{task_dir}/{task-id}` model.
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: Prior B5 remains open: Contract 2 still allows fallback `~/Knowledge/workflowhub/`, directly contradicting FR-WORKTREE-ENVVAR-003 and tasks.md T001, which require fail-loud when env var and yaml are both missing. This reintroduces the hardcoded path the plan is meant to delete. | 建议: Remove the hardcoded fallback from data-contracts.md and state the only valid priority is `WORKFLOWHUB_TASK_DIR` → yaml `task_dir` → fail-loud.
- [blocking] 位置: specs/worktree-unification/tasks.md:15 | 问题: T001 gate_cmd is not executable as written: `WORKFLOWHUB_TASK_DIR=/tmp/testdir ...` expects success while T001 also requires nonexistent paths to fail-loud, but the gate never creates `/tmp/testdir`. The “两者缺失 fail-loud” command also does not isolate/remove yaml config, so it can pass or fail depending on local config state instead of the requirement. | 建议: Make gate_cmd self-contained: create a temp directory for the env-var success case, create a temp file for non-directory failure, run in an isolated temp config/cwd for yaml-missing behavior, and assert exact exit codes/stderr.
- [blocking] 位置: specs/worktree-unification/tasks.md:70 | 问题: T006 still lacks a reliable machine gate. The first check uses `git show ... | grep -E ...` and says “应无输出”; no match means grep exits 1, so the passing condition is a non-zero exit unless explicitly inverted. The same task also contains literal `{task-id}` placeholders inside shell commands, so the commands are not runnable as written. | 建议: Add an explicit `gate_cmd` block for T006 with runnable variables, e.g. `TASK_ID=worktree-unification`, and invert negative grep checks with `! ...` or a Node script so pass returns exit 0. Avoid literal `{task-id}` in executable commands.
- [blocking] 位置: specs/worktree-unification/plan.md:52 | 问题: Forbidden-file governance is inconsistent: plan.md lists `workflows/build-spec/SKILL.md` under “Forbidden files（不可触碰）”, but plan.md §3.1 and tasks.md T005 allow a minimal write to build-spec/SKILL.md if the read-path/fail-loud rule is missing. An executor cannot know whether editing build-spec is allowed. | 建议: Move `workflows/build-spec/SKILL.md` out of forbidden files, or make it strictly read-only everywhere. If minimal edit is allowed, list it in the allowed change surface with the exact condition and verification gate.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Prior B3 remains open: Contract 1 still says worktree.json lives at `{worktree_root}/worktree.json`, while the review contract/prior finding requires the authoritative path under `{{task_tracking_root}}/tasks/{task-id}/worktree.json`. The delta did not modify data-contracts.md, yet cross-artifact-analysis.md claims blocking=0.
- 必须修复：Prior B4 remains open: Contract 2 still describes consumers拼接 `{task_dir}/{task-id}/`, which omits the required `/tasks/{task-id}` segment and conflicts with plan.md/tasks.md paths using `${WORKFLOWHUB_TASK_DIR}/tasks/{task-id}`. Executing from this contract can write/read the wrong directory.
- 必须修复：Prior B5 remains open: Contract 2 still allows fallback `~/Knowledge/workflowhub/`, directly contradicting FR-WORKTREE-ENVVAR-003 and tasks.md T001, which require fail-loud when env var and yaml are both missing. This reintroduces the hardcoded path the plan is meant to delete.
- 必须修复：T001 gate_cmd is not executable as written: `WORKFLOWHUB_TASK_DIR=/tmp/testdir ...` expects success while T001 also requires nonexistent paths to fail-loud, but the gate never creates `/tmp/testdir`. The “两者缺失 fail-loud” command also does not isolate/remove yaml config, so it can pass or fail depending on local config state instead of the requirement.
- 必须修复：T006 still lacks a reliable machine gate. The first check uses `git show ... | grep -E ...` and says “应无输出”; no match means grep exits 1, so the passing condition is a non-zero exit unless explicitly inverted. The same task also contains literal `{task-id}` placeholders inside shell commands, so the commands are not runnable as written.
- 必须修复：Forbidden-file governance is inconsistent: plan.md lists `workflows/build-spec/SKILL.md` under “Forbidden files（不可触碰）”, but plan.md §3.1 and tasks.md T005 allow a minimal write to build-spec/SKILL.md if the read-path/fail-loud rule is missing. An executor cannot know whether editing build-spec is allowed.

