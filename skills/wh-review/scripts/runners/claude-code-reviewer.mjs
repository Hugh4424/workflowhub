#!/usr/bin/env node
import { appendFileSync, closeSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { homedir, platform } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { ArtifactReviewPackageError, verifyArtifactReviewPackage } from "../artifact-review-package.mjs";
import { parseRequiredSkillManifest } from "../required-skill-resolver.mjs";

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
const LOCK_EXIT = Object.freeze({ unsupported: 70, missing: 71, attestation: 72, contention: 73 });
function processStart(pid) { try { return execFileSync("/bin/ps", ["-p", String(pid), "-o", "lstart="], { encoding: "utf8" }).trim(); } catch { return ""; } }

const diffFile = arg("diff"), outputFile = arg("output"), stateDir = arg("state-dir");
if (!diffFile || !outputFile || !stateDir) { process.stderr.write("Usage: claude-code-reviewer.mjs --diff=<file> --output=<file> --state-dir=<dir>\n"); process.exit(2); }
const payload = JSON.parse(readFileSync(diffFile, "utf8"));
const mode = typeof payload.mode === "string" && payload.mode ? payload.mode : "full";
const runtimePlatform = process.env.WH_REVIEW_TEST_PLATFORM || platform();
if (runtimePlatform !== "darwin" && runtimePlatform !== "linux") {
  process.exit(LOCK_EXIT.unsupported);
}
mkdirSync(stateDir, { recursive: true, mode: 0o700 });
const ownerLockFile = join(stateDir, "owner.lock");
const lockNonce = process.env.WH_REVIEW_LOCK_NONCE;
if (lockNonce) {
  const wrapperPid = Number(process.env.WH_REVIEW_WRAPPER_PID), hostPid = Number(process.env.WH_REVIEW_ATTEST_HOST_PID);
  let inheritedNonce = "";
  try { inheritedNonce = readFileSync(3, "utf8"); } catch {}
  const attested = /^[a-f0-9]{64}$/u.test(lockNonce)
    && inheritedNonce === lockNonce
    && Number.isInteger(wrapperPid) && wrapperPid > 0 && processStart(wrapperPid) === process.env.WH_REVIEW_WRAPPER_START
    && Number.isInteger(hostPid) && hostPid > 0 && processStart(hostPid) === process.env.WH_REVIEW_ATTEST_HOST_START;
  if (!attested) process.exit(LOCK_EXIT.attestation);
  try { writeFileSync(4, "1"); closeSync(4); }
  catch { process.exit(LOCK_EXIT.attestation); }
  rmSync(outputFile, { force: true });
  const testInnerExit = Number(process.env.WH_REVIEW_TEST_INNER_EXIT_AFTER_START);
  if (Number.isInteger(testInnerExit) && testInnerExit > 0) process.exit(testInnerExit);
} else {
  const utility = process.env.WH_REVIEW_LOCK_BIN || (runtimePlatform === "darwin" ? "/usr/bin/lockf" : "flock");
  const nonce = randomBytes(32).toString("hex");
  const lockArgs = runtimePlatform === "darwin"
    ? ["-kst", "0", ownerLockFile]
    : ["-E", String(LOCK_EXIT.contention), "-n", "-F", ownerLockFile];
  const innerEnv = { ...process.env, WH_REVIEW_LOCK_NONCE: nonce, WH_REVIEW_WRAPPER_PID: String(process.pid), WH_REVIEW_WRAPPER_START: processStart(process.pid), WH_REVIEW_ATTEST_HOST_PID: String(process.ppid), WH_REVIEW_ATTEST_HOST_START: processStart(process.ppid), WH_REVIEW_EXPECTED_HOST_PID: process.env.CLAUDE_CODE_REVIEW_EXPECTED_PARENT_PID || String(process.ppid), CLAUDE_CODE_REVIEW_PARENT_WATCH_MS: process.env.CLAUDE_CODE_REVIEW_PARENT_WATCH_MS || "20" };
  delete innerEnv.WH_REVIEW_KERNEL_LOCK_HELD;
  delete innerEnv.CLAUDE_CODE_REVIEW_EXPECTED_PARENT_PID;
  let child = null, spawnError = null, forwardedSignal = null, innerStarted = false;
  const result = await new Promise((resolveLock) => {
    child = spawn(utility, [...lockArgs, process.execPath, resolve(process.argv[1]), ...process.argv.slice(2)], { env: innerEnv, stdio: ["inherit", "inherit", "inherit", "pipe", "pipe"], detached: true });
    child.stdio[3]?.on("error", () => {});
    child.stdio[3]?.end(nonce);
    child.stdio[4]?.on("data", () => { innerStarted = true; });
    child.stdio[4]?.resume();
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => { forwardedSignal = signal; try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== "ESRCH") throw error; } });
    child.once("error", (error) => { spawnError = error; });
    child.once("close", (code, signal) => resolveLock({ code, signal }));
  });
  if (spawnError?.code === "ENOENT") process.exit(LOCK_EXIT.missing);
  const utilityContention = runtimePlatform === "darwin" ? 75 : LOCK_EXIT.contention;
  if (!innerStarted && result.code === utilityContention) process.exit(LOCK_EXIT.contention);
  const terminalSignal = forwardedSignal || result.signal;
  const innerCode = result.code === LOCK_EXIT.contention ? 1 : result.code;
  process.exit(terminalSignal === "SIGINT" ? 130 : terminalSignal === "SIGHUP" ? 129 : terminalSignal === "SIGTERM" ? 143 : innerCode ?? 1);
}
let artifactPackage = null, canonicalArtifactManifest = null;
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
    canonicalArtifactManifest = { package_root: artifactPackage.packageRoot, manifest_path: artifactPackage.manifestPath, content_hash: artifactPackage.manifest.content_hash, entries: artifactPackage.manifest.entries };
    if (JSON.stringify(payload.artifact_manifest) !== JSON.stringify(canonicalArtifactManifest)) {
      throw new ArtifactReviewPackageError("artifact-package-tampered", "payload manifest descriptor does not match persisted package");
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
const expectedPathEntries = new Map((expectedEntries || []).flatMap((item) => item.chunks.map((chunk) => {
  const path = realpathSync(join(artifactPackage.packageRoot, chunk.path));
  return [path, { item, chunk, lines: fileLines(path) }];
})));
const pendingReads = new Map();
const readCoverage = new Map((expectedEntries || []).map((item) => [item.id, { chunkRanges: new Map(item.chunks.map((chunk) => [chunk.sequence, []])), failed: false, emptyChunks: new Set() }]));
let attestationInvalid = false;
let boundaryViolation = false;
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
    const chunks = item.chunks.map((chunk) => {
      const ranges = mergeRanges(stateForEntry.chunkRanges.get(chunk.sequence));
      const complete = chunk.lines === 0 ? stateForEntry.emptyChunks.has(chunk.sequence) : ranges.length === 1 && ranges[0][0] === 1 && ranges[0][1] >= chunk.lines;
      return { sequence: chunk.sequence, sha256: chunk.sha256, complete, ranges };
    });
    if (chunks.every(({ complete }) => complete)) result.push({ id: item.id, sha256: item.sha256, status: "read", bytes: item.bytes, chunks: chunks.map(({ sequence, sha256, ranges }) => ({ sequence, sha256, ranges })) });
    else if (stateForEntry.failed) result.push({ id: item.id, sha256: item.sha256, status: "failed", bytes: item.bytes, chunks: chunks.filter(({ complete }) => complete).map(({ sequence, sha256, ranges }) => ({ sequence, sha256, ranges })) });
  }
  return result;
}
function completeChunkCount() {
  if (!artifactPackage || attestationInvalid) return 0;
  let completed = 0;
  for (const item of expectedEntries) {
    const coverage = readCoverage.get(item.id);
    for (const chunk of item.chunks) {
      const ranges = mergeRanges(coverage.chunkRanges.get(chunk.sequence));
      if (chunk.lines === 0 ? coverage.emptyChunks.has(chunk.sequence) : ranges.length === 1 && ranges[0][0] === 1 && ranges[0][1] >= chunk.lines) completed += 1;
    }
  }
  return completed;
}
function textFromToolResult(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  let text = "";
  for (const block of content) {
    if (!block || block.type !== "text" || typeof block.text !== "string") return null;
    text += block.text;
  }
  return text;
}
function actualReadRanges(content, pending) {
  content = textFromToolResult(content);
  if (content === null) return null;
  if (pending.entry.chunk.lines === 0) return content === "" ? [] : null;
  const rawLines = content.split("\n");
  const ranges = [];
  let previous = null;
  for (let index = 0; index < rawLines.length; index += 1) {
    const match = rawLines[index].match(/^\s*(\d+)(?:\t|→)(.*)$/u);
    if (!match) {
      const trailing = rawLines.slice(index).join("\n");
      if (/^\s*<system-reminder>[^]*<\/system-reminder>\s*$/u.test(trailing)) break;
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
      let entry, requested;
      try { requested = realpathSync(resolve(input.file_path)); entry = expectedPathEntries.get(requested); } catch {}
      const manifestRead = requested === artifactPackage.manifestPath;
      if (!entry && !manifestRead) {
        boundaryViolation = true;
        record("read_boundary_violation", { path_hash: createHash("sha256").update(String(input.file_path)).digest("hex") });
      }
      pendingReads.set(id, entry ? { entry, offset, limit } : null);
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
        else if (pending.entry.chunk.lines === 0) stateForEntry.emptyChunks.add(pending.entry.chunk.sequence);
        else stateForEntry.chunkRanges.get(pending.entry.chunk.sequence).push(...actual);
      }
    }
  }
}
let requiredSkills;
try { requiredSkills = parseRequiredSkillManifest(contractText).required; }
catch {
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify(failure(mode, "required-skill-unavailable"), null, 2));
  process.exit(0);
}
if (artifactPackage) {
  const packagedSkills = artifactPackage.manifest.entries.filter(({ role }) => role === "required_skill").map(({ id }) => id.replace(/^skill:/, "")).sort();
  if (JSON.stringify(packagedSkills) !== JSON.stringify([...requiredSkills].sort())) {
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, JSON.stringify(failure(mode, "required-skill-manifest-mismatch"), null, 2));
    process.exit(0);
  }
}
function contentDescriptor(manifest) {
  return manifest.entries.map(({ id, role, kind, bytes, lines, sha256, chunks }) => ({ id, role, kind, bytes, lines, sha256, chunks: chunks.map(({ sequence, bytes: b, lines: l, sha256: h }) => ({ sequence, bytes: b, lines: l, sha256: h })) }));
}
const computedArtifactInputHash = artifactPackage ? createHash("sha256").update(JSON.stringify({ mode, content_hash: artifactPackage.manifest.content_hash, entries: contentDescriptor(artifactPackage.manifest) })).digest("hex") : null;
if (artifactPackage && payload.input_hash !== computedArtifactInputHash) {
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify(failure(mode, "artifact-input-hash-mismatch"), null, 2));
  process.exit(0);
}
const inputHash = artifactPackage ? computedArtifactInputHash : (payload.input_hash || createHash("sha256").update(JSON.stringify({ mode: payload.mode, contract: payload.contract, materials: payload.materials })).digest("hex"));
const coverageProperty = { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" }, status: { enum: [...COVERAGE_STATUSES] }, evidence: { type: "string", minLength: 1 } }, required: ["id", "sha256", "status", "evidence"] } };
const schema = { type: "object", additionalProperties: false, properties: { verdict: { enum: [...VERDICTS] }, findings: { type: "array", items: { type: "object", additionalProperties: false, properties: { severity: { enum: [...SEVERITIES] }, file: { type: "string" }, line: { type: "integer", minimum: 1 }, issue: { type: "string" }, recommendation: { type: "string" } }, required: ["severity", "file", "line", "issue", "recommendation"] } }, resolutionSummary: { type: "string" }, skillResults: { type: "array", items: { type: "object", additionalProperties: false, properties: { skill: { type: "string" }, status: { enum: [...SKILL_STATUSES] }, evidence: { type: "string", minLength: 1 } }, required: ["skill", "status", "evidence"] } }, ...(artifactPackage ? { artifactCoverage: coverageProperty } : {}) }, required: ["verdict", "findings", "resolutionSummary", "skillResults", ...(artifactPackage ? ["artifactCoverage"] : [])] };
const prompt = artifactPackage
  ? `You are Claude Code acting as a heterologous reviewer.\n\nThe complete immutable review package is your working directory. Use only Read. Read every declared chunk in sequence; do not read any path not listed below. Concatenating each entry's chunks reconstructs the exact logical artifact. The contract entry is authoritative; required_skill entries are report-only lenses. Review every role=materials entry.\n\nReturn only the required JSON verdict. For pass/revise_required, artifactCoverage must contain every logical manifest id exactly once with its original sha256, status=read, and concrete evidence. For escalate_to_human, a well-formed attested subset is allowed.\n\nManifest content hash: ${artifactPackage.manifest.content_hash}\nLogical entries and chunks:\n${artifactPackage.manifest.entries.map((item) => `${item.id}|${item.kind}|${item.bytes}|${item.sha256}\n${item.chunks.map((chunk) => `  chunk=${chunk.sequence}|${chunk.path}|${chunk.bytes}|${chunk.lines}|${chunk.sha256}`).join("\n")}`).join("\n")}`
  : `You are Claude Code acting as a heterologous reviewer.\n\nUse the REVIEW CONTRACT exactly. Review only the supplied MATERIALS.\nReturn the required JSON verdict; do not return markdown.\n\n## REVIEW CONTRACT\n\n${payload.contract}\n\n## MATERIALS\n\n${payload.materials}`;
const stateFile = join(stateDir, "state.json"), journal = join(stateDir, "journal.ndjson"), receiptFile = join(stateDir, "terminal-receipt.json"), settingsFile = join(stateDir, "safe-settings.json");
const idleMs = Math.max(1, Number(process.env.CLAUDE_CODE_REVIEW_IDLE_MS || 300000));
const graceMs = Math.max(10, Number(process.env.CLAUDE_CODE_REVIEW_STOP_GRACE_MS || 2000));
const maxBuffer = Math.max(1024, Number(process.env.CLAUDE_CODE_REVIEW_BUFFER_MAX_BYTES || 4 * 1024 * 1024));
const maxStderr = Math.max(128, Math.min(16 * 1024, Number(process.env.CLAUDE_CODE_REVIEW_STDERR_MAX_BYTES || 4096)));
let currentChild = null, idleTimer = null, shuttingDown = false;
function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const nonce = `${process.pid}.${Date.now()}`;
  const tmp = `${path}.${nonce}.tmp`;
  writeFileSync(tmp, value, { mode: 0o600, flag: "wx" });
  try { renameSync(tmp, path); } catch (error) { rmSync(tmp, { force: true }); throw error; }
}
atomicWrite(receiptFile, JSON.stringify({ input_hash: inputHash, execution_status: "running", verdict_hash: null, failure_reason: null, completed: 0, total: (expectedEntries || []).reduce((n, item) => n + item.chunks.length, 0) }));

