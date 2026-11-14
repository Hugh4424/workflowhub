// ORACLE-PRD-UI: reads the build-prd method, its step manifest and the PRD
// template as text only.
// Passing proves the method adds a UI task chain at exactly two moments — the
// first outline/task-map call (step 2) and the complete-PRD call (step 4) — and
// that the PRD empty-card template gains the three UI-only segments.
// It also proves every non-UI path keeps the pre-change bytes: steps 1, 3, 5, 6
// are byte-identical to the 998614bd baseline, steps 2 and 4 only gain a
// conditional tail that starts with a UI premise and ends with "非 UI 跳过",
// and the template changes only by one inserted UI-only block.
// It does not prove a real PRD author follows the method, nor that wiring works
// in a real page; those belong to the P9 planning read-back.
// In-memory counterexamples never touch disk.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';
import { describe, expect, test } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const METHOD = 'workflows/build-prd/SKILL.md';
const STEPS = 'workflows/build-prd/steps.json';
const TEMPLATE = 'skills/spec-prd/templates/prd-template.md';
const DEPS = 'workflows/build-prd/skill-deps.yaml';
const BASELINE = '998614bd'; // task baseline cited by the phase card

const read = path => readFileSync(resolve(root, path), 'utf8');
const gitShow = (commit, path) => {
  const out = spawnSync('git', ['show', `${commit}:${path}`], { cwd: root, encoding: 'utf8' });
  expect(out.status, `基线 ${commit} 上可读 ${path}：${out.stderr ?? ''}`).toBe(0);
  return out.stdout;
};

