#!/usr/bin/env node
// C10 P4 skill manifests. `repo-skills.manifest.json` is a projection derived
// from the real catalog and reuse registry (never a second source).
// `external-skills.manifest.json` is the one hand-maintained pointer list; this
// tool validates it and compares the projection with the on-disk file.
//
// Why this is not a replacement for tools/cli/check-skill-consistency.mjs:
// that existing checker is a report-only consistency scanner (catalog/bundle
// shape, stage dependencies, template prose) and does not emit a release
// projection or compare on-disk manifest rows. This tool consumes the same
// catalog/reuse bytes, adds the release projection and the named row diff, and
// does not suppress or reimplement the existing checker. Both remain runnable;
// neither is a second source of truth.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import { withLock } from "../../runtime/interface/record-lock.mjs";
import { parseSemver } from "../../runtime/distribution/update-check.mjs";

const CATALOG = "skills/catalog.yaml";
const REUSE = "skills/reuse-registry.md";
const REPO_MANIFEST = "repo-skills.manifest.json";
const EXTERNAL_MANIFEST = "external-skills.manifest.json";
const EXTERNAL_KINDS = new Set(["review-cli", "host-agent", "browser", "search-cli", "review-provider"]);
const ENTRY_KEYS = new Set(["id", "kind", "source", "version", "minimum_version", "version_basis", "modification", "rights", "rights_basis", "matrix_ref"]);

function manifestError(message) {
  return Object.assign(new Error(message), { code: "MANIFEST_INVALID" });
}

function readBytes(root, relative) {
  const absolute = path.join(root, relative);
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink() || !stat.isFile()) throw manifestError(`manifest source is missing or unsafe: ${relative}`);
  return fs.readFileSync(absolute);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function optional(value) {
  return value === undefined ? null : value;
}

/** Normalize one catalog upstream registration without inventing a version, range or grant. */
function projectUpstream(entry) {
  return {
    github_url: optional(entry?.github_url),
    commit: optional(entry?.commit),
    path: optional(entry?.path),
    license: optional(entry?.license),
    reviewed_at: optional(entry?.reviewed_at),
    review_outcome: optional(entry?.review_outcome),
  };
}

function reuseEntries(root) {
  const text = readBytes(root, REUSE).toString("utf8");
  const rows = [...text.matchAll(/^\|\s*([a-z][a-z0-9-]*)\s*\|[^\n]*?\[读取正文\]\(([^)\s]+)\)/gmu)];
  const seen = new Set();
  const entries = [];
  for (const match of rows) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const target = match[2].replace(/#.*$/u, "");
    const relative = target.startsWith("../") ? target.slice(3) : `skills/${target}`;
    if (!/^(?:skills|workflows)\//.test(relative) || relative.split("/").includes("..")) {
      throw manifestError(`reuse registry entry has an invalid target: ${name} -> ${target}`);
    }
    entries.push({ name, entry: relative });
  }
  entries.sort((left, right) => left.name.localeCompare(right.name));
  return entries;
}

/**
 * Derive the repository manifest projection from the real catalog and reuse
 * registry. This is the only writer of that projection.
 */
