#!/usr/bin/env node
import { appendFileSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { homedir, platform } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { ArtifactReviewPackageError, verifyArtifactReviewPackage } from "../artifact-review-package.mjs";

const VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);
const SEVERITIES = new Set(["blocking", "important", "minor"]);
const SKILL_STATUSES = new Set(["executed", "not_applicable", "unavailable", "failed"]);
const arg = (name) => process.argv.slice(2).find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) || "";
const isFinding = (v) => v && typeof v === "object" && SEVERITIES.has(v.severity) && typeof v.file === "string" && v.file && Number.isInteger(v.line) && v.line > 0 && typeof v.issue === "string" && typeof v.recommendation === "string";
const isSkillResult = (v) => v && typeof v === "object" && typeof v.skill === "string" && v.skill.trim() && SKILL_STATUSES.has(v.status) && typeof v.evidence === "string" && v.evidence.trim();
const COVERAGE_STATUSES = new Set(["read", "failed"]);
const PACKAGE_FAILURES = new Set(["artifact-package-invalid", "artifact-package-escape", "artifact-package-tampered"]);
const packageFailureCode = (error) => PACKAGE_FAILURES.has(error?.code) ? error.code : "artifact-package-invalid";
const isCoverageResult = (v) => v && typeof v === "object" && typeof v.id === "string" && v.id && /^[a-f0-9]{64}$/.test(v.sha256) && COVERAGE_STATUSES.has(v.status) && typeof v.evidence === "string" && v.evidence.trim();
function requiredSkillsFromContract(contract) {
  const match = contract.match(/<!--\s*wh-review-skills:\s*(\{[^\n]*\})\s*-->/);
  if (!match) return [];
  try {
    const manifest = JSON.parse(match[1]);
    return Array.isArray(manifest.required) && manifest.required.every((skill) => typeof skill === "string" && skill.trim())
      ? manifest.required
      : [];
  } catch { return []; }
}
function hasValidSkillCoverage(v, requiredSkills) {
  if (!Array.isArray(v.skillResults) || !v.skillResults.every(isSkillResult)) return false;
  const required = new Set(requiredSkills);
  const observed = v.skillResults.map(({ skill }) => skill);
  if (new Set(observed).size !== observed.length || observed.some((skill) => !required.has(skill))) return false;
  // A dependency failure may itself prevent the reviewer from producing every
  // required lens. Escalation therefore accepts a well-formed subset, while a
  // pass/revise verdict must prove the complete manifest closure.
  if (v.verdict === "escalate_to_human") return true;
  if (observed.length !== required.size || !requiredSkills.every((skill) => observed.includes(skill))) return false;
  return v.skillResults.every(({ skill, status }) => status === "executed" || (skill === "plan-design-review" && status === "not_applicable"));
}
function hasValidArtifactCoverage(v, expectedEntries, hostAttestation) {
  if (!expectedEntries) return v.artifactCoverage === undefined;
  if (!Array.isArray(v.artifactCoverage) || v.artifactCoverage.length === 0 || !v.artifactCoverage.every(isCoverageResult)) return false;
  const expected = new Map(expectedEntries.map((item) => [item.id, item.sha256]));
  const attested = new Map(hostAttestation.map((item) => [item.id, item]));
  const observed = v.artifactCoverage.map((item) => item.id);
  if (new Set(observed).size !== observed.length || observed.some((id) => !expected.has(id))) return false;
  if (v.artifactCoverage.some((item) => expected.get(item.id) !== item.sha256)) return false;
  if (observed.length !== attested.size || observed.some((id) => !attested.has(id))) return false;
  if (v.artifactCoverage.some((item) => attested.get(item.id).sha256 !== item.sha256 || attested.get(item.id).status !== item.status)) return false;
  if (v.verdict === "escalate_to_human") return true;
  return observed.length === expected.size && [...expected.keys()].every((id) => observed.includes(id)) && v.artifactCoverage.every((item) => item.status === "read");
}
function isVerdict(v, requiredSkills, expectedEntries, hostAttestation = []) { const keys = new Set(["verdict", "findings", "resolutionSummary", "skillResults", ...(expectedEntries ? ["artifactCoverage"] : [])]); return v && typeof v === "object" && VERDICTS.has(v.verdict) && Array.isArray(v.findings) && v.findings.every(isFinding) && typeof v.resolutionSummary === "string" && Object.keys(v).every((k) => keys.has(k)) && hasValidSkillCoverage(v, requiredSkills) && hasValidArtifactCoverage(v, expectedEntries, hostAttestation); }
function parseJsonCandidate(v) { try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return null; } }
function candidatesFromEvent(event) { return [event?.structured_output, event?.result, event].map(parseJsonCandidate).filter((candidate) => candidate && typeof candidate === "object"); }
function verdictFromEvent(event, requiredSkills, expectedEntries, hostAttestation) { for (const candidate of candidatesFromEvent(event)) if (isVerdict(candidate, requiredSkills, expectedEntries, hostAttestation)) return candidate; return null; }
function failure(mode, reason, details = {}) { return { verdict: "escalate_to_human", findings: [], resolutionSummary: reason, actual_mode: "not_executed", provider: "claude-code", provider_cli: "claude", host: process.env.WH_REVIEW_HOST_AGENT || "codex", trueCrossEngine: false, reviewMode: "claude-code-cli", synthetic: true, execution_status: "failed", failure_reason: reason, requested_mode: mode, ...details }; }

