import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(new URL("..", import.meta.url).pathname);

describe("design stage operator order", () => {
  it.each(["build-spec", "build-plan"])("documents the only safe %s sequence", (stage) => {
    const skill = readFileSync(resolve(root, "workflows", stage, "SKILL.md"), "utf8");
    const procedure = skill.slice(skill.indexOf("## Procedure"), skill.indexOf("## Metrics capability"));
    expect(procedure).toMatch(/(?:draft|草稿)[\s\S]*(?:initial review|初审)[\s\S]*(?:at most one|最多一次)[^\n]*(?:revision review|修订复审)[\s\S]*(?:one final|一次正式)[^\n]*(?:create-only receipt|receipt)/i);
    expect(skill).toMatch(/normal path[\s\S]*(?:must not|不得)[^\n]*(?:revision receipt|receipt revision)/i);
  });
});
