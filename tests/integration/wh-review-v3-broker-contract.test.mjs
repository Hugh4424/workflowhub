import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
let sink;
beforeEach(() => {
  sink = mkdtempSync(join(tmpdir(), "wh-review-broker-contract-"));
  vi.stubEnv("WORKFLOWHUB_REVIEW_SINK_ROOT", sink);
});
afterEach(() => { vi.unstubAllEnvs(); rmSync(sink, { recursive: true, force: true }); });
import { runReviewRecovery as recoverReview } from "../../skills/wh-review/scripts/wh-review-cli.mjs";

const runReviewRecovery = (input, dependencies) => recoverReview(input, {
  resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }), ...dependencies,
});

test("WorkflowHub sends one broker request and preserves unavailable instead of adding retries", async () => {
  let calls = 0;
  const result = await runReviewRecovery({ snapshot_tree: "tree", material_id: "material" }, {
    runRound: async () => {
      calls += 1;
      return { status: "unavailable", error_code: "PROCESS_DEAD", snapshot_tree: "tree", material_id: "material" };
    },
  });
  expect(calls).toBe(1);
  expect(result.status).toBe("unavailable");
  expect(result.recovery).not.toBe("same_source_fallback");
});


test("T005 bare recovery preserves the caller's phase metadata without a second review", async () => {
  let calls = 0;
  const request = { stage: "build-code", material_id: "phase-material", subject_kind: "phase", phase_id: "P2", review_scope: "phase" };
  const result = await runReviewRecovery(request, { runRound: async (input) => {
    calls += 1;
    expect(input).toMatchObject(request);
    return { status: "available", material_id: input.material_id, findings: [] };
  } });
  expect(calls).toBe(1);
  expect(result).toMatchObject({ subject_kind: "phase", phase_id: "P2", review_scope: "phase" });
});

test("T005 bare semantic review reuse cannot be bypassed by changing reason", async () => {
  let calls = 0;
  const request = { stage: "build-code", material_id: "stable-material", host_provider: "codex/luna" };
  const runRound = async () => { calls += 1; return { status: "available", material_id: request.material_id, findings: [] }; };
  await runReviewRecovery(request, { runRound });
  const reused = await runReviewRecovery({ ...request, reason: "try again" }, { runRound });
  expect(calls).toBe(1);
  expect(reused.reused).toBe(true);
});
