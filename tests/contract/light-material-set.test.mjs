import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTask } from '../../runtime/task/task-handle.mjs';
import { initializeTaskStore } from '../../runtime/task/task-store.mjs';
import { materialFilesForCohort, inspectMaterialWorkspace } from '../../runtime/task/material-workspace.mjs';

const roots = [];
const cliPath = fileURLToPath(new URL('../../tools/cli/stage-runtime.mjs', import.meta.url));
const costPath = fileURLToPath(new URL('../../tools/cli/measure-main-agent-cost.mjs', import.meta.url));
const sessionPath = fileURLToPath(new URL('../fixtures/main-agent-cost/dsh-v4.jsonl', import.meta.url));
const index = '## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n| `P2` | `phases/P2.md` |\n';
const base = ['decision-log.md', 'spec.md', 'phases/index.md'];
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wh-light-materials-'))); roots.push(root);
  const repo = join(root, 'repo'), worktree = join(root, 'worktree'), storage = join(root, 'storage'), home = join(root, 'home');
  for (const dir of [repo, storage, home]) mkdirSync(dir);
  git(repo, ['init', '-q', '-b', 'main']); git(repo, ['config', 'user.name', 'WorkflowHub fixture']); git(repo, ['config', 'user.email', 'fixture@test.invalid']);
  git(repo, ['commit', '--allow-empty', '-qm', 'baseline']); git(repo, ['worktree', 'add', '-qb', 'task/workflowhub/light-materials', worktree]);
  const task = await createTask({ storageRoot: storage, manifest: { schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'light-materials', created_at: '2026-10-19T00:00:00.000Z', target_repo_root: repo, workspace_mode: 'existing', workspace_root: worktree, activation_cohort: 'post', execution_mode: 'per_invocation', record_model: 'vnext-single-write', issue_ids: [], inputs: {} } });
  await initializeTaskStore(task.taskPath, { taskId: 'light-materials' });
  const materials = join(worktree, 'specs', 'light-materials'); mkdirSync(materials, { recursive: true });
  writeFileSync(join(materials, 'decision-log.md'), '## 任务身份\n\n- **任务类型**：普通任务\n');
  const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, '.config'), WORKFLOWHUB_TASK_DIR: storage };
  return { root, repo, worktree, storage, home, task, materials, env };
}
function cli(f, command, stage, extra = []) {
  return spawnSync(process.execPath, [cliPath, command, ...(command === 'status' ? ['--action=begin'] : []), `--stage=${stage}`, '--project=workflowhub', '--task=light-materials', `--task-path=${f.task.taskPath}`, ...extra], { cwd: f.worktree, env: f.env, encoding: 'utf8', timeout: 15000 });
}
function draft(f, name, body, stage = 'make-decision') {
  const source = join(f.root, 'draft.txt'); writeFileSync(source, body);
  return cli(f, 'run', stage, ['--action=draft', `--name=${name}`, `--input=${source}`]);
}
function success(result) { expect(result.error).toBeUndefined(); expect(result.status, result.stderr).toBe(0); return JSON.parse(result.stdout); }

