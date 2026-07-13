export const JOURNAL_SCHEMA_VERSION = "v1";

export const JOURNAL_EVENT_TYPES = Object.freeze({
  STAGE_ENTER: "stage_enter",
  STAGE_EXIT: "stage_exit",
  PHASE_PRE_REVIEW: "phase_pre_review",
  CHECKPOINT_REQUEST: "checkpoint_request",
  STEP_ENTRY: "step_entry",
  STEP_EXIT: "step_exit",
  STEP_AUTO_ROLLBACK: "step_auto_rollback",
});

export const JOURNAL_EVENT_TYPE_VALUES = Object.freeze(Object.values(JOURNAL_EVENT_TYPES));

export const STEP_AUTO_ROLLBACK_REQUIRED_FIELDS = Object.freeze([
  "workflow_run_id",
  "affected_step_id",
  "rollback_from_step_id",
  "rollback_to_step_id",
  "attempt_seq",
  "ineffective",
  "reason",
]);

export const AUDIT_SUMMARY_FIELDS = Object.freeze([
  "total_step_count",
  "passed_step_count",
  "blocked_step_count",
  "skipped_step_count",
  "rollback_count",
]);

// Canonical v1 receipt identity.  Journal records may retain legacy fields for
// migration, but canonical receipts must carry every field below verbatim.
export const RECEIPT_IDENTITY_FIELDS = Object.freeze([
  "workflow_run_id",
  "stage_slug",
  "step_id",
  "attempt_id",
  "event_type",
  "timestamp",
]);

export const TERMINAL_STATUSES = Object.freeze([
  "success",
  "failure",
  "skipped",
  "needs_human",
]);
