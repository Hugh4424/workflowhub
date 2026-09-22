import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { validateStepManifest } from "../../runtime/stage/step-manifest.mjs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("post-cohort downstream material consumption", () => {
  for (const stage of ["build-code", "verify-code"]) {
    it(`${stage} reads physical Phase authority while retaining pre/history`, () => {
      const skill = read(`workflows/${stage}/SKILL.md`);
      const manifest = JSON.parse(read(`workflows/${stage}/steps.json`));
      const deps = yaml.load(read(`workflows/${stage}/skill-deps.yaml`));
      const first = JSON.stringify(manifest.steps[0].entry_conditions);

      expect(skill).toContain("phases/P<n>.md");
      expect(skill).toContain("phases/index.md");
      expect(skill).toMatch(/pre\/history[\s\S]*plan\.md[\s\S]*tasks\.md/i);
      expect(first).toContain("phases/index.md");
      expect(first).toContain("phases/P<n>.md");
      expect(first).not.toContain('"uri_or_path":"plan.md"');
      expect(first).not.toContain('"uri_or_path":"tasks.md"');
      expect(validateStepManifest(manifest)).toMatchObject({ ok: true });

      const materialInputs = deps.skills.flatMap(({ consumer }) => consumer?.inputs ?? []).filter((input) => input.startsWith("artifacts."));
      expect(materialInputs).toContain("artifacts.phases/index.md");
      expect(materialInputs).toContain("artifacts.phases/P<n>.md");
      expect(materialInputs).not.toContain("artifacts.plan.md");
      expect(materialInputs).not.toContain("artifacts.tasks.md");
    });
  }

  it("verify-code samples the original requirement through delivered evidence", () => {
    const skill = read("workflows/verify-code/SKILL.md");
    expect(skill).toMatch(/母 PRD\/原始需求[\s\S]*decision-log[\s\S]*spec\.md[\s\S]*FR\/AC[\s\S]*phases\/P<n>\.md[\s\S]*测试\/质量证据/);
    expect(skill).toMatch(/逐项抽查[\s\S]*missing/);
    expect(skill).toMatch(/不重写上游材料[\s\S]*不重复运行已执行测试/);
  });
});
