import { describe, expect, it } from "vitest";

import { e2eAcceptanceFacts } from "../../runtime/stage/stage-handlers.mjs";
import { deriveStageCompletion } from "../../runtime/stage/completion-predicates.mjs";

const HASH = "a".repeat(64);
const TREE = "b".repeat(40);

function observation(subject, status = subject === "code_review" ? "recorded" : "passed", recordedAt = "2026-08-30T00:00:00.000Z") {
  return {
    authenticated: true,
    freshness: { status: "current" },
    ...(subject === "code_review" ? { review_status: "clean", review_source: "wh_review.v2" } : {}),
    fact: {
      ref: `quality/facts/${subject}-${status}.json`,
      value: {
        schema_version: "quality-fact.v1",
        stage: "verify-code",
        kind: subject === "code_review" ? "review" : subject === "human_confirmation" ? "confirmation" : "acceptance_criterion",
        subject,
        status,
        ...(subject === "code_review" ? { review_status: "clean", source: "wh_review.v2" } : {}),
        task_id: "e2e-verdict",
        snapshot_tree: TREE,
        material_revision: `revision-${HASH}`,
        recorded_at: recordedAt,
      },
    },
  };
}

function worker(evidence) {
  return {
    stage: "verify-code",
    readE2eAcceptanceEvidence: () => evidence,
  };
}

const completeEvidence = {
  required: true,
  execution: {
    status: "passed",
    ref: "quality/evidence/acceptance/build-code/acceptance-execution.json",
    sha256: HASH,
    executor_actor: { source_kind: "stage-agent", source_id: "build-code-host", run_id: "build-code-run-1" },
  },
  independent_review: {
    status: "recorded",
    ref: "quality/reviews/results/external-review.json",
    sha256: HASH,
    reviewer_actor: { source_kind: "review-provider", source_id: "external-reviewer-1", run_id: "review-run-1" },
    frozen_material: { ref: `quality/evidence/review-materials/${HASH}.json`, sha256: HASH, provider_input_sha256: HASH },
  },
  user_confirmation: {
    status: "accepted",
    ref: "quality/confirmations/user-acceptance.json",
    sha256: HASH,
  },
};

describe("acceptance verdict independence", () => {
  it("requires execution, an independent frozen review, and a user confirmation before a UI/fullstack E2E verdict can pass", () => {
    expect(e2eAcceptanceFacts(worker(completeEvidence))).toMatchObject({ status: "passed", required: true });
    expect(e2eAcceptanceFacts(worker({ ...completeEvidence, independent_review: { ...completeEvidence.independent_review, status: "missing" } }))).toMatchObject({ status: "missing" });
    expect(e2eAcceptanceFacts(worker({ ...completeEvidence, user_confirmation: { ...completeEvidence.user_confirmation, status: "missing" } }))).toMatchObject({ status: "missing" });
    expect(e2eAcceptanceFacts(worker({ ...completeEvidence, independent_review: { ...completeEvidence.independent_review, reviewer_actor: { ...completeEvidence.independent_review.reviewer_actor, source_id: "build-code-host" } } }))).toMatchObject({ status: "missing" });
    expect(e2eAcceptanceFacts(worker({ ...completeEvidence, independent_review: { ...completeEvidence.independent_review, frozen_material: null } }))).toMatchObject({ status: "missing" });
    expect(e2eAcceptanceFacts(worker({ ...completeEvidence, independent_review: { ...completeEvidence.independent_review, ref: null } }))).toMatchObject({ status: "missing" });
  });

  it("adds the E2E predicate only when the verify stage actually publishes the conditional fact", () => {
    const base = [observation("code_review"), observation("human_confirmation")];
    expect(deriveStageCompletion("verify-code", base)).toMatchObject({ status: "completed" });
    expect(deriveStageCompletion("verify-code", [...base, observation("e2e_acceptance", "missing")])).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["e2e_acceptance"]),
    });
    expect(deriveStageCompletion("verify-code", [...base, observation("e2e_acceptance")])).toMatchObject({ status: "completed" });
  });

  it.each(["failed", "missing"])("selects the uniquely latest E2E terminal (%s), never an older pass", (latestStatus) => {
    const base = [observation("code_review"), observation("human_confirmation")];
    const oldPass = observation("e2e_acceptance", "passed", "2026-08-30T00:00:00.000Z");
    const latest = observation("e2e_acceptance", latestStatus, "2026-08-30T00:00:01.000Z");
    expect(deriveStageCompletion("verify-code", [...base, oldPass, latest])).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["e2e_acceptance"]),
    });
  });
});
