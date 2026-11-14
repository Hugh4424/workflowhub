// ORACLE-MD-UI: reads the make-decision method, its step manifest, the
// decision-log template, the two UI skill methods and the make-decision
// dependency manifest as text only.
// Passing proves those documents describe the UI-only branch: three-source
// recognition, the five-row card, the design-source question in the first ask,
// the four design-source routes with their required evidence, the step 8/9/10
// additions, the template section and the two skill triggers.
// It also proves every non-UI path keeps the pre-change bytes: step 6/7 are
// byte-identical to the 998614bd baseline, and steps 2-5/8-15 only gain lines
// that name a UI premise and say "非 UI 跳过".
// It does not prove a real task takes the branch, nor that a design source is
// usable. In-memory counterexamples never touch disk.
//
// Baselines: 998614bd is the task baseline named by the phase card; 9bab005f is
// that baseline with P2 merged, i.e. the exact pre-P3 bytes for non-UI paths.
// The card compares step 6/7 with 998614bd; P2 did not touch those steps.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';
import { describe, expect, test } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const METHOD = 'workflows/make-decision/SKILL.md';
const STEPS = 'workflows/make-decision/steps.json';
const TEMPLATE = 'skills/decision-log/templates/decision-log-template.md';
const DEPS = 'workflows/make-decision/skill-deps.yaml';
const READINESS = 'skills/design-source-readiness/SKILL.md';
const PROTOTYPE = 'skills/frontend-prototype-render/SKILL.md';
const BASELINE = '998614bd'; // task baseline cited by the phase card
const PREVIOUS = '9bab005f'; // P2-merged state; exact pre-P3 non-UI bytes

const read = path => readFileSync(resolve(root, path), 'utf8');
const gitShow = (commit, path) => {
  const out = spawnSync('git', ['show', `${commit}:${path}`], { cwd: root, encoding: 'utf8' });
  expect(out.status, `基线 ${commit} 上可读 ${path}：${out.stderr ?? ''}`).toBe(0);
  return out.stdout;
};

