import { describe, expect, it } from "vitest";

import { auditRetention, discoverLearning } from "../../tools/architecture/retention-audit.mjs";

describe("governance learning is retained but non-gating", () => {
  it("locates present M14-M17 materials and records absent material as unknown", () => {
    const entries = discoverLearning({ root: process.cwd() });
    expect(entries.map(({ id }) => id)).toEqual(["M14a", "M14b", "M15", "M16", "M17a", "M17b"]);
    expect(entries.find(({ id }) => id === "M14a")).toMatchObject({ status: "present" });
    expect(entries.find(({ id }) => id === "M14b")).toMatchObject({ status: "present" });
    expect(entries.find(({ id }) => id === "M15")).toMatchObject({ status: "present" });
    expect(entries.find(({ id }) => id === "M16")).toMatchObject({ status: "unknown" });
    expect(entries.find(({ id }) => id === "M17a")).toMatchObject({ status: "unknown" });
    expect(entries.find(({ id }) => id === "M17b")).toMatchObject({ status: "unknown" });
  });

  it("does not turn unknown learning into a stage gate", () => {
    const result = auditRetention({ root: process.cwd() });
    expect(result.non_gating).toBe(true);
    expect(result.unknown_learning).toEqual(expect.arrayContaining(["M16", "M17a", "M17b"]));
    // The frozen inventory predates an existing archive move. That historical
    // drift remains visible, but this diagnostic must not turn it into a
    // product-stage gate or authorize history rewriting.
    expect(result.errors).toEqual(expect.arrayContaining([
      "new historical file appeared: specs/archive/workflowhub-delivery-flow-quality-v1/decision-log.md",
      "new historical file appeared: specs/archive/workflowhub-delivery-flow-quality-v1/plan.md",
      "new historical file appeared: specs/archive/workflowhub-delivery-flow-quality-v1/spec.md",
      "new historical file appeared: specs/archive/workflowhub-delivery-flow-quality-v1/tasks.md",
    ]));
    expect(result.errors.every((error) => error.startsWith("new historical file appeared:"))).toBe(true);
  });
});
