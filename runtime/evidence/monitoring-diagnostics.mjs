const STAGES = Object.freeze(['make-decision', 'build-spec', 'build-plan', 'build-code', 'verify-code']);
const FAILURE_DOMAINS = new Set(['task_dir', 'worktree', 'review', 'verify', 'handoff', 'transcript', 'skill_missing', 'artifact_missing', 'token_waste']);
const CONTROLLED_DIAGNOSTIC_STATUSES = new Set(['present', 'missing', 'unknown', 'partial', 'fatal', 'conflict', 'pending', 'evidence_gap', 'out_of_order', 'executed', 'not_applicable', 'unavailable', 'insufficient_samples', 'failed', 'started', 'running', 'completed', 'skipped']);
const HEALTH_STATUS_ALIASES = new Map([['mismatch', 'partial'], ['stale', 'partial']]);

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

function stageDiagnostics(topology, facts) {
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
    return { id, status, coverage: source?.coverage ?? { expected: 1, observed: source ? 1 : 0 }, errors: source?.error ? [source.error] : [], reason: source?.reason ?? null, source_refs: evidenceRefs(source) };
  });
}

function stepDiagnostics(topology, facts) {
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
    return { id, stage: stage.id, status: source && outOfOrder.has(key) ? 'out_of_order' : factStatus(source, 'missing'), coverage: source?.coverage ?? { expected: 1, observed: source ? 1 : 0 }, errors: source?.error ? [source.error] : [], reason: source?.reason ?? null, source_refs: evidenceRefs(source) };
  }));
}

