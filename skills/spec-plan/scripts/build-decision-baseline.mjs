import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, relative, isAbsolute, join, resolve } from 'node:path';
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
  return String(title ?? '').trim().replace(/^\d+(?:\.\d+)*[.、]?\s*/, '').replace(/^§\d+(?:\.\d+)*\s*/, '');
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
function sectionLines(text, title) {
  let depth = 0;
  const result = [];
  for (const { text: line, index, visible } of sourceLines(text)) {
    if (!visible) continue;
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      if (title.test(headingTitle(heading[2]))) depth = heading[1].length;
      else if (depth && heading[1].length <= depth) depth = 0;
    } else if (depth) result.push({ text: line, line: index + 1 });
  }
  return result;
}
function sectionRows(text, title) {
  return sectionLines(text, title).filter(({ text }) => text.trim().startsWith('|'))
    .map(({ text, line }) => ({ cells: tableCells(text), line }));
}
function rows(text, kind, allowMissing = false) {
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
  if (!result.length && !noReplies && !allowMissing) throw new Error(`BASELINE_SOURCE_INVALID: no recognized ${kind} source records in the supplied source section`);
  return { records: result, excluded, noReplies };
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

// The log declares its one external index with the same line the chain checker
// reads: a `需求索引：<ref>` declaration, optionally inside a table cell, never a
// fenced example. Restated here because this skill is copied out of the host
// repository; keep it identical to tools/cli/check-decision-log-chain.mjs
// requirementIndexPointers when either side changes.
function requirementIndexPointers(markdown) {
  const found = new Set();
  for (const { text, visible } of sourceLines(markdown)) {
    if (!visible || !/^\s*(?:\|\s*|[-*+]\s+)需求索引/.test(text)) continue;
    for (const match of text.matchAll(/`([^`\s]+\.md)`/g)) found.add(match[1]);
    const bare = /需求索引\s*[：:]\s*([^\s|`]+\.md)/.exec(text)?.[1];
    if (bare) found.add(bare);
  }
  return [...found];
}
// The reply index is the template's one seven-column table. Its source-location
// column is written 「原件ref与行位」 in the old template and 「原件位置」 in v2;
// whitespace is not part of the label. The baseline reads both, while the
// canonical chain checker accepts only 「原件ref与行位」. All seven columns are
// required: a missing one is a gap in the material, not a narrower record.
const REPLY_INDEX_FIELDS = ['编号', '来源分级', '答复原文', '语气', '原件ref与行位', '时点', '所属包'];
function replyIndexColumns(cells) {
  const labels = cells.map(cell => cell.replace(/\s+/g, ''));
  const indexes = REPLY_INDEX_FIELDS.map(label => {
    const names = label === '原件ref与行位' ? ['原件ref与行位', '原件位置'] : [label];
    return names.map(name => labels.indexOf(name)).find(index => index >= 0) ?? -1;
  });
  return { indexes, missing: REPLY_INDEX_FIELDS.filter((_label, index) => indexes[index] < 0) };
}
// Same portable rule as tools/cli/check-decision-log-chain.mjs declaredTaskBase:
// the first absolute token on any line that names 基准目录. The v2 template writes
// 「基准目录是本任务库根的绝对路径：`X`。」, older logs write 「基准目录：`X`。」.
function declaredTaskBase(markdown) {
  for (const { text, visible } of sourceLines(markdown)) {
    if (!visible || !/基准目录/.test(text)) continue;
    const token = /`([^`]+)`/.exec(text)?.[1] ?? text.slice(text.search(/[：:]/) + 1).trim();
    if (token && isAbsolute(token)) return token;
  }
  return null;
}
// Same portable rule as tools/cli/check-decision-log-chain.mjs
// authenticatedTaskBase: an absolute declared root that is this very directory,
// a post task manifest, and task_id equal to the directory name.
function authenticatedTaskRoot(declared, selectedRoot) {
  if (typeof declared !== 'string' || !isAbsolute(declared)) return null;
  try {
    const root = realpathSync(declared);
    if (root !== realpathSync(selectedRoot)) return null;
    const manifest = JSON.parse(readFileSync(join(root, 'task.json'), 'utf8'));
    return manifest.activation_cohort === 'post' && manifest.task_id === basename(root) ? root : null;
  } catch { return null; }
}
// A caller selects the file, but only the decision log binds it: an exact
// 需求索引 pointer whose 证据索引 row records the sha256 of these very bytes.
// The path must end with that ref; the bytes are the binding, not the location.
function readExternalReplies(decisionLog, { path, bytes }) {
  const pointers = requirementIndexPointers(decisionLog);
  const matches = sectionRows(decisionLog, /^证据索引$/).flatMap(({ cells }) => {
    const ref = /^`(quality\/evidence\/[A-Za-z0-9_.\/-]+\.md)`$/.exec(cells[1])?.[1];
    const sha = /^`([0-9a-f]{64})`$/.exec(cells[2])?.[1];
    return ref && !ref.split('/').some(part => ['.', '..', ''].includes(part))
      && pointers.some(pointer => pointer === ref || basename(pointer) === basename(ref)) ? [{ ref, sha }] : [];
  });
  if (matches.length !== 1 || !matches[0].sha || !resolve(path).split('\\').join('/').endsWith(`/${matches[0].ref}`)) {
    throw new Error('BASELINE_SOURCE_INVALID: --reply-index is not bound to the decision-log evidence index: needs exactly one 需求索引 pointer that a 证据索引 row binds by sha256');
  }
  const { ref, sha } = matches[0];
  if (createHash('sha256').update(bytes).digest('hex') !== sha) throw new Error(`BASELINE_SOURCE_INVALID: reply index sha256 mismatch: ${ref}`);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const records = [], invalid = [], seen = new Set();
  let columns;
  for (const { cells, line } of sectionRows(text, /^(?:[一二三四五六七八九十]+、\s*)?(?:用户答复|答复登记)$/)) {
    if (cells[0] === '编号') {
      if (columns) throw new Error(`BASELINE_SOURCE_INVALID: duplicate reply index table at ${ref}#L${line}`);
      const header = replyIndexColumns(cells);
      if (header.missing.length) throw new Error(`BASELINE_SOURCE_INVALID: reply index header misses ${header.missing.join('、')} at ${ref}#L${line}`);
      columns = header.indexes;
      continue;
    }
    if (!columns || cells.every(cell => /^:?-+:?$/.test(cell))) continue;
    const [id, grade, body, tone, original, time, pkg] = columns.map(column => cells[column]);
    if (!/^U-(?:[A-Z0-9]+-)*\d+$/.test(id ?? '')) { invalid.push({ id: id || '无编号', line, reason: '编号不是 U-<数字>' }); continue; }
    // A duplicated U id leaves no honest way to pick one row: the whole table is refused.
    if (seen.has(id)) throw new Error(`BASELINE_SOURCE_INVALID: duplicate reply index row ${id} at ${ref}#L${line}`);
    const problems = [];
    if (!grade) problems.push('来源分级空');
    if (!body) problems.push('答复原文空');
    if (!tone) problems.push('语气空');
    if (!time) problems.push('时点空');
    if (!pkg) problems.push('所属包空');
    if (!original || /^(?:无|待定|TBD|未知|未取得|[-—]+)$/i.test(original)) problems.push('原件位置缺失');
    if (problems.length) { invalid.push({ id, line, reason: problems.join('、') }); continue; }
    seen.add(id);
    records.push({ id, text: body, displayId: id, line,
      context: cells.filter((_cell, index) => index !== columns[0] && index !== columns[2]).join('；') });
  }
  if (!records.length) throw new Error(`BASELINE_SOURCE_INVALID: no recognized 答复 source records in ${ref}`);
  const selectedRoot = resolve(path).slice(0, -ref.length - 1);
  return { ref, records, invalid, taskRoot: authenticatedTaskRoot(declaredTaskBase(decisionLog), selectedRoot) };
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const evidenceMarkdown = ref => /^quality\/evidence\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.md$/.test(ref ?? '')
  && !ref.split('/').some(part => part === '.' || part === '..');

