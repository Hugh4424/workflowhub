#!/usr/bin/env node
/**
 * validate-stage-result.mjs — M6 Phase 2 (FR-CONTRACT-001/002 / D11).
 *
 * Validates a stage-result artifact in two steps:
 *   1. Top-level contract: contracts/stage-result.contract.json (seven required fields + types).
 *   2. Per-stage facts sub-schema: contracts/facts-subschema.json (each stage's required_keys,
 *      each value must be non-empty: non-empty string, non-empty array, or truthy non-object).
 *
 * Exports: validateStageResult(stage, artifact) -> { ok: boolean, errors: string[] }
 * CLI:     node scripts/validate-stage-result.mjs <stage> <artifact-json-path>
 *
 * No AJV — hand-written validator consistent with core/validate-contract.mjs (FR-NC-004).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContract } from "../core/validate-contract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

// Load contracts once at module level (cached for repeated test use)
const stageResultContract = JSON.parse(
  readFileSync(resolve(repoRoot, "contracts", "stage-result.contract.json"), "utf8")
);
const factsSubschema = JSON.parse(
  readFileSync(resolve(repoRoot, "contracts", "facts-subschema.json"), "utf8")
);

/**
 * Returns true if a facts value is considered "non-empty":
 *   - non-empty string
 *   - non-empty array (length > 0)
 *   - any other truthy value (number, boolean true, object with keys, etc.)
 * Returns false for: "", [], null, undefined, 0, false, {}
 */
function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  // number, boolean — truthy wins
  return Boolean(value);
}

/**
 * validateStageResult(stage, artifact) -> { ok: boolean, errors: string[] }
 *
 * Step 1: validates artifact against stage-result.contract.json.
 * Step 2: validates artifact.facts against the per-stage facts sub-schema.
 *
 * additionalProperties in facts are allowed — only the agreed required_keys are enforced.
 */
export function validateStageResult(stage, artifact) {
  const errors = [];

  // Step 1: top-level stage-result contract
  const contractResult = validateContract(artifact, stageResultContract);
  if (!contractResult.valid) {
    return { ok: false, errors: contractResult.errors };
  }

  // Step 2: per-stage facts sub-schema
  const stageSchema = factsSubschema.stages[stage];
  if (!stageSchema) {
    errors.push(`unknown stage: "${stage}" — not defined in facts-subschema.json`);
    return { ok: false, errors };
  }

  const facts = artifact.facts;
  for (const key of stageSchema.required_keys) {
    if (!(key in facts)) {
      errors.push(`facts missing required key for stage "${stage}": "${key}"`);
    } else if (!isNonEmpty(facts[key])) {
      errors.push(
        `facts["${key}"] for stage "${stage}" must be non-empty (got ${JSON.stringify(facts[key])})`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

// ── CLI entry ─────────────────────────────────────────────────────────────────

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const [stage, artifactPath] = process.argv.slice(2);

  if (!stage || !artifactPath) {
    console.error("Usage: node scripts/validate-stage-result.mjs <stage> <artifact-json-path>");
    console.error("Stages: make-decision, build-spec, build-plan, build-code, verify-code");
    process.exit(2);
  }

  let artifact;
  try {
    artifact = JSON.parse(readFileSync(resolve(artifactPath), "utf8"));
  } catch (err) {
    console.error(`[validate-stage-result] Failed to read artifact: ${err.message}`);
    process.exit(2);
  }

  const result = validateStageResult(stage, artifact);
  if (result.ok) {
    console.log(`[validate-stage-result] PASS — stage "${stage}" artifact valid`);
    process.exit(0);
  } else {
    for (const e of result.errors) {
      console.error(`[validate-stage-result] FAIL: ${e}`);
    }
    process.exit(1);
  }
}
