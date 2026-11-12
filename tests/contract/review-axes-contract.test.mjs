import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSimpleReview } from '../../skills/wh-review/scripts/simple-review-runner.mjs';

const BAD_PLAN = `# 受控方案样张（故意坏输入，不代表当前C07方案）
## 已确认要求
取消编辑后保留用户草稿；删除只经明确确认；保存失败保留用户输入。
## 候选方案
点取消即删除草稿，保存失败时清空输入并显示成功。
## 验收安排
验收只检查 draft-engine.mjs 文件存在，不执行取消、删除确认或保存失败动作。
## 实现与消费者
为此新增永久 baseline-ledger、writer-permit 及 review-pass 状态机；现有草稿状态仍照旧保存。
## 开工安排
两个并行作者各自编辑 draft-engine.mjs 的不同字段；具体首改位置、测试命令及失败恢复由后续实现者自行确定。
`;
const roots = [];
afterEach(() => { for (const root of roots.splice(0)) { expect(root.startsWith(realpathSync(tmpdir()) + '/p10-axes-')).toBe(true); rmSync(root, { recursive: true }); } });
function materials() {
  const body = 'Approved cancellation retains drafts. Delete requires confirmation. Failed saves preserve edits.\n'.repeat(20);
  return { context_map: BAD_PLAN, decision_baseline: '# Accepted decisions\n' + body, draft_spec: '# Draft specification\n' + body,
    acceptance_criteria: '# Acceptance cases\n' + body,
    phase_authorities: { 'phases/P1.md': '# Phase P1\n' + body },
    phase_index: '## Execution Index\n| Phase | Authority |\n| --- | --- |\n| P1 | phases/P1.md |\n\n' + body };
}
async function execute(reply = () => ({ findings: [] })) {
  const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), 'p10-axes-'))); roots.push(attachmentRoot);
  const calls = [];
  const result = await runSimpleReview({ stage: 'build-plan', activation_cohort: 'post', materials: materials() }, {
    loadConfig: () => ({ whReview: {}, config: '/unused', attachmentRoot, command: ['unused'] }),
    resolveRoute: () => ({ initial: ['other/model'], mode: 'single_round' }),
    selectProviders: () => ({ providers: ['other/model'], provider_models: { 'other/model': 'fixture-model' } }),
    client: { async runGroup(request) {
      const files = Object.fromEntries(request.materials.deliveryManifest.map(e => [e.path, readFileSync(join(request.materials.bundleRoot, e.path), 'utf8')]));
      const call = { files, instruction: files['review-instructions.md'], prompt: request.prompt }; calls.push(call);
      const response = reply(call);
      if (response instanceof Error) throw response;
      return { runtimeId: 'p10-controlled-transport', outcome: 'completed', material_id: request.materials.materialId, providers: [{ provider: 'other/model', status: 'completed', identity: { provider: 'other/model', model: 'fixture-model' }, error: null, output: JSON.stringify(response), timing: null, usage: null }] };
    } },
  });
  return { result, calls };
}

