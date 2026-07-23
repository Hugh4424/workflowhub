#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { runReview, verifyFinal } from "./review-runner.mjs";
import { buildNonGateReviewResponseRecord, buildReviewChain, selectReviewRound } from "./review-controller.mjs";
import { resolutionRef, writeReviewResolution } from "./review-result.mjs";
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

/** A structural follow-up is a one-shot chain event, including unavailable attempts. */
export function structuralFullAlreadyRecorded(task, prior) {
  const root = chainRoot(prior);
  if (!RESULT_REF.test(root ?? "")) throw new TypeError("prior review has no canonical chain root");
  const refs = [...task.listCanonicalReviewResultRefs(), ...task.listCanonicalReviewAttemptRefs()];
  for (const ref of refs) {
    let record;
    try { record = JSON.parse(task.readRecord(ref)); }
    catch { throw new Error("canonical structural review audit is unreadable"); }
    if (!sameReviewSubject(record, prior) || record?.review_chain?.round !== "full") continue;
    if (record.review_chain.root_result_ref === root) return true;
  }
  return false;
}

export function selectCanonicalReviewRound({ task, stage, route, previousResult = null, ledger = null, closureFailures = 0, currentSnapshotTree = null } = {}) {
  return selectReviewRound({
    stage, route, previousResult, ledger, closureFailures, currentSnapshotTree,
    structuralFullAlreadyRecorded: route?.mode === "full_on_structural_rework" && previousResult !== null
      ? structuralFullAlreadyRecorded(task, previousResult)
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

function frozenSnapshotTree(trusted) {
  const snapshot = trusted.workspace
    ? captureGitWorktreeSnapshot(assertWorkspace(trusted.workspace).worktreeRoot)
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
      candidateWorkspace: context.candidateWorkspace,
    };
  }
  const workspace = assertWorkspace(context.workspace);
  return {
    taskId,
    task: context.task,
    workspace,
  };
}

function providerClient() {
  const thirdReview = loadTrustedThirdReviewConfig();
  return { thirdReview, client: new ReviewProviderClient({ command: thirdReview.command, config: thirdReview.config }) };
}

export async function runReviewRound(input) {
  for (const forbidden of ["path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is forbidden; use phase_id or the full worktree subject`);
  }
  for (const forbidden of ["providers", "provider_allowlist", "providerAllowlist"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is forbidden; providers come from the configured 3rd-review tier`);
  }
  if (input.review_round !== undefined || input.reviewRound !== undefined) throw new TypeError("review_round is derived from canonical prior review evidence");
  const trusted = resolveTrustedReviewSubject(input); const { thirdReview, client } = providerClient();
  const hostProvider = input.host_provider ?? input.hostProvider;
  const stage = input.stage; const reviewTrack = input.review_track ?? input.reviewTrack ?? null;
  const route = resolveTrustedReviewRoute(thirdReview.whReview, stage, reviewTrack);
  const previousRef = input.previous_result_ref ?? input.previousResultRef ?? null;
  const prior = previousRef === null ? null : previousResult(trusted.task, previousRef, stage, reviewTrack);
  const currentSnapshotTree = frozenSnapshotTree(trusted);
  const control = selectCanonicalReviewRound({
    task: trusted.task, stage, route, previousResult: prior, ledger: input.materials?.response_ledger ?? null,
    currentSnapshotTree,
    closureFailures: route?.mode === "adaptive" && prior !== null ? closureFailureCount(trusted.task, stage, reviewTrack, prior) : 0,
  });
  if (control.round === "none") {
    if (control.reason !== "review_non_gate_recorded") throw new Error(`REVIEW_CLOSED: ${control.reason}`);
    const resolution = buildNonGateReviewResponseRecord({
      taskId: trusted.taskId, stage, reviewTrack, previousResult: prior,
      previousResultSha256: prior.result_sha256, ledger: input.materials?.response_ledger ?? null,
      currentSnapshotTree,
    });
    const ref = resolutionRef(resolution);
    writeReviewResolution(trusted.task, ref, resolution);
    return {
      status: "recorded", verdict: null, resolution_ref: ref,
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
    previousResult: prior, ledger: input.materials?.response_ledger ?? null,
    currentSnapshotTree, round: control.round,
  });
  const result = await runReview({
    ...trusted, attachmentRoot: thirdReview.attachmentRoot,
    stage, phaseId: input.phase_id ?? input.phaseId ?? null, reviewTrack, uiScope: input.ui_scope === true,
    // The ledger is controller/audit data. Full reviews must see a fresh packet
    // and stage-material validation forbids closure-only fields outside closure.
    materials: providerVisibleMaterialsForRound({
      materials: input.materials ?? {}, round: control.round, previousResult: prior,
    }),
    // Binding proof stays outside provider-visible packet material. The runner
    // validates it only against the controller-derived chain hash.
    controlLedger: input.materials?.response_ledger ?? null,
    hostProvider,
    // The broker owns adapter-level exclusion. Keep the complete configured
    // group here so it can attest SAME_SOURCE rather than trusting a local
    // pre-filter; policy still records the eligible heterologous quorum.
    providers: selection.providers, reviewPolicy, reviewRound: control.round, reviewChain,
    previousRuntimeIds: input.previous_runtime_ids ?? input.previousRuntimeIds ?? {}, providerClient: client,
  });
  return {
    status: result.status, verdict: result.verdict,
    attempt_ref: result.attemptRef,
    result_ref: result.resultRef,
    report_ref: result.reportRef,
    snapshot_tree: result.snapshotTree, material_id: result.materialId, runtime_ids: result.runtimeIds,
    subject_kind: result.subjectKind, phase_id: result.phaseId, base_tree: result.baseTree, candidate_tree: result.candidateTree,
  };
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
  if (!new Set(["run", "verify-final"]).has(command)) throw new Error("usage: wh-review-cli.mjs <run|verify-final> [input.json]");
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "run" ? await runReviewRound(input) : verifyFinalReview(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
