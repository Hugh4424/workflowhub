import { spawnSync } from "node:child_process";

import { assertWorkspace } from "./workspace.mjs";

const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;

/**
 * Run one argv-based command in an authenticated Workspace.
 *
 * This boundary deliberately has no cwd override, task lookup, shell mode, or
 * persistence. Callers that need shell syntax must invoke a shell explicitly.
 */
export function runWorkspaceCommand(workspace, command, args = []) {
  const safeWorkspace = assertWorkspace(workspace);
  if (typeof command !== "string" || command.trim() === "") {
    throw new TypeError("workspace command must be a non-empty string");
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("workspace command args must be an array of strings");
  }
  return spawnSync(command, [...args], {
    cwd: safeWorkspace.worktreeRoot,
    encoding: "utf8",
    maxBuffer: MAX_OUTPUT_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
