import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ArtifactDir } from "../../../core/artifact-dir.mjs";
import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "../../../runtime/task/workspace.mjs";
import { captureReviewSource as captureSourceDefault } from "./review-source.mjs";
import { buildIntegrationReviewSubject as buildIntegrationSubjectDefault } from "./integration-review-subject.mjs";
import { buildReviewMaterials as buildMaterialsDefault, minimumReviewersFor, reviewInstructionsFor } from "./review-materials.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import { aggregateProviderResults, renderReviewReport, reviewRefs, writeAttempt, writeProviderOutput, writeReviewReport, writeSemanticResult } from "./review-result.mjs";
import { buildSemanticProjection } from "./review-semantic-projection.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { captureExecutionSnapshot, isExecutionRecordOnlyMaterialDelta, isMaterialOnlySnapshotDelta } from "../../../runtime/task/git-worktree-snapshot.mjs";

const errorPriority = ["MATERIAL_TOO_LARGE", "MATERIAL_INCOMPLETE", "PUBLIC_RESULT_INVALID", "PROTOCOL_INCOMPATIBLE", "BROKER_SPAWN_FAILED", "BROKER_EXIT_NONZERO", "BROKER_INVOCATION_FAILED", "GROUP_OUTCOME_UNAVAILABLE", "OUTPUT_INVALID", "PROVIDER_UNAVAILABLE"];
// Providers run from a writable wrapper directory; sealed review material is
// deliberately exposed beneath `bundle/`, never at that directory's root.
// Keep the provider on the bounded, provider-visible view. The canonical
// archives and out-of-scope summaries remain audit material, but asking the
// model to enumerate the complete bundle makes large Phase reviews spend
// their budget on transport/tool traversal before semantic review.
const providerPrompt = "Read bundle/review-instructions.md first, then bundle/manifest.json and bundle/packet-plan.json. If packet-plan.json lists deduplicated_materials, treat each alias as the same bytes as its canonical_path and read the canonical file once; do not report the alias as missing. Read only manifest entries marked required, plus the declared contract and reviewer-lens entries and only the explicitly selected files under context/ needed by the maps; summary diff shards are navigation metadata and are not required to read. Use direct file reads only: do not call Grep, Glob, Bash, shell, directory listing, or recursive search, and do not enumerate or read canonical archives, full-diff archives, or out-of-scope summary shards unless the instructions explicitly require them. Return exactly one JSON object of the form {\"findings\":[{\"severity\":\"blocking|major|minor\",\"path\":\"provider-relative-material-path\",\"line\":1,\"issue\":\"...\",\"recommendation\":\"...\",\"root_cause\":\"...\",\"evidence_kind\":\"direct|machine|inferred\",\"evidence\":\"...\"}]}; every finding must include severity, path, issue, and recommendation, and every major/blocking finding must also include root_cause, evidence_kind, and evidence. Omit line only when no reliable line exists. Never omit path, and do not output any other top-level field.";
const FIXTURE_SOURCE_TOKEN = Symbol("wh-review fixture source");
const absoluteDiagnosticPath = /(?:^|[^A-Za-z0-9._~/%-])(?:\/(?![\s/])|[A-Za-z]:[\\/]|file:\/\/\/)/;
const reviewRootFor = () => "quality/reviews";
const providerOutputPrefixFor = (task, attemptId) => `${reviewRootFor(task)}/attempts/${attemptId}/providers/`;

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

function sourceStabilityDiagnostic(source, taskId) {
  if (typeof source?.sourceRoot !== "string" || source.sourceRoot === "") return null;
  try {
    const current = captureExecutionSnapshot(source.sourceRoot, taskId);
    if (current.head === source.capturedHead && current.tree === source.snapshotTree) return null;
    return {
      code: "SOURCE_CHANGED_AFTER_CAPTURE",
      message: "review source changed after the packet was built; provider dispatch was skipped",
    };
  } catch {
    return {
      code: "SOURCE_UNAVAILABLE",
      message: "review source could not be revalidated before provider dispatch",
    };
  }
}

function reviewScopeFor(stage, phaseId) {
  return stage === "build-code" ? (phaseId ? "phase" : "integration") : null;
}

/**
 * Direction review is one broker request containing an internal, ordered flow.
 * The broker must enforce the reveal boundary; WorkflowHub must not emulate it
 * with two public calls because that violates the one-round review contract.
 */
function directionInputError(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  return error;
}

function normalizeDirectionSelection(value) {
  if (typeof value === "string" && value.trim() !== "") return Object.freeze({ current_selection: value });
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.current_selection !== "string" || value.current_selection.trim() === "") {
    throw directionInputError("direction_selection.current_selection is required for the reveal challenge");
  }
  const selection = { current_selection: value.current_selection };
  for (const field of ["alternatives", "selection_rationale", "key_assumptions"]) {
    if (value[field] !== undefined) selection[field] = structuredClone(value[field]);
  }
  return Object.freeze(selection);
}

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

