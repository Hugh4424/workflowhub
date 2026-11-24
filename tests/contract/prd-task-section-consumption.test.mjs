// ORACLE-PRD-CARD — P6 冻结契约测试（独立测试作者，改实现前预写；冻结后实施者只读）。
// 观察对象：实际用户需求有独立、用户可见的结果与前置供件、四行验收；五列地图指向同一任务节；
// 两类错填（地图孤儿、结果列写实现）必须被点名；不新增第三次内容调用或第二份索引；既有 UI 三段照原样。
// 只读 skills/task-maker/SKILL.md、skills/spec-prd/SKILL.md、skills/spec-prd/templates/prd-template.md
// 的真实字节；坏样本只在测试内构造。失败信息按文件与对象具名，不靠退出码本身。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TEMPLATE = 'skills/spec-prd/templates/prd-template.md';
const SPEC_PRD = 'skills/spec-prd/SKILL.md';
const TASK_MAKER = 'skills/task-maker/SKILL.md';
const TEMPLATE_DIR = 'skills/spec-prd/templates';
const FOUR_ROWS = ['目标', '怎么操作', '什么条件', '怎样算通过'];
const read = (relative) => readFileSync(join(ROOT, relative), 'utf8');

function between(text, start, end) {
  const from = text.indexOf(start);
  if (from < 0) return '';
  const rest = text.slice(from + start.length);
  const to = rest.indexOf(end);
  return to < 0 ? rest : rest.slice(0, to);
}

function fail(issues, label) {
  assert.deepEqual(issues, [], `${label}（ORACLE-PRD-CARD）：\n- ${issues.join('\n- ')}`);
}

function hasOrderedFourRows(text) {
  let cursor = -1;
  for (const row of FOUR_ROWS) {
    const next = text.indexOf(row, cursor + 1);
    if (next < 0) return false;
    cursor = next;
  }
  return true;
}

function cardSection(template) {
  return between(template, '## 任务卡', '\n## 覆盖、风险与没定');
}

// 任务卡内容区＝字段内容要求表（每卡六个字段）＋「## 任务卡」节；供件与四行必须写在这个消费面里。
function cardConsumptionZone(template) {
  return `${between(template, '每卡六个字段的内容要求固定如下', '\n## 导航')}\n${cardSection(template)}`;
}

function mapSection(template) {
  return between(template, '## 任务地图', '\n## 任务卡');
}

function mapRows(markdown) {
  const rows = [];
  for (const line of mapSection(markdown).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
    if (cells.length !== 5) continue;
    if (cells[0] === '任务') continue;
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    rows.push(cells);
  }
  return rows;
}

