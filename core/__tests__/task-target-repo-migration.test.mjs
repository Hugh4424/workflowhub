import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask, migrateTaskTargetRepoRoot, openTask } from "../task-handle.mjs";
import { createTaskKernel } from "../../runtime/task/task-kernel.mjs";
import { bootstrapStage } from "../stage-context.mjs";
import { acceptStageAttempt, runStage } from "../stage-runner.mjs";
import { createTaskWorktreeRemoval, openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";
import { requiresHumanConfirmation } from "../../runtime/stage/stage-acceptance-policy.mjs";
import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";
import { runCapture as captureBuild } from "../../workflows/build-code/capture.mjs";
import { runCapture as captureVerify } from "../../workflows/verify-code/capture.mjs";

const roots = [];
const git = (cwd, args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
function publishDecision(kernel, facts) {
  const raw = "# Migration fixture decision\n";
  const decisionHash = createHash("sha256").update(raw).digest("hex");
  const decisionRef = `receipts/decision-log/${decisionHash}.md`;
  kernel.publishCanonicalRecord(decisionRef, raw);
  return kernel.publishAttempt("make-decision", {
    facts: { ...facts, decision_ref: decisionRef, decision_hash: decisionHash },
    missing_items: ["support:audit"],
  });
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-target-migration-"))); roots.push(root);
  const repo = join(root, "repo"), worktree = join(root, "task-worktree"), other = join(root, "other");
  mkdirSync(repo); mkdirSync(other);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo }); execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo }); execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  execFileSync("git", ["worktree", "add", "-qb", "task/Demo/migration", worktree, "main"], { cwd: repo });
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: other }); execFileSync("git", ["commit", "--allow-empty", "-qm", "other"], { cwd: other });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "migration", created_at: new Date().toISOString(), target_repo_root: worktree, issue_ids: [], inputs: {} } });
  const kernel = createTaskKernel(task), decision = publishDecision(kernel, { worktree_root: worktree, baseline_commit: git(repo, ["rev-parse", "main"]) }); kernel.acceptAttempt("make-decision", decision.attempt_ref, writeHumanConfirmation(kernel, "make-decision", decision));
  return { root, repo, worktree, other, task };
}

function acceptedWorkspaceFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-migrated-workspace-"))); roots.push(root);
  const repo = join(root, "repo"), source = join(root, "generation-two");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo }); execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo }); execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  execFileSync("git", ["worktree", "add", "-qb", "generation-two", source, "main"], { cwd: repo });
  mkdirSync(join(source, "specs", "migration"), { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(source, "specs", "migration", name), name === "decision-log.md"
      ? "# Migration fixture decision\n" : `# ${name}\n`);
  }
  execFileSync("git", ["add", "."], { cwd: source });
  execFileSync("git", ["commit", "-qm", "seed current task materials"], { cwd: source });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "migration", created_at: new Date().toISOString(), target_repo_root: source, issue_ids: [], inputs: {} } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const attempt = publishDecision(kernel, { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit });
  kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
  return { repo, source, task, candidate };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("target repository migration", () => {
  it("rejects invalid and unrelated targets without changing the manifest", () => {
    const f = fixture(), before = f.task.readRecord("task.json");
    expect(() => migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: join(f.root, "plain"), targetBranch: "main" })).toThrow();
    expect(() => migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.other, targetBranch: "main" })).toThrow(/common directory/i);
    expect(f.task.readRecord("task.json")).toBe(before);
  });

  it("keeps the old manifest after a failed atomic replace and replays the same lineage", () => {
    const f = fixture(), before = f.task.readRecord("task.json");
    expect(() => migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main", testHooks: { beforeManifestReplace() { throw new Error("simulated migration crash"); } } })).toThrow(/simulated migration crash/);
    expect(f.task.readRecord("task.json")).toBe(before);
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    expect(openTask(f.task.taskPath, { projectName: "Demo", taskId: "migration" }).manifest.target_repo_root).toBe(f.repo);
    expect(migrated.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("opens the accepted Workspace after migration and rejects premature build-code", async () => {
    const f = acceptedWorkspaceFixture();
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });

    const contexts = {};
    for (const stage of ["make-decision", "build-spec", "build-plan", "verify-code"]) {
      const context = bootstrapStage(stage, { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" });
      contexts[stage] = context;
      expect(context.manifest.target_repo_root).toBe(f.repo);
      if (stage !== "make-decision") expect(context.workspace.worktreeRoot).toBe(f.candidate.worktreeRoot);
    }
    expect(() => bootstrapStage("build-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" })).not.toThrow();
    const snapshotHead = git(f.candidate.worktreeRoot, ["rev-parse", "HEAD"]);
    const snapshotTree = git(f.candidate.worktreeRoot, ["rev-parse", "HEAD^{tree}"]);
    expect(await captureBuild("true", "receipts/migrated-build.json", { workspace: contexts["verify-code"].workspace, task: contexts["verify-code"].task })).toMatchObject({ snapshot_head: snapshotHead, snapshot_tree: snapshotTree });
    expect(await captureVerify("true", "receipts/migrated-verify.json", { workspace: contexts["verify-code"].workspace, task: contexts["verify-code"].task })).toMatchObject({ snapshot_head: snapshotHead, snapshot_tree: snapshotTree });
    expect(() => openAcceptedWorkspace(migrated.task, { facts: {
      worktree_root: `${f.repo}-migration`, baseline_commit: f.candidate.baselineCommit,
    } })).toThrow(/does not match the deterministic task worktree/i);
  });

  it("publishes an authenticated verify failure through the migrated five-stage chain", async () => {
    const f = acceptedWorkspaceFixture();
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    const hash = "a".repeat(64);
    const tree = git(f.candidate.worktreeRoot, ["rev-parse", "HEAD^{tree}"]);
    const acceptanceCoverage = { snapshot_tree: tree, accepted_criterion_ids: ["AC-005"], items: [{ acceptance_criterion_id: "AC-005", status: "unknown", evidence_refs: [] }] };
    const testFacts = (label) => ({ command: "npm test", exit_code: 0, command_hash: hash, snapshot_head: f.candidate.baselineCommit, snapshot_tree: tree, snapshot_commit: "b".repeat(40), started_at: "2026-07-18T00:00:00.000Z", completed_at: "2026-07-18T00:00:01.000Z", receipt_ref: `evidence/${label}-receipt.json`, receipt_hash: hash, output_ref: `evidence/${label}-output.txt`, output_hash: hash });
    const review = (verdict) => ({ verdict, result_ref: "reviews/results/review.json", result_hash: hash, snapshot_tree: tree });
    const context = (stage) => bootstrapStage(stage, { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" });
    const publishAndAccept = async (stage, handler) => {
      if (stage === "build-spec") {
        const runKernel = createTaskKernel(migrated.task);
        if (runKernel.activeStageRun(stage, { required: false }) === null) {
          runKernel.startStageRun(stage, { reason: "legacy target migration fixture publication" });
        }
      }
      const stageContext = context(stage);
      const result = await runStage(stage, stageContext, async (...args) => {
        const value = await handler(...args);
        return { ...value, missing_items: [...new Set([...(value.missing_items ?? []), "support:audit"])] };
      });
      const request = { attemptRef: result.attempt_ref };
      if (requiresHumanConfirmation(stage)) request.humanConfirmationRef = writeHumanConfirmation(stageContext.kernel, stage, result);
      acceptStageAttempt(stage, stageContext, request);
      return result;
    };

    await publishAndAccept("build-spec", async (worker) => { worker.artifacts.writeAtomic("spec.md", "spec\n"); return { facts: { spec_ref: "specs/migration/spec.md", checkpoint: worker.createCheckpoint("build-spec") } }; });
    await publishAndAccept("build-plan", async (worker) => { worker.artifacts.writeAtomic("plan.md", "plan\n"); worker.artifacts.writeAtomic("tasks.md", "tasks\n"); return { facts: { plan_ref: "specs/migration/plan.md", tasks_ref: "specs/migration/tasks.md", checkpoint: worker.createCheckpoint("build-plan") } }; });
    await publishAndAccept("build-code", async () => ({ facts: {
      changed: [], tests: testFacts("build"), review: review("pass"),
      phase_completion: {
        status: "completed",
        evidence_ref: "specs/migration/tasks.md",
        evidence_hash: createHash("sha256").update("# tasks.md\n").digest("hex"),
        integration_review: { ref: "reviews/results/review.json", sha256: hash },
        formal_record_status: { status: "unavailable", reason: "migration fixture has no Phase history" },
      },
      acceptance_coverage: acceptanceCoverage,
    } }));

    const verifyContext = context("verify-code");
    const failureDetail = "AC-005 failed\n";
    verifyContext.kernel.publishCanonicalRecord("evidence/acceptance-ac-005.txt", failureDetail);
    const failureRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-005", result: "fail", refs: [{ ref: "evidence/acceptance-ac-005.txt", sha256: createHash("sha256").update(failureDetail).digest("hex") }] }, null, 2)}\n`;
    verifyContext.kernel.publishCanonicalRecord("evidence/acceptance-ac-005.json", failureRaw);
    const failed = await runStage("verify-code", verifyContext, async () => ({
      facts: { tests: testFacts("verify"), review: review("fail"), evidence_refs: [{ ref: "evidence/acceptance-ac-005.json", sha256: createHash("sha256").update(failureRaw).digest("hex") }] },
      missing_items: ["support:audit"],
    }));

    expect(JSON.parse(migrated.task.readRecord(`results/verify-code/${failed.attempt_ref}`))).toMatchObject({ facts: { review: { verdict: "fail" }, evidence_refs: [{ ref: "evidence/acceptance-ac-005.json" }] } });
    expect(verifyContext.workspace.worktreeRoot).toBe(f.candidate.worktreeRoot);
  });

  it("uses the accepted legacy Workspace for close removal after migration", async () => {
    const f = acceptedWorkspaceFixture();
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    const legacyRoot = f.candidate.worktreeRoot;
    const removal = createTaskWorktreeRemoval(migrated.task, { taskId: "migration", stage: "make-decision", worktreeRoot: legacyRoot, baselineCommit: f.candidate.baselineCommit });

    expect(removal.probe()).toMatchObject({ satisfied: false, worktree_root: legacyRoot });
    await removal.execute();
    expect(removal.probe()).toMatchObject({ satisfied: true, worktree_root: legacyRoot });
    expect(existsSync(legacyRoot)).toBe(false);
  });

  it("fails loud when the migrated accepted Workspace branch or registration changes", () => {
    const f = acceptedWorkspaceFixture();
    migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    const legacyRoot = f.candidate.worktreeRoot;
    execFileSync("git", ["switch", "-q", "-c", "other"], { cwd: legacyRoot });

    expect(() => bootstrapStage("build-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" })).toThrow(/branch|registration/i);

    execFileSync("git", ["worktree", "remove", "--force", legacyRoot], { cwd: f.repo });
    expect(() => bootstrapStage("verify-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" })).toThrow(/accepted worktree_root|ENOENT|registration/i);
  });

  it("fails closed when migration lineage is corrupted", () => {
    const f = acceptedWorkspaceFixture();
    const migrated = migrateTaskTargetRepoRoot({ taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration", targetRepoRoot: f.repo, targetBranch: "main" });
    writeFileSync(join(f.task.taskPath, migrated.migration_ref), "{\"schema_version\":\"forged\"}\n");

    expect(() => bootstrapStage("build-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "Demo", taskId: "migration" })).toThrow(/migration integrity hash mismatch/i);
    expect(() => openAcceptedWorkspace(migrated.task, { facts: { worktree_root: f.candidate.worktreeRoot, baseline_commit: f.candidate.baselineCommit } })).toThrow(/migration integrity hash mismatch/i);
    expect(() => createTaskWorktreeRemoval(migrated.task, { taskId: "migration", stage: "make-decision", worktreeRoot: f.candidate.worktreeRoot, baselineCommit: f.candidate.baselineCommit })).toThrow(/migration integrity hash mismatch/i);
  });
});
