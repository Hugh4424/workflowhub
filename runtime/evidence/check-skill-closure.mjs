import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import { resolveLocalSkill, validateReviewBundleProjection, validateSkillBundle } from "../adapters/local-skill-resolver.mjs";
import { findUndeclaredStaticDependencies } from "./skill-static-deps.mjs";

const MAKE_DECISION_ONLY_SKILLS = new Set(["talk-with-zhipeng", "grill-with-docs"]);

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
      if (typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(entry.sha256)) {
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
  const configuredStages = (config.registry || []).flatMap(entry => {
    const match = entry.path?.match(/^workflows\/([^/]+)\/SKILL\.md$/);
    return match ? [match[1]] : [];
  }).sort();
  const diskStages = fs.readdirSync(path.join(root, "workflows"), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith("_") && fs.existsSync(path.join(root, "workflows", entry.name, "SKILL.md")))
    .map(entry => entry.name).sort();
  for (const stage of configuredStages.filter(stage => !diskStages.includes(stage))) pushError(errors, `configured stage missing from disk: ${stage}`);
  for (const stage of diskStages.filter(stage => !configuredStages.includes(stage))) pushError(errors, `disk stage missing from config registry: ${stage}`);

  const declared = new Set();
  for (const stage of diskStages) {
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
