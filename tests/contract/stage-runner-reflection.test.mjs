import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runStage, runStageEndReflection, runOfficialStage, authenticateStageOutcomeForProjection } from "../../runtime/stage/stage-runner.mjs";

import { recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";

import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
const contexts = new Map();
const NOW = "2026-08-31T00:00:00.000Z";

function fixture(taskId, { stage = "build-spec", inputs = {} } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runner-reflection-p2-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub P2 tests"]);
  git(["config", "user.email", "p2@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "runner fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "StageRunnerReflection",
      task_id: taskId,
      created_at: NOW,
      target_repo_root: repo,
      issue_ids: [],
      inputs,
      record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const [material, content] of Object.entries(canonicalStageMaterials())) artifacts.writeAtomic(material, content);
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts, now: () => NOW });
  const context = {
    stage,
    task,
    kernel,
    identity: task.identity,
    manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId(stage),
    candidateWorkspace: workspace,
    artifacts,
    storageRoot: root,
  };
  contexts.set(taskId, context);
  return { root, task, context };
}

function inputFor(context, input) {
  if (!input) return input;
  const outcome = context.reflectionOutcome;
  return {
    ...input, schema_version: "stage-reflection.v2",
    judgments: [{ subject_id: "reflection-source", subject_kind: "step", classification: "keep", severity: "low",
      reason: "Current authenticated stage outcome supports this fixture judgment.", evidence_refs: [outcome.ref],
      confidence: "medium", next_review_trigger: "next execution" }, ...(input.judgments ?? [])],
    identity: { task_id: context.identity.taskId, worktree: context.candidateWorkspace.worktreeRoot,
      branch: context.candidateWorkspace.branch, attempt: outcome.value.attempt_id,
      snapshot_tree: outcome.value.snapshot_tree, material_revision: outcome.value.material_revision },
    ...Object.fromEntries(["what_helped", "what_to_improve", "blockers", "intervention_reasons", "what_to_simplify", "simplifiable_now"].map((key) => [key, { state: "none_observed", items: [] }])),
    status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"].map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture outcome", unknown_reasons: [] },
  };
}
function authenticatedInput(taskId, value) {
  const context = contexts.get(taskId);
  const outcomeStatus = value.stage_status === "failed" ? "incomplete" : "completed";
  if (!context.reflectionOutcome || context.reflectionOutcome.value.status !== outcomeStatus) {
    context.reflectionOutcome = writeStageOutcomeFixture({ task: context.task, kernel: context.kernel, artifacts: context.artifacts,
      workspace: context.candidateWorkspace, stage: context.stage, attemptId: `reflection-${value.stage_status}`, status: outcomeStatus });
  }
  return inputFor(context, value);
}

function reflection(taskId, stageStatus = "completed") {
  return authenticatedInput(taskId, {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: taskId,
    stage: "build-spec",
    stage_status: stageStatus,
    generated_at: NOW,
    status: "ok",
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
  });
}

function reflectionPath(state) {
  return join(state.task.taskPath, "quality", "stage-reflection", `${state.context.stage}.json`);
}

