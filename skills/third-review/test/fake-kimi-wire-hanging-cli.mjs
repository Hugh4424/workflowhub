#!/usr/bin/env node
import readline from "node:readline";

const send = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
const input = readline.createInterface({ input: process.stdin });
let initialized = false;
let heartbeat = null;

input.on("line", (line) => {
  const request = JSON.parse(line);
  if (request.method === "initialize") {
    initialized = true;
    send({ jsonrpc: "2.0", id: request.id, result: { protocol_version: "1.10" } });
    return;
  }
  if (request.method === "prompt" && initialized && !heartbeat) {
    let n = 0;
    heartbeat = setInterval(() => send({ jsonrpc: "2.0", method: "event", params: { type: "StepBegin", payload: { n: ++n } } }), 5);
  }
});