// A numbered step runs until the next numbered step or the next level-2 heading,
// so appended UI paragraphs stay inside their own step.
const stepSection = (text, id) =>
  text
    .split(new RegExp(`^${id}\\. (?:<a id="[^"]+"></a>)?\\x60`, 'm'))[1]
    ?.split(/^(?:\d+\. (?:<a id="[^"]+"><\/a>)?`|#{1,2} )/m)[0] ?? '';

const templateSection = (text, heading) => {
  const index = text.indexOf(heading);
  if (index < 0) return '';
  return text.slice(index + heading.length).split(/^## /m)[0];
};

// A skill's trigger sentence is the lead paragraph directly before its
// "## 方法" heading; the method body stays downstream of that condition.
const skillTrigger = text => {
  const beforeMethod = text.split(/^## 方法/m)[0];
  return beforeMethod.split(/\n\n/).map(part => part.trim()).filter(Boolean).pop() ?? '';
};

const THREE_SOURCES = ['raw_requirement', 'project_inventory', 'planned_or_changed_frontend_fact'];
const CARD_ROWS = ['是不是 UI', '页面、路由与组件', '设计源、提供者', '验收基准', '缺什么与风险'];
const ROUTES = {
  内部设计稿: ['可开发', '注解'],
  外部设计稿: ['来源', '版本', '可用范围', '验收基准'],
  沿用现有页面: ['页面', '路由', '版本'],
  无稿: ['先做原型或设计稿', '直接实现'],
};
const UI_LINE_STEPS = [2, 4, 11, 12, 13, 14, 15]; // one conditional UI-only reference each
const SUBSTANTIVE_STEPS = [1, 3, 5, 8, 9, 10]; // conditional UI paragraphs, not one-line refs

const sortedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Each new step line must start with a UI premise and end its exclusion with
// "非 UI 跳过", otherwise a non-UI task would gain an extra action.
function checkExtraLines(gaps, current, baseline, id) {
  if (!current.startsWith(baseline)) {
    gaps.push(`第 ${id} 步非 UI 路径与原句不逐字相同`);
    return;
  }
  const tail = current.slice(baseline.length);
  const lines = tail.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    gaps.push(`第 ${id} 步缺 UI 条件句`);
    return;
  }
  if (UI_LINE_STEPS.includes(id)) {
    for (const line of lines) {
      if (!/^(?:UI|出现 UI)/.test(line)) gaps.push(`第 ${id} 步新增行缺 UI 前提`);
      if (!line.includes('非 UI 跳过')) gaps.push(`第 ${id} 步新增行缺「非 UI 跳过」`);
    }
  } else if (!tail.includes('非 UI')) {
    gaps.push(`第 ${id} 步非 UI 任务多出动作`);
  }
}

function checkManifestLines(gaps, steps, baselineSteps, id) {
  const current = steps.steps.find(step => step.step_id === id)?.observable_result ?? '';
  const baseline = baselineSteps.steps.find(step => step.step_id === id)?.observable_result ?? '';
  if (id === 6 || id === 7) {
    if (current !== baseline) gaps.push(`steps.json 第 ${id} 项与基线不逐字相同`);
    return;
  }
  if (!current.startsWith(baseline)) {
    gaps.push(`steps.json 第 ${id} 项非 UI 路径与原句不逐字相同`);
    return;
  }
  const tail = current.slice(baseline.length);
  if (!tail.trim()) {
    gaps.push(`steps.json 第 ${id} 项缺 UI 条件句`);
    return;
  }
  if (UI_LINE_STEPS.includes(id) && !tail.includes('非 UI 跳过')) {
    gaps.push(`steps.json 第 ${id} 项缺「非 UI 跳过」`);
  }
  if (SUBSTANTIVE_STEPS.includes(id) && !tail.includes('非 UI')) {
    gaps.push(`steps.json 第 ${id} 项非 UI 任务多出动作`);
  }
}

// Returns the named gaps; an empty list means the UI branch contract holds.
function checkMakeDecisionUi({
  method,
  steps,
  template,
  skills,
  deps,
  baselineMethod,
  baselineSteps,
  previousMethod,
  previousSteps,
}) {
  const gaps = [];
  const section = id => stepSection(method, id);

  const first = section(1);
  const firstUi = first.split('\n').find(line => line.includes('**UI 识别与五行卡（仅 UI 任务）**')) ?? '';
  // Anchor the three-source assertion to the sentence added by this phase, not to
  // names that the pre-change step 1 already contained. Deleting the whole
  // sentence must name the missing sentence and each missing decision phrase.
  const threeSourceSentence = (firstUi.match(/三源 raw_requirement[^\n]*真实非 UI 写理由/) ?? [''])[0];
  if (!threeSourceSentence) gaps.push('第 1 步缺三源判定句');
  for (const source of THREE_SOURCES) {
    if (!threeSourceSentence.includes(source)) gaps.push(`第 1 步三源判定句缺：${source}`);
  }
  for (const phrase of ['任一命中即按 UI 处理', '三源都缺', '不默认非 UI']) {
    if (!threeSourceSentence.includes(phrase)) gaps.push(`第 1 步三源判定句缺：${phrase}`);
  }
  const cardLine = firstUi.split('\n').find(line => line.includes('五行卡：')) ?? '';
  if (!cardLine) gaps.push('第 1 步缺五行卡');
  for (const row of CARD_ROWS) if (!cardLine.includes(row)) gaps.push(`第 1 步五行卡缺行：${row}`);
  if (!/设计源[^。\n]*第一次[^。\n]*提问|第一次[^。\n]*提问[^。\n]*设计源/.test(firstUi)) {
    gaps.push('第 1 步首问缺设计源');
  }
  if (!firstUi.includes('非 UI')) gaps.push('第 1 步缺非 UI 排除');

  const third = section(3);
  if (!third.includes('现有页面、路由、组件与规范')) gaps.push('第 3 步缺调研现有页面与组件');
  if (!third.includes('设计源或还原口径不清才加外部调研')) gaps.push('第 3 步缺外部调研条件');
  if (!method.includes('无稿须用户选')) gaps.push('缺「无稿须用户选」');
  if (!method.includes('设计源固定四路')) gaps.push('缺「设计源固定四路」');

  const fifth = section(5);
  const segments = fifth.split('；');
  for (const name of Object.keys(ROUTES)) {
    const segment = segments.find(part => part.includes(name)) ?? '';
    if (!segment) {
      gaps.push(`第 5 步缺设计源路线：${name}`);
      continue;
    }
    for (const token of ROUTES[name]) {
      if (!segment.includes(token)) gaps.push(`第 5 步${name}缺必填项：${token}`);
    }
  }
  const noDraft = segments.find(part => part.includes('无稿')) ?? '';
  if (!noDraft.includes('用户明确接受风险')) gaps.push('第 5 步无稿直接实现缺用户明确接受风险');
  if (!noDraft.includes('未取得不进入直接实现')) gaps.push('第 5 步无稿直接实现缺未取得不进入');
  if (!fifth.includes('来源、负责人、可用时间、验收基准与缺项')) {
    gaps.push('第 5 步四路缺来源负责人可用时间验收基准与缺项');
  }

  const second = section(2);
  if (!second.includes('现有页面、路由、组件与规范')) gaps.push('第 2 步缺调研现有页面与组件');

  const eighth = section(8);
  if (!eighth.includes('分诊标出 UI 包')) gaps.push('第 8 步缺「分诊标出 UI 包」');
  if (!(steps.steps.find(step => step.step_id === 8)?.observable_result ?? '').includes('分诊标出 UI 包')) {
    gaps.push('steps.json 第 8 项缺「分诊标出 UI 包」');
  }

  const ninth = section(9);
  const ninthUi = (ninth.match(/\*\*UI 包的补充（第 9 步）\*\*[^\n]*/) ?? [''])[0];
  if (!ninthUi) gaps.push('第 9 步缺 UI 补格段');
  for (const token of ['“数据与状态”“成功失败验收”两格', '设计源', '对照项', '设计源和对照基准可用吗', '非 UI 包不补']) {
    if (!ninthUi.includes(token)) gaps.push(`第 9 步缺 UI 补格句：${token}`);
  }
  const ninthObserved = steps.steps.find(step => step.step_id === 9)?.observable_result ?? '';
  for (const token of ['UI 包补充', '成功失败验收', '设计源和对照基准可用吗']) {
    if (!ninthObserved.includes(token)) gaps.push(`steps.json 第 9 项缺 UI 补格句：${token}`);
  }

  const tenth = section(10);
  const tenthUi = (tenth.match(/\*\*设计审查镜头（仅 UI 包）\*\*[^\n]*/) ?? [''])[0];
  if (!tenthUi) gaps.push('第 10 步缺设计审查镜头段');
  for (const token of ['设计审查镜头', 'UI 需求是否收敛', '设计源是否确认', '验收是否可判', '非 UI 包不加镜头']) {
    if (!tenthUi.includes(token)) gaps.push(`第 10 步设计审查镜头缺：${token}`);
  }

  const templateBody = templateSection(template, '## UI 范围与设计基准');
  if (!templateBody) gaps.push('模板缺「UI 范围与设计基准」一节');
  else {
    for (const row of CARD_ROWS) if (!templateBody.includes(row)) gaps.push(`模板新节缺五行卡行：${row}`);
    if (!templateBody.includes('设计源固定四路')) gaps.push('模板新节缺四路');
    for (const name of Object.keys(ROUTES)) if (!templateBody.includes(name)) gaps.push(`模板新节缺设计源路线：${name}`);
    if (!templateBody.includes('非 UI')) gaps.push('模板新节缺非 UI 排除');
  }
  if (template.indexOf('## UI 范围与设计基准') < template.indexOf('## 原始需求')) {
    gaps.push('模板新节不在「原始需求」之后');
  }

  for (const [name, text] of [['design-source-readiness', skills.readiness], ['frontend-prototype-render', skills.prototype]]) {
    const trigger = skillTrigger(text);
    if (!trigger) gaps.push(`${name} 缺方法触发条件段`);
    else if (!trigger.includes('定方向第 1 步判为 UI 时')) {
      gaps.push(`${name} 方法触发条件缺「定方向第 1 步判为 UI 时」`);
    }
  }

  let manifest;
  try {
    manifest = yaml.load(deps);
  } catch {
    gaps.push('skill-deps.yaml 不可解析');
  }
  if (manifest) {
    if (manifest.stage !== 'make-decision') gaps.push('skill-deps.yaml stage 不是 make-decision');
    for (const [name, path] of [
      ['design-source-readiness', READINESS],
      ['frontend-prototype-render', PROTOTYPE],
    ]) {
      const entry = (manifest.skills ?? []).find(item => item.name === name);
      if (!entry) gaps.push(`skill-deps 缺依赖：${name}`);
      else {
        if (entry.path !== path) gaps.push(`skill-deps ${name} 路径不符`);
        if (!entry.trigger || !String(entry.trigger).trim()) gaps.push(`skill-deps ${name} 缺 trigger`);
      }
    }
  }

  for (const id of sortedIds) {
    const current = section(id);
    const baseline = stepSection(id === 6 || id === 7 ? baselineMethod : previousMethod, id);
    if (!baseline) {
      gaps.push(`第 ${id} 步基线读不到，无法比对`);
      continue;
    }
    if (id === 6 || id === 7) {
      if (current !== baseline) gaps.push(`第 ${id} 步与基线不逐字相同`);
    } else {
      checkExtraLines(gaps, current, baseline, id);
    }
  }
  for (const id of sortedIds) {
    checkManifestLines(
      gaps,
      steps,
      id === 6 || id === 7 ? baselineSteps : previousSteps,
      id,
    );
  }

  return gaps;
}

const fixture = () => ({
  method: read(METHOD),
  steps: JSON.parse(read(STEPS)),
  template: read(TEMPLATE),
  skills: { readiness: read(READINESS), prototype: read(PROTOTYPE) },
  deps: read(DEPS),
  baselineMethod: gitShow(BASELINE, METHOD),
  baselineSteps: JSON.parse(gitShow(BASELINE, STEPS)),
  previousMethod: gitShow(PREVIOUS, METHOD),
  previousSteps: JSON.parse(gitShow(PREVIOUS, STEPS)),
});

const withoutGap = (gaps, token) => gaps.some(gap => gap.includes(token));

describe('ORACLE-MD-UI make-decision UI branch', () => {
  test('第 1 步三源与五行卡、首问设计源、四路、第 8/9/10 步与模板一节可读', () => {
    const gaps = checkMakeDecisionUi(fixture());
    expect(gaps, `ORACLE-MD-UI 缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('内存副本删五行卡「设计源」一行，检查函数必须报缺该行', () => {
    const legal = fixture();
    const changed = {
      ...legal,
      method: legal.method.replace('③ 设计源、提供者与何时可用；', '③ 提供者与何时可用；'),
    };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '五行卡缺行：设计源'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(checkMakeDecisionUi(legal), '原字节不被反例污染').toEqual([]);
  });

  test('内存副本删整句三源判定句，检查函数必须报缺该句与三处判定', () => {
    const legal = fixture();
    const sentence = '三源 raw_requirement、project_inventory、planned_or_changed_frontend_fact 任一命中即按 UI 处理；三源都缺记“未知”加负责人，不默认非 UI，真实非 UI 写理由。';
    expect(legal.method.includes(sentence), '三源判定句可定位').toBe(true);
    const changed = { ...legal, method: legal.method.replace(sentence, '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '第 1 步缺三源判定句'), `缺口：${gaps.join('；')}`).toBe(true);
    for (const phrase of ['任一命中即按 UI 处理', '三源都缺', '不默认非 UI']) {
      expect(withoutGap(gaps, `第 1 步三源判定句缺：${phrase}`), `缺口应点名 ${phrase}：${gaps.join('；')}`).toBe(true);
    }
    expect(checkMakeDecisionUi(legal), '恢复原字节后转绿').toEqual([]);
  });

  test('内存副本给第 6 步加「须附设计稿」，基线比对必须变红', () => {
    const legal = fixture();
    const changed = {
      ...legal,
      method: legal.method.replace(
        '\n7. <a id="step-direction-advice"></a>',
        '\n   须附设计稿。\n7. <a id="step-direction-advice"></a>',
      ),
    };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '第 6 步与基线不逐字相同'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删第 6 步一句原句，基线比对同样必须变红', () => {
    const legal = fixture();
    const needle = '先执行现 `tools/cli/check-decision-log-chain.mjs';
    expect(legal.method.includes(needle), '第 6 步原句可定位').toBe(true);
    const changed = { ...legal, method: legal.method.replace(needle, '执行现') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '第 6 步与基线不逐字相同'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本去掉第 12 步 UI 前提、改成无条件句，条件检查必须变红', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replace('UI 任务时写稿引一行', '写稿引一行') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '第 12 步新增行缺 UI 前提'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删「无稿须用户选」，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('无稿须用户选', '无稿自选') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '无稿须用户选'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删外部稿「版本」必填项，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = {
      ...legal,
      method: legal.method.replace(
        '外部设计稿须写来源、版本、可用范围与验收基准',
        '外部设计稿须写来源、可用范围与验收基准',
      ),
    };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '外部设计稿缺必填项：版本'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删无稿「用户明确接受风险」，条件检查必须变红', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replace('用户明确接受风险', '风险自担') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, '无稿直接实现缺用户明确接受风险'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删 steps.json 第 9 项 UI 补格句，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = structuredClone(legal);
    const row = changed.steps.steps.find(step => step.step_id === 9);
    const before = row.observable_result;
    row.observable_result = before.slice(0, before.indexOf(' UI 包补充'));
    expect(row.observable_result).not.toBe(before);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, 'steps.json 第 9 项缺 UI 条件句'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(checkMakeDecisionUi(legal), '原字节不被反例污染').toEqual([]);
  });

  test('内存副本删 skills 触发条件，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = {
      ...legal,
      skills: {
        readiness: legal.skills.readiness.replace('定方向第 1 步判为 UI 时、', ''),
        prototype: legal.skills.prototype,
      },
    };
    expect(changed.skills.readiness).not.toBe(legal.skills.readiness);
    const gaps = checkMakeDecisionUi(changed);
    expect(withoutGap(gaps, 'design-source-readiness 方法触发条件'), `缺口：${gaps.join('；')}`).toBe(true);
  });
});
