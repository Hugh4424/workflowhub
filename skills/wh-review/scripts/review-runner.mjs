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
import { validateSchema } from "./schema-validator.mjs";

const errorPriority = ["MATERIAL_INCOMPLETE", "PUBLIC_RESULT_INVALID", "PROTOCOL_INCOMPATIBLE", "OUTPUT_INVALID", "PROVIDER_UNAVAILABLE"];
// Providers run from a writable wrapper directory; sealed review material is
// deliberately exposed beneath `bundle/`, never at that directory's root.
const providerPrompt = "Read bundle/review-instructions.md and the complete frozen bundle. Return the requested JSON object only.";
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

function reviewScopeFor(stage, phaseId) {
  return stage === "build-code" ? (phaseId ? "phase" : "integration") : null;
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

function integrationMaterialFacts(integrationSubject) {
  if (!integrationSubject || integrationSubject.schema_version !== "integration-review-subject.v1" ||
      integrationSubject.subject_kind !== "worktree" || integrationSubject.review_scope !== "integration" ||
      (integrationSubject.ac_trace !== undefined && integrationSubject.ac_trace.schema_version !== "ac-change-test-trace.v1")) {
    throw new TypeError("integration subject is invalid");
  }
  return integrationSubject.ac_trace ? { ac_trace: integrationSubject.ac_trace } : {};
}

function stringList(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) throw new TypeError(`${label} must be a string array`);
  return [...value];
}

function adapterOf(provider) { return provider.split("/", 1)[0]; }

function uniqueAdapterProfiles(providers, label) {
  const adapters = new Set();
  for (const provider of providers) {
    const adapter = adapterOf(provider);
    if (adapters.has(adapter)) throw new TypeError(`${label} must contain at most one profile per adapter`);
    adapters.add(adapter);
  }
  return providers;
}

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
  const eligibleProfiles = uniqueAdapterProfiles(stringList(value.eligible_profiles, "reviewPolicy.eligible_profiles"), "reviewPolicy.eligible_profiles");
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

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function hashCanonical(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation }) {
  if (!policy) return null;
  const selectedProfiles = [...policy.eligible_profiles];
  return {
    mode: stage === "build-code" && policy.mode === "full_only" && selectedProfiles.length === 1 ? "single_external" : "parallel_external",
    selected_profiles: selectedProfiles,
    selected_count: selectedProfiles.length,
    valid_provider_count: aggregation.valid.length,
    minimum_required: minimumReviewers,
  };
}

function evidenceAnchorsFor(reviewed, bundle) {
  if (!Array.isArray(bundle.manifest) || bundle.manifest.length === 0) return reviewed;
  const manifestPaths = new Set(bundle.manifest.map(({ path }) => path));
  return reviewed.map((item) => {
    if (!item.review) return item;
    const evidenceAnchors = item.review.findings.map((finding) => {
      if (!["direct", "machine"].includes(finding.evidence_kind)) return true;
      if (!manifestPaths.has(finding.path)) return false;
      if (finding.evidence_kind === "machine" && !finding.path.startsWith("canonical/")) return false;
      if (finding.line === undefined) return true;
      try { return readFileSync(join(bundle.bundleRoot, ...finding.path.split("/")), "utf8").split(/\r?\n/).length >= finding.line; }
      catch { return false; }
    });
    return { ...item, evidenceAnchors };
  });
}

function materialPreflightCode(error) {
  if (["MATERIAL_INCOMPLETE", "MATERIAL_FORBIDDEN"].includes(error?.code)) return error.code;
  return /^(MATERIAL_INCOMPLETE|MATERIAL_FORBIDDEN):\s/.exec(error?.message ?? "")?.[1] ?? null;
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

async function recordUndispatchedUnavailable({ kind = "material-preflight", task, taskId, stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint = null }) {
  const materialId = undispatchedUnavailableId({ kind, stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint });
  const policyFingerprint = policy === null ? null : hashCanonical(policy);
  const minimumReviewers = minimumReviewersForPolicy(policy, stage, reviewTrack, subject.review_scope);
  const aggregation = aggregateProviderResults([], minimumReviewers, { profilePriority: policy?.requested_profiles ?? [] });
  const attemptId = randomUUID();
  const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree, root: reviewRootFor(task) });
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack,
    ...subject, source: sourceRecord(source), snapshot_tree: source.snapshotTree, material_id: materialId,
    report_ref: refs.reportRef, provider_attempts: [], terminal_status: "unavailable", error: diagnostic,
    ...(policy ? { review_policy: policy, policy_snapshot_hash: policyFingerprint, coverage: reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation }) } : {}),
  };
  validateSchema("attempt", attempt);
  writeAttempt(task, refs.attemptRef, attempt);
  writeReviewReport(task, refs.reportRef, { attempt });
  return {
    status: "unavailable", verdict: null, attemptRef: refs.attemptRef, resultRef: null, reportRef: refs.reportRef,
    snapshotTree: source.snapshotTree, materialId, runtimeIds: {}, subjectKind: subject.subject_kind, phaseId: subject.phase_id,
    reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree,
  };
}

