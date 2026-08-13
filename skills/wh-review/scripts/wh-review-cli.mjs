#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { recordMissingRouteUnavailable, runReview, verifyFinal } from "./review-runner.mjs";
import { loadTrustedThirdReviewConfig, resolveTrustedReviewRoute, selectTrustedReviewProviderSelection, validateAllWhReviewRoutes } from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace } from "../../../runtime/stage/stage-context.mjs";
import { openTask } from "../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../../runtime/task/workspace.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

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

const RETRYABLE_UNAVAILABLE_CODES = new Set([
  "AUTH", "PROVIDER_UNAVAILABLE", "PROCESS_DEAD", "PROCESS_EXIT_NONZERO",
  "RATE_LIMITED", "TIMEOUT", "TRANSPORT_FAILURE", "PROVIDER_NO_TERMINAL_RESULT", "REVIEW_ROUTE_UNAVAILABLE",
  "OUTPUT_INVALID", "PROVIDER_OUTPUT_INVALID", "PUBLIC_RESULT_INVALID", "PROTOCOL_INCOMPATIBLE",
  "PROFILE_MISMATCH", "SAME_SOURCE", "UNKNOWN",
]);
const MATERIAL_UNAVAILABLE_CODES = new Set(["MATERIAL_INCOMPLETE", "MATERIAL_FORBIDDEN"]);
const RETIRED_RECOVERY_FIELDS = ["previous_result_ref", "previousResultRef", "review_round", "reviewRound", "review_delta", "reviewDelta", "request_id", "requestId", "prior_attempt_refs", "priorAttemptRefs", "dispatch_sequence", "dispatchSequence"];
const MAX_RECOVERY_REQUESTS = 3;
const MAX_PUBLIC_REQUESTS = 1 + MAX_RECOVERY_REQUESTS;

function recoveryErrorCode(result) { return result?.error_code ?? result?.error?.code ?? "PROVIDER_UNAVAILABLE"; }
function frozenIdentity(input, result = null) {
  const value = result === null ? input : result;
  return {
    snapshot_tree: value?.snapshot_tree ?? value?.snapshotTree ?? null,
    material_id: value?.material_id ?? value?.materialId ?? null,
  };
}
function identityMissing(identity) {
  return identity.snapshot_tree === null || identity.material_id === null;
}

function fallbackReasonFor(errorCodes) {
  const codes = [...new Set(errorCodes.filter((code) => typeof code === "string" && code !== ""))];
  if (codes.length === 1 && codes[0] === "REVIEW_ROUTE_UNAVAILABLE") {
    return "review_route_unavailable_after_public_requests";
  }
  if (codes.length > 0 && codes.every((code) => RETRYABLE_UNAVAILABLE_CODES.has(code))) {
    return "heterologous_provider_unavailable_after_public_requests";
  }
  return "heterologous_review_unavailable_after_public_requests";
}

function uniqueAttemptRefs(attemptRefs) {
  return [...new Set(attemptRefs.filter((ref) => typeof ref === "string" && ref !== ""))];
}

function sameSourceResult({ attemptRefs, identity, fallbackResult = null, reason = null, errorCodes = [], recoveryErrors = [] }) {
  return {
    ...(fallbackResult && typeof fallbackResult === "object" ? fallbackResult : {}),
    status: "incomplete", recovery: "same_source_fallback", source: "same_source", attempt_refs: uniqueAttemptRefs(attemptRefs),
    snapshot_tree: identity.snapshot_tree, material_id: identity.material_id, fallback_required: fallbackResult === null,
    fallback_reason: reason ?? fallbackReasonFor(errorCodes),
    ...(recoveryErrors.length > 0 ? { recovery_errors: recoveryErrors.map((item) => ({ ...item })) } : {}),
  };
}

