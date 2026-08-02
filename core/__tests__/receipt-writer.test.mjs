import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask, createTaskKernel } from "../task-handle.mjs";
import {
  authenticateAuditRetryEvidence,
  buildAuditSummaryFromJournalEvents,
} from "../audit-aggregator.mjs";
import { computeLedgerHash, computeRequirementContentHash } from "../../runtime/evidence/requirement-ledger.mjs";
import { writeEntryReceipt, writeExitReceipt, writeStepAutoRollback } from "../../runtime/evidence/receipt-writer.mjs";

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
function coveredLedger() {
  const requirement = {
    requirement_id: "R1",
    status: "accepted",
    source_ref: { kind: "source", uri_or_path: "source://R1", content_hash: "a".repeat(64) },
    decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
    artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
    acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
    upstream_hashes: ["a".repeat(64)],
    stale: false,
  };
  requirement.content_hash = computeRequirementContentHash(requirement);
  const ledger = { schema_version: "v1", source_manifest_hash: "e".repeat(64), requirements: [requirement] };
  ledger.ledger_hash = computeLedgerHash(ledger);
  return ledger;
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

  it("keeps the same derived attempt id independent across different steps", async () => {
    const task = fixture();
    const stepOne = await writeEntryReceipt(task, entry({
      workflow_run_id: "run-step-scoped",
      step_id: 1,
      attempt_id: "attempt-1",
    }));
    const stepTwo = await writeEntryReceipt(task, entry({
      workflow_run_id: "run-step-scoped",
      step_id: 2,
      attempt_id: "attempt-1",
    }));
    await writeExitReceipt(task, exit(stepOne.journal_entry_id, {
      workflow_run_id: "run-step-scoped",
      step_id: 1,
      attempt_id: "attempt-1",
    }));
    await writeExitReceipt(task, exit(stepTwo.journal_entry_id, {
      workflow_run_id: "run-step-scoped",
      step_id: 2,
      attempt_id: "attempt-1",
    }));
    expect(journal(task).filter(({ event_type }) => event_type === "step_exit")
      .map(({ step_id, attempt_id }) => [step_id, attempt_id])).toEqual([
      [1, "attempt-1"],
      [2, "attempt-1"],
    ]);
  });

  it("does not fail an audit for a kernel-derived retry of a failed target step", () => {
    const task = fixture();
    const kernel = createTaskKernel(task);
    const run = kernel.startStageRun("build-spec", { reason: "retry the target step" }).run;
    const first = kernel.writeStageStepEntry("build-spec", {
      step_id: 1,
      entry_evidence: { kind: "test", uri_or_path: "evidence/red" },
    });
    kernel.writeStageStepExit("build-spec", {
      step_id: 1,
      entry_journal_entry_id: first.journal_entry_id,
      terminal_status: "failure",
      completion_evidence: { kind: "test", uri_or_path: "evidence/failed" },
    });
    const retry = kernel.writeStageStepEntry("build-spec", {
      step_id: 1,
      entry_evidence: { kind: "test", uri_or_path: "evidence/retry" },
    });
    kernel.writeStageStepExit("build-spec", {
      step_id: 1,
      entry_journal_entry_id: retry.journal_entry_id,
      terminal_status: "success",
      completion_evidence: { kind: "test", uri_or_path: "evidence/green" },
    });
    const allEvents = journal(task);
    const previousEvents = allEvents.filter(({ step_id, attempt_id }) =>
      step_id === 1 && attempt_id === "attempt-1");
    const retryEvents = allEvents.filter(({ step_id, attempt_id }) =>
      step_id === 1 && attempt_id === "attempt-2");
    const authenticatedRetry = authenticateAuditRetryEvidence({
      task,
      stageSlug: "build-spec",
      workflowRunId: run.workflow_run_id,
      retryEvent: retryEvents.find(({ event_type }) => event_type === "step_entry"),
      previousEvents,
    });
    const context = {
      task_id: task.identity.taskId,
      manifest: {
        schema_version: "2.0.0",
        stage_slug: "build-spec",
        manifest_hash: "f".repeat(64),
        steps: [{ step_id: 1, order: 1, depends_on: [] }],
      },
      ledger: coveredLedger(),
      authenticated_retries: [authenticatedRetry],
    };
    const summary = buildAuditSummaryFromJournalEvents(
      retryEvents,
      "build-spec",
      run.workflow_run_id,
      context,
    ).audit_summary;

    expect(summary.verdict).toBe("pass");
    expect(summary.expected_steps).toContainEqual(expect.objectContaining({
      step_id: 1,
      attempt_id: "attempt-2",
    }));

    const forged = buildAuditSummaryFromJournalEvents(
      retryEvents,
      "build-spec",
      run.workflow_run_id,
      { ...context, authenticated_retries: [structuredClone(authenticatedRetry)] },
    ).audit_summary;
    expect(forged.verdict).toBe("fail");
    expect(forged.facts.retry).toContainEqual(expect.objectContaining({
      type: "UNAUTHENTICATED_RETRY",
      step_id: 1,
      attempt_id: "attempt-2",
    }));

    const tamperedEvents = structuredClone(retryEvents);
    tamperedEvents.find(({ event_type }) => event_type === "step_entry").entry_evidence.uri_or_path = "evidence/forged";
    expect(buildAuditSummaryFromJournalEvents(
      tamperedEvents,
      "build-spec",
      run.workflow_run_id,
      context,
    ).audit_summary.verdict).toBe("fail");
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
