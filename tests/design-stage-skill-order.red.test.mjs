import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(new URL("..", import.meta.url).pathname);

describe("design stage operator order", () => {
  it.each(["build-spec", "build-plan"])("uses the initial review as a non-gating quality fact for %s", (stage) => {
    const skill = readFileSync(resolve(root, "workflows", stage, "SKILL.md"), "utf8");
    const procedure = skill.slice(skill.indexOf("## Procedure"), skill.indexOf("## Metrics capability"));
    expect(procedure).toMatch(/(?:draft|草稿)[\s\S]*(?:initial review|初审)[\s\S]*(?:actionable findings|可执行发现)[\s\S]*(?:revise[^\n]*directly|直接修改)[\s\S]*(?:at most one|最多一次)[\s\S]*(?:create-only receipt|receipt)/i);
    expect(procedure).toMatch(/(?:low-cost closure review|低成本 closure 审查)/i);
    expect(procedure).toMatch(/(?:no loop|不循环|do not use[\s\S]*loop)/i);
    expect(procedure).toMatch(/(?:block stage acceptance[\s\S]*reviewer verdict|reviewer verdict[\s\S]*blocks? stage acceptance|阻断阶段验收[\s\S]*审查结论)/i);
    expect(procedure).not.toMatch(/repeat for every changed draft|每次修改.*重复审查/i);
    expect(skill).toMatch(/normal path[\s\S]*(?:must not|不得)[^\n]*(?:revision receipt|receipt revision)/i);
  });
});
