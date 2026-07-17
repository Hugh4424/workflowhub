import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";

const DEFAULT_SCHEMA_ID = "https://workflowhub.dev/schemas/task-snapshot.v1.schema.json";
const GIT_OID = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function git(root, args, { env, input, encoding = "utf8" } = {}) {
  return execFileSync("git", args, {
    cwd: root,
    env: env ? { ...process.env, ...env } : process.env,
    input,
    encoding,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
}

function statusEntries(root) {
  return String(git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]))
    .split("\0")
    .filter(Boolean)
    .sort();
}

function blobReferences(root, treeOid, baselineCommit) {
  const paths = String(git(root, ["diff", "--name-only", "-z", baselineCommit, treeOid]))
    .split("\0")
    .filter(Boolean)
    .sort();
  return paths.flatMap((path) => {
    let oid;
    try {
      oid = String(git(root, ["rev-parse", `${treeOid}:${path}`])).trim();
    } catch {
      return [];
    }
    const content = git(root, ["cat-file", "blob", oid], { encoding: null });
    return [{ ref: `git-blob:${oid}`, sha256: hash(content) }];
  });
}

/**
 * Capture an immutable task snapshot using Git trees/blobs only. The temporary
 * index never changes the caller's index, HEAD, or refs.
 */
export function captureTaskSnapshotV1Sync({
  schemaId = DEFAULT_SCHEMA_ID,
  taskId,
  workspaceRoot,
  baselineCommit,
  capturedAt = new Date().toISOString(),
  injectCrash,
} = {}) {
  if (schemaId !== DEFAULT_SCHEMA_ID) throw new TypeError("task snapshot schema_id is not supported");
  if (typeof taskId !== "string" || taskId.trim() === "") throw new TypeError("taskId is required");
  if (typeof workspaceRoot !== "string" || workspaceRoot.trim() === "") throw new TypeError("workspaceRoot is required");
  const root = resolve(workspaceRoot);
  const baseline = baselineCommit ?? String(git(root, ["rev-parse", "HEAD"])).trim();
  if (!GIT_OID.test(baseline)) throw new TypeError("baselineCommit must be a Git object id");
  const treeOid = captureGitWorktreeSnapshot(root, { injectCrash }).tree;
  const diff = git(root, ["diff", "--binary", "--no-ext-diff", baseline, treeOid], { encoding: null });
  const diffHash = hash(diff);
  return Object.freeze({
    schema_id: schemaId,
    schema_version: "1.0.0",
    task_id: taskId,
    baseline_commit: baseline,
    tree_oid: treeOid,
    diff_ref: `git-diff:sha256:${diffHash}`,
    diff_hash: diffHash,
    blob_refs: Object.freeze(blobReferences(root, treeOid, baseline)),
    worktree_status: Object.freeze(statusEntries(root)),
    captured_at: capturedAt,
  });
}

export async function captureTaskSnapshotV1(options) {
  return captureTaskSnapshotV1Sync(options);
}

export function validateTaskSnapshotV1(snapshot, { taskId } = {}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) throw new TypeError("task snapshot must be an object");
  const allowed = new Set(["schema_id", "schema_version", "task_id", "baseline_commit", "tree_oid", "diff_ref", "diff_hash", "blob_refs", "worktree_status", "captured_at"]);
  if (Object.keys(snapshot).some((key) => !allowed.has(key))) throw new Error("task snapshot contains unknown fields");
  if (snapshot.schema_id !== DEFAULT_SCHEMA_ID || snapshot.schema_version !== "1.0.0") throw new Error("task snapshot schema mismatch");
  if (typeof snapshot.task_id !== "string" || (taskId && snapshot.task_id !== taskId)) throw new Error("task snapshot identity mismatch");
  if (!GIT_OID.test(snapshot.baseline_commit ?? "") || !GIT_OID.test(snapshot.tree_oid ?? "")) throw new Error("task snapshot Git object id invalid");
  if (!SHA256.test(snapshot.diff_hash ?? "") || snapshot.diff_ref !== `git-diff:sha256:${snapshot.diff_hash}`) throw new Error("task snapshot diff binding invalid");
  if (!Array.isArray(snapshot.blob_refs) || snapshot.blob_refs.some((item) => !item || !/^git-blob:[a-f0-9]{40}$/.test(item.ref ?? "") || !SHA256.test(item.sha256 ?? "") || Object.keys(item).some((key) => !["ref", "sha256"].includes(key)))) throw new Error("task snapshot blob_refs invalid");
  if (!Array.isArray(snapshot.worktree_status) || snapshot.worktree_status.some((item) => typeof item !== "string")) throw new Error("task snapshot worktree_status invalid");
  if (!Number.isFinite(Date.parse(snapshot.captured_at))) throw new Error("task snapshot captured_at invalid");
  return snapshot;
}

/** Legacy checkpoint commits are migration evidence only, never authority. */
export function readLegacyCheckpoint({ workspaceRoot, commit } = {}) {
  if (typeof workspaceRoot !== "string" || !GIT_OID.test(commit ?? "")) throw new TypeError("legacy checkpoint workspaceRoot and commit are required");
  const root = resolve(workspaceRoot);
  const commitOid = String(git(root, ["rev-parse", `${commit}^{commit}`])).trim();
  const treeOid = String(git(root, ["show", "-s", "--format=%T", commitOid])).trim();
  return Object.freeze({ commit_oid: commitOid, tree_oid: treeOid, read_only: true, authorizes_operation: false });
}
