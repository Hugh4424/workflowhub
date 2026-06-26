import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

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

export function assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable }) {
  // FR-PATH-003: evidence_ref must be relative path WITHOUT specs/{task-id}/ prefix
  if (evidenceRef.startsWith('/')) {
    throw new Error(`evidence_ref must be a relative path, absolute paths are not allowed, got: ${evidenceRef}`);
  }
  if (evidenceRef.includes('../')) {
    throw new Error(`evidence_ref must not contain path traversal (../), got: ${evidenceRef}`);
  }
  if (evidenceRef.startsWith('specs/')) {
    throw new Error(`evidence_ref must be a relative path without 'specs/{task-id}/' prefix, got: ${evidenceRef}`);
  }
  return {
    verdict,
    evidence_ref: evidenceRef,
    anomaly_flags: anomalyFlags,
    missing_items: missingItems,
    user_decision: userDecision,
    reason,
    error_code: errorCode,
  };
}

export function writeStageResult(taskSpecDir, result) {
  mkdirSync(taskSpecDir, { recursive: true });
  const path = join(taskSpecDir, 'stage-result-verify-code.json');
  writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');
}

export function validateMetricRecord(record) {
  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
  return { valid: missing.length === 0, missing };
}
