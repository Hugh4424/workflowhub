# 审查报告 — worktree-unification-build-plan-r6-20260705T015736Z-5bc3f2 (round 6)

- verdict: revise_required
- provenance: single-context

## Summary

Round 6 cannot pass. B1, B7, and B8 are partially addressed. B3, B4, and B5 remain open because data-contracts.md is unchanged. B2 lacks visible closure evidence. B6 remains open because several new gate_cmd entries are not direct reliable machine gates. Additional blocking conflict remains around build-spec mutability.

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: Prior B3 remains open: Contract 1 still states worktree.json path as `{worktree_root}/worktree.json`, while the required path is `{{task_tracking_root}}/tasks/{task-id}/worktree.json`. | 建议: Change Contract 1 File path to `{{task_tracking_root}}/tasks/{task-id}/worktree.json` and align owner, consumer, validation, and write-permission text to that single path.
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: Prior B4 remains open: Contract 2 still describes the old `{task_dir}/{task-id}` model, contradicting T001 where parser returns `task_tracking_root` and callers append `/tasks/{task-id}`. | 建议: Rewrite Contract 2 so `parseTaskDir()` returns only `task_tracking_root`, and every consumer composes `{{task_tracking_root}}/tasks/{task-id}` explicitly.
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: Prior B5 remains open: Contract 2 still permits fallback to `~/Knowledge/workflowhub/`, while spec/tasks require fail-loud when env var and yaml are both missing. | 建议: Delete the hardcoded fallback and define priority as `WORKFLOWHUB_TASK_DIR` -> yaml `task_dir` -> explicit non-zero fail-loud.
- [blocking] 位置: specs/worktree-unification/spec.md:55 | 问题: Prior B2 closure is not verifiable from the review package: the delta only shows SCOPE-009 edits and does not show the corrected WORKFLOWHUB_TASK_DIR/yaml fallback text that prevents `/tasks/tasks/{task-id}` drift. | 建议: Include or update the spec.md line-55 area so it explicitly says parser returns `task_tracking_root` and consumers append `/tasks/{task-id}` exactly once.
- [blocking] 位置: specs/worktree-unification/plan.md:66 | 问题: The plan still conflicts on `workflows/build-spec/SKILL.md`: the Forbidden files section says it is not to be touched, but later Scope Boundary and T005 allow a minimal one-line modification if missing target_repo_root/worktree_root fail-loud behavior. | 建议: Choose one contract: either make build-spec strictly read-only and remove modification language, or remove it from forbidden files and list the exact allowed one-line change plus gate.
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: T001 gate_cmd is not reliably executable: it uses `require('./core/task-dir-parser.mjs')` against an `.mjs` module and assumes `/tmp/testdir` exists even though nonexistent paths must fail-loud. | 建议: Replace with executable ESM-safe commands using `node --input-type=module`, create temp directories/files inside the command, and isolate env/yaml cases with temporary config state.
- [blocking] 位置: specs/worktree-unification/tasks.md:61 | 问题: T005 `git worktree list | wc -l` only prints a count; it does not compare before/after and cannot produce a machine pass/fail result for '条目数不变'. | 建议: Define a real gate that records a before count, runs the checked stage action or documented no-op, records after count, and exits non-zero if counts differ.
- [blocking] 位置: specs/worktree-unification/tasks.md:68 | 问题: T006 no-output check is a fake gate: `git show HEAD -- specs/{task-id}/ | grep ...` uses a literal `{task-id}` placeholder and success is described as no output, which makes grep exit 1 unless wrapped with `!` or equivalent. | 建议: Replace with an executable command using the concrete task id and inverted grep, for example `! git show --name-only HEAD -- specs/worktree-unification | grep -E '(^|/)(evidence/|stage-result\.json|journal\.jsonl|task-metrics\.jsonl)$'`.
- [blocking] 位置: specs/worktree-unification/tasks.md:68 | 问题: T006 requires `stage-result.json` to exist under `${WORKFLOWHUB_TASK_DIR}/tasks/{task-id}/` during the build-plan verification phase, but that runtime close artifact only exists after verify-code close executes. | 建议: Split static plan verification from runtime close verification. In T006, verify the intended SKILL.md path/rule; leave actual `stage-result.json` existence to verify-code close evidence.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Prior B3 remains open: Contract 1 still states worktree.json path as `{worktree_root}/worktree.json`, while the required path is `{{task_tracking_root}}/tasks/{task-id}/worktree.json`.
- 必须修复：Prior B4 remains open: Contract 2 still describes the old `{task_dir}/{task-id}` model, contradicting T001 where parser returns `task_tracking_root` and callers append `/tasks/{task-id}`.
- 必须修复：Prior B5 remains open: Contract 2 still permits fallback to `~/Knowledge/workflowhub/`, while spec/tasks require fail-loud when env var and yaml are both missing.
- 必须修复：Prior B2 closure is not verifiable from the review package: the delta only shows SCOPE-009 edits and does not show the corrected WORKFLOWHUB_TASK_DIR/yaml fallback text that prevents `/tasks/tasks/{task-id}` drift.
- 必须修复：The plan still conflicts on `workflows/build-spec/SKILL.md`: the Forbidden files section says it is not to be touched, but later Scope Boundary and T005 allow a minimal one-line modification if missing target_repo_root/worktree_root fail-loud behavior.
- 必须修复：T001 gate_cmd is not reliably executable: it uses `require('./core/task-dir-parser.mjs')` against an `.mjs` module and assumes `/tmp/testdir` exists even though nonexistent paths must fail-loud.
- 必须修复：T005 `git worktree list | wc -l` only prints a count; it does not compare before/after and cannot produce a machine pass/fail result for '条目数不变'.
- 必须修复：T006 no-output check is a fake gate: `git show HEAD -- specs/{task-id}/ | grep ...` uses a literal `{task-id}` placeholder and success is described as no output, which makes grep exit 1 unless wrapped with `!` or equivalent.
- 必须修复：T006 requires `stage-result.json` to exist under `${WORKFLOWHUB_TASK_DIR}/tasks/{task-id}/` during the build-plan verification phase, but that runtime close artifact only exists after verify-code close executes.

