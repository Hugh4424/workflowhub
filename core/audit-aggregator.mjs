/** Canonical expected-topology / observed-receipt reconciler. */
import { createHash } from "node:crypto";
import { calculateCoverage, validateRequirementLedger } from "./requirement-ledger.mjs";
import { assertTaskHandle } from "./task-handle.mjs";

const STAGE_SLUGS = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const TERMINAL_STATUSES = new Set(["success", "failure", "blocked", "skipped", "needs_human"]);
const ATTEMPT_ID = /^attempt-([1-9][0-9]*)$/;
const AUTHENTICATED_RETRY_EVIDENCE = new WeakSet();

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function hashSummary(summary) { return createHash("sha256").update(canonicalJson(summary), "utf8").digest("hex"); }
function nonEmptyString(value) { return typeof value === "string" && value.trim() !== ""; }
function evidenceRef(value) {
  if (!value || typeof value !== "object" || !nonEmptyString(value.kind) || !nonEmptyString(value.uri_or_path)) return null;
  return { kind: value.kind, uri_or_path: value.uri_or_path, ...(nonEmptyString(value.content_hash) ? { content_hash: value.content_hash } : {}) };
}
function eventKey(event) { return `${event.stage_slug}\u0000${event.step_id}\u0000${event.attempt_id}`; }
function expectedKey(stageSlug, step) { return `${stageSlug}\u0000${step.step_id}\u0000${step.attempt_id}`; }
function validIdentity(event, stageSlug, workflowRunId) {
  return event?.workflow_run_id === workflowRunId && event?.stage_slug === stageSlug
    && Number.isInteger(event?.step_id) && event.step_id > 0 && nonEmptyString(event?.attempt_id)
    && nonEmptyString(event?.timestamp) && !Number.isNaN(Date.parse(event.timestamp));
}
function authorizedResearchSkip(event, stageSlug) {
  return stageSlug === "make-decision" && event?.step_id === 4
    && event?.terminal_status === "skipped"
    && event?.authorized_by === "stage-runtime:record-research"
    && nonEmptyString(event?.skip_reason)
    && event?.completion_evidence?.kind === "research_skip"
    && /^[a-f0-9]{64}$/.test(event?.completion_evidence?.content_hash ?? "");
}
function completedDependency(event, stageSlug) {
  return event?.terminal_status === "success" || authorizedResearchSkip(event, stageSlug);
}

/**
 * Authenticate one retry against the kernel-owned journal and invalidation.
 * The returned capability is process-local; copying its fields does not confer
 * authority to promote an observed retry into expected work.
 */
