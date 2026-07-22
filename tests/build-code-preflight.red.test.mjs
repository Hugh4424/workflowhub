import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../core/artifact-dir.mjs";
import { writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../core/workspace.mjs";

const roots = [];

function confirm(kernel, stage, attemptRef) {
  return kernel.confirmAttempt(stage, attemptRef, "accepted").ref;
}

function acceptedDesignFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-build-code-preflight-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "base\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "base"], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "build-code-preflight",
    created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task);
  const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit, snapshot_tree: candidate.captureSnapshot().tree } });
  kernel.acceptAttempt("make-decision", decision.attempt_ref, confirm(kernel, "make-decision", decision.attempt_ref));
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const bound = createTaskKernel(task, { workspace, artifacts });
  artifacts.writeAtomic("spec.md", "# Feature\n\n- AC-101: accepted behavior\n");
  const specCheckpoint = bound.createCheckpoint("build-spec");
  const specAttempt = bound.publishAttempt("build-spec", {
    facts: { spec_ref: artifacts.reference("spec.md"), checkpoint: specCheckpoint },
    upstream_refs: [{ task_id: task.identity.taskId, stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
  });
  bound.acceptAttempt("build-spec", specAttempt.attempt_ref);
  artifacts.writeAtomic("plan.md", "# Plan\n");
  artifacts.writeAtomic("tasks.md", "# Tasks\n");
  const planCheckpoint = bound.createCheckpoint("build-plan");
  const planAttempt = bound.publishAttempt("build-plan", {
    facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: planCheckpoint },
    upstream_refs: [{ task_id: task.identity.taskId, stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
  });
  bound.acceptAttempt("build-plan", planAttempt.attempt_ref, confirm(bound, "build-plan", planAttempt.attempt_ref));
  return { root, repo, task, workspace, artifacts, bound };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("build-code authenticated input preflight", () => {
  it("rechecks accepted design at real build-code bootstrap", () => {
    const { task, artifacts } = acceptedDesignFixture();
    artifacts.writeAtomic("tasks.md", "# Tasks\n\nTampered before build-code entry.\n");
    expect(() => bootstrapStage("build-code", {
      mode: "sidecar", projectName: "Demo", taskId: "build-code-preflight", taskPath: task.taskPath,
    })).toThrow(/accepted|checkpoint|plan|tasks|artifact.*changed/i);
  });

  it("rechecks accepted design immediately before a direct implementation receipt", () => {
    const { task, workspace, artifacts, bound } = acceptedDesignFixture();
    expect(() => bound.readAccepted("build-plan")).not.toThrow();
    expect(() => workspace.worktreeRoot).not.toThrow();

    artifacts.writeAtomic("tasks.md", "# Tasks\n\nTampered after the entry preflight.\n");
    writeFileSync(join(workspace.worktreeRoot, "implementation.txt"), "implementation\n");

    expect(() => writeOfficialComponentReceipt({
      task, workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true },
    })).toThrow(/accepted|checkpoint|plan|tasks|artifact.*changed/i);
    expect(() => task.readRecord("receipts/implementation.json")).toThrow(/ENOENT|not found/i);
  });
});

describe("build-code Phase execution, AC, and handoff contracts", () => {
  const skill = readFileSync(resolve("workflows/build-code/SKILL.md"), "utf8");
  const verifySkill = readFileSync(resolve("workflows/verify-code/SKILL.md"), "utf8");

  it("gives Phase execution one factual Phase Card without copying process rules", () => {
    expect(skill).toMatch(/Phase Card[\s\S]*(?:goal|目标)[\s\S]*AC IDs[\s\S]*Workspace[\s\S]*(?:allowed files|允许文件)[\s\S]*(?:non-goals|非目标)[\s\S]*(?:test commands|测试命令)[\s\S]*(?:upstream findings|上游 finding)/i);
    expect(skill).toMatch(/card must not copy execution steps, review selection rules, or[\s\S]*task-storage paths/i);
  });

  it("requires applicable RED to minimal GREEN, focused tests, necessary regression, and scoped diff", () => {
    for (const part of [/When applicable/, /RED/, /minimal GREEN/, /focused\s+tests/, /necessary regression/, /scoped diff/])
      expect(skill).toMatch(part);
    expect(skill).toMatch(/return the exact command and raw output/i);
    expect(skill).toMatch(/Publish implementation receipts[\s\S]*real test evidence/i);
  });

  it("keeps Stage publication and delivery outside Phase execution", () => {
    expect(skill).toMatch(/Do not split or start another Phase,[\s\S]*commit, merge, push, accept the Stage, or close/i);
    expect(skill).toMatch(/### Stage coordination/i);
    expect(skill).toMatch(/final full-worktree `wh-review`/i);
    expect(skill).toMatch(/publish the\s+build-code attempt/i);
  });

  it("requires a complete AC table in existing test evidence and the inline human brief", () => {
    expect(skill).toMatch(/every accepted AC|each accepted AC|每(?:一|项).*AC/i);
    for (const status of ["covered", "missing", "unknown"]) expect(skill).toContain(status);
    expect(skill).toMatch(/covered[\s\S]*authenticated canonical refs/i);
    expect(skill).toMatch(/exactly one row|恰好一行/i);
    expect(skill).toMatch(/covered[\s\S]{0,80}(?:requires|必须)[\s\S]{0,80}(?:refs|引用)/i);
    expect(skill).toMatch(/omitted AC is never covered/i);
    expect(verifySkill).toMatch(/accepted build-code facts[\s\S]*evidence_refs/i);
  });

  it("maps an omitted accepted AC to unknown rather than covered in the contract fixture", () => {
    const accepted = ["AC-101", "AC-102"];
    const supplied = [{ ac: "AC-101", status: "covered", refs: ["evidence/ac-101.json"], reason: "test passed" }];
    const rows = accepted.map((ac) => supplied.find((row) => row.ac === ac)
      ?? { ac, status: "unknown", refs: "无", reason: "上游未报告" });
    expect(rows).toEqual([
      supplied[0],
      { ac: "AC-102", status: "unknown", refs: "无", reason: "上游未报告" },
    ]);
    expect(rows.find((row) => row.ac === "AC-102")?.status).not.toBe("covered");
  });

  it("defines a concise downstream handoff without copying full artifacts or logs", () => {
    const compact = skill.replace(/\s+/g, " ");
    expect(compact).toMatch(/milestone card[\s\S]{0,220}current progress[\s\S]{0,220}next step[\s\S]{0,220}(?:whether user action is required|whether the user must act)/i);
    expect(compact).toMatch(/recommendation[\s\S]{0,80}reason[\s\S]{0,120}each option's consequence\/risk/i);
    expect(compact).toMatch(/formal artifacts and evidence[\s\S]*without copying their full contents/i);
    expect(skill).not.toMatch(/docs\/human-brief-template\.md/);
    expect(verifySkill).toMatch(/accepted build-code facts[\s\S]*evidence_refs/i);
  });
});
