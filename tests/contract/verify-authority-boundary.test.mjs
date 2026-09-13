import * as completionPredicates from "../../runtime/stage/completion-predicates.mjs";
import { describe, expect, it } from "vitest";

import { deriveNamedStatusRefs, deriveStatusRootCauses } from "../../tools/cli/stage-runtime.mjs";

const identity = {
  task_id: "task",
  stage: "verify-code",
  kind: "review",
  subject: "code_review",
  review_status: "clean",
};

function fact(ref, recordedAt, status = "recorded") {
  return {
    fact: { ref, value: { ...identity, status, recorded_at: recordedAt } },
    authenticated: true,
  };
}

describe("current verification authority boundary", () => {
  it("uses the authenticated quality fact as the only completion input", () => {
    const completion = completionPredicates.deriveStageCompletion("verify-code", [
      fact("quality/facts/code-review.json", "2026-09-10T01:00:00.000Z"),
    ]);
    expect(completion).toMatchObject({ status: "completed", missing: [] });
    expect(completion.fact_refs).toEqual(["quality/facts/code-review.json"]);
    expect(completion).not.toHaveProperty("accepted_ref");
    expect(completion).not.toHaveProperty("current_pointer");
  });

  it("fails closed for tied current facts instead of choosing by path order", () => {
    const completion = completionPredicates.deriveStageCompletion("verify-code", [
      fact("quality/facts/code-review-first.json", "2026-09-10T01:00:00.000Z"),
      fact("quality/facts/code-review-second.json", "2026-09-10T01:00:00.000Z"),
    ]);
    expect(completion.status).toBe("in_progress");
    expect(completion.missing).toContain("code_review");
    expect(completion.predicates.code_review.status).toBe("conflict");
  });

  it("keeps unavailable or unauthenticated facts out of the current authority", () => {
    const completion = completionPredicates.deriveStageCompletion("verify-code", [
      { ...fact("quality/facts/unavailable.json", "2026-09-10T01:00:00.000Z", "unavailable"), authenticated: false },
    ]);
    expect(completion.status).toBe("in_progress");
    expect(completion.missing).toEqual(["code_review"]);
  });

  it("connects the current root cause to its named K2/K5 refs", () => {
    const rootRef = "quality/facts/code-review.json";
    const evidenceRef = "quality/reviews/results/" + "a".repeat(64) + ".json";
    const quality = {
      missing: ["code_review"],
      predicates: { code_review: { fact_ref: rootRef } },
    };
    const causes = deriveStatusRootCauses({ quality });
    const refs = deriveNamedStatusRefs({ facts: [{ record_kind: "stage", review_result_ref: evidenceRef }] });
    expect(causes).toEqual([{
      root_cause_id: "code_review",
      status: "actionable",
      source: "quality facts",
      refs: [rootRef],
      details: ["code_review"],
    }]);
    expect(refs.find(({ class: name }) => name === "K5").refs).toEqual([evidenceRef]);
  });

  it("has no product-summary authority exports", () => {
    expect(completionPredicates.deriveProductRelease).toBeUndefined();
    expect(completionPredicates.deriveCurrentProductRelease).toBeUndefined();
  });
});
