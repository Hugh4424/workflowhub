/** Read-only historical observations/candidates and ordinary quality-tax projection. */
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { openTask } from "../task/task-handle.mjs";
// P9/T019 (D-029): keep the ordered historical build-spec value and attribution regex unchanged.
// Removing either would change upstream_omission:build-spec from attributed to unknown.
// Retain them until a later complete real-task observation confirms unchanged historical attribution
// and retired-review refusal; that observation is not complete in this task. Owner: P9/T019.
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const STAGE_INDEX = new Map(STAGES.map((value, index) => [value, index]));
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const SCHEMA_VERSION = "workflow-evolution.v1";
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
function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") throw fail("invalid_input", `${name} must be a non-empty string`);
  return value;
}

function attribution(stage, value) {
  const raw = typeof value === "string" ? value : "";
  const match = /^upstream_omission:(make-decision|build-spec|build-plan|build-code|verify-code)$/.exec(raw);
  if (!match) return { status: "unknown", reason: raw ? "invalid_attribution" : "missing_attribution" };
  if ((STAGE_INDEX.get(match[1]) ?? Infinity) >= (STAGE_INDEX.get(stage) ?? -1)) return { status: "unknown", reason: "stage_order" };
  return { status: "attributed", stage: match[1] };
}

function taxIdentity(item, project) {
  const itemProject = item?.project ?? item?.project_id ?? project;
  const taskId = item?.task_id ?? item?.taskId;
  const confirmationRef = item?.confirmation_ref ?? item?.confirmationRef;
  if (typeof itemProject !== "string" || itemProject.trim() === "" || typeof taskId !== "string" || taskId.trim() === "" || typeof confirmationRef !== "string" || confirmationRef.trim() === "") return null;
  return { project: itemProject, taskId, confirmationRef, key: `${itemProject}\0${taskId}\0${confirmationRef}` };
}

function validateTaxSource(item, identity, inventory, storageRoot) {
  // Ordinary source identity/path stays checked; old digests are passive provenance.
  const source = item?.source ?? item?.source_fact ?? item?.sourceFact ?? item?.confirmation;
  if (source === undefined && item?.source_ref === undefined && item?.source_sha256 === undefined && item?.source_schema_version === undefined && item?.source_path === undefined && item?.sourcePath === undefined) return null;
  if (source !== undefined && (!source || typeof source !== "object" || Array.isArray(source))) return "source_identity_invalid";
  const sourceValue = source ?? item;
  const sourceTask = sourceValue.task_id ?? sourceValue.taskId;
  const sourceProject = sourceValue.project ?? sourceValue.project_id;
  const sourceStage = sourceValue.stage ?? sourceValue.intervention_stage ?? sourceValue.interventionStage;
  const sourceStep = sourceValue.step_slug ?? sourceValue.stepSlug;
  if (sourceProject !== undefined && sourceProject !== identity.project) return "source_project_mismatch";
  if (sourceTask !== undefined && sourceTask !== identity.taskId) return "source_task_mismatch";
  if (sourceStage !== undefined && sourceStage !== (item.intervention_stage ?? item.interventionStage)) return "source_stage_mismatch";
  if (sourceStep !== undefined && typeof sourceStep !== "string") return "source_step_invalid";
  const schemaVersion = item.source_schema_version ?? item.sourceSchemaVersion ?? sourceValue.schema_version ?? sourceValue.schemaVersion;
  if (schemaVersion !== undefined && (typeof schemaVersion !== "string" || schemaVersion.trim() === "")) return "source_schema_invalid";
  const sourceRef = item.source_ref ?? item.sourceRef ?? sourceValue.source_ref ?? sourceValue.ref;
  if (sourceRef !== undefined && (typeof sourceRef !== "string" || sourceRef.trim() === "")) return "source_ref_invalid";
  const sourcePath = item.source_path ?? item.sourcePath ?? sourceValue.path;
  if (sourcePath !== undefined) {
    if (typeof sourcePath !== "string" || sourcePath.trim() === "") return "source_path_invalid";
    if (typeof storageRoot !== "string" || storageRoot.trim() === "") return "source_path_unavailable";
    if (!/^[A-Za-z0-9._-]+$/.test(identity.project) || !/^[A-Za-z0-9._-]+$/.test(identity.taskId)) return "source_path_untrusted";
    try {
      const root = resolve(storageRoot);
      const taskRoot = resolve(root, "Projects", identity.project, "tasks", identity.taskId);
      const resolvedSource = isAbsolute(sourcePath) ? resolve(sourcePath) : resolve(taskRoot, sourcePath);
      const relativeSource = relative(taskRoot, resolvedSource);
      if (!relativeSource || relativeSource === ".." || relativeSource.startsWith(`..${sep}`) || isAbsolute(relativeSource)) return "source_path_untrusted";
      openTask(taskRoot, { projectName: identity.project, taskId: identity.taskId }).readRecordBytes(relativeSource.split(sep).join("/"));
    } catch { return "source_unavailable"; }
  }
  const attributionStatus = item.attribution_status ?? item.attributionStatus;
  if (attributionStatus !== undefined && !["attributed", "unknown"].includes(attributionStatus)) return "attribution_status_invalid";
  return null;
}

