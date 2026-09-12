import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import { createSkillBundleContract } from "../interface/runner-contract.mjs";
import { validateSkillBundle } from "../adapters/local-skill-resolver.mjs";
import { checkSkillClosure, workflowDeclarations } from "../evidence/check-skill-closure.mjs";
import { SHA256_HEX } from "../evidence/canonical-utils.mjs";

const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const PORTABLE_WORKFLOW_KIND = "portable_workflow";
const REQUIRED_PORTABLE_WORKFLOW = Object.freeze({
  component_id: "build-prd",
  workflow: "build-prd",
  kind: PORTABLE_WORKFLOW_KIND,
  path: "workflows/build-prd/SKILL.md",
});
const PORTABLE_WORKFLOW_FILES = Object.freeze(["SKILL.md", "skill-deps.yaml", "steps.json"]);
const FORBIDDEN = /(?:^|\/)(?:node_modules|tests?|__tests__|specs?|evidence|archive|history|historical)(?:\/|$)|(?:^|\/)[^/]*\.test\.[^/]+$/;
const RELEASE_MANIFEST_LOCATOR = "skill-bundle.json";

function inside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function assertRoot(candidate, label) {
  if (!path.isAbsolute(candidate)) throw new TypeError(`${label} must be absolute`);
  return fs.realpathSync(candidate);
}

function assertDestinationAncestor(directory, destination, label) {
  let stat;
  try {
    stat = fs.lstatSync(directory);
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`${label} contains an unsafe destination component: ${directory}`);
  }
  const resolved = fs.realpathSync(directory);
  if (!inside(destination, resolved)) {
    throw new Error(`${label} destination escapes output directory: ${directory}`);
  }
  return true;
}

function prepareOutputDirectory(outputDir) {
  if (typeof outputDir !== "string" || !path.isAbsolute(outputDir)) {
    throw new TypeError("outputDir must be absolute");
  }
  const lexical = path.resolve(outputDir);
  // Do not let recursive mkdir traverse an attacker-controlled symlink. Walk
  // only as far as the nearest existing ancestor: system aliases such as
  // macOS /var -> /private/var remain valid, while a pre-existing component
  // directly in the requested output path is rejected.
  const missing = [];
  let current = lexical;
  let existingStat;
  while (true) {
    try {
      existingStat = fs.lstatSync(current);
      break;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      missing.push(current);
      const parent = path.dirname(current);
      if (parent === current) throw new Error("outputDir has no existing directory ancestor");
      current = parent;
    }
  }
  if (existingStat.isSymbolicLink() || !existingStat.isDirectory()) {
    throw new Error(`outputDir contains an unsafe destination component: ${current}`);
  }
  fs.realpathSync(current);
  for (const directory of missing.reverse()) {
    try { fs.mkdirSync(directory); } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
    const stat = fs.lstatSync(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`outputDir contains an unsafe destination component: ${directory}`);
    }
    fs.realpathSync(directory);
  }
  const stat = fs.lstatSync(lexical);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error("outputDir must be a real directory");
  }
  const destination = fs.realpathSync(lexical);
  const entries = fs.readdirSync(lexical, { withFileTypes: true });
  if (entries.length > 0) {
    throw new Error("outputDir must be empty before publishing a skill bundle");
  }
  return destination;
}

function ensureDestinationParent(destination, locator) {
  assertLocator(locator);
  const target = path.join(destination, locator);
  const relativeParent = path.relative(destination, path.dirname(target));
  if (relativeParent.startsWith("..") || path.isAbsolute(relativeParent)) {
    throw new Error(`release destination escapes output directory: ${locator}`);
  }
  if (!assertDestinationAncestor(destination, destination, "skill bundle release")) {
    throw new Error(`skill bundle release destination is unavailable: ${locator}`);
  }
  let current = destination;
  for (const segment of relativeParent ? relativeParent.split(path.sep) : []) {
    current = path.join(current, segment);
    if (!assertDestinationAncestor(current, destination, "skill bundle release")) {
      try { fs.mkdirSync(current); } catch (error) {
        if (error?.code !== "EEXIST") throw error;
      }
      if (!assertDestinationAncestor(current, destination, "skill bundle release")) {
        throw new Error(`skill bundle release destination is unsafe: ${locator}`);
      }
    }
  }
}

function assertLocator(locator) {
  if (!locator || locator.startsWith("/") || locator.startsWith("\\") || /^[A-Za-z]:/.test(locator)
      || locator.includes("\\") || locator.split("/").some((segment) => segment === "." || segment === "..")) {
    throw new Error(`release locator must be contained and relative: ${locator}`);
  }
  if (FORBIDDEN.test(locator)) throw new Error(`skill bundle contains forbidden path: ${locator}`);
}

