import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, renameSync, fsyncSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { deriveMonitoringDiagnostics } from './monitoring-diagnostics.mjs';
import { safePublicRef } from './monitoring-facts.mjs';

const SAFE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const STALE_LOCK_MS = 10 * 60 * 1000;
const LOCK_RETRY_LIMIT = 200;
const LOCK_RETRY_MS = 10;
const LOCK_SLEEP = new Int32Array(new SharedArrayBuffer(4));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const assertSegment = (value, label) => { if (typeof value !== 'string' || !SAFE.test(value)) throw new Error(`${label} is unsafe`); return value; };

function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  writeFileSync(temporary, content, { flag: 'wx', mode: 0o600 });
  const fd = openSync(temporary, 'r+');
  try { fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, path);
}

function reclaimStaleLock(lock) {
  const tombstone = `${lock}.${process.pid}.${Math.random().toString(16).slice(2)}.stale`;
  try {
    // Rename is the atomic ownership claim. Only one contender can move the
    // stale lock out of the way; the later open(wx) then cannot overwrite a
    // lock claimed by another contender during recovery.
    renameSync(lock, tombstone);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'EEXIST') return null;
    throw error;
  }
  try {
    const fd = openSync(lock, 'wx', 0o600);
    writeFileSync(fd, `${process.pid}\n`);
    return fd;
  } finally {
    try { unlinkSync(tombstone); } catch {}
  }
}

function acquireGlobalLock(lock) {
  for (let attempt = 0; attempt < LOCK_RETRY_LIMIT; attempt += 1) {
    try {
      const fd = openSync(lock, 'wx', 0o600);
      writeFileSync(fd, `${process.pid}\n`);
      return fd;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      let owner = null;
      try { owner = Number.parseInt(readFileSync(lock, 'utf8').trim(), 10); } catch {}
      if (Number.isInteger(owner) && owner > 0) {
        try { process.kill(owner, 0); } catch (probeError) {
          if (probeError?.code === 'ESRCH') {
            const fd = reclaimStaleLock(lock);
            if (fd !== null) return fd;
          }
        }
      }
      try {
        const stat = lstatSync(lock);
        if (Date.now() - stat.mtimeMs > STALE_LOCK_MS) {
          const fd = reclaimStaleLock(lock);
          if (fd !== null) return fd;
        }
      } catch {}
      if (attempt + 1 < LOCK_RETRY_LIMIT) {
        Atomics.wait(LOCK_SLEEP, 0, 0, LOCK_RETRY_MS);
        continue;
      }
      throw new Error('monitoring global projector lock is busy');
    }
  }
  throw new Error('monitoring global projector lock is busy');
}

function projectionPath(storageRoot, projectName, taskId) {
  assertSegment(projectName, 'project_name'); assertSegment(taskId, 'task_id');
  return join(storageRoot, 'Projects', projectName, 'monitoring', 'tasks', `${taskId}.json`);
}