function taskHeadingIds(markdown) {
  const ids = new Set();
  for (const line of cardSection(markdown).split('\n')) {
    if (!/^#{3,4}\s/.test(line)) continue;
    for (const token of line.match(/[A-Z][A-Z0-9]*-\d+[A-Za-z0-9]*/g) || []) ids.add(token);
  }
  return ids;
}

// 地图孤儿判定器：五列地图每一行的「任务」必须能在同一 prd.md 的「任务卡」节找到对应标题。
function mapOrphanIssues(markdown) {
  const ids = taskHeadingIds(markdown);
  const issues = [];
  for (const cells of mapRows(markdown)) {
    const raw = cells[0].replace(/`/g, '');
    const token = raw.match(/[A-Z][A-Z0-9]*-\d+[A-Za-z0-9]*/);
    const id = token ? token[0] : raw;
    if (!ids.has(id)) {
      issues.push(`地图孤儿：任务「${raw}」在地图有行，但同一 prd.md 的「任务卡」没有对应标题`);
    }
  }
  return issues;
}

const IMPLEMENTATION_DETAIL =
  /\.(?:mjs|js|ts|tsx|py|json)\b|函数|模块|类名|缓存层|重构|数据库表|接口字段|`[^`]+`|\b[a-z][a-zA-Z0-9]*\s*\(/;

// 结果列判定器：结果列只写用户可见结果，写到实现手段就点名该地图行。
function resultColumnIssues(markdown) {
  const issues = [];
  for (const cells of mapRows(markdown)) {
    if (IMPLEMENTATION_DETAIL.test(cells[1])) {
      issues.push(`结果列写实现：任务「${cells[0]}」的「结果」是「${cells[1]}」，不是用户可见结果`);
    }
  }
  return issues;
}

function appendMapRow(markdown, row) {
  const start = markdown.indexOf('## 任务地图');
  assert.notEqual(start, -1, '夹具失败：模板缺少「## 任务地图」节，无法插入坏样本');
  const end = markdown.indexOf('\n## 任务卡', start);
  const insertAt = end < 0 ? markdown.length : end;
  return `${markdown.slice(0, insertAt)}\n${row}${markdown.slice(insertAt)}`;
}

function replaceMapResult(markdown, taskId, result) {
  return markdown.replace(new RegExp(`^\\| ${taskId} \\|[^|]*\\|`, 'm'), `| ${taskId} | ${result} |`);
}

function fourPartIssues() {
  const template = read(TEMPLATE);
  const zone = cardConsumptionZone(template);
  const taskMaker = read(TASK_MAKER);
  const issues = [];

  for (const [file, text] of [[TEMPLATE, zone], [TASK_MAKER, taskMaker]]) {
    if (!/独立结果/.test(text)) issues.push(`${file}：任务节没有把「独立结果」列为必需内容`);
    if (!/用户可见|用户能观察/.test(text)) issues.push(`${file}：独立结果没有限定为「用户可见」`);
    if (!/前置供件|前置[^\n。]{0,40}供件|供件[^\n。]{0,40}前置/.test(text)) {
      issues.push(`${file}：任务节没有把「前置供件」列为必需内容`);
    }
    if (!/提供者|谁提供/.test(text)) issues.push(`${file}：前置供件没有点名由「提供者/谁提供」给出`);
    if (!/(?:下游|接收)(?:读法|读取|怎么读|复读)/.test(text)) {
      issues.push(`${file}：前置供件没有写「下游/接收读法」`);
    }
    if (!/四行验收/.test(text)) issues.push(`${file}：任务节没有把「四行验收」列为必需内容`);
    if (!hasOrderedFourRows(text)) {
      issues.push(`${file}：四行验收不是同一组「目标/怎么操作/什么条件/怎样算通过」`);
    }
  }
  return issues;
}

function crossReferenceIssues() {
  const template = read(TEMPLATE);
  const taskMaker = read(TASK_MAKER);
  const issues = [];
  if (!/prd-template\.md/.test(taskMaker)) {
    issues.push(`${TASK_MAKER}：没有引用模板 ${TEMPLATE}`);
  }
  if (!/prd-template\.md[^\n]{0,60}任务卡|任务卡[^\n]{0,60}prd-template\.md|prd-template\.md#任务卡/.test(taskMaker)) {
    issues.push(`${TASK_MAKER}：对模板的引用没有指向「任务卡」同一节`);
  }
  if (!/task-maker\/SKILL\.md/.test(template)) {
    issues.push(`${TEMPLATE}：没有反引 ${TASK_MAKER}`);
  }
  if (
    !/task-maker\/SKILL\.md[^\n]{0,80}(?:展开任务分节|任务分节|expand-task-section)|(?:展开任务分节|任务分节|expand-task-section)[^\n]{0,80}task-maker\/SKILL\.md/.test(
      template,
    )
  ) {
    issues.push(`${TEMPLATE}：反引没有指向 task-maker 的「展开任务分节」同一方法`);
  }
  return issues;
}

function mapRuleIssues() {
  const template = read(TEMPLATE);
  const map = mapSection(template);
  const taskMaker = read(TASK_MAKER);
  const mapAndMethod = `${map}\n${taskMaker}`;
  const issues = [];
  if (!/^\| 任务 \| 结果 \| 依赖 \| 波次 \| 主承接需求 \|$/m.test(map)) {
    issues.push(`${TEMPLATE}「任务地图」：五列表头不是 任务/结果/依赖/波次/主承接需求`);
  }
  if (!/结果列[^\n。]{0,60}(?:用户可见|用户能观察)/.test(mapAndMethod)) {
    issues.push(`${TEMPLATE}「任务地图」或 ${TASK_MAKER}：没有规定结果列只写用户可见结果`);
  }
  if (
    !/(?:结果列|地图)[^\n。]{0,80}实现(?:细节|步骤|手段)|实现(?:细节|步骤|手段)[^\n。]{0,80}(?:结果列|地图)/.test(
      mapAndMethod,
    )
  ) {
    issues.push(`${TEMPLATE}「任务地图」或 ${TASK_MAKER}：没有点名结果列不得写实现细节`);
  }
  if (!/孤儿/.test(taskMaker)) {
    issues.push(`${TASK_MAKER}：没有点名「地图孤儿」检查项`);
  }
  if (
    !/(?:地图(?:每)?(?:一)?行|地图行)[^\n。]{0,160}同一[^\n。]{0,80}(?:任务节|卡节|标题|prd\.md)/.test(
      taskMaker,
    )
  ) {
    issues.push(`${TASK_MAKER}：没有规定每条地图行要在同一份 prd.md 落到任务节标题`);
  }
  return issues;
}

function limitIssues() {
  const specPrd = read(SPEC_PRD);
  const taskMaker = read(TASK_MAKER);
  const issues = [];
  if (!/两次(?:实际)?内容调用/.test(specPrd)) {
    issues.push(`${SPEC_PRD}：没有保留「两次实际内容调用」限制`);
  }
  if (!/(?:不授权|不得|禁止|不能再|不做)[^\n。]{0,12}第三次/.test(specPrd)) {
    issues.push(`${SPEC_PRD}：没有明确「不授权第三次」内容调用`);
  }
  if (!/第三次内容调用/.test(taskMaker)) {
    issues.push(`${TASK_MAKER}：没有点名不做第三次内容调用`);
  }
  if (!/不新增第二份地图/.test(taskMaker)) {
    issues.push(`${TASK_MAKER}：没有保留「不新增第二份地图/独立索引」`);
  }
  if (!/(?:任务)?地图(?:就是|是|即|作为)(?:唯一)?(?:的)?索引/.test(`${taskMaker}\n${specPrd}`)) {
    issues.push(`${TASK_MAKER} 或 ${SPEC_PRD}：没有声明任务地图就是唯一索引`);
  }
  const templateFiles = readdirSync(join(ROOT, TEMPLATE_DIR)).sort();
  if (templateFiles.length !== 1 || templateFiles[0] !== 'prd-template.md') {
    issues.push(`${TEMPLATE_DIR}：出现第二份索引类模板（${templateFiles.join('、')}），交付不得新增独立索引`);
  }
  return issues;
}

function uiIssues() {
  const template = read(TEMPLATE);
  const ui = between(cardSection(template), 'UI 任务才填的三段', '#### 四行验收');
  const taskMaker = read(TASK_MAKER);
  const issues = [];
  for (const label of ['接线', '视觉', '组件']) {
    const count = (ui.match(new RegExp(`^- \\*\\*${label}\\*\\*：`, 'gm')) || []).length;
    if (count !== 1) issues.push(`${TEMPLATE}「UI 三段」：${label}段标题出现 ${count} 次，应照原样保留 1 次`);
  }
  for (const [label, pattern] of [
    ['接线：页面区域', /改哪些页面区域/],
    ['接线：失败态', /失败态/],
    ['视觉：设计源与视口', /对照哪个设计源与视口/],
    ['视觉：差异记录', /差异与偏差怎么记录/],
    ['组件：复用', /复用哪些既有组件/],
    ['组件：沉淀', /沉淀/],
  ]) {
    if (!pattern.test(ui)) issues.push(`${TEMPLATE}「UI 三段」：${label}被删改`);
  }
  if (!/UI[^\n]{0,30}(?:6|六)\s*字段[^\n]{0,30}接线[^\n]{0,30}视觉[^\n]{0,30}组件/.test(taskMaker)) {
    issues.push(`${TASK_MAKER}：把 UI 任务在 6 字段外补接线/视觉/组件三段的规则改了`);
  }
  return issues;
}

describe('ORACLE-PRD-CARD 任务分节消费', () => {
  it('模板与 task-maker 同处定义用户可见独立结果、前置供件与四行验收', () => {
    fail(fourPartIssues(), '任务节四要素缺失');
  });

  it('模板与 task-maker 互相引用同一处（模板任务卡节 ↔ 展开任务分节）', () => {
    fail(crossReferenceIssues(), '四要素没有定义并互相引用同一处');
  });

  it('五列地图指向同一任务节，且有方法/检查项可判地图孤儿', () => {
    fail(mapRuleIssues(), '地图与任务节没有同一处可判');
  });

  it('负例①：地图插入没有实体任务节的条目，必须被辨出并点名', () => {
    const template = read(TEMPLATE);
    assert.deepEqual(mapOrphanIssues(template), [], '模板自身的地图行都应有对应任务节标题');
    const bad = appendMapRow(template, '| CARD-999 | 用户看见一个不存在的入口 | 无 | W2 | R-999 |');
    const found = mapOrphanIssues(bad);
    assert.ok(
      found.some((issue) => issue.includes('CARD-999')),
      `坏样本①未被具名辨出：${found.length ? found.join('；') : '没有任何地图孤儿失败信息'}`,
    );
  });

  it('负例②：把实现细节写进结果列，必须被辨出并点名', () => {
    const template = read(TEMPLATE);
    assert.deepEqual(resultColumnIssues(template), [], '模板自身的结果列都应是用户可见结果');
    const bad = replaceMapResult(template, 'CARD-001', '在 parseConfig 中新增缓存层并重构模块读取路径');
    assert.notEqual(bad, template, '夹具失败：模板里找不到 CARD-001 地图行，无法构造坏样本②');
    const found = resultColumnIssues(bad);
    assert.ok(
      found.some((issue) => issue.includes('CARD-001')),
      `坏样本②未被具名辨出：${found.length ? found.join('；') : '没有任何结果列写实现的失败信息'}`,
    );
  });

  it('交付不新增第三次内容调用或第二份索引', () => {
    fail(limitIssues(), '调用或索引边界被突破');
  });

  it('既有 UI 三段（接线/视觉/组件）照原样保留', () => {
    fail(uiIssues(), 'UI 三段被删改');
  });
});
