/**
 * core/receipt-schema.mjs
 *
 * Pure validation layer. No I/O, no file-system calls.
 * Assertion failures throw TypeError — caller decides how to handle.
 */

import { STEP_AUTO_ROLLBACK_REQUIRED_FIELDS, TERMINAL_STATUSES } from "./journal-schema.mjs";

const STAGE_SLUGS = new Set(["bs", "bp", "bc", "vc", "md"]);
const STEP_TYPES = new Set(["work", "review", "check"]);
const CHECK_STATUSES = new Set(["ok", "blocked", "skipped"]);
const EXIT_VERDICTS = new Set(["passed", "blocked", "skipped", "unknown"]);
const JUDGEMENT_STATUSES = new Set(["blocked"]);
const REVIEW_VERDICTS = new Set(["passed", "revise_required", "escalate_to_human", "unknown"]);
const FIX_STATUSES = new Set(["fixed", "not_required", "pending", "unknown"]);
const TERMINAL_STATUS_SET = new Set(TERMINAL_STATUSES);
const STEP_ID_PATTERN =
  /^(?:bc\.(?:work|review|check)\.(?:ph\d+(?:\.\d+)?|\d+)|(?:bs|bp|vc|md)\.(?:work|review|check)\.\d+)$/;

// ---- internal assert helpers ----

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

function assertTimestamp(value, name = "timestamp") {
  assertNonEmptyString(value, name);
  if (Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${name} must be an RFC3339 timestamp`);
  }
}

function assertEvidence(value, name) {
  assertObject(value, name);
  assertNonEmptyString(value.kind, `${name}.kind`);
  assertNonEmptyString(value.uri_or_path, `${name}.uri_or_path`);
}

function isCanonicalReceipt(payload) {
  return payload.event_type !== undefined || payload.attempt_id !== undefined ||
    payload.timestamp !== undefined || payload.entry_evidence !== undefined ||
    payload.completion_evidence !== undefined || payload.terminal_status !== undefined;
}

function validateCanonicalIdentity(payload, eventType) {
  assertNonEmptyString(payload.workflow_run_id, "workflow_run_id");
  assertEnum(payload.stage_slug, STAGE_SLUGS, "stage_slug");
  assertStepId(payload.step_id);
  if (parseStepId(payload.step_id).stageSlug !== payload.stage_slug) {
    throw new TypeError("stage_slug must match step_id");
  }
  assertNonEmptyString(payload.attempt_id, "attempt_id");
  if (payload.event_type !== eventType) {
    throw new TypeError(`event_type must be ${eventType}`);
  }
  assertTimestamp(payload.timestamp);
}

// ---- internal sub-validators ----

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

/**
 * Validate the review sub-structure of an exit payload.
 * Exported so tests can cover both shapes (executed=true / executed=false) directly.
 *
 * executed=true  — source, provider, true_cross_engine, report_path, raw_result_path,
 *                  fix_status are all required.
 * executed=false — all fields optional; if supplied as non-null they must be valid
 *                  types/enum values (no field is forced required).
 *
 * @param {object} review
 */
export function validateReviewPayload(review) {
  assertObject(review, "review");
  if (review.skill !== "3rd-review") {
    throw new TypeError('review.skill must be "3rd-review"');
  }
  if (typeof review.executed !== "boolean") {
    throw new TypeError("review.executed must be a boolean");
  }
  assertIntegerAtLeastOne(review.round, "review.round");

  if (review.executed) {
    // executed=true: all fields required
    assertEnum(review.verdict, REVIEW_VERDICTS, "review.verdict");
    assertNonEmptyString(review.source, "review.source");
    assertNonEmptyString(review.provider, "review.provider");
    if (typeof review.true_cross_engine !== "boolean") {
      throw new TypeError("review.true_cross_engine must be a boolean");
    }
    assertNonEmptyString(review.report_path, "review.report_path");
    assertNonEmptyString(review.raw_result_path, "review.raw_result_path");
    assertEnum(review.fix_status, FIX_STATUSES, "review.fix_status");
  } else {
    // executed=false: validate only when supplied as non-null
    if (review.verdict != null) {
      assertEnum(review.verdict, REVIEW_VERDICTS, "review.verdict");
    }
    if (review.source != null) {
      assertNonEmptyString(review.source, "review.source");
    }
    if (review.provider != null) {
      assertNonEmptyString(review.provider, "review.provider");
    }
    if (review.true_cross_engine != null) {
      if (typeof review.true_cross_engine !== "boolean") {
        throw new TypeError("review.true_cross_engine must be a boolean");
      }
    }
    if (review.report_path != null) {
      assertNonEmptyString(review.report_path, "review.report_path");
    }
    if (review.raw_result_path != null) {
      assertNonEmptyString(review.raw_result_path, "review.raw_result_path");
    }
    if (review.fix_status != null) {
      assertEnum(review.fix_status, FIX_STATUSES, "review.fix_status");
    }
  }
}

// ---- public exports ----

/**
 * Validate entry receipt payload.
 * Throws TypeError on failure; returns undefined on success.
 * @param {object} payload
 */
export function validateEntryPayload(payload) {
  assertObject(payload, "entryReceiptPayload");
  if (isCanonicalReceipt(payload)) {
    validateCanonicalIdentity(payload, "step_entry");
    assertEvidence(payload.entry_evidence, "entry_evidence");
    return;
  }
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

/**
 * Validate exit receipt payload.
 * exit_journal_entry_id is optional; if present must be a non-empty string.
 * Throws TypeError on failure; returns undefined on success.
 * @param {object} payload
 */
export function validateExitPayload(payload) {
  assertObject(payload, "exitReceiptPayload");
  if (isCanonicalReceipt(payload)) {
    validateCanonicalIdentity(payload, "step_exit");
    assertEnum(payload.terminal_status, TERMINAL_STATUS_SET, "terminal_status");
    assertEvidence(payload.completion_evidence, "completion_evidence");
    if (payload.exit_journal_entry_id != null) {
      assertNonEmptyString(payload.exit_journal_entry_id, "exit_journal_entry_id");
    }
    return;
  }
  assertStepId(payload.step_id);
  assertNonEmptyString(payload.workflow_run_id, "workflow_run_id");
  // exit_journal_entry_id is optional; validate format only when present
  if (payload.exit_journal_entry_id != null) {
    assertNonEmptyString(payload.exit_journal_entry_id, "exit_journal_entry_id");
  }
  assertEnum(payload.verdict, EXIT_VERDICTS, "verdict");
  assertNonEmptyString(payload.executor_namespace, "executor_namespace");
  assertNullableStepId(payload.prev_step_id, "prev_step_id");
  assertNullableStepId(payload.next_step_id, "next_step_id");
  validateReviewPayload(payload.review);
}

/**
 * Validate step_auto_rollback payload.
 * Throws TypeError on failure; returns undefined on success.
 * @param {object} payload
 */
export function validateStepAutoRollbackPayload(payload) {
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

// Re-export so callers that need STAGE_SLUGS for enum checking can use it
export { STAGE_SLUGS };
