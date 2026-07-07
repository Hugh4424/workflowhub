---
name: wh-review
description: workflowhub-specific heterologous review dispatch layer. Owns stage→contract routing, round-state, degrade/escalate rules, and report rendering. Calls the stripped 3rd-review engine as a pure {mode, contract, materials} verdict backend.
---

<!-- component skill — physically independent, invoked by each stage's main agent via the two-phase (prepare / execute) protocol below -->
<!-- source/origin: partially migrated from agenthub packages/core/agenthub/skills/3rd-review/verifiers/vibecoding/*-contract.md -->
<!-- status: SKELETON (T001, stage 1). Round-state machine, invoke-review-engine, degrade/escalate logic land in stage 2 (T010-T012). This file will be deepened incrementally; do not treat as final. -->

# wh-review

## Goal

`wh-review` is workflowhub's own review-orchestration layer. It sits between each stage's main agent and the pure, stage-agnostic `3rd-review` engine. `3rd-review` itself carries zero knowledge of stage names, round counters, or degrade/escalate policy — it only accepts `{mode, contract, materials}` and returns `{verdict, findings, actual_mode}`. All workflowhub-specific behavior (which contract applies, which round we're on, when to escalate to a human) lives here.

## Input

Each stage's main agent calls `wh-review` with at minimum:

- `task_id` — see "task-id 来源契约" below for the validation rule.
- `stage` — one of `make-decision | build-spec | build-plan | build-code | verify-code`. Unknown/missing stage is fail-loud (see AC1-2/AC2-3), never silently defaulted.

## Output

- A structured verdict: `pass | revise_required | escalate_to_human`, plus a `findings` summary.
- Durable artifact paths (resolved via `core/task-dir-parser.mjs`, never hardcoded):
  - Route decision record: `tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`
  - Raw engine verdict: `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`
  - Rendered report: `tasks/{task-id}/reports/` (agenthub-style flat naming, indexed in `report-index.md`)

## stage → contract 映射（5 套，权威定义见 spec.md FR-WHREVIEW-002）

| stage | 合同文件 |
|---|---|
| make-decision | `skills/wh-review/contracts/intake.md` |
| build-spec | `skills/wh-review/contracts/design.md` |
| build-plan | `skills/wh-review/contracts/plan.md` |
| build-code | `skills/wh-review/contracts/code.md` |
| verify-code | `skills/wh-review/contracts/test-acceptance.md` |

Given `stage` not in the table above → fail-loud, non-zero exit, no fallback to a generic contract (AC2-3).

## 四要素调用协议（provisional skeleton — full wiring lands in T010a/T010c）

One `wh-review` invocation is fully described by four elements, of which the first is consumed internally and the remaining three are forwarded verbatim to the 3rd-review engine:

1. **`stage`** — used only for contract routing and round-state bookkeeping inside `wh-review`. Never forwarded to 3rd-review (3rd-review has zero stage knowledge; see FR-THIRDREVIEW-002).
2. **`mode`** — one of `full | incremental | same-source`, derived by `wh-review` from the current round-state (never supplied by the caller).
3. **`contract`** — the contract path + hash recorded in `route-decision-{stage}-{review_flow_id}.json` (see stage→contract table above).
4. **`materials`** — the review payload, assembled by `wh-review` itself (diff/snapshot-diff for document-class targets, real `git diff` for code/test-class targets), not authored by the caller.

The caller-facing protocol is two-phase:

- **Phase 1 — prepare**: caller passes `stage`; `wh-review` returns either `{status: "ready", review_flow_id, total_round, contract_path}` or `{status: "blocked_by_human_confirmation", review_flow_id}` (see FR-WHREVIEW-007, spec.md §"输出契约"). A blocked response means the caller must stop and wait — it must not proceed to phase 2.
- **Phase 2 — execute**: once `ready`, `wh-review` assembles `{mode, contract, materials}` and invokes the 3rd-review engine, then writes back round-state and renders the report.

Exact orchestration logic (`round-state.mjs`, `invoke-review-engine.mjs`) is implemented in stage 2 (T010-T012); this section documents the caller-visible contract shape only.

## task-id 来源契约

`task_id` MUST match the safe character set `^[A-Za-z0-9._-]+$` (no path separators, no `..`). Any `task_id` that does not match this pattern is a fail-loud error: `wh-review` exits non-zero before touching the filesystem. It must never be silently sanitized, truncated, or otherwise coerced into a safe form — a malformed `task_id` is a caller bug, not a recoverable input.

## 落盘路径解析

All filesystem paths (`route-decision-*`, `verdict-*.raw.json`, round-state files, reports) are resolved exclusively via `core/task-dir-parser.mjs`'s `parseTaskDir()`, following the same precedence as FR-TASKDIR-001: `WORKFLOWHUB_TASK_DIR` env var → `config/workflowhub.yaml` `task_dir` field → fail-loud if both are absent. `wh-review` must not hardcode a task directory path or implement a second, parallel path-resolution scheme (AC1-4, statically grep-verifiable).

## Contracts directory (this phase)

- `skills/wh-review/contracts/intake.md` — deepened in this phase (T008), covers C1-C6.
- `skills/wh-review/contracts/test-acceptance.md` — deepened in this phase (T009), covers F1-F6.
- `skills/wh-review/contracts/design.md`, `plan.md`, `code.md` — migration placeholders only in this phase (T009b); deepening deferred, see `CONTRACT-DEPTH` marker in each file for the required follow-up scope.

## Scripts (stage 1 scope)

- `skills/wh-review/scripts/route-decision-writer.mjs` — two-phase route-decision record writer (T007).

Additional scripts (`round-state.mjs`, `invoke-review-engine.mjs`, `snapshot-writer.mjs`, `human-confirmation.mjs`, `render-review-report.mjs`) are stage 2 scope (T010-T012) and not present yet.
