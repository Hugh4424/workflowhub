import { canonicalJson, contentHash } from "./canonical-source.mjs";

export const FACT_SCHEMA_VERSION = "v1";
export const COLLECTOR_VERSION = "v1";
export const SKILLS_SCHEMA_ID = "https://workflowhub.local/schemas/skills-inventory.schema.json";

const STATUSES = new Set(["present", "missing", "unknown"]);
const TRANSCRIPT_KINDS = new Set(["transcript", "source_status", "parse_error"]);
const ARTIFACT_KINDS = new Set(["stage_result", "handoff", "artifact", "evidence", "review", "test"]);
const TRANSCRIPT_REASONS = new Set(["no_registered_source", "not_found", "read_error", "unsupported_format", "malformed_line", "duplicate_id_conflict"]);
const ARTIFACT_REASONS = new Set(["not_found", "read_error", "unsupported_format", "duplicate_id_conflict"]);
const HEALTH_DOMAINS = new Set([
  "task_dir", "worktree", "review", "verify", "handoff", "transcript",
  "skill_missing", "artifact_missing", "token_waste",
]);
const SKILL_FIELDS = new Set(["name", "path", "version", "stage", "owner", "source", "portable", "metrics_expected", "subagent_friendly", "description", "inputs", "outputs", "required_reads", "notes"]);
const TRANSCRIPT_FIELDS = new Set(["schema_version", "collector_version", "record_kind", "id", "run_id", "status", "source_ref", "source_format", "source_version", "line_number", "content_hash", "payload", "reason", "error", "variant_hashes", "variant_source_refs"]);
const ARTIFACT_FIELDS = new Set(["schema_version", "collector_version", "record_kind", "id", "run_id", "stage", "status", "ref", "required", "content_hash", "source_ref", "reason", "error"]);
const HEALTH_FIELDS = new Set(["schema_version", "collector_version", "fact_id", "run_id", "stage", "domain", "status", "observed_value", "source_ref", "reason", "error"]);

const text = (value) => typeof value === "string" && value.trim() ? value : null;
const nullableText = (value) => value == null || typeof value === "string";
const nullableObject = (value) => value == null || (typeof value === "object" && !Array.isArray(value));
const sortedUnique = (values) => [...new Set(values.filter(text))].sort((a, b) => a.localeCompare(b));
const sameOrNull = (values) => values.every((value) => value === values[0]) ? values[0] : null;

export function safeError(code, message) {
  const known = {
    MALFORMED_LINE: "Malformed JSONL record",
    DUPLICATE_ID_CONFLICT: "Conflicting records share the same identity",
    UNSUPPORTED_FORMAT: "Unsupported schema version",
    CONTRACT_MISMATCH: "Skills inventory schema contract does not match",
  };
  return { code, message: known[code] ?? "Fact index error" };
}

export function createTranscriptRecord(input = {}) {
  return {
    schema_version: input.schema_version ?? FACT_SCHEMA_VERSION,
    collector_version: input.collector_version ?? COLLECTOR_VERSION,
    record_kind: input.record_kind ?? "transcript",
    id: input.id ?? null,
    run_id: input.run_id ?? null,
    status: input.status ?? "unknown",
    source_ref: input.source_ref ?? null,
    source_format: input.source_format ?? null,
    source_version: input.source_version ?? null,
    line_number: input.line_number ?? null,
    content_hash: input.content_hash ?? null,
    payload: input.payload ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
    variant_hashes: sortedUnique(input.variant_hashes ?? []),
    variant_source_refs: sortedUnique(input.variant_source_refs ?? []),
  };
}

export function createArtifactRecord(input = {}) {
  return {
    schema_version: input.schema_version ?? FACT_SCHEMA_VERSION,
    collector_version: input.collector_version ?? COLLECTOR_VERSION,
    record_kind: input.record_kind ?? "artifact",
    id: input.id ?? null,
    run_id: input.run_id ?? null,
    stage: input.stage ?? null,
    status: input.status ?? "unknown",
    ref: input.ref ?? null,
    required: input.required ?? false,
    content_hash: input.content_hash ?? null,
    source_ref: input.source_ref ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
  };
}

