import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { openTask } from '../../runtime/task/task-handle.mjs';
import { phaseFilesFromIndex } from '../../runtime/task/material-workspace.mjs';
import { validateAcceptanceEvidence } from '../../runtime/evidence/acceptance-evidence-validator.mjs';

const taskId = 'workflowhub-ui-frontend-c05-prototype-design-review-20261027';
const repo = fileURLToPath(new URL('../../', import.meta.url));
const materialRoot = `specs/archive/${taskId}/`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const requireFact = (ok, message) => { if (!ok) throw new Error(`ORACLE-FINAL-COVERAGE: ${message}`); };
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const git = args => execFileSync('git', args, { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
const source = path => readFileSync(resolve(repo, path));
const index = source(`${materialRoot}phases/index.md`).toString();
const materialPaths = ['decision-log.md', 'spec.md', 'phases/index.md', ...phaseFilesFromIndex(index)].map(path => `${materialRoot}${path}`);
const appendix = source(`${materialRoot}spec.md`).toString().split(/^##\s+Appendix A.*$/m)[1] ?? '';
const acIds = [...appendix.matchAll(/^\s*-\s*\[[ xX]\]\s*\*\*(AC-C05-\d{3})\*\*/gm)].map(match => match[1]);

function readReference(reference, context) {
  requireFact(plain(reference) && Object.keys(reference).sort().join('\0') === 'ref\0sha256'
    && /^quality\/(evidence|reviews|tests)\//.test(reference.ref ?? '')
    && !reference.ref.includes('\\') && !reference.ref.split('/').some(p => !p || p === '.' || p === '..')
    && /^[a-f0-9]{64}$/.test(reference.sha256 ?? ''), 'invalid ref/hash');
  let bytes;
  try { bytes = context.read(reference.ref); } catch (error) { throw new Error(`ORACLE-FINAL-COVERAGE: original unavailable ${reference.ref}: ${error.message}`); }
  requireFact(hash(bytes) === reference.sha256, `original hash differs: ${reference.ref}`);
  return bytes;
}
function parseReport(bytes, ref) {
  let report, format = 'json';
  const raw = bytes.toString();
  try { report = JSON.parse(raw); } catch {
    format = 'markdown';
    const blocks = [...raw.matchAll(/^ {0,3}(`{3,}|~{3,})json[ \t]*\r?\n([\s\S]*?)\r?\n\1[ \t]*$/gm)];
    requireFact(blocks.length === 1, 'requires one Markdown JSON segment');
    try { report = JSON.parse(blocks[0][2]); } catch { requireFact(false, 'report JSON is invalid'); }
  }
  requireFact(plain(report), 'report must be an object');
  requireFact(format === 'json' ? ref.endsWith('.json') : /\.(md|markdown)$/.test(ref), 'report extension differs');
  return report;
}
function validateReport(reference, context) {
  requireFact(reference !== undefined && reference !== null, 'final report missing');
  const report = parseReport(readReference(reference, context), reference.ref);
  requireFact(acIds.length === 18 && new Set(acIds).size === 18, 'current spec denominator differs');
  requireFact(report.task_id === taskId && report.stage === 'build-code', 'task/stage identity differs');
  requireFact(report.base === context.base, 'baseline differs');
  requireFact(/^[a-f0-9]{40,64}$/.test(report.head ?? ''), 'invalid head');
  context.checkHead(report.head);
  requireFact(Array.isArray(report.materials) && same(report.materials.map(entry => entry?.path), materialPaths), 'materials denominator differs');
  for (const entry of report.materials) {
    requireFact(/^[a-f0-9]{64}$/.test(entry.sha256 ?? '') && hash(context.material(entry.path)) === entry.sha256, `material hash differs: ${entry.path}`);
    requireFact(hash(context.atHead(report.head, entry.path)) === entry.sha256, `head material differs: ${entry.path}`);
  }
  requireFact(Array.isArray(report.acceptance) && same(report.acceptance.map(entry => entry?.id), acIds), 'AC denominator differs');
  for (const entry of report.acceptance) {
    // Only the existing producer decides the result vocabulary. This fixed test-only
    // ref satisfies its narrower evidence path contract; it is never report evidence.
    validateAcceptanceEvidence({ schema_version: 'acceptance-evidence.v1', acceptance_criterion_id: entry.id,
      result: entry.result, refs: [{ ref: 'quality/evidence/test-only-result.json', sha256: 'a'.repeat(64) }] });
    requireFact(Array.isArray(entry.refs) && entry.refs.length > 0, `${entry.id} refs missing`);
    for (const ref of entry.refs) {
      requireFact(ref?.ref !== reference.ref, `${entry.id} cannot cite report itself`);
      readReference(ref, context);
    }
  }
  requireFact(Array.isArray(report.six_conclusions) && report.six_conclusions.length === 6 && report.six_conclusions.every(text), 'six conclusions missing');
  requireFact(Array.isArray(report.unfinished), 'unfinished array missing');
  for (const item of report.unfinished) requireFact(plain(item) && text(item.id) && text(item.attempt) && text(item.owner) && text(item.recovery), 'unfinished requires id/attempt/owner/recovery');
  for (const entry of report.acceptance.filter(entry => entry.result !== 'pass')) requireFact(report.unfinished.some(item => item.id === entry.id), `${entry.id} unfinished missing`);
  const request = report.continuation_request;
  requireFact(plain(request) && typeof request.requested === 'boolean', 'continuation request missing');
  if (request.requested) readReference(request.source_ref, context);
  else requireFact(text(request.reason), 'no-continuation reason missing');
  return report;
}

const selection = process.env.C05_FINAL_REPORT_GATE ?? '';
describe('ORACLE-FINAL-COVERAGE fixtures', () => {
  it('rejects invalid test-only execution selection', () => {
    requireFact(selection === '' || selection === '1', 'C05_FINAL_REPORT_GATE must be 1 or unset');
    requireFact(selection === '1' || process.env.C05_FINAL_REPORT_REF === undefined, 'report ref supplied without actual gate selection');
  });
  it('accepts real temporary bytes, rejects single violations, then accepts restored bytes', () => {
    const temporary = mkdtempSync(join(tmpdir(), 'c05-final-coverage-'));
    try {
      const evidence = Buffer.from('fixture original: browser execution unavailable; not a business verdict\n');
      writeFileSync(join(temporary, 'original'), evidence);
      const ref = { ref: 'quality/tests/fixture-original.txt', sha256: hash(evidence) };
      const context = { base: '1'.repeat(40), read: path => {
        if (path === ref.ref) return readFileSync(join(temporary, 'original'));
        if (path === 'quality/evidence/fixture.json' || path === 'quality/evidence/fixture.md') return readFileSync(join(temporary, 'report'));
        throw new Error('fixture original missing');
      }, material: source, atHead: (_head, path) => source(path), checkHead: head => requireFact(head === '2'.repeat(40), 'foreign head') };
      const legal = { task_id: taskId, stage: 'build-code', base: context.base, head: '2'.repeat(40),
        materials: materialPaths.map(path => ({ path, sha256: hash(source(path)) })),
        acceptance: acIds.map(id => ({ id, result: id === 'AC-C05-001' ? 'incomplete' : 'pass', refs: [ref] })),
        six_conclusions: ['implementation present', 'quality limited', 'acceptance incomplete', 'release not assessed', 'Git pending', 'cleanup pending'],
        unfinished: [{ id: 'AC-C05-001', attempt: 'Not executed: fixture has no browser service', owner: 'fixture browser owner', recovery: 'Provide browser execution and original receipt' }],
        continuation_request: { requested: false, reason: 'No user continuation request was received' } };
      const run = (value, markdown = false) => {
        const bytes = Buffer.from(markdown ? `~~~json\r\n${JSON.stringify(value)}\r\n~~~` : JSON.stringify(value));
        writeFileSync(join(temporary, 'report'), bytes);
        return validateReport({ ref: `quality/evidence/fixture.${markdown ? 'md' : 'json'}`, sha256: hash(bytes) }, context);
      };
      expect(run(legal).acceptance[0].result).toBe('incomplete');
      expect(run(legal, true).task_id).toBe(taskId);
      const mutations = [
        r => r.acceptance.pop(), r => { r.acceptance[1] = structuredClone(r.acceptance[0]); },
        r => { r.acceptance[0].id = 'AC-FOREIGN-001'; }, r => { r.acceptance[0].result = 'pending'; }, r => { delete r.acceptance[0].result; },
        r => { delete r.acceptance[0].refs; }, r => { r.acceptance[0].refs = []; },
        r => { r.acceptance[0].refs = [{ ref: '', sha256: ref.sha256 }]; },
        r => { r.acceptance[0].refs = [{ ...ref, sha256: 'b'.repeat(64) }]; },
        r => { r.acceptance[0].refs = [{ ...ref, ref: 'quality/evidence/missing.txt' }]; },
        r => { r.acceptance[0].refs = [{ ...ref, ref: 'quality/evidence/../escape' }]; },
        r => { r.acceptance[0].refs = [{ ...ref, ref: 'quality/evidence/fixture.json' }]; },
        r => { r.unfinished = []; },
        ...['attempt', 'owner', 'recovery'].flatMap(key => [r => { delete r.unfinished[0][key]; }, r => { r.unfinished[0][key] = ' '; }]),
        r => { r.task_id = 'foreign'; }, r => { r.stage = 'verify-code'; }, r => { r.base = '3'.repeat(40); }, r => { r.head = '3'.repeat(40); },
        r => { r.materials[0].sha256 = 'b'.repeat(64); }, r => { r.materials.pop(); },
        r => { r.six_conclusions.pop(); }, r => { r.six_conclusions[0] = ''; },
        r => { delete r.continuation_request; }, r => { r.continuation_request.reason = ''; }, r => { r.continuation_request = { requested: true }; },
      ];
      for (const mutate of mutations) {
        const broken = structuredClone(legal); mutate(broken);
        expect(() => run(broken)).toThrow();
        expect(run(legal).acceptance).toHaveLength(18);
      }
      for (const [bytes, path] of [['null', 'x.json'], ['[]', 'x.json'], ['{', 'x.json'], ['no JSON', 'x.md'], ['```json\n{}\n```\n```json\n{}\n```', 'x.md'], [JSON.stringify(legal), 'x.md']]) expect(() => parseReport(Buffer.from(bytes), path)).toThrow();
      expect(() => validateReport(undefined, context)).toThrow('final report missing');
      expect(run({ ...legal, continuation_request: { requested: true, source_ref: ref } }).continuation_request.requested).toBe(true);
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  });
});

if (selection === '1') {
  describe('ORACLE-FINAL-COVERAGE actual stage report', () => {
    it('requires final report with 18 AC originals and authenticated identity', () => {
      requireFact(text(process.env.C05_FINAL_REPORT_REF), 'final report missing');
      let reference;
      try { reference = JSON.parse(process.env.C05_FINAL_REPORT_REF); } catch { requireFact(false, 'final report ref JSON invalid'); }
      // Private TaskLibrary access is confined to this explicitly selected callback.
      const task = openTask(`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/${taskId}`, { projectName: 'workflowhub', taskId });
      validateReport(reference, { base: task.manifest.baseline_commit, read: ref => task.readRecordBytes(ref), material: source,
        atHead: (head, path) => git(['show', `${head}:${path}`]), checkHead: head => {
          requireFact(git(['rev-parse', '--verify', `${head}^{commit}`]).toString().trim() === head, 'head is not a commit');
          git(['merge-base', '--is-ancestor', task.manifest.baseline_commit, head]);
          git(['merge-base', '--is-ancestor', head, 'HEAD']);
          requireFact(git(['diff', '--name-only', head, '--']).length === 0, 'working tracked bytes differ from report head');
          requireFact(git(['ls-files', '--error-unmatch', 'tests/contract/c05-final-coverage.test.mjs']).length > 0, 'coverage test is not frozen in Git');
        } });
    });
  });
} else {
  console.info('ORACLE-FINAL-COVERAGE fixture-only; actual stage report gate not selected');
}
