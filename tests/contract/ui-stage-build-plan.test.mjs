// ORACLE-PLAN-UI: reads the build-plan method, its step manifest and the Phase
// template as text only.
// Passing proves a UI Phase (one that touches pages, routes, components or
// styles) gains six named UI acceptance items in step 7 and in the Phase
// template, that step 9 still adds the design review when one of the three UI
// facts is missing, that step 5's reply flag is true and its body says the step
// needs a real reply, and that every non-UI path keeps the 998614bd bytes.
// It does not prove a real Phase author follows the method, nor that build-code
// consumes the six items; those belong to P9.
// In-memory counterexamples never touch disk.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';
import { describe, expect, test } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const METHOD = 'workflows/build-plan/SKILL.md';
const STEPS = 'workflows/build-plan/steps.json';
const TEMPLATE = 'skills/spec-plan/templates/phase-template.md';
const DEPS = 'workflows/build-plan/skill-deps.yaml';
const BASELINE = '998614bd'; // task baseline cited by the phase card

const UI_SIX = [
  '设计源引用',
  '页面／路由／组件与状态乘视口',
  '视觉对照项',
  '前端质量门',
  '组件复用与沉淀',
  '独立设计审查与证据',
];

const GATE_FIVE = ['组件质量', '浏览器验收', '响应式', '无障碍', '性能预算'];

const GATE_CRITERIA = [
  '无控制台错误',
  '无横向滚动',
  '390 宽',
  '键盘可达',
  '焦点可见',
  '可访问名非空',
  '200% 缩放',
  '读屏',
  'LCP',
  '2.5 秒',
  'CLS',
  '0.1',
  'INP',
  '200 毫秒',
];

const templateAnchor = '### 验收活动预算怎么算？\n';

const read = path => readFileSync(resolve(root, path), 'utf8');
const gitShow = (commit, path) => {
  const out = spawnSync('git', ['show', `${commit}:${path}`], { cwd: root, encoding: 'utf8' });
  expect(out.status, `基线 ${commit} 上可读 ${path}：${out.stderr ?? ''}`).toBe(0);
  return out.stdout;
};

