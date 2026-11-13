// ORACLE-CODE-UI: reads the build-code method, its step manifest, the
// frontend-testing page-audit reference and the dependency manifest as text.
// Passing proves a UI task makes build-code step 1 read the five-segment UI six
// items read back by build-plan, step 6 compare the design against the two
// fixed viewports (1440×900, 390×844) in a fixed environment and record the
// user-accepted deviation, steps 6–7 state the frontend quality minimum
// (LCP/CLS/INP with their source, 200% zoom, physical screen-reader fallback),
// step 7 write component reuse and the component spec back under the target
// project root and emit the seven UI judgment fields, steps 8–9 add a design
// review angle and joint visual/functional re-verification, and the terminal
// re-check the comparison conclusion. It also proves every non-UI path keeps
// the 998614bd bytes: unlisted steps stay byte-identical, listed steps and
// observable results only gain a UI-conditioned tail that starts with a UI
// premise and ends with 非 UI 跳过, and no manifest key is added.
// It does not prove a real build-code executor follows the method, nor that a
// real screenshot matches the design; those belong to P9.
// In-memory counterexamples never touch disk.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';
import { describe, expect, test } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const METHOD = 'workflows/build-code/SKILL.md';
const STEPS = 'workflows/build-code/steps.json';
const PACK = 'skills/frontend-testing/references/page-audit.md';
const DEPS = 'workflows/build-code/skill-deps.yaml';
const BASELINE = '998614bd'; // task baseline cited by the phase card

const UI_STEPS = [1, 6, 7, 8, 9];
const NON_UI_STEPS = [2, 3, 4, 5, 10, 11, 12];

// The six field names come from build-plan's step 7; build-code consumes them.
const UI_SIX = [
  '设计源引用',
  '页面／路由／组件与状态乘视口',
  '视觉对照项',
  '前端质量门',
  '组件复用与沉淀',
  '独立设计审查与证据',
];

// Decision-log work package 4「数据与状态」names the seven judgment fields.
const UI_SEVEN = [
  'UI 适用性',
  'UI 合同',
  '组件质量图',
  '真实消费者',
  '状态所有者',
  '类型化视图模型',
  '样式令牌所有者',
];

// Two fixed viewports and the four fixed environment facts.
const VIEWPORTS = ['1440×900', '390×844'];
const ENVIRONMENT = ['固定浏览器', '系统默认字体', '缩放 100%', '固定数据'];

// Frontend quality minimum: thresholds, their source sentence, zoom, a11y.
const QUALITY = [
  'LCP 不超过 2.5 秒',
  'CLS 不超过 0.1',
  'INP 不超过 200 毫秒',
  '决策记录工作包 4',
  '前端质量的最小判据',
  '无控制台错误',
  '无横向滚动',
  '390 宽',
  '主操作不被裁切',
  '可键盘到达',
  '焦点可见',
  '可访问名非空',
  '200% 缩放',
  '读屏',
  '不可用',
  '负责人',
  '恢复条件',
];

const WRITEBACK = [
  '组件复用与沉淀',
  '目标项目根下的组件规范',
  '演练副本',
  '无沉淀',
  '缺任一项证据即未通过',
  '实现者不能自签',
];

const read = path => readFileSync(resolve(root, path), 'utf8');
const gitShow = (commit, path) => {
  const out = spawnSync('git', ['show', `${commit}:${path}`], { cwd: root, encoding: 'utf8' });
  expect(out.status, `基线 ${commit} 上可读 ${path}：${out.stderr ?? ''}`).toBe(0);
  return out.stdout;
};

