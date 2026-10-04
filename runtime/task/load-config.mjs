import { isAbsolute, resolve } from "node:path";
import { deriveTaskPath, validateProjectName, validateTaskId } from "./task-identity.mjs";
import { resolveStorageRootDetails } from "../evidence/storage-root.mjs";

/**
 * Resolve a task leaf from one canonical project/task identity. An explicit
 * task path is a diagnostic override and is returned with its source so a
 * caller cannot mistake it for the canonical resolver result.
 */
export function resolveCanonicalTaskPath({ project, task, taskPath, env = process.env, home } = {}) {
  const projectName = validateProjectName(project);
  const taskId = validateTaskId(task);
  if (taskPath !== undefined) {
    if (typeof taskPath !== "string" || taskPath.trim() === "" || !isAbsolute(taskPath)) {
      throw new TypeError("taskPath diagnostic override must be a non-empty absolute path");
    }
    return Object.freeze({
      project: projectName,
      task: taskId,
      taskPath: resolve(taskPath),
      source: "diagnostic_override",
    });
  }
  const storage = resolveStorageRootDetails({ env, home });
  return Object.freeze({
    project: projectName,
    task: taskId,
    taskPath: deriveTaskPath(storage.storage_root, projectName, taskId),
    source: "canonical_resolver",
    storage_root: storage.storage_root,
  });
}
