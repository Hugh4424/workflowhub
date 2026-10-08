import { spawn } from "node:child_process";
import { failureDetails } from "./adapters/index.mjs";
import { isAlive, terminateProcessTree } from "./runtime.mjs";
import { createHealthRunner } from "./health-runner.mjs";

function redact(text, values) { let result = text; for (const value of values) if (value) result = result.split(value).join("[REDACTED]"); return result; }
function terminateProcessGroup(pid, signal) {
  if (process.platform === "win32" || !Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(-pid, signal); return true; } catch { return false; }
}
function isProcessGroupAlive(pid) {
  if (process.platform === "win32" || !Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(-pid, 0); return true; }
  catch (error) { return error?.code === "EPERM"; }
}
export function execute(plan, { maxOutputBytes, maxPendingLineBytes = 1_048_576, terminationGraceMs = 5_000, terminateProcess = terminateProcessTree, livenessIntervalMs = 1000, healthCheckIntervalMs = 60_000, probeDeadlineMs = 5_000, probeSession = null, isProcessAlive = isAlive, isCancelled = () => false, validateCompleted = () => true, acceptSemanticOutputAfterStdinClose = false, executionTimeoutMs = null, onStart, onLiveness, onProgress, onActivity, onOutput }) {
  if (executionTimeoutMs !== null && (!Number.isSafeInteger(executionTimeoutMs) || executionTimeoutMs < 1)) throw new TypeError("executionTimeoutMs must be a positive safe integer or null");
  if (!Number.isSafeInteger(maxPendingLineBytes) || maxPendingLineBytes < 1) throw new TypeError("maxPendingLineBytes must be a positive safe integer");
  return new Promise((resolve) => {
    const started = Date.now(); let child; let stdout = ""; let stderr = ""; let bytes = 0; let stdoutTruncated = false; let stderrTruncated = false; let settled = false; let terminalClaim = null; let healthRunner = null; let livenessTimer = null; let killTimer = null; let executionTimer = null; let lastProgressMs = null; let stdinError = null; let session_id = null; let cursor = null; const progressKeys = new Set(); let progressEvents = 0; let retryCount = 0; const lineBuffers = { stdout: "", stderr: "" };
    const cleanup = ({ detachOutput = false, keepKillTimer = false } = {}) => {
      if (livenessTimer) clearInterval(livenessTimer); if (killTimer && !keepKillTimer) clearTimeout(killTimer); if (executionTimer) clearTimeout(executionTimer); healthRunner?.stop(); if (child?.stdin && !child.stdin.destroyed) child.stdin.end();
      // A provider terminal event is authoritative.  Its wrapper can leave
      // inherited stdout/stderr descriptors open after the useful session is
      // over; those descriptors must not keep a managed operation running or
      // append post-terminal bytes to its sealed transcript.
      if (detachOutput) {
        child?.stdout?.removeAllListeners("data"); child?.stderr?.removeAllListeners("data");
        child?.stdout?.destroy(); child?.stderr?.destroy(); child?.unref?.();
      }
      livenessTimer = null; if (!keepKillTimer) killTimer = null; executionTimer = null;
    };
    const finish = (value, options) => { if (settled) return; settled = true; cleanup(options); resolve(value); };
    const snapshot = () => ({ stdout: redact(stdout, plan.redact), stderr: redact(stderr, plan.redact), stdout_truncated: stdoutTruncated, stderr_truncated: stderrTruncated, duration_ms: Date.now() - started, last_progress_at_ms: lastProgressMs, progress_events: progressEvents, retry_count: retryCount, session_id, cursor });
    const terminateClaimedProcess = () => {
      const pid = child?.pid;
      if (!pid) return;
      terminateProcess(pid, "SIGTERM");
      killTimer = setTimeout(() => {
        killTimer = null;
        if (!terminateProcessGroup(pid, "SIGKILL") && isProcessAlive(pid)) terminateProcess(pid, "SIGKILL");
      }, terminationGraceMs);
    };
    const settleClaim = () => {
      if (!terminalClaim || settled) return;
      const value = snapshot();
      if (terminalClaim.kind === "failed") finish({ ok: false, error: terminalClaim.error, ...value }, { detachOutput: true, keepKillTimer: true });
      else finish({ ok: true, ...value, stdout: terminalClaim.harvest.raw.stdout, stderr: terminalClaim.harvest.raw.stderr, health_harvested: true }, { detachOutput: true, keepKillTimer: true });
    };
    const claimFailure = (code, message) => { if (settled || terminalClaim) return false; terminalClaim = { kind: "failed", error: { code, message } }; terminateClaimedProcess(); return true; };
    const claimCompleted = (harvest) => { if (settled || terminalClaim) return false; terminalClaim = { kind: "completed", harvest }; terminateClaimedProcess(); return true; };
    const recordLiveness = () => { const at_ms = Date.now(); onLiveness?.({ at_ms }); return at_ms; };
    const observeProcessLiveness = () => { if (!settled && child?.pid && isProcessAlive(child.pid)) { recordLiveness(); return true; } return false; };
    try { plan.beforeSpawn?.(); child = spawn(plan.command, plan.argv, { cwd: plan.cwd, env: plan.env, stdio: ["pipe", "pipe", "pipe"], detached: true }); }
    catch (error) { finish({ ok: false, error: { code: error?.code ?? "PROCESS_START_FAILED", message: error.message }, duration_ms: Date.now() - started, stdout: "", stderr: "" }); return; }
    child.once("spawn", () => {
      child.stdin.once("error", (error) => { stdinError = { code: "PROCESS_STDIN_FAILED", message: `provider stdin failed: ${error.message}` }; });
      // Persisting PID identity may synchronously invoke ps. Deliver input
      // first, otherwise short-lived providers can exit before their prompt
      // reaches the pipe and turn a valid result into EPIPE.
      if (plan.input !== null) { if (plan.keepStdinOpen === true) child.stdin.write(plan.input); else child.stdin.end(plan.input); }
      else if (plan.keepStdinOpen !== true) child.stdin.end();
      onStart?.(child.pid); observeProcessLiveness();
      if (executionTimeoutMs !== null) {
        executionTimer = setTimeout(() => {
          if (claimFailure("PROVIDER_NO_TERMINAL_RESULT", "provider terminal recovery exceeded its bounded recovery window")) settleClaim();
        }, executionTimeoutMs);
        executionTimer.unref?.();
      }
      livenessTimer = setInterval(observeProcessLiveness, livenessIntervalMs); livenessTimer.unref();
      const healthProbe = probeSession ?? plan.probeSession;
      healthRunner = createHealthRunner({ streamProgress: plan.streamProgress === true, intervalMs: healthCheckIntervalMs, probeDeadlineMs, isCancelled, validateCompleted, probeSession: healthProbe ? (ctx) => healthProbe({ ...ctx, pid: child.pid, cwd: plan.cwd }) : null, onProgress: ({ at_ms, session_id: healthSession, cursor: healthCursor }) => { if (healthSession) session_id = healthSession; if (healthCursor !== null && healthCursor !== undefined) cursor = healthCursor; onProgress?.({ at_ms, session_id, cursor, event: "health" }); }, onDecision: (decision) => {
        if (decision.session_id) session_id = decision.session_id; if (decision.cursor !== null && decision.cursor !== undefined) cursor = decision.cursor;
        if (decision.status === "completed") { if (claimCompleted(decision)) settleClaim(); return; }
        if (claimFailure(decision.error.code, decision.error.message)) settleClaim();
      }, onDiagnostic: (diagnostic) => plan.onHealthDiagnostic?.(diagnostic) }); healthRunner.start();
    });
    child.once("error", (error) => { const value = snapshot(); finish({ ok: false, error: { code: "PROCESS_START_FAILED", message: error.message }, ...value }); });
    const appendSummary = (current, value) => {
      const limit = Math.max(1, maxOutputBytes ?? 1_048_576);
      if (Buffer.byteLength(current, "utf8") + Buffer.byteLength(value, "utf8") <= limit) return [current + value, false];
      const head = Math.max(1, Math.floor(limit / 4)); const tail = Math.max(1, limit - head);
      const combined = current + value;
      return [`${combined.slice(0, head)}\n[3rd-review raw stream retained privately; in-memory summary truncated]\n${combined.slice(-tail)}`, true];
    };
    const observeLine = (name, line) => {
      const observation = plan.observeLine?.(name, line) ?? {};
      if (observation.session_id) session_id = observation.session_id;
      if (observation.cursor !== null && observation.cursor !== undefined) cursor = observation.cursor;
      retryCount += Number.isSafeInteger(observation.retry_count) ? observation.retry_count : 0;
      if (observation.liveness === true) recordLiveness();
      if (Object.hasOwn(observation, "stdin_write")) {
        if (typeof observation.stdin_write !== "string" || observation.stdin_write.length === 0) { claimFailure("PROCESS_STDIN_INVALID", "provider requested an invalid stdin write"); return; }
        if (!child.stdin || child.stdin.destroyed || !child.stdin.writable) { claimFailure("PROCESS_STDIN_FAILED", "provider requested stdin after the channel closed"); return; }
        child.stdin.write(observation.stdin_write);
      }
      if (observation.terminal) {
        const terminal = observation.terminal;
        if (terminal.session_id) session_id = terminal.session_id;
        if (terminal.cursor !== null && terminal.cursor !== undefined) cursor = terminal.cursor;
        if (!terminal || !["completed", "failed"].includes(terminal.state)) { claimFailure("HEALTH_INVALID", "provider emitted an invalid terminal observation"); return; }
        if (isCancelled()) { claimFailure("CANCELLED", "health supervision was cancelled"); return; }
        if (terminal.state === "completed") {
          // A declared progress stream carries its completed result in this
          // terminal event; a lingering wrapper cannot turn it into a stall.
          // Other protocols may still need process close to finish their output.
          if (terminal.wait_for_close === true && plan.streamProgress !== true) { if (!terminalClaim && child.stdin && !child.stdin.destroyed) child.stdin.end(); }
          else {
            if (claimCompleted({ raw: { stdout: redact(stdout, plan.redact), stderr: redact(stderr, plan.redact) }, session_id: terminal.session_id ?? null, cursor: terminal.cursor ?? null })) settleClaim();
          }
        } else if (claimFailure(terminal.error?.code ?? "PROVIDER_HEALTH_FAILED", terminal.error?.message ?? "provider emitted a failed terminal event")) settleClaim();
      }
      if (observation.progress !== true) return;
      const progressKey = observation.progress_key ?? `${name}\0${line}`;
      if (progressKeys.has(progressKey)) return;
      progressKeys.add(progressKey); lastProgressMs = Date.now(); progressEvents += 1; healthRunner?.noteProgress({ cursor: observation.cursor, session_id: observation.session_id }); onProgress?.({ at_ms: lastProgressMs, cursor, session_id, event: observation.event ?? null });
    };
    const collect = (name) => (chunk) => {
      if (settled) return;
      const value = chunk.toString(); bytes += Buffer.byteLength(value);
      const outputAccepted = (onOutput ?? plan.onOutput)?.({ stream: name, chunk: value });
      if (outputAccepted === false) {
        claimFailure("PROVIDER_OUTPUT_LIMIT", "provider output exceeded the configured raw capture limit");
        settleClaim();
        return;
      }
      if (name === "stdout") { const [next, truncated] = appendSummary(stdout, value); stdout = next; stdoutTruncated ||= truncated; }
      else { const [next, truncated] = appendSummary(stderr, value); stderr = next; stderrTruncated ||= truncated; }
      onActivity?.();
      lineBuffers[name] += value;
      if (Buffer.byteLength(lineBuffers[name], "utf8") > maxPendingLineBytes) {
        claimFailure("PROVIDER_OUTPUT_LINE_TOO_LARGE", "provider emitted a line larger than the configured pending-line limit");
        settleClaim();
        return;
      }
      // Never split a JSONL record at a capture boundary: terminal protocol
      // events can be larger than the in-memory summary and remain valid only
      // after their newline arrives. The full raw stream is already on disk.
      const complete = lineBuffers[name].split(/\r?\n/); lineBuffers[name] = complete.pop();
      for (const line of complete) observeLine(name, line);
    };
    child.stdout.on("data", collect("stdout")); child.stderr.on("data", collect("stderr"));
    child.once("close", (code, signal) => {
      if (settled) {
        // Terminal claims keep the grace timer while any descendant still
        // owns the detached process group, including after successful output.
        // Release it early only when close confirms the whole group is gone.
        if (killTimer && !isProcessGroupAlive(child?.pid)) {
          clearTimeout(killTimer); killTimer = null;
        }
        return;
      }
      for (const [name, line] of Object.entries(lineBuffers)) if (line) observeLine(name, line);
      const value = snapshot();
      if (terminalClaim?.kind === "failed") return finish({ ok: false, error: terminalClaim.error, ...value });
      if (terminalClaim?.kind === "completed") return finish({ ok: true, ...value, stdout: terminalClaim.harvest.raw.stdout, stderr: terminalClaim.harvest.raw.stderr, health_harvested: true });
      if (code === 0 && stdinError && !acceptSemanticOutputAfterStdinClose) return finish({ ok: false, error: stdinError, ...value });
      if (code === 0) return finish({ ok: true, ...(stdinError ? { stdin_error: stdinError } : {}), ...value });
      if (signal) return finish({ ok: false, error: { code: "PROCESS_DEAD", message: `provider process was terminated by ${signal}` }, ...value });
      const classified = failureDetails(value.stderr, `provider process exited with ${signal ?? code}`);
      if (classified.session_id) session_id = classified.session_id;
      finish({ ok: false, error: classified.error, ...snapshot() });
    });
  });
}
