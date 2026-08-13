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
    for (const skill of [talk, grill, clarify]) {
      expect(skill).toMatch(/一组|一批|batch/i);
      expect(skill).toMatch(/2[～-]3|2-3|2 to 3/i);
      expect(skill).toMatch(/后果|consequence/i);
      expect(skill).toMatch(/风险|risk/i);
      expect(skill).toMatch(/编号|number|numbered|question_id/i);
    }
    expect(talk).not.toMatch(/一次只问一个问题/);
    expect(clarify).not.toMatch(/Handle one decision axis at a time/);
  });
});
