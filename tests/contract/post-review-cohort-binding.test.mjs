import { describe, expect, it } from "vitest";

import { bindBuildPlanReviewCohort } from "../../runtime/review/review-record-route.mjs";

describe("authenticated build-plan review cohort", () => {
  it("injects the task cohort when the caller omits it", () => {
    expect(bindBuildPlanReviewCohort({ stage: "build-plan", materials: {} }, { activation_cohort: "post" }))
      .toMatchObject({ activation_cohort: "post" });
  });

  it("rejects a pre packet in a post task, including the camel-case alias", () => {
    for (const key of ["activation_cohort", "activationCohort"]) {
      expect(() => bindBuildPlanReviewCohort({ stage: "build-plan", [key]: "pre" }, { activation_cohort: "post" }))
        .toThrow(/authenticated task cohort/);
    }
  });

  it("keeps pre/history and other review stages unchanged", () => {
    expect(bindBuildPlanReviewCohort({ stage: "build-plan" }, { activation_cohort: "pre" }))
      .toMatchObject({ activation_cohort: "pre" });
    const other = { stage: "verify-code" };
    expect(bindBuildPlanReviewCohort(other, { activation_cohort: "post" })).toBe(other);
  });
});
