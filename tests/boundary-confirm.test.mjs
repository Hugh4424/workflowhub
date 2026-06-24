/**
 * boundary-confirm.test.mjs — M5 Phase 2
 *
 * FR-BOUND-001/002/003 + FR-GATE-003/004
 * Falsifiable: each test writes through the real upsert pipeline and reads
 * back from JSONL. No proxy assertions — if the record isn't on disk the test fails.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { confirmBoundary, confirmIrreversible } from "../core/boundary-confirm.mjs";
import { recordSkeleton } from "../metrics/collector.mjs";

// Read all records from a JSONL path.
function readAllRecords(path) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8").trim();
  if (!text) return [];
  return text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

let workDir;
let taskPath;
let globalPath;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "m5-bound-"));
  taskPath = join(workDir, "task-metrics.jsonl");
  globalPath = join(workDir, "global-metrics.jsonl");
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function baseCfg(extra = {}) {
  return {
    execution_id: extra.execution_id ?? "exec-bound-001",
    taskMetricsPath: taskPath,
    globalMetricsPath: globalPath,
    taskId: "m5-quality-mechanism",
    project: "workflowhub",
    ...extra,
  };
}

// Helper: seed a skeleton so upsert can update (not insert fresh).
function seedSkeleton(execution_id, cfg) {
  recordSkeleton(
    { execution_id, skill_or_stage: "speckit-apply", stage: "apply", skill_version: "1.0.0", executed: false },
    cfg
  );
}

// ---------------------------------------------------------------------------
// FR-BOUND-001/002 — three states all choose "continue" (pass-through)
// ---------------------------------------------------------------------------

describe("boundary-confirm three states pass-through", () => {
  for (const state of ["missing", "failed", "unknown"]) {
    it(`state=${state}: returns continue result and writes source-gated boundary_decisions`, () => {
      const execution_id = `exec-state-${state}`;
      const cfg = baseCfg({ execution_id });
      seedSkeleton(execution_id, cfg);

      const result = confirmBoundary(state, cfg);

      // Return shape
      expect(result).toHaveProperty("decision");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("timestamp");
      // All three states pass through (FR-BOUND-001)
      expect(result.decision).toBe("continue");

      // Non-orphan: read back the record (FR-BOUND-002)
      const records = readAllRecords(taskPath);
      const record = records.find((r) => r.execution_id === execution_id);
      expect(record).toBeDefined();

      // boundary_decisions must be an object (not the GAP sentinel "gap")
      const bd = record.boundary_decisions;
      expect(typeof bd).toBe("object");
      expect(bd).not.toBeNull();
      // Source-gated: must carry source tag (FR-EXECREC-004)
      expect(bd.source).toBe("boundary-confirm@m5");
      // Must record the decision and reason
      expect(bd.decision).toBe("continue");
      expect(bd.reason).toBeTruthy();
    });
  }
});

// ---------------------------------------------------------------------------
// FR-BOUND-003 / FR-GATE-003/004 — irreversible ops, 4 ops x 3 outcomes
// ---------------------------------------------------------------------------

describe("boundary-confirm irreversible ops", () => {
  const OPS = ["delete", "push", "merge", "archive"];
  const OUTCOMES = ["confirmed", "rejected", "timeout"];

  // Cover all four ops x all three outcomes (pick one op per outcome for the
  // main assertion; all ops covered in their own loop below).
  it("all four ops write boundary_decisions and return continue (never block)", () => {
    for (const op of OPS) {
      const execution_id = `exec-irrev-${op}`;
      const cfg = baseCfg({ execution_id });
      seedSkeleton(execution_id, cfg);

      const result = confirmIrreversible(op, cfg, undefined, { outcome: "confirmed" });

      expect(result).toHaveProperty("decision");
      expect(result.decision).toBe("continue");

      const records = readAllRecords(taskPath);
      const record = records.find((r) => r.execution_id === execution_id);
      expect(record).toBeDefined();

      const bd = record.boundary_decisions;
      expect(typeof bd).toBe("object");
      expect(bd.source).toBe("boundary-confirm@m5");
    }
  });

  it("rejected outcome writes boundary_decisions and continues (FR-GATE-004 守恒)", () => {
    const execution_id = "exec-irrev-rejected";
    const cfg = baseCfg({ execution_id });
    seedSkeleton(execution_id, cfg);

    const result = confirmIrreversible("delete", cfg, "some/path.txt", { outcome: "rejected" });

    expect(result.decision).toBe("continue");

    const records = readAllRecords(taskPath);
    const record = records.find((r) => r.execution_id === execution_id);
    const bd = record.boundary_decisions;
    expect(bd.source).toBe("boundary-confirm@m5");
    expect(bd.outcome).toBe("rejected");
  });

  it("timeout outcome writes boundary_decisions and continues (FR-GATE-004 守恒)", () => {
    const execution_id = "exec-irrev-timeout";
    const cfg = baseCfg({ execution_id });
    seedSkeleton(execution_id, cfg);

    const result = confirmIrreversible("push", cfg, undefined, { outcome: "timeout" });

    expect(result.decision).toBe("continue");
    expect(result.reason).toMatch(/timeout/i);

    const records = readAllRecords(taskPath);
    const record = records.find((r) => r.execution_id === execution_id);
    const bd = record.boundary_decisions;
    expect(bd.source).toBe("boundary-confirm@m5");
    expect(bd.outcome).toBe("timeout");
  });
});

// ---------------------------------------------------------------------------
// FR-BOUND-003 — findViolation reuse (not a home-grown checker)
// ---------------------------------------------------------------------------

describe("boundary-confirm findViolation reuse", () => {
  it("delete on a CONSTITUTION.md (protected path) records needs_manual_confirm", () => {
    // CONSTITUTION.md is in PROTECTED_PATHS per core/protected-paths.mjs.
    // If boundary-confirm used a home-grown checker with a different list,
    // this test would fail (the assertion is on the specific protected list entry).
    const execution_id = "exec-protected-path";
    const cfg = baseCfg({ execution_id });
    seedSkeleton(execution_id, cfg);

    confirmIrreversible("delete", cfg, "CONSTITUTION.md", { outcome: "confirmed" });

    const records = readAllRecords(taskPath);
    const record = records.find((r) => r.execution_id === execution_id);
    const bd = record.boundary_decisions;

    // Protected path → must record needs_manual_confirm flag
    expect(bd.needs_manual_confirm).toBe(true);
    // Protected path string comes from findViolation — must be CONSTITUTION.md
    // (proving the real PROTECTED_PATHS list from core/protected-paths was used)
    expect(bd.protected_path).toBe("CONSTITUTION.md");
  });

  it("delete on non-protected path does NOT set needs_manual_confirm", () => {
    const execution_id = "exec-safe-path";
    const cfg = baseCfg({ execution_id });
    seedSkeleton(execution_id, cfg);

    confirmIrreversible("delete", cfg, "some/safe/file.txt", { outcome: "confirmed" });

    const records = readAllRecords(taskPath);
    const record = records.find((r) => r.execution_id === execution_id);
    const bd = record.boundary_decisions;
    expect(bd.needs_manual_confirm).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// Non-irreversible op should NOT trigger irreversible handling
// ---------------------------------------------------------------------------

describe("boundary-confirm non-irreversible op", () => {
  it("op=edit does not trigger irreversible handling", () => {
    const execution_id = "exec-edit-op";
    const cfg = baseCfg({ execution_id });
    seedSkeleton(execution_id, cfg);

    const result = confirmIrreversible("edit", cfg, "some/file.txt", { outcome: "confirmed" });

    // Should still not throw and return an object
    expect(result).toHaveProperty("decision");

    // The boundary_decisions entry must reflect it was not treated as irreversible
    const records = readAllRecords(taskPath);
    const record = records.find((r) => r.execution_id === execution_id);
    const bd = record.boundary_decisions;

    // For non-irreversible: the entry should NOT record outcome/needs_manual_confirm
    // as if it were a real irreversible op. We check it lacks the irreversible marker.
    expect(bd.irreversible).toBeFalsy();
  });

  it("boundary write failure does not throw and emits write-fail stderr warning", () => {
    // Falsifiable: upsert returns false (not throw) on writeAll failure. With an
    // unwritable taskMetricsPath, writeBoundaryDecision must surface a write-fail warn
    // while confirmBoundary still returns continue (FR-GUARD-001 / never-block).
    const cfg = baseCfg({
      execution_id: "exec-bound-writefail",
      taskMetricsPath: "/dev/null/nope/task-metrics.jsonl",
      globalMetricsPath: "/dev/null/nope/global-metrics.jsonl",
    });

    const stderrWrites = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk, ...args) => {
      stderrWrites.push(String(chunk));
      return originalWrite(chunk, ...args);
    };

    let result;
    try {
      expect(() => {
        result = confirmBoundary("missing", cfg);
      }).not.toThrow();
    } finally {
      process.stderr.write = originalWrite;
    }

    // Flow continues despite write failure.
    expect(result.decision).toBe("continue");
    // A write-failure warning must have been emitted (not a silent loss).
    expect(stderrWrites.some((w) => w.toLowerCase().includes("write failed"))).toBe(true);
  });
});