function skillDiagnostics(topology, facts) {
  const byId = resolveLatestIdentityFacts(asArray(facts).filter((f) => f?.fact_type === 'skill' && f.skill_id), (f) => `${f.stage ?? ''}:${f.skill_id}:${attemptIdentity(f)}`, (f) => `${f.stage ?? ''}:${f.skill_id}`);
  return asArray(topology?.stages).flatMap((stage) => asArray(stage.skills).map((skill) => {
    const source = byId.get(`${stage.id}:${skill.id}`);
    const value = source?.value ?? {};
    let status = factStatus(source, skill.trigger === false ? 'partial' : skill.trigger === null ? 'unknown' : 'missing');
    const fallbackReason = !source && skill.trigger === false ? 'skill_skip_reason_unavailable' : null;
    if (value.trigger === false && typeof value.reason === 'string' && value.reason.trim()) status = 'not_applicable';
    else if (value.trigger === false) status = 'partial';
    else if (value.trigger === true && value.executed === true) status = 'executed';
    else if (value.trigger === true) status = 'missing';
    else if (skill.trigger === true && source?.status === 'unknown' && source.reason === 'unavailable') status = 'unavailable';
    else if (skill.trigger === true && !source) status = 'missing';
    return { id: skill.id, stage: stage.id, status, reason: value.reason ?? source?.reason ?? fallbackReason, coverage: source?.coverage ?? { expected: 1, observed: source ? 1 : 0 }, errors: source?.error ? [source.error] : [], source_refs: evidenceRefs(source) };
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
      || (f?.fact_type === 'source_status' && f.status !== 'present')
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

function costDiagnostics(facts) {
  const tokens = new Map(), tokenRows = new Map(), tokenGroups = new Map(), toolRows = new Map(), toolGroups = new Map(), retryGroups = new Map(), retryRows = new Map(), retries = new Set(), durationGroups = new Map(), durationRows = new Map(), durations = [];
  const breakdown = { stage: {}, skill: {}, session: {}, subagent: {} };
  const starts = new Map(), ends = new Map(), explicitDurations = new Set();
  let conflicts = 0;
  let tokenConflicts = 0;
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
        const identity = `${value.message_id}|${grain}|${attempt}`;
        const sourceId = typeof fact.source?.source_id === 'string' ? fact.source.source_id : 'unknown';
        const rowKey = `${sourceId}|${identity}`;
        const prior = tokenRows.get(rowKey);
        if (prior) {
          if (prior.amount !== amount || prior.run !== fact.run_id || prior.attempt !== fact.attempt_id || prior.stage !== fact.stage || prior.skill !== fact.skill_id || prior.session !== fact.session_id || prior.subagent !== fact.subagent_id) tokenGroups.get(identity).conflict = true;
          continue;
        }
        const group = tokenGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
        if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
        group.sources.add(sourceId); group.rows.push(rowKey); tokenGroups.set(identity, group);
        tokenRows.set(rowKey, { identity, amount, run: fact.run_id, attempt: fact.attempt_id, stage: fact.stage, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id });
      }
    }
    if (fact?.fact_type === 'tool_use' && fact.status === 'present' && typeof value.tool_use_id === 'string') {
      const sourceId = typeof fact.source?.source_id === 'string' ? fact.source.source_id : 'unknown';
      const attempt = fact.attempt_id ?? fact.run_id ?? 'default';
      const identity = `${value.tool_use_id}|${typeof value.grain === 'string' && value.grain ? value.grain : 'tool_use'}|${attempt}`;
      const rowKey = `${sourceId}|${identity}`;
      const prior = toolRows.get(rowKey);
      if (prior) {
        if (JSON.stringify(prior.value) !== JSON.stringify(value) || prior.run !== fact.run_id || prior.attempt !== fact.attempt_id || prior.stage !== fact.stage || prior.skill !== fact.skill_id || prior.session !== fact.session_id || prior.subagent !== fact.subagent_id) toolGroups.get(identity).conflict = true;
      } else {
        const group = toolGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
        if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
        group.sources.add(sourceId); group.rows.push(rowKey); toolGroups.set(identity, group);
        toolRows.set(rowKey, { value, run: fact.run_id, attempt: fact.attempt_id, stage: fact.stage, skill: fact.skill_id, session: fact.session_id, subagent: fact.subagent_id });
      }
    }
    if (fact?.fact_type === 'duration' && fact.status === 'present' && Number.isFinite(value.duration_ms)) {
      if (!value.event_id) durations.push(value.duration_ms);
      else {
        const sourceId = typeof fact.source?.source_id === 'string' ? fact.source.source_id : 'unknown';
        const attempt = fact.attempt_id ?? fact.run_id ?? 'default';
        const identity = `${value.event_id}|${attempt}`;
        const rowKey = `${sourceId}|${identity}`;
        explicitDurations.add(`${sourceId}|${attempt}|${value.event_id}`);
        const group = durationGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
        const prior = durationRows.get(rowKey);
        if (prior && (prior.duration_ms !== value.duration_ms || prior.grain !== value.grain)) group.conflict = true;
        if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
        if (!prior) { group.sources.add(sourceId); group.rows.push(rowKey); durationRows.set(rowKey, { duration_ms: value.duration_ms, grain: value.grain }); }
        durationGroups.set(identity, group);
      }
    }
    if (fact?.fact_type === 'retry' && fact.status === 'present' && (typeof (value.retry_id ?? fact.attempt_id) === 'string' || typeof (value.attempt_id ?? fact.attempt_id) === 'string')) {
      const identity = `${value.retry_id ?? ''}|${value.attempt_id ?? fact.attempt_id ?? ''}`;
      const sourceId = typeof fact.source?.source_id === 'string' ? fact.source.source_id : 'unknown';
      const rowKey = `${sourceId}|${identity}`;
      const group = retryGroups.get(identity) ?? { sources: new Set(), rows: [], conflict: false };
      const prior = retryRows.get(rowKey);
      if (prior !== undefined && prior !== value.retry_count) group.conflict = true;
      if (group.sources.size && !group.sources.has(sourceId)) group.conflict = true;
      group.sources.add(sourceId); if (!group.rows.includes(rowKey)) group.rows.push(rowKey); retryGroups.set(identity, group); retryRows.set(rowKey, value.retry_count);
      retries.add(rowKey);
    }
    if (fact?.fact_type === 'token' || fact?.fact_type === 'tool_use' || fact?.fact_type === 'session') {
      if (typeof value.retry_id === 'string') retries.add(`${typeof fact.source?.source_id === 'string' ? fact.source.source_id : 'unknown'}|${value.retry_id}|${value.attempt_id ?? fact.attempt_id ?? ''}`);
      const sourceId = typeof fact.source?.source_id === 'string' ? fact.source.source_id : 'unknown';
      const attempt = fact.attempt_id ?? fact.run_id ?? 'default';
      if (typeof value.duration_ms === 'number' && Number.isFinite(value.duration_ms)) {
        durations.push(value.duration_ms);
        if (typeof value.event_id === 'string') explicitDurations.add(`${sourceId}|${attempt}|${value.event_id}`);
      }
      if (typeof value.event_id === 'string' && value.event === 'start') starts.set(`${sourceId}|${attempt}|${value.event_id}`, value.timestamp ?? fact.observed_at);
      if (typeof value.event_id === 'string' && value.event === 'end') ends.set(`${sourceId}|${attempt}|${value.event_id}`, value.timestamp ?? fact.observed_at);
    }
  }
  for (const [identity, group] of tokenGroups) {
    if (group.conflict || group.sources.size > 1) { conflicts += 1; continue; }
    const row = tokenRows.get(group.rows[0]);
    tokens.set(group.rows[0], row.amount);
    for (const [key, field] of [['stage', row.stage], ['skill', row.skill], ['session', row.session], ['subagent', row.subagent]]) {
      if (typeof field === 'string' && field) breakdown[key][field] = (breakdown[key][field] ?? 0) + row.amount;
    }
  }
  for (const group of toolGroups.values()) if (group.conflict || group.sources.size > 1) conflicts += 1;
  for (const group of durationGroups.values()) {
    if (group.conflict || group.sources.size > 1) { conflicts += 1; for (const rowKey of group.rows) durationRows.delete(rowKey); }
    else for (const rowKey of group.rows) durations.push(durationRows.get(rowKey).duration_ms);
  }
  for (const group of retryGroups.values()) if (group.conflict || group.sources.size > 1) { conflicts += 1; for (const rowKey of group.rows) retries.delete(rowKey); }
  const usableToolGroups = [...toolGroups.values()].filter((group) => !group.conflict && group.sources.size === 1).length;
  const toolUseCount = toolGroups.size && usableToolGroups ? usableToolGroups : null;
  for (const [id, start] of starts) {
    if (explicitDurations.has(id)) continue;
    const end = ends.get(id);
    if (end) { const duration = Date.parse(end) - Date.parse(start); if (Number.isFinite(duration) && duration >= 0) durations.push(duration); }
  }
  return { token_count: tokens.size ? [...tokens.values()].reduce((sum, n) => sum + n, 0) : null, tool_use_count: toolUseCount, retry_count: retries.size ? retries.size : null, duration_ms: durations.length ? durations.reduce((sum, n) => sum + n, 0) : null, conflicts, token_waste: tokenConflicts ? { status: 'present', value: tokenConflicts, reason: 'duplicate_id_conflict' } : { status: 'unknown', value: null, reason: 'no_duplicate_conflict_evidence' }, breakdown };
}

function automationDiagnostics(facts) {
  const rows = asArray(facts).filter((f) => f?.fact_type === 'automation' || f?.fact_type === 'human_intervention');
  const verified = rows.filter((f) => ['agent', 'human', 'automation'].includes(f.value?.origin));
  if (!verified.length) return { rate: { status: 'unknown', value: null }, human_intervention: { status: 'unknown', value: null } };
  const automated = verified.filter((f) => ['agent', 'automation'].includes(f.value.origin)).length;
  const human = verified.filter((f) => f.value.origin === 'human').length;
  return { rate: { status: 'present', value: automated / verified.length, numerator: automated, denominator: verified.length, excluded_unknown: rows.length - verified.length }, human_intervention: { status: 'present', value: human, denominator: verified.length, excluded_unknown: rows.length - verified.length } };
}

function problemDiagnostics(facts) {
  const groups = new Map();
  for (const entry of failureDiagnostics(facts)) {
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
      const buckets = metrics[metric] ?? new Map();
      const bucket = `${compatibility}|${dateBucket}`;
      const sample = buckets.get(bucket) ?? { numerator: 0, denominator: 0, compatibility, date: dateBucket };
      sample.denominator += 1;
      sample.numerator += ['review_invoked', 'verify_fresh'].includes(metric)
        ? (value === true ? 1 : 0)
        : (metric === 'automation' ? (['agent', 'automation'].includes(value) ? 1 : 0) : (value === 'human' ? 1 : 0));
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
      usable_buckets: usableSamples.length,
      numerator: usableSamples.reduce((sum, sample) => sum + sample.numerator, 0),
      denominator: usableSamples.reduce((sum, sample) => sum + sample.denominator, 0),
      samples,
    };
  }
  const statuses = Object.values(output).map((entry) => entry.status);
  return { status: statuses.length > 0 && statuses.every((status) => status === 'present') ? 'present' : 'insufficient_samples', metrics: output };
}

export function deriveMonitoringDiagnostics({ topology = { stages: [] }, facts = [] } = {}) {
  const safeFacts = asArray(facts);
  return Object.freeze({
    stage: stageDiagnostics(topology, safeFacts),
    steps: stepDiagnostics(topology, safeFacts),
    skills: skillDiagnostics(topology, safeFacts),
    failures: failureDiagnostics(safeFacts),
    cost: costDiagnostics(safeFacts),
    automation: automationDiagnostics(safeFacts),
    problems: problemDiagnostics(safeFacts),
    trends: trendDiagnostics(safeFacts),
  });
}
