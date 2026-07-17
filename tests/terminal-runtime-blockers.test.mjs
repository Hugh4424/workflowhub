import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { bootstrapStage, prepareMakeDecisionWorkspace } from "../core/stage-context.mjs";
import { acceptStageAttempt, runStage } from "../core/stage-runner.mjs";
import { requiresHumanConfirmation } from "../core/stage-acceptance-policy.mjs";
import { createTask } from "../core/task-handle.mjs";
import { captureTaskSnapshotV1Sync } from "../core/task-snapshot.mjs";
import { createTrustedSignatureProof } from "../core/human-confirmation.mjs";
import {
  confirmTaskCloseOperation,
  executeTaskCloseOperation,
  prepareTaskCloseOperation,
  taskCloseOperationStatus,
} from "../core/task-close.mjs";
import { TEST_CONFIRMATION_SIGNING_KEY, testConfirmationVerification, writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

describe("stage runtime terminal contracts", () => {
  it("does not expose checkpoint override through the formal CLI", () => {
    const source = readFileSync(resolve("scripts/stage-runtime.mjs"), "utf8");
    expect(source).not.toMatch(/values\.checkpoint|--checkpoint/);
  });

  it("formal CLI dispatches real stage handlers instead of publishing caller JSON facts", () => {
    const source = readFileSync(resolve("scripts/stage-runtime.mjs"), "utf8");
    const handlers = readFileSync(resolve("core/stage-handlers.mjs"), "utf8");
    expect(source).not.toMatch(/handlerResult\s*=\s*readJson|values\.result/);
    expect(source).toMatch(/runOfficialStage/);
    expect(handlers).toMatch(/createCheckpoint/);
    expect(source).toMatch(/prepareMakeDecisionWorkspace/);
    expect(source).toMatch(/worktree-root[^\n]+no longer supported/i);
  });

  it("rejects external handler paths and exposes all five repository-owned handlers", () => {
    const source = readFileSync(resolve("scripts/stage-runtime.mjs"), "utf8");
    const handlers = readFileSync(resolve("core/stage-handlers.mjs"), "utf8");
    expect(source).not.toMatch(/handler-module/);
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) expect(handlers).toContain(stage);
  });

  it("runStage resolves declared cross-task input mappings", () => {
    expect(readFileSync(resolve("core/stage-runner.mjs"), "utf8")).toMatch(/readInput\s*\(/);
  });
});

describe("TaskHandle-backed close fail-stop", () => {
  const roots = [];
  afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

  async function governed(decision = "accepted", { authorizeCleanup = false } = {}) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-close-operation-")));
    roots.push(root);
    const repo = join(root, "repo"), taskId = `close-${roots.length}`, projectName = "Demo";
    mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const taskPath = join(root, "Projects", projectName, "tasks", taskId);
    const task = createTask({ storageRoot: root, taskPath, manifest: {
      schema_version: "1.0.0", project_name: projectName, task_id: taskId,
      created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {},
      release_manifest_ref: "releases/test/manifest.json", release_manifest_hash: "a".repeat(64),
    } });
    const decisionContext = prepareMakeDecisionWorkspace(bootstrapStage("make-decision", { mode: "sidecar", taskPath, projectName, taskId, confirmationVerification: testConfirmationVerification }));
    const contextFor = (stage) => stage === "make-decision" ? decisionContext : bootstrapStage(stage, { mode: "sidecar", taskPath, projectName, taskId, confirmationVerification: testConfirmationVerification });
    const execute = async (stage, handler) => {
      const context = contextFor(stage), attempt = await runStage(stage, context, handler);
      const request = { attemptRef: attempt.attempt_ref };
      if (requiresHumanConfirmation(stage)) request.humanConfirmationRef = writeHumanConfirmation(context.kernel, stage, attempt);
      acceptStageAttempt(stage, context, request);
    };
    const worktree = decisionContext.candidateWorkspace.worktreeRoot;
    const baseline = decisionContext.candidateWorkspace.baselineCommit;
    const initialTree = decisionContext.candidateWorkspace.captureSnapshot().tree;
    await execute("make-decision", async () => ({ facts: { worktree_root: worktree, baseline_commit: baseline, snapshot_tree: initialTree } }));
    await execute("build-spec", async (worker) => { worker.artifacts.writeAtomic("spec.md", "spec\n"); return { facts: { spec_ref: `specs/${taskId}/spec.md`, checkpoint: worker.createCheckpoint("build-spec") } }; });
    await execute("build-plan", async (worker) => { worker.artifacts.writeAtomic("plan.md", "plan\n"); worker.artifacts.writeAtomic("tasks.md", "tasks\n"); return { facts: { plan_ref: `specs/${taskId}/plan.md`, tasks_ref: `specs/${taskId}/tasks.md`, checkpoint: worker.createCheckpoint("build-plan") } }; });
    const testFacts = (prefix, tree) => ({ command: "true", exit_code: 0, command_hash: "b".repeat(64), snapshot_head: baseline, snapshot_tree: tree, snapshot_commit: baseline, started_at: "2026-07-17T00:00:00.000Z", completed_at: "2026-07-17T00:00:01.000Z", receipt_ref: `receipts/${prefix}.json`, receipt_hash: "c".repeat(64), output_ref: `evidence/${prefix}.txt`, output_hash: "d".repeat(64) });
    const reviewFacts = (stage, tree) => ({ verdict: "pass", result_ref: `reviews/results/${stage}.json`, result_hash: "e".repeat(64), snapshot_tree: tree });
    await execute("build-code", async (worker) => { const tree = captureTaskSnapshotV1Sync({ taskId, workspaceRoot: worker.workspace.worktreeRoot, baselineCommit: worker.workspace.baselineCommit }).tree_oid; return { facts: { changed: [], tests: testFacts("build", tree), review: reviewFacts("build-code", tree), phase_completion: true } }; });
    await execute("verify-code", async (worker) => { const tree = captureTaskSnapshotV1Sync({ taskId, workspaceRoot: worker.workspace.worktreeRoot, baselineCommit: worker.workspace.baselineCommit }).tree_oid; return { facts: { tests: testFacts("verify", tree), review: reviewFacts("verify-code", tree), evidence_refs: [] } }; });
    const context = contextFor("verify-code"), kernel = context.kernel, activeTask = context.task;
    const plan = prepareTaskCloseOperation({ task: activeTask, kernel, authorizeCleanup });
    const proofRef = `evidence/authentication/close-${taskId}.json`, proofRaw = "close-proof\n";
    kernel.publishCanonicalRecord(proofRef, proofRaw);
    const now = "2026-07-17T00:00:02.000Z";
    const confirmation = {
      schema_id: "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json", schema_version: "1.0.0",
      purpose: "close", task_id: taskId, bound_ref: "operations/close/plan.json", bound_hash: plan.plan_hash,
      actor: { id: "human-reviewer", type: "human" },
      source_event: { ref: `source-events/close-${taskId}.json`, sha256: "f".repeat(64), occurred_at: "2026-07-17T00:00:00.000Z" },
      authentication: { method: "signature", verified_at: "2026-07-17T00:00:01.000Z", proof_ref: proofRef, proof_hash: sha256(proofRaw), signature: "0".repeat(64) },
      decision, confirmed_at: now,
    };
    confirmation.authentication.signature = createTrustedSignatureProof(TEST_CONFIRMATION_SIGNING_KEY, confirmation);
    confirmTaskCloseOperation({ task: activeTask, kernel, confirmation, confirmationVerification: testConfirmationVerification });
    return { root, repo, task: activeTask, kernel, plan, worktree };
  }

  it("exposes only the four TaskHandle-backed close APIs", async () => {
    expect(Object.keys(await import("../core/task-close.mjs")).sort()).toEqual([
      "confirmTaskCloseOperation", "executeTaskCloseOperation", "prepareTaskCloseOperation", "taskCloseOperationStatus",
    ]);
  });

  it("rejects forged capabilities before any close record or side effect", async () => {
    expect(() => prepareTaskCloseOperation({ task: {}, kernel: {} })).toThrow(/TaskHandle capability/i);
    expect(() => confirmTaskCloseOperation({ task: {}, kernel: {}, confirmation: {} })).toThrow(/TaskHandle capability/i);
    await expect(executeTaskCloseOperation({ task: {}, kernel: {} })).rejects.toThrow(/TaskHandle capability/i);
    expect(() => taskCloseOperationStatus({})).toThrow(/TaskHandle capability/i);
  });

  it.each(["rejected", "timeout"])("does not close after a %s confirmation", async (decision) => {
    const fixture = await governed(decision);
    await expect(executeTaskCloseOperation(fixture)).rejects.toThrow(/no accepted.*confirmation/i);
    expect(taskCloseOperationStatus(fixture.task).status).toBe("confirmed");
    expect(() => fixture.task.readRecord("operations/close/completed.json")).toThrow();
    expect(existsSync(fixture.worktree)).toBe(true);
  });

  it("does not let a later decision overwrite an immutable rejected confirmation", async () => {
    const fixture = await governed("rejected");
    const confirmation = JSON.parse(fixture.task.readRecord("confirmations/source-events/" + sha256(`source-events/close-${fixture.task.identity.taskId}.json`) + ".json"));
    expect(confirmation.decision).toBe("rejected");
    expect(() => fixture.task.createRecordAtomic("operations/close/confirmation.json", "{}\n")).toThrow(/exist|immutable/i);
  });

  it("rejects plan mutation before logical close", async () => {
    const fixture = await governed();
    const path = join(fixture.task.taskPath, "operations/close/plan.json"), plan = JSON.parse(readFileSync(path, "utf8"));
    plan.steps[0].operation = "forged";
    writeFileSync(path, `${JSON.stringify(plan)}\n`);
    await expect(executeTaskCloseOperation(fixture)).rejects.toThrow(/plan hash mismatch/i);
    expect(() => fixture.task.readRecord("operations/close/completed.json")).toThrow();
  });

  it("persists completion last and retries idempotently", async () => {
    const fixture = await governed();
    const first = await executeTaskCloseOperation(fixture), second = await executeTaskCloseOperation(fixture);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ status: "completed", cleanup: "not-authorized" });
    expect(taskCloseOperationStatus(fixture.task).status).toBe("completed");
    expect(existsSync(fixture.worktree)).toBe(true);
  });

  it("requires cleanup to use its separate authorization and operation", async () => {
    await expect(governed("accepted", { authorizeCleanup: true })).rejects.toThrow(/separate cleanup authorization/i);
  });

  it.each([
    ["accepted identity", (fixture) => { const path = join(fixture.task.taskPath, "results", "verify-code", "accepted.json"), record = JSON.parse(readFileSync(path, "utf8")); record.task_id = "forged"; writeFileSync(path, `${JSON.stringify(record)}\n`); }],
    ["accepted attempt hash", (fixture) => { const path = join(fixture.task.taskPath, "results", "verify-code", "accepted.json"), record = JSON.parse(readFileSync(path, "utf8")); record.attempt_hash = "0".repeat(64); writeFileSync(path, `${JSON.stringify(record)}\n`); }],
    ["attempt content", (fixture) => { const accepted = JSON.parse(fixture.task.readRecord("results/verify-code/accepted.json")); writeFileSync(join(fixture.task.taskPath, accepted.attempt_ref), "{}\n"); }],
  ])("fails closed when %s is tampered", async (_label, tamper) => {
    const fixture = await governed();
    tamper(fixture);
    await expect(executeTaskCloseOperation(fixture)).rejects.toThrow(/accepted|attempt|integrity|identity|hash/i);
    expect(() => fixture.task.readRecord("operations/close/completed.json")).toThrow();
  });
});
