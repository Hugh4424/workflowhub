import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import { artifactReference, assertArtifactDir } from "./artifact-dir.mjs";
import { contentHash } from "./canonical-source.mjs";
import { checkSkillClosure } from "./check-skill-closure.mjs";
import {
  createArtifactRecord,
  createHealthFact,
  createTranscriptRecord,
  mergeArtifactRecords,
  mergeHealthFacts,
  mergeSkills,
  mergeTranscriptRecords,
  parseJsonl,
  safeError,
  toJsonl,
  validateSkillsInventory,
  validateSkillsSchemaContract,
} from "./fact-indexes.mjs";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";
import { assertTaskHandle, assertTaskKernel } from "./task-handle.mjs";
import { assertWorkspace } from "./workspace.mjs";

const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const INDEX_REFS = Object.freeze([
  "indexes/transcript-index.jsonl",
  "indexes/artifact-index.jsonl",
  "indexes/flow-health-facts.jsonl",
  "indexes/skills-inventory.json",
]);
const REGISTRIES = new WeakSet();
const READERS = new WeakSet();
const WRITE_TEST_HOOKS = new WeakSet();
const ENTRY_FIELDS = new Set(["source_id", "source_ref", "source_format", "source_version", "required", "reader"]);
const WRITE_HOOK_NAMES = new Set(["afterParentPrecheck", "beforeFileFsync", "afterOpenBeforeRename", "beforeDirectoryFsync"]);
const text = (value) => typeof value === "string" && value.trim() !== "";
const plain = (value) => value && typeof value === "object" && !Array.isArray(value);

function safeRef(value) {
  return text(value) && !path.isAbsolute(value) && !value.includes("\\")
    && !value.split("/").some((part) => part === "" || part === "." || part === "..");
}

/** Minted only by a launcher (or a test launcher); paths never leave this capability. */
export function createTranscriptSourceReader(read) {
  if (typeof read !== "function") throw new TypeError("transcript reader must be a function");
  const reader = Object.freeze({ read: () => read() });
  READERS.add(reader);
  return reader;
}

/** Validate and brand the complete, closed transcript-source registry. */
export function createTranscriptSourceRegistry(entries) {
  if (!Array.isArray(entries)) throw new TypeError("transcript registry entries must be an array");
  const ids = new Set();
  const normalized = entries.map((entry) => {
    if (!plain(entry) || Object.keys(entry).length !== ENTRY_FIELDS.size || Object.keys(entry).some((field) => !ENTRY_FIELDS.has(field))) {
      throw new TypeError("transcript source entry must contain exactly the registered fields");
    }
    if (!text(entry.source_id) || !safeRef(entry.source_ref) || entry.source_format !== "jsonl" || !text(entry.source_version) || typeof entry.required !== "boolean") {
      throw new TypeError("invalid transcript source entry");
    }
    if (ids.has(entry.source_id)) throw new TypeError(`duplicate transcript source_id: ${entry.source_id}`);
    if (!READERS.has(entry.reader)) throw new TypeError("launcher-issued transcript reader capability required");
    ids.add(entry.source_id);
    return Object.freeze({ ...entry });
  });
  const registry = Object.freeze(normalized);
  REGISTRIES.add(registry);
  return registry;
}

/** Test-only capability. Launchers never receive raw atomic-write hooks. */
export function createFactCollectorWriteTestHooks(hooks) {
  if (!plain(hooks) || Object.keys(hooks).some((name) => !WRITE_HOOK_NAMES.has(name) || typeof hooks[name] !== "function")) {
    throw new TypeError("fact collector write test hooks must be known functions");
  }
  const capability = Object.freeze({ ...hooks });
  WRITE_TEST_HOOKS.add(capability);
  return capability;
}

function assertRegistry(registry) {
  if (!REGISTRIES.has(registry)) throw new TypeError("branded transcript source registry required");
  return registry;
}

function wrongWorktree(message) {
  const error = new Error(message);
  error.code = "WRONG_WORKTREE";
  return error;
}

