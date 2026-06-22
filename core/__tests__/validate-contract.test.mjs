/**
 * RED tests for core/validate-contract.mjs (FR-NC-004, FR-NC-005).
 * Module does NOT exist yet — all tests must fail with import error.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Dynamic import so describe blocks register even when module is absent.
let validateContract;
try {
  const mod = await import("../validate-contract.mjs");
  validateContract = mod.validateContract;
} catch {
  validateContract = undefined;
}

// Helper: fail with clear message if import failed.
function ensureModule() {
  if (typeof validateContract !== "function") {
    throw new Error(
      "core/validate-contract.mjs does not export validateContract — module missing (expected RED)"
    );
  }
}

// Load the contract file once for reuse.
const CONTRACT_PATH = resolve(__dirname, "../../contracts/component-output.contract.json");
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));

// ─── Scenario 1: valid output passes ─────────────────────────────────────────
describe("validateContract — valid output", () => {
  it("returns {valid:true, errors:[]} for a fully valid output", () => {
    ensureModule();
    const result = validateContract(
      { component_id: "x", output_path: "/tmp/y" },
      contract
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// ─── Scenario 2: missing fields ──────────────────────────────────────────────
describe("validateContract — missing required fields", () => {
  it("returns valid:false and non-empty errors when component_id is missing", () => {
    ensureModule();
    const result = validateContract({ output_path: "/tmp/y" }, contract);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns valid:false and non-empty errors when output_path is missing", () => {
    ensureModule();
    const result = validateContract({ component_id: "x" }, contract);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─── Scenario 3: wrong type ───────────────────────────────────────────────────
describe("validateContract — wrong field type", () => {
  it("returns valid:false when component_id is a number instead of string", () => {
    ensureModule();
    const result = validateContract(
      { component_id: 123, output_path: "/tmp/y" },
      contract
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─── Scenario 4: T003b path-only constraint (FR-NC-005) ──────────────────────
// Falsifiable check: contract carries ONLY path/id reference fields, nothing else.
describe("FR-NC-005 — contract required_fields is exactly {component_id, output_path}", () => {
  it("required_fields contains exactly 2 entries", () => {
    const names = new Set(contract.required_fields.map((f) => f.name));
    expect(names.size).toBe(2);
  });

  it("required_fields contains component_id", () => {
    const names = new Set(contract.required_fields.map((f) => f.name));
    expect(names.has("component_id")).toBe(true);
  });

  it("required_fields contains output_path", () => {
    const names = new Set(contract.required_fields.map((f) => f.name));
    expect(names.has("output_path")).toBe(true);
  });
});
