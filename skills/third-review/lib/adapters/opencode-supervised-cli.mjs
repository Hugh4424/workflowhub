#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createOpenCodeProbe, packetPermissions, verifyNativeAgentPolicy } from "./opencode.mjs";
import { failureCode, failureMessage, PROVIDER_FAILURE_PREFIX } from "../provider-failure.mjs";

const specification = JSON.parse(Buffer.from(process.argv[2], "base64url").toString("utf8"));
let server = null; let client = null; let stopping = false;
let serverError = "";
const closes = new WeakMap();
function track(child) {
  closes.set(child, new Promise(resolve => child.once("close", resolve)));
  return child;
}
function guard(reason) { const error = new Error("OpenCode packet policy: " + reason); error.code = "PROVIDER_PACKET_GUARD_UNAVAILABLE"; throw error; }
function active() { if (stopping) guard("cancelled before native client dispatch"); }
async function settledWithin(promise, ms) {
  let timer;
  try { return await Promise.race([promise.then(() => true), new Promise(resolve => { timer = setTimeout(() => resolve(false), ms); })]); }
  finally { clearTimeout(timer); }
}
async function stopChild(child) {
  if (!child) return;
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  if (!await settledWithin(closes.get(child), 3000)) {
    child.kill("SIGKILL");
    if (!await settledWithin(closes.get(child), 3000)) guard("owned native process did not close");
  }
}
let cleanupPromise;
function cleanup() {
  stopping = true;
  return cleanupPromise ??= Promise.all([stopChild(client), stopChild(server)]);
}
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(signal, () => {
  void cleanup().then(() => process.exit(128), error => {
    emitFailure("PROCESS_EXIT_NONZERO", null, error); process.exit(128);
  });
});

async function ready(url, child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    active();
    if (child.spawnError) throw child.spawnError;
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`OpenCode server exited before readiness (${child.exitCode})`);
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
  try { return fs.realpathSync(String(value)); } catch { return null; }
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
function emitFailure(code, session_id = null, cleanupError = null) {
  const normalized = code === "SESSION_IDLE_WITHOUT_TERMINAL" ? "PROVIDER_NO_TERMINAL_RESULT" : code;
  const value = { version: 1, code: normalized, message: failureMessage(normalized), ...(session_id ? { session_id } : {}),
    ...(cleanupError ? { cleanup_error: { code: supervisorFailureCode(cleanupError), message: "owned native process cleanup failed; closure is unconfirmed" } } : {}) };
  process.stderr.write(`${PROVIDER_FAILURE_PREFIX}${JSON.stringify(value)}\n`);
}

function supervisorFailureCode(error) {
  if (error?.code === "PROVIDER_PACKET_GUARD_UNAVAILABLE") return error.code;
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

function policyEquals(actual, expected) {
  if (!actual || typeof actual !== "object" || Array.isArray(actual) || actual["*"] !== "deny" || Object.keys(actual).some(key => key !== "*" && key !== "read")) return false;
  const read = actual.read;
  return read && typeof read === "object" && !Array.isArray(read)
    && Object.keys(read).length === Object.keys(expected.read).length
    && Object.entries(expected.read).every(([key, action]) => read[key] === action);
}
function configuredEnvironment(config, permission) {
  return { ...process.env, OPENCODE_CONFIG_CONTENT: JSON.stringify({ ...config, permission,
    agent: { ...config.agent, build: { ...config.agent?.build, permission } } }), OPENCODE_PERMISSION: JSON.stringify(permission) };
}
function startServer(env) {
  active();
  const child = track(spawn(specification.command, ["serve", "--pure", "--hostname", "127.0.0.1", "--port", String(specification.port)], { env, cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] }));
  child.once("error", error => { child.spawnError = error; });
  child.stderr.on("data", chunk => { serverError = `${serverError}${chunk.toString()}`.slice(-8_192); });
  child.stdout.on("data", chunk => { serverError = `${serverError}${chunk.toString()}`.slice(-8_192); });
  return child;
}
async function metadata(endpoint, workspace) {
  active();
  const response = await fetch(specification.url + endpoint, { signal: AbortSignal.timeout(5000),
    headers: { accept: "application/json", "x-opencode-directory": encodeURIComponent(workspace) } });
  if (!response.ok) guard("native metadata unavailable");
  const value = await response.json(); active(); return value;
}
function nativePath(value, workspace) {
  if (!value || value.directory !== workspace || typeof value.worktree !== "string" || !path.isAbsolute(value.worktree)
    || fs.realpathSync(value.worktree) !== value.worktree) guard("native directory or worktree differs");
  return value.worktree;
}
try {
  const workspace = fs.realpathSync(specification.workspace);
  if (workspace !== specification.workspace) guard("workspace is not canonical");
  const config = JSON.parse(process.env.OPENCODE_CONFIG_CONTENT);
  const intended = packetPermissions(workspace);
  if (!policyEquals(config.permission, intended) || !policyEquals(config.agent?.build?.permission, intended)
    || !policyEquals(JSON.parse(process.env.OPENCODE_PERMISSION), intended)) guard("native intent differs from frozen manifest");
  const denied = { "*": "deny", read: { "*": "deny" } };
  server = startServer(configuredEnvironment(config, denied));
  await ready(specification.url, server);
  const worktree = nativePath(await metadata("/path", workspace), workspace);
  // The discovery server never receives a model client. Wait for its real close
  // before reusing the owned port with the final, instance-relative policy.
  await stopChild(server); active();
  const permission = packetPermissions(workspace, worktree);
  const finalEnvironment = configuredEnvironment(config, permission);
  server = startServer(finalEnvironment);
  await ready(specification.url, server);
  if (nativePath(await metadata("/path", workspace), workspace) !== worktree) guard("native worktree changed after binding");
  const agents = await metadata("/agent", workspace), finalConfig = await metadata("/config", workspace);
  if (!Array.isArray(agents)) guard("native agents metadata is invalid");
  const builds = agents.filter(agent => agent?.name === "build");
  if (builds.length !== 1) guard("native build agent is not unique");
  verifyNativeAgentPolicy(builds[0], permission, false);
  if (!policyEquals(finalConfig?.permission, permission) || !policyEquals(finalConfig?.agent?.build?.permission, permission)) guard("final native configuration differs");
  active();
  const clientStartedAt = Date.now();
  client = track(spawn(specification.command, specification.clientArgv, { env: finalEnvironment, cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"] }));
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
  await cleanup(); process.exitCode = exitCode;
} catch (error) {
  let cleanupError = null;
  try { await cleanup(); } catch (failure) { cleanupError = failure; }
  // A cleanup rejection must not replace the original structured failure.
  // Keep both facts and never claim an unconfirmed child exit.
  emitFailure(supervisorFailureCode(error), null, cleanupError);
  if (serverError || error.message) process.stderr.write(`${serverError || error.message}\n`);
  process.exitCode = 1;
}
