import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { ArtifactDir } from '../core/artifact-dir.mjs';
import { createTask } from '../runtime/task/task-handle.mjs';
import { createTaskKernel } from '../runtime/task/task-handle.mjs';
import { initializeTaskStore, readMonitoringFacts, readTaskFacts } from '../runtime/task/task-store.mjs';
import { prepareTaskWorkspace } from '../runtime/task/workspace.mjs';
import { createRegisteredCodexSource, parseRegisteredCodexTranscript } from '../runtime/evidence/codex-transcript-adapter.mjs';
import { createTranscriptSourceReader } from '../runtime/evidence/fact-collector.mjs';
import { createQualityFact } from '../runtime/evidence/quality-fact.mjs';
import { publishVerifySummary } from '../runtime/evidence/quality-store.mjs';
import { publishStaleMonitoringSnapshot, resolveDefaultMonitoringSource, runMonitoringSidecar } from '../tools/cli/stage-runtime.mjs';
import { monitoringTopology, stageRuntimeCliMain } from '../tools/cli/stage-runtime.mjs';
import { writeCanonicalStageMaterials, writeStageOutcomeFixture } from './helpers/stage-outcome.mjs';

function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-integration-')));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-integration-repo-')));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  const task = createTask({ storageRoot, manifest: { schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'm15-integration', created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  initializeTaskStore(task.taskPath, { taskId: 'm15-integration' });
  return { storageRoot, task };
}

function publicRunFixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-public-run-')));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-public-run-repo-')));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'WorkflowHub Tests'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'tests@workflowhub.local'], { cwd: repo });
  writeFileSync(join(repo, 'README.md'), 'm15 public run\n');
  execFileSync('git', ['add', 'README.md'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: repo });
  const task = createTask({ storageRoot, manifest: {
    schema_version: '1.0.0', project_name: 'workflowhub', task_id: 'm15-public-run', created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, artifacts });
  return { storageRoot, repo, task, candidate, artifacts, kernel };
}

function isolatedPublicRuntimeEnv({ home, taskDir, source = {} } = {}) {
  const env = { ...process.env, HOME: home, WORKFLOWHUB_TASK_DIR: taskDir };
  for (const key of ['CODEX_SESSION_ID', 'CODEX_THREAD_ID', 'CODEX_ROLLOUT_PATH', 'WORKFLOWHUB_CODEX_ROLLOUT_PATH', 'CODEX_CLI_VERSION']) delete env[key];
  return { ...env, ...source };
}

