import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import { resolveLocalSkill, validateReviewBundleProjection, validateSkillBundle } from "../adapters/local-skill-resolver.mjs";
import { SHA256_HEX_CASE_INSENSITIVE } from "./canonical-utils.mjs";
import { findUndeclaredStaticDependencies } from "./skill-static-deps.mjs";

const MAKE_DECISION_ONLY_SKILLS = new Set(["talk-with-zhipeng", "grill-with-docs"]);
const FORMAL_STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const PORTABLE_WORKFLOW_KIND = "portable_workflow";

export function workflowDeclarations(packageRoot) {
  const root = fs.realpathSync(packageRoot);
  const configPath = path.join(root, "config/workflowhub.yaml");
  if (!fs.existsSync(configPath)) {
    // A released Skill Bundle intentionally contains no repository config. Its
    // portable workflow identity is still explicit and narrow; this is not a
    // scan of arbitrary workflow directories or a second discovery mechanism.
    const portablePath = "workflows/build-prd/SKILL.md";
    return Object.freeze({
      formal: Object.freeze(FORMAL_STAGES.map((stage) => Object.freeze({ stage, path: `workflows/${stage}/SKILL.md` }))),
      portable: Object.freeze(fs.existsSync(path.join(root, portablePath))
        ? [{ component_id: "build-prd", workflow: "build-prd", kind: PORTABLE_WORKFLOW_KIND, path: portablePath }]
        : []),
    });
  }
  const config = readYaml(configPath);
  const registry = Array.isArray(config?.registry) ? config.registry : [];
  const portable = registry.filter((entry) => entry?.kind === PORTABLE_WORKFLOW_KIND);
  return Object.freeze({
    formal: Object.freeze(FORMAL_STAGES.map((stage) => Object.freeze({ stage, path: `workflows/${stage}/SKILL.md` }))),
    portable: Object.freeze(portable.map((entry) => Object.freeze({ ...entry }))),
  });
}

// Findings disposition dialogue reuses spec-clarify in build-spec; Talk and Grill remain make-decision-only. This closure rule is the single enforcement point and does not create a second skill or public behavior.

// Keep YAML date scalars as strings while retaining YAML merge-key support for
// the catalog's project anchors. The default schema resolves merges but turns
// timestamps into Date objects, so normalize only those scalar values before
// applying the strict calendar contract below.
function normalizeYamlDates(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(normalizeYamlDates);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeYamlDates(item)]));
  return value;
}
function readYaml(file) { return normalizeYamlDates(yaml.load(fs.readFileSync(file, "utf8"))); }
function pushError(errors, message) { errors.push(message); }
function schemaValidator(root, name) {
  // The authoritative schema tree moved under runtime/ during the layout
  // migration.  Resolve it from the same bundle path used by runner-release
  // and fact-collector; never fall back to the now-empty legacy schemas/ dir.
  const schema = JSON.parse(fs.readFileSync(path.join(root, `runtime/schemas/${name}.schema.json`), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);
  return ajv.compile(schema);
}
function validateSchema(validate, value, label, errors) {
  if (!validate(value)) pushError(errors, `${label}: schema invalid: ${validate.errors.map(e => `${e.instancePath || "/"} ${e.message}`).join("; ")}`);
}

function isPortableRelativeLocator(value) {
  return typeof value === "string"
    && value.trim() !== ""
    && !value.startsWith("/")
    && !value.startsWith("\\")
    && !/^[A-Za-z]:/.test(value)
    && !value.split("/").includes("")
    && !value.split("/").some((segment) => segment === "." || segment === "..")
    && !value.includes("\\");
}

function isInside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

const PORTABLE_WORKFLOW_STEPS = Object.freeze([
  "load-parent-decision",
  "draft-outline-and-task-map",
  "confirm-map-and-conditional-design",
  "expand-single-prd",
  "confirm-final-displayed-draft",
  "report-facts-and-handoff",
]);
const PORTABLE_EVIDENCE_KINDS = new Set([
  "portable_workflow_package",
  "portable_workflow_dependencies",
  "portable_workflow_outcome",
  "parent_decision",
  "outline_and_task_map",
  "map_or_design_confirmation",
  "prd_draft_or_body",
  "final_displayed_draft_confirmation",
]);
const PORTABLE_STEP_CONTRACTS = Object.freeze([
  Object.freeze({
    entry_conditions: Object.freeze([
      Object.freeze({ kind: "portable_workflow_package", uri_or_path: "workflows/build-prd/SKILL.md" }),
      Object.freeze({ kind: "portable_workflow_dependencies", uri_or_path: "workflows/build-prd/skill-deps.yaml" }),
      Object.freeze({ kind: "parent_decision", uri_or_path: "decision-log.md" }),
    ]),
    completion_evidence: Object.freeze([
      Object.freeze({ kind: "parent_decision", uri_or_path: "decision-log.md" }),
      Object.freeze({ kind: "portable_workflow_outcome", uri_or_path: "quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json" }),
    ]),
  }),
  Object.freeze({
    entry_conditions: Object.freeze([
      Object.freeze({ kind: "parent_decision", uri_or_path: "step://1" }),
    ]),
    completion_evidence: Object.freeze([
      Object.freeze({ kind: "outline_and_task_map", uri_or_path: "workflow://build-prd/outline" }),
      Object.freeze({ kind: "portable_workflow_outcome", uri_or_path: "quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json" }),
    ]),
  }),
  Object.freeze({
    entry_conditions: Object.freeze([
      Object.freeze({ kind: "outline_and_task_map", uri_or_path: "step://2" }),
    ]),
    completion_evidence: Object.freeze([
      Object.freeze({ kind: "map_or_design_confirmation", uri_or_path: "workflow://build-prd/confirmation" }),
      Object.freeze({ kind: "portable_workflow_outcome", uri_or_path: "quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json" }),
    ]),
  }),
  Object.freeze({
    entry_conditions: Object.freeze([
      Object.freeze({ kind: "map_or_design_confirmation", uri_or_path: "step://3" }),
    ]),
    completion_evidence: Object.freeze([
      Object.freeze({ kind: "prd_draft_or_body", uri_or_path: "workflow://build-prd/prd" }),
      Object.freeze({ kind: "portable_workflow_outcome", uri_or_path: "quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json" }),
    ]),
  }),
  Object.freeze({
    entry_conditions: Object.freeze([
      Object.freeze({ kind: "prd_draft_or_body", uri_or_path: "step://4" }),
    ]),
    completion_evidence: Object.freeze([
      Object.freeze({ kind: "final_displayed_draft_confirmation", uri_or_path: "workflow://build-prd/final-confirmation" }),
      Object.freeze({ kind: "portable_workflow_outcome", uri_or_path: "quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json" }),
    ]),
  }),
  Object.freeze({
    entry_conditions: Object.freeze([
      Object.freeze({ kind: "final_displayed_draft_confirmation", uri_or_path: "step://5" }),
    ]),
    completion_evidence: Object.freeze([
      Object.freeze({ kind: "portable_workflow_outcome", uri_or_path: "quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json" }),
    ]),
  }),
]);
const PORTABLE_DEPENDENCY_IDENTITY = Object.freeze(["task_id", "stage", "material_revision", "snapshot_tree"]);
const PORTABLE_DEPENDENCY_INPUTS = Object.freeze(["decision", "required_sources", "map_confirmation", "design_facts"]);

function validateEvidenceRefs(refs, expected, label, errors) {
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }
  if (refs.length !== expected.length) {
    errors.push(`${label} must contain exactly ${expected.length} evidence refs`);
  }
  for (const [index, ref] of refs.entries()) {
    if (!ref || typeof ref !== "object" || Array.isArray(ref)
        || typeof ref.kind !== "string" || ref.kind.trim() === ""
        || typeof ref.uri_or_path !== "string" || ref.uri_or_path.trim() === "") {
      errors.push(`${label}[${index}] must contain non-empty kind and uri_or_path`);
      continue;
    }
    if (!PORTABLE_EVIDENCE_KINDS.has(ref.kind)) {
      errors.push(`${label}[${index}] evidence kind is not allowed: ${ref.kind}`);
    }
    const expectedRef = expected[index];
    if (expectedRef && (ref.kind !== expectedRef.kind || ref.uri_or_path !== expectedRef.uri_or_path)) {
      errors.push(`${label}[${index}] evidence reference is invalid`);
    }
  }
}

