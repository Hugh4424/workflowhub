import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "../../../core/workspace.mjs";
import { capturePhaseReviewSource as capturePhaseSourceDefault, captureReviewSource as captureSourceDefault } from "./review-source.mjs";
import { buildIntegrationReviewSubject as buildIntegrationSubjectDefault } from "./integration-review-subject.mjs";
import { buildReviewMaterials as buildMaterialsDefault, derivePhaseAcceptanceTrace, minimumReviewersFor, reviewInstructionsFor } from "./review-materials.mjs";
import { FORMAT_CORRECTION_PROMPT, parseReviewerOutput } from "./review-output.mjs";
import { aggregateProviderResults, renderReviewReport, reviewRefs, writeAttempt, writeProviderOutput, writeReviewReport, writeSemanticResult } from "./review-result.mjs";
import { validateResponseLedger } from "./review-controller.mjs";
import { validateSchema } from "./schema-validator.mjs";

const freshable = new Set(["RUNTIME_EXPIRED", "RUNTIME_NOT_FOUND", "NO_CONTINUABLE_SESSION"]);
const errorPriority = ["MATERIAL_INCOMPLETE", "PUBLIC_RESULT_INVALID", "PROTOCOL_INCOMPATIBLE", "OUTPUT_INVALID", "PROVIDER_UNAVAILABLE"];
// Providers run from a writable wrapper directory; sealed review material is
// deliberately exposed beneath `bundle/`, never at that directory's root.
const providerPrompt = "Read bundle/review-instructions.md and the complete frozen bundle. Return the requested JSON object only.";
const FIXTURE_SOURCE_TOKEN = Symbol("wh-review fixture source");
const localReviewLocks = new Map();
const RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const OID = /^[a-f0-9]{40,64}$/;
const absoluteDiagnosticPath = /(?:^|[^A-Za-z0-9._~/%-])(?:\/(?![\s/])|[A-Za-z]:[\\/]|file:\/\/\/)/;

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

function reviewLockRef({ stage, reviewTrack, reviewScope, snapshotTree, materialId, reviewChain }) {
  const identity = JSON.stringify([stage, reviewTrack, reviewScope, snapshotTree, materialId, reviewChain ?? null]);
  return `locks/reviews/${createHash("sha256").update(identity).digest("hex")}.lock`;
}

