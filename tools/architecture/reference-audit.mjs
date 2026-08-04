import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SLICES = new Set(["topology", "recovery", "pointer", "phase", "review", "journal", "projection"]);
const RETENTION_MANIFEST = "docs/architecture/retention-manifest.json";

// A slice must name the control-plane anchors it is responsible for auditing.
// An empty target list is not evidence that a retired mechanism has no users.
const TARGETS = Object.freeze({
  topology: [
    "core/chain-topology.mjs",
    "tools/cli/check-task-record-paths.mjs",
    "tools/cli/phase-gate.mjs",
  ],
  recovery: [
    "core/task-recovery.mjs",
    "scripts/task-recovery.mjs",
    "scripts/runtime-cutover.mjs",
    "core/build-spec-receipt-recovery.mjs",
    "core/schemas/workflowhub-recovery-credential.v1.json",
    "core/schemas/workflowhub-recovery-generation.v1.json",
  ],
  pointer: [
    "core/git-checkpoint.mjs",
    "runtime/task/material-revision.mjs",
    "materials/current.json",
    "requirements/current.json",
    "materials/revisions/",
  ],
  phase: [
    "runtime/review/phase-review-subject.mjs",
    "workflows/build-code/phase-evidence.mjs",
    "evidence/phases/",
  ],
  // The serious-finding pause/risk-acceptance API is a retained vNext
  // capability, not a retired review-flow consumer.
  review: [
    "reviews/flows/",
  ],
  journal: [
    "core/canonical-receipt-writer.mjs",
    "runtime/evidence/receipt-writer.mjs",
    "core/journal-appender.mjs",
    "core/audit-aggregator.mjs",
    "journal.jsonl",
  ],
  projection: [
    "core/canonical-receipt-writer.mjs",
    "runtime/evidence/receipt-writer.mjs",
    "results/make-decision/accepted.json",
    "results/build-spec/accepted.json",
    "results/build-plan/accepted.json",
    "results/build-code/accepted.json",
    "results/verify-code/accepted.json",
    "publishAttempt",
    "acceptAttempt",
    "readAcceptedAt",
  ],
});

