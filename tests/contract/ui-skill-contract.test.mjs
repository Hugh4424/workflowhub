import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const exists = (relativePath) => existsSync(join(root, relativePath));

const skillSpecs = {
  "ui-project-init": {
    path: "skills/ui-project-init/SKILL.md",
    bundle: "skills/ui-project-init/skill-bundle.json",
    required: [
      "new",
      "legacy",
      "Design.md",
      "version",
      "fixture",
      "Preview",
      "unknown",
      "N/A + reason",
      "no stage",
      "no gate",
    ],
    forbidden: ["quality score"],
  },
  "design-source-readiness": {
    path: "skills/design-source-readiness/SKILL.md",
    bundle: "skills/design-source-readiness/skill-bundle.json",
    required: [
      "Screen Read Map",
      "section/page anchor",
      "bindable",
      "not_bindable",
      "unknown",
      "human",
      "no score",
      "no gate",
      "Design.md",
    ],
    forbidden: ["quality score"],
  },
  "frontend-component-quality": {
    path: "skills/frontend-component-quality/SKILL.md",
    bundle: "skills/frontend-component-quality/skill-bundle.json",
    required: [
      "Component Quality Map",
      "reuse",
      "modify",
      "extend-state-or-variant",
      "add-local",
      "extract-shared",
      "remove-after-no-consumers",
      "real consumer",
      "typed ViewModel",
      "CSS/token owner",
      "React/Next",
      "N/A + reason",
      "scripts/check-frontend-component-quality.mjs",
      "duplicate-component",
      "global-override",
      "important-declaration",
      "css-leak",
      "no stage",
      "no gate",
    ],
    forbidden: ["SHA-256", "sha256", "second workflow", "second entrypoint"],
  },
};

