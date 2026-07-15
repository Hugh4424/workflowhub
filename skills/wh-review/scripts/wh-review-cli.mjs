#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { runReview, verifyFinal } from "./review-runner.mjs";
import { relativeReviewRef } from "./review-result.mjs";
import { loadTrustedThirdReviewConfig } from "./third-review-host-config.mjs";
import { assertSafeTaskId } from "./lib/safe-id.mjs";

function trustedTaskWorktree(input) {
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  if (!isAbsolute(taskTrackingRoot ?? "")) throw new TypeError("task_tracking_root must be an absolute path");
  const taskId = input.task_id ?? input.taskId; assertSafeTaskId(taskId);
  const trackingRoot = realpathSync(taskTrackingRoot); const statePath = join(trackingRoot, taskId, "worktree.json");
  const stat = lstatSync(statePath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("trusted task worktree.json must be a regular file");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  if (!(isAbsolute(state?.target_repo_root ?? "") && isAbsolute(state?.worktree_root ?? "") && state.target_repo_root !== state.worktree_root && state.status === "active")) throw new Error("trusted task worktree.json requires distinct active target_repo_root and worktree_root");
  const targetRepoRoot = realpathSync(state.target_repo_root); const sourceRoot = realpathSync(state.worktree_root);
  const gitRoot = (root) => realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8" })).trim());
  const commonDir = (root) => { const value = String(execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" })).trim(); return realpathSync(isAbsolute(value) ? value : resolve(root, value)); };
  if (gitRoot(targetRepoRoot) !== targetRepoRoot || gitRoot(sourceRoot) !== sourceRoot || commonDir(targetRepoRoot) !== commonDir(sourceRoot)) throw new Error("trusted task roots must be registered worktrees of the same repository");
  return { taskId, reviewDataRoot: join(trackingRoot, taskId), sourceRoot, targetRepoRoot };
}

function providerClient() {
  const thirdReview = loadTrustedThirdReviewConfig();
  return { thirdReview, client: new ReviewProviderClient({ command: thirdReview.command, config: thirdReview.config }) };
}

export async function runReviewRound(input) {
  const trusted = trustedTaskWorktree(input); const { thirdReview, client } = providerClient();
  const result = await runReview({
    ...trusted, attachmentRoot: thirdReview.attachmentRoot,
    stage: input.stage, reviewTrack: input.review_track ?? input.reviewTrack ?? null, uiScope: input.ui_scope === true,
    materials: input.materials, hostProvider: input.host_provider ?? input.hostProvider,
    providers: input.providers ?? input.provider_allowlist ?? input.providerAllowlist,
    previousRuntimeIds: input.previous_runtime_ids ?? input.previousRuntimeIds ?? {}, providerClient: client,
  });
  return {
    status: result.status, verdict: result.verdict,
    attempt_ref: relativeReviewRef(trusted.reviewDataRoot, result.attemptPath),
    result_ref: result.resultPath ? relativeReviewRef(trusted.reviewDataRoot, result.resultPath) : null,
    snapshot_tree: result.snapshotTree, material_id: result.materialId, runtime_ids: result.runtimeIds,
  };
}

export function verifyFinalReview(input) {
  const trusted = trustedTaskWorktree(input);
  const result = verifyFinal({
    ...trusted, resultPath: input.result_ref ?? input.resultRef,
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
