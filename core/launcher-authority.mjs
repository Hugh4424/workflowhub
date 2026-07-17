import { homedir } from "node:os";
import { isAbsolute } from "node:path";

import { assertRuntimeAuthority } from "./runtime-mode.mjs";
import { resolveStorageRoot } from "./storage-root.mjs";
import { createTaskUnderLock, openTask } from "./task-handle.mjs";
import { deriveTaskPath, validateProjectName, validateTaskId } from "./task-identity.mjs";

const LAUNCHER_AUTHORITIES = new WeakMap();
const TASK_AUTHORITIES = new WeakMap();
const RELEASE_AUTHORITIES = new WeakMap();

export const COMMAND_SCOPES = Object.freeze({
  repo_bound: Object.freeze(["stage", "commit", "close"]),
  launcher_bound: Object.freeze(["doctor", "task", "status", "release", "routing", "admin-repin"]),
});

const COMMAND_SCOPE = new Map(
  Object.entries(COMMAND_SCOPES).flatMap(([scope, commands]) =>
    commands.map((command) => [command, scope]),
  ),
);

function commandName(value) {
  const command = Array.isArray(value) ? value[0] : value;
  if (typeof command !== "string" || command.trim() === "") {
    throw new TypeError("canonical command name is required");
  }
  return command.trim();
}

export function classifyCommand(value) {
  const command = commandName(value);
  const scope = COMMAND_SCOPE.get(command);
  if (!scope) throw new TypeError(`unsupported WorkflowHub command: ${command}`);
  return scope;
}

export function assertRepoBoundCommand(value) {
  const command = commandName(value);
  if (classifyCommand(command) !== "repo_bound") {
    throw new TypeError(`${command} is launcher_bound and must not receive a Workspace cwd`);
  }
  return command;
}

export function assertLauncherBoundCommand(value) {
  const command = commandName(value);
  if (classifyCommand(command) !== "launcher_bound") {
    throw new TypeError(`${command} is repo_bound and requires a Workspace cwd`);
  }
  return command;
}

function capability(label) {
  return Object.freeze({
    toJSON() { throw new TypeError(`${label} capability cannot be serialized`); },
  });
}

/** Rebuild process-local launcher authority only from trusted local policy. */
export function createLauncherAuthority({ env = process.env, home = homedir() } = {}) {
  const canonicalRoot = resolveStorageRoot({ env, home });
  const runtime = assertRuntimeAuthority(canonicalRoot, {
    home,
    expectedEpoch: env?.WORKFLOWHUB_CUTOVER_EPOCH,
  });
  const authority = capability("LauncherAuthority");
  LAUNCHER_AUTHORITIES.set(authority, Object.freeze({ canonicalRoot, runtime }));
  return authority;
}

export function assertLauncherAuthority(value) {
  const state = value && typeof value === "object" ? LAUNCHER_AUTHORITIES.get(value) : undefined;
  if (!state) throw new TypeError("expected an authentic process-local LauncherAuthority capability");
  return value;
}

export function createTaskWithLauncherAuthority(launcherAuthority, options = {}) {
  assertLauncherAuthority(launcherAuthority);
  return createTaskUnderLock({ ...options, storageRoot: LAUNCHER_AUTHORITIES.get(launcherAuthority).canonicalRoot });
}

export function createReleaseAuthority(launcherAuthority, { readCurrent, doctor } = {}) {
  assertLauncherAuthority(launcherAuthority);
  if (typeof readCurrent !== "function" || typeof doctor !== "function") throw new TypeError("release authority operations are required");
  const authority = capability("ReleaseAuthority");
  RELEASE_AUTHORITIES.set(authority, Object.freeze({ readCurrent, doctor }));
  return authority;
}

export function releaseAuthorityOperations(authority) {
  const operations = authority && typeof authority === "object" ? RELEASE_AUTHORITIES.get(authority) : undefined;
  if (!operations) throw new TypeError("authentic process-local ReleaseAuthority capability required");
  return operations;
}

/** Resolve a canonical task ref once at the trusted launcher boundary. */
export function taskAuthorityFor(launcherAuthority, { projectName, taskId } = {}) {
  assertLauncherAuthority(launcherAuthority);
  const launcher = LAUNCHER_AUTHORITIES.get(launcherAuthority);
  const project = validateProjectName(projectName);
  const task = validateTaskId(taskId);
  const canonicalTaskRoot = deriveTaskPath(launcher.canonicalRoot, project, task);
  const authority = capability("TaskLaunchAuthority");
  TASK_AUTHORITIES.set(authority, Object.freeze({
    projectName: project,
    taskId: task,
    canonicalTaskRoot,
  }));
  return authority;
}

export function assertTaskLaunchAuthority(value, expected = {}) {
  const state = value && typeof value === "object" ? TASK_AUTHORITIES.get(value) : undefined;
  if (!state) throw new TypeError("expected an authentic process-local TaskLaunchAuthority capability");
  if (expected.projectName !== undefined && validateProjectName(expected.projectName) !== state.projectName) {
    throw new Error("TaskLaunchAuthority project identity mismatch");
  }
  if (expected.taskId !== undefined && validateTaskId(expected.taskId) !== state.taskId) {
    throw new Error("TaskLaunchAuthority task identity mismatch");
  }
  return value;
}

/** Consume task authority without exposing its absolute path or runtime state. */
export function openTaskFromLaunchAuthority(taskAuthority, expected = {}) {
  assertTaskLaunchAuthority(taskAuthority, expected);
  const state = TASK_AUTHORITIES.get(taskAuthority);
  return openTask(state.canonicalTaskRoot, state.projectName, state.taskId);
}

export function assertCanonicalRef(value, label = "canonical ref") {
  if (typeof value !== "string" || value === "" || isAbsolute(value) || value.includes("\\") || value.split("/").some((part) => part === "" || part === "." || part === "..") || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value)) {
    throw new TypeError(`${label} must be a canonical relative ref`);
  }
  return value;
}
