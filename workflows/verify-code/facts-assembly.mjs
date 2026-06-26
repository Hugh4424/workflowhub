import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const METRIC_KEYS = [
  'execution_id', 'skill_or_stage', 'stage', 'skill_version',
  'executed', 'tokens', 'duration_ms', 'rework_rounds',
  'human_intervention', 'friction_ref',
];

/**
 * Extract command from build-code facts. Throws on missing command.
 */
export function readCommand(buildResult) {
  if (!buildResult.facts || !buildResult.facts.tests) {
    const err = new Error('facts.tests not found in build result');
    err.retryable = true;
    throw err;
  }
  if (!buildResult.facts.tests.command) {
    const err = new Error('command field missing in facts.tests — build-code must include command in facts output');
    err.retryable = true;
    throw err;
  }
  return buildResult.facts.tests.command;
}

/**
 * Assemble a 7-key stage-result object.
 */
export function assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable }) {
  const strippedRef = evidenceRef.startsWith('specs/')
    ? evidenceRef.replace(/^specs\/[^/]+\//, '')
    : evidenceRef;
  return {
    verdict,
    evidence_ref: strippedRef,
    anomaly_flags: anomalyFlags,
    missing_items: missingItems,
    user_decision: userDecision,
    reason,
    error_code: errorCode,
  };
}

/**
 * Write stage-result JSON to specs/{taskId}/stage-result-verify-code.json.
 */
export function writeStageResult(taskSpecDir, taskId, result) {
  mkdirSync(taskSpecDir, { recursive: true });
  const path = join(taskSpecDir, 'stage-result-verify-code.json');
  writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');
}

/**
 * Validate a metric record has all 10 required keys.
 */
export function validateMetricRecord(record) {
  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
  return { valid: missing.length === 0, missing };
}
