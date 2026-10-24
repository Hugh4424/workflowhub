import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const rules = ['skills/test-routing-advisor/SKILL.md', 'workflows/verify-code/SKILL.md', 'workflows/build-code/SKILL.md', 'docs/standard-workflow.md', 'skills/spec-plan/templates/phase-template.md'];
const templates = ['skills/spec-specify/templates/spec-template.md', 'skills/spec-plan/templates/phase-template.md'];
const additions = [
  'tests/contract/n11-acceptance-rules.test.mjs', 'tests/contract/n11-discussion-quality.test.mjs',
  'tests/contract/n11-plan-quality.test.mjs', 'tests/contract/n11-capability-gaps.test.mjs',
  'tests/contract/n11-review-channel.test.mjs', 'tests/contract/n11-pairwise-judge.test.mjs',
  'tests/acceptance/n11-eval-run-check.test.mjs', 'tests/acceptance/n11-integration-acceptance.test.mjs',
  'skills/answer-as-page/scripts/render-answer-page.mjs', 'skills/deep-research/scripts/research-run.mjs',
  'tools/cli/n11-pairwise-judge.mjs', 'docs/research/n11-modeltest-adaptation-runbook.md',
  'docs/research/n11-evaluation-baseline-runbook.md', 'docs/research/n11-judge-and-cost.md',
  'docs/research/n11-integration-runbook.md',
];
// Test-local reader: observable method text is this Phase's artifact, not runtime behavior.
function scopeErrors(text) {
  return ['判断不了就升全链路', '风险不明时选更高一级', '完全无法判定时用 `fullstack`', '保守超集', '无说明全量重跑'].filter(old => text.includes(old));
}
function assetErrors(text) {
  return ['开工前四要素清单', '验证层', '命令或数据', '预期结果', '失败条件', '四项缺一即未开工'].filter(term => !text.includes(term));
}
function registrationErrors(entries, paths) {
  return paths.flatMap(path => {
    const matches = entries.filter(entry => entry.destination === path);
    if (matches.length !== 1) return [`${path}: missing or duplicate registration`];
    return ['consumer', 'owner', 'delete_condition'].filter(key => typeof matches[0][key] !== 'string' || !matches[0][key].trim()).map(key => `${path}: ${key}`);
  });
}
function prohibited(actions) {
  return actions.filter(action => /(?:^|\/)evaluation-platform\//.test(action.path ?? '')
    || /(?:\.codex|\.claude)\/sessions\//.test(action.path ?? '')
    || /snapshot-compat(?:ibility)?-bridge/.test(action.path ?? '')
    || /^skills\/eval\//.test(action.path ?? ''));
}
function fixture(text, check) {
  const dir = mkdtempSync(join(tmpdir(), 'n11-p1-'));
  try { const path = join(dir, 'input.txt'); writeFileSync(path, text); return check(readFileSync(path, 'utf8')); }
  finally { rmSync(dir, { recursive: true }); }
}

describe('ORACLE-N11-ACCEPT-SCOPE', () => {
  for (const path of rules) it(`${path}: default scope and explicit one-time exception`, () => {
    const text = read(path);
    expect(scopeErrors(text), path).toEqual([]);
    for (const term of ['最小可证伪集合', '未知影响面', '全局重跑', '一次', '事先说明']) expect(text, `${path}: ${term}`).toContain(term);
  });
  for (const path of ['workflows/verify-code/SKILL.md', 'workflows/build-code/SKILL.md', 'docs/standard-workflow.md']) it(`${path}: Phase-owned AC scope`, () => {
    expect(read(path)).toContain('本 Phase 承接 AC 与声明测试面');
  });
  for (const path of ['workflows/verify-code/SKILL.md', 'skills/spec-plan/templates/phase-template.md']) it(`${path}: skipped acceptance remains in denominator`, () => {
    const text = read(path);
    for (const term of ['unverified', '原因与影响面', '留在分母']) expect(text).toContain(term);
  });
  for (const text of ['判断不了就升全链路', '保守超集', '无说明全量重跑']) it(`rejects old scope: ${text}`, () => {
    expect(fixture(text, scopeErrors)).toEqual([text]);
  });
  it('preserves simple/feature/fullstack definitions', () => {
    const text = read(rules[0]);
    for (const line of ['`simple`：只改文档、文案、静态配置，或单模块低风险改动；无接口、数据、权限、构建链变化。', '`feature`：一个功能域内的行为变化；需要目标单测和邻接集成测试，但无跨端或基础设施链路。', '`fullstack`：跨前后端、API/协议、数据库迁移、认证授权、部署配置、并发/事务。']) expect(text).toContain(line);
  });
});

describe('ORACLE-N11-ASSET-FIRST', () => {
  for (const path of templates) it(`${path}: requires assets before work`, () => expect(assetErrors(read(path)), path).toEqual([]));
  it('rejects a checklist missing command/data', () => {
    expect(fixture('开工前四要素清单：验证层、预期结果、失败条件；四项缺一即未开工', assetErrors)).toEqual(['命令或数据']);
  });
  it('registers all 15 approved additions with ownership and deletion', () => {
    expect(registrationErrors(JSON.parse(read('docs/architecture/move-map.json')).entries, additions)).toEqual([]);
  });
  it('reports missing delete condition', () => {
    expect(fixture(JSON.stringify([{ destination: additions[0], consumer: 'P1 executor', owner: 'maintainer' }]), text => registrationErrors(JSON.parse(text), [additions[0]]))).toEqual([`${additions[0]}: delete_condition`]);
  });
  it('reports a new unregistered script', () => {
    expect(fixture('[]', text => registrationErrors(JSON.parse(text), ['tools/cli/unregistered.mjs']))).toEqual(['tools/cli/unregistered.mjs: missing or duplicate registration']);
  });
  for (const [name, path] of [ ['new evaluation platform', 'evaluation-platform/run.mjs'], ['host session scanning', '/Users/fixture/.codex/sessions/log.jsonl'], ['old snapshot compatibility bridge', 'runtime/snapshot-compat-bridge.mjs'], ['persistent eval skill', 'skills/eval/SKILL.md'] ]) it(`rejects prohibited ${name}`, () => {
    expect(fixture(JSON.stringify([{ path }]), text => prohibited(JSON.parse(text)))).toEqual([{ path }]);
  });
  it('accepts the declared additions without prohibited capabilities', () => expect(prohibited(additions.map(path => ({ path })))).toEqual([]));
});

// TCR: quality/reviews/2026-10-22-018-p1-tcr-prohibition-spec-presence.md.
// Checks the designated FR body only; duplicate mentions elsewhere cannot fill a gap.
describe('ORACLE-N11-ASSET-FIRST authoritative prohibition presence (approved TCR)', () => {
  const required = ['不新造评测台', '不扫宿主会话', '不恢复旧 snapshot 兼容桥', '不建常驻 eval 技能'];
  const fr = read('specs/n11-same-condition-eval-20261022/spec.md').split('\n').find(line => line.startsWith('- **FR-ACCEPT-005**：'));
  const missing = text => required.filter(term => !text.includes(term));
  it('reads all four prohibitions from the actual FR-ACCEPT-005 body', () => {
    expect(typeof fr).toBe('string');
    expect(missing(fr)).toEqual([]);
  });
  for (const term of required) it(`reports the removed FR prohibition: ${term}`, () => {
    expect(missing(fr.replace(term, ''))).toEqual([term]);
  });
});

// Approved narrow TCR: quality/reviews/2026-10-22-024-p1-skip-tcr-approval-raw.md.
// Text presence and controlled record checks are distinct; neither is a runtime writer.
describe('ORACLE-N11-ACCEPT-SCOPE ORACLE-N11-SKIP-VISIBLE', () => {
  const ruleSources = [
    ['workflows/verify-code/SKILL.md', '   按本 Phase 承接 AC 与声明测试面核对，'],
    ['skills/spec-plan/templates/phase-template.md', '默认只跑本任务范围内受影响测试，'],
  ];
  const constraints = ['unverified', '原因', '影响面', '留在分母'];
  function assertRule(paragraph) {
    for (const constraint of constraints) {
      if (!paragraph.includes(constraint)) throw new Error(`missing skip constraint: ${constraint}`);
    }
  }
  for (const [path, prefix] of ruleSources) {
    const paragraph = read(path).split('\n').find(line => line.startsWith(prefix));
    it(`${path}: binds all constraints in the actual named rule paragraph`, () => {
      expect(typeof paragraph).toBe('string');
      expect(() => assertRule(paragraph)).not.toThrow();
    });
    for (const constraint of constraints) it(`${path}: removal of ${constraint} fails then restoration passes`, () => {
      // Remove all occurrences in this paragraph; terms elsewhere cannot mask the loss.
      const broken = paragraph.split(constraint).join('');
      expect(() => assertRule(broken)).toThrow(`missing skip constraint: ${constraint}`);
      expect(() => assertRule(paragraph)).not.toThrow();
    });
  }

  const denominator = ['CASE-N11-EXECUTED', 'CASE-N11-SKIPPED'];
  const validRecords = [
    { id: 'CASE-N11-EXECUTED', executed: true, status: 'pass' },
    { id: 'CASE-N11-SKIPPED', executed: false, status: 'unverified', reason: 'Controlled fixture: required external observation was not performed.', impact: 'The external effect remains unverified.' },
  ];
  function skipRecordErrors(records, declaredDenominator) {
    const errors = [];
    for (const id of denominator) {
      if (!declaredDenominator.includes(id)) errors.push(`${id}: missing from denominator`);
      const record = records.find(row => row.id === id);
      if (!record) { errors.push(`${id}: missing acceptance record`); continue; }
      if (!record.executed) {
        if (record.status !== 'unverified') errors.push(`${id}: skipped status must be unverified`);
        if (typeof record.reason !== 'string' || !record.reason.trim()) errors.push(`${id}: missing reason`);
        if (typeof record.impact !== 'string' || !record.impact.trim()) errors.push(`${id}: missing impact`);
      }
    }
    return errors;
  }
  it('accepts the controlled legal record and keeps both named denominator IDs', () => {
    expect(denominator).toEqual(['CASE-N11-EXECUTED', 'CASE-N11-SKIPPED']);
    expect(skipRecordErrors(validRecords, denominator)).toEqual([]);
  });
  for (const [field, value, error] of [
    ['status', 'pass', 'CASE-N11-SKIPPED: skipped status must be unverified'],
    ['reason', '', 'CASE-N11-SKIPPED: missing reason'],
    ['impact', '', 'CASE-N11-SKIPPED: missing impact'],
  ]) it(`rejects controlled skipped ${field} violation and accepts restoration`, () => {
    const broken = validRecords.map(row => ({ ...row }));
    broken[1][field] = value;
    expect(skipRecordErrors(broken, denominator)).toEqual([error]);
    expect(skipRecordErrors(validRecords, denominator)).toEqual([]);
  });
  it('rejects removing the skipped ID from the fixed denominator and accepts restoration', () => {
    expect(skipRecordErrors(validRecords, ['CASE-N11-EXECUTED'])).toEqual(['CASE-N11-SKIPPED: missing from denominator']);
    expect(skipRecordErrors(validRecords, denominator)).toEqual([]);
  });
  it('documents that old three-word presence misses an illegal pass, without calling it historical RED', () => {
    const paragraph = read(ruleSources[0][0]).split('\n').find(line => line.startsWith(ruleSources[0][1]));
    const bad = validRecords.map(row => ({ ...row })); bad[1].status = 'pass';
    const material = paragraph + '\n' + JSON.stringify(bad);
    expect(['unverified', '原因与影响面', '留在分母'].every(term => material.includes(term))).toBe(true);
    expect(skipRecordErrors(bad, denominator)).toEqual(['CASE-N11-SKIPPED: skipped status must be unverified']);
  });
});

// Approved frozen-assertion correction: quality/reviews/2026-10-22-028-p1-fullstack-tcr-approval-raw.md.
describe('ORACLE-N11-ACCEPT-SCOPE ORACLE-N11-TIER-MINIMAL unknown fallback', () => {
  const oldFallback = '，或改动边界无法可靠证明更窄';
  function assertNoUnknownFallback(text) {
    if (text.includes(oldFallback)) throw new Error('ORACLE-N11-TIER-MINIMAL: unknown boundary must not automatically select fullstack');
  }
  it('checks actual routing text rejects the remaining unknown fallback', () => {
    expect(() => assertNoUnknownFallback(read('skills/test-routing-advisor/SKILL.md'))).not.toThrow();
  });
  it('detects controlled restoration of the actual fullstack line and accepts the current text', () => {
    const text = read('skills/test-routing-advisor/SKILL.md');
    const definition = text.split('\n').find(line => line.startsWith('- `fullstack`：'));
    expect(typeof definition).toBe('string');
    const restored = text.replace(definition, definition.replace(/。$/, oldFallback + '。'));
    expect(() => assertNoUnknownFallback(restored)).toThrow('ORACLE-N11-TIER-MINIMAL: unknown boundary must not automatically select fullstack');
    expect(() => assertNoUnknownFallback(text)).not.toThrow();
  });
});
