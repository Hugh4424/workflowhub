import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createTask, migrateTaskTargetRepoRoot } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const roots = [];
const git = (cwd, ...args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();

function fixture({ targetRepo = "main" } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-delivery-close-")));
  roots.push(root);
  const remote = join(root, "remote.git");
  const repo = join(root, "repo");
  const source = `${repo}-generation-two`;
  const worktree = targetRepo === "worktree" ? `${source}-close-task` : `${repo}-close-task`;
  execFileSync("git", ["init", "--bare", "-q", remote]);
  execFileSync("git", ["init", "-q", "-b", "main", repo]);
  git(repo, "config", "user.email", "test@example.com");
  git(repo, "config", "user.name", "Test");
  git(repo, "remote", "add", "origin", remote);
  mkdirSync(join(repo, "specs", "task"), { recursive: true });
  mkdirSync(join(repo, "specs", "archive"), { recursive: true });
  writeFileSync(join(repo, "specs", "archive", ".gitkeep"), "");
  writeFileSync(join(repo, "specs", "task", "spec.md"), "accepted spec\n");
  writeFileSync(join(repo, "specs", "task", "plan.md"), "accepted plan\n");
  mkdirSync(join(repo, "specs", "task", "notes"));
  writeFileSync(join(repo, "specs", "task", "notes", "review.md"), "accepted review\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "base");
  git(repo, "push", "-q", "-u", "origin", "main");
  if (targetRepo === "worktree") git(repo, "worktree", "add", "-qb", "generation-two", source, "main");
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
      target_repo_root: targetRepo === "worktree" ? source : repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const kernel = createTaskKernel(task);
  const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: worktree, baseline_commit: git(repo, "rev-parse", "main") } });
  kernel.acceptAttempt("make-decision", decision.attempt_ref, writeHumanConfirmation(kernel, "make-decision", decision));
  return { root, remote, repo, source, worktree, taskCommit, task, kernel };
}

function delivery(f) {
  return {
    task_branch: "task/Demo/close-task",
    target_branch: "main",
    remote: "origin",
    task_commit: f.taskCommit,
    spec_source_path: "specs/task",
    spec_archive_path: "specs/archive/task",
  };
}

function archive(f) {
  git(f.worktree, "mv", "specs/task", "specs/archive/task");
  git(f.worktree, "commit", "-qm", "archive spec");
}

function finishCloseActions(f) {
  git(f.repo, "merge", "--no-edit", "task/Demo/close-task");
  git(f.repo, "push", "-q", "origin", "main");
  git(f.repo, "worktree", "remove", f.worktree);
  git(f.repo, "branch", "-d", "task/Demo/close-task");
}