export function createHealthFact(input = {}) {
  return {
    schema_version: input.schema_version ?? FACT_SCHEMA_VERSION,
    collector_version: input.collector_version ?? COLLECTOR_VERSION,
    fact_id: input.fact_id ?? null,
    run_id: input.run_id ?? null,
    stage: input.stage ?? null,
    domain: input.domain ?? "artifact_missing",
    status: input.status ?? "unknown",
    observed_value: input.observed_value ?? null,
    source_ref: input.source_ref ?? null,
    reason: input.reason ?? null,
    error: input.error ?? null,
  };
}

function validateCommon(record, errors) {
  if (!record || typeof record !== "object" || Array.isArray(record)) { errors.push("record must be an object"); return; }
  if (record?.schema_version !== FACT_SCHEMA_VERSION) errors.push("schema_version is unsupported");
  if (!text(record?.collector_version)) errors.push("collector_version is required");
  if (!STATUSES.has(record?.status)) errors.push("status is invalid");
  if (!nullableText(record?.run_id) || !nullableText(record?.source_ref) || !nullableText(record?.reason)) errors.push("nullable text field is invalid");
  if (!nullableObject(record?.error)) errors.push("error must be an object or null");
  if (record?.error && (!text(record.error.code) || !text(record.error.message) || Object.keys(record.error).some((key) => key !== "code" && key !== "message"))) {
    errors.push("error must contain only code and message");
  }
}

function validateShape(record, fields, errors) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return;
  for (const field of fields) if (!Object.hasOwn(record, field)) errors.push(`${field} is required`);
  for (const field of Object.keys(record)) if (!fields.has(field)) errors.push(`field ${field} is not allowed`);
}

export function validateTranscriptRecord(record) {
  const errors = [];
  validateShape(record, TRANSCRIPT_FIELDS, errors);
  validateCommon(record, errors);
  if (!TRANSCRIPT_KINDS.has(record?.record_kind)) errors.push("record_kind is invalid");
  if (!text(record?.id)) errors.push("id is required");
  for (const field of ["source_format", "source_version"]) if (!nullableText(record?.[field])) errors.push(`${field} is invalid`);
  if (record?.line_number != null && (!Number.isInteger(record.line_number) || record.line_number < 1)) errors.push("line_number is invalid");
  if (!nullableText(record?.content_hash) || !nullableObject(record?.payload)) errors.push("content fields are invalid");
  for (const field of ["variant_hashes", "variant_source_refs"]) if (!Array.isArray(record?.[field]) || record[field].some((value) => !text(value))) errors.push(`${field} is invalid`);
  if (record?.reason != null && !TRANSCRIPT_REASONS.has(record.reason)) errors.push("reason is invalid");
  if (record?.reason === "duplicate_id_conflict") {
    if (record.status !== "unknown" || record.content_hash !== null || record.payload !== null || record.variant_hashes.length === 0) errors.push("conflict record is invalid");
  } else if (record?.variant_hashes?.length || record?.variant_source_refs?.length) errors.push("variant fields are reserved for conflicts");
  return { ok: errors.length === 0, errors };
}

export function validateArtifactRecord(record) {
  const errors = [];
  validateShape(record, ARTIFACT_FIELDS, errors);
  validateCommon(record, errors);
  if (!ARTIFACT_KINDS.has(record?.record_kind)) errors.push("record_kind is invalid");
  if (!text(record?.id) || !text(record?.ref) || !text(record?.source_ref)) errors.push("id, ref, and source_ref are required");
  if (!nullableText(record?.stage) || !nullableText(record?.content_hash)) errors.push("nullable artifact field is invalid");
  if (typeof record?.required !== "boolean") errors.push("required must be boolean");
  if (record?.reason != null && !ARTIFACT_REASONS.has(record.reason)) errors.push("reason is invalid");
  if (record?.reason === "duplicate_id_conflict" && (record.status !== "unknown" || record.content_hash !== null)) errors.push("conflict record is invalid");
  return { ok: errors.length === 0, errors };
}

