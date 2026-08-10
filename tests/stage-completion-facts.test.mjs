import { describe, expect, it } from "vitest";
import {
  assertCompletionViewsConsistent,
  createStageCompletionFacts,
  renderSystemCompletion,
  renderUserCompletion,
} from "../runtime/evidence/stage-completion-facts.mjs";

const HASH = "a".repeat(64);

function fixture(overrides = {}) {
  return createStageCompletionFacts({
    result: "passed",
    objective: "让阶段结果能被下一步可靠使用",
    approach: "从当前材料和真实质量事实生成一份共同结论",
    effect: "用户与系统看到的结论不再漂移",
    verification: { conclusion: "相关窄测试通过", limits: ["没有运行无关的全量测试"] },
    artifacts: [{
      label: "实现结果",
      ref: "quality/evidence/implementation.json",
      hash: HASH,
    }],
    review: {
      conclusion: "正式审查通过",
      status: "pass",
      providers: ["codex/coding"],
      duration_ms: null,
      tokens: null,
      findings: [],
      refs: [{ ref: "quality/reviews/results/result.json", hash: HASH }],
    },
    components: [
      { name: "spec-plan", status: "executed", reason: "Stage Agent directly used the portable package" },
      { name: "spec-research", status: "trigger=false", reason: "current materials answer the research question" },
    ],
    confirmation_summary: {
      completed: "已完成阶段范围内的实现和验证",
      specification: "目标、范围和验收条件",
      scope: ["当前阶段声明边界"],
      non_goals: ["不扩大实现范围"],
      phases: ["Phase 1"],
      dependencies: ["当前四材料"],
      tests: ["聚焦 RED/GREEN"],
      review_advice: "审查是质量事实，不是工作许可证",
      risks: ["错误复用 stale evidence"],
      deferred: ["无关全量测试留给 verify-code"],
      next_stage_boundary: "下一阶段读取当前四材料，不猜测缺失需求",
      expected_impact: "只影响声明边界",
    },
    source_coverage: { source_keys: ["FLOW-CORE"], missing_sources: [], orphan_sources: [], reverse_missing: [] },
    risk_verification: [{
      risk_id: "RISK-STALE",
      red: { status: "failed-as-expected", ref: "quality/evidence/red.json", hash: HASH },
      green: { status: "passed", ref: "quality/evidence/green.json", hash: HASH },
    }],
    business_facts: { content: "present", code: "complete", tests: "passed", acceptance_criteria: "covered" },
    audit_gaps: [],
    missing_items: [],
    risks: ["只验证了本阶段相关路径"],
    next_owner: "下一阶段",
    user_action: "无需操作",
    ...overrides,
  });
}

