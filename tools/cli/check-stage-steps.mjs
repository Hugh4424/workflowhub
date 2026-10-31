#!/usr/bin/env node
import { WORKFLOW_STAGES } from '../../runtime/stage/stage-registry.mjs';
// Report-only consumer of the existing final-chain evidence producer.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';

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
export function runStageStepsCheck({ taskPath, materialRoot, repoRoot = repository, stage } = {}) {
  const errors = [];
  let evidence = [];
  let producerLimits = [];
  try {
    // Pass the same explicit root this checker reads: --repo-root keeps its
    // current meaning, and its default is the installed workflowhub package.
    const report = runFinalChainCheck({ taskPath, ...(materialRoot ? { materialRoot } : {}), workflowRoot: resolve(repoRoot) });
    evidence = report.workflow_steps;
    producerLimits = report.limits ?? [];
    if (!materialRoot) materialRoot = report.material_root;
  }
  catch (error) { errors.push(error.message); }
  const reports = [];
  for (const name of stages.filter(name => !stage || name === stage)) {
    const source = `workflows/${name}/steps.json`;
    const manifestPath = resolve(repoRoot, source);
    let definitions;
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.stage_slug !== name || !Array.isArray(manifest.steps) || !manifest.steps.length) throw Error('invalid steps manifest');
      definitions = manifest.steps;
    } catch (error) {
      const detail = `${manifestPath}: ${error.message}`;
      errors.push(`读不到步骤定义：${source}（${detail}）；步骤是否完成未判定，不按「未留痕」报告`);
      reports.push({ stage: name, source, definition: 'unavailable', definition_error: detail, mapping: '未配置', steps: [] });
      continue;
    }
    const producerFailure = producerDefinitionError(producerLimits, name);
    const steps = definitions.map(step => {
      const mapping = /判定消费[：:]\s*([^；;\n]+)[；;]\s*原件[：:]\s*(\S[^\n]*)/.exec(step.observable_result ?? '');
      const identity = { stage: name, step_id: step.step_id, step_slug: step.step_slug, source,
        evidence_location: mapping?.[2] ?? null, consumer: mapping?.[1] ?? null };
      if (producerFailure) return { ...identity, judgment: '未判定', state: 'unavailable', basis: [],
        gap: `读不到步骤定义：证据生产者未能从材料仓读取 ${source}；本条不是「步骤没做」` };
      const row = evidence.find(row => row.source === source && row.step_slug === step.step_slug);
      return { ...identity,
        judgment: !mapping ? '映射未配置' : row?.state === 'completed' || row?.state === 'not_applicable' ? '已留痕' : '未留痕',
        state: row?.state ?? 'unavailable', basis: row?.basis ?? [],
        gap: !mapping ? `${source}#${step.step_slug} 缺判定消费/原件标记` : row ? (row.limits ?? []).join('；') : '步骤证据台账缺行：没有这一步的留痕原件；不能据此断定步骤没做' };
    });
    if (producerFailure) errors.push(`读不到步骤定义：${source} 的证据生产者读取失败（${producerFailure}）；留痕状态未判定`);
    reports.push({ stage: name, source, definition: producerFailure ? 'unavailable' : 'available',
      definition_error: producerFailure, mapping: steps.every(row => row.consumer && row.evidence_location) ? '已配置' : '未配置', steps });
  }
  if (stage && !stages.includes(stage)) errors.push(`未知阶段：${stage}`);
  let modules = [];
  let convergenceReadable = false;
  let decision = '';
  try { decision = readFileSync(resolve(materialRoot, 'decision-log.md'), 'utf8'); }
  catch (error) { errors.push(`decision-log.md: ${error.message}`); }
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
    for(const match of value.matchAll(/D-\d{3}/g)) {
      found=true;
      const body=decisionBody(match[0]);
      const label=field==='目标'?'做什么':field==='边界'?'不做什么':field==='风险'?'风险':null;
      const content=label?body.split(/\r?\n/).find(line=>new RegExp(`^- \\*\\*${label}\\*\\*[：:]\\s*\\S`).test(line)):body.trim();
      if(!content)valid=false;
    }
    for(const match of value.matchAll(/决定\s*(\d+)/g)) {
      found=true;
      const mapped=mappings.get(`决定 ${match[1]}`), body=mapped?decisionBody(mapped):'';
      const label=field==='目标'?'做什么':field==='边界'?'不做什么':field==='风险'?'风险':null;
      const content=label?body.split(/\r?\n/).find(line=>new RegExp(`^- \\*\\*${label}\\*\\*[：:]\\s*\\S`).test(line)):body.trim();
      if(!body||!content){valid=false;mappingGaps.push(`决定 ${match[1]} 未取得旧编号映射或正文`);errors.push(`${moduleId}/${field}: 决定 ${match[1]} 未取得旧编号映射或正文`);}
    }
    for(const match of value.matchAll(/(?:AC-\d+|OI-\d+)/g)) {
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
    modules = body.split(/\r?\n/).filter(line => /^\|\s*\d+\s/.test(line)).map(line => {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      const fields = ['目标', '边界', '方案与取舍', '验收', '风险', '依赖', '消费者', '未决/无'];
      return { name: cells[0], fields: fields.map((name, index) => {
        const reference=cells[index+1]??'', present=cellPresent(reference,name,/^\d+/.exec(cells[0])?.[0]);
        if(!present)errors.push(`${cells[0]}/${name}: 未取得可回读的当前证据：${reference||'缺项'}`);
        return {name,reference,present};
      }), state: cells[9] ?? '', source: convergenceRef };
    });
    convergenceReadable = true;
    if (!modules.length) errors.push(`${convergenceRef}: 未读到模块行`);
  } catch (error) { errors.push(`${convergenceRef ?? '收敛清单'}: ${error.message}`); }
  let level = '未读到级别事实，按完整材料检查';
  if (materialRoot) {
    try {
      const body = readFileSync(resolve(materialRoot, 'decision-log.md'), 'utf8');
      level = body.split(/\r?\n/).find(line => /^\s*-?\s*(?:\*\*)?推荐级别(?:\*\*)?[:：]\s*(轻档|普通|复杂)(?:任务)?(?:\s*(?:（[^）\n]*）|\([^\)\n]*\)))?[。.]?\s*$/.test(line)) ?? level;
    } catch (error) { errors.push(`decision-log.md: ${error.message}`); }
  }
  const ids = modules.map(row => /^\d+/.exec(row.name)?.[0]);
  const missing = expected.filter(id => !ids.includes(id));
  const duplicate = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const unknown = ids.filter(id => !expected.includes(id));
  const gaps = modules.filter(row => row.state !== '已收敛' || row.fields.some(field => !field.present)).map(row => row.name);
  gaps.push(...missing.map(id => `缺模块 WP${id}`), ...duplicate.map(id => `重复模块 WP${id}`), ...unknown.map(id => `未知模块 WP${id}`), ...mappingGaps);
  if (!expected.length || new Set(expected).size !== expected.length) { gaps.push('权威模块集合未取得或重复'); errors.push('decision-log.md: 权威模块集合未取得或重复'); }
  if (!safeRef) gaps.push('收敛清单指针未取得');
  else if (!convergenceReadable) gaps.push('收敛清单不可读');
  const convergence = { source: convergenceRef, expected_modules: expected, complete: gaps.length === 0 && expected.length > 0, gaps };
  return { stages: reports, modules, convergence, level, errors, limits: ['只报告映射、既有证据判定与模块结构；不证明步骤完成或模块语义。', ...producerLimits] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {};
  let json = false;
  for (const arg of process.argv.slice(2)) {
    if (arg === '--json') { json = true; continue; }
    const match = /^--(task-path|material-root|repo-root|stage)=(.+)$/.exec(arg);
    if (!match) { console.error(`不支持参数：${arg}`); process.exitCode = 0; continue; }
    options[{ 'task-path': 'taskPath', 'material-root': 'materialRoot', 'repo-root': 'repoRoot', stage: 'stage' }[match[1]]] = match[2];
  }
  const report = runStageStepsCheck(options);
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    for (const row of report.stages) {
      if (row.definition === 'unavailable') console.log(`${row.stage} 读不到步骤定义（${row.source}）：${row.definition_error}；步骤是否完成未判定，不按「未留痕」报告`);
      else console.log(`${row.stage} 映射${row.mapping}`);
      for (const step of row.steps) console.log(`  ${step.step_id} ${step.step_slug}：${step.judgment}；证据位置：${step.evidence_location ?? '未配置'}；${step.gap}`);
    }
    for (const row of report.modules) {
      console.log(`${row.name}：${row.state}；8项非空=${row.fields.filter(field => field.present).length}/8；${row.source}`);
      for (const field of row.fields) console.log(`  ${field.name}：${field.present ? field.reference : '缺项'}；present=${field.present}`);
    }
    console.log(`收敛 complete=${report.convergence.complete}；gaps=${JSON.stringify(report.convergence.gaps)}`);
    console.log(`级别：${report.level}`);
    for (const error of report.errors) console.log(`缺口：${error}`);
    console.log(report.limits.join('\n'));
  }
}
