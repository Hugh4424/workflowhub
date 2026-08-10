import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(new URL("..", import.meta.url).pathname);
const compact = (value) => value.replace(/\s+/g, " ");
const read = (...parts) => compact(readFileSync(join(root, ...parts), "utf8"));
const talk = read("skills", "talk-with-zhipeng", "SKILL.md");
const grill = read("skills", "grill-with-docs", "SKILL.md");
const makeDecision = read("workflows", "make-decision", "SKILL.md");
const buildSpec = read("workflows", "build-spec", "SKILL.md");
const buildPlan = read("workflows", "build-plan", "SKILL.md");
const hostProtocol = read("skills", "workflowhub-host-protocol", "SKILL.md");

describe("current interaction boundary", () => {
  it("keeps Talk and Grill exclusively in make-decision", () => {
    expect(read("workflows", "make-decision", "skill-deps.yaml")).toMatch(
      /name: grill-with-docs, path: skills\/grill-with-docs\/SKILL\.md, execution: inline/i,
    );
    expect(makeDecision).toMatch(/Only the main agent may execute user-facing Talk, Grill, or Clarify/i);
    expect(makeDecision).toMatch(/Talk must cover both architecture direction and product journey or user outcome/i);
    expect(makeDecision).toMatch(/Wait for the user's actual reply before handoff/i);
    expect(buildSpec).toMatch(/Do not run Clarify in this stage or invent the answer/i);
    expect(buildPlan).toMatch(/Do not run Talk, Clarify, or Grill/i);
    expect(buildSpec).not.toMatch(/obtain the user's actual reply/i);
    expect(buildPlan).toMatch(/obtain the user's actual reply[\s\S]*before claiming that build-plan itself is accepted/i);
  });

  it("keeps stage-end communication informative without making it a work gate", () => {
    expect(hostProtocol).toMatch(/评论是给人看的通知，不是第二套状态机/);
    expect(hostProtocol).toMatch(/不要求 receipt、评论模板或过程索引/);
    expect(hostProtocol).toMatch(/comment 或 handoff proof 变成开始或继续工作的许可证/);
    expect(hostProtocol).toMatch(/不要要求下游评论重复或证明上游的 Talk、Grill、调研与 review 过程/);
    expect(buildSpec).toMatch(/human alignment, not a machine work permit/i);
    for (const skill of [buildSpec, buildPlan]) expect(skill).not.toMatch(/handoff proof/i);
    expect(buildPlan).toMatch(/does not turn confirmation into a machine work permit/i);
  });

  it("lets four readable materials drive work while quality facts restrict completion", () => {
    expect(hostProtocol).toMatch(/build-code.*四材料可读即可.*实现、测试和修复/i);
    expect(hostProtocol).toMatch(/verify-code.*四材料可读即可.*最终判断/i);
    expect(hostProtocol).toMatch(/材料存在只证明可以工作，不证明质量完成/);
    for (const skill of [makeDecision, buildSpec, buildPlan])
      expect(skill).toMatch(/quality|质量/i);
    expect(buildSpec).toMatch(/Missing or unavailable quality evidence lowers the completion claim/i);
    expect(buildPlan).toMatch(/Missing or unavailable quality evidence lowers the completion claim/i);
  });

  it("asks only direction-changing questions and never invents user decisions", () => {
    expect(makeDecision).toMatch(/Ask only questions whose answers could change direction/i);
    expect(makeDecision).toMatch(/Do not invent user answers/i);
    expect(talk).toMatch(/一次只问一个问题/);
    expect(talk).toMatch(/只把用户实际给出的回复当作回答/);
  });

  it("returns only minimal interaction facts and lets the stage write one aggregate", () => {
    expect(talk).toMatch(/architecture_direction_covered: true/);
    expect(talk).toMatch(/user_outcome_covered: true/);
    expect(talk).toMatch(/open_direction_changing_questions: 0/);
    expect(talk).not.toMatch(/interaction-completion\.v1/);
    expect(talk).not.toMatch(/受控 writer/);
    expect(grill).toMatch(/最小 `grill_summary`/);
    expect(grill).toMatch(/不向下游重复传递/);
    expect(grill).not.toMatch(/interaction-completion\.v1/);
    expect(grill).not.toMatch(/受控 writer 发布/);
    expect(makeDecision).toMatch(/workflowhub-interaction-aggregate\.v1/);
    expect(makeDecision).toMatch(/quality\/evidence\/interactions\/<sha256>\.json/);
    expect(makeDecision).toMatch(/Do not create a run, revision, latest pointer,[\s\S]{0,120}ledger/);
  });

  it("keeps internal execution details out of user-facing cards", () => {
    expect(talk).toMatch(/(?:不展示|不得展示)内部 ID、hash、receipt、attempt、runner/);
    expect(talk).toMatch(/大白话/);
    expect(makeDecision).toMatch(/Keep paths, hashes, refs, and commands in formal records/i);
  });

  it("requires factual grill exit checks without treating documentation as a progress permit", () => {
    expect(grill).toMatch(/CONTEXT\.md[\s\S]{0,180}(?:changed|no change|变化|无变化)/i);
    expect(grill).toMatch(/ADR[\s\S]{0,180}(?:created|not needed|创建|无需)/i);
    expect(grill).toMatch(/(?:conflict|冲突)[\s\S]{0,180}(?:result|disposition|处理结果)/i);
    expect(grill).toMatch(/(?:four|四项)[^。.;]{0,50}(?:exit checks|退出检查)/i);
    expect(grill).toMatch(/不得变成额外机器硬门/);
  });
});

describe("current ambiguity handling", () => {
  it("records material ambiguity plainly and keeps drafting/revision possible", () => {
    expect(buildSpec).toMatch(/list every material ambiguity separately/i);
    for (const dimension of ["scope", "acceptance", "interfaces", "data", "security", "operations"]) {
      expect(buildSpec).toContain(dimension);
    }
    expect(buildSpec).toMatch(/Continue all unaffected drafting and repair/i);
    expect(buildSpec).toMatch(/identified as an upstream decision gap/i);
  });

  it("keeps build-plan limited to plan and task design without executing tests", () => {
    expect(buildPlan).toMatch(/This stage owns only `plan\.md` and `tasks\.md`/i);
    expect(buildPlan).toMatch(/Do not implement code or execute RED\/GREEN/i);
    expect(buildPlan).toMatch(/Plan test scenarios, commands, expected outcomes, and evidence for `build-code` to execute later/i);
    expect(buildPlan).toMatch(/test work is fully designed but no RED\/GREEN execution is claimed/i);
  });
});
