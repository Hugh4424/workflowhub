import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const categories = ['语义与解释权', '目标与边界', '成败与风险', '验收与证据成本', '影响面与顺序'];
function section(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return '';
  const rest = text.slice(start + heading.length);
  return rest.split(/\n#{1,6} /)[0];
}
function fiveErrors(talk, decision) {
  const body = section(talk, '### 5. 范围五类判定');
  const errors = categories.filter(name => !body.includes(name));
  for (const term of ['已答', '事实可定', '待你定', '谁来定', '讨论前展示', '讨论后', '3–5', '确认']) if (!body.includes(term)) errors.push(term);
  for (const term of ['A 真实痛点', 'B 复杂度与 ROI', 'C 风险与影响范围', 'D 时机', '证据', '主观']) if (!body.includes(term)) errors.push(term);
  for (const slug of ['9. `module-convergence`', '10. `detail-advice`']) {
    const part = decision.slice(decision.indexOf(slug)).split(/\n\d+\. `/)[0];
    for (const term of ['五类', '骨架', '讨论前展示', '讨论后', '确认']) if (!part.includes(term)) errors.push(`${slug}: ${term}`);
  }
  return errors;
}
describe('ORACLE-N11-FIVE-CATEGORIES', () => {
  it('requires five categories, evidence basis, ownership and both discussion steps in actual methods', () => {
    expect(fiveErrors(read('skills/talk-with-zhipeng/SKILL.md'), read('workflows/make-decision/SKILL.md'))).toEqual([]);
  });
  it('rejects a four-dimension-only controlled method', () => {
    const talk = read('skills/talk-with-zhipeng/SKILL.md').replace('### 5. 范围五类判定', '### 5. 范围四维判定');
    expect(fiveErrors(talk, read('workflows/make-decision/SKILL.md'))).toContain('语义与解释权');
  });
  it('rejects missing before-display despite retaining after-summary', () => {
    const talk = read('skills/talk-with-zhipeng/SKILL.md').replaceAll('讨论前展示', '');
    expect(fiveErrors(talk, read('workflows/make-decision/SKILL.md'))).toContain('讨论前展示');
  });
});

// ORACLE-N11-STEP-COVERAGE: controlled real CLI/report boundary, not a mocked report.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as checker from '../../tools/cli/run-checks.mjs';
const cli = resolve(new URL('../../tools/cli/run-checks.mjs', import.meta.url).pathname);
function coverageFixture(completed = []) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'n11-p2-steps-')));
  const repo = join(root, 'repo'), task = join(root, 'task'), materials = join(repo, 'specs/controlled');
  const put = (base, path, value) => { const file = join(base, path); mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
  mkdirSync(materials, { recursive: true });
  put(task, 'task.json', { schema_version: '1.0.0', task_id: 'controlled', baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post' });
  put(materials, 'decision-log.md', '# Controlled complex fixture\n');
  const source = 'workflows/make-decision/steps.json';
  const slugs = ['first-owned-step', 'second-owned-step'];
  const steps = slugs.map((slug, index) => ({ step_id: index + 1, step_slug: slug, observable_result: 'Read the exact controlled observation. 判定消费：SKILL.md#方法；原件：controlled human record', completion_evidence: [{ kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' }] }));
  put(repo, source, { schema_version: '2.0.0', stage_slug: 'make-decision', steps });
  put(repo, 'workflows/make-decision/SKILL.md', '# Controlled method\n## 方法\nRead the controlled observation.\n');
  put(materials, 'step-consumer-design.md', slugs.map(slug => `| [controlled](../../${source}#L1) \`${slug}\` | observation | human | owner |`).join('\n'));
  const entries = completed.map(slug => {
    const ref = `quality/evidence/${slug}.json`;
    put(task, ref, { source, step_slug: slug, reader: 'controlled fixture reader', inputs: ['controlled observation'], observation: 'The named controlled output was read.', criteria_ref: 'workflows/make-decision/SKILL.md#方法', conclusion: 'completed', limits: [] });
    return { ref, source, step_slug: slug };
  });
  put(task, 'facts.jsonl', JSON.stringify({ record_kind: 'stage', task_id: 'controlled', stage: 'make-decision', source: 'controlled test inputs, not real user approval', evidence: { value: entries } }) + '\n');
  return { root, repo, task };
}
function runCoverage(completed, check) {
  const f = coverageFixture(completed);
  try { const result = spawnSync(process.execPath, [cli, '--task-path', f.task], { cwd: f.repo, encoding: 'utf8' }); expect(result.stderr).toBe(''); check(result, JSON.parse(result.stdout)); }
  finally { rmSync(f.root, { recursive: true }); }
}
describe('ORACLE-N11-STEP-COVERAGE', () => {
  it('returns named missing steps from a partially attested stage without mutating its input', () => {
    expect(checker.stepCoverageExit).toBeTypeOf('function');
    const report = { workflow_steps: [{ stage: 'make-decision', source: 'steps.json', step_slug: 'first', state: 'completed' }, { stage: 'make-decision', source: 'steps.json', step_slug: 'second', state: 'unavailable' }] };
    const before = JSON.stringify(report);
    expect(checker.stepCoverageExit(report)).toMatchObject({ exit_code: 1, missing_steps: [{ source: 'steps.json', step_slug: 'second', state: 'unavailable' }] });
    expect(JSON.stringify(report)).toBe(before);
  });
  it('real CLI missing-step negative exits nonzero and names the specific slug', () => runCoverage(['first-owned-step'], (result, report) => {
    expect(report.workflow_steps.filter(row => row.stage === 'make-decision').map(row => row.state)).toEqual(['completed', 'unavailable']);
    expect(result.status).toBe(1);
    expect(report.missing_steps).toEqual([{ source: 'workflows/make-decision/steps.json', step_slug: 'second-owned-step', state: 'unavailable' }]);
  }));
  it('real CLI complete fixture exits zero while preserving both declared rows', () => runCoverage(['first-owned-step', 'second-owned-step'], (result, report) => {
    expect(result.status).toBe(0);
    expect(report.workflow_steps.filter(row => row.stage === 'make-decision').map(row => row.state)).toEqual(['completed', 'completed']);
    expect(report.missing_steps).toEqual([]);
  }));
  it('real CLI zero attestation remains zero and explicitly reports steps_unattested', () => runCoverage([], (result, report) => {
    expect(result.status).toBe(0);
    expect(report.missing_steps).toEqual([]);
    expect(report.steps_unattested).toContainEqual({ stage: 'make-decision', declared_steps: 2 });
  }));
  it('retains the actual 15-step make-decision declaration and requires stage-end consumption', () => {
    expect(JSON.parse(read('workflows/make-decision/steps.json')).steps).toHaveLength(15);
    const end = read('workflows/make-decision/SKILL.md').split('14. `stage-end-spec-analyze`：')[1].split('15. `closeout`：')[0];
    for (const term of ['node tools/cli/run-checks.mjs --task-path', 'missing_steps', 'incomplete']) expect(end).toContain(term);
  });
});

const languageTerms = ['先给结论', '短句', '主动语态', '一次一个动作', '不用术语与内部编号', '非用不可当场解释', '默认读者是没读过本项目且注意力有限的人'];
function plainErrors(talk, agents) {
  const errors = [];
  for (const [name, body] of [['Talk', section(talk, '## 用户可见的说话方式')], ['AGENTS', section(agents, '### 用户可见输出')]]) {
    for (const term of languageTerms) if (!body.includes(term)) errors.push(`${name}: ${term}`);
  }
  if (!section(agents, '### 用户可见输出').includes('skills/talk-with-zhipeng/SKILL.md#用户可见的说话方式')) errors.push('AGENTS: Talk pointer');
  if (!section(talk, '## 用户可见的说话方式').includes('AGENTS.md#用户可见输出')) errors.push('Talk: AGENTS pointer');
  return errors;
}
describe('ORACLE-N11-PLAIN-LANGUAGE', () => {
  it('requires all seven standards and mutual pointers in the actual user-output sections', () => {
    expect(plainErrors(read('skills/talk-with-zhipeng/SKILL.md'), read('AGENTS.md'))).toEqual([]);
  });
  for (const term of languageTerms) it(`rejects removing the Talk standard: ${term}`, () => {
    expect(plainErrors(read('skills/talk-with-zhipeng/SKILL.md').replace(term, ''), read('AGENTS.md'))).toContain(`Talk: ${term}`);
  });
  it('rejects a standard without its Talk pointer', () => {
    expect(plainErrors(read('skills/talk-with-zhipeng/SKILL.md'), read('AGENTS.md').replace('skills/talk-with-zhipeng/SKILL.md#用户可见的说话方式', ''))).toContain('AGENTS: Talk pointer');
  });
});

// Approved additive TCR: quality/reviews/2026-10-22-037-p2-output-tcr-approval-raw.md.
// The original 17 cases and their readers above remain unchanged.
function outputTemplate(text) {
  const marker = '\n## 输出\n';
  const start = text.indexOf(marker);
  if (start < 0) return { error: '输出: heading' };
  const after = text.slice(start + marker.length);
  const open = after.search(/^```text\r?$/m), nextHeading = after.search(/^## /m);
  if (open < 0 || nextHeading >= 0 && nextHeading < open) return { error: '输出: text fence' };
  const match = after.slice(open).match(/^```text\r?\n([\s\S]*?)^```\s*$/m);
  return match ? { body: match[1] } : { error: '输出: text fence' };
}
const outputFields = [
  ['结论', '[结论]'],
  ['三档', '分档：[已答/事实可定/待你定]'],
  ['谁来定', '谁来定：[代理/用户]'],
  ['证据/主观', '来源：[证据/主观]'],
];
function outputErrors(text) {
  const { body, error } = outputTemplate(text);
  if (error) return [error];
  return categories.flatMap(name => {
    const rows = body.split('\n').filter(line => line.trimStart().startsWith(`- ${name}：`));
    if (rows.length !== 1) return [`${name}: row`];
    return outputFields.filter(([, token]) => !rows[0].includes(token)).map(([field]) => `${name}: ${field}`);
  });
}
describe('ORACLE-N11-FIVE-CATEGORIES output template (approved additive TCR)', () => {
  it('checks the actual output fence, rejecting missing heading/fence or a misnamed category without whole-file fallback', () => {
    const actual = read('skills/talk-with-zhipeng/SKILL.md');
    expect(outputErrors(actual)).toEqual([]);
    expect(outputErrors(actual.replace('\n## 输出\n', '\n## Removed output\n'))).toEqual(['输出: heading']);
    const { body } = outputTemplate(actual);
    const brokenFence = actual.replace('```text\n' + body, '```plain\n' + body);
    expect(outputErrors(brokenFence)).toEqual(['输出: text fence']);
    expect(outputErrors(actual.replace('  - 语义与解释权：', '  - 错误类目：'))).toEqual(['语义与解释权: row']);
  });
  it('rejects actual four-dimension content under the valid heading and in a real output fence', () => {
    const four = '- **A 真实痛点**：用户原文 = 证据，否则主观。\n- **B 复杂度与 ROI**：有参照 = 证据，否则主观。\n- **C 风险与影响范围**：能点名边界 = 证据，否则主观。\n- **D 时机**：计划有来源 = 证据，否则主观。';
    const talk = '### 5. 范围五类判定\n' + four + '\n';
    expect(section(talk, '### 5. 范围五类判定')).toContain('A 真实痛点');
    expect(section(talk, '### 5. 范围五类判定')).toContain('B 复杂度与 ROI');
    expect(section(talk, '### 5. 范围五类判定')).toContain('C 风险与影响范围');
    expect(section(talk, '### 5. 范围五类判定')).toContain('D 时机');
    for (const name of categories) expect(fiveErrors(talk, read('workflows/make-decision/SKILL.md'))).toContain(name);
    const oldOutput = '\n## 输出\n\n```text\n## 决策记录\n- 五类详情：\n' + four + '\n```\n';
    expect(outputErrors(oldOutput)).toEqual(categories.map(name => `${name}: row`));
  });
  for (const [field, token] of outputFields) it(`rejects each named output row missing ${field} and accepts its original byte restoration`, () => {
    const actual = read('skills/talk-with-zhipeng/SKILL.md');
    const { body } = outputTemplate(actual);
    for (const name of categories) {
      const row = body.split('\n').find(line => line.trimStart().startsWith(`- ${name}：`));
      expect(typeof row, `${name}: original row`).toBe('string');
      const removed = row.replace(token, '');
      const broken = actual.replace(row, removed);
      expect(outputErrors(broken)).toEqual([`${name}: ${field}`]);
      const restored = broken.replace(removed, row);
      expect(restored).toBe(actual);
      expect(outputErrors(restored)).toEqual([]);
    }
  });
});
