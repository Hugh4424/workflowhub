import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

describe("test-routing-advisor contract", () => {
  it("defines all three tiers and the complete output contract", () => {
    for (const value of ["simple", "feature", "fullstack", "routing_rationale", "result", "ts"]) {
      expect(skill).toContain(value);
    }
  });

  it("is advisory and fail-loud", () => {
    expect(skill).toContain("禁止执行测试");
    expect(skill).toContain("result: fail");
  });
});

