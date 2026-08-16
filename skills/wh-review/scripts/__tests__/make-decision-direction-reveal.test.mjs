import { expect, test } from "vitest";
import * as runner from "../review-runner.mjs";

test("direction review uses an independent reconstruction then a reveal challenge, with one logical fact", () => {
  expect(typeof runner.planDirectionReviewRequests).toBe("function");
  const sequence = runner.planDirectionReviewRequests({ raw_requirement: "需要可靠交付", objective_facts: ["当前审查重复"], current_selection: "方案 A" });
  expect(sequence.requests).toHaveLength(2);
  expect(sequence.requests[0].reveal_selection).toBe(false);
  expect(Object.hasOwn(sequence.requests[0].input, "current_selection")).toBe(false);
  expect(sequence.requests[1].reveal_selection).toBe(true);
  expect(sequence.requests[1].depends_on).toEqual([sequence.requests[0].request_id]);
  expect(sequence.logical_fact_count).toBe(1);
});
