#!/usr/bin/env node

/**
 * Official task bootstrap.
 *
 * The only supported way to create or open a task is through this CLI.
 * Hand-editing task.json, manual rollback/rebind, or creating a successor task
 * without a new official invocation is explicitly not supported. A new task
 * must have an authenticated parallel worktree prepared before the stage
 * starts. An existing task is bound explicitly via --workspace-root. Session
 * provenance is not used to select or rebind task identity during bootstrap.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

import { assertRuntimeAuthority } from "../../core/runtime-mode.mjs";
import { authenticateOfficialInvocation } from "../../runtime/evidence/invocation-identity.mjs";
import { resolveStorageRootDetails } from "../../runtime/evidence/storage-root.mjs";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace, validateExistingWorkspaceBinding } from "../../runtime/task/workspace.mjs";

function args(argv) { const out = {}; for (const item of argv) { const at = item.indexOf("="); if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`); out[item.slice(2, at)] = item.slice(at + 1); } return out; }
export function bootstrapTask(values, { env = process.env, home, cwd = process.cwd() } = {}) {
  if (Object.prototype.hasOwnProperty.call(values, "candidate-worktree") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) throw new TypeError("--candidate-worktree/--baseline-commit are no longer supported; make-decision owns worktree preparation");
  if (Object.prototype.hasOwnProperty.call(values, "task-path")) {
    for (const key of ["task-path", "project", "task"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required for existing task bootstrap`);
    const allowed = new Set(["task-path", "project", "task", "runner-root", "stage"]);
    const unexpected = Object.keys(values).find((key) => !allowed.has(key));
    if (unexpected) throw new TypeError(`--${unexpected} is invalid for existing task bootstrap`);
    const task = openTask(values["task-path"], values.project, values.task);
    // createTask publishes task.json atomically before workspace/store setup.
    // Re-enter the existing official path through the idempotent store owner so
    // a manifest-only directory is never returned as an initialized task.
    initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
    const runnerIdentity = values["runner-root"] && values.stage
      ? authenticateOfficialInvocation(task, { runnerRoot: values["runner-root"], stage: values.stage }).identity
      : undefined;
    return Object.freeze({
      task_path: task.taskPath,
      project: task.identity.projectName,
      task: task.identity.taskId,
      runner_identity: runnerIdentity,
    });
  }
  for (const key of ["project", "task", "target-repo"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required`);
  const target = realpathSync(values["target-repo"]);
  let targetTop;
  try { targetTop = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: target, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()); }
  catch (error) { throw new Error(`target repository validation failed: ${error.stderr?.toString().trim() || error.message}`); }
  if (targetTop !== target) throw new Error("target repository must be a Git toplevel directory");
  const existingWorkspace = values["workspace-root"] === undefined
    ? null
    : validateExistingWorkspaceBinding({ targetRepoRoot: target, workspaceRoot: values["workspace-root"] });
  const inputs = values.inputs ? JSON.parse(readFileSync(values.inputs, "utf8")) : {};
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs) || Object.keys(inputs).some((key) => !["decision", "spec", "build_plan"].includes(key)) || Object.values(inputs).some((ref) => typeof ref !== "string" || !isAbsolute(ref))) throw new TypeError("inputs must contain only absolute decision/spec/build_plan accepted refs");
  const storageResolution = resolveStorageRootDetails({ env, home });
  const storageRoot = storageResolution.storage_root;
  const authority = assertRuntimeAuthority(storageRoot, { home, expectedEpoch: values.epoch });
  const task = createTask({ storageRoot, manifest: {
    schema_version: "1.0.0",
    execution_mode: "per_invocation",
    record_model: "vnext-single-write",
    project_name: values.project,
    task_id: values.task,
    created_at: new Date().toISOString(),
    target_repo_root: target,
    write_resolution_source: storageResolution.selected_source,
    ...(existingWorkspace ? { workspace_mode: "existing", workspace_root: existingWorkspace.worktreeRoot } : {}),
    issue_ids: values.issues ? values.issues.split(",").filter(Boolean) : [],
    inputs,
  } });
  // A new task is not ready until its authenticated parallel worktree exists.
  // Prepare it before initializing the task store, so Git/path failures
  // surface at bootstrap rather than at publication.
  const workspace = prepareTaskWorkspace(task);
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  return Object.freeze({
    task_path: task.taskPath,
    project: task.identity.projectName,
    task: task.identity.taskId,
    storage_root: authority.storage_root,
    cutover_epoch: authority.cutover_epoch,
    workspace: Object.freeze({ worktree_root: workspace.worktreeRoot, branch: workspace.branch, baseline_commit: workspace.baselineCommit }),
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(bootstrapTask(args(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}