function integrationMaterialFacts(integrationSubject) {
  if (!integrationSubject || integrationSubject.schema_version !== "integration-review-subject.v1" ||
      integrationSubject.subject_kind !== "worktree" || integrationSubject.review_scope !== "integration" ||
      (integrationSubject.ac_trace !== undefined && integrationSubject.ac_trace.schema_version !== "ac-change-test-trace.v1")) {
    throw new TypeError("integration subject is invalid");
  }
  return integrationSubject.ac_trace ? { ac_trace: integrationSubject.ac_trace } : {};
}

function integrationSemanticFacts(integrationSubject) {
  const acTrace = integrationSubject?.ac_trace;
  if (!acTrace || !Array.isArray(acTrace.implementation_anchors)) return {};
  return {
    implementation_context: {
      schema_version: "wh-review-integration-implementation-context.v1",
      anchors: acTrace.implementation_anchors,
    },
  };
}

function stringList(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) throw new TypeError(`${label} must be a string array`);
  return [...value];
}

function adapterOf(provider) { return provider.split("/", 1)[0]; }

function normalizeRequestedProfileSpecs(value, requestedProfiles) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError("reviewPolicy.requested_profile_specs is invalid");
  const specs = value.map((profile) => {
    if (!profile || typeof profile !== "object" || Array.isArray(profile) || typeof profile.provider !== "string" ||
        (profile.model !== null && typeof profile.model !== "string") ||
        (profile.effort !== null && typeof profile.effort !== "string") ||
        (profile.thinking !== null && typeof profile.thinking !== "boolean") ||
        !Number.isSafeInteger(profile.priority) || profile.priority < 0) {
      throw new TypeError("reviewPolicy.requested_profile_specs is invalid");
    }
    return { provider: profile.provider, model: profile.model, effort: profile.effort, thinking: profile.thinking, priority: profile.priority };
  });
  if (specs.length !== requestedProfiles.length || specs.some((profile, index) => profile.provider !== requestedProfiles[index])) {
    throw new TypeError("reviewPolicy.requested_profile_specs must pin requested_profiles in priority order");
  }
  return specs;
}

function reviewPolicyRecord(value) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || !["wh_review.v2", "legacy_3rd_review"].includes(value.source)) throw new TypeError("reviewPolicy is invalid");
  if (typeof value.mode !== "string" || !["single_round", "adaptive", "full_only", "full_on_structural_rework", "legacy"].includes(value.mode)) throw new TypeError("reviewPolicy.mode is invalid");
  if (value.minimum_heterologous !== null && (!Number.isSafeInteger(value.minimum_heterologous) || value.minimum_heterologous < 1)) throw new TypeError("reviewPolicy.minimum_heterologous is invalid");
  if (value.source === "wh_review.v2" && value.minimum_heterologous === null) throw new TypeError("wh_review.v2 requires reviewPolicy.minimum_heterologous");
  const effectiveProfiles = Array.isArray(value.effective_profiles) ? value.effective_profiles.map((profile) => {
    if (!profile || typeof profile !== "object" || Array.isArray(profile) || typeof profile.provider !== "string" || typeof profile.adapter !== "string") throw new TypeError("reviewPolicy.effective_profiles is invalid");
    if (profile.model !== null && typeof profile.model !== "string") throw new TypeError("reviewPolicy effective model is invalid");
    if (profile.effort !== null && typeof profile.effort !== "string") throw new TypeError("reviewPolicy effective effort is invalid");
    if (profile.thinking !== null && typeof profile.thinking !== "boolean") throw new TypeError("reviewPolicy effective thinking is invalid");
    return { provider: profile.provider, adapter: profile.adapter, model: profile.model, effort: profile.effort, thinking: profile.thinking };
  }) : (() => { throw new TypeError("reviewPolicy.effective_profiles is invalid"); })();
  const requestedProfiles = stringList(value.requested_profiles, "reviewPolicy.requested_profiles");
  const requestedProfileSpecs = normalizeRequestedProfileSpecs(value.requested_profile_specs, requestedProfiles);
  // A configured profile is an independently requested reviewer. Adapter
  // identity is only diagnostic/source metadata; it must not collapse two
  // configured models into one public member.
  const eligibleProfiles = stringList(value.eligible_profiles, "reviewPolicy.eligible_profiles");
  if (effectiveProfiles.length !== eligibleProfiles.length || effectiveProfiles.some((profile, index) =>
    profile.provider !== eligibleProfiles[index] || profile.adapter !== adapterOf(profile.provider))) {
    throw new TypeError("reviewPolicy.effective_profiles must represent eligible_profiles in priority order");
  }
  return {
    source: value.source, mode: value.mode, minimum_heterologous: value.minimum_heterologous,
    requested_profiles: requestedProfiles,
    ...(requestedProfileSpecs.length ? { requested_profile_specs: requestedProfileSpecs } : {}),
    eligible_profiles: eligibleProfiles,
    same_source_exclusions: stringList(value.same_source_exclusions, "reviewPolicy.same_source_exclusions"),
    effective_profiles: effectiveProfiles,
  };
}

