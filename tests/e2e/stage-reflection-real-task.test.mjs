import Ajv from "ajv";
import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import vm from "node:vm";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { openTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { completeCanonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const repoRoot = resolve(join(import.meta.dirname, "../.."));
const stageSchema = JSON.parse(readFileSync(join(repoRoot, "runtime/schemas/stage-reflection.v1.json"), "utf8"));
const validateReflectionSchema = new Ajv({ allErrors: true, strict: false }).compile(stageSchema);
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const roots = [];
const envKeys = [
  "HOME",
  "XDG_CONFIG_HOME",
  "WORKFLOWHUB_TASK_DIR",
  "WORKFLOWHUB_CUTOVER_EPOCH",
  "WORKFLOWHUB_ENFORCE_CWD",
  "CODEX_SESSION_ID",
  "CODEX_THREAD_ID",
  "CODEX_ROLLOUT_PATH",
  "WORKFLOWHUB_CODEX_ROLLOUT_PATH",
];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function git(repo, args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function writeInput(root, name, content) {
  const path = join(root, "inputs", name);
  mkdirSync(join(root, "inputs"), { recursive: true });
  writeFileSync(path, content, "utf8");
  return path;
}

function readData(path) {
  const context = {};
  vm.runInNewContext(readFileSync(path, "utf8"), context);
  return context.__WH_MONITOR_DATA__;
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

function reflectionExecutorFactory({ confirmationRef }) {
  return async ({ taskId, stage, stageStatus }) => {
    if (stage === "verify-code") throw new Error("real task reflection executor intentionally failed");
    return {
      schema_version: "stage-reflection.v1",
      record_kind: "judgment",
      task_id: taskId,
      stage,
      stage_status: stageStatus,
      generated_at: new Date().toISOString(),
      status: "degraded",
      error: null,
      judgments: [{
        subject_id: `${stage}-reflection`,
        subject_kind: "skill",
        classification: "optimize",
        severity: "medium",
        reason: "真实 task 通过正式入口记录阶段末复盘。",
        evidence_refs: [],
        confidence: "low",
        next_review_trigger: "下一次真实 task 复盘时",
      }],
      interventions: stage === "build-code" ? [{
        confirmation_ref: confirmationRef,
        step_slug: "real-task-confirm",
        reply_text: "确认真实 task 继续",
        attribution: "记录真实 task 的人工介入原文。",
        confidence: "high",
      }] : [],
      lessons_added: [],
    };
  };
}

describe("stage-reflection real official task path", () => {
  it("binds review-record output to the authenticated current snapshot and materials", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-record-real-")));
    roots.push(root);
    const repo = join(root, "repo");
    mkdirSync(repo);
    git(repo, ["init", "-q", "-b", "main"]);
    git(repo, ["config", "user.name", "WorkflowHub review producer test"]);
    git(repo, ["config", "user.email", "review-producer@workflowhub.local"]);
    writeFileSync(join(repo, "README.md"), "review producer fixture\n", "utf8");
    git(repo, ["add", "."]);
    git(repo, ["commit", "-qm", "fixture"]);

    await withIsolatedEnvironment(root, async () => {
      const bootstrapped = bootstrapTask({ project: "ReviewProducer", task: "current-identity", "target-repo": repo }, {
        env: process.env,
        home: join(root, "home"),
        cwd: repo,
      });
      const materials = completeCanonicalStageMaterials();
      const materialInputs = Object.fromEntries(Object.entries(materials).map(([name, content]) => [name, writeInput(root, name, content)]));
      const invoke = (argv) => stageRuntimeMain(argv, { cwd: repo });
      await invoke(["artifact", "--stage=make-decision", "--project=ReviewProducer", "--task=current-identity", "--name=decision-log.md", `--input=${materialInputs["decision-log.md"]}`]);
      await invoke(["artifact", "--stage=build-spec", "--project=ReviewProducer", "--task=current-identity", "--name=spec.md", `--input=${materialInputs["spec.md"]}`]);
      await invoke(["artifact", "--stage=build-plan", "--project=ReviewProducer", "--task=current-identity", "--name=plan.md", `--input=${materialInputs["plan.md"]}`]);
      await invoke(["artifact", "--stage=build-plan", "--project=ReviewProducer", "--task=current-identity", "--name=tasks.md", `--input=${materialInputs["tasks.md"]}`]);

      const inputPath = writeInput(root, "review-result.json", JSON.stringify({
        result: {
          status: "available",
          stage: "verify-code",
          review_track: null,
          review_kind: null,
          material_id: "1".repeat(64),
          runtime_id: "review-producer-test",
          outcome: "clean",
          provider_results: [{
            provider: "codex/luna",
            status: "completed",
            identity: { provider: "codex/luna", adapter: "codex", source_id: "review-producer-test", config_id: "review-producer-test", model: "gpt-5.6-luna" },
            error: null,
            timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
            usage: null,
            evidence_anchor_valid: [],
          }],
          findings: [],
        },
      }));
      const response = await invoke(["review-record", "--stage=verify-code", "--project=ReviewProducer", "--task=current-identity", `--input=${inputPath}`]);
      expect(response).toMatchObject({ status: "recorded" });

      const task = openTask(bootstrapped.task_path, "ReviewProducer", "current-identity");
      const workspace = openCurrentTaskWorkspace(task);
      const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
      const kernel = createTaskKernel(task, { workspace, artifacts });
      const snapshot = kernel.currentVNextSnapshot();
      const materialRevision = kernel.currentVNextMaterialRevision();
      const attempt = JSON.parse(task.readRecord(response.attempt_ref));
      const result = JSON.parse(task.readRecord(response.result_ref));
      validateSchema("attempt", attempt);
      validateSchema("result", result);
      expect(attempt.snapshot_tree).toBe(snapshot.tree);
      expect(result.snapshot_tree).toBe(snapshot.tree);
      expect(attempt.material_id).toBe("1".repeat(64));
      expect(result.material_id).toBe("1".repeat(64));
      expect(attempt.material_revision).toBe(materialRevision);
      expect(result.material_revision).toBe(materialRevision);
      expect(result.source).toEqual({
        target_commit: snapshot.head,
        base_commit: snapshot.commit,
        base_tree: snapshot.tree,
        captured_head: snapshot.head,
      });
    });
  }, 60_000);

  it("runs the official bootstrap and stage-runtime entry for all five stages", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-reflection-real-")));
    roots.push(root);
    const repo = join(root, "repo");
    mkdirSync(repo);
    git(repo, ["init", "-q", "-b", "main"]);
    git(repo, ["config", "user.name", "WorkflowHub real-task test"]);
    git(repo, ["config", "user.email", "real-task@workflowhub.local"]);
    writeFileSync(join(repo, "README.md"), "official real task fixture\n", "utf8");
    git(repo, ["add", "."]);
    git(repo, ["commit", "-qm", "fixture"]);

    await withIsolatedEnvironment(root, async () => {
      const bootstrapped = bootstrapTask({ project: "ReflectionReal", task: "official-real-task", "target-repo": repo }, {
        env: process.env,
        home: join(root, "home"),
        cwd: repo,
      });
      expect(bootstrapped.workspace.branch).toBe("task/ReflectionReal/official-real-task");
      expect(bootstrapped.task_path).toBe(join(root, "storage", "Projects", "ReflectionReal", "tasks", "official-real-task"));

      const materials = completeCanonicalStageMaterials();
      const materialInputs = Object.fromEntries(Object.entries(materials).map(([name, content]) => [name, writeInput(root, name, content)]));
      const invoke = (argv, services = {}) => stageRuntimeMain(argv, { cwd: repo, services });
      await invoke(["artifact", "--stage=make-decision", "--project=ReflectionReal", "--task=official-real-task", "--name=decision-log.md", `--input=${materialInputs["decision-log.md"]}`]);
      await invoke(["artifact", "--stage=build-spec", "--project=ReflectionReal", "--task=official-real-task", "--name=spec.md", `--input=${materialInputs["spec.md"]}`]);
      await invoke(["artifact", "--stage=build-plan", "--project=ReflectionReal", "--task=official-real-task", "--name=plan.md", `--input=${materialInputs["plan.md"]}`]);
      await invoke(["artifact", "--stage=build-plan", "--project=ReflectionReal", "--task=official-real-task", "--name=tasks.md", `--input=${materialInputs["tasks.md"]}`]);

      const makeDecisionConfirmation = await invoke([
        "confirm",
        "--stage=make-decision",
        "--project=ReflectionReal",
        "--task=official-real-task",
        "--decision=accepted",
        "--reply-text=确认真实 task 的决策继续",
        "--step-slug=approve-decision",
      ]);
      const buildPlanConfirmation = await invoke([
        "confirm",
        "--stage=build-plan",
        "--project=ReflectionReal",
        "--task=official-real-task",
        "--decision=accepted",
        "--reply-text=确认真实 task 的计划继续",
        "--step-slug=publish-plan-result",
      ]);
      const confirmed = await invoke([
        "confirm",
        "--stage=build-code",
        "--project=ReflectionReal",
        "--task=official-real-task",
        "--decision=accepted",
        "--reply-text=确认真实 task 继续",
        "--step-slug=real-task-confirm",
      ]);
      expect(confirmed.value).toMatchObject({
        schema_version: "human-confirmation.v3",
        reply_text: "确认真实 task 继续",
        step_slug: "real-task-confirm",
      });

      const task = openTask(bootstrapped.task_path, "ReflectionReal", "official-real-task");
      const workspace = openCurrentTaskWorkspace(task);
      const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
      const kernel = createTaskKernel(task, { workspace, artifacts });
      mkdirSync(join(workspace.worktreeRoot, "src"), { recursive: true });
      writeFileSync(join(workspace.worktreeRoot, "src", "app.txt"), "implemented for stage reflection\n", "utf8");
      const implementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: {} });
      const buildSnapshot = kernel.currentVNextSnapshot();
      const testOutput = "stage reflection build-code test passed\n";
      const testOutputRef = "quality/tests/output/stage-reflection-build-code.txt";
      kernel.publishCanonicalRecord(testOutputRef, testOutput);
      const testReceipt = {
        schema_version: "workflowhub-receipt.v1",
        task_id: task.identity.taskId,
        stage: "build-code",
        producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
        command: "true",
        command_hash: sha256("true"),
        exit_code: 0,
        source_digest: buildSnapshot.source_digest,
        snapshot_head: buildSnapshot.head,
        snapshot_tree: buildSnapshot.tree,
        snapshot_commit: buildSnapshot.commit,
        started_at: "2026-08-30T00:00:00.000Z",
        completed_at: "2026-08-30T00:00:01.000Z",
        output_ref: testOutputRef,
        output_hash: sha256(testOutput),
      };
      const testReceiptRaw = `${JSON.stringify(testReceipt)}\n`;
      const testReceiptRef = "quality/tests/stage-reflection-build-code.json";
      kernel.publishCanonicalRecord(testReceiptRef, testReceiptRaw);
      const buildReview = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: buildSnapshot.tree });
      const buildProofRaw = `${JSON.stringify({ verified: true, snapshot_tree: buildSnapshot.tree })}\n`;
      const buildProofRef = "quality/evidence/stage-reflection-build-code-proof.json";
      kernel.publishCanonicalRecord(buildProofRef, buildProofRaw);
      const buildProof = { ref: buildProofRef, sha256: sha256(buildProofRaw) };
      const stageOutcomes = {
        "make-decision": writeStageOutcomeFixture({
          task,
          kernel,
          artifacts,
          workspace,
          stage: "make-decision",
          attemptId: "attempt-real-make-decision",
          workflowRunId: kernel.deriveStageWorkflowRunId("make-decision"),
        }),
      };
      stageOutcomes["build-spec"] = writeStageOutcomeFixture({
        task,
        kernel,
        artifacts,
        workspace,
        stage: "build-spec",
        attemptId: "attempt-real-build-spec",
        workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"),
      });
      stageOutcomes["build-plan"] = writeStageOutcomeFixture({
        task,
        kernel,
        artifacts,
        workspace,
        stage: "build-plan",
        attemptId: "attempt-real-build-plan",
        workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"),
      });
      stageOutcomes["build-code"] = writeStageOutcomeFixture({
        task,
        kernel,
        artifacts,
        workspace,
        stage: "build-code",
        attemptId: "attempt-real-build-code",
        workflowRunId: kernel.deriveStageWorkflowRunId("build-code"),
      });
      stageOutcomes["verify-code"] = writeStageOutcomeFixture({
        task,
        kernel,
        artifacts,
        workspace,
        stage: "verify-code",
        attemptId: "attempt-real-verify-code",
        status: "unavailable",
        workflowRunId: kernel.deriveStageWorkflowRunId("verify-code"),
      });
      const stageInputPaths = Object.fromEntries(Object.entries(stageOutcomes).map(([stage, outcome]) => [
        stage,
        writeInput(root, `${stage}-run.json`, JSON.stringify({
          receipts: {
            stage_outcomes: outcome.ref,
            ...(stage === "make-decision" ? { confirmation: makeDecisionConfirmation.ref } : {}),
            ...(stage === "build-plan" ? { confirmation: buildPlanConfirmation.ref } : {}),
            ...(stage === "build-code" ? { implementation: implementation.ref, tests: testReceiptRef, review: buildReview.resultRef } : {}),
          },
          ...(stage === "build-code" ? {
            acceptance_coverage: {
              snapshot_tree: buildSnapshot.tree,
              accepted_criterion_ids: ["AC-001"],
              items: [{
                acceptance_criterion_id: "AC-001",
                status: "covered",
                evidence_refs: [buildProof],
                scenario: "stage reflection build-code execution",
                oracle: "implementation, tests, and review are current",
                actual_outcome: "stage reflection build-code passed",
                coverage_limits: "fixture only",
                implementation_anchor: { id: "reflection-implementation", path: "src/app.txt", start_line: 1, end_line: 1, role: "implementation" },
                verification_anchor: { id: "reflection-verification", path: "tasks.md", start_line: 1, end_line: 1, role: "verification" },
              }],
            },
          } : {}),
        })),
      ]));
      const services = { stageReflectionExecutor: reflectionExecutorFactory({ confirmationRef: confirmed.ref }) };
      const results = [];
      for (const stage of stages) {
        results.push(await invoke(["run", `--stage=${stage}`, "--project=ReflectionReal", "--task=official-real-task", `--input=${stageInputPaths[stage]}`], services));
      }

      expect(results).toHaveLength(5);
      expect(results[1]).toMatchObject({ stage: "build-spec", stage_outcome_status: "completed" });
      expect(results[0]).toMatchObject({ stage: "make-decision", stage_outcome_status: "completed" });
      expect(results[4]).toMatchObject({ stage: "verify-code", stage_outcome_status: "unavailable" });
      expect(results[4].stage_reflection).toMatchObject({ status: "failed", reflection_status: "failed", persisted: true });

      const taskRoot = bootstrapped.task_path;
      const reflectionValues = Object.fromEntries(stages.map((stage) => {
        const path = join(taskRoot, "quality", "stage-reflection", `${stage}.json`);
        expect(existsSync(path)).toBe(true);
        const value = JSON.parse(readFileSync(path, "utf8"));
        expect(validateReflectionSchema(value), validateReflectionSchema.errors?.map((error) => JSON.stringify(error)).join("; ")).toBe(true);
        expect(value).toMatchObject({ task_id: "official-real-task", stage });
        return [stage, value];
      }));
      expect(reflectionValues["build-spec"].stage_status).toBe("completed");
      expect(reflectionValues["verify-code"]).toMatchObject({ status: "failed", error: { summary: "real task reflection executor intentionally failed" }, lessons_added: [] });
      expect(reflectionValues["build-code"].interventions[0]).toMatchObject({ reply_text: "确认真实 task 继续", step_slug: "real-task-confirm" });

      const lessonsPath = join(root, "storage", "Projects", "ReflectionReal", "lessons");
      const lessonRows = stages.flatMap((stage) => {
        const path = join(lessonsPath, `${stage}.jsonl`);
        if (!existsSync(path)) return [];
        return readFileSync(path, "utf8").trim().split("\n").map((line) => JSON.parse(line));
      });
      expect(lessonRows.filter((entry) => entry.entry_kind === "merged_lesson")).toHaveLength(4);
      expect(lessonRows.filter((entry) => entry.entry_kind === "raw_observation" && entry.stage === "verify-code")).toEqual([
        expect.objectContaining({ merged: false }),
      ]);

      const out = join(root, "reflection-page");
      execFileSync(process.execPath, [
        join(repoRoot, "tools/cli/build-reflection-page.mjs"),
        `--root=${join(root, "storage")}`,
        `--tasks-root=${join(root, "storage", "Projects", "ReflectionReal", "tasks")}`,
        `--out=${out}`,
      ], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      const data = readData(join(out, "data.js"));
      const pageTask = data.tasks.find((entry) => entry.task_id === "official-real-task");
      expect(data.source.ai_used).toBe(false);
      expect(pageTask.coverage).toEqual({ present: 5, total: 5 });
      expect(pageTask.lessons).toHaveLength(4);
      expect(pageTask.stages.find((entry) => entry.stage === "verify-code")).toMatchObject({ state: "failed", reflection_status: "failed" });
      expect(pageTask.stages.find((entry) => entry.stage === "build-code").interventions[0]).toMatchObject({ reply_text: "确认真实 task 继续" });
    });
  }, 60_000);
});
