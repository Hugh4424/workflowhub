// ORACLE-REVIEW-UI: reads the independent review method, the design review
// lens, the make-decision review contract and the stage skill plan as text and
// parsed JSON. Passing proves a UI task makes the existing review ask six named
// questions with inputs, applicable stages, pass/fail signals and evidence; the
// same six are asked at three depths (writing requirements asks whether the
// plan has them, staging asks whether acceptance has them, writing code asks
// whether real evidence exists); the review record says which materials were
// read, which pages were seen and which were not, that "material exists is not
// read", that an unseen page is recorded unread/unavailable and is not a pass,
// that a screenshot only supports visual comparison, and that a missing
// screenshot or diff original reports missing visual evidence; questions ③④⑤
// name the seven UI judgment fields build-code step 7 emits, one by one.
// It also proves plan-design-review covers make-decision and build-code,
// triggers on any one of the three UI sources, records unknown instead of
// defaulting to non-UI when all three are missing, that the make-decision detail
// contract registers the design lens while its direction section stays
// byte-identical to the 998614bd baseline, and that the stage skill plan
// registers the design lens on the make-decision detail track while its
// direction track stays deep-equal to the baseline.
// It does not prove a real reviewer follows the method, nor that a real review
// catches a defective UI material; those belong to P9.
// The block is frozen question by question: each of the six states that all
// three stages ask it, and acceptance 1's sentences (three sources missing is
// recorded unknown, missing screenshot or diff reports missing visual evidence,
// a missing field is a finding rather than a pass) are matched verbatim so that
// deleting one of them turns the suite red.
// In-memory counterexamples never touch disk.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const METHOD = 'skills/wh-review/SKILL.md';
const DESIGN = 'skills/plan-design-review/SKILL.md';
const CONTRACT = 'skills/wh-review/contracts/make-decision.md';
const PLAN = 'skills/wh-review/stage-skill-plan.json';
const BASELINE = '998614bd'; // task baseline cited by the phase card

// The six questions are fixed by decision-log work package 5「方案与取舍」.
const UI_SIX = [
  '是不是 UI',
  '设计稿齐不齐',
  '视觉证据有没有',
  '前端质量过不过',
  '组件有没有复用和沉淀',
  '功能有没有真接线',
];

// The same six at three depths: what each stage must find in its material.
const STAGE_DEPTH = [
  '写需求时问计划里有没有',
  '排阶段时问验收里有没有',
  '写代码时问实际证据有没有',
];

// Build-code step 7 emits these seven fields; questions ③④⑤ read them.
const UI_SEVEN = [
  'UI 适用性',
  'UI 合同',
  '组件质量图',
  '真实消费者',
  '状态所有者',
  '类型化视图模型',
  '样式令牌所有者',
];

// The three UI applicability sources named by decision 7 / build-plan step 9.
const UI_SOURCES = ['raw_requirement', 'project_inventory', 'planned_or_changed_frontend_fact'];

const UI_HEADING = '## UI 任务时审查多问哪六件事？';

// Every one of the six says all three stages ask it; the phrasing differs, the
// applicability does not. Six occurrences are one per question.
const UI_ASK = '适用阶段：三阶段都问';

// Acceptance 1 sentences frozen verbatim; deleting one must fail the suite.
const FROZEN_SENTENCES = [
  '三来源都缺时记「未知」加负责人',
  '缺截图或差异原件即报缺视觉证据',
  '缺任一项即记发现、不算通过',
];

// The block names its three stages and excludes the direction track, so a
// reader cannot carry the six questions into make-decision's four questions.
const SCOPE_SENTENCES = [
  '仅写需求、排阶段、写代码三处审查',
  '方向审查（make-decision 四问）不加 UI 问',
];

const read = path => readFileSync(resolve(root, path), 'utf8');
const cache = new Map();
const gitShow = (commit, path) => {
  const key = `${commit}:${path}`;
  if (!cache.has(key)) {
    const out = spawnSync('git', ['show', key], { cwd: root, encoding: 'utf8' });
    expect(out.status, `基线 ${key} 可读：${out.stderr ?? ''}`).toBe(0);
    cache.set(key, out.stdout);
  }
  return cache.get(key);
};

// The UI block is bounded by its own heading and the next level-2 heading.
function uiBlock(method) {
  const start = method.indexOf(UI_HEADING);
  if (start < 0) return null;
  const rest = method.slice(start + UI_HEADING.length);
  const next = rest.indexOf('\n## ');
  return next < 0 ? rest : rest.slice(0, next);
}

// The direction section is the byte range between its heading and detail's.
function directionSection(contract) {
  const start = contract.indexOf('## direction：先重建，再揭示，再挑战');
  const end = contract.indexOf('## detail：核对完整方案与真实回答');
  if (start < 0 || end <= start) return null;
  return contract.slice(start, end);
}

