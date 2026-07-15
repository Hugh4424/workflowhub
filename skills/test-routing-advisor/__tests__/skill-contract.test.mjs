import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { routeTests } from "../scripts/route.mjs";

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

describe("test-routing-advisor executable", () => {
  const now = () => new Date("2026-07-14T00:00:00Z");
  it("routes docs, feature and cross-boundary changes", () => {
    expect(routeTests({ changed_files: ["docs/guide.md"] }, now).routing_tier).toBe("simple");
    expect(routeTests({ changed_files: ["core/widget.mjs"] }, now).routing_tier).toBe("feature");
    expect(routeTests({ changed_files: ["web/view.ts", "api/schema.ts"] }, now).routing_tier).toBe("fullstack");
  });
  it("fails conservatively for invalid input", () => {
    expect(routeTests({}, now)).toMatchObject({ routing_tier: "fullstack", result: "fail" });
  });
});
