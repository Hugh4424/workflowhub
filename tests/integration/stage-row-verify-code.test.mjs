import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, readTaskFacts, STAGE_ROW_KEYS, LAYER_STATE_VALUES } from "../../runtime/task/task-store.mjs";
import { runStageEndReflection, authenticateStageOutcomeForProjection } from "../../runtime/stage/stage-runner.mjs";
import { STAGE_HANDOFF_STAGES } from "../../runtime/stage/stage-handoff.mjs";
import { deriveStageOutcomeStatuses, stageMaterialScopeRevision, stageMaterialScopeRevisions } from "../../runtime/stage/completion-predicates.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

const roots = [];
const NOW = "2026-09-11T00:00:00.000Z";
const HASH = "a".repeat(64);
const STAGE = "verify-code";
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const SHA256 = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40,64}$/;
/**
 * The declared handoff table of specs/<task-id>/plan.md, reduced to the three
 * HANDOFF rows this repository's own task declares. verify-code must not turn
 * these into its own row facts.
 */
const DECLARED_HANDOFF_TABLE = [
  "| 未决/交接 | owner | trigger | handoff / consumer | close / retain condition |",
  "| --- | --- | --- | --- | --- |",
  "| HANDOFF-001 | 任务ⅡC5 | C3合入后 | C5实现者 | identity/path-cards不再产生写入；本任务仅登记不删除 |",
  "| HANDOFF-002 | 任务ⅡC4与3rd-review | C4开工 | C4实现者及审查调用方 | 同材料改协议可重跑，不再REQUEST_ID_CONFLICT |",
  "| HANDOFF-003 | 宿主 | 宿主行为变化 | build-code使用者 | 宿主不再按phase建立worktree |",
];

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

/**
 * A real vnext task store with a real worktree, the four current materials and
 * one authenticated verify-code stage outcome.
 */
function verifyCodeState(taskId, { planDeclaresHandoff = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-row-verify-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub stage row tests"]);
  git(["config", "user.email", "stage-row@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "verify-code stage row fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "StageRow", task_id: taskId,
      created_at: NOW, target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  const materials = { ...canonicalStageMaterials() };
  if (planDeclaresHandoff) materials["plan.md"] = `${materials["plan.md"]}\n${DECLARED_HANDOFF_TABLE.join("\n")}\n`;
  for (const [name, content] of Object.entries(materials)) artifacts.writeAtomic(name, content);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => NOW });
  const context = {
    stage: STAGE, task, kernel, identity: task.identity, manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId(STAGE), candidateWorkspace, artifacts, storageRoot: root,
  };
  // A completed verify-code stage outcome is only authentic when it binds the
  // real dsh-code-review result, so the fixture publishes that chain first.
  const snapshotTree = kernel.currentVNextSnapshot().tree;
  const materialRevision = kernel.currentVNextMaterialRevision();
  const qualityReview = writeFormalReviewFixture({ task, stage: STAGE, snapshotTree, materialRevision });
  const outcome = writeStageOutcomeFixture({
    task, kernel, artifacts, workspace: candidateWorkspace, stage: STAGE,
    attemptId: "stage-row-verify-attempt", qualityReview: { ref: qualityReview.resultRef },
  });
  const source = authenticateStageOutcomeForProjection(context, STAGE, outcome.ref);
  return { root, task, kernel, artifacts, candidateWorkspace, context, source, qualityReview };
}

function judgmentFor(state) {
  const { context, source } = state;
  return {
    schema_version: "stage-reflection.v2",
    record_kind: "judgment",
    task_id: context.identity.taskId,
    stage: STAGE,
    stage_status: "completed",
    generated_at: NOW,
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "stage-row-verify-code-fixture",
      subject_kind: "step",
      classification: "keep",
      severity: "low",
      reason: "The current verify-code stage outcome is available for a deterministic contract fixture.",
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
      kind: "fixture-reflection-executor",
      source_id: "fixture/stage-row-verify-reflection",
      attempt_id: source.value.attempt_id,
      started_at: "2026-09-11T00:00:01.000Z",
      completed_at: "2026-09-11T00:00:02.000Z",
      output_hash: HASH,
    },
    output_hash: HASH,
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture", unknown_reasons: [] },
  };
}

