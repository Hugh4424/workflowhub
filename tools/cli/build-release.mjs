#!/usr/bin/env node
// C10 P4 final release composer. It only orchestrates the existing Skill Bundle
// and Runner builders/validators (their closure and security rules stay the
// single owners), then adds the declared outer delivery artifacts, the two host
// adaptation links and the installed support files the portable resolvers read.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FORMAL_DEVELOPMENT_STAGES } from "../../runtime/stage/stage-registry.mjs";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { buildSkillBundleRelease, resolvePortableStageFiles, validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { buildRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { parseSemver } from "../../runtime/distribution/update-check.mjs";

const RELEASE_MANIFEST = "release.json";
const BUNDLE_ROOT = "skill-bundle";
const RUNNER_ROOT = "runner";

// The outer delivery declaration is a fixed whitelist, not a directory scan.
const OUTER_FILES = Object.freeze([
  Object.freeze({ path: "README.md", source: "README.md" }),
  Object.freeze({ path: "repo-skills.manifest.json", source: "repo-skills.manifest.json" }),
  Object.freeze({ path: "external-skills.manifest.json", source: "external-skills.manifest.json" }),
  Object.freeze({ path: "docs/release-support-matrix.md", source: "docs/release-support-matrix.md" }),
  Object.freeze({ path: "docs/external-skills-compat-matrix.md", source: "docs/external-skills-compat-matrix.md" }),
  // The onboarding entry runs outside the strict bundle; it loads the release
  // runtime only through its declared runtime root.
  Object.freeze({ path: "tools/cli/onboard-release.mjs", source: "tools/cli/onboard-release.mjs" }),
]);
const HOST_LINKS = Object.freeze([
  Object.freeze({ path: ".claude/skills", target: "../runner/skills" }),
  Object.freeze({ path: ".agents/skills", target: "../runner/skills" }),
]);
// Files outside both standard roots that the declared outer/onboard or portable
// stage resolvers actually read at runtime.
const DECLARED_SUPPORT = Object.freeze([
  Object.freeze({ path: "runtime/distribution/update-check.mjs", source: "runtime/distribution/update-check.mjs",
    reason: "outer onboarding update check module (Node built-ins only)" }),
  Object.freeze({ path: "docs/architecture/move-map.json", source: "docs/architecture/move-map.json",
    reason: "portable import source-ownership registry read by the stage resolver" }),
]);
// Development material is judged by the declared release purpose, not by the
// word "evidence": the Runner legitimately ships runtime/evidence modules.
function isDevelopmentMaterial(locator) {
  // Any depth, not only the first segment: an allowed parent directory (for
  // example .claude/ or runtime/) must not authorize specs/, quality/ or tests/
  // material somewhere below it.
  const segments = locator.split("/");
  if (segments.some((segment) => /^(?:node_modules|tests?|__tests__|specs?|quality|coverage|archive|history|historical)$/.test(segment))) return true;
  if (/\.test\.[^/]+$/.test(locator)) return true;
  return false;
}

function fail(message, details = {}) {
  return Object.assign(new Error(message), { code: "RELEASE_FAILED", ...details });
}

function inside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function assertAbsoluteDirectory(candidate, label) {
  if (typeof candidate !== "string" || candidate.trim() === "" || !path.isAbsolute(candidate)) {
    throw fail(`${label} must be an explicit absolute path: ${String(candidate)}`);
  }
  const stat = fs.lstatSync(candidate);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw fail(`${label} must be a real directory: ${candidate}`);
  return fs.realpathSync(candidate);
}

