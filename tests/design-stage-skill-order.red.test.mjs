import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(new URL("..", import.meta.url).pathname);

describe("design stage operator order", () => {
  it.each(["build-spec", "build-plan"])("repeats review only for a changed %s draft until findings close", (stage) => {
    const skill = readFileSync(resolve(root, "workflows", stage, "SKILL.md"), "utf8");
    const procedure = skill.slice(skill.indexOf("## Procedure"), skill.indexOf("## Metrics capability"));
    expect(procedure).toMatch(/(?:draft|草稿)[\s\S]*(?:initial review|初审)[\s\S]*(?:actionable findings|可执行发现)[\s\S]*(?:repeat|重复)[\s\S]*(?:unchanged snapshot\/material|未变化的快照)[\s\S]*(?:create-only receipt|receipt)/i);
    expect(procedure).not.toMatch(/at most one|no third review|最多一次|第三次审查/i);
    expect(skill).toMatch(/normal path[\s\S]*(?:must not|不得)[^\n]*(?:revision receipt|receipt revision)/i);
  });
});
