import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import { createSkillBundleContract } from "./runner-contract.mjs";

const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const FORBIDDEN = /(?:^|\/)(?:node_modules|tests?|__tests__|specs?|evidence|archive|history|historical)(?:\/|$)|(?:^|\/)[^/]*\.test\.[^/]+$/;

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function assertRoot(candidate, label) {
  if (!path.isAbsolute(candidate)) throw new TypeError(`${label} must be absolute`);
  return fs.realpathSync(candidate);
}

function assertLocator(locator) {
  if (!locator || path.isAbsolute(locator) || locator.split(/[\\/]/).includes("..")) {
    throw new Error(`release locator must be contained and relative: ${locator}`);
  }
  if (FORBIDDEN.test(locator)) throw new Error(`skill bundle contains forbidden path: ${locator}`);
}

function addSkillClosure(root, name, locators, visited) {
  if (visited.has(name)) return;
  visited.add(name);
  const base = `skills/${name}`;
  const bundleLocator = `${base}/skill-bundle.json`;
  const bundle = JSON.parse(fs.readFileSync(path.join(root, bundleLocator), "utf8"));
  locators.add(bundleLocator);
  for (const entry of bundle.files ?? []) {
    const locator = path.posix.join(base, typeof entry === "string" ? entry : entry.path);
    if (!FORBIDDEN.test(locator)) locators.add(locator);
  }
  if (name !== "wh-review") return;
  const plan = JSON.parse(fs.readFileSync(path.join(root, base, "stage-skill-plan.json"), "utf8"));
  for (const definition of Object.values(plan.stages ?? {})) {
    const variants = definition.tracks ? Object.values(definition.tracks) : [definition];
    for (const variant of variants) {
      for (const lens of [
        ...(variant.required_skills ?? []),
        ...(variant.optional_skills ?? []).map((entry) => typeof entry === "string" ? entry : entry.name),
      ]) addSkillClosure(root, lens, locators, visited);
    }
  }
}

function addStaticImportClosure(root, locators) {
  const queue = [...locators];
  const imports = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while (queue.length) {
    const locator = queue.pop();
    if (!/\.(?:mjs|js|cjs)$/.test(locator)) continue;
    const content = fs.readFileSync(path.join(root, locator), "utf8");
    for (const match of content.matchAll(imports)) {
      const specifier = match[1] ?? match[2];
      if (!specifier?.startsWith(".")) continue;
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(locator), specifier));
      const candidates = path.posix.extname(base) ? [base] : [`${base}.mjs`, `${base}.js`, path.posix.join(base, "index.mjs")];
      const dependency = candidates.find((candidate) => fs.existsSync(path.join(root, candidate)));
      if (!dependency || locators.has(dependency)) continue;
      if (!dependency.startsWith("skills/")) continue;
      if (FORBIDDEN.test(dependency)) throw new Error(`runtime source imports forbidden Skill Bundle content: ${locator} -> ${dependency}`);
      locators.add(dependency);
      queue.push(dependency);
    }
  }
}

async function copy(packageRoot, outputDir, locator) {
  assertLocator(locator);
  const source = path.join(packageRoot, locator);
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`release source must be a regular file: ${locator}`);
  const bytes = fs.readFileSync(source);
  const target = path.join(outputDir, locator);
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.writeFile(target, bytes, { flag: "wx" });
  return { path: locator, sha256: sha256(bytes) };
}

