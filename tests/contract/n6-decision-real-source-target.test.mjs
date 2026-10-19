// N6 AC-016/032, U-027/028: real-source header variants complement the frozen unit oracle.
// Literal expected rows come from the confirmed sources, never from the checker.
// TCR-N6-REAL-SOURCE-FIXTURE changes fixture supply only: verified source literals
// run in any checkout/CI without the author's private external task store.
// One-time source-byte readback is retained with the TCR evidence, not run per test.
import { expect, test } from 'vitest';
import { checkDecisionLogChain } from '../../tools/cli/check-decision-log-chain.mjs';

const adr = '#### ADR-001 — 三件齐全\n- **做什么**：覆盖真实单元。\n'
  + '- **不做什么**：不增门。\n- **风险**：保留缺项。\n- **改动**：现有观察器。\n';
const samples = [
  {
    name: 'requirement-index 派生号', id: 'R-002a',
    path: 'quality/evidence/decision-log-refs/requirement-index.md',
    // Source SHA256: 76407fa2173f3ea1d0144bcc750730690a0ef735e35fd782b030cc95c0d95111
    header: '| 派生号 | 谁接 | 落在哪 | 怎么验 |',
    cells: ['R-002a', '①', 'ADR-001 重收敛表（需求索引件＋类型列＋最后变更批次）', 'AC-014、AC-015'],
  },
  {
    name: 'coverage 需求', id: 'R-001b',
    path: 'quality/evidence/decision-log-refs/coverage-matrix-5d.md',
    // Source SHA256: 4cc4ee57c738be4b0b135639c1154b5480a810af6d0f5143ac91f6bc61139c39
    header: '| 需求（含派生号单元） | 谁接（工作包） | 落在哪（文件或节） | 怎么验（验收编号） | 逐字原文（照抄索引件现状） |',
    cells: ['R-001b（第 2 单元）', '④', 'ADR-004 重收敛表（5 行小表）', 'AC-021、AC-051', '同上（R-001 逐字栏）'],
  },
];
const tableRow = cells => `| ${cells.join(' | ')} |`;
function sourceTable(sample, missing) {
  // Same verified real header/cells; mutate only the one explicitly absent field.
  const header = sample.header;
  const row = [...sample.cells];
  if (missing !== undefined) row[missing] = '';
  return `${adr}\n${header}\n${tableRow(row.map(() => '---'))}\n${tableRow(row)}\n`;
}
for (const sample of samples) {
  test(`N6 real source: ${sample.name} complete ${sample.id} has no warning`, () => {
    const result = checkDecisionLogChain({ markdown: sourceTable(sample) });
    expect(result.warnings).toEqual([]);
    expect(result.failures).toEqual([]);
    expect(result.exit_code).toBe(0);
    expect(result.recognized_blocks).toBe(1);
    expect(result.recognized_fields).toBe(4);
  });
  for (const [index, field] of ['谁接', '落在哪', '怎么验'].entries()) {
    test(`N6 real source: ${sample.name} ${sample.id} missing ${field} is identified`, () => {
      const result = checkDecisionLogChain({ markdown: sourceTable(sample, index + 1) });
      expect(result.warnings.some(item => item.decision_id === sample.id && item.field === field
        && item.message.includes(sample.id) && item.message.includes(field)),
      `${sample.name}: ${sample.id} must expose missing ${field}`).toBe(true);
      expect(result.warnings.some(item => /invalid/u.test(item.code))).toBe(false);
      expect(result.failures).toEqual([]);
      expect(result.exit_code).toBe(0);
      expect(result.recognized_blocks).toBe(1);
      expect(result.recognized_fields).toBe(4);
    });
  }
}
