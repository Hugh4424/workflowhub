import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';

// ORACLE-P1-STAGE-STEPS: current P1/T002 approves CLI/report public seam.
// Missing implementation is observed by a named assertion, not import failure.
const entry = resolve('tools/cli/check-stage-steps.mjs');
const checker = existsSync(entry) ? await import(/* @vite-ignore */ entry) : {};
describe('ORACLE-P1-STAGE-STEPS checker', () => {
  it('real CLI names missing eighth evidence, preserves inputs and reports removed mapping', () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p1-checker-')));
    const repo = join(root, 'repo'), task = join(root, 'task'), materials = join(repo, 'specs/controlled');
    const put = (base, name, value) => { const path = join(base, name); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value)); };
    try {
      mkdirSync(materials, { recursive: true });
      put(task, 'task.json', { schema_version: '1.0.0', task_id: 'controlled', baseline_commit: 'HEAD', target_repo_root: repo, activation_cohort: 'post' });
      put(task, 'facts.jsonl', '');
      put(materials, 'decision-log.md', '# Complete decision body\n## 级别与路线\n- 推荐级别：复杂\n## 工作包与决定\n#### WP1 — controlled\n清单：`quality/evidence/decision-log-refs/controlled-convergence-checklist.md`\n');
      put(materials, 'phases/index.md', '# Pure pointer index\n');
      for (const stage of ['make-decision', 'build-plan', 'build-code', 'verify-code', 'build-prd']) {
        put(repo, `workflows/${stage}/steps.json`, readFileSync(resolve(`workflows/${stage}/steps.json`), 'utf8'));
      }
      put(task, 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md', '| 1 controlled | goal | boundary | choice | AC | risk | none | consumer | none | 已收敛 |\n');
      // Input invariance below compares the exact stage evidence bytes.
      const invoke = () => spawnSync(process.execPath, [entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${repo}`, '--json'], { encoding: 'utf8', cwd: repo });
      const source = 'workflows/make-decision/steps.json';
      const owned = JSON.parse(readFileSync(join(repo, source), 'utf8')).steps;
      put(repo, 'workflows/make-decision/SKILL.md', '# Controlled method\n## 方法\nOwned observation.\n');
      // Keep real 15-step identities/mapping, bind all criteria to the owned method.
      for (const step of owned) step.observable_result = 'Observed controlled behavior. 判定消费：SKILL.md#方法；原件：owned human record';
      put(repo, source, { schema_version: '2.0.0', stage_slug: 'make-decision', steps: owned });
      put(materials, 'step-consumer-design.md', owned.map(step => `| [controlled](../../${source}#L1) \`${step.step_slug}\` | observation | human | owner |`).join('\n'));
      const entries = owned.map(step => {
        const ref = `quality/evidence/${step.step_slug}.json`;
        put(task, ref, { source, step_slug: step.step_slug, reader: 'controlled independent reader', inputs: ['owned observation'], observation: 'Read the named controlled observation.', criteria_ref: 'workflows/make-decision/SKILL.md#方法', conclusion: 'completed', limits: [] });
        return { ref, source, step_slug: step.step_slug };
      });
      put(task, 'facts.jsonl', JSON.stringify({ record_kind: 'stage', task_id: 'controlled', stage: 'make-decision', source: 'controlled test observations, not actual user approval', evidence: { value: entries } }) + '\n');
      const producer = () => runFinalChainCheck({ taskPath: task, materialRoot: materials });
      expect(producer().workflow_steps.filter(row => row.stage === 'make-decision').map(row => row.state)).toEqual(Array(15).fill('completed'));
      expect(JSON.parse(invoke().stdout).stages[0].steps[7]).toMatchObject({ judgment: '已留痕', state: 'completed' });
      const eighthPath = join(task, entries[7].ref), eighthBytes = readFileSync(eighthPath);
      rmSync(eighthPath);
      expect(producer().workflow_steps.filter(row => row.stage === 'make-decision').map(row => row.state)).toEqual([...Array(7).fill('completed'), 'unavailable', ...Array(7).fill('completed')]);
      const first = invoke();
      expect(first.status).toBe(0);
      const report = JSON.parse(first.stdout);
      expect(report.stages[0].steps[7]).toMatchObject({ step_id: 8, judgment: '未留痕' });
      expect(report.level).toBe('- 推荐级别：复杂');
      expect(report.modules[0].fields).toHaveLength(8);
      expect(report.convergence.complete).toBe(true);
      const textInvoke = () => spawnSync(process.execPath, [entry, `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${repo}`], { encoding: 'utf8', cwd: repo });
      const text = textInvoke();
      expect(text.status).toBe(0);
      expect(text.stdout).toContain('1 controlled：已收敛');
      for (const [name, value] of [['目标','goal'],['边界','boundary'],['方案与取舍','choice'],['验收','AC'],['风险','risk'],['依赖','none'],['消费者','consumer'],['未决/无','none']]) expect(text.stdout).toContain(`  ${name}：${value}；present=true`);
      expect(text.stdout).toContain('收敛 complete=true；gaps=[]');
      expect(report.errors.join('\n')).not.toContain('phases/index.md');
      expect(readFileSync(join(task, 'facts.jsonl'), 'utf8')).toBe(JSON.stringify({ record_kind: 'stage', task_id: 'controlled', stage: 'make-decision', source: 'controlled test observations, not actual user approval', evidence: { value: entries } }) + '\n');
      writeFileSync(eighthPath, eighthBytes);
      expect(producer().workflow_steps[7].state).toBe('completed');
      expect(JSON.parse(invoke().stdout).stages[0].steps[7]).toMatchObject({ judgment: '已留痕', state: 'completed' });
      const manifest = JSON.parse(readFileSync(join(repo, 'workflows/build-prd/steps.json'), 'utf8'));
      manifest.steps[0].observable_result = 'Controlled missing mapping marker';
      put(repo, 'workflows/build-prd/steps.json', manifest);
      put(task, 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md', '| 1 controlled | goal | | choice | AC | risk | none | consumer | none | 待收敛 |\n');
      const second = invoke();
      expect(second.status).toBe(0);
      expect(JSON.parse(second.stdout).convergence).toMatchObject({ complete: false, gaps: ['1 controlled'] });
      expect(JSON.parse(second.stdout).modules[0].fields[1]).toMatchObject({ name: '边界', present: false });
      const incompleteText = textInvoke().stdout;
      expect(incompleteText).toContain('1 controlled：待收敛');
      expect(incompleteText).toContain('  边界：缺项；present=false');
      expect(incompleteText).toContain('收敛 complete=false；gaps=["1 controlled"]');
      expect(JSON.parse(second.stdout).stages[4]).toMatchObject({ mapping: '未配置' });
      expect(JSON.parse(second.stdout).stages[4].steps[0]).toMatchObject({ judgment: '映射未配置', evidence_location: null });
      const decisionPath = join(materials, 'decision-log.md');
      const decision = readFileSync(decisionPath, 'utf8');
      const ref = 'quality/evidence/decision-log-refs/controlled-convergence-checklist.md';
      const one = '| 1 controlled | goal | boundary | choice | AC | risk | none | consumer | none | 已收敛 |\n';
      const two = '| 2 second | goal | boundary | choice | AC | risk | none | consumer | none | 已收敛 |\n';
      writeFileSync(decisionPath, decision + '**WP2 — second**\n');
      put(task, ref, one + two);
      expect(JSON.parse(invoke().stdout).convergence.complete).toBe(true);
      for (const [body, gap] of [[one, '缺模块 WP2'], [one + two + two, '重复模块 WP2'], [one + two + two.replace('2 second', '3 unknown'), '未知模块 WP3']]) {
        put(task, ref, body);
        const value = JSON.parse(invoke().stdout).convergence;
        expect(value.complete).toBe(false);
        expect(value.gaps).toContain(gap);
        const gapText = textInvoke().stdout;
        expect(gapText).toContain('收敛 complete=false');
        expect(gapText).toContain(gap);
      }
      writeFileSync(decisionPath, decision.replace('#### WP1 — controlled', 'plain reference WP1'));
      expect(JSON.parse(invoke().stdout).convergence.complete).toBe(false);
      writeFileSync(decisionPath, decision.replace(ref, 'quality/evidence/../escape-convergence-checklist.md'));
      expect(JSON.parse(invoke().stdout).errors.join('\n')).toContain('未取得唯一当前任务收敛清单指针');
      writeFileSync(decisionPath, decision + 'other `quality/evidence/another-convergence-checklist.md`\n');
      expect(JSON.parse(invoke().stdout).convergence.complete).toBe(false);
    } finally { rmSync(root, { recursive: true }); }
  });
  it('reports the actual five mapping manifests independently of evidence availability', () => {
    expect(checker.runStageStepsCheck, 'report checker public entry is available').toBeTypeOf('function');
    const report = checker.runStageStepsCheck({ taskPath: resolve('/nonexistent/p1-controlled-task'), repoRoot: resolve('.') });
    expect(report.stages.map(row => [row.stage, row.mapping, row.steps.length])).toEqual([
      ['make-decision', '已配置', 15], ['build-plan', '已配置', 12],
      ['build-code', '已配置', 12], ['verify-code', '已配置', 8], ['build-prd', '已配置', 6],
    ]);
    expect(report.errors.join('\n')).toContain('task.json');
    expect(report.stages[0].steps[7]).toMatchObject({ judgment: '未留痕' });
  });
});
