import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCapture } from "../workflows/build-code/capture.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const temporary = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-capture-v2-"))); temporary.push(root);
  const repo = join(root, "repo"); const worktree = join(root, "worktree"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-q", worktree, sha], { cwd: repo });
  const taskPath = join(root, "Projects", "Demo", "tasks", "capture-task");
  const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "capture-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const kernel = createTaskKernel(task);
  const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: worktree, baseline_commit: sha } });
  kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
  const context = bootstrapStage("build-code", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "capture-task" });
  return { cwd: worktree, task: context.task, workspace: context.workspace, outputPath: "receipts/capture.json" };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("build-code capture v2 boundary", () => {
  it("requires an explicit absolute Workspace cwd and parent-resolved output path", async () => {
    const { outputPath, task } = fixture();
    await expect(runCapture("true", outputPath)).rejects.toThrow(/TaskHandle|Workspace capability/i);
    await expect(runCapture("true", outputPath, { workspace: {}, task })).rejects.toThrow(/Workspace capability/i);
  });

  it("records non-zero exits as facts without throwing", async () => {
    const { outputPath, workspace, task } = fixture();
    const result = await runCapture("node -e \"process.exit(3)\"", outputPath, { workspace, task });
    expect(result).toMatchObject({ exit_code: 3, receipt_ref: outputPath });
    expect(result.snapshot_head).toMatch(/^[a-f0-9]{40}$/); expect(result.snapshot_tree).toMatch(/^[a-f0-9]{40}$/);
    expect(JSON.parse(task.readRecord(outputPath)).exit_code).toBe(3);
  });

  it("preserves failing command, stdout, stderr, hash, and red-baseline anomaly", async () => {
    const { cwd, outputPath, workspace, task } = fixture();
    const command = "node -e \"console.log('partial'); console.error('boom'); process.exit(7)\"";
    const result = await runCapture(command, outputPath, {
      workspace, task,
    });
    expect(result.command).toBe(command);
    expect(result.exit_code).toBe(7);
    expect(task.readRecord(result.output_ref)).toContain("partial");
    expect(task.readRecord(result.output_ref)).toContain("boom");
    expect(result.receipt_hash).toMatch(/^[a-f0-9]{64}$/); expect(result.output_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("writes complete stdout/stderr sidecars before the JSON fact", async () => {
    const { outputPath, workspace, task } = fixture();
    const result = await runCapture("node -e \"console.log('Test Files 1 passed'); console.error('note')\"", outputPath, { workspace, task });
    expect(task.readRecord(result.output_ref)).toContain("Test Files 1 passed");
    expect(task.readRecord(result.output_ref)).toContain("note");
    expect(task.readRecord(outputPath)).toBeTruthy();
    expect(result.receipt_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("keeps anomaly detection factual", async () => {
    const { outputPath, workspace, task } = fixture();
    const result = await runCapture("node -e \"process.exit(0)\"", outputPath, { workspace, task });
    expect(result.exit_code).toBe(0);
    expect(new Date(result.started_at).toISOString()).toBe(result.started_at);
    expect(new Date(result.completed_at).toISOString()).toBe(result.completed_at);
  });
});
