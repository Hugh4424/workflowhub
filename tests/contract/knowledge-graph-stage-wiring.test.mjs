import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { validateSkillBundle } from '../../runtime/adapters/local-skill-resolver.mjs';
import { appendRecord } from '../../runtime/interface/safe-write.mjs';

const root = resolve(import.meta.dirname, '../..');
const stages = ['make-decision', 'build-prd', 'build-plan', 'build-code'];

describe('ORACLE-KG-STAGE portable stage discovery', () => {
  it.each(stages)('%s resolves the graph method through its actual dependency manifest', stage => {
    const base = `workflows/${stage}`;
    const manifest = yaml.load(readFileSync(resolve(root, base, 'skill-deps.yaml'), 'utf8'));
    const prompt = readFileSync(resolve(root, base, 'SKILL.md'), 'utf8');
    const graph = manifest.skills.filter(skill => skill.name === 'knowledge-graph');
    expect(graph, `ORACLE-KG-STAGE:${stage}: no graph capability reachable from stage manifest`).toHaveLength(1);
    expect(graph[0].path).toBe('skills/knowledge-graph/SKILL.md');
    expect(typeof graph[0].trigger).toBe('string');
    expect(graph[0].trigger.trim().length).toBeGreaterThan(0);
    validateSkillBundle(root, 'skills/knowledge-graph/skill-bundle.json', graph[0].path);
    expect(prompt, `ORACLE-KG-STAGE:${stage}: host cannot discover the declared method`).toContain(graph[0].path);
    if (stage === 'build-prd' || stage === 'build-code') {
      const closeout = manifest.skills.filter(skill => skill.name === 'stage-close');
      expect(closeout, `ORACLE-KG-STAGE:${stage}: shared closeout is unreachable`).toHaveLength(1);
      expect(closeout[0].path).toBe('skills/stage-close/SKILL.md');
      expect(typeof closeout[0].trigger).toBe('string');
      expect(closeout[0].trigger.trim().length).toBeGreaterThan(0);
      validateSkillBundle(root, 'skills/stage-close/skill-bundle.json', closeout[0].path);
      expect(prompt).toContain(closeout[0].path);
    }
  });
});

const receiptLine = /图回执：(\S+) sha256:([a-f0-9]{64})/u;

function readCitedReceipt(body) {
  const cited = typeof body === 'string' ? body.match(receiptLine) : null;
  if (!cited) throw Object.assign(new Error('HANDOFF_GRAPH_RECEIPT_MISSING: handoff body does not cite a document-graph receipt'), { code: 'HANDOFF_GRAPH_RECEIPT_MISSING' });
  let bytes;
  try { bytes = readFileSync(cited[1]); }
  catch (error) { throw Object.assign(new Error(`HANDOFF_GRAPH_RECEIPT_MISSING: cited receipt is unreadable: ${error.message}`), { code: 'HANDOFF_GRAPH_RECEIPT_MISSING' }); }
  if (createHash('sha256').update(bytes).digest('hex') !== cited[2]) throw Object.assign(new Error('HANDOFF_GRAPH_RECEIPT_MISSING: receipt bytes differ from the handoff sha256'), { code: 'HANDOFF_GRAPH_RECEIPT_MISSING' });
  return { ref: cited[1], value: JSON.parse(bytes.toString('utf8')), bytes };
}

describe('bounded graph handoff and close declared readback', () => {
  it('bounded graph handoff and close writes and reads a real document-graph receipt, not a keyword', async () => {
    const read = path => readFileSync(resolve(root, path), 'utf8');
    const close = read('skills/stage-close/SKILL.md');
    const graph = read('skills/knowledge-graph/SKILL.md');
    const handoff = read('skills/stage-handoff/SKILL.md');
    expect(close, 'close names the bounded code-graph receipt').toContain('close-graph');
    expect(close, 'close keeps the document graph at the handoff boundary').toContain('交接边界');
    expect(graph, 'graph method separates close code updates from handoff document updates').toContain('阶段收口图回执');
    expect(graph, 'graph method records one close receipt').toContain('close-graph');
    // The handoff method must name a producer, a concrete receipt object, its
    // write location, the cited-path readback and the missing-receipt failure.
    for (const token of ['knowledge-graph-handoff', 'appendRecord', 'quality/evidence/handoff', 'payload_paths', 'HANDOFF_GRAPH_RECEIPT_MISSING', '不重跑代码图']) {
      expect(handoff, `handoff declares "${token}"`).toContain(token);
    }
    const directory = realpathSync(mkdtempSync(join(tmpdir(), 'p8-handoff-graph-')));
    try {
      const handoffDir = join(directory, 'quality', 'evidence', 'handoff');
      mkdirSync(handoffDir, { recursive: true });
      const value = { task_id: 'p8-handoff', stage: 'build-code', status: 'unchanged', command: 'graphify update . --no-cluster', cwd: directory,
        exit_code: 0, signal: null, timed_out: false, payload_paths: [], sidecar_paths: ['graphify-out/cache/stat-index.json'],
        reason: 'graph command exited 0 without graph payload byte changes', recorded_at: '2026-11-20T00:00:00Z' };
      const bytes = `${JSON.stringify(value, null, 2)}\n`;
      const ref = await appendRecord(handoffDir, 'knowledge-graph-handoff', 'json', bytes);
      expect(resolve(ref), 'appendRecord returns the canonical receipt path').toBe(ref);
      expect(dirname(ref), 'receipt is written into the existing handoff evidence directory').toBe(handoffDir);
      expect(readFileSync(ref).toString('utf8'), 'receipt keeps the documented object bytes').toBe(bytes);
      const sha = createHash('sha256').update(readFileSync(ref)).digest('hex');
      const body = `关键事实与数据状态\n图回执：${ref} sha256:${sha}\n`;
      const readback = readCitedReceipt(body);
      expect(readback.ref).toBe(ref);
      expect(readback.value).toMatchObject({ task_id: 'p8-handoff', stage: 'build-code', status: 'unchanged', payload_paths: [], sidecar_paths: ['graphify-out/cache/stat-index.json'] });
      expect(() => readCitedReceipt('关键事实与数据状态\n图回执：missing\n')).toThrow(/HANDOFF_GRAPH_RECEIPT_MISSING/);
      expect(() => readCitedReceipt(`图回执：${join(directory, 'missing-receipt.json')} sha256:${'0'.repeat(64)}`)).toThrow(/HANDOFF_GRAPH_RECEIPT_MISSING/);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
