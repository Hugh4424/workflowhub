import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
  AUDIT_SUMMARY_FIELDS,
  JOURNAL_EVENT_TYPES,
  JOURNAL_SCHEMA_VERSION,
  STEP_AUTO_ROLLBACK_REQUIRED_FIELDS,
} from "./journal-schema.mjs";
import { parseTaskDir } from "./task-dir-parser.mjs";

const STAGE_SLUGS = new Set(["bs", "bp", "bc", "vc", "md"]);
const STEP_TYPES = new Set(["work", "review", "check"]);
const CHECK_STATUSES = new Set(["ok", "blocked", "skipped"]);
const EXIT_VERDICTS = new Set(["passed", "blocked", "skipped", "unknown"]);
const JUDGEMENT_STATUSES = new Set(["blocked"]);
const REVIEW_VERDICTS = new Set(["passed", "revise_required", "escalate_to_human", "unknown"]);
const FIX_STATUSES = new Set(["fixed", "not_required", "pending", "unknown"]);
const STEP_ID_PATTERN =
  /^(?:bc\.(?:work|review|check)\.(?:ph\d+(?:\.\d+)?|\d+)|(?:bs|bp|vc|md)\.(?:work|review|check)\.(?:ph\d+|\d+))$/;

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

function parseStepId(value) {
  assertStepId(value);
  const [stageSlug, stepType] = value.split(".");
  return { stageSlug, stepType };
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

function assertBoolean(value, name) {
  if (typeof value !== "boolean") {
    throw new TypeError(`${name} must be a boolean`);
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
    ...payload,
    schema_version: JOURNAL_SCHEMA_VERSION,
    event_type: eventType,
    ts: new Date().toISOString(),
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
  const parsedStepId = parseStepId(payload.step_id);
  if (payload.stage_slug !== parsedStepId.stageSlug) {
    throw new TypeError("stage_slug must match step_id");
  }
  if (payload.step_type !== parsedStepId.stepType) {
    throw new TypeError("step_type must match step_id");
  }
  assertIntegerAtLeastOne(payload.step_seq, "step_seq");
  assertEnum(payload.check_status, CHECK_STATUSES, "check_status");
  assertNullableStepId(payload.prev_step_id, "prev_step_id");
  assertNullableStepId(payload.next_step_id, "next_step_id");
  assertNonEmptyString(payload.writer_namespace, "writer_namespace");
  assertNonEmptyString(payload.workflow_run_id, "workflow_run_id");
  validateJudgementPayload(payload);

  if (payload.check_status === "skipped") {
    assertNonEmptyString(payload.authorized_by, "authorized_by");
    assertNonEmptyString(payload.skip_reason, "skip_reason");
  }
}

function validateJudgementPayload(payload) {
  if (payload.judgement === undefined) return;
  if (payload.check_status !== "blocked") {
    throw new TypeError("judgement requires check_status blocked");
  }

  assertObject(payload.judgement, "judgement");
  assertEnum(payload.judgement.status, JUDGEMENT_STATUSES, "judgement.status");
  assertNonEmptyString(payload.judgement.reason, "judgement.reason");
  assertBoolean(payload.judgement.retry_eligible, "judgement.retry_eligible");
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
  assertNonEmptyString(payload.workflow_run_id, "workflow_run_id");
  assertEnum(payload.verdict, EXIT_VERDICTS, "verdict");
  assertNonEmptyString(payload.executor_namespace, "executor_namespace");
  assertNullableStepId(payload.prev_step_id, "prev_step_id");
  assertNullableStepId(payload.next_step_id, "next_step_id");
  validateReviewPayload(payload.review);
}

function validateStepAutoRollbackPayload(payload) {
  assertObject(payload, "stepAutoRollbackPayload");

  for (const field of STEP_AUTO_ROLLBACK_REQUIRED_FIELDS) {
    switch (field) {
      case "workflow_run_id":
      case "reason":
        assertNonEmptyString(payload[field], field);
        break;
      case "affected_step_id":
      case "rollback_from_step_id":
      case "rollback_to_step_id":
        assertStepId(payload[field], field);
        break;
      case "attempt_seq":
        assertIntegerAtLeastOne(payload[field], field);
        break;
      case "ineffective":
        assertBoolean(payload[field], field);
        break;
      default:
        throw new TypeError(`unknown step_auto_rollback schema field: ${field}`);
    }
  }
}

function isStageStepId(stepId, stageSlug) {
  return typeof stepId === "string" && stepId.startsWith(`${stageSlug}.`);
}

function latestByStepId(events) {
  const map = new Map();
  for (const event of events) {
    map.set(event.step_id, event);
  }
  return map;
}

function firstByStepId(events) {
  const map = new Map();
  for (const event of events) {
    if (!map.has(event.step_id)) {
      map.set(event.step_id, event);
    }
  }
  return map;
}

function orderedDistinctHeads(entryEvents, stageSlug) {
  const heads = [];

  for (const event of entryEvents) {
    if (event.prev_step_id !== null && isStageStepId(event.prev_step_id, stageSlug)) continue;
    heads.push(event);
  }

  return heads;
}

function orderedDistinctUnvisitedNextEntries(entryEvents, currentStepId, visited) {
  const entries = [];
  const seenStepIds = new Set();

  for (const event of entryEvents) {
    if (event.prev_step_id !== currentStepId) continue;
    if (visited.has(event.step_id)) continue;
    if (seenStepIds.has(event.step_id)) continue;
    seenStepIds.add(event.step_id);
    entries.push(event);
  }

  return entries;
}

function firstEntryForStepId(entryEvents, stepId) {
  return entryEvents.find((event) => event.step_id === stepId);
}

function discoverChainStepIds(entryEvents, exitByStepId, stageSlug) {
  const warnings = [];
  const heads = orderedDistinctHeads(entryEvents, stageSlug);
  const head = heads[0];
  if (!head) return { stepIds: [], warnings: ["missing_chain_head"] };
  if (heads.length > 1) warnings.push("duplicate_chain_heads");

  const stepIds = [];
  const visited = new Set();
  let topologyEntry = head;

  while (topologyEntry) {
    const currentStepId = topologyEntry.step_id;
    if (visited.has(currentStepId)) {
      warnings.push(`cycle_detected:${currentStepId}`);
      break;
    }

    visited.add(currentStepId);
    stepIds.push(currentStepId);

    const exit = exitByStepId.get(currentStepId);
    if (!Object.prototype.hasOwnProperty.call(topologyEntry, "next_step_id")) {
      warnings.push(`missing_entry_next_step_id:${currentStepId}`);
      break;
    }
    if (exit && !Object.prototype.hasOwnProperty.call(exit, "next_step_id")) {
      warnings.push(`missing_exit_next_step_id:${currentStepId}`);
      break;
    }
    if (exit && topologyEntry.next_step_id !== null && exit.next_step_id !== topologyEntry.next_step_id) {
      warnings.push(`pointer_mismatch:${currentStepId}`);
      break;
    }
    const explicitNext = exit ? exit.next_step_id : topologyEntry.next_step_id;
    if (exit && explicitNext === null) break;
    if (explicitNext != null) {
      if (!isStageStepId(explicitNext, stageSlug)) break;
      const nextEntry = firstEntryForStepId(entryEvents, explicitNext);
      if (!nextEntry) {
        warnings.push(`missing_link:${currentStepId}->${explicitNext}`);
        break;
      }
      topologyEntry = nextEntry;
      continue;
    }

    const nextCandidateEntries = orderedDistinctUnvisitedNextEntries(entryEvents, currentStepId, visited);
    if (nextCandidateEntries.length === 0) break;
    if (nextCandidateEntries.length > 1) {
      warnings.push(`duplicate_next:${currentStepId}`);
      break;
    }
    topologyEntry = nextCandidateEntries[0];
  }

  return { stepIds, warnings };
}

export function buildAuditSummaryFromJournalEvents(events, { stageSlug, workflowRunId } = {}) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array");
  }
  assertEnum(stageSlug, STAGE_SLUGS, "stageSlug");
  assertNonEmptyString(workflowRunId, "workflowRunId");

  const sameRun = (event) => event?.workflow_run_id === workflowRunId;
  const sameStageStep = (stepId) => isStageStepId(stepId, stageSlug);
  const entryEvents = events.filter(
    (event) => event?.event_type === JOURNAL_EVENT_TYPES.STEP_ENTRY && sameRun(event) && sameStageStep(event.step_id),
  );
  const exitEvents = events.filter(
    (event) => event?.event_type === JOURNAL_EVENT_TYPES.STEP_EXIT && sameRun(event) && sameStageStep(event.step_id),
  );
  const exitByStepId = latestByStepId(exitEvents);
  const firstExitByStepId = firstByStepId(exitEvents);
  const entryByStepId = latestByStepId(entryEvents);
  const { stepIds, warnings } = discoverChainStepIds(entryEvents, firstExitByStepId, stageSlug);
  const reachable = new Set(stepIds);

  let passed_step_count = 0;
  let blocked_step_count = 0;
  let skipped_step_count = 0;

  for (const stepId of stepIds) {
    const entry = entryByStepId.get(stepId);
    const exit = exitByStepId.get(stepId);
    if (entry?.check_status === "skipped") skipped_step_count += 1;
    if (exit?.verdict === "passed") passed_step_count += 1;
    if (entry?.check_status === "blocked" || entry?.judgement?.status === "blocked" || exit?.verdict === "blocked") {
      blocked_step_count += 1;
    }
  }

  let rollback_count = 0;
  for (const event of events) {
    if (event?.event_type !== JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK || !sameRun(event)) continue;
    if (!sameStageStep(event.affected_step_id) || !reachable.has(event.affected_step_id)) continue;
    rollback_count += 1;
    if (
      !sameStageStep(event.rollback_from_step_id) ||
      !sameStageStep(event.rollback_to_step_id) ||
      !reachable.has(event.rollback_from_step_id) ||
      !reachable.has(event.rollback_to_step_id)
    ) {
      warnings.push(`rollback_pointer_outside_chain:${event.affected_step_id}`);
    }
  }

  const audit_summary = {
    total_step_count: stepIds.length,
    passed_step_count,
    blocked_step_count,
    skipped_step_count,
    rollback_count,
  };
  for (const field of AUDIT_SUMMARY_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(audit_summary, field)) {
      throw new TypeError(`audit_summary missing schema field: ${field}`);
    }
  }

  return {
    audit_summary,
    warnings,
  };
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

export async function writeStepAutoRollback(taskId, payload) {
  validateStepAutoRollbackPayload(payload);
  await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK, payload));
}
