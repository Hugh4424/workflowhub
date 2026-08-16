const STAGES = Object.freeze(['make-decision', 'build-spec', 'build-plan', 'build-code', 'verify-code']);
const FAILURE_DOMAINS = new Set(['task_dir', 'worktree', 'review', 'verify', 'handoff', 'transcript', 'skill_missing', 'artifact_missing', 'token_waste']);
const CONTROLLED_DIAGNOSTIC_STATUSES = new Set(['present', 'missing', 'unknown', 'partial', 'fatal', 'conflict', 'pending', 'evidence_gap', 'out_of_order', 'executed', 'not_applicable', 'unavailable', 'unsupported', 'incomplete', 'insufficient_samples', 'failed', 'started', 'running', 'completed', 'skipped']);
const HEALTH_STATUS_ALIASES = new Map([['mismatch', 'partial'], ['stale', 'partial']]);
const NON_PRESENT_FACT_STATUSES = new Set(['missing', 'unknown', 'unavailable', 'unsupported', 'conflict', 'incomplete']);
const VIEW_REQUIRED_FIELDS = Object.freeze({
  task_overview: Object.freeze(['task_id', 'project_name', 'run_id', 'attempt_id', 'stage.value.outcome', 'source.status', 'coverage']),
  process_degradation: Object.freeze([
    'expected_topology',
    'stage.status', 'stage.reason/error', 'stage.coverage', 'stage.evidence_refs',
    'step.status', 'step.reason/error', 'step.coverage', 'step.evidence_refs',
    'skill.status', 'skill.reason/error', 'skill.coverage', 'skill.evidence_refs',
    'artifact.status', 'artifact.reason/error', 'artifact.coverage', 'artifact.evidence_refs',
    'health.status', 'health.reason/error', 'health.coverage', 'health.evidence_refs',
    'review.status', 'review.reason/error', 'review.coverage', 'review.evidence_refs',
    'verify.status', 'verify.reason/error', 'verify.coverage', 'verify.evidence_refs',
  ]),
  cost_attribution: Object.freeze(['session_id', 'subagent_id', 'stage', 'skill_id', 'token.message_id', 'tool_use.tool_use_id', 'duration.duration_ms', 'retry.retry_id', 'source', 'attempt_id']),
  problems_trends: Object.freeze(['health.domain', 'health.friction_type', 'health.error_code', 'observed_at', 'coverage', 'source_refs', 'compatible_time_buckets', 'denominator']),
});

const asArray = (value) => Array.isArray(value) ? value : [];
const evidenceRefs = (fact) => [...new Set([...(fact?.evidence_refs ?? []), fact?.source?.ref].filter(Boolean))];
const present = (fact) => fact?.status === 'present' && fact?.value && typeof fact.value === 'object';
const controlledHealthStatus = (value, fallback = 'unknown') => {
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  if (CONTROLLED_DIAGNOSTIC_STATUSES.has(value)) return value;
  return HEALTH_STATUS_ALIASES.get(value) ?? 'unknown';
};
const factStatus = (fact, fallback = 'unknown') => {
  if (!fact) return fallback;
  if (fact.status === 'present' && typeof fact.value?.outcome === 'string') return fact.value.outcome;
  if (fact.status === 'present') return 'present';
  return fact.status ?? fallback;
};
function isTranscriptSourceFact(fact) {
  return fact?.fact_type === 'source_status' && fact?.source?.kind !== 'quality';
}

function latestTranscriptSourceFacts(facts) {
  const rows = asArray(facts).filter(isTranscriptSourceFact);
  if (!rows.length) return [];
  const attempts = new Map();
  for (const [index, row] of rows.entries()) {
    const key = attemptIdentity(row);
    const group = attempts.get(key) ?? [];
    group.push({ row, index });
    attempts.set(key, group);
  }
  return [...attempts.values()].map((group) => group.reduce((latest, candidate) => {
    if (!latest) return candidate;
    const latestTime = Date.parse(latest.row.observed_at ?? '');
    const candidateTime = Date.parse(candidate.row.observed_at ?? '');
    if ((!Number.isFinite(latestTime) && Number.isFinite(candidateTime))
      || (Number.isFinite(candidateTime) && candidateTime > latestTime)
      || (candidateTime === latestTime && candidate.index > latest.index)) return candidate;
    return latest;
  }, null).row);
}

function sourceCollectionStatus(facts, stage = null) {
  const rows = latestTranscriptSourceFacts(facts).filter((fact) => stage === null || fact.stage === stage || fact.value?.scope === 'task');
  if (!rows.length) return 'unknown';
  const statuses = new Set(rows.map((fact) => fact.status).filter(Boolean));
  for (const status of ['conflict', 'unavailable', 'unsupported', 'incomplete', 'unknown', 'missing']) if (statuses.has(status)) return status;
  return statuses.has('present') ? 'present' : 'unknown';
}
function sourceCapabilities(facts, stage = null) {
  const rows = latestTranscriptSourceFacts(facts).filter((fact) => stage === null || fact.stage === stage || fact.value?.scope === 'task');
  const values = rows.map((fact) => fact.value?.capabilities).filter(Array.isArray);
  return values.length === rows.length && values.length > 0 ? new Set(values.flat()) : null;
}
function eventFallbackForSource(sourceStatus, factType, facts, stage = null) {
  if (sourceStatus === 'present') {
    const capabilities = sourceCapabilities(facts, stage);
    if (!capabilities) return 'unknown';
    return capabilities.has(factType) ? 'missing' : 'unsupported';
  }
  if (sourceStatus === 'missing') return 'unavailable';
  return sourceStatus;
}
function guardedEventStatus(source, sourceStatus, factType, facts, stage = null) {
  if (!source) return eventFallbackForSource(sourceStatus, factType, facts, stage);
  if (['stage', 'quality'].includes(source.source?.kind)) return factStatus(source);
  if (source?.status === 'present') return factStatus(source);
  if (source && sourceStatus === 'present') return factStatus(source);
  if (sourceStatus !== 'present') return eventFallbackForSource(sourceStatus, factType, facts, stage);
  return factStatus(source, 'missing');
}
function resolveIdentityFacts(facts, keyFn) {
  const groups = new Map();
  for (const fact of asArray(facts)) {
    const key = keyFn(fact);
    if (key === null) continue;
    const group = groups.get(key) ?? [];
    group.push(fact); groups.set(key, group);
  }
  return new Map([...groups].map(([key, group]) => {
    if (group.length < 2) return [key, group[0]];
    const sources = new Set(group.map((fact) => fact.source?.source_id ?? 'unknown'));
    const signatures = new Set(group.map((fact) => JSON.stringify({ status: fact.status, value: fact.value })));
    if (sources.size > 1 || signatures.size > 1) return [key, { ...group[0], status: 'conflict', value: null, reason: 'duplicate_id_conflict', error: 'FACT_IDENTITY_CONFLICT', coverage: { expected: 1, observed: 0 } }];
    return [key, group[0]];
  }));
}

function attemptIdentity(fact) {
  return `${fact?.run_id ?? 'default'}:${fact?.attempt_id ?? 'default'}`;
}

