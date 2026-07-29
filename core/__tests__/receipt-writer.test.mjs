import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../task-handle.mjs";
import { writeEntryReceipt, writeExitReceipt, writeStepAutoRollback } from "../receipt-writer.mjs";

const temporary = [];
const RUN_ID = "run-123";
function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-receipts-v1-")));
  temporary.push(storageRoot);
  const taskPath = join(storageRoot, "Projects", "Demo", "tasks", "receipt-task");
  return createTask({ storageRoot, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "receipt-task",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: join(storageRoot, "repo"),
    issue_ids: [], inputs: {},
  } });
}
function entry(overrides = {}) {
  return { workflow_run_id: RUN_ID, stage_slug: "build-code", step_id: 1,
    manifest_schema_version: "2.0.0", attempt_id: "attempt-1", event_type: "step_entry",
    timestamp: "2026-07-16T00:00:00.000Z", entry_evidence: { kind: "command", uri_or_path: "evidence/entry.log" }, ...overrides };
}
function exit(entryId, overrides = {}) {
  return { workflow_run_id: RUN_ID, stage_slug: "build-code", step_id: 1,
    manifest_schema_version: "2.0.0", attempt_id: "attempt-1", event_type: "step_exit",
    timestamp: "2026-07-16T00:01:00.000Z", terminal_status: "success",
    entry_journal_entry_id: entryId, completion_evidence: { kind: "command", uri_or_path: "evidence/exit.log" }, ...overrides };
}
function journal(task) {
  return task.readRecord("journal.jsonl").trim().split("\n").map(JSON.parse);
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("receipt writer TaskHandle contract", () => {
  it("rejects caller task ids and fake handles", async () => {
    await expect(writeEntryReceipt("receipt-task", entry())).rejects.toThrow(/TaskHandle/i);
    await expect(writeEntryReceipt({}, entry())).rejects.toThrow(/TaskHandle/i);
  });

  it("appends paired entry/exit receipts through one branded TaskHandle", async () => {
    const task = fixture();
    const emitted = await writeEntryReceipt(task, entry());
    await writeExitReceipt(task, exit(emitted.journal_entry_id));
    expect(journal(task)).toEqual([
      expect.objectContaining({ event_type: "step_entry", journal_entry_id: emitted.journal_entry_id }),
      expect.objectContaining({ event_type: "step_exit", entry_journal_entry_id: emitted.journal_entry_id }),
    ]);
  });

  it("fails closed when an exit is not bound to the active entry", async () => {
    const task = fixture();
    await writeEntryReceipt(task, entry({ workflow_run_id: "run-bound" }));
    await expect(writeExitReceipt(task, exit("other-entry", { workflow_run_id: "run-bound" })))
      .rejects.toThrow(/bind/i);
  });

  it("rejects duplicate active entries for one attempt", async () => {
    const task = fixture();
    await writeEntryReceipt(task, entry({ workflow_run_id: "run-duplicate" }));
    await expect(writeEntryReceipt(task, entry({ workflow_run_id: "run-duplicate" })))
      .rejects.toThrow(/duplicate active entry/i);
  });

  it("appends rollback facts through TaskHandle without inventing a receipt pass", async () => {
    const task = fixture();
    await writeStepAutoRollback(task, { workflow_run_id: RUN_ID, affected_step_id: 1,
      rollback_from_step_id: 1, rollback_to_step_id: 1, attempt_seq: 1,
      ineffective: true, reason: "check blocked" });
    expect(journal(task)[0]).toMatchObject({ event_type: "step_auto_rollback", ineffective: true });
  });

  it("rejects a tree-B exit for a tree-A entry without a half-written exit", async () => {
    const task = fixture();
    const treeA = "a".repeat(40);
    const emitted = await writeEntryReceipt(task, entry({
      workflow_run_id: "run-snapshot-bound",
      snapshot_tree: treeA,
    }));
    await expect(writeExitReceipt(task, exit(emitted.journal_entry_id, {
      workflow_run_id: "run-snapshot-bound",
      snapshot_tree: "b".repeat(40),
    }))).rejects.toThrow(/snapshot|tree/i);
    expect(journal(task)).toEqual([
      expect.objectContaining({ event_type: "step_entry", snapshot_tree: treeA }),
    ]);
  });
});
