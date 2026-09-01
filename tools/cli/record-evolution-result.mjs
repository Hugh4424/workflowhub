#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { acquireProjectLock, recordCandidateTransition, resolveTargetRef, validateWorkflowEvolutionDefinition, D24_EVAL_BOUNDARY } from "../../runtime/evidence/workflow-evolution.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const EDIT_OUTCOMES = new Set(["improved", "unchanged", "regressed", "inconclusive", "reverted"]);
const FAILURE_DOMAINS = new Set(["harness", "process", "skill_edit"]);
const FAILURE_KINDS = new Set(["edit_validation_failed", "preserve_behavior_regression", "workflow_regression", "revert_failed"]);
const D24_DOMAINS = new Set(["model", "strategy", "product", "eval_sample", "dataset", "provider_output_quality", "task_execution", "mixed"]);
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

function fail(code, summary) { const error = new Error(summary); error.code = code; return error; }
function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function required(value, name) { if (typeof value !== "string" || value.trim() === "") throw fail("invalid_input", `${name} is required`); return value; }
function parseArgs(argv) { const out = {}; for (const arg of argv) { const index = arg.indexOf("="); if (!arg.startsWith("--") || index < 3) throw fail("invalid_input", `invalid argument: ${arg}`); out[arg.slice(2, index)] = arg.slice(index + 1); } return out; }
function inputValue(options) { if (options.input) return JSON.parse(readFileSync(resolve(options.input), "utf8")); if (options.json) return JSON.parse(options.json); return {}; }
function plain(value) { if (value === null || typeof value !== "object") return value; if (Array.isArray(value)) return value.map(plain); return Object.fromEntries(Object.keys(value).sort().map((key) => [key, plain(value[key])])); }
function canonical(value) { const walk = (node) => node && typeof node === "object" ? (Array.isArray(node) ? `[${node.map(walk).join(",")}]` : `{${Object.entries(node).map(([key, child]) => `${JSON.stringify(key)}:${walk(child)}`).join(",")}}`) : JSON.stringify(node); return walk(plain(value)); }
function currentAuthorities(repositoryRoot) {
  const stages = []; const steps = [];
  for (const stage of STAGES) {
    const authority = join(repositoryRoot, "workflows", stage, "steps.json"); const bytes = readFileSync(authority); const manifest = JSON.parse(bytes);
    stages.push({ stage, version: String(manifest.schema_version), authority, authority_sha256: hash(bytes) });
    for (const entry of manifest.steps ?? []) steps.push({ slug: entry.step_slug, version: String(manifest.schema_version), authority, authority_sha256: hash(bytes) });
  }
  const catalogAuthority = join(repositoryRoot, "skills/catalog.yaml"); const catalogBytes = readFileSync(catalogAuthority); const catalog = catalogBytes.toString("utf8");
  const skills = [...catalog.matchAll(/^\s*- name:\s*([^\s#]+)[\s\S]*?^\s*local_version:\s*([^\s#]+)/gm)].map((match) => ({ id: match[1], version: match[2].replaceAll('"', ""), authority: catalogAuthority, authority_sha256: hash(catalogBytes) }));
  const moveMapAuthority = join(repositoryRoot, "docs/architecture/move-map.json"); const moveMapBytes = readFileSync(moveMapAuthority); const moveMap = JSON.parse(moveMapBytes);
  const surfaces = (moveMap.entries ?? []).flatMap((entry) => [...new Set([entry.source, entry.destination].filter(Boolean))].map((id) => ({ id, version: String(moveMap.schema_version), authority: moveMapAuthority, authority_sha256: hash(moveMapBytes) })));
  return { stages, steps, skills, surfaces };
}
function encoded(value) { return Buffer.from(`${JSON.stringify(value)}\n`); }
function entries(raw) { const out = []; let start = 0; while (start < raw.length) { const newline = raw.indexOf(0x0a, start); if (newline === -1) { out.push({ start, end: raw.length, complete: false, bytes: raw.subarray(start) }); break; } let end = newline; if (end > start && raw[end - 1] === 0x0d) end -= 1; out.push({ start, end: newline + 1, complete: true, bytes: raw.subarray(start, end) }); start = newline + 1; } return out; }
function parsed(entry) { if (!entry.complete) return null; try { return JSON.parse(entry.bytes.toString("utf8")); } catch { return null; } }
function validAbort(raw, start, entry, value) { const suffixEnd = start + value.observed_suffix_length; return value?.record_kind === "batch_abort" && value.abandoned_start_offset === start && Number.isInteger(value.observed_suffix_length) && suffixEnd <= entry.start && hash(raw.subarray(0, start)) === value.last_committed_prefix_hash && hash(raw.subarray(start, suffixEnd)) === value.observed_suffix_hash && /^[\r\n]*$/.test(raw.subarray(suffixEnd, entry.start).toString("utf8")); }
function assertEnvelope(value, kind, ledgerKind) {
  try { validateWorkflowEvolutionDefinition(kind, value); } catch (error) { throw fail("failed", `${ledgerKind} ${kind} envelope schema invalid: ${error.message}`); }
  const keys = kind === "batch_begin" ? ["schema_version", "record_kind", "ledger_kind", "batch_id", "attempt_id", "publication_generation"]
    : kind === "batch_commit" ? ["schema_version", "record_kind", "ledger_kind", "batch_id", "attempt_id", "count", "content_hash", "publication_generation", "status"]
      : ["schema_version", "record_kind", "ledger_kind", "batch_id", "publication_generation", "reason", "last_committed_prefix_hash", "abandoned_start_offset", "observed_suffix_length", "observed_suffix_hash"];
  if (value.schema_version !== "workflow-evolution.v1" || value.record_kind !== kind || value.ledger_kind !== ledgerKind
      || Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) throw fail("failed", `${ledgerKind} ${kind} envelope schema invalid`);
}
function assertLedgerRow(value, ledgerKind, batchId, attemptId) {
  if (value.ledger_batch_id !== batchId || value.attempt_id !== attemptId) throw fail("failed", `${ledgerKind} row batch identity mismatch`);
  try { validateWorkflowEvolutionDefinition(ledgerKind === "negative-result" ? "negative_result" : "attempted_edit", value); }
  catch (error) { throw fail("failed", `${ledgerKind} row schema invalid: ${error.message}`); }
}
function scanLedger(path, ledgerKind) {
  const raw = existsSync(path) ? readFileSync(path) : Buffer.alloc(0); const records = []; let open = null; let recoveryStart = null; let committedEnd = 0; let latestPublicationGeneration = 0;
  for (const entry of entries(raw)) {
    const value = parsed(entry);
    if (recoveryStart !== null) {
      if (value?.record_kind === "batch_abort") {
        assertEnvelope(value, "batch_abort", ledgerKind);
        if (value.publication_generation === (open?.begin?.publication_generation ?? (latestPublicationGeneration + 1))
            && (open?.begin?.batch_id === undefined || value.batch_id === open.begin.batch_id)
            && validAbort(raw, recoveryStart, entry, value)) { recoveryStart = null; open = null; committedEnd = entry.end; continue; }
      }
      throw fail("failed", `corruption occurs before a later ${ledgerKind} ledger record at byte ${entry.start}`);
    }
    if (!value) { recoveryStart = open?.start ?? entry.start; continue; }
    if (!open) { assertEnvelope(value, "batch_begin", ledgerKind); if (value.publication_generation !== latestPublicationGeneration + 1) throw fail("failed", `${ledgerKind} publication generation is not contiguous at byte ${entry.start}`); open = { start: entry.start, begin: value, rows: [] }; continue; }
    if (value.record_kind === "batch_abort") { assertEnvelope(value, "batch_abort", ledgerKind); if (value.batch_id !== open.begin.batch_id || value.publication_generation !== open.begin.publication_generation || !validAbort(raw, open.start, entry, value)) throw fail("failed", `unauthenticated ledger abort at byte ${entry.start}`); open = null; committedEnd = entry.end; continue; }
    if (value.record_kind === "batch_begin") throw fail("failed", `nested ledger batch at byte ${entry.start}`);
    if (value.record_kind !== "batch_commit") { assertLedgerRow(value, ledgerKind, open.begin.batch_id, open.begin.attempt_id); open.rows.push(value); continue; }
    assertEnvelope(value, "batch_commit", ledgerKind);
    if (value.status !== "committed" || value.batch_id !== open.begin.batch_id || value.attempt_id !== open.begin.attempt_id || value.publication_generation !== open.begin.publication_generation || value.ledger_kind !== ledgerKind || value.count !== open.rows.length || value.content_hash !== hash(canonical(open.rows))) throw fail("failed", `committed ledger integrity mismatch at byte ${entry.start}`);
    records.push(...open.rows); committedEnd = entry.end; latestPublicationGeneration = Number.isInteger(value.publication_generation) ? value.publication_generation : latestPublicationGeneration; open = null;
  }
  const suffixStart = recoveryStart ?? open?.start ?? null; return { raw, records, committedEnd, latestPublicationGeneration, terminalSuffix: suffixStart === null ? null : { start: suffixStart, bytes: raw.subarray(suffixStart), batch_id: open?.begin?.batch_id ?? null, publication_generation: open?.begin?.publication_generation ?? null } };
}
function assertLock(lock, attemptId) {
  const value = JSON.parse(readFileSync(lock.lockHandle.path, "utf8"));
  if (value.owner_token !== lock.ownerToken || value.fencing_token !== lock.fencingToken || value.attempt_id !== attemptId) throw fail("stale_source", "project lock authority is stale");
}
function appendLine(path, value, lock, attemptId) { mkdirSync(dirname(path), { recursive: true }); const existed = existsSync(path); assertLock(lock, attemptId); const fd = openSync(path, "a"); try { writeFileSync(fd, encoded(value)); fsyncSync(fd); } finally { closeSync(fd); } if (!existed) { const parent = openSync(dirname(path), "r"); try { fsyncSync(parent); } finally { closeSync(parent); } } assertLock(lock, attemptId); }
function recoverTail(path, ledgerKind, lock, attemptId) {
  const state = scanLedger(path, ledgerKind); if (!state.terminalSuffix) return state; const suffix = state.terminalSuffix;
  if (state.raw.length && state.raw.at(-1) !== 0x0a) { assertLock(lock, attemptId); const fd = openSync(path, "a"); try { writeFileSync(fd, "\n"); fsyncSync(fd); } finally { closeSync(fd); } assertLock(lock, attemptId); }
  appendLine(path, { schema_version: "workflow-evolution.v1", record_kind: "batch_abort", ledger_kind: ledgerKind, batch_id: suffix.batch_id ?? "unparseable-or-uncommitted", publication_generation: suffix.publication_generation ?? (state.latestPublicationGeneration + 1), reason: "terminal_uncommitted_suffix", last_committed_prefix_hash: hash(state.raw.subarray(0, suffix.start)), abandoned_start_offset: suffix.start, observed_suffix_length: suffix.bytes.length, observed_suffix_hash: hash(suffix.bytes) }, lock, attemptId);
  const recovered = scanLedger(path, ledgerKind); if (recovered.terminalSuffix) throw fail("failed", "ledger recovery did not close terminal suffix"); return recovered;
}
function appendBatch(path, ledgerKind, value, lock, attemptId, expectedPrefixHash) {
  const state = scanLedger(path, ledgerKind); if (state.terminalSuffix || hash(state.raw) !== expectedPrefixHash) throw fail("conflict", "ledger head changed before append"); const batchId = randomUUID(); const publicationGeneration = state.latestPublicationGeneration + 1; const row = { ...value, ledger_batch_id: batchId }; assertLedgerRow(row, ledgerKind, batchId, attemptId);
  const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: ledgerKind, batch_id: batchId, attempt_id: attemptId, publication_generation: publicationGeneration }; const commit = { schema_version: "workflow-evolution.v1", record_kind: "batch_commit", ledger_kind: ledgerKind, batch_id: batchId, attempt_id: attemptId, count: 1, content_hash: hash(canonical([row])), publication_generation: publicationGeneration, status: "committed" };
  appendLine(path, begin, lock, attemptId); appendLine(path, row, lock, attemptId); const beforeCommit = scanLedger(path, ledgerKind); if (!beforeCommit.terminalSuffix || beforeCommit.terminalSuffix.start !== state.raw.length || !beforeCommit.terminalSuffix.bytes.equals(Buffer.concat([encoded(begin), encoded(row)]))) throw fail("stale_source", "uncommitted ledger bytes changed"); appendLine(path, commit, lock, attemptId); const complete = scanLedger(path, ledgerKind); if (complete.terminalSuffix || complete.records.at(-1)?.ledger_batch_id !== batchId) throw fail("failed", "ledger commit is not current"); return row;
}
function iso(value, name) { required(value, name); const parsed = Date.parse(value); if (!Number.isFinite(parsed) || !value.endsWith("Z")) throw fail("invalid_input", `${name} must be a UTC timestamp`); return parsed; }
function verifyFile(ref, sha256, name) {
  const path = resolve(required(ref, `${name}_ref`)); if (!SHA256.test(required(sha256, `${name}_sha256`))) throw fail("invalid_input", `${name}_sha256 is invalid`);
  let bytes; try { bytes = readFileSync(path); } catch { throw fail("unavailable", `${name} is unreadable`); }
  if (hash(bytes) !== sha256) throw fail("stale_source", `${name} hash is stale`); return { path, bytes };
}
function verifyDecision(payload) {
  if (payload.approval !== true) throw fail("invalid_input", "terminal approved decision is required");
  const ref = payload.decision_log_ref ?? payload.decision_ref; const sha256 = payload.decision_log_sha256 ?? payload.decision_sha256 ?? payload.decision_hash;
  const decision = verifyFile(ref, sha256, "decision_log"); const decisionId = required(payload.decision_id, "decision_id");
  const lines = decision.bytes.toString("utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^###\\s+${decisionId.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}(?:\\s|$)`).test(line));
  const end = start < 0 ? -1 : lines.findIndex((line, index) => index > start && /^###\s+/.test(line));
  const section = start < 0 ? [] : lines.slice(start, end < 0 ? lines.length : end);
  if (start < 0 || !section.some((line) => /approval_binding\s*:\s*accepted\b/i.test(line))) throw fail("stale_source", "decision_id is not present in an accepted decision binding");
  return { decision_ref: ref, decision_sha256: sha256, decision_id: decisionId };
}
function heads(records, idField) { const superseded = new Set(records.map((entry) => entry.supersedes).filter(Boolean)); return records.filter((entry) => !superseded.has(entry[idField])); }
function verifyTargetRef(value, project, repositoryRoot) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw fail("invalid_input", "target_ref is required");
  for (const field of ["project_id", "target_kind", "target_id", "target_version", "authority_ref", "authority_sha256"]) required(value[field], `target_ref.${field}`);
  if (value.project_id !== project) throw fail("stale_source", "target_ref project does not match the current project");
  const authorities = currentAuthorities(repositoryRoot);
  const entries = value.target_kind === "stage" ? authorities.stages.filter((entry) => entry.stage === value.target_id) : value.target_kind === "step" ? authorities.steps.filter((entry) => entry.slug === value.target_id) : value.target_kind === "skill" ? authorities.skills.filter((entry) => entry.id === value.target_id) : value.target_kind === "surface" ? authorities.surfaces.filter((entry) => entry.id === value.target_id) : [];
  if (entries.length !== 1) throw fail(entries.length === 0 ? "invalid_input" : "stale_source", `target_ref must map to exactly one current authority: ${value.target_id}`);
  const resolved = resolveTargetRef({ projectId: project, targetKind: value.target_kind, targetId: value.target_id, authorities });
  if (resolved.status !== "ok" || canonical(resolved.target_ref) !== canonical(value)) throw fail("stale_source", "target_ref does not match the current repository authority");
  let authorityBytes;
  try { authorityBytes = readFileSync(value.authority_ref); }
  catch { throw fail("unavailable", "target_ref authority is unreadable"); }
  if (!["stage", "step", "skill", "surface"].includes(value.target_kind) || !SHA256.test(value.authority_sha256) || hash(authorityBytes) !== value.authority_sha256) throw fail("invalid_input", "target_ref identity is invalid");
  return value;
}
function attemptedEdit(payload, attemptId, records, project, repositoryRoot) {
  if (payload.d24_boundary !== undefined || payload.d24_eval_boundary !== undefined) throw fail("invalid_input", "attempted-edit must not consume D24 boundary");
  const decision = verifyDecision(payload);
  for (const field of ["changed_surface", "before_facts_ref", "before_facts_sha256", "before_observed_at", "after_facts_ref", "after_facts_sha256", "after_observed_at", "observed_at", "validation_method", "revert_ref", "revert_sha256", "outcome"]) required(payload[field], field);
  if (!EDIT_OUTCOMES.has(payload.outcome)) throw fail("invalid_input", "attempted edit outcome is invalid");
  const before = verifyFile(payload.before_facts_ref, payload.before_facts_sha256, "before_facts"); const after = verifyFile(payload.after_facts_ref, payload.after_facts_sha256, "after_facts");
  if (before.path === after.path || payload.before_facts_sha256 === payload.after_facts_sha256) throw fail("invalid_input", "before and after facts must be distinct immutable snapshots");
  const beforeAt = iso(payload.before_observed_at, "before_observed_at"); const afterAt = iso(payload.after_observed_at, "after_observed_at"); const observedAt = iso(payload.observed_at, "observed_at");
  if (!(beforeAt < afterAt && afterAt <= observedAt)) throw fail("invalid_input", "fact observation times are not ordered");
  if (!Array.isArray(payload.evidence_refs) || payload.evidence_refs.length === 0) throw fail("invalid_input", "evidence_refs are required");
  verifyTargetRef(payload.target_ref, project, repositoryRoot);
  verifyFile(payload.revert_ref, payload.revert_sha256, "revert");
  const sameAttempt = records.filter((entry) => entry.attempt_id === attemptId); const current = heads(sameAttempt, "edit_record_id");
  if (sameAttempt.length === 0 && payload.supersedes != null) throw fail("stale_source", "first attempted edit cannot supersede a record");
  if (sameAttempt.length > 0 && (current.length !== 1 || payload.supersedes !== current[0].edit_record_id)) throw fail("stale_source", "attempted edit must supersede its current effective head");
  const editRecordId = payload.edit_record_id ?? `edit.v1:${hash(JSON.stringify({ attemptId, payload }))}`;
  if (records.some((entry) => entry.edit_record_id === editRecordId)) throw fail("conflict", "duplicate attempted edit identity");
  return { ...payload, ...decision, schema_version: "workflow-evolution.v1", record_kind: "attempted-edit", edit_record_id: editRecordId, record_id: editRecordId, attempt_id: attemptId };
}
function checkD24(payload) {
  const d24 = payload.d24_boundary ?? payload.d24_eval_boundary;
  if (!d24 || d24.schema_version !== D24_EVAL_BOUNDARY.schema_version || d24.schema_ref !== D24_EVAL_BOUNDARY.schema_ref || d24.sha256 !== D24_EVAL_BOUNDARY.sha256 || d24.canonical_bytes !== D24_EVAL_BOUNDARY.canonical_bytes) throw fail("wrong_domain", "D24 boundary identity mismatch");
}
function negativeResult(payload, attemptId, editState, negatives, project, repositoryRoot) {
  const edits = editState.records;
  if (payload.classification_status === "unavailable" || payload.evidence_status !== "complete" || payload.independent_before_after_evidence !== true) throw fail("classification_unavailable", "independent before/after mechanism evidence is unavailable");
  if (D24_DOMAINS.has(payload.failure_domain) || payload.mixed_domain === true) { checkD24(payload); throw fail("wrong_domain", "failure belongs to D24 evaluation authority"); }
  checkD24(payload);
  if (!FAILURE_DOMAINS.has(payload.failure_domain) || !FAILURE_KINDS.has(payload.failure_kind)) throw fail("wrong_domain", "failure is outside the M16 mechanism domain");
  const decision = verifyDecision(payload);
  for (const field of ["negative_id", "failure_identity", "observed_at", "changed_surface", "before_facts_ref", "before_facts_sha256", "after_facts_ref", "after_facts_sha256", "validation_method", "revert_ref", "revert_sha256", "status"]) required(payload[field], field);
  iso(payload.observed_at, "observed_at"); if (!Array.isArray(payload.failure_evidence_refs) || payload.failure_evidence_refs.length === 0) throw fail("invalid_input", "failure_evidence_refs are required");
  const before = verifyFile(payload.before_facts_ref, payload.before_facts_sha256, "before_facts"); const after = verifyFile(payload.after_facts_ref, payload.after_facts_sha256, "after_facts");
  if (before.path === after.path || payload.before_facts_sha256 === payload.after_facts_sha256) throw fail("invalid_input", "negative before and after facts must be distinct");
  verifyFile(payload.revert_ref, payload.revert_sha256, "revert"); verifyTargetRef(payload.target_ref, project, repositoryRoot);
  const editId = required(payload.attempted_edit_id ?? payload.edit_record_id, "attempted_edit_id");
  const edit = edits.find((entry) => entry.edit_record_id === editId && entry.attempt_id === attemptId && entry.decision_id === decision.decision_id);
  if (!edit) throw fail("stale_source", "negative result does not reference the same attempted edit");
  const currentEditHeads = heads(edits.filter((entry) => entry.attempt_id === attemptId), "edit_record_id");
  if (currentEditHeads.length !== 1 || currentEditHeads[0].edit_record_id !== editId) throw fail("stale_source", "negative result does not reference the effective attempted edit head");
  if (!["regressed", "reverted"].includes(edit.outcome)) throw fail("invalid_input", "attempted edit outcome is incompatible with a negative result");
  if (negatives.some((entry) => entry.negative_id === payload.negative_id)) throw fail("conflict", "duplicate negative result identity");
  const sameFailure = negatives.filter((entry) => entry.failure_identity === payload.failure_identity); const current = heads(sameFailure, "negative_id");
  if (sameFailure.length === 0 && payload.supersedes != null) throw fail("stale_source", "first failure identity cannot supersede a record");
  if (sameFailure.length > 0 && (current.length !== 1 || payload.supersedes !== current[0].negative_id)) throw fail("stale_source", "negative correction must supersede the same failure identity current head");
  return {
    schema_version: "workflow-evolution.v1", record_kind: "negative-result",
    negative_id: payload.negative_id, attempt_id: attemptId, attempted_edit_id: editId,
    attempted_edit_head_sha256: hash(editState.raw.subarray(0, editState.committedEnd)),
    failure_identity: payload.failure_identity, ...decision, approval: true, target_ref: payload.target_ref,
    failure_domain: payload.failure_domain, failure_kind: payload.failure_kind, observed_at: payload.observed_at,
    changed_surface: payload.changed_surface, before_facts_ref: payload.before_facts_ref, before_facts_sha256: payload.before_facts_sha256,
    after_facts_ref: payload.after_facts_ref, after_facts_sha256: payload.after_facts_sha256,
    validation_method: payload.validation_method, revert_ref: payload.revert_ref, revert_sha256: payload.revert_sha256,
    status: payload.status, failure_evidence_refs: payload.failure_evidence_refs, supersedes: payload.supersedes ?? null,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2)); const root = resolve(required(options.root, "--root")); const project = required(options.project, "--project"); const repositoryRoot = resolve(options["repository-root"] ?? join(import.meta.dirname, "../..")); const kind = required(options["record-kind"] ?? options.record_kind, "--record-kind");
  const payload = inputValue(options); const attemptId = required(options["attempt-id"] ?? options.attempt_id ?? payload.attempt_id, "attempt_id"); const manualRecovery = options["manual-recovery"] ? JSON.parse(options["manual-recovery"]) : undefined;
  const lock = acquireProjectLock({ storageRoot: root, project, attemptId, manualRecovery }); if (lock.status !== "ok") throw fail(lock.error?.code ?? lock.status, lock.error?.summary ?? "lock unavailable");
  try {
    if (kind === "candidate-transition") { const result = recordCandidateTransition({ storageRoot: root, project, attemptId, ...payload, lockAuthority: lock }); if (result.status !== "ok") throw fail(result.error?.code ?? result.status, result.error?.summary ?? "candidate transition failed"); console.log(JSON.stringify(result)); return; }
    if (!["attempted-edit", "negative-result"].includes(kind)) throw fail("invalid_input", `unsupported record-kind: ${kind}`);
    const projectRoot = join(root, "Projects", project); const editsPath = join(projectRoot, "attempted-edits.jsonl"); const negativesPath = join(projectRoot, "negative-results.jsonl"); const editState = recoverTail(editsPath, "attempted-edit", lock, attemptId); const negativeState = kind === "negative-result" ? recoverTail(negativesPath, "negative-result", lock, attemptId) : { raw: Buffer.alloc(0), records: [] };
    const record = kind === "attempted-edit" ? attemptedEdit(payload, attemptId, editState.records, project, repositoryRoot) : negativeResult(payload, attemptId, editState, negativeState.records, project, repositoryRoot); const targetPath = kind === "attempted-edit" ? editsPath : negativesPath; const targetState = kind === "attempted-edit" ? editState : negativeState; const persisted = appendBatch(targetPath, kind, record, lock, attemptId, hash(targetState.raw)); console.log(JSON.stringify({ status: "ok", record: persisted }));
  } finally { lock.release(); }
}

try { main(); } catch (error) { console.log(JSON.stringify({ status: error.code ?? "failed", error: { code: error.code ?? "failed", summary: error.message } })); process.exitCode = 1; }