function selectCurrentAttempt(facts) {
  const rows = asArray(facts);
  let winner = null;
  rows.forEach((fact, index) => {
    if (!fact || (fact.run_id == null && fact.attempt_id == null)) return;
    const observedAt = Date.parse(fact.observed_at ?? '');
    if (!winner
      || (!Number.isFinite(winner.observedAt) && Number.isFinite(observedAt))
      || (Number.isFinite(observedAt) && observedAt > winner.observedAt)
      || (observedAt === winner.observedAt && index > winner.index)) {
      winner = { fact, index, observedAt };
    }
  });
  if (!winner) return { run_id: null, attempt_id: null, observed_at: null, facts: rows };
  const identity = attemptIdentity(winner.fact);
  const currentFacts = rows.filter((fact) => attemptIdentity(fact) === identity);
  const observedTimes = currentFacts.map((fact) => Date.parse(fact?.observed_at ?? '')).filter(Number.isFinite);
  return {
    run_id: winner.fact.run_id ?? null,
    attempt_id: winner.fact.attempt_id ?? null,
    observed_at: observedTimes.length ? new Date(Math.max(...observedTimes)).toISOString() : null,
    facts: currentFacts,
  };
}

// A task may have one attempt per stage (for example, build-code and
// verify-code can be invoked separately). Selecting one global attempt makes
// the page hide otherwise valid stage details. Keep attempts isolated within
// each stage, then use the newest attempt for that stage. This is deliberately
// a stage-scoped snapshot, not a claim that all stages share one run.
function selectCurrentStageAttempts(facts) {
  const rows = asArray(facts);
  const global = selectCurrentAttempt(rows);
  const byStage = new Map();
  for (const [index, fact] of rows.entries()) {
    if (!fact?.stage || !STAGES.includes(fact.stage)) continue;
    const key = attemptIdentity(fact);
    const group = byStage.get(fact.stage) ?? new Map();
    const attempt = group.get(key) ?? { facts: [], latestIndex: index, latestObservedAt: -Infinity };
    attempt.facts.push(fact);
    const observedAt = Date.parse(fact.observed_at ?? '');
    if ((Number.isFinite(observedAt) && observedAt > attempt.latestObservedAt)
      || (observedAt === attempt.latestObservedAt && index > attempt.latestIndex)) {
      attempt.latestObservedAt = Number.isFinite(observedAt) ? observedAt : attempt.latestObservedAt;
      attempt.latestIndex = index;
    }
    group.set(key, attempt);
    byStage.set(fact.stage, group);
  }
  const stageAttempts = new Map();
  const selected = [];
  for (const [stage, attempts] of byStage.entries()) {
    const winner = [...attempts.values()].reduce((current, candidate) => {
      if (!current) return candidate;
      if (candidate.latestObservedAt > current.latestObservedAt) return candidate;
      if (candidate.latestObservedAt === current.latestObservedAt && candidate.latestIndex > current.latestIndex) return candidate;
      return current;
    }, null);
    if (!winner) continue;
    selected.push(...winner.facts);
    const representative = winner.facts.reduce((current, candidate) => {
      if (!current) return candidate;
      const currentTime = Date.parse(current.observed_at ?? '');
      const candidateTime = Date.parse(candidate.observed_at ?? '');
      return (!Number.isFinite(currentTime) && Number.isFinite(candidateTime)) || candidateTime > currentTime ? candidate : current;
    }, null);
    stageAttempts.set(stage, {
      run_id: representative?.run_id ?? null,
      attempt_id: representative?.attempt_id ?? null,
      observed_at: Number.isFinite(winner.latestObservedAt) ? new Date(winner.latestObservedAt).toISOString() : null,
    });
  }
  // Source/quality facts without a stage still belong to the newest global
  // attempt. Keep only those facts; never use them to overwrite a stage's
  // selected attempt.
  const globalIdentity = `${global.run_id ?? 'default'}:${global.attempt_id ?? 'default'}`;
  selected.push(...rows.filter((fact) => !fact?.stage && attemptIdentity(fact) === globalIdentity));
  return {
    facts: selected,
    stageAttempts,
    global,
    scope: 'latest_attempt_per_stage',
  };
}

function evidenceDetails(fact) {
  if (!fact) return { source_kind: null, source_id: null, observed_at: null, evidence_summary: null };
  const value = fact.value && typeof fact.value === 'object' ? fact.value : {};
  const summary = [
    typeof value.outcome === 'string' ? `结果=${value.outcome}` : null,
    typeof value.result_summary === 'string' ? `执行说明=${value.result_summary}` : null,
    typeof value.trigger === 'boolean' ? `触发=${value.trigger ? '是' : '否'}` : null,
    typeof value.executed === 'boolean' ? `执行=${value.executed ? '是' : '否'}` : null,
    typeof fact.reason === 'string' ? `原因=${fact.reason}` : null,
    typeof fact.error === 'string' ? `错误=${fact.error}` : null,
  ].filter(Boolean).join('；');
  return {
    source_kind: typeof fact.source?.kind === 'string' ? fact.source.kind : null,
    source_id: typeof fact.source?.source_id === 'string' ? fact.source.source_id : null,
    observed_at: typeof fact.observed_at === 'string' ? fact.observed_at : null,
    result_summary: typeof value.result_summary === 'string' ? value.result_summary : null,
    evidence_summary: summary || `状态=${fact.status ?? 'unknown'}`,
  };
}

function attributionIdentity(fact) {
  return [fact?.task_id, fact?.project_name, fact?.run_id, fact?.attempt_id]
    .map((value) => typeof value === 'string' && value ? value : 'unknown')
    .join('|');
}

function sourceIdentity(fact) {
  return typeof fact?.source?.source_id === 'string' && fact.source.source_id ? fact.source.source_id : null;
}

function resolveLatestIdentityFacts(facts, identityFn, baseFn) {
  const grouped = resolveIdentityFacts(facts, identityFn);
  const latest = new Map();
  for (const fact of grouped.values()) {
    const base = baseFn(fact);
    const prior = latest.get(base);
    if (!prior) { latest.set(base, fact); continue; }
    const currentTime = Date.parse(fact.observed_at ?? '');
    const priorTime = Date.parse(prior.observed_at ?? '');
    if ((!Number.isFinite(priorTime) && Number.isFinite(currentTime)) || (Number.isFinite(currentTime) && currentTime >= priorTime)) latest.set(base, fact);
  }
  return latest;
}

function stageDiagnostics(topology, facts, stageAttempts = new Map()) {
  const observed = resolveLatestIdentityFacts(asArray(facts).filter((f) => f?.fact_type === 'stage' && f.stage), (f) => `${f.stage}:${attemptIdentity(f)}`, (f) => f.stage);
  const lastObserved = Math.max(...STAGES.map((id) => observed.has(id) ? STAGES.indexOf(id) : -1));
  return STAGES.map((id, index) => {
    const source = observed.get(id);
    const outcome = source?.value?.outcome;
    let status = source
      ? source.status === 'present'
        ? outcome === 'failed' ? 'failed' : outcome === 'fatal' ? 'fatal' : 'present'
      : factStatus(source)
      : 'pending';
    if (!source && index < lastObserved) status = 'evidence_gap';
    const identity = stageAttempts.get(id);
    const witness = status === 'evidence_gap'
      ? STAGES.slice(index + 1).map((stageId) => observed.get(stageId)).find(Boolean)
      : null;
    const witnessRefs = evidenceRefs(witness);
    return {
      id,
      run_id: identity?.run_id ?? source?.run_id ?? null,
      attempt_id: identity?.attempt_id ?? source?.attempt_id ?? null,
      status,
      coverage: source?.coverage ?? { expected: 1, observed: source ? 1 : 0 },
      errors: source?.error ? [source.error] : [],
      reason: source?.reason ?? (status === 'evidence_gap' ? 'stage_evidence_gap' : null),
      source_refs: source ? evidenceRefs(source) : witnessRefs,
      ...(status === 'evidence_gap'
        ? {
            source_kind: witness?.source?.kind ?? null,
            source_id: witness?.source?.source_id ?? null,
            observed_at: witness?.observed_at ?? null,
            evidence_summary: witness
              ? `后续阶段 ${witness.stage} 已有事实；当前阶段没有阶段事实`
              : '当前阶段没有阶段事实',
          }
        : evidenceDetails(source)),
    };
  });
}

