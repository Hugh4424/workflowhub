import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import * as contracts from "../../runtime/stage/stage-content-contracts.mjs";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const HASH = "a".repeat(64);

function question(axis, index) {
  return {
    question_id: `${axis}-${index}`,
    axis,
    independent: true,
    prompt: `问题 ${index}`,
    options: [
      { number: 1, label: "保守", meaning: "先少做一点", consequence: "范围更小", risk: "可能延后收益" },
      { number: 2, label: "推荐", meaning: "直接解决当前问题", consequence: "直接解决问题", risk: "需要一次调整" },
    ],
    recommended_option: 2,
    recommendation_reason: "当前证据更支持这个选项",
  };
}

function lifecycle(interaction_type) {
  const card = { card_ref: "conversation/card-batch-1", card_hash: HASH, round: 1 };
  const reply = { ...card, source: "user", reply_ref: "host-message://reply-batch-1", reply_hash: "b".repeat(64) };
  const questions = [question("范围", 1), question("验收", 2)];
  const grill = interaction_type === "grill";
  return {
    interaction_type,
    events: [
      { event: "ask", ...card, questions },
      { event: "wait", ...card, status: "waiting-for-user" },
      { event: "reply", ...reply, ...(grill
        ? { answers: [{ frontier_id: "范围-1", number: 2 }, { frontier_id: "验收-2", number: 1 }], remaining_frontier_ids: [], re_ranked: true }
        : { answers: [{ question_id: "范围-1", number: 2 }, { question_id: "验收-2", number: 1 }], remaining_question_ids: [], re_ranked: true }) },
      { event: "resume", ...reply, status: "resumed" },
    ],
  };
}

