import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { checkSkillClosure } from "../check-skill-closure.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture({ prompt = "Use `skills/demo/SKILL.md`.", manifestSkill = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-closure-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.mkdirSync(path.join(root, "schemas"), { recursive: true });
  fs.mkdirSync(path.join(root, "skills/demo"), { recursive: true });
  fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
  fs.writeFileSync(path.join(root, "config/workflowhub.yaml"), "registry:\n  - path: workflows/stage/SKILL.md\n");
  for (const name of ["skill-catalog", "stage-skill-deps", "skill-bundle", "review-bundle"]) {
    fs.copyFileSync(new URL(`../../schemas/${name}.schema.json`, import.meta.url), path.join(root, `schemas/${name}.schema.json`));
  }
  fs.writeFileSync(path.join(root, "skills/catalog.yaml"), "schema_version: 2\nlast_reviewed_at: '2026-07-14'\nprojects: {}\nskills:\n  - { name: demo, path: skills/demo/SKILL.md, status: native, purpose: test, design_idea: fixture, used_by_stages: [stage], upstream: [], local_changes: local, dependency_closure: [skills/demo], update_policy: manual }\ncapability_decisions:\n  - { name: fixture, status: rejected, purpose: fixture, design_idea: fixture, used_by_stages: [], local_path: null, upstream: [], local_changes: rejected, dependency_closure: [], update_policy: none }\n");
  fs.writeFileSync(path.join(root, "skills/demo/SKILL.md"), "# demo\n");
  fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["SKILL.md"] }));
  fs.writeFileSync(path.join(root, "workflows/stage/SKILL.md"), prompt);
  fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), manifestSkill
    ? "stage: stage\nskills:\n  - { name: demo, path: skills/demo/SKILL.md, execution: inline, invocation: always, trigger: always, bundle: skills/demo/skill-bundle.json }\nruntime_capabilities: []\nexternal_capabilities: []\n"
    : "stage: stage\nskills: []\nruntime_capabilities: []\nexternal_capabilities: []\n");
  return root;
}

it("accepts a closed repository-local stage manifest", () => {
  expect(checkSkillClosure(fixture())).toEqual({ ok: true, errors: [] });
});

it("fails when a prompt bypasses its manifest", () => {
  const result = checkSkillClosure(fixture({ manifestSkill: false }));
  expect(result.ok).toBe(false);
  expect(result.errors.join("\n")).toMatch(/prompt references undeclared skill demo/);
});

it("fails user-local and external framework locators", () => {
  const result = checkSkillClosure(fixture({ prompt: "Load /Users/me/.claude/skills/demo/SKILL.md" }));
  expect(result.ok).toBe(false);
  expect(result.errors.join("\n")).toMatch(/forbidden external/);
});
