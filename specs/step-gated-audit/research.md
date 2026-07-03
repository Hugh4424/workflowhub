# Research: step-gated-audit

**Task ID**: `step-gated-audit`
**Date**: 2026-07-03
**Skill**: spec-research v1

---

## Skip / No-Skip Determination

This feature (`step-gated-audit`) is a **C-grade cross-system change** touching 5 stage SKILL.md files and the journal/stage-result schema. The research phase is NOT skipped — sufficient background exists within the repository to inform the plan without external web research. All findings below are derived from the codebase and the upstream spec/decision-log.

---

## 1. Feature Background

The goal is to elevate audit coverage from "end-of-stage report" to "per-step entry+exit checkpoint chain". Every step in every one of the 5 stages (build-spec, build-plan, build-code, verify-code, make-decision) must:
1. Write an `entry_receipt` to `journal.jsonl` **before** execution begins.
2. Write an `exit_receipt` to `journal.jsonl` **after** execution completes (including a 3rd-review call).
3. Produce a `judgement` if `check_status=blocked`, which the runner/workflow layer acts on (rollback, not audit itself).

Key motivation from decision-log: a prior incident where steps were skipped with no record; journal only captured stage-level events, leaving no per-step audit trail.

---

## 2. Existing Infrastructure (Codebase Scan)

### journal.jsonl (core/journal-schema.mjs)
- Exists. Records stage-level events today.
- `event_type` enum will need two new values: `step_entry` and `step_exit`.
- Writing is append-only; new event types are additive, non-breaking for readers that skip unknown types.

### stage-result.json
- Exists per stage. Must gain a new `audit_summary` top-level field (5 counters: total_step_count, passed_step_count, blocked_step_count, skipped_step_count, rollback_count).
- This is an additive schema change; old readers ignore unknown fields.

### skills/3rd-review/SKILL.md
- Referenced as the review skill to call in after-step. NOT being modified — only being called. Its interface is file-in / result-out; failure degrades to `executed=false, verdict=unknown`.
- No 3rd-review SKILL.md found under `skills/` root — it is a dependency that must be present or gracefully handled.

### receipt-writer.mjs (core/)
- Does NOT exist yet. Must be created as a shared write interface so all 5 stages call the same append path. This avoids 5 separate journal-write implementations.

### build-code phase-manifest
- build-code has a dynamic phase system (phase-manifest). FR-SGA-011 requires before-step to fire AFTER phase-manifest is loaded. Other 4 stages have static step lists — no phase-manifest concern.

---

## 3. Related Patterns in Codebase

- **Local-pointer receipt chain** (FR-SGA-015 / decision-log D1): Each receipt records `prev_step_id` / `next_step_id`. No global step registry. This mirrors event-sourcing linked-list patterns — reconstructing position requires traversing the journal, not consulting an index.
- **Rollback threshold = 2** (D9): Hardcoded, not configurable in this iteration. Runner tracks `rollback_count` per `workflow_run_id`; count resets on new run.
- **writer_namespace / executor_namespace** (FR-SGA-008): Detect potential self-review. This is a warn-only flag, never a blocker (CONSTITUTION F4).
- **fail-closed vs warn-only** (FR-SGA-013): entry_receipt failure = step blocked (protects audit integrity); exit_receipt failure = warn logged, step result preserved.

---

## 4. Risk Points

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | 3rd-review SKILL.md absence at call time | Medium | Degrade gracefully: executed=false, verdict=unknown, journal warn |
| R2 | build-code phase-manifest concurrent write during multi-phase runs | Medium | Out of scope per FR-SGA-011 note; document in Known Gaps |
| R3 | executor_namespace isolation depends on runner-layer implementation | Medium | Warn-only detection, detail left to build-plan |
| R4 | journal.jsonl append-only race under parallel stage execution | Low | Per-stage journal files assumed; confirm in build-plan |
| R5 | receipt-writer.mjs as new shared module adds cross-stage coupling | Low | F2 (窄契约): interface is narrow (task-id + receipt payload → append) |

---

## 5. Prior Art / Reference Patterns

- **Event-sourcing linked list**: Each event stores prev/next pointer; no central registry. Used in Kafka offset tracking and git commit chains. Matches FR-SGA-015 design.
- **Gate vs record distinction** (CONSTITUTION F3/Q1/Q2): Physical facts recorded, not blocked on. This is a well-established pattern in audit logging systems (e.g. AWS CloudTrail records all API calls but doesn't block them).
- **Degradable external calls** (FR-SGA-007 3rd-review): Pattern of try→degrade→log is standard for optional enrichment services.

---

## 6. Conclusion

Research is **sufficient to proceed** to data-contracts and plan. No blocking unknowns. The primary design decisions are already captured in the decision-log (D1–D9) and spec (FR-SGA-001–015). Key new artifact: `core/receipt-writer.mjs` as the shared write interface.

No external web research required. All relevant context available in-repo.
