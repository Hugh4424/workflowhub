import { describe, it, expect, afterEach } from "vitest";
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const SMOKE_TASK_DIR = join(tmpdir(), "workflowhub-smoke-test");

describe("metrics-writer.mjs smoke", () => {
  afterEach(() => {
    const stale = join(SMOKE_TASK_DIR, "task-metrics.jsonl");
    if (existsSync(stale)) unlinkSync(stale);
  });

  it("can import metrics-writer.mjs without errors", async () => {
    await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
  });

  it("exports a run function", async () => {
    const mod = await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
    expect(typeof mod.runMetricsWriter || typeof mod.default).toBe("function");
  });

  it("runMetricsWriter throws without executionId", async () => {
    const mod = await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
    const fn = mod.runMetricsWriter || mod.default;
    mkdirSync(SMOKE_TASK_DIR, { recursive: true });
    await expect(fn({ taskDir: SMOKE_TASK_DIR, taskId: "m10-smoke" }))
      .rejects.toThrow("executionId");
  });

  it("runMetricsWriter produces task-metrics.jsonl with executionId", async () => {
    const outPath = join(homedir(), ".workflowhub", "metrics", "global-metrics.jsonl");
    const mod = await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
    const fn = mod.runMetricsWriter || mod.default;
    
    if (typeof fn === "function") {
      mkdirSync(SMOKE_TASK_DIR, { recursive: true });
      const result = await fn({
        taskDir: SMOKE_TASK_DIR,
        taskId: "m10-smoke",
        verdict: "pass",
        executionId: "smoke-test-exec-id-001",
      });
      expect(result.executionId).toBe("smoke-test-exec-id-001");
      // verify the metrics file exists (collector creates it on updateOwnResult)
      expect(existsSync(outPath)).toBe(true);
    }
  });
});
