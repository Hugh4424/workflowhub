import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { assertWorkspace } from "./workspace.mjs";
import { captureGitWorktreeTree } from "./git-worktree-snapshot.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40}$/;
const REF = /^evidence\/snapshots\/[a-zA-Z0-9._-]+\.json$/;

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function hashCanonical(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }

export function createTaskSnapshot(workspace, { task_id, snapshot_id } = {}) {
  const safe = assertWorkspace(workspace);
  if (typeof task_id !== "string" || task_id === "") throw new TypeError("task_id is required");
  if (typeof snapshot_id !== "string" || !/^[a-zA-Z0-9._-]+$/.test(snapshot_id)) throw new TypeError("snapshot_id is invalid");
  const { head, tree } = captureGitWorktreeTree(safe.worktreeRoot);
  const value = { schema_version: "task-snapshot.v1", task_id, snapshot_id, head_oid: head, tree_oid: tree };
  return Object.freeze({ ref: `evidence/snapshots/${snapshot_id}.json`, hash: hashCanonical(value), value: Object.freeze(value) });
}

export function createBaselineTaskSnapshot(workspace, { task_id, snapshot_id } = {}) {
  if (arguments.length !== 2) throw new TypeError("createBaselineTaskSnapshot accepts only Workspace and snapshot identity");
  const safe = assertWorkspace(workspace);
  if (typeof task_id !== "string" || task_id === "") throw new TypeError("task_id is required");
  if (typeof snapshot_id !== "string" || !/^[a-zA-Z0-9._-]+$/.test(snapshot_id)) throw new TypeError("snapshot_id is invalid");
  const tree = String(execFileSync("git", ["rev-parse", `${safe.baselineCommit}^{tree}`], { cwd: safe.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim();
  const value = { schema_version: "task-snapshot.v1", task_id, snapshot_id, head_oid: safe.baselineCommit, tree_oid: tree };
  return Object.freeze({ ref: `evidence/snapshots/${snapshot_id}.json`, hash: hashCanonical(value), value: Object.freeze(value) });
}

export function validateTaskSnapshot(value, expected = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("task snapshot must be an object");
  const keys = Object.keys(value).sort().join(",");
  if (keys !== "head_oid,schema_version,snapshot_id,task_id,tree_oid") throw new TypeError("task snapshot contains unknown or missing fields");
  if (value.schema_version !== "task-snapshot.v1") throw new Error("task snapshot schema_version must be task-snapshot.v1");
  if (!OID.test(value.head_oid) || !OID.test(value.tree_oid)) throw new Error("task snapshot Git OID is invalid");
  if (expected.taskId && value.task_id !== expected.taskId) throw new Error("task snapshot task identity mismatch");
  if (expected.ref && !REF.test(expected.ref)) throw new Error("task snapshot ref is invalid");
  if (expected.hash && (!HASH.test(expected.hash) || hashCanonical(value) !== expected.hash)) throw new Error("task snapshot hash mismatch");
  if (expected.workspace) {
    const root = assertWorkspace(expected.workspace).worktreeRoot;
    execFileSync("git", ["cat-file", "-e", `${value.tree_oid}^{tree}`], { cwd: root, stdio: "ignore" });
  }
  return Object.freeze(structuredClone(value));
}
