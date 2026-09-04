import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const skillPath = resolve(root, "skills/stage-reflection/SKILL.md");
const bundlePath = resolve(root, "skills/stage-reflection/skill-bundle.json");
const workflowPaths = [
  "workflows/make-decision/SKILL.md",
  "workflows/build-spec/SKILL.md",
  "workflows/build-plan/SKILL.md",
  "workflows/build-code/SKILL.md",
  "workflows/verify-code/SKILL.md",
  "docs/standard-workflow.md",
];
const stageEndRoute = "run --action=reflect";

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

describe("stage-reflection skill contract", () => {
  it("declares the v2 six-block judgment protocol and a valid bundle", () => {
    const skill = readFileSync(skillPath, "utf8");
    const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));

    for (const phrase of [
      "当前 session memory",
      "lessons/",
      "current stage step/skill outcome",
      "what_helped",
      "what_to_improve",
      "blockers",
      "intervention_reasons",
      "what_to_simplify",
      "simplifiable_now",
      "evidence_refs",
      "confidence",
      "unknown_reason",
      "not_applicable",
      "none_observed",
      "runtime/schemas/stage-reflection.v2.json",
      "validate-stage-reflection.mjs",
      "derive-consumption-edges.mjs",
      "deriveConsumptionEdges",
      "consumer_scan",
      "coverage_status",
      "zero_consumption_proof",
      "consumption_status",
      "needs_evidence",
      "judgment != fact",
      stageEndRoute,
    ]) {
      expect(skill, `missing protocol anchor: ${phrase}`).toContain(phrase);
    }

    expect(skill).toContain("不读取完整 transcript");
    expect(skill).toMatch(/不读(?:四份|四个)材料(?:全文)?/);
    expect(skill).toContain("`validateReflectionValue` 内部调用 `deriveConsumptionEdges`");
    expect(skill).not.toContain("调用 `tools/cli/derive-consumption-edges.mjs`");
    expect(skill).not.toContain("执行 `tools/cli/derive-consumption-edges.mjs`");
    expect(skill).toContain("coverage_status=complete");
    expect(skill).toContain("consumption_status");
    expect(skill).toContain("zero_consumption_proof");
    expect(bundle).toMatchObject({ schema_version: 1, skill: "stage-reflection" });
    expect(bundle.files).toEqual(expect.arrayContaining(["SKILL.md"]));
  });

  it.each(workflowPaths)("documents the stage-end reflection route in %s", (path) => {
    const document = read(path);
    expect(document, `${path} must name the stage-end reflection instruction`).toContain(stageEndRoute);
    expect(document, `${path} must require judgment JSON`).toMatch(/judgment JSON|判断 JSON/);
    expect(document, `${path} must name the six structured blocks`).toMatch(/six structured blocks|六个结构化区块|六个结构化区块/);
  });
});

export { workflowPaths };
