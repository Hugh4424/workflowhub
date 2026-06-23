/**
 * metrics-smoke.test.mjs — M4 Phase 5 (T020/T022, FR-CI-001/002, decision-log D14).
 *
 * CI smoke for the metrics foundation. Two halves, both must hold (spec AC10):
 *   1. STRUCTURE CHECK — scripts/check-metrics-schema.mjs validates the metrics
 *      schemas (execution-record + knowledge-card) against their contracts/validators;
 *      it exits 0 on good samples and is provably falsifiable (a deliberately broken
 *      sample makes it exit non-zero).
 *   2. AGGREGATION SMOKE — a TEMP DIR is injected as the global metrics_path (no
 *      dependency on a user-level ~/.workflowhub dir; FR-CI-002): valid records written
 *      there aggregate cleanly (positive), and a missing-key / bad-schema record is
 *      rejected (negative red), proving the smoke is not an always-green empty run.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { validateExecutionRecord } from "../metrics/execution-record.mjs";
import { validateRecord } from "../metrics/record-schema.mjs";
import { validateKnowledgeCard } from "../metrics/knowledge-card.mjs";
import {
  configForCollector,
  recordSkeleton,
  updateOwnResult,
  updateStageImpact,
} from "../metrics/collector.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const checker = resolve(repoRoot, "scripts", "check-metrics-schema.mjs");

function runChecker(extraArgs = []) {
  return spawnSync(process.execPath, [checker, ...extraArgs], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

describe("T020/T021 structure check — check-metrics-schema.mjs", () => {
  it("exits 0 when the metrics schemas validate (good samples)", () => {
    const r = runChecker();
    expect(r.status).toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/check-metrics-schema/i);
  });

  it("is falsifiable: a forced-broken sample makes it exit non-zero", () => {
    // The checker honours a fault-injection flag so the smoke proves it can go red.
    const r = runChecker(["--force-invalid-sample"]);
    expect(r.status).not.toBe(0);
  });
});

describe("T022 aggregation smoke — temp-dir global path, no user-level dir", () => {
  function withTempMetricsDir(fn) {
    const dir = mkdtempSync(join(tmpdir(), "wh-metrics-smoke-"));
    try {
      return fn(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it("positive: the REAL collector dual-write path is exercised via injected temp global path", () => {
    withTempMetricsDir((dir) => {
      // FR-CI-002: inject a temp dir as the global metrics_path so the smoke covers the
      // actual global dual-write code path (configForCollector → recordSkeleton →
      // upsert(globalMetricsPath)), NOT a hand-written file. No user-level ~/.workflowhub.
      const tempGlobalPath = join(dir, "global", "global-metrics.jsonl");
      const tempTaskDir = join(dir, "task");
      mkdirSync(dirname(tempGlobalPath), { recursive: true });
      mkdirSync(tempTaskDir, { recursive: true });

      const cfg = configForCollector(
        { metrics_path: tempGlobalPath },
        { taskDir: tempTaskDir, taskId: "smoke-task", project: "workflowhub" }
      );
      // The injected path must actually drive the global write target.
      expect(cfg.globalMetricsPath).toBe(tempGlobalPath);

      // Drive the three-timing collector: skeleton (start) → own result (end) → stage impact.
      const seed = {
        execution_id: "exec-smoke-1",
        skill_or_stage: "superpowers-test-driven-development",
        stage: "apply",
        skill_version: "0.1.0",
        executed: true,
        rework_rounds: 0,
        human_intervention: false,
      };
      recordSkeleton(seed, cfg);
      updateOwnResult("exec-smoke-1", { executed: true, duration_ms: 50 }, cfg);
      updateStageImpact("exec-smoke-1", { rework_rounds: 0 }, cfg);

      // The collector must have written the GLOBAL store at the injected path.
      expect(existsSync(tempGlobalPath)).toBe(true);

      // Aggregate from the injected GLOBAL path (the dual-write target), proving the
      // global path was actually covered — not a side file we wrote ourselves.
      const lines = readFileSync(tempGlobalPath, "utf8").trim().split("\n").filter(Boolean);
      const rows = lines.map((l) => JSON.parse(l));
      const executedCount = rows.filter((r) => r.executed === true).length;
      expect(executedCount).toBe(1);
      expect(rows[0].execution_id).toBe("exec-smoke-1");
    });
  });

  it("negative: a missing-key unified record is rejected (smoke can go red)", () => {
    // A unified execution record missing required join keys must fail validation —
    // proving the aggregation smoke is not always-green.
    const broken = { execution_id: "", progress: {} }; // empty id + missing SIX_KEYS
    expect(validateExecutionRecord(broken).valid).toBe(false);
  });

  it("negative: a bad-schema knowledge card is rejected", () => {
    const badCard = { type: "not-a-real-type", stage: "apply" }; // missing required fields
    expect(validateKnowledgeCard(badCard).valid).toBe(false);
  });
});
