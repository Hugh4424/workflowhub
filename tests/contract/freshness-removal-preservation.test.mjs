import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { validateStageOutcomeProof } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { deriveExecutionOutcomes } from "../../runtime/stage/completion-predicates.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskFacts, STAGE_ROW_KEYS, writeStageRow } from "../../runtime/task/task-store.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const tree = "a".repeat(40);
const materialDigest = "b".repeat(64);

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function taskFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-c5-preservation-")));
  roots.push(root);
  const target = join(root, "target");
  mkdirSync(target);
  const taskId = "c5-preservation";
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-09-13T00:00:00.000Z",
      target_repo_root: target,
      issue_ids: [],
      inputs: {},
    },
  });
  initializeTaskStore(task.taskPath, { taskId });
  return task;
}

function emptyField(reason) {
  return { value: null, reason };
}

function row(taskId, overrides = {}) {
  return {
    record_kind: "stage",
    task_id: taskId,
    stage: "build-code",
    source: "c5-preservation-test",
    created_at: "2026-09-13T00:00:00.000Z",
    material_digest: { value: materialDigest },
    snapshot_tree: { value: tree },
    review_origin: "conducted",
    review_result_ref: { value: "quality/reviews/results/c5-review.json" },
    finding_dispositions: [],
    spec_analyze: emptyField("not part of this focused row fixture"),
    evidence: { value: [{ command: "node c5", exit_code: 0, failure_signature: "passed" }] },
    layer_states: {
      implementation_completion: "completed",
      stage_quality: "completed",
      delivery: "unavailable",
      task_closure: "unavailable",
    },
    serious_issue_disposition: emptyField("no serious issue"),
    close_action: emptyField("stage row carries no close action"),
    handoff: emptyField("no handoff"),
    ...overrides,
  };
}

describe("C5 freshness removal preserves K2/K5 bindings", () => {
  it("round-trips the complete K2 stage and close_action rows without changing identity fields", () => {
    const task = taskFixture();
    const stage = row(task.identity.taskId);
    const closeAction = row(task.identity.taskId, {
      record_kind: "close_action",
      stage: "close",
      close_action: { action: "merge", result: "recorded", ref: "operations/close/merge" },
    });

    writeStageRow(task.taskPath, stage);
    writeStageRow(task.taskPath, closeAction);

    const rows = readTaskFacts(task.taskPath);
    expect(rows).toHaveLength(2);
    expect(rows.map((value) => Object.keys(value).sort())).toEqual([
      [...STAGE_ROW_KEYS].sort(),
      [...STAGE_ROW_KEYS].sort(),
    ]);
    expect(rows[0]).toEqual(stage);
    expect(rows[1]).toEqual(closeAction);
    expect(rows.map((value) => ({
      record_kind: value.record_kind,
      material_digest: value.material_digest,
      snapshot_tree: value.snapshot_tree,
      review_result_ref: value.review_result_ref,
    }))).toEqual([
      { record_kind: "stage", material_digest: stage.material_digest, snapshot_tree: stage.snapshot_tree, review_result_ref: stage.review_result_ref },
      { record_kind: "close_action", material_digest: closeAction.material_digest, snapshot_tree: closeAction.snapshot_tree, review_result_ref: closeAction.review_result_ref },
    ]);
  });

  it("keeps a K5 proof ref/hash/binding immutable while a material-only edit produces no rerun", () => {
    const task = taskFixture();
    const stage = row(task.identity.taskId);
    writeStageRow(task.taskPath, stage);

    const proof = {
      schema_version: "workflowhub-stage-outcome-evidence.v1",
      task_id: task.identity.taskId,
      attempt_id: "c5-attempt",
      stage: "build-code",
      snapshot_tree: tree,
      material_revision: `revision-${materialDigest}`,
      subject_kind: "stage",
      subject_id: "build-code",
      outcome_status: "completed",
      result_summary: "stage completed",
      producer_identity: { kind: "workflowhub-session", host: "test", agent_run_id: "c5-run", source_ref: "session:c5" },
    };
    const proofRaw = JSON.stringify(proof);
    const proofRef = `quality/evidence/stage-outcome-proofs/${sha256(proofRaw)}.json`;
    const proofBinding = {
      ref: proofRef,
      sha256: sha256(proofRaw),
    };
    expect(validateStageOutcomeProof(proofRaw, proofBinding, {
      taskId: task.identity.taskId,
      attemptId: proof.attempt_id,
      stage: proof.stage,
      snapshotTree: proof.snapshot_tree,
      materialRevision: proof.material_revision,
      subjectKind: proof.subject_kind,
      subjectId: proof.subject_id,
      outcomeStatus: proof.outcome_status,
      resultSummary: proof.result_summary,
      producerIdentity: proof.producer_identity,
    })).toEqual(proof);

    let runnerInvocations = 0;
    const before = deriveExecutionOutcomes({
      task_id: task.identity.taskId,
      read: () => { throw new Error("stage outcome bytes must not be needed for a K2 row"); },
      read_task_facts: () => readTaskFacts(task.taskPath),
      snapshot_tree: tree,
      material_revision: `revision-${materialDigest}`,
      authenticate: () => { runnerInvocations += 1; },
    });
    const afterMaterialEdit = deriveExecutionOutcomes({
      task_id: task.identity.taskId,
      read: () => { throw new Error("stage outcome bytes must not be needed for a K2 row"); },
      read_task_facts: () => readTaskFacts(task.taskPath),
      snapshot_tree: tree,
      material_revision: `revision-${"c".repeat(64)}`,
      authenticate: () => { runnerInvocations += 1; },
    });

    expect(before["build-code"].status).toBe("completed");
    expect(afterMaterialEdit["build-code"].status).toBe("completed");
    expect(afterMaterialEdit["build-code"].refs).toEqual(["facts.jsonl"]);
    expect(runnerInvocations).toBe(0);
    expect(proofBinding).toEqual({ ref: proofRef, sha256: sha256(proofRaw) });
  });

  it("removes the named B/D production use sites without treating snapshot_tree as the forbidden concept", () => {
    const paths = [
      "runtime/evidence/freshness.mjs",
      "runtime/stage/completion-predicates.mjs",
      "runtime/stage/stage-runner.mjs",
      "runtime/review/review-record-route.mjs",
      "runtime/stage/stage-agent-outcome-adapter.mjs",
      "runtime/task/task-kernel-implementation.mjs",
      "runtime/evidence/canonical-receipt-writer.mjs",
      "runtime/stage/stage-handlers.mjs",
      "runtime/task/task-store.mjs",
    ];
    const forbidden = ["evaluateFactFreshness", "isStageSnapshotCurrent", "isMaterialOnlySnapshotDelta"];
    const hits = [];
    for (const path of paths) {
      const source = readFileSync(path, "utf8");
      for (const symbol of forbidden) if (source.includes(symbol)) hits.push(`${path}:${symbol}`);
    }
    expect(hits).toEqual([]);
  });

  it("does not consume the retired current-plan validator output", () => {
    const source = readFileSync("tools/cli/produce-final-current-snapshot.mjs", "utf8");
    expect(source).not.toContain("quality/evidence/S4-slicing/current-tasks-self-check.json");
    expect(source).not.toContain("current-tasks-self-check");
  });
});
