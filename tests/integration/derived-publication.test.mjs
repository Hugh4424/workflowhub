import { describe, expect, it } from "vitest";
import { STAGE_PREDICATES } from "../../runtime/stage/completion-predicates.mjs";
import { evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";
import { createPublication, isFormallyAcceptedPublication, rebuildPublication } from "../../runtime/stage/publication.mjs";
import { createQualityFact, publishQualityFact } from "../../runtime/evidence/quality-fact.mjs";

const revision = { revision_id: `revision-${"a".repeat(64)}`, task_id: "task" };

function store() {
  const records = new Map();
  return {
    records,
    read(ref) {
      if (!records.has(ref)) { const error = new Error("missing"); error.code = "ENOENT"; throw error; }
      return records.get(ref);
    },
    create(ref, raw) {
      if (records.has(ref)) { const error = new Error("exists"); error.code = "EEXIST"; throw error; }
      records.set(ref, raw);
    },
  };
}

function evidenceType(kind) {
  return { test: "test_receipt", review: "review_result", acceptance_criterion: "acceptance_evidence", confirmation: "human_confirmation" }[kind];
}

function currentFacts({ io, stage, revision, tree = "b".repeat(40) }) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind]) => {
    const evidenceStage = stage === "verify-code" && subject === "same_build_integration_review" ? "build-code" : stage;
    const nested = kind === "review" ? {
      version: "wh-review-result.v1", task_id: "task", stage: evidenceStage, review_track: evidenceStage === "make-decision" ? "detail" : null,
      source: { target_commit: "a".repeat(40), base_commit: "a".repeat(40), base_tree: "a".repeat(40), captured_head: "a".repeat(40) },
      snapshot_tree: tree, material_id: "a".repeat(64), attempt_ref: "reviews/attempts/a/attempt.json",
      subject_kind: subject === "phase_reviews" ? "phase" : "worktree",
      phase_id: subject === "phase_reviews" ? "phase-1" : null,
      review_scope: subject === "phase_reviews" ? "phase" : evidenceStage === "build-code" ? "integration" : null,
      ...(subject === "phase_reviews" ? { base_tree: "a".repeat(40), candidate_tree: "a".repeat(40) } : {}),
      provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "pass", findings: [] } }],
      verdict: "pass", findings: [],
    } : kind === "test" ? {
      schema_version: "workflowhub-receipt.v1", task_id: "task", stage,
      producer: { stage, component: subject, version: "1" }, exit_code: 0,
      command: "npm test", command_hash: sha256("npm test"),
      snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree,
      started_at: "2026-07-31T00:00:00.000Z", completed_at: "2026-07-31T00:00:01.000Z",
      output_ref: `evidence/${subject}.output`, output_hash: sha256("output"),
    } : kind === "acceptance_criterion" ? {
      schema_version: "acceptance-evidence.v1", acceptance_criterion_id: subject,
      result: "pass", snapshot_tree: tree,
      refs: [{ ref: `evidence/${subject}.leaf`, sha256: sha256("leaf") }],
    } : {
      schema_version: "human-confirmation.v1", task_id: "task", stage,
      attempt_ref: "attempt-0001.json", decision: "accepted", confirmed_at: "2026-07-31T00:00:00Z",
    };
    const nestedRaw = `${JSON.stringify(nested)}\n`;
    const nestedRef = `evidence/${subject}.json`;
    if (kind === "test") io.create(nested.output_ref, "output");
    if (kind === "acceptance_criterion") io.create(nested.refs[0].ref, "leaf");
    io.create(nestedRef, nestedRaw);
    const fact = createQualityFact({
      taskId: "task", stage, materialRevision: revision.revision_id, snapshotTree: tree,
      kind, status: "passed", subject,
      evidence: [{ ref: nestedRef, sha256: sha256(nestedRaw), evidence_type: evidenceType(kind) }],
      recordedAt: "2026-07-31T00:00:00Z",
    });
    publishQualityFact({ fact, ...io });
    const freshness = evaluateFactFreshness(
      { ...fact.value, ref: fact.ref, sha256: fact.sha256 },
      { material_revision: revision.revision_id, snapshot_tree: tree },
      { read: io.read },
    );
    return { fact, freshness };
  });
}

