import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

const readStage = (stage) => readFileSync(new URL(`../workflows/${stage}/SKILL.md`, import.meta.url), "utf8");
const hasAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

describe("non-code review policy", () => {
  it("keeps planning advisories stage-owned and wh-review as the provider review", () => {
    const buildSpec = yaml.load(readFileSync(new URL("../workflows/build-spec/skill-deps.yaml", import.meta.url), "utf8"));
    const buildPlan = yaml.load(readFileSync(new URL("../workflows/build-plan/skill-deps.yaml", import.meta.url), "utf8"));
    const buildCode = yaml.load(readFileSync(new URL("../workflows/build-code/skill-deps.yaml", import.meta.url), "utf8"));
    const verifyCode = yaml.load(readFileSync(new URL("../workflows/verify-code/skill-deps.yaml", import.meta.url), "utf8"));
    expect(buildSpec.skills.map((entry) => entry.name)).toEqual([
      "spec-research", "spec-clarify",
      "spec-specify", "simplicity-guard", "plan-ceo-review",
      "ui-project-init", "design-source-readiness",
      "plan-design-review", "wh-review", "spec-analyze",
    ]);
    expect(buildPlan.skills.map((entry) => entry.name)).toEqual([
      "spec-research", "spec-plan", "simplicity-guard", "plan-eng-review",
      "testing-system-blueprint",
      "frontend-component-quality",
      "test-routing-advisor", "spec-tasks", "spec-analyze", "wh-review",
    ]);
    expect(buildCode.skills.map((entry) => entry.name)).toEqual([
      "test-routing-advisor", "backend-testing", "frontend-testing",
      "frontend-component-quality", "fullstack-slice-testing", "wh-review", "spec-analyze",
    ]);
    expect(verifyCode.skills.map((entry) => entry.name)).toEqual(["dsh-code-review", "frontend-component-quality", "wh-review"]);
    for (const manifest of [buildSpec, buildPlan, buildCode, verifyCode]) {
      expect(manifest.skills.map((entry) => entry.name)).toContain("wh-review");
      expect(manifest.skills.every((entry) => entry.owner === "stage")).toBe(true);
      expect(manifest.skills.every((entry) => !("invocation" in entry) && !("dispatch" in entry))).toBe(true);
      expect([...manifest.runtime_capabilities, ...manifest.external_capabilities]
        .every((entry) => entry.absence_semantics === "diagnostic")).toBe(true);
    }
  });

  it.each(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"])("%s keeps review as quality evidence, not work permission", (stage) => {
    const skill = readStage(stage);
    expect(hasAny(skill, [
      /review is a quality fact/i,
      /review[^.\n]*(?:quality fact|质量事实)/i,
      /review fact/i,
    ]), `${stage}: review is evidence`).toBe(true);
    expect(hasAny(skill, [
      /not permission to continue working/i,
      /not permission to\s+continue working/i,
      /not\s+permission to continue working/i,
      /not a progression gate/i,
      /limit only the completion claim/i,
      /does not prohibit code or material repair/i,
      /缺质量事实只限制完成声明，不限制继续验收和修复/,
    ]), `${stage}: review does not license or block work`).toBe(true);
    expect(skill).toContain("unavailable");
    expect(skill).toContain("pass");
  });

  it("keeps planning context and evidence maps optional", () => {
    const matrix = JSON.parse(readFileSync(new URL("../runtime/review/stage-materials.json", import.meta.url), "utf8"));
    const rules = [
      matrix.stages["make-decision"].tracks.detail,
      matrix.stages["build-spec"],
      matrix.stages["build-plan"],
    ];
    for (const rule of rules) {
      expect(rule.v2_required_maps).toEqual([]);
      expect(rule.optional).toEqual(expect.arrayContaining(["context_map", "evidence_map"]));
      expect(rule.required).not.toEqual(expect.arrayContaining(["context_map", "evidence_map"]));
    }
  });

  it("does not require snapshot, replacement, or continuation controls in review materials", () => {
    const matrix = JSON.parse(readFileSync(new URL("../runtime/review/stage-materials.json", import.meta.url), "utf8"));
    const serialized = JSON.stringify(matrix).toLowerCase();

    for (const retiredControl of [
      "snapshot",
      "checkpoint",
      "replacement",
      "continuation",
      "successor",
      "rebind",
    ]) {
      expect(serialized, retiredControl).not.toContain(retiredControl);
    }
  });

  it("keeps unavailable review visible while same-task work continues", () => {
    for (const stage of ["build-spec", "build-plan", "build-code", "verify-code"]) {
      const skill = readStage(stage);
      expect(skill).toContain("unavailable");
      expect(skill).toMatch(/same task|same-task|同一 task/i);
    }
    expect(readStage("build-plan")).toMatch(/does not create a new task/i);
    expect(readStage("build-code")).toMatch(/never require a new task/i);
    expect(readStage("verify-code")).toMatch(/回同一 task 修复，不新建任务/);
  });
});
