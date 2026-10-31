import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, realpathSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import YAML from 'js-yaml';
import { resolveSkillPackage } from '../../runtime/adapters/local-skill-resolver.mjs';
import { createHash } from 'node:crypto';
import { stageRuntimeCliMain } from '../../tools/cli/stage-runtime.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDecisionBaseline } from '../../skills/spec-plan/scripts/build-decision-baseline.mjs';
import { buildReviewMaterials } from '../../skills/wh-review/scripts/review-materials.mjs';
import { runSimpleReview } from '../../skills/wh-review/scripts/simple-review-runner.mjs';

const roots = [];
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) { expect(root.startsWith(realpathSync(tmpdir()) + '/p10-')).toBe(true); rmSync(root, { recursive: true }); } });
function root() { const value = realpathSync(mkdtempSync(join(tmpdir(), 'p10-materials-'))); roots.push(value); return value; }
const decisionLog = `# 决策日志
## 原来要求做成什么？
| 需求 | 原来要求什么 | 来源 | 落在哪 |
| --- | --- | --- | --- |
| 需求 1 | 取消后保留草稿 | 原需求:12 | 决定 1 |
| 需求 2 | 删除草稿须明确确认 | 原需求:13 | 决定 1 |
## 用户后来改了什么？
| 答复 | 用户要什么（最小决定） | 落在哪 | 原件 |
| --- | --- | --- | --- |
| 答复 1 | 曾要求取消即删除，已由答复 2 纠正 | 决定 1 | Talk:A1 |
| 答复 2 | 删除草稿须明确确认 | 决定 1 | Talk:A2 |
## 工作包
#### 决定 1 — 保留草稿直到确认删除
**选择**：取消只关闭编辑器，保留当前草稿。
**理由**：避免丢失用户输入。
**影响**：关闭与删除分开。
`;
const grouping = `| 组 | 用户定了什么 | 覆盖的用户答复 | 落在哪 |
| --- | --- | --- | --- |
| A 草稿安全 | 保留与确认删除 | 用户答复 1、2 | 编辑流程 |
`;

function materials() {
  // Synthetic companion prose exercises packet transport, not production
  // baseline quality or a minimum document size.
  const body = 'A cancellation keeps the user draft until an explicit delete confirmation.\n'.repeat(24);
  return { decision_baseline: '# Accepted decisions\n' + body, draft_spec: '# Specification\n' + body,
    acceptance_criteria: '# Acceptance\n' + body,
    phase_authorities: { 'phases/P1.md': '# Phase P1\n' + body },
    phase_index: '## Execution Index\n\n| Phase | Authority |\n| --- | --- |\n| P1 | phases/P1.md |\n\n' + body };
}
function transport(attachmentRoot, observe = () => {}) {
  const calls = [];
  return { calls, dependencies: {
    loadConfig: () => ({ whReview: {}, config: '/unused', attachmentRoot, command: ['unused'] }),
    resolveRoute: () => ({ initial: ['other/model'], mode: 'single_round' }),
    selectProviders: () => ({ providers: ['other/model'], provider_models: { 'other/model': 'fixture-model' } }),
    client: { async runGroup(request) { const files = Object.fromEntries(request.materials.deliveryManifest.map(e => [e.path, readFileSync(join(request.materials.bundleRoot, e.path), 'utf8')])); calls.push(files); observe(files); return { runtimeId: 'p10-fixture', outcome: 'unavailable', providers: [] }; } },
  } };
}

