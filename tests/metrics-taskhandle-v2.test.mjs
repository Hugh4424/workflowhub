import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";
import { configForCollector, createMetricsLauncherConfig, recordSkeleton, updateOwnResult } from "../metrics/collector.mjs";

const temporary = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-metrics-v2-")));
  temporary.push(root);
  const task = createTask({ storageRoot: root, taskPath: join(root, "Projects", "Demo", "tasks", "metric-task"), manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "metric-task",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: join(root, "repo"), issue_ids: [], inputs: {},
  } });
  return { root, task, globalMetricsPath: join(root, "trusted", "metrics.jsonl") };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("metrics v2 trusted identity and stores", () => {
  it("derives task/project only from TaskHandle and global path only from loaded config", () => {
    const { task, globalMetricsPath } = fixture();
    const launcher = createMetricsLauncherConfig({ metrics_path: globalMetricsPath });
    const cfg = configForCollector(launcher, {
      task, taskId: "forged", project: "Forged", globalMetricsPath: "/tmp/forged.jsonl",
    });
    expect(cfg).toMatchObject({ taskId: "metric-task", project: "Demo", globalMetricsPath });
    expect(() => configForCollector(launcher, { task: {} })).toThrow(/TaskHandle|capability/i);
  });

  it("keeps one parseable task row and one global row carrying task identity across updates", () => {
    const { task, globalMetricsPath } = fixture();
    const cfg = configForCollector(createMetricsLauncherConfig({ metrics_path: globalMetricsPath }), { task });
    recordSkeleton({ execution_id: "exec-1", skill_or_stage: "verify-code", skill_version: "2.0.0" }, cfg);
    updateOwnResult("exec-1", { executed: true, duration_ms: 12 }, cfg);
    const taskRows = task.readRecord("task-metrics.jsonl").trim().split("\n").map(JSON.parse);
    const globalRows = readFileSync(globalMetricsPath, "utf8").trim().split("\n").map(JSON.parse);
    expect(taskRows).toHaveLength(1);
    expect(globalRows).toHaveLength(1);
    expect(globalRows[0]).toMatchObject({ execution_id: "exec-1", task_id: "metric-task", project: "Demo", executed: true });
  });

  it.each([
    ["entry", false],
    ["success", true],
    ["structural-fail", true],
    ["serious-pause", true],
    ["risk-override", true],
    ["omission-accept", true],
  ])("persists the %s own-result without losing the entry skeleton", (ownResult, executed) => {
    const { task, globalMetricsPath } = fixture();
    const cfg = configForCollector(createMetricsLauncherConfig({ metrics_path: globalMetricsPath }), { task });
    const executionId = `exec-${ownResult}`;

    recordSkeleton({
      execution_id: executionId,
      skill_or_stage: "make-decision",
      stage: "make-decision",
      skill_version: "2.0.0",
      own_result: "entry",
    }, cfg);
    if (ownResult !== "entry") {
      updateOwnResult(executionId, {
        executed,
        own_result: ownResult,
        stage_result: ownResult === "success" ? "passed" : ownResult,
      }, cfg);
    }

    const record = task.readRecord("task-metrics.jsonl")
      .trim().split("\n").map(JSON.parse)
      .find((item) => item.execution_id === executionId);
    expect(record).toMatchObject({
      execution_id: executionId,
      skill_or_stage: "make-decision",
      stage: "make-decision",
      executed,
      own_result: ownResult,
    });
  });

  it("warns on collector failure and preserves the original Stage result", () => {
    const { task, root } = fixture();
    const warnings = [];
    const cfg = configForCollector(
      createMetricsLauncherConfig({ metrics_path: join(root, "missing-parent", "metrics.jsonl") }),
      { task, onWarn: (message) => warnings.push(message) },
    );
    const executionId = "exec-warn-only";
    recordSkeleton({
      execution_id: executionId,
      skill_or_stage: "build-spec",
      stage: "build-spec",
      skill_version: "2.0.0",
    }, cfg);

    rmSync(join(root, "missing-parent"), { recursive: true, force: true });
    // A file where a directory is expected makes only the global collector fail.
    writeFileSync(join(root, "missing-parent"), "not a directory");
    const originalStageResult = "serious-pause";
    expect(() => updateOwnResult(executionId, {
      executed: true,
      own_result: "serious-pause",
      stage_result: originalStageResult,
    }, cfg)).not.toThrow();

    const record = task.readRecord("task-metrics.jsonl")
      .trim().split("\n").map(JSON.parse)
      .find((item) => item.execution_id === executionId);
    expect(record.stage_result).toBe(originalStageResult);
    expect(warnings).toEqual([expect.stringMatching(/metrics write failed/)]);
  });
});
