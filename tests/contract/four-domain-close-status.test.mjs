import { describe, expect, it } from "vitest";

import {
  CURRENT_STATUS_DOMAINS,
  deriveCurrentCloseProjection,
  derivePhysicalDeliveryStatus,
} from "../../runtime/stage/current-close-projection.mjs";

const COMPLETE_FACTS = Object.freeze({
  delivery_committed: true,
  archive: true,
  merge: true,
  push: true,
  worktree_cleanup: true,
  formal_cleanup_safe: true,
  branch_cleanup: true,
  cleanup: { removed: true },
});

const PLAN = Object.freeze({
  schema_version: "task-close-plan.v1",
  task_id: "task",
  plan_hash: "plan-hash",
  steps: [
    { step_id: "commit-delivery", operation: "commit-delivery" },
    { step_id: "merge-task-branch", operation: "merge-task-branch" },
    { step_id: "archive-spec", operation: "archive-spec" },
    { step_id: "push-target-branch", operation: "push-target-branch" },
    { step_id: "cleanup", operation: "cleanup" },
  ],
});

function baseProjection(close = {}) {
  return deriveCurrentCloseProjection({
    task_id: "task",
    work_progress: { status: "ready", stage: "verify-code" },
    stage_quality: { status: "incomplete", gaps: ["code_review"] },
    product_release: { status: "not_released", reasons: ["acceptance_result_missing:AC-1"] },
    close,
  });
}

describe("S7 current close projection", () => {
  it("always returns the four independent domains in stable order", () => {
    const projection = baseProjection({ plan: null });

    expect(Object.keys(projection.domains)).toEqual([...CURRENT_STATUS_DOMAINS]);
    expect(projection.domains).toMatchObject({
      work_progress: { status: "ready" },
      stage_quality: { status: "incomplete" },
      product_release: { status: "not_released" },
      physical_delivery: { status: "not_started" },
    });
    expect(projection.domains.stage_quality.gaps).toEqual(["code_review"]);
    expect(projection.domains.product_release.reasons).toEqual(["acceptance_result_missing:AC-1"]);
  });

  it.each([
    ["no plan", { plan: null }, "not_started"],
    ["planned but incomplete", {
      plan: PLAN,
      step_records: [{ step_id: "cleanup", status: "failed", error: "permission denied" }],
      facts: { ...COMPLETE_FACTS, cleanup: { incomplete: true } },
    }, "incomplete"],
    ["physical facts without a completed result", {
      plan: PLAN,
      step_records: PLAN.steps.map((step) => ({ step_id: step.step_id, status: "completed" })),
      completed: null,
      facts: COMPLETE_FACTS,
    }, "incomplete"],
    ["deterministic cleanup completed", {
      plan: PLAN,
      step_records: PLAN.steps.map((step) => ({ step_id: step.step_id, status: "completed" })),
      completed: { schema_version: "task-close-completed.v1", task_id: "task", plan_hash: "plan-hash", status: "completed" },
      facts: COMPLETE_FACTS,
    }, "removed"],
    ["existing workspace", {
      plan: PLAN,
      workspace_mode: "existing",
      step_records: PLAN.steps.map((step) => ({ step_id: step.step_id, status: "completed" })),
      facts: { ...COMPLETE_FACTS, cleanup: { skipped: true, reason: "existing workspace is retained" } },
    }, "not_applicable_recorded"],
    ["physical read failure without a readable plan", { plan: null, read_error: "EIO" }, "unavailable"],
    ["physical read failure", { plan: PLAN, read_error: "EIO" }, "unavailable"],
    ["insufficient identity", { plan: PLAN, identity_status: "insufficient" }, "unknown"],
  ])("maps %s to one physical status", (_label, close, expected) => {
    expect(derivePhysicalDeliveryStatus(close)).toMatchObject({ status: expected });
  });

  it("keeps failed steps visible and does not invent a completed result", () => {
    const projection = baseProjection({
      plan: PLAN,
      step_records: [{ step_id: "cleanup", status: "failed", error: "permission denied" }],
      facts: { ...COMPLETE_FACTS, cleanup: { incomplete: true } },
    });

    expect(projection.domains.physical_delivery).toMatchObject({
      status: "incomplete",
      failed_steps: [{ step_id: "cleanup", error: "permission denied" }],
      next_action: expect.any(String),
    });
    expect(projection.close.completed).toBeNull();
  });

  it("projects recovered physical completion while retaining the immutable failed step", () => {
    const failedStep = { step_id: "cleanup", status: "failed", error: "transient permission denied" };
    const projection = baseProjection({
      plan: PLAN,
      step_records: [failedStep, ...PLAN.steps.filter((step) => step.step_id !== "cleanup").map((step) => ({ step_id: step.step_id, status: "completed" }))],
      completed: { schema_version: "task-close-completed.v1", task_id: "task", plan_hash: "plan-hash", status: "completed" },
      facts: COMPLETE_FACTS,
    });

    expect(projection.domains.physical_delivery).toMatchObject({ status: "removed" });
    expect(projection.close.step_records).toContainEqual(failedStep);
    expect(projection.close.completed).toMatchObject({ status: "completed", plan_hash: "plan-hash" });
  });

  it("separates immutable plan, step records, and the single completed result", () => {
    const stepRecords = PLAN.steps.map((step) => ({ step_id: step.step_id, status: "completed" }));
    const projection = baseProjection({ plan: PLAN, step_records: stepRecords, completed: null, facts: COMPLETE_FACTS });

    expect(projection.close.plan).toMatchObject({ plan_hash: "plan-hash" });
    expect(projection.close.step_records).toEqual(stepRecords);
    expect(projection.close.completed).toBeNull();
    expect(JSON.stringify(projection)).not.toMatch(/correction|recovery/);
  });
});
