#!/usr/bin/env node
// 机械检查一张十一格卡：先看结构（真表格行，而不是散落的关键词），
// 再看卡末声明的角色原件与包级答复是否仍与当前卡版本对得上。
// 机器只判形状与绑定：够不够轻、方案成不成立、审查者是否真的独立，归人读。
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const CARD_ROWS = [
  '一句话结果',
  '对应需求',
  '现状缺口',
  '方案与取舍',
  '边界',
  '数据与状态',
  '验收',
  '风险与回退',
  '未决',
  '白话复述',
  '配套与影响',
];
export const SUPPORT_ITEMS = ['配套调整', '配套迁移', '配套移除', '影响范围'];
// 验收四件：通过条件、失败条件、至少一个反例、证据。四项都要有真内容，写「无」不算。
export const ACCEPTANCE_ITEMS = ['通过', '失败', '反例', '证据'];
export const MODALITIES = ['允许', '要求', '建议', '拒绝'];
export const IDENTITIES = ['用户答复', '作者推断'];
export const MACHINE_HEADING = '## 卡末';
export const ROLE_ORIGINALS = ['调研原件', '设计原件', '冷读原件', '对抗原件'];
const REVIEW_ORIGINALS = ['冷读原件', '对抗原件'];
const ROLE_KEYS = ['包号', '设计者', '审查者', 'source_id', 'modality', '来源身份', '答复原件', '答复原文', '选项与风险', ...ROLE_ORIGINALS];
const INTERNAL_ID = /(?:^|[^A-Za-z0-9])(?:AC-[A-Z]*\d+|[RPUDG]-\d{2,3})(?![0-9])/;
const EMPTY_VALUE = /^(?:无|没有|空|缺|无。|none|n\/a|na|—|-|未知|unknown)$/i;
// 占位词：写了等于没写，不能当验收内容。
const PLACEHOLDER = /^(?:TODO|TBD|FIXME|XXX|PLACEHOLDER|todo|tbd|pending|待补|待补全|待定|暂无|占位|占位符|待填|待写|待确认|稍后|以后|后续再补)/i;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** 卡正文与卡末机器段分开；卡版本只算正文，避免把绑定行算进被审字节。 */
export function splitCard(text) {
  const matches = [...text.matchAll(/^## 卡末.*$/gm)];
  if (matches.length === 0) return { body: text, machine: '', trailing: true };
  const last = matches[matches.length - 1];
  const machine = text.slice(last.index);
  const afterHeading = machine.split('\n').slice(1).join('\n');
  return { body: text.slice(0, last.index), machine, trailing: !/^## /m.test(afterHeading) };
}

/** 卡版本：卡末之前的正文，尾部空白压成一个换行。这样追加卡末不改版本，改正文才改。 */
export function cardVersion(text) {
  return sha256(`${splitCard(text).body.replace(/[ \t\r\n]+$/u, "")}\n`);
}

/** 取真实表格行：第一格必须就是格名，散落在正文里的同词不算。 */
function rowValues(text) {
  const values = new Map();
  for (const name of CARD_ROWS) {
    const escaped = escapeRegExp(name);
    const match = text.match(new RegExp(`^\\|\\s*${escaped}\\s*\\|(.*)\\|\\s*$`, 'm'));
    if (match) values.set(name, match[1].trim());
  }
  return values;
}

/** 一个文件算不算卡：有「| 格 |」表头、有卡末、或能认出至少六个必填格。 */
export function isCardText(text) {
  const { body, machine } = splitCard(text);
  if (machine) return true;
  if (/^\|\s*格\s*\|/m.test(text)) return true;
  return rowValues(body).size >= 6;
}

function acceptanceConflict(cell) {
  const clauses = cell.split(/[。；;]/).filter((clause) => clause.includes('通过') && clause.includes('失败'));
  return clauses.some((clause) => !clause.includes('反例'));
}

/** 取标签值：`失败条件：xxx` 或 `失败：xxx` 里冒号之后到句末的部分。 */
function labelPattern(name) {
  // 「反例：」「反例一：」「反例1：」都算显式标签
  return `${escapeRegExp(name)}(?:[一二三四五六七八九十]|\\d+)?`;
}

function labeledValue(cell, names) {
  for (const name of names) {
    const match = cell.match(new RegExp(`${labelPattern(name)}\\s*[：:]\\s*([^。；;\\n]*)`));
    if (match) return { present: true, value: match[1].trim() };
  }
  return { present: false, value: '' };
}

function meaningful(text, min = 4) {
  if (typeof text !== 'string') return false;
  if (!text.replace(/\s/g, '')) return false;
  if (/^[\p{P}\p{S}\s]+$/u.test(text)) return false;
  const cleaned = text.replace(/[，,、。；;：:（）()\s]/g, '');
  if (!cleaned) return false;
  if (cleaned.length < min) return false;
  if (EMPTY_VALUE.test(cleaned)) return false;
  if (PLACEHOLDER.test(cleaned)) return false;
  return true;
}

/**
 * 验收四件：通过条件、失败条件、至少一个反例、证据。
 * 用了标签写法（「通过条件：」「失败条件：」这种冒号标签）就四项各自成条，
 * 失败条件不能只写在反例句里；不用标签的整句式按每句实际内容判。
 */
export function acceptanceProblems(cell) {
  const clauses = cell.split(/[。；;\n]/).map((clause) => clause.trim()).filter(Boolean);
  const problems = [];
  const labeledMode = /(?:通过条件|失败条件|通过|失败)(?:[一二三四五六七八九十]|\d+)?\s*[：:]/.test(cell);
  if (labeledMode) {
    const labels = {
      通过: ['通过条件', '通过'],
      失败: ['失败条件', '失败'],
      反例: ['反例'],
      证据: ['证据'],
    };
    for (const item of ACCEPTANCE_ITEMS) {
      const found = labeledValue(cell, labels[item]);
      if (!found.present) problems.push({ item, kind: 'missing' });
      else if (!meaningful(found.value, 2)) problems.push({ item, kind: 'empty' });
    }
    const failure = labeledValue(cell, labels['失败']);
    const counter = labeledValue(cell, labels['反例']);
    if (failure.present && counter.present && failure.value === counter.value) {
      problems.push({ item: '失败', kind: 'only-in-counterexample' });
    }
    return problems;
  }
  for (const item of ACCEPTANCE_ITEMS) {
    const hits = clauses.filter((clause) => clause.includes(item));
    if (hits.length === 0) {
      problems.push({ item, kind: 'missing' });
      continue;
    }
    const filled = hits.some((clause) => meaningful(clause.replace(new RegExp(`${escapeRegExp(item)}\\s*[：:]?`, 'g'), ''), 4));
    if (!filled) problems.push({ item, kind: 'empty' });
  }
  return problems;
}

function parseMachine(machine) {
  const fields = new Map();
  for (const line of machine.split('\n')) {
    const match = line.match(/^\s*-\s*([^：:]+)[：:]\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    if (ROLE_KEYS.includes(key) && !fields.has(key)) fields.set(key, match[2].trim());
  }
  return fields;
}

/** 一条原件行：路径；sha256=…；可带 调用=…、包=…。 */
function parseSource(raw) {
  const parts = String(raw ?? '').split(/[；;]/).map((part) => part.trim()).filter(Boolean);
  const source = { path: null, sha256: null, call: null, pack: null };
  for (const part of parts) {
    const kv = part.match(/^(sha256|调用|包)\s*[=＝]\s*(.+)$/);
    if (kv) {
      if (kv[1] === 'sha256') source.sha256 = kv[2].trim().toLowerCase();
      if (kv[1] === '调用') source.call = kv[2].trim();
      if (kv[1] === '包') source.pack = kv[2].trim();
      continue;
    }
    if (!source.path && !part.startsWith('「')) source.path = part.replace(/^`|`$/g, '');
  }
  return source;
}

function readText(absolute) {
  try {
    return fs.readFileSync(absolute, 'utf8');
  } catch {
    return null;
  }
}

function resolveFrom(baseDir, target) {
  return path.isAbsolute(target) ? target : path.resolve(baseDir, target);
}

function numberedLines(text) {
  // 角色原件用「1. 问题」或「## 1. 问题」两种写法都算答过这一问。
  return new Set([...text.matchAll(/^\s*(?:#{1,6}\s*)?(\d{1,2})[.、)）]\s+\S/gm)].map((match) => Number(match[1])));
}

function machineValue(text, key) {
  const match = text.match(new RegExp(`^\\s*-?\\s*${escapeRegExp(key)}\\s*[：:]\\s*(.+)$`, 'm'));
  return match ? match[1].replace(/^`|`$/g, '').trim() : null;
}

/** 调用标识按完整令牌匹配，不做子串命中。 */
function containsToken(text, token) {
  return new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(token)}(?![A-Za-z0-9_])`).test(text);
}

/**
 * @param {{cardPath: string, bind?: boolean, packageDir?: string}} options
 * @returns {{file:string, ok:boolean, missing:string[], fourMissing:string[],
 *   acceptMissing:string[], acceptEmpty:string[], reasons:string[], gaps:string[],
 *   cardVersion:string, answer:{source_id:string|null, pack:string|null, path:string|null}}}
 */
export function validateCard({ cardPath, bind = false, packageDir = null } = {}) {
  const file = path.resolve(cardPath);
  const text = fs.readFileSync(file, 'utf8');
  const { body, machine, trailing } = splitCard(text);
  const values = rowValues(body);
  const reasons = [];
  const gaps = [];

  const missing = CARD_ROWS.filter((name) => !values.has(name));
  const fourMissing = SUPPORT_ITEMS.filter((item) => !(values.get('配套与影响') ?? '').includes(item));
  const acceptanceCell = values.get('验收') ?? '';
  const problems = values.has('验收') ? acceptanceProblems(acceptanceCell) : [];
  const acceptMissing = values.has('验收') ? problems.filter((p) => p.kind === 'missing').map((p) => p.item) : [...ACCEPTANCE_ITEMS];
  const acceptEmpty = problems.filter((p) => p.kind === 'empty').map((p) => p.item);

  for (const name of missing) reasons.push(`缺格：${name}`);
  for (const item of fourMissing) reasons.push(`配套与影响缺项：${item}`);
  for (const item of acceptMissing) reasons.push(`验收缺项：${item}`);
  for (const item of acceptEmpty) reasons.push(`验收写空：${item}（写「无」或没有实际内容不算有验收）`);
  for (const problem of problems.filter((entry) => entry.kind === 'only-in-counterexample')) {
    reasons.push(`失败条件只写在反例句里：${problem.item} 要单独成条，不能只出现在反例里`);
  }
  if (values.has('验收') && acceptanceConflict(acceptanceCell)) {
    reasons.push('验收同一段并存通过与失败判词：把通过条件、失败条件和反例拆开写');
  }
  const plain = values.get('白话复述');
  if (plain !== undefined && INTERNAL_ID.test(plain)) {
    reasons.push('白话复述含未解释的内部编号：改成大白话，编号留在对应需求/验收格');
  }

  const baseDir = packageDir ? path.resolve(packageDir) : path.dirname(file);
  const fields = parseMachine(machine);
  const answer = { source_id: fields.get('source_id') ?? null, pack: fields.get('包号') ?? null, path: null };

  if (bind) {
    for (const match of body.matchAll(/`<[^<>]+>`/g)) {
      reasons.push(`未填占位：${match[0]}`);
      break;
    }
    if (!machine) reasons.push('缺卡末机器段：角色原件与答复绑定无处声明');
    else if (!trailing) reasons.push('卡末不是末尾段：卡末之后还有正文段，绑定会被算错');
    for (const key of ['包号', '设计者', '审查者', ...ROLE_ORIGINALS]) {
      if (!fields.has(key)) reasons.push(`缺机器字段：${key}`);
    }
    if (fields.has('设计者') && fields.has('审查者') && fields.get('设计者') === fields.get('审查者')) {
      reasons.push(`审查者与卡作者同一身份：${fields.get('设计者')}`);
    }
    const version = cardVersion(text);
    const seenPaths = new Map();

    for (const key of ROLE_ORIGINALS) {
      const raw = fields.get(key);
      if (!raw) continue;
      const source = parseSource(raw);
      if (!source.path) {
        gaps.push(`缺原件：${key}（没有可读路径）`);
        continue;
      }
      const absolute = resolveFrom(baseDir, source.path);
      if (seenPaths.has(absolute)) {
        gaps.push(`角色原件重复：${key} 与 ${seenPaths.get(absolute)} 指向同一份文件`);
      } else {
        seenPaths.set(absolute, key);
      }
      const content = readText(absolute);
      if (content === null) {
        gaps.push(`缺原件：${key}（${source.path} 不可读）`);
        continue;
      }
      if (source.sha256 && sha256(fs.readFileSync(absolute)) !== source.sha256) {
        gaps.push(`sha256 不匹配：${key}`);
        continue;
      }
      if (!source.sha256) gaps.push(`缺 sha256：${key}`);
      if (!source.call) {
        gaps.push(`缺调用标识：${key}（写 调用=<子代理名>@<派发时间>）`);
      } else {
        const agent = machineValue(content, 'agent');
        const dispatched = machineValue(content, 'dispatched_at');
        if (!agent || !dispatched) gaps.push(`原件没写派发来源：${key}（缺 agent 或 dispatched_at）`);
        else if (`${agent}@${dispatched}` !== source.call) gaps.push(`调用标识不符：${key}（卡写 ${source.call}，原件是 ${agent}@${dispatched}）`);
        if (dispatched) {
          const stamp = Date.parse(dispatched);
          const written = fs.statSync(absolute).mtimeMs;
          if (Number.isNaN(stamp)) reasons.push(`派发时间不可解析：${key}（${dispatched}）`);
          else if (stamp > Date.now()) reasons.push(`派发时间在未来：${key}（${dispatched}）`);
          else if (stamp > written + 1000) {
            reasons.push(`派发时间晚于原件写盘：${key}（声明 ${dispatched}，文件 mtime ${new Date(written).toISOString()}）`);
          }
        }
      }
      if (key === '设计原件' && machineValue(content, 'designer') !== fields.get('设计者')) {
        gaps.push(`设计者身份不符：${key}`);
      }
      if (REVIEW_ORIGINALS.includes(key)) {
        const reviewer = machineValue(content, 'reviewer');
        if (reviewer !== fields.get('审查者')) gaps.push(`审查者身份不符：${key}`);
        const reviewed = machineValue(content, 'reviewed_card_sha256');
        if (reviewed !== version) gaps.push(`卡版本不匹配：${key}（审过的卡与当前卡正文不同）`);
        const expected = key === '冷读原件' ? 6 : 9;
        const seen = numberedLines(content);
        for (let index = 1; index <= expected; index += 1) {
          if (!seen.has(index)) reasons.push(`${key}缺第 ${index} 问`);
        }
        if (!/结论/.test(content)) reasons.push(`${key}缺结论`);
      }
    }

    const modality = fields.get('modality') ?? null;
    const identity = fields.get('来源身份') ?? null;
    if (modality !== null && !MODALITIES.includes(modality)) {
      gaps.push(`答复语气不合法：${modality}（只能是 ${MODALITIES.join('/')}）`);
    }
    if (identity !== null && !IDENTITIES.includes(identity)) {
      gaps.push(`来源身份不合法：${identity}（只能是 ${IDENTITIES.join('/')}）`);
    }
    const citesUserAnswer = identity === '用户答复' || (fields.has('source_id') && fields.get('source_id') !== '未分配');
    const answerRaw = fields.get('答复原件');
    if (!answerRaw) {
      if (citesUserAnswer) gaps.push('缺答复原件：卡把用户答复当来源，却没有可读的答复原件');
    } else {
      const source = parseSource(answerRaw);
      answer.path = source.path;
      const absolute = resolveFrom(baseDir, source.path);
      if (seenPaths.has(absolute)) gaps.push(`答复原件与角色原件同一份文件：${seenPaths.get(absolute)}`);
      const content = readText(absolute);
      if (content === null) {
        gaps.push(`缺答复原件：${source.path} 不可读`);
      } else {
        if (source.sha256 && sha256(fs.readFileSync(absolute)) !== source.sha256) gaps.push('答复原件 sha256 不匹配');
        if (!source.sha256) gaps.push('答复原件缺 sha256');
        if (!source.call) gaps.push('答复原件缺调用来源（调用=…）');
        else if (!containsToken(content, source.call)) gaps.push(`调用来源不在答复原件中：${source.call}`);
        if (source.pack && fields.get('包号') && source.pack !== fields.get('包号')) {
          gaps.push(`答复包号不匹配：${source.pack} ≠ ${fields.get('包号')}`);
        }
        const quoted = fields.get('答复原文') ?? '';
        const quote = (quoted.match(/「([^」]+)」/) ?? [])[1] ?? quoted;
        if (!quote) gaps.push('缺答复原文：卡没有逐字引用用户原话');
        else if (!content.includes(quote)) gaps.push('答复原文不在原件中：引用的不是这份答复的话');
        if (!fields.has('modality') || !fields.has('来源身份')) gaps.push('缺答复语气或来源身份');
        if (!fields.has('选项与风险')) gaps.push('缺选项与风险：没有写当时给用户看过的选项和代价');
      }
    }
  }

  const ok = reasons.length === 0 && gaps.length === 0;
  return { file, ok, missing, fourMissing, acceptMissing, acceptEmpty, reasons, gaps, cardVersion: cardVersion(text), answer };
}

function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const bind = argv.includes('--bind');
  const wantVersion = argv.includes('--version');
  const packageIndex = argv.indexOf('--package');
  if (packageIndex >= 0 && (argv[packageIndex + 1] === undefined || argv[packageIndex + 1].startsWith('--'))) {
    console.error('usage: node validate-card.mjs <card.md> [--json] [--bind] [--package <dir>] [--version]');
    process.exit(2);
  }
  const packageDir = packageIndex >= 0 ? argv[packageIndex + 1] : null;
  const cardPath = argv.find((arg, index) => !arg.startsWith('--') && (packageIndex < 0 || index !== packageIndex + 1));
  if (!cardPath) {
    console.error('usage: node validate-card.mjs <card.md> [--json] [--bind] [--package <dir>] [--version]');
    process.exit(2);
  }
  let text;
  try {
    text = fs.readFileSync(cardPath, 'utf8');
  } catch (error) {
    console.error(`fail: ${cardPath}: 卡不可读：${error.message}`);
    process.exit(2);
  }
  if (wantVersion) {
    console.log(cardVersion(text));
    process.exit(0);
  }
  let result;
  try {
    result = validateCard({ cardPath, bind, packageDir });
  } catch (error) {
    console.error(`fail: ${cardPath}: ${error.message}`);
    process.exit(2);
  }
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`ok: ${result.file}（卡版本 ${result.cardVersion.slice(0, 12)}）`);
  } else {
    console.error(`fail: ${result.file}`);
    for (const line of [...result.reasons, ...result.gaps]) console.error(`- ${line}`);
  }
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
