---
name: stage-step-receipts
description: Create or validate a typed receipt for one canonical workflow step. Use when a workflow stage needs durable evidence of a completed, skipped, blocked, retried, or closed step without adding a second verdict engine.
---

# Stage Step Receipts

Produce one receipt per canonical step. Do not infer execution from prose.

## Typed I/O

Input: `stage_slug`, canonical integer `step_id`, `outcome` (`completed|skipped|blocked|retried|closed`), `evidence_refs`, `recorded_at`, and optional `reason`.

Output: a receipt object with the same fields plus a stable `receipt_id` and content hash. `evidence_refs` must identify immutable artifacts or commands with captured output.

## Rules

1. Confirm that `step_id` exists in `workflows/<stage>/steps.json` before emitting a receipt.
2. Use `skipped`, `blocked`, `retried`, and `closed` only with a non-empty `reason`.
3. Do not create a receipt for an unknown stage, a non-canonical step, missing evidence, or a contradictory prior receipt. Return `invalid_input` or `conflict` instead.
4. Do not calculate a stage, review, or release verdict. A receipt is evidence only.

## Consumers

P1 workflow instructions may emit or read these receipts. P2 audit-summary-carrier may reference them. P3 requirement-lineage may link them to acceptance evidence.
