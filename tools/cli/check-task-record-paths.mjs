#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
// The explicit --root path is used by fixture tests; the default is the
// repository root, two levels above tools/cli/ after the CLI relocation.
const repoRoot = resolve(rootIndex >= 0 && args[rootIndex + 1] ? args[rootIndex + 1] : join(here, "..", ".."));

const STAGES = [
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
];

const RUNTIME_SIDECARS_AND_HELPERS = [
  // Production runtime moved out of core/; keep the static guard over the
  // entire runtime tree so the migration cannot silently create an unscanned
  // authority boundary.
  "runtime",
  "metrics/collector.mjs",
  "workflows/build-code",
  "workflows/verify-code",
  "scripts/ci",
];

// Historical spellings are allowed only in immutable migration inputs. Every
// exception is a reviewed file, never a directory-wide test/archive bypass.
const FIXTURE_ALLOWLIST = new Set([
  "tests/fixtures/task-path-legacy-input.json",
  "core/__tests__/artifact-dir.test.mjs",
  "core/__tests__/runtime-mode.test.mjs",
  "core/__tests__/storage-root.test.mjs",
  "core/__tests__/check-anti-host.test.mjs",
  "core/__tests__/check-contract.test.mjs",
  "core/__tests__/check-extensibility.test.mjs",
  "core/__tests__/check-skill-closure.test.mjs",
  "core/__tests__/kernel.test.mjs",
  "core/__tests__/invocation-identity.test.mjs",
  "core/__tests__/local-skill-resolver.test.mjs",
  "core/__tests__/parse-framework-config.test.mjs",
  "core/__tests__/resolve-path.test.mjs",
  "core/__tests__/runtime-mode.test.mjs",
  "core/__tests__/skill-static-deps.test.mjs",
  "core/__tests__/stage-skill-runtime.test.mjs",
  "core/__tests__/task-identity.test.mjs",
  "core/__tests__/task-index.test.mjs",
  "core/__tests__/task-kernel-security.test.mjs",
  "core/__tests__/workspace-manager.test.mjs",
  "core/__tests__/workspace-runner.test.mjs",
  "scripts/__tests__/canonical-archive-skill-dispatch.test.mjs",
  "scripts/__tests__/task-bootstrap.test.mjs",
  "skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs",
  "skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs",
  "skills/wh-review/scripts/__tests__/review-runner.test.mjs",
  "skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs",
  "skills/wh-review/scripts/__tests__/review-runner.test.mjs",
  "skills/wh-review/scripts/__tests__/simple-contracts.test.mjs",
  "skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs",
  "skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs",
  "skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs",
]);

