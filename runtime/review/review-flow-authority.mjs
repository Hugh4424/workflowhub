const RESULT_REF = /^reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const ATTEMPT_REF = /^reviews\/attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/attempt\.json$/;
const RESOLUTION_REF = /^reviews\/resolutions\/[a-f0-9]{64}\.json$/;
const EVENT_REF = /^reviews\/flows\/[a-f0-9]{64}\/event-[0-9]{4}\.json$/;
const HASH = /^[a-f0-9]{64}$/;

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function same(left, right) {
  return (left ?? null) === (right ?? null);
}

function nonempty(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

export function reviewFlowSubject(result) {
  const value = object(result, "review result");
  if (typeof value.stage !== "string" || typeof value.subject_kind !== "string") {
    throw new Error("review result has no authenticated flow subject");
  }
  return Object.freeze({
    stage: value.stage,
    review_track: value.review_track ?? null,
    subject_kind: value.subject_kind,
    phase_id: value.phase_id ?? null,
    review_scope: value.review_scope ?? null,
    ...(value.stage === "build-code" && value.snapshot_tree !== undefined ? { snapshot_tree: value.snapshot_tree } : {}),
  });
}

export function assertAuthenticatedReviewHead({
  readFlow,
  reviewRef,
  reviewHash,
  result,
  expected,
  latestResolution,
} = {}) {
  if (typeof readFlow !== "function") throw new Error("authenticated review flow capability required");
  if (!RESULT_REF.test(reviewRef ?? "")) throw new Error("authenticated review flow requires a semantic result ref");
  if (!HASH.test(reviewHash ?? "")) throw new Error("authenticated review flow requires the exact result hash");
  const subject = reviewFlowSubject(result);
  const required = object(expected, "expected review subject");
  for (const key of ["stage", "review_track", "subject_kind", "phase_id", "review_scope"]) {
    if (!same(subject[key], required[key])) throw new Error(`review result ${key} does not match the trusted consumer subject`);
  }
  const flow = object(readFlow(subject), "authenticated review flow");
  const identity = object(flow.identity, "authenticated review flow identity");
  if (typeof identity.workflow_run_id !== "string" || identity.workflow_run_id.trim() === "") {
    throw new Error("authenticated review flow has no trusted lineage");
  }
  if (identity.task_id !== result.task_id) throw new Error("authenticated review flow task mismatch");
  for (const key of ["stage", "review_track", "subject_kind", "phase_id", "review_scope"]) {
    if (!same(identity[key], subject[key])) throw new Error(`authenticated review flow ${key} mismatch`);
  }
  if (flow.head_result_ref !== reviewRef) throw new Error("review is not the authenticated flow head");
  if (flow.result_sha256 !== reviewHash) throw new Error("review does not match the authenticated flow hash");
  if (flow.verdict !== result.verdict) throw new Error("review verdict does not match the authenticated flow outcome");
  const expectedRoot = result.review_chain?.root_result_ref ?? reviewRef;
  if (flow.root_result_ref !== expectedRoot) throw new Error("review does not match the authenticated flow root");
  if (latestResolution === undefined) {
    if (flow.event_kind !== "semantic_result") {
      throw new Error("review does not consume the latest authenticated flow action");
    }
  } else {
    const resolution = object(latestResolution, "latest review resolution");
    if (!RESOLUTION_REF.test(resolution.ref ?? "") || !HASH.test(resolution.sha256 ?? "")) {
      throw new Error("latest review resolution ref/hash is invalid");
    }
    if (flow.event_kind !== "resolution" || flow.action_ref !== resolution.ref || flow.action_sha256 !== resolution.sha256) {
      throw new Error("review resolution is not the latest authenticated flow action");
    }
  }
  if (!EVENT_REF.test(flow.event_ref ?? "")) throw new Error("authenticated review flow event ref is invalid");
  return Object.freeze({ subject, flow });
}

export function assertAuthenticatedReviewAttempt({
  readFlow,
  attemptRef,
  attemptHash,
  attempt,
  expected,
} = {}) {
  if (typeof readFlow !== "function") throw new Error("authenticated review flow capability required");
  if (!ATTEMPT_REF.test(attemptRef ?? "") || !HASH.test(attemptHash ?? "")) {
    throw new Error("authenticated review attempt ref/hash is invalid");
  }
  const subject = reviewFlowSubject(attempt);
  const required = object(expected, "expected review subject");
  for (const key of ["stage", "review_track", "subject_kind", "phase_id", "review_scope"]) {
    if (!same(subject[key], required[key])) throw new Error(`review attempt ${key} does not match the trusted consumer subject`);
  }
  const flow = object(readFlow(subject), "authenticated review flow");
  const identity = object(flow.identity, "authenticated review flow identity");
  if (identity.task_id !== attempt.task_id) throw new Error("authenticated review flow task mismatch");
  for (const key of ["stage", "review_track", "subject_kind", "phase_id", "review_scope"]) {
    if (!same(identity[key], subject[key])) throw new Error(`authenticated review flow ${key} mismatch`);
  }
  if (flow.event_kind !== "provider_attempt" || flow.action_ref !== attemptRef || flow.action_sha256 !== attemptHash) {
    throw new Error("review attempt is not the latest authenticated flow action");
  }
  if (!EVENT_REF.test(flow.event_ref ?? "")) throw new Error("authenticated review flow event ref is invalid");
  return Object.freeze({ subject, flow });
}