function minimumReviewersForPolicy(policy, stage, reviewTrack, reviewScope = null) {
  return policy?.source === "wh_review.v2"
    ? policy.minimum_heterologous
    : minimumReviewersFor(stage, reviewTrack, reviewScope);
}

function reuseSatisfiesCurrentPolicy({ result, attempt, reviewPolicy }) {
  if (reviewPolicy?.source !== "wh_review.v2") return true;
  const eligible = new Set(reviewPolicy.eligible_profiles ?? []);
  const attempts = new Map((attempt.provider_attempts ?? []).map((item) => [item.provider, item]));
  const adapters = new Set();
  const sources = new Set();
  for (const member of result.provider_results ?? []) {
    if (!eligible.has(member.provider)) continue;
    const providerAttempt = attempts.get(member.provider);
    if (!providerAttempt || providerAttempt.status !== "completed" || typeof providerAttempt.output_ref !== "string") continue;
    const adapter = providerAttempt.identity?.adapter;
    const sourceId = providerAttempt.identity?.source_id;
    if (typeof adapter !== "string" || adapter.trim() === ""
        || typeof sourceId !== "string" || sourceId.trim() === "") return false;
    adapters.add(adapter);
    sources.add(sourceId);
  }
  return adapters.size >= reviewPolicy.minimum_heterologous && sources.size >= reviewPolicy.minimum_heterologous;
}