function authenticatedTaxConfirmation(item, identity, storageRoot) {
  const ref = identity.confirmationRef;
  if (!/^quality\/(?:confirmations|evidence\/human-confirmations)\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(ref) || typeof storageRoot !== "string" || !storageRoot.trim()) return { error: "confirmation_ref_unavailable" };
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(identity.project) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(identity.taskId)) return { error: "confirmation_identity_invalid" };
  try {
    const task = openTask(join(resolve(storageRoot), "Projects", identity.project, "tasks", identity.taskId), { projectName: identity.project, taskId: identity.taskId });
    const value = JSON.parse(task.readRecord(ref));
    const stage = item.intervention_stage ?? item.interventionStage, step = item.step_slug ?? item.stepSlug;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.stage !== stage || typeof value.decision !== "string" || !value.decision.trim()) return { error: "confirmation_identity_invalid" };
    const legacy = value.schema_version !== undefined;
    if (legacy && (!["human-confirmation.v1", "human-confirmation.v2", "human-confirmation.v3"].includes(value.schema_version) || value.task_id !== identity.taskId || !["accepted", "rejected"].includes(value.decision))) return { error: "confirmation_identity_invalid" };
    const time = legacy ? value.confirmed_at : value.created_at;
    if (typeof time !== "string" || !/T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(time) || !Number.isFinite(Date.parse(time))) return { error: "confirmation_time_invalid" };
    if (value.schema_version === "human-confirmation.v3") {
      const confirmedStep = value.step_slug;
      if (typeof confirmedStep !== "string" || !confirmedStep.trim() || typeof value.reply_text !== "string" || !value.reply_text.trim()) return { error: "confirmation_step_missing" };
      if (step !== undefined && (step !== confirmedStep || (value.subject_ref !== step && value.attempt_ref !== step))) return { error: "confirmation_step_mismatch" };
    }
    if (!legacy && (typeof value.reply !== "string" || !value.reply.trim() || !Array.isArray(value.material_refs) || value.material_refs.some(ref => typeof ref !== "string" || !ref.trim()))) return { error: "confirmation_invalid" };
    return { ref, value };
  } catch (error) { return { error: error?.code === "ENOENT" ? "confirmation_missing" : "confirmation_invalid" }; }
}
function unavailableTax(asOf, summary) {
  const end = Date.parse(asOf);
  return {
    schema_version: "quality-tax.v1", status: "unavailable", error: { code: "identity_conflict", summary },
    sample_count: 0, unknown_count: 0, ratio: null, confidence: "unavailable", sample_status: "insufficient_samples",
    window_start: new Date(end - WINDOW_MS).toISOString(), window_end: asOf, generated_at: asOf, source_refs: [],
  };
}

