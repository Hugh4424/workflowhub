import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runStage } from "../../runtime/stage/stage-runner.mjs";

const roots = [];
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-end-reflection-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "StageReflection",
      task_id: taskId,
      created_at: "2026-08-30T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  for (const material of MATERIALS) artifacts.writeAtomic(material, `# ${material}\n`);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  const context = {
    stage: "build-spec",
    task,
    kernel,
    identity: task.identity,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"),
    manifest: task.manifest,
    candidateWorkspace,
    artifacts,
  };
  return { root, task, kernel, context };
}

function reflection({ taskId, stageStatus, ...overrides }) {
  return {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: taskId,
    stage: "build-spec",
    stage_status: stageStatus,
    generated_at: "2026-08-30T00:00:00.000Z",
    status: "ok",
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
    ...overrides,
  };
}

function lessonPath(state) {
  return join(state.root, "Projects", "StageReflection", "lessons", "build-spec.jsonl");
}

async function runReflection(state, stageStatus, execute, options = {}) {
  return runStage(
    "build-spec",
    state.context,
    async () => ({ facts: {} }),
    {},
    { stageReflection: { stageStatus, execute, ...options } },
  );
}

describe("stage-runner on_stage_end reflection scheduling", () => {
  it("runs the declared reflection after a failed stage and keeps its own failure nonblocking", async () => {
    const failedStage = fixture("stage-ended-failed");
    let executed = 0;
    const failedStageResult = await runReflection(failedStage, "failed", async ({ taskId, stageStatus }) => {
      executed += 1;
      return reflection({ taskId, stageStatus });
    });
    expect(executed).toBe(1);
    expect(failedStageResult.stage_reflection).toMatchObject({ status: "completed", step_status: "completed" });

    const reflectionFailure = fixture("reflection-failed-nonblocking");
    const result = await runReflection(reflectionFailure, "completed", async () => {
      throw new Error("reflection executor failed");
    });
    expect(result.status).not.toBe("failed");
    expect(result.stage_reflection).toMatchObject({ status: "failed", step_status: "failed" });
    expect(result.stage_reflection.error).toMatch(/reflection executor failed/);
  });

  it("runs the reflection for a completed stage and appends raw lessons before execution", async () => {
    const state = fixture("stage-ended-completed");
    let lessonSeenBeforeExecutor = false;
    const result = await runReflection(state, "completed", async ({ taskId, stageStatus }) => {
      lessonSeenBeforeExecutor = existsSync(lessonPath(state));
      return reflection({ taskId, stageStatus });
    });

    expect(result.stage_reflection).toMatchObject({ status: "completed", step_status: "completed" });
    expect(lessonSeenBeforeExecutor).toBe(true);
    expect(readFileSync(lessonPath(state), "utf8").trim()).toMatch(/"entry_kind":"raw_observation"/);
  });

  it("records a raw-lesson prelude failure as a failed reflection", async () => {
    const state = fixture("reflection-prelude-failed");
    mkdirSync(join(state.root, "Projects", "StageReflection"), { recursive: true });
    writeFileSync(join(state.root, "Projects", "StageReflection", "lessons"), "not a directory\n");
    const result = await runReflection(state, "completed", async ({ taskId, stageStatus }) => reflection({ taskId, stageStatus }));
    expect(result.stage_reflection).toMatchObject({
      status: "failed",
      step_status: "failed",
      reflection_status: "failed",
      persisted: true,
    });
    expect(JSON.parse(state.task.readRecord("quality/stage-reflection/build-spec.json"))).toMatchObject({
      status: "failed",
      error: { summary: expect.stringMatching(/lessons must be a directory/i) },
      lessons_added: [],
    });
  });

  it.each([
    ["not-started", undefined],
    ["timeout", async () => { throw new Error("reflection timeout"); }],
    ["failed", async () => { throw new Error("reflection failed"); }],
  ])("keeps the machine raw observation when reflection is %s", async (_scenario, execute) => {
    const state = fixture(`raw-prelude-${_scenario}`);
    await runReflection(state, "failed", execute);
    const raw = readFileSync(lessonPath(state), "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(raw).toHaveLength(1);
    expect(raw[0]).toMatchObject({
      entry_kind: "raw_observation",
      task_id: state.task.identity.taskId,
      stage: "build-spec",
      reflection_ref: "quality/stage-reflection/build-spec.json",
      merged: false,
    });
  });

  it("does not report a failed record as a successful reflection and preserves fixed-path conflicts", async () => {
    const failedRecord = fixture("reflection-record-failed");
    const failed = await runReflection(failedRecord, "completed", async ({ taskId, stageStatus }) => reflection({
      taskId,
      stageStatus,
      status: "failed",
      error: { summary: "recorded reflection failure" },
    }));
    expect(failed.stage_reflection).toMatchObject({
      status: "failed",
      step_status: "failed",
      reflection_status: "failed",
      persisted: true,
    });

    const conflict = await runReflection(failedRecord, "completed", async ({ taskId, stageStatus }) => reflection({
      taskId,
      stageStatus,
      generated_at: "2026-08-31T00:00:00.000Z",
    }));
    expect(conflict.stage_reflection).toMatchObject({
      status: "failed",
      step_status: "failed",
      persisted: false,
      ref: null,
    });
    expect(conflict.stage_reflection.error).toMatch(/EEXIST|different|conflict/i);
    const lessons = readFileSync(lessonPath(failedRecord), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(lessons).toHaveLength(2);
    expect(lessons.every((entry) => entry.entry_kind === "raw_observation" && entry.merged === false)).toBe(true);
  });

  it("preserves the original stage error when the non-blocking reflection also fails", async () => {
    const state = fixture("stage-error-preserved");
    await expect(runStage(
      "build-spec",
      state.context,
      async () => { throw new Error("original stage failure"); },
      {},
      { stageReflection: { execute: async () => { throw new Error("reflection failure"); } } },
    )).rejects.toMatchObject({ message: "original stage failure", reflection_error: "reflection failure" });
  });

  it("passes a low-level stage failure diagnostic into the reflection input", async () => {
    const state = fixture("stage-error-reflection-input");
    let reflectionInput;
    await expect(runStage(
      "build-spec",
      state.context,
      async () => {
        const error = new Error("original stage failure");
        error.code = "STAGE_HANDLER_BROKE";
        throw error;
      },
      {},
      {
        stageReflection: {
          execute: async (input) => {
            reflectionInput = input;
            return reflection({ taskId: input.taskId, stageStatus: input.stageStatus });
          },
        },
      },
    )).rejects.toMatchObject({ message: "original stage failure" });

    expect(reflectionInput).toMatchObject({
      stageStatus: "failed",
      stageOutcome: null,
      stageOutcomeDiagnostic: {
        status: "failed",
        reason: "stage_handler_failed",
        error_code: "STAGE_HANDLER_BROKE",
        error_summary: "original stage failure",
      },
    });
    expect(readFileSync(lessonPath(state), "utf8")).toContain("original stage failure");
  });

  it("passes a publication failure diagnostic into the reflection input", async () => {
    const state = fixture("stage-publication-reflection-input");
    let reflectionInput;
    await expect(runStage(
      "build-spec",
      state.context,
      async () => {
        state.context.artifacts.writeAtomic("spec.md", "# changed after preflight\n");
        return { facts: {} };
      },
      {},
      {
        stageReflection: {
          execute: async (input) => {
            reflectionInput = input;
            return reflection({ taskId: input.taskId, stageStatus: input.stageStatus });
          },
        },
      },
    )).rejects.toMatchObject({ code: "FORMAL_SNAPSHOT_MISMATCH" });

    expect(reflectionInput).toMatchObject({
      stageStatus: "failed",
      stageOutcomeDiagnostic: {
        status: "failed",
        reason: "stage_publication_failed",
        error_code: "FORMAL_SNAPSHOT_MISMATCH",
      },
    });
    expect(reflectionInput.stageOutcomeDiagnostic.error_summary).toMatch(/FORMAL_SNAPSHOT_MISMATCH/);
  });

  it("bounds a hung reflection and keeps the stage result nonblocking", async () => {
    const state = fixture("reflection-timeout");
    const result = await runReflection(state, "completed", () => new Promise(() => {}), { timeoutMs: 10 });
    expect(result.status).not.toBe("failed");
    expect(result.stage_reflection).toMatchObject({
      status: "failed",
      step_status: "failed",
      reflection_status: "failed",
      persisted: true,
    });
    expect(result.stage_reflection.error).toMatch(/timed out after 10ms/);
  }, 15_000);
});
