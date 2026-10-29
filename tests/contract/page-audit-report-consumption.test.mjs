// ORACLE-C07-WIRING: P4/T009–T011 static method contract, not page acceptance.
// Source: current P4 card; P1's page-audit.md owns report semantics.
import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import yaml from 'js-yaml';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const build = read('workflows/build-code/SKILL.md');
const review = read('skills/review/SKILL.md');
const deps = yaml.load(read('workflows/build-code/skill-deps.yaml'));
const steps = JSON.parse(read('workflows/build-code/steps.json'));
const identity = ['workspace', 'service', 'route', 'state', 'viewport', 'engine', 'engine_session', 'object_version'];
const hasField = (text, field) => [...text.matchAll(/`([^`\n]+)`/g)].some(([, token]) => token === field);
const findingFields = ['severity', 'path', 'line', 'issue', 'root_cause', 'recommendation', 'evidence_kind', 'evidence'];
const section = (text, heading) => text.split(/(?=^## )/m).find(part => part.startsWith(`## ${heading}\n`)) ?? '';
const statements = text => text.split(/[\n。；;]/).filter(Boolean);
const hasStatement = (text, patterns) => statements(text).some(line => patterns.every(pattern => pattern.test(line)));
function preFreeze(text) {
  const terminal = section(text, '最后 Phase：终末承接');
  const end = terminal.indexOf('\n1. 冻结实现');
  return end < 0 ? '' : terminal.slice(0, end);
}
function wiringErrors(text = build, manifest = deps, plan = steps) {
  const errors = [];
  const method = text.match(/^7\. 检查实际 diff[\s\S]*?(?=^8\. )/m)?.[0] ?? '';
  const pre = preFreeze(text);
  if (!hasStatement(method, [/页面审计/, /冻结/, /必须/])) errors.push('pre-freeze trigger');
  if (!/浏览器可见面/.test(method) || !/N\/A/.test(method) || !/unavailable/.test(method)) errors.push('trigger boundaries');
  for (const token of ['页面审计', 'page-audit.md', 'check-page-audit.mjs', '四态', 'coverage_limits', 'summary.overall', 'finding', '定位', '路由', '最小修复', '独立复验', '三轮', '一轮无新增', ...identity]) {
    if (!(identity.includes(token) ? hasField(pre, token) : pre.includes(token))) errors.push(`pre-freeze block: ${token}`);
  }
  const rp14 = text.split('\n').find(line => line.startsWith('| RP-14 ')) ?? '';
  for (const [scope, value] of [['pre-freeze block', pre], ['RP-14', rp14]]) {
    if (!hasStatement(value, [/四项/, /审计报告/, /修复记录/, /受影响面回归/, /独立复验证据/, /不重跑全量/])) errors.push(`${scope}: terminal four`);
  }
  if (/终末(?:重新审计|全量重跑|重跑全量)/.test(pre)) errors.push('terminal rerun');
  if (manifest.skills.filter(item => item.name === 'frontend-testing').length !== 1 || manifest.skills.find(item => item.name === 'frontend-testing')?.trigger !== 'actual_frontend_test_or_browser_visible_page_audit') errors.push('frontend trigger');
  if (plan.steps.length !== 12 || plan.steps.some(item => /page-audit/.test(item.step_slug))) errors.push('12 existing steps');
  const numbers = [...section(text, '最后 Phase：终末承接').matchAll(/^([1-9])\. /gm)].map(match => Number(match[1]));
  if (JSON.stringify(numbers) !== '[1,2,3,4,5,6,7,8,9]') errors.push('terminal order');
  return errors;
}
function reviewErrors(text = review) {
  const errors = [];
  const page = section(text, '页面审计摘要消费');
  if (!page || !(text.indexOf('## Evidence handling') < text.indexOf('## 页面审计摘要消费') && text.indexOf('## 页面审计摘要消费') < text.indexOf('## Result'))) errors.push('summary section location');
  for (const token of [...identity, 'criteria[]', 'coverage_limits[]', 'summary.overall', '通过', '失败', '未测', '不适用', 'evidence', 'untested_reason', '资产', '代码组件', '页面', 'Storybook', '未覆盖', '证据指针']) {
    if (!(identity.includes(token) ? hasField(page, token) : page.includes(token))) errors.push(`summary: ${token}`);
  }
  if (!hasStatement(page, [/coverage_limits/, /非空/, /通过/, /不得|不能|不读/])) errors.push('coverage retained');
  if (!hasStatement(page, [/不适用/, /依据/])) errors.push('inapplicability basis');
  if (!hasStatement(page, [/四项/, /审计报告/, /修复记录/, /受影响面回归/, /独立复验证据/, /不重跑全量/])) errors.push('review terminal four');
  const allowed = text.match(/^Finding fields: (.*?)\. Do not add/m)?.[1] ?? '';
  const fields = [...allowed.matchAll(/`([^`]+)`/g)].map(match => match[1]);
  if (JSON.stringify(fields) !== JSON.stringify(findingFields)) errors.push('finding whitelist');
  return errors;
}
function reportErrors(text = review) {
  const page = section(text, '页面审计摘要消费');
  const errors = [];
  if (!hasStatement(page, [/criteria\[\]/, /唯一/])) errors.push('single result array');
  if (/results\s*(?:\[\]|:\s*\[)|visual-diff-report\.v1/.test(page)) errors.push('second report contract');
  if (!page.includes('{ref, sha256}')) errors.push('evidence item contract');
  if (!hasStatement(page, [/通过/, /evidence/]) || !hasStatement(page, [/未测/, /untested_reason/])) errors.push('state evidence');
  if (!hasStatement(page, [/对象/, /缺项/, /具体/])) errors.push('identity gaps');
  return errors;
}

describe('ORACLE-C07-WIRING build-code wiring', () => {
  it('binds the trigger, pre-freeze block, terminal four and 12 steps', () => {
    expect(wiringErrors()).toEqual([]);
  });
  it('rejects missing standalone engine in the pre-freeze block', () => {
    expect(wiringErrors()).toEqual([]);
    const pre = preFreeze(build);
    expect(pre).toContain('`engine`');
    const missing = pre.replace('`engine`', '');
    expect(missing).toContain('`engine_session`');
    expect(wiringErrors(build.replace(pre, missing))).toContain('pre-freeze block: engine');
  });
  it('rejects moving the audit block after freezing', () => {
    expect(wiringErrors()).toEqual([]);
    const pre = preFreeze(build);
    const prefix = '## 最后 Phase：终末承接\n';
    const misplaced = build.replace(pre, prefix).replace('1. 冻结实现', `1. 冻结实现\n${pre.slice(prefix.length)}`);
    expect(wiringErrors(misplaced)).toContain('pre-freeze block: 页面审计');
  });
  it('rejects removing terminal four', () => {
    expect(wiringErrors()).toEqual([]);
    expect(wiringErrors(build.replaceAll('四项', '若干项'))).toContain('pre-freeze block: terminal four');
  });
  it('rejects restoring the old frontend trigger', () => {
    expect(wiringErrors()).toEqual([]);
    const old = structuredClone(deps);
    old.skills.find(item => item.name === 'frontend-testing').trigger = 'actual_frontend_test';
    expect(wiringErrors(build, old)).toContain('frontend trigger');
  });
});

describe('ORACLE-C07-WIRING review lens consumes page audit summary', () => {
  it('reads four states, object identity and uncovered evidence without new finding fields', () => {
    expect(reviewErrors()).toEqual([]);
  });
  it('rejects missing standalone engine in the review summary', () => {
    expect(reviewErrors()).toEqual([]);
    const page = section(review, '页面审计摘要消费');
    expect(page).toContain('`engine`');
    const missing = page.replace('`engine`', '');
    expect(missing).toContain('`engine_session`');
    expect(reviewErrors(review.replace(page, missing))).toContain('summary: engine');
  });
  it('rejects deleting criteria from the summary instructions', () => {
    expect(reviewErrors()).toEqual([]);
    expect(reviewErrors(review.replaceAll('criteria[]', ''))).toContain('summary: criteria[]');
  });
  it('rejects relabelling untested items as passed', () => {
    expect(reviewErrors()).toEqual([]);
    expect(reviewErrors(review.replaceAll('未测', '通过'))).toContain('summary: 未测');
  });
  it('preserves the four protected sections and Fowler baseline byte for byte', () => {
    // Digests come from the unmodified 5b9c181 P4 input, before adding the section.
    const protectedSections = {
      '双轴消费与宿主分派': 'e5d64e9be732689fe802c5d55f5606145c2917dab428f569ad74e586a73cb64e',
      'Fowler smell baseline — what → fix': 'f7281ae2c1d65ae7e14f7df22fed483e2e755f98171ef535c39fb69d60ebe7e3',
      Check: 'b81c92efcca5b44f56d0146652452fa971c606e366826656ffc3dc0be94ad18b',
      'Evidence handling': '801411a2b28f5aa96dbcd26b18d90309442dc6a179c7bb7de087007fdd4d0fde',
      Result: 'd153b07ce91f26ecd915b41c5fefe8014c695c8f5aee2ae7af3d715b39f80f64',
    };
    for (const [heading, digest] of Object.entries(protectedSections)) expect(createHash('sha256').update(section(review, heading)).digest('hex'), heading).toBe(digest);
  });
});

describe('ORACLE-C07-WIRING report expression', () => {
  it('keeps criteria as the sole result array and references original evidence', () => {
    expect(reportErrors()).toEqual([]);
  });
  it('rejects terminal full reruns', () => {
    expect(wiringErrors()).toEqual([]);
    expect(wiringErrors(build.replaceAll('不重跑全量', '终末重跑全量'))).toContain('terminal rerun');
  });
  it('rejects a second results array', () => {
    expect(reportErrors()).toEqual([]);
    expect(reportErrors(review.replaceAll('criteria[]', 'results[]'))).toContain('second report contract');
  });
  it('rejects an extra finding field', () => {
    expect(reviewErrors()).toEqual([]);
    expect(reviewErrors(review.replace('Finding fields: `severity`', 'Finding fields: `axis`, `severity`'))).toContain('finding whitelist');
  });
  it('rejects adding a thirteenth workflow step', () => {
    expect(wiringErrors()).toEqual([]);
    const extra = structuredClone(steps);
    extra.steps.push({step_id: 13, step_slug: 'page-audit'});
    expect(wiringErrors(build, deps, extra)).toContain('12 existing steps');
  });
});
