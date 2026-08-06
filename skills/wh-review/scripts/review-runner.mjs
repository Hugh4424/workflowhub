import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { ArtifactDir } from "../../../core/artifact-dir.mjs";
import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "../../../runtime/task/workspace.mjs";
import { captureReviewSource as captureSourceDefault } from "./review-source.mjs";
import { buildIntegrationReviewSubject as buildIntegrationSubjectDefault } from "./integration-review-subject.mjs";
import { buildReviewMaterials as buildMaterialsDefault, minimumReviewersFor, reviewInstructionsFor } from "./review-materials.mjs";
import { FORMAT_CORRECTION_PROMPT, parseReviewerOutput } from "./review-output.mjs";
import { aggregateProviderResults, createReviewLineage, renderReviewReport, reviewRefs, validateReviewLineage, writeAttempt, writeProviderOutput, writeReviewReport, writeSemanticResult } from "./review-result.mjs";
import { buildClassificationManifest } from "./review-controller.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { authenticateCanonicalReviewResult } from "../../../runtime/review/canonical-review-result.mjs";

const freshable = new Set(["RUNTIME_EXPIRED", "RUNTIME_NOT_FOUND", "NO_CONTINUABLE_SESSION"]);
const errorPriority = ["MATERIAL_INCOMPLETE", "PUBLIC_RESULT_INVALID", "PROTOCOL_INCOMPATIBLE", "OUTPUT_INVALID", "PROVIDER_UNAVAILABLE"];
// Providers run from a writable wrapper directory; sealed review material is
// deliberately exposed beneath `bundle/`, never at that directory's root.
const providerPrompt = "Read bundle/review-instructions.md and the complete frozen bundle. Return the requested JSON object only.";
const FIXTURE_SOURCE_TOKEN = Symbol("wh-review fixture source");
const localReviewLocks = new Map();
const subjectReviewFlights = new Map();
const RESULT_REF = /^quality\/reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const ATTEMPT_REF = /^quality\/reviews\/attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/attempt\.json$/;
const absoluteDiagnosticPath = /(?:^|[^A-Za-z0-9._~/%-])(?:\/(?![\s/])|[A-Za-z]:[\\/]|file:\/\/\/)/;
const reviewRootFor = () => "quality/reviews";
const providerOutputPrefixFor = (task, attemptId) => `${reviewRootFor(task)}/attempts/${attemptId}/providers/`;

function protocolFailure(message) {
  const error = new Error(`PROTOCOL_INCOMPATIBLE: ${message}`);
  error.code = "PROTOCOL_INCOMPATIBLE";
  return error;
}

async function withLocalReviewLock(task, lockRef, operation) {
  const key = JSON.stringify([task.identity.projectName, task.identity.taskId, lockRef]);
  const previous = localReviewLocks.get(key) ?? Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  localReviewLocks.set(key, current);
  const finish = () => {
    release();
    if (localReviewLocks.get(key) === current) localReviewLocks.delete(key);
  };
  try {
    await previous;
    return await operation();
  }
  finally {
    finish();
  }
}

function reviewLockRef({
  stage,
  reviewTrack,
  reviewScope,
  snapshotTree,
  materialId,
  policyFingerprint = null,
}) {
  const identity = JSON.stringify([
    stage,
    reviewTrack,
    reviewScope,
    snapshotTree,
    materialId,
    policyFingerprint,
  ]);
  return `locks/reviews/${createHash("sha256").update(identity).digest("hex")}.lock`;
}

function managedRequestId({
  taskId,
  stage,
  reviewTrack,
  subject,
  snapshotTree,
  materialId,
  policyFingerprint,
  hostProvider,
  providers,
  continuationRuntimeId,
  dispatchSequence,
}) {
  if (!Number.isSafeInteger(dispatchSequence) || dispatchSequence < 0) throw new TypeError("dispatchSequence must be a non-negative safe integer");
  const identity = canonicalJson({
    version: "wh-review-dispatch.v1", task_id: taskId, stage, review_track: reviewTrack,
    subject, snapshot_tree: snapshotTree, material_id: materialId,
    policy_fingerprint: policyFingerprint ?? null,
    host_provider: hostProvider, provider_allowlist: providers, prompt_sha256: createHash("sha256").update(providerPrompt).digest("hex"),
    continuation_runtime_id: continuationRuntimeId ?? null, dispatch_sequence: dispatchSequence,
  });
  return `wh-review-${createHash("sha256").update(identity).digest("hex")}`;
}

function formatCorrectionRequestId(requestId) {
  return `wh-review-format-${createHash("sha256").update(requestId).digest("hex")}`;
}

function sourceRecord(source, integrationSubject = null) {
  return {
    target_commit: source.targetCommit,
    base_commit: integrationSubject?.base_commit ?? source.baseCommit,
    base_tree: integrationSubject?.base_tree ?? source.baseTree,
    captured_head: source.capturedHead,
  };
}

function phaseExecutionPaths(task, workspace, phaseId) {
  const artifacts = ArtifactDir.open(assertWorkspace(workspace).worktreeRoot, task);
  const raw = artifacts.read("tasks.md");
  if (!/^[A-Za-z0-9_-]+$/.test(String(phaseId))) throw new Error(`MATERIAL_INCOMPLETE: invalid Phase id ${phaseId}`);
  const phaseHeader = new RegExp(`^## Phase ${String(phaseId)}[^\\n]*$`, "m");
  const match = phaseHeader.exec(raw);
  if (!match) throw new Error(`MATERIAL_INCOMPLETE: tasks.md has no Phase ${phaseId} section`);
  const start = match.index + match[0].length;
  const next = /^## Phase /m.exec(raw.slice(start));
  const section = raw.slice(start, next ? start + next.index : raw.length);
  const paths = [];
  for (const entry of section.matchAll(/\*\*execution_file_paths\*\*[^`]*`([^`]+)`/g)) {
    let parsed;
    try { parsed = JSON.parse(entry[1]); } catch { throw new Error(`MATERIAL_INCOMPLETE: Phase ${phaseId} execution_file_paths is invalid JSON`); }
    if (!Array.isArray(parsed) || parsed.some((path) => typeof path !== "string" || path.trim() === "")) {
      throw new Error(`MATERIAL_INCOMPLETE: Phase ${phaseId} execution_file_paths must be a string array`);
    }
    paths.push(...parsed);
  }
  const unique = [...new Set(paths)];
  if (unique.length === 0) throw new Error(`MATERIAL_INCOMPLETE: Phase ${phaseId} has no execution_file_paths`);
  return unique;
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
      !integrationSubject.ac_trace || integrationSubject.ac_trace.schema_version !== "ac-change-test-trace.v1") {
    throw new TypeError("integration subject is invalid");
  }
  // Historical Phase/task audit gaps are disclosed in the subject, but they
  // do not erase the independently authenticated current-snapshot facts.
  // The integration material contract can validate the current-only packet
  // with an unavailable historical coverage record and an explicit AC trace.
  return {
    phase_coverage: integrationSubject.phase_coverage,
    seam_index: integrationSubject.seam_index,
    ac_trace: integrationSubject.ac_trace,
  };
}

function stringList(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) throw new TypeError(label + " must be a string array");
  return [...value];
}

function adapterOf(provider) { return provider.split("/", 1)[0]; }

function uniqueAdapterProfiles(providers, label) {
  const adapters = new Set();
  for (const provider of providers) {
    const adapter = adapterOf(provider);
    if (adapters.has(adapter)) throw new TypeError(label + " must contain at most one profile per adapter");
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
    round: value.round === undefined ? "legacy" : (() => {
      if (!["initial", "incremental", "closure", "full", "legacy"].includes(value.round)) throw new TypeError("reviewPolicy.round is invalid");
      return value.round;
    })(),
  };
}

// Stage-material defaults exist for legacy 3rd-review records only. A v2
// route is the authority for its own quorum, including adaptive closure.
function minimumReviewersForPolicy(policy, stage, reviewTrack, reviewScope = null) {
  return policy?.source === "wh_review.v2"
    ? policy.minimum_heterologous
    : minimumReviewersFor(stage, reviewTrack, reviewScope);
}

function minimumReviewersForAttempt(attempt) {
  return minimumReviewersForPolicy(reviewPolicyRecord(attempt.review_policy ?? null), attempt.stage, attempt.review_track, attempt.review_scope ?? null);
}
function profilePriorityForAttempt(attempt) {
  const policy = reviewPolicyRecord(attempt.review_policy ?? null);
  return policy?.requested_profiles ?? [...new Set((attempt.provider_attempts ?? []).map(({ provider }) => provider))];
}

function canonicalJson(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  return JSON.stringify(value);
}

function hashCanonical(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function hasExactProviderSet(providers, requestedProfiles) {
  const actual = new Set(providers);
  const expected = new Set(requestedProfiles);
  return expected.size === requestedProfiles.length && actual.size === expected.size && [...expected].every((provider) => actual.has(provider));
}

function isUndispatchedMaterialPreflightAttempt(attempt) {
  return attempt.terminal_status === "unavailable"
    && attempt.provider_attempts.length === 0
    && ["MATERIAL_INCOMPLETE", "MATERIAL_FORBIDDEN"].includes(attempt.error?.code);
}

function verifiedPolicyForAttempt(attempt, providers, { allowUndispatchedMaterialPreflight = false } = {}) {
  const policy = reviewPolicyRecord(attempt.review_policy ?? null);
  if (policy?.source !== "wh_review.v2") return policy;
  if (attempt.policy_snapshot_hash !== hashCanonical(policy)) {
    throw invalidEvidence("wh_review.v2 policy snapshot hash does not match its persisted policy");
  }
  if (!(allowUndispatchedMaterialPreflight && providers.length === 0)
      && !hasExactProviderSet(providers, policy.requested_profiles)) {
    throw invalidEvidence("wh_review.v2 provider attempts do not exactly match requested profiles");
  }
  return policy;
}

function reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation }) {
  if (!policy) return null;
  const selectedProfiles = [...policy.eligible_profiles];
  return {
    mode: stage === "build-code" && policy.mode === "full_only" && selectedProfiles.length === 1
      ? "single_external"
      : "parallel_external",
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
      try {
        return readFileSync(join(bundle.bundleRoot, ...finding.path.split("/")), "utf8").split(/\r?\n/).length >= finding.line;
      } catch { return false; }
    });
    return { ...item, evidenceAnchors };
  });
}

