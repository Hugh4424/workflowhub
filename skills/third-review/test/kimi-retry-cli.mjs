#!/usr/bin/env node
const session = "12345678-1234-1234-1234-123456789abc";
const send = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
process.stderr.write("APIEmptyResponseError: empty response\nAPIEmptyResponseError: empty response\n");
send({ role: "meta", type: "system.version", version: "0.40.1" });
send({ role: "assistant", content: "kimi opinion" });
send({ role: "meta", type: "session.resume_hint", session_id: session, command: `kimi -r ${session}` });
