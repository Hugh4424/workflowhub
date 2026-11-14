// ORACLE-CONV-CARD: reads the make-decision method, its step manifest and the
// decision-log template as text only.
// Passing proves those three documents describe the ten-cell convergence card,
// the five cold-read questions and the unchanged ten-column/five-category ledger
// shape. It does not prove any real task writes a card, nor that an independent
// reader answers the five questions.
// The UI-only guard covers the convergence-card block only: text appended after
// its closing line (the next stage's UI-package additions) is out of scope.
// A missing or misplaced closing line yields an empty card section, never a
// fallback to the rest of step 9.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const METHOD = 'workflows/make-decision/SKILL.md';
const STEPS = 'workflows/make-decision/steps.json';
const TEMPLATE = 'skills/decision-log/templates/decision-log-template.md';
const BASELINE = '998614bd'; // task baseline; the ledger shape must stay byte-identical

const CELLS = ['结果', '对应需求', '现状缺口', '方案与取舍', '边界', '数据与状态', '验收', '风险与回退', '未决', '白话复述'];
const CELL_LIST = `十格是${CELLS.join('、')}`;
const QUESTIONS = ['改什么', '为什么', '边界', '怎么验', '还有什么没定'];
const QUESTION_LIST = `冷读五问是${QUESTIONS.join('、')}`;
const NOT_CONVERGED = '答不出即未收敛';
const CARD_HEADING = '### 方案卡怎么写';
// The card section inside method step 9 has explicit boundaries so the UI-only
// check stays inside it: the next stage appends its UI-package additions after
// the closing line, and those additions must not turn this test red.
const CARD_START = '**每个包的方案卡与冷读（第 9 步）**';
const CARD_END = '以上是方案卡段的全部要求';
const CARD_END_LINE = `${CARD_END}；后续阶段在其后追加各自内容，本步不为它预留格子。`;
// A requirement that binds UI packages only is out of scope: the card is the same
// shape for UI and non-UI packages, and UI-only additions belong to the next stage.
const UI_ONLY = [/仅\s*UI/, /只对\s*UI\s*包/, /UI\s*包(?:另|额外|单独)/, /UI[^\n]{0,12}另(?:填|写)/];

const read = (path) => readFileSync(resolve(root, path), 'utf8');

const readBaseline = (path) => {
  const out = spawnSync('git', ['show', `${BASELINE}:${path}`], { cwd: root, encoding: 'utf8' });
  expect(out.status, `基线 ${BASELINE} 上可读 ${path}：${out.stderr ?? ''}`).toBe(0);
  return out.stdout;
};

