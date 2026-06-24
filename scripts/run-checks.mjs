/**
 * run-checks.mjs  (FR-CI-001 / FR-CI-002)
 *
 * Unified check entry point. Aggregates checkers:
 *   - check-anti-host     (FR-GUARD-001/002)
 *   - check-extensibility (FR-EXT-001/002)
 *   - check-contract      (FR-NC-005)
 *   - check-metrics-schema (M4 FR-CI-001/002)
 *   - check-stage-quality  (M5 FR-GATE-001/002)
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

import { spawnSync } from "node:child_process";
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

  // 3. check-contract (FR-NC-005 path-only constraint)
  console.log("[run-checks] running check-contract ...");
  const contractCode = runChecker("check-contract", []);
  if (contractCode !== 0) {
    failures.push({ name: "check-contract", code: contractCode });
  }

  // 4. check-metrics-schema (M4 FR-CI-001/002 — execution-record + knowledge-card schemas)
  console.log("[run-checks] running check-metrics-schema ...");
  const metricsSchemaCode = runChecker("check-metrics-schema", []);
  if (metricsSchemaCode !== 0) {
    failures.push({ name: "check-metrics-schema", code: metricsSchemaCode });
  }

  // 5. check-stage-quality (M5 FR-GATE-001/002 — quality-class blocking gates = 0)
  console.log("[run-checks] running check-stage-quality ...");
  const stageQualityCode = runChecker("check-stage-quality", []);
  if (stageQualityCode !== 0) {
    failures.push({ name: "check-stage-quality", code: stageQualityCode });
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

  // 2. check-extensibility: no built-in --self-test, honest declaration per FR-CI-002 spec
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
