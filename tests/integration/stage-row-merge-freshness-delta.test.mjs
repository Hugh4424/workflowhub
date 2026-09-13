import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, readTaskFacts, writeStageRow } from "../../runtime/task/task-store.mjs";
import {
  authenticateStageOutcomeForProjection,
  runStageEndReflection,
} from "../../runtime/stage/stage-runner.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
const NOW = "2026-09-13T00:00:00.000Z";
const HASH = "a".repeat(64);

function stageState(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-row-delta-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub stage row delta tests"]);
  git(["config", "user.email", "stage-row-delta@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "stage row delta fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "StageRowDelta", task_id: taskId,
      created_at: NOW, target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  for (const [name, content] of Object.entries(canonicalStageMaterials())) artifacts.writeAtomic(name, content);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => NOW });
  const context = {
    stage: "build-code", task, kernel, identity: task.identity, manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), candidateWorkspace, artifacts, storageRoot: root,
  };
  const outcome = writeStageOutcomeFixture({
    task, kernel, artifacts, workspace: candidateWorkspace, stage: "build-code", attemptId: "stage-row-delta-attempt",
  });
  const source = authenticateStageOutcomeForProjection(context, "build-code", outcome.ref);
  return { root, task, kernel, artifacts, candidateWorkspace, context, source };
}

function judgmentFor(state) {
  return {
    schema_version: "stage-reflection.v2",
    record_kind: "judgment",
    task_id: state.task.identity.taskId,
    stage: "build-code",
    stage_status: "completed",
    generated_at: NOW,
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "stage-row-delta",
      subject_kind: "step",
      classification: "keep",
      severity: "low",
      reason: "The current stage outcome is available for the merge regression.",
      evidence_refs: [state.source.ref],
      confidence: "medium",
      next_review_trigger: "next current stage outcome",
    }],
    interventions: [],
    lessons_added: [],
    status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"]
      .map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
    identity: {
      task_id: state.task.identity.taskId,
      worktree: state.candidateWorkspace.worktreeRoot,
      branch: state.candidateWorkspace.branch,
      attempt: state.source.value.attempt_id,
      snapshot_tree: state.source.value.snapshot_tree,
      material_revision: state.source.value.material_revision,
    },
    executor: {
      kind: "fixture-reflection-executor",
      source_id: "fixture/stage-row-delta",
      attempt_id: state.source.value.attempt_id,
      started_at: "2026-09-13T00:00:01.000Z",
      completed_at: "2026-09-13T00:00:02.000Z",
      output_hash: HASH,
    },
    output_hash: HASH,
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture", unknown_reasons: [] },
  };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage row merge freshness delta", () => {
  it("retains conducted review and reflection refs when a later unavailable stage end arrives", async () => {
    const state = stageState("stage-row-merge-freshness");
    const first = await runStageEndReflection(state.context, {
      stageStatus: "completed",
      judgment: judgmentFor(state),
      stageOutcome: state.source,
      now: NOW,
    });
    expect(first.stage_row_error).toBeUndefined();

    const before = readTaskFacts(state.task.taskPath)[0];
    const reflectionRef = before.spec_analyze.value.ref;
    const reviewRef = `quality/reviews/results/${"b".repeat(64)}.json`;
    writeStageRow(state.task.taskPath, {
      ...before,
      review_origin: "conducted",
      review_result_ref: { value: reviewRef },
      finding_dispositions: [{ finding: "F-C6", disposition: "fixed" }],
    });

    const unavailable = await runStageEndReflection(state.context, {
      stageStatus: "completed",
      stageOutcome: state.source,
      availabilityState: "unavailable",
      reasonCode: "executor_absent",
      now: NOW,
    });
    expect(unavailable.status).toBe("unavailable");

    const after = readTaskFacts(state.task.taskPath);
    expect(after).toHaveLength(1);
    expect(after[0].review_origin).toBe("conducted");
    expect(after[0].review_result_ref).toEqual({ value: reviewRef });
    expect(after[0].finding_dispositions).toEqual([{ finding: "F-C6", disposition: "fixed" }]);
    expect(after[0].spec_analyze.value.ref).toBe(reflectionRef);
  });

  it("runs close preflight before the close lock and any physical executor", async () => {
    const source = readFileSync(new URL("../../core/task-close.mjs", import.meta.url), "utf8");
    const executeStart = source.indexOf("export async function executeClosePlan");
    const preflight = source.indexOf("preflightCloseExecution({ task, plan, delivery });", executeStart);
    const lock = source.indexOf('task.withRecordLock("locks/close.execution.lock"', executeStart);
    expect(executeStart).toBeGreaterThanOrEqual(0);
    expect(preflight).toBeGreaterThan(executeStart);
    expect(lock).toBeGreaterThan(preflight);
  });
});
