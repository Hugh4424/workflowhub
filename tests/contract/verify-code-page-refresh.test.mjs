// P6 authored before implementation. G-2: text/manifest contracts only;
// actual route refreshes and old-artifact retention remain AC-M6-2 deferred.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const method = (source, n) => source.match(new RegExp(`^${n}\\. [\\s\\S]*?(?=^${n + 1}\\. |^## |$(?![\\s\\S]))`, 'm'))?.[0] ?? '';
const section = (source, title) => source.split(`## ${title}\n`)[1]?.split(/^## /m)[0] ?? '';

function refreshIssues(manifest, source) {
  const issues = [];
  for (const [index, event] of [[6, '逐 AC'], [7, 'closeout/PR']]) {
    const result = manifest.steps[index]?.observable_result ?? '';
    if (!result.includes(event) || !/刷新[^。\n]*(?:页面|驾驶舱)/u.test(result)) issues.push(`event ${index + 1}: refresh at own event`);
    if (!/侧车/u.test(result) || !/保旧件/u.test(result)) issues.push(`event ${index + 1}: paired artifact retention`);
    const body = method(source, index + 1);
    if (!body.includes('skills/answer-as-page/SKILL.md') || !body.includes('当前任务驾驶舱')) issues.push(`method ${index + 1}: executable owner pointer`);
  }
  if (!/skipped/u.test(manifest.steps[6]?.observable_result ?? '')) issues.push('event 7: delivery not yet observed');
  if (!/closeout\/PR 完成后/u.test(manifest.steps[7]?.observable_result ?? '')) issues.push('event 8: after delivery');
  if (!/报告sha\/decision指纹/u.test(method(source, 7))) issues.push('method 7: common report identity');
  if (!/报告为唯一权威/u.test(method(source, 7))) issues.push('method 7: report authority');
  return issues;
}

describe('ORACLE-P6-REFRESH wiring; does not claim observed refreshes', () => {
  test('preserves eight steps, their identities, evidence shape and closeout cost', () => {
    const manifest = JSON.parse(read('workflows/verify-code/steps.json'));
    expect(manifest.steps.map(s => s.step_id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(manifest.steps.map(s => s.step_slug)).toEqual(['read-current-materials-and-code', 'ocr-code-review', 'preserve-review-facts', 'inspect-real-entry-and-tests', 'repair-and-targeted-recheck', 'record-finding-dispositions', 'report-verification-result', 'closeout']);
    for (const step of manifest.steps.slice(6)) expect(step.completion_evidence).toEqual([{ kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' }]);
    expect(manifest.steps[7].observable_result).toContain('收口');
    expect(manifest.steps[7].observable_result).toContain('measure-main-agent-cost');
  });

  test('each real method event reaches the shared read-only report/page interface', () => {
    expect(refreshIssues(JSON.parse(read('workflows/verify-code/steps.json')), read('workflows/verify-code/SKILL.md'))).toEqual([]);
  });

  test('removing either refresh, declaring delivery early, or replacing old artifacts breaks the contract', () => {
    const source = read('workflows/verify-code/SKILL.md');
    const manifest = JSON.parse(read('workflows/verify-code/steps.json'));
    // Controlled document mutations are structural counterexamples, not runtime refreshes.
    for (const index of [6, 7]) {
      const changed = structuredClone(manifest);
      changed.steps[index].observable_result = '原结果；无页面动作。';
      expect(refreshIssues(changed, source)).not.toEqual([]);
    }
    const early = structuredClone(manifest);
    early.steps[6].observable_result = early.steps[6].observable_result.replace('skipped', 'pass');
    expect(refreshIssues(early, source)).toContain('event 7: delivery not yet observed');
    const overwrite = structuredClone(manifest);
    overwrite.steps[7].observable_result = overwrite.steps[7].observable_result.replace('保旧件', '覆盖旧件');
    expect(refreshIssues(overwrite, source)).toContain('event 8: paired artifact retention');
  });
});

function debtIssues(template, skill) {
  const issues = [];
  const reception = section(template, '外置事实索引');
  for (const [body, label] of [[reception, 'template'], [section(skill, '内容边界'), 'skill']]) {
    for (const topic of ['调研', 'Talk', '需求索引']) {
      const row = body.split('\n').find(line => line.includes(topic) && line.includes('日期＋主题')) ?? '';
      if (!row.includes('唯一原件')) issues.push(`${label}: ${topic} dated unique original`);
    }
    if (!body.includes('一件一登记')) issues.push(`${label}: one original registration`);
    for (const fixed of ['`research.md`', '`talk-batches.md`', '`requirement-index.md`']) if (body.includes(fixed)) issues.push(`${label}: fixed reception ${fixed}`);
  }
  const decisions = section(template, '工作包与决定');
  for (const topic of ['调研', '发散', '收敛', '就地讨论', '定验收']) {
    const row = decisions.split('\n').find(line => line.startsWith(`| ${topic} |`)) ?? '';
    if (!row.includes('结论') || !row.includes('原件指针') || !row.includes('批次号')) issues.push(`table: ${topic} conclusion/ref/batch`);
  }
  for (const field of ['做什么', '不做什么', '风险', '改动']) if (!decisions.includes(`**${field}**`)) issues.push(`ADR: ${field}`);
  if (!decisions.includes('ADR 与表并存')) issues.push('table does not replace ADR');
  return issues;
}

describe('ORACLE-P6-DEBT template reception and five-row process table', () => {
  test('has dated unique reception paths and five process rows alongside the four-field ADR', () => {
    expect(debtIssues(read('skills/decision-log/templates/decision-log-template.md'), read('skills/decision-log/SKILL.md'))).toEqual([]);
  });

  test('old fixed naming, missing batch, and replacing an ADR with the table are rejected', () => {
    const template = read('skills/decision-log/templates/decision-log-template.md');
    const skill = read('skills/decision-log/SKILL.md');
    expect(debtIssues(template.replace(/日期＋主题/g, '`research.md`'), skill)).not.toEqual([]);
    expect(debtIssues(template.replace(/^\| 调研 \|.*$/m, '| 调研 | 结论＋原件指针 |'), skill)).toContain('table: 调研 conclusion/ref/batch');
    expect(debtIssues(template.replaceAll('**风险**', '**说明**'), skill)).toContain('ADR: 风险');
  });

  test('preserves canonical route, original reference, fallback and four consumer roles', () => {
    const template = read('skills/decision-log/templates/decision-log-template.md');
    const canonical = section(template, '级别与路线');
    for (const token of ['唯一入口事实读点', 'status', 'reason', 'expanded_risks', 'choices', '七项输入', '逐项来源', '未返回', 'unassessed', 'owner', 'paused', '第8步', '第13步', '原 ref', '按复杂处理', '未答不当用户授权']) expect(canonical).toContain(token);
    for (const role of ['流程', '实施/审查', '收口', '验收']) expect(canonical).toContain(role);
    expect(template).toContain('#### D-0xx');
    expect(template).toContain('本节稳定锚');
    expect(section(template, '退役登记')).toContain('被取消、删除或永久退出的对象各占一行');
  });
});