function stableRead(root, relative, label) {
  if (typeof relative !== "string" || relative === "" || path.isAbsolute(relative)
      || relative.split(/[\\/]/).some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw fail(`${label} locator must be a contained relative path: ${relative}`);
  }
  let stat;
  try { stat = fs.lstatSync(path.join(root, relative)); }
  catch (error) { throw fail(`${label} is missing: ${relative} (${error.code ?? error.message})`, { cause: error }); }
  if (stat.isSymbolicLink() || !stat.isFile()) throw fail(`${label} must be a regular non-symlink file: ${relative}`);
  const resolved = fs.realpathSync(path.join(root, relative));
  if (!inside(root, resolved)) throw fail(`${label} escapes its package root: ${relative}`);
  const bytes = fs.readFileSync(resolved);
  const after = fs.lstatSync(path.join(root, relative));
  if (!after.isFile() || after.isSymbolicLink()) throw fail(`${label} changed while reading: ${relative}`);
  return bytes;
}

function writeFresh(target, bytes) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { flag: "wx" });
}

function copyFresh(stage, relative, label, bytes) {
  const target = path.join(stage, relative);
  if (fs.existsSync(target)) {
    if (!fs.readFileSync(target).equals(bytes)) throw fail(`${label} differs from an existing release file: ${relative}`);
    return false;
  }
  writeFresh(target, bytes);
  return true;
}

function prepareOutput(outputDir, packageRoot) {
  if (typeof outputDir !== "string" || outputDir.trim() === "" || !path.isAbsolute(outputDir)) {
    throw fail(`--output must be an explicit absolute path: ${String(outputDir)}`);
  }
  const lexical = path.resolve(outputDir);
  const parent = fs.realpathSync(path.dirname(lexical));
  const output = path.join(parent, path.basename(lexical));
  if (inside(packageRoot, output) || inside(output, packageRoot)) {
    throw fail(`--output must be outside the package root: ${output}`);
  }
  let created = false;
  const stat = fs.lstatSync(output, { throwIfNoEntry: false });
  if (!stat) {
    fs.mkdirSync(output);
    created = true;
  } else {
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw fail(`--output must be a real directory: ${output}`);
    if (fs.readdirSync(output).length > 0) throw fail(`--output must be empty before building a release: ${output}`);
  }
  return { output: fs.realpathSync(output), created };
}

function collectSupportFiles(packageRoot, runnerRoot, bundle) {
  // Files the installer will copy from the bundle are not support files. The
  // support set is only what remains outside both standard declarations.
  const bundleFiles = new Set(bundle.files.map((entry) => entry.path));
  const locators = new Set(DECLARED_SUPPORT.map((entry) => entry.source));
  for (const stage of FORMAL_DEVELOPMENT_STAGES) {
    for (const locator of resolvePortableStageFiles({ packageRoot, stage }).files) locators.add(locator);
  }
  const support = [];
  for (const locator of [...locators].sort()) {
    const declared = DECLARED_SUPPORT.find((entry) => entry.source === locator);
    if (fs.existsSync(path.join(runnerRoot, locator)) || bundleFiles.has(locator)) continue;
    const bytes = stableRead(packageRoot, locator, "installed support source");
    writeFresh(path.join(runnerRoot, locator), bytes);
    support.push(Object.freeze({
      path: locator,
      source: locator,
      reason: declared?.reason ?? "portable stage resolution input read from the installed root",
    }));
  }
  return support;
}

function writeHostLinks(stage, runnerRoot) {
  for (const link of HOST_LINKS) {
    const target = path.join(stage, link.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) throw fail(`host adaptation path already exists: ${link.path}`);
    fs.symlinkSync(link.target, target);
    const resolved = fs.realpathSync(target);
    const skills = fs.realpathSync(path.join(runnerRoot, "skills"));
    if (resolved !== skills) throw fail(`host adaptation link does not resolve to the package skills root: ${link.path}`);
  }
}

function releaseManifest({ version, support }) {
  return {
    schema_version: 1,
    release: "workflowhub-release",
    version,
    skill_bundle_root: BUNDLE_ROOT,
    runner_root: RUNNER_ROOT,
    files: OUTER_FILES.map((entry) => ({ path: entry.path })),
    host_links: HOST_LINKS.map((entry) => ({ path: entry.path, target: entry.target })),
    installed_support_files: support.map((entry) => ({ path: entry.path, source: entry.source, reason: entry.reason })),
  };
}

