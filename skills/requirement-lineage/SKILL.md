---
name: requirement-lineage
description: Build requirement-to-decision-to-artifact-to-verification lineage for WorkflowHub audits. Use when planning, implementation, or verification must prove every accepted requirement has evidence and identify missing, stale, or untestable coverage.
---

# Requirement Lineage

Make requirement coverage explicit and reviewable.

## Typed I/O

Input: immutable `requirement_id`, `source_ref`, optional `decision_ref`, `artifact_refs`, `verification_refs`, and `coverage` (`covered|partial|missing|stale|not_applicable`).

Output: a lineage record with a content hash and the input fields.

## Rules

1. Preserve source identifiers. Never renumber requirements in an audit run.
2. Mark `missing` when no implementation evidence exists; mark `partial` when implementation or verification evidence is absent.
3. Mark `stale` when referenced evidence predates a material artifact change.
4. Return `invalid_input` for missing `requirement_id` or `source_ref`; return `conflict` for incompatible records for the same requirement.
5. Do not claim that a requirement is accepted, implemented, or verified solely from a plan or a prior verdict.

## Consumers

P3 audit reports and verify-code checks consume lineage records. P1/P2 may attach decision, artifact, receipt, and audit-summary references.
