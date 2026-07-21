import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "../../../core/workspace.mjs";
import { capturePhaseReviewSource as capturePhaseSourceDefault, captureReviewSource as captureSourceDefault } from "./review-source.mjs";
import { buildReviewMaterials as buildMaterialsDefault, minimumReviewersFor, reviewInstructionsFor } from "./review-materials.mjs";
import { FORMAT_CORRECTION_PROMPT, parseReviewerOutput } from "./review-output.mjs";
import { aggregateProviderResults, reviewRefs, writeAttempt, writeProviderOutput, writeSemanticResult } from "./review-result.mjs";
import { validateSchema } from "./schema-validator.mjs";

const freshable = new Set(["RUNTIME_EXPIRED", "RUNTIME_NOT_FOUND", "NO_CONTINUABLE_SESSION"]);
const errorPriority = ["MATERIAL_INCOMPLETE", "PROTOCOL_INCOMPATIBLE", "OUTPUT_INVALID", "PROVIDER_UNAVAILABLE"];
const providerPrompt = "Read review-instructions.md and the complete frozen bundle. Return the requested JSON object only.";
const FIXTURE_SOURCE_TOKEN = Symbol("wh-review fixture source");

function sourceRecord(source) {
  return { target_commit: source.targetCommit, base_commit: source.baseCommit, base_tree: source.baseTree, captured_head: source.capturedHead };
}

function subjectRecord(source, phaseId) {
  return { subject_kind: phaseId ? "phase" : "worktree", phase_id: phaseId ?? null, base_tree: source.baseTree, candidate_tree: source.snapshotTree };
}

function reusablePass(task, { taskId, stage, reviewTrack, subject, snapshotTree, materialId }) {
  for (const resultRef of task.listCanonicalReviewResultRefs()) {
    let result;
    try {
      result = JSON.parse(task.readRecord(resultRef));
      validateSchema("result", result);
    } catch { continue; }
    if (result.verdict !== "pass" || result.task_id !== taskId || result.stage !== stage ||
        result.review_track !== reviewTrack || result.snapshot_tree !== snapshotTree || result.material_id !== materialId ||
        result.subject_kind !== subject.subject_kind || result.phase_id !== subject.phase_id ||
        result.base_tree !== subject.base_tree || result.candidate_tree !== subject.candidate_tree) continue;
    let attempt;
    try {
      attempt = JSON.parse(task.readRecord(result.attempt_ref));
      validateSchema("attempt", attempt);
    } catch { continue; }
    const attemptMatch = result.attempt_ref.match(/^reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/);
    if (!attemptMatch || attempt.attempt_id !== attemptMatch[1] || attempt.terminal_status !== "semantic" || attempt.error !== null || attempt.task_id !== result.task_id ||
        attempt.stage !== result.stage || attempt.review_track !== result.review_track ||
        attempt.snapshot_tree !== result.snapshot_tree || attempt.material_id !== result.material_id ||
        attempt.subject_kind !== result.subject_kind || attempt.phase_id !== result.phase_id ||
        attempt.base_tree !== result.base_tree || attempt.candidate_tree !== result.candidate_tree) continue;
    const parsed = [];
    const providers = new Set();
    let chainValid = true;
    for (const providerResult of result.provider_results) {
      if (providers.has(providerResult.provider)) { chainValid = false; break; }
      providers.add(providerResult.provider);
      const providerAttempt = [...attempt.provider_attempts].reverse().find((entry) => entry.provider === providerResult.provider && entry.status === "completed" && typeof entry.output_ref === "string");
      if (!providerAttempt) { chainValid = false; break; }
      try {
        const outputPrefix = `reviews/attempts/${attempt.attempt_id}/providers/`;
        if (!providerAttempt.output_ref.startsWith(outputPrefix) || !/^[A-Za-z0-9._-]+\.output\.json$/.test(providerAttempt.output_ref.slice(outputPrefix.length))) { chainValid = false; break; }
        const output = JSON.parse(task.readRecord(providerAttempt.output_ref));
        const review = parseReviewerOutput(output.content);
        if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== taskId || output.stage !== stage ||
            output.attempt_id !== attempt.attempt_id || output.provider !== providerResult.provider ||
            output.content_hash !== createHash("sha256").update(output.content).digest("hex") || !isDeepStrictEqual(review, providerResult.output)) { chainValid = false; break; }
        parsed.push({ provider: providerResult.provider, review });
      } catch { chainValid = false; break; }
    }
    const aggregation = aggregateProviderResults(parsed, minimumReviewersFor(stage, reviewTrack));
    const expectedProviderResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
    const expectedFindings = expectedProviderResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
    if (!chainValid || aggregation.status !== "semantic" || aggregation.verdict !== "pass" ||
        !isDeepStrictEqual(result.provider_results, expectedProviderResults) || !isDeepStrictEqual(result.findings, expectedFindings)) continue;
    const runtimeIds = Object.fromEntries(attempt.provider_attempts.map((entry) => [entry.provider, entry.runtime_id ?? null]));
    return { status: "semantic", verdict: "pass", attemptRef: result.attempt_ref, resultRef, snapshotTree: result.snapshot_tree,
      materialId: result.material_id, runtimeIds, subjectKind: result.subject_kind, phaseId: result.phase_id,
      baseTree: result.base_tree, candidateTree: result.candidate_tree, reused: true };
  }
  return null;
}