function managedRequestId({ taskId, stage, reviewTrack, subject, snapshotTree, materialId, reviewChain, hostProvider, providers, continuationRuntimeId, dispatchSequence }) {
  if (!Number.isSafeInteger(dispatchSequence) || dispatchSequence < 0) throw new TypeError("dispatchSequence must be a non-negative safe integer");
  const identity = canonicalJson({
    version: "wh-review-dispatch.v1", task_id: taskId, stage, review_track: reviewTrack,
    subject, snapshot_tree: snapshotTree, material_id: materialId, review_chain: reviewChain ?? null,
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
      if (!["initial", "closure", "full", "legacy"].includes(value.round)) throw new TypeError("reviewPolicy.round is invalid");
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

function verifiedPolicyForAttempt(attempt, providers) {
  const policy = reviewPolicyRecord(attempt.review_policy ?? null);
  if (policy?.source !== "wh_review.v2") return policy;
  if (attempt.policy_snapshot_hash !== hashCanonical(policy)) {
    throw invalidEvidence("wh_review.v2 policy snapshot hash does not match its persisted policy");
  }
  if (!hasExactProviderSet(providers, policy.requested_profiles)) {
    throw invalidEvidence("wh_review.v2 provider attempts do not exactly match requested profiles");
  }
  return policy;
}

function reviewChainRecord(value, { task, taskId, stage, reviewTrack, subject, source, reviewRound, controlLedger, policy, fixtureSourceToken }) {
  // Phase reviews bind the complete file-backed diff. Integration and final
  // identity checks intentionally omit a cumulative diff; hash that explicit
  // absence rather than rebuilding source bytes in memory.
  const sourceDiffHash = source.diffSha256 ?? createHash("sha256").update("").digest("hex");
  if (value === null || value === undefined) {
    if (policy?.source === "wh_review.v2" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
      throw new TypeError("wh_review.v2 requires a controller-derived reviewChain");
    }
    if (policy?.source !== "wh_review.v2") return null;
    return {
      version: "wh-review-chain.v1", round: reviewRound,
      parent_result_ref: null, root_result_ref: null, prior_snapshot_tree: null,
      current_snapshot_tree: source.snapshotTree, response_ledger_sha256: null,
      source_diff_sha256: sourceDiffHash,
    };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("reviewChain is invalid");
  const allowed = new Set(["version", "round", "parent_result_ref", "root_result_ref", "prior_snapshot_tree", "current_snapshot_tree", "response_ledger_sha256"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new TypeError(`reviewChain.${key} is not supported`);
  if (value.version !== "wh-review-chain.v1" || value.round !== reviewRound || !OID.test(value.current_snapshot_tree ?? "") ||
      value.current_snapshot_tree !== source.snapshotTree) {
    throw new TypeError("reviewChain does not bind the captured source snapshot");
  }
  const parentRef = value.parent_result_ref;
  const rootRef = value.root_result_ref;
  const priorSnapshot = value.prior_snapshot_tree;
  const ledgerHash = value.response_ledger_sha256;
  if (parentRef === null) {
    if (rootRef !== null || priorSnapshot !== null || ledgerHash !== null || !["initial", "legacy"].includes(reviewRound)) {
      throw new TypeError("root reviewChain cannot claim parent evidence");
    }
  } else {
    if (!RESULT_REF.test(parentRef ?? "") || !RESULT_REF.test(rootRef ?? "") || !OID.test(priorSnapshot ?? "")) {
      throw new TypeError("reviewChain parent provenance is invalid");
    }
    let parent;
    try { parent = JSON.parse(task.readRecord(parentRef)); }
    catch (error) { throw new Error(`reviewChain parent cannot be read: ${error.message}`); }
    if (parent?.version !== "wh-review-result.v1" || parent.task_id !== taskId || parent.stage !== stage || parent.review_track !== reviewTrack ||
        parent.subject_kind !== subject.subject_kind || parent.phase_id !== subject.phase_id ||
        (parent.review_scope ?? null) !== subject.review_scope || parent.snapshot_tree !== priorSnapshot) {
      throw new Error("reviewChain parent does not match the current review subject");
    }
    const expectedRoot = RESULT_REF.test(parent.review_chain?.root_result_ref ?? "") ? parent.review_chain.root_result_ref : parentRef;
    if (rootRef !== expectedRoot) throw new Error("reviewChain root does not match its canonical parent");
    if (typeof ledgerHash !== "string" || !/^[a-f0-9]{64}$/.test(ledgerHash)) throw new TypeError("follow-up reviewChain requires response ledger hash");
    const ledger = validateResponseLedger(controlLedger);
    if (hashCanonical(ledger) !== ledgerHash || ledger.previous_result_ref !== parentRef ||
        ledger.previous_snapshot_tree !== priorSnapshot || ledger.current_snapshot_tree !== source.snapshotTree) {
      throw new Error("reviewChain response ledger does not bind its parent and source snapshot");
    }
  }
  return {
    version: "wh-review-chain.v1", round: reviewRound,
    parent_result_ref: parentRef, root_result_ref: rootRef, prior_snapshot_tree: priorSnapshot,
    current_snapshot_tree: source.snapshotTree, response_ledger_sha256: ledgerHash,
    source_diff_sha256: sourceDiffHash,
  };
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

function matchesReviewIdentity(record, { taskId, stage, reviewTrack, subject, snapshotTree, materialId, reviewChain = undefined }) {
  return record?.task_id === taskId && record.stage === stage && record.review_track === reviewTrack &&
    record.snapshot_tree === snapshotTree && record.material_id === materialId &&
    record.subject_kind === subject.subject_kind && record.phase_id === subject.phase_id &&
    (record.review_scope ?? null) === subject.review_scope &&
    record.base_tree === subject.base_tree && record.candidate_tree === subject.candidate_tree &&
    (reviewChain === undefined || isDeepStrictEqual(record.review_chain ?? null, reviewChain));
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

function validateAttemptIdentity(attempt, attemptRef, identity) {
  try { validateSchema("attempt", attempt); }
  catch (error) { throw invalidEvidence(`attempt schema is invalid: ${error.message}`); }
  const attemptMatch = attemptRef.match(/^reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/);
  if (!attemptMatch || attempt.attempt_id !== attemptMatch[1] || !matchesReviewIdentity(attempt, identity)) {
    throw invalidEvidence("attempt identity does not match its canonical ref or requested review identity");
  }
}

function validateUnavailableAttemptEvidence(task, attempt, bundle) {
  const policy = verifiedPolicyForAttempt(attempt, attempt.provider_attempts.map(({ provider }) => provider));
  const outputPrefix = `reviews/attempts/${attempt.attempt_id}/providers/`;
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
  const outputPrefix = `reviews/attempts/${attempt.attempt_id}/providers/`;
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
    report_ref: attempt.report_ref, provider_results: providerResults, verdict: aggregation.verdict, findings,
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
    ...(attempt.review_chain ? { review_chain: attempt.review_chain } : {}),
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

function reusableOutcome(task, identity, bundle) {
  const { taskId, stage, reviewTrack } = identity;
  const matchingResults = readMatchingRecords(task, task.listCanonicalReviewResultRefs(), identity);
  const matchingAttempts = readMatchingRecords(task, task.listCanonicalReviewAttemptRefs(), identity);
  if (matchingResults.length > 1) throw invalidEvidence("multiple canonical semantic results exist for the same review identity");
  // Transport failures are immutable evidence, not a permanent ban on another
  // formal review of the same draft. Validate every historical attempt before
  // continuing so damaged evidence is still fail-loud.
  for (const item of matchingAttempts) {
    validateAttemptIdentity(item.record, item.ref, identity);
    if (item.record.terminal_status === "unavailable") validateUnavailableAttemptEvidence(task, item.record, bundle);
  }
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
    const attemptMatch = result.attempt_ref.match(/^reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/);
    if (!attemptMatch || attempt.attempt_id !== attemptMatch[1] || attempt.task_id !== result.task_id ||
        attempt.stage !== result.stage || attempt.review_track !== result.review_track ||
        attempt.snapshot_tree !== result.snapshot_tree || attempt.material_id !== result.material_id ||
        attempt.subject_kind !== result.subject_kind || attempt.phase_id !== result.phase_id ||
        (attempt.review_scope ?? null) !== (result.review_scope ?? null) ||
        attempt.base_tree !== result.base_tree || attempt.candidate_tree !== result.candidate_tree ||
        !isDeepStrictEqual(attempt.review_chain ?? null, result.review_chain ?? null)) {
      throw invalidEvidence("attempt and result identities differ");
    }
    const policy = verifiedPolicyForAttempt(attempt, attempt.provider_attempts.map(({ provider }) => provider));
    const parsed = [];
    const providers = new Set();
    const expectedProfiles = new Map((policy?.requested_profile_specs ?? []).map((profile) => [profile.provider, profile]));
    let chainValid = true;
    for (const providerResult of result.provider_results) {
      if (providers.has(providerResult.provider)) { chainValid = false; break; }
      providers.add(providerResult.provider);
      const providerAttempt = [...attempt.provider_attempts].reverse().find((entry) => entry.provider === providerResult.provider && entry.status === "completed" && typeof entry.output_ref === "string");
      if (!providerAttempt) { chainValid = false; break; }
      if (expectedProfiles.has(providerResult.provider) && !pinnedProfileMatches(expectedProfiles.get(providerResult.provider), providerAttempt.execution)) { chainValid = false; break; }
      try {
        const outputPrefix = `reviews/attempts/${attempt.attempt_id}/providers/`;
        if (!providerAttempt.output_ref.startsWith(outputPrefix) || !/^[A-Za-z0-9._-]+\.output\.json$/.test(providerAttempt.output_ref.slice(outputPrefix.length))) { chainValid = false; break; }
        const output = JSON.parse(task.readRecord(providerAttempt.output_ref));
        const review = parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined });
        if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== taskId || output.stage !== stage ||
            output.attempt_id !== attempt.attempt_id || output.provider !== providerResult.provider ||
            output.content_hash !== createHash("sha256").update(output.content).digest("hex") || !isDeepStrictEqual(review, providerResult.output)) { chainValid = false; break; }
        parsed.push({ provider: providerResult.provider, review });
      } catch { chainValid = false; break; }
    }
    const aggregation = aggregateProviderResults(evidenceAnchorsFor(parsed, bundle), minimumReviewersForPolicy(policy, attempt.stage, attempt.review_track), { profilePriority: policy?.requested_profiles ?? profilePriorityForAttempt(attempt) });
    const expectedProviderResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
    const expectedFindings = aggregation.adjudication.reportFindings.map((finding) => ({ provider: finding.providers[0], ...finding }));
    const expectedAdjudication = { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters };
    const legacyFindings = expectedProviderResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
    const legacyVerdict = expectedProviderResults.some(({ output }) => output.verdict === "revise_required") ? "revise_required" : "pass";
    if (!chainValid || (result.adjudication === undefined ? legacyVerdict !== result.verdict : (aggregation.status !== "semantic" || aggregation.verdict !== result.verdict)) ||
        !isDeepStrictEqual(result.provider_results, expectedProviderResults) ||
        (result.adjudication === undefined
          ? (result.verdict !== legacyVerdict || !isDeepStrictEqual(result.findings, legacyFindings))
          : (!isDeepStrictEqual(result.findings, expectedFindings) || !isDeepStrictEqual(result.adjudication, expectedAdjudication)))) {
      throw invalidEvidence("semantic result does not match its provider evidence and aggregation");
    }
    const refs = reviewRefs({ attemptId: attempt.attempt_id, stage: attempt.stage, reviewTrack: attempt.review_track, snapshotTree: attempt.snapshot_tree });
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
  return null;
}

function unavailableDispatchSequence(task, identity) {
  // A terminal unavailable attempt is immutable evidence, not the immutable
  // broker operation itself. A later explicit review run needs a distinct
  // managed request ID; otherwise the broker can only replay the old terminal
  // cancellation forever. Revalidate every matching attempt before deriving
  // this sequence, so a damaged record never changes dispatch identity.
  const attempts = readMatchingRecords(task, task.listCanonicalReviewAttemptRefs(), identity);
  for (const item of attempts) {
    validateAttemptIdentity(item.record, item.ref, identity);
    if (item.record.terminal_status !== "unavailable") throw invalidEvidence(`attempt without a semantic result is not unavailable: ${item.ref}`);
  }
  return attempts.length;
}

function formatCorrectionSeedForAttempt(task, attemptRef, identity, bundle, policy, providers) {
  if (typeof attemptRef !== "string" || !/^reviews\/attempts\/[A-Za-z0-9._-]+\/attempt\.json$/.test(attemptRef)) {
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

function materialPreflightId({ stage, reviewTrack, subject, source, policy, diagnostic }) {
  return hashCanonical({
    version: "wh-review-material-preflight.v1", stage, review_track: reviewTrack,
    subject, source, snapshot_tree: source.snapshotTree,
    review_policy: policy, diagnostic,
  });
}

async function recordMaterialPreflightUnavailable({ task, taskId, stage, reviewTrack, subject, source, chain, policy, diagnostic }) {
  const materialId = materialPreflightId({ stage, reviewTrack, subject, source, policy, diagnostic });
  const identity = { taskId, stage, reviewTrack, subject, snapshotTree: source.snapshotTree, materialId, reviewChain: chain };
  const lockRef = reviewLockRef({ stage, reviewTrack, reviewScope: subject.review_scope, snapshotTree: source.snapshotTree, materialId, reviewChain: chain });
  const minimumReviewers = minimumReviewersForPolicy(policy, stage, reviewTrack, subject.review_scope);
  const aggregation = aggregateProviderResults([], minimumReviewers, { profilePriority: policy?.requested_profiles ?? [] });
  const coverage = reviewCoverageRecord({ stage, policy, minimumReviewers, aggregation });
  const unavailable = () => withLocalReviewLock(task, lockRef, () => task.withRecordLock(lockRef, () => {
    const matches = readMatchingRecords(task, task.listCanonicalReviewAttemptRefs(), identity);
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
    const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree });
    const attempt = {
      version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack,
      ...subject, source: sourceRecord(source), snapshot_tree: source.snapshotTree, material_id: materialId,
      report_ref: refs.reportRef, provider_attempts: [], terminal_status: "unavailable", error: diagnostic,
      ...(policy ? { review_policy: policy, policy_snapshot_hash: createHash("sha256").update(canonicalJson(policy)).digest("hex"), coverage } : {}),
      ...(chain ? { review_chain: chain } : {}),
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

export async function runReview({ sourceRoot, targetRepoRoot, workspace, candidateWorkspace, task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, reviewScope = undefined, uiScope = false, materials = {}, controlLedger = null, hostProvider, providers, reviewPolicy = null, reviewRound = null, reviewChain = null, previousRuntimeIds = {}, formatCorrectionAttemptRef = null, providerClient, captureSource = captureSourceDefault, capturePhaseSource = capturePhaseSourceDefault, buildMaterials = buildMaterialsDefault, buildIntegrationSubject = undefined, fixtureSourceToken } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!(attachmentRoot && taskId && stage && hostProvider && providerClient) || !Array.isArray(providers) || providers.length === 0) throw new TypeError("review inputs, attachmentRoot, and at least one provider are required");
  if (reviewScope !== undefined) throw new TypeError("review_scope is derived from phase_id and cannot be supplied by a caller");
  if (buildIntegrationSubject !== undefined && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) throw new TypeError("integration subject is derived from canonical Phase evidence");
  if (new Set(providers).size !== providers.length) throw new TypeError("providers must be unique");
  // Candidate groups intentionally retain same-adapter profiles. The broker
  // is the single authority that excludes them and emits SAME_SOURCE facts.
  const policy = reviewPolicyRecord(reviewPolicy);
  if (policy?.source !== "wh_review.v2" && providers.includes(hostProvider)) throw new TypeError("provider must differ from hostProvider");
  const effectiveReviewRound = reviewRound ?? policy?.round ?? "initial";
  if (!["initial", "closure", "full", "legacy"].includes(effectiveReviewRound)) throw new TypeError("reviewRound is invalid");
  if (policy && effectiveReviewRound !== policy.round) throw new TypeError("reviewRound must equal reviewPolicy.round");
  if (policy && !isDeepStrictEqual(policy.requested_profiles, providers)) throw new TypeError("reviewPolicy requested_profiles must equal broker reviewer group");
  if (!previousRuntimeIds || typeof previousRuntimeIds !== "object" || Array.isArray(previousRuntimeIds)) throw new TypeError("previousRuntimeIds must be an object keyed by provider");
  if (phaseId !== null && (stage !== "build-code" || typeof phaseId !== "string" || phaseId.length === 0)) throw new TypeError("phase_id is supported only for build-code and must be non-empty");
  if (stage === "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision review forbids naked source/target paths; use CandidateWorkspace");
    const candidate = assertCandidateWorkspace(candidateWorkspace);
    sourceRoot = candidate.worktreeRoot;
    targetRepoRoot = candidate.targetRepoRoot;
  } else if (stage !== "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("full worktree review forbids naked source/target paths; use Workspace");
    workspace = assertWorkspace(workspace);
    if (phaseId) sourceRoot = workspace.worktreeRoot;
  }
  const source = phaseId
    ? capturePhaseSource({ sourceRoot, task: taskHandle, phaseId, reviewDataRoot: attachmentRoot })
    : captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: !(stage === "build-code") });
  let integrationSubject; let subject; let chain; let bundle; let phaseAcceptanceTrace;
  try {
    const isIntegration = stage === "build-code" && phaseId === null;
    // A production final build-code review is an integration review, not a
    // diff-free alias for a caller-defined worktree packet. Coverage and seams
    // are reconstructed from canonical Phase traces before material assembly.
    // The explicit fixture seam lets isolated tests provide synthetic canonical
    // facts without weakening the production entrypoint.
    integrationSubject = isIntegration && (fixtureSourceToken !== FIXTURE_SOURCE_TOKEN || typeof buildIntegrationSubject === "function")
      ? (buildIntegrationSubject ?? buildIntegrationSubjectDefault)({
        task: taskHandle,
        sourceRoot: workspace?.worktreeRoot ?? source.sourceRoot,
        finalTree: source.snapshotTree,
      })
      : null;
    subject = subjectRecord(source, stage, phaseId, integrationSubject);
    chain = reviewChainRecord(reviewChain, {
      task: taskHandle, taskId, stage, reviewTrack, subject, source, reviewRound: effectiveReviewRound,
      controlLedger, policy, fixtureSourceToken,
    });
    const fixedMaterials = {
      ...materials,
      ...(integrationSubject ? integrationMaterialFacts(integrationSubject) : {}),
      review_instructions: reviewInstructionsFor(stage, reviewTrack, uiScope, effectiveReviewRound, subject.review_scope),
    };
    phaseAcceptanceTrace = subject.review_scope === "phase"
      ? derivePhaseAcceptanceTrace({ source, phaseId, materials: fixedMaterials, strictV2Maps: policy?.source === "wh_review.v2" })
      : null;
    bundle = buildMaterials({
      reviewDataRoot: attachmentRoot, attachmentRoot, source, task: taskHandle, taskId, stage, phaseId, reviewTrack,
      reviewScope: subject.review_scope, uiScope,
      materials: fixedMaterials, strictV2Maps: policy?.source === "wh_review.v2", reviewRound: effectiveReviewRound,
    });
  } catch (error) {
    if (!isMaterialPreflightFailure(error)) throw error;
    const diagnostic = materialPreflightDiagnostic(error);
    const preflightSubject = subject ?? subjectRecord(source, stage, phaseId);
    const preflightChain = chain ?? reviewChainRecord(reviewChain, {
      task: taskHandle, taskId, stage, reviewTrack, subject: preflightSubject, source, reviewRound: effectiveReviewRound,
      controlLedger, policy, fixtureSourceToken,
    });
    return recordMaterialPreflightUnavailable({
      task: taskHandle, taskId, stage, reviewTrack, subject: preflightSubject, source, chain: preflightChain,
      policy, diagnostic,
    });
  } finally {
    source.dispose?.();
  }
  const lockRef = reviewLockRef({ stage, reviewTrack, reviewScope: subject.review_scope, snapshotTree: source.snapshotTree, materialId: bundle.materialId, reviewChain: chain });
  const identity = { taskId, stage, reviewTrack, subject, snapshotTree: source.snapshotTree, materialId: bundle.materialId, reviewChain: chain };
  const reusable = () => withLocalReviewLock(taskHandle, lockRef, () => taskHandle.withRecordLock(lockRef, () => reusableOutcome(taskHandle, identity, bundle)));
  const existing = await reusable();
  if (existing) return existing;
  const continuationRuntimeId = groupContinuationRuntime(providers, previousRuntimeIds);
  const dispatchSequence = unavailableDispatchSequence(taskHandle, identity);
  const requestId = managedRequestId({ ...identity, hostProvider, providers, continuationRuntimeId, dispatchSequence });
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
    const reused = reusableOutcome(taskHandle, identity, bundle);
    if (reused) return reused;
    const attemptId = randomUUID(); const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree });
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
      ...subject, source: sourceRecord(source, integrationSubject), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
      report_ref: refs.reportRef,
      provider_attempts: providerAttempts, terminal_status: aggregation.status === "semantic" ? "semantic" : "unavailable",
      error: aggregation.status === "semantic" ? null : { code: unavailableError.code, message: `${unavailableError.message}; only ${aggregation.valid.length} valid reviewer result(s); ${minimumReviewers} required` },
      ...(policy ? { review_policy: policy, policy_snapshot_hash: createHash("sha256").update(canonicalJson(policy)).digest("hex"), coverage } : {}),
      ...(chain ? { review_chain: chain } : {}),
      ...(phaseAcceptanceTrace ? { phase_ac_trace: phaseAcceptanceTrace } : {})
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
      material_id: bundle.materialId, attempt_ref: refs.attemptRef, report_ref: refs.reportRef, provider_results: providerResults,
      verdict: aggregation.verdict, findings,
      adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
      ...(chain ? { review_chain: chain } : {}),
    };
    validateSchema("result", result); writeSemanticResult(taskHandle, refs.resultRef, result); writeReviewReport(taskHandle, refs.reportRef, { attempt, result });
    return { status: "semantic", verdict: result.verdict, attemptRef: refs.attemptRef, resultRef: refs.resultRef, reportRef: refs.reportRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, reviewScope: subject.review_scope, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
  }));
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
  if (typeof resultRef !== "string" || !resultRef.startsWith("reviews/results/")) throw new Error("RESULT_REF_INVALID: canonical result ref required");
  let result;
  try { result = JSON.parse(taskHandle.readRecord(resultRef)); }
  catch { throw new Error("RESULT_REF_INVALID: result does not exist or is invalid"); }
  validateSchema("result", result);
  if (result.verdict !== "pass") throw new Error("REVIEW_NOT_APPROVED: semantic result is not pass");
  if (result.subject_kind === "phase") { const error = new Error("PHASE_RESULT_NOT_FINAL: phase review results are consumed by phase-gate, not verify-final"); error.code = "PHASE_RESULT_NOT_FINAL"; throw error; }
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
  const current = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot, includeDiff: false });
  try {
    const integrationSubject = result.stage === "build-code" && result.review_scope === "integration" && workspace?.worktreeRoot
      ? buildIntegrationSubjectDefault({ task: taskHandle, sourceRoot: workspace.worktreeRoot, finalTree: result.snapshot_tree })
      : null;
    return verifyFinalSubject({ result, current, integrationSubject });
  } finally {
    current.dispose?.();
  }
}
