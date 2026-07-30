# ADR 0002: Requirement Lineage and Step Audit Authority

- Status: Accepted
- Date: 2026-07-11

## Context

The five workflow stages need stable, single-action step boundaries before step-level audit can be meaningful. The earlier decision pass also demonstrated that parent requirements can be silently narrowed when source authority, lineage, and coverage are implicit.

This ADR records the shipped audit architecture. Canonical manifests, receipt/journal identity, source adapters, ledger validation, audit aggregation, and acceptance fixtures now implement the decisions below; callers must use their published contracts.

## Decision

1. Preserve a requirement-fidelity chain from authoritative source through immutable requirement identity, decision, artifact, and acceptance criteria.
2. Build a consumer/evidence matrix before extracting repeated stage prose. Choose a skill, reference, component, or contract from typed I/O and failure, skip, and human-gate semantics—not from naming preference.
3. Refactor all five stage definitions to stable integer, single-action steps before freezing step IDs or adding receipts.
4. Treat stage manifests as expected topology and journal/receipts as observed-facts authority. Neither replaces the other.
5. Make the audit aggregator the single source of truth for the canonical audit verdict. Stage results carry its summary; validators verify it; facts assembly does not independently recompute it.
6. Keep requirement-fidelity logic in a generic core behind canonical ports. A Multica adapter may retrieve and normalize issue/comment sources, but must not compute coverage or resolve semantic conflicts.

## Design

- `steps.json` is expected topology; append-only journal and receipts are observed facts. These domains cannot overwrite each other.
- The immutable requirement ledger preserves source → decision → artifact → acceptance lineage, hash verification, and stale propagation.
- `core/audit-aggregator.mjs` is the sole producer of `AuditSummary.verdict`. Stage results, validators, and facts assembly preserve or verify its reference/hash only.
- Offline fixtures and Multica sources cross the same `CanonicalSourceInput` boundary. Generic core receives no platform-native fields.
- Legacy callers map explicitly; missing/unknown identities remain `LEGACY_FIELDS_MISSING`, `UNKNOWN_STEP`, `SOURCE_INCOMPLETE`, or `SOURCE_UNKNOWN`, never pass.

## Alternatives considered

1. Let each stage result compute a verdict. Rejected: consumer disagreement creates multiple authorities.
2. Derive expected steps from journal activity. Rejected: observed execution can omit required work.
3. Put Multica issue/comment types in core. Rejected: offline equivalence and portability break.
4. Auto-upgrade incomplete legacy records. Rejected: fabricated identity creates false coverage.

## Consequences

- Missing whole steps become detectable by expected-versus-observed comparison.
- Reusable protocol text gains one canonical owner while stages retain local sequencing and human gates.
- Platform-specific source collection can change without coupling the coverage model to Multica types.
- Shipped schema validation, migration maps, failure semantics, and adversarial fixtures keep malformed, stale, tampered, duplicate, out-of-order, and unknown evidence observable and fail-closed.
- Cutover retains an explicit legacy boundary until callers carry matching summary reference/hash; no second verdict authority is permitted.

## Migration

Use `docs/migration-and-fallback.md` for old-to-new identifiers, caller cutover, and fallback. A caller first normalizes to `CanonicalSourceInput`, then consumes manifest expected steps and journal/receipt observed facts, invokes the aggregator, and carries its summary reference/hash. Unknown performance remains `unknown` with its source limitation; it is never inferred from audit completion.

## Clarification — current requirements revision (2026-07-30)

“Immutable requirement ledger” means immutable requirement IDs and immutable bytes of every
published ledger/coverage generation. It does not mean that a task's current selection can never
advance. A same-task `requirements/current` pointer may select a later append-only revision with
explicit parent/supersedes lineage; old generations remain readable and are never overwritten.

The pointer is only a selector, not evidence by itself. Before a consumer reuses it, the ledger
and coverage refs, hashes, and actual bytes must all bind. A missing or mismatched coverage record
must fail the publication rather than create a completion fact. This clarification preserves the
original lineage and audit authorities; it adds no reopen, acceptance, or audit gate.
