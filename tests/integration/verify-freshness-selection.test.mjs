import { describe, expect, it } from "vitest";

import { sha256 } from "../../runtime/evidence/freshness.mjs";
import { createQualityFact } from "../../runtime/evidence/quality-fact.mjs";
import { deriveExecutionOutcomes, deriveStageOutcomeStatuses } from "../../runtime/stage/completion-predicates.mjs";

const taskId = "task";
const originalMaterialRevision = `revision-${"a".repeat(64)}`;
const editedMaterialRevision = `revision-${"b".repeat(64)}`;
const originalTree = "c".repeat(40);
const editedTree = "d".repeat(40);

function stageOutcomeFixture() {
  const value = {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: taskId,
    stage: "build-code",
    run_id: `vnext-${sha256(`${taskId}\0build-code`).slice(0, 32)}`,
    snapshot_tree: originalTree,
    material_revision: originalMaterialRevision,
    status: "completed",
  };
  const raw = `${JSON.stringify(value)}\n`;
  const ref = `quality/evidence/stage-outcomes/build-code/${sha256(raw)}.json`;
  return { value, raw, ref };
}

function stageRow() {
  return {
    record_kind: "stage",
    task_id: taskId,
    stage: "build-code",
    source: "verify-freshness-selection-test",
    created_at: "2026-09-13T00:00:00.000Z",
    material_digest: { value: originalMaterialRevision.slice("revision-".length), reason: null },
    snapshot_tree: { value: originalTree },
    review_origin: "not_run",
    review_result_ref: { value: null, reason: "no review" },
    finding_dispositions: [],
    spec_analyze: { value: null, reason: "not part of fixture" },
    evidence: { value: [] },
    layer_states: {
      implementation_completion: "completed",
      stage_quality: "completed",
      delivery: "unavailable",
      task_closure: "unavailable",
    },
    serious_issue_disposition: { value: null, reason: "none" },
    close_action: { value: null, reason: "stage row" },
    handoff: { value: null, reason: "none" },
  };
}

describe("verify reads immutable facts without material-currentness invalidation", () => {
  it("retains a legacy stage outcome after material and worktree edits when its own bytes are authenticated", () => {
    const fixture = stageOutcomeFixture();
    const statuses = deriveStageOutcomeStatuses({
      task_id: taskId,
      read: (ref) => ref === fixture.ref ? fixture.raw : (() => { throw new Error("missing"); })(),
      stage_outcome_refs: { "build-code": [fixture.ref] },
      snapshot_tree: editedTree,
      material_revision: editedMaterialRevision,
      authenticate: ({ value }) => value,
    });

    expect(statuses["build-code"]).toBe("completed");
  });

  it("uses the K2 row as the stage status source after a material edit without invoking a runner", () => {
    let runnerInvocations = 0;
    const result = deriveExecutionOutcomes({
      task_id: taskId,
      read: () => { throw new Error("K2 row should not read an old outcome envelope"); },
      read_task_facts: () => [stageRow()],
      snapshot_tree: editedTree,
      material_revision: editedMaterialRevision,
      authenticate: () => { runnerInvocations += 1; },
    });

    expect(result["build-code"]).toMatchObject({ status: "completed", refs: ["facts.jsonl"] });
    expect(runnerInvocations).toBe(0);
  });

  it("keeps the fixed per-stage material scope and rejects a narrowed scope", () => {
    expect(() => createQualityFact({
      taskId,
      stage: "make-decision",
      materialRevision: originalMaterialRevision,
      materialScope: ["spec.md"],
      materialScopeRevision: originalMaterialRevision,
      snapshotTree: originalTree,
      kind: "test",
      status: "passed",
      subject: "scope",
      evidence: [{ ref: "quality/evidence/test.txt", sha256: "e".repeat(64), evidence_type: "test_receipt" }],
    })).toThrow(/fixed stage scope/i);
  });

  it("does not accept a tampered content-addressed stage outcome as completed", () => {
    const fixture = stageOutcomeFixture();
    const tampered = `${JSON.stringify({ ...fixture.value, status: "failed" })}\n`;
    const statuses = deriveStageOutcomeStatuses({
      task_id: taskId,
      read: (ref) => ref === fixture.ref ? tampered : (() => { throw new Error("missing"); })(),
      stage_outcome_refs: { "build-code": [fixture.ref] },
      snapshot_tree: originalTree,
      material_revision: originalMaterialRevision,
      authenticate: ({ value }) => value,
    });

    expect(statuses["build-code"]).toBe("incomplete");
  });
});
