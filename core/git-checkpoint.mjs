import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { artifactReference, assertArtifactDir } from "./artifact-dir.mjs";
import { assertTaskHandle } from "./task-handle.mjs";
import { assertWorkspace } from "./workspace.mjs";

const CHECKPOINT_PLANS = new WeakSet();
const STAGE_ARTIFACTS = Object.freeze({
  "build-spec": Object.freeze(["spec.md"]),
  "build-plan": Object.freeze(["plan.md", "tasks.md"]),
});

function git(cwd, args, { env, input, encoding = "utf8" } = {}) {
  try { return execFileSync("git", args, { cwd, env: env ? { ...process.env, ...env } : process.env, input, encoding, stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"] }); }
  catch (error) { throw new Error(`Git checkpoint command failed (${args.join(" ")}): ${error.stderr?.toString().trim() || error.message}`); }
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function expectedNames(stage) {
  const names = STAGE_ARTIFACTS[stage];
  if (!names) throw new TypeError(`stage does not produce a Git checkpoint: ${stage}`);
  return names;
}

export function assertGitCheckpointPlan(value) {
  if (!value || typeof value !== "object" || !CHECKPOINT_PLANS.has(value)) throw new TypeError("authentic GitCheckpointPlan capability required");
  return value;
}

export function verifyGitCheckpointPlan({ workspace, artifacts, task, plan } = {}) {
  const safeWorkspace = assertWorkspace(workspace); const safeArtifacts = assertArtifactDir(artifacts); const safeTask = assertTaskHandle(task);
  if (!plan || typeof plan !== "object" || Array.isArray(plan) || plan.schema_version !== "git-checkpoint-plan.v1" || !expectedNames(plan.stage)) throw new Error("checkpoint plan shape invalid");
  const safePlan = plan;
  if (safeArtifacts.worktreeRoot !== safeWorkspace.worktreeRoot) throw new Error("ArtifactDir is not bound to Workspace");
  const payload = { schema_version: safePlan.schema_version, stage: safePlan.stage, parent_commit: safePlan.parent_commit, artifacts: safePlan.artifacts };
  if (safePlan.plan_hash !== sha256(`${JSON.stringify(payload)}\n`)) throw new Error("checkpoint plan hash mismatch");
  for (const [index, name] of expectedNames(safePlan.stage).entries()) {
    const content = Buffer.from(safeArtifacts.read(name)); const blob = String(git(safeWorkspace.worktreeRoot, ["hash-object", "--no-filters", safeArtifacts.path(name)])).trim();
    const record = safePlan.artifacts[index];
    if (record?.path !== safeArtifacts.reference(name) || record.content_hash !== sha256(content) || record.blob_oid !== blob) throw new Error(`artifact differs from checkpoint plan: ${name}`);
  }
  CHECKPOINT_PLANS.add(safePlan);
  return safePlan;
}

export function verifyGitCheckpoint({ repoRoot, checkpoint, projectName, taskId, stage, artifacts } = {}) {
  const names = expectedNames(stage);
  const expectedPrefix = `refs/workflowhub/checkpoints/${projectName}/${taskId}/${stage}/plan-`;
  if (typeof checkpoint?.ref !== "string" || !checkpoint.ref.startsWith(expectedPrefix) || !/^refs\/workflowhub\/checkpoints\/[^/]+\/[^/]+\/(?:build-spec|build-plan)\/plan-[a-f0-9]{64}$/.test(checkpoint.ref)) throw new Error(`checkpoint ref mismatch: expected plan-bound ref under ${expectedPrefix}`);
  const commit = String(git(repoRoot, ["rev-parse", checkpoint.ref])).trim();
  if (commit !== checkpoint.commit_oid) throw new Error("checkpoint ref does not point to accepted commit");
  const tree = String(git(repoRoot, ["show", "-s", "--format=%T", commit])).trim();
  if (tree !== checkpoint.tree_oid) throw new Error("checkpoint tree_oid mismatch");
  if (!Array.isArray(checkpoint.artifacts) || checkpoint.artifacts.length !== names.length) throw new Error("checkpoint artifact set mismatch");
  const expectedPaths = names.map((name) => artifactReference(taskId, name));
  for (const path of expectedPaths) {
    const record = checkpoint.artifacts.find((item) => item?.path === path);
    if (!record) throw new Error(`checkpoint missing artifact: ${path}`);
    const blob = String(git(repoRoot, ["rev-parse", `${commit}:${path}`])).trim();
    if (record.blob_oid !== blob) throw new Error(`checkpoint blob_oid mismatch: ${path}`);
    const content = git(repoRoot, ["show", `${commit}:${path}`], { encoding: null });
    if (record.content_hash !== sha256(content)) throw new Error(`checkpoint content_hash mismatch: ${path}`);
    if (artifacts) {
      const live = Buffer.from(artifacts.read(names[expectedPaths.indexOf(path)]));
      if (!live.equals(content)) throw new Error(`live artifact differs from checkpoint: ${path}`);
    }
  }
  return checkpoint;
}

export function createGitCheckpoint({ workspace, artifacts, task, stage } = {}) {
  void workspace; void artifacts; void task; void stage;
  throw new Error("legacy Git checkpoints are read-only; capture a task-snapshot.v1 record");
}

export function materializeGitCheckpoint({ workspace, artifacts, task, plan, publishRef } = {}) {
  void workspace; void artifacts; void task; void plan; void publishRef;
  throw new Error("legacy Git checkpoints are read-only; materialization is forbidden");
}