export function authenticateAuditRetryEvidence({
  task,
  stageSlug,
  workflowRunId,
  retryEvent,
  previousEvents,
} = {}) {
  const safeTask = assertTaskHandle(task);
  if (!STAGE_SLUGS.has(stageSlug) || !nonEmptyString(workflowRunId)
      || !validIdentity(retryEvent, stageSlug, workflowRunId)
      || retryEvent.event_type !== "step_entry") {
    throw new Error("audit retry target identity is invalid");
  }
  const retryMatch = ATTEMPT_ID.exec(retryEvent.attempt_id);
  const previousMatch = ATTEMPT_ID.exec(retryEvent.retry_of_attempt_id ?? "");
  if (!retryMatch || !previousMatch || Number(retryMatch[1]) !== Number(previousMatch[1]) + 1) {
    throw new Error("audit retry must name the immediately previous attempt");
  }
  if (!Array.isArray(previousEvents) || previousEvents.length === 0
      || previousEvents.some((event) =>
        !validIdentity(event, stageSlug, workflowRunId)
        || event.step_id !== retryEvent.step_id
        || event.attempt_id !== retryEvent.retry_of_attempt_id)) {
    throw new Error("audit retry previous target-step events are invalid");
  }

  const journal = safeTask.readRecord("journal.jsonl").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const canonicalPreviousEvents = journal.filter((event) =>
    event.workflow_run_id === workflowRunId
    && event.stage_slug === stageSlug
    && event.step_id === retryEvent.step_id
    && event.attempt_id === retryEvent.retry_of_attempt_id);
  const canonicalRetryEntries = journal.filter((event) =>
    event.workflow_run_id === workflowRunId
    && event.stage_slug === stageSlug
    && event.step_id === retryEvent.step_id
    && event.attempt_id === retryEvent.attempt_id
    && event.event_type === "step_entry");
  if (canonicalJson(canonicalPreviousEvents) !== canonicalJson(previousEvents)
      || canonicalRetryEntries.length !== 1
      || canonicalJson(canonicalRetryEntries[0]) !== canonicalJson(retryEvent)) {
    throw new Error("audit retry journal binding mismatch");
  }

  const previousEventsHash = sha256(canonicalJson(previousEvents));
  const identityHash = sha256(`${workflowRunId}\0${retryEvent.step_id}\0${retryEvent.retry_of_attempt_id}`);
  const invalidationRef = `runs/${stageSlug}/journal-invalidations/${identityHash}.json`;
  const invalidationRaw = safeTask.readRecord(invalidationRef);
  const invalidation = JSON.parse(invalidationRaw);
  if (invalidation.schema_version !== "stage-step-attempt-invalidation.v1"
      || invalidation.task_id !== safeTask.identity.taskId
      || invalidation.stage !== stageSlug
      || invalidation.workflow_run_id !== workflowRunId
      || invalidation.step_id !== retryEvent.step_id
      || invalidation.attempt_id !== retryEvent.retry_of_attempt_id
      || invalidation.events_hash !== previousEventsHash
      || !nonEmptyString(invalidation.reason)
      || !Number.isFinite(Date.parse(invalidation.created_at))) {
    throw new Error("audit retry invalidation binding mismatch");
  }

  const evidence = Object.freeze({
    task_id: safeTask.identity.taskId,
    stage_slug: stageSlug,
    workflow_run_id: workflowRunId,
    step_id: retryEvent.step_id,
    attempt_id: retryEvent.attempt_id,
    retry_of_attempt_id: retryEvent.retry_of_attempt_id,
    retry_event_hash: sha256(canonicalJson(retryEvent)),
    previous_events_hash: previousEventsHash,
    invalidation_ref: invalidationRef,
    invalidation_hash: sha256(invalidationRaw),
  });
  AUTHENTICATED_RETRY_EVIDENCE.add(evidence);
  return evidence;
}

function authenticatedRetries(evidence, events, stageSlug, workflowRunId, taskId, facts) {
  const result = new Map();
  if (evidence === undefined) return result;
  if (!Array.isArray(evidence)) {
    facts.retry.push({ type: "INVALID_AUTHENTICATED_RETRY_EVIDENCE" });
    return result;
  }
  for (const item of evidence) {
    const matchingEntry = events.filter((event) =>
      event?.event_type === "step_entry"
      && event?.workflow_run_id === workflowRunId
      && event?.stage_slug === stageSlug
      && event?.step_id === item?.step_id
      && event?.attempt_id === item?.attempt_id
      && event?.retry_of_attempt_id === item?.retry_of_attempt_id);
    if (!AUTHENTICATED_RETRY_EVIDENCE.has(item)
        || item.task_id !== taskId
        || item.stage_slug !== stageSlug
        || item.workflow_run_id !== workflowRunId
        || matchingEntry.length !== 1
        || sha256(canonicalJson(matchingEntry[0])) !== item.retry_event_hash
        || result.has(item.step_id)) {
      facts.retry.push({
        type: "INVALID_AUTHENTICATED_RETRY_EVIDENCE",
        step_id: item?.step_id ?? null,
        attempt_id: item?.attempt_id ?? null,
      });
      continue;
    }
    result.set(item.step_id, item);
  }
  return result;
}

function requiredExpectedSteps(manifest, stageSlug, facts, throughStepId, retryEvidence = new Map()) {
  if (!manifest || typeof manifest !== "object") { facts.unknown.push({ type: "MANIFEST_REQUIRED" }); return []; }
  const declaredStage = manifest.stage_slug ?? stageSlug;
  if (declaredStage !== stageSlug || !Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    facts.unknown.push({ type: "MANIFEST_INVALID" }); return [];
  }
  const seen = new Set();
  const steps = manifest.steps.map((step) => ({
    step_id: step?.step_id,
    attempt_id: retryEvidence.get(step?.step_id)?.attempt_id ?? step?.attempt_id ?? "attempt-1",
    order: step?.order,
    depends_on: step?.depends_on ?? [],
  }));
  for (const step of steps) {
    if (!Number.isInteger(step.step_id) || step.step_id < 1 || !nonEmptyString(step.attempt_id) || !Number.isInteger(step.order) || step.order < 1) {
      facts.unknown.push({ type: "MANIFEST_INVALID_STEP", step_id: step.step_id ?? null }); continue;
    }
    const key = expectedKey(stageSlug, step);
    if (seen.has(key)) facts.duplicate.push({ type: "duplicate_manifest_attempt", step_id: step.step_id, attempt_id: step.attempt_id });
    seen.add(key);
  }
  const ordered = steps.sort((a, b) => a.order - b.order || a.step_id - b.step_id);
  if (throughStepId === undefined) return ordered;
  if (!Number.isInteger(throughStepId) || throughStepId < 1
      || !ordered.some((step) => step.step_id === throughStepId)) {
    facts.unknown.push({ type: "INVALID_AUDIT_STEP_BOUNDARY", through_step_id: throughStepId ?? null });
    return ordered;
  }
  return ordered.filter((step) => step.order <= ordered.find((candidate) => candidate.step_id === throughStepId).order);
}

