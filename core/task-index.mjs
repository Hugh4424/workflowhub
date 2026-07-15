/**
 * Compatibility projection for callers that still need a task lookup shape.
 * Task identity lives only in the authenticated task manifest; no global index
 * or second identity database is created.
 */

import { assertTaskHandle } from "./task-handle.mjs";

export function taskIndexEntry(taskHandle) {
  const task = assertTaskHandle(taskHandle);
  return Object.freeze({
    taskId: task.identity.taskId,
    projectKey: task.identity.projectName,
    repo: task.manifest.target_repo_root,
  });
}

export function appendTaskIndex() {
  throw new Error("task index writes were removed; use the authenticated task.json manifest");
}

export function lookupProjectKey(taskHandle, taskId) {
  const entry = taskIndexEntry(taskHandle);
  if (taskId !== undefined && taskId !== entry.taskId) return null;
  return { projectKey: entry.projectKey, repo: entry.repo };
}

export function __setIndexPathForTest() {
  throw new Error("global task index paths were removed");
}
