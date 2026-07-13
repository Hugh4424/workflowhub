import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { computeLedgerHash, computeRequirementContentHash } from "../requirement-ledger.mjs";

const TASK_ID = "receipt-writer-test";
const RUN_ID = "run-123";
const ENTRY_TIMESTAMP = "2026-07-13T00:00:00.000Z";
const EXIT_TIMESTAMP = "2026-07-13T00:01:00.000Z";

function makeTaskDir() {
  return mkdtempSync(join(tmpdir(), "workflowhub-receipts-"));
}

async function importWriter(taskDir, fsMock) {
  vi.resetModules();
  vi.doMock("../task-dir-parser.mjs", () => ({ parseTaskDir: () => taskDir }));
  if (fsMock) vi.doMock("node:fs/promises", () => fsMock);
  return import("../receipt-writer.mjs");
}

function entryPayload(overrides = {}) {
  return {
    workflow_run_id: RUN_ID,
    stage_slug: "build-code",
    step_id: 1,
    manifest_schema_version: "2.0.0",
    attempt_id: "attempt-1",
    event_type: "step_entry",
    timestamp: ENTRY_TIMESTAMP,
    entry_evidence: { kind: "command", uri_or_path: "evidence/entry.log" },
    ...overrides,
  };
}

function exitPayload(overrides = {}) {
  return {
    workflow_run_id: RUN_ID,
    stage_slug: "build-code",
    step_id: 1,
    manifest_schema_version: "2.0.0",
    attempt_id: "attempt-1",
    event_type: "step_exit",
    timestamp: EXIT_TIMESTAMP,
    terminal_status: "success",
    completion_evidence: { kind: "command", uri_or_path: "evidence/exit.log" },
    ...overrides,
  };
}

