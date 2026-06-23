/**
 * fact-collector.test.mjs — M5 Phase 1
 *
 * FR-FACT-001/002/003: collectFacts writes 4 physical facts into task record.
 * FR-GUARD-001: never throws on failure, emits stderr warn.
 *
 * All three tests are falsifiable: each will fail if the production path
 * does not actually run (no _factSeed cheating, no proxy assertions).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { makeHostAdapter } from "../metrics/adapters/host-adapter.mjs";
import { collectFacts, recordSkeleton } from "../metrics/collector.mjs";

let workDir;
let taskPath;
let globalPath;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "m5-facts-"));
  taskPath = join(workDir, "task-metrics.jsonl");
  globalPath = join(workDir, "global-metrics.jsonl");
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function baseConfig() {
  return {
    taskMetricsPath: taskPath,
    globalMetricsPath: globalPath,
    taskId: "m5-quality-mechanism",
    project: "workflowhub",
    // Point git derivation at the workflowhub repo itself (it is a real git repo).
    repoRoot: new URL("..", import.meta.url).pathname,
  };
}

// Read all records from jsonl
function readAllRecords(path) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8").trim();
  if (!text) return [];
  return text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

describe("fact collector", () => {
  it("fact collector writes 4 physical facts", () => {
    // Drive collection via the REAL caller path (makeHostAdapter -> onSkillEnd -> updateOwnResult).
    // No _factSeed. Facts must be derived automatically.
    const cfg = baseConfig();
    const execution_id = "exec-facts-001";
    const adapter = makeHostAdapter(cfg);

    adapter.onSkillStart({
      execution_id,
      skill_or_stage: "speckit-apply",
      stage: "apply",
      skill_version: "1.0.0",
      executed: false,
    });

    // onSkillEnd passes patch (with exit_code) to updateOwnResult which calls collectFacts.
    // No _factSeed field at all.
    adapter.onSkillEnd(execution_id, { executed: true, exit_code: 0 });

    const records = readAllRecords(taskPath);
    const record = records.find((r) => r.execution_id === execution_id);

    expect(record).toBeDefined();
    expect(record.facts).toBeDefined();
    // exit_code: supplied via patch, must be the number 0
    expect(record.facts.exit_code).toBe(0);
    // git_sha: derived from `git rev-parse HEAD` on the real repo — must be a non-empty string
    expect(typeof record.facts.git_sha).toBe("string");
    expect(record.facts.git_sha.length).toBeGreaterThan(0);
    // files_changed: derived from `git diff --name-only HEAD` — must be an array
    expect(Array.isArray(record.facts.files_changed)).toBe(true);
    // review_invoked: derived from record; no review field present → literal false (not null/undefined)
    expect(typeof record.facts.review_invoked).toBe("boolean");
  });

  it("collectFacts with no exit_code or review_invoked does not throw and review_invoked is false", () => {
    // Falsifiable: if review_invoked were null or undefined this would fail.
    const cfg = baseConfig();
    const execution_id = "exec-facts-002";

    // Lay skeleton so readRecord finds it.
    recordSkeleton(
      { execution_id, skill_or_stage: "speckit-apply", stage: "apply", skill_version: "1.0.0", executed: false },
      cfg
    );

    expect(() => collectFacts(execution_id, {}, cfg)).not.toThrow();

    const records = readAllRecords(taskPath);
    const record = records.find((r) => r.execution_id === execution_id);
    // review_invoked must be literal false, not null/undefined
    expect(record?.facts?.review_invoked).toBe(false);
  });

  it("collectFacts write failure does not throw and emits a write-fail stderr warning", () => {
    // Falsifiable: pass exit_code and review_invoked so those warnings can't fire.
    // The only warning that CAN fire is the write-failure warn.
    // The test will fail if write-failure warn is never emitted.
    const cfg = baseConfig();
    const execution_id = "exec-facts-003";

    const stderrWrites = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk, ...args) => {
      stderrWrites.push(String(chunk));
      return originalWrite(chunk, ...args);
    };

    try {
      const badCfg = {
        ...cfg,
        taskMetricsPath: "/dev/null/nope/x.jsonl",   // unwritable path
        globalMetricsPath: "/dev/null/nope/g.jsonl",
      };
      // Pass exit_code and review_invoked so only the write-failure path emits a warning.
      expect(() =>
        collectFacts(execution_id, { exit_code: 1, review_invoked: true }, badCfg)
      ).not.toThrow();
    } finally {
      process.stderr.write = originalWrite;
    }

    // Must have a write-failure warning (contains "fail")
    const hasWriteFailWarn = stderrWrites.some((w) => w.toLowerCase().includes("fail"));
    expect(hasWriteFailWarn).toBe(true);
  });
});
