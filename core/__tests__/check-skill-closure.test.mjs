import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { checkSkillClosure } from "../check-skill-closure.mjs";
import { validateSkillBundle } from "../local-skill-resolver.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture({ prompt = "Use `skills/demo/SKILL.md`.", manifestSkill = true, indirectLens = false } = {}) {
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
  fs.writeFileSync(path.join(root, "skills/catalog.yaml"), "schema_version: 2\nlast_reviewed_at: '2026-07-14'\nprojects: {}\nskills:\n  - { name: demo, path: skills/demo/SKILL.md, local_version: 1.0.0, local_bundle_hash: eec6793d194db66a45a5954cd4fc36797f497ef16097e53ed9c593edb6449bee, last_reviewed_at: '2026-07-14', status: native, purpose: test, design_idea: fixture, used_by_stages: [stage], upstream: [], local_changes: local, dependency_closure: [skills/demo], update_policy: manual }\ncapability_decisions:\n  - { name: fixture, status: rejected, purpose: fixture, design_idea: fixture, used_by_stages: [], local_path: null, upstream: [], local_changes: rejected, dependency_closure: [], update_policy: none }\n");
  fs.writeFileSync(path.join(root, "skills/reuse-registry.md"), "- `demo`\n- `fixture`\n");
  fs.writeFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "# Third-Party Notices\n");
  fs.writeFileSync(path.join(root, "skills/demo/SKILL.md"), "# demo\n");
  fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["SKILL.md"] }));
  fs.writeFileSync(path.join(root, "workflows/stage/SKILL.md"), prompt);
  fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), manifestSkill
    ? "stage: stage\nskills:\n  - { name: demo, path: skills/demo/SKILL.md, execution: inline, invocation: always, trigger: always, bundle: skills/demo/skill-bundle.json }\nruntime_capabilities: []\nexternal_capabilities: []\n"
    : "stage: stage\nskills: []\nruntime_capabilities: []\nexternal_capabilities: []\n");
  if (indirectLens) {
    fs.rmSync(path.join(root, "skills/demo"), { recursive: true, force: true });
    for (const name of ["wh-review", "lens"]) {
      fs.mkdirSync(path.join(root, `skills/${name}`), { recursive: true });
      fs.writeFileSync(path.join(root, `skills/${name}/SKILL.md`), `# ${name}\n`);
      fs.writeFileSync(path.join(root, `skills/${name}/skill-bundle.json`), JSON.stringify({ schema_version: 1, skill: name, files: ["SKILL.md", ...(name === "lens" ? ["review-bundle.json"] : [])] }));
    }
    fs.writeFileSync(path.join(root, "skills/lens/review-bundle.json"), JSON.stringify({ schema_version: 1, skill: "lens", mode: "lens-only", delivery_mode: "file_only", entrypoint: "SKILL.md", files: ["SKILL.md"] }));
    fs.writeFileSync(path.join(root, "skills/wh-review/stage-skill-plan.json"), JSON.stringify({ version: 1, stages: { stage: { required_skills: ["lens"], review_mode: "lens-only", delivery_mode: "file_only" } } }));
    const { bundleHash: whHash } = validateSkillBundle(root, "skills/wh-review/skill-bundle.json", "skills/wh-review/SKILL.md");
    const { bundleHash: lensHash } = validateSkillBundle(root, "skills/lens/skill-bundle.json", "skills/lens/SKILL.md");
    fs.writeFileSync(path.join(root, "skills/catalog.yaml"), `schema_version: 2\nlast_reviewed_at: '2026-07-14'\nprojects: {}\nskills:\n  - { name: wh-review, path: skills/wh-review/SKILL.md, local_version: 1.0.0, local_bundle_hash: ${whHash}, last_reviewed_at: '2026-07-14', status: native, purpose: review, design_idea: fixture, used_by_stages: [stage], upstream: [], local_changes: local, dependency_closure: [skills/wh-review], update_policy: manual }\n  - { name: lens, path: skills/lens/SKILL.md, local_version: 1.0.0, local_bundle_hash: ${lensHash}, last_reviewed_at: '2026-07-14', status: native, purpose: lens, design_idea: fixture, used_by_stages: [stage], upstream: [], local_changes: local, dependency_closure: [skills/lens], update_policy: manual }\ncapability_decisions:\n  - { name: fixture, status: rejected, purpose: fixture, design_idea: fixture, used_by_stages: [], local_path: null, upstream: [], local_changes: rejected, dependency_closure: [], update_policy: none }\n`);
    fs.writeFileSync(path.join(root, "skills/reuse-registry.md"), "- `wh-review`\n- `lens`\n- `fixture`\n");
    fs.writeFileSync(path.join(root, "workflows/stage/SKILL.md"), "Use wh-review.\n");
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\nskills:\n  - { name: wh-review, path: skills/wh-review/SKILL.md, execution: inline, invocation: always, trigger: review, bundle: skills/wh-review/skill-bundle.json }\nruntime_capabilities: []\nexternal_capabilities: []\n");
  }
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

it("accepts wh-review lens-only skills without duplicate stage dispatch", () => {
  expect(checkSkillClosure(fixture({ indirectLens: true }))).toEqual({ ok: true, errors: [] });
});

it("rejects a wh-review stage plan that is not lens-only", () => {
  const root = fixture({ indirectLens: true });
  fs.writeFileSync(path.join(root, "skills/wh-review/stage-skill-plan.json"), JSON.stringify({
    version: 1,
    stages: { stage: { required_skills: ["lens"], review_mode: "execution", delivery_mode: "file_only" } },
  }));
  expect(checkSkillClosure(root).errors.join("\n")).toMatch(/must declare lens-only delivery/);
});
