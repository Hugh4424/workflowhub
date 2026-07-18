import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask, migrateTaskTargetRepoRoot, openTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";

const roots = [];
const git = (cwd, args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-target-migration-"))); roots.push(root);
  const repo = join(root, "repo"), worktree = join(root, "task-worktree"), other = join(root, "other");
  mkdirSync(repo); mkdirSync(other);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo }); execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo }); execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  execFileSync("git", ["worktree", "add", "-qb", "task/Demo/migration", worktree, "main"], { cwd: repo });
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: other }); execFileSync("git", ["commit", "--allow-empty", "-qm", "other"], { cwd: other });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "migration", created_at: new Date().toISOString(), target_repo_root: worktree, issue_ids: [], inputs: {} } });
  const kernel = createTaskKernel(task), decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: worktree, baseline_commit: git(repo, ["rev-parse", "main"]) } }); kernel.acceptAttempt("make-decision", decision.attempt_ref, writeHumanConfirmation(kernel, "make-decision", decision));
  return { root, repo, worktree, other, task };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("target repository migration", () => {
  it("rejects invalid and unrelated targets without changing the manifest", () => {
    const f = fixture(), before = f.task.readRecord("task.json");
    expect(() => migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: join(f.root, "plain"), targetBranch: "main" })).toThrow();
    expect(() => migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.other, targetBranch: "main" })).toThrow(/common directory/i);
    expect(f.task.readRecord("task.json")).toBe(before);
  });

  it("keeps the old manifest after a failed atomic replace and replays the same lineage", () => {
    const f = fixture(), before = f.task.readRecord("task.json");
    expect(() => migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main", testHooks: { beforeManifestReplace() { throw new Error("simulated migration crash"); } } })).toThrow(/simulated migration crash/);
    expect(f.task.readRecord("task.json")).toBe(before);
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    expect(openTask(f.task.taskPath, { projectName: "Demo", taskId: "migration" }).manifest.target_repo_root).toBe(f.repo);
    expect(migrated.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
