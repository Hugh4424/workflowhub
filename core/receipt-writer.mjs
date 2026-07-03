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
import { appendJournalLine, appendReceiptWriteWarn, buildJournalEvent } from "./journal-appender.mjs";
import { validateEntryPayload, validateExitPayload, validateStepAutoRollbackPayload } from "./receipt-schema.mjs";
import { buildAuditSummaryFromJournalEvents as _buildAuditSummary } from "./audit-aggregator.mjs";

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

export async function writeEntryReceipt(taskId, payload) {
  validateEntryPayload(payload);
  await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_ENTRY, payload));
}

export async function writeExitReceipt(taskId, payload) {
  validateExitPayload(payload);
  try {
    await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_EXIT, payload));
  } catch (err) {
    await appendReceiptWriteWarn(taskId, err, payload);
  }
}

export async function writeStepAutoRollback(taskId, payload) {
  validateStepAutoRollbackPayload(payload);
  await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK, payload));
}
