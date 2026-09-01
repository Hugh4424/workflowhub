#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { acquireProjectLock, readCurrentEvolutionProjection, resolveTargetRef, validateWorkflowEvolutionDefinition } from "../../runtime/evidence/workflow-evolution.mjs";

function fail(code, summary) { const error = new Error(summary); error.code = code; return error; }
function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function required(value, name) { if (typeof value !== "string" || value.trim() === "") throw fail("invalid_input", `${name} is required`); return value; }
function parse(argv) { const out = {}; for (const arg of argv) { const i = arg.indexOf("="); if (!arg.startsWith("--") || i < 3) throw fail("invalid_input", `invalid argument: ${arg}`); out[arg.slice(2, i)] = arg.slice(i + 1); } return out; }
function canonical(value) { if (value === null || typeof value !== "object") return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`; }
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
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
function target(options, repositoryRoot) {
  const targetKind = required(options["target-kind"], "--target-kind"); const targetId = required(options["target-id"], "--target-id"); const authorities = currentAuthorities(repositoryRoot);
  const entries = targetKind === "stage" ? authorities.stages.filter((entry) => entry.stage === targetId) : targetKind === "step" ? authorities.steps.filter((entry) => entry.slug === targetId) : targetKind === "skill" ? authorities.skills.filter((entry) => entry.id === targetId) : targetKind === "surface" ? authorities.surfaces.filter((entry) => entry.id === targetId) : [];
  if (entries.length !== 1) throw fail(entries.length === 0 ? "invalid_target" : "stale_source", `target must map to exactly one current authority: ${targetId}`);
  const resolved = resolveTargetRef({ projectId: options.project, targetKind, targetId, authorities });
  if (resolved.status !== "ok") return resolved;
  const claims = { target_version: options["target-version"], authority_ref: options.authority, authority_sha256: options["authority-sha256"] };
  for (const [field, claimed] of Object.entries(claims)) if (claimed !== undefined && claimed !== resolved.target_ref[field]) throw fail("stale_source", `caller-selected ${field} is not the current repository authority`);
  return resolved;
}
function source(path, expectedHash, name) {
  if (!path || !expectedHash) return { status: "unavailable", reason: `${name}_identity_missing`, ref: path ?? null, bytes: null };
  const ref = resolve(path); let bytes; try { bytes = readFileSync(ref); } catch { return { status: "unavailable", reason: `${name}_unreadable`, ref, bytes: null }; }
  if (hash(bytes) !== expectedHash) throw fail("stale_source", `${name} identity is stale`);
  return { status: "ready", reason: null, ref, sha256: expectedHash, bytes };
}
function ledgerEntries(raw) { const out = []; let start = 0; while (start < raw.length) { const newline = raw.indexOf(0x0a, start); if (newline === -1) { out.push({ start, end: raw.length, complete: false, bytes: raw.subarray(start) }); break; } let end = newline; if (end > start && raw[end - 1] === 0x0d) end -= 1; out.push({ start, end: newline + 1, complete: true, bytes: raw.subarray(start, end) }); start = newline + 1; } return out; }
function parseLedgerEntry(entry) { if (!entry.complete) return null; try { return JSON.parse(entry.bytes.toString("utf8")); } catch { return null; } }
function validLedgerAbort(raw, start, entry, value) { const suffixEnd = start + value.observed_suffix_length; return value?.record_kind === "batch_abort" && value.abandoned_start_offset === start && Number.isInteger(value.observed_suffix_length) && suffixEnd <= entry.start && hash(raw.subarray(0, start)) === value.last_committed_prefix_hash && hash(raw.subarray(start, suffixEnd)) === value.observed_suffix_hash && /^[\r\n]*$/.test(raw.subarray(suffixEnd, entry.start).toString("utf8")); }
function assertEnvelope(value, kind, ledgerKind, name) {
  const keys = kind === "batch_begin" ? ["schema_version", "record_kind", "ledger_kind", "batch_id", "attempt_id"]
    : kind === "batch_commit" ? ["schema_version", "record_kind", "ledger_kind", "batch_id", "attempt_id", "count", "content_hash", "status"]
      : ["schema_version", "record_kind", "ledger_kind", "batch_id", "reason", "last_committed_prefix_hash", "abandoned_start_offset", "observed_suffix_length", "observed_suffix_hash"];
  if (!value || value.schema_version !== "workflow-evolution.v1" || value.record_kind !== kind || value.ledger_kind !== ledgerKind
      || Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) throw fail("failed", `${name} ${kind} envelope schema invalid`);
}
function scan(path, name) {
  if (!existsSync(path)) return { status: "unavailable", reason: `${name}_missing`, refs: [], records: [] };
  const raw = readFileSync(path); const ledgerKind = name === "negative_results" ? "negative-result" : "attempted-edit"; const records = []; let open = null; let recoveryStart = null;
  for (const entry of ledgerEntries(raw)) {
    const value = parseLedgerEntry(entry);
    if (recoveryStart !== null) { if (value?.record_kind === "batch_abort") { assertEnvelope(value, "batch_abort", ledgerKind, name); if (!validLedgerAbort(raw, recoveryStart, entry, value)) throw fail("failed", `${name} has an unauthenticated abort`); recoveryStart = null; open = null; } else if (value?.record_kind === "batch_begin" || value?.record_kind === "batch_commit") throw fail("failed", `${name} has an unclosed abandoned region`); continue; }
    if (!value) { recoveryStart = open?.start ?? entry.start; continue; }
    if (!open) { assertEnvelope(value, "batch_begin", ledgerKind, name); open = { start: entry.start, begin: value, rows: [] }; continue; }
    if (value.record_kind === "batch_abort") { assertEnvelope(value, "batch_abort", ledgerKind, name); if (!validLedgerAbort(raw, open.start, entry, value)) throw fail("failed", `${name} has an unauthenticated abort`); open = null; continue; }
    if (value.record_kind === "batch_begin") throw fail("failed", `${name} has a nested batch`);
    if (value.record_kind !== "batch_commit") { if (value.ledger_batch_id !== open.begin.batch_id) throw fail("failed", `${name} row identity mismatch`); try { validateWorkflowEvolutionDefinition(ledgerKind === "negative-result" ? "negative_result" : "attempted_edit", value); } catch (error) { throw fail("failed", `${name} row schema invalid: ${error.message}`); } open.rows.push(value); continue; }
    assertEnvelope(value, "batch_commit", ledgerKind, name); if (value.status !== "committed" || value.batch_id !== open.begin.batch_id || value.ledger_kind !== ledgerKind || value.count !== open.rows.length || value.content_hash !== hash(canonical(open.rows))) throw fail("failed", `${name} committed batch integrity mismatch`);
    records.push(...open.rows); open = null;
  }
  if (recoveryStart !== null || open !== null) throw fail("failed", `${name} has a malformed terminal tail`);
  return { status: records.length ? "ready" : "empty", reason: records.length ? null : "complete_scan_no_matches", refs: [path], records, rawHash: hash(raw) };
}
function sameTarget(left, right) { return left && canonical(left) === canonical(right); }
function matches(record, targetRef) { return sameTarget(record.target_ref, targetRef) || (record.related_targets ?? []).some((entry) => sameTarget(entry, targetRef)); }
function section(sectionId, sourceState, targetRef, filter = true) {
  if (!["ready", "empty"].includes(sourceState.status)) return { section_id: sectionId, status: sourceState.status, reason_code: sourceState.reason, source_refs: sourceState.refs ?? [], items: [] };
  const items = filter ? sourceState.records.filter((entry) => matches(entry, targetRef)) : sourceState.records;
  return { section_id: sectionId, status: items.length ? "ready" : "empty", reason_code: items.length ? null : "complete_scan_no_matches", source_refs: sourceState.refs ?? [], items };
}
function materialSections(decision, spec) {
  if (decision.status !== "ready" || spec.status !== "ready") return {
    retained: { section_id: "retained_behavior", status: "unavailable", reason_code: "current_material_identity_missing", source_refs: [decision.ref, spec.ref].filter(Boolean), items: [] },
    open: { section_id: "open_decisions", status: "unavailable", reason_code: "current_material_identity_missing", source_refs: [decision.ref, spec.ref].filter(Boolean), items: [] },
  };
  const rows = `${decision.bytes.toString("utf8")}\n${spec.bytes.toString("utf8")}`.split(/\r?\n/);
  const retained = rows.flatMap((line, index) => /preserve|non-goal|保留|不得改变/i.test(line) ? [{ anchor: `line:${index + 1}`, text: line.trim() }] : []);
  const open = rows.flatMap((line, index) => /\b(?:OPEN|RISK|DE)-\d+\b/.test(line) && !/closed|已关闭/.test(line) ? [{ anchor: `line:${index + 1}`, text: line.trim() }] : []);
  const refs = [decision.ref, spec.ref];
  return { retained: { section_id: "retained_behavior", status: retained.length ? "ready" : "empty", reason_code: retained.length ? null : "complete_scan_no_matches", source_refs: refs, items: retained }, open: { section_id: "open_decisions", status: open.length ? "ready" : "empty", reason_code: open.length ? null : "complete_scan_no_matches", source_refs: refs, items: open } };
}
function skillSection(path, targetRef) {
  if (targetRef.target_kind !== "skill") return { section_id: "external_skill_updates", status: "not_applicable", reason_code: "target_has_no_related_skill", source_refs: [], items: [] };
  if (!path) return { section_id: "external_skill_updates", status: "not_checked", reason_code: "receipt_not_supplied", source_refs: [], items: [] };
  let receipt; try { receipt = JSON.parse(readFileSync(resolve(path), "utf8")); } catch { return { section_id: "external_skill_updates", status: "unavailable", reason_code: "receipt_unreadable", source_refs: [resolve(path)], items: [] }; }
  const identityPayload = Object.fromEntries(Object.entries(receipt).filter(([key]) => key !== "receipt_id")); const expected = `skill-update-check.v1:${hash(canonical(identityPayload))}`;
  if (receipt.schema_version !== "skill-update-check.v1" || receipt.receipt_id !== expected || receipt.installed_identity?.skill_id !== targetRef.target_id || receipt.installed_identity?.version !== targetRef.target_version) return { section_id: "external_skill_updates", status: "unavailable", reason_code: "receipt_identity_mismatch", source_refs: [resolve(path)], items: [] };
  return { section_id: "external_skill_updates", status: receipt.status === "current" || receipt.status === "update_available" ? "ready" : "unavailable", reason_code: receipt.reason, source_refs: [resolve(path)], items: [receipt] };
}
function assertLock(lock, attemptId) { const current = JSON.parse(readFileSync(lock.lockHandle.path, "utf8")); if (current.owner_token !== lock.ownerToken || current.fencing_token !== lock.fencingToken || current.attempt_id !== attemptId) throw fail("stale_source", "brief lock authority is stale"); }
function currentHash(path) { return existsSync(path) ? hash(readFileSync(path)) : null; }
function decodeHeader(raw) {
  const match = raw.match(/<!-- workflow-evolution-brief:([^ ]+) -->/);
  if (!match) throw fail("failed", "current brief identity header is invalid");
  try { return JSON.parse(Buffer.from(match[1], "base64").toString("utf8")); }
  catch (error) { throw fail("failed", `current brief identity header is invalid: ${error.message}`); }
}
function briefBodyHash(raw) {
  const match = raw.match(/<!-- workflow-evolution-brief:([^ ]+) -->/);
  if (!match) throw fail("failed", "current brief identity header is invalid");
  const header = decodeHeader(raw);
  const normalized = { ...header, body_sha256: null };
  const marker = `<!-- workflow-evolution-brief:${Buffer.from(canonical(normalized)).toString("base64")} -->`;
  return hash(raw.replace(match[0], marker));
}
function verifyCurrentBriefSources(projectRoot, repositoryRoot, header) {
  const target = header.target_ref;
  if (!target?.authority_ref || !existsSync(resolve(target.authority_ref)) || hash(readFileSync(resolve(target.authority_ref))) !== target.authority_sha256) throw fail("stale_source", "current brief target authority identity is stale");
  const current = targetRefForCurrentRepository(repositoryRoot, target);
  if (canonical(current) !== canonical(target)) throw fail("stale_source", "current brief target no longer matches repository authority");
  const sources = header.source_hashes ?? {};
  const paths = {
    candidates: join(projectRoot, "evolution-candidates.jsonl"),
    negatives: join(projectRoot, "negative-results.jsonl"),
    edits: join(projectRoot, "attempted-edits.jsonl"),
    decision: header.decision_log_ref,
    spec: header.spec_ref,
  };
  for (const [name, expected] of Object.entries(sources)) {
    if (expected === null || expected === undefined) continue;
    const ref = paths[name];
    if (!ref || !existsSync(ref) || hash(readFileSync(ref)) !== expected) throw fail("stale_source", `current brief ${name} source identity is stale`);
  }
  if (header.snapshot_id) {
    const projection = readCurrentEvolutionProjection({ storageRoot: projectRoot.replace(/\/Projects\/[^/]+$/, ""), project: header.project, expectedIdentity: { snapshot_id: header.snapshot_id } });
    if (projection.status !== "ok") throw fail(projection.error?.code ?? "stale_source", projection.error?.summary ?? "current candidate projection is stale");
  }
}
function targetRefForCurrentRepository(repositoryRoot, targetRef) {
  const result = target({ project: targetRef.project_id, "target-kind": targetRef.target_kind, "target-id": targetRef.target_id }, repositoryRoot);
  if (result.status !== "ok") throw fail(result.error?.code ?? result.status, result.error?.summary ?? "current target authority is unavailable");
  return result.target_ref;
}
function render(envelope) {
  const lines = ["# Iteration brief", "", `<!-- workflow-evolution-brief:${Buffer.from(canonical(envelope.header)).toString("base64")} -->`, "", `- schema_version: ${envelope.header.schema_version}`, `- project: ${envelope.header.project}`, `- brief_attempt_id: ${envelope.header.brief_attempt_id}`, `- generated_at: ${envelope.header.generated_at}`, `- target: ${JSON.stringify(envelope.header.target_ref)}`, `- status: ${envelope.header.status}`, `- snapshot_id: ${envelope.header.snapshot_id ?? "unknown"}`, ""];
  const labels = { candidates: "Candidates", negative_results: "Negative results", attempted_edits: "Attempted edits", external_skill_updates: "External skill updates", retained_behavior: "Retained behavior", open_decisions: "Open decisions", market_comparison: "Market comparison" };
  for (const value of envelope.sections) lines.push(`## ${labels[value.section_id]}`, "", "```json", JSON.stringify(value, null, 2), "```", "");
  lines.push("本简报只包含事实、状态和证据引用，不提供改法、不自动修改。"); return `${lines.join("\n")}\n`;
}

