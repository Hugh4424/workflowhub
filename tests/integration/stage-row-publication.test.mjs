import { afterEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, readTaskFacts } from "../../runtime/task/task-store.mjs";
import { runStage, runStageEndReflection, authenticateStageOutcomeForProjection } from "../../runtime/stage/stage-runner.mjs";
import { STAGE_HANDOFF_STAGES } from "../../runtime/stage/stage-handoff.mjs";
import { stageMaterialScopeRevision } from "../../runtime/stage/completion-predicates.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
const NOW = "2026-09-10T00:00:00.000Z";
const HASH = "a".repeat(64);
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];

/**
 * The declared handoff table of specs/<task-id>/plan.md, reduced to the three
 * HANDOFF rows of this repository's own task. The parser under test accepts
 * exactly this syntax and nothing else.
 */
const DECLARED_HANDOFF_TABLE = [
  "| 未决/交接 | owner | trigger | handoff / consumer | close / retain condition |",
  "| --- | --- | --- | --- | --- |",
  "| OPEN-001 | make-decision | T-018/019/020与G-001/002/003真实回复已齐 | 下游只读消费既有决定 | 已解决；只读保留，不重问 |",
  "| HANDOFF-001 | 任务ⅡC5 | C3合入后 | C5实现者 | identity/path-cards不再产生写入；本任务仅登记不删除 |",
  "| HANDOFF-002 | 任务ⅡC4与3rd-review | C4开工 | C4实现者及审查调用方 | 同材料改协议可重跑，不再REQUEST_ID_CONFLICT |",
  "| HANDOFF-003 | 宿主 | 宿主行为变化 | build-code使用者 | 宿主不再按phase建立worktree |",
];

function stageState(taskId, { planDeclaresHandoff = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-row-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub stage row tests"]);
  git(["config", "user.email", "stage-row@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "stage row fixture\n");
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
  if (planDeclaresHandoff) {
    materials["plan.md"] = `${materials["plan.md"]}\n${DECLARED_HANDOFF_TABLE.join("\n")}\n`;
  }
  for (const [name, content] of Object.entries(materials)) artifacts.writeAtomic(name, content);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => NOW });
  const context = {
    stage: "build-code", task, kernel, identity: task.identity, manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), candidateWorkspace, artifacts, storageRoot: root,
  };
  const outcome = writeStageOutcomeFixture({
    task, kernel, artifacts, workspace: candidateWorkspace, stage: "build-code", attemptId: "stage-row-attempt",
  });
  const source = authenticateStageOutcomeForProjection(context, "build-code", outcome.ref);
  return { root, task, kernel, artifacts, candidateWorkspace, context, source };
}

function judgmentFor(state) {
  const { context, source } = state;
  return {
    schema_version: "stage-reflection.v2",
    record_kind: "judgment",
    task_id: context.identity.taskId,
    stage: "build-code",
    stage_status: "completed",
    generated_at: NOW,
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "stage-row-fixture",
      subject_kind: "step",
      classification: "keep",
      severity: "low",
      reason: "The current build-code stage outcome is available for a deterministic contract fixture.",
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
      source_id: "fixture/stage-row-reflection",
      attempt_id: source.value.attempt_id,
      started_at: "2026-09-10T00:00:01.000Z",
      completed_at: "2026-09-10T00:00:02.000Z",
      output_hash: HASH,
    },
    output_hash: HASH,
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture", unknown_reasons: [] },
  };
}

