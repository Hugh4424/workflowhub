import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { reviewPacketMaterialId } from "../../runtime/review/review-packet-identity.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-material-change-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub material change test"]);
  git(["config", "user.email", "material-change@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "review material change fixture\n", "utf8");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);

  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-09-16T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const [name, content] of Object.entries({
    "decision-log.md": "# Decision\n",
    "spec.md": "# Spec\n",
    "plan.md": "# Plan\n",
    "tasks.md": "# Tasks\n",
  })) artifacts.writeAtomic(name, content);
  return { task, kernel: createTaskKernel(task, { candidateWorkspace: workspace, artifacts }), artifacts };
}

function route() {
  return { route_identity: "a".repeat(64) };
}

function reviewResult(input) {
  return {
    status: "available",
    stage: input.stage,
      material_id: reviewPacketMaterialId(input),
    runtime_id: "review-material-change-fixture",
    outcome: "completed",
    provider_results: [{
      provider: "codex/luna",
      status: "completed",
      identity: {
        provider: "codex/luna",
        adapter: "codex",
        source_id: "codex/luna",
        config_id: "fixture-config",
        model: "gpt-5.6-luna",
      },
      error: null,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
      usage: null,
      evidence_anchor_valid: [],
    }],
    findings: [],
  };
}

