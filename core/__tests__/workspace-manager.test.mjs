import { afterEach, describe, expect, it } from "vitest";
import { lstatSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../task-handle.mjs";
import { assertWorkspace, openAcceptedWorkspace, prepareTaskWorkspace, validateTaskWorkspaceAttempt } from "../workspace.mjs";

const roots = [];

function git(cwd, args) {
  return String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
}

function registeredWorktrees(repo) {
  return git(repo, ["worktree", "list", "--porcelain"])
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => realpathSync(line.slice("worktree ".length)));
}

function fixture(taskId = "task-one") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-worktree-manager-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const baseline = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })).trim();
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs: {},
  } });
  return { root, repo, baseline, task, expectedRoot: `${repo}-${taskId}` };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("deterministic WorktreeManager", () => {
  it("creates and safely reuses the exact task worktree", () => {
    const { task, repo, baseline, expectedRoot } = fixture();
    const mainStatus = git(repo, ["status", "--porcelain", "--untracked-files=all"]);
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo)]);
    const first = prepareTaskWorkspace(task);
    expect(first).toMatchObject({
      worktreeRoot: realpathSync(expectedRoot),
      baselineCommit: baseline,
      branch: "task/Demo/task-one",
    });
    const firstIdentity = lstatSync(first.worktreeRoot);
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo), first.worktreeRoot]);
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(baseline);
    expect(git(repo, ["status", "--porcelain", "--untracked-files=all"])).toBe(mainStatus);
    const retry = prepareTaskWorkspace(task);
    expect(retry).toMatchObject({ worktreeRoot: first.worktreeRoot, baselineCommit: baseline });
    const retryIdentity = lstatSync(retry.worktreeRoot);
    expect({ dev: retryIdentity.dev, ino: retryIdentity.ino }).toEqual({ dev: firstIdentity.dev, ino: firstIdentity.ino });
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo), first.worktreeRoot]);
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(baseline);
    expect(git(repo, ["status", "--porcelain", "--untracked-files=all"])).toBe(mainStatus);
  });

  it("reuses the existing task worktree after main advances and becomes dirty", () => {
    const { task, repo, baseline } = fixture("retry-after-main-change");
    const first = prepareTaskWorkspace(task);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "main advanced"], { cwd: repo });
    const advancedMain = git(repo, ["rev-parse", "HEAD"]);
    writeFileSync(join(repo, "dirty.txt"), "dirty");

    const retry = prepareTaskWorkspace(task);

    expect(retry).toMatchObject({ worktreeRoot: first.worktreeRoot, baselineCommit: baseline });
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(advancedMain);
    expect(git(repo, ["status", "--porcelain", "--untracked-files=all"])).toContain("dirty.txt");
  });

  it("fails loud instead of rebinding baseline after a task-only commit", () => {
    const { task, repo, baseline, expectedRoot } = fixture("retry-after-task-commit");
    const first = prepareTaskWorkspace(task);
    const firstIdentity = lstatSync(first.worktreeRoot);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "task-only commit"], { cwd: expectedRoot });
    const taskOnlyHead = git(expectedRoot, ["rev-parse", "HEAD"]);

    expect(() => prepareTaskWorkspace(task)).toThrow(/not an ancestor|fallback|baseline rebinding/i);

    const currentIdentity = lstatSync(expectedRoot);
    expect(git(expectedRoot, ["rev-parse", "HEAD"])).toBe(taskOnlyHead);
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(baseline);
    expect({ dev: currentIdentity.dev, ino: currentIdentity.ino }).toEqual({ dev: firstIdentity.dev, ino: firstIdentity.ino });
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo), realpathSync(expectedRoot)]);
  });

  it.each([
    ["another branch", ["switch", "-q", "-c", "other"]],
    ["detached HEAD", ["checkout", "-q", "--detach"]],
  ])("invalidates an accepted Workspace immediately after switching to %s", (_label, args) => {
    const { task } = fixture(`accepted-${args[0] === "switch" ? "branch" : "detached"}`);
    const candidate = prepareTaskWorkspace(task);
    const worktreeRoot = candidate.worktreeRoot;
    const workspace = openAcceptedWorkspace(task, { facts: {
      worktree_root: worktreeRoot,
      baseline_commit: candidate.baselineCommit,
    } });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "implementation checkpoint"], { cwd: worktreeRoot });
    expect(() => workspace.worktreeRoot).not.toThrow();

    execFileSync("git", args, { cwd: worktreeRoot });

    expect(() => workspace.worktreeRoot).toThrow(/branch|deterministic|registration/i);
    expect(() => assertWorkspace(workspace)).toThrow(/branch|deterministic|registration/i);
  });

  it("rejects caller workspace arguments and mismatched attempt facts", () => {
    const { task } = fixture();
    const candidate = prepareTaskWorkspace(task);
    expect(() => prepareTaskWorkspace(task, { worktreeRoot: "/tmp/other" })).toThrow(/only a TaskHandle|caller-supplied/i);
    expect(() => validateTaskWorkspaceAttempt(task, {
      worktree_root: candidate.worktreeRoot,
      baseline_commit: "a".repeat(40),
    })).toThrow(/baseline/i);
  });

  it("fails loud on path/branch conflicts and dirty repositories", () => {
    const first = fixture("path-conflict");
    mkdirSync(first.expectedRoot);
    expect(() => prepareTaskWorkspace(first.task)).toThrow(/path\/branch conflict/i);

    const second = fixture("dirty-target");
    writeFileSync(join(second.repo, "dirty.txt"), "dirty");
    expect(() => prepareTaskWorkspace(second.task)).toThrow(/must be clean/i);
  });
});
