#!/usr/bin/env node

/** V4-only CLI boundary. Workflows call run/reset; legacy prepare/execute paths are retired. */
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { BrokerClient } from "./broker-client.mjs";
import { ReviewRoundFacade } from "./review-round-facade.mjs";
import { loadTrustedThirdReviewConfig } from "./third-review-host-config.mjs";
import { assertSafeTaskId } from "./lib/safe-id.mjs";

const sourceOwnedFields = new Set([
  "source_revision", "sourceRevision", "unified_diff", "unifiedDiff", "diff_ref", "diffRef", "changed_files", "changedFiles",
  "diff_sha256", "diffSha256", "packet_hash", "packetHash", "manifest_hash", "manifestHash",
  "repository_root", "repositoryRoot", "changed_file_root", "changedFileRoot", "source_root", "sourceRoot",
  "source_snapshot", "sourceSnapshot",
]);

function rejectCallerSourceFields(value, scope) {
  const fields = Object.keys(value ?? {}).filter((field) => sourceOwnedFields.has(field));
  if (fields.length) throw new Error(`SOURCE_FIELDS_FORBIDDEN: ${scope} cannot provide ${fields.join(", ")}`);
}

function trustedTaskWorktree(input) {
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  if (!taskTrackingRoot) throw new TypeError("V4 review requires task_tracking_root");
  const taskId = input.task_id ?? input.taskId; assertSafeTaskId(taskId);
  const trackingRoot = realpathSync(taskTrackingRoot);
  const statePath = join(trackingRoot, taskId, "worktree.json");
  const stateStat = lstatSync(statePath);
  if (!stateStat.isFile() || stateStat.isSymbolicLink()) throw new Error("trusted task worktree.json must be a real regular file");
  let state;
  try { state = JSON.parse(readFileSync(statePath, "utf8")); }
  catch (error) { throw new Error(`trusted task worktree.json is invalid JSON: ${error.message}`); }
  if (!(isAbsolute(state?.target_repo_root ?? "") && isAbsolute(state?.worktree_root ?? "") && state.target_repo_root !== state.worktree_root && typeof state?.branch === "string" && /^workflowhub\/[a-z]+(?:-[a-z]+){1,2}$/.test(state.branch)
    && state.created_by_stage === "make-decision" && state.push_policy === "verify-code-only" && state.status === "active")) {
    throw new Error("trusted task worktree.json requires distinct active target_repo_root/worktree_root, workflowhub branch, created_by_stage, and push_policy");
  }
  const targetRepoRoot = realpathSync(state.target_repo_root);
  const sourceRoot = realpathSync(state.worktree_root);
  if (!lstatSync(targetRepoRoot).isDirectory() || !lstatSync(sourceRoot).isDirectory()) throw new Error("trusted task worktree roots must be directories");
  try {
    const targetGitRoot = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: targetRepoRoot, encoding: "utf8" })).trim());
    const gitRoot = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: sourceRoot, encoding: "utf8" })).trim());
    if (targetGitRoot !== targetRepoRoot || gitRoot !== sourceRoot) throw new Error("configured roots must be git worktree roots");
    const commonDir = (root) => {
      const value = String(execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" })).trim();
      return realpathSync(isAbsolute(value) ? value : resolve(root, value));
    };
    if (commonDir(targetRepoRoot) !== commonDir(sourceRoot)) throw new Error("target_repo_root and worktree_root must share a git common-dir");
    const registered = String(execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: targetRepoRoot, encoding: "utf8" })).split("\n").some((line) => line === `worktree ${sourceRoot}`);
    if (!registered) throw new Error("worktree_root is not registered by target_repo_root");
    if (String(execFileSync("git", ["branch", "--show-current"], { cwd: sourceRoot, encoding: "utf8" })).trim() !== state.branch) throw new Error("worktree_root branch does not match trusted worktree.json");
  } catch (error) { throw new Error(`trusted task worktree_root is not a git worktree: ${error.message}`); }
  return { taskTrackingRoot: trackingRoot, sourceRoot };
}

