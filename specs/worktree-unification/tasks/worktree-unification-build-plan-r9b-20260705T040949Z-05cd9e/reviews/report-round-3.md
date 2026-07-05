# 审查报告 — worktree-unification-build-plan-r9b-20260705T040949Z-05cd9e (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

Prior package blockers mostly closed: data-contracts now uses `{{task_tracking_root}}/tasks/{task-id}/worktree.json`, hardcoded fallback is removed from Contract 2, build-spec is now read-only, B10/B11/B12 gate exit-code fixes are present, and stage-result.json is no longer tracked with ignore rules added. Verdict remains revise_required because current artifacts still contain blocking execution and traceability gaps: parser gates are not runnable, normalization semantics conflict across artifacts, FR-WORKTREE-COMMIT-004 is only advisory/read-only, Contract 4 contradicts spec no-change behavior, and durable parser tests are missing.

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:15 | 问题: T001 gate_cmd is still not executable as written. It uses `require('./core/task-dir-parser.mjs').then(...)`, but `require('./core/task-dir-parser.mjs')` returns a module object with `parseTaskDir`, not a Promise. The gate fails on command shape before it verifies env-var priority, fail-loud behavior, or path semantics. | 建议: Rewrite all parser gates to use real ESM invocation, for example `node --input-type=module -e "import { parseTaskDir } from './core/task-dir-parser.mjs'; const r=parseTaskDir(); ..."`. Assert exact return values, exact nonzero exit for fail-loud cases, and expected stderr text.
- [blocking] 位置: specs/worktree-unification/tasks.md:36 | 问题: T002 introduces automatic `/tasks` trimming and a `normalizeTaskTrackingRoot()` API, but spec.md says yaml values ending in `/tasks` require migration or env override, data-contracts.md does not define trimming, and plan.md only specifies `parseTaskDir()`. This is concept drift plus an unregistered public helper API. | 建议: Pick one canonical rule and state it in spec.md, plan.md, data-contracts.md, and tasks.md. Recommended: if yaml fallback may contain one trailing `/tasks` or `/tasks/`, define that normalization explicitly in Contract 2 and implement/test it inside T001 through `parseTaskDir`; do not expose `normalizeTaskTrackingRoot()` unless the API is explicitly part of the contract.
- [blocking] 位置: specs/worktree-unification/tasks.md:84 | 问题: FR-WORKTREE-COMMIT-004 is a hard in-scope requirement for every stage/phase, but T008 is read-only and advisory: missing build-code per-phase commit/no-change coverage becomes a follow-up instead of a failed gate. Executing this plan can still pass while the commit traceability requirement remains unimplemented. | 建议: Add an implementation task or extend T003 to modify `workflows/build-code/SKILL.md` so each file-changing phase commits with `workflowhub(build-code/<phase-name>): ...`, and each no-change phase records a no-change reason. Make T008 a blocking verification gate, not advisory, and add T008 to plan.md Verification Mapping.
- [blocking] 位置: specs/worktree-unification/data-contracts.md:128 | 问题: Contract 4 says every stage/phase must run `git add + git commit`, while spec.md requires commits only when files changed, forbids empty stage markers, and requires stage-result/journal no-change records otherwise. An executor following the contract can create unwanted empty commits or treat valid no-change stages as failures. | 建议: Align Contract 4 with spec.md: file-changing stage/phase must commit; no-change stage/phase must write a no-change reason to stage-result or journal; empty stage marker commits are forbidden.
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: T001 changes durable behavior in `core/task-dir-parser.mjs`, but tasks.md does not require updating the persistent parser test file. Existing `core/__tests__/task-dir-parser.test.mjs` still covers the old `~/Knowledge/workflowhub/` fallback behavior, directly conflicting with the new fail-loud requirement. | 建议: Add a test-first subtask before parser implementation: update `core/__tests__/task-dir-parser.test.mjs`, then run `npx vitest run core/__tests__/task-dir-parser.test.mjs`. Cover env priority, empty env, yaml fallback, missing yaml, missing `task_dir`, relative path, `~` path, nonexistent path, non-directory, hardcoded fallback removal, and the chosen `/tasks` normalization rule.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：T001 gate_cmd is still not executable as written. It uses `require('./core/task-dir-parser.mjs').then(...)`, but `require('./core/task-dir-parser.mjs')` returns a module object with `parseTaskDir`, not a Promise. The gate fails on command shape before it verifies env-var priority, fail-loud behavior, or path semantics.
- 必须修复：T002 introduces automatic `/tasks` trimming and a `normalizeTaskTrackingRoot()` API, but spec.md says yaml values ending in `/tasks` require migration or env override, data-contracts.md does not define trimming, and plan.md only specifies `parseTaskDir()`. This is concept drift plus an unregistered public helper API.
- 必须修复：FR-WORKTREE-COMMIT-004 is a hard in-scope requirement for every stage/phase, but T008 is read-only and advisory: missing build-code per-phase commit/no-change coverage becomes a follow-up instead of a failed gate. Executing this plan can still pass while the commit traceability requirement remains unimplemented.
- 必须修复：Contract 4 says every stage/phase must run `git add + git commit`, while spec.md requires commits only when files changed, forbids empty stage markers, and requires stage-result/journal no-change records otherwise. An executor following the contract can create unwanted empty commits or treat valid no-change stages as failures.
- 必须修复：T001 changes durable behavior in `core/task-dir-parser.mjs`, but tasks.md does not require updating the persistent parser test file. Existing `core/__tests__/task-dir-parser.test.mjs` still covers the old `~/Knowledge/workflowhub/` fallback behavior, directly conflicting with the new fail-loud requirement.

