// ORACLE-C07-AUTHORING / analyze: preserve six checks and append reader use.
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const analyze='skills/spec-analyze/SKILL.md',workflow='workflows/build-plan/SKILL.md';
const originalSix='在同一分析原件逐类给双方原文位置、当前结果、影响与 owner 的下一动作；不适用写具体对象为何不存在及依据。遗漏回原始要求/真实答复与 spec/Task；矛盾对照数量、否定、顺序、权限及失败强度；孤儿任务反查每卡的来源、FR/AC 与真实消费者；越界对照当前写集和原授权，不把质量事实当授权；消费者沿输入→产物→真实调用或读回；测试充分性逐条件核 oracle、反例、真实输入与证据上限。结构绿、编号命中或文件存在不能代替这六类语义检查，也不能代独立质量裁决。';
test('analyze and step eleven append the same seventh class and four subcriteria',()=>{for(const path of [analyze,workflow]){const s=read(path);for(const label of ['第七类：读者可用','句长','行宽','术语解释','编号重复率','重复重述比例','模板与材料一致','写集与真实 diff'])expect(s).toContain(label);}});
test('all six original semantic checks remain byte-for-byte intact',()=>{expect(read(analyze)).toContain(originalSix);expect(read(workflow)).toContain('六类（遗漏、矛盾、孤儿任务、越界、消费者、测试充分性）各给落点或排除理由，缺一即本步未完成；用 spec-analyze 执行同一核对。');});
test('step eleven selects actual source scope and independent record validation',()=>{const s=read(workflow).match(/^11\. ([^\n]*)/m)?.[1]??'';for(const v of ['独立','phases/index.md','Phase','相关规格原文','quality/tests/','check-reader-record.mjs','七段','五问原答','退出码'])expect(s).toContain(v);expect(s).toContain('已做与未做');});

// ORACLE-LOG-V2-TERMINAL: the B table (package -> independent Phase) and the
// C table (ten design items and findings dispositions) read the current v2
// bytes; a controlled copy that swaps one Phase AC or keeps a "fixed"
// assertion must be named by the same reader.
import { readdirSync } from 'node:fs';
import { reconcilePhaseCoverage, reconcileDesignLanding, reconcileFindings, parseFindingDispositionTable } from '../../skills/spec-plan/scripts/build-decision-baseline.mjs';

const TASK = 'execution-quality-build-code-hardening-20261119';
const taskPath = file => `specs/${TASK}/${file}`;
const phaseFiles = () => readdirSync(`specs/${TASK}/phases`).filter(file => /^P\d+.*\.md$/.test(file)).sort()
  .map(file => ({ path: `phases/${file}`, text: readFileSync(taskPath(`phases/${file}`), 'utf8') }));

test('phase and findings reconcile against v2 (ORACLE-LOG-V2-TERMINAL): ten-item design, package-Phase coverage and finding dispositions come from the real reader', () => {
  const log = readFileSync(taskPath('decision-log.md'), 'utf8');
  const spec = readFileSync(taskPath('spec.md'), 'utf8');
  const phaseIndex = readFileSync(taskPath('phases/index.md'), 'utf8');
  const coverage = reconcilePhaseCoverage({ decisionLog: log, phaseIndex, phases: phaseFiles() });
  expect(coverage.packages).toHaveLength(10);
  for (const pkg of coverage.packages) expect(pkg.missingItems, `package ${pkg.id} keeps all ten template items`).toEqual([]);
  expect(coverage.gaps, 'B table reconciles package, Phase, dependency and owner without an unnamed gap').toEqual([]);
  expect(coverage.rows.map(row => row.phase), 'packages map to their own independent Phase, not the terminal aggregator').toEqual(['P1', 'P2', 'P3', 'P5', 'P6', 'P7', 'P9', 'P4', 'P8', 'P10']);
  const landing = reconcileDesignLanding({ decisionLog: log, spec, phaseCoverage: coverage });
  expect(landing.gaps, 'C table lands every ten-item design and AC in the spec and Phases').toEqual([]);
  expect(coverage.packages[9].items.get('配套与影响').lines.join('\n')).toContain('配套移除');
  expect(coverage.packages[9].items.get('完整方案').lines.length).toBeGreaterThan(0);

  // Controlled B negative: take AC-P8-002 out of its Phase coverage.
  const swapped = phaseFiles().map(phase => phase.path.includes('P4-test-data')
    ? { ...phase, text: phase.text.replace('- **覆盖 AC**：AC-P8-001、AC-P8-002', '- **覆盖 AC**：AC-P8-001') }
    : phase);
  expect(reconcilePhaseCoverage({ decisionLog: log, phaseIndex, phases: swapped }).gaps
    .some(gap => gap.includes('包 8') && gap.includes('AC-P8-2'))).toBe(true);

  // Controlled C negatives: a fixed finding whose assertion is still present,
  // a fixed finding without a revision location, and an unclosed disposition.
  const kept = reconcileFindings({
    findings: [{ id: 'F-1', path: 'phases/P4-test-data.md', assertion: '缺配置时回退产品库' }],
    dispositions: [{ index: 1, status: 'fixed', location: '`phases/P4-test-data.md`' }],
    files: new Map([['phases/P4-test-data.md', '复核后仍写：缺配置时回退产品库']]),
  });
  expect(kept.gaps.some(gap => gap.includes('原断言仍在'))).toBe(true);
  const unproven = reconcileFindings({ findings: [{ id: 'F-3' }], dispositions: [{ index: 1, status: 'fixed', location: '' }] });
  expect(unproven.gaps.some(gap => gap.includes('没有修订位置'))).toBe(true);
  const dispositions = parseFindingDispositionTable([
    '## 逐项处置', '', '| 序号 | 状态 | 修订位置或尚需取得的事实 |', '| --- | --- | --- |',
    '| 1 | fixed | 已按当前 Phase 修正 |', '| 2 | needs_human | 原会话证据负责人 |', '',
  ].join('\n'));
  const pair = reconcileFindings({ findings: [{ id: 'F-1' }, { id: 'F-2' }], dispositions });
  expect(pair.gaps.some(gap => gap.includes('finding F-2 待人工处置'))).toBe(true);
  expect(pair.gaps.some(gap => gap.includes('没有对应 finding'))).toBe(false);
});

