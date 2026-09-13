import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { assertFresh, bindFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";

describe("C5 immutable evidence binding", () => {
  it("retains content-addressed bytes and snapshot identity without a freshness evaluator", () => {
    const raw = "immutable quality evidence\n";
    const binding = bindFreshness({ ref: "quality/evidence/example.txt", raw, snapshotTree: "a".repeat(40) });

    expect(binding).toEqual({
      ref: "quality/evidence/example.txt",
      sha256: sha256(raw),
      snapshot_tree: "a".repeat(40),
    });
    expect(assertFresh(binding, { read: () => raw, snapshotTree: binding.snapshot_tree })).toBe(true);
    expect(() => assertFresh(binding, { read: () => raw, snapshotTree: "b".repeat(40) })).toThrow(/snapshot_tree changed/);
    expect(() => assertFresh(binding, { read: () => "tampered\n", snapshotTree: binding.snapshot_tree })).toThrow(/hash changed/);
  });

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