export function projectRepoSkills({ packageRoot } = {}) {
  if (typeof packageRoot !== "string" || !path.isAbsolute(packageRoot)) throw manifestError("packageRoot must be an absolute path");
  const root = fs.realpathSync(packageRoot);
  const catalogBytes = readBytes(root, CATALOG);
  const reuseBytes = readBytes(root, REUSE);
  const catalog = yaml.load(catalogBytes.toString("utf8"));
  if (!catalog || !Array.isArray(catalog.skills)) throw manifestError(`${CATALOG} current skills must be an array`);
  const names = new Set();
  const skills = catalog.skills.map((entry, index) => {
    const name = entry?.name;
    if (typeof name !== "string" || !/^[a-z][a-z0-9-]*$/.test(name)) throw manifestError(`catalog skill ${index + 1} has no valid name`);
    if (names.has(name)) throw manifestError(`catalog skill is duplicated: ${name}`);
    names.add(name);
    // A missing local_version is an honest unknown, not a guessed version. A
    // present but malformed value is a source error.
    const localVersion = entry.local_version;
    if (localVersion !== undefined && localVersion !== null && (typeof localVersion !== "string" || !parseSemver(localVersion))) {
      throw manifestError(`catalog skill ${name} has an invalid local_version`);
    }
    if (!Array.isArray(entry.used_by_stages)) throw manifestError(`catalog skill ${name} used_by_stages must be an array`);
    if (!Array.isArray(entry.dependency_closure)) throw manifestError(`catalog skill ${name} dependency_closure must be an array`);
    const upstream = Array.isArray(entry.upstream) ? entry.upstream : [];
    return {
      name,
      path: typeof entry.path === "string" ? entry.path : null,
      local_version: typeof localVersion === "string" ? localVersion : null,
      status: entry.status ?? null,
      used_by_stages: [...new Set(entry.used_by_stages)].sort(),
      dependency_closure: [...new Set(entry.dependency_closure)].sort(),
      local_changes: typeof entry.local_changes === "string" ? entry.local_changes : null,
      upstream: upstream.map(projectUpstream),
    };
  });
  skills.sort((left, right) => left.name.localeCompare(right.name));
  return {
    schema_version: 1,
    kind: "repo-skills",
    source: CATALOG,
    derived_from: {
      catalog: CATALOG,
      catalog_sha256: sha256(catalogBytes),
      reuse_registry: REUSE,
      reuse_registry_sha256: sha256(reuseBytes),
    },
    skills,
    reuse_entries: reuseEntries(root),
  };
}

