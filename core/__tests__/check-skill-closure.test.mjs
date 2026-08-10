import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { afterEach, expect, it } from "vitest";
import { checkSkillClosure } from "../../runtime/evidence/check-skill-closure.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture({
  prompt,
  manifestSkill = true,
  indirectLens = false,
  skillName = "demo",
  stage = "stage",
} = {}) {
  prompt ??= `Use \`skills/${skillName}/SKILL.md\`.`;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-closure-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.mkdirSync(path.join(root, "runtime/schemas"), { recursive: true });
  fs.mkdirSync(path.join(root, `skills/${skillName}`), { recursive: true });
  fs.mkdirSync(path.join(root, `workflows/${stage}`), { recursive: true });
  fs.writeFileSync(path.join(root, "config/workflowhub.yaml"), `registry:\n  - path: workflows/${stage}/SKILL.md\n`);
  for (const name of ["skill-catalog", "stage-skill-deps", "skill-bundle", "review-bundle"]) {
    fs.copyFileSync(new URL(`../../runtime/schemas/${name}.schema.json`, import.meta.url), path.join(root, `runtime/schemas/${name}.schema.json`));
  }
  fs.writeFileSync(path.join(root, "skills/catalog.yaml"), `schema_version: 2\nlast_reviewed_at: '2026-07-14'\nprojects: {}\nskills:\n  - { name: ${skillName}, path: skills/${skillName}/SKILL.md, local_version: 1.0.0, local_bundle_hash: eec6793d194db66a45a5954cd4fc36797f497ef16097e53ed9c593edb6449bee, last_reviewed_at: '2026-07-14', status: native, purpose: test, design_idea: fixture, used_by_stages: [${stage}], upstream: [], local_changes: local, dependency_closure: [skills/${skillName}], update_policy: manual }\ncapability_decisions:\n  - { name: fixture, status: rejected, purpose: fixture, design_idea: fixture, used_by_stages: [], local_path: null, upstream: [], local_changes: rejected, dependency_closure: [], update_policy: none }\n`);
  fs.writeFileSync(path.join(root, "skills/reuse-registry.md"), `- \`${skillName}\`\n- \`fixture\`\n`);
  fs.writeFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "# Third-Party Notices\n");
  fs.writeFileSync(path.join(root, `skills/${skillName}/SKILL.md`), "# demo\n");
  fs.writeFileSync(path.join(root, `skills/${skillName}/skill-bundle.json`), JSON.stringify({ schema_version: 1, skill: skillName, files: ["SKILL.md"] }));
  fs.writeFileSync(path.join(root, `workflows/${stage}/SKILL.md`), prompt);
  fs.writeFileSync(path.join(root, `workflows/${stage}/skill-deps.yaml`), manifestSkill
    ? `stage: ${stage}\nskills:\n  - { name: ${skillName}, path: skills/${skillName}/SKILL.md, execution: inline, trigger: always, bundle: skills/${skillName}/skill-bundle.json, owner: stage }\nruntime_capabilities: []\nexternal_capabilities: []\n`
    : `stage: ${stage}\nskills: []\nruntime_capabilities: []\nexternal_capabilities: []\n`);
  if (indirectLens) {
    fs.rmSync(path.join(root, `skills/${skillName}`), { recursive: true, force: true });
    for (const name of ["wh-review", "lens"]) {
      fs.mkdirSync(path.join(root, `skills/${name}`), { recursive: true });
      fs.writeFileSync(path.join(root, `skills/${name}/SKILL.md`), `# ${name}\n`);
      fs.writeFileSync(path.join(root, `skills/${name}/skill-bundle.json`), JSON.stringify({ schema_version: 1, skill: name, files: ["SKILL.md", ...(name === "lens" ? ["review-bundle.json"] : [])] }));
    }
    fs.writeFileSync(path.join(root, "skills/lens/review-bundle.json"), JSON.stringify({ schema_version: 1, skill: "lens", mode: "lens-only", delivery_mode: "file_only", entrypoint: "SKILL.md", files: ["SKILL.md"] }));
    fs.writeFileSync(path.join(root, "skills/wh-review/stage-skill-plan.json"), JSON.stringify({ version: 1, stages: { stage: { required_skills: ["lens"], review_mode: "lens-only", lens_owner: "wh-review", lens_dispatch: "delegated", delivery_mode: "file_only" } } }));
    const { bundleHash: whHash } = validateSkillBundle(root, "skills/wh-review/skill-bundle.json", "skills/wh-review/SKILL.md");
    const { bundleHash: lensHash } = validateSkillBundle(root, "skills/lens/skill-bundle.json", "skills/lens/SKILL.md");
    fs.writeFileSync(path.join(root, "skills/catalog.yaml"), `schema_version: 2\nlast_reviewed_at: '2026-07-14'\nprojects: {}\nskills:\n  - { name: wh-review, path: skills/wh-review/SKILL.md, local_version: 1.0.0, local_bundle_hash: ${whHash}, last_reviewed_at: '2026-07-14', status: native, purpose: review, design_idea: fixture, used_by_stages: [stage], upstream: [], local_changes: local, dependency_closure: [skills/wh-review], update_policy: manual }\n  - { name: lens, path: skills/lens/SKILL.md, local_version: 1.0.0, local_bundle_hash: ${lensHash}, last_reviewed_at: '2026-07-14', status: native, purpose: lens, design_idea: fixture, used_by_stages: [stage], upstream: [], local_changes: local, dependency_closure: [skills/lens], update_policy: manual }\ncapability_decisions:\n  - { name: fixture, status: rejected, purpose: fixture, design_idea: fixture, used_by_stages: [], local_path: null, upstream: [], local_changes: rejected, dependency_closure: [], update_policy: none }\n`);
    fs.writeFileSync(path.join(root, "skills/reuse-registry.md"), "- `wh-review`\n- `lens`\n- `fixture`\n");
    fs.writeFileSync(path.join(root, "workflows/stage/SKILL.md"), "Use wh-review.\n");
    fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\nskills:\n  - { name: wh-review, path: skills/wh-review/SKILL.md, execution: inline, trigger: review, bundle: skills/wh-review/skill-bundle.json, owner: stage }\nruntime_capabilities: []\nexternal_capabilities: []\n");
  }
  return root;
}

