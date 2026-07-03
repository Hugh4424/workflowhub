import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TASK_ID = "receipt-writer-test";

function makeTaskDir() {
  return mkdtempSync(join(tmpdir(), "workflowhub-receipts-"));
}

async function importWriter(taskDir, fsMock) {
  vi.resetModules();
  vi.doMock("../task-dir-parser.mjs", () => ({
    parseTaskDir: () => taskDir,
  }));
  if (fsMock) {
    vi.doMock("node:fs/promises", () => fsMock);
  }
  return import("../receipt-writer.mjs");
}

function validEntryPayload(overrides = {}) {
  return {
    step_id: "bc.work.ph1",
    stage_slug: "bc",
    step_type: "work",
    step_seq: 1,
    check_status: "ok",
    prev_step_id: null,
    next_step_id: null,
    writer_namespace: "build-code",
    workflow_run_id: "run-123",
    ...overrides,
  };
}

function validExitPayload(overrides = {}) {
  return {
    step_id: "bc.work.ph1",
    workflow_run_id: "run-123",
    verdict: "passed",
    executor_namespace: "coder",
    prev_step_id: null,
    next_step_id: null,
    review: {
      skill: "3rd-review",
      executed: true,
      source: "third_party",
      provider: "codex",
      true_cross_engine: true,
      verdict: "passed",
      round: 1,
      report_path: "/tmp/report.md",
      raw_result_path: "/tmp/raw.json",
      fix_status: "not_required",
    },
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../task-dir-parser.mjs");
  vi.doUnmock("node:fs/promises");
});

describe("journal schema", () => {
  it("defines v1 journal event types including step and existing stage events", async () => {
    const { AUDIT_SUMMARY_FIELDS, JOURNAL_SCHEMA_VERSION, JOURNAL_EVENT_TYPES, STEP_AUTO_ROLLBACK_REQUIRED_FIELDS } =
      await import("../journal-schema.mjs");

    expect(JOURNAL_SCHEMA_VERSION).toBe("v1");
    expect(JOURNAL_EVENT_TYPES.STEP_ENTRY).toBe("step_entry");
    expect(JOURNAL_EVENT_TYPES.STEP_EXIT).toBe("step_exit");
    expect(JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK).toBe("step_auto_rollback");
    expect(JOURNAL_EVENT_TYPES.STAGE_ENTER).toBe("stage_enter");
    expect(JOURNAL_EVENT_TYPES.STAGE_EXIT).toBe("stage_exit");
    expect(STEP_AUTO_ROLLBACK_REQUIRED_FIELDS).toEqual([
      "workflow_run_id",
      "affected_step_id",
      "rollback_from_step_id",
      "rollback_to_step_id",
      "attempt_seq",
      "ineffective",
      "reason",
    ]);
    expect(AUDIT_SUMMARY_FIELDS).toEqual([
      "total_step_count",
      "passed_step_count",
      "blocked_step_count",
      "skipped_step_count",
      "rollback_count",
    ]);
  });
});