export function validateHealthFact(record) {
  const errors = [];
  validateShape(record, HEALTH_FIELDS, errors);
  validateCommon(record, errors);
  if (!text(record?.fact_id)) errors.push("fact_id is required");
  if (!HEALTH_DOMAINS.has(record?.domain)) errors.push("domain is invalid");
  if (!nullableText(record?.stage)) errors.push("stage is invalid");
  const value = record?.observed_value;
  if (!(value == null || typeof value === "boolean" || typeof value === "string" || (Number.isInteger(value)))) errors.push("observed_value is invalid");
  return { ok: errors.length === 0, errors };
}

export function transcriptHash(record) {
  return contentHash({ record_kind: record.record_kind, id: record.id, run_id: record.run_id, payload: record.payload });
}

export function artifactHash(record) {
  return record.content_hash ?? contentHash({
    record_kind: record.record_kind, id: record.id, run_id: record.run_id, stage: record.stage,
    status: record.status, required: record.required,
  });
}

export function healthHash(record) {
  return contentHash({
    fact_id: record.fact_id, run_id: record.run_id, stage: record.stage, domain: record.domain,
    status: record.status, observed_value: record.observed_value, reason: record.reason,
  });
}

function unsupported(records) {
  return records.some((record) => record?.schema_version !== FACT_SCHEMA_VERSION)
    ? { ok: false, code: "UNSUPPORTED_FORMAT", error: safeError("UNSUPPORTED_FORMAT", "Unsupported schema version") }
    : null;
}

function stableRecord(record) {
  return canonicalJson(record);
}

function group(records, key) {
  const groups = new Map();
  for (const record of records) {
    const id = key(record);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(record);
  }
  return groups;
}

function deterministic(records) {
  return [...records].sort((left, right) => stableRecord(left).localeCompare(stableRecord(right)))[0];
}

function mergeTranscriptGroup(records) {
  const hashes = sortedUnique(records.map(transcriptHash));
  if (hashes.length === 1) {
    const record = deterministic(records);
    return createTranscriptRecord({ ...record, content_hash: hashes[0], source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null });
  }
  const first = deterministic(records);
  return createTranscriptRecord({
    ...first, status: "unknown", content_hash: null, payload: null, reason: "duplicate_id_conflict",
    error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting records share the same identity"),
    run_id: sameOrNull(records.map((item) => item.run_id)),
    source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null,
    variant_hashes: hashes, variant_source_refs: sortedUnique(records.map((item) => item.source_ref)),
  });
}

function mergeArtifactGroup(records) {
  const hashes = sortedUnique(records.map(artifactHash));
  if (hashes.length === 1) {
    const record = deterministic(records);
    return createArtifactRecord({ ...record, content_hash: record.content_hash, ref: sortedUnique(records.map((item) => item.ref))[0], source_ref: sortedUnique(records.map((item) => item.source_ref))[0] });
  }
  const first = deterministic(records);
  return createArtifactRecord({
    ...first, run_id: sameOrNull(records.map((item) => item.run_id)), stage: sameOrNull(records.map((item) => item.stage)),
    status: "unknown", ref: sortedUnique(records.map((item) => item.ref))[0], required: records.some((item) => item.required),
    content_hash: null, source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null,
    reason: "duplicate_id_conflict", error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting records share the same identity"),
  });
}

