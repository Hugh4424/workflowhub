// ORACLE-P6-GATE-COVERAGE
// Gate coverage reports four sets and their differences by name: declared,
// readable, captured, and closed-over Phases. A count alone is not coverage, and
// a non-empty difference is never a failing gate.
import { describe, it, expect } from "vitest";
import { readDeliveryClaims } from "../../runtime/task/delivery-claims.mjs";

const T4 = process.env.P6_T4_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-code-20261124";

describe("declared gate coverage on the task-4 material", () => {
  const claims = readDeliveryClaims({ taskPath: T4 });
  const coverage = claims.gate_coverage;

  it("counts 18 declarations = 13 phase-level + 5 task-level, 15 readable", () => {
    expect(coverage.declared_total).toBe(18);
    expect(coverage.phase_level).toBe(13);
    expect(coverage.task_level).toBe(5);
    expect(coverage.readable).toBe(15);
    expect(coverage.coverage_denominator).toBe(13);
  });

  it("names the three unreadable declarations with their path:line", () => {
    expect(coverage.unreadable).toHaveLength(3);
    expect(coverage.unreadable.map((item) => `${item.line}:${item.reason}`).sort()).toEqual([
      "1114:not-backticked", "920:not-backticked", "928:not-backticked",
    ]);
    for (const item of coverage.unreadable) expect(item.phase_ref).toMatch(/^phases\/P\d+-.*\.md$/);
  });

  it("reports 114 captures, 100 unbound and the two bound Phases", () => {
    expect(coverage.captured).toBe(114);
    expect(coverage.unbound).toBe(100);
    expect(coverage.by_phase).toEqual({ P5: 12, P7: 2 });
  });

  it("names every uncovered Phase instead of only counting them", () => {
    expect(Array.isArray(coverage.uncovered)).toBe(true);
    expect(coverage.uncovered).toHaveLength(11);
    expect(coverage.uncovered).toEqual(["P1", "P2", "P3", "P4", "P6", "P8", "P9", "P10", "P11", "P12", "P13"]);
    for (const id of coverage.uncovered) expect(id).toMatch(/^P[0-9]+$/);
  });

  it("keeps orphan and unbound as two disjoint, defined sets", () => {
    expect(coverage.orphan).toEqual([]);
    expect(coverage.definitions.orphan).toMatch(/declared/i);
    expect(coverage.definitions.unbound).toMatch(/gate_identity|null/i);
    // They never overlap: a null identity is unbound, never orphan.
    expect(coverage.orphan.length + coverage.unbound).toBeLessThanOrEqual(coverage.captured);
  });

  it("marks the placeholder gate unexecutable and names the selected Phase gate", () => {
    expect(coverage.unexecutable).toHaveLength(1);
    expect(coverage.unexecutable[0].phase_id).toBe("P9");
    expect(coverage.unexecutable[0].line).toBe(776);
    expect(coverage.unexecutable[0].reason).toBe("unsubstituted-placeholder");
    expect(coverage.unexecutable[0].gate_cmd).toContain("<任务根>");
    expect(coverage.selected.ref).toBe("quality/evidence/gate-results/2026-11-26-002-build-code-p7.json");
    expect(coverage.selected.phase_id).toBe("P7");
    expect(coverage.selected.exit_code).toBe(0);
  });
});
