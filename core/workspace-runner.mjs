import { spawnSync } from "node:child_process";

import { assertCandidateWorkspace, assertWorkspace } from "./workspace.mjs";
import { assertRepoBoundCommand } from "./launcher-authority.mjs";

const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;

/**
 * Run one argv-based command in an authenticated Workspace.
 *
 * This boundary deliberately has no cwd override, task lookup, shell mode, or
 * persistence. Callers that need shell syntax must invoke a shell explicitly.
 */
function runBoundCommand(worktreeRoot, command, args) {
  if (typeof command !== "string" || command.trim() === "") {
    throw new TypeError("workspace command must be a non-empty string");
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("workspace command args must be an array of strings");
  }
  return spawnSync(command, [...args], {
    cwd: worktreeRoot,
    encoding: "utf8",
    maxBuffer: MAX_OUTPUT_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function runWorkspaceCommand(workspace, workflowCommand, command, args = []) {
  assertRepoBoundCommand(workflowCommand);
  return runBoundCommand(assertWorkspace(workspace).worktreeRoot, command, args);
}

/** Run a make-decision component in the authenticated candidate worktree. */
export function runCandidateWorkspaceCommand(candidateWorkspace, command, args = []) {
  return runBoundCommand(assertCandidateWorkspace(candidateWorkspace).worktreeRoot, command, args);
}

/** Public command routing guard: repo-bound operations alone may acquire cwd. */
export function runRepoBoundCommand(workspace, workflowCommand, command, args = []) {
  return runWorkspaceCommand(workspace, workflowCommand, command, args);
}
