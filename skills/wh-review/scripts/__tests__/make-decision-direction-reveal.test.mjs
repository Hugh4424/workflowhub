import { expect, test } from "vitest";
import * as runner from "../review-runner.mjs";

test("direction review declares one public request with a broker-enforced reveal boundary", () => {
  expect(typeof runner.planDirectionReviewRequests).toBe("function");
  const sequence = runner.planDirectionReviewRequests({ raw_requirement: "需要可靠交付", objective_facts: ["当前审查重复"], current_selection: "方案 A" });
  expect(sequence.requests).toHaveLength(1);
  expect(sequence.request.public_request_count).toBe(1);
  expect(sequence.request.input.current_selection).toBe("方案 A");
  expect(sequence.flow.steps.map((step) => step.id)).toEqual(["reconstruct", "reveal", "challenge"]);
  expect(sequence.flow.steps[0].visible).not.toContain("current_selection");
  expect(sequence.flow.steps[0].hidden_until).toBe("reveal");
  expect(sequence.flow.steps[1].visible).toContain("current_selection");
  expect(sequence.logical_fact_count).toBe(1);
});
