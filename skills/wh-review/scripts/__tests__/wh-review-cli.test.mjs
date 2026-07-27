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
  it("exports the narrow legacy-root adoption operation with the normal review operations", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(typeof mod.adoptLegacyReviewRoot).toBe("function");
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

  it("uses the TaskKernel head when previous_result_ref is omitted and treats a supplied ref only as CAS", async () => {
    const { reviewFlowIdentity, resolveReviewFlowHead } = await import(cli.href);
    const identityKernel = {
      deriveReviewFlowIdentity: (subject) => ({ task_id: "task", workflow_run_id: "run-1", ...subject }),
    };
    const identity = reviewFlowIdentity({
      kernel: identityKernel, assertedWorkflowRunId: "run-1",
      stage: "build-spec", reviewTrack: null, phaseId: null,
    });
    expect(identity).toMatchObject({
      task_id: "task", workflow_run_id: "run-1", stage: "build-spec", review_track: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
    });
    expect(() => reviewFlowIdentity({
      kernel: identityKernel, assertedWorkflowRunId: "forged", stage: "build-spec",
    })).toThrow(/workflow_run_id|lineage/i);
    const phaseA = reviewFlowIdentity({
      kernel: identityKernel, stage: "build-code", phaseId: "phase-1", snapshotTree: "a".repeat(40),
    });
    const phaseB = reviewFlowIdentity({
      kernel: identityKernel, stage: "build-code", phaseId: "phase-1", snapshotTree: "b".repeat(40),
    });
    expect(phaseA.snapshot_tree).toBe("a".repeat(40));
    expect(phaseB.snapshot_tree).toBe("b".repeat(40));
    expect(phaseA).not.toEqual(phaseB);
    const ref = "reviews/results/current.json";
    const result = {
      version: "wh-review-result.v1", task_id: "task", stage: "build-spec",
      review_track: null, subject_kind: "worktree", phase_id: null,
      snapshot_tree: "a".repeat(40), verdict: "pass",
    };
    const task = {
      identity: { taskId: "task" },
      readRecord: () => `${JSON.stringify(result)}\n`,
    };
    const kernel = { readReviewFlow: () => ({ head_result_ref: ref }) };
    expect(resolveReviewFlowHead({ task, kernel, identity })).toMatchObject({
      flow: { head_result_ref: ref },
      prior: { result_ref: ref, verdict: "pass" },
    });
    const oldPhaseResult = { ...result, stage: "build-code", subject_kind: "phase", phase_id: "phase-1", review_scope: "phase" };
    const oldPhaseTask = { identity: { taskId: "task" }, readRecord: () => `${JSON.stringify(oldPhaseResult)}\n` };
    const newPhaseIdentity = { ...phaseB, review_track: null };
    expect(resolveReviewFlowHead({
      task: oldPhaseTask, kernel: { readReviewFlow: () => null }, identity: newPhaseIdentity,
      previousResultRef: ref,
    })).toMatchObject({ flow: null, prior: { result_ref: ref, snapshot_tree: "a".repeat(40) } });
    expect(() => resolveReviewFlowHead({
      task: oldPhaseTask, kernel: { readReviewFlow: () => null }, identity: phaseA,
      previousResultRef: ref,
    })).toThrow(/CAS failed/);
    expect(() => resolveReviewFlowHead({
      task, kernel, identity, previousResultRef: "reviews/results/stale.json",
    })).toThrow(/CAS|stale|head/i);
  });

  it("uses the simple runner and no V4 facade or legacy argv", () => {
    const source = readFileSync(cli, "utf8");
    expect(source).toContain('new Set(["run", "format-correct", "verify-final", "adopt-legacy-root"])');
    expect(source).toContain("ReviewProviderClient");
    expect(source).toContain("runReview");
    for (const forbidden of ["ReviewRoundFacade", "BrokerClient", "resetReviewFlow", "recoverReviewProjections", "run-heterologous", "--diff", "--output"]) expect(source).not.toContain(forbidden);
  });

  it("forbids caller-reported workflow identity during legacy adoption", async () => {
    const { adoptLegacyReviewRoot } = await import(cli.href);
    expect(() => adoptLegacyReviewRoot({
      workflow_run_id: "forged", result_ref: "reviews/results/root.json",
    })).toThrow(/workflow_run_id.*forbidden|TaskKernel derives/i);
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
      .toEqual({ round: "none", reason: "post_full_non_gate_recorded" });
  });

  it("uses the current flow budget instead of unrelated historical attempts", async () => {
    const { selectCanonicalReviewRound } = await import(cli.href);
    const prior = {
      version: "wh-review-result.v1", task_id: "task", stage: "build-spec",
      review_track: null, subject_kind: "worktree", phase_id: null,
      result_ref: "reviews/results/root.json", snapshot_tree: "a".repeat(40),
      verdict: "pass", adjudication: { clusters: [] },
    };
    const ledger = {
      version: "wh-review-response-ledger.v1",
      previous_result_ref: prior.result_ref,
      previous_snapshot_tree: prior.snapshot_tree,
      current_snapshot_tree: "b".repeat(40),
      change: {
        changed_dimensions: ["schema"], rationale: "changed the public schema",
        evidence_refs: ["evidence/schema.json"],
      },
      responses: [],
    };
    const task = {
      listCanonicalReviewResultRefs: () => { throw new Error("must not scan another workflow run"); },
    };
    expect(selectCanonicalReviewRound({
      task, stage: "build-spec",
      route: { mode: "full_on_structural_rework", initial: ["kimi/k3"] },
      previousResult: prior, ledger, currentSnapshotTree: ledger.current_snapshot_tree,
      flow: { structural_full_reviews: 0 },
    })).toEqual({ round: "full", reason: "structural_rework" });
  });

  it("treats a prior Phase PASS as lineage for a new snapshot, not as the new flow head", async () => {
    const { selectCanonicalReviewRound } = await import(cli.href);
    const prior = {
      subject_kind: "phase", phase_id: "phase-6", snapshot_tree: "a".repeat(40),
      verdict: "pass", result_ref: "reviews/results/prior-phase.json",
    };
    const route = { mode: "full_only", initial: ["pi/coding"] };
    expect(selectCanonicalReviewRound({
      task: {}, stage: "build-code", route, previousResult: prior,
      currentSnapshotTree: "b".repeat(40), flow: null, ledger: { version: "wh-review-response-ledger.v1" },
    })).toEqual({ round: "initial", reason: "first_review" });
    expect(selectCanonicalReviewRound({
      task: {}, stage: "build-code", route, previousResult: prior,
      currentSnapshotTree: prior.snapshot_tree, flow: { head_result_ref: prior.result_ref },
    })).toEqual({ round: "none", reason: "prior_result_passed" });
  });
});
