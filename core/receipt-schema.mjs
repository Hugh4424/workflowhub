/**
 * core/receipt-schema.mjs
 *
 * Pure validation layer. No I/O, no file-system calls.
 * Assertion failures throw TypeError — caller decides how to handle.
 */
export { createQualityFact } from "./quality-fact.mjs";

import {
  RECEIPT_MANIFEST_SCHEMA_VERSION,
  STEP_AUTO_ROLLBACK_REQUIRED_FIELDS,
  TERMINAL_STATUSES,
} from "./journal-schema.mjs";

const STAGE_SLUGS = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const MANIFEST_SCHEMA_VERSION = RECEIPT_MANIFEST_SCHEMA_VERSION;
const TERMINAL_STATUS_SET = new Set(TERMINAL_STATUSES);

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

function assertStepId(value, name = "step_id") {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${name} must be an integer >= 1`);
  }
}

function migrationError(reason) {
  throw new TypeError(
    `LEGACY_FIELDS_MISSING: ${reason}; migration_hint=use long stage_slug, integer step_id, and manifest_schema_version ${MANIFEST_SCHEMA_VERSION}`,
  );
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

function validateCanonicalIdentity(payload, eventType) {
  assertNonEmptyString(payload.workflow_run_id, "workflow_run_id");
  if (typeof payload.stage_slug !== "string" || !STAGE_SLUGS.has(payload.stage_slug)) {
    migrationError("stage_slug");
  }
  if (!Number.isInteger(payload.step_id) || payload.step_id < 1) migrationError("step_id");
  if (payload.manifest_schema_version !== MANIFEST_SCHEMA_VERSION) migrationError("manifest_schema_version");
  assertNonEmptyString(payload.attempt_id, "attempt_id");
  if (payload.event_type !== eventType) {
    throw new TypeError(`event_type must be ${eventType}`);
  }
  assertTimestamp(payload.timestamp);
}

// ---- public exports ----

/**
 * Validate entry receipt payload.
 * Throws TypeError on failure; returns undefined on success.
 * @param {object} payload
 */
export function validateEntryPayload(payload) {
  assertObject(payload, "entryReceiptPayload");
  validateCanonicalIdentity(payload, "step_entry");
  assertEvidence(payload.entry_evidence, "entry_evidence");
  if (payload.retry_of_attempt_id != null) {
    assertNonEmptyString(payload.retry_of_attempt_id, "retry_of_attempt_id");
    if (payload.retry_of_attempt_id === payload.attempt_id) {
      throw new TypeError("retry_of_attempt_id must name a prior, different attempt");
    }
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
  validateCanonicalIdentity(payload, "step_exit");
  assertEnum(payload.terminal_status, TERMINAL_STATUS_SET, "terminal_status");
  assertEvidence(payload.completion_evidence, "completion_evidence");
  assertNonEmptyString(payload.entry_journal_entry_id, "entry_journal_entry_id");
  if (payload.terminal_status === "skipped") {
    assertNonEmptyString(payload.skip_reason, "skip_reason");
    assertNonEmptyString(payload.authorized_by, "authorized_by");
  }
  if (payload.terminal_status === "blocked" || payload.terminal_status === "needs_human") {
    assertNonEmptyString(payload.block_reason, "block_reason");
  }
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
export { MANIFEST_SCHEMA_VERSION, STAGE_SLUGS };
