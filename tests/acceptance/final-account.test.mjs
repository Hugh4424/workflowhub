// P12/T015 ORACLE-FINAL-ACCOUNT. Read-only report consumer, never a report producer.
// Owned negative examples prove the checker; only the explicit actual-report test
// can consume the main caller's immutable report. No tests write task facts.
import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { openTask } from '../../runtime/task/task-handle.mjs';
import { materialFilesForCohort } from '../../runtime/task/material-workspace.mjs';

const TASK_ID = 'workflowhub-build-code-efficiency-verify-merge-20261026';
const RESULTS = new Set(['pass', 'fail', 'inconclusive', 'deferred', 'missing', 'inconsistent', 'incomplete', 'unavailable']);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const text = value => typeof value === 'string' && value.trim().length > 0;

// Validate the one caller-produced JSON report. This is a task-local test
// helper, not a runtime schema, a first-acceptance writer, or a completion gate.
export function accountFinal({ reportText, expectedTaskId, expectedHead, acIds, readEvidence, materialPaths, readMaterial,
  reportReference = null, postReportRefs = [] }) {
  const errors = [], rows = [], pending = [];
  const check = (ok, reason) => { if (!ok) errors.push(reason); return ok; };
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  let report;
  try { report = JSON.parse(reportText); } catch { return { valid: false, errors: ['actual final report is not one JSON original'], rows, pending }; }
  if (!check(object(report), 'final report must be an object')) return { valid: false, errors, rows, pending };
  check(text(expectedTaskId) && report.task_id === expectedTaskId && report.stage === 'build-code', 'wrong final report task/stage');
  check(/^[a-f0-9]{40,64}$/.test(expectedHead ?? '') && report.head === expectedHead, 'wrong or missing frozen report HEAD');
  check(Array.isArray(acIds) && acIds.length === 30 && new Set(acIds).size === 30, 'current criterion denominator is not thirty unique IDs');
  const entries = Array.isArray(report.acceptance) ? report.acceptance : [];
  check(entries.length === 30 && entries.map(v => v?.id).sort().join('\0') === [...(acIds ?? [])].sort().join('\0'), 'report AC denominator missing, duplicated, or foreign');
  check(Array.isArray(report.six_conclusions) && report.six_conclusions.length === 6 && report.six_conclusions.every(text), 'six conclusions must be individually nonempty');
  const materials = Array.isArray(report.materials) ? report.materials : [];
  check(Array.isArray(materialPaths) && materialPaths.length > 0
    && materials.map(v => v?.path).sort().join('\0') === [...materialPaths].sort().join('\0'), 'materials: current complete path denominator differs');
  for (const entry of materials) {
    if (!check(object(entry) && text(entry.path) && !isAbsolute(entry.path) && !entry.path.includes('\\')
      && !entry.path.split('/').some(part => !part || part === '.' || part === '..') && /^[a-f0-9]{64}$/.test(entry.sha256 ?? ''), 'materials: unsafe path/hash')) continue;
    try { check(digest(readMaterial(entry.path)) === entry.sha256, `materials: current bytes differ ${entry.path}`); }
    catch (error) { errors.push(`materials: ${entry.path}: ${error.message}`); }
  }

  function originalVerdicts(value, id, found = []) {
    if (!object(value)) return found;
    // Task/stage on an original is optional for legacy records; if supplied,
    // it must match. A task sentence is a label, not a task_id substitute.
    if (value.task_id !== undefined && value.task_id !== expectedTaskId || value.stage !== undefined && value.stage !== 'build-code') return found;
    const names = [value.id, value.ac_id, value.ac, value.acceptance_criterion_id, value.criterion_id, value.task]; if (text(value.ac_id) && text(value.id) && value.ac_id !== value.id && [value.ac_id, value.id].includes(id)) { found.push('inconsistent'); return found; }
    if (names.some(name => typeof name === 'string' && name.split(/[^A-Za-z0-9_-]+/).includes(id))) {
      const outcomes = [...new Set([value.result, value.conclusion, value.tier, value.independent_status].filter(v => RESULTS.has(v)))];
      if (outcomes.length > 1) found.push('inconsistent'); else if (outcomes.length === 1) found.push(outcomes[0]);
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) for (const item of child) originalVerdicts(item, id, found);
      else if (object(child)) originalVerdicts(child, id, found);
    }
    return found;
  }
  function readRefs(refs, label, missingAllowed = false) {
    if (!check(Array.isArray(refs) && refs.length > 0, `${label}: missing original refs`)) return [];
    return refs.flatMap(ref => {
      if (!check(object(ref) && Object.keys(ref).sort().join('\0') === 'ref\0sha256' && text(ref.ref)
        && /^quality\/(evidence|reviews|tests)\//.test(ref.ref) && !ref.ref.includes('\\')
        && !ref.ref.split('/').some(part => !part || part === '.' || part === '..')
        && /^[a-f0-9]{64}$/.test(ref.sha256 ?? ''), `${label}: unsafe or incomplete original ref`)) return [];
      let bytes;
      try { bytes = Buffer.from(readEvidence(ref.ref)); }
      catch (error) { if (!(missingAllowed && error.code === 'ENOENT')) errors.push(`${label}: ${error.message}`); return []; }
      if (!check(digest(bytes) === ref.sha256, `${label}: original hash differs`)) return [];
      return [{ ref, bytes }];
    });
  }
  for (const entry of entries) {
    const label = `acceptance ${entry?.id}`;
    if (!check(object(entry) && RESULTS.has(entry.result), `${label}: invalid existing result vocabulary`)) continue;
    if (entry.result !== 'pass') {
      check(text(entry.reason) && text(entry.owner) && text(entry.recover_when), `${label}: non-pass needs reason, owner and recovery`);
      pending.push(entry.id);
    }
    const originals = readRefs(entry.refs, label, entry.result !== 'pass');
    const verdicts = originals.flatMap(({ bytes }) => {
      try { return originalVerdicts(JSON.parse(bytes.toString('utf8')), entry.id); }
      catch { errors.push(`${label}: criterion original is not readable JSON`); return []; }
    });
    check(!verdicts.includes('inconsistent') && new Set(verdicts).size <= 1, `${label}: conflicting explicit original criterion results`);
    if (entry.result === 'pass') check(verdicts.length > 0 && verdicts.every(result => result === 'pass'), `${label}: no matching original pass; cannot upgrade incomplete/unavailable`);
    rows.push({ id: entry.id, result: entry.result, refs: entry.refs });
  }
  const signals = Array.isArray(report.result_signals) ? report.result_signals : [];
  check(signals.map(v => v?.id).sort().join('\0') === ['AC-RESULT-001', 'AC-RESULT-002', 'AC-RESULT-003'].sort().join('\0'), 'three named result signal sources missing or duplicated');
  for (const signal of signals) readRefs(signal.refs, `result signal ${signal.id}`);
  // Optional human source_refs remain ordinary original pointers, never a
  // second report or a synthesized acceptance authority.
  if (report.source_refs !== undefined) readRefs(report.source_refs, 'report sources');
  const postReportObservations = [];
  if (postReportRefs.length) {
    for (const { ref, bytes } of readRefs(postReportRefs, 'post-report original')) {
      let observation;
      try { observation = JSON.parse(bytes.toString('utf8')); }
      catch { errors.push('post-report original is not JSON'); continue; }
      check(observation.task_id === expectedTaskId && observation.stage === 'build-code', 'post-report original task/stage differs');
      check(reportReference && observation.final_report?.ref === reportReference.ref
        && observation.final_report?.sha256 === reportReference.sha256, 'post-report original did not read this exact unique report');
      for (const id of pending) {
        const verdicts = originalVerdicts(observation, id);
        if (verdicts.length) postReportObservations.push({ id, original_ref: ref, results: [...new Set(verdicts)] });
      }
    }
  }
  // The report's pending array remains its original generation-time fact.
  // Later independent observations are shown separately; the runtime reader
  // owns public provenance and closure, not this test helper.
  return { valid: errors.length === 0, errors, rows, pending, post_report_observations: postReportObservations };
}

