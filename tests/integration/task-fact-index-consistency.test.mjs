import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskFacts, writeStageRow } from "../../runtime/task/task-store.mjs";

function root(taskId = "facts-index") {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-facts-index-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-facts-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const task = createTask({
    storageRoot: storage,
    manifest: { schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId, created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  return task.taskPath;
}

function stageInput(stage, overrides = {}) {
  return {
    record_kind: "stage",
    stage,
    source: "task-fact-index-consistency-fixture",
    material_digest: { value: "a".repeat(64) },
    snapshot_tree: { value: "b".repeat(40) },
    review_origin: "not_run",
    review_result_ref: { value: null, reason: "no review dispatched for this fixture stage" },
    finding_dispositions: [],
    spec_analyze: { value: null, reason: "spec analysis not run for this fixture stage" },
    evidence: { value: [{ command: "true", exit_code: 0, failure_signature: "none" }] },
    layer_states: {
      implementation_completion: "completed",
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    },
    serious_issue_disposition: { value: null, reason: "no serious issue in this fixture stage" },
    close_action: { value: null, reason: "stage rows never carry a close action" },
    handoff: { value: null, reason: "no handoff item in this fixture stage" },
    ...overrides,
  };
}

describe("task fact row store", () => {
  it("T1 AC-MS-008 replaces same-stage rows and preserves concurrent stages", () => {
    const taskRoot = root();
    const first = writeStageRow(taskRoot, stageInput("build-code", { review_origin: "unavailable" }));
    const concurrent = writeStageRow(taskRoot, stageInput("build-plan"));
    expect(first.action).toBe("inserted");
    expect(concurrent.action).toBe("inserted");
    expect(readTaskFacts(taskRoot)).toHaveLength(2);

    const repaired = writeStageRow(taskRoot, stageInput("build-code", { review_origin: "conducted", review_result_ref: { value: "quality/reviews/results/current.json" } }));
    expect(repaired.action).toBe("replaced");
    const rows = readTaskFacts(taskRoot);
    // A same-stage repair updates that one row; it must never append a second.
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.stage === "build-code")).toHaveLength(1);
    expect(rows.find((row) => row.stage === "build-code").review_origin).toBe("conducted");
    expect(rows.find((row) => row.stage === "build-plan").record_kind).toBe("stage");
    expect(Object.keys(rows[0]).sort()).toEqual([
      "close_action", "created_at", "evidence", "finding_dispositions", "handoff", "layer_states",
      "material_digest", "record_kind", "review_origin", "review_result_ref", "serious_issue_disposition",
      "snapshot_tree", "source", "spec_analyze", "stage", "task_id",
    ]);
    expect(readdirSync(taskRoot).sort()).toEqual(["facts.jsonl", "quality", "task.json"]);
  });

  it("writes the current row into the single execution record file", () => {
    const taskRoot = root("facts-seam-no-index");
    writeStageRow(taskRoot, stageInput("verify-code"));
    const rows = readTaskFacts(taskRoot);
    expect(rows.map((row) => row.stage)).toEqual(["verify-code"]);
    expect(readdirSync(taskRoot).sort()).toEqual(["facts.jsonl", "quality", "task.json"]);
    expect(readdirSync(taskRoot).some((name) => /index/i.test(name))).toBe(false);
  });
});
