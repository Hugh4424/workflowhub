/**
 * receipt-verification.test.mjs — Phase 2a (T004/T005).
 *
 * T004: getRealChangedFiles(worktreeRoot) runs git diff --name-only.
 * T005: verifyReceipts(stage, stageResultPath, worktreeRoot) checks declared
 *       changed files against real git diff.
 *
 * All tests are falsifiable: each creates its own temp git repo with known state
 * so the output is deterministic and does not depend on the host repo's working
 * tree state.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { getRealChangedFiles, verifyReceipts } from "../scripts/validate-stage-result.mjs";

let workDir;
let repoDir;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "receipt-tests-"));
  // Create a subdir for git repos to keep temp dir tidy
  repoDir = join(workDir, "repo");
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

/** Helper: run a shell command in a given cwd. */
function sh(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

/**
 * Helper: create a minimal git repo with one initial commit, then optionally
 * make a working-tree change (modify an existing tracked file).
 * Returns the repo directory path.
 */
function initRepoWithChange() {
  const repo = join(workDir, "repo");
  // create dir and init git inside it
  execSync(`mkdir -p "${repo}"`);
  execSync("git init", { cwd: repo });
  writeFileSync(join(repo, "README.md"), "# Hello\n");
  execSync("git add README.md", { cwd: repo });
  execSync('git commit -m "init"', { cwd: repo });
  // Make a working-tree change to a tracked file
  writeFileSync(join(repo, "README.md"), "# Hello\nmodified\n");
  return repo;
}

/**
 * Helper: create a minimal git repo with one initial commit, NO working-tree
 * changes. Returns the repo directory path.
 */
function initCleanRepo() {
  const repo = join(workDir, "repo-clean");
  execSync(`mkdir -p "${repo}"`);
  execSync("git init", { cwd: repo });
  writeFileSync(join(repo, "README.md"), "# Hello\n");
  execSync("git add README.md", { cwd: repo });
  execSync('git commit -m "init"', { cwd: repo });
  return repo;
}

/** Helper: write a stage-result JSON file. */
function writeStageResult(dir, content) {
  const path = join(dir, "stage-result.json");
  writeFileSync(path, JSON.stringify(content));
  return path;
}

// ── T004: getRealChangedFiles ────────────────────────────────────────────────

describe("T004 — getRealChangedFiles", () => {
  it("returns correct list in a git repo with tracked-file changes", () => {
    const repo = initRepoWithChange();
    const changed = getRealChangedFiles(repo);
    expect(Array.isArray(changed)).toBe(true);
    expect(changed).toEqual(["README.md"]);
  });

  it("handles non-git dir gracefully (returns empty array)", () => {
    const nonGitDir = join(workDir, "not-a-repo");
    execSync(`mkdir -p "${nonGitDir}"`);
    const changed = getRealChangedFiles(nonGitDir);
    expect(Array.isArray(changed)).toBe(true);
    expect(changed).toEqual([]);
  });

  it("returns empty array in a clean git repo (no uncommitted changes)", () => {
    const repo = initCleanRepo();
    const changed = getRealChangedFiles(repo);
    expect(Array.isArray(changed)).toBe(true);
    expect(changed).toEqual([]);
  });
});

// ── T005: verifyReceipts ─────────────────────────────────────────────────────

describe("T005 — verifyReceipts", () => {
  it("passes when declared changes match actual diff", () => {
    const repo = initRepoWithChange();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: { changed: ["README.md"] },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.changed).toEqual(["README.md"]);
  });

  it("fails when diff is empty but facts.changed declares changes", () => {
    const repo = initCleanRepo();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: { changed: ["src/app.ts"] },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("handles no_code_change:true properly (passes with no git changes)", () => {
    const repo = initCleanRepo();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: { no_code_change: true },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails when no facts.changed and no no_code_change", () => {
    const repo = initCleanRepo();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {},
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("fails when declared changed files do not match actual diff files", () => {
    const repo = initRepoWithChange(); // actual diff = README.md
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: { changed: ["other.ts", "extra.ts"] },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("handles invalid JSON in stage-result gracefully (returns ok=false with errors)", () => {
    const repo = initCleanRepo();
    const bogusPath = join(workDir, "not-json.json");
    writeFileSync(bogusPath, "this is not valid json {");

    const result = verifyReceipts("build-code", bogusPath, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
