import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  inspectDeliveryCloseState,
  prepareDeliveryClosePlan,
} from "../../core/task-close.mjs";
import { deriveCurrentCloseProjection } from "../../runtime/stage/current-close-projection.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
let counter = 0;

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function hasRemoteBranch(root, branch) {
  return git(root, ["ls-remote", "--heads", "origin", `refs/heads/${branch}`]) !== "";
}

function writeMaterials(worktreeRoot, taskId) {
  const source = `specs/${taskId}`;
  const directory = join(worktreeRoot, source);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "decision-log.md"), "# Decision\n");
  writeFileSync(join(directory, "spec.md"), "# Spec\n\n## Acceptance Criteria\n- **AC-001**: Remote cleanup remains authorization-bound.\n");
  writeFileSync(join(directory, "plan.md"), "# Plan\n");
  writeFileSync(join(directory, "tasks.md"), "# Tasks\n\n#### T001\n- **ID**: T001\n");
  return source;
}

function fixture() {
  counter += 1;
  const taskId = `p7-close-${counter}`;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p7-close-")));
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
      created_at: "2026-08-30T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const first = prepareTaskWorkspace(task);
  const source = writeMaterials(first.worktreeRoot, taskId);
  git(first.worktreeRoot, ["add", "--", source]);
  git(first.worktreeRoot, ["commit", "-qm", "task materials"]);
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const taskBranch = git(candidate.worktreeRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  git(candidate.worktreeRoot, ["push", "-q", "origin", `HEAD:refs/heads/${taskBranch}`]);
  const delivery = {
    remote: "origin",
    task_branch: taskBranch,
    target_branch: "main",
    task_commit: git(candidate.worktreeRoot, ["rev-parse", "HEAD"]),
    spec_source_path: source,
    spec_archive_path: `specs/archive/${taskId}`,
    known_gaps: [{
      gap_id: "external-review-repository",
      status: "unknown",
      missing_source: "external repository formal acceptance, commit, push, and close",
      impact: "external work is outside this WorkflowHub task pass",
      owner: "external repository owner / user",
    }],
  };
  return { task, kernel, candidate, delivery, repo, bare };
}

function confirm(state) {
  const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
  const confirmation = confirmClosePlan({
    task: state.task,
    kernel: state.kernel,
    plan: prepared.plan,
    outcome: "confirmed",
    replyText: "确认执行收口物理动作",
    stepSlug: "verify-code",
  });
  return { ...state, prepared, confirmation };
}

function authorizeAll(state) {
  for (const operation of ["commit", "merge", "archive", "push", "cleanup"]) {
    state.kernel.publishIrreversibleAuthorization({
      operation,
      subject_ref: state.confirmation.confirmation.human_confirmation_ref,
    });
  }
}

function execute(state) {
  return executeClosePlan({
    task: state.task,
    kernel: state.kernel,
    plan: state.prepared.plan,
    closeConfirmationRef: state.confirmation.ref,
    executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: state.prepared.plan }),
    now: () => "2026-08-30T00:00:00.000Z",
  });
}

describe("P7 remote branch cleanup and known-gap contract", () => {
  it("reports an absent remote target ref as an unavailable baseline, not a generic transport failure", () => {
    const state = fixture();
    git(state.bare, ["update-ref", "-d", "refs/heads/main"]);
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
    })).toThrow(/local and remote target baselines must match/);
  });

  it("keeps read-only close status available when the remote probe is unavailable", () => {
    const state = confirm(fixture());
    git(state.repo, ["remote", "set-url", "origin", join(state.repo, "missing-origin.git")]);

    const readback = inspectDeliveryCloseState({ task: state.task, kernel: state.kernel, plan: state.prepared.plan });
    expect(readback.status).toBe("incomplete");
    expect(readback.facts.remote_target_probe).toMatchObject({ status: "unavailable", oid: null });
    expect(readback.facts.remote_branch_probe).toMatchObject({ status: "unavailable", oid: null });
    expect(readback.missing).toEqual(expect.arrayContaining(["push", "remote_branch_cleanup"]));
  });

  it("does not delete the remote task branch before cleanup authorization", async () => {
    const state = confirm(fixture());

    await expect(execute(state)).rejects.toThrow(/authorization/i);
    expect(hasRemoteBranch(state.repo, state.delivery.task_branch)).toBe(true);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
  });

  it("deletes the remote task branch only in an authorized cleanup and exposes the close summary", async () => {
    const state = confirm(fixture());
    const worktreeRoot = state.candidate.worktreeRoot;
    authorizeAll(state);

    const result = await execute(state);
    expect(result.status).toBe("completed");
    expect(hasRemoteBranch(state.repo, state.delivery.task_branch)).toBe(false);
    expect(existsSync(worktreeRoot)).toBe(false);

    const readback = inspectDeliveryCloseState({ task: state.task, kernel: state.kernel, plan: state.prepared.plan });
    expect(readback.facts.remote_branch_cleanup).toBe(true);
    expect(readback.known_gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        gap_id: "external-review-repository",
        status: "unknown",
        missing_source: expect.stringMatching(/external repository formal acceptance/i),
        impact: expect.any(String),
        owner: expect.any(String),
      }),
    ]));
  });

  it("keeps a failed remote delete visible and never promotes it to completed", async () => {
    const state = confirm(fixture());
    authorizeAll(state);
    git(join(state.repo, "..", "origin.git"), ["config", "receive.denyDeletes", "true"]);

    await expect(execute(state)).rejects.toThrow(/delete|deny|remote/i);
    expect(hasRemoteBranch(state.repo, state.delivery.task_branch)).toBe(true);

    const readback = inspectDeliveryCloseState({ task: state.task, kernel: state.kernel, plan: state.prepared.plan });
    expect(readback.missing).toContain("remote_branch_cleanup");
    expect(readback.completed).toBeNull();
    expect(readback.step_records).toEqual(expect.arrayContaining([
      expect.objectContaining({ step_id: "cleanup", status: "failed" }),
    ]));
  });

  it("does not collapse managed terminal statuses or close gaps into passed", () => {
    const projection = deriveCurrentCloseProjection({
      task_id: "p7-close-projection",
      work_progress: { status: "completed" },
      stage_quality: { status: "incomplete" },
      root_causes: [{ root_cause_id: "external-review-repository", status: "unknown" }],
      close: {
        task_id: "p7-close-projection",
        plan: { plan_hash: "p" },
        known_gaps: [{
          gap_id: "external-review-repository",
          status: "unknown",
          missing_source: "external repository formal acceptance",
          impact: "outside task pass",
          owner: "external repository owner",
        }],
        facts: {
          delivery_committed: true,
          archive: true,
          merge: true,
          push: true,
          worktree_cleanup: true,
          formal_cleanup_safe: true,
          branch_cleanup: true,
          remote_branch_cleanup: false,
          cleanup: { incomplete: true },
        },
        step_records: [{ step_id: "cleanup", status: "failed", error: "remote delete denied" }],
      },
    });

    expect(projection.domains.physical_delivery.status).toBe("incomplete");
    expect(projection.domains.physical_delivery.missing_facts).toContain("remote_branch_cleanup");
    expect(projection.root_causes).toEqual(expect.arrayContaining([
      expect.objectContaining({ root_cause_id: "external-review-repository", status: "unknown" }),
    ]));
    expect(projection.close.known_gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ gap_id: "external-review-repository", status: "unknown" }),
    ]));
  });
});
