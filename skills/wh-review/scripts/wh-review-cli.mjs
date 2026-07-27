#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { runReview, verifyFinal } from "./review-runner.mjs";
import { capturePhaseReviewSource } from "./review-source.mjs";
import { buildClassificationManifest, buildNonGateReviewResponseRecord, buildReviewChain, deriveChangeClassification, selectReviewRound } from "./review-controller.mjs";
import { loadTrustedThirdReviewConfig, resolveTrustedReviewRoute, selectTrustedReviewProviderSelection } from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace, prepareMakeDecisionWorkspace } from "../../../core/stage-context.mjs";
import { openTask } from "../../../core/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../../../core/git-worktree-snapshot.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
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

function reviewBindingInvalidated(task, ref) {
  const raw = task.readRecord(ref);
  const resultHash = createHash("sha256").update(raw).digest("hex");
  let record;
  try { record = JSON.parse(task.readRecord(`reviews/binding-invalidations/${resultHash}.json`)); }
  catch (error) {
    if (error?.code === "ENOENT") return false;
    throw new Error(`review binding invalidation cannot be read: ${error.message}`);
  }
  if (record?.schema_version !== "review-binding-invalidation.v1"
      || record.status !== "binding_invalid" || record.result_ref !== ref
      || record.result_hash !== resultHash) {
    throw new Error("review binding invalidation does not bind the canonical result");
  }
  return true;
}

export function reviewFlowIdentity({ kernel, assertedWorkflowRunId, stage, reviewTrack = null, phaseId = null, snapshotTree = null, revisionRef = null, adjudicationCorrectionRef = null } = {}) {
  const identity = kernel.deriveReviewFlowIdentity({
    stage,
    review_track: reviewTrack,
    subject_kind: phaseId === null ? "worktree" : "phase",
    phase_id: phaseId,
    review_scope: stage === "build-code" ? (phaseId === null ? "integration" : "phase") : null,
    ...(stage === "build-code" && phaseId !== null ? { snapshot_tree: snapshotTree } : {}),
    ...(revisionRef === null ? {} : { revision_ref: revisionRef }),
    ...(adjudicationCorrectionRef === null ? {} : { adjudication_correction_ref: adjudicationCorrectionRef }),
  });
  if (assertedWorkflowRunId !== undefined && assertedWorkflowRunId !== identity.workflow_run_id) {
    throw new Error("workflow_run_id assertion does not match authenticated stage lineage");
  }
  return identity;
}

export function resolveReviewFlowHead({ task, kernel, identity, previousResultRef } = {}) {
  const flow = kernel.readReviewFlow(identity);
  const headRef = flow?.head_result_ref ?? null;
  if (flow === null && previousResultRef !== undefined && identity.snapshot_tree !== undefined) {
    const prior = previousResult(task, previousResultRef, identity.stage, identity.review_track);
    if (!sameReviewSubject(prior, identity) || prior.snapshot_tree === identity.snapshot_tree) {
      throw new Error("review flow CAS failed: previous_result_ref is stale or belongs to another flow");
    }
    return { flow: null, prior };
  }
  if (previousResultRef !== undefined && previousResultRef !== headRef) {
    throw new Error("review flow CAS failed: previous_result_ref is stale or belongs to another flow");
  }
  if (headRef !== null && reviewBindingInvalidated(task, headRef)) return { flow, prior: null };
  return {
    flow,
    prior: headRef === null ? null : previousResult(task, headRef, identity.stage, identity.review_track),
  };
}

function sameReviewSubject(left, right) {
  return left?.task_id === right?.task_id && left?.stage === right?.stage && left?.review_track === right?.review_track &&
    left?.subject_kind === right?.subject_kind && left?.phase_id === right?.phase_id;
}

function chainRoot(result) {
  return RESULT_REF.test(result?.review_chain?.root_result_ref ?? "")
    ? result.review_chain.root_result_ref
    : result?.result_ref;
}

function readPriorResult(task, ref, subject) {
  const result = previousResult(task, ref, subject.stage, subject.review_track);
  if (!sameReviewSubject(result, subject)) throw new Error("review chain parent does not match the current review subject");
  return result;
}

