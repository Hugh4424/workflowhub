#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const value = (flag) => args[args.indexOf(flag) + 1];

if (args[0] === "serve") {
  const port = Number(value("--port"));
  const state = path.join(os.tmpdir(), `opencode-supervisor-${port}.json`);
  const delay = Number(process.env.OPENCODE_FIXTURE_DELAY_MS ?? 80);
  const mode = process.env.OPENCODE_FIXTURE_MODE ?? "complete";
  fs.rmSync(state, { force: true });
  setTimeout(() => fs.writeFileSync(state, "{}"), delay);
  const server = http.createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    if (request.url === "/global/health") return response.end(JSON.stringify({ healthy: true, version: "fixture" }));
    const completed = fs.existsSync(state);
    if (request.url === "/session/status") return response.end(JSON.stringify(completed ? {} : { fixture_session: { type: "busy" } }));
    if (request.url === "/session/fixture_session/message") return response.end(JSON.stringify(completed && mode === "no-terminal"
      ? [{ info: { id: "message_unknown", sessionID: "fixture_session", role: "assistant", finish: "unknown", time: { completed: 1 } }, parts: [{ id: "part_unknown", type: "step-finish", reason: "unknown" }] }]
      : completed && mode === "tool-only"
        ? [{ info: { id: "message_tool", sessionID: "fixture_session", role: "assistant", finish: "tool-calls", time: { completed: 1 } }, parts: [{ id: "part_tool", type: "tool", tool: "read", state: { status: "completed" } }, { id: "part_tool_finish", type: "step-finish", reason: "tool-calls" }] }]
      : completed
        ? [{ info: { id: "message_done", sessionID: "fixture_session", role: "assistant", finish: "stop", time: { completed: 1 } }, parts: [{ id: "part_text", type: "text", text: "FIXTURE_SUPERVISOR_OK" }, { id: "part_done", type: "step-finish", reason: "stop" }] }]
      : []));
    response.statusCode = 404; response.end("{}");
  });
  server.listen(port, "127.0.0.1");
  const stop = () => server.close(() => { fs.rmSync(state, { force: true }); process.exit(0); });
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
} else if (args[0] === "run") {
  console.log(JSON.stringify({ type: "step_start", sessionID: "fixture_session", part: { id: "part_start" } }));
  setTimeout(() => process.exit(0), 10);
} else if (args.includes("--version")) {
  console.log("fixture 1");
}