function matchesReviewIdentity(record, {
  taskId,
  stage,
  reviewTrack,
  subject,
  snapshotTree,
  materialId,
}) {
  return record?.task_id === taskId && record.stage === stage && record.review_track === reviewTrack &&
    record.snapshot_tree === snapshotTree && record.material_id === materialId &&
    record.subject_kind === subject.subject_kind && record.phase_id === subject.phase_id &&
    (record.review_scope ?? null) === subject.review_scope &&
    record.base_tree === subject.base_tree && record.candidate_tree === subject.candidate_tree;
}

function invalidEvidence(message) {
  const error = new Error(`REVIEW_EVIDENCE_INVALID: ${message}`);
  error.code = "REVIEW_EVIDENCE_INVALID";
  return error;
}

function readMatchingRecords(task, refs, identity) {
  const matches = [];
  for (const ref of refs) {
    let record;
    try { record = JSON.parse(task.readRecord(ref)); }
    catch (error) { throw invalidEvidence(`canonical review record cannot be read: ${ref}: ${error.message}`); }
    if (matchesReviewIdentity(record, identity)) matches.push({ ref, record });
  }
  return matches;
}

function sameReviewSubject(record, { taskId, stage, reviewTrack, subject, snapshotTree }) {
  return record?.task_id === taskId
    && record.stage === stage
    && record.review_track === reviewTrack
    && record.subject_kind === subject.subject_kind
    && record.phase_id === subject.phase_id
    && (record.review_scope ?? null) === subject.review_scope
    && (stage !== "build-code" || record.snapshot_tree === snapshotTree);
}

function storedSemanticOutcome(task, resultRef, result, identity) {
  let attempt;
  try { attempt = JSON.parse(task.readRecord(result.attempt_ref)); }
  catch (error) { throw invalidEvidence(`result attempt cannot be read: ${error.message}`); }
  try { validateSchema("attempt", attempt); }
  catch (error) { throw invalidEvidence(`attempt schema is invalid: ${error.message}`); }
  if (attempt.task_id !== result.task_id || attempt.stage !== result.stage
      || attempt.review_track !== result.review_track || attempt.subject_kind !== result.subject_kind
      || attempt.phase_id !== result.phase_id || (attempt.review_scope ?? null) !== (result.review_scope ?? null)
      || attempt.snapshot_tree !== result.snapshot_tree || attempt.material_id !== result.material_id
      || attempt.terminal_status !== "semantic" || attempt.error !== null
      || !isDeepStrictEqual(attempt.lineage ?? null, result.lineage ?? null)) {
    throw invalidEvidence("canonical subject head is not bound to its semantic attempt");
  }
  const storedPolicyFingerprint = attempt.review_policy === undefined ? null : hashCanonical(attempt.review_policy);
  if (storedPolicyFingerprint !== identity.policyFingerprint) return null;
  const outputPrefix = providerOutputPrefixFor(task, attempt.attempt_id);
  const terminalAttempts = new Map();
  for (const providerAttempt of attempt.provider_attempts) terminalAttempts.set(providerAttempt.provider, providerAttempt);
  const providerOutputs = [];
  for (const providerAttempt of terminalAttempts.values()) {
    if (providerAttempt.output_ref === null) continue;
    if (!providerAttempt.output_ref.startsWith(outputPrefix)) throw invalidEvidence("provider output is outside its canonical attempt");
    let output;
    try { output = JSON.parse(task.readRecord(providerAttempt.output_ref)); }
    catch (error) { throw invalidEvidence(`provider output cannot be read: ${error.message}`); }
    if (output.attempt_id !== attempt.attempt_id || output.provider !== providerAttempt.provider
        || output.content_hash !== createHash("sha256").update(output.content).digest("hex")) {
      throw invalidEvidence("stored provider output is misbound");
    }
    let review;
    try { review = parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined }); }
    catch (error) { throw invalidEvidence(`stored provider output is invalid: ${error.message}`); }
    providerOutputs.push({ ref: providerAttempt.output_ref, provider: providerAttempt.provider, review });
  }
  try {
    authenticateCanonicalReviewResult({
      attempt,
      result,
      providerOutputs,
      fallbackMinimumReviewers: minimumReviewersForAttempt(attempt),
      assess: (items) => items.map((item) => ({
        ...item,
        evidenceAnchors: item.review.findings.map((finding) => {
          const cluster = result.adjudication?.clusters?.find((candidate) =>
            candidate.path === finding.path && (candidate.line ?? null) === (finding.line ?? null)
            && candidate.provider_findings?.some(({ provider }) => provider === item.provider));
          return cluster?.provider_findings?.find(({ provider }) => provider === item.provider)?.evidence_anchor_valid ?? true;
        }),
      })),
    });
  } catch (error) {
    throw invalidEvidence(error.message.replace(/^REVIEW_EVIDENCE_INVALID:\s*/, ""));
  }
  const runtimeIds = Object.fromEntries(attempt.provider_attempts.map((entry) => [entry.provider, entry.runtime_id ?? null]));
  return {
    status: "semantic", verdict: result.verdict, attemptRef: result.attempt_ref, resultRef,
    snapshotTree: result.snapshot_tree, materialId: result.material_id, runtimeIds,
    subjectKind: result.subject_kind, phaseId: result.phase_id, reviewScope: result.review_scope ?? null,
    baseTree: result.base_tree, candidateTree: result.candidate_tree,
    reportRef: result.report_ref ?? attempt.report_ref ?? null, reused: true,
  };
}

function canonicalSubjectOutcome(task, identity) {
  const matches = [];
  for (const ref of task.listCanonicalReviewResultRefs()) {
    let record;
    try { record = JSON.parse(task.readRecord(ref)); }
    catch (error) { throw invalidEvidence(`canonical review record cannot be read: ${ref}: ${error.message}`); }
    // Every semantic review is evidence for one exact frozen source. Normal
    // worktree and Phase reviews also bind the exact material bundle. The
    // build-code integration subject is the one exception: its canonical
    // same-snapshot coverage may be regenerated without another provider
    // call, but a changed snapshot is still a new review identity.
    const buildCodeIntegration = identity.stage === "build-code"
      && identity.subject.review_scope === "integration";
    // An integration packet is derived from current authenticated evidence.
    // If the packet itself changes on the same source snapshot (for example,
    // after repairing phase coverage or AC implementation anchors), the old
    // semantic result is not evidence for the new packet and must not be
    // returned as though the review were unchanged.
    if (buildCodeIntegration && record.material_id !== identity.materialId) continue;
    const identityMatches = buildCodeIntegration
      ? matchesReviewIdentity(record, { ...identity, materialId: record.material_id })
      : matchesReviewIdentity(record, identity);
    if (!identityMatches) continue;
    matches.push({ ref, record });
  }
  if (matches.length === 0) return null;
  if (matches.length !== 1) return null;
  const { ref, record } = matches[0];
  try { validateSchema("result", record); }
  catch (error) { throw invalidEvidence(`result schema is invalid: ${error.message}`); }
  return storedSemanticOutcome(task, ref, record, identity);
}

