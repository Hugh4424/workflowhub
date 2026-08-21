import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  prepareDeliveryClosePlan,
  recordManualDeliveryClose,
} from "../../core/task-close.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, args, options = {}) {
  try { return execFileSync("git", args, { cwd, encoding: "utf8", ...options }).trim(); }
  catch (error) { if (options.allowFailure) return ""; throw error; }
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-manual-close-")));
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

  const taskId = "manual-close";
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0",
    project_name: "WorkflowHub",
    task_id: taskId,
    created_at: "2026-08-21T00:00:00Z",
    target_repo_root: repo,
    issue_ids: [],
    inputs: {},
    record_model: "vnext-single-write",
  } });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n\n真实需求已登记。\n");
  artifacts.writeAtomic("spec.md", "# Specification\n\n## 9. 验收标准\n- [ ] **AC-001**：风险交付仍保留物理事实。\n");
  artifacts.writeAtomic("plan.md", "# Plan\n\n复用现有 close executor。\n");
  artifacts.writeAtomic("tasks.md", "# Tasks\n\n#### T001\n- **ID**：T001\n");
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = candidate.captureSnapshot();
  const delivery = {
    remote: "origin",
    task_branch: `task/WorkflowHub/${taskId}`,
    target_branch: "main",
    task_commit: snapshot.commit,
    spec_source_path: `specs/${taskId}`,
    spec_archive_path: `specs/archive/${taskId}`,
  };
  return { task, kernel, candidate, worktreeRoot: candidate.worktreeRoot, repo, delivery };
}

function prepareRiskPlan(state) {
  return prepareDeliveryClosePlan({
    task: state.task,
    kernel: state.kernel,
    delivery: state.delivery,
    riskClose: true,
    riskReason: "真实质量与产品发布事实尚未闭合，但用户明确要求物理交付",
    deferredItems: ["补齐质量事实", "补做产品发布验收"],
  });
}

function authorizePhysicalClose(state, confirmationRef) {
  for (const operation of ["commit", "archive", "merge", "push", "cleanup"]) {
    state.kernel.publishIrreversibleAuthorization({ operation, subject_ref: confirmationRef });
  }
}

function executeManual(state, plan, confirmationRef) {
  return executeClosePlan({
    task: state.task,
    kernel: state.kernel,
    plan,
    riskClose: true,
    closeConfirmationRef: confirmationRef,
    executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan }),
    now: () => "2026-08-21T00:00:00.000Z",
  });
}

describe("manual delivery close", () => {
  it("executes the physical close actions and records quality risk separately from normal completion", async () => {
    const state = fixture();
    const prepared = prepareRiskPlan(state);
    expect(prepared.plan.delivery.risk_close).toMatchObject({ accepted: true, deferred_items: ["补齐质量事实", "补做产品发布验收"] });
    const confirmation = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed" });

    await expect(executeManual(state, prepared.plan, confirmation.ref)).rejects.toThrow(/IRREVERSIBLE_AUTHORIZATION_REQUIRED: authorize --operation=commit/);
    expect(git(state.repo, ["rev-parse", "refs/heads/main"])).toBe(git(state.repo, ["rev-parse", "refs/remotes/origin/main"]));

    authorizePhysicalClose(state, confirmation.confirmation.human_confirmation_ref);
    const result = await executeManual(state, prepared.plan, confirmation.ref);

    expect(result).toMatchObject({
      schema_version: "manual-risk-close.v1",
      business_status: "delivered",
      formal_status: "closed_with_risk",
      status: "completed_with_risk",
      risk_accepted: true,
      physical_actions_completed: true,
      deferred_operations: [],
      plan_hash: prepared.plan_hash,
    });
    expect(result.physical_state).toMatchObject({
      delivery_committed: true,
      archive: true,
      merge: true,
      push: true,
      worktree_cleanup: true,
      formal_cleanup_safe: true,
      branch_cleanup: true,
      verify_facts_fresh: false,
    });
    expect(existsSync(state.worktreeRoot)).toBe(false);
    expect(git(state.repo, ["show-ref", "--verify", "--quiet", `refs/heads/${state.delivery.task_branch}`], { allowFailure: true })).toBe("");
    expect(git(state.repo, ["rev-parse", `main:${state.delivery.spec_archive_path}/spec.md`])).toMatch(/^[a-f0-9]+$/);
    expect(git(state.repo, ["rev-parse", "refs/heads/main"])).toBe(git(state.repo, ["rev-parse", "refs/remotes/origin/main"]));
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow(/ENOENT/);

    const repeated = await executeManual(state, prepared.plan, confirmation.ref);
    expect(repeated.output_ref).toBe(result.output_ref);

    rmSync(join(state.task.taskPath, `operations/close/plans/${prepared.plan_hash}/steps/commit-delivery.json`), { force: true });
    expect(() => recordManualDeliveryClose({
      task: state.task,
      kernel: state.kernel,
      sourceRef: `operations/close/plans/${prepared.plan_hash}/plan.json`,
      planHash: prepared.plan_hash,
      riskAccepted: true,
      riskReason: prepared.plan.delivery.risk_close.reason,
      deferredItems: prepared.plan.delivery.risk_close.deferred_items,
      qualityReasons: prepared.plan.delivery.risk_close.quality_reasons,
      physicalActionsCompleted: true,
      physicalState: result.physical_state,
    })).toThrow(/missing operation fact: commit-delivery/i);
  });

  it("does not allow the risk evidence writer to create a record without physical facts", () => {
    const state = fixture();
    const prepared = prepareRiskPlan(state);
    const sourceRef = `operations/close/plans/${prepared.plan_hash}/plan.json`;
    expect(() => recordManualDeliveryClose({
      task: state.task,
      kernel: state.kernel,
      sourceRef,
      planHash: prepared.plan_hash,
      riskAccepted: true,
      riskReason: "质量事实延期",
    })).toThrow(/execute physical close actions/i);
  });

  it("does not let manual-close execute a plan that was never prepared", async () => {
    const state = fixture();
    const prepared = prepareRiskPlan(state);
    const confirmation = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed" });
    rmSync(join(state.task.taskPath, `operations/close/plans/${prepared.plan_hash}/plan.json`), { force: true });

    await expect(executeManual(state, prepared.plan, confirmation.ref)).rejects.toThrow(/requires a prepared close plan/i);
    expect(git(state.repo, ["rev-parse", "refs/heads/main"])).toBe(git(state.repo, ["rev-parse", "refs/remotes/origin/main"]));
    expect(existsSync(state.worktreeRoot)).toBe(true);
  });
});
