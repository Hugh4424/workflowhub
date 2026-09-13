import { existsSync, mkdirSync, mkdtempSync, realpathSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { openAcceptedWorkspace } from "../../runtime/task/workspace.mjs";

const temporary = [];

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-capture-reuse-")));
  temporary.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "repo-capture-task");
  mkdirSync(repo);
  const git = (args, cwd = repo) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
  git(["init", "-q"]);
  git(["config", "user.email", "test@example.com"]);
  git(["config", "user.name", "Test"]);
  writeFileSync(join(repo, "tracked.txt"), "base\n");
  git(["add", "tracked.txt"]);
  git(["commit", "-qm", "base"]);
  const baseline = git(["rev-parse", "HEAD"]);
  git(["worktree", "add", "-q", "-b", "task/Demo/capture-task", worktree, baseline]);
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0",
    project_name: "Demo",
    task_id: "capture-task",
    created_at: new Date().toISOString(),
    target_repo_root: repo,
    issue_ids: [],
    inputs: {},
  } });
  const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: worktree, baseline_commit: baseline } });
  return { root, task, workspace };
}

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("canonical test capture reuse", () => {
  it("reads a completed receipt instead of starting a second command", () => {
    const { task, workspace, root } = fixture();
    const marker = join(root, "started-once");
    const command = `if [ -e ${JSON.stringify(marker)} ]; then exit 99; else touch ${JSON.stringify(marker)}; printf reuse; fi`;
    const writer = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "build-code-test-capture" });
    const first = writer.captureTests({
      command,
      receiptRef: "quality/tests/capture-reuse.json",
      outputRef: "quality/tests/output/capture-reuse",
    });
    const second = writer.captureTests({
      command,
      receiptRef: "quality/tests/capture-reuse-second.json",
      outputRef: "quality/tests/output/capture-reuse-second",
    });
    expect(first.exit_code).toBe(0);
    expect(second).toMatchObject({
      dispatch_state: "reused",
      receipt_ref: first.receipt_ref,
      output_ref: first.output_ref,
      exit_code: 0,
    });
    expect(second.receipt_hash).toBe(first.receipt_hash);
    expect(task.readRecord(second.output_ref)).toContain("reuse");
    expect(existsSync(marker)).toBe(true);
  });

  it("persists timeout output and receipt for authenticated readback", () => {
    const { task, workspace } = fixture();
    const result = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "capture-timeout" }).captureTests({
      command: "printf partial; sleep 1",
      receiptRef: "quality/tests/capture-timeout.json",
      outputRef: "quality/tests/output/capture-timeout",
      timeoutMs: 25,
    });
    expect(result).toMatchObject({
      exit_code: 124,
      execution: { status: "timed_out", timeout_ms: 25 },
      failure_attribution: { status: "failed", category: "test_timeout", code: "TEST_CAPTURE_TIMEOUT" },
    });
    expect(task.readRecord(result.output_ref)).toContain("partial");
    expect(task.readRecord(result.receipt_ref)).toContain('"output_ref": "quality/tests/output/capture-timeout"');
  });
});