// These modules implement the authority boundary itself. They are scanned for
// every legacy mechanism, but may name the capability they mint/validate.
const CAPABILITY_AUTHORITIES = new Map([
  ["runtime/evidence/storage-root.mjs", new Set(["stage/component must not read the storage-root environment"])],
  ["runtime/task/task-identity.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["runtime/task/task-handle.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["runtime/stage/stage-context.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/runtime-mode.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["runtime/evidence/write-boundary-preflight.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["runtime/evidence/invocation-identity.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["runtime/evidence/stage-content-evidence.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["runtime/stage/step-manifest.mjs", new Set(["cwd identity discovery"])],
  ["skills/wh-review/scripts/wh-review-cli.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs", new Set(["cwd identity discovery"])],
]);

// Every production module using direct filesystem mutation must be classified.
// Task/product records belong behind TaskHandle/ArtifactDir. The remaining
// entries are trusted infrastructure or explicit test/development fixtures.
const DIRECT_WRITER_AUTHORITIES = new Map([
  // "specs" literal derivation belongs exclusively to this authority.
  ["runtime/task/task-handle.mjs", "TaskHandle record authority"],
  ["runtime/task/material-workspace.mjs", "current material workspace authority"],
  ["runtime/task/task-store.mjs", "task record storage authority"],
  ["runtime/evidence/quality-store.mjs", "quality fact storage authority"],
  ["core/artifact-dir.mjs", "ArtifactDir product authority"],
  ["runtime/evidence/canonical-receipt-writer.mjs", "canonical evidence authority"],
  ["runtime/task/git-worktree-snapshot.mjs", "private Git snapshot temp index"],
  ["workflows/build-code/diff-scanner.mjs", "private Git diff scan temp file"],
  ["core/task-close.mjs", "confirmed plan-bound delivery close authority"],
  ["runtime/task/workspace.mjs", "authenticated worktree cleanup authority"],
  ["metrics/collector.mjs", "launcher-branded global metrics authority"],
  ["skills/wh-review/scripts/review-materials.mjs", "trusted attachment packet authority"],
  ["skills/wh-review/scripts/review-runner.mjs", "trusted attachment ephemeral review coordination lock"],
  ["skills/wh-review/scripts/review-provider-client.mjs", "private provider transport temp files"],
  ["skills/wh-review/scripts/review-source.mjs", "private Git snapshot temp index"],
  ["tools/cli/check-extensibility.mjs", "development checker fixture"],
  ["tools/cli/check-stage-quality.mjs", "development checker fixture"],
  ["tools/cli/check-task-record-paths.mjs", "development static guard"],
  ["core/runtime-mode.mjs", "global runtime cutover authority"],
  ["runtime/distribution/runner-release.mjs", "deterministic runner distribution builder"],
  ["tools/cli/run-wh-review-audit-e2e.mjs", "explicit fake-broker test fixture"],
  ["tools/cli/run-wh-review-provider-smoke.mjs", "explicit provider smoke fixture"],
  ["tools/cli/smoke-local-skill-dispatch.mjs", "explicit local dispatch fixture"],
  ["workflows/_spike/intake.mjs", "archived spike fixture"],
  ["workflows/_spike/design.mjs", "archived spike fixture"],
  ["workflows/_spike/design-variant.mjs", "archived spike fixture"],
]);

const GLOBAL_IDENTITY_DISCOVERY_ALLOWLIST = new Map([
  ["runtime/evidence/storage-root.mjs", "the launcher storage-root authority"],
  ["runtime/stage/step-manifest.mjs", "repository-local development manifest loader"],
  ["tools/cli/check-task-record-paths.mjs", "the static guard contains its own signatures"],
  ["tools/cli/smoke-local-skill-dispatch.mjs", "development fixture restores its original cwd"],
  ["skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs", "explicit Multica synchronization launcher"],
]);

const FORBIDDEN_PATTERNS = [
  [/core\/task-dir-parser\.mjs|\bparseTaskDir\b/, "legacy task-dir parser"],
  [/core\/task-record-paths\.mjs|\bresolveTaskRecordPaths\b|\btaskRecordPath\b/, "legacy task-record resolver"],
  [/\bWORKFLOWHUB_TASK_TRACKING_ROOT\b/, "unsupported task tracking environment variable"],
  [/\bWORKFLOWHUB_TASK_DIR\b/, "stage/component must not read the storage-root environment"],
  [/\btask_tracking_root\b|\btaskTrackingRoot\b/, "legacy project task-root identity"],
  [/\bworktree\.json\b/, "legacy standalone worktree identity"],
  [/\bprocess\.cwd\s*\(/, "cwd identity discovery"],
  [/git\s+(?:config\s+--get\s+remote\.|remote\b)/i, "Git remote identity discovery"],
  [/\b(?:storageRoot|taskPath)\b/, "caller-supplied storage/task path capability"],
];

function walk(path, output = []) {
  if (!existsSync(path)) return output;
  const stat = statSync(path);
  if (stat.isFile()) {
    if (/\.(?:mjs|js|cjs|ts|md|json|ya?ml)$/.test(path)) output.push(path);
    return output;
  }
  for (const entry of readdirSync(path)) {
    if (["node_modules", ".git", "archive"].includes(entry)) continue;
    walk(join(path, entry), output);
  }
  return output;
}

function withoutFencedExamples(content) {
  return content.replace(/```[\s\S]*?```/g, (block) => {
    // Executable examples are contract surface. Keep code-looking blocks; drop
    // JSON result examples to avoid treating historical field payloads as calls.
    return /^```(?:json|text)\b/i.test(block) ? "" : block;
  });
}

function runtimeFiles() {
  const files = new Set();
  const componentNames = new Set();
  for (const stage of STAGES) {
    const workflowRoot = resolve(repoRoot, "workflows", stage);
    for (const file of walk(workflowRoot)) files.add(file);
    const contract = readFileSync(resolve(workflowRoot, "SKILL.md"), "utf8");
    const declaration = contract.match(/Declared runtime components:\s*([^\n]+)/i)?.[1] ?? "";
    for (const match of declaration.matchAll(/`([^`]+)`/g)) componentNames.add(match[1]);
  }
  for (const name of componentNames) {
    const root = `skills/${name}`;
    if (!existsSync(resolve(repoRoot, root))) continue;
    for (const file of walk(resolve(repoRoot, root))) files.add(file);
  }
  for (const root of RUNTIME_SIDECARS_AND_HELPERS) {
    for (const file of walk(resolve(repoRoot, root))) files.add(file);
  }

  // Follow local module edges after collecting workflow contracts, component
  // manifests and explicit sidecars. This catches helpers imported outside the
  // component directory instead of trusting a fixed-root approximation.
  const queue = [...files];
  const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while (queue.length) {
    const importer = queue.pop();
    if (!/[.](?:mjs|js|cjs|ts)$/.test(importer)) continue;
    const content = readFileSync(importer, "utf8");
    for (const match of content.matchAll(importPattern)) {
      const specifier = match[1] ?? match[2];
      if (!specifier?.startsWith(".")) continue;
      const base = resolve(dirname(importer), specifier);
      const candidates = extname(base) ? [base] : [base, `${base}.mjs`, `${base}.js`, `${base}.cjs`, `${base}.ts`, join(base, "index.mjs"), join(base, "index.js")];
      const dependency = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
      if (!dependency || files.has(dependency)) continue;
      files.add(dependency);
      queue.push(dependency);
    }
  }
  return [...files];
}

function checkRuntimeContracts() {
  const failures = [];
  for (const file of runtimeFiles()) {
    const rel = relative(repoRoot, file).replaceAll("\\", "/");
    if (FIXTURE_ALLOWLIST.has(rel)) continue;
    const content = withoutFencedExamples(readFileSync(file, "utf8"));
    for (const [pattern, reason] of FORBIDDEN_PATTERNS) {
      if (CAPABILITY_AUTHORITIES.get(rel)?.has(reason)) continue;
      if (pattern.test(content)) failures.push(`${rel}: ${reason}`);
    }
  }
  return failures;
}

function checkUniqueTaskPathDerivation() {
  const failures = [];
  const roots = ["core", "runtime", "scripts", "workflows", "skills"];
  const allowed = new Set(["runtime/task/task-identity.mjs"]);
  const literalTasksJoin = /\b(?:join|resolve)\s*\([^;\n]*(?:"tasks"|'tasks'|`tasks`)/g;
  for (const root of roots) {
    for (const file of walk(resolve(repoRoot, root))) {
      const rel = relative(repoRoot, file).replaceAll("\\", "/");
      if (allowed.has(rel) || FIXTURE_ALLOWLIST.has(rel)) continue;
      const content = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");
      if (literalTasksJoin.test(content)) {
        failures.push(`${rel}: literal tasks path derivation is only legal in runtime/task/task-identity.mjs`);
      }
      literalTasksJoin.lastIndex = 0;
    }
  }
  return failures;
}

function checkUniqueSpecsPathDerivation() {
  const failures = [];
  const allowed = new Set([
    "core/artifact-dir.mjs",
    "runtime/stage/stage-handlers.mjs",
    "runtime/task/task-kernel-implementation.mjs",
    "skills/wh-review/scripts/integration-review-subject.mjs",
  ]);
  for (const root of ["core", "runtime", "scripts", "workflows", "skills"]) {
    for (const file of walk(resolve(repoRoot, root))) {
      const rel = relative(repoRoot, file).replaceAll("\\", "/");
      if (allowed.has(rel) || FIXTURE_ALLOWLIST.has(rel)) continue;
      const content = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      if (/\b(?:join|resolve)\s*\([^;\n]*(?:"specs"|'specs'|`specs`)|`specs\//.test(content)) failures.push(`${rel}: literal specs path derivation is only legal in core/artifact-dir.mjs`);
    }
  }
  return failures;
}

function checkGlobalDirectWriters() {
  const failures = [];
  const directMutation = /\b(?:writeFileSync|appendFileSync|createWriteStream|renameSync|mkdirSync|rmSync|unlinkSync|openSync)\b/;
  for (const root of ["core", "runtime", "scripts", "workflows", "skills", "metrics"]) {
    for (const file of walk(resolve(repoRoot, root))) {
      const rel = relative(repoRoot, file).replaceAll("\\", "/");
      if (FIXTURE_ALLOWLIST.has(rel)) continue;
      const content = readFileSync(file, "utf8");
      if (directMutation.test(content) && !DIRECT_WRITER_AUTHORITIES.has(rel)) {
        failures.push(`${rel}: unclassified direct filesystem writer; use TaskHandle/ArtifactDir or classify trusted infrastructure`);
      }
    }
  }
  return failures;
}

function checkGlobalIdentityDiscovery() {
  const failures = [];
  const patterns = [
    [/\bprocess\.cwd\s*\(/, "cwd identity discovery"],
    [/\bWORKFLOWHUB_TASK_TRACKING_ROOT\b/, "unsupported task tracking environment variable"],
    [/\bWORKFLOWHUB_TASK_DIR\b/, "stage/component must not read the storage-root environment"],
    [/git\s+(?:config\s+--get\s+remote\.|remote\b)/i, "Git remote identity discovery"],
  ];
  for (const root of ["core", "runtime", "scripts", "workflows", "skills", "metrics"]) {
    for (const file of walk(resolve(repoRoot, root))) {
      const rel = relative(repoRoot, file).replaceAll("\\", "/");
      if (FIXTURE_ALLOWLIST.has(rel) || GLOBAL_IDENTITY_DISCOVERY_ALLOWLIST.has(rel)) continue;
      const content = withoutFencedExamples(readFileSync(file, "utf8"));
      for (const [pattern, reason] of patterns) {
        if (pattern.test(content)) failures.push(`${rel}: ${reason}`);
      }
    }
  }
  return failures;
}

const failures = [
  ...checkRuntimeContracts(),
  ...checkUniqueTaskPathDerivation(),
  ...checkUniqueSpecsPathDerivation(),
  ...checkGlobalDirectWriters(),
  ...checkGlobalIdentityDiscovery(),
];

if (failures.length > 0) {
  for (const failure of failures) console.error(`[check-task-record-paths] FAIL: ${failure}`);
  process.exit(1);
}
console.log("[check-task-record-paths] PASS: TaskContext is the only stage path contract");
