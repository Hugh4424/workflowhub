#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { migrateTaskTargetRepoRoot } from "../core/task-handle.mjs";
import { deriveTaskPath } from "../core/task-identity.mjs";
import { assertRuntimeAuthority } from "../core/runtime-mode.mjs";
import { resolveStorageRoot } from "../core/storage-root.mjs";

function parse(argv) {
  const values = {};
  for (const item of argv) {
    const at = item.indexOf("=");
    if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, at)] = item.slice(at + 1);
  }
  for (const key of ["project", "task", "target-repo-root", "target-branch"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required`);
  return values;
}

export function migrateTaskTargetRepo(argv = process.argv.slice(2), { env = process.env, home } = {}) {
  const values = parse(argv);
  const storageRoot = resolveStorageRoot({ env, home });
  const authority = assertRuntimeAuthority(storageRoot, { home, expectedEpoch: values.epoch });
  const result = migrateTaskTargetRepoRoot({
    taskPath: deriveTaskPath(storageRoot, values.project, values.task),
    projectName: values.project,
    taskId: values.task,
    targetRepoRoot: values["target-repo-root"],
    targetBranch: values["target-branch"],
  });
  return { migration_ref: result.migration_ref, integrity_hash: result.integrity_hash, previous_target_repo_root: result.previous_target_repo_root, target_repo_root: result.target_repo_root, target_branch: result.target_branch, target_head: result.target_head, storage_root: authority.storage_root, cutover_epoch: authority.cutover_epoch };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(migrateTaskTargetRepo(), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}
