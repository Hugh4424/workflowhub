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

describe("verify-code bounded code review", () => {
  it("declares one independent code review between two bounded repair opportunities", () => {
    const deps = yaml.load(read("workflows/verify-code/skill-deps.yaml"));
    expect(deps.skills.map(({ name }) => name)).toEqual(["dsh-code-review", "frontend-component-quality", "wh-review", "stage-reflection"]);
    const steps = JSON.parse(read("workflows/verify-code/steps.json")).steps;
    const evidenceKind = (step, kind) => step.completion_evidence.some((entry) => entry.kind === kind);
    const reviewStep = steps.find((step) => step.step_slug === "run-one-independent-code-review");
    const repairIndexes = steps.flatMap((step, index) => evidenceKind(step, "repair") ? [index] : []);

    expect(reviewStep).toBeDefined();
    expect(repairIndexes).toHaveLength(2);
    expect(repairIndexes[0]).toBeLessThan(steps.indexOf(reviewStep));
    expect(steps.indexOf(reviewStep)).toBeLessThan(repairIndexes[1]);
    expect(reviewStep.observable_result).toMatch(/代码|code|异源|independent/i);
  });

  it("keeps the independent-review packet focused on current acceptance facts", () => {
    const verify = JSON.parse(read("runtime/review/stage-materials.json")).stages["verify-code"];
    expect(verify.required).toEqual(expect.arrayContaining([
      "changed_files", "implementation_assessment", "test_context", "open_risks", "review_instructions",
    ]));
    expect(verify.v2_required_maps).toEqual([]);
    const contract = read("skills/wh-review/contracts/verify-code.md");
    expect(contract).toMatch(/异源代码审查|independent.*code/i);
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
    expect(skill).toMatch(/代码审查|code review/i);
    expect(skill).toMatch(/真实入口|real entry/i);
    expect(skill).toMatch(/不再开启(?:新的|第三轮)?\s*review|do not.*repeat.*review/i);
    expect(skill).toMatch(/不要求.*证据|not.*evidence/i);
  });

  it("keeps DeepSeek quality lenses inside one code-review invocation", () => {
    const skill = read("skills/dsh-code-review/SKILL.md");
    for (const lens of ["dsh-find-simplifications", "dsh-doc-standards", "dsh-prose-standard", "dsh-trim-cot-leakage"]) {
      expect(skill).toContain(lens);
    }
    expect(skill).toMatch(/不新增 skill dispatch、provider 调用、receipt、控制面或 verify-code 轮次/);
    expect(skill).toMatch(/push、merge 和发布.*独立操作/);
    expect(skill).toMatch(/无 consumer|没有真实 consumer/);
    expect(skill).toMatch(/不创建额外记录/);
  });
});
