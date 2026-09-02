import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildRiskAcceptance,
  canonicalReviewFindings,
  deriveSeriousReviewPause,
  validateRiskAcceptance,
  validateRiskAcceptanceSet,
} from "../runtime/review/stage-review-disposition.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFileSync(resolve(root, path), "utf8");
const constitution = read("CONSTITUTION.md");
const checklist = read("constitution-checklist.md");

const REVIEW_HASH = "a".repeat(64);
const SNAPSHOT_TREE = "b".repeat(40);

function pausedReview() {
  return deriveSeriousReviewPause({
    taskId: "demo",
    stage: "build-code",
    reviewRef: "reviews/results/quality.json",
    reviewHash: REVIEW_HASH,
    workflowRunId: "run-0001",
    result: {
      task_id: "demo",
      stage: "build-code",
      snapshot_tree: SNAPSHOT_TREE,
      verdict: "revise_required",
      adjudication: {
        clusters: [
          {
            id: "F-123456789abc",
            severity: "major",
            path: "core/demo.mjs",
            line: 1,
            issue: "first serious issue",
            root_cause: "fixture root cause",
            recommendation: "repair it",
            providers: ["fixture"],
            disposition: "actionable",
            evidence_status: "direct",
          },
          {
            id: "F-def012345678",
            severity: "blocking",
            path: "core/demo.mjs",
            line: 2,
            issue: "second serious issue",
            root_cause: "fixture root cause",
            recommendation: "repair it",
            providers: ["fixture"],
            disposition: "actionable",
            evidence_status: "direct",
          },
        ],
      },
    },
  });
}

function acceptance(pause, findingId = pause.findings[0].finding_id) {
  const finding = pause.findings.find(({ finding_id: id }) => id === findingId);
  return buildRiskAcceptance({
    pause,
    findingId,
    cardRef: `quality/evidence/risk-cards/${finding.card_hash}.json`,
    cardHash: finding.card_hash,
    selectedOption: "accept-risk",
    replyRef: `quality/evidence/risk-replies/${"c".repeat(64)}.json`,
    replyHash: "c".repeat(64),
    acceptedAt: "2026-08-02T00:00:00.000Z",
  });
}

function section(document, id, nextId) {
  const start = document.indexOf(`### ${id} `);
  const end = nextId ? document.indexOf(`### ${nextId} `, start + 1) : document.indexOf("\n## ", start + 1);
  expect(start, `${id} heading`).toBeGreaterThanOrEqual(0);
  expect(end, `${id} end`).toBeGreaterThan(start);
  return document.slice(start, end);
}