function validateAttemptIdentity(attempt, attemptRef, identity) {
  try { validateSchema("attempt", attempt); }
  catch (error) { throw invalidEvidence(`attempt schema is invalid: ${error.message}`); }
  try { validateReviewLineage(attempt.lineage); }
  catch (error) { throw invalidEvidence(`attempt lineage is invalid: ${error.message}`); }
  const attemptMatch = attemptRef.match(/^(?:quality\/reviews|reviews)\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/);
  if (!attemptMatch || attempt.attempt_id !== attemptMatch[1] || !matchesReviewIdentity(attempt, identity)) {
    throw invalidEvidence("attempt identity does not match its canonical ref or requested review identity");
  }
}

function matchesRequestedPolicy(attempt, identity) {
  verifiedPolicyForAttempt(
    attempt,
    attempt.provider_attempts.map(({ provider }) => provider),
    { allowUndispatchedMaterialPreflight: isUndispatchedMaterialPreflightAttempt(attempt) },
  );
  return (attempt.policy_snapshot_hash ?? null) === identity.policyFingerprint;
}

function validateUnavailableAttemptEvidence(task, attempt, bundle) {
  const policy = verifiedPolicyForAttempt(
    attempt,
    attempt.provider_attempts.map(({ provider }) => provider),
    { allowUndispatchedMaterialPreflight: isUndispatchedMaterialPreflightAttempt(attempt) },
  );
  const outputPrefix = providerOutputPrefixFor(task, attempt.attempt_id);
  const latestByProvider = new Map();
  for (const providerAttempt of attempt.provider_attempts) {
    if (providerAttempt.output_ref === null) {
      latestByProvider.set(providerAttempt.provider, { providerAttempt, review: null });
      continue;
    }
    if (typeof providerAttempt.output_ref !== "string" || !providerAttempt.output_ref.startsWith(outputPrefix) ||
        !/^[A-Za-z0-9._-]+\.output\.json$/.test(providerAttempt.output_ref.slice(outputPrefix.length))) {
      throw invalidEvidence("unavailable provider output is outside its canonical attempt");
    }
    let output;
    try { output = JSON.parse(task.readRecord(providerAttempt.output_ref)); }
    catch (error) { throw invalidEvidence(`unavailable provider output cannot be read: ${error.message}`); }
    if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== attempt.task_id ||
        output.stage !== attempt.stage || output.attempt_id !== attempt.attempt_id || output.provider !== providerAttempt.provider ||
        typeof output.content !== "string" || output.content_hash !== createHash("sha256").update(output.content).digest("hex")) {
      throw invalidEvidence("unavailable provider output does not match its attempt or content hash");
    }
    let review = null;
    try { review = parseReviewerOutput(output.content); } catch {}
    if (providerAttempt.status !== "completed" && review !== null) {
      throw invalidEvidence("failed provider attempt contains a valid semantic review");
    }
    latestByProvider.set(providerAttempt.provider, { providerAttempt, review });
  }
  const recomputed = [...latestByProvider.entries()].map(([provider, latest]) => ({
    provider,
    review: latest.providerAttempt.status === "completed" ? latest.review : null,
  }));
  if (aggregateProviderResults(evidenceAnchorsFor(recomputed, bundle), minimumReviewersForPolicy(policy, attempt.stage, attempt.review_track), { profilePriority: policy?.requested_profiles ?? profilePriorityForAttempt(attempt) }).status !== "unavailable") {
    throw invalidEvidence("unavailable attempt provider evidence produces a semantic result");
  }
}

function readCanonicalOrMissing(task, ref) {
  try { return task.readRecord(ref); }
  catch (error) { if (error?.code === "ENOENT") return null; throw invalidEvidence(`canonical review record cannot be read: ${ref}: ${error.message}`); }
}

function publishRecoveredRecord(task, ref, raw, write, label) {
  const existing = readCanonicalOrMissing(task, ref);
  if (existing !== null) {
    if (existing !== raw) throw invalidEvidence(`${label} already exists with different content`);
    return;
  }
  try { write(); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if (readCanonicalOrMissing(task, ref) !== raw) throw invalidEvidence(`${label} already exists with different content`);
  }
}

function semanticAttemptResult(task, attempt, attemptRef, bundle) {
  const outputPrefix = providerOutputPrefixFor(task, attempt.attempt_id);
  const latestByProvider = new Map();
  for (const providerAttempt of attempt.provider_attempts) {
    let content = null;
    if (providerAttempt.output_ref !== null) {
      if (typeof providerAttempt.output_ref !== "string" || !providerAttempt.output_ref.startsWith(outputPrefix) ||
          !/^[A-Za-z0-9._-]+\.output\.json$/.test(providerAttempt.output_ref.slice(outputPrefix.length))) {
        throw invalidEvidence("semantic provider output is outside its canonical attempt");
      }
      let output;
      try { output = JSON.parse(task.readRecord(providerAttempt.output_ref)); }
      catch (error) { throw invalidEvidence(`semantic provider output cannot be read: ${error.message}`); }
      if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== attempt.task_id || output.stage !== attempt.stage ||
          output.attempt_id !== attempt.attempt_id || output.provider !== providerAttempt.provider || typeof output.content !== "string" ||
          output.content_hash !== createHash("sha256").update(output.content).digest("hex")) {
        throw invalidEvidence("semantic provider output does not match its attempt or content hash");
      }
      content = output.content;
    } else if (providerAttempt.status === "completed") throw invalidEvidence("completed provider attempt has no canonical output");
    // Every call is hash-verified, but an early invalid-format completion may
    // legitimately be followed by one same-session formatting correction.
    latestByProvider.set(providerAttempt.provider, { providerAttempt, content });
  }
  const policy = verifiedPolicyForAttempt(attempt, latestByProvider.keys());
  const expectedProfiles = new Map((policy?.requested_profile_specs ?? []).map((profile) => [profile.provider, profile]));
  const parsed = [];
  for (const [provider, { providerAttempt, content }] of latestByProvider) {
    if (providerAttempt.status !== "completed") {
      if (content !== null) {
        try { if (parseReviewerOutput(content) !== null) throw invalidEvidence("failed provider attempt contains a valid semantic review"); }
        catch (error) { if (error?.code === "REVIEW_EVIDENCE_INVALID") throw error; }
      }
      continue;
    }
    if (content === null) throw invalidEvidence("completed provider attempt has no semantic review");
    let review;
    try { review = parseReviewerOutput(content, { requireEvidence: true }); }
    catch { throw invalidEvidence("completed provider output is not a valid semantic review"); }
    if (expectedProfiles.has(provider) && !pinnedProfileMatches(expectedProfiles.get(provider), providerAttempt.execution)) {
      throw invalidEvidence("completed provider execution does not match its pinned profile");
    }
    parsed.push({ provider, review });
  }
  const aggregation = aggregateProviderResults(evidenceAnchorsFor(parsed, bundle), minimumReviewersForPolicy(policy, attempt.stage, attempt.review_track), { profilePriority: policy?.requested_profiles ?? profilePriorityForAttempt(attempt) });
  if (aggregation.status !== "semantic") throw invalidEvidence("semantic attempt provider evidence does not meet its required quorum");
  const providerResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const findings = aggregation.adjudication.reportFindings.map((finding) => ({ provider: finding.providers[0], ...finding }));
  const result = {
    version: "wh-review-result.v1", task_id: attempt.task_id, stage: attempt.stage, review_track: attempt.review_track,
    subject_kind: attempt.subject_kind, phase_id: attempt.phase_id, review_scope: attempt.review_scope ?? null, base_tree: attempt.base_tree, candidate_tree: attempt.candidate_tree,
    source: attempt.source, snapshot_tree: attempt.snapshot_tree, material_id: attempt.material_id, attempt_ref: attemptRef,
    report_ref: attempt.report_ref, ...(attempt.lineage === undefined ? {} : { lineage: attempt.lineage }),
    provider_results: providerResults, verdict: aggregation.verdict, findings,
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  validateSchema("result", result);
  return result;
}

function recoverSemanticFinalization(task, identity, bundle, attemptRef, attempt) {
  if (attempt.terminal_status !== "semantic" || attempt.error !== null) throw invalidEvidence("only a terminal semantic attempt can be recovered");
  const refs = reviewRefs({ attemptId: attempt.attempt_id, stage: attempt.stage, reviewTrack: attempt.review_track, snapshotTree: attempt.snapshot_tree });
  if (attempt.report_ref !== refs.reportRef) throw invalidEvidence("semantic attempt report ref is not its canonical derived ref");
  const result = semanticAttemptResult(task, attempt, attemptRef, bundle);
  const resultRaw = `${JSON.stringify(result, null, 2)}\n`;
  const reportRaw = renderReviewReport({ attempt, result });
  publishRecoveredRecord(task, refs.resultRef, resultRaw, () => writeSemanticResult(task, refs.resultRef, result), "recovered semantic result");
  publishRecoveredRecord(task, refs.reportRef, reportRaw, () => writeReviewReport(task, refs.reportRef, { attempt, result }), "recovered semantic report");
  const runtimeIds = Object.fromEntries(attempt.provider_attempts.map((entry) => [entry.provider, entry.runtime_id ?? null]));
  return { status: "semantic", verdict: result.verdict, attemptRef, resultRef: refs.resultRef, snapshotTree: result.snapshot_tree,
    materialId: result.material_id, runtimeIds, subjectKind: result.subject_kind, phaseId: result.phase_id,
    reviewScope: result.review_scope ?? null, baseTree: result.base_tree, candidateTree: result.candidate_tree, reportRef: refs.reportRef, reused: true };
}

