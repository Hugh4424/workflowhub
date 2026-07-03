/**
 * core/journal-appender.mjs
 *
 * I/O layer — the only module that knows how to write files.
 * Non-blocking contract for exit receipt writes lives here, not in the schema layer.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { JOURNAL_SCHEMA_VERSION } from "./journal-schema.mjs";
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
 * Kept internal-ish but exported so the facade can use it without duplicating logic.
 *
 * @param {string} eventType
 * @param {object} payload
 * @returns {object}
 */
export function buildJournalEvent(eventType, payload) {
  return {
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
 * @param {string} taskId
 * @param {object} event
 * @returns {Promise<void>}
 */
export async function appendJournalLine(taskId, event) {
  const journalPath = journalPathForTask(taskId);
  await mkdir(dirname(journalPath), { recursive: true });
  await appendFile(journalPath, `${JSON.stringify(event)}\n`, "utf8");
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
    ts: new Date().toISOString(),
    reason: writeError instanceof Error ? writeError.message : String(writeError),
    original_exit_payload: exitPayload,
  };

  try {
    await appendJournalLine(taskId, warnEvent);
  } catch (warnError) {
    const reason = warnError instanceof Error ? warnError.message : String(warnError);
    process.stderr.write(
      `[receipt-writer] receipt_write_warn could not be written (${reason}); original error: ${writeError instanceof Error ? writeError.message : String(writeError)}\n`,
    );
  }
}