describe('ORACLE-C07-REVIEW materials', () => {
  it('resolves the real author bundle and executes its portable baseline CLI with a real source-failure boundary', () => {
    const manifestPath = 'workflows/build-plan/skill-deps.yaml';
    const manifest = YAML.load(readFileSync(manifestPath, 'utf8'));
    const dependency = manifest.skills.find(entry => entry.name === 'spec-plan');
    const resolved = resolveSkillPackage({ packageRoot: process.cwd(), manifestPath, dependency });
    const cli = join(process.cwd(), 'skills/spec-plan/scripts/build-decision-baseline.mjs');
    expect(resolved.resolved_bundle_paths).toContain(cli);
    expect(resolved.resolved_bundle_paths).toContain(join(process.cwd(), 'skills/spec-plan/scripts/check-reader-record.mjs'));
    expect(resolved.resolved_bundle_paths).toContain(join(process.cwd(), 'skills/spec-plan/scripts/check-authoring-budget.mjs'));
    const portable = root(), portableCli = join(portable, 'baseline.mjs');
    writeFileSync(portableCli, readFileSync(cli)); writeFileSync(join(portable, 'decision-log.md'), decisionLog); writeFileSync(join(portable, 'spec.md'), grouping);
    const argv = [portableCli, '--decision-log', 'decision-log.md', '--spec', 'spec.md'];
    const ok = spawnSync(process.execPath, argv, { cwd: portable, encoding: 'utf8' });
    expect(ok.status).toBe(0); expect(ok.stdout).toContain('需求 1：取消后保留草稿'); expect(ok.stdout).toContain('答复 2：删除草稿须明确确认');
    const missing = spawnSync(process.execPath, [portableCli, '--decision-log', 'missing.md'], { cwd: portable, encoding: 'utf8' });
    expect(missing.status).toBe(1); expect(missing.stderr).toContain('ENOENT'); expect(missing.stdout).toBe('');
    // Exercise the existing resolver on an incomplete deployed package. The
    // package is temporary test input, never a retained evidence snapshot.
    const broken = root(); mkdirSync(join(broken, 'workflows/build-plan'), { recursive: true });
    writeFileSync(join(broken, manifestPath), readFileSync(manifestPath));
    for (const source of resolved.resolved_bundle_paths.filter(path => path !== cli)) {
      const target = join(broken, source.slice(process.cwd().length + 1)); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, readFileSync(source));
    }
    const bundlePath = join(broken, 'skills/spec-plan/skill-bundle.json'); writeFileSync(bundlePath, readFileSync('skills/spec-plan/skill-bundle.json'));
    expect(() => resolveSkillPackage({ packageRoot: broken, manifestPath, dependency })).toThrow(/build-decision-baseline|missing|ENOENT/i);
  });

  it('derives requirements, grouped replies and decisions from supplied source bytes', () => {
    const result = buildDecisionBaseline({ decisionLog, spec: grouping, decisionRef: 'specs/fixture/decision-log.md', specRef: 'specs/fixture/spec.md' });
    expect(result).toContain('需求 1：取消后保留草稿');
    expect(result).toContain('需求 2：删除草稿须明确确认');
    expect(result).toContain('A 草稿安全');
    expect(result).toContain('答复 1：曾要求取消即删除，已由答复 2 纠正');
    expect(result).toContain('答复 2：删除草稿须明确确认');
    expect(result).toContain('决定 1 — 保留草稿直到确认删除');
    expect(result).toContain('取消只关闭编辑器，保留当前草稿');
    expect(result).toMatch(/specs\/fixture\/decision-log\.md#L\d+/);
    expect(result).toContain('**理由**：避免丢失用户输入。');
  });

  it('accepts current template source IDs and paragraph replies without C07 numbering', () => {
    const source = `# 决策日志
## 原始需求
| source_id | 需求/约束 | 来源引用 | 落点 |
| --- | --- | --- | --- |
| R-007 | 取消只关闭编辑器 | user-request.md:4 | 决定 1 |
| R-019 | 保留用户草稿 | user-request.md:5 | 决定 1 |
## 需求变更记录
U-012 最小决定：删除前须明确确认；影响决定 1；唯一原件 quality/evidence/changes.md#L8。
## 工作包与决定
#### 决定 1 — 保留草稿
**选择**：取消只关闭编辑器，删除前确认。
**理由**：用户可能继续编辑。
`;
    const baseline = buildDecisionBaseline({ decisionLog: source, decisionRef: 'specs/new-task/decision-log.md' });
    expect(baseline).toContain('R-007'); expect(baseline).toContain('R-019'); expect(baseline).toContain('U-012');
    expect(baseline).toContain('删除前须明确确认'); expect(baseline).toContain('quality/evidence/changes.md#L8');
    expect(baseline).toContain('user-request.md:4'); expect(baseline).toContain('specs/new-task/decision-log.md#L');
    expect(baseline).not.toContain('主题分组：spec.md');
  });

  it.each(['决定 1', 'ADR-007', 'M1', 'N6', 'D-010'])('preserves the full %s decision including reasons, candidates, code and quotes', id => {
    const prefix = decisionLog.slice(0, decisionLog.indexOf('#### 决定 1')).replaceAll('决定 1', id);
    const block = [
      `#### ${id} — 保留草稿直到明确确认删除`,
      '- **做什么**：取消仅关闭编辑器；保存草稿供下次继续。',
      '  - 原因：取消可能是暂时离开，不代表同意永久删除。',
      '- **不做什么**：不把关闭当删除，不替用户回答确认。',
      '- **风险**：旧草稿过期时提示用户，由编辑器 owner 恢复。',
      '- **改动**：`editor.mjs` 的 `closeDraft`；唯一 writer 为编辑器维护者。',
      '- **放弃的候选与理由**：不在每次关闭时删除，因为会丢失尚未保存的修改。',
      '##### 失败恢复',
      '若持久化失败，保留内存草稿并向用户显示错误。',
      '```text',
      '#### M99 — 代码里的伪决定',
      '| source_id | 需求/约束 | 来源引用 | 落点 |',
      '| --- | --- | --- | --- |',
      '| R-999 | 代码里的伪来源 | example | M99 |',
      '```',
      '> #### M98 — 引用里的伪决定',
      '> 原话：不要把这里的示例识别为本次决定。',
    ].join('\n');
    const baseline = buildDecisionBaseline({ decisionLog: prefix + block });
    expect(baseline).toContain(block);
    expect(baseline).toContain('decision-log.md#L13');
    expect(baseline.match(/^来源：decision-log\.md#L/gm)).toHaveLength(1);
    expect(baseline).not.toContain('需求 R-999：');
  });

  it('retains source ranges, verbatim declarations and reply corrections outside table cells', () => {
    const source = decisionLog
      .replace('## 原来要求做成什么？', '## 原来要求做成什么？\n\n**用户逐字声明**：\n> 关闭编辑器不代表同意永久删除。\n')
      .replace('## 用户后来改了什么？', '| source_id 范围 | 内容 | 落点 |\n| --- | --- | --- |\n| R-023～R-028 | 不减少现有验收，归档操作单独确认 | 归档契约 |\n\n## 用户后来改了什么？')
      .replace('## 工作包', '答复 2 只更正确认形式，不撤销保留草稿及失败恢复义务。\n\n## 工作包');
    const baseline = buildDecisionBaseline({ decisionLog: source });
    expect(baseline).toContain('R-023～R-028');
    expect(baseline).toContain('不减少现有验收，归档操作单独确认');
    expect(baseline).toContain('> 关闭编辑器不代表同意永久删除。');
    expect(baseline).toContain('答复 2 只更正确认形式，不撤销保留草稿及失败恢复义务。');
  });

  it('accepts an explicit sourced absence of later replies without inventing U records', () => {
    const noReplies = decisionLog.replace(/\| 答复 \|[\s\S]*?(?=## 工作包)/, '已核对原始消息 user-request.md:4；本任务没有后续用户答复或需求变更。\n');
    const result = buildDecisionBaseline({ decisionLog: noReplies });
    expect(result).toContain('用户答复（0 条');
    expect(result).toContain('本任务没有后续用户答复或需求变更');
    expect(result).toContain('user-request.md:4');
    expect(() => buildDecisionBaseline({ decisionLog: noReplies.replace('已核对原始消息 user-request.md:4；本任务没有后续用户答复或需求变更。', '') })).toThrow(/BASELINE_SOURCE_INVALID/);
  });

  it('binds reply themes to the actual U IDs and rejects duplicate coverage', () => {
    const source = decisionLog.replaceAll('需求 1', 'R-007').replaceAll('需求 2', 'R-019')
      .replace('| 需求 |', '| source_id |').replaceAll('答复 1', 'U-003').replaceAll('答复 2', 'U-012').replace('| 答复 |', '| U |');
    const themes = grouping.replace('用户答复 1、2', 'U-003、U-012');
    expect(buildDecisionBaseline({ decisionLog: source, spec: themes })).toContain('A 草稿安全');
    expect(() => buildDecisionBaseline({ decisionLog: source, spec: themes.replace('U-003、U-012', 'U-003、U-003') })).toThrow(/cover each supplied reply/);
  });

  it.each([
    ['missing requirements', decisionLog.replace(/\| 需求 1[^\n]*\n\| 需求 2[^\n]*\n/, '')],
    ['duplicate requirements', decisionLog.replace('| 需求 2 |', '| 需求 1 |')],
    ['duplicate replies', decisionLog.replace('| 答复 2 |', '| 答复 1 |')],
    ['missing decisions', decisionLog.slice(0, decisionLog.indexOf('#### 决定 1'))],
    ['empty decision', decisionLog.slice(0, decisionLog.indexOf('**选择**'))],
    ['duplicate decision', decisionLog + '\n#### 决定 1 — 重复\n**选择**：重复不是另一份来源。\n'],
  ])('rejects %s rather than silently returning a partial baseline', (_label, source) => {
    expect(() => buildDecisionBaseline({ decisionLog: source })).toThrow(/BASELINE_SOURCE_INVALID/);
  });

  it.each(['/host/decision-log.md', '../decision-log.md', 'x/../decision-log.md'])('rejects invalid source ref %s', decisionRef => {
    expect(() => buildDecisionBaseline({ decisionLog, decisionRef })).toThrow(/source refs must be relative/);
  });

  it('preserves large UTF8 decisions without an artificial size threshold or truncation', () => {
    const payload = '界'.repeat(80 * 1024) + '完整决定尾标记';
    const source = decisionLog.replace('取消只关闭编辑器，保留当前草稿。', payload);
    const result = buildDecisionBaseline({ decisionLog: source });
    expect(Buffer.byteLength(result)).toBeGreaterThan(96 * 1024); // exceeds both removed historical limits
    expect(result).toContain(payload);
    expect(result).toContain('**理由**：避免丢失用户输入。');
  });

  it('keeps escaped table delimiters and literal spaces in source text', () => {
    const source = decisionLog.replace('取消后保留草稿', '保留  两个空格与 \\| 管道');
    expect(buildDecisionBaseline({ decisionLog: source })).toContain('保留  两个空格与 \\| 管道');
  });

  it('delivers a fresh four-field author baseline from the portable CLI into both actual role packets', async () => {
    const portable = root();
    const source = `# 新草稿任务决策日志
## 原始需求
| source_id | 需求/约束 | 来源引用 | 落点 |
| --- | --- | --- | --- |
| R-071 | 取消编辑只关闭界面，重新打开时草稿仍在 | user-request.md:4 | ADR-009 |
| R-083 | 永久删除前须取得当前用户明确确认 | user-request.md:5 | ADR-009 |
## 需求变更记录
U-014 最小决定：此前把取消等同删除的建议作废，保留关闭与删除两个独立动作；来源 user-reply.md:8；影响 ADR-009。
## 工作包与决定
#### ADR-009 — 关闭编辑器时保留草稿
- **做什么**：用户取消时关闭编辑界面，保存草稿与其版本；再次打开显示原内容，删除只从独立确认动作进入。
  - 来源为 R-071、R-083 与 U-014。保留草稿让用户可以稍后继续，不把暂时离开解释成放弃输入。
- **不做什么**：不自动永久删除，不用一次历史确认覆盖后续另一份草稿；未取得答复时保持草稿，不替用户选择。
- **风险**：保存失败会造成界面关闭而修改丢失，因此先完成保存再关闭；失败时保持编辑界面与内存草稿，并给出可重试的错误。
- **改动**：编辑器维护者唯一修改 editor.mjs 的 closeDraft 与 deleteDraft，以及对应动作测试；确认视图引用同一草稿版本。
- **拒绝的候选与理由**：拒绝关闭时立即删除，因取消不是永久删除授权；拒绝默默保留失败，因为用户会误以为修改已经保存。
`;
    writeFileSync(join(portable, 'decision-log.md'), source);
    const result = spawnSync(process.execPath, [join(process.cwd(), 'skills/spec-plan/scripts/build-decision-baseline.mjs'), '--decision-log', 'decision-log.md'], { cwd: portable, encoding: 'utf8' });
    expect(result.status).toBe(0); expect(result.stdout).not.toBe('');
    expect(result.stdout).toContain('拒绝关闭时立即删除'); expect(result.stdout).toContain('先完成保存再关闭');
    const m = materials(), { calls, dependencies } = transport(root()); m.decision_baseline = result.stdout;
    await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: m }, dependencies);
    expect(calls).toHaveLength(2);
    for (const files of calls) expect(Object.entries(files).find(([path]) => path.includes('decision_baseline'))?.[1]).toBe(result.stdout);
  });

  it('accepts compact nonempty post materials without a minimum byte quota', async () => {
    const m = materials(), { calls, dependencies } = transport(root());
    m.decision_baseline = '# 决定\n取消保留草稿，删除须确认；来源 decision-log.md#L4。';
    m.draft_spec = '# Spec\n取消关闭界面并保留草稿，确认删除走独立动作。';
    m.acceptance_criteria = '# 验收\n取消后重新打开草稿仍在，未确认不得删除。';
    m.phase_authorities = { 'phases/P1.md': '# Phase P1\n维护编辑器关闭和删除入口，并验证草稿恢复。' };
    m.phase_index = '## Execution Index\n\n| Phase | Authority |\n| --- | --- |\n| P1 | phases/P1.md |\n';
    await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: m }, dependencies);
    expect(calls).toHaveLength(2);
    for (const files of calls) expect(Object.entries(files).find(([path]) => path.includes('decision_baseline'))?.[1]).toBe(m.decision_baseline);
  });

  it.each([
    '> 本任务没有后续用户答复或需求变更。',
    '```text\n本任务没有后续用户答复或需求变更。\n```',
  ])('does not treat a quoted or fenced absence as an actual reply source', example => {
    const source = decisionLog.replace(/\| 答复 \|[\s\S]*?(?=## 工作包)/, example + '\n');
    expect(() => buildDecisionBaseline({ decisionLog: source })).toThrow(/BASELINE_SOURCE_INVALID/);
  });

  it.each([
    '历史报告写道：“本任务没有后续用户答复或需求变更。”此处仅引历史报告，并非本任务已核实结论。',
    '示例文字为 `本任务没有后续用户答复或需求变更。`，未取得本任务真实答复。',
    '假设如下：\n本任务没有后续用户答复或需求变更。',
    '本任务没有后续用户答复或需求变更。这只是历史报告的结论，并非本任务已核实结论。',
    '若本任务没有后续用户答复或需求变更，则按无变更处理；当前尚未核对。',
  ])('requires a current explicit absence rather than historical, inline or hypothetical prose', example => {
    const source = decisionLog.replace(/\| 答复 \|[\s\S]*?(?=## 工作包)/, example + '\n');
    expect(() => buildDecisionBaseline({ decisionLog: source })).toThrow(/BASELINE_SOURCE_INVALID/);
  });

  it.each([
    '| 来源 | 原义和来源类型 | 唯一原件位置 | 当前落点 |\n| --- | --- | --- | --- |\n| R-007 | 文档转述：取消后保留草稿 | source.md:4 | 决定 1 |\n| R-019 | 原用户要求：删除前确认 | message.md:8 | 决定 1 |',
    '| 原义和来源类型 | 当前落点 | 来源 | 唯一原件位置 |\n| --- | --- | --- | --- |\n| 文档转述：取消后保留草稿 | 决定 1 | R-007 | source.md:4 |\n| 原用户要求：删除前确认 | 决定 1 | R-019 | message.md:8 |',
  ])('reads semantic source columns in the requirement section without a literal header or column-order gate', table => {
    const source = decisionLog.replace(/\| 需求 \|[\s\S]*?(?=## 用户后来)/, table + '\n');
    const result = buildDecisionBaseline({ decisionLog: source });
    for (const text of ['R-007', 'R-019', '文档转述：取消后保留草稿', '原用户要求：删除前确认', 'source.md:4', 'message.md:8']) expect(result).toContain(text);
  });

  it.each([
    ['source_id', 'source.md:4'],
    ['来源编号', 'source.md:4'],
    ['source_id', 'R-900'],
  ])('prefers explicit %s over an earlier generic source column containing %s', (idHeader, sourceRef) => {
    const table = `| 来源 | 原义和来源类型 | ${idHeader} | 当前落点 |\n| --- | --- | --- | --- |\n| ${sourceRef} | 文档转述：保留草稿 | R-007 | 决定 1 |\n`;
    const source = decisionLog.replace(/\| 需求 \|[\s\S]*?(?=## 用户后来)/, table);
    const result = buildDecisionBaseline({ decisionLog: source });
    expect(result).toContain('- 需求 R-007：文档转述：保留草稿');
    expect(result).toContain(sourceRef);
    expect(result).not.toContain('- 需求 R-900：');
  });

  it.each(['INVALID-ID', ''])('rejects an invalid explicit source_id %j instead of borrowing a valid generic source value', id => {
    const table = `| 来源 | 原义和来源类型 | source_id | 当前落点 |\n| --- | --- | --- | --- |\n| R-900 | 文档转述：保留草稿 | ${id} | 决定 1 |\n`;
    const source = decisionLog.replace(/\| 需求 \|[\s\S]*?(?=## 用户后来)/, table);
    expect(() => buildDecisionBaseline({ decisionLog: source })).toThrow(/BASELINE_SOURCE_INVALID: invalid 需求 source/);
  });

  it('prefers explicit U source_id over a reply source reference in an earlier column', () => {
    const table = '| 来源 | 最小决定 | source_id | 落点 |\n| --- | --- | --- | --- |\n| talk.md:8 | 删除须确认，不批准本稿方案 | U-012 | 决定 1 |\n';
    const source = decisionLog.replace(/\| 答复 \|[\s\S]*?(?=## 工作包)/, table);
    const result = buildDecisionBaseline({ decisionLog: source });
    expect(result).toContain('- 答复 U-012：删除须确认，不批准本稿方案');
    expect(result).toContain('talk.md:8');
  });

  it('does not borrow requirement rows from a later reference table to conceal missing source records', () => {
    const source = decisionLog.replace(/\| 需求 \|[\s\S]*?(?=## 用户后来)/, '') + '\n## 外置事实索引\n| source_id | 需求/约束 | 来源引用 | 落点 |\n| --- | --- | --- | --- |\n| R-999 | 引用表而非当前需求 | old.md:4 | 历史决定 |\n';
    expect(() => buildDecisionBaseline({ decisionLog: source })).toThrow(/BASELINE_SOURCE_INVALID/);
  });

  it('preserves the written reply paragraph and its declared source basis without treating it as plan approval', () => {
    const paragraph = 'written。U-012 承接真实已答选择：“复用现有读口，剩余清单留后续任务。”原件为 sources/talk.md:8–12；仅约束来源解释，不表示确认本稿技术选择。';
    const source = decisionLog.replace('## 原来要求做成什么？', '## 任务身份\n业务代码根 B 是另一业务库；B/ 是该库相对路径，不指本稿仓库。\n\n## 原来要求做成什么？')
      .replace(/\| 答复 \|[\s\S]*?(?=## 工作包)/, paragraph + '\n');
    const result = buildDecisionBaseline({ decisionLog: source });
    expect(result).toContain(paragraph);
    expect(result).toContain('业务代码根 B 是另一业务库；B/ 是该库相对路径，不指本稿仓库。');
  });

  it.each([
    '示例文字为 `written。U-012 选择引用而不是本次答复，来源 old.md:4。`。',
    '> written。U-012 只引用旧报告，并非本次答复。',
    '~~~text\nwritten。U-012 只是示例。\n~~~',
  ])('does not promote a quoted or example written U label to an actual reply record', example => {
    const source = decisionLog.replace(/\| 答复 \|[\s\S]*?(?=## 工作包)/, example + '\n');
    expect(() => buildDecisionBaseline({ decisionLog: source })).toThrow(/BASELINE_SOURCE_INVALID/);
  });

  it('does not borrow written U records from the external-reference section', () => {
    const source = decisionLog.replace(/\| 答复 \|[\s\S]*?(?=## 工作包)/, '') + '\n## 外置事实索引\nwritten。U-012 历史引用，来源 old.md:4。\n';
    expect(() => buildDecisionBaseline({ decisionLog: source })).toThrow(/BASELINE_SOURCE_INVALID/);
  });

  it('preserves original nonconsecutive Chinese IDs without inventing missing records', () => {
    const source = decisionLog.replaceAll('需求 1', '需求 7').replaceAll('需求 2', '需求 12').replaceAll('答复 1', '答复 9').replaceAll('答复 2', '答复 14');
    const result = buildDecisionBaseline({ decisionLog: source });
    for (const id of ['需求 7', '需求 12', '答复 9', '答复 14']) expect(result).toContain(id);
    expect(result).not.toContain('non-contiguous');
  });

  it('keeps legacy source ID padding while retaining the existing numeric theme binding', () => {
    const source = decisionLog.replaceAll('需求 1', '需求 007').replaceAll('需求 2', '需求 012').replaceAll('答复 1', '答复 009').replaceAll('答复 2', '答复 014');
    const spec = grouping.replace('用户答复 1、2', '用户答复 009、014');
    const result = buildDecisionBaseline({ decisionLog: source, spec });
    for (const id of ['需求 007', '需求 012', '答复 009', '答复 014']) expect(result).toContain(id);
    expect(result).toContain('A 草稿安全');
  });

  it('uses the reply-theme table without confusing a later identifier crosswalk for another group', () => {
    const spec = grouping + '\n\n| 用户答复 | 编号 | 对照 | 编号 |\n| --- | --- | --- | --- |\n| 用户答复 1 | U-01 | 用户答复 2 | U-02 |\n';
    expect(buildDecisionBaseline({ decisionLog, spec })).toContain('A 草稿安全');
  });

  it('delivers baseline bytes and makes full raw requirements optional at the real request seam', async () => {
    const expected = materials(), { calls, dependencies } = transport(root());
    await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: expected }, dependencies);
    expect(calls.length).toBeGreaterThan(0);
    for (const files of calls) {
      expect(Object.entries(files).find(([path]) => path.includes('decision_baseline'))?.[1]).toBe(expected.decision_baseline);
      expect(Object.keys(files).some(path => path.includes('raw_requirement'))).toBe(false);
    }
  });

  it.each(['missing', 'empty', 'descriptor'])('rejects %s baseline before any provider call', async kind => {
    const m = materials(), { calls, dependencies } = transport(root());
    if (kind === 'missing') delete m.decision_baseline;
    if (kind === 'empty') m.decision_baseline = '';
    if (kind === 'descriptor') m.decision_baseline = { ref: 'decision-log.md', sha256: 'a'.repeat(64) };
    const result = await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: m }, dependencies);
    expect(result.error.code).toBe('MATERIAL_MISSING'); expect(calls).toHaveLength(0);
  });

  it.each([
    ['JSON object', { decisions: 'A descriptive-looking object still is not Markdown decision text. '.repeat(30) }],
    ['JSON array', ['Array material cannot replace the accepted decision baseline. '.repeat(30)]],
  ])('rejects a large %s baseline before provider dispatch', async (_label, value) => {
    const m = materials(), { calls, dependencies } = transport(root()); m.decision_baseline = value;
    expect(Buffer.byteLength(JSON.stringify(value))).toBeGreaterThan(1024);
    const result = await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: m }, dependencies);
    expect(result.error.code).toBe('MATERIAL_MISSING'); expect(calls).toHaveLength(0);
  });

  it.each(['decision_baseline', 'raw_requirement'])('delivers large %s text intact without an artificial byte quota', async key => {
    const m = materials(), { calls, dependencies } = transport(root());
    const text = '# 完整原文\n' + '用户选择及其依据、否定边界与恢复责任。\n'.repeat(6000) + '完整投递尾标记';
    m[key] = text;
    await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: m }, dependencies);
    expect(calls).toHaveLength(2);
    for (const files of calls) expect(Object.entries(files).find(([path]) => path.includes(key))?.[1]).toBe(text);
  });

  it('rejects required spec descriptors even when their serialized object exceeds 1 KiB', async () => {
    const m = materials(), { calls, dependencies } = transport(root());
    m.draft_spec = { ref: 'x'.repeat(1200), sha256: 'a'.repeat(64) };
    const result = await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: m }, dependencies);
    expect(result.error.code).toBe('MATERIAL_MISSING'); expect(calls).toHaveLength(0);
  });

  it.each([{ legacy: true }, { request_version: 1 }])('preserves a genuinely marked historical request and discloses its baseline gap: %j', async marker => {
    const m = materials(), { calls, dependencies } = transport(root()); delete m.decision_baseline;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', ...marker, materials: m }, dependencies);
    expect(calls.length).toBeGreaterThan(0);
    expect(warning.mock.calls.flat().join('\n')).toContain('LEGACY_DECISION_BASELINE_MISSING');
    for (const files of calls) expect(files['review-instructions.md']).toContain('LEGACY_DECISION_BASELINE_MISSING');
  });

  it.each(['matching bytes', 'wrong hash', 'current matching baseline'])('resolves descriptors only through the existing public owner: %s', async mode => {
    const base = root(), repo = join(base, 'repo'), work = join(base, 'worktree');
    const task = join(base, 'Projects', 'workflowhub', 'tasks', 'p10-ref-fixture');
    mkdirSync(repo); mkdirSync(task, { recursive: true }); mkdirSync(join(base, 'hooks'));
    const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
    for (const key of Object.keys(env)) if (key.startsWith('GIT_') && !['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_SYSTEM', 'GIT_CONFIG_NOSYSTEM'].includes(key)) delete env[key];
    const git = (...args) => execFileSync('git', args, { cwd: repo, env, stdio: ['ignore', 'pipe', 'pipe'] });
    git('init', '-q', '-b', 'main'); git('config', 'user.name', 'P10 controlled fixture'); git('config', 'user.email', 'p10@example.invalid'); git('config', 'commit.gpgsign', 'false'); git('config', 'core.hooksPath', join(base, 'hooks'));
    const m = materials(), originalBytes = Buffer.from(m.draft_spec), baselineBytes = Buffer.from(m.decision_baseline);
    const current = mode === 'current matching baseline';
    writeFileSync(join(repo, 'spec.md'), originalBytes);
    if (current) writeFileSync(join(repo, 'baseline.md'), baselineBytes);
    git('add', 'spec.md', ...(current ? ['baseline.md'] : [])); git('commit', '-qm', 'controlled fixture'); git('worktree', 'add', '-q', '-b', 'task/workflowhub/p10-ref-fixture', work, 'main');
    writeFileSync(join(task, 'task.json'), JSON.stringify({ schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'p10-ref-fixture', target_repo_root: repo, workspace_mode: 'existing', workspace_root: work, activation_cohort: 'post', record_model: 'vnext-single-write', inputs: {} }));
    writeFileSync(join(task, 'facts.jsonl'), ''); mkdirSync(join(task, 'quality', 'evidence'), { recursive: true });
    if (current) m.decision_baseline = { ref: 'baseline.md', sha256: createHash('sha256').update(baselineBytes).digest('hex') };
    else delete m.decision_baseline;
    m.draft_spec = { ref: 'spec.md', sha256: mode === 'wrong hash' ? '0'.repeat(64) : createHash('sha256').update(originalBytes).digest('hex') };
    const input = join(task, 'quality', 'evidence', 'request.json');
    writeFileSync(input, JSON.stringify({ request: { stage: 'build-plan', surface: 'document', ...(current ? {} : { legacy: true }), materials: m } }));
    const { calls, dependencies } = transport(base), previousStorage = process.env.WORKFLOWHUB_TASK_DIR;
    process.env.WORKFLOWHUB_TASK_DIR = base;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const promise = stageRuntimeCliMain(['review', '--action=record', '--stage=build-plan', '--project=workflowhub', '--task=p10-ref-fixture', `--task-path=${task}`, '--input=quality/evidence/request.json'], { cwd: work, services: { runReviewRound: request => runSimpleReview(request, dependencies) } });
      if (mode === 'wrong hash') { await expect(promise).rejects.toThrow(/sha256 mismatch/); expect(calls).toHaveLength(0); }
      else {
        await promise; expect(calls.length).toBeGreaterThan(0);
        for (const files of calls) expect(Object.entries(files).find(([path]) => path.includes('draft_spec'))?.[1]).toBe(originalBytes.toString('utf8'));
        if (current) {
          for (const files of calls) expect(Object.entries(files).find(([path]) => path.includes('decision_baseline'))?.[1]).toBe(baselineBytes.toString('utf8'));
          expect(warning.mock.calls.flat().join('\n')).not.toContain('LEGACY_DECISION_BASELINE_MISSING');
        } else expect(warning.mock.calls.flat().join('\n')).toContain('LEGACY_DECISION_BASELINE_MISSING');
      }
    } finally { if (previousStorage === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previousStorage; }
  });

  it('keeps the existing low-level packet transport and its short-input warning semantics', () => {
    const m = materials(); delete m.decision_baseline; m.draft_spec = 'Short existing transport input';
    const packet = buildReviewMaterials({ stage: 'build-plan', activationCohort: 'post', attachmentRoot: root(), materials: m });
    try { expect(readFileSync(join(packet.bundleRoot, 'review-instructions.md'), 'utf8')).toContain('Supplied material is incomplete: decision_baseline'); }
    finally { packet.dispose(); }
  });
});