describe('ORACLE-LIGHT-MATERIALS', () => {
  it('allows decision/spec/index and only indexed Phases without relaxing historical cohorts', () => {
    expect(materialFilesForCohort('post', {}, { stage: 'make-decision' })).toEqual(base);
    expect(materialFilesForCohort('post', { 'phases/index.md': index }, { stage: 'make-decision' })).toEqual([...base, 'phases/P1.md', 'phases/P2.md']);
    expect(() => materialFilesForCohort('post', { 'phases/P1.md': 'orphan' }, { stage: 'make-decision' })).toThrow(/without an index/);
    expect(() => materialFilesForCohort('post', { 'phases/index.md': index, 'phases/P3.md': 'orphan' }, { stage: 'make-decision' })).toThrow(/unindexed Phase/);
    expect(() => materialFilesForCohort('pre', {}, { stage: 'make-decision' })).toThrow(/historical materials are read-only/);
  });
  it('writes and reads real light spec/Phase artifacts while material publication creates no stage facts', async () => {
    const f = await fixture(), before = readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8');
    expect(success(cli(f, 'status', 'make-decision')).missing_materials).toEqual([]);
    expect(success(cli(f, 'status', 'build-plan')).missing_materials).toEqual([]);
    const spec = '# Light spec\n\nWrite set: src/feature.mjs\nAC-001: show actual output\nOracle: output equals expected\nCommand: node --test tests/feature.mjs\n';
    success(draft(f, 'spec.md', spec)); success(draft(f, 'phases/index.md', index));
    for (const phase of ['P1', 'P2']) success(draft(f, `phases/${phase}.md`, `# ${phase}\nWrite set: src/feature.mjs\nAC-001; oracle: output equals expected; command: node --test tests/feature.mjs\n`));
    expect(readFileSync(join(f.materials, 'spec.md'), 'utf8')).toBe(spec);
    const inspected = inspectMaterialWorkspace(f.materials, { stage: 'make-decision' });
    expect(inspected.status).toBe('working'); expect(Object.keys(inspected.files)).toEqual([...base, 'phases/P1.md', 'phases/P2.md']);
    for (const name of ['phases/P3.md', '../escape.md', 'plan.md']) {
      const rejected = draft(f, name, 'must not publish\n'); expect(rejected.status).toBe(1); expect(existsSync(join(f.materials, name))).toBe(false);
    }
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe(before);
    expect(success(cli(f, 'status', 'make-decision')).facts).toEqual([]);
    rmSync(join(f.materials, 'decision-log.md'));
    expect(success(cli(f, 'status', 'make-decision')).missing_materials).toEqual([]);
    expect(success(cli(f, 'status', 'build-plan')).missing_materials).toEqual(['decision-log.md']);
  });
  it('publishes a newly authored decision-log in worktree specs, never task storage', async () => {
    const f = await fixture();
    const decision = join(f.materials, 'decision-log.md');
    const facts = readFileSync(join(f.task.taskPath, 'facts.jsonl'));
    const body = '# Authored decision\n\n## 任务身份\n\n- **任务类型**：普通任务\n';
    rmSync(decision);

    const result = success(draft(f, 'decision-log.md', body));
    expect(result.artifact_ref).toBe('specs/light-materials/decision-log.md');
    expect(readFileSync(decision, 'utf8')).toBe(body);
    expect(existsSync(join(f.task.taskPath, 'decision-log.md'))).toBe(false);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'))).toEqual(facts);
  });
  it('keeps build-plan artifact ownership and rejects missing-index light Phase publication', async () => {
    const f = await fixture();
    const rejected = draft(f, 'phases/P1.md', 'unindexed\n'); expect(rejected.status).toBe(1); expect(existsSync(join(f.materials, 'phases/P1.md'))).toBe(false);
    success(draft(f, 'spec.md', 'build-plan spec\n', 'build-plan'));
    expect(draft(f, 'decision-log.md', 'wrong owner\n', 'build-plan').status).toBe(1);
    expect(readFileSync(join(f.materials, 'decision-log.md'), 'utf8')).toContain('任务身份');
  });
  it('samples actual light spec/index/Phase bytes through the cost CLI, not main checkout materials', async () => {
    const f = await fixture(); mkdirSync(join(f.materials, 'phases'));
    const texts = { 'decision-log.md': readFileSync(join(f.materials, 'decision-log.md'), 'utf8'), 'spec.md': 'spec\n', 'phases/index.md': index, 'phases/P1.md': 'first\n', 'phases/P2.md': 'second\n' };
    for (const [name, body] of Object.entries(texts)) writeFileSync(join(f.materials, name), body);
    mkdirSync(join(f.repo, 'specs', 'light-materials'), { recursive: true }); writeFileSync(join(f.repo, 'specs', 'light-materials', 'decision-log.md'), 'POISON_MAIN');
    const records = readFileSync(sessionPath, 'utf8').trim().split('\n').map(JSON.parse); records[0].cwd = f.worktree;
    const session = join(f.root, 'session.v4.jsonl'); writeFileSync(session, records.map(JSON.stringify).join('\n') + '\n');
    const r = spawnSync(process.execPath, [costPath, '--project=workflowhub', '--task=light-materials', '--stage=make-decision', `--session=${session}`], { cwd: f.worktree, env: f.env, encoding: 'utf8', timeout: 15000 });
    expect(r.error).toBeUndefined(); expect(r.status, r.stderr).toBe(0);
    const bytes = Object.values(texts).reduce((total, text) => total + Buffer.byteLength(text), 0);
    expect(r.stdout).toContain(`materialBytes [byte]: ${bytes};`);
    expect(r.stdout).toContain(join(f.materials, 'phases/P2.md'));
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
});

// Source oracle: DEC-AUTH-001 requires prose in each actual L1 Task card;
// drafting an incomplete material set is still legal and creates no stage facts.
function publicationPhase(prose = '') {
  return `# Phase P1 — Reject empty output

## L0 — Outcome
The Phase-level explanation cannot replace an individual Task's prose.

## L1 — Contract
### T001 — Reject empty output
${prose}
- **Source / FR / AC**：R-001 / FR-001 / AC-001
- **Files / symbols**：\`src/feature.mjs\`; symbol: render
- **Action**：修改 render，让空输出返回原错误。
- **Inputs**：空输出与有效输出。
- **Outputs / failure**：有效输出原样返回；空输出保留错误。
- **Boundary / DO NOT TOUCH**：不改其它模块。
- **Dependency**：none
- **Test tier / skill**：simple / backend-testing
- **Scenario / fixture or service**：本地空输出与有效输出夹具。
- **RED/GREEN gate_cmd**：\`node --test tests/feature.mjs\`
- **expected_exit**：RED nonzero; GREEN 0
- **RED target failure**：空输出被错误接收。
- **GREEN oracle**：空输出被拒绝，有效输出保持相同。
- **Evidence**：\`quality/tests/feature.json\`
- **STOP / recovery**：错误类别变化时回原模块作者核输入后重放。
- **Coverage limit**：仅本地返回值。
- **Done**：目标正反断言通过。

## L2 — Reference
Reference text also cannot replace Task prose.
`;
}
const publicationProse = '修改 src/feature.mjs 的 render 导出，保留有效输出并拒绝空输出。';
describe('public Phase draft reader prose', () => {
  it.each([
    ['short', '保留原错。'],
    ['long', [
      '读取 src/feature.mjs 的 render 导出并保留有效输出，空输出返回可定位的原始错误',
      '调用者按实际返回值判断成功，不因文档长短或文字排版改变输出契约',
      '准备空字符串与有效文本作为对照，读取原输出核其值与错误是否匹配',
      '非法输入须保具体错误消息，导入失败须交原模块作者核入口而不冒目标失败',
      '有效输入的字符与顺序保持原样，不用默认内容掩盖异常或截断上下文',
      '命令从真实任务工作树执行，保存实际输入与退出结果，不改其它工作包的文件',
      '遇到接口冲突先保留原件并定位原owner，恢复正确接口后重放相同命令',
      '独立读者核来源、操作与失败恢复，读取完整材料而不依赖内部编号猜测需求',
      '新增检查只消费已有返回值，不写第二份进度状态，也不把结构可读当业务合格',
      '输出校验失败时保留失败原件与影响，所有尚未执行的条件继续明确记录为未取得',
      '最终按照实际用户需求和真实证据判断交付，字数与段落数量不替代语义或真实消费'
    ].join('；') + '。']
  ])('ORACLE-P9-NO-METRIC publishes a complete %s card without a prose length quota', async (_name, prose) => {
    const f = await fixture(), name = 'phases/P1-完整叙述.md', body = publicationPhase(prose);
    success(draft(f, name, body, 'build-plan'));
    expect(readFileSync(join(f.materials, name), 'utf8')).toBe(body);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
  it('ORACLE-P9-FENCED-HEADINGS keeps example Task and L2 headings inside a legal card', async () => {
    const f = await fixture(), name = 'phases/P1-示例标题.md';
    for (const example of ['```markdown\n### T099 — Example only\n- **Action**：示例字段\n```', '~~~markdown\n## L2 — Example only\n~~~']) {
      const body = publicationPhase(example + '\n' + publicationProse);
      success(draft(f, name, body, 'build-plan'));
      expect(readFileSync(join(f.materials, name), 'utf8')).toBe(body);
    }
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
  it.each(['symbolic', 'hard'])('keeps %s link errors ahead of prose errors', async kind => {
    const f = await fixture(), name = 'phases/P1-安全路径.md', outside = join(f.root, 'outside.md');
    mkdirSync(join(f.materials, 'phases'));
    writeFileSync(outside, 'outside original\n');
    (kind === 'symbolic' ? symlinkSync : linkSync)(outside, join(f.materials, name));
    const r = draft(f, name, publicationPhase(), 'build-plan');
    expect(r.status, r.stderr).toBe(1);
    const error = JSON.parse(r.stderr);
    if (kind === 'symbolic') expect(error.error).toMatch(/artifact path alias/);
    else expect(error.code).toBe('MATERIAL_MULTILINK');
    expect(readFileSync(outside, 'utf8')).toBe('outside original\n');
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
  it.each(['pre', 'history'])('preserves %s read-only material protection', async cohort => {
    const f = await fixture(), path = join(f.task.taskPath, 'task.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8')); manifest.activation_cohort = cohort;
    writeFileSync(path, JSON.stringify(manifest) + '\n');
    const original = readFileSync(join(f.materials, 'decision-log.md'));
    const r = draft(f, 'decision-log.md', 'must not replace history\n');
    expect(r.status, r.stderr).toBe(1);
    expect(JSON.parse(r.stderr).error).toMatch(/read.only|pre\/history/i);
    expect(readFileSync(join(f.materials, 'decision-log.md'))).toEqual(original);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
  it('does not relax unsafe names or the make-decision index boundary', async () => {
    const f = await fixture();
    for (const name of ['phases/P1-../escape.md', 'phases/P1-unsafe.name.md', 'phases/P01-name.md', '../escape.md']) {
      expect(draft(f, name, publicationPhase(publicationProse), 'build-plan').status).toBe(1);
    }
    const name = 'phases/P1-未索引.md';
    expect(draft(f, name, publicationPhase(publicationProse)).status).toBe(1);
    success(draft(f, 'phases/index.md', index));
    expect(draft(f, name, publicationPhase(publicationProse)).status).toBe(1);
    expect(existsSync(join(f.materials, name))).toBe(false);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
  it.each(['make-decision', 'build-plan'])('preserves legal drafts and rejects named field/example-only cards in %s', async stage => {
    const f = await fixture(), name = 'phases/P1-正文检查.md';
    success(draft(f, 'phases/index.md', index.replace('phases/P1.md', name)));
    const good = publicationPhase(publicationProse);
    success(draft(f, name, good, stage));
    for (const prose of ['', '<!-- only a comment -->', '```text\nonly an example\n```', '> quoted source']) {
      const rejected = draft(f, name, publicationPhase(prose), stage);
      expect(rejected.status, rejected.stderr).toBe(1);
      expect(JSON.parse(rejected.stderr).error).toMatch(/T001.*requires reader prose/);
      expect(readFileSync(join(f.materials, name), 'utf8')).toBe(good);
    }
    const partial = '# Phase P1\r\n\r\n## L1\r\n### T001 — Draft action\r\n读取 src/feature.mjs 后修改 render，空输出保留原错误。\r\n';
    success(draft(f, name, partial, stage));
    expect(readFileSync(join(f.materials, name), 'utf8')).toBe(partial);
    const skeleton = '# Phase P1\n\n### T001 — Future card outside L1\n';
    success(draft(f, name, skeleton, stage));
    expect(readFileSync(join(f.materials, name), 'utf8')).toBe(skeleton);
    const template = readFileSync(new URL('../../skills/spec-plan/templates/phase-template.md', import.meta.url), 'utf8');
    success(draft(f, name, template, stage));
    expect(readFileSync(join(f.materials, name), 'utf8')).toBe(template);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
  it('rejects a bad new named Phase without creating its material directory', async () => {
    const f = await fixture(), rejected = draft(f, 'phases/P1-尚未创建.md', publicationPhase(), 'build-plan');
    expect(rejected.status, rejected.stderr).toBe(1);
    expect(JSON.parse(rejected.stderr).error).toMatch(/T001.*requires reader prose/);
    expect(existsSync(join(f.materials, 'phases'))).toBe(false);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'), 'utf8')).toBe('');
  });
  it('ORACLE-P9-NAMED-PHASE publishes a named build-plan Phase before its index exists', async () => {
    const f = await fixture(), name = 'phases/P1-拒绝空输出.md', body = publicationPhase(publicationProse);
    const facts = readFileSync(join(f.task.taskPath, 'facts.jsonl'));
    const result = success(draft(f, name, body, 'build-plan'));
    expect(result.artifact_ref).toBe('specs/light-materials/' + name);
    expect(readFileSync(join(f.materials, name), 'utf8')).toBe(body);
    expect(existsSync(join(f.materials, 'phases/index.md'))).toBe(false);
    expect(existsSync(join(f.materials, 'spec.md'))).toBe(false);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'))).toEqual(facts);
  });
  it.each(['make-decision', 'build-plan'])('ORACLE-P9-PUBLIC-PROSE rejects field-only cards before replacing %s material', async stage => {
    const f = await fixture();
    success(draft(f, 'phases/index.md', index));
    const good = publicationPhase(publicationProse);
    success(draft(f, 'phases/P1.md', good, stage));
    const facts = readFileSync(join(f.task.taskPath, 'facts.jsonl'));
    const result = draft(f, 'phases/P1.md', publicationPhase(), stage);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(1);
    expect(JSON.parse(result.stderr).error).toMatch(/T001.*requires reader prose/);
    expect(readFileSync(join(f.materials, 'phases/P1.md'), 'utf8')).toBe(good);
    expect(readFileSync(join(f.task.taskPath, 'facts.jsonl'))).toEqual(facts);
  });
});
