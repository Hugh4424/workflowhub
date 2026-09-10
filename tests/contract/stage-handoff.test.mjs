import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runStageEndReflection, runOfficialStage, authenticateStageOutcomeForProjection } from "../../runtime/stage/stage-runner.mjs";
import { renderStageHandoff, publishStageHandoff, SECTION_TITLES } from "../../runtime/stage/stage-handoff.mjs";
import { publishStageReflectionExecutionFailure, validateStageReflectionSibling } from "../../runtime/stage/stage-reflect.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
const NOW = "2026-09-10T00:00:00.000Z";
const HASH = "a".repeat(64);

function fixture(taskId, stage = "build-spec") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-handoff-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub handoff tests"]);
  git(["config", "user.email", "handoff@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "stage handoff fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "StageHandoff", task_id: taskId,
      created_at: NOW, target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  for (const [name, content] of Object.entries(canonicalStageMaterials())) artifacts.writeAtomic(name, content);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => NOW });
  const context = {
    stage, task, kernel, identity: task.identity, manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId(stage), candidateWorkspace, workspace, artifacts, storageRoot: root,
  };
  const outcome = writeStageOutcomeFixture({ task, kernel, artifacts, workspace: candidateWorkspace, stage, attemptId: `${stage}-attempt` });
  const source = authenticateStageOutcomeForProjection(context, stage, outcome.ref);
  return { root, task, kernel, artifacts, candidateWorkspace, context, outcome, source };
}