describe("stage completion facts", () => {
  it("rejects an artifact without a content hash", () => {
    expect(() => fixture({ artifacts: [{ label: "实现结果", ref: "quality/evidence/implementation.json", hash: "missing" }] }))
      .toThrow(/artifact hash must be sha256/);
  });

  it("requires business facts but not dispatch, receipt, or invocation reconciliation", () => {
    expect(() => createStageCompletionFacts({
      result: "passed",
      objective: "x", approach: "x", effect: "x",
      verification: { conclusion: "x", limits: [] },
      artifacts: [],
      review: { conclusion: "x", status: "pass", providers: [], duration_ms: null, tokens: null, findings: [], refs: [] },
      components: [], audit_gaps: [], missing_items: [], risks: [], next_owner: "x", user_action: "x",
    })).toThrow(/business_facts/i);

    expect(renderSystemCompletion(fixture())).not.toHaveProperty("invocation_facts");
    expect(renderSystemCompletion(fixture())).not.toHaveProperty("declared_components");
  });

  it("derives incomplete from business quality without changing work readiness", () => {
    const system = renderSystemCompletion(fixture({
      result: "passed",
      business_facts: { content: "present", code: "complete", tests: "failed", acceptance_criteria: "covered" },
    }));
    expect(system.result).toBe("incomplete");
    expect(system.missing_items).toContain("business tests is incomplete");
  });

  it("keeps audit gaps as disclosure instead of a gate", () => {
    const system = renderSystemCompletion(fixture({
      audit_gaps: [{ kind: "audit_summary", status: "missing", reason: "no canonical audit record exists" }],
    }));
    expect(system.result).toBe("passed");
    expect(system.audit_gaps).toEqual([{ kind: "audit_summary", status: "missing", reason: "no canonical audit record exists" }]);
  });

  it("rejects a passed claim with explicit missing quality items", () => {
    expect(() => fixture({ result: "passed", missing_items: ["acceptance evidence is missing"] })).toThrow(/passed completion evidence/i);
  });

  it("derives immutable user and system views from one canonical value", () => {
    const facts = fixture();
    const user = renderUserCompletion(facts);
    const system = renderSystemCompletion(facts);
    expect(Object.isFrozen(facts)).toBe(true);
    expect(user).toMatchObject({ result: "passed", objective: "让阶段结果能被下一步可靠使用", artifacts: [{ label: "实现结果" }] });
    expect(system).toMatchObject({
      result: "passed",
      next_owner: "下一阶段",
    });
    expect(assertCompletionViewsConsistent(facts, user, system)).toBe(true);
  });

  it("keeps the plain-language handoff summary and confirmation facts aligned", () => {
    const facts = fixture();
    const user = renderUserCompletion(facts);
    const system = renderSystemCompletion(facts);
    expect(user.stage_summary).toMatchObject({
      completed: "已完成阶段范围内的实现和验证",
      scope: ["当前阶段声明边界"],
      next_stage_boundary: "下一阶段读取当前四材料，不猜测缺失需求",
    });
    expect(system.confirmation_summary).toMatchObject({
      completed: "已完成阶段范围内的实现和验证",
      deferred: ["无关全量测试留给 verify-code"],
    });
    expect(() => assertCompletionViewsConsistent(facts, {
      ...user,
      stage_summary: { ...user.stage_summary, next_stage_boundary: "漂移后的交接边界" },
    }, system)).toThrow(/completion view drift: stage summary/);
  });

  it("keeps internal paths and provider details out of the user view", () => {
    const serialized = JSON.stringify(renderUserCompletion(fixture())).toLowerCase();
    for (const forbidden of ["quality/", HASH, "provider", "token", "attempt", "runner"]) expect(serialized).not.toContain(forbidden);
  });

  it("keeps unavailable review truthful without changing the business result", () => {
    const unavailable = {
      conclusion: "正式审查暂不可用",
      status: "unavailable",
      providers: [], duration_ms: null, tokens: null, findings: [],
      refs: [{ ref: "quality/reviews/attempts/unavailable.json", hash: HASH }],
    };
    expect(renderSystemCompletion(fixture({ review: unavailable }))).toMatchObject({ result: "passed", review: { status: "unavailable" } });
    expect(() => fixture({ review: { ...unavailable, conclusion: "review passed" } })).toThrow(/unavailable.*pass/i);
  });

  it("requires each reported component to be directly executed or truthfully skipped", () => {
    expect(() => fixture({ components: [{ name: "spec-plan", status: "unknown", reason: "no fact" }] })).toThrow(/component status/i);
    expect(() => fixture({ components: [{ name: "spec-research", status: "trigger=false", reason: "" }] })).toThrow(/reason/i);
  });

  it("keeps itemized verification quality-critical without creating a work gate", () => {
    const verification_items = [
      "current_materials", "diff_scope", "risk_tests", "acceptance_criteria", "tasks_completion",
      "browser_qa", "independent_review_resolution", "core_gaps", "human_handoff",
    ].map((id) => ({
      id,
      status: id === "independent_review_resolution" ? "unknown" : (id === "browser_qa" ? "not_applicable" : "pass"),
      evidence_refs: [],
      reason: id === "independent_review_resolution" ? "provider unavailable" : "checked",
    }));
    expect(renderSystemCompletion(fixture({ verification_items }))).toMatchObject({ result: "passed", verification_items });
  });

  it.each(["result", "risks", "next_owner", "user_action"])("rejects drift in shared field %s", (field) => {
    const facts = fixture();
    const user = renderUserCompletion(facts);
    const system = renderSystemCompletion(facts);
    const changed = field === "risks" ? ["另一风险"] : `changed-${field}`;
    expect(() => assertCompletionViewsConsistent(facts, { ...user, [field]: changed }, system)).toThrow(/completion view drift/);
  });
});
