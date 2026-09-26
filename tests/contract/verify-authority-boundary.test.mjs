import * as completionPredicates from "../../runtime/stage/completion-predicates.mjs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";
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
    review_source: "ocr-delegation",
  };
}

describe("current verification authority boundary", () => {
  it("reads legacy zero-provider unavailable attempts without promoting them to a pass", async () => {
    const attemptId = "62505679-5b46-4bc3-abbf-1dd813b7c12d";
    const ref = `quality/reviews/attempts/${attemptId}/attempt.json`;
    const legacyAttempt = {
      version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "legacy-task", stage: "verify-code",
      review_track: null,
      source: { target_commit: "a".repeat(40), base_commit: "b".repeat(40), base_tree: "c".repeat(40), captured_head: "b".repeat(40) },
      snapshot_tree: "d".repeat(40), material_id: "e".repeat(64), provider_attempts: [],
      terminal_status: "unavailable", error: { code: "PROCESS_TIMEOUT", message: "provider process ended without terminal output" },
    };
    const consume = (attempt) => officialStageHandler("verify-code")({
      stage: "verify-code", identity: { taskId: "legacy-task" }, manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: `revision-${"f".repeat(64)}`,
      readReceipt: (readRef) => {
        expect(readRef).toBe(ref);
        return { value: attempt, sha256: createHash("sha256").update(JSON.stringify(attempt)).digest("hex") };
      },
      readArtifact: () => "# Decision\n", snapshotWorkspace: () => ({ tree: attempt.snapshot_tree }),
    }, { receipts: { quality_review: ref } });

    const legacy = await consume(legacyAttempt);
    expect(legacy.facts.code_review).toMatchObject({ status: "unavailable", attempt_ref: ref, error: legacyAttempt.error });
    expect(legacy.facts.code_review.attempt_hash).toBe(createHash("sha256").update(JSON.stringify(legacyAttempt)).digest("hex"));
    expect(legacy.facts.completion_subjects.code_review.status).toBe("missing");
    await expect(consume({ ...legacyAttempt, attempt_id: "different-attempt" })).rejects.toThrow(/attempt_ref identity mismatch/);
    await expect(consume({ ...legacyAttempt, dispatch_state: "dispatched" })).rejects.toThrow(/non-dispatched transport state/);
    await expect(consume({ ...legacyAttempt, error: { code: "NEW_UNKNOWN_ERROR", message: "no provider" } })).rejects.toThrow(/provider attempts/);
  });

  it("uses the authenticated quality fact as the only completion input", () => {
    const completion = completionPredicates.deriveStageCompletion("verify-code", [
      fact("quality/facts/code-review.json", "2026-09-10T01:00:00.000Z"),
    ], { authenticateCodeReview: () => true });
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
