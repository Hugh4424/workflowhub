// P2 ORACLE-PRD-SHAPE: PRD task-card shape, four-column map and legacy cleanup.
// Reads the actual template bytes; negative fixtures live only in this test.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const templatePath = 'skills/spec-prd/templates/prd-template.md';
const fields = ['为什么做', '交付什么', '不做什么', '前置／依赖', '怎么验收', '下游'];
const sampleNames = ['单卡', '同卡多段', '拆卡'];

function between(text, start, end) {
  const from = text.indexOf(start);
  if (from < 0) return '';
  const rest = text.slice(from + start.length);
  const to = rest.indexOf(end);
  return to < 0 ? rest : rest.slice(0, to);
}

function blankCard(text) {
  return between(text, '### 空卡模板', '\n### ');
}

export function shapeIssues(text) {
  const issues = [];
  const card = blankCard(text);
  for (const field of fields) {
    const count = (card.match(new RegExp('^- \\*\\*' + field + '\\*\\*', 'gm')) || []).length;
    if (count !== 1) issues.push(`blank-card field ${field} count ${count}`);
  }
  const samples = [...text.matchAll(/^### (单卡|同卡多段|拆卡)样例[：:]/gm)].map(match => match[1]);
  for (const name of sampleNames) {
    if (samples.filter(sample => sample === name).length !== 1) issues.push(`sample ${name} count`);
  }
  if (new Set(samples).size !== sampleNames.length) issues.push('sample names not distinct');
  if (!text.includes('material-writing')) issues.push('missing material-writing reference');
  if (/16\s*个?\s*(?:既有)?字段/.test(text)) issues.push('legacy 16-field text');
  if (!/^\| 任务 \| 结果 \| 依赖 \| 波次 \|$/m.test(text)) issues.push('task map is not 4 columns');
  if (/判定器/.test(text)) issues.push('oracle field remains');
  if (/状态表/.test(text)) issues.push('status table remains');
  if (/##\s*实测记录/.test(text)) issues.push('measured-record section remains');
  if (/`(?:node|npm|npx|python|bash|git)\b/.test(text) || /exit_code\s*=|退出码\s*=/.test(text)) issues.push('command content remains');
  if (/证据字段|证据（原件/.test(text)) issues.push('evidence field remains');
  if (/\.(?:py|ts|tsx):\d+/.test(text)) issues.push('file:line reference remains');
  if (/重复覆盖矩阵|覆盖矩阵/.test(text)) issues.push('duplicate coverage matrix remains');
  return issues;
}

describe('ORACLE-PRD-SHAPE', () => {
  it('real PRD template carries six blank-card fields, three named samples, 4-column map and no legacy content', () => {
    const actual = read(templatePath);
    expect(shapeIssues(actual)).toEqual([]);
    expect([...actual.matchAll(/^### (单卡|同卡多段|拆卡)样例[：:]/gm)].map(match => match[1]))
      .toEqual(sampleNames);
  });

  const injections = [
    ['16-field text', '\n16 个既有字段\n'],
    ['oracle field', '\n判定器：ORACLE-EXAMPLE\n'],
    ['status table', '\n状态表：draft\n'],
    ['measured record section', '\n## 实测记录\n'],
    ['command content', '\n`node --test tests/example.test.mjs`\n'],
    ['evidence field', '\n证据字段：quality/tests/example.txt\n'],
    ['python line number', '\nsrc/config/load.py:12\n'],
    ['typescript line number', '\nsrc/cli/main.ts:7\n'],
    ['tsx line number', '\nsrc/ui/view.tsx:9\n'],
    ['duplicate coverage matrix', '\n重复覆盖矩阵\n'],
  ];
  for (const [name, snippet] of injections) {
    it(`rejects injected legacy ${name}`, () => {
      expect(shapeIssues(read(templatePath) + snippet)).not.toEqual([]);
    });
  }

  it('rejects a template with the single-card sample removed', () => {
    const actual = read(templatePath);
    const start = actual.indexOf('### 单卡样例');
    const end = actual.indexOf('\n### ', start + 1);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const missing = actual.slice(0, start) + actual.slice(end + 1);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });
});
