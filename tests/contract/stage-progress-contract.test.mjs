import { describe, expect, it } from "vitest";
import {
  deriveStageCompletion,
  deriveStageProgress,
} from "../../runtime/stage/completion-predicates.mjs";
import {
  derivePhaseProgressStatus,
  phaseProgressTargetExists,
  projectStageExecutionOutcome,
} from "../../tools/cli/stage-runtime.mjs";

const POST_PHASE_MATERIALS = {
  "phases/index.md": [
    "# Phase index",
    "",
    "## Execution Index",
    "",
    "| phase | authority ref | semantic anchor | write set | dependency | consumer |",
    "| --- | --- | --- | --- | --- | --- |",
    "| `P1` | `phases/P1.md` | `phase-p1` | `src/a.mjs` | `none` | `build-code` |",
  ].join("\n"),
  "phases/P1.md": [
    "# Phase P1 — First phase",
    "",
    "## L1 — Tasks",
    "",
    "### T001 — First task",
    "",
    "### T002 — Second task",
    "",
    "## L2 — Notes",
  ].join("\n"),
};

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

  it("reads a current resume cursor without turning it into completion or work status", () => {
    const cursor = {
      phase_id: "P1",
      task_id: "T002",
      material_revision: `revision-${"a".repeat(64)}`,
      recorded_at: "2026-09-25T01:02:03.000Z",
    };

    const result = derivePhaseProgressStatus({
      cursor,
      currentMaterialRevision: cursor.material_revision,
      materials: POST_PHASE_MATERIALS,
      activationCohort: "post",
    });

    expect(result).toEqual({ freshness: "current", cursor });
    expect(deriveStageProgress("build-code", [], {
      "decision-log.md": "decision",
      "spec.md": "spec",
      ...POST_PHASE_MATERIALS,
    }, { activationCohort: "post" })).toMatchObject({ work_status: "ready" });
    expect(deriveStageCompletion("build-code", [])).toMatchObject({ status: "in_progress" });
  });

  it("labels a cursor stale only when its material revision changed", () => {
    const cursor = {
      phase_id: "P1",
      task_id: "T002",
      material_revision: `revision-${"a".repeat(64)}`,
      recorded_at: "2026-09-25T01:02:03.000Z",
    };

    expect(derivePhaseProgressStatus({
      cursor,
      currentMaterialRevision: `revision-${"b".repeat(64)}`,
      materials: POST_PHASE_MATERIALS,
      activationCohort: "post",
    })).toMatchObject({ freshness: "stale", reason: "material_revision_mismatch", cursor });
  });

  it("validates cursor targets against the indexed physical Phase and its Task cards", () => {
    const materials = { ...POST_PHASE_MATERIALS, "spec.md": "Current spec" };
    expect(phaseProgressTargetExists({ phase_id: "P1", task_id: "T002" }, materials)).toBe(true);
    expect(phaseProgressTargetExists({ phase_id: "P1", task_id: "T999" }, materials)).toBe(false);
    expect(phaseProgressTargetExists({ phase_id: "P2", task_id: "T002" }, materials)).toBe(false);
  });

  it("does not project a cursor-only row as a stage-end execution outcome", () => {
    const derived = {
      "build-code": {
        status: "unavailable",
        blocking: false,
        attempt_count: 1,
        completed_attempt_count: 0,
        refs: ["facts.jsonl"],
      },
    };

    expect(projectStageExecutionOutcome("build-code", derived, [{
      record_kind: "stage",
      stage: "build-code",
      source: "phase-progress-cursor",
    }])).toMatchObject({
      status: "unavailable",
      attempt_count: 0,
      completed_attempt_count: 0,
      refs: [],
      diagnostic: { code: "phase_progress_cursor_only" },
    });

    expect(projectStageExecutionOutcome("build-code", derived, [{
      record_kind: "stage",
      stage: "build-code",
      source: "stage-end:build-code",
    }])).toBe(derived["build-code"]);

    expect(projectStageExecutionOutcome("build-code", derived, [
      { record_kind: "stage", stage: "build-code", source: "phase-progress-cursor" },
      { record_kind: "stage", stage: "build-code", source: "stage-end:build-code" },
    ])).toBe(derived["build-code"]);
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