describe("batched interaction contract", () => {
  it("requires every authenticated requirement class and axis to reach a decision or explicit defer", () => {
    const messages = [
      { id: "m-goal", content_hash: "a".repeat(64), message_class: "goal" },
      { id: "m-flow", content_hash: "b".repeat(64), message_class: "flow_or_surface" },
      { id: "m-data", content_hash: "c".repeat(64), message_class: "data_or_state" },
      { id: "m-acceptance", content_hash: "d".repeat(64), message_class: "success_failure_acceptance" },
      { id: "m-boundary", content_hash: "e".repeat(64), message_class: "constraint_non_goal_defer" },
    ];
    const outputs = messages.map((message, index) => ({
      message_id: message.id,
      message_hash: message.content_hash,
      message_class: message.message_class,
      axis_id: `axis-${index + 1}`,
      impact: index < 2 ? "high" : "medium",
      disposition: index === 4 ? "explicitly_deferred" : "selected",
      ...(index === 4 ? { skip_reason: "当前 host 没有真实 renderer 接口", defer_id: "DEFER-002" } : {}),
      decision_ids: [`D-${index + 1}`],
      requirement_ids: [`R-${index + 1}`],
      fr_ids: [`FR-${index + 1}`],
      ac_ids: [`AC-${index + 1}`],
    }));
    expect(contracts.validateRequirementCoverage({ messages, outputs })).toMatchObject({ ok: true });

    const missingClass = outputs.slice(1);
    const missingResult = contracts.validateRequirementCoverage({ messages, outputs: missingClass });
    expect(missingResult.ok).toBe(false);
    expect(missingResult.errors.join("; ")).toMatch(/goal|class|coverage/i);

    const missingAxis = outputs.map((item) => ({ ...item }));
    delete missingAxis[1].decision_ids;
    const axisResult = contracts.validateRequirementCoverage({ messages, outputs: missingAxis });
    expect(axisResult.ok).toBe(false);
    expect(axisResult.errors.join("; ")).toMatch(/axis|decision/i);

    const decisionStageOutputs = outputs.map(({ fr_ids, ac_ids, ...output }) => output);
    expect(contracts.validateRequirementCoverage({ messages, outputs: decisionStageOutputs })).toMatchObject({ ok: true });
  });

  it("accepts one user-visible batch for Talk and spec-clarify while preserving lifecycle binding", () => {
    for (const kind of ["talk", "spec-clarify"]) {
      const result = contracts.validateInteractionLifecycleContract(lifecycle(kind));
      expect(result, `${kind}: ${result?.errors?.join("; ")}`).toMatchObject({ ok: true });
    }
  });

  it("rejects a batch that joins dependent axes or omits the plain-language choice contract", () => {
    const broken = lifecycle("talk");
    broken.events[0].questions[1].independent = false;
    broken.events[0].questions[0].options = [{ number: 1, label: "只有一个" }];
    const result = contracts.validateInteractionLifecycleContract(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/independent|2|3|option/i);
  });

  it("allows a partial reply while retaining unanswered questions for re-ranking", () => {
    const partial = lifecycle("spec-clarify");
    partial.events[2].answers = [{ question_id: "范围-1", number: 2 }];
    partial.events[2].remaining_question_ids = ["验收-2"];
    expect(contracts.validateInteractionLifecycleContract(partial)).toMatchObject({ ok: true });
  });

  it("rejects unknown questions, unknown options, duplicate answers, and missing re-ranked questions", () => {
    const broken = lifecycle("talk");
    broken.events[2].answers = [
      { question_id: "不存在", number: 99 },
      { question_id: "范围-1", number: 2 },
      { question_id: "范围-1", number: 2 },
    ];
    broken.events[2].remaining_question_ids = [];
    const result = contracts.validateInteractionLifecycleContract(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/bind|twice|belong|remaining/i);
    expect(contracts.validateInteractionQuestionBatch([{ question_id: "x", axis: "x", independent: true }], { interactionType: "Talk" }).ok).toBe(false);
  });

  it("handles prototype-looking question ids as content, not object members", () => {
    for (const kind of ["talk", "grill"]) {
      const current = lifecycle(kind);
      const first = current.events[0].questions[0];
      first.question_id = "constructor-question";
      if (kind === "grill") first.frontier_id = "constructor";
      const answer = current.events[2].answers[0];
      if (kind === "grill") answer.frontier_id = "constructor";
      else answer.question_id = "constructor-question";
      expect(contracts.validateInteractionLifecycleContract(current), kind).toMatchObject({ ok: true });
    }
    const constructorQuestion = lifecycle("talk");
    constructorQuestion.events[0].questions[0].question_id = "constructor";
    constructorQuestion.events[2].answers[0].question_id = "constructor";
    expect(contracts.validateInteractionLifecycleContract(constructorQuestion).ok).toBe(true);
  });

  it("uses a null-prototype option map even when the batch itself is empty", () => {
    const result = contracts.validateInteractionQuestionBatch([]);
    expect(Object.getPrototypeOf(result.option_ids)).toBeNull();
  });

  it("keeps Grill's legacy frontier identity aligned with rich question options", () => {
    const batch = lifecycle("grill");
    batch.events[0].questions[0].question_id = "display-a";
    batch.events[0].questions[0].frontier_id = "frontier-a";
    batch.events[0].questions[1].question_id = "display-b";
    batch.events[0].questions[1].frontier_id = "frontier-b";
    batch.events[2].answers = [{ frontier_id: "frontier-a", number: 2 }];
    batch.events[2].remaining_frontier_ids = ["frontier-b"];
    expect(contracts.validateInteractionLifecycleContract(batch)).toMatchObject({ ok: true });
  });

  it("documents the same batched, numbered, consequence-aware card in all three interaction skills", () => {
    const talk = read("skills/talk-with-zhipeng/SKILL.md");
    const grill = read("skills/grill-with-docs/SKILL.md");
    const clarify = read("skills/spec-clarify/SKILL.md");
    const makeDecision = read("workflows/make-decision/SKILL.md");
    const buildSpec = read("workflows/build-spec/SKILL.md");
    const reuseRegistry = read("skills/reuse-registry.md");
    for (const skill of [talk, grill, clarify]) {
      expect(skill).toMatch(/一组|一批|batch/i);
      expect(skill).toMatch(/2[～-]3|2-3|2 to 3/i);
      expect(skill).toMatch(/后果|consequence/i);
      expect(skill).toMatch(/风险|risk/i);
      expect(skill).toMatch(/编号|number|numbered|question_id/i);
    }
    expect(talk).toMatch(/同一批次可以包含多个互相独立的关键问题/);
    expect(grill).toMatch(/Ask one batch only when the remaining frontier questions are independent/i);
    expect(clarify).toMatch(/Put independent axes into one batch/);
    expect(makeDecision).toMatch(/Talk groups independent decision axes in one batch/i);
    expect(buildSpec).toMatch(/one material specification batch of independent questions/i);
    expect(reuseRegistry).toMatch(/talk-with-zhipeng[\s\S]{0,180}独立问题成批/);
    expect(reuseRegistry).not.toMatch(/talk-with-zhipeng[\s\S]{0,180}一次一问/);

    // These are the old host-level instructions that caused the skills to
    // degrade back to one-question-at-a-time interaction.
    expect(talk).not.toMatch(/一次最多问一个关键问题|仍有这类问题时必须逐个询问/);
    expect(makeDecision).not.toMatch(/exactly\s+one decision axis at a time/i);
    expect(buildSpec).not.toMatch(/asks one material specification question|one material spec ambiguity at a time/i);
  });
});
