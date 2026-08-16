import { expect, test } from "vitest";

async function projectionApi() {
  try { return await import("../review-semantic-projection.mjs"); }
  catch { return null; }
}

test("semantic projection excludes T010 status writes but changes for delivery behavior", async () => {
  const api = await projectionApi();
  expect(api).toBeTruthy();
  const base = { stage: "build-code", review_scope: "integration", contract_id: "build-code", contract_hash: "contract-1", materials: { approved_spec: "same", acceptance_criteria: ["AC-1"], ac_trace: [{ id: "AC-1", test: "green" }], implementation_summary: "works", test_evidence: { exit_code: 0 } } };
  const withStatusWrite = { ...base, materials: { ...base.materials, status: "completed", handoff: "written", review_ref: "new-ref" } };
  const withBehaviorChange = { ...base, materials: { ...base.materials, implementation_summary: "fails on retry" } };
  const first = api.buildSemanticProjection(base);
  const second = api.buildSemanticProjection(withStatusWrite);
  const third = api.buildSemanticProjection(withBehaviorChange);
  expect(first.semantic_hash).toBe(second.semantic_hash);
  expect(api.compareSemanticProjection(first, second).kind).toBe("record_only_changed");
  expect(first.semantic_hash).not.toBe(third.semantic_hash);
  expect(api.compareSemanticProjection(first, third).kind).toBe("semantic_changed");
  expect(first.projection_version).toBe("wh-review-semantic-projection.v1");
});

test("projection identity includes surface and contract version but never full snapshot tree", async () => {
  const api = await projectionApi();
  expect(api).toBeTruthy();
  const result = api.buildSemanticProjection({ stage: "build-code", review_scope: "phase", contract_id: "build-code/phase", contract_hash: "contract-1", materials: { approved_spec: "spec", acceptance_criteria: ["AC-1"], phase_map: { state: "complete" }, snapshot_tree: "tree-a" } });
  expect(result.surface).toBe("build-code/phase");
  expect(Object.hasOwn(result.input, "snapshot_tree")).toBe(false);
});

test("integration semantic projection ignores host-only AC evidence trace", async () => {
  const api = await projectionApi();
  expect(api).toBeTruthy();
  const base = { stage: "build-code", review_scope: "integration", contract_id: "build-code", contract_hash: "contract-1", materials: { approved_spec: "same", acceptance_criteria: ["AC-1"], ac_trace: { entries: [{ acceptance_criterion_id: "AC-1", status: "passed" }] }, implementation_summary: "works", test_evidence: { exit_code: 0 } } };
  const changed = structuredClone(base);
  changed.materials.ac_trace.entries[0].status = "failed";
  expect(api.buildSemanticProjection(base).semantic_hash).toBe(api.buildSemanticProjection(changed).semantic_hash);
});

test("projection ignores execution-status writeback but keeps task-material changes semantic", async () => {
  const api = await projectionApi();
  expect(api).toBeTruthy();
  const base = {
    stage: "build-plan",
    review_scope: null,
    contract_id: "build-plan",
    contract_hash: "contract-1",
    materials: {
      approved_spec: "same",
      acceptance_criteria: ["AC-1"],
      draft_plan: "same plan",
      draft_tasks: "# Tasks\n\n#### T010 — implement behavior\n- 任务：实现成功路径\n\n##### 执行状态填写区（唯一完成权威）\n- status: pending\n",
    },
  };
  const statusWriteback = structuredClone(base);
  statusWriteback.materials.draft_tasks = statusWriteback.materials.draft_tasks.replace("- status: pending", "- status: completed\n- 执行事实：已写回结果");
  expect(api.buildSemanticProjection(base).semantic_hash).toBe(api.buildSemanticProjection(statusWriteback).semantic_hash);

  const semanticChange = structuredClone(base);
  semanticChange.materials.draft_tasks = semanticChange.materials.draft_tasks.replace("实现成功路径", "实现重试路径");
  expect(api.buildSemanticProjection(base).semantic_hash).not.toBe(api.buildSemanticProjection(semanticChange).semantic_hash);
});
