#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { runReview, verifyFinal } from "./review-runner.mjs";
import { buildIncrementalReviewDelta, selectReviewRound } from "./review-controller.mjs";
import { loadTrustedThirdReviewConfig, resolveTrustedReviewRoute, selectTrustedReviewProviderSelection, validateAllWhReviewRoutes } from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace, prepareMakeDecisionWorkspace } from "../../../runtime/stage/stage-context.mjs";
import { openTask } from "../../../runtime/task/task-handle.mjs";
import { captureExecutionSnapshot } from "../../../runtime/task/git-worktree-snapshot.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const RESULT_REF = /^quality\/reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const OID = /^[a-f0-9]{40,64}$/;

function previousResult(task, ref, stage, reviewTrack) {
  if (!RESULT_REF.test(ref ?? "")) throw new TypeError("previous_result_ref must be a canonical wh-review result ref");
  let result; let raw;
  try { raw = task.readRecord(ref); result = JSON.parse(raw); }
  catch (error) { throw new Error(`previous_result_ref cannot be read: ${error.message}`); }
  if (result?.version !== "wh-review-result.v1" || result.task_id !== task.identity.taskId || result.stage !== stage || result.review_track !== reviewTrack) {
    throw new Error("previous_result_ref does not match the current review subject");
  }
  return { ...result, result_ref: ref, result_sha256: createHash("sha256").update(raw).digest("hex") };
}

export function reviewFlowIdentity({ kernel, assertedWorkflowRunId, stage, reviewTrack = null, phaseId = null, snapshotTree = null } = {}) {
  const identity = kernel.deriveReviewFlowIdentity({
    stage,
    review_track: reviewTrack,
    subject_kind: phaseId === null ? "worktree" : "phase",
    phase_id: phaseId,
    review_scope: stage === "build-code" ? (phaseId === null ? "integration" : "phase") : null,
    ...(stage === "build-code" && snapshotTree !== null ? { snapshot_tree: snapshotTree } : {}),
  });
  if (assertedWorkflowRunId !== undefined && assertedWorkflowRunId !== identity.workflow_run_id) {
    throw new Error("workflow_run_id assertion does not match authenticated stage lineage");
  }
  return identity;
}

export function resolveReviewFlowHead({ task, kernel, identity, previousResultRef, currentSnapshotTree = null } = {}) {
  const replayMismatch = (message) => {
    const error = new Error(`REPLAY_MISMATCH: ${message}`);
    error.code = "REPLAY_MISMATCH";
    return error;
  };
  const flow = kernel.readReviewFlow(identity);
  const headRef = flow?.head_result_ref ?? null;
  const effectiveSnapshotTree = identity.snapshot_tree ?? currentSnapshotTree;
  if (flow === null && previousResultRef !== undefined && effectiveSnapshotTree !== null) {
    const prior = previousResult(task, previousResultRef, identity.stage, identity.review_track);
    if (!sameReviewSubject(prior, identity) || prior.snapshot_tree === effectiveSnapshotTree) {
      throw replayMismatch("review flow CAS failed: previous_result_ref is stale or belongs to another flow");
    }
    return { flow: null, prior };
  }
  if (previousResultRef !== undefined && previousResultRef !== headRef) {
    throw replayMismatch("review flow CAS failed: previous_result_ref is stale or belongs to another flow");
  }
  return {
    flow,
    prior: headRef === null ? null : previousResult(task, headRef, identity.stage, identity.review_track),
  };
}

function sameReviewSubject(left, right) {
  return left?.task_id === right?.task_id && left?.stage === right?.stage && left?.review_track === right?.review_track &&
    left?.subject_kind === right?.subject_kind && left?.phase_id === right?.phase_id;
}

export function reconcileMakeDecisionReviewProgress({ kernel, identity, flow } = {}) {
  if (identity?.stage !== "make-decision" || flow === null || flow === undefined) return flow;
  if (flow.event_kind === "provider_attempt") {
    return kernel.recordReviewAttempt(identity, {
      expected_head_ref: flow.head_result_ref ?? null,
      expected_event_ref: flow.event_ref,
      attempt_ref: flow.action_ref,
    });
  }
  if (flow.head_result_ref && flow.event_kind === "semantic_result") {
    return kernel.advanceReviewFlow(identity, {
      expected_head_ref: flow.head_result_ref,
      expected_event_ref: flow.event_ref,
      result_ref: flow.head_result_ref,
    });
  }
  return flow;
}

export function selectCanonicalReviewRound({ stage, route, previousResult = null, currentSnapshotTree = null, incrementalAvailable = false } = {}) {
  return selectReviewRound({ stage, route, previousResult, currentSnapshotTree, incrementalAvailable });
}

export function providerVisibleMaterialsForRound({ materials = {}, round, previousResult = null } = {}) {
  const { response_ledger: _responseLedger, previous_review: _previousReview, ...providerMaterials } = materials;
  return providerMaterials;
}