function stepDiagnostics(topology, facts, cost = null) {
  const stepFacts = asArray(facts).filter((f) => f?.fact_type === 'step' && f.step_id !== null && f.step_id !== undefined);
  const byKey = resolveLatestIdentityFacts(stepFacts, (f) => `${f.stage ?? ''}:${String(f.step_id)}:${attemptIdentity(f)}`, (f) => `${f.stage ?? ''}:${String(f.step_id)}`);
  const outOfOrder = new Set();
  const previousByAttempt = new Map();
  for (const stage of asArray(topology?.stages)) {
    const order = new Map(asArray(stage.steps).map((step, index) => [String(step.id), index]));
    for (const source of stepFacts.filter((f) => f.stage === stage.id)) {
      const current = order.get(String(source.step_id));
      if (current === undefined) continue;
      const sequenceKey = `${stage.id}:${attemptIdentity(source)}`;
      const previous = previousByAttempt.get(sequenceKey) ?? -1;
      if (current < previous) outOfOrder.add(`${stage.id}:${String(source.step_id)}`);
      previousByAttempt.set(sequenceKey, Math.max(previous, current));
    }
  }
  return asArray(topology?.stages).flatMap((stage) => asArray(stage.steps).map((step) => {
    const key = `${stage.id}:${String(step.id)}`;
    const source = byKey.get(key);
    const id = String(step.id);
    const expectedSlug = typeof step.slug === 'string' ? step.slug : null;
    const identityConflict = source && source.step_slug !== null && source.step_slug !== undefined && source.step_slug !== expectedSlug;
    const costKey = expectedSlug ? `${stage.id}+${expectedSlug}` : null;
    const sourceStatus = sourceCollectionStatus(facts, stage.id);
    return { id, stage: stage.id, step_slug: expectedSlug, step_order: Number.isInteger(step.order) ? step.order : null, status: identityConflict ? 'conflict' : source && outOfOrder.has(key) ? 'out_of_order' : guardedEventStatus(source, sourceStatus, 'step', facts, stage.id), coverage: identityConflict ? { expected: 1, observed: 0 } : source?.coverage ?? { expected: 1, observed: 0 }, errors: identityConflict ? ['STEP_MANIFEST_IDENTITY_MISMATCH'] : source?.error ? [source.error] : [], reason: identityConflict ? 'step_slug_does_not_match_manifest' : source?.reason ?? (source ? null : sourceStatus === 'present' ? null : `source_${sourceStatus}`), source_refs: [...new Set([...evidenceRefs(source), ...(costKey ? cost?.breakdown_evidence?.step?.[costKey] ?? [] : [])])], ...evidenceDetails(source) };
  }));
}

function skillDiagnostics(topology, facts) {
  const byId = resolveLatestIdentityFacts(asArray(facts).filter((f) => f?.fact_type === 'skill' && f.skill_id), (f) => `${f.stage ?? ''}:${f.skill_id}:${attemptIdentity(f)}`, (f) => `${f.stage ?? ''}:${f.skill_id}`);
  return asArray(topology?.stages).flatMap((stage) => asArray(stage.skills).map((skill) => {
    const source = byId.get(`${stage.id}:${skill.id}`);
    const value = source?.value ?? {};
    const sourceStatus = sourceCollectionStatus(facts, stage.id);
    let status = source ? guardedEventStatus(source, sourceStatus, 'skill', facts, stage.id) : skill.trigger === false ? 'incomplete' : eventFallbackForSource(sourceStatus, 'skill', facts, stage.id);
    const fallbackReason = !source && skill.trigger === false ? 'skill_skip_reason_unavailable' : null;
    if (value.trigger === false && typeof value.reason === 'string' && value.reason.trim()) status = 'not_applicable';
    else if (value.trigger === false) status = 'incomplete';
    else if (value.trigger === true && value.executed === true) status = 'executed';
    else if (value.trigger === true) status = 'missing';
    else if (skill.trigger === true && source?.status === 'unknown' && source.reason === 'unavailable') status = 'unavailable';
    else if (skill.trigger === true && !source) status = eventFallbackForSource(sourceStatus, 'skill', facts, stage.id);
    return { id: skill.id, stage: stage.id, status, reason: value.reason ?? source?.reason ?? (value.trigger === false ? 'skill_skip_reason_unavailable' : fallbackReason), coverage: source?.coverage ?? { expected: 1, observed: source ? 1 : 0 }, errors: source?.error ? [source.error] : [], source_refs: evidenceRefs(source), ...evidenceDetails(source) };
  }));
}

function failureDiagnostics(facts) {
  const qualityDomains = new Map([
    ['review', 'review'],
    ['test', 'review'],
    ['verify', 'verify'],
    ['artifact', 'artifact_missing'],
    ['transcript_event', 'transcript'],
  ]);
  const structured = asArray(facts).filter((f) =>
    f?.fact_type === 'health'
      || (isTranscriptSourceFact(f) && f.status !== 'present')
      || (qualityDomains.has(f?.fact_type) && (f.status !== 'present' || f.value?.outcome === 'failed' || f.value?.fresh === false)))
    .map((f) => ({ fact: f, value: f.value ?? {} }))
    .map(({ fact: f, value }) => ({
      domain: f.fact_type === 'source_status' ? 'transcript' : qualityDomains.get(f.fact_type) ?? (value.domain === 'taskPath' ? 'task_dir' : value.domain),
      status: value.fresh === false ? 'partial' : value.outcome === 'failed' ? 'failed' : controlledHealthStatus(value.status, f.status ?? 'unknown'),
      coverage: f.coverage ?? { expected: 1, observed: 1 },
      errors: f.error ? [f.error] : (f.reason ? [f.reason] : []),
      source_refs: evidenceRefs(f),
      friction_type: value.friction_type ?? null,
      error_code: value.error_code ?? null,
    }))
    .map((entry) => FAILURE_DOMAINS.has(entry.domain) ? entry : { ...entry, domain: 'unknown', errors: [...entry.errors, 'unmapped_failure_domain'] });
  const provenWaste = asArray(facts)
    .filter((f) => f?.fact_type === 'token' && f.status === 'conflict' && f.reason === 'duplicate_id_conflict')
    .map((f) => ({ domain: 'token_waste', status: 'conflict', coverage: f.coverage ?? { expected: 1, observed: 0 }, errors: f.error ? [f.error] : ['duplicate_id_conflict'], source_refs: evidenceRefs(f), friction_type: 'duplicate_id', error_code: f.error ?? 'DUPLICATE_ID_CONFLICT' }));
  return [...structured, ...provenWaste];
}

