import { createHash } from "node:crypto";
import matrix from "../../../runtime/review/stage-materials.json" with { type: "json" };

export const SEMANTIC_PROJECTION_VERSION = "wh-review-semantic-projection.v1";

const RECORD_ONLY_FIELDS = new Set([
  "status", "completed_at", "created_at", "updated_at", "handoff", "review_ref", "result_ref",
  "attempt_ref", "provider", "providers", "provider_results", "runtime_id", "session_id", "retry",
  "attempts", "timing", "usage", "terminal_status", "error", "error_code", "finding_disposition",
]);

const SURFACE_REGISTRY = Object.freeze(matrix.surfaces ?? {});
const SURFACE_FIELDS = Object.freeze(Object.fromEntries(Object.entries(SURFACE_REGISTRY).map(([surface, definition]) => [surface, [...definition.semantic_fields]])));

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function surfaceName({ stage, review_track = null, review_scope = null, review_kind = null } = {}) {
  if (review_kind === "mini_task.design" || review_kind === "mini_task.implementation") return `mini-task/${review_kind.split(".")[1]}`;
  if (stage === "make-decision") return `${stage}/${review_track ?? ""}`;
  if (stage === "build-code") return `${stage}/${review_scope ?? "phase"}`;
  return stage;
}

function sourceValue(name, sources) {
  for (const source of sources) {
    if (!source || typeof source !== "object" || Array.isArray(source)) continue;
    if (Object.hasOwn(source, name)) return source[name];
  }
  return undefined;
}

function stripExecutionStatusSection(value) {
  if (typeof value !== "string") return value;
  const kept = [];
  let skipLevel = null;
  for (const line of value.split(/\r?\n/)) {
    const heading = /^(#{3,6})\s+(.+?)\s*$/.exec(line);
    if (skipLevel !== null) {
      if (heading && heading[1].length <= skipLevel) skipLevel = null;
      else continue;
    }
    if (skipLevel === null && heading && /执行状态填写区|execution status/i.test(heading[2])) {
      skipLevel = heading[1].length;
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n").replace(/\s+$/u, "").replace(/\r\n/g, "\n");
}

function stripRecordFields(value, path = []) {
  if (Array.isArray(value)) return value.map((child) => stripRecordFields(child, path));
  if (!value || typeof value !== "object") return value;
  const preserveSemanticStatus = path[0] === "ac_trace";
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => {
      // Integration AC change summaries come from the task execution-status
      // block. That block is record-only, so its prose must not make the
      // semantic projection drift and trigger a needless provider review.
      const executionChangeSummary = path[0] === "ac_trace" && path.includes("change") && key === "summary";
      return !executionChangeSummary && (!RECORD_ONLY_FIELDS.has(key) || (key === "status" && preserveSemanticStatus));
    })
    .map(([key, child]) => [key, stripRecordFields(child, [...path, key])]));
}

export function semanticFieldsFor(surface) {
  if (!Object.hasOwn(SURFACE_FIELDS, surface)) throw new Error(`unknown review surface: ${surface}`);
  return [...SURFACE_FIELDS[surface]];
}

export function buildSemanticProjection({ stage, review_track = null, review_scope = null, review_kind = null, contract_id, contract_hash, input = {}, materials = {}, subject = {}, extra = {} } = {}) {
  const surface = surfaceName({ stage, review_track, review_scope, review_kind });
  const fields = semanticFieldsFor(surface);
  if (typeof contract_id !== "string" || contract_id.trim() === "") throw new TypeError("contract_id is required");
  if (typeof contract_hash !== "string" || contract_hash.trim() === "") throw new TypeError("contract_hash is required");
  const semanticInput = Object.fromEntries(fields
    .map((name) => [name, sourceValue(name, [input, materials, subject, extra])])
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => [name, stripRecordFields(
      (name === "draft_tasks" || name === "tasks") ? stripExecutionStatusSection(value) : value,
      [name],
    )]));
  const projection = canonical({ projection_version: SEMANTIC_PROJECTION_VERSION, surface, contract_id, contract_hash, fields, input: semanticInput });
  const semantic_hash = createHash("sha256").update(JSON.stringify(projection), "utf8").digest("hex");
  return Object.freeze({ ...projection, semantic_hash });
}

export function compareSemanticProjection(previous, current) {
  if (!previous || !current || typeof previous.semantic_hash !== "string" || typeof current.semantic_hash !== "string") return Object.freeze({ changed: true, kind: "unknown", reason: "projection_missing" });
  const changed = previous.semantic_hash !== current.semantic_hash;
  return Object.freeze({ changed, kind: changed ? "semantic_changed" : "record_only_changed", reason: changed ? "semantic_hash_changed" : "semantic_hash_unchanged" });
}

export function affectedReviewSurfaces(previousBySurface = {}, currentBySurface = {}) {
  const surfaces = [...new Set([...Object.keys(previousBySurface), ...Object.keys(currentBySurface)])].sort();
  return surfaces.filter((surface) => compareSemanticProjection(previousBySurface[surface], currentBySurface[surface]).changed);
}

export const REVIEW_SEMANTIC_SURFACES = Object.freeze(Object.keys(SURFACE_FIELDS));
