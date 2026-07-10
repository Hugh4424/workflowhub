# ADR 0002: Requirement Lineage and Step Audit Authority

- Status: Accepted
- Date: 2026-07-11

## Context

The five workflow stages need stable, single-action step boundaries before step-level audit can be meaningful. The earlier decision pass also demonstrated that parent requirements can be silently narrowed when source authority, lineage, and coverage are implicit.

This ADR records architecture decisions only. The manifests, receipts, validators, adapters, and acceptance fixtures described below are future implementation work; this ADR does not claim they already exist.

## Decision

1. Preserve a requirement-fidelity chain from authoritative source through immutable requirement identity, decision, artifact, and acceptance criteria.
2. Build a consumer/evidence matrix before extracting repeated stage prose. Choose a skill, reference, component, or contract from typed I/O and failure, skip, and human-gate semantics—not from naming preference.
3. Refactor all five stage definitions to stable integer, single-action steps before freezing step IDs or adding receipts.
4. Treat stage manifests as expected topology and journal/receipts as observed-facts authority. Neither replaces the other.
5. Make the audit aggregator the single source of truth for the canonical audit verdict. Stage results carry its summary; validators verify it; facts assembly does not independently recompute it.
6. Keep requirement-fidelity logic in a generic core behind canonical ports. A Multica adapter may retrieve and normalize issue/comment sources, but must not compute coverage or resolve semantic conflicts.

## Consequences

- Missing whole steps become detectable by expected-versus-observed comparison.
- Reusable protocol text gains one canonical owner while stages retain local sequencing and human gates.
- Platform-specific source collection can change without coupling the coverage model to Multica types.
- Implementation must include migration maps, schema validation, failure semantics, and adversarial fixtures before the architecture can be considered delivered.
