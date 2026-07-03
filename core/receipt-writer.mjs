import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { JOURNAL_EVENT_TYPES, JOURNAL_SCHEMA_VERSION } from "./journal-schema.mjs";
import { parseTaskDir } from "./task-dir-parser.mjs";

const STAGE_SLUGS = new Set(["bs", "bp", "bc", "vc", "md"]);
const STEP_TYPES = new Set(["work", "review", "check"]);
const CHECK_STATUSES = new Set(["ok", "blocked", "skipped"]);
const EXIT_VERDICTS = new Set(["passed", "blocked", "skipped", "unknown"]);
const REVIEW_VERDICTS = new Set(["passed", "revise_required", "unknown"]);
const FIX_STATUSES = new Set(["fixed", "not_required", "pending", "unknown"]);
const STEP_ID_PATTERN = /^(bs|bp|bc|vc|md)\.(work|review|check)\.(?:ph\d+|\d+)$/;

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function assertNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function assertNullableStepId(value, name) {
  if (value === null) return;
  assertStepId(value, name);
}

function assertStepId(value, name = "step_id") {
  assertNonEmptyString(value, name);
  if (!STEP_ID_PATTERN.test(value)) {
    throw new TypeError(`${name} must match {stage_slug}.{step_type}.{step_seq_label}`);
  }
}

function assertEnum(value, allowed, name) {
  if (!allowed.has(value)) {
    throw new TypeError(`${name} must be one of: ${Array.from(allowed).join(", ")}`);
  }
}

function assertIntegerAtLeastOne(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${name} must be an integer >= 1`);
  }
}

function journalPathForTask(taskId) {
  assertNonEmptyString(taskId, "taskId");
  if (taskId.includes("..") || taskId.includes("/") || taskId.includes("\\")) {
    throw new TypeError("taskId must be a single task directory name");
  }
  return join(parseTaskDir(), taskId, "journal.jsonl");
}

function buildJournalEvent(eventType, payload) {
  return {
    schema_version: JOURNAL_SCHEMA_VERSION,
    event_type: eventType,
    ts: new Date().toISOString(),
    ...payload,
  };
}

async function appendJournalLine(taskId, event) {
  const journalPath = journalPathForTask(taskId);
  await mkdir(dirname(journalPath), { recursive: true });
  await appendFile(journalPath, `${JSON.stringify(event)}\n`, "utf8");
}

async function appendReceiptWriteWarn(taskId, writeError) {
  const warnEvent = {
    event: "receipt_write_warn",
    ts: new Date().toISOString(),
    reason: writeError instanceof Error ? writeError.message : String(writeError),
  };

  try {
    await appendJournalLine(taskId, warnEvent);
  } catch (warnError) {
    const reason = warnError instanceof Error ? warnError.message : String(warnError);
    console.warn(`receipt_write_warn could not be written: ${reason}`);
  }
}

function validateEntryPayload(payload) {
  assertObject(payload, "entryReceiptPayload");
  assertStepId(payload.step_id);
  assertEnum(payload.stage_slug, STAGE_SLUGS, "stage_slug");
  assertEnum(payload.step_type, STEP_TYPES, "step_type");
  assertIntegerAtLeastOne(payload.step_seq, "step_seq");
  assertEnum(payload.check_status, CHECK_STATUSES, "check_status");
  assertNullableStepId(payload.prev_step_id, "prev_step_id");
  assertNullableStepId(payload.next_step_id, "next_step_id");
  assertNonEmptyString(payload.writer_namespace, "writer_namespace");
  assertNonEmptyString(payload.workflow_run_id, "workflow_run_id");

  if (payload.check_status === "skipped") {
    assertNonEmptyString(payload.skip_reason, "skip_reason");
  }
}

function validateReviewPayload(review) {
  assertObject(review, "review");
  if (review.skill !== "3rd-review") {
    throw new TypeError('review.skill must be "3rd-review"');
  }
  if (typeof review.executed !== "boolean") {
    throw new TypeError("review.executed must be a boolean");
  }
  assertNonEmptyString(review.source, "review.source");
  assertNonEmptyString(review.provider, "review.provider");
  if (typeof review.true_cross_engine !== "boolean") {
    throw new TypeError("review.true_cross_engine must be a boolean");
  }
  assertEnum(review.verdict, REVIEW_VERDICTS, "review.verdict");
  assertIntegerAtLeastOne(review.round, "review.round");
  assertNonEmptyString(review.report_path, "review.report_path");
  assertNonEmptyString(review.raw_result_path, "review.raw_result_path");
  assertEnum(review.fix_status, FIX_STATUSES, "review.fix_status");
}

function validateExitPayload(payload) {
  assertObject(payload, "exitReceiptPayload");
  assertStepId(payload.step_id);
  assertEnum(payload.verdict, EXIT_VERDICTS, "verdict");
  assertNonEmptyString(payload.executor_namespace, "executor_namespace");
  assertNullableStepId(payload.prev_step_id, "prev_step_id");
  assertNullableStepId(payload.next_step_id, "next_step_id");
  validateReviewPayload(payload.review);
}

export async function writeEntryReceipt(taskId, payload) {
  validateEntryPayload(payload);
  await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_ENTRY, payload));
}

export async function writeExitReceipt(taskId, payload) {
  validateExitPayload(payload);

  try {
    await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_EXIT, payload));
  } catch (err) {
    await appendReceiptWriteWarn(taskId, err);
  }
}