function costDiagnostics(facts, topology = { stages: [] }) {
  const tokens = new Map(), outcomeTokenRows = new Map(), tokenRows = new Map(), tokenGroups = new Map(), toolRows = new Map(), toolGroups = new Map(), retryGroups = new Map(), retryRows = new Map(), retries = new Set(), durationGroups = new Map(), durationRows = new Map(), durationEntries = new Map(), durationConflicts = new Set();
  const breakdown = { stage: {}, step: {}, skill: {}, session: {}, subagent: {} };
  const durationBreakdown = { stage: {}, step: {}, skill: {}, session: {}, subagent: {} };
  const breakdownEvidence = { stage: {}, step: {}, skill: {}, session: {}, subagent: {} };
  const declaredSteps = new Map(asArray(topology?.stages).flatMap((stage) => asArray(stage.steps).map((step) => [`${stage.id}:${String(step.id)}`, step])));
  const stepKey = (row) => {
    if (!row?.stage || row.step === null || row.step === undefined) return null;
    const declared = declaredSteps.get(`${row.stage}:${String(row.step)}`);
    return declared && typeof row.step_slug === 'string' && row.step_slug === declared.slug
      ? `${row.stage}+${row.step_slug}`
      : null;
  };
  const addBreakdown = (dimension, key, amount, refs) => {
    if (typeof key !== 'string' || !key) return;
    breakdownEvidence[dimension][key] = [...new Set([...(breakdownEvidence[dimension][key] ?? []), ...(refs ?? [])])];
    return amount;
  };
  const starts = new Map(), ends = new Map(), explicitDurations = new Set();
  let conflicts = 0;
  let tokenConflicts = 0;
  const recordDuration = (key, row) => {
    if (durationConflicts.has(key)) return;
    const prior = durationEntries.get(key);
    if (prior && (prior.duration_ms !== row.duration_ms || prior.grain !== row.grain)) {
      durationConflicts.add(key);
      durationEntries.delete(key);
      conflicts += 1;
      return;
    }
    if (!prior) durationEntries.set(key, row);
  };
  for (const fact of asArray(facts)) {
    const value = fact?.value ?? {};
    if (fact?.status === 'conflict') {
      conflicts += 1;
      if (fact.fact_type === 'token' && fact.reason === 'duplicate_id_conflict') tokenConflicts += 1;
    }
    if (fact?.fact_type === 'token' && fact.status === 'present' && typeof value.message_id === 'string') {
      const amount = Number.isFinite(value.total_tokens)
        ? value.total_tokens
        : Number.isFinite(value.tokens)
          ? value.tokens
          : Number.isFinite(value.input_tokens) && Number.isFinite(value.output_tokens)
            ? value.input_tokens + value.output_tokens
            : null;
      if (Number.isFinite(amount)) {
        const grain = typeof value.grain === 'string' && value.grain ? value.grain : 'message';
        const attempt = fact.attempt_id ?? fact.run_id ?? 'default';
        const identity = `${attributionIdentity(fact)}|${value.message_id}|${grain}|${attempt}`;
        const sourceId = sourceIdentity(fact);
        if (!sourceId) { conflicts += 1; continue; }
        const rowKey = `${sourceId}|${identity}`;
        const prior = tokenRows.get(rowKey);
        if (prior) {
          if (prior.amount !== amount || prior.run !== fact.run_id || prior.attempt !== fact.attempt_id || prior.stage !== fact.stage || prior.skill !== fact.skill_id || prior.session !== fact.session_id || prior.subagent !== fact.subagent_id) tokenGroups.get(identity).conflict = true;
          continue;
        }
        const group = tokenGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
        if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
        group.sources.add(sourceId); group.rows.push(rowKey); tokenGroups.set(identity, group);
        tokenRows.set(rowKey, { identity, amount, grain, run: fact.run_id, attempt: fact.attempt_id, stage: fact.stage, step: fact.step_id, step_slug: fact.step_slug, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id, evidence_refs: evidenceRefs(fact) });
      }
    }
    if (fact?.fact_type === 'tool_use' && fact.status === 'present' && typeof value.tool_use_id === 'string') {
      const sourceId = sourceIdentity(fact);
      if (!sourceId) { conflicts += 1; continue; }
      const attempt = fact.attempt_id ?? fact.run_id ?? 'default';
      const identity = `${attributionIdentity(fact)}|${value.tool_use_id}|${typeof value.grain === 'string' && value.grain ? value.grain : 'tool_use'}|${attempt}`;
      const rowKey = `${sourceId}|${identity}`;
      const prior = toolRows.get(rowKey);
      if (prior) {
        if (JSON.stringify(prior.value) !== JSON.stringify(value) || prior.run !== fact.run_id || prior.attempt !== fact.attempt_id || prior.stage !== fact.stage || prior.skill !== fact.skill_id || prior.session !== fact.session_id || prior.subagent !== fact.subagent_id) toolGroups.get(identity).conflict = true;
      } else {
        const group = toolGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
        if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
        group.sources.add(sourceId); group.rows.push(rowKey); toolGroups.set(identity, group);
        toolRows.set(rowKey, { value, run: fact.run_id, attempt: fact.attempt_id, stage: fact.stage, step: fact.step_id, step_slug: fact.step_slug, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id, evidence_refs: evidenceRefs(fact) });
      }
    }
    if (fact?.fact_type === 'duration' && fact.status === 'present' && Number.isFinite(value.duration_ms)) {
      const sourceId = sourceIdentity(fact);
      if (!sourceId) { conflicts += 1; continue; }
      if (!value.event_id && !fact.fact_id) {
        conflicts += 1;
      } else if (!value.event_id) {
        const rowKey = `${sourceId}|${attributionIdentity(fact)}|fact:${fact.fact_id}`;
        const row = { duration_ms: value.duration_ms, grain: value.grain, stage: fact.stage, step: fact.step_id, step_slug: fact.step_slug, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id, evidence_refs: evidenceRefs(fact) };
        if (!durationRows.has(rowKey)) durationRows.set(rowKey, row);
        recordDuration(rowKey, row);
      }
      else {
        const attempt = fact.attempt_id ?? fact.run_id ?? 'default';
        const identity = `${attributionIdentity(fact)}|${attempt}|${value.event_id}`;
        const rowKey = `${sourceId}|${identity}`;
        explicitDurations.add(rowKey);
        const group = durationGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
        const prior = durationRows.get(rowKey);
        if (prior && (prior.duration_ms !== value.duration_ms || prior.grain !== value.grain)) group.conflict = true;
        const implicitPrior = durationEntries.get(rowKey);
        if (implicitPrior && (implicitPrior.duration_ms !== value.duration_ms || implicitPrior.grain !== value.grain)) group.conflict = true;
        if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
        if (!prior) { group.sources.add(sourceId); group.rows.push(rowKey); durationRows.set(rowKey, { duration_ms: value.duration_ms, grain: value.grain, stage: fact.stage, step: fact.step_id, step_slug: fact.step_slug, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id, evidence_refs: evidenceRefs(fact) }); }
        durationGroups.set(identity, group);
      }
    }
    if (fact?.fact_type === 'retry' && fact.status === 'present' && (typeof (value.retry_id ?? fact.attempt_id) === 'string' || typeof (value.attempt_id ?? fact.attempt_id) === 'string')) {
      const sourceId = sourceIdentity(fact);
      if (!sourceId) { conflicts += 1; continue; }
      const identity = `${attributionIdentity(fact)}|${value.retry_id ?? ''}|${value.attempt_id ?? fact.attempt_id ?? ''}`;
      const rowKey = `${sourceId}|${identity}`;
      const group = retryGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
      const prior = retryRows.get(rowKey);
      if (prior !== undefined && prior !== value.retry_count) group.conflict = true;
      if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
      group.sources.add(sourceId); if (!group.rows.includes(rowKey)) group.rows.push(rowKey); retryGroups.set(identity, group); retryRows.set(rowKey, value.retry_count);
      retries.add(rowKey);
    }
    if (fact?.fact_type === 'token' || fact?.fact_type === 'tool_use' || fact?.fact_type === 'session') {
      const sourceId = sourceIdentity(fact);
      if (!sourceId) continue;
      if (typeof value.retry_id === 'string') retries.add(`${sourceId}|${attributionIdentity(fact)}|${value.retry_id}|${value.attempt_id ?? fact.attempt_id ?? ''}`);
      const attempt = fact.attempt_id ?? fact.run_id ?? 'default';
      if (typeof value.duration_ms === 'number' && Number.isFinite(value.duration_ms)) {
        const rowKey = typeof value.event_id === 'string'
          ? `${sourceId}|${attributionIdentity(fact)}|${attempt}|${value.event_id}`
          : `${sourceId}|${attributionIdentity(fact)}|fact:${fact.fact_id}`;
        const row = { duration_ms: value.duration_ms, grain: value.grain, stage: fact.stage, step: fact.step_id, step_slug: fact.step_slug, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id, evidence_refs: evidenceRefs(fact) };
        if (typeof value.event_id === 'string') {
          explicitDurations.add(rowKey);
          const explicitPrior = durationRows.get(rowKey);
          if (explicitPrior && (explicitPrior.duration_ms !== row.duration_ms || explicitPrior.grain !== row.grain)) {
            const identity = `${attributionIdentity(fact)}|${attempt}|${value.event_id}`;
            const group = durationGroups.get(identity);
            if (group) group.conflict = true;
          }
        }
        recordDuration(rowKey, row);
      }
      if (typeof value.event_id === 'string' && value.event === 'start') starts.set(`${sourceId}|${attributionIdentity(fact)}|${attempt}|${value.event_id}`, { timestamp: value.timestamp ?? fact.observed_at, stage: fact.stage, step: fact.step_id, step_slug: fact.step_slug, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id, evidence_refs: evidenceRefs(fact) });
      if (typeof value.event_id === 'string' && value.event === 'end') ends.set(`${sourceId}|${attributionIdentity(fact)}|${attempt}|${value.event_id}`, { timestamp: value.timestamp ?? fact.observed_at, stage: fact.stage, step: fact.step_id, step_slug: fact.step_slug, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id, evidence_refs: evidenceRefs(fact) });
    }
  }
  for (const [identity, group] of tokenGroups) {
    if (group.conflict || group.sources.size > 1) { conflicts += 1; continue; }
    const row = tokenRows.get(group.rows[0]);
    const dimensions = [['stage', row.stage], ['step', stepKey(row)], ['skill', row.skill], ['session', row.session], ['subagent', row.subagent]];
    if (row.grain === 'stage_outcome') outcomeTokenRows.set(group.rows[0], row);
    else {
      tokens.set(group.rows[0], row.amount);
      for (const [key, field] of dimensions) {
        if (typeof field === 'string' && field) {
          breakdown[key][field] = (breakdown[key][field] ?? 0) + row.amount;
          addBreakdown(key, field, row.amount, row.evidence_refs);
        }
      }
    }
  }
  const regularTokenBreakdownKeys = new Set(Object.entries(breakdown).flatMap(([dimension, values]) => Object.keys(values).map((key) => `${dimension}|${key}`)));
  for (const row of outcomeTokenRows.values()) {
    for (const [key, field] of [['stage', row.stage], ['step', stepKey(row)], ['skill', row.skill], ['session', row.session], ['subagent', row.subagent]]) {
      if (typeof field === 'string' && field && !regularTokenBreakdownKeys.has(`${key}|${field}`)) {
        breakdown[key][field] = (breakdown[key][field] ?? 0) + row.amount;
        addBreakdown(key, field, row.amount, row.evidence_refs);
      }
    }
  }
  for (const group of toolGroups.values()) if (group.conflict || group.sources.size > 1) conflicts += 1;
  for (const group of durationGroups.values()) {
    if (group.conflict || group.sources.size > 1) {
      conflicts += 1;
      for (const rowKey of group.rows) {
        durationRows.delete(rowKey);
        durationEntries.delete(rowKey);
        durationConflicts.add(rowKey);
      }
    }
    else for (const rowKey of group.rows) {
      const row = durationRows.get(rowKey);
      recordDuration(rowKey, row);
    }
  }
  for (const group of retryGroups.values()) if (group.conflict || group.sources.size > 1) { conflicts += 1; for (const rowKey of group.rows) retries.delete(rowKey); }
  const usableToolGroups = [...toolGroups.values()].filter((group) => !group.conflict && group.sources.size === 1).length;
  const toolUseCount = toolGroups.size && usableToolGroups ? usableToolGroups : null;
  for (const [id, start] of starts) {
    if (explicitDurations.has(id)) continue;
    const end = ends.get(id);
    if (end) {
      const duration = Date.parse(end.timestamp) - Date.parse(start.timestamp);
      if (Number.isFinite(duration) && duration >= 0) recordDuration(id, { duration_ms: duration, stage: start.stage, step: start.step, step_slug: start.step_slug, skill: start.skill, session: start.session, subagent: start.subagent, evidence_refs: [...new Set([...(start.evidence_refs ?? []), ...(end.evidence_refs ?? [])])] });
    }
  }
  const durationAttributions = [...durationEntries.values()];
  const regularDurationAttributions = durationAttributions.filter((row) => row.grain !== 'stage_outcome');
  const outcomeDurationAttributions = durationAttributions.filter((row) => row.grain === 'stage_outcome');
  const durationBreakdownKeys = new Set();
  for (const row of regularDurationAttributions) for (const [key, field] of [['stage', row.stage], ['step', stepKey(row)], ['skill', row.skill], ['session', row.session], ['subagent', row.subagent]]) {
    if (typeof field === 'string' && field) {
      durationBreakdown[key][field] = (durationBreakdown[key][field] ?? 0) + row.duration_ms;
      durationBreakdownKeys.add(`${key}|${field}`);
      addBreakdown(key, field, row.duration_ms, row.evidence_refs);
    }
  }
  for (const row of outcomeDurationAttributions) for (const [key, field] of [['stage', row.stage], ['step', stepKey(row)], ['skill', row.skill], ['session', row.session], ['subagent', row.subagent]]) {
    if (typeof field === 'string' && field && !durationBreakdownKeys.has(`${key}|${field}`)) {
      durationBreakdown[key][field] = (durationBreakdown[key][field] ?? 0) + row.duration_ms;
      addBreakdown(key, field, row.duration_ms, row.evidence_refs);
    }
  }
  const durations = (regularDurationAttributions.length ? regularDurationAttributions : outcomeDurationAttributions).map((row) => row.duration_ms);
  const tokenValues = tokens.size ? [...tokens.values()] : [...outcomeTokenRows.values()].map((row) => row.amount);
  return { token_count: tokenValues.length ? tokenValues.reduce((sum, n) => sum + n, 0) : null, tool_use_count: toolUseCount, retry_count: retries.size ? retries.size : null, duration_ms: durations.length ? durations.reduce((sum, n) => sum + n, 0) : null, conflicts, token_waste: tokenConflicts ? { status: 'present', value: tokenConflicts, reason: 'duplicate_id_conflict' } : { status: 'unknown', value: null, reason: 'no_duplicate_conflict_evidence' }, breakdown, duration_breakdown: durationBreakdown, breakdown_evidence: breakdownEvidence };
}