// Portable inline callers need no host imports. Only the external read path uses
// the installed WorkflowHub owners, resolved from this producer, not from input.
async function openConvergenceTask(decisionLog, decisionRef, checklistRef) {
  const fail = reason => new Error(`BASELINE_SOURCE_INVALID: 收敛清单 ${checklistRef}：${reason}`);
  const id = /^specs\/([A-Za-z0-9][A-Za-z0-9._-]*)\/decision-log\.md$/.exec(decisionRef)?.[1];
  if (!id) throw fail('需要当前工作树的 specs/<task-id>/decision-log.md');
  try {
    const cwd = realpathSync(process.cwd());
    if (realpathSync(join(cwd, decisionRef)) !== join(cwd, decisionRef)) throw new Error('决策日志路径越界或经过链接');
    const require = createRequire(import.meta.url);
    const { resolveStorageRoot } = require('../../../runtime/evidence/storage-root.mjs');
    const { resolveCanonicalTaskPath } = require('../../../runtime/task/load-config.mjs');
    const { openTask } = require('../../../runtime/task/task-handle.mjs');
    const { openCurrentTaskWorkspace } = require('../../../runtime/task/workspace.mjs');
    // The declaration selects an identity only beneath the configured storage
    // root. I/O uses the canonical resolver, never a path supplied by Markdown.
    const declared = declaredTaskBase(decisionLog);
    const candidate = declared && /^Projects\/([A-Za-z0-9][A-Za-z0-9._-]*)\/tasks\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(relative(resolveStorageRoot(), declared).split('\\').join('/'));
    if (!candidate || candidate[2] !== id) throw new Error('日志声明的任务根与唯一规范任务根不符');
    const project = candidate[1];
    const { taskPath } = resolveCanonicalTaskPath({ project, task: id });
    if (resolve(declared) !== taskPath) throw new Error('日志声明的任务根与唯一规范任务根不符');
    const task = openTask(taskPath, { projectName: project, taskId: id });
    if (task.manifest.activation_cohort !== 'post') throw new Error('不属于当前 post 任务');
    // The owner enforces the default branch and path, or the registered
    // existing-mode workspace and its actual branch, without guessing names.
    const workspace = await openCurrentTaskWorkspace(task);
    if (workspace.worktreeRoot !== cwd) throw new Error('cwd 与任务登记工作树不符');
    return task;
  } catch (error) { throw fail(`无法认证任务工作树：${error.message}`); }
}

const decodeEvidence = bytes => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);

function readPlanReplies(spec, specRef, convergence) {
  const expectedSpec = `specs/${convergence.task.identity.taskId}/spec.md`;
  if (specRef !== expectedSpec || realpathSync(specRef) !== resolve(specRef)) return [];
  const result = [];
  for (const { cells, line } of sectionRows(spec, /^怎样回到原话[？?]?$/)) {
    const [location, purpose] = cells;
    if (!/^修订大纲真实答复(?:[；;]|$)/.test(purpose ?? '')) continue;
    const label = `${specRef}#L${line} 修订大纲真实答复`;
    const match = /^`T\/([^`:]+):(\d+)[–-](\d+)`$/.exec(location ?? '');
    const digest = /\bSHA256\s+`([a-f0-9]{64})`/i.exec(purpose)?.[1];
    if (!match || !evidenceMarkdown(match[1]) || !digest) { result.push(`- ${label}：原件位置越界、缺行位或缺 SHA-256；未取得，不作批准依据。`); continue; }
    const [, ref, first, last] = match;
    try {
      const bytes = convergence.task.readRecordBytes(ref);
      if (sha256(bytes) !== digest.toLowerCase()) throw new Error('SHA-256 不符');
      const lines = decodeEvidence(bytes).split(/\r?\n/);
      const body = +first >= 1 && +last >= +first && +last <= lines.length ? lines.slice(+first - 1, +last).join('\n').trimEnd() : '';
      if (!body.trim()) throw new Error('所声明行位越界或无正文');
      result.push(body, `来源：${ref}#L${first}-L${last}（SHA-256：${digest}；引自 ${specRef}#L${line}）`, '');
    } catch (error) { result.push(`- ${label}：${ref} ${error.message}；未取得，不作批准依据。`); }
  }
  return result;
}