describe("receipt writer", () => {
  it("writeEntryReceipt appends a step_entry event to the task journal", async () => {
    const taskDir = makeTaskDir();
    const { writeEntryReceipt } = await importWriter(taskDir);

    await writeEntryReceipt(TASK_ID, validEntryPayload());

    const journal = readFileSync(join(taskDir, TASK_ID, "journal.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({
      schema_version: "v1",
      event_type: "step_entry",
      step_id: "bc.work.ph1",
      check_status: "ok",
      workflow_run_id: "run-123",
    });
  });

  it("writeEntryReceipt is fail-closed when the journal append fails", async () => {
    const appendFile = vi.fn(async () => {
      throw new Error("append failed");
    });
    const mkdir = vi.fn(async () => {});
    const { writeEntryReceipt } = await importWriter(makeTaskDir(), { appendFile, mkdir });

    await expect(writeEntryReceipt(TASK_ID, validEntryPayload())).rejects.toThrow("append failed");
  });

  it("writeExitReceipt is warn-only when the step_exit append fails", async () => {
    const appendFile = vi
      .fn()
      .mockRejectedValueOnce(new Error("exit append failed"))
      .mockResolvedValueOnce(undefined);
    const mkdir = vi.fn(async () => {});
    const { writeExitReceipt } = await importWriter(makeTaskDir(), { appendFile, mkdir });

    await expect(writeExitReceipt(TASK_ID, validExitPayload())).resolves.toBeUndefined();
    expect(appendFile).toHaveBeenCalledTimes(2);
    expect(appendFile.mock.calls[1][1]).toContain('"event":"receipt_write_warn"');
    expect(appendFile.mock.calls[1][1]).toContain("exit append failed");
  });

  it("rejects invalid step_id values", async () => {
    const { writeEntryReceipt } = await importWriter(makeTaskDir());

    await expect(
      writeEntryReceipt(TASK_ID, validEntryPayload({ step_id: "bad.step" })),
    ).rejects.toThrow("step_id");
  });

  it("rejects entry receipts whose stage_slug or step_type disagree with step_id", async () => {
    const { writeEntryReceipt } = await importWriter(makeTaskDir());

    await expect(writeEntryReceipt(TASK_ID, validEntryPayload({ stage_slug: "bp" }))).rejects.toThrow("stage_slug");
    await expect(writeEntryReceipt(TASK_ID, validEntryPayload({ step_type: "check" }))).rejects.toThrow("step_type");
  });

  it("rejects invalid check_status values", async () => {
    const { writeEntryReceipt } = await importWriter(makeTaskDir());

    await expect(
      writeEntryReceipt(TASK_ID, validEntryPayload({ check_status: "maybe" })),
    ).rejects.toThrow("check_status");
  });

  it("requires authorized_by when entry check_status is skipped", async () => {
    const { writeEntryReceipt } = await importWriter(makeTaskDir());

    await expect(
      writeEntryReceipt(
        TASK_ID,
        validEntryPayload({
          check_status: "skipped",
          skip_reason: "human approved skip",
        }),
      ),
    ).rejects.toThrow("authorized_by");
  });

  it("validates optional blocked entry judgement payloads", async () => {
    const { writeEntryReceipt } = await importWriter(makeTaskDir());

    await expect(
      writeEntryReceipt(
        TASK_ID,
        validEntryPayload({
          check_status: "blocked",
          judgement: {
            status: "blocked",
            reason: "missing upstream",
            retry_eligible: true,
          },
        }),
      ),
    ).resolves.toBeUndefined();

    await expect(
      writeEntryReceipt(
        TASK_ID,
        validEntryPayload({
          check_status: "blocked",
          judgement: {
            status: "blocked",
            reason: "missing upstream",
          },
        }),
      ),
    ).rejects.toThrow("judgement.retry_eligible");
  });

  it("requires workflow_run_id on exit receipts", async () => {
    const { writeExitReceipt } = await importWriter(makeTaskDir());
    const { workflow_run_id, ...payloadWithoutRunId } = validExitPayload();

    await expect(writeExitReceipt(TASK_ID, payloadWithoutRunId)).rejects.toThrow("workflow_run_id");
  });

  it("writeStepAutoRollback validates and appends runner-owned rollback events", async () => {
    const taskDir = makeTaskDir();
    const { writeStepAutoRollback } = await importWriter(taskDir);

    await writeStepAutoRollback(TASK_ID, {
      workflow_run_id: "run-123",
      affected_step_id: "bc.check.ph1",
      rollback_from_step_id: "bc.check.ph1",
      rollback_to_step_id: "bc.work.ph1",
      attempt_seq: 1,
      ineffective: true,
      reason: "check blocked",
    });

    const journal = readFileSync(join(taskDir, TASK_ID, "journal.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(journal[0]).toMatchObject({
      event_type: "step_auto_rollback",
      workflow_run_id: "run-123",
      affected_step_id: "bc.check.ph1",
      rollback_from_step_id: "bc.check.ph1",
      rollback_to_step_id: "bc.work.ph1",
      attempt_seq: 1,
      ineffective: true,
    });
  });

  it("rejects incomplete step_auto_rollback payloads", async () => {
    const { writeStepAutoRollback } = await importWriter(makeTaskDir());

    await expect(
      writeStepAutoRollback(TASK_ID, {
        workflow_run_id: "run-123",
        affected_step_id: "bc.check.ph1",
        rollback_from_step_id: "bc.check.ph1",
        attempt_seq: 1,
        ineffective: true,
        reason: "check blocked",
      }),
    ).rejects.toThrow("rollback_to_step_id");
  });

  it("accepts extended build-code phase step ids across receipts and audit summary", async () => {
    const taskDir = makeTaskDir();
    const { buildAuditSummaryFromJournalEvents, writeEntryReceipt, writeExitReceipt, writeStepAutoRollback } =
      await importWriter(taskDir);

    await writeEntryReceipt(
      TASK_ID,
      validEntryPayload({
        step_id: "bc.work.ph3.2",
        step_seq: 2,
        prev_step_id: null,
        next_step_id: "bc.check.ph3.2",
      }),
    );
    await writeExitReceipt(
      TASK_ID,
      validExitPayload({
        step_id: "bc.work.ph3.2",
        prev_step_id: null,
        next_step_id: "bc.check.ph3.2",
      }),
    );
    await writeEntryReceipt(
      TASK_ID,
      validEntryPayload({
        step_id: "bc.check.ph3.2",
        step_type: "check",
        step_seq: 3,
        check_status: "blocked",
        prev_step_id: "bc.work.ph3.2",
        next_step_id: null,
      }),
    );
    await writeStepAutoRollback(TASK_ID, {
      workflow_run_id: "run-123",
      affected_step_id: "bc.check.ph3.2",
      rollback_from_step_id: "bc.check.ph3.2",
      rollback_to_step_id: "bc.work.ph3.2",
      attempt_seq: 1,
      ineffective: true,
      reason: "check blocked",
    });

    const journal = readFileSync(join(taskDir, TASK_ID, "journal.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(buildAuditSummaryFromJournalEvents(journal, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 2,
        passed_step_count: 1,
        blocked_step_count: 1,
        skipped_step_count: 0,
        rollback_count: 1,
      },
      warnings: [],
    });
  });

  it("buildAuditSummaryFromJournalEvents merges entries, exits, and stage-local rollback events deterministically", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_exit",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        verdict: "passed",
        prev_step_id: null,
        next_step_id: "bc.check.ph1",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "blocked",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
      {
        event_type: "step_auto_rollback",
        workflow_run_id: "run-123",
        affected_step_id: "bc.check.ph1",
        rollback_from_step_id: "bc.check.ph1",
        rollback_to_step_id: "bc.work.ph1",
        attempt_seq: 1,
        ineffective: true,
        reason: "check blocked",
      },
      {
        event_type: "step_auto_rollback",
        workflow_run_id: "run-123",
        affected_step_id: "bp.check.1",
        rollback_from_step_id: "bp.check.1",
        rollback_to_step_id: "bp.work.1",
        attempt_seq: 1,
        ineffective: true,
        reason: "other stage",
      },
      {
        event_type: "step_auto_rollback",
        workflow_run_id: "run-123",
        affected_step_id: "bc.check.ph1",
        rollback_from_step_id: "bp.check.1",
        rollback_to_step_id: "bc.work.ph1",
        attempt_seq: 1,
        ineffective: true,
        reason: "cross-stage rollback_from",
      },
      {
        event_type: "step_auto_rollback",
        workflow_run_id: "run-123",
        affected_step_id: "bc.check.ph1",
        rollback_from_step_id: "bc.check.ph1",
        rollback_to_step_id: "bp.work.1",
        attempt_seq: 1,
        ineffective: true,
        reason: "cross-stage rollback_to",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-456",
        step_id: "bc.work.ph1",
        check_status: "skipped",
        prev_step_id: null,
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 2,
        passed_step_count: 1,
        blocked_step_count: 1,
        skipped_step_count: 0,
        rollback_count: 3,
      },
      warnings: [
        "rollback_pointer_outside_chain:bc.check.ph1",
        "rollback_pointer_outside_chain:bc.check.ph1",
      ],
    });
  });

  it("uses the latest reachable entry for final skipped counts across retries", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "skipped",
        authorized_by: "lead",
        skip_reason: "initial skip",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 1,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["duplicate_chain_heads"],
    });
  });

  it("uses journal-order topology instead of retry-updated pointers", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: "bc.check.ph1",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: "bc.review.ph1",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "blocked",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.review.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 2,
        passed_step_count: 0,
        blocked_step_count: 1,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["duplicate_chain_heads"],
    });
  });

  it("uses the selected journal occurrence when an earlier duplicate was not the head", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "blocked",
        prev_step_id: "bc.review.ph1",
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: "bc.check.ph1",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 2,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: [],
    });
  });

  it("warns when duplicate head occurrences reuse the same step_id", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "blocked",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: "bc.check.ph1",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 2,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["duplicate_chain_heads"],
    });
  });

  it("ignores rollback events whose affected step is outside the discovered local pointer chain", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_auto_rollback",
        workflow_run_id: "run-123",
        affected_step_id: "bc.check.ph1",
        rollback_from_step_id: "bc.check.ph1",
        rollback_to_step_id: "bc.work.ph1",
        attempt_seq: 1,
        ineffective: true,
        reason: "blocked check",
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 1,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: [],
    });
  });

  it("stops with a warning when an exit receipt omits next_step_id", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_exit",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        verdict: "passed",
        prev_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 1,
        passed_step_count: 1,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["missing_exit_next_step_id:bc.work.ph1"],
    });
  });

  it("stops with a warning when an entry receipt omits next_step_id", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 1,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["missing_entry_next_step_id:bc.work.ph1"],
    });
  });

  it("deduplicates retried next entries by step_id during chain traversal", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "blocked",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
      {
        event_type: "step_auto_rollback",
        workflow_run_id: "run-123",
        affected_step_id: "bc.check.ph1",
        rollback_from_step_id: "bc.check.ph1",
        rollback_to_step_id: "bc.work.ph1",
        attempt_seq: 1,
        ineffective: true,
        reason: "retry check",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: "bc.review.ph1",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.review.ph1",
        check_status: "ok",
        prev_step_id: "bc.check.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 3,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 1,
      },
      warnings: [],
    });
  });

  it("uses the first journal-order head and warns on distinct duplicate heads", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph2",
        check_status: "blocked",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 2,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["duplicate_chain_heads"],
    });
  });

  it("warns on multiple distinct fallback next candidates without treating retries as duplicates", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "blocked",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.review.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 1,
        passed_step_count: 0,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["duplicate_next:bc.work.ph1"],
    });
  });

  it("treats exit next_step_id null as authoritative over stale entry next_step_id", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: "bc.check.ph1",
      },
      {
        event_type: "step_exit",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        verdict: "passed",
        prev_step_id: null,
        next_step_id: null,
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 1,
        passed_step_count: 1,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: ["pointer_mismatch:bc.work.ph1"],
    });
  });

  it("regression fix-1: same step_id two exits different next_step_id uses first exit for topology, not latest", async () => {
    const { buildAuditSummaryFromJournalEvents } = await importWriter(makeTaskDir());
    const events = [
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        check_status: "ok",
        prev_step_id: null,
        next_step_id: "bc.check.ph1",
      },
      {
        event_type: "step_exit",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        verdict: "passed",
        prev_step_id: null,
        next_step_id: "bc.check.ph1",
      },
      {
        event_type: "step_exit",
        workflow_run_id: "run-123",
        step_id: "bc.work.ph1",
        verdict: "passed",
        prev_step_id: null,
        next_step_id: "bc.review.ph1",
      },
      {
        event_type: "step_entry",
        workflow_run_id: "run-123",
        step_id: "bc.check.ph1",
        check_status: "ok",
        prev_step_id: "bc.work.ph1",
        next_step_id: null,
      },
    ];

    expect(buildAuditSummaryFromJournalEvents(events, { stageSlug: "bc", workflowRunId: "run-123" })).toEqual({
      audit_summary: {
        total_step_count: 2,
        passed_step_count: 1,
        blocked_step_count: 0,
        skipped_step_count: 0,
        rollback_count: 0,
      },
      warnings: [],
    });
  });

  it("regression fix-4: writeExitReceipt accepts review verdict escalate_to_human", async () => {
    const { writeExitReceipt } = await importWriter(makeTaskDir());
    const payload = validExitPayload({
      review: {
        skill: "3rd-review",
        executed: true,
        source: "third_party",
        provider: "codex",
        true_cross_engine: true,
        verdict: "escalate_to_human",
        round: 1,
        report_path: "/tmp/report.md",
        raw_result_path: "/tmp/raw.json",
        fix_status: "pending",
      },
    });
    await expect(writeExitReceipt(TASK_ID, payload)).resolves.toBeUndefined();
  });
});
