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
  it("declares the fixed four-step order and one provider skill", () => {
    const deps = yaml.load(read("workflows/verify-code/skill-deps.yaml"));
    expect(deps.skills.map(({ name }) => name)).toEqual(["wh-review"]);
    const steps = JSON.parse(read("workflows/verify-code/steps.json")).steps;
    expect(steps.map(({ step_slug }) => step_slug).slice(0, 7)).toEqual([
      "read-current-materials-and-code",
      "architect-acceptance-review",
      "main-agent-repair-batch-1",
      "run-declared-check-before-independent-review",
      "run-one-independent-architecture-review",
      "main-agent-repair-batch-2",
      "run-final-check-and-handoff",
    ]);
    expect(steps.filter(({ step_slug }) => step_slug.includes("independent-review"))).toHaveLength(1);
  });

  it("keeps the external packet short and does not require replay maps", () => {
    const verify = JSON.parse(read("runtime/review/stage-materials.json")).stages["verify-code"];
    expect(verify.required).toEqual([
      "acceptance_criteria", "architect_assessment", "final_test_summary", "open_risks", "review_instructions",
    ]);
    expect(verify.v2_required_maps).toEqual([]);
    expect(read("skills/wh-review/contracts/verify-code.md")).toMatch(/不是第二套证据审计/);
    expect(read("skills/wh-review/contracts/verify-code.md")).toMatch(/不重复调用 provider/);
    expect(read("skills/wh-review/SKILL.md")).toMatch(/one bounded post-repair architect review/);
    expect(read("skills/wh-review/SKILL.md")).not.toMatch(/verify-code.*acceptance_evidence.*context_map.*evidence_map/s);
    expect(read("skills/wh-review/scripts/review-materials.mjs")).toMatch(/one bounded post-repair architect review/);
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

  it("keeps requirement replay optional and forbids a review loop", () => {
    const skill = read("workflows/verify-code/SKILL.md");
    expect(skill).toMatch(/requirement replay/);
    expect(skill).toMatch(/可选审计事实/);
    expect(skill).toMatch(/不因 provider verdict.*反复循环/);
    expect(skill).toMatch(/证据缺失不能算 pass/);
  });
});
