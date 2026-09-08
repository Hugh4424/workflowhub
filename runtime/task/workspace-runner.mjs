import { spawn, spawnSync } from "node:child_process";

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
function runBoundCommand(worktreeRoot, command, args, { timeoutMs, killProcessGroup = false, asynchronous = false, signal } = {}) {
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
  if (typeof asynchronous !== "boolean") throw new TypeError("workspace command asynchronous must be boolean");
  if (signal !== undefined && (typeof signal?.aborted !== "boolean"
      || typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function")) {
    throw new TypeError("workspace command signal must be an AbortSignal");
  }
  if (asynchronous) return runAsyncBoundCommand(worktreeRoot, command, args, { timeoutMs, signal });
  if (signal !== undefined) throw new TypeError("workspace command signal requires asynchronous execution");
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


// Private argv execution for acceptance commands and the fixed service launcher.
// A process group is scoped to this invocation; no shell or persistent supervisor
// is involved. Output remains bytes, including empty and non-UTF8 streams.
function runAsyncBoundCommand(worktreeRoot, command, args, { timeoutMs, signal }) {
  const failure = (message, code, cause) => Object.assign(new Error(message, cause === undefined ? undefined : { cause }), { code });
  if (signal?.aborted) return Promise.resolve({
    status: null, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0),
    timed_out: false, cancelled: true, cleanup: { status: "not_started" },
    error: failure("workspace command cancelled before spawn", "ABORT_ERR", signal.reason),
  });
  return new Promise((resolve) => {
    const chunks = { stdout: [], stderr: [] };
    const sizes = { stdout: 0, stderr: 0 };
    let child;
    let spawned = false;
    let closed = false;
    let settled = false;
    let cleanupRunning = false;
    let runtimeTimer;
    let status = null;
    let closeSignal = null;
    let error;
    let firstInterruption = null;
    let groupGone = false;
    let groupError = false;

    const finish = (cleanupStatus) => {
      if (settled) return;
      settled = true;
      clearTimeout(runtimeTimer);
      signal?.removeEventListener("abort", onAbort);
      resolve({
        status, signal: closeSignal,
        stdout: Buffer.concat(chunks.stdout), stderr: Buffer.concat(chunks.stderr),
        timed_out: firstInterruption === "timeout", cancelled: firstInterruption === "cancel",
        cleanup: { status: cleanupStatus }, ...(error ? { error } : {}),
      });
    };
    const groupAlive = () => {
      if (groupGone || !spawned || !Number.isSafeInteger(child.pid)) return false;
      try { process.kill(-child.pid, 0); return true; }
      catch (caught) {
        if (caught.code === "ESRCH") { groupGone = true; return false; }
        groupError = true;
        error ??= failure("workspace command process-group inspection failed", "PROCESS_CLEANUP_FAILED", caught);
        return true;
      }
    };
    const sendGroupSignal = (name) => {
      if (groupGone || !spawned) return;
      try { process.kill(-child.pid, name); }
      catch (caught) {
        if (caught.code === "ESRCH") groupGone = true;
        else {
          groupError = true;
          error ??= failure("workspace command process-group termination failed", "PROCESS_CLEANUP_FAILED", caught);
        }
      }
    };
    const cleanUp = async () => {
      if (cleanupRunning || settled || !spawned) return;
      cleanupRunning = true;
      clearTimeout(runtimeTimer);
      const started = Date.now();
      const graceMs = 300;
      const deadline = started + 3000;
      let sentKill = false;
      if (groupAlive()) sendGroupSignal("SIGTERM");
      while (!settled) {
        const alive = groupAlive();
        if (closed && !alive) { finish(groupError ? "failed" : "completed"); return; }
        if (alive && !sentKill && Date.now() - started >= graceMs) {
          sentKill = true;
          sendGroupSignal("SIGKILL");
        }
        if (Date.now() >= deadline) {
          error ??= failure("workspace command process group did not fully close", "PROCESS_CLEANUP_FAILED");
          // Close only this invocation's pipes. Never claim cleanup success
          // when an owned process or inherited descriptor remains observable.
          child.stdout?.destroy();
          child.stderr?.destroy();
          finish("failed");
          return;
        }
        await new Promise((resume) => setTimeout(resume, 10));
      }
    };
    const interrupt = (kind) => {
      if (settled || closed || firstInterruption !== null) return;
      firstInterruption = kind;
      error ??= kind === "timeout"
        ? failure("workspace command timed out", "ETIMEDOUT")
        : failure("workspace command cancelled", "ABORT_ERR", signal?.reason);
      void cleanUp();
    };
    const onAbort = () => interrupt("cancel");
    signal?.addEventListener("abort", onAbort, { once: true });
    // Close the small race between the initial check and listener registration.
    if (signal?.aborted) {
      firstInterruption = "cancel";
      error = failure("workspace command cancelled before spawn", "ABORT_ERR", signal.reason);
      finish("not_started");
      return;
    }
    try {
      child = spawn(command, [...args], { cwd: worktreeRoot, detached: true, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    } catch (caught) {
      error = caught;
      finish("not_started");
      return;
    }
    const collect = (stream, chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const remaining = Math.max(0, MAX_OUTPUT_BYTES - sizes[stream]);
      if (remaining > 0) {
        const kept = bytes.subarray(0, remaining);
        chunks[stream].push(kept);
        sizes[stream] += kept.length;
      }
      if (bytes.length > remaining) {
        firstInterruption ??= "output_limit";
        error ??= failure(`workspace command ${stream} exceeded the output limit`, "ENOBUFS");
        void cleanUp();
      }
    };
    child.stdout.on("data", (chunk) => collect("stdout", chunk));
    child.stderr.on("data", (chunk) => collect("stderr", chunk));
    child.once("spawn", () => {
      spawned = true;
      if (firstInterruption !== null) void cleanUp();
      else if (timeoutMs !== undefined) runtimeTimer = setTimeout(() => interrupt("timeout"), timeoutMs);
    });
    child.once("error", (caught) => {
      error ??= caught;
      if (spawned) void cleanUp();
    });
    child.once("exit", (code, exitSignal) => {
      status = Number.isInteger(code) ? code : null;
      closeSignal = exitSignal ?? null;
      void cleanUp();
    });
    child.once("close", (code, actualSignal) => {
      closed = true;
      if (spawned) {
        status = Number.isInteger(code) ? code : null;
        closeSignal = actualSignal ?? null;
        void cleanUp();
      } else finish("not_started");
    });
  });
}

export function runWorkspaceCommand(workspace, command, args = [], options = {}) {
  return runBoundCommand(assertWorkspace(workspace).worktreeRoot, command, args, options);
}

/** Run a make-decision component in the authenticated candidate worktree. */
export function runCandidateWorkspaceCommand(candidateWorkspace, command, args = [], options = {}) {
  return runBoundCommand(assertCandidateWorkspace(candidateWorkspace).worktreeRoot, command, args, options);
}
