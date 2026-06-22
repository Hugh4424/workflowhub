/**
 * check-contract.test.mjs  (FR-NC-005)
 *
 * Tests for scripts/check-contract.mjs — written RED-first.
 * Asserts: exits 0 on a valid contract; exits non-zero on structural violations
 * and on FR-NC-005 business-content field injection.
 */

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { describe, test, expect } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const checkerScript = resolve(repoRoot, "scripts", "check-contract.mjs");
const realContract = resolve(repoRoot, "contracts", "component-output.contract.json");

/** Run check-contract.mjs with an optional --contract override path. */
function run(contractPath = undefined, extraArgs = []) {
  const args = [checkerScript];
  if (contractPath) {
    args.push("--contract", contractPath);
  }
  args.push(...extraArgs);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15_000,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: (result.stdout ?? "") + (result.stderr ?? ""),
  };
}

/** Write a contract JSON to a temp file and return its path. */
function writeTmpContract(obj) {
  const dir = mkdtempSync(`${tmpdir()}/check-contract-test-`);
  const p = `${dir}/contract.json`;
  writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

// ---------------------------------------------------------------------------
// Happy path: real contract exits 0
// ---------------------------------------------------------------------------

describe("check-contract: valid contract exits 0", () => {
  test("real contracts/component-output.contract.json exits 0", () => {
    const r = run(realContract);
    expect(r.status).toBe(0);
  });

  test("stdout contains PASS marker", () => {
    const r = run(realContract);
    expect(r.output).toMatch(/PASS/i);
  });
});

// ---------------------------------------------------------------------------
// FR-NC-005: business-content field injected → exit non-zero
// ---------------------------------------------------------------------------

describe("FR-NC-005: business-content field injection → exit non-zero", () => {
  test("extra field 'status' injected into required_fields → exit 1", () => {
    const bad = writeTmpContract({
      version: "1.0.0",
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "string" },
        { name: "output_path", type: "string" },
        { name: "status", type: "string" },   // business-content field — forbidden
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });

  test("output mentions FR-NC-005 or 'business' or unexpected field reason", () => {
    const bad = writeTmpContract({
      version: "1.0.0",
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "string" },
        { name: "output_path", type: "string" },
        { name: "task_type", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.output).toMatch(/FR-NC-005|business|unexpected field|not allowed/i);
  });
});

// ---------------------------------------------------------------------------
// Structural violations → exit non-zero
// ---------------------------------------------------------------------------

describe("check-contract: structural violations exit non-zero", () => {
  test("missing version field → exit 1", () => {
    const bad = writeTmpContract({
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "string" },
        { name: "output_path", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });

  test("version not a string → exit 1", () => {
    const bad = writeTmpContract({
      version: 42,
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "string" },
        { name: "output_path", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });

  test("missing validated_by_stage field → exit 1", () => {
    const bad = writeTmpContract({
      version: "1.0.0",
      required_fields: [
        { name: "component_id", type: "string" },
        { name: "output_path", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });

  test("missing component_id in required_fields → exit 1", () => {
    const bad = writeTmpContract({
      version: "1.0.0",
      validated_by_stage: null,
      required_fields: [
        { name: "output_path", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });

  test("missing output_path in required_fields → exit 1", () => {
    const bad = writeTmpContract({
      version: "1.0.0",
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });
});

// ---------------------------------------------------------------------------
// T010 exact-structure: duplicate names and wrong length → exit non-zero
// ---------------------------------------------------------------------------

describe("T010 exact-structure: duplicate field names → exit non-zero", () => {
  test("duplicate component_id in required_fields (3 entries) → exit non-zero", () => {
    const bad = writeTmpContract({
      version: "1.0.0",
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "string" },
        { name: "output_path",  type: "string" },
        { name: "component_id", type: "string" },  // duplicate — must be rejected
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });

  test("only one field (length 1) → exit non-zero", () => {
    const bad = writeTmpContract({
      version: "1.0.0",
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateContract integration: checker runs accept/reject samples
// ---------------------------------------------------------------------------

describe("check-contract: validateContract smoke (accept/reject samples)", () => {
  test("valid output sample passes internal validateContract run (PASS reported)", () => {
    // Real contract — checker runs validateContract with a valid sample internally
    const r = run(realContract);
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/sample.*pass|valid.*sample|PASS/i);
  });

  test("exit 1 reported when contract itself would reject its own sample", () => {
    // A structurally bad contract (wrong type for component_id) should fail
    const bad = writeTmpContract({
      version: "1.0.0",
      validated_by_stage: null,
      required_fields: [
        { name: "component_id", type: "number" },   // wrong type — valid output has string
        { name: "output_path", type: "string" },
      ],
    });
    const r = run(bad);
    expect(r.status).not.toBe(0);
  });
});