function automationDiagnostics(facts) {
  const rows = asArray(facts).filter((f) => f?.fact_type === 'automation' || f?.fact_type === 'human_intervention');
  const opportunities = new Map();
  for (const fact of rows) {
    const value = fact.value ?? {};
    const opportunity = value.opportunity_id ?? value.action ?? fact.fact_id;
    if (typeof opportunity !== 'string' || !opportunity) continue;
    const key = `${attributionIdentity(fact)}|${fact.stage ?? 'unknown'}|${fact.step_id ?? 'unknown'}|${fact.skill_id ?? 'unknown'}|${opportunity}`;
    const group = opportunities.get(key) ?? { origins: new Set() };
    group.origins.add(value.origin);
    opportunities.set(key, group);
  }
  const denominator = opportunities.size;
  if (!denominator) return { rate: { status: 'unknown', value: null, numerator: 0, denominator: 0, excluded_unknown: 0, reason: 'automation_opportunity_denominator_unavailable' }, human_intervention: { status: 'unknown', value: null, numerator: 0, denominator: 0, excluded_unknown: 0, reason: 'automation_opportunity_denominator_unavailable' } };
  const verified = [...opportunities.values()].filter((group) => group.origins.size === 1 && ['agent', 'human', 'automation'].includes([...group.origins][0]));
  const automated = verified.filter((group) => ['agent', 'automation'].includes([...group.origins][0])).length;
  const human = verified.filter((group) => [...group.origins][0] === 'human').length;
  const unknown = denominator - verified.length;
  const status = unknown ? 'unknown' : 'present';
  return {
    rate: { status, value: status === 'present' ? automated / denominator : null, numerator: automated, denominator, excluded_unknown: unknown },
    human_intervention: { status, value: status === 'present' ? human : null, numerator: human, denominator, excluded_unknown: unknown },
  };
}

