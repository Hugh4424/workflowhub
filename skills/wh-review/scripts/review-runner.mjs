import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ArtifactDir } from "../../../core/artifact-dir.mjs";
import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "../../../runtime/task/workspace.mjs";
import { captureReviewSource as captureSourceDefault } from "./review-source.mjs";
import { buildIntegrationReviewSubject as buildIntegrationSubjectDefault } from "./integration-review-subject.mjs";
import { buildReviewMaterials as buildMaterialsDefault, minimumReviewersFor, reviewInstructionsFor, validateDetailReviewInput } from "./review-materials.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import { aggregateProviderResults, renderReviewReport, reviewRefs, writeAttempt, writeProviderOutput, writeReviewReport, writeSemanticResult } from "./review-result.mjs";
import { buildSemanticProjection } from "./review-semantic-projection.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { captureExecutionSnapshot, isExecutionRecordOnlyMaterialDelta, isMaterialOnlySnapshotDelta, materialRevisionFromValues } from "../../../runtime/task/git-worktree-snapshot.mjs";
// Providers run from a writable wrapper directory; sealed review material is
// deliberately exposed beneath `bundle/`, never at that directory's root.
// Keep the provider on the bounded, provider-visible view. The canonical
// archives and out-of-scope summaries remain audit material, but asking the
// model to enumerate the complete bundle makes large Phase reviews spend
// their budget on transport/tool traversal before semantic review.
const reviewRootFor = () => "quality/reviews";
const providerOutputPrefixFor = (task, attemptId) => `${reviewRootFor(task)}/attempts/${attemptId}/providers/`;
const CURRENT_MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
function protocolFailure(message) {
  const error = new Error(`PROTOCOL_INCOMPATIBLE: ${message}`);
  error.code = "PROTOCOL_INCOMPATIBLE";
  return error;
}
function sourceRecord(source, integrationSubject = null) {
  return {
    target_commit: source.targetCommit,
    base_commit: integrationSubject?.base_commit ?? source.baseCommit,
    base_tree: integrationSubject?.base_tree ?? source.baseTree,
    captured_head: source.capturedHead,
    ...(source.phaseCommit === undefined ? {} : { phase_commit: source.phaseCommit }),
  };
}
function reviewScopeFor(stage, phaseId) {
  return stage === "build-code" ? (phaseId ? "phase" : "integration") : null;
}

function normalizeDirectionSelection(value) {
  if (typeof value === "string" && value.trim() !== "") return Object.freeze({ current_selection: value });
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.current_selection !== "string" || value.current_selection.trim() === "") {
    throw new TypeError("current_selection is required for direction review");
  }
  return Object.freeze(structuredClone(value));
}

/**
 * Direction review is one broker request containing an internal, ordered flow.
 * The broker must enforce the reveal boundary; WorkflowHub must not emulate it
 * with two public calls because that violates the one-round review contract.
 */
