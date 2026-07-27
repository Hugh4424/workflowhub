import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import {
  buildRiskAcceptance,
  deriveSeriousReviewPause,
  validateRiskAcceptance,
  validateRiskAcceptanceSet,
} from "../core/stage-review-disposition.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFileSync(resolve(root, path), "utf8");
const constitution = read("CONSTITUTION.md");
const checklist = read("constitution-checklist.md");

function section(document, id, nextId) {
  const start = document.indexOf(`### ${id} `);
  const end = nextId ? document.indexOf(`### ${nextId} `, start + 1) : document.indexOf("\n## ", start + 1);
  expect(start, `${id} heading`).toBeGreaterThanOrEqual(0);
  expect(end, `${id} end`).toBeGreaterThan(start);
  return document.slice(start, end);
}

const clauses = {
  F3: section(constitution, "F3", "F4"),
  F4: section(constitution, "F4", "F5"),
  F7: section(constitution, "F7", "F8"),
  Q1: section(constitution, "Q1", "Q2"),
  Q2: section(constitution, "Q2", "Q3"),
};

describe("CONSTITUTION 1.3.0 serious-review exception", () => {
  it("keeps exactly 21 principles and changes only the five approved clauses", () => {
    expect(constitution).toMatch(/\*\*Version\*\*:\s*1\.3\.0\b/);
    expect([...constitution.matchAll(/^### (F\d+|Q\d+|S\d+) /gm)].map((match) => match[1])).toEqual([
      "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10",
      "Q1", "Q2", "Q3",
      "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
    ]);
    expect(constitution).toMatch(/F3\s*→\s*F3[\s\S]*F4\s*→\s*F4[\s\S]*F7\s*→\s*F7[\s\S]*Q1\s*→\s*Q1[\s\S]*Q2\s*→\s*Q2/);
    expect(constitution).toMatch(/其余\s*16\s*条不变/);
  });

  it("distinguishes structural publication facts, ordinary quality facts, and the narrow serious-review pause", () => {
    expect(clauses.F3).toMatch(/身份[\s\S]*顺序[\s\S]*(?:hash|哈希)[\s\S]*(?:阻止|不得)[\s\S]*成功发布/i);
    expect(clauses.F3).toMatch(/一般质量事实[\s\S]*(?:只记录|记录)/);
    expect(clauses.F3).toMatch(/actionable[\s\S]*(?:major|blocking)[\s\S]*(?:暂停|风险)/i);
    expect(clauses.F4).toMatch(/独立来源[\s\S]*(?:人工|人)[\s\S]*(?:窄例外|例外)/);
    expect(clauses.F4).toMatch(/minor[\s\S]*(?:只记录|不触发)/i);
    expect(clauses.Q1).toMatch(/一般质量事实[\s\S]*(?:只记录|不阻断)/);
    expect(clauses.Q1).toMatch(/actionable[\s\S]*(?:major|blocking)[\s\S]*(?:暂停|承担风险)/i);
  });

  it("preserves the three normal confirmations and makes build-spec/build-code pause only on serious findings", () => {
    for (const name of ["make-decision", "build-plan", "verify-code"]) {
      expect(clauses.F7).toContain(name);
    }
    expect(clauses.F7).toMatch(/build-spec[\s\S]*build-code[\s\S]*(?:正常|通常)[\s\S]*(?:自动|不确认)/i);
    expect(clauses.F7).toMatch(/actionable[\s\S]*(?:major|blocking)[\s\S]*(?:异常处置|暂停)/i);
    expect(clauses.Q2).toMatch(/入口校验[\s\S]*事实采集[\s\S]*人工确认/);
    expect(clauses.Q2).toMatch(/build-spec[\s\S]*build-code[\s\S]*(?:异常处置|暂停)/i);
    expect(clauses.Q2).toMatch(/minor[\s\S]*(?:只记录|不触发)/i);
  });

  it("records the approved sources before the narrow risk implementation", () => {
    expect(constitution).toMatch(/Stage 内容契约[\s\S]*accepted decision/i);
    expect(constitution).toMatch(/spec-clarify\s+Q1=A[\s\S]*Q2=A/i);
    expect(constitution).toMatch(/两份独立宪法审计/);
    expect(existsSync(resolve(root, "core/stage-review-disposition.mjs"))).toBe(true);
    expect(existsSync(resolve(root, "core/schemas/risk-acceptance.v1.json"))).toBe(true);
  });

  it("keeps the checklist synchronized at exactly 21 entries", () => {
    expect([...checklist.matchAll(/^- \[[ x]\] \*\*(F\d+|Q\d+|S\d+) /gm)]).toHaveLength(21);
    for (const id of ["F3", "F4", "F7", "Q1", "Q2"]) {
      expect(checklist).toMatch(new RegExp(`\\*\\*${id} [^*]+\\*\\*[^\\n]+(?:serious|严重|actionable|结构)`, "i"));
    }
    expect(checklist).toMatch(/\*\*条目数\*\*：21/);
  });
});

const hash = "a".repeat(64);
const tree = "b".repeat(40);
const serious = {
  version: "wh-review-result.v1",
  task_id: "task-one",
  stage: "build-spec",
  subject_kind: "worktree",
  phase_id: null,
  review_scope: null,
  snapshot_tree: tree,
  verdict: "revise_required",
  adjudication: {
    clusters: [{
      id: "F-123456789abc",
      severity: "major",
      disposition: "actionable",
      evidence_status: "direct",
      path: "core/example.mjs",
      issue: "The published contract can silently drop one required answer.",
      root_cause: "The field is not copied into canonical output.",
      recommendation: "Preserve every required answer before publication.",
      providers: ["fixture/reviewer"],
      adapter_count: 1,
      finding_count: 1,
      provider_findings: [{
        provider: "fixture/reviewer",
        adapter: "fixture",
        severity: "major",
        evidence_kind: "direct",
        evidence_anchor_valid: true,
      }],
    }],
  },
};

function pause(result = serious, stage = "build-spec") {
  return deriveSeriousReviewPause({
    taskId: "task-one",
    stage,
    reviewRef: "reviews/results/serious.json",
    reviewHash: hash,
    result: { ...result, stage },
    workflowRunId: "build-spec:run-1",
  });
}

describe("five-stage serious review pause", () => {
  it.each(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"])(
    "pauses %s only for actionable major/blocking findings",
    (stage) => {
      expect(pause(serious, stage)).toMatchObject({
        status: "paused",
        stage,
        findings: [expect.objectContaining({
          finding_id: "F-123456789abc",
          issue: expect.any(String),
          evidence: expect.any(String),
          consequences: expect.any(Array),
          impact_scope: ["core/example.mjs"],
          options: [
            expect.objectContaining({ id: "repair", recommended: true }),
            expect.objectContaining({ id: "accept-risk", recommended: false }),
          ],
        })],
      });
    },
  );

  it.each([
    ["minor", { severity: "minor" }],
    ["invalid anchor", { evidence_status: "invalid_anchor" }],
    ["not actionable", { disposition: "invalid_evidence" }],
  ])("does not turn %s into a risk override", (_label, patch) => {
    const result = structuredClone(serious);
    Object.assign(result.adjudication.clusters[0], patch);
    expect(pause(result)).toMatchObject({ status: "continue", findings: [] });
  });

  it.each(["unavailable", "timeout", "adapter_failure"])(
    "does not turn %s transport state into a semantic pass or risk override",
    (transportStatus) => {
      expect(deriveSeriousReviewPause({
        taskId: "task-one",
        stage: "build-spec",
        reviewAttempt: { status: transportStatus },
      })).toMatchObject({ status: "unavailable", findings: [] });
    },
  );
});

describe("risk acceptance binding", () => {
  const accepted = () => {
    const state = pause();
    const finding = state.findings[0];
    return {
      state,
      value: buildRiskAcceptance({
        pause: state,
        findingId: finding.finding_id,
        cardRef: "host-message://risk/card-1",
        cardHash: finding.card_hash,
        selectedOption: "accept-risk",
        replyRef: "host-message://risk/reply-1",
        replyHash: "c".repeat(64),
        acceptedAt: "2026-07-26T00:00:00.000Z",
      }),
    };
  };

  it("binds the exact serious finding, snapshot, card and reply without changing the verdict", () => {
    const { state, value } = accepted();
    expect(validateRiskAcceptance({ acceptance: value, pause: state })).toEqual(value);
    expect(serious.verdict).toBe("revise_required");
    const schema = JSON.parse(read("core/schemas/risk-acceptance.v1.json"));
    const validate = new Ajv2020({ strict: false }).compile(schema);
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
  });

  it("requires one independently bound acceptance for every serious finding", () => {
    const result = structuredClone(serious);
    result.adjudication.clusters.push({
      ...result.adjudication.clusters[0],
      id: "F-abcdefabcdef",
      path: "core/second.mjs",
      issue: "A second required answer can be silently dropped.",
    });
    const state = pause(result);
    const acceptanceFor = (finding, suffix) => buildRiskAcceptance({
      pause: state,
      findingId: finding.finding_id,
      cardRef: `host-message://risk/card-${suffix}`,
      cardHash: finding.card_hash,
      selectedOption: "accept-risk",
      replyRef: `host-message://risk/reply-${suffix}`,
      replyHash: suffix.repeat(64),
      acceptedAt: "2026-07-26T00:00:00.000Z",
    });
    const first = acceptanceFor(state.findings[0], "a");
    const second = acceptanceFor(state.findings[1], "b");

    expect(() => validateRiskAcceptanceSet({ acceptances: [first], pause: state }))
      .toThrow(/does not cover every serious finding/);
    expect(() => validateRiskAcceptanceSet({ acceptances: [first, first], pause: state }))
      .toThrow(/duplicate finding/);
    expect(validateRiskAcceptanceSet({ acceptances: [first, second], pause: state }))
      .toEqual([first, second]);
  });

  it.each([
    ["generic agreement", { selected_option: "agreed" }],
    ["other snapshot", { snapshot_tree: "d".repeat(40) }],
    ["other finding", { finding_id: "F-ffffffffffff" }],
    ["wrong review hash", { review_hash: "0".repeat(64) }],
    ["missing host reply", { reply_ref: "" }],
  ])("rejects %s", (_label, patch) => {
    const { state, value } = accepted();
    expect(() => validateRiskAcceptance({ acceptance: { ...value, ...patch }, pause: state })).toThrow();
  });

  it("keeps review risk and decision omission schemas mutually exclusive", () => {
    const { value } = accepted();
    const ajv = new Ajv2020({ strict: false });
    const risk = ajv.compile(JSON.parse(read("core/schemas/risk-acceptance.v1.json")));
    ajv.addSchema(JSON.parse(read("core/schemas/decision-entry.v1.json")), "decision-entry.v1");
    const omission = ajv.compile(JSON.parse(read("core/schemas/decision-omission-acceptance.v1.json")));
    expect(risk(value)).toBe(true);
    expect(omission(value)).toBe(false);
    const omissionValue = {
      source_item_ref: "source:item", source_item_hash: hash,
      coverage_audit_ref: "evidence/coverage.json", coverage_audit_hash: hash,
      omission_reason: "explicitly omitted", card_ref: "host-message://card", card_hash: hash,
      selected_option: "accept-omission", reply_ref: "host-message://reply", reply_hash: hash,
      decision_log_ref: "receipts/decision.md", decision_log_hash: hash,
      accepted_at: "2026-07-26T00:00:00.000Z",
      decision_entry: {
        question: "omit?", selected_option: "accept-omission", recommendation_status: "not_recommended",
        recommendation_reason: "coverage is better", plain_language_meaning: "this requirement stays uncovered",
        source_type: "original_requirement", source_exact_excerpt: "required item", approval_status: "approved",
        approval_ref: "host-message://reply", approval_hash: hash, facts_and_constraints: ["fact"],
        logic: "explicit choice", choice_reason: "accepted consequence", impact: ["coverage"],
        consequences: ["uncovered"], risks: ["missing behavior"],
        rejected_alternatives: [{ option: "cover it", reason: "user accepted the stated omission" }],
        unresolved: [], supersedes: [],
      },
    };
    expect(omission(omissionValue), JSON.stringify(omission.errors)).toBe(true);
    expect(risk(omissionValue)).toBe(false);
  });
});

describe("official serious-risk wiring", () => {
  it("keeps the risk writer exclusive to TaskKernel and exposes only the narrow CLI", () => {
    const kernel = read("core/task-kernel-implementation.mjs");
    const runtime = read("scripts/stage-runtime.mjs");
    const genericWriter = read("core/stage-content-evidence.mjs");
    expect(kernel).toMatch(/prepareReviewRiskPause[\s\S]*acceptReviewRisk/);
    expect(kernel).toMatch(/risk acceptance records require TaskKernel review-risk authority/);
    expect(runtime).toMatch(/review-risk-pause[\s\S]*accept-review-risk/);
    expect(runtime).toMatch(/selectedOption:\s*input\.selected_option[\s\S]*replyRef:\s*input\.reply_ref[\s\S]*replyHash:\s*input\.reply_hash/);
    expect(genericWriter).not.toMatch(/riskSchema|risk-acceptance\.v1/);
  });

  it("makes verify-code consume its own quality review instead of hiding it behind build-code review", () => {
    const handlers = read("core/stage-handlers.mjs");
    expect(handlers).toMatch(/quality_review[\s\S]*quality_risk_acceptance/);
    expect(handlers).toMatch(/reviewFacts\(worker,\s*input,\s*"quality_review",\s*undefined,\s*"verify-code"\)/);
    expect(handlers).toMatch(/verify-code quality review does not bind the current verification snapshot/);
  });

  it("documents the same narrow exception in all five Stage Skills without adding normal confirmations", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      const skill = read(`workflows/${stage}/SKILL.md`);
      expect(skill, stage).toMatch(/Serious review exception/);
      expect(skill, stage).toMatch(/actionable[\s\S]*major[\s\S]*blocking/);
      expect(skill, stage).toMatch(/repair first[\s\S]*accept risk and[\s\S]*continue/i);
      expect(skill, stage).toMatch(/does not change|never changes|preserves|keeps the original verdict/i);
    }
    expect(read("workflows/build-spec/SKILL.md")).toMatch(/no serious finding build-spec remains automatic/i);
    expect(read("workflows/build-code/SKILL.md")).toMatch(/Phase reviews still repair[\s\S]*until PASS/);
    expect(read("workflows/verify-code/SKILL.md")).toMatch(/quality review is a distinct official input/);
  });
});
