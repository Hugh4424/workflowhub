import { readFileSync } from 'node:fs';
import { relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

function sourceLines(text) {
  let fence = null;
  return text.split(/\r?\n/).map((text, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(text);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return { text, index, visible: false };
    }
    if (marker) { fence = marker[1]; return { text, index, visible: false }; }
    return { text, index, visible: !/^(?: {0,3}>| {4}|\t)/.test(text) };
  });
}
// The current decision-log template asks the reader question
// 「后来改了什么，原件在哪里？」; archived logs use the shorter legacy titles.
// Keep the same semantic boundary: only these reply-section questions match.
function replyHeading(title) {
  return /^(?:需求变更记录|用户后来改了什么|后来改了什么(?:[，,]\s*原件在哪里)?)[？?]?$/.test(String(title ?? '').trim());
}
function tableCells(line) {
  const cells = []; let start = 0, escaped = false;
  const text = line.trim();
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '|' && !escaped) { cells.push(text.slice(start, index).trim()); start = index + 1; }
    escaped = text[index] === '\\' && !escaped;
  }
  cells.push(text.slice(start).trim());
  return cells.slice(1, -1);
}
function rows(text, kind) {
  const found = new Map(), excluded = new Set(), prefix = kind === '需求' ? 'R' : 'U';
  let table = null, sectionDepth = null;
  const add = (id, body, context, index, raw = null, displayId = id) => {
    if (!body) throw new Error(`BASELINE_SOURCE_INVALID: empty ${kind} ${id}`);
    if (found.has(id)) throw new Error(`BASELINE_SOURCE_INVALID: duplicate ${kind} ${id}`);
    found.set(id, { id, text: body, context, line: index + 1, raw, displayId });
    excluded.add(index);
  };
  for (const { text: line, index, visible } of sourceLines(text)) {
    if (!visible) { table = null; continue; }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      table = null;
      const requirements = /^(?:原始需求|原来要求做成什么)[？?]?$/.test(heading[2]);
      const replies = replyHeading(heading[2]);
      if ((kind === '需求' && requirements) || (kind === '答复' && replies)) sectionDepth = heading[1].length;
      else if (requirements || replies || (sectionDepth && heading[1].length <= sectionDepth)) sectionDepth = null;
      continue;
    }
    if (!sectionDepth) continue;
    if (!line.trim().startsWith('|')) {
      table = null;
      const paragraph = kind === '答复' && /^(?:written(?:[。.:：]\s*|\s+))?(U-(?:[A-Z0-9]+-)*\d+)\s+(.+)$/.exec(line.trim());
      if (paragraph) add(paragraph[1], paragraph[2], '', index, line.trim());
      continue;
    }
    const cells = tableCells(line);
    const column = kind === '需求' ? /需求|约束|要求|内容|原义/ : /答复|最小决定|用户要什么|原义/;
    const idColumn = ['source_id', ...(kind === '需求' ? ['source_id 范围'] : []), '来源编号', kind, ...(kind === '答复' ? ['U'] : []), '来源'].map(label => cells.indexOf(label)).find(i => i >= 0) ?? -1;
    const textColumn = cells.findIndex((cell, i) => i !== idColumn && column.test(cell));
    if (idColumn >= 0 && textColumn >= 0) { table = { idColumn, textColumn }; excluded.add(index); continue; }
    if (!table) continue;
    if (cells.every(cell => /^:?-+:?$/.test(cell))) { excluded.add(index); continue; }
    const idText = cells[table.idColumn] ?? '';
    const legacy = new RegExp(`^${kind}\\s+(\\d+)$`).exec(idText);
    const sourceIds = idText.split(/[／/～~、]/);
    const source = sourceIds.length && sourceIds.every(id => new RegExp(`^${prefix}-(?:[A-Z0-9]+-)*\\d+$`).test(id.trim()));
    if (!legacy && !source) throw new Error(`BASELINE_SOURCE_INVALID: invalid ${kind} source ${idText}`);
    add(legacy ? Number(legacy[1]) : idText, cells[table.textColumn], cells.filter((_cell, i) => i !== table.idColumn && i !== table.textColumn).join('；'), index, null, legacy ? legacy[1] : idText);
  }
  const result = [...found.values()];
  const currentAbsence = /^(?:(?:已|经)(?:核对|核查|确认)[^。；;\n]*[。；;]\s*)?(?:本任务|本次(?:任务)?|当前(?:任务)?)(?:无|没有)(?:后续|新增|进一步)?(?:用户)?(?:答复|需求变更|变更)(?:或(?:需求)?变更)?[。.]?$/;
  const noReplies = kind === '答复' && !result.length && sourceContext(sourceLines(text).map(line => line.visible ? line.text : '').join('\n'), new Set(), 'decision-log.md', '答复').some(value => currentAbsence.test(value.trim()));
  if (!result.length && !noReplies) throw new Error(`BASELINE_SOURCE_INVALID: no recognized ${kind} source records in the supplied source section`);
  return { records: result, excluded };
}
function sourceContext(text, excluded, ref, kind = null) {
  const output = []; let section = null, block = [];
  const flush = () => {
    if (block.some(line => line.text.trim())) output.push(block.map(line => line.text).join('\n').trim(), `来源：${ref}#L${block[0].index + 1}-L${block.at(-1).index + 1}`, '');
    block = [];
  };
  for (const line of sourceLines(text)) {
    const heading = line.visible && /^(#{1,6})\s+(.+)$/.exec(line.text);
    if (heading && (!section || heading[1].length <= section)) {
      flush();
      const requirements = /^(?:原始需求|原来要求做成什么)[？?]?$/.test(heading[2]);
      const replies = replyHeading(heading[2]);
      const identity = kind === null && heading[2] === '任务身份';
      section = (identity || (kind !== '答复' && requirements) || (kind !== '需求' && replies)) ? heading[1].length : null;
      continue;
    }
    if (!section) continue;
    if (excluded.has(line.index)) flush(); else block.push(line);
  }
  flush();
  return output;
}
function groups(spec, replies) {
  const result = [];
  let inThemeTable = false;
  for (const { text: line, visible } of sourceLines(spec)) {
    if (!visible) { inThemeTable = false; continue; }
    if (!line.trim().startsWith('|')) { inThemeTable = false; continue; }
    const cells = tableCells(line);
    if (cells[0] === '组' && cells[2]?.includes('用户答复')) { inThemeTable = true; continue; }
    if (!inThemeTable || cells.every(cell => /^:?-+:?$/.test(cell))) continue;
    const ids = cells[2]?.match(/\bU-(?:[A-Z0-9]+-)*\d+\b/g) ?? (/(?:用户答复|答复)\s*\d/.test(cells[2] ?? '') ? (cells[2].match(/\d+/g) ?? []).map(Number) : []);
    if (!ids.length) throw new Error('BASELINE_SOURCE_INVALID: reply theme has no supplied source IDs');
    result.push({ title: cells[0], ids });
  }
  if (!result.length) return replies.length ? [{ title: '用户答复（未提供主题分组）', ids: replies.map(row => row.id) }] : [];
  const order = ids => ids.map(id => `${typeof id}:${id}`).sort();
  const assigned = order(result.flatMap(group => group.ids)), expected = order(replies.map(row => row.id));
  if (assigned.length !== expected.length || assigned.some((id, index) => id !== expected[index])) throw new Error('BASELINE_SOURCE_INVALID: reply groups must cover each supplied reply exactly once');
  return result;
}

/** A provider excerpt, not a second decision authority. Nothing is persisted. */
export function buildDecisionBaseline({ decisionLog, spec = '', decisionRef = 'decision-log.md', specRef = 'spec.md' } = {}) {
  if (typeof decisionLog !== 'string' || !decisionLog.trim() || typeof spec !== 'string') throw new Error('BASELINE_SOURCE_INVALID: expected decision-log text and optional spec text');
  for (const ref of [decisionRef, specRef]) if (typeof ref !== 'string' || !ref || isAbsolute(ref) || ref.includes('\\') || ref.split('/').includes('..')) throw new Error('BASELINE_SOURCE_INVALID: source refs must be relative');
  const requirementSource = rows(decisionLog, '需求'), replySource = rows(decisionLog, '答复');
  const requirements = requirementSource.records, replies = replySource.records;
  const grouped = groups(spec, replies), replyById = new Map(replies.map(row => [row.id, row]));
  const lines = ['# 决策基线（本次投递摘要）', '', `权威：${decisionRef}；主题分组：${spec.trim() ? specRef : '未提供主题分组源'}。`,
    '摘要只帮助审查定位当前承诺。冲突以有源的后续真实答复与决定为准；未决项不当批准。', '',
    `## 原始需求（${requirements.length} 条）`, ''];
  const render = (kind, row) => row.raw ? `${row.raw}\n来源：${decisionRef}#L${row.line}` : `- ${kind} ${row.displayId}：${row.text}。${row.context ? `上下文：${row.context}。` : ''}来源：${decisionRef}#L${row.line}`;
  lines.push(...requirements.map(row => render('需求', row)), '', `## 用户答复（${replies.length} 条，${grouped.length} 组）`, '');
  for (const group of grouped) {
    lines.push(`### ${group.title}`, '', ...group.ids.map(id => render('答复', replyById.get(id))), '');
  }
  const context = sourceContext(decisionLog, new Set([...requirementSource.excluded, ...replySource.excluded]), decisionRef);
  if (context.length) lines.push('## 需求与答复的附带原文', '', ...context);
  lines.push('## 已记录决定', '');
  const source = sourceLines(decisionLog), ids = new Set();
  let decisionCount = 0;
  for (let index = 0; index < source.length; index++) {
    if (!source[index].visible) continue;
    const heading = /^(#{3,6})\s+((?:决定\s+\d+|(?:ADR|D|N|M)-?\d[A-Za-z0-9-]*)\s*[—–-].+)$/.exec(source[index].text);
    const appended = /^-\s+\*\*(追加决定\s+\d+[^*]*)\*\*[:：]\s*(.*)$/.exec(source[index].text);
    if (!heading && !appended) continue;
    const id = (heading?.[2] ?? appended[1]).match(/^(?:决定\s+\d+|追加决定\s+\d+|(?:ADR|D|N|M)-?\d[A-Za-z0-9-]*)/)[0];
    if (ids.has(id)) throw new Error(`BASELINE_SOURCE_INVALID: duplicate decision ${id}`);
    ids.add(id);
    let end = index + 1;
    while (end < source.length) {
      const next = source[end];
      if (next.visible && (new RegExp(`^#{1,${heading ? heading[1].length : 6}}\\s`).test(next.text) || /^-\s+\*\*追加决定/.test(next.text))) break;
      end++;
    }
    const body = source.slice(index + 1, end).map(line => line.text).join('\n').trim();
    if (!(body || appended?.[2]?.trim())) throw new Error(`BASELINE_SOURCE_INVALID: empty decision ${id}`);
    lines.push(source.slice(index, end).map(line => line.text).join('\n').trimEnd(), `来源：${decisionRef}#L${index + 1}-L${end}`, '');
    decisionCount++;
    index = end - 1;
  }
  if (!decisionCount) throw new Error('BASELINE_SOURCE_INVALID: no decision bodies found');
  const result = lines.join('\n') + '\n';
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
