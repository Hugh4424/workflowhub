import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import net from "node:net";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

const supervisor = migratedFilePath(new URL("../lib/adapters/opencode-supervised-cli.mjs", import.meta.url));

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

function fakeOpenCode(runtime) {
  const file = path.join(runtime, "fake-opencode.mjs");
  fs.writeFileSync(file, `#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
const args = process.argv.slice(2);
const value = (flag) => args[args.indexOf(flag) + 1];
const calls = process.env.FAKE_OPENCODE_CALLS;
if (args[0] === "serve") {
  const port = Number(value("--port"));
  const server = http.createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    if (request.url === "/global/health") return response.end(JSON.stringify({ healthy: true }));
    if (request.url === "/session/status") return response.end(JSON.stringify({}));
    if (request.url === "/session") {
      const mode = process.env.FAKE_OPENCODE_SESSION_MODE ?? "fresh";
      const sessions = mode === "stale"
        ? [{ id: "prompt_session", directory: process.env.FAKE_OPENCODE_DIR, time: { created: Date.now() - 60_000 } }]
        : mode === "ambiguous"
          ? [
              { id: "prompt_session_a", directory: process.env.FAKE_OPENCODE_DIR, time: { created: Date.now() } },
              { id: "prompt_session_b", directory: process.env.FAKE_OPENCODE_DIR, time: { created: Date.now() } },
            ]
          : [{ id: "prompt_session", directory: process.env.FAKE_OPENCODE_DIR, time: { created: Date.now() } }];
      return response.end(JSON.stringify(sessions));
    }
    if (request.url.startsWith("/session/") && request.url.endsWith("/message")) {
      const sessionID = request.url.slice("/session/".length, -"/message".length);
      return response.end(JSON.stringify([
      { info: { id: "message_done", sessionID, role: "assistant", finish: "stop", time: { completed: 1 } }, parts: [
        { id: "part_text", type: "text", text: "PROMPT_FORWARDING_OK" },
        { id: "part_done", type: "step-finish", reason: "stop" },
      ] },
      ]));
    }
    response.statusCode = 404;
    response.end("{}");
  });
  server.listen(port, "127.0.0.1");
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} else if (args[0] === "run") {
  let stdin = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { stdin += chunk; });
  process.stdin.on("end", () => {
    fs.writeFileSync(calls, JSON.stringify({ args: process.argv.slice(2), stdin }));
    if (process.env.FAKE_OPENCODE_NO_SESSION_OUTPUT !== "1") process.stdout.write(JSON.stringify({ type: "step_start", sessionID: "prompt_session" }) + "\\n");
    process.exit(0);
  });
}
`, { mode: 0o700 });
  fs.chmodSync(file, 0o700);
  return file;
}

async function runSupervisor(specification, environment, input) {
  const encoded = Buffer.from(JSON.stringify(specification), "utf8").toString("base64url");
  const child = spawn(process.execPath, [supervisor, encoded], {
    cwd: process.cwd(),
    env: { ...process.env, ...environment },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = ""; let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdin.end(input);
  const code = await new Promise((resolve) => child.once("close", resolve));
  return { code, stdout, stderr };
}

test("OpenCode supervisor forwards the complete prompt through stdin", async () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-prompt-forwarding-"));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort();
    const result = await runSupervisor({ command, url: `http://127.0.0.1:${port}`, port, clientArgv: ["run", "--attach", `http://127.0.0.1:${port}`], workspace: runtime }, { FAKE_OPENCODE_CALLS: calls }, "PROMPT_FORWARDING_SENTINEL");
    assert.equal(result.code, 0, result.stderr); assert.match(result.stdout, /PROMPT_FORWARDING_OK/);
    const call = JSON.parse(fs.readFileSync(calls, "utf8")); assert.equal(call.args.includes("PROMPT_FORWARDING_SENTINEL"), false); assert.equal(call.stdin, "PROMPT_FORWARDING_SENTINEL");
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});

test("OpenCode supervisor discovers a session when attached CLI emits no session event", async () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-session-discovery-"));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort(); const url = `http://127.0.0.1:${port}`;
    const result = await runSupervisor({ command, url, port, clientArgv: ["run", "--attach", url, "--dir", runtime], workspace: runtime }, { FAKE_OPENCODE_CALLS: calls, FAKE_OPENCODE_DIR: runtime, FAKE_OPENCODE_NO_SESSION_OUTPUT: "1" }, "SESSION_DISCOVERY_SENTINEL");
    assert.equal(result.code, 0, result.stderr); assert.match(result.stdout, /PROMPT_FORWARDING_OK/);
    const call = JSON.parse(fs.readFileSync(calls, "utf8")); assert.equal(call.stdin, "SESSION_DISCOVERY_SENTINEL");
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});

test("OpenCode supervisor rejects a stale session discovered after client exit", async () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-stale-session-"));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort(); const url = `http://127.0.0.1:${port}`;
    const result = await runSupervisor({ command, url, port, clientArgv: ["run", "--attach", url, "--dir", runtime], workspace: runtime }, {
      FAKE_OPENCODE_CALLS: calls,
      FAKE_OPENCODE_DIR: runtime,
      FAKE_OPENCODE_NO_SESSION_OUTPUT: "1",
      FAKE_OPENCODE_SESSION_MODE: "stale",
    }, "STALE_SESSION_SENTINEL");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SESSION_UNKNOWN/);
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});

test("OpenCode supervisor rejects ambiguous fresh session discovery", async () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-ambiguous-session-"));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort(); const url = `http://127.0.0.1:${port}`;
    const result = await runSupervisor({ command, url, port, clientArgv: ["run", "--attach", url, "--dir", runtime], workspace: runtime }, {
      FAKE_OPENCODE_CALLS: calls,
      FAKE_OPENCODE_DIR: runtime,
      FAKE_OPENCODE_NO_SESSION_OUTPUT: "1",
      FAKE_OPENCODE_SESSION_MODE: "ambiguous",
    }, "AMBIGUOUS_SESSION_SENTINEL");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SESSION_UNKNOWN/);
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});