function failedProvider(provider, error) {
  return { provider, status: "failed", session_id: null, output: null, error: { code: error?.code ?? "PROVIDER_UNAVAILABLE", message: error?.message ?? String(error) }, execution: null };
}

function primaryError(reviewed) {
  const errors = reviewed.map((item) => item.final?.error).filter((error) => typeof error?.code === "string");
  if (errors.length === 0) return { code: "PROVIDER_UNAVAILABLE", message: "no provider returned a valid semantic result" };
  return [...errors].sort((left, right) => {
    const leftRank = errorPriority.indexOf(left.code); const rightRank = errorPriority.indexOf(right.code);
    const rank = (leftRank < 0 ? errorPriority.length : leftRank) - (rightRank < 0 ? errorPriority.length : rightRank);
    return rank || left.code.localeCompare(right.code) || left.message.localeCompare(right.message);
  })[0];
}

function pinnedProfileMatches(profile, execution) {
  return execution !== null && execution !== undefined && execution.model === profile.model && execution.effort === profile.effort && execution.thinking === profile.thinking;
}

function rejectProfileMismatches(reviewed, policy) {
  const expected = new Map((policy?.requested_profile_specs ?? []).map((profile) => [profile.provider, profile]));
  return reviewed.map((item) => {
    const profile = expected.get(item.provider);
    if (!profile || item.final.status !== "completed" || pinnedProfileMatches(profile, item.final.execution)) return item;
    return {
      ...item,
      review: null,
      final: { ...item.final, error: { code: "PROFILE_MISMATCH", message: `3rd-review execution tuple does not match configured profile ${item.provider}` } },
    };
  });
}

function reviewGroupOutcome(provider, result, runtimeId) {
  if (result.status !== "completed" || typeof result.output !== "string") return { provider, review: null, final: result, calls: [{ runtimeId, provider: result }] };
  try {
    return { provider, review: parseReviewerOutput(result.output, { requireEvidence: true }), final: result, calls: [{ runtimeId, provider: result }] };
  } catch {
    return {
      provider, review: null,
      final: { ...result, error: { code: "OUTPUT_INVALID", message: "provider output is not valid reviewer JSON" } },
      calls: [{ runtimeId, provider: { ...result, error: { code: "OUTPUT_INVALID", message: "provider output is not valid reviewer JSON" } } }],
    };
  }
}

async function reviewGroup({ providerClient, providers, hostProvider, materials }) {
  if (typeof providerClient?.runGroup !== "function") throw new TypeError("providerClient.runGroup is required; review dispatch is one broker group call");
  let group;
  try {
    group = await providerClient.runGroup({ hostProvider, providers, materials, prompt: providerPrompt });
  } catch (error) {
    return providers.map((provider) => {
      const failed = failedProvider(provider, error);
      return { provider, review: null, final: failed, calls: [{ runtimeId: null, provider: failed }] };
    });
  }
  if (!group || typeof group.runtimeId !== "string" || !Array.isArray(group.providers)) {
    const error = protocolFailure("3rd-review group client returned an incomplete result");
    return providers.map((provider) => {
      const failed = failedProvider(provider, error);
      return { provider, review: null, final: failed, calls: [{ runtimeId: null, provider: failed }] };
    });
  }
  const byProvider = new Map(group.providers.map((result) => [result?.provider, result]));
  return providers.map((provider) => {
    const result = byProvider.get(provider);
    if (!result) {
      const failed = failedProvider(provider, protocolFailure(`3rd-review group omitted provider ${provider}`));
      return { provider, review: null, final: failed, calls: [{ runtimeId: group.runtimeId, provider: failed }] };
    }
    return reviewGroupOutcome(provider, result, group.runtimeId);
  });
}

