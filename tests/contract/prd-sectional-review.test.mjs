// ORACLE-PRD-REVIEW — P7 冻结契约测试（独立测试作者，改实现前预写；冻结后实施者只读）。
// 观察对象（AC-QUAL-019）：真实任务卡在第二次内容调用内得到同节两路原件与一次处置；
// 原全文审只增加跨卡范围，不增加第三次内容调用；一路失效时不拿另一路冒通过；
// 不引入新的用户答复要求，不改冻结审查与 steps schema。
// 只读真实字节：skills/task-maker/SKILL.md、skills/spec-prd/SKILL.md、
// workflows/build-prd/SKILL.md、workflows/build-prd/steps.json；坏样本只在测试内构造。
// 冻结前预期 RED：失败信息指向缺失的同节两路/一次处置/跨卡边界/两路不全口径，
// 不指向导入、夹具或样本缺失。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ORACLE = 'ORACLE-PRD-REVIEW';
const TASK_MAKER = 'skills/task-maker/SKILL.md';
const SPEC_PRD = 'skills/spec-prd/SKILL.md';
const BUILD_PRD = 'workflows/build-prd/SKILL.md';
const STEPS = 'workflows/build-prd/steps.json';
const WRITE_SET = [TASK_MAKER, SPEC_PRD, BUILD_PRD, STEPS];

const read = (relative) => readFileSync(join(ROOT, relative), 'utf8');

function fail(issues, label) {
  assert.deepEqual(issues, [], `${label}（${ORACLE}）：\n- ${issues.join('\n- ')}`);
}

function matches(text, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return [...text.matchAll(new RegExp(pattern.source, flags))].map((match) => match.index);
}

