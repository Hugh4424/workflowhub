import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { resolveWorkflowHubIdentity } from "../../tools/cli/stage-runtime.mjs";
import { main as workflowHubBridgeMain } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const fixture = (taskId = "host-outcome-task", { legacy = false } = {}) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-host-outcome-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "host outcome fixture\n");
  git(["add", "README.md"]);
  git(["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-09-05T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
      ...(legacy ? { session_id: "old-session", active_task_id: "old-task" } : {}),
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const materialRoot = join(workspace.worktreeRoot, "specs", taskId);
  mkdirSync(materialRoot, { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(materialRoot, name), `# ${name}\nfixture\n`);
  }
  return { root, repo, storage, env: { HOME: join(root, "home"), WORKFLOWHUB_TASK_DIR: storage }, task, workspace };
};

const readFixture = (name) => JSON.parse(readFileSync(join(dirname(new URL(import.meta.url).pathname), "..", "fixtures", "host-outcome", name), "utf8"));

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("explicit host outcome bridge contract", () => {
  it("accepts complete explicit project/task identity", () => {
    const state = fixture();
    expect(resolveWorkflowHubIdentity({ project: " WorkflowHub ", task: " host-outcome-task " }, state.repo, {})).toMatchObject({
      project: "WorkflowHub",
      task: "host-outcome-task",
      source: "explicit",
    });
  });

  it("fails closed for partial, missing, and conflicting identity", () => {
    const state = fixture("identity-bound-task");
    expect(() => resolveWorkflowHubIdentity({ project: "WorkflowHub" }, state.repo, {})).toThrow(/supplied together/i);
    expect(() => resolveWorkflowHubIdentity({}, state.repo, {})).toThrow(/identity.*missing/i);
    expect(() => resolveWorkflowHubIdentity({ project: "Other", task: "identity-bound-task" }, state.workspace.worktreeRoot, state.env))
      .toThrow(/identity conflict/i);
  });

  it("uses the authenticated worktree and ignores legacy session/env fields", () => {
    const state = fixture("legacy-ignored-task", { legacy: true });
    expect(resolveWorkflowHubIdentity({}, state.workspace.worktreeRoot, { ...state.env, CODEX_SESSION_ID: "old-session-id" })).toMatchObject({
      project: "WorkflowHub",
      task: "legacy-ignored-task",
      source: "worktree",
    });
  });

  it("rejects legacy execution input from the fixture before any writer call", async () => {
    const input = readFixture("legacy-execution.json");
    await expect(workflowHubBridgeMain(input)).rejects.toThrow(/historical-only/i);
  });

  it("requires the full explicit bridge identity and agent_run_id", async () => {
    const state = fixture("host-outcome-fixture");
    const valid = readFixture("valid-unavailable.json");
    await expect(workflowHubBridgeMain({
      ...valid,
      task_path: state.task.taskPath,
      agent_run_id: undefined,
    })).rejects.toThrow(/agent_run_id/i);
  });

  it("rejects a bridge task id that does not match task_path", async () => {
    const state = fixture();
    const valid = readFixture("valid-unavailable.json");
    await expect(workflowHubBridgeMain({
      ...valid,
      task_id: "different-task",
      task_path: state.task.taskPath,
    })).rejects.toThrow(/taskPath does not match|task_id does not match/i);
  });

  it("keeps the bridge sources independent from old session binding", () => {
    const bridgeSource = readFileSync(new URL("../../tools/host/workflowhub-stage-agent-bridge.mjs", import.meta.url), "utf8");
    expect(bridgeSource).not.toMatch(/WORKFLOWHUB_SESSION_ID|workflowhub-codex-session-(?:state|event|hook)\.mjs/);
    expect(bridgeSource).toMatch(/agent_run_id/);
    expect(bridgeSource).toMatch(/session or unavailable/);
    expect(existsSync(join(dirname(new URL(import.meta.url).pathname), "..", "fixtures", "host-outcome", "valid-unavailable.json"))).toBe(true);
  });
});
