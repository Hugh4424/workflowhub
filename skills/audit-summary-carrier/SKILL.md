---
name: audit-summary-carrier
description: Package a bounded typed audit summary for a downstream WorkflowHub stage. Use when one stage must transfer audit facts, receipt references, requirements coverage, and stale-state information without transferring a verdict or relying on a worktree.
---

# Audit Summary Carrier

Carry auditable facts across stage boundaries; do not aggregate decisions.

## Typed I/O

Input: `source_stage`, `summary_id`, `artifact_refs`, `receipt_refs`, `requirement_refs`, `freshness` (`current|stale|unknown`), `created_at`, and optional `limitations`.

Output: an immutable summary object with a content hash and all input fields.

## Rules

1. Require at least one immutable `artifact_ref` or `receipt_ref`.
2. Preserve `stale` and `unknown`; never upgrade them to `current` without fresh evidence.
3. Include a limitation when a provider result is absent, cancelled, or material is incomplete.
4. Reject `invalid_input` for missing source, references, or freshness; return `conflict` for a reused `summary_id` with different content.
5. Do not generate an aggregate, provider, or release verdict.

## Consumers

P2 stage-result and validation contracts may carry this summary. P3 requirement-lineage may consume its references. P0 defines this contract only.
