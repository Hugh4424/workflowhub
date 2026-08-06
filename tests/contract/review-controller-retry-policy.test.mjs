import { describe, expect, it } from "vitest";

import { buildClassificationManifest, selectReviewRound } from "../../runtime/review/review-controller.mjs";

const route = { mode: "full_on_structural_rework", initial: ["external/reviewer"] };
const previousPass = {
  result_ref: "quality/reviews/results/build-plan.json",
  verdict: "pass",
  snapshot_tree: "a".repeat(40),
  adjudication: { clusters: [] },
  classification_manifest: buildClassificationManifest({ draft_spec: "baseline" }),
};

const previousReviseRequired = {
  ...previousPass,
  result_ref: "quality/reviews/results/build-code.json",
  verdict: "revise_required",
};

describe("review-controller retry policy", () => {
  it.each(["build-spec", "build-plan", "verify-code"])("%s closes same-snapshot retries once a quality fact exists", (stage) => {
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previousPass,
      currentSnapshotTree: previousPass.snapshot_tree,
    })).toEqual({ round: "none", reason: "current_quality_fact_recorded" });
  });

  it("requires a changed snapshot before build-code can ask for another final review", () => {
    expect(selectReviewRound({
      stage: "build-code",
      route,
      previousResult: previousReviseRequired,
      currentSnapshotTree: previousReviseRequired.snapshot_tree,
    })).toEqual({ round: "none", reason: "current_quality_fact_recorded" });
  });

  it("uses one incremental retry for changed advisory stages after a pass", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan"]) {
      expect(selectReviewRound({
        stage,
        route,
        previousResult: previousPass,
        currentSnapshotTree: "b".repeat(40),
        incrementalAvailable: true,
      })).toEqual({ round: "incremental", reason: "changed_material_incremental" });
    }
  });

  it.each(["build-code", "verify-code"])("%s restarts with a full review on changed snapshots", (stage) => {
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previousPass,
      currentSnapshotTree: "b".repeat(40),
      incrementalAvailable: true,
    })).toEqual({ round: "initial", reason: "changed_snapshot" });
  });
});
