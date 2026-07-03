/**
 * core/journal-appender.mjs
 *
 * I/O layer — the only module that knows how to write files.
 * Non-blocking contract for exit receipt writes lives here, not in the schema layer.
 */

import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { JOURNAL_EVENT_TYPES, JOURNAL_SCHEMA_VERSION } from "./journal-schema.mjs";
import { parseTaskDir } from "./task-dir-parser.mjs";

// ---- private helpers ----

function journalPathForTask(taskId) {
  if (typeof taskId !== "string" || taskId.trim() === "") {
    throw new TypeError("taskId must be a non-empty string");
  }
  if (taskId.includes("..") || taskId.includes("/") || taskId.includes("\\")) {
    throw new TypeError("taskId must be a single task directory name");
  }
  return join(parseTaskDir(), taskId, "journal.jsonl");
}

// ---- public exports ----

/**
 * Returns the canonical journal.jsonl path inside a task spec directory.
 * Single source of truth — callers (e.g. facts-assembly) import from here
 * instead of computing the path independently.
 *
 * @param {string} taskSpecDir - Absolute path to the task's spec directory
 * @returns {string}
 */
export function journalPathForTaskDir(taskSpecDir) {
  return join(taskSpecDir, "journal.jsonl");
}

/**
 * Build a journal event object by merging payload with schema metadata.
 * For STEP_ENTRY events, a fresh journal_entry_id (UUID) is generated and
 * embedded in the returned event object as event.journal_entry_id.
 *
 * @param {string} eventType
 * @param {object} payload
 * @returns {object} the complete journal event to persist
 *   For STEP_ENTRY events, the returned object includes a `journal_entry_id` field.
 */
export function buildJournalEvent(eventType, payload) {
  const journal_entry_id =
    eventType === JOURNAL_EVENT_TYPES.STEP_ENTRY ? randomUUID() : null;

  return {
    ...(journal_entry_id !== null ? { journal_entry_id } : {}),
    ...payload,
    schema_version: JOURNAL_SCHEMA_VERSION,
    event_type: eventType,
    ts: new Date().toISOString(),
  };
}

/**
 * Append a single JSON event line to the task's journal.jsonl.
 * Creates the directory if it doesn't exist.
 *
 * For STEP_ENTRY events, generates a unique journal_entry_id and returns it.
 * For all other event types, returns null.
 *
 * @param {string} taskId
 * @param {string} eventType
 * @param {object} payload
 * @returns {Promise<{ journal_entry_id: string|null }>}
 */
export async function appendJournalLine(taskId, eventType, payload) {
  const event = buildJournalEvent(eventType, payload);
  const journalPath = journalPathForTask(taskId);
  await mkdir(dirname(journalPath), { recursive: true });
  await appendFile(journalPath, `${JSON.stringify(event)}\n`, "utf8");
  return { journal_entry_id: event.journal_entry_id ?? null };
}

/**
 * Append a receipt_write_warn event to the journal (non-blocking).
 * Carries the original exit payload so audit-aggregator can recover it.
 * If the warn append also fails, emits to stderr but does not throw.
 *
 * AC-010 / FR-SGA-013: exit_receipt write failure must never block step completion.
 *
 * @param {string} taskId
 * @param {Error|*} writeError
 * @param {object} exitPayload - The original exit payload that failed to write (full, unclipped)
 * @returns {Promise<void>}
 */
export async function appendReceiptWriteWarn(taskId, writeError, exitPayload) {
  const warnEvent = {
    event: "receipt_write_warn",
    workflow_run_id: exitPayload?.workflow_run_id ?? null,
    ts: new Date().toISOString(),
    reason: writeError instanceof Error ? writeError.message : String(writeError),
    original_exit_payload: exitPayload,
  };

  try {
    const journalPath = journalPathForTask(taskId);
    await mkdir(dirname(journalPath), { recursive: true });
    await appendFile(journalPath, `${JSON.stringify(warnEvent)}\n`, "utf8");
  } catch (warnError) {
    const reason = warnError instanceof Error ? warnError.message : String(warnError);
    process.stderr.write(
      `[receipt-writer] receipt_write_warn could not be written (${reason}); original error: ${writeError instanceof Error ? writeError.message : String(writeError)}\n`,
    );
  }
}
