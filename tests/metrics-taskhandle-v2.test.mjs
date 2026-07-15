import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
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
});