async function runReviewOnce({ sourceRoot, targetRepoRoot, workspace, candidateWorkspace, task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, reviewScope = undefined, uiScope = false, materials = {}, current_receipts = {}, hostProvider, providers, reviewPolicy = null, providerClient, captureSource = captureSourceDefault, buildMaterials = buildMaterialsDefault, buildIntegrationSubject = undefined, fixtureSourceToken } = {}) {
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
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision review forbids naked source/target paths; use CandidateWorkspace");
    const candidate = assertCandidateWorkspace(candidateWorkspace);
    sourceRoot = candidate.worktreeRoot;
    targetRepoRoot = candidate.targetRepoRoot;
  } else if (stage !== "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("full worktree review forbids naked source/target paths; use Workspace");
    workspace = assertWorkspace(workspace);
  }
  const source = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: phaseId !== null || stage !== "build-code" || (stage === "build-code" && phaseId === null), ...(phaseId === null ? {} : { phaseId }) });
  let integrationSubject; let subject; let bundle;
  try {
    const isIntegration = stage === "build-code" && phaseId === null;
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
    const fixedMaterials = {
      ...materials,
      ...(integrationSubject ? integrationMaterialFacts(integrationSubject) : {}),
      review_instructions: reviewInstructionsFor(stage, reviewTrack, uiScope, subject.review_scope),
    };
    bundle = buildMaterials({
      reviewDataRoot: attachmentRoot, attachmentRoot, source, task: taskHandle, taskId, stage, phaseId, reviewTrack,
      reviewScope: subject.review_scope, uiScope, materials: fixedMaterials, strictV2Maps: policy?.source === "wh_review.v2",
    });
  } catch (error) {
    if (!isMaterialPreflightFailure(error)) throw error;
    const diagnostic = materialPreflightDiagnostic(error);
    const preflightSubject = subject ?? subjectRecord(source, stage, phaseId);
    return await recordUndispatchedUnavailable({
      task: taskHandle, taskId, stage, reviewTrack, subject: preflightSubject, source, policy, diagnostic,
      materialFingerprint: hashCanonical(materials ?? null),
    });
  } finally {
    source.dispose?.();
  }
  const reviewed = rejectProfileMismatches(await reviewGroup({ providerClient, providers, hostProvider, materials: bundle }), policy);
  const attemptId = randomUUID();
  const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree, root: reviewRootFor(taskHandle) });
  const runtimeIds = Object.fromEntries(reviewed.map((item) => [item.provider, [...item.calls].reverse().find((call) => typeof call.runtimeId === "string")?.runtimeId ?? null]));
  const providerAttempts = [];
  for (const item of reviewed) {
    for (let index = 0; index < item.calls.length; index += 1) {
      const call = item.calls[index];
      const finalError = item.final?.error ?? null;
      const outputRef = writeProviderOutput(taskHandle, refs.providerDirectoryRef, item.provider, call.provider.output, index + 1, { taskId, stage });
      providerAttempts.push({
        provider: item.provider, status: finalError ? "failed" : call.provider.status,
        session_id: call.provider.session_id ?? null, runtime_id: call.runtimeId ?? null,
        execution: call.provider.execution ?? null, unavailable_diagnostics: call.provider.unavailable_diagnostics ?? null,
        output_ref: outputRef, raw_output_ref: call.provider.raw_output_ref ?? null, error: finalError,
      });
    }
  }
  const assessed = evidenceAnchorsFor(reviewed, bundle);
  const minimumReviewers = minimumReviewersForPolicy(policy, stage, reviewTrack, subject.review_scope);
  const aggregation = aggregateProviderResults(assessed, minimumReviewers, { profilePriority: policy?.requested_profiles ?? providers });
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack,
    ...subject, source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
    report_ref: refs.reportRef, provider_attempts: providerAttempts,
    terminal_status: aggregation.status === "semantic" ? "semantic" : "unavailable",
    error: aggregation.status === "semantic" ? null : (() => { const error = primaryError(reviewed); return { code: error.code, message: `${error.message}; only ${aggregation.valid.length} valid reviewer result(s); ${minimumReviewers} required` }; })(),
    ...(policy ? { review_policy: policy, policy_snapshot_hash: hashCanonical(policy), coverage: reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation }) } : {}),
  };
  validateSchema("attempt", attempt);
  writeAttempt(taskHandle, refs.attemptRef, attempt);
  if (aggregation.status !== "semantic") {
    writeReviewReport(taskHandle, refs.reportRef, { attempt });
    return { status: "unavailable", verdict: null, attemptRef: refs.attemptRef, resultRef: null, reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
  }
  const providerResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const findings = aggregation.adjudication.reportFindings.map((finding) => ({ provider: finding.providers[0], ...finding }));
  const result = {
    version: "wh-review-result.v1", task_id: taskId, stage, review_track: reviewTrack, ...subject,
    source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
    attempt_ref: refs.attemptRef, report_ref: refs.reportRef, provider_results: providerResults,
    verdict: aggregation.verdict, findings,
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  validateSchema("result", result);
  writeSemanticResult(taskHandle, refs.resultRef, result);
  writeReviewReport(taskHandle, refs.reportRef, { attempt, result });
  return { status: "semantic", verdict: result.verdict, attemptRef: refs.attemptRef, resultRef: refs.resultRef, reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
}

export async function runReview(options = {}) {
  return runReviewOnce(options);
}

export async function recordMissingRouteUnavailable({ task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, workspace, candidateWorkspace, captureSource = captureSourceDefault } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!(attachmentRoot && taskId && stage)) throw new TypeError("missing-route unavailable review inputs are required");
  const diagnostic = { code: "REVIEW_ROUTE_UNAVAILABLE", message: `workflowhub host wh_review route is unavailable for ${stage}${reviewTrack ? `.${reviewTrack}` : ""}` };
  let source;
  if (stage === "make-decision") {
    const candidate = assertCandidateWorkspace(candidateWorkspace);
    source = captureSource({ sourceRoot: candidate.worktreeRoot, targetRepoRoot: candidate.targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: false });
  } else source = captureSource({ workspace: assertWorkspace(workspace), reviewDataRoot: attachmentRoot, includeDiff: false });
  try {
    return await recordUndispatchedUnavailable({ kind: "route-resolution", task: taskHandle, taskId, stage, reviewTrack, subject: subjectRecord(source, stage, phaseId), source, policy: null, diagnostic });
  } finally { source.dispose?.(); }
}

/** Explicit fake-source seam for isolated tests; the private token is not caller-forgeable. */
export function runReviewFixture(options) { return runReview({ ...options, fixtureSourceToken: FIXTURE_SOURCE_TOKEN }); }

export function verifyFinalSubject({ result, current, integrationSubject = null } = {}) {
  if (!result || typeof result !== "object" || !current || typeof current !== "object") throw new TypeError("result and current source are required");
  const isIntegration = result.stage === "build-code" && result.review_scope === "integration" && integrationSubject !== null;
  const expected = isIntegration ? integrationSubject : { base_commit: current.baseCommit, base_tree: current.baseTree, snapshot_tree: current.snapshotTree };
  if (!expected || typeof expected !== "object" || expected.base_commit !== result.source.base_commit || expected.base_tree !== result.base_tree || (isIntegration && expected.snapshot_tree !== current.snapshotTree)) {
    const error = new Error("WORKTREE_CHANGED_AFTER_REVIEW: current review subject differs from the reviewed subject"); error.code = "WORKTREE_CHANGED_AFTER_REVIEW"; throw error;
  }
  const subjectMismatch = result.subject_kind === "worktree" && (current.snapshotTree !== result.candidate_tree || current.snapshotTree !== result.snapshot_tree);
  const phaseMismatch = result.subject_kind === "phase" && (
    !current.phaseCommit
    || !result.source.phase_commit
    || JSON.stringify(current.phaseCommit) !== JSON.stringify(result.source.phase_commit)
    || current.snapshotTree !== result.candidate_tree
    || current.snapshotTree !== result.snapshot_tree
    || (current.phaseCommit.committed && !current.phaseCommit.tree_matches_candidate)
  );
  if (subjectMismatch || phaseMismatch || current.targetCommit !== result.source.target_commit || current.capturedHead !== result.source.captured_head || result.source.base_commit !== expected.base_commit || result.source.base_tree !== expected.base_tree) {
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
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision verification forbids naked source/target paths; use CandidateWorkspace");
    const candidate = assertCandidateWorkspace(candidateWorkspace);
    sourceRoot = candidate.worktreeRoot;
    targetRepoRoot = candidate.targetRepoRoot;
  } else if (captureSource === captureSourceDefault) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("full worktree verification forbids naked source/target paths; use Workspace");
    workspace = assertWorkspace(workspace);
  }
  const current = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: false, ...(result.phase_id === null ? {} : { phaseId: result.phase_id }) });
  try {
    const integrationSubject = result.stage === "build-code" && result.review_scope === "integration" && workspace?.worktreeRoot
      ? buildIntegrationSubjectDefault({ task: taskHandle, sourceRoot: workspace.worktreeRoot, artifacts: ArtifactDir.open(workspace.worktreeRoot, taskHandle), finalTree: result.snapshot_tree })
      : null;
    return verifyFinalSubject({ result, current, integrationSubject });
  } finally { current.dispose?.(); }
}
