import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { authenticateQualityFactRecord } from "../runtime/evidence/freshness.mjs";
import { createQualityFact } from "../runtime/evidence/quality-fact.mjs";
import { validateVerifyLeaves } from "../runtime/evidence/quality-store.mjs";
import { classifyAcceptanceEvidenceResult } from "../runtime/stage/stage-handlers.mjs";
import { acceptanceResultForSubjectStatus } from "../runtime/stage/stage-runner.mjs";

const hash = (raw) => createHash("sha256").update(raw).digest("hex");

describe("deferred acceptance semantics", () => {
  it.each([
    ["passed", "pass"],
    ["failed", "fail"],
    ["inconclusive", "inconclusive"],
    ["deferred", "deferred"],
    ["missing", "deferred"],
  ])("maps subject status %s to %s without a catch-all failure", (status, result) => {
    expect(acceptanceResultForSubjectStatus(status)).toBe(result);
  });

  it("rejects an unlisted subject status instead of silently writing fail", () => {
    expect(() => acceptanceResultForSubjectStatus("timed_out")).toThrow(/unsupported acceptance subject status/);
  });

  it.each([
    ["pass", "passed"],
    ["fail", "failed"],
    ["inconclusive", "inconclusive"],
    ["deferred", "deferred"],
  ])("keeps verify-code evidence result %s as %s", (result, disposition) => {
    expect(classifyAcceptanceEvidenceResult(result)).toBe(disposition);
  });

  it("rejects an unlisted evidence result instead of treating it as failed", () => {
    expect(() => classifyAcceptanceEvidenceResult("timed_out")).toThrow(/unsupported acceptance evidence result/);
  });

  it.each(["inconclusive", "deferred"])("keeps %s incomplete in quality-store verification", (result) => {
    const sourceDigest = "b".repeat(64);
    const output = validateVerifyLeaves([{
      acceptance_criterion_id: "AC-1",
      result,
      source_digest: sourceDigest,
      acceptance_leaf: { ref: "quality/evidence/ac-1.json", sha256: "a".repeat(64) },
      nested_evidence: [{ ref: "quality/evidence/observation.json", sha256: "c".repeat(64) }],
      scenario: "证据不足时保留事实",
      oracle: "不能判成通过",
      actual_outcome: result,
      evidence_type: "structured_observation",
      coverage_limits: ["未完成 A/B 对照"],
      exceptions: ["待人工确认"],
      implementation_anchor: { id: "impl-1", path: "runtime/evidence/acceptance-evidence-validator.mjs", start_line: 1, end_line: 2, role: "implementation" },
      verification_anchor: { id: "test-1", path: "tests/deferred-acceptance-semantics.test.mjs", start_line: 1, end_line: 2, role: "verification" },
    }], { sourceDigest });
    expect(output[0]).toMatchObject({ result, status: "incomplete" });
  });

  it.each(["inconclusive", "deferred"])("authenticates a missing quality fact bound to %s", (result) => {
    // The freshness/currentness comparison chain was removed. Readback of a
    // recorded fact is now an integrity check against the fact's own canonical
    // ref, hash and nested evidence, with no current-material input. A fact
    // recorded with an inconclusive or deferred leaf must still authenticate
    // as that recorded fact.
    const acceptanceRef = "quality/evidence/ac-1.json";
    const proofRef = "quality/evidence/proof.txt";
    const proofRaw = "proof\n";
    const acceptanceRaw = `${JSON.stringify({
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "AC-1",
      result,
      refs: [{ ref: proofRef, sha256: hash(proofRaw) }],
    })}`;
    const fact = createQualityFact({
      taskId: "deferred-task",
      stage: "verify-code",
      materialRevision: `revision-${"d".repeat(64)}`,
      snapshotTree: "e".repeat(40),
      kind: "acceptance_criterion",
      status: "missing",
      subject: "AC-1",
      evidence: [{ ref: acceptanceRef, sha256: hash(acceptanceRaw), evidence_type: "acceptance_evidence" }],
    });
    const evaluated = authenticateQualityFactRecord({ ...fact.value, ref: fact.ref, sha256: fact.sha256 }, {
      read: (entry) => entry === fact.ref ? fact.raw : entry === acceptanceRef ? acceptanceRaw : entry === proofRef ? proofRaw : undefined,
    });
    expect(evaluated.status).toBe("recorded");
    expect(evaluated.authenticated).toBe(true);
  });
});
