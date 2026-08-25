#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { recordMissingRouteUnavailable, runReview, verifyFinal } from "./review-runner.mjs";
import { loadTrustedThirdReviewConfig, resolveTrustedReviewRoute, selectTrustedReviewProviderSelection, validateAllWhReviewRoutes } from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace } from "../../../runtime/stage/stage-context.mjs";
import { validateSchema } from "../../../runtime/review/schema-validator.mjs";
import { openTask } from "../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../../runtime/task/workspace.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const HOST_PATH = /(?:\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}]+)/g;

function safeRecoveryError(error) {
  const code = typeof error?.code === "string" && error.code !== "" ? error.code : "WORKFLOWHUB_LOCAL_ERROR";
  const message = String(error?.message ?? error).replace(HOST_PATH, "<host-path-redacted>");
  return { code, message };
}

export function resolveTrustedReviewSubject(input) {
  if (!isAbsolute(input.task_path ?? "")) throw new TypeError("task_path must be an absolute TaskHandle path");
  const taskId = input.task_id ?? input.taskId;
  const projectName = input.project_name ?? input.projectName;
  const stage = input.stage;
  if (input.source_root !== undefined || input.sourceRoot !== undefined) {
    throw new TypeError("source_root is forbidden; Workspace comes from accepted make-decision facts");
  }
  if (input.runner_root !== undefined || input.runnerRoot !== undefined) {
    throw new TypeError("runner_root is forbidden; runner identity comes from the authenticated TaskHandle manifest");
  }
  openTask(input.task_path, projectName, taskId);
  let context = bootstrapStage(stage, {
    mode: "sidecar",
    taskPath: input.task_path,
    projectName,
    taskId,
    runnerRoot: RUNNER_ROOT,
  });
  if (stage === "make-decision") {
    const workspace = openCurrentTaskWorkspace(context.task);
    return {
      taskId,
      task: context.task,
      kernel: context.kernel,
      workspace,
    };
  }
  const workspace = assertWorkspace(context.workspace);
  return {
    taskId,
    task: context.task,
    kernel: context.kernel,
    workspace,
  };
}

function providerClient(stage = null, reviewTrack = null, reviewKind = null) {
  const thirdReview = loadTrustedThirdReviewConfig({ requestedStage: stage, requestedTrack: reviewTrack, requestedReviewKind: reviewKind });
  return { thirdReview, client: new ReviewProviderClient({ command: thirdReview.command, config: thirdReview.config }) };
}

const RETIRED_RECOVERY_FIELDS = ["previous_result_ref", "previousResultRef", "review_round", "reviewRound", "review_delta", "reviewDelta", "request_id", "requestId", "prior_attempt_refs", "priorAttemptRefs", "dispatch_sequence", "dispatchSequence"];
/** One WorkflowHub call. Provider recovery and lifecycle belong to 3rd-review. */

const REVIEW_RESULT_REF = /^quality\/reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const REVIEW_ATTEMPT_REF = /^quality\/reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/;
const SINGLE_ROUND_ADVICE_STAGES = new Set(["make-decision", "build-spec", "build-plan"]);

function publishReviewFactOrThrow(args) {
  try {
    return publishStageReviewFact(args);
  } catch (error) {
    // Preserve the immutable review refs when the stage-fact write fails. The
    // recovery envelope must not turn a real review into an untraceable local
    // unavailable result.
    error.reviewResult = args.result;
    throw error;
  }
}

function reviewIdentityMatches(value, { taskId, stage, reviewTrack = null, reviewKind = null, phaseId = null } = {}) {
  if (!value || typeof value !== "object" || value.task_id !== taskId || value.stage !== stage) return false;
  if ((value.review_track ?? null) !== reviewTrack || (value.review_kind ?? null) !== reviewKind) return false;
  if ((value.phase_id ?? null) !== phaseId) return false;
  const expectedSubjectKind = phaseId === null ? "worktree" : "phase";
  if (value.subject_kind !== expectedSubjectKind) return false;
  const expectedScope = stage === "build-code" ? (phaseId === null ? "integration" : "phase") : null;
  return (value.review_scope ?? null) === expectedScope;
}

