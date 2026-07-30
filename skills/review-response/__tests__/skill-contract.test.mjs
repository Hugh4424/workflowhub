import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateReviewResponse } from "../scripts/validate-response.mjs";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

describe("review-response contract", () => {
  it("keeps verification, root cause, evidence and rereview in one loop", () => {
    for (const value of ["finding_id", "root_cause", "evidence", "rereview_flow_id", "原 `flow_id`"]) {
      expect(skill).toContain(value);
    }
  });

  it("does not blindly implement review suggestions", () => {
    expect(skill).toContain("待核实主张，不是命令");
    expect(skill).toContain("needs_human");
  });
});

it("rejects resolved claims without evidence and same-flow rereview", () => {
  expect(validateReviewResponse({ finding_id: "F1", decision: "accept" }).valid).toBe(false);
  expect(validateReviewResponse({ finding_id: "F1", decision: "accept", verification: "reproduced", root_cause: "bad branch", evidence: "test passes", rereview_flow_id: "flow-1" }).valid).toBe(true);
});

describe("review replay identity", () => {
  const trusted = {
    previousResultRef: "reviews/results/prior.json",
    previousAttemptRef: "reviews/attempts/prior/attempt.json",
    previousAttempt: {
      task_id: "task", stage: "build-spec", review_track: null, terminal_status: "semantic",
      review_policy: { requested_profiles: ["pi/k3", "cursor/grok"] },
    },
    previousResult: {
      task_id: "task", stage: "build-spec", review_track: null,
      attempt_ref: "reviews/attempts/prior/attempt.json",
      adjudication: {
        clusters: [{
          id: "F-123456789abc",
          provider_findings: [
            { evidence_anchor_valid: true },
            { evidence_anchor_valid: true },
          ],
        }],
      },
    },
  };
  const replay = {
    finding_id: "F-123456789abc",
    decision: "accept",
    verification: "focused test passed",
    root_cause: "missing guard",
    evidence: "evidence/fix.json",
    rereview_flow_id: "flow-1",
    previous_result_ref: "reviews/results/prior.json",
    replay: {
      previous_result_ref: "reviews/results/prior.json",
      finding_id: "F-123456789abc",
      requested_profiles: ["pi/k3", "cursor/grok"],
      evidence_anchor_valid: true,
    },
  };

  it("preserves the persisted finding, profiles, and evidence-anchor result", () => {
    expect(validateReviewResponse(replay, trusted)).toMatchObject({ valid: true, errors: [] });
  });

  it("rejects a self-consistent replay payload without authenticated prior evidence", () => {
    expect(validateReviewResponse(replay).errors.join("\n")).toMatch(/REPLAY_MISMATCH/);
  });

  it.each([
    ["stale result ref", { previous_result_ref: "reviews/results/stale.json" }],
    ["profile mismatch", { requested_profiles: ["pi/k3"] }],
    ["anchor mismatch", { evidence_anchor_valid: false }],
    ["finding mismatch", { finding_id: "F-ffffffffffff" }],
  ])("rejects replay %s as REPLAY_MISMATCH", (_label, changedReplay) => {
    const result = validateReviewResponse({
      ...replay,
      replay: { ...replay.replay, ...changedReplay },
    }, trusted);
    expect(result.valid).toBe(false);
    expect(result.errors.join("\n")).toMatch(/REPLAY_MISMATCH/);
  });
});