const diffFile = arg("diff"), outputFile = arg("output"), stateDir = arg("state-dir");
if (!diffFile || !outputFile || !stateDir) { process.stderr.write("Usage: claude-code-reviewer.mjs --diff=<file> --output=<file> --state-dir=<dir>\n"); process.exit(2); }
const payload = JSON.parse(readFileSync(diffFile, "utf8"));
const mode = typeof payload.mode === "string" && payload.mode ? payload.mode : "full";
let artifactPackage = null;
if (payload.artifact_manifest) {
  try {
    if (!/^[a-f0-9]{64}$/.test(payload.artifact_manifest.content_hash) || !Array.isArray(payload.artifact_manifest.entries)) {
      throw new ArtifactReviewPackageError("artifact-package-invalid", "payload manifest descriptor is invalid");
    }
    artifactPackage = verifyArtifactReviewPackage({
      packageRoot: payload.artifact_manifest.package_root,
      manifestPath: payload.artifact_manifest.manifest_path,
      expectedContentHash: payload.artifact_manifest.content_hash,
      trustedRoot: join(dirname(dirname(stateDir)), ".claude-review-packages"),
    });
    if (JSON.stringify(payload.artifact_manifest.entries) !== JSON.stringify(artifactPackage.manifest.entries)) {
      throw new ArtifactReviewPackageError("artifact-package-tampered", "payload manifest entries do not match persisted manifest");
    }
  } catch (error) {
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, JSON.stringify(failure(mode, packageFailureCode(error)), null, 2));
    process.exit(0);
  }
}
const contractEntry = artifactPackage?.manifest.entries.find((item) => item.id === "contract");
const contractText = artifactPackage ? readFileSync(join(artifactPackage.packageRoot, contractEntry.path), "utf8") : (payload.contract || "");
const expectedEntries = artifactPackage?.manifest.entries || null;
function fileLines(path) {
  const text = readFileSync(path, "utf8");
  if (text.length === 0) return [];
  const lines = text.split("\n");
  if (text.endsWith("\n")) lines.pop();
  return lines.map((line) => line.endsWith("\r") ? line.slice(0, -1) : line);
}
const expectedPathEntries = new Map((expectedEntries || []).map((item) => {
  const path = realpathSync(join(artifactPackage.packageRoot, item.read_path || item.path));
  return [path, { item, lines: fileLines(path) }];
}));
const pendingReads = new Map();
const readCoverage = new Map((expectedEntries || []).map((item) => [item.id, { ranges: [], failed: false, emptyRead: false }]));
let attestationInvalid = false;
function mergeRanges(ranges) {
  const merged = [];
  for (const [start, end] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const last = merged.at(-1);
    if (!last || start > last[1] + 1) merged.push([start, end]);
    else last[1] = Math.max(last[1], end);
  }
  return merged;
}
function hostAttestation() {
  if (!artifactPackage || attestationInvalid) return [];
  const result = [];
  for (const item of expectedEntries) {
    const stateForEntry = readCoverage.get(item.id);
    const ranges = mergeRanges(stateForEntry.ranges);
    const complete = item.lines === 0 ? stateForEntry.emptyRead : ranges.length === 1 && ranges[0][0] === 1 && ranges[0][1] >= item.lines;
    if (complete) result.push({ id: item.id, sha256: item.sha256, status: "read", lines: item.lines, ranges });
    else if (stateForEntry.failed) result.push({ id: item.id, sha256: item.sha256, status: "failed", lines: item.lines, ranges });
  }
  return result;
}
function coverageSnapshot() {
  return Object.fromEntries([...readCoverage].map(([id, value]) => [id, { ranges: mergeRanges(value.ranges), failed: value.failed, emptyRead: value.emptyRead }]));
}
function restoreCoverage(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  for (const [id, saved] of Object.entries(snapshot)) {
    const current = readCoverage.get(id);
    const entry = expectedEntries.find((item) => item.id === id);
    if (!current || !entry || !saved || typeof saved !== "object" || !Array.isArray(saved.ranges) || saved.ranges.some((range) => !Array.isArray(range) || range.length !== 2 || !range.every(Number.isInteger) || range[0] < 1 || range[1] < range[0] || range[1] > entry.lines) || typeof saved.failed !== "boolean" || typeof saved.emptyRead !== "boolean") { attestationInvalid = true; continue; }
    current.ranges = mergeRanges(saved.ranges);
    current.failed = saved.failed === true;
    current.emptyRead = saved.emptyRead === true;
  }
}
function actualReadRanges(content, pending) {
  if (typeof content !== "string") return null;
  if (pending.entry.item.lines === 0) return content === "" ? [] : null;
  const rawLines = content.split("\n");
  const ranges = [];
  let previous = null;
  for (let index = 0; index < rawLines.length; index += 1) {
    const match = rawLines[index].match(/^\s*(\d+)(?:\t|→)(.*)$/u);
    if (!match) {
      const trailing = rawLines.slice(index).join("\n");
      if (/^<system-reminder>[^]*<\/system-reminder>\s*$/u.test(trailing)) break;
      return null;
    }
    const line = Number(match[1]);
    if (!Number.isSafeInteger(line) || line < pending.offset || (Number.isFinite(pending.limit) && line >= pending.offset + pending.limit) || (previous !== null && line !== previous + 1) || line > pending.entry.lines.length || match[2] !== pending.entry.lines[line - 1]) return null;
    ranges.push([line, line]); previous = line;
  }
  return ranges.length ? ranges : null;
}
function observeReadEvents(event) {
  if (!artifactPackage || !event || typeof event !== "object") return;
  if (event.type === "assistant") {
    if (event.message?.role !== "assistant" || !Array.isArray(event.message.content)) return;
    for (const block of event.message.content) {
      if (block?.type !== "tool_use" || block.name !== "Read") continue;
      const { id, input } = block;
      const offset = input?.offset === undefined ? 1 : input.offset;
      const limit = input?.limit === undefined ? Number.POSITIVE_INFINITY : input.limit;
      if (typeof id !== "string" || !id || pendingReads.has(id) || !input || typeof input !== "object" || typeof input.file_path !== "string" || !isAbsolute(input.file_path) || !Number.isInteger(offset) || offset < 1 || !(limit === Number.POSITIVE_INFINITY || (Number.isInteger(limit) && limit > 0))) {
        attestationInvalid = true;
        continue;
      }
      let entry;
      try { entry = expectedPathEntries.get(realpathSync(resolve(input.file_path))); } catch {}
      pendingReads.set(id, entry ? { entry, offset, limit } : null);
      if (entry) record("read_tool_use", { entry_id: entry.item.id, offset, ...(Number.isFinite(limit) ? { limit } : {}) });
    }
  } else if (event.type === "user") {
    if (event.message?.role !== "user" || !Array.isArray(event.message.content)) return;
    for (const block of event.message.content) {
      if (block?.type !== "tool_result") continue;
      const pending = pendingReads.get(block.tool_use_id);
      if (!pendingReads.has(block.tool_use_id) || (block.is_error !== undefined && typeof block.is_error !== "boolean")) {
        attestationInvalid = true;
        continue;
      }
      pendingReads.delete(block.tool_use_id);
      if (!pending) continue;
      const stateForEntry = readCoverage.get(pending.entry.item.id);
      if (block.is_error === true) stateForEntry.failed = true;
      else {
        const actual = actualReadRanges(block.content, pending);
        if (actual === null) attestationInvalid = true;
        else if (pending.entry.item.lines === 0) stateForEntry.emptyRead = true;
        else stateForEntry.ranges.push(...actual);
      }
      record("read_tool_result", { entry_id: pending.entry.item.id, status: block.is_error === true ? "failed" : "success" });
      persist(state.status, { artifact_coverage: coverageSnapshot(), artifact_manifest_hash: artifactPackage.manifest.content_hash });
    }
  }
}
const requiredSkills = requiredSkillsFromContract(contractText);
const inputHash = payload.input_hash || createHash("sha256").update(JSON.stringify({ mode: payload.mode, contract: payload.contract, materials: payload.materials, artifact_manifest: payload.artifact_manifest })).digest("hex");
const coverageProperty = { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" }, status: { enum: [...COVERAGE_STATUSES] }, evidence: { type: "string", minLength: 1 } }, required: ["id", "sha256", "status", "evidence"] } };
const schema = { type: "object", additionalProperties: false, properties: { verdict: { enum: [...VERDICTS] }, findings: { type: "array", items: { type: "object", additionalProperties: false, properties: { severity: { enum: [...SEVERITIES] }, file: { type: "string" }, line: { type: "integer", minimum: 1 }, issue: { type: "string" }, recommendation: { type: "string" } }, required: ["severity", "file", "line", "issue", "recommendation"] } }, resolutionSummary: { type: "string" }, skillResults: { type: "array", items: { type: "object", additionalProperties: false, properties: { skill: { type: "string" }, status: { enum: [...SKILL_STATUSES] }, evidence: { type: "string", minLength: 1 } }, required: ["skill", "status", "evidence"] } }, ...(artifactPackage ? { artifactCoverage: coverageProperty } : {}) }, required: ["verdict", "findings", "resolutionSummary", "skillResults", ...(artifactPackage ? ["artifactCoverage"] : [])] };
const prompt = artifactPackage
  ? `You are Claude Code acting as a heterologous reviewer.\n\nThe complete, immutable review package is at ${artifactPackage.packageRoot}. Use only the Read tool. Read ${artifactPackage.manifestPath} first, then read every manifest entry in full using explicit 1-based offset and positive limit values. Chunk large files until every declared line is covered. The host independently verifies package hashes before and after review and attests only successful Read ranges; your artifactCoverage must exactly match that observed evidence. The contract entry is authoritative; required_skill entries are report-only lenses and must not cause writes or side effects. Review only the materials entry. Do not omit or summarize source material.\n\nReturn only the required JSON verdict. For pass/revise_required, artifactCoverage must contain every manifest id exactly once with its declared sha256, status=read, and concrete non-empty evidence. For escalate_to_human, a well-formed attested subset with status read/failed is allowed.\n\nManifest content hash: ${artifactPackage.manifest.content_hash}\nManifest entries: ${artifactPackage.manifest.entries.map(({ id, path, bytes, lines, sha256 }) => `${id}|${path}|${bytes}|${lines}|${sha256}`).join("\n")}`
  : `You are Claude Code acting as a heterologous reviewer.\n\nUse the REVIEW CONTRACT exactly. Review only the supplied MATERIALS.\nReturn the required JSON verdict; do not return markdown.\n\n## REVIEW CONTRACT\n\n${payload.contract}\n\n## MATERIALS\n\n${payload.materials}`;
const continuation = "Continue the interrupted review. Use the original review contract and materials already present in this session. Return only the required JSON verdict.";
mkdirSync(stateDir, { recursive: true });
const stateFile = join(stateDir, "state.json"), journal = join(stateDir, "journal.ndjson");
const idleMs = Math.max(1, Number(process.env.CLAUDE_CODE_REVIEW_IDLE_MS || 300000));
const graceMs = Math.max(10, Number(process.env.CLAUDE_CODE_REVIEW_STOP_GRACE_MS || 2000));
const maxBuffer = Math.max(1024, Number(process.env.CLAUDE_CODE_REVIEW_BUFFER_MAX_BYTES || 4 * 1024 * 1024));
let state = { input_hash: inputHash, session_id: null, resume_count: 0, attempt: 0, attempt_id: null, phase: "idle", status: "new" };
try { const old = JSON.parse(readFileSync(stateFile, "utf8")); if (old.input_hash === inputHash && typeof old.session_id === "string" && old.session_id && old.status !== "completed") state = { ...state, ...old }; else if (old.input_hash !== inputHash) appendFileSync(journal, `${JSON.stringify({ at: new Date().toISOString(), type: "state_hash_mismatch", expected_hash: inputHash, observed_hash: old.input_hash })}\n`); } catch {}
if (artifactPackage && state.artifact_coverage) {
  if (state.artifact_manifest_hash !== artifactPackage.manifest.content_hash) attestationInvalid = true;
  else restoreCoverage(state.artifact_coverage);
}
let currentChild = null, idleTimer = null, shuttingDown = false;
// POSIX rename-over-target is atomic. Windows does not guarantee that operation,
// so use a recoverable swap: preserve the old file until the replacement lands.
// The Windows path is crash-consistent best effort (a .bak may remain), but never
// deliberately creates the old implementation's "no target file" window.
function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const nonce = `${process.pid}.${Date.now()}`;
  const tmp = `${path}.${nonce}.tmp`, backup = `${path}.${nonce}.bak`;
  writeFileSync(tmp, value);
  if (platform() !== "win32") { try { renameSync(tmp, path); } catch (error) { rmSync(tmp, { force: true }); throw error; } return; }
  let preserved = false;
  try {
    try { renameSync(path, backup); preserved = true; } catch (error) { if (error.code !== "ENOENT") throw error; }
    renameSync(tmp, path);
    if (preserved) rmSync(backup, { force: true });
  } catch (error) {
    if (preserved) { try { renameSync(backup, path); } catch {} }
    rmSync(tmp, { force: true });
    throw error;
  }
}
function persist(status, extra = {}) { state = { ...state, status, updated_at: new Date().toISOString(), ...extra }; atomicWrite(stateFile, JSON.stringify(state)); }
function record(type, meta = {}) { appendFileSync(journal, `${JSON.stringify({ at: new Date().toISOString(), type, attempt: state.attempt, attempt_id: state.attempt_id, phase: state.phase, ...meta })}\n`); }
function stopChild(child) { return new Promise((resolve) => { if (!child || child.exitCode !== null || child.signalCode) return resolve(); let done = false; const finish = () => { if (!done) { done = true; resolve(); } }; child.once("close", finish); const send = (signal) => { try { child.kill(signal); record("stop_signal", { signal }); } catch (error) { record("stop_signal_error", { signal, code: error.code }); } }; send("SIGINT"); const term = setTimeout(() => send("SIGTERM"), graceMs); const kill = setTimeout(() => { send("SIGKILL"); setTimeout(finish, graceMs).unref(); }, graceMs * 2); child.once("close", () => { clearTimeout(term); clearTimeout(kill); }); }); }
function baseArgs() { return ["-p", "--bare", "--settings", process.env.CLAUDE_CODE_SETTINGS || join(homedir(), ".claude/settings.json"), "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--json-schema", JSON.stringify(schema)]; }
const ERROR_CATEGORIES = new Map([
  ["prompt_too_long", "prompt_too_long"],
  ["authentication_failed", "authentication"],
  ["rate_limit", "rate_limit"],
  ["permission_denied", "permission"],
  ["overloaded", "overloaded"],
  ["invalid_request", "invalid_request"],
]);
const SAFE_SUBTYPES = new Set(["success", "error_during_execution", "error_max_turns", "error_max_budget_usd", "error_max_structured_output_retries", "interrupted"]);
const SAFE_STOP_REASONS = new Set(["end_turn", "max_tokens", "stop_sequence", "tool_use", "error"]);
const SAFE_EVENT_TYPES = new Set(["system", "assistant", "user", "result", "stream_event"]);
const safeSessionId = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : undefined;
function terminalDiagnostics(event) {
  if (!event || typeof event !== "object" || event.type !== "result") return {};
  return {
    ...(ERROR_CATEGORIES.has(event.error_code) ? { error_category: ERROR_CATEGORIES.get(event.error_code) } : {}),
    ...(SAFE_SUBTYPES.has(event.subtype) ? { terminal_subtype: event.subtype } : {}),
    ...(SAFE_STOP_REASONS.has(event.stop_reason) ? { stop_reason: event.stop_reason } : {}),
  };
}
function verifyPackageAfterReview() {
  if (!artifactPackage) return;
  const verified = verifyArtifactReviewPackage({
    packageRoot: payload.artifact_manifest.package_root,
    manifestPath: payload.artifact_manifest.manifest_path,
    expectedContentHash: payload.artifact_manifest.content_hash,
    trustedRoot: join(dirname(dirname(stateDir)), ".claude-review-packages"),
  });
  if (JSON.stringify(payload.artifact_manifest.entries) !== JSON.stringify(verified.manifest.entries)) {
    throw new ArtifactReviewPackageError("artifact-package-tampered", "post-review manifest entries changed");
  }
}
async function run(input, resume) {
  state.attempt += 1;
  state.attempt_id = `${inputHash.slice(0, 12)}-${state.attempt}`;
  state.phase = resume ? "resume_running" : "initial_running";
  persist(resume ? "resuming" : "running"); record("attempt_start", { resume, input_bytes: Buffer.byteLength(input), input_hash: createHash("sha256").update(input).digest("hex") });
  let attemptVerdict = null, acceptedAttestation = [], validationFailure = null, buffer = "", stalled = false, terminalSeen = false, safeTerminal = {};
  return new Promise((resolve) => {
    let resolved = false; const settle = (value) => { if (!resolved) { resolved = true; clearTimeout(idleTimer); resolve({ ...value, verdict: attemptVerdict, artifact_attestation: acceptedAttestation, validation_failure: validationFailure, terminal_diagnostics: safeTerminal }); } };
    const args = baseArgs(); if (resume) args.push("--resume", state.session_id); if (artifactPackage) args.push("--tools", "Read", "--add-dir", artifactPackage.packageRoot);
    const child = spawn(process.env.CLAUDE_CODE_BIN || "claude", args, { stdio: ["pipe", "pipe", "pipe"] }); currentChild = child;
    const arm = () => { clearTimeout(idleTimer); idleTimer = setTimeout(async () => { stalled = true; record("idle_timeout"); await stopChild(child); settle({ stalled: true, code: child.exitCode, signal: child.signalCode }); }, idleMs); };
    const consume = (line) => {
      if (!line.trim()) return;
      if (Buffer.byteLength(line) > maxBuffer) { record("line_too_large", { bytes: Buffer.byteLength(line) }); return; }
      let event;
      try { event = JSON.parse(line); } catch { record("parse_anomaly", { bytes: Buffer.byteLength(line) }); return; }
      record("event", { event_type: SAFE_EVENT_TYPES.has(event?.type) ? event.type : "unknown", ...(SAFE_SUBTYPES.has(event?.subtype) ? { subtype: event.subtype } : {}), ...(safeSessionId(event?.session_id) ? { session_id: safeSessionId(event.session_id) } : {}) });
      if (safeSessionId(event?.session_id)) { state.session_id = safeSessionId(event.session_id); persist(state.status); }
      observeReadEvents(event);
      safeTerminal = { ...safeTerminal, ...terminalDiagnostics(event) };
      const attestation = hostAttestation();
      const verdict = verdictFromEvent(event, requiredSkills, expectedEntries, attestation);
      if (verdict) {
        try { verifyPackageAfterReview(); }
        catch (error) { validationFailure = packageFailureCode(error); terminalSeen = true; void stopChild(child).then(() => settle({ code: child.exitCode ?? 0, signal: child.signalCode, terminalSeen: true })); return; }
        attemptVerdict = artifactPackage ? {
          ...verdict,
          artifactCoverage: attestation.map((item) => ({
            id: item.id,
            sha256: item.sha256,
            status: item.status,
            evidence: `host-attested Read ${item.status}; lines=${item.lines}; ranges=${item.ranges.map(([start, end]) => `${start}-${end}`).join(",") || "none"}`,
          })),
        } : verdict;
        acceptedAttestation = attestation;
        terminalSeen = true;
        persist("terminal_observed");
        void stopChild(child).then(() => settle({ code: child.exitCode ?? 0, signal: child.signalCode, terminalSeen: true }));
      } else if (artifactPackage && candidatesFromEvent(event).some((candidate) => VERDICTS.has(candidate.verdict))) {
        validationFailure = "artifact-coverage-unattested";
        terminalSeen = true;
        void stopChild(child).then(() => settle({ code: child.exitCode ?? 0, signal: child.signalCode, terminalSeen: true }));
      }
    };
    child.stdout.on("data", (chunk) => { arm(); buffer += chunk; if (Buffer.byteLength(buffer) > maxBuffer) { record("buffer_overflow", { bytes: Buffer.byteLength(buffer) }); buffer = ""; } let i; while ((i = buffer.indexOf("\n")) >= 0) { consume(buffer.slice(0, i)); buffer = buffer.slice(i + 1); } });
    child.stderr.on("data", (chunk) => { arm(); record("stderr_activity", { bytes: chunk.length }); });
    child.on("error", (error) => { record("spawn_error", { code: error.code }); settle({ error, code: null }); });
    child.on("close", (code, signal) => { consume(buffer); state.phase = "attempt_settled"; persist(state.status); record("child_close", { code, signal, stalled, terminalSeen }); settle({ code, signal, stalled, terminalSeen }); });
    child.stdin.on("error", (error) => { record("stdin_error", { code: error.code }); if (error.code !== "EPIPE") settle({ error, code: null }); });
    try { child.stdin.end(input); } catch (error) { record("stdin_error", { code: error.code }); settle({ error, code: null }); }
    arm();
  });
}
async function onSignal(signal) { if (shuttingDown) return; shuttingDown = true; clearTimeout(idleTimer); persist("interrupted", { signal }); record("runner_signal", { signal }); await stopChild(currentChild); process.exit(signal === "SIGINT" ? 130 : 143); }
process.on("SIGINT", () => void onSignal("SIGINT")); process.on("SIGTERM", () => void onSignal("SIGTERM"));

