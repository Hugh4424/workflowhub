import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { reviewCycleDecision } from "../../skills/wh-review/scripts/review-runner.mjs";

const manifestUrl = new URL("../../workflows/build-spec/steps.json", import.meta.url);
const skillUrl = new URL("../../workflows/build-spec/SKILL.md", import.meta.url);
const stageReviewSteps = {
  "make-decision": {
    reviews: ["direction-advice", "detail-advice"],
    successors: ["talk-round-3", "approve-decision"],
    skillRule: /review step[\s\S]{0,120}manifest 前移[\s\S]{0,160}不自动回跳/i,
  },
  "build-spec": {
    reviews: ["review-frozen-spec"],
    successors: ["main-agent-disposes-findings"],
    skillRule: /editing `spec\.md` here does not[\s\S]{0,100}dispatch that completed review step again/i,
  },
  "build-plan": {
    reviews: ["merged-review"],
    successors: ["main-agent-disposes-findings"],
    skillRule: /advances to finding disposition and final analysis[\s\S]{0,120}do not dispatch that completed review step again/i,
  },
  "build-code": {
    reviews: ["review-change", "final-integration-review"],
    successors: ["analyze-review-findings", "stage-end-spec-analyze"],
    skillRule: /integration review step is then complete[\s\S]{0,200}rather than dispatching integration[\s\S]{0,20}review again/i,
  },
  "verify-code": {
    reviews: ["architect-code-review", "run-one-independent-code-review"],
    successors: ["main-agent-repair-batch-1", "main-agent-repair-batch-2"],
    skillRule: /review step[\s\S]{0,120}manifest 前移[\s\S]{0,160}不自动回跳/i,
  },
};

function loadManifest(stage = "build-spec") {
  return JSON.parse(readFileSync(new URL(`../../workflows/${stage}/steps.json`, import.meta.url), "utf8"));
}

describe("review manifest and active-prose forward-progress contract", () => {
  it("keeps the active helper on advance after serious advice even when repair flags are present", () => {
    const finding = { id: "F-1", severity: "major", disposition: "actionable", path: "a.js", line: 1, issue: "repair" };
    const result = { status: "available", terminal_status: "semantic", findings: [finding], adjudication: { clusters: [finding] } };

    expect(reviewCycleDecision({ stage: "build-code", result })).toMatchObject({
      status: "advice_recorded",
      action: "advance",
      important_findings: [finding],
    });
    expect(reviewCycleDecision({ stage: "build-code", result, actualRepair: true, subjectChanged: true })).toMatchObject({
      status: "advice_recorded",
      action: "advance",
    });
  });

  it("keeps review, disposition, analyze, and publish as a one-way manifest chain", () => {
    const steps = loadManifest().steps;
    const bySlug = new Map(steps.map((step) => [step.step_slug, step]));
    const expected = [
      "review-frozen-spec",
      "main-agent-disposes-findings",
      "stage-end-spec-analyze",
      "publish-spec-result",
    ];

    expect(expected.map((slug) => bySlug.get(slug).order)).toEqual([11, 12, 13, 14]);
    expect(bySlug.get("main-agent-disposes-findings").depends_on).toEqual([
      bySlug.get("review-frozen-spec").step_id,
    ]);
    expect(bySlug.get("stage-end-spec-analyze").depends_on).toEqual([
      bySlug.get("main-agent-disposes-findings").step_id,
    ]);
    expect(bySlug.get("publish-spec-result").depends_on).toEqual([
      bySlug.get("stage-end-spec-analyze").step_id,
    ]);

    const betweenReviewAndPublish = steps.filter(
      ({ order }) => order > bySlug.get("review-frozen-spec").order && order < bySlug.get("publish-spec-result").order,
    );
    expect(betweenReviewAndPublish.some(({ step_slug }) => /review/.test(step_slug))).toBe(false);
  });

  it("states that disposition edits continue to analyze without dispatching review again", () => {
    const skill = readFileSync(skillUrl, "utf8");
    expect(skill).toMatch(/review-frozen-spec[\s\S]*main-agent-disposes-findings[\s\S]*stage-end-spec-analyze/);
    expect(skill).toMatch(/editing `spec\.md` here does not[\s\S]{0,100}dispatch that completed review step again/i);
  });

  it("keeps one current stage or phase review per declared scope and advances without task-level replay", () => {
    for (const [stage, contract] of Object.entries(stageReviewSteps)) {
      const manifest = loadManifest(stage);
      const bySlug = new Map(manifest.steps.map((step) => [step.step_slug, step]));
      expect(contract.reviews, stage).toHaveLength(contract.successors.length);
      contract.reviews.forEach((reviewSlug, index) => {
        const review = bySlug.get(reviewSlug);
        const successor = bySlug.get(contract.successors[index]);
        expect(review, `${stage}:${reviewSlug}`).toBeDefined();
        expect(successor, `${stage}:${contract.successors[index]}`).toBeDefined();
        expect(successor.order, `${stage}:${reviewSlug} must advance`).toBeGreaterThan(review.order);
        expect(successor.depends_on, `${stage}:${contract.successors[index]} dependency`).toContain(review.step_id);
        expect(review.depends_on, `${stage}:${reviewSlug} must not depend on its successor`).not.toContain(successor.step_id);
      });

      const skill = readFileSync(new URL(`../../workflows/${stage}/SKILL.md`, import.meta.url), "utf8");
      expect(skill, `${stage} ordinary-step rule`).toMatch(contract.skillRule);
      expect(skill, `${stage} active loop wording`).not.toMatch(/focused review|required focused|focused_review_required|追求 clean|直到.*findings/i);
      if (stage === "build-code") {
        expect(skill).toMatch(/review of the completed Phase[\s\S]*continue[\s\S]{0,80}next `pending` or `in_progress` Task; do not replay earlier Phases/i);
        expect(skill).toMatch(/Every completed Phase[\s\S]{0,220}review/i);
      }
    }
  });
});
