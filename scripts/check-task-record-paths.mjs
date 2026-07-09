#!/usr/bin/env node
/**
 * CI guard for task execution-record path resolution.
 *
 * Every stage prompt must route task execution records through
 * core/task-record-paths.mjs. Runtime code must not construct repo-local
 * tasks/<task-id> paths directly; only parser internals and tests may mention
 * the literal tasks directory for fixtures or project-scope derivation.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
function parseArgs(argv) {
  const args = [...argv];
  const rootIndex = args.indexOf("--root");
  if (rootIndex !== -1 && args[rootIndex + 1]) {
    return { repoRoot: resolve(args[rootIndex + 1]) };
  }
  return { repoRoot: resolve(here, "..") };
}

const { repoRoot } = parseArgs(process.argv.slice(2));

const REQUIRED_STAGE_SKILLS = [
  "workflows/make-decision/SKILL.md",
  "workflows/build-spec/SKILL.md",
  "workflows/build-plan/SKILL.md",
  "workflows/build-code/SKILL.md",
  "workflows/verify-code/SKILL.md",
];

const REQUIRED_STAGE_MARKERS = [
  "core/task-record-paths.mjs",
  "resolveTaskRecordPaths",
  "taskRecords",
  "task_root",
];

const DISALLOWED_STAGE_PATTERNS = [
  {
    pattern: /回退到\s+`tasks\/\{task-id\}\/`/,
    reason: "stage prompt must not fall back to repo-local tasks/{task-id}/",
  },
  {
    pattern: /default path when `--task-dir` absent:\s*`tasks\/\{task-id\}\/`/,
    reason: "--task-dir absence must resolve through task-record-paths, not repo-local tasks",
  },
];

const RUNTIME_SCAN_ROOTS = ["core", "scripts", "workflows", "skills"];
const RUNTIME_ALLOWLIST = new Set([
  "core/task-dir-parser.mjs",
  "core/task-record-paths.mjs",
  "scripts/check-task-record-paths.mjs",
]);

function readRel(relPath) {
  return readFileSync(resolve(repoRoot, relPath), "utf8");
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".git") continue;
      walk(full, out);
    } else if (entry.endsWith(".mjs")) {
      out.push(full);
    }
  }
  return out;
}

function isTestPath(relPath) {
  return (
    relPath.includes("/__tests__/") ||
    relPath.endsWith(".test.mjs") ||
    relPath.includes("/test/")
  );
}

function checkStageSkills() {
  const failures = [];
  for (const relPath of REQUIRED_STAGE_SKILLS) {
    const content = readRel(relPath);
    for (const marker of REQUIRED_STAGE_MARKERS) {
      if (!content.includes(marker)) {
        failures.push(`${relPath}: missing required marker "${marker}"`);
      }
    }
    for (const { pattern, reason } of DISALLOWED_STAGE_PATTERNS) {
      if (pattern.test(content)) {
        failures.push(`${relPath}: ${reason}`);
      }
    }
  }
  return failures;
}

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

function checkRuntimeCode() {
  const failures = [];
  const literalTasksJoin = /\b(?:join|resolve)\s*\([^;\n]*(?:"tasks"|'tasks')/g;
  const stringRepoLocalTask = /["'`]tasks\/(?:\$\{[^}]+\}|\{task-id\}|[A-Za-z0-9._-]+)\//g;

  for (const root of RUNTIME_SCAN_ROOTS) {
    const rootPath = resolve(repoRoot, root);
    for (const file of walk(rootPath)) {
      const relPath = relative(repoRoot, file).replaceAll("\\", "/");
      if (RUNTIME_ALLOWLIST.has(relPath) || isTestPath(relPath)) continue;

      const content = stripComments(readFileSync(file, "utf8"));
      if (literalTasksJoin.test(content)) {
        failures.push(`${relPath}: direct join/resolve of literal "tasks" is not allowed`);
      }
      literalTasksJoin.lastIndex = 0;
      if (stringRepoLocalTask.test(content)) {
        failures.push(`${relPath}: direct repo-local tasks/<task-id>/ string is not allowed`);
      }
      stringRepoLocalTask.lastIndex = 0;
    }
  }
  return failures;
}

function main() {
  const failures = [...checkStageSkills(), ...checkRuntimeCode()];
  if (failures.length === 0) {
    console.log("[check-task-record-paths] PASS");
    return;
  }

  for (const failure of failures) {
    console.error(`[check-task-record-paths] FAIL: ${failure}`);
  }
  process.exit(1);
}

main();
