import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import { extractAcceptanceCriteria, validateCoverage, validateFinalGates } from "../../tools/architecture/verify-final-coverage.mjs";
import { governanceTreeHash } from "../../tools/architecture/inventory.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const generatedExecutionRefs = [];
let generatedExecutionId = 0;
const PHASE9_ROOT = path.join(ROOT, "evidence", "phase-9");
const DEFAULT_EXECUTION_ORACLES = [
  "tests/contract/review-layering.test.mjs",
  "tests/contract/repository-governance.test.mjs",
];

afterEach(() => {
  for (const ref of generatedExecutionRefs.splice(0)) fs.rmSync(path.join(ROOT, ref), { force: true });
});

beforeAll(() => { fs.mkdirSync(PHASE9_ROOT, { recursive: true }); });
afterAll(() => { fs.rmSync(path.join(ROOT, "evidence"), { recursive: true, force: true }); });

function writeCurrentExecution(oracles) {
  const ref = `evidence/phase-9/.final-coverage-test-${++generatedExecutionId}.json`;
  const result = {
    success: true,
    numTotalTests: oracles.length,
    numPassedTests: oracles.length,
    numFailedTests: 0,
    testResults: oracles.map((oracle) => ({
      name: path.resolve(ROOT, oracle),
      status: "passed",
      assertionResults: [{ status: "passed" }],
    })),
  };
  fs.writeFileSync(path.join(ROOT, ref), JSON.stringify(result));
  generatedExecutionRefs.push(ref);
  return ref;
}

function writePhase9File(name, contents) {
  const ref = `evidence/phase-9/${name}`;
  fs.writeFileSync(path.join(ROOT, ref), contents);
  generatedExecutionRefs.push(ref);
  return ref;
}

function boundCoverage({ status = "focused_pass", oracleRef = "tests/contract/review-layering.test.mjs", oracles = null, executionRef = null } = {}) {
  const refHash = (ref) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex");
  const oracleRefs = oracles === null ? [oracleRef] : oracles;
  const currentExecutionRef = executionRef ?? writeCurrentExecution(DEFAULT_EXECUTION_ORACLES);
  return {
    schema_version: "workflowhub-final-coverage.v2",
    snapshot_tree: "tree",
    items: [{
      acceptance_criterion_id: "AC-01",
      status,
      ...(oracles === null
        ? { oracle: { ref: oracleRef, sha256: refHash(oracleRef) } }
        : { oracles: oracles.map((ref) => ({ ref, sha256: refHash(ref) })) }),
      execution: { ref: currentExecutionRef, sha256: refHash(currentExecutionRef) },
    }],
  };
}

