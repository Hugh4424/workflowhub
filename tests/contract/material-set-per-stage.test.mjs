// CARD-03 P5/T012 (G1) regression: the post material set is stage-scoped.
// decision-log §十九: `run --action=reflect --stage=make-decision` failed with
// stage_row_error "post Phase index is missing" because make-decision was held
// to the build-plan material set. User ruling (§二十): make-decision needs only
// decision-log.md; build-plan and later still need spec.md + phases/index.md.
// The fix must never fabricate spec.md or phases/index.md.
import { describe, expect, it } from "vitest";

import { materialFilesForCohort } from "../../runtime/task/material-workspace.mjs";
import { handoffDeclaration } from "../../runtime/stage/stage-runner.mjs";

const DECISION_ONLY = Object.freeze({ "decision-log.md": "# Decision\n\n## 目标\n- keep the direction.\n" });
describe("post material set is scoped per stage (G1)", () => {
  it("make-decision requires only decision-log.md", () => {
    expect(materialFilesForCohort("post", DECISION_ONLY, { stage: "make-decision" })).toEqual(["decision-log.md"]);
  });

  it("build-plan and later stages still require spec.md and phases/index.md", () => {
    for (const stage of ["build-plan", "build-code", "verify-code"]) {
      expect(materialFilesForCohort("post", DECISION_ONLY, { stage }), stage)
        .toEqual(["decision-log.md", "spec.md", "phases/index.md"]);
    }
  });

  it("the make-decision stage-end handoff declaration no longer throws 'post Phase index is missing'", () => {
    let declaration;
    expect(() => {
      declaration = handoffDeclaration(DECISION_ONLY, "post", { stage: "make-decision" });
    }).not.toThrow();
    expect(declaration.value).toBeNull();
    expect(typeof declaration.reason).toBe("string");
    expect(declaration.reason).not.toMatch(/post Phase index is missing/);
  });

  it("build-code still fails loudly when the post Phase index is absent", () => {
    expect(() => handoffDeclaration(DECISION_ONLY, "post", { stage: "build-code" }))
      .toThrow(/post Phase index is missing/);
  });
});