function canonicalReviewEnvelope({ task, taskId, stage, reviewTrack, reviewKind, ref, value } = {}) {
  const attemptRef = value.attempt_ref;
  return {
    status: "available",
    attempt_ref: attemptRef,
    result_ref: ref,
    report_ref: value.report_ref ?? null,
    snapshot_tree: value.snapshot_tree,
    material_id: value.material_id,
    runtime_ids: {},
    subject_kind: value.subject_kind,
    phase_id: value.phase_id ?? null,
    review_scope: value.review_scope ?? null,
    base_tree: value.base_tree,
    candidate_tree: value.candidate_tree,
    ...(reviewKind ? { review_kind: reviewKind } : {}),
  };
}

/**
 * Early-stage review surfaces are advice-only and single-round. Once a
 * semantic result exists for this task/review surface, return that immutable
 * fact instead of starting another broker request. Build-code and verify-code
 * stay freshness-bound; their callers own current-snapshot review behavior.
 */
export function findExistingOrdinaryReview({ task, taskId, stage, reviewTrack = null, reviewKind = null, phaseId = null } = {}) {
  if (!SINGLE_ROUND_ADVICE_STAGES.has(stage) || reviewKind !== null || !task || typeof task.readRecord !== "function") return null;
  const resultRefs = typeof task.listCanonicalReviewResultRefs === "function"
    ? task.listCanonicalReviewResultRefs()
    : [];
  for (const ref of [...resultRefs].sort().reverse()) {
    try {
      const value = JSON.parse(task.readRecord(ref));
      if (!reviewIdentityMatches(value, { taskId, stage, reviewTrack, reviewKind, phaseId })) continue;
      if (typeof value.attempt_ref !== "string") continue;
      const attempt = JSON.parse(task.readRecord(value.attempt_ref));
      validateSchema("attempt", attempt);
      if (attempt.terminal_status !== "semantic" || attempt.error !== null
          || !reviewIdentityMatches(attempt, { taskId, stage, reviewTrack, reviewKind, phaseId })) continue;
      validateSchema("result", value);
      return canonicalReviewEnvelope({ task, taskId, stage, reviewTrack, reviewKind, ref, value });
    } catch { /* Ignore stale or malformed historical records. */ }
  }
  return null;
}

