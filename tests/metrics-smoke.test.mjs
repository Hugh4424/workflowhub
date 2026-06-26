import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = new URL(".", import.meta.url).pathname;
const REPO_ROOT = join(__dirname, "..");

describe("metrics-writer.mjs smoke", () => {
  it("can import metrics-writer.mjs without errors", async () => {
    await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
  });

  it("exports a run function", async () => {
    const mod = await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
    expect(typeof mod.runMetricsWriter || typeof mod.default).toBe("function");
  });

  it("runMetricsWriter produces task-metrics.jsonl", async () => {
    const outPath = join(REPO_ROOT, "task-metrics.jsonl");
    // Clean up any previous output
    try { unlinkSync(outPath); } catch {}
    
    const mod = await import(join(REPO_ROOT, "workflows/verify-code/metrics-writer.mjs"));
    const fn = mod.runMetricsWriter || mod.default;
    
    if (typeof fn === "function") {
      await fn({ taskDir: REPO_ROOT, taskId: "m10-smoke" });
      expect(existsSync(outPath)).toBe(true);
      const content = readFileSync(outPath, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
