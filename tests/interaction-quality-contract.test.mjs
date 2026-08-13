import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  deriveStageCompletion,
  deriveStageProgress,
} from "../runtime/stage/completion-predicates.mjs";
import { validateInteractionLifecycleContract } from "../runtime/stage/stage-content-contracts.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const stage = (name) => readFileSync(join(root, "workflows", name, "SKILL.md"), "utf8");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const materials = {
  "decision-log.md": "current decision",
  "spec.md": "current specification",
  "plan.md": "current plan",
  "tasks.md": "current tasks",
};

const unavailableReview = [{
  authenticated: true,
  freshness: { status: "stale" },
  fact: {
    ref: "quality/reviews/unavailable.json",
    stage: "build-code",
    subject: "integration_review",
    kind: "review",
    status: "unavailable",
  },
}];

describe("current-material workflow contracts", () => {
  it("lists the four authoritative materials in every workflow", () => {
    for (const name of stages) {
      const skill = stage(name);
      for (const material of Object.keys(materials)) expect(skill, `${name}: ${material}`).toContain(material);
    }
  });

  it("derives work eligibility from current materials, not old quality facts", () => {
    const progress = deriveStageProgress("build-code", unavailableReview, materials);

    expect(progress).toMatchObject({
      work_status: "ready",
      work_authority: "current-four-materials-and-plan-tasks",
      readiness_source: "current-material-presence",
      missing_materials: [],
    });
  });

  it("keeps formal completion separate from work eligibility", () => {
    const readiness = deriveStageProgress("build-code", unavailableReview, materials);
    expect(readiness.work_status).toBe("ready");
    expect(readiness).not.toHaveProperty("status");
    expect(deriveStageCompletion("build-code", unavailableReview)).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["integration_review"]),
    });
  });

  it("waits only for a required current material when work is not ready", () => {
    const progress = deriveStageProgress("build-code", unavailableReview, {
      ...materials,
      "tasks.md": "",
    });

    expect(progress).toMatchObject({
      work_status: "blocked_by_missing_material",
      missing_materials: ["tasks.md"],
    });
  });

  it("does not let an unavailable review become pass or stop same-task repair", () => {
    const docs = [stage("build-spec"), stage("build-plan"), stage("build-code"), stage("verify-code")];

    for (const skill of docs) {
      expect(skill).toContain("unavailable");
      expect(skill).toMatch(/same task|same-task|同一 task/i);
    }
    expect(stage("build-code")).toMatch(/`unavailable` is never `pass`/i);
    expect(stage("verify-code")).toMatch(/`unavailable` 绝不是 `pass`/i);
  });

  it("continues the same task instead of creating a replacement task", () => {
    expect(stage("build-spec")).toMatch(/does not create a new task/i);
    expect(stage("build-plan")).toMatch(/does not create a new task/i);
    expect(stage("build-code")).toMatch(/never require a new task/i);
    expect(stage("verify-code")).toMatch(/回同一 task 修复，不新建任务/);
  });

  it("keeps Talk and Clarify batches independent while Grill batches independent frontier questions", () => {
    const talk = readFileSync(join(root, "skills", "talk-with-zhipeng", "SKILL.md"), "utf8");
    const grill = readFileSync(join(root, "skills", "grill-with-docs", "SKILL.md"), "utf8");
    expect(talk).toMatch(/Talk 的 `ask\.questions` 可以是一组问题/);
    expect(grill).toMatch(/batch only when the remaining frontier questions are independent/i);
    expect(grill).toMatch(/绝不调用 wh-review、生成 review finding 或写 review fact/);
    expect(grill).toMatch(/允许是部分答案/);
    expect(grill).not.toMatch(/Ask the questions one at a time/);

    const batch = {
      interaction_type: "grill",
      events: [
        { event: "ask", card_ref: "card", card_hash: "a".repeat(64), round: 1, questions: [
          { question_id: "a", frontier_id: "a", independent: true, options: [
            { number: 1, label: "保守", meaning: "少做", consequence: "范围小", risk: "收益慢" },
            { number: 2, label: "推荐", meaning: "直接做", consequence: "解决问题", risk: "改动较多" },
          ], recommended_option: 2, recommendation_reason: "当前事实支持" },
          { question_id: "b", frontier_id: "b", independent: true, options: [
            { number: 1, label: "保守", meaning: "少做", consequence: "范围小", risk: "收益慢" },
            { number: 2, label: "推荐", meaning: "直接做", consequence: "解决问题", risk: "改动较多" },
          ], recommended_option: 2, recommendation_reason: "当前事实支持" },
        ] },
        { event: "wait", card_ref: "card", card_hash: "a".repeat(64), round: 1, status: "waiting-for-user" },
        { event: "reply", card_ref: "card", card_hash: "a".repeat(64), round: 1, source: "user", reply_ref: "reply", reply_hash: "b".repeat(64), answers: [{ frontier_id: "a", answer: "保留", number: 1 }], remaining_frontier_ids: ["b"], re_ranked: true },
        { event: "resume", card_ref: "card", card_hash: "a".repeat(64), round: 1, reply_ref: "reply", reply_hash: "b".repeat(64), status: "resumed" },
      ],
    };
    expect(validateInteractionLifecycleContract(batch)).toMatchObject({ ok: true });
    batch.events[0].questions[1].independent = false;
    expect(validateInteractionLifecycleContract(batch)).toMatchObject({ ok: false });
  });
});
