/**
 * baseline.test.mjs — M4 Phase 4 (T016-T019).
 * Baseline field definitions computed from the archived AgentHub M1-M3 task set
 * (FR-BASELINE-001/002, decision-log D12). The original five task-level process
 * metrics are DERIVED projections of the per-skill/stage core fields, not separately
 * collected (D3). Cross-system (agenthub→workflowhub) fields that cannot be computed
 * are honestly marked as a structured gap {status,reason,what_missing,could_derive_if}
 * — never fabricated, never zero-filled, and the source task set must be recorded.
 * Plus the skill-version-bump rule doc (T018, D13).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  DERIVED_METRICS,
  computeBaselineField,
  makeGap,
  assembleBaseline,
} from "../metrics/baseline.mjs";

describe("T016/T017 derived metrics + baseline computation", () => {
  it("DERIVED_METRICS names the five task-level process metrics", () => {
    expect(DERIVED_METRICS).toEqual([
      "missed_step_rate",
      "test_execution_rate",
      "review_execution_rate",
      "rework_rounds",
      "defect_count",
    ]);
  });

  it("a computable field yields a numeric value", () => {
    // rework_rounds derives from the core field rework_rounds across the source set
    const field = computeBaselineField("rework_rounds", {
      sourceRecords: [{ rework_rounds: 1 }, { rework_rounds: 3 }],
    });
    expect(field.status).toBe("real");
    expect(typeof field.value).toBe("number");
    expect(field.value).toBe(2); // mean
  });

  it("an uncomputable field yields a structured gap, never a fabricated number", () => {
    // skill_version was absent in archived agenthub records → cannot compute
    const field = computeBaselineField("test_execution_rate", { sourceRecords: [] });
    expect(field.status).toBe("gap");
    expect(typeof field.reason).toBe("string");
    expect(typeof field.what_missing).toBe("string");
    expect(typeof field.could_derive_if).toBe("string");
    expect("value" in field).toBe(false); // no fake number, no zero-fill
  });

  it("makeGap rejects zero-filling a missing value", () => {
    const gap = makeGap("no source field", "executed flag", "collector emits executed");
    expect(gap.status).toBe("gap");
    expect(gap.value).toBeUndefined();
  });
});

describe("T016 FR-BASELINE-002 source task set + limitation, no fabrication", () => {
  it("assembleBaseline records the source task set", () => {
    const baseline = assembleBaseline({
      sourceTasks: ["m1-scaffold", "m2-microkernel", "m3-narrow-contract"],
      records: [{ rework_rounds: 2 }],
    });
    expect(baseline.source_tasks).toEqual([
      "m1-scaffold",
      "m2-microkernel",
      "m3-narrow-contract",
    ]);
    expect(typeof baseline.limitation).toBe("string"); // quasi-experiment caveat
    expect(baseline.limitation.length).toBeGreaterThan(0);
  });

  it("assembleBaseline throws when no source task set is recorded", () => {
    expect(() => assembleBaseline({ sourceTasks: [], records: [] })).toThrow();
    expect(() => assembleBaseline({ records: [] })).toThrow();
  });

  it("each baseline field is either real-with-number or a structured gap", () => {
    const baseline = assembleBaseline({
      sourceTasks: ["m1-scaffold"],
      records: [{ rework_rounds: 4 }],
    });
    for (const name of DERIVED_METRICS) {
      const f = baseline.fields[name];
      expect(f).toBeTruthy();
      if (f.status === "real") {
        expect(typeof f.value).toBe("number");
      } else {
        expect(f.status).toBe("gap");
        expect("value" in f).toBe(false);
      }
    }
  });
});

describe("T018 FR-VERSION-001/002 skill-version-bump rule doc", () => {
  const docPath = join(import.meta.dirname, "..", "docs", "skill-version-bump.md");
  const doc = () => readFileSync(docPath, "utf8");

  it("declares the public API as the skill manifest", () => {
    expect(doc()).toMatch(/manifest/i);
  });

  it("defines major / minor / patch bump rules", () => {
    const d = doc();
    expect(d).toMatch(/major/i);
    expect(d).toMatch(/minor/i);
    expect(d).toMatch(/patch/i);
  });

  it("covers pre-1.0 (0.x.x) handling and a changelog", () => {
    const d = doc();
    expect(d).toMatch(/0\.x\.x|pre-1\.0|0\.\d/i);
    expect(d).toMatch(/changelog|change note|变更/i);
  });
});

// ── Round-2 review fix ────────────────────────────────────────────────────
// B1 (corrected): FR-BASELINE-001 / D2/D3 require ALL FIVE task-level metrics to be
//     DERIVABLE projections of the per-skill/stage core fields. No metric may be a
//     definitionally-permanent gap — every derivation must bind to a real CORE_FIELDS
//     name, and a gap is produced ONLY when the archived records lack that core field
//     (FR-BASELINE-002 cross-system data, not because the metric has no derivation).
// B2: the baseline source set must be the approved archived M1-M3 identifiers; an
//     arbitrary sourceTasks array must be rejected, not mislabeled as "computed from M1-M3".
import { CORE_FIELDS } from "../metrics/record-schema.mjs";
import { APPROVED_BASELINE_SOURCES, DERIVATION_SOURCE } from "../metrics/baseline.mjs";

describe("Round-2 review fix B1: ALL FIVE metrics derive from real CORE_FIELDS", () => {
  const coreNames = new Set(CORE_FIELDS.map((f) => f.name));

  it("EVERY derivation binds to a real core field — none is a permanent gap", () => {
    for (const name of DERIVED_METRICS) {
      const src = DERIVATION_SOURCE[name];
      expect(src).toBeTruthy();
      expect(src.coreField, `${name} must bind to a real core field, not null`).not.toBeNull();
      expect(coreNames.has(src.coreField), `${name} binds to non-core field ${src.coreField}`).toBe(true);
    }
  });

  it("test_execution_rate IS derivable when test-kind core rows are present", () => {
    // A valid CORE_FIELDS record tagged as a test row must yield a numeric rate, NOT a gap.
    const testRow = {};
    for (const f of CORE_FIELDS) testRow[f.name] = "x";
    testRow.skill_or_stage = "superpowers-test-driven-development";
    testRow.executed = true;
    const field = computeBaselineField("test_execution_rate", { sourceRecords: [testRow] });
    expect(field.status).toBe("real");
    expect(typeof field.value).toBe("number");
  });

  it("review_execution_rate IS derivable when review-kind core rows are present", () => {
    const reviewRow = {};
    for (const f of CORE_FIELDS) reviewRow[f.name] = "x";
    reviewRow.stage = "code-review";
    reviewRow.executed = true;
    const field = computeBaselineField("review_execution_rate", { sourceRecords: [reviewRow] });
    expect(field.status).toBe("real");
    expect(typeof field.value).toBe("number");
  });

  it("defect_count IS derivable from rework_rounds across valid records", () => {
    const record = {};
    for (const f of CORE_FIELDS) record[f.name] = f.name === "rework_rounds" ? 3 : "x";
    const field = computeBaselineField("defect_count", { sourceRecords: [record] });
    expect(field.status).toBe("real");
    expect(field.value).toBe(3);
  });

  it("a metric gaps ONLY when its backing core field is absent (not by definition)", () => {
    // records lacking the backing core field → honest gap (FR-BASELINE-002 cross-system)
    const field = computeBaselineField("missed_step_rate", {
      sourceRecords: [{ rework_rounds: 1 }], // no `executed` field
    });
    expect(field.status).toBe("gap");
    expect("value" in field).toBe(false);
  });

  it("metrics backed by real core fields compute from a valid CORE_FIELDS record", () => {
    const record = {};
    for (const f of CORE_FIELDS) record[f.name] = f.name === "rework_rounds" ? 2 : f.name === "executed" ? true : "x";
    const rework = computeBaselineField("rework_rounds", { sourceRecords: [record] });
    expect(rework.status).toBe("real");
    expect(typeof rework.value).toBe("number");
  });
});

describe("Round-1 review fix B2: source set must be approved archived M1-M3", () => {
  it("APPROVED_BASELINE_SOURCES names the archived M1-M3 tasks", () => {
    expect(APPROVED_BASELINE_SOURCES).toContain("m1-scaffold");
    expect(APPROVED_BASELINE_SOURCES).toContain("m2-microkernel");
    expect(APPROVED_BASELINE_SOURCES).toContain("m3-narrow-contract");
  });

  it("assembleBaseline rejects an arbitrary (non-approved) source set", () => {
    expect(() =>
      assembleBaseline({ sourceTasks: ["some-random-task"], records: [] })
    ).toThrow();
  });

  it("assembleBaseline accepts a subset of the approved M1-M3 sources", () => {
    const baseline = assembleBaseline({
      sourceTasks: ["m1-scaffold", "m2-microkernel"],
      records: [{ rework_rounds: 2 }],
    });
    expect(baseline.source_tasks).toEqual(["m1-scaffold", "m2-microkernel"]);
  });
});