function main() {
  const options = parse(process.argv.slice(2)); const storageRoot = resolve(required(options.root, "--root")); const project = required(options.project, "--project"); const repositoryRoot = resolve(options["repository-root"] ?? join(import.meta.dirname, "../..")); const path = join(storageRoot, "Projects", project, "iteration-brief.md");
  if (["true", "1"].includes(options["read-current"])) { if (!existsSync(path)) throw fail("unavailable", "current brief is unavailable"); const raw = readFileSync(path, "utf8"); const header = decodeHeader(raw); const sha256 = hash(raw); if (header.project !== project) throw fail("stale_source", "current brief project identity is stale"); if (!/^[a-f0-9]{64}$/.test(header.body_sha256 ?? "") || header.body_sha256 !== briefBodyHash(raw)) throw fail("stale_source", "current brief body identity is stale"); if (options["brief-sha256"] && options["brief-sha256"] !== sha256) throw fail("stale_source", "current brief hash is stale"); verifyCurrentBriefSources(join(storageRoot, "Projects", project), repositoryRoot, header); console.log(JSON.stringify({ status: "ok", path, content_sha256: sha256, header })); return; }
  if (["true", "1"].includes(options.cancelled)) throw fail("cancelled", "brief generation was cancelled");
  const attemptId = options["attempt-id"] ?? options.attempt_id ?? `brief-${randomUUID()}`; const generatedAt = options["generated-at"] ?? options.generated_at ?? new Date().toISOString(); if (!Number.isFinite(Date.parse(generatedAt))) throw fail("invalid_input", "generated_at must be an ISO timestamp");
  const resolvedTarget = target({ ...options, project }, repositoryRoot); if (resolvedTarget.status !== "ok") throw fail(resolvedTarget.error?.code ?? resolvedTarget.status, resolvedTarget.error?.summary ?? "target invalid"); const targetRef = resolvedTarget.target_ref;
  const decision = source(options["decision-log"], options["decision-log-sha256"], "decision_log"); const spec = source(options.spec, options["spec-sha256"], "spec"); const projectRoot = join(storageRoot, "Projects", project);
  const projection = readCurrentEvolutionProjection({ storageRoot, project, expectedIdentity: options["snapshot-id"] ? { snapshot_id: options["snapshot-id"] } : undefined });
  if (projection.status === "stale_source" || projection.status === "failed") throw fail(projection.error?.code ?? projection.status, projection.error?.summary ?? "candidate projection invalid");
  const candidateState = projection.status === "ok" ? { status: projection.candidates.length ? "ready" : "empty", reason: projection.candidates.length ? null : "complete_scan_no_matches", refs: [join(projectRoot, "evolution-candidates.jsonl")], records: projection.candidates } : { status: "unavailable", reason: "candidate_snapshot_unavailable", refs: [], records: [] };
  const negatives = scan(join(projectRoot, "negative-results.jsonl"), "negative_results"); const edits = scan(join(projectRoot, "attempted-edits.jsonl"), "attempted_edits"); const materials = materialSections(decision, spec);
  const sections = [section("candidates", candidateState, targetRef), section("negative_results", negatives, targetRef), section("attempted_edits", edits, targetRef), skillSection(options["skill-update-receipt"], targetRef), materials.retained, materials.open, { section_id: "market_comparison", status: "not_checked", reason_code: "DE-003", source_refs: [], items: [] }];
  const status = sections.every((entry) => ["ready", "empty", "not_applicable"].includes(entry.status)) ? "ready" : "degraded"; const observedCurrentHash = currentHash(path);
  const sourceHashes = { candidates: existsSync(join(projectRoot, "evolution-candidates.jsonl")) ? hash(readFileSync(join(projectRoot, "evolution-candidates.jsonl"))) : null, negatives: existsSync(join(projectRoot, "negative-results.jsonl")) ? negatives.rawHash : null, edits: existsSync(join(projectRoot, "attempted-edits.jsonl")) ? edits.rawHash : null, decision: decision.sha256 ?? null, spec: spec.sha256 ?? null };
  let header = { schema_version: "workflow-evolution-brief.v1", project, brief_attempt_id: attemptId, generated_at: generatedAt, target_ref: targetRef, snapshot_id: projection.snapshot_id ?? null, decision_log_ref: decision.ref ?? null, decision_log_sha256: decision.sha256 ?? null, spec_ref: spec.ref ?? null, spec_sha256: spec.sha256 ?? null, source_hashes: sourceHashes, status };
  header = { ...header, body_sha256: briefBodyHash(render({ header: { ...header, body_sha256: null }, sections })) };
  const raw = render({ header, sections }); const lock = acquireProjectLock({ storageRoot, project, attemptId, ownerToken: randomUUID(), manualRecovery: options["manual-recovery"] ? JSON.parse(options["manual-recovery"]) : undefined }); if (lock.status !== "ok") throw fail(lock.error?.code ?? lock.status, lock.error?.summary ?? "lock unavailable");
  const tmp = join(projectRoot, `.iteration-brief.${attemptId}.${lock.ownerToken}.tmp`); let renamed = false;
  try {
    if (currentHash(path) !== observedCurrentHash) throw fail("conflict", "current brief changed before publication");
    if (observedCurrentHash && existsSync(path)) { const currentHeader = decodeHeader(readFileSync(path, "utf8")); if (currentHeader.brief_attempt_id === attemptId) throw fail("conflict", "brief_attempt_id was already used"); }
    assertLock(lock, attemptId); mkdirSync(projectRoot, { recursive: true }); const fd = openSync(tmp, "wx"); try { writeFileSync(fd, raw); fsyncSync(fd); } finally { closeSync(fd); }
    const currentSourceHashes = { candidates: existsSync(join(projectRoot, "evolution-candidates.jsonl")) ? hash(readFileSync(join(projectRoot, "evolution-candidates.jsonl"))) : null, negatives: existsSync(join(projectRoot, "negative-results.jsonl")) ? hash(readFileSync(join(projectRoot, "negative-results.jsonl"))) : null, edits: existsSync(join(projectRoot, "attempted-edits.jsonl")) ? hash(readFileSync(join(projectRoot, "attempted-edits.jsonl"))) : null, decision: decision.ref ? hash(readFileSync(decision.ref)) : null, spec: spec.ref ? hash(readFileSync(spec.ref)) : null };
    if (canonical(currentSourceHashes) !== canonical(sourceHashes)) throw fail("stale_source", "brief source inventory changed"); if (hash(readFileSync(tmp)) !== hash(raw)) throw fail("stale_source", "brief temp content changed"); assertLock(lock, attemptId); renameSync(tmp, path); renamed = true;
    try { const parent = openSync(projectRoot, "r"); try { fsyncSync(parent); } finally { closeSync(parent); } } catch (error) {
      assertLock(lock, attemptId);
      const observedHash = currentHash(path);
      const durability = { status: "durability_unknown", path, attempt_id: attemptId, intended_sha256: hash(raw), observed_sha256: observedHash, idempotent_current: observedHash === hash(raw), reason: error.message };
      console.log(JSON.stringify(durability)); process.exitCode = 1; return;
    }
    console.log(JSON.stringify({ status: "ok", path, attempt_id: attemptId, content_sha256: hash(raw) }));
  } finally { if (!renamed && existsSync(tmp)) unlinkSync(tmp); lock.release(); }
}

try { main(); } catch (error) { console.log(JSON.stringify({ status: error.code ?? "failed", error: { code: error.code ?? "failed", summary: error.message } })); process.exitCode = 1; }
