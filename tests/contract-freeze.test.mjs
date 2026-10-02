/**
 * T014 / T015 — contract freeze + reverse-constraint test.
 *
 * FR-ST-004 acceptance #3: contract may be frozen ONLY after
 * the intake->design spike passes. validated_by_stage must be
 * set to "intake->design" to signal freeze; null/"" means NOT frozen.
 *
 * Test structure (TDD):
 *   RED  (before T014): "contract is frozen" assertion fails because
 *         validated_by_stage is still null.
 *   GREEN (after T014): validated_by_stage set → all assertions pass.
 *
 * Reverse-constraint (FR-ST-004): asserts BOTH directions so that
 * a contract with null/"" validated_by_stage is never treated as frozen.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const CONTRACT_PATH = new URL(
  "../contracts/component-output.contract.json",
  import.meta.url,
).pathname;

const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));

// ---------------------------------------------------------------------------
// Predicate: isFrozen — minimal inline definition (YAGNI: no separate module)
// A contract is frozen iff validated_by_stage is a non-empty string.
// ---------------------------------------------------------------------------

function isFrozen(c) {
  return c.validated_by_stage != null && c.validated_by_stage !== "";
}

// ---------------------------------------------------------------------------
// FR-ST-004 reverse-constraint: isFrozen semantics in BOTH directions
// ---------------------------------------------------------------------------

describe("isFrozen predicate — reverse-constraint (FR-ST-004)", () => {
  it("returns false for validated_by_stage = null (not frozen)", () => {
    expect(isFrozen({ validated_by_stage: null })).toBe(false);
  });

  it("returns false for validated_by_stage = '' (not frozen)", () => {
    expect(isFrozen({ validated_by_stage: "" })).toBe(false);
  });

  it("returns true for validated_by_stage = 'intake->design' (frozen)", () => {
    expect(isFrozen({ validated_by_stage: "intake->design" })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T014 / T015 — the actual contract file must now be frozen
// RED before T014 (validated_by_stage still null), GREEN after.
// ---------------------------------------------------------------------------

describe("contract file freeze (T014 / T015)", () => {
  it("contract validated_by_stage === 'intake->design'", () => {
    expect(contract.validated_by_stage).toBe("intake->design");
  });

  it("contract is frozen per isFrozen predicate", () => {
    expect(isFrozen(contract)).toBe(true);
  });
});
