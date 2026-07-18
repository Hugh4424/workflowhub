import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask, migrateTaskTargetRepoRoot, openTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { bootstrapStage } from "../stage-context.mjs";
import { createTaskWorktreeRemoval, openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";
import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";
import { runCapture as captureBuild } from "../../workflows/build-code/capture.mjs";
import { runCapture as captureVerify } from "../../workflows/verify-code/capture.mjs";

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

function acceptedWorkspaceFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-migrated-workspace-"))); roots.push(root);
  const repo = join(root, "repo"), source = join(root, "generation-two");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo }); execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo }); execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  execFileSync("git", ["worktree", "add", "-qb", "generation-two", source, "main"], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "migration", created_at: new Date().toISOString(), target_repo_root: source, issue_ids: [], inputs: {} } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
  kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
  return { repo, source, task, candidate };
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

  it("opens the accepted Workspace and captures build-code and verify-code after migration", async () => {
    const f = acceptedWorkspaceFixture();
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });

    const contexts = {};
    for (const stage of ["build-code", "verify-code"]) {
      const context = bootstrapStage(stage, { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" });
      contexts[stage] = context;
      expect(context.manifest.target_repo_root).toBe(f.repo);
      expect(context.workspace.worktreeRoot).toBe(f.candidate.worktreeRoot);
    }
    const snapshotHead = git(f.candidate.worktreeRoot, ["rev-parse", "HEAD"]);
    const snapshotTree = git(f.candidate.worktreeRoot, ["rev-parse", "HEAD^{tree}"]);
    expect(await captureBuild("true", "receipts/migrated-build.json", { workspace: contexts["build-code"].workspace, task: contexts["build-code"].task })).toMatchObject({ snapshot_head: snapshotHead, snapshot_tree: snapshotTree });
    expect(await captureVerify("true", "receipts/migrated-verify.json", { workspace: contexts["verify-code"].workspace, task: contexts["verify-code"].task })).toMatchObject({ snapshot_head: snapshotHead, snapshot_tree: snapshotTree });
    expect(() => openAcceptedWorkspace(migrated.task, { facts: {
      worktree_root: `${f.repo}-migration`, baseline_commit: f.candidate.baselineCommit,
    } })).toThrow(/does not match the deterministic task worktree/i);
  });

  it("uses the accepted legacy Workspace for close removal after migration", async () => {
    const f = acceptedWorkspaceFixture();
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    const legacyRoot = f.candidate.worktreeRoot;
    const removal = createTaskWorktreeRemoval(migrated.task, { taskId: "migration", stage: "make-decision", worktreeRoot: legacyRoot, baselineCommit: f.candidate.baselineCommit });

    expect(removal.probe()).toMatchObject({ satisfied: false, worktree_root: legacyRoot });
    await removal.execute();
    expect(removal.probe()).toMatchObject({ satisfied: true, worktree_root: legacyRoot });
    expect(existsSync(legacyRoot)).toBe(false);
  });

  it("fails loud when the migrated accepted Workspace branch or registration changes", () => {
    const f = acceptedWorkspaceFixture();
    migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    const legacyRoot = f.candidate.worktreeRoot;
    execFileSync("git", ["switch", "-q", "-c", "other"], { cwd: legacyRoot });

    expect(() => bootstrapStage("build-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" })).toThrow(/branch|registration/i);

    execFileSync("git", ["worktree", "remove", "--force", legacyRoot], { cwd: f.repo });
    expect(() => bootstrapStage("verify-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" })).toThrow(/accepted worktree_root|ENOENT|registration/i);
  });

  it("fails closed when migration lineage is corrupted", () => {
    const f = acceptedWorkspaceFixture();
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    writeFileSync(join(f.task.taskPath, migrated.migration_ref), "{\"schema_version\":\"forged\"}\n");

    expect(() => bootstrapStage("build-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" })).toThrow(/migration integrity hash mismatch/i);
    expect(() => openAcceptedWorkspace(migrated.task, { facts: { worktree_root: f.candidate.worktreeRoot, baseline_commit: f.candidate.baselineCommit } })).toThrow(/migration integrity hash mismatch/i);
    expect(() => createTaskWorktreeRemoval(migrated.task, { taskId: "migration", stage: "make-decision", worktreeRoot: f.candidate.worktreeRoot, baselineCommit: f.candidate.baselineCommit })).toThrow(/migration integrity hash mismatch/i);
  });
});