export function planDirectionReviewRequests({ raw_requirement, objective_facts, current_selection, reconstruction_result = null } = {}) {
  if (typeof raw_requirement !== "string" || raw_requirement.trim() === "") throw new TypeError("raw_requirement is required");
  const selection = normalizeDirectionSelection(current_selection);
  const facts = objective_facts === undefined ? null : structuredClone(objective_facts);
  const flow = Object.freeze({
    version: "direction-review.v1",
    public_request_count: 1,
    steps: Object.freeze([
      Object.freeze({ id: "reconstruct", visible: Object.freeze(["raw_requirement", "objective_facts"]), hidden_until: "reveal" }),
      Object.freeze({ id: "reveal", after: Object.freeze(["reconstruct"]), visible: Object.freeze(["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"]) }),
      Object.freeze({ id: "challenge", after: Object.freeze(["reveal"]), visible: Object.freeze(["revealed_choice", "independent_reconstruction"]), output: "findings" }),
    ]),
    output: Object.freeze({ one_provider_result: true, one_logical_fact: true }),
  });
  const request = Object.freeze({
    request_id: "direction-review",
    public_request_count: 1,
    flow,
    input: Object.freeze({ ...selection, raw_requirement, objective_facts: facts, ...(reconstruction_result === null ? {} : { independent_reconstruction: structuredClone(reconstruction_result) }) }),
    prompt: "在同一次 public request 内严格执行 reconstruct → reveal → challenge：reconstruct 阶段不得读取当前选择；reveal 后才呈现当前选择和独立重建；challenge 只报告真实交付风险。不要拆成第二次 public request。",
  });
  return Object.freeze({ requests: Object.freeze([request]), request, flow, logical_fact_count: 1 });
}
function subjectRecord(source, stage, phaseId, integrationSubject = null) {
  return {
    subject_kind: phaseId ? "phase" : "worktree",
    phase_id: phaseId ?? null,
    review_scope: reviewScopeFor(stage, phaseId),
    base_tree: integrationSubject?.base_tree ?? source.baseTree,
    candidate_tree: source.snapshotTree,
  };
}
function findingSignature(finding) {
  return `${finding?.id ?? ""}\u0000${finding?.path ?? ""}\u0000${finding?.line ?? ""}\u0000${String(finding?.issue ?? "").trim().toLocaleLowerCase("en")}`;
}
/**
 * Serious means the existing adjudication says the finding is actionable and
 * the existing severity is major or blocking. Transport failures and
 * non-actionable advice are deliberately not treated as clean findings.
 */
export function actionableSeriousFindings(result) {
  const findings = Array.isArray(result?.findings)
    ? result.findings
    : Array.isArray(result?.adjudication?.clusters) ? result.adjudication.clusters : [];
  return findings.filter((finding) => finding?.disposition === "actionable" && ["major", "blocking"].includes(finding?.severity));
}
/**
 * Return a review-cycle fact without creating a loop controller or persisted
 * state. Callers may use it to decide whether the current review is advice,
 * needs human handling, or permits one focused review after real change.
 */
