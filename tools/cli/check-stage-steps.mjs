#!/usr/bin/env node
import { WORKFLOW_STAGES } from '../../runtime/stage/stage-registry.mjs';
// Report-only consumer of the existing final-chain evidence producer.
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';
import { openTask } from '../../runtime/task/task-handle.mjs';
import { execFileSync } from 'node:child_process';
import { phaseFilesFromIndex } from '../../runtime/task/material-workspace.mjs';
import { phaseTaskCards } from '../../runtime/stage/stage-content-contracts.mjs';

// Step definitions belong to the installed workflowhub package, never to the
// project being checked. Walk up from this file so nested install layouts also
// work; the historical two-levels-up layout stays as the last resort.
function installedWorkflowRoot(start) {
  for (let current = resolve(start); ; current = dirname(current)) {
    if (existsSync(join(current, 'workflows'))) return current;
    if (dirname(current) === current) return resolve(start, '../..');
  }
}
const repository = installedWorkflowRoot(dirname(fileURLToPath(import.meta.url)));
const stages = WORKFLOW_STAGES;
const MAPPING_HEADING = /旧编号对照|编号对照/;
// Package headings are written as WPn in archived material and as Chinese
// numbering (工作包 N / ①-⑳ / 一-十, optionally in full-width brackets) now.
// Only the heading form expands here; module counts and gap rules stay put.
const PACKAGE_NUMBER_SOURCE = '(?:[0-9]+|[①-⑳]|[一二三四五六七八九十])';
const PACKAGE_HEADING = new RegExp(`^(?:#{1,6}\\s+|\\*\\*)(?:WP-?(\\d+)\\s*[—–-]|工作包\\s*(?:[（(]\\s*(${PACKAGE_NUMBER_SOURCE})\\s*[）)]|(${PACKAGE_NUMBER_SOURCE}))\\s*(?:[—–\\-:：]|$))`);
const CIRCLED_PACKAGE_NUMBERS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
const CHINESE_PACKAGE_NUMBERS = Object.freeze({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 });
const packageNumber = token => {
  if (/^[0-9]+$/.test(token)) return String(Number(token));
  const circled = CIRCLED_PACKAGE_NUMBERS.indexOf(token);
  if (circled >= 0) return String(circled + 1);
  return CHINESE_PACKAGE_NUMBERS[token] ? String(CHINESE_PACKAGE_NUMBERS[token]) : null;
};
function legacyIdMappings(markdown) {
  const mappings = new Map();
  let inSection = false, level = 0, fence = false;
  const labelSource = /^(?:决定|工作包|变更|用户答复|任务|需求|验收|未决|风险)\s*\d+$/;
  const legacySource = /^(?:ADR-\d+|D-\d+|U-\d+|WP-?\d+|T\d{3,}|R-\d{3}[a-z]*|AC-[A-Z0-9-]+|OI-\d+|RISK-\d+|OPEN-\d+|UC-\d+)$/;
  for (const line of String(markdown ?? "").split("\n")) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      if (inSection && heading[1].length <= level) inSection = false;
      if (!inSection && MAPPING_HEADING.test(heading[2])) { inSection = true; level = heading[1].length; }
      continue;
    }
    if (!inSection) continue;
    let label = null, legacy = null;
    if (/^\s*\|/.test(line)) {
      const row = line.trim().replace(/^\||\|$/g, "").split("|").map(value => value.replace(/\*\*|`/g, "").trim());
      label = row.find(value => labelSource.test(value)) ?? null;
      legacy = row.find(value => legacySource.test(value)) ?? null;
    }
    if (!label || !legacy) {
      const l = /(?:决定|工作包|变更|用户答复|任务|需求|验收|未决|风险)\s*(\d+)/.exec(line);
      const g = /(?:ADR-\d+|D-\d+|U-\d+|WP-?\d+|T\d{3,}|R-\d{3}[a-z]*|AC-[A-Z0-9-]+|OI-\d+|RISK-\d+|OPEN-\d+|UC-\d+)/.exec(line);
      if (l && g) { label = l[0].replace(/\s+/g, " "); legacy = g[0]; }
    }
    if (label && legacy) mappings.set(label.replace(/\s+/g, " "), legacy);
  }
  return mappings;
}
// The evidence producer reads step definitions from the installed workflowhub
// package, or from the explicit --repo-root this checker passes through. When
// that root has no workflows/<stage> it cannot define any step, so an empty
// judgement means "definition unreadable", not "not done".
export function producerDefinitionError(limits, name) {
  const prefix = `workflows/${name}/steps.json: `;
  const limit = (Array.isArray(limits) ? limits : []).find(value => typeof value === 'string' && value.startsWith(prefix));
  return limit ? limit.slice(prefix.length) : null;
}
// Steps now declare the original artifact they leave behind (decision-log
// section, task original, review record, handoff, ...) instead of the never
// written facts row. A declaration turns green only when that original is
// readable and non-empty; a self-description alone leaves the step red.
const FACTS_EVIDENCE = value => value === 'facts.jsonl' || value === './facts.jsonl';
const inside = (root, path) => {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel);
};
// One heading exactly (fenced examples are ignored) and a non-empty body.
function sectionAfterHeading(raw, anchor) {
  const lines = String(raw ?? '').split(/\r?\n/);
  let fence = null, found = null;
  for (let index = 0; index < lines.length; index += 1) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(lines[index]);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[index]);
    if (!heading) continue;
    const title = heading[2].replace(/\s+#+$/, '').trim();
    const suffix = title === anchor ? '' : title.startsWith(anchor) ? title.slice(anchor.length) : null;
    if (suffix === null || (suffix !== '' && !/^[：:—–\-？?，,（(\s]/.test(suffix))) continue;
    if (/历史|旧方向|归档/.test(suffix)) continue;
    if (found) return null;
    found = { index, level: heading[1].length };
  }
  if (!found) return null;
  let end = found.index + 1;
  while (end < lines.length && !new RegExp(`^#{1,${found.level}}\\s`).test(lines[end])) end += 1;
  return lines.slice(found.index + 1, end).join('\n').trim() || null;
}
function directoryHasEvidence(path, depth = 3) {
  let entries;
  try { entries = readdirSync(path, { withFileTypes: true }); }
  catch { return false; }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const child = join(path, entry.name);
    if (entry.isFile()) {
      try { if (statSync(child).size > 0) return true; } catch { /* unreadable is not evidence */ }
    } else if (entry.isDirectory() && depth > 1 && directoryHasEvidence(child, depth - 1)) return true;
  }
  return false;
}
function evidenceRootFor(ref, taskPath, materialRoot) {
  if (/^(?:quality\/|facts\.jsonl$|main-agent-cost\.md$)/.test(ref)) return { label: '任务', root: taskPath };
  return { label: '材料', root: materialRoot };
}
// Read existing original identity fields; the completion verdict remains with
// final-chain. Markdown proof and JSON proof must establish the same identity.
function executionOriginalFields(body, ref) {
  try {
    const value = JSON.parse(body);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('身份原件不是对象');
    return value;
  } catch (error) {
    if (ref.endsWith('.json')) throw Error(`身份原件不是有效 JSON：${error.message}`);
    const allowed = new Set(['task_id', 'source', 'step_slug', 'phase', 'phase_id', 'commit', 'run_id', 'created_at', 'conclusion']);
    const value = {};
    for (const line of body.split(/\r?\n/)) {
      const match = /^([A-Za-z_]+)\s*[:：]\s*(.+)$/.exec(line);
      if (!match || !allowed.has(match[1])) continue;
      const field = match[1], current = match[2].trim();
      if (value[field] !== undefined && value[field] !== current) throw Error(`原件 ${field} 身份冲突`);
      value[field] = current;
    }
    return value;
  }
}

function readDeclaredEvidence(entry, { taskPath, materialRoot, shared = false, identity = {}, namedOnly = false, taskId, source, stepSlug } = {}) {
  const kind = typeof entry?.kind === 'string' ? entry.kind : null;
  const raw = typeof entry?.uri_or_path === 'string' ? entry.uri_or_path.trim() : '';
  const sharedNote = shared ? '；同 stage 多步共用，通用留痕不归本步' : '';
  if (!raw) return { kind, ref: raw, present: false, reason: 'evidence 条目缺 uri_or_path' };
  if (kind === 'task_original_ref') return { kind, ref: raw, present: false, reason: '现有 facts 的本步具名原件 ref 未取得；逻辑槽不是固定物理文件名' };
  if (FACTS_EVIDENCE(raw)) return { kind: kind ?? 'phase_task_facts', ref: raw, present: null, reason: 'facts 补充通道' };
  const hashAt = raw.indexOf('#');
  const ref = hashAt >= 0 ? raw.slice(0, hashAt) : raw;
  const anchor = hashAt >= 0 ? raw.slice(hashAt + 1).trim() : '';
  if (!ref || isAbsolute(ref) || ref.includes('\0') || ref.includes('\\') || ref.split('/').some(part => !part || part === '..' || part === '.')) {
    // A trailing slash is a historical directory declaration, not a named
    // current original. Preserve its navigation meaning below.
    if (!(ref.endsWith('/') && !isAbsolute(ref) && !ref.includes('\0') && !ref.includes('\\') && ref.slice(0, -1).split('/').every(part => part && part !== '..' && part !== '.'))) {
    return { kind, ref: raw, present: false, reason: '原件路径越界或为空' };
    }
  }
  const { label, root } = evidenceRootFor(ref, taskPath, materialRoot);
  if (typeof root !== 'string' || !root) return { kind, ref: raw, present: false, reason: `${label}根未取得，无法回读原件` };
  const named = resolve(root, ref);
  // Check each component before opening it, so an ancestor symlink cannot
  // cause a metadata probe outside the authenticated source root.
  let cursor = root;
  for (const component of ref.split('/').filter(Boolean)) {
    cursor = join(cursor, component);
    try { if (lstatSync(cursor).isSymbolicLink()) return { kind, ref: raw, present: false, reason: '原件路径含符号链接，可能越界' }; }
    catch (error) { return { kind, ref: raw, present: false, reason: `原件不可读：${error.message}` }; }
  }
  try { if (lstatSync(named).isSymbolicLink()) return { kind, ref: raw, present: false, reason: '原件是符号链接' }; }
  catch { return { kind, ref: raw, present: false, reason: `原件不存在：${ref}` }; }
  let path;
  try {
    const realRoot = realpathSync(root), realPath = realpathSync(named);
    if (!inside(realRoot, realPath)) return { kind, ref: raw, present: false, reason: `原件越出${label}根：${ref}` };
    path = realPath;
  } catch (error) { return { kind, ref: raw, present: false, reason: `原件不可读：${error.message}` }; }
  let stat;
  try { stat = statSync(path); }
  catch (error) { return { kind, ref: raw, present: false, reason: `原件不可读：${error.message}` }; }
  if (stat.isDirectory()) {
    if (anchor) return { kind, ref: raw, present: false, reason: '目录不能带节锚点' };
    if (namedOnly || Object.keys(identity).length) return { kind, ref: raw, present: false, reason: '目录仅作导航；本步具名当前原件未取得' };
    const present = directoryHasEvidence(path);
    return { kind, ref: raw, present, reason: present ? '目录内有非空原件' + sharedNote : '目录内没有非空原件' };
  }
  if (!stat.isFile()) return { kind, ref: raw, present: false, reason: '原件不是普通文件' };
  let body;
  try { body = readFileSync(path, 'utf8'); }
  catch (error) { return { kind, ref: raw, present: false, reason: `原件不可读：${error.message}` }; }
  // A section anchor or prose extension cannot bypass execution identity.
  if (label === '任务' && Object.keys(identity).length) {
      let original;
      try { original = executionOriginalFields(body, ref); }
      catch (error) { return { kind, ref: raw, present: false, reason: error.message }; }
      if (original.task_id !== undefined && original.task_id !== taskId) return { kind, ref: raw, present: false, reason: '原件属于另一任务' };
      if (original.source !== undefined && source && original.source !== source || original.step_slug !== undefined && stepSlug && original.step_slug !== stepSlug) return { kind, ref: raw, present: false, reason: '原件属于另一步骤' };
      for (const [key, expected] of Object.entries(identity)) {
        const actual = key === 'phase' ? original.phase ?? original.phase_id : original[key];
        if (actual !== expected) return { kind, ref: raw, present: false,
          reason: `${key}=${actual ?? '未取得'}，当前为 ${expected}；旧或缺身份原件不算当前证据` };
      }
  }
  if (!anchor) {
    const present = body.trim().length > 0;
    return { kind, ref: raw, present, reason: present ? '文件非空' + sharedNote : '文件为空' };
  }
  const section = sectionAfterHeading(body, anchor);
  return { kind, ref: raw, present: Boolean(section), reason: section ? `节「${anchor}」非空${sharedNote}` : `节「${anchor}」不存在或为空` };
}
// A direction change records which steps this supersede invalidated and must be
// re-done. Every current line counts; slugs and 1-based step numbers are both
// accepted. Deleting the line is a material-history responsibility boundary,
// not a machine fact this report can reconstruct.
function invalidatedSteps(markdown) {
  const records = [];
  let fence = null;
  for (const line of String(markdown ?? '').split(/\r?\n/)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    const match = /失效步骤\s*[:：]\s*([^\n]*)/.exec(line);
    if (!match) continue;
    // The first separator ends the step list; the rest may name the stage.
    const parts = match[1].split(/[；;]/);
    const idsPart = parts.shift();
    const rest = parts.join('；');
    const rawScope = rest.match(/(?:阶段|stage|重做范围)\s*[:：]\s*([^\s；;，,、]+)/i)?.[1]?.replace(/[`*]/g, '').trim() ?? null;
    const scope = rawScope && stages.includes(rawScope) ? rawScope : null;
    const slugs = new Set(), ranges = [];
    for (const token of idsPart.split(/[、，,\s]+/)) {
      const clean = token.replace(/[`*]/g, '').trim();
      if (!clean) continue;
      if (/^[a-z][a-z0-9-]*$/.test(clean)) { slugs.add(clean); continue; }
      if (/^\d+$/.test(clean)) { slugs.add(String(Number(clean))); continue; }
      const range = /^(\d+)\s*[～~-]\s*(\d+)$/.exec(clean);
      if (!range) continue;
      const start = Number(range[1]), end = Number(range[2]);
      if (Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 1 && end >= start) ranges.push({ from: start, to: end });
    }
    records.push({ scope, rawScope, slugs, ranges });
  }
  return records;
}
// AC ids use AC-D01 and AC-C06-1 forms. A range endpoint may repeat only the
// numeric suffix. The expansion is bounded by the real AC table row count; an
// unreadable/invalid range is reported invalid instead of being under-counted.
function expandAcRange(start, end, rowLimit) {
  if (!end) return { ids: [start], invalid: false };
  const startMatch = /^(AC-.*?)(\d+)$/.exec(start);
  if (!startMatch) return { ids: [start], invalid: true };
  const prefix = startMatch[1], startDigits = startMatch[2], startNumber = Number(startDigits);
  let endNumber;
  if (/^\d+$/.test(end)) endNumber = Number(end);
  else {
    const fullEnd = /^(AC-.*?)(\d+)$/.exec(end);
    if (fullEnd && fullEnd[1] !== prefix) return { ids: [start], invalid: true };
    const suffixEnd = fullEnd ? null : /^([A-Za-z]+)(\d+)$/.exec(end);
    const endMatch = fullEnd ?? (suffixEnd && `AC-${suffixEnd[1]}` === prefix ? suffixEnd : null);
    if (!endMatch) return { ids: [start], invalid: true };
    endNumber = Number(endMatch[2]);
  }
  if (!Number.isSafeInteger(startNumber) || !Number.isSafeInteger(endNumber)
      || startNumber < 1 || endNumber < startNumber) return { ids: [start], invalid: true };
  const count = endNumber - startNumber + 1;
  if (!Number.isSafeInteger(rowLimit) || rowLimit < 1 || count > rowLimit) return { ids: [start], invalid: true };
  return {
    ids: Array.from({ length: count }, (_, index) => `${prefix}${String(startNumber + index).padStart(startDigits.length, '0')}`),
    invalid: false,
  };
}
const LEVEL_NAMES = Object.freeze({ 轻档: 'small', 小改动: 'small', 普通: 'normal', 复杂: 'complex', 规划: 'planning', small: 'small', normal: 'normal', complex: 'complex', planning: 'planning' });
function outsideFenceLines(raw) {
  const lines = [];
  let fence = null;
  for (const line of String(raw ?? '').split(/\r?\n/)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (!fence) lines.push(line);
  }
  return lines;
}
// The current level authority is the unique 级别与路线 section; the existing
// runtime levelDeclaration/confirm owner supplies declared choices. This helper
// only checks the fence-aware section for conflicts and recommendation lines.
function levelAuthority(decision) {
  const body = sectionAfterHeading(decision, '级别与路线');
  if (!body) return { body: null, choices: [], recommendations: [] };
  const lines = outsideFenceLines(body).filter(line => !/^\s*>/.test(line));
  const choice = /^\s*-?\s*(?:\*\*)?(?:用户选择|真实用户选择|用户已确认级别|确认级别)(?:\*\*)?[:：]\s*(轻档|小改动|普通|复杂|规划|small|normal|complex|planning)/;
  const recommendation = /^\s*-?\s*(?:\*\*)?推荐级别(?:\*\*)?[:：]\s*(轻档|小改动|普通|复杂|规划|small|normal|complex|planning)/;
  const collect = pattern => lines.map(line => ({ line: line.trim(), match: pattern.exec(line) })).filter(item => item.match).map(item => ({ line: item.line, level: LEVEL_NAMES[item.match[1]] }));
  return { body, choices: collect(choice), recommendations: collect(recommendation) };
}
// The producer tags accepted human originals as record_ref. Its diagnostic
// notes also carry refs, but are never completion proofs.
function completedHumanOriginals(row) {
  return (row?.basis ?? []).filter(proof => proof.evidence_level === 'record_ref' && proof.conclusion === 'completed');
}

