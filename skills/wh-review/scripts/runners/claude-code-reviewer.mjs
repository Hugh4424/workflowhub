#!/usr/bin/env node
import { appendFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);
const SEVERITIES = new Set(["blocking", "important", "minor"]);
const arg = (name) => process.argv.slice(2).find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) || "";
const isFinding = (v) => v && typeof v === "object" && SEVERITIES.has(v.severity) && typeof v.file === "string" && v.file && Number.isInteger(v.line) && v.line > 0 && typeof v.issue === "string" && typeof v.recommendation === "string";
const isSkillResult = (v) => v && typeof v === "object" && typeof v.skill === "string" && v.skill && ["executed", "not_applicable", "unavailable", "failed"].includes(v.status) && typeof v.evidence === "string";
function isVerdict(v) {
  const keys = new Set(["verdict", "findings", "resolutionSummary", "skillResults"]);
  return v && typeof v === "object" && VERDICTS.has(v.verdict) && Array.isArray(v.findings) && v.findings.every(isFinding) && typeof v.resolutionSummary === "string" && Object.keys(v).every((k) => keys.has(k)) && (v.skillResults === undefined || (Array.isArray(v.skillResults) && v.skillResults.every(isSkillResult)));
}
function parseCandidate(candidate) {
  if (candidate === undefined) return null;
  try { const v = typeof candidate === "string" ? JSON.parse(candidate) : candidate; return isVerdict(v) ? v : null; } catch { return null; }
}
function verdictFromEvent(event) {
  for (const candidate of [event?.structured_output, event?.result, event]) {
    const verdict = parseCandidate(candidate); if (verdict) return verdict;
  }
  return null;
}
function failure(mode, reason, details = {}) {
  return { verdict: "escalate_to_human", findings: [], resolutionSummary: reason, actual_mode: "not_executed", provider: "claude-code", provider_cli: "claude", host: process.env.WH_REVIEW_HOST_AGENT || "codex", trueCrossEngine: false, reviewMode: "claude-code-cli", synthetic: true, execution_status: "failed", failure_reason: reason, requested_mode: mode, ...details };
}

const diffFile = arg("diff"), outputFile = arg("output");
if (!diffFile || !outputFile) { process.stderr.write("Usage: claude-code-reviewer.mjs --diff=<file> --output=<file>\n"); process.exit(2); }
const payload = JSON.parse(readFileSync(diffFile, "utf8"));
const mode = typeof payload.mode === "string" && payload.mode ? payload.mode : "full";
const schema = { type: "object", additionalProperties: false, properties: { verdict: { enum: [...VERDICTS] }, findings: { type: "array", items: { type: "object", additionalProperties: false, properties: { severity: { enum: [...SEVERITIES] }, file: { type: "string" }, line: { type: "integer", minimum: 1 }, issue: { type: "string" }, recommendation: { type: "string" } }, required: ["severity", "file", "line", "issue", "recommendation"] } }, resolutionSummary: { type: "string" }, skillResults: { type: "array", items: { type: "object", additionalProperties: false, properties: { skill: { type: "string" }, status: { enum: ["executed", "not_applicable", "unavailable", "failed"] }, evidence: { type: "string" } }, required: ["skill", "status", "evidence"] } } }, required: ["verdict", "findings", "resolutionSummary"] };
const prompt = `You are Claude Code acting as a heterologous reviewer.\n\nUse the REVIEW CONTRACT exactly. Review only the supplied MATERIALS.\nReturn the required JSON verdict; do not return markdown.\n\n## REVIEW CONTRACT\n\n${payload.contract}\n\n## MATERIALS\n\n${payload.materials}`;
const continuation = "Continue the interrupted review. Use the original review contract and materials already present in this session. Return only the required JSON verdict.";
const journal = `${outputFile}.journal.ndjson`, stateFile = `${outputFile}.state.json`;
let sessionId = null, resumeCount = 0, finalVerdict = null, currentChild = null, idleTimer = null, settled = false;
const idleMs = Math.max(1, Number(process.env.CLAUDE_CODE_REVIEW_IDLE_MS || 300000));
function persistState(status, extra = {}) { const tmp = `${stateFile}.${process.pid}.tmp`; writeFileSync(tmp, JSON.stringify({ status, session_id: sessionId, resume_count: resumeCount, updated_at: new Date().toISOString(), ...extra })); renameSync(tmp, stateFile); }
function record(event) { appendFileSync(journal, `${JSON.stringify({ at: new Date().toISOString(), type: event?.type || "unknown", subtype: event?.subtype, session_id: event?.session_id })}\n`); }
function stopChild(child) { if (!child || child.exitCode !== null) return; child.kill("SIGINT"); setTimeout(() => { if (child.exitCode === null) child.kill("SIGTERM"); }, 2000).unref(); }
function baseArgs() { return ["-p", "--bare", "--settings", process.env.CLAUDE_CODE_SETTINGS || join(homedir(), ".claude/settings.json"), "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--json-schema", JSON.stringify(schema)]; }
function run(input, resume = false) {
  return new Promise((resolve) => {
    const args = baseArgs(); if (resume) args.push("--resume", sessionId);
    const child = spawn(process.env.CLAUDE_CODE_BIN || "claude", args, { stdio: ["pipe", "pipe", "pipe"] }); currentChild = child;
    let buffer = "", stalled = false;
    const arm = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => { stalled = true; stopChild(child); }, idleMs); };
    const consume = (line) => { if (!line.trim()) return; let event; try { event = JSON.parse(line); } catch { return; } record(event); arm(); if (typeof event.session_id === "string" && event.session_id) sessionId = event.session_id; const v = verdictFromEvent(event); if (v) finalVerdict = v; persistState("running"); };
    child.stdout.on("data", (chunk) => { buffer += chunk; let i; while ((i = buffer.indexOf("\n")) >= 0) { consume(buffer.slice(0, i)); buffer = buffer.slice(i + 1); } });
    child.stderr.on("data", () => {});
    child.on("error", (error) => { clearTimeout(idleTimer); resolve({ error, stalled: false, code: null }); });
    child.on("close", (code, signal) => { consume(buffer); clearTimeout(idleTimer); resolve({ code, signal, stalled }); });
    child.stdin.end(input); arm();
  });
}
persistState("running");
let outcome = await run(prompt);
if (outcome.stalled && sessionId) { resumeCount = 1; persistState("resuming"); outcome = await run(continuation, true); }
let output;
if (outcome.stalled) output = failure(mode, resumeCount ? "claude-code-idle-after-resume" : "claude-code-idle-without-session", { session_id: sessionId, resume_count: resumeCount });
else if (outcome.error || outcome.code !== 0) output = failure(mode, "claude-code-non-zero-exit", { session_id: sessionId, resume_count: resumeCount, exit_status: outcome.code ?? null });
else if (!finalVerdict) output = failure(mode, "claude-code-output-unparseable", { session_id: sessionId, resume_count: resumeCount });
else output = { ...finalVerdict, actual_mode: mode, provider: "claude-code", provider_cli: "claude", host: process.env.WH_REVIEW_HOST_AGENT || "codex", trueCrossEngine: true, reviewMode: "claude-code-cli", synthetic: false, execution_status: "completed", session_id: sessionId, resume_count: resumeCount };
persistState(output.execution_status, { failure_reason: output.failure_reason });
writeFileSync(outputFile, JSON.stringify(output, null, 2));
