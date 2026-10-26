#!/usr/bin/env node
// Report-only consumer of the existing final-chain evidence producer.
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const stages = ['make-decision', 'build-plan', 'build-code', 'verify-code', 'build-prd'];
export function runStageStepsCheck({ taskPath, materialRoot, repoRoot = repository, stage } = {}) {
  const errors = [];
  let evidence = [];
  let producerLimits = [];
  try {
    const report = runFinalChainCheck({ taskPath, ...(materialRoot ? { materialRoot } : {}) });
    evidence = report.workflow_steps;
    producerLimits = report.limits ?? [];
    if (!materialRoot) materialRoot = report.material_root;
  }
  catch (error) { errors.push(error.message); }
  const reports = [];
  for (const name of stages.filter(name => !stage || name === stage)) {
    const source = `workflows/${name}/steps.json`;
    try {
      const manifest = JSON.parse(readFileSync(resolve(repoRoot, source), 'utf8'));
      if (manifest.stage_slug !== name || !Array.isArray(manifest.steps) || !manifest.steps.length) throw Error('invalid steps manifest');
      const steps = manifest.steps.map(step => {
        const mapping = /判定消费[：:]\s*([^；;\n]+)[；;]\s*原件[：:]\s*(\S[^\n]*)/.exec(step.observable_result ?? '');
        const row = evidence.find(row => row.source === source && row.step_slug === step.step_slug);
        return { stage: name, step_id: step.step_id, step_slug: step.step_slug, source,
          evidence_location: mapping?.[2] ?? null, consumer: mapping?.[1] ?? null,
          judgment: !mapping ? '映射未配置' : row?.state === 'completed' || row?.state === 'not_applicable' ? '已留痕' : '未留痕',
          state: row?.state ?? 'unavailable', basis: row?.basis ?? [],
          gap: !mapping ? `${source}#${step.step_slug} 缺判定消费/原件标记` : row ? (row.limits ?? []).join('；') : '既有步骤判定未取得；不据文件存在推定完成' };
      });
      reports.push({ stage: name, source, mapping: steps.every(row => row.consumer && row.evidence_location) ? '已配置' : '未配置', steps });
    } catch (error) { errors.push(`${source}: ${error.message}`); reports.push({ stage: name, source, mapping: '未配置', steps: [] }); }
  }
  if (stage && !stages.includes(stage)) errors.push(`未知阶段：${stage}`);
  let modules = [];
  let convergenceReadable = false;
  let decision = '';
  try { decision = readFileSync(resolve(materialRoot, 'decision-log.md'), 'utf8'); }
  catch (error) { errors.push(`decision-log.md: ${error.message}`); }
  // The current decision owns both the module set and its evidence pointer.
  const expected = [...decision.matchAll(/^(?:#{1,6}\s+|\*\*)WP(\d+)\s*[—–-]/gm)].map(match => match[1]);
  const pointers = [...new Set([...decision.matchAll(/`(quality\/evidence\/[^`\n]*convergence-checklist[^`\n]*\.md)`/g)].map(match => match[1]))];
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
      return { name: cells[0], fields: fields.map((name, index) => ({ name, reference: cells[index + 1] ?? '', present: Boolean(cells[index + 1]) })), state: cells[9] ?? '', source: convergenceRef };
    });
    convergenceReadable = true;
    if (!modules.length) errors.push(`${convergenceRef}: 未读到模块行`);
  } catch (error) { errors.push(`${convergenceRef}: ${error.message}`); }
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
  gaps.push(...missing.map(id => `缺模块 WP${id}`), ...duplicate.map(id => `重复模块 WP${id}`), ...unknown.map(id => `未知模块 WP${id}`));
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
      console.log(`${row.stage} 映射${row.mapping}`);
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
