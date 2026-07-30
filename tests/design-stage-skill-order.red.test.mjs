import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(new URL("..", import.meta.url).pathname);

describe("design stage operator order", () => {
  it.each(["build-spec", "build-plan"])("reviews %s once and resolves repairs without another provider review", (stage) => {
    const skill = readFileSync(resolve(root, "workflows", stage, "SKILL.md"), "utf8");
    const procedure = skill.slice(skill.indexOf("## Procedure"), skill.indexOf("## Metrics capability"));
    expect(procedure).toMatch(/(?:draft|草稿)[\s\S]*(?:initial[\s\S]{0,30}review|初审)/i);
    expect(procedure).toMatch(/(?:finding|发现)[\s\S]*(?:resolution|聚焦验证|response ledger)/i);
    expect(procedure).toMatch(/(?:create-only receipt|receipt)/i);
    expect(procedure).toMatch(/(?:do not loop reviews|不得循环审查|provider calls remain zero)/i);
    expect(skill).toMatch(/normal path[\s\S]*(?:must not|不得)[^\n]*(?:revision receipt|receipt revision)/i);
  });
});
