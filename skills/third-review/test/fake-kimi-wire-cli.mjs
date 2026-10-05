#!/usr/bin/env node
import readline from "node:readline";

const session = "12345678-1234-1234-1234-123456789abc";
const send = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
const input = readline.createInterface({ input: process.stdin });
let initialized = false;

input.on("line", (line) => {
  const request = JSON.parse(line);
  if (request.method === "initialize") process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { protocol_version: "1.10" } })}\n`, () => { initialized = true; });
  if (request.method === "prompt") {
    if (!initialized) { send({ jsonrpc: "2.0", id: request.id, error: { code: -32600, message: "prompt arrived before initialize response" } }); return; }
    send({ jsonrpc: "2.0", method: "event", params: { type: "TurnBegin", payload: { user_input: request.params.user_input } } });
    send({ jsonrpc: "2.0", method: "event", params: { type: "StepBegin", payload: { n: 1 } } });
    send({ jsonrpc: "2.0", method: "event", params: { type: "ContentPart", payload: { type: "text", text: "WIRE_FIXTURE_OK" } } });
    send({ jsonrpc: "2.0", method: "event", params: { type: "TurnEnd", payload: {} } });
    send({ jsonrpc: "2.0", id: request.id, result: { status: "finished" } });
  }
});

input.on("close", () => process.stderr.write(`To resume this session: kimi -r ${session}\n`));