// P10 ORACLE-LOG-V2-TERMINAL independent cases: the B table names a Phase that
// lost a covered AC, the C table names a 完整方案 path with no landing and a
// placeholder companion item, and the findings closure keeps a label-only
// `fixed` open, vetoes a kept original assertion and reports a disposition
// denominator that does not match the findings. Each case runs the real reader
// on a controlled copy; the only thing changed is the named input.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { checkDecisionLogChain } from '../../tools/cli/check-decision-log-chain.mjs';
import { TEMPLATE_DESIGN_ITEMS } from '../../skills/spec-plan/scripts/build-decision-baseline.mjs';

const P10_ROOT = process.cwd();
const P10_ITEMS = ['原始需求', '最初方案', '发散与被否', '调研', '最终决定', '完整方案', '验收', '风险/回退', '未决/消费者/证据', '配套与影响'];
const p10Log = () => readFileSync(taskPath('decision-log.md'), 'utf8');
const p10Spec = () => readFileSync(taskPath('spec.md'), 'utf8');
const p10Index = () => readFileSync(taskPath('phases/index.md'), 'utf8');
const p10PhaseFiles = () => phaseFiles();
const p10Coverage = decisionLog => reconcilePhaseCoverage({ decisionLog, phaseIndex: p10Index(), phases: p10PhaseFiles() });
function p10TemplateShape(items = P10_ITEMS) {
  return ['# 决策日志（模板 v2 受控样例）', '', '## 4. 每包设计', '', '### 包 1：受控包', '',
    ...items.map((name, index) => `#### ${index + 1}. ${name}\n- 受控内容：${name}。\n`),
    '## 5. 跨包共享', '', '- 受控。', ''].join('\n');
}

test('P10 C table names an AC removed from its Phase coverage', () => {
  const coverage = p10Coverage(p10Log());
  const phase = coverage.phases.find(record => record.id === 'P4');
  expect(phase.coverage, 'P4 covers the package 8 ACs in the real material').toContain('AC-P8-002');
  const stripped = { ...phase, coverage: phase.coverage.filter(ac => ac !== 'AC-P8-002'), text: phase.text.replaceAll('AC-P8-002', 'AC-P8-00x') };
  const landing = reconcileDesignLanding({
    decisionLog: p10Log(), spec: p10Spec(), phaseIndex: p10Index(),
    phaseCoverage: { ...coverage, phases: coverage.phases.map(record => record.id === 'P4' ? stripped : record) },
  });
  const gap = landing.gaps.find(value => value.includes('包 8') && value.includes('AC-P8-2'));
  expect(gap, 'the removed AC is reported, not silently accepted').toBeDefined();
  expect(gap).toContain('AC-P8-2 未在 P4 的覆盖 AC 或正文出现');
});

test('P10 C table names a 完整方案 path with no landing', () => {
  const missing = 'tools/cli/p10-missing-path.mjs';
  const log = p10Log().replace('- 写集：`tools/cli/check-stage-steps.mjs`', `- 写集：\`${missing}\``);
  expect(log).toContain(missing);
  const landing = reconcileDesignLanding({ decisionLog: log, spec: p10Spec(), phaseIndex: p10Index(), phaseCoverage: p10Coverage(log) });
  const gap = landing.gaps.find(value => value.includes(missing));
  expect(gap, 'the unlanded path is reported by name').toBeDefined();
  expect(gap).toContain('完整方案路径');
  expect(gap).toContain('未在 spec/Phase/索引落点');
});

