import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";
import { runCandidateWorkspaceCommand, runRepoBoundCommand, runWorkspaceCommand } from "../workspace-runner.mjs";
import { testConfirmationVerification, writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";

const temporary = [];

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workspace-runner-")));
  temporary.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "runner-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, confirmationVerification: testConfirmationVerification });
  const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit, snapshot_tree: candidate.captureSnapshot().tree } });
  kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  return { root, worktree: candidate.worktreeRoot, workspace, task };
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("WorkspaceRunner", () => {
  it("always runs in the branded Workspace root", () => {
    const { worktree, workspace } = fixture();
    const result = runWorkspaceCommand(workspace, "stage", "/bin/pwd", []);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(realpathSync(worktree));
  });

  it("rejects unbranded workspaces and non-argv inputs before execution", () => {
    expect(() => runWorkspaceCommand({}, "stage", "true", [])).toThrow(/Workspace capability/i);
    const { workspace } = fixture();
    expect(() => runWorkspaceCommand(workspace, "stage", "", [])).toThrow(/command/i);
    expect(() => runWorkspaceCommand(workspace, "stage", "true", [1])).toThrow(/array of strings/i);
  });

  it("runs make-decision components only in the branded CandidateWorkspace root", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workspace-candidate-"))); temporary.push(root);
    const repo = join(root, "repo"); mkdirSync(repo); execFileSync("git", ["init", "-q"], { cwd: repo }); execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo }); execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "candidate-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    const candidate = prepareTaskWorkspace(task), worktree = candidate.worktreeRoot;
    const result = runCandidateWorkspaceCommand(candidate, "/bin/pwd", []);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(realpathSync(worktree));
    expect(() => runCandidateWorkspaceCommand({}, "true", [])).toThrow(/CandidateWorkspace capability/i);
  });

  it("gives a Workspace cwd only to fixed repo-bound command classes", () => {
    const { worktree, workspace } = fixture();
    const result = runRepoBoundCommand(workspace, "stage", "/bin/pwd");
    expect(result.stdout.trim()).toBe(realpathSync(worktree));
    for (const command of ["doctor", "task", "status", "release", "routing", "admin-repin"]) {
      expect(() => runRepoBoundCommand(workspace, command, "/bin/pwd")).toThrow(/launcher_bound|Workspace cwd/i);
      expect(() => runWorkspaceCommand(workspace, command, "/bin/pwd")).toThrow(/launcher_bound|Workspace cwd/i);
    }
  });
});
