import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const exists = (relativePath) => existsSync(join(root, relativePath));
const skill = "frontend-prototype-render";
const skillPath = `skills/${skill}/SKILL.md`;
const bundlePath = `skills/${skill}/skill-bundle.json`;

test("frontend prototype renderer is a portable build-spec UI dependency with an executable evidence contract", () => {
  assert.ok(exists(skillPath), "frontend-prototype-render skill is missing");
  assert.ok(exists(bundlePath), "frontend-prototype-render bundle is missing");
  const content = read(skillPath);
  assert.match(content, /^---\n[\s\S]*?\n---\n/, "skill must have YAML frontmatter");
  assert.match(content, /name:\s*frontend-prototype-render/);
  assert.match(content, /version:\s*["']?\d+\.\d+\.\d+["']?/);
  for (const required of [
    "真实组件输入",
    "可运行的本地渲染命令",
    "quality/evidence/",
    "截图",
    "预览",
    "降级",
    "用户明确同意",
    "不改产品源码",
    "no stage",
    "no gate",
  ]) {
    assert.match(content, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `skill is missing ${required}`);
  }
  const bundle = JSON.parse(read(bundlePath));
  assert.equal(bundle.schema_version, 1);
  assert.equal(bundle.skill, skill);
  assert.deepEqual(bundle.files, [{
    path: "SKILL.md",
    sha256: "7f262c0f887459188f05e64376974403a3d79ea55dd199ee5be3842944214aa9",
  }]);
  assert.ok(Array.isArray(bundle.sources));
});

test("the renderer has one declared build-spec UI consumer and no paper-only wiring", () => {
  const catalog = yaml.load(read("skills/catalog.yaml"));
  const entry = (catalog.skills ?? []).find((item) => item.name === skill);
  assert.ok(entry, "renderer catalog entry is missing");
  assert.equal(entry.path, skillPath);
  assert.equal(entry.standalone, true);
  assert.deepEqual(entry.used_by_stages, ["build-spec"]);
  assert.match(entry.local_changes, /owner.*build-spec|build-spec.*owner/i);
  assert.match(entry.local_changes, /unique consumer|唯一 consumer/i);
  assert.match(entry.local_changes, /test=/i);
  assert.match(entry.local_changes, /delete-condition/i);
  assert.deepEqual(entry.dependency_closure, ["skills/frontend-prototype-render"]);

  assert.match(read("skills/reuse-registry.md"), /\| frontend-prototype-render \|/);
  assert.match(read("workflows/build-spec/SKILL.md"), /frontend-prototype-render/);
  const dependencies = yaml.load(read("workflows/build-spec/skill-deps.yaml"));
  const declared = (dependencies.skills ?? []).find((item) => item.name === skill);
  assert.ok(declared, "build-spec must declare the renderer dependency");
  assert.equal(declared.trigger, "ui_scope");
  assert.equal(declared.consumer?.target, 'stage-handlers#officialStageHandler("build-spec")');
});
