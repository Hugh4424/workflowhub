import { readFileSync } from "node:fs";
import { join } from "node:path";

export const CANONICAL_STAGE_SLUGS = Object.freeze([
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
]);
export const STEP_MANIFEST_SCHEMA_VERSION = "2.0.0";

const REQUIRED_STEP_FIELDS = [
  "step_id",
  "step_slug",
  "order",
  "entry_conditions",
  "completion_evidence",
  "observable_result",
  "depends_on",
];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEvidenceRef(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    && isNonEmptyString(value.kind) && isNonEmptyString(value.uri_or_path);
}

function validateEvidenceRefs(stepId, field, refs, errors) {
  if (!Array.isArray(refs)) return;
  refs.forEach((ref, index) => {
    if (!isEvidenceRef(ref)) {
      errors.push(`step ${stepId} ${field}[${index}] must be an object with non-empty kind and uri_or_path`);
    }
  });
}

export function validateStepManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["manifest must be an object"] };
  }
  if (manifest.schema_version !== STEP_MANIFEST_SCHEMA_VERSION) {
    errors.push(`LEGACY_FIELDS_MISSING: schema_version must be ${STEP_MANIFEST_SCHEMA_VERSION}; migration_hint=use long stage_slug and integer step_id`);
  }
  if (!CANONICAL_STAGE_SLUGS.includes(manifest.stage_slug)) {
    errors.push("LEGACY_FIELDS_MISSING: stage_slug must be a long canonical stage; migration_hint=use workflows/<long-stage>/steps.json");
  }
  if (!Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    errors.push("steps must be a non-empty array");
    return { ok: false, errors };
  }

  const byId = new Map();
  const byOrder = new Map();
  for (const [index, step] of manifest.steps.entries()) {
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      errors.push(`step at index ${index} must be an object`);
      continue;
    }
    for (const field of REQUIRED_STEP_FIELDS) {
      if (!(field in step)) errors.push(`step ${index + 1} missing required field ${field}`);
    }
    if (!Number.isInteger(step.step_id) || step.step_id < 1) errors.push(`LEGACY_FIELDS_MISSING: step ${index + 1} step_id must be an integer >= 1; migration_hint=preserve old label as step_slug`);
    if (!isNonEmptyString(step.step_slug)) errors.push(`step ${index + 1} step_slug must be a non-empty string`);
    if (!Number.isInteger(step.order) || step.order < 1) errors.push(`step ${step.step_id ?? index + 1} order must be a positive integer`);
    if (!Array.isArray(step.entry_conditions) || step.entry_conditions.length === 0) errors.push(`step ${step.step_id ?? index + 1} entry_conditions must be a non-empty array`);
    if (!Array.isArray(step.completion_evidence) || step.completion_evidence.length === 0) errors.push(`step ${step.step_id ?? index + 1} completion_evidence must be a non-empty array`);
    if (!isNonEmptyString(step.observable_result)) errors.push(`step ${step.step_id ?? index + 1} observable_result must be a non-empty string`);
    if (!Array.isArray(step.depends_on)) errors.push(`step ${step.step_id ?? index + 1} depends_on must be an array`);
    validateEvidenceRefs(step.step_id ?? index + 1, "entry_conditions", step.entry_conditions, errors);
    validateEvidenceRefs(step.step_id ?? index + 1, "completion_evidence", step.completion_evidence, errors);

    if (Number.isInteger(step.step_id) && step.step_id > 0) {
      if (byId.has(step.step_id)) errors.push(`duplicate step_id: ${step.step_id}`);
      else byId.set(step.step_id, step);
    }
    if (Number.isInteger(step.order) && step.order > 0) {
      if (byOrder.has(step.order)) errors.push(`duplicate order: ${step.order}`);
      else byOrder.set(step.order, step);
    }
  }

  for (let order = 1; order <= manifest.steps.length; order += 1) {
    if (!byOrder.has(order)) errors.push(`order must be continuous; missing order ${order}`);
  }

  for (const step of manifest.steps) {
    if (!step || !Array.isArray(step.depends_on) || !Number.isInteger(step.step_id)) continue;
    for (const dependencyId of step.depends_on) {
      if (!Number.isInteger(dependencyId) || dependencyId < 1) {
        errors.push(`step ${step.step_id} depends_on entries must be positive integers`);
        continue;
      }
      const dependency = byId.get(dependencyId);
      if (!dependency) {
        errors.push(`step ${step.step_id} depends on undeclared step ${dependencyId}`);
      } else if (Number.isInteger(dependency.order) && Number.isInteger(step.order) && dependency.order >= step.order) {
        errors.push(`step ${step.step_id} dependency ${dependencyId} must be declared before its dependent`);
      } else if (!step.entry_conditions.some((entryCondition) => (
        isEvidenceRef(entryCondition) && entryCondition.uri_or_path === `step://${dependencyId}`
      ))) {
        errors.push(`step ${step.step_id} dependency ${dependencyId} must have matching entry evidence step://${dependencyId}`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(stepId) {
    if (visiting.has(stepId)) {
      errors.push(`cyclic dependency detected at ${stepId}`);
      return;
    }
    if (visited.has(stepId)) return;
    visiting.add(stepId);
    const step = byId.get(stepId);
    for (const dependencyId of step?.depends_on ?? []) {
      if (byId.has(dependencyId)) visit(dependencyId);
    }
    visiting.delete(stepId);
    visited.add(stepId);
  }
  for (const stepId of byId.keys()) visit(stepId);

  return { ok: errors.length === 0, errors };
}

export function loadStageManifest(stageSlug, repoRoot = process.cwd()) {
  if (!CANONICAL_STAGE_SLUGS.includes(stageSlug)) {
    throw new Error(`Unknown canonical stage: ${stageSlug}`);
  }
  const filePath = join(repoRoot, "workflows", stageSlug, "steps.json");
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function validateAllStageManifests(repoRoot = process.cwd()) {
  const errors = [];
  for (const stageSlug of CANONICAL_STAGE_SLUGS) {
    try {
      const manifest = loadStageManifest(stageSlug, repoRoot);
      if (manifest.stage_slug !== stageSlug) errors.push(`${stageSlug} manifest stage_slug must equal ${stageSlug}`);
      const result = validateStepManifest(manifest);
      errors.push(...result.errors.map((error) => `${stageSlug}: ${error}`));
    } catch (error) {
      errors.push(`${stageSlug}: ${error.message}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
