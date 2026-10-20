// N9 D-011 TCR: 483-p5-three-case-tcr-independent.md and
// 488-p5-three-case-scope-readback.json; prior target RED is
// quality/tests/2026-10-20-p5-template-first.output. Scope is only the two
// task locators below; all original IDs, fixtures and comparison strengths stay.
// Original first locator and assertion (preserved verbatim):
//     const lane = lanes.find(item => item.kind === kind);
//     expect(Array.from(lane.items), `${kind} remains reachable from decision d1`).toEqual(expect.arrayContaining(ids));
// Original second task assertion (preserved verbatim):
//   expect(Array.from(lanes.find(lane => lane.kind === 'task').items)).toEqual(['T003']);
// Independent regression oracles for terminal review 104. Node VM exercises
// real template functions; this is not browser or visual acceptance.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { expect, test } from 'vitest';

const template = readFileSync(fileURLToPath(new URL('../../skills/answer-as-page/templates/overview-template.html', import.meta.url)), 'utf8');
const scripts = [...template.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)].map(match => match[1]);

function load(variant, entries = []) {
  const reads = [];
  const stored = new Map(entries);
  const context = createContext({
    document: { getElementById: () => ({}) },
    localStorage: { getItem(key) { reads.push(key); return stored.get(key) ?? null; } },
  });
  runInContext(scripts[0], context);
  if (variant) runInContext(variant, context);
  // Stop before interaction/render setup: only real state initialization runs.
  const boundary = scripts[1].indexOf('let sel =');
  if (boundary < 0) throw new Error('Template state initialization boundary missing');
  runInContext(scripts[1].slice(0, boundary), context);
  return { context, reads, stored, evaluate: expression => runInContext(expression, context) };
}

test('terminal 104: decision d1 follows its real side-edge work package into the complete delivery chain', () => {
  const view = load();
  const lanes = view.evaluate('chainFor("d1")');
  for (const [kind, ids] of Object.entries({ req: ['req1', 'req4'], dec: ['d1'], wp: ['wp1'], task: ['task1', 'task2'], file: ['file1'], test: ['test-pre', 'test-post'] })) {
    const lane = kind === 'task'
      ? lanes.find(item => item.kind === 'phase').attachments.find(item => item.kind === 'task')
      : lanes.find(item => item.kind === kind);
    expect(Array.from(lane.items), `${kind} remains reachable from decision d1`).toEqual(expect.arrayContaining(ids));
  }
});

test('terminal 104: existing N6 direct decision edges retain their work package and task', () => {
  // Literal caller facts read from task evidence n6-cockpit.html, SHA256
  // 9c9a9917f190a0d8954732f1d5b38772fa1ae23e509803b21a3151d88bacf782.
  // ADR-001 -> WP-001 -> T003 uses edges, not a decision sideEdge.
  // Keep this minimal source fixture portable; never read an author task store.
  const view = load(`
    IDS.splice(0, IDS.length, 'ADR-001', 'WP-001', 'T003');
    OBJ['ADR-001'] = { id: 'ADR-001', kind: 'dec' };
    OBJ['WP-001'] = { id: 'WP-001', kind: 'wp' };
    OBJ['T003'] = { id: 'T003', kind: 'task' };
    DATA.edges = [['ADR-001', 'WP-001'], ['WP-001', 'T003']];
    DATA.sideEdges = []; DATA.hasPhase = false; DATA.initialChanged = [];
  `);
  const lanes = view.evaluate('chainFor("ADR-001")');
  expect(Array.from(lanes.find(lane => lane.kind === 'wp').items)).toEqual(['WP-001']);
  expect(Array.from(lanes.find(lane => lane.kind === 'phase').attachments.find(item => item.kind === 'task').items)).toEqual(['T003']);
});

test('terminal 104: seen state requires identity and digest, preserves visible changes on missing input, and isolates valid keys', () => {
  for (const variant of [
    'delete DATA.taskIdentity; IDS.forEach(id => { OBJ[id].contentDigest = "digest-a"; });',
    'DATA.taskIdentity = "task-A"; IDS.forEach(id => { delete OBJ[id].contentDigest; });',
  ]) {
    const view = load(variant);
    expect(view.reads, 'missing identity/digest cannot read any shared localStorage key').toEqual([]);
    expect(Array.from(view.evaluate('CHANGED'))).toEqual(expect.arrayContaining(['task3', 'test-post']));
    expect(view.evaluate('storageError').trim(), 'missing input is explicitly reported').not.toBe('');
    let key;
    try { key = view.evaluate('seenKey("task3")'); } catch { key = undefined; }
    expect(key, 'missing input cannot produce a usable seen key').toBeFalsy();
  }
  const keys = [];
  for (const [identity, digest] of [['task-A', 'digest-a'], ['task-B', 'digest-a'], ['task-A', 'digest-b']]) {
    const variant = `DATA.taskIdentity = ${JSON.stringify(identity)}; IDS.forEach(id => { OBJ[id].contentDigest = ${JSON.stringify(digest)}; });`;
    const view = load(variant);
    const key = view.evaluate('seenKey("task3")');
    expect(typeof key).toBe('string');
    keys.push(key);
    const reopened = load(variant, [[key, 'seen']]);
    expect(Array.from(reopened.evaluate('CHANGED')), 'valid prior seen state is consumed during actual initialization').not.toContain('task3');
    expect(Array.from(reopened.evaluate('CHANGED'))).toContain('test-post');
  }
  expect(new Set(keys).size, 'task and digest independently isolate seen preferences').toBe(3);
});

test('terminal 104: real test objects show observed explanation/results and preserve an explicit summary', () => {
  const view = load();
  for (const id of ['test-pre', 'test-post']) {
    const line = view.evaluate(`testLine(${JSON.stringify(id)})`);
    const explain = view.evaluate(`OBJ[${JSON.stringify(id)}].explain`);
    expect(line).not.toContain('尚未取得测试结果');
    expect(line, 'existing real explanation must remain visible').toContain(explain);
  }
  view.evaluate('OBJ["test-post"].summary = "已核对的测试结果摘要"');
  expect(view.evaluate('testLine("test-post")')).toBe('已核对的测试结果摘要');
});