const temporary = [];
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });
function sample() {
  const root = mkdtempSync(join(tmpdir(), 'p12-final-account-')); temporary.push(root);
  const ids = Array.from({ length: 30 }, (_, i) => `AC-OWNED-${String(i + 1).padStart(3, '0')}`);
  const source = { acceptance: ids.map(id => ({ id, result: 'pass' })) };
  const bytes = Buffer.from(JSON.stringify(source)); writeFileSync(join(root, 'original.json'), bytes);
  const ref = { ref: 'quality/evidence/original.json', sha256: digest(bytes) };
  const account = { task_id: 'owned-report', stage: 'build-code', head: 'a'.repeat(40),
    materials: [{ path: 'spec.md', sha256: digest(bytes) }],
    acceptance: ids.map(id => ({ id, result: 'pass', refs: [ref] })),
    six_conclusions: ['limits', 'deviations', 'untested', 'incidents', 'risks', 'signoff'],
    result_signals: ['AC-RESULT-001', 'AC-RESULT-002', 'AC-RESULT-003'].map(id => ({ id, refs: [ref] })) };
  const options = { expectedTaskId: 'owned-report', expectedHead: 'a'.repeat(40), acIds: ids,
    readEvidence: () => readFileSync(join(root, 'original.json')), materialPaths: ['spec.md'],
    readMaterial: () => bytes };
  return { root, account, options, ref, source, report: () => JSON.stringify(account) };
}

