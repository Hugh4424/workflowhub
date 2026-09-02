import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MAX_REVIEWER_OUTPUT_BYTES, parseReviewerOutput } from "../review-output.mjs";
import { aggregateProviderResults, classificationSummary, classifyAttempt, renderReviewReport, writeSemanticResult } from "../review-result.mjs";
import { actionableSeriousFindings, findReusableReviewResult, reviewCycleDecision, verifyFinalSubject } from "../review-runner.mjs";
import { createSimpleReviewPacket, dispatchFrozenProviderInput, runSimpleReview, serializeProviderInput } from "../simple-review-runner.mjs";
import { createTask } from "../../../../runtime/task/task-handle.mjs";

const empty = JSON.stringify({ findings: [] });
const materialId = "a".repeat(64);
const source = {
  targetCommit: "1".repeat(40),
  baseCommit: "2".repeat(40),
  baseTree: "3".repeat(40),
  capturedHead: "4".repeat(40),
  snapshotTree: "5".repeat(40),
};
const temporary = [];

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

function reusableRecord(snapshotTree = source.snapshotTree) {
  const recordSource = {
    target_commit: source.targetCommit,
    base_commit: source.baseCommit,
    base_tree: source.baseTree,
    captured_head: source.capturedHead,
  };
  const attempt = {
    version: "wh-review-attempt.v1",
    attempt_id: "one",
    task_id: "task",
    stage: "build-code",
    review_track: null,
    review_kind: null,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: "integration",
    base_tree: source.baseTree,
    candidate_tree: snapshotTree,
    source: recordSource,
    snapshot_tree: snapshotTree,
    material_id: materialId,
    provider_attempts: [{ provider: "other/model", status: "completed", session_id: null, runtime_id: "runtime", output_ref: null, error: null }],
    terminal_status: "semantic",
    error: null,
  };
  const projection = {
    projection_version: "wh-review-semantic-projection.v1",
    surface: "build-code",
    contract_id: "contract",
    contract_hash: "b".repeat(64),
    semantic_hash: "c".repeat(64),
  };
  const result = {
    version: "wh-review-result.v1",
    task_id: "task",
    stage: "build-code",
    review_track: null,
    review_kind: null,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: "integration",
    base_tree: source.baseTree,
    candidate_tree: snapshotTree,
    source: recordSource,
    snapshot_tree: snapshotTree,
    material_id: materialId,
    attempt_ref: "quality/reviews/attempts/one/attempt.json",
    provider_results: [{ provider: "other/model", output: { findings: [] } }],
    findings: [],
    adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    semantic_projection: projection,
  };
  return { attempt, result, projection };
}