function ensureReviewReport(task, reportRef, attempt, result) {
  const expected = renderReviewReport({ attempt, result });
  try {
    const existing = task.readRecord(reportRef);
    if (existing !== expected) throw invalidEvidence("review report does not match canonical attempt/result evidence");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    writeReviewReport(task, reportRef, { attempt, result });
  }
}

function reusableResults(task, identity) {
  const candidateResults = readMatchingRecords(task, task.listCanonicalReviewResultRefs(), identity);
  const results = candidateResults.filter(({ ref, record }) => {
    let resultAttempt;
    try { resultAttempt = JSON.parse(task.readRecord(record.attempt_ref)); }
    catch (error) { throw invalidEvidence(`semantic result attempt cannot be read: ${error.message}`); }
    validateAttemptIdentity(resultAttempt, record.attempt_ref, identity);
    if (!matchesRequestedPolicy(resultAttempt, identity)) return false;
    return true;
  });
  return { results, invalidatedAttemptRefs: new Set() };
}

function reusableOutcome(task, identity, bundle, { reuseUnavailable = false, claimedUnavailableAttemptRefs = [] } = {}) {
  const { taskId, stage, reviewTrack } = identity;
  if (!Array.isArray(claimedUnavailableAttemptRefs)
      || claimedUnavailableAttemptRefs.some((ref) => !ATTEMPT_REF.test(ref))) {
    throw new TypeError("claimedUnavailableAttemptRefs must contain canonical review attempt refs");
  }
  const claimedUnavailable = new Set(claimedUnavailableAttemptRefs);
  const { results: matchingResults, invalidatedAttemptRefs } = reusableResults(task, identity);
  const allMatchingAttempts = readMatchingRecords(task, task.listCanonicalReviewAttemptRefs(), identity)
    .filter(({ ref }) => !invalidatedAttemptRefs.has(ref));
  if (matchingResults.length > 1) throw invalidEvidence("multiple canonical semantic results exist for the same review identity");
  // Transport failures are immutable evidence, not a permanent ban on another
  // formal review of the same draft. Validate every historical attempt before
  // continuing so damaged evidence is still fail-loud.
  for (const item of allMatchingAttempts) {
    validateAttemptIdentity(item.record, item.ref, identity);
    if (item.record.terminal_status === "unavailable") validateUnavailableAttemptEvidence(task, item.record, bundle);
  }
  const matchingAttempts = allMatchingAttempts.filter(({ record }) => matchesRequestedPolicy(record, identity));
  if (matchingResults.length === 0) {
    const semanticAttempts = matchingAttempts.filter(({ record }) => record.terminal_status === "semantic" && record.error === null);
    if (semanticAttempts.length > 1) throw invalidEvidence("multiple semantic attempts exist without a canonical result");
    if (semanticAttempts.length === 1) return recoverSemanticFinalization(task, identity, bundle, semanticAttempts[0].ref, semanticAttempts[0].record);
  }
  if (matchingResults.length === 1) {
    const { ref: resultRef, record: result } = matchingResults[0];
    try { validateSchema("result", result); }
    catch (error) { throw invalidEvidence(`result schema is invalid: ${error.message}`); }
    const referencedAttempts = matchingAttempts.filter((item) => item.ref === result.attempt_ref);
    if (referencedAttempts.length !== 1) throw invalidEvidence("semantic result does not have exactly one matching attempt");
    let attempt;
    try { attempt = JSON.parse(task.readRecord(result.attempt_ref)); }
    catch (error) { throw invalidEvidence(`result attempt cannot be read: ${error.message}`); }
    validateAttemptIdentity(attempt, result.attempt_ref, identity);
    if (attempt.terminal_status !== "semantic" || attempt.error !== null) {
      throw invalidEvidence("semantic result is not backed by exactly one matching semantic attempt");
    }
    const attemptMatch = result.attempt_ref.match(/^(?:quality\/reviews|reviews)\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/);
    if (!attemptMatch || attempt.attempt_id !== attemptMatch[1] || attempt.task_id !== result.task_id ||
        attempt.stage !== result.stage || attempt.review_track !== result.review_track ||
        attempt.snapshot_tree !== result.snapshot_tree || attempt.material_id !== result.material_id ||
        attempt.subject_kind !== result.subject_kind || attempt.phase_id !== result.phase_id ||
        (attempt.review_scope ?? null) !== (result.review_scope ?? null) ||
        attempt.base_tree !== result.base_tree || attempt.candidate_tree !== result.candidate_tree ||
        !isDeepStrictEqual(attempt.classification_manifest ?? null, result.classification_manifest ?? null)) {
      throw invalidEvidence("attempt and result identities differ");
    }
    const providerOutputs = [];
    for (const providerAttempt of attempt.provider_attempts) {
      if (providerAttempt.status !== "completed" || typeof providerAttempt.output_ref !== "string") continue;
      const outputPrefix = providerOutputPrefixFor(task, attempt.attempt_id);
      try {
        if (!providerAttempt.output_ref.startsWith(outputPrefix)
            || !/^[A-Za-z0-9._-]+\.output\.json$/.test(providerAttempt.output_ref.slice(outputPrefix.length))) {
          throw new Error("provider output ref is outside its attempt");
        }
        const output = JSON.parse(task.readRecord(providerAttempt.output_ref));
        const review = parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined });
        if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== taskId || output.stage !== stage
            || output.attempt_id !== attempt.attempt_id || output.provider !== providerAttempt.provider
            || output.content_hash !== createHash("sha256").update(output.content).digest("hex")) {
          throw new Error("provider output wrapper is misbound");
        }
        providerOutputs.push({ ref: providerAttempt.output_ref, provider: providerAttempt.provider, review });
      } catch (error) {
        throw invalidEvidence(`completed provider output is invalid: ${error.message}`);
      }
    }
    try {
      authenticateCanonicalReviewResult({
        attempt, result, providerOutputs,
        fallbackMinimumReviewers: minimumReviewersForAttempt(attempt),
        assess: (items) => evidenceAnchorsFor(items, bundle),
      });
    } catch (error) {
      throw invalidEvidence(error.message);
    }
    const refs = reviewRefs({ attemptId: attempt.attempt_id, stage: attempt.stage, reviewTrack: attempt.review_track, snapshotTree: attempt.snapshot_tree, root: reviewRootFor(task) });
    const hasResultReportRef = result.report_ref !== undefined;
    const hasAttemptReportRef = attempt.report_ref !== undefined;
    if (resultRef !== refs.resultRef || hasResultReportRef !== hasAttemptReportRef ||
        (hasResultReportRef && (result.report_ref !== refs.reportRef || attempt.report_ref !== refs.reportRef))) {
      throw invalidEvidence("semantic result or attempt report ref is not canonical for its attempt");
    }
    if (hasResultReportRef) {
      const reportRaw = renderReviewReport({ attempt, result });
      publishRecoveredRecord(task, refs.reportRef, reportRaw, () => writeReviewReport(task, refs.reportRef, { attempt, result }), "semantic report");
    }
    const runtimeIds = Object.fromEntries(attempt.provider_attempts.map((entry) => [entry.provider, entry.runtime_id ?? null]));
    ensureReviewReport(task, result.report_ref ?? attempt.report_ref, attempt, result);
    return { status: "semantic", verdict: result.verdict, attemptRef: result.attempt_ref, resultRef, snapshotTree: result.snapshot_tree,
      materialId: result.material_id, runtimeIds, subjectKind: result.subject_kind, phaseId: result.phase_id,
      reviewScope: result.review_scope ?? null, baseTree: result.base_tree, candidateTree: result.candidate_tree,
      reportRef: result.report_ref ?? attempt.report_ref ?? null, reused: true };
  }
  const semanticAttempts = matchingAttempts.filter((item) => item.record.terminal_status === "semantic");
  if (semanticAttempts.length > 1) throw invalidEvidence("multiple semantic attempts exist without a canonical result");
  if (semanticAttempts.length === 1) {
    const { ref: attemptRef, record: attempt } = semanticAttempts[0];
    if (attempt.error !== null) throw invalidEvidence("semantic attempt must not carry an error");
    return recoverSemanticFinalization(task, identity, bundle, attemptRef, attempt);
  }
  for (const { ref: attemptRef, record: attempt } of matchingAttempts) {
    if (attempt.terminal_status !== "unavailable" || !attempt.error) {
      throw invalidEvidence(`attempt without a semantic result is not unavailable: ${attemptRef}`);
    }
  }
  if (reuseUnavailable) {
    const unclaimed = matchingAttempts.filter(({ ref, record }) =>
      record.terminal_status === "unavailable" && !claimedUnavailable.has(ref));
    if (unclaimed.length > 1) throw invalidEvidence("multiple unclaimed unavailable attempts exist for the same review identity");
    if (unclaimed.length === 1) {
      const { ref: attemptRef, record: attempt } = unclaimed[0];
      const runtimeIds = Object.fromEntries(attempt.provider_attempts.map((entry) => [entry.provider, entry.runtime_id ?? null]));
      return {
        status: "unavailable", verdict: null, attemptRef, resultRef: null,
        reportRef: attempt.report_ref ?? null, snapshotTree: attempt.snapshot_tree,
        materialId: attempt.material_id, runtimeIds, subjectKind: attempt.subject_kind,
        phaseId: attempt.phase_id, reviewScope: attempt.review_scope ?? null,
        baseTree: attempt.base_tree, candidateTree: attempt.candidate_tree, reused: true,
      };
    }
  }
  return null;
}