// resume_count is a persisted lifetime budget, not a per-process retry counter.
// A restarted runner cannot attach to an already-started recovery child. If the
// one recovery was consumed, fail closed instead of silently launching another.
let startupResume = Boolean(state.session_id);
let outcome;
if (startupResume && state.resume_count >= 1) {
  state.phase = "recovery_budget_exhausted";
  persist("failed", { failure_reason: "claude-code-resume-budget-exhausted" });
  record("resume_budget_exhausted", { resume_count: state.resume_count });
  outcome = { recoveryBudgetExhausted: true, code: null };
} else {
  if (startupResume) { state.resume_count += 1; state.phase = "resume_reserved"; persist("resuming"); }
  outcome = await run(startupResume ? continuation : prompt, startupResume);
  if (outcome.stalled && state.session_id && state.resume_count < 1) {
    state.resume_count += 1; state.phase = "resume_reserved"; persist("resuming");
    outcome = await run(continuation, true);
  }
}
let output;
if (outcome.recoveryBudgetExhausted) output = failure(mode, "claude-code-resume-budget-exhausted", { session_id: state.session_id, resume_count: state.resume_count });
else if (outcome.stalled) output = failure(mode, state.resume_count ? "claude-code-idle-after-resume" : "claude-code-idle-without-session", { session_id: state.session_id, resume_count: state.resume_count });
else if (outcome.validation_failure) output = failure(mode, outcome.validation_failure, { session_id: state.session_id, resume_count: state.resume_count });
else if (outcome.error || (outcome.code !== 0 && !outcome.verdict)) output = failure(mode, "claude-code-non-zero-exit", { session_id: state.session_id, resume_count: state.resume_count, exit_status: outcome.code ?? null, ...outcome.terminal_diagnostics });
else if (!outcome.verdict) output = failure(mode, "claude-code-output-unparseable", { session_id: state.session_id, resume_count: state.resume_count, ...outcome.terminal_diagnostics });
else output = { ...outcome.verdict, ...(artifactPackage ? { artifact_attestation: outcome.artifact_attestation } : {}), actual_mode: mode, provider: "claude-code", provider_cli: "claude", host: process.env.WH_REVIEW_HOST_AGENT || "codex", trueCrossEngine: true, reviewMode: "claude-code-cli", synthetic: false, execution_status: "completed", session_id: state.session_id, resume_count: state.resume_count };
persist(output.execution_status, { failure_reason: output.failure_reason, terminal_verdict_hash: createHash("sha256").update(JSON.stringify(outcome.verdict || null)).digest("hex") });
atomicWrite(outputFile, JSON.stringify(output, null, 2));