function providerOutputCarriesAnchors(task, attempt) {
  for (const providerAttempt of attempt.provider_attempts ?? []) {
    if (providerAttempt.status !== "completed" || typeof providerAttempt.output_ref !== "string") continue;
    try {
      const output = JSON.parse(task.readRecord(providerAttempt.output_ref));
      if (!Array.isArray(output.evidence_anchor_valid) || output.evidence_anchor_valid.some((value) => typeof value !== "boolean")) return false;
      const review = parseReviewerOutput(output.content, { requireEvidence: true });
      if (output.evidence_anchor_valid.length !== review.findings.length) return false;
    } catch {
      return false;
    }
  }
  return true;
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
export function findReusableReviewResult({ task, source, subject, integrationSubject = null, stage, reviewTrack = null, reviewKind = null, semanticProjection, reviewPolicy = null } = {}) {
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

function publishReusedReviewResult({ task, taskId, stage, reviewTrack, reviewKind, source, subject, integrationSubject, bundle, semanticProjection, reusable, reviewPolicy = null }) {
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

function evidenceAnchorsFor(reviewed, bundle) {
  if (!Array.isArray(bundle.manifest) || bundle.manifest.length === 0) return reviewed;
  const manifestPaths = new Set(bundle.manifest.map(({ path }) => path));
  let diffIndex = null;
  if (manifestPaths.has("diff-index.json")) {
    try { diffIndex = JSON.parse(readFileSync(join(bundle.bundleRoot, "diff-index.json"), "utf8")); }
    catch { diffIndex = null; }
  }
  return reviewed.map((item) => {
    if (!item.review) return item;
    const evidenceAnchors = item.review.findings.map((finding) => {
      if (!["direct", "machine"].includes(finding.evidence_kind)) return true;
      const logicalDiffPath = Array.isArray(diffIndex?.changes)
        ? diffIndex.changes.find((change) => change.path === finding.path)
        : null;
      if (!manifestPaths.has(finding.path) && !logicalDiffPath) return false;
      if (logicalDiffPath && (!Array.isArray(logicalDiffPath.shards) || !logicalDiffPath.shards.some((shard) => shard.delivery === "included"))) return false;
      // The provider contract allows a packet-relative path anchor without a
      // guessed line when the excerpt is the smallest reliable unit. Keep
      // rejecting a bare "path exists" claim, but do not throw away a real
      // finding merely because the provider could not name a stable line.
      if (finding.line === undefined || finding.line === null) {
        const evidence = String(finding.evidence ?? "").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
        const path = finding.path.toLocaleLowerCase("en");
        return evidence !== path && evidence !== `${path} exists`;
      }
      if (!Number.isSafeInteger(finding.line) || finding.line < 1) return false;
      if (manifestPaths.has(finding.path)) {
        try { return readFileSync(join(bundle.bundleRoot, ...finding.path.split("/")), "utf8").split(/\r?\n/).length >= finding.line; }
        catch { return false; }
      }
      // In selected-context packets the provider names the logical changed
      // file while the manifest carries diff shards. The diff-index is the
      // authenticated bridge; require the line to fall inside a delivered
      // unified-diff hunk instead of accepting any positive integer.
      return Array.isArray(logicalDiffPath?.new_line_ranges)
        && logicalDiffPath.new_line_ranges.some(({ start_line: start, end_line: end }) => finding.line >= start && finding.line <= end);
    });
    return { ...item, evidenceAnchors };
  });
}

function materialPreflightCode(error) {
  if (["MATERIAL_TOO_LARGE", "MATERIAL_INCOMPLETE", "MATERIAL_FORBIDDEN"].includes(error?.code)) return error.code;
  return /^(MATERIAL_TOO_LARGE|MATERIAL_INCOMPLETE|MATERIAL_FORBIDDEN):\s/.exec(error?.message ?? "")?.[1] ?? null;
}

function isMaterialPreflightFailure(error) { return materialPreflightCode(error) !== null; }

function materialPreflightDiagnostic(error) {
  const code = materialPreflightCode(error);
  if (code === null) throw error;
  const message = typeof error.message === "string" && error.message.length > 0 ? error.message : error.code;
  return absoluteDiagnosticPath.test(message)
    ? { code, message: "review material preflight failed; private diagnostic withheld" }
    : { code, message };
}

function undispatchedUnavailableId({ kind, stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint = null }) {
  return hashCanonical(kind === "material-preflight"
    ? { version: "wh-review-material-preflight.v1", stage, review_track: reviewTrack, subject, source, snapshot_tree: source.snapshotTree, review_policy: policy, diagnostic, material_fingerprint: materialFingerprint }
    : { version: "wh-review-undispatched-unavailable.v1", kind, stage, review_track: reviewTrack, subject, source, snapshot_tree: source.snapshotTree, review_policy: policy, diagnostic, material_fingerprint: materialFingerprint });
}

async function recordUndispatchedUnavailable({ kind = "material-preflight", task, taskId, stage, reviewTrack, reviewKind = null, subject, source, policy, diagnostic, materialFingerprint = null }) {
  const materialId = undispatchedUnavailableId({ kind, stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint });
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
    report_ref: refs.reportRef, provider_attempts: [], terminal_status: "unavailable", error: diagnostic,
    ...(policy ? { review_policy: policy, policy_snapshot_hash: policyFingerprint } : {}),
    coverage: reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation, requestedProfiles: policy?.requested_profiles ?? [] }),
  };
  validateSchema("attempt", attempt);
  writeAttempt(task, refs.attemptRef, attempt);
  writeReviewReport(task, refs.reportRef, { attempt });
  return {
    status: "unavailable", attemptRef: refs.attemptRef, resultRef: null, reportRef: refs.reportRef,
    snapshotTree: source.snapshotTree, materialId, runtimeIds: {}, subjectKind: subject.subject_kind, phaseId: subject.phase_id,
    reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree,
  };
}

function failedProvider(provider, error) {
  return { provider, status: "failed", session_id: null, output: null, error: { code: error?.code ?? "PROVIDER_UNAVAILABLE", message: error?.message ?? String(error) }, execution: null };
}

function groupFailureItem(error, provider = null) {
  const failed = failedProvider(provider, error);
  return { provider, review: null, final: failed, calls: [{ runtimeId: null, provider: failed }], group_failure: true };
}

function primaryError(reviewed) {
  const errors = reviewed.flatMap((item) => [item.group_error, item.final?.error])
    .filter((error) => typeof error?.code === "string");
  if (errors.length === 0) return { code: "PROVIDER_UNAVAILABLE", message: "no provider returned a valid semantic result" };
  return [...errors].sort((left, right) => {
    const leftRank = errorPriority.indexOf(left.code); const rightRank = errorPriority.indexOf(right.code);
    const rank = (leftRank < 0 ? errorPriority.length : leftRank) - (rightRank < 0 ? errorPriority.length : rightRank);
    return rank || left.code.localeCompare(right.code) || left.message.localeCompare(right.message);
  })[0];
}

function pinnedProfileMatches(profile, execution, identity = null, resultProtocol = null) {
  if (execution === null || execution === undefined || execution.model !== profile.model) return false;
  // workflowhub-result.v3 carries the complete configured profile in its
  // broker-side config identity, but does not expose effort or thinking as
  // separate model-reported fields. If a configured pin depends on either
  // value, require that attestation; do not silently accept a v3 result with
  // no profile identity. The host/broker config check remains the authority
  // for the tuple itself, so WorkflowHub does not duplicate the broker hash.
  if (resultProtocol === "workflowhub-result.v3"
      && (profile.effort !== null || profile.thinking !== null)
      && (typeof identity?.config_id !== "string" || identity.config_id.trim() === "")) return false;
  const effortMatches = execution.effort === null || execution.effort === undefined || execution.effort === profile.effort;
  const thinkingMatches = execution.thinking === null || execution.thinking === undefined || execution.thinking === profile.thinking;
  return effortMatches && thinkingMatches;
}