export function runStageStepsCheck({ taskPath, materialRoot, repoRoot = repository, stage, step: selectedStep, card = false, runId, phase, commit, skipGap = null, inputErrors = [] } = {}) {
  const errors = [];
  errors.push(...inputErrors);
  const executionIdentity = { ...(runId ? { run_id: runId } : {}), ...(phase ? { phase } : {}), ...(commit ? { commit } : {}) };
  let manifest = {}, factRows = [];
  try {
    manifest = JSON.parse(readFileSync(resolve(taskPath, 'task.json'), 'utf8'));
    factRows = readFileSync(resolve(taskPath, 'facts.jsonl'), 'utf8').split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line));
  } catch (error) { errors.push(`当前任务事实不可读：${error.message}`); }
  // Existing facts carry the original ref and its source/step binding. Read
  // that original, rather than copying appendRecord bytes to a fixed name.
  const originalsFor = (name, source, slug) => factRows
    .filter(row => row.task_id === manifest.task_id)
    .flatMap(row => Array.isArray(row.evidence?.value) ? row.evidence.value : [])
    .filter(entry => entry.source === source && entry.step_slug === slug && typeof entry.ref === 'string')
    .map(entry => ({ kind: 'task_original', uri_or_path: entry.ref }));
  let currentIdentityAvailable = true;
  if (card || selectedStep !== undefined) {
    try {
      if (!phase && !commit) throw Error('当前卡身份 unavailable：需要已核当前 Phase 或真实 HEAD；没有现役 run-id 权威');
      const task = openTask(resolve(taskPath), { projectName: manifest.project_name, taskId: manifest.task_id });
      validateSkipIdentity({ materialRoot, phase, commit, runId }, task);
    } catch (error) { currentIdentityAvailable = false; errors.push(error.message); }
  }
  const currentPhase = phase ?? factRows.find(row => row.task_id === manifest.task_id && row.stage === 'build-code')?.phase_progress?.phase_id;
  let phaseRef;
  if (currentPhase && materialRoot) {
    try {
      const index = readFileSync(resolve(materialRoot, 'phases/index.md'), 'utf8');
      phaseRef = [...index.matchAll(/phases\/(P[1-9][0-9]*[^`\s|()[\]]*\.md)/g)]
        .map(match => `phases/${match[1]}`).find(ref => new RegExp(`^phases/${currentPhase}(?:[-.]|$)`).test(ref));
    } catch (error) { errors.push(`当前 Phase 指针不可读：${error.message}`); }
  }
  if ((selectedStep !== undefined || card) && !stage) errors.push('当前卡/按步检查需要显式 --stage');
  if (selectedStep !== undefined && (!Number.isSafeInteger(selectedStep) || selectedStep < 1)) errors.push('--step 必须为正整数');
  const unmatchedInvalidations = [];
  let evidence = [];
  let producerLimits = [];
  let producerLevel = null;
  try {
    // Pass the same explicit root this checker reads: --repo-root keeps its
    // current meaning, and its default is the installed workflowhub package.
    const report = runFinalChainCheck({ taskPath, ...(materialRoot ? { materialRoot } : {}), workflowRoot: resolve(repoRoot) });
    producerLevel = report.level ?? null;
    evidence = report.workflow_steps;
    producerLimits = report.limits ?? [];
    if (!materialRoot) materialRoot = report.material_root;
  }
  catch (error) { errors.push(error.message); }
  // The supersede record lives in the decision log; read it before judging
  // steps so an invalidated step cannot be reported as still evidenced.
  let decision = '';
  try {
    if (typeof materialRoot !== 'string' || !materialRoot) throw Error('材料根未取得');
    decision = readFileSync(resolve(materialRoot, 'decision-log.md'), 'utf8');
  } catch (error) { errors.push(`decision-log.md: ${error.message}`); }
  const invalidated = invalidatedSteps(decision);
  // Route selection uses the existing final-chain level declaration/confirm
  // semantics. The authority section only contributes conflict detection and a
  // single recommendation when no declared choice exists.
  const levelInfo = levelAuthority(decision);
  const declaredLevel = producerLevel?.declared === true ? producerLevel.value : null;
  const choiceLevels = [...new Set(levelInfo.choices.map(item => item.level))];
  const recommendationLevels = [...new Set(levelInfo.recommendations.map(item => item.level))];
  let levelValue = producerLevel?.value ?? null;
  let levelUnjudged = null;
  let levelDisplay = '未读到级别事实，按完整材料检查';
  if (choiceLevels.length > 1) {
    levelUnjudged = `级别与路线存在多个不同用户选择（${choiceLevels.join('、')}）；未判`;
    levelValue = null;
  } else if (declaredLevel && choiceLevels.length === 1 && choiceLevels[0] !== declaredLevel) {
    levelUnjudged = `级别确认（${declaredLevel}）与权威节用户选择（${choiceLevels[0]}）不一致；未判`;
    levelValue = null;
  } else if (declaredLevel && choiceLevels.length === 1) {
    levelValue = declaredLevel;
    levelDisplay = levelInfo.choices.at(-1).line;
  } else {
    // A declaration whose only choice sits in a fence is not trusted.
    if (recommendationLevels.length > 1) {
      levelUnjudged = `级别与路线存在多个不同推荐（${recommendationLevels.join('、')}）；未判`;
      levelValue = null;
    } else if (recommendationLevels.length === 1) {
      levelValue = recommendationLevels[0];
      levelDisplay = levelInfo.recommendations.at(-1).line;
    } else {
      levelValue = (declaredLevel && choiceLevels.length === 0) ? 'complex' : (producerLevel?.value ?? 'complex');
      levelDisplay = '未读到级别事实，按完整材料检查';
    }
  }
  if (!levelValue && !levelUnjudged) levelValue = 'complex';
  if (levelUnjudged) levelDisplay = levelUnjudged;
  const flowSourceFor = name => {
    if (name !== 'make-decision' || !levelValue || levelValue === 'complex') return null;
    try {
      const root = JSON.parse(readFileSync(resolve(repoRoot, `workflows/${name}/steps.json`), 'utf8'));
      const flow = root.flows?.[levelValue];
      const source = typeof flow === 'string' ? flow : flow?.steps;
      return typeof source === 'string' && source.startsWith(`workflows/make-decision/flows/${levelValue}/`) ? source : null;
    } catch { return null; }
  };
  const reports = [];
  for (const name of stages.filter(name => !stage || name === stage)) {
    if (name === 'make-decision' && levelUnjudged) {
      errors.push(`读不到步骤定义：make-decision（${levelUnjudged}）；步骤是否完成未判定，不按「未留痕」报告`);
      reports.push({ stage: name, source: 'workflows/make-decision/steps.json', definition: 'unavailable', definition_error: levelUnjudged, mapping: '未配置', steps: [] });
      continue;
    }
    const source = flowSourceFor(name) ?? `workflows/${name}/steps.json`;
    const manifestPath = resolve(repoRoot, source);
    let definitions;
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.stage_slug !== name || !Array.isArray(manifest.steps) || !manifest.steps.length) throw Error('invalid steps manifest');
      definitions = manifest.steps;
      if (selectedStep !== undefined && stage === name) {
        if (!definitions.some(item => item.step_id === selectedStep)) errors.push(`${name} 不存在步骤 ${selectedStep}`);
        definitions = definitions.filter(item => item.step_id <= selectedStep);
      }
    } catch (error) {
      const detail = `${manifestPath}: ${error.message}`;
      errors.push(`读不到步骤定义：${source}（${detail}）；步骤是否完成未判定，不按「未留痕」报告`);
      reports.push({ stage: name, source, definition: 'unavailable', definition_error: detail, mapping: '未配置', steps: [] });
      continue;
    }
    const applicableInvalidations = invalidated.filter(record => record.scope === name);
    for (const record of applicableInvalidations) {
      for (const token of record.slugs) {
        const numeric = /^\d+$/.test(token);
        const matched = numeric
          ? definitions.some(step => step.step_id === Number(token))
          : definitions.some(step => step.step_slug === token);
        if (!matched) unmatchedInvalidations.push(`${name}:${token}`);
      }
      for (const range of record.ranges) {
        for (let id = range.from; id <= range.to; id += 1) {
          if (!definitions.some(step => step.step_id === id)) unmatchedInvalidations.push(`${name}:${id}（范围 ${range.from}～${range.to}）`);
        }
      }
    }
    // A light-route table that still declares only facts would silently keep
    // the retired channel. Report the definition as unjudged instead.
    if (source !== `workflows/${name}/steps.json`
        && !definitions.some(step => (Array.isArray(step.completion_evidence) ? step.completion_evidence : []).some(entry => !FACTS_EVIDENCE(entry?.uri_or_path)))) {
      const reason = `${source}: 轻档步骤表仍是 facts-only，未承接声明原件；不把根复杂步骤套到轻档，也不沿用旧 facts 通道判完成`;
      errors.push(`读不到步骤定义：${source}（${reason}）；步骤是否完成未判定，不按「未留痕」报告`);
      reports.push({ stage: name, source, definition: 'unavailable', definition_error: reason, mapping: '未配置', steps: [] });
      continue;
    }
    const declaredCounts = new Map();
    for (const step of definitions) for (const entry of (Array.isArray(step.completion_evidence) ? step.completion_evidence : [])) {
      if (!FACTS_EVIDENCE(entry?.uri_or_path)) declaredCounts.set(entry.uri_or_path, (declaredCounts.get(entry.uri_or_path) ?? 0) + 1);
    }
    const producerFailure = producerDefinitionError(producerLimits, name);
    const steps = definitions.map(step => {
      const mapping = /判定消费[：:]\s*([^；;\n]+)[；;]\s*原件[：:]\s*([^。\n]+)/.exec(step.observable_result ?? '');
      const declared = (Array.isArray(step.completion_evidence) ? step.completion_evidence : []).map(entry => entry.uri_or_path === 'phases/{phase}.md'
        ? { ...entry, uri_or_path: phaseRef ?? entry.uri_or_path } : entry);
      const dynamic = originalsFor(name, source, step.step_slug);
      const checks = [...declared.filter(entry => !dynamic.length || entry.kind !== 'task_original_ref'), ...dynamic]
        .filter(entry => !FACTS_EVIDENCE(entry?.uri_or_path))
        .filter((entry, index, all) => all.findIndex(item => item.uri_or_path === entry.uri_or_path) === index)
        .map(entry => readDeclaredEvidence(entry, { taskPath, materialRoot, shared: (declaredCounts.get(entry.uri_or_path) ?? 0) > 1, identity: executionIdentity,
          namedOnly: card || selectedStep !== undefined, taskId: manifest.task_id, source, stepSlug: step.step_slug }));
      const factsDeclared = declared.some(entry => FACTS_EVIDENCE(entry?.uri_or_path));
      const original = checks.find(check => check.present === true) ?? null;
      const declaredPhysical = declared.filter(entry => entry.kind !== 'task_original_ref' && !FACTS_EVIDENCE(entry.uri_or_path));
      const declaredPhysicalMissing = declaredPhysical.length > 0 && !checks.some(check => check.present === true && declaredPhysical.some(entry => entry.uri_or_path === check.ref));
      const identity = { stage: name, step_id: step.step_id, step_slug: step.step_slug, source,
        evidence_location: mapping?.[2] ?? null, consumer: mapping?.[1] ?? null,
        evidence: checks, result: step.observable_result, method_anchor: step.method_anchor ?? '方法', requires_user_reply: step.requires_user_reply === true };
      if (producerFailure) return { ...identity, judgment: '未判定', state: 'unavailable', basis: [],
        gap: `读不到步骤定义：证据生产者未能从材料仓读取 ${source}；本条不是「步骤没做」` };
      const row = evidence.find(row => row.source === source && row.step_slug === step.step_slug);
      const producerState = row?.state;
      // A current trace cannot lend its identity to another original that the
      // producer completed. The very same basis ref must pass current checks.
      const producerCurrent = currentIdentityAvailable && (!Object.keys(executionIdentity).length || completedHumanOriginals(row).some(proof =>
        typeof proof.ref === 'string' && checks.some(check => check.ref === proof.ref && check.present === true)));
      const currentProducerState = producerCurrent ? producerState : 'unavailable';
      const stale = invalidated.some(record => record.scope === name
        && (record.slugs.has(step.step_slug) || record.slugs.has(String(step.step_id))
          || record.ranges.some(range => step.step_id >= range.from && step.step_id <= range.to)));
      if (stale) return { ...identity,
        judgment: '待重做', state: 'incomplete', basis: row?.basis ?? [],
        gap: `方向变更记录把 ${step.step_slug} 列为失效步骤：旧原件和旧 producer 事实都不算最新方向的真实执行；重做后按材料责任更新该行，本报告不建历史谱系` };
      if (!mapping) return { ...identity,
        judgment: '映射未配置', state: producerState ?? 'unavailable', basis: row?.basis ?? [],
        gap: `${source}#${step.step_slug} 缺判定消费/原件标记` };
      // Only the existing final-chain producer can establish completion. A
      // readable artifact is trace, never a completion verdict.
      if (producerState === 'completed' && producerCurrent) return { ...identity,
        judgment: '已完成', state: 'completed', basis: row?.basis ?? [],
        gap: original && !declaredPhysicalMissing ? '' : `既有 producer 判完成；声明原件未取得：${checks.filter(check => check.present !== true).map(check => `${check.ref || '（缺路径）'}（${check.reason}）`).join('；') || '步骤表未声明'}${original ? `；已沿实际 ref 读取 ${original.ref}` : ''}；完成事实来自 producer，不证明本步语义` };
      if (producerState === 'not_applicable' && producerCurrent) return { ...identity,
        judgment: '不适用', state: 'not_applicable', basis: row?.basis ?? [],
        gap: '既有 producer 判不适用；本检查不另作完成判断' };
      const producerGap = (row?.limits ?? []).join('；');
      if (original) return { ...identity,
        judgment: '已留痕', state: 'unavailable', basis: row?.basis ?? [],
        gap: [`原件只证明留痕，不判完成；完成事实需既有 producer 判据${checks.some(check => check.reason.includes('多步共用')) ? '；含同 stage 共用目录/文件，通用留痕不等于本步专属原件' : ''}`, producerGap].filter(Boolean).join('；') };
      const missing = checks.length
        ? `声明的原件不可回读：${checks.map(check => `${check.ref || '（缺路径）'}（${check.reason}）`).join('；')}`
        : '本步未取得可回读声明原件；机检未读到不证明未执行；自述不代原件';
      return { ...identity,
        judgment: '未留痕', state: currentProducerState ?? 'unavailable', basis: row?.basis ?? [],
        gap: `${missing}；facts 补充通道${factsDeclared ? (row ? `未判完成${producerGap ? `（${producerGap}）` : ''}` : '缺行') : '未声明'}` };
    });
    if (producerFailure) errors.push(`读不到步骤定义：${source} 的证据生产者读取失败（${producerFailure}）；留痕状态未判定`);
    reports.push({ stage: name, source, definition: producerFailure ? 'unavailable' : 'available',
      definition_error: producerFailure, mapping: steps.every(row => row.consumer && row.evidence_location) ? '已配置' : '未配置', steps });
  }
  if (stage && !stages.includes(stage)) errors.push(`未知阶段：${stage}`);
  let modules = [];
  let convergenceReadable = false;
  let convergenceFormat = null;
  // The current decision owns both the module set and its evidence pointer.
  const mappings = legacyIdMappings(decision);
  // Old WPn headings and Chinese package headings name the same package set.
  // An explicit 旧编号对照 row still wins when it maps a Chinese number to a
  // different WP id; without one the Chinese number itself is the module id.
  const mappingGaps = [];
  const expected = [];
  const unpairedHeadings = { wp: new Map(), chinese: new Map() };
  const headingNumber = match => match[1] ?? packageNumber(match[2] ?? match[3]);
  const mappedPackageId = number => {
    const mapped = mappings.get(`工作包 ${number}`);
    return mapped && /^WP-?\d+$/.test(mapped) ? String(Number(mapped.match(/\d+/)[0])) : number;
  };
  for (const match of decision.matchAll(new RegExp(PACKAGE_HEADING.source, 'gm'))) {
    const number = headingNumber(match);
    if (number === null) continue;
    const form = match[1] ? 'wp' : 'chinese';
    const id = form === 'wp' ? number : mappedPackageId(number);
    const other = form === 'wp' ? 'chinese' : 'wp';
    const paired = unpairedHeadings[other].get(id) ?? 0;
    if (paired > 0) { unpairedHeadings[other].set(id, paired - 1); continue; }
    expected.push(id);
    unpairedHeadings[form].set(id, (unpairedHeadings[form].get(id) ?? 0) + 1);
  }
  const headingWpId = line => {
    const match = PACKAGE_HEADING.exec(line);
    if (!match) return null;
    const number = headingNumber(match);
    if (number === null) return null;
    return match[1] ? number : mappedPackageId(number);
  };
  const pointers = [...new Set([...decision.matchAll(/`(quality\/evidence\/[^`\n]*convergence-checklist[^`\n]*\.md)`/g)].map(match => match[1]))];
  // Resolve only the current decision's own references; prose alone is not proof.
  const section = (body, pattern) => {
    const lines = body.split(/\r?\n/), matches = lines.map((line,index)=>pattern.test(line)?index:-1).filter(index=>index>=0);
    if(matches.length!==1)return '';
    const start=matches[0], depth=/^#+/.exec(lines[start])?.[0].length ?? 0;
    let end=start+1;
    while(end<lines.length && !new RegExp(`^#{1,${depth}}\\s`).test(lines[end]))end++;
    return lines.slice(start+1,end).join('\n');
  };
  const moduleBody = id => {
    const lines=decision.split(/\r?\n/);
    const starts=lines.map((line,index)=>headingWpId(line)===id?index:-1).filter(index=>index>=0);
    if(starts.length!==1)return '';
    let end=starts[0]+1;
    while(end<lines.length&&!headingWpId(lines[end])&&!/^#{1,3}\s/.test(lines[end]))end++;
    return lines.slice(starts[0]+1,end).join('\n');
  };
  const decisionBody = id => {
    const direct=section(decision,new RegExp(`^#{1,6}\\s+${id}\\s*[—–-]`));
    if(direct)return direct;
    for(const [label,legacy] of mappings){
      if(legacy!==id||!label.startsWith('决定 '))continue;
      const body=section(decision,new RegExp(`^#{1,6}\\s+决定\\s*${label.slice(3)}\\s*[:：]`));
      if(body)return body;
    }
    return '';
  };
  const tableRow = id => decision.split(/\r?\n/).filter(line=>new RegExp(`^\\|\\s*${id}\\s*\\|`).test(line));
  // Range expansion is bounded by the real AC rows, not a fixed quota.
  const acRowCount = decision.split(/\r?\n/).filter(line => /^\|\s*AC-[A-Z0-9-]+\s*\|/.test(line)).length;
  let details = '';
  const detailRefs = [...new Set([...decision.matchAll(/`(quality\/evidence\/[^`\n]*module-details[^`\n]*\.md)`/g)].map(match=>match[1]))];
  if(detailRefs.length===1 && !detailRefs[0].split('/').some(part=>part==='..'||part==='.') && !detailRefs[0].includes('\\')) {
    try {
      const root=realpathSync(resolve(taskPath,'quality/evidence')), path=realpathSync(resolve(taskPath,detailRefs[0])), rel=relative(root,path);
      if(rel!=='..'&&!rel.startsWith('../')&&!isAbsolute(rel))details=readFileSync(path,'utf8');
    } catch { /* Each dependent cell reports its unresolved details anchor below. */ }
  }
  const compact = value => value.replace(/\s+/g,'');
  const cellPresent = (value, field, moduleId) => {
    if(!value)return false;
    const allModules=field==='依赖'&&value==='全部包'&&expected.length>0&&expected.every(id=>moduleBody(id).trim());
    const explicitNone=/^(?:依赖|未决\/无)$/.test(field)&&/^无(?:（[^）]*）)?$/.test(value);
    // Lists compare complete named consumers, never arbitrary word fragments.
    const consumerList = text => text.split(/[、，,]|与/).map(compact).filter(Boolean).sort().join('\n');
    const consumers=field==='消费者'?moduleBody(moduleId).split(/\r?\n/).filter(line=>/消费者/.test(line)).join('\n'):'';
    const sourcedConsumer=[...consumers.matchAll(/消费者(?:是|为|[：:])\s*([^。\n；]+)/g)].some(match=>consumerList(match[1])===consumerList(value));
    let found=false, valid=true;
    // A decision id can evidence goal, boundary, risk and the chosen approach.
    // It cannot stand in for acceptance, dependency, consumer or open-item
    // fields; those need their own token species.
    for(const match of value.matchAll(/D-\d{3}/g)) {
      if(!['目标','边界','风险','方案与取舍'].includes(field)) continue;
      found=true;
      const body=decisionBody(match[0]);
      const label=field==='目标'?'做什么':field==='边界'?'不做什么':field==='风险'?'风险':null;
      const content=label?body.split(/\r?\n/).find(line=>new RegExp(`^- \\*\\*${label}\\*\\*[：:]\\s*\\S`).test(line)):body.trim();
      if(!content)valid=false;
    }
    // A Chinese decision reference can evidence the same fields as a D id; it
    // cannot stand in for acceptance, dependency, consumer or open-item fields.
    for(const match of value.matchAll(/(?<![\w-])决定\s*(\d+)(?!\d)/g)) {
      if(!['目标','边界','风险','方案与取舍'].includes(field)) continue;
      found=true;
      const decisionId=String(Number(match[1]));
      const mapped=mappings.get(`决定 ${decisionId}`), body=mapped?decisionBody(mapped):'';
      const label=field==='目标'?'做什么':field==='边界'?'不做什么':field==='风险'?'风险':null;
      const content=label?body.split(/\r?\n/).find(line=>new RegExp(`^- \\*\\*${label}\\*\\*[：:]\\s*\\S`).test(line)):body.trim();
      if(!body||!content){valid=false;mappingGaps.push(`决定 ${decisionId} 未取得旧编号映射或正文`);errors.push(`${moduleId}/${field}: 决定 ${decisionId} 未取得旧编号映射或正文`);}
    }
    // Project AC ids carry a package prefix (AC-C06-1, AC-D01) next to the
    // plain AC-01 form. The token still has to resolve to exactly one real
    // table row with a non-empty cell; nothing else about the check relaxes.
    const acSpans=[];
    for(const match of value.matchAll(/(?<![\w-])AC-(?:[A-Z][A-Z0-9]*(?:-\d+)?|\d+)(?:\s*[～~]\s*(?:AC-[A-Z0-9-]+|\d+|[A-Za-z][A-Za-z0-9-]*\d))?(?![\w~～-])/g)) {
      found=true;
      acSpans.push({index:match.index,end:match.index+match[0].length});
      const raw=match[0].replace(/\s+/g,'');
      const [start,end]=raw.split(/[～~]/);
      const expanded=expandAcRange(start,end,acRowCount);
      if(expanded.invalid){valid=false;continue;}
      for(const id of expanded.ids){
        const rows=tableRow(id);
        if(rows.length!==1||!rows[0].split('|').slice(2,-1).some(cell=>cell.trim()))valid=false;
      }
    }
    // A legal token must not hide a malformed AC-like token in the same cell.
    for(const broad of value.matchAll(/AC-[A-Za-z0-9-]+/g)) {
      if(!acSpans.some(span=>broad.index>=span.index&&broad.index+broad[0].length<=span.end))valid=false;
    }
    for(const match of value.matchAll(/OI-\d+/g)) {
      found=true; const rows=tableRow(match[0]);
      if(rows.length!==1||!rows[0].split('|').slice(2,-1).some(cell=>cell.trim()))valid=false;
    }
    for(const match of value.matchAll(/details§(\d+)/g)) {
      found=true;
      if(!section(details,new RegExp(`^#{1,6}\\s+${match[1]}(?:\\s|[.)、])`)).trim())valid=false;
    }
    for(const match of value.matchAll(/WP(\d+)(?:(?:[～~–-](?:WP)?(\d+))|((?:\/\d+)+))?/g)) {
      found=true;
      const start=Number(match[1]), end=Number(match[2]), count=end-start+1;
      if(match[2]&&(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||count>expected.length)){valid=false;continue;}
      const ids=match[2]?Array.from({length:count},(_,i)=>String(start+i)):match[3]?[match[1],...match[3].slice(1).split('/')]:[match[1]];
      if(!ids.length||ids.some(id=>!expected.includes(id)||!moduleBody(id).trim()))valid=false;
    }
    // A real AC/WP token does not vouch for an unrelated named consumer.
    if(field==='消费者'&&!sourcedConsumer&&!/^(?:WP\d+(?:[、,\/～~–-](?:WP)?\d+)*)$/.test(value))return false;
    return valid&&(allModules||explicitNone||sourcedConsumer||found);
  };
  const convergenceRef = pointers.length === 1 ? pointers[0] : null;
  const safeRef = convergenceRef && !convergenceRef.split('/').some(part => part === '..' || part === '.') && !convergenceRef.includes('\\');
  try {
    if (!safeRef) throw Error('未取得唯一当前任务收敛清单指针');
    const root = realpathSync(resolve(taskPath, 'quality/evidence'));
    const path = realpathSync(resolve(taskPath, convergenceRef));
    const rel = relative(root, path);
    if (rel === '..' || rel.startsWith('../') || isAbsolute(rel)) throw Error('收敛清单越出当前任务证据范围');
    const body = readFileSync(path, 'utf8');
    const tableLines = body.split(/\r?\n/);
    const header = tableLines.find(line => /^\|\s*包\s*\|/.test(line));
    const headerCells = header ? header.split('|').slice(1, -1).map(cell => cell.trim()) : [];
    // A 5-column status table (包/状态/五段表位置/证据/未决) has no 8-field
    // evidence, but its state column is a real per-package verdict. The
    // ten-column checklist (8 field cells + 状态, optionally followed by the
    // five analysis columns) declares 状态 in its header too; both formats name
    // every package whose state is not 已收敛.
    const fiveColumn = headerCells.length === 5 && headerCells[0] === '包' && headerCells[1] === '状态';
    const statusColumn = fiveColumn || headerCells.includes('状态');
    const statusIndex = fiveColumn ? 1 : statusColumn ? headerCells.indexOf('状态') : 9;
    modules = tableLines.map((line, index) => ({ line, number: index + 1 }))
      .filter(entry => /^\|\s*\d+\s/.test(entry.line)).map(({ line, number }) => {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        if (fiveColumn) return { name: cells[0], fields: [], state: cells[1] ?? '', source: convergenceRef, line: number };
        const fields = ['目标', '边界', '方案与取舍', '验收', '风险', '依赖', '消费者', '未决/无'];
        return { name: cells[0], fields: fields.map((name, index) => {
          const reference=cells[index+1]??'', present=cellPresent(reference,name,/^\d+/.exec(cells[0])?.[0]);
          if(!present)errors.push(`${cells[0]}/${name}: 未取得可回读的当前证据：${reference||'缺项'}`);
          return {name,reference,present};
        }), state: cells[statusIndex] ?? '', source: convergenceRef, line: number };
      });
    convergenceReadable = true;
    if (!modules.length) errors.push(`${convergenceRef}: 未读到模块行`);
    convergenceFormat = fiveColumn ? 'five-column-status' : statusColumn ? 'status-column-evidence' : 'eight-field-evidence';
  } catch (error) { errors.push(`${convergenceRef ?? '收敛清单'}: ${error.message}`); }
  const level = levelDisplay;
  const ids = modules.map(row => /^\d+/.exec(row.name)?.[0]);
  const missing = expected.filter(id => !ids.includes(id));
  const duplicate = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const unknown = ids.filter(id => !expected.includes(id));
  const statusColumnFormat = convergenceFormat === 'five-column-status';
  // A 状态 cell that is not 已收敛 is a named unconverged package in every
  // status-bearing table. Empty or missing state never passes as converged;
  // a missing package name falls back to the row line instead of an empty
  // string. Missing field evidence stays a separate gap.
  const statusBearing = convergenceFormat === 'five-column-status' || convergenceFormat === 'status-column-evidence';
  const stateGaps = modules
    .filter(row => row.state !== '已收敛' && (statusBearing || (row.state ?? '') !== ''))
    .map(row => '未收敛：' + (row.name || `第 ${row.line} 行`));
  const fieldGaps = statusColumnFormat ? [] : modules.filter(row => row.fields.some(field => !field.present)).map(row => row.name);
  const gaps = statusColumnFormat
    ? (modules.length ? stateGaps : ['收敛清单无可读模块行'])
    : [...stateGaps, ...fieldGaps];
  gaps.push(...missing.map(id => `缺模块 WP${id}`), ...duplicate.map(id => `重复模块 WP${id}`), ...unknown.map(id => `未知模块 WP${id}`), ...mappingGaps);
  if (!expected.length || new Set(expected).size !== expected.length) { gaps.push('权威模块集合未取得或重复'); errors.push('decision-log.md: 权威模块集合未取得或重复'); }
  if (!safeRef) gaps.push('收敛清单指针未取得');
  else if (!convergenceReadable) gaps.push('收敛清单不可读');
  const convergence = { source: convergenceRef, expected_modules: expected, complete: gaps.length === 0 && expected.length > 0, gaps };
  const invalidatedList = invalidated.flatMap(record => [...record.slugs, ...record.ranges.map(range => `${range.from}～${range.to}`)]);
  const unscopedInvalidations = invalidated.filter(record => !record.scope);
  if (unscopedInvalidations.length) errors.push(`失效步骤未写可识别阶段：${unscopedInvalidations.flatMap(record => [...record.slugs, ...record.ranges.map(range => `${range.from}～${range.to}`)]).join('、')}；未应用，不跨 stage 推断`);
  for (const value of unmatchedInvalidations) errors.push(`失效步骤未匹配当前阶段步骤表：${value}；未应用`);
  const invalidationLimit = unmatchedInvalidations.length
    ? `未知失效范围未判：${unmatchedInvalidations.join('、')}；未清除任何步骤的既有 producer 完成事实；该事实只作历史，不证明当前失效范围完成`
    : null;
  const skipGaps = [];
  // Ordinary immutable task originals are the sole source, never a cursor or
  // a second step ledger. Completed producer facts can resolve a named gap.
  try {
    const dir = resolve(taskPath, 'quality/evidence');
    const files = existsSync(dir) ? readdirSync(dir).filter(file => /-step-gap\.json$/.test(file)) : [];
    const manifest = files.length ? JSON.parse(readFileSync(resolve(taskPath, 'task.json'), 'utf8')) : null;
    const task = files.length ? openTask(resolve(taskPath), { projectName: manifest.project_name, taskId: manifest.task_id }) : null;
    for (const file of files) {
      const ref = `quality/evidence/${file}`;
      const gap = JSON.parse(task.readRecord(ref));
      if (gap.task_id !== manifest.task_id || (stage && gap.stage !== stage)) continue;
      const activeSource = reports.find(report => report.stage === gap.stage)?.source;
      const row = evidence.find(row => row.source === activeSource && row.step_slug === gap.step_slug);
      const stale = invalidated.some(record => record.scope === gap.stage
        && (record.slugs.has(gap.step_slug) || record.slugs.has(String(gap.step_id))
          || record.ranges.some(range => gap.step_id >= range.from && gap.step_id <= range.to)));
      const gapIdentity = Object.fromEntries(['phase', 'commit', 'run_id'].filter(key => typeof gap[key] === 'string' && gap[key]).map(key => [key, gap[key]]));
      const resolved = !stale && row?.state === 'completed' && Object.keys(gapIdentity).length > 0
        && completedHumanOriginals(row).some(proof => {
          if (typeof proof.ref !== 'string') return false;
          try {
            const original = executionOriginalFields(task.readRecord(proof.ref), proof.ref);
            return original.task_id === gap.task_id && original.source === row.source && original.step_slug === gap.step_slug
              && original.conclusion === 'completed'
              && Object.entries(gapIdentity).every(([key, value]) => (key === 'phase' ? original.phase ?? original.phase_id : original[key]) === value)
              && Number.isFinite(Date.parse(original.created_at)) && Date.parse(original.created_at) > Date.parse(gap.created_at);
          } catch { return false; } // Missing proof retains the gap, never clears it.
        });
      if (!resolved) skipGaps.push({ ...gap, evidence_ref: ref });
    }
  } catch (error) { errors.push(`跳过缺口不可读：${error.message}`); }
  const currentStage = reports.find(row => row.stage === stage);
  const current = selectedStep !== undefined
    ? currentStage?.steps.find(row => row.step_id === selectedStep)
    : currentStage?.steps.find(row => !['completed', 'not_applicable'].includes(row.state));
  const currentCard = card && current ? {
    stage, step_id: current.step_id, step_slug: current.step_slug,
    result: current.result ?? '按本步方法留下具名原件；未取得不能冒完成。',
    entry: `先读本步方法；核对前置步骤具名原件与当前 ${runId ? `run ${runId}` : phase ? `Phase ${phase}` : commit ? `commit ${commit}` : '身份（尚未提供）'}，缺项如实记录。`,
    stop: `${current.requires_user_reply
      ? current.step_slug === 'conditional-ui-readiness'
        ? 'UI 任务需要真实用户答复；未答停在本步。非 UI 任务在本步写不适用＋理由后继续。'
        : '需要真实用户答复；未答停在本步。'
      : '缺少本步必需输入时停止该路径，保留原因、负责人和恢复条件。'}可读或 exit 0 不代表完成；按本步判据独立核对。`,
    paths: [...new Set([`workflows/${stage}/SKILL.md#${current.method_anchor}`, current.source,
      (current.evidence.find(item => item.present === true) ?? current.evidence.find(item => item.ref && !item.ref.endsWith('/') && item.kind !== 'task_original_ref'))?.ref].filter(Boolean))],
    evidence: current.evidence.length ? current.evidence : [{ ref: current.evidence_location, present: false, reason: '尚未取得具名原件' }],
    self_check: `node tools/cli/check-stage-steps.mjs --stage=${stage} --step=${current.step_id} --card --task-path=${taskPath}${materialRoot ? ` --material-root=${materialRoot}` : ''}${runId ? ` --run-id=${runId}` : ''}${phase ? ` --phase=${phase}` : ''}${commit ? ` --commit=${commit}` : ''}`,
    requires_user_reply: current.requires_user_reply,
  } : null;
  if (currentCard) {
    const readings = currentCard.paths.map(ref => {
      const [file, anchor] = ref.split('#');
      const root = file.startsWith('workflows/') ? repoRoot : evidenceRootFor(file, taskPath, materialRoot).root;
      const checked = readDeclaredEvidence({ kind: 'reading_input', uri_or_path: file }, { taskPath, materialRoot: root, namedOnly: true });
      if (!checked.present) return { ref, observed: false, bytes: null, reason: checked.reason };
      try {
        let body = readFileSync(resolve(root, file), 'utf8');
        if (anchor) {
          const lines = body.split(/\r?\n/);
          const start = lines.findIndex(line => line.includes(`id="${anchor}"`));
          if (start >= 0) {
            const next = lines.findIndex((line, index) => index > start && /^(?:[0-9]+\. |#{1,6} )/.test(line));
            body = lines.slice(start, next < 0 ? lines.length : next).join('\n');
          } else {
            body = sectionAfterHeading(body, anchor);
            if (!body) throw Error('当前节不可读');
          }
        }
        return { ref, observed: true, bytes: Buffer.byteLength(body), scope: anchor ? '本步节原文' : '所列文件原文' };
      } catch (error) { return { ref, observed: false, bytes: null, reason: error.message }; }
    });
    currentCard.reading_baseline = {
      paths: readings, path_count: readings.length, bytes: readings.reduce((sum, item) => sum + (item.bytes ?? 0), 0),
      complete: readings.every(item => item.observed),
      skips: { value: null, reason: '卡只能读到缺口原件，未观测任务全部实际跳步；由 Phase 执行原件提供' },
      rework: { value: null, reason: '返工不是步骤持久状态；由本 Phase 实际失败与修复原件提供' },
      phase_duration: { value: null, reason: 'Phase 尚未终结；由最终开工/结束事实计算，当前不造时长' },
      limits: '本次实际读取的卡所列文件或节字节；不代表人类阅读耗时、全部前置或改善幅度。',
    };
  }
  if (card && current && selectedStep === undefined) currentStage.steps = currentStage.steps.filter(row => row.step_id <= current.step_id);
  return { stages: reports, ...(card ? { card: currentCard } : {}), skip_gap: skipGap,
    closeout: { state: skipGaps.length || errors.some(error => error.startsWith('跳过缺口不可读')) ? 'incomplete' : 'unavailable', gaps: skipGaps,
      reason: '收口必须逐项消费未清缺口；无跳过缺口也不证明步骤或阶段完成。' },
    modules, convergence, level, supersede: { source: 'decision-log.md', invalidated: invalidatedList }, errors,
    limits: ['只报告映射、声明原件的可读性、既有 producer 判定与模块结构；不证明步骤完成或模块语义。未留痕只表示机检未读到声明原件，不证明步骤未执行；无持久原件的方法交既有 decision/GLOSSARY/ADR 原件由独立读者判断。失效步骤只按当前 decision-log 行读取，删行不重建历史。', ...(invalidationLimit ? [invalidationLimit] : []), ...producerLimits] };
}

function validateSkipIdentity(options, task) {
  if (options.runId) throw Error('当前 run 身份 unavailable：没有现役运行编号权威，改用已核 Phase 或真实提交');
  const cwd = options.materialRoot;
  if (typeof cwd !== 'string') throw Error('当前身份 unavailable：需要真实材料根定位工作区');
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const root = git(['rev-parse', '--show-toplevel']);
  if (options.commit) {
    const head = git(['rev-parse', '--verify', 'HEAD^{commit}']);
    if (!/^[a-f0-9]{40,64}$/.test(options.commit) || options.commit !== head) throw Error('提交身份 unavailable：必须等于真实工作区 HEAD');
  }
  if (options.phase) {
    const rows = task.readRecord('facts.jsonl').split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line));
    const cursor = rows.find(row => row.task_id === task.identity.taskId && row.record_kind === 'stage' && row.stage === 'build-code')?.phase_progress;
    if (!cursor || cursor.phase_id !== options.phase) throw Error('Phase 身份 unavailable：未读到相同的既有当前 phase_progress');
    const index = readFileSync(resolve(cwd, 'phases/index.md'), 'utf8');
    const ref = phaseFilesFromIndex(index).find(ref => ref.match(/^phases\/(P[1-9][0-9]*)(?:-|\.md$)/)?.[1] === options.phase);
    if (!ref || !readDeclaredEvidence({ uri_or_path: ref }, { taskPath: task.taskPath, materialRoot: cwd, namedOnly: true }).present) throw Error('Phase 身份 unavailable：当前索引或物理 Phase 不可读');
    if (!phaseTaskCards(readFileSync(resolve(cwd, ref), 'utf8')).some(card => card.taskId === cursor.task_id || card.heading === cursor.task_id)) throw Error('Phase 身份 unavailable：当前任务不在物理 Phase');
    const materialsHead = git(['-C', root, 'log', '-1', '--format=%H', '--', relative(root, resolve(cwd, 'spec.md')), relative(root, resolve(cwd, 'phases'))]);
    if (!materialsHead || cursor.phases_head !== materialsHead) throw Error('Phase 身份 unavailable：既有游标与当前材料提交不符');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {};
  const inputErrors = [];
  let json = false;
  let skipStep, reason, owner, recovery;
  for (const arg of process.argv.slice(2)) {
    if (arg === '--json') { json = true; continue; }
    if (arg === '--card') { options.card = true; continue; }
    const match = /^--(task-path|material-root|repo-root|stage|step|run-id|phase|commit|skip-with-gap|reason|owner|recovery)=(.+)$/.exec(arg);
    if (!match) { inputErrors.push(`不支持参数：${arg}`); continue; }
    const [ , key, value] = match;
    if (key === 'skip-with-gap') skipStep = Number(value);
    else if (key === 'reason') reason = value.trim();
    else if (key === 'owner') owner = value.trim();
    else if (key === 'recovery') recovery = value.trim();
    else options[{ 'task-path': 'taskPath', 'material-root': 'materialRoot', 'repo-root': 'repoRoot', stage: 'stage', step: 'step', 'run-id': 'runId', phase: 'phase', commit: 'commit' }[key]] = key === 'step' ? Number(value) : value;
  }
  if (skipStep !== undefined) {
    options.step = skipStep;
    if (!reason || !owner || !recovery) inputErrors.push('显式跳过需要 reason（原因）、owner（负责人）和 recovery（恢复条件）');
    if (!options.phase && !options.commit && !options.runId) inputErrors.push('跳过身份 unavailable：需要当前 --phase、--commit 或 --run-id；交阶段主会话恢复');
    if (!options.stage || !stages.includes(options.stage) || !Number.isSafeInteger(skipStep) || skipStep < 1) inputErrors.push('跳过需要有效阶段和正整数步骤');
    if (!inputErrors.length) {
      try {
        const before = runStageStepsCheck(options);
        const row = before.stages.find(row => row.stage === options.stage);
        const step = row?.steps.find(row => row.step_id === skipStep);
        if (!step) throw Error('当前步骤定义不可读，不能记录跳过');
        const manifest = JSON.parse(readFileSync(resolve(options.taskPath, 'task.json'), 'utf8'));
        const task = openTask(resolve(options.taskPath), { projectName: manifest.project_name, taskId: manifest.task_id });
        if (row.definition !== 'available' || before.errors.some(error => /当前任务事实不可读|读不到步骤定义|当前 Phase 指针不可读/.test(error))) throw Error('本步或身份来源 unavailable，不能记录跳过');
        validateSkipIdentity(options, task);
        const gap = { task_id: manifest.task_id, stage: options.stage, step_id: skipStep, step_slug: step.step_slug,
          reason, owner, recovery, ...(options.phase ? { phase: options.phase } : {}),
          ...(options.commit ? { commit: options.commit } : {}), ...(options.runId ? { run_id: options.runId } : {}), created_at: new Date().toISOString() };
        const path = await task.appendRecord({ dir: 'quality/evidence', slug: 'step-gap', ext: 'json', bytes: JSON.stringify(gap, null, 2) + '\n' });
        options.skipGap = { ...gap, evidence_ref: relative(task.taskPath, path) };
        // A skip keeps the current step (with its named gap). The next card is
        // only a hint in this same reply; report flow and progress do not move.
        const full = runStageStepsCheck({ ...options, step: undefined, card: false });
        const next = full.stages.find(row => row.stage === options.stage)?.steps.find(row => row.step_id > skipStep);
        options.skipNext = next ? { step_id: next.step_id, step_slug: next.step_slug } : null;
      } catch (error) { inputErrors.push(`跳过未记录：${error.message}`); }
    }
  }
  options.inputErrors = inputErrors;
  const report = runStageStepsCheck(options);
  if (options.skipNext) report.skip_next = options.skipNext;
  // A named unconverged package is a real gap, not a format note: surface it
  // through the exit code so a skipped convergence cannot pass as clean.
  if (report.convergence.gaps.some(gap => String(gap).startsWith('未收敛：'))) process.exitCode = 1;
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    if (report.card) console.log(JSON.stringify(report.card, null, 2));
    console.log(`未清跳过缺口：${JSON.stringify(report.closeout)}`);
    if (report.skip_next) console.log(`下一步卡：${report.skip_next.step_id} ${report.skip_next.step_slug}（仅同次回复提示；跳过后当前步仍为 ${options.step}，不写进度）`);
    console.log('判定：已完成＝既有 producer 判完成；已留痕＝声明原件可读但不判完成；待重做＝方向变更列出的失效步骤。');
    for (const row of report.stages) {
      if (row.definition === 'unavailable') console.log(`${row.stage} 读不到步骤定义（${row.source}）：${row.definition_error}；步骤是否完成未判定，不按「未留痕」报告`);
      else console.log(`${row.stage} 映射${row.mapping}`);
      for (const step of row.steps) {
        console.log(`  ${step.step_id} ${step.step_slug}：${step.judgment}；状态：${step.state}；证据位置：${step.evidence_location ?? '未配置'}；${step.gap}`);
        if (step.evidence?.length) console.log(`    声明原件：${step.evidence.map(item => `${item.ref}（${item.present === true ? '有' : item.present === null ? 'facts 补充' : '缺'}）`).join('；')}`);
      }
    }
    console.log(`失效步骤：${report.supersede.invalidated.length ? report.supersede.invalidated.join('、') : '无'}（${report.supersede.source}）`);
    for (const row of report.modules) {
      if (!row.fields.length) console.log(`${row.name}：${row.state ?? '未判'}；5列状态表（按状态列判定）；${row.source}`);
      else {
        console.log(`${row.name}：${row.state}；8项非空=${row.fields.filter(field => field.present).length}/8；${row.source}`);
        for (const field of row.fields) console.log(`  ${field.name}：${field.present ? field.reference : '缺项'}；present=${field.present}`);
      }
    }
    console.log(`收敛 complete=${report.convergence.complete}；gaps=${JSON.stringify(report.convergence.gaps)}`);
    console.log('退出码只反映状态列的未收敛包；十列字段缺口只进上面的 complete/gaps，不改变退出码。');
    console.log(`级别：${report.level}`);
    for (const error of report.errors) console.log(`缺口：${error}`);
    console.log(report.limits.join('\n'));
  }
}
