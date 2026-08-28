import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, statSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-startup-contract-")));
  roots.push(root);
  const storage = join(root, "storage");
  const repo = join(root, "workflowhub");
  const home = join(root, "home");
  mkdirSync(storage);
  mkdirSync(repo);
  mkdirSync(home);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
  return { root, storage, repo, home, env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage } };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("WorkflowHub startup boundary", () => {
  it("creates the parallel task worktree before bootstrap returns", () => {
    const state = fixture();
    const result = bootstrapTask(
      { project: "workflowhub", task: "startup-worktree", "target-repo": state.repo },
      { ...state, home: state.home, cwd: state.repo },
    );

    const expectedWorktree = join(dirname(state.repo), `${basename(state.repo)}-startup-worktree`);
    expect(statSync(expectedWorktree).isDirectory()).toBe(true);
    expect(realpathSync(result.task_path)).toContain("/Projects/workflowhub/tasks/startup-worktree");
    expect(git(expectedWorktree, ["symbolic-ref", "--quiet", "--short", "HEAD"]))
      .toBe("task/workflowhub/startup-worktree");
    expect(git(state.repo, ["worktree", "list", "--porcelain"]))
      .toContain(`worktree ${expectedWorktree}`);
  });
});
