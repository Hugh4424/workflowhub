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
  // Exact byte boundaries are under test; repeated ordinary prose is synthetic
  // transport input, not a production baseline or a claim about model quality.
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
    expect(Buffer.byteLength(result)).toBeLessThanOrEqual(60 * 1024);
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

  it.each(['missing', 'empty', 'descriptor', 'below inline minimum'])('rejects %s baseline before any provider call', async kind => {
    const m = materials(), { calls, dependencies } = transport(root());
    if (kind === 'missing') delete m.decision_baseline;
    if (kind === 'empty') m.decision_baseline = '';
    if (kind === 'descriptor') m.decision_baseline = { ref: 'decision-log.md', sha256: 'a'.repeat(64) };
    if (kind === 'below inline minimum') m.decision_baseline = '# Accepted decision';
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

  it.each([['decision_baseline', 60 * 1024], ['raw_requirement', 10 * 1024]])('enforces the inclusive %s delivery bound without calling providers on overflow', async (key, limit) => {
    const exact = materials(), ok = transport(root()); exact[key] = 'x'.repeat(limit);
    await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: exact }, ok.dependencies);
    expect(ok.calls.length).toBeGreaterThan(0);
    const tooLarge = materials(), blocked = transport(root()); tooLarge[key] = 'x'.repeat(limit + 1);
    const result = await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: tooLarge }, blocked.dependencies);
    expect(result.error.code).toBe('MATERIAL_TOO_LARGE'); expect(blocked.calls).toHaveLength(0);
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
