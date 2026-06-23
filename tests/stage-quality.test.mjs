/**
 * stage-quality.test.mjs — M5 Phase 3
 *
 * Tests for check-stage-quality.mjs (FR-GATE-001/002/003/004).
 * All tests are FALSIFIABLE: each one fails if the production path isn't actually
 * exercised. No proxy assertions, no hardcoded string comparisons to the scanner itself.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

import { scanFiles } from "../scripts/check-stage-quality.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const scriptPath = join(repoRoot, "scripts", "check-stage-quality.mjs");
const node = process.execPath;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let workDir;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "stage-quality-test-"));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function writeTemp(name, content) {
  const p = join(workDir, name);
  writeFileSync(p, content, "utf8");
  return p;
}

function runScript(args = []) {
  return spawnSync(node, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
}

// ---------------------------------------------------------------------------
// Test 1: Normal scan on real repo exits 0 (count == 0)
// Proves Phase 1/2 compliant code passes — falsifiable because if the patterns
// were too broad and flagged real code, this would fail.
// ---------------------------------------------------------------------------

describe("clean repo scan", () => {
  it("scans the real repo and exits 0 (Phase 1/2 code is compliant)", () => {
    const result = runScript([]);
    expect(result.status).toBe(0);
    // Must explicitly report PASS — not just be silent
    expect(result.stdout).toMatch(/PASS/);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Inject a REAL temp file with a genuine V6① violation — scan must detect it.
// Falsifiable: if the scanner were a no-op, scanFiles([badFile]) would return [] and
// this test would fail (expect(findings.length).toBeGreaterThan(0) fails).
// ---------------------------------------------------------------------------

describe("violation detection (real temp file injection)", () => {
  it("V6① — detects collectFacts failure wired as throw in catch (real temp file)", () => {
    // This is a genuine anti-pattern: collectFacts called, exception caught, re-thrown.
    // Exactly what FR-GATE-002 forbids.
    const violationFile = writeTemp("v6a-violation.mjs", `
export async function badFactCollect(cfg) {
  try {
    await collectFacts("exec-1", {}, cfg);
  } catch (err) {
    throw new Error("fact collection failed: " + err.message);
  }
}
`);

    const findings = scanFiles([violationFile]);
    expect(findings.length).toBeGreaterThan(0);
    // Must be flagged as V6①
    expect(findings.some((f) => f.cls === "V6①")).toBe(true);
  });

  it("V6② — detects stage_result import + runtime throw (real temp file)", () => {
    const violationFile = writeTemp("v6b-violation.mjs", `
import { validateStageResult } from "./contracts/stage-result.contract.mjs";

export function checkAtRuntime(record) {
  const result = validateStageResult(record);
  if (!result.valid) {
    throw new Error("stage_result schema violation at runtime: " + result.errors.join(", "));
  }
}
`);

    const findings = scanFiles([violationFile]);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.cls === "V6②")).toBe(true);
  });

  it("V6③ — detects unmeasurable subjective metric auto-blocking (real temp file)", () => {
    const violationFile = writeTemp("v6c-violation.mjs", `
export function checkQuality(metrics) {
  if (!metrics.is_small_enough) {
    throw new Error("gate blocked: code is not small enough");
  }
}
`);

    const findings = scanFiles([violationFile]);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.cls === "V6③")).toBe(true);
  });

  it("compliant file (warn-and-continue) is NOT flagged — scanner distinguishes pattern", () => {
    // This mirrors the actual compliant pattern in metrics/collector.mjs:
    // collectFacts wraps in try/catch but emits stderr warning, never throws.
    const compliantFile = writeTemp("compliant.mjs", `
export function collectFacts(execution_id, factSeed, cfg) {
  try {
    const patch = factSeed ?? {};
    // ... fact derivation ...
    const result = patch;
    upsert(cfg.taskMetricsPath, execution_id, { facts: result }, cfg);
  } catch (err) {
    // Compliant: warn and continue — never throw
    process.stderr.write("[collectFacts warn] " + err.message + "\\n");
  }
}
`);

    const findings = scanFiles([compliantFile]);
    // Compliant file must produce zero findings
    expect(findings.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 3: --self-test mode exits 0 (injection detected, scanner not a no-op).
// Falsifiable: if the scanner were blind (always returned 0), self-test would
// exit 1 (because the assertion inside self-test would fail).
// ---------------------------------------------------------------------------

describe("--self-test mode", () => {
  it("exits 0 when self-test injection is detected (proves scanner is live)", () => {
    const result = runScript(["--self-test"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/self-test.*PASS/i);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Scanner excludes its own file from the scan.
// Falsifiable: if the scanner did NOT exclude itself, it would flag its own
// pattern strings (the regex literals) and exit 1 on a clean repo.
// ---------------------------------------------------------------------------

describe("self-exclusion", () => {
  it("the clean-repo scan exits 0 — proving the scanner excludes its own file", () => {
    // The scanner's own source contains catch blocks with throw/process.exit in
    // proximity to its own pattern strings, so if it were included in the scan it
    // would flag itself and exit 1. The clean-repo scan exits 0 (test 1 above),
    // which is the falsifiable proof that self-exclusion works correctly.
    // Here we run the scan a second time and verify exit 0 (no false-self-flag).
    const result = runScript([]);
    expect(result.status).toBe(0);
    // stdout must not mention the scanner's own file as a violation
    expect(result.stdout).not.toMatch(/check-stage-quality\.mjs.*VIOLATION/);
    expect(result.stderr).not.toMatch(/check-stage-quality\.mjs.*VIOLATION/);
  });
});