function problemDiagnostics(facts) {
  const groups = new Map();
  const seen = new Set();
  for (const fact of asArray(facts).filter((entry) => entry?.fact_type === 'health' && entry.status === 'present')) {
    if (fact.fact_id && seen.has(fact.fact_id)) continue;
    if (fact.fact_id) seen.add(fact.fact_id);
    const value = fact.value ?? {};
    const valueStatus = controlledHealthStatus(value.status, 'present');
    const domain = value.domain === 'taskPath' ? 'task_dir' : value.domain;
    if (!FAILURE_DOMAINS.has(domain) || !['present'].includes(valueStatus)) continue;
    if (!((typeof value.friction_type === 'string' && value.friction_type.trim()) || (typeof value.error_code === 'string' && value.error_code.trim()))) continue;
    const entry = { domain, friction_type: value.friction_type ?? null, error_code: value.error_code ?? null, source_refs: evidenceRefs(fact) };
    const key = JSON.stringify([entry.domain, entry.friction_type, entry.error_code]);
    const current = groups.get(key) ?? { domain: entry.domain, friction_type: entry.friction_type, error_code: entry.error_code, count: 0, source_refs: [] };
    current.count += 1; current.source_refs.push(...entry.source_refs); groups.set(key, current);
  }
  for (const entry of failureDiagnostics(facts).filter((candidate) => candidate.domain === 'token_waste' && candidate.status === 'conflict')) {
    const key = JSON.stringify([entry.domain, entry.friction_type, entry.error_code]);
    const current = groups.get(key) ?? { domain: entry.domain, friction_type: entry.friction_type, error_code: entry.error_code, count: 0, source_refs: [] };
    current.count += 1; current.source_refs.push(...entry.source_refs); groups.set(key, current);
  }
  return [...groups.values()].map((entry) => ({ ...entry, common: entry.count >= 2 }));
}

function trendDiagnostics(facts) {
  const metricTypes = {
    review_invoked: { fact_type: 'review', field: 'invoked' },
    verify_fresh: { fact_type: 'verify', field: 'fresh' },
    automation: { fact_type: 'automation', field: 'origin' },
    human_intervention: { fact_type: 'human_intervention', field: 'origin' },
  };
  // A time bucket is comparable only when its source, fact contract, skill
  // version and grain match. Keep incompatible buckets separate instead of
  // silently blending unlike producers into one trend line.
  const metrics = {};
  const seenRows = new Set();
  for (const fact of asArray(facts)) {
    const dateBucket = typeof fact?.observed_at === 'string' ? fact.observed_at.slice(0, 10) : null;
    if (!dateBucket) continue;
    const compatibility = JSON.stringify({
      schema: fact.contract_version ?? fact.schema_version ?? 'monitoring-fact.v1',
      source: fact.source?.source_id ?? 'unknown',
      skill: fact.skill_id ?? 'unknown',
      skill_version: fact.skill_version ?? 'unknown',
      grain: fact.value?.grain ?? 'unknown',
    });
    for (const [metric, definition] of Object.entries(metricTypes)) {
      if (definition.fact_type !== fact.fact_type || fact.status !== 'present') continue;
      const value = fact.value?.[definition.field];
      const usable = ['review_invoked', 'verify_fresh'].includes(metric)
        ? typeof value === 'boolean'
        : ['agent', 'human', 'automation'].includes(value);
      if (!usable) continue;
      const rowIdentity = `${metric}|${fact.task_id ?? 'unknown'}|${fact.project_name ?? 'unknown'}|${fact.run_id ?? 'unknown'}|${fact.attempt_id ?? 'unknown'}|${fact.source?.source_id ?? 'unknown'}|${fact.fact_id ?? JSON.stringify(value)}|${dateBucket}`;
      if (seenRows.has(rowIdentity)) continue;
      seenRows.add(rowIdentity);
      const buckets = metrics[metric] ?? new Map();
      const bucket = `${compatibility}|${dateBucket}`;
      const numerator = ['review_invoked', 'verify_fresh'].includes(metric)
        ? (value === true ? 1 : 0)
        : (metric === 'automation' ? (['agent', 'automation'].includes(value) ? 1 : 0) : (value === 'human' ? 1 : 0));
      const sample = buckets.get(bucket) ?? { numerator: 0, denominator: 0, compatibility, date: dateBucket, tasks: new Map() };
      const taskKey = `${fact.project_name}|${fact.task_id}`;
      const prior = sample.tasks.get(taskKey);
      const observedAt = Date.parse(fact.observed_at ?? '') || 0;
      if (!prior || observedAt >= prior.observedAt) sample.tasks.set(taskKey, { numerator, observedAt });
      sample.denominator = sample.tasks.size;
      sample.numerator = [...sample.tasks.values()].reduce((sum, task) => sum + task.numerator, 0);
      buckets.set(bucket, sample);
      metrics[metric] = buckets;
    }
  }
  const output = {};
  for (const metric of Object.keys(metricTypes)) {
    const buckets = metrics[metric] ?? new Map();
    const byCompatibility = new Map();
    for (const sample of buckets.values()) {
      const group = byCompatibility.get(sample.compatibility) ?? [];
      group.push(sample);
      byCompatibility.set(sample.compatibility, group);
    }
    const usableGroups = [...byCompatibility.values()].filter((group) => new Set(group.map((sample) => sample.date)).size >= 2);
    const usableSamples = usableGroups.flat();
    const samples = Object.fromEntries([...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, sample]) => [key, { numerator: sample.numerator, denominator: sample.denominator }]));
    output[metric] = {
      status: usableGroups.length > 0 ? 'present' : 'insufficient_samples',
      buckets: buckets.size,
      usable_buckets: new Set(usableSamples.map((sample) => `${sample.compatibility}|${sample.date}`)).size,
      numerator: usableSamples.reduce((sum, sample) => sum + sample.numerator, 0),
      denominator: usableSamples.reduce((sum, sample) => sum + sample.denominator, 0),
      samples,
    };
  }
  const statuses = Object.values(output).map((entry) => entry.status);
  return { status: statuses.length > 0 && statuses.every((status) => status === 'present') ? 'present' : 'insufficient_samples', metrics: output };
}

