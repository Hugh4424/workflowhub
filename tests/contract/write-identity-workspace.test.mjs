import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { main as workflowHubBridgeMain } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function repository(root, name) {
  const repo = join(root, name);
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub identity tests"]);
  git(repo, ["config", "user.email", "identity-tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), `${name} baseline\n`);
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  return repo;
}

function writeMaterials(worktree, taskId) {
  const materialRoot = join(worktree, "specs", taskId);
  mkdirSync(materialRoot, { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(materialRoot, name), `# ${name}\nidentity fixture\n`);
  }
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-write-identity-")));
  roots.push(root);
  const storage = join(root, "storage");
  const home = join(root, "home");
  mkdirSync(storage);
  mkdirSync(home);
  const repo = repository(root, "target");
  const wrongCwd = repository(root, "wrong-cwd");
  const env = { HOME: home, WORKFLOWHUB_TASK_DIR: storage };
  const bootstrapped = bootstrapTask({
    project: "WorkflowHub",
    task: "write-identity",
    "target-repo": repo,
  }, { env, home, cwd: repo });
  writeMaterials(bootstrapped.workspace.worktree_root, "write-identity");
  const content = join(root, "artifact-content.md");
  writeFileSync(content, "identity-bound artifact\n");
  return {
    root,
    storage,
    home,
    env,
    repo,
    wrongCwd,
    taskPath: bootstrapped.task_path,
    worktreeRoot: bootstrapped.workspace.worktree_root,
    content,
  };
}

function alternateFixture(state) {
  const storage = join(state.root, "alternate-storage");
  const home = join(state.root, "alternate-home");
  mkdirSync(storage);
  mkdirSync(home);
  const repo = repository(state.root, "alternate-target");
  const env = { HOME: home, WORKFLOWHUB_TASK_DIR: storage };
  const bootstrapped = bootstrapTask({
    project: "WorkflowHub",
    task: "write-identity",
    "target-repo": repo,
  }, { env, home, cwd: repo });
  writeMaterials(bootstrapped.workspace.worktree_root, "write-identity");
  return {
    ...state,
    storage,
    home,
    env,
    repo,
    taskPath: bootstrapped.task_path,
    worktreeRoot: bootstrapped.workspace.worktree_root,
  };
}

async function withEnvironment(env, operation) {
  const keys = ["HOME", "WORKFLOWHUB_TASK_DIR", "WORKFLOWHUB_CUTOVER_EPOCH"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  try { return await operation(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function artifactArgs(state, name) {
  return [
    "artifact",
    "--stage=build-plan",
    "--project=WorkflowHub",
    "--task=write-identity",
    `--name=${name}`,
    `--input=${state.content}`,
  ];
}

function unavailableBridgeInput(state, overrides = {}) {
  return {
    project_name: "WorkflowHub",
    task_id: "write-identity",
    task_path: state.taskPath,
    workspace_root: state.worktreeRoot,
    stage: "build-code",
    attempt_id: "attempt-write-identity",
    agent_run_id: "agent-write-identity",
    unavailable: {
      host: "identity-fixture",
      source_id: "identity-fixture/source",
      source_family: "identity-fixture",
      reason: "fixture host result unavailable",
    },
    ...overrides,
  };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("write identity and workspace boundary", () => {
  it("keeps the exact workspace write, rejects a wrong current worktree before bytes, and leaves status usable", async () => {
    const state = fixture();
    await withEnvironment(state.env, async () => {
      await expect(stageRuntimeMain(artifactArgs(state, "plan.md"), { cwd: state.worktreeRoot })).resolves.toMatchObject({ artifact_ref: "specs/write-identity/plan.md" });
      const target = join(state.worktreeRoot, "specs", "write-identity", "plan.md");
      const before = readFileSync(target, "utf8");
      const wrongTarget = join(state.worktreeRoot, "specs", "write-identity", "tasks.md");
      const wrongBefore = readFileSync(wrongTarget, "utf8");
      await expect(stageRuntimeMain(artifactArgs(state, "tasks.md"), { cwd: state.wrongCwd })).rejects.toThrow(/WRITE_IDENTITY|worktree|workspace/i);
      expect(readFileSync(wrongTarget, "utf8")).toBe(wrongBefore);
      expect(readFileSync(target, "utf8")).toBe(before);
      await expect(stageRuntimeMain([
        "status", "--stage=build-plan", "--project=WorkflowHub", "--task=write-identity",
      ], { cwd: state.wrongCwd })).resolves.toMatchObject({ identity: { task_id: "write-identity" } });
    });
  });

  it("rejects a foreign task path and a foreign workspace root in the child bridge before outcome bytes", async () => {
    const state = fixture();
    const alternate = alternateFixture(state);
    const currentOutcomeRoot = join(state.taskPath, "quality", "evidence", "stage-outcomes", "build-code");
    const alternateOutcomeRoot = join(alternate.taskPath, "quality", "evidence", "stage-outcomes", "build-code");

    await withEnvironment(state.env, async () => {
      await expect(workflowHubBridgeMain(unavailableBridgeInput(alternate, {
        task_path: alternate.taskPath,
        workspace_root: state.worktreeRoot,
        attempt_id: "attempt-foreign-task-path",
        agent_run_id: "agent-foreign-task-path",
      }))).rejects.toThrow(/WRITE_IDENTITY|canonical|workspace|identity/i);
      await expect(workflowHubBridgeMain(unavailableBridgeInput(state, {
        workspace_root: alternate.worktreeRoot,
        attempt_id: "attempt-foreign-workspace-root",
        agent_run_id: "agent-foreign-workspace-root",
      }))).rejects.toThrow(/WRITE_IDENTITY|workspace|identity/i);
      await expect(workflowHubBridgeMain(unavailableBridgeInput(state, {
        task_id: "foreign-task-id",
        attempt_id: "attempt-foreign-task-id",
        agent_run_id: "agent-foreign-task-id",
      }))).rejects.toThrow(/task.*(?:match|identity)|WRITE_IDENTITY/i);
    });

    expect(existsSync(currentOutcomeRoot)).toBe(false);
    expect(existsSync(alternateOutcomeRoot)).toBe(false);
  });

  it("records one closed bootstrap transaction in the existing identity execution namespace", () => {
    const state = fixture();
    const executionsRoot = join(state.taskPath, "identity", "executions");
    const refs = existsSync(executionsRoot) ? readdirSync(executionsRoot).sort() : [];
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatch(/^bootstrap-[A-Za-z0-9._-]+\.json$/);
    const ref = join(executionsRoot, refs[0]);
    const before = readFileSync(ref, "utf8");
    const record = JSON.parse(before);
    expect(record).toMatchObject({
      task_id: "write-identity",
      command: "task-bootstrap",
      transaction: { status: "closed" },
      creation_result: {
        task_path: state.taskPath,
        workspace: { worktree_root: state.worktreeRoot },
        store: { record_ref: "facts.jsonl" },
      },
    });
    expect(readdirSync(state.taskPath)).not.toContain("bootstrap.json");

    const second = bootstrapTask({
      "task-path": state.taskPath,
      project: "WorkflowHub",
      task: "write-identity",
    }, { env: state.env, home: state.home, cwd: state.repo });
    expect(second.task_path).toBe(state.taskPath);
    expect(readdirSync(executionsRoot).sort()).toEqual(refs);
    expect(readFileSync(ref, "utf8")).toBe(before);
  });
});
