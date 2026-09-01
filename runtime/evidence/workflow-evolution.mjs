#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync, fsyncSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const STAGE_INDEX = new Map(STAGES.map((value, index) => [value, index]));
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const LOCK_LEASE_MS = 15_000;
const SCHEMA_VERSION = "workflow-evolution.v1";
const D24_SCHEMA_VERSION = "d24-eval-boundary.v1";
const EVOLUTION_SCHEMA = JSON.parse(readFileSync(new URL("../schemas/workflow-evolution.v1.json", import.meta.url), "utf8"));
const AJV = new Ajv2020({ allErrors: true, strict: false });
const DEFINITION_VALIDATORS = new Map();
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function plain(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(plain);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, plain(value[key])]));
}

function canonical(value) {
  const sorted = plain(value);
  const walk = (node) => {
    if (typeof node === "number" && (!Number.isFinite(node) || !Number.isInteger(node))) throw fail("invalid_input", "canonical JSON forbids non-integer numbers");
    if (node && typeof node === "object") {
      if (Array.isArray(node)) return `[${node.map(walk).join(",")}]`;
      return `{${Object.entries(node).map(([key, child]) => `${JSON.stringify(key)}:${walk(child)}`).join(",")}}`;
    }
    return JSON.stringify(node);
  };
  return walk(sorted);
}

function hashBytes(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function currentEvolutionIdentities() {
  return {
    producer_identity: { ref: "runtime/evidence/workflow-evolution.mjs", sha256: hashBytes(readFileSync(join(REPOSITORY_ROOT, "runtime/evidence/workflow-evolution.mjs"))) },
    schema_identity: { ref: "runtime/schemas/workflow-evolution.v1.json", sha256: hashBytes(readFileSync(join(REPOSITORY_ROOT, "runtime/schemas/workflow-evolution.v1.json"))) },
  };
}
function trustedEvolutionIdentities(producerIdentity, schemaIdentity) {
  const current = currentEvolutionIdentities();
  if (producerIdentity !== undefined && producerIdentity !== null && canonical(producerIdentity) !== canonical(current.producer_identity)) throw fail("stale_source", "producer identity is not current");
  if (schemaIdentity !== undefined && schemaIdentity !== null && schemaIdentity !== SCHEMA_VERSION && canonical(schemaIdentity) !== canonical(current.schema_identity)) throw fail("stale_source", "schema identity is not current");
  return current;
}
export function validateStageOutcomeStructure(value, { taskId, stage } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw fail("invalid_input", "outcome must be an object");
  if (value.schema_version !== "workflowhub-stage-outcomes.v1") throw fail("invalid_input", "outcome schema_version is invalid");
  if (value.task_id !== taskId || value.stage !== stage) throw fail("invalid_input", "outcome task/stage identity does not match its path");
  if (!Array.isArray(value.step_outcomes) || !Array.isArray(value.skill_outcomes)) throw fail("invalid_input", "outcome subject arrays are required");
  for (const [kind, subjects] of [["step", value.step_outcomes], ["skill", value.skill_outcomes]]) {
    for (const subject of subjects) {
      const subjectId = kind === "step" ? (subject?.step_slug ?? subject?.step_id) : (subject?.skill_id ?? subject?.skill_slug);
      if (typeof subjectId !== "string" || subjectId.trim() === "") throw fail("invalid_input", `${kind} outcome subject id is required`);
      if (!Array.isArray(subject.input_refs) || subject.input_refs.some((ref) => typeof ref !== "string" || ref.trim() === "")) throw fail("invalid_input", `${kind} outcome input_refs must be a complete string array`);
      if (!Array.isArray(subject.evidence_refs) || subject.evidence_refs.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.ref !== "string" || entry.ref.trim() === "")) throw fail("invalid_input", `${kind} outcome evidence_refs must be a complete reference array`);
      if (subject.output_refs !== undefined && (!Array.isArray(subject.output_refs) || subject.output_refs.some((ref) => typeof ref !== "string" || ref.trim() === ""))) throw fail("invalid_input", `${kind} outcome output_refs must be a complete string array`);
    }
  }
  return value;
}
export function validateWorkflowEvolutionDefinition(name, value) {
  if (!EVOLUTION_SCHEMA.$defs[name]) throw fail("invalid_input", `unknown workflow evolution schema definition: ${name}`);
  let validate = DEFINITION_VALIDATORS.get(name);
  if (!validate) { validate = AJV.compile({ $schema: EVOLUTION_SCHEMA.$schema, ...EVOLUTION_SCHEMA.$defs[name] }); DEFINITION_VALIDATORS.set(name, validate); }
  if (!validate(value)) throw fail("invalid_input", `${name} schema invalid: ${validate.errors?.map((entry) => `${entry.instancePath || "/"} ${entry.message}`).join("; ")}`);
  return value;
}
function identityResult(prefix, payload) {
  const canonicalBytes = canonical(payload);
  const sha256 = hashBytes(canonicalBytes);
  const snakeName = prefix.replaceAll("-", "_");
  const camelName = snakeName.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
  return {
    [`${snakeName}_id`]: `${prefix}.v1:${sha256}`,
    [`${camelName}Id`]: `${prefix}.v1:${sha256}`,
    canonical_bytes: canonicalBytes,
    canonicalBytes,
    sha256,
  };
}

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") throw fail("invalid_input", `${name} must be a non-empty string`);
  return value;
}

function normalTarget(input) {
  const projectId = input.projectId ?? input.project_id;
  requiredString(projectId, "project_id");
  const targetKind = input.targetKind ?? input.target_kind;
  const targetId = input.targetId ?? input.target_id;
  requiredString(targetKind, "target_kind"); requiredString(targetId, "target_id");
  if (!["stage", "step", "skill", "surface"].includes(targetKind)) throw fail("invalid_target", `unsupported target kind: ${targetKind}`);
  const authorities = input.authorities ?? {};
  const versions = authorities.versions ?? {};
  const manifests = authorities.stages ?? authorities.stage_manifests ?? [];
  let targetVersion = input.targetVersion ?? input.target_version;
  let authority = input.authority;
  let authoritySha256 = input.authoritySha256 ?? input.authority_sha256;
  if (targetKind === "stage") {
    const stage = Array.isArray(manifests) ? manifests.find((entry) => entry === targetId || entry?.slug === targetId || entry?.stage === targetId) : null;
    if (!stage && (!Array.isArray(manifests) || manifests.length === 0) && !STAGE_INDEX.has(targetId)) throw fail("invalid_target", `unknown stage target: ${targetId}`);
    if (!stage && Array.isArray(manifests) && manifests.length > 0) throw fail("invalid_target", `unknown stage target: ${targetId}`);
    targetVersion ??= stage?.version ?? versions[targetId] ?? "1";
    authority ??= stage?.authority ?? stage?.ref ?? authorities.stage_manifest_ref ?? authorities.stageManifestRef;
    authoritySha256 ??= stage?.authority_sha256 ?? stage?.sha256;
  } else if (targetKind === "step") {
    const steps = authorities.steps ?? authorities.step_manifest ?? authorities.stepManifest ?? [];
    const entries = Array.isArray(steps) ? steps : Object.entries(steps).map(([slug, value]) => ({ slug, ...value }));
    const matches = entries.filter((entry) => (entry?.slug ?? entry?.step_slug ?? entry?.id) === targetId);
    if (matches.length !== 1) throw fail(matches.length === 0 ? "invalid_target" : "stale_source", `step target must map to exactly one manifest: ${targetId}`);
    const entry = matches[0];
    targetVersion ??= entry.version ?? entry.target_version ?? versions[targetId];
    authority ??= entry.authority ?? entry.manifest_ref ?? authorities.step_manifest_ref;
    authoritySha256 ??= entry.authority_sha256 ?? entry.sha256;
  } else if (targetKind === "skill") {
    const skills = authorities.skills ?? authorities.catalog ?? [];
    const entries = Array.isArray(skills) ? skills : Object.entries(skills).map(([id, value]) => ({ id, ...value }));
    const entry = entries.find((item) => (item?.id ?? item?.skill_id ?? item?.name) === targetId);
    if (!entry) throw fail("invalid_target", `unknown skill target: ${targetId}`);
    targetVersion ??= entry.version ?? versions[targetId];
    authority ??= entry.authority ?? entry.ref ?? authorities.catalog_ref;
    authoritySha256 ??= entry.authority_sha256 ?? entry.sha256;
  } else {
    const surfaces = authorities.surfaces ?? authorities.moveMap ?? authorities.move_map ?? [];
    const entries = Array.isArray(surfaces) ? surfaces : Object.entries(surfaces).map(([id, value]) => ({ id, ...value }));
    const entry = entries.find((item) => (item?.id ?? item?.surface_id ?? item?.path) === targetId);
    if (!entry) throw fail("invalid_target", `unknown surface target: ${targetId}`);
    targetVersion ??= entry?.version ?? versions[targetId] ?? "1";
    authority ??= entry?.authority ?? entry?.ref ?? authorities.move_map_ref;
    authoritySha256 ??= entry?.authority_sha256 ?? entry?.sha256;
  }
  if (targetVersion === undefined || authority === undefined) throw fail("stale_source", `target authority is unavailable: ${targetId}`);
  const authorityRef = String(authority);
  const authorityHash = authoritySha256 ?? hashBytes(authorityRef);
  if (!/^[a-f0-9]{64}$/.test(authorityHash)) throw fail("stale_source", `target authority hash is invalid: ${targetId}`);
  return { project_id: projectId, target_kind: targetKind, target_id: targetId, target_version: String(targetVersion), authority_ref: authorityRef, authority_sha256: authorityHash };
}