// A numbered step runs until the next numbered step or the next level-2
// heading, so an appended UI paragraph stays inside its own step.
const stepSection = (text, id) => {
  const start = text.search(new RegExp(`^${id}\\. `, 'm'));
  if (start < 0) return '';
  const body = text.slice(start + `${id}. `.length);
  const end = body.search(/^(?:\d+\. |## )/m);
  return end < 0 ? body : body.slice(0, end);
};

const templateAnchor =
  '- **风险与没定**：[已接受风险/未知/待定/可后置，每条带触发与接管者]\n';

const stepResult = (steps, id) =>
  steps.steps.find(step => step.step_id === id)?.observable_result ?? '';

const missing = (gaps, token) => gaps.some(gap => gap.includes(token));

// Returns the named gaps; an empty list means the UI task-chain contract holds.
function checkBuildPrdUi({ method, steps, template, deps, baselineMethod, baselineSteps, baselineTemplate }) {
  const gaps = [];

  const step2 = stepSection(method, 2);
  const base2 = stepSection(baselineMethod, 2);
  if (!base2) gaps.push('第 2 步基线读不到，无法比对');
  else if (!step2.startsWith(base2)) {
    gaps.push('第 2 步非 UI 路径与基线不逐字相同');
  } else {
    const tail = step2.slice(base2.length).trim();
    if (!tail) gaps.push('第 2 步缺 UI 条件句');
    else {
      if (!tail.startsWith('UI')) gaps.push('第 2 步新增段缺 UI 前提');
      if (!tail.includes('非 UI 跳过')) gaps.push('第 2 步缺「非 UI 跳过」');
      for (const token of ['页面清单', '设计任务', '前端底座']) {
        if (!tail.includes(token)) gaps.push(`第 2 步缺：${token}`);
      }
      if (!tail.includes('跨多页或多任务')) gaps.push('第 2 步缺底座触发条件：跨多页或多任务');
      if (!tail.includes('有稿不排设计任务')) gaps.push('第 2 步缺：有稿不排设计任务');
      if (!tail.includes('单页且有设计稿不排设计任务、不排前端底座')) {
        gaps.push('第 2 步缺：单页且有设计稿不排设计任务、不排前端底座');
      }
      // The base must stay conditional, never "every UI task".
      if (/每个 ?UI 任务|所有 UI 任务|每个UI任务/.test(tail)) {
        gaps.push('第 2 步底座条件写成每个 UI 任务');
      }
    }
  }

  const step4 = stepSection(method, 4);
  const base4 = stepSection(baselineMethod, 4);
  if (!base4) gaps.push('第 4 步基线读不到，无法比对');
  else if (!step4.startsWith(base4)) {
    gaps.push('第 4 步非 UI 路径与基线不逐字相同');
  } else {
    const tail = step4.slice(base4.length).trim();
    if (!tail) gaps.push('第 4 步缺 UI 条件句');
    else {
      if (!tail.startsWith('UI')) gaps.push('第 4 步新增段缺 UI 前提');
      if (!tail.includes('非 UI 跳过')) gaps.push('第 4 步缺「非 UI 跳过」');
      if (!tail.includes('页面清单')) gaps.push('第 4 步缺：页面清单');
      if (!tail.includes('逐任务接线')) gaps.push('第 4 步缺：逐任务接线');
      for (const token of ['页面区域', '假数据换真数据', '假动作换真动作', '后台值变化', '失败态']) {
        if (!tail.includes(token)) gaps.push(`第 4 步接线缺：${token}`);
      }
      if (!tail.includes('视觉还原验收')) gaps.push('第 4 步缺：视觉还原验收');
      if (!tail.includes('组件复用与沉淀')) gaps.push('第 4 步缺：组件复用与沉淀');
      if (!tail.includes('设计偏差处置')) gaps.push('第 4 步缺：设计偏差处置');
      if (!tail.includes('页面数据清单')) gaps.push('第 4 步缺：页面数据清单');
      if (!/页面数据清单[^。\n]*PRD 作者/.test(tail)) gaps.push('第 4 步页面数据清单未归 PRD 作者');
    }
  }

  for (const id of [1, 3, 5, 6]) {
    const current = stepSection(method, id);
    const baseline = stepSection(baselineMethod, id);
    if (!baseline) gaps.push(`第 ${id} 步基线读不到，无法比对`);
    else if (current !== baseline) gaps.push(`第 ${id} 步与基线不逐字相同`);
  }

  // steps.json: the same two moments gain a conditional UI tail; all other
  // observable results and every completion_evidence entry stay as baseline.
  if (JSON.stringify(steps.steps.map(step => step.step_id)) !== JSON.stringify([1, 2, 3, 4, 5, 6])) {
    gaps.push('steps.json 步骤编号序列改变');
  }
  for (const id of [1, 3, 5, 6]) {
    const current = stepResult(steps, id);
    const baseline = stepResult(baselineSteps, id);
    if (current !== baseline) gaps.push(`steps.json 第 ${id} 项与基线不逐字相同`);
  }
  for (const [id, tokens] of [
    [2, ['跨多页或多任务', '有稿不排设计任务', '单页且有设计稿不排设计任务、不排前端底座', '设计任务', '前端底座', '页面清单']],
    [4, ['逐任务接线', '视觉', '组件', '页面数据清单', '设计偏差处置', '页面区域', '失败态']],
  ]) {
    const current = stepResult(steps, id);
    const baseline = stepResult(baselineSteps, id);
    if (!baseline) {
      gaps.push(`steps.json 第 ${id} 项基线读不到，无法比对`);
      continue;
    }
    if (!current.startsWith(baseline)) {
      gaps.push(`steps.json 第 ${id} 项非 UI 路径与原句不逐字相同`);
      continue;
    }
    const tail = current.slice(baseline.length).trim();
    if (!tail) {
      gaps.push(`steps.json 第 ${id} 项缺 UI 条件句`);
      continue;
    }
    if (!tail.startsWith('UI')) gaps.push(`steps.json 第 ${id} 项新增段缺 UI 前提`);
    if (!tail.includes('非 UI 跳过')) gaps.push(`steps.json 第 ${id} 项缺「非 UI 跳过」`);
    for (const token of tokens) {
      if (!tail.includes(token)) gaps.push(`steps.json 第 ${id} 项缺：${token}`);
    }
  }
  const evidence = pairs => pairs.map(step => JSON.stringify(step.completion_evidence));
  if (JSON.stringify(evidence(steps.steps)) !== JSON.stringify(evidence(baselineSteps.steps))) {
    gaps.push('steps.json completion_evidence 与基线不同');
  }

  // Template: only one UI-only block may be inserted after the six empty-card
  // fields; everything before and after it must keep the baseline bytes.
  const anchorAt = baselineTemplate.indexOf(templateAnchor);
  if (anchorAt < 0) gaps.push('模板空卡锚点读不到');
  else {
    const head = baselineTemplate.slice(0, anchorAt + templateAnchor.length);
    const rest = baselineTemplate.slice(anchorAt + templateAnchor.length);
    if (!template.startsWith(head)) gaps.push('模板空卡六字段与原字节不同');
    if (!template.endsWith(rest)) gaps.push('模板四行验收与原字节不同');
    const middle = template.slice(head.length, template.length - rest.length).trim();
    if (!middle) gaps.push('模板缺 UI 任务三段');
    else {
      for (const token of ['接线', '视觉', '组件']) {
        if (!middle.includes(token)) gaps.push(`模板 UI 三段缺：${token}`);
      }
      if (!middle.includes('非 UI')) gaps.push('模板 UI 三段缺非 UI 排除');
    }
  }

  // The dependency manifest stays parseable and keeps its stage identity.
  let manifest;
  try {
    manifest = yaml.load(deps);
  } catch {
    gaps.push('skill-deps.yaml 不可解析');
  }
  if (manifest && manifest.stage !== 'build-prd') gaps.push('skill-deps.yaml stage 不是 build-prd');

  return gaps;
}

const fixture = () => ({
  method: read(METHOD),
  steps: JSON.parse(read(STEPS)),
  template: read(TEMPLATE),
  deps: read(DEPS),
  baselineMethod: gitShow(BASELINE, METHOD),
  baselineSteps: JSON.parse(gitShow(BASELINE, STEPS)),
  baselineTemplate: gitShow(BASELINE, TEMPLATE),
});

describe('ORACLE-PRD-UI build-prd UI task chain', () => {
  test('第 2 步出地图时写明设计任务与「跨多页或多任务」底座条件', () => {
    const legal = fixture();
    const step2 = stepSection(legal.method, 2);
    expect(step2, '第 2 步含底座触发条件「跨多页或多任务」').toContain('跨多页或多任务');
    expect(step2, '第 2 步含有稿不排设计任务').toContain('有稿不排设计任务');
    expect(step2, '第 2 步含单页且有设计稿不排设计任务、不排前端底座').toContain(
      '单页且有设计稿不排设计任务、不排前端底座',
    );
    const gaps = checkBuildPrdUi(legal);
    expect(gaps, `ORACLE-PRD-UI 缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('第 4 步完整 PRD 写接线、视觉、组件、设计偏差处置与页面数据清单', () => {
    const legal = fixture();
    const step4 = stepSection(legal.method, 4);
    expect(step4, '第 4 步含逐任务接线').toContain('逐任务接线');
    expect(step4, '第 4 步含设计偏差处置').toContain('设计偏差处置');
    expect(step4, '第 4 步含页面数据清单归 PRD 作者').toMatch(/页面数据清单[^。\n]*PRD 作者/);
  });

  test('内存副本删「逐任务接线」，检查函数必须报缺该句', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('逐任务接线', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPrdUi(changed);
    expect(missing(gaps, '第 4 步缺：逐任务接线'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(checkBuildPrdUi(legal), '原字节不被反例污染').toEqual([]);
  });

  test('内存副本把底座条件改成「每个 UI 任务」，断言必须变红', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replace('跨多页或多任务', '每个 UI 任务') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPrdUi(changed);
    expect(missing(gaps, '第 2 步缺底座触发条件：跨多页或多任务'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(missing(gaps, '第 2 步底座条件写成每个 UI 任务'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本给非 UI 路径第 1 步加一句「补页面数据清单」，基线比对必须变红', () => {
    const legal = fixture();
    const base1 = stepSection(legal.baselineMethod, 1);
    expect(base1, '第 1 步基线可定位').toBeTruthy();
    const changed = {
      ...legal,
      method: legal.method.replace(base1, base1.replace(/\n$/, '补页面数据清单。\n')),
    };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPrdUi(changed);
    expect(missing(gaps, '第 1 步与基线不逐字相同'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删「设计偏差处置」，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replace('设计偏差处置', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPrdUi(changed);
    expect(missing(gaps, '第 4 步缺：设计偏差处置'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删「单页且有设计稿不排设计任务、不排前端底座」，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = {
      ...legal,
      method: legal.method.replace('单页且有设计稿不排设计任务、不排前端底座', ''),
    };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPrdUi(changed);
    expect(
      missing(gaps, '第 2 步缺：单页且有设计稿不排设计任务、不排前端底座'),
      `缺口：${gaps.join('；')}`,
    ).toBe(true);
  });

  test('内存副本删模板「组件」段，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = {
      ...legal,
      template: legal.template.replace(/- \*\*组件\*\*：[^\n]*\n/, ''),
    };
    expect(changed.template).not.toBe(legal.template);
    const gaps = checkBuildPrdUi(changed);
    expect(missing(gaps, '模板 UI 三段缺：组件'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删 steps.json 第 4 项 UI 尾段，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = structuredClone(legal);
    const row = changed.steps.steps.find(step => step.step_id === 4);
    const baseline = stepResult(legal.baselineSteps, 4);
    row.observable_result = baseline;
    const gaps = checkBuildPrdUi(changed);
    expect(missing(gaps, 'steps.json 第 4 项缺 UI 条件句'), `缺口：${gaps.join('；')}`).toBe(true);
  });
});
