import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";

import { artifactReference, assertArtifactDir } from "./artifact-dir.mjs";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";
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
function expectedNames(stage) {
  const names = STAGE_ARTIFACTS[stage];
  if (!names) throw new TypeError(`stage does not produce a Git checkpoint: ${stage}`);
  return names;
}

function authenticatedBase(repoRoot, plan, baseCommit, baseTree) {
  if (!/^[a-f0-9]{40}$/i.test(baseCommit ?? "") || !/^[a-f0-9]{40}$/i.test(baseTree ?? "")) throw new Error("authenticated checkpoint base commit/tree required");
  if (plan.parent_commit !== baseCommit) throw new Error("checkpoint parent differs from authenticated upstream base");
  git(repoRoot, ["cat-file", "-e", `${baseCommit}^{commit}`]);
  git(repoRoot, ["cat-file", "-e", `${baseTree}^{tree}`]);
}

function overlayTree(repoRoot, baseTree, paths) {
  const index = resolve(tmpdir(), `workflowhub-checkpoint-${randomUUID()}.index`);
  const env = { GIT_INDEX_FILE: index };
  try {
    git(repoRoot, ["read-tree", baseTree], { env });
    git(repoRoot, ["add", "--", ...paths], { env });
    return String(git(repoRoot, ["write-tree"], { env })).trim();
  } finally { rmSync(index, { force: true }); }
}

export function overlayCheckpointArtifacts({ repoRoot, baseTree, artifacts } = {}) {
  if (!/^[a-f0-9]{40}$/i.test(baseTree ?? "")) throw new Error("base tree required");
  if (!Array.isArray(artifacts) || artifacts.length === 0) throw new Error("checkpoint artifacts required");
  const index = resolve(tmpdir(), `workflowhub-checkpoint-${randomUUID()}.index`);
  const env = { GIT_INDEX_FILE: index };
  try {
    git(repoRoot, ["read-tree", baseTree], { env });
    for (const artifact of artifacts) {
      if (!artifact || typeof artifact.path !== "string" || !/^[a-f0-9]{40}$/i.test(artifact.blob_oid ?? "")) throw new Error("checkpoint artifact path/blob required");
      git(repoRoot, ["update-index", "--add", "--cacheinfo", `100644,${artifact.blob_oid},${artifact.path}`], { env });
    }
    return String(git(repoRoot, ["write-tree"], { env })).trim();
  } finally { rmSync(index, { force: true }); }
}

export function assertGitCheckpoint(value) {
  if (!value || typeof value !== "object" || !CHECKPOINTS.has(value)) throw new TypeError("authentic GitCheckpoint capability required");
  return value;
}

export function assertGitCheckpointPlan(value) {
  if (!value || typeof value !== "object" || !CHECKPOINT_PLANS.has(value)) throw new TypeError("authentic GitCheckpointPlan capability required");
  return value;
}

export function verifyGitCheckpointPlan({ workspace, artifacts, task, plan, baseCommit, baseTree, baselineRebindHash } = {}) {
  const safeWorkspace = assertWorkspace(workspace); const safeArtifacts = assertArtifactDir(artifacts); const safeTask = assertTaskHandle(task);
  if (!plan || typeof plan !== "object" || Array.isArray(plan) || plan.schema_version !== "git-checkpoint-plan.v1" || !expectedNames(plan.stage)) throw new Error("checkpoint plan shape invalid");
  const safePlan = plan;
  if (safeArtifacts.worktreeRoot !== safeWorkspace.worktreeRoot) throw new Error("ArtifactDir is not bound to Workspace");
  if (baselineRebindHash !== undefined && safePlan.baseline_rebind_hash !== baselineRebindHash) throw new Error("checkpoint plan baseline rebind authorization hash mismatch");
  if (safePlan.baseline_rebind_hash !== undefined && !/^[a-f0-9]{64}$/.test(safePlan.baseline_rebind_hash)) throw new Error("checkpoint plan baseline_rebind_hash invalid");
  const payload = { schema_version: safePlan.schema_version, stage: safePlan.stage, parent_commit: safePlan.parent_commit, artifacts: safePlan.artifacts, ...(safePlan.baseline_rebind_hash === undefined ? {} : { baseline_rebind_hash: safePlan.baseline_rebind_hash }) };
  if (safePlan.plan_hash !== sha256(`${JSON.stringify(payload)}\n`)) throw new Error("checkpoint plan hash mismatch");
  authenticatedBase(safeWorkspace.worktreeRoot, safePlan, baseCommit, baseTree);
  for (const [index, name] of expectedNames(safePlan.stage).entries()) {
    const content = Buffer.from(safeArtifacts.read(name)); const blob = String(git(safeWorkspace.worktreeRoot, ["hash-object", "--no-filters", safeArtifacts.path(name)])).trim();
    const record = safePlan.artifacts[index];
    if (record?.path !== safeArtifacts.reference(name) || record.content_hash !== sha256(content) || record.blob_oid !== blob) throw new Error(`artifact differs from checkpoint plan: ${name}`);
  }
  const paths = expectedNames(safePlan.stage).map((name) => relative(safeWorkspace.worktreeRoot, safeArtifacts.path(name)));
  const expectedTree = overlayTree(safeWorkspace.worktreeRoot, baseTree, paths);
  if (captureGitWorktreeSnapshot(safeWorkspace.worktreeRoot).tree !== expectedTree) throw new Error("checkpoint Workspace differs from authenticated upstream tree plus declared artifacts");
  CHECKPOINT_PLANS.add(safePlan);
  return safePlan;
}

