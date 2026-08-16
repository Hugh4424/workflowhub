import { describe, expect, it } from "vitest";
import { STAGE_ADVISORY_PREDICATES, STAGE_PREDICATES, assertStageCompleted, deriveStageCompletion, deriveStageProgress } from "../../runtime/stage/completion-predicates.mjs";

function observations(stage) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind], index) => ({
    fact: {
      ref: `quality/${subject}.json`,
      value: { task_id: "task", stage, material_revision: "revision", snapshot_tree: "tree", kind, subject, status: kind === "review" ? "recorded" : "passed", fact_id: `fact-${index}` },
    },
    freshness: { status: "current" },
    authenticated: true,
  }));
}

describe("five-stage completion predicates derive only from quality facts", () => {
  it("reserves full-suite freshness for final verification", () => {
    expect(STAGE_PREDICATES["make-decision"]).not.toHaveProperty("grill");
    expect(STAGE_PREDICATES["make-decision"]).not.toHaveProperty("research");
    expect(STAGE_PREDICATES["make-decision"]).not.toHaveProperty("decision_coverage");
    expect(STAGE_PREDICATES["build-spec"]).not.toHaveProperty("traceability");
    expect(STAGE_PREDICATES["make-decision"]).not.toHaveProperty("direction_review");
    expect(STAGE_PREDICATES["make-decision"]).not.toHaveProperty("detail_review");
    expect(STAGE_ADVISORY_PREDICATES["make-decision"].direction_review).toBe("review");
    expect(STAGE_ADVISORY_PREDICATES["make-decision"].detail_review).toBe("review");
    expect(STAGE_PREDICATES["make-decision"]).not.toHaveProperty("independent_review");
    expect(STAGE_PREDICATES["build-code"]).not.toHaveProperty("full_tests_fresh");
    expect(STAGE_PREDICATES["build-code"]).not.toHaveProperty("tasks_complete");
    expect(STAGE_PREDICATES["build-code"].risk_tests_fresh).toBe("test");
    expect(STAGE_PREDICATES["verify-code"].full_tests_fresh).toBe("test");
    expect(STAGE_PREDICATES["verify-code"]).not.toHaveProperty("same_build_integration_review");
    expect(STAGE_PREDICATES["verify-code"].independent_review).toBe("review");
    expect(STAGE_ADVISORY_PREDICATES["verify-code"]).not.toHaveProperty("independent_review");
  });

  for (const stage of Object.keys(STAGE_PREDICATES)) {
    it(`${stage} completes from the exact authenticated fresh fact set`, () => {
      expect(deriveStageCompletion(stage, observations(stage))).toMatchObject({ stage, status: "completed", missing: [] });
    });
    for (const subject of Object.keys(STAGE_PREDICATES[stage])) {
      it(`${stage} remains incomplete without ${subject}`, () => {
        const facts = observations(stage).filter((entry) => entry.fact.value.subject !== subject);
        expect(deriveStageCompletion(stage, facts)).toMatchObject({ status: "in_progress", missing: [subject] });
      });
    }
  }

  it.each([
    ["build-code", "integration_review"],
    ["build-code", "acceptance_criteria"],
    ["verify-code", "human_confirmation"],
  ])("%s cannot complete without required %s", (stage, subject) => {
    const facts = observations(stage).filter((entry) => entry.fact.value.subject !== subject);
    expect(() => assertStageCompleted(stage, facts)).toThrow(new RegExp(subject));
  });

  it("rejects a caller-provided passed dictionary and a single fact", () => {
    expect(() => deriveStageCompletion("build-code", { tasks_complete: "passed" })).toThrow(/array/);
    expect(deriveStageCompletion("build-code", observations("build-code").slice(0, 1)).status).toBe("in_progress");
  });

  it.each(["stale", "missing"])("does not consume %s facts", (status) => {
    const facts = observations("build-spec");
    facts[0] = { ...facts[0], freshness: { status } };
    expect(deriveStageCompletion("build-spec", facts).status).toBe("in_progress");
  });

  it("does not consume unauthenticated or wrong-kind facts", () => {
    const facts = observations("build-plan");
    facts[0] = { ...facts[0], authenticated: false };
    expect(deriveStageCompletion("build-plan", facts).status).toBe("in_progress");
    facts[0] = { ...observations("build-plan")[0], fact: { ...facts[0].fact, value: { ...facts[0].fact.value, kind: "test" } } };
    expect(deriveStageCompletion("build-plan", facts).status).toBe("in_progress");
  });

  it("keeps a real unavailable review visible without declaring stage completion", () => {
    const facts = observations("build-code");
    const review = facts.find(({ fact }) => fact.value.subject === "integration_review");
    review.fact.value.status = "unavailable";
    expect(deriveStageCompletion("build-code", facts)).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["integration_review"]),
    });
    expect(deriveStageProgress("build-code", facts, {
      "decision-log.md": "decision",
      "spec.md": "spec",
      "plan.md": "plan",
      "tasks.md": "tasks",
    })).toMatchObject({ work_status: "ready" });
  });

  it("does not treat a provider-style passed review fact as recorded review", () => {
    const facts = observations("build-code");
    const review = facts.find(({ fact }) => fact.value.subject === "integration_review");
    review.fact.value.status = "passed";
    expect(deriveStageCompletion("build-code", facts)).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["integration_review"]),
    });
  });

  it("keeps stage progress independent from quality status and freshness", () => {
    const facts = observations("build-code").map((entry) => ({
      ...entry,
      authenticated: false,
      recorded: true,
      freshness: { status: "stale" },
      fact: { ...entry.fact, value: { ...entry.fact.value, status: "failed" } },
    }));
    expect(deriveStageProgress("build-code", facts, {
      "decision-log.md": "decision",
      "spec.md": "spec",
      "plan.md": "plan",
      "tasks.md": "tasks",
    })).toMatchObject({
      work_status: "ready",
      work_authority: "current-four-materials-and-plan-tasks",
      missing_materials: [],
    });
  });

  it("does not require quality observations for material-led progress", () => {
    expect(deriveStageProgress("verify-code", [], {
      "decision-log.md": "decision",
      "spec.md": "spec",
      "plan.md": "plan",
      "tasks.md": "tasks",
    })).toMatchObject({ work_status: "ready", missing_materials: [] });
  });

  it("does not make early stages depend on files created later", () => {
    expect(deriveStageProgress("make-decision", [], {
      "decision-log.md": "decision",
    })).toMatchObject({
      work_status: "ready",
      required_materials: [],
      missing_materials: [],
    });
    expect(deriveStageProgress("build-spec", [], {
      "decision-log.md": "decision",
      "spec.md": "spec",
    })).toMatchObject({
      work_status: "ready",
      required_materials: ["decision-log.md"],
      missing_materials: [],
    });
  });
});
