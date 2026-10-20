// N9 build-plan frozen oracle: production writers must treat this file as read-only.
// Changes require explicit TCR + reason + previous raw evidence + independent review.
// Independent expectations: parent raw requirement 2026-10-14 item 3; N9 decision
// D-005/D-008/D-010/D-011; spec Appendix A AC-M1-1/M3-2/M5-1/M6-1/M6-2.
// Phase consumers: P1/P2 -> PLAN-CLI; P4 -> PLAN-HEALTH;
// P5 -> PLAN-PAGE + normal PLAN-REFRESH; P6 -> complex PLAN-REFRESH.
// All four: npx vitest run tests/contract/final-chain-plan-red.test.mjs
// Individual groups: append -t PLAN-CLI | PLAN-HEALTH | PLAN-PAGE | PLAN-REFRESH.
// Missing future final-chain modules are deliberately NEVER imported, even dynamically.
// G-2: PLAN-REFRESH checks only current method/manifest wiring, with structural
// negative inputs. It cannot prove a caller followed prose, two refreshes happened,
// ring results were true, old bytes survived, or a browser rendered the page.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, test } from 'vitest';
import antigravity from '../../skills/third-review/lib/adapters/antigravity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const text = path => readFileSync(resolve(root, path), 'utf8');
const taskId = 'n9-final-chain-verification-20261020';
const taskPath = process.env.FINAL_CHAIN_TASK_PATH
  ?? '/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n9-final-chain-verification-20261020';
// Literals frozen from independent requirement/decision/spec, not production constants.
const ringNames = ['原始需求', 'decision-log', '调研方案', '方案', 'spec', 'phase', '代码实现', '测试验证', '最终审查', '提交 PR'];
const coreKinds = ['req', 'dec', 'ires', 'wp', 'spec', 'phase', 'file', 'test', 'review', 'pr'];
const anchors = { req: 0, dec: 1, goal: 1, ires: 2, eres: 2, wp: 3, risk: 3, spec: 4, phase: 5, task: 5, file: 6, test: 7, review: 8, acc: 8, pr: 9 };

