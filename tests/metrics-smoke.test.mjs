import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const REPO_ROOT = new URL("..", import.meta.url).pathname;

describe("metrics-writer.mjs smoke", () => {
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
    await expect(fn({ taskDir: REPO_ROOT, taskId: "m10-smoke" }))
      .rejects.toThrow("executionId");
  });

  it("runMetricsWriter produces task-metrics.jsonl with executionId", async () => {
    const outPath = join(homedir(), ".workflowhub", "metrics", "global-metrics.jsonl");
    const mod = await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
    const fn = mod.runMetricsWriter || mod.default;
    
    if (typeof fn === "function") {
      const result = await fn({
        taskDir: REPO_ROOT,
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
