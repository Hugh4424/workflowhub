// CARD-03 P5/T012 (G1) regression: the post material set is stage-scoped.
// Historical decision-log §十九: `run --action=reflect --stage=make-decision` failed with
// stage_row_error "post Phase index is missing" because make-decision was held
// to the build-plan material set. User ruling (§二十): make-decision needs only
// decision-log.md; build-plan and later still need spec.md + phases/index.md.
// N8 D-014 extends the allowed set; status required materials remain unchanged.
// The fix must never fabricate spec.md or phases/index.md.
import { describe, expect, it } from "vitest";

import { materialFilesForCohort } from "../../runtime/task/material-workspace.mjs";

const DECISION_ONLY = Object.freeze({ "decision-log.md": "# Decision\n\n## 目标\n- keep the direction.\n" });
describe("post material set is scoped per stage (G1)", () => {
  it("make-decision allows decision-log.md, spec.md and phases/index.md", () => {
    expect(materialFilesForCohort("post", DECISION_ONLY, { stage: "make-decision" })).toEqual(["decision-log.md", "spec.md", "phases/index.md"]);
  });

  it("build-plan and later stages still require spec.md and phases/index.md", () => {
    for (const stage of ["build-plan", "build-code", "verify-code"]) {
      expect(materialFilesForCohort("post", DECISION_ONLY, { stage }), stage)
        .toEqual(["decision-log.md", "spec.md", "phases/index.md"]);
    }
  });

});
