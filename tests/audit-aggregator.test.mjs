import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildAuditSummaryFromJournalEvents } from "../core/audit-aggregator.mjs";
import { computeLedgerHash, computeRequirementContentHash } from "../core/requirement-ledger.mjs";

function fixture(name) {
  const input = JSON.parse(readFileSync(resolve("tests/fixtures/step-audit", `${name}.json`), "utf8"));
  const stepId = (value) => Number.isInteger(value) ? value : (/^bc\.work\.(\d+)$/.test(value) ? Number(RegExp.$1) : 99);
  input.stage_slug = "build-code";
  input.journal_events = input.journal_events.map((event) => ({ ...event, stage_slug: "build-code", step_id: stepId(event.step_id), ...(event.exit_journal_entry_id ? { entry_journal_entry_id: event.exit_journal_entry_id } : {}) }));
  const oldSteps = input.audit_context?.manifest?.expected_steps ?? [...new Set(input.journal_events.map((event) => event.step_id))].sort((a, b) => a - b).map((step_id) => ({ step_id, attempt_id: "attempt-1" }));
  const steps = oldSteps.map((step, index) => ({ step_id: stepId(step.step_id), order: index + 1, attempt_id: step.attempt_id ?? "attempt-1", depends_on: [] }));
  const requirement = { requirement_id: "R1", status: "accepted", source_ref: { kind: "source", uri_or_path: "source://R1", content_hash: "a".repeat(64) }, decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) }, artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }], acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }], upstream_hashes: ["a".repeat(64)], stale: false };
  requirement.content_hash = computeRequirementContentHash(requirement);
  const ledger = { schema_version: "v1", source_manifest_hash: "e".repeat(64), requirements: [requirement] };
  ledger.ledger_hash = computeLedgerHash(ledger);
  input.audit_context = { ...(input.audit_context ?? {}), manifest: { schema_version: "2.0.0", stage_slug: "build-code", manifest_hash: "f".repeat(64), steps }, ledger, ...(input.audit_context?.ledger?.expected_evidence ? { expected_evidence: input.audit_context.ledger.expected_evidence } : {}) };
  return input;
}

