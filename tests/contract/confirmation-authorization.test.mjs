import { describe, expect, it } from "vitest";

import { deriveStageCompletion, STAGE_PREDICATES } from "../../runtime/stage/completion-predicates.mjs";
import { acceptanceModeFor, requiresHumanConfirmation } from "../../runtime/stage/stage-acceptance-policy.mjs";
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
});
