import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";

import { assertLauncherAuthority } from "./launcher-authority.mjs";
import { assertTaskHandle } from "./task-handle.mjs";

const REGISTRIES = new WeakSet();
const TASK_REPOSITORIES = new WeakMap();
const REPOSITORY_REF = /^repositories\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function canonicalRepositoryRoot(path) {
  const root = realpathSync(path);
  let top;
  try {
    top = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim());
  } catch (error) {
    throw new Error(`repository registry target is not a Git repository: ${error.stderr?.toString().trim() || error.message}`);
  }
  if (top !== root) throw new Error("repository registry target must be a Git toplevel directory");
  return root;
}

export function createRepositoryRegistry(launcherAuthority, entries) {
  assertLauncherAuthority(launcherAuthority);
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) throw new TypeError("repository registry entries must be an object");
  const canonical = new Map();
  for (const [ref, path] of Object.entries(entries)) {
    if (!REPOSITORY_REF.test(ref)) throw new TypeError(`invalid canonical repository ref: ${ref}`);
    canonical.set(ref, canonicalRepositoryRoot(path));
  }
  const registry = Object.freeze({
    resolve(ref) {
      if (!REPOSITORY_REF.test(ref)) throw new TypeError(`invalid canonical repository ref: ${ref}`);
      const root = canonical.get(ref);
      if (!root) throw new Error(`unknown canonical repository ref: ${ref}`);
      return root;
    },
  });
  REGISTRIES.add(registry);
  return registry;
}

export function resolveRepositoryRef(registry, ref) {
  if (!REGISTRIES.has(registry)) throw new TypeError("authentic repository registry capability required");
  return registry.resolve(ref);
}

/**
 * Re-mint the repository binding at the trusted launcher boundary.  The
 * absolute checkout path is deliberately process-local and is never copied
 * into task.json or another durable task record.
 */
export function bindTaskRepository(taskHandle, registry) {
  const task = assertTaskHandle(taskHandle);
  const ref = task.manifest.target_repository_ref;
  if (typeof ref !== "string") {
    if (typeof task.manifest.target_repo_root === "string") return task; // legacy read path
    throw new Error("task manifest is missing canonical target_repository_ref");
  }
  const root = resolveRepositoryRef(registry, ref);
  TASK_REPOSITORIES.set(task, Object.freeze({ ref, root }));
  return task;
}

export function repositoryRootForTask(taskHandle) {
  const task = assertTaskHandle(taskHandle);
  const bound = TASK_REPOSITORIES.get(task);
  if (bound) return bound.root;
  if (typeof task.manifest.target_repo_root === "string") return task.manifest.target_repo_root; // legacy reader only
  throw new Error("repository-bound task capability is required");
}