// Section extent and normalization follow check-stage-steps' anchoredSection:
// the matching heading through the next same/outer-level heading, LF, trim,
// with/without one final LF. Fenced and quoted headings cannot be anchors.
function markdownSections(text, title) {
  const source = sourceLines(text);
  const headings = source.flatMap(({ text, visible, index }) => {
    const heading = visible && /^(#{1,6})\s+(.+)$/.exec(text);
    return heading ? [{ index, depth: heading[1].length, title: heading[2].trim() }] : [];
  });
  return headings.flatMap((heading, i) => {
    const match = title.exec(heading.title);
    if (!match) return [];
    const end = headings.slice(i + 1).find(next => next.depth <= heading.depth)?.index ?? source.length;
    const body = source.slice(heading.index, end).map(line => line.text).join('\n').trimEnd();
    return [{ id: Number(match[1]), name: match[2], line: heading.index + 1, text: body }];
  });
}

function convergenceRefs(text) {
  return sourceLines(text).flatMap(({ text, visible }) => {
    const match = visible && /^\s*[-*+]\s+收敛清单\s*[：:]\s*(.*)$/.exec(text);
    return match ? [/^`([^`]+)`/.exec(match[1])?.[1] ?? ''] : [];
  });
}

const WORK_PACKAGE = /^工作包\s*(\d+)(?=$|[\s：:—–-])(?:\s*[：:—–-]?\s*(.*))?$/;
async function readConvergenceCards(decisionLog, decisionRef, refs) {
  const packages = markdownSections(decisionLog, WORK_PACKAGE);
  if (refs.length !== 1 || !refs[0]) throw new Error('BASELINE_SOURCE_INVALID: 收敛清单需要唯一当前指针');
  const [checklistRef] = refs;
  if (!evidenceMarkdown(checklistRef)) throw new Error(`BASELINE_SOURCE_INVALID: 收敛清单越界：${checklistRef}`);
  const task = await openConvergenceTask(decisionLog, decisionRef, checklistRef);
  const { directionMaterialApi } = await import('../../../tools/cli/check-stage-steps.mjs');
  const { fiveMaterialDeclarationGaps } = directionMaterialApi();
  const read = (ref, fail) => {
    try { return decodeEvidence(task.readRecordBytes(ref)); } catch (error) { throw fail(`不可读：${ref}（${error.message}）`); }
  };
  const checklist = read(checklistRef, problem => new Error(`BASELINE_SOURCE_INVALID: 收敛清单 ${problem}`));
  // Use the current pointer, not any historical evidence-index file digest. A
  // checklist that itself binds a decision version must match this very log.
  for (const { text, visible } of sourceLines(checklist)) {
    if (!visible || !/^派生来源[：:]/.test(text)) continue;
    const source = /`([^`]+\/decision-log\.md|decision-log\.md)`(?:\s*[（(]\s*sha256\s*`?([0-9a-f]{64})`?\s*[）)])?/i.exec(text);
    if (source && ((source[1] !== decisionRef && source[1] !== 'decision-log.md') || (source[2] && source[2].toLowerCase() !== sha256(decisionLog)))) {
      throw new Error(`BASELINE_SOURCE_INVALID: 收敛清单 ${checklistRef} 引用旧清单或异任务决策日志`);
    }
  }
  const blocks = markdownSections(checklist, WORK_PACKAGE);
  if (!packages.length) throw new Error(`BASELINE_SOURCE_INVALID: 收敛清单 ${checklistRef} 缺当前日志具名工作包`);
  for (const { id } of blocks) if (!packages.some(pkg => pkg.id === id)) throw new Error(`BASELINE_SOURCE_INVALID: 收敛清单 ${checklistRef} 含未声明的包 ${id}`);
  const cards = packages.map(({ id, name }) => {
    const fail = reason => new Error(`BASELINE_SOURCE_INVALID: 包 ${id}（${checklistRef}）：${reason}`);
    const block = blocks.filter(pkg => pkg.id === id);
    if (packages.filter(pkg => pkg.id === id).length !== 1 || block.length > 1) throw fail('重复工作包');
    if (!block.length) throw fail('缺工作包');
    const bindings = markdownSections(block[0].text, /^包\s*(\d+)(?:\s*五件同包原件)?$/);
    if (bindings.length !== 1 || bindings[0].id !== id) throw fail('缺唯一同包原件节，或同包原件节包号不符');
    const declarations = sourceLines(bindings[0].text).flatMap(({ text, visible }) => {
      const match = visible && /^-\s*(?:当前)?方案卡\s*[：:]\s*(.*)$/.exec(text);
      return match ? [match[1]] : [];
    });
    if (declarations.length !== 1) throw fail('当前方案卡缺件或重复');
    const declaration = declarations[0];
    const field = key => {
      const matches = [...declaration.matchAll(new RegExp(`(?:^|[；;])\\s*${key}\\s*[=:：]\\s*([^；;\\s]+)`, 'g'))];
      return matches.length === 1 ? matches[0][1] : null;
    };
    if (field('任务') !== task.identity.taskId || !field('批次')) throw fail('当前方案卡任务不符或缺批次');
    const packageId = field('包');
    if (!/^\d+$/.test(packageId ?? '') || Number(packageId) !== id) throw fail(`当前方案卡包号不符：${packageId ?? '未取得'}`);
    const digest = field('卡节\\s*sha256');
    if (!/^[0-9a-f]{64}$/i.test(digest ?? '')) throw fail('当前方案卡缺卡节 sha256');
    const [ref, anchor, extra] = (/^`([^`]+)`/.exec(declaration)?.[1] ?? '').split('#');
    if (!evidenceMarkdown(ref)) throw fail(`当前方案卡越界或缺路径：${ref}`);
    // Same controlled card-original shapes as the convergence checker.
    const packagePath = /^quality\/evidence\/decision-maker\/p(\d+)\/card\.md$/.exec(ref);
    if (packagePath && Number(packagePath[1]) !== id) throw fail(`当前方案卡路径包号不符：${ref}`);
    if (!packagePath && !/^quality\/evidence\/(?:convergence-cards\.md|decision-log-refs\/(?:[^/]*-)?cards(?:-\d+)?\.md|convergence\/(?:[^/]+\/)*(?:card|(?:[^/]*-)?cards(?:-\d+)?)\.md)$/.test(ref)) throw fail(`不是方案卡原件：${ref}`);
    const anchorId = /^工作包[\s\-—–:：]*(\d+)$/.exec(anchor ?? '')?.[1];
    if (extra !== undefined || !anchorId || Number(anchorId) !== id) throw fail(`当前方案卡锚点与本包不符：${ref}#${anchor ?? ''}`);
    const section = markdownSections(read(ref, fail), WORK_PACKAGE).filter(pkg => pkg.id === id);
    if (section.length !== 1 || !section[0].text.includes('\n') || /^#\s/.test(section[0].text)) throw fail(`缺唯一可读本包卡节：${ref}#${anchor}`);
    const { text, line } = section[0];
    if (![sha256(text), sha256(`${text}\n`)].includes(digest.toLowerCase())) throw fail(`当前方案卡卡节 sha256 不符：${ref}#${anchor}`);
    const headers = sourceLines(block[0].text).flatMap(({ text, visible }) => {
      if (!visible || !/^\s*\|/.test(text)) return [];
      const [label, value] = tableCells(text);
      return label === '当前卡节' ? [value ?? ''] : [];
    });
    if (headers.length > 1) throw fail('当前卡节表行重复');
    if (headers.length) {
      const declared = /^`([^`#]+)#([^`#]+)`\s+sha256\s+(?:`([0-9a-f]{64})`|([0-9a-f]{64}))\s*$/i.exec(headers[0]);
      if (!declared) throw fail('当前卡节表行缺 ref、锚点或 SHA-256');
      if (declared[1] !== ref) throw fail('当前卡节表行的 ref 与当前方案卡不一致');
      if (declared[2] !== anchor) throw fail('当前卡节表行的锚点与当前方案卡不一致');
      if ((declared[3] ?? declared[4]).toLowerCase() !== digest.toLowerCase()) throw fail('当前卡节表行的 SHA-256 与当前方案卡不一致');
    }
    // Reuse the direction producer's declaration comparison, not its file I/O.
    // This baseline reads the protected card, not the other four originals.
    const bindingText = sourceLines(bindings[0].text).filter(line => line.visible).map(line => line.text).join('\n');
    const comparison = fiveMaterialDeclarationGaps({ id, body: bindingText, taskId: task.identity.taskId });
    if (comparison.gaps.length) throw fail(comparison.gaps.join('；'));
    return { id, name, ref, anchor, text, line, digest: digest.toLowerCase(), headerBound: headers.length === 1 };
  });
  return { task, checklistRef, cards };
}

/** A provider excerpt, not a second decision authority. Nothing is persisted. */
export function buildDecisionBaseline(options = {}) { return renderBaseline(options, null); }
function renderBaseline({ decisionLog, spec = '', decisionRef = 'decision-log.md', specRef = 'spec.md' }, external, convergence = null) {
  if (typeof decisionLog !== 'string' || !decisionLog.trim() || typeof spec !== 'string') throw new Error('BASELINE_SOURCE_INVALID: expected decision-log text and optional spec text');
  for (const ref of [decisionRef, specRef]) if (typeof ref !== 'string' || !ref || isAbsolute(ref) || ref.includes('\\') || ref.split('/').includes('..')) throw new Error('BASELINE_SOURCE_INVALID: source refs must be relative');
  const requirementSource = rows(decisionLog, '需求'), replySource = rows(decisionLog, '答复', Boolean(external));
  if (external && (replySource.records.length || replySource.noReplies)) throw new Error('BASELINE_SOURCE_INVALID: external reply index conflicts with inline reply records or declared absence');
  const requirements = requirementSource.records, replies = external?.records ?? replySource.records;
  const grouped = groups(spec, replies), replyById = new Map(replies.map(row => [row.id, row]));
  const lines = ['# 决策基线（本次投递摘要）', '', `权威：${decisionRef}；主题分组：${spec.trim() ? specRef : '未提供主题分组源'}。`,
    '摘要只帮助审查定位当前承诺。冲突以有源的后续真实答复与决定为准；未决项不当批准。', '',
    `## 原始需求（${requirements.length} 条）`, ''];
  const render = (kind, row, ref = decisionRef) => row.raw ? `${row.raw}\n来源：${ref}#L${row.line}` : `- ${kind} ${row.displayId}：${row.title ? `${row.title}\n` : ''}${row.text}。${row.context ? `上下文：${row.context}。` : ''}来源：${ref}#L${row.line}`;
  lines.push(...requirements.map(row => render('需求', row)), '', `## 用户答复（${replies.length} 条，${grouped.length} 组）`, '');
  if (external) lines.push(`外置索引：${external.ref}（与决策日志证据索引的 SHA-256 一致）`, '');
  for (const group of grouped) {
    lines.push(`### ${group.title}`, '', ...group.ids.map(id => render('答复', replyById.get(id), external?.ref)), '');
  }
  if (external?.invalid.length) lines.push('### 无效行（不作依据，缺什么照实写）', '', ...external.invalid.map(row => `- ${row.id}（${external.ref}#L${row.line}）：${row.reason}`), '');
  if (convergence) {
    const gaps = replies.filter(row => /^见/.test(row.text)).map(row => `- ${row.displayId}（${decisionRef}#L${row.line}）：答复栏仅为指针；未取得同版原话，不作独立批准依据。`);
    const planReplies = spec.trim() ? readPlanReplies(spec, specRef, convergence) : [];
    if (planReplies.length) lines.push('### 计划阶段来源表声明的真实答复', '', ...planReplies, '');
    if (gaps.length) lines.push('### 原话未取得', '', ...gaps, '');
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
  const indexedIds = new Set(ids), proseIds = new Set();
  const prose = source.flatMap(({ visible, index, text }) => {
    if (!visible) return [];
    const spaced = /^(#{3,6})\s+(D-\d+)[ \t]+([^—–\s-].*)$/.exec(text);
    const legacyHeading = /^(#{3,6})\s+((?:决定\s+\d+|(?:ADR|D|N|M)-?\d[A-Za-z0-9-]*)\s*[—–-].+)$/.exec(text);
    const heading = legacyHeading ?? spaced;
    const appended = /^-\s+\*\*(追加决定\s+\d+[^*]*)\*\*[:：]\s*(.*)$/.exec(text);
    if (!heading && !appended) return [];
    const id = (heading?.[2] ?? appended[1]).match(/^(?:决定\s+\d+|追加决定\s+\d+|(?:ADR|D|N|M)-?\d[A-Za-z0-9-]*)/)[0];
    // An existing v2 index row can navigate to one space-delimited body of the
    // same ID. Two bodies (or two index rows) still make the source ambiguous.
    if (proseIds.has(id) || (indexedIds.has(id) && (legacyHeading || !spaced))) {
      throw new Error(`BASELINE_SOURCE_INVALID: duplicate decision ${id}`);
    }
    proseIds.add(id);
    return [{ id, index, heading, appended }];
  });
  const boundaries = new Set(prose.map(item => item.index));
  for (const { id, index, heading, appended } of prose) {
    let end = index + 1;
    while (end < source.length) {
      const next = source[end];
      if (boundaries.has(end) || (next.visible && (new RegExp(`^#{1,${heading ? heading[1].length : 6}}\\s`).test(next.text) || /^-\s+\*\*追加决定/.test(next.text)))) break;
      end++;
    }
    const body = source.slice(index + 1, end).map(line => line.text).join('\n').trim();
    if (!(body || appended?.[2]?.trim())) throw new Error(`BASELINE_SOURCE_INVALID: empty decision ${id}`);
    lines.push(source.slice(index, end).map(line => line.text).join('\n').trimEnd(), `来源：${decisionRef}#L${index + 1}-L${end}`, '');
    decisionCount++;
  }
  if (!decisionCount) throw new Error('BASELINE_SOURCE_INVALID: no decision bodies found');
  // build-plan consumes the per-package design, so the baseline carries it as a
  // verbatim excerpt instead of a summary; the item list is the template's own
  // definition of a package record, not a new gate.
  const designHeading = /^(?:每包设计)$/;
  let designed = 0;
  if (convergence && !convergence.inlineDesign) {
    lines.push('## 每包设计（外置方案卡原文）', '', `当前收敛清单：${convergence.checklistRef}。仅收录已核卡节 SHA-256 的正文；同包其他原件只核声明一致性，未复读，不证明用户批准本版卡。`, '');
    for (const card of convergence.cards) {
      if (!card.headerBound) lines.push(`- 包 ${card.id}：收敛清单未声明「当前卡节」表行，仅核当前方案卡声明与原卡正文。`, '');
      lines.push(card.text, `来源：${card.ref}#L${card.line}-L${card.line + card.text.split('\n').length - 1}（${card.anchor}；卡节 SHA-256：${card.digest}）`, '');
    }
  }
  for (let index = 0; (!convergence || convergence.inlineDesign) && index < source.length; index++) {
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
  if (convergence?.inlineDesign) {
    lines.push('## 每包设计的原卡证据', '', `当前收敛清单：${convergence.checklistRef}。内联日志是设计正文；外置卡仅核包号集合、当前卡节和同包声明，不证明逐项内容承接或用户批准本版卡。`, '');
    for (const card of convergence.cards) {
      lines.push(`- 包 ${card.id}：${card.ref}#${card.anchor}（L${card.line} 起；卡节 SHA-256：${card.digest}${card.headerBound ? '' : '；未声明「当前卡节」表行'}）`);
    }
    lines.push('');
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
function checkInlineDesign(packages, cards) {
  const fail = problem => new Error(`BASELINE_SOURCE_INVALID: 当前收敛清单与内联每包设计冲突：${problem}`);
  const ids = packages.map(pkg => pkg.id);
  const missing = cards.filter(card => !ids.includes(card.id)).map(card => `缺包 ${card.id}`);
  const extra = packages.filter(pkg => !cards.some(card => card.id === pkg.id)).map(pkg => `多出包 ${pkg.id}`);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))].map(id => `重复包 ${id}`);
  if (missing.length || extra.length || duplicates.length) throw fail([...missing, ...extra, ...duplicates].join('；'));
  for (const pkg of packages) {
    const empty = TEMPLATE_DESIGN_ITEMS.filter(name => {
      const body = (pkg.items.get(name)?.lines ?? []).map(line => line.trim().replace(/^\*\*[^*]+\*\*\s*[：:]?\s*/, '')).join('\n').trim();
      return !body || PLACEHOLDER.test(body) || /^待第\s*\d+\s*步/.test(body) || /^`?<[^<>\n]+>`?[。.]?$/.test(body);
    });
    if (empty.length) throw fail(`包 ${pkg.id} 缺实质条目：${empty.join('、')}`);
  }
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
const acceptanceIds = text => text.match(/\bAC-(?:[A-Z0-9]+-)+\d+\b/g) ?? [];
function phaseRecord(path, text) {
  const id = /^#\s*Phase\s+(P\d+)\b/m.exec(text)?.[1] ?? /(?:^|\/)(P\d+)[^/]*\.md$/.exec(path ?? '')?.[1] ?? null;
  const field = pattern => {
    const match = pattern.exec(text);
    return match ? match[1].replace(/[；;.]$/, '').trim() : '';
  };
  return {
    id, path, text,
    coverage: acceptanceIds(field(/^[ \t]*[-*]?[ \t]*\*\*覆盖 AC\*\*[ \t]*[:：][ \t]*([^\n]*(?:\r?\n[ \t]+AC-[A-Z0-9-][^\n]*)*)$/m)),
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
function phaseIndexGaps(index, records, { exact = false } = {}) {
  return index.flatMap(({ id, target }) => {
    const matches = records.filter(record => record.id === id);
    if (!matches.length) return [`Phase 索引有 ${id}，但没有对应 Phase 文件；owner=规划作者`];
    if (exact && (matches.length !== 1 || matches[0].path !== target || !new RegExp(`^#\\s*Phase\\s+${id}\\b`, 'm').test(matches[0].text))) {
      return [`Phase 索引 ${id} 的 ${target || '(缺路径)'} 未指向唯一同名 Phase 正文；owner=规划作者`];
    }
    return [];
  });
}
// A current mixed source can cite several deliveries per package. The trace
// proves only what the spec names; neither a shared source nor a terminal
// aggregate supplies missing per-package ownership.
function currentTraceGaps(spec, records) {
  const trace = specTaskRows(spec), gaps = [];
  if (!trace.length) return ['spec 未取得 Source → FR → AC → Phase/Task 追踪，不能核当前覆盖；owner=规划作者'];
  for (const row of trace) {
    const label = `spec.md#L${row.line}`;
    if (!row.source || !row.hasFr || !row.acs.length || !row.phase) {
      gaps.push(`${label} 缺 Source、FR、AC 或具名 Phase/Task；owner=规划作者`);
      continue;
    }
    const parents = records.filter(record => record.id === row.phase);
    if (parents.length !== 1) { gaps.push(`${label} 的 ${row.phase}/${row.task} 缺唯一 Phase 正文；owner=规划作者`); continue; }
    const [parent] = parents;
    if (parent.task !== row.task) gaps.push(`${label} 的 ${row.phase}/${row.task} 与 Phase 实际任务 ${parent.task || '未取得'} 不符；owner=规划作者`);
    const coverage = new Set(parent.coverage.map(acKey));
    for (const ac of row.acs) if (!coverage.has(acKey(ac))) gaps.push(`${label} 的 ${ac} 未在 ${row.phase} 覆盖 AC 内；owner=规划作者`);
  }
  return gaps;
}
function specTaskRows(spec) {
  const rows = [];
  let inTable = false;
  for (const { text, index, visible } of sourceLines(spec)) {
    if (!visible || !text.trim().startsWith('|')) { inTable = false; continue; }
    const cells = tableCells(text);
    if (cells.slice(0, 4).join('|') === 'Source|FR|AC|Phase/Task') { inTable = true; continue; }
    if (!inTable || cells.every(cell => /^:?-+:?$/.test(cell))) continue;
    const [source = '', fr = '', ac = '', target = ''] = cells;
    const match = /^(P\d+)\/(T\d+)$/.exec(target);
    rows.push({ source, acs: acceptanceIds(ac), hasFr: /\bFR-(?:[A-Z0-9]+-)*\d+\b/.test(fr), phase: match?.[1], task: match?.[2], line: index + 1 });
  }
  return rows;
}
// Resolve only a declared group, through its package's own decision-index rows
// and the decision that spec's Source column actually cites. A package may own
// several decisions; the cited one selects the row, not a "exactly one" count.
function packageGroupTraces(decisionLog, spec) {
  const crosswalk = sectionRows(decisionLog, /^编号对照$/);
  const decisions = sectionRows(decisionLog, /^决定索引$/);
  const groupRanges = crosswalk.flatMap(({ cells, line }) => {
    const group = /^AC-P(\d+)(?:[–—～]AC-P(\d+))?$/.exec(cells[1] ?? '');
    return group && cells[2] === '包级验收组' ? [{ first: +group[1], last: +(group[2] ?? group[1]), line }] : [];
  });
  // The crosswalk is the only place a human 「决定 n」 becomes a machine D id.
  const decisionId = token => {
    if (/^D-\d+$/.test(token)) return token;
    const human = /^决定\s*(\d+)$/.exec(token);
    if (!human) return null;
    const number = +human[1];
    const hits = crosswalk.flatMap(({ cells }) => {
      const humanRange = /^决定 (\d+)(?:[–—～](\d+))?$/.exec(cells[0] ?? '');
      const machineRange = /^D-(\d+)(?:[–—～]D-(\d+))?$/.exec(cells[1] ?? '');
      if (!humanRange || !machineRange) return [];
      const first = +humanRange[1], last = +(humanRange[2] ?? humanRange[1]);
      if (!(number >= first && number <= last)) return [];
      if (last - first !== +(machineRange[2] ?? machineRange[1]) - +machineRange[1]) return [];
      return [`D-${String(+machineRange[1] + number - first).padStart(machineRange[1].length, '0')}`];
    });
    return hits.length === 1 ? hits[0] : null;
  };
  const trace = specTaskRows(spec).map(row => {
    // Source may cite the decision as D-<n> (machine) or 决定 <n> (human form
    // of the same crosswalk row); both are the template's own numbered ids.
    const cited = [...row.source.matchAll(/\bD-\d+\b/g)].map(match => match[0])
      .concat([...row.source.matchAll(/决定\s*\d+/g)].map(match => decisionId(match[0])).filter(Boolean));
    return { ...row, decisions: [...new Set(cited)] };
  });
  return pkg => {
    const groups = groupRanges.filter(({ first, last }) => first <= pkg.id && pkg.id <= last);
    if (groups.length !== 1) return null;
    const group = groups[0];
    const own = decisions
      .filter(({ cells }) => cells[2] === `包 ${pkg.id}` && /^(?:决定 \d+|D-\d+)$/.test(cells[0] ?? ''))
      .map(({ cells: [decision], line }) => ({ id: decisionId(decision), decision, line }));
    if (!own.length) return { group, problem: `包 ${pkg.id}：包级验收组缺「决定索引」落点行（落点写「包 ${pkg.id}」）；owner=规划作者` };
    const cited = own.filter(entry => entry.id && trace.some(row => row.decisions.includes(entry.id)));
    if (!cited.length) return { group, problem: `包 ${pkg.id}：spec「需求到任务追踪」Source 没有引用本包决定（${own.map(entry => entry.decision).join('、')}；写 D-<n> 或 决定 <n>）；owner=规划作者` };
    if (cited.length > 1) return { group, problem: `包 ${pkg.id}：spec Source 同时引用多个本包决定（${cited.map(entry => entry.id).join('、')}），无法定位唯一 Phase；owner=规划作者` };
    const alias = cited[0];
    const rows = trace.filter(row => row.decisions.includes(alias.id));
    if (rows.some(row => !row.hasFr || !row.acs.length)) return { group, alias, problem: `包 ${pkg.id}：决定 ${alias.id} 的 spec 行缺 FR 或 AC；owner=规划作者` };
    return { group, alias, trace: rows };
  };
}
/**
 * B table: package -> independent Phase -> covered ACs -> dependency/task.
 * A package is coarse-checked against the Phase whose 覆盖 AC carries its
 * `AC-P<n>-*` ids; the terminal aggregator P10 does not stand in for an
 * independent Phase of packages 1-9.
 */
export function reconcilePhaseCoverage({ decisionLog, spec = '', phaseIndex = '', phases = [] } = {}) {
  const packages = readDesignPackages(decisionLog);
  const records = phases.map(entry => typeof entry === 'string' ? phaseRecord(null, entry) : phaseRecord(entry.path, entry.text)).filter(entry => entry.id);
  const rows = [], gaps = [], index = phaseIndexRows(phaseIndex), tracedAcs = new Set();
  const traceFor = packageGroupTraces(decisionLog, spec);
  for (const pkg of packages) {
    const prefix = `AC-P${pkg.id}-`;
    const acs = [...new Set(pkg.acs.filter(ac => ac.startsWith(prefix)).map(acKey))];
    if (!acs.length) {
      const group = traceFor(pkg);
      if (!group) { gaps.push(`包 ${pkg.id}：设计节没有 ${prefix}* 编号，也没有「编号对照」包级验收组声明；owner=规划作者`); continue; }
      if (group.problem) { gaps.push(group.problem); continue; }
      const { alias, trace } = group;
      const target = new Set(trace.map(row => row.phase));
      const owners = records.filter(record => target.has(record.id) && (record.id !== 'P10' || pkg.id === 10));
      if (target.size !== 1 || owners.length !== 1) {
        gaps.push(`包 ${pkg.id}：包级 AC-P${pkg.id} 经 ${alias.id} 未连到唯一独立 Phase；owner=规划作者`);
        continue;
      }
      const owner = owners[0], currentAcs = [...new Set(trace.flatMap(row => row.acs))];
      currentAcs.forEach(ac => tracedAcs.add(ac));
      const missing = currentAcs.filter(ac => !owner.coverage.includes(ac));
      for (const ac of missing) gaps.push(`包 ${pkg.id}：spec 的 ${ac} 不在 ${owner.id} 的覆盖 AC 内；owner=规划作者`);
      const basis = `AC-P${pkg.id} 包级组（decision-log.md#L${group.group.line}），${alias.id} 落包（decision-log.md#L${alias.line}），当前 spec.md#L${trace.map(row => row.line).join('、#L')} → ${owner.path ?? owner.id} 的覆盖 AC；不作逐条等价`;
      rows.push({ package: pkg.id, name: pkg.name, phase: owner.id, acs: currentAcs.join('、'), dependency: owner.dependency || index.find(row => row.id === owner.id)?.dependency || '未取得', task: owner.task || '未取得', gap: missing.length ? '缺当前 AC 覆盖' : '', basis });
      continue;
    }
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
  gaps.push(...phaseIndexGaps(index, records));
  for (const record of records) for (const ac of record.coverage) {
    const id = requirementId(ac);
    if (id === null ? !tracedAcs.has(ac) : !packages.some(pkg => pkg.id === id)) gaps.push(`Phase ${record.id} 的 ${ac} 不属于任何包；owner=规划作者`);
  }
  return { packages, phases: records, rows, gaps };
}
/**
 * C table: the ten design items and the spec/Phase landing for each package.
 * Only rows with a real gap are returned; a complete package writes no row.
 */
// A companion item must carry real content: a placeholder ("待定", "沿决策日志")
// or an empty label is a gap, not a filled item.
const PLACEHOLDER = /^(?:待定|待补|TBD|todo|沿决策日志|见决策日志|同上|无)[。.!！；;]?$/i;
function companionProblems(pkg) {
  const section = pkg.items.get('配套与影响')?.lines.join('\n') ?? '';
  const missing = [], placeholders = [];
  for (const name of COMPANION_ITEMS) {
    const line = section.split('\n').find(value => value.includes(name)) ?? '';
    const body = line.replace(new RegExp(`^[^${name[0]}]*${name}`), '').replace(/^[*\s：:-]+/, '').trim();
    if (!section.includes(name)) missing.push(name);
    else if (!body || (PLACEHOLDER.test(body) && !(['配套迁移', '配套移除'].includes(name) && /^无[。.]?$/.test(body)))) placeholders.push(name);
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
  for (const row of coverage?.rows ?? []) if (row.basis) lines.push(`- 包 ${row.package} 粗查来源：${row.basis}`);
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

// This portable reader only follows exact external locations in fixed dispositions
// under the same authenticated task root as its bound reply index and supplied
// review inputs. An unauthenticated root or unreadable file is a gap, not a read.
function readFixedEvidence(external, review, dispositionsFile, dispositions, files) {
  if (!external?.taskRoot) return;
  const root = external.taskRoot;
  const read = ref => {
    if (ref.split('/').some(part => ['.', '..', ''].includes(part))) return;
    try {
      const file = join(root, ref);
      if (realpathSync(file) === file && statSync(file).isFile()) return readFileSync(file, 'utf8');
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'ELOOP'].includes(error.code)) throw error;
    }
  };
  const belongs = (file, dir) => {
    const ref = relative(root, resolve(file));
    return ref.startsWith(`${dir}/`) && realpathSync(file) === join(root, ref);
  };
  if (read(external.ref) === undefined || !belongs(review, 'quality/reviews') || !belongs(dispositionsFile, 'quality/evidence')) return;
  for (const item of dispositions) {
    if (item.status !== 'fixed') continue;
    for (const ref of evidencePaths(item.location)) {
      if (!ref.startsWith('quality/evidence/') || ref.includes('\\') || files.has(ref)) continue;
      const text = read(ref);
      if (text?.trim()) files.set(ref, text);
    }
  }
}

export async function runCli(argv) {
  try {
    const options = {};
    for (let index = 0; index < argv.length; index += 2) {
      if (!['--decision-log', '--spec', '--task', '--review', '--dispositions', '--reply-index'].includes(argv[index]) || !argv[index + 1] || options[argv[index]]) throw new Error('expected --decision-log <file> [--spec <file>] or --task <task-id> [--review <file> --dispositions <file>]; either mode allows [--reply-index <file>]');
      options[argv[index]] = argv[index + 1];
    }
    const ref = path => relative(process.cwd(), path).split('\\').join('/');
    const replyIndexPath = options['--reply-index'];
    const externalReplies = decisionLog => replyIndexPath ? readExternalReplies(decisionLog, { path: replyIndexPath, bytes: readFileSync(replyIndexPath) }) : null;
    const convergenceFor = async (decisionLog, decisionRef) => {
      const pointers = convergenceRefs(decisionLog);
      if (!pointers.length) return null;
      const convergence = await readConvergenceCards(decisionLog, decisionRef, pointers);
      const packages = readDesignPackages(decisionLog);
      if (packages.length) {
        checkInlineDesign(packages, convergence.cards);
        convergence.inlineDesign = packages;
      }
      return convergence;
    };
    const files = new Map();
    const remember = (path, text) => { files.set(path, text); return text; };
    if (options['--task']) {
      if (options['--decision-log'] || options['--spec']) throw new Error('--task and --decision-log are mutually exclusive');
      const materials = readTaskMaterials(options['--task']);
      for (const phase of materials.phases) remember(phase.path, phase.text);
      remember('spec.md', materials.spec);
      const external = externalReplies(materials.decisionLog);
      const decisionRef = ref(join(materials.base, 'decision-log.md'));
      const convergence = await convergenceFor(materials.decisionLog, decisionRef);
      let coverage, landing;
      if (convergence) {
        const records = materials.phases.map(({ path, text }) => phaseRecord(path, text));
        const ownershipGaps = convergence.inlineDesign
          ? ['旧 B 表的单包单 Phase 规则不适用；只核规格逐行声明的 Phase/Task 与 AC，不推断各包独立交付归属；owner=规划作者', ...currentTraceGaps(materials.spec, records)]
          : convergence.cards.map(({ id }) => `包 ${id}：外置卡到独立 Phase/AC 的承接未核；owner=规划作者`);
        coverage = { gaps: [...ownershipGaps, ...phaseIndexGaps(phaseIndexRows(materials.phaseIndex), records, { exact: true })] };
        landing = { gaps: [convergence.inlineDesign ? '内联十项实质承接到 spec/Phase 未逐项核对；owner=规划作者' : '外置方案卡的内容到 spec/Phase 落点未核；owner=规划作者'] };
      } else {
        coverage = reconcilePhaseCoverage(materials);
        landing = reconcileDesignLanding({ decisionLog: materials.decisionLog, spec: materials.spec, phaseIndex: materials.phaseIndex, phaseCoverage: coverage });
      }
      const baseline = renderBaseline({ decisionLog: materials.decisionLog, spec: materials.spec,
        decisionRef, specRef: ref(join(materials.base, 'spec.md')) }, external, convergence);
      let findings = null;
      if (options['--review'] || options['--dispositions']) {
        if (!options['--review'] || !options['--dispositions']) throw new Error('--review and --dispositions must be supplied together');
        const review = JSON.parse(readFileSync(options['--review'], 'utf8'));
        const dispositions = parseFindingDispositionTable(readFileSync(options['--dispositions'], 'utf8'));
        readFixedEvidence(external, options['--review'], options['--dispositions'], dispositions, files);
        findings = reconcileFindings({ findings: Array.isArray(review.findings) ? review.findings : [], dispositions, files });
      }
      process.stdout.write(baseline + renderProjection({ coverage, landing, findings }));
      return 0;
    }
    if (!options['--decision-log']) throw new Error('--decision-log or --task is required');
    const decisionLog = readFileSync(options['--decision-log'], 'utf8');
    const decisionRef = ref(options['--decision-log']);
    process.stdout.write(renderBaseline({ decisionLog, spec: options['--spec'] ? readFileSync(options['--spec'], 'utf8') : '',
      decisionRef, specRef: options['--spec'] ? ref(options['--spec']) : 'spec.md' }, externalReplies(decisionLog), await convergenceFor(decisionLog, decisionRef)));
    return 0;
  } catch (error) { console.error(error.message); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2)).then(code => { process.exitCode = code; });
}
