import { isAbsolute, relative, resolve } from "node:path";

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function validateSegment(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} is required`);
  }

  const normalized = value.trim();
  if (
    !SAFE_SEGMENT.test(normalized) ||
    normalized === "." ||
    normalized === ".." ||
    normalized.includes("..")
  ) {
    throw new TypeError(`${label} must be a safe single path segment: ${JSON.stringify(value)}`);
  }
  return normalized;
}

export function validateProjectName(projectName) {
  return validateSegment(projectName, "project_name");
}

export function validateTaskId(taskId) {
  return validateSegment(taskId, "task_id");
}

function assertInside(basePath, candidatePath) {
  const rel = relative(basePath, candidatePath);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return;
  throw new Error(`derived task path escapes storage root: ${candidatePath}`);
}

/** Derive the task leaf once at the launcher boundary. */
export function deriveTaskPath(storageRoot, projectName, taskId) {
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) {
    throw new TypeError("storageRoot must be an absolute path");
  }

  const root = resolve(storageRoot);
  const project = validateProjectName(projectName);
  const task = validateTaskId(taskId);
  const projectsRoot = resolve(root, "Projects");
  const taskPath = resolve(projectsRoot, project, "tasks", task);
  assertInside(projectsRoot, taskPath);
  return taskPath;
}
