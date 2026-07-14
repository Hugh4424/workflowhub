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
