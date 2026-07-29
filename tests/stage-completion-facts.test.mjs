import { describe, expect, it } from "vitest";
import {
  assertCompletionViewsConsistent,
  createStageCompletionFacts,
  renderSystemCompletion,
  renderUserCompletion,
} from "../core/stage-completion-facts.mjs";

const HASH = "a".repeat(64);
const SOURCE_KEYS = [
  "FG2-02", "FG2-04", "FG2-05", "FG2-11", "FG2-14", "FG2-16", "FG2-26", "FG2-28", "FG2-30",
  "MD-D1", "MD-D2", "MD-D3", "MD-D4", "MD-D5", "MD-NG1", "MD-NG2", "MD-NG3", "MD-NG4",
  "FLOW-CORE", "FLOW-ATTEMPT", "FLOW-OUTCOME", "FLOW-REUSE",
  "PROC-CLARIFY", "PROC-REVIEW", "PROC-SUMMARY", "PROC-VERIFY", "PROC-COVERAGE",
  "QUALITY-NOGATE", "QUALITY-REBUILD", "QUALITY-RETRACT",
];

function fixture(overrides = {}) {
  return createStageCompletionFacts({
    result: "passed",
    objective: "让阶段结果能被下一步可靠使用",
    approach: "从正式阶段结果生成一份共同事实",
    effect: "用户与系统看到的结论不再漂移",
    verification: {
      conclusion: "相关窄测试通过",
      limits: ["没有运行无关的全量测试"],
    },
    artifacts: [{
      label: "实现结果",
      ref: "receipts/implementation.json",
      hash: HASH,
      accepted_lookup: "results/build-code/accepted.json#facts",
    }],
    review: {
      conclusion: "正式审查通过",
      status: "pass",
      providers: ["codex/coding"],
      duration_ms: null,
      tokens: null,
      findings: [],
      refs: [{ ref: "reviews/results/result.json", hash: HASH }],
    },
    components: [
      { name: "spec-plan", status: "executed", reason: "plan artifact is canonical" },
      { name: "spec-research", status: "trigger=false", reason: "accepted spec supplies sufficient evidence" },
      { name: "wh-review", status: "executed", reason: "canonical review result is bound" },
    ],
    confirmation_summary: {
      specification: "目标、范围和验收条件",
      non_goals: ["不扩大实现范围"],
      phases: ["Phase 1"],
      dependencies: ["当前规格"],
      tests: ["聚焦 RED/GREEN"],
      review_advice: "审查是建议事实，不等于 accepted",
      risks: ["错误复用 stale evidence"],
      expected_impact: "只影响声明边界",
    },
    source_coverage: {
      source_keys: SOURCE_KEYS,
      missing_sources: [],
      orphan_sources: [],
      reverse_missing: [],
    },
    risk_verification: [{
      risk_id: "RISK-STALE",
      red: { status: "failed-as-expected", ref: "evidence/red.json", hash: HASH },
      green: { status: "passed", ref: "evidence/green.json", hash: HASH },
    }],
    missing_items: [],
    risks: ["只验证了本阶段相关路径"],
    dependencies: ["已接受的实现计划"],
    recovery_conditions: ["若下游发现输入无效，返回当前阶段修复"],
    downstream_read_rule: "只读正式 accepted 结果",
    next_owner: "下一阶段",
    user_action: "无需操作",
    ...overrides,
  });
}

