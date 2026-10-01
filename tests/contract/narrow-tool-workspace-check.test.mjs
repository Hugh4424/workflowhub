// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { assertCleanTarget, inspectWorkspace } from "../../runtime/interface/workspace-check.mjs";

const roots = [];

const git = (cwd, args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

const rejection = (promise) => promise.then(() => null, (error) => error);

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

/** 主仓 + 已注册 worktree 夹具：root 是主仓，target 是其注册的 worktree。 */
function workspaceFixture() {
  const root = tempRoot("wh-workspace-check-");
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const baseline = git(repo, ["rev-parse", "HEAD"]);
  const target = join(root, "workspace");
  git(repo, ["worktree", "add", target, "-b", "task-branch"]);
  return { root, repo, target, baseline };
}

describe("workspace-check inspectWorkspace", () => {
  it("reports registered/branch/head with zero dirty paths for a clean registered workspace", async () => {
    const { repo, target, baseline } = workspaceFixture();
    const result = await inspectWorkspace({ root: repo, target, baseline, expectBranch: "task-branch" });
    expect(result.registered).toBe(true);
    expect(result.branch).toBe("task-branch");
    expect(result.head).toBe(git(target, ["rev-parse", "HEAD"]));
    expect(result.dirty).toBe(0);
    expect(result.changed_paths).toEqual([]);
  });

  it("counts a modified file and lists its path", async () => {
    const { repo, target, baseline } = workspaceFixture();
    appendFileSync(join(target, "README.md"), "edited\n");
    const result = await inspectWorkspace({ root: repo, target, baseline, expectBranch: "task-branch" });
    expect(result.dirty).toBe(1);
    expect(result.changed_paths).toContain("README.md");
  });
});

describe("workspace-check assertCleanTarget", () => {
  it("resolves for a clean workspace on the expected branch", async () => {
    const { repo, target, baseline } = workspaceFixture();
    await expect(
      assertCleanTarget({ root: repo, target, baseline, expectBranch: "task-branch" }),
    ).resolves.toBeUndefined();
  });

  it("rejects a dirty target, reports the facts, and never auto-repairs", async () => {
    const { repo, target, baseline } = workspaceFixture();
    appendFileSync(join(target, "README.md"), "dirty edit\n");
    const error = await rejection(assertCleanTarget({ root: repo, target, baseline, expectBranch: "task-branch" }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("README.md");
    // 拒绝只报告事实：脏改动原样保留，不得被自动修复。
    expect(readFileSync(join(target, "README.md"), "utf8")).toBe("baseline\ndirty edit\n");
  });

  it("rejects a branch mismatch naming the actual branch and does not switch branches", async () => {
    const { repo, target, baseline } = workspaceFixture();
    const error = await rejection(assertCleanTarget({ root: repo, target, baseline, expectBranch: "main" }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("task-branch");
    expect(git(target, ["branch", "--show-current"])).toBe("task-branch");
  });
});
