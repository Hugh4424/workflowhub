import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  completeDeliveryClosePlan,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  prepareDeliveryClosePlan,
} from "../../core/task-close.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

let fixtureCounter = 0;

function git(cwd, args, options = {}) {
  try { return execFileSync("git", args, { cwd, encoding: "utf8", ...options }).trim(); }
  catch (error) { if (options.allowFailure) return ""; throw error; }
}

function baseFixture() {
  fixtureCounter += 1;
  const taskId = `cleanup-resume-${fixtureCounter}`;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-cleanup-resume-")));
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
  const workspaceRoot = join(root, "repo-work");
  git(repo, ["worktree", "add", "-b", `task/${projectName}/${taskId}`, workspaceRoot, "main"]);
  git(workspaceRoot, ["config", "user.name", "WorkflowHub Tests"]);
  git(workspaceRoot, ["config", "user.email", "tests@workflowhub.local"]);

  const manifest = {
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

  const task = createTask({ storageRoot: root, manifest });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n\n真实需求已登记。\n");
  artifacts.writeAtomic("spec.md", "# Specification\n\n## 9. 验收标准\n- [ ] **AC-001**：正常 close 只记录物理事实。\n");
  artifacts.writeAtomic("plan.md", "# Plan\n\n复用现有 close executor。\n");
  artifacts.writeAtomic("tasks.md", "# Tasks\n\n#### T001\n- **ID**：T001\n");
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = candidate.captureSnapshot();
  const delivery = {
    remote: "origin",
    task_branch: `task/${projectName}/${taskId}`,
    target_branch: "main",
    task_commit: snapshot.commit,
    spec_source_path: `specs/${taskId}`,
    spec_archive_path: `specs/archive/${taskId}`,
  };
  return { task, kernel, candidate, worktreeRoot: candidate.worktreeRoot, repo, delivery, taskId };
}

function authorizeAll(state, confirmationRef) {
  for (const operation of ["commit", "merge", "archive", "push", "cleanup"]) {
    state.kernel.publishIrreversibleAuthorization({ operation, subject_ref: confirmationRef });
  }
}

describe("close resume and finalize (T5)", () => {
  it("resumes after physical actions are already done and skips already-completed steps", async () => {
    const state = baseFixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery, allowMiniTaskFocused: true });
    const confirmed = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "用户确认继续关闭。", stepSlug: "confirm-close-plan" });
    authorizeAll(state, confirmed.confirmation.human_confirmation_ref);
    const executors = createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan });

    const first = await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmed.ref,
      executors,
      deferCompletionRecord: true,
    });
    expect(first.status).toBe("completed");
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow();

    const commitRecord = JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/commit-delivery.json`));
    expect(commitRecord.status).toBe("completed");

    const resumed = await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmed.ref,
      executors,
    });
    expect(resumed.status).toBe("completed");
    expect(resumed.completed_at).toBeDefined();

    for (const stepId of ["merge-task-branch", "archive-spec", "push-target-branch", "cleanup"]) {
      const record = JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/${stepId}.json`));
      expect(record.status).toBe("completed");
    }

    const completed = JSON.parse(state.task.readRecord("operations/close/completed.json"));
    expect(completed.status).toBe("completed");
    expect(completed.close_mode).toBeUndefined();
  });

  it("finalize records completed.json after physical actions are done", async () => {
    const state = baseFixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery, allowMiniTaskFocused: true });
    const confirmed = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "用户确认继续关闭。", stepSlug: "confirm-close-plan" });
    authorizeAll(state, confirmed.confirmation.human_confirmation_ref);
    const executors = createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan });

    await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmed.ref,
      executors,
      deferCompletionRecord: true,
    });
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow();

    const finalized = await completeDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmed.ref,
    });

    expect(finalized.status).toBe("completed");
    expect(finalized.physical_state).toBeDefined();
    expect(finalized.physical_state.delivery_committed).toBe(true);
    expect(finalized.physical_state.merge).toBe(true);
    expect(finalized.physical_state.archive).toBe(true);
    expect(finalized.physical_state.push).toBe(true);
  });
});
