# P0 foundation decision record

Decision: freeze P1–P3 inputs before claiming any new runtime behavior. P0 delivers the 34-step inventory, three discoverable typed contracts, registry entries, and structural checks only.

## Phase and requirement mapping

| Phase | Scope | R1–R9 coverage | P0 status |
|---|---|---|---|
| P0 | canonical IDs, discoverable contracts, registry truth, structural proof | establishes auditable boundary for R1–R9 | complete only when this record/tests pass |
| P1 | workflow SKILL receipt wiring | R1, R3, R4, R6, R7 | not implemented by P0 |
| P2 | source/ledger, receipt/journal, aggregator, consumers | R2, R4, R5, R9 | not implemented by P0 |
| P3 | full evidence matrix, fresh acceptance and migration verification | R6, R7, R8, R9 | not implemented by P0 |

R1–R9 remain accepted requirements; R10 remains withdrawn and outside the coverage denominator. This phase map is a delivery boundary, not a claim of 9/9 implementation coverage.

## Nine-candidate evidence matrix

| Candidate | Evidence needed | P0 disposition |
|---|---|---|
| manifests/loader | five real manifests and schema validation | boundary inventoried; runtime pre-existing/not re-claimed |
| immutable ledger | accepted R1–R9, withdrawn R10, hashes/stale | contract only; P2 proof required |
| Multica adapter | canonical/offline equivalent source result | P2 proof required |
| audit summary | one summary reference/hash contract | contract skill added; runtime P2 |
| receipt wiring | step-bound entry/exit facts | P1 implementation required |
| summary ref/hash | consumers preserve canonical data | P2 implementation required |
| 8-consumer registry | typed decision/evidence matrix | existing matrix retained; P0 skill registry added |
| actual-run metrics | exact command/count/duration evidence | P3 run required |
| adversarial fixtures | non-pass missing/duplicate/stale/tampered cases | P2/P3 verification required |

## Guardrails

- Do not use this record as a runtime receipt, aggregate verdict, validator result, or V4 review result.
- Preserve raw provider output and verify review material before any human release approval.
- Decisions about an unlisted runtime extension require a new record; P0 must not silently expand scope.
- P1 owns the `intake-review-orchestrator` migration: replace that missing reference only after adapting `intake-decision-review` input/output semantics. P0 records the gap but does not modify workflow SKILL instructions.
