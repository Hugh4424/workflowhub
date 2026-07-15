#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

import { assertRuntimeAuthority } from "../core/runtime-mode.mjs";
import { resolveStorageRoot } from "../core/storage-root.mjs";
import { createTask } from "../core/task-handle.mjs";

function args(argv) { const out = {}; for (const item of argv) { const at = item.indexOf("="); if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`); out[item.slice(2, at)] = item.slice(at + 1); } return out; }
function git(root, values) { return String(execFileSync("git", values, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
function common(root) { const value = git(root, ["rev-parse", "--git-common-dir"]); return realpathSync(isAbsolute(value) ? value : `${root}/${value}`); }

export function bootstrapTask(values, { env = process.env, home } = {}) {
  for (const key of ["project", "task", "target-repo", "candidate-worktree", "baseline-commit"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required`);
  const target = realpathSync(values["target-repo"]), candidate = realpathSync(values["candidate-worktree"]), baseline = values["baseline-commit"];
  if (realpathSync(git(target, ["rev-parse", "--show-toplevel"])) !== target || realpathSync(git(candidate, ["rev-parse", "--show-toplevel"])) !== candidate) throw new Error("target repo and candidate worktree must be Git toplevel directories");
  if (common(target) !== common(candidate)) throw new Error("candidate worktree must belong to target repository");
  if (git(candidate, ["rev-parse", "HEAD"]) !== baseline || !/^[a-f0-9]{40}$/i.test(baseline)) throw new Error("baseline commit must equal candidate worktree HEAD");
  const inputs = values.inputs ? JSON.parse(readFileSync(values.inputs, "utf8")) : {};
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs) || Object.keys(inputs).some((key) => !["decision", "spec", "build_plan"].includes(key)) || Object.values(inputs).some((ref) => typeof ref !== "string" || !isAbsolute(ref))) throw new TypeError("inputs must contain only absolute decision/spec/build_plan accepted refs");
  const storageRoot = resolveStorageRoot({ env, home });
  const authority = assertRuntimeAuthority(storageRoot, { home, expectedEpoch: values.epoch });
  const task = createTask({ storageRoot, manifest: { schema_version: "1.0.0", project_name: values.project, task_id: values.task, created_at: new Date().toISOString(), target_repo_root: target, issue_ids: values.issues ? values.issues.split(",").filter(Boolean) : [], inputs } });
  return Object.freeze({ task_path: task.taskPath, project: task.identity.projectName, task: task.identity.taskId, storage_root: authority.storage_root, cutover_epoch: authority.cutover_epoch, candidate_worktree: candidate, baseline_commit: baseline });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(bootstrapTask(args(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}
