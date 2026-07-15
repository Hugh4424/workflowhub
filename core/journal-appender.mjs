/** Controlled journal event construction and TaskHandle persistence. */

import { randomUUID } from "node:crypto";

import { JOURNAL_EVENT_TYPES, JOURNAL_SCHEMA_VERSION } from "./journal-schema.mjs";
import { assertTaskHandle } from "./task-handle.mjs";

export function buildJournalEvent(eventType, payload) {
  if (!Object.values(JOURNAL_EVENT_TYPES).includes(eventType)) throw new TypeError(`unknown journal event type: ${eventType}`);
  const journalEntryId = eventType === JOURNAL_EVENT_TYPES.STEP_ENTRY ? randomUUID() : null;
  return {
    ...(journalEntryId ? { journal_entry_id: journalEntryId } : {}),
    ...payload,
    schema_version: JOURNAL_SCHEMA_VERSION,
    event_type: eventType,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    ts: new Date().toISOString(),
  };
}

export async function appendJournalLine(taskHandle, eventType, payload) {
  const task = assertTaskHandle(taskHandle);
  const event = buildJournalEvent(eventType, payload);
  task.appendJournal(event);
  return { journal_entry_id: event.journal_entry_id ?? null };
}

export async function appendReceiptWriteWarn(taskHandle, writeError, exitPayload) {
  const task = assertTaskHandle(taskHandle);
  try {
    task.appendJournal({
      event: "receipt_write_warn",
      workflow_run_id: exitPayload?.workflow_run_id ?? null,
      ts: new Date().toISOString(),
      reason: writeError instanceof Error ? writeError.message : String(writeError),
      original_exit_payload: exitPayload,
    });
  } catch (warnError) {
    process.stderr.write(`[receipt-writer] receipt_write_warn could not be written (${warnError.message}); original error: ${writeError.message}\n`);
  }
}