describe("Phase 2 canonical audit summary", () => {
  it("separates a passing pre-confirmation prefix from the incomplete full audit", () => {
    const input = fixture("normal");
    const [baseEntry, baseExit] = input.journal_events;
    const steps = Array.from({ length: 12 }, (_, index) => ({
      step_id: index + 1,
      order: index + 1,
      attempt_id: "attempt-1",
      depends_on: index === 0 ? [] : [index],
    }));
    const events = steps.slice(0, 10).flatMap((step, index) => {
      const entryId = `entry-${step.step_id}`;
      return [
        { ...baseEntry, step_id: step.step_id, journal_entry_id: entryId, timestamp: new Date(Date.parse(baseEntry.timestamp) + index * 2000).toISOString() },
        { ...baseExit, step_id: step.step_id, entry_journal_entry_id: entryId, timestamp: new Date(Date.parse(baseEntry.timestamp) + index * 2000 + 1000).toISOString() },
      ];
    });
    const context = { ...input.audit_context, manifest: { ...input.audit_context.manifest, steps } };
    const prefix = buildAuditSummaryFromJournalEvents(events, input.stage_slug, input.workflow_run_id, {
      ...context,
      through_step_id: 10,
    }).audit_summary;
    const full = buildAuditSummaryFromJournalEvents(events, input.stage_slug, input.workflow_run_id, context).audit_summary;
    const invalid = buildAuditSummaryFromJournalEvents(events, input.stage_slug, input.workflow_run_id, {
      ...context,
      through_step_id: 99,
    }).audit_summary;

    expect(prefix).toMatchObject({ verdict: "pass", through_step_id: 10 });
    expect(full).toMatchObject({ verdict: "fail", through_step_id: 12 });
    expect(full.facts.missing).toContainEqual(expect.objectContaining({ type: "expected_step_missing", step_id: 11 }));
    expect(invalid.facts.unknown).toContainEqual(expect.objectContaining({ type: "INVALID_AUDIT_STEP_BOUNDARY", through_step_id: 99 }));
    expect(prefix.summary_hash).not.toBe(full.summary_hash);
  });

  it("returns the aggregator-only pass verdict, evidence references, and stable summary hash for a complete attempt", () => {
    const input = fixture("normal");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary).toMatchObject({
      schema_version: "v1",
      workflow_run_id: input.workflow_run_id,
      expected_steps: expect.any(Array),
      observed_steps: expect.any(Array),
      requirement_coverage: expect.objectContaining({ covered: 1, total: 1, withdrawn: 0 }),
      facts: expect.objectContaining({ missing: [], duplicate: [], out_of_order: [], unknown: [] }),
      verdict: "pass",
      evidence_refs: expect.any(Array),
    });
    expect(audit_summary.summary_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("treats only the runtime-authorized make-decision research skip as a completed dependency", () => {
    const input = fixture("normal");
    const [baseEntry, baseExit] = input.journal_events;
    const steps = Array.from({ length: 5 }, (_, index) => ({
      step_id: index + 1,
      order: index + 1,
      attempt_id: "attempt-1",
      depends_on: index === 0 ? [] : [index],
    }));
    const events = steps.flatMap((step, index) => {
      const entryId = `entry-${step.step_id}`;
      const entry = {
        ...baseEntry,
        stage_slug: "make-decision",
        step_id: step.step_id,
        journal_entry_id: entryId,
        timestamp: new Date(Date.parse(baseEntry.timestamp) + index * 2000).toISOString(),
      };
      const exit = {
        ...baseExit,
        stage_slug: "make-decision",
        step_id: step.step_id,
        entry_journal_entry_id: entryId,
        timestamp: new Date(Date.parse(baseEntry.timestamp) + index * 2000 + 1000).toISOString(),
        ...(step.step_id === 4 ? {
          terminal_status: "skipped",
          skip_reason: "Existing canonical evidence is sufficient.",
          authorized_by: "stage-runtime:record-research",
          completion_evidence: {
            kind: "research_skip",
            uri_or_path: "evidence/research-basis.json",
            content_hash: "a".repeat(64),
          },
        } : {}),
      };
      return [entry, exit];
    });
    const context = {
      ...input.audit_context,
      task_id: "task-one",
      manifest: { ...input.audit_context.manifest, stage_slug: "make-decision", steps },
    };
    const authorized = buildAuditSummaryFromJournalEvents(
      events,
      "make-decision",
      input.workflow_run_id,
      context,
    ).audit_summary;
    expect(authorized.verdict).toBe("pass");
    expect(authorized.facts.terminal_non_success).toEqual([]);
    expect(authorized.facts.dependency).toEqual([]);

    const unauthorizedEvents = structuredClone(events);
    delete unauthorizedEvents.find((event) => event.event_type === "step_exit" && event.step_id === 4).authorized_by;
    const unauthorized = buildAuditSummaryFromJournalEvents(
      unauthorizedEvents,
      "make-decision",
      input.workflow_run_id,
      context,
    ).audit_summary;
    expect(unauthorized.verdict).toBe("fail");
    expect(unauthorized.facts.terminal_non_success).toContainEqual(expect.objectContaining({ step_id: 4 }));
    expect(unauthorized.facts.dependency).toContainEqual(expect.objectContaining({ step_id: 5, dependency_id: 4 }));
  });

  it("records duplicate terminal exits as a non-pass finding instead of choosing one", () => {
    const input = fixture("duplicate");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary.facts.duplicate).toHaveLength(1);
    expect(audit_summary.verdict).not.toBe("pass");
  });

  it("uses the manifest's declared steps as the expected denominator and reports absent steps", () => {
    const input = fixture("missing");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary.expected_steps).toMatchObject(input.audit_context.manifest.steps);
    expect(audit_summary.observed_steps.find((step) => step.step_id === 2)).toMatchObject({
      step_id: 2,
      attempt_id: "attempt-1",
      entry: false,
      terminal_exit: false,
    });
    expect(audit_summary.facts.missing).toContainEqual(expect.objectContaining({
      type: "expected_step_missing",
      step_id: 2,
      attempt_id: "attempt-1",
    }));
    expect(audit_summary.verdict).toBe("fail");
  });

  it("reports an observed step outside the manifest as unexpected instead of adding it to expected work", () => {
    const input = fixture("unexpected");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary.expected_steps).toMatchObject(input.audit_context.manifest.steps);
    expect(audit_summary.facts.unexpected).toContainEqual(expect.objectContaining({
      type: "unexpected_observed_step",
      step_id: 99,
      attempt_id: "attempt-1",
    }));
    expect(audit_summary.verdict).toBe("fail");
  });

  it("uses manifest order to reject otherwise complete steps observed out of order", () => {
    const input = fixture("out-of-order");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary.expected_steps).toMatchObject(input.audit_context.manifest.steps);
    expect(audit_summary.facts.out_of_order).toContainEqual(expect.objectContaining({
      type: "manifest_order_violation",
      step_id: 1,
    }));
    expect(audit_summary.verdict).toBe("fail");
  });

  it("marks a canonical-looking journal record for an unmanifested step as unknown", () => {
    const input = fixture("unknown");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary.expected_steps).toMatchObject(input.audit_context.manifest.steps);
    expect(audit_summary.facts.unexpected).toContainEqual(expect.objectContaining({
      type: "unexpected_observed_step",
      step_id: 99,
      attempt_id: "attempt-1",
    }));
    expect(audit_summary.verdict).toBe("fail");
  });

  it("fails closed when a referenced evidence record is stale", () => {
    const input = fixture("stale");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary.facts.stale).toContainEqual(expect.objectContaining({
      type: "stale_evidence",
      uri_or_path: "evidence/phase-2-GREEN.json",
    }));
    expect(audit_summary.verdict).toBe("fail");
  });

  it("fails closed when observed evidence hash differs from the declared hash", () => {
    const input = fixture("tampered-hash");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
      input.audit_context,
    );

    expect(audit_summary.facts.tampered_hash).toContainEqual(expect.objectContaining({
      type: "evidence_hash_mismatch",
      uri_or_path: "evidence/phase-2-GREEN.json",
    }));
    expect(audit_summary.verdict).toBe("fail");
  });
});
