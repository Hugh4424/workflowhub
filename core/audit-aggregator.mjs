/**
 * Canonical observed-fact reconciler. Expected topology is supplied by the
 * manifest at the caller boundary; this narrow core never manufactures it.
 */
import { createHash } from "node:crypto";

const STAGE_SLUGS = new Set(["bs", "bp", "bc", "vc", "md"]);
const TERMINAL_STATUSES = new Set(["success", "failure", "skipped", "needs_human"]);

function assertNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} must be a non-empty string`);
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashSummary(summary) {
  return createHash("sha256").update(stable(summary)).digest("hex");
}

function evidenceRef(evidence) {
  if (!evidence || typeof evidence !== "object" || typeof evidence.kind !== "string" || typeof evidence.uri_or_path !== "string") return null;
  return { kind: evidence.kind, uri_or_path: evidence.uri_or_path, ...(typeof evidence.content_hash === "string" ? { content_hash: evidence.content_hash } : {}) };
}

function canonicalEntry(event, stageSlug, workflowRunId) {
  return event?.event_type === "step_entry" && event.workflow_run_id === workflowRunId && event.stage_slug === stageSlug &&
    typeof event.step_id === "string" && typeof event.attempt_id === "string" && typeof event.timestamp === "string" && evidenceRef(event.entry_evidence);
}

function canonicalExit(event, stageSlug, workflowRunId) {
  return event?.event_type === "step_exit" && event.workflow_run_id === workflowRunId && event.stage_slug === stageSlug &&
    typeof event.step_id === "string" && typeof event.attempt_id === "string" && typeof event.timestamp === "string" &&
    TERMINAL_STATUSES.has(event.terminal_status) && evidenceRef(event.completion_evidence);
}

function attemptKey(event) {
  return `${event.stage_slug}\u0000${event.step_id}\u0000${event.attempt_id}`;
}

export function latestByStepId(events) {
  const map = new Map();
  for (const event of events) map.set(event.step_id, event);
  return map;
}

export function latestByStepAndEntry(events) {
  const map = new Map();
  for (const event of events) map.set(`${event.step_id}::${event.exit_journal_entry_id ?? null}`, event);
  return map;
}

/**
 * Builds the sole canonical verdict. It deliberately reports bad observed
 * records as facts rather than selecting a convenient retry or exit record.
 */
export function buildAuditSummaryFromJournalEvents(events, stageSlug, workflowRunId, auditContext = {}) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array");
  if (!STAGE_SLUGS.has(stageSlug)) throw new TypeError("stageSlug must be one of: bs, bp, bc, vc, md");
  assertNonEmptyString(workflowRunId, "workflowRunId");

  const facts = { missing: [], unexpected: [], duplicate: [], out_of_order: [], unknown: [], stale: [], tampered_hash: [] };
  const entries = [];
  const exits = [];
  const evidenceRefs = [];

  events.forEach((event, index) => {
    if (event?.workflow_run_id !== workflowRunId) return;
    const mentionsStage = event?.stage_slug === stageSlug || (typeof event?.step_id === "string" && event.step_id.startsWith(`${stageSlug}.`));
    if (!mentionsStage) return;
    if (event?.event_type === "step_entry") {
      if (!canonicalEntry(event, stageSlug, workflowRunId)) facts.unknown.push({ index, type: "invalid_entry", step_id: event?.step_id ?? null });
      else {
        entries.push({ event, index });
        const ref = evidenceRef(event.entry_evidence); if (ref) evidenceRefs.push(ref);
      }
    } else if (event?.event_type === "step_exit") {
      if (!canonicalExit(event, stageSlug, workflowRunId)) facts.unknown.push({ index, type: "invalid_exit", step_id: event?.step_id ?? null });
      else {
        exits.push({ event, index });
        const ref = evidenceRef(event.completion_evidence); if (ref) evidenceRefs.push(ref);
      }
    } else {
      facts.unknown.push({ index, type: "unknown_event", event_type: event?.event_type ?? null });
    }
  });

  const entriesByAttempt = new Map();
  for (const item of entries) {
    const key = attemptKey(item.event);
    const list = entriesByAttempt.get(key) ?? [];
    list.push(item); entriesByAttempt.set(key, list);
  }
  const exitsByAttempt = new Map();
  for (const item of exits) {
    const key = attemptKey(item.event);
    const list = exitsByAttempt.get(key) ?? [];
    list.push(item); exitsByAttempt.set(key, list);
  }

  for (const [key, list] of entriesByAttempt) {
    if (list.length > 1) facts.duplicate.push({ type: "duplicate_entry", attempt: key, count: list.length });
  }
  for (const [key, list] of exitsByAttempt) {
    if (list.length > 1) facts.duplicate.push({ type: "duplicate_terminal_exit", attempt: key, count: list.length });
    const entry = entriesByAttempt.get(key)?.[0];
    if (!entry) facts.unexpected.push({ type: "exit_without_entry", attempt: key });
    else if (list[0].index < entry.index || Date.parse(list[0].event.timestamp) < Date.parse(entry.event.timestamp)) {
      facts.out_of_order.push({ type: "exit_before_entry", attempt: key });
    }
  }
  for (const [key, list] of entriesByAttempt) {
    if (!exitsByAttempt.has(key)) facts.missing.push({ type: "terminal_exit_missing", attempt: key, step_id: list[0].event.step_id });
  }

  const manifestSteps = auditContext?.manifest?.expected_steps;
  const expected_steps = Array.isArray(manifestSteps)
    ? manifestSteps.map((step) => ({ ...step }))
    : [...entriesByAttempt.values()].map(([item]) => ({ step_id: item.event.step_id, attempt_id: item.event.attempt_id }));
  const expectedKeys = new Set(expected_steps.map((step) => `${stageSlug}\u0000${step.step_id}\u0000${step.attempt_id}`));

  if (Array.isArray(manifestSteps)) {
    for (const [key, list] of entriesByAttempt) {
      if (expectedKeys.has(key)) continue;
      const { step_id, attempt_id } = list[0].event;
      facts.unexpected.push({ type: "unexpected_observed_step", step_id, attempt_id });
      facts.unknown.push({ type: "unmanifested_step", step_id, attempt_id });
    }

    const observedExpectedEntries = [...entries]
      .filter(({ event }) => expectedKeys.has(attemptKey(event)))
      .sort((left, right) => left.index - right.index);
    for (let index = 0; index < observedExpectedEntries.length; index += 1) {
      const expected = expected_steps[index];
      const observed = observedExpectedEntries[index]?.event;
      if (!expected || (expected.step_id === observed.step_id && expected.attempt_id === observed.attempt_id)) continue;
      facts.out_of_order.push({ type: "manifest_order_violation", step_id: expected.step_id, attempt_id: expected.attempt_id });
    }
  }

  for (const step of expected_steps) {
    const key = `${stageSlug}\u0000${step.step_id}\u0000${step.attempt_id}`;
    if (!entriesByAttempt.has(key)) facts.missing.push({ type: "expected_step_missing", step_id: step.step_id, attempt_id: step.attempt_id });
  }

  const staleRefs = Array.isArray(auditContext?.stale_refs) ? auditContext.stale_refs : [];
  const expectedEvidence = Array.isArray(auditContext?.ledger?.expected_evidence) ? auditContext.ledger.expected_evidence : [];
  for (const ref of uniqueByEvidence(evidenceRefs)) {
    if (staleRefs.some((stale) => stale?.kind === ref.kind && stale?.uri_or_path === ref.uri_or_path)) {
      facts.stale.push({ type: "stale_evidence", kind: ref.kind, uri_or_path: ref.uri_or_path });
    }
    const declared = expectedEvidence.find((item) => item?.kind === ref.kind && item?.uri_or_path === ref.uri_or_path);
    if (declared?.content_hash && declared.content_hash !== ref.content_hash) {
      facts.tampered_hash.push({ type: "evidence_hash_mismatch", kind: ref.kind, uri_or_path: ref.uri_or_path, expected_hash: declared.content_hash, observed_hash: ref.content_hash ?? null });
    }
  }

  const observed_steps = expected_steps.map((step) => {
    const key = `${stageSlug}\u0000${step.step_id}\u0000${step.attempt_id}`;
    return { ...step, entry: entriesByAttempt.has(key), terminal_exit: exitsByAttempt.has(key) };
  });
  const missing_ids = observed_steps.filter((step) => !step.entry || !step.terminal_exit).map((step) => step.step_id);
  const requirement_coverage = { covered: expected_steps.length - missing_ids.length, total: expected_steps.length, withdrawn: 0, missing_ids };
  const hasFindings = Object.values(facts).some((findings) => findings.length > 0);
  const verdict = !hasFindings && expected_steps.length > 0 ? "pass" : "fail";
  const uniqueEvidenceRefs = uniqueByEvidence(evidenceRefs);

  const unsigned = { schema_version: "v1", workflow_run_id: workflowRunId, expected_steps, observed_steps, requirement_coverage, facts, verdict, evidence_refs: uniqueEvidenceRefs };
  const audit_summary = { ...unsigned, summary_hash: hashSummary(unsigned) };
  return { audit_summary, warnings: [] };
}

function uniqueByEvidence(evidenceRefs) {
  return [...new Map(evidenceRefs.map((ref) => [`${ref.kind}\u0000${ref.uri_or_path}`, ref])).values()];
}
