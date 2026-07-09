# 审查报告 — worktree-unification-build-plan-r6-20260705T015736Z-5bc3f2 (round 4)

- verdict: revise_required
- provenance: single-context

## Summary

Round 4 / wu-r6 delta cannot pass. B1/B7/B8 appear partially addressed, but B3/B4/B5 remain open because data-contracts.md is unchanged; B2 lacks visible closure evidence in the provided package; B6 remains open because several gate_cmd entries still are not direct exit-0 machine gates. Additional unresolved issues: build-spec mutability is contradictory, T006 checks a future close artifact too early, and cross-artifact-analysis records the wrong prior round/findings count.

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: Prior blocking B3 remains open: Contract 1 still locates worktree.json at `{worktree_root}/worktree.json`, while the prior review required `{{task_tracking_root}}/tasks/{task-id}/worktree.json`. | 建议: Update Contract 1 File path to `{{task_tracking_root}}/tasks/{task-id}/worktree.json`, then align owner/consumer and validation text to that single authoritative path.
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: Prior blocking B4 remains open: Contract 2 still describes the old `{task_dir}/{task-id}` model, contradicting T001's requirement that parser returns `task_tracking_root` and callers append `/tasks/{task-id}`. | 建议: Rewrite Contract 2 so `parseTaskDir` returns `task_tracking_root`, and every consumer explicitly composes `{{task_tracking_root}}/tasks/{task-id}/...`.
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: Prior blocking B5 remains open: Contract 2 still permits hardcoded fallback `~/Knowledge/workflowhub/`, while spec/tasks require fail-loud when both env var and yaml are missing. | 建议: Delete the hardcoded fallback. Define priority exactly as `WORKFLOWHUB_TASK_DIR` -> yaml `task_dir` -> fail-loud with explicit error.
- [blocking] 位置: specs/worktree-unification/spec.md:55 | 问题: Prior blocking B2 lacks verifiable closure evidence in the review package: the delta does not show the required fix for yaml fallback producing `/tasks/tasks/{task-id}` path drift. | 建议: Include the corrected current spec.md text around line 55 in the review package or add the missing delta hunk showing the yaml fallback path rule no longer produces `/tasks/tasks/{task-id}`.
- [blocking] 位置: specs/worktree-unification/tasks.md:14 | 问题: T001 gate_cmd is not reliably executable: it uses `require('./core/task-dir-parser.mjs').then(...)` against an `.mjs` module and assumes `/tmp/testdir` exists even though nonexistent paths must fail-loud. | 建议: Use ESM import with `node --input-type=module`, create temp directories/files inside each gate, and isolate each filesystem case.
- [blocking] 位置: specs/worktree-unification/tasks.md:18 | 问题: T001's missing-env-and-yaml fail-loud gate does not isolate yaml fallback, so it may succeed when local `config/workflowhub.yaml` exists. | 建议: Run this gate in a temp cwd/repo fixture with no `config/workflowhub.yaml`, or add a parser test fixture that explicitly disables config lookup.
- [blocking] 位置: specs/worktree-unification/tasks.md:20 | 问题: Several negative grep gates treat exit 1 as pass, so they are not direct machine pass/fail gates under normal exit-code semantics. | 建议: Invert negative grep commands with `! grep ...` or wrap them in a shell assertion that exits 0 when no match exists.
- [blocking] 位置: specs/worktree-unification/tasks.md:65 | 问题: T006 boundary gate is not executable as a pass/fail command: it contains literal `{task-id}` and uses grep no-output as success without inverting exit code. | 建议: Use the concrete task id `worktree-unification` or define an explicit substitution variable, and invert the grep check with `!` or an equivalent assertion.
- [blocking] 位置: specs/worktree-unification/tasks.md:65 | 问题: T006 requires the verify-code close runtime artifact `stage-result.json` before the close flow has actually executed. | 建议: During plan-stage verification, inspect `workflows/verify-code/SKILL.md` for the required path rule; move actual file-existence verification to a post-close smoke/integration check.
- [blocking] 位置: specs/worktree-unification/plan.md:58 | 问题: Scope boundary remains contradictory: plan.md lists `workflows/build-spec/SKILL.md` as forbidden/no-modify, but Phase 3.1 and T005 allow a one-line edit if fail-loud/read logic is missing. | 建议: Classify build-spec as conditional allowed with exact one-line-only constraints, or make it strictly read-only and remove the T005/Phase 3.1 edit allowance.
- [important] 位置: specs/worktree-unification/plan.md:148 | 问题: Acceptance-source drift remains: tasks.md T007 correctly says success criteria are in spec §5 AC-01..AC-04 and §8 scenarios, but plan.md still references spec §7 acceptance criteria. | 建议: Replace remaining plan.md references to `spec §7 验收标准 1-9` with `spec §5 成功标准 AC-01..AC-04 and spec §8 scenarios`.
- [important] 位置: specs/worktree-unification/cross-artifact-analysis.md:12 | 问题: Closure record is stale/inaccurate: the review metadata says this round is based on round-5 with 8 blocking and 4 important, but cross-artifact-analysis claims round-4 with 5 blocking and 2 minor and declares blocking=0. | 建议: Rewrite the closure matrix against the actual round-5 findings, listing fixed file/line/evidence for each prior blocking and leaving open items non-zero.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Prior blocking B3 remains open: Contract 1 still locates worktree.json at `{worktree_root}/worktree.json`, while the prior review required `{{task_tracking_root}}/tasks/{task-id}/worktree.json`.
- 必须修复：Prior blocking B4 remains open: Contract 2 still describes the old `{task_dir}/{task-id}` model, contradicting T001's requirement that parser returns `task_tracking_root` and callers append `/tasks/{task-id}`.
- 必须修复：Prior blocking B5 remains open: Contract 2 still permits hardcoded fallback `~/Knowledge/workflowhub/`, while spec/tasks require fail-loud when both env var and yaml are missing.
- 必须修复：Prior blocking B2 lacks verifiable closure evidence in the review package: the delta does not show the required fix for yaml fallback producing `/tasks/tasks/{task-id}` path drift.
- 必须修复：T001 gate_cmd is not reliably executable: it uses `require('./core/task-dir-parser.mjs').then(...)` against an `.mjs` module and assumes `/tmp/testdir` exists even though nonexistent paths must fail-loud.
- 必须修复：T001's missing-env-and-yaml fail-loud gate does not isolate yaml fallback, so it may succeed when local `config/workflowhub.yaml` exists.
- 必须修复：Several negative grep gates treat exit 1 as pass, so they are not direct machine pass/fail gates under normal exit-code semantics.
- 必须修复：T006 boundary gate is not executable as a pass/fail command: it contains literal `{task-id}` and uses grep no-output as success without inverting exit code.
- 必须修复：T006 requires the verify-code close runtime artifact `stage-result.json` before the close flow has actually executed.
- 必须修复：Scope boundary remains contradictory: plan.md lists `workflows/build-spec/SKILL.md` as forbidden/no-modify, but Phase 3.1 and T005 allow a one-line edit if fail-loud/read logic is missing.

