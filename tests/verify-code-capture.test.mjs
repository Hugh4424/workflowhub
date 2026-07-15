import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapStage } from "../core/stage-context.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";
import { runCapture } from "../workflows/verify-code/capture.mjs";

const temporary = []; const STUB_SHA = "0".repeat(40);
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "verify-capture-v2-"))); temporary.push(root);
  const repo = join(root, "repo"), worktree = join(root, "worktree"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo }); execFileSync("git", ["config", "user.email", "t@e.co"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "T"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-q", worktree, sha], { cwd: repo });
  const recordRoot = join(root, "Projects", "Demo", "tasks", "verify-task");
  const task = createTask({ storageRoot: root, taskPath: recordRoot, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "verify-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const kernel = createTaskKernel(task); const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: worktree, baseline_commit: sha } }); kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
  const context = bootstrapStage("verify-code", { mode: "sidecar", taskPath: recordRoot, projectName: "Demo", taskId: "verify-task" });
  let n = 0; return { ...context, cwd: worktree, sha, ref: () => `receipts/capture-${++n}.json` };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });
async function capture(ctx, command, opts = {}) { return runCapture(command, ctx.ref(), { workspace: ctx.workspace, task: ctx.task, gitSha: STUB_SHA, ...opts }); }

describe("verify-code capture v2", () => {
  it("returns all canonical receipt keys", async () => { const r = await capture(fixture(), "echo hello"); for (const k of ["schema_version","task_id","stage","producer","exit_code","command","command_hash","snapshot_head","snapshot_tree","started_at","completed_at","output_ref","output_hash","receipt_ref","receipt_hash"]) expect(r).toHaveProperty(k); });
  it("records integer zero exit", async () => { const r = await capture(fixture(), "true"); expect(Number.isInteger(r.exit_code)).toBe(true); expect(r.exit_code).toBe(0); });
  it("records nonzero exit", async () => { expect((await capture(fixture(), "exit 42")).exit_code).toBe(42); });
  it("persists JSON even on failure", async () => { const c = fixture(), ref = c.ref(); await runCapture("exit 1", ref, { workspace:c.workspace, task:c.task, gitSha:STUB_SHA }); expect(JSON.parse(c.task.readRecord(ref))).toMatchObject({ exit_code:1, command:"exit 1" }); });
  it("persists complete stdout and stderr output", async () => { const c=fixture(), r=await capture(c, `node -e "process.stdout.write('out');process.stderr.write('err')"`), output=c.task.readRecord(r.output_ref); expect(output).toContain("out"); expect(output).toContain("err"); });
  it("creates nested record directories", async () => { const c=fixture(), ref="receipts/nested/deep/out.json"; await runCapture("true",ref,{workspace:c.workspace,task:c.task,gitSha:STUB_SHA}); expect(JSON.parse(c.task.readRecord(ref)).exit_code).toBe(0); });
  it("hashes command, output, and receipt", async () => { const r=await capture(fixture(),"echo same"); for(const key of ["command_hash","output_hash","receipt_hash"]) expect(r[key]).toMatch(/^[a-f0-9]{64}$/); });
  it("preserves Test Files stdout in authenticated output", async () => { const c=fixture(),r=await capture(c, `printf 'Test Files  1 passed (1)\n'`); expect(c.task.readRecord(r.output_ref)).toContain("Test Files  1 passed (1)"); });
  it("preserves failing Test Files stderr in authenticated output", async () => { const c=fixture(),r=await capture(c, `node -e "console.error('Test Files  1 failed (1)');process.exit(1)"`); expect(c.task.readRecord(r.output_ref)).toContain("Test Files  1 failed (1)"); expect(r.exit_code).toBe(1); });
  it("preserves successful stderr in authenticated output", async () => { const c=fixture(),r=await capture(c, `node -e "console.error('Test Files  1 passed (1)')"`); expect(c.task.readRecord(r.output_ref)).toContain("Test Files  1 passed (1)"); expect(r.exit_code).toBe(0); });
  it("preserves output even without framework summary", async () => { const c=fixture(),r=await capture(c,"echo none"); expect(c.task.readRecord(r.output_ref)).toContain("none"); });
  it("reads snapshot head from Workspace", async () => { const c=fixture(), r=await runCapture("true",c.ref(),{workspace:c.workspace,task:c.task}); expect(r.snapshot_head).toBe(c.sha); });
  it("does not accept a caller snapshot override", async () => { const c=fixture(),r=await capture(c,"true",{gitSha:"a".repeat(40)}); expect(r.snapshot_head).toBe(c.sha); });
  it("rejects unauthentic Workspace before git discovery", async () => { const c=fixture(); await expect(runCapture("true",c.ref(),{workspace:{},task:c.task})).rejects.toThrow(/Workspace capability/); });
  it("emits ISO timestamps", async () => { const r=await capture(fixture(),"true"); expect(new Date(r.started_at).toISOString()).toBe(r.started_at); expect(new Date(r.completed_at).toISOString()).toBe(r.completed_at); });
  it("preserves exact command", async () => { const command="echo exact"; expect((await capture(fixture(),command)).command).toBe(command); });
  it("rejects a naked caller output path", async () => { const c=fixture(); await expect(runCapture("true","/tmp/out.json",{workspace:c.workspace,task:c.task,gitSha:STUB_SHA})).rejects.toThrow(/namespace|relative|escape|absolute/i); });
  it("rejects an unauthentic TaskHandle", async () => { const c=fixture(); await expect(runCapture("true",c.ref(),{workspace:c.workspace,task:{},gitSha:STUB_SHA})).rejects.toThrow(/TaskHandle|capability/i); });
});
