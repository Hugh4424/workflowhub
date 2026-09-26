import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  STAGE_FACT_MATERIALS,
  STAGE_PREDICATES,
  deriveStageCompletion,
  deriveStageOutcomeStatuses,
} from "../../runtime/stage/completion-predicates.mjs";
import { deriveNamedStatusRefs, deriveStatusRootCauses } from "../../tools/cli/stage-runtime.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function observation(stage, subject, kind, status = kind === "review" ? "recorded" : "passed", extra = {}) {
  return {
    fact: {
      ref: `quality/facts/${stage}-${subject}.json`,
      value: {
        task_id: "task",
        stage,
        kind,
        subject,
        status,
        fact_id: `${stage}-${subject}`,
        ...extra,
      },
    },
    authenticated: true,
    freshness: { status: "current" },
    ...((stage === "verify-code" && subject === "code_review")
      || (stage === "build-code" && subject === "integration_review")
      ? { review_source: "ocr-delegation" } : {}),
  };
}

function stageFacts(stage, overrides = {}) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind]) => observation(
    stage,
    subject,
    kind,
    overrides[subject]?.status ?? (kind === "review" ? "recorded" : "passed"),
    kind === "review" ? { review_status: overrides[subject]?.review_status ?? (stage === "verify-code" ? "clean" : undefined) } : {},
  ));
}

function stageOutcome({ taskId = "task", stage, tree = "a".repeat(40), revision = "revision-" + "b".repeat(64), status = "completed" }) {
  return {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: taskId,
    stage,
    run_id: `vnext-${sha256(`${taskId}\0${stage}`).slice(0, 32)}`,
    status,
    attempt_id: `attempt-${stage}`,
    producer: { kind: "stage-agent", host: "fixture", source_id: "fixture/agent", source_family: "fixture", agent_run_id: `attempt-${stage}` },
    snapshot_tree: tree,
    material_revision: revision,
    material_hashes: {},
    material_scope: STAGE_FACT_MATERIALS[stage],
    material_scope_revision: "revision-" + "d".repeat(64),
    material_scope_hashes: {},
    steps_manifest_ref: `workflows/${stage}/steps.json`,
    steps_manifest_hash: "e".repeat(64),
    skills_manifest_ref: `workflows/${stage}/skill-deps.yaml`,
    skills_manifest_hash: "f".repeat(64),
    step_outcomes: [],
    skill_outcomes: [],
  };
}

