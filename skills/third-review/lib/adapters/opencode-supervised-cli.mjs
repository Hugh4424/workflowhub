#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createOpenCodeProbe } from "./opencode.mjs";
import { failureCode, failureMessage, PROVIDER_FAILURE_PREFIX } from "../provider-failure.mjs";

const specification = JSON.parse(Buffer.from(process.argv[2], "base64url").toString("utf8"));
let server = null; let client = null; let stopping = false;
let serverError = "";
const terminate = (child, signal = "SIGTERM") => { if (child?.pid && child.exitCode === null) try { child.kill(signal); } catch {} };
function cleanup(signal = "SIGTERM") { if (stopping) return; stopping = true; terminate(client, signal); terminate(server, signal); }
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(signal, () => { cleanup(signal); setTimeout(() => process.exit(128), 100).unref(); });

async function ready(url, child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.spawnError) throw child.spawnError;
    if (child.exitCode !== null) throw new Error(`OpenCode server exited before readiness (${child.exitCode})`);
    try { const response = await fetch(`${url}/global/health`, { signal: AbortSignal.timeout(250) }); if (response.ok && (await response.json()).healthy === true) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("OpenCode server did not become healthy");
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function argValue(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] ?? null : null;
}
function canonicalWorkspace(value) {
  if (!value) return null;
  const decoded = String(value).replaceAll("%25", "%");
  try { return fs.realpathSync(decoded); } catch { return path.resolve(decoded); }
}
async function discoverSession(url, specification, startedAt) {
  const workspace = canonicalWorkspace(specification.workspace ?? argValue(specification.clientArgv ?? [], "--dir"));
  if (!workspace) return null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${url}/session`, { signal: AbortSignal.timeout(1_000), headers: { accept: "application/json" } });
      if (response.ok) {
        const sessions = await response.json();
        const matches = Array.isArray(sessions)
          ? sessions
            .filter((session) => session?.id && canonicalWorkspace(session.directory) === workspace)
            .filter((session) => Number.isFinite(session.time?.created) && session.time.created > startedAt)
          : [];
        // A fallback session is safe only when freshness and identity resolve
        // to one candidate. Never guess between equally plausible sessions.
        if (matches.length === 1) return matches[0].id;
      }
    } catch {}
    await wait(100);
  }
  return null;
}
function emitFailure(code, session_id = null) {
  const normalized = code === "SESSION_IDLE_WITHOUT_TERMINAL" ? "PROVIDER_NO_TERMINAL_RESULT" : code;
  const value = { version: 1, code: normalized, message: failureMessage(normalized), ...(session_id ? { session_id } : {}) };
  process.stderr.write(`${PROVIDER_FAILURE_PREFIX}${JSON.stringify(value)}\n`);
}

function supervisorFailureCode(error) {
  if (error?.code === "ENOENT") return "PROCESS_START_FAILED";
  if (error?.code === "EACCES") return "PROVIDER_PERMISSION_DENIED";
  if (/server exited before readiness/i.test(String(error?.message ?? ""))) return "PROCESS_DEAD";
  if (/server did not become healthy/i.test(String(error?.message ?? ""))) return "PROBE_FAILED";
  return failureCode(error?.message ?? "");
}

async function terminalAfterClientExit(url, sessionID) {
  let terminal = await createOpenCodeProbe({ url })({ session_id: sessionID, signal: AbortSignal.timeout(2_000) });
  while (["busy", "retry", "progressing"].includes(terminal.status)) {
    await wait(250);
    terminal = await createOpenCodeProbe({ url })({ session_id: sessionID, signal: AbortSignal.timeout(2_000) });
  }
  return terminal;
}

try {
  server = spawn(specification.command, ["serve", "--pure", "--hostname", "127.0.0.1", "--port", String(specification.port)], { env: process.env, cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
  server.once("error", (error) => { server.spawnError = error; });
  server.stderr.on("data", (chunk) => { serverError = `${serverError}${chunk.toString()}`.slice(-8_192); }); server.stdout.on("data", (chunk) => { serverError = `${serverError}${chunk.toString()}`.slice(-8_192); });
  await ready(specification.url, server);
  const clientStartedAt = Date.now();
  client = spawn(specification.command, specification.clientArgv, { env: process.env, cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"] });
  let sessionID = specification.session ?? null; let lineBuffer = ""; let clientError = "";
  process.stdin.pipe(client.stdin); client.stdout.on("data", (chunk) => {
    const value = chunk.toString(); process.stdout.write(value); lineBuffer += value;
    const lines = lineBuffer.split(/\r?\n/); lineBuffer = lines.pop();
    for (const line of lines) try { const item = JSON.parse(line); sessionID ??= item.sessionID ?? item.session_id ?? null; } catch {}
  }); client.stderr.on("data", (chunk) => { const value = chunk.toString(); clientError = `${clientError}${value}`.slice(-8_192); process.stderr.write(value); });
  const code = await new Promise((resolve, reject) => { client.once("error", reject); client.once("close", (value) => resolve(value ?? 1)); });
  let exitCode = code;
  if (code === 0 && !sessionID) sessionID = await discoverSession(specification.url, specification, clientStartedAt);
  if (code === 0 && sessionID) {
    const terminal = await terminalAfterClientExit(specification.url, sessionID);
    if (terminal.status === "completed") process.stdout.write(terminal.raw.stdout);
    else { emitFailure(terminal.error?.code ?? "PROVIDER_HEALTH_FAILED", sessionID); exitCode = 1; }
  }
  if (code !== 0) { emitFailure(failureCode(clientError), sessionID); exitCode = 1; }
  if (code === 0 && !sessionID) { emitFailure("SESSION_UNKNOWN"); exitCode = 1; }
  cleanup(); process.exitCode = exitCode;
} catch (error) {
  cleanup(); emitFailure(supervisorFailureCode(error), null); if (serverError || error.message) process.stderr.write(`${serverError || error.message}\n`); process.exitCode = 1;
}