export async function buildSkillBundleRelease({
  packageRoot,
  outputDir,
  runnerContractMajor = 1,
  runnerContractMinMinor = 0,
} = {}) {
  const root = assertRoot(packageRoot, "packageRoot");
  await fs.promises.mkdir(outputDir, { recursive: true });
  const destination = fs.realpathSync(outputDir);
  const locators = new Set([
    "schemas/skill-bundle.schema.json",
    "schemas/stage-skill-deps.schema.json",
  ]);
  const visitedSkills = new Set();
  for (const stage of STAGES) {
    const base = `workflows/${stage}`;
    for (const name of ["SKILL.md", "skill-deps.yaml", "steps.json"]) {
      if (fs.existsSync(path.join(root, base, name))) locators.add(`${base}/${name}`);
    }
    const manifest = yaml.load(fs.readFileSync(path.join(root, base, "skill-deps.yaml"), "utf8"));
    for (const dependency of manifest.skills ?? []) {
      addSkillClosure(root, dependency.name, locators, visitedSkills);
    }
  }
  addStaticImportClosure(root, locators);
  const files = await Promise.all([...locators].sort().map((locator) => copy(root, destination, locator)));
  // Source skill manifests may list test-only assets used by the Hub checkout.
  // A clean Skill Bundle deliberately excludes those assets, so publish a
  // self-consistent manifest whose closure matches the files actually copied.
  // Otherwise an installed runner can fail before a conditional skill is
  // invoked merely because its manifest points at an omitted test fixture.
  for (const entry of files.filter(({ path: locator }) => locator.endsWith("/skill-bundle.json"))) {
    const target = path.join(destination, entry.path);
    const manifest = JSON.parse(fs.readFileSync(target, "utf8"));
    const original = Array.isArray(manifest.files) ? manifest.files : [];
    manifest.files = original.filter((asset) => {
      const relative = typeof asset === "string" ? asset : asset?.path;
      if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes("..")) return false;
      const locator = path.posix.join(path.posix.dirname(entry.path), relative);
      return locators.has(locator);
    }).map((asset) => {
      if (typeof asset === "string") return asset;
      const locator = path.posix.join(path.posix.dirname(entry.path), asset.path);
      return { ...asset, sha256: sha256(fs.readFileSync(path.join(destination, locator))) };
    });
    const bytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    await fs.promises.writeFile(target, bytes);
    entry.sha256 = sha256(bytes);
  }
  const contract = createSkillBundleContract({ major: runnerContractMajor, minMinor: runnerContractMinMinor });
  const release = {
    schema_version: 1,
    skill: "workflowhub",
    ...contract,
    files,
  };
  await fs.promises.writeFile(path.join(destination, "skill-bundle.json"), `${JSON.stringify(release, null, 2)}\n`, { flag: "wx" });
  return Object.freeze(release);
}

export function validateSkillBundleRelease({ releaseRoot } = {}) {
  const root = fs.realpathSync(releaseRoot);
  const manifestPath = path.join(root, "skill-bundle.json");
  if (!fs.existsSync(manifestPath)) throw new Error("skill bundle manifest is missing");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const allowed = new Set([
    "schema_version", "skill", "runner_contract_major", "runner_contract_min_minor", "files",
  ]);
  createSkillBundleContract({
    major: manifest.runner_contract_major,
    minMinor: manifest.runner_contract_min_minor,
  });
  if (manifest.schema_version !== 1 || manifest.skill !== "workflowhub" || !Array.isArray(manifest.files)
      || Object.keys(manifest).some((key) => !allowed.has(key))) {
    throw new Error("skill bundle manifest schema is invalid");
  }
  const seen = new Set();
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
        || Object.keys(entry).some((key) => !new Set(["path", "sha256"]).has(key))
        || path.isAbsolute(entry.path) || entry.path.split(/[\\/]/).includes("..") || seen.has(entry.path)) {
      throw new Error("skill bundle file manifest is invalid");
    }
    seen.add(entry.path);
    const source = path.join(root, entry.path);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile() || fs.lstatSync(source).isSymbolicLink()) {
      throw new Error(`skill bundle file is missing or unsafe: ${entry.path}`);
    }
    if (sha256(fs.readFileSync(source)) !== entry.sha256) throw new Error(`skill bundle hash mismatch: ${entry.path}`);
  }
  return Object.freeze(manifest);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [packageRoot, outputDir] = process.argv.slice(2);
  process.stdout.write(`${JSON.stringify(await buildSkillBundleRelease({ packageRoot, outputDir }), null, 2)}\n`);
}
