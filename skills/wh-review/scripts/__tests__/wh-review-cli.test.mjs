import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask, migrateTaskRunnerRoot } from "../../../../core/task-handle.mjs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function runnerBoundFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-runner-"))); roots.push(root);
  const repo = join(root, "repo"), runner = join(root, "runner"); mkdirSync(repo); mkdirSync(runner);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  execFileSync("git", ["init", "-q", "-b", "task/Demo/task"], { cwd: runner });
  writeFileSync(join(runner, "AGENTS.md"), "# Runner\n");
  mkdirSync(join(runner, "workflows", "make-decision"), { recursive: true });
  writeFileSync(join(runner, "workflows", "make-decision", "SKILL.md"), "# make-decision\n");
  execFileSync("git", ["add", "."], { cwd: runner });
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "runner"], { cwd: runner });
  const taskPath = join(root, "Projects", "Demo", "tasks", "task");
  const task = createTask({ storageRoot: root, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z",
    target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  migrateTaskRunnerRoot({ taskPath: task.taskPath, projectName: "Demo", taskId: "task", runnerRoot: realpathSync(runner), stage: "make-decision" });
  return { taskPath, repo, runner: realpathSync(runner) };
}

describe("wh-review production CLI", () => {
  it("exports only run and verify-final operations", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(mod.resetReviewFlow).toBeUndefined();
    expect(mod.recoverReviewProjections).toBeUndefined();
  });

  it("uses the simple runner and no V4 facade or legacy argv", () => {
    const source = readFileSync(cli, "utf8");
    expect(source).toContain('new Set(["run", "verify-final"])');
    expect(source).toContain("ReviewProviderClient");
    expect(source).toContain("runReview");
    for (const forbidden of ["ReviewRoundFacade", "BrokerClient", "resetReviewFlow", "recoverReviewProjections", "run-heterologous", "--diff", "--output"]) expect(source).not.toContain(forbidden);
  });

  it("requires an absolute task tracking root before loading host config", async () => {
    const { runReviewRound, verifyFinalReview } = await import(cli.href);
    await expect(runReviewRound({ task_tracking_root: "relative", task_id: "task" })).rejects.toThrow(/absolute/);
    expect(() => verifyFinalReview({ task_tracking_root: "relative", task_id: "task" })).toThrow(/absolute/);
  });

  it("reconstructs an authenticated make-decision CandidateWorkspace from the TaskHandle", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-decision-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "task");
    createTask({ storageRoot: root, taskPath, manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z",
      target_repo_root: repo, issue_ids: [], inputs: {},
    } });
    const { resolveTrustedReviewSubject } = await import(cli.href);
    const subject = resolveTrustedReviewSubject({ task_path: taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" });
    expect(subject.candidateWorkspace.worktreeRoot).toBe(`${repo}-task`);
    expect(subject.candidateWorkspace.targetRepoRoot).toBe(realpathSync(repo));
    expect(subject).not.toHaveProperty("sourceRoot");
    expect(subject).not.toHaveProperty("targetRepoRoot");
  });

  it("uses a runner-bound TaskHandle without exposing a public runner field", async () => {
    const fixture = runnerBoundFixture();
    const { resolveTrustedReviewSubject } = await import(cli.href);
    const subject = resolveTrustedReviewSubject({ task_path: fixture.taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" });
    expect(subject.candidateWorkspace.worktreeRoot).toBe(`${fixture.repo}-task`);
    expect(() => resolveTrustedReviewSubject({ task_path: fixture.taskPath, project_name: "Demo", task_id: "task", stage: "make-decision", runner_root: fixture.runner })).toThrow(/runner_root is forbidden/i);
  });

  it("fails loud when a manifest-bound runner HEAD drifts", async () => {
    const fixture = runnerBoundFixture();
    execFileSync("git", ["commit", "--allow-empty", "-qm", "runner drift"], { cwd: fixture.runner });
    const { resolveTrustedReviewSubject } = await import(cli.href);
    expect(() => resolveTrustedReviewSubject({ task_path: fixture.taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" })).toThrow(/runner identity mismatch/i);
  });

  it("accepts only phase_id as the phase scope selector", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff"]) {
      await expect(runReviewRound({ [field]: "forged", task_path: "/tmp/task", stage: "build-code" })).rejects.toThrow(/forbidden/);
    }
  });
});
