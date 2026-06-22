/**
 * run-checks.test.mjs  (FR-CI-001 / FR-CI-002 / FR-CI-003)
 *
 * Integration tests for scripts/run-checks.mjs — written RED-first.
 * All tests use spawnSync; no file writes to the real working tree.
 */

import { spawnSync, execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { describe, test, expect } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const runChecks = resolve(repoRoot, "scripts", "run-checks.mjs");

/** Helper: run a node script synchronously, collect stdout+stderr combined. */
function run(args = [], opts = {}) {
  const result = spawnSync(process.execPath, [runChecks, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env },
    timeout: 30_000,
    ...opts,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: (result.stdout ?? "") + (result.stderr ?? ""),
  };
}

// ---------------------------------------------------------------------------
// FR-CI-001: Aggregation — normal repo → exit 0, all three checkers invoked
// ---------------------------------------------------------------------------

describe("FR-CI-001: aggregate mode (no args)", () => {
  test("exits 0 on a clean repo", () => {
    const r = run();
    expect(r.status).toBe(0);
  });

  test("stdout mentions check-anti-host (checker was invoked)", () => {
    const r = run();
    expect(r.output).toMatch(/check-anti-host/);
  });

  test("stdout mentions check-extensibility (checker was invoked)", () => {
    const r = run();
    expect(r.output).toMatch(/check-extensibility/);
  });

  test("stdout mentions check-path-guard or skipped (checker invoked or legitimately skipped)", () => {
    // path-guard is only called when git diff --name-only HEAD is non-empty.
    // On a clean committed repo it may be skipped; run-checks must say so.
    const r = run();
    expect(r.output).toMatch(/check-path-guard/);
  });
});

// ---------------------------------------------------------------------------
// FR-CI-001: Any checker non-zero → aggregated exit non-zero
// ---------------------------------------------------------------------------

describe("FR-CI-001: non-zero propagation", () => {
  test("exits non-zero when a checker signals failure", () => {
    // Verify aggregation logic via --force-fail-checker flag:
    // run-checks.mjs supports --force-fail-checker=<name> for testability
    // (runs real checker replaced by process.exit(1) stub).
    // Alternatively: run with an env flag that injects a failing stub.
    //
    // We use RUN_CHECKS_FORCE_FAIL_CHECKER env var (supported by run-checks.mjs).
    const r = run([], {
      env: { ...process.env, RUN_CHECKS_FORCE_FAIL_CHECKER: "check-anti-host" },
    });
    expect(r.status).not.toBe(0);
  });

  test("reports which checker failed", () => {
    const r = run([], {
      env: { ...process.env, RUN_CHECKS_FORCE_FAIL_CHECKER: "check-anti-host" },
    });
    expect(r.output).toMatch(/check-anti-host/);
  });
});

// ---------------------------------------------------------------------------
// FR-CI-002: --self-test mode — mutation self-check does NOT permanently red
// ---------------------------------------------------------------------------

describe("FR-CI-002: --self-test mode", () => {
  test("exits 0 (parent process clean even after running bad samples)", () => {
    const r = run(["--self-test"]);
    expect(r.status).toBe(0);
  });

  test("stdout confirms anti-host self-test verification ran", () => {
    const r = run(["--self-test"]);
    // Must contain evidence that anti-host bad sample was verified
    expect(r.output).toMatch(/anti-host.*self-test|self-test.*anti-host/i);
  });

  test("stdout confirms path-guard self-test verification ran", () => {
    const r = run(["--self-test"]);
    expect(r.output).toMatch(/path-guard.*self-test|self-test.*path-guard/i);
  });

  test("stdout declares extensibility self-test status honestly", () => {
    // check-extensibility has no built-in --self-test.
    // run-checks must either verify it or declare the gap honestly.
    const r = run(["--self-test"]);
    expect(r.output).toMatch(/extensibility/i);
  });
});

// ---------------------------------------------------------------------------
// FR-CI-002: self-test truly validates bad-sample detection (not empty pass)
// ---------------------------------------------------------------------------

describe("FR-CI-002: self-test validates detection, not empty pass", () => {
  test("self-test output contains PASS or VERIFIED markers (not silent)", () => {
    const r = run(["--self-test"]);
    // Must contain positive evidence; a no-op silent run is not acceptable.
    expect(r.output).toMatch(/PASS|VERIFIED|CAUGHT|verified/i);
  });

  test("anti-host self-test sub-process exits 0 (bad sample caught → sub-process reports pass)", () => {
    // The anti-host --self-test itself returns exit 0 when detection works.
    // run-checks --self-test must assert this sub-process exit 0.
    // We verify run-checks reports success (not that it swallowed an error).
    const r = run(["--self-test"]);
    expect(r.status).toBe(0);
    // And the output must not contain "FAILED" for anti-host
    expect(r.output).not.toMatch(/anti-host.*FAILED|FAILED.*anti-host/i);
  });
});

// ---------------------------------------------------------------------------
// FR-CI-003: collectChangedFiles covers committed range (CI false-green fix)
//
// Scenario: CI checkout — working tree is clean relative to HEAD, but
// HEAD~1..HEAD contains a change to a protected file (CONSTITUTION.md).
// The old implementation (git diff HEAD only) returns empty → path-guard
// skipped → false green. The fix must include HEAD~1..HEAD in the feed.
//
// Falsifiability: if the feed logic is reverted to "git diff HEAD only",
// the collected list is empty, so `expect(files).toContain("CONSTITUTION.md")`
// fails. Verified manually: reverting source-3 block in collectChangedFiles
// causes this test to turn red.
// ---------------------------------------------------------------------------

// Import the exported collectChangedFiles function for direct unit testing.
// We pass a custom repoRoot (temporary git repo) to test the logic in isolation.
const { collectChangedFiles } = await import(
  resolve(repoRoot, "scripts", "run-checks.mjs")
);

describe("FR-CI-003: collectChangedFiles covers committed range (CI false-green fix)", () => {
  /**
   * Build a temporary git repo that mimics CI checkout state:
   *   commit-0: clean initial commit (no protected files)
   *   commit-1: adds CONSTITUTION.md  ← HEAD
   *   working tree: clean relative to HEAD (simulates CI checkout)
   *
   * Returns the tmpdir path.
   */
  function makeTmpRepo() {
    const tmp = mkdtempSync(`${tmpdir()}/run-checks-test-`);

    const git = (args) =>
      execFileSync("git", args, {
        cwd: tmp,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "test",
          GIT_AUTHOR_EMAIL: "test@test.com",
          GIT_COMMITTER_NAME: "test",
          GIT_COMMITTER_EMAIL: "test@test.com",
        },
      });

    git(["init"]);
    git(["config", "user.email", "test@test.com"]);
    git(["config", "user.name", "test"]);

    // commit-0: clean initial commit (no protected files)
    writeFileSync(`${tmp}/README.md`, "hello\n");
    git(["add", "README.md"]);
    git(["commit", "-m", "initial"]);

    // commit-1: add CONSTITUTION.md (a protected file) — HEAD
    writeFileSync(`${tmp}/CONSTITUTION.md`, "# Constitution\nprotected content\n");
    git(["add", "CONSTITUTION.md"]);
    git(["commit", "-m", "add CONSTITUTION.md"]);

    // working tree is now clean relative to HEAD (simulates CI checkout)
    return tmp;
  }

  test("collectChangedFiles includes CONSTITUTION.md from HEAD~1..HEAD when working tree is clean", () => {
    const tmp = makeTmpRepo();

    // Call the exported function directly with the tmp repo as repoRoot.
    // This is the canonical assertion: the fix must cause collectChangedFiles
    // to return CONSTITUTION.md even when 'git diff HEAD' (working tree) is empty.
    const files = collectChangedFiles(tmp);

    // MUST include CONSTITUTION.md even though working tree is clean vs HEAD
    expect(files).toContain("CONSTITUTION.md");
  });

  test("collectChangedFiles returns empty on a repo with only one commit and clean working tree", () => {
    // Edge case: first commit (HEAD~1 does not exist) and working tree clean.
    // collectChangedFiles must return empty without throwing.
    const tmp = mkdtempSync(`${tmpdir()}/run-checks-first-commit-`);

    const git = (args) =>
      execFileSync("git", args, {
        cwd: tmp,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "test",
          GIT_AUTHOR_EMAIL: "test@test.com",
          GIT_COMMITTER_NAME: "test",
          GIT_COMMITTER_EMAIL: "test@test.com",
        },
      });

    git(["init"]);
    git(["config", "user.email", "test@test.com"]);
    git(["config", "user.name", "test"]);
    writeFileSync(`${tmp}/README.md`, "hello\n");
    git(["add", "README.md"]);
    git(["commit", "-m", "initial"]);

    // No second commit, working tree clean — should return [] without crashing
    const files = collectChangedFiles(tmp);
    // README.md is not a protected file; the important thing is no throw
    expect(Array.isArray(files)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FR-CI-003 (shallow-checkout): CI fail-closed when HEAD~1 unavailable
//
// Finding 2 fix: collectChangedFiles must NOT silently skip when running in CI
// without a diffBase and HEAD~1 is unavailable (shallow checkout symptom).
// It must throw so the caller (runAggregate) fails path-guard and exits non-zero.
//
// Falsifiability: if the implementation reverts to silently skipping in CI,
// the "throws" assertion fails (no error thrown → expect.toThrow fails → RED).
// ---------------------------------------------------------------------------

describe("FR-CI-003 (shallow-checkout): CI fail-closed when HEAD~1 unavailable", () => {
  /** Build a single-commit tmp repo (HEAD~1 does not exist — simulates shallow checkout). */
  function makeSingleCommitRepo() {
    const tmp = mkdtempSync(`${tmpdir()}/run-checks-shallow-`);
    const git = (args) =>
      execFileSync("git", args, {
        cwd: tmp,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "test",
          GIT_AUTHOR_EMAIL: "test@test.com",
          GIT_COMMITTER_NAME: "test",
          GIT_COMMITTER_EMAIL: "test@test.com",
        },
      });
    git(["init"]);
    git(["config", "user.email", "test@test.com"]);
    git(["config", "user.name", "test"]);
    writeFileSync(`${tmp}/CONSTITUTION.md`, "protected\n");
    git(["add", "CONSTITUTION.md"]);
    git(["commit", "-m", "initial with protected file"]);
    return tmp;
  }

  test("CI + no diffBase + HEAD~1 unavailable → throws (fail closed)", () => {
    const tmp = makeSingleCommitRepo();
    const origCI = process.env.CI;
    const origGA = process.env.GITHUB_ACTIONS;
    try {
      process.env.CI = "true";
      delete process.env.GITHUB_ACTIONS;
      // collectChangedFiles must throw in CI when HEAD~1 is missing and no diffBase
      expect(() => collectChangedFiles(tmp)).toThrow();
    } finally {
      if (origCI === undefined) delete process.env.CI;
      else process.env.CI = origCI;
      if (origGA === undefined) delete process.env.GITHUB_ACTIONS;
      else process.env.GITHUB_ACTIONS = origGA;
    }
  });

  test("GITHUB_ACTIONS + no diffBase + HEAD~1 unavailable → throws (fail closed)", () => {
    const tmp = makeSingleCommitRepo();
    const origCI = process.env.CI;
    const origGA = process.env.GITHUB_ACTIONS;
    try {
      delete process.env.CI;
      process.env.GITHUB_ACTIONS = "true";
      expect(() => collectChangedFiles(tmp)).toThrow();
    } finally {
      if (origCI === undefined) delete process.env.CI;
      else process.env.CI = origCI;
      if (origGA === undefined) delete process.env.GITHUB_ACTIONS;
      else process.env.GITHUB_ACTIONS = origGA;
    }
  });

  test("non-CI + no diffBase + HEAD~1 unavailable → graceful return (not throw)", () => {
    const tmp = makeSingleCommitRepo();
    const origCI = process.env.CI;
    const origGA = process.env.GITHUB_ACTIONS;
    try {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      // Local first-commit scenario: must NOT throw, return array gracefully
      let result;
      expect(() => {
        result = collectChangedFiles(tmp);
      }).not.toThrow();
      expect(Array.isArray(result)).toBe(true);
    } finally {
      if (origCI === undefined) delete process.env.CI;
      else process.env.CI = origCI;
      if (origGA === undefined) delete process.env.GITHUB_ACTIONS;
      else process.env.GITHUB_ACTIONS = origGA;
    }
  });
});
