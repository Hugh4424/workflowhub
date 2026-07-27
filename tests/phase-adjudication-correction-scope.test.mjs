import { describe, expect, it } from "vitest";

import {
  predecessorAdjudicationCorrection,
  requiresSameAdjudicationCorrection,
} from "../workflows/build-code/phase-evidence.mjs";

describe("build-code adjudication correction scope", () => {
  const correction = "results/build-code/revisions/adjudication-correction-phase-5.json";

  it("requires the correction only while republishing the same phase", () => {
    const current = { phase_id: "phase-5", adjudication_correction_ref: correction };
    expect(requiresSameAdjudicationCorrection(current, { phase_id: "phase-5" })).toBe(true);
    expect(requiresSameAdjudicationCorrection(current, {
      phase_id: "phase-5",
      adjudication_correction_ref: correction,
    })).toBe(false);
  });

  it("does not carry a correction into the next phase", () => {
    const current = { phase_id: "phase-5", adjudication_correction_ref: correction };
    expect(requiresSameAdjudicationCorrection(current, { phase_id: "phase-6" })).toBe(false);
    expect(predecessorAdjudicationCorrection(current, "phase-6")).toBe(correction);
    expect(predecessorAdjudicationCorrection(current, "phase-5")).toBeUndefined();
  });
});