/** Ephemeral outer composition; each public attempt remains immutable. */
export async function runReviewRecovery(input, { runRound = runReviewRound, sameSourceFallback = null } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review recovery input is required");
  if (typeof runRound !== "function") throw new TypeError("runRound must be a function");
  if (sameSourceFallback !== null && typeof sameSourceFallback !== "function") throw new TypeError("sameSourceFallback must be a function");
  const attemptRefs = [];
  const errorCodes = [];
  const recoveryErrors = [];
  let identity = frozenIdentity(input, null);
  for (let index = 0; index < MAX_PUBLIC_REQUESTS; index += 1) {
    const request = structuredClone(input);
    for (const field of RETIRED_RECOVERY_FIELDS) delete request[field];
    let result;
    try {
      result = await runRound(request);
    } catch (error) {
      const code = typeof error?.code === "string" && error.code !== "" ? error.code : "PROVIDER_NO_TERMINAL_RESULT";
      recoveryErrors.push({ code, message: String(error?.message ?? error) });
      result = {
        status: "unavailable",
        recovery: "run_round_exception",
        error_code: code,
        error: { code, message: String(error?.message ?? error) },
        snapshot_tree: identity.snapshot_tree ?? frozenIdentity(input).snapshot_tree,
        material_id: identity.material_id ?? frozenIdentity(input).material_id,
      };
    }
    const code = result?.status === "unavailable" ? recoveryErrorCode(result) : null;
    if (code) errorCodes.push(code);
    const currentIdentity = frozenIdentity(input, result);
    if (identity.snapshot_tree === null) identity = { ...identity, snapshot_tree: currentIdentity.snapshot_tree };
    if (identity.material_id === null) identity = { ...identity, material_id: currentIdentity.material_id };
    if ((identity.snapshot_tree !== null && currentIdentity.snapshot_tree !== null && identity.snapshot_tree !== currentIdentity.snapshot_tree)
      || (identity.material_id !== null && currentIdentity.material_id !== null && identity.material_id !== currentIdentity.material_id)) {
      return { status: "incomplete", recovery: "snapshot_or_material_drift", attempt_refs: uniqueAttemptRefs([...attemptRefs, ...(result?.attempt_ref ? [result.attempt_ref] : [])]), snapshot_tree: currentIdentity.snapshot_tree, material_id: currentIdentity.material_id };
    }
    if (result?.attempt_ref) attemptRefs.push(result.attempt_ref);
    if ((identity.snapshot_tree !== null && currentIdentity.snapshot_tree === null)
      || (identity.material_id !== null && currentIdentity.material_id === null)) {
      return { status: "incomplete", recovery: "snapshot_or_material_identity_unavailable", attempt_refs: uniqueAttemptRefs(attemptRefs), snapshot_tree: identity.snapshot_tree, material_id: identity.material_id };
    }
    if (identityMissing(identity)) {
      return { status: "incomplete", recovery: "snapshot_or_material_identity_unavailable", attempt_refs: uniqueAttemptRefs(attemptRefs), snapshot_tree: identity.snapshot_tree, material_id: identity.material_id };
    }
    if (result?.status !== "unavailable") return result;
    if (MATERIAL_UNAVAILABLE_CODES.has(code) || !RETRYABLE_UNAVAILABLE_CODES.has(code)) return result;
  }
  const fallbackInput = structuredClone(input);
  for (const field of RETIRED_RECOVERY_FIELDS) delete fallbackInput[field];
  fallbackInput.same_source = true;
  fallbackInput.independent_context = true;
  fallbackInput.recovery = { kind: "same_source_fallback", attempt_refs: uniqueAttemptRefs(attemptRefs), snapshot_tree: identity.snapshot_tree, material_id: identity.material_id };
  if (sameSourceFallback === null) return sameSourceResult({ attemptRefs, identity, errorCodes, recoveryErrors });
  try {
    const fallback = await sameSourceFallback(fallbackInput);
    if (!fallback || fallback.source !== "same_source" || fallback.independent_context !== true) return sameSourceResult({ attemptRefs, identity, reason: "same_source_fallback_contract_invalid", errorCodes, recoveryErrors });
    return sameSourceResult({ attemptRefs, identity, fallbackResult: fallback, errorCodes, recoveryErrors });
  } catch (error) {
    return sameSourceResult({ attemptRefs, identity, reason: `same_source_fallback_unavailable:${error?.code ?? "ERROR"}`, errorCodes, recoveryErrors });
  }
}

export async function runReviewRound(input) {
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
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is retired; each wh-review call starts one fresh broker public run`);
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
    throw new TypeError("runtime continuation is retired; each review starts a new broker public request");
  }
  const reviewKind = input.review_kind ?? input.reviewKind ?? null;
  if (reviewKind !== null && !["mini_task.design", "mini_task.implementation"].includes(reviewKind)) throw new TypeError("review_kind is unsupported");
  const trusted = resolveTrustedReviewSubject(input); const { thirdReview, client } = providerClient(input.stage, input.review_track ?? input.reviewTrack ?? null, reviewKind);
  const hostProvider = input.host_provider ?? input.hostProvider;
  const stage = input.stage; const phaseId = input.phase_id ?? input.phaseId ?? null; const reviewTrack = input.review_track ?? input.reviewTrack ?? null;
  const route = resolveTrustedReviewRoute(thirdReview.whReview, stage, reviewTrack, reviewKind);
  if (route === null) {
    const result = await recordMissingRouteUnavailable({
      ...trusted,
      attachmentRoot: thirdReview.attachmentRoot,
      stage,
      phaseId,
      reviewTrack,
      reviewKind,
    });
    return {
      status: result.status,
      attempt_ref: result.attemptRef,
      result_ref: result.resultRef,
      report_ref: result.reportRef,
      snapshot_tree: result.snapshotTree,
      material_id: result.materialId,
      runtime_ids: result.runtimeIds,
      subject_kind: result.subjectKind,
      phase_id: result.phaseId,
      review_scope: result.reviewScope,
      base_tree: result.baseTree,
      candidate_tree: result.candidateTree,
      error_code: "REVIEW_ROUTE_UNAVAILABLE",
      ...(result.errorCode ? { error_code: result.errorCode } : {}),
      ...(reviewKind ? { review_kind: reviewKind } : {}),
      ...(thirdReview.routeWarnings?.length ? { config_warnings: thirdReview.routeWarnings } : {}),
    };
  }
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
    materials: input.materials ?? {},
    current_receipts: input.current_receipts ?? input.currentReceipts ?? {},
    hostProvider,
    // The broker owns adapter-level exclusion. Keep the complete configured
    // group here so it can attest SAME_SOURCE rather than trusting a local
    // pre-filter; policy still records the eligible heterologous quorum.
    providers: selection.providers, reviewPolicy, providerClient: client,
  });
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
    snapshot_tree: result.snapshotTree, material_id: result.materialId, runtime_ids: result.runtimeIds,
    subject_kind: result.subjectKind, phase_id: result.phaseId, review_scope: result.reviewScope, base_tree: result.baseTree, candidate_tree: result.candidateTree,
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