describe("current wh-review helpers", () => {
  it("accepts exactly one reviewer JSON object and rejects malformed or oversized output", () => {
    expect(parseReviewerOutput(empty)).toEqual({ findings: [] });
    expect(parseReviewerOutput(["note", "```json", empty, "```"].join("\n"))).toEqual({ findings: [] });
    expect(() => parseReviewerOutput("not json")).toThrow(/OUTPUT_INVALID/);
    const atLimit = `${empty}${" ".repeat(MAX_REVIEWER_OUTPUT_BYTES - Buffer.byteLength(empty, "utf8"))}`;
    expect(parseReviewerOutput(atLimit)).toEqual({ findings: [] });
    expect(() => parseReviewerOutput(`${atLimit}x`)).toThrow(new RegExp(`exceeds ${MAX_REVIEWER_OUTPUT_BYTES} bytes`));
  });

  it("keeps transport failures separate from semantic review facts", () => {
    const completed = { provider: "kimi", status: "completed", error: null, execution: { timing: { duration_ms: 10 } } };
    const failed = { provider: "opencode", status: "failed", error: { code: "OUTPUT_INVALID" }, execution: { timing: { duration_ms: 20 } } };
    expect(classifyAttempt(completed)).toBe("completed");
    expect(classifyAttempt(failed)).toBe("OUTPUT_INVALID");
    expect(classificationSummary({ provider_attempts: [completed, failed] })).toMatchObject({
      attempt: { completed: 1, OUTPUT_INVALID: 1 }, failed_duration_ms: 20, quality_denominator: 1,
    });
  });

  it("keeps broker recovery counters in cost facts", () => {
    const summary = classificationSummary({ provider_attempts: [{
      provider: "codex/luna", status: "completed", error: null,
      execution: {
        timing: { duration_ms: 10 }, retry: { count: 2, progress_events: 0 },
        recovery: { provider_internal_retry_count: 2, fresh_execution_retry_count: 1, same_session_repair_count: 3 },
      },
    }] });
    expect(summary.retry_count).toBe(6);
    expect(summary.retry_breakdown).toEqual({
      outer_execution_retry_count: 0,
      provider_internal_retry_count: 2,
      fresh_execution_retry_count: 1,
      same_session_repair_count: 3,
    });
  });

  it.each([
    ["configured effort separately when the broker does not attest it", null, "effort=UNAVAILABLE (configured=max)"],
    ["configured tuning as broker-attested when v3 carries profile identity", { provider: "opencode/v4flash", adapter: "opencode", source_id: "opencode-source", config_id: "broker-config", model: "deepseek" }, "effort=BROKER_CONFIG_ATTESTED (configured=max)"],
  ])("reports %s", (_label, identity, expectedEffort) => {
    const report = renderReviewReport({ attempt: {
      stage: "build-code", attempt_id: "attempt", task_id: "task", subject_kind: "worktree", phase_id: null,
      snapshot_tree: "a".repeat(40), material_id: "b".repeat(64), terminal_status: "semantic", provider_attempts: [{
        provider: "opencode/v4flash", status: "completed", error: null, session_id: null, runtime_id: "runtime",
        ...(identity === null ? {} : { identity }),
        unavailable_diagnostics: null,
        execution: { adapter: "opencode", model: "deepseek", effort: null, thinking: null, timing: { duration_ms: 1 }, usage: null },
      }],
      review_policy: {
        source: "wh_review.v2", mode: "full_only", requested_profiles: ["opencode/v4flash"],
        requested_profile_specs: [{ provider: "opencode/v4flash", priority: 1, model: "deepseek", effort: "max", thinking: true }],
        eligible_profiles: ["opencode/v4flash"], same_source_exclusions: [],
      },
      coverage: { mode: "parallel_external", valid_provider_count: 1, minimum_required: 1 },
    } });
    expect(report).toContain(expectedEffort);
    if (identity) expect(report).toContain("thinking=BROKER_CONFIG_ATTESTED (configured=true)");
  });

  it.each([
    "PROVIDER_OUTPUT_INVALID",
    "PROVIDER_NO_TERMINAL_RESULT",
    "PROCESS_TIMEOUT",
    "RATE_LIMITED",
    "CANCELLED",
  ])("keeps broker failure code %s out of UNKNOWN", (code) => {
    const providerAttempt = {
      provider: "opencode/v4flash",
      status: "failed",
      error: { code },
      execution: { timing: { duration_ms: 20 } },
    };
    expect(classifyAttempt(providerAttempt)).toBe(code);
    expect(classificationSummary({ provider_attempts: [providerAttempt] })).toMatchObject({
      attempt: { [code]: 1, UNKNOWN: 0 },
      failure_taxonomy: { [code]: { code, count: 1 } },
    });
  });

  it("keeps an invalid evidence anchor from becoming a pass finding", () => {
    const finding = { severity: "major", path: "a.js", line: 1, issue: "x", recommendation: "fix", evidence_kind: "direct", evidence: "a.js:1", root_cause: "unsafe branch" };
    const direct = { provider: "kimi/coding", review: { findings: [finding] }, final: { status: "completed" }, calls: [], evidenceAnchors: [true] };
    const invalid = { provider: "opencode/v4flash", review: { findings: [finding] }, final: { status: "completed" }, calls: [], evidenceAnchors: [false] };
    expect(aggregateProviderResults([direct, invalid], 1).adjudication.clusters[0]).toMatchObject({ disposition: "actionable" });
  });

  it("does not treat an unmet reviewer quorum as a semantic pass", () => {
    const result = aggregateProviderResults([
      { provider: "kimi", review: { findings: [] } },
      { provider: "opencode", review: null },
    ], 2);
    expect(result).toMatchObject({ status: "unavailable", valid: [{ provider: "kimi" }] });
  });

  it("limits serious-finding continuation to one focused review after a real repair", () => {
    const finding = { id: "F-serious", severity: "major", disposition: "actionable", path: "a.js", line: 1, issue: "unsafe branch" };
    const result = { findings: [finding], adjudication: { clusters: [finding] } };
    expect(actionableSeriousFindings(result)).toEqual([finding]);
    expect(reviewCycleDecision({ stage: "build-code", result })).toMatchObject({ status: "needs_human", action: "stop" });
    expect(reviewCycleDecision({ stage: "build-code", result, actualRepair: true })).toMatchObject({ status: "focused_review_required", action: "review_once" });
    expect(reviewCycleDecision({ stage: "build-code", result, previousResult: result, actualRepair: true })).toMatchObject({ status: "needs_human", reason: "same_important_finding_repeated_after_focused_review" });
    expect(reviewCycleDecision({ stage: "build-code", result: { findings: [], adjudication: { clusters: [] } } })).toMatchObject({ status: "clean_current_review", action: "stop" });
    expect(reviewCycleDecision({ stage: "build-code", result: { status: "unavailable" } })).toMatchObject({ status: "incomplete", action: "stop" });
  });

  it("keeps verify-final bound to the reviewed candidate snapshot", () => {
    const result = {
      stage: "build-code", review_scope: "integration", subject_kind: "worktree",
      source: { target_commit: source.targetCommit, base_commit: source.baseCommit, base_tree: source.baseTree, captured_head: source.capturedHead },
      base_tree: source.baseTree, candidate_tree: source.snapshotTree, snapshot_tree: source.snapshotTree,
    };
    const integrationSubject = { base_commit: source.baseCommit, base_tree: source.baseTree, snapshot_tree: source.snapshotTree };
    expect(verifyFinalSubject({ result, current: source, integrationSubject })).toMatchObject({ status: "finalized", snapshotTree: source.snapshotTree });
    expect(() => verifyFinalSubject({ result, current: { ...source, snapshotTree: "6".repeat(40) }, integrationSubject })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
  });

  it("reuses only a current canonical snapshot and leaves the task write-free", () => {
    const { attempt, result, projection } = reusableRecord();
    const records = new Map([
      ["quality/reviews/results/one.json", JSON.stringify(result)],
      [attempt.attempt_ref ?? "quality/reviews/attempts/one/attempt.json", JSON.stringify(attempt)],
    ]);
    const writes = [];
    const task = {
      identity: { taskId: "task" },
      listCanonicalReviewResultRefs: () => ["quality/reviews/results/one.json"],
      readRecord: (ref) => records.get(ref),
      createRecordAtomic: (...args) => writes.push(args),
    };
    const subject = { subject_kind: "worktree", phase_id: null, review_scope: "integration", base_tree: source.baseTree };
    expect(findReusableReviewResult({ task, source, subject, stage: "build-code", semanticProjection: projection })).toMatchObject({
      resultRef: "quality/reviews/results/one.json", exact: true,
    });
    expect(findReusableReviewResult({
      task, source: { ...source, snapshotTree: "6".repeat(40) }, subject, stage: "build-code", semanticProjection: projection,
    })).toBeNull();
    expect(writes).toHaveLength(0);
  });

  it("keeps canonical semantic results create-only", () => {
    const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-immutable-result-")));
    temporary.push(storageRoot);
    const task = createTask({
      storageRoot,
      taskPath: join(storageRoot, "Projects", "Demo", "tasks", "task"),
      manifest: {
        schema_version: "1.0.0",
        project_name: "Demo",
        task_id: "task",
        created_at: "2026-09-01T00:00:00.000Z",
        target_repo_root: join(storageRoot, "repo"),
        issue_ids: [],
        inputs: {},
        record_model: "vnext-single-write",
      },
    });
    const { result } = reusableRecord();
    const resultRef = "quality/reviews/results/one.json";
    expect(writeSemanticResult(task, resultRef, result)).toBe(resultRef);
    expect(() => writeSemanticResult(task, resultRef, { ...result, material_id: "d".repeat(64) })).toThrow(/exists|create-only|immutable|occupied/i);
  });

  it("rejects malformed frozen input before provider dispatch", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-preflight-")));
    temporary.push(attachmentRoot);
    const packet = createSimpleReviewPacket({ stage: "verify-code", materials: { implementation: "current bytes" } });
    const serialized = serializeProviderInput({ packet, hostProvider: "codex", providers: ["other/model"], reviewMode: "single_round" });
    const malformed = JSON.parse(serialized.toString("utf8"));
    malformed.packet.materials[0].content_base64 = Buffer.from("tampered bytes", "utf8").toString("base64");
    const calls = [];
    await expect(dispatchFrozenProviderInput({
      bytes: Buffer.from(`${JSON.stringify(malformed)}\n`),
      attachmentRoot,
      client: { async runGroup() { calls.push(true); return { outcome: "completed" }; } },
    })).rejects.toThrow(/material hash is invalid|material identity is invalid/);
    expect(calls).toHaveLength(0);
  });

  it("preserves provider unavailability and keeps WorkflowHub recovery to one call", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-provider-unavailable-")));
    temporary.push(attachmentRoot);
    const calls = [];
    const result = await runSimpleReview({
      stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other/model"] }),
      client: {
        async runGroup() {
          calls.push(true);
          return { runtimeId: "runtime-1", outcome: "unavailable", providers: [{
            provider: "other/model", status: "failed", identity: { provider: "other/model" }, session_id: null,
            error: { code: "RATE_LIMITED", message: "retry budget exhausted" }, timing: null, usage: null,
          }] };
        },
      },
    });
    expect(result).toMatchObject({
      status: "unavailable",
      provider_results: [{ status: "failed", error: { code: "RATE_LIMITED" } }],
      error: { code: "RATE_LIMITED", message: "retry budget exhausted" },
    });
    expect(calls).toHaveLength(1);

    const { runReviewRecovery } = await import("../wh-review-cli.mjs");
    const recoveryCalls = [];
    const recovered = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async (input) => {
        recoveryCalls.push(input);
        return { status: "unavailable", error_code: "RATE_LIMITED", snapshot_tree: input.snapshot_tree, material_id: input.material_id };
      },
    });
    expect(recovered).toMatchObject({ status: "unavailable", error_code: "RATE_LIMITED" });
    expect(recoveryCalls).toHaveLength(1);
  });
});
