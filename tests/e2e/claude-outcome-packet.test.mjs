import { afterAll, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { main as workflowHubBridgeMain } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const analyzerEvidence = ["decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace"];
const buildCodeSteps = JSON.parse(readFileSync(join(process.cwd(), "workflows", "build-code", "steps.json"), "utf8")).steps;
const firstStep = buildCodeSteps[0].step_slug;

function fixture(taskId = "claude-outcome-e2e-fixture") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-claude-outcome-e2e-")));
  roots.push(root);
  const repo = join(root, "repo");
  const home = join(root, "home");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(home);
  mkdirSync(storage);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "Claude outcome e2e fixture\n");
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
  return { root, repo, home, storage, task };
}

function claudePacket(taskId, taskPath) {
  const input = JSON.parse(readFileSync(join(dirname(new URL(import.meta.url).pathname), "..", "fixtures", "claude-outcome", "valid-session.json"), "utf8"));
  const subject = { subject_kind: "step", subject_id: firstStep };
  input.task_id = taskId;
  input.task_path = taskPath;
  input.session.task_id = taskId;
  input.session.source_id = "claude-code/fixture";
  input.session.events = [
    {
      subject_kind: "step",
      subject_id: "stage-end-spec-analyze",
      task_id: taskId,
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
      task_id: taskId,
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
    packet: {
      original_requirements: [],
      coverage: [],
      current_stage_repairs: [],
      work_summary: "Claude structured outcome packet fixture",
    },
    evidence_subjects: Object.fromEntries(analyzerEvidence.map((name) => [name, subject])),
    implementation_material: "unavailable: Claude fixture is intentionally incomplete",
    implementation_evidence_subject: subject,
  };
  return input;
}

describe("Claude structured outcome packet e2e", () => {
  it("replays through the bridge and is consumed by the official build-code route", async () => {
    const state = fixture();
    const input = claudePacket(state.task.identity.taskId, state.task.taskPath);
    const bridgeResult = await workflowHubBridgeMain(input);
    const publicInputPath = join(state.root, "public-build-code-input.json");
    writeFileSync(publicInputPath, `${JSON.stringify({
      attempt_id: input.attempt_id,
      receipts: { stage_outcomes: bridgeResult.outcome_ref },
    })}\n`);
    const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
    const publicResult = spawnSync(process.execPath, [
      runtime,
      "run",
      "--action=execute",
      "--stage=build-code",
      "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`,
      `--input=${publicInputPath}`,
    ], {
      cwd: state.repo,
      env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.storage },
      encoding: "utf8",
    });
    expect(publicResult.status, `${publicResult.stdout}\n${publicResult.stderr}`).toBe(0);
    const published = JSON.parse(publicResult.stdout);

    expect(published, JSON.stringify(published.stage_outcome_diagnostic)).toMatchObject({
      stage: "build-code",
      stage_outcome_ref: bridgeResult.outcome_ref,
      stage_outcome_hash: bridgeResult.outcome_sha256,
      stage_outcome_status: "incomplete",
      quality_status: "incomplete",
    });
    expect(published.quality_fact_refs.length).toBeGreaterThan(0);
    expect(published.quality_fact_refs.every((ref) => state.task.readRecord(ref))).toBe(true);
    expect(JSON.parse(state.task.readRecord(bridgeResult.outcome_ref))).toMatchObject({
      schema_version: "workflowhub-stage-outcomes.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      status: "incomplete",
      producer: {
        kind: "workflowhub-session",
        host: "claude-code",
        source_family: "claude-code",
      },
    });
  });
});

afterAll(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});
