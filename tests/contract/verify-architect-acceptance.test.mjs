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
  it("declares one OCR review before repair and a conditional Architect fallback", () => {
    const deps = yaml.load(read("workflows/verify-code/skill-deps.yaml"));
    expect(deps.skills.map(({ name }) => name)).toEqual(["frontend-component-quality", "stage-reflection"]);
    expect(deps.external_capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "ocr-cli", required_when: "code_review" }),
    ]));
    const steps = JSON.parse(read("workflows/verify-code/steps.json")).steps;
    const evidenceKind = (step, kind) => step.completion_evidence.some((entry) => entry.kind === kind);
    const reviewStep = steps.find((step) => step.step_slug === "ocr-code-review");
    const publishStep = steps.find((step) => step.step_slug === "publish-code-review-fact");
    const repairIndexes = steps.flatMap((step, index) => evidenceKind(step, "repair") ? [index] : []);

    expect(steps.filter((step) => step.step_slug === "ocr-code-review")).toHaveLength(1);
    expect(reviewStep).toMatchObject({ order: 2, depends_on: [1], completion_evidence: expect.arrayContaining([
      { kind: "review", uri_or_path: "quality/reviews/results/" },
      { kind: "review", uri_or_path: "quality/reviews/attempts/<attempt_id>/attempt.json" },
    ]) });
    expect(publishStep).toMatchObject({ order: 3, depends_on: [2] });
    expect(publishStep.observable_result).toContain("receipts.quality_review");
    expect(repairIndexes).toHaveLength(2);
    expect(steps.indexOf(reviewStep)).toBeLessThan(steps.indexOf(publishStep));
    expect(steps.indexOf(publishStep)).toBeLessThan(repairIndexes[0]);
    expect(repairIndexes[0]).toBeLessThan(repairIndexes[1]);
    expect(reviewStep.observable_result).toMatch(/OCR.*独立代码审查/);
    const skill = read("workflows/verify-code/SKILL.md");
    expect(skill).toMatch(/工具 `unavailable` 且零成功审查路时[\s\S]*恰好调用一次[\s\S]*architect-code-review/);
    expect(skill).toMatch(/旧 wh-review\/broker 只读，不充当替代审查/);
  });

  it("keeps the current OCR packet and historical wh-review material contract distinct", () => {
    const verify = JSON.parse(read("runtime/review/stage-materials.json")).stages["verify-code"];
    expect(verify.required).toEqual(expect.arrayContaining([
      "changed_files", "implementation_assessment", "test_context", "open_risks", "review_instructions",
    ]));
    expect(verify.v2_required_maps).toEqual([]);
    const contract = read("skills/wh-review/contracts/verify-code.md");
    expect(contract).toMatch(/异源代码审查|independent.*code/i);
    // Keep the historical material-contract coverage without treating it as today's dispatch path.
    expect(contract).toMatch(/不是材料审计/);
    expect(contract).toMatch(/unavailable[\s\S]{0,120}(?:incomplete|缺事实)/i);
    const skill = read("workflows/verify-code/SKILL.md");
    expect(skill).toMatch(/review --action=record` 派发一次 OCR delegation/);
    expect(skill).toMatch(/当前 diff、完整 AC 文本、真实入口和 `reviewed_execution/);
    expect(skill).toMatch(/4\. \*\*正式发布\*\*：[^\n]*`receipts\.quality_review`[^\n]*OCR canonical result_ref、unavailable attempt_ref[^\n]*Architect canonical result_ref[^\n]*`code_review`/);
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
    expect(skill).toMatch(/不为得到空 findings 或补齐证据再次调用|不派发第二次代码审查/);
    // The governed wording moved from "不要求…证据" to "不再要求用户重复…" plus
    // "不要要求用户补交 verify-code 证据". Keep the frozen expectation in sync with the
    // real requirement instead of loosening it: the stage must not demand evidence
    // from the user, and the assertion stays bounded to one sentence.
    expect(skill).toMatch(/不要?要求用户补交[^。]{0,20}证据/);
  });

  it("keeps DeepSeek quality lenses inside one code-review invocation", () => {
    const skill = read("skills/architect-code-review/SKILL.md");
    for (const lens of ["dsh-find-simplifications", "dsh-doc-standards", "dsh-prose-standard", "dsh-trim-cot-leakage"]) {
      expect(skill).toContain(lens);
    }
    expect(skill).toMatch(/本技能不生成正式 `code_review` 或 review receipt，也不触发另一次正式审查/);
    expect(skill).toMatch(/可选的 Architect 诊断不触发额外正式审查轮次/);
    expect(skill).toMatch(/push、merge 和发布.*独立操作/);
    expect(skill).toMatch(/无 consumer|没有真实 consumer/);
    expect(skill).toMatch(/不创建额外记录/);
  });

  it("keeps the verify lens order while reading the existing Phase review result by ref", () => {
    const handlers = read("runtime/stage/stage-handlers.mjs");
    const route = read("runtime/review/review-record-route.mjs");
    const verify = JSON.parse(read("runtime/review/stage-materials.json")).surfaces["verify-code"];
    expect(handlers).toMatch(/readPhaseReviewResultRef/);
    expect(handlers).toMatch(/partitionVerifyReviewConclusions/);
    expect(route).toMatch(/review_result_ref|result_ref/);
    expect(verify.problem_order).toEqual(["implementation", "consumer", "correctness", "lifecycle_security", "test_strength"]);
  });
});