test('P10 C table rejects a placeholder companion item', () => {
  const log = p10Log().replace('- 配套调整：`reading_baseline`、`check-stage-steps`、`facts` 读取；安装根记录。', '- 配套调整：待定');
  expect(log).toContain('配套调整：待定');
  const landing = reconcileDesignLanding({ decisionLog: log, spec: p10Spec(), phaseIndex: p10Index(), phaseCoverage: p10Coverage(log) });
  const gap = landing.gaps.find(value => value.includes('配套项只有占位'));
  expect(gap, 'a placeholder is not a filled companion item').toBeDefined();
  expect(gap).toContain('配套调整');
  expect(gap).toContain('owner=包 1 作者');
});

test('P10 findings keep a label-only fixed open', () => {
  const result = reconcileFindings({
    findings: [{ id: 'F-P10-6' }],
    dispositions: [{ index: 1, status: 'fixed', location: '已按当前 Phase 修正，但没有引用、字节或测试' }],
    files: new Map(),
  });
  expect(result.fixed_total).toBe(1);
  expect(result.fixed_proven, 'the label alone never proves a fix').toBe(0);
  expect(result.rows[0].proven).toBe(false);
  expect(result.gaps.some(gap => gap.includes('没有可读修复证据'))).toBe(true);
});

test('P10 findings pass only when the fixed assertion is gone', () => {
  const files = new Map([['phases/P4-test-data.md', '复核后：配置缺失改由运行时报错，不再回退产品库。']]);
  const gone = reconcileFindings({
    findings: [{ id: 'F-P10-7a', path: 'phases/P4-test-data.md', assertion: '缺配置时回退产品库' }],
    dispositions: [{ index: 1, status: 'fixed', location: '`phases/P4-test-data.md`' }],
    files,
  });
  expect(gone.fixed_proven).toBe(1);
  expect(gone.rows[0].proven).toBe(true);
  expect(gone.gaps).toEqual([]);
  const kept = reconcileFindings({
    findings: [{ id: 'F-P10-7b', path: 'phases/P4-test-data.md', assertion: '复核后：配置缺失改由运行时报错' }],
    dispositions: [{ index: 1, status: 'fixed', location: '`phases/P4-test-data.md`' }],
    files,
  });
  expect(kept.rows[0].proven, 'a kept original assertion is not a fix').toBe(false);
  expect(kept.gaps.some(gap => gap.includes('原断言仍在'))).toBe(true);
});

test('P10 findings report a disposition denominator that does not match the findings', () => {
  const extra = reconcileFindings({
    findings: [{ id: 'F-P10-8' }],
    dispositions: [{ index: 1, status: 'fixed', location: '`spec.md`' }, { index: 2, status: 'needs_human', location: '原处置人' }],
    files: new Map([['spec.md', '受控内容']]),
  });
  expect(extra.gaps.some(gap => gap.includes('处置序号 2 没有对应 finding') && gap.includes('finding 共 1 条'))).toBe(true);
  const missing = reconcileFindings({
    findings: [{ id: 'F-P10-9a' }, { id: 'F-P10-9b' }],
    dispositions: [{ index: 1, status: 'needs_human', location: '原处置人' }],
    files: new Map(),
  });
  expect(missing.gaps.some(gap => gap.includes('finding F-P10-9b 的处置条数不是 1（0）'))).toBe(true);
});

test('P10 baseline rejects --task-root instead of silently ignoring it', () => {
  const result = spawnSync(process.execPath, [join(P10_ROOT, 'skills/spec-plan/scripts/build-decision-baseline.mjs'), '--task-root', join(P10_ROOT, 'specs', TASK), '--task', TASK], { cwd: P10_ROOT, encoding: 'utf8' });
  expect(result.status, `--task-root must be rejected even beside a legal --task; stderr=${result.stderr}`).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain('expected --decision-log');
  expect(result.stderr).toContain('--task');
});

test('P10 ten design items stay one list across template, baseline and chain checker', () => {
  const template = readFileSync('skills/decision-log/templates/decision-log-template-v2.md', 'utf8');
  const fromTemplate = [...template.matchAll(/^#### (\d+)\. (.+)$/gm)].map(match => match[2].trim());
  expect(fromTemplate).toEqual(P10_ITEMS);
  expect(TEMPLATE_DESIGN_ITEMS).toEqual(fromTemplate);
  const shaped = checkDecisionLogChain({ markdown: p10TemplateShape(fromTemplate) });
  expect(shaped.design_packages).toHaveLength(1);
  expect(shaped.design_packages[0].missing_items, 'the chain checker reads exactly the template items').toEqual([]);
});