const SCAN_ROOTS = Object.freeze([
  "core/", "runtime/", "scripts/", "tools/", "config/", "workflows/", "skills/", "tests/", "schemas/",
]);
const SCAN_ROOT_FILES = Object.freeze([
  "AGENTS.md", "CONSTITUTION.md", "constitution-checklist.md", "CONTEXT.md", "package.json", "package-lock.json",
]);
const METADATA_PREFIXES = Object.freeze(["docs/", "specs/", "evidence/", "reviews/"]);
const TEXT_FILE = /\.(?:mjs|cjs|js|ts|tsx|json|md|yaml|yml|toml|txt)$/i;
const IGNORED_PATH = /(?:^|\/)(?:node_modules|\.git)\//;
const DIAGNOSTIC_SOURCES = new Set(["tools/architecture/complexity-report.mjs"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function files(root = ROOT) {
  const out = [];
  const walk = (dir, prefix = "") => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const path = resolve(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      if (IGNORED_PATH.test(`${rel}/`)) continue;
      if (lstatSync(path).isDirectory()) walk(path, rel);
      else if (TEXT_FILE.test(rel) && (SCAN_ROOTS.some((rootPrefix) => rel.startsWith(rootPrefix)) || SCAN_ROOT_FILES.includes(rel) || METADATA_PREFIXES.some((prefix) => rel.startsWith(prefix)))) {
        out.push(rel);
      }
    }
  };
  for (const prefix of SCAN_ROOTS) walk(resolve(root, prefix.slice(0, -1)), prefix.slice(0, -1));
  for (const path of SCAN_ROOT_FILES) if (existsSync(resolve(root, path))) out.push(path);
  for (const prefix of METADATA_PREFIXES) walk(resolve(root, prefix.slice(0, -1)), prefix.slice(0, -1));
  return [...new Set(out)].sort();
}

function metadataPath(path) {
  return METADATA_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function referenceScope(path) {
  if (metadataPath(path)) return "metadata";
  if (path.startsWith("tests/") || path.includes("/__tests__/")) return "test";
  return "live";
}

function normalizedRelative(root, from, candidate) {
  if (!candidate.startsWith(".")) return null;
  const absolute = resolve(root, dirname(from), candidate);
  const value = relative(root, absolute).split(sep).join("/");
  if (value.startsWith("..") || value === "") return null;
  return value;
}

function importReferences(root, path, text) {
  const references = [];
  const quoted = /(["'])([^"'\n]+)\1/g;
  for (const match of text.matchAll(quoted)) {
    const resolved = normalizedRelative(root, path, match[2]);
    if (resolved) references.push(resolved);
  }
  return references;
}

function targetMatches(target, text, resolvedImports) {
  if (resolvedImports.includes(target)) return "relative-import";
  if (text.includes(target)) return "path-token";
  return null;
}

function violation(path, target, kind, match) {
  return { path, target, kind, match, scope: referenceScope(path) };
}

export function auditReferences({ root = ROOT, slices = [...SLICES] } = {}) {
  const normalizedSlices = [...new Set(slices)];
  const targets = [...new Set(normalizedSlices.flatMap((slice) => TARGETS[slice] ?? []))].sort();
  const live = [];
  const test = [];
  const metadata = [];
  const scanned = files(root);
  for (const path of scanned) {
    if (path === "tools/architecture/reference-audit.mjs") continue;
    const text = readFileSync(resolve(root, path), "utf8");
    const imports = importReferences(root, path, text);
    for (const target of targets) {
      const match = targetMatches(target, text, imports);
      if (!match || path === target) continue;
      const item = violation(path, target, referenceScope(path) === "metadata" ? "metadata" : "path", match);
      if (metadataPath(path)) metadata.push(item);
      else if (referenceScope(path) === "test") test.push(item);
      else live.push(item);
    }
  }
  // Keep the old diagnostic split: complexity-report is allowed to name
  // retired mechanisms so it can measure them, but it is not a live consumer.
  const ignored_violations = live.filter(({ path }) => DIAGNOSTIC_SOURCES.has(path));
  const violations = live.filter(({ path }) => !DIAGNOSTIC_SOURCES.has(path));
  const base = {
    schema_version: "workflowhub-reference-audit.v2",
    slices: normalizedSlices,
    targets,
    scanned_files: scanned.length,
    violations,
    ignored_violations,
    test_references: test,
    metadata_references: metadata,
  };
  return { ...base, content_hash: sha256(JSON.stringify(base)) };
}

export function readKeepUntilMigrationTargets({ root = ROOT, manifestRef = RETENTION_MANIFEST } = {}) {
  if (manifestRef !== RETENTION_MANIFEST) throw new TypeError(`unsupported retention manifest: ${manifestRef}`);
  const manifest = JSON.parse(readFileSync(resolve(root, manifestRef), "utf8"));
  const entries = manifest?.keep_until_migration;
  if (!Array.isArray(entries)) throw new Error("retention manifest keep_until_migration is required");
  const targets = entries.map((entry) => entry?.target);
  if (targets.some((target) => typeof target !== "string" || target.trim() === "" || target.includes("..") || target.startsWith("/"))) {
    throw new Error("retention manifest KEEP_UNTIL_MIGRATION target is invalid");
  }
  return new Set(targets);
}

export function classifyReferenceAudit(result, allowedTargets = new Set(), allowedSources = allowedTargets) {
  const allowed = result.violations.filter(({ path, target }) => allowedTargets.has(target) || allowedSources.has(path));
  const unexpected = result.violations.filter(({ path, target }) => !allowedTargets.has(target) && !allowedSources.has(path));
  const value = { ...result, allowed_violations: allowed, unexpected_violations: unexpected, allowed_targets: [...allowedTargets].sort(), allowed_sources: [...allowedSources].sort() };
  return { ...value, content_hash: sha256(JSON.stringify(value)) };
}

function main() {
  if (!process.argv.includes("--check")) throw new TypeError("usage: reference-audit.mjs --check [--slice=<slice,...>]");
  const arg = process.argv.find((item) => item.startsWith("--slice="));
  const slices = arg ? arg.slice("--slice=".length).split(",").filter(Boolean) : [...SLICES];
  const unknown = slices.filter((slice) => !SLICES.has(slice));
  if (unknown.length) throw new TypeError(`unknown reference audit slice: ${unknown.join(",")}`);
  const allowArg = process.argv.find((item) => item.startsWith("--allow-keep-until-migration="));
  const manifestRef = allowArg?.slice("--allow-keep-until-migration=".length);
  const allowedTargets = manifestRef === undefined ? new Set() : readKeepUntilMigrationTargets({ manifestRef });
  const result = classifyReferenceAudit(auditReferences({ slices }), allowedTargets);
  console.log(JSON.stringify(result, null, 2));
  if (result.unexpected_violations.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