export function publishStageReviewFact({ trusted, stage, reviewKind, result }) {
  // The broker result is the review fact.  Bind it to the vNext stage quality
  // predicate at the same write boundary so a direct wh-review invocation
  // cannot leave an immutable result that stage-runtime status/close cannot
  // discover.  Mini-task reviews are deliberately excluded: they have their
  // own acceptance-evidence contract and must not masquerade as verify-code.
  if (stage !== "verify-code" || reviewKind !== null) return null;
  if (!new Set(["available", "unavailable"]).has(result?.status)) {
    throw new Error("verify-code review status must be available or unavailable");
  }
  const currentSnapshot = typeof trusted.kernel.currentVNextSnapshot === "function"
    ? trusted.kernel.currentVNextSnapshot()
    : null;
  const currentMaterialRevision = typeof trusted.kernel.currentVNextMaterialRevision === "function"
    ? trusted.kernel.currentVNextMaterialRevision()
    : null;
  if (!/^revision-[a-f0-9]{64}$/.test(currentMaterialRevision ?? "")) {
    throw new Error("verify-code review cannot authenticate the current material revision");
  }
  if (typeof result.snapshotTree !== "string" || !currentSnapshot?.tree || result.snapshotTree !== currentSnapshot.tree) {
    throw new Error("verify-code review result is stale before quality-fact publication");
  }
  if (result.subjectKind !== "worktree" || result.phaseId !== null || result.reviewScope !== null) {
    throw new Error("verify-code quality fact requires a worktree-scoped final review");
  }
  if (typeof result.materialId !== "string" || !/^[a-f0-9]{64}$/.test(result.materialId)) {
    throw new Error("verify-code review result is missing material identity");
  }
  const evidenceRef = result.status === "available" ? result.resultRef : result.attemptRef;
  const expectedRefPattern = result.status === "available" ? REVIEW_RESULT_REF : REVIEW_ATTEMPT_REF;
  if (typeof evidenceRef !== "string" || !expectedRefPattern.test(evidenceRef)) {
    throw new Error("verify-code review did not return a canonical quality review reference");
  }
  let evidence;
  let evidenceRaw;
  try {
    evidenceRaw = trusted.task.readRecord(evidenceRef);
    evidence = JSON.parse(evidenceRaw);
  } catch {
    throw new Error("verify-code review evidence is missing or invalid JSON");
  }
  validateSchema(result.status === "available" ? "result" : "attempt", evidence);
  if (evidence.task_id !== trusted.taskId || evidence.stage !== stage || evidence.subject_kind !== "worktree"
    || evidence.phase_id !== null || evidence.review_scope !== null || evidence.snapshot_tree !== result.snapshotTree) {
    throw new Error("verify-code review evidence is not bound to the current task, stage, or snapshot");
  }
  if (evidence.material_id !== result.materialId) {
    throw new Error("verify-code review evidence is not bound to the returned material identity");
  }
  if (evidence.material_revision !== currentMaterialRevision) {
    throw new Error("verify-code review evidence is not bound to the current material revision");
  }
  if (result.status === "available") {
    if (evidence.attempt_ref !== result.attemptRef || (evidence.review_kind ?? null) !== reviewKind || evidence.terminal_status === "unavailable") {
      throw new Error("verify-code review result is not bound to the current review request");
    }
    if (typeof evidence.attempt_ref !== "string" || !REVIEW_ATTEMPT_REF.test(evidence.attempt_ref)) {
      throw new Error("verify-code review result does not reference a canonical attempt");
    }
    let attempt;
    try { attempt = JSON.parse(trusted.task.readRecord(evidence.attempt_ref)); }
    catch { throw new Error("verify-code review attempt is missing or invalid JSON"); }
    validateSchema("attempt", attempt);
    const attemptRefMatch = REVIEW_ATTEMPT_REF.exec(evidence.attempt_ref);
    if (attempt.task_id !== trusted.taskId || attempt.stage !== stage || attempt.subject_kind !== "worktree"
      || attempt.phase_id !== null || attempt.review_scope !== null || (attempt.review_kind ?? null) !== reviewKind
      || attempt.attempt_id !== attemptRefMatch?.[1]
      || attempt.snapshot_tree !== result.snapshotTree || attempt.terminal_status !== "semantic" || attempt.error !== null) {
      throw new Error("verify-code review result is not bound to a semantic terminal attempt");
    }
  } else if (evidence.terminal_status !== "unavailable") {
    throw new Error("verify-code unavailable fact requires an unavailable terminal attempt");
  } else if ((evidence.review_kind ?? null) !== reviewKind || evidence.attempt_id !== REVIEW_ATTEMPT_REF.exec(evidenceRef)?.[1]) {
    throw new Error("verify-code unavailable attempt is not bound to the current review request");
  }
  const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
  // wh-review owns broker-provenance review bytes. It returns a narrow fact
  // intent for stage-runtime to consume; it never writes current quality.
  return Object.freeze({
    schema_version: "workflowhub-quality-fact-intent.v1",
    stage,
    kind: "review",
    status: result.status === "available" ? "recorded" : "unavailable",
    // verify-code's canonical code_review belongs to dsh-code-review. Keep
    // this broker result under the existing advisory subject so it cannot
    // compete with the completion fact while its provenance remains intact.
    subject: "independent_review",
    material_id: result.materialId,
    material_revision: currentMaterialRevision,
    evidence: [{ ref: evidenceRef, sha256: evidenceHash, evidence_type: "review_result" }],
  });
}

export async function runReviewRecovery(input, { runRound = runReviewRound, sameSourceFallback = null } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review recovery input is required");
  if (typeof runRound !== "function") throw new TypeError("runRound must be a function");
  if (sameSourceFallback !== null) throw new TypeError("sameSourceFallback is retired; 3rd-review owns heterologous recovery");
  const request = structuredClone(input);
  for (const field of RETIRED_RECOVERY_FIELDS) delete request[field];
  try {
    return await runRound(request);
  } catch (error) {
    const diagnostic = safeRecoveryError(error);
    const review = error?.reviewResult;
    return {
      status: "unavailable", recovery: "run_round_exception", error_code: diagnostic.code,
      error: diagnostic,
      ...(request.snapshot_tree === undefined ? {} : { snapshot_tree: request.snapshot_tree }),
      ...(request.material_id === undefined ? {} : { material_id: request.material_id }),
      ...(review?.attemptRef ? { attempt_ref: review.attemptRef } : {}),
      ...(review?.resultRef ? { result_ref: review.resultRef } : {}),
      ...(review?.reportRef ? { report_ref: review.reportRef } : {}),
    };
  }
}