function slugifyHeading(text) {
  return text.toLowerCase().replace(/[`*_]/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
}

function matrixAnchorExists(root, matrixRef) {
  const match = /^([^#]+\.md)#([a-z0-9-]+)$/u.exec(matrixRef);
  if (!match) return false;
  const file = path.join(root, match[1]);
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink() || !stat.isFile()) return false;
  const headings = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((line) => /^#{1,6}\s+\S/.test(line));
  return headings.some((line) => slugifyHeading(line.replace(/^#{1,6}\s+/, "")) === match[2]);
}

/** Validate the single human-maintained external manifest; no value is derived from the catalog here. */
export function validateExternalSkillsManifest({ packageRoot, value } = {}) {
  const failures = [];
  const fail = (message) => failures.push(`external-skills.manifest.json: ${message}`);
  if (typeof packageRoot !== "string" || !path.isAbsolute(packageRoot)) {
    return { failures: ["external-skills.manifest.json: packageRoot must be an absolute path"] };
  }
  const root = fs.realpathSync(packageRoot);
  if (!value || typeof value !== "object" || Array.isArray(value)) return { failures: ["external-skills.manifest.json: root must be an object"] };
  const topKeys = new Set(["schema_version", "kind", "maintenance", "entries"]);
  if (value.schema_version !== 1 || value.kind !== "external-tools" || Object.keys(value).some((key) => !topKeys.has(key))) {
    fail("schema_version/kind/keys are invalid");
  }
  if (typeof value.maintenance !== "string" || !/human|人工/i.test(value.maintenance)) {
    fail("maintenance must state that this file is hand-maintained");
  }
  if (!Array.isArray(value.entries) || value.entries.length === 0) {
    fail("entries must be a non-empty array");
    return { failures };
  }
  const ids = new Set();
  for (const entry of value.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) { fail("entry must be an object"); continue; }
    const label = typeof entry.id === "string" ? entry.id : "<unnamed>";
    if (Object.keys(entry).some((key) => !ENTRY_KEYS.has(key))) fail(`${label}: entry has an unknown field`);
    if (typeof entry.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(entry.id)) fail(`${label}: id is invalid`);
    else if (ids.has(entry.id)) fail(`${label}: id is duplicated`);
    else ids.add(entry.id);
    if (!EXTERNAL_KINDS.has(entry.kind)) fail(`${label}: kind is not a declared external tool class`);
    if (typeof entry.source !== "string" || !/^https:\/\/[^\s]+$/.test(entry.source)) {
      fail(`${label}: source must be an explicit https source pointer`);
    }
    if (entry.version !== "unknown" && (typeof entry.version !== "string" || !parseSemver(entry.version))) {
      fail(`${label}: version must be a semantic version or "unknown"`);
    }
    if (entry.minimum_version !== undefined && entry.minimum_version !== "unknown"
        && (typeof entry.minimum_version !== "string" || !parseSemver(entry.minimum_version))) {
      fail(`${label}: minimum_version must be a semantic version or "unknown"`);
    }
    if (typeof entry.version_basis !== "string" || entry.version_basis.trim() === "") fail(`${label}: version_basis is required`);
    if (typeof entry.modification !== "string" || entry.modification.trim() === "") fail(`${label}: modification must be stated (use "unknown" if unproven)`);
    if (entry.rights !== "unknown") {
      fail(`${label}: rights must stay "unknown" until a real grant source is recorded; installed bytes or an adjacent LICENSE are not a grant`);
    }
    if (typeof entry.rights_basis !== "string" || entry.rights_basis.trim() === "") fail(`${label}: rights_basis is required`);
    if (entry.matrix_ref !== undefined) {
      if (typeof entry.matrix_ref !== "string" || !matrixAnchorExists(root, entry.matrix_ref)) {
        fail(`${label}: matrix_ref does not point at a readable compatibility matrix section`);
      }
    }
  }
  return { failures };
}

function diffValues(expected, actual, prefix, failures) {
  if (expected === null || typeof expected !== "object") {
    if (JSON.stringify(expected) !== JSON.stringify(actual)) failures.push(`${prefix}: projection differs from the derived source`);
    return;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      failures.push(`${prefix}: projection differs from the derived source`);
      return;
    }
    expected.forEach((item, index) => {
      const key = item && typeof item === "object" && typeof item.name === "string" ? item.name : `[${index}]`;
      diffValues(item, actual[index], typeof key === "string" && key.startsWith("[") ? `${prefix}${key}` : `${prefix}.${key}`, failures);
    });
    return;
  }
  if (!actual || typeof actual !== "object" || Array.isArray(actual)) {
    failures.push(`${prefix}: projection differs from the derived source`);
    return;
  }
  for (const key of Object.keys(expected)) diffValues(expected[key], actual[key], `${prefix}.${key}`, failures);
  for (const key of Object.keys(actual)) if (!Object.hasOwn(expected, key)) failures.push(`${prefix}.${key}: unexpected projected field`);
}

function readJsonFile(root, relative) {
  const bytes = readBytes(root, relative);
  try { return JSON.parse(bytes.toString("utf8")); }
  catch (error) { throw manifestError(`${relative} is not valid JSON: ${error.message}`); }
}

/**
 * Compare the derived repository projection and the external manifest with the
 * files on disk. Any changed named version/source row is a failure.
 */
export function checkSkillManifests({ packageRoot } = {}) {
  if (typeof packageRoot !== "string" || !path.isAbsolute(packageRoot)) throw manifestError("packageRoot must be an absolute path");
  const root = fs.realpathSync(packageRoot);
  const failures = [];
  const expected = projectRepoSkills({ packageRoot: root });
  const onDisk = readJsonFile(root, REPO_MANIFEST);
  if (JSON.stringify(onDisk) !== JSON.stringify(expected)) {
    failures.push(`${REPO_MANIFEST}: repository manifest does not match the derived catalog/reuse projection`);
    diffValues(expected, onDisk, REPO_MANIFEST.replace(/\.json$/u, ""), failures);
  }
  for (const skill of expected.skills) {
    // A retired catalog row without a path is an honest "not shipped" fact, not
    // a missing source: it stays visible as null.
    if (skill.path === null) continue;
    const stat = fs.lstatSync(path.join(root, skill.path), { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isFile()) failures.push(`${skill.name}: declared catalog path is missing or unsafe: ${skill.path}`);
    for (const [index, upstream] of skill.upstream.entries()) {
      if (upstream.commit !== null && !/^[a-f0-9]{40,64}$/u.test(upstream.commit) && !/^(?:unknown|local)$/u.test(upstream.commit)) {
        failures.push(`${skill.name}: upstream[${index}].commit is not a real revision or an honest unknown`);
      }
      if (upstream.github_url !== null && !/^https:\/\//u.test(upstream.github_url)) {
        failures.push(`${skill.name}: upstream[${index}].github_url is not a readable source pointer`);
      }
    }
  }
  for (const entry of expected.reuse_entries) {
    const stat = fs.lstatSync(path.join(root, entry.entry), { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isFile()) failures.push(`${entry.name}: reuse registry entry target is missing or unsafe: ${entry.entry}`);
  }
  const external = readJsonFile(root, EXTERNAL_MANIFEST);
  failures.push(...validateExternalSkillsManifest({ packageRoot: root, value: external }).failures);
  return { ok: failures.length === 0, failures, manifest: expected };
}

async function writeRepoManifest({ packageRoot }) {
  const root = fs.realpathSync(packageRoot);
  const expected = projectRepoSkills({ packageRoot: root });
  const bytes = `${JSON.stringify(expected, null, 2)}\n`;
  await withLock(root, "skill-manifests", async () => {
    fs.writeFileSync(path.join(root, REPO_MANIFEST), bytes);
  });
  return expected;
}

function parseArguments(argv) {
  const values = { check: false };
  for (const token of argv) {
    if (token === "--check") { values.check = true; continue; }
    if (token === "--help" || token === "-h") { values.help = true; continue; }
    if (!token.startsWith("--root=")) throw manifestError(`unknown argument: ${token}`);
    if (Object.hasOwn(values, "root")) throw manifestError("--root may be given once");
    values.root = token.slice("--root=".length);
    if (!path.isAbsolute(values.root)) throw manifestError("--root must be an absolute path");
  }
  return values;
}

export async function buildSkillManifestsCliMain(argv = process.argv.slice(2)) {
  const values = parseArguments(argv);
  const packageRoot = values.root ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  if (values.help) {
    return Object.freeze({ usage: "node tools/cli/build-skill-manifests.mjs [--check] [--root=<absolute package root>]",
      notes: ["the repository manifest is derived from catalog/reuse; do not edit it by hand",
        "the external manifest is the single hand-maintained pointer list; rights stay unknown until a real grant is recorded"] });
  }
  const external = readJsonFile(fs.realpathSync(packageRoot), EXTERNAL_MANIFEST);
  const externalFailures = validateExternalSkillsManifest({ packageRoot, value: external }).failures;
  if (externalFailures.length) {
    for (const failure of externalFailures) process.stderr.write(`[build-skill-manifests] FAIL ${failure}\n`);
    return Object.freeze({ mode: "check", ok: false, failures: externalFailures });
  }
  if (!values.check) {
    const manifest = await writeRepoManifest({ packageRoot });
    process.stdout.write(`[build-skill-manifests] wrote ${REPO_MANIFEST} for ${manifest.skills.length} catalog skills (external manifest validated)\n`);
    return Object.freeze({ mode: "write", ok: true, failures: [], skills: manifest.skills.length });
  }
  const result = checkSkillManifests({ packageRoot });
  for (const failure of result.failures) process.stderr.write(`[build-skill-manifests] FAIL ${failure}\n`);
  if (result.ok) process.stdout.write(`[build-skill-manifests] manifest check passed: ${result.manifest.skills.length} repository skills, ${external.entries.length} external entries\n`);
  return Object.freeze({ mode: "check", ok: result.ok, failures: result.failures, skills: result.manifest.skills.length, external_entries: external.entries.length });
}

function isDirectInvocation() {
  if (process.argv[1] === undefined) return false;
  try { return fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isDirectInvocation()) {
  buildSkillManifestsCliMain()
    .then((result) => {
      if (result.usage) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = result.ok === false ? 1 : 0;
    })
    .catch((error) => {
      process.stderr.write(`[build-skill-manifests] FAIL ${error.code ?? "MANIFEST_FAILED"}: ${error.message}\n`);
      process.exitCode = 1;
    });
}
