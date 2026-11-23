import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { capturePreExecutionTaskChangeScope } from "../../workflows/build-code/change-scope.mjs";
import { runCapture } from "../../workflows/build-code/capture.mjs";

const roots = [];
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const CAPTURE_COMMAND = "node --version"; // Fixed command; no discovered file or catalog path enters a shell.

// A real authenticated registered linked worktree plus the task record that owns
// it. The collector reads only this workspace; task identity is bound by callers.
function fixture(suffix = "p9") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p9-scope-")));
  roots.push(root);
  const mainRepo = join(root, "repo"), worktree = join(root, "task-worktree");
  const taskId = `${suffix}-task`, taskPath = join(root, "Projects", "Scope", "tasks", taskId);
  mkdirSync(mainRepo);
  mkdirSync(taskPath, { recursive: true });
  git(mainRepo, "init", "-q", "-b", "main");
  git(mainRepo, "config", "user.name", "Scope fixture");
  git(mainRepo, "config", "user.email", "scope@example.test");
  writeFileSync(join(mainRepo, "product.mjs"), "export const version = 0;\n");
  writeFileSync(join(mainRepo, "old-name.mjs"), "export const oldName = true;\n");
  writeFileSync(join(mainRepo, "to-delete.mjs"), "export const obsolete = true;\n");
  git(mainRepo, "add", ".");
  git(mainRepo, "commit", "-qm", "before task starts");
  const startCommit = git(mainRepo, "rev-parse", "HEAD");
  git(mainRepo, "worktree", "add", "-q", "-b", `task/Scope/${taskId}`, worktree, "HEAD");
  writeFileSync(join(taskPath, "task.json"), JSON.stringify({
    schema_version: "1.0.0", project_name: "Scope", task_id: taskId, created_at: "2026-09-29T00:00:00Z",
    target_repo_root: mainRepo, record_model: "vnext-single-write", activation_cohort: "post",
    workspace_mode: "existing", workspace_root: worktree, issue_ids: [], inputs: {},
  }));
  writeFileSync(join(taskPath, "facts.jsonl"), "");
  const task = openTask(taskPath, "Scope", taskId);
  return { root, mainRepo, worktree, task, taskPath, taskId, startCommit };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ORACLE-P9-TRUSTED-CHANGE-SCOPE — return-only task-start and repair facts", () => {
  it("finds a committed-clean change since the authenticated task start", async () => {
    const state = fixture();
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 1;\n");
    git(state.worktree, "add", "product.mjs");
    git(state.worktree, "commit", "-qm", "task implementation");
    expect(git(state.worktree, "status", "--porcelain")).toBe("");
    const scope = await capturePreExecutionTaskChangeScope({
      workspace: await openCurrentTaskWorkspace(state.task), baseline: state.startCommit, taskId: state.taskId,
    });
    expect(scope).toMatchObject({ status: "recorded", task_id: state.taskId, baseline_commit: state.startCommit });
    expect(scope.changed_paths).toContain("product.mjs");
    // The canonical receipt keeps its existing bytes/schema: only the returned
    // projection carries this fact.
    const receipt = await runCapture({ task: state.task, recordDir: state.task.recordPath("quality/tests"),
      cwd: state.worktree, slug: "p9-clean", argv: ["node", "--version"] });
    expect(receipt.receipt_ref).toMatch(/\/quality\/tests\/[^/]+-p9-clean\.json$/);
    const saved = JSON.parse(readFileSync(receipt.receipt_ref, "utf8"));
    expect(saved).toMatchObject({ exit_code: 0, argv: ["node", "--version"] });
    expect(saved).not.toHaveProperty("change_scope");
    expect(saved).not.toHaveProperty("snapshot_tree");
    expect(saved).not.toHaveProperty("snapshot_ref");
    expect(receipt).not.toHaveProperty("snapshot_tree");
    expect(receipt).not.toHaveProperty("snapshot_ref");
  });

  it("reports committed, staged, unstaged, untracked, renamed and deleted source", async () => {
    const state = fixture();
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 1;\n");
    git(state.worktree, "add", "product.mjs");
    git(state.worktree, "commit", "-qm", "first repair");
    git(state.worktree, "mv", "old-name.mjs", "renamed.mjs");
    git(state.worktree, "rm", "-q", "to-delete.mjs");
    writeFileSync(join(state.worktree, "staged.mjs"), "export const staged = true;\n");
    git(state.worktree, "add", "staged.mjs");
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 2;\n");
    writeFileSync(join(state.worktree, "untracked.mjs"), "export const untracked = true;\n");
    const scope = await capturePreExecutionTaskChangeScope({
      workspace: await openCurrentTaskWorkspace(state.task), baseline: state.startCommit, taskId: state.taskId,
    });
    expect(scope.status).toBe("recorded");
    expect(scope.changed_paths).toEqual(expect.arrayContaining([
      "product.mjs", "old-name.mjs", "renamed.mjs", "to-delete.mjs", "staged.mjs", "untracked.mjs",
    ]));
    expect(scope.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "R100", old_path: "old-name.mjs", path: "renamed.mjs" }),
      expect.objectContaining({ status: "D", path: "to-delete.mjs" }),
      expect.objectContaining({ status: "?", path: "untracked.mjs" }),
    ]));
    expect(git(state.worktree, "status", "--porcelain").split("\n").length).toBeGreaterThan(1);
  });

  it("reports unknown_change_scope when the workspace is not an authenticated task start", async () => {
    const state = fixture();
    const plain = join(state.root, "not-a-worktree");
    mkdirSync(plain);
    const scope = await capturePreExecutionTaskChangeScope({
      workspace: { worktreeRoot: plain, targetRepoRoot: plain, baselineCommit: state.startCommit, branch: null },
      baseline: state.startCommit, taskId: state.taskId,
    });
    expect(scope).toMatchObject({ status: "unknown_change_scope", task_id: state.taskId });
    expect(scope.changed_paths ?? []).not.toContain("product.mjs");
    expect(scope).not.toHaveProperty("baseline_commit");
  });

  it("does not authenticate another repository's workspace as its own task start", async () => {
    const state = fixture("p9-owner");
    const other = fixture("p9-other");
    writeFileSync(join(other.worktree, "product.mjs"), "export const version = 99;\n");
    git(other.worktree, "add", "product.mjs");
    git(other.worktree, "commit", "-qm", "other task work");
    // The other repository's real worktree is handed over as if it were this
    // task's own start; the common-repository boundary must refuse it.
    const scope = await capturePreExecutionTaskChangeScope({
      workspace: { worktreeRoot: other.worktree, targetRepoRoot: state.mainRepo,
        baselineCommit: state.startCommit, branch: `task/Scope/${state.taskId}` },
      baseline: state.startCommit, taskId: state.taskId,
    });
    expect(scope).toMatchObject({ status: "unknown_change_scope" });
    expect(scope.changed_paths ?? []).toEqual([]);
  });

  it("keeps a missing or malformed workspace an unavailable fact, never an empty range", async () => {
    const state = fixture();
    for (const workspace of [undefined, {}, { worktreeRoot: "relative/path", targetRepoRoot: state.mainRepo }]) {
      const scope = await capturePreExecutionTaskChangeScope({ workspace, baseline: state.startCommit, taskId: state.taskId });
      expect(scope).toMatchObject({ status: "unknown_change_scope", changed_paths: [] });
      expect(String(scope.reason ?? "")).not.toBe("");
    }
  });
});