function advanceRemote(f) {
  const competitor = join(f.root, `competitor-${Date.now()}-${Math.random()}`);
  execFileSync("git", ["clone", "-q", f.remote, competitor]);
  git(competitor, "config", "user.email", "other@example.com");
  git(competitor, "config", "user.name", "Other");
  git(competitor, "commit", "--allow-empty", "-qm", "remote advance");
  git(competitor, "push", "-q", "origin", "main");
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("delivery close verifier", () => {
  it("migrates an authenticated task target from its worktree to the checked-out main repository before close preparation", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture({ targetRepo: "worktree" });
    expect(() => api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) })).toThrow(/target branch|checked out/i);
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "close-task", targetRepoRoot: f.repo, targetBranch: "main" });
    const kernel = createTaskKernel(migrated.task);
    expect(migrated.task.manifest.target_repo_root).toBe(f.repo);
    expect(migrated.task.readRecord(migrated.migration_ref)).toContain("task-target-repo-root-migration.v1");
    const verifyContext = bootstrapStage("verify-code", { mode: "sidecar", taskPath: migrated.task.taskPath, projectName: "Demo", taskId: "close-task" });
    expect(verifyContext.workspace.worktreeRoot).toBe(f.worktree);
    expect(api.prepareDeliveryClosePlan({ task: migrated.task, kernel, delivery: delivery(f) }).plan.delivery.target_repo_root).toBe(f.repo);
    expect(migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "close-task", targetRepoRoot: f.repo, targetBranch: "main" })).toMatchObject({ idempotent_replay: true });
  });

  it("keeps fetch out of both the core executor and verifier instructions", () => {
    const core = readFileSync(join(process.cwd(), "core", "task-close.mjs"), "utf8");
    const skill = readFileSync(join(process.cwd(), "workflows", "verify-code", "SKILL.md"), "utf8");
    expect(core).not.toMatch(/\[\s*["']fetch["']/);
    expect(skill).not.toMatch(/git fetch/i);
    expect(skill).toMatch(/task-close\.mjs execute[\s\S]*Do not issue the six Git operations by hand/i);
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

  it("freezes deterministic local and remote baselines and rejects an unsafe target checkout", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const first = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const second = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    expect(second.plan_hash).toBe(first.plan_hash);
    expect(first.plan.delivery).toMatchObject({
      target_baseline: git(f.repo, "rev-parse", "main"),
      remote_target_baseline: git(f.repo, "rev-parse", "main"),
      merge_strategy: "--no-ff --no-edit",
    });
    writeFileSync(join(f.repo, "dirty.txt"), "dirty\n");
    expect(() => api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) })).toThrow(/clean|dirty/i);
    rmSync(join(f.repo, "dirty.txt"));
    git(f.repo, "switch", "--detach", "HEAD");
    expect(() => api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) })).toThrow(/target branch|checked out/i);
  });

  it("rejects a task branch that is not the accepted Workspace branch", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    git(f.repo, "branch", "wrong-task", f.taskCommit);
    expect(() => api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: { ...delivery(f), task_branch: "wrong-task" } })).toThrow(/accepted Workspace|task branch/i);
    expect(git(f.repo, "rev-parse", "main")).toBe(git(f.repo, "rev-parse", "origin/main"));
  });

  it("executes the six fixed delivery steps and reconciles a second run", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    const executors = api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    const result = await api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors });
    expect(result).toMatchObject({ status: "completed", physical_state: { archive: true, merge: true, push: true, worktree_cleanup: true, branch_cleanup: true } });
    expect(existsSync(f.worktree)).toBe(false);
    expect(git(f.repo, "rev-parse", "main")).toBe(git(f.repo, "ls-remote", "origin", "refs/heads/main").split(/\s+/)[0]);
    expect(git(f.repo, "rev-list", "--parents", "-n", "1", "main").split(" ")).toHaveLength(3);
    await expect(api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) })).resolves.toEqual(result);
  });

  it.each([1, 2, 3, 4, 5, 6])("reconciles when %i physical steps finish before their records", async (count) => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    const first = api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    for (const step of prepared.plan.steps.slice(0, count)) await first.executorFor(step).execute(step, {});
    const result = await api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) });
    expect(result.status).toBe("completed");
    for (const step of prepared.plan.steps) {
      const record = JSON.parse(f.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`));
      expect(record).toMatchObject({ status: "completed", step_id: step.step_id });
    }
  });

  it("recovers after update-ref but before worktree reset", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const parent = git(f.worktree, "rev-parse", `${f.taskCommit}^`);
    git(f.worktree, "reset", "--mixed", parent);
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    git(f.repo, "update-ref", "refs/heads/task/Demo/close-task", f.taskCommit, parent);
    const result = await api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) });
    expect(result.status).toBe("completed");
  });

  it("recovers after git mv but before the archive commit", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    git(f.worktree, "mv", "specs/task", "specs/archive/task");
    const result = await api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) });
    expect(result.status).toBe("completed");
  });

  it("stops before the first write when the remote baseline advances after prepare", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const before = git(f.repo, "rev-parse", "task/Demo/close-task");
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    advanceRemote(f);
    await expect(api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) })).rejects.toThrow(/remote target baseline changed/i);
    expect(git(f.repo, "rev-parse", "task/Demo/close-task")).toBe(before);
  });

  it("stops after merge when the remote advances before push", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    const executors = api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    for (const step of prepared.plan.steps.slice(0, 3)) await executors.executorFor(step).execute(step, {});
    advanceRemote(f);
    await expect(api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) })).rejects.toThrow(/remote target baseline changed/i);
    expect(existsSync(f.worktree)).toBe(true);
    expect(api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan }).missing).toEqual(expect.arrayContaining(["push", "worktree_cleanup", "branch_cleanup"]));
  });

  it("stops on merge conflict and leaves push and cleanup unfinished in status", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    writeFileSync(join(f.worktree, "specs", "task", "spec.md"), "task version\n");
    git(f.worktree, "commit", "-qam", "task changes spec");
    f.taskCommit = git(f.worktree, "rev-parse", "HEAD");
    writeFileSync(join(f.repo, "specs", "task", "spec.md"), "target version\n");
    git(f.repo, "commit", "-qam", "target changes spec");
    git(f.repo, "push", "-q", "origin", "main");
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    await expect(api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) })).rejects.toThrow(/conflict|merge|command failed/i);
    expect(existsSync(f.worktree)).toBe(true);
    expect(git(f.repo, "show-ref", "--verify", "refs/heads/task/Demo/close-task")).toContain("refs/heads/task/Demo/close-task");
    const state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.missing).toEqual(expect.arrayContaining(["delivery", "archive", "merge", "push", "worktree_cleanup", "branch_cleanup"]));
  });

  it("stops on a rejected push and leaves cleanup unfinished in status", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    const hook = join(f.remote, "hooks", "pre-receive");
    writeFileSync(hook, "#!/bin/sh\nexit 1\n");
    chmodSync(hook, 0o755);
    await expect(api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) })).rejects.toThrow(/push|command failed/i);
    expect(existsSync(f.worktree)).toBe(true);
    const state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.facts).toMatchObject({ merge: true, push: false, worktree_cleanup: false, branch_cleanup: false });
    expect(state.missing).toEqual(expect.arrayContaining(["push", "worktree_cleanup", "branch_cleanup"]));
  });

  it("stops before archive when the target becomes dirty after prepare", async () => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome: "confirmed" });
    writeFileSync(join(f.repo, "dirty-after-prepare.txt"), "dirty\n");
    await expect(api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) })).rejects.toThrow(/clean|dirty/i);
    expect(existsSync(f.worktree)).toBe(true);
    expect(existsSync(join(f.worktree, "specs", "task"))).toBe(true);
    const state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.missing).toEqual(expect.arrayContaining(["archive", "merge", "push", "worktree_cleanup", "branch_cleanup"]));
  });

  it.each(["rejected", "timeout"])("performs no Git writes after a %s close decision", async (outcome) => {
    const api = await import("../core/task-close.mjs");
    const f = fixture();
    const prepared = api.prepareDeliveryClosePlan({ task: f.task, kernel: f.kernel, delivery: delivery(f) });
    const before = { task: git(f.repo, "rev-parse", "task/Demo/close-task"), target: git(f.repo, "rev-parse", "main"), remote: git(f.repo, "ls-remote", "origin", "refs/heads/main") };
    const confirmation = api.confirmClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, outcome });
    const result = await api.executeClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref, executors: api.createDeliveryCloseExecutorRegistry({ task: f.task, kernel: f.kernel, plan: prepared.plan }) });
    expect(result).toMatchObject({ status: "blocked", confirmationOutcome: outcome });
    expect({ task: git(f.repo, "rev-parse", "task/Demo/close-task"), target: git(f.repo, "rev-parse", "main"), remote: git(f.repo, "ls-remote", "origin", "refs/heads/main") }).toEqual(before);
    expect(existsSync(f.worktree)).toBe(true);
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
    git(f.worktree, "mv", "specs/task", "specs/archive/task");
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
    git(f.worktree, "mv", "specs/task", "specs/archive/task");
    writeFileSync(join(f.worktree, "smuggled.txt"), "unrelated\n");
    git(f.worktree, "add", ".");
    git(f.worktree, "commit", "-qm", "archive spec with unrelated change");
    finishCloseActions(f);
    const state = api.inspectDeliveryCloseState({ task: f.task, kernel: f.kernel, plan: prepared.plan });
    expect(state.facts).toMatchObject({ archive: false, archive_blob_preserved: true, archive_only_rename: false });
    await expect(api.completeDeliveryClosePlan({ task: f.task, kernel: f.kernel, plan: prepared.plan, closeConfirmationRef: confirmation.ref })).rejects.toThrow(/archive/i);
  });

  it("provides the thin prepare, confirm, execute, and status CLI", () => {
    const f = fixture();
    const script = join(process.cwd(), "scripts", "task-close.mjs");
    const identity = [`--task-path=${f.task.taskPath}`, "--project=Demo", "--task=close-task"];
    const prepared = JSON.parse(execFileSync(process.execPath, [script, "prepare", ...identity,
      "--task-branch=task/Demo/close-task", "--target-branch=main", "--remote=origin", `--task-commit=${f.taskCommit}`,
      "--spec-source=specs/task", "--spec-archive=specs/archive/task"], { encoding: "utf8" }));
    expect(prepared.plan_hash).toMatch(/^[a-f0-9]{64}$/);
    const confirmed = JSON.parse(execFileSync(process.execPath, [script, "confirm", ...identity, `--plan-hash=${prepared.plan_hash}`, "--decision=confirmed"], { encoding: "utf8" }));
    expect(confirmed.ref).toContain(`/confirmations/${prepared.plan_hash}/`);
    const executed = JSON.parse(execFileSync(process.execPath, [script, "execute", ...identity, `--plan-hash=${prepared.plan_hash}`, `--confirmation-ref=${confirmed.ref}`], { encoding: "utf8" }));
    expect(executed).toMatchObject({ status: "completed", physical_state: { archive: true, push: true, branch_cleanup: true } });
    const status = JSON.parse(execFileSync(process.execPath, [script, "status", ...identity, `--plan-hash=${prepared.plan_hash}`], { encoding: "utf8" }));
    expect(status).toMatchObject({ record_status: "completed", physical_state: { status: "ready" } });
  });
});
