# Data Contracts: step-gated-audit

**Task ID**: `step-gated-audit`
**Date**: 2026-07-03
**Source**: spec.md FR-SGA-001 ~ FR-SGA-015, decision-log D1–D9

---

## Overview

This document captures all cross-boundary data structures exchanged between the audit layer, the 5 stage SKILL.md files, the runner/workflow layer, and the unified journal/stage-result persistence base.

---

## Contract 1: entry_receipt

**Name**: `entry_receipt`
**Owner side**: audit component / before-step hook (writer)
**Consumer side**: runner/workflow layer (reads judgement), journal persistence, next step's before-step (reads prev pointer)
**Written to**: `journal.jsonl` as event_type `step_entry`

### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `step_id` | string | format: `{stage_slug}.{step_type}.{step_seq}` e.g. `bc.work.ph1` | Unique step identifier |
| `stage_slug` | string | enum: `bs`, `bp`, `bc`, `vc`, `md` | Stage abbreviation per FR-SGA-010 |
| `step_type` | string | enum: `work`, `review`, `check` | Defined by each stage's SKILL.md |
| `step_seq` | integer | >= 1 | Sequence number within stage, from 1 |
| `check_status` | string | enum: `ok`, `blocked`, `skipped` | Result of before-step check |
| `prev_step_id` | string \| null | null for first step | Previous step's step_id (local-pointer chain) |
| `next_step_id` | string \| null | null until known | Next step's step_id (may be filled retroactively) |
| `writer_namespace` | string | non-empty | Identity of the before-step writer (for self-review detection) |
| `workflow_run_id` | string | non-empty | Run instance ID; rollback_count is scoped to this ID |

### Conditional Fields

| Field | Type | Condition | Description |
|-------|------|-----------|-------------|
| `skip_reason` | string | required when `check_status=skipped` | Human-readable reason; must not be empty if skipped |

### Validation Rules

- `check_status` MUST NOT default to `skipped` without explicit authorization (FR-SGA-014).
- If entry_receipt write fails: step is blocked (`fail-closed`), runner does NOT proceed (FR-SGA-013).
- `step_id` must be unique within a `workflow_run_id`.

---

## Contract 2: exit_receipt

**Name**: `exit_receipt`
**Owner side**: audit component / after-step hook (writer)
**Consumer side**: runner/workflow layer (reads verdict), journal persistence, audit_summary aggregation
**Written to**: `journal.jsonl` as event_type `step_exit`

### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `step_id` | string | same as paired entry_receipt | Links exit to entry |
| `verdict` | string | enum: `passed`, `blocked`, `skipped`, `unknown` | Overall step outcome (FR-SGA-002) |
| `executor_namespace` | string | non-empty | Identity of the step executor (for self-review detection per FR-SGA-008) |
| `prev_step_id` | string \| null | mirrors entry | Maintained for traversal consistency |
| `next_step_id` | string \| null | null until known | Next step pointer |

### 3rd-Review Sub-Record (10 fields, all required, FR-SGA-007)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `review.skill` | string | literal: `3rd-review` | Review skill identifier |
| `review.executed` | boolean | — | Whether review actually ran |
| `review.source` | string | — | Description of review source |
| `review.provider` | string | — | Review engine provider (e.g. `codex`, `claude`) |
| `review.true_cross_engine` | boolean | — | Whether truly cross-engine |
| `review.verdict` | string | enum: `passed`, `revise_required`, `unknown` | Review outcome |
| `review.round` | integer | >= 1 | Which review round (starting from 1) |
| `review.report_path` | string | — | Path to review report |
| `review.raw_result_path` | string | — | Path to raw result output |
| `review.fix_status` | string | enum: `fixed`, `not_required`, `pending`, `unknown` | Revision status |

### Validation Rules

- If 3rd-review call fails/times out: `review.executed=false`, `review.verdict=unknown`, reason in journal warn. Step NOT blocked (FR-SGA-007).
- If exit_receipt write fails: warn logged, step result preserved — does NOT block (FR-SGA-013 warn-only for exit).
- If `writer_namespace == executor_namespace`: warn logged to journal, `review.source` notes "potential self-review risk", 3rd-review still called (FR-SGA-008).

---

## Contract 3: judgement

**Name**: `judgement`
**Owner side**: audit component (before-step, emits when check_status=blocked)
**Consumer side**: runner/workflow layer (executes rollback or escalates)

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `status` | string | enum: `blocked` | Only emitted on blocked (FR-SGA-003) |
| `reason` | string | non-empty | Human-readable block reason |
| `retry_eligible` | boolean | — | Whether rollback retry is permitted |

### Runner Behavior on Receipt (FR-SGA-003, D9)