function headingStarts(text) {
  return matches(text, /^#{1,4} .*$/m);
}

// 取出包含给定位置的标题小节；无标题时退化为全文。
function sectionOf(text, index) {
  const starts = headingStarts(text);
  if (!starts.length) return { start: 0, end: text.length };
  let start = starts[0];
  let end = text.length;
  for (const at of starts) {
    if (at <= index) start = at;
    else {
      end = at;
      break;
    }
  }
  return { start, end };
}

// 同一处判定的容忍跨度：两路要求与 sha256 摘要在同一方法内相邻即算同一处。
const MAX_SPAN = 1600;

const TWO_ROUTE_ANCHORS = [
  /(?:两|2)\s*(?:路|条|位|个)[^\n。]{0,40}(?:独立|读者|只读|上下文)/,
  /(?:独立|只读)[^\n。]{0,24}(?:两|2)\s*(?:路|条|位|个)[^\n。]{0,20}(?:读者|审|上下文)/,
];

const DIGEST_ANCHOR = /sha-?256/i;

// 定位“同一处定义”的区域：两路要求与 sha256 摘要算法最近的一对。
function definitionRegion(text) {
  const digests = matches(text, DIGEST_ANCHOR);
  const routes = TWO_ROUTE_ANCHORS.flatMap((anchor) => matches(text, anchor));
  if (!digests.length) return { error: '没有“同一卡节的 sha256 摘要”这一要求' };
  if (!routes.length) return { error: '没有“两路（独立读者）看同一节”这一要求' };
  let best = null;
  for (const digest of digests) {
    for (const route of routes) {
      const distance = Math.abs(digest - route);
      if (!best || distance < best.distance) best = { distance, digest, route };
    }
  }
  if (best.distance > MAX_SPAN) {
    return {
      error: `两路要求与 sha256 摘要算法不在同一处定义（最近相距 ${best.distance} 字符，上限 ${MAX_SPAN}）`,
    };
  }
  const first = sectionOf(text, Math.min(best.digest, best.route));
  const last = sectionOf(text, Math.max(best.digest, best.route));
  return { region: text.slice(first.start, last.end), distance: best.distance };
}

function coLocationIssue(text) {
  const located = definitionRegion(text);
  return located.error ?? null;
}

// 两路看同一版本卡节的字段要求；缺一项就点名，不靠退出码本身。
const TWO_ROUTE_FIELDS = [
  ['两路读者彼此独立', /独立/],
  ['同一版本卡节', /同一(?:版本|份|稿|版)?[^\n。]{0,16}(?:卡节|任务节|分节|节|版本)|(?:卡节|任务节)[^\n。]{0,16}同一/],
  ['原节摘要', /摘要/],
  ['同任务/单元/批次的界', /任务|单元|批次/],
  ['两路只读', /只读/],
];

function sameSectionIssues() {
  const issues = [];
  const taskMaker = read(TASK_MAKER);
  const located = definitionRegion(taskMaker);
  if (located.error) {
    issues.push(`${TASK_MAKER}：${located.error}`);
    return issues;
  }
  for (const [label, pattern] of TWO_ROUTE_FIELDS) {
    if (!pattern.test(located.region)) {
      issues.push(`${TASK_MAKER}：分节两路定义缺少「${label}」`);
    }
  }
  return issues;
}

// “不是各写一份”：sha256 摘要算法只在 task-maker 定义，其他方法文件引用而不再写一遍。
function duplicateDefinitionIssues() {
  const issues = [];
  for (const file of [SPEC_PRD, BUILD_PRD]) {
    for (const paragraph of read(file).split(/\n{2,}/)) {
      const restatesAlgorithm =
        DIGEST_ANCHOR.test(paragraph) && /摘要/.test(paragraph) && /(?:核对|比对|一致|相同|相等|核)/.test(paragraph);
      if (!restatesAlgorithm) continue;
      if (!/(?:分节|两路|卡节|任务节)/.test(paragraph)) continue;
      if (!/task-maker\/SKILL\.md/.test(paragraph)) {
        issues.push(`${file}：在分节相关段落自行写了 sha256 摘要算法，没有指向 ${TASK_MAKER} 的同节两路方法`);
      }
    }
  }
  const steps = read(STEPS);
  if (DIGEST_ANCHOR.test(steps) && /摘要/.test(steps) && !/task-maker\/SKILL\.md/.test(steps)) {
    issues.push(`${STEPS}：出现 sha256 摘要说明却没有指向 task-maker 的同节两路方法`);
  }
  for (const file of WRITE_SET) {
    const found = read(file).match(/md5|sha-?1\b/i);
    if (found) issues.push(`${file}：出现与冻结摘要算法不一致的「${found[0]}」`);
  }
  return issues;
}

// 一次处置：按位置、根因、后果处置一次，并保两条原发现与有效单源发现。
const DISPOSITION_NEEDS = [
  ['按位置、根因、后果的顺序', /位置[^\n。]{0,14}根因[^\n。]{0,14}后果/],
  ['同题只处置一次', /一次处置|只处置一次|同题只处置一次|同题一次处置/],
  ['保两条原发现', /两条原?发现|两路(?:的)?原发现|各保原发现/],
  ['保有效单源发现', /有效单源发现|单源发现/],
];

function dispositionIssues() {
  const candidates = [TASK_MAKER, SPEC_PRD].map((file) => ({ file, text: read(file) }));
  const complete = candidates.filter(({ text }) => DISPOSITION_NEEDS.every(([, pattern]) => pattern.test(text)));
  if (complete.length) return [];
  const issues = ['没有任何一处方法同时写出「位置、根因、后果一次处置」并保两条原发现与有效单源发现'];
  for (const { file, text } of candidates) {
    const missing = DISPOSITION_NEEDS.filter(([, pattern]) => !pattern.test(text)).map(([label]) => label);
    issues.push(`${file} 缺：${missing.join('、')}`);
  }
  return issues;
}

// 原全文范围只加跨卡、不增内容调用、不新增调用上限。
function fullTextScopeIssues() {
  const steps = JSON.parse(read(STEPS));
  const buildPrd = read(BUILD_PRD);
  const specPrd = read(SPEC_PRD);
  const combined = `${buildPrd}\n${JSON.stringify(steps, null, 2)}`;
  const issues = [];

  const onlyCrossCard = [
    /原全文[^\n。]{0,24}(?:只|仅)[^\n。]{0,14}(?:加|增加|看|审)?[^\n。]{0,8}跨卡/,
    /全文(?:范围|审|终审)?[^\n。]{0,32}(?:只|仅)[^\n。]{0,14}跨卡/,
    /跨卡[^\n。]{0,24}(?:只|仅)[^\n。]{0,12}全文/,
  ];
  if (!onlyCrossCard.some((pattern) => pattern.test(combined))) {
    issues.push(`${BUILD_PRD} 或 ${STEPS}：没有界定「原全文范围只加跨卡」`);
  }

  const noThirdCall = [
    /不(?:再)?(?:增加|新增|加|引入)[^\n。]{0,12}第三次[^\n。]{0,8}内容调用/,
    /第三次内容调用[^\n。]{0,12}(?:不|禁止|不得|没有)/,
  ];
  if (!noThirdCall.some((pattern) => pattern.test(combined))) {
    issues.push(`${BUILD_PRD} 或 ${STEPS}：没有「不增加第三次内容调用」的字样`);
  }

  const newCaps = [
    /(?:最多|上限)\s*[三四五六3-6]\s*次/,
    /允许[^\n。]{0,10}(?:第)?[三四五六3-6]\s*次[^\n。]{0,6}(?:内容)?调用/,
    /第[三四五六3-6]次内容调用[^\n。]{0,10}(?:允许|可以|作为)/,
  ];
  for (const pattern of newCaps) {
    const found = combined.match(pattern);
    if (found) issues.push(`${BUILD_PRD} 或 ${STEPS}：新增了调用上限「${found[0].trim()}」`);
  }

  if (!/两次(?:实际)?内容调用/.test(buildPrd)) {
    issues.push(`${BUILD_PRD}：没有保留「两次实际内容调用」上限`);
  }
  if (!/两次(?:实际)?内容调用/.test(specPrd)) {
    issues.push(`${SPEC_PRD}：没有保留「两次实际内容调用」上限`);
  }
  if (!/拆卡、实现可行性、范围、验收、旧件保真/.test(buildPrd)) {
    issues.push(`${BUILD_PRD}：全文审的五件事被改（拆卡/实现可行性/范围/验收/旧件保真）`);
  }

  const step4 = steps.steps.find((step) => step.step_id === 4);
  const step5 = steps.steps.find((step) => step.step_id === 5);
  if (!step4) issues.push(`${STEPS}：第 4 步缺失`);
  else {
    const step4Text = `${step4.observable_result ?? ''}\n${step4.skill ?? ''}`;
    if (!/两路|分节/.test(step4Text)) issues.push(`${STEPS} 第 4 步：没有声明分节两路审`);
    if (!/同一(?:卡节|节|版本)|同版|一致/.test(step4Text)) {
      issues.push(`${STEPS} 第 4 步：没有声明两路看同一卡节版本`);
    }
  }
  if (!step5) issues.push(`${STEPS}：第 5 步缺失`);
  else {
    const step5Text = `${step5.observable_result ?? ''}`;
    // TCR 2026-11-24（授权：协调者）：只断言 build-prd 的范围声明含「跨卡」；不要求
    // steps.json 第 5 项含该词（与既有逐字锁定合同互斥），也不重复上文的组合文件级断言。
    if (!/跨卡/.test(buildPrd)) issues.push(`${BUILD_PRD} 第 5 步：没有声明全文审只加跨卡`);
    if (!/wh-review|审查/.test(step5Text)) issues.push(`${STEPS} 第 5 步：原有的全文审被拿掉`);
  }
  return issues;
}

// 一路失效：不拿另一路冒通过，保原因与原错。
const ROUTE_FAILURE_NEEDS = [
  ['一路失效/只有一路可用', /一路[^\n。]{0,12}(?:失效|不可用|缺|失败|不全)|两路[^\n。]{0,8}(?:不全|不齐|缺一)|只(?:有)?一路[^\n。]{0,12}(?:可用|有效|在)/],
  ['不拿另一路冒通过', /(?:不|不得|不能)[^\n。]{0,18}(?:拿|以|用|靠|由)[^\n。]{0,18}另一(?:路|条)[^\n。]{0,18}(?:冒|补签|代替|替代|通过|补)|另一(?:路|条)[^\n。]{0,20}(?:不|不得|不能)[^\n。]{0,14}(?:冒|补签|代替|替代|通过|补)/],
  ['保原因', /(?:保|保留|留住|存)[^\n。]{0,14}原因|原因[^\n。]{0,14}(?:保|留|存)/],
  ['保原错', /原错/],
  ['记分节审查未过', /未过|不通过|不能通过/],
];

function partialRouteIssues() {
  const candidates = [TASK_MAKER, SPEC_PRD, BUILD_PRD].map((file) => ({ file, text: read(file) }));
  const complete = candidates.filter(({ text }) => ROUTE_FAILURE_NEEDS.every(([, pattern]) => pattern.test(text)));
  if (complete.length) return [];
  const issues = ['没有任何一处方法同时写出「一路失效不拿另一路冒通过，并保原因与原错」'];
  for (const { file, text } of candidates) {
    const missing = ROUTE_FAILURE_NEEDS.filter(([, pattern]) => !pattern.test(text)).map(([label]) => label);
    issues.push(`${file} 缺：${missing.join('、')}`);
  }
  return issues;
}

// 冻结审查与 steps schema：不新增用户答复要求，不改六个步骤与字段形状。
const STEP_KEYS = new Set([
  'step_id',
  'step_slug',
  'method_anchor',
  'requires_user_reply',
  'observable_result',
  'completion_evidence',
  'skill',
]);
const STEP_SLUGS = [
  'load-confirmed-inputs',
  'generate-outline-and-task-map',
  'confirm-map-and-conditional-design',
  'expand-single-prd',
  'review-and-confirm-final-draft',
  'closeout',
];
const REPLY_REQUIRED = { 1: false, 2: false, 3: true, 4: false, 5: true, 6: true };

function anchorResolvable(anchor) {
  const taskMaker = read(TASK_MAKER);
  if (taskMaker.includes(`id="${anchor}"`)) return true;
  return headingStarts(taskMaker).some((at) => {
    const line = taskMaker.slice(at, taskMaker.indexOf('\n', at) < 0 ? undefined : taskMaker.indexOf('\n', at));
    return line.includes(anchor);
  });
}

function frozenGateIssues() {
  const issues = [];
  const steps = JSON.parse(read(STEPS));
  const topKeys = Object.keys(steps).sort();
  if (steps.schema_version !== '2.0.0') issues.push(`${STEPS}：schema_version 从 2.0.0 被改`);
  if (JSON.stringify(topKeys) !== JSON.stringify(['schema_version', 'stage_slug', 'steps'])) {
    issues.push(`${STEPS}：顶层字段被改（${topKeys.join('、')}）`);
  }
  if (steps.stage_slug !== 'build-prd') issues.push(`${STEPS}：stage_slug 被改`);
  if (!Array.isArray(steps.steps) || steps.steps.length !== 6) {
    issues.push(`${STEPS}：步骤数不是原有六步（新增或删除步骤会另立审查节点）`);
  } else {
    const ids = steps.steps.map((step) => step.step_id);
    if (JSON.stringify(ids) !== JSON.stringify([1, 2, 3, 4, 5, 6])) {
      issues.push(`${STEPS}：step_id 序列被改（${ids.join(',')}）`);
    }
    const slugs = steps.steps.map((step) => step.step_slug);
    if (JSON.stringify(slugs) !== JSON.stringify(STEP_SLUGS)) {
      issues.push(`${STEPS}：step_slug 序列被改（${slugs.join(',')}）`);
    }
    for (const step of steps.steps) {
      const extra = Object.keys(step).filter((key) => !STEP_KEYS.has(key));
      if (extra.length) issues.push(`${STEPS} 第 ${step.step_id} 步：新增字段 ${extra.join('、')}`);
      if (step.requires_user_reply !== REPLY_REQUIRED[step.step_id]) {
        issues.push(`${STEPS} 第 ${step.step_id} 步：requires_user_reply 被改（引入/取消用户答复要求）`);
      }
      if (step.method_anchor !== '方法') issues.push(`${STEPS} 第 ${step.step_id} 步：method_anchor 被改`);
      const kinds = (step.completion_evidence ?? []).map((entry) => entry.kind);
      const expected = step.step_id === 5 ? ['phase_task_facts', 'review'] : ['phase_task_facts'];
      if (JSON.stringify(kinds) !== JSON.stringify(expected)) {
        issues.push(`${STEPS} 第 ${step.step_id} 步：completion_evidence 形状被改`);
      }
    }
    const step4 = steps.steps.find((step) => step.step_id === 4);
    if (!step4) issues.push(`${STEPS}：第 4 步缺失`);
    else if (!/^skills\/task-maker\/SKILL\.md#/.test(step4.skill ?? '')) {
      issues.push(`${STEPS} 第 4 步：skill 指针不再指向 ${TASK_MAKER}`);
    } else {
      const anchor = (step4.skill ?? '').split('#')[1] ?? '';
      if (!anchor || !anchorResolvable(anchor)) {
        issues.push(`${STEPS} 第 4 步：skill 锚点「${anchor}」在 ${TASK_MAKER} 里解析不到（同版指针失效）`);
      }
    }
  }

  const buildPrd = read(BUILD_PRD);
  if (!/只(?:做)?一次审查/.test(buildPrd)) issues.push(`${BUILD_PRD}：冻结的「只做一次审查」被改`);
  if (!/由\s*wh-review\s*执行/.test(buildPrd)) issues.push(`${BUILD_PRD}：审查执行者被改（不再是 wh-review）`);
  if (!/不审文件格式/.test(buildPrd)) issues.push(`${BUILD_PRD}：审查不审文件格式的边界被删`);
  const newReviewGate = buildPrd.match(/(?:新增|另加|再加|第二次|再次)[^\n。]{0,10}审查/);
  if (newReviewGate) issues.push(`${BUILD_PRD}：新增审查节点「${newReviewGate[0]}」`);

  const allText = WRITE_SET.map(read).join('\n');
  const forged = [
    /(?:分节审|分节审查|两路)[^\n。]{0,14}(?:就是|即|算|等于)[^\n。]{0,10}用户(?:确认|答复)/,
    /(?:结构(?:绿|通过)|审查(?:通过|绿))[^\n。]{0,14}(?:代替|冒)[^\n。]{0,10}用户(?:答复|确认)/,
    /(?:请|需|须|要求|等待)用户[^\n。]{0,24}(?:答复|确认)[^\n。]{0,24}(?:分节|两路)/,
  ];
  for (const pattern of forged) {
    const found = allText.match(pattern);
    if (found) issues.push(`写入集：出现伪造或新增用户答复的要求「${found[0].trim()}」`);
  }
  return issues;
}

describe(`${ORACLE} 任务分节审查契约`, () => {
  it('同节两路在 task-maker 同一处定义两路要求与 sha256 摘要算法，且不各写一份', () => {
    fail(
      [...sameSectionIssues(), ...duplicateDefinitionIssues()],
      '同节两路没有在同一处定义两路要求与摘要算法',
    );
  });

  it('两路发现按位置、根因、后果一次处置，并保两条原发现与有效单源发现', () => {
    fail(dispositionIssues(), '两路发现没有一次处置并保留原发现');
  });

  it('原全文范围只加跨卡，不增加第三次内容调用，不新增调用上限', () => {
    fail(fullTextScopeIssues(), '全文审越界或调用上限被突破');
  });

  it('一路失效不拿另一路冒通过，保原因与原错并记分节审查未过', () => {
    fail(partialRouteIssues(), '两路不全时的失败口径缺失');
  });

  it('不引入新的用户答复要求，不改冻结审查与 steps schema', () => {
    fail(frozenGateIssues(), '引入新的用户答复要求或改动了冻结审查/schema');
  });

  it('坏例：摘要算法与两路要求被拆到两处时，判定器必须点名同一处缺失', () => {
    const good = [
      '## 分节两路',
      '两路独立读者只读同一版本卡节，核对原节摘要 sha256 一致；任务/单元/批次同界。',
    ].join('\n');
    assert.equal(coLocationIssue(good), null, '夹具失败：同一处的正样本被判定为缺失');
    const bad = [
      '## 分节两路',
      '两路独立读者只读同一版本卡节。',
      '',
      '## 别处',
      '与分节无关的内容。'.repeat(400),
      '',
      '## 摘要',
      '对原节摘要用 sha256。',
    ].join('\n');
    const issue = coLocationIssue(bad);
    assert.ok(
      issue && issue.includes('同一处'),
      `坏例未被具名辨出：${issue ?? '判定器没有报同一处缺失'}`,
    );
  });
});