function assertManifestShape(manifest) {
  const allowed = new Set(["schema_version", "release", "version", "skill_bundle_root", "runner_root", "files", "host_links", "installed_support_files"]);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)
      || manifest.schema_version !== 1 || manifest.release !== "workflowhub-release"
      || typeof manifest.version !== "string" || !parseSemver(manifest.version)
      || manifest.skill_bundle_root !== BUNDLE_ROOT || manifest.runner_root !== RUNNER_ROOT
      || Object.keys(manifest).some((key) => !allowed.has(key))) {
    throw fail("release manifest schema is invalid");
  }
  const expectedFiles = OUTER_FILES.map((entry) => entry.path).sort();
  if (!Array.isArray(manifest.files) || manifest.files.some((entry) => !entry || Object.keys(entry).some((key) => key !== "path"))
      || manifest.files.length !== expectedFiles.length
      || JSON.stringify(manifest.files.map((entry) => entry.path).sort()) !== JSON.stringify(expectedFiles)) {
    throw fail("release manifest declared outer file set is invalid");
  }
  if (!Array.isArray(manifest.host_links) || manifest.host_links.length !== HOST_LINKS.length) {
    throw fail("release manifest host link declaration is invalid");
  }
  for (const expected of HOST_LINKS) {
    const observed = manifest.host_links.find((entry) => entry?.path === expected.path);
    if (!observed || observed.target !== expected.target || Object.keys(observed).some((key) => !["path", "target"].includes(key))) {
      throw fail(`release manifest host link is invalid: ${expected.path}`);
    }
  }
  if (!Array.isArray(manifest.installed_support_files)) throw fail("release manifest support declaration is invalid");
  const seen = new Set();
  for (const entry of manifest.installed_support_files) {
    if (!entry || typeof entry.path !== "string" || typeof entry.source !== "string" || typeof entry.reason !== "string"
        || entry.reason.trim() === "" || Object.keys(entry).some((key) => !["path", "source", "reason"].includes(key))
        || path.isAbsolute(entry.path) || entry.path.split(/[\\/]/).some((segment) => segment === ".." || segment === ".")
        || seen.has(entry.path)) {
      throw fail(`release manifest support file is invalid: ${JSON.stringify(entry)}`);
    }
    seen.add(entry.path);
  }
}

function assertNoUndeclaredOuterEntry(releaseRoot, manifest) {
  const outerTop = new Set(manifest.files.map((entry) => entry.path.split("/")[0]));
  outerTop.add(RELEASE_MANIFEST);
  outerTop.add(BUNDLE_ROOT);
  outerTop.add(RUNNER_ROOT);
  for (const link of HOST_LINKS) outerTop.add(link.path.split("/")[0]);
  for (const entry of fs.readdirSync(releaseRoot, { withFileTypes: true })) {
    if (!outerTop.has(entry.name)) {
      throw fail(`release contains an unexpected outer entry: ${entry.name}; the release is a declared whitelist, not a directory snapshot`);
    }
    const absolute = path.join(releaseRoot, entry.name);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() && !HOST_LINKS.some((link) => link.path.startsWith(`${entry.name}/`))) {
      throw fail(`release contains an unexpected symbolic link: ${entry.name}`);
    }
  }
}


function assertOuterTree(releaseRoot, manifest) {
  // Everything outside the two standard roots and the host links must be one of
  // the declared outer artifacts; an allowed top-level name does not authorize
  // arbitrary nested files.
  const declared = new Set([...manifest.files.map((entry) => entry.path), RELEASE_MANIFEST]);
  const allowedDirectories = new Set();
  for (const relative of declared) {
    const segments = relative.split("/");
    for (let index = 1; index < segments.length; index += 1) allowedDirectories.add(segments.slice(0, index).join("/"));
  }
  const skip = new Set([BUNDLE_ROOT, RUNNER_ROOT, ...HOST_LINKS.map((link) => link.path.split("/")[0])]);
  const walk = (directory, prefix) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const locator = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!prefix && skip.has(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw fail(`release contains an unexpected symbolic link: ${locator}`);
      if (stat.isDirectory()) {
        if (!allowedDirectories.has(locator)) throw fail(`release contains an unexpected outer directory: ${locator}`);
        walk(absolute, locator);
        continue;
      }
      if (!stat.isFile() || !declared.has(locator)) throw fail(`release contains an unexpected outer file: ${locator}`);
    }
  };
  walk(releaseRoot, "");
}

