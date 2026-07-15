import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";

import { artifactReference, assertArtifactDir } from "./artifact-dir.mjs";
import { assertTaskHandle } from "./task-handle.mjs";
import { assertWorkspace } from "./workspace.mjs";

const CHECKPOINTS = new WeakSet();
const CHECKPOINT_PLANS = new WeakSet();
const ZERO_OID = "0".repeat(40);
const STAGE_ARTIFACTS = Object.freeze({
  "build-spec": Object.freeze(["spec.md"]),
  "build-plan": Object.freeze(["plan.md", "tasks.md"]),
});

function git(cwd, args, { env, input, encoding = "utf8" } = {}) {
  try { return execFileSync("git", args, { cwd, env: env ? { ...process.env, ...env } : process.env, input, encoding, stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"] }); }
  catch (error) { throw new Error(`Git checkpoint command failed (${args.join(" ")}): ${error.stderr?.toString().trim() || error.message}`); }
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function checkpointPrefix(task, stage) { return `refs/workflowhub/checkpoints/${task.identity.projectName}/${task.identity.taskId}/${stage}`; }
function checkpointRefs(repoRoot, task, stage) {
  const prefix = checkpointPrefix(task, stage);
  const output = String(git(repoRoot, ["for-each-ref", "--format=%(refname)", `${prefix}/`]));
  return output.trim().split("\n").filter(Boolean).sort();
}
function expectedNames(stage) {
  const names = STAGE_ARTIFACTS[stage];
  if (!names) throw new TypeError(`stage does not produce a Git checkpoint: ${stage}`);
  return names;
}

export function assertGitCheckpoint(value) {
  if (!value || typeof value !== "object" || !CHECKPOINTS.has(value)) throw new TypeError("authentic GitCheckpoint capability required");
  return value;
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
  const safeWorkspace = assertWorkspace(workspace);
  const safeArtifacts = assertArtifactDir(artifacts);
  const safeTask = assertTaskHandle(task);
  if (safeArtifacts.worktreeRoot !== safeWorkspace.worktreeRoot) throw new Error("ArtifactDir is not bound to Workspace");
  const names = expectedNames(stage);
  const repoRoot = safeWorkspace.worktreeRoot;
  const priorRefs = checkpointRefs(repoRoot, safeTask, stage);
  const specRefs = stage === "build-plan" ? checkpointRefs(repoRoot, safeTask, "build-spec") : [];
  const parentRef = priorRefs.at(-1) ?? specRefs.at(-1) ?? "HEAD";
  const parentCommit = String(git(repoRoot, ["rev-parse", parentRef])).trim();
  const artifactRecords = names.map((name) => {
    const path = safeArtifacts.reference(name);
    const content = Buffer.from(safeArtifacts.read(name));
    return { path, blob_oid: String(git(repoRoot, ["hash-object", "--no-filters", safeArtifacts.path(name)])).trim(), content_hash: sha256(content) };
  });
  const payload = { schema_version: "git-checkpoint-plan.v1", stage, parent_commit: parentCommit, artifacts: artifactRecords };
  const plan = { ...payload, plan_hash: sha256(`${JSON.stringify(payload)}\n`) };
  CHECKPOINT_PLANS.add(plan);
  return Object.freeze(plan);
}

export function materializeGitCheckpoint({ workspace, artifacts, task, plan, publishRef } = {}) {
  const safeWorkspace = assertWorkspace(workspace);
  const safeArtifacts = assertArtifactDir(artifacts);
  const safeTask = assertTaskHandle(task);
  const safePlan = verifyGitCheckpointPlan({ workspace: safeWorkspace, artifacts: safeArtifacts, task: safeTask, plan });
  const stage = safePlan.stage;
  const names = expectedNames(stage);
  const repoRoot = safeWorkspace.worktreeRoot;
  const finalRef = `${checkpointPrefix(safeTask, stage)}/plan-${safePlan.plan_hash}`;
  if (safeArtifacts.worktreeRoot !== repoRoot) throw new Error("ArtifactDir is not bound to Workspace");
  const index = resolve(tmpdir(), `workflowhub-checkpoint-${randomUUID()}.index`);
  const env = { GIT_INDEX_FILE: index };
  const paths = names.map((name) => relative(repoRoot, safeArtifacts.path(name)));
  try {
    const parent = safePlan.parent_commit;
    git(repoRoot, ["read-tree", parent], { env });
    git(repoRoot, ["add", "--", ...paths], { env });
    const changed = String(git(repoRoot, ["diff", "--cached", "--name-only", parent], { env })).trim().split("\n").filter(Boolean).sort();
    if (JSON.stringify(changed) !== JSON.stringify([...paths].sort())) throw new Error(`checkpoint staged artifact set mismatch: ${changed.join(", ")}`);
    const tree = String(git(repoRoot, ["write-tree"], { env })).trim();
    const commit = String(git(repoRoot, ["commit-tree", tree, "-p", parent, "-m", `workflowhub checkpoint ${safeTask.identity.projectName}/${safeTask.identity.taskId}/${stage}`], {
      env: { ...env, GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local", GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local" },
    })).trim();
    const checkpoint = checkpointFromCommit(repoRoot, safeTask, stage, finalRef, commit);
    for (const [artifactIndex, record] of checkpoint.artifacts.entries()) {
      const name = names[artifactIndex];
      if (record.path !== safeArtifacts.reference(name) || sha256(Buffer.from(safeArtifacts.read(name))) !== record.content_hash) throw new Error(`artifact changed while creating checkpoint: ${record.path}`);
    }
    if (typeof publishRef !== "function") throw new TypeError("checkpoint ref publisher authority required");
    publishRef(finalRef, commit, ZERO_OID);
    verifyGitCheckpoint({ repoRoot, checkpoint, projectName: safeTask.identity.projectName, taskId: safeTask.identity.taskId, stage, artifacts: safeArtifacts });
    CHECKPOINTS.add(checkpoint);
    return Object.freeze(checkpoint);
  } finally { rmSync(index, { force: true }); }
}

function checkpointFromCommit(repoRoot, task, stage, ref, commit) {
  const tree = String(git(repoRoot, ["show", "-s", "--format=%T", commit])).trim();
  const artifacts = expectedNames(stage).map((name) => {
    const path = artifactReference(task.identity.taskId, name);
    const content = git(repoRoot, ["show", `${commit}:${path}`], { encoding: null });
    return { path, blob_oid: String(git(repoRoot, ["rev-parse", `${commit}:${path}`])).trim(), content_hash: sha256(content) };
  });
  return { ref, commit_oid: commit, tree_oid: tree, artifacts };
}