function assertFrontmatter(skillName, content) {
  assert.match(content, /^---\n[\s\S]*?\n---\n/, `${skillName}: YAML frontmatter is required`);
  assert.match(content, new RegExp(`name:\\s*${skillName.replaceAll("-", "\\-")}`));
  assert.match(content, /description:\s*.+/);
  assert.match(content, /version:\s*["']?\d+\.\d+\.\d+["']?/);
}

function loadBundle(skillName, bundlePath) {
  assert.ok(exists(bundlePath), `${skillName}: missing ${bundlePath}`);
  const bundle = JSON.parse(read(bundlePath));
  assert.equal(bundle.schema_version, 1, `${skillName}: bundle schema must be v1`);
  assert.equal(bundle.skill, skillName, `${skillName}: bundle skill mismatch`);
  assert.ok(Array.isArray(bundle.files) && bundle.files.length > 0, `${skillName}: files closure is empty`);
  for (const entry of bundle.files) {
    const relativePath = typeof entry === "string" ? join(`skills/${skillName}`, entry) : join(`skills/${skillName}`, entry.path);
    assert.ok(exists(relativePath), `${skillName}: bundle path missing ${relativePath}`);
  }
  assert.ok(Array.isArray(bundle.sources), `${skillName}: source provenance missing`);
  return bundle;
}

test("P1 skill contracts are explicit before implementation", () => {
  for (const [skillName, spec] of Object.entries(skillSpecs)) {
    assert.ok(exists(spec.path), `${skillName}: skill path is missing`);
    const content = read(spec.path);
    assertFrontmatter(skillName, content);
    for (const term of spec.required) {
      assert.match(content, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${skillName}: missing ${term}`);
    }
    for (const term of spec.forbidden) {
      assert.doesNotMatch(content, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${skillName}: forbidden ${term}`);
    }
    loadBundle(skillName, spec.bundle);
  }
});

test("UI support skills declare their real stage consumers without a parallel UI workflow", () => {
  const catalog = yaml.load(read("skills/catalog.yaml"));
  const entries = new Map((catalog.skills ?? []).map((entry) => [entry.name, entry]));
  for (const skillName of Object.keys(skillSpecs)) {
    const entry = entries.get(skillName);
    assert.ok(entry, `${skillName}: catalog entry is missing`);
    assert.equal(entry.path, skillSpecs[skillName].path);
    assert.equal(entry.standalone, true, `${skillName}: must be portable`);
    assert.ok(entry.purpose && entry.design_idea, `${skillName}: purpose/design idea missing`);
    assert.match(entry.local_changes, /owner|consumer/i, `${skillName}: owner/consumer metadata missing`);
    assert.match(entry.local_changes, /delete|remove/i, `${skillName}: deletion condition missing`);
    assert.ok(Array.isArray(entry.dependency_closure), `${skillName}: dependency closure missing`);
    assert.ok(typeof entry.update_policy === "string" && entry.update_policy.length > 0, `${skillName}: update policy missing`);
  }

  const buildSpecDependencies = yaml.load(read("workflows/build-spec/skill-deps.yaml"));
  for (const skillName of ["ui-project-init", "design-source-readiness"]) {
    const entry = entries.get(skillName);
    assert.deepEqual(entry.used_by_stages, ["build-spec"], `${skillName}: UI scope must declare build-spec as its consumer`);
    const dependency = (buildSpecDependencies.skills ?? []).find((item) => item.name === skillName);
    assert.ok(dependency, `${skillName}: build-spec dependency is missing`);
    assert.equal(dependency.trigger, "ui_scope", `${skillName}: must only run for UI scope`);
  }

  const quality = entries.get("frontend-component-quality");
  assert.deepEqual(quality.used_by_stages, ["build-plan", "build-code", "verify-code"]);
  assert.deepEqual(quality.upstream, [
    {
      github_url: "https://github.com/vercel-labs/agent-skills",
      commit: "dd089a8c752c966dee8bf0f27cb625ba193ffd9e",
      commit_url: "https://github.com/vercel-labs/agent-skills/commit/dd089a8c752c966dee8bf0f27cb625ba193ffd9e",
      license: "MIT",
      reviewed_at: "2026-08-22",
      review_outcome: "accepted",
      path: "skills/react-best-practices/AGENTS.md",
      skill_url: "https://github.com/vercel-labs/agent-skills/blob/dd089a8c752c966dee8bf0f27cb625ba193ffd9e/skills/react-best-practices/AGENTS.md",
    },
  ]);
});

test("Vercel source closure is pinned, licensed, and read-only", () => {
  const upstreamRoot = "skills/frontend-component-quality/upstream/react-best-practices";
  const upstream = read(`${upstreamRoot}/UPSTREAM.md`);
  const license = read(`${upstreamRoot}/LICENSE`);
  const compiled = read(`${upstreamRoot}/AGENTS.md`);
  assert.match(upstream, /vercel-labs\/agent-skills/);
  assert.match(upstream, /dd089a8c752c966dee8bf0f27cb625ba193ffd9e/);
  assert.match(upstream, /version\s*1\.0\.0/i);
  assert.match(upstream, /MIT/i);
  assert.match(license, /MIT License/);
  assert.match(license, /Permission is hereby granted/);
  assert.match(compiled, /React and Next\.js/i);
  assert.match(compiled, /Eliminating Waterfalls/i);
  assert.match(compiled, /Bundle Size Optimization/i);
  assert.match(upstream, /read-only|只读/i);
});

test("P1 public records preserve no-hash design revision and no-gate semantics", () => {
  const registry = read("skills/reuse-registry.md");
  const notices = read("THIRD_PARTY_NOTICES.md");
  for (const skillName of Object.keys(skillSpecs)) {
    assert.match(registry, new RegExp(`\\| ${skillName} \\|`), `${skillName}: reuse registry row missing`);
    assert.match(registry, new RegExp(skillName), `${skillName}: human registry entry missing`);
  }
  assert.match(notices, /Vercel Engineering|Vercel React Best Practices/);
  assert.match(notices, /dd089a8c752c966dee8bf0f27cb625ba193ffd9e/);
  assert.match(notices, /MIT/);
  assert.doesNotMatch(registry, /Design\.md.*SHA-256|Design\.md.*sha256/i);
  assert.doesNotMatch(notices, /Design\.md.*SHA-256|Design\.md.*sha256/i);
});