/** Drive the real stage-end entrypoint that production schedules for verify-code. */
function runVerifyCodeStageEnd(state, options = {}) {
  return runStageEndReflection(state.context, {
    stageStatus: "completed",
    judgment: judgmentFor(state),
    stageOutcome: state.source,
    now: NOW,
    ...options,
  });
}

/** The current bindings the status projection compares a stage row against. */
function currentBindings(state) {
  return {
    snapshot_tree: state.kernel.currentVNextSnapshot().tree,
    material_revision: state.kernel.currentVNextMaterialRevision(),
    material_scope_revisions: stageMaterialScopeRevisions(Object.fromEntries(MATERIALS.map((name) => [
      name,
      state.artifacts.read(name),
    ]))),
    snapshot_root: state.candidateWorkspace.worktreeRoot,
  };
}

describe("verify-code owns one current stage row", () => {
  it("writes exactly one verify-code stage row through the real stage-end entrypoint", async () => {
    const state = verifyCodeState("stage-row-verify-code");
    const bindings = currentBindings(state);
    const expectedMaterialDigest = stageMaterialScopeRevision(STAGE, Object.fromEntries(MATERIALS
      .map((name) => [name, state.artifacts.read(name)]))).replace(/^revision-/, "");

    const result = await runVerifyCodeStageEnd(state);

    // The stage-end write must not report a row error, and verify-code still
    // publishes no handoff at all.
    expect(result.stage_row_error).toBeUndefined();
    expect(result).not.toHaveProperty("stage_handoff");

    const rows = readTaskFacts(state.task.taskPath);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    // The frozen 16-key row contract with no extra key.
    expect(Object.keys(row).sort()).toEqual([...STAGE_ROW_KEYS].sort());
    expect(row.record_kind).toBe("stage");
    expect(row.stage).toBe(STAGE);
    expect(row.task_id).toBe(state.task.identity.taskId);
    expect(row.source).toBe("stage-end:verify-code");
    // A stage row must carry a real material digest and a real snapshot tree.
    expect(row.material_digest).toEqual({ value: expectedMaterialDigest });
    expect(row.material_digest.value).toMatch(SHA256);
    expect(row.snapshot_tree.value).toMatch(TREE);
    expect(row.snapshot_tree.value).toBe(bindings.snapshot_tree);
    // Four independent layer states, each one of the four frozen machine values.
    expect(Object.keys(row.layer_states).sort()).toEqual(
      ["delivery", "implementation_completion", "stage_quality", "task_closure"].sort(),
    );
    for (const layer of Object.values(row.layer_states)) expect(LAYER_STATE_VALUES).toContain(layer);
    expect(row.layer_states).toEqual({
      implementation_completion: "completed",
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    });
    // The handoff field is the contract's empty-with-reason encoding.
    expect(row.handoff.value).toBeNull();
    expect(Object.keys(row.handoff).sort()).toEqual(["reason", "value"]);
    expect(typeof row.handoff.reason).toBe("string");
    expect(row.handoff.reason.trim()).not.toBe("");
    expect(row.close_action.value).toBeNull();
  });

  it("feeds the status projection from the verify-code row instead of an absent row", async () => {
    const state = verifyCodeState("stage-row-verify-code-status");
    expect(await runVerifyCodeStageEnd(state)).not.toHaveProperty("stage_row_error");
    const bindings = currentBindings(state);
    const project = () => deriveStageOutcomeStatuses({
      task_id: state.task.identity.taskId,
      read: state.task.readRecord,
      stage_outcome_refs: { [STAGE]: state.task.listCanonicalStageOutcomeRefs(STAGE) },
      snapshot_tree: bindings.snapshot_tree,
      material_revision: bindings.material_revision,
      material_scope_revisions: bindings.material_scope_revisions,
      snapshot_root: bindings.snapshot_root,
      authenticate: () => null,
      read_task_facts: () => readTaskFacts(state.task.taskPath),
    });

    // Before the row exists the record honestly reports the missing row.
    const withoutRow = deriveStageOutcomeStatuses({
      task_id: state.task.identity.taskId,
      read: state.task.readRecord,
      stage_outcome_refs: { [STAGE]: state.task.listCanonicalStageOutcomeRefs(STAGE) },
      snapshot_tree: bindings.snapshot_tree,
      material_revision: bindings.material_revision,
      material_scope_revisions: bindings.material_scope_revisions,
      snapshot_root: bindings.snapshot_root,
      authenticate: () => null,
      read_task_facts: () => [],
    });
    expect(withoutRow[STAGE]).toBe("unavailable");
    expect(withoutRow.record_reasons[STAGE]).toContain(`no ${STAGE} stage row`);

    expect(project()[STAGE]).toBe("completed");
    // The row is the verify-code result now, so the projection reports no
    // missing verify-code row; the four stages that still have no row in this
    // fixture keep their honest missing-row reason.
    expect(project().record_reasons).not.toHaveProperty(STAGE);
    expect(Object.keys(project().record_reasons).sort()).toEqual(
      ["build-code", "build-plan", "build-spec", "make-decision"],
    );
  });

  it("never borrows another stage's declared handoff items for verify-code", async () => {
    const state = verifyCodeState("stage-row-verify-code-declared-handoff", { planDeclaresHandoff: true });

    const result = await runVerifyCodeStageEnd(state);

    expect(result.stage_row_error).toBeUndefined();
    const rows = readTaskFacts(state.task.taskPath);
    expect(rows).toHaveLength(1);
    expect(rows[0].handoff.value).toBeNull();
    expect(Object.keys(rows[0].handoff).sort()).toEqual(["reason", "value"]);
    expect(JSON.stringify(rows[0])).not.toContain("HANDOFF-001");
    expect(JSON.stringify(rows[0])).not.toContain("任务Ⅱ");
  });

  it("does not add verify-code to the handoff stages", () => {
    expect(STAGE_HANDOFF_STAGES).toEqual(["make-decision", "build-spec", "build-plan", "build-code"]);
    expect(STAGE_HANDOFF_STAGES).not.toContain(STAGE);
  });

  it("never records a stage end that did not complete as a completed implementation", async () => {
    const state = verifyCodeState("stage-row-verify-code-failed-end");

    const result = await runVerifyCodeStageEnd(state, {
      stageStatus: "failed",
      judgment: null,
      stageOutcome: null,
      availabilityState: "unavailable",
      reasonCode: "executor_absent",
    });

    expect(result.stage_row_error).toBeUndefined();
    const rows = readTaskFacts(state.task.taskPath);
    expect(rows).toHaveLength(1);
    expect(rows[0].stage).toBe(STAGE);
    expect(rows[0].layer_states.implementation_completion).toBe("incomplete");
    expect(rows[0].evidence.value[0]).toMatchObject({ command: "stage-end:verify-code", exit_code: 1 });
  });

  it("surfaces a failed row write as stage_row_error instead of a successful stage end", async () => {
    const state = verifyCodeState("stage-row-verify-code-write-failure");
    // Make only the execution-record write fail: facts.jsonl becomes a
    // directory, so the atomic row write fails while the stage-end reflection
    // itself still completes.
    const factsPath = join(state.task.taskPath, "facts.jsonl");
    rmSync(factsPath, { force: true });
    mkdirSync(factsPath);

    const result = await runVerifyCodeStageEnd(state);

    expect(result.stage_row_error).toMatch(/EISDIR|directory/i);
    expect(result).not.toHaveProperty("stage_handoff");
    expect(() => readTaskFacts(state.task.taskPath)).toThrow(/EISDIR|directory/i);
  });
});