function checkMethod(method) {
  const gaps = [];
  const block = uiBlock(method);
  if (block === null) {
    gaps.push('缺 UI 六问块：未见「## UI 任务时审查多问哪六件事？」');
    return gaps;
  }
  for (const name of UI_SIX) if (!block.includes(name)) gaps.push(`UI 六问缺：${name}`);
  const askCount = block.split(UI_ASK).length - 1;
  if (askCount !== UI_SIX.length) {
    gaps.push(`每问的适用阶段不齐：应出现 ${UI_SIX.length} 次「${UI_ASK}」，实际 ${askCount} 次`);
  }
  for (const depth of STAGE_DEPTH) if (!block.includes(depth)) gaps.push(`三阶段问法缺：${depth}`);
  for (const v of ['读了哪些材料', '看了哪些页面', '哪些没看']) {
    if (!block.includes(v)) gaps.push(`审查记录要求缺：${v}`);
  }
  for (const v of ['材料存在不当已读', '没看成记未读或不可用、不算通过', '截图只支持视觉对照']) {
    if (!block.includes(v)) gaps.push(`未读与证据边界缺：${v}`);
  }
  for (const sentence of FROZEN_SENTENCES) {
    if (!block.includes(sentence)) gaps.push(`证据冻结缺：${sentence}`);
  }
  for (const sentence of SCOPE_SENTENCES) {
    if (!block.includes(sentence)) gaps.push(`阶段范围缺：${sentence}`);
  }
  if (!block.includes('不能自签')) gaps.push('七项判定字段用法缺：不能自签');
  for (const name of UI_SEVEN) if (!block.includes(name)) gaps.push(`七项界面判定字段缺：${name}`);
  if (!block.includes('非 UI 任务')) gaps.push('缺非 UI 任务不出现的说明');
  if (!block.includes('第③问') || !block.includes('第③④⑤问')) {
    gaps.push('缺第③问或第③④⑤问的具名指向');
  }
  return gaps;
}

function checkDesign(design) {
  const gaps = [];
  for (const key of UI_SOURCES) if (!design.includes(key)) gaps.push(`三来源缺：${key}`);
  for (const v of ['任一处命中即触发', '不默认非 UI', '负责人']) {
    if (!design.includes(v)) gaps.push(`三来源触发规则缺：${v}`);
  }
  for (const v of ['定方向', '写代码']) if (!design.includes(v)) gaps.push(`调用范围缺：${v}`);
  return gaps;
}

function checkContract(contract, baselineContract) {
  const gaps = [];
  for (const v of ['设计审查镜头（仅 UI 包）', 'UI 需求是否收敛', '设计源是否确认', '验收是否可判']) {
    if (!contract.includes(v)) gaps.push(`detail 设计镜头缺：${v}`);
  }
  for (const v of ['缺设计源', '缺对照项', '缺反例', '非 UI 包不加镜头']) {
    if (!contract.includes(v)) gaps.push(`detail 设计镜头边界缺：${v}`);
  }
  const current = directionSection(contract);
  const baseline = directionSection(baselineContract);
  if (current === null) gaps.push('读不到 direction 段，无法与基线比对');
  else if (baseline === null) gaps.push('基线 direction 段读不到');
  else if (current !== baseline) gaps.push('方向审查段与 998614bd 基线不逐字相同');
  return gaps;
}

function checkPlan(plan, baselinePlan) {
  const gaps = [];
  const detail = plan.stages?.['make-decision']?.tracks?.detail;
  const optional = Array.isArray(detail?.optional_skills) ? detail.optional_skills : [];
  if (!optional.some(s => s?.name === 'plan-design-review' && s?.when === 'ui')) {
    gaps.push('定方向细节轨缺设计镜头：plan-design-review（when=ui）未登记');
  }
  const direction = plan.stages?.['make-decision']?.tracks?.direction;
  const baselineDirection = baselinePlan.stages?.['make-decision']?.tracks?.direction;
  if (direction === undefined) gaps.push('镜头计划缺 make-decision direction 轨');
  else if (baselineDirection === undefined) gaps.push('基线镜头计划缺 make-decision direction 轨');
  else if (JSON.stringify(direction) !== JSON.stringify(baselineDirection)) {
    gaps.push('镜头计划方向轨与 998614bd 基线不逐字相同');
  }
  return gaps;
}

function fixture() {
  return {
    method: read(METHOD),
    design: read(DESIGN),
    contract: read(CONTRACT),
    plan: JSON.parse(read(PLAN)),
    baselinePlan: JSON.parse(gitShow(BASELINE, PLAN)),
    baselineContract: gitShow(BASELINE, CONTRACT),
  };
}

const missing = (gaps, needle) => gaps.some(gap => gap.includes(needle));

