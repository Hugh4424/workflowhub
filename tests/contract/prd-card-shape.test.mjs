// ORACLE-PRD-MODEL: PRD 的头部 + 7 节 + 附录 B/C 形状、六字段卡、五列地图与四行验收。
// Reads the actual template and skill bytes; negative fixtures live only in this test.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const templatePath = 'skills/spec-prd/templates/prd-template.md';
const skillPath = 'skills/spec-prd/SKILL.md';
const fields = ['为什么做', '交付什么', '不做什么', '前置／依赖', '怎么验收', '风险与没定'];
const sampleNames = ['单卡', '同卡多段', '拆卡'];
const prdSections = ['背景与目标', '已定决策与边界', '共享定义', '任务地图', '任务卡', '覆盖、风险与没定', '变更说明'];

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

function sampleSection(text, name) {
  const start = text.indexOf(`### ${name}样例`);
  if (start < 0) return '';
  const rest = text.slice(start);
  const next = rest.slice(1).search(/\n#{2,3} /);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

export function shapeIssues(text) {
  const issues = [];
  const card = blankCard(text);
  for (const field of fields) {
    const count = (card.match(new RegExp('^- \\*\\*' + field + '\\*\\*', 'gm')) || []).length;
    if (count !== 1) issues.push(`blank-card field ${field} count ${count}`);
  }
  const samples = [...text.matchAll(/^### (单卡|同卡多段|拆卡)样例[：:]/gm)].map(match => match[1]);
  const sampleFieldCounts = { 单卡: 1, 同卡多段: 1, 拆卡: 2 };
  const factPattern = /\d+\s*(?:毫秒|字符|次|秒)|合同值/u;
  for (const name of sampleNames) {
    if (samples.filter(sample => sample === name).length !== 1) issues.push(`sample ${name} count`);
    const body = sampleSection(text, name).replace(/^.*\n/u, '');
    for (const field of fields) {
      const count = (body.match(new RegExp('^- \\*\\*' + field + '\\*\\*', 'gm')) || []).length;
      if (count !== sampleFieldCounts[name]) issues.push(`sample ${name} field ${field} count ${count}`);
    }
    if (!/来源：/u.test(body)) issues.push(`sample ${name} lacks source pointer`);
    if (!/故意弄坏/u.test(body)) issues.push(`sample ${name} lacks deliberate break`);
    if (!factPattern.test(body)) issues.push(`sample ${name} lacks a threshold fact`);
    if (!/不是/u.test(body)) issues.push(`sample ${name} lacks a negation`);
    if (/- \*\*下游\*\*/u.test(body)) issues.push(`sample ${name} keeps the downstream field`);
  }
  if (/^- \*\*下游\*\*/m.test(text)) issues.push('downstream field remains');
  if (!/^> Supersedes[：:]/m.test(text)) issues.push('missing head Supersedes');
  if (/^- \*\*Supersedes\*\*/m.test(text)) issues.push('Supersedes repeated in the change log');
  if (new Set(samples).size !== sampleNames.length) issues.push('sample names not distinct');
  if (!text.includes('material-writing')) issues.push('missing material-writing reference');
  if (/16\s*个?\s*(?:既有)?字段/.test(text)) issues.push('legacy 16-field text');
  if (!/^\| 任务 \| 结果 \| 依赖 \| 波次 \| 主承接需求 \|$/m.test(text)) issues.push('task map is not 5 columns');
  if (!/^## 附录 B 决策覆盖表$/m.test(text)) issues.push('missing appendix B decision coverage table');
  if (!/^\| 编号 \| 一句话 \| 落点卡 \| 处置 \|$/m.test(text)) issues.push('appendix B is not 4 columns');
  if (!/^## 附录 C 旧 AC 承接$/m.test(text)) issues.push('missing appendix C legacy AC mapping');
  if (!/^\| 旧 AC 组 \| 新落点 \|$/m.test(text)) issues.push('appendix C is not 2 columns');
  if (/^#{2,3} 附录 A/m.test(text)) issues.push('appendix A remains');
  if (!text.includes('共享定义、决策覆盖表、附录')) issues.push('missing the three overflow destinations');
  if (!/不得以删[^。\n]*(?:阈值|否定句|失败边界)/u.test(text)) issues.push('missing the no-delete rule');
  const third = card.match(/^3\. \*\*什么条件\*\*：(.+)$/m)?.[1] ?? '';
  const fourth = card.match(/^4\. \*\*怎样算通过\*\*：(.+)$/m)?.[1] ?? '';
  if (!third.includes('对照') || !third.includes('独立复算'))
    issues.push('third row lacks contrast/independent recompute');
  if (!fourth.includes('对照') || !fourth.includes('独立复算') || !fourth.includes('故意弄坏'))
    issues.push('fourth row lacks contrast/independent recompute/deliberate break');
  if (/判定器/.test(text)) issues.push('oracle field remains');
  if (/状态表/.test(text)) issues.push('status table remains');
  if (/##\s*实测记录/.test(text)) issues.push('measured-record section remains');
  if (/`(?:node|npm|npx|python|bash|git)\b/.test(text) || /exit_code\s*=|退出码\s*=/.test(text)) issues.push('command content remains');
  if (/证据字段|证据（原件/.test(text)) issues.push('evidence field remains');
  if (/\.(?:py|ts|tsx):\d+/.test(text)) issues.push('file:line reference remains');
  if (/重复覆盖矩阵/.test(text)) issues.push('duplicate coverage matrix remains');
  return issues;
}

export function skillIssues(text) {
  const issues = [];
  for (const section of prdSections) {
    if (!text.includes(section)) issues.push(`skill missing PRD section ${section}`);
  }
  if (!text.includes('附录 B')) issues.push('skill missing appendix B');
  if (!text.includes('附录 C')) issues.push('skill missing appendix C');
  if (!/拆卡、实现可行性、范围、验收、旧件保真/u.test(text)) issues.push('skill missing the five review items');
  if (!/^## 决策覆盖表/m.test(text)) issues.push('skill missing the decision coverage table section');
  if (!/不写证据清单/u.test(text)) issues.push('skill missing the card content limits');
  return issues;
}

describe('ORACLE-PRD-MODEL', () => {
  it('real PRD template carries the 7 sections, appendices B/C, six blank-card fields, three named samples and a 5-column map', () => {
    const actual = read(templatePath);
    expect(shapeIssues(actual)).toEqual([]);
    expect([...actual.matchAll(/^### (单卡|同卡多段|拆卡)样例[：:]/gm)].map(match => match[1]))
      .toEqual(sampleNames);
    for (const section of prdSections) expect(actual).toContain(`## ${section}`);
    expect(actual).not.toMatch(/^#{2,3} 附录 A/m);
  });

  it('spec-prd skill states the 7 PRD sections, appendices B/C, five review items and the coverage-table section', () => {
    expect(skillIssues(read(skillPath))).toEqual([]);
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
    ['appendix A section', '\n## 附录 A 旧件全文\n'],
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

  it('rejects a template with appendix B removed', () => {
    const actual = read(templatePath);
    const start = actual.indexOf('## 附录 B');
    const end = actual.indexOf('\n## ', start + 1);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const missing = actual.slice(0, start) + actual.slice(end + 1);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });

  it('rejects a template that loses one of the six card fields', () => {
    const actual = read(templatePath);
    const missing = actual.replace(/^- \*\*风险与没定\*\*：.*$/m, '');
    expect(missing).not.toBe(actual);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });

  it('rejects a template that loses the no-delete condition', () => {
    const actual = read(templatePath);
    const missing = actual.replace(/不得以删[^。\n]*/u, '');
    expect(missing).not.toBe(actual);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });

  it('rejects a template with the head Supersedes removed', () => {
    const actual = read(templatePath);
    const missing = actual.replace(/^> Supersedes[：:].*$/m, '');
    expect(missing).not.toBe(actual);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });

  it('rejects a sample that loses its threshold fact while keeping the negation', () => {
    const actual = read(templatePath);
    const missing = actual.replace(
      '读取重试默认 3 次、单次等待默认 2000 毫秒，只作初始值，不是封顶',
      '读取重试只作初始值，不是封顶',
    );
    expect(missing).not.toBe(actual);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });

  it('rejects a sample card that loses one of the six fields', () => {
    const actual = read(templatePath);
    const missing = actual.replace(/^- \*\*风险与没定\*\*：真实非法样例.*$/m, '');
    expect(missing).not.toBe(actual);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });

  it('rejects a sample card that reintroduces the downstream field', () => {
    const actual = read(templatePath);
    const missing = actual.replace(/^- \*\*风险与没定\*\*：真实非法样例/m, '- **下游**：真实非法样例');
    expect(missing).not.toBe(actual);
    expect(shapeIssues(missing)).not.toEqual([]);
    expect(shapeIssues(actual)).toEqual([]);
  });
});
