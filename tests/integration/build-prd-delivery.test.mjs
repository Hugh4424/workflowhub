import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  closeDelivery,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  inspectDeliveryCloseState,
  prepareDeliveryClosePlan,
} from "../../core/task-close.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
let counter = 0;

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function fixture({ attachment = true } = {}) {
  counter += 1;
  const taskId = `build-prd-delivery-${counter}`;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-build-prd-delivery-")));
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

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-09-09T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const first = prepareTaskWorkspace(task);
  const source = `specs/${taskId}`;
  mkdirSync(join(first.worktreeRoot, source), { recursive: true });
  writeFileSync(join(first.worktreeRoot, source, "decision-log.md"), "# Confirmed decision\n\nBuild the product plan.\n");
  const attachmentPath = "attachments/required.md";
  const attachmentRaw = "required planning attachment\n";
  const requiredAttachments = [{ path: attachmentPath, sha256: sha256(attachmentRaw) }];
  writeFileSync(join(first.worktreeRoot, source, "prd.md"), [
    "# Product PRD",
    "",
    "## Delivery",
    "The planning artifact is complete.",
    "",
    `- **必要附件与版本**：${JSON.stringify(requiredAttachments)}`,
    "",
  ].join("\n"));
  if (attachment) {
    mkdirSync(join(first.worktreeRoot, "attachments"), { recursive: true });
    writeFileSync(join(first.worktreeRoot, attachmentPath), attachmentRaw);
  }
  git(first.worktreeRoot, ["add", "--", source, ...(attachment ? [attachmentPath] : [])]);
  git(first.worktreeRoot, ["commit", "-qm", "planning materials"]);
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = captureExecutionSnapshot(candidate.worktreeRoot, taskId);
  const delivery = {
    remote: "origin",
    task_branch: `task/WorkflowHub/${taskId}`,
    target_branch: "main",
    task_commit: git(candidate.worktreeRoot, ["rev-parse", "HEAD"]),
    spec_source_path: source,
    spec_archive_path: `specs/archive/${taskId}`,
  };
  return { task, kernel, candidate, repo, taskId, delivery, requiredAttachments };
}

