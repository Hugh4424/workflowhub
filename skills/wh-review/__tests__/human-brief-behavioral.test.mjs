import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const readStage = (stage) => readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8");
const readSkill = (skill) => readFileSync(join(root, "skills", skill, "SKILL.md"), "utf8");

describe("v2 human boundary summaries", () => {
  it("all stages present their result or boundary to the human", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(readStage(stage)).toMatch(/present|human|user|用户|人工/i);
    }
  });

  it("keeps verification confirmation separate from irreversible close authorization", () => {
    const verifyCode = readStage("verify-code");
    expect(verifyCode).toMatch(/confirmation accepts only this verification conclusion/i);
    expect(verifyCode).toMatch(/does\s+not\s+authorize[\s\S]*irreversible action/i);
    expect(verifyCode).toMatch(/separate explicit authorization/i);
  });

  it("review briefs report real provider facts without inventing metrics", () => {
    const review = readSkill("wh-review");
    expect(review).toMatch(/actual providers[\s\S]*aggregate verdict[\s\S]*important findings/i);
    expect(review).toMatch(/duration\s+and\s+token\s+usage/i);
    expect(review).toMatch(/formal provider\/runtime result[\s\S]{0,220}not provided/i);
    expect(review).toMatch(/never estimate[\s\S]*rerun an unchanged review/i);
  });
});
