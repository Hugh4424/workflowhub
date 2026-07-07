/**
 * render-review-report.test.mjs — T012 (FR-WHREVIEW-004, AC4-1/AC4-2/AC4-3)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderReviewMarkdown, reportPathFor, writeReviewReport } from "../render-review-report.mjs";

const TASK_ID = "wh-review-rebuild-test";
const STAGE = "build-code";
const FLOW = "flow-abc123";

const BASE_FIELDS = {
  taskId: TASK_ID,
  reviewFlowId: FLOW,
  heterologousRound: 1,
  sameSourceRound: 0,
  mode: "full",
  actualMode: "full",
  contractPath: "skills/wh-review/contracts/build-code.md",
  contractHash: "sha256:deadbeef",
  timestamp: "2026-07-07T00:00:00Z",
};

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "render-review-report-test-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("renderReviewMarkdown (AC4-3: 6-chapter baseline)", () => {
  it("has exactly the 6 required chapter headings, in the required order", () => {
    const md = renderReviewMarkdown({ ...BASE_FIELDS, verdict: "pass", totalRound: 1, findings: [] });
    const headings = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings).toEqual(["Summary", "Blocking Issues", "Minor Issues", "Pass Items", "Delta", "Metadata"]);
  });

  it("Summary chapter contains verdict/total_round/mode", () => {
    const md = renderReviewMarkdown({ ...BASE_FIELDS, verdict: "revise_required", totalRound: 2, findings: [] });
    expect(md).toMatch(/verdict: revise_required/);
    expect(md).toMatch(/轮次 \(total_round\): 2/);
    expect(md).toMatch(/模式 \(mode\): full/);
  });

  it("Blocking Issues chapter lists blocking findings with their finding_fingerprint", () => {
    const finding = { severity: "blocking", file: "foo.js", line: 10, category: "cat1", issue: "bad thing" };
    const md = renderReviewMarkdown({ ...BASE_FIELDS, verdict: "revise_required", totalRound: 1, findings: [finding] });
    const blockingSection = md.split("## Blocking Issues")[1].split("## Minor Issues")[0];
    expect(blockingSection).toContain("foo.js:10");
    expect(blockingSection).toMatch(/\[[a-f0-9]{64}\]/);
  });

  it("Minor Issues chapter lists minor findings, excludes blocking", () => {
    const findings = [
      { severity: "blocking", file: "a.js", line: 1, category: "c1", issue: "x" },
      { severity: "minor", file: "b.js", line: 2, category: "c2", issue: "y" },
    ];
    const md = renderReviewMarkdown({ ...BASE_FIELDS, verdict: "revise_required", totalRound: 1, findings });
    const minorSection = md.split("## Minor Issues")[1].split("## Pass Items")[0];
    expect(minorSection).toContain("b.js:2");
    expect(minorSection).not.toContain("a.js:1");
  });

  it("Delta chapter is empty-marked at round 1, includes deltaSummary at round>=2", () => {
    const md1 = renderReviewMarkdown({ ...BASE_FIELDS, verdict: "pass", totalRound: 1, findings: [] });
    expect(md1.split("## Delta")[1].split("## Metadata")[0]).toMatch(/第1轮/);

    const md2 = renderReviewMarkdown({
      ...BASE_FIELDS, verdict: "pass", totalRound: 2, findings: [], deltaSummary: "fixed the foo bug",
    });
    expect(md2.split("## Delta")[1].split("## Metadata")[0]).toContain("fixed the foo bug");
  });

  it("Metadata chapter contains all required fields", () => {
    const md = renderReviewMarkdown({ ...BASE_FIELDS, verdict: "pass", totalRound: 3, findings: [] });
    const metaSection = md.split("## Metadata")[1];
    expect(metaSection).toContain(`task-name: ${TASK_ID}`);
    expect(metaSection).toContain(`review_flow_id: ${FLOW}`);
    expect(metaSection).toContain("heterologous_round: 1");
    expect(metaSection).toContain("same_source_round: 0");
    expect(metaSection).toContain("total_round: 3");
    expect(metaSection).toContain("mode: full");
    expect(metaSection).toContain("actual_mode: full");
    expect(metaSection).toContain("contract_path: skills/wh-review/contracts/build-code.md");
    expect(metaSection).toContain("contract_hash: sha256:deadbeef");
    expect(metaSection).toContain("timestamp: 2026-07-07T00:00:00Z");
  });

  it("fails loud on an unknown verdict value (AC4-1)", () => {
    expect(() => renderReviewMarkdown({ ...BASE_FIELDS, verdict: "maybe", totalRound: 1, findings: [] })).toThrow(
      /pass\/revise_required\/escalate_to_human/
    );
  });
});

describe("reportPathFor (AC4-2: fixed path rule, verdict->suffix mapping)", () => {
  it("maps pass/revise_required/escalate_to_human to distinct, non-overlapping suffixes", () => {
    const pass = reportPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 3, verdict: "pass" });
    const revise = reportPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 2, verdict: "revise_required" });
    const escalated = reportPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 4, verdict: "escalate_to_human" });
    expect(pass).toBe(join(root, "tasks", TASK_ID, "reports", `${STAGE}--${FLOW}--3-pass.md`));
    expect(revise).toBe(join(root, "tasks", TASK_ID, "reports", `${STAGE}--${FLOW}--2-revise.md`));
    expect(escalated).toBe(join(root, "tasks", TASK_ID, "reports", `${STAGE}--${FLOW}--4-escalated.md`));
    const suffixes = new Set([pass, revise, escalated].map((p) => p.split("-").pop()));
    expect(suffixes.size).toBe(3);
  });

  it("the same fixed join rule holds across different stages/rounds", () => {
    const p1 = reportPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: "build-spec", reviewFlowId: FLOW, totalRound: 1, verdict: "pass" });
    const p2 = reportPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: "verify-code", reviewFlowId: "flow-xyz", totalRound: 5, verdict: "pass" });
    expect(p1.startsWith(join(root, "tasks", TASK_ID, "reports"))).toBe(true);
    expect(p2.startsWith(join(root, "tasks", TASK_ID, "reports"))).toBe(true);
  });

  it("fails loud on an unknown verdict", () => {
    expect(() =>
      reportPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, verdict: "nope" })
    ).toThrow();
  });
});

describe("writeReviewReport (end-to-end)", () => {
  it("writes the rendered markdown to the AC4-2 path and returns it", () => {
    const { path, markdown } = writeReviewReport({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root,
      ...BASE_FIELDS, verdict: "pass", findings: [],
    });
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toBe(markdown);
    expect(path).toBe(join(root, "tasks", TASK_ID, "reports", `${STAGE}--${FLOW}--1-pass.md`));
  });
});