// Checkpoints are read-only historical facts. Verification is integrity-only:
// git ref -> commit -> tree -> blob must match the recorded checkpoint. Live
// working-tree artifacts are deliberately NOT compared here: materials may be
// revised after acceptance, and drift is handled by material revisions plus
// freshness evaluation of quality facts at formal publication (fail-closed),
// not by turning historical reads into work permits. The `artifacts` parameter
// is still accepted for caller compatibility, but is intentionally ignored:
// all production callers must use `verifyGitCheckpointPlan` when they need a
// live-material check before publishing a new checkpoint.
export function verifyGitCheckpoint({ repoRoot, checkpoint, projectName, taskId, stage, artifacts } = {}) {
  // Keep the legacy argument in the public shape without allowing it to
  // silently reintroduce the old historical-permit behavior.
  void artifacts;
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
  }
  return checkpoint;
}

export function createGitCheckpoint({ workspace, artifacts, task, stage, baseCommit, baseTree, baselineRebindHash } = {}) {
  const safeWorkspace = assertWorkspace(workspace);
  const safeArtifacts = assertArtifactDir(artifacts);
  const safeTask = assertTaskHandle(task);
  if (safeArtifacts.worktreeRoot !== safeWorkspace.worktreeRoot) throw new Error("ArtifactDir is not bound to Workspace");
  const names = expectedNames(stage);
  const repoRoot = safeWorkspace.worktreeRoot;
  authenticatedBase(repoRoot, { parent_commit: baseCommit }, baseCommit, baseTree);
  const artifactRecords = names.map((name) => {
    const path = safeArtifacts.reference(name);
    const content = Buffer.from(safeArtifacts.read(name));
    return { path, blob_oid: String(git(repoRoot, ["hash-object", "--no-filters", safeArtifacts.path(name)])).trim(), content_hash: sha256(content) };
  });
  if (baselineRebindHash !== undefined && !/^[a-f0-9]{64}$/.test(baselineRebindHash)) throw new Error("checkpoint baseline rebind authorization hash invalid");
  const payload = { schema_version: "git-checkpoint-plan.v1", stage, parent_commit: baseCommit, artifacts: artifactRecords, ...(baselineRebindHash === undefined ? {} : { baseline_rebind_hash: baselineRebindHash }) };
  const plan = { ...payload, plan_hash: sha256(`${JSON.stringify(payload)}\n`) };
  CHECKPOINT_PLANS.add(plan);
  return Object.freeze(plan);
}

export function materializeGitCheckpoint({ workspace, artifacts, task, plan, publishRef, baseCommit, baseTree, baselineRebindHash } = {}) {
  const safeWorkspace = assertWorkspace(workspace);
  const safeArtifacts = assertArtifactDir(artifacts);
  const safeTask = assertTaskHandle(task);
  const safePlan = verifyGitCheckpointPlan({ workspace: safeWorkspace, artifacts: safeArtifacts, task: safeTask, plan, baseCommit, baseTree, baselineRebindHash });
  const stage = safePlan.stage;
  const names = expectedNames(stage);
  const repoRoot = safeWorkspace.worktreeRoot;
  const finalRef = `${checkpointPrefix(safeTask, stage)}/plan-${safePlan.plan_hash}`;
  if (safeArtifacts.worktreeRoot !== repoRoot) throw new Error("ArtifactDir is not bound to Workspace");
  const paths = names.map((name) => relative(repoRoot, safeArtifacts.path(name)));
  const parent = safePlan.parent_commit;
  const tree = overlayTree(repoRoot, baseTree, paths);
  if (captureGitWorktreeSnapshot(repoRoot).tree !== tree) throw new Error("checkpoint Workspace changed during materialization");
  let existing;
  try { existing = String(git(repoRoot, ["rev-parse", "--verify", finalRef])).trim(); } catch {}
  if (existing) {
    const existingTree = String(git(repoRoot, ["show", "-s", "--format=%T", existing])).trim();
    const existingParents = String(git(repoRoot, ["show", "-s", "--format=%P", existing])).trim();
    if (existingTree !== tree || existingParents !== parent) throw new Error("checkpoint ref conflicts with another integration baseline");
    const checkpoint = checkpointFromCommit(repoRoot, safeTask, stage, finalRef, existing);
    verifyGitCheckpoint({ repoRoot, checkpoint, projectName: safeTask.identity.projectName, taskId: safeTask.identity.taskId, stage, artifacts: safeArtifacts });
    CHECKPOINTS.add(checkpoint);
    return Object.freeze(checkpoint);
  }
  const commit = String(git(repoRoot, ["commit-tree", tree, "-p", parent, "-m", `workflowhub checkpoint ${safeTask.identity.projectName}/${safeTask.identity.taskId}/${stage}`], {
    env: { GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local", GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local" },
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