function readStableFile(root, locator, label = "release file") {
  assertLocator(locator);
  const packageRoot = fs.realpathSync(root);
  const source = path.join(packageRoot, locator);
  let fd;
  try {
    const lexicalStat = fs.lstatSync(source);
    if (lexicalStat.isSymbolicLink() || !lexicalStat.isFile()) {
      throw new Error(`${label} is missing or unsafe: ${locator}`);
    }
    const resolvedBeforeOpen = fs.realpathSync(source);
    if (!inside(packageRoot, resolvedBeforeOpen)) throw new Error(`${label} escapes package root: ${locator}`);
    if (lexicalStat.nlink > 1) throw new Error(`${label} may not be hard-linked: ${locator}`);
    const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
    fd = fs.openSync(source, flags);
    const descriptorStat = fs.fstatSync(fd);
    if (!descriptorStat.isFile()) throw new Error(`${label} must be a regular file: ${locator}`);
    if (descriptorStat.nlink > 1) throw new Error(`${label} may not be hard-linked: ${locator}`);
    const pathStat = fs.statSync(source);
    if (pathStat.dev !== descriptorStat.dev || pathStat.ino !== descriptorStat.ino) {
      throw new Error(`${label} changed during read: ${locator}`);
    }
    const resolvedAfterOpen = fs.realpathSync(source);
    if (!inside(packageRoot, resolvedAfterOpen)) throw new Error(`${label} escapes package root: ${locator}`);
    return fs.readFileSync(fd);
  } catch (error) {
    if (["ENOENT", "ELOOP", "ENOTDIR"].includes(error?.code)) {
      throw new Error(`${label} is missing or unsafe: ${locator}`, { cause: error });
    }
    throw error;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function listReleaseFiles(root) {
  const files = [];
  const walk = (directory, prefix) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const locator = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(directory, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`skill bundle release contains unsafe symlink: ${locator}`);
      if (stat.isDirectory()) walk(absolute, locator);
      else if (stat.isFile()) files.push(locator);
      else throw new Error(`skill bundle release contains unsupported file: ${locator}`);
    }
  };
  walk(fs.realpathSync(root), "");
  return files.sort();
}

function validatePortableReleaseDeclarations(manifest, seen, root) {
  if (!Array.isArray(manifest.portable_workflows)) {
    throw new Error("skill bundle portable workflow declarations are missing");
  }
  if (manifest.portable_workflows.length !== 1) {
    throw new Error("skill bundle portable workflow declarations are invalid");
  }
  const declarations = new Map();
  for (const declaration of manifest.portable_workflows) {
    if (!declaration || typeof declaration !== "object" || Array.isArray(declaration)
        || Object.keys(declaration).some((key) => !new Set(["component_id", "workflow", "kind", "path", "files"]).has(key))
        || typeof declaration.component_id !== "string"
        || declaration.component_id.trim() === ""
        || typeof declaration.workflow !== "string"
        || !/^[a-z][a-z0-9-]*$/.test(declaration.workflow)
        || declaration.kind !== PORTABLE_WORKFLOW_KIND
        || declaration.path !== `workflows/${declaration.workflow}/SKILL.md`
        || !Array.isArray(declaration.files)
        || declaration.files.length !== PORTABLE_WORKFLOW_FILES.length
        || new Set(declaration.files).size !== declaration.files.length
        || declaration.files.some((locator) => typeof locator !== "string")) {
      throw new Error("skill bundle portable workflow declaration is invalid");
    }
    if (declarations.has(declaration.workflow)) throw new Error(`duplicate portable workflow declaration: ${declaration.workflow}`);
    if (declaration.workflow === REQUIRED_PORTABLE_WORKFLOW.workflow
        && (declaration.component_id !== REQUIRED_PORTABLE_WORKFLOW.component_id
          || declaration.kind !== REQUIRED_PORTABLE_WORKFLOW.kind
          || declaration.path !== REQUIRED_PORTABLE_WORKFLOW.path)) {
      throw new Error("required portable workflow declaration is invalid: build-prd");
    }
    declarations.set(declaration.workflow, declaration);
    for (const locator of declaration.files) {
      assertLocator(locator);
      if (!seen.has(locator)) throw new Error(`portable workflow file is missing from manifest: ${locator}`);
      readStableFile(root, locator, "portable workflow source");
    }
  }
  for (const [workflow, declaration] of declarations) {
    const expectedFiles = PORTABLE_WORKFLOW_FILES.map((file) => `workflows/${workflow}/${file}`);
    if (JSON.stringify(declaration.files) !== JSON.stringify(expectedFiles)) {
      throw new Error(`portable workflow file closure is invalid: ${workflow}`);
    }
  }
  if (!declarations.has(REQUIRED_PORTABLE_WORKFLOW.workflow)) {
    throw new Error(`required portable workflow declaration is missing: ${REQUIRED_PORTABLE_WORKFLOW.workflow}`);
  }
  return [...declarations.values()];
}

