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
    const { JOURNAL_SCHEMA_VERSION, JOURNAL_EVENT_TYPES } = await import("../journal-schema.mjs");

    expect(JOURNAL_SCHEMA_VERSION).toBe("v1");
    expect(JOURNAL_EVENT_TYPES.STEP_ENTRY).toBe("step_entry");
    expect(JOURNAL_EVENT_TYPES.STEP_EXIT).toBe("step_exit");
    expect(JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK).toBe("step_auto_rollback");
    expect(JOURNAL_EVENT_TYPES.STAGE_ENTER).toBe("stage_enter");
    expect(JOURNAL_EVENT_TYPES.STAGE_EXIT).toBe("stage_exit");
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

  it("rejects invalid check_status values", async () => {
    const { writeEntryReceipt } = await importWriter(makeTaskDir());

    await expect(
      writeEntryReceipt(TASK_ID, validEntryPayload({ check_status: "maybe" })),
    ).rejects.toThrow("check_status");
  });
});
