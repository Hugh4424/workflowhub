/** Canonical expected-topology / observed-receipt reconciler. */
import { createHash } from "node:crypto";
import { calculateCoverage, validateRequirementLedger } from "./requirement-ledger.mjs";

const STAGE_SLUGS = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const TERMINAL_STATUSES = new Set(["success", "failure", "blocked", "skipped", "needs_human"]);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
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

function requiredExpectedSteps(manifest, stageSlug, facts) {
  if (!manifest || typeof manifest !== "object") { facts.unknown.push({ type: "MANIFEST_REQUIRED" }); return []; }
  const declaredStage = manifest.stage_slug ?? stageSlug;
  if (declaredStage !== stageSlug || !Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    facts.unknown.push({ type: "MANIFEST_INVALID" }); return [];
  }
  const seen = new Set();
  const steps = manifest.steps.map((step) => ({
    step_id: step?.step_id,
    attempt_id: step?.attempt_id ?? "attempt-1",
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
  return steps.sort((a, b) => a.order - b.order || a.step_id - b.step_id);
}

function uniqueEvidenceRefs(refs) {
  return [...new Map(refs.map((ref) => [`${ref.kind}\u0000${ref.uri_or_path}\u0000${ref.content_hash ?? ""}`, ref])).values()];
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
  const expectedSteps = requiredExpectedSteps(auditContext.manifest, stageSlug, facts);
  const ledgerResult = validateRequirementLedger(auditContext.ledger);
  const requirement_coverage = ledgerResult.ok ? calculateCoverage(auditContext.ledger) : { covered: 0, total: 0, withdrawn: 0, missing_ids: [] };
  if (!ledgerResult.ok) facts.unknown.push({ type: "LEDGER_REQUIRED_OR_INVALID", errors: ledgerResult.errors });

  const entries = []; const exits = []; const evidenceRefs = [];
  events.forEach((event, index) => {
    if (event?.workflow_run_id !== workflowRunId || event?.stage_slug !== stageSlug) return;
    if (!validIdentity(event, stageSlug, workflowRunId)) { facts.unknown.push({ index, type: "invalid_receipt", step_id: event?.step_id ?? null }); return; }
    if (event.event_type === "step_entry") {
      if (!evidenceRef(event.entry_evidence) || !nonEmptyString(event.journal_entry_id)) facts.unknown.push({ index, type: "invalid_entry", step_id: event.step_id });
      else { entries.push({ event, index }); evidenceRefs.push(evidenceRef(event.entry_evidence)); }
      if (event.retry_of_attempt_id) facts.retry.push({ step_id: event.step_id, attempt_id: event.attempt_id, retry_of_attempt_id: event.retry_of_attempt_id });
    } else if (event.event_type === "step_exit") {
      if (!TERMINAL_STATUSES.has(event.terminal_status) || !evidenceRef(event.completion_evidence) || !nonEmptyString(event.entry_journal_entry_id)) facts.unknown.push({ index, type: "invalid_exit", step_id: event.step_id });
      else {
        exits.push({ event, index }); evidenceRefs.push(evidenceRef(event.completion_evidence));
        if (event.terminal_status !== "success") facts.terminal_non_success.push({ step_id: event.step_id, attempt_id: event.attempt_id, terminal_status: event.terminal_status });
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
        if (!dependencyExit || dependencyExit.event.terminal_status !== "success" || dependencyExit.index > entry.index) {
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
  const unsigned = { schema_version: "v1", workflow_run_id: workflowRunId, expected_steps: expectedSteps, observed_steps, requirement_coverage, facts, verdict, evidence_refs: uniqueEvidenceRefs(evidenceRefs), ledger_hash: auditContext.ledger?.ledger_hash ?? null, manifest_hash: auditContext.manifest?.manifest_hash ?? null };
  return { audit_summary: { ...unsigned, summary_hash: hashSummary(unsigned) }, warnings: [] };
}

// Legacy helpers remain exported for P1 consumer imports. They intentionally
// do not choose a verdict and therefore are not an alternate audit path.
export function latestByStepId(events) { return new Map(events.map((event) => [event.step_id, event])); }
export function latestByStepAndEntry(events) { return new Map(events.map((event) => [`${event.step_id}::${event.exit_journal_entry_id ?? null}`, event])); }
