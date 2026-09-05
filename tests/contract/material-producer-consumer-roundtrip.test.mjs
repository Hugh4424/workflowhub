import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  validatePlanTaskContract,
  validateSpecContentProfile,
} from "../../runtime/stage/stage-content-contracts.mjs";
import { buildPlanningArtifacts } from "../../skills/wh-review/scripts/review-materials.mjs";

const materialRoot = join(process.cwd(), "specs", "archive", "governance-runtime-execution-chain-20260827");
const readMaterial = (name) => readFileSync(join(materialRoot, name), "utf8");

describe("material producer and consumer round-trip", () => {
  it("consumes the current spec, plan, and tasks without hand-editing", () => {
    const spec = readMaterial("spec.md");
    const plan = readMaterial("plan.md");
    const tasks = readMaterial("tasks.md");
    expect(validateSpecContentProfile(spec)).toMatchObject({ ok: true, errors: [] });
    expect(validatePlanTaskContract({ spec, plan, tasks })).toMatchObject({ ok: true, errors: [] });
    const packet = buildPlanningArtifacts({
      rawRequirementIndex: {
        schema_version: "raw-requirement-index.v1",
        source_artifact: "decision-log",
        entries: [{ id: "R-001", decision_ids: ["D-006"], summary: "最小治理执行链" }],
      },
      approvedSpec: spec,
      acceptanceCriteria: "AC-GOV-001",
      draftPlan: plan,
      draftTasks: tasks,
    });
    expect(packet).toMatchObject({ approved_spec: spec, draft_plan: plan, draft_tasks: tasks });
  });
});
