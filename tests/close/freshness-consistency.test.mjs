import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("C5 immutable evidence binding", () => {
  it("removes the retired currentness evaluator and injection surface while keeping proof helpers", () => {
    const freshness = readFileSync(new URL("../../runtime/evidence/freshness.mjs", import.meta.url), "utf8");
    const predicates = readFileSync(new URL("../../runtime/stage/completion-predicates.mjs", import.meta.url), "utf8");

    expect(freshness).not.toContain("evaluateFactFreshness");
    expect(predicates).not.toContain("evaluate_freshness");
    expect(predicates).not.toContain("evaluateFreshness");
    expect(freshness).toContain("validateStageOutcomeProof");
    expect(freshness).toContain("authenticateStageReviewResult");
  });
});