function readJournal(taskDir) {
  return readFileSync(join(taskDir, TASK_ID, "journal.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

function auditContext() {
  const record = {
    requirement_id: "R1", status: "accepted",
    source_ref: { kind: "source", uri_or_path: "source://R1", content_hash: "a".repeat(64) },
    decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
    artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
    acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
    upstream_hashes: ["a".repeat(64)], stale: false,
  };
  record.content_hash = computeRequirementContentHash(record);
  const ledger = { schema_version: "v1", source_manifest_hash: "e".repeat(64), requirements: [record] };
  ledger.ledger_hash = computeLedgerHash(ledger);
  return { manifest: { schema_version: "2.0.0", stage_slug: "build-code", manifest_hash: "f".repeat(64), steps: [{ step_id: 1, order: 1, attempt_id: "attempt-1", depends_on: [] }] }, ledger };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../task-dir-parser.mjs");
  vi.doUnmock("node:fs/promises");
});

describe("journal schema", () => {
  it("defines canonical receipt identity and terminal status enums", async () => {
    const { JOURNAL_SCHEMA_VERSION, JOURNAL_EVENT_TYPES, RECEIPT_IDENTITY_FIELDS, TERMINAL_STATUSES } =
      await import("../journal-schema.mjs");

    expect(JOURNAL_SCHEMA_VERSION).toBe("v1");
    expect(JOURNAL_EVENT_TYPES).toMatchObject({ STEP_ENTRY: "step_entry", STEP_EXIT: "step_exit" });
    expect(RECEIPT_IDENTITY_FIELDS).toEqual([
      "workflow_run_id", "stage_slug", "step_id", "attempt_id", "event_type", "timestamp",
    ]);
    expect(TERMINAL_STATUSES).toEqual(["success", "failure", "blocked", "skipped", "needs_human"]);
  });
});

describe("canonical receipt writer", () => {
  it("persists a canonical STEP_ENTRY receipt with a generated journal entry id", async () => {
    const taskDir = makeTaskDir();
    const { writeEntryReceipt } = await importWriter(taskDir);

    await expect(writeEntryReceipt(TASK_ID, entryPayload())).resolves.toEqual({ journal_entry_id: expect.any(String) });

    expect(readJournal(taskDir)).toEqual([
      expect.objectContaining({
        schema_version: "v1",
        event_type: "step_entry",
        workflow_run_id: RUN_ID,
        stage_slug: "build-code",
        step_id: 1,
        attempt_id: "attempt-1",
        timestamp: ENTRY_TIMESTAMP,
        entry_evidence: { kind: "command", uri_or_path: "evidence/entry.log" },
        journal_entry_id: expect.any(String),
      }),
    ]);
  });

  it("is fail-closed when a STEP_ENTRY append fails", async () => {
    const appendFile = vi.fn(async () => { throw new Error("append failed"); });
    const { writeEntryReceipt } = await importWriter(makeTaskDir(), { appendFile, mkdir: vi.fn(async () => {}) });

    await expect(writeEntryReceipt(TASK_ID, entryPayload())).rejects.toThrow("append failed");
  });

  it("is warn-only when a STEP_EXIT append fails and preserves the canonical original payload", async () => {
    const appendFile = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("exit append failed")).mockResolvedValueOnce(undefined);
    const { writeEntryReceipt, writeExitReceipt } = await importWriter(makeTaskDir(), { appendFile, mkdir: vi.fn(async () => {}) });
    const entry = await writeEntryReceipt(TASK_ID, entryPayload());
    const payload = exitPayload({ terminal_status: "failure", entry_journal_entry_id: entry.journal_entry_id });

    await expect(writeExitReceipt(TASK_ID, payload)).resolves.toBeUndefined();
    expect(appendFile).toHaveBeenCalledTimes(3);
    const warn = JSON.parse(appendFile.mock.calls[2][1]);
    expect(warn).toMatchObject({
      event: "receipt_write_warn",
      original_exit_payload: {
        event_type: "step_exit",
        step_id: 1,
        terminal_status: "failure",
        completion_evidence: { kind: "command", uri_or_path: "evidence/exit.log" },
      },
    });
  });

  it.each([
    ["step id", entryPayload({ step_id: "bad.step" }), "step_id"],
    ["stage mismatch", entryPayload({ stage_slug: "bp" }), "stage_slug"],
    ["missing attempt", entryPayload({ attempt_id: "" }), "attempt_id"],
    ["wrong entry event", entryPayload({ event_type: "step_exit" }), "event_type"],
    ["invalid entry evidence", entryPayload({ entry_evidence: { kind: "command" } }), "entry_evidence.uri_or_path"],
  ])("rejects canonical entry with invalid %s", async (_label, payload, error) => {
    const { writeEntryReceipt } = await importWriter(makeTaskDir());
    await expect(writeEntryReceipt(TASK_ID, payload)).rejects.toThrow(error);
  });

  it.each([
    ["missing run id", exitPayload({ workflow_run_id: "" }), "workflow_run_id"],
    ["wrong exit event", exitPayload({ event_type: "step_entry" }), "event_type"],
    ["invalid terminal status", exitPayload({ terminal_status: "passed" }), "terminal_status"],
    ["invalid completion evidence", exitPayload({ completion_evidence: { kind: "command" } }), "completion_evidence.uri_or_path"],
  ])("rejects canonical exit with %s", async (_label, payload, error) => {
    const { writeExitReceipt } = await importWriter(makeTaskDir());
    await expect(writeExitReceipt(TASK_ID, payload)).rejects.toThrow(error);
  });

  it("validates and appends runner-owned rollback facts without treating them as receipts", async () => {
    const taskDir = makeTaskDir();
    const { writeStepAutoRollback } = await importWriter(taskDir);

    await writeStepAutoRollback(TASK_ID, {
      workflow_run_id: RUN_ID,
      affected_step_id: 1,
      rollback_from_step_id: 1,
      rollback_to_step_id: 1,
      attempt_seq: 1,
      ineffective: true,
      reason: "check blocked",
    });

    expect(readJournal(taskDir)[0]).toMatchObject({ event_type: "step_auto_rollback", workflow_run_id: RUN_ID });
  });
});

describe("canonical audit aggregation", () => {
  it("reports a complete paired entry and exit as a passing observed-fact audit", async () => {
    const taskDir = makeTaskDir();
    const { buildAuditSummaryFromJournalEvents, writeEntryReceipt, writeExitReceipt } = await importWriter(taskDir);
    const entry = await writeEntryReceipt(TASK_ID, entryPayload());
    await writeExitReceipt(TASK_ID, exitPayload({ entry_journal_entry_id: entry.journal_entry_id }));

    const result = buildAuditSummaryFromJournalEvents(readJournal(taskDir), { stageSlug: "build-code", workflowRunId: RUN_ID, ...auditContext() });
    expect(result.warnings).toEqual([]);
    expect(result.audit_summary).toMatchObject({
      schema_version: "v1",
      workflow_run_id: RUN_ID,
      verdict: "pass",
      requirement_coverage: { covered: 1, total: 1, withdrawn: 0, missing_ids: [] },
      facts: { missing: [], unexpected: [], duplicate: [], out_of_order: [], unknown: [], stale: [], tampered_hash: [], terminal_non_success: [], retry: [], cross_attempt: [], dependency: [] },
      evidence_refs: [
        { kind: "command", uri_or_path: "evidence/entry.log" },
        { kind: "command", uri_or_path: "evidence/exit.log" },
      ],
    });
    expect(result.audit_summary.summary_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("records a missing terminal exit as a failed audit fact", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const result = buildAuditSummaryFromJournalEvents([{ ...entryPayload(), journal_entry_id: "entry" }], { stageSlug: "build-code", workflowRunId: RUN_ID, ...auditContext() });

    expect(result.audit_summary).toMatchObject({
      verdict: "fail",
      requirement_coverage: { covered: 1, total: 1, missing_ids: [] },
      facts: { missing: [{ type: "terminal_exit_missing", step_id: 1 }] },
    });
  });

  it("records invalid legacy-shaped receipts as unknown rather than reviving legacy count semantics", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const legacyEntry = {
      event_type: "step_entry", workflow_run_id: RUN_ID, stage_slug: "build-code", step_id: 1, check_status: "ok",
    };
    const result = buildAuditSummaryFromJournalEvents([legacyEntry], { stageSlug: "build-code", workflowRunId: RUN_ID, ...auditContext() });

    expect(result.audit_summary).toMatchObject({
      verdict: "fail",
      facts: { unknown: [{ type: "invalid_entry", step_id: "bc.work.ph1" }] },
    });
  });

  it("uses manifest expectations to detect an unexpected observed attempt", async () => {
    const { buildAuditSummaryFromJournalEvents } = await import("../audit-aggregator.mjs");
    const result = buildAuditSummaryFromJournalEvents(
      [entryPayload(), exitPayload()],
      "build-code",
      RUN_ID,
      { manifest: { stage_slug: "build-code", steps: [{ step_id: 2, order: 1, attempt_id: "attempt-2", depends_on: [] }] }, ledger: auditContext().ledger },
    );

    expect(result.audit_summary).toMatchObject({
      verdict: "fail",
      facts: {
        unexpected: expect.arrayContaining([{ type: "unexpected_observed_step", step_id: 1, attempt_id: "attempt-1" }]),
        missing: expect.arrayContaining([{ type: "expected_step_missing", step_id: 2, attempt_id: "attempt-2" }]),
      },
    });
  });
});

describe("receipt schema and appender seams", () => {
  it("rejects a canonical exit whose identity is incomplete", async () => {
    const { validateExitPayload } = await import("../receipt-schema.mjs");
    expect(() => validateExitPayload(exitPayload({ timestamp: "not-a-timestamp" }))).toThrow("timestamp");
  });

  it("buildJournalEvent retains canonical timestamps and overwrites the event type", async () => {
    const { buildJournalEvent } = await import("../journal-appender.mjs");
    const event = buildJournalEvent("step_entry", entryPayload({ event_type: "step_exit" }));
    expect(event).toMatchObject({ schema_version: "v1", event_type: "step_entry", timestamp: ENTRY_TIMESTAMP });
    expect(event.journal_entry_id).toEqual(expect.any(String));
  });
});