function rejectProfileMismatches(reviewed, policy) {
  const expected = new Map((policy?.requested_profile_specs ?? []).map((profile) => [profile.provider, profile]));
  return reviewed.map((item) => {
    const profile = expected.get(item.provider);
    if (!profile || item.final.status !== "completed"
        || pinnedProfileMatches(profile, item.final.execution, item.identity ?? item.final.identity, item.final.result_protocol)) return item;
    return {
      ...item,
      review: null,
      final: { ...item.final, error: { code: "PROFILE_MISMATCH", message: `3rd-review execution tuple does not match configured profile ${item.provider}` } },
    };
  });
}

function reviewGroupOutcome(provider, result, runtimeId) {
  // A broker must not expose semantic output when transport already reports
  // an error. Some adapters can return a completed-shaped envelope while
  // retaining a non-zero lifecycle error; that is unavailable evidence, not
  // a valid findings result.
  if (result.status !== "completed" || typeof result.output !== "string" || result.error) {
    return { provider, review: null, final: result, calls: [{ runtimeId, provider: result }] };
  }
  try {
    return { provider, ...(result.identity ? { identity: result.identity } : {}), review: parseReviewerOutput(result.output, { requireEvidence: true }), final: result, calls: [{ runtimeId, provider: result }] };
  } catch {
    return {
      provider, ...(result.identity ? { identity: result.identity } : {}), review: null,
      final: { ...result, error: { code: "OUTPUT_INVALID", message: "provider output is not valid reviewer JSON" } },
      calls: [{ runtimeId, provider: { ...result, error: { code: "OUTPUT_INVALID", message: "provider output is not valid reviewer JSON" } } }],
    };
  }
}

async function reviewGroup({ providerClient, providers, hostProvider, materials, prompt = providerPrompt, reviewFlow = null, reviewMode = null }) {
  if (typeof providerClient?.runGroup !== "function") throw new TypeError("providerClient.runGroup is required; review dispatch is one broker group call");
  let group;
  try {
    // Attachment delivery is a broker transport decision. The complete
    // configured profile group must reach one public run so the broker can
    // apply quorum, source filtering, and profile identity atomically.
    group = await providerClient.runGroup({ hostProvider, providers, materials, prompt, ...(reviewMode ? { reviewMode } : {}), ...(reviewFlow ? { reviewFlow } : {}) });
  } catch (error) {
    // One broker invocation failed before it produced provider-level facts.
    // Keep the configured provider list for coverage, but do not turn one
    // group failure into N independent provider attempts.
    return [groupFailureItem(error)];
  }
  if (!group || typeof group.runtimeId !== "string" || !Array.isArray(group.providers)) {
    const error = protocolFailure("3rd-review group client returned an incomplete result");
    return [groupFailureItem(error)];
  }
  const groupOutcome = typeof group.outcome === "string" ? group.outcome : null;
  const groupError = groupOutcome === "unavailable" || groupOutcome === "cancelled"
    ? { code: "GROUP_OUTCOME_UNAVAILABLE", message: `3rd-review group ended with ${groupOutcome}; member output is not a semantic review result` }
    : null;
  const groupByProvider = new Map(group.providers.map((result) => [result?.provider, result]));
  const reviewedGroups = providers.map((provider) => {
    const result = groupByProvider.get(provider);
    if (!result) {
      return groupFailureItem(protocolFailure(`3rd-review group omitted provider ${provider}`), provider);
    }
    const reviewed = reviewGroupOutcome(provider, result, group.runtimeId);
    return {
      ...reviewed,
      ...(groupOutcome ? { group_outcome: groupOutcome } : {}),
      ...(group.round === undefined ? {} : { group_round: group.round }),
      ...(group.selectedTier === undefined ? {} : { group_selected_tier: group.selectedTier }),
      ...(groupError ? { group_error: groupError, review: null } : {}),
    };
  });
  const reviewedByProvider = new Map(reviewedGroups.map((item) => [item.provider, item]));
  return providers.map((provider) => reviewedByProvider.get(provider));
}

