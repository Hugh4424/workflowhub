import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

import { buildClassificationManifest, selectReviewRound } from "../skills/wh-review/scripts/review-controller.mjs";

const route = { mode: "full_on_structural_rework", initial: ["external/reviewer"] };
const previous = {
  result_ref: "quality/reviews/results/build-plan.json",
  verdict: "pass",
  snapshot_tree: "a".repeat(40),
  adjudication: { clusters: [] },
  classification_manifest: buildClassificationManifest({ draft_spec: "baseline" }),
};

describe("non-code review policy", () => {
  it("keeps planning advisories stage-owned and wh-review as the provider review", () => {
    const buildSpec = yaml.load(readFileSync(new URL("../workflows/build-spec/skill-deps.yaml", import.meta.url), "utf8"));
    const buildPlan = yaml.load(readFileSync(new URL("../workflows/build-plan/skill-deps.yaml", import.meta.url), "utf8"));
    const buildCode = yaml.load(readFileSync(new URL("../workflows/build-code/skill-deps.yaml", import.meta.url), "utf8"));
    const verifyCode = yaml.load(readFileSync(new URL("../workflows/verify-code/skill-deps.yaml", import.meta.url), "utf8"));
    expect(buildSpec.skills.map((entry) => entry.name)).toEqual([
      "spec-specify", "spec-clarify", "simplicity-guard", "plan-ceo-review",
      "plan-design-review", "wh-review",
    ]);
    expect(buildPlan.skills.map((entry) => entry.name)).toEqual([
      "spec-research", "spec-plan", "simplicity-guard", "plan-eng-review",
      "test-routing-advisor", "spec-tasks", "spec-analyze", "wh-review",
    ]);
    expect(buildCode.skills.map((entry) => entry.name)).toEqual([
      "test-routing-advisor", "backend-testing", "frontend-testing",
      "fullstack-slice-testing", "wh-review",
    ]);
    expect(verifyCode.skills.map((entry) => entry.name)).toEqual(["wh-review"]);
    for (const manifest of [buildSpec, buildPlan, buildCode, verifyCode]) {
      expect(manifest.skills.map((entry) => entry.name)).toContain("wh-review");
      expect(manifest.skills.every((entry) => entry.owner === "stage" && entry.dispatch === "stage")).toBe(true);
    }
  });

  it.each(["make-decision", "build-spec", "build-plan", "verify-code"])("%s keeps review as current quality evidence, not a historical permit", (stage) => {
    const skill = readFileSync(new URL(`../workflows/${stage}/SKILL.md`, import.meta.url), "utf8");
    expect(skill).toMatch(/review[\s\S]{0,160}(?:quality|finding|verdict|unavailable)/i);
    expect(skill).toMatch(/(?:old|historical)[\s\S]{0,320}(?:audit|never|read-only)/i);
    expect(skill).toMatch(/(?:never|not)[\s\S]{0,120}(?:block|license|permission|proceed)/i);
  });

  it.each(["build-spec", "build-plan", "verify-code"])("%s does not review the same snapshot twice", (stage) => {
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previous,
      currentSnapshotTree: previous.snapshot_tree,
    })).toEqual({ round: "none", reason: "current_quality_fact_recorded" });
  });

  it("uses one incremental review for changed first-three-stage material after a pass", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan"]) {
      expect(selectReviewRound({
        stage,
        route,
        previousResult: previous,
        currentSnapshotTree: "b".repeat(40),
        incrementalAvailable: true,
      })).toEqual({ round: "incremental", reason: "changed_material_incremental" });
    }
  });

  it("keeps code review's changed-snapshot policy unchanged", () => {
    expect(selectReviewRound({
      stage: "verify-code",
      route,
      previousResult: previous,
      currentSnapshotTree: "b".repeat(40),
      incrementalAvailable: true,
    })).toEqual({ round: "initial", reason: "changed_snapshot" });
  });

  it("falls back to one full review when the delta is unavailable", () => {
    expect(selectReviewRound({
      stage: "build-spec",
      route,
      previousResult: previous,
      currentSnapshotTree: "b".repeat(40),
    })).toEqual({ round: "initial", reason: "changed_snapshot" });
  });
});
