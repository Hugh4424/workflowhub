#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const repoRoot = resolve(rootIndex >= 0 && args[rootIndex + 1] ? args[rootIndex + 1] : join(here, ".."));

const STAGES = [
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
];

const RUNTIME_SIDECARS_AND_HELPERS = [
  "core/journal-appender.mjs",
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
  "core/__tests__/receipt-writer.test.mjs",
  "core/__tests__/runtime-mode.test.mjs",
  "core/__tests__/storage-root.test.mjs",
  "core/__tests__/stage-context.test.mjs",
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
  "core/__tests__/task-handle.test.mjs",
  "core/__tests__/task-kernel-publish.test.mjs",
  "core/__tests__/task-kernel-security.test.mjs",
  "core/__tests__/task-target-repo-migration.test.mjs",
  "core/__tests__/task-runner-root-migration.test.mjs",
  "core/__tests__/task-recovery.test.mjs",
  "core/__tests__/workspace-manager.test.mjs",
  "core/__tests__/workspace-runner.test.mjs",
  "scripts/__tests__/ci-chain-check.test.mjs",
  "scripts/__tests__/canonical-archive-skill-dispatch.test.mjs",
  "scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs",
  "scripts/__tests__/stage-runtime-spec-recovery.test.mjs",
  "scripts/__tests__/stage-runtime-recover-run.test.mjs",
  "scripts/__tests__/task-bootstrap.test.mjs",
  "scripts/__tests__/task-recovery.test.mjs",
  "scripts/__tests__/migrate-task-v2.test.mjs",
  "scripts/__tests__/runner-replacement-bridge.test.mjs",
  "scripts/__tests__/runner-unbinding-migration.test.mjs",
  "skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs",
  "skills/wh-review/scripts/__tests__/review-runner.test.mjs",
  "skills/wh-review/scripts/__tests__/review-source-materials.test.mjs",
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
  ["core/storage-root.mjs", new Set(["stage/component must not read the storage-root environment"])],
  ["core/task-identity.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/task-handle.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/stage-context.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/runtime-mode.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/write-boundary-preflight.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/invocation-identity.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/stage-content-evidence.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["core/step-manifest.mjs", new Set(["cwd identity discovery"])],
  ["scripts/task-migrate-runner-root.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["skills/wh-review/scripts/wh-review-cli.mjs", new Set(["caller-supplied storage/task path capability"])],
  ["skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs", new Set(["cwd identity discovery"])],
]);

// Every production module using direct filesystem mutation must be classified.
// Task/product records belong behind TaskHandle/ArtifactDir. The remaining
// entries are trusted infrastructure or explicit test/development fixtures.
const DIRECT_WRITER_AUTHORITIES = new Map([
  // "specs" literal derivation belongs exclusively to this authority.
  ["core/task-handle.mjs", "TaskHandle record authority"],
  ["core/artifact-dir.mjs", "ArtifactDir product authority"],
  ["core/git-checkpoint.mjs", "verified Git checkpoint authority"],
  ["core/canonical-receipt-writer.mjs", "canonical evidence authority"],
  ["core/git-worktree-snapshot.mjs", "private Git snapshot temp index"],
  ["workflows/build-code/diff-scanner.mjs", "private Git diff scan temp file"],
  ["core/task-close.mjs", "confirmed plan-bound delivery close authority"],
  ["metrics/collector.mjs", "launcher-branded global metrics authority"],
  ["skills/wh-review/scripts/review-materials.mjs", "trusted attachment packet authority"],
  ["skills/wh-review/scripts/review-provider-client.mjs", "private provider transport temp files"],
  ["skills/wh-review/scripts/review-source.mjs", "private Git snapshot temp index"],
  ["scripts/check-extensibility.mjs", "development checker fixture"],
  ["scripts/check-stage-quality.mjs", "development checker fixture"],
  ["scripts/check-task-record-paths.mjs", "development static guard"],
  ["scripts/migrate-task-v2.mjs", "one-shot journaled legacy migration authority"],
  ["core/runtime-mode.mjs", "global runtime cutover authority"],
  ["core/runner-release.mjs", "deterministic runner distribution builder"],
  ["workflows/build-code/phase-evidence.mjs", "authenticated Phase evidence writer"],
  ["scripts/task-migrate-target-repo.mjs", "official target repository migration launcher"],
  ["scripts/run-wh-review-audit-e2e.mjs", "explicit fake-broker test fixture"],
  ["scripts/run-wh-review-provider-smoke.mjs", "explicit provider smoke fixture"],
  ["scripts/smoke-local-skill-dispatch.mjs", "explicit local dispatch fixture"],
  ["workflows/_spike/intake.mjs", "archived spike fixture"],
  ["workflows/_spike/design.mjs", "archived spike fixture"],
  ["workflows/_spike/design-variant.mjs", "archived spike fixture"],
]);

const GLOBAL_IDENTITY_DISCOVERY_ALLOWLIST = new Map([
  ["core/storage-root.mjs", "the launcher storage-root authority"],
  ["core/step-manifest.mjs", "repository-local development manifest loader"],
  ["scripts/check-task-record-paths.mjs", "the static guard contains its own signatures"],
  ["scripts/smoke-local-skill-dispatch.mjs", "development fixture restores its original cwd"],
  ["skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs", "explicit Multica synchronization launcher"],
]);

const REQUIRED_STAGE_MARKERS = [
  "core/stage-context.mjs",
  "bootstrapStage",
  "StageContext",
];

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

function checkStages() {
  const failures = [];
  for (const stage of STAGES) {
    const rel = `workflows/${stage}/SKILL.md`;
    const full = resolve(repoRoot, rel);
    if (!existsSync(full)) {
      failures.push(`${rel}: missing workflow contract`);
      continue;
    }
    const content = readFileSync(full, "utf8");
    for (const marker of REQUIRED_STAGE_MARKERS) {
      if (!content.includes(marker)) failures.push(`${rel}: missing required marker "${marker}"`);
    }
  }
  return failures;
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
  const roots = ["core", "scripts", "workflows", "skills"];
  const allowed = new Set(["core/task-identity.mjs", "scripts/validate-stage-replay.mjs"]);
  const literalTasksJoin = /\b(?:join|resolve)\s*\([^;\n]*(?:"tasks"|'tasks'|`tasks`)/g;
  for (const root of roots) {
    for (const file of walk(resolve(repoRoot, root))) {
      const rel = relative(repoRoot, file).replaceAll("\\", "/");
      if (allowed.has(rel) || FIXTURE_ALLOWLIST.has(rel)) continue;
      const content = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");
      if (literalTasksJoin.test(content)) {
        failures.push(`${rel}: literal tasks path derivation is only legal in core/task-identity.mjs`);
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
    "core/stage-handlers.mjs",
    "core/task-kernel-implementation.mjs",
    "workflows/build-code/phase-evidence.mjs",
    "skills/wh-review/scripts/integration-review-subject.mjs",
  ]);
  for (const root of ["core", "scripts", "workflows", "skills"]) {
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
  for (const root of ["core", "scripts", "workflows", "skills", "metrics"]) {
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
  for (const root of ["core", "scripts", "workflows", "skills", "metrics"]) {
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
  ...checkStages(),
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
