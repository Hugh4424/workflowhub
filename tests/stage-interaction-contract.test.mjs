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

describe("current interaction boundary", () => {
  it("keeps user-facing communication in the main agent and requires a real reply before handoff", () => {
    expect(read("workflows", "make-decision", "skill-deps.yaml")).toMatch(
      /name: grill-with-docs, path: skills\/grill-with-docs\/SKILL\.md, execution: inline/i,
    );
    expect(makeDecision).toMatch(/Only the main agent may execute user-facing Talk, Grill, or Clarify/i);
    expect(makeDecision).toMatch(/Talk must cover both architecture direction and product journey or user outcome/i);
    for (const skill of [makeDecision, buildSpec, buildPlan]) {
      expect(skill).toMatch(/wait for the user's actual reply before handoff/i);
      expect(skill).toMatch(/without that reply/i);
      expect(skill).toMatch(/in_progress.*pending/i);
    }
  });

  it("requires a finding-by-finding handoff summary in the two downstream design stages", () => {
    for (const skill of [buildSpec, buildPlan]) {
      expect(skill).toMatch(/Before handoff, the main agent must present a plain-language disposition summary for every finding/i);
      expect(skill).toMatch(/finding_id.*original fact.*consequence.*status.*next_action.*evidence_ref.*owner.*consumer.*retain_or_delete/i);
      expect(skill).toMatch(/record the same rows in the existing Task completion area.*risk-acceptance\/missing-items consumers/i);
    }
  });

  it("asks only direction-changing questions and never invents user decisions", () => {
    expect(makeDecision).toMatch(/Ask only questions whose answers could change direction/i);
    expect(makeDecision).toMatch(/Do not invent user answers/i);
    expect(talk).toMatch(/一次只问一个问题/);
    expect(talk).toMatch(/只把用户实际给出的回复当作回答/);
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
    expect(buildSpec).toMatch(/Unresolved material ambiguity stops a ready-for-review or ready-for-handoff claim/i);
    expect(buildSpec).toMatch(/does not prohibit continuing to draft, investigate, or repair/i);
  });

  it("requires a current-material revision note and reruns only quality work affected by a material change", () => {
    expect(buildSpec).toMatch(/current-material revision note/i);
    expect(buildSpec).toMatch(/only when the change materially alters what the prior review covered/i);
    expect(buildSpec).toMatch(/Never loop reviews to manufacture a pass/i);
  });
});
