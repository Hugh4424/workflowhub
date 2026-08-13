import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

import { validateVerifyReviewCycle } from "../../runtime/evidence/canonical-receipt-writer.mjs";

const read = (path) => readFileSync(path, "utf8");
const validCycle = () => ({
  protocol: "architect-once-repair-once-review-once-repair-once",
  steps: [
    { step: "architect_review", status: "completed", note: "需求、架构、实现和 AC 已检查" },
    { step: "main_repair_1", status: "applied", note: "修复第一批真实问题" },
    { step: "independent_review", status: "completed", note: "异源审查一次" },
    { step: "main_repair_2", status: "not_needed", note: "没有新的有效修复项" },
  ],
  conclusion: "passed",
});

describe("verify-code bounded architect acceptance", () => {
  it("declares one independent review between two bounded repair opportunities", () => {
    const deps = yaml.load(read("workflows/verify-code/skill-deps.yaml"));
    expect(deps.skills.map(({ name }) => name)).toEqual(["wh-review", "spec-analyze"]);
    const steps = JSON.parse(read("workflows/verify-code/steps.json")).steps;
    const evidenceKind = (step, kind) => step.completion_evidence.some((entry) => entry.kind === kind);
    const reviewIndexes = steps.flatMap((step, index) => evidenceKind(step, "review") ? [index] : []);
    const repairIndexes = steps.flatMap((step, index) => evidenceKind(step, "repair") ? [index] : []);

    expect(reviewIndexes).toHaveLength(1);
    expect(repairIndexes).toHaveLength(2);
    expect(repairIndexes[0]).toBeLessThan(reviewIndexes[0]);
    expect(reviewIndexes[0]).toBeLessThan(repairIndexes[1]);
    expect(steps[reviewIndexes[0]].observable_result).toMatch(/异源|independent/i);
  });

  it("keeps the independent-review packet focused on current acceptance facts", () => {
    const verify = JSON.parse(read("runtime/review/stage-materials.json")).stages["verify-code"];
    expect(verify.required).toEqual(expect.arrayContaining([
      "acceptance_criteria", "architect_assessment", "final_test_summary", "open_risks", "review_instructions",
    ]));
    expect(verify.v2_required_maps).toEqual([]);
    const contract = read("skills/wh-review/contracts/verify-code.md");
    expect(contract).toMatch(/异源架构验收|independent.*architect/i);
    expect(contract).toMatch(/(?:只调用[\s\S]{0,50}wh-review[\s\S]{0,30}一次)|(?:wh-review[\s\S]{0,50}once)/i);
    expect(contract).toMatch(/unavailable[\s\S]{0,120}(?:incomplete|缺事实)/i);
  });

  it("accepts one architect review, one independent review and two repair slots", () => {
    expect(validateVerifyReviewCycle(validCycle())).toMatchObject({ conclusion: "passed", steps: [{ step: "architect_review" }, { step: "main_repair_1" }, { step: "independent_review" }, { step: "main_repair_2" }] });
    expect(() => validateVerifyReviewCycle({ ...validCycle(), steps: validCycle().steps.slice(0, 3) })).toThrow(/review_cycle/i);
    expect(() => validateVerifyReviewCycle({ ...validCycle(), steps: [{ step: "independent_review", status: "completed", note: "错序" }, ...validCycle().steps.slice(1) ] })).toThrow(/out of order/i);
    expect(() => validateVerifyReviewCycle({ ...validCycle(), steps: validCycle().steps.map((entry) => ({ ...entry, note: "" })) })).toThrow(/review_cycle/i);
  });

  it("does not turn an unavailable independent review into a pass", () => {
    const unavailable = { ...validCycle(), steps: validCycle().steps.map((entry) => entry.step === "independent_review" ? { ...entry, status: "unavailable", note: "provider unavailable" } : entry) };
    expect(() => validateVerifyReviewCycle(unavailable)).toThrow(/cannot be passed/i);
    expect(validateVerifyReviewCycle({ ...unavailable, conclusion: "incomplete" }).conclusion).toBe("incomplete");
    expect(() => validateVerifyReviewCycle({ ...unavailable, conclusion: "failed" })).toThrow(/unavailable/i);
  });

  it("requires semantic reverse checking and forbids a review loop", () => {
    const skill = read("workflows/verify-code/SKILL.md");
    expect(skill).toMatch(/语义反向检查/);
    expect(skill).toMatch(/每个适用\s*AC|every applicable acceptance criterion/i);
    expect(skill).toMatch(/(?:不再开启新的\s*review\s*轮)|(?:不因[\s\S]{0,80}verdict[\s\S]{0,80}反复循环)/i);
    expect(skill).toMatch(/证据缺失不能算\s*`?pass`?/i);
  });
});