describe('review axes contract', () => {
  it('dispatches two actual independent packets whose roles judge different plan questions', async () => {
    const { calls, result } = await execute();
    expect(calls).toHaveLength(2);
    const a = calls.find(call => call.instruction.includes('role=red'));
    const b = calls.find(call => call.instruction.includes('role=blue'));
    expect(a).toBeDefined(); expect(b).toBeDefined(); expect(a.instruction).not.toBe(b.instruction);
    expect(a.instruction).toContain('方案成立吗'); expect(a.instruction).toContain('验收可判吗');
    expect(b.instruction).toContain('范围越界吗'); expect(b.instruction).toContain('风险覆盖吗');
    expect(a.instruction).not.toContain('Do not add requirements'); expect(b.instruction).not.toContain('Do not add requirements');
    for (const call of calls) {
      const contract = call.files['contracts/build-plan.md'];
      expect(Object.entries(call.files).find(([path]) => path.includes('context_map'))?.[1]).toBe(BAD_PLAN);
      for (const item of ['方案成立吗', '验收可判吗', '范围越界吗', '风险覆盖吗', '可执行性', '锚点', '问题', '依据', '替代方案', '覆盖范围']) expect(contract).toContain(item);
      expect(contract).toContain('authoring-contract.md');
      expect(call.instruction).toContain('recommendation'); expect(call.instruction).toContain('evidence');
    }
    expect(result.role_results.red).toBeDefined(); expect(result.role_results.blue).toBeDefined();
    for (const call of calls) {
      expect(call.files['contracts/authoring-contract.md']).toContain('五问');
      expect(call.files['skills/spec-specify/SKILL.md']).toContain('技能写作规范（WR001）');
    }
  });

  it('retains legitimate empty findings as transport advice without manufacturing a verdict', async () => {
    const { calls, result } = await execute();
    expect(calls).toHaveLength(2); expect(result.findings).toEqual([]);
    expect(result.role_results.red.findings).toEqual([]); expect(result.role_results.blue.findings).toEqual([]);
    expect(result).not.toHaveProperty('verdict'); expect(result).not.toHaveProperty('pass');
    expect(result.role_results.red.provider_results[0].material_coverage.undetermined.length).toBeGreaterThan(0);
  });

  it('preserves the failed role and never retries it or turns it into empty successful advice', async () => {
    const { calls, result } = await execute(call => call.instruction.includes('role=blue')
      ? Object.assign(new Error('controlled transport failure'), { code: 'PROVIDER_UNAVAILABLE' }) : { findings: [] });
    expect(calls).toHaveLength(2);
    expect(result.role_results.red.status).toBe('available');
    expect(result.role_results.blue.status).toBe('unavailable');
    expect(result.status).toBe('available-with-failures');
    expect(result.role_results.blue.error).toBeDefined();
  });

  it('retains anchored physical Phase coverage for a complete current request when the other role fails', async () => {
    const { result } = await execute(call => call.instruction.includes('role=blue')
      ? Object.assign(new Error('controlled second-role failure'), { code: 'PROVIDER_UNAVAILABLE' })
      : { findings: [{ severity: 'minor', path: 'requirements/phases/P1.md', line: 1,
        issue: 'The physical Phase requires an explicit consumer check.',
        recommendation: 'Retain the physical Phase and add the consumer behavior check.',
        evidence_kind: 'direct', evidence: '# Phase P1' }] });
    expect(result.status).toBe('available-with-failures');
    expect(result.findings).toHaveLength(1);
    expect(result.role_results.red.provider_results[0].material_coverage).toEqual({
      provider: 'other/model', read: ['phase_authorities'], unread: [],
      undetermined: ['context_map', 'decision_baseline', 'draft_spec', 'acceptance_criteria', 'phase_index'],
    });
    expect(result.role_results.blue.status).toBe('unavailable');
  });

  it('preserves a provider finding with alternatives and coverage in existing fields', async () => {
    // The stub below only proves response transport. Detection of a deliberately
    // bad proposal is tested by the separate one-off real T035 request.
    const { result } = await execute(call => {
      if (!call.instruction.includes('role=blue')) return { findings: [] };
      const path = Object.keys(call.files).find(path => path.includes('draft_spec'));
      return { findings: [{ severity: 'major', path, line: 2,
        issue: 'Controlled draft-deletion alternative needs an explicit ownership decision',
        root_cause: 'The accepted decision requires retention on cancellation.',
        recommendation: 'Keep cancellation as a close action and give deletion its own confirmed action.',
        evidence_kind: 'direct', evidence: 'Approved cancellation retains drafts. 覆盖范围：P1草稿动作；未覆盖：真实后端。' }] };
    });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].recommendation).toContain('confirmed action');
    expect(result.findings[0].evidence).toContain('覆盖范围：P1');
    expect(result.findings[0]).not.toHaveProperty('axis');
  });
});