function frozenSnapshotTree(trusted, phaseId = null) {
  const snapshot = trusted.workspace
    ? captureExecutionSnapshot(assertWorkspace(trusted.workspace).worktreeRoot)
    : trusted.candidateWorkspace?.captureSnapshot?.();
  if (!OID.test(snapshot?.tree ?? "")) throw new Error("authenticated Workspace snapshot is unavailable");
  return snapshot.tree;
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
    context = prepareMakeDecisionWorkspace(context);
    return {
      taskId,
      task: context.task,
      kernel: context.kernel,
      candidateWorkspace: context.candidateWorkspace,
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

export function adoptLegacyReviewRoot(input) {
  if (input.workflow_run_id !== undefined || input.workflowRunId !== undefined) {
    throw new TypeError("workflow_run_id is forbidden; TaskKernel derives review-flow identity");
  }
  const allowed = new Set(["task_path", "project_name", "task_id", "stage", "result_ref"]);
  const unexpected = Object.keys(input).find((key) => !allowed.has(key));
  if (unexpected !== undefined) throw new TypeError(`legacy root adoption input has unknown property: ${unexpected}`);
  const trusted = resolveTrustedReviewSubject(input);
  let result;
  try { result = JSON.parse(trusted.task.readRecord(input.result_ref)); }
  catch (error) { throw new Error(`legacy review result cannot be read: ${error.message}`); }
  if (result.stage !== input.stage) throw new Error("legacy review result stage does not match the requested stage");
  return trusted.kernel.adoptLegacyReviewRoot({
    result_ref: input.result_ref,
  });
}

function providerClient(stage = null, reviewTrack = null) {
  const thirdReview = loadTrustedThirdReviewConfig({ requestedStage: stage, requestedTrack: reviewTrack });
  return { thirdReview, client: new ReviewProviderClient({ command: thirdReview.command, config: thirdReview.config }) };
}

export async function runReviewRound(input, { formatCorrection = false } = {}) {
  for (const forbidden of ["path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is forbidden; use phase_id or the full worktree subject`);
  }
  for (const forbidden of ["providers", "provider_allowlist", "providerAllowlist"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is forbidden; providers come from the configured 3rd-review tier`);
  }
  if (input.review_round !== undefined || input.reviewRound !== undefined) throw new TypeError("review_round is derived from canonical prior review evidence");
  if (input.review_scope !== undefined || input.reviewScope !== undefined) throw new TypeError("review_scope is derived from phase_id and cannot be supplied by a caller");
  if (input.materials?.review_delta !== undefined) throw new TypeError("materials.review_delta is runner-generated");
  const formatCorrectionAttemptRef = input.format_correction_attempt_ref ?? input.formatCorrectionAttemptRef ?? null;
  if (formatCorrection && typeof formatCorrectionAttemptRef !== "string") throw new TypeError("format-correct requires format_correction_attempt_ref");
  if (!formatCorrection && formatCorrectionAttemptRef !== null) throw new TypeError("format_correction_attempt_ref is only valid for format-correct");
  if (formatCorrection && (input.previous_result_ref !== undefined || input.previousResultRef !== undefined || input.materials?.response_ledger !== undefined)) {
    throw new TypeError("format-correct cannot select a follow-up review chain");
  }
  const trusted = resolveTrustedReviewSubject(input); const { thirdReview, client } = providerClient(input.stage, input.review_track ?? input.reviewTrack ?? null);
  const hostProvider = input.host_provider ?? input.hostProvider;
  const stage = input.stage; const phaseId = input.phase_id ?? input.phaseId ?? null; const reviewTrack = input.review_track ?? input.reviewTrack ?? null;
  const route = resolveTrustedReviewRoute(thirdReview.whReview, stage, reviewTrack);
  const workflowRunId = input.workflow_run_id ?? input.workflowRunId;
  const currentSnapshotTree = frozenSnapshotTree(trusted, phaseId);
  const qualityOnly = trusted.task.manifest.record_model === "vnext-single-write";
  const flowIdentity = qualityOnly ? null : reviewFlowIdentity({
    kernel: trusted.kernel, assertedWorkflowRunId: workflowRunId, stage, reviewTrack, phaseId,
    snapshotTree: currentSnapshotTree,
  });
  const suppliedPreviousRef = Object.prototype.hasOwnProperty.call(input, "previous_result_ref")
    ? input.previous_result_ref
    : Object.prototype.hasOwnProperty.call(input, "previousResultRef") ? input.previousResultRef : undefined;
  const executeReview = async () => {
  // vNext review is an immutable quality fact. It deliberately does not
  // create or consult the retired mutable review-flow control plane.
  if (!qualityOnly) trusted.kernel.assertReviewFlowReady(flowIdentity);
  const { flow, prior } = qualityOnly
    ? {
      flow: null,
      prior: suppliedPreviousRef === undefined ? null : previousResult(trusted.task, suppliedPreviousRef, stage, reviewTrack),
    }
    : resolveReviewFlowHead({
      task: trusted.task, kernel: trusted.kernel, identity: flowIdentity,
      previousResultRef: suppliedPreviousRef, currentSnapshotTree,
    });
  if (!qualityOnly) reconcileMakeDecisionReviewProgress({
    kernel: trusted.kernel,
    identity: flowIdentity,
    flow,
  });
  const flowHistory = qualityOnly ? { provider_attempt_refs: [] } : trusted.kernel.readReviewFlowHistory(flowIdentity);
  if (formatCorrection && flow?.head_result_ref) throw new Error("REVIEW_CLOSED: format correction cannot replace a semantic review-flow head");
  const incrementalDelta = buildIncrementalReviewDelta({
    stage,
    previousResult: prior,
    currentSnapshotTree,
    currentMaterials: input.materials ?? {},
  });
  const control = selectCanonicalReviewRound({
    stage,
    route,
    previousResult: prior,
    currentSnapshotTree,
    incrementalAvailable: incrementalDelta !== null,
  });
  if (control.round === "none") {
    throw new Error("REVIEW_CLOSED: current quality fact already recorded; use a changed snapshot");
  }
  const profileSet = "initial";
  const selection = selectTrustedReviewProviderSelection(thirdReview.config, hostProvider, route, profileSet);
  const reviewPolicy = {
    source: route ? "wh_review.v2" : "legacy_3rd_review",
    mode: route?.mode ?? "legacy",
    minimum_heterologous: route ? (route.minimum_heterologous ?? 1) : null,
    requested_profiles: selection.requestedProfiles,
    ...(selection.requestedProfileSpecs.length ? { requested_profile_specs: selection.requestedProfileSpecs } : {}),
    eligible_profiles: selection.eligibleProfiles,
    same_source_exclusions: selection.sameSourceExcluded,
    effective_profiles: selection.effectiveProfiles,
    round: control.round,
  };
  const result = await runReview({
    ...trusted, attachmentRoot: thirdReview.attachmentRoot,
    stage, phaseId, reviewTrack, uiScope: input.ui_scope === true,
    materials: providerVisibleMaterialsForRound({
      materials: {
        ...(input.materials ?? {}),
        ...(control.round === "incremental" ? { review_delta: incrementalDelta } : {}),
      },
      round: control.round, previousResult: prior,
    }),
    current_receipts: input.current_receipts ?? input.currentReceipts ?? {},
    hostProvider,
    // The broker owns adapter-level exclusion. Keep the complete configured
    // group here so it can attest SAME_SOURCE rather than trusting a local
    // pre-filter; policy still records the eligible heterologous quorum.
    providers: selection.providers, reviewPolicy, reviewRound: control.round,
    reuseUnavailable: true,
    claimedUnavailableAttemptRefs: flowHistory.provider_attempt_refs,
    previousRuntimeIds: input.previous_runtime_ids ?? input.previousRuntimeIds ?? {}, formatCorrectionAttemptRef, providerClient: client,
  });
  if (!qualityOnly && result.status === "semantic") {
    trusted.kernel.advanceReviewFlow(flowIdentity, {
      expected_head_ref: flow?.head_result_ref ?? null,
      expected_event_ref: flow?.event_ref ?? null,
      result_ref: result.resultRef,
    });
  } else if (!qualityOnly) {
    trusted.kernel.recordReviewAttempt(flowIdentity, {
      expected_head_ref: flow?.head_result_ref ?? null,
      expected_event_ref: flow?.event_ref ?? null,
      attempt_ref: result.attemptRef,
    });
  }
  return {
    status: result.status, verdict: result.verdict,
    attempt_ref: result.attemptRef,
    result_ref: result.resultRef,
    report_ref: result.reportRef,
    snapshot_tree: result.snapshotTree, material_id: result.materialId, runtime_ids: result.runtimeIds,
    subject_kind: result.subjectKind, phase_id: result.phaseId, review_scope: result.reviewScope, base_tree: result.baseTree, candidate_tree: result.candidateTree,
    ...(thirdReview.routeWarnings?.length ? { config_warnings: thirdReview.routeWarnings } : {}),
  };
  };
  return qualityOnly ? executeReview() : trusted.kernel.withReviewFlowLock(flowIdentity, executeReview);
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
  if (!new Set(["run", "format-correct", "verify-final", "adopt-legacy-root", "doctor"]).has(command)) throw new Error("usage: wh-review-cli.mjs <run|format-correct|verify-final|adopt-legacy-root|doctor> [input.json]");
  if (command === "doctor") {
    process.stdout.write(`${JSON.stringify(doctorThirdReviewConfig())}\n`);
    return;
  }
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "run"
    ? await runReviewRound(input)
    : command === "format-correct"
      ? await runReviewRound(input, { formatCorrection: true })
      : command === "verify-final"
        ? verifyFinalReview(input)
        : adoptLegacyReviewRoot(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
