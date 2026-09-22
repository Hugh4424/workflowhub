import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { defaultSpecAnalyzeExecutor } from "../../tools/cli/stage-runtime.mjs";

const materialRoot = new URL("../../specs/workflowhub-thin-core-card-07-20260919/", import.meta.url);
const read = (name) => readFileSync(new URL(name, materialRoot), "utf8");

describe("post build-plan CLI spec-analyze executor", () => {
  it("executes the bundled lens against the complete current post material set", async () => {
    const result = await defaultSpecAnalyzeExecutor({
      task_id: "spec-analyze-cli-executor-fixture",
      snapshot_tree: "a".repeat(40),
      material_revision: `revision-${"b".repeat(64)}`,
      materials: {
        decision_log: read("decision-log.md"),
        spec: read("spec.md"),
        phase_index: read("phases/index.md"),
        phases: Object.fromEntries(["P1", "P2", "P3", "P4"].map((phase) => [`phases/${phase}.md`, read(`phases/${phase}.md`)])),
      },
    });

    expect(result).toMatchObject({
      schema_version: "workflowhub-spec-analyze-lens-result.v1",
      task_id: "spec-analyze-cli-executor-fixture",
      stage: "build-plan",
      step_slug: "final-spec-analyze",
      skill_id: "spec-analyze",
      snapshot_tree: "a".repeat(40),
      material_revision: `revision-${"b".repeat(64)}`,
      result: { status: "inconsistent" },
    });
    expect(result.source_ids.length).toBeGreaterThan(0);
    expect(result.result.facts.executor).toBe("workflowhub-current-session");
    expect(result.result.errors).not.toContain("portable spec-analyze lens execution unavailable");
  });

  it("executes the build-code lens with the post Phase packet and stage-end step", async () => {
    const materials = {
      original_requirement: read("decision-log.md"),
      decision_log: read("decision-log.md"),
      spec: read("spec.md"),
      phase_index: read("phases/index.md"),
      phases: Object.fromEntries(["P1", "P2", "P3", "P4"].map((phase) => [`phases/${phase}.md`, read(`phases/${phase}.md`)])),
      implementation: "current implementation receipt is intentionally incomplete in this contract fixture",
    };
    const snapshotTree = "c".repeat(40);
    const materialRevision = `revision-${"d".repeat(64)}`;
    const hash = (value) => createHash("sha256").update(value).digest("hex");
    const evidence = Object.entries({
      "decision-log": materials.decision_log,
      spec: materials.spec,
      "phase-index": materials.phase_index,
      ...materials.phases,
      implementation: materials.implementation,
      tests: "tests",
      "ac-trace": "ac-trace",
    }).map(([ref, value]) => ({ ref, kind: ref, status: "fresh", hash: hash(value), snapshot_tree: snapshotTree }));
    const packet = {
      activation_cohort: "post",
      materials,
      original_requirements: [],
      coverage: [],
      acceptance_coverage: [],
      evidence,
    };
    const result = await defaultSpecAnalyzeExecutor({
      task_id: "spec-analyze-cli-executor-build-code-fixture",
      stage: "build-code",
      snapshot_tree: snapshotTree,
      material_revision: materialRevision,
      materials,
      packet,
    });

    expect(result).toMatchObject({
      schema_version: "workflowhub-spec-analyze-lens-result.v1",
      task_id: "spec-analyze-cli-executor-build-code-fixture",
      stage: "build-code",
      step_slug: "stage-end-spec-analyze",
      skill_id: "spec-analyze",
      result: { status: "material_incomplete" },
    });
    expect(result.result.facts.executor).toBe("workflowhub-current-session");
  });
});
