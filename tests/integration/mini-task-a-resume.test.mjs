import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import {
  authorizeAResumePlan,
  confirmAResumePlan,
  evaluateMiniTaskScope,
  prepareAResumePlan,
  resumeTaskA,
} from "../../skills/mini-task/scripts/mini-task-runner.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

describe("mini-task A resume RED contract", () => {
  it("requires the A resume seam to bind an A workspace and target OID", async () => {
    const module = await import("../../skills/mini-task/scripts/mini-task-runner.mjs");
    expect(module).toHaveProperty("resumeTaskA");
  });

  it("requires scope expansion to stop for an explicit user choice", async () => {
    const module = await import("../../skills/mini-task/scripts/mini-task-runner.mjs");
    expect(module).toHaveProperty("evaluateMiniTaskScope");
    expect(evaluateMiniTaskScope({ major_architecture: true }).status).toBe("paused");
    expect(evaluateMiniTaskScope({ major_architecture: true, user_requested: true })).toMatchObject({
      status: "paused",
      choices: ["shrink-mini-task", "create-ordinary-five-stage-task"],
    });
    expect(evaluateMiniTaskScope({ boundary_clear: false, user_requested: true }).status).toBe("suitable_with_risk");
  });

  it("commits A dirty progress, merges the frozen target OID, and records rerun evidence", async () => {
    const state = resumeFixture();
    const before = git(state.aWorktree, ["rev-parse", "HEAD"]);
    writeFileSync(join(state.aWorktree, "a-progress.txt"), "A progress\n");
    const plan = prepareAResumePlan({ task: state.task, kernel: state.kernel, targetOid: state.targetOid, originalStage: "build-plan" });
    const confirmation = confirmAResumePlan({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeAResumePlan({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    const result = await resumeTaskA({ task: state.task, kernel: state.kernel, plan: plan.plan, closeConfirmationRef: confirmation.ref });
    expect(result.status).toBe("completed");
    expect(result.next_action).toBe("rerun_original_stage");
    expect(git(state.aWorktree, ["rev-parse", "HEAD"])).not.toBe(before);
    expect(git(state.aWorktree, ["rev-parse", "HEAD^2"])).toBe(state.targetOid);
    expect(readFileSync(join(state.aWorktree, "a-progress.txt"), "utf8")).toContain("A progress");
    expect(readFileSync(join(state.aWorktree, "mini.txt"), "utf8")).toContain("mini target");
    expect(result.evidence_ref).toMatch(/^quality\/evidence\/mini-task-a-resume\/.*\.json$/);
    expect(result.revalidation).toMatchObject({ status: "pending", next_action: "rerun_original_stage" });

    const repeated = await resumeTaskA({ task: state.task, kernel: state.kernel, plan: plan.plan, closeConfirmationRef: confirmation.ref });
    expect(repeated).toMatchObject({
      status: "completed",
      idempotent: true,
      merge_commit_oid: result.merge_commit_oid,
      revalidation: { status: "pending", next_action: "rerun_original_stage" },
    });
  });

  it("aborts a conflicting A merge and leaves no MERGE_HEAD or false completion", async () => {
    const state = resumeFixture({ conflict: true });
    writeFileSync(join(state.aWorktree, "shared.txt"), "A conflicting progress\n");
    const plan = prepareAResumePlan({ task: state.task, kernel: state.kernel, targetOid: state.targetOid, originalStage: "build-plan" });
    const confirmation = confirmAResumePlan({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeAResumePlan({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    const result = await resumeTaskA({ task: state.task, kernel: state.kernel, plan: plan.plan, closeConfirmationRef: confirmation.ref });
    expect(result.status).toBe("blocked");
    expect(result.reason).toBe("merge_conflict");
    expect(git(state.aWorktree, ["rev-parse", "--verify", "MERGE_HEAD"], true).ok).toBe(false);
    expect(git(state.aWorktree, ["status", "--porcelain"])).toBe("");
    expect(readFileSync(join(state.aWorktree, "shared.txt"), "utf8")).toContain("A conflicting progress");
    expect(state.task.readRecord(result.evidence_ref)).toContain('"status": "blocked"');
  });

  it("does not invent a progress commit when A was clean before the merge", async () => {
    const state = resumeFixture({ clean: true });
    const plan = prepareAResumePlan({ task: state.task, kernel: state.kernel, targetOid: state.targetOid, originalStage: "build-plan" });
    expect(plan.plan.steps.map((step) => step.operation)).toEqual(["merge"]);
    const confirmation = confirmAResumePlan({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeAResumePlan({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    const result = await resumeTaskA({ task: state.task, kernel: state.kernel, plan: plan.plan, closeConfirmationRef: confirmation.ref });
    expect(result).toMatchObject({ status: "completed", progress_commit_oid: null });
  });
});

function git(cwd, args, allowFailure = false) {
  try { return String(execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
  catch (error) {
    if (!allowFailure) throw error;
    return { ok: false, stdout: String(error.stdout ?? "").trim(), stderr: String(error.stderr ?? "").trim() };
  }
}

function resumeFixture({ conflict = false, clean = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-mini-task-a-resume-")));
  roots.push(root);
  const repo = join(root, "repo"); mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]); git(repo, ["config", "user.name", "WorkflowHub Tests"]); git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "shared.txt"), "base\n"); git(repo, ["add", "shared.txt"]); git(repo, ["commit", "-qm", "base"]);
  const base = git(repo, ["rev-parse", "HEAD"]);
  const taskId = conflict ? "task-a-conflict" : "task-a-resume";
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId, created_at: "2026-08-04T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write" } });
  const candidate = prepareTaskWorkspace(task); const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\nA resume\n`);
  writeFileSync(join(repo, "mini.txt"), "mini target\n");
  if (conflict) writeFileSync(join(repo, "shared.txt"), "target conflicting change\n");
  git(repo, ["add", "."]); git(repo, ["commit", "-qm", "mini target"]);
  const targetOid = git(repo, ["rev-parse", "HEAD"]);
  if (clean) {
    git(candidate.worktreeRoot, ["add", "--all"]);
    git(candidate.worktreeRoot, ["commit", "-qm", "prepare clean A workspace"]);
  }
  const kernel = createTaskKernel(task, { workspace: openCurrentTaskWorkspace(task), artifacts });
  const aWorktree = openCurrentTaskWorkspace(task).worktreeRoot;
  return { root, repo, task, kernel, aWorktree, targetOid, base };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