describe('PLAN-CLI existing run-checks task-path entry', () => {
  test('authenticated N9 task produces exit 0 and only a ten-ring JSON report, even with missing execution facts', () => {
    const task = JSON.parse(readFileSync(resolve(taskPath, 'task.json'), 'utf8'));
    expect(task.task_id, 'SETUP: use the real N9 task root, never the specs directory').toBe(taskId);
    expect(task.activation_cohort).toBe('post');
    // NEVER invoke run-checks with no args: that would run prohibited whole-repo checks.
    const argv = [resolve(root, 'tools/cli/run-checks.mjs'), '--task-path', taskPath];
    const run = spawnSync(process.execPath, argv, { cwd: root, encoding: 'utf8', timeout: 15_000 });
    expect(run.error, 'SETUP: CLI must spawn without timeout or missing executable').toBeUndefined();
    expect(run.signal, 'SETUP: CLI must finish normally').toBeNull();
    expect(run.status, `TARGET: task-path must report, not reject parameters; stderr=${run.stderr}`).toBe(0);
    expect(run.stderr, 'TARGET: valid task input must not emit an error').toBe('');
    const report = JSON.parse(run.stdout); // Entire stdout, not a log-stripped JSON substring.
    expect(report.task_id).toBe(taskId);
    expect(report.rings.map(ring => ring.ring)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(report.rings.map(ring => ring.name)).toEqual(ringNames);
    for (const ring of report.rings) {
      expect(['completed', 'skipped', 'not_applicable', 'incomplete', 'unavailable']).toContain(ring.state);
      expect(Array.isArray(ring.basis)).toBe(true);
      expect(ring.counted_in_denominator).toBe(ring.state !== 'not_applicable');
    }
    // No assertion that this unfinished task is completed; missing quality stays missing.
  });
});

const observe = step => antigravity.observeLine('stdout', JSON.stringify({ event: 'step_update', step_update: step }));
describe('PLAN-HEALTH real antigravity.observeLine API', () => {
  test.each([
    ['read requested but not completed', { step_index: 7, step_type: 'tool', state: 'ACTIVE', tool_info: { name: 'read_file', parameters: { Path: '/packet/spec.md' } } }],
    ['hook-denied read ERROR', { step_index: 7, step_type: 'tool', state: 'ERROR', tool_info: { name: 'read_file', error: 'PreToolUse hook denied this read' } }],
    ['DONE carrying a tool error', { step_index: 8, step_type: 'tool', state: 'DONE', tool_info: { name: 'read_file', error: 'permission denied' } }],
    ['interleaved bare model turn DONE', { step_index: 9, step_type: 'agent_response', state: 'DONE' }],
  ])('%s is liveness, not semantic progress', (_name, step) => {
    const result = observe(step); // Existing default-export API; no provider/start/hook shim.
    expect(result.liveness, 'entry reached a recognized stream event').toBe(true);
    expect(result.progress, 'TARGET: denied/error/model-turn events cannot reset the progress window').toBe(false);
  });
  test('allowed read DONE remains progress (positive control, originally passing)', () => {
    const result = observe({ step_index: 10, step_type: 'tool', state: 'DONE', tool_info: { name: 'view_file', parameters: { Path: '/packet/spec.md' } } });
    expect(result.progress).toBe(true);
    expect(result.progress_key).toBe('10:DONE');
  });
  test('successful final answer keeps the real completed terminal contract (originally passing)', () => {
    const result = antigravity.observeLine('stdout', JSON.stringify({ event: 'result', result: { status: 'SUCCESS', response: 'done' } }));
    expect(result.terminal).toEqual({ state: 'completed', wait_for_close: true });
  });
});

function pageModel() {
  const html = text('skills/answer-as-page/templates/overview-template.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)].map(match => match[1]);
  expect(scripts.length, 'SETUP: real template must expose its existing data and rendering scripts').toBeGreaterThanOrEqual(2);
  const context = createContext({ document: { getElementById: () => ({}) }, localStorage: { getItem: () => null } });
  runInContext(scripts[0], context, { timeout: 1000 });
  // Existing N6 seam from n6-terminal-review-fixes.test.mjs: no DOM/browser startup.
  const boundary = scripts[1].indexOf('let sel =');
  expect(boundary, 'SETUP: existing pre-interaction initialization boundary must be readable').toBeGreaterThan(0);
  runInContext(scripts[1].slice(0, boundary), context, { timeout: 1000 });
  return expression => JSON.parse(runInContext(`JSON.stringify(${expression})`, context, { timeout: 1000 }));
}
describe('PLAN-PAGE real template model, not browser acceptance', () => {
  test('CORE follows the ten-ring requirement order rather than the old seven-kind chain', () => {
    expect(pageModel()('CORE'), 'TARGET: spec/review/PR must occupy their real chain positions').toEqual(coreKinds);
  });
  test('real chainFor decision traversal returns all ten lanes in that same independent order', () => {
    const lanes = pageModel()('chainFor("d1")');
    expect(lanes.map(lane => lane.kind), 'TARGET: changing a declaration without changing consumed lanes is insufficient').toEqual(coreKinds);
    expect(lanes.find(lane => lane.kind === 'req').items).toEqual(expect.arrayContaining(['req1', 'req4']));
    expect(lanes.find(lane => lane.kind === 'dec').items).toContain('d1');
  });
  test('fifteen node types retain task/acc while spec/review/PR gain the declared anchors', () => {
    const evaluate = pageModel();
    expect(evaluate('ANCHOR'), 'TARGET: every kind has the independently specified ring anchor').toEqual(anchors);
    expect(evaluate('Object.keys(DATA.kinds)').sort()).toEqual(Object.keys(anchors).sort());
  });
});

// G-2 source contract only. Event blocks are scoped BEFORE predicates: mentions in
// an unrelated chapter cannot satisfy a missing event. A real shared-owner pointer
// may supply the command, avoiding duplication of the unique page method.
function numberedMethod(source, number) {
  const method = source.split(/^## 方法\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  return method.match(new RegExp(`^${number}\\. [\\s\\S]*?(?=^\\d+\\. |^## |$(?![\\s\\S]))`, 'm'))?.[0] ?? '';
}
function normalEvent(source, slug) {
  return source.split(new RegExp('^### \\d+\\. `' + slug + '`[^\\n]*\\n', 'm'))[1]?.split(/^### |^## /m)[0] ?? '';
}
const reportCommand = /node\s+tools\/cli\/run-checks\.mjs\s+--task-path\s+\S+/;
function wiringGaps(event, owner) {
  const gaps = [];
  if (!/(?:刷新|更新)[^。\n]*(?:页面|驾驶舱)/.test(event)) gaps.push('event does not request a page refresh');
  const delegates = event.includes('skills/answer-as-page/SKILL.md');
  const execution = reportCommand.test(event) ? event : delegates ? owner : '';
  if (!reportCommand.test(execution)) gaps.push('no reachable node tools/cli/run-checks.mjs --task-path command');
  if (!/(?:侧车|\.nodes\.json)/.test(execution)) gaps.push('same-name sidecar output is not specified');
  if (!/(?:保[^。\n]*(?:旧件|历史)|旧[^。\n]*(?:保留|只读|immutable))/.test(execution)) gaps.push('old originals are not preserved');
  return gaps;
}
describe('PLAN-REFRESH G-2 method/manifest wiring only, NOT two observed refreshes', () => {
  test('complex verify-code manifest binds refreshes to results then completed closeout, without new steps', () => {
    const manifest = JSON.parse(text('workflows/verify-code/steps.json'));
    expect(manifest.steps.map(step => step.step_id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(manifest.steps[6].step_slug).toBe('report-verification-result');
    expect(manifest.steps[7].step_slug).toBe('closeout');
    for (const step of manifest.steps.slice(6)) {
      expect.soft(step.observable_result, `TARGET: ${step.step_slug} must declare its own page/sidecar refresh`).toMatch(/(?:刷新|更新)[^。\n]*(?:页面|驾驶舱)/);
    }
    expect.soft(manifest.steps[6].observable_result, 'TARGET: first report must not invent PR completion').toMatch(/skipped/);
    expect.soft(manifest.steps[7].observable_result, 'TARGET: second refresh follows physical delivery, not before it').toMatch(/(?:closeout|PR|物理交付)[^。\n]*(?:完成后|之后|结束后)/);
  });
  test('complex verify-code method event 7 and 8 each reach the scoped read-only report/page interface', () => {
    const source = text('workflows/verify-code/SKILL.md');
    const owner = text('skills/answer-as-page/SKILL.md');
    for (const number of [7, 8]) {
      const event = numberedMethod(source, number);
      expect(event, `SETUP: actual method ${number} exists`).not.toBe('');
      expect.soft(wiringGaps(event, owner), `TARGET: verify-code method ${number} missing executable refresh wiring`).toEqual([]);
    }
  });
  test('normal make-decision uses its own handoff and physical closeout events, not imaginary verify-code rows', () => {
    const source = text('workflows/make-decision/flows/normal/SKILL.md');
    const owner = text('skills/answer-as-page/SKILL.md');
    for (const slug of ['reflect-and-handoff', 'closeout']) {
      const event = normalEvent(source, slug);
      expect(event, `SETUP: actual normal ${slug} event exists`).not.toBe('');
      expect.soft(wiringGaps(event, owner), `TARGET: normal ${slug} missing own-stage executable refresh wiring`).toEqual([]);
    }
    expect(source).toContain('不写 verify-code 阶段行');
  });
  test('G-2 structural negative inputs distinguish missing event/entry/sidecar/retention (not runtime effect)', () => {
    const complete = '逐 AC 结果形成后刷新页面；node tools/cli/run-checks.mjs --task-path <认证任务根>；页面与同名侧车同写，保旧件。';
    expect(wiringGaps(complete, '')).toEqual([]);
    for (const [removed, reason] of [
      ['刷新页面', 'event does not request a page refresh'],
      ['node tools/cli/run-checks.mjs --task-path <认证任务根>', 'no reachable node tools/cli/run-checks.mjs --task-path command'],
      ['同名侧车', 'same-name sidecar output is not specified'],
      ['保旧件', 'old originals are not preserved'],
    ]) expect(wiringGaps(complete.replace(removed, ''), '')).toContain(reason);
    // A command buried in unrelated prose/owner cannot satisfy an absent pointer.
    expect(wiringGaps('逐 AC 结果形成后刷新页面。', complete)).toContain('no reachable node tools/cli/run-checks.mjs --task-path command');
  });
});