describe('M15 stage sidecar integration', () => {
  it('binds the public launcher to the current Codex rollout without exposing its path', () => {
    const home = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-codex-home-')));
    const rolloutDir = join(home, '.codex', 'sessions', '2026', '08', '13');
    const threadId = 'thread-m15-real-source';
    const rolloutPath = join(rolloutDir, `rollout-2026-08-13T00-00-00-${threadId}.jsonl`);
    const raw = JSON.stringify({ timestamp: '2026-08-13T00:00:01.000Z', type: 'event_msg', payload: { type: 'agent_message' } });
    try {
      mkdirSync(rolloutDir, { recursive: true });
      writeFileSync(rolloutPath, `${raw}\n`);
      const source = resolveDefaultMonitoringSource({
        task_id: 'm15-real-source',
        run_id: 'run-real-source',
        attempt_id: 'attempt-real-source',
        context: { stage: 'build-code' },
        env: { CODEX_THREAD_ID: threadId, CODEX_ROLLOUT_PATH: rolloutPath, CODEX_CLI_VERSION: 'test-cli' },
        home,
        startedAtMs: 0,
      });
      expect(source.source_ref).toBe(`codex-rollout-${threadId}`);
      expect(source.source_ref).not.toContain('/');
      const parsed = parseRegisteredCodexTranscript(source, {
        project_name: 'workflowhub', task_id: 'm15-real-source', run_id: 'run-real-source', attempt_id: 'attempt-real-source',
      });
      expect(parsed.status).toBe('present');
      expect(parsed.records).toEqual(expect.arrayContaining([
        expect.objectContaining({ fact_type: 'transcript_event', status: 'present', run_id: 'run-real-source', attempt_id: 'attempt-real-source' }),
      ]));
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('does not turn repeated host session metadata ids into a transcript conflict', () => {
    const home = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-session-meta-home-')));
    const rolloutDir = join(home, '.codex', 'sessions', '2026', '08', '13');
    const threadId = 'thread-m15-session-meta';
    const rolloutPath = join(rolloutDir, `rollout-2026-08-13T00-00-00-${threadId}.jsonl`);
    try {
      mkdirSync(rolloutDir, { recursive: true });
      writeFileSync(rolloutPath, [
        { timestamp: '2026-08-13T00:00:01.000Z', type: 'session_meta', payload: { id: threadId, type: 'session_meta', source: 'host' } },
        { timestamp: '2026-08-13T00:00:02.000Z', type: 'session_meta', payload: { id: threadId, type: 'session_meta', source: 'host', sequence: 2 } },
      ].map((entry) => JSON.stringify(entry)).join('\n') + '\n');
      const source = resolveDefaultMonitoringSource({
        task_id: 'm15-session-meta', run_id: 'run-session-meta', attempt_id: 'attempt-session-meta', context: { stage: 'build-code' },
        env: { CODEX_THREAD_ID: threadId, CODEX_ROLLOUT_PATH: rolloutPath }, home, startedAtMs: 0,
      });
      const parsed = parseRegisteredCodexTranscript(source, { project_name: 'workflowhub', task_id: 'm15-session-meta', run_id: 'run-session-meta', attempt_id: 'attempt-session-meta' });
      expect(parsed.status).toBe('present');
      expect(parsed.records.filter((record) => record.fact_type === 'transcript_event')).toHaveLength(2);
      expect(parsed.records).not.toEqual(expect.arrayContaining([expect.objectContaining({ error: 'TYPED_EVENT_ID_CONFLICT' })]));
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('converts Codex token_count events into per-turn token facts without guessing step attribution', () => {
    const home = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-codex-token-home-')));
    const rolloutDir = join(home, '.codex', 'sessions', '2026', '08', '13');
    const threadId = 'thread-m15-token-source';
    const rolloutPath = join(rolloutDir, `rollout-2026-08-13T00-00-00-${threadId}.jsonl`);
    const raw = JSON.stringify({
      timestamp: '2026-08-13T00:00:01.000Z',
      type: 'event_msg',
      payload: {
        type: 'token_count',
        info: {
          total_token_usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
          last_token_usage: { input_tokens: 7, output_tokens: 3, total_tokens: 10 },
        },
      },
    });
    try {
      mkdirSync(rolloutDir, { recursive: true });
      writeFileSync(rolloutPath, `${raw}\n`);
      const source = resolveDefaultMonitoringSource({
        task_id: 'm15-token-source',
        run_id: 'run-token-source',
        attempt_id: 'attempt-token-source',
        context: { stage: 'build-code' },
        env: { CODEX_THREAD_ID: threadId, CODEX_ROLLOUT_PATH: rolloutPath, CODEX_CLI_VERSION: 'test-cli' },
        home,
        startedAtMs: 0,
      });
      const parsed = parseRegisteredCodexTranscript(source, {
        project_name: 'workflowhub', task_id: 'm15-token-source', run_id: 'run-token-source', attempt_id: 'attempt-token-source',
      });
      expect(parsed.status).toBe('present');
      expect(parsed.records).toEqual(expect.arrayContaining([
        expect.objectContaining({
          fact_type: 'token',
          status: 'present',
          stage: 'build-code',
          attempt_id: 'attempt-token-source',
          value: { input_tokens: 7, output_tokens: 3, total_tokens: 10, message_id: expect.any(String), grain: 'message' },
        }),
      ]));
      expect(parsed.records.find((record) => record.fact_type === 'token').step_id).toBeNull();
      expect(parsed.records.find((record) => record.fact_type === 'token').skill_id).toBeNull();
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('uses a half-open transcript window and never treats cumulative usage as per-turn cost', () => {
    const home = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-m15-codex-window-home-')));
    const rolloutDir = join(home, '.codex', 'sessions', '2026', '08', '13');
    const threadId = 'thread-m15-token-window';
    const rolloutPath = join(rolloutDir, `rollout-2026-08-13T00-00-00-${threadId}.jsonl`);
    const token = (timestamp, info) => ({ timestamp, type: 'event_msg', payload: { type: 'token_count', info } });
    try {
      mkdirSync(rolloutDir, { recursive: true });
      writeFileSync(rolloutPath, [
        token('2026-08-13T00:00:01.000Z', { last_token_usage: { input_tokens: 7, output_tokens: 3, total_tokens: 10 }, total_token_usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 } }),
        token('2026-08-13T00:00:01.200Z', { total_token_usage: { input_tokens: 200, output_tokens: 40, total_tokens: 240 } }),
        token('2026-08-13T00:00:02.000Z', { last_token_usage: { input_tokens: 90, output_tokens: 10, total_tokens: 100 } }),
      ].map((entry) => JSON.stringify(entry)).join('\n') + '\n');
      const source = resolveDefaultMonitoringSource({
        task_id: 'm15-token-window', run_id: 'run-token-window', attempt_id: 'attempt-token-window', context: { stage: 'build-code' },
        env: { CODEX_THREAD_ID: threadId, CODEX_ROLLOUT_PATH: rolloutPath }, home,
        startedAtMs: Date.parse('2026-08-13T00:00:00.500Z'),
        endedAtMs: Date.parse('2026-08-13T00:00:01.500Z'),
      });
      const parsed = parseRegisteredCodexTranscript(source, { project_name: 'workflowhub', task_id: 'm15-token-window', run_id: 'run-token-window', attempt_id: 'attempt-token-window' });
      const tokens = parsed.records.filter((record) => record.fact_type === 'token');
      const present = tokens.filter((record) => record.status === 'present');
      expect(present).toHaveLength(1);
      expect(present[0].value.total_tokens).toBe(10);
      expect(tokens.filter((record) => record.status !== 'present')).not.toHaveLength(0);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('records facts when the public stage-runtime success path starts without a facts store', () => {
    const state = publicRunFixture();
    try {
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        candidateWorkspace: state.candidate,
        stage: 'build-spec',
        attemptId: 'attempt-public-run-1',
        status: 'completed',
      });
      const inputPath = join(state.storageRoot, 'public-run-input.json');
      writeFileSync(inputPath, `${JSON.stringify({ receipts: { stage_outcomes: outcome.ref } })}\n`);
      const runtime = join(process.cwd(), 'tools', 'cli', 'stage-runtime.mjs');
      const result = spawnSync(process.execPath, [
        runtime, 'run', '--action=execute', '--stage=build-spec', '--project=workflowhub', '--task=m15-public-run', `--input=${inputPath}`,
      ], {
        cwd: state.repo,
        env: isolatedPublicRuntimeEnv({ home: state.storageRoot, taskDir: state.storageRoot }),
        encoding: 'utf8',
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ stage: 'build-spec' });
      const facts = readTaskFacts(state.task.taskPath);
      expect(facts).toEqual(expect.arrayContaining([
        expect.objectContaining({ task_id: 'm15-public-run', run_id: expect.any(String), attempt_id: 'attempt-public-run-1', stage: 'build-spec', fact_type: 'stage' }),
        expect.objectContaining({ task_id: 'm15-public-run', run_id: expect.any(String), attempt_id: 'attempt-public-run-1', fact_type: 'source_status', status: 'missing', reason: 'no_registered_source' }),
      ]));
    } finally {
      try { execFileSync('git', ['worktree', 'remove', '--force', state.candidate.worktreeRoot], { cwd: state.repo, stdio: 'ignore' }); } catch {}
      rmSync(state.storageRoot, { recursive: true, force: true });
      rmSync(state.repo, { recursive: true, force: true });
    }
  });

  it('preserves authenticated Stage Agent result summaries through facts, diagnostics, and the page bundle', async () => {
    const state = publicRunFixture();
    try {
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        candidateWorkspace: state.candidate,
        stage: 'build-spec',
        attemptId: 'attempt-result-summary',
        status: 'completed',
      });
      initializeTaskStore(state.task.taskPath, { taskId: 'm15-public-run' });
      const result = await runMonitoringSidecar({
        context: { storageRoot: state.storageRoot, task: state.task, identity: state.task.identity, workflowRunId: 'run-result-summary', stage: 'build-spec', attempt_id: 'attempt-result-summary' },
        stageOutcome: {
          status: outcome.value.status,
          stage_outcome_ref: outcome.ref,
          step_outcomes: outcome.value.step_outcomes,
          skill_outcomes: outcome.value.skill_outcomes,
        },
        services: { resolveMonitoringSource: async () => null },
        now: () => new Date('2026-08-12T00:02:00.000Z'),
      });
      const facts = readTaskFacts(state.task.taskPath);
      expect(facts.find((fact) => fact.fact_type === 'step' && fact.status === 'present')?.value.result_summary).toMatch(/^executed /);
      expect(result.diagnostics.steps.find((entry) => entry.result_summary)?.result_summary).toMatch(/^executed /);
      expect(readFileSync(result.global_snapshot, 'utf8')).toContain('executed read-decision-log');
    } finally {
      try { execFileSync('git', ['worktree', 'remove', '--force', state.candidate.worktreeRoot], { cwd: state.repo, stdio: 'ignore' }); } catch {}
      rmSync(state.storageRoot, { recursive: true, force: true });
      rmSync(state.repo, { recursive: true, force: true });
    }
  });

  it('keeps declared step and skill rows, including authenticated outcome cost details', async () => {
    const state = fixture();
    const topology = { stages: [{
      id: 'build-spec',
      steps: [{ id: '1', slug: 'read-decision-log', order: 1 }],
      skills: [{ id: 'spec-analyze', trigger_condition: 'always', execution: 'direct' }],
    }] };
    try {
      await runMonitoringSidecar({
        context: { storageRoot: state.storageRoot, task: state.task, identity: state.task.identity, workflowRunId: 'run-outcome-details', stage: 'build-spec', attempt_id: 'attempt-outcome-details' },
        topology,
        stageOutcome: {
          status: 'completed',
          step_outcomes: [{
          step_id: '1', step_slug: 'read-decision-log', status: 'completed',
            result_summary: '真实步骤结果', evidence_refs: ['quality/evidence/step-proof'],
            execution_id: 'exec-step-read-decision-log',
            started_at: '2026-08-15T00:00:00.000Z', completed_at: '2026-08-15T00:00:00.042Z',
            cost: { status: 'partial', duration_ms: 42, tokens: null, reason: 'provider_usage_unavailable' },
          }],
          skill_outcomes: [{
            skill_id: 'spec-analyze', status: 'completed', trigger: true, executed: true,
            version: 'skill-v1', result_summary: '真实技能结果', evidence_refs: ['quality/evidence/skill-proof'],
            execution_id: 'exec-skill-spec-analyze',
            started_at: '2026-08-15T00:00:00.000Z', completed_at: '2026-08-15T00:00:00.007Z',
            cost: { status: 'recorded', duration_ms: 7, tokens: 11 },
          }],
        },
        services: { resolveMonitoringSource: async () => null, monitoringTopology: topology },
        now: () => new Date('2026-08-15T00:00:00.000Z'),
      });
      const facts = readTaskFacts(state.task.taskPath);
      expect(() => readMonitoringFacts(state.task.taskPath)).not.toThrow();
      expect(facts).toEqual(expect.arrayContaining([
        expect.objectContaining({ fact_type: 'token', step_slug: 'read-decision-log', status: 'unavailable', value: null, reason: 'provider_usage_unavailable' }),
        expect.objectContaining({ fact_type: 'duration', step_slug: 'read-decision-log', value: { duration_ms: 42, event_id: expect.any(String), grain: 'stage_outcome' } }),
        expect.objectContaining({ fact_type: 'token', skill_id: 'spec-analyze', value: { message_id: expect.any(String), tokens: 11, grain: 'stage_outcome' } }),
        expect.objectContaining({ fact_type: 'duration', skill_id: 'spec-analyze', value: { duration_ms: 7, event_id: expect.any(String), grain: 'stage_outcome' } }),
      ]));
    } finally {
      rmSync(state.storageRoot, { recursive: true, force: true });
    }
  });

  it('writes explicit unavailable rows when a stage outcome omits declared steps or skills', async () => {
    const state = fixture();
    const topology = { stages: [{
      id: 'build-spec',
      steps: [{ id: '1', slug: 'read-decision-log', order: 1 }],
      skills: [{ id: 'spec-analyze', trigger_condition: 'always', execution: 'direct' }],
    }] };
    try {
      await runMonitoringSidecar({
        context: { storageRoot: state.storageRoot, task: state.task, identity: state.task.identity, workflowRunId: 'run-missing-details', stage: 'build-spec', attempt_id: 'attempt-missing-details' },
        stageOutcome: { status: 'unavailable', step_outcomes: [], skill_outcomes: [] },
        services: { resolveMonitoringSource: async () => null, monitoringTopology: topology },
        now: () => new Date('2026-08-15T00:00:00.000Z'),
      });
      const facts = readTaskFacts(state.task.taskPath);
      expect(facts).toEqual(expect.arrayContaining([
        expect.objectContaining({ fact_type: 'step', step_id: '1', status: 'unavailable', reason: 'step_outcome_unavailable' }),
        expect.objectContaining({ fact_type: 'skill', skill_id: 'spec-analyze', status: 'unavailable', reason: 'skill_outcome_unavailable' }),
      ]));
    } finally {
      rmSync(state.storageRoot, { recursive: true, force: true });
    }
  });

  it('fails the public run when both monitoring publication and stale fallback fail', async () => {
    const state = publicRunFixture();
    const previousHome = process.env.HOME;
    const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
    const previousSessionId = process.env.CODEX_SESSION_ID;
    const previousThreadId = process.env.CODEX_THREAD_ID;
    try {
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        candidateWorkspace: state.candidate,
        stage: 'build-spec',
        attemptId: 'attempt-public-monitoring-failure',
        status: 'completed',
      });
      const inputPath = join(state.storageRoot, 'public-monitoring-failure-input.json');
      writeFileSync(inputPath, `${JSON.stringify({ receipts: { stage_outcomes: outcome.ref } })}\n`);
      process.env.HOME = state.storageRoot;
      process.env.WORKFLOWHUB_TASK_DIR = state.storageRoot;
      delete process.env.CODEX_SESSION_ID;
      delete process.env.CODEX_THREAD_ID;
      await expect(stageRuntimeCliMain([
        'run', '--action=execute', '--stage=build-spec', '--project=workflowhub', '--task=m15-public-run', `--input=${inputPath}`,
      ], {
        cwd: state.repo,
        services: {
          runMonitoringSidecar: async () => { throw new Error('injected sidecar failure'); },
          publishStaleMonitoringSnapshot: () => { throw new Error('injected stale fallback failure'); },
        },
      })).rejects.toMatchObject({ code: 'WORKFLOWHUB_MONITORING_PUBLICATION_FAILED' });
    } finally {
      if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
      if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
      if (previousSessionId === undefined) delete process.env.CODEX_SESSION_ID; else process.env.CODEX_SESSION_ID = previousSessionId;
      if (previousThreadId === undefined) delete process.env.CODEX_THREAD_ID; else process.env.CODEX_THREAD_ID = previousThreadId;
      try { execFileSync('git', ['worktree', 'remove', '--force', state.candidate.worktreeRoot], { cwd: state.repo, stdio: 'ignore' }); } catch {}
      rmSync(state.storageRoot, { recursive: true, force: true });
      rmSync(state.repo, { recursive: true, force: true });
    }
  });

  it('records a real host transcript through the default public run seam', () => {
    const state = publicRunFixture();
    const threadId = 'thread-m15-public-source';
    const rolloutPath = join(state.storageRoot, '.codex', 'sessions', '2026', '08', '13', `rollout-2026-08-13T00-00-00-${threadId}.jsonl`);
    try {
      mkdirSync(join(state.storageRoot, '.codex', 'sessions', '2026', '08', '13'), { recursive: true });
      writeFileSync(rolloutPath, `${JSON.stringify({ type: 'event_msg', payload: { type: 'agent_message' } })}\n`);
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        candidateWorkspace: state.candidate,
        stage: 'build-spec',
        attemptId: 'attempt-public-real-source',
        status: 'completed',
      });
      const inputPath = join(state.storageRoot, 'public-real-source-input.json');
      writeFileSync(inputPath, `${JSON.stringify({ receipts: { stage_outcomes: outcome.ref } })}\n`);
      const runtime = join(process.cwd(), 'tools', 'cli', 'stage-runtime.mjs');
      const result = spawnSync(process.execPath, [
        runtime, 'run', '--action=execute', '--stage=build-spec', '--project=workflowhub', '--task=m15-public-run', `--input=${inputPath}`,
      ], {
        cwd: state.repo,
        env: isolatedPublicRuntimeEnv({
          home: state.storageRoot,
          taskDir: state.storageRoot,
          source: { CODEX_THREAD_ID: threadId, CODEX_ROLLOUT_PATH: rolloutPath },
        }),
        encoding: 'utf8',
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(readTaskFacts(state.task.taskPath)).toEqual(expect.arrayContaining([
        expect.objectContaining({ fact_type: 'source_status', status: 'present' }),
        expect.objectContaining({ fact_type: 'transcript_event', status: 'present', attempt_id: 'attempt-public-real-source' }),
      ]));
    } finally {
      try { execFileSync('git', ['worktree', 'remove', '--force', state.candidate.worktreeRoot], { cwd: state.repo, stdio: 'ignore' }); } catch {}
      rmSync(state.storageRoot, { recursive: true, force: true });
      rmSync(state.repo, { recursive: true, force: true });
    }
  });

  it('uses the host execution start boundary so real pre-delivery Codex events are retained', () => {
    const state = publicRunFixture();
    const threadId = 'thread-m15-window-source';
    const rolloutDir = join(state.storageRoot, '.codex', 'sessions', '2026', '08', '13');
    const rolloutPath = join(rolloutDir, `rollout-2026-08-13T00-00-00-${threadId}.jsonl`);
    const start = '2026-08-13T00:00:01.000Z';
    const raw = [
      { id: 'before-stage', timestamp: '2026-08-13T00:00:00.500Z', type: 'response_item', payload: { type: 'custom_tool_call', id: 'before-tool', name: 'old-work' } },
      { id: 'during-stage', timestamp: '2026-08-13T00:00:02.000Z', type: 'event_msg', payload: { type: 'token_count', info: { last_token_usage: { input_tokens: 11, output_tokens: 4, total_tokens: 15 } } } },
    ].map((entry) => JSON.stringify(entry)).join('\n');
    try {
      mkdirSync(rolloutDir, { recursive: true });
      writeFileSync(rolloutPath, `${raw}\n`);
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        candidateWorkspace: state.candidate,
        stage: 'build-spec',
        attemptId: 'attempt-public-window-source',
        status: 'completed',
      });
      const inputPath = join(state.storageRoot, 'public-window-source-input.json');
      writeFileSync(inputPath, `${JSON.stringify({ receipts: { stage_outcomes: outcome.ref } })}\n`);
      const runtime = join(process.cwd(), 'tools', 'cli', 'stage-runtime.mjs');
      const result = spawnSync(process.execPath, [
        runtime, 'run', '--action=execute', '--stage=build-spec', '--project=workflowhub', '--task=m15-public-run', `--input=${inputPath}`,
      ], {
        cwd: state.repo,
        env: isolatedPublicRuntimeEnv({
          home: state.storageRoot,
          taskDir: state.storageRoot,
          source: {
            CODEX_THREAD_ID: threadId,
            CODEX_ROLLOUT_PATH: rolloutPath,
            WORKFLOWHUB_CODEX_ROLLOUT_STARTED_AT: start,
          },
        }),
        encoding: 'utf8',
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      const facts = readTaskFacts(state.task.taskPath);
      expect(facts).toEqual(expect.arrayContaining([
        expect.objectContaining({ fact_type: 'token', status: 'present', attempt_id: 'attempt-public-window-source', value: expect.objectContaining({ total_tokens: 15 }) }),
      ]));
      expect(facts.some((fact) => fact.fact_type === 'tool_use' && fact.value?.tool_use_id === 'tool-before')).toBe(false);
      expect(facts.find((fact) => fact.fact_type === 'source_status' && fact.status === 'present')?.value.capabilities).toEqual(expect.arrayContaining(['token']));
    } finally {
      try { execFileSync('git', ['worktree', 'remove', '--force', state.candidate.worktreeRoot], { cwd: state.repo, stdio: 'ignore' }); } catch {}
      rmSync(state.storageRoot, { recursive: true, force: true });
      rmSync(state.repo, { recursive: true, force: true });
    }
  });

  it('runs after publication with a registered source and reaches projection/global data', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => JSON.stringify({ id: 'm1', type: 'message', run_id: 'run-1', stage: 'build-code', usage: { input_tokens: 2, output_tokens: 3 } })) });
    const result = await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    expect(result.status).toBe('present');
    expect(readTaskFacts(task.taskPath).some((fact) => fact.fact_type === 'token' && fact.value.total_tokens === 5)).toBe(true);
    expect(readTaskFacts(task.taskPath).some((fact) => fact.fact_type === 'step' && fact.status === 'unavailable')).toBe(true);
    expect(readTaskFacts(task.taskPath).some((fact) => fact.fact_type === 'skill' && fact.status === 'unavailable')).toBe(true);
    expect(readFileSync(result.global_snapshot, 'utf8')).toContain('globalThis.__WH_MONITOR_DATA__');
    expect(result.diagnostics?.skills ?? []).toBeDefined();
  });

  it('keeps topology entries without an outcome visible as unavailable step or skill facts', async () => {
    const { storageRoot, task } = fixture();
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-no-events', stage: 'build-code' },
      stageOutcome: { status: 'completed', step_outcomes: [], skill_outcomes: [] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const facts = readTaskFacts(task.taskPath);
    const topology = monitoringTopology(realpathSync(new URL('..', import.meta.url).pathname));
    expect(facts.filter((fact) => fact.fact_type === 'step')).toHaveLength(topology.stages.find((stage) => stage.id === 'build-code').steps.length);
    expect(facts.filter((fact) => fact.fact_type === 'skill')).toHaveLength(topology.stages.find((stage) => stage.id === 'build-code').skills.length);
    expect(facts.filter((fact) => ['step', 'skill'].includes(fact.fact_type)).every((fact) => fact.status === 'unavailable')).toBe(true);
  });

  it('loads declared skill trigger topology instead of silently publishing an empty skill dimension', () => {
    const topology = monitoringTopology(realpathSync(new URL('..', import.meta.url).pathname));
    expect(topology.stages).toHaveLength(5);
    expect(topology.stages.flatMap((stage) => stage.skills).length).toBeGreaterThan(0);
    expect(topology.stages.flatMap((stage) => stage.skills).every((skill) => typeof skill.trigger_condition === 'string')).toBe(true);
  });

  it('does not duplicate facts when the same stage publication is replayed', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => JSON.stringify({ id: 'm1', type: 'message', run_id: 'run-1', usage: { input_tokens: 2, output_tokens: 3 } })) });
    await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:01.000Z') });
    const facts = readTaskFacts(task.taskPath);
    expect(facts.filter((fact) => fact.fact_id === 'token:session-1:m1')).toHaveLength(1);
  });

  it('keeps a new attempt and stage result when the same task stage is rerun', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => '') });
    const base = { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' };
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-a' }, stageOutcome: { status: 'failed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-b' }, stageOutcome: { status: 'completed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:01.000Z') });
    const stageFacts = readTaskFacts(task.taskPath).filter((fact) => fact.fact_type === 'stage' && fact.stage === 'build-code');
    expect(stageFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ attempt_id: 'attempt-a', status: 'present', value: { outcome: 'failed' } }),
      expect.objectContaining({ attempt_id: 'attempt-b', value: { outcome: 'completed' } }),
    ]));
    expect(stageFacts).toHaveLength(2);
  });

  it('keeps transcript facts from each rerun attempt instead of filtering by a fixed fact id', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => JSON.stringify({ id: 'm1', type: 'message', run_id: 'run-1', usage: { input_tokens: 2, output_tokens: 3 } })) });
    const base = { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' };
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-a' }, stageOutcome: { status: 'failed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-b' }, stageOutcome: { status: 'completed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:01.000Z') });
    const tokenFacts = readTaskFacts(task.taskPath).filter((record) => record.fact_type === 'token');
    expect(tokenFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ attempt_id: 'attempt-a', value: expect.objectContaining({ message_id: 'm1' }) }),
      expect.objectContaining({ attempt_id: 'attempt-b', value: expect.objectContaining({ message_id: 'm1' }) }),
    ]));
    expect(new Set(tokenFacts.map((record) => record.fact_id)).size).toBe(2);
  });

  it('keeps source status facts bound to each rerun attempt', async () => {
    const { storageRoot, task } = fixture();
    const source = createRegisteredCodexSource({ source_id: 'codex-test', source_ref: 'codex-test-ref', registration_id: 'registration-1', required: true, task_id: 'm15-integration', run_id: 'run-1', session_id: 'session-1', source_format: 'jsonl', source_version: 'v1', cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => '') });
    const base = { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' };
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-a' }, stageOutcome: { status: 'completed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-b' }, stageOutcome: { status: 'completed' }, services: { resolveMonitoringSource: async () => source }, now: () => new Date('2026-08-12T00:00:01.000Z') });
    const sourceFacts = readTaskFacts(task.taskPath).filter((fact) => fact.fact_type === 'source_status' && fact.status === 'present');
    expect(sourceFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ attempt_id: 'attempt-a' }),
      expect.objectContaining({ attempt_id: 'attempt-b' }),
    ]));
    expect(new Set(sourceFacts.map((record) => record.fact_id)).size).toBe(2);
  });

  it('uses one derived attempt identity for stage and quality monitoring facts', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'review',
      status: 'recorded',
      subject: 'same_build_integration_review',
      evidence: [{ ref: 'quality/reviews/results/review.json', sha256: 'c'.repeat(64), evidence_type: 'review_result' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' },
      stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const facts = readTaskFacts(task.taskPath);
    const stage = facts.find((fact) => fact.fact_type === 'stage' && fact.stage === 'build-code');
    const review = facts.find((fact) => fact.fact_type === 'review');
    expect(stage?.attempt_id).toMatch(/^attempt-[a-f0-9]{32}$/);
    expect(review?.attempt_id).toBe(stage?.attempt_id);
  });

  it('maps verify owner facts without turning stale verification into success', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'passed', fresh: true });
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const verify = readTaskFacts(task.taskPath).find((fact) => fact.fact_type === 'verify');
    expect(verify).toMatchObject({
      status: 'present',
      attempt_id: 'attempt-verify',
      value: { invoked: true, fresh: true, outcome: 'passed', source_ref: 'quality/verify.json' },
      evidence_refs: ['quality/verify.json'],
    });
  });

  it('maps quality test facts into canonical monitoring observations', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'test',
      status: 'passed',
      subject: 'm15-focused-tests',
      evidence: [{ ref: 'quality/tests/m15-focused.json', sha256: 'c'.repeat(64), evidence_type: 'test_receipt' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-test' },
      stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'test',
        status: 'present',
        attempt_id: 'attempt-test',
        evidence_refs: [quality.ref],
        value: expect.objectContaining({ invoked: true, outcome: 'passed', freshness: 'current', source_ref: quality.ref }),
      }),
    ]));
  });

  it('keeps a failed quality review as a failed observation instead of hiding it as unknown', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'review',
      status: 'failed',
      subject: 'same_build_integration_review',
      evidence: [{ ref: 'quality/reviews/results/m15-failed.json', sha256: 'c'.repeat(64), evidence_type: 'review_result' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-review-failed' },
      stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'review',
        status: 'present',
        value: expect.objectContaining({ outcome: 'failed', invoked: true, source_ref: quality.ref }),
      }),
    ]));
  });

  it('preserves verify outcome and stale freshness instead of collapsing it to unknown', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'passed', fresh: false });
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify-stale' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'verify',
        status: 'present',
        value: { invoked: true, fresh: false, outcome: 'passed', source_ref: 'quality/verify.json' },
      }),
    ]));
  });

  it('keeps incomplete verify evidence incomplete instead of treating it as current', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'incomplete', fresh: true });
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify-incomplete' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: 'verify', status: 'incomplete', reason: 'verify_incomplete', value: null }),
    ]));
  });

  it('rejects a verify record bound to another task instead of publishing success', async () => {
    const { storageRoot, task } = fixture();
    publishVerifySummary(task.taskPath, { status: 'passed', fresh: true });
    const verifyPath = join(task.taskPath, 'quality', 'verify.json');
    const verify = JSON.parse(readFileSync(verifyPath, 'utf8'));
    verify.task_id = 'other-task';
    writeFileSync(verifyPath, `${JSON.stringify(verify)}\n`);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify-binding' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: 'verify', status: 'conflict', reason: 'verify_binding_conflict', error: 'VERIFY_SOURCE_BINDING_MISMATCH', value: null }),
    ]));
  });

  it('records a missing quality fact ref instead of silently dropping it', async () => {
    const { storageRoot, task } = fixture();
    const missingRef = `quality/facts/${'d'.repeat(64)}.json`;
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-quality-missing' },
      stageOutcome: { status: 'completed', quality_fact_refs: [missingRef] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fact_type: 'source_status',
        status: 'missing',
        reason: 'quality_fact_record_missing',
        evidence_refs: [missingRef],
      }),
    ]));
  });

  it('records an invalid quality ref without exposing the raw path', async () => {
    const { storageRoot, task } = fixture();
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-quality-invalid' },
      stageOutcome: { status: 'completed', quality_fact_refs: ['../private/quality.json'] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const invalid = readTaskFacts(task.taskPath).find((fact) => fact.reason === 'quality_fact_unsupported');
    expect(invalid).toMatchObject({ fact_type: 'source_status', status: 'unsupported', evidence_refs: [expect.stringMatching(/^quality-ref:/)] });
    expect(invalid.evidence_refs[0]).not.toContain('private');
  });

  it('keeps missing quality-source observations from repeated attempts', async () => {
    const { storageRoot, task } = fixture();
    const missingRef = `quality/facts/${'e'.repeat(64)}.json`;
    const run = (attempt_id) => runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id },
      stageOutcome: { status: 'completed', quality_fact_refs: [missingRef] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    await run('attempt-a');
    await run('attempt-b');
    const missing = readTaskFacts(task.taskPath).filter((fact) => fact.reason === 'quality_fact_record_missing');
    expect(missing.map((fact) => fact.attempt_id)).toEqual(expect.arrayContaining(['attempt-a', 'attempt-b']));
  });

  it('does not silently drop unsupported or cross-stage quality facts', async () => {
    const { storageRoot, task } = fixture();
    const unsupported = createQualityFact({ taskId: task.identity.taskId, stage: 'build-code', materialRevision: `revision-${'a'.repeat(64)}`, snapshotTree: 'b'.repeat(40), kind: 'acceptance_criterion', status: 'passed', subject: 'ac-1', evidence: [{ ref: 'quality/evidence/ac.json', sha256: 'c'.repeat(64), evidence_type: 'acceptance_evidence' }] });
    task.createRecordAtomic(unsupported.ref, unsupported.raw);
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-spec', attempt_id: 'attempt-binding' },
      stageOutcome: { status: 'completed', quality_fact_refs: [unsupported.ref] },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const status = readTaskFacts(task.taskPath).find((fact) => fact.error === 'UNSUPPORTED_QUALITY_FACT_KIND' || fact.error === 'QUALITY_FACT_STAGE_MISMATCH');
    expect(status).toMatchObject({ fact_type: 'source_status', status: 'unsupported', evidence_refs: [unsupported.ref] });
  });

  it('keeps quality observations from repeated attempts when the ref is unchanged', async () => {
    const { storageRoot, task } = fixture();
    const quality = createQualityFact({
      taskId: task.identity.taskId,
      stage: 'build-code',
      materialRevision: `revision-${'a'.repeat(64)}`,
      snapshotTree: 'b'.repeat(40),
      kind: 'test',
      status: 'passed',
      subject: 'm15-repeat-test',
      evidence: [{ ref: 'quality/tests/m15-repeat.json', sha256: 'c'.repeat(64), evidence_type: 'test_receipt' }],
    });
    task.createRecordAtomic(quality.ref, quality.raw);
    const base = { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', stageOutcome: { status: 'completed', quality_fact_refs: [quality.ref] }, services: { resolveMonitoringSource: async () => null }, now: () => new Date('2026-08-12T00:00:00.000Z') };
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-a' }, stageOutcome: base.stageOutcome, services: base.services, now: base.now });
    await runMonitoringSidecar({ context: { ...base, attempt_id: 'attempt-b' }, stageOutcome: base.stageOutcome, services: base.services, now: base.now });
    const tests = readTaskFacts(task.taskPath).filter((fact) => fact.fact_type === 'test');
    expect(tests.map((fact) => fact.attempt_id)).toEqual(expect.arrayContaining(['attempt-a', 'attempt-b']));
  });

  it('publishes verify missing when the quality owner record is unavailable', async () => {
    const { storageRoot, task } = fixture();
    rmSync(join(task.taskPath, 'quality/verify.json'));
    await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'verify-code', attempt_id: 'attempt-verify' },
      stageOutcome: { status: 'completed' },
      services: { resolveMonitoringSource: async () => null },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    const verify = readTaskFacts(task.taskPath).find((fact) => fact.fact_type === 'verify');
    expect(verify).toMatchObject({
      status: 'missing',
      reason: 'quality_verify_record_missing',
      attempt_id: 'attempt-verify',
      coverage: { observed: 0, expected: 1 },
    });
  });

  it('keeps absent host binding as missing instead of guessing a native session', async () => {
    const { storageRoot, task } = fixture();
    const result = await runMonitoringSidecar({ context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code' }, now: () => new Date('2026-08-12T00:00:00.000Z') });
    expect(result.status).toBe('missing');
    expect(readTaskFacts(task.taskPath)[0]).toMatchObject({ fact_type: 'source_status', status: 'missing', reason: 'no_registered_source' });
  });

  it('records a resolver binding conflict without reading or importing another task source', async () => {
    const { storageRoot, task } = fixture();
    let reads = 0;
    const source = createRegisteredCodexSource({
      source_id: 'codex-other-task', source_ref: 'codex-other-task-ref', registration_id: 'registration-1', required: true,
      task_id: 'other-task', run_id: 'other-run', session_id: 'session-other', source_format: 'jsonl', source_version: 'v1',
      cli_version: 'test', adapter_version: 'test-v1', reader: createTranscriptSourceReader(() => { reads += 1; return ''; }),
    });
    const result = await runMonitoringSidecar({
      context: { storageRoot, task, identity: task.identity, workflowRunId: 'run-1', stage: 'build-code', attempt_id: 'attempt-1' },
      services: { resolveMonitoringSource: async () => source },
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(result.status).toBe('conflict');
    expect(reads).toBe(0);
    expect(readTaskFacts(task.taskPath)).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: 'source_status', status: 'conflict', reason: 'source_binding_conflict' }),
    ]));
    expect(readTaskFacts(task.taskPath).every((fact) => fact.task_id === task.identity.taskId)).toBe(true);
  });

  it('rebuilds the global bundle when a sidecar fallback publishes stale state', () => {
    const { storageRoot, task } = fixture();
    const result = publishStaleMonitoringSnapshot({
      context: { storageRoot, task, identity: task.identity },
      message: 'monitoring sidecar failed: injected failure',
      now: () => new Date('2026-08-12T00:00:00.000Z'),
    });
    expect(result.projection.value.status).toBe('stale');
    expect(result.snapshot.snapshot.status).toBe('stale');
    expect(readFileSync(result.snapshot.outputData, 'utf8')).toContain('monitoring sidecar failed: injected failure');
  });

  it('keeps monitoring source capability private to the stage-runtime seam', async () => {
    let received;
    await stageRuntimeCliMain(['run', '--action=execute', '--stage=build-code', '--project=workflowhub', '--task=m15-integration'], {
      services: { resolveMonitoringSource: () => null },
      delegate: async (_argv, options) => { received = options.services; return { ok: true }; },
    });
    expect(received).toEqual(expect.objectContaining({ resolveMonitoringSource: expect.any(Function) }));
  });
});
