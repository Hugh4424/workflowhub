import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import { resolveLocalSkill, validateReviewBundleProjection, validateSkillBundle } from "./local-skill-resolver.mjs";
import { findUndeclaredStaticDependencies } from "./skill-static-deps.mjs";

function readYaml(file) { return yaml.load(fs.readFileSync(file, "utf8")); }
function pushError(errors, message) { errors.push(message); }
function schemaValidator(root, name) {
  const schema = JSON.parse(fs.readFileSync(path.join(root, `schemas/${name}.schema.json`), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);
  return ajv.compile(schema);
}
function validateSchema(validate, value, label, errors) {
  if (!validate(value)) pushError(errors, `${label}: schema invalid: ${validate.errors.map(e => `${e.instancePath || "/"} ${e.message}`).join("; ")}`);
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
    if (manifestNames.size !== (manifest.skills || []).length) pushError(errors, `${stage}: duplicate skill dependency`);
    for (const dep of manifest.skills || []) {
      const pathName = dep.path?.split("/").at(-2);
      if (pathName !== dep.name) pushError(errors, `${stage}: dependency name/path mismatch for ${dep.name}`);
      declared.add(dep.name);
      const catalogEntry = byName.get(dep.name);
      if (!catalogEntry) pushError(errors, `${stage}: undeclared catalog skill ${dep.name}`);
      if (catalogEntry?.path !== dep.path) pushError(errors, `${stage}: catalog path mismatch for ${dep.name}`);
      if (!dep.trigger || !["always", "conditional"].includes(dep.invocation)) pushError(errors, `${stage}: invalid invocation contract for ${dep.name}`);
      if (!["inline", "independent"].includes(dep.execution)) pushError(errors, `${stage}: invalid execution mode for ${dep.name}`);
      try {
        resolveLocalSkill(root, dep.path);
        const checked = validateSkillBundle(root, dep.bundle, dep.path);
        validateSchema(validateBundle, checked.bundle, `${stage}/${dep.name}: bundle`, errors);
      } catch (error) { pushError(errors, `${stage}/${dep.name}: ${error.message}`); }
    }
    if (manifestNames.has("wh-review")) {
      const plan = JSON.parse(fs.readFileSync(path.join(root, "skills/wh-review/stage-skill-plan.json"), "utf8"));
      const stagePlan = plan.stages?.[stage];
      if (!stagePlan) pushError(errors, `${stage}: missing wh-review stage plan`);
      const variants = stagePlan?.tracks ? Object.values(stagePlan.tracks) : [stagePlan];
      for (const variant of variants.filter(Boolean)) {
        const lensNames = [...(variant.required_skills || []), ...(variant.optional_skills || []).map(item => typeof item === "string" ? item : item.name)];
        for (const name of lensNames) if (!manifestNames.has(name)) pushError(errors, `${stage}: wh-review lens missing from manifest: ${name}`);
      }
    }
    const prompt = fs.readFileSync(path.join(root, `workflows/${stage}/SKILL.md`), "utf8");
    for (const line of prompt.split("\n")) {
      if (line.includes("原组件路径")) continue;
      for (const match of line.matchAll(/skills\/([a-z][a-z0-9-]*)\/SKILL\.md/g)) {
        if (!manifestNames.has(match[1])) pushError(errors, `${stage}: prompt references undeclared skill ${match[1]}`);
      }
    }
    const formerHostRepo = new RegExp(`multica-${"agenthub"}`);
    if (/\/Users\/[^\n]*(?:SKILL|skill|debate|gstack|superpowers)|\.claude\/skills|\.codex\/skills/.test(prompt) || formerHostRepo.test(prompt)) {
      pushError(errors, `${stage}: forbidden external or user-local skill locator in prompt`);
    }
  }

  const diskNames = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, "skills", entry.name, "SKILL.md")))
    .map(entry => entry.name).sort();
  const runtimeEntries = entries.filter(entry => ["native", "adopted", "adapted"].includes(entry.status) && entry.path);
  const catalogNames = runtimeEntries.map(entry => entry.name).sort();
  for (const name of diskNames.filter(name => !catalogNames.includes(name))) pushError(errors, `disk skill missing from catalog: ${name}`);
  for (const name of catalogNames.filter(name => !diskNames.includes(name))) pushError(errors, `catalog runtime skill missing from disk: ${name}`);
  for (const entry of runtimeEntries) {
    if (!declared.has(entry.name) && entry.standalone !== true) pushError(errors, `catalog orphan skill must set standalone: true: ${entry.name}`);
    try {
      const checked = validateSkillBundle(root, `skills/${entry.name}/skill-bundle.json`, entry.path);
      validateSchema(validateBundle, checked.bundle, `${entry.name}: bundle`, errors);
      if (entry.local_bundle_hash !== checked.bundleHash) pushError(errors, `${entry.name}: catalog local_bundle_hash does not match resolved bundle`);
      if (entry.last_reviewed_at !== catalog.last_reviewed_at) pushError(errors, `${entry.name}: provenance review date must match catalog review date after bundle changes`);
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = checkSkillClosure(root);
  if (!result.ok) {
    console.error(result.errors.map(error => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else console.log("skill closure: ok");
}
