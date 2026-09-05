import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { resolveWorkflowHubIdentity } from "../../tools/cli/stage-runtime.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function fixture({ taskId = "identity-task", legacySessionFields = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-identity-resolution-")));
  roots.push(root);
  const home = join(root, "home");
  const storage = join(root, "storage");
  const repo = join(root, "repo");
  mkdirSync(home, { recursive: true });
  mkdirSync(storage, { recursive: true });
  mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "identity fixture\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-09-04T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
      ...(legacySessionFields ? {
        session_id: "old-session",
        active_task_id: "old-task",
        task_binding: { project_name: "OldProject", task_id: "old-task" },
      } : {}),
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const env = { HOME: home, WORKFLOWHUB_TASK_DIR: storage };
  return { root, home, storage, repo, task, workspace, env };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("WorkflowHub identity resolution", () => {
  it("normalizes and prioritizes explicit project/task identity", () => {
    const state = fixture();
    expect(resolveWorkflowHubIdentity({ project: " Demo ", task: " identity-task " }, state.repo, state.env)).toMatchObject({
      project: "Demo",
      task: "identity-task",
      source: "explicit",
    });
  });

  it("derives identity from the authenticated registered worktree", () => {
    const state = fixture();
    expect(resolveWorkflowHubIdentity({}, state.workspace.worktreeRoot, state.env)).toMatchObject({
      project: "Demo",
      task: "identity-task",
      taskPath: state.task.taskPath,
      source: "worktree",
    });
  });

  it("rejects an explicit identity that conflicts with the worktree manifest", () => {
    const state = fixture();
    expect(() => resolveWorkflowHubIdentity({ project: "Other", task: "identity-task" }, state.workspace.worktreeRoot, state.env))
      .toThrow(/identity conflict|worktree.*identity/i);
  });

  it("fails closed when neither explicit nor authenticated worktree identity exists", () => {
    const state = fixture();
    expect(() => resolveWorkflowHubIdentity({}, state.repo, state.env)).toThrow(/identity.*missing|no.*identity/i);
  });

  it("fails closed when the registered task manifest is unreadable", () => {
    const state = fixture();
    writeFileSync(join(state.task.taskPath, "task.json"), "not-json\n");
    expect(() => resolveWorkflowHubIdentity({}, state.workspace.worktreeRoot, state.env))
      .toThrow(/manifest|invalid|identity/i);
  });

  it("does not consume legacy session fields or an old session id", () => {
    const state = fixture({ legacySessionFields: true });
    const env = { ...state.env, CODEX_SESSION_ID: "old-session-id" };
    expect(resolveWorkflowHubIdentity({}, state.workspace.worktreeRoot, env)).toMatchObject({
      project: "Demo",
      task: "identity-task",
      source: "worktree",
    });
  });

  it("keeps the identity result bound to one task path for downstream outcomes", () => {
    const state = fixture();
    const identity = resolveWorkflowHubIdentity({}, state.workspace.worktreeRoot, state.env);
    expect(identity).toEqual(expect.objectContaining({
      project: "Demo",
      task: "identity-task",
      taskPath: state.task.taskPath,
      source: "worktree",
    }));
    expect(readFileSync(join(identity.taskPath, "task.json"), "utf8")).toContain('"task_id": "identity-task"');
  });
});