describe('ORACLE-FINAL-ACCOUNT controlled report/original boundaries', () => {
  it('reads thirty individually sourced rows and six conclusions without producing a report', () => {
    const f = sample(), actual = accountFinal({ reportText: f.report(), ...f.options });
    expect(actual.errors).toEqual([]); expect(actual.valid).toBe(true); expect(actual.rows).toHaveLength(30);
  });
  it('rejects one missing row, duplicated row and a foreign criterion separately', () => {
    for (const change of [a => a.acceptance.pop(), a => a.acceptance[29] = a.acceptance[0], a => a.acceptance[29].id = 'AC-FOREIGN']) {
      const f = sample(); change(f.account); expect(accountFinal({ reportText: f.report(), ...f.options }).valid).toBe(false);
    }
  });
  it('rejects wrong task, wrong frozen HEAD, absent report and two account blocks', () => {
    const f = sample();
    for (const reportText of ['', f.report().replace('owned-report', 'foreign-task'), f.report().replace('a'.repeat(40), 'b'.repeat(40)), f.report() + f.report()]) {
      expect(accountFinal({ reportText, ...f.options }).valid).toBe(false);
    }
  });
  it('rejects a fabricated pass when its immutable criterion original says incomplete', () => {
    const f = sample(); f.source.acceptance[0].result = 'incomplete';
    const bytes = Buffer.from(JSON.stringify(f.source)); writeFileSync(join(f.root, 'original.json'), bytes);
    f.ref.sha256 = digest(bytes);
    const actual = accountFinal({ reportText: f.report(), ...f.options });
    expect(actual.valid).toBe(false); expect(actual.errors.join('\n')).toContain('AC-OWNED-001');
  });
  it('preserves a real missing-source incomplete row with owner and recovery instead of inventing pass', () => {
    const f = sample(); Object.assign(f.account.acceptance[0], { result: 'incomplete', reason: 'real source unavailable', owner: 'original Phase owner', recover_when: 'original exists' });
    f.account.acceptance[0].refs = [{ ref: 'quality/evidence/missing.json', sha256: '0'.repeat(64) }];
    const actual = accountFinal({ reportText: f.report(), ...f.options, readEvidence: ref => {
      if (ref.endsWith('missing.json')) throw Object.assign(new Error('owned missing source'), { code: 'ENOENT' });
      return readFileSync(join(f.root, 'original.json'));
    } });
    expect(actual.valid).toBe(true); expect(actual.pending).toContain('AC-OWNED-001'); expect(actual.rows[0].result).toBe('incomplete');
  });
  it('rejects absent reason/owner/recovery, bad hash, unsafe ref, incomplete conclusions and missing result signals', () => {
    for (const change of [a => a.acceptance[0].result = 'incomplete', a => a.acceptance[0].refs[0].sha256 = '0'.repeat(64),
      a => a.acceptance[0].refs[0].ref = '../foreign', a => a.six_conclusions[0] = '', a => a.result_signals.pop()]) {
      const f = sample(); change(f.account); expect(accountFinal({ reportText: f.report(), ...f.options }).valid).toBe(false);
    }
  });
  it('accepts explicit existing ac/tier and ac/independent_status originals but rejects conflicting results', () => {
    for (const key of ['tier', 'independent_status']) {
      const f = sample(); const bytes = Buffer.from(JSON.stringify({ acceptance: f.options.acIds.map(ac => ({ ac, [key]: 'pass' })) }));
      writeFileSync(join(f.root, 'original.json'), bytes); f.ref.sha256 = digest(bytes);
      expect(accountFinal({ reportText: f.report(), ...f.options }).valid).toBe(true);
    }
    const f = sample(), bytes = Buffer.from(JSON.stringify({ acceptance: f.options.acIds.map(id => ({ id, result: 'pass', tier: 'incomplete' })) }));
    writeFileSync(join(f.root, 'original.json'), bytes); f.ref.sha256 = digest(bytes);
    expect(accountFinal({ reportText: f.report(), ...f.options }).valid).toBe(false);
  });
  it('accepts the existing independent P11 ac_id/result criterion shape without rewriting its original', () => {
    const f = sample(), bytes = Buffer.from(JSON.stringify({ acceptance: f.options.acIds.map(ac_id => ({ ac_id, result: 'pass' })) }));
    writeFileSync(join(f.root, 'original.json'), bytes); f.ref.sha256 = digest(bytes);
    expect(accountFinal({ reportText: f.report(), ...f.options }).valid).toBe(true);
  });
  it('rejects conflicting ac_id/id on the same original object instead of choosing its convenient alias', () => {
    const f = sample(), bytes = Buffer.from(JSON.stringify({ acceptance: f.options.acIds.map(id => ({ ac_id: 'AC-FOREIGN', id, result: 'pass' })) }));
    writeFileSync(join(f.root, 'original.json'), bytes); f.ref.sha256 = digest(bytes);
    expect(accountFinal({ reportText: f.report(), ...f.options }).valid).toBe(false);
  });
  it('binds the report to all current material bytes instead of accepting an absent or self-selected subset', () => {
    for (const change of [a => delete a.materials, a => a.materials = [], a => a.materials[0].sha256 = '0'.repeat(64),
      a => a.materials[0].path = '../foreign', a => a.materials.push(a.materials[0])]) {
      const f = sample(); change(f.account);
      expect(accountFinal({ reportText: f.report(), ...f.options }).valid).toBe(false);
    }
  });
  it('keeps report-time pending while separately reading a later observation bound to the same unique report', () => {
    const f = sample(), row = f.account.acceptance[0];
    Object.assign(row, { result: 'incomplete', reason: 'later event not reached', owner: 'original owner', recover_when: 'event occurs' });
    const reportReference = { ref: 'quality/evidence/unique-report.json', sha256: digest(f.report()) };
    const late = { task_id: 'owned-report', stage: 'build-code', final_report: reportReference,
      acceptance: [{ id: row.id, result: 'pass' }] };
    const lateBytes = Buffer.from(JSON.stringify(late)), postRef = { ref: 'quality/evidence/later-independent.json', sha256: digest(lateBytes) };
    const run = reportRef => accountFinal({ reportText: f.report(), ...f.options, reportReference: reportRef, postReportRefs: [postRef],
      readEvidence: ref => ref === postRef.ref ? lateBytes : readFileSync(join(f.root, 'original.json')) });
    const value = run(reportReference);
    expect(value.valid).toBe(true); expect(value.pending).toContain(row.id); expect(value.rows[0].result).toBe('incomplete');
    expect(value.post_report_observations).toEqual([{ id: row.id, original_ref: postRef, results: ['pass'] }]);
    expect(run({ ...reportReference, sha256: '0'.repeat(64) }).valid).toBe(false);
  });
});