describe("derived publication", () => {
  it("persists predicate results/fact refs and rebuilds without trusting serialized completion", () => {
    const io = store();
    const observations = currentFacts({ io, stage: "build-code", revision });
    const input = {
      taskId: "task", stage: "build-code", materialRevision: revision,
      qualityFacts: observations.map((entry) => entry.fact),
      freshness: observations.map((entry) => entry.freshness),
      snapshotTree: "b".repeat(40), read: io.read,
    };
    const publication = createPublication(input);
    expect(publication.value.completion.fact_refs).toHaveLength(Object.keys(STAGE_PREDICATES["build-code"]).length);
    const tampered = { ...publication.value, completion: { status: "completed", missing: [] } };
    const rebuilt = rebuildPublication({ publication: tampered, materialRevision: revision, qualityFacts: input.qualityFacts, freshness: input.freshness, read: io.read });
    expect(rebuilt.value.completion.predicates).toEqual(publication.value.completion.predicates);
    expect(publication.value.completion).toMatchObject({ quality_status: "passed", progression_only: false, formal_acceptance: "not_granted" });
    expect(isFormallyAcceptedPublication(publication)).toBe(false);
  });

  it("marks incomplete-quality publication as progression-only and never formally accepted", () => {
    const io = store();
    const observations = currentFacts({ io, stage: "build-code", revision });
    const publication = createPublication({
      taskId: "task", stage: "build-code", materialRevision: revision,
      qualityFacts: observations.map((entry) => entry.fact),
      freshness: observations.map((entry, index) => index === 0 ? { ...entry.freshness, status: "stale", authenticated: false } : entry.freshness),
      snapshotTree: "b".repeat(40), read: io.read,
      allowIncompleteQuality: true,
      progression: { status: "completed", authority: "current-four-materials-and-plan-tasks" },
    });
    expect(publication.value.completion).toMatchObject({
      status: "completed", quality_status: "incomplete", progression_only: true, formal_acceptance: "not_granted",
    });
    expect(isFormallyAcceptedPublication(publication)).toBe(false);
  });

  it("rejects missing, stale, unauthenticated and canonical-byte-tampered facts", () => {
    const io = store();
    const observations = currentFacts({ io, stage: "verify-code", revision });
    const base = {
      taskId: "task", stage: "verify-code", materialRevision: revision,
      qualityFacts: observations.map((entry) => entry.fact),
      freshness: observations.map((entry) => entry.freshness),
      snapshotTree: "b".repeat(40), read: io.read,
    };
    expect(() => createPublication({ ...base, qualityFacts: base.qualityFacts.slice(1), freshness: base.freshness.slice(1) })).toThrow(/derived completion/);
    expect(() => createPublication({ ...base, freshness: [{ ...base.freshness[0], status: "stale", authenticated: false }, ...base.freshness.slice(1)] })).toThrow(/derived completion/);
    io.records.set(base.qualityFacts[0].ref, `${base.qualityFacts[0].raw}tampered`);
    expect(() => createPublication(base)).toThrow(/canonical bytes/);
  });

  it("uses a time-independent fact_id and idempotently keeps first immutable bytes", () => {
    const nested = { ref: "evidence/review.json", sha256: "3".repeat(64), evidence_type: "review_result" };
    const args = {
      taskId: "task", stage: "verify-code", materialRevision: `revision-${"a".repeat(64)}`,
      snapshotTree: "tree", kind: "review", status: "passed", subject: "independent_review", evidence: [nested],
    };
    const first = createQualityFact({ ...args, recordedAt: "2026-07-31T00:00:00Z" });
    const retry = createQualityFact({ ...args, recordedAt: "2026-07-31T01:00:00Z" });
    expect(retry.value.fact_id).toBe(first.value.fact_id);
    const io = store();
    expect(publishQualityFact({ fact: first, ...io })).toMatchObject({ idempotent: false });
    expect(publishQualityFact({ fact: retry, ...io })).toMatchObject({ idempotent: true });
    expect(io.records.get(first.ref)).toBe(first.raw);
  });
});
