import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { reviewPacketMaterialId } from "../../runtime/review/review-packet-identity.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
let routeIdentity = "a".repeat(64);
const route = () => ({ route_identity: routeIdentity });

afterEach(() => {
  routeIdentity = "a".repeat(64);
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-budget-deletion-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub review deletion test"]);
  git(["config", "user.email", "review-deletion@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "review deletion fixture\n", "utf8");
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
  return { task, kernel: createTaskKernel(task, { candidateWorkspace: workspace, artifacts }), repo, workspace };
}

function reviewResult(input) {
  return {
    status: "available",
    stage: input.stage,
    material_id: reviewPacketMaterialId(input),
    runtime_id: "review-deletion-fixture",
    outcome: "completed",
    provider_results: [{
      provider: "codex/luna",
      status: "completed",
      identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "fixture-config", model: "gpt-5.6-luna" },
      error: null,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
      usage: null,
      evidence_anchor_valid: [],
    }],
    findings: [],
  };
}

describe("review budget deletion contract", () => {
  it("removes production budget consumers and keeps review_result_ref as the dedupe owner", () => {
    const source = readFileSync(fileURLToPath(new URL("../../runtime/review/review-record-route.mjs", import.meta.url)), "utf8");
    const inventory = JSON.parse(readFileSync(fileURLToPath(new URL("../../docs/architecture/control-plane-inventory.json", import.meta.url)), "utf8"));
    const adr = readFileSync(fileURLToPath(new URL("../../docs/adr/0028-plan-slicing-and-review-budget.md", import.meta.url)), "utf8");

    expect(source).not.toMatch(/evaluateReviewRound|readCanonicalBudgetHistory|REVIEW_RETRY_BUDGET/);
    expect(source).toMatch(/review_result_ref|findReusableReview/);
    expect(inventory.controls.find((control) => control.id === "review-budget-namespace")).toBeUndefined();
    expect(inventory.controls.find((control) => control.id === "review-result-deduplication")).toMatchObject({
      producer: expect.stringContaining("findReusableReview"),
      consumer: expect.stringContaining("recordSimpleReviewRequest"),
      disposition: "retain",
    });
    expect(adr).toMatch(/不再维持正式审查预算|review_result_ref/);
    expect(adr).not.toMatch(/`validateReviewBudget`/);
  });

  it("does not auto-dispatch on input or snapshot changes, while a judged retry is idempotent", async () => {
    const state = fixture();
    const baseRequest = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "before" } };
    let dispatches = 0;
    const runRound = async (input) => {
      dispatches += 1;
      return reviewResult(input);
    };

    const first = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: baseRequest, resolveRouteIdentity: route, runRound });
    const repeated = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: baseRequest, resolveRouteIdentity: route, runRound });
    const nullRetry = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: { ...baseRequest, retry: null }, resolveRouteIdentity: route, runRound });
    const declinedRetry = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: { ...baseRequest, retry: { requested: false, reason: "" } }, resolveRouteIdentity: route, runRound });
    const invalidRetry = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: { ...baseRequest, retry: { requested: true } }, resolveRouteIdentity: route, runRound });
    const malformedRetry = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: { ...baseRequest, retry: { requested: "true", reason: "malformed flag" } }, resolveRouteIdentity: route, runRound });
    const materialChanged = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: { ...baseRequest, materials: { implementation: "after" } },
      resolveRouteIdentity: route,
      runRound,
    });

    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "ordinary code snapshot moved\n", "utf8");
    const snapshotChanged = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: baseRequest, resolveRouteIdentity: route, runRound });

    expect(dispatches).toBe(1);
    for (const value of [repeated, nullRetry, declinedRetry, materialChanged, snapshotChanged]) {
      expect(value).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: first.attempt_ref, result_ref: first.result_ref, report_ref: first.report_ref });
    }
    expect(invalidRetry).toMatchObject({ status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_RETRY_INVALID" }, retry: { requested: true, admitted: false } });
    expect(malformedRetry).toMatchObject({ status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_RETRY_INVALID" }, retry: { requested: true, admitted: false } });

    const unjustifiedRetry = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: { ...baseRequest, retry: { requested: true, reason: "please try again" } },
      resolveRouteIdentity: route,
      runRound,
    });
    expect(dispatches).toBe(1);
    expect(unjustifiedRetry).toMatchObject({ status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_RETRY_NOT_ADMITTED" }, retry: { requested: true, admitted: false } });

    const unboundProviderRetry = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: { ...baseRequest, retry: { requested: true, basis: "provider_changed", reason: "same route, new explanation" } },
      resolveRouteIdentity: route,
      runRound,
    });
    expect(dispatches).toBe(1);
    expect(unboundProviderRetry).toMatchObject({ status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_RETRY_NOT_ADMITTED" }, retry: { requested: true, admitted: false } });

    const noReusableRetry = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: {
        ...baseRequest,
        subject: { name: "a distinct review subject" },
        retry: { requested: true, reason: "subject changed without an accepted basis" },
      },
      resolveRouteIdentity: route,
      runRound,
    });
    expect(dispatches).toBe(1);
    expect(noReusableRetry).toMatchObject({
      status: "unavailable",
      reused: false,
      dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_RETRY_NOT_ADMITTED" },
      retry: {
        requested: true,
        admitted: false,
      },
    });

    routeIdentity = "b".repeat(64);
    const judgedRetryRequest = { ...baseRequest, retry: { requested: true, basis: "provider_changed", reason: "provider returned a new failure classification" } };
    const judgedRetry = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: judgedRetryRequest, resolveRouteIdentity: route, runRound });
    expect(dispatches).toBe(2);
    expect(judgedRetry).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { requested: true, admitted: true } });
    expect(judgedRetry.attempt_ref).not.toBe(first.attempt_ref);
    expect(judgedRetry.result_ref).not.toBe(first.result_ref);

    const idempotentJudgedRetry = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: { ...judgedRetryRequest, retry: { requested: true, basis: "provider_changed", reason: "a different explanation cannot create a second request" } },
      resolveRouteIdentity: route,
      runRound,
    });
    expect(dispatches).toBe(2);
    expect(idempotentJudgedRetry).toMatchObject({ reused: true, attempt_ref: judgedRetry.attempt_ref, result_ref: judgedRetry.result_ref, report_ref: judgedRetry.report_ref });
  });

  it("requires an explicit judged retry when verify-code moves to a new snapshot", async () => {
    const state = fixture();
    const baseRequest = { stage: "verify-code", host_provider: "codex/luna", materials: { implementation: "verify-before" } };
    let dispatches = 0;
    const runRound = async (input) => {
      dispatches += 1;
      return reviewResult(input);
    };
    const first = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: baseRequest, resolveRouteIdentity: route, runRound });
    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "verify snapshot moved\n", "utf8");

    const blocked = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: baseRequest, resolveRouteIdentity: route, runRound });
    expect(dispatches).toBe(1);
    expect(blocked).toMatchObject({ status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_CURRENT_SNAPSHOT_RETRY_REQUIRED" } });
    expect(blocked).not.toHaveProperty("attempt_ref", expect.stringContaining("quality/reviews/attempts/"));

    const retryRequest = {
      ...baseRequest,
      materials: { implementation: "verify-after" },
      retry: { requested: true, basis: "material_changed", reason: "implementation snapshot changed and needs fresh terminal review" },
    };
    const retried = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: retryRequest, resolveRouteIdentity: route, runRound });
    expect(dispatches).toBe(2);
    expect(retried).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { requested: true, admitted: true } });
    expect(retried.attempt_ref).not.toBe(first.attempt_ref);
  });

  it("does not re-admit a retry after the current lineage head already consumed it", async () => {
    const state = fixture();
    const firstRequest = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "A" } };
    const retryRequest = {
      ...firstRequest,
      materials: { implementation: "B" },
      retry: { requested: true, basis: "material_changed", reason: "implementation changed" },
    };
    let dispatches = 0;
    const runRound = async (input) => {
      dispatches += 1;
      if (dispatches === 2) {
        return {
          status: "unavailable", stage: input.stage, review_track: null, review_kind: null,
          material_id: reviewPacketMaterialId(input), runtime_id: "retry-head-unavailable",
          outcome: "unavailable", provider_results: [], findings: [],
          error: { code: "REVIEW_STATUS_UNAVAILABLE", message: "provider status was unavailable" },
        };
      }
      return reviewResult(input);
    };
    const first = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: firstRequest, resolveRouteIdentity: route, runRound });
    const retry = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: retryRequest, resolveRouteIdentity: route, runRound });
    const repeated = await recordSimpleReviewRequest({
      task: state.task,
      kernel: state.kernel,
      request: { ...retryRequest, retry: { ...retryRequest.retry, reason: "same changed material, different wording" } },
      resolveRouteIdentity: route,
      runRound,
    });

    expect(first.result_ref).toBeTruthy();
    expect(retry).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { requested: true, admitted: true }, result_ref: null });
    expect(repeated).toMatchObject({
      status: "recorded",
      reused: true,
      dispatch_state: "reused",
      attempt_ref: retry.attempt_ref,
      result_ref: null,
      retry: { requested: true, admitted: true },
    });
    expect(dispatches).toBe(2);
  });
});
