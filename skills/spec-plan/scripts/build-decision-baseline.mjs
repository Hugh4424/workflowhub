import { readFileSync } from 'node:fs';
import { relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

const clean = value => value.replace(/\s+/g, ' ').trim();
function rows(text, kind) {
  const found = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const cells = line.trim().split('|').slice(1, -1).map(clean);
    const match = new RegExp(`^${kind}\\s+(\\d+)$`).exec(cells[0] ?? '');
    if (!match || !cells[1] || /^[A-Z]+-[A-Z0-9-]+$/.test(cells[1])) continue;
    const id = Number(match[1]);
    if (found.has(id)) throw new Error(`BASELINE_SOURCE_INVALID: duplicate ${kind} ${id}`);
    found.set(id, { id, text: cells[1], context: cells.slice(2).join('；'), line: index + 1 });
  }
  const result = [...found.values()].sort((a, b) => a.id - b.id);
  if (!result.length || result.some((row, index) => row.id !== index + 1)) throw new Error(`BASELINE_SOURCE_INVALID: missing or non-contiguous ${kind} rows`);
  return result;
}
function groups(spec, replies) {
  const result = [];
  let inThemeTable = false;
  for (const line of spec.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { inThemeTable = false; continue; }
    const cells = line.trim().split('|').slice(1, -1).map(clean);
    if (cells[0] === '组' && cells[2]?.includes('用户答复')) { inThemeTable = true; continue; }
    if (!inThemeTable || !/用户答复\s+\d/.test(cells[2] ?? '')) continue;
    result.push({ title: cells[0], ids: (cells[2].match(/\d+/g) ?? []).map(Number) });
  }
  if (!result.length) return [{ title: '用户答复（未提供主题分组）', ids: replies.map(row => row.id) }];
  const assigned = result.flatMap(group => group.ids).sort((a, b) => a - b);
  if (assigned.length !== replies.length || assigned.some((id, index) => id !== replies[index].id)) throw new Error('BASELINE_SOURCE_INVALID: reply groups must cover each supplied reply exactly once');
  return result;
}

/** A provider excerpt, not a second decision authority. Nothing is persisted. */
export function buildDecisionBaseline({ decisionLog, spec = '', decisionRef = 'decision-log.md', specRef = 'spec.md' } = {}) {
  if (typeof decisionLog !== 'string' || !decisionLog.trim() || typeof spec !== 'string') throw new Error('BASELINE_SOURCE_INVALID: expected decision-log text and optional spec text');
  for (const ref of [decisionRef, specRef]) if (typeof ref !== 'string' || !ref || isAbsolute(ref) || ref.includes('\\') || ref.split('/').includes('..')) throw new Error('BASELINE_SOURCE_INVALID: source refs must be relative');
  const requirements = rows(decisionLog, '需求'), replies = rows(decisionLog, '答复');
  const grouped = groups(spec, replies), replyById = new Map(replies.map(row => [row.id, row]));
  const lines = ['# 决策基线（本次投递摘要）', '', `权威：${decisionRef}；主题分组：${specRef}。`,
    '摘要只帮助审查定位当前承诺。冲突以有源的后续真实答复与决定为准；未决项不当批准。', '',
    `## 原始需求（${requirements.length} 条）`, ''];
  const render = (kind, row) => `- ${kind} ${row.id}：${row.text}。${row.context ? `上下文：${row.context}。` : ''}来源：${decisionRef}#L${row.line}`;
  lines.push(...requirements.map(row => render('需求', row)), '', `## 用户答复（${replies.length} 条，${grouped.length} 组）`, '');
  for (const group of grouped) {
    lines.push(`### ${group.title}`, '', ...group.ids.map(id => render('答复', replyById.get(id))), '');
  }
  lines.push('## 已记录决定', '');
  const sourceLines = decisionLog.split(/\r?\n/);
  let decisionCount = 0;
  for (let index = 0; index < sourceLines.length; index++) {
    const heading = /^#{3,6}\s+(决定\s+\d+\s*[—–-].+)$/.exec(sourceLines[index]);
    const appended = /^-\s+\*\*(追加决定\s+\d+[^*]*)\*\*[:：]\s*(.*)$/.exec(sourceLines[index]);
    if (!heading && !appended) continue;
    let end = index + 1;
    while (end < sourceLines.length && !/^#{1,6}\s|^-\s+\*\*追加决定/.test(sourceLines[end])) end++;
    const body = sourceLines.slice(index + 1, end).join('\n');
    const choice = heading ? /\*\*选择\*\*[:：]\s*([\s\S]*?)(?=\n\*\*|$)/.exec(body)?.[1] : [appended[2], body].join('\n');
    lines.push(`- ${heading?.[1] ?? appended[1]}。${choice ? clean(choice) + ' ' : ''}来源：${decisionRef}#L${index + 1}`);
    decisionCount++;
  }
  if (!decisionCount) throw new Error('BASELINE_SOURCE_INVALID: no decision bodies found');
  const result = lines.join('\n') + '\n';
  if (Buffer.byteLength(result) > 60 * 1024) throw new Error('BASELINE_TOO_LARGE: summary exceeds 60 KiB; narrow source prose without dropping decisions');
  return result;
}

export function runCli(argv) {
  try {
    const options = {};
    for (let index = 0; index < argv.length; index += 2) {
      if (!['--decision-log', '--spec'].includes(argv[index]) || !argv[index + 1] || options[argv[index]]) throw new Error('expected --decision-log <file> [--spec <file>]');
      options[argv[index]] = argv[index + 1];
    }
    if (!options['--decision-log']) throw new Error('--decision-log is required');
    const ref = path => relative(process.cwd(), path).split('\\').join('/');
    process.stdout.write(buildDecisionBaseline({ decisionLog: readFileSync(options['--decision-log'], 'utf8'),
      spec: options['--spec'] ? readFileSync(options['--spec'], 'utf8') : '',
      decisionRef: ref(options['--decision-log']), specRef: options['--spec'] ? ref(options['--spec']) : 'spec.md' }));
    return 0;
  } catch (error) { console.error(error.message); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = runCli(process.argv.slice(2));
