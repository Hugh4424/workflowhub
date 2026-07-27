import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const root = resolve(new URL("..", import.meta.url).pathname);
const compact = (value) => value.replace(/\s+/g, " ");
const read = (...parts) => compact(readFileSync(join(root, ...parts), "utf8"));
const talk = read("skills", "talk-with-zhipeng", "SKILL.md");
const grill = read("skills", "grill-with-docs", "SKILL.md");
const makeDecision = read("workflows", "make-decision", "SKILL.md");
const buildSpec = read("workflows", "build-spec", "SKILL.md");
let validateInteractionQuestionProgress;
let interactionContractLoadError;

beforeAll(async () => {
  try {
    ({ validateInteractionQuestionProgress } = await import("../core/stage-content-contracts.mjs"));
  } catch (error) {
    interactionContractLoadError = error;
  }
});

function requireQuestionProgressValidator() {
  expect(interactionContractLoadError).toBeUndefined();
  expect(
    validateInteractionQuestionProgress,
    "core/stage-content-contracts.mjs must expose the deterministic question-progress validator",
  ).toBeTypeOf("function");
}

function progress(overrides = {}) {
  return {
    asked_question_ids: [],
    open_direction_changing_question_ids: ["q1", "q2", "q3", "q4"],
    displayed_question_number: 1,
    displayed_total: 4,
    previous: null,
    reply_ref: null,
    reply_hash: null,
    total_change_reason: null,
    ...overrides,
  };
}

function expectProgressRejected(value, pattern) {
  const validation = validateInteractionQuestionProgress(value);
  expect(validation).toMatchObject({ ok: false });
  expect(validation.errors.join("\n")).toMatch(pattern);
}

describe("typed interaction boundary", () => {
  it("requires ask, pause, a bound real reply, and re-rank in that order", () => {
    for (const text of [talk, makeDecision]) {
      expect(text).toMatch(
        /ask[\s\S]{0,140}(?:wait|pause|暂停|等待)[\s\S]{0,180}(?:real|actual|真实)[^。.;]{0,40}(?:reply|answer|回复|回答)[\s\S]{0,180}(?:re-rank|rerank|重排|重新排序)/i,
      );
    }
    expect(makeDecision).toMatch(
      /host-visible[\s\S]{0,140}(?:ask|question)[\s\S]{0,120}(?:ref|hash)[\s\S]{0,180}(?:reply|answer)[\s\S]{0,120}(?:ref|hash)/i,
    );
  });

  it("rejects fake, default, stale, or self-reported replies", () => {
    expect(talk).toMatch(
      /(?:agent[- ]generated|Agent\s*生成|代理生成)[\s\S]{0,120}(?:default|默认)[\s\S]{0,120}(?:old|stale|旧)[\s\S]{0,160}(?:self[- ]report|自报)[\s\S]{0,120}(?:cannot|must not|不得|不能)[^。.;]{0,50}(?:reply|回答|推进)/i,
    );
  });

  it("derives the displayed total from asked plus still-open direction-changing questions", () => {
    expect(talk).toMatch(
      /(?:total|总数)[\s\S]{0,180}(?:questions already asked|已(?:经)?提出的问题数)[\s\S]{0,120}\+[\s\S]{0,140}(?:(?:open|开放)[^。.;]{0,100}(?:change direction|改变方向)|(?:change direction|改变方向)[^。.;]{0,100}(?:open|开放))/i,
    );
    expect(talk).toMatch(
      /(?:total|总数)[\s\S]{0,180}(?:real|真实)[^。.;]{0,50}(?:reply|answer|回复|回答)[\s\S]{0,140}(?:change|变化)[\s\S]{0,180}(?:reason|原因)/i,
    );
  });

  it("keeps internal record terms out of the user card", () => {
    expect(talk).toMatch(
      /(?:do not show|must not show|不得展示|不展示)[\s\S]{0,100}(?:internal ID|内部 ID)[\s\S]{0,140}(?:hash|receipt|attempt|runner)/i,
    );
    expect(talk).toMatch(/(?:plain[- ]language|大白话)/i);
  });

  it("requires all four grill exit facts and interaction for directional choices", () => {
    expect(grill).toMatch(/CONTEXT\.md[\s\S]{0,180}(?:changed|no change|变化|无变化)/i);
    expect(grill).toMatch(/ADR[\s\S]{0,180}(?:created|not needed|创建|无需)/i);
    expect(grill).toMatch(/(?:conflict|冲突)[\s\S]{0,180}(?:result|disposition|处理结果)/i);
    expect(grill).toMatch(/(?:actual file|实际文件)[^。.;]{0,50}(?:reference|引用)/i);
    expect(grill).toMatch(/(?:four|四项)[^。.;]{0,50}(?:exit checks|退出检查)/i);
    expect(grill).toMatch(
      /(?:direction|goal|scope|方案|目标|范围|风险|长期规则)[\s\S]{0,240}ask[\s\S]{0,120}(?:wait|pause|暂停|等待)[\s\S]{0,180}(?:reply|answer|回复|回答)[\s\S]{0,140}(?:re-rank|rerank|重排)/i,
    );
  });
});

