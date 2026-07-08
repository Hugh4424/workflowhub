# 审查报告 — build-plan-review-wh-review-rebuild-r2-20260706T074339Z-e42c7f (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

Round 2 仍不能执行闭环。核心 runner 集成任务缺失，D2 人工确认 artifact 契约写反，且还有假验证命令，先修这三处再评审。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:54 | 问题: Stage 2 tasks cover route state, report rendering, 3rd-review doc cleanup, and stage call-site migration, but they never assign implementation of the core wh-review -> 3rd-review runner bridge required by FR-THIRDREVIEW-001: serializing `{mode, contract, materials}` into `--diff`, invoking `node <runner> --diff=<file> --output=<file>`, enforcing timeout, reading `tasks/{task-id}/reviews/verdict-round-{total_round}.raw.json`, and mapping runner failure / missing output to `escalate_to_human`. Without this, the central execution path cannot be built as written. | 建议: Add an explicit task and file surface for the runner invocation layer on the wh-review side, including runner discovery via `THIRD_REVIEW_RUNNER`, timeout handling, raw verdict JSON persistence, parse/error handling, and verification commands that prove the structured triplet is actually sent and parsed.
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:57 | 问题: T011b repurposes `tasks/{task-id}/reviews/human-confirmation-{stage}-{total_round}.json` as a waiting artifact with fields `stage/total_round/verdict/awaiting_since`. The spec defines this same path as the post-approval artifact and requires at least `approved_by`, `approved_at`, `stage`, `total_round`. Using one file for both pending and approved states breaks the restart contract: orchestrator cannot reliably distinguish "waiting for approval" from "already approved". | 建议: Separate pending-state tracking from approval evidence, or keep this path exclusively for the approved artifact exactly as specified. Then add a distinct pending marker in round-state or another file, and update the restart verification to check both states unambiguously.
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:95 | 问题: Multiple verification commands are not trustworthy pass/fail gates. `git diff --stat | grep -vE ...` checks diff-stat text, not changed paths, so it cannot prove scope boundaries. Stage 2 checkpoints also use literal placeholders like `<3rd-review repo>` in gate commands, which are not runnable commands. This violates the plan contract requirement for objective, executable verification. | 建议: Replace fake gates with runnable commands over real inputs: use `git diff --name-only` for scope checks, substitute the concrete 3rd-review path already declared in Path Conventions, and keep display-only formatting commands separate from machine pass/fail commands.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Stage 2 tasks cover route state, report rendering, 3rd-review doc cleanup, and stage call-site migration, but they never assign implementation of the core wh-review -> 3rd-review runner bridge required by FR-THIRDREVIEW-001: serializing `{mode, contract, materials}` into `--diff`, invoking `node <runner> --diff=<file> --output=<file>`, enforcing timeout, reading `tasks/{task-id}/reviews/verdict-round-{total_round}.raw.json`, and mapping runner failure / missing output to `escalate_to_human`. Without this, the central execution path cannot be built as written.
- 必须修复：T011b repurposes `tasks/{task-id}/reviews/human-confirmation-{stage}-{total_round}.json` as a waiting artifact with fields `stage/total_round/verdict/awaiting_since`. The spec defines this same path as the post-approval artifact and requires at least `approved_by`, `approved_at`, `stage`, `total_round`. Using one file for both pending and approved states breaks the restart contract: orchestrator cannot reliably distinguish "waiting for approval" from "already approved".
- 必须修复：Multiple verification commands are not trustworthy pass/fail gates. `git diff --stat | grep -vE ...` checks diff-stat text, not changed paths, so it cannot prove scope boundaries. Stage 2 checkpoints also use literal placeholders like `<3rd-review repo>` in gate commands, which are not runnable commands. This violates the plan contract requirement for objective, executable verification.