function refsForFacts(facts) {
  return [...new Set(asArray(facts).flatMap((fact) => evidenceRefs(fact)))].sort();
}

function currentRunSummary(topology, current, selected, stages, steps, skills) {
  const expectedSteps = asArray(topology?.stages).reduce((sum, stage) => sum + asArray(stage.steps).length, 0);
  const expectedSkills = asArray(topology?.stages).reduce((sum, stage) => sum + asArray(stage.skills).length, 0);
  const observed = (entries) => entries.filter((entry) => (entry.coverage?.observed ?? 0) > 0).length;
  const runIds = [...new Set(selected.facts.map((fact) => fact?.run_id).filter((value) => typeof value === 'string' && value.length > 0))].sort();
  const attemptIds = [...new Set(selected.facts.map((fact) => fact?.attempt_id).filter((value) => typeof value === 'string' && value.length > 0))].sort();
  const stageAttempts = STAGES.map((stage) => {
    const identity = selected.stageAttempts.get(stage);
    return {
      stage,
      run_id: identity?.run_id ?? null,
      attempt_id: identity?.attempt_id ?? null,
      observed_at: identity?.observed_at ?? null,
      fact_count: selected.facts.filter((fact) => fact?.stage === stage).length,
    };
  });
  const singleIdentity = runIds.length === 1 && attemptIds.length === 1;
  return {
    run_id: singleIdentity ? runIds[0] : null,
    attempt_id: singleIdentity ? attemptIds[0] : null,
    observed_at: current.observed_at,
    fact_count: selected.facts.length,
    selection: selected.scope,
    run_ids: runIds,
    attempt_ids: attemptIds,
    stage_attempts: stageAttempts,
    stage_coverage: { expected: STAGES.length, observed: observed(stages) },
    step_coverage: { expected: expectedSteps, observed: observed(steps) },
    skill_coverage: { expected: expectedSkills, observed: observed(skills) },
  };
}

function taskKey(fact) {
  return `${fact?.project_name ?? 'unknown'}|${fact?.task_id ?? 'unknown'}`;
}

