import { validateTaskId } from '../../core/task-identity.mjs';

const METRIC_KEYS = [
  'execution_id', 'skill_or_stage', 'stage', 'skill_version',
  'executed', 'tokens', 'duration_ms', 'rework_rounds',
  'human_intervention', 'friction_ref',
];

export function readCommand(buildResult) {
  if (!buildResult.facts || !buildResult.facts.tests) {
    const err = new Error('facts.tests not found in build result');
    err.retryable = true;
    throw err;
  }
  const cmd = buildResult.facts.tests.command;
  if (!cmd) {
    const err = new Error('command field missing in facts.tests — build-code must include command in facts output');
    err.retryable = true;
    throw err;
  }
  if (typeof cmd !== 'string') {
    const err = new Error(`facts.tests.command must be a string, got ${typeof cmd}`);
    err.retryable = true;
    throw err;
  }
  return cmd;
}

export function assembleVerifyAttempt({ taskId, createdAt, facts, evidenceRefs = [], missingItems = [], reason = '' } = {}) {
  const task = validateTaskId(taskId);
  if (typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt))) {
    throw new TypeError('createdAt must be a valid timestamp');
  }
  if (!facts || typeof facts !== 'object' || Array.isArray(facts)) {
    throw new TypeError('facts must be an object');
  }
  if (!Array.isArray(evidenceRefs)) throw new TypeError('evidenceRefs must be an array');
  for (const ref of evidenceRefs) {
    if (typeof ref !== 'string' || ref === '' || ref.startsWith('/') || ref.startsWith('specs/') ||
        ref.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) {
      throw new Error(`evidence reference must be relative, traversal-free, and outside specs: ${ref}`);
    }
  }
  if (!Array.isArray(missingItems)) throw new TypeError('missingItems must be an array');
  return {
    task_id: task,
    stage: 'verify-code',
    created_at: new Date(createdAt).toISOString(),
    facts: structuredClone(facts),
    evidence_refs: [...evidenceRefs],
    missing_items: [...missingItems],
    reason: String(reason),
  };
}

export function validateMetricRecord(record) {
  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
  return { valid: missing.length === 0, missing };
}
