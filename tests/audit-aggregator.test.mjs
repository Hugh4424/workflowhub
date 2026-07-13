import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildAuditSummaryFromJournalEvents } from "../core/audit-aggregator.mjs";

function fixture(name) {
  return JSON.parse(readFileSync(resolve("tests/fixtures/step-audit", `${name}.json`), "utf8"));
}

describe("Phase 2 canonical audit summary", () => {
  it("returns the aggregator-only pass verdict, evidence references, and stable summary hash for a complete attempt", () => {
    const input = fixture("normal");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
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

  it("records duplicate terminal exits as a non-pass finding instead of choosing one", () => {
    const input = fixture("duplicate");
    const { audit_summary } = buildAuditSummaryFromJournalEvents(
      input.journal_events,
      input.stage_slug,
      input.workflow_run_id,
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

    expect(audit_summary.expected_steps).toEqual(input.audit_context.manifest.expected_steps);
    expect(audit_summary.observed_steps).toContainEqual({
      step_id: "bc.work.2",
      attempt_id: "attempt-1",
      entry: false,
      terminal_exit: false,
    });
    expect(audit_summary.facts.missing).toContainEqual(expect.objectContaining({
      type: "expected_step_missing",
      step_id: "bc.work.2",
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

    expect(audit_summary.expected_steps).toEqual(input.audit_context.manifest.expected_steps);
    expect(audit_summary.facts.unexpected).toContainEqual(expect.objectContaining({
      type: "unexpected_observed_step",
      step_id: "bc.work.rogue",
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

    expect(audit_summary.expected_steps).toEqual(input.audit_context.manifest.expected_steps);
    expect(audit_summary.facts.out_of_order).toContainEqual(expect.objectContaining({
      type: "manifest_order_violation",
      step_id: "bc.work.1",
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

    expect(audit_summary.expected_steps).toEqual(input.audit_context.manifest.expected_steps);
    expect(audit_summary.facts.unknown).toContainEqual(expect.objectContaining({
      type: "unmanifested_step",
      step_id: "bc.work.unknown",
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