function authorizePlanning(state, confirmationRef, confirmationHash) {
  for (const operation of ["commit", "merge", "archive", "push", "cleanup"]) {
    const value = {
      schema_version: "irreversible-authorization.v1",
      task_id: state.task.identity.taskId,
      operation,
      subject_ref: confirmationRef,
      subject_hash: confirmationHash,
      material_revision: state.prepared.plan.delivery.planning.material_revision,
      snapshot_tree: state.prepared.plan.delivery.planning.snapshot_tree,
      authorized_at: "2026-09-09T00:00:00.000Z",
    };
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    state.kernel.publishCanonicalRecord(`quality/authorizations/${sha256(raw)}.json`, raw);
  }
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("build-prd planning delivery close", () => {
  it("binds only decision-log.md and prd.md and keeps development/quality separate", () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "planning",
      delivery: { ...state.delivery, required_attachments: state.requiredAttachments },
    });

    expect(prepared.plan.delivery).toMatchObject({
      close_mode: "planning",
      material_status: "complete",
      development_status: "not_executed",
      quality_status: "not_run",
      planning: {
        material_files: ["decision-log.md", "prd.md"],
        attachment_status: "complete",
        status: "complete",
      },
    });
    expect(prepared.plan.delivery.planning.material_revision).toMatch(/^revision-[a-f0-9]{64}$/);
    expect(prepared.plan.delivery.planning.materials).not.toHaveProperty("spec.md");
    expect(() => prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery })).toThrow(/spec\.md|plan\.md|tasks\.md/i);
  });

  it("derives the required attachment set from the PRD and rejects caller drift", () => {
    const state = fixture();
    const derived = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "planning",
      delivery: state.delivery,
    });
    expect(derived.plan.delivery.planning.required_attachments).toEqual(state.requiredAttachments);

    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "planning",
      delivery: { ...state.delivery, required_attachments: [] },
    })).toThrow(/do not exactly match|必要附件与版本/i);
  });

  it("rejects the generic close route from selecting mini-task mode", () => {
    const state = fixture();
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "mini-task",
      delivery: state.delivery,
    })).toThrow(/mini-task delivery route/i);
  });

  it("keeps missing attachments incomplete and refuses execution before any physical step", async () => {
    const state = fixture({ attachment: false });
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "planning",
      delivery: { ...state.delivery, required_attachments: state.requiredAttachments },
    });
    expect(prepared.plan.delivery).toMatchObject({ material_status: "incomplete", planning: { attachment_status: "incomplete" } });
    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      outcome: "confirmed",
      replyText: "确认规划材料物理交付。",
      stepSlug: "confirm-planning-close",
    });
    await expect(executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
    })).rejects.toThrow(/incomplete material\/attachments/i);
    expect(existsSync(join(state.repo, ".git", "refs", "heads", "main"))).toBe(true);
  });

  it("requires independent operation authorization and reads archived planning material back", async () => {
    const state = fixture();
    state.prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "planning",
      delivery: { ...state.delivery, required_attachments: state.requiredAttachments },
    });
    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: state.prepared.plan,
      outcome: "confirmed",
      replyText: "确认规划材料物理交付。",
      stepSlug: "confirm-planning-close",
    });
    await expect(executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: state.prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: state.prepared.plan }),
    })).rejects.toThrow(/IRREVERSIBLE_AUTHORIZATION_REQUIRED/i);

    const completeState = fixture();
    completeState.prepared = prepareDeliveryClosePlan({
      task: completeState.task,
      kernel: completeState.kernel,
      closeMode: "planning",
      delivery: { ...completeState.delivery, required_attachments: completeState.requiredAttachments },
    });
    const result = await closeDelivery({
      task: completeState.task,
      kernel: completeState.kernel,
      delivery: { ...completeState.delivery, required_attachments: completeState.requiredAttachments },
      closeMode: "planning",
      replyText: "确认规划材料物理交付。",
      stepSlug: "confirm-planning-close",
      now: () => "2026-09-09T00:00:00.000Z",
    });
    expect(result).toMatchObject({
      status: "completed",
      close_mode: "planning",
      planning_status: "complete",
      material_status: "complete",
      development_status: "not_executed",
      quality_status: "not_run",
    });
    expect(git(completeState.repo, ["cat-file", "-e", `refs/heads/main:specs/archive/${completeState.taskId}/decision-log.md`])).toBe("");
    expect(git(completeState.repo, ["cat-file", "-e", `refs/heads/main:specs/archive/${completeState.taskId}/prd.md`])).toBe("");
    const stateAfter = inspectDeliveryCloseState({ task: completeState.task, kernel: completeState.kernel, plan: completeState.prepared.plan });
    expect(stateAfter).toMatchObject({
      status: "ready",
      planning_status: "complete",
      development_status: "not_executed",
      quality_status: "not_run",
      planning: { archived_status: "complete" },
    });
  });

  it("preserves successful prior steps and leaves completion absent when push fails", async () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "planning",
      delivery: { ...state.delivery, required_attachments: state.requiredAttachments },
    });
    state.prepared = prepared;
    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      outcome: "confirmed",
      replyText: "确认规划材料物理交付。",
      stepSlug: "confirm-planning-close",
    });
    authorizePlanning(state, confirmation.confirmation.human_confirmation_ref, confirmation.confirmation.human_confirmation_hash);
    execFileSync("git", ["remote", "set-url", "origin", join(state.repo, "missing-origin.git")], { cwd: state.repo });

    await expect(executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
    })).rejects.toThrow(/git ls-remote failed|remote|push/i);

    expect(JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/commit-delivery.json`)).status).toBe("completed");
    expect(JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/merge-task-branch.json`)).status).toBe("completed");
    expect(JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/archive-spec.json`)).status).toBe("completed");
    expect(() => state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/push-target-branch.json`)).toThrow();
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow();
  });
});
