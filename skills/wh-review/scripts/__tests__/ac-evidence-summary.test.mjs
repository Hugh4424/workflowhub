import { createHash } from "node:crypto";
import { mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createTask, createTaskKernel } from "../../../../runtime/task/task-handle.mjs";
import { buildAcEvidenceSummary } from "../ac-evidence-summary.mjs";

function digest(raw) { return createHash("sha256").update(raw).digest("hex"); }
function json(value) { return `${JSON.stringify(value)}\n`; }

function fixture({ duplicate = false, mismatchLeafSnapshot = false, exitCode = 0, genericMetadata = false, genericOutcome = false } = {}) {
  const task = createTask({ storageRoot: realpathSync(mkdtempSync(join(tmpdir(), "wh-review-ac-summary-"))), manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: `ac-${Math.random().toString(16).slice(2)}`,
    created_at: new Date().toISOString(), target_repo_root: "/repo", issue_ids: [], inputs: {},
  } });
  const kernel = createTaskKernel(task);
  const snapshotTree = "a".repeat(40);
  const sourceDigest = "b".repeat(64);
  const publish = (ref, value) => {
    const raw = typeof value === "string" ? value : json(value);
    kernel.publishCanonicalRecord(ref, raw);
    return { ref, sha256: digest(raw) };
  };
  const testReceipt = publish("quality/tests/verify-tests.json", {
    schema_version: "workflowhub-receipt.v1", task_id: task.identity.taskId, stage: "verify-code", snapshot_tree: snapshotTree, source_digest: sourceDigest, exit_code: exitCode,
  });
  const observation = publish("quality/evidence/ac-1-observation.json", {
    schema_version: "acceptance-observation.v1", acceptance_criterion_id: "AC-1", snapshot_tree: snapshotTree,
    summary: genericMetadata ? {
      scenario: "AC-1 保存后重新读取", oracle: "AC-1 返回与写入值一致", actual_outcome: genericOutcome ? "当前快照测试通过" : "AC-1 读取值一致",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖断电"], exceptions: ["无"],
    } : {
      scenario: "保存后重新读取", oracle: "返回与写入值一致", actual_outcome: genericOutcome ? "当前快照测试通过" : "读取值一致",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖断电"], exceptions: ["无"],
    },
  });
  const observation2 = publish("quality/evidence/ac-2-observation.json", {
    schema_version: "acceptance-observation.v1", acceptance_criterion_id: "AC-2", snapshot_tree: snapshotTree,
    summary: genericMetadata ? {
      scenario: "AC-1 保存后重新读取", oracle: "AC-1 返回与写入值一致", actual_outcome: genericOutcome ? "当前快照测试通过" : "AC-1 读取值一致",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖断电"], exceptions: ["无"],
    } : {
      scenario: "读取后校验", oracle: "返回值与保存值一致", actual_outcome: genericOutcome ? "当前快照测试通过" : "读取值一致",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖断电"], exceptions: ["无"],
    },
  });
  const rawProof = publish("quality/evidence/ac-2-proof.txt", "provider raw output must never enter summary\n");
  const ac1 = publish("quality/evidence/ac-1.json", {
    schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", snapshot_tree: snapshotTree, source_digest: sourceDigest,
    refs: [observation],
  });
  const ac2 = publish("quality/evidence/ac-2.json", {
    schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-2", result: "pass", source_digest: sourceDigest,
    snapshot_tree: mismatchLeafSnapshot ? "b".repeat(40) : snapshotTree, refs: [genericMetadata || genericOutcome ? observation2 : rawProof],
  });
  const aggregate = publish("quality/evidence/verify-aggregate.json", {
    schema_version: "workflowhub-receipt.v1", task_id: task.identity.taskId, stage: "verify-code", producer: { component: "evidence" },
    refs: duplicate ? [ac1, ac1] : [ac1, ac2],
  });
  return {
    task,
    acceptanceCriteria: "- AC-1: 保存\n- AC-2: 读取\n",
    acceptanceEvidence: {
      test_receipt_ref: testReceipt.ref, test_receipt_hash: testReceipt.sha256,
      evidence_ref: aggregate.ref, evidence_hash: aggregate.sha256,
      source_digest: sourceDigest,
    },
  };
}

describe("per-AC evidence summary", () => {
  it("derives only authenticated AC facts and refs", () => {
    const { task, acceptanceCriteria, acceptanceEvidence } = fixture();
    const summary = buildAcEvidenceSummary({ task, acceptanceCriteria, acceptanceEvidence });
    expect(summary).toMatchObject({ schema_version: "ac-evidence-summary.v1", criteria: [
      expect.objectContaining({ acceptance_criterion_id: "AC-1", scenario: "保存后重新读取", oracle: "返回与写入值一致", actual_outcome: "读取值一致" }),
      expect.objectContaining({ acceptance_criterion_id: "AC-2", scenario: "unknown", oracle: "unknown", actual_outcome: "pass", evidence_type: "acceptance_leaf" }),
    ] });
    expect(JSON.stringify(summary)).not.toContain("provider raw output");
    expect(summary.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ acceptance_criterion_id: "AC-2", result: "unknown", leaf_result: "pass", status: "incomplete" }),
    ]));
  });

  it("does not turn a failing test receipt into per-AC pass", () => {
    const summary = buildAcEvidenceSummary(fixture({ exitCode: 1 }));
    expect(summary.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ result: "unknown", leaf_result: "pass", status: "incomplete" }),
    ]));
  });

  it("rejects duplicate AC leaves and snapshot mismatches", () => {
    const duplicate = fixture({ duplicate: true });
    expect(() => buildAcEvidenceSummary(duplicate)).toThrow(/duplicate acceptance criterion|cover accepted ACs/i);
    const mismatch = fixture({ mismatchLeafSnapshot: true });
    expect(() => buildAcEvidenceSummary(mismatch)).toThrow(/snapshot/i);
  });

  it("rejects a mismatched authenticated root", () => {
    const input = fixture();
    input.acceptanceEvidence.evidence_hash = "0".repeat(64);
    expect(() => buildAcEvidenceSummary(input)).toThrow(/hash mismatch/i);
  });

  it("downgrades generic per-AC prose and shared evidence to incomplete", () => {
    const summary = buildAcEvidenceSummary(fixture({ genericMetadata: true }));
    expect(summary.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ result: "unknown", status: "incomplete", leaf_result: "pass" }),
    ]));
  });

  it("downgrades generic actual outcomes even when scenarios differ", () => {
    const summary = buildAcEvidenceSummary(fixture({ genericOutcome: true }));
    expect(summary.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ result: "unknown", status: "incomplete", leaf_result: "pass", exceptions: expect.arrayContaining(["per-AC actual outcomes are generic"]) }),
    ]));
  });
});