let state = { input_hash: inputHash, session_id: null, resume_count: 0, resume_reservation: null, attempt: 0, attempt_id: null, phase: "idle", status: "new", progress: { completed: 0, total: (expectedEntries || []).reduce((n, item) => n + item.chunks.length, 0), last_semantic_at: null } };
try {
  let old = JSON.parse(readFileSync(stateFile, "utf8"));
  const legacySighupInterruption = old.status === "interrupted"
    && old.signal === "SIGHUP"
    && (old.phase === "initial_running" || old.phase === "resume_running" || old.phase === "attempt_settled")
    && (old.failure_reason === undefined || old.failure_reason === null)
    && typeof old.session_id === "string"
    && old.session_id.length > 0;
  if (legacySighupInterruption) {
    const reservation = old.resume_reservation;
    const resumeCount = reservation?.attempt === old.attempt && Number.isInteger(reservation.previous_resume_count)
      ? reservation.previous_resume_count
      : old.resume_count;
    old = { ...old, failure_reason: "host-interrupted", interruption: "host-interrupted", session_id: null, resume_count: resumeCount, resume_reservation: null };
  }
  const resumableSession = typeof old.session_id === "string" && old.session_id;
  const preservedHostInterruption = old.failure_reason === "host-interrupted" && old.status === "interrupted";
  if (old.input_hash === inputHash && old.status !== "completed" && (resumableSession || preservedHostInterruption)) state = { ...state, ...old, progress: state.progress };
} catch {}
let persistedState = existsSync(stateFile) ? readFileSync(stateFile, "utf8") : "";
function persist(status, extra = {}) {
  state = { ...state, status, ...extra };
  const serialized = JSON.stringify(state);
  if (serialized !== persistedState) { atomicWrite(stateFile, serialized); persistedState = serialized; }
}
function reserveResume() {
  const previous = state.resume_count;
  state.resume_count = previous + 1;
  state.resume_reservation = { attempt: state.attempt + 1, previous_resume_count: previous };
  state.phase = "resume_reserved";
  persist("resuming");
}
function commitResumeReservation() {
  if (state.resume_reservation?.attempt === state.attempt) persist(state.status, { resume_reservation: null });
}
function rollbackCurrentResumeReservation() {
  const reservation = state.resume_reservation;
  if (!reservation || reservation.attempt !== state.attempt || !Number.isInteger(reservation.previous_resume_count)) return false;
  state.resume_count = reservation.previous_resume_count;
  state.resume_reservation = null;
  return true;
}
const JOURNAL_MAX_BYTES = 256 * 1024;
function record(type, meta = {}) {
  const line = `${JSON.stringify({ at: new Date().toISOString(), type, attempt: state.attempt, phase: state.phase, ...meta })}\n`;
  let size = 0; try { size = statSync(journal).size; } catch {}
  if (size + Buffer.byteLength(line) <= JOURNAL_MAX_BYTES) appendFileSync(journal, line, { mode: 0o600 });
}
function stopChild(child) { return new Promise((resolveStop) => { if (!child || child.exitCode !== null || child.signalCode) return resolveStop(); let done = false; const finish = () => { if (!done) { done = true; resolveStop(); } }; child.once("close", finish); const send = (signal) => { try { process.kill(-child.pid, signal); record("stop_signal", { signal }); } catch (error) { if (error.code !== "ESRCH") record("stop_signal_error", { signal, code: error.code }); } }; send("SIGINT"); const term = setTimeout(() => send("SIGTERM"), graceMs); const kill = setTimeout(() => { send("SIGKILL"); setTimeout(finish, graceMs).unref(); }, graceMs * 2); child.once("close", () => { clearTimeout(term); clearTimeout(kill); }); }); }
const ALLOWED_ENV = new Set(["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_MODEL", "ANTHROPIC_DEFAULT_HAIKU_MODEL", "ANTHROPIC_DEFAULT_OPUS_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "CLAUDE_CODE_EFFORT_LEVEL"]);
function safeSettings() {
  let source = {};
  try { source = JSON.parse(readFileSync(process.env.CLAUDE_CODE_SETTINGS || join(homedir(), ".claude/settings.json"), "utf8")); } catch {}
  const env = Object.fromEntries(Object.entries(source.env || {}).filter(([key, value]) => ALLOWED_ENV.has(key) && typeof value === "string"));
  const allowedRoot = artifactPackage?.packageRoot || dirname(diffFile);
  const safe = { ...(Object.keys(env).length ? { env } : {}), ...(typeof source.model === "string" ? { model: source.model } : {}), ...(typeof source.apiKeyHelper === "string" ? { apiKeyHelper: source.apiKeyHelper } : {}), permissions: { allow: [`Read(${allowedRoot}/**)`], defaultMode: "dontAsk" } };
  atomicWrite(settingsFile, JSON.stringify(safe));
}
safeSettings();
function baseArgs() { return ["-p", "--bare", "--settings", settingsFile, "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}', "--permission-mode", "dontAsk", "--output-format", "stream-json", "--verbose", "--json-schema", JSON.stringify(schema)]; }
const ERROR_CATEGORIES = new Map([
  ["prompt_too_long", "prompt_too_long"],
  ["authentication_failed", "authentication"],
  ["rate_limit", "rate_limit"],
  ["permission_denied", "permission"],
  ["overloaded", "overloaded"],
  ["invalid_request", "invalid_request"],
  ["origin_response_timeout", "upstream_timeout"],
]);
const RETRYABLE_UPSTREAM_CATEGORIES = new Set(["rate_limit", "overloaded", "upstream_timeout"]);
const SAFE_SUBTYPES = new Set(["success", "error_during_execution", "error_max_turns", "error_max_budget_usd", "error_max_structured_output_retries", "interrupted"]);
const SAFE_STOP_REASONS = new Set(["end_turn", "max_tokens", "stop_sequence", "tool_use", "error"]);
const SAFE_EVENT_TYPES = new Set(["system", "assistant", "user", "result", "stream_event"]);
const safeSessionId = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : undefined;
const sessionIdHash = (value) => createHash("sha256").update(value).digest("hex");
function terminalDiagnostics(event) {
  if (!event || typeof event !== "object") return {};
  const apiErrorCategory = event.isApiErrorMessage === true && event.apiErrorStatus === 524 ? "upstream_timeout" : undefined;
  if (event.type !== "result" && !apiErrorCategory) return {};
  return {
    ...(apiErrorCategory || ERROR_CATEGORIES.has(event.error_code) ? { error_category: apiErrorCategory || ERROR_CATEGORIES.get(event.error_code) } : {}),
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
  pendingReads.clear(); attestationInvalid = false; boundaryViolation = false;
  let attemptVerdict = null, acceptedAttestation = [], validationFailure = null, buffer = "", stalled = false, terminalSeen = false, safeTerminal = {}, lastCompleted = state.progress.completed;
  let stderrBytes = 0, stderrCaptured = Buffer.alloc(0), stderrFinal = null;
  const stderrSummary = () => {
    if (stderrFinal) return stderrFinal;
    const safeText = stderrCaptured.toString("utf8").toLowerCase();
    const errorCategories = [...new Set([...ERROR_CATEGORIES].filter(([needle]) => safeText.includes(needle)).map(([, category]) => category))];
    stderrFinal = { bytes: stderrBytes, captured_bytes: stderrCaptured.length, truncated: stderrBytes > stderrCaptured.length, ...(errorCategories.length ? { error_categories: errorCategories } : {}) };
    return stderrFinal;
  };
  return new Promise((resolveRun) => {
    let resolved = false; const settle = (value) => { if (!resolved) { resolved = true; clearTimeout(idleTimer); const stderr_summary = stderrSummary(); resolveRun({ ...value, verdict: attemptVerdict, artifact_attestation: acceptedAttestation, validation_failure: validationFailure, terminal_diagnostics: safeTerminal, stderr_summary }); } };
    const args = baseArgs(); if (resume) args.push("--resume", state.session_id); if (artifactPackage) {
      const scopedPackage = `//${artifactPackage.packageRoot.replace(/^\/+/, "")}/**`;
      args.push("--tools", "Read", "--allowedTools", `Read(${scopedPackage})`);
    }
    const child = spawn(process.env.CLAUDE_CODE_BIN || "claude", args, { stdio: ["pipe", "pipe", "pipe"], cwd: artifactPackage?.packageRoot || dirname(diffFile), detached: true }); currentChild = child;
    state.attempt_timing = { child_started_at: new Date().toISOString(), first_event_at: null, first_event_type: null };
    persist(state.status, { attempt_timing: state.attempt_timing });
    const arm = () => { clearTimeout(idleTimer); idleTimer = setTimeout(async () => { stalled = true; record("idle_timeout"); await stopChild(child); settle({ stalled: true, code: child.exitCode, signal: child.signalCode }); }, idleMs); };
    const semantic = (completed = state.progress.completed) => {
      state.progress = { ...state.progress, completed, last_semantic_at: new Date().toISOString() };
      persist(state.status, { progress: state.progress }); arm();
    };
    const consume = (line) => {
      if (!line.trim()) return;
      if (Buffer.byteLength(line) > maxBuffer) { validationFailure = "claude-code-stream-frame-invalid"; void stopChild(child).then(() => settle({ code: child.exitCode, signal: child.signalCode })); return; }
      let event;
      try { event = JSON.parse(line); } catch { validationFailure = "claude-code-stream-frame-invalid"; void stopChild(child).then(() => settle({ code: child.exitCode, signal: child.signalCode })); return; }
      if (!SAFE_EVENT_TYPES.has(event?.type)) { validationFailure = "claude-code-stream-event-unknown"; void stopChild(child).then(() => settle({ code: child.exitCode, signal: child.signalCode })); return; }
      if (!state.attempt_timing.first_event_at) {
        state.attempt_timing = { ...state.attempt_timing, first_event_at: new Date().toISOString(), first_event_type: event.type };
        record("first_stream_event", { event_type: event.type });
        persist(state.status, { attempt_timing: state.attempt_timing });
        arm();
      }
      const session = safeSessionId(event?.session_id);
      if (session && state.session_id && session !== state.session_id) {
        validationFailure = "claude-code-session-mismatch";
        record("session_mismatch", { expected_session_id_hash: sessionIdHash(state.session_id), observed_session_id_hash: sessionIdHash(session) });
        void stopChild(child).then(() => settle({ code: child.exitCode, signal: child.signalCode }));
        return;
      }
      if (session && !state.session_id) { state.session_id = session; record("session_established", { session_id_hash: sessionIdHash(session) }); semantic(); }
      observeReadEvents(event);
      if (boundaryViolation) { validationFailure = "artifact-read-boundary-violation"; void stopChild(child).then(() => settle({ code: child.exitCode, signal: child.signalCode })); return; }
      safeTerminal = { ...safeTerminal, ...terminalDiagnostics(event) };
      const attestation = hostAttestation();
      const completed = completeChunkCount();
      if (completed > lastCompleted) { lastCompleted = completed; record("coverage_progress", { completed, total: state.progress.total }); semantic(completed); }
      const terminalCandidate = event.type === "result" && candidatesFromEvent(event).some((candidate) => VERDICTS.has(candidate.verdict));
      const verdict = event.type === "result" ? verdictFromEvent(event, requiredSkills, expectedEntries, attestation) : null;
      if (verdict) {
        try { verifyPackageAfterReview(); }
        catch (error) { validationFailure = packageFailureCode(error); terminalSeen = true; void stopChild(child).then(() => settle({ code: child.exitCode ?? 0, signal: child.signalCode, terminalSeen: true })); return; }
        attemptVerdict = artifactPackage ? {
          ...verdict,
          artifactCoverage: attestation.map((item) => ({
            id: item.id,
            sha256: item.sha256,
            status: item.status,
            evidence: `host-attested Read ${item.status}; bytes=${item.bytes}; chunks=${item.chunks.map(({ sequence }) => sequence).join(",") || "none"}`,
          })),
        } : verdict;
        acceptedAttestation = attestation;
        terminalSeen = true;
        record("terminal_observed", { verdict: verdict.verdict, completed, total: state.progress.total }); semantic(completed); persist("terminal_observed");
        void stopChild(child).then(() => settle({ code: child.exitCode ?? 0, signal: child.signalCode, terminalSeen: true }));
      } else if (artifactPackage && terminalCandidate) {
        validationFailure = "artifact-coverage-unattested";
        terminalSeen = true;
        void stopChild(child).then(() => settle({ code: child.exitCode ?? 0, signal: child.signalCode, terminalSeen: true }));
      }
    };
    const decoder = new StringDecoder("utf8");
    child.stdout.on("data", (chunk) => { buffer += decoder.write(chunk); if (Buffer.byteLength(buffer) > maxBuffer) { validationFailure = "claude-code-stream-buffer-invalid"; void stopChild(child).then(() => settle({ code: child.exitCode, signal: child.signalCode })); return; } let i; while ((i = buffer.indexOf("\n")) >= 0) { consume(buffer.slice(0, i).replace(/\r$/, "")); buffer = buffer.slice(i + 1); } });
    child.stderr.on("data", (chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      stderrBytes += bytes.length;
      if (stderrCaptured.length < maxStderr) stderrCaptured = Buffer.concat([stderrCaptured, bytes.subarray(0, maxStderr - stderrCaptured.length)]);
    });
    child.on("error", (error) => { record("spawn_error", { code: error.code }); settle({ error, code: null }); });
    child.on("close", (code, signal) => { buffer += decoder.end(); if (buffer) consume(buffer.replace(/\r$/, "")); pendingReads.clear(); const stderr_summary = stderrSummary(); state.phase = "attempt_settled"; persist(state.status, { stderr_summary }); record("child_close", { code, signal, stalled, terminalSeen, stderr_summary }); settle({ code, signal, stalled, terminalSeen }); });
    child.stdin.on("error", (error) => { record("stdin_error", { code: error.code }); if (error.code !== "EPIPE") settle({ error, code: null }); });
    try { child.stdin.end(input); } catch (error) { record("stdin_error", { code: error.code }); settle({ error, code: null }); }
    arm();
  });
}
async function onSignal(signal, interruption = signal === "SIGHUP" ? "host-interrupted" : "external-signal") {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(idleTimer);
  const hostInterrupted = signal === "SIGHUP" || interruption === "parent-lost" || interruption === "parent-changed";
  const resumeReservationRolledBack = hostInterrupted ? rollbackCurrentResumeReservation() : false;
  if (hostInterrupted) state.session_id = null;
  persist("interrupted", { signal, interruption, ...(hostInterrupted ? { failure_reason: "host-interrupted" } : {}) });
  record("runner_signal", { signal, interruption, external_interruption: true, resume_reservation_rolled_back: resumeReservationRolledBack });
  await stopChild(currentChild);
  if (hostInterrupted) {
    const output = failure(mode, "host-interrupted", { resume_count: state.resume_count, external_interruption: true, interruption, ...(state.stderr_summary ? { stderr_summary: state.stderr_summary } : {}) });
    atomicWrite(outputFile, JSON.stringify(output, null, 2));
    atomicWrite(receiptFile, JSON.stringify({ input_hash: inputHash, execution_status: output.execution_status, verdict_hash: null, failure_reason: output.failure_reason, completed: state.progress.completed, total: state.progress.total }));
  }
  clearInterval(parentWatch);
  process.exit(signal === "SIGINT" ? 130 : signal === "SIGHUP" ? 129 : 143);
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => void onSignal(signal));
const configuredParent = Number(process.env.CLAUDE_CODE_REVIEW_EXPECTED_PARENT_PID);
const originalParent = Number.isInteger(configuredParent) && configuredParent > 0 ? configuredParent : process.ppid;
const configuredHost = Number(process.env.WH_REVIEW_EXPECTED_HOST_PID);
const expectedHost = Number.isInteger(configuredHost) && configuredHost > 0 ? configuredHost : null;
const configuredWrapper = Number(process.env.WH_REVIEW_WRAPPER_PID);
const expectedWrapper = Number.isInteger(configuredWrapper) && configuredWrapper > 0 ? configuredWrapper : null;
const parentWatchMs = Math.max(10, Number(process.env.CLAUDE_CODE_REVIEW_PARENT_WATCH_MS || 500));
let parentConfirmed = false;
const parentWatch = setInterval(() => {
  try {
    process.kill(originalParent, 0);
    if (expectedHost) process.kill(expectedHost, 0);
    if (expectedWrapper) process.kill(expectedWrapper, 0);
    if (process.ppid !== originalParent) void onSignal("SIGHUP", "parent-changed");
    else if (!parentConfirmed) { parentConfirmed = true; record("parent_watch_confirmed"); }
  } catch (error) {
    if (error.code === "ESRCH") void onSignal("SIGHUP", "parent-lost");
  }
}, parentWatchMs);

function continuation({ freshProcess }) {
  if (!artifactPackage) return "Continue the interrupted review. Return only the required JSON verdict.";
  const missing = [];
  for (const item of expectedEntries) {
    const covered = readCoverage.get(item.id);
    for (const chunk of item.chunks) {
      const ranges = mergeRanges(covered.chunkRanges.get(chunk.sequence));
      const complete = chunk.lines === 0 ? covered.emptyChunks.has(chunk.sequence) : ranges.length === 1 && ranges[0][0] === 1 && ranges[0][1] >= chunk.lines;
      if (!complete) missing.push(chunk.path);
    }
  }
  return `Continue the interrupted review. ${freshProcess ? "This is a fresh host process; no prior Read coverage is trusted. " : "Host-attested complete chunks remain valid. "}Read only these missing chunks in full: ${missing.join(", ")}. Return only the required JSON verdict.`;
}

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
  if (startupResume) reserveResume();
  outcome = await run(startupResume ? continuation({ freshProcess: true }) : prompt, startupResume);
  if (startupResume) commitResumeReservation();
  const retryableUpstreamFailure = outcome.code !== 0
    && !outcome.verdict
    && RETRYABLE_UPSTREAM_CATEGORIES.has(outcome.terminal_diagnostics?.error_category);
  if ((outcome.stalled || retryableUpstreamFailure) && state.session_id && state.resume_count < 1) {
    reserveResume();
    // Discard partial ranges; only complete host-attested chunks survive an
    // in-process resume. This prevents cross-attempt range splicing.
    for (const [id, coverage] of readCoverage) {
      const item = expectedEntries.find((entry) => entry.id === id);
      for (const chunk of item.chunks) {
        const ranges = mergeRanges(coverage.chunkRanges.get(chunk.sequence));
        const complete = chunk.lines === 0 ? coverage.emptyChunks.has(chunk.sequence) : ranges.length === 1 && ranges[0][0] === 1 && ranges[0][1] >= chunk.lines;
        if (!complete) coverage.chunkRanges.set(chunk.sequence, []);
      }
      coverage.failed = false;
    }
    outcome = await run(continuation({ freshProcess: false }), true);
    commitResumeReservation();
  }
}
let output;
if (outcome.recoveryBudgetExhausted) output = failure(mode, "claude-code-resume-budget-exhausted", { resume_count: state.resume_count });
else if (outcome.stalled) output = failure(mode, state.resume_count ? "claude-code-idle-after-resume" : "claude-code-idle-without-session", { resume_count: state.resume_count, stderr_summary: outcome.stderr_summary });
else if (outcome.validation_failure) output = failure(mode, outcome.validation_failure, { resume_count: state.resume_count, stderr_summary: outcome.stderr_summary });
else if (outcome.error || (outcome.code !== 0 && !outcome.verdict)) output = failure(mode, "claude-code-non-zero-exit", { resume_count: state.resume_count, exit_status: outcome.code ?? null, ...outcome.terminal_diagnostics, stderr_summary: outcome.stderr_summary });
else if (!outcome.verdict) output = failure(mode, "claude-code-output-unparseable", { resume_count: state.resume_count, ...outcome.terminal_diagnostics, stderr_summary: outcome.stderr_summary });
else output = { ...outcome.verdict, ...(artifactPackage ? { artifact_attestation: outcome.artifact_attestation } : {}), actual_mode: mode, provider: "claude-code", provider_cli: "claude", host: process.env.WH_REVIEW_HOST_AGENT || "codex", trueCrossEngine: true, reviewMode: "claude-code-cli", synthetic: false, execution_status: "completed", resume_count: state.resume_count };
persist(output.execution_status, { failure_reason: output.failure_reason, terminal_verdict_hash: createHash("sha256").update(JSON.stringify(outcome.verdict || null)).digest("hex") });
atomicWrite(outputFile, JSON.stringify(output, null, 2));
atomicWrite(receiptFile, JSON.stringify({ input_hash: inputHash, execution_status: output.execution_status, verdict_hash: state.terminal_verdict_hash, failure_reason: output.failure_reason || null, completed: state.progress.completed, total: state.progress.total }));
clearInterval(parentWatch);