function fieldEntry(field, candidates, valuePredicate = () => true, expectedCount = 1, requirePresent = false) {
  const rows = asArray(candidates);
  const groups = new Map();
  for (const row of rows) {
    const key = taskKey(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  const expected = Math.max(expectedCount, groups.size);
  const outcomes = [...groups.values()].map((group) => {
    const blocked = group.find((fact) => NON_PRESENT_FACT_STATUSES.has(fact?.status));
    const matching = group.filter((fact) => (requirePresent
      ? fact?.status === 'present'
      : !NON_PRESENT_FACT_STATUSES.has(fact?.status)) && valuePredicate(fact));
    if (blocked && !matching.length) return { status: blocked.status, reason: blocked.reason ?? `${field}_${blocked.status}`, source_refs: evidenceRefs(blocked) };
    if (!matching.length) return { status: 'missing', reason: `${field}_missing`, source_refs: refsForFacts(group) };
    if (blocked) return { status: 'incomplete', reason: `${field}_incomplete`, source_refs: refsForFacts(group) };
    return { status: 'present', reason: null, source_refs: refsForFacts(group) };
  });
  while (outcomes.length < expected) outcomes.push({ status: 'missing', reason: `${field}_missing`, source_refs: [] });
  const status = outcomes.some((entry) => entry.status === 'unknown' || entry.status === 'conflict')
    ? 'unknown'
    : outcomes.find((entry) => entry.status !== 'present')?.status ?? 'present';
  return {
    status,
    expected,
    observed: outcomes.filter((entry) => entry.status === 'present').length,
    reason: outcomes.find((entry) => entry.status !== 'present')?.reason ?? null,
    source_refs: [...new Set(outcomes.flatMap((entry) => entry.source_refs ?? []))].sort(),
  };
}

function anyFieldEntry(field, candidates, valuePredicate, expectedCount = 1) {
  return fieldEntry(field, candidates, valuePredicate, expectedCount, true);
}

function validFactCoverage(fact) {
  return fact?.coverage && Number.isInteger(fact.coverage.observed) && fact.coverage.observed >= 0
    && (fact.coverage.expected === null || (Number.isInteger(fact.coverage.expected) && fact.coverage.expected >= fact.coverage.observed));
}

function processViewFields(facts, topology, expectedCount) {
  const output = {};
  output.expected_topology = Array.isArray(topology?.stages) && topology.stages.length > 0
    ? { status: 'present', expected: expectedCount, observed: expectedCount, reason: null, source_refs: [] }
    : { status: 'unknown', expected: expectedCount, observed: 0, reason: 'expected_topology_unavailable', source_refs: [] };
  for (const type of ['stage', 'step', 'skill', 'artifact', 'health', 'review', 'verify']) {
    const rows = asArray(facts).filter((fact) => fact?.fact_type === type);
    output[`${type}.status`] = fieldEntry(`${type}.status`, rows, () => true, expectedCount);
    output[`${type}.reason/error`] = fieldEntry(`${type}.reason/error`, rows, (fact) => Object.hasOwn(fact, 'reason') && Object.hasOwn(fact, 'error'), expectedCount);
    output[`${type}.coverage`] = fieldEntry(`${type}.coverage`, rows, validFactCoverage, expectedCount);
    output[`${type}.evidence_refs`] = fieldEntry(`${type}.evidence_refs`, rows, (fact) => Array.isArray(fact.evidence_refs), expectedCount);
  }
  return output;
}

function costViewFields(facts, expectedCount) {
  const costFacts = asArray(facts).filter((fact) => ['token', 'tool_use', 'duration', 'retry', 'session'].includes(fact?.fact_type));
  const byType = (type) => costFacts.filter((fact) => fact.fact_type === type);
  const output = {};
  for (const key of ['session_id', 'subagent_id', 'stage', 'skill_id']) output[key] = anyFieldEntry(key, costFacts, (fact) => typeof fact[key] === 'string' && fact[key].length > 0, expectedCount);
  output.source = fieldEntry('source', costFacts, (fact) => fact.source && typeof fact.source.source_id === 'string' && typeof fact.source.ref === 'string', expectedCount);
  output.attempt_id = fieldEntry('attempt_id', costFacts, (fact) => typeof fact.attempt_id === 'string' && fact.attempt_id.length > 0, expectedCount);
  output['token.message_id'] = fieldEntry('token.message_id', byType('token'), (fact) => typeof fact.value?.message_id === 'string', expectedCount);
  output['tool_use.tool_use_id'] = fieldEntry('tool_use.tool_use_id', byType('tool_use'), (fact) => typeof fact.value?.tool_use_id === 'string', expectedCount);
  output['duration.duration_ms'] = fieldEntry('duration.duration_ms', byType('duration'), (fact) => Number.isInteger(fact.value?.duration_ms) && fact.value.duration_ms >= 0, expectedCount);
  output['retry.retry_id'] = fieldEntry('retry.retry_id', byType('retry'), (fact) => typeof fact.value?.retry_id === 'string', expectedCount);
  return output;
}

function problemsViewFields(facts, diagnostics, expectedCount) {
  const health = asArray(facts).filter((fact) => fact?.fact_type === 'health');
  const output = {};
  output['health.domain'] = fieldEntry('health.domain', health, (fact) => typeof fact.value?.domain === 'string' && FAILURE_DOMAINS.has(fact.value.domain === 'taskPath' ? 'task_dir' : fact.value.domain), expectedCount);
  output['health.friction_type'] = fieldEntry('health.friction_type', health, (fact) => typeof fact.value?.friction_type === 'string' && fact.value.friction_type.length > 0, expectedCount);
  output['health.error_code'] = fieldEntry('health.error_code', health, (fact) => typeof fact.value?.error_code === 'string' && fact.value.error_code.length > 0, expectedCount);
  output.observed_at = fieldEntry('observed_at', health, (fact) => typeof fact.observed_at === 'string' && Number.isFinite(Date.parse(fact.observed_at)), expectedCount);
  output.coverage = fieldEntry('coverage', health, validFactCoverage, expectedCount);
  output.source_refs = fieldEntry('source_refs', health, (fact) => Array.isArray(fact.evidence_refs) && typeof fact.source?.ref === 'string', expectedCount);
  const trendMetrics = Object.values(diagnostics?.trends?.metrics ?? {});
  const trend = trendMetrics.find((metric) => metric.status === 'present')
    ? { status: 'present', expected: expectedCount, observed: expectedCount, reason: null, source_refs: [] }
    : trendMetrics.find((metric) => metric.status === 'insufficient_samples')
      ? { status: 'insufficient_samples', expected: expectedCount, observed: 0, reason: 'compatible_time_buckets_insufficient', source_refs: [] }
      : { status: 'missing', expected: expectedCount, observed: 0, reason: 'compatible_time_buckets_missing', source_refs: [] };
  output.compatible_time_buckets = trend;
  output.denominator = trend.status === 'present'
    ? { status: 'present', expected: expectedCount, observed: expectedCount, reason: null, source_refs: [] }
    : { status: trend.status, expected: expectedCount, observed: 0, reason: trend.reason, source_refs: [] };
  return output;
}

function readinessStatus(inScopeTaskCount, fields) {
  if (inScopeTaskCount === 0) return 'empty_valid';
  if (inScopeTaskCount === null) return 'unknown';
  const statuses = Object.values(fields).map((entry) => entry.status);
  if (statuses.some((status) => ['unknown', 'conflict'].includes(status))) return 'unknown';
  if (statuses.some((status) => status !== 'present')) return 'insufficient';
  return 'sufficient';
}

function viewReadiness(requiredFields, fields, inScopeTaskCount) {
  const sourceRefs = [...new Set(Object.values(fields).flatMap((entry) => entry.source_refs ?? []))].sort();
  const firstNotReady = Object.entries(fields).find(([, entry]) => entry.status !== 'present');
  return {
    required_fields: [...requiredFields],
    field_coverage: fields,
    sample_sufficiency: readinessStatus(inScopeTaskCount, fields),
    reason: firstNotReady ? firstNotReady[1].reason : null,
    source_refs: sourceRefs,
  };
}

export function deriveMonitoringViewReadiness({ facts = [], topology = { stages: [] }, diagnostics = null, inScopeTaskCount = undefined } = {}) {
  const safeFacts = asArray(facts);
  const currentFacts = selectCurrentStageAttempts(safeFacts).facts;
  const currentPresentFacts = currentFacts.filter((fact) => fact?.status === 'present');
  const count = inScopeTaskCount === undefined ? (safeFacts.length ? 1 : 0) : inScopeTaskCount;
  const overviewFields = {
    task_id: fieldEntry('task_id', currentPresentFacts, (fact) => typeof fact.task_id === 'string' && fact.task_id.length > 0, count),
    project_name: fieldEntry('project_name', currentPresentFacts, (fact) => typeof fact.project_name === 'string' && fact.project_name.length > 0, count),
    run_id: fieldEntry('run_id', currentPresentFacts, (fact) => typeof fact.run_id === 'string' && fact.run_id.length > 0, count),
    attempt_id: fieldEntry('attempt_id', currentPresentFacts, (fact) => typeof fact.attempt_id === 'string' && fact.attempt_id.length > 0, count),
    'stage.value.outcome': fieldEntry('stage.value.outcome', currentFacts.filter((fact) => fact.fact_type === 'stage'), (fact) => typeof fact.value?.outcome === 'string', count),
    'source.status': fieldEntry('source.status', latestTranscriptSourceFacts(currentFacts), () => true, count),
    coverage: fieldEntry('coverage', currentFacts, validFactCoverage, count),
  };
  const processFields = processViewFields(currentFacts, topology, count);
  const costFields = costViewFields(currentFacts, count);
  const problemFields = problemsViewFields(safeFacts, diagnostics, count);
  return {
    task_overview: viewReadiness(VIEW_REQUIRED_FIELDS.task_overview, overviewFields, count),
    process_degradation: viewReadiness(VIEW_REQUIRED_FIELDS.process_degradation, processFields, count),
    cost_attribution: viewReadiness(VIEW_REQUIRED_FIELDS.cost_attribution, costFields, count),
    problems_trends: viewReadiness(VIEW_REQUIRED_FIELDS.problems_trends, problemFields, count),
  };
}

export { VIEW_REQUIRED_FIELDS };

export function deriveMonitoringDiagnostics({ topology = { stages: [] }, facts = [] } = {}) {
  const safeFacts = asArray(facts);
  const current = selectCurrentAttempt(safeFacts);
  const selected = selectCurrentStageAttempts(safeFacts);
  const stages = stageDiagnostics(topology, selected.facts, selected.stageAttempts);
  const cost = costDiagnostics(selected.facts, topology);
  const steps = stepDiagnostics(topology, selected.facts, cost);
  const skills = skillDiagnostics(topology, selected.facts);
  return Object.freeze({
    current: currentRunSummary(topology, current, selected, stages, steps, skills),
    stage: stages,
    steps,
    skills,
    failures: failureDiagnostics(selected.facts),
    cost,
    automation: automationDiagnostics(selected.facts),
    problems: problemDiagnostics(selected.facts),
    trends: trendDiagnostics(safeFacts),
  });
}