/**
 * Portable workflow contract. This is deliberately not the formal stage
 * step-manifest contract: build-prd is discoverable/packageable, never a sixth
 * stage and never accepted by runtime/stage/step-manifest.mjs.
 */
export function validatePortableWorkflowSteps(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["portable workflow steps must be an object"] };
  }
  if (manifest.schema_version !== "2.0.0") errors.push("portable workflow steps schema_version must be 2.0.0");
  if (manifest.stage_slug !== "build-prd") errors.push("portable workflow steps stage_slug must be build-prd");
  if (!Array.isArray(manifest.steps) || manifest.steps.length !== PORTABLE_WORKFLOW_STEPS.length) {
    errors.push(`portable workflow steps must contain exactly ${PORTABLE_WORKFLOW_STEPS.length} steps`);
    return { ok: false, errors };
  }
  const ids = new Set();
  const orders = new Set();
  for (const [index, step] of manifest.steps.entries()) {
    const expectedId = index + 1;
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      errors.push(`portable step ${expectedId} must be an object`);
      continue;
    }
    if (step.step_id !== expectedId) errors.push(`portable step ${expectedId} step_id must be ${expectedId}`);
    if (step.step_slug !== PORTABLE_WORKFLOW_STEPS[index]) errors.push(`portable step ${expectedId} step_slug is invalid`);
    if (step.order !== expectedId) errors.push(`portable step ${expectedId} order must be ${expectedId}`);
    if (ids.has(step.step_id)) errors.push(`portable step ${expectedId} has duplicate step_id`);
    if (orders.has(step.order)) errors.push(`portable step ${expectedId} has duplicate order`);
    ids.add(step.step_id);
    orders.add(step.order);
    const expectedContract = PORTABLE_STEP_CONTRACTS[index];
    const entryConditions = Array.isArray(step.entry_conditions) ? step.entry_conditions : [];
    validateEvidenceRefs(entryConditions, expectedContract.entry_conditions, `portable step ${expectedId} entry_conditions`, errors);
    validateEvidenceRefs(step.completion_evidence, expectedContract.completion_evidence, `portable step ${expectedId} completion_evidence`, errors);
    if (typeof step.observable_result !== "string" || step.observable_result.trim() === "") {
      errors.push(`portable step ${expectedId} observable_result must be non-empty`);
    }
    if (!Array.isArray(step.depends_on)) {
      errors.push(`portable step ${expectedId} depends_on must be an array`);
      continue;
    }
    for (const dependency of step.depends_on) {
      if (!Number.isInteger(dependency) || dependency < 1 || dependency >= expectedId) {
        errors.push(`portable step ${expectedId} depends_on must reference an earlier step`);
        continue;
      }
      const predecessor = manifest.steps[dependency - 1];
      const predecessorEvidence = Array.isArray(predecessor?.completion_evidence) ? predecessor.completion_evidence : [];
      const predecessorKinds = new Set(predecessorEvidence.map((ref) => ref?.kind));
      const predecessorRef = entryConditions.find((ref) => ref?.uri_or_path === `step://${dependency}`);
      if (!predecessorRef) {
        errors.push(`portable step ${expectedId} is missing entry evidence for step://${dependency}`);
      } else if (!predecessorKinds.has(predecessorRef.kind)) {
        errors.push(`portable step ${expectedId} entry evidence kind does not match step://${dependency}`);
      }
    }
  }
  const expectedDependencies = [[], [1], [2], [3], [4], [5]];
  for (const [index, expected] of expectedDependencies.entries()) {
    if (JSON.stringify(manifest.steps[index]?.depends_on ?? null) !== JSON.stringify(expected)) {
      errors.push(`portable step ${index + 1} dependency DAG is invalid`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Portable dependency metadata is intentionally separate from
 * stage-skill-deps.schema.json. The latter requires formal stage ownership and
 * formal stage consumers, which a portable workflow must never impersonate.
 */
export function validatePortableWorkflowDependencies(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["portable workflow dependencies must be an object"] };
  }
  if (manifest.stage !== "build-prd") errors.push("portable workflow dependency stage must be build-prd");
  if (!Array.isArray(manifest.skills) || manifest.skills.length === 0) {
    errors.push("portable workflow dependencies must declare at least one skill");
  }
  for (const [index, dep] of (Array.isArray(manifest.skills) ? manifest.skills : []).entries()) {
    const label = `portable dependency ${index + 1}`;
    if (!dep || typeof dep !== "object" || Array.isArray(dep)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    for (const field of ["name", "path", "execution", "trigger", "bundle", "owner", "consumer"]) {
      if (!(field in dep)) errors.push(`${label} missing ${field}`);
    }
    if (dep.owner !== "portable_workflow") errors.push(`${label} owner must be portable_workflow`);
    if (!isPortableRelativeLocator(dep.path) || !/^skills\/[^/]+\/SKILL\.md$/.test(dep.path ?? "")) {
      errors.push(`${label} path must point to a portable skill SKILL.md`);
    }
    if (!isPortableRelativeLocator(dep.bundle) || !/^skills\/[^/]+\/skill-bundle\.json$/.test(dep.bundle ?? "")) {
      errors.push(`${label} bundle must point to a portable skill bundle`);
    }
    if (!["inline", "independent"].includes(dep.execution)) errors.push(`${label} execution is invalid`);
    if (typeof dep.trigger !== "string" || dep.trigger.trim() === "") errors.push(`${label} trigger is invalid`);
    const consumer = dep.consumer;
    if (!consumer || typeof consumer !== "object" || Array.isArray(consumer)) {
      errors.push(`${label} consumer must be an object`);
      continue;
    }
    if (consumer.target !== "build-prd#orchestrate") errors.push(`${label} consumer target must be build-prd#orchestrate`);
    if (JSON.stringify(consumer.inputs) !== JSON.stringify(PORTABLE_DEPENDENCY_INPUTS)) {
      errors.push(`${label} consumer inputs are invalid`);
    }
    if (JSON.stringify(consumer.identity) !== JSON.stringify(PORTABLE_DEPENDENCY_IDENTITY)) {
      errors.push(`${label} consumer identity is invalid`);
    }
    if (consumer.result !== "prd_draft_or_body") errors.push(`${label} consumer result is invalid`);
  }
  for (const group of ["runtime_capabilities", "external_capabilities"]) {
    for (const capability of (Array.isArray(manifest[group]) ? manifest[group] : [])) {
      if (capability?.absence_semantics !== "diagnostic") {
        errors.push(`portable ${group} capabilities must use diagnostic absence semantics`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export function assertWorkflowDirectory(packageRoot, workflow) {
  const root = fs.realpathSync(packageRoot);
  if (!/^[a-z][a-z0-9-]*$/.test(workflow ?? "")) throw new Error(`workflow name is invalid: ${workflow}`);
  const workflowsRoot = path.join(root, "workflows");
  const workflowsStat = fs.lstatSync(workflowsRoot);
  if (workflowsStat.isSymbolicLink() || !workflowsStat.isDirectory()) throw new Error("workflows root must be a real directory");
  const candidate = path.join(workflowsRoot, workflow);
  const stat = fs.lstatSync(candidate);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`workflow directory must be a real directory: ${workflow}`);
  const resolved = fs.realpathSync(candidate);
  if (!isInside(root, resolved)) throw new Error(`workflow directory escapes package root: ${workflow}`);
  return resolved;
}

function workflowFileError(root, workflow, file) {
  const locator = `workflows/${workflow}/${file}`;
  try {
    const directory = assertWorkflowDirectory(root, workflow);
    const candidate = path.join(directory, file);
    const stat = fs.lstatSync(candidate);
    if (stat.isSymbolicLink() || !stat.isFile()) return `workflow source must be a regular file: ${locator}`;
    const resolved = fs.realpathSync(candidate);
    if (!isInside(root, resolved) || !isInside(directory, resolved)) return `workflow source escapes package root: ${locator}`;
    return null;
  } catch (error) {
    if (error?.code === "ENOENT") return `workflow source missing: ${locator}`;
    return `workflow source is unavailable: ${locator} (${error?.code ?? "invalid"})`;
  }
}

export function parseStrictReviewDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (!Number.isSafeInteger(year) || !Number.isSafeInteger(month) || !Number.isSafeInteger(day)
      || month < 1 || month > 12 || day < 1 || day > daysInMonth) return null;
  // Date.UTC interprets years from 0 through 99 as 1900 through 1999.
  // Set the full year on a Date instance instead so the four-digit calendar
  // value remains the value being compared.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export function checkReleaseClosure({ skillRelease, runnerRelease } = {}) {
  const errors = [];
  if (skillRelease?.skill !== "workflowhub") errors.push("skill release identity is invalid");
  if (runnerRelease?.release !== "workflowhub-runner") errors.push("runner release identity is invalid");
  if (!Array.isArray(skillRelease?.files) || skillRelease.files.length === 0) errors.push("skill release closure is empty");
  if (!Array.isArray(runnerRelease?.files) || runnerRelease.files.length === 0) errors.push("runner release closure is empty");
  const pathsFor = (release, label) => {
    const paths = [];
    if (!Array.isArray(release?.files)) {
      errors.push(`${label} release files must be an array`);
      return paths;
    }
    for (const entry of release?.files ?? []) {
      if (!entry || typeof entry.path !== "string" || entry.path.trim() === ""
          || !isPortableRelativeLocator(entry.path)) {
        errors.push(`${label} release file entry is invalid`);
        continue;
      }
      if (typeof entry.sha256 !== "string" || !SHA256_HEX_CASE_INSENSITIVE.test(entry.sha256)) {
        errors.push(`${label} release file sha256 is invalid: ${entry.path}`);
      }
      paths.push(entry.path);
    }
    if (new Set(paths).size !== paths.length) errors.push(`${label} release contains duplicate file paths`);
    return new Set(paths);
  };
  const skillFiles = pathsFor(skillRelease, "skill");
  const runnerFiles = pathsFor(runnerRelease, "runner");
  const hashFor = (release) => new Map((release?.files ?? [])
    .filter((entry) => entry && typeof entry.path === "string")
    .map((entry) => [entry.path, entry.sha256 ?? null]));
  const skillHashes = hashFor(skillRelease);
  const runnerHashes = hashFor(runnerRelease);
  for (const locator of [...skillFiles].filter((pathName) => runnerFiles.has(pathName))) {
    const skillHash = skillHashes.get(locator);
    const runnerHash = runnerHashes.get(locator);
    if (skillHash !== null && runnerHash !== null && skillHash !== runnerHash) {
      errors.push(`shared release file hash mismatch: ${locator}`);
    }
  }
  for (const locator of skillFiles) {
    if (/(^|\/)(?:node_modules|tests?|specs?|evidence)(?:\/|$)/.test(locator)) {
      errors.push(`skill release contains forbidden path: ${locator}`);
    }
  }
  for (const locator of runnerFiles) {
    if (locator.startsWith("node_modules/")) errors.push(`runner release contains installed dependency: ${locator}`);
  }
  return { ok: errors.length === 0, errors };
}

function skillNameFromLocator(locator) {
  if (typeof locator !== "string" || locator.trim() === "") return null;
  const parts = locator.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}

function validateDeclaredDependency({ root, workflow, dep, byName, validateBundle, errors, declared }) {
  const pathName = dep.path?.split("/").at(-2);
  if (pathName !== dep.name) pushError(errors, `${workflow}: dependency name/path mismatch for ${dep.name}`);
  declared.add(dep.name);
  if (dep.owner !== "stage") pushError(errors, `${workflow}: workflow manifest skill must declare owner=stage: ${dep.name}`);
  const catalogEntry = byName.get(dep.name);
  if (!catalogEntry) pushError(errors, `${workflow}: undeclared catalog skill ${dep.name}`);
  if (catalogEntry?.path !== dep.path) pushError(errors, `${workflow}: catalog path mismatch for ${dep.name}`);
  if (typeof dep.trigger !== "string" || dep.trigger.length === 0) pushError(errors, `${workflow}: invalid trigger for ${dep.name}`);
  if (!["inline", "independent"].includes(dep.execution)) pushError(errors, `${workflow}: invalid execution mode for ${dep.name}`);
  try {
    resolveLocalSkill(root, dep.path);
    const checked = validateSkillBundle(root, dep.bundle, dep.path);
    validateSchema(validateBundle, checked.bundle, `${workflow}/${dep.name}: bundle`, errors);
  } catch (error) { pushError(errors, `${workflow}/${dep.name}: ${error.message}`); }
}

function validatePortableDeclaredDependency({ root, workflow, dep, byName, validateBundle, errors, declared }) {
  declared.add(dep.name);
  const pathName = dep.path?.split("/").at(-2);
  if (pathName !== dep.name) pushError(errors, `${workflow}: portable dependency name/path mismatch for ${dep.name}`);
  if (dep.owner !== "portable_workflow") pushError(errors, `${workflow}: portable dependency owner must be portable_workflow: ${dep.name}`);
  const catalogEntry = byName.get(dep.name);
  if (!catalogEntry) pushError(errors, `${workflow}: undeclared catalog skill ${dep.name}`);
  if (catalogEntry?.path !== dep.path) pushError(errors, `${workflow}: catalog path mismatch for ${dep.name}`);
  try {
    resolveLocalSkill(root, dep.path);
    const checked = validateSkillBundle(root, dep.bundle, dep.path);
    validateSchema(validateBundle, checked.bundle, `${workflow}/${dep.name}: bundle`, errors);
  } catch (error) { pushError(errors, `${workflow}/${dep.name}: ${error.message}`); }
}

export function coreSkillNamesFromCatalog(catalog) {
  const entries = Array.isArray(catalog?.skills) ? catalog.skills : [];
  const byName = new Map(entries.filter(entry => typeof entry?.name === "string").map(entry => [entry.name, entry]));
  const core = new Set(entries
    .filter(entry => Array.isArray(entry?.used_by_stages) && entry.used_by_stages.length > 0)
    .map(entry => entry.name));

  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...core]) {
      for (const locator of byName.get(name)?.dependency_closure ?? []) {
        const dependencyName = skillNameFromLocator(locator);
        if (dependencyName && byName.has(dependencyName) && !core.has(dependencyName)) {
          core.add(dependencyName);
          changed = true;
        }
      }
    }
  }
  return [...core].sort();
}

export function buildMetricsEnabledReport({ catalog, coreSkillNames } = {}) {
  const entries = Array.isArray(catalog?.skills) ? catalog.skills : [];
  const byName = new Map(entries.filter(entry => typeof entry?.name === "string").map(entry => [entry.name, entry]));
  const names = (coreSkillNames ?? coreSkillNamesFromCatalog(catalog))
    .filter(name => typeof name === "string" && name.trim() !== "")
    .filter((name, index, all) => all.indexOf(name) === index)
    .sort();
  const disabledCoreSkills = names.filter(name => byName.get(name)?.metrics_enabled === false);
  const missingCoreSkills = names.filter(name => {
    const value = byName.get(name)?.metrics_enabled;
    return value !== true && value !== false;
  });
  return {
    core_skills: names,
    disabled_core_skills: disabledCoreSkills,
    missing_core_skills: missingCoreSkills,
    ok: disabledCoreSkills.length === 0 && missingCoreSkills.length === 0,
  };
}

export function checkSkillClosure(packageRoot) {
  const root = fs.realpathSync(packageRoot);
  const errors = [];
  const validateCatalog = schemaValidator(root, "skill-catalog");
  const validateManifest = schemaValidator(root, "stage-skill-deps");
  const validateBundle = schemaValidator(root, "skill-bundle");
  const validateReviewBundle = schemaValidator(root, "review-bundle");
  const catalogPath = path.join(root, "skills/catalog.yaml");
  let catalog;
  try { catalog = readYaml(catalogPath); } catch (error) { return { ok: false, errors: [`catalog: ${error.message}`] }; }
  validateSchema(validateCatalog, catalog, "catalog", errors);
  const entries = catalog?.skills;
  if (!Array.isArray(entries)) return { ok: false, errors: ["catalog: skills must be an array"] };
  const byName = new Map();
  for (const entry of entries) {
    if (!entry?.name || byName.has(entry.name)) { pushError(errors, `catalog duplicate or empty skill id: ${entry?.name}`); continue; }
    byName.set(entry.name, entry);
  }

  const config = readYaml(path.join(root, "config/workflowhub.yaml"));
  const registry = Array.isArray(config.registry) ? config.registry : [];
  const configuredStages = registry.flatMap(entry => {
    if (entry?.kind === PORTABLE_WORKFLOW_KIND) return [];
    const match = entry.path?.match(/^workflows\/([^/]+)\/SKILL\.md$/);
    return match ? [match[1]] : [];
  }).sort();
  const workflowRoot = path.join(root, "workflows");
  let workflowRootEntries = [];
  try {
    const workflowRootStat = fs.lstatSync(workflowRoot);
    if (workflowRootStat.isSymbolicLink() || !workflowRootStat.isDirectory()) {
      pushError(errors, "workflows root must be a real directory");
    } else {
      workflowRootEntries = fs.readdirSync(workflowRoot, { withFileTypes: true });
    }
  } catch (error) {
    pushError(errors, `workflows root is unavailable: ${error.message}`);
  }
  const diskWorkflowEntries = workflowRootEntries.filter(entry => entry.isDirectory() && !entry.name.startsWith("_"));
  const diskWorkflows = diskWorkflowEntries.map(entry => entry.name).sort();
  for (const entry of diskWorkflowEntries) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.name)) {
      pushError(errors, `workflow name is invalid: ${entry.name}`);
    }
  }
  const portableEntries = registry.filter(entry => entry?.kind === PORTABLE_WORKFLOW_KIND);
  const portableWorkflows = new Set();
  for (const entry of portableEntries) {
    if (portableWorkflows.has(entry?.workflow)) pushError(errors, `duplicate portable workflow registry entry: ${entry?.workflow ?? "unknown"}`);
    portableWorkflows.add(entry?.workflow);
    if (entry?.component_id !== entry?.workflow) {
      pushError(errors, `portable workflow component/workflow mismatch: ${entry?.component_id ?? "unknown"} -> ${entry?.workflow ?? "unknown"}`);
    }
  }
  const formalWorkflowNames = new Set(FORMAL_STAGES);
  const formalSurface = registry.some(entry => entry?.kind === PORTABLE_WORKFLOW_KIND
    || (typeof entry?.component_id === "string" && typeof entry?.workflow === "string"));
  const hasCanonicalFormalSurface = FORMAL_STAGES.every((stage) => diskWorkflows.includes(stage));
  if (formalSurface || hasCanonicalFormalSurface) {
    for (const entry of registry) {
      if (entry?.kind === PORTABLE_WORKFLOW_KIND) continue;
      const match = entry?.path?.match(/^workflows\/([^/]+)\/SKILL\.md$/);
      if (match && typeof entry.component_id === "string" && entry.component_id !== match[1]) {
        pushError(errors, `registry component/path mismatch: ${entry.component_id} -> ${entry.path}`);
      }
    }
    for (const stage of configuredStages.filter(stage => !formalWorkflowNames.has(stage))) pushError(errors, `configured workflow is not a formal stage: ${stage}`);
    for (const stage of FORMAL_STAGES.filter(stage => !configuredStages.includes(stage))) pushError(errors, `formal stage missing from config registry: ${stage}`);
    if (new Set(configuredStages).size !== configuredStages.length) pushError(errors, "formal stage registry contains duplicate entries");
  }
  for (const entry of portableEntries) {
    const workflow = entry.workflow;
    const expectedPath = `workflows/${workflow}/SKILL.md`;
    if (typeof workflow !== "string" || workflow.trim() === "" || entry.path !== expectedPath
        || !isPortableRelativeLocator(entry.path)) {
      pushError(errors, `portable workflow registry entry is invalid: ${workflow ?? "unknown"}`);
      continue;
    }
    const portableFileErrors = [];
    for (const file of ["SKILL.md", "skill-deps.yaml", "steps.json"]) {
      const fileError = workflowFileError(root, workflow, file);
      if (!fileError) continue;
      if (fileError.startsWith("workflow source missing:")) portableFileErrors.push(`portable workflow missing ${workflow}/${file}`);
      else portableFileErrors.push(fileError);
    }
    for (const fileError of portableFileErrors) pushError(errors, fileError);
    if (portableFileErrors.length > 0) continue;
    try {
      const directory = assertWorkflowDirectory(root, workflow);
      const steps = JSON.parse(fs.readFileSync(path.join(directory, "steps.json"), "utf8"));
      const stepResult = validatePortableWorkflowSteps(steps);
      for (const error of stepResult.errors) pushError(errors, `${workflow}: ${error}`);
      const dependencies = readYaml(path.join(directory, "skill-deps.yaml"));
      const dependencyResult = validatePortableWorkflowDependencies(dependencies);
      for (const error of dependencyResult.errors) pushError(errors, `${workflow}: ${error}`);
    } catch (error) {
      pushError(errors, `${workflow}: portable contract unavailable`);
    }
  }
  const diskStages = diskWorkflows.filter(stage => FORMAL_STAGES.includes(stage));
  const manifestWorkflows = hasCanonicalFormalSurface ? diskStages : diskWorkflows;
  if (formalSurface || hasCanonicalFormalSurface) {
    for (const stage of diskStages.filter(stage => !configuredStages.includes(stage))) pushError(errors, `disk stage missing from config registry: ${stage}`);
    for (const workflow of diskWorkflows.filter(name => !FORMAL_STAGES.includes(name))) {
      if (!portableEntries.some(entry => entry.workflow === workflow)) pushError(errors, `disk portable workflow missing from config registry: ${workflow}`);
    }
  } else {
    for (const workflow of diskWorkflows.filter(name => !configuredStages.includes(name))) {
      pushError(errors, `disk stage missing from config registry: ${workflow}`);
    }
    for (const workflow of configuredStages.filter(name => !diskWorkflows.includes(name))) {
      pushError(errors, `configured stage missing from disk: ${workflow}`);
    }
  }
  for (const entry of portableEntries) {
    if (entry.workflow && !diskWorkflows.includes(entry.workflow)) pushError(errors, `portable workflow missing from disk: ${entry.workflow}`);
  }

  const declared = new Set();
  for (const entry of portableEntries) {
    const workflow = entry.workflow;
    const manifestPath = path.join(root, `workflows/${workflow}/skill-deps.yaml`);
    if (!fs.existsSync(manifestPath)) continue;
    let manifest;
    try { manifest = readYaml(manifestPath); } catch (error) { pushError(errors, `${workflow}: invalid manifest: ${error.message}`); continue; }
    if (manifest.stage !== workflow) pushError(errors, `${workflow}: manifest stage is ${manifest.stage}`);
    const manifestNames = new Set((manifest.skills || []).map(dep => dep.name));
    if (manifestNames.size !== (manifest.skills || []).length) pushError(errors, `${workflow}: duplicate skill dependency`);
    if (portableEntries.some(entry => entry.workflow === workflow)) {
      const portableResult = validatePortableWorkflowDependencies(manifest);
      for (const error of portableResult.errors) pushError(errors, `${workflow}: ${error}`);
      for (const dep of manifest.skills || []) validatePortableDeclaredDependency({ root, workflow, dep, byName, validateBundle, errors, declared });
    } else {
      validateSchema(validateManifest, manifest, `${workflow}: manifest`, errors);
      for (const dep of manifest.skills || []) validateDeclaredDependency({ root, workflow, dep, byName, validateBundle, errors, declared });
    }
  }
  for (const stage of FORMAL_STAGES) {
    if (!configuredStages.includes(stage)) continue;
    const stageDirectoryError = workflowFileError(root, stage, "SKILL.md");
    if (stageDirectoryError) pushError(errors, stageDirectoryError.includes("ENOENT") ? `configured formal stage missing from disk: ${stage}` : stageDirectoryError);
  }
  for (const stage of manifestWorkflows) {
    const manifestPath = path.join(root, `workflows/${stage}/skill-deps.yaml`);
    if (!fs.existsSync(manifestPath)) { pushError(errors, `${stage}: missing skill-deps.yaml`); continue; }
    let manifest;
    try { manifest = readYaml(manifestPath); } catch (error) { pushError(errors, `${stage}: invalid manifest: ${error.message}`); continue; }
    validateSchema(validateManifest, manifest, `${stage}: manifest`, errors);
    if (manifest.stage !== stage) pushError(errors, `${stage}: manifest stage is ${manifest.stage}`);
    const manifestNames = new Set((manifest.skills || []).map(dep => dep.name));
    const reviewPlanNames = new Set();
    if (manifestNames.size !== (manifest.skills || []).length) pushError(errors, `${stage}: duplicate skill dependency`);
    for (const dep of manifest.skills || []) {
      const pathName = dep.path?.split("/").at(-2);
      if (pathName !== dep.name) pushError(errors, `${stage}: dependency name/path mismatch for ${dep.name}`);
      declared.add(dep.name);
      if (dep.owner !== "stage") pushError(errors, `${stage}: stage manifest skill must declare owner=stage: ${dep.name}`);
      if (stage !== "make-decision" && MAKE_DECISION_ONLY_SKILLS.has(dep.name)) {
        pushError(errors, `${stage}: ${dep.name} is owned exclusively by make-decision`);
      }
      const catalogEntry = byName.get(dep.name);
      if (!catalogEntry) pushError(errors, `${stage}: undeclared catalog skill ${dep.name}`);
      if (catalogEntry?.path !== dep.path) pushError(errors, `${stage}: catalog path mismatch for ${dep.name}`);
      if (typeof dep.trigger !== "string" || dep.trigger.length === 0) pushError(errors, `${stage}: invalid trigger for ${dep.name}`);
      if (!["inline", "independent"].includes(dep.execution)) pushError(errors, `${stage}: invalid execution mode for ${dep.name}`);
      try {
        resolveLocalSkill(root, dep.path);
        const checked = validateSkillBundle(root, dep.bundle, dep.path);
        validateSchema(validateBundle, checked.bundle, `${stage}/${dep.name}: bundle`, errors);
      } catch (error) { pushError(errors, `${stage}/${dep.name}: ${error.message}`); }
    }
    for (const [group, capabilities] of [
      ["runtime_capabilities", manifest.runtime_capabilities],
      ["external_capabilities", manifest.external_capabilities],
    ]) {
      for (const capability of capabilities || []) {
        if (capability.absence_semantics !== "diagnostic") {
          pushError(errors, `${stage}: ${group}/${capability.id} absence_semantics must be diagnostic`);
        }
      }
    }
    if (manifestNames.has("wh-review")) {
      const plan = JSON.parse(fs.readFileSync(path.join(root, "skills/wh-review/stage-skill-plan.json"), "utf8"));
      const stagePlan = plan.stages?.[stage];
      if (!stagePlan) pushError(errors, `${stage}: missing wh-review stage plan`);
      const variants = stagePlan?.tracks ? Object.values(stagePlan.tracks) : [stagePlan];
      for (const variant of variants.filter(Boolean)) {
        if (variant.review_mode !== "lens-only" || !["file_only", "always_embed"].includes(variant.delivery_mode)) {
          pushError(errors, `${stage}: wh-review stage plan must declare lens-only delivery`);
          continue;
        }
        if (variant.lens_owner !== "wh-review" || variant.lens_dispatch !== "delegated") {
          pushError(errors, `${stage}: wh-review stage plan must declare lens_owner=wh-review and lens_dispatch=delegated`);
        }
        const lensNames = [...(variant.required_skills || []), ...(variant.optional_skills || []).map(item => typeof item === "string" ? item : item.name)];
        for (const name of lensNames) reviewPlanNames.add(name);
      }
      for (const name of [...reviewPlanNames].filter(name => manifestNames.has(name))) {
        pushError(errors, `${stage}: delegated wh-review lens must not appear in stage manifest: ${name}`);
      }
      for (const name of reviewPlanNames) {
        declared.add(name);
        const catalogEntry = byName.get(name);
        if (!catalogEntry) {
          pushError(errors, `${stage}: wh-review lens missing from catalog: ${name}`);
          continue;
        }
        try {
          validateSkillBundle(root, `skills/${name}/skill-bundle.json`, catalogEntry.path);
          const reviewPath = `skills/${name}/review-bundle.json`;
          if (fs.existsSync(path.join(root, reviewPath))) validateReviewBundleProjection(root, reviewPath, catalogEntry.path);
        } catch (error) {
          pushError(errors, `${stage}: invalid wh-review lens ${name}: ${error.message}`);
        }
      }
    }
    const prompt = fs.readFileSync(path.join(root, `workflows/${stage}/SKILL.md`), "utf8");
    for (const line of prompt.split("\n")) {
      if (line.includes("原组件路径")) continue;
      for (const match of line.matchAll(/skills\/([a-z][a-z0-9-]*)\/SKILL\.md/g)) {
        if (!manifestNames.has(match[1])) pushError(errors, `${stage}: prompt references undeclared skill ${match[1]}`);
      }
    }
    // Prompts are shipped as portable bundle bytes. Reject every host-local
    // locator, independently of the platform that authored the prompt:
    // POSIX absolute paths, drive-letter paths, UNC paths, tilde expansion,
    // and the well-known user-local skill roots. Repository-relative
    // `skills/<name>/SKILL.md` references are checked against the manifest
    // above and remain valid.
    const forbiddenAbsolutePath = [
      /(?:^|[\s"'(=,:])\/(?!\/\/)\S+/,
      /(?:^|[\s"'(=,:])[A-Za-z]:[\\/]\S+/,
      /(?:^|[\s"'(=,:])\\\\\S+/,
      /(?:^|[\s"'(=,:])~[\\/]\S+/,
    ].some((pattern) => pattern.test(prompt));
    const forbiddenSkillLocator = /(?:^|[\s"'(=,:])(?:~[\\/])?(?:\.claude|\.codex)[\\/]skills(?:[\\/]|$)/i;
    if (forbiddenAbsolutePath || forbiddenSkillLocator.test(prompt)) {
      pushError(errors, `${stage}: forbidden external or user-local skill locator in prompt`);
    }
    if (/skills\s*\/\s*\$\{|skills\s*\+|(?:HOME|homedir|cwd)\s*[^\n]{0,40}skills/i.test(prompt)) {
      pushError(errors, `${stage}: dynamic or host-discovered skill locator is forbidden`);
    }
  }

  const diskNames = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, "skills", entry.name, "SKILL.md")))
    .map(entry => entry.name).sort();
  const runtimeEntries = entries.filter(entry => ["native", "adopted", "adapted"].includes(entry.status) && entry.path);
  const catalogNames = runtimeEntries.map(entry => entry.name).sort();
  for (const name of diskNames.filter(name => !catalogNames.includes(name))) pushError(errors, `disk skill missing from catalog: ${name}`);
  for (const name of catalogNames.filter(name => !diskNames.includes(name))) pushError(errors, `catalog runtime skill missing from disk: ${name}`);
  const catalogReviewedAt = parseStrictReviewDate(catalog.last_reviewed_at);
  if (catalogReviewedAt === null) {
    pushError(errors, "catalog: last_reviewed_at must be a valid YYYY-MM-DD date baseline");
  }
  for (const entry of runtimeEntries) {
    if (!declared.has(entry.name) && entry.standalone !== true) pushError(errors, `catalog orphan skill must set standalone: true: ${entry.name}`);
    try {
      const checked = validateSkillBundle(root, `skills/${entry.name}/skill-bundle.json`, entry.path);
      validateSchema(validateBundle, checked.bundle, `${entry.name}: bundle`, errors);
      if (entry.local_bundle_hash !== checked.bundleHash) pushError(errors, `${entry.name}: catalog local_bundle_hash does not match resolved bundle`);
      // The catalog date is a review baseline, not a lockstep timestamp. A
      // skill may be reviewed later than the baseline; forcing equality makes
      // legitimate per-entry provenance look stale and encourages date rollback.
      const entryReviewedAt = parseStrictReviewDate(entry.last_reviewed_at);
      if (entryReviewedAt === null || (catalogReviewedAt !== null && entryReviewedAt < catalogReviewedAt)) {
        pushError(errors, `${entry.name}: provenance review date must be on or after the catalog baseline`);
      }
      const catalogSources = (entry.upstream || []).filter(source => source.github_url);
      const bundleSources = checked.bundle.sources || [];
      for (const source of catalogSources) {
        const match = bundleSources.find(candidate => candidate.url === source.github_url && candidate.commit === source.commit && candidate.path === source.path);
        if (!match) pushError(errors, `${entry.name}: catalog source missing from bundle: ${source.github_url}@${source.commit}:${source.path}`);
        else if (match.license !== source.license) pushError(errors, `${entry.name}: catalog/bundle source license mismatch for ${source.github_url}`);
      }
      for (const source of bundleSources.filter(source => source.url)) {
        const match = catalogSources.find(candidate => candidate.github_url === source.url && candidate.commit === source.commit && candidate.path === source.path);
        if (!match) pushError(errors, `${entry.name}: bundle source missing from catalog: ${source.url}@${source.commit}:${source.path}`);
      }
      const catalogLocalSources = (entry.upstream || []).filter(source => source.kind === "user-provided-local-source");
      const bundleLocalSources = bundleSources.filter(source => source.kind === "user-provided-local-source");
      if (JSON.stringify(catalogLocalSources) !== JSON.stringify(bundleLocalSources)) pushError(errors, `${entry.name}: local source authorization/snapshot differs between catalog and bundle`);
      for (const source of catalogLocalSources) if (source.snapshot_sha256 !== checked.bundleHash) pushError(errors, `${entry.name}: local source snapshot_sha256 must equal resolved bundle hash`);
      for (const missing of findUndeclaredStaticDependencies({ skillDir: path.join(root, "skills", entry.name), fileEntries: checked.fileEntries })) {
        pushError(errors, `${entry.name}: ${missing.source} references ${missing.locator}: ${missing.reason}`);
      }
      const reviewPath = `skills/${entry.name}/review-bundle.json`;
      if (fs.existsSync(path.join(root, reviewPath))) {
        const review = validateReviewBundleProjection(root, reviewPath, entry.path);
        validateSchema(validateReviewBundle, review.projection, `${entry.name}: review bundle`, errors);
      }
    } catch (error) { pushError(errors, `${entry.name}: ${error.message}`); }
  }
  const registryText = fs.readFileSync(path.join(root, "skills/reuse-registry.md"), "utf8");
  const noticeText = fs.readFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const entry of [...entries, ...(catalog.capability_decisions || [])]) {
    if (!registryText.includes(`\`${entry.name}\``) && !registryText.includes(`| ${entry.name} |`)) {
      pushError(errors, `registry projection missing catalog entry: ${entry.name}`);
    }
    for (const source of entry.upstream || []) {
      if (source.github_url) {
        const repository = source.github_url.replace(/^https:\/\/github\.com\//, "");
        if (!noticeText.toLowerCase().includes(repository.toLowerCase())) pushError(errors, `THIRD_PARTY_NOTICES missing upstream source: ${repository}`);
        if (!noticeText.includes(source.license)) pushError(errors, `THIRD_PARTY_NOTICES missing license ${source.license} for ${entry.name}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export function checkSkillClosureReport(packageRoot) {
  const result = checkSkillClosure(packageRoot);
  let metricsEnabledReport;
  try {
    const root = fs.realpathSync(packageRoot);
    const catalog = readYaml(path.join(root, "skills/catalog.yaml"));
    metricsEnabledReport = buildMetricsEnabledReport({ catalog });
  } catch (error) {
    metricsEnabledReport = {
      core_skills: [],
      disabled_core_skills: [],
      missing_core_skills: [],
      ok: false,
      error: error.message,
    };
  }
  return { ...result, metrics_enabled_report: metricsEnabledReport };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // This module now lives two levels below the package root.  Keep the CLI
  // default rooted at the installed/source package, otherwise it resolves
  // `runtime/runtime/schemas` and cannot validate a clean Runner checkout.
  const root = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const result = checkSkillClosureReport(root);
  if (!result.ok) {
    console.error(result.errors.map(error => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else console.log(JSON.stringify(result, null, 2));
}