function uniqueEvidenceRefs(refs) {
  return [...new Map(refs.map((ref) => [`${ref.kind}\u0000${ref.uri_or_path}\u0000${ref.content_hash ?? ""}`, ref])).values()];
}

function stageContentFacts(auditContext, stageSlug, workflowRunId, facts) {
  const requiredKinds = Array.isArray(auditContext.required_content_kinds)
    ? auditContext.required_content_kinds
    : [];
  const records = Array.isArray(auditContext.content_evidence)
    ? auditContext.content_evidence
    : [];
  const refs = [];
  const byKind = new Map();
  for (const [index, record] of records.entries()) {
    const value = record?.value;
    const kind = value?.kind;
    if (!nonEmptyString(kind) || !nonEmptyString(record?.ref) || !/^[a-f0-9]{64}$/.test(record?.hash ?? "")) {
      facts.unknown.push({ type: "INVALID_STAGE_CONTENT_EVIDENCE", index });
      continue;
    }
    const sameKind = byKind.get(kind) ?? [];
    sameKind.push(index);
    byKind.set(kind, sameKind);
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    if (createHash("sha256").update(raw).digest("hex") !== record.hash) {
      facts.tampered_hash.push({ type: "STAGE_CONTENT_HASH_MISMATCH", kind, ref: record.ref });
    }
    if (auditContext.task_id !== value.task_id) facts.unknown.push({ type: "STAGE_CONTENT_TASK_MISMATCH", kind });
    if (value.stage !== stageSlug) facts.unknown.push({ type: "STAGE_CONTENT_STAGE_MISMATCH", kind });
    if (value.workflow_run_id !== workflowRunId) facts.unknown.push({ type: "STAGE_CONTENT_RUN_MISMATCH", kind });
    if (auditContext.snapshot_tree !== value.snapshot_tree) facts.unknown.push({ type: "STAGE_CONTENT_TREE_MISMATCH", kind });
    refs.push({ kind, ref: record.ref, hash: record.hash });
  }
  for (const [kind, indexes] of byKind) {
    if (indexes.length > 1) facts.duplicate.push({ type: "DUPLICATE_STAGE_CONTENT_KIND", kind, count: indexes.length });
  }
  for (const kind of requiredKinds) {
    if (!byKind.has(kind)) facts.missing.push({ type: "REQUIRED_STAGE_CONTENT_KIND_MISSING", kind });
  }
  return refs;
}

/**
 * Manifest and ledger are required authority inputs.  This function never
 * promotes observed entries into expected work and never calculates coverage
 * from step counts.
 */