describe('ORACLE-FINAL-ACCOUNT actual main-caller report', () => {
  it('requires and reads the exact immutable main report; controlled samples never satisfy this case', () => {
    const reportRef = process.env.P12_FINAL_REPORT_REF;
    expect(reportRef, 'incomplete: P12_FINAL_REPORT_REF is missing; main caller has not supplied its actual final report').toBeTruthy();
    const taskRoot = process.env.P12_TASK_ROOT, materialRoot = process.env.P12_MATERIAL_ROOT;
    expect(taskRoot, 'incomplete: actual task root unavailable').toBeTruthy(); expect(materialRoot, 'incomplete: actual material root unavailable').toBeTruthy();
    const task = openTask(taskRoot, { projectName: 'workflowhub', taskId: TASK_ID });
    const ref = isAbsolute(reportRef) ? relative(taskRoot, reportRef).split('\\').join('/') : reportRef;
    const bytes = task.readRecordBytes(ref);
    expect(digest(bytes), 'actual main report hash differs').toBe(process.env.P12_FINAL_REPORT_SHA256);
    const spec = readFileSync(join(resolve(materialRoot), 'spec.md'), 'utf8');
    const appendix = spec.split(/^##\s+Appendix A.*$/m)[1] ?? '';
    const acIds = [...new Set([...appendix.matchAll(/^\s*-\s*\[[ xX]\]\s*\*\*(AC-[A-Za-z0-9_-]+)\*\*/gm)].map(m => m[1]))];
    expect(acIds, 'current spec AC denominator must be exactly thirty').toHaveLength(30);
    const prefix = `specs/${TASK_ID}/`;
    const materialPaths = materialFilesForCohort('post', {
      'phases/index.md': readFileSync(join(resolve(materialRoot), 'phases/index.md'), 'utf8'),
    }).map(path => prefix + path);
    const actual = accountFinal({ reportText: bytes.toString('utf8'), expectedTaskId: TASK_ID,
      expectedHead: process.env.P12_EXPECTED_HEAD, acIds, readEvidence: source => task.readRecordBytes(source), materialPaths,
      readMaterial: path => readFileSync(join(resolve(materialRoot), path.slice(prefix.length))),
      reportReference: { ref, sha256: digest(bytes) }, postReportRefs: JSON.parse(process.env.P12_POST_REPORT_REFS ?? '[]') });
    expect(actual.errors).toEqual([]); expect(actual.valid).toBe(true);
    console.log(JSON.stringify({ task_id: TASK_ID, report_ref: ref, report_sha256: digest(bytes), rows: actual.rows.length,
      pending: actual.pending, post_report_observations: actual.post_report_observations,
      scope: 'read-only structural/original reconciliation; not independent business acceptance or delivery completion' }));
  });
});