function unavailableDispatchSequence(task, identity) {
  // A terminal unavailable attempt is immutable evidence, not the immutable
  // broker operation itself. A later explicit review run needs a distinct
  // managed request ID; otherwise the broker can only replay the old terminal
  // cancellation forever. Revalidate every matching attempt before deriving
  // this sequence, so a damaged record never changes dispatch identity.
  const { invalidatedAttemptRefs } = reusableResults(task, identity);
  const allAttempts = readMatchingRecords(task, task.listCanonicalReviewAttemptRefs(), identity)
    .filter(({ ref }) => !invalidatedAttemptRefs.has(ref));
  for (const item of allAttempts) {
    validateAttemptIdentity(item.record, item.ref, identity);
    matchesRequestedPolicy(item.record, identity);
  }
  const attempts = allAttempts.filter(({ record }) =>
    (record.policy_snapshot_hash ?? null) === identity.policyFingerprint);
  for (const item of attempts) {
    if (item.record.terminal_status !== "unavailable") {
      throw invalidEvidence(`attempt without a semantic result is not unavailable: ${item.ref}`);
    }
  }
  return attempts.length;
}

function formatCorrectionSeedForAttempt(task, attemptRef, identity, bundle, policy, providers) {
  if (typeof attemptRef !== "string" || !/^quality\/reviews\/attempts\/[A-Za-z0-9._-]+\/attempt\.json$/.test(attemptRef)) {
    throw new TypeError("formatCorrectionAttemptRef must be a canonical unavailable review attempt ref");
  }
  let attempt;
  try { attempt = JSON.parse(task.readRecord(attemptRef)); }
  catch (error) { throw invalidEvidence(`format correction attempt cannot be read: ${error.message}`); }
  validateAttemptIdentity(attempt, attemptRef, identity);
  if (attempt.terminal_status !== "unavailable" || !attempt.error || !isDeepStrictEqual(attempt.review_policy ?? null, policy ?? null)) {
    throw invalidEvidence("format correction requires the matching unavailable attempt and unchanged review policy");
  }
  if (attempt.provider_attempts.length !== providers.length) {
    throw invalidEvidence("format correction is already consumed for this unavailable attempt");
  }
  validateUnavailableAttemptEvidence(task, attempt, bundle);
  const latest = new Map();
  for (const providerAttempt of attempt.provider_attempts) latest.set(providerAttempt.provider, providerAttempt);
  if (latest.size !== providers.length || providers.some((provider) => !latest.has(provider))) {
    throw invalidEvidence("format correction attempt does not bind the configured provider group");
  }
  const seed = new Map();
  for (const provider of providers) {
    const providerAttempt = latest.get(provider);
    let content = null;
    if (providerAttempt.output_ref !== null) {
      try { content = JSON.parse(task.readRecord(providerAttempt.output_ref)).content; }
      catch (error) { throw invalidEvidence(`format correction output cannot be read: ${error.message}`); }
    }
    let valid = false;
    if (typeof content === "string") {
      try { parseReviewerOutput(content, { requireEvidence: true }); valid = true; } catch {}
    }
    const needsCorrection = !valid;
    if (needsCorrection && (providerAttempt.error?.code !== "OUTPUT_INVALID" || !providerAttempt.session_id || !providerAttempt.runtime_id || typeof content !== "string")) {
      throw invalidEvidence("format correction requires one continuable OUTPUT_INVALID provider output");
    }
    seed.set(provider, {
      runtimeId: providerAttempt.runtime_id,
      provider: {
        provider,
        status: providerAttempt.status,
        session_id: providerAttempt.session_id,
        output: content,
        error: providerAttempt.error,
        execution: providerAttempt.execution,
        unavailable_diagnostics: providerAttempt.unavailable_diagnostics,
      },
      needsCorrection,
    });
  }
  if (![...seed.values()].some((item) => item.needsCorrection)) throw invalidEvidence("format correction attempt has no invalid provider output");
  return seed;
}

function materialPreflightCode(error) {
  if (["MATERIAL_INCOMPLETE", "MATERIAL_FORBIDDEN"].includes(error?.code)) return error.code;
  const match = /^(MATERIAL_INCOMPLETE|MATERIAL_FORBIDDEN):\s/.exec(error?.message ?? "");
  return match?.[1] ?? null;
}

function isMaterialPreflightFailure(error) {
  return materialPreflightCode(error) !== null;
}

function materialPreflightDiagnostic(error) {
  const code = materialPreflightCode(error);
  if (code === null) throw error;
  const message = typeof error.message === "string" && error.message.length > 0
    ? error.message
    : error.code;
  // Material compilation is a public control-plane fact. Do not let an
  // unexpected host path in an implementation error cross that boundary.
  if (absoluteDiagnosticPath.test(message)) {
    return { code, message: "review material preflight failed; private diagnostic withheld" };
  }
  return { code, message };
}

function materialPreflightId({ stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint = null }) {
  return hashCanonical({
    version: "wh-review-material-preflight.v1", stage, review_track: reviewTrack,
    subject, source, snapshot_tree: source.snapshotTree,
    review_policy: policy, diagnostic, material_fingerprint: materialFingerprint,
  });
}

async function recordMaterialPreflightUnavailable({ task, taskId, stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint = null }) {
  const materialId = materialPreflightId({ stage, reviewTrack, subject, source, policy, diagnostic, materialFingerprint });
  const policyFingerprint = policy === null ? null : hashCanonical(policy);
  const identity = {
    taskId,
    stage,
    reviewTrack,
    subject,
    snapshotTree: source.snapshotTree,
    materialId,
    policyFingerprint,
  };
  const lockRef = reviewLockRef({
    stage,
    reviewTrack,
    reviewScope: subject.review_scope,
    snapshotTree: source.snapshotTree,
    materialId,
    policyFingerprint,
  });
  const minimumReviewers = minimumReviewersForPolicy(policy, stage, reviewTrack, subject.review_scope);
  const aggregation = aggregateProviderResults([], minimumReviewers, { profilePriority: policy?.requested_profiles ?? [] });
  const coverage = reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation });
  const unavailable = () => withLocalReviewLock(task, lockRef, () => task.withRecordLock(lockRef, () => {
    const allMatches = readMatchingRecords(task, task.listCanonicalReviewAttemptRefs(), identity);
    for (const item of allMatches) {
      validateAttemptIdentity(item.record, item.ref, identity);
      matchesRequestedPolicy(item.record, identity);
    }
    const matches = allMatches.filter(({ record }) =>
      (record.policy_snapshot_hash ?? null) === identity.policyFingerprint);
    const results = readMatchingRecords(task, task.listCanonicalReviewResultRefs(), identity);
    if (results.length !== 0 || matches.length > 1) throw invalidEvidence("material preflight identity has conflicting canonical review records");
    if (matches.length === 1) {
      const { ref: attemptRef, record: attempt } = matches[0];
      validateAttemptIdentity(attempt, attemptRef, identity);
      if (attempt.terminal_status !== "unavailable" || !isDeepStrictEqual(attempt.error, diagnostic) || attempt.provider_attempts.length !== 0) {
        throw invalidEvidence("material preflight unavailable attempt does not match its canonical diagnostic");
      }
      validateUnavailableAttemptEvidence(task, attempt, { manifest: [] });
      ensureReviewReport(task, attempt.report_ref, attempt);
      return {
        status: "unavailable", verdict: null, attemptRef, resultRef: null, reportRef: attempt.report_ref,
        snapshotTree: source.snapshotTree, materialId, runtimeIds: {}, subjectKind: subject.subject_kind,
        phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree,
        candidateTree: subject.candidate_tree, reused: true,
      };
    }
    const attemptId = randomUUID();
    const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree, root: reviewRootFor(task) });
    const lineage = createReviewLineage({
      requestId: materialId,
      promptHash: hashCanonical("material-preflight"),
      round: policy?.round ?? "initial",
      priorAttemptRefs: [],
      priorRuntimeIds: {},
      correctionRef: null,
      dispatchSequence: 0,
    });
    const attempt = {
      version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack,
      ...subject, source: sourceRecord(source), snapshot_tree: source.snapshotTree, material_id: materialId,
      lineage,
      report_ref: refs.reportRef, provider_attempts: [], terminal_status: "unavailable", error: diagnostic,
      ...(policy ? { review_policy: policy, policy_snapshot_hash: createHash("sha256").update(canonicalJson(policy)).digest("hex"), coverage } : {}),
    };
    validateSchema("attempt", attempt);
    writeAttempt(task, refs.attemptRef, attempt);
    writeReviewReport(task, refs.reportRef, { attempt });
    return {
      status: "unavailable", verdict: null, attemptRef: refs.attemptRef, resultRef: null, reportRef: refs.reportRef,
      snapshotTree: source.snapshotTree, materialId, runtimeIds: {}, subjectKind: subject.subject_kind,
      phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree,
      candidateTree: subject.candidate_tree,
    };
  }));
  return unavailable();
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
  // Host validation makes null an exact configured absence, never a wildcard.
  return execution !== null && execution !== undefined &&
    execution.model === profile.model && execution.effort === profile.effort && execution.thinking === profile.thinking;
}

