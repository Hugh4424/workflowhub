import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";

const roots = [];
const sha = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "review-budget-namespace-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub budget test"]);
  git(["config", "user.email", "budget@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "budget namespace fixture\n", "utf8");
  git(["add", "."]); git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({ storageRoot: root, taskPath: join(root, "Projects", "workflowhub", "tasks", taskId), manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId, created_at: "2026-09-10T00:00:00Z",
    target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
  } });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  return { task, kernel: createTaskKernel(task, { candidateWorkspace: workspace, artifacts }) };
}

function request() { return { stage: "build-code", host_provider: "codex" }; }
function route() { return { route_identity: "a".repeat(64) }; }
function unavailableResult(input) {
  return { status: "unavailable", stage: input.stage, material_id: sha("unbound-material"), runtime_id: null,
    outcome: "unavailable", provider_results: [], findings: [], error: { code: "ROUTE_UNAVAILABLE", message: "fixture route unavailable" } };
}

function damagedAttempt({ kernel }, value, ref) {
  kernel.publishCanonicalRecord(ref, `${JSON.stringify(value)}\n`);
}

describe("review budget namespace classification", () => {
  it("ignores a damaged attempt from another stage and dispatches exactly once", async () => {
    const state = fixture();
    const identity = { tree: state.kernel.currentVNextSnapshot().tree, materialRevision: state.kernel.currentVNextMaterialRevision() };
    damagedAttempt(state, { task_id: state.task.identity.taskId, stage: "verify-code", snapshot_tree: identity.tree,
      material_revision: identity.materialRevision, attempt_id: "unrelated", terminal_status: "semantic",
      report_ref: "quality/reviews/reports/missing.md" }, "quality/reviews/attempts/unrelated/attempt.json");
    let dispatches = 0;
    const result = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: request(), resolveRouteIdentity: route,
      runRound: async (input) => { dispatches += 1; return unavailableResult(input); } });
    expect(dispatches).toBe(1);
    expect(result.status).toBe("recorded");
  });

  it("ignores a legacy attempt from another stage even when its task identity is absent", async () => {
    const state = fixture();
    const identity = { tree: state.kernel.currentVNextSnapshot().tree, materialRevision: state.kernel.currentVNextMaterialRevision() };
    damagedAttempt(state, { stage: "make-decision", attempt_id: "legacy-md", terminal_status: "semantic",
      report_ref: "quality/reviews/reports/missing.md" }, "quality/reviews/attempts/legacy-md/attempt.json");
    let dispatches = 0;
    const result = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel,
      request: { ...request(), stage: "verify-code" }, resolveRouteIdentity: route,
      runRound: async (input) => { dispatches += 1; return unavailableResult(input); } });
    expect(identity.tree).toMatch(/^[a-f0-9]{40,64}$/);
    expect(identity.materialRevision).toMatch(/^revision-[a-f0-9]{64}$/);
    expect(dispatches).toBe(1);
    expect(result.status).toBe("recorded");
  });

  it.each([
    ["review_track", "foreign-track"],
    ["review_kind", "foreign-kind"],
    ["subject_kind", "artifact"],
    ["review_scope", "phase"],
  ])("ignores a same-stage damaged attempt from another %s namespace", async (field, value) => {
    const state = fixture();
    const identity = { tree: state.kernel.currentVNextSnapshot().tree, materialRevision: state.kernel.currentVNextMaterialRevision() };
    damagedAttempt(state, { task_id: state.task.identity.taskId, stage: "build-code", snapshot_tree: identity.tree,
      material_revision: identity.materialRevision, attempt_id: `foreign-${field}`, terminal_status: "semantic",
      report_ref: "quality/reviews/reports/missing.md", [field]: value }, `quality/reviews/attempts/foreign-${field}/attempt.json`);
    let dispatches = 0;
    const result = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: request(), resolveRouteIdentity: route,
      runRound: async (input) => { dispatches += 1; return unavailableResult(input); } });
    expect(dispatches).toBe(1);
    expect(result.status).toBe("recorded");
  });

  it("blocks dispatch when the damaged attempt belongs to the current namespace", async () => {
    const state = fixture();
    const identity = { tree: state.kernel.currentVNextSnapshot().tree, materialRevision: state.kernel.currentVNextMaterialRevision() };
    damagedAttempt(state, { task_id: state.task.identity.taskId, stage: "build-code", snapshot_tree: identity.tree,
      material_revision: identity.materialRevision, attempt_id: "current-damaged", terminal_status: "semantic",
      report_ref: "quality/reviews/reports/missing.md" }, "quality/reviews/attempts/current-damaged/attempt.json");
    let dispatches = 0;
    await expect(recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: request(), resolveRouteIdentity: route,
      runRound: async () => { dispatches += 1; return unavailableResult(request()); } })).rejects.toMatchObject({ code: "REVIEW_RECORD_INCOMPLETE" });
    expect(dispatches).toBe(0);
  });

  it("keeps an unclassifiable damaged attempt as unknown and does not dispatch", async () => {
    const state = fixture();
    state.kernel.publishCanonicalRecord("quality/reviews/attempts/unscoped/attempt.json", "not-json\n");
    let dispatches = 0;
    const result = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: request(), resolveRouteIdentity: route,
      runRound: async () => { dispatches += 1; return unavailableResult(request()); } });
    expect(dispatches).toBe(0);
    expect(result).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_RETRY_BUDGET_UNKNOWN" } });
  });

  it("does not let a different review subject consume the current subject budget", async () => {
    const state = fixture();
    const first = { ...request(), subject: { component: "runtime/review" } };
    const second = { ...request(), subject: { component: "runtime/evidence" } };
    let dispatches = 0;
    const runRound = async (input) => { dispatches += 1; return unavailableResult(input); };
    await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: first, resolveRouteIdentity: route, runRound });
    const result = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: second, resolveRouteIdentity: route, runRound });
    expect(dispatches).toBe(2);
    expect(result).toMatchObject({ status: "recorded", dispatch_state: "dispatched", review_budget: { ok: true } });
  });
});
