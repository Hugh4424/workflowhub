import { spawnSync } from "node:child_process";
import { isAbsolute } from "node:path";

import { canonical, isRuntimeOnlyPath, sha256 } from "../../runtime/evidence/canonical-utils.mjs";
import { CLOSE_EXECUTION_SIDECAR_PREFIXES, ensureGitSnapshotObjectStore, captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { assertTaskHandle } from "../../runtime/task/task-handle.mjs";
import { assertWorkspace, openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";

const OID = /^[a-f0-9]{40,64}$/;
const TEST_REF = /^quality\/tests\/[A-Za-z0-9._/-]+\.json$/;

function git(root, args, { allowExitOne = false } = {}) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error || (result.status !== 0 && !(allowExitOne && result.status === 1))) {
    throw new Error(`Git ${args[0]} failed: ${result.stderr?.trim() || result.error?.message || `exit ${result.status}`}`);
  }
  return result;
}

function unknown(taskId, reason, receiptRef = null) {
  return Object.freeze({
    status: "unknown_change_scope",
    task_id: taskId,
    reason,
    changed_paths: Object.freeze([]),
    ...(receiptRef ? { snapshot_ref: receiptRef } : {}),
  });
}

function workspaceBinding({ task, workspace } = {}) {
  const safeTask = assertTaskHandle(task);
  const safeWorkspace = assertWorkspace(workspace);
  try {
    return openCurrentTaskWorkspace(safeTask).worktreeRoot === safeWorkspace.worktreeRoot
      ? { matches: true }
      : { matches: false, reason: "Workspace belongs to a different task" };
  } catch (error) {
    return { matches: false, reason: `current task Workspace is unavailable: ${error.message}` };
  }
}

/** Check the TaskHandle and Workspace pair before any canonical test write. */
export function taskWorkspaceMatches(input = {}) { return workspaceBinding(input).matches; }

function bootstrapStart(task, root) {
  const ref = `identity/executions/bootstrap-${task.identity.taskId}.json`;
  let value;
  try { value = JSON.parse(task.readRecord(ref)); }
  catch (error) {
    if (error?.code === "ENOENT") return { reason: "authenticated NEW task bootstrap identity is missing" };
    return { reason: `bootstrap identity is unreadable: ${error.message}` };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { reason: "bootstrap identity is not an object" };
  const { execution_manifest_hash: hash, ...unsigned } = value;
  const created = value.creation_result;
  const binding = created?.workspace;
  if (!OID.test(hash ?? "") || sha256(canonical(unsigned)) !== hash
      || value.schema_version !== "workflowhub-invocation-identity.v1"
      || value.command !== "task-bootstrap" || value.stage !== "make-decision"
      || value.run_id !== `bootstrap-${task.identity.taskId}`
      || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId
      || value.transaction?.status !== "closed" || created?.status !== "completed"
      || created?.project !== task.identity.projectName || created?.task !== task.identity.taskId
      || created?.task_path !== task.taskPath || binding?.worktree_root !== root
      || !OID.test(binding?.baseline_commit ?? "")) {
    return { reason: "bootstrap task, transaction, workspace, or manifest hash is not authenticated" };
  }
  const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).stdout.trim();
  if (binding.branch !== branch) return { reason: "bootstrap branch differs from the current task branch" };
  const startCommit = binding.baseline_commit;
  const resolvedCommit = git(root, ["rev-parse", "--verify", `${startCommit}^{commit}`]).stdout.trim();
  if (resolvedCommit !== startCommit) return { reason: "bootstrap start commit does not resolve in this repository" };
  const startTree = git(root, ["rev-parse", "--verify", `${startCommit}^{tree}`]).stdout.trim();
  if (!OID.test(startTree)) return { reason: "bootstrap start tree is invalid" };
  return { ref, startCommit, startTree };
}

function currentReceipt(task, receipt) {
  const ref = receipt?.receipt_ref;
  if (typeof ref !== "string" || !TEST_REF.test(ref) || ref.includes("..")) return { reason: "canonical test receipt ref is invalid" };
  let raw;
  let stored;
  try { raw = task.readRecord(ref); stored = JSON.parse(raw); }
  catch (error) { return { reason: `canonical test receipt is unreadable: ${error.message}` }; }
  if (sha256(raw) !== receipt.receipt_hash || stored.task_id !== task.identity.taskId
      || stored.stage !== "build-code" || stored.producer?.component !== "build-code-test-capture"
      || !OID.test(stored.snapshot_head ?? "") || !OID.test(stored.snapshot_tree ?? "")
      || !OID.test(stored.snapshot_commit ?? "") || !/^[a-f0-9]{64}$/.test(stored.source_digest ?? "")
      || stored.snapshot_tree !== receipt.snapshot_tree || stored.snapshot_commit !== receipt.snapshot_commit
      || stored.source_digest !== receipt.source_digest) {
    return { reason: "test receipt is not bound to this task and returned snapshot" };
  }
  try {
    const output = task.readRecord(stored.output_ref);
    if (sha256(output) !== stored.output_hash) return { reason: "test output hash differs from the canonical receipt" };
  } catch (error) { return { reason: `test output is unreadable: ${error.message}` }; }
  return { ref, stored };
}