describe("current quality boundary", () => {
  it("uses canonical reportable findings instead of non-adopted adjudication clusters", () => {
    const result = {
      task_id: "demo",
      stage: "build-code",
      snapshot_tree: SNAPSHOT_TREE,
      verdict: "pass",
      findings: [{
        id: "F-123456789abc",
        severity: "minor",
        path: "core/demo.mjs",
        issue: "reportable minor",
        root_cause: "canonical result",
        recommendation: "retain",
        disposition: "nonblocking_minor",
        evidence_status: "minor",
      }],
      adjudication: { clusters: [{
        id: "F-def012345678",
        severity: "blocking",
        path: "core/old.mjs",
        issue: "non-adopted provider disagreement",
        root_cause: "provider disagreement",
        recommendation: "do not adopt",
        disposition: "actionable",
        evidence_status: "direct",
      }] },
    };
    expect(canonicalReviewFindings(result).map(({ id }) => id)).toEqual(["F-123456789abc"]);
    expect(deriveSeriousReviewPause({
      taskId: "demo",
      stage: "build-code",
      reviewRef: "quality/reviews/results/demo.json",
      reviewHash: REVIEW_HASH,
      result,
      workflowRunId: "run-0001",
    }).status).toBe("continue");
  });

  it("does not turn non-reportable clusters into findings when findings is explicitly empty", () => {
    const result = {
      task_id: "demo",
      stage: "build-code",
      snapshot_tree: SNAPSHOT_TREE,
      findings: [],
      adjudication: {
        clusters: [{
          id: "F-needs-corroboration",
          severity: "major",
          path: "core/demo.mjs",
          issue: "unconfirmed provider inference",
          root_cause: "insufficient corroboration",
          recommendation: "keep as provenance",
          disposition: "needs_corroboration",
          evidence_status: "inferred",
        }],
      },
    };
    expect(canonicalReviewFindings(result)).toEqual([]);
    expect(deriveSeriousReviewPause({
      taskId: "demo",
      stage: "build-code",
      reviewRef: "quality/reviews/results/demo.json",
      reviewHash: REVIEW_HASH,
      result,
      workflowRunId: "run-0001",
    })).toMatchObject({ status: "continue", findings: [] });
  });

  it("keeps the 22-clause constitution and its checklist synchronized", () => {
    expect(constitution).toMatch(/Version:\s*1\.7\.0\b/);
    expect([...constitution.matchAll(/^### (F\d+|Q\d+|S\d+) /gm)]).toHaveLength(22);
    expect([...checklist.matchAll(/^- \[[ x]\] \*\*(F\d+|Q\d+|S\d+) /gm)]).toHaveLength(22);
    expect(checklist).toMatch(/\*\*条目数\*\*：22/);
  });

  it("separates ordinary progress, structurally authentic publication, and fail-closed completion", () => {
    const f3 = section(constitution, "F3", "F4");
    const q1 = section(constitution, "Q1", "Q2");
    const q2 = section(constitution, "Q2", "Q3");
    expect(f3).toMatch(/四材料/);
    expect(f3).toMatch(/不是推进许可证/);
    expect(f3).toMatch(/fail-loud/);
    expect(q1).toMatch(/不作为开始或继续修复的许可证/);
    expect(q1).toMatch(/不得宣称完成/);
    expect(q2).toMatch(/独立审查事实和人类交接共同证明/);
  });

  it("keeps verify-code completion bound to current AC, test, and independent-review facts", () => {
    const verifyCode = read("workflows/verify-code/SKILL.md");
    const verifySteps = JSON.parse(read("workflows/verify-code/steps.json")).steps;
    const reviewSteps = verifySteps.filter(({ step_slug }) => step_slug === "run-one-independent-code-review");

    expect(reviewSteps).toHaveLength(1);
    expect(reviewSteps[0].observable_result).toMatch(/异源|independent/i);
    expect(verifyCode).toMatch(/不重新检查其完整性/);
    expect(verifyCode).toMatch(/不列 AC 逐条结论/);
    expect(verifyCode).not.toMatch(/语义反向检查/);
    expect(verifyCode).toMatch(/unavailable[\s\S]{0,120}(?:绝不是|不能算)[\s\S]{0,30}pass/i);
    expect(verifyCode).toMatch(/不为了 verify-code 重跑全量测试/i);
  });
});

describe("risk acceptance behavior", () => {
  it("rejects a non-risk option", () => {
    const pause = pausedReview();
    const finding = pause.findings[0];
    expect(() => buildRiskAcceptance({
      pause,
      findingId: finding.finding_id,
      cardRef: `quality/evidence/risk-cards/${finding.card_hash}.json`,
      cardHash: finding.card_hash,
      selectedOption: "repair",
      replyRef: `quality/evidence/risk-replies/${"c".repeat(64)}.json`,
      replyHash: "c".repeat(64),
      acceptedAt: "2026-08-02T00:00:00.000Z",
    })).toThrow(/exact accept-risk option/i);
  });

  it("rejects acceptance bound to another snapshot", () => {
    const pause = pausedReview();
    const value = { ...acceptance(pause), snapshot_tree: "d".repeat(40) };
    expect(() => validateRiskAcceptance({ acceptance: value, pause })).toThrow(/exact finding.*snapshot/i);
  });

  it("rejects duplicate finding acceptance", () => {
    const pause = pausedReview();
    const value = acceptance(pause);
    expect(() => validateRiskAcceptanceSet({ acceptances: [value, value], pause })).toThrow(/duplicate finding/i);
  });

  it("rejects a partial set of serious finding acceptances", () => {
    const pause = pausedReview();
    expect(() => validateRiskAcceptanceSet({ acceptances: [acceptance(pause)], pause })).toThrow(/does not cover every serious finding/i);
  });
});