/** No optional source is read before this check completes. */
export function preflightFactCollection(ctx) {
  if (!plain(ctx)) throw wrongWorktree("WRONG_WORKTREE: branded StageContext required");
  const task = assertTaskHandle(ctx.task);
  const kernel = assertTaskKernel(ctx.kernel);
  const workspace = assertWorkspace(ctx.workspace);
  const artifacts = assertArtifactDir(ctx.artifacts);
  if (ctx.identity?.projectName !== task.identity.projectName || ctx.identity?.taskId !== task.identity.taskId || kernel.task !== task) {
    throw wrongWorktree("WRONG_WORKTREE: StageContext identity mismatch");
  }
  let decision;
  try { decision = kernel.readAccepted("make-decision"); }
  catch (error) { throw wrongWorktree(`WRONG_WORKTREE: accepted make-decision unavailable (${error.code ?? "invalid"})`); }
  const accepted = decision?.accepted;
  const attempt = decision?.attempt;
  const facts = decision?.facts;
  const attemptRef = accepted?.attempt_ref;
  if (!text(attemptRef) || !/^attempt-[0-9]{4}\.json$/.test(attemptRef)) throw wrongWorktree("WRONG_WORKTREE: accepted make-decision attempt reference invalid");
  if (attempt?.task_id !== task.identity.taskId || attempt?.stage !== "make-decision" || !plain(facts)
      || facts.worktree_root !== workspace.worktreeRoot || facts.baseline_commit !== workspace.baselineCommit) {
    throw wrongWorktree("WRONG_WORKTREE: accepted Workspace binding mismatch");
  }
  let snapshot;
  try { workspace.assertValid(); snapshot = captureGitWorktreeSnapshot(workspace.worktreeRoot); }
  catch { throw wrongWorktree("WRONG_WORKTREE: Workspace snapshot unavailable"); }
  return Object.freeze({ task, kernel, workspace, artifacts, accepted, decisionAttempt: attempt, snapshot });
}

function transcriptError(entry, status, reason, code) {
  return createTranscriptRecord({
    record_kind: "source_status", id: entry.source_id, status, source_ref: entry.source_ref,
    source_format: entry.source_format, source_version: entry.source_version, reason,
    error: code ? safeError(code, code) : null,
  });
}

function transcriptLines(entry, bytes) {
  const records = [];
  String(bytes).split(/\r?\n/).forEach((line, offset) => {
    if (!line.trim()) return;
    try {
      const value = JSON.parse(line);
      if (!plain(value) || !text(value.id)) throw new Error("invalid transcript line");
      records.push(createTranscriptRecord({
        record_kind: "transcript", id: value.id, run_id: text(value.run_id) ? value.run_id : null,
        status: "present", source_ref: entry.source_ref, source_format: entry.source_format,
        source_version: entry.source_version, line_number: offset + 1, payload: value.payload ?? null,
      }));
    } catch {
      records.push(createTranscriptRecord({
        record_kind: "parse_error", id: `bad-line:${entry.source_id}:${offset + 1}`, status: "unknown",
        source_ref: entry.source_ref, source_format: entry.source_format, source_version: entry.source_version,
        line_number: offset + 1, reason: "malformed_line", error: safeError("MALFORMED_LINE", "Malformed JSONL record"),
      }));
    }
  });
  return records;
}

