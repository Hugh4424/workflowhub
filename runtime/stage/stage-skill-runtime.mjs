import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { resolveSkillPackage } from "../adapters/local-skill-resolver.mjs";
import { validateStepManifest } from "./step-manifest.mjs";

const IDENTITY_FIELDS = Object.freeze(["task_id", "stage", "material_revision", "snapshot_tree"]);
const OUTCOME_STATUSES = new Set(["completed", "skipped", "not_applicable", "incomplete", "unavailable"]);
const GENERIC_CONSUMER = /(?:executed|package|event|monitoring|generic|stage-outcome)/i;
const FORMAL_CONSUMERS = new Set([
  "stage-handlers#interactionAggregateFacts",
  "stage-handlers#clarifyFacts",
  "stage-handlers#testFacts",
  "stage-handlers#officialStageHandler(\"make-decision\")",
  "stage-handlers#officialStageHandler(\"build-spec\")",
  "stage-handlers#officialStageHandler(\"build-plan\")",
  "stage-handlers#officialStageHandler(\"verify-code\")",
  "stage-handlers#safeReviewFacts",
  "stage-handlers#controlledBrowserQaFacts",
  "stage-handlers#buildCodeContractFacts",
  "stage-handlers#codeReviewFacts",
  "stage-runner#validateStageSpecAnalyzeOutcome",
  "stage-runner#runStageEndReflection",
  "stage-content-contracts#validateComponentQualityMap",
]);

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value.trim();
}

function identity(value) {
  const current = object(value, "skill consumer identity");
  for (const field of IDENTITY_FIELDS) text(current[field], `skill consumer identity.${field}`);
  if (!/^revision-[a-f0-9]{64}$/.test(current.material_revision)) {
    throw new Error("skill consumer identity.material_revision must be revision- plus a sha256");
  }
  if (!/^[a-f0-9]{40}$/.test(current.snapshot_tree)) {
    throw new Error("skill consumer identity.snapshot_tree must be a git tree id");
  }
  return Object.freeze(Object.fromEntries(IDENTITY_FIELDS.map((field) => [field, current[field]])));
}

export function validateSkillConsumerDescriptor(value, label = "skill consumer") {
  const descriptor = object(value, label);
  const target = text(descriptor.target, `${label}.target`);
  if (!FORMAL_CONSUMERS.has(target) || GENERIC_CONSUMER.test(target)) {
    throw new Error(`${label}.target must name one concrete formal consumer: ${target}`);
  }
  if (!Array.isArray(descriptor.inputs) || descriptor.inputs.length === 0
      || descriptor.inputs.some((input) => typeof input !== "string" || input.trim() === "" || GENERIC_CONSUMER.test(input))) {
    throw new Error(`${label}.inputs must list concrete result/material inputs`);
  }
  if (descriptor.inputs.some((input) => input.includes("="))) {
    throw new Error(`${label}.inputs must use concrete result/material inputs; selector inputs are unsupported`);
  }
  if (!Array.isArray(descriptor.identity)
      || descriptor.identity.length !== IDENTITY_FIELDS.length
      || descriptor.identity.some((field, index) => field !== IDENTITY_FIELDS[index])) {
    throw new Error(`${label}.identity must bind task_id, stage, material_revision and snapshot_tree`);
  }
  if (descriptor.result !== undefined) text(descriptor.result, `${label}.result`);
  return Object.freeze({
    target,
    inputs: Object.freeze(descriptor.inputs.map((input) => input.trim())),
    identity: IDENTITY_FIELDS,
    ...(descriptor.result === undefined ? {} : { result: descriptor.result.trim() }),
  });
}

/**
 * Keep lifecycle flags honest at the producer/consumer seam. A completed
 * result means the declared capability really ran; a not_applicable result
 * means it deliberately did not run. Other diagnostic statuses retain their
 * existing semantics.
 */