export function closureFailureCount(task, stage, reviewTrack, prior) {
  const root = chainRoot(prior);
  if (!RESULT_REF.test(root ?? "")) throw new TypeError("prior review has no canonical chain root");
  let count = 0;
  for (const ref of task.listCanonicalReviewResultRefs()) {
    try {
      const result = JSON.parse(task.readRecord(ref));
      if (!sameReviewSubject(result, prior) || result?.stage !== stage || result.review_track !== reviewTrack || result.verdict !== "revise_required") continue;
      const attempt = JSON.parse(task.readRecord(result.attempt_ref));
      if (attempt?.review_policy?.round === "closure" && result.review_chain?.root_result_ref === root) count += 1;
    } catch { throw new Error("canonical prior review evidence is unreadable"); }
  }
  return count;
}

/** Only a semantic structural result consumes the one-shot non-code budget. */
export function structuralFullAlreadyRecorded(task, prior) {
  const root = chainRoot(prior);
  if (!RESULT_REF.test(root ?? "")) throw new TypeError("prior review has no canonical chain root");
  const refs = task.listCanonicalReviewResultRefs();
  for (const ref of refs) {
    let record;
    try { record = JSON.parse(task.readRecord(ref)); }
    catch { throw new Error("canonical structural review audit is unreadable"); }
    if (!sameReviewSubject(record, prior) || record?.review_chain?.round !== "full") continue;
    if (record.review_chain.root_result_ref === root) return true;
  }
  return false;
}

export function selectCanonicalReviewRound({ task, stage, route, previousResult = null, ledger = null, closureFailures = 0, currentSnapshotTree = null, flow = null, changeClassification = null } = {}) {
  const freshBuildCodePhase = stage === "build-code"
    && previousResult?.subject_kind === "phase"
    && currentSnapshotTree !== null
    && previousResult.snapshot_tree !== currentSnapshotTree
    && flow === null;
  return selectReviewRound({
    stage, route,
    previousResult: freshBuildCodePhase ? null : previousResult,
    ledger: freshBuildCodePhase ? null : ledger,
    closureFailures, currentSnapshotTree, changeClassification,
    structuralFullAlreadyRecorded: route?.mode === "full_on_structural_rework" && previousResult !== null
      ? (flow === null ? structuralFullAlreadyRecorded(task, previousResult) : flow.structural_full_reviews > 0)
      : false,
  });
}

function closurePriorReview(result) {
  return {
    result_ref: result.result_ref,
    snapshot_tree: result.snapshot_tree,
    actionable_findings: (result.adjudication?.clusters ?? []).filter(({ disposition }) => disposition === "actionable").map((finding) => ({
      id: finding.id, severity: finding.severity, path: finding.path, ...(finding.line ? { line: finding.line } : {}),
      issue: finding.issue, root_cause: finding.root_cause, recommendation: finding.recommendation,
    })),
  };
}

/**
 * The response ledger is controller/audit evidence, not fresh-review material.
 * Keeping this projection here makes it impossible for a full second review to
 * accidentally become a closure packet just because the caller supplied a
 * ledger to explain the preceding repair.
 */
export function providerVisibleMaterialsForRound({ materials = {}, round, previousResult = null } = {}) {
  const { response_ledger: responseLedger, ...providerMaterials } = materials;
  if (round !== "closure") return providerMaterials;
  return {
    ...providerMaterials,
    response_ledger: responseLedger,
    previous_review: closurePriorReview(previousResult),
  };
}

function frozenSnapshotTree(trusted, phaseId = null) {
  if (phaseId !== null) {
    const workspace = assertWorkspace(trusted.workspace);
    // Phase capture now keeps its complete diff in a caller-owned external
    // directory. This preflight only needs the frozen tree identity, so release
    // that temporary capture immediately rather than leaving a private diff
    // artifact behind for the full review path to create again.
    const source = capturePhaseReviewSource({
      sourceRoot: workspace.worktreeRoot,
      task: trusted.task,
      phaseId,
      reviewDataRoot: trusted.task.taskPath,
    });
    try {
      return source.snapshotTree;
    } finally {
      source.dispose();
    }
  }
  const snapshot = trusted.workspace
    ? captureGitWorktreeSnapshot(assertWorkspace(trusted.workspace).worktreeRoot)
    : trusted.candidateWorkspace?.captureSnapshot?.();
  if (!OID.test(snapshot?.tree ?? "")) throw new Error("authenticated Workspace snapshot is unavailable");
  return snapshot.tree;
}

