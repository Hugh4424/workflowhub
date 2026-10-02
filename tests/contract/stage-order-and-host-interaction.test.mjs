import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { validateInteractionLifecycleContract, validateInteractionLifecycleSequence } from "../../runtime/stage/stage-content-contracts.mjs";
import { validateStageAgentInteractionRounds } from "../../runtime/stage/stage-agent-outcome-adapter.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const readJson = (...parts) => JSON.parse(read(...parts));
const hash = "a".repeat(64);

function lifecycle(interaction_type, round = 1) {
  const card = { card_ref: `conversation/${interaction_type}/card-${round}`, card_hash: hash, round };
  const reply = { ...card, source: "user", reply_ref: `host-message://${interaction_type}/reply-${round}`, reply_hash: "b".repeat(64) };
  const question = (question_id) => ({
    question_id,
    frontier_id: interaction_type === "grill" ? question_id : undefined,
    axis: question_id,
    independent: true,
    options: [
      { number: 1, label: "保守", meaning: "先少做", consequence: "范围较小", risk: "收益较慢" },
      { number: 2, label: "推荐", meaning: "直接解决", consequence: "一次解决", risk: "改动较多" },
    ],
    recommended_option: 2,
    recommendation_reason: "当前事实支持",
  });
  const questions = [question(`${interaction_type}-scope-${round}`), question(`${interaction_type}-risk-${round}`)];
  return {
    interaction_type,
    events: [
      { event: "ask", ...card, questions },
      { event: "wait", ...card, status: "waiting-for-user" },
      { event: "reply", ...reply, answers: questions.map((item) => ({
        [interaction_type === "grill" ? "frontier_id" : "question_id"]: item.question_id,
        number: 2,
      })), ...(interaction_type === "grill"
        ? { remaining_frontier_ids: [] }
        : { remaining_question_ids: [] }), re_ranked: true },
      { event: "resume", ...reply, status: "resumed" },
    ],
  };
}

describe("P1 stage order and real host interaction contract", () => {
  it("accepts ordered rounds for one declared interaction and rejects a duplicate lifecycle", () => {
    const first = lifecycle("talk", 1);
    const second = lifecycle("talk", 2);
    expect(validateStageAgentInteractionRounds({ interaction_type: "talk", rounds: [first, second] })).toMatchObject({ ok: true });

    const duplicate = lifecycle("talk");
    expect(() => validateStageAgentInteractionRounds({ interaction_type: "talk", rounds: [first, duplicate] })).toThrow(/duplicate|started more than once|invalid/i);
  });

  it("requires every dynamic Talk batch to use the real ask-wait-reply-resume seam", () => {
    const makeDecision = read("workflows", "make-decision", "SKILL.md");
    expect(makeDecision).toMatch(/dynamic Talk batch/i);
    expect(makeDecision).toMatch(/ask[\s\S]*wait[\s\S]*user reply[\s\S]*resume/i);
    expect(makeDecision).toMatch(/zero, one, or multiple questions|零、一个或多个/i);
    expect(makeDecision).toMatch(/re-?rank|重排/i);
  });

  it("keeps the advice, outline, Grill and dynamic module order while Clarify stays in build-spec", () => {
    const makeSteps = readJson("workflows", "make-decision", "steps.json").steps;
    const buildSpecSteps = readJson("workflows", "build-spec", "steps.json").steps;
    const order = (slug) => makeSteps.find((step) => step.step_slug === slug).order;
    expect(order("research-and-diverge")).toBeLessThan(order("direction-advice"));
    expect(order("direction-advice")).toBeLessThan(order("outline-talk"));
    expect(order("outline-talk")).toBeLessThan(order("grill-with-docs"));
    expect(order("grill-with-docs")).toBeLessThan(order("module-convergence"));
    expect(order("module-convergence")).toBeLessThan(order("detail-advice"));
    expect(buildSpecSteps.find((step) => step.step_slug === "spec-clarify").observable_result)
      .toMatch(/real ask.*wait.*matching user reply.*resume/i);
    expect(read("workflows", "build-spec", "SKILL.md"))
      .toMatch(/missing\s+reply,\s+wrong\s+card,\s+stale\s+hash,\s+or\s+interrupted\s+resume\s+stays\s+`incomplete`/i);
  });

  it("requires a real user reply for Talk, Grill, and Clarify before resume", () => {
    for (const kind of ["talk", "grill", "spec-clarify"]) {
      expect(validateInteractionLifecycleContract(lifecycle(kind)), kind).toMatchObject({ ok: true });
      const fake = lifecycle(kind);
      fake.events[2].source = "agent";
      expect(validateInteractionLifecycleContract(fake).ok, `${kind} fake reply`).toBe(false);
    }
  });

  it("keeps batching, consequence/risk cards, re-ranking, and no-review Grill behavior explicit", () => {
    const makeDecision = read("workflows", "make-decision", "SKILL.md");
    const talk = read("skills", "talk-with-zhipeng", "SKILL.md");
    const grill = read("skills", "grill-with-docs", "SKILL.md");
    const clarify = read("skills", "spec-clarify", "SKILL.md");
    expect(makeDecision).toMatch(/Talk groups independent decision axes in one batch/i);
    expect(talk).toMatch(/每题 2[～-]3 个互斥选项/);
    expect(talk).toMatch(/consequences and risks|后果和风险/i);
    expect(grill).toMatch(/(?:must not call wh-review|绝不调用 wh-review)[\s\S]{0,80}(?:review fact|review finding|review 结论)/i);
    expect(clarify).toMatch(/Publishing a batch card ends the current invocation/i);
  });

  it("T003 makes the build-plan review/analyze journey one merged packet with four fail-loud self-checks", () => {
    const steps = readJson("workflows", "build-plan", "steps.json").steps;
    const review = steps.find((step) => step.step_slug === "merged-review");
    const dispose = steps.find((step) => step.step_slug === "main-agent-disposes-findings");
    const analyze = steps.find((step) => step.step_slug === "final-spec-analyze");
    expect(review).toMatchObject({ owner: "wh-review" });
    expect(review.observable_result).toMatch(/single[ -]packet[\s\S]*review[\s\S]*analyze/i);
    expect(dispose.observable_result).toMatch(/owner[\s\S]*(?:deadline|due)[\s\S]*finding/i);
    expect(analyze.observable_result).toMatch(/authenticated raw requirements[\s\S]*Missing original source[\s\S]*unavailable/i);
    expect(review.order).toBeLessThan(dispose.order);
    expect(dispose.order).toBeLessThan(analyze.order);
  });
});
