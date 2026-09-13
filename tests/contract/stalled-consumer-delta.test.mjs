import { describe, expect, it } from "vitest";

import { validateSchema } from "../../runtime/review/schema-validator.mjs";
import { REVIEW_ORIGINS } from "../../runtime/task/task-store.mjs";
import { ReviewProviderClient } from "../../skills/wh-review/scripts/review-provider-client.mjs";
import { classifyAttemptTaxonomy } from "../../skills/wh-review/scripts/review-result.mjs";

const materialId = "a".repeat(64);
const runtimeId = "runtime-stalled";
const requestId = "request-stalled";
const provider = "review/provider";

function managedMember() {
  const diagnostic = { code: "PROCESS_STALLED", message: "provider made no progress" };
  return {
    adapter: "review",
    continuable: false,
    effort: null,
    error: diagnostic,
    material_id: materialId,
    model: null,
    output: null,
    provider,
    raw_output_ref: null,
    result_protocol: "workflowhub-result.v2",
    retry: { count: 0, progress_events: 0 },
    runtime_id: runtimeId,
    session_file_path: null,
    session_id: null,
    status: "failed",
    thinking: null,
    timing: { started_at_ms: 0, completed_at_ms: 10, duration_ms: 10 },
    unavailable_diagnostics: diagnostic,
    usage: null,
  };
}

function managedTerminalWire() {
  return {
    exitCode: 0,
    stdout: `${JSON.stringify({
      version: "workflowhub-run.v1",
      request_id: requestId,
      runtime_id: runtimeId,
      state: "terminal",
      material_id: materialId,
      group: {
        host_provider: "codex",
        outcome: "stalled",
        providers: [managedMember()],
        round: 1,
        runtime_id: runtimeId,
        selected_tier: null,
        version: 4,
      },
    })}\n`,
    stderr: "",
  };
}

function stalledAttempt() {
  const tree = "b".repeat(40);
  return {
    version: "wh-review-attempt.v1",
    attempt_id: "attempt-stalled",
    task_id: "task-stalled",
    stage: "build-code",
    review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree },
    snapshot_tree: tree,
    material_id: materialId,
    provider_attempts: [],
    terminal_status: "unavailable",
    error: { code: "PROCESS_STALLED", message: "review provider stalled" },
    dispatch_state: "dispatched",
    coverage: {
      mode: "single_external",
      selected_profiles: [provider],
      selected_count: 1,
      valid_provider_count: 0,
      minimum_required: 1,
      group_outcome: "stalled",
    },
  };
}

describe("stalled consumer delta", () => {
  it("keeps the frozen five review origins unchanged", () => {
    expect(REVIEW_ORIGINS).toEqual([
      "conducted",
      "unavailable",
      "not_run",
      "same_source_degraded",
      "dispatched_uncollected",
    ]);
  });

  it("accepts a stalled managed group at the provider consumer", async () => {
    const client = new ReviewProviderClient({ invoke: async () => managedTerminalWire() });
    await expect(client.statusManaged({
      runtimeId,
      requestId,
      hostProvider: "codex",
      providers: [provider],
      materials: { materialId },
    })).resolves.toMatchObject({ state: "terminal", group: { outcome: "stalled" } });
  });

  it("maps stalled transport errors without turning them into unknown", () => {
    expect(classifyAttemptTaxonomy({ error: { code: "PROCESS_STALLED" } })).toMatchObject({
      code: "PROCESS_STALLED",
      category: "stalled",
    });
    expect(classifyAttemptTaxonomy({ error: { code: "REVIEW_WAIT_EXCEEDED" } })).toMatchObject({
      code: "REVIEW_WAIT_EXCEEDED",
      category: "stalled",
    });
  });

  it("accepts stalled in the attempt coverage contract", () => {
    expect(validateSchema("attempt", stalledAttempt())).toMatchObject({ coverage: { group_outcome: "stalled" } });
  });
});
