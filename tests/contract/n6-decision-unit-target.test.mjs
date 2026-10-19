// Frozen N6 planning oracle: decision ADR-001/002, AC-016/032 and U-027/028.
// Handwritten units supply the independent truth; no implementation-derived expectations.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { checkDecisionLogChain } from '../../tools/cli/check-decision-log-chain.mjs';

const current = '#### ADR-001 — 需求有真实承接\n'
  + '- **做什么**：让每个单元可追溯。\n'
  + '- **不做什么**：不把报告做成门。\n'
  + '- **风险**：缺项保持可见。\n'
  + '- **改动**：只扩现有检查器。\n';
const header = '| 单元 | 谁接 | 落在哪 | 怎么验 |\n| --- | --- | --- | --- |\n';
const complete = '| R-002a | 工作包① | ADR-001 的需求索引设计 | AC-016 |\n';

function advisory(result) {
  expect(result.failures).toEqual([]);
  expect(result.exit_code).toBe(0);
}

test('N6 unit: complete R-002a has no missing-field or invalid-id warning', () => {
  const result = checkDecisionLogChain({ markdown: current + '\n' + header + complete });
  expect(result.warnings).toEqual([]);
  expect(result.recognized_blocks).toBe(1);
  expect(result.recognized_fields).toBe(4);
  advisory(result);
});

// Separate fixed literals make each missing obligation independently falsifiable.
for (const [field, row] of [
  ['谁接', '| R-002a | | ADR-001 的需求索引设计 | AC-016 |\n'],
  ['落在哪', '| R-002a | 工作包① | | AC-016 |\n'],
  ['怎么验', '| R-002a | 工作包① | ADR-001 的需求索引设计 | |\n'],
]) {
  test(`N6 unit: R-002a missing ${field} produces an identified advisory warning`, () => {
    const result = checkDecisionLogChain({ markdown: current + '\n' + header + row });
    expect(result.warnings.some(item => item.decision_id === 'R-002a'
      && item.field === field && item.message.includes('R-002a')
      && item.message.includes(field)), `R-002a must expose missing ${field}`).toBe(true);
    expect(result.warnings.some(item => /invalid/.test(item.code))).toBe(false);
    advisory(result);
  });
}

test('N6 unit: a derived requirement id remains valid in legacy requirement_ids', () => {
  const markdown = '### D-001 — 历史决定仍可引用派生单元\n'
    + '- module: 大纲\n- requirement_ids: [R-002a]\n- derived_from: []\n- artifacts: [spec.md]\n';
  const result = checkDecisionLogChain({ markdown });
  expect(result.warnings.filter(item => item.code === 'invalid_chain_field'
    && item.field === 'requirement_ids'), 'R-002a is a lawful derived requirement id').toEqual([]);
  expect(result.recognized_blocks).toBe(1);
  expect(result.recognized_fields).toBe(4);
  advisory(result);
});

test('N6 unit: fenced fake tables cannot declare incomplete units', () => {
  const markdown = current + '\n```markdown\n' + header
    + '| R-999a | | | |\n```\n\n' + header + complete;
  const result = checkDecisionLogChain({ markdown });
  expect(result.warnings).toEqual([]);
  expect(result.recognized_blocks).toBe(1);
  expect(result.recognized_fields).toBe(4);
  advisory(result);
});

test('N6 unit: unit tables preserve current four-field and historical five-field statistics', () => {
  const historical = '#### ADR-002 — 保留历史五字段\n'
    + '- **决定**：旧决定。\n- **为什么**：旧依据。\n- **否掉了什么**：旧替代。\n'
    + '- **后果与风险**：旧风险。\n- **影响面**：旧文件。\n';
  const result = checkDecisionLogChain({ markdown: current + '\n' + header + complete + '\n' + historical });
  expect(result.recognized_blocks).toBe(2);
  expect(result.recognized_fields).toBe(9);
  expect(result.warnings).toEqual([]);
  advisory(result);
});

test('N6 unit: CLI remains advisory and exits zero for an incomplete unit', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'n6-decision-unit-'));
  try {
    const file = join(temporary, 'decision-log.md');
    writeFileSync(file, current + '\n' + header + '| R-002a | | ADR-001 的需求索引设计 | AC-016 |\n');
    const command = fileURLToPath(new URL('../../tools/cli/check-decision-log-chain.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [command, '--file', file], { encoding: 'utf8' });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('non-blocking, exit 0');
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