// A numbered step runs until the next numbered step or the next level-2
// heading, so an appended UI paragraph stays inside its own step. The method's
// earlier six-reading-order list also starts with "1. ", so search inside
// "## 方法" only.
const methodSection = text => {
  const at = text.search(/^## 方法$/m);
  return at < 0 ? text : text.slice(at);
};
const stepSection = (text, id) => {
  const body0 = methodSection(text);
  const start = body0.search(new RegExp(`^${id}\\. `, 'm'));
  if (start < 0) return '';
  const body = body0.slice(start + `${id}. `.length);
  const end = body.search(/^(?:\d+\. |## )/m);
  return end < 0 ? body : body.slice(0, end);
};

const stepRow = (steps, id) => steps.steps.find(step => step.step_id === id) ?? {};

const missing = (gaps, token) => gaps.some(gap => gap.includes(token));

// Returns the named gaps; an empty list means the UI-Phase acceptance contract
// holds and the non-UI paths are unchanged.
function checkBuildPlanUi({ method, steps, template, deps, baselineMethod, baselineSteps, baselineTemplate }) {
  const gaps = [];

  // 1. Step 7 writes the six named UI acceptance items for a UI Phase.
  const step7 = stepSection(method, 7);
  const base7 = stepSection(baselineMethod, 7);
  if (!step7) gaps.push('第 7 步读不到，无法判 UI 六项');
  if (!/UI Phase/.test(step7)) gaps.push('第 7 步缺 UI Phase 前提');
  for (const name of UI_SIX) {
    if (!step7.includes(name)) gaps.push(`第 7 步缺：${name}`);
  }
  if (step7 && !step7.includes('非 UI')) gaps.push('第 7 步缺非 UI 排除');

  // 2. Step 9 still adds the design review when one of the three UI facts is
  //    missing but the Phase touches pages, routes, components or styles.
  const step9 = stepSection(method, 9);
  if (!step9.includes('三项 UI 事实')) gaps.push('第 9 步缺「三项 UI 事实」');
  if (!step9.includes('缺一项')) gaps.push('第 9 步缺「缺一项」');
  if (!step9.includes('仍加设计审查')) gaps.push('第 9 步缺「仍加设计审查」');
  if (!/碰页面/.test(step9)) gaps.push('第 9 步缺「碰页面」触发条件');

  // 3. Step 5: the reply flag is true and the body says so, including where a
  //    real reply is recorded and that an unanswered step stops there.
  const step5row = stepRow(steps, 5);
  if (step5row.requires_user_reply !== true) {
    gaps.push('steps.json 第 5 步 requires_user_reply 不是 true');
  }
  const step5 = stepSection(method, 5);
  if (!step5.includes('该步需要真实答复')) gaps.push('第 5 步缺「该步需要真实答复」');
  if (!/答复原文/.test(step5)) gaps.push('第 5 步缺答复记录位置');
  if (!step5.includes('停在该步')) gaps.push('第 5 步缺未答时停在该步');

  // 4. steps.json: only step 5's reply flag and step 7's UI sentence change.
  const ids = steps.steps.map(step => step.step_id);
  if (JSON.stringify(ids) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])) {
    gaps.push('steps.json 步骤编号序列改变');
  }
  for (const row of steps.steps) {
    const base = stepRow(baselineSteps, row.step_id);
    if (!base.step_slug) {
      gaps.push(`steps.json 第 ${row.step_id} 项基线读不到`);
      continue;
    }
    if (row.step_slug !== base.step_slug) gaps.push(`steps.json 第 ${row.step_id} 项 step_slug 改变`);
    if (JSON.stringify(row.completion_evidence) !== JSON.stringify(base.completion_evidence)) {
      gaps.push(`steps.json 第 ${row.step_id} 项 completion_evidence 与基线不同`);
    }
    if (row.step_id !== 7 && row.observable_result !== base.observable_result) {
      gaps.push(`steps.json 第 ${row.step_id} 项与基线不逐字相同`);
    }
    if (row.step_id !== 5 && row.requires_user_reply !== base.requires_user_reply) {
      gaps.push(`steps.json 第 ${row.step_id} 步 requires_user_reply 与基线不同`);
    }
  }
  const row7 = stepRow(steps, 7);
  const base7row = stepRow(baselineSteps, 7);
  if (!base7row.observable_result) gaps.push('steps.json 第 7 项基线读不到');
  else if (!String(row7.observable_result ?? '').startsWith(base7row.observable_result)) {
    gaps.push('steps.json 第 7 项非 UI 路径与原句不逐字相同');
  } else {
    const tail = String(row7.observable_result).slice(base7row.observable_result.length).trim();
    if (!tail) gaps.push('steps.json 第 7 项缺 UI 六项句');
    else {
      if (!tail.startsWith('UI')) gaps.push('steps.json 第 7 项新增段缺 UI 前提');
      if (!tail.includes('非 UI 跳过')) gaps.push('steps.json 第 7 项缺「非 UI 跳过」');
      for (const name of UI_SIX) {
        if (!tail.includes(name)) gaps.push(`steps.json 第 7 项缺：${name}`);
      }
    }
  }

  // 5. Template: six items, the five frontend quality gates with observable
  //    criteria, the component write-back location and reader, and a UI-only
  //    placement; every other byte keeps the baseline.
  const at = baselineTemplate.indexOf(templateAnchor);
  if (at < 0) gaps.push('模板预算锚点读不到，无法比对');
  else {
    const head = baselineTemplate.slice(0, at);
    const rest = baselineTemplate.slice(at);
    if (!template.startsWith(head)) gaps.push('模板改前内容与基线不逐字相同');
    if (!template.endsWith(rest)) gaps.push('模板改后内容与基线不逐字相同');
    const middle = template.slice(head.length, template.length - rest.length).trim();
    if (!middle) gaps.push('模板缺 UI 六项段');
    else {
      if (!middle.includes('只在 UI Phase 写')) gaps.push('模板 UI 六项段不是只在 UI Phase 写');
      for (const name of UI_SIX) {
        if (!middle.includes(name)) gaps.push(`模板缺：${name}`);
      }
      for (const gate of GATE_FIVE) {
        if (!middle.includes(gate)) gaps.push(`模板前端质量门缺：${gate}`);
      }
      for (const criterion of GATE_CRITERIA) {
        if (!middle.includes(criterion)) gaps.push(`模板前端质量门缺判据：${criterion}`);
      }
      if (!middle.includes('组件回写')) gaps.push('模板缺组件回写位置');
      if (!middle.includes('读的人')) gaps.push('模板缺组件回写读者');
      if (!middle.includes('不适用＋理由')) gaps.push('模板缺「不适用＋理由」');
    }
  }

  // 6. Non-UI paths: untouched steps keep the baseline bytes; steps 5, 7 and 9
  //    only append their UI paragraph, so the original prefix survives.
  for (const id of [1, 2, 3, 4, 6, 8, 10, 11, 12]) {
    const current = stepSection(method, id);
    const baseline = stepSection(baselineMethod, id);
    if (!baseline) gaps.push(`第 ${id} 步基线读不到，无法比对`);
    else if (current !== baseline) gaps.push(`第 ${id} 步与基线不逐字相同`);
  }
  for (const id of [5, 7, 9]) {
    const current = stepSection(method, id);
    const baseline = stepSection(baselineMethod, id);
    if (!baseline) gaps.push(`第 ${id} 步基线读不到，无法比对`);
    else if (!current.startsWith(baseline)) gaps.push(`第 ${id} 步非 UI 路径与基线不逐字相同`);
  }

  // The dependency manifest stays parseable and keeps its stage identity.
  let manifest;
  try {
    manifest = yaml.load(deps);
  } catch {
    gaps.push('skill-deps.yaml 不可解析');
  }
  if (manifest && manifest.stage !== 'build-plan') gaps.push('skill-deps.yaml stage 不是 build-plan');

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

describe('ORACLE-PLAN-UI build-plan UI Phase acceptance', () => {
  test('第 7 步给碰页面的 Phase 写六项 UI 验收', () => {
    const legal = fixture();
    const step7 = stepSection(legal.method, 7);
    expect(step7, '第 7 步缺：视觉对照项').toContain('视觉对照项');
    for (const name of UI_SIX) {
      expect(step7, `第 7 步缺：${name}`).toContain(name);
    }
    expect(checkBuildPlanUi(legal), `ORACLE-PLAN-UI 缺口：${checkBuildPlanUi(legal).join('；')}`).toEqual([]);
  });

  test('第 9 步三项 UI 事实缺一项但碰页面仍加设计审查', () => {
    const legal = fixture();
    const step9 = stepSection(legal.method, 9);
    expect(step9, '第 9 步缺「三项 UI 事实」').toContain('三项 UI 事实');
    expect(step9, '第 9 步缺「仍加设计审查」').toContain('仍加设计审查');
  });

  test('第 5 步 requires_user_reply 为 true 且正文写明真实答复与何时停', () => {
    const legal = fixture();
    expect(stepRow(legal.steps, 5).requires_user_reply, '第 5 步 requires_user_reply 不是 true').toBe(true);
    const step5 = stepSection(legal.method, 5);
    expect(step5, '第 5 步缺「该步需要真实答复」').toContain('该步需要真实答复');
    expect(step5, '第 5 步缺未答时停在该步').toContain('停在该步');
  });

  test('Phase 模板写六项、前端质量门五项判据与组件回写位置', () => {
    const legal = fixture();
    const template = legal.template;
    for (const name of UI_SIX) {
      expect(template, `模板缺：${name}`).toContain(name);
    }
    for (const gate of GATE_FIVE) {
      expect(template, `模板前端质量门缺：${gate}`).toContain(gate);
    }
    expect(template, '模板缺组件回写位置').toContain('组件回写');
    expect(template, '模板缺「不适用＋理由」').toContain('不适用＋理由');
    expect(template, '模板 UI 六项段不是只在 UI Phase 写').toContain('只在 UI Phase 写');
  });

  test('非 UI 路径与 998614bd 基线逐字相同', () => {
    const legal = fixture();
    for (const id of [1, 2, 3, 4, 6, 8, 10, 11, 12]) {
      expect(stepSection(legal.method, id), `第 ${id} 步与基线不逐字相同`).toBe(
        stepSection(legal.baselineMethod, id),
      );
    }
    for (const id of [5, 7, 9]) {
      const current = stepSection(legal.method, id);
      const baseline = stepSection(legal.baselineMethod, id);
      expect(current.startsWith(baseline), `第 ${id} 步非 UI 路径被改写`).toBe(true);
    }
    const gaps = checkBuildPlanUi(legal);
    expect(gaps, `非 UI 路径缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('内存副本删「视觉对照项」，检查函数必须报缺该句', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('视觉对照项', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, '第 7 步缺：视觉对照项'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(checkBuildPlanUi(legal), '原字节不被反例污染').toEqual([]);
  });

  test('内存副本删前端质量门「性能预算」，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = { ...legal, template: legal.template.replaceAll('性能预算', '') };
    expect(changed.template).not.toBe(legal.template);
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, '模板前端质量门缺：性能预算'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删「200% 缩放」，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = { ...legal, template: legal.template.replaceAll('200% 缩放', '') };
    expect(changed.template).not.toBe(legal.template);
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, '模板前端质量门缺判据：200% 缩放'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本把第 5 步正文标记改回「不需要回复」，断言必须变红', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('该步需要真实答复', '不需要回复') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, '第 5 步缺「该步需要真实答复」'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本把 steps.json 第 5 步标记改回 false，断言必须变红', () => {
    const legal = fixture();
    const changed = structuredClone(legal);
    changed.steps.steps.find(step => step.step_id === 5).requires_user_reply = false;
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, 'steps.json 第 5 步 requires_user_reply 不是 true'), `缺口：${gaps.join('；')}`).toBe(
      true,
    );
  });

  test('内存副本删组件回写位置，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = { ...legal, template: legal.template.replaceAll('组件回写', '') };
    expect(changed.template).not.toBe(legal.template);
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, '模板缺组件回写位置'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本给非 UI 路径第 1 步加一句「须写设计源引用」，基线比对必须变红', () => {
    const legal = fixture();
    const base1 = stepSection(legal.baselineMethod, 1);
    expect(base1, '第 1 步基线可定位').toBeTruthy();
    const changed = {
      ...legal,
      method: legal.method.replace(base1, `${base1.trimEnd()}须写设计源引用。\n`),
    };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, '第 1 步与基线不逐字相同'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删 steps.json 第 7 项 UI 六项句，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = structuredClone(legal);
    const row7 = changed.steps.steps.find(step => step.step_id === 7);
    row7.observable_result = stepRow(legal.baselineSteps, 7).observable_result;
    const gaps = checkBuildPlanUi(changed);
    expect(missing(gaps, 'steps.json 第 7 项缺 UI 六项句'), `缺口：${gaps.join('；')}`).toBe(true);
  });
});