function diffEntries(root, startCommit, snapshotCommit) {
  const result = git(root, ["diff", "--no-ext-diff", "--name-status", "-z", "-M", startCommit, snapshotCommit, "--"]);
  const fields = result.stdout.split("\0").filter((item) => item !== "");
  const entries = [];
  const paths = new Set();
  const sourcePath = (name) => !isRuntimeOnlyPath(name)
    && !CLOSE_EXECUTION_SIDECAR_PREFIXES.some((prefix) => name.startsWith(prefix));
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!/^(?:[A-Z]|R\d{1,3}|C\d{1,3})$/.test(status)) throw new Error(`Git diff status is invalid: ${status}`);
    const count = /^[RC]\d/.test(status) ? 2 : 1;
    const names = fields.slice(index, index + count);
    if (names.length !== count || names.some((name) => !name || isAbsolute(name) || name.split("/").includes(".."))) {
      throw new Error("Git diff contains an invalid path or incomplete rename");
    }
    index += count;
    if (count === 1) {
      if (sourcePath(names[0])) { paths.add(names[0]); entries.push({ status, path: names[0] }); }
      continue;
    }
    const [oldPath, newPath] = names;
    if (sourcePath(oldPath)) paths.add(oldPath);
    if (sourcePath(newPath)) paths.add(newPath);
    if (sourcePath(oldPath) && sourcePath(newPath)) entries.push({ status, old_path: oldPath, path: newPath });
    else if (sourcePath(oldPath)) entries.push({ status: "D", path: oldPath });
    else if (sourcePath(newPath)) entries.push({ status: "A", path: newPath });
  }
  return { entries, paths: [...paths].sort() };
}

function scopeFromAuthenticatedSnapshot(task, root, snapshot, receiptRef = null, start = bootstrapStart(task, root)) {
  const taskId = task.identity.taskId;
  if (start.reason) return unknown(taskId, start.reason, receiptRef);
  const ancestry = git(root, ["merge-base", "--is-ancestor", start.startCommit, snapshot.commit], { allowExitOne: true });
  if (ancestry.status !== 0) return unknown(taskId, "task start is not an ancestor of the captured snapshot", receiptRef);
  const observedTree = git(root, ["rev-parse", "--verify", `${snapshot.commit}^{tree}`]).stdout.trim();
  if (observedTree !== snapshot.tree) return unknown(taskId, "snapshot commit and tree disagree", receiptRef);
  const { entries, paths } = diffEntries(root, start.startCommit, snapshot.commit);
  return Object.freeze({
    status: "recorded", task_id: taskId,
    start_ref: start.ref, start_commit: start.startCommit, start_tree: start.startTree,
    ...(receiptRef ? { snapshot_ref: receiptRef } : {}),
    snapshot_head: snapshot.head, snapshot_commit: snapshot.commit,
    snapshot_tree: snapshot.tree, source_digest: snapshot.source_digest,
    changed_paths: Object.freeze(paths), changes: Object.freeze(entries),
  });
}

/** Read the authenticated current change scope before this round's test receipt exists. */
export function capturePreExecutionTaskChangeScope({ task, workspace } = {}) {
  const safeTask = assertTaskHandle(task);
  const safeWorkspace = assertWorkspace(workspace);
  const taskId = safeTask.identity.taskId;
  const binding = workspaceBinding({ task: safeTask, workspace: safeWorkspace });
  if (!binding.matches) return unknown(taskId, binding.reason);
  const root = safeWorkspace.worktreeRoot;
  try {
    ensureGitSnapshotObjectStore(root);
    const current = captureExecutionSnapshot(root, taskId, safeTask.manifest.activation_cohort ?? "pre");
    return scopeFromAuthenticatedSnapshot(safeTask, root, current);
  } catch (error) {
    return unknown(taskId, `change scope could not be authenticated: ${error.message}`);
  }
}

/** Derive a return-only change scope from the immutable NEW-task start. */
export function captureTaskChangeScope({ task, workspace, receipt } = {}) {
  const safeTask = assertTaskHandle(task);
  const safeWorkspace = assertWorkspace(workspace);
  const taskId = safeTask.identity.taskId;
  const binding = workspaceBinding({ task: safeTask, workspace: safeWorkspace });
  if (!binding.matches) return unknown(taskId, binding.reason);
  const root = safeWorkspace.worktreeRoot;
  const receiptResult = currentReceipt(safeTask, receipt);
  if (receiptResult.reason) return unknown(taskId, receiptResult.reason, receipt?.receipt_ref);
  const { stored, ref } = receiptResult;
  try {
    ensureGitSnapshotObjectStore(root);
    const start = bootstrapStart(safeTask, root);
    if (start.reason) return unknown(taskId, start.reason, ref);
    const current = captureExecutionSnapshot(root, taskId, safeTask.manifest.activation_cohort ?? "pre");
    if (stored.snapshot_head !== current.head || stored.snapshot_tree !== current.tree
        || stored.snapshot_commit !== current.commit || stored.source_digest !== current.source_digest) {
      return unknown(taskId, "canonical test receipt is stale against the current source snapshot", ref);
    }
    return scopeFromAuthenticatedSnapshot(safeTask, root, current, ref, start);
  } catch (error) {
    return unknown(taskId, `change scope could not be authenticated: ${error.message}`, ref);
  }
}