describe("C6 status root causes and named references", () => {
  it("deduplicates one root cause while retaining all concrete details and refs", () => {
    const roots = deriveStatusRootCauses({
      quality: {
        missing: ["verify-code prerequisite missing: code_review", "code_review"],
        predicates: { code_review: { fact_ref: "quality/facts/code-review.json" } },
      },
      stale: { status: "stale", source: "plan.md:HEAD-diff", detail: "main advanced" },
    });

    expect(roots).toHaveLength(2);
    expect(roots[0]).toMatchObject({
      root_cause_id: "code_review",
      status: "actionable",
      source: "quality facts",
      refs: ["quality/facts/code-review.json"],
    });
    expect(roots[0].details).toEqual(["verify-code prerequisite missing: code_review", "code_review"]);
    expect(roots[1]).toMatchObject({
      root_cause_id: "stale",
      status: "stale",
      source: "plan.md:HEAD-diff",
      refs: ["plan.md:HEAD-diff"],
    });
  });

  it("reports unavailable research as a root cause without creating a derived status group", () => {
    const reportRef = "quality/evidence/research/" + "a".repeat(64) + ".json";
    const roots = deriveStatusRootCauses({
      quality: { missing: [], predicates: {} },
      research: { status: "unavailable", report_ref: reportRef },
    });
    expect(roots).toEqual([{
      root_cause_id: "research",
      status: "unavailable",
      source: "research report",
      refs: [reportRef],
      details: ["research:unavailable"],
    }]);
  });

  it("reports incomplete declared candidate delivery from the authenticated full report", () => {
    const reportRef = "quality/evidence/research/" + "b".repeat(64) + ".json";
    const roots = deriveStatusRootCauses({
      quality: { missing: [], predicates: {} },
      research: {
        status: "completed",
        report_ref: reportRef,
        candidate_delivery: {
          status: "incomplete",
          full_report: { ref: reportRef, sha256: "b".repeat(64) },
          missing_candidate_ids: ["route-one", "route-two"],
        },
      },
    });
    expect(roots).toEqual([{
      root_cause_id: "research_candidate_delivery",
      status: "actionable",
      source: "research report",
      refs: [reportRef],
      details: ["candidate delivery incomplete:route-one,route-two"],
    }]);
  });

  it("reports a missing user-visible candidate presentation without changing research status", () => {
    const reportRef = "quality/evidence/research/" + "c".repeat(64) + ".json";
    const roots = deriveStatusRootCauses({
      quality: { missing: [], predicates: {} },
      research: {
        status: "completed",
        report_ref: reportRef,
        candidate_presentation: {
          status: "incomplete",
          reason: "candidate_presentation_missing",
          full_report: { ref: reportRef, sha256: "c".repeat(64) },
        },
      },
    });
    expect(roots).toEqual([{
      root_cause_id: "research_candidate_presentation",
      status: "actionable",
      source: "decision-log.md",
      refs: [reportRef, "decision-log.md"],
      details: ["candidate presentation incomplete:candidate_presentation_missing"],
    }]);
  });

  it("reports an incomplete divergence outline as a decision-log root cause", () => {
    const roots = deriveStatusRootCauses({
      quality: { missing: [], predicates: {} },
      divergenceOutline: { status: "incomplete", reason: "divergence_outline_incomplete" },
    });
    expect(roots).toEqual([{
      root_cause_id: "decision_divergence_outline",
      status: "actionable",
      source: "decision-log.md",
      refs: ["decision-log.md"],
      details: ["divergence outline incomplete:divergence_outline_incomplete"],
    }]);
  });

  it("returns exactly K1 through K6 and classifies confirmation versus evidence refs", () => {
    const confirmation = "quality/confirmations/" + "a".repeat(64) + ".json";
    const authorization = "quality/authorizations/" + "b".repeat(64) + ".json";
    const review = "quality/reviews/results/" + "c".repeat(64) + ".json";
    const proof = "quality/evidence/stage-outcome-proofs/build-code/" + "d".repeat(64) + ".json";
    const refs = deriveNamedStatusRefs({ facts: [{
      record_kind: "stage",
      stage: "build-code",
      human_confirmation_ref: confirmation,
      authorization_ref: authorization,
      review_result_ref: { value: review },
      evidence: { value: [{ ref: proof }] },
    }] });

    expect(refs.map(({ class: name }) => name)).toEqual(["K1", "K2", "K3", "K4", "K5", "K6"]);
    expect(refs[0].refs).toEqual(["task.json"]);
    expect(refs[1].refs).toEqual(["facts.jsonl"]);
    expect(refs[2].refs).toEqual(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
    expect(refs[3].refs).toEqual([confirmation, authorization].sort());
    expect(refs[4].refs).toEqual([proof, review].sort());
    expect(refs[5].refs).toEqual([
      "decision-log.md:HEAD-diff",
      "spec.md:HEAD-diff",
      "plan.md:HEAD-diff",
      "tasks.md:HEAD-diff",
    ]);
  });

  it("uses current stage facts and never emits the retired projection fields", () => {
    const completion = deriveStageCompletion("build-code", stageFacts("build-code"), {
      requireStageOutcome: true,
      stageOutcomeStatus: "completed",
      authenticateCodeReview: () => true,
    });
    const roots = deriveStatusRootCauses({ quality: completion });
    expect(completion.status).toBe("completed");
    expect(roots).toEqual([{
      root_cause_id: "none",
      status: "clear",
      source: "facts.jsonl",
      refs: ["facts.jsonl"],
      details: ["no canonical root cause recorded"],
    }]);
    for (const retired of ["quality_gaps", "release_gaps", "close_preparation_gaps", "actionable_now", "status_groups", "product_release"]) {
      expect(roots).not.toHaveProperty(retired);
    }
  });

  it("keeps a failed current predicate visible and does not promote it to completion", () => {
    const completion = deriveStageCompletion("build-code", stageFacts("build-code", {
      risk_tests_fresh: { status: "failed" },
    }), { requireStageOutcome: true, stageOutcomeStatus: "completed", authenticateCodeReview: () => true });
    expect(completion.status).toBe("in_progress");
    expect(completion.missing).toContain("risk_tests_fresh");
    expect(deriveStatusRootCauses({ quality: completion })[0]).toMatchObject({ root_cause_id: "risk_tests_fresh" });
  });

  it("discloses an absent current stage outcome without turning it into a quality predicate", () => {
    const completedFacts = stageFacts("verify-code");
    // ADR-0026: the outcome projection must not write into the quality predicates,
    // must not generate `missing`, and must not gate stage quality completion. The
    // absence stays visible through the explicit outcome disclosure instead.
    expect(deriveStageCompletion("verify-code", completedFacts, {
      requireStageOutcome: true,
      stageOutcomeStatus: "unavailable",
      authenticateCodeReview: () => true,
    })).toMatchObject({
      status: "completed",
      missing: [],
      outcome_disclosure: { status: "unavailable" },
    });
    expect(deriveStageCompletion("verify-code", completedFacts, {
      requireStageOutcome: true,
      stageOutcomeStatus: "completed",
      authenticateCodeReview: () => true,
    })).toMatchObject({
      status: "completed",
      missing: [],
      outcome_disclosure: { status: "completed" },
    });
  });

  it("reads a valid legacy stage-outcome envelope only when no frozen row is supplied", () => {
    const tree = "a".repeat(40);
    const revision = "revision-" + "b".repeat(64);
    const value = stageOutcome({ stage: "make-decision", tree, revision });
    const raw = `${JSON.stringify(value)}\n`;
    const ref = `quality/evidence/stage-outcomes/make-decision/${sha256(raw)}.json`;
    const statuses = deriveStageOutcomeStatuses({
      task_id: "task",
      read: (candidate) => {
        if (candidate === ref) return raw;
        const error = new Error("missing");
        error.code = "ENOENT";
        throw error;
      },
      stage_outcome_refs: { "make-decision": [ref] },
      snapshot_tree: tree,
      material_revision: revision,
      material_scope_revisions: { "make-decision": value.material_scope_revision },
      authenticate: ({ value: candidate }) => candidate,
    });
    expect(statuses["make-decision"]).toBe("completed");
  });

  it("projects the frozen K2 review facts without adding a new row key", () => {
    const review = "quality/reviews/results/" + "c".repeat(64) + ".json";
    const statuses = deriveStageOutcomeStatuses({
      task_id: "task",
      read: () => { throw new Error("stage outcome bytes must not be read"); },
      stage_outcome_refs: {},
      snapshot_tree: "a".repeat(40),
      material_revision: "revision-" + "b".repeat(64),
      material_scope_revisions: {},
      authenticate: () => null,
      read_task_facts: () => [{
        record_kind: "stage",
        task_id: "task",
        stage: "build-code",
        source: "stage-end:build-code",
        created_at: "2026-09-15T00:00:00.000Z",
        material_digest: { value: "b".repeat(64) },
        snapshot_tree: { value: "a".repeat(40) },
        review_origin: "conducted",
        review_result_ref: { value: review },
        finding_dispositions: [{ finding_id: "F-1", status: "fixed" }],
        layer_states: { implementation_completion: "completed" },
      }],
    });
    expect(statuses["build-code"]).toBe("completed");
    expect(statuses.record_reasons).toMatchObject({
      "build-plan": expect.stringContaining("no build-plan stage row"),
      "build-spec": expect.stringContaining("no build-spec stage row"),
      "make-decision": expect.stringContaining("no make-decision stage row"),
      "verify-code": expect.stringContaining("no verify-code stage row"),
    });
  });
});
