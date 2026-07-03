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
