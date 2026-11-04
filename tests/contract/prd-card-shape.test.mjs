// P2 ORACLE-PRD-SHAPE: PRD task-card shape, four-column map and legacy cleanup.
// Reads the actual template bytes; negative fixtures live only in this test.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const templatePath = 'skills/spec-prd/templates/prd-template.md';
const fields = ['为什么做', '交付什么', '不做什么', '前置／依赖', '怎么验收', '下游'];

function cardSection(text) {
  const start = text.indexOf('## 任务卡');
  const end = text.indexOf('## 风险与交付说明');
  return start < 0 || end < 0 || end <= start ? '' : text.slice(start, end);
}

export function shapeIssues(text) {
  const issues = [];
  const card = cardSection(text);
  for (const field of fields) {
    const count = (card.match(new RegExp('^- \\*\\*' + field + '\\*\\*', 'gm')) || []).length;
    if (count !== 1) issues.push(`field ${field} count ${count}`);
  }
  if (!text.includes('material-writing')) issues.push('missing material-writing reference');
  if (/16\s*个?\s*(?:既有)?字段/.test(text)) issues.push('legacy 16-field text');
  if (!/^\| 任务 \| 结果 \| 依赖 \| 波次 \|$/m.test(text)) issues.push('task map is not 4 columns');
  if (/判定器/.test(text)) issues.push('oracle field remains');
  if (/状态表/.test(text)) issues.push('status table remains');
  if (/##\s*实测记录/.test(text)) issues.push('measured-record section remains');
  if (/`(?:node|npm|npx|python|bash|git)\b/.test(text) || /exit_code\s*=|退出码\s*=/.test(text)) issues.push('command content remains');
  if (/证据字段|证据（原件/.test(text)) issues.push('evidence field remains');
  if (/\.(?:py|ts|tsx):\d+/.test(text)) issues.push('file:line reference remains');
  return issues;
}

describe('ORACLE-PRD-SHAPE', () => {
  it('real PRD template carries six plain card fields, 4-column map and no legacy content', () => {
    expect(shapeIssues(read(templatePath))).toEqual([]);
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
  ];
  for (const [name, snippet] of injections) {
    it(`rejects injected legacy ${name}`, () => {
      expect(shapeIssues(read(templatePath) + snippet)).not.toEqual([]);
    });
  }
});