function assertOuterFiles(releaseRoot, packageRoot) {
  for (const entry of OUTER_FILES) {
    const file = path.join(releaseRoot, entry.path);
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isFile()) throw fail(`declared outer artifact is missing or unsafe: ${entry.path}`);
    if (packageRoot !== undefined) {
      const expected = fs.readFileSync(path.join(packageRoot, entry.source));
      if (!fs.readFileSync(file).equals(expected)) throw fail(`declared outer artifact differs from its source: ${entry.path}`);
    }
  }
}

function assertHostLinks(releaseRoot) {
  const runnerRoot = fs.realpathSync(path.join(releaseRoot, RUNNER_ROOT));
  const expected = fs.realpathSync(path.join(runnerRoot, "skills"));
  for (const link of HOST_LINKS) {
    const file = path.join(releaseRoot, link.path);
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (!stat || !stat.isSymbolicLink()) throw fail(`host adaptation link is missing or not a symbolic link: ${link.path}`);
    const content = fs.readlinkSync(file);
    if (content !== link.target) throw fail(`host adaptation link target is invalid: ${link.path} -> ${content}`);
    let resolved;
    try { resolved = fs.realpathSync(file); }
    catch (error) { throw fail(`host adaptation link is broken: ${link.path} (${error.code ?? error.message})`, { cause: error }); }
    if (resolved !== expected) throw fail(`host adaptation link resolves outside the package skills root: ${link.path}`);
  }
}


