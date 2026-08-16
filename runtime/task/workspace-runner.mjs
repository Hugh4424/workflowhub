import { spawnSync } from "node:child_process";

import { assertCandidateWorkspace, assertWorkspace } from "../../runtime/task/workspace.mjs";

export const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;

const TEST_SHELL_GROUP_WRAPPER = [
  "trap 'trap - TERM INT; kill -TERM 0 2>/dev/null' TERM INT;",
  "/bin/sh -c \"$1\" & child=$!;",
  "wait \"$child\";",
  "exit \"$?\";",
].join(" ");

/**
 * Run one argv-based command in an authenticated Workspace.
 *
 * This boundary deliberately has no cwd override, task lookup, shell mode, or
 * persistence. Callers that need shell syntax must invoke a shell explicitly.
 */
function runBoundCommand(worktreeRoot, command, args, { timeoutMs, killProcessGroup = false } = {}) {
  if (typeof command !== "string" || command.trim() === "") {
    throw new TypeError("workspace command must be a non-empty string");
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("workspace command args must be an array of strings");
  }
  if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1)) {
    throw new TypeError("workspace command timeoutMs must be a positive safe integer");
  }
  if (typeof killProcessGroup !== "boolean") {
    throw new TypeError("workspace command killProcessGroup must be boolean");
  }
  let spawnArgs = [...args];
  let detached = false;
  if (killProcessGroup) {
    if (command !== "/bin/sh" || args.length !== 2 || args[0] !== "-c") {
      throw new TypeError("workspace command process-group termination requires /bin/sh -c");
    }
    // Keep the caller's shell text in $1 so the supervisor shell parses only
    // this fixed wrapper. On timeout, the detached process group receives TERM
    // together; this prevents background test workers from surviving capture.
    spawnArgs = ["-c", TEST_SHELL_GROUP_WRAPPER, "workflowhub-test-command", args[1]];
    detached = true;
  }
  return spawnSync(command, spawnArgs, {
    cwd: worktreeRoot,
    encoding: "utf8",
    maxBuffer: MAX_OUTPUT_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
    ...(detached ? { detached } : {}),
    ...(timeoutMs === undefined ? {} : { timeout: timeoutMs, killSignal: "SIGTERM" }),
  });
}

export function runWorkspaceCommand(workspace, command, args = [], options = {}) {
  return runBoundCommand(assertWorkspace(workspace).worktreeRoot, command, args, options);
}

/** Run a make-decision component in the authenticated candidate worktree. */
export function runCandidateWorkspaceCommand(candidateWorkspace, command, args = [], options = {}) {
  return runBoundCommand(assertCandidateWorkspace(candidateWorkspace).worktreeRoot, command, args, options);
}