describe("ambiguity ledger boundary", () => {
  it("classifies every independent axis and records all six impact dimensions", () => {
    expect(buildSpec).toMatch(/ambiguity-ledger\.v1/i);
    for (const classification of [
      /locked upstream decision/i,
      /(?:upstream explicitly unresolved|explicitly unresolved upstream)/i,
      /new ambiguity/i,
    ]) expect(buildSpec).toMatch(classification);
    for (const dimension of [
      /scope/i,
      /acceptance/i,
      /interface/i,
      /data/i,
      /security/i,
      /operations/i,
    ]) expect(buildSpec).toMatch(dimension);
    expect(buildSpec).toMatch(/(?:vary independently[\s\S]{0,80}(?:two items|two axes)|独立变化[\s\S]{0,80}(?:拆分|两个轴))/i);
  });

  it("blocks publication until each material ambiguity has one allowed conclusion", () => {
    for (const conclusion of [
      /real user decision/i,
      /(?:uniquely derived spec-local fact|spec-local fact[\s\S]{0,80}uniquely derived)/i,
      /unresolved blocker/i,
    ]) expect(buildSpec).toMatch(conclusion);
    expect(buildSpec).toMatch(/unresolved_material_count[\s\S]{0,180}(?:stop|block|阻止)[\s\S]{0,160}(?:publish|receipt|发布)/i);
    expect(buildSpec).toMatch(/(?:no material ambiguity|无重大歧义)[\s\S]{0,180}(?:fact|reason|事实|理由)/i);
  });

  it("binds the exact spec hash and refreshes the ledger on every accepted change", () => {
    expect(buildSpec).toMatch(/spec_content_hash[\s\S]{0,160}(?:exact UTF-8 bytes|精确 UTF-8)/i);
    expect(buildSpec).toMatch(/(?:clarification|review|澄清|审查)[\s\S]{0,220}(?:change|改变)[\s\S]{0,180}(?:regenerate|rebuild|重新生成)[\s\S]{0,120}(?:ledger|ambiguity-ledger\.v1)/i);
    expect(buildSpec).toMatch(/ordinary change[\s\S]{0,180}delta\/resolution[\s\S]{0,180}(?:provider_calls=0|provider calls remain zero)/i);
    expect(buildSpec).toMatch(/structural change[\s\S]{0,180}(?:at most one|最多一次)[\s\S]{0,100}fresh full review/i);
  });
});

describe("CF-1 dynamic question totals are derived from real queue transitions", () => {
  it("starts with four open questions and displays 1/4", () => {
    requireQuestionProgressValidator();
    expect(validateInteractionQuestionProgress(progress())).toMatchObject({
      ok: true,
      errors: [],
      facts: {
        displayed_question_number: 1,
        current_total: 4,
      },
    });
  });

  it("decreases the total only after a real answer removes one remaining question", () => {
    requireQuestionProgressValidator();
    const initial = progress();
    expect(validateInteractionQuestionProgress(progress({
      asked_question_ids: ["q1"],
      open_direction_changing_question_ids: ["q2", "q3"],
      displayed_question_number: 2,
      displayed_total: 3,
      previous: initial,
      reply_ref: "host-message://reply/q1",
      reply_hash: "a".repeat(64),
      total_change_reason: "q1 made q4 no longer direction-changing",
    }))).toMatchObject({
      ok: true,
      facts: { current_total: 3, total_delta: -1 },
    });
  });

  it("increases the total only after a real answer adds one new open question", () => {
    requireQuestionProgressValidator();
    const afterRemoval = progress({
      asked_question_ids: ["q1"],
      open_direction_changing_question_ids: ["q2", "q3"],
      displayed_question_number: 2,
      displayed_total: 3,
    });
    expect(validateInteractionQuestionProgress(progress({
      asked_question_ids: ["q1", "q2"],
      open_direction_changing_question_ids: ["q3", "q5"],
      displayed_question_number: 3,
      displayed_total: 4,
      previous: afterRemoval,
      reply_ref: "host-message://reply/q2",
      reply_hash: "b".repeat(64),
      total_change_reason: "q2 revealed the independent q5 decision",
    }))).toMatchObject({
      ok: true,
      facts: { current_total: 4, total_delta: 1 },
    });
  });

  it("rejects a mechanical denominator that copies the question number", () => {
    requireQuestionProgressValidator();
    expectProgressRejected(progress({
      asked_question_ids: ["q1"],
      open_direction_changing_question_ids: ["q2", "q3", "q4"],
      displayed_question_number: 2,
      displayed_total: 2,
    }), /displayed_total|asked.*open|mechanical|分母|总数/i);
  });

  it.each([
    ["without a bound real reply", { reply_ref: null, reply_hash: null }, /reply|真实回复|绑定/i],
    ["without a factual change reason", { total_change_reason: null }, /reason|原因/i],
  ])("rejects a changed total %s", (_label, missing, pattern) => {
    requireQuestionProgressValidator();
    expectProgressRejected(progress({
      asked_question_ids: ["q1"],
      open_direction_changing_question_ids: ["q2", "q3"],
      displayed_question_number: 2,
      displayed_total: 3,
      previous: progress(),
      reply_ref: "host-message://reply/q1",
      reply_hash: "c".repeat(64),
      total_change_reason: "q1 removed q4",
      ...missing,
    }), pattern);
  });
});