describe('ui-stage-review', () => {
  test('UI 任务时审查方法问六件事，三个阶段问法不同', () => {
    const gaps = checkMethod(fixture().method);
    expect(gaps, `审查方法缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('设计审查技能调用范围补定方向与写代码，按三来源触发且不默认非 UI', () => {
    const gaps = checkDesign(fixture().design);
    expect(gaps, `设计审查技能缺口：${gaps.join('；')}`).toEqual([]);
  });

  test('细节审查合同登记设计镜头，方向审查段与基线逐字相同', () => {
    const legal = fixture();
    const gaps = checkContract(legal.contract, legal.baselineContract);
    expect(gaps, `审查合同缺口：${gaps.join('；')}`).toEqual([]);
    expect(directionSection(legal.contract), '方向审查段本来就通过基线比对').toBe(
      directionSection(legal.baselineContract),
    );
  });

  test('镜头计划 detail 轨登记设计镜头，direction 轨与基线深相等', () => {
    const legal = fixture();
    const gaps = checkPlan(legal.plan, legal.baselinePlan);
    expect(gaps, `镜头计划缺口：${gaps.join('；')}`).toEqual([]);
    expect(legal.plan.stages['make-decision'].tracks.direction, '方向轨本来就通过基线比对').toEqual(
      legal.baselinePlan.stages['make-decision'].tracks.direction,
    );
  });

  test('方向审查合同与镜头计划方向轨本来就与 998614bd 基线相同', () => {
    const legal = fixture();
    expect(directionSection(legal.contract), '方向审查段本来就通过基线比对').toBe(
      directionSection(legal.baselineContract),
    );
    expect(legal.plan.stages['make-decision'].tracks.direction, '方向轨本来就通过基线比对').toEqual(
      legal.baselinePlan.stages['make-decision'].tracks.direction,
    );
  });

  test('内存副本删掉镜头计划的设计镜头，检查必须报缺该登记', () => {
    const legal = fixture();
    const changed = structuredClone(legal.plan);
    delete changed.stages['make-decision'].tracks.detail.optional_skills;
    const gaps = checkPlan(changed, legal.baselinePlan);
    expect(missing(gaps, '定方向细节轨缺设计镜头'), `缺口：${gaps.join('；')}`).toBe(true);
    expect(checkPlan(legal.plan, legal.baselinePlan), '原字节不被反例污染').toEqual([]);
  });

  test('内存副本给方向轨加一条 UI 问，基线比对必须变红', () => {
    const legal = fixture();
    const changed = structuredClone(legal.plan);
    changed.stages['make-decision'].tracks.direction.optional_skills = [
      { name: 'plan-design-review', when: 'ui' },
    ];
    const gaps = checkPlan(changed, legal.baselinePlan);
    expect(missing(gaps, '方向轨与 998614bd 基线不逐字相同'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本把「材料存在不当已读」改成「材料存在即已读」，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replace('材料存在不当已读', '材料存在即已读');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '未读与证据边界缺：材料存在不当已读'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删掉第③问的「缺视觉证据」句，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replaceAll('缺视觉证据', '');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '缺视觉证据'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删掉七项界面判定字段中的「样式令牌所有者」，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replaceAll('样式令牌所有者', '');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '七项界面判定字段缺：样式令牌所有者'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本把设计审查触发条件删回一个来源，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.design.replaceAll('project_inventory', '');
    expect(changed).not.toBe(legal.design);
    const gaps = checkDesign(changed);
    expect(missing(gaps, '三来源缺：project_inventory'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本把三来源都缺改成默认非 UI，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.design.replace('不默认非 UI', '默认非 UI');
    expect(changed).not.toBe(legal.design);
    const gaps = checkDesign(changed);
    expect(missing(gaps, '三来源触发规则缺：不默认非 UI'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删掉 detail 设计镜头的「缺反例」，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.contract.replaceAll('缺反例', '');
    expect(changed).not.toBe(legal.contract);
    const gaps = checkContract(changed, legal.baselineContract);
    expect(missing(gaps, 'detail 设计镜头边界缺：缺反例'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本把「三来源都缺时记未知」改掉，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replace('三来源都缺时记「未知」加负责人', '三来源都缺时按非 UI 处理');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '证据冻结缺：三来源都缺时记「未知」加负责人'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删掉「缺截图或差异原件」判法，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replace('缺截图或差异原件即报缺视觉证据', '证据不足');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '证据冻结缺：缺截图或差异原件即报缺视觉证据'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删掉「记发现、不算通过」，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replaceAll('缺任一项即记发现、不算通过', '');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '证据冻结缺：缺任一项即记发现、不算通过'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删掉方向审查排除句，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replace('方向审查（make-decision 四问）不加 UI 问', '');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '阶段范围缺：方向审查（make-decision 四问）不加 UI 问'), `缺口：${gaps.join('；')}`).toBe(true);
  });

  test('内存副本删掉一问的适用阶段，断言必须变红', () => {
    const legal = fixture();
    const changed = legal.method.replace('适用阶段：三阶段都问，问法见下。', '');
    expect(changed).not.toBe(legal.method);
    const gaps = checkMethod(changed);
    expect(missing(gaps, '每问的适用阶段不齐'), `缺口：${gaps.join('；')}`).toBe(true);
  });
});
