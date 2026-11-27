// 拆包技能接线契约（任务无关）：skills/task-breakdown 与三处入口、三份子流程、三处登记。
//
// 只从真实文件字节观察，不 import 内部函数、不写仓库：
//  - 技能文件、四份 references、三处入口 SKILL.md、三份 flow steps.json、
//    五个根 steps.json、catalog.yaml、reuse-registry.md 都是仓库真实字节；
//  - 六处指针（3 处入口前言 + 3 份 flow 研究步 skill）收成集合判同一 file#anchor；
//  - 不断言「恰好六处」，只断言这六个位置各自在场，将来在别处再加指针不误红。
//
// 七条断言 A1–A7：
//  A1 技能与四份 references 可读，SKILL.md 有 <a id="breakdown-method"> 锚；
//  A2 三处入口各至少 1 处指针，只含「必须按」不含软措辞；
//  A3 三份 flow 各恰好 1 个 skill，值相同，落在研究步；
//  A4 六处收成集合 size === 1；
//  A5 四个根 steps.json 全文 task-breakdown 出现 0 次；
//  A6 catalog／reuse／bundle 三处登记合规，bundle 文件集合＝目录内实际 .md 集合；
//  A7 技能内不复制内核判据，SKILL.md 出现内核指针。
import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENTRY_FILES = [
  "workflows/make-decision/SKILL.md",
  "workflows/build-plan/SKILL.md",
  "workflows/build-prd/SKILL.md",
];
const FLOW_FILES = {
  small: { file: "workflows/make-decision/flows/small/steps.json", slug: "bounded-research" },
  normal: { file: "workflows/make-decision/flows/normal/steps.json", slug: "internal-research-talk" },
  planning: { file: "workflows/make-decision/flows/planning/steps.json", slug: "research" },
};
const ROOT_STEPS = [
  "workflows/make-decision/steps.json",
  "workflows/build-plan/steps.json",
  "workflows/build-code/steps.json",
  "workflows/build-prd/steps.json",
];
const SKILL_DIR = "skills/task-breakdown";
const REF_FILES = [
  "skills/task-breakdown/references/问题陈述模板.md",
  "skills/task-breakdown/references/存在性判据.md",
  "skills/task-breakdown/references/根因影响验收清单.md",
  "skills/task-breakdown/references/逐需求五问审查表.md",
];
const ANCHOR_REF = "skills/task-breakdown/SKILL.md#breakdown-method";
const SOFT_WORDS = ["需要时", "可选", "按需", "小改动不", "仅复杂任务", "轻档不", "子流程不"];

const read = relPath => readFileSync(resolve(ROOT, relPath), "utf8");
const isFile = relPath => {
  try {
    return statSync(resolve(ROOT, relPath)).isFile();
  } catch {
    return false;
  }
};
const listMarkdown = dir => {
  const out = [];
  for (const name of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
    if (name.isFile() && name.name.endsWith(".md")) out.push(join(dir, name.name));
  }
  return out;
};

