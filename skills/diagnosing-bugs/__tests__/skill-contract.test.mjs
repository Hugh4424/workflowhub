import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

describe("diagnosing-bugs contract", () => {
  it("requires evidence before fixes", () => {
    expect(skill).toContain("没有根因证据，不改代码");
    expect(skill).toContain("3–5");
    expect(skill).toContain("一次只测一个变量");
  });

  it("contains no framework runtime dependency", () => {
    expect(skill).not.toMatch(/~\/(?:\.claude|\.codex|\.gstack)/);
    expect(skill).not.toContain("superpowers:test-driven-development");
  });
});

