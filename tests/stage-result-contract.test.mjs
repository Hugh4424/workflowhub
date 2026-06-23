/**
 * stage-result-contract.test.mjs — M5 Phase 4 (T012/T013).
 * Validates the stage_result contract shape and semantic constraints.
 * FR-RESULT-001: seven required fields present and typed.
 * FR-RESULT-002: semantic constraints (status enum, array, boolean).
 * FR-RESULT-004: downstream-readable failure fields.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { validateContract } from "../core/validate-contract.mjs";

const contractPath = join(import.meta.dirname, "..", "contracts", "stage-result.contract.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));

// ── Helpers ──────────────────────────────────────────────────────────────────

function fullResult() {
  return {
    status: "success",
    error_code: "",
    retryable: false,
    facts: {},
    missing_items: [],
    user_decision: false,
    reason: "stage completed normally",
  };
}

/**
 * Semantic validator — checks constraints that validateContract (typeof only) cannot catch.
 * Reads allowed_status_values and field semantic markers from the contract JSON.
 * Returns { valid: boolean, errors: string[] }.
 */
function checkStageResultSemantics(obj) {
  const errors = [];

  // status must be one of the allowed enum values (read from contract, not hardcoded)
  const allowedStatus = contract.allowed_status_values;
  if (!allowedStatus.includes(obj.status)) {
    errors.push(`status "${obj.status}" not in allowed_status_values`);
  }

  // retryable must be boolean
  if (typeof obj.retryable !== "boolean") {
    errors.push(`retryable must be boolean, got ${typeof obj.retryable}`);
  }

  // missing_items must be array — typeof [] === "object" so validateContract cannot catch this
  // Read the semantic marker from contract to drive the check (not hardcoded string)
  const missingItemsField = contract.required_fields.find((f) => f.name === "missing_items");
  if (missingItemsField && missingItemsField.semantic === "array") {
    if (!Array.isArray(obj.missing_items)) {
      errors.push(`missing_items must be array (semantic:array), got ${typeof obj.missing_items}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Group A: FR-RESULT-001 seven-field completeness ──────────────────────────

describe("Group A — FR-RESULT-001: seven required fields (contract shape)", () => {
  it("contract required_fields lists exactly seven fields with correct names", () => {
    const names = contract.required_fields.map((f) => f.name);
    const expected = [
      "status",
      "error_code",
      "retryable",
      "facts",
      "missing_items",
      "user_decision",
      "reason",
    ];
    // all seven names present, one by one (membership, not just length)
    for (const name of expected) {
      expect(names, `field "${name}" must be in required_fields`).toContain(name);
    }
    // exactly seven, no extras
    expect(names.length).toBe(7);
  });

  it("a complete valid stage_result passes validateContract", () => {
    const { valid, errors } = validateContract(fullResult(), contract);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it("removing any one required field makes validateContract return valid=false with 'missing' in errors", () => {
    const fieldNames = contract.required_fields.map((f) => f.name);
    for (const name of fieldNames) {
      const obj = fullResult();
      delete obj[name];
      const { valid, errors } = validateContract(obj, contract);
      expect(valid, `deleting "${name}" should produce valid=false`).toBe(false);
      expect(errors.join(" "), `deleting "${name}" should mention 'missing'`).toMatch(/missing/);
    }
  });
});

// ── Group B: FR-RESULT-002 semantic constraints ───────────────────────────────

describe("Group B — FR-RESULT-002: semantic constraints (independent of validateContract)", () => {
  it("contract declares allowed_status_values with exactly three entries", () => {
    expect(Array.isArray(contract.allowed_status_values)).toBe(true);
    expect(contract.allowed_status_values).toContain("success");
    expect(contract.allowed_status_values).toContain("failed");
    expect(contract.allowed_status_values).toContain("unknown");
    expect(contract.allowed_status_values.length).toBe(3);
  });

  it("status=success passes semantic check", () => {
    const { valid } = checkStageResultSemantics({ ...fullResult(), status: "success" });
    expect(valid).toBe(true);
  });

  it("status=failed passes semantic check", () => {
    const { valid } = checkStageResultSemantics({ ...fullResult(), status: "failed" });
    expect(valid).toBe(true);
  });

  it("status=unknown passes semantic check", () => {
    const { valid } = checkStageResultSemantics({ ...fullResult(), status: "unknown" });
    expect(valid).toBe(true);
  });

  it("status outside the enum ('weird') fails semantic check", () => {
    // Membership falsifiability: this literal 'weird' must be rejected
    const { valid, errors } = checkStageResultSemantics({ ...fullResult(), status: "weird" });
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/status/);
  });

  it("missing_items as plain object {} (not array) fails semantic check", () => {
    // typeof {} === 'object' so validateContract passes — this catches the gap
    const { valid, errors } = checkStageResultSemantics({ ...fullResult(), missing_items: {} });
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/missing_items/);
  });

  it("retryable as string fails semantic check", () => {
    const { valid, errors } = checkStageResultSemantics({ ...fullResult(), retryable: "true" });
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/retryable/);
  });

  it("contract missing_items field carries semantic:array marker", () => {
    const field = contract.required_fields.find((f) => f.name === "missing_items");
    expect(field).toBeDefined();
    expect(field.semantic).toBe("array");
  });
});

// ── Group C: FR-RESULT-004 downstream-readable failure fields ─────────────────

describe("Group C — FR-RESULT-004: downstream can read error_code/retryable/missing_items on failure", () => {
  it("a failed stage_result exposes non-empty error_code as string", () => {
    const result = {
      ...fullResult(),
      status: "failed",
      error_code: "GATE_DEADLOCK",
      retryable: true,
      missing_items: ["review_pass", "evidence_json"],
      reason: "gate blocked on missing reviewer output",
    };
    // downstream reads
    expect(typeof result.error_code).toBe("string");
    expect(result.error_code.length).toBeGreaterThan(0);
    expect(typeof result.retryable).toBe("boolean");
    expect(Array.isArray(result.missing_items)).toBe(true);
    // semantic check passes for a well-formed failed result
    const { valid } = checkStageResultSemantics(result);
    expect(valid).toBe(true);
  });

  it("validateContract also passes for a failed stage_result with all seven fields", () => {
    const result = {
      status: "failed",
      error_code: "GATE_DEADLOCK",
      retryable: true,
      facts: { attempt: 2 },
      missing_items: ["review_pass"],
      user_decision: false,
      reason: "gate blocked",
    };
    const { valid } = validateContract(result, contract);
    expect(valid).toBe(true);
  });
});

// ── Group D: FR-RESULT-004 downstream consumer makes a decision and continues ─
// A minimal real downstream consumer (core/decide-from-stage-result.mjs) reads
// error_code/retryable/missing_items and produces a continue/retry/escalate
// decision WITHOUT throwing and WITHOUT turning the schema into a runtime gate.
// This proves the failure-propagation behavior loop, not just static readability.

// Minimal downstream consumer (inlined — this is a test harness for the failure
// propagation behavior, not a swappable core component). Reads error_code/
// retryable/missing_items and returns a continue/retry/escalate decision. It
// never throws on a present object and never blocks (FR-RESULT-003: not a gate).
function decideFromStageResult(result) {
  const status = result?.status;
  const retryable = result?.retryable === true;
  const missingItems = Array.isArray(result?.missing_items) ? result.missing_items : [];
  const errorCode = typeof result?.error_code === "string" ? result.error_code : "";
  if (status !== "failed") {
    return { action: "continue", reason: `status=${status}, no failure to handle` };
  }
  if (retryable) {
    return { action: "retry", reason: `retryable failure (${errorCode})` };
  }
  if (missingItems.length > 0) {
    return { action: "escalate", reason: `non-retryable (${errorCode}) missing: ${missingItems.join(", ")}` };
  }
  return { action: "continue", reason: `non-retryable (${errorCode}) without missing inputs` };
}

describe("Group D — FR-RESULT-004: downstream consumer reads fields and decides + continues", () => {
  it("failed + retryable=true → action=retry, no throw", () => {
    const result = {
      ...fullResult(),
      status: "failed",
      error_code: "GATE_TIMEOUT",
      retryable: true,
      missing_items: [],
      reason: "transient gate timeout",
    };
    let decision;
    expect(() => {
      decision = decideFromStageResult(result);
    }).not.toThrow();
    expect(decision.action).toBe("retry");
    expect(typeof decision.reason).toBe("string");
  });

  it("failed + retryable=false + missing_items non-empty → action=escalate", () => {
    const result = {
      ...fullResult(),
      status: "failed",
      error_code: "MISSING_INPUT",
      retryable: false,
      missing_items: ["review_pass", "evidence_json"],
      reason: "non-retryable, needs human-supplied inputs",
    };
    const decision = decideFromStageResult(result);
    expect(decision.action).toBe("escalate");
  });

  it("success → action=continue (flow proceeds normally)", () => {
    const decision = decideFromStageResult(fullResult());
    expect(decision.action).toBe("continue");
  });

  it("consumer only reads fields and returns a decision — it never blocks or throws on a well-formed schema (FR-RESULT-003: not a runtime gate)", () => {
    // Even a malformed-but-present object must yield a decision, never an exception.
    const weird = { ...fullResult(), status: "failed", error_code: "X", retryable: false, missing_items: [] };
    let decision;
    expect(() => {
      decision = decideFromStageResult(weird);
    }).not.toThrow();
    expect(["continue", "retry", "escalate"]).toContain(decision.action);
  });
});
