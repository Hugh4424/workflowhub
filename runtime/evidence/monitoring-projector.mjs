import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, renameSync, fsyncSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { deriveMonitoringDiagnostics, deriveMonitoringViewReadiness, VIEW_REQUIRED_FIELDS } from './monitoring-diagnostics.mjs';
import { safePublicRef } from './monitoring-facts.mjs';
import { readMonitoringFacts } from '../task/task-store.mjs';

const SAFE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const STALE_LOCK_MS = 10 * 60 * 1000;
const LOCK_RETRY_LIMIT = 200;
const LOCK_RETRY_MS = 10;
const LOCK_SLEEP = new Int32Array(new SharedArrayBuffer(4));
const HASH = /^[a-f0-9]{64}$/;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const factsDigest = (facts) => sha256(`${facts.map((fact) => JSON.stringify(fact)).join('\n')}${facts.length ? '\n' : ''}`);
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
  const factsKnown = Array.isArray(facts);
  const safeFacts = factsKnown ? facts : [];
  for (const [index, fact] of safeFacts.entries()) {
    if (fact?.task_id !== taskId || fact?.project_name !== projectName) {
      throw new Error(`monitoring fact identity mismatch at facts[${index}]`);
    }
  }
  const statuses = Object.fromEntries([...new Set(safeFacts.map((fact) => fact?.status).filter(Boolean))].sort().map((key) => [key, safeFacts.filter((fact) => fact.status === key).length]));
  const refs = [...new Set(safeFacts.flatMap((fact) => [...(fact.evidence_refs ?? []), fact.source?.ref].filter(Boolean)))].sort();
  const diagnostics = deriveMonitoringDiagnostics({ facts: safeFacts, topology });
  const factsHash = factsDigest(safeFacts);
  const inScopeTaskCount = factsKnown ? (safeFacts.length ? 1 : 0) : null;
  const views = deriveMonitoringViewReadiness({ facts: safeFacts, topology, diagnostics, inScopeTaskCount });
  const compatibility = {
    schema_version: 'monitoring-fact.v1',
    source_ids: [...new Set(safeFacts.map((fact) => fact?.source?.source_id).filter(Boolean))].sort(),
    skill_keys: [...new Set(safeFacts.map((fact) => fact?.skill_id && `${fact.source?.source_id ?? 'unknown'}+${fact.skill_id}+${fact.skill_version ?? 'unknown'}`).filter(Boolean))].sort(),
    grains: [...new Set(safeFacts.map((fact) => fact?.value?.grain).filter(Boolean))].sort(),
    coverage: { expected: safeFacts.length, observed: safeFacts.filter((fact) => fact?.status === 'present').length },
  };
  const hasFatal = safeFacts.some((fact) => fact?.status === 'fatal') || errors.some((error) => /security|path traversal|source validation/i.test(error));
  const completeStepStatuses = new Set(['present', 'completed', 'skipped', 'not_applicable', 'executed']);
  const completeSkillStatuses = new Set(['present', 'executed', 'not_applicable']);
  const diagnosticEntries = [...diagnostics.stage, ...diagnostics.steps, ...diagnostics.skills];
  const topologyUnavailable = safeFacts.some((fact) => ['stage', 'step', 'skill'].includes(fact?.fact_type)) && (!Array.isArray(topology?.stages) || topology.stages.length === 0);
  const diagnosticIncomplete = safeFacts.length > 0 && (topologyUnavailable
    || diagnostics.stage.some((entry) => entry.status !== 'present')
    || diagnostics.steps.some((entry) => !completeStepStatuses.has(entry.status))
    || diagnostics.skills.some((entry) => !completeSkillStatuses.has(entry.status)));
  const failureIncomplete = diagnostics.failures.some((entry) => !['present', 'executed', 'not_applicable'].includes(entry.status));
  const hasIncomplete = safeFacts.some((fact) => ['missing', 'unknown', 'unavailable', 'unsupported', 'incomplete', 'conflict'].includes(fact?.status)) || diagnosticIncomplete || failureIncomplete;
  // A caller may know that the source itself was readable (`current`), but
  // that does not make incomplete stage/step/skill facts complete. Never let
  // an explicit current label hide missing, unknown, partial, or conflicting
  // facts; the projection must disclose the weaker aggregate state.
  const inferredStatus = hasFatal
    ? 'fatal'
    : status === 'current' && (hasIncomplete || errors.length > 0)
      ? 'partial'
      : status ?? (errors.length || hasIncomplete ? 'partial' : factsKnown ? 'current' : 'unknown');
  const factObserved = safeFacts.filter((fact) => fact?.status === 'present').length;
  const expected = safeFacts.length === 0 ? 0 : Math.max(safeFacts.length, diagnosticIncomplete ? diagnosticEntries.length : safeFacts.length);
  const observed = safeFacts.length === 0 || topologyUnavailable ? 0 : factObserved;
  return {
    schema_version: 'monitoring-projection.v1', project_name: assertSegment(projectName, 'project_name'), task_id: assertSegment(taskId, 'task_id'),
    generated_at: generatedAt ?? new Date().toISOString(), status: inferredStatus, stale: inferredStatus === 'stale',
    facts_hash: factsHash, facts_revision: factsHash,
    coverage: { expected: factsKnown ? expected : null, observed }, in_scope_task_count: inScopeTaskCount,
    errors: [...errors, ...(hasFatal ? ['fatal monitoring fact present; projection is not current'] : [])], source_refs: refs,
    facts_summary: { count: safeFacts.length, statuses }, views, diagnostics: { ...diagnostics, compatibility },
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
  if (typeof value.status !== 'string' || !['present', 'missing', 'unknown', 'partial', 'fatal', 'conflict', 'pending', 'evidence_gap', 'out_of_order', 'executed', 'not_applicable', 'unavailable', 'unsupported', 'incomplete', 'insufficient_samples', 'failed', 'started', 'running', 'completed', 'skipped'].includes(value.status)) throw new Error(`${label}.status is invalid`);
  validateCoverage(value.coverage, `${label}.coverage`);
  if (!Array.isArray(value.errors) || value.errors.some((error) => typeof error !== 'string' || !error)) throw new Error(`${label}.errors is invalid`);
  validateRefs(value.source_refs, `${label}.source_refs`);
  for (const [key, predicate] of [
    ['step_slug', (candidate) => candidate === null || (typeof candidate === 'string' && candidate.length > 0)],
    ['step_order', (candidate) => candidate === null || nonNegativeInteger(candidate)],
    ['run_id', (candidate) => candidate === null || (typeof candidate === 'string' && candidate.length > 0)],
    ['attempt_id', (candidate) => candidate === null || (typeof candidate === 'string' && candidate.length > 0)],
    ['source_kind', (candidate) => candidate === null || (typeof candidate === 'string' && candidate.length > 0)],
    ['source_id', (candidate) => candidate === null || (typeof candidate === 'string' && candidate.length > 0)],
    ['observed_at', (candidate) => candidate === null || (typeof candidate === 'string' && Number.isFinite(Date.parse(candidate)))],
    ['result_summary', (candidate) => candidate === null || (typeof candidate === 'string' && candidate.length > 0)],
    ['evidence_summary', (candidate) => candidate === null || (typeof candidate === 'string' && candidate.length > 0)],
  ]) if (Object.hasOwn(value, key) && !predicate(value[key])) throw new Error(`${label}.${key} is invalid`);
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
function validateViewReadiness(value, label) {
  if (!plain(value) || !Array.isArray(value.required_fields) || value.required_fields.some((field) => typeof field !== 'string' || !field) || !exactKeys(value, ['required_fields', 'field_coverage', 'sample_sufficiency', 'reason', 'source_refs']) || !['sufficient', 'insufficient', 'empty_valid', 'unknown'].includes(value.sample_sufficiency) || (value.reason !== null && typeof value.reason !== 'string')) throw new Error(`${label} is invalid`);
  validateRefs(value.source_refs, `${label}.source_refs`);
  if (!plain(value.field_coverage)) throw new Error(`${label}.field_coverage is invalid`);
  for (const [field, coverage] of Object.entries(value.field_coverage)) {
    if (!plain(coverage) || !['status', 'expected', 'observed', 'reason', 'source_refs'].every((key) => key in coverage) || typeof coverage.status !== 'string' || !['present', 'missing', 'unknown', 'unavailable', 'unsupported', 'conflict', 'incomplete', 'insufficient_samples'].includes(coverage.status) || !nonNegativeInteger(coverage.expected) || !nonNegativeInteger(coverage.observed) || coverage.observed > coverage.expected || (coverage.reason !== null && typeof coverage.reason !== 'string')) throw new Error(`${label}.field_coverage.${field} is invalid`);
    validateRefs(coverage.source_refs, `${label}.field_coverage.${field}.source_refs`);
  }
  if (Object.keys(value.field_coverage).length !== value.required_fields.length || value.required_fields.some((field) => !Object.hasOwn(value.field_coverage, field))) throw new Error(`${label}.field_coverage does not match required_fields`);
}
function validateDiagnostics(value) {
  const keys = ['current', 'stage', 'steps', 'skills', 'failures', 'cost', 'automation', 'problems', 'trends', 'compatibility'];
  if (!exactKeys(value, keys)) throw new Error('monitoring projection diagnostics is invalid');
  if (!plain(value.current)
      || !['run_id', 'attempt_id', 'observed_at', 'fact_count', 'selection', 'run_ids', 'attempt_ids', 'stage_attempts', 'stage_coverage', 'step_coverage', 'skill_coverage'].every((key) => key in value.current)
      || (value.current.run_id !== null && typeof value.current.run_id !== 'string')
      || (value.current.attempt_id !== null && typeof value.current.attempt_id !== 'string')
      || (value.current.observed_at !== null && !Number.isFinite(Date.parse(value.current.observed_at)))
      || !nonNegativeInteger(value.current.fact_count)) throw new Error('monitoring projection diagnostics.current is invalid');
  if (typeof value.current.selection !== 'string' || !Array.isArray(value.current.run_ids) || !Array.isArray(value.current.attempt_ids)
      || value.current.run_ids.some((id) => typeof id !== 'string' || !id)
      || value.current.attempt_ids.some((id) => typeof id !== 'string' || !id)
      || !Array.isArray(value.current.stage_attempts)
      || value.current.stage_attempts.some((entry) => !plain(entry) || typeof entry.stage !== 'string' || !entry.stage
        || (entry.run_id !== null && typeof entry.run_id !== 'string')
        || (entry.attempt_id !== null && typeof entry.attempt_id !== 'string')
        || (entry.observed_at !== null && !Number.isFinite(Date.parse(entry.observed_at)))
        || !nonNegativeInteger(entry.fact_count))) throw new Error('monitoring projection diagnostics.current selection is invalid');
  for (const key of ['stage_coverage', 'step_coverage', 'skill_coverage']) validateCoverage(value.current[key], `monitoring projection diagnostics.current.${key}`);
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
  if (!plain(value.cost) || !['token_count', 'tool_use_count', 'retry_count', 'duration_ms', 'conflicts', 'token_waste', 'breakdown', 'duration_breakdown', 'breakdown_evidence'].every((key) => key in value.cost) || ['token_count', 'tool_use_count', 'retry_count'].some((key) => value.cost[key] !== null && !nonNegativeInteger(value.cost[key])) || !nonNegativeInteger(value.cost.conflicts) || (value.cost.duration_ms !== null && !nonNegativeInteger(value.cost.duration_ms)) || !plain(value.cost.breakdown) || !plain(value.cost.duration_breakdown) || !plain(value.cost.breakdown_evidence)) throw new Error('monitoring projection diagnostics.cost is invalid');
  validateTokenWaste(value.cost.token_waste, 'monitoring projection diagnostics.cost.token_waste');
  for (const [label, breakdown] of [['breakdown', value.cost.breakdown], ['duration_breakdown', value.cost.duration_breakdown]]) for (const dimension of ['stage', 'step', 'skill', 'session', 'subagent']) {
    if (!plain(breakdown[dimension]) || Object.values(breakdown[dimension]).some((amount) => !nonNegativeInteger(amount))) throw new Error(`monitoring projection diagnostics.cost.${label}.${dimension} is invalid`);
  }
  for (const dimension of ['stage', 'step', 'skill', 'session', 'subagent']) {
    if (!plain(value.cost.breakdown_evidence[dimension]) || Object.values(value.cost.breakdown_evidence[dimension]).some((refs) => !Array.isArray(refs))) throw new Error(`monitoring projection diagnostics.cost.breakdown_evidence.${dimension} is invalid`);
    for (const refs of Object.values(value.cost.breakdown_evidence[dimension])) validateRefs(refs, `monitoring projection diagnostics.cost.breakdown_evidence.${dimension}`);
  }
  if (!plain(value.automation) || !plain(value.automation.rate) || !plain(value.automation.human_intervention) || typeof value.automation.rate.status !== 'string' || typeof value.automation.human_intervention.status !== 'string') throw new Error('monitoring projection diagnostics.automation is invalid');
  if (!plain(value.trends) || typeof value.trends.status !== 'string' || !plain(value.trends.metrics)) throw new Error('monitoring projection diagnostics.trends is invalid');
  for (const [key, metric] of Object.entries(value.trends.metrics)) validateTrendMetric(metric, `monitoring projection diagnostics.trends.metrics.${key}`);
  if (!exactKeys(value.compatibility, ['schema_version', 'source_ids', 'skill_keys', 'grains', 'coverage']) || typeof value.compatibility.schema_version !== 'string' || !Array.isArray(value.compatibility.source_ids) || !Array.isArray(value.compatibility.skill_keys) || !Array.isArray(value.compatibility.grains) || [...value.compatibility.source_ids, ...value.compatibility.skill_keys, ...value.compatibility.grains].some((ref) => typeof ref !== 'string' || ref.length === 0)) throw new Error('monitoring projection diagnostics.compatibility is invalid');
  for (const [key, refs] of Object.entries({ source_ids: value.compatibility.source_ids, skill_keys: value.compatibility.skill_keys, grains: value.compatibility.grains })) validateRefs(refs, `monitoring projection diagnostics.compatibility.${key}`);
  validateCoverage(value.compatibility.coverage, 'monitoring projection diagnostics.compatibility.coverage');
}

export function validateMonitoringProjection(value) {
  if (!value || typeof value !== 'object' || value.schema_version !== 'monitoring-projection.v1' || !SAFE.test(value.project_name ?? '') || !SAFE.test(value.task_id ?? '') || !Number.isFinite(Date.parse(value.generated_at)) || !['current', 'partial', 'stale', 'fatal', 'unknown'].includes(value.status) || typeof value.stale !== 'boolean' || value.stale !== (value.status === 'stale') || !HASH.test(value.facts_hash ?? '') || !HASH.test(value.facts_revision ?? '') || value.facts_hash !== value.facts_revision || !Array.isArray(value.errors) || value.errors.some((error) => typeof error !== 'string' || !error)) throw new Error('monitoring projection is invalid');
  validateCoverage(value.coverage, 'monitoring projection coverage');
  if (value.in_scope_task_count !== null && !nonNegativeInteger(value.in_scope_task_count)) throw new Error('monitoring projection in_scope_task_count is invalid');
  if (!plain(value.views) || !exactKeys(value.views, ['task_overview', 'process_degradation', 'cost_attribution', 'problems_trends'])) throw new Error('monitoring projection views is invalid');
  for (const [key, view] of Object.entries(value.views)) validateViewReadiness(view, `monitoring projection views.${key}`);
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

function readCanonicalTaskFacts(storageRoot) {
  const projectsRoot = join(storageRoot, 'Projects');
  if (!existsSync(projectsRoot)) return { found: false, entries: [], errors: [] };
  const entries = [];
  const errors = [];
  const errorEntries = [];
  let found = false;
  for (const projectEntry of readdirSync(projectsRoot, { withFileTypes: true })) {
    if (!projectEntry.isDirectory() || projectEntry.isSymbolicLink() || !SAFE.test(projectEntry.name)) continue;
    const tasksRoot = join(projectsRoot, projectEntry.name, 'tasks');
    if (!existsSync(tasksRoot) || !lstatSync(tasksRoot).isDirectory()) continue;
    for (const taskEntry of readdirSync(tasksRoot, { withFileTypes: true })) {
      if (!taskEntry.isDirectory() || taskEntry.isSymbolicLink() || !SAFE.test(taskEntry.name)) continue;
      const taskRoot = join(tasksRoot, taskEntry.name);
      const factsPath = join(taskRoot, 'facts.jsonl');
      if (!existsSync(factsPath)) continue;
      found = true;
      try {
        if (lstatSync(factsPath).isSymbolicLink()) throw new Error('canonical facts path is a symbolic link');
        const manifest = JSON.parse(readFileSync(join(taskRoot, 'task.json'), 'utf8'));
        if (manifest.project_name !== projectEntry.name || manifest.task_id !== taskEntry.name) {
          // Old task directories can be retained under the current storage
          // root with an empty facts file and a pre-cutover identity (for
          // example, a historical project-name case). They contain no
          // monitoring evidence to publish and are outside the fresh-task
          // scope; leave them read-only and do not let them poison the current
          // global snapshot. A non-empty malformed task remains a hard error.
          if (readFileSync(factsPath, 'utf8').trim() === '') continue;
          throw new Error('canonical task identity mismatch');
        }
        const facts = readMonitoringFacts(taskRoot);
        entries.push({ projectName: projectEntry.name, taskId: taskEntry.name, taskRoot, facts });
      } catch (error) {
        const message = error?.message ?? 'canonical facts unavailable';
        errors.push(`${relative(storageRoot, taskRoot)}: ${message}`);
        errorEntries.push({ projectName: projectEntry.name, taskId: taskEntry.name, taskRoot, message });
      }
    }
  }
  return { found, entries: entries.sort((a, b) => a.projectName.localeCompare(b.projectName) || a.taskId.localeCompare(b.taskId)), errors, errorEntries };
}

function staticHtml() {
  return readFileSync(new URL('./monitoring-page.html', import.meta.url), 'utf8');
}

function aggregateViews(records) {
  const keys = ['task_overview', 'process_degradation', 'cost_attribution', 'problems_trends'];
  const inScopeValues = records.map((record) => record.in_scope_task_count);
  const inScopeTaskCount = inScopeValues.every((value) => Number.isInteger(value)) ? inScopeValues.reduce((sum, value) => sum + value, 0) : null;
  const views = {};
  for (const key of keys) {
    const sourceViews = records.map((record) => record.views?.[key]).filter(Boolean);
    const requiredFields = sourceViews[0]?.required_fields ?? VIEW_REQUIRED_FIELDS[key] ?? [];
    const fieldCoverage = Object.fromEntries(requiredFields.map((field) => {
      const entries = sourceViews.map((view) => view.field_coverage?.[field]).filter(Boolean);
      const statuses = new Set(entries.map((entry) => entry.status));
      const status = statuses.has('unknown') || statuses.has('conflict') ? 'unknown' : statuses.size === 1 ? [...statuses][0] : statuses.has('incomplete') ? 'incomplete' : statuses.has('unavailable') ? 'unavailable' : statuses.has('unsupported') ? 'unsupported' : statuses.has('missing') ? 'missing' : statuses.has('insufficient_samples') ? 'insufficient_samples' : 'present';
      return [field, { status, expected: entries.reduce((sum, entry) => sum + entry.expected, 0), observed: entries.reduce((sum, entry) => sum + entry.observed, 0), reason: entries.find((entry) => entry.reason)?.reason ?? null, source_refs: [...new Set(entries.flatMap((entry) => entry.source_refs ?? []))].sort() }];
    }));
    const samples = sourceViews.map((view) => view.sample_sufficiency);
    const sampleSufficiency = !records.length || (samples.length && samples.every((sample) => sample === 'empty_valid')) ? 'empty_valid' : inScopeTaskCount === null ? 'unknown' : samples.some((sample) => sample === 'unknown') ? 'unknown' : samples.every((sample) => sample === 'sufficient') ? 'sufficient' : 'insufficient';
    views[key] = { required_fields: requiredFields, field_coverage: fieldCoverage, sample_sufficiency: sampleSufficiency, reason: sourceViews.find((view) => view.reason)?.reason ?? null, source_refs: [...new Set(sourceViews.flatMap((view) => view.source_refs ?? []))].sort() };
  }
  return { in_scope_task_count: inScopeTaskCount, views };
}

export function rebuildGlobalMonitoringSnapshot({ storageRoot, generatedAt, topology = { stages: [] }, preferDerived = false } = {}) {
  if (typeof storageRoot !== 'string' || storageRoot.trim() === '') throw new TypeError('storageRoot is required');
  const projectsRoot = join(storageRoot, 'Projects'); mkdirSync(projectsRoot, { recursive: true });
  const outputJsonl = join(projectsRoot, 'workflowhub-monitor-facts.jsonl');
  const outputData = join(projectsRoot, 'workflowhub-monitor-data.js');
  const outputHtml = join(projectsRoot, 'workflowhub-monitor.html');
  const lock = join(projectsRoot, '.workflowhub-monitor.lock');
  const fd = acquireGlobalLock(lock);
  try {
    const canonical = preferDerived ? { found: false, entries: [], errors: [], errorEntries: [] } : readCanonicalTaskFacts(storageRoot);
    const previousEntries = readProjectionFiles(storageRoot).filter((entry) => entry.value);
    const previousByKey = new Map(previousEntries.map((entry) => [`${entry.value.project_name}|${entry.value.task_id}`, entry.value]));
    const stalePrevious = (value, message) => {
      if (!value) return null;
      const stale = { ...value, status: 'stale', stale: true, errors: [...new Set([...(value.errors ?? []), message])] };
      return validateMonitoringProjection(stale);
    };
    let entries;
    let compatibilityFallback = false;
    const canonicalErrors = canonical.errors;
    if (canonical.found) {
      entries = canonical.entries.map((entry) => {
        try {
          const value = validateMonitoringProjection(projectionFor({ projectName: entry.projectName, taskId: entry.taskId, facts: entry.facts, topology, generatedAt }));
          const path = projectionPath(storageRoot, entry.projectName, entry.taskId);
          atomicWrite(path, json(value));
          return { path, value };
        } catch (error) {
          const path = projectionPath(storageRoot, entry.projectName, entry.taskId);
          const message = error?.message ?? 'canonical projection failed';
          return { path, error: message, value: stalePrevious(previousByKey.get(`${entry.projectName}|${entry.taskId}`), message) };
        }
      });
      for (const entry of canonical.errorEntries ?? []) {
        const path = projectionPath(storageRoot, entry.projectName, entry.taskId);
        entries.push({ path, error: entry.message, value: stalePrevious(previousByKey.get(`${entry.projectName}|${entry.taskId}`), entry.message) });
      }
    } else {
      entries = readProjectionFiles(storageRoot);
      compatibilityFallback = entries.length > 0;
    }
    const errors = [...canonicalErrors, ...entries.filter((entry) => entry.error).map((entry) => `${relative(storageRoot, entry.path)}: ${entry.error}`)];
    const records = entries.filter((entry) => entry.value).map((entry) => entry.value);
    const scopedTaskCount = canonical.found
      ? canonical.entries.length + (canonical.errorEntries?.length ?? 0)
      : entries.length;
    const fatal = records.some((record) => record.status === 'fatal');
    const staleRecord = records.some((record) => record.status === 'stale');
    const partial = records.some((record) => ['partial', 'missing', 'unknown', 'conflict'].includes(record.status));
    const recordErrors = records.flatMap((record) => (record.errors ?? []).map((error) => `${record.project_name}/${record.task_id}: ${error}`));
    const snapshotErrors = [...errors, ...recordErrors, ...(fatal ? ['fatal monitoring projection present; global snapshot is stale'] : [])];
    const snapshotStale = errors.length > 0 || fatal || staleRecord;
    const aggregate = aggregateViews(records);
    const snapshot = { schema_version: 'monitoring-snapshot.v1', generated_at: generatedAt ?? new Date().toISOString(), status: snapshotStale ? 'stale' : (partial || compatibilityFallback ? 'partial' : records.length ? 'current' : 'empty'), stale: snapshotStale, coverage: { expected: scopedTaskCount, observed: records.filter((record) => record.status === 'current').length }, in_scope_task_count: canonical.found && (canonical.errorEntries?.length ?? 0) > 0 ? null : aggregate.in_scope_task_count, views: aggregate.views, errors: [...snapshotErrors, ...(compatibilityFallback ? ['canonical facts unavailable; existing derived projections used for compatibility'] : [])], records };
    const lines = records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : '');
    atomicWrite(outputJsonl, lines);
    const safeData = JSON.stringify(snapshot).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
    atomicWrite(outputData, `globalThis.__WH_MONITOR_DATA__ = Object.freeze(${safeData});\n`);
    atomicWrite(outputHtml, staticHtml());
    return Object.freeze({ outputJsonl, outputData, outputHtml, snapshot, sha256: sha256(JSON.stringify(snapshot)) });
  } finally { closeSync(fd); try { unlinkSync(lock); } catch {} }
}