export async function runReviewRound(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review request must be an object");
  for (const forbidden of ["path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is forbidden; use phase_id or the full worktree subject`);
  }
  for (const forbidden of ["providers", "provider_allowlist", "providerAllowlist"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is forbidden; providers come from the configured 3rd-review tier`);
  }
  for (const forbidden of ["workflow_run_id", "workflowRunId"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is unsupported; wh-review writes immutable quality facts`);
  }
  for (const forbidden of [
    "previous_result_ref", "previousResultRef", "review_round", "reviewRound", "review_delta", "reviewDelta",
    "request_id", "requestId", "prior_attempt_refs", "priorAttemptRefs", "dispatch_sequence", "dispatchSequence",
  ]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is retired; callers cannot select prior review state`);
  }
  if (input.review_scope !== undefined || input.reviewScope !== undefined) throw new TypeError("review_scope is derived from phase_id and cannot be supplied by a caller");
  for (const forbidden of ["review_delta", "response_ledger", "previous_review"]) {
    if (Object.prototype.hasOwnProperty.call(input.materials ?? {}, forbidden)) {
      throw new TypeError(`materials.${forbidden} is retired; provide the complete current review materials`);
    }
  }
  if (Object.prototype.hasOwnProperty.call(input.materials ?? {}, "scope_revision")) {
    throw new TypeError("materials.scope_revision is unsupported; update the current four materials and use the ordinary stage review");
  }
  if (input.format_correction_attempt_ref !== undefined || input.formatCorrectionAttemptRef !== undefined) {
    throw new TypeError("format correction is retired; invalid reviewer output is terminal unavailable evidence");
  }
  if (input.previous_runtime_ids !== undefined || input.previousRuntimeIds !== undefined) {
    throw new TypeError("runtime continuation is retired; review routing and reuse are runner-owned");
  }
  for (const [field, value] of [["task_path", input.task_path], ["project_name", input.project_name ?? input.projectName], ["task_id", input.task_id ?? input.taskId], ["stage", input.stage], ["host_provider", input.host_provider ?? input.hostProvider]]) {
    if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} is required`);
  }
  const reviewKind = input.review_kind ?? input.reviewKind ?? null;
  if (reviewKind !== null && !["mini_task.design", "mini_task.implementation"].includes(reviewKind)) throw new TypeError("review_kind is unsupported");
  const trusted = resolveTrustedReviewSubject(input); const { thirdReview, client } = providerClient(input.stage, input.review_track ?? input.reviewTrack ?? null, reviewKind);
  const hostProvider = input.host_provider ?? input.hostProvider;
  const stage = input.stage; const phaseId = input.phase_id ?? input.phaseId ?? null; const reviewTrack = input.review_track ?? input.reviewTrack ?? null;
  const materialRevision = stage === "verify-code" ? trusted.kernel.currentVNextMaterialRevision() : null;
  const route = resolveTrustedReviewRoute(thirdReview.whReview, stage, reviewTrack, reviewKind);
  if (route === null) {
    const result = await recordMissingRouteUnavailable({
      ...trusted,
      attachmentRoot: thirdReview.attachmentRoot,
      stage,
      phaseId,
      reviewTrack,
      reviewKind,
      materialRevision,
    });
    const qualityFactIntent = publishReviewFactOrThrow({ trusted, stage, reviewKind, result });
    return {
      status: result.status,
      attempt_ref: result.attemptRef,
      result_ref: result.resultRef,
      report_ref: result.reportRef,
      snapshot_tree: result.snapshotTree,
      material_id: result.materialId,
      material_revision: result.materialRevision,
      runtime_ids: result.runtimeIds,
      subject_kind: result.subjectKind,
      phase_id: result.phaseId,
      review_scope: result.reviewScope,
      base_tree: result.baseTree,
      candidate_tree: result.candidateTree,
      ...(qualityFactIntent ? { review_fact_intent: qualityFactIntent } : {}),
      error_code: "REVIEW_ROUTE_UNAVAILABLE",
      ...(result.errorCode ? { error_code: result.errorCode } : {}),
      ...(reviewKind ? { review_kind: reviewKind } : {}),
      ...(thirdReview.routeWarnings?.length ? { config_warnings: thirdReview.routeWarnings } : {}),
    };
  }
  const existing = findExistingOrdinaryReview({ task: trusted.task, taskId: trusted.taskId, stage, reviewTrack, reviewKind, phaseId });
  if (existing) return existing;
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials)) throw new TypeError("materials is required");
  const profileSet = "initial";
  const selection = selectTrustedReviewProviderSelection(thirdReview.config, hostProvider, route, profileSet);
  const reviewPolicy = {
    source: "wh_review.v2",
    mode: route.mode,
    minimum_heterologous: route.minimum_heterologous ?? 1,
    requested_profiles: selection.requestedProfiles,
    ...(selection.requestedProfileSpecs.length ? { requested_profile_specs: selection.requestedProfileSpecs } : {}),
    eligible_profiles: selection.eligibleProfiles,
    same_source_exclusions: selection.sameSourceExcluded,
    effective_profiles: selection.effectiveProfiles,
  };
  const result = await runReview({
    ...trusted, attachmentRoot: thirdReview.attachmentRoot,
    stage, phaseId, reviewTrack, reviewKind, uiScope: input.ui_scope === true,
    materialRevision,
    materials: input.materials ?? {},
    current_receipts: input.current_receipts ?? input.currentReceipts ?? {},
    directionSelection: input.direction_selection ?? input.directionSelection ?? null,
    hostProvider,
    // The broker owns adapter-level exclusion. Keep the complete configured
    // group here so it can attest SAME_SOURCE rather than trusting a local
    // pre-filter; policy still records the eligible heterologous quorum.
    providers: selection.providers, reviewPolicy, providerClient: client,
  });
  const qualityFactIntent = publishReviewFactOrThrow({ trusted, stage, reviewKind, result });
  let errorCode = null;
  if (result.status === "unavailable" && result.attemptRef) {
    const attempt = JSON.parse(trusted.task.readRecord(result.attemptRef));
    errorCode = attempt.error?.code ?? null;
  }
  return {
    status: result.status,
    attempt_ref: result.attemptRef,
    result_ref: result.resultRef,
    report_ref: result.reportRef,
    snapshot_tree: result.snapshotTree, material_id: result.materialId, material_revision: result.materialRevision, runtime_ids: result.runtimeIds,
    subject_kind: result.subjectKind, phase_id: result.phaseId, review_scope: result.reviewScope, base_tree: result.baseTree, candidate_tree: result.candidateTree,
    ...(qualityFactIntent ? { review_fact_intent: qualityFactIntent } : {}),
    ...(errorCode ? { error_code: errorCode } : {}),
    ...(reviewKind ? { review_kind: reviewKind } : {}),
    ...(thirdReview.routeWarnings?.length ? { config_warnings: thirdReview.routeWarnings } : {}),
  };
}

