import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { main as workflowHubBridgeMain } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const fixture = (taskId = "claude-outcome-fixture") => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-claude-outcome-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "Claude outcome fixture\n");
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
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const materialRoot = join(workspace.worktreeRoot, "specs", taskId);
  mkdirSync(materialRoot, { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(materialRoot, name), `# ${name}\nfixture\n`);
  }
  return { task, workspace };
};

const readFixture = () => JSON.parse(readFileSync(join(dirname(new URL(import.meta.url).pathname), "..", "fixtures", "claude-outcome", "valid-session.json"), "utf8"));

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("Claude/host explicit outcome packet contract", () => {
  it("accepts a session packet with explicit host/source/agent identity", async () => {
    const state = fixture();
  const input = readFixture();
  input.task_path = state.task.taskPath;
    input.session.source_id = "claude-code/fixture";
    input.session.events = [
      {
        subject_kind: "step",
        subject_id: "stage-end-spec-analyze",
        task_id: state.task.identity.taskId,
        stage: "build-code",
        started_at_ms: 1,
        ended_at_ms: 4,
        status: "incomplete",
        result_summary: "Claude fixture recorded the stage-end analyzer boundary",
        reason: "Claude fixture is intentionally incomplete",
      },
      {
        subject_kind: "skill",
        subject_id: "spec-analyze",
        task_id: state.task.identity.taskId,
        stage: "build-code",
        started_at_ms: 2,
        ended_at_ms: 3,
        status: "incomplete",
        trigger: true,
        executed: true,
        version: "claude-fixture-1.0.0",
        result_summary: "Claude fixture recorded the analyzer skill boundary",
        reason: "Claude fixture is intentionally incomplete",
      },
    ];
    input.session.spec_analyze = {
      packet: { original_requirements: [], coverage: [], current_stage_repairs: [], work_summary: "Claude fixture" },
      evidence_subjects: Object.fromEntries(["decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace"].map((name) => [name, { subject_kind: "step", subject_id: "stage-end-spec-analyze" }])),
      implementation_material: "unavailable: Claude fixture",
      implementation_evidence_subject: { subject_kind: "step", subject_id: "stage-end-spec-analyze" },
    };
    const result = await workflowHubBridgeMain(input);
    expect(result).toMatchObject({
      schema_version: "workflowhub-stage-agent-bridge-result.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      attempt_id: "attempt-claude-outcome-fixture",
      outcome_status: "incomplete",
    });
    expect(result.outcome_ref).toMatch(/^quality\/evidence\/stage-outcomes\/build-code\//);
    const outcome = JSON.parse(state.task.readRecord(result.outcome_ref));
    expect(outcome).toMatchObject({
      task_id: state.task.identity.taskId,
      stage: "build-code",
      attempt_id: "attempt-claude-outcome-fixture",
      snapshot_tree: expect.any(String),
      material_revision: expect.any(String),
    });
    expect(outcome.producer).toMatchObject({
      kind: "workflowhub-session",
      host: "claude-code",
      agent_run_id: "agent-claude-outcome-fixture",
      source_id: "claude-code/fixture",
      source_family: "claude-code",
      source_ref: "claude-outcome-fixture",
    });
  });

  it("rejects a missing host result instead of inventing execution", async () => {
    const input = readFixture();
    delete input.session;
    await expect(workflowHubBridgeMain(input)).rejects.toThrow(/session or unavailable.*exactly once/i);
  });

  it("rejects a session binding that names another task", async () => {
    const state = fixture();
    const input = readFixture();
    input.task_path = state.task.taskPath;
    input.session.task_id = "another-task";
    await expect(workflowHubBridgeMain(input)).rejects.toThrow(/session.task_id does not match/i);
  });

  it("keeps the Claude packet on the shared bridge and current outcome schema", () => {
    const input = readFixture();
    expect(input).toHaveProperty("agent_run_id");
    expect(input.session).toMatchObject({ source_family: "claude-code", source_ref: "claude-outcome-fixture" });
    expect(input).not.toHaveProperty("execution");
  });
});
