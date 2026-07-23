import { afterEach, describe, expect, it } from "vitest";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createTask, migrateTaskRunnerRoot } from "../../../../core/task-handle.mjs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

async function runnerBoundFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-runner-"))); roots.push(root);
  const repo = join(root, "repo"), runner = join(root, "runner"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  execFileSync("git", ["clone", "-q", "--no-local", realpathSync(join(import.meta.dirname, "../../../..")), runner]);
  execFileSync("git", ["checkout", "-qb", "task/Demo/task"], { cwd: runner });
  cpSync(realpathSync(join(import.meta.dirname, "../../../..", "core")), join(runner, "core"), { recursive: true, force: true });
  cpSync(realpathSync(join(import.meta.dirname, "../..")), join(runner, "skills", "wh-review"), { recursive: true, force: true });
  symlinkSync(realpathSync(join(import.meta.dirname, "../../../..", "node_modules")), join(runner, "node_modules"));
  execFileSync("git", ["add", "core", "skills/wh-review"], { cwd: runner });
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "runner"], { cwd: runner });
  const taskPath = join(root, "Projects", "Demo", "tasks", "task");
  const task = createTask({ storageRoot: root, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z",
    target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  migrateTaskRunnerRoot({ taskPath: task.taskPath, projectName: "Demo", taskId: "task", runnerRoot: realpathSync(runner), stage: "make-decision" });
  const module = await import(`${pathToFileURL(join(runner, "skills", "wh-review", "scripts", "wh-review-cli.mjs")).href}?fixture=${Date.now()}`);
  return { taskPath, repo, runner: realpathSync(runner), module };
}

describe("wh-review production CLI", () => {
  it("exports only run and verify-final operations", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(typeof mod.providerVisibleMaterialsForRound).toBe("function");
    expect(mod.resetReviewFlow).toBeUndefined();
    expect(mod.recoverReviewProjections).toBeUndefined();
  });

  it("never sends a response ledger to a fresh full review", async () => {
    const { providerVisibleMaterialsForRound } = await import(cli.href);
    const materials = {
      draft_spec: "spec.md",
      response_ledger: { version: "wh-review-response-ledger.v1" },
    };
    expect(providerVisibleMaterialsForRound({ materials, round: "full" })).toEqual({ draft_spec: "spec.md" });
    expect(providerVisibleMaterialsForRound({ materials, round: "initial" })).toEqual({ draft_spec: "spec.md" });
    expect(providerVisibleMaterialsForRound({ materials, round: "closure", previousResult: {
      result_ref: "reviews/results/prior.json", snapshot_tree: "a".repeat(40), adjudication: { clusters: [] },
    } })).toMatchObject({ draft_spec: "spec.md", response_ledger: materials.response_ledger, previous_review: { result_ref: "reviews/results/prior.json" } });
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
    const fixture = await runnerBoundFixture();
    const { resolveTrustedReviewSubject } = fixture.module;
    const subject = resolveTrustedReviewSubject({ task_path: fixture.taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" });
    expect(subject.candidateWorkspace.worktreeRoot).toBe(`${fixture.repo}-task`);
    expect(() => resolveTrustedReviewSubject({ task_path: fixture.taskPath, project_name: "Demo", task_id: "task", stage: "make-decision", runner_root: fixture.runner })).toThrow(/runner_root is forbidden/i);
  });

  it("fails loud when a manifest-bound runner HEAD drifts", async () => {
    const fixture = await runnerBoundFixture();
    execFileSync("git", ["commit", "--allow-empty", "-qm", "runner drift"], { cwd: fixture.runner });
    const { resolveTrustedReviewSubject } = fixture.module;
    expect(() => resolveTrustedReviewSubject({ task_path: fixture.taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" })).toThrow(/runner identity mismatch/i);
  });

  it("accepts only phase_id as the phase scope selector", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff", "review_scope", "reviewScope"]) {
      await expect(runReviewRound({ [field]: "forged", task_path: "/tmp/task", stage: "build-code" })).rejects.toThrow(/forbidden|derived/);
    }
  });

  it("forbids caller-selected providers before opening the task", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["providers", "provider_allowlist", "providerAllowlist"]) {
      await expect(runReviewRound({ [field]: ["claude-code"], task_path: "/tmp/task", stage: "build-code" })).rejects.toThrow(/provider.*forbidden|configured 3rd-review/i);
    }
  });

  it("keeps closure failures and build-code no-progress counters inside one canonical chain", async () => {
    const { closureFailureCount } = await import(cli.href);
    const refs = {
      "reviews/results/root.json": {
        version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-1",
        snapshot_tree: "a".repeat(40), verdict: "revise_required", adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
        attempt_ref: "reviews/attempts/root/attempt.json",
      },
      "reviews/results/no-progress-1.json": {
        version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-1",
        snapshot_tree: "b".repeat(40), verdict: "revise_required", adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
        review_chain: { round: "full", parent_result_ref: "reviews/results/root.json", root_result_ref: "reviews/results/root.json" },
        attempt_ref: "reviews/attempts/no-progress-1/attempt.json",
      },
      "reviews/results/no-progress-2.json": {
        version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-1",
        snapshot_tree: "c".repeat(40), verdict: "revise_required", adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
        review_chain: { round: "full", parent_result_ref: "reviews/results/no-progress-1.json", root_result_ref: "reviews/results/root.json" },
        attempt_ref: "reviews/attempts/no-progress-2/attempt.json",
      },
      "reviews/results/other-chain.json": {
        version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-1",
        snapshot_tree: "d".repeat(40), verdict: "revise_required", adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
        review_chain: { round: "closure", parent_result_ref: "reviews/results/other-root.json", root_result_ref: "reviews/results/other-root.json" },
        attempt_ref: "reviews/attempts/other/attempt.json",
      },
      "reviews/results/closure-1.json": {
        version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-1",
        snapshot_tree: "b".repeat(40), verdict: "revise_required", adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
        review_chain: { round: "closure", parent_result_ref: "reviews/results/root.json", root_result_ref: "reviews/results/root.json" },
        attempt_ref: "reviews/attempts/closure-1/attempt.json",
      },
      "reviews/results/closure-2.json": {
        version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-1",
        snapshot_tree: "c".repeat(40), verdict: "revise_required", adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
        review_chain: { round: "closure", parent_result_ref: "reviews/results/closure-1.json", root_result_ref: "reviews/results/root.json" },
        attempt_ref: "reviews/attempts/closure-2/attempt.json",
      },
      "reviews/attempts/other/attempt.json": { review_policy: { round: "closure" } },
      "reviews/attempts/root/attempt.json": { review_policy: { round: "initial" } },
      "reviews/attempts/no-progress-1/attempt.json": { review_policy: { round: "full" } },
      "reviews/attempts/no-progress-2/attempt.json": { review_policy: { round: "full" } },
      "reviews/attempts/closure-1/attempt.json": { review_policy: { round: "closure" } },
      "reviews/attempts/closure-2/attempt.json": { review_policy: { round: "closure" } },
    };
    const task = {
      identity: { taskId: "task" },
      listCanonicalReviewResultRefs: () => Object.keys(refs).filter((ref) => ref.startsWith("reviews/results/")),
      readRecord: (ref) => JSON.stringify(refs[ref]),
    };
    const prior = { ...refs["reviews/results/no-progress-2.json"], result_ref: "reviews/results/no-progress-2.json" };
    expect(closureFailureCount(task, "build-code", null, prior)).toBe(2);
  });

  it("does not dispatch a second structural full review when an old previous ref has an immutable full attempt", async () => {
    const { selectCanonicalReviewRound, structuralFullAlreadyRecorded } = await import(cli.href);
    const rootRef = "reviews/results/root.json";
    const root = {
      version: "wh-review-result.v1", task_id: "task", stage: "build-spec", review_track: null,
      subject_kind: "worktree", phase_id: null, result_ref: rootRef, snapshot_tree: "a".repeat(40), verdict: "revise_required",
      adjudication: { clusters: [{ id: "F-123456789abc", disposition: "actionable" }] },
    };
    const fullRef = "reviews/results/structural-full.json";
    const records = {
      [rootRef]: root,
      [fullRef]: {
        ...root, snapshot_tree: "b".repeat(40),
        review_chain: { round: "full", parent_result_ref: rootRef, root_result_ref: rootRef },
      },
      "reviews/attempts/structural-full/attempt.json": {
        ...root, snapshot_tree: "b".repeat(40),
        review_chain: { round: "full", parent_result_ref: rootRef, root_result_ref: rootRef },
      },
    };
    const task = {
      listCanonicalReviewResultRefs: () => [rootRef, fullRef],
      listCanonicalReviewAttemptRefs: () => ["reviews/attempts/structural-full/attempt.json"],
      readRecord: (ref) => JSON.stringify(records[ref]),
    };
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: rootRef,
      previous_snapshot_tree: root.snapshot_tree, current_snapshot_tree: "b".repeat(40),
      responses: [{ finding_id: "F-123456789abc", status: "fixed", rationale: "structural schema rework", changed_dimensions: ["schema"], evidence_refs: ["evidence/fix.json"] }],
    };
    expect(structuralFullAlreadyRecorded(task, root)).toBe(true);
    expect(selectCanonicalReviewRound({ task, stage: "build-spec", route: { mode: "full_on_structural_rework", initial: ["kimi/k3"] }, previousResult: root, ledger, currentSnapshotTree: ledger.current_snapshot_tree }))
      .toEqual({ round: "none", reason: "structural_rework_already_reviewed" });
  });
});
