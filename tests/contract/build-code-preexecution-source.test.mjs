import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { canonical, sha256 } from "../../runtime/evidence/canonical-utils.mjs";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runCapture } from "../../workflows/build-code/capture.mjs";
import * as changeScope from "../../workflows/build-code/change-scope.mjs";

const roots = [];
const git = (cwd, ...args) => execFileSync("git", args, {
  cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
}).trim();

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p9-preexecution-")));
  roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Pre-execution fixture");
  git(repo, "config", "user.email", "preexecution@example.test");
  writeFileSync(join(repo, "product.mjs"), "export const version = 0;\n");
  writeFileSync(join(repo, "old-name.mjs"), "export const oldName = true;\n");
  writeFileSync(join(repo, "to-delete.mjs"), "export const obsolete = true;\n");
  git(repo, "add", "."); git(repo, "commit", "-qm", "before task starts");
  const startCommit = git(repo, "rev-parse", "HEAD");
  const startTree = git(repo, "rev-parse", "HEAD^{tree}");
  const bootstrapped = bootstrapTask({ project: "Preexecution", task: "p9-preexecution", "target-repo": repo }, {
    env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo,
  });
  const task = openTask(bootstrapped.task_path, "Preexecution", "p9-preexecution");
  const worktree = bootstrapped.workspace.worktree_root;
  return { root, repo, storage, task, worktree, startCommit, startTree };
}

function beforeTests(task, workspace = openCurrentTaskWorkspace(task)) {
  expect(changeScope.capturePreExecutionTaskChangeScope,
    "ORACLE-P9-PREEXECUTION: authenticated change source must exist before a test receipt").toBeTypeOf("function");
  return changeScope.capturePreExecutionTaskChangeScope({ task, workspace });
}

