import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const roots = [];
const git = (cwd, ...args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-delivery-close-")));
  roots.push(root);
  const remote = join(root, "remote.git");
  const repo = join(root, "repo");
  const worktree = join(root, "task-worktree");
  execFileSync("git", ["init", "--bare", "-q", remote]);
  execFileSync("git", ["init", "-q", "-b", "main", repo]);
  git(repo, "config", "user.email", "test@example.com");
  git(repo, "config", "user.name", "Test");
  git(repo, "remote", "add", "origin", remote);
  mkdirSync(join(repo, "specs", "task"), { recursive: true });
  writeFileSync(join(repo, "specs", "task", "spec.md"), "accepted spec\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "base");
  git(repo, "push", "-q", "-u", "origin", "main");
  git(repo, "worktree", "add", "-qb", "task/Demo/close-task", worktree, "main");
  writeFileSync(join(worktree, "delivery.txt"), "done\n");
  git(worktree, "add", "delivery.txt");
  git(worktree, "commit", "-qm", "delivery");
  const taskCommit = git(worktree, "rev-parse", "HEAD");

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "close-task",
      created_at: new Date().toISOString(),
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const kernel = createTaskKernel(task);
  const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: worktree, baseline_commit: git(repo, "rev-parse", "main") } });
  kernel.acceptAttempt("make-decision", decision.attempt_ref, writeHumanConfirmation(kernel, "make-decision", decision));
  return { root, remote, repo, worktree, taskCommit, task, kernel };
}

function delivery(f) {
  return {
    task_branch: "task/Demo/close-task",
    target_branch: "main",
    remote: "origin",
    task_commit: f.taskCommit,
    spec_source_path: "specs/task/spec.md",
    spec_archive_path: "specs/archive/task/spec.md",
  };
}

function archive(f) {
  mkdirSync(join(f.worktree, "specs", "archive", "task"), { recursive: true });
  git(f.worktree, "mv", "specs/task/spec.md", "specs/archive/task/spec.md");
  git(f.worktree, "commit", "-qm", "archive spec");
}

