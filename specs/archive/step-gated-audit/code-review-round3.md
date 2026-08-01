# step-gated-audit Code Review — Round 3

**Review date**: 2026-07-03
**Reviewer**: verify-code agent (3rd-review skill)
**Branch**: refactor/receipt-writer-split
**HEAD**: a031a7b
**Commits reviewed**: aab03f0..a031a7b (commits 6797df1 + a031a7b)
**Files reviewed**: core/journal-appender.mjs, runtime/evidence/receipt-writer.mjs, core/receipt-schema.mjs, core/chain-topology.mjs, core/audit-aggregator.mjs, core/__tests__/receipt-writer.test.mjs
**Test result**: 955/955 passed (all pre-existing guard failures resolved)

---

## verdict: passed

---

## Summary

Round 3 reviews the two commits on top of the split-monolith base (aab03f0):

- **6797df1**: R1/R2/R4 redesign — journal_entry_id generation in appender, receipt-writer facade, chain-topology discoverChainNodes, audit-aggregator counting refactor.
- **a031a7b**: Fix — restore legacy step_id fallback for entry events without journal_entry_id (blocked_step_count was always 0 for test fixtures).

---

## Checklist

### AC-001 — STEP_ENTRY generates journal_entry_id
`journal-appender.mjs:52-53`: `buildJournalEvent` calls `randomUUID()` for STEP_ENTRY, embeds it in the event object. `appendJournalLine` returns `{ journal_entry_id }`. `writeEntryReceipt` returns that ID to callers. **PASS**

### AC-002 — exit_journal_entry_id binds STEP_EXIT to its STEP_ENTRY
`receipt-schema.mjs:186-188`: `exit_journal_entry_id` optional; validated as non-empty string when present. `receipt-writer.mjs:57-66`: `writeExitReceipt` passes payload (including `exit_journal_entry_id`) straight to appender. **PASS**

### AC-003 — topology uses journal_entry_id identity, not step_id
`chain-topology.mjs`: `discoverChainNodes` tracks `visitedEntryIds` (keyed by `journal_entry_id`, falls back to `step_id:<id>` sentinel for legacy events). Cycle guard uses entry-ID identity, not step_id. `firstByStepAndEntry` keys by `step_id::exit_journal_entry_id`. **PASS**

### AC-004 — counting does not shift on retry
`audit-aggregator.mjs:125-126`: topology built from `firstByStepAndEntry` (first-exit map). Counting uses `latestByStepAndEntry` on chain-selected nodes only. The two maps are independent, preserving first/latest separation. **PASS**

### AC-005 — blocked_step_count correct for legacy events (no journal_entry_id)
`audit-aggregator.mjs:142-149`: `entryByStepId` built as fallback. When `node.journal_entry_id === null`, falls back to `entryByStepId.get(node.step_id)`. Tests `buildAuditSummaryFromJournalEvents merges entries, exits...` and `uses journal-order topology...` both pass. **PASS**

### AC-006 — exit write failure is non-blocking
`receipt-writer.mjs:57-66`: `writeExitReceipt` catches I/O errors, calls `appendReceiptWriteWarn`, does not rethrow. Validation errors (bad payload) still propagate — correct. `appendReceiptWriteWarn` catches its own failure and emits to stderr. **PASS**

### AC-007 — receipt_write_warn recovery uses original_exit_payload.workflow_run_id
`audit-aggregator.mjs:103-115`: warn filter uses `payload.workflow_run_id !== workflowRunId` (not top-level event field). Pair dedup uses `step_id::exit_journal_entry_id`. **PASS**

### AC-008 — validateReviewPayload handles executed=false without throwing
`receipt-schema.mjs:115-140`: when `executed=false`, all fields are optional (checked only when non-null). **PASS**

### AC-009 — discoverChainStepIds backward-compat shim
`chain-topology.mjs:211-251`: wraps `discoverChainNodes`, returns legacy `{ stepIds, selectedEntries, warnings }` shape. Existing callers untouched. **PASS**

### AC-010 — no self-sign (write-permission isolation)
`receipt-writer.mjs`: `writeEntryReceipt` uses `writer_namespace` from payload (validated non-empty). Namespace enforcement is caller responsibility per spec; the schema validates presence. No write path bypasses validation. **PASS**

---

## Issues found: 0 blockers, 0 medium

No blocking or medium issues found. All 10 ACs verified against implementation. 955/955 tests green with no pre-existing guard failures remaining.

---

## stage-result

```json
{
  "review_round": 3,
  "verdict": "passed",
  "findings_count": 0,
  "blocker_count": 0,
  "test_result": "955/955",
  "head_sha": "a031a7b",
  "evidence_path": "specs/step-gated-audit/code-review-round3.md"
}
```