it("accepts a closed repository-local stage manifest", () => {
  expect(checkSkillClosure(fixture())).toEqual({ ok: true, errors: [] });
});

it("accepts a direct package without repeating every dependency in the stage prompt", () => {
  expect(checkSkillClosure(fixture({ prompt: "Execute the declared stage package.\n" })))
    .toEqual({ ok: true, errors: [] });
});

it.each([
  ["name", "other", /dependency name\/path mismatch/],
  ["path", "skills/other/SKILL.md", /dependency name\/path mismatch/],
  ["execution", "host", /invalid execution mode/],
  ["trigger", "", /invalid trigger/],
  ["bundle", "skills/demo/missing.json", /missing\.json/],
  ["owner", "host", /owner=stage/],
])("rejects invalid direct-package %s metadata", (field, value, expected) => {
  const root = fixture();
  const manifestPath = path.join(root, "workflows/stage/skill-deps.yaml");
  const manifest = yaml.load(fs.readFileSync(manifestPath, "utf8"));
  manifest.skills[0][field] = value;
  fs.writeFileSync(manifestPath, yaml.dump(manifest));

  const result = checkSkillClosure(root);
  expect(result.ok).toBe(false);
  expect(result.errors.join("\n")).toMatch(expected);
});

it("keeps Talk and Grill exclusive to make-decision", () => {
  expect(checkSkillClosure(fixture({ skillName: "talk-with-zhipeng", stage: "make-decision" })).ok).toBe(true);
  expect(checkSkillClosure(fixture({ skillName: "grill-with-docs", stage: "build-plan" })).errors.join("\n"))
    .toMatch(/grill-with-docs is owned exclusively by make-decision/);
});

it.each(["runtime_capabilities", "external_capabilities"])("requires %s to remain diagnostic", (group) => {
  const root = fixture();
  const manifestPath = path.join(root, "workflows/stage/skill-deps.yaml");
  const manifest = yaml.load(fs.readFileSync(manifestPath, "utf8"));
  manifest[group] = [{
    id: "fixture-capability",
    kind: "host",
    doctor: ["fixture-capability", "--version"],
    required_when: "always",
    absence_semantics: "blocked",
  }];
  fs.writeFileSync(manifestPath, yaml.dump(manifest));

  expect(checkSkillClosure(root).errors.join("\n"))
    .toMatch(new RegExp(`${group}/fixture-capability absence_semantics must be diagnostic`));
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

it("rejects delegated wh-review lenses duplicated as stage-owned manifest skills", () => {
  const root = fixture({ indirectLens: true });
  fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), `stage: stage
skills:
  - { name: wh-review, path: skills/wh-review/SKILL.md, execution: inline, trigger: review, bundle: skills/wh-review/skill-bundle.json, owner: stage }
  - { name: lens, path: skills/lens/SKILL.md, execution: inline, trigger: duplicate_lens, bundle: skills/lens/skill-bundle.json, owner: stage }
runtime_capabilities: []
external_capabilities: []
`);
  expect(checkSkillClosure(root).errors.join("\n")).toMatch(/delegated wh-review lens must not appear in stage manifest: lens/);
});