test("A1 技能与四份 references 可读，SKILL.md 有 #breakdown-method 锚", () => {
  assert.ok(isFile("skills/task-breakdown/SKILL.md"), "SKILL.md 必须是真实可读文件");
  for (const ref of REF_FILES) assert.ok(isFile(ref), `references 缺失：${ref}`);
  const body = read("skills/task-breakdown/SKILL.md");
  assert.match(body, /<a\s[^>]*\bid\s*=\s*["']breakdown-method["']/u, "SKILL.md 缺 <a id=\"breakdown-method\"> 锚");
});

test("A2 三处入口各至少 1 处指针，只含必须按不含软措辞", () => {
  for (const file of ENTRY_FILES) {
    const hits = read(file)
      .split("\n")
      .filter(line => line.includes("task-breakdown"));
    assert.ok(hits.length >= 1, `${file} 没有指向拆包技能的指针`);
    for (const line of hits) {
      assert.ok(line.includes(ANCHOR_REF), `${file} 指针未指向 ${ANCHOR_REF}`);
      assert.ok(line.includes("必须按"), `${file} 指针缺「必须按」`);
      for (const soft of SOFT_WORDS) {
        assert.ok(!line.includes(soft), `${file} 指针含软措辞「${soft}」`);
      }
    }
  }
});

test("A3 三份 flow 各恰好 1 个 skill，值相同，落在研究步", () => {
  const seen = [];
  for (const [level, { file, slug }] of Object.entries(FLOW_FILES)) {
    const steps = JSON.parse(read(file)).steps ?? [];
    const hits = steps.filter(step => step.skill);
    assert.equal(hits.length, 1, `${level} 的 skill 声明应恰好 1 个，实为 ${hits.length}`);
    assert.equal(hits[0].step_slug, slug, `${level} 的 skill 未落在研究步 ${slug}`);
    assert.equal(hits[0].skill, ANCHOR_REF, `${level} 的 skill 值不是 ${ANCHOR_REF}`);
    seen.push(hits[0].skill);
  }
  assert.equal(new Set(seen).size, 1, `三份 flow 的 skill 值不一致：${seen.join(" / ")}`);
});

test("A4 六处指针收成集合 size === 1", () => {
  const refs = [];
  for (const file of ENTRY_FILES) {
    const line = read(file)
      .split("\n")
      .find(item => item.includes("task-breakdown"));
    const m = line?.match(/skills\/task-breakdown\/SKILL\.md#[A-Za-z0-9_-]+/u);
    assert.ok(m, `${file} 找不到 file#anchor 形式的指针`);
    refs.push(m[0]);
  }
  for (const { file } of Object.values(FLOW_FILES)) {
    const hits = (JSON.parse(read(file)).steps ?? []).filter(step => step.skill);
    assert.equal(hits.length, 1, `${file} 的 skill 应恰好 1 个`);
    refs.push(hits[0].skill);
  }
  assert.equal(new Set(refs).size, 1, `六处指针不是同一 file#anchor：${JSON.stringify([...new Set(refs)])}`);
});

test("A5 四个根 steps.json 全文 task-breakdown 出现 0 次", () => {
  for (const file of ROOT_STEPS) {
    assert.ok(!read(file).includes("task-breakdown"), `${file} 不应出现 task-breakdown（护 AC-03① 与单阶段声明）`);
  }
});

test("A6 catalog／reuse／bundle 三处登记合规", () => {
  const catalog = read("skills/catalog.yaml");
  const start = catalog.indexOf("  - name: task-breakdown");
  assert.ok(start >= 0, "catalog.yaml 缺 task-breakdown 条目");
  const next = catalog.indexOf("\n  - name:", start + 1);
  const block = catalog.slice(start, next < 0 ? undefined : next);
  assert.match(block, /^    path: skills\/task-breakdown\/SKILL\.md$/mu, "catalog path 必须是 skills/task-breakdown/SKILL.md");
  assert.match(block, /^    status: native$/mu, "catalog status 必须是 native");
  assert.match(block, /^    used_by_stages: \[make-decision, build-prd, build-plan\]$/mu, "catalog used_by_stages 必须是三阶段字面量数组");
  assert.match(block, /^    dependency_closure: \[\]$/mu, "catalog dependency_closure 必须是数组（此处空）");

  const reuse = read("skills/reuse-registry.md");
  assert.ok(/\|\s*task-breakdown\s*\|[^\n]*\[读取正文\]\(task-breakdown\/SKILL\.md\)/u.test(reuse), "reuse-registry 缺合法 task-breakdown 行");
  assert.ok(isFile("skills/task-breakdown/SKILL.md"), "reuse 指向的正文目标不存在");

  const bundle = JSON.parse(read("skills/task-breakdown/skill-bundle.json"));
  assert.equal(bundle.skill, "task-breakdown", "bundle.skill 必须是 task-breakdown");
  assert.equal(bundle.schema_version, 1, "bundle.schema_version 必须是 1");
  const actual = [...listMarkdown("skills/task-breakdown"), ...listMarkdown("skills/task-breakdown/references")]
    .map(item => relative(resolve(ROOT, SKILL_DIR), resolve(ROOT, item)))
    .sort();
  const declared = [...bundle.files].sort();
  assert.deepEqual(declared, actual, `bundle.files 与目录内实际 .md 集合不符：${JSON.stringify({ declared, actual })}`);
});

test("A7 技能内不复制内核判据，SKILL.md 出现内核指针", () => {
  const offenders = [];
  const scan = dir => {
    for (const name of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
      const rel = join(dir, name.name);
      if (name.isDirectory()) scan(rel);
      else if (name.isFile() && name.name.endsWith(".md")) {
        const body = read(rel);
        if (/让谁看到什么变化|谁读不到|失败后果，再写触发条件/u.test(body)) offenders.push(rel);
      }
    }
  };
  scan(SKILL_DIR);
  assert.deepEqual(offenders, [], `技能内复制了内核判据：${offenders.join(", ")}`);
  const body = read("skills/task-breakdown/SKILL.md");
  assert.ok(body.includes("unit-kernel/SKILL.md"), "SKILL.md 缺内核指针 unit-kernel/SKILL.md");
  assert.ok(body.includes("R6"), "SKILL.md 缺内核条号 R6");
});