export function buildTranscriptProjection(registry) {
  const sources = assertRegistry(registry);
  if (sources.length === 0) return [createTranscriptRecord({
    record_kind: "source_status", id: "transcript-source-registry", status: "missing", reason: "no_registered_source",
  })];
  const candidates = [];
  for (const entry of sources) {
    if (entry.source_format !== "jsonl" || entry.source_version !== "v1") {
      candidates.push(transcriptError(entry, "unknown", "unsupported_format", "UNSUPPORTED_FORMAT"));
      continue;
    }
    try {
      const value = entry.reader.read();
      if (!(typeof value === "string" || Buffer.isBuffer(value) || value instanceof Uint8Array)) throw new TypeError("reader must return bytes");
      candidates.push(...transcriptLines(entry, value));
    } catch (error) {
      const missing = error?.code === "ENOENT";
      candidates.push(transcriptError(entry, missing ? "missing" : "unknown", missing ? "not_found" : "read_error", missing ? null : "READ_ERROR"));
    }
  }
  const merged = mergeTranscriptRecords(candidates);
  if (!merged.ok) throw new Error(`transcript projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

function referenceRecord(preflight, ref) {
  try {
    const probeRef = artifactReference(preflight.task.identity.taskId, "fact-collector-probe");
    const artifactPrefix = `${probeRef.split("/").slice(0, -1).join("/")}/`;
    if (ref.startsWith(artifactPrefix)) {
      const name = ref.slice(artifactPrefix.length);
      return preflight.artifacts.read(name);
    }
    return preflight.task.readRecord(ref);
  } catch (error) {
    throw error;
  }
}

function artifactForReference(preflight, { kind, ref, source_ref, run_id = null, stage = null, required = true }) {
  try {
    const raw = referenceRecord(preflight, ref);
    return createArtifactRecord({ record_kind: kind, id: ref, run_id, stage, status: "present", ref, required, content_hash: contentHash(String(raw)), source_ref });
  } catch (error) {
    const missing = error?.code === "ENOENT";
    return createArtifactRecord({ record_kind: kind, id: ref, run_id, stage, status: missing ? "missing" : "unknown", ref, required, source_ref, reason: missing ? "not_found" : "read_error", error: missing ? null : safeError("READ_ERROR", "READ_ERROR") });
  }
}

function addFactRefs(target, facts, sourceRef, stage, runId) {
  const add = (kind, ref) => { if (text(ref) && safeRef(ref)) target.push({ kind, ref, source_ref: sourceRef, stage, run_id: runId }); };
  for (const key of ["decision_ref", "spec_ref", "plan_ref", "tasks_ref"]) add("artifact", facts?.[key]);
  for (const ref of facts?.changed ?? []) add("artifact", ref);
  for (const item of [facts?.review, ...(Object.values(facts?.reviews ?? {}))]) add("review", item?.result_ref);
  add("test", facts?.tests?.receipt_ref); add("test", facts?.tests?.output_ref);
  for (const entry of facts?.evidence_refs ?? []) add("evidence", typeof entry === "string" ? entry : entry?.ref);
  for (const entry of facts?.handoff_refs ?? []) add("handoff", entry?.ref ?? entry);
  add("handoff", facts?.handoff_ref);
}

function readAttempt(preflight, ref, stage) {
  try {
    const raw = preflight.task.readRecord(ref);
    const value = JSON.parse(raw);
    if (value?.task_id !== preflight.task.identity.taskId || value?.stage !== stage || !plain(value.facts)) throw new Error("canonical attempt identity mismatch");
    return { value, raw };
  } catch (error) { return { error }; }
}

export function buildArtifactProjection(preflight) {
  const candidates = [];
  const attempts = [];
  for (const stage of STAGES) {
    const refs = new Set(preflight.task.listStageAttemptRefs(stage));
    try {
      const accepted = preflight.kernel.readAccepted(stage).accepted;
      if (/^attempt-[0-9]{4}\.json$/.test(accepted?.attempt_ref ?? "")) refs.add(`results/${stage}/${accepted.attempt_ref}`);
    } catch (error) { if (error?.code && error.code !== "ENOENT") candidates.push(createArtifactRecord({ record_kind: "stage_result", id: `${stage}:accepted`, stage, status: "unknown", ref: `results/${stage}/accepted.json`, required: false, source_ref: `results/${stage}/accepted.json`, reason: "read_error", error: safeError("READ_ERROR", "READ_ERROR") })); }
    for (const ref of [...refs].sort()) attempts.push({ stage, ref });
  }
  for (const { stage, ref } of attempts) {
    const parsed = readAttempt(preflight, ref, stage);
    if (parsed.error) {
      const missing = parsed.error?.code === "ENOENT";
      candidates.push(createArtifactRecord({ record_kind: "stage_result", id: `${stage}:${path.basename(ref)}`, stage, status: missing ? "missing" : "unknown", ref, required: true, source_ref: ref, reason: missing ? "not_found" : "read_error", error: missing ? null : safeError("READ_ERROR", "READ_ERROR") }));
      continue;
    }
    const runId = text(parsed.value.run_id) ? parsed.value.run_id : null;
    candidates.push(createArtifactRecord({ record_kind: "stage_result", id: `${stage}:${path.basename(ref)}`, run_id: runId, stage, status: "present", ref, required: true, content_hash: contentHash(parsed.value), source_ref: ref }));
    const declared = [];
    addFactRefs(declared, parsed.value.facts, ref, stage, runId);
    for (const item of parsed.value.evidence_refs ?? []) if (plain(item)) addFactRefs(declared, { evidence_refs: [item] }, ref, stage, runId);
    for (const item of declared) candidates.push(artifactForReference(preflight, item));
  }
  const merged = mergeArtifactRecords(candidates);
  if (!merged.ok) throw new Error(`artifact projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

function inventorySkill(entry) {
  return {
    name: entry.name, path: entry.path, version: entry.local_version ?? null,
    stage: Array.isArray(entry.used_by_stages) && entry.used_by_stages.length === 1 ? entry.used_by_stages[0] : null,
    owner: "workflowhub", source: entry.status === "native" ? "repo" : "external_adapted",
    portable: true, metrics_expected: false, subagent_friendly: true,
    description: entry.purpose ?? null,
  };
}

export function buildSkillsProjection(preflight, now = () => new Date()) {
  const root = preflight.workspace.worktreeRoot;
  const schema = JSON.parse(fs.readFileSync(path.join(root, "specs/m14a-audit-contract-layer/skills-inventory.schema.json"), "utf8"));
  const contract = validateSkillsSchemaContract(schema);
  if (!contract.ok) throw new Error(contract.error.message);
  const catalog = yaml.load(fs.readFileSync(path.join(root, "skills/catalog.yaml"), "utf8"));
  if (!Array.isArray(catalog?.skills)) throw new Error("skills catalog is invalid");
  const closure = checkSkillClosure(root);
  const result = mergeSkills(catalog.skills.map(inventorySkill), { generated_at: now().toISOString() });
  if (!result.ok) throw new Error(result.error?.message ?? result.code ?? "skills inventory invalid");
  return Object.freeze({ inventory: result.inventory, closure });
}

export function buildHealthProjection(preflight, transcript, artifacts, skills) {
  const transcriptStatus = transcript.some((item) => item.status === "unknown") ? "unknown" : transcript.some((item) => item.status === "present") ? "present" : "missing";
  const artifactStatus = artifacts.some((item) => item.status === "unknown") ? "unknown" : artifacts.some((item) => item.status === "missing") ? "missing" : "present";
  const artifactRefs = artifacts.filter((item) => item.record_kind === "review");
  const verify = artifacts.filter((item) => item.stage === "verify-code" && item.record_kind === "stage_result");
  const handoff = artifacts.filter((item) => item.record_kind === "handoff");
  const facts = [
    createHealthFact({ fact_id: "health:task_dir", domain: "task_dir", status: "present", observed_value: true, source_ref: "task.json" }),
    createHealthFact({ fact_id: "health:worktree", domain: "worktree", status: "present", observed_value: preflight.snapshot.tree, source_ref: "results/make-decision/accepted.json" }),
    createHealthFact({ fact_id: "health:review", domain: "review", status: artifactRefs.some((item) => item.status === "unknown") ? "unknown" : artifactRefs.length ? "present" : "unknown", observed_value: artifactRefs.length, source_ref: artifactRefs[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:verify", domain: "verify", status: verify.some((item) => item.status === "unknown") ? "unknown" : verify.length ? "present" : "unknown", observed_value: verify.length, source_ref: verify[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:handoff", domain: "handoff", status: handoff.some((item) => item.status === "unknown") ? "unknown" : handoff.length ? "present" : "unknown", observed_value: handoff.length, source_ref: handoff[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:transcript", domain: "transcript", status: transcriptStatus, observed_value: transcript.filter((item) => item.status === "present").length, source_ref: transcript[0]?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:artifact_missing", domain: "artifact_missing", status: artifactStatus, observed_value: artifacts.filter((item) => item.status === "missing").length, source_ref: artifacts.find((item) => item.status !== "present")?.source_ref ?? null }),
    createHealthFact({ fact_id: "health:skill_missing", domain: "skill_missing", status: skills.closure.ok ? "present" : "missing", observed_value: skills.closure.ok, source_ref: "skills/catalog.yaml", reason: skills.closure.ok ? null : "not_found" }),
    createHealthFact({ fact_id: "health:token_waste", domain: "token_waste", status: "unknown", observed_value: null, reason: "not_found" }),
  ];
  const merged = mergeHealthFacts(facts);
  if (!merged.ok) throw new Error(`health projection invalid: ${merged.code ?? "INVALID_RECORD"}`);
  return merged.records;
}

export function collectTaskFacts(ctx, { transcriptRegistry, now = () => new Date(), writeTestHooks } = {}) {
  const preflight = preflightFactCollection(ctx);
  assertRegistry(transcriptRegistry);
  const atomicWriteOptions = writeTestHooks === undefined ? undefined : { testHooks: assertWriteTestHooks(writeTestHooks) };
  const warnings = [];
  let lockFailed = false;
  const files = new Map(INDEX_REFS.map((ref) => [ref, { ref, saved: false, error: null }]));
  const fail = (ref, error) => {
    files.set(ref, { ref, saved: false, error: resultError(error) });
  };
  const save = (ref) => files.set(ref, { ref, saved: true, error: null });

  try {
    const result = preflight.task.withRecordLock("locks/indexes/fact-collection.lock", () => {
      const transcript = persistJsonl(preflight.task, INDEX_REFS[0], "transcript", mergeTranscriptRecords, atomicWriteOptions,
        () => buildTranscriptProjection(transcriptRegistry));
      transcript.saved ? save(INDEX_REFS[0]) : fail(INDEX_REFS[0], transcript.error);

      const artifacts = persistJsonl(preflight.task, INDEX_REFS[1], "artifact", mergeArtifactRecords, atomicWriteOptions,
        () => buildArtifactProjection(preflight));
      artifacts.saved ? save(INDEX_REFS[1]) : fail(INDEX_REFS[1], artifacts.error);

      let skills;
      try { skills = buildSkillsProjection(preflight, now); }
      catch (error) { skills = { error, closure: { ok: false } }; }
      if (!skills.closure.ok) warnings.push({ code: "SKILL_CLOSURE_FAILED", message: "Skill closure validation failed" });

      const health = persistJsonl(preflight.task, INDEX_REFS[2], "health", mergeHealthFacts, atomicWriteOptions,
        () => buildHealthProjection(preflight, transcript.records, artifacts.records, skills),
        (existing, fresh) => fresh.some((fact) => fact.fact_id === existing.fact_id));
      health.saved ? save(INDEX_REFS[2]) : fail(INDEX_REFS[2], health.error);

      const savedSkills = persistSkills(preflight.task, skills, atomicWriteOptions);
      savedSkills.saved ? save(INDEX_REFS[3]) : fail(INDEX_REFS[3], savedSkills.error);
    });
    if (result && typeof result.then === "function") throw new Error("asynchronous record locks are unsupported by collectTaskFacts");
  } catch (error) {
    lockFailed = true;
    for (const ref of INDEX_REFS) if (!files.get(ref).saved) fail(ref, error);
    warnings.push({ code: "RECORD_LOCK_FAILED", message: "Fact index lock operation failed" });
  }
  const ordered = INDEX_REFS.map((ref) => files.get(ref));
  return { status: !lockFailed && ordered.every((file) => file.saved) ? "success" : "failed", files: ordered, warnings };
}

function assertWriteTestHooks(value) {
  if (!WRITE_TEST_HOOKS.has(value)) throw new TypeError("branded fact collector write test hooks required");
  return value;
}

function resultError(error) {
  const code = typeof error?.code === "string" && error.code ? error.code : "WRITE_FAILED";
  return { code, message: safeError(code, "Fact index write failed").message };
}

function existingJsonl(task, ref, index) {
  try { return parseJsonl(task.readRecord(ref), { index, source_ref: ref }); }
  catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function finalJsonl(task, ref, index, fallback) {
  try { return existingJsonl(task, ref, index); }
  catch { return fallback; }
}

function persistJsonl(task, ref, index, merge, atomicWriteOptions, candidates, replacesExisting = () => false) {
  let existing = [];
  try {
    existing = existingJsonl(task, ref, index);
    const fresh = candidates();
    const merged = merge([...existing.filter((record) => !replacesExisting(record, fresh)), ...fresh]);
    if (!merged.ok) return { saved: false, error: merged.error ?? { code: merged.code }, records: existing };
    task.writeRecordAtomic(ref, toJsonl(merged.records), atomicWriteOptions);
    return { saved: true, records: merged.records };
  } catch (error) {
    return { saved: false, error, records: finalJsonl(task, ref, index, existing) };
  }
}

function existingSkills(task) {
  try {
    const parsed = JSON.parse(task.readRecord(INDEX_REFS[3]));
    if (parsed?.schema_version !== "v1") throw Object.assign(new Error("skills inventory schema is unsupported"), { code: "UNSUPPORTED_FORMAT" });
    if (!validateSkillsInventory(parsed).ok) throw Object.assign(new Error("skills inventory is invalid"), { code: "INVALID_RECORD" });
    return parsed.skills;
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function persistSkills(task, skills, atomicWriteOptions) {
  if (skills.error) return { saved: false, error: skills.error };
  try {
    const merged = mergeSkills([...existingSkills(task), ...skills.inventory.skills], {
      schema_version: skills.inventory.schema_version,
      generated_at: skills.inventory.generated_at,
    });
    if (!merged.ok) return { saved: false, error: merged.error ?? { code: merged.code } };
    task.writeRecordAtomic(INDEX_REFS[3], `${JSON.stringify(merged.inventory, null, 2)}\n`, atomicWriteOptions);
    return { saved: true };
  } catch (error) {
    return { saved: false, error };
  }
}
