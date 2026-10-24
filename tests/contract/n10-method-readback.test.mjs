import { describe, expect, it } from 'vitest';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixture = () => JSON.parse(readFileSync(join(ROOT, 'tests/fixtures/n10-method-readback.json'), 'utf8'));
const text = path => readFileSync(join(ROOT, path), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function readRow(row, read = text) {
  const path = resolve(ROOT, row.path);
  if (!path.startsWith(`${ROOT}${sep}`)) throw new Error(`${row.id}: path escapes repository`);
  const lines = read(row.path).split('\n');
  const selected = row.line.split(',').flatMap(range => {
    const match = /^(\d+)(?:-(\d+))?$/.exec(range);
    if (!match) throw new Error(`${row.id}: invalid line range`);
    const first = Number(match[1]); const last = Number(match[2] ?? match[1]);
    if (first < 1 || last < first || last > lines.length) throw new Error(`${row.id}: line range unavailable`);
    if (!lines[first - 1].trim()) throw new Error(`${row.id}: first line is blank`);
    return lines.slice(first - 1, last);
  });
  if (!selected.some(line => line.trim())) throw new Error(`${row.id}: no readable content`);
  if (!['machine', 'manual', 'both'].includes(row.kind)) throw new Error(`${row.id}: invalid kind`);
  if (row.kind !== 'machine' && (!row.path.endsWith('.md') || !row.trigger.startsWith('人读：') || /npx|node /u.test(row.trigger))) throw new Error(`${row.id}: manual boundary misrepresented`);
  if (row.kind === 'machine' && row.path.endsWith('.md')) throw new Error(`${row.id}: prose cannot prove machine wiring`);
  if (!row.trigger.trim()) throw new Error(`${row.id}: trigger missing`);
  return selected.join('\n');
}

function readRegistrations(catalogText, notice, spec) {
  const catalog = yaml.load(catalogText);
  const sources = catalog.skills.flatMap(skill => skill.upstream ?? []);
  const adoptedCommit = '1f0f9c3bac03c4297f6fc8f7644fa412eda57085';
  const entries = [
    [5, 'pstack::correct', 'skills/correct/SKILL.md', 'correct'],
    [8, 'pstack::encode-lessons-in-structure', 'skills/principle-encode-lessons-in-structure/SKILL.md', 'encode-lessons-in-structure'],
  ];
  const failures = [];
  const result = [];
  for (const [number, name, path, noticeName] of entries) {
    const matched = sources.filter(source => source.path === path && source.github_url === 'https://github.com/backnotprop/pstack');
    const hasNotice = notice.split('\n').some(line => line.includes(noticeName) && /pstack|backnotprop/u.test(line));
    if (matched.length !== 1 || matched[0]?.commit !== adoptedCommit) failures.push(`${name}: adopted snapshot mismatch`);
    if (!hasNotice) failures.push(`${name}: notice missing`);
    const row = spec.split('\n').find(line => line.startsWith(`| ${number} | ${name} |`));
    const disposition = row?.split('|')[3]?.trim();
    if (!['已生效读回', '本次接线验证', '未完成', '不采用'].includes(disposition)) failures.push(`${name}: Appendix B disposition unavailable`);
    if (matched.length === 1 && matched[0].commit === adoptedCommit && hasNotice && disposition === '未完成') failures.push(`${name}: registration/Appendix B inconsistent`);
    result.push({ name, path, commits: matched.map(source => source.commit), notice: hasNotice, disposition });
  }
  const swarms = catalog.capability_decisions.filter(entry => entry.name === 'swarm');
  const swarmPresent = swarms.length === 1 && swarms[0].status === 'watch' && swarms[0].local_path.includes('AGENTS.md');
  if (!swarmPresent) failures.push('swarm: consumer-only watch registration missing');
  const swarmRow = spec.split('\n').find(line => line.startsWith('| 16 | pstack::swarm |'));
  const disposition = swarmRow?.split('|')[3]?.trim();
  if (!['已生效读回', '本次接线验证', '未完成', '不采用'].includes(disposition) || (swarmPresent && disposition === '未完成')) failures.push('swarm: Appendix B inconsistent');
  result.push({ name: 'swarm', status: swarms[0]?.status, local_path: swarms[0]?.local_path, disposition });
  const diagnostics = failures.map(reason => {
    const entry = entries.find(([, name]) => reason.startsWith(`${name}:`));
    const id = entry?.[1] ?? (reason.startsWith('swarm:') ? 'swarm' : null);
    if (!id) throw new Error(`unmapped registration failure: ${reason}`);
    const appendix = reason.includes('Appendix B');
    const source = appendix
      ? `specs/archive/n10-finite-check-wiring-20261020/spec.md#Appendix B/${entry?.[0] ?? 16}`
      : reason.endsWith('notice missing') ? `THIRD_PARTY_NOTICES.md#${entry[3]}`
        : entry ? `skills/catalog.yaml#upstream.path=${entry[2]}` : 'skills/catalog.yaml#capability_decisions.swarm';
    return { id, status: 'incomplete', reason, source, owner: appendix ? 'P5/材料 owner' : 'P2 owner' };
  });
  return { failures, registrations: result, diagnostics };
}

describe('ORACLE-N10-METHOD-READBACK', () => {
  it('T017 reads thirteen consumers and six manual boundaries without claiming method execution', () => {
    const data = fixture();
    expect(data.rows.map(row => row.id)).toEqual([...Array.from({ length: 13 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`), ...Array.from({ length: 6 }, (_, i) => `M${String(i + 1).padStart(2, '0')}`)]);
    expect(data.rows.filter(row => row.kind === 'machine')).toHaveLength(12);
    expect(data.rows.filter(row => row.kind === 'manual')).toHaveLength(6);
    expect(data.rows.filter(row => row.kind === 'both')).toHaveLength(1);
    for (const row of data.rows) {
      expect(lstatSync(join(ROOT, row.path)).isFile(), row.id).toBe(true);
      expect(() => readRow(row), row.id).not.toThrow();
    }
    for (const item of data.incomplete) {
      expect(data.rows.some(row => row.id === item.id), item.id).toBe(true);
      expect(item.reason.trim(), item.id).not.toBe(''); expect(item.owner.trim(), item.id).not.toBe('');
    }
    console.log('N10_P4_SUMMARY', JSON.stringify({ consumers: 13, manual_boundaries: 6, incomplete: data.incomplete, limit: 'readable wiring only; no proof that the host executed methods', rows: data.rows }));
  });

  it('T017 controlled bad readback rows are rejected while explicit incomplete remains factual', () => {
    const row = fixture().rows[0];
    expect(() => readRow({ ...row, path: 'tests/fixtures/n10-method-missing.json' })).toThrow();
    expect(() => readRow({ ...row, line: '999999' })).toThrow(/line range unavailable/u);
    expect(() => readRow(row, () => '\n'.repeat(1000))).toThrow(/blank/u);
    expect(() => readRow({ ...row, kind: 'made-up' })).toThrow(/invalid kind/u);
    const manual = fixture().rows.find(item => item.id === 'M01');
    expect(() => readRow({ ...manual, trigger: '人读：node invented-command' })).toThrow(/manual boundary/u);
  });

  it('T018 exposes one tautological false green using the real N6 oracle and restores original bytes', () => {
    const sourcePath = join(ROOT, 'tests/contract/n6-decision-unit-target.test.mjs');
    const original = readFileSync(sourcePath);
    const input = "const result = checkDecisionLogChain({ markdown: current + '\\n' + header + complete });";
    const assertion = 'expect(result.warnings).toEqual([]);';
    const anchor = `${input}\n  ${assertion}`;
    expect(original.toString().split(anchor), 'unique two-line N6 anchor').toHaveLength(2);
    const brokenInput = "const result = checkDecisionLogChain({ markdown: current + '\\n' + header + '| R-002a | | ADR-001 的需求索引设计 | AC-016 |\\n' });";
    const weakAssertion = 'expect(Array.isArray(result.warnings)).toBe(true);';
    const states = [
      ['S0', original.toString(), 0],
      ['S1', original.toString().replace(anchor, `${brokenInput}\n  ${weakAssertion}`), 0],
      ['S2', original.toString().replace(anchor, `${brokenInput}\n  ${assertion}`), 1],
      ['S3', original.toString(), 0],
    ];
    const require = createRequire(import.meta.url);
    const vitestPackage = require.resolve('vitest/package.json');
    const runner = join(dirname(vitestPackage), 'vitest.mjs');
    expect(existsSync(runner), 'T018 runner unavailable').toBe(true);
    const temporary = mkdtempSync(join(tmpdir(), 'n10-method-readback-'));
    const copy = join(temporary, 'tests/contract/n6-copy.test.mjs');
    const results = [];
    try {
      mkdirSync(dirname(copy), { recursive: true });
      symlinkSync(join(ROOT, 'tools'), join(temporary, 'tools'), 'dir');
      symlinkSync(dirname(dirname(vitestPackage)), join(temporary, 'node_modules'), 'dir');
      const config = join(temporary, 'vitest.config.mjs');
      // Installed Vite 5.0 still creates WS with hmr=false. Attach HMR to an
      // owned, never-listening native server instead of its fixed shared port.
      writeFileSync(config, "import { createServer } from 'node:http';\nexport default { plugins: [{ name: 'n10-owned-non-listening-hmr', configResolved(config) { config.server.hmr = { server: createServer() }; } }] };\n");
      const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST')));
      // The copied oracle also spawns the linked CLI. Preserve its entry path
      // so the checker's existing import.meta.url main guard still executes.
      env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} --preserve-symlinks-main`.trim();
      const argv = [process.execPath, runner, 'run', '--root', temporary, '--config', config, 'tests/contract/n6-copy.test.mjs', '--maxWorkers=1', '--minWorkers=1', '--no-file-parallelism'];
      for (const [state, bytes, expectedExit] of states) {
        expect(hash(readFileSync(sourcePath)), `${state}: source drift`).toBe(hash(original));
        writeFileSync(copy, bytes);
        const result = spawnSync(argv[0], argv.slice(1), { cwd: temporary, env, encoding: 'utf8', timeout: 30_000 });
        const record = { state, argv, cwd: temporary, exit: result.status, signal: result.signal, error: result.error?.code ?? null, stdout: result.stdout, stderr: result.stderr, copy_sha256: hash(readFileSync(copy)), ...(['S1', 'S2'].includes(state) ? { temporary_bytes_before_replacement_or_cleanup: readFileSync(copy, 'utf8') } : {}) };
        results.push(record);
        console.log('N10_P4_MUTATION_STATE', JSON.stringify(record));
        expect(result.error, `${state}: runner/timeout failure is not target RED`).toBeUndefined();
        expect(result.signal, `${state}: signal`).toBeNull();
        expect(result.stderr, `${state}: no nested runner port collision`).not.toContain('WebSocket server error:');
        expect(result.status, `${state}: ${result.stdout}\n${result.stderr}`).toBe(expectedExit);
        if (state === 'S2') {
          expect(`${result.stdout}\n${result.stderr}`).toContain('N6 unit: complete R-002a has no missing-field');
          expect(`${result.stdout}\n${result.stderr}`).toContain('1 failed');
          expect(`${result.stdout}\n${result.stderr}`).toContain('missing_unit_field');
        }
      }
      expect(readFileSync(copy)).toEqual(original);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
      expect(hash(readFileSync(sourcePath)), 'repository frozen oracle unchanged').toBe(hash(original));
      expect(existsSync(temporary), 'owned temporary root cleaned').toBe(false);
      console.log('N10_P4_MUTATION', JSON.stringify({ source_ref: 'tests/contract/n6-decision-unit-target.test.mjs', source_sha256: hash(original), restored: results.at(-1)?.state === 'S3' && results.at(-1)?.copy_sha256 === hash(original), cleanup: !existsSync(temporary), limit: 'one assertion/input pair; no production RED or exhaustive mutation score' }));
    }
  }, 120_000);

  it('T019 reads human-only semantics and exact P2 registrations without claiming behavioral adoption', () => {
    const data = fixture();
    for (const id of ['M01', 'M04', 'M06']) {
      const row = data.rows.find(item => item.id === id);
      expect(row.kind, id).toBe('manual');
      expect(row.path, id).toMatch(/\.md$/u);
      expect(row.trigger, id).toMatch(/^人读：/u);
      expect(row.trigger, id).not.toMatch(/npx|node /u);
    }
    const catalog = text('skills/catalog.yaml'); const notice = text('THIRD_PARTY_NOTICES.md');
    const spec = text('specs/archive/n10-finite-check-wiring-20261020/spec.md');
    const result = readRegistrations(catalog, notice, spec);
    console.log('N10_P4_B_READBACK', JSON.stringify({ ...result, incomplete: result.diagnostics, limit: 'registration readback only; human semantics and actual adoption effects not observed' }));
    expect(result.failures, 'AC-METHOD-4 incomplete: exact P2 registrations and Appendix B').toEqual([]);
    const withoutNotice = notice.split('\n').filter(line => !line.includes('correct')).join('\n');
    expect(readRegistrations(catalog, withoutNotice, spec).failures).toContain('pstack::correct: notice missing');
    const altered = yaml.load(catalog);
    const source = altered.skills.flatMap(skill => skill.upstream ?? []).find(item => item.path === 'skills/correct/SKILL.md');
    source.commit = 'c0c3f13';
    expect(readRegistrations(yaml.dump(altered), notice, spec).failures).toContain('pstack::correct: adopted snapshot mismatch');
    altered.capability_decisions.find(item => item.name === 'swarm').status = 'absorbed';
    expect(readRegistrations(yaml.dump(altered), notice, spec).failures).toContain('swarm: consumer-only watch registration missing');
    expect(readRegistrations(catalog, notice, spec.replace('| 5 | pstack::correct | 本次接线验证 |', '| 5 | pstack::correct | 未完成 |')).failures).toContain('pstack::correct: registration/Appendix B inconsistent');
  });

  it('T019 retains failure facts and names independent P2/P5 incomplete handoffs for real input mutations', () => {
    const catalog = text('skills/catalog.yaml'); const notice = text('THIRD_PARTY_NOTICES.md');
    const spec = text('specs/archive/n10-finite-check-wiring-20261020/spec.md');
    expect(readRegistrations(catalog, notice, spec).diagnostics, 'normal input has no incomplete diagnostics').toEqual([]);
    const altered = yaml.load(catalog);
    for (const skill of altered.skills) skill.upstream = (skill.upstream ?? []).filter(source => source.path !== 'skills/correct/SKILL.md');
    altered.capability_decisions.find(item => item.name === 'swarm').status = 'absorbed';
    const withoutNotice = notice.split('\n').filter(line => !line.includes('correct')).join('\n');
    const withoutDisposition = spec.split('\n').filter(line => !line.startsWith('| 5 | pstack::correct |')).join('\n');
    const result = readRegistrations(yaml.dump(altered), withoutNotice, withoutDisposition);
    console.log('N10_P4_T019_INCOMPLETE', JSON.stringify({ failures: result.failures, incomplete: result.diagnostics, limit: 'controlled current-input mutations; failures remain nonempty and never certify pass' }));
    expect(result.failures).toContain('pstack::correct: adopted snapshot mismatch');
    expect(result.failures).toContain('pstack::correct: notice missing');
    expect(result.failures).toContain('pstack::correct: Appendix B disposition unavailable');
    expect(result.failures).toContain('swarm: consumer-only watch registration missing');
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      { id: 'pstack::correct', status: 'incomplete', reason: 'pstack::correct: adopted snapshot mismatch', source: 'skills/catalog.yaml#upstream.path=skills/correct/SKILL.md', owner: 'P2 owner' },
      { id: 'pstack::correct', status: 'incomplete', reason: 'pstack::correct: notice missing', source: 'THIRD_PARTY_NOTICES.md#correct', owner: 'P2 owner' },
      { id: 'pstack::correct', status: 'incomplete', reason: 'pstack::correct: Appendix B disposition unavailable', source: 'specs/archive/n10-finite-check-wiring-20261020/spec.md#Appendix B/5', owner: 'P5/材料 owner' },
      { id: 'swarm', status: 'incomplete', reason: 'swarm: consumer-only watch registration missing', source: 'skills/catalog.yaml#capability_decisions.swarm', owner: 'P2 owner' },
    ]));
    expect(result.diagnostics).toHaveLength(result.failures.length);
  });
});
