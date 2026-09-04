const CLASSIFICATIONS = Object.freeze({
  PROTOCOL_ERROR: "protocol_error",
  QUALITY_FAILURE: "quality_failure",
});

const CLOSE_CHECK_IDS = Object.freeze([
  "bind_outcome",
  "outcome_ref",
  "outcome_current",
  "review_binding",
  "review_identity",
  "finding_coverage",
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function diagnostic(check_id, expected, actual) {
  return deepFreeze({ check_id, expected, actual });
}

function messageOf(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  return String(error);
}

function stageMatches(entry, stage) {
  return typeof stage !== "string" || entry.stages.includes(stage);
}

function surfaceMatches(entry, surface) {
  return entry.surfaces.length === 0 || (typeof surface === "string" && entry.surfaces.includes(surface));
}

const RAW_WHITELIST = [
  {
    class_id: "stage_publication_transient",
    stages: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"],
    surfaces: ["stage"],
    retryable: true,
    match: (message, error) => error?.code === "PROTOCOL_PUBLICATION_FAILURE"
      && message === "protocol publication failed transiently",
    diagnostic: diagnostic("stage_publication", "the already validated result and captured publication inputs", "a transient publication failure occurred"),
  },
  {
    class_id: "verify_review_without_outcome",
    stages: ["verify-code"],
    surfaces: ["stage"],
    match: (message) => message === "verify-code quality_review requires a bound dsh-code-review stage outcome",
    diagnostic: diagnostic("review_binding", "a current dsh-code-review stage outcome", "quality_review was supplied without a bound stage outcome"),
  },
  {
    class_id: "verify_outcome_unbound_review",
    stages: ["verify-code"],
    surfaces: ["stage"],
    match: (message) => message === "verify-code quality_review is not bound to the dsh-code-review stage outcome"
      || message === "verify-code quality_review is not bound to a dsh-code-review stage outcome",
    diagnostic: diagnostic("review_binding", "quality_review_ref equals the dsh-code-review stage outcome ref", "the stage outcome has no bound quality_review_ref"),
  },
  {
    class_id: "verify_review_mismatch",
    stages: ["verify-code"],
    surfaces: ["stage"],
    match: (message) => message === "verify-code quality_review does not match the dsh-code-review stage outcome",
    diagnostic: diagnostic("review_binding", "the derived dsh-code-review result ref/hash", "the supplied quality_review binding differs from the derived pair"),
  },
  {
    class_id: "verify_receipt_fields",
    stages: ["verify-code"],
    surfaces: ["stage"],
    match: (message) => message.startsWith("verify-code official run has unexpected receipt fields:"),
    diagnostic: diagnostic("receipt_fields", "only receipt fields declared for verify-code", "the receipt payload contains an undeclared field"),
  },
  {
    class_id: "close_bind_outcome",
    stages: ["verify-code"],
    surfaces: ["resolved-review-authorization"],
    match: (message) => message === "resolved review authorization is only valid for a resolved verify-code review"
      || message === "resolved review authorization stage outcome is required",
    diagnostic: diagnostic("bind_outcome", "resolved review authorization is bound to a verify-code stage outcome", "the authorization is missing or bound to another subject"),
  },
  {
    class_id: "close_outcome_ref",
    stages: ["verify-code"],
    surfaces: ["resolved-review-authorization"],
    match: (message) => message === "resolved review authorization stage outcome ref/hash do not match"
      || message === "resolved review authorization stage outcome hash mismatch",
    diagnostic: diagnostic("outcome_ref", "content-addressed stage outcome ref and hash agree", "the supplied ref/hash pair does not identify the same bytes"),
  },
  {
    class_id: "close_outcome_current",
    stages: ["verify-code"],
    surfaces: ["resolved-review-authorization"],
    match: (message) => message === "resolved review authorization stage outcome is not current and completed",
    diagnostic: diagnostic("outcome_current", "the current completed verify-code outcome", "the stage outcome is stale, incomplete, or from another snapshot/material revision"),
  },
  {
    class_id: "close_review_binding",
    stages: ["verify-code"],
    surfaces: ["resolved-review-authorization"],
    match: (message) => message === "verify-code quality_review requires a bound dsh-code-review stage outcome"
      || message === "resolved review authorization does not bind the current review evidence",
    diagnostic: diagnostic("review_binding", "the current review evidence is bound to the stage outcome", "the review evidence is absent or bound to another outcome"),
  },
  {
    class_id: "close_review_identity",
    stages: ["verify-code"],
    surfaces: ["resolved-review-authorization"],
    match: (message) => message === "resolved review authorization review result hash mismatch"
      || message === "resolved review authorization review result identity mismatch"
      || message === "resolved review authorization code_review binding is invalid",
    diagnostic: diagnostic("review_identity", "the review result has the current task/stage identity and hash", "the review result hash or identity does not match"),
  },
  {
    class_id: "close_finding_coverage",
    stages: ["verify-code"],
    surfaces: ["resolved-review-authorization"],
    match: (message) => message === "resolved review authorization must prove repaired actionable findings"
      || message === "resolved review authorization omitted an actionable finding"
      || message === "resolved review authorization contains an invalid repair disposition"
      || message === "resolved review authorization does not cover every actionable finding",
    diagnostic: diagnostic("finding_coverage", "every actionable finding has a valid disposition", "at least one actionable finding is missing or invalid"),
  },
  {
    class_id: "build_review_kind",
    stages: ["build-code", "build-plan"],
    surfaces: ["stage"],
    match: (message) => message === "SCHEMA_VALIDATION_FAILED result /review_kind enum",
    diagnostic: diagnostic("review_kind", "an allowed review_kind enum value", "the supplied review_kind is not an allowed enum value"),
  },
  {
    class_id: "build_review_track",
    stages: ["build-code", "build-plan"],
    surfaces: ["stage"],
    match: (message) => message === "SCHEMA_VALIDATION_FAILED result /review_track type",
    diagnostic: diagnostic("review_track", "review_track has the declared scalar type", "the supplied review_track has the wrong type"),
  },
  {
    class_id: "acceptance_coverage_spec_mismatch",
    stages: ["build-code"],
    surfaces: ["stage"],
    match: (message) => message === "build-code acceptance_coverage must match the current spec acceptance criteria",
    diagnostic: diagnostic("acceptance_coverage", "one row for every current spec acceptance criterion", "acceptance_coverage does not match the current acceptance set"),
  },
  {
    class_id: "acceptance_coverage_invalid_status",
    stages: ["build-code"],
    surfaces: ["stage"],
    match: (message) => /^acceptance_coverage .* status must be covered, missing, or unknown$/.test(message),
    diagnostic: diagnostic("acceptance_coverage", "status is covered, missing, or unknown", "the acceptance_coverage status is not one of the allowed values"),
  },
  {
    class_id: "acceptance_coverage_invalid_evidence",
    stages: ["build-code"],
    surfaces: ["stage"],
    match: (message) => /^acceptance_coverage .* (?:evidence reference is invalid|non-covered acceptance criterion must not claim evidence)/.test(message),
    diagnostic: diagnostic("acceptance_coverage", "evidence refs are valid and only covered rows carry evidence", "the acceptance_coverage evidence is invalid or attached to a non-covered row"),
  },
];

export const PROTOCOL_ERROR_WHITELIST = deepFreeze(RAW_WHITELIST.map((entry) => ({
  ...entry,
  retryable: entry.retryable === true,
  stages: [...entry.stages],
  surfaces: [...entry.surfaces],
  diagnostic: { ...entry.diagnostic },
})));

export const PROTOCOL_ERROR_CLOSE_CHECK_IDS = CLOSE_CHECK_IDS;
export const PROTOCOL_ERROR_CLASSIFICATIONS = CLASSIFICATIONS;

export function createProtocolErrorDiagnostic({ check_id, expected, actual } = {}) {
  if (typeof check_id !== "string" || check_id.trim() === "") throw new TypeError("protocol diagnostic check_id is required");
  if (expected === undefined || expected === null) throw new TypeError("protocol diagnostic expected is required");
  if (actual === undefined || actual === null) throw new TypeError("protocol diagnostic actual is required");
  return diagnostic(check_id, expected, actual);
}

export function classifyProtocolError(error, { stage, surface } = {}) {
  const message = messageOf(error);
  const entry = PROTOCOL_ERROR_WHITELIST.find((candidate) => stageMatches(candidate, stage)
    && surfaceMatches(candidate, surface)
    && candidate.match(message, error));
  if (!entry) {
    return Object.freeze({
      classification: CLASSIFICATIONS.QUALITY_FAILURE,
      error_code: typeof error?.code === "string" && error.code.trim() ? error.code : null,
      error_message: message,
    });
  }
  return Object.freeze({
    classification: CLASSIFICATIONS.PROTOCOL_ERROR,
    class_id: entry.class_id,
    stage: stage ?? null,
    surface: surface ?? null,
    retryable: entry.retryable === true,
    diagnostic: createProtocolErrorDiagnostic({
      ...entry.diagnostic,
      actual: message,
    }),
    error_message: message,
  });
}

export function protocolErrorEntry(classId) {
  return PROTOCOL_ERROR_WHITELIST.find((entry) => entry.class_id === classId) ?? null;
}

export function protocolErrorCheckIds() {
  return CLOSE_CHECK_IDS;
}
