import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const readStage = (stage) => readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8");
const readSkill = (skill) => readFileSync(join(root, "skills", skill, "SKILL.md"), "utf8");
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));

describe("v2 human boundary summaries", () => {
  it("all stages present their result or boundary to the human", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(readStage(stage)).toMatch(/present|human|user|用户|人工/i);
    }
  });

  it("keeps automatic verification separate from irreversible close authorization", () => {
    const verifyCode = readStage("verify-code");
    const steps = readJson("workflows/verify-code/steps.json").steps;
    const finalize = steps.find(({ step_slug }) => step_slug === "finalize-code-review");
    const handoff = steps.find(({ step_slug }) => step_slug === "publish-verification-result");

    expect(finalize.observable_result).toMatch(/自动|不再等待重复人工确认/i);
    expect(handoff.observable_result).toMatch(/close[\s\S]*(?:独立|separate)/i);
    expect(steps.some(({ step_slug }) => /authorize|commit|push|merge|archive|cleanup/i.test(step_slug))).toBe(false);
    expect(verifyCode).toMatch(/不(?:再)?要求用户重复[\s\S]{0,120}(?:Talk\/Grill|确认)/i);
    expect(verifyCode).toMatch(/(?:close|commit|push|merge|archive|cleanup)[\s\S]{0,140}(?:独立|separate)|(?:独立|separate)[\s\S]{0,140}(?:close|commit|push|merge|archive|cleanup)/i);
  });

  it("review records preserve real provider outcomes and provenance", () => {
    const review = readSkill("wh-review");
    const attempt = readJson("runtime/review/schemas/attempt.schema.json");
    const result = readJson("runtime/review/schemas/result.schema.json");

    expect(attempt.required).toEqual(expect.arrayContaining([
      "material_id", "provider_attempts", "terminal_status", "error",
    ]));
    expect(attempt.properties.provider_attempts.items.required).toEqual(expect.arrayContaining([
      "provider", "status", "session_id", "runtime_id", "output_ref", "error",
    ]));
    expect(result.required).toEqual(expect.arrayContaining([
      "source", "snapshot_tree", "material_id", "attempt_ref", "provider_results", "findings", "adjudication",
    ]));
    expect(result.properties.provider_results.items.required).toEqual(expect.arrayContaining(["provider", "output"]));
    expect(review).toMatch(/real public result and provenance|真实[^\n]*provenance/i);
    expect(review).toMatch(/unavailable[\s\S]{0,80}(?:never|绝不|不能)[\s\S]{0,30}pass/i);
  });
});