export function buildAuditSummaryFromJournalEvents(events, stageSlug, workflowRunId, auditContext = {}) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array");
  if (!STAGE_SLUGS.has(stageSlug)) throw new TypeError("stageSlug must be a long canonical stage slug");
  if (!nonEmptyString(workflowRunId)) throw new TypeError("workflowRunId must be a non-empty string");

  const facts = {
    missing: [], unexpected: [], duplicate: [], out_of_order: [], unknown: [], stale: [], tampered_hash: [],
    terminal_non_success: [], retry: [], cross_attempt: [], dependency: [],
  };
  const retryEvidence = authenticatedRetries(
    auditContext.authenticated_retries,
    events,
    stageSlug,
    workflowRunId,
    auditContext.task_id,
    facts,
  );
  const expectedSteps = requiredExpectedSteps(
    auditContext.manifest,
    stageSlug,
    facts,
    auditContext.through_step_id,
    retryEvidence,
  );
  const ledgerResult = validateRequirementLedger(auditContext.ledger);
  const requirement_coverage = ledgerResult.ok ? calculateCoverage(auditContext.ledger) : { covered: 0, total: 0, withdrawn: 0, missing_ids: [] };
  if (!ledgerResult.ok) facts.unknown.push({ type: "LEDGER_REQUIRED_OR_INVALID", errors: ledgerResult.errors });
  const contentEvidenceRefs = stageContentFacts(auditContext, stageSlug, workflowRunId, facts);

  const entries = []; const exits = []; const evidenceRefs = [];
  events.forEach((event, index) => {
    if (event?.workflow_run_id !== workflowRunId || event?.stage_slug !== stageSlug) return;
    if (!validIdentity(event, stageSlug, workflowRunId)) { facts.unknown.push({ index, type: "invalid_receipt", step_id: event?.step_id ?? null }); return; }
    if (event.event_type === "step_entry") {
      if (!evidenceRef(event.entry_evidence) || !nonEmptyString(event.journal_entry_id)) facts.unknown.push({ index, type: "invalid_entry", step_id: event.step_id });
      else { entries.push({ event, index }); evidenceRefs.push(evidenceRef(event.entry_evidence)); }
      const authenticated = retryEvidence.get(event.step_id);
      if (event.retry_of_attempt_id
          && (authenticated?.attempt_id !== event.attempt_id
            || authenticated.retry_of_attempt_id !== event.retry_of_attempt_id)) {
        facts.retry.push({
          type: "UNAUTHENTICATED_RETRY",
          step_id: event.step_id,
          attempt_id: event.attempt_id,
          retry_of_attempt_id: event.retry_of_attempt_id,
        });
      }
    } else if (event.event_type === "step_exit") {
      if (!TERMINAL_STATUSES.has(event.terminal_status) || !evidenceRef(event.completion_evidence) || !nonEmptyString(event.entry_journal_entry_id)) facts.unknown.push({ index, type: "invalid_exit", step_id: event.step_id });
      else {
        exits.push({ event, index }); evidenceRefs.push(evidenceRef(event.completion_evidence));
        if (!completedDependency(event, stageSlug)) facts.terminal_non_success.push({ step_id: event.step_id, attempt_id: event.attempt_id, terminal_status: event.terminal_status });
      }
    } else if (event.event_type === "step_auto_rollback") {
      facts.unknown.push({ index, type: "rollback_observed", step_id: event.affected_step_id ?? null });
    } else facts.unknown.push({ index, type: "unknown_event", event_type: event.event_type ?? null });
  });

  const entriesByKey = new Map(); const exitsByKey = new Map();
  for (const item of entries) { const list = entriesByKey.get(eventKey(item.event)) ?? []; list.push(item); entriesByKey.set(eventKey(item.event), list); }
  for (const item of exits) { const list = exitsByKey.get(eventKey(item.event)) ?? []; list.push(item); exitsByKey.set(eventKey(item.event), list); }
  for (const [key, list] of entriesByKey) if (list.length !== 1) facts.duplicate.push({ type: "duplicate_entry", attempt: key, count: list.length });
  for (const [key, list] of exitsByKey) {
    if (list.length !== 1) facts.duplicate.push({ type: "duplicate_terminal_exit", attempt: key, count: list.length });
    const entry = entriesByKey.get(key)?.[0];
    if (!entry) facts.unexpected.push({ type: "exit_without_entry", attempt: key });
    else if (list[0].index < entry.index || Date.parse(list[0].event.timestamp) < Date.parse(entry.event.timestamp)) facts.out_of_order.push({ type: "exit_before_entry", attempt: key });
    else if (entry.event.journal_entry_id !== list[0].event.entry_journal_entry_id) facts.cross_attempt.push({ type: "entry_exit_binding_mismatch", attempt: key });
  }
  for (const [key, list] of entriesByKey) if (!exitsByKey.has(key)) facts.missing.push({ type: "terminal_exit_missing", attempt: key, step_id: list[0].event.step_id });

  const expectedKeys = new Set(expectedSteps.map((step) => expectedKey(stageSlug, step)));
  for (const [key, list] of entriesByKey) if (!expectedKeys.has(key)) facts.unexpected.push({ type: "unexpected_observed_step", step_id: list[0].event.step_id, attempt_id: list[0].event.attempt_id });
  for (const step of expectedSteps) {
    const key = expectedKey(stageSlug, step);
    const entry = entriesByKey.get(key)?.[0]; const exit = exitsByKey.get(key)?.[0];
    if (!entry) facts.missing.push({ type: "expected_step_missing", step_id: step.step_id, attempt_id: step.attempt_id });
    if (entry && exit && step.depends_on.length) {
      for (const dependencyId of step.depends_on) {
        const dependency = expectedSteps.find((candidate) => candidate.step_id === dependencyId);
        const dependencyExit = dependency && exitsByKey.get(expectedKey(stageSlug, dependency))?.[0];
        if (!dependencyExit || !completedDependency(dependencyExit.event, stageSlug) || dependencyExit.index > entry.index) {
          facts.dependency.push({ type: "dependency_not_completed_before_entry", step_id: step.step_id, dependency_id: dependencyId });
        }
      }
    }
  }
  const observedExpected = entries.filter(({ event }) => expectedKeys.has(eventKey(event))).sort((a, b) => a.index - b.index);
  for (let index = 0; index < observedExpected.length; index += 1) {
    const expected = expectedSteps[index]; const observed = observedExpected[index]?.event;
    if (expected && (expected.step_id !== observed.step_id || expected.attempt_id !== observed.attempt_id)) facts.out_of_order.push({ type: "manifest_order_violation", step_id: observed.step_id, attempt_id: observed.attempt_id });
  }

  const staleRefs = Array.isArray(auditContext.stale_refs) ? auditContext.stale_refs : [];
  const expectedEvidence = Array.isArray(auditContext.expected_evidence) ? auditContext.expected_evidence : [];
  for (const ref of uniqueEvidenceRefs(evidenceRefs)) {
    if (staleRefs.some((item) => item?.kind === ref.kind && item?.uri_or_path === ref.uri_or_path)) facts.stale.push({ type: "stale_evidence", kind: ref.kind, uri_or_path: ref.uri_or_path });
    const declared = expectedEvidence.find((item) => item?.kind === ref.kind && item?.uri_or_path === ref.uri_or_path);
    if (declared?.content_hash && declared.content_hash !== ref.content_hash) facts.tampered_hash.push({ type: "evidence_hash_mismatch", kind: ref.kind, uri_or_path: ref.uri_or_path });
  }

  const observed_steps = expectedSteps.map((step) => {
    const key = expectedKey(stageSlug, step);
    return { ...step, entry: entriesByKey.has(key), terminal_exit: exitsByKey.has(key), terminal_status: exitsByKey.get(key)?.[0]?.event.terminal_status ?? null };
  });
  const hasFindings = Object.values(facts).some((items) => items.length > 0);
  const verdict = !hasFindings && requirement_coverage.total > 0 && requirement_coverage.covered === requirement_coverage.total ? "pass" : "fail";
  const unsigned = {
    schema_version: "v1",
    ...(nonEmptyString(auditContext.task_id) ? { task_id: auditContext.task_id } : {}),
    stage_slug: stageSlug,
    workflow_run_id: workflowRunId,
    through_step_id: auditContext.through_step_id ?? expectedSteps.at(-1)?.step_id ?? null,
    ...(stageSlug === "make-decision" ? {
      audit_scope: (auditContext.through_step_id ?? expectedSteps.at(-1)?.step_id) === 10
        ? "pre_confirmation"
        : "full",
    } : {}),
    ...(nonEmptyString(auditContext.snapshot_tree) ? { snapshot_tree: auditContext.snapshot_tree } : {}),
    journal_hash: createHash("sha256").update(events.map((event) => JSON.stringify(event)).join("\n")).digest("hex"),
    content_evidence_refs: contentEvidenceRefs,
    expected_steps: expectedSteps,
    observed_steps,
    requirement_coverage,
    facts,
    verdict,
    completion_effect: "disclose_only",
    evidence_refs: uniqueEvidenceRefs(evidenceRefs),
    ledger_hash: auditContext.ledger?.ledger_hash ?? null,
    manifest_hash: auditContext.manifest?.manifest_hash ?? null,
  };
  return { audit_summary: { ...unsigned, summary_hash: hashSummary(unsigned) }, warnings: [] };
}

// Legacy helpers remain exported for P1 consumer imports. They intentionally
// do not choose a verdict and therefore are not an alternate audit path.
export function latestByStepId(events) { return new Map(events.map((event) => [event.step_id, event])); }
export function latestByStepAndEntry(events) { return new Map(events.map((event) => [`${event.step_id}::${event.exit_journal_entry_id ?? null}`, event])); }
