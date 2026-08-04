import { describe, expect, it } from "vitest";

import { normalizeAcceptanceEvidencePublication } from "../../tools/cli/stage-runtime.mjs";

describe("verify-code acceptance publication input", () => {
  const tree = "b".repeat(40);
  const ref = { ref: "evidence/test-output.txt", sha256: "a".repeat(64) };
  const summary = {
    scenario: "publish authenticated acceptance evidence",
    oracle: "structured semantics and runtime-owned snapshot are preserved",
    actual_outcome: "published",
    evidence_type: "structured_observation",
    coverage_limits: ["official publisher boundary"],
    exceptions: ["none"],
  };

  it("preserves an optional structured summary and injects the runtime snapshot", () => {
    expect(normalizeAcceptanceEvidencePublication({
      acceptance_criterion_id: "AC-SUMMARY",
      result: "pass",
      refs: [ref],
      summary,
    }, tree)).toMatchObject({
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "AC-SUMMARY",
      result: "pass",
      refs: [ref],
      summary,
      snapshot_tree: tree,
    });
  });

  it("keeps old summary-free callers compatible", () => {
    const value = normalizeAcceptanceEvidencePublication({
      acceptance_criterion_id: "AC-LEGACY",
      result: "pass",
      refs: [ref],
    }, tree);
    expect(value.snapshot_tree).toBe(tree);
    expect(value).not.toHaveProperty("summary");
  });

  it.each([
    ["caller snapshot", { snapshot_tree: "0".repeat(40) }, /snapshot_tree.*caller|unknown field/i],
    ["empty summary", { summary: {} }, /summary.*non-empty|summary.*field/i],
    ["unknown field", { output_ref: "evidence/caller.json" }, /unknown field|requires/i],
  ])("rejects %s", (_label, extra, error) => {
    expect(() => normalizeAcceptanceEvidencePublication({
      acceptance_criterion_id: "AC-INVALID",
      result: "pass",
      refs: [ref],
      ...extra,
    }, tree)).toThrow(error);
  });
});
