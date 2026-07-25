import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCapture } from "../workflows/build-code/capture.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { openAcceptedWorkspace } from "../core/workspace.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const temporary = [];
const taskHandleModule = new URL("../core/task-handle.mjs", import.meta.url).pathname;
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-capture-v2-"))); temporary.push(root);
  const repo = join(root, "repo"); const worktree = join(root, "repo-capture-task"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-q", "-b", "task/Demo/capture-task", worktree, sha], { cwd: repo });
  const taskPath = join(root, "Projects", "Demo", "tasks", "capture-task");
  const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "capture-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const kernel = createTaskKernel(task);
  const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: worktree, baseline_commit: sha } });
  kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  return { root, taskPath, cwd: worktree, task, workspace, outputPath: "receipts/capture.json" };
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

  it("runs the official test subprocess in the accepted Workspace", async () => {
    const { cwd, outputPath, workspace, task } = fixture();
    const result = await runCapture("node -e \"console.log(process.cwd())\"", outputPath, { workspace, task });
    expect(result.exit_code).toBe(0);
    expect(task.readRecord(result.output_ref)).toContain(realpathSync(cwd));
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

  it("reuses the same current receipt instead of rerunning the complete test command", async () => {
    const { root, outputPath, workspace, task } = fixture();
    const marker = join(root, "capture-count.txt");
    const command = `node -e \"require('node:fs').appendFileSync(process.argv[1], 'run\\n')\" ${JSON.stringify(marker)}`;
    const first = await runCapture(command, outputPath, { workspace, task });
    const second = await runCapture(command, outputPath, { workspace, task });
    expect(second).toEqual(first);
    expect(readFileSync(marker, "utf8")).toBe("run\n");
  });

  it("rejects a conflicting capture request for an existing receipt", async () => {
    const { outputPath, workspace, task } = fixture();
    await runCapture("true", outputPath, { workspace, task });
    await expect(runCapture("false", outputPath, { workspace, task })).rejects.toThrow(/conflicts with requested capture/);
  });

  it("does not start a second capture while this task lock is held", async () => {
    const { root, taskPath, outputPath, workspace, task } = fixture();
    const marker = join(root, "capture-ran.txt");
    const holder = [
      `import { existsSync } from "node:fs";`,
      `import { openTask } from ${JSON.stringify(taskHandleModule)};`,
      `const task = openTask(${JSON.stringify(taskPath)}, "Demo", "capture-task");`,
      `await task.withRecordLock("locks/test-capture.execution.lock", async () => {`,
      `  process.stdout.write("locked\\n");`,
      `  await new Promise((resolve) => setTimeout(resolve, 300));`,
      `  process.stdout.write(existsSync(${JSON.stringify(marker)}) ? "ran-early\\n" : "clear\\n");`,
      `});`,
    ].join("\n");
    const child = spawn(process.execPath, ["--input-type=module", "-e", holder], { stdio: ["ignore", "pipe", "inherit"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    await new Promise((resolveStarted, reject) => {
      child.stdout.once("data", resolveStarted);
      child.once("error", reject);
      child.once("exit", (status) => reject(new Error(`lock holder exited before ready: ${status}`)));
    });
    const exited = new Promise((resolveExited, reject) => {
      child.once("error", reject);
      child.once("exit", (status) => status === 0 ? resolveExited() : reject(new Error(`lock holder exited ${status}`)));
    });
    const result = await runCapture(`node -e \"require('node:fs').writeFileSync(process.argv[1], 'ran')\" ${JSON.stringify(marker)}`, outputPath, { workspace, task });
    await exited;
    expect(result.exit_code).toBe(0);
    expect(output).toContain("clear");
    expect(readFileSync(marker, "utf8")).toBe("ran");
  });

  it("rejects a reused receipt when its recorded output was tampered", async () => {
    const { outputPath, workspace, task } = fixture();
    const first = await runCapture("true", outputPath, { workspace, task });
    writeFileSync(task.recordPath(first.output_ref), "tampered");
    await expect(runCapture("true", outputPath, { workspace, task })).rejects.toThrow(/missing or tampered/);
  });
});