function judgmentFor(state, overrides = {}) {
  const { context, source } = state;
  const stage = context.stage;
  return {
    schema_version: "stage-reflection.v2",
    record_kind: "judgment",
    task_id: context.identity.taskId,
    stage,
    stage_status: "completed",
    generated_at: NOW,
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "stage-handoff-fixture",
      subject_kind: "step",
      classification: "keep",
      severity: "low",
      reason: "The current stage outcome is available for a deterministic contract fixture.",
      evidence_refs: [source.ref],
      confidence: "medium",
      next_review_trigger: "next current stage outcome",
    }],
    interventions: [],
    lessons_added: [],
    status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"]
      .map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
    identity: {
      task_id: context.identity.taskId,
      worktree: context.candidateWorkspace.worktreeRoot,
      branch: context.candidateWorkspace.branch,
      attempt: source.value.attempt_id,
      snapshot_tree: source.value.snapshot_tree,
      material_revision: source.value.material_revision,
    },
    executor: {
      kind: "session-memory",
      source_id: "fixture/session-memory",
      attempt_id: source.value.attempt_id,
      started_at: "2026-09-10T00:00:01.000Z",
      completed_at: "2026-09-10T00:00:02.000Z",
      output_hash: HASH,
    },
    output_hash: HASH,
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture", unknown_reasons: [] },
    ...overrides,
  };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage-handoff current view contract", () => {
  it("renders the fixed banner and all thirteen ordered sections", () => {
    const raw = renderStageHandoff({
      taskId: "task-1", stage: "build-spec", snapshotTree: "tree-1",
      materialScopeRevision: "revision-1", reflectionStatus: "completed",
      nextAction: "继续读取当前材料",
    });
    expect(raw).toContain("非权威 current handoff，只以四材料和正式质量原件为准");
    expect([...raw.matchAll(/^## (\d+)\. (.+)$/gm)].map((match) => match[2])).toEqual(SECTION_TITLES);
  });

  it("publishes by atomic overwrite, reads back current identity, and returns an absolute path", () => {
    const state = fixture("handoff-overwrite");
    const first = publishStageHandoff({
      task: state.task, kernel: state.kernel, artifacts: state.artifacts, taskId: state.context.identity.taskId, stage: "build-spec",
      snapshotTree: state.source.value.snapshot_tree,
      materialScopeRevision: state.source.value.material_scope_revision,
      reflectionStatus: "completed", stageOutcome: state.source,
      materials: Object.fromEntries(Object.entries(canonicalStageMaterials())), nextAction: "第一次下一步",
    });
    const firstRaw = state.task.readRecord(first.ref);
    const second = publishStageHandoff({
      task: state.task, kernel: state.kernel, artifacts: state.artifacts, taskId: state.context.identity.taskId, stage: "build-spec",
      snapshotTree: state.source.value.snapshot_tree,
      materialScopeRevision: state.source.value.material_scope_revision,
      reflectionStatus: "failed", stageOutcome: state.source,
      materials: Object.fromEntries(Object.entries(canonicalStageMaterials())), nextAction: "第二次下一步",
    });
    expect(second.path).toBe(first.path);
    expect(second.current).toBe(true);
    expect(second.sha256).not.toBe(first.sha256);
    expect(state.task.readRecord(second.ref)).not.toBe(firstRaw);
    expect(state.task.readRecord(second.ref)).toContain("第二次下一步");
    expect(state.task.readRecord(second.ref)).toContain('"ref":"decision-log.md"');
    expect(state.task.readRecord(second.ref)).not.toContain('"ref":"materials/');
    expect(second.path.startsWith(state.task.taskPath)).toBe(true);
  });

  it("does not let an older retry overwrite the newer current handoff", () => {
    const state = fixture("handoff-attempt-order");
    const olderOutcome = writeStageOutcomeFixture({
      task: state.task,
      kernel: state.kernel,
      artifacts: state.artifacts,
      workspace: state.candidateWorkspace,
      stage: "build-spec",
      attemptId: "attempt-1",
    });
    const newerOutcome = writeStageOutcomeFixture({
      task: state.task,
      kernel: state.kernel,
      artifacts: state.artifacts,
      workspace: state.candidateWorkspace,
      stage: "build-spec",
      attemptId: "attempt-2",
    });
    const older = authenticateStageOutcomeForProjection(state.context, "build-spec", olderOutcome.ref);
    const newer = authenticateStageOutcomeForProjection(state.context, "build-spec", newerOutcome.ref);
    const common = {
      task: state.task, kernel: state.kernel, artifacts: state.artifacts,
      taskId: state.context.identity.taskId, stage: "build-spec",
      snapshotTree: newer.value.snapshot_tree,
      materialScopeRevision: newer.value.material_scope_revision,
      reflectionStatus: "completed",
      materials: Object.fromEntries(Object.entries(canonicalStageMaterials())),
    };
    const current = publishStageHandoff({ ...common, stageOutcome: newer, nextAction: "较新 retry" });
    expect(current.current).toBe(true);
    expect(() => publishStageHandoff({ ...common, stageOutcome: older, nextAction: "较旧 retry" }))
      .toThrow(/older than the current handoff outcome/);
    expect(state.task.readRecord(current.ref)).toContain("较新 retry");
  });

  it("does not infer chronology from opaque retry ids", () => {
    const state = fixture("handoff-opaque-attempt-order");
    const newerOutcome = writeStageOutcomeFixture({
      task: state.task,
      kernel: state.kernel,
      artifacts: state.artifacts,
      workspace: state.candidateWorkspace,
      stage: "build-spec",
      attemptId: "opaque-new-run",
    });
    const olderOutcome = writeStageOutcomeFixture({
      task: state.task,
      kernel: state.kernel,
      artifacts: state.artifacts,
      workspace: state.candidateWorkspace,
      stage: "build-spec",
      attemptId: "opaque-old-run",
    });
    const newer = authenticateStageOutcomeForProjection(state.context, "build-spec", newerOutcome.ref);
    const older = authenticateStageOutcomeForProjection(state.context, "build-spec", olderOutcome.ref);
    const common = {
      task: state.task, kernel: state.kernel, artifacts: state.artifacts,
      taskId: state.context.identity.taskId, stage: "build-spec",
      snapshotTree: newer.value.snapshot_tree,
      materialScopeRevision: newer.value.material_scope_revision,
      reflectionStatus: "completed",
      materials: Object.fromEntries(Object.entries(canonicalStageMaterials())),
    };
    const current = publishStageHandoff({ ...common, stageOutcome: newer, nextAction: "opaque newer retry" });
    expect(() => publishStageHandoff({ ...common, stageOutcome: older, nextAction: "opaque late retry" }))
      .toThrow(/older than the current handoff outcome|authenticated ordering/);
    expect(state.task.readRecord(current.ref)).toContain("opaque newer retry");
  });

  it("rejects caller-declared identity and unreadable source refs", () => {
    const state = fixture("handoff-authentication");
    const common = {
      task: state.task, kernel: state.kernel, artifacts: state.artifacts,
      taskId: state.context.identity.taskId, stage: "build-spec",
      snapshotTree: state.source.value.snapshot_tree,
      materialScopeRevision: state.source.value.material_scope_revision,
      reflectionStatus: "completed", stageOutcome: state.source,
      materials: Object.fromEntries(Object.entries(canonicalStageMaterials())), nextAction: "继续",
    };
    expect(() => publishStageHandoff({ ...common, taskId: "foreign-task" })).toThrow(/task identity mismatch/);
    expect(() => publishStageHandoff({ ...common, snapshotTree: "f".repeat(40) })).toThrow(/snapshot is not current/);
    expect(() => publishStageHandoff({ ...common, sourceRefs: [{ ref: "quality/evidence/missing.json", sha256: HASH }] })).toThrow(/ENOENT|missing/i);
  });

  it("rejects a task-local stage outcome that is not a canonical authenticated outcome", () => {
    const state = fixture("handoff-forged-outcome");
    const ref = "quality/evidence/foreign-outcome.json";
    const raw = JSON.stringify({
      schema_version: "workflowhub-stage-outcomes.v1",
      task_id: state.context.identity.taskId,
      stage: "build-spec",
      run_id: state.kernel.deriveStageWorkflowRunId("build-spec"),
      attempt_id: "forged-attempt",
      producer: { source_id: "fixture/forged", agent_run_id: "forged-run" },
      snapshot_tree: state.source.value.snapshot_tree,
      material_scope_revision: state.source.value.material_scope_revision,
    });
    state.kernel.publishCanonicalRecord(ref, raw);
    expect(() => publishStageHandoff({
      task: state.task, kernel: state.kernel, artifacts: state.artifacts,
      taskId: state.context.identity.taskId, stage: "build-spec",
      snapshotTree: state.source.value.snapshot_tree,
      materialScopeRevision: state.source.value.material_scope_revision,
      reflectionStatus: "completed",
      stageOutcome: { ref, sha256: "a".repeat(64) },
      materials: Object.fromEntries(Object.entries(canonicalStageMaterials())), nextAction: "继续",
    })).toThrow(/canonical for the current stage|hash mismatch/);
  });

  it("rejects a reflection source bound to a foreign outcome attempt", () => {
    const state = fixture("handoff-forged-reflection");
    const reflection = judgmentFor(state, {
      identity: { ...judgmentFor(state).identity, attempt: "foreign-attempt" },
      executor: { ...judgmentFor(state).executor, attempt_id: "foreign-attempt" },
    });
    const raw = `${JSON.stringify(reflection)}\n`;
    const ref = `quality/stage-reflection/build-spec/${createHash("sha256").update(raw).digest("hex")}.json`;
    state.kernel.publishCanonicalRecord(ref, raw);
    expect(() => publishStageHandoff({
      task: state.task, kernel: state.kernel, artifacts: state.artifacts,
      taskId: state.context.identity.taskId, stage: "build-spec",
      snapshotTree: state.source.value.snapshot_tree,
      materialScopeRevision: state.source.value.material_scope_revision,
      reflectionStatus: "completed", stageOutcome: state.source,
      stageReflection: { ref, sha256: createHash("sha256").update(raw).digest("hex") },
      materials: Object.fromEntries(Object.entries(canonicalStageMaterials())), nextAction: "继续",
    })).toThrow(/reflection source does not bind the current identity/);
  });

  it("rejects a stale v1 execution failure bound to an older stage outcome", () => {
    const state = fixture("handoff-stale-v1-failure");
    const staleFailure = publishStageReflectionExecutionFailure(state.context, {
      stageStatus: "completed",
      generatedAt: NOW,
      error: new Error("old reflection executor failed"),
      stageOutcome: state.source,
    });
    expect(JSON.parse(state.task.readRecord(staleFailure.ref))).toMatchObject({
      schema_version: "stage-reflection.v1",
      status: "failed",
      source: { ref: state.source.ref, sha256: state.source.sha256 },
    });

    state.artifacts.writeAtomic("spec.md", `${state.artifacts.read("spec.md")}\nCurrent revision.\n`);
    const currentOutcome = writeStageOutcomeFixture({
      task: state.task,
      kernel: state.kernel,
      artifacts: state.artifacts,
      workspace: state.candidateWorkspace,
      stage: "build-spec",
      attemptId: "build-spec-current-attempt",
    });
    const currentSource = authenticateStageOutcomeForProjection(state.context, "build-spec", currentOutcome.ref);
    const materials = Object.fromEntries(
      ["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => [name, state.artifacts.read(name)]),
    );

    expect(() => publishStageHandoff({
      task: state.task,
      kernel: state.kernel,
      artifacts: state.artifacts,
      taskId: state.context.identity.taskId,
      stage: "build-spec",
      snapshotTree: currentSource.value.snapshot_tree,
      materialScopeRevision: currentSource.value.material_scope_revision,
      reflectionStatus: "failed",
      stageOutcome: currentSource,
      stageReflection: { ref: staleFailure.ref, sha256: staleFailure.sha256 },
      materials,
      nextAction: "继续",
    })).toThrow(/reflection failure source is not authenticated/);
  });

  it("consumes a host sibling after stage publication and keeps handoff failure isolated", async () => {
    const state = fixture("handoff-sibling");
    const judgment = judgmentFor(state);
    expect(validateStageReflectionSibling(judgment, {
      taskId: state.context.identity.taskId,
      stage: state.context.stage,
      stageStatus: "completed",
      stageOutcome: state.source,
      worktree: state.candidateWorkspace.worktreeRoot,
      materialRevision: state.source.value.material_revision,
      snapshotTree: state.source.value.snapshot_tree,
    }).executor.source_id).toBe("fixture/session-memory");

    const result = await runStageEndReflection(state.context, {
      stageStatus: "completed", judgment, stageOutcome: state.source, now: NOW,
    });
    expect(result).toMatchObject({ status: "completed", persisted: true });
    expect(["ok", "degraded"]).toContain(result.reflection_status);
    expect(result.stage_handoff).toMatchObject({ status: "published", current: true, ref: "quality/evidence/handoff/build-spec.md" });
    expect(readFileSync(join(state.task.taskPath, result.stage_handoff.ref), "utf8")).toContain("## 13. 可自行判断与必须问用户的边界");
    expect(JSON.parse(state.task.readRecord(result.ref)).executor.source_id).toBe("fixture/session-memory");
  });

  it("does not accept a sibling with a foreign attempt or output hash", async () => {
    const state = fixture("handoff-invalid-sibling");
    const judgment = judgmentFor(state, {
      identity: { ...judgmentFor(state).identity, attempt: "foreign-attempt" },
    });
    const result = await runStageEndReflection(state.context, {
      stageStatus: "completed", judgment, stageOutcome: state.source, now: NOW,
    });
    expect(result).toMatchObject({
      status: "failed", reflection_status: "failed", persisted: true,
      stage_handoff: { status: "published", reflection_status: "failed" },
    });
    expect(JSON.parse(state.task.readRecord(result.ref))).toMatchObject({ schema_version: "stage-reflection.v1", status: "failed" });
  });

  it("keeps the sibling out of the official handler and consumes it after publication", async () => {
    const state = fixture("official-sibling");
    const judgment = judgmentFor(state);
    let observedInput;
    const result = await runOfficialStage(
      "build-spec",
      state.context,
      {
        attempt_id: state.source.value.attempt_id,
        receipts: { stage_outcomes: state.source.ref },
        stage_reflection: judgment,
      },
      {
        runStageReflection: async ({ input }) => {
          observedInput = input;
          return input;
        },
      },
      { requireStageOutcome: true },
    );
    expect(observedInput).toBeUndefined();
    expect(result.stage_reflection).toMatchObject({ status: "completed", persisted: true });
    expect(result.stage_handoff).toMatchObject({ status: "published", current: true });
    expect(result.stage_outcome_ref).toBe(state.source.ref);
  });
});
