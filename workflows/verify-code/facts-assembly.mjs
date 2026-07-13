import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { carryAuditSummary, verifyAuditCarrier } from '../../core/audit-summary-carrier.mjs';

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

export function assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable, workflowRunId, auditSummaryRef, auditVerdict, auditSummaryHash, auditSummary }) {
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
  const auditFacts = auditSummary
    ? carryAuditSummary(auditSummaryRef, auditSummary)
    : auditSummaryRef != null || auditVerdict != null || auditSummaryHash != null
      ? { audit_contract_version: 'v1', audit_summary_ref: auditSummaryRef, audit_verdict: auditVerdict, audit_summary_hash: auditSummaryHash }
      : {};
  const carrier = verifyAuditCarrier(auditFacts);
  if (!carrier.ok) throw new Error(carrier.errors.join('; '));
  return {
    status: verdict,
    retryable: retryable ?? false,
    facts: {
      evidence_ref: evidenceRef,
      anomaly_flags: anomalyFlags,
      ...auditFacts,
    },
    missing_items: missingItems,
    user_decision: userDecision,
    reason,
    error_code: errorCode ?? '',
    ...(workflowRunId != null ? { workflow_run_id: workflowRunId } : {}),
  };
}

export function writeStageResult(taskSpecDir, result, auditOptions = {}) {
  mkdirSync(taskSpecDir, { recursive: true });
  const path = join(taskSpecDir, 'stage-result-verify-code.json');
  // Consumer-only boundary: aggregator owns verdict construction.  This
  // function persists the already verified reference/hash without reading a
  // journal or deriving another quality conclusion.
  writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');
}

export function validateMetricRecord(record) {
  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
  return { valid: missing.length === 0, missing };
}