describe("stage completion facts", () => {
  it("completion evidence: cannot render a passed handoff while required items are missing", () => {
    expect(() => fixture({
      result: "passed",
      missing_items: ["tasks.md completion evidence is missing"],
    })).toThrow(/completion evidence|missing_items|passed/i);
  });

  it("derives both views from one immutable canonical value", () => {
    const facts = fixture();
    expect(Object.isFrozen(facts)).toBe(true);
    const user = renderUserCompletion(facts);
    const system = renderSystemCompletion(facts);

    expect(user).toMatchObject({
      result: "passed",
      objective: "让阶段结果能被下一步可靠使用",
      approach: "从正式阶段结果生成一份共同事实",
      effect: "用户与系统看到的结论不再漂移",
      verification: { conclusion: "相关窄测试通过" },
      risks: ["只验证了本阶段相关路径"],
      next_owner: "下一阶段",
      user_action: "无需操作",
      artifacts: [{ label: "实现结果" }],
    });
    expect(system).toMatchObject({
      result: "passed",
      risks: ["只验证了本阶段相关路径"],
      next_owner: "下一阶段",
      user_action: "无需操作",
      artifacts: [{
        label: "实现结果",
        ref: "receipts/implementation.json",
        hash: HASH,
        accepted_lookup: "results/build-code/accepted.json#facts",
      }],
      dependencies: ["已接受的实现计划"],
      recovery_conditions: ["若下游发现输入无效，返回当前阶段修复"],
      downstream_read_rule: "只读正式 accepted 结果",
    });
    expect(assertCompletionViewsConsistent(facts, user, system)).toBe(true);
  });

  it.each(["result", "risks", "next_owner", "user_action"])(
    "rejects drift in shared field %s",
    (field) => {
      const facts = fixture();
      const user = renderUserCompletion(facts);
      const system = renderSystemCompletion(facts);
      const changed = field === "risks" ? ["另一风险"] : `changed-${field}`;
      expect(() => assertCompletionViewsConsistent(
        facts,
        { ...user, [field]: changed },
        system,
      )).toThrow(/completion view drift/);
    },
  );

  it("keeps internal workflow data out of the user view", () => {
    const user = renderUserCompletion(fixture());
    const serialized = JSON.stringify(user).toLowerCase();
    for (const forbidden of ["receipts/", "reviews/", HASH, "provider", "token", "attempt", "runner"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("keeps complete formal handoff data in the system view", () => {
    const system = renderSystemCompletion(fixture());
    expect(system.review).toMatchObject({
      status: "pass",
      providers: ["codex/coding"],
      duration_ms: null,
      tokens: null,
      refs: [{ ref: "reviews/results/result.json", hash: HASH }],
    });
    expect(system).toMatchObject({
      missing_items: [],
      dependencies: ["已接受的实现计划"],
      recovery_conditions: ["若下游发现输入无效，返回当前阶段修复"],
      downstream_read_rule: "只读正式 accepted 结果",
    });
  });

  it("states missing review metrics without estimating them", () => {
    const user = renderUserCompletion(fixture());
    expect(user.review).toEqual({
      conclusion: "正式审查通过",
      "耗时": "未提供",
      "用量": "未提供",
    });
  });

  it("rejects renderers that receive anything except canonical facts", () => {
    const plainCopy = structuredClone(fixture());
    expect(() => renderUserCompletion(plainCopy)).toThrow(/canonical completion facts/);
    expect(() => renderSystemCompletion(plainCopy)).toThrow(/canonical completion facts/);
  });

  it("rejects incomplete formal refs and mismatched artifact labels", () => {
    expect(() => fixture({
      artifacts: [{ label: "实现结果", ref: "receipts/implementation.json" }],
    })).toThrow(/artifact hash/);

    const facts = fixture();
    const user = renderUserCompletion(facts);
    const system = renderSystemCompletion(facts);
    expect(() => assertCompletionViewsConsistent(
      facts,
      user,
      { ...system, artifacts: [{ ...system.artifacts[0], label: "另一产物" }] },
    )).toThrow(/completion view drift/);
  });

  it("preserves declared components, source coverage, risk evidence, and confirmation summary", () => {
    const system = renderSystemCompletion(fixture());
    expect(system.components).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "spec-plan", status: "executed" }),
      expect.objectContaining({ name: "spec-research", status: "trigger=false" }),
      expect.objectContaining({ name: "wh-review", status: "executed" }),
    ]));
    expect(system.source_coverage).toEqual({
      source_keys: SOURCE_KEYS,
      missing_sources: [],
      orphan_sources: [],
      reverse_missing: [],
    });
    expect(system.risk_verification).toEqual([
      expect.objectContaining({ risk_id: "RISK-STALE", red: expect.any(Object), green: expect.any(Object) }),
    ]);
    expect(system.confirmation_summary).toMatchObject({
      specification: expect.any(String),
      non_goals: expect.any(Array),
      phases: expect.any(Array),
      dependencies: expect.any(Array),
      tests: expect.any(Array),
      review_advice: expect.stringMatching(/建议事实.*accepted/),
      risks: expect.any(Array),
      expected_impact: expect.any(String),
    });
  });

  it("does not call an unavailable formal review passed", () => {
    expect(() => fixture({
      result: "passed",
      review: {
        conclusion: "正式审查暂不可用",
        status: "unavailable",
        providers: [],
        duration_ms: null,
        tokens: null,
        findings: [],
        refs: [{ ref: "reviews/attempts/unavailable/attempt.json", hash: HASH }],
      },
    })).toThrow(/unavailable.*pass|pass.*unavailable/i);
  });

  it("requires every declared component to be executed or trigger=false with a concrete reason", () => {
    expect(() => fixture({
      components: [
        { name: "spec-plan", status: "executed", reason: "plan artifact is canonical" },
        { name: "spec-research", status: "unknown", reason: "no canonical execution fact" },
      ],
    })).toThrow(/component.*executed.*trigger=false/i);
    expect(() => fixture({
      components: [{ name: "wh-review", status: "trigger=false", reason: "" }],
    })).toThrow(/components.*reason/i);
  });
});
