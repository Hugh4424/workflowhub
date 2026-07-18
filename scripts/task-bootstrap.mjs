#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertRuntimeAuthority } from "../core/runtime-mode.mjs";
import { resolveStorageRoot } from "../core/storage-root.mjs";
import { deriveTaskPath } from "../core/task-identity.mjs";
import { createTask, inspectRunnerIdentity, migrateTaskRunnerIdentity } from "../core/task-handle.mjs";

const RUNNER_ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));

function args(argv) { const out = {}; for (const item of argv) { const at = item.indexOf("="); if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`); out[item.slice(2, at)] = item.slice(at + 1); } return out; }
export function bootstrapTask(values, { env = process.env, home } = {}) {
  if (Object.prototype.hasOwnProperty.call(values, "candidate-worktree") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) throw new TypeError("--candidate-worktree/--baseline-commit are no longer supported; make-decision owns worktree preparation");
  if (Object.prototype.hasOwnProperty.call(values, "runner-root") || Object.prototype.hasOwnProperty.call(values, "runner-oid")) throw new TypeError("runner identity is derived from the WorkflowHub checkout; caller-reported runner identity is forbidden");
  for (const key of ["project", "task"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required`);
  const runner = inspectRunnerIdentity(RUNNER_ROOT);
  const storageRoot = resolveStorageRoot({ env, home });
  const authority = assertRuntimeAuthority(storageRoot, { home, expectedEpoch: values.epoch });
  if (Object.prototype.hasOwnProperty.call(values, "migrate-runner")) {
    if (values["migrate-runner"] !== "true") throw new TypeError("--migrate-runner must be --migrate-runner=true");
    if (Object.keys(values).some((key) => !["project", "task", "migrate-runner", "epoch"].includes(key))) throw new TypeError("runner migration accepts only --project, --task, --migrate-runner=true, and optional --epoch");
    const taskPath = deriveTaskPath(realpathSync(storageRoot), values.project, values.task);
    const migrated = migrateTaskRunnerIdentity({ taskPath, projectName: values.project, taskId: values.task });
    return Object.freeze({ task_path: migrated.task.taskPath, project: migrated.task.identity.projectName, task: migrated.task.identity.taskId, storage_root: authority.storage_root, cutover_epoch: authority.cutover_epoch, runner_root: migrated.runner_root, runner_oid: migrated.runner_oid, idempotent_replay: migrated.idempotent_replay });
  }
  if (typeof values["target-repo"] !== "string" || values["target-repo"].trim() === "") throw new TypeError("--target-repo is required");
  const target = realpathSync(values["target-repo"]);
  let targetTop;
  try { targetTop = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: target, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()); }
  catch (error) { throw new Error(`target repository validation failed: ${error.stderr?.toString().trim() || error.message}`); }
  if (targetTop !== target) throw new Error("target repository must be a Git toplevel directory");
  const candidate = resolve(dirname(target), `${basename(target)}-${values.task}`);
  if (runner.runner_root === candidate) throw new Error("candidate Workspace cannot be used as the WorkflowHub runner");
  const inputs = values.inputs ? JSON.parse(readFileSync(values.inputs, "utf8")) : {};
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs) || Object.keys(inputs).some((key) => !["decision", "spec", "build_plan"].includes(key)) || Object.values(inputs).some((ref) => typeof ref !== "string" || !isAbsolute(ref))) throw new TypeError("inputs must contain only absolute decision/spec/build_plan accepted refs");
  const task = createTask({ storageRoot, manifest: { schema_version: "1.0.0", project_name: values.project, task_id: values.task, created_at: new Date().toISOString(), target_repo_root: target, issue_ids: values.issues ? values.issues.split(",").filter(Boolean) : [], inputs } });
  return Object.freeze({ task_path: task.taskPath, project: task.identity.projectName, task: task.identity.taskId, storage_root: authority.storage_root, cutover_epoch: authority.cutover_epoch, runner_root: runner.runner_root, runner_oid: runner.runner_oid });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(bootstrapTask(args(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}