function rejectProfileMismatches(reviewed, policy) {
  const expected = new Map((policy?.requested_profile_specs ?? []).map((profile) => [profile.provider, profile]));
  return reviewed.map((item) => {
    const profile = expected.get(item.provider);
    if (!profile || item.final.status !== "completed" || pinnedProfileMatches(profile, item.final.execution)) return item;
    return {
      ...item,
      review: null,
      final: {
        ...item.final,
        error: {
          code: "PROFILE_MISMATCH",
          message: `3rd-review execution tuple does not match configured profile ${item.provider}`,
        },
      },
    };
  });
}

async function reviewOne({ providerClient, provider, hostProvider, materials, continuationRuntimeId }) {
  const calls = []; let freshUsed = false;
  const invoke = async (prompt, runtime) => {
    try { const result = await providerClient.run({ hostProvider, provider, materials, prompt, continuationRuntimeId: runtime }); calls.push({ runtimeId: result.runtimeId, provider: result.provider }); return result; }
    catch (error) { const result = { runtimeId: runtime, provider: failedProvider(provider, error) }; calls.push(result); return result; }
  };
  const normal = async (runtime) => {
    let result = await invoke(providerPrompt, runtime);
    if (runtime && freshable.has(result.provider.error?.code) && !freshUsed) { freshUsed = true; result = await invoke(providerPrompt, null); }
    return result;
  };
  let current = await normal(continuationRuntimeId);
  for (;;) {
    if (current.provider.status !== "completed" || typeof current.provider.output !== "string") return { provider, review: null, final: current.provider, calls };
    try { return { provider, review: parseReviewerOutput(current.provider.output, { requireEvidence: true }), final: current.provider, calls }; }
    catch {
      if (!current.provider.session_id) return { provider, review: null, final: { ...current.provider, error: { code: "OUTPUT_INVALID", message: "provider output is not valid reviewer JSON" } }, calls };
      const correction = await invoke(FORMAT_CORRECTION_PROMPT, current.runtimeId);
      if (freshable.has(correction.provider.error?.code) && !freshUsed) { freshUsed = true; current = await invoke(providerPrompt, null); continue; }
      if (correction.provider.status !== "completed" || typeof correction.provider.output !== "string") return { provider, review: null, final: correction.provider, calls };
      try { return { provider, review: parseReviewerOutput(correction.provider.output, { requireEvidence: true }), final: correction.provider, calls }; }
      catch { return { provider, review: null, final: { ...correction.provider, error: { code: "OUTPUT_INVALID", message: "provider output remained invalid after one same-session correction" } }, calls }; }
    }
  }
}

function groupContinuationRuntime(providers, previousRuntimeIds) {
  const runtimes = providers.map((provider) => previousRuntimeIds[provider]).filter((runtimeId) => typeof runtimeId === "string" && runtimeId.length > 0);
  // A broker continuation belongs to one prior reviewer group. Never join
  // unrelated per-provider runtimes from the old dispatch shape.
  return runtimes.length === providers.length && new Set(runtimes).size === 1 ? runtimes[0] : null;
}

function reviewGroupOutcome(provider, result, runtimeId, calls = [{ runtimeId, provider: result }]) {
  if (result.status !== "completed" || typeof result.output !== "string") return { provider, review: null, final: result, calls };
  try { return { provider, review: parseReviewerOutput(result.output, { requireEvidence: true }), final: result, calls }; }
  catch {
    return {
      provider, review: null,
      final: { ...result, error: { code: "OUTPUT_INVALID", message: "provider output is not valid reviewer JSON" } },
      calls,
    };
  }
}

function correctionFailure(providers, seed, error) {
  return providers.map((provider) => {
    const original = seed.get(provider);
    if (!original.needsCorrection) return reviewGroupOutcome(provider, original.provider, original.runtimeId);
    const failed = failedProvider(provider, error);
    return {
      provider, review: null,
      final: failed,
      calls: [{ runtimeId: original.runtimeId, provider: original.provider }, { runtimeId: original.runtimeId, provider: failed }],
    };
  });
}

async function correctGroupFormat({ providerClient, providers, hostProvider, materials, requestId, seed }) {
  const correctionProviders = providers.filter((provider) => seed.get(provider).needsCorrection);
  if (correctionProviders.length === 0) return providers.map((provider) => reviewGroupOutcome(provider, seed.get(provider).provider, seed.get(provider).runtimeId));
  const runtimes = [...new Set(correctionProviders.map((provider) => seed.get(provider).runtimeId))];
  if (runtimes.length !== 1) return correctionFailure(providers, seed, protocolFailure("format correction requires one shared managed runtime"));
  let group;
  try {
    group = await providerClient.runGroup({
      hostProvider, providers: correctionProviders, materials, prompt: FORMAT_CORRECTION_PROMPT,
      continuationRuntimeId: runtimes[0], requestId: formatCorrectionRequestId(requestId),
    });
  } catch (error) {
    return correctionFailure(providers, seed, error);
  }
  if (!group || typeof group.runtimeId !== "string" || !Array.isArray(group.providers)) {
    return correctionFailure(providers, seed, protocolFailure("3rd-review format correction returned an incomplete result"));
  }
  const corrected = new Map(group.providers.map((result) => [result?.provider, result]));
  const outcomes = new Map();
  for (const provider of providers) {
    const original = seed.get(provider);
    if (!original.needsCorrection) {
      outcomes.set(provider, reviewGroupOutcome(provider, original.provider, original.runtimeId));
      continue;
    }
    const correction = corrected.get(provider);
    if (!correction) {
      const failed = failedProvider(provider, protocolFailure(`3rd-review format correction omitted provider ${provider}`));
      outcomes.set(provider, { provider, review: null, final: failed, calls: [{ runtimeId: original.runtimeId, provider: original.provider }, { runtimeId: group.runtimeId, provider: failed }] });
      continue;
    }
    outcomes.set(provider, reviewGroupOutcome(provider, correction, group.runtimeId, [
      { runtimeId: original.runtimeId, provider: original.provider },
      { runtimeId: group.runtimeId, provider: correction },
    ]));
  }
  return providers.map((provider) => outcomes.get(provider));
}

