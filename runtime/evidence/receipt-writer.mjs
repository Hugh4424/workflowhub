/**
 * runtime/evidence/receipt-writer.mjs
 *
 * Thin facade — public API surface only.
 * Composes journal-appender + receipt-schema; re-exports audit helpers
 * so existing callers (facts-assembly.mjs) need no changes.
 *
 * ~40 lines of real logic; all implementation lives in sub-modules.
 */

import { JOURNAL_EVENT_TYPES } from "../../core/journal-schema.mjs";
import { appendJournalLine, appendReceiptWriteWarn } from "../../core/journal-appender.mjs";
import { validateEntryPayload, validateExitPayload, validateStepAutoRollbackPayload } from "../../core/receipt-schema.mjs";
import { buildAuditSummaryFromJournalEvents as _buildAuditSummary } from "../../core/audit-aggregator.mjs";

// The writer owns a process-local binding between an emitted entry and its
// terminal exit.  Journal reconciliation repeats this check durably later;
// this seam prevents a caller from accidentally pairing a live attempt with a
// different entry in the same executor process.
const activeEntries = new Map();

function attemptKey(payload) {
  return [payload.workflow_run_id, payload.stage_slug, payload.step_id, payload.attempt_id].join("\u0000");
}

/**
 * Re-export with the original destructured-options signature so
 * facts-assembly.mjs and existing tests need no changes.
 *
 * @param {object[]} events
 * @param {{ stageSlug: string, workflowRunId: string }} options
 * @returns {{ audit_summary: object, warnings: string[] }}
 */
export function buildAuditSummaryFromJournalEvents(events, { stageSlug, workflowRunId, manifest, ledger, stale_refs, expected_evidence } = {}) {
  return _buildAuditSummary(events, stageSlug, workflowRunId, { manifest, ledger, stale_refs, expected_evidence });
}

// ---- write API ----

/**
 * Write a STEP_ENTRY receipt.
 * Returns the generated journal_entry_id so callers can bind future STEP_EXIT events.
 *
 * @param {string} taskId
 * @param {object} payload
 * @returns {Promise<{ journal_entry_id: string }>}
 */
export async function writeEntryReceipt(taskHandle, payload) {
  validateEntryPayload(payload);
  const key = attemptKey(payload);
  if (activeEntries.has(key)) {
    throw new TypeError("duplicate active entry for workflow_run_id, stage_slug, step_id, and attempt_id");
  }
  const { journal_entry_id } = await appendJournalLine(taskHandle, JOURNAL_EVENT_TYPES.STEP_ENTRY, payload);
  activeEntries.set(key, {
    journalEntryId: journal_entry_id,
    snapshotTree: payload.snapshot_tree,
  });
  return { journal_entry_id };
}

/**
 * Write a STEP_EXIT receipt.
 * Non-blocking: if the write fails, appends a receipt_write_warn event instead of throwing.
 * Validation failures (bad payload) still propagate — that is a caller bug.
 *
 * @param {string} taskId
 * @param {object} payload - Must include exit_journal_entry_id binding to the matching STEP_ENTRY
 * @returns {Promise<void>}
 */
export async function writeExitReceipt(taskHandle, payload) {
  // Validation throws on bad payload — intentionally propagates (caller bug).
  validateExitPayload(payload);
  const key = attemptKey(payload);
  const entry = activeEntries.get(key);
  if (entry == null || entry.journalEntryId !== payload.entry_journal_entry_id) {
    throw new TypeError("entry_journal_entry_id must bind the active entry from the same attempt");
  }
  if (entry.snapshotTree !== payload.snapshot_tree) {
    throw new TypeError("step exit snapshot_tree must match the active entry snapshot_tree");
  }
  try {
    await appendJournalLine(taskHandle, JOURNAL_EVENT_TYPES.STEP_EXIT, payload);
    activeEntries.delete(key);
  } catch (err) {
    // Only I/O failures reach here. Append warn so audit-aggregator can recover the count.
    await appendReceiptWriteWarn(taskHandle, err, payload);
  }
}

/**
 * Write a STEP_AUTO_ROLLBACK event.
 *
 * @param {string} taskId
 * @param {object} payload
 * @returns {Promise<void>}
 */
export async function writeStepAutoRollback(taskHandle, payload) {
  validateStepAutoRollbackPayload(payload);
  await appendJournalLine(taskHandle, JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK, payload);
}