function addSkillClosure(root, name, locators, visited) {
  if (visited.has(name)) return;
  visited.add(name);
  const base = `skills/${name}`;
  const bundleLocator = `${base}/skill-bundle.json`;
  const expectedSkillPath = `${base}/SKILL.md`;
  const { bundle } = validateSkillBundle(root, bundleLocator, expectedSkillPath);
  locators.add(bundleLocator);
  for (const entry of bundle.files ?? []) {
    const locator = path.posix.join(base, typeof entry === "string" ? entry : entry.path);
    assertLocator(locator);
    locators.add(locator);
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

function addStaticImportClosure(root, locators, { requireDependencies = false } = {}) {
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
      if (!dependency && requireDependencies && base.startsWith("skills/")) {
        throw new Error(`skill bundle import is missing: ${locator} -> ${specifier}`);
      }
      if (!dependency || locators.has(dependency)) continue;
      if (!dependency.startsWith("skills/")) continue;
      if (FORBIDDEN.test(dependency)) throw new Error(`runtime source imports forbidden Skill Bundle content: ${locator} -> ${dependency}`);
      locators.add(dependency);
      queue.push(dependency);
    }
  }
}

function assertSourceClosure(root) {
  const result = checkSkillClosure(root);
  if (!result.ok) throw new Error(`skill closure is not closed: ${result.errors.join("; ")}`);
}

function collectSourceClosure(root) {
  assertSourceClosure(root);
  return collectDeclaredClosure(root);
}

function collectDeclaredClosure(root, { release = false } = {}) {
  const locators = new Set([
    "runtime/schemas/skill-bundle.schema.json",
    "runtime/schemas/stage-skill-deps.schema.json",
  ]);
  const visitedSkills = new Set();
  const declaredPortableWorkflows = workflowDeclarations(root).portable
    .filter((entry) => entry.kind === PORTABLE_WORKFLOW_KIND)
    .map(({ workflow }) => workflow);
  const workflows = [...new Set([...STAGES, ...declaredPortableWorkflows])];
  for (const workflow of workflows) {
    const base = `workflows/${workflow}`;
    const workflowDirectory = path.join(root, base);
    if (declaredPortableWorkflows.includes(workflow)) {
      const stat = fs.lstatSync(workflowDirectory);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`portable workflow directory must be a real directory: ${workflow}`);
      const resolved = fs.realpathSync(workflowDirectory);
      const resolvedRoot = fs.realpathSync(root);
      if (!(resolved === resolvedRoot || resolved.startsWith(`${resolvedRoot}${path.sep}`))) {
        throw new Error(`portable workflow directory escapes package root: ${workflow}`);
      }
    }
    for (const name of ["SKILL.md", "skill-deps.yaml", "steps.json"]) {
      if (release || fs.existsSync(path.join(root, base, name))) locators.add(`${base}/${name}`);
    }
    const manifest = yaml.load(fs.readFileSync(path.join(root, base, "skill-deps.yaml"), "utf8"));
    for (const dependency of manifest.skills ?? []) {
      addSkillClosure(root, dependency.name, locators, visitedSkills);
    }
  }
  addStaticImportClosure(root, locators, { requireDependencies: release });
  return locators;
}

function captureSourceHashes(root, locators) {
  return new Map([...locators].map((locator) => [locator, sha256(readStableFile(root, locator, "release source"))]));
}

function assertSourceSnapshotStable(root, locators, sourceHashes, files) {
  const copied = new Map(files.map((entry) => [entry.path, entry.sha256]));
  for (const locator of locators) {
    const expected = sourceHashes.get(locator);
    const current = sha256(readStableFile(root, locator, "release source"));
    if (current !== expected || copied.get(locator) !== expected) {
      throw new Error(`source changed during skill bundle release: ${locator}`);
    }
  }
}