async function reviewGroup({ providerClient, providers, hostProvider, materials, previousRuntimeIds, requestId, formatCorrectionSeed = null, allowLegacyFixtureClient = false }) {
  // Test doubles from the old single-provider boundary retain a narrow,
  // explicit fixture seam. Production rejects that interface: its only
  // dispatch is one broker-owned reviewer group.
  if (typeof providerClient.runGroup !== "function") {
    if (!allowLegacyFixtureClient) throw new TypeError("providerClient.runGroup is required for production review dispatch");
    return Promise.all(providers.map((provider) => reviewOne({
      providerClient, provider, hostProvider, materials, continuationRuntimeId: previousRuntimeIds[provider] ?? null,
    })));
  }
  if (formatCorrectionSeed !== null) {
    return correctGroupFormat({ providerClient, providers, hostProvider, materials, requestId, seed: formatCorrectionSeed });
  }
  let group;
  try {
    group = await providerClient.runGroup({
      hostProvider, providers, materials, prompt: providerPrompt,
      continuationRuntimeId: groupContinuationRuntime(providers, previousRuntimeIds),
      requestId,
    });
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
  const initial = providers.map((provider) => {
    const result = byProvider.get(provider);
    if (!result) {
      const failed = failedProvider(provider, protocolFailure(`3rd-review group omitted provider ${provider}`));
      return { provider, review: null, final: failed, calls: [{ runtimeId: group.runtimeId, provider: failed }] };
    }
    return reviewGroupOutcome(provider, result, group.runtimeId);
  });
  const seed = new Map(initial.map((outcome) => [outcome.provider, {
    runtimeId: group.runtimeId,
    provider: outcome.calls[0].provider,
    needsCorrection: outcome.final.error?.code === "OUTPUT_INVALID" && outcome.calls[0].provider.session_id !== null,
  }]));
  return correctGroupFormat({ providerClient, providers, hostProvider, materials, requestId, seed });
}

async function runReviewOnce({ sourceRoot, targetRepoRoot, workspace, candidateWorkspace, task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, reviewScope = undefined, uiScope = false, materials = {}, current_receipts = {}, hostProvider, providers, reviewPolicy = null, reviewRound = null, previousRuntimeIds = {}, formatCorrectionAttemptRef = null, reuseUnavailable = false, claimedUnavailableAttemptRefs = [], providerClient, captureSource = captureSourceDefault, buildMaterials = buildMaterialsDefault, buildIntegrationSubject = undefined, fixtureSourceToken } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!(attachmentRoot && taskId && stage && hostProvider && providerClient) || !Array.isArray(providers) || providers.length === 0) throw new TypeError("review inputs, attachmentRoot, and at least one provider are required");
  if (reviewScope !== undefined) throw new TypeError("review_scope is derived from phase_id and cannot be supplied by a caller");
  if (buildIntegrationSubject !== undefined && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) throw new TypeError("integration subject is derived from current task evidence");
  if (new Set(providers).size !== providers.length) throw new TypeError("providers must be unique");
  // Candidate groups intentionally retain same-adapter profiles. The broker
  // is the single authority that excludes them and emits SAME_SOURCE facts.
  const policy = reviewPolicyRecord(reviewPolicy);
  if (policy?.source !== "wh_review.v2" && providers.includes(hostProvider)) throw new TypeError("provider must differ from hostProvider");
  const effectiveReviewRound = reviewRound ?? policy?.round ?? "initial";
  if (!["initial", "incremental", "closure", "full", "legacy"].includes(effectiveReviewRound)) throw new TypeError("reviewRound is invalid");
  if (policy && effectiveReviewRound !== policy.round) throw new TypeError("reviewRound must equal reviewPolicy.round");
  if (policy && !isDeepStrictEqual(policy.requested_profiles, providers)) throw new TypeError("reviewPolicy requested_profiles must equal broker reviewer group");
  if (!previousRuntimeIds || typeof previousRuntimeIds !== "object" || Array.isArray(previousRuntimeIds)) throw new TypeError("previousRuntimeIds must be an object keyed by provider");
  if (stage === "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision review forbids naked source/target paths; use CandidateWorkspace");
    const candidate = assertCandidateWorkspace(candidateWorkspace);
    sourceRoot = candidate.worktreeRoot;
    targetRepoRoot = candidate.targetRepoRoot;
  } else if (stage !== "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("full worktree review forbids naked source/target paths; use Workspace");
    workspace = assertWorkspace(workspace);
  }
  // Integration does not deliver a cumulative diff, but it still needs the
  // frozen changed-file index so the subject can select bounded final-snapshot
  // implementation excerpts for the provider packet.
  const phasePaths = phaseId !== null && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN
    ? phaseExecutionPaths(taskHandle, workspace, phaseId)
    : undefined;
  const source = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: phaseId !== null || stage !== "build-code" || (stage === "build-code" && phaseId === null), ...(phasePaths === undefined ? {} : { phasePaths }) });
  let integrationSubject; let subject; let bundle; let classificationManifest;
  try {
    const isIntegration = stage === "build-code" && phaseId === null;
    // A production final build-code review is an integration review, not a
    // diff-free alias for a caller-defined worktree packet. Coverage comes
    // from current completed task evidence and same-snapshot receipts; phase
    // history is optional audit data and cannot control progress.
    // The explicit fixture seam lets isolated tests provide synthetic canonical
    // facts without weakening the production entrypoint.
    if (isIntegration && (fixtureSourceToken !== FIXTURE_SOURCE_TOKEN || typeof buildIntegrationSubject === "function")) {
      try {
        integrationSubject = (buildIntegrationSubject ?? buildIntegrationSubjectDefault)({
          task: taskHandle,
          sourceRoot: workspace?.worktreeRoot ?? source.sourceRoot,
          ...(workspace?.worktreeRoot ? { artifacts: ArtifactDir.open(workspace.worktreeRoot, taskHandle) } : {}),
          current_receipts,
          finalTree: source.snapshotTree,
        });
      } catch (error) {
        // Historical phase/checkpoint enrichment is audit-only. If it is
        // unavailable in production, continue with the current four
        // materials and mark the historical record explicitly unavailable.
        // Fixtures and caller-supplied subjects remain strict.
        if (fixtureSourceToken === FIXTURE_SOURCE_TOKEN || typeof buildIntegrationSubject === "function") throw error;
        integrationSubject = {
          schema_version: "integration-review-subject.v1",
          subject_kind: "worktree",
          review_scope: "integration",
          base_tree: source.baseTree,
          base_commit: source.baseCommit,
          formal_record_status: { status: "unavailable", reason_code: "HISTORICAL_INTEGRATION_AUDIT_UNAVAILABLE" },
          phase_coverage: {
            schema_version: "phase-review-coverage.v1",
            status: "unavailable",
            snapshot_tree: source.snapshotTree,
            checkpoint: null,
            phases: [],
          },
          seam_index: { schema_version: "cross-phase-seam-index.v1", snapshot_tree: source.snapshotTree, entries: [] },
          ac_trace: { schema_version: "ac-change-test-trace.v1", snapshot_tree: source.snapshotTree, acceptance_ids: [], entries: [] },
        };
      }
    } else {
      integrationSubject = null;
    }
    subject = subjectRecord(source, stage, phaseId, integrationSubject);
    const fixedMaterials = {
      ...materials,
      ...(integrationSubject ? integrationMaterialFacts(integrationSubject) : {}),
      review_instructions: reviewInstructionsFor(
        stage,
        reviewTrack,
        uiScope,
        effectiveReviewRound,
        subject.review_scope,
        materials?.scope_revision ? "scope_revision" : null,
      ),
    };
    classificationManifest = buildClassificationManifest(fixedMaterials);
    bundle = buildMaterials({
      reviewDataRoot: attachmentRoot, attachmentRoot, source, task: taskHandle, taskId, stage, phaseId, reviewTrack,
      reviewScope: subject.review_scope, uiScope,
      materials: fixedMaterials, strictV2Maps: policy?.source === "wh_review.v2", reviewRound: effectiveReviewRound,
    });
  } catch (error) {
    if (!isMaterialPreflightFailure(error)) throw error;
    const diagnostic = materialPreflightDiagnostic(error);
    const preflightSubject = subject ?? subjectRecord(source, stage, phaseId);
    return recordMaterialPreflightUnavailable({
      task: taskHandle, taskId, stage, reviewTrack, subject: preflightSubject, source,
      policy, diagnostic, materialFingerprint: hashCanonical(materials ?? null),
    });
  } finally {
    source.dispose?.();
  }
  const policyFingerprint = policy === null ? null : hashCanonical(policy);
  const lockRef = reviewLockRef({
    stage,
    reviewTrack,
    reviewScope: subject.review_scope,
    snapshotTree: source.snapshotTree,
    materialId: bundle.materialId,
    policyFingerprint,
  });
  const identity = {
    taskId,
    stage,
    reviewTrack,
    subject,
    snapshotTree: source.snapshotTree,
    materialId: bundle.materialId,
    policyFingerprint,
  };
  const reuseOptions = { reuseUnavailable, claimedUnavailableAttemptRefs };
  const reusable = () => withLocalReviewLock(taskHandle, lockRef, () => taskHandle.withRecordLock(lockRef, () => reusableOutcome(taskHandle, identity, bundle, reuseOptions)));
  const existing = await reusable();
  if (existing) return existing;
  const subjectHead = canonicalSubjectOutcome(taskHandle, identity);
  if (subjectHead) return subjectHead;
  const continuationRuntimeId = groupContinuationRuntime(providers, previousRuntimeIds);
  const dispatchSequence = unavailableDispatchSequence(taskHandle, identity);
  const requestId = managedRequestId({ ...identity, hostProvider, providers, continuationRuntimeId, dispatchSequence });
  const lineage = createReviewLineage({
    requestId,
    promptHash: hashCanonical(providerPrompt),
    round: effectiveReviewRound,
    priorAttemptRefs: formatCorrectionAttemptRef === null ? [] : [formatCorrectionAttemptRef],
    priorRuntimeIds: previousRuntimeIds,
    correctionRef: formatCorrectionAttemptRef,
    dispatchSequence,
  });
  const formatCorrectionSeed = formatCorrectionAttemptRef === null
    ? null
    : formatCorrectionSeedForAttempt(taskHandle, formatCorrectionAttemptRef, identity, bundle, policy, providers);
  // Managed start/status owns provider execution. No WorkflowHub record lock
  // is held while a healthy reviewer group is running or reconnecting.
  const reviewed = rejectProfileMismatches(await reviewGroup({
    providerClient, providers, hostProvider, materials: bundle, previousRuntimeIds, requestId, formatCorrectionSeed,
    allowLegacyFixtureClient: fixtureSourceToken === FIXTURE_SOURCE_TOKEN,
  }), policy);
  return withLocalReviewLock(taskHandle, lockRef, () => taskHandle.withRecordLock(lockRef, async () => {
    const reused = reusableOutcome(taskHandle, identity, bundle, reuseOptions);
    if (reused) return reused;
    const attemptId = randomUUID(); const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree, root: reviewRootFor(taskHandle) });
    const runtimeIds = Object.fromEntries(reviewed.map((item) => [item.provider, [...item.calls].reverse().find((call) => typeof call.runtimeId === "string")?.runtimeId ?? null]));
    const providerAttempts = [];
    for (const item of reviewed) {
      for (let index = 0; index < item.calls.length; index += 1) {
        const call = item.calls[index]; const isLast = index === item.calls.length - 1; const finalError = isLast ? item.final?.error ?? null : call.provider.error ?? null;
        const outputRef = writeProviderOutput(taskHandle, refs.providerDirectoryRef, item.provider, call.provider.output, index + 1, { taskId, stage });
        providerAttempts.push({ provider: item.provider, status: finalError ? "failed" : call.provider.status, session_id: call.provider.session_id ?? null, runtime_id: call.runtimeId ?? null, execution: call.provider.execution ?? null, unavailable_diagnostics: call.provider.unavailable_diagnostics ?? null, output_ref: outputRef, error: finalError });
      }
    }
    const assessed = evidenceAnchorsFor(reviewed, bundle);
    const minimumReviewers = minimumReviewersForPolicy(policy, stage, reviewTrack, subject.review_scope); const aggregation = aggregateProviderResults(assessed, minimumReviewers, { profilePriority: policy?.requested_profiles ?? providers });
    const coverage = reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation });
    const unavailableError = primaryError(reviewed);
    const attempt = {
      version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack,
      ...subject, source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree, material_id: bundle.materialId, lineage,
      report_ref: refs.reportRef,
      provider_attempts: providerAttempts, terminal_status: aggregation.status === "semantic" ? "semantic" : "unavailable",
      error: aggregation.status === "semantic" ? null : { code: unavailableError.code, message: `${unavailableError.message}; only ${aggregation.valid.length} valid reviewer result(s); ${minimumReviewers} required` },
      ...(policy ? { review_policy: policy, policy_snapshot_hash: createHash("sha256").update(canonicalJson(policy)).digest("hex"), coverage } : {}),
      ...(classificationManifest ? { classification_manifest: classificationManifest } : {})
    };
    validateSchema("attempt", attempt); writeAttempt(taskHandle, refs.attemptRef, attempt);
    if (aggregation.status !== "semantic") {
      writeReviewReport(taskHandle, refs.reportRef, { attempt });
      return { status: "unavailable", verdict: null, attemptRef: refs.attemptRef, resultRef: null, reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
    }
    const providerResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
    const findings = aggregation.adjudication.reportFindings.map((finding) => ({ provider: finding.providers[0], ...finding }));
    const result = {
      version: "wh-review-result.v1", task_id: taskId, stage, review_track: reviewTrack, ...subject, source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree,
      material_id: bundle.materialId, attempt_ref: refs.attemptRef, report_ref: refs.reportRef, lineage, provider_results: providerResults,
      verdict: aggregation.verdict, findings,
      adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
      ...(classificationManifest ? { classification_manifest: classificationManifest } : {}),
    };
    validateSchema("result", result); writeSemanticResult(taskHandle, refs.resultRef, result); writeReviewReport(taskHandle, refs.reportRef, { attempt, result });
    return { status: "semantic", verdict: result.verdict, attemptRef: refs.attemptRef, resultRef: refs.resultRef, reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
  }));
}

