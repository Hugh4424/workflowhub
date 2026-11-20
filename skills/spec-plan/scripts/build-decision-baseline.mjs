import { readFileSync, readdirSync } from 'node:fs';
import { relative, isAbsolute, join, resolve } from 'node:path';
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
// New logs use numbered section titles such as 「1.3 原始需求（翻译后）」 and
// 「2.6 原话与答复索引」; the leading section number is navigation, not meaning.
function headingTitle(title) {
  return String(title ?? '').trim().replace(/^\d+(?:\.\d+)*[.、]?\s*/, '');
}
function requirementHeading(title) {
  const text = headingTitle(title);
  return /^(?:原始需求|原来要求做成什么)(?:[（(]翻译后[）)])?[？?]?$/.test(text) || text === '原始需求：要解决什么？';
}
function replyHeading(title) {
  return /^(?:需求变更记录|用户后来改了什么|后来改了什么(?:[，,]\s*原件在哪里)?|原话与答复索引)[？?]?$/.test(headingTitle(title));
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
  const add = (id, body, context, index, raw = null, displayId = id, title = '') => {
    if (!body) throw new Error(`BASELINE_SOURCE_INVALID: empty ${kind} ${id}`);
    if (found.has(id)) throw new Error(`BASELINE_SOURCE_INVALID: duplicate ${kind} ${id}`);
    found.set(id, { id, text: body, context, line: index + 1, raw, displayId, title });
    excluded.add(index);
  };
  // Newer logs write each requirement as a bold block (「**需求 1**」 or
  // 「**需求 4：归档先于提交**」 followed by indented bullets) instead of a table
  // row; the optional title is part of the same record, never a separate one.
  let block = null;
  const flushBlock = () => {
    if (!block) return;
    const current = block;
    block = null;
    add(current.id, current.lines.join('\n'), '', current.index, null, current.id, current.title);
    for (const lineIndex of current.marks) excluded.add(lineIndex);
  };
  for (const { text: line, index, visible } of sourceLines(text)) {
    if (!visible) { table = null; flushBlock(); continue; }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushBlock();
      table = null;
      const requirements = requirementHeading(heading[2]);
      const replies = replyHeading(heading[2]);
      if ((kind === '需求' && requirements) || (kind === '答复' && replies)) sectionDepth = heading[1].length;
      else if (requirements || replies || (sectionDepth && heading[1].length <= sectionDepth)) sectionDepth = null;
      continue;
    }
    if (!sectionDepth) continue;
    if (!line.trim().startsWith('|')) {
      table = null;
      const marker = kind === '需求' && /^\*\*需求\s+(\d+)\s*(?:[：:]\s*([^*]*?))?\s*\*\*$/.exec(line.trim());
      if (marker) {
        flushBlock();
        block = { id: marker[1], title: (marker[2] ?? '').trim(), lines: [], index, marks: [index] };
        continue;
      }
      if (block) {
        if (line.trim()) { block.lines.push(line.trim()); block.marks.push(index); } else flushBlock();
        continue;
      }
      const paragraph = kind === '答复' && /^(?:written(?:[。.:：]\s*|\s+))?(U-(?:[A-Z0-9]+-)*\d+)\s+(.+)$/.exec(line.trim());
      if (paragraph) add(paragraph[1], paragraph[2], '', index, line.trim());
      continue;
    }
    flushBlock();
    const cells = tableCells(line);
    const column = kind === '需求' ? /需求|约束|要求|内容|原义/ : /答复|最小决定|用户要什么|原义/;
    const idColumn = ['source_id', ...(kind === '需求' ? ['source_id 范围'] : []), '来源编号', '编号', kind, ...(kind === '答复' ? ['U'] : []), '来源'].map(label => cells.indexOf(label)).find(i => i >= 0) ?? -1;
    const textColumn = cells.findIndex((cell, i) => i !== idColumn && column.test(cell));
    if (idColumn >= 0 && textColumn >= 0) { table = { idColumn, textColumn }; excluded.add(index); continue; }
    if (!table) continue;
    if (cells.every(cell => /^:?-+:?$/.test(cell))) { excluded.add(index); continue; }
    const idText = cells[table.idColumn] ?? '';
    const legacy = new RegExp(`^${kind}\\s+(\\d+)$`).exec(idText);
    const sourceIds = idText.split(/[／/～~、]|\.\./);
    const source = sourceIds.length && sourceIds.every(id => new RegExp(`^${prefix}-(?:[A-Z0-9]+-)*\\d+$`).test(id.trim()));
    if (!legacy && !source) throw new Error(`BASELINE_SOURCE_INVALID: invalid ${kind} source ${idText}`);
    add(legacy ? Number(legacy[1]) : idText, cells[table.textColumn], cells.filter((_cell, i) => i !== table.idColumn && i !== table.textColumn).join('；'), index, null, legacy ? legacy[1] : idText);
  }
  flushBlock();
  const result = [...found.values()];
  const currentAbsence = /^(?:(?:已|经)(?:核对|核查|确认)[^。；;\n]*[。；;]\s*)?(?:本任务|本次(?:任务)?|当前(?:任务)?)(?:无|没有)(?:后续|新增|进一步)?(?:用户)?(?:答复|需求变更|变更)(?:或(?:需求)?变更)?[。.]?$/;
  const noReplies = kind === '答复' && !result.length && sourceContext(sourceLines(text).map(line => line.visible ? line.text : '').join('\n'), new Set(), 'decision-log.md', '答复').some(value => (currentAbsence.test(value.trim()) || /^目前没有需求变更（U）。(?:变更记录的唯一原件位置按「外置事实索引」放 `requirement-change-log\.md`，当前尚无内容。)?$/.test(value.trim())));
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
      const requirements = requirementHeading(heading[2]);
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
  const render = (kind, row) => row.raw ? `${row.raw}\n来源：${decisionRef}#L${row.line}` : `- ${kind} ${row.displayId}：${row.title ? `${row.title}\n` : ''}${row.text}。${row.context ? `上下文：${row.context}。` : ''}来源：${decisionRef}#L${row.line}`;
  lines.push(...requirements.map(row => render('需求', row)), '', `## 用户答复（${replies.length} 条，${grouped.length} 组）`, '');
  for (const group of grouped) {
    lines.push(`### ${group.title}`, '', ...group.ids.map(id => render('答复', replyById.get(id))), '');
  }
  const context = sourceContext(decisionLog, new Set([...requirementSource.excluded, ...replySource.excluded]), decisionRef);
  if (context.length) lines.push('## 需求与答复的附带原文', '', ...context);
  lines.push('## 已记录决定', '');
  const source = sourceLines(decisionLog), ids = new Set();
  let decisionCount = 0;
  // Newer logs index decisions in a table under 「决定索引」 instead of one
  // heading per decision; a row is the same record, not a second authority.
  const decisionId = /^(?:决定\s+\d+|(?:ADR|D|N|M)-?\d[A-Za-z0-9-]*)$/;
  let inIndex = false;
  for (let index = 0; index < source.length; index++) {
    const line = source[index];
    if (!line.visible) { inIndex = false; continue; }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line.text);
    if (heading) { inIndex = /^(?:决定索引|决定记录)$/.test(headingTitle(heading[2])); continue; }
    if (!inIndex || !line.text.trim().startsWith('|')) continue;
    const cells = tableCells(line.text);
    if (cells.every(cell => /^:?-+:?$/.test(cell))) continue;
    if (!decisionId.test(cells[0] ?? '')) continue;
    const id = cells[0];
    if (ids.has(id)) throw new Error(`BASELINE_SOURCE_INVALID: duplicate decision ${id}`);
    ids.add(id);
    const body = cells.slice(1).filter(Boolean).join('；');
    if (!body) throw new Error(`BASELINE_SOURCE_INVALID: empty decision ${id}`);
    lines.push(`- ${id} — ${body}`, `来源：${decisionRef}#L${index + 1}`, '');
    decisionCount++;
  }
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
  // build-plan consumes the per-package design, so the baseline carries it as a
  // verbatim excerpt instead of a summary; the item list is the template's own
  // definition of a package record, not a new gate.
  const designHeading = /^(?:每包设计)$/;
  let designed = 0;
  for (let index = 0; index < source.length; index++) {
    if (!source[index].visible) continue;
    const heading = /^(#{1,6})\s+(.+)$/.exec(source[index].text);
    if (!heading || !designHeading.test(headingTitle(heading[2]))) continue;
    let end = index + 1;
    while (end < source.length) {
      const match = source[end].visible && /^(#{1,6})\s+/.exec(source[end].text);
      if (match && match[1].length <= heading[1].length) break;
      end++;
    }
    if (!designed) lines.push('## 每包设计（模板十项：原始需求、最初方案、发散与被否、调研、最终决定、完整方案、验收、风险/回退、未决/消费者/证据、配套与影响）', '');
    lines.push(source.slice(index + 1, end).map(line => line.text).join('\n').trimEnd(), `来源：${decisionRef}#L${index + 1}-L${end}`, '');
    designed++;
    index = end - 1;
  }
  const result = lines.join('\n') + '\n';
  return result;
}


// A package design section is the v2 record: one heading per package, then the
// ten template items as bold labels (current log) or numbered headings
// (template skeleton). The item list is the template's own definition, not a
// second authority; this reader only reports what the source bytes contain.
export const TEMPLATE_DESIGN_ITEMS = Object.freeze(['原始需求', '最初方案', '发散与被否', '调研', '最终决定', '完整方案', '验收', '风险/回退', '未决/消费者/证据', '配套与影响']);
const COMPANION_ITEMS = Object.freeze(['配套调整', '配套迁移', '配套移除', '影响范围']);
function itemName(value) {
  return String(value ?? '').trim().replace(/[（(][^）)]*[）)]\s*$/, '').trim();
}
function requirementId(ac) {
  const match = /^AC-P(\d+)-(\d+)$/.exec(ac);
  return match ? Number(match[1]) : null;
}
// The current log writes AC-P1-1 and the spec writes AC-P1-001 for the same
// acceptance criterion; compare the id, not the zero padding.
function acKey(ac) {
  const match = /^AC-P(\d+)-(\d+)$/.exec(ac);
  return match ? `AC-P${Number(match[1])}-${Number(match[2])}` : ac;
}
export function readDesignPackages(markdown) {
  if (typeof markdown !== 'string') throw new TypeError('design source must be text');
  const packages = [];
  let current = null, item = null, sectionDepth = null;
  const closeItem = () => { item = null; };
  for (const { text: line, index, visible } of sourceLines(markdown)) {
    if (!visible) continue;
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const title = headingTitle(heading[2]);
      if (title === '每包设计') { sectionDepth = heading[1].length; current = null; closeItem(); continue; }
      if (sectionDepth === null) continue;
      if (heading[1].length <= sectionDepth) { sectionDepth = null; current = null; closeItem(); continue; }
      if (heading[1].length === sectionDepth + 1) {
        const numbered = /^(\d+)\.(\d+)\s+(.+)$/.exec(heading[2].trim());
        const named = /^包\s*`?(\d+)`?\s*[：:]\s*(.+)$/.exec(title);
        const name = numbered ? numbered[3].trim() : named?.[2]?.trim();
        const id = numbered ? Number(numbered[2]) : named ? Number(named[1]) : null;
        if (name && Number.isSafeInteger(id)) {
          current = { id, name, line: index + 1, items: new Map(), acs: [], text: [] };
          packages.push(current);
          closeItem();
          continue;
        }
      }
      if (current) {
        const numberedItem = /^#{2,6}\s+(\d+)\.\s*(.+)$/.exec(line);
        const headingItem = numberedItem ? itemName(numberedItem[2]) : null;
        if (headingItem && TEMPLATE_DESIGN_ITEMS.includes(headingItem)) {
          item = { name: headingItem, line: index + 1, lines: [] };
          current.items.set(headingItem, item);
          current.text.push(line);
          continue;
        }
      }
      if (current) current.text.push(line);
      continue;
    }
    if (!current) continue;
    current.text.push(line);
    const bold = /^\*\*([^*]+)\*\*\s*[：:]?/.exec(line.trim());
    if (bold && TEMPLATE_DESIGN_ITEMS.includes(itemName(bold[1]))) {
      const name = itemName(bold[1]);
      if (!current.items.has(name)) {
        item = { name, line: index + 1, lines: [line] };
        current.items.set(name, item);
      }
      for (const ac of line.match(/AC-P\d+-\d+/g) ?? []) if (!current.acs.includes(ac)) current.acs.push(ac);
      continue;
    }
    if (item) item.lines.push(line);
    for (const ac of line.match(/AC-P\d+-\d+/g) ?? []) if (!current.acs.includes(ac)) current.acs.push(ac);
  }
  return packages.map(pkg => ({ ...pkg, missingItems: TEMPLATE_DESIGN_ITEMS.filter(name => !pkg.items.has(name)) }));
}
function phaseRecord(path, text) {
  const id = /^#\s*Phase\s+(P\d+)\b/m.exec(text)?.[1] ?? /(?:^|\/)(P\d+)[^/]*\.md$/.exec(path ?? '')?.[1] ?? null;
  const field = pattern => {
    const match = pattern.exec(text);
    return match ? match[1].replace(/[；;.]$/, '').trim() : '';
  };
  return {
    id, path, text,
    coverage: (field(/^[ \t]*[-*]?[ \t]*\*\*覆盖 AC\*\*[ \t]*[:：][ \t]*([^\n]*)$/m).match(/AC-P\d+-\d+/g) ?? []),
    dependency: field(/^[ \t]*[-*]?[ \t]*\*\*依赖\*\*[ \t]*[:：][ \t]*([^\n]*)$/m),
    task: field(/^[ \t]*[-*]?[ \t]*\*\*任务编号\*\*[ \t]*[:：][ \t]*([^\n]*)$/m),
  };
}
function phaseIndexRows(markdown) {
  const rows = [];
  for (const line of String(markdown ?? '').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = tableCells(line).map(cell => cell.replace(/`/g, '').trim());
    if (!/^P\d+$/.test(cells[0] ?? '')) continue;
    rows.push({ id: cells[0], target: cells[1] ?? '', dependency: cells[4] ?? '' });
  }
  return rows;
}
/**
 * B table: package -> independent Phase -> covered ACs -> dependency/task.
 * A package is coarse-checked against the Phase whose 覆盖 AC carries its
 * `AC-P<n>-*` ids; the terminal aggregator P10 does not stand in for an
 * independent Phase of packages 1-9.
 */
export function reconcilePhaseCoverage({ decisionLog, phaseIndex = '', phases = [] } = {}) {
  const packages = readDesignPackages(decisionLog);
  const records = phases.map(entry => typeof entry === 'string' ? phaseRecord(null, entry) : phaseRecord(entry.path, entry.text)).filter(entry => entry.id);
  const rows = [], gaps = [];
  for (const pkg of packages) {
    const prefix = `AC-P${pkg.id}-`;
    const acs = [...new Set(pkg.acs.filter(ac => ac.startsWith(prefix)).map(acKey))];
    if (!acs.length) { gaps.push(`包 ${pkg.id}：设计节没有 ${prefix}* 编号；owner=包 ${pkg.id} 作者`); continue; }
    const covering = records.filter(record => record.coverage.some(ac => ac.startsWith(prefix)));
    const independent = covering.filter(record => record.id !== 'P10' || pkg.id === 10);
    const owner = independent[0] ?? null;
    const uncovered = acs.filter(ac => !covering.some(record => record.coverage.map(acKey).includes(ac)));
    if (!owner) gaps.push(`包 ${pkg.id}：没有独立 Phase 的覆盖 AC 承接 ${prefix}*（仅终末汇总不算）；owner=build-plan 作者`);
    for (const ac of uncovered) gaps.push(`包 ${pkg.id}：${ac} 未出现在任何 Phase 的覆盖 AC；owner=build-plan 作者`);
    if (owner) for (const ac of acs) if (!owner.coverage.map(acKey).includes(ac)) gaps.push(`包 ${pkg.id}：${ac} 不在 ${owner.id} 的覆盖 AC 内；owner=build-plan 作者`);
    const indexRow = phaseIndexRows(phaseIndex).find(row => row.id === owner?.id);
    rows.push({ package: pkg.id, name: pkg.name, phase: owner?.id ?? '无', acs: acs.join('、'), dependency: owner?.dependency || indexRow?.dependency || '未取得', task: owner?.task || '未取得', gap: owner ? '' : '缺独立 Phase' });
  }
  for (const row of phaseIndexRows(phaseIndex)) if (!records.some(record => record.id === row.id)) gaps.push(`Phase 索引有 ${row.id}，但没有对应 Phase 文件；owner=规划作者`);
  for (const record of records) for (const ac of record.coverage) {
    const id = requirementId(ac);
    if (id === null || !packages.some(pkg => pkg.id === id)) gaps.push(`Phase ${record.id} 的 ${ac} 不属于任何包；owner=规划作者`);
  }
  return { packages, phases: records, rows, gaps };
}
/**
 * C table: the ten design items and the spec/Phase landing for each package.
 * Only rows with a real gap are returned; a complete package writes no row.
 */
// A companion item must carry real content: a placeholder ("待定", "沿决策日志")
// or an empty label is a gap, not a filled item.
const PLACEHOLDER = /^(?:待定|待补|TBD|todo|沿决策日志|见决策日志|同上|无。?)$/i;
function companionProblems(pkg) {
  const section = pkg.items.get('配套与影响')?.lines.join('\n') ?? '';
  const missing = [], placeholders = [];
  for (const name of COMPANION_ITEMS) {
    const line = section.split('\n').find(value => value.includes(name)) ?? '';
    const body = line.replace(new RegExp(`^[^${name[0]}]*${name}`), '').replace(/^[*\s：:-]+/, '').trim();
    if (!section.includes(name)) missing.push(name);
    else if (!body || PLACEHOLDER.test(body)) placeholders.push(name);
  }
  return { missing, placeholders };
}
// File-like tokens inside the package's 完整方案; directories count as a prefix
// of a real file path so a declared directory is still a landing reference.
function designPaths(pkg) {
  const section = pkg.items.get('完整方案')?.lines.join('\n') ?? '';
  const found = new Set();
  for (const match of section.matchAll(/`([^`\n]+)`/g)) {
    const value = match[1].trim();
    if (/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.\/-]*)*\/?$/.test(value) && value.includes('/')
      && !value.startsWith('quality/evidence/')) found.add(value.replace(/#L\d+(?:-L\d+)?$/, ''));
  }
  return [...found];
}
export function reconcileDesignLanding({ decisionLog, spec = '', phaseIndex = '', phaseCoverage } = {}) {
  const coverage = phaseCoverage ?? reconcilePhaseCoverage({ decisionLog });
  const rows = [], gaps = [];
  const specText = String(spec);
  const indexText = String(phaseIndex);
  const hasPhases = Array.isArray(coverage?.phases) && coverage.phases.length > 0;
  if (!hasPhases) gaps.push('C 表未收到 Phase 正文，phases 落点未核；owner=C 表调用者');
  for (const pkg of coverage.packages) {
    const missing = pkg.missingItems;
    const companion = companionProblems(pkg);
    const acs = [...new Set(pkg.acs.filter(ac => ac.startsWith(`AC-P${pkg.id}-`)).map(acKey))];
    const specKeys = new Set((specText.match(/AC-P\d+-\d+/g) ?? []).map(acKey));
    const specMissing = acs.filter(ac => !specKeys.has(acKey(ac)));
    const phaseRow = coverage.rows.find(row => row.package === pkg.id);
    const phase = coverage.phases.find(record => record.id === phaseRow?.phase);
    const phaseText = phase?.text ?? '';
    const phaseMissing = hasPhases
      ? acs.filter(ac => !(phase?.coverage ?? []).map(acKey).includes(ac) && !phaseText.includes(ac))
      : [];
    const landingText = `${specText}\n${indexText}\n${phaseText}`;
    const pathMissing = designPaths(pkg).filter(value => !landingText.includes(value));
    if (missing.length) gaps.push(`包 ${pkg.id} 缺记录项：${missing.join('、')}；owner=包 ${pkg.id} 作者`);
    if (companion.missing.length) gaps.push(`包 ${pkg.id} 的配套与影响缺：${companion.missing.join('、')}；owner=包 ${pkg.id} 作者`);
    if (companion.placeholders.length) gaps.push(`包 ${pkg.id} 的配套项只有占位：${companion.placeholders.join('、')}；owner=包 ${pkg.id} 作者`);
    for (const ac of specMissing) gaps.push(`包 ${pkg.id} 的 ${ac} 未在 spec 出现；owner=规格作者`);
    for (const ac of phaseMissing) gaps.push(`包 ${pkg.id} 的 ${ac} 未在 ${phaseRow?.phase ?? '对应 Phase'} 的覆盖 AC 或正文出现；owner=规划作者`);
    for (const value of pathMissing) gaps.push(`包 ${pkg.id} 的完整方案路径 ${value} 未在 spec/Phase/索引落点；owner=规划作者`);
    if (missing.length || companion.missing.length || companion.placeholders.length || specMissing.length || phaseMissing.length || pathMissing.length) {
      rows.push({ package: pkg.id, missing, missingCompanion: companion.missing, placeholders: companion.placeholders, specMissing, phaseMissing, pathMissing });
    }
  }
  return { rows, gaps };
}
export function parseFindingDispositionTable(markdown) {
  const rows = [];
  let inTable = false;
  for (const line of String(markdown ?? '').split(/\r?\n/)) {
    if (/^##\s+.*逐项处置/.test(line.trim())) { inTable = true; continue; }
    if (!inTable) continue;
    if (!line.trim().startsWith('|')) { if (rows.length) break; continue; }
    const cells = tableCells(line);
    if (!/^\d+$/.test(cells[0] ?? '') || /^:?-+:?$/.test(cells[1] ?? '')) continue;
    rows.push({ index: Number(cells[0]), status: (cells[1] ?? '').trim(), location: (cells[2] ?? '').trim() });
  }
  return rows;
}
/**
 * C findings closure: every review finding needs exactly one legal
 * disposition; a `fixed` claim must name a readable revision location, and a
 * fixed finding whose quoted original assertion is still in the file is named.
 * `needs_human` stays open with its owner instead of counting as closed.
 */
function evidencePaths(text) {
  const values = new Set();
  for (const match of String(text ?? '').matchAll(/`([^`\n]+)`/g)) {
    const value = match[1].trim().replace(/#L\d+(?:-L\d+)?$/, '');
    if (value.includes('/') || /\.[A-Za-z0-9]+$/.test(value)) values.add(value);
  }
  for (const match of String(text ?? '').matchAll(/(?:^|[\s（(])([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.\/-]+)+(?::\d+(?:-\d+)?)?|[A-Za-z0-9_./-]+\.(?:mjs|js|json|ya?ml|md|ts|tsx|py|sh)(?::\d+(?:-\d+)?)?)/g)) {
    values.add(match[1].replace(/#L\d+(?:-L\d+)?$/, '').replace(/:\d+(?:-\d+)?$/, ''));
  }
  return [...values];
}
const DISPOSITION_STATUSES = ['fixed', 'rejected_invalid', 'accepted_risk', 'needs_human'];
/**
 * C findings closure. A `fixed` disposition passes only with real evidence:
 * at least one readable file/test reference (or finding-level fix refs), and no
 * kept original assertion. Without evidence it stays an open gap, never closed
 * by the status label alone.
 */
export function reconcileFindings({ findings = [], dispositions = [], files = new Map() } = {}) {
  const rows = [], gaps = [];
  const seen = new Set();
  let fixedTotal = 0, fixedProven = 0;
  for (const [position, finding] of findings.entries()) {
    const id = String(finding.finding_id ?? finding.id ?? `/${position + 1}`);
    const matches = dispositions.filter(item => item.index === position + 1);
    if (matches.length !== 1) {
      gaps.push(`finding ${id} 的处置条数不是 1（${matches.length}）；owner=审查处置者`);
      rows.push({ id, status: '未取得', proven: false, location: '' });
      continue;
    }
    const disposition = matches[0];
    seen.add(disposition.index);
    if (!DISPOSITION_STATUSES.includes(disposition.status)) {
      gaps.push(`finding ${id} 的处置 ${disposition.status || '(空)'} 不在 ${DISPOSITION_STATUSES.join('/')}；owner=审查处置者`);
      rows.push({ id, status: disposition.status, proven: false, location: disposition.location });
      continue;
    }
    let proven = false;
    if (disposition.status === 'fixed') {
      fixedTotal += 1;
      const declared = [...evidencePaths(disposition.location), ...evidencePaths((finding.fix_refs ?? []).join(' '))];
      const readable = declared.filter(value => files.has(value));
      proven = readable.length > 0;
      if (!disposition.location) gaps.push(`finding ${id} 标 fixed 但没有修订位置；owner=审查处置者`);
      else if (!declared.length) gaps.push(`finding ${id} 标 fixed 但没有可读修复证据（引用/字节/测试）；owner=审查处置者`);
      else if (!proven) gaps.push(`finding ${id} 的 fixed 证据 ${declared.join('、')} 不可读；owner=审查处置者`);
      if (proven) fixedProven += 1;
      const quote = finding.assertion ?? finding.quote;
      const path = finding.path?.replace(/^requirements\//, '');
      if (typeof quote === 'string' && quote && path && files.has(path) && files.get(path).includes(quote)) {
        proven = false;
        gaps.push(`finding ${id} 标 fixed 但原断言仍在 ${path}；owner=修复者`);
      }
    }
    if (disposition.status === 'needs_human') gaps.push(`finding ${id} 待人工处置：${disposition.location || '未写负责人'}；owner=原处置人`);
    rows.push({ id, status: disposition.status, proven, location: disposition.location });
  }
  for (const item of dispositions) if (!seen.has(item.index)) gaps.push(`处置序号 ${item.index} 没有对应 finding（finding 共 ${findings.length} 条）；owner=审查处置者`);
  return { rows, gaps, denominator: findings.length, fixed_total: fixedTotal, fixed_proven: fixedProven };
}
export function renderProjection({ coverage, landing, findings }) {
  const table = (header, rows) => [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`, ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n');
  const lines = ['', '## B 表（包 → 独立 Phase，粗查）', '', table(['包', '名字', 'Phase', '覆盖 AC', '依赖', '任务', '缺口'], (coverage?.rows ?? []).map(row => [row.package, row.name, row.phase, row.acs, row.dependency, row.task, row.gap || '无'])), '', `B 缺口：${(coverage?.gaps ?? []).length} 条`];
  for (const gap of coverage?.gaps ?? []) lines.push(`- ${gap}`);
  lines.push('', '## C 表（十项 → spec/phases 落点）', '', `C 缺口：${(landing?.gaps ?? []).length} 条；只列有缺口的包，完整的包不写行`);
  for (const row of landing?.rows ?? []) lines.push(`- 包 ${row.package}：缺项 ${row.missing.join('、') || '无'}；配套缺 ${row.missingCompanion.join('、') || '无'}；配套占位 ${row.placeholders.join('、') || '无'}；spec 未落 ${row.specMissing.join('、') || '无'}；Phase 未落 ${row.phaseMissing.join('、') || '无'}；路径未落 ${row.pathMissing.join('、') || '无'}`);
  for (const gap of landing?.gaps ?? []) lines.push(`- ${gap}`);
  if (findings) {
    lines.push('', '## C 表 findings 闭合', '', `findings ${findings.denominator} 条；处置 ${findings.rows.length} 条；fixed ${findings.fixed_proven}/${findings.fixed_total} 有可读修复证据；缺口 ${findings.gaps.length} 条`);
    for (const gap of findings.gaps) lines.push(`- ${gap}`);
  }
  return lines.join('\n') + '\n';
}
function readTaskMaterials(task) {
  const base = resolve('specs', task);
  const phaseDir = join(base, 'phases');
  const read = file => readFileSync(join(base, file), 'utf8');
  const phases = readdirSync(phaseDir).filter(file => /^P\d+.*\.md$/.test(file)).sort().map(file => ({ path: `phases/${file}`, text: readFileSync(join(phaseDir, file), 'utf8') }));
  return { base, decisionLog: read('decision-log.md'), spec: read('spec.md'), phaseIndex: read('phases/index.md'), phases };
}

export function runCli(argv) {
  try {
    const options = {};
    for (let index = 0; index < argv.length; index += 2) {
      if (!['--decision-log', '--spec', '--task', '--review', '--dispositions'].includes(argv[index]) || !argv[index + 1] || options[argv[index]]) throw new Error('expected --decision-log <file> [--spec <file>] or --task <task-id> [--review <file> --dispositions <file>]');
      options[argv[index]] = argv[index + 1];
    }
    const ref = path => relative(process.cwd(), path).split('\\').join('/');
    const files = new Map();
    const remember = (path, text) => { files.set(path, text); return text; };
    if (options['--task']) {
      if (options['--decision-log'] || options['--spec']) throw new Error('--task and --decision-log are mutually exclusive');
      const materials = readTaskMaterials(options['--task']);
      for (const phase of materials.phases) remember(phase.path, phase.text);
      remember('spec.md', materials.spec);
      const coverage = reconcilePhaseCoverage({ decisionLog: materials.decisionLog, phaseIndex: materials.phaseIndex, phases: materials.phases });
      const landing = reconcileDesignLanding({ decisionLog: materials.decisionLog, spec: materials.spec, phaseIndex: materials.phaseIndex, phaseCoverage: coverage });
      let findings = null;
      if (options['--review'] || options['--dispositions']) {
        if (!options['--review'] || !options['--dispositions']) throw new Error('--review and --dispositions must be supplied together');
        const review = JSON.parse(readFileSync(options['--review'], 'utf8'));
        const dispositions = parseFindingDispositionTable(readFileSync(options['--dispositions'], 'utf8'));
        findings = reconcileFindings({ findings: Array.isArray(review.findings) ? review.findings : [], dispositions, files });
      }
      const baseline = buildDecisionBaseline({ decisionLog: materials.decisionLog, spec: materials.spec,
        decisionRef: ref(join(materials.base, 'decision-log.md')), specRef: ref(join(materials.base, 'spec.md')) });
      process.stdout.write(baseline + renderProjection({ coverage, landing, findings }));
      return 0;
    }
    if (!options['--decision-log']) throw new Error('--decision-log or --task is required');
    process.stdout.write(buildDecisionBaseline({ decisionLog: readFileSync(options['--decision-log'], 'utf8'),
      spec: options['--spec'] ? readFileSync(options['--spec'], 'utf8') : '',
      decisionRef: ref(options['--decision-log']), specRef: options['--spec'] ? ref(options['--spec']) : 'spec.md' }));
    return 0;
  } catch (error) { console.error(error.message); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = runCli(process.argv.slice(2));