function assertHostLinkTrees(releaseRoot) {
  // The host adaptation directories are part of the package surface: after the
  // declared skills symlink nothing else may live there (no specs/, quality/,
  // tests/ material smuggled under an allowed top-level name).
  for (const top of [...new Set(HOST_LINKS.map((link) => link.path.split("/")[0]))]) {
    const directory = path.join(releaseRoot, top);
    const stat = fs.lstatSync(directory, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) throw fail(`host adaptation directory is missing or unsafe: ${top}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const locator = `${top}/${entry.name}`;
      const expected = HOST_LINKS.find((link) => link.path === locator);
      if (!expected) throw fail(`host adaptation directory contains an undeclared entry: ${locator}`);
      const entryStat = fs.lstatSync(path.join(directory, entry.name));
      if (!entryStat.isSymbolicLink()) throw fail(`host adaptation entry is not the declared symbolic link: ${locator}`);
    }
  }
}
function assertRunnerTree(releaseRoot, runnerManifest) {
  const runnerRoot = path.join(releaseRoot, RUNNER_ROOT);
  const declared = new Set([...runnerManifest.files.map((entry) => entry.path), "runner-release.json"]);
  const support = new Set((JSON.parse(fs.readFileSync(path.join(releaseRoot, RELEASE_MANIFEST), "utf8")).installed_support_files ?? []).map((entry) => entry.path));
  const walk = (directory, prefix) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const locator = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(directory, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw fail(`runner release contains an unexpected symbolic link: ${locator}`);
      if (stat.isDirectory()) { walk(absolute, locator); continue; }
      if (!stat.isFile()) throw fail(`runner release contains an unsupported file: ${locator}`);
      if (!declared.has(locator) && !support.has(locator)) {
        throw fail(`runner release contains an undeclared file: ${locator}`);
      }
      if (isDevelopmentMaterial(locator)) {
        throw fail(`runner release contains development material: ${locator}`);
      }
    }
  };
  walk(runnerRoot, "");
}

function assertSupportFiles(releaseRoot, manifest, packageRoot) {
  const runnerRoot = fs.realpathSync(path.join(releaseRoot, RUNNER_ROOT));
  const runnerManifest = JSON.parse(fs.readFileSync(path.join(releaseRoot, RUNNER_ROOT, "runner-release.json"), "utf8"));
  const declared = new Set(runnerManifest.files.map((entry) => entry.path));
  for (const entry of manifest.installed_support_files) {
    if (declared.has(entry.path)) throw fail(`installed support file is already a runner manifest file: ${entry.path}`);
    const file = path.join(runnerRoot, entry.path);
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isFile()) throw fail(`installed support file is missing or unsafe: ${entry.path}`);
    if (!inside(runnerRoot, fs.realpathSync(file))) throw fail(`installed support file escapes the runner root: ${entry.path}`);
    if (packageRoot !== undefined) {
      const source = path.join(packageRoot, entry.source);
      if (!fs.readFileSync(file).equals(fs.readFileSync(source))) throw fail(`installed support file differs from its source: ${entry.path}`);
    }
    if (isDevelopmentMaterial(entry.path)) {
      throw fail(`installed support declaration contains development material: ${entry.path}`);
    }
  }
}

/**
 * Validate a composed release root against the same declaration the builder
 * writes. `packageRoot` is optional: when supplied, shipped bytes are compared
 * with their declared source; a delivered package can still be audited alone.
 */
export function validateRelease({ releaseRoot, packageRoot } = {}) {
  const root = assertAbsoluteDirectory(releaseRoot, "release root");
  const manifestPath = path.join(root, RELEASE_MANIFEST);
  const manifestStat = fs.lstatSync(manifestPath, { throwIfNoEntry: false });
  if (!manifestStat || manifestStat.isSymbolicLink() || !manifestStat.isFile()) throw fail("release manifest is missing or unsafe");
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
  catch (error) { throw fail(`release manifest is not valid JSON: ${error.message}`, { cause: error }); }
  assertManifestShape(manifest);
  const bundleRoot = path.join(root, BUNDLE_ROOT);
  const runnerRoot = path.join(root, RUNNER_ROOT);
  const bundle = validateSkillBundleRelease({ releaseRoot: bundleRoot });
  const runner = validateRunnerRelease({ releaseRoot: runnerRoot, skillBundleManifest: bundle });
  if (runner.version !== manifest.version) throw fail(`release version differs from the runner version: ${manifest.version} != ${runner.version}`);
  // The onboarding entry reads the installed version from runner/package.json,
  // so that file is a version source too; a fork must not pass as 1.0.0.
  const installedPackagePath = path.join(runnerRoot, "package.json");
  const installedPackageStat = fs.lstatSync(installedPackagePath, { throwIfNoEntry: false });
  if (!installedPackageStat || installedPackageStat.isSymbolicLink() || !installedPackageStat.isFile()) {
    throw fail("installed runner package.json is missing or unsafe");
  }
  let installedPackage;
  try { installedPackage = JSON.parse(fs.readFileSync(installedPackagePath, "utf8")); }
  catch (error) { throw fail(`installed runner package.json is not valid JSON: ${error.message}`, { cause: error }); }
  if (installedPackage?.version !== manifest.version) {
    throw fail(`installed runner package version differs from the release version: ${String(installedPackage?.version)} != ${manifest.version}`);
  }
  assertNoUndeclaredOuterEntry(root, manifest);
  assertOuterTree(root, manifest);
  assertOuterFiles(root, packageRoot);
  assertHostLinks(root);
  assertHostLinkTrees(root);
  assertRunnerTree(root, runner);
  assertSupportFiles(root, manifest, packageRoot);
  const source = packageRoot === undefined ? undefined : assertAbsoluteDirectory(packageRoot, "package root");
  return Object.freeze({ release: manifest.release, version: manifest.version, files: manifest.files.map((entry) => entry.path), installed_support_files: manifest.installed_support_files.map((entry) => entry.path), skill_bundle: bundle, runner, root, ...(source === undefined ? {} : { package_root: source }) });
}

/**
 * Build one complete release root: both standard inner roots from the real
 * builders, the named outer artifacts, host adaptation links and the declared
 * installed support files. The whole package is validated in a tracked staging
 * directory before it is moved into the empty output directory.
 */
export async function buildRelease({ packageRoot, outputDir } = {}) {
  const source = assertAbsoluteDirectory(packageRoot, "package root");
  const { output, created } = prepareOutput(outputDir, source);
  const stage = createTrackedTempDir("wh-c10-release-", { root: fs.realpathSync(path.dirname(output)) });
  const work = path.join(stage.path, "package");
  const moved = [];
  try {
    fs.mkdirSync(work);
    const bundleRoot = path.join(work, BUNDLE_ROOT);
    const runnerRoot = path.join(work, RUNNER_ROOT);
    const bundle = await buildSkillBundleRelease({ packageRoot: source, outputDir: bundleRoot });
    const runner = await buildRunnerRelease({ packageRoot: source, outputDir: runnerRoot });
    const support = collectSupportFiles(source, runnerRoot, bundle);
    validateRunnerRelease({ releaseRoot: runnerRoot, skillBundleManifest: bundle });
    for (const entry of OUTER_FILES) {
      const bytes = stableRead(source, entry.source, `outer source ${entry.source}`);
      copyFresh(work, entry.path, "outer artifact", bytes);
    }
    writeHostLinks(work, runnerRoot);
    writeFresh(path.join(work, RELEASE_MANIFEST), `${JSON.stringify(releaseManifest({ version: runner.version, support }), null, 2)}\n`);
    validateRelease({ releaseRoot: work, packageRoot: source });
    for (const entry of fs.readdirSync(work).sort()) {
      fs.renameSync(path.join(work, entry), path.join(output, entry));
      moved.push(entry);
    }
    const validated = validateRelease({ releaseRoot: output, packageRoot: source });
    return Object.freeze({ release_root: output, version: validated.version, files: validated.files,
      installed_support_files: validated.installed_support_files, skill_bundle: validated.skill_bundle, runner: validated.runner });
  } catch (error) {
    for (const entry of moved.reverse()) {
      try { fs.rmSync(path.join(output, entry), { recursive: true, force: true }); }
      catch (cleanupError) { process.stderr.write(`RELEASE_CLEANUP_FAILED: ${entry}: ${cleanupError.message ?? cleanupError}\n`); }
    }
    if (created) {
      try { if (fs.readdirSync(output).length === 0) fs.rmdirSync(output); }
      catch (cleanupError) { process.stderr.write(`RELEASE_CLEANUP_FAILED: ${output}: ${cleanupError.message ?? cleanupError}\n`); }
    }
    throw error;
  } finally {
    stage.dispose();
  }
}

function parseArguments(argv) {
  const values = {};
  for (const token of argv) {
    if (!token.startsWith("--")) throw fail(`unknown argument: ${token}`);
    const separator = token.indexOf("=");
    if (separator < 0) throw fail(`option requires a value: ${token}`);
    const name = token.slice(2, separator);
    if (!["output", "package-root"].includes(name)) throw fail(`unknown option: --${name}`);
    if (Object.hasOwn(values, name)) throw fail(`--${name} may be given once`);
    values[name] = token.slice(separator + 1);
  }
  if (!Object.hasOwn(values, "output")) throw fail("--output=<absolute empty directory> is required");
  return values;
}

export async function buildReleaseCliMain(argv = process.argv.slice(2)) {
  const values = parseArguments(argv);
  const packageRoot = values["package-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const result = await buildRelease({ packageRoot, outputDir: values.output });
  return Object.freeze({ release_root: result.release_root, version: result.version, outer_files: result.files,
    installed_support_files: result.installed_support_files,
    skill_bundle_files: result.skill_bundle.files.length, runner_files: result.runner.files.length });
}

function isDirectInvocation() {
  if (process.argv[1] === undefined) return false;
  try { return fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isDirectInvocation()) {
  buildReleaseCliMain()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${JSON.stringify({ code: error.code ?? "RELEASE_FAILED", message: error.message, ...(error.path ? { path: error.path } : {}) })}\n`);
      process.exitCode = 1;
    });
}