function availabilityFiles(state) {
  const root = join(state.task.taskPath, "quality", "evidence", "stage-reflection-availability");
  return existsSync(root) ? readdirSync(root).filter((name) => name.endsWith(".json")) : [];
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage-runner reflection transfer matrix", () => {
  it("rejects malformed stage-end timestamps before scheduling reflection work", async () => {
    const state = fixture("invalid-reflection-time");
    await expect(runStageEndReflection(state.context, {
      now: "not-a-timestamp",
      execute: async () => reflection(state.context.identity.taskId),
    })).rejects.toThrow(/valid ISO-compatible timestamp/);
    expect(existsSync(reflectionPath(state))).toBe(false);
    expect(availabilityFiles(state)).toEqual([]);
  });

  it("derives not_scheduled from a reason when the state is omitted", async () => {
    const state = fixture("reason-derived-not-scheduled");
    const result = await runStageEndReflection(state.context, {
      reasonCode: "interrupted",
      now: NOW,
    });
    expect(result).toMatchObject({
      status: "not_scheduled",
      availability: { state: "not_scheduled", reason_code: "interrupted" },
    });
    expect(availabilityFiles(state)).toHaveLength(1);
  });

  it("rejects mismatched stage-end availability state and reason before writing", async () => {
    const state = fixture("mismatched-availability");
    await expect(runStageEndReflection(state.context, {
      availabilityState: "unavailable",
      reasonCode: "preflight_failed",
      now: NOW,
    })).rejects.toMatchObject({ code: "STAGE_REFLECTION_INPUT_INVALID" });
    expect(availabilityFiles(state)).toEqual([]);
  });

  it("records not_scheduled when preflight cannot read the upstream input", async () => {
    const state = fixture("preflight-failed", { stage: "build-plan", inputs: { spec: "quality/evidence/missing-spec.json" } });
    await expect(runStage(
      "build-plan",
      state.context,
      async () => ({ facts: {} }),
      {},
      { stageReflection: {} },
    )).rejects.toThrow(/missing-spec|ENOENT/i);
    expect(existsSync(reflectionPath(state))).toBe(false);
    const files = availabilityFiles(state);
    expect(files).toHaveLength(1);
    expect(JSON.parse(readFileSync(join(state.task.taskPath, "quality/evidence/stage-reflection-availability", files[0]), "utf8"))).toMatchObject({
      state: "not_scheduled",
      reason_code: "preflight_failed",
    });
  });

  it("records unavailable without occupying the fixed judgment path when no executor is injected", async () => {
    const state = fixture("executor-absent");
    const result = await runStage("build-spec", state.context, async () => ({ facts: {} }), {}, { stageReflection: {} });
    expect(result.stage_reflection).toMatchObject({ status: "unavailable", reflection_status: "unavailable", persisted: false });
    expect(existsSync(reflectionPath(state))).toBe(false);
    expect(availabilityFiles(state)).toHaveLength(1);
    const fact = JSON.parse(readFileSync(join(state.task.taskPath, "quality", "evidence", "stage-reflection-availability", availabilityFiles(state)[0]), "utf8"));
    expect(fact).toMatchObject({ stage: "build-spec", state: "unavailable", reason_code: "executor_absent" });
  });

  it("preserves the injected executor path and publishes a fixed judgment", async () => {
    const state = fixture("executor-injected");
    const result = await runStage(
      "build-spec",
      state.context,
      async () => ({ facts: {} }),
      {},
      { stageReflection: { execute: async ({ taskId, stageStatus }) => reflection(taskId, stageStatus) } },
    );
    expect(result.stage_reflection).toMatchObject({ status: "completed", reflection_status: "ok", persisted: true });
    expect(result.stage_reflection.ref).toMatch(/^quality\/stage-reflection\/build-spec\/[a-f0-9]{64}\.json$/);
    expect(JSON.parse(state.task.readRecord(result.stage_reflection.ref)).schema_version).toBe("stage-reflection.v2");
  });

  it.each([
    ["startup_failed", "handler startup failed"],
    ["identity_failed", "stage identity mismatch"],
    ["interrupted", "stage interrupted"],
  ])("records not_scheduled for a %s before reflection can run", async (reasonCode, message) => {
    const state = fixture(`handler-${reasonCode}`);
    await expect(runStage(
      "build-spec",
      state.context,
      async () => {
        const error = new Error(message);
        if (reasonCode === "startup_failed") error.code = "STAGE_STARTUP_FAILED";
        if (reasonCode === "identity_failed") error.code = "STAGE_IDENTITY_FAILED";
        if (reasonCode === "interrupted") error.code = "STAGE_INTERRUPTED";
        throw error;
      },
      {},
      { stageReflection: {} },
    )).rejects.toThrow(message);
    expect(existsSync(reflectionPath(state))).toBe(false);
    const files = availabilityFiles(state);
    expect(files).toHaveLength(1);
    expect(JSON.parse(readFileSync(join(state.task.taskPath, "quality/evidence/stage-reflection-availability", files[0]), "utf8"))).toMatchObject({
      state: "not_scheduled",
      reason_code: reasonCode,
    });
  });

  it("runs a failed reflection for an ordinary handler error when an executor is available", async () => {
    const state = fixture("handler-execution-failed");
    let receivedStageStatus;
    await expect(runStage(
      "build-spec",
      state.context,
      async () => { throw new Error("ordinary stage execution failed"); },
      {},
      {
        stageReflection: {
          execute: async ({ taskId, stageStatus }) => {
            receivedStageStatus = stageStatus;
            return { ...reflection(taskId, stageStatus), status: "failed", error: { summary: "ordinary stage execution failed" } };
          },
        },
      },
    )).rejects.toThrow("ordinary stage execution failed");
    expect(receivedStageStatus).toBe("failed");
    expect(existsSync(join(state.root, "Projects/StageRunnerReflection/lessons/build-spec.jsonl"))).toBe(true);
    const rows = readFileSync(join(state.root, "Projects/StageRunnerReflection/lessons/build-spec.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
    expect(JSON.parse(state.task.readRecord(rows[0].reflection_ref))).toMatchObject({ status: "failed", error: { summary: "ordinary stage execution failed" } });
    expect(availabilityFiles(state)).toEqual([]);
  });
});

function usageProvider(provider, status, usage, timing) {
  return {
    provider, status,
    identity: { provider, adapter: provider.split("/")[0], source_id: provider, config_id: "fixture", model: "fixture" },
    error: status === "completed" ? null : { code: "PROCESS_TIMEOUT", message: "fixture terminal provider" },
    usage, timing, evidence_anchor_valid: [],
  };
}

function publishUsageReview(state, providers, runtimeId = "usage-runtime", materialId = "a".repeat(64)) {
  return recordSimpleReviewResult({ task: state.task, kernel: state.context.kernel, result: {
    status: "available-with-failures", stage: "verify-code", review_track: null, review_kind: null,
    material_id: materialId, runtime_id: runtimeId, outcome: "partial", findings: [], provider_results: providers,
  } });
}

async function consumeUsageReview(state, ref) {
  const outcome = writeStageOutcomeFixture({ task: state.task, kernel: state.context.kernel,
    artifacts: state.context.artifacts, workspace: state.context.candidateWorkspace, stage: "verify-code",
    attemptId: "usage-stage-attempt", status: ref.includes("/attempts/") ? "incomplete" : "completed", qualityReview: { ref } });
  const authenticated = authenticateStageOutcomeForProjection(state.context, "verify-code", outcome.ref);
  expect(authenticated.code_review.quality_review_ref).toBe(ref);
  // Exercise the actual observation consumer before runOfficialStage's public
  // result deliberately projects away handler-local facts.
  return officialStageHandler("verify-code")({
    stage: "verify-code", identity: state.task.identity, manifest: state.task.manifest,
    workflowRunId: state.context.workflowRunId, currentMaterialRevision: state.context.kernel.currentVNextMaterialRevision(),
    readReceipt: (recordRef) => {
      const raw = state.task.readRecord(recordRef);
      return { value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") };
    },
    readArtifact: (name) => state.context.artifacts.read(name),
    snapshotWorkspace: () => state.context.kernel.currentVNextSnapshot(),
  }, { receipts: { quality_review: ref, review: ref } });
}

describe("T011 authenticated canonical review usage consumer", () => {
  const timing = { started_at_ms: 10, completed_at_ms: 40, duration_ms: 30 };
  it("reads completed, failed and cancelled usage/timing from the actual attempt execution once on reuse", async () => {
    const state = fixture("usage-execution", { stage: "verify-code" });
    const providers = [
      usageProvider("codex/luna", "completed", { input_tokens: 11, output_tokens: 7 }, timing),
      usageProvider("opencode/failed", "failed", { input_tokens: 13, output_tokens: 2 }, timing),
      usageProvider("opencode/cancelled", "cancelled", { input_tokens: 17, output_tokens: 3 }, timing),
    ];
    const refs = publishUsageReview(state, providers);
    const raw = state.task.readRecord(refs.attempt_ref);
    expect(JSON.parse(raw).provider_attempts.map((entry) => entry.execution.usage)).toEqual(providers.map((entry) => entry.usage));
    const first = await consumeUsageReview(state, refs.result_ref);
    const repeated = await consumeUsageReview(state, refs.result_ref);
    const observation = first.facts.code_review.usage_observation;
    expect(observation).toBeDefined();
    expect(observation.usage).toEqual(providers.map((entry) => expect.objectContaining({ provider: entry.provider, status: "recorded", usage: entry.usage })));
    expect(observation.timing).toEqual(providers.map((entry) => expect.objectContaining({ provider: entry.provider, status: "recorded", timing: entry.timing })));
    expect(repeated.facts.code_review.usage_observation).toEqual(observation);
    expect(state.task.readRecord(refs.attempt_ref)).toBe(raw);
  });

  it("keeps usage and timing independently unavailable without zero filling", async () => {
    const state = fixture("usage-missing", { stage: "verify-code" });
    const refs = publishUsageReview(state, [
      usageProvider("codex/luna", "completed", null, timing),
      usageProvider("opencode/failed", "failed", { input_tokens: 19 }, null),
    ]);
    const result = await consumeUsageReview(state, refs.result_ref);
    const observation = result.facts.code_review.usage_observation;
    expect(observation).toBeDefined();
    expect(observation.usage).toEqual([
      expect.objectContaining({ provider: "codex/luna", status: "unavailable" }),
      expect.objectContaining({ provider: "opencode/failed", status: "recorded", usage: { input_tokens: 19 } }),
    ]);
    expect(observation.usage[0]).not.toHaveProperty("usage");
    expect(observation.timing).toEqual([
      expect.objectContaining({ provider: "codex/luna", status: "recorded", timing }),
      expect.objectContaining({ provider: "opencode/failed", status: "unavailable" }),
    ]);
    expect(observation.timing[1]).not.toHaveProperty("timing");
  });

  it("preserves real failed and cancelled usage on an unavailable attempt", async () => {
    const state = fixture("usage-unavailable", { stage: "verify-code" });
    const refs = publishUsageReview(state, [usageProvider("opencode/failed", "failed", { input_tokens: 23 }, timing)]);
    expect(refs.result_ref).toBeNull();
    const result = await consumeUsageReview(state, refs.attempt_ref);
    expect(result.facts.code_review).toMatchObject({ status: "unavailable", usage_observation: {
      usage: [expect.objectContaining({ provider: "opencode/failed", status: "recorded", usage: { input_tokens: 23 } })],
      timing: [expect.objectContaining({ provider: "opencode/failed", status: "recorded", timing })],
    } });
  });

  it("rejects a result bound to another attempt instead of borrowing its usage", async () => {
    const state = fixture("usage-wrong-attempt", { stage: "verify-code" });
    const a = publishUsageReview(state, [usageProvider("codex/luna", "completed", { input_tokens: 29 }, timing)], "usage-a");
    const b = publishUsageReview(state, [usageProvider("codex/luna", "completed", { input_tokens: 31 }, timing)], "usage-b");
    const value = JSON.parse(state.task.readRecord(a.result_ref));
    value.attempt_ref = b.attempt_ref;
    writeFileSync(join(state.task.taskPath, a.result_ref), JSON.stringify(value));
    await expect(consumeUsageReview(state, a.result_ref))
      .rejects.toThrow(/ordinary review result\/attempt path identity mismatch/);
  });
});

describe("T011 runner semantic reflection identity", () => {
  it.each(["judgment", "actor", "run", "material"])("preserves A and publishes B when authenticated %s changes", async (change) => {
    const state = fixture(`semantic-${change}`);
    const a = reflection(state.task.identity.taskId);
    const sourceA = authenticateStageOutcomeForProjection(state.context, "build-spec", state.context.reflectionOutcome.ref);
    expect(sourceA).not.toBeNull();
    const first = await runStageEndReflection(state.context, { stageOutcome: sourceA, execute: async () => a, now: NOW });
    expect(first).toMatchObject({ status: "completed", persisted: true });
    expect(first.ref).toMatch(/^quality\/stage-reflection\/build-spec\/[a-f0-9]{64}\.json$/);
    const original = state.task.readRecord(first.ref);
    const duplicate = await runStageEndReflection(state.context, {
      stageOutcome: sourceA, execute: async () => ({ ...a, generated_at: "2026-08-31T01:00:00.000Z" }), now: "2026-08-31T01:00:00.000Z",
    });
    expect(duplicate).toMatchObject({ ref: first.ref, sha256: first.sha256 });
    expect(state.task.readRecord(first.ref)).toBe(original);
    if (change === "material") state.context.artifacts.writeAtomic("spec.md", `${state.context.artifacts.read("spec.md")}\nCurrent fixture material B.\n`);
    if (change !== "judgment") {
      state.context.reflectionOutcome = writeStageOutcomeFixture({ task: state.task, kernel: state.context.kernel, artifacts: state.context.artifacts,
        workspace: state.context.candidateWorkspace, stage: "build-spec", attemptId: "reflection-completed",
        producer: { kind: "stage-agent", host: "fixture-host", source_id: change === "actor" ? "fixture-b/executor" : "fixture/executor",
          source_family: change === "actor" ? "fixture-b" : "fixture", agent_run_id: change === "run" ? "reflection-run-b" : "reflection-completed" } });
    }
    const b = reflection(state.task.identity.taskId);
    if (change === "judgment") b.judgments[0].reason = "Judgment B differs on the same authenticated execution.";
    const sourceB = authenticateStageOutcomeForProjection(state.context, "build-spec", state.context.reflectionOutcome.ref);
    expect(sourceB).not.toBeNull();
    const second = await runStageEndReflection(state.context, { stageOutcome: sourceB, execute: async () => b, now: "2026-08-31T02:00:00.000Z" });
    expect(second).toMatchObject({ status: "completed", persisted: true });
    expect(second.ref).not.toBe(first.ref);
    expect(state.task.readRecord(first.ref)).toBe(original);
    expect(JSON.parse(state.task.readRecord(second.ref)).identity.material_revision).toBe(sourceB.value.material_revision);
  });

  it("does not borrow A when an executor or its judgment is missing", async () => {
    const state = fixture("semantic-missing");
    const input = reflection(state.task.identity.taskId);
    const source = authenticateStageOutcomeForProjection(state.context, "build-spec", state.context.reflectionOutcome.ref);
    const first = await runStageEndReflection(state.context, { stageOutcome: source, execute: async () => input, now: NOW });
    expect(first).toMatchObject({ status: "completed", persisted: true, ref: expect.any(String) });
    const original = state.task.readRecord(first.ref);
    for (const execute of [undefined, async () => null]) {
      const missing = await runStageEndReflection(state.context, { stageOutcome: source, execute, now: "2026-08-31T01:00:00.000Z" });
      expect(missing).toMatchObject({ status: "unavailable", reflection_status: "unavailable", persisted: false, ref: null });
      expect(state.task.readRecord(first.ref)).toBe(original);
    }
  });
});
