import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  closeDelivery,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  prepareDeliveryClosePlan,
} from "../../core/task-close.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

let fixtureCounter = 0;

function git(cwd, args, options = {}) {
  try { return execFileSync("git", args, { cwd, encoding: "utf8", ...options }).trim(); }
  catch (error) { if (options.allowFailure) return ""; throw error; }
}

function writeMaterials(worktreeRoot, taskId) {
  const specSource = `specs/${taskId}`;
  const specDir = join(worktreeRoot, specSource);
  mkdirSync(specDir, { recursive: true });
  writeFileSync(join(specDir, "decision-log.md"), "# Decision log\n\n真实需求已登记。\n");
  writeFileSync(join(specDir, "spec.md"), "# Specification\n\n## 9. 验收标准\n- [ ] **AC-001**：正常 close 只记录物理事实。\n");
  writeFileSync(join(specDir, "plan.md"), "# Plan\n\n复用现有 close executor。\n");
  writeFileSync(join(specDir, "tasks.md"), "# Tasks\n\n#### T001\n- **ID**：T001\n");
  return specSource;
}

function baseFixture({ existing = false } = {}) {
  fixtureCounter += 1;
  const taskId = `close-contract-${fixtureCounter}`;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-close-contract-")));
  roots.push(root);
  const repo = join(root, "repo");
  const bare = join(root, "origin.git");
  mkdirSync(repo);
  mkdirSync(bare);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base"]);
  git(bare, ["init", "--bare", "-q"]);
  git(repo, ["remote", "add", "origin", bare]);
  git(repo, ["push", "-q", "origin", "main"]);

  const projectName = "WorkflowHub";
  let workspaceRoot;
  let manifest;
  if (existing) {
    workspaceRoot = join(root, "repo-work");
    git(repo, ["worktree", "add", "-b", `task/${projectName}/${taskId}`, workspaceRoot, "main"]);
    git(workspaceRoot, ["config", "user.name", "WorkflowHub Tests"]);
    git(workspaceRoot, ["config", "user.email", "tests@workflowhub.local"]);
    manifest = {
      schema_version: "1.0.0",
      project_name: projectName,
      task_id: taskId,
      created_at: "2026-08-21T00:00:00Z",
      target_repo_root: repo,
      workspace_mode: "existing",
      workspace_root: workspaceRoot,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    };
  } else {
    manifest = {
      schema_version: "1.0.0",
      project_name: projectName,
      task_id: taskId,
      created_at: "2026-08-21T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    };
  }

  const task = createTask({ storageRoot: root, manifest });
  // First prepare gives us the worktree; second prepare after commit captures the new baseline.
  const tempCandidate = prepareTaskWorkspace(task);
  const worktreeRoot = tempCandidate.worktreeRoot;
  const specSource = writeMaterials(worktreeRoot, taskId);
  git(worktreeRoot, ["add", "--", specSource]);
  git(worktreeRoot, ["commit", "-m", "task materials"]);
  const taskCommit = git(worktreeRoot, ["rev-parse", "HEAD"]);
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = candidate.captureSnapshot();
  const delivery = {
    remote: "origin",
    task_branch: `task/${projectName}/${taskId}`,
    target_branch: "main",
    task_commit: taskCommit,
    spec_source_path: specSource,
    spec_archive_path: `specs/archive/${taskId}`,
  };
  return { task, kernel, candidate, worktreeRoot, repo, delivery, existing, taskId };
}

function authorizeBatch(state, confirmationRef) {
  for (const operation of ["commit", "merge", "archive", "push", "cleanup"]) {
    state.kernel.publishIrreversibleAuthorization({ operation, subject_ref: confirmationRef });
  }
}

const EXPECTED_ACTIONS = ["commit-delivery", "merge-task-branch", "archive-spec", "push-target-branch", "cleanup"];
const ACTION_TO_OPERATION = {
  "commit-delivery": "commit",
  "merge-task-branch": "merge",
  "archive-spec": "archive",
  "push-target-branch": "push",
  "cleanup": "cleanup",
};

describe("close contract (T0-RED)", () => {
  it("requires explicit user reply text and current-step provenance", () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    expect(() => confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed" }))
      .toThrow(/replyText is required/i);
    expect(() => confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "用户确认。" }))
      .toThrow(/stepSlug is required/i);
  });

  it("records timeout without inventing a human reply and blocks execution", async () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      outcome: "timeout",
    });

    expect(confirmation.confirmation).toMatchObject({
      outcome: "timeout",
      human_confirmation_ref: null,
      human_confirmation_hash: null,
    });
    await expect(executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
    })).resolves.toMatchObject({ status: "blocked", confirmationOutcome: "timeout" });
  });

  it("one-shot close returns normal mode and completed.json has only physical facts", async () => {
    const state = fixture();
    const result = await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
      now: () => "2026-08-21T00:00:00.000Z",
    });

    expect(result.close_mode).toBe("normal");
    expect(result).not.toHaveProperty("quality_status");
    expect(result).not.toHaveProperty("quality_gaps");
    expect(result).not.toHaveProperty("product_release_status");
    expect(result).not.toHaveProperty("risk_record_ref");

    const completed = JSON.parse(state.task.readRecord("operations/close/completed.json"));
    expect(completed.close_mode).toBe("normal");
    expect(completed).not.toHaveProperty("quality_status");
    expect(completed).not.toHaveProperty("quality_gaps");
    expect(completed).not.toHaveProperty("product_release_status");
    expect(completed).not.toHaveProperty("risk_record_ref");
  });

  it("close plan has exactly five ordered actions: commit, merge, archive, push, cleanup", async () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
    });

    const stepIds = prepared.plan.steps.map((step) => step.step_id);
    expect(stepIds).toEqual(EXPECTED_ACTIONS);

    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      outcome: "confirmed",
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
    });
    authorizeBatch(state, confirmation.confirmation.human_confirmation_ref);

    await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
      now: () => "2026-08-21T00:00:00.000Z",
    });

    const stepRecords = prepared.plan.steps.map((step) =>
      JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`)));
    expect(stepRecords.map((record) => record.action ?? record.step_id)).toEqual(EXPECTED_ACTIONS);
    for (const record of stepRecords) {
      expect(record).toHaveProperty("completed_at");
      expect(record).toHaveProperty("evidence");
    }
  });

  it("existing workspace mode completes without deleting the directory", async () => {
    const state = baseFixture({ existing: true });
    await expect(closeDelivery({
      task: state.task,
      kernel: state.kernel,
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
      now: () => "2026-08-21T00:00:00.000Z",
    })).resolves.toMatchObject({ status: "completed", close_mode: "normal" });

    expect(existsSync(state.worktreeRoot)).toBe(true);
    const completed = JSON.parse(state.task.readRecord("operations/close/completed.json"));
    expect(completed.physical_state.cleanup).toEqual({ skipped: true, reason: expect.any(String) });
  });
});

function fixture() {
  return baseFixture({ existing: false });
}
