import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadPortableWorkflowManifest, runPortableWorkflow } from "../../runtime/task/portable-workflow-run.mjs";
import { resolveTopology } from "../../runtime/task/task-topology.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";

const ROOT = process.cwd();
const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function bindPortableStepEvidence(task, stepResults) {
  const value = {
    task_id: task.identity.taskId,
    workflow: "build-prd",
    step_results: stepResults.map(({ step_id, step_slug, status }) => ({ step_id, step_slug, status })),
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const sha256 = createHash("sha256").update(raw).digest("hex");
  const ref = `quality/evidence/portable-workflow-outcomes/build-prd/${sha256}.json`;
  task.createRecordAtomic(ref, raw);
  return stepResults.map((result) => ({ ...result, result_ref: ref }));
}

describe("CARD-01 planning and ordinary task journeys", () => {
  it("projects planning, post-activation ordinary, and pre-activation ordinary journeys exactly", () => {
    expect(resolveTopology({ task_type: "规划任务", activation_cohort: "pre" }))
      .toEqual(["make-decision", "build-prd"]);
    expect(resolveTopology({ task_type: "普通任务", activation_cohort: "post" }))
      .toEqual(["make-decision", "build-plan", "build-code", "verify-code"]);
    expect(resolveTopology({ task_type: "普通任务", activation_cohort: "pre" }))
      .toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
  });

  it("keeps build-prd failure and re-entry inside the portable journey, never a code stage", () => {
    const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-card01-journey-")));
    roots.push(storageRoot);
    const task = createTask({
      storageRoot,
      manifest: {
        schema_version: "1.0.0", execution_mode: "per_invocation", record_model: "vnext-single-write",
        project_name: "workflowhub", task_id: "card-01-journey-fixture", created_at: "2026-09-20T00:00:00.000Z",
        target_repo_root: ROOT, issue_ids: [], inputs: {},
      },
    });
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    const failed = runPortableWorkflow({ task, worktreeRoot: ROOT, input: { workflow: "build-prd", step_results: [] } });
    const completeSteps = manifest.steps.map((step) => ({
      task_id: task.identity.taskId, workflow: "build-prd", step_id: step.step_id, step_slug: step.step_slug,
      status: "completed", result_ref: null,
    }));
    const completed = runPortableWorkflow({ task, worktreeRoot: ROOT, input: {
      task_id: task.identity.taskId,
      workflow: "build-prd",
      step_results: bindPortableStepEvidence(task, completeSteps),
    } });
    expect(failed.terminal).toMatchObject({ state: "failed" });
    expect(completed.terminal).toMatchObject({ state: "succeeded" });
    expect(completed.ref).not.toMatch(/build-code|verify-code/);
  });

  it("publishes all six interface lines plus the human-boundary and review-replay addendum", () => {
    const blueprint = readFileSync("docs/contracts/card-01-stage-material-interface.md", "utf8");
    for (const heading of [
      "任务类型受控值",
      "类型到拓扑映射",
      "正式阶段与 build-prd portable 身份",
      "七值状态",
      "材料与执行事实归属",
      "推进事实与完成事实",
      "人工边界与审查重派",
    ]) expect(blueprint).toContain(heading);
  });
});
