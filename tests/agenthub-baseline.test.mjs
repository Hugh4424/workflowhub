/**
 * tests/agenthub-baseline.test.mjs — Vitest test runner.
 *
 * Tests scripts/agenthub-baseline.mjs which computes 5 baseline process metrics
 * from 4 hard-coded AgentHub task journal JSONL files.
 */

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT = join(__dirname, "..", "scripts", "agenthub-baseline.mjs");

function run(args = []) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    cwd: __dirname,
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
    signal: result.signal,
  };
}

describe("agenthub-baseline.mjs", () => {
  it("exits 0 and outputs valid JSON with 5 metrics", () => {
    const r = run();
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.metrics).toBeTruthy();
    const expectedKeys = [
      "missed_step_rate",
      "test_execution_rate",
      "review_execution_rate",
      "rework_rounds",
      "rework_proxy_count",
    ];
    for (const key of expectedKeys) {
      expect(key in data.metrics).toBe(true);
    }
  });

  it("missed_step_rate is a number between 0 and 1", () => {
    const r = run();
    const data = JSON.parse(r.stdout);
    const v = data.metrics.missed_step_rate;
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it("test_execution_rate is a number between 0 and 1", () => {
    const r = run();
    const data = JSON.parse(r.stdout);
    const v = data.metrics.test_execution_rate;
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it("review_execution_rate is a number between 0 and 1", () => {
    const r = run();
    const data = JSON.parse(r.stdout);
    const v = data.metrics.review_execution_rate;
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it("rework_rounds is a non-negative number", () => {
    const r = run();
    const data = JSON.parse(r.stdout);
    const v = data.metrics.rework_rounds;
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
  });

  it("rework_proxy_count is a non-negative number", () => {
    const r = run();
    const data = JSON.parse(r.stdout);
    const v = data.metrics.rework_proxy_count;
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
  });

  it("--baseline-only flag outputs only baseline object", () => {
    const r = run(["--baseline-only"]);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.baseline).toBeTruthy();
    expect(data.baseline.metrics).toBeTruthy();
    const expectedKeys = [
      "missed_step_rate",
      "test_execution_rate",
      "review_execution_rate",
      "rework_rounds",
      "rework_proxy_count",
    ];
    for (const key of expectedKeys) {
      expect(key in data.baseline.metrics).toBe(true);
    }
    expect(data.baseline.source_tasks).toBeTruthy();
    expect(Array.isArray(data.baseline.source_tasks)).toBe(true);
    expect(data.baseline.source_tasks.length).toBe(4);
  });

  it("includes per-task breakdown when not using --baseline-only", () => {
    const r = run();
    const data = JSON.parse(r.stdout);
    expect(data.tasks).toBeTruthy();
    expect(data.tasks.length).toBe(4);
    for (const task of data.tasks) {
      expect(task.task_id).toBeTruthy();
      expect(task.metrics).toBeTruthy();
    }
  });

  it("handles missing journals gracefully (null, no crash)", () => {
    const r = run();
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.metrics || data.baseline).toBeTruthy();
  });
});