/** Drive the real stage-end entrypoint that production calls for build-code. */
function runStageEnd(state) {
  return runStageEndReflection(state.context, {
    stageStatus: "completed",
    judgment: judgmentFor(state),
    stageOutcome: state.source,
    now: NOW,
  });
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage row publication", () => {
  it("writes exactly one current stage row through the real stage-end entrypoint", async () => {
    expect(STAGE_HANDOFF_STAGES).toContain("build-code");
    const state = stageState("stage-row-published");
    const scopedMaterials = Object.fromEntries(MATERIALS.map((name) => [name, state.artifacts.read(name)]));
    const expectedMaterialDigest = stageMaterialScopeRevision("build-code", scopedMaterials).replace(/^revision-/, "");

    const result = await runStageEnd(state);

    // The stage-end write must not report a row error; the row is part of the
    // stage result, not a silently swallowed failure.
    expect(result.stage_row_error).toBeUndefined();
    expect(result.stage_handoff).toMatchObject({ status: "published", current: true });

    const rows = readTaskFacts(state.task.taskPath);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.record_kind).toBe("stage");
    expect(row.stage).toBe("build-code");
    expect(row.source).toBe("stage-end:build-code");
    expect(row.material_digest).toEqual({ value: expectedMaterialDigest });
    expect(row.snapshot_tree).toEqual({
      value: state.source.value.snapshot_tree,
      reason: "handoff snapshot captured from the current workspace",
    });
    expect(row.layer_states).toEqual({
      implementation_completion: "completed",
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    });
  });

  it("carries the three handoff items when the current plan.md declares them", async () => {
    const state = stageState("stage-row-declared-handoff", { planDeclaresHandoff: true });

    const result = await runStageEnd(state);

    expect(result.stage_row_error).toBeUndefined();
    const rows = readTaskFacts(state.task.taskPath);
    expect(rows).toHaveLength(1);
    const handoff = rows[0].handoff;
    expect(handoff.value).toHaveLength(3);
    expect(handoff.value.map((item) => item.id)).toEqual(["HANDOFF-001", "HANDOFF-002", "HANDOFF-003"]);
    expect(handoff.value[0]).toEqual({
      id: "HANDOFF-001",
      owner: "任务ⅡC5",
      trigger: "C3合入后",
      consumer: "C5实现者",
      close_condition: "identity/path-cards不再产生写入；本任务仅登记不删除",
    });
    // The OPEN-* row of the same table is not a handoff item.
    expect(JSON.stringify(handoff.value)).not.toContain("OPEN-001");
  });

  it("keeps the handoff field empty-with-reason when the current plan.md declares none", async () => {
    const state = stageState("stage-row-undeclared-handoff");

    const result = await runStageEnd(state);

    expect(result.stage_row_error).toBeUndefined();
    const rows = readTaskFacts(state.task.taskPath);
    expect(rows).toHaveLength(1);
    const handoff = rows[0].handoff;
    expect(handoff.value).toBeNull();
    expect(typeof handoff.reason).toBe("string");
    expect(handoff.reason.trim()).not.toBe("");
    // The frozen empty-with-reason encoding carries only those two keys.
    expect(Object.keys(handoff).sort()).toEqual(["reason", "value"]);
    // No other task's handoff facts may leak into this task's row.
    expect(JSON.stringify(rows[0])).not.toContain("任务Ⅱ");
    expect(JSON.stringify(rows[0])).not.toContain("HANDOFF-001");
  });
});

describe("stage row shared-key reconciliation", () => {
  it("keeps the protocol-error trace and the stage-end facts on the one row key", async () => {
    const state = stageState("stage-row-trace-and-stage-end");
    let attempts = 0;
    const publishStage = vi.fn(({ publish }) => {
      attempts += 1;
      if (attempts === 1) {
        const error = new Error("protocol publication failed transiently");
        error.code = "PROTOCOL_PUBLICATION_FAILURE";
        throw error;
      }
      return publish();
    });

    const result = await runStage(
      "build-code",
      state.context,
      async () => ({ facts: { source: "valid-handler-result" }, evidence_refs: [] }),
      {},
      {
        publishStage,
        // The stage-end producer runs after the trace, exactly as the official
        // stage runner schedules it.
        stageReflection: {},
        stageReflectionInput: { judgment: judgmentFor(state), stageOutcome: state.source },
      },
    );

    expect(publishStage).toHaveBeenCalledTimes(2);
    expect(result.stage_reflection.stage_handoff).toMatchObject({ status: "published", current: true });
    expect(result.stage_reflection.stage_row_error).toBeUndefined();

    const rows = readTaskFacts(state.task.taskPath);
    // One row key, one row: the trace leaves no second row behind and is not
    // erased by the later stage-end write.
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.stage).toBe("build-code");
    expect(row.source).toBe("protocol_error:stage_publication_transient");
    expect(row.material_digest.value).toBe(
      stageMaterialScopeRevision("build-code", Object.fromEntries(MATERIALS.map((name) => [name, state.artifacts.read(name)]))).replace(/^revision-/, ""),
    );
    expect(row.snapshot_tree.value).toBe(state.source.value.snapshot_tree);
    // Both producers' executed commands survive on the shared key.
    const commands = row.evidence.value.map((entry) => entry.command);
    expect(commands).toContain("protocol-error:stage_publication_transient");
    expect(commands).toContain("stage-handoff:build-code");
    expect(row.evidence.value).toHaveLength(2);
    // The stage-end fields the trace cannot know are present as well.
    expect(row.layer_states).toEqual({
      implementation_completion: "completed",
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    });
    expect(Object.keys(row.handoff).sort()).toEqual(["reason", "value"]);
    expect(row.handoff.value).toBeNull();
  });
});
