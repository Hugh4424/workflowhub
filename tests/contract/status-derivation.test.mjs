import { describe, expect, it } from "vitest";

import { STAGE_PREDICATES, deriveStageCompletion } from "../../runtime/stage/completion-predicates.mjs";

function facts(stage, overrides = {}) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind], index) => ({
    fact: {
      ref: `quality/${subject}.json`,
      value: {
        task_id: "task",
        stage,
        material_revision: "revision",
        snapshot_tree: "tree",
        kind,
        subject,
        status: overrides[subject]?.status ?? (kind === "review" ? "recorded" : "passed"),
        fact_id: `fact-${index}`,
      },
    },
    freshness: { status: overrides[subject]?.freshness ?? "current" },
    authenticated: overrides[subject]?.authenticated ?? true,
  }));
}

describe("status is derived from current quality facts", () => {
  it("does not consume an accepted/current pointer or caller status", () => {
    const result = deriveStageCompletion("build-spec", facts("build-spec"));
    expect(result).toMatchObject({ stage: "build-spec", status: "completed", missing: [] });
    expect(result).not.toHaveProperty("accepted_ref");
    expect(result).not.toHaveProperty("current_pointer");
  });

  it("reports missing and stale facts instead of inventing completion", () => {
    const missing = facts("build-plan").filter(({ fact }) => fact.value.subject !== "human_confirmation");
    expect(deriveStageCompletion("build-plan", missing).status).toBe("in_progress");

    const stale = facts("build-plan", { fr_coverage: { freshness: "stale" } });
    expect(deriveStageCompletion("build-plan", stale).status).toBe("in_progress");
  });
});