export function validateSkillOutcomeLifecycle(value, label = "skill outcome") {
  const outcome = object(value, label);
  if (!OUTCOME_STATUSES.has(outcome.status)) throw new Error(`${label} status is invalid`);
  if (typeof outcome.trigger !== "boolean" || typeof outcome.executed !== "boolean") {
    throw new Error(`${label} requires boolean trigger and executed`);
  }
  if (outcome.status === "completed" && (outcome.trigger !== true || outcome.executed !== true)) {
    throw new Error(`${label} completed requires trigger=true and executed=true`);
  }
  if (outcome.status === "not_applicable" && (outcome.trigger !== false || outcome.executed !== false)) {
    throw new Error(`${label} not_applicable requires trigger=false and executed=false`);
  }
  return outcome;
}

/**
 * Authenticate the small declaration-to-result seam before a stage outcome is
 * accepted. This is an in-memory binding only; it creates no second record.
 */
export function validateSkillConsumerBinding({ dependency, outcome, identity: currentIdentity } = {}) {
  const descriptor = validateSkillConsumerDescriptor(dependency?.consumer, `skill ${dependency?.name ?? "unknown"} consumer`);
  const value = validateSkillOutcomeLifecycle(outcome);
  if (value.status !== "completed") text(value.reason ?? value.error, "skill outcome reason");
  const boundIdentity = identity(currentIdentity);
  return Object.freeze({
    status: value.status,
    trigger: value.trigger,
    executed: value.executed,
    consumer: descriptor.target,
    inputs: descriptor.inputs,
    ...(descriptor.result === undefined ? {} : { result: descriptor.result }),
    identity: boundIdentity,
  });
}

function validateStageSkillManifest(manifest, stage) {
  if (!Array.isArray(manifest.skills)) throw new Error(`${stage}: invalid skill manifest`);
  const names = new Set();
  manifest.skills.forEach((dependency, index) => {
    object(dependency, `${stage} skill manifest entry ${index + 1}`);
    const name = text(dependency.name, `${stage} skill manifest entry ${index + 1}.name`);
    if (names.has(name)) throw new Error(`${stage}: duplicate skill dependency: ${name}`);
    names.add(name);
    // Several declared skills may intentionally share one formal consumer
    // (for example the three test-routing skills all feed testFacts).  The
    // invariant is one concrete consumer per skill, not one skill per
    // consumer. Duplicate skill names remain rejected above.
    validateSkillConsumerDescriptor(dependency.consumer, `${stage}/${name} consumer`);
  });
}

export function loadStageSkillManifest(packageRoot, stage) {
  if (!/^[a-z][a-z0-9-]*$/.test(stage)) throw new Error(`invalid stage: ${stage}`);
  const root = fs.realpathSync(packageRoot);
  const relative = `workflows/${stage}/skill-deps.yaml`;
  const source = path.join(root, relative);
  const manifest = yaml.load(fs.readFileSync(source, "utf8"));
  if (manifest?.stage !== stage || !Array.isArray(manifest.skills)) throw new Error(`${stage}: invalid skill manifest`);
  validateStageSkillManifest(manifest, stage);
  return { root, relative, source, manifest };
}

export function loadStageSkillStepManifest(packageRoot, stage) {
  if (!/^[a-z][a-z0-9-]*$/.test(stage)) throw new Error(`invalid stage: ${stage}`);
  const root = fs.realpathSync(packageRoot);
  const relative = `workflows/${stage}/steps.json`;
  const source = path.join(root, relative);
  const manifest = JSON.parse(fs.readFileSync(source, "utf8"));
  const validation = validateStepManifest(manifest);
  if (!validation.ok) throw new Error(`${stage}: invalid step manifest: ${validation.errors.join("; ")}`);
  return { root, relative, source, manifest };
}

export function resolveStageSkillPackages({ packageRoot, stage } = {}) {
  const loaded = loadStageSkillManifest(packageRoot, stage);
  const dependencies = new Map();
  const payloads = new Map();
  for (const dependency of loaded.manifest.skills) {
    dependencies.set(dependency.name, dependency);
    payloads.set(dependency.name, resolveSkillPackage({ packageRoot: loaded.root, manifestPath: loaded.relative, dependency }));
  }
  return { ...loaded, dependencies, payloads };
}
