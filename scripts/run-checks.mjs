/**
 * run-checks.mjs  (FR-CI-001 / FR-CI-002 / FR-CI-003)
 *
 * Unified check entry point. Aggregates five checkers:
 *   - check-anti-host     (FR-GUARD-001/002)
 *   - check-extensibility (FR-EXT-001/002)
 *   - check-path-guard    (FR-PATHG-001/002)
 *   - check-contract      (FR-NC-005)
 *   - check-metrics-schema (M4 FR-CI-001/002)
 *
 * Modes:
 *   node scripts/run-checks.mjs            — aggregate mode (default)
 *   node scripts/run-checks.mjs --self-test — mutation self-check mode (FR-CI-002)
 *
 * Exit codes (aggregate mode):
 *   0 — all checkers passed
 *   1 — one or more checkers failed
 *
 * Exit codes (--self-test mode):
 *   0 — all mutation verifications passed (bad samples correctly detected)
 *   1 — one or more mutation verifications failed
 *
 * Test injection (FR-CI-001 non-zero propagation test):
 *   RUN_CHECKS_FORCE_FAIL_CHECKER=<checker-name> env var forces that checker
 *   to return exit 1 without running the real script. Used only by tests.
 */

import { spawnSync, execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// ponytail: repoRoot derived from import.meta.url (scripts/ → parent), not hardcoded
const repoRoot = resolve(here, "..");

const node = process.execPath;

// ---------------------------------------------------------------------------
// Helper: run a checker script synchronously, print its output, return exit code.
// Respects RUN_CHECKS_FORCE_FAIL_CHECKER for test injection.
// ---------------------------------------------------------------------------

/**
 * @param {string} checkerName - display name (e.g. "check-anti-host")
 * @param {string[]} checkerArgs - argv to pass to the script
 * @returns {number} exit code
 */
function runChecker(checkerName, checkerArgs) {
  const forceFailTarget = process.env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  if (forceFailTarget && forceFailTarget === checkerName) {
    // Test injection: simulate checker failure without running the real script.
    console.log(`[run-checks] ${checkerName}: FORCED FAILURE (test injection)`);
    return 1;
  }

  const scriptPath = resolve(here, `${checkerName}.mjs`);
  const result = spawnSync(node, [scriptPath, ...checkerArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  // Print checker output so aggregate stdout contains checker names
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return result.status ?? 1;
}

// ---------------------------------------------------------------------------
// collectChangedFiles: build the union of changed files for path-guard input.
//
// Three sources are merged and de-duplicated:
//   1. Working-tree diff vs HEAD (local edits / staged changes)
//   2. Untracked files not yet committed
//   3. Committed range HEAD~1..HEAD (or RUN_CHECKS_DIFF_BASE...HEAD)
//
// Source 3 is the key addition for CI correctness (D6 / FR-CI-003):
//   CI checks out the PR head commit with a clean working tree, so sources 1
//   and 2 are empty.  Without source 3 the path-guard is always skipped in CI
//   — a false green if the commit introduced protected-file changes.
//
// Exported for unit-testing with a custom repoRoot (temporary git repo).
// ---------------------------------------------------------------------------

export function collectChangedFiles(root, diffBase = process.env.RUN_CHECKS_DIFF_BASE) {
  const collected = new Set();

  // Source 1: working tree vs HEAD
  try {
    const out = execFileSync("git", ["diff", "--name-only", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    });
    for (const f of out.split("\n").map((l) => l.trim()).filter(Boolean)) {
      collected.add(f);
    }
  } catch {
    // git not available or error — continue to next source
  }

  // Source 2: untracked files
  try {
    const out = execFileSync(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      { cwd: root, encoding: "utf8" },
    );
    for (const f of out.split("\n").map((l) => l.trim()).filter(Boolean)) {
      collected.add(f);
    }
  } catch {
    // ignore
  }

  // Source 3: committed range — covers CI checkout where working tree is clean
  //   but the current commit introduced changes to protected files.
  //   Skips gracefully when HEAD~1 does not exist (single-commit repo).
  try {
    if (diffBase) {
      // Explicit base (e.g. PR base SHA injected via RUN_CHECKS_DIFF_BASE)
      // Three-dot syntax: diff from merge-base of <base> and HEAD
      const out = execFileSync(
        "git",
        ["diff", "--name-only", `${diffBase}...HEAD`],
        { cwd: root, encoding: "utf8" },
      );
      for (const f of out.split("\n").map((l) => l.trim()).filter(Boolean)) {
        collected.add(f);
      }
    } else {
      // Default: verify HEAD~1 exists before diffing (defensive for first commit)
      execFileSync("git", ["rev-parse", "--verify", "HEAD~1"], {
        cwd: root,
        encoding: "utf8",
      });
      const out = execFileSync(
        "git",
        ["diff", "--name-only", "HEAD~1", "HEAD"],
        { cwd: root, encoding: "utf8" },
      );
      for (const f of out.split("\n").map((l) => l.trim()).filter(Boolean)) {
        collected.add(f);
      }
    }
  } catch {
    // HEAD~1 does not exist (first commit) or git error.
    // In CI (process.env.CI or GITHUB_ACTIONS), this is most likely a shallow
    // checkout (fetch-depth:1) rather than a genuine first commit.
    // Silently skipping here would leave path-guard without committed-range
    // coverage — a false green if the commit touches protected files.
    // Fail closed in CI so the error is visible and fixable (FR-CI-003 / D6).
    // ponytail: local first-commit dev retains graceful skip; CI must configure
    //   fetch-depth>=2 or inject RUN_CHECKS_DIFF_BASE to resolve this.
    const isCI =
      process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
    if (isCI && !diffBase) {
      throw new Error(
        "[run-checks] CI environment: HEAD~1 is unavailable and RUN_CHECKS_DIFF_BASE is not set.\n" +
        "path-guard cannot verify committed-range changes — this would be a false green.\n" +
        "Fix: add `fetch-depth: 2` to the actions/checkout step, or inject RUN_CHECKS_DIFF_BASE."
      );
    }
    // Non-CI (genuine first commit in local dev): graceful skip, no throw.
  }

  return [...collected];
}

// ---------------------------------------------------------------------------
// Aggregate mode (default)
// ---------------------------------------------------------------------------

function runAggregate() {
  const failures = [];

  // 1. check-anti-host (no args, scans core/**/*.mjs via scan-core-files)
  console.log("[run-checks] running check-anti-host ...");
  const antiHostCode = runChecker("check-anti-host", []);
  if (antiHostCode !== 0) {
    failures.push({ name: "check-anti-host", code: antiHostCode });
  }

  // 2. check-extensibility (no args, CLI self-builds tmpdir config)
  console.log("[run-checks] running check-extensibility ...");
  const extCode = runChecker("check-extensibility", []);
  if (extCode !== 0) {
    failures.push({ name: "check-extensibility", code: extCode });
  }

  // 3. check-path-guard — feed collectChangedFiles union (D6 / FR-CI-003)
  console.log("[run-checks] running check-path-guard ...");
  const changedFiles = collectChangedFiles(repoRoot);

  if (changedFiles.length === 0) {
    // No changed files from any source — path-guard trivially passes, skip invocation
    console.log("[run-checks] check-path-guard: skipped (no changed files detected)");
  } else {
    const pgCode = runChecker("check-path-guard", ["--files", ...changedFiles]);
    if (pgCode !== 0) {
      failures.push({ name: "check-path-guard", code: pgCode });
    }
  }

  // 4. check-contract (FR-NC-005 path-only constraint)
  console.log("[run-checks] running check-contract ...");
  const contractCode = runChecker("check-contract", []);
  if (contractCode !== 0) {
    failures.push({ name: "check-contract", code: contractCode });
  }

  // 5. check-metrics-schema (M4 FR-CI-001/002 — execution-record + knowledge-card schemas)
  console.log("[run-checks] running check-metrics-schema ...");
  const metricsSchemaCode = runChecker("check-metrics-schema", []);
  if (metricsSchemaCode !== 0) {
    failures.push({ name: "check-metrics-schema", code: metricsSchemaCode });
  }

  if (failures.length === 0) {
    console.log("[run-checks] ALL CHECKS PASSED");
    process.exit(0);
  } else {
    for (const f of failures) {
      console.error(`[run-checks] FAILED: ${f.name} (exit ${f.code})`);
    }
    console.error(`[run-checks] ${failures.length} checker(s) failed — aggregated exit 1`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// --self-test mode (FR-CI-002: mutation self-check, parent exits 0 when all pass)
// ---------------------------------------------------------------------------

function runSelfTest() {
  let allPassed = true;

  // 1. check-anti-host --self-test: sub-process exits 0 when detection works
  console.log("[run-checks] self-test: verifying check-anti-host self-test ...");
  const antiHostScript = resolve(here, "check-anti-host.mjs");
  const ahResult = spawnSync(node, [antiHostScript, "--self-test"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (ahResult.stdout) process.stdout.write(ahResult.stdout);
  if (ahResult.stderr) process.stderr.write(ahResult.stderr);

  if (ahResult.status === 0) {
    console.log("[run-checks] anti-host self-test: VERIFIED — sub-process exit 0 (bad sample caught)");
  } else {
    console.error(`[run-checks] anti-host self-test: FAILED — sub-process exit ${ahResult.status}`);
    allPassed = false;
  }

  // 2. check-path-guard --self-test: sub-process exits 0 when detection works
  console.log("[run-checks] self-test: verifying check-path-guard self-test ...");
  const pgScript = resolve(here, "check-path-guard.mjs");
  const pgResult = spawnSync(node, [pgScript, "--self-test"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (pgResult.stdout) process.stdout.write(pgResult.stdout);
  if (pgResult.stderr) process.stderr.write(pgResult.stderr);

  if (pgResult.status === 0) {
    console.log("[run-checks] path-guard self-test: VERIFIED — sub-process exit 0 (bad sample caught)");
  } else {
    console.error(`[run-checks] path-guard self-test: FAILED — sub-process exit ${pgResult.status}`);
    allPassed = false;
  }

  // 3. check-extensibility: no built-in --self-test, honest declaration per FR-CI-002 spec
  // ponytail: extensibility falsifiability covered by FR-EXT tests in check-extensibility.test.mjs;
  //           adding in-process mutation here would require polluting the working tree or
  //           running a git commit to change HEAD — both have side effects. Honest skip.
  console.log(
    "[run-checks] extensibility: no in-script mutation self-test" +
    " (covered by FR-EXT falsifiability test in check-extensibility.test.mjs)"
  );

  if (allPassed) {
    console.log("[run-checks] self-test PASSED — all sub-process bad-sample verifications succeeded");
    process.exit(0);
  } else {
    console.error("[run-checks] self-test FAILED — one or more verifications failed");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Entry — only when run directly (not when imported as a module for testing)
// ---------------------------------------------------------------------------

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    runSelfTest();
  } else {
    runAggregate();
  }
}
