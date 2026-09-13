import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  CURRENT_STATUS_DOMAINS,
  deriveCurrentCloseProjection,
} from "../../runtime/stage/current-close-projection.mjs";
import { deriveStageOutcomeStatuses } from "../../runtime/stage/completion-predicates.mjs";
import { deriveNamedStatusRefs } from "../../tools/cli/stage-runtime.mjs";

const repoRoot = new URL("../../", import.meta.url);
const read = (relative) => readFileSync(new URL(relative, repoRoot), "utf8");
const digest = (letter) => letter.repeat(64);

const confirmationRef = `quality/confirmations/${digest("a")}.json`;
const authorizationRef = `quality/authorizations/${digest("b")}.json`;
const reviewRef = `quality/reviews/results/${digest("c")}.json`;
const reflectionRef = `quality/stage-reflection/build-code/${digest("d")}.json`;
const stageOutcomeProofRef = `quality/evidence/stage-outcome-proofs/${digest("e")}.json`;
const closeActionRef = "operations/close/plans/plan/steps/archive-spec.json";

function currentStageRow() {
  return {
    record_kind: "stage",
    task_id: "task",
    stage: "build-code",
    source: "stage-end:build-code",
    created_at: "2026-09-13T00:00:00.000Z",
    material_digest: { value: digest("f") },
    snapshot_tree: { value: digest("1").slice(0, 40), reason: "fixture snapshot" },
    review_origin: "conducted",
    review_result_ref: { value: reviewRef },
    finding_dispositions: [{ finding: "F-C6", disposition: "fixed" }],
    spec_analyze: {
      value: {
        ref: reflectionRef,
        sha256: digest("d"),
        reflection_status: "ok",
        stage_outcome_proof_refs: [stageOutcomeProofRef],
      },
    },
    evidence: { value: [{ command: "stage-end:build-code", exit_code: 0, failure_signature: "stage_end_recorded" }] },
    layer_states: {
      // This is intentionally incomplete. A stale completed stage-outcome
      // proof below must not promote the current K2 row to completed.
      implementation_completion: "incomplete",
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    },
    serious_issue_disposition: { value: null, reason: "no serious issue" },
    close_action: { value: null, reason: "stage row carries no close action" },
    handoff: {
      value: [{ confirmation_ref: confirmationRef, authorization_ref: authorizationRef }],
    },
  };
}

describe("C6 current-close projection readback", () => {
  it("uses the K2 current row while retaining K5 stage-outcome proof as named history", () => {
    const row = currentStageRow();
    let readCalls = 0;
    const statuses = deriveStageOutcomeStatuses({
      task_id: "task",
      read: () => {
        readCalls += 1;
        throw new Error("K5 envelope must not select current status when K2 exists");
      },
      authenticate: () => {
        throw new Error("K2 current status must not authenticate an envelope");
      },
      stage_outcome_refs: { "build-code": [stageOutcomeProofRef] },
      read_task_facts: () => [row],
    });

    expect(statuses["build-code"]).toBe("incomplete");
    expect(readCalls).toBe(0);

    const closeRow = {
      record_kind: "close_action",
      task_id: "task",
      stage: "close",
      close_action: { action: "archive", result: "executed", ref: closeActionRef },
    };
    const refs = deriveNamedStatusRefs({ facts: [row, closeRow] });
    expect(refs.map(({ class: name }) => name)).toEqual(["K1", "K2", "K3", "K4", "K5", "K6"]);
    expect(refs.find(({ class: name }) => name === "K4").refs).toEqual([confirmationRef, authorizationRef].sort());
    expect(refs.find(({ class: name }) => name === "K5").refs).toEqual([
      closeActionRef,
      reflectionRef,
      reviewRef,
      stageOutcomeProofRef,
    ].sort());
  });

  it("keeps the three fact bases and the retained projection reader visible", () => {
    const refs = deriveNamedStatusRefs({ facts: [currentStageRow()] });
    const projection = deriveCurrentCloseProjection({
      task_id: "task",
      work_progress: { status: "in_progress", stage: "build-code" },
      stage_quality: { status: "in_progress", missing: ["risk_tests_fresh"] },
      root_causes: [{ root_cause_id: "risk_tests_fresh", status: "actionable", refs: ["facts.jsonl"] }],
      named_refs: refs,
      stage_reflection: { status: "ok", ref: reflectionRef, conclusion: "保留当前阶段复盘事实。" },
      status_matrix: { code: { state: "incomplete", evidence_refs: [reflectionRef] } },
      identity: { task_id: "task", material_revision: `revision-${digest("1")}`, snapshot_tree: digest("2").slice(0, 40) },
      source_completeness: { task_json: true, facts_jsonl: true, materials: true },
      close: { plan: null },
    });

    expect(Object.keys(projection.domains)).toEqual([...CURRENT_STATUS_DOMAINS]);
    expect(projection).toMatchObject({
      task_id: "task",
      root_causes: [{ root_cause_id: "risk_tests_fresh" }],
      stage_reflection: { ref: reflectionRef },
      source_completeness: { task_json: true, facts_jsonl: true, materials: true },
    });
    expect(projection).not.toHaveProperty("product_release");
    expect(projection).not.toHaveProperty("product_release_status");
    expect(projection.domains.physical_delivery.status).toBe("not_started");

    const taskCloseSource = read("tools/cli/task-close.mjs");
    expect(taskCloseSource).toContain("deriveCurrentCloseProjection");
    expect(taskCloseSource).not.toContain("deriveProductRelease");
    expect(taskCloseSource).not.toContain("deriveCurrentProductRelease");

    const inventory = JSON.parse(read("docs/architecture/control-plane-inventory.json"));
    expect(inventory.controls.find(({ id }) => id === "current-close-projection")).toMatchObject({
      disposition: "retain",
      consumer: expect.stringContaining("status and close readers"),
      effect: expect.stringContaining("named refs"),
    });
  });
});