describe("final direct coverage contract", () => {
  test("extracts unique acceptance criteria from the spec", () => {
    const spec = "- [ ] **AC-01**: one\n- [x] **AC-02**: two\n- [ ] **AC-01**: duplicate\n";
    expect(extractAcceptanceCriteria(spec)).toEqual(["AC-01", "AC-02"]);
  });

  test("rejects a missing or tampered direct evidence reference", () => {
    const fixture = path.join(ROOT, "tests/fixtures/mutations/identity-tree-hash.json");
    const coverage = boundCoverage();
    coverage.items[0].oracle.sha256 = "0".repeat(64);
    const errors = validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] });
    expect(errors.some((error) => error.includes("hash mismatch"))).toBe(true);
    expect(fs.existsSync(fixture)).toBe(true);
  });

  test("rejects duplicate direct coverage rows instead of silently taking the last row", () => {
    const coverage = boundCoverage();
    coverage.items.push({ ...coverage.items[0], status: "deferred" });
    expect(validateCoverage({
      specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"], currentTree: "tree",
    })).toContain("duplicate acceptance criterion: AC-01");
  });

  test("rejects deferred evidence from final, including tree-bound, coverage", () => {
    const coverage = boundCoverage({ status: "deferred" });
    const errors = validateCoverage({
      specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"], currentTree: "tree",
    });
    expect(errors).toContain("AC-01 is deferred; final coverage requires direct verification");
  });

  test("allows deferred evidence only in explicit unbound progress mode", () => {
    const coverage = boundCoverage({ status: "deferred" });
    expect(validateCoverage({
      specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"], mode: "progress",
    })).toEqual([]);
    expect(validateCoverage({
      specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"], mode: "progress", currentTree: "tree",
    })).toContain("progress coverage cannot bind the current tree");
  });

  test("rejects final gate evidence outside the archived phase-9 directory", () => {
    const gates = {
      schema_version: "workflowhub-final-gates.v2",
      status: "passed",
      snapshot_tree: "tree",
      missing_required_commands: [],
      commands: Object.fromEntries([
        "inventory", "clean_install", "npm_test", "npm_run_check", "focused_final", "complexity_hard_gates", "diff_check",
      ].map((name) => [name, { kind: name, ref: "/private/tmp/final.out", sha256: "0".repeat(64), exit_code: 0 }])),
    };
    expect(validateFinalGates({ gates, currentTree: "tree" }).some((error) => error.includes("archived phase-9"))).toBe(true);
  });

  test("accepts hash-checked archived final gate evidence", () => {
    const ref = writeCurrentExecution(DEFAULT_EXECUTION_ORACLES);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex");
    const gates = {
      schema_version: "workflowhub-final-gates.v2",
      status: "passed",
      snapshot_tree: "tree",
      missing_required_commands: [],
      commands: Object.fromEntries([
        "inventory", "clean_install", "npm_test", "npm_run_check", "focused_final", "complexity_hard_gates", "diff_check",
      ].map((name) => [name, { kind: name, ref, sha256: hash, exit_code: 0 }])),
    };
    expect(validateFinalGates({ gates, currentTree: "tree" })).toEqual([]);
  });

  test("keeps an honestly incomplete final gate record usable for progress reporting but not formal publication", () => {
    const ref = writeCurrentExecution(DEFAULT_EXECUTION_ORACLES);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex");
    const gates = {
      schema_version: "workflowhub-final-gates.v2",
      status: "incomplete",
      snapshot_tree: "tree",
      missing_required_commands: ["clean_install"],
      commands: Object.fromEntries([
        "inventory", "npm_test", "npm_run_check", "focused_final", "complexity_hard_gates", "diff_check",
      ].map((name) => [name, { kind: name, ref, sha256: hash, exit_code: 0 }])),
    };
    expect(validateFinalGates({ gates, currentTree: gates.snapshot_tree })).toContain("final gates are incomplete");
    expect(validateFinalGates({ gates, currentTree: gates.snapshot_tree, allowIncomplete: true })).toEqual([]);
  });

  test("keeps direct AC coverage out of gate inputs so terminal validation can bind both independently", () => {
    const ref = writeCurrentExecution(DEFAULT_EXECUTION_ORACLES);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex");
    const gates = {
      schema_version: "workflowhub-final-gates.v2",
      status: "passed",
      snapshot_tree: "tree",
      missing_required_commands: [],
      commands: Object.fromEntries([
        "inventory", "clean_install", "npm_test", "npm_run_check", "focused_final", "complexity_hard_gates", "diff_check",
      ].map((name) => [name, { kind: name, ref, sha256: hash, exit_code: 0 }])),
    };
    expect(validateFinalGates({ gates, currentTree: "tree" })).toEqual([]);
    gates.commands.coverage = { ref, sha256: hash };
    expect(validateFinalGates({ gates, currentTree: "tree" }))
      .toContain("unexpected final gate command: coverage");
  });

  test("rejects a final gate whose hash-valid evidence has the wrong command kind", () => {
    const ref = writeCurrentExecution(DEFAULT_EXECUTION_ORACLES);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex");
    const gates = {
      schema_version: "workflowhub-final-gates.v2",
      status: "passed",
      snapshot_tree: "tree",
      missing_required_commands: [],
      commands: Object.fromEntries([
        "inventory", "clean_install", "npm_test", "npm_run_check", "focused_final", "complexity_hard_gates", "diff_check",
      ].map((name) => [name, { kind: name, ref, sha256: hash, exit_code: 0 }])),
    };
    gates.commands.clean_install.kind = "npm_test";
    expect(validateFinalGates({ gates, currentTree: "tree" })).toContain("final gate clean_install evidence kind must be clean_install");
  });

  test("rejects a passed gate record whose archived command failed", () => {
    const ref = writeCurrentExecution(DEFAULT_EXECUTION_ORACLES);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex");
    const gates = {
      schema_version: "workflowhub-final-gates.v2",
      status: "passed",
      snapshot_tree: "tree",
      missing_required_commands: [],
      commands: Object.fromEntries([
        "inventory", "clean_install", "npm_test", "npm_run_check", "focused_final", "complexity_hard_gates", "diff_check",
      ].map((name) => [name, { kind: name, ref, sha256: hash, exit_code: 0 }])),
    };
    gates.commands.clean_install.exit_code = 1;
    expect(validateFinalGates({ gates, currentTree: "tree" }))
      .toContain("final gate clean_install execution failed with exit_code 1");
  });

  test("requires a fixed test oracle and a separate phase-9 execution record for every AC", () => {
    const coverage = boundCoverage();
    coverage.items[0].execution.ref = "tests/contract/final-coverage.test.mjs";
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] }))
      .toContain("AC-01 execution must reference archived phase-9 evidence: tests/contract/final-coverage.test.mjs");
  });

  test("rejects an execution record that did not run the fixed oracle", () => {
    const coverage = boundCoverage({ oracleRef: "tests/contract/final-coverage.test.mjs" });
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] }))
      .toContain("AC-01 execution did not run its oracle source: tests/contract/final-coverage.test.mjs");
  });

  test("rejects non-JSON execution evidence instead of skipping oracle verification", () => {
    const coverage = boundCoverage();
    const ref = writePhase9File("npm-test-final.out", "not-json\n");
    coverage.items[0].execution = {
      ref,
      sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ref))).digest("hex"),
    };
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] }))
      .toContain("AC-01 execution must be a canonical Vitest JSON report");
  });

  test("accepts a fixed multi-oracle matrix only when every oracle ran in one canonical execution", () => {
    const coverage = boundCoverage({
      oracles: [
        "tests/contract/review-layering.test.mjs",
        "tests/contract/repository-governance.test.mjs",
      ],
    });
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] })).toEqual([]);
  });

  test("rejects ambiguous, empty, duplicated, or split multi-oracle coverage", () => {
    const ambiguous = boundCoverage({ oracles: ["tests/contract/review-layering.test.mjs"] });
    ambiguous.items[0].oracle = { ref: "tests/contract/review-layering.test.mjs", sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "tests/contract/review-layering.test.mjs"))).digest("hex") };
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage: ambiguous, required: ["AC-01"] }))
      .toContain("AC-01 must declare exactly one of oracle or oracles");

    const empty = boundCoverage({ oracles: [] });
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage: empty, required: ["AC-01"] }))
      .toContain("AC-01 oracles must be a non-empty array");

    const duplicate = boundCoverage({ oracles: ["tests/contract/review-layering.test.mjs", "tests/contract/review-layering.test.mjs"] });
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage: duplicate, required: ["AC-01"] }))
      .toContain("AC-01 oracles contains duplicate source: tests/contract/review-layering.test.mjs");

    const split = boundCoverage({ oracles: ["tests/contract/review-layering.test.mjs", "tests/final-cutover-guards.red.test.mjs"] });
    expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage: split, required: ["AC-01"] }))
      .toContain("AC-01 execution did not run its oracle source: tests/final-cutover-guards.red.test.mjs");
  });

  test("rejects a hash-valid hand-written execution record without a canonical Vitest summary", () => {
    const fakeRef = "evidence/phase-9/fake-test-result.json";
    const fake = { testResults: [{ name: path.join(ROOT, "tests/contract/review-layering.test.mjs"), assertionResults: [{ status: "passed" }] }] };
    const coverage = boundCoverage();
    const originalRef = coverage.items[0].execution.ref;
    const originalHash = coverage.items[0].execution.sha256;
    try {
      fs.writeFileSync(path.join(ROOT, fakeRef), JSON.stringify(fake));
      coverage.items[0].execution = { ref: fakeRef, sha256: crypto.createHash("sha256").update(JSON.stringify(fake)).digest("hex") };
      expect(validateCoverage({ specText: "- [ ] **AC-01**: one\n", coverage, required: ["AC-01"] }))
        .toContain("AC-01 execution record is not a successful canonical Vitest JSON report");
    } finally {
      fs.rmSync(path.join(ROOT, fakeRef), { force: true });
      coverage.items[0].execution = { ref: originalRef, sha256: originalHash };
    }
  });

  test("rejects stale final coverage instead of accepting an old snapshot", () => {
    const specText = fs.readFileSync(path.join(ROOT, "specs/archive/workflowhub-complexity-governance-v2/spec.md"), "utf8");
    const coverage = {
      schema_version: "workflowhub-final-coverage.v2",
      snapshot_tree: "0".repeat(64),
      items: [],
    };
    expect(validateCoverage({
      specText,
      coverage,
      required: Array.from({ length: 15 }, (_, index) => `AC-${String(index + 1).padStart(2, "0")}`),
      currentTree: governanceTreeHash(),
    })).toContain("coverage snapshot tree does not match current tree");
  });
});
