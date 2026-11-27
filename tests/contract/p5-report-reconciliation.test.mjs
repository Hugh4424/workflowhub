// ORACLE-P6-DELIVERY-READSIDE (report half)
// The final report is a reconciliation object, never a baseline: it states its
// own total, the sum of its parts and the difference, and names the two
// statuses that disagree with the card status. Its reference comes from the
// closeout step evidence only — never a directory scan.
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as claims from "../../runtime/task/delivery-claims.mjs";
import { acCardStatuses } from "../../runtime/stage/stage-content-contracts.mjs";
import { phaseFilesFromIndex } from "../../runtime/task/material-workspace.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const materialRoot = join(repoRoot, "specs/archive/delivery-quality-code-20261124");
const T4 = process.env.P6_T4_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-code-20261124";

function loadStatus() {
  const spec = readFileSync(join(materialRoot, "spec.md"), "utf8");
  const index = readFileSync(join(materialRoot, "phases/index.md"), "utf8");
  const phases = {};
  for (const ref of phaseFilesFromIndex(index)) phases[ref] = readFileSync(join(materialRoot, ref), "utf8");
  return acCardStatuses({ spec, phases });
}

function tempTask(steps) {
  const root = mkdtempSync(join(tmpdir(), "p6-report-"));
  mkdirSync(join(root, "quality", "evidence", "step-evidence"), { recursive: true });
  for (const [name, body] of Object.entries(steps)) {
    writeFileSync(join(root, "quality", "evidence", "step-evidence", name), JSON.stringify(body));
  }
  return root;
}

describe("report reconciliation exports", () => {
  it("exports the four single-source readers", () => {
    expect(typeof claims.reportReconciliation).toBe("function");
    expect(typeof claims.deliveryCommit).toBe("function");
    expect(typeof claims.evidenceReuseKey).toBe("function");
    expect(typeof claims.declaredGateCoverage).toBe("function");
  });
});

describe("task-4 report reconciliation", () => {
  it("reports declared 78, parts 76, diff 2, and names both mismatched statuses", () => {
    const report = claims.reportReconciliation({ taskPath: T4, acStatus: loadStatus() });
    expect(report.declared_total).toBe(78);
    expect(report.parts_sum).toBe(76);
    expect(report.diff).toBe(2);
    expect(report.status_counts).toEqual({ pass: 62, incomplete: 10, partial: 2, inconclusive: 1, unavailable: 1 });
    expect(report.status_mismatches).toEqual([
      { status: "pass", report: 62, card: 61 },
      { status: "incomplete", report: 10, card: 11 },
    ]);
    expect(report.consistent).toBe(false);
    expect(report.source).toBe("summary-line");
    expect(report.ref).toMatch(/quality\/evidence\/build-code\/final-report\.md$/);
    expect(report.sha256).toBe(createHash("sha256").update(readFileSync(join(T4, report.ref))).digest("hex"));
    // The two non-pass tallies differ for a known reason; they are a coverage
    // limit, never a pass condition.
    expect(report.non_pass_rows).toBe(13);
    expect(report.reported_non_pass).toBe(14);
    expect(report.coverage_limits.length).toBeGreaterThan(0);
  });
});

describe("report reference resolution", () => {
  it("does not fall back to a directory scan when no closeout evidence declares it", () => {
    const root = tempTask({});
    try {
      const report = claims.reportReconciliation({ taskPath: root, acStatus: null });
      expect(report.source).toBe("unknown");
      expect(report.reason).toBe("no-closeout-step-evidence");
      expect(report.declared_total).toBeNull();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("refuses to pick one when several closeout inputs name different paths", () => {
    const root = tempTask({
      "build-code-12-closeout.json": { step_slug: "closeout", inputs: ["quality/evidence/build-code/a.md"] },
      "build-code-3-implement-change.json": { step_slug: "closeout", inputs: ["quality/evidence/build-code/b.md"] },
    });
    try {
      const report = claims.reportReconciliation({ taskPath: root, acStatus: null });
      expect(report.source).toBe("unknown");
      expect(report.reason).toBe("ambiguous-closeout-inputs");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("reads the machine-verifiable json section when the report carries one", () => {
    const bytes = Buffer.from([
      "# 终末报告",
      "```json",
      JSON.stringify({ declared_total: 8, status_counts: { pass: 6, incomplete: 2 }, non_pass_rows: 2, reported_non_pass: 2 }),
      "```",
      "",
    ].join("\n"), "utf8");
    const report = claims.reportReconciliation({ reportBytes: bytes, acStatus: { total_declared: 8, counts: { pass: 6, incomplete: 2 } } });
    expect(report.source).toBe("json-section");
    expect(report.declared_total).toBe(8);
    expect(report.parts_sum).toBe(8);
    expect(report.diff).toBe(0);
    expect(report.consistent).toBe(true);
  });

  it("keeps an unreadable summary line as a named unknown, not a pass", () => {
    const bytes = Buffer.from("78 条判据中：全部完成。\n", "utf8");
    const report = claims.reportReconciliation({ reportBytes: bytes, acStatus: null });
    expect(report.source).toBe("unknown");
    expect(report.reason).toBe("summary-line-not-found");
    expect(report.consistent).toBe(false);
  });
});
