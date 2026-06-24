/**
 * run-checks.test.mjs  (FR-CI-001 / FR-CI-002 / FR-CI-003)
 *
 * Integration tests for scripts/run-checks.mjs — written RED-first.
 * All tests use spawnSync; no file writes to the real working tree.
 */

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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
// FR-CI-001: Aggregation — normal repo → exit 0, all four checkers invoked
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

  test("stdout mentions check-contract (checker was invoked)", () => {
    const r = run();
    expect(r.output).toMatch(/check-contract/);
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