function projectionFor({ projectName, taskId, facts, topology, generatedAt, status = null, errors = [] }) {
  const safeFacts = Array.isArray(facts) ? facts : [];
  const statuses = Object.fromEntries([...new Set(safeFacts.map((fact) => fact?.status).filter(Boolean))].sort().map((key) => [key, safeFacts.filter((fact) => fact.status === key).length]));
  const refs = [...new Set(safeFacts.flatMap((fact) => [...(fact.evidence_refs ?? []), fact.source?.ref].filter(Boolean)))].sort();
  const diagnostics = deriveMonitoringDiagnostics({ facts: safeFacts, topology });
  const compatibility = {
    schema_version: 'monitoring-fact.v1',
    source_ids: [...new Set(safeFacts.map((fact) => fact?.source?.source_id).filter(Boolean))].sort(),
    skill_keys: [...new Set(safeFacts.map((fact) => fact?.skill_id && `${fact.source?.source_id ?? 'unknown'}+${fact.skill_id}+${fact.skill_version ?? 'unknown'}`).filter(Boolean))].sort(),
    grains: [...new Set(safeFacts.map((fact) => fact?.value?.grain).filter(Boolean))].sort(),
    coverage: { expected: safeFacts.length, observed: safeFacts.filter((fact) => fact?.status === 'present').length },
  };
  const hasFatal = safeFacts.some((fact) => fact?.status === 'fatal');
  const completeStepStatuses = new Set(['present', 'completed', 'skipped', 'not_applicable', 'executed']);
  const completeSkillStatuses = new Set(['present', 'executed', 'not_applicable']);
  const diagnosticEntries = [...diagnostics.stage, ...diagnostics.steps, ...diagnostics.skills];
  const topologyUnavailable = safeFacts.some((fact) => ['stage', 'step', 'skill'].includes(fact?.fact_type)) && (!Array.isArray(topology?.stages) || topology.stages.length === 0);
  const diagnosticIncomplete = safeFacts.length > 0 && (topologyUnavailable
    || diagnostics.stage.some((entry) => entry.status !== 'present')
    || diagnostics.steps.some((entry) => !completeStepStatuses.has(entry.status))
    || diagnostics.skills.some((entry) => !completeSkillStatuses.has(entry.status)));
  const failureIncomplete = diagnostics.failures.some((entry) => !['present', 'executed', 'not_applicable'].includes(entry.status));
  const hasIncomplete = safeFacts.some((fact) => ['missing', 'unknown', 'partial', 'conflict'].includes(fact?.status)) || diagnosticIncomplete || failureIncomplete;
  // A caller may know that the source itself was readable (`current`), but
  // that does not make incomplete stage/step/skill facts complete. Never let
  // an explicit current label hide missing, unknown, partial, or conflicting
  // facts; the projection must disclose the weaker aggregate state.
  const inferredStatus = hasFatal
    ? 'fatal'
    : status === 'current' && (hasIncomplete || errors.length > 0)
      ? 'partial'
      : status ?? (errors.length || hasIncomplete ? 'partial' : safeFacts.length ? 'current' : 'empty');
  const factObserved = safeFacts.filter((fact) => fact?.status === 'present').length;
  const expected = safeFacts.length === 0 ? 0 : Math.max(safeFacts.length, diagnosticIncomplete ? diagnosticEntries.length : safeFacts.length);
  const observed = safeFacts.length === 0 || topologyUnavailable ? 0 : factObserved;
  return {
    schema_version: 'monitoring-projection.v1', project_name: assertSegment(projectName, 'project_name'), task_id: assertSegment(taskId, 'task_id'),
    generated_at: generatedAt ?? new Date().toISOString(), status: inferredStatus, stale: inferredStatus === 'stale',
    coverage: { expected, observed }, errors: [...errors, ...(hasFatal ? ['fatal monitoring fact present; projection is not current'] : [])], source_refs: refs,
    facts_summary: { count: safeFacts.length, statuses }, diagnostics: { ...diagnostics, compatibility },
  };
}

