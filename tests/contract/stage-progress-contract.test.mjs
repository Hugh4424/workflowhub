import { describe, expect, it } from "vitest";
import {
  deriveStageCompletion,
  deriveStageProgress,
} from "../../runtime/stage/completion-predicates.mjs";

describe("WorkflowHub stage progress contract", () => {
  it.each([
    ["make-decision", {}, []],
    ["build-spec", { "decision-log.md": "decision" }, ["decision-log.md"]],
    ["build-plan", { "decision-log.md": "decision", "spec.md": "spec" }, ["decision-log.md", "spec.md"]],
    ["build-code", {
      "decision-log.md": "decision", "spec.md": "spec", "plan.md": "plan", "tasks.md": "tasks",
    }, ["decision-log.md", "spec.md", "plan.md", "tasks.md"]],
    ["verify-code", {
      "decision-log.md": "decision", "spec.md": "spec", "plan.md": "plan", "tasks.md": "tasks",
    }, ["decision-log.md", "spec.md", "plan.md", "tasks.md"]],
  ])("lets %s start from materials that exist before the stage runs", (stage, materials, requiredMaterials) => {
    const result = deriveStageProgress(stage, [], materials);
    expect(result).toMatchObject({
      work_status: "ready",
      readiness_source: "current-material-presence",
      required_materials: requiredMaterials,
      missing_materials: [],
    });
    expect(result).not.toHaveProperty("status");
  });

  it("derives only work readiness from material presence", () => {
    const plan = [
      "## WorkflowHub Stage Progress",
      "| Stage | Status | Work / artifacts | Review / handoff | Next / deferred risk |",
      "| --- | --- | --- | --- | --- |",
      "| make-decision | completed | D1 | quality_status=incomplete; user_handoff=pending | build-spec |",
      "",
    ].join("\n");
    const result = deriveStageProgress("make-decision", [], { "decision-log.md": "log", "spec.md": null, "plan.md": plan, "tasks.md": null });
    expect(result).toMatchObject({
      work_status: "ready",
      readiness_source: "current-material-presence",
      missing_materials: [],
    });
    expect(result).not.toHaveProperty("status");
  });

  it("lets a post-cohort build-plan start from decision-log before it authors spec", () => {
    const result = deriveStageProgress(
      "build-plan",
      [],
      { "decision-log.md": "decision", "spec.md": null, "plan.md": null, "tasks.md": null },
      { activationCohort: "post" },
    );
    expect(result).toMatchObject({
      work_status: "ready",
      continuation_allowed: true,
      required_materials: ["decision-log.md"],
      missing_materials: [],
    });
  });

  it("keeps spec as a pre-cohort build-plan prerequisite", () => {
    const result = deriveStageProgress(
      "build-plan",
      [],
      { "decision-log.md": "decision", "spec.md": null, "plan.md": null, "tasks.md": null },
      { activationCohort: "pre" },
    );
    expect(result).toMatchObject({
      work_status: "blocked_by_missing_material",
      continuation_allowed: false,
      required_materials: ["decision-log.md", "spec.md"],
      missing_materials: ["spec.md"],
    });
  });

  it("rejects completed plus incomplete fake green while keeping work ready", () => {
    const readiness = deriveStageProgress("build-code", [], {
      "decision-log.md": "decision",
      "spec.md": "spec",
      "plan.md": "plan",
      "tasks.md": [
        "## WorkflowHub Stage Progress",
        "| Stage | Status | Execution / evidence | Handoff / next |",
        "| --- | --- | --- | --- |",
        "| build-code | completed | quality_status=incomplete | verify-code |",
        "| verify-code | incomplete | quality_status=incomplete | close |",
      ].join("\n"),
    });

    expect(readiness).toMatchObject({
      work_status: "ready",
      readiness_source: "current-material-presence",
      missing_materials: [],
    });
    expect(readiness).not.toHaveProperty("status");
    expect(deriveStageCompletion("build-code", [])).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["integration_review"]),
    });
  });
});