function failedProvider(provider, error) {
  return { provider, status: "failed", session_id: null, output: null, error: { code: error?.code ?? "PROVIDER_UNAVAILABLE", message: error?.message ?? String(error) } };
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
    try { return { provider, review: parseReviewerOutput(current.provider.output), final: current.provider, calls }; }
    catch {
      if (!current.provider.session_id) return { provider, review: null, final: { ...current.provider, error: { code: "OUTPUT_INVALID", message: "provider output is not valid reviewer JSON" } }, calls };
      const correction = await invoke(FORMAT_CORRECTION_PROMPT, current.runtimeId);
      if (freshable.has(correction.provider.error?.code) && !freshUsed) { freshUsed = true; current = await invoke(providerPrompt, null); continue; }
      if (correction.provider.status !== "completed" || typeof correction.provider.output !== "string") return { provider, review: null, final: correction.provider, calls };
      try { return { provider, review: parseReviewerOutput(correction.provider.output), final: correction.provider, calls }; }
      catch { return { provider, review: null, final: { ...correction.provider, error: { code: "OUTPUT_INVALID", message: "provider output remained invalid after one same-session correction" } }, calls }; }
    }
  }
}

export async function runReview({ sourceRoot, targetRepoRoot, workspace, candidateWorkspace, task, attachmentRoot, taskId, stage, phaseId = null, reviewTrack = null, uiScope = false, materials = {}, hostProvider, providers, previousRuntimeIds = {}, providerClient, captureSource = captureSourceDefault, capturePhaseSource = capturePhaseSourceDefault, buildMaterials = buildMaterialsDefault, fixtureSourceToken } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!(attachmentRoot && taskId && stage && hostProvider && providerClient) || !Array.isArray(providers) || providers.length === 0) throw new TypeError("review inputs, attachmentRoot, and at least one provider are required");
  if (new Set(providers).size !== providers.length) throw new TypeError("providers must be unique");
  if (providers.includes(hostProvider)) throw new TypeError("provider must differ from hostProvider");
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
    ? capturePhaseSource({ sourceRoot, task: taskHandle, phaseId })
    : captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot });
  const subject = subjectRecord(source, phaseId);
  const fixedMaterials = { ...materials, review_instructions: reviewInstructionsFor(stage, reviewTrack, uiScope) };
  const bundle = buildMaterials({ reviewDataRoot: attachmentRoot, attachmentRoot, source, task: taskHandle, taskId, stage, reviewTrack, uiScope, materials: fixedMaterials });
  const reused = reusablePass(taskHandle, { taskId, stage, reviewTrack, subject, snapshotTree: source.snapshotTree, materialId: bundle.materialId });
  if (reused) return reused;
  const attemptId = randomUUID(); const refs = reviewRefs({ attemptId, stage, reviewTrack, snapshotTree: source.snapshotTree });
  const reviewed = await Promise.all(providers.map((provider) => reviewOne({ providerClient, provider, hostProvider, materials: bundle, continuationRuntimeId: previousRuntimeIds[provider] ?? null })));
  const runtimeIds = Object.fromEntries(reviewed.map((item) => [item.provider, [...item.calls].reverse().find((call) => typeof call.runtimeId === "string")?.runtimeId ?? null]));
  const providerAttempts = [];
  for (const item of reviewed) {
    for (let index = 0; index < item.calls.length; index += 1) {
      const call = item.calls[index]; const isLast = index === item.calls.length - 1; const finalError = isLast ? item.final?.error ?? null : call.provider.error ?? null;
      const outputRef = writeProviderOutput(taskHandle, refs.providerDirectoryRef, item.provider, call.provider.output, index + 1, { taskId, stage });
      providerAttempts.push({ provider: item.provider, status: finalError ? "failed" : call.provider.status, session_id: call.provider.session_id ?? null, runtime_id: call.runtimeId ?? null, output_ref: outputRef, error: finalError });
    }
  }
  const minimumReviewers = minimumReviewersFor(stage, reviewTrack); const aggregation = aggregateProviderResults(reviewed, minimumReviewers);
  const unavailableError = primaryError(reviewed);
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage, review_track: reviewTrack,
    ...subject, source: sourceRecord(source), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
    provider_attempts: providerAttempts, terminal_status: aggregation.status === "semantic" ? "semantic" : "unavailable",
    error: aggregation.status === "semantic" ? null : { code: unavailableError.code, message: `${unavailableError.message}; only ${aggregation.valid.length} valid reviewer result(s); ${minimumReviewers} required` }
  };
  validateSchema("attempt", attempt); writeAttempt(taskHandle, refs.attemptRef, attempt);
  if (aggregation.status !== "semantic") return { status: "unavailable", verdict: null, attemptRef: refs.attemptRef, resultRef: null, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
  const providerResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const findings = providerResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
  const result = {
    version: "wh-review-result.v1", task_id: taskId, stage, review_track: reviewTrack, ...subject, source: sourceRecord(source), snapshot_tree: source.snapshotTree,
    material_id: bundle.materialId, attempt_ref: refs.attemptRef, provider_results: providerResults,
    verdict: aggregation.verdict, findings
  };
  validateSchema("result", result); writeSemanticResult(taskHandle, refs.resultRef, result);
  return { status: "semantic", verdict: result.verdict, attemptRef: refs.attemptRef, resultRef: refs.resultRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds, subjectKind: subject.subject_kind, phaseId: subject.phase_id, baseTree: subject.base_tree, candidateTree: subject.candidate_tree };
}

/** Explicit fake-source seam for isolated tests; the private token is not caller-forgeable. */
export function runReviewFixture(options) {
  return runReview({ ...options, fixtureSourceToken: FIXTURE_SOURCE_TOKEN });
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
  const current = captureSource({ workspace, sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot });
  const subjectMismatch = result.subject_kind === "worktree" && (current.baseTree !== result.base_tree || current.snapshotTree !== result.candidate_tree);
  if (subjectMismatch || current.snapshotTree !== result.snapshot_tree || current.targetCommit !== result.source.target_commit) { const error = new Error("WORKTREE_CHANGED_AFTER_REVIEW: current review subject differs from the reviewed subject"); error.code = "WORKTREE_CHANGED_AFTER_REVIEW"; throw error; }
  return { status: "finalized", snapshotTree: current.snapshotTree };
}