export async function runReviewRound(input) {
  rejectCallerSourceFields(input, "CLI input"); rejectCallerSourceFields(input.packet, "CLI packet");
  if (input.provider_capabilities !== undefined || input.providerCapabilities !== undefined || input.third_review?.provider_capabilities !== undefined) throw new Error("provider_capabilities are broker-owned and cannot be supplied by callers");
  if (input.attachment_delivery !== undefined || input.attachmentDelivery !== undefined) throw new Error("attachment_delivery comes only from stage-skill-plan resolution and cannot be supplied by callers");
  if (input.third_review !== undefined || input.attachment_root !== undefined || input.attachmentRoot !== undefined) throw new Error("third_review and attachment_root are host-configured and cannot be supplied by callers");
  const { taskTrackingRoot, sourceRoot } = trustedTaskWorktree(input);
  const thirdReview = loadTrustedThirdReviewConfig();
  const client = new BrokerClient({ command: thirdReview.command, config: thirdReview.config, attachmentRoot: thirdReview.attachmentRoot });
  const facade = new ReviewRoundFacade({ taskTrackingRoot, sourceRoot, broker: client });
  const prepared = await facade.prepare({
    task_id: input.task_id ?? input.taskId, stage: input.stage, review_track: input.review_track ?? input.reviewTrack,
    review_flow_id: input.review_flow_id ?? input.reviewFlowId, host_provider: input.host_provider ?? input.hostProvider,
    packet: input.packet, continuation: input.continuation === true, ui: input.ui === true,
    provider_allowlist: input.provider_allowlist,
    closure_evidence: input.closure_evidence, cross_stage_carryovers: input.cross_stage_carryovers,
    attachment_root: thirdReview.attachmentRoot,
  });
  const result = await facade.run(prepared);
  // `run()` owns private provider semantics so the host can disposition findings,
  // but the CLI's unpublished result is deliberately transport-only. A semantic
  // conclusion becomes public only after `publish()` has written its core receipt.
  const transport = {
    review_flow_id: result.intent.review_flow_id,
    continuation_eligible: result.continuation_eligible,
    blocked_by_human_confirmation: result.blocked_by_human_confirmation,
    provider_outcomes: result.provider_outcomes.map(({ provider, transport_status, packet_status, business_valid, cancel_source, diagnostic }) => ({
      provider, transport_status, packet_status, business_valid, cancel_source: cancel_source ?? null, diagnostic: diagnostic ?? null,
    })),
  };
  return input.dispositions ? { transport, ...facade.publish(result, input.dispositions) } : { transport };
}

export function verifyFinalReview(input) {
  rejectCallerSourceFields(input, "CLI input"); rejectCallerSourceFields(input.packet, "CLI packet");
  const { taskTrackingRoot, sourceRoot } = trustedTaskWorktree(input);
  const facade = new ReviewRoundFacade({ taskTrackingRoot, sourceRoot, broker: { run() { throw new Error("verify-final does not run broker"); } } });
  return facade.verifyFinal({ task_id: input.task_id ?? input.taskId, stage: input.stage, review_track: input.review_track ?? input.reviewTrack ?? null, review_flow_id: input.review_flow_id ?? input.reviewFlowId });
}

export function resetReviewFlow(input) {
  rejectCallerSourceFields(input, "CLI input"); rejectCallerSourceFields(input.packet, "CLI packet");
  const { taskTrackingRoot, sourceRoot } = trustedTaskWorktree(input);
  const facade = new ReviewRoundFacade({ taskTrackingRoot, sourceRoot, broker: { run() { throw new Error("reset does not run broker"); } } });
  return facade.reset({ task_id: input.task_id ?? input.taskId, stage: input.stage, review_track: input.review_track ?? input.reviewTrack ?? null, review_flow_id: input.review_flow_id ?? input.reviewFlowId, new_review_flow_id: input.new_review_flow_id ?? input.newReviewFlowId, reason: input.reason, human_approval_ref: input.human_approval_ref ?? input.humanApprovalRef });
}

export function recoverReviewProjections(input) {
  const { taskTrackingRoot, sourceRoot } = trustedTaskWorktree(input);
  const facade = new ReviewRoundFacade({ taskTrackingRoot, sourceRoot, broker: { run() { throw new Error("recover does not run broker"); } } });
  return facade.recover({ task_id: input.task_id ?? input.taskId });
}

async function main() {
  const command = process.argv[2];
  if (command !== "run" && command !== "reset" && command !== "recover" && command !== "verify-final") throw new Error("usage: wh-review-cli.mjs <run|reset|recover|verify-final> [input.json]");
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "run" ? await runReviewRound(input) : command === "reset" ? resetReviewFlow(input) : command === "recover" ? recoverReviewProjections(input) : verifyFinalReview(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
}