export function verifyFinalReview(input) {
  const trusted = resolveTrustedReviewSubject(input);
  const result = verifyFinal({
    ...trusted, attachmentRoot: providerClient(input.stage, input.review_track ?? input.reviewTrack ?? null).thirdReview.attachmentRoot, resultRef: input.result_ref ?? input.resultRef,
    taskId: trusted.taskId, stage: input.stage, reviewTrack: input.review_track ?? input.reviewTrack,
  });
  return { status: result.status, snapshot_tree: result.snapshotTree };
}

export function doctorThirdReviewConfig() {
  const trusted = loadTrustedThirdReviewConfig();
  validateAllWhReviewRoutes(trusted.whReview);
  return { status: "ok", config: trusted.config, stages: Object.keys(trusted.whReview?.stages ?? {}) };
}

async function main() {
  const command = process.argv[2];
  if (!new Set(["run", "verify-final", "doctor"]).has(command)) throw new Error("usage: wh-review-cli.mjs <run|verify-final|doctor> [input.json]");
  if (command === "doctor") {
    process.stdout.write(`${JSON.stringify(doctorThirdReviewConfig())}\n`);
    return;
  }
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "run" ? await runReviewRecovery(input) : verifyFinalReview(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

// The mini-task runner imports this module from an eval/stdin entrypoint, where
// Node does not define process.argv[1]. Keep module loading side-effect free.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
}