function candidateRegion(candidates, tier, projectionStatus) {
  if (projectionStatus !== "ok") return { status: projectionStatus, reason: "候选快照不可用" };
  const entries = candidates.filter((entry) => entry.record_kind === "candidate" && entry.row_status === "active" && entry.tier === tier);
  if (entries.length === 0) return { status: "empty", reason: "当前分区没有候选" };
  if (entries.some((entry) => entry.freshness === "stale")) return { status: "stale", reason: "候选来源已过期" };
  if (entries.some((entry) => entry.evidence_status === "unavailable")) return { status: "unavailable", reason: "候选证据不可用" };
  return { status: "ok", validation_status: entries.some((entry) => entry.validation_status === "unverified") ? "unverified" : "verified" };
}

function taxRegion(tax) {
  if (!tax || typeof tax !== "object") return { status: "unavailable", reason: "质量税投影不可用" };
  if (tax.status !== "ok") return { status: tax.status ?? "unavailable", reason: tax.error?.summary ?? "质量税投影不可用" };
  if (tax.sample_status === "insufficient_samples") return { status: "insufficient_samples", reason: "有效样本少于 5 个" };
  return { status: "ok", validation_status: tax.validation_status ?? "unverified" };
}

function projectionRegions(candidates, tax, projectionStatus) {
  const regions = {
    action_suggested: candidateRegion(candidates, "action_suggested", projectionStatus),
    reference_only: candidateRegion(candidates, "reference_only", projectionStatus),
    quality_tax: taxRegion(tax),
  };
  const statuses = Object.values(regions).map((entry) => entry.status);
  const summaryStatus = statuses.every((status) => status === "ok") ? "ok" : statuses.some((status) => status === "ok") ? "partial" : (statuses.includes("error") ? "error" : statuses.includes("unavailable") ? "unavailable" : statuses.includes("stale") ? "stale" : statuses.includes("insufficient_samples") ? "insufficient_samples" : "empty");
  return { summary_status: summaryStatus, ...regions };
}

export function computeQualityTaxProjection(input = {}) {
  const asOf = input.asOf ?? input.as_of;
  requiredString(asOf, "asOf");
  const end = Date.parse(asOf); if (!Number.isFinite(end)) throw fail("invalid_input", "asOf must be an ISO timestamp");
  const interventions = Array.isArray(input.interventions) ? input.interventions : [];
  const project = input.inventory?.project ?? input.inventory?.project_id;
  const valid = []; const byIdentity = new Map(); let unknownCount = 0; let numerator = 0; const sourceRefs = new Set();
  for (const item of interventions) {
    const occurred = Date.parse(item?.occurred_at ?? item?.occurredAt ?? "");
    if (!Number.isFinite(occurred)) return unavailableTax(asOf, "occurred_at_invalid");
    if (occurred > end || occurred < end - WINDOW_MS) continue;
    const identity = taxIdentity(item, project);
    if (!identity) return unavailableTax(asOf, "intervention_identity_invalid");
    if (project && identity.project !== project) return unavailableTax(asOf, "intervention_project_mismatch");
    const stage = item.intervention_stage ?? item.interventionStage;
    if (!STAGE_INDEX.has(stage)) return unavailableTax(asOf, "intervention_stage_invalid");
    const sourceError = validateTaxSource(item, identity, input.inventory, input.storageRoot ?? input.storage_root ?? input.inventory?.storageRoot ?? input.inventory?.storage_root);
    if (sourceError) return unavailableTax(asOf, sourceError);
    const confirmation = authenticatedTaxConfirmation(item, identity, input.storageRoot ?? input.storage_root ?? input.inventory?.storageRoot ?? input.inventory?.storage_root);
    if (confirmation.error) return unavailableTax(asOf, confirmation.error);
    const key = identity.key;
    const itemBytes = canonical(item);
    const previous = byIdentity.get(key);
    if (previous !== undefined) {
      if (previous !== itemBytes) return { status: "unavailable", error: { code: "identity_conflict", summary: `intervention identity has conflicting bytes: ${key}` }, sample_count: 0, unknown_count: 0, ratio: null, confidence: "unavailable", sample_status: "insufficient_samples", window_start: new Date(end - WINDOW_MS).toISOString(), window_end: asOf, generated_at: asOf, source_refs: [] };
      continue;
    }
    byIdentity.set(key, itemBytes);
    const result = attribution(stage, item.primary_attribution_stage ?? item.primaryAttributionStage);
    valid.push({ key, identity, item, result, occurred, confirmation: confirmation.value });
    const sourceRef = item.source_ref ?? item.sourceRef ?? item.source?.ref;
    if (typeof sourceRef === "string" && sourceRef.trim() !== "") sourceRefs.add(sourceRef);
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
    validation_status: "unverified", label: "未验证，待真实任务数据", source_refs: [...sourceRefs].sort(),
    source_identities: normalizedIdentities(input.sourceIdentities ?? input.source_identities, []),
    interventions: valid.map(({ key, identity, item, result, confirmation }) => ({
      intervention_id: `tax-intervention.v1:${hashBytes(canonical({ project: identity.project, task_id: identity.taskId, confirmation_ref: identity.confirmationRef }))}`,
      project: identity.project, task_id: identity.taskId, confirmation_ref: identity.confirmationRef,
      intervention_stage: item.intervention_stage ?? item.interventionStage,
      occurred_at: item.occurred_at ?? item.occurredAt,
      step_slug: item.step_slug ?? item.stepSlug ?? null,
      primary_attribution_stage: item.primary_attribution_stage ?? item.primaryAttributionStage ?? null,
      attribution_status: result.status, unknown_reason: result.status === "unknown" ? result.reason : null,
      source_ref: item.source_ref ?? item.sourceRef ?? item.source?.ref ?? null,
      source_schema_version: confirmation.schema_version,
    })),
  };
  return Object.freeze(output);
}

