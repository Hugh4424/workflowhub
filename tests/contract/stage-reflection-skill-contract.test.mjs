import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const skillPath = resolve(root, "skills/stage-reflection/SKILL.md");
const bundlePath = resolve(root, "skills/stage-reflection/skill-bundle.json");

describe("stage-reflection skill contract", () => {
  it("declares the bounded stage-end protocol and a valid bundle", () => {
    const skill = readFileSync(skillPath, "utf8");
    const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));

    for (const phrase of [
      "当前 session memory",
      "lessons/",
      "current stage step/skill outcome",
      "derive-consumption-edges.mjs",
      "append-lesson-observation.mjs",
      "validate-stage-reflection.mjs",
      "keep|optimize|simplify|merge|remove_candidate|add|needs_evidence",
      "status:failed",
      "status:degraded",
      "merged_lesson",
      "reply_text=null",
      "judgment != fact",
      "subject_id",
      "subject_kind",
      "runtime/schemas/stage-reflection.v1.json",
    ]) {
      expect(skill, `missing protocol anchor: ${phrase}`).toContain(phrase);
    }

    expect(skill).toMatch(/(?:不读|不得读取)完整 transcript/);
    expect(skill).toMatch(/不读(?:四份|四个)材料(?:全文)?/);
    expect(bundle).toMatchObject({ schema_version: 1, skill: "stage-reflection" });
    expect(bundle.files).toEqual(expect.arrayContaining(["SKILL.md"]));
  });
});
