import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { bootstrapStage } from "../../runtime/stage/stage-context.mjs";

const roots = [];

/**
 * The missing-workspace degrade is a read-only projection for historical
 * tasks. Keep the target repo outside the task workspace directory so removing
 * the worktree does not also remove the repo the identity check reads.
 */
function degradedTaskState(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workspace-degrade-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub workspace tests"]);
  git(["config", "user.email", "workspace-degrade@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "workspace degrade fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkspaceDegrade", task_id: taskId,
      created_at: "2026-09-10T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const missingPath = workspace.worktreeRoot;
  rmSync(missingPath, { recursive: true, force: true });
  return { root, task, missingPath };
}

function bootstrapOptions(state, readOnly) {
  return {
    mode: "sidecar",
    projectName: state.task.identity.projectName,
    taskId: state.task.identity.taskId,
    taskPath: state.task.taskPath,
    stage: "build-code",
    readOnly,
  };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("read-only stage context workspace degrade", () => {
  it("keeps the original ENOENT and the missing path observable", () => {
    const state = degradedTaskState("workspace-degrade-read-only");

    const context = bootstrapStage("build-code", bootstrapOptions(state, true));

    // The projection stays available: a degraded read must not become a throw.
    expect(context.workspace).toBeUndefined();
    expect(context.artifacts).toBeUndefined();
    const degrade = context.workspace_unavailable;
    expect(degrade).toBeTruthy();
    expect(degrade.code).toBe("ENOENT");
    expect(degrade.path).toBe(state.missingPath);
    expect(degrade.message).toContain(state.missingPath);
    // The original failure stays recoverable as the cause, not just as text.
    expect(degrade.cause).toBeInstanceOf(Error);
    expect(degrade.cause.code).toBe("ENOENT");
    expect(degrade.cause.path).toBe(state.missingPath);
  });

  it("still fails loudly for a writing context", () => {
    const state = degradedTaskState("workspace-degrade-writing");

    expect(() => bootstrapStage("build-code", bootstrapOptions(state, false))).toThrow(/ENOENT/);
  });
});