function normalizedIdentities(value, fallback = []) {
  const list = Array.isArray(value) ? value : fallback;
  const unique = new Map();
  for (const entry of list) {
    const normalized = plain(entry);
    unique.set(canonical(normalized), normalized);
  }
  return [...unique.values()].sort((left, right) => canonical(left).localeCompare(canonical(right)));
}

const sameFile = (a, b) => a.dev === b.dev && a.ino === b.ino;
function readHistoricalLedger(storageRoot, project) {
  requiredString(storageRoot, "storageRoot"); requiredString(project, "project");
  if (!isAbsolute(storageRoot) || project === "." || project === ".." || project.includes("/") || project.includes("\\") || project.includes("\0")) throw fail("invalid_input", "historical project path is invalid");
  const file = join(resolve(storageRoot), "Projects", project, "evolution-candidates.jsonl");
  let cursor = parse(file).root; const ancestors = [];
  for (const part of dirname(file).slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part); const stat = lstatSync(cursor);
    const alias = process.platform === "darwin" && ((cursor === "/tmp" && realpathSync(cursor) === "/private/tmp") || (cursor === "/var" && realpathSync(cursor) === "/private/var"));
    if ((!alias && stat.isSymbolicLink()) || (!alias && !stat.isDirectory())) throw fail("failed", "historical ledger ancestor is not a real directory");
    ancestors.push({ path: cursor, dev: stat.dev, ino: stat.ino, real: realpathSync(cursor) });
  }
  const verify = () => { for (const before of ancestors) if (!sameFile(before, lstatSync(before.path)) || realpathSync(before.path) !== before.real) throw fail("failed", "historical ledger ancestor changed"); };
  verify(); const named = lstatSync(file);
  if (!Number.isInteger(constants.O_NOFOLLOW) || named.isSymbolicLink() || !named.isFile() || named.nlink !== 1) throw fail("failed", "historical ledger must be a single-link file");
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd); if (!sameFile(named, opened) || opened.nlink !== 1 || !opened.isFile()) throw fail("failed", "historical ledger changed while opening");
    verify(); const raw = readFileSync(fd, "utf8"); const after = lstatSync(file);
    if (after.isSymbolicLink() || after.nlink !== 1 || !sameFile(after, opened) || !sameFile(fstatSync(fd), opened)) throw fail("failed", "historical ledger changed while reading");
    verify(); return raw;
  } finally { closeSync(fd); }
}
function historicalCandidate(value) {
  for (const field of ["candidate_id", "candidate_group_id"]) requiredString(value[field], field);
  const enums = { tier: ["action_suggested", "reference_only"], lifecycle_status: ["open", "deferred", "verified", "rejected", "superseded"], row_status: ["active", "historical"], freshness: ["current", "stale"], evidence_status: ["complete", "partial", "unknown", "unavailable"], sample_status: ["sufficient", "insufficient_samples"], validation_status: ["verified", "unverified", "not_applicable"] };
  for (const [field, values] of Object.entries(enums)) if (!values.includes(value[field])) throw fail("failed", `historical candidate ${field} is invalid`);
  if (value.classification === "remove_candidate" && value.removal_status !== "pending") throw fail("failed", "historical removal status is invalid");
  return value;
}
function currentSnapshot(raw, project) {
  if (raw && !raw.endsWith("\n")) throw fail("failed", "historical ledger has an incomplete final record");
  let open = null, latest = null;
  for (const [index, line] of raw.split("\n").entries()) {
    if (!line) { if (index !== raw.split("\n").length - 1) throw fail("failed", "historical ledger has an empty record"); continue; }
    let value; try { value = JSON.parse(line); } catch (cause) { throw Object.assign(fail("failed", `historical ledger JSON invalid at line ${index + 1}`), { cause }); }
    if (!value || typeof value !== "object" || Array.isArray(value)) throw fail("failed", "historical ledger record must be an object");
    if (value.project !== undefined && value.project !== project) throw fail("failed", "historical ledger project mismatch");
    requiredString(value.batch_id, "batch_id");
    if (["batch_begin", "batch_commit"].includes(value.record_kind)
      && (value.schema_version !== SCHEMA_VERSION || value.project !== project)) throw fail("failed", "historical batch version/project identity mismatch");
    if (value.record_kind === "batch_begin") { if (open) throw fail("failed", "historical batch already open"); open = { begin: value, rows: [] }; continue; }
    if (!open || value.batch_id !== open.begin.batch_id) throw fail("failed", "historical batch identity mismatch");
    if (value.record_kind === "batch_abort") { requiredString(value.reason, "reason"); open = null; continue; }
    if (value.record_kind === "batch_commit") {
      if (value.status !== "committed" || !Number.isInteger(value.count) || value.count < 0 || value.count !== open.rows.length) throw fail("failed", "historical batch status/count invalid");
      latest = { commit: value, records: open.rows.filter(row => ["candidate", "snapshot_record"].includes(row.record_kind)) }; open = null; continue;
    }
    if (!["candidate", "snapshot_record", "refresh_result", "publication_proof"].includes(value.record_kind)) throw fail("failed", "historical record kind is invalid");
    if (["candidate", "snapshot_record"].includes(value.record_kind)) historicalCandidate(value);
    open.rows.push(value);
  }
  if (open) throw fail("failed", "historical ledger has an incomplete batch");
  return latest;
}
/** Reads already recorded history only; no refresh, writer, current-quality or completion authority. */
export function readCurrentEvolutionProjection(input = {}) {
  let current;
  try { current = currentSnapshot(readHistoricalLedger(input.storageRoot, input.project), input.project); }
  catch (error) { return { status: error.code === "ENOENT" ? "unavailable" : error.code ?? "failed", error: { code: error.code ?? "failed", summary: error.message } }; }
  if (!current) return { status: "unavailable", error: { code: "unavailable", summary: "no committed historical candidate batch" } };
  const tax = input.taxProjection ?? input.tax_projection ?? null;
  if (tax !== null && (!tax || typeof tax !== "object" || Array.isArray(tax))) return { status: "failed", error: { code: "invalid_input", summary: "ordinary tax projection must be an object" } };
  const asOf = input.asOf ?? input.as_of ?? null;
  if (asOf !== null && (typeof asOf !== "string" || !Number.isFinite(Date.parse(asOf)))) return { status: "failed", error: { code: "invalid_input", summary: "projection time is invalid" } };
  return Object.freeze({ schema_version: SCHEMA_VERSION, status: "ok", historical: true, project: input.project, snapshot_id: current.commit.snapshot_id ?? null, publication_generation: current.commit.publication_generation ?? null, candidates: current.records, quality_tax: tax, regions: projectionRegions(current.records, tax, "ok"), as_of: asOf, source_inventory_hash: current.commit.snapshot_content_id ?? null, refresh_result: null });
}
