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
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createHash } from "crypto";

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

function diffSha(repo, ignoredPath = null) {
  return diffShaFor(repo, "HEAD", ignoredPath);
}

function diffShaFromBase(repo, baseRef) {
  return diffShaFor(repo, baseRef);
}

function pathspec(ignoredPath) {
  const excludes = [
    '":(glob,exclude)tasks/**/stage-result-*.json"',
    '":(glob,exclude)tasks/**/reviews/**"',
  ];
  if (ignoredPath) excludes.push(`":(exclude)${ignoredPath}"`);
  return ` -- . ${excludes.join(" ")}`;
}

function diffShaFor(repo, baseRef, ignoredPath = null) {
  const baseDiff =
    baseRef === "HEAD" ? "" : sh(`git diff ${JSON.stringify(baseRef)}...HEAD${pathspec(ignoredPath)}`, repo);
  const worktreeDiff = sh(`git diff HEAD${pathspec(ignoredPath)}`, repo);
  const untracked = sh("git ls-files --others --exclude-standard", repo)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) =>
      file !== ignoredPath &&
      !/^tasks\/[^/]+\/stage-result-[^/]+\.json$/.test(file) &&
      !/^tasks\/[^/]+\/reviews\//.test(file)
    )
    .sort()
    .map((file) => {
      const content = execSync(`cat ${JSON.stringify(join(repo, file))}`);
      const hash = createHash("sha256").update(content).digest("hex");
      return `${file}\0${hash}`;
    })
    .join("\n");
  return createHash("sha256")
    .update(baseDiff)
    .update("\n--worktree--\n")
    .update(worktreeDiff)
    .update("\n--untracked--\n")
    .update(untracked)
    .digest("hex");
}

function writeTestResult(dir, stage = "build-code", exitCode = 0, extra = {}) {
  const path = join(dir, `${stage}-test-result.json`);
  writeFileSync(
    path,
    JSON.stringify({
      stage,
      exit_code: exitCode,
      stdout: "ok",
      stderr: "",
      ...extra,
    })
  );
  return path;
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

  it("fails loud in a non-git dir", () => {
    const nonGitDir = join(workDir, "not-a-repo");
    execSync(`mkdir -p "${nonGitDir}"`);
    expect(() => getRealChangedFiles(nonGitDir)).toThrow();
  });

  it("returns empty array in a clean git repo (no uncommitted changes)", () => {
    const repo = initCleanRepo();
    const changed = getRealChangedFiles(repo);
    expect(Array.isArray(changed)).toBe(true);
    expect(changed).toEqual([]);
  });

  it("includes untracked files in real changed files", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "new-file.txt"), "new work\n");
    const changed = getRealChangedFiles(repo);
    expect(changed).toEqual(["new-file.txt"]);
  });

  it("can diff committed stage work against a base ref", () => {
    const repo = initCleanRepo();
    sh("git branch base-before-stage", repo);
    writeFileSync(join(repo, "README.md"), "# Hello\ncommitted stage work\n");
    sh("git add README.md", repo);
    sh('git commit -m "stage work"', repo);
    const changed = getRealChangedFiles(repo, "base-before-stage");
    expect(changed).toEqual(["README.md"]);
  });
});

// ── T005: verifyReceipts ─────────────────────────────────────────────────────

