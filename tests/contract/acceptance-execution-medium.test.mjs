import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { openAcceptedWorkspace } from "../../runtime/task/workspace.mjs";
import { runWorkspaceCommand } from "../../runtime/task/workspace-runner.mjs";

const roots = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function workspaceFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-medium-contract-")));
  roots.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "repo-medium-contract");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "tracked.txt"), "medium\n");
  git(["add", "tracked.txt"]);
  git(["commit", "-qm", "base"]);
  const baseline = git(["rev-parse", "HEAD"]);
  git(["worktree", "add", "-q", "-b", "task/Demo/medium-contract", worktree, baseline]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "medium-contract",
      created_at: "2026-09-11T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  return { root, repo, workspace: openAcceptedWorkspace(task, { facts: { worktree_root: worktree, baseline_commit: baseline } }) };
}

async function portIsFree(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}

describe("S3 medium thin-real acceptance boundary", () => {
  it("passes a real git/workspace command with literal argv, cwd, and raw stdout/stderr", () => {
    const state = workspaceFixture();
    const literal = "$(not-a-shell); literal";
    const result = runWorkspaceCommand(state.workspace, process.execPath, [
      "-e",
      "process.stdout.write(JSON.stringify({cwd:process.cwd(),argv:process.argv.slice(1)}));process.stderr.write('medium-stderr')",
      literal,
    ], { timeoutMs: 5000 });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ cwd: state.workspace.worktreeRoot, argv: [literal] });
    expect(result.stderr).toBe("medium-stderr");

    const gitResult = runWorkspaceCommand(state.workspace, "git", ["rev-parse", "--show-toplevel"], { timeoutMs: 5000 });
    expect(gitResult.status).toBe(0);
    expect(gitResult.stdout.trim()).toBe(state.workspace.worktreeRoot);
  });

  it("preserves nonzero exit, malformed output, and stderr instead of accepting child self-report", () => {
    const state = workspaceFixture();
    const result = runWorkspaceCommand(state.workspace, process.execPath, [
      "-e",
      "process.stdout.write('not-json');process.stderr.write('bad-output');process.exit(7)",
    ], { timeoutMs: 5000 });
    expect(result.status).toBe(7);
    expect(result.stdout).toBe("not-json");
    expect(result.stderr).toBe("bad-output");
  });

  it("cancels a real process group and releases its listening port", async () => {
    const state = workspaceFixture();
    const marker = join(state.root, "port.txt");
    const controller = new AbortController();
    const source = [
      "import { createServer } from 'node:net';",
      "import { writeFileSync } from 'node:fs';",
      "const server=createServer();",
      `server.listen(0,'127.0.0.1',()=>writeFileSync(${JSON.stringify(marker)},String(server.address().port)));`,
      "setInterval(()=>{},1000);",
    ].join("\n");
    const running = runWorkspaceCommand(state.workspace, process.execPath, ["--input-type=module", "-e", source], {
      asynchronous: true,
      timeoutMs: 5000,
      signal: controller.signal,
    });
    for (let attempt = 0; attempt < 100 && !existsSync(marker); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(existsSync(marker)).toBe(true);
    const port = Number(readFileSync(marker, "utf8"));
    controller.abort(new Error("medium contract cancellation"));
    const result = await running;
    expect(result.cancelled).toBe(true);
    expect(result.timed_out).toBe(false);
    expect(result.cleanup).toEqual({ status: "completed" });
    await portIsFree(port);
  });
});
