#!/usr/bin/env node

const args = process.argv.slice(2);
const modelIndex = args.indexOf("--model");
const mode = modelIndex >= 0 ? args[modelIndex + 1] : "success";
const sessionIndex = args.indexOf("--session");
const session_id = "terminal-recovery-session";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (sessionIndex < 0) {
  if (mode === "deadline") await wait(25);
  if (mode === "no-session") {
    process.stderr.write('3RD_REVIEW_FAILURE {"version":1,"code":"PROVIDER_NO_TERMINAL_RESULT","session_id":null}\n');
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify({ type: "step_start", sessionID: session_id })}\n`);
  process.stderr.write(`3RD_REVIEW_FAILURE {"version":1,"code":"PROVIDER_NO_TERMINAL_RESULT","session_id":"${session_id}"}\n`);
  process.exit(1);
}

if (mode === "recovery-fail") {
  process.stdout.write(`${JSON.stringify({ type: "step_start", sessionID: session_id })}\n`);
  process.stderr.write(`3RD_REVIEW_FAILURE {"version":1,"code":"PROVIDER_NO_TERMINAL_RESULT","session_id":"${session_id}"}\n`);
  process.exit(1);
}

if (mode === "recovery-hang") {
  setInterval(() => {}, 1_000);
  await new Promise(() => {});
}

if (mode === "deadline") await wait(75);

const text = mode === "recovery-invalid" ? "```json\n{\"verdict\":\"pass\"}\n```" : mode === "recovery-mismatch" ? JSON.stringify({ verdict: "pass" }) : mode === "recovery-private" ? JSON.stringify({ verdict: "pass", source: "/private/recovery" }) : JSON.stringify({ verdict: "pass", source: "same-session-recovery" });
const recoveredSession = mode === "recovery-mismatch" ? "different-session" : session_id;
process.stdout.write(`${JSON.stringify({ type: "session.completed", session_id: recoveredSession, text })}\n`);
