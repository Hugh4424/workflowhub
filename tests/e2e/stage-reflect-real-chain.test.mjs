import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import vm from "node:vm";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { stageRuntimeMain, stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";
import { createTaskKernel, openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const repoRoot = resolve(join(import.meta.dirname, "../.."));
const roots = [];
const envKeys = ["HOME", "XDG_CONFIG_HOME", "WORKFLOWHUB_TASK_DIR", "WORKFLOWHUB_CUTOVER_EPOCH", "WORKFLOWHUB_ENFORCE_CWD", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"];
const materials = canonicalStageMaterials();

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function git(repo, args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function writeInput(root, name, value) {
  const path = join(root, "inputs", name);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, typeof value === "string" ? value : JSON.stringify(value));
  return path;
}

function withIsolatedEnvironment(root, callback) {
  const previous = new Map(envKeys.map((key) => [key, process.env[key]]));
  const home = join(root, "home");
  const storage = join(root, "storage");
  mkdirSync(home, { recursive: true });
  mkdirSync(storage, { recursive: true });
  for (const key of envKeys) delete process.env[key];
  process.env.HOME = home;
  process.env.XDG_CONFIG_HOME = join(home, ".config");
  process.env.WORKFLOWHUB_TASK_DIR = storage;
  return Promise.resolve()
    .then(callback)
    .finally(() => {
      for (const key of envKeys) {
        if (previous.get(key) === undefined) delete process.env[key];
        else process.env[key] = previous.get(key);
      }
    });
}

async function createTask(root, project, taskId, { writeMaterials = true, inputs = null } = {}) {
  const repo = join(root, `${taskId}-repo`);
  mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub chain test"]);
  git(repo, ["config", "user.email", "chain-test@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), `${taskId}\n`);
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "fixture"]);
  const bootstrapValues = { project, task: taskId, "target-repo": repo };
  if (inputs !== null) {
    const inputPath = writeInput(root, `${taskId}-bootstrap-inputs.json`, inputs);
    bootstrapValues.inputs = inputPath;
  }
  const bootstrapped = bootstrapTask(bootstrapValues, {
    env: process.env,
    home: join(root, "home"),
    cwd: repo,
  });
  if (writeMaterials) {
    const artifactStage = { "decision-log.md": "make-decision", "spec.md": "build-spec", "plan.md": "build-plan", "tasks.md": "build-plan" };
    for (const [name, content] of Object.entries(materials)) {
      const input = writeInput(root, `${taskId}-${name}`, content);
      await stageRuntimeMain(["artifact", `--stage=${artifactStage[name]}`, `--project=${project}`, `--task=${taskId}`, `--name=${name}`, `--input=${input}`], { cwd: repo });
    }
  }
  return { ...bootstrapped, repo };
}

function reflectionExecutor({ confirmationRef, mode }) {
  return async ({ taskId, stage, stageStatus }) => {
    if (mode === "failure") throw new Error("intentional reflection executor failure");
    return {
      schema_version: "stage-reflection.v1",
      record_kind: "judgment",
      task_id: taskId,
      stage,
      stage_status: stageStatus,
      generated_at: new Date().toISOString(),
      status: "ok",
      error: null,
      judgments: [{
        subject_id: "stage-reflection",
        subject_kind: "step",
        classification: "simplify",
        severity: "medium",
        reason: mode === "validation" ? "悬空证据应进入 degraded。" : "正式入口成功完成阶段复盘。",
        evidence_refs: mode === "validation" ? ["quality/evidence/missing.md"] : [],
        confidence: mode === "validation" ? "high" : "medium",
        next_review_trigger: "下一次同类阶段完成时",
      }],
      interventions: [{
        confirmation_ref: confirmationRef,
        step_slug: "stage-reflection",
        reply_text: "继续记录当前阶段介入。",
        attribution: "human",
        confidence: "medium",
      }],
      lessons_added: [],
    };
  };
}

async function publicRun(argv, options) {
  return stageRuntimeCliMain(argv, options);
}

function readPageData(path) {
  const context = {};
  vm.runInNewContext(readFileSync(path, "utf8"), context);
  return context.__WH_MONITOR_DATA__;
}

describe("stage-reflection real producer-to-consumer chain", () => {
  it("runs success, failure, not-scheduled, and validation-failure paths through public run", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-reflect-chain-")));
    roots.push(root);
    await withIsolatedEnvironment(root, async () => {
      const project = "ChainFixture";
      const success = await createTask(root, project, "chain-success");
      const failure = await createTask(root, project, "chain-failure");
      const validation = await createTask(root, project, "chain-validation");
      const notScheduled = await createTask(root, project, "chain-not-scheduled", {
        inputs: { spec: join(root, "missing-upstream-spec.json") },
      });

      const successTask = openTask(success.task_path, project, "chain-success");
      const successWorkspace = openCurrentTaskWorkspace(successTask);
      const successArtifacts = ArtifactDir.open(successWorkspace.worktreeRoot, successTask);
      const successKernel = createTaskKernel(successTask, { workspace: successWorkspace, artifacts: successArtifacts });
      const successOutcome = writeStageOutcomeFixture({ task: successTask, kernel: successKernel, artifacts: successArtifacts, workspace: successWorkspace, stage: "build-spec", attemptId: "attempt-chain-success" });
      const successInput = writeInput(root, "success-run.json", { receipts: { stage_outcomes: successOutcome.ref }, attempt_id: "attempt-chain-success" });
      const successConfirmation = await publicRun(["confirm", "--action=decision", "--stage=build-spec", `--project=${project}`, "--task=chain-success", "--decision=accepted", "--reply-text=继续记录当前阶段介入。", "--step-slug=stage-reflection"], { cwd: success.repo });
      const successResult = await publicRun(["run", "--action=execute", "--stage=build-spec", `--project=${project}`, "--task=chain-success", `--input=${successInput}`], { cwd: success.repo, services: { stageReflectionExecutor: reflectionExecutor({ confirmationRef: successConfirmation.ref, mode: "success" }) } });
      expect(successResult).toMatchObject({ stage: "build-spec", stage_outcome_status: "completed", stage_reflection: { persisted: true } });

      const failureResult = await publicRun(["run", "--action=execute", "--stage=verify-code", `--project=${project}`, "--task=chain-failure"], { cwd: failure.repo, services: { stageReflectionExecutor: reflectionExecutor({ mode: "failure" }) } });
      expect(failureResult).toMatchObject({ stage: "verify-code", stage_reflection: { reflection_status: "failed", persisted: true } });

      await expect(publicRun(["run", "--action=execute", "--stage=build-plan", `--project=${project}`, "--task=chain-not-scheduled"], {
        cwd: notScheduled.repo,
        services: { stageReflectionExecutor: reflectionExecutor({ mode: "success" }) },
      })).rejects.toThrow();

      const validationTask = openTask(validation.task_path, project, "chain-validation");
      const validationWorkspace = openCurrentTaskWorkspace(validationTask);
      const validationArtifacts = ArtifactDir.open(validationWorkspace.worktreeRoot, validationTask);
      const validationKernel = createTaskKernel(validationTask, { workspace: validationWorkspace, artifacts: validationArtifacts });
      const validationOutcome = writeStageOutcomeFixture({ task: validationTask, kernel: validationKernel, artifacts: validationArtifacts, workspace: validationWorkspace, stage: "build-spec", attemptId: "attempt-chain-validation" });
      const validationInput = writeInput(root, "validation-run.json", { receipts: { stage_outcomes: validationOutcome.ref }, attempt_id: "attempt-chain-validation" });
      const validationConfirmation = await publicRun(["confirm", "--action=decision", "--stage=build-spec", `--project=${project}`, "--task=chain-validation", "--decision=accepted", "--reply-text=继续记录当前阶段介入。", "--step-slug=stage-reflection"], { cwd: validation.repo });
      const validationResult = await publicRun(["run", "--action=execute", "--stage=build-spec", `--project=${project}`, "--task=chain-validation", `--input=${validationInput}`], { cwd: validation.repo, services: { stageReflectionExecutor: reflectionExecutor({ confirmationRef: validationConfirmation.ref, mode: "validation" }) } });
      expect(validationResult).toMatchObject({ stage: "build-spec", stage_reflection: { persisted: true, reflection_status: "degraded" } });

      const out = join(root, "reflection-page");
      execFileSync(process.execPath, [join(repoRoot, "tools/cli/build-reflection-page.mjs"), `--root=${join(root, "storage")}`, `--tasks-root=${join(root, "storage", "Projects", project, "tasks")}`, `--out=${out}`, `--now=${new Date().toISOString()}`], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      const data = readPageData(join(out, "data.js"));
      const byId = new Map(data.tasks.map((task) => [task.task_id, task]));
      expect(byId.get("chain-success").stages.find((stage) => stage.stage === "build-spec")).toMatchObject({ state: "ok", reflection_status: "ok" });
      expect(byId.get("chain-failure").stages.find((stage) => stage.stage === "verify-code")).toMatchObject({ state: "failed", reflection_status: "failed" });
      expect(byId.get("chain-not-scheduled").stages.find((stage) => stage.stage === "build-plan")).toMatchObject({ state: "not_scheduled", judgment_layer: "fact", is_fact: true });
      const availabilityRoot = join(notScheduled.task_path, "quality/evidence/stage-reflection-availability");
      const availabilityFiles = readdirSync(availabilityRoot).filter((name) => name.endsWith(".json"));
      expect(availabilityFiles).toHaveLength(1);
      expect(JSON.parse(readFileSync(join(availabilityRoot, availabilityFiles[0]), "utf8"))).toMatchObject({ state: "not_scheduled", reason_code: "preflight_failed" });
      expect(byId.get("chain-not-scheduled").stages.find((stage) => stage.stage === "build-plan").availability_fact).toMatchObject({ state: "not_scheduled", reason_code: "preflight_failed" });
      expect(byId.get("chain-validation").stages.find((stage) => stage.stage === "build-spec")).toMatchObject({ state: "degraded", reflection_status: "degraded" });
      expect(data.evolution.candidates.some((entry) => entry.source_observations?.some((observation) => observation.task_id === "chain-success"))).toBe(false);
      expect(data.evolution.candidates.some((entry) => entry.source_observations?.some((observation) => observation.task_id === "chain-validation"))).toBe(false);
      expect(data.evolution.status).toBe("ok");
      expect(Array.isArray(data.evolution.candidates)).toBe(true);
      expect(data.source.ai_used).toBe(false);
      expect(Array.isArray(data.diagnostics)).toBe(true);
      expect(existsSync(join(success.task_path, "quality/stage-reflection/build-spec.json"))).toBe(true);
      expect(existsSync(join(validation.task_path, "quality/stage-reflection/build-spec.json"))).toBe(true);
    });
  }, 120_000);
});