function frozenChangeClassification(previousResult, currentSnapshotTree, materials) {
  if (previousResult === null) return null;
  return deriveChangeClassification({
    previousSnapshotTree: previousResult.snapshot_tree,
    currentSnapshotTree,
    previousManifest: previousResult.classification_manifest ?? null,
    currentManifest: buildClassificationManifest(materials ?? {}),
  });
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

function providerClient() {
  const thirdReview = loadTrustedThirdReviewConfig();
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
  const formatCorrectionAttemptRef = input.format_correction_attempt_ref ?? input.formatCorrectionAttemptRef ?? null;
  if (formatCorrection && typeof formatCorrectionAttemptRef !== "string") throw new TypeError("format-correct requires format_correction_attempt_ref");
  if (!formatCorrection && formatCorrectionAttemptRef !== null) throw new TypeError("format_correction_attempt_ref is only valid for format-correct");
  if (formatCorrection && (input.previous_result_ref !== undefined || input.previousResultRef !== undefined || input.materials?.response_ledger !== undefined)) {
    throw new TypeError("format-correct cannot select a follow-up review chain");
  }
  const trusted = resolveTrustedReviewSubject(input); const { thirdReview, client } = providerClient();
  const hostProvider = input.host_provider ?? input.hostProvider;
  const stage = input.stage; const phaseId = input.phase_id ?? input.phaseId ?? null; const reviewTrack = input.review_track ?? input.reviewTrack ?? null;
  const route = resolveTrustedReviewRoute(thirdReview.whReview, stage, reviewTrack);
  const workflowRunId = input.workflow_run_id ?? input.workflowRunId;
  const revisionRef = input.revision_ref ?? input.revisionRef ?? null;
  const adjudicationCorrectionRef = input.adjudication_correction_ref ?? input.adjudicationCorrectionRef ?? null;
  // Phase flow identity is snapshot-scoped. Resolve the trusted frozen Phase
  // tree before deriving the CAS key; callers cannot supply this identity.
  const currentSnapshotTree = frozenSnapshotTree(trusted, phaseId);
  const flowIdentity = reviewFlowIdentity({
    kernel: trusted.kernel, assertedWorkflowRunId: workflowRunId, stage, reviewTrack, phaseId,
    snapshotTree: currentSnapshotTree, revisionRef, adjudicationCorrectionRef,
  });
  const suppliedPreviousRef = Object.prototype.hasOwnProperty.call(input, "previous_result_ref")
    ? input.previous_result_ref
    : Object.prototype.hasOwnProperty.call(input, "previousResultRef") ? input.previousResultRef : undefined;
  return trusted.kernel.withReviewFlowLock(flowIdentity, async () => {
  const { flow, prior } = resolveReviewFlowHead({
    task: trusted.task, kernel: trusted.kernel, identity: flowIdentity,
    previousResultRef: suppliedPreviousRef,
  });
  const flowHistory = trusted.kernel.readReviewFlowHistory(flowIdentity);
  if (stage === "build-code" && phaseId !== null && flow === null && prior !== null
      && input.materials?.response_ledger == null) {
    throw new Error("MATERIAL_INCOMPLETE: a new Phase snapshot requires previous_result_ref and response_ledger lineage");
  }
  if (formatCorrection && flow?.head_result_ref) throw new Error("REVIEW_CLOSED: format correction cannot replace a semantic review-flow head");
  // A Phase is immutable evidence. Controller identity must use that frozen
  // Phase tree rather than the live worktree, which can already contain the
  // repair that makes an interrupted review recoverable.
  if (adjudicationCorrectionRef !== null) {
    trusted.kernel.readBuildCodeAdjudicationCorrection(adjudicationCorrectionRef, {
      phaseId,
      snapshotTree: currentSnapshotTree,
    });
  }
  const machineChangeClassification = frozenChangeClassification(prior, currentSnapshotTree, input.materials);
  const suppliedLedger = input.materials?.response_ledger ?? null;
  const controllerLedger = suppliedLedger === null || machineChangeClassification === null
    ? suppliedLedger
    : { ...suppliedLedger, change_classification: machineChangeClassification };
  const control = selectCanonicalReviewRound({
    task: trusted.task, stage, route, previousResult: prior, ledger: controllerLedger,
    currentSnapshotTree, flow, changeClassification: machineChangeClassification,
    closureFailures: route?.mode === "adaptive" && prior !== null ? closureFailureCount(trusted.task, stage, reviewTrack, prior) : 0,
  });
  if (control.round === "none") {
    if (!new Set(["review_non_gate_recorded", "post_full_non_gate_recorded"]).has(control.reason)) {
      throw new Error(`REVIEW_CLOSED: ${control.reason}`);
    }
    const resolution = buildNonGateReviewResponseRecord({
      taskId: trusted.taskId, stage, reviewTrack, previousResult: prior,
      previousResultSha256: prior.result_sha256, ledger: controllerLedger,
      currentSnapshotTree,
    });
    const recorded = trusted.kernel.recordReviewResolution(flowIdentity, {
      expected_head_ref: flow?.head_result_ref ?? null,
      expected_event_ref: flow?.event_ref ?? null,
      resolution,
    });
    return {
      status: "recorded", verdict: null, resolution_ref: recorded.resolution_ref,
      previous_result_ref: prior.result_ref, snapshot_tree: currentSnapshotTree,
    };
  }
  const profileSet = control.round === "closure" ? "closure" : "initial";
  const selection = selectTrustedReviewProviderSelection(thirdReview.config, hostProvider, route, profileSet);
  const reviewPolicy = {
    source: route ? "wh_review.v2" : "legacy_3rd_review",
    mode: route?.mode ?? "legacy",
    minimum_heterologous: route ? (profileSet === "closure" ? 1 : (route.minimum_heterologous ?? 1)) : null,
    requested_profiles: selection.requestedProfiles,
    ...(selection.requestedProfileSpecs.length ? { requested_profile_specs: selection.requestedProfileSpecs } : {}),
    eligible_profiles: selection.eligibleProfiles,
    same_source_exclusions: selection.sameSourceExcluded,
    effective_profiles: selection.effectiveProfiles,
    round: control.round,
  };
  const reviewChain = buildReviewChain({
    previousResult: prior, ledger: controllerLedger,
    currentSnapshotTree, round: control.round,
  });
  const result = await runReview({
    ...trusted, attachmentRoot: thirdReview.attachmentRoot,
    stage, phaseId, reviewTrack, uiScope: input.ui_scope === true,
    // The ledger is controller/audit data. Full reviews must see a fresh packet
    // and stage-material validation forbids closure-only fields outside closure.
    materials: providerVisibleMaterialsForRound({
      materials: controllerLedger === null ? (input.materials ?? {}) : {
        ...(input.materials ?? {}), response_ledger: controllerLedger,
      }, round: control.round, previousResult: prior,
    }),
    // Binding proof stays outside provider-visible packet material. The runner
    // validates it only against the controller-derived chain hash.
    controlLedger: controllerLedger,
    hostProvider,
    // The broker owns adapter-level exclusion. Keep the complete configured
    // group here so it can attest SAME_SOURCE rather than trusting a local
    // pre-filter; policy still records the eligible heterologous quorum.
    providers: selection.providers, reviewPolicy, reviewRound: control.round, reviewChain,
    reuseUnavailable: true,
    claimedUnavailableAttemptRefs: flowHistory.provider_attempt_refs,
    previousRuntimeIds: input.previous_runtime_ids ?? input.previousRuntimeIds ?? {}, formatCorrectionAttemptRef, providerClient: client,
  });
  if (result.status === "semantic") {
    trusted.kernel.advanceReviewFlow(flowIdentity, {
      expected_head_ref: flow?.head_result_ref ?? null,
      expected_event_ref: flow?.event_ref ?? null,
      result_ref: result.resultRef,
    });
  } else {
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
  };
  });
}

export function verifyFinalReview(input) {
  const trusted = resolveTrustedReviewSubject(input);
  const result = verifyFinal({
    ...trusted, attachmentRoot: providerClient().thirdReview.attachmentRoot, resultRef: input.result_ref ?? input.resultRef,
    taskId: trusted.taskId, stage: input.stage, reviewTrack: input.review_track ?? input.reviewTrack,
  });
  return { status: result.status, snapshot_tree: result.snapshotTree };
}

async function main() {
  const command = process.argv[2];
  if (!new Set(["run", "format-correct", "verify-final", "adopt-legacy-root"]).has(command)) throw new Error("usage: wh-review-cli.mjs <run|format-correct|verify-final|adopt-legacy-root> [input.json]");
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