describe("review material change reuse contract", () => {
  it("keeps the recorded fact and canonical refs when only submitted material bytes change", async () => {
    const state = fixture();
    let dispatches = 0;
    const runRound = async (input) => {
      dispatches += 1;
      return reviewResult(input);
    };
    const before = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { approved_spec: "material-before" },
    };
    const first = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: before,
      resolveRouteIdentity: route,
      runRound,
    });
    const after = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: { ...before, materials: { approved_spec: "material-after" } },
      resolveRouteIdentity: route,
      runRound,
    });

    expect(dispatches).toBe(1);
    expect(after).toMatchObject({
      status: "recorded",
      reused: true,
      dispatch_state: "reused",
      attempt_ref: first.attempt_ref,
      result_ref: first.result_ref,
      report_ref: first.report_ref,
    });
    expect(state.task.readRecord(first.attempt_ref)).toBe(state.task.readRecord(after.attempt_ref));
    expect(state.task.readRecord(first.result_ref)).toBe(state.task.readRecord(after.result_ref));
  });

  it("authenticates a recorded build-code review after its material revision moves", async () => {
    const state = fixture();
    const request = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { approved_spec: "material-before" },
    };
    const recorded = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request,
      resolveRouteIdentity: route,
      runRound: async (input) => reviewResult(input),
    });
    const reviewRaw = state.task.readRecord(recorded.result_ref);
    const beforeRevision = state.kernel.currentVNextMaterialRevision();
    state.artifacts.writeAtomic("spec.md", "# Spec changed\n");
    const published = state.kernel.publishVNextQualityFact("build-code", {
      kind: "review",
      status: "recorded",
      subject: "integration_review",
      evidence: [{ ref: recorded.result_ref, sha256: sha256(reviewRaw), evidence_type: "review_result" }],
    });
    const factRaw = state.task.readRecord(published.ref);
    const fact = JSON.parse(factRaw);
    expect(fact.material_revision).not.toBe(beforeRevision);

    expect(authenticateQualityFactRecord({ ref: published.ref, sha256: published.sha256 }, {
      read: state.task.readRecord,
    })).toMatchObject({ status: "recorded", authenticated: true });
  });

  it("does not reuse a recorded review when the authenticated Workspace drifts before the reuse check", async () => {
    const state = fixture();
    const request = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { approved_spec: "material-before" },
    };
    const recorded = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request,
      resolveRouteIdentity: route,
      runRound: async (input) => reviewResult(input),
    });
    let dispatches = 0;
    const drifted = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request,
      resolveRouteIdentity: async () => {
        state.artifacts.writeAtomic("spec.md", "# Spec drifted during route resolution\n");
        return route();
      },
      runRound: async (input) => {
        dispatches += 1;
        return reviewResult(input);
      },
    });

    expect(dispatches).toBe(0);
    expect(drifted).toMatchObject({
      status: "unavailable",
      reused: false,
      dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_SOURCE_DRIFT" },
    });
    expect(drifted.attempt_ref).toBeUndefined();
    expect(recorded.reused).toBe(false);
  });

  it("blocks a provider dispatch when the source changes while the trusted route resolves", async () => {
    const state = fixture();
    const request = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { approved_spec: "route-drift" },
    };
    let dispatches = 0;
    const first = await recordSimpleReviewRequest({
      task: state.task, kernel: state.kernel, request, resolveRouteIdentity: route,
      runRound: async (input) => { dispatches += 1; return reviewResult(input); },
    });
    const drifted = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request,
      resolveRouteIdentity: async () => {
        state.artifacts.writeAtomic("spec.md", "route resolution changed the source\n");
        return route();
      },
      runRound: async (input) => { dispatches += 1; return reviewResult(input); },
    });

    expect(first.result_ref).toBeTruthy();
    expect(dispatches).toBe(1);
    expect(drifted).toMatchObject({
      status: "unavailable",
      reused: false,
      dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_SOURCE_DRIFT" },
    });
    expect(drifted).not.toHaveProperty("attempt_ref");
  });

  it("retains a dispatched source/material drift failure and admits a material_changed retry", async () => {
    const state = fixture();
    const request = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { approved_spec: "source-drift-before-retry" },
    };
    let dispatches = 0;
    const sourceDriftResult = (input) => {
      const result = reviewResult(input);
      return {
        ...result,
        status: "unavailable",
        outcome: "unavailable",
        runtime_id: "runtime-source-drift",
        provider_results: [{
          ...result.provider_results[0],
          status: "failed",
          session_id: "session-source-drift",
          error: { code: "REVIEW_SOURCE_DRIFT", message: "source/material revision drifted during managed wait" },
        }],
        findings: [],
        error: { code: "REVIEW_SOURCE_DRIFT", message: "source/material revision drifted during managed wait" },
      };
    };
    const runRound = async (input) => {
      dispatches += 1;
      return dispatches === 1 ? sourceDriftResult(input) : reviewResult(input);
    };

    const first = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request, resolveRouteIdentity: route, runRound });
    const attempt = JSON.parse(state.task.readRecord(first.attempt_ref));
    expect(first).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", result_ref: null });
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      dispatch_state: "dispatched",
      error: { code: "REVIEW_SOURCE_DRIFT" },
      provider_attempts: [{ session_id: "session-source-drift", runtime_id: "runtime-source-drift", status: "failed", error: { code: "REVIEW_SOURCE_DRIFT" } }],
    });

    const retryRequest = {
      ...request,
      materials: { approved_spec: "source-drift-after-retry" },
      retry: { requested: true, basis: "material_changed", reason: "review material revision changed" },
    };
    const retried = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: retryRequest, resolveRouteIdentity: route, runRound });
    const repeated = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: { ...retryRequest, retry: { ...retryRequest.retry, reason: "same material retry" } },
      resolveRouteIdentity: route,
      runRound,
    });

    expect(dispatches).toBe(2);
    expect(retried).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { requested: true, admitted: true, basis: "material_changed" } });
    expect(repeated).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: retried.attempt_ref, result_ref: retried.result_ref });
  });

  it("records an unavailable fact when post-dispatch result validation fails", async () => {
    const state = fixture();
    let dispatches = 0;
    const recorded = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: {
        stage: "build-code",
        host_provider: "codex/luna",
        materials: { approved_spec: "malformed-result" },
      },
      resolveRouteIdentity: route,
      runRound: async (input) => {
        dispatches += 1;
        return { ...reviewResult(input), stage: "verify-code" };
      },
    });
    expect(dispatches).toBe(1);
    expect(recorded).toMatchObject({ status: "recorded", reused: false, result_ref: null });
    const attempt = JSON.parse(state.task.readRecord(recorded.attempt_ref));
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      error: { code: "REVIEW_EXECUTION_FAILED" },
      provider_attempts: [{ provider: "codex/luna", status: "completed", error: null }],
    });
  });
});