// Same step split as the neighbouring make-decision contract tests: a numbered step
// runs until the next numbered step, so a paragraph appended at the end of step 9
// stays inside that step and cannot leak into step 10.
const stepSection = (text, id) =>
  text
    .split(new RegExp(`^${id}\\. (?:<a id="[^"]+"></a>)?\\x60`, 'm'))[1]
    ?.split(/^\d+\. (?:<a id="[^"]+"><\/a>)?`/m)[0] ?? '';

const ledgerShape = (text) => ({
  ten: text.match(/十列固定为 ([^；]+)；/)?.[1] ?? null,
  five: text.match(/五类分析列（([^）]+)）/)?.[1] ?? null,
});

const templateSection = (text) => {
  const start = text.indexOf(CARD_HEADING);
  if (start < 0) return '';
  return text.slice(start + CARD_HEADING.length).split(/\n#{1,3} /)[0];
};

// The convergence-card block: from its bold lead to its closing line. The closing
// line is searched only after the lead, so a misplaced or missing closing line can
// never widen the UI-only scan back to the rest of step 9. No closing line after
// the lead means no card section, never a fallback to the remaining step text.
const cardSection = (method) => {
  const step = stepSection(method, 9);
  const start = step.indexOf(CARD_START);
  if (start < 0) return '';
  const fromStart = start + CARD_START.length;
  const end = step.indexOf(CARD_END, fromStart);
  if (end < 0) return '';
  return step.slice(start, end + CARD_END.length);
};

// Returns the named gaps; an empty list means the convergence card contract holds.
function checkConvergenceCard({ method, steps, template, baselineMethod }) {
  const gaps = [];
  const step = stepSection(method, 9);
  const card = cardSection(method);

  if (!step.includes(CARD_START)) gaps.push('第 9 步缺方案卡段');
  else if (!card) gaps.push('方案卡段缺结尾定位句');
  if (!card.includes(CELL_LIST)) gaps.push('第 9 步缺十格名单');
  for (const cell of CELLS) if (!card.includes(cell)) gaps.push(`第 9 步缺格名：${cell}`);
  if (!card.includes(QUESTION_LIST)) gaps.push('第 9 步缺冷读五问名单');
  for (const question of QUESTIONS) if (!card.includes(question)) gaps.push(`第 9 步冷读五问缺：${question}`);
  if (!card.includes(NOT_CONVERGED)) gaps.push(`第 9 步缺「${NOT_CONVERGED}」`);
  for (const pattern of UI_ONLY) {
    if (pattern.test(card)) {
      gaps.push('方案卡段出现只对 UI 生效的要求');
      break;
    }
  }

  const observed =
    (steps.steps ?? []).find((step) => step.step_slug === 'module-convergence')?.observable_result ?? '';
  if (!observed.includes('方案卡与冷读记录')) gaps.push('步骤表第 9 项可见结果缺「方案卡与冷读记录」');

  const templateBody = templateSection(template);
  if (!templateBody) gaps.push('模板缺方案卡一节');
  else {
    for (const cell of CELLS) if (!templateBody.includes(cell)) gaps.push(`模板方案卡一节缺格名：${cell}`);
    if (!templateBody.includes('冷读五问')) gaps.push('模板方案卡一节缺冷读五问');
  }

  const current = ledgerShape(method);
  const baseline = ledgerShape(baselineMethod);
  if (!baseline.ten || !baseline.five) gaps.push('基线十列或五类分析列名读不到，无法比对');
  if (current.ten !== baseline.ten) gaps.push('十列台账列名与基线不逐字相同');
  if (current.five !== baseline.five) gaps.push('五类分析列名与基线不逐字相同');

  return gaps;
}

const fixture = () => ({
  method: read(METHOD),
  steps: JSON.parse(read(STEPS)),
  template: read(TEMPLATE),
  baselineMethod: readBaseline(METHOD),
});

describe('ORACLE-CONV-CARD convergence card contract', () => {
  test('第 9 步写出十格方案卡与冷读五问，模板有方案卡一节，十列与五类形状不变', () => {
    const gaps = checkConvergenceCard(fixture());
    expect(gaps, `ORACLE-CONV-CARD 缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('内存副本删「白话复述」格，检查函数必须报缺该格', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replaceAll('白话复述', '删除') };
    expect(changed.method, '反例副本确实删掉了该格').not.toBe(legal.method);
    const gaps = checkConvergenceCard(changed);
    expect(gaps.some((gap) => gap.includes('白话复述')), `缺口应点名白话复述：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本改十列台账的「方案与取舍」列名，基线比对必须变红', () => {
    const legal = fixture();
    const needle = '包｜目标｜边界｜方案与取舍｜验收';
    expect(legal.method.includes(needle), '十列台账原列名可定位').toBe(true);
    const changed = { ...legal, method: legal.method.replace(needle, '包｜目标｜边界｜方案与选择｜验收') };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkConvergenceCard(changed);
    expect(gaps, `缺口：${gaps.join('；')}`).toContain('十列台账列名与基线不逐字相同');
    expect(checkConvergenceCard(legal), '原字节不被反例污染').toEqual([]);
  });

  test('内存副本在方案卡段加「UI 任务另填设计源」，必须报方案卡段出现只对 UI 生效的要求', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replace(CELL_LIST, `${CELL_LIST}。UI 任务另填设计源`) };
    expect(changed.method).not.toBe(legal.method);
    const card = cardSection(legal.method);
    expect(card.includes('UI 任务另填设计源'), '原方案卡段不含该句').toBe(false);
    expect(cardSection(changed.method).includes('UI 任务另填设计源'), '注入后仍在方案卡段内').toBe(true);
    const gaps = checkConvergenceCard(changed);
    expect(gaps, `缺口：${gaps.join('；')}`).toContain('方案卡段出现只对 UI 生效的要求');
  });

  test('内存副本在方案卡段写「只对 UI 包生效」，必须报出', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replace(CELL_LIST, `${CELL_LIST}。本卡只对 UI 包生效`) };
    expect(changed.method).not.toBe(legal.method);
    const gaps = checkConvergenceCard(changed);
    expect(gaps, `缺口：${gaps.join('；')}`).toContain('方案卡段出现只对 UI 生效的要求');
  });

  test('方案卡段之外（结尾定位句之后）提到 UI 包另补，不得报出，证明范围已收窄', () => {
    const legal = fixture();
    const appended = `${CARD_END}；后续阶段在第 9 步追加 UI 包另补设计源两格与验收五问子问。`;
    const changed = { ...legal, method: legal.method.replace(CARD_END, appended) };
    expect(changed.method).not.toBe(legal.method);
    const card = cardSection(changed.method);
    expect(card.includes('UI 包另补设计源'), '追加内容落在方案卡段之外').toBe(false);
    expect(checkConvergenceCard(changed), '段外 UI 追加不得让本测试变红').toEqual([]);
    expect(checkConvergenceCard(legal), '原字节不被反例污染').toEqual([]);
  });

  test('结尾定位句整句缺失时报缺结尾句并返回空段，不得退回第 9 步全文', () => {
    const legal = fixture();
    const changed = { ...legal, method: legal.method.replace(CARD_END_LINE, '') };
    expect(changed.method).not.toBe(legal.method);
    expect(changed.method.includes(CARD_END), '副本里已不存在结尾定位句').toBe(false);
    const gaps = checkConvergenceCard(changed);
    expect(gaps, `缺口：${gaps.join('；')}`).toContain('方案卡段缺结尾定位句');
    expect(cardSection(changed.method), '缺结尾句时返回空段而不是第 9 步剩余全文').toBe('');
  });

  test('结尾定位句出现在起始句之前时同样报错，不得把 UI 扫描放宽回第 9 步', () => {
    const legal = fixture();
    const moved = legal.method
      .replace(`   ${CARD_END_LINE}\n`, '')
      .replace(`   ${CARD_START}\n`, `   ${CARD_END_LINE}\n\n   ${CARD_START}\n`)
      .replace('\n10. <a id="step-detail-advice"></a>', '\n   本步 UI 包另补设计源，本句在方案卡段之外。\n10. <a id="step-detail-advice"></a>');
    expect(moved).not.toBe(legal.method);
    expect(moved.indexOf(CARD_END), '结尾句仍留在文中').toBeGreaterThanOrEqual(0);
    expect(moved.indexOf(CARD_END), '结尾句已前置于起始句').toBeLessThan(moved.indexOf(CARD_START));
    const changed = { ...legal, method: moved };
    const gaps = checkConvergenceCard(changed);
    expect(gaps, `缺口：${gaps.join('；')}`).toContain('方案卡段缺结尾定位句');
    expect(gaps, '前置结尾句时不得把段外 UI 文字算进段内').not.toContain('方案卡段出现只对 UI 生效的要求');
    expect(cardSection(moved), '前置结尾句时返回空段').toBe('');
  });
});
