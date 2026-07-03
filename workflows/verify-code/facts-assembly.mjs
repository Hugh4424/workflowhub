import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { AUDIT_SUMMARY_FIELDS } from '../../core/journal-schema.mjs';
import { buildAuditSummaryFromJournalEvents, journalPathForTaskDir } from '../../core/receipt-writer.mjs';

const METRIC_KEYS = [
  'execution_id', 'skill_or_stage', 'stage', 'skill_version',
  'executed', 'tokens', 'duration_ms', 'rework_rounds',
  'human_intervention', 'friction_ref',
];

function emptyAuditSummary() {
  return Object.fromEntries(AUDIT_SUMMARY_FIELDS.map((field) => [field, 0]));
}

function parseJournalJsonl(journalPath) {
  const raw = readFileSync(journalPath, 'utf-8').trim();
  if (!raw) return [];
  return raw.split('\n').map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`journal.jsonl line ${index + 1} is malformed: ${message}`);
    }
  });
}

function appendAuditWarnings(result, warnings) {
  if (warnings.length === 0) return result;
  const suffix = `audit_summary warnings: ${warnings.join(', ')}`;

  if (typeof result.notes === 'string' && result.notes.trim() !== '') {
    return { ...result, notes: `${result.notes}; ${suffix}` };
  }
  if (typeof result.notes === 'string') {
    return { ...result, notes: suffix };
  }
  if (typeof result.reason === 'string' && result.reason.trim() !== '') {
    return { ...result, reason: `${result.reason}; ${suffix}` };
  }
  return { ...result, reason: suffix };
}

function withAuditSummary(taskSpecDir, result, { workflowRunId, stageSlug = 'vc' } = {}) {
  const warnings = [];
  let auditSummary = emptyAuditSummary();
  // Use the shared path helper from receipt-writer so both sides always
  // point to the same file (fix #1 / round-2 finding — path unification).
  const journalPath = journalPathForTaskDir(taskSpecDir);
  const resolvedWorkflowRunId = workflowRunId ?? result.workflow_run_id ?? result.workflowRunId;

  if (!resolvedWorkflowRunId) {
    warnings.push('audit_summary_omitted:missing_workflow_run_id');
  } else if (!existsSync(journalPath)) {
    warnings.push('audit_summary_omitted:missing_journal');
  } else {
    // A malformed journal must not interrupt writeStageResult — catch parse
    // errors, record the warning, and continue with an empty audit_summary
    // (SKILL.md fault-tolerance contract / round-3 finding).
    try {
      const events = parseJournalJsonl(journalPath);
      const summary = buildAuditSummaryFromJournalEvents(events, { stageSlug, workflowRunId: resolvedWorkflowRunId });
      auditSummary = summary.audit_summary;
      warnings.push(...summary.warnings);
    } catch (err) {
      warnings.push('audit_summary_omitted:malformed_journal');
    }
  }

  return appendAuditWarnings({ ...result, audit_summary: auditSummary }, warnings);
}

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

export function assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable, workflowRunId }) {
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
    status: verdict,
    retryable: retryable ?? false,
    facts: {
      evidence_ref: evidenceRef,
      anomaly_flags: anomalyFlags,
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
  writeFileSync(path, JSON.stringify(withAuditSummary(taskSpecDir, result, auditOptions), null, 2), 'utf-8');
}

export function validateMetricRecord(record) {
  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
  return { valid: missing.length === 0, missing };
}
