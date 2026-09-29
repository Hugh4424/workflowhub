import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("ORACLE-P10-B2-COMMITTED-CHANGE: task change scope", () => {
  it("keeps the task-start commit when an existing task worktree has committed the product change", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-case-selection-")));
    roots.push(root);
    const repo = join(root, "repo");
    mkdirSync(repo);
    git(repo, ["init", "-q", "-b", "main"]);
    git(repo, ["config", "user.name", "WorkflowHub tests"]);
    git(repo, ["config", "user.email", "tests@workflowhub.local"]);
    writeFileSync(join(repo, "product.mjs"), "export const effect = 'old';\n");
    git(repo, ["add", "product.mjs"]);
    git(repo, ["commit", "-qm", "starting product"]);
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "p10-committed-change",
      created_at: "2026-09-19T00:00:00Z", target_repo_root: repo,
      issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    } });
    const first = prepareTaskWorkspace(task);
    const start = git(first.worktreeRoot, ["rev-parse", "HEAD"]);
    writeFileSync(join(first.worktreeRoot, "product.mjs"), "export const effect = 'new';\n");
    git(first.worktreeRoot, ["add", "product.mjs"]);
    git(first.worktreeRoot, ["commit", "-qm", "task implementation"]);
    const reopened = prepareTaskWorkspace(task);
    const changed = git(reopened.worktreeRoot, ["diff", "--name-only", reopened.baselineCommit, "HEAD"]);
    expect(reopened.baselineCommit, "committed task changes must remain visible to the B2 selector").toBe(start);
    expect(changed.split("\n")).toContain("product.mjs");
  });
});