function normalizeTargetRef(value) {
  if (!value || typeof value !== "object") throw fail("invalid_input", "target_ref is required");
  const targetKind = value.target_kind ?? value.targetKind ?? value.kind;
  const targetId = value.target_id ?? value.targetId ?? value.id;
  const targetVersion = value.target_version ?? value.targetVersion ?? value.version;
  const authority = value.authority_ref ?? value.authority ?? value.ref;
  const projectId = value.project_id ?? value.projectId;
  requiredString(projectId ?? "project", "target_ref.project_id");
  requiredString(targetKind, "target_ref.target_kind"); requiredString(targetId, "target_ref.target_id");
  requiredString(targetVersion, "target_ref.target_version"); requiredString(authority, "target_ref.authority");
  const authorityRef = String(authority);
  return { project_id: projectId ?? "project", target_kind: targetKind, target_id: targetId, target_version: String(targetVersion), authority_ref: authorityRef, authority_sha256: value.authority_sha256 ?? hashBytes(authorityRef) };
}

function assertCurrentTargetAuthority(target) {
  const ref = target.authority_ref;
  if (typeof ref !== "string" || ref.startsWith("/") || ref.includes("..") || ref.includes("\\")) throw fail("stale_source", "target authority ref is unsafe");
  const path = join(REPOSITORY_ROOT, ...ref.split("/"));
  let bytes;
  try { const stat = lstatSync(path); if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("not a real file"); bytes = readFileSync(path); }
  catch (error) { throw fail("stale_source", `target authority is unreadable: ${error.message}`); }
  if (hashBytes(bytes) !== target.authority_sha256) throw fail("stale_source", "target authority hash is stale");
  let matches = 0; let expectedVersion;
  if (target.target_kind === "stage" || target.target_kind === "step") {
    if (!/^workflows\/(make-decision|build-spec|build-plan|build-code|verify-code)\/steps\.json$/.test(ref)) throw fail("stale_source", "target manifest authority is not current");
    const manifest = JSON.parse(bytes.toString("utf8"));
    matches = target.target_kind === "stage" ? Number(manifest.stage_slug === target.target_id) : (manifest.steps ?? []).filter((entry) => entry.step_slug === target.target_id).length; expectedVersion = String(manifest.schema_version);
  } else if (target.target_kind === "skill") {
    if (ref !== "skills/catalog.yaml") throw fail("stale_source", "skill authority is not the current catalog");
    const skillMatches = [...bytes.toString("utf8").matchAll(/^\s*- name:\s*([^\s#]+)[\s\S]*?^\s*local_version:\s*([^\s#]+)/gm)].filter((entry) => entry[1] === target.target_id); matches = skillMatches.length; expectedVersion = skillMatches[0]?.[2]?.replaceAll('"', "");
  } else {
    if (ref !== "docs/architecture/move-map.json") throw fail("stale_source", "surface authority is not the current move-map");
    const map = JSON.parse(bytes.toString("utf8")); const found = new Set();
    for (const [index, entry] of (map.entries ?? []).entries()) if (entry.source === target.target_id || entry.destination === target.target_id) found.add(index);
    matches = found.size; expectedVersion = String(map.schema_version ?? "1");
  }
  if (matches !== 1) throw fail(matches === 0 ? "invalid_target" : "stale_source", `target must map to exactly one current authority entry: ${target.target_id}`);
  if (target.target_version !== expectedVersion) throw fail("stale_source", `target version is stale: ${target.target_id}`);
}

export function resolveTargetRef(input = {}) {
  try {
    const targetRef = normalTarget(input);
    return { status: "ok", targetRef, target_ref: targetRef, ...identityResult("target_ref", targetRef) };
  } catch (error) {
    if (error.code === "invalid_target" || error.code === "stale_source") return { status: error.code, error: { code: error.code, summary: error.message } };
    throw error;
  }
}

export function deriveObservationId(input = {}) {
  const targetRef = normalizeTargetRef({ ...(input.targetRef ?? input.target_ref), project_id: input.projectId ?? input.project_id });
  const payload = {
    project_id: requiredString(input.projectId ?? input.project_id, "project_id"),
    target_ref: targetRef,
    task_id: requiredString(input.taskId ?? input.task_id, "task_id"),
    confirmation_ref: requiredString(input.confirmationRef ?? input.confirmation_ref, "confirmation_ref"),
    occurred_at: requiredString(input.occurredAt ?? input.occurred_at, "occurred_at"),
    intervention_kind: requiredString(input.interventionKind ?? input.intervention_kind, "intervention_kind"),
    intervention_payload: input.interventionPayload ?? input.intervention_payload ?? {},
  };
  const result = identityResult("observation", payload);
  return { status: "ok", observation_id: result.observation_id, observationId: result.observationId, canonical_bytes: result.canonical_bytes, canonicalBytes: result.canonicalBytes, sha256: result.sha256 };
}

export function deriveCandidateGroupId(input = {}) {
  const targetRef = normalizeTargetRef({ ...(input.targetRef ?? input.target_ref), project_id: input.projectId ?? input.project_id });
  const payload = {
    project_id: requiredString(input.projectId ?? input.project_id, "project_id"),
    target_ref: targetRef,
    normalized_intervention_kind: requiredString(input.interventionKind ?? input.intervention_kind, "intervention_kind"),
    normalized_intervention_payload: input.interventionPayload ?? input.intervention_payload ?? {},
  };
  const result = identityResult("candidate-group", payload);
  return { status: "ok", candidate_group_id: result.candidate_group_id, candidateGroupId: result.candidateGroupId, canonical_bytes: result.canonical_bytes, canonicalBytes: result.canonicalBytes, sha256: result.sha256 };
}

export function buildInputInventory(input = {}) {
  const project = requiredString(input.project ?? input.projectId ?? input.project_id, "project");
  const rawInputs = input.rawInputs ?? input.raw_inputs ?? input.inventory ?? {};
  const inventory = plain({ project, ...rawInputs });
  const canonicalBytes = canonical(inventory);
  const inputInventoryHash = hashBytes(canonicalBytes);
  const identities = trustedEvolutionIdentities(input.producerIdentity ?? input.producer_identity, input.schemaIdentity ?? input.schema_identity);
  return { status: "ok", inventory, input_inventory_hash: inputInventoryHash, inputInventoryHash, canonical_bytes: canonicalBytes, canonicalBytes, ...identities };
}

function attribution(stage, value) {
  const raw = typeof value === "string" ? value : "";
  const match = /^upstream_omission:(make-decision|build-spec|build-plan|build-code|verify-code)$/.exec(raw);
  if (!match) return { status: "unknown", reason: raw ? "invalid_attribution" : "missing_attribution" };
  if ((STAGE_INDEX.get(match[1]) ?? Infinity) >= (STAGE_INDEX.get(stage) ?? -1)) return { status: "unknown", reason: "stage_order" };
  return { status: "attributed", stage: match[1] };
}

export function computeQualityTaxProjection(input = {}) {
  const asOf = input.asOf ?? input.as_of;
  requiredString(asOf, "asOf");
  const end = Date.parse(asOf); if (!Number.isFinite(end)) throw fail("invalid_input", "asOf must be an ISO timestamp");
  const interventions = Array.isArray(input.interventions) ? input.interventions : [];
  const valid = []; let unknownCount = 0; let numerator = 0;
  for (const item of interventions) {
    const occurred = Date.parse(item?.occurred_at ?? item?.occurredAt ?? "");
    if (!Number.isFinite(occurred) || occurred > end || occurred < end - WINDOW_MS) continue;
    if (item?.project && input.inventory?.project && item.project !== input.inventory.project) continue;
    const stage = item.intervention_stage ?? item.interventionStage;
    if (!STAGE_INDEX.has(stage)) continue;
    const key = `${item.project ?? input.inventory?.project ?? ""}\0${item.task_id ?? item.taskId ?? ""}\0${item.confirmation_ref ?? item.confirmationRef ?? ""}`;
    if (valid.some((entry) => entry.key === key)) continue;
    const result = attribution(stage, item.primary_attribution_stage ?? item.primaryAttributionStage);
    valid.push({ key, item, result });
    if (result.status === "attributed") numerator += 1; else unknownCount += 1;
  }
  const denominator = valid.length;
  const sampleStatus = denominator < 5 ? "insufficient_samples" : "sufficient";
  const unknownRatio = denominator ? unknownCount / denominator : 0;
  let confidence = "unavailable";
  if (denominator >= 5 && denominator < 10) confidence = "low";
  else if (denominator >= 10) confidence = unknownRatio === 0 ? "high" : unknownRatio <= 0.2 ? "medium" : "low";
  const ratio = denominator >= 5 ? numerator / denominator : null;
  const output = {
    schema_version: "quality-tax.v1", status: "ok", sample_count: denominator, denominator, numerator,
    ratio, unknown_count: unknownCount, unknown_ratio: unknownRatio, confidence, sample_status: sampleStatus,
    window_start: new Date(end - WINDOW_MS).toISOString(), window_end: asOf, generated_at: asOf,
    windowStart: new Date(end - WINDOW_MS).toISOString(), windowEnd: asOf, generatedAt: asOf,
    validation_status: "unverified", label: "未验证，待真实任务数据", source_identities: input.sourceIdentities ?? input.source_identities ?? [],
  };
  return output;
}

function projectRoot(storageRoot, project) {
  const root = resolve(storageRoot); requiredString(project, "project");
  let rootStat; try { rootStat = lstatSync(root); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  if (rootStat?.isSymbolicLink()) throw fail("invalid_input", "storage root must not be a symlink");
  if (project === "." || project === ".." || project.includes("/") || project.includes("\\") || project.includes("\0")) throw fail("invalid_input", "project must be a single safe path segment");
  const projects = resolve(root, "Projects");
  let projectsStat; try { projectsStat = lstatSync(projects); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  if (projectsStat?.isSymbolicLink()) throw fail("invalid_input", "Projects root must not be a symlink");
  mkdirSync(projects, { recursive: true });
  if (dirname(realpathSync(projects)) !== realpathSync(root)) throw fail("invalid_input", "Projects root escapes storage root");
  const path = resolve(projects, project);
  if (dirname(path) !== projects) throw fail("invalid_input", "project path escapes Projects root");
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw fail("invalid_input", "project path must not be a symlink");
  if (existsSync(path) && dirname(realpathSync(path)) !== realpathSync(projects)) throw fail("invalid_input", "project path escapes Projects root");
  mkdirSync(path, { recursive: true });
  return path;
}

function lockPath(storageRoot, project) { return join(projectRoot(storageRoot, project), ".workflowhub-evolution.lock"); }
function monotonicMs() { return Number(process.hrtime.bigint() / 1_000_000n); }
function processIsAlive(pid) { try { process.kill(pid, 0); return true; } catch (error) { return error?.code === "EPERM"; } }
function validProjectLock(value, project) {
  return value?.schema_version === SCHEMA_VERSION && value.project === project
    && typeof value.owner_token === "string" && value.owner_token.length > 0
    && typeof value.fencing_token === "string" && value.fencing_token.length > 0
    && Number.isInteger(value.pid) && value.pid > 0
    && typeof value.host_id === "string" && value.host_id.length > 0
    && typeof value.boot_id === "string" && value.boot_id.length > 0
    && typeof value.session_epoch === "string" && value.session_epoch.length > 0
    && Number.isInteger(value.acquired_monotonic_ms) && value.acquired_monotonic_ms >= 0
    && Number.isInteger(value.lease_deadline_monotonic_ms)
    && value.lease_deadline_monotonic_ms >= value.acquired_monotonic_ms;
}
function fsyncParent(path) {
  const fd = openSync(dirname(path), "r");
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

export function acquireProjectLock(input = {}) {
  const storageRoot = resolve(requiredString(input.storageRoot, "storageRoot"));
  const project = requiredString(input.project, "project");
  const attemptId = requiredString(input.attemptId ?? input.attempt_id, "attemptId");
  const path = lockPath(storageRoot, project);
  const now = monotonicMs();
  const ownerToken = input.ownerToken ?? input.owner_token ?? randomUUID();
  const bootId = input.bootId ?? input.boot_id ?? process.env.WORKFLOWHUB_BOOT_ID ?? "boot-local";
  const sessionEpoch = input.sessionEpoch ?? input.session_epoch ?? process.env.WORKFLOWHUB_SESSION_EPOCH ?? "session-local";
  const fencingToken = `${ownerToken}:${now}`;
  const value = { schema_version: SCHEMA_VERSION, project, attempt_id: attemptId, owner_token: ownerToken, fencing_token: fencingToken, pid: process.pid, host_id: hostname(), boot_id: bootId, session_epoch: String(sessionEpoch), acquired_monotonic_ms: now, lease_deadline_monotonic_ms: now + LOCK_LEASE_MS };
  if (existsSync(path)) {
    let currentRaw;
    let current;
    try { currentRaw = readFileSync(path, "utf8"); current = JSON.parse(currentRaw); }
    catch (error) { return { status: "failed", error: { code: "failed", summary: `lock is unreadable: ${error.message}` } }; }
    if (!validProjectLock(current, project)) return { status: "failed", error: { code: "failed", summary: "project lock schema or identity is invalid" } };
    const recovery = input.manualRecovery ?? input.manual_recovery;
    const sameEpoch = current.host_id === hostname() && current.boot_id === bootId && String(current.session_epoch) === String(sessionEpoch);
    const expired = Number.isFinite(current.lease_deadline_monotonic_ms) && now > current.lease_deadline_monotonic_ms;
    if (sameEpoch && (!expired || processIsAlive(current.pid))) return { status: "conflict", error: { code: "conflict", summary: "project lock is held by a live process" } };
    if (!sameEpoch && !recovery) return { status: "failed", error: { code: "failed", summary: "project lock belongs to another boot or session epoch" } };
    const recoveryValid = Boolean(recovery && typeof recovery === "object" && !Array.isArray(recovery)
      && (recovery.schema_version === undefined || recovery.schema_version === "manual-recovery.v1"));
    if (!sameEpoch && (!recoveryValid || recovery.current_lock_sha256 !== hashBytes(currentRaw)
      || recovery.old_boot_id !== current.boot_id || recovery.new_boot_id !== bootId
      || recovery.old_boot_id === recovery.new_boot_id || typeof recovery.nonce !== "string" || recovery.nonce.trim() === ""
      || typeof (recovery.operator_identity ?? recovery.operator) !== "string" || (recovery.operator_identity ?? recovery.operator).trim() === ""
      || typeof recovery.issued_at !== "string" || !Number.isFinite(Date.parse(recovery.issued_at))
      || typeof recovery.confirmation_ref !== "string" || recovery.confirmation_ref.trim() === ""
      || typeof recovery.confirmation_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(recovery.confirmation_sha256))) {
      return { status: "stale_source", error: { code: "stale_source", summary: "manual recovery authority is invalid or lock is not expired" } };
    }
    const lockAuthorityHash = hashBytes(currentRaw);
    const nonce = sameEpoch ? `auto-${lockAuthorityHash.slice(0, 24)}` : recovery.nonce;
    const tombstone = `${path}.tombstone-${nonce}-${lockAuthorityHash}`;
    if (existsSync(tombstone)) return { status: sameEpoch ? "failed" : "replayed_recovery", error: { code: sameEpoch ? "failed" : "replayed_recovery", summary: "lock recovery nonce was already consumed" } };
    try { renameSync(path, tombstone); fsyncParent(path); }
    catch (error) { return { status: "failed", error: { code: "failed", summary: `lock reclaim failed: ${error.message}` } }; }
  }
  try {
    const fd = openSync(path, "wx"); writeFileSync(fd, `${JSON.stringify(value)}\n`); fsyncSync(fd); closeSync(fd); fsyncParent(path);
  } catch (error) {
    if (error.code === "EEXIST") return { status: "conflict", error: { code: "conflict", summary: "project lock is held" } };
    throw error;
  }
  const release = () => {
    try {
      const current = JSON.parse(readFileSync(path, "utf8"));
      if (current.owner_token !== ownerToken || current.fencing_token !== fencingToken) return { status: "stale_source" };
      unlinkSync(path); fsyncParent(path); return { status: "ok" };
    } catch (error) { if (error.code === "ENOENT") return { status: "ok" }; throw error; }
  };
  return { status: "ok", lockHandle: Object.freeze({ path, attemptId, ownerToken, fencingToken }), lock_handle: Object.freeze({ path, attempt_id: attemptId, owner_token: ownerToken, fencing_token: fencingToken }), ownerToken, owner_token: ownerToken, fencingToken, fencing_token: fencingToken, leaseIdentity: { boot_id: bootId, session_epoch: String(sessionEpoch) }, release };
}

function assertLedgerFile(path) {
  const parent = dirname(path);
  const parentStat = lstatSync(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) throw fail("failed", "candidate ledger parent must be a real directory");
  let stat;
  try { stat = lstatSync(path); } catch (error) { if (error?.code === "ENOENT") return path; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || dirname(realpathSync(path)) !== realpathSync(parent)) throw fail("failed", "candidate ledger must be a contained real file");
  return path;
}
function ledgerPath(storageRoot, project, name = "evolution-candidates.jsonl") { return assertLedgerFile(join(projectRoot(storageRoot, project), name)); }
function encodedLine(value) { return Buffer.from(`${JSON.stringify(value)}\n`); }

function ledgerEntries(raw) {
  const entries = [];
  let start = 0;
  while (start < raw.length) {
    const newline = raw.indexOf(0x0a, start);
    if (newline === -1) {
      entries.push({ start, end: raw.length, complete: false, raw: raw.subarray(start) });
      break;
    }
    let end = newline;
    if (end > start && raw[end - 1] === 0x0d) end -= 1;
    entries.push({ start, end: newline + 1, complete: true, raw: raw.subarray(start, end) });
    start = newline + 1;
  }
  return entries;
}

function parseEntry(entry) {
  if (!entry.complete) return null;
  try { return JSON.parse(entry.raw.toString("utf8")); } catch { return null; }
}

function sameHead(left, right) {
  if (!left || !right) return left === right;
  return left.snapshot_id === right.snapshot_id && left.publication_generation === right.publication_generation;
}

function validAbort(raw, recoveryStart, entry, abort) {
  if (!abort || abort.record_kind !== "batch_abort") return false;
  if (abort.abandoned_start_offset !== recoveryStart || !Number.isInteger(abort.observed_suffix_length) || abort.observed_suffix_length < 0) return false;
  const suffixEnd = recoveryStart + abort.observed_suffix_length;
  if (suffixEnd > entry.start) return false;
  if (hashBytes(raw.subarray(0, recoveryStart)) !== abort.last_committed_prefix_hash) return false;
  if (hashBytes(raw.subarray(recoveryStart, suffixEnd)) !== abort.observed_suffix_hash) return false;
  return /^[\r\n]*$/.test(raw.subarray(suffixEnd, entry.start).toString("utf8"));
}

function scanCandidateLedger(path) {
  assertLedgerFile(path);
  const raw = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
  const commits = [];
  let open = null;
  let recoveryStart = null;
  let recoveryBatchId = null;
  for (const entry of ledgerEntries(raw)) {
    const value = parseEntry(entry);
    if (recoveryStart !== null) {
      if (value?.record_kind === "batch_abort" && validAbort(raw, recoveryStart, entry, value)) {
        recoveryStart = null;
        recoveryBatchId = null;
        open = null;
        continue;
      }
      throw fail("failed", `corruption occurs before a later ledger record at byte ${entry.start}`);
    }
    if (!value) {
      recoveryStart = open?.start ?? entry.start;
      continue;
    }
    if (!open) {
      if (value.record_kind !== "batch_begin") throw fail("failed", `unexpected ledger record outside batch at byte ${entry.start}`);
      try { validateWorkflowEvolutionDefinition("batch_begin", value); } catch (error) { throw fail("failed", `batch_begin schema invalid at byte ${entry.start}: ${error.message}`); }
      if (value.schema_version !== SCHEMA_VERSION || typeof value.project !== "string" || typeof value.attempt_id !== "string" || typeof value.snapshot_id !== "string" || typeof value.snapshot_content_id !== "string") throw fail("failed", `batch_begin identity invalid at byte ${entry.start}`);
      const expectedGeneration = (commits.at(-1)?.commit.publication_generation ?? 0) + 1;
      if (!Number.isInteger(value.publication_generation) || value.publication_generation !== expectedGeneration) throw fail("failed", `candidate generation is not contiguous at byte ${entry.start}`);
      open = { start: entry.start, begin: value, rows: [] };
      continue;
    }
    if (value.record_kind === "batch_abort") {
      if (!validAbort(raw, open.start, entry, value)) throw fail("failed", `batch_abort does not authenticate abandoned bytes at byte ${entry.start}`);
      open = null;
      continue;
    }
    if (value.record_kind === "batch_begin") throw fail("failed", `new batch begins before prior batch terminates at byte ${entry.start}`);
    if (value.record_kind !== "batch_commit") {
      try {
        if (value.batch_id !== open.begin.batch_id || value.snapshot_id !== open.begin.snapshot_id || value.publication_generation !== open.begin.publication_generation) throw fail("failed", `batch row identity mismatch at byte ${entry.start}`);
        const definition = value.record_kind === "refresh_result" ? "refresh_result" : value.record_kind === "publication_proof" ? "publication_proof" : ["candidate", "snapshot_record"].includes(value.record_kind) ? "candidate_record" : null;
        if (!definition) throw fail("failed", `unknown batch row kind at byte ${entry.start}`);
        try { validateWorkflowEvolutionDefinition(definition, value); } catch (error) { throw fail("failed", `${definition} schema invalid at byte ${entry.start}: ${error.message}`); }
        if (value.schema_version !== SCHEMA_VERSION || value.snapshot_content_id !== open.begin.snapshot_content_id
          || (["refresh_result", "publication_proof"].includes(value.record_kind) && (value.project !== open.begin.project || value.attempt_id !== open.begin.attempt_id))) throw fail("failed", `batch row authority mismatch at byte ${entry.start}`);
        if (["candidate", "snapshot_record"].includes(value.record_kind)) {
          const payload = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "record_id" && key !== "candidate_record_id"));
          const expectedRecordId = `candidate-record.v1:${hashBytes(canonical(payload))}`;
          if (value.record_id !== expectedRecordId || value.candidate_record_id !== expectedRecordId) throw fail("failed", `candidate record identity mismatch at byte ${entry.start}`);
        }
      } catch {
        recoveryBatchId = open.begin.batch_id;
        recoveryStart = open.start;
        open = null;
        continue;
      }
      open.rows.push(value);
      continue;
    }
    try { validateWorkflowEvolutionDefinition("batch_commit", value); } catch (error) { throw fail("failed", `batch_commit schema invalid at byte ${entry.start}: ${error.message}`); }
    const currentIdentities = currentEvolutionIdentities();
    if (value.status !== "committed" || value.batch_id !== open.begin.batch_id || value.snapshot_id !== open.begin.snapshot_id
      || value.publication_generation !== open.begin.publication_generation || value.snapshot_content_id !== open.begin.snapshot_content_id
      || value.attempt_id !== open.begin.attempt_id
      || value.project !== open.begin.project || value.schema_version !== SCHEMA_VERSION
      || canonical(value.producer_identity) !== canonical(currentIdentities.producer_identity) || canonical(value.schema_identity) !== canonical(currentIdentities.schema_identity)
      || value.count !== open.rows.length || value.content_hash !== hashBytes(canonical(open.rows))) {
      throw fail("failed", `committed batch integrity mismatch at byte ${entry.start}`);
    }
    commits.push({ commit: value, rows: open.rows, start: open.start, end: entry.end });
    open = null;
  }
  const suffixStart = recoveryStart ?? open?.start ?? null;
  return {
    raw,
    commits,
    latest: commits.at(-1) ?? null,
    terminalSuffix: suffixStart === null ? null : {
      start: suffixStart,
      bytes: raw.subarray(suffixStart),
      batch_id: recoveryBatchId ?? open?.begin?.batch_id ?? null,
    },
  };
}

function appendLine(path, value, lock) {
  mkdirSync(dirname(path), { recursive: true });
  assertLedgerFile(path);
  assertLockCurrent(lock);
  const existed = existsSync(path);
  const fd = openSync(path, "a");
  try { writeFileSync(fd, encodedLine(value)); fsyncSync(fd); } finally { closeSync(fd); }
  if (!existed) fsyncParent(path);
  assertLockCurrent(lock);
}

function recoverTerminalSuffix(path, lock) {
  const state = scanCandidateLedger(path);
  if (!state.terminalSuffix) return state;
  const suffix = state.terminalSuffix;
  if (state.raw.length > 0 && state.raw[state.raw.length - 1] !== 0x0a) {
    assertLockCurrent(lock);
    const fd = openSync(path, "a");
    try { writeFileSync(fd, "\n"); fsyncSync(fd); } finally { closeSync(fd); }
    assertLockCurrent(lock);
  }
  appendLine(path, {
    schema_version: SCHEMA_VERSION,
    record_kind: "batch_abort",
    batch_id: suffix.batch_id ?? "unparseable-or-uncommitted",
    reason: "terminal_uncommitted_suffix",
    last_committed_prefix_hash: hashBytes(state.raw.subarray(0, suffix.start)),
    abandoned_start_offset: suffix.start,
    observed_suffix_length: suffix.bytes.length,
    observed_suffix_hash: hashBytes(suffix.bytes),
  }, lock);
  const recovered = scanCandidateLedger(path);
  if (recovered.terminalSuffix) throw fail("failed", "candidate ledger recovery did not close terminal suffix");
  return recovered;
}

function publishBatch({ path, lock, expectedHead, begin, rows, commit }) {
  const beforeAppend = scanCandidateLedger(path);
  if (beforeAppend.terminalSuffix) throw fail("stale_source", "candidate ledger has an unrecovered terminal suffix");
  if (!sameHead(beforeAppend.latest?.commit ?? null, expectedHead)) throw fail("conflict", "candidate head changed before append");
  for (const value of [begin, ...rows]) appendLine(path, value, lock);
  const beforeCommit = scanCandidateLedger(path);
  if (!sameHead(beforeCommit.latest?.commit ?? null, expectedHead)) throw fail("conflict", "candidate head changed before commit");
  const expectedSuffix = Buffer.concat([encodedLine(begin), ...rows.map(encodedLine)]);
  if (!beforeCommit.terminalSuffix || !beforeCommit.terminalSuffix.bytes.equals(expectedSuffix)) throw fail("stale_source", "uncommitted batch bytes changed before commit");
  appendLine(path, commit, lock);
  const afterCommit = scanCandidateLedger(path);
  if (!sameHead(afterCommit.latest?.commit ?? null, commit)) throw fail("failed", "candidate commit is not current after fsync");
}

function assertLockCurrent(lock) {
  if (!lock?.lockHandle?.path) throw fail("stale_source", "lock handle is unavailable");
  let value;
  try { value = JSON.parse(readFileSync(lock.lockHandle.path, "utf8")); }
  catch { throw fail("stale_source", "lock is unavailable"); }
  const token = lock.fencingToken ?? lock.fencing_token ?? lock.lockHandle.fencingToken ?? lock.lockHandle.fencing_token;
  if (value.owner_token !== (lock.ownerToken ?? lock.owner_token) || value.fencing_token !== token) throw fail("stale_source", "lock fencing is stale");
  if (Number.isFinite(value.lease_deadline_monotonic_ms) && monotonicMs() > value.lease_deadline_monotonic_ms) throw fail("stale_source", "lock lease expired");
  return value;
}

function currentSnapshot(path) {
  const scan = scanCandidateLedger(path);
  if (scan.terminalSuffix) throw fail("failed", "candidate ledger has an unauthenticated terminal suffix");
  const latest = scan.latest;
  if (!latest) return null;
  return { commit: latest.commit, records: latest.rows.filter((entry) => entry.record_kind === "snapshot_record" || entry.record_kind === "candidate") };
}

function normalizedIdentities(value, fallback = []) {
  const list = Array.isArray(value) ? value : fallback;
  return list.map(plain).sort((left, right) => canonical(left).localeCompare(canonical(right)));
}

function withCandidateRecordIdentity(record) {
  const payload = Object.fromEntries(Object.entries(record).filter(([key]) => key !== "record_id" && key !== "candidate_record_id"));
  const recordId = `candidate-record.v1:${hashBytes(canonical(payload))}`;
  return { ...payload, record_id: recordId, candidate_record_id: recordId };
}

function observationsToRecords(inventory, now, snapshotId, generation, storageRoot) {
  const observations = Array.isArray(inventory.observations) ? inventory.observations : [];
  const groups = new Map();
  const seenObservations = new Map();
  for (const observation of observations) {
    const target = normalizeTargetRef({ ...(observation.target_ref ?? observation.targetRef), project_id: inventory.project });
    assertCurrentTargetAuthority(target);
    const group = deriveCandidateGroupId({ projectId: inventory.project, targetRef: target, interventionKind: observation.intervention_kind ?? observation.interventionKind, interventionPayload: observation.intervention_payload ?? observation.interventionPayload ?? {} });
    const identity = deriveObservationId({ projectId: inventory.project, targetRef: target, taskId: observation.task_id ?? observation.taskId, confirmationRef: observation.confirmation_ref ?? observation.confirmationRef, occurredAt: observation.occurred_at ?? observation.occurredAt, interventionKind: observation.intervention_kind ?? observation.interventionKind, interventionPayload: observation.intervention_payload ?? observation.interventionPayload ?? {} });
    const observationBytes = canonical(observation);
    if (seenObservations.has(identity.observation_id)) {
      if (seenObservations.get(identity.observation_id) !== observationBytes) throw fail("conflict", `observation identity has conflicting bytes: ${identity.observation_id}`);
      continue;
    }
    seenObservations.set(identity.observation_id, observationBytes);
    const item = { observation, groupId: group.candidate_group_id, observationId: identity.observation_id, target };
    if (!groups.has(item.groupId)) groups.set(item.groupId, []); groups.get(item.groupId).push(item);
  }
  return [...groups.entries()].map(([groupId, entries]) => {
    entries.sort((a, b) => a.observationId.localeCompare(b.observationId));
    const first = entries.map((entry) => entry.observation.occurred_at).sort()[0] ?? now;
    const recent = entries.map((entry) => entry.observation.occurred_at).sort().at(-1) ?? now;
    const tasks = new Set(entries.map((entry) => entry.observation.task_id));
    const proofs = (Array.isArray(inventory.consumer_proofs ?? inventory.consumerProofs) ? (inventory.consumer_proofs ?? inventory.consumerProofs) : []).filter(Boolean);
    const expectedStages = [...STAGES].sort();
    const taskProofs = [...tasks].map((taskId) => proofs.find((candidate) => candidate.project === inventory.project && candidate.task_id === taskId));
    const recomputeProof = (taskId) => {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(inventory.project)) return null;
      const taskRoot = join(storageRoot, "Projects", inventory.project, "tasks", taskId);
      const sourceRefs = []; const records = [];
      try {
        const taskStat = lstatSync(taskRoot);
        if (!taskStat.isDirectory() || taskStat.isSymbolicLink()) return null;
        const trustedTaskRoot = realpathSync(taskRoot);
        const trustedOutputRef = (ref) => {
          if (typeof ref !== "string" || !ref.startsWith("quality/") || isAbsolute(ref) || ref.includes("..")) return false;
          const outputPath = join(taskRoot, ...ref.split("/"));
          let cursor = taskRoot;
          for (const segment of ref.split("/")) {
            cursor = join(cursor, segment);
            let stat;
            try { stat = lstatSync(cursor); } catch { return false; }
            if (stat.isSymbolicLink() || (cursor !== outputPath && !stat.isDirectory())) return false;
            if (cursor === outputPath && !stat.isFile()) return false;
          }
          let realOutputPath;
          try { realOutputPath = realpathSync(outputPath); } catch { return false; }
          const relativeOutputPath = relative(trustedTaskRoot, realOutputPath);
          return !isAbsolute(relativeOutputPath)
            && relativeOutputPath !== ".."
            && !relativeOutputPath.startsWith(`..${sep}`);
        };
        for (const stage of STAGES) {
          const directory = join(taskRoot, "quality/evidence/stage-outcomes", stage);
          const directoryStat = lstatSync(directory);
          if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink() || !realpathSync(directory).startsWith(`${trustedTaskRoot}/`)) return null;
          const files = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && !entry.isSymbolicLink() && /^[a-f0-9]{64}\.json$/.test(entry.name)).map((entry) => entry.name).sort();
          if (files.length === 0) return null;
          let position = 0;
          for (const file of files) {
            const raw = readFileSync(join(directory, file));
            if (hashBytes(raw) !== file.slice(0, -5)) return null;
            const value = validateStageOutcomeStructure(JSON.parse(raw.toString("utf8")), { taskId, stage });
            sourceRefs.push(`quality/evidence/stage-outcomes/${stage}/${file}`);
            for (const [kind, subjects] of [["step", value.step_outcomes], ["skill", value.skill_outcomes]]) {
              if (!Array.isArray(subjects)) return null;
              for (const subject of subjects) {
                const subjectId = kind === "step" ? subject.step_slug ?? subject.step_id : subject.skill_id ?? subject.skill_slug;
                if (typeof subjectId !== "string" || !Array.isArray(subject.input_refs) || !Array.isArray(subject.output_refs ?? subject.evidence_refs ?? [])) return null;
                const outputRefs = [...new Set([...(subject.output_refs ?? []), ...(subject.evidence_refs ?? []).map((entry) => entry?.ref).filter(Boolean)])];
                if (outputRefs.some((ref) => !trustedOutputRef(ref))) return null;
                records.push({ stage, position: position++, subject_kind: kind, subject_id: subjectId, input_refs: subject.input_refs, output_refs: outputRefs });
              }
            }
          }
        }
      } catch { return null; }
      const registered = [];
      for (const source of records) for (const ref of source.output_refs) {
        const sourceStage = STAGE_INDEX.get(source.stage);
        const count = records.filter((candidate) => (STAGE_INDEX.get(candidate.stage) > sourceStage || (candidate.stage === source.stage && candidate.position > source.position)) && candidate.input_refs.includes(ref)).length;
        registered.push({ ref, source: { stage: source.stage, subject_kind: source.subject_kind, subject_id: source.subject_id }, consumer_count: count, freshness: "current" });
      }
      registered.sort((left, right) => `${left.ref}\0${left.source.stage}\0${left.source.subject_id}`.localeCompare(`${right.ref}\0${right.source.stage}\0${right.source.subject_id}`));
      return { sourceRefs, registered, subjectCount: records.length, scopeRevision: hashBytes(sourceRefs.map((ref) => ref.slice("quality/evidence/stage-outcomes/".length)).sort().join("\n")), zero: registered.length > 0 && registered.every((entry) => entry.consumer_count === 0) };
    };
    const validProof = (proof) => {
      if (!proof || proof.schema_version !== "consumer-scan-proof.v1" || proof.coverage_status !== "complete" || proof.zero_consumption !== true || typeof proof.scope_revision !== "string" || proof.scope_revision === "") return false;
      if (proof.project !== inventory.project || !tasks.has(proof.task_id)
        || proof.source_subject !== "tools/cli/derive-consumption-edges.mjs"
        || !Array.isArray(proof.source_refs) || proof.source_refs.length === 0
        || proof.source_refs.some((ref) => typeof ref !== "string" || ref.includes(".."))
        || !Array.isArray(proof.diagnostics) || proof.diagnostics.length !== 0) return false;
      const expected = [...new Set(proof.expected_stage_set ?? [])].sort(); const scanned = [...new Set(proof.scanned_stage_set ?? [])].sort();
      const scannedAt = Date.parse(proof.scanned_at ?? ""); const current = Number.isFinite(scannedAt) && scannedAt <= Date.parse(now) && scannedAt >= Date.parse(now) - WINDOW_MS;
      const refs = proof.registered_output_refs;
      const actual = recomputeProof(proof.task_id);
      return canonical(expected) === canonical(expectedStages) && canonical(scanned) === canonical(expectedStages) && current && Array.isArray(refs) && refs.length > 0 && refs.every((ref) => ref
        && typeof ref.ref === "string" && ref.ref.startsWith("quality/") && !ref.ref.includes("..")
        && ref.consumer_count === 0 && ref.freshness === "current"
        && ref.source && STAGE_INDEX.has(ref.source.stage)
        && ["step", "skill"].includes(ref.source.subject_kind)
        && typeof ref.source.subject_id === "string" && ref.source.subject_id !== "")
        && actual?.zero === true && proof.scope_revision === actual.scopeRevision
        && (proof.status === undefined || proof.status === "complete")
        && (proof.scope === undefined || proof.scope === "all-current-stage-outcome-files")
        && (proof.stage_count === undefined || proof.stage_count === STAGES.length)
        && (proof.outcome_file_count === undefined || proof.outcome_file_count === actual.sourceRefs.length)
        && (proof.subject_count === undefined || proof.subject_count === actual.subjectCount)
        && canonical([...proof.source_refs].sort()) === canonical([...actual.sourceRefs].sort())
        && canonical([...refs].sort((a, b) => canonical(a).localeCompare(canonical(b)))) === canonical([...actual.registered].sort((a, b) => canonical(a).localeCompare(canonical(b))));
    };
    const zero = taskProofs.length === tasks.size && taskProofs.every(validProof);
    const recentEntries = entries.filter((entry) => Date.parse(entry.observation.occurred_at) >= Date.parse(now) - WINDOW_MS);
    const repeat = new Set(recentEntries.map((entry) => entry.observation.task_id)).size >= 2;
    const tier = zero || repeat ? "action_suggested" : "reference_only";
    const sourceObservations = entries.map((entry) => ({ observation_id: entry.observationId, task_id: entry.observation.task_id, stage: entry.observation.stage ?? "unknown", confirmation_ref: entry.observation.confirmation_ref, occurred_at: entry.observation.occurred_at, evidence_refs: Array.isArray(entry.observation.evidence_refs) ? entry.observation.evidence_refs.map(plain) : [] }));
    const sourceIdentities = normalizedIdentities(inventory.source_identities ?? inventory.sourceIdentities, sourceObservations.map((entry) => entry.observation_id));
    const observationMaterials = entries.flatMap((entry) => entry.observation.material_identities ?? entry.observation.materialIdentities ?? []);
    const materialIdentities = normalizedIdentities(inventory.material_identities ?? inventory.materialIdentities, observationMaterials);
    const confirmation = inventory.human_confirmation ?? inventory.humanConfirmation ?? entries[0].observation.human_confirmation ?? entries[0].observation.humanConfirmation ?? {};
    const confirmationRef = requiredString(confirmation.ref ?? confirmation.human_confirmation_ref ?? entries[0].observation.confirmation_ref, "human_confirmation_ref");
    const confirmationSha256 = requiredString(confirmation.sha256 ?? confirmation.human_confirmation_sha256 ?? entries[0].observation.confirmation_sha256, "human_confirmation_sha256");
    if (!/^[a-f0-9]{64}$/.test(confirmationSha256)) throw fail("invalid_input", "human_confirmation_sha256 must be a lowercase SHA-256 identity");
    return {
      schema_version: SCHEMA_VERSION, record_kind: "candidate", candidate_group_id: groupId, candidate_id: `${groupId}:candidate`, snapshot_id: snapshotId, publication_generation: generation, revision: 1,
      target_ref: entries[0].target, classification: entries[0].observation.classification ?? "needs_evidence", tier, frequency: tasks.size, first_seen: first, recent_seen: recent,
      severity: entries.some((entry) => entry.observation.severity === "high") ? "high" : entries.some((entry) => entry.observation.severity === "medium") ? "medium" : "low",
      confidence: entries.some((entry) => entry.observation.confidence === "low") ? "low" : entries.some((entry) => entry.observation.confidence === "medium") ? "medium" : "high",
      priority_score: entries.length, judgment_layer: "judgment", is_fact: false,
      lifecycle_status: "open", row_status: "active", freshness: "current", evidence_status: zero ? "complete" : "unknown", sample_status: tasks.size >= 5 ? "sufficient" : "insufficient_samples", validation_status: "unverified", ...((entries[0].observation.classification ?? "needs_evidence") === "remove_candidate" ? { removal_status: "pending" } : {}), source_observations: sourceObservations,
      source_identities: sourceIdentities, material_identities: materialIdentities, human_confirmation_ref: confirmationRef, human_confirmation_sha256: confirmationSha256,
      machine_signals: { zero_consumption: zero ? true : "unknown", repeat_intervention: repeat }, related_targets: [], open_decision: null, supersedes: null,
    };
  });
}

export function refreshEvolutionSnapshot(input = {}) {
  const storageRoot = resolve(requiredString(input.storageRoot, "storageRoot")); const project = requiredString(input.project, "project"); const attemptId = requiredString(input.attemptId ?? input.attempt_id, "attemptId"); const now = requiredString(input.now ?? input.asOf ?? input.as_of, "now");
  const envelope = input.inventory ?? {}; const inventory = envelope.inventory ?? envelope;
  const canonicalInventory = buildInputInventory({ project, inventory, producerIdentity: envelope.producer_identity ?? input.producerIdentity, schemaIdentity: envelope.schema_identity ?? input.schemaIdentity });
  const lock = acquireProjectLock({ storageRoot, project, attemptId });
  if (lock.status !== "ok") return lock;
  try {
    const path = ledgerPath(storageRoot, project);
    const initial = recoverTerminalSuffix(path, lock);
    if (initial.commits.some((entry) => entry.commit.attempt_id === attemptId)) {
      return { status: "conflict", error: { code: "duplicate_attempt", summary: "attempt_id already committed" } };
    }
    const prior = initial.latest;
    const generation = (prior?.commit.publication_generation ?? 0) + 1;
    const snapshotId = hashBytes(canonical(`${canonicalInventory.input_inventory_hash}\0${attemptId}\0${generation}`)); const batchId = randomUUID();
    const priorByGroup = new Map((prior?.rows ?? []).filter((entry) => entry.record_kind === "candidate" && entry.row_status === "active").map((entry) => [entry.candidate_group_id, entry]));
    const proofPayload = (proof) => ({ schema_version: proof?.schema_version, project: proof?.project, task_id: proof?.task_id, scope_revision: proof?.scope_revision, source_subject: proof?.source_subject, source_refs: [...(proof?.source_refs ?? [])].sort(), registered_output_refs: [...(proof?.registered_output_refs ?? [])].sort((a, b) => canonical(a).localeCompare(canonical(b))) });
    const usedProofs = new Set(initial.commits.flatMap((entry) => entry.rows.filter((row) => row.record_kind === "publication_proof").flatMap((row) => row.source_proofs ?? [])).map((proof) => proof.proof_identity ?? hashBytes(canonical(proofPayload(proof)))));
    const inputProofs = inventory.consumer_proofs ?? inventory.consumerProofs ?? [];
    for (const proof of inputProofs) validateWorkflowEvolutionDefinition("consumer_scan_proof", proof);
    const freshProofs = inputProofs.filter((proof) => !usedProofs.has(hashBytes(canonical(proofPayload(proof)))));
    const records = observationsToRecords({ project, ...inventory, consumer_proofs: freshProofs }, now, snapshotId, generation, storageRoot).map((record) => {
      const priorRecord = priorByGroup.get(record.candidate_group_id);
      return withCandidateRecordIdentity({ ...record, ...(priorRecord ? { revision: priorRecord.revision, lifecycle_status: priorRecord.lifecycle_status } : {}), batch_id: batchId, snapshot_content_id: canonicalInventory.input_inventory_hash });
    });
    const refreshResult = { schema_version: SCHEMA_VERSION, record_kind: "refresh_result", batch_id: batchId, project, attempt_id: attemptId, snapshot_content_id: canonicalInventory.input_inventory_hash, snapshot_id: snapshotId, publication_generation: generation, previous_snapshot_id: prior?.commit.snapshot_id ?? null, as_of: now, outcome: "committed", diagnostics: [] };
    const publicationProof = { schema_version: SCHEMA_VERSION, record_kind: "publication_proof", batch_id: batchId, project, attempt_id: attemptId, snapshot_content_id: canonicalInventory.input_inventory_hash, snapshot_id: snapshotId, publication_generation: generation, source_proofs: plain(freshProofs).map((proof) => ({ ...proof, proof_identity: hashBytes(canonical(proofPayload(proof))), candidate_snapshot_id: snapshotId, candidate_snapshot_content_id: canonicalInventory.input_inventory_hash, publication_generation: generation })) };
    for (const record of records) validateWorkflowEvolutionDefinition("candidate_record", record);
    validateWorkflowEvolutionDefinition("refresh_result", refreshResult);
    const rows = [...records, refreshResult, publicationProof];
    const begin = { schema_version: SCHEMA_VERSION, record_kind: "batch_begin", batch_id: batchId, project, attempt_id: attemptId, snapshot_content_id: canonicalInventory.input_inventory_hash, snapshot_id: snapshotId, publication_generation: generation };
    const commit = { schema_version: SCHEMA_VERSION, record_kind: "batch_commit", batch_id: batchId, project, attempt_id: attemptId, snapshot_content_id: canonicalInventory.input_inventory_hash, snapshot_id: snapshotId, publication_generation: generation, producer_identity: canonicalInventory.producer_identity, schema_identity: canonicalInventory.schema_identity, count: rows.length, content_hash: hashBytes(canonical(rows)), status: "committed" };
    publishBatch({ path, lock, expectedHead: prior?.commit ?? null, begin, rows, commit });
    return { status: "ok", snapshotId, snapshot_id: snapshotId, publicationGeneration: generation, publication_generation: generation, snapshotContentId: canonicalInventory.input_inventory_hash, snapshot_content_id: canonicalInventory.input_inventory_hash, producer_identity: canonicalInventory.producer_identity, schema_identity: canonicalInventory.schema_identity, records, refreshResult, refresh_result: refreshResult };
  } catch (error) {
    if (["failed", "conflict", "stale_source"].includes(error?.code)) return { status: error.code, error: { code: error.code, summary: error.message } };
    throw error;
  } finally { lock.release(); }
}

export function recordCandidateTransition(input = {}) {
  const attemptId = requiredString(input.attemptId ?? input.attempt_id, "attemptId");
  const authority = input.lockAuthority ?? input.lock_authority;
  if (!authority?.lockHandle && !authority?.lock_handle) return { status: "failed", error: { code: "failed", summary: "lock authority is required" } };
  const handle = authority.lockHandle ?? authority.lock_handle; const path = handle.path;
  if (typeof path !== "string" || resolve(path) !== lockPath(input.storageRoot, input.project)) return { status: "stale_source", error: { code: "stale_source", summary: "lock handle does not belong to project" } };
  let lockValue;
  try { lockValue = JSON.parse(readFileSync(path, "utf8")); } catch { return { status: "stale_source", error: { code: "stale_source", summary: "lock is unavailable" } }; }
  const owner = authority.ownerToken ?? authority.owner_token;
  const fencing = authority.fencingToken ?? authority.fencing_token ?? handle.fencingToken ?? handle.fencing_token;
  const handleAttempt = handle.attemptId ?? handle.attempt_id;
  if (lockValue.owner_token !== owner || lockValue.fencing_token !== fencing || lockValue.attempt_id !== attemptId || handleAttempt !== attemptId) return { status: "stale_source", error: { code: "stale_source", summary: "lock owner, fencing, or attempt mismatch" } };
  if (Number.isFinite(lockValue.lease_deadline_monotonic_ms) && monotonicMs() > lockValue.lease_deadline_monotonic_ms) return { status: "stale_source", error: { code: "stale_source", summary: "lock lease expired" } };
  const pathOut = ledgerPath(input.storageRoot, input.project);
  let initial;
  try { initial = recoverTerminalSuffix(pathOut, { lockHandle: handle, ownerToken: owner, fencingToken: fencing }); }
  catch (error) { return { status: error.code ?? "failed", error: { code: error.code ?? "failed", summary: error.message } }; }
  const current = initial.latest ? { commit: initial.latest.commit, records: initial.latest.rows.filter((entry) => entry.record_kind === "candidate" || entry.record_kind === "snapshot_record") } : null;
  if (!current) return { status: "failed", error: { code: "failed", summary: "current snapshot is unavailable" } };
  if (current.commit.snapshot_id !== input.currentSnapshotId && current.commit.snapshot_id !== input.current_snapshot_id) return { status: "stale_source", error: { code: "stale_source", summary: "current snapshot authority is stale" } };
  const candidateId = input.candidateId ?? input.candidate_id;
  const candidateRecordId = input.candidateRecordId ?? input.candidate_record_id;
  const record = current.records.find((entry) => entry.candidate_id === candidateId && entry.record_kind === "candidate" && entry.row_status === "active");
  if (!record || record.revision !== Number(input.expectedRevision ?? input.expected_revision)) return { status: "stale_source", error: { code: "stale_source", summary: "candidate revision is stale" } };
  if (candidateRecordId === undefined || (candidateRecordId !== record.record_id && candidateRecordId !== record.candidate_record_id)) return { status: "stale_source", error: { code: "stale_source", summary: "candidate record identity is stale" } };
  const suppliedSources = input.currentSourceIdentities ?? input.current_source_identities;
  const suppliedMaterials = input.currentMaterialIdentities ?? input.current_material_identities;
  const confirmation = input.humanConfirmation ?? input.human_confirmation ?? {};
  const confirmationRef = confirmation.ref ?? confirmation.human_confirmation_ref ?? input.humanConfirmationRef ?? input.human_confirmation_ref;
  const confirmationSha256 = confirmation.sha256 ?? confirmation.human_confirmation_sha256 ?? input.humanConfirmationSha256 ?? input.human_confirmation_sha256;
  if (!Array.isArray(suppliedSources) || canonical(normalizedIdentities(suppliedSources)) !== canonical(record.source_identities ?? [])
    || !Array.isArray(suppliedMaterials) || canonical(normalizedIdentities(suppliedMaterials)) !== canonical(record.material_identities ?? [])
    || confirmationRef !== record.human_confirmation_ref || confirmationSha256 !== record.human_confirmation_sha256) {
    return { status: "stale_source", error: { code: "stale_source", summary: "candidate source, material, or human confirmation authority is stale" } };
  }
  if (!["open", "deferred"].includes(record.lifecycle_status)) return { status: "failed", error: { code: "failed", summary: "terminal candidate cannot transition" } };
  const lifecycleStatus = input.lifecycleStatus ?? input.lifecycle_status ?? "verified";
  const allowedTransitions = { open: ["deferred", "verified", "rejected", "superseded"], deferred: ["open", "verified", "rejected", "superseded"] };
  if (!allowedTransitions[record.lifecycle_status].includes(lifecycleStatus)) return { status: "failed", error: { code: "failed", summary: "candidate lifecycle transition is invalid" } };
  if (initial.commits.some((entry) => entry.commit.attempt_id === attemptId)) return { status: "conflict", error: { code: "duplicate_attempt", summary: "attempt_id already committed" } };
  const generation = current.commit.publication_generation + 1; const snapshotId = hashBytes(canonical(`${current.commit.snapshot_content_id ?? ""}\0${attemptId}\0${generation}`)); const batchId = randomUUID();
  const publicationFields = { batch_id: batchId, snapshot_id: snapshotId, snapshot_content_id: current.commit.snapshot_content_id ?? null, publication_generation: generation };
  const nextRecords = current.records.flatMap((entry) => {
    if (entry !== record) return [withCandidateRecordIdentity({ ...entry, ...publicationFields })];
    if (lifecycleStatus === "superseded") return [
      withCandidateRecordIdentity({ ...entry, ...publicationFields, lifecycle_status: "superseded", row_status: "historical" }),
      withCandidateRecordIdentity({ ...entry, ...publicationFields, revision: record.revision + 1, lifecycle_status: "open", row_status: "active", supersedes: record.candidate_record_id }),
    ];
    return [withCandidateRecordIdentity({ ...entry, ...publicationFields, revision: record.revision + 1, lifecycle_status: lifecycleStatus, row_status: "active" })];
  });
  const begin = { schema_version: SCHEMA_VERSION, record_kind: "batch_begin", batch_id: batchId, project: input.project, attempt_id: attemptId, snapshot_content_id: current.commit.snapshot_content_id ?? null, snapshot_id: snapshotId, publication_generation: generation };
  const commit = { schema_version: SCHEMA_VERSION, record_kind: "batch_commit", batch_id: batchId, project: input.project, attempt_id: attemptId, snapshot_content_id: current.commit.snapshot_content_id ?? null, snapshot_id: snapshotId, publication_generation: generation, producer_identity: current.commit.producer_identity ?? null, schema_identity: current.commit.schema_identity ?? null, count: nextRecords.length, content_hash: hashBytes(canonical(nextRecords)), status: "committed" };
  try { publishBatch({ path: pathOut, lock: { lockHandle: handle, ownerToken: owner, fencingToken: fencing }, expectedHead: current.commit, begin, rows: nextRecords, commit }); }
  catch (error) { return { status: error.code ?? "failed", error: { code: error.code ?? "failed", summary: error.message } }; }
  const transitioned = nextRecords.find((entry) => entry.candidate_id === record.candidate_id && entry.row_status === "active");
  return { status: "ok", candidateId: transitioned.candidate_id, candidate_id: transitioned.candidate_id, revision: transitioned.revision, snapshotId: snapshotId, snapshot_id: snapshotId, publicationGeneration: generation, publication_generation: generation };
}

export function readCurrentEvolutionProjection(input = {}) {
  let current;
  try { current = currentSnapshot(ledgerPath(input.storageRoot, input.project)); }
  catch (error) { return { status: error.code ?? "failed", error: { code: error.code ?? "failed", summary: error.message } }; }
  if (!current) return { status: "unavailable", error: { code: "unavailable", summary: "no committed candidate snapshot" } };
  const tax = input.taxProjection ?? input.tax_projection ?? null;
  const projection = Object.freeze({ schema_version: SCHEMA_VERSION, status: "ok", project: input.project, snapshot_id: current.commit.snapshot_id, publication_generation: current.commit.publication_generation, candidates: current.records, quality_tax: tax, as_of: input.asOf ?? input.as_of ?? null, source_inventory_hash: input.sourceInventoryHash ?? input.source_inventory_hash ?? current.commit.snapshot_content_id ?? null, refresh_result: input.refreshResult ?? input.refresh_result ?? null });
  if (input.expectedIdentity && input.expectedIdentity.snapshot_id && input.expectedIdentity.snapshot_id !== projection.snapshot_id) return { status: "stale_source", error: { code: "stale_source", summary: "projection identity mismatch" } };
  if (input.expectedIdentity && ((input.expectedIdentity.producer_identity !== undefined && canonical(input.expectedIdentity.producer_identity) !== canonical(current.commit.producer_identity)) || (input.expectedIdentity.schema_identity !== undefined && canonical(input.expectedIdentity.schema_identity) !== canonical(current.commit.schema_identity)))) return { status: "stale_source", error: { code: "stale_source", summary: "projection producer/schema identity mismatch" } };
  if (input.sourceInventoryHash !== undefined && input.sourceInventoryHash !== current.commit.snapshot_content_id) return { status: "stale_source", error: { code: "stale_source", summary: "source inventory identity mismatch" } };
  const refresh = input.refreshResult ?? input.refresh_result;
  if (refresh && (refresh.snapshot_id !== current.commit.snapshot_id || refresh.publication_generation !== current.commit.publication_generation || refresh.snapshot_content_id !== current.commit.snapshot_content_id)) return { status: "stale_source", error: { code: "stale_source", summary: "refresh result identity mismatch" } };
  if ((input.asOf ?? input.as_of) !== undefined && tax && (tax.generated_at ?? tax.generatedAt) !== (input.asOf ?? input.as_of)) return { status: "stale_source", error: { code: "stale_source", summary: "tax projection time identity mismatch" } };
  return projection;
}

const D24_CANONICAL_SUBSCHEMA = canonical(EVOLUTION_SCHEMA.$defs.d24_eval_boundary);
export const D24_EVAL_BOUNDARY = Object.freeze({ schema_version: D24_SCHEMA_VERSION, schema_ref: "runtime/schemas/workflow-evolution.v1.json#/$defs/d24_eval_boundary", canonical_bytes: D24_CANONICAL_SUBSCHEMA, sha256: hashBytes(D24_CANONICAL_SUBSCHEMA) });
