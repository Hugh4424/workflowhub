import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../task-handle.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";
import { runCandidateWorkspaceCommand, runWorkspaceCommand } from "../workspace-runner.mjs";

const temporary = [];

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workspace-runner-")));
  temporary.push(root);
  const repo = join(root, "repo"), worktree = join(root, "repo-runner-task");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-q", "-b", "task/Demo/runner-task", worktree, baseline], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "runner-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: worktree, baseline_commit: baseline } });
  return { root, worktree, workspace, task };
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("WorkspaceRunner", () => {
  it("always runs in the branded Workspace root", () => {
    const { worktree, workspace } = fixture();
    const result = runWorkspaceCommand(workspace, "/bin/pwd", []);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(realpathSync(worktree));
  });

  it("rejects unbranded workspaces and non-argv inputs before execution", () => {
    expect(() => runWorkspaceCommand({}, "true", [])).toThrow(/Workspace capability/i);
    const { workspace } = fixture();
    expect(() => runWorkspaceCommand(workspace, "", [])).toThrow(/command/i);
    expect(() => runWorkspaceCommand(workspace, "true", [1])).toThrow(/array of strings/i);
  });

  it("runs make-decision components only in the branded CandidateWorkspace root", () => {
    const { task, worktree } = fixture();
    const result = runCandidateWorkspaceCommand(prepareTaskWorkspace(task), "/bin/pwd", []);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(realpathSync(worktree));
    expect(() => runCandidateWorkspaceCommand({}, "true", [])).toThrow(/CandidateWorkspace capability/i);
  });
});