function mergeHealthGroup(records) {
  const hashes = sortedUnique(records.map(healthHash));
  if (hashes.length === 1) {
    const record = deterministic(records);
    return createHealthFact({ ...record, source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null });
  }
  const first = deterministic(records);
  return createHealthFact({
    ...first, run_id: sameOrNull(records.map((item) => item.run_id)), stage: sameOrNull(records.map((item) => item.stage)),
    status: "unknown", observed_value: null, source_ref: sortedUnique(records.map((item) => item.source_ref))[0] ?? null,
    reason: "duplicate_id_conflict", error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting facts share the same identity"),
  });
}

function merge(records, key, validator, merger, sorter) {
  const version = unsupported(records);
  if (version) return version;
  const errors = records.flatMap((record) => validator(record).errors);
  if (errors.length) return { ok: false, code: "INVALID_RECORD", errors };
  return { ok: true, records: [...group(records, key).values()].map(merger).sort(sorter) };
}

export function mergeTranscriptRecords(records) {
  return merge(records, (record) => `${record.record_kind}\u0000${record.id}`, validateTranscriptRecord, mergeTranscriptGroup,
    (left, right) => left.record_kind.localeCompare(right.record_kind) || left.id.localeCompare(right.id));
}

export function mergeArtifactRecords(records) {
  return merge(records, (record) => `${record.record_kind}\u0000${record.id}`, validateArtifactRecord, mergeArtifactGroup,
    (left, right) => left.record_kind.localeCompare(right.record_kind) || left.id.localeCompare(right.id) || left.ref.localeCompare(right.ref));
}

export function mergeHealthFacts(records) {
  return merge(records, (record) => record.fact_id, validateHealthFact, mergeHealthGroup,
    (left, right) => left.fact_id.localeCompare(right.fact_id));
}

export function validateSkill(skill) {
  const errors = [];
  if (!skill || typeof skill !== "object" || Array.isArray(skill)) return { ok: false, errors: ["skill must be an object"] };
  for (const field of ["name", "path", "version", "stage", "owner", "source", "portable", "metrics_expected", "subagent_friendly"]) if (!Object.hasOwn(skill, field)) errors.push(`${field} is required`);
  if (!text(skill.name) || !text(skill.path)) errors.push("skill name and path are required");
  for (const field of ["version", "stage", "owner", "description", "notes"]) if (!nullableText(skill[field])) errors.push(`${field} is invalid`);
  if (!["repo", "external_adapted", "unknown"].includes(skill.source)) errors.push("source is invalid");
  for (const field of ["portable", "metrics_expected", "subagent_friendly"]) if (typeof skill[field] !== "boolean") errors.push(`${field} must be boolean`);
  for (const field of ["inputs", "outputs", "required_reads"]) if (skill[field] != null && (!Array.isArray(skill[field]) || skill[field].some((value) => !text(value)))) errors.push(`${field} is invalid`);
  for (const field of Object.keys(skill)) if (!SKILL_FIELDS.has(field)) errors.push(`skill field ${field} is not allowed`);
  return { ok: errors.length === 0, errors };
}

export function validateSkillsInventory(inventory) {
  const errors = [];
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) return { ok: false, errors: ["inventory must be an object"] };
  for (const field of ["schema_version", "generated_at", "skills"]) if (!Object.hasOwn(inventory, field)) errors.push(`${field} is required`);
  for (const field of Object.keys(inventory)) if (!(["schema_version", "generated_at", "skills"].includes(field))) errors.push(`inventory field ${field} is not allowed`);
  if (!text(inventory.schema_version) || inventory.schema_version !== FACT_SCHEMA_VERSION) errors.push("schema_version is unsupported");
  if (!text(inventory.generated_at) || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(inventory.generated_at) || Number.isNaN(Date.parse(inventory.generated_at))) errors.push("generated_at must be date-time");
  if (!Array.isArray(inventory.skills)) errors.push("skills must be an array");
  else errors.push(...inventory.skills.flatMap((skill) => validateSkill(skill).errors));
  return { ok: errors.length === 0, errors };
}