// A numbered step runs until the next numbered step or the next level-2
// heading, so an appended UI block stays inside its own step. The method's
// step 1 is the first "1. " in the file; later numbered lists start after the
// last method step.
const stepSection = (text, id) => {
  const start = text.search(new RegExp(`^${id}\\. `, 'm'));
  if (start < 0) return '';
  const body = text.slice(start + `${id}. `.length);
  const end = body.search(/^(?:\d+\. |## )/m);
  return end < 0 ? body : body.slice(0, end);
};

const terminalSection = text => {
  const at = text.search(/^## 最后 Phase：终末承接$/m);
  if (at < 0) return '';
  const body = text.slice(at);
  const end = body.slice(1).search(/^## /m);
  return end < 0 ? body : body.slice(0, end + 1);
};

const stepRow = (steps, id) => steps.steps.find(step => step.step_id === id) ?? {};

const missing = (gaps, token) => gaps.some(gap => gap.includes(token));

// Every non-empty baseline line that is not the version line must still occur
// in the current file, in the baseline order; new lines may only be inserted.
function firstOutOfOrder(baseline, current) {
  const base = baseline.split('\n').filter(line => line.trim() !== '' && !/^version: /.test(line));
  const lines = current.split('\n');
  let at = -1;
  for (const line of base) {
    const found = lines.indexOf(line, at + 1);
    if (found < 0) return line;
    at = found;
  }
  return null;
}

const uiTail = (current, baseline, label, gaps) => {
  if (!baseline) {
    gaps.push(`${label} 基线读不到，无法比对`);
    return '';
  }
  if (!current.startsWith(baseline)) {
    gaps.push(`${label} 非 UI 路径与原句不逐字相同`);
    return '';
  }
  const tail = current.slice(baseline.length).trim();
  if (!tail) gaps.push(`${label} 缺 UI 条件句`);
  else {
    if (!tail.startsWith('UI')) gaps.push(`${label} 新增段缺 UI 前提`);
    if (!tail.includes('非 UI 跳过')) gaps.push(`${label} 缺「非 UI 跳过」`);
  }
  return tail;
};

// Returns the named gaps; an empty list means the UI quality contract holds and
// every non-UI path is unchanged.
function checkBuildCodeUi({ method, steps, pack, deps, baselineMethod, baselineSteps, baselinePack, baselineDeps }) {
  const gaps = [];

  // 1. Step 1 reads the build-plan UI six items plus the approved prototype.
  const step1 = uiTail(stepSection(method, 1), stepSection(baselineMethod, 1), '第 1 步', gaps);
  if (step1) {
    if (!step1.includes('设计源')) gaps.push('第 1 步缺：设计源');
    if (!step1.includes('已批准原型')) gaps.push('第 1 步缺：已批准原型');
    for (const name of UI_SIX) if (!step1.includes(name)) gaps.push(`第 1 步缺：${name}`);
  }

  // 2. Step 6 compares the two fixed viewports in the fixed environment and
  //    records the through/difference/user-accepted-deviation items.
  const step6 = uiTail(stepSection(method, 6), stepSection(baselineMethod, 6), '第 6 步', gaps);
  if (step6) {
    // 逐项 and 差异 also appear in step 8, so these tokens are read from the
    // step-6 tail only; a mention elsewhere never satisfies them.
    for (const token of [...VIEWPORTS, ...ENVIRONMENT, '逐项', '差异']) {
      if (!step6.includes(token)) gaps.push(`第 6 步缺：${token}`);
    }
    if (!step6.includes('偏差由用户确认')) gaps.push('第 6 步缺「偏差由用户确认」');
    if (!step6.includes('不由实现者自签')) gaps.push('第 6 步缺「不由实现者自签」');
  }

  // 3. Steps 6–7 state the frontend quality minimum, thresholds and source.
  const qualityBlock = `${step6}\n${stepSection(method, 7).slice(stepSection(baselineMethod, 7).length)}`;
  for (const token of QUALITY) {
    if (!qualityBlock.includes(token)) gaps.push(`前端质量最低判据缺：${token}`);
  }

  // 4. Step 7 writes component reuse and the component spec back under the
  //    target project root and emits the seven judgment fields.
  const step7 = uiTail(stepSection(method, 7), stepSection(baselineMethod, 7), '第 7 步', gaps);
  if (step7) {
    for (const token of WRITEBACK) if (!step7.includes(token)) gaps.push(`第 7 步缺：${token}`);
    for (const name of UI_SEVEN) if (!step7.includes(name)) gaps.push(`第 7 步缺：${name}`);
  }

  // 5. Step 8 adds the design review angle; step 9 re-verifies visual and
  //    functional findings together.
  const step8 = uiTail(stepSection(method, 8), stepSection(baselineMethod, 8), '第 8 步', gaps);
  if (step8) {
    if (!step8.includes('设计审查')) gaps.push('第 8 步缺：设计审查角度');
    if (!step8.includes('截图')) gaps.push('第 8 步缺：截图');
    if (!step8.includes('差异')) gaps.push('第 8 步缺：差异');
  }
  const step9 = uiTail(stepSection(method, 9), stepSection(baselineMethod, 9), '第 9 步', gaps);
  if (step9) {
    if (!step9.includes('视觉问题')) gaps.push('第 9 步缺：视觉问题');
    if (!step9.includes('功能问题')) gaps.push('第 9 步缺：功能问题');
    if (!step9.includes('同修同复验')) gaps.push('第 9 步缺：同修同复验');
  }

  // 6. The terminal re-checks the comparison conclusion for a UI task.
  const terminal = terminalSection(method);
  if (!terminal.includes('对照结论')) gaps.push('终末缺对照结论复核');
  if (!terminal.includes('UI 任务时')) gaps.push('终末缺 UI 前提');
  if (!terminal.includes('非 UI 跳过')) gaps.push('终末缺「非 UI 跳过」');

  // 7. Non-UI steps keep the baseline bytes; no step gains an unconditional
  //    action. The whole file's original lines stay in order.
  for (const id of NON_UI_STEPS) {
    const current = stepSection(method, id);
    const baseline = stepSection(baselineMethod, id);
    if (!baseline) gaps.push(`第 ${id} 步基线读不到，无法比对`);
    else if (current !== baseline) gaps.push(`第 ${id} 步非 UI 任务多出动作`);
  }
  const outOfOrder = firstOutOfOrder(baselineMethod, method);
  if (outOfOrder) gaps.push(`SKILL.md 基线原有行不再按序在：${outOfOrder.slice(0, 40)}`);

  // 8. A self-signed deviation is the exact failure the contract forbids.
  if (method.includes('实现者确认偏差')) gaps.push('偏差写成实现者自签');

  // 9. steps.json: the same UI steps gain a UI tail, no key is added, every
  //    other field and every other step stays as baseline.
  if (JSON.stringify(steps.steps.map(step => step.step_id)) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])) {
    gaps.push('steps.json 步骤编号序列改变');
  }
  for (const row of steps.steps) {
    const base = stepRow(baselineSteps, row.step_id);
    if (!base.step_slug) {
      gaps.push(`steps.json 第 ${row.step_id} 项基线读不到`);
      continue;
    }
    if (JSON.stringify(Object.keys(row).sort()) !== JSON.stringify(Object.keys(base).sort())) {
      gaps.push(`steps.json 第 ${row.step_id} 项键集合改变`);
    }
    if (row.step_slug !== base.step_slug) gaps.push(`steps.json 第 ${row.step_id} 项 step_slug 改变`);
    if (row.method_anchor !== base.method_anchor) gaps.push(`steps.json 第 ${row.step_id} 项 method_anchor 改变`);
    if (row.requires_user_reply !== base.requires_user_reply) {
      gaps.push(`steps.json 第 ${row.step_id} 项 requires_user_reply 改变`);
    }
    if (JSON.stringify(row.completion_evidence) !== JSON.stringify(base.completion_evidence)) {
      gaps.push(`steps.json 第 ${row.step_id} 项 completion_evidence 与基线不同`);
    }
    if (!UI_STEPS.includes(row.step_id) && row.observable_result !== base.observable_result) {
      gaps.push(`steps.json 第 ${row.step_id} 项非 UI 任务多出动作`);
    }
  }
  const stepTokens = {
    1: [...UI_SIX, '已批准原型'],
    6: [...VIEWPORTS, ...ENVIRONMENT, 'LCP 不超过 2.5 秒', 'CLS 不超过 0.1', 'INP 不超过 200 毫秒', '前端质量的最小判据', '200% 缩放', '读屏', '不可用'],
    7: ['组件复用与沉淀', '目标项目根下的组件规范', ...UI_SEVEN, '缺任一项证据即未通过'],
    8: ['设计审查角度'],
    9: ['同修同复验'],
  };
  for (const id of UI_STEPS) {
    const row = stepRow(steps, id);
    const tail = uiTail(String(row.observable_result ?? ''), stepRow(baselineSteps, id).observable_result ?? '', `steps.json 第 ${id} 项`, gaps);
    if (!tail) continue;
    for (const token of stepTokens[id]) {
      if (!tail.includes(token)) gaps.push(`steps.json 第 ${id} 项缺：${token}`);
    }
  }

  // 10. page-audit.md appends the component reuse and write-back section with
  //     the seven judgment fields, never rewriting the existing judgment text.
  if (!baselinePack) gaps.push('page-audit.md 基线读不到，无法比对');
  else if (!pack.startsWith(baselinePack)) gaps.push('page-audit.md 改前正文与原字节不同');
  else {
    const tail = pack.slice(baselinePack.length).trim();
    if (!tail) gaps.push('page-audit.md 缺组件复用与沉淀结论段');
    else {
      if (!tail.includes('组件复用与沉淀')) gaps.push('page-audit.md 缺：组件复用与沉淀');
      if (!tail.includes('目标项目根下的组件规范')) gaps.push('page-audit.md 缺：组件规范写回位置');
      if (!tail.includes('无沉淀')) gaps.push('page-audit.md 缺：无可复用组件时的记法');
      if (!tail.includes('UI 任务时')) gaps.push('page-audit.md 缺 UI 任务前提');
      if (!tail.includes('非 UI 跳过')) gaps.push('page-audit.md 缺「非 UI 跳过」');
      if (!tail.includes('缺任一项证据即未通过')) gaps.push('page-audit.md 缺「缺任一项证据即未通过」');
      for (const name of UI_SEVEN) if (!tail.includes(name)) gaps.push(`page-audit.md 缺：${name}`);
    }
  }
  const packOutOfOrder = firstOutOfOrder(baselinePack, pack);
  if (packOutOfOrder) gaps.push(`page-audit.md 基线原有行不再按序在：${packOutOfOrder.slice(0, 40)}`);

  // 11. The dependency manifest stays parseable, adds no key and keeps the
  //     frontend-testing trigger; a UI-condition note records the consumption.
  let manifest;
  try {
    manifest = yaml.load(deps);
  } catch {
    gaps.push('skill-deps.yaml 不可解析');
  }
  if (manifest && manifest.stage !== 'build-code') gaps.push('skill-deps.yaml stage 不是 build-code');
  let baselineManifest;
  try {
    baselineManifest = yaml.load(baselineDeps);
  } catch {
    gaps.push('skill-deps.yaml 基线不可解析');
  }
  if (manifest && baselineManifest) {
    if (JSON.stringify(Object.keys(manifest).sort()) !== JSON.stringify(Object.keys(baselineManifest).sort())) {
      gaps.push('skill-deps.yaml 新增键');
    }
    const rows = manifest.skills.map(skill => Object.keys(skill).sort());
    const baseRows = baselineManifest.skills.map(skill => Object.keys(skill).sort());
    if (JSON.stringify(rows) !== JSON.stringify(baseRows)) gaps.push('skill-deps.yaml 条目键集合改变');
    if (manifest.skills.length !== baselineManifest.skills.length) gaps.push('skill-deps.yaml 条目数改变');
    const frontend = manifest.skills.filter(skill => skill.name === 'frontend-testing');
    if (frontend.length !== 1) gaps.push('skill-deps.yaml frontend-testing 条目不是唯一');
    else if (frontend[0].trigger !== 'actual_frontend_test_or_browser_visible_page_audit') {
      gaps.push('skill-deps.yaml frontend-testing trigger 被改写');
    }
    const frontendBlock = deps.split(/\n(?=  - name: )/).find(block => block.includes('name: frontend-testing')) ?? '';
    const notes = frontendBlock.split('\n').filter(line => /^\s+#/.test(line));
    if (!notes.some(note => note.includes('UI 任务') && note.includes('非 UI 跳过'))) {
      gaps.push('skill-deps.yaml 前端测试条目缺 UI 条件说明');
    }
  }

  return gaps;
}

const fixture = () => ({
  method: read(METHOD),
  steps: JSON.parse(read(STEPS)),
  pack: read(PACK),
  deps: read(DEPS),
  baselineMethod: gitShow(BASELINE, METHOD),
  baselineSteps: JSON.parse(gitShow(BASELINE, STEPS)),
  baselinePack: gitShow(BASELINE, PACK),
  baselineDeps: gitShow(BASELINE, DEPS),
});

describe('ORACLE-CODE-UI build-code UI quality criteria', () => {
  test('第 1 步读设计源、已批准原型与 build-plan 的 UI 六项', () => {
    const legal = fixture();
    const step1 = stepSection(legal.method, 1);
    expect(step1, '第 1 步缺：设计源').toContain('设计源');
    for (const name of UI_SIX) {
      expect(step1, `第 1 步缺：${name}`).toContain(name);
    }
    const gaps = checkBuildCodeUi(legal);
    expect(gaps, `ORACLE-CODE-UI 缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('第 6 步按 1440×900 与 390×844 固定环境截图并记用户接受的偏差', () => {
    const legal = fixture();
    const step6 = stepSection(legal.method, 6);
    for (const token of [...VIEWPORTS, ...ENVIRONMENT]) {
      expect(step6, `第 6 步缺：${token}`).toContain(token);
    }
    expect(step6, '第 6 步缺「偏差由用户确认」').toContain('偏差由用户确认');
    expect(step6, '第 6 步缺「不由实现者自签」').toContain('不由实现者自签');
    expect(step6, '第 6 步缺「逐项」').toContain('逐项');
    expect(step6, '第 6 步缺「差异」').toContain('差异');
  });

  test('三项速度阈值带来源句，200% 缩放与读屏不可用记法写全', () => {
    const legal = fixture();
    // Only the appended UI tails count: a baseline sentence in the same step
    // must never satisfy the frontend-quality minimum.
    const tail = id => stepSection(legal.method, id).slice(stepSection(legal.baselineMethod, id).length);
    const block = `${tail(6)}\n${tail(7)}`;
    for (const token of QUALITY) {
      expect(block, `前端质量最低判据缺：${token}`).toContain(token);
    }
  });

  test('第 7 步写组件复用与沉淀、写回目标项目根并产出七项界面判定字段', () => {
    const legal = fixture();
    const step7 = stepSection(legal.method, 7);
    for (const token of WRITEBACK) {
      expect(step7, `第 7 步缺：${token}`).toContain(token);
    }
    for (const name of UI_SEVEN) {
      expect(step7, `第 7 步缺：${name}`).toContain(name);
    }
    expect(legal.pack, 'page-audit.md 缺「无沉淀」记法').toContain('无沉淀');
    expect(legal.pack, 'page-audit.md 缺「非 UI 跳过」').toContain('非 UI 跳过');
    expect(legal.pack, 'page-audit.md 缺 UI 任务前提').toContain('UI 任务时');
    for (const name of UI_SEVEN) {
      expect(legal.pack, `page-audit.md 缺：${name}`).toContain(name);
    }
  });

  test('第 8 步加设计审查角度、第 9 步同修同复验、终末复核对照结论', () => {
    const legal = fixture();
    expect(stepSection(legal.method, 8), '第 8 步缺：设计审查').toContain('设计审查');
    expect(stepSection(legal.method, 9), '第 9 步缺：同修同复验').toContain('同修同复验');
    expect(terminalSection(legal.method), '终末缺对照结论复核').toContain('对照结论');
    const gaps = checkBuildCodeUi(legal);
    expect(gaps, `ORACLE-CODE-UI 缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('非 UI 步骤与 998614bd 基线逐字相同，原有非空行仍按序在', () => {
    const legal = fixture();
    for (const id of NON_UI_STEPS) {
      expect(stepSection(legal.method, id), `第 ${id} 步非 UI 任务多出动作`).toBe(
        stepSection(legal.baselineMethod, id),
      );
    }
    expect(firstOutOfOrder(legal.baselineMethod, legal.method), 'SKILL.md 基线原有行不再按序在').toBe(null);
    expect(firstOutOfOrder(legal.baselinePack, legal.pack), 'page-audit.md 基线原有行不再按序在').toBe(null);
    const gaps = checkBuildCodeUi(legal);
    expect(gaps, `非 UI 路径缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('steps.json 只在第 1、6–9 步追加 UI 条件句，不新增键', () => {
    const legal = fixture();
    for (const id of UI_STEPS) {
      const tail = String(stepRow(legal.steps, id).observable_result ?? '').slice(
        String(stepRow(legal.baselineSteps, id).observable_result ?? '').length,
      );
      expect(tail.trim(), `steps.json 第 ${id} 项缺 UI 条件句`).not.toBe('');
      expect(tail.trim().startsWith('UI'), `steps.json 第 ${id} 项新增段缺 UI 前提`).toBe(true);
      expect(tail, `steps.json 第 ${id} 项缺「非 UI 跳过」`).toContain('非 UI 跳过');
    }
    for (const row of legal.steps.steps) {
      expect(Object.keys(row).sort(), `steps.json 第 ${row.step_id} 项键集合改变`).toEqual(
        Object.keys(stepRow(legal.baselineSteps, row.step_id)).sort(),
      );
    }
  });

  test('内存副本删「390×844」，检查函数必须报缺该尺寸', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('390×844', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '第 6 步缺：390×844'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(checkBuildCodeUi(legal), '原字节不被反例污染').toEqual([]);
  });

  test('内存副本加一句「实现者确认偏差」，检查函数必须报偏差自签', () => {
    const legal = fixture();
    const changed = {
      ...legal,
      method: legal.method.replace('偏差由用户确认', '实现者确认偏差'),
    };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '偏差写成实现者自签'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(missing(gaps, '第 6 步缺「偏差由用户确认」'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删「逐项写通过、差异」，第 6 步断言必须变红', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('逐项写通过、差异', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '第 6 步缺：逐项'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(missing(gaps, '第 6 步缺：差异'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删「可访问名非空」，检查函数必须报缺该句', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('可访问名非空', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '前端质量最低判据缺：可访问名非空'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删「无横向滚动」，检查函数必须报缺该句', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('无横向滚动', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '前端质量最低判据缺：无横向滚动'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本从七项界面判定字段删「状态所有者」，检查函数必须报缺', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('状态所有者', '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '第 7 步缺：状态所有者'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删 page-audit.md「目标项目根下的组件规范」，检查函数必须报缺写回位置', () => {
    const legal = fixture();
    const changed = { ...legal, pack: legal.pack.replaceAll('目标项目根下的组件规范', '') };
    expect(changed.pack).not.toBe(legal.pack);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, 'page-audit.md 缺：组件规范写回位置'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删一行原有非 UI 正文，基线比对必须变红', () => {
    const legal = fixture();
    const step2 = stepSection(legal.method, 2);
    expect(step2, '第 2 步基线可定位').toBeTruthy();
    const firstLine = step2.split('\n').find(line => line.trim() !== '');
    const changed = { ...legal, method: legal.method.replace(`${firstLine}\n`, '') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '第 2 步非 UI 任务多出动作'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本给非 UI 步骤新增一行不带 UI 前提的动作，必须报「非 UI 任务多出动作」', () => {
    const legal = fixture();
    const step3 = stepSection(legal.method, 3);
    expect(step3, '第 3 步基线可定位').toBeTruthy();
    const changed = { ...legal, method: legal.method.replace(step3, `${step3.trimEnd()}\n补一张 390 宽截图。\n`) };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, '第 3 步非 UI 任务多出动作'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本改动 steps.json 原有字句，去掉追加句后的比对必须变红', () => {
    const legal = fixture();
    const changed = structuredClone(legal);
    const row = changed.steps.steps.find(step => step.step_id === 1);
    row.observable_result = row.observable_result.replace('当前spec', '当前规格');
    expect(row.observable_result).not.toBe(stepRow(legal.steps, 1).observable_result);
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, 'steps.json 第 1 项 非 UI 路径与原句不逐字相同'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本给 steps.json 新增一个键，键集合比对必须变红', () => {
    const legal = fixture();
    const changed = structuredClone(legal);
    changed.steps.steps.find(step => step.step_id === 1).design_screen = 'components.md';
    const gaps = checkBuildCodeUi(changed);
    expect(missing(gaps, 'steps.json 第 1 项键集合改变'), `缺口：${gaps.join('；')}`).toBe(true);
  });
});
