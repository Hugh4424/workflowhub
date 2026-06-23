/**
 * metrics-collector.test.mjs — M4 Phase 1 (RED first)
 *
 * Covers tasks.md T001-T006, spec section 4 COLLECT domain + section 6 entities.
 * The modules under test do not exist yet; importing them is the RED source.
 *
 * FR-COLLECT-001/002: per-skill/stage granularity + core field set with execution_id
 * FR-COLLECT-003/004: three-timing one-record-three-updates, re-locate by execution_id
 * FR-COLLECT-005:      collector core decoupled from host; host-adapter translates timings
 * FR-COLLECT-006/007:  dual-write task-level + global, global carries four identifiers
 * FR-GUARD-001/002/003/004: only-record-never-block + three historical pitfalls
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import {
  recordSkeleton,
  updateOwnResult,
  updateStageImpact,
  readRecord,
} from "../metrics/collector.mjs";
import { validateRecord, CORE_FIELDS } from "../metrics/record-schema.mjs";
import { makeHostAdapter } from "../metrics/adapters/host-adapter.mjs";

let workDir;
let taskPath;
let globalPath;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "m4-metrics-"));
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
    taskId: "m4-metrics-foundation",
    project: "workflowhub",
  };
}

describe("T001/T002 core field set + execution_id", () => {
  it("a complete record passes validateRecord", () => {
    const rec = {
      execution_id: "exec-1",
      skill_or_stage: "speckit-plan",
      stage: "plan",
      skill_version: "1.0.0",
      executed: true,
      tokens: 123,
      duration_ms: 4567,
      rework_rounds: 0,
      human_intervention: false,
      friction_ref: null,
    };
    const { valid, errors } = validateRecord(rec);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it("a record missing execution_id is invalid", () => {
    const rec = {
      skill_or_stage: "speckit-plan",
      stage: "plan",
      executed: true,
    };
    const { valid, errors } = validateRecord(rec);
    expect(valid).toBe(false);
    expect(errors.join(" ")).toMatch(/execution_id/);
  });

  it("CORE_FIELDS lists execution_id as required", () => {
    const ids = CORE_FIELDS.filter((f) => f.required).map((f) => f.name);
    expect(ids).toContain("execution_id");
  });
});

describe("T002 three-timing one-record-three-updates", () => {
  it("three updates on same execution_id merge into ONE record, not three", () => {
    const cfg = baseConfig();
    recordSkeleton({ execution_id: "exec-9", skill_or_stage: "speckit-plan", stage: "plan" }, cfg);
    updateOwnResult("exec-9", { tokens: 200, duration_ms: 5000, executed: true }, cfg);
    updateStageImpact("exec-9", { rework_rounds: 1 }, cfg);

    const lines = readFileSync(taskPath, "utf8").trim().split("\n").filter(Boolean);
    const recs = lines.map((l) => JSON.parse(l));
    const exec9 = recs.filter((r) => r.execution_id === "exec-9");
    expect(exec9.length).toBe(1);
    expect(exec9[0].tokens).toBe(200);
    expect(exec9[0].rework_rounds).toBe(1);
  });

  it("re-locates the record from disk by execution_id (not in-memory ref)", () => {
    const cfg = baseConfig();
    recordSkeleton({ execution_id: "exec-cold", skill_or_stage: "x", stage: "plan" }, cfg);
    // simulate session compaction: only execution_id survives, update via a fresh call
    updateOwnResult("exec-cold", { tokens: 7 }, cfg);
    const rec = readRecord("exec-cold", cfg);
    expect(rec.tokens).toBe(7);
  });
});

describe("T003 dual-write task-level + global", () => {
  it("one capture produces one record in BOTH task and global stores", () => {
    const cfg = baseConfig();
    recordSkeleton({ execution_id: "exec-d", skill_or_stage: "x", stage: "plan" }, cfg);
    updateOwnResult("exec-d", { executed: true }, cfg);
    updateStageImpact("exec-d", {}, cfg);
    expect(existsSync(taskPath)).toBe(true);
    expect(existsSync(globalPath)).toBe(true);
    const g = readFileSync(globalPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const gd = g.filter((r) => r.execution_id === "exec-d");
    expect(gd.length).toBe(1);
  });

  it("global record carries four identifiers task_id/project/skill/version", () => {
    const cfg = baseConfig();
    recordSkeleton({ execution_id: "exec-g", skill_or_stage: "speckit-plan", stage: "plan", skill_version: "1.2.0" }, cfg);
    updateStageImpact("exec-g", {}, cfg);
    const g = readFileSync(globalPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const gg = g.find((r) => r.execution_id === "exec-g");
    expect(gg.task_id).toBe("m4-metrics-foundation");
    expect(gg.project).toBe("workflowhub");
    expect(gg.skill).toBe("speckit-plan");
    expect(gg.version).toBe("1.2.0");
  });
});

describe("T004 host decoupling", () => {
  it("host-adapter translates host timings into the three core calls", () => {
    const cfg = baseConfig();
    const adapter = makeHostAdapter(cfg);
    adapter.onSkillStart({ execution_id: "exec-h", skill_or_stage: "x", stage: "plan" });
    adapter.onSkillEnd("exec-h", { tokens: 5 });
    adapter.onStageEnd("exec-h", { rework_rounds: 0 });
    const rec = readRecord("exec-h", cfg);
    expect(rec.tokens).toBe(5);
  });

  it("collector core source has no host-specific hook hard-binding", () => {
    const src = readFileSync(new URL("../metrics/collector.mjs", import.meta.url), "utf8");
    // collector must not import or reference any host-specific hook framework
    expect(src).not.toMatch(/PostToolUse|claude-code-hook|SessionStart/i);
  });
});

describe("T005 three historical pitfalls (negative cases)", () => {
  it("action count dedupes by action id, not message id (no zero-collapse)", () => {
    const cfg = baseConfig();
    // two distinct actions sharing one message id must count as 2, not collapse to 0/1
    const actions = [
      { action_id: "toolu_a", message_id: "msg_1" },
      { action_id: "toolu_b", message_id: "msg_1" },
    ];
    recordSkeleton({ execution_id: "exec-cnt", skill_or_stage: "x", stage: "plan", actions }, cfg);
    updateStageImpact("exec-cnt", {}, cfg);
    const rec = readRecord("exec-cnt", cfg);
    expect(rec.action_count).toBe(2);
  });

  it("stage rollup dedupes within stage before summing (no double on reopen)", () => {
    const cfg = baseConfig();
    // same stage reopened: two windows each contributing the SAME unit must not double
    recordSkeleton({ execution_id: "exec-w1", skill_or_stage: "x", stage: "apply", stage_unit: "u1" }, cfg);
    updateStageImpact("exec-w1", {}, cfg);
    recordSkeleton({ execution_id: "exec-w2", skill_or_stage: "x", stage: "apply", stage_unit: "u1" }, cfg);
    updateStageImpact("exec-w2", {}, cfg);
    const { rollupStage } = collectorRollup();
    const total = rollupStage("apply", cfg);
    expect(total.distinct_units).toBe(1);
  });

  it("unreachable session source marks gap, never zero-fills", () => {
    const cfg = { ...baseConfig(), tokenSourceReachable: false };
    recordSkeleton({ execution_id: "exec-gap", skill_or_stage: "x", stage: "plan" }, cfg);
    updateOwnResult("exec-gap", {}, cfg);
    const rec = readRecord("exec-gap", cfg);
    expect(rec.tokens).toBe("gap");
    expect(rec.tokens).not.toBe(0);
  });
});

describe("T006 only-record-never-block behavior", () => {
  it("write failure emits an observable warning but does NOT throw/block", () => {
    const cfg = { ...baseConfig(), taskMetricsPath: "/nonexistent-dir-xyz/cannot/write.jsonl" };
    const warnings = [];
    cfg.onWarn = (w) => warnings.push(w);
    // must not throw — recording is only-record-never-block
    expect(() => {
      recordSkeleton({ execution_id: "exec-fail", skill_or_stage: "x", stage: "plan" }, cfg);
    }).not.toThrow();
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("normal write does NOT emit a false write-failure warning", () => {
    const cfg = baseConfig();
    const warnings = [];
    cfg.onWarn = (w) => warnings.push(w);
    recordSkeleton({ execution_id: "exec-ok", skill_or_stage: "x", stage: "plan" }, cfg);
    expect(warnings.filter((w) => /write.*fail/i.test(w)).length).toBe(0);
  });
});

// helper imported lazily to keep the rollup surface explicit in RED
import { collectorRollup } from "../metrics/collector.mjs";

// ── Round-2 review fixes ──────────────────────────────────────────────────
// Finding 1 (record-schema.mjs): all core fields must be structurally present;
// a record with only execution_id must FAIL (AC5: 缺任一核心字段即判失败).
// Sentinel null/gap remains an allowed VALUE for any non-id field (FR-GUARD-004).
import { configForCollector } from "../metrics/collector.mjs";
import { loadConfig } from "../core/load-config.mjs";

describe("Round-2 F1: full core field set structurally required", () => {
  it("a record with ONLY execution_id is invalid (missing other core fields)", () => {
    const { valid, errors } = validateRecord({ execution_id: "exec-only" });
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("removing any single core field makes the record invalid", () => {
    const complete = {
      execution_id: "exec-1",
      skill_or_stage: "speckit-plan",
      stage: "plan",
      skill_version: "1.0.0",
      executed: true,
      tokens: 123,
      duration_ms: 4567,
      rework_rounds: 0,
      human_intervention: false,
      friction_ref: null,
    };
    for (const field of CORE_FIELDS) {
      const rec = { ...complete };
      delete rec[field.name];
      const { valid, errors } = validateRecord(rec);
      expect(valid, `removing ${field.name} should invalidate`).toBe(false);
      expect(errors.join(" ")).toMatch(new RegExp(field.name));
    }
  });

  it("null/gap sentinel VALUES are allowed for non-id core fields", () => {
    const rec = {
      execution_id: "exec-1",
      skill_or_stage: "stage",
      stage: "plan",
      skill_version: "1.0.0",
      executed: true,
      tokens: "gap",
      duration_ms: null,
      rework_rounds: 0,
      human_intervention: false,
      friction_ref: null,
    };
    const { valid } = validateRecord(rec);
    expect(valid).toBe(true);
  });

  it("blank or non-string execution_id is invalid", () => {
    const complete = {
      execution_id: "",
      skill_or_stage: "stage",
      stage: "plan",
      skill_version: "1.0.0",
      executed: true,
      tokens: 1,
      duration_ms: 1,
      rework_rounds: 0,
      human_intervention: false,
      friction_ref: null,
    };
    expect(validateRecord(complete).valid).toBe(false);
    expect(validateRecord({ ...complete, execution_id: 123 }).valid).toBe(false);
  });
});

describe("Round-2 F2: collector derives global path from config metrics_path", () => {
  it("configForCollector maps loaded config.metrics_path to globalMetricsPath", () => {
    const cfg = configForCollector(
      { metrics_path: "/var/tmp/wh-global.jsonl" },
      { taskDir: workDir, taskId: "t1", project: "workflowhub" }
    );
    expect(cfg.globalMetricsPath).toBe("/var/tmp/wh-global.jsonl");
    expect(cfg.taskId).toBe("t1");
    expect(cfg.project).toBe("workflowhub");
    // task-level path is derived under the task dir
    expect(cfg.taskMetricsPath.startsWith(workDir)).toBe(true);
  });

  it("the shipped config/workflowhub.yaml declares a metrics_path value", () => {
    const loaded = loadConfig(
      join(import.meta.dirname, "..", "config", "workflowhub.yaml")
    );
    expect(typeof loaded.metrics_path).toBe("string");
    expect(loaded.metrics_path.length).toBeGreaterThan(0);
  });
});

// ── Round-2 (re-review) blocking fixes ────────────────────────────────────
// F3 (collector.mjs): a persisted record must never drop a required field.
//   resolveTokens returned undefined when tokens absent+reachable; JSON.stringify
//   drops undefined keys, so the persisted JSONL row failed validateRecord.
// F4 (config + configForCollector): a leading "~/" must expand to the user home dir,
//   else the default global path lands inside the repo (violates FR-COLLECT-007).
import { homedir } from "os";

describe("Round-2 re-review F3: persisted record keeps every required field", () => {
  it("a skeleton with no token data still persists a `tokens` key that validates", () => {
    const cfg = baseConfig();
    recordSkeleton({ execution_id: "e-tok", skill_or_stage: "x", stage: "plan" }, cfg);
    // read what was actually written to disk (not the in-memory return)
    const persisted = readFileSync(taskPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const row = persisted.find((r) => r.execution_id === "e-tok");
    expect(row).toBeTruthy();
    expect("tokens" in row).toBe(true);           // key must survive JSON serialization
    expect(validateRecord(row).valid).toBe(true); // persisted row passes its own validator
    // global store too
    const g = readFileSync(globalPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const grow = g.find((r) => r.execution_id === "e-tok");
    expect("tokens" in grow).toBe(true);
  });

  it("unreachable token source still marks gap (not null)", () => {
    const cfg = { ...baseConfig(), tokenSourceReachable: false };
    recordSkeleton({ execution_id: "e-gap", skill_or_stage: "x", stage: "plan" }, cfg);
    const row = readFileSync(taskPath, "utf8").trim().split("\n").filter(Boolean)
      .map((l) => JSON.parse(l)).find((r) => r.execution_id === "e-gap");
    expect(row.tokens).toBe("gap");
  });
});

describe("Round-2 re-review F4: leading ~/ in metrics_path expands to home", () => {
  it("configForCollector expands a leading ~/ to an absolute path outside the repo", () => {
    const cfg = configForCollector(
      { metrics_path: "~/.workflowhub/metrics/global-metrics.jsonl" },
      { taskDir: workDir, taskId: "t1", project: "workflowhub" }
    );
    expect(cfg.globalMetricsPath.startsWith(homedir())).toBe(true);
    expect(cfg.globalMetricsPath.includes("~")).toBe(false);
    // must NOT resolve inside the workflowhub repo
    expect(cfg.globalMetricsPath.includes("Project/workflowhub/~")).toBe(false);
  });

  it("the shipped config default expands to a user-level path outside the repo", () => {
    const loaded = loadConfig(
      join(import.meta.dirname, "..", "config", "workflowhub.yaml")
    );
    const cfg = configForCollector(loaded, { taskDir: workDir, taskId: "t1", project: "workflowhub" });
    expect(cfg.globalMetricsPath.startsWith(homedir())).toBe(true);
    expect(cfg.globalMetricsPath.includes("~")).toBe(false);
  });

  it("an already-absolute metrics_path is left unchanged", () => {
    const cfg = configForCollector(
      { metrics_path: "/var/tmp/abs-global.jsonl" },
      { taskDir: workDir, taskId: "t1", project: "workflowhub" }
    );
    expect(cfg.globalMetricsPath).toBe("/var/tmp/abs-global.jsonl");
  });
});
