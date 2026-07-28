import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { selectReviewRound } from "../skills/wh-review/scripts/review-controller.mjs";
import * as reviewAuthority from "../core/review-flow-authority.mjs";

const route = { mode: "full_on_structural_rework", initial: ["external/reviewer"] };
const previous = {
  result_ref: "reviews/results/build-plan.json",
  verdict: "pass",
  snapshot_tree: "a".repeat(40),
  adjudication: { clusters: [] },
};
const ordinary = {
  version: "wh-review-response-ledger.v1",
  previous_result_ref: previous.result_ref,
  previous_snapshot_tree: previous.snapshot_tree,
  current_snapshot_tree: "b".repeat(40),
  change: {
    changed_dimensions: [],
    rationale: "wording only",
    evidence_refs: ["evidence/delta.json"],
  },
  responses: [],
};
const structural = {
  ...ordinary,
  change: { ...ordinary.change, changed_dimensions: ["schema"] },
};

describe("non-code review cost policy", () => {
  it.each(["build-spec", "build-plan", "verify-code"])("%s documents findings-only review and bounded change handling", (stage) => {
    const skill = readFileSync(new URL(`../workflows/${stage}/SKILL.md`, import.meta.url), "utf8");
    expect(skill).toMatch(/finding(?:s)?[\s\S]{0,200}(?:fixed|rejected_invalid|accepted_risk|unverified)/i);
    expect(skill).toMatch(/ordinary (?:change|edit|repair)[\s\S]{0,160}(?:zero provider|provider calls remain zero|does not call a provider)/i);
    expect(skill).toMatch(/structural (?:change|re-review)[\s\S]{0,160}(?:at most one|only one|capped at one).*?(?:full|complete) review/i);
    expect(skill).toMatch(/second structural[\s\S]{0,120}stop/i);
    expect(skill).not.toMatch(/there is no numeric review limit|repeat for every changed draft|until .* no unresolved actionable/i);
  });

  it.each(["build-spec", "build-plan", "verify-code"])("%s ordinary edit dispatches no provider", (stage) => {
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previous,
      ledger: ordinary,
      currentSnapshotTree: ordinary.current_snapshot_tree,
    })).toEqual({ round: "none", reason: "review_non_gate_recorded" });
  });

  it.each(["build-spec", "build-plan", "verify-code"])("%s allows one structural full and blocks the second before dispatch", (stage) => {
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previous,
      ledger: structural,
      currentSnapshotTree: structural.current_snapshot_tree,
    })).toEqual({ round: "full", reason: "structural_rework" });
    expect(selectReviewRound({
      stage,
      route,
      previousResult: previous,
      ledger: structural,
      currentSnapshotTree: structural.current_snapshot_tree,
      structuralFullAlreadyRecorded: true,
    })).toEqual({ round: "none", reason: "post_full_non_gate_recorded" });
  });
});