export function validateSkillsSchemaContract(schema) {
  const skill = schema?.properties?.skills?.items;
  const required = ["name", "path", "version", "stage", "owner", "source", "portable", "metrics_expected", "subagent_friendly"];
  const exactTop = schema?.$id === SKILLS_SCHEMA_ID && schema?.type === "object" && schema?.additionalProperties === false;
  const exactSkill = skill?.type === "object" && skill?.additionalProperties === false && required.every((field) => skill.required?.includes(field));
  return exactTop && exactSkill
    ? { ok: true }
    : { ok: false, code: "CONTRACT_MISMATCH", error: safeError("CONTRACT_MISMATCH", "Skills inventory schema contract does not match") };
}

export function mergeSkills(skills, { schema_version = FACT_SCHEMA_VERSION, generated_at } = {}) {
  if (!text(schema_version) || schema_version !== FACT_SCHEMA_VERSION) return { ok: false, saved: false, code: "UNSUPPORTED_FORMAT", error: safeError("UNSUPPORTED_FORMAT", "Unsupported schema version") };
  if (!text(generated_at)) return { ok: false, saved: false, code: "INVALID_RECORD", errors: ["generated_at is required"] };
  const groups = group(skills, (skill) => `${skill?.name}\u0000${skill?.path}`);
  const merged = [];
  for (const entries of groups.values()) {
    const errors = entries.flatMap((skill) => validateSkill(skill).errors);
    if (errors.length) return { ok: false, saved: false, code: "INVALID_RECORD", errors };
    if (new Set(entries.map(contentHash)).size !== 1) return { ok: false, saved: false, code: "DUPLICATE_ID_CONFLICT", error: safeError("DUPLICATE_ID_CONFLICT", "Conflicting skills share the same identity") };
    merged.push(deterministic(entries));
  }
  const inventory = { schema_version, generated_at, skills: merged.sort((left, right) => left.name.localeCompare(right.name) || left.path.localeCompare(right.path)) };
  const validation = validateSkillsInventory(inventory);
  return validation.ok ? { ok: true, saved: true, inventory } : { ok: false, saved: false, code: "INVALID_RECORD", errors: validation.errors };
}

export function parseJsonl(input, { index = "transcript", source_ref = null } = {}) {
  const records = [];
  const malformed = (line_number) => {
    if (index === "artifact") return createArtifactRecord({ id: `bad-line:artifact-index:${line_number}`, status: "unknown", ref: "indexes/artifact-index.jsonl", required: false, source_ref: "indexes/artifact-index.jsonl", reason: "unsupported_format", error: safeError("MALFORMED_LINE", "Malformed JSONL record") });
    if (index === "health") return createHealthFact({ fact_id: `bad-line:flow-health:${line_number}`, domain: "artifact_missing", status: "unknown", reason: "malformed_line", error: safeError("MALFORMED_LINE", "Malformed JSONL record") });
    return createTranscriptRecord({ record_kind: "parse_error", id: `bad-line:${source_ref ?? "transcript-index"}:${line_number}`, status: "unknown", source_ref, line_number, reason: "malformed_line", error: safeError("MALFORMED_LINE", "Malformed JSONL record") });
  };
  String(input).split(/\r?\n/).forEach((line, offset) => {
    if (!line.trim()) return;
    try {
      const record = JSON.parse(line);
      if (record?.schema_version != null && record.schema_version !== FACT_SCHEMA_VERSION) { records.push(record); return; }
      const validator = index === "artifact" ? validateArtifactRecord : index === "health" ? validateHealthFact : validateTranscriptRecord;
      if (!validator(record).ok) records.push(malformed(offset + 1));
      else records.push(record);
    } catch {
      const line_number = offset + 1;
      records.push(malformed(line_number));
    }
  });
  return records;
}

export function toJsonl(records) {
  return records.map((record) => canonicalJson(record)).join("\n") + (records.length ? "\n" : "");
}