export function reviewCycleDecision({ stage, result, previousResult = null, actualRepair = false, subjectChanged = false } = {}) {
  if (stage !== "build-code") {
    return Object.freeze({ stage, status: "advice_only", action: "stop", reason: "non_build_code_advice_only", important_findings: [] });
  }
  if (!result || result.status === "unavailable" || result.terminal_status === "unavailable") {
    return Object.freeze({ stage, status: "incomplete", action: "stop", reason: "provider_no_trusted_terminal_result", important_findings: [] });
  }
  if (!Array.isArray(result.findings) && !Array.isArray(result?.adjudication?.clusters)) {
    return Object.freeze({ stage, status: "incomplete", action: "stop", reason: "semantic_review_result_required", important_findings: [] });
  }
  const importantFindings = actionableSeriousFindings(result);
  if (importantFindings.length === 0) {
    return Object.freeze({ stage, status: "clean_current_review", action: "stop", reason: "no_current_actionable_major_or_blocking_finding", important_findings: [] });
  }
  const changed = actualRepair === true || subjectChanged === true;
  if (!changed) {
    return Object.freeze({ stage, status: "needs_human", action: "stop", reason: "important_finding_without_actual_repair_or_subject_change", important_findings: importantFindings });
  }
  const previousImportant = new Set(actionableSeriousFindings(previousResult).map(findingSignature));
  const repeated = importantFindings.filter((finding) => previousImportant.has(findingSignature(finding)));
  if (repeated.length > 0) {
    return Object.freeze({ stage, status: "needs_human", action: "stop", reason: "same_important_finding_repeated_after_focused_review", important_findings: importantFindings, repeated_findings: repeated });
  }
  return Object.freeze({ stage, status: "focused_review_required", action: "review_once", reason: "actual_repair_or_subject_change", important_findings: importantFindings });
}
function minimumReviewersForPolicy(policy, stage, reviewTrack, reviewScope = null) {
  return policy?.source === "wh_review.v2"
    ? policy.minimum_heterologous
    : minimumReviewersFor(stage, reviewTrack, reviewScope);
}
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function hashCanonical(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
function semanticProjectionIdentity(projection) {
  return {
    projection_version: projection.projection_version,
    surface: projection.surface,
    contract_id: projection.contract_id,
    contract_hash: projection.contract_hash,
    semantic_hash: projection.semantic_hash,
  };
}
function textHash(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
function sameNullable(left, right) { return (left ?? null) === (right ?? null); }
function materialOnlyTreeTransition(sourceRoot, beforeTree, afterTree, taskId) {
  return beforeTree === afterTree
    || (typeof sourceRoot === "string"
      && isMaterialOnlySnapshotDelta(sourceRoot, beforeTree, afterTree, taskId));
}
/**
 * Find an immutable result whose semantic input is unchanged. A result is
 * reusable only when the two captured trees differ by current task-material
 * files, so a code/interface/config change can never hide behind a stable
 * semantic projection. The caller may then publish a current-tree alias; no
 * provider is invoked and the original result remains the provenance source.
 */
export function findReusableReviewResult({ task, source, subject, integrationSubject = null, stage, reviewTrack = null, reviewKind = null, semanticProjection, reviewPolicy = null, materialRevision = null } = {}) {
  if (!task || typeof task.listCanonicalReviewResultRefs !== "function" || !source || !subject || !semanticProjection) return null;
  const currentPolicyHash = reviewPolicy?.source === "wh_review.v2" ? hashCanonical(reviewPolicy) : null;
  const refs = task.listCanonicalReviewResultRefs();
  for (const resultRef of [...refs].sort().reverse()) {
    let raw; let result; let attempt;
    try {
      raw = task.readRecord(resultRef);
      result = JSON.parse(raw);
      validateSchema("result", result);
      attempt = JSON.parse(task.readRecord(result.attempt_ref));
      validateSchema("attempt", attempt);
      if (attempt.task_id !== task.identity.taskId
          || attempt.stage !== stage
          || attempt.snapshot_tree !== result.snapshot_tree
          || attempt.terminal_status !== "semantic"
          || attempt.error !== null
          || !Array.isArray(attempt.provider_attempts)
          || attempt.provider_attempts.length === 0) continue;
    } catch { continue; }
    const identity = result.semantic_projection;
    if (result.task_id !== task.identity.taskId
        || result.stage !== stage
        || !sameNullable(result.review_track, reviewTrack)
        || !sameNullable(result.review_kind, reviewKind)
        || result.subject_kind !== subject.subject_kind
        || !sameNullable(result.phase_id, subject.phase_id)
        || !sameNullable(result.review_scope, subject.review_scope)
        || result.semantic_projection?.semantic_hash !== semanticProjection.semantic_hash
        || result.semantic_projection?.contract_id !== semanticProjection.contract_id
        || result.semantic_projection?.contract_hash !== semanticProjection.contract_hash
        || !Array.isArray(result.provider_results) || result.provider_results.length === 0) continue;
    if (stage === "verify-code" && result.material_revision !== materialRevision) continue;
    if (!reuseSatisfiesCurrentPolicy({ result, attempt, reviewPolicy })) continue;
    if (currentPolicyHash !== null && attempt.policy_snapshot_hash !== currentPolicyHash) continue;
    if (reviewPolicy?.source === "wh_review.v2" && !providerOutputCarriesAnchors(task, attempt)) continue;
    const exact = result.snapshot_tree === source.snapshotTree;
    const materialOnly = !exact && materialOnlyTreeTransition(source.sourceRoot, result.snapshot_tree, source.snapshotTree, task.identity.taskId);
    if (!exact && !materialOnly) continue;
    const baseTree = subject.base_tree ?? source.baseTree;
    const baseTreeMaterialOnly = materialOnlyTreeTransition(source.sourceRoot, result.base_tree, baseTree, task.identity.taskId);
    if (!baseTreeMaterialOnly) continue;
    const sameSourceIdentity = result.source?.base_commit === (integrationSubject?.base_commit ?? source.baseCommit)
      && result.source?.captured_head === source.capturedHead;
    // A committed execution-status writeback changes HEAD and the current
    // base tree, but it does not change the reviewed implementation. Once the
    // candidate and base trees both prove that the only delta is that block,
    // the old provider result remains the correct semantic result.
    if (!sameSourceIdentity && !(materialOnly && baseTreeMaterialOnly)) continue;
    return Object.freeze({ resultRef, raw, result, exact, materialOnly });
  }
  return null;
}
function publishReusedReviewResult({ task, taskId, stage, reviewTrack, reviewKind, source, subject, integrationSubject, bundle, semanticProjection, reusable, reviewPolicy = null, materialRevision = null }) {
  const reuseId = `reuse-${randomUUID()}`;
  const refs = reviewRefs({ attemptId: reuseId, stage, reviewTrack, snapshotTree: source.snapshotTree, root: reviewRootFor(task) });
  const sourceAttempt = JSON.parse(task.readRecord(reusable.result.attempt_ref));
  validateSchema("attempt", sourceAttempt);
  const result = {
    ...reusable.result,
    task_id: taskId,
    stage,
    review_track: reviewTrack,
    review_kind: reviewKind,
    ...subject,
    source: sourceRecord(source, integrationSubject),
    snapshot_tree: source.snapshotTree,
    material_id: bundle.materialId,
    ...(materialRevision ? { material_revision: materialRevision } : {}),
    semantic_projection: semanticProjectionIdentity(semanticProjection),
    reuse: {
      source_result_ref: reusable.resultRef,
      source_result_hash: textHash(reusable.raw),
      reason: "semantic_hash_unchanged_material_only",
    },
  };
  const selectedProfiles = reviewPolicy?.eligible_profiles
    ?? sourceAttempt?.coverage?.selected_profiles
    ?? result.provider_results.map(({ provider }) => provider);
  const minimumRequired = reviewPolicy
    ? minimumReviewersForPolicy(reviewPolicy, stage, reviewTrack, subject.review_scope)
    : sourceAttempt?.coverage?.minimum_required ?? 1;
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: reuseId, task_id: taskId, stage, review_track: reviewTrack, review_kind: reviewKind,
    ...subject, source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
    ...(materialRevision ? { material_revision: materialRevision } : {}),
    semantic_projection: semanticProjectionIdentity(semanticProjection), report_ref: refs.reportRef,
    provider_attempts: (sourceAttempt?.provider_attempts ?? []).map((providerAttempt, index) => {
      if (!providerAttempt?.output_ref) return { ...providerAttempt };
      const rawOutput = task.readRecord(providerAttempt.output_ref);
      const outputRecord = JSON.parse(rawOutput);
      if (outputRecord?.schema_version !== "wh-review-provider-output.v1"
          || outputRecord.attempt_id !== sourceAttempt.attempt_id
          || outputRecord.provider !== providerAttempt.provider
          || typeof outputRecord.content !== "string") {
        throw new Error("REUSE_PROVENANCE_INVALID: source provider output is not bound to its source attempt");
      }
      if (reviewPolicy?.source === "wh_review.v2"
          && (!Array.isArray(outputRecord.evidence_anchor_valid)
            || outputRecord.evidence_anchor_valid.some((value) => typeof value !== "boolean"))) {
        throw new Error("REUSE_PROVENANCE_INVALID: source provider output is missing evidence anchor facts");
      }
      const outputRef = writeProviderOutput(task, refs.providerDirectoryRef, providerAttempt.provider, outputRecord.content, index + 1, {
        taskId, stage, evidence_anchor_valid: outputRecord.evidence_anchor_valid,
      });
      return { ...providerAttempt, output_ref: outputRef };
    }), terminal_status: "semantic", error: null,
    ...(reviewPolicy ? { review_policy: reviewPolicy, policy_snapshot_hash: hashCanonical(reviewPolicy) } : sourceAttempt?.review_policy ? {
      review_policy: sourceAttempt.review_policy,
      policy_snapshot_hash: sourceAttempt.policy_snapshot_hash,
    } : {}),
    coverage: {
      mode: sourceAttempt?.coverage?.mode ?? (selectedProfiles.length === 1 ? "single_external" : "parallel_external"),
      selected_profiles: [...selectedProfiles], selected_count: selectedProfiles.length,
      valid_provider_count: result.provider_results.length, minimum_required: minimumRequired,
      ...(sourceAttempt?.coverage?.group_outcome ? { group_outcome: sourceAttempt.coverage.group_outcome } : {}),
    },
  };
  validateSchema("attempt", attempt);
  writeAttempt(task, refs.attemptRef, attempt);
  result.attempt_ref = refs.attemptRef;
  result.report_ref = refs.reportRef;
  validateSchema("result", result);
  writeSemanticResult(task, refs.resultRef, result);
  writeReviewReport(task, refs.reportRef, { attempt, result });
  return {
    status: "available", reused: true, attemptRef: refs.attemptRef, resultRef: refs.resultRef,
    reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId,
    ...(materialRevision ? { materialRevision } : {}),
    runtimeIds: {}, subjectKind: subject.subject_kind, phaseId: subject.phase_id,
    reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree,
  };
}
function reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation, requestedProfiles = [], groupOutcome = null }) {
  const selectedProfiles = policy ? [...policy.eligible_profiles] : [...requestedProfiles];
  return {
    mode: stage === "build-code" && policy?.mode === "full_only" && selectedProfiles.length === 1 ? "single_external" : "parallel_external",
    selected_profiles: selectedProfiles,
    selected_count: selectedProfiles.length,
    valid_provider_count: aggregation.valid.length,
    minimum_required: minimumReviewers,
    ...(groupOutcome ? { group_outcome: groupOutcome } : {}),
  };
}
function undispatchedUnavailableId({ kind, stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint = null, materialRevision = null }) {
  return hashCanonical(kind === "material-preflight"
    ? { version: "wh-review-material-preflight.v1", stage, review_track: reviewTrack, subject, source, snapshot_tree: source.snapshotTree, review_policy: policy, diagnostic, material_fingerprint: materialFingerprint, material_revision: materialRevision }
    : { version: "wh-review-undispatched-unavailable.v1", kind, stage, review_track: reviewTrack, subject, source, snapshot_tree: source.snapshotTree, review_policy: policy, diagnostic, material_fingerprint: materialFingerprint, material_revision: materialRevision });
}
async function recordUndispatchedUnavailable({ kind = "material-preflight", task, taskId, stage, reviewTrack, reviewKind = null, subject, source, policy, diagnostic, materialFingerprint = null, materialRevision = null }) {
  const materialId = undispatchedUnavailableId({ kind, stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint, materialRevision });
  const policyFingerprint = policy === null ? null : hashCanonical(policy);
  const minimumReviewers = minimumReviewersForPolicy(policy, stage, reviewTrack, subject.review_scope);
  const managedIdentity = policy?.source === "wh_review.v2";
  const aggregation = aggregateProviderResults([], minimumReviewers, {
    profilePriority: policy?.requested_profiles ?? [],
    requireIdentity: managedIdentity,
    requireSourceId: managedIdentity,
  });
  const attemptId = randomUUID();
  const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree, root: reviewRootFor(task) });
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack, review_kind: reviewKind,
    ...subject, source: sourceRecord(source), snapshot_tree: source.snapshotTree, material_id: materialId,
    ...(materialRevision ? { material_revision: materialRevision } : {}),
    report_ref: refs.reportRef, provider_attempts: [], terminal_status: "unavailable", error: diagnostic,
    ...(policy ? { review_policy: policy, policy_snapshot_hash: policyFingerprint } : {}),
    coverage: reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation, requestedProfiles: policy?.requested_profiles ?? [] }),
  };
  validateSchema("attempt", attempt);
  writeAttempt(task, refs.attemptRef, attempt);
  writeReviewReport(task, refs.reportRef, { attempt });
  return {
    status: "unavailable", attemptRef: refs.attemptRef, resultRef: null, reportRef: refs.reportRef,
    snapshotTree: source.snapshotTree, materialId, ...(materialRevision ? { materialRevision } : {}), runtimeIds: {}, subjectKind: subject.subject_kind, phaseId: subject.phase_id,
    reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree,
  };
}
export async function recordMissingRouteUnavailable({ task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, reviewKind = null, workspace, candidateWorkspace, materialRevision = null, captureSource = captureSourceDefault } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!(attachmentRoot && taskId && stage)) throw new TypeError("missing-route unavailable review inputs are required");
  const diagnostic = { code: "REVIEW_ROUTE_UNAVAILABLE", message: `workflowhub host wh_review route is unavailable for ${stage}${reviewTrack ? `.${reviewTrack}` : ""}` };
  let source;
  if (stage === "make-decision") {
    if (candidateWorkspace !== undefined) {
      const candidate = assertCandidateWorkspace(candidateWorkspace);
      source = captureSource({ sourceRoot: candidate.worktreeRoot, targetRepoRoot: candidate.targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: false, taskId });
    } else {
      source = captureSource({ workspace: assertWorkspace(workspace), reviewDataRoot: attachmentRoot, includeDiff: false, taskId });
    }
  } else source = captureSource({ workspace: assertWorkspace(workspace), reviewDataRoot: attachmentRoot, includeDiff: false, taskId });
  try {
    return await recordUndispatchedUnavailable({ kind: "route-resolution", task: taskHandle, taskId, stage, reviewTrack, reviewKind, materialRevision, subject: subjectRecord(source, stage, phaseId), source, policy: null, diagnostic });
  } finally { source.dispose?.(); }
}
/** Explicit fake-source seam for isolated tests; the private token is not caller-forgeable. */
export function verifyFinalSubject({ result, current, integrationSubject = null, taskId = null } = {}) {
  if (!result || typeof result !== "object" || !current || typeof current !== "object") throw new TypeError("result and current source are required");
  const isIntegration = result.stage === "build-code" && result.review_scope === "integration" && integrationSubject !== null;
  // Writing executor facts into the task card does not change the reviewed
  // implementation. This narrow exception applies to every final review
  // stage, including verify-code; all other material changes remain stale.
  const recordOnlyWriteback = isExecutionRecordOnlyMaterialDelta(current.sourceRoot, result.snapshot_tree, current.snapshotTree, taskId);
  const expected = isIntegration ? integrationSubject : { base_commit: current.baseCommit, base_tree: current.baseTree, snapshot_tree: current.snapshotTree };
  if (!expected || typeof expected !== "object" || expected.base_commit !== result.source.base_commit || expected.base_tree !== result.base_tree || (isIntegration && expected.snapshot_tree !== current.snapshotTree && !recordOnlyWriteback)) {
    const error = new Error("WORKTREE_CHANGED_AFTER_REVIEW: current review subject differs from the reviewed subject"); error.code = "WORKTREE_CHANGED_AFTER_REVIEW"; throw error;
  }
  const subjectMismatch = result.subject_kind === "worktree" && !recordOnlyWriteback
    && (current.snapshotTree !== result.candidate_tree || current.snapshotTree !== result.snapshot_tree);
  const phaseMismatch = result.subject_kind === "phase" && (
    !current.phaseCommit
    || !result.source.phase_commit
    || JSON.stringify(current.phaseCommit) !== JSON.stringify(result.source.phase_commit)
    || current.snapshotTree !== result.candidate_tree
    || current.snapshotTree !== result.snapshot_tree
    || (current.phaseCommit.committed && !current.phaseCommit.tree_matches_candidate)
  );
  // target_commit is provenance about the repository used to resolve the
  // baseline, not part of the reviewed candidate subject. The candidate
  // snapshot, captured head, base commit/tree, and (for integration) final
  // subject are the freshness boundary. Requiring target HEAD equality here
  // makes an unrelated main-repository advance force a duplicate review for
  // the same candidate snapshot.
  if (subjectMismatch || phaseMismatch || (!recordOnlyWriteback && current.capturedHead !== result.source.captured_head) || result.source.base_commit !== expected.base_commit || result.source.base_tree !== expected.base_tree) {
    const error = new Error("WORKTREE_CHANGED_AFTER_REVIEW: current review subject differs from the reviewed subject"); error.code = "WORKTREE_CHANGED_AFTER_REVIEW"; throw error;
  }
  return { status: "finalized", snapshotTree: current.snapshotTree };
}
export function verifyFinal({ resultRef, sourceRoot, targetRepoRoot, workspace, candidateWorkspace, task, attachmentRoot, taskId = null, stage = null, reviewTrack = undefined, captureSource = captureSourceDefault } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (typeof resultRef !== "string" || !resultRef.startsWith("quality/reviews/results/")) throw new Error("RESULT_REF_INVALID: canonical result ref required");
  let result;
  try { result = JSON.parse(taskHandle.readRecord(resultRef)); } catch { throw new Error("RESULT_REF_INVALID: result does not exist or is invalid"); }
  validateSchema("result", result);
  if (result.subject_kind === "phase") { const error = new Error("PHASE_RESULT_NOT_FINAL: phase review results are quality facts, not verify-final results"); error.code = "PHASE_RESULT_NOT_FINAL"; throw error; }
  if (result.stage === "build-code" && result.review_scope !== "integration") { const error = new Error("INTEGRATION_RESULT_REQUIRED: build-code final review must be integration scope"); error.code = "INTEGRATION_RESULT_REQUIRED"; throw error; }
  if (taskId !== null && result.task_id !== taskId) throw new Error("RESULT_REF_INVALID: task does not match result");
  if (stage !== null && result.stage !== stage) throw new Error("RESULT_REF_INVALID: stage does not match result");
  if (reviewTrack !== undefined && result.review_track !== reviewTrack) throw new Error("RESULT_REF_INVALID: review track does not match result");
  if (result.stage === "make-decision") {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision verification forbids naked source/target paths; use Workspace");
    if (candidateWorkspace !== undefined) {
      const candidate = assertCandidateWorkspace(candidateWorkspace);
      sourceRoot = candidate.worktreeRoot;
      targetRepoRoot = candidate.targetRepoRoot;
    } else {
      workspace = assertWorkspace(workspace);
    }
  } else if (captureSource === captureSourceDefault) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("full worktree verification forbids naked source/target paths; use Workspace");
    workspace = assertWorkspace(workspace);
  }
  const current = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: false, taskId, ...(result.phase_id === null ? {} : { phaseId: result.phase_id }) });
  try {
    const integrationSubject = result.stage === "build-code" && result.review_scope === "integration" && workspace?.worktreeRoot
      ? buildIntegrationSubjectDefault({ task: taskHandle, sourceRoot: workspace.worktreeRoot, artifacts: ArtifactDir.open(workspace.worktreeRoot, taskHandle), finalTree: result.snapshot_tree })
      : null;
    return verifyFinalSubject({ result, current, integrationSubject, taskId });
  } finally { current.dispose?.(); }
}