function taskStoreBytes(root) {
  const files = [];
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else files.push([path.slice(root.length + 1), readFileSync(path).toString("base64")]);
    }
  }
  visit(root);
  return files.sort(([left], [right]) => left.localeCompare(right));
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ORACLE-P9-PREEXECUTION: current change source before test capture", () => {
  it("finds committed product changes in a clean worktree without changing Task store bytes", () => {
    const state = fixture();
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 3;\n");
    git(state.worktree, "add", "product.mjs");
    git(state.worktree, "commit", "-qm", "clean committed product change");
    expect(git(state.worktree, "status", "--porcelain")).toBe("");
    const before = taskStoreBytes(state.task.taskPath);
    const scope = beforeTests(state.task);
    expect(scope).toMatchObject({ status: "recorded", start_commit: state.startCommit,
      snapshot_head: git(state.worktree, "rev-parse", "HEAD"), changed_paths: ["product.mjs"] });
    expect(scope.snapshot_head).not.toBe(scope.start_commit);
    expect(scope).not.toHaveProperty("snapshot_ref");
    expect(taskStoreBytes(state.task.taskPath)).toEqual(before);
  });

  it("reads the authenticated task start and committed, dirty, staged, untracked, rename and delete paths before a receipt", async () => {
    const state = fixture();
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 1;\n");
    git(state.worktree, "add", "product.mjs");
    git(state.worktree, "commit", "-qm", "committed implementation");
    git(state.worktree, "mv", "old-name.mjs", "renamed.mjs");
    git(state.worktree, "rm", "-q", "to-delete.mjs");
    writeFileSync(join(state.worktree, "staged.mjs"), "export const staged = true;\n");
    git(state.worktree, "add", "staged.mjs");
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 2;\n");
    writeFileSync(join(state.worktree, "untracked.mjs"), "export const untracked = true;\n");

    const pre = beforeTests(state.task);
    expect(pre).toMatchObject({ status: "recorded", task_id: state.task.identity.taskId,
      start_commit: state.startCommit, start_tree: state.startTree,
      snapshot_head: git(state.worktree, "rev-parse", "HEAD"),
      source_digest: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(pre).not.toHaveProperty("snapshot_ref");
    expect(pre.changed_paths).toEqual(expect.arrayContaining([
      "product.mjs", "old-name.mjs", "renamed.mjs", "to-delete.mjs", "staged.mjs", "untracked.mjs",
    ]));
    expect(pre.changes.some((item) => item.status.startsWith("R")
      && item.old_path === "old-name.mjs" && item.path === "renamed.mjs")).toBe(true);
    expect(pre.changes.some((item) => item.status === "D" && item.path === "to-delete.mjs")).toBe(true);

    const receipt = await runCapture("node --version", "quality/tests/p9-preexecution-same-source.json", {
      task: state.task, workspace: openCurrentTaskWorkspace(state.task),
    });
    expect(receipt.change_scope).toMatchObject({ status: "recorded", start_commit: pre.start_commit,
      snapshot_commit: pre.snapshot_commit, snapshot_tree: pre.snapshot_tree,
      source_digest: pre.source_digest, changed_paths: pre.changed_paths });
    expect(receipt.change_scope.snapshot_ref).toBe(receipt.receipt_ref);
  });

  it("does not accept another task's workspace", () => {
    const first = fixture(), second = fixture();
    const result = beforeTests(first.task, openCurrentTaskWorkspace(second.task));
    expect(result).toMatchObject({ status: "unknown_change_scope", task_id: first.task.identity.taskId,
      changed_paths: [] });
  });

  it("does not invent a task start when the authenticated bootstrap record is missing", () => {
    const state = fixture();
    const otherStorage = join(state.root, "unstarted-storage");
    mkdirSync(otherStorage);
    const unstarted = createTask({ storageRoot: otherStorage, manifest: {
      schema_version: "1.0.0", project_name: "Preexecution", task_id: "unstarted",
      created_at: "2026-09-19T00:00:00Z", target_repo_root: state.repo,
      issue_ids: [], inputs: {}, record_model: "vnext-single-write", activation_cohort: "pre",
      workspace_mode: "existing", workspace_root: state.worktree,
    } });
    const result = beforeTests(unstarted);
    expect(result).toMatchObject({ status: "unknown_change_scope", task_id: "unstarted",
      changed_paths: [], reason: expect.stringContaining("bootstrap") });
  });

  it.each(["hash", "workspace_binding"])("rejects an existing bootstrap record with a changed %s", (fault) => {
    const state = fixture();
    const ref = `identity/executions/bootstrap-${state.task.identity.taskId}.json`;
    const path = join(state.task.taskPath, ref);
    const record = JSON.parse(readFileSync(path, "utf8"));
    if (fault === "hash") record.execution_manifest_hash = "0".repeat(40);
    else {
      record.creation_result.workspace.worktree_root = join(state.root, "different-worktree");
      const { execution_manifest_hash: ignored, ...unsigned } = record;
      record.execution_manifest_hash = sha256(canonical(unsigned));
    }
    writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
    const result = beforeTests(state.task);
    expect(result).toMatchObject({ status: "unknown_change_scope", changed_paths: [],
      reason: expect.stringContaining("bootstrap") });
  });

  it("re-reads changed source bytes rather than reusing an earlier candidate snapshot", () => {
    const state = fixture();
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 1;\n");
    const first = beforeTests(state.task);
    writeFileSync(join(state.worktree, "product.mjs"), "export const version = 2;\n");
    writeFileSync(join(state.worktree, "later.mjs"), "export const later = true;\n");
    const second = beforeTests(state.task);
    expect(second.status).toBe("recorded");
    expect(second.start_commit).toBe(first.start_commit);
    expect(second.snapshot_tree).not.toBe(first.snapshot_tree);
    expect(second.source_digest).not.toBe(first.source_digest);
    expect(second.changed_paths).toEqual(expect.arrayContaining(["product.mjs", "later.mjs"]));
    expect(first.changed_paths).not.toContain("later.mjs");
  });
});
