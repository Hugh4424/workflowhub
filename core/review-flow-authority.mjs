const RESULT_REF = /^reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const ATTEMPT_REF = /^reviews\/attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/attempt\.json$/;
const RESOLUTION_REF = /^reviews\/resolutions\/[a-f0-9]{64}\.json$/;
const EVENT_REF = /^reviews\/flows\/[a-f0-9]{64}\/event-[0-9]{4}\.json$/;
const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40,64}$/;
const PHASE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

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

function boundRecord(value, expectedRef, expectedHash, label) {
  const record = object(value, label);
  if (record.ref !== expectedRef || record.hash !== expectedHash || !HASH.test(record.hash ?? "")) {
    throw new Error(`${label} ref/hash binding mismatch`);
  }
  return object(record.value, `${label} value`);
}

/**
 * Validate the narrow facts used by TaskKernel to authorize one build-code
 * correction after a provider's serious finding was hidden by adjudication.
 * This function has no write authority: the TaskKernel must supply records it
 * read and hashed itself plus snapshot bytes read from Git.
 */
export function validateBuildCodeAdjudicationCorrection({
  correction,
  priorResult,
  priorAttempt,
  providerFinding,
  proof,
  implementationReceipt,
  testReceipt,
  phaseEvidence,
  existingCorrections = [],
  readSnapshotFile,
} = {}) {
  const value = object(correction, "build-code adjudication correction");
  if (value.schema_version !== "workflowhub-build-code-adjudication-correction.v1"
      || value.stage !== "build-code" || !PHASE_ID.test(value.phase_id ?? "")) {
    throw new Error("adjudication correction is only valid for one named build-code Phase");
  }
  for (const key of ["prior_result_hash", "prior_attempt_hash"]) if (!HASH.test(value[key] ?? "")) throw new Error(`${key} is invalid`);
  for (const key of ["prior_snapshot_tree"]) if (!TREE.test(value[key] ?? "")) throw new Error(`${key} is invalid`);
  if (!["major", "blocking"].includes(value.finding_severity)) throw new Error("correction requires an original major or blocking provider finding");
  if (!["invalid_evidence", "nonblocking_minor"].includes(value.prior_disposition)) {
    throw new Error("correction requires an erroneous invalid_evidence or nonblocking_minor disposition");
  }
  if (value.provider_verdict !== "revise_required") throw new Error("correction requires the original provider revise_required verdict");
  if (value.proof?.kind !== "mechanical") throw new Error("correction requires trusted mechanical proof");
  if (value.repair?.snapshot_tree === value.prior_snapshot_tree || !TREE.test(value.repair?.snapshot_tree ?? "")) {
    throw new Error("correction repair must bind a changed snapshot");
  }
  for (const key of ["evidence_hash"]) if (!HASH.test(value.proof?.[key] ?? "")) throw new Error(`proof ${key} is invalid`);
  for (const key of ["implementation_receipt_hash", "test_receipt_hash", "phase_evidence_hash"]) {
    if (!HASH.test(value.repair?.[key] ?? "")) throw new Error(`repair ${key} is invalid`);
  }
  if (existingCorrections.some((entry) => entry?.stage === "build-code" && entry?.phase_id === value.phase_id)) {
    throw new Error(`build-code Phase ${value.phase_id} already used its one adjudication correction`);
  }

  const result = boundRecord(priorResult, value.prior_result_ref, value.prior_result_hash, "prior result");
  const attempt = boundRecord(priorAttempt, value.prior_attempt_ref, value.prior_attempt_hash, "prior attempt");
  if (result.stage !== "build-code" || result.subject_kind !== "phase" || result.phase_id !== value.phase_id
      || result.snapshot_tree !== value.prior_snapshot_tree || result.verdict !== "pass"
      || result.attempt_ref !== value.prior_attempt_ref) {
    throw new Error("prior result is not the bound passed build-code Phase");
  }
  if (attempt.stage !== "build-code" || attempt.subject_kind !== "phase" || attempt.phase_id !== value.phase_id
      || attempt.snapshot_tree !== value.prior_snapshot_tree) {
    throw new Error("prior attempt does not match the bound build-code Phase");
  }
  const cluster = result.adjudication?.clusters?.find(({ id }) => id === value.finding_id);
  if (!cluster || cluster.severity !== value.finding_severity || cluster.disposition !== value.prior_disposition
      || !["major", "blocking"].includes(cluster.severity)) {
    throw new Error("prior adjudication does not contain the bound erroneously downgraded serious finding");
  }
  const raw = object(providerFinding, "provider finding");
  if (!cluster.providers?.includes(raw.provider) || raw.verdict !== "revise_required"
      || raw.finding?.severity !== cluster.severity || raw.finding?.path !== cluster.path
      || raw.finding?.issue !== cluster.issue
      || !attempt.provider_attempts?.some(({ provider, status }) => provider === raw.provider && status === "completed")) {
    throw new Error("provider finding is not authenticated by the prior result and attempt");
  }

  const proofRecord = boundRecord(proof, value.proof.evidence_ref, value.proof.evidence_hash, "mechanical proof");
  if (proofRecord.kind !== "json_parse_failure" || proofRecord.path !== cluster.path
      || proofRecord.prior_snapshot_tree !== value.prior_snapshot_tree
      || proofRecord.repair_snapshot_tree !== value.repair.snapshot_tree) {
    throw new Error("mechanical proof does not bind the finding path and old/new snapshots");
  }
  if (typeof readSnapshotFile !== "function") throw new Error("trusted snapshot reader is required");
  const before = readSnapshotFile(value.prior_snapshot_tree, cluster.path);
  const after = readSnapshotFile(value.repair.snapshot_tree, cluster.path);
  let failed = false;
  try { JSON.parse(before); } catch { failed = true; }
  if (!failed) throw new Error("mechanical proof did not reproduce the prior JSON parse failure");
  try { JSON.parse(after); } catch { throw new Error("mechanical proof repair snapshot still fails JSON parse"); }

  const implementation = boundRecord(
    implementationReceipt,
    value.repair.implementation_receipt_ref,
    value.repair.implementation_receipt_hash,
    "repair implementation receipt",
  );
  const tests = boundRecord(testReceipt, value.repair.test_receipt_ref, value.repair.test_receipt_hash, "repair test receipt");
  if (implementation.producer?.stage !== "build-code" || implementation.producer?.component !== "implementation"
      || implementation.snapshot_tree !== value.repair.snapshot_tree) {
    throw new Error("repair implementation receipt does not bind the repair snapshot");
  }
  if (tests.producer?.stage !== "build-code" || tests.producer?.component !== "build-code-test-capture"
      || tests.snapshot_tree !== value.repair.snapshot_tree || tests.exit_code !== 0) {
    throw new Error("repair test receipt does not prove the repair snapshot passed");
  }
  const phase = boundRecord(
    phaseEvidence,
    value.repair.phase_evidence_ref,
    value.repair.phase_evidence_hash,
    "repair Phase evidence",
  );
  if (phase.phase_id !== value.phase_id || phase.status !== "awaiting_review"
      || phase.evidence?.implementation_receipt_ref !== value.repair.implementation_receipt_ref
      || phase.evidence?.green_test_receipt_ref !== value.repair.test_receipt_ref
      || !value.repair.phase_evidence_ref.includes(`/${value.phase_id}/${value.repair.snapshot_tree}/`)) {
    throw new Error("repair Phase evidence does not bind the Phase repair receipts and snapshot");
  }
  return Object.freeze(JSON.parse(JSON.stringify(value)));
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
    ...(value.stage === "build-code" && value.subject_kind === "phase" ? { snapshot_tree: value.snapshot_tree } : {}),
  });
}

