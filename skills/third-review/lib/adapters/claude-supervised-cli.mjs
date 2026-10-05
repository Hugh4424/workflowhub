#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const specification = JSON.parse(Buffer.from(process.argv[2], "base64url").toString("utf8"));
const originalPrompt = await new Promise((resolve) => {
  let value = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { value += chunk; });
  process.stdin.on("end", () => resolve(value));
});

const maxContinuations = 2;
const continuationPrompt = "Continue this same review session. The previous turn produced no visible final response or an upstream timeout. Do not restart or reread material already inspected. Finish the review now and return the requested final response as visible assistant text.";
let child = null;
let stopping = false;
const expectedSession = { value: specification.session ?? null };
const settingsEnvironment = (() => {
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(process.env.HOME, ".claude", "settings.json"), "utf8"));
    const allowed = new Set(["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_DEFAULT_HAIKU_MODEL", "ANTHROPIC_DEFAULT_OPUS_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "ANTHROPIC_MODEL"]);
    return Object.fromEntries(Object.entries(settings.env ?? {}).filter(([key, value]) => allowed.has(key) && typeof value === "string"));
  } catch { return {}; }
})();
const commandPath = specification.command.includes("/") ? specification.command : process.env.PATH?.split(path.delimiter).map((directory) => path.join(directory, specification.command)).find((candidate) => { try { fs.accessSync(candidate, fs.constants.X_OK); return true; } catch { return false; } });
if (!commandPath) throw new Error(`Claude Code executable is unavailable: ${specification.command}`);
const realCommand = fs.realpathSync(commandPath);

function terminal(line) {
  try {
    const value = JSON.parse(line);
    if (value?.type !== "result") return null;
    const text = typeof value.result === "string" ? value.result.trim() : "";
    const retryable = !text || value.api_error_status === 524 || /\b(?:API Error:\s*)?524\b|origin_response_timeout/i.test(text);
    return { value, retryable };
  } catch { return null; }
}

function run(attempt, session = null) {
  return new Promise((resolve) => {
    const providerArgv = session ? ["--resume", session, ...specification.argv] : specification.argv;
    child = spawn(realCommand, providerArgv, { cwd: specification.cwd, env: { ...settingsEnvironment, ...process.env }, stdio: ["pipe", "pipe", "pipe"] });
    let buffer = ""; let retry = null;
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/); buffer = lines.pop();
      for (const line of lines) {
        const result = terminal(line);
        if (result?.value?.session_id && expectedSession.value && result.value.session_id !== expectedSession.value) { process.stderr.write("Claude Code resume changed session identity\n"); stopping = true; continue; }
        if (result?.value?.session_id && !expectedSession.value) expectedSession.value = result.value.session_id;
        if (result?.retryable && attempt < maxContinuations && result.value.session_id && !stopping) { retry = result.value.session_id; continue; }
        process.stdout.write(`${line}\n`);
      }
    });
    child.stderr.pipe(process.stderr, { end: false });
    child.once("error", (error) => { process.stderr.write(`${error.message}\n`); resolve({ code: 1, retry: null }); });
    child.once("close", (code, signal) => {
      if (buffer) {
        const result = terminal(buffer);
        const mismatch = result?.value?.session_id && expectedSession.value && result.value.session_id !== expectedSession.value;
        if (mismatch) { process.stderr.write("Claude Code resume changed session identity\n"); stopping = true; }
        else {
          if (result?.value?.session_id && !expectedSession.value) expectedSession.value = result.value.session_id;
          if (result?.retryable && attempt < maxContinuations && result.value.session_id && !stopping) retry = result.value.session_id;
          else process.stdout.write(buffer);
        }
      }
      resolve({ code: stopping || signal ? 1 : (code ?? 1), retry: stopping ? null : retry });
    });
    child.stdin.end(session ? continuationPrompt : originalPrompt);
  });
}

for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(signal, () => { stopping = true; child?.kill(signal); });

for (let attempt = 0, session = specification.session ?? null; ; attempt += 1) {
  const result = await run(attempt, session);
  if (stopping || !result.retry) process.exit(result.code);
  session = result.retry;
}