describe("build-code adjudication correction contract", () => {
  const hash = "a".repeat(64);
  const tree = "b".repeat(40);
  const correction = {
    schema_version: "workflowhub-build-code-adjudication-correction.v1",
    task_id: "stage-content-contracts",
    stage: "build-code",
    phase_id: "phase-5",
    prior_snapshot_tree: "c".repeat(40),
    prior_result_ref: "reviews/results/build-code-prior.json",
    prior_result_hash: hash,
    prior_attempt_ref: "reviews/attempts/prior/attempt.json",
    prior_attempt_hash: hash,
    finding_id: "F-36caa5e1a901",
    finding_severity: "blocking",
    prior_disposition: "invalid_evidence",
    provider_verdict: "revise_required",
    proof: {
      kind: "mechanical",
      evidence_ref: "evidence/schema-red.output",
      evidence_hash: hash,
    },
    repair: {
      implementation_receipt_ref: "receipts/revisions/implementation/repair.json",
      implementation_receipt_hash: hash,
      test_receipt_ref: "receipts/build-tests-repair.json",
      test_receipt_hash: hash,
      phase_evidence_ref: `evidence/phases/phase-5/${tree}/phase-evidence-${hash}.json`,
      phase_evidence_hash: hash,
      snapshot_tree: tree,
    },
  };
  const issue = "published plan-task schema does not parse";
  const boundInputs = (value = correction, existingCorrections = [], overrides = {}) => ({
    correction: value,
    priorResult: {
      ref: value.prior_result_ref,
      hash: value.prior_result_hash,
      value: {
        stage: "build-code",
        subject_kind: "phase",
        phase_id: "phase-5",
        snapshot_tree: correction.prior_snapshot_tree,
        verdict: "pass",
        attempt_ref: correction.prior_attempt_ref,
        adjudication: {
          clusters: [{
            id: correction.finding_id,
            severity: correction.finding_severity,
            disposition: correction.prior_disposition,
            path: "broken.json",
            issue,
            providers: ["pi/coding"],
          }],
        },
      },
    },
    priorAttempt: {
      ref: value.prior_attempt_ref,
      hash: value.prior_attempt_hash,
      value: {
        attempt_id: "prior",
        stage: "build-code",
        subject_kind: "phase",
        phase_id: "phase-5",
        snapshot_tree: correction.prior_snapshot_tree,
        provider_attempts: [{ provider: "pi/coding", status: "completed" }],
      },
    },
    providerFinding: {
      provider: "pi/coding",
      verdict: "revise_required",
      finding: { severity: "blocking", path: "broken.json", issue },
    },
    proof: {
      ref: value.proof.evidence_ref,
      hash: value.proof.evidence_hash,
      value: {
        kind: "json_parse_failure",
        path: "broken.json",
        prior_snapshot_tree: correction.prior_snapshot_tree,
        repair_snapshot_tree: correction.repair.snapshot_tree,
      },
    },
    implementationReceipt: {
      ref: value.repair.implementation_receipt_ref,
      hash: value.repair.implementation_receipt_hash,
      value: {
        producer: { stage: "build-code", component: "implementation" },
        snapshot_tree: correction.repair.snapshot_tree,
      },
    },
    testReceipt: {
      ref: value.repair.test_receipt_ref,
      hash: value.repair.test_receipt_hash,
      value: {
        producer: { stage: "build-code", component: "build-code-test-capture" },
        snapshot_tree: correction.repair.snapshot_tree,
        exit_code: 0,
      },
    },
    phaseEvidence: overrides.phaseEvidence ?? {
      ref: value.repair.phase_evidence_ref,
      hash: value.repair.phase_evidence_hash,
      value: {
        phase_id: "phase-5",
        status: "awaiting_review",
        evidence: {
          implementation_receipt_ref: value.repair.implementation_receipt_ref,
          green_test_receipt_ref: value.repair.test_receipt_ref,
        },
      },
    },
    existingCorrections,
    readSnapshotFile: (snapshot) => snapshot === correction.prior_snapshot_tree ? "{" : "{}",
  });

  it("allows one narrowly bound build-code correction after a mechanically disproved PASS adjudication", () => {
    expect(reviewAuthority.validateBuildCodeAdjudicationCorrection).toBeTypeOf("function");
    expect(reviewAuthority.validateBuildCodeAdjudicationCorrection(boundInputs())).toMatchObject({
      stage: "build-code",
      phase_id: "phase-5",
      prior_result_ref: correction.prior_result_ref,
      repair: { snapshot_tree: tree },
    });
  });

  it.each([
    ["non-build-code stage", { stage: "build-plan" }],
    ["minor provider finding", { finding_severity: "minor" }],
    ["actionable prior disposition", { prior_disposition: "actionable" }],
    ["non-mechanical proof", { proof: { ...correction.proof, kind: "opinion" } }],
    ["same snapshot repair", { repair: { ...correction.repair, snapshot_tree: correction.prior_snapshot_tree } }],
  ])("rejects %s", (_label, patch) => {
    expect(reviewAuthority.validateBuildCodeAdjudicationCorrection).toBeTypeOf("function");
    const changed = { ...correction, ...patch };
    expect(() => reviewAuthority.validateBuildCodeAdjudicationCorrection(boundInputs(changed))).toThrow();
  });

  it("rejects Phase evidence that does not bind the repair receipts", () => {
    const input = boundInputs();
    expect(() => reviewAuthority.validateBuildCodeAdjudicationCorrection({
      ...input,
      phaseEvidence: {
        ...input.phaseEvidence,
        value: {
          ...input.phaseEvidence.value,
          evidence: {
            ...input.phaseEvidence.value.evidence,
            implementation_receipt_ref: "receipts/revisions/implementation/other.json",
          },
        },
      },
    })).toThrow(/Phase evidence|repair receipt|binding/i);
  });

  it("rejects a second correction for the same Phase and keeps one frozen Phase review closed", () => {
    expect(reviewAuthority.validateBuildCodeAdjudicationCorrection).toBeTypeOf("function");
    expect(() => reviewAuthority.validateBuildCodeAdjudicationCorrection(boundInputs(
      correction,
      [{ stage: "build-code", phase_id: "phase-5" }],
    ))).toThrow(/once|already|phase/i);
    expect(selectReviewRound({
      stage: "build-code",
      route: { mode: "full_only", initial: ["external/reviewer"] },
      previousResult: { ...previous, verdict: "pass" },
      currentSnapshotTree: "b".repeat(40),
    })).toEqual({ round: "none", reason: "phase_quality_fact_recorded" });
  });
});