export function validateReviewFlowReset({
  record,
  taskId,
  resetRef,
  baseFlowId,
  sequence,
  baseIdentity,
  previousIdentity,
  previousResetRef,
  previousResetHash,
  previousFlow,
  previousResult,
  previousHeadHash,
  previousEventHash,
  resolution,
  resolutionHash,
} = {}) {
  const value = object(record, "review flow reset");
  const flow = object(previousFlow, "review flow reset previous flow");
  const result = object(previousResult, "review flow reset previous result");
  const action = object(resolution, "review flow reset resolution");
  const dimensions = [...new Set(action.change_classification?.changed_dimensions ?? [])].sort();
  if (value.schema_version !== "review-flow-reset.v1"
      || value.task_id !== taskId || value.reset_ref !== resetRef
      || value.base_flow_id !== baseFlowId || value.sequence !== sequence
      || JSON.stringify(value.base_identity) !== JSON.stringify(baseIdentity)
      || JSON.stringify(value.previous_identity) !== JSON.stringify(previousIdentity)
      || value.previous_reset_ref !== previousResetRef
      || value.previous_reset_hash !== previousResetHash
      || value.previous_head_ref !== flow.head_result_ref
      || value.previous_head_hash !== previousHeadHash
      || value.previous_event_ref !== flow.event_ref
      || value.previous_event_hash !== previousEventHash
      || value.previous_snapshot_tree !== result.snapshot_tree
      || value.current_snapshot_tree !== action.snapshot_tree
      || value.resolution_ref !== flow.action_ref
      || value.resolution_hash !== resolutionHash
      || JSON.stringify(value.structural_dimensions) !== JSON.stringify(dimensions)
      || !Number.isFinite(Date.parse(value.created_at))) {
    throw new Error("review flow reset record is invalid or discontinuous");
  }
  if (flow.event_kind !== "resolution" || flow.action_sha256 !== resolutionHash
      || action.version !== "wh-review-resolution.v1"
      || action.task_id !== taskId
      || action.previous_result_ref !== flow.head_result_ref
      || action.previous_result_sha256 !== previousHeadHash
      || action.previous_snapshot_tree !== result.snapshot_tree
      || action.evidence_state !== "verified"
      || action.change_classification?.structural !== true
      || dimensions.length === 0
      || value.previous_snapshot_tree === value.current_snapshot_tree) {
    throw new Error("review flow reset bindings changed");
  }
  return Object.freeze(JSON.parse(JSON.stringify(value)));
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