describe("T005 — verifyReceipts", () => {
  it("passes when declared changes match actual diff", () => {
    const repo = initRepoWithChange();
    const testResultLog = writeTestResult(workDir, "build-code");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffSha(repo),
        test_result_log: testResultLog,
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.changed).toEqual(["README.md"]);
  });

  it("fails when diff is empty but facts.changed declares changes", () => {
    const repo = initCleanRepo();
    const testResultLog = writeTestResult(workDir, "build-code");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["src/app.ts"],
        diff_sha: diffSha(repo),
        test_result_log: testResultLog,
      },
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

  it("fails no_code_change:true when git diff evidence cannot be collected", () => {
    const nonGitDir = join(workDir, "not-a-repo");
    execSync(`mkdir -p "${nonGitDir}"`);
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: { no_code_change: true },
    });

    const result = verifyReceipts("build-code", path, nonGitDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/git diff evidence/i);
  });

  it("fails no_code_change:true when untracked files exist", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "new-file.txt"), "new work\n");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: { no_code_change: true },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/new-file\.txt/);
  });

  it("passes when an untracked file is declared and bound by diff_sha", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "new-file.txt"), "new work\n");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["new-file.txt"],
        diff_sha: diffSha(repo),
        test_result_log: writeTestResult(workDir, "build-code"),
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("excludes the stage-result artifact itself from receipt diff evidence", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "README.md"), "# Hello\nmodified\n");
    const artifactDir = join(repo, "tasks", "demo");
    mkdirSync(artifactDir, { recursive: true });
    const stageResultPath = join(artifactDir, "stage-result-build-code.json");
    writeFileSync(
      stageResultPath,
      JSON.stringify({
        stage: "build-code",
        status: "success",
        facts: {
          changed: ["README.md"],
          diff_sha: diffSha(repo, "tasks/demo/stage-result-build-code.json"),
          test_result_log: writeTestResult(workDir, "build-code"),
        },
      })
    );

    const result = verifyReceipts("build-code", stageResultPath, repo);
    expect(result.ok).toBe(true);
    expect(result.changed).toEqual(["README.md"]);
  });

  it("excludes sibling task stage-result artifacts from receipt diff evidence", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "README.md"), "# Hello\nmodified\n");
    const artifactDir = join(repo, "tasks", "demo");
    mkdirSync(artifactDir, { recursive: true });
    const stageResultPath = join(artifactDir, "stage-result-build-code.json");
    const siblingStageResultPath = join(artifactDir, "stage-result-verify-code.json");
    writeFileSync(siblingStageResultPath, JSON.stringify({ status: "success" }));
    writeFileSync(
      stageResultPath,
      JSON.stringify({
        stage: "build-code",
        status: "success",
        facts: {
          changed: ["README.md"],
          diff_sha: diffSha(repo, "tasks/demo/stage-result-build-code.json"),
          test_result_log: writeTestResult(workDir, "build-code"),
        },
      })
    );

    const result = verifyReceipts("build-code", stageResultPath, repo);
    expect(result.ok).toBe(true);
    expect(result.changed).toEqual(["README.md"]);
  });

  it("excludes review ledger artifacts from receipt diff evidence", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "README.md"), "# Hello\nmodified\n");
    const reviewDir = join(repo, "tasks", "demo", "reviews");
    mkdirSync(reviewDir, { recursive: true });
    writeFileSync(join(reviewDir, "review-input-demo.json"), JSON.stringify({ mode: "full" }));
    const artifactDir = join(repo, "tasks", "demo");
    const stageResultPath = join(artifactDir, "stage-result-build-code.json");
    writeFileSync(
      stageResultPath,
      JSON.stringify({
        stage: "build-code",
        status: "success",
        facts: {
          changed: ["README.md"],
          diff_sha: diffSha(repo, "tasks/demo/stage-result-build-code.json"),
          test_result_log: writeTestResult(workDir, "build-code"),
        },
      })
    );

    const result = verifyReceipts("build-code", stageResultPath, repo);
    expect(result.ok).toBe(true);
    expect(result.changed).toEqual(["README.md"]);
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

  it("fails when a code-change receipt omits test_result_log", () => {
    const repo = initRepoWithChange();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffSha(repo),
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/test_result_log/i);
  });

  it("fails when test_result_log belongs to the wrong stage", () => {
    const repo = initRepoWithChange();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffSha(repo),
        test_result_log: writeTestResult(workDir, "build-plan"),
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/wrong stage|build-plan/i);
  });

  it("fails when stage-result belongs to a different stage", () => {
    const repo = initRepoWithChange();
    const path = writeStageResult(workDir, {
      stage: "build-plan",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffSha(repo),
        test_result_log: writeTestResult(workDir, "build-code"),
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/stage-result.*build-plan/i);
  });

  it("fails when test_result_log omits exit_code", () => {
    const repo = initRepoWithChange();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffSha(repo),
        test_result_log: writeTestResult(workDir, "build-code", 0, { exit_code: undefined }),
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/exit_code/i);
  });

  it("fails when test_result_log omits stdout evidence", () => {
    const repo = initRepoWithChange();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffSha(repo),
        test_result_log: writeTestResult(workDir, "build-code", 0, { stdout: undefined }),
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/stdout/i);
  });

  it("fails when test_result_log is plain text even if it mentions the stage", () => {
    const repo = initRepoWithChange();
    const logPath = join(workDir, "plain-test-log.txt");
    writeFileSync(logPath, "build-code tests passed");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffSha(repo),
        test_result_log: logPath,
      },
    });

    const result = verifyReceipts("build-code", path, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/structured JSON/i);
  });

  it("does not execute shell metacharacters from baseRef", () => {
    const repo = initCleanRepo();
    const marker = join(workDir, "base-ref-injection-marker");
    const maliciousBaseRef = `HEAD"; touch ${marker}; echo "`;

    expect(() => getRealChangedFiles(repo, maliciousBaseRef)).toThrow();
    expect(existsSync(marker)).toBe(false);
  });

  it("passes when committed changes are verified against a base ref", () => {
    const repo = initCleanRepo();
    sh("git branch base-before-stage", repo);
    writeFileSync(join(repo, "README.md"), "# Hello\ncommitted stage work\n");
    sh("git add README.md", repo);
    sh('git commit -m "stage work"', repo);
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffShaFromBase(repo, "base-before-stage"),
        test_result_log: writeTestResult(workDir, "build-code"),
      },
    });

    const result = verifyReceipts("build-code", path, repo, { baseRef: "base-before-stage" });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails under base ref when a tracked dirty file is not declared", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "tracked.txt"), "base\n");
    sh("git add tracked.txt", repo);
    sh('git commit -m "add tracked"', repo);
    sh("git branch base-before-stage", repo);
    writeFileSync(join(repo, "README.md"), "# Hello\ncommitted stage work\n");
    sh("git add README.md", repo);
    sh('git commit -m "stage work"', repo);
    writeFileSync(join(repo, "tracked.txt"), "dirty\n");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md"],
        diff_sha: diffShaFromBase(repo, "base-before-stage"),
        test_result_log: writeTestResult(workDir, "build-code"),
      },
    });

    const result = verifyReceipts("build-code", path, repo, { baseRef: "base-before-stage" });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/tracked\.txt/);
  });

  it("passes under base ref when committed and dirty tracked changes are declared", () => {
    const repo = initCleanRepo();
    writeFileSync(join(repo, "tracked.txt"), "base\n");
    sh("git add tracked.txt", repo);
    sh('git commit -m "add tracked"', repo);
    sh("git branch base-before-stage", repo);
    writeFileSync(join(repo, "README.md"), "# Hello\ncommitted stage work\n");
    sh("git add README.md", repo);
    sh('git commit -m "stage work"', repo);
    writeFileSync(join(repo, "tracked.txt"), "dirty\n");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["README.md", "tracked.txt"],
        diff_sha: diffShaFromBase(repo, "base-before-stage"),
        test_result_log: writeTestResult(workDir, "build-code"),
      },
    });

    const result = verifyReceipts("build-code", path, repo, { baseRef: "base-before-stage" });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails when declared changed files do not match actual diff files", () => {
    const repo = initRepoWithChange(); // actual diff = README.md
    const testResultLog = writeTestResult(workDir, "build-code");
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      facts: {
        changed: ["other.ts", "extra.ts"],
        diff_sha: diffSha(repo),
        test_result_log: testResultLog,
      },
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

  it("CLI receipt mode exits nonzero when receipt evidence is missing", () => {
    const repo = initRepoWithChange();
    const path = writeStageResult(workDir, {
      stage: "build-code",
      status: "success",
      git_sha: "sha",
      receipt_path: "receipt.json",
      facts: {
        changed: ["README.md"],
        test_result_log: writeTestResult(workDir, "build-code"),
      },
    });

    expect(() =>
      sh(`node ${JSON.stringify(join(process.cwd(), "scripts/validate-stage-result.mjs"))} build-code ${JSON.stringify(path)} ${JSON.stringify(repo)}`, process.cwd())
    ).toThrow();
  });
});