export async function runReview(options = {}) {
  const taskHandle = assertTaskHandle(options.task);
  const subjectLockRef = `locks/review-subjects/${createHash("sha256").update(JSON.stringify([
    taskHandle.identity.projectName,
    options.taskId,
    options.stage,
    options.reviewTrack ?? null,
    options.phaseId ?? null,
  ])).digest("hex")}.lock`;
  const key = `${taskHandle.identity.projectName}:${taskHandle.identity.taskId}:${subjectLockRef}`;
  const previous = subjectReviewFlights.get(key) ?? Promise.resolve();
  const current = previous.then(() => runReviewOnce(options));
  const flight = current.catch(() => {});
  subjectReviewFlights.set(key, flight);
  try {
    return await current;
  } finally {
    if (subjectReviewFlights.get(key) === flight) subjectReviewFlights.delete(key);
  }
}

/** Explicit fake-source seam for isolated tests; the private token is not caller-forgeable. */
export function runReviewFixture(options) {
  return runReview({ ...options, fixtureSourceToken: FIXTURE_SOURCE_TOKEN });
}

export function verifyFinalSubject({ result, current, integrationSubject = null } = {}) {
  if (!result || typeof result !== "object" || !current || typeof current !== "object") throw new TypeError("result and current source are required");
  const isIntegration = result.stage === "build-code" && result.review_scope === "integration" && integrationSubject !== null;
  const expected = isIntegration
    ? integrationSubject
    : { base_commit: current.baseCommit, base_tree: current.baseTree, snapshot_tree: current.snapshotTree };
  if (!expected || typeof expected !== "object" || expected.base_commit !== result.source.base_commit || expected.base_tree !== result.base_tree
    || (isIntegration && expected.snapshot_tree !== current.snapshotTree)) {
    const error = new Error("WORKTREE_CHANGED_AFTER_REVIEW: current review subject differs from the reviewed subject"); error.code = "WORKTREE_CHANGED_AFTER_REVIEW"; throw error;
  }
  const subjectMismatch = result.subject_kind === "worktree" && (current.snapshotTree !== result.candidate_tree || current.snapshotTree !== result.snapshot_tree);
  if (subjectMismatch || current.targetCommit !== result.source.target_commit || current.capturedHead !== result.source.captured_head
    || result.source.base_commit !== expected.base_commit || result.source.base_tree !== expected.base_tree) {
    const error = new Error("WORKTREE_CHANGED_AFTER_REVIEW: current review subject differs from the reviewed subject"); error.code = "WORKTREE_CHANGED_AFTER_REVIEW"; throw error;
  }
  return { status: "finalized", snapshotTree: current.snapshotTree };
}

export function verifyFinal({ resultRef, sourceRoot, targetRepoRoot, workspace, candidateWorkspace, task, attachmentRoot, taskId = null, stage = null, reviewTrack = undefined, captureSource = captureSourceDefault } = {}) {
  const taskHandle = assertTaskHandle(task);
  const resultRoot = "quality/reviews/results/";
  if (typeof resultRef !== "string" || !resultRef.startsWith(resultRoot)) throw new Error("RESULT_REF_INVALID: canonical result ref required");
  let result;
  try { result = JSON.parse(taskHandle.readRecord(resultRef)); }
  catch { throw new Error("RESULT_REF_INVALID: result does not exist or is invalid"); }
  validateSchema("result", result);
  if (result.subject_kind === "phase") { const error = new Error("PHASE_RESULT_NOT_FINAL: phase review results are consumed by phase-gate, not verify-final"); error.code = "PHASE_RESULT_NOT_FINAL"; throw error; }
  if (result.stage === "build-code" && result.review_scope !== "integration") { const error = new Error("INTEGRATION_RESULT_REQUIRED: build-code final review must be integration scope"); error.code = "INTEGRATION_RESULT_REQUIRED"; throw error; }
  // A provider verdict is an authenticated quality fact, not a WorkflowHub
  // stage-acceptance decision. Finalization authenticates the frozen subject;
  // the owning stage contract decides how findings are disclosed or handled.
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
  const current = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: false });
  try {
    const integrationSubject = result.stage === "build-code" && result.review_scope === "integration" && workspace?.worktreeRoot
      ? buildIntegrationSubjectDefault({
        task: taskHandle,
        sourceRoot: workspace.worktreeRoot,
        artifacts: ArtifactDir.open(workspace.worktreeRoot, taskHandle),
        finalTree: result.snapshot_tree,
      })
      : null;
    return verifyFinalSubject({ result, current, integrationSubject });
  } finally {
    current.dispose?.();
  }
}
