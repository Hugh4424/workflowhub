import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runStage, runStageEndReflection } from "../../runtime/stage/stage-runner.mjs";

const roots = [];
const NOW = "2026-08-31T00:00:00.000Z";

function fixture(taskId, { stage = "build-spec", inputs = {} } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runner-reflection-p2-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub P2 tests"]);
  git(["config", "user.email", "p2@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "runner fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "StageRunnerReflection",
      task_id: taskId,
      created_at: NOW,
      target_repo_root: repo,
      issue_ids: [],
      inputs,
      record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const material of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(material, `# ${material}\n`);
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts, now: () => NOW });
  const context = {
    stage,
    task,
    kernel,
    identity: task.identity,
    manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId(stage),
    candidateWorkspace: workspace,
    artifacts,
    storageRoot: root,
  };
  return { root, task, context };
}

function reflection(taskId, stageStatus = "completed") {
  return {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: taskId,
    stage: "build-spec",
    stage_status: stageStatus,
    generated_at: NOW,
    status: "ok",
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
  };
}

function reflectionPath(state) {
  return join(state.task.taskPath, "quality", "stage-reflection", `${state.context.stage}.json`);
}

function availabilityFiles(state) {
  const root = join(state.task.taskPath, "quality", "evidence", "stage-reflection-availability");
  return existsSync(root) ? readdirSync(root).filter((name) => name.endsWith(".json")) : [];
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage-runner reflection transfer matrix", () => {
  it("rejects malformed stage-end timestamps before scheduling reflection work", async () => {
    const state = fixture("invalid-reflection-time");
    await expect(runStageEndReflection(state.context, {
      now: "not-a-timestamp",
      execute: async () => reflection(state.context.identity.taskId),
    })).rejects.toThrow(/valid ISO-compatible timestamp/);
    expect(existsSync(reflectionPath(state))).toBe(false);
    expect(availabilityFiles(state)).toEqual([]);
  });

  it("derives not_scheduled from a reason when the state is omitted", async () => {
    const state = fixture("reason-derived-not-scheduled");
    const result = await runStageEndReflection(state.context, {
      reasonCode: "interrupted",
      now: NOW,
    });
    expect(result).toMatchObject({
      status: "not_scheduled",
      availability: { state: "not_scheduled", reason_code: "interrupted" },
    });
    expect(availabilityFiles(state)).toHaveLength(1);
  });

  it("rejects mismatched stage-end availability state and reason before writing", async () => {
    const state = fixture("mismatched-availability");
    await expect(runStageEndReflection(state.context, {
      availabilityState: "unavailable",
      reasonCode: "preflight_failed",
      now: NOW,
    })).rejects.toMatchObject({ code: "STAGE_REFLECTION_INPUT_INVALID" });
    expect(availabilityFiles(state)).toEqual([]);
  });

  it("records not_scheduled when preflight cannot read the upstream input", async () => {
    const state = fixture("preflight-failed", { stage: "build-plan", inputs: { spec: "quality/evidence/missing-spec.json" } });
    await expect(runStage(
      "build-plan",
      state.context,
      async () => ({ facts: {} }),
      {},
      { stageReflection: {} },
    )).rejects.toThrow(/missing-spec|ENOENT/i);
    expect(existsSync(reflectionPath(state))).toBe(false);
    const files = availabilityFiles(state);
    expect(files).toHaveLength(1);
    expect(JSON.parse(readFileSync(join(state.task.taskPath, "quality/evidence/stage-reflection-availability", files[0]), "utf8"))).toMatchObject({
      state: "not_scheduled",
      reason_code: "preflight_failed",
    });
  });

  it("records unavailable without occupying the fixed judgment path when no executor is injected", async () => {
    const state = fixture("executor-absent");
    const result = await runStage("build-spec", state.context, async () => ({ facts: {} }), {}, { stageReflection: {} });
    expect(result.stage_reflection).toMatchObject({ status: "unavailable", reflection_status: "unavailable", persisted: false });
    expect(existsSync(reflectionPath(state))).toBe(false);
    expect(availabilityFiles(state)).toHaveLength(1);
    const fact = JSON.parse(readFileSync(join(state.task.taskPath, "quality", "evidence", "stage-reflection-availability", availabilityFiles(state)[0]), "utf8"));
    expect(fact).toMatchObject({ stage: "build-spec", state: "unavailable", reason_code: "executor_absent" });
  });

  it("preserves the injected executor path and publishes a fixed judgment", async () => {
    const state = fixture("executor-injected");
    const result = await runStage(
      "build-spec",
      state.context,
      async () => ({ facts: {} }),
      {},
      { stageReflection: { execute: async ({ taskId, stageStatus }) => reflection(taskId, stageStatus) } },
    );
    expect(result.stage_reflection).toMatchObject({ status: "completed", reflection_status: "ok", persisted: true });
    expect(existsSync(reflectionPath(state))).toBe(true);
  });

  it.each([
    ["startup_failed", "handler startup failed"],
    ["identity_failed", "stage identity mismatch"],
    ["interrupted", "stage interrupted"],
  ])("records not_scheduled for a %s before reflection can run", async (reasonCode, message) => {
    const state = fixture(`handler-${reasonCode}`);
    await expect(runStage(
      "build-spec",
      state.context,
      async () => {
        const error = new Error(message);
        if (reasonCode === "startup_failed") error.code = "STAGE_STARTUP_FAILED";
        if (reasonCode === "identity_failed") error.code = "STAGE_IDENTITY_FAILED";
        if (reasonCode === "interrupted") error.code = "STAGE_INTERRUPTED";
        throw error;
      },
      {},
      { stageReflection: {} },
    )).rejects.toThrow(message);
    expect(existsSync(reflectionPath(state))).toBe(false);
    const files = availabilityFiles(state);
    expect(files).toHaveLength(1);
    expect(JSON.parse(readFileSync(join(state.task.taskPath, "quality/evidence/stage-reflection-availability", files[0]), "utf8"))).toMatchObject({
      state: "not_scheduled",
      reason_code: reasonCode,
    });
  });

  it("runs a failed reflection for an ordinary handler error when an executor is available", async () => {
    const state = fixture("handler-execution-failed");
    let receivedStageStatus;
    await expect(runStage(
      "build-spec",
      state.context,
      async () => { throw new Error("ordinary stage execution failed"); },
      {},
      {
        stageReflection: {
          execute: async ({ taskId, stageStatus }) => {
            receivedStageStatus = stageStatus;
            return { ...reflection(taskId, stageStatus), status: "failed", error: { summary: "ordinary stage execution failed" } };
          },
        },
      },
    )).rejects.toThrow("ordinary stage execution failed");
    expect(receivedStageStatus).toBe("failed");
    expect(JSON.parse(readFileSync(reflectionPath(state), "utf8"))).toMatchObject({ status: "failed", error: { summary: "ordinary stage execution failed" } });
    expect(availabilityFiles(state)).toEqual([]);
  });
});
