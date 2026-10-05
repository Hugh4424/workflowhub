#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2); const value = (flag) => args[args.indexOf(flag) + 1];
if (args[0] === "serve") {
  const port = Number(value("--port")); const state = path.join(os.tmpdir(), `opencode-health-${port}.json`);
  const server = http.createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    if (request.url === "/global/health") return response.end(JSON.stringify({ healthy: true, version: "fixture" }));
    const current = fs.existsSync(state);
    if (request.url === "/session/status") return response.end(JSON.stringify(current ? {} : { fixture_session: { type: "busy" } }));
    if (request.url === "/session/fixture_session/message") return response.end(JSON.stringify(current ? [{ info: { id: "msg_done", sessionID: "fixture_session", role: "assistant", finish: "stop", time: { completed: 1 } }, parts: [{ id: "part_text", type: "text", text: "FIXTURE_APPROVED" }, { id: "part_done", type: "step-finish", reason: "stop" }] }] : []));
    response.statusCode = 404; response.end("{}");
  });
  server.listen(port, "127.0.0.1");
  const stop = () => server.close(() => { fs.rmSync(state, { force: true }); process.exit(0); });
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
} else if (args[0] === "run") {
  const port = Number(new URL(value("--attach")).port); const state = path.join(os.tmpdir(), `opencode-health-${port}.json`);
  if (args.includes("--session")) { setTimeout(() => fs.writeFileSync(state, "{}"), 20); setTimeout(() => process.exit(0), 40); }
  else {
  console.log(JSON.stringify({ type: "step_start", sessionID: "fixture_session", part: { id: "part_start" } }));
  setTimeout(() => fs.writeFileSync(state, "{}"), 20); setInterval(() => {}, 1_000);
  }
} else if (args.includes("--version")) console.log("fixture 1");
