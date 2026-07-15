import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { createTaskKernel } from "../../../core/task-kernel.mjs";
import { assertCandidateWorkspace } from "../../../core/workspace.mjs";
import { captureReviewSource as captureSourceDefault } from "./review-source.mjs";
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

export async function runReview({ sourceRoot, targetRepoRoot, candidateWorkspace, task, attachmentRoot, taskId, stage, reviewTrack = null, uiScope = false, materials = {}, hostProvider, providers, previousRuntimeIds = {}, providerClient, captureSource = captureSourceDefault, buildMaterials = buildMaterialsDefault, fixtureSourceToken } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!(attachmentRoot && taskId && stage && hostProvider && providerClient) || !Array.isArray(providers) || providers.length === 0) throw new TypeError("review inputs, attachmentRoot, and at least one provider are required");
  if (new Set(providers).size !== providers.length) throw new TypeError("providers must be unique");
  if (providers.includes(hostProvider)) throw new TypeError("provider must differ from hostProvider");
  if (!previousRuntimeIds || typeof previousRuntimeIds !== "object" || Array.isArray(previousRuntimeIds)) throw new TypeError("previousRuntimeIds must be an object keyed by provider");
  if (stage === "make-decision" && reviewTrack === "direction" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision direction review forbids naked source/target paths; use CandidateWorkspace");
    const candidate = assertCandidateWorkspace(candidateWorkspace);
    sourceRoot = candidate.worktreeRoot;
    targetRepoRoot = candidate.targetRepoRoot;
  } else if (stage !== "make-decision" && fixtureSourceToken !== FIXTURE_SOURCE_TOKEN) {
    const decision = createTaskKernel(taskHandle).readAccepted("make-decision");
    if (realpathSync(sourceRoot) !== realpathSync(decision.facts.worktree_root)) {
      throw new Error("review source must be the exact worktree from accepted make-decision facts");
    }
    if (realpathSync(targetRepoRoot) !== realpathSync(taskHandle.manifest.target_repo_root)) {
      throw new Error("review target must match the authenticated task manifest");
    }
  }
  const source = captureSource({ sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot });
  const fixedMaterials = { ...materials, review_instructions: reviewInstructionsFor(stage, reviewTrack, uiScope) };
  const bundle = buildMaterials({ reviewDataRoot: attachmentRoot, attachmentRoot, source, task: taskHandle, taskId, stage, reviewTrack, uiScope, materials: fixedMaterials });
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
    source: sourceRecord(source), snapshot_tree: source.snapshotTree, material_id: bundle.materialId,
    provider_attempts: providerAttempts, terminal_status: aggregation.status === "semantic" ? "semantic" : "unavailable",
    error: aggregation.status === "semantic" ? null : { code: unavailableError.code, message: `${unavailableError.message}; only ${aggregation.valid.length} valid reviewer result(s); ${minimumReviewers} required` }
  };
  validateSchema("attempt", attempt); writeAttempt(taskHandle, refs.attemptRef, attempt);
  if (aggregation.status !== "semantic") return { status: "unavailable", verdict: null, attemptRef: refs.attemptRef, resultRef: null, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds };
  const providerResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const findings = providerResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
  const result = {
    version: "wh-review-result.v1", task_id: taskId, stage, review_track: reviewTrack, source: sourceRecord(source), snapshot_tree: source.snapshotTree,
    material_id: bundle.materialId, attempt_ref: refs.attemptRef, provider_results: providerResults,
    verdict: aggregation.verdict, findings
  };
  validateSchema("result", result); writeSemanticResult(taskHandle, refs.resultRef, result);
  return { status: "semantic", verdict: result.verdict, attemptRef: refs.attemptRef, resultRef: refs.resultRef, snapshotTree: source.snapshotTree, materialId: bundle.materialId, runtimeIds };
}

/** Explicit fake-source seam for isolated tests; the private token is not caller-forgeable. */
export function runReviewFixture(options) {
  return runReview({ ...options, fixtureSourceToken: FIXTURE_SOURCE_TOKEN });
}

export function verifyFinal({ resultRef, sourceRoot, targetRepoRoot, candidateWorkspace, task, attachmentRoot, taskId = null, stage = null, reviewTrack = undefined, captureSource = captureSourceDefault } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (typeof resultRef !== "string" || !resultRef.startsWith("reviews/results/")) throw new Error("RESULT_REF_INVALID: canonical result ref required");
  let result;
  try { result = JSON.parse(taskHandle.readRecord(resultRef)); }
  catch { throw new Error("RESULT_REF_INVALID: result does not exist or is invalid"); }
  validateSchema("result", result);
  if (result.verdict !== "pass") throw new Error("REVIEW_NOT_APPROVED: semantic result is not pass");
  if (taskId !== null && result.task_id !== taskId) throw new Error("RESULT_REF_INVALID: task does not match result");
  if (stage !== null && result.stage !== stage) throw new Error("RESULT_REF_INVALID: stage does not match result");
  if (reviewTrack !== undefined && result.review_track !== reviewTrack) throw new Error("RESULT_REF_INVALID: review track does not match result");
  if (result.stage === "make-decision" && result.review_track === "direction") {
    if (sourceRoot !== undefined || targetRepoRoot !== undefined) throw new TypeError("make-decision direction verification forbids naked source/target paths; use CandidateWorkspace");
    const candidate = assertCandidateWorkspace(candidateWorkspace);
    sourceRoot = candidate.worktreeRoot;
    targetRepoRoot = candidate.targetRepoRoot;
  }
  const current = captureSource({ sourceRoot, targetRepoRoot, reviewDataRoot: attachmentRoot });
  if (current.targetCommit !== result.source.target_commit || current.snapshotTree !== result.snapshot_tree) { const error = new Error("WORKTREE_CHANGED_AFTER_REVIEW: current target or source tree differs from the reviewed snapshot"); error.code = "WORKTREE_CHANGED_AFTER_REVIEW"; throw error; }
  return { status: "finalized", snapshotTree: current.snapshotTree };
}
