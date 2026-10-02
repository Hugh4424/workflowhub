import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { resolveSkillPackage } from "../adapters/local-skill-resolver.mjs";

const OUTCOME_STATUSES = new Set(["completed", "skipped", "not_applicable", "incomplete", "unavailable"]);

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value.trim();
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
 * Retain the reported lifecycle without requiring formal consumer selectors
 * or task identity declarations in a portable method manifest.
 */
export function validateSkillConsumerBinding({ outcome } = {}) {
  const value = validateSkillOutcomeLifecycle(outcome);
  if (value.status !== "completed") text(value.reason ?? value.error, "skill outcome reason");
  return Object.freeze({
    status: value.status,
    trigger: value.trigger,
    executed: value.executed,
    ...(value.status === "completed" ? {} : { reason: value.reason ?? value.error }),
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
    const locator = text(dependency.path, `${stage}/${name}.path`);
    text(dependency.trigger, `${stage}/${name}.trigger`);
    if (path.isAbsolute(locator)) throw new Error(`skill locator must be relative: ${locator}`);
    if (locator.split(/[\\/]/).includes("..")) throw new Error(`skill locator may not traverse: ${locator}`);
    if (!locator.startsWith("skills/")) throw new Error(`skill path escapes package skills/: ${locator}`);
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