async function copy(packageRoot, outputDir, locator) {
  const bytes = readStableFile(packageRoot, locator, "release source");
  ensureDestinationParent(outputDir, locator);
  const target = path.join(outputDir, locator);
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
  const outputPath = path.resolve(outputDir);
  prepareOutputDirectory(outputDir);
  const outputParent = fs.realpathSync(path.dirname(outputPath));
  if (!assertDestinationAncestor(outputParent, outputParent, "skill bundle release")) {
    throw new Error("skill bundle release parent is unavailable");
  }
  let stagingDir = fs.mkdtempSync(path.join(outputParent, `.${path.basename(outputPath)}.staging-`));
  try {
    const locators = collectSourceClosure(root);
    const sourceHashes = captureSourceHashes(root, locators);
    const files = await Promise.all([...locators].sort().map((locator) => copy(root, stagingDir, locator)));
    assertSourceSnapshotStable(root, locators, sourceHashes, files);
    // Re-resolve after copying so a manifest/import graph mutation cannot add
    // an un-copied file or leave an obsolete file hash in the release.
    const finalLocators = collectSourceClosure(root);
    if (finalLocators.size !== locators.size || [...finalLocators].some((locator) => !locators.has(locator))) {
      throw new Error("source closure changed during skill bundle release");
    }
    const finalHashes = captureSourceHashes(root, finalLocators);
    for (const locator of locators) {
      if (finalHashes.get(locator) !== sourceHashes.get(locator)) {
        throw new Error(`source changed during skill bundle release: ${locator}`);
      }
    }
    const contract = createSkillBundleContract({ major: runnerContractMajor, minMinor: runnerContractMinMinor });
    const release = {
      schema_version: 1,
      skill: "workflowhub",
      ...contract,
      portable_workflows: workflowDeclarations(root).portable
        .filter((entry) => entry.kind === PORTABLE_WORKFLOW_KIND)
        .map((entry) => ({
          component_id: entry.component_id,
          workflow: entry.workflow,
          kind: entry.kind,
          path: entry.path,
          files: PORTABLE_WORKFLOW_FILES.map((file) => `workflows/${entry.workflow}/${file}`),
        })),
      files,
    };
    ensureDestinationParent(stagingDir, RELEASE_MANIFEST_LOCATOR);
    await fs.promises.writeFile(path.join(stagingDir, RELEASE_MANIFEST_LOCATOR), `${JSON.stringify(release, null, 2)}\n`, { flag: "wx" });
    // Validate the complete staged tree before it becomes visible. The final
    // rename replaces the caller-provided empty directory atomically; any
    // failure leaves the previous output untouched and removes only staging.
    const validated = validateSkillBundleRelease({ releaseRoot: stagingDir });
    fs.renameSync(stagingDir, outputPath);
    stagingDir = null;
    return Object.freeze(validated);
  } finally {
    if (stagingDir !== null) fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

export function validateSkillBundleRelease({ releaseRoot } = {}) {
  const root = fs.realpathSync(releaseRoot);
  let manifest;
  try {
    manifest = JSON.parse(readStableFile(root, RELEASE_MANIFEST_LOCATOR, "skill bundle manifest").toString("utf8"));
  } catch (error) {
    if (["ENOENT", "ELOOP", "ENOTDIR"].includes(error?.code)) {
      throw new Error("skill bundle manifest is missing or unsafe", { cause: error });
    }
    throw error;
  }
  const allowed = new Set([
    "schema_version", "skill", "runner_contract_major", "runner_contract_min_minor", "portable_workflows", "files",
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
    if (!entry || typeof entry.path !== "string" || entry.path === RELEASE_MANIFEST_LOCATOR
        || !SHA256_HEX.test(entry.sha256 ?? "")
        || Object.keys(entry).some((key) => !new Set(["path", "sha256"]).has(key))
        || path.isAbsolute(entry.path) || entry.path.split(/[\\/]/).includes("..") || seen.has(entry.path)) {
      throw new Error("skill bundle file manifest is invalid");
    }
    const bytes = readStableFile(root, entry.path);
    seen.add(entry.path);
    if (sha256(bytes) !== entry.sha256) throw new Error(`skill bundle hash mismatch: ${entry.path}`);
  }
  validatePortableReleaseDeclarations(manifest, seen, root);
  // Reconstruct from workflow and skill declarations, independently of the
  // top-level inventory: removing an asset and its inventory entry must fail.
  const required = collectDeclaredClosure(root, { release: true });
  for (const locator of required) {
    if (!seen.has(locator)) throw new Error(`skill bundle declared file is missing from manifest: ${locator}`);
  }
  for (const locator of seen) {
    if (!required.has(locator)) throw new Error(`skill bundle manifest contains file outside required closure: ${locator}`);
  }
  const releaseFiles = new Set(listReleaseFiles(root));
  releaseFiles.delete(RELEASE_MANIFEST_LOCATOR);
  for (const locator of releaseFiles) {
    assertLocator(locator);
    if (!seen.has(locator)) throw new Error(`skill bundle release contains unmanifested file: ${locator}`);
  }
  for (const locator of seen) {
    if (locator === RELEASE_MANIFEST_LOCATOR) continue;
    if (!releaseFiles.has(locator)) throw new Error(`skill bundle file is missing or unsafe: ${locator}`);
  }
  return Object.freeze(manifest);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [packageRoot, outputDir] = process.argv.slice(2);
  process.stdout.write(`${JSON.stringify(await buildSkillBundleRelease({ packageRoot, outputDir }), null, 2)}\n`);
}