- rollback_count < 2 AND retry_eligible=true: rollback to previous step, re-execute.
- rollback_count >= 2: escalate to human, stop auto-rollback.
- If current step is first step in stage: no prior step to roll back to → record blocked journal event, mark stage blocked, escalate to stage-layer.

---

## Contract 4: journal event_type extensions

**Name**: `journal event_type enum`
**Owner side**: `core/journal-schema.mjs` (schema definition)
**Consumer side**: all 5 stage SKILL.md files (writers), reporting/analysis tools (readers)

### New Event Types (additive)

| event_type | Trigger | Key fields |
|------------|---------|------------|
| `step_entry` | before-step hook fires | entry_receipt payload |
| `step_exit` | after-step hook fires | exit_receipt payload |
| `step_auto_rollback` | runner executes rollback | workflow_run_id, affected_step_id, rollback_from_step_id, rollback_to_step_id, attempt_seq, ineffective, reason |

### Compatibility

- Additive only — existing readers that do not recognize new event types MUST skip/ignore them (standard journal append-only contract).
- Schema version bump required (breaking new enum members signal intent).

---

## Contract 5: audit_summary (stage-result.json)

**Name**: `audit_summary`
**Owner side**: audit component (aggregates after stage completes)
**Consumer side**: `stage-result.json` consumers, reporting layer
**Written to**: `stage-result.json` top-level field

### Fields (all required, FR-SGA-005)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `total_step_count` | integer | >= 0 | All steps processed in this stage run |
| `passed_step_count` | integer | >= 0 | Steps with verdict=passed |
| `blocked_step_count` | integer | >= 0 | Steps that were blocked |
| `skipped_step_count` | integer | >= 0 | Steps with check_status=skipped |
| `rollback_count` | integer | >= 0 | Auto-rollbacks triggered in this workflow_run_id |

### Validation Rules

- `blocked_step_count` and `rollback_count` are independent counters and MUST NOT be assumed equal (FR-SGA-005).
- `rollback_count` is scoped to `workflow_run_id`; resets to 0 for each new run (FR-SGA-006).
- No `receipts/` directory or separate receipt file format may exist — all receipt data lives in `journal.jsonl` (FR-SGA-004).

---

## Contract 6: step_id format

**Name**: `step_id naming convention`
**Owner side**: each stage SKILL.md (defines step_type and step_seq)
**Consumer side**: entry_receipt, exit_receipt, journal traversal, audit_summary aggregation

### Format

```
{stage_slug}.{step_type}.{step_seq_label}
```

| Component | Source | Examples |
|-----------|--------|---------|
| `stage_slug` | FR-SGA-010 mapping table | `bs`, `bp`, `bc`, `vc`, `md` |
| `step_type` | each stage's SKILL.md | `work`, `review`, `check` |
| `step_seq_label` | from 1, or `ph{N}` for build-code phases | `ph1`, `ph2`, `1`, `2` |

### Examples

- `bc.work.ph3` — build-code, work step, phase 3
- `bs.review.1` — build-spec, review step, sequence 1
- `md.check.2` — make-decision, check step, sequence 2

### Uniqueness Rule

- Must be unique within a `workflow_run_id`. Global uniqueness not required (FR-SGA-015 — no global registry).

---

## Contract 7: receipt-writer interface (core/receipt-writer.mjs)

**Name**: `receipt-writer`
**Owner side**: `core/receipt-writer.mjs` (new module)
**Consumer side**: all 5 stage SKILL.md before-step / after-step hooks

### Interface

```javascript
// Write entry receipt before a step
writeEntryReceipt(taskId, entryReceiptPayload): Promise<void>
// Throws on failure (fail-closed per FR-SGA-013)

// Write exit receipt after a step
writeExitReceipt(taskId, exitReceiptPayload): Promise<void>
// Logs warn on failure, does not throw (warn-only per FR-SGA-013)
```

### Compatibility Rules

- No third-party dependencies (follows core module convention).
- Appends to existing `journal.jsonl` path — does not create a new file format.
- Path resolution via `core/task-dir-parser.mjs` (per AC-16 pattern).

---

## Version Compatibility Summary

| Contract | Change Type | Backward Compatible? | Notes |
|----------|-------------|---------------------|-------|
| journal event_type | Additive enum | Yes (unknown-skip readers) | Schema version bump needed |
| stage-result audit_summary | Additive field | Yes (unknown-field readers) | New top-level key |
| entry_receipt / exit_receipt | New records | Yes (new event types) | No existing receipts format to break |
| step_id format | New convention | N/A (new) | Defined here for first time |
| receipt-writer.mjs | New module | N/A (new) | No existing module replaced |
