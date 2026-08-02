import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { selectReviewRound } from "../skills/wh-review/scripts/review-controller.mjs";

const route = { mode: "full_on_structural_rework", initial: ["external/reviewer"] };
const previous = {
  result_ref: "reviews/results/build-plan.json",
  verdict: "pass",
  snapshot_tree: "a".repeat(40),
  adjudication: { clusters: [] },
};
const ordinary = {
  version: "wh-review-response-ledger.v1",
  previous_result_ref: previous.result_ref,
  previous_snapshot_tree: previous.snapshot_tree,
  current_snapshot_tree: "b".repeat(40),
  change: {
    changed_dimensions: [],
    rationale: "wording only",
    evidence_refs: ["evidence/delta.json"],
  },
  responses: [],
};
const structural = {
  ...ordinary,
  change: { ...ordinary.change, changed_dimensions: ["schema"] },
};

describe("non-code review policy", () => {
  it.each(["build-spec", "build-plan", "verify-code"])("%s keeps review as current quality evidence, not a historical permit", (stage) => {
    const skill = readFileSync(new URL(`../workflows/${stage}/SKILL.md`, import.meta.url), "utf8");
    expect(skill).toMatch(/review[\s\S]{0,160}(?:quality|finding|verdict|unavailable)/i);
    expect(skill).toMatch(/(?:old|historical)[\s\S]{0,320}(?:audit|never|read-only)/i);
    expect(skill).toMatch(/(?:never|not)[\s\S]{0,120}(?:block|license|permission|proceed)/i);
  });

  it.each(["build-spec", "build-plan", "verify-code"])("%s ordinary edit dispatches no provider", (stage) => {
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previous,
      ledger: ordinary,
      currentSnapshotTree: ordinary.current_snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
  });

  it.each(["build-spec", "build-plan", "verify-code"])("%s records structural repair without another provider dispatch", (stage) => {
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previous,
      ledger: structural,
      currentSnapshotTree: structural.current_snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previous,
      ledger: structural,
      currentSnapshotTree: structural.current_snapshot_tree,
      structuralFullAlreadyRecorded: true,
    })).toEqual({ round: "none", reason: "post_full_non_gate_recorded" });
  });
});
