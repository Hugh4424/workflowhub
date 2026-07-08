/**
 * report-index.test.mjs — T014 (data-contracts.md Contract 5, spec.md ¶156)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendReportIndexRow, readReportIndexRows, reportIndexPathFor } from "../report-index.mjs";

const TASK_ID = "wh-review-rebuild-test";

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "report-index-test-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("appendReportIndexRow", () => {
  it("creates the index with a header + one row on first call", () => {
    const { path, seq } = appendReportIndexRow({
      taskId: TASK_ID, stage: "build-code", reportKind: "review", verdict: "revise_required",
      reportPath: "tasks/x/reports/build-code--flow1--1-revise.md", summary: "first pass",
      timestamp: "2026-07-07T00:00:00Z", taskTrackingRoot: root,
    });
    expect(path).toBe(reportIndexPathFor({ taskTrackingRoot: root, taskId: TASK_ID }));
    expect(existsSync(path)).toBe(true);
    expect(seq).toBe(1);
    const content = readFileSync(path, "utf8");
    expect(content).toContain("| seq | timestamp | stage | report_kind | verdict | report_path | summary |");
    expect(content).toContain("build-code--flow1--1-revise.md");
  });

  it("appends subsequent rows below existing rows, never overwriting history", () => {
    appendReportIndexRow({
      taskId: TASK_ID, stage: "build-code", reportKind: "review", verdict: "revise_required",
      reportPath: "r1.md", summary: "round1", timestamp: "t1", taskTrackingRoot: root,
    });
    appendReportIndexRow({
      taskId: TASK_ID, stage: "build-code", reportKind: "review", verdict: "pass",
      reportPath: "r2.md", summary: "round2", timestamp: "t2", taskTrackingRoot: root,
    });
    const rows = readReportIndexRows({ taskId: TASK_ID, taskTrackingRoot: root });
    expect(rows.length).toBe(2);
    expect(rows[0]).toContain("r1.md");
    expect(rows[1]).toContain("r2.md");
  });

  it("auto-increments seq across appends unless explicitly supplied", () => {
    const first = appendReportIndexRow({
      taskId: TASK_ID, stage: "build-code", reportKind: "review", verdict: "revise_required",
      reportPath: "r1.md", summary: "s1", timestamp: "t1", taskTrackingRoot: root,
    });
    const second = appendReportIndexRow({
      taskId: TASK_ID, stage: "build-code", reportKind: "review", verdict: "pass",
      reportPath: "r2.md", summary: "s2", timestamp: "t2", taskTrackingRoot: root,
    });
    expect(first.seq).toBe(1);
    expect(second.seq).toBe(2);
  });

  it("inserts a newline before appending when the existing index file has no trailing newline (regression: appendFileSync used to glue the new row onto the previous line, corrupting the table)", () => {
    const path = reportIndexPathFor({ taskTrackingRoot: root, taskId: TASK_ID });
    mkdirSync(join(root, "tasks", TASK_ID, "reports"), { recursive: true });
    const headerNoTrailingNewline =
      "| seq | timestamp | stage | report_kind | verdict | report_path | summary |\n" +
      "|---|---|---|---|---|---|---|\n" +
      "| 1 | t1 | build-code | review | revise_required | r1.md | s1 |"; // no trailing \n
    writeFileSync(path, headerNoTrailingNewline);

    appendReportIndexRow({
      taskId: TASK_ID, stage: "build-code", reportKind: "review", verdict: "pass",
      reportPath: "r2.md", summary: "s2", timestamp: "t2", taskTrackingRoot: root,
    });

    const content = readFileSync(path, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().startsWith("|"));
    expect(lines).toHaveLength(4); // header + separator + row1 + row2, never glued together
    expect(lines[2]).toContain("r1.md");
    expect(lines[2]).not.toContain("r2.md");
    expect(lines[3]).toContain("r2.md");
  });

  it("fails loud when required fields are missing", () => {
    expect(() =>
      appendReportIndexRow({ taskId: TASK_ID, stage: "build-code", reportKind: "review", verdict: "pass", reportPath: undefined, summary: "x", taskTrackingRoot: root })
    ).toThrow(/requires stage\/reportKind\/verdict\/reportPath/);
  });
});

describe("readReportIndexRows", () => {
  it("returns an empty array before any row has been written", () => {
    expect(readReportIndexRows({ taskId: TASK_ID, taskTrackingRoot: root })).toEqual([]);
  });
});