function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exactKeys(value, expected) { return plain(value) && Object.keys(value).sort().join('\0') === [...expected].sort().join('\0'); }
function nonNegativeInteger(value) { return Number.isInteger(value) && value >= 0; }
function validateCoverage(value, label) {
  if (!exactKeys(value, ['expected', 'observed']) || !nonNegativeInteger(value.observed) || (value.expected !== null && (!nonNegativeInteger(value.expected) || value.observed > value.expected))) throw new Error(`${label} is invalid`);
}
function validateRefs(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} is invalid`);
  for (const [index, ref] of value.entries()) {
    try { safePublicRef(ref, `${label}[${index}]`); } catch { throw new Error(`${label} is invalid`); }
  }
}
function validateDiagnosticEntry(value, label, required = ['status', 'coverage', 'errors', 'source_refs']) {
  if (!plain(value) || required.some((key) => !(key in value))) throw new Error(`${label} is invalid`);
  if (typeof value.status !== 'string' || !['present', 'missing', 'unknown', 'partial', 'fatal', 'conflict', 'pending', 'evidence_gap', 'out_of_order', 'executed', 'not_applicable', 'unavailable', 'insufficient_samples', 'failed', 'started', 'running', 'completed', 'skipped'].includes(value.status)) throw new Error(`${label}.status is invalid`);
  validateCoverage(value.coverage, `${label}.coverage`);
  if (!Array.isArray(value.errors) || value.errors.some((error) => typeof error !== 'string' || !error)) throw new Error(`${label}.errors is invalid`);
  validateRefs(value.source_refs, `${label}.source_refs`);
}
function validateProblemEntry(value, label) {
  if (!plain(value) || typeof value.domain !== 'string' || !Number.isInteger(value.count) || value.count < 0 || (value.friction_type !== null && typeof value.friction_type !== 'string') || (value.error_code !== null && typeof value.error_code !== 'string')) throw new Error(`${label} is invalid`);
  validateRefs(value.source_refs, `${label}.source_refs`);
}
function validateTokenWaste(value, label) {
  if (!exactKeys(value, ['status', 'value', 'reason']) || !['present', 'unknown'].includes(value.status) || (value.status === 'present' && !nonNegativeInteger(value.value)) || (value.status === 'unknown' && value.value !== null) || typeof value.reason !== 'string' || !value.reason) throw new Error(`${label} is invalid`);
}
function validateTrendMetric(value, label) {
  if (!plain(value) || typeof value.status !== 'string' || !nonNegativeInteger(value.buckets) || !nonNegativeInteger(value.usable_buckets) || !nonNegativeInteger(value.numerator) || !nonNegativeInteger(value.denominator) || value.usable_buckets > value.buckets || value.numerator > value.denominator || !plain(value.samples)) throw new Error(`${label} is invalid`);
  for (const sample of Object.values(value.samples)) {
    if (!plain(sample) || !nonNegativeInteger(sample.numerator) || !nonNegativeInteger(sample.denominator) || sample.numerator > sample.denominator) throw new Error(`${label}.samples is invalid`);
  }
}
function validateDiagnostics(value) {
  const keys = ['stage', 'steps', 'skills', 'failures', 'cost', 'automation', 'problems', 'trends', 'compatibility'];
  if (!exactKeys(value, keys)) throw new Error('monitoring projection diagnostics is invalid');
  for (const key of ['stage', 'steps', 'skills', 'failures', 'problems']) {
    if (!Array.isArray(value[key])) throw new Error(`monitoring projection diagnostics.${key} is invalid`);
    value[key].forEach((entry, index) => {
      if (key === 'problems') validateProblemEntry(entry, `monitoring projection diagnostics.${key}[${index}]`);
      else {
        validateDiagnosticEntry(entry, `monitoring projection diagnostics.${key}[${index}]`);
        if (['stage', 'steps', 'skills'].includes(key) && typeof entry.id !== 'string' || ['steps', 'skills'].includes(key) && typeof entry.stage !== 'string' || key === 'failures' && typeof entry.domain !== 'string') throw new Error(`monitoring projection diagnostics.${key}[${index}] identity is invalid`);
      }
    });
  }
  if (!plain(value.cost) || !['token_count', 'tool_use_count', 'retry_count', 'duration_ms', 'conflicts', 'token_waste', 'breakdown'].every((key) => key in value.cost) || ['token_count', 'tool_use_count', 'retry_count'].some((key) => value.cost[key] !== null && !nonNegativeInteger(value.cost[key])) || !nonNegativeInteger(value.cost.conflicts) || (value.cost.duration_ms !== null && !nonNegativeInteger(value.cost.duration_ms)) || !plain(value.cost.breakdown)) throw new Error('monitoring projection diagnostics.cost is invalid');
  validateTokenWaste(value.cost.token_waste, 'monitoring projection diagnostics.cost.token_waste');
  for (const dimension of ['stage', 'skill', 'session', 'subagent']) {
    if (!plain(value.cost.breakdown[dimension]) || Object.values(value.cost.breakdown[dimension]).some((amount) => !nonNegativeInteger(amount))) throw new Error(`monitoring projection diagnostics.cost.breakdown.${dimension} is invalid`);
  }
  if (!plain(value.automation) || !plain(value.automation.rate) || !plain(value.automation.human_intervention) || typeof value.automation.rate.status !== 'string' || typeof value.automation.human_intervention.status !== 'string') throw new Error('monitoring projection diagnostics.automation is invalid');
  if (!plain(value.trends) || typeof value.trends.status !== 'string' || !plain(value.trends.metrics)) throw new Error('monitoring projection diagnostics.trends is invalid');
  for (const [key, metric] of Object.entries(value.trends.metrics)) validateTrendMetric(metric, `monitoring projection diagnostics.trends.metrics.${key}`);
  if (!exactKeys(value.compatibility, ['schema_version', 'source_ids', 'skill_keys', 'grains', 'coverage']) || typeof value.compatibility.schema_version !== 'string' || !Array.isArray(value.compatibility.source_ids) || !Array.isArray(value.compatibility.skill_keys) || !Array.isArray(value.compatibility.grains) || [...value.compatibility.source_ids, ...value.compatibility.skill_keys, ...value.compatibility.grains].some((ref) => typeof ref !== 'string' || ref.length === 0)) throw new Error('monitoring projection diagnostics.compatibility is invalid');
  for (const [key, refs] of Object.entries({ source_ids: value.compatibility.source_ids, skill_keys: value.compatibility.skill_keys, grains: value.compatibility.grains })) validateRefs(refs, `monitoring projection diagnostics.compatibility.${key}`);
  validateCoverage(value.compatibility.coverage, 'monitoring projection diagnostics.compatibility.coverage');
}

export function validateMonitoringProjection(value) {
  if (!value || typeof value !== 'object' || value.schema_version !== 'monitoring-projection.v1' || !SAFE.test(value.project_name ?? '') || !SAFE.test(value.task_id ?? '') || !Number.isFinite(Date.parse(value.generated_at)) || !['current', 'partial', 'stale', 'fatal', 'empty'].includes(value.status) || typeof value.stale !== 'boolean' || value.stale !== (value.status === 'stale') || !Array.isArray(value.errors) || value.errors.some((error) => typeof error !== 'string' || !error)) throw new Error('monitoring projection is invalid');
  validateCoverage(value.coverage, 'monitoring projection coverage');
  if (!Array.isArray(value.source_refs)) throw new Error('monitoring projection source_refs is invalid');
  validateRefs(value.source_refs, 'monitoring projection source_refs');
  if (!plain(value.facts_summary) || !nonNegativeInteger(value.facts_summary.count) || !plain(value.facts_summary.statuses) || Object.values(value.facts_summary.statuses).some((count) => !nonNegativeInteger(count)) || Object.values(value.facts_summary.statuses).reduce((sum, count) => sum + count, 0) !== value.facts_summary.count) throw new Error('monitoring projection facts_summary is invalid');
  validateDiagnostics(value.diagnostics);
  return value;
}

export function publishTaskMonitoringProjection({ storageRoot, projectName, taskId, facts = [], topology = { stages: [] }, generatedAt, status, errors = [] } = {}) {
  if (typeof storageRoot !== 'string' || storageRoot.trim() === '') throw new TypeError('storageRoot is required');
  const value = validateMonitoringProjection(projectionFor({ projectName, taskId, facts, topology, generatedAt, status, errors }));
  const path = projectionPath(storageRoot, projectName, taskId);
  atomicWrite(path, json(value));
  return Object.freeze({ path, value, sha256: sha256(json(value)) });
}

function readProjectionFiles(storageRoot) {
  const projectsRoot = join(storageRoot, 'Projects');
  if (!existsSync(projectsRoot)) return [];
  const projections = [];
  for (const projectEntry of readdirSync(projectsRoot, { withFileTypes: true })) {
    if (!projectEntry.isDirectory() || projectEntry.isSymbolicLink() || !SAFE.test(projectEntry.name)) continue;
    const taskRoot = join(projectsRoot, projectEntry.name, 'monitoring', 'tasks');
    if (!existsSync(taskRoot) || !lstatSync(taskRoot).isDirectory()) continue;
    for (const taskEntry of readdirSync(taskRoot, { withFileTypes: true })) {
      if (!taskEntry.isFile() || taskEntry.isSymbolicLink() || !taskEntry.name.endsWith('.json')) continue;
      const path = join(taskRoot, taskEntry.name);
      try {
        const value = JSON.parse(readFileSync(path, 'utf8'));
        if (value.project_name !== projectEntry.name || `${value.task_id}.json` !== taskEntry.name) throw new Error('projection identity mismatch');
        validateMonitoringProjection(value);
        projections.push({ path, value });
      } catch (error) {
        projections.push({ path, error: error?.message ?? 'invalid projection' });
      }
    }
  }
  return projections.sort((a, b) => (a.value?.project_name ?? a.path).localeCompare(b.value?.project_name ?? b.path) || (a.value?.task_id ?? a.path).localeCompare(b.value?.task_id ?? b.path));
}

function staticHtml() {
  return readFileSync(new URL('./monitoring-page.html', import.meta.url), 'utf8');
}

export function rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt } = {}) {
  if (typeof storageRoot !== 'string' || storageRoot.trim() === '') throw new TypeError('storageRoot is required');
  const projectsRoot = join(storageRoot, 'Projects'); mkdirSync(projectsRoot, { recursive: true });
  const outputJsonl = join(projectsRoot, 'workflowhub-monitor-facts.jsonl');
  const outputData = join(projectsRoot, 'workflowhub-monitor-data.js');
  const outputHtml = join(projectsRoot, 'workflowhub-monitor.html');
  const lock = join(projectsRoot, '.workflowhub-monitor.lock');
  const fd = acquireGlobalLock(lock);
  try {
    const entries = readProjectionFiles(storageRoot);
    const errors = entries.filter((entry) => entry.error).map((entry) => `${relative(storageRoot, entry.path)}: ${entry.error}`);
    const records = entries.filter((entry) => entry.value).map((entry) => entry.value);
    const fatal = records.some((record) => record.status === 'fatal');
    const staleRecord = records.some((record) => record.status === 'stale');
    const partial = records.some((record) => ['partial', 'missing', 'unknown', 'conflict'].includes(record.status));
    const recordErrors = records.flatMap((record) => (record.errors ?? []).map((error) => `${record.project_name}/${record.task_id}: ${error}`));
    const snapshotErrors = [...errors, ...recordErrors, ...(fatal ? ['fatal monitoring projection present; global snapshot is stale'] : [])];
    const allEmpty = records.length > 0 && records.every((record) => record.status === 'empty');
    const snapshotStale = errors.length > 0 || fatal || staleRecord;
    const snapshot = { schema_version: 'monitoring-snapshot.v1', generated_at: generatedAt ?? new Date().toISOString(), status: snapshotStale ? 'stale' : (allEmpty ? 'empty' : partial ? 'partial' : records.length ? 'current' : 'empty'), stale: snapshotStale, coverage: { expected: entries.length, observed: records.filter((record) => record.status === 'current').length }, errors: snapshotErrors, records };
    const lines = records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : '');
    atomicWrite(outputJsonl, lines);
    const safeData = JSON.stringify(snapshot).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
    atomicWrite(outputData, `globalThis.__WH_MONITOR_DATA__ = Object.freeze(${safeData});\n`);
    atomicWrite(outputHtml, staticHtml());
    return Object.freeze({ outputJsonl, outputData, outputHtml, snapshot, sha256: sha256(JSON.stringify(snapshot)) });
  } finally { closeSync(fd); try { unlinkSync(lock); } catch {} }
}
