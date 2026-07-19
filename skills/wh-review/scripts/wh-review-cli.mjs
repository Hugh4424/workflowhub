#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { runReview, verifyFinal } from "./review-runner.mjs";
import { loadTrustedThirdReviewConfig } from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace, prepareMakeDecisionWorkspace } from "../../../core/stage-context.mjs";
import { openTask } from "../../../core/task-handle.mjs";

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
  const task = openTask(input.task_path, projectName, taskId);
  let context = bootstrapStage(stage, {
    mode: "sidecar",
    taskPath: input.task_path,
    projectName,
    taskId,
    ...(task.manifest.runner_root === undefined ? {} : { runnerRoot: task.manifest.runner_root }),
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
  const trusted = resolveTrustedReviewSubject(input); const { thirdReview, client } = providerClient();
  const result = await runReview({
    ...trusted, attachmentRoot: thirdReview.attachmentRoot,
    stage: input.stage, phaseId: input.phase_id ?? input.phaseId ?? null, reviewTrack: input.review_track ?? input.reviewTrack ?? null, uiScope: input.ui_scope === true,
    materials: input.materials, hostProvider: input.host_provider ?? input.hostProvider,
    providers: input.providers ?? input.provider_allowlist ?? input.providerAllowlist,
    previousRuntimeIds: input.previous_runtime_ids ?? input.previousRuntimeIds ?? {}, providerClient: client,
  });
  return {
    status: result.status, verdict: result.verdict,
    attempt_ref: result.attemptRef,
    result_ref: result.resultRef,
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
