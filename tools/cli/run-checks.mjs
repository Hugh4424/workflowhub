/**
 * run-checks.mjs  (FR-CI-001 / FR-CI-002)
 *
 * Unified check entry point. Aggregates checkers:
 *   - check-anti-host     (FR-GUARD-001/002)
 *   - check-extensibility (FR-EXT-001/002)
 *   - check-contract      (FR-NC-005)
 *   - check-metrics-schema (M4 FR-CI-001/002)
 *   - check-stage-quality  (M5 FR-GATE-001/002)
 *   - check-task-record-paths (FR-TASKDIR-001)
 *   - check-decision-log-chain (FR-DLOG-003, advisory and non-blocking)
 *
 * Modes:
 *   node tools/cli/run-checks.mjs            — aggregate mode (default)
 *   node tools/cli/run-checks.mjs --self-test — mutation self-check mode (FR-CI-002)
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

import { createHash } from "node:crypto";
import { existsSync, linkSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname, isAbsolute, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { validateTestRuntimeProfile } from "../../runtime/stage/stage-content-contracts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// tools/cli/ -> repository root; run child checkers from the project root so
// top-level contracts, metrics, fixtures, and workflows resolve consistently.
const repoRoot = resolve(here, "..", "..");

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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseProfileArgs(args) {
  const separator = args.indexOf("--");
  if (separator < 0) return null;
  const options = args.slice(0, separator);
  const target = args.slice(separator + 1);
  const profileArg = options.find((arg) => arg.startsWith("--runtime-profile="));
  const evidenceArg = options.find((arg) => arg.startsWith("--evidence-path="));
  if (!profileArg || !evidenceArg || target.length === 0) throw new Error("runtime profile mode requires --runtime-profile, --evidence-path, and a target argv after --");
  const runtimeProfile = profileArg.slice("--runtime-profile=".length);
  const evidencePath = evidenceArg.slice("--evidence-path=".length);
  if (!evidencePath) throw new Error("runtime profile evidence path is required");
  if (!new Set(["inner", "medium", "large"]).has(runtimeProfile)) throw new Error("runtime profile must be inner, medium, or large");
  const resolvedEvidencePath = isAbsolute(evidencePath) ? evidencePath : resolve(repoRoot, evidencePath);
  const qualityRoot = resolve(repoRoot, "quality", "tests");
  if (resolvedEvidencePath !== qualityRoot && !resolvedEvidencePath.startsWith(`${qualityRoot}/`)) {
    throw new Error("runtime profile evidence path must be under quality/tests");
  }
  return { runtimeProfile, evidencePath: resolvedEvidencePath, target };
}

function profileForExecutor(runtimeProfile, target) {
  const permissions = runtimeProfile === "inner"
    ? { network: "deny", db: "deny", filesystem: "deny", subprocess: "deny", environment: "local_ci" }
    : runtimeProfile === "medium"
      ? { network: "localhost_only", db: "localhost_only", filesystem: "worktree_temp_only", subprocess: "explicit_only", environment: "local_ci" }
      : { network: "ci_only", db: "ci_only", filesystem: "ci_only", subprocess: "ci_only", environment: "ci_only" };
  const ceiling_ms = runtimeProfile === "large" ? 900_000 : { inner: 60_000, medium: 300_000 }[runtimeProfile];
  const observations = Object.entries(permissions).map(([capability, decision]) => ({
    capability, requested: decision, decision: "unknown", observed: false,
    mechanism: "run-checks-profile-declaration-only", proof_ref: null, proof_hash: null,
  }));
  return {
    runtime_profile: runtimeProfile,
    ceiling_ms,
    permissions,
    executor_id: "run-checks",
    capability_proof: { status: "unavailable", executor_id: "run-checks", observations },
    behavior_fingerprint: {
      before: { selection_hash: null, assertion_hash: null },
      after: { selection_hash: null, assertion_hash: null },
    },
  };
}

function runProfiledCommand({ runtimeProfile, evidencePath, target }) {
  const profile = profileForExecutor(runtimeProfile, target);
  const valid = validateTestRuntimeProfile(profile, { declarationOnly: true });
  if (valid.errors.length > 0) throw new Error(`runtime profile declaration is ${valid.status}: ${valid.errors.join("; ")}`);
  if (runtimeProfile === "large" && process.env.CI !== "true") throw new Error("large runtime profile requires CI=true");
  const started = Date.now();
  const result = spawnSync(target[0], target.slice(1), {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    timeout: profile.ceiling_ms,
    maxBuffer: 50 * 1024 * 1024,
  });
  const duration_ms = Date.now() - started;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const exit_code = result.error?.code === "ETIMEDOUT" ? 124 : (result.status ?? 1);
  const evidence = {
    schema_version: "workflowhub-test-profile.v1",
    status: result.status === 0 ? "target_passed_profile_unavailable" : "target_failed_profile_unavailable",
    quality_status: "unavailable",
    runtime_profile: runtimeProfile,
    executor_id: "run-checks",
    target: { argv: target },
    duration_ms,
    exit_code,
    capability_proof: profile.capability_proof,
    behavior_fingerprint: profile.behavior_fingerprint,
    behavior_fingerprint_status: "unavailable",
    runtime_profile_status: "unavailable",
    runtime_profile_authenticated: false,
    output_hash: sha256(`${result.stdout ?? ""}\n${result.stderr ?? ""}`),
  };
  mkdirSync(resolve(evidencePath, ".."), { recursive: true });
  const temporaryPath = `${evidencePath}.tmp-${process.pid}`;
  if (existsSync(evidencePath)) {
    const existing = readFileSync(evidencePath, "utf8");
    if (existing !== `${JSON.stringify(evidence, null, 2)}\n`) throw new Error("runtime profile evidence ref is already occupied with different content");
  } else {
    writeFileSync(temporaryPath, `${JSON.stringify(evidence, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    try { linkSync(temporaryPath, evidencePath); } finally { unlinkSync(temporaryPath); }
  }
  return exit_code;
}

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

  // 6. check-task-record-paths (FR-TASKDIR-001 — all stage records use canonical task_dir)
  console.log("[run-checks] running check-task-record-paths ...");
  const taskRecordPathsCode = runChecker("check-task-record-paths", []);
  if (taskRecordPathsCode !== 0) {
    failures.push({ name: "check-task-record-paths", code: taskRecordPathsCode });
  }

  // 7. check-decision-log-chain (FR-DLOG-003 — advisory only; never a gate)
  console.log("[run-checks] running check-decision-log-chain (non-blocking) ...");
  const decisionLogChainCode = runChecker("check-decision-log-chain", []);
  if (decisionLogChainCode !== 0) {
    console.error(`[run-checks] check-decision-log-chain advisory failed (exit ${decisionLogChainCode}); not added to failures`);
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
  } else if (args.includes("--runtime-profile") || args.some((arg) => arg.startsWith("--runtime-profile="))) {
    try {
      process.exit(runProfiledCommand(parseProfileArgs(args)));
    } catch (error) {
      console.error(`[run-checks] runtime profile failed: ${error.message}`);
      process.exit(1);
    }
  } else {
    runAggregate();
  }
}
