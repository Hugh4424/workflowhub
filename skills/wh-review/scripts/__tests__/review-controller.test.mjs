import { describe, expect, it } from "vitest";
import { buildClassificationManifest, buildIncrementalReviewDelta, deriveChangeClassification, selectReviewRound } from "../review-controller.mjs";

const route = { mode: "full_on_structural_rework", initial: ["kimi/k3", "cursor/grok"] };
const previous = {
  result_ref: "quality/reviews/results/spec.json",
  verdict: "revise_required",
  snapshot_tree: "a".repeat(40),
};

describe("review round controller", () => {
  it("runs one review for a snapshot and never creates a same-snapshot follow-up", () => {
    expect(selectReviewRound({ stage: "build-spec", route, previousResult: null })).toEqual({ round: "initial", reason: "first_review" });
    expect(selectReviewRound({ stage: "build-spec", route, previousResult: previous, currentSnapshotTree: previous.snapshot_tree })).toEqual({
      round: "none", reason: "current_quality_fact_recorded",
    });
  });

  it("starts one fresh review after the snapshot changes", () => {
    expect(selectReviewRound({ stage: "build-code", route, previousResult: previous, currentSnapshotTree: "b".repeat(40) })).toEqual({
      round: "initial", reason: "changed_snapshot",
    });
  });

  it("scopes a changed first-three-stage material set to a runner-generated delta after pass", () => {
    const baselineMaterials = { approved_decision: "old decision", draft_spec: "old spec" };
    const passed = {
      ...previous,
      verdict: "pass",
      snapshot_tree: "a".repeat(40),
      classification_manifest: buildClassificationManifest(baselineMaterials),
    };
    const currentMaterials = { approved_decision: "old decision", draft_spec: "new spec" };
    const delta = buildIncrementalReviewDelta({
      stage: "build-spec",
      previousResult: passed,
      currentSnapshotTree: "b".repeat(40),
      currentMaterials,
    });
    expect(delta).toMatchObject({
      schema_version: "wh-review-delta.v1",
      scope: "changed_materials_and_direct_impacts",
      changed_materials: [{ identity: "draft_spec", change: "changed", content: "new spec" }],
    });
    expect(selectReviewRound({
      stage: "build-spec", route, previousResult: passed,
      currentSnapshotTree: "b".repeat(40), incrementalAvailable: true,
    })).toEqual({ round: "incremental", reason: "changed_material_incremental" });
  });

  it("does not invent an incremental scope without an authenticated prior manifest", () => {
    expect(buildIncrementalReviewDelta({
      stage: "build-plan",
      previousResult: { ...previous, verdict: "pass" },
      currentSnapshotTree: "b".repeat(40),
      currentMaterials: { draft_plan: "new" },
    })).toBeNull();
  });

  it("keeps pass and revise_required as immutable quality facts", () => {
    for (const verdict of ["pass", "revise_required"]) {
      expect(selectReviewRound({
        stage: "verify-code", route, previousResult: { ...previous, verdict }, currentSnapshotTree: previous.snapshot_tree,
      })).toEqual({ round: "none", reason: "current_quality_fact_recorded" });
    }
  });

  it("rejects non-semantic prior results", () => {
    expect(() => selectReviewRound({ stage: "build-plan", route, previousResult: { ...previous, verdict: "unavailable" } }))
      .toThrow(/previous result must be semantic/);
  });

  it("derives structural dimensions only from frozen material manifests", () => {
    const ordinary = deriveChangeClassification({
      previousSnapshotTree: "a".repeat(40), currentSnapshotTree: "b".repeat(40),
      previousManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "notes", category: "explanation", sha256: "1".repeat(64) }] },
      currentManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "notes", category: "explanation", sha256: "2".repeat(64) }] },
    });
    const structural = deriveChangeClassification({
      previousSnapshotTree: "a".repeat(40), currentSnapshotTree: "b".repeat(40),
      previousManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "schema", category: "contract", sha256: "1".repeat(64) }] },
      currentManifest: { version: "wh-review-classification-manifest.v1", entries: [{ identity: "schema", category: "contract", sha256: "2".repeat(64) }] },
    });
    expect(ordinary).toMatchObject({ structural: false, changed_dimensions: [] });
    expect(structural).toMatchObject({ structural: true, changed_dimensions: ["interface"] });
  });

  it("does not include controller ledgers in the provider classification manifest", () => {
    const manifest = buildClassificationManifest({ approved_spec: { ok: true }, response_ledger: { forged: true } });
    expect(manifest.entries.map(({ identity }) => identity)).toEqual(["approved_spec"]);
  });
});
