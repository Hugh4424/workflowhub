import { describe, expect, it } from "vitest";

import { deriveStageCompletion, STAGE_PREDICATES } from "../../runtime/stage/completion-predicates.mjs";
import { acceptanceModeFor, requiresHumanConfirmation } from "../../runtime/stage/stage-acceptance-policy.mjs";
import { validateHumanConfirmation } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

function factsFor(stage) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind], index) => ({
    fact: {
      ref: `quality/${subject}.json`,
      value: { task_id: "task", stage, material_revision: "revision", snapshot_tree: "tree", kind, subject, status: kind === "review" ? "recorded" : "passed", fact_id: `fact-${index}` },
    },
    freshness: { status: "current" },
    authenticated: true,
  }));
}

describe("confirmation and authorization boundary", () => {
  it("does not treat authorization as human confirmation", () => {
    const facts = factsFor("verify-code").filter(({ fact }) => fact.value.subject !== "human_confirmation");
    facts.push({
      fact: {
        ref: "authorization/decision.json",
        value: { task_id: "task", stage: "verify-code", material_revision: "revision", snapshot_tree: "tree", kind: "authorization", subject: "human_confirmation", status: "passed", fact_id: "authorization-fact" },
      },
      freshness: { status: "current" },
      authenticated: true,
    });

    expect(deriveStageCompletion("verify-code", facts)).toMatchObject({ status: "in_progress", missing: ["human_confirmation"] });
  });

  it("keeps confirmation requirements separate from automatic stage acceptance", () => {
    expect(acceptanceModeFor("verify-code")).toBe("human");
    expect(requiresHumanConfirmation("verify-code")).toBe(true);
    expect(acceptanceModeFor("build-code")).toBe("automatic");
    expect(requiresHumanConfirmation("build-code")).toBe(false);
  });

  it("does not add manual-close to the authorize operation set", async () => {
    const help = await stageRuntimeCliMain(["--help"]);
    expect(help.actions.authorize).toEqual(["commit", "push", "merge", "archive", "cleanup"]);
  });

  it("requires a non-empty subject_ref for formal confirmation facts", () => {
    const value = {
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "verify-code",
      decision: "accepted",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
      confirmed_at: "2026-08-16T00:00:00.000Z",
    };
    expect(() => validateHumanConfirmation(value, { taskId: "task", stage: "verify-code", requireAccepted: true, requireSubjectRef: true }))
      .toThrow(/binding is invalid/);
  });

  it("checks an expected confirmation subject when the caller supplies one", () => {
    const value = {
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "verify-code",
      decision: "accepted",
      subject_ref: "operations/close/plans/current.json",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
      confirmed_at: "2026-08-16T00:00:00.000Z",
    };
    expect(() => validateHumanConfirmation(value, { taskId: "task", stage: "verify-code", subject: "operations/close/plans/other.json", requireSubjectRef: true }))
      .toThrow(/binding is invalid/);
    expect(validateHumanConfirmation(value, { taskId: "task", stage: "verify-code", subject: "operations/close/plans/current.json", requireSubjectRef: true }))
      .toBe(value);
  });
});
