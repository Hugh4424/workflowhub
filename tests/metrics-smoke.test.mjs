import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";
import { runMetricsWriter } from "../workflows/verify-code/metrics-writer.mjs";
import { createMetricsLauncherConfig } from "../metrics/collector.mjs";

const temporary = [];
function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-metrics-task-v1-")));
  temporary.push(storageRoot);
  const taskPath = join(storageRoot, "Projects", "Demo", "tasks", "metrics-task");
  return createTask({ storageRoot, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "metrics-task",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: join(storageRoot, "repo"),
    issue_ids: [], inputs: {},
  } });
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("verify-code metrics TaskHandle contract", () => {
  it("requires a branded TaskHandle and external executionId", async () => {
    await expect(runMetricsWriter({ executionId: "exec-1", task: {} }))
      .rejects.toThrow(/TaskHandle|brand|capability/i);
    await expect(runMetricsWriter({ task: fixture() })).rejects.toThrow(/executionId/i);
  });

  it("writes task metrics through controlled record I/O, never a caller path", async () => {
    const task = fixture();
    const metricsLauncherConfig = createMetricsLauncherConfig({ metrics_path: join(task.taskPath, "global-metrics.jsonl") });
    const result = await runMetricsWriter({
      task,
      metricsLauncherConfig,
      verdict: "pass",
      executionId: "exec-1",
    });
    expect(result.executionId).toBe("exec-1");
    const record = task.readRecord("task-metrics.jsonl")
      .trim().split("\n").map((line) => JSON.parse(line))
      .find((item) => item.execution_id === "exec-1");
    expect(record).toMatchObject({ execution_id: "exec-1", verdict: "pass" });
  });
});
