/**
 * core/receipt-writer.mjs
 *
 * Thin facade — public API surface only.
 * Composes journal-appender + receipt-schema; re-exports audit helpers
 * so existing callers (facts-assembly.mjs) need no changes.
 *
 * ~40 lines of real logic; all implementation lives in sub-modules.
 */

import { JOURNAL_EVENT_TYPES } from "./journal-schema.mjs";
import { appendJournalLine, appendReceiptWriteWarn } from "./journal-appender.mjs";
import { validateEntryPayload, validateExitPayload, validateStepAutoRollbackPayload } from "./receipt-schema.mjs";
import { buildAuditSummaryFromJournalEvents as _buildAuditSummary } from "./audit-aggregator.mjs";

// The writer owns a process-local binding between an emitted entry and its
// terminal exit.  Journal reconciliation repeats this check durably later;
// this seam prevents a caller from accidentally pairing a live attempt with a
// different entry in the same executor process.
const activeEntries = new Map();

function attemptKey(payload) {
  return [payload.workflow_run_id, payload.stage_slug, payload.step_id, payload.attempt_id].join("\u0000");
}

// ---- re-exports for backward-compat callers ----

export { journalPathForTaskDir } from "./journal-appender.mjs";

/**
 * Re-export with the original destructured-options signature so
 * facts-assembly.mjs and existing tests need no changes.
 *
 * @param {object[]} events
 * @param {{ stageSlug: string, workflowRunId: string }} options
 * @returns {{ audit_summary: object, warnings: string[] }}
 */
export function buildAuditSummaryFromJournalEvents(events, { stageSlug, workflowRunId } = {}) {
  return _buildAuditSummary(events, stageSlug, workflowRunId);
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
export async function writeEntryReceipt(taskId, payload) {
  validateEntryPayload(payload);
  const key = attemptKey(payload);
  if (activeEntries.has(key)) {
    throw new TypeError("duplicate active entry for workflow_run_id, stage_slug, step_id, and attempt_id");
  }
  const { journal_entry_id } = await appendJournalLine(taskId, JOURNAL_EVENT_TYPES.STEP_ENTRY, payload);
  activeEntries.set(key, journal_entry_id);
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
export async function writeExitReceipt(taskId, payload) {
  // Validation throws on bad payload — intentionally propagates (caller bug).
  validateExitPayload(payload);
  const key = attemptKey(payload);
  const entryJournalId = activeEntries.get(key);
  if (entryJournalId == null || entryJournalId !== payload.entry_journal_entry_id) {
    throw new TypeError("entry_journal_entry_id must bind the active entry from the same attempt");
  }
  try {
    await appendJournalLine(taskId, JOURNAL_EVENT_TYPES.STEP_EXIT, payload);
    activeEntries.delete(key);
  } catch (err) {
    // Only I/O failures reach here. Append warn so audit-aggregator can recover the count.
    await appendReceiptWriteWarn(taskId, err, payload);
  }
}

/**
 * Write a STEP_AUTO_ROLLBACK event.
 *
 * @param {string} taskId
 * @param {object} payload
 * @returns {Promise<void>}
 */
export async function writeStepAutoRollback(taskId, payload) {
  validateStepAutoRollbackPayload(payload);
  await appendJournalLine(taskId, JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK, payload);
}
