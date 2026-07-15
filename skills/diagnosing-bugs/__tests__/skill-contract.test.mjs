import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateDiagnosis } from "../scripts/validate-diagnosis.mjs";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

describe("diagnosing-bugs contract", () => {
  it("requires evidence before fixes", () => {
    expect(skill).toContain("没有根因证据，不改代码");
    expect(skill).toContain("3–5");
    expect(skill).toContain("一次只测一个变量");
  });

  it("contains no framework runtime dependency", () => {
    expect(skill).not.toMatch(/~\/(?:\.claude|\.codex|\.gstack)/);
    expect(skill).not.toContain("superpowers:test-driven-development");
  });
});

it("forbids a fix until reproduction, hypotheses and probe evidence exist", () => {
  expect(validateDiagnosis({ fix: "patch" }).valid).toBe(false);
  expect(validateDiagnosis({ reproduction: "fails", hypotheses: ["a", "b", "c"], confirmed_root_cause: "b", probe_evidence: "probe changed only b", fix: "patch" }).valid).toBe(true);
});
