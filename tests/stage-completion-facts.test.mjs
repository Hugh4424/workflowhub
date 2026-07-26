import { describe, expect, it } from "vitest";
import {
  assertCompletionViewsConsistent,
  createStageCompletionFacts,
  renderSystemCompletion,
  renderUserCompletion,
} from "../core/stage-completion-facts.mjs";

const HASH = "a".repeat(64);

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
});