async function runReviewOnce({ sourceRoot, targetRepoRoot, workspace, candidateWorkspace, task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, reviewKind = null, reviewScope = undefined, uiScope = false, materials = {}, current_receipts = {}, directionSelection = null, hostProvider, providers, reviewPolicy = null, providerClient, captureSource = captureSourceDefault, buildMaterials = buildMaterialsDefault, buildIntegrationSubject = undefined, fixtureSourceToken } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!(attachmentRoot && taskId && stage && hostProvider && providerClient) || !Array.isArray(providers) || providers.length === 0) throw new TypeError("review inputs, attachmentRoot, and at least one provider are required");
  if (reviewScope !== undefined) throw new TypeError("review_scope is derived from phase_id and cannot be supplied by a caller");
  if (buildIntegrationSubject !== undefined && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) throw new TypeError("integration subject is derived from current task evidence");
  if (new Set(providers).size !== providers.length) throw new TypeError("providers must be unique");
  const policy = reviewPolicyRecord(reviewPolicy);
  if (policy?.source !== "wh_review.v2" && providers.includes(hostProvider)) throw new TypeError("provider must differ from hostProvider");
  if (policy && (policy.requested_profiles.length !== providers.length || policy.requested_profiles.some((provider, index) => provider !== providers[index]))) {
    throw new TypeError("reviewPolicy requested_profiles must equal broker reviewer group");
  }
  if (stage === "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision review forbids naked source/target paths; use the existing Workspace");
    if (candidateWorkspace !== undefined) {
      const candidate = assertCandidateWorkspace(candidateWorkspace);
      sourceRoot = candidate.worktreeRoot;
      targetRepoRoot = candidate.targetRepoRoot;
    } else {
      workspace = assertWorkspace(workspace);
    }
  } else if (stage !== "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("full worktree review forbids naked source/target paths; use Workspace");
    workspace = assertWorkspace(workspace);
  }
  // The final build-code integration review is a worktree-semantic review.
  // Do not even capture a cumulative diff for it: the integration contract
  // forbids diff delivery and the subject builder supplies bounded current
  // implementation excerpts. Phase reviews still capture their phase diff.
  const needsMiniImplementationDiff = reviewKind === "mini_task.implementation";
  const designMaterialsOnly = reviewKind === "mini_task.design";
  const source = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot,
    // Design review is about the frozen four materials and plan risks. Sending
    // the whole dirty phase diff is both out of contract and can exceed the
    // broker packet ceiling before any provider is called.
    includeDiff: !designMaterialsOnly && (phaseId !== null || stage !== "build-code" || needsMiniImplementationDiff),
    taskId, ...(phaseId === null ? {} : { phaseId }) });
  const isDirectionReview = stage === "make-decision" && reviewTrack === "direction" && reviewKind === null;
  let integrationSubject; let subject; let bundle; let fixedMaterials;
  try {
    // mini-task reviews use their own material contracts even though the
    // public runner enters through the build-code stage. They must not be
    // treated as the ordinary final integration review, which would inject
    // integration-only subject/material requirements.
    const isIntegration = stage === "build-code" && phaseId === null && reviewKind === null;
    if (isIntegration && (fixtureSourceToken !== FIXTURE_SOURCE_TOKEN || typeof buildIntegrationSubject === "function")) {
      integrationSubject = (buildIntegrationSubject ?? buildIntegrationSubjectDefault)({
        task: taskHandle,
        sourceRoot: workspace?.worktreeRoot ?? source.sourceRoot,
        ...(workspace?.worktreeRoot ? { artifacts: ArtifactDir.open(workspace.worktreeRoot, taskHandle) } : {}),
        current_receipts,
        finalTree: source.snapshotTree,
      });
    } else integrationSubject = null;
    subject = subjectRecord(source, stage, phaseId, integrationSubject);
    const baseMaterials = {
      ...materials,
      ...(integrationSubject ? integrationMaterialFacts(integrationSubject) : {}),
    };
    if (isDirectionReview) {
      const selection = normalizeDirectionSelection(directionSelection);
      const sequence = planDirectionReviewRequests({
        raw_requirement: baseMaterials.raw_requirement,
        objective_facts: baseMaterials.objective_facts,
        current_selection: selection,
      });
      fixedMaterials = {
        ...baseMaterials,
        ...selection,
        direction_flow: sequence.flow,
        review_instructions: reviewInstructionsFor(stage, reviewTrack, uiScope, subject.review_scope, reviewKind, "combined"),
      };
      bundle = buildMaterials({
        reviewDataRoot: attachmentRoot, attachmentRoot, source, task: taskHandle, taskId, stage, phaseId, reviewTrack, reviewKind,
        reviewScope: subject.review_scope, uiScope, materials: fixedMaterials, strictV2Maps: policy?.source === "wh_review.v2", directionMode: "combined",
      });
      fixedMaterials = Object.freeze({ ...fixedMaterials, __direction_flow: sequence.flow });
    } else {
      fixedMaterials = {
        ...baseMaterials,
        review_instructions: reviewInstructionsFor(stage, reviewTrack, uiScope, subject.review_scope, reviewKind),
      };
      bundle = buildMaterials({
        reviewDataRoot: attachmentRoot, attachmentRoot, source, task: taskHandle, taskId, stage, phaseId, reviewTrack, reviewKind,
        reviewScope: subject.review_scope, uiScope, materials: fixedMaterials, strictV2Maps: policy?.source === "wh_review.v2",
      });
    }
  } catch (error) {
    source.dispose?.();
    if (!isMaterialPreflightFailure(error)) throw error;
    const diagnostic = materialPreflightDiagnostic(error);
    const preflightSubject = subject ?? subjectRecord(source, stage, phaseId);
    return await recordUndispatchedUnavailable({
      task: taskHandle, taskId, stage, reviewTrack, reviewKind, subject: preflightSubject, source, policy, diagnostic,
      materialFingerprint: hashCanonical(materials ?? null),
    });
  }
  const stabilityDiagnostic = sourceStabilityDiagnostic(source, taskId);
  if (stabilityDiagnostic) {
    const unavailableResult = await recordUndispatchedUnavailable({
      kind: "source-stability", task: taskHandle, taskId, stage, reviewTrack, reviewKind,
      subject: subject ?? subjectRecord(source, stage, phaseId), source, policy,
      diagnostic: stabilityDiagnostic, materialFingerprint: hashCanonical(materials ?? null),
    });
    source.dispose?.();
    return unavailableResult;
  }
  if (!isDirectionReview) source.dispose?.();
  let contractId;
  let contractHash;
  let semanticProjection;
  let reviewBundle;
  let reviewed;
  if (isDirectionReview) {
    const directionMaterials = Object.fromEntries(Object.entries(fixedMaterials).filter(([key]) => !key.startsWith("__direction_")));
    const directionFlow = fixedMaterials.__direction_flow;
    contractId = bundle.contractId ?? "wh-review.contract.make-decision.v1";
    contractHash = bundle.contractHash ?? hashCanonical({ contract_id: contractId, review_instructions: directionMaterials.review_instructions, direction_flow: directionFlow });
    semanticProjection = buildSemanticProjection({
      stage, review_track: reviewTrack, review_scope: subject.review_scope, review_kind: reviewKind,
      contract_id: contractId, contract_hash: contractHash, input: directionMaterials, materials: directionMaterials,
      subject, extra: integrationSubject ? integrationSemanticFacts(integrationSubject) : {},
    });
    reviewBundle = { ...bundle, contractId, contractHash, semanticHash: semanticProjection.semantic_hash };
    reviewed = rejectProfileMismatches(await reviewGroup({
      providerClient, providers, hostProvider, materials: reviewBundle, reviewFlow: directionFlow,
      reviewMode: policy?.mode ?? null,
      prompt: `${providerPrompt} ${directionMaterials.review_instructions} Execute the declared direction-review.v1 flow inside this one public request. Return one findings object after challenge; do not create a second public request.`,
    }), policy);
    fixedMaterials = directionMaterials;
    bundle = reviewBundle;
    source.dispose?.();
  } else {
    contractId = bundle.contractId ?? `wh-review.contract.${reviewKind === "mini_task.design" ? "mini-task-design" : reviewKind === "mini_task.implementation" ? "mini-task-implementation" : stage}.v1`;
    contractHash = bundle.contractHash ?? hashCanonical({ contract_id: contractId, review_instructions: fixedMaterials.review_instructions });
    semanticProjection = buildSemanticProjection({
      stage, review_track: reviewTrack, review_scope: subject.review_scope, review_kind: reviewKind,
      contract_id: contractId, contract_hash: contractHash, input: fixedMaterials, materials: fixedMaterials,
      subject, extra: integrationSubject ? integrationSemanticFacts(integrationSubject) : {},
    });
    reviewBundle = { ...bundle, contractId, contractHash, semanticHash: semanticProjection.semantic_hash };
    const reusable = findReusableReviewResult({
      task: taskHandle, source, subject, integrationSubject, stage, reviewTrack, reviewKind, semanticProjection,
      reviewPolicy: policy,
    });
    if (reusable) {
      if (reusable.exact) {
        source.dispose?.();
        return {
          status: "available", reused: true, attemptRef: reusable.result.attempt_ref, resultRef: reusable.resultRef,
          reportRef: reusable.result.report_ref ?? null, snapshotTree: source.snapshotTree, materialId: bundle.materialId,
          runtimeIds: {}, subjectKind: subject.subject_kind, phaseId: subject.phase_id,
          reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree,
        };
      }
      const reusedResult = publishReusedReviewResult({
        task: taskHandle, taskId, stage, reviewTrack, reviewKind, source, subject, integrationSubject,
        bundle, semanticProjection, reusable, reviewPolicy: policy,
      });
      source.dispose?.();
      return reusedResult;
    }
    reviewed = rejectProfileMismatches(await reviewGroup({ providerClient, providers, hostProvider, materials: reviewBundle, reviewMode: policy?.mode ?? null }), policy);
  }
  const attemptId = randomUUID();
  const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree, root: reviewRootFor(taskHandle) });
  const runtimeIds = Object.fromEntries(reviewed
    .filter((item) => typeof item.provider === "string")
    .map((item) => [item.provider, [...item.calls].reverse().find((call) => typeof call.runtimeId === "string")?.runtimeId ?? null]));
  const groupFailure = reviewed.find((item) => item.group_failure)?.final?.error ?? null;
  const groupOutcome = reviewed.find((item) => typeof item.group_outcome === "string")?.group_outcome ?? null;
  const assessed = evidenceAnchorsFor(reviewed, bundle);
  const providerAttempts = [];
  for (const item of assessed) {
    if (groupFailure) break;
    for (let index = 0; index < item.calls.length; index += 1) {
      const call = item.calls[index];
      const finalError = call.provider?.error ?? (index === item.calls.length - 1 ? item.final?.error ?? null : null);
      const outputRef = writeProviderOutput(taskHandle, refs.providerDirectoryRef, item.provider, call.provider.output, index + 1, {
        taskId, stage, evidence_anchor_valid: item.evidenceAnchors,
      });
      providerAttempts.push({
        provider: item.provider, status: finalError ? "failed" : call.provider.status,
        ...(call.provider.identity ? { identity: call.provider.identity } : {}),
        session_id: call.provider.session_id ?? null, runtime_id: call.runtimeId ?? null,
        execution: call.provider.execution ?? null, unavailable_diagnostics: call.provider.unavailable_diagnostics ?? null,
        output_ref: outputRef, raw_output_ref: call.provider.raw_output_ref ?? null, error: finalError,
      });
    }
  }
  const minimumReviewers = minimumReviewersForPolicy(policy, stage, reviewTrack, subject.review_scope);
  const aggregation = aggregateProviderResults(assessed, minimumReviewers, {
    profilePriority: policy?.requested_profiles ?? providers,
    // The managed policy is a hard identity boundary. Missing broker source
    // identity makes the semantic quorum unverifiable; it must not fall back
    // to the configured provider name.
    requireIdentity: policy?.source === "wh_review.v2",
    requireSourceId: policy?.source === "wh_review.v2",
  });
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack, review_kind: reviewKind,
    ...subject, source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
    semantic_projection: semanticProjectionIdentity(semanticProjection),
    report_ref: refs.reportRef, provider_attempts: providerAttempts,
    terminal_status: aggregation.status === "available" ? "semantic" : "unavailable",
    error: aggregation.status === "available" ? null : (() => { const error = groupFailure ?? primaryError(reviewed); return { code: error.code, message: `${error.message}; only ${aggregation.valid.length} valid reviewer result(s); ${minimumReviewers} required` }; })(),
    ...(policy ? { review_policy: policy, policy_snapshot_hash: hashCanonical(policy) } : {}),
    coverage: reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation, requestedProfiles: providers, groupOutcome }),
  };
  validateSchema("attempt", attempt);
  writeAttempt(taskHandle, refs.attemptRef, attempt);
  if (aggregation.status !== "available") {
    writeReviewReport(taskHandle, refs.reportRef, { attempt });
    return { status: "unavailable", attemptRef: refs.attemptRef, resultRef: null, reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
  }
  const providerResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const findings = aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding }));
  const result = {
    version: "wh-review-result.v1", task_id: taskId, stage, review_track: reviewTrack, review_kind: reviewKind, ...subject,
    source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
    semantic_projection: semanticProjectionIdentity(semanticProjection),
    attempt_ref: refs.attemptRef, report_ref: refs.reportRef, provider_results: providerResults,
    findings,
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  validateSchema("result", result);
  writeSemanticResult(taskHandle, refs.resultRef, result);
  writeReviewReport(taskHandle, refs.reportRef, { attempt, result });
  return { status: "available", attemptRef: refs.attemptRef, resultRef: refs.resultRef, reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
}

export async function runReview(options = {}) {
  return runReviewOnce(options);
}

export async function recordMissingRouteUnavailable({ task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, reviewKind = null, workspace, candidateWorkspace, captureSource = captureSourceDefault } = {}) {
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
    return await recordUndispatchedUnavailable({ kind: "route-resolution", task: taskHandle, taskId, stage, reviewTrack, reviewKind, subject: subjectRecord(source, stage, phaseId), source, policy: null, diagnostic });
  } finally { source.dispose?.(); }
}

/** Explicit fake-source seam for isolated tests; the private token is not caller-forgeable. */
export function runReviewFixture(options) { return runReview({ ...options, fixtureSourceToken: FIXTURE_SOURCE_TOKEN }); }

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
