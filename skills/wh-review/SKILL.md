---
name: wh-review
description: workflowhub-specific heterologous review dispatch layer. Owns stage routing, round-state, artifact packaging, provider execution, diagnostics, degrade/escalate rules, and report rendering.
---

# wh-review

## Goal

`wh-review` is workflowhub's heterologous review orchestration layer. It routes each workflow stage to its review contract, maintains review rounds, builds immutable review inputs, invokes the selected independent provider, records diagnostics, and renders durable reports. A synthetic failure is never a usable review verdict and must not be presented as independent review findings.

## Input and stage routing

The caller supplies:

- `task_id`, matching `^[A-Za-z0-9._-]+$` with no path separator or `..`.
- `stage`, exactly one of the following values.

| stage | contract |
|---|---|
| `make-decision` | `skills/wh-review/contracts/intake.md` |
| `build-spec` | `skills/wh-review/contracts/design.md` |
| `build-plan` | `skills/wh-review/contracts/plan.md` |
| `build-code` | `skills/wh-review/contracts/code.md` |
| `verify-code` | `skills/wh-review/contracts/test-acceptance.md` |

Unknown stages and unsafe identifiers fail loud. They are not sanitized or routed to a generic contract.

## Two-phase protocol

1. **Prepare**: call `prepareRoundState({taskId, stage, taskTrackingRoot})`. It returns `ready` with `review_flow_id`, `total_round`, and `contract_path`, or `blocked_by_human_confirmation`. Stop when blocked; never manufacture approval.
2. **Execute**: assemble the round material and call `assembleAndInvokeReviewEngine(...)` (or the lower-level `invokeReviewEngine(...)` when the complete contract/material inputs are already available). Execution backfills the route decision's input hash, dispatches the provider, persists the raw verdict, updates round state, and renders the report.

`mode` (`full | incremental | same-source`) comes from round state. The caller does not choose it. Do not bypass the two-phase state machine, fabricate findings, or silently change provider after failure.

## Claude Code artifact-package transport

With `WH_REVIEW_PROVIDER=claude-code` or `THIRD_REVIEW_RUNNER=claude-code`, `invoke-review-engine.mjs` uses the in-repository Claude Code runner. It does not paste an unbounded source blob into the prompt.

1. The dispatcher resolves required skills from the selected contract and creates a persistent, content-addressed artifact package beneath the task's `reviews/` directory. The package contains the complete contract, all material sources, supplementary context, required-skill definitions, chunk hashes, and a sealed manifest.
2. The runner verifies the manifest and package hashes, starts Claude Code with only `Read`, scopes `Read` to the package root, and requires every declared chunk to be read. Host-observed tool events produce artifact coverage; model-claimed coverage alone is not accepted.
3. A `pass` or `revise_required` result is accepted only with complete host-attested coverage and a schema-valid verdict. Package mutation, out-of-bound reads, incomplete coverage, invalid structured output, or unavailable required skills produces a synthetic `escalate_to_human` failure with no invented findings.

This transport fixes the former `Glob/Grep` permission dependency: packaged reviews require only scoped `Read`. It also prevents a successful CLI exit with `structured_output=null` from being accepted as a review.

## Session resume and diagnostics

The Claude runner persists state per input hash, including the Claude session id, coverage progress, attempts, resume reservations, and error fingerprints. A retryable upstream error, checkpoint, or idle interruption with a valid session resumes the same session and asks it to read only missing chunks. Partial, unattested coverage is discarded before retry. Host interruption clears unsafe session reuse.

Each run writes a journal, state file, diagnostic JSON when applicable, and `terminal-receipt.json`. The final raw verdict records `provider`, `trueCrossEngine`, `synthetic`, `execution_status`, `resume_count`, attempt history, and host-attested artifact coverage. Inspect these records before deciding that heterologous review succeeded.

## Timeouts

- Built-in Claude Code has no dispatcher outer wall timeout; its progress-aware idle timer defaults to 600 seconds.
- `CLAUDE_CODE_REVIEW_IDLE_MS` overrides the Claude idle timeout.
- Legacy/custom runners use a 600-second dispatcher timeout by default. A caller may override it with `timeoutMs`.

## Durable artifacts

Paths are resolved through `core/task-dir-parser.mjs` (`WORKFLOWHUB_TASK_DIR`, then workflowhub configuration); no machine-specific task path is hardcoded.

- `tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`
- `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`
- `tasks/{task-id}/reviews/artifact-package-{stage}-{review_flow_id}-round-{total_round}/`
- runner state, journal, diagnostics, and terminal receipt under the round's review state directory
- rendered review reports and `report-index.md` under `tasks/{task-id}/reports/`

## Verdict handling

Only a schema-valid result with `synthetic:false`, `trueCrossEngine:true`, completed execution, and verified artifact coverage counts as a successful Claude heterologous review. `synthetic:true`, `failure_reason`, missing coverage, or `execution_status` other than completed means blocked review infrastructure: report the evidence and follow the human-escalation policy. Never convert infrastructure failure into `pass` or reviewer findings.