function finishCloseActions(f) {
  git(f.repo, "merge", "--no-edit", "task/Demo/close-task");
  git(f.repo, "push", "-q", "origin", "main");
  git(f.repo, "worktree", "remove", f.worktree);
  git(f.repo, "branch", "-d", "task/Demo/close-task");
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("delivery close verifier", () => {
  it("keeps fetch with Code Verifier and out of the core verifier", () => {
    const core = readFileSync(join(process.cwd(), "core", "task-close.mjs"), "utf8");
    const skill = readFileSync(join(process.cwd(), "workflows", "verify-code", "SKILL.md"), "utf8");
    expect(core).not.toMatch(/\[\s*["']fetch["']/);
    expect(skill).toMatch(/Code Verifier[\s\S]*git fetch[\s\S]*WorkflowHub performs no Git writes and does not fetch/i);
  });

  it("reports every unfinished physical action and completes only after delivery, archive, merge, push, and cleanup", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    expect(prepared.plan.steps.map((step) => step.operation)).toEqual([
      "commit-delivery", "archive-spec", "merge-task-branch", "push-target-branch", "remove-task-worktree", "remove-task-branch",
    ]);
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });

    let state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.status).toBe("incomplete");
    expect(state.missing).toEqual(expect.arrayContaining(["archive", "merge", "worktree_cleanup", "branch_cleanup"]));
    await expect(api.completeDeliveryClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref }))
      .rejects.toThrow(/archive|merge|push|cleanup/i);

    archive(f);
    state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.missing).toContain("merge");

    git(f.repo, "merge", "--no-edit", "task/Demo/close-task");
    state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.missing).toContain("push");

    git(f.repo, "push", "-q", "origin", "main");
    state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.missing).toEqual(expect.arrayContaining(["worktree_cleanup", "branch_cleanup"]));

    git(f.repo, "worktree", "remove", f.worktree);
    git(f.repo, "branch", "-d", "task/Demo/close-task");
    state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state).toMatchObject({ status: "ready", missing: [], facts: { delivery_committed: true, archive: true, merge: true, push: true, worktree_cleanup: true, branch_cleanup: true } });
    expect(state.facts.archive_commit).toMatch(/^[a-f0-9]{40}$/);

    const completed = await api.completeDeliveryClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref });
    expect(completed).toMatchObject({ schema_version: "task-close-completed.v1", status: "completed", plan_hash: prepared.plan_hash });
    await expect(api.completeDeliveryClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref })).resolves.toEqual(completed);
  });

  it("prepares from an uncommitted worktree only when it matches the verified snapshot commit", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const parent = git(f.worktree, "rev-parse", `${f.taskCommit}^`);
    git(f.worktree, "reset", "--mixed", parent);
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    expect(prepared.plan.delivery.task_commit).toBe(f.taskCommit);

    writeFileSync(join(f.worktree, "dirty.txt"), "not committed\n");
    expect(() => api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) })).toThrow(/does not match.*snapshot/i);
  });

  it("publishes the plan-bound snapshot commit without changing verified worktree bytes", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const parent = git(f.worktree, "rev-parse", `${f.taskCommit}^`);
    git(f.worktree, "reset", "--mixed", parent);
    const before = readFileSync(join(f.worktree, "delivery.txt"), "utf8");
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    git(f.repo, "update-ref", "refs/heads/task/Demo/close-task", prepared.plan.delivery.task_commit, parent);
    git(f.worktree, "reset", "--mixed", prepared.plan.delivery.task_commit);
    expect(readFileSync(join(f.worktree, "delivery.txt"), "utf8")).toBe(before);
    expect(git(f.worktree, "status", "--porcelain")).toBe("");
    expect(git(f.worktree, "rev-parse", "HEAD")).toBe(f.taskCommit);
  });

  it("does not complete after a rejected close authorization", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "rejected" });
    await expect(api.completeDeliveryClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref })).resolves.toMatchObject({ status: "blocked", confirmationOutcome: "rejected" });
  });

  it("rejects an archive commit that changes the accepted spec blob", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    mkdirSync(join(f.worktree, "specs", "archive", "task"), { recursive: true });
    git(f.worktree, "mv", "specs/task/spec.md", "specs/archive/task/spec.md");
    writeFileSync(join(f.worktree, "specs", "archive", "task", "spec.md"), "tampered spec\n");
    git(f.worktree, "commit", "-qam", "archive tampered spec");
    finishCloseActions(f);
    const state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.facts).toMatchObject({ archive: false, archive_blob_preserved: false });
    await expect(api.completeDeliveryClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref })).rejects.toThrow(/archive/i);
  });

  it("rejects an archive commit that smuggles an unrelated file change", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    mkdirSync(join(f.worktree, "specs", "archive", "task"), { recursive: true });
    git(f.worktree, "mv", "specs/task/spec.md", "specs/archive/task/spec.md");
    writeFileSync(join(f.worktree, "smuggled.txt"), "unrelated\n");
    git(f.worktree, "add", ".");
    git(f.worktree, "commit", "-qm", "archive spec with unrelated change");
    finishCloseActions(f);
    const state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.facts).toMatchObject({ archive: false, archive_blob_preserved: true, archive_only_rename: false });
    await expect(api.completeDeliveryClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref })).rejects.toThrow(/archive/i);
  });

  it("provides the thin prepare, confirm, complete, and status CLI", () => {
    const f = fixture();
    const script = join(process.cwd(), "scripts", "task-close.mjs");
    const identity = [`--task-path=${f.task.taskPath}`, "--project=Demo", "--task=close-task"];
    const prepared = JSON.parse(execFileSync(process.execPath, [script, "prepare", ...identity,
      "--task-branch=task/Demo/close-task", "--target-branch=main", "--remote=origin", `--task-commit=${f.taskCommit}`,
      "--spec-source=specs/task/spec.md", "--spec-archive=specs/archive/task/spec.md"], { encoding: "utf8" }));
    expect(prepared.plan_hash).toMatch(/^[a-f0-9]{64}$/);
    const confirmed = JSON.parse(execFileSync(process.execPath, [script, "confirm", ...identity, `--plan-hash=${prepared.plan_hash}`, "--decision=confirmed"], { encoding: "utf8" }));
    expect(confirmed.ref).toContain(`/confirmations/${prepared.plan_hash}/`);
    const status = JSON.parse(execFileSync(process.execPath, [script, "status", ...identity, `--plan-hash=${prepared.plan_hash}`], { encoding: "utf8" }));
    expect(status).toMatchObject({ record_status: "not_completed", physical_state: { status: "incomplete" } });
  });
});
