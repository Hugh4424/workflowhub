import { describe, expect, it } from "vitest";

import { STAGE_PREDICATES, deriveCurrentProductRelease, deriveProductRelease, deriveStageCompletion } from "../../runtime/stage/completion-predicates.mjs";
import { evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";

function facts(stage, overrides = {}) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind], index) => ({
    fact: {
      ref: `quality/${subject}.json`,
      value: {
        task_id: "task",
        stage,
        material_revision: "revision",
        snapshot_tree: "tree",
        kind,
        subject,
        status: overrides[subject]?.status ?? (kind === "review" ? "recorded" : "passed"),
        fact_id: `fact-${index}`,
      },
    },
    freshness: { status: overrides[subject]?.freshness ?? "current" },
    authenticated: overrides[subject]?.authenticated ?? true,
    ...(stage === "verify-code" && subject === "code_review" ? { review_status: "clean" } : {}),
  }));
}

describe("status is derived from current quality facts", () => {
  it("does not consume an accepted/current pointer or caller status", () => {
    const result = deriveStageCompletion("build-spec", facts("build-spec"));
    expect(result).toMatchObject({ stage: "build-spec", status: "completed", missing: [] });
    expect(result).not.toHaveProperty("accepted_ref");
    expect(result).not.toHaveProperty("current_pointer");
  });

  it("reports missing and stale facts instead of inventing completion", () => {
    const missing = facts("build-plan").filter(({ fact }) => fact.value.subject !== "human_confirmation");
    expect(deriveStageCompletion("build-plan", missing).status).toBe("in_progress");

    const stale = facts("build-plan", { fr_coverage: { freshness: "stale" } });
    expect(deriveStageCompletion("build-plan", stale).status).toBe("in_progress");
  });

  it("derives released only from five current completions, AC results, and verify confirmation", () => {
    const hash = "a".repeat(64);
    const identity = {
      task_id: "task",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "a".repeat(40),
    };
    const stage_completions = [
      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
    ].map((stage, index) => ({
      stage,
      status: "completed",
      ...identity,
      ref: `quality/facts/${index + 1}.json`,
      hash,
      freshness: { status: "current" },
    }));
    const result = deriveProductRelease({
      stage_completions,
      acceptance_results: [{
        acceptance_criterion_id: "AC-001",
        result: "pass",
        ...identity,
        ref: "quality/evidence/ac-001.json",
        hash,
        freshness: { status: "current" },
      }],
      expected_acceptance_ids: ["AC-001"],
      verify_confirmation: {
        schema_version: "human-confirmation.v2",
        ...identity,
        stage: "verify-code",
        decision: "accepted",
        confirmed_at: "2026-08-20T00:00:00.000Z",
        ref: "quality/confirmations/verify.json",
        hash,
        freshness: { status: "current" },
      },
    });

    expect(result).toMatchObject({ producer: "deriveProductRelease", status: "released", reasons: [] });
    expect(result.input_refs).toHaveLength(7);
    expect(result.input_refs.every((entry) => entry.ref && entry.hash === hash)).toBe(true);
  });

  it("keeps missing, stale, or unbound facts as not_released without guessing hashes", () => {
    const result = deriveProductRelease({
      stage_completions: [{ stage: "make-decision", status: "completed", ref: "quality/facts/one.json" }],
      acceptance_results: [{ acceptance_criterion_id: "AC-001", result: "pass" }],
      verify_confirmation: { decision: "rejected" },
    });

    expect(result.status).toBe("not_released");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "stage_completion_unbound:make-decision",
      "stage_completion_missing:build-spec",
      "acceptance_result_unbound:AC-001",
      "verify_confirmation_not_accepted:rejected",
      "verify_confirmation_unbound",
    ]));
    expect(result.input_refs).toEqual([]);
  });

  it("does not silently deduplicate one ref when two facts bind different hashes", () => {
    const hash = "a".repeat(64);
    const stage_completions = [
      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
    ].map((stage, index) => ({
      stage,
      status: "completed",
      ref: stage === "build-code" ? "quality/shared.json" : `quality/facts/${index + 1}.json`,
      hash: stage === "build-code" ? hash : "a".repeat(64),
      freshness: { status: "current" },
    }));
    const result = deriveProductRelease({
      stage_completions,
      acceptance_results: [{
        acceptance_criterion_id: "AC-001",
        result: "passed",
        ref: "quality/shared.json",
        hash: "b".repeat(64),
        freshness: { status: "current" },
      }],
      expected_acceptance_ids: ["AC-001"],
      verify_confirmation: {
        schema_version: "human-confirmation.v2",
        task_id: "task",
        stage: "verify-code",
        decision: "accepted",
        material_revision: `revision-${"a".repeat(64)}`,
        snapshot_tree: "a".repeat(40),
        confirmed_at: "2026-08-20T00:00:00.000Z",
        ref: "quality/confirmations/verify.json",
        hash,
        freshness: { status: "current" },
      },
    });

    expect(result.status).toBe("not_released");
    expect(result.reasons).toContain("acceptance_result_binding_conflict:quality/shared.json");
  });

  it("does not release mixed current task/material/snapshot identities", () => {
    const hash = "a".repeat(64);
    const identity = { task_id: "task", material_revision: `revision-${"a".repeat(64)}`, snapshot_tree: "a".repeat(40) };
    const stage_completions = [
      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
    ].map((stage, index) => ({ stage, status: "completed", ...identity, ref: `quality/facts/${index + 1}.json`, hash, freshness: { status: "current" } }));
    const result = deriveProductRelease({
      stage_completions,
      acceptance_results: [{ acceptance_criterion_id: "AC-001", result: "pass", ...identity, snapshot_tree: "b".repeat(40), ref: "quality/ac.json", hash, freshness: { status: "current" } }],
      expected_acceptance_ids: ["AC-001"],
      verify_confirmation: { schema_version: "human-confirmation.v2", ...identity, stage: "verify-code", decision: "accepted", confirmed_at: "2026-08-20T00:00:00.000Z", ref: "quality/confirm.json", hash, freshness: { status: "current" } },
    });
    expect(result.status).toBe("not_released");
    expect(result.reasons).toContain("acceptance_result:AC-001_identity_conflict:snapshot_tree");
  });

  it("does not release from a partial or ambiguous AC result set", () => {
    const hash = "a".repeat(64);
    const stage_completions = [
      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
    ].map((stage, index) => ({
      stage,
      status: "completed",
      ref: `quality/facts/${index + 1}.json`,
      hash,
      freshness: { status: "current" },
    }));
    const base = {
      acceptance_criterion_id: "AC-001",
      result: "pass",
      ref: "quality/evidence/ac-001.json",
      hash,
      freshness: { status: "current" },
    };
    const confirmation = {
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "verify-code",
      decision: "accepted",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "a".repeat(40),
      confirmed_at: "2026-08-20T00:00:00.000Z",
      ref: "quality/confirmations/verify.json",
      hash,
      freshness: { status: "current" },
    };
    const partial = deriveProductRelease({
      stage_completions,
      acceptance_results: [base],
      expected_acceptance_ids: ["AC-001", "AC-002"],
      verify_confirmation: confirmation,
    });
    expect(partial.status).toBe("not_released");
    expect(partial.reasons).toContain("acceptance_result_missing:AC-002");

    const dualInput = deriveProductRelease({
      stage_completions,
      acceptance_results: [base],
      product_results: [base],
      expected_acceptance_ids: ["AC-001"],
      verify_confirmation: confirmation,
    });
    expect(dualInput.status).toBe("not_released");
    expect(dualInput.reasons).toContain("acceptance_results_product_results_conflict");

    const incompleteAcceptance = deriveProductRelease({
      stage_completions,
      acceptance_results: [{ ...base, status: "incomplete" }],
      expected_acceptance_ids: ["AC-001"],
      verify_confirmation: confirmation,
    });
    expect(incompleteAcceptance.status).toBe("not_released");
    expect(incompleteAcceptance.reasons).toContain("acceptance_result_not_pass:AC-001:pass");
  });

  it("does not promote unauthenticated or duplicate current AC facts", () => {
    const tree = "a".repeat(40);
    const revision = `revision-${"a".repeat(64)}`;
    const records = new Map();
    const add = (ref, value) => {
      const raw = `${JSON.stringify(value)}\n`;
      records.set(ref, raw);
      return sha256(raw);
    };
    const fact = (index, evidenceRef, evidenceHash) => ({
      schema_version: "quality-fact.v1",
      fact_id: `fact-${index}`,
      task_id: "task",
      stage: "verify-code",
      material_revision: revision,
      snapshot_tree: tree,
      kind: "acceptance_criterion",
      subject: "AC-001",
      status: "passed",
      evidence: [{ ref: evidenceRef, sha256: evidenceHash, evidence_type: "acceptance_evidence" }],
    });
    const proof = add("quality/evidence/ac-proof.json", { schema_version: "proof.v1", result: "pass" });
    const evidence = add("quality/evidence/ac.json", {
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "AC-001",
      result: "pass",
      refs: [{ ref: "quality/evidence/ac-proof.json", sha256: proof }],
      snapshot_tree: tree,
    });
    const first = fact(1, "quality/evidence/ac.json", evidence);
    const secondEvidence = add("quality/evidence/ac-2.json", {
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "AC-001",
      result: "pass",
      refs: [{ ref: "quality/evidence/ac-proof.json", sha256: proof }],
      snapshot_tree: tree,
    });
    const second = fact(2, "quality/evidence/ac-2.json", secondEvidence);
    const unauthenticated = deriveCurrentProductRelease({
      task_id: "task",
      read: (ref) => records.get(ref) ?? (() => { const error = new Error("missing"); error.code = "ENOENT"; throw error; })(),
      refs: ["quality/facts/one.json", "quality/facts/two.json"],
      snapshot_tree: tree,
      material_revision: revision,
      expected_acceptance_ids: ["AC-001"],
      evaluate_freshness: evaluateFactFreshness,
    });
    expect(unauthenticated.reasons).toContain("acceptance_result_missing:AC-001");
    records.set("quality/facts/one.json", `${JSON.stringify(first)}\n`);
    records.set("quality/facts/two.json", `${JSON.stringify(second)}\n`);
    const duplicate = deriveCurrentProductRelease({
      task_id: "task",
      read: (ref) => records.get(ref) ?? (() => { const error = new Error("missing"); error.code = "ENOENT"; throw error; })(),
      refs: ["quality/facts/one.json", "quality/facts/two.json"],
      snapshot_tree: tree,
      material_revision: revision,
      expected_acceptance_ids: ["AC-001"],
      evaluate_freshness: evaluateFactFreshness,
    });
    expect(duplicate.status).toBe("not_released");
    expect(duplicate.reasons).toContain("acceptance_result_conflicting:AC-001");
    expect(duplicate.reasons).not.toContain("acceptance_result_missing:AC-001");
  });

  it("does not promote a copied verify summary without current evidence bytes", () => {
    const tree = "a".repeat(40);
    const revision = `revision-${"a".repeat(64)}`;
    const sourceDigest = "c".repeat(64);
    const records = new Map([["task.json", "task\n"]]);
    records.set("quality/verify.json", `${JSON.stringify({
      schema_version: "quality-verify.v1",
      task_id: "task",
      stage: "verify-code",
      status: "passed",
      source_digest: sourceDigest,
      material_digest: revision.slice("revision-".length),
      material_revision: revision,
      snapshot_tree: tree,
      evidence_ref: "task.json",
      evidence_hash: sha256("task\n"),
      criteria: [{
        acceptance_criterion_id: "AC-001",
        result: "pass",
        source_digest: sourceDigest,
        acceptance_leaf: { ref: "quality/evidence/ac-001.json", sha256: sha256("missing-leaf\n") },
        nested_evidence: [{ ref: "quality/evidence/ac-001-proof.json", sha256: sha256("missing-proof\n") }],
        scenario: "当前场景",
        oracle: "结果符合预期",
        actual_outcome: "结果符合预期",
        evidence_type: "structured_observation",
        coverage_limits: ["仅覆盖当前场景"],
        exceptions: ["无"],
        implementation_anchor: { id: "impl", path: "src/app.mjs", start_line: 1, end_line: 1, role: "implementation" },
        verification_anchor: { id: "test", path: "tests/app.test.mjs", start_line: 1, end_line: 1, role: "verification" },
      }],
    })}\n`);
    const result = deriveCurrentProductRelease({
      task_id: "task",
      read: (ref) => records.get(ref) ?? (() => { const error = new Error("missing"); error.code = "ENOENT"; throw error; })(),
      refs: [],
      snapshot_tree: tree,
      material_revision: revision,
      expected_acceptance_ids: ["AC-001"],
      evaluate_freshness: evaluateFactFreshness,
    });
    expect(result.reasons).toContain("acceptance_result_missing:AC-001");
  });

  it("requires explicit current freshness and a bound verify confirmation", () => {
    const hash = "a".repeat(64);
    const stage_completions = [
      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
    ].map((stage, index) => ({
      stage,
      status: "completed",
      ref: `quality/facts/${index + 1}.json`,
      hash,
      freshness: { status: "current" },
    }));
    const result = deriveProductRelease({
      stage_completions,
      acceptance_results: [{ acceptance_criterion_id: "AC-001", result: "pass", ref: "quality/ac.json", hash }],
      expected_acceptance_ids: ["AC-001"],
      verify_confirmation: { decision: "accepted", ref: "quality/confirm.json", hash },
    });
    expect(result.status).toBe("not_released");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "acceptance_result_not_current:AC-001",
      "verify_confirmation_not_current",
      "verify_confirmation_identity_invalid",
    ]));
  });
});
