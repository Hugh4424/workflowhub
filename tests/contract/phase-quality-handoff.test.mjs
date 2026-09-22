import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, readTaskFacts, writeStageRow } from "../../runtime/task/task-store.mjs";
import { publishStageHandoff, renderStageHandoff } from "../../runtime/stage/stage-handoff.mjs";
import { runStage } from "../../runtime/stage/stage-runner.mjs";

const { captureReviewSource } = await import("../../skills/wh-review/scripts/review-source.mjs");
const { verifyFinalSubject } = await import("../../skills/wh-review/scripts/review-runner.mjs");

const read = (...parts) => readFileSync(new URL(`../../${parts.join("/")}`, import.meta.url), "utf8");
const tempRoots = [];
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

function repoFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase-subject-")));
  tempRoots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "phase.mjs"), "base\n");
  writeFileSync(join(repo, "other.mjs"), "base\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "base"]);
  return { root, repo, baseCommit: git(repo, ["rev-parse", "HEAD"]) };
}

afterEach(() => {
  while (tempRoots.length) rmSync(tempRoots.pop(), { recursive: true, force: true });
});

describe("Phase quality and handoff contract", () => {
  it("renders post-cohort handoff pointers without resurrecting plan/tasks", () => {
    const rendered = renderStageHandoff({
      taskId: "post-handoff-fixture",
      stage: "build-code",
      snapshotTree: "a".repeat(40),
      materialScopeRevision: `revision-${"b".repeat(64)}`,
      reflectionStatus: "unavailable",
      materials: {
        "decision-log.md": "# Decision\n\n## 目标\n- keep the current direction.\n",
        "spec.md": "# Spec\n\n## 速读卡\n- use the current implementation design.\n",
        "phases/index.md": "# Phase index\n\n| P1 | phases/P1.md |\n",
        "phases/P1.md": "# Phase P1\n\n- first implementation task.\n",
      },
    });
    expect(rendered).toContain("非权威 current handoff，只以当前 cohort 材料和正式质量原件为准");
    expect(rendered).toContain("`phases/index.md`");
    expect(rendered).toContain("`phases/P1.md`");
    expect(rendered).not.toContain("以 plan.md / tasks.md 为准");
    expect(rendered).not.toContain("- `plan.md`\n- `tasks.md`");
  });

  it("keeps blueprint design in build-plan before stateless routing", () => {
    const deps = read("workflows/build-plan/skill-deps.yaml");
    const steps = JSON.parse(read("workflows/build-plan/steps.json"));
    const blueprint = deps.indexOf("testing-system-blueprint");
    const route = deps.indexOf("test-routing-advisor");
    expect(blueprint).toBeGreaterThanOrEqual(0);
    expect(route).toBeGreaterThan(blueprint);
    const slugs = steps.steps.map((step) => step.step_slug);
    expect(slugs.indexOf("testing-system-blueprint")).toBeGreaterThan(-1);
    expect(slugs.indexOf("test-routing-advisor")).toBeGreaterThan(slugs.indexOf("testing-system-blueprint"));
    expect(slugs).not.toContain("grill-with-docs");
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/Do not run Talk, Clarify, or Grill/);
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/build-plan writes each applicable[\s\S]*behavior test[\s\S]*target assertion[\s\S]*DO NOT TOUCH/i);
  });

  it("keeps blueprint advisory and concrete testing single-choice in build-code", () => {
    const blueprint = read("skills/testing-system-blueprint/SKILL.md");
    const buildCode = read("workflows/build-code/SKILL.md");
    expect(blueprint).toMatch(/build-plan/);
    expect(blueprint).toMatch(/不.*gate|不是测试通过门/);
    expect(blueprint).toMatch(/不.*ledger|不.*receipt/);
    expect(buildCode).toMatch(/Use exactly one applicable concrete testing skill directly/);
    expect(buildCode).toMatch(/once for every behavior Phase/);
    expect(read("workflows/build-code/skill-deps.yaml")).toMatch(/every_behavior_phase_actual_scope/);
    expect(buildCode).toMatch(/backend-testing.*frontend-testing.*fullstack-slice-testing/s);
    expect(buildCode).toMatch(/A current Phase review is required as a recorded quality fact/);
    expect(buildCode).toMatch(/not a progression gate/);
    expect(buildCode).toMatch(/phase may be committed only when the\s+user has separately authorized/);
    expect(buildCode).toMatch(/(?:the\s+)?phase\s+commit[\s\S]*never\s+required\s+to start, continue, test, repair, or hand off/i);
    expect(buildCode).not.toMatch(/phase_handoff_review:\s*pass_required/);
  });

  it("keeps Phase review scope host-derived instead of task-card supplied", () => {
    const runner = read("skills/wh-review/scripts/review-runner.mjs");
    const source = read("skills/wh-review/scripts/review-source.mjs");
    expect(runner).not.toMatch(/phaseExecutionPaths|execution_file_paths/);
    expect(source).not.toMatch(/phasePaths|execution_file_paths/);
    expect(runner).toMatch(/phase review results are quality facts, not verify-final results/);
    expect(runner).not.toMatch(/phase-gate/);
  });

  it("keeps the post Phase index pointer-only", () => {
    const tasks = read("skills/spec-tasks/SKILL.md");
    const template = read("skills/spec-tasks/templates/index-template.md");
    expect(tasks).toMatch(/pure pointer index/);
    expect(tasks).toMatch(/not a task card, Phase procedure, progress ledger, or completion authority/);
    expect(template).toMatch(/Execution Index/);
    expect(template).not.toMatch(/gate_cmd|expected_exit|\boracle\b/);
    expect(tasks).toMatch(/Do not copy its L0\/L1\/L2 body[\s\S]*execution status/);
    expect(tasks).not.toMatch(/TaskKernel|WorkflowHub Stage Progress/i);
  });

  it("derives committed Phase files from the commit parent and candidate tree", () => {
    const { root, repo, baseCommit } = repoFixture();
    writeFileSync(join(repo, "phase.mjs"), "phase changed\n");
    git(repo, ["add", "phase.mjs"]);
    git(repo, ["commit", "-qm", "phase"]);
    const source = captureReviewSource({ sourceRoot: repo, targetRepoRoot: repo, baselineCommit: baseCommit, reviewDataRoot: root, phaseId: "phase-a", includeDiff: true });
    try {
      const head = git(repo, ["rev-parse", "HEAD"]);
      expect(source.changedFiles.map(({ path }) => path)).toEqual(["phase.mjs"]);
      expect(source.phaseCommit).toMatchObject({
        committed: true,
        commit_oid: head,
        parent_commit: git(repo, ["rev-parse", "HEAD^"]),
        commit_tree: git(repo, ["rev-parse", "HEAD^{tree}"]),
        candidate_tree: source.snapshotTree,
        tree_matches_candidate: true,
      });
      expect(readFileSync(source.diffPath, "utf8")).not.toContain("other.mjs");
    } finally {
      source.dispose();
    }
  });

  it("records a dirty Phase without inventing a commit", () => {
    const { root, repo, baseCommit } = repoFixture();
    writeFileSync(join(repo, "phase.mjs"), "dirty phase\n");
    const source = captureReviewSource({ sourceRoot: repo, targetRepoRoot: repo, baselineCommit: baseCommit, reviewDataRoot: root, phaseId: "phase-a", includeDiff: true });
    try {
      const head = git(repo, ["rev-parse", "HEAD"]);
      expect(source.changedFiles.map(({ path }) => path)).toEqual(["phase.mjs"]);
      expect(source.phaseCommit).toMatchObject({
        committed: false,
        commit_oid: null,
        parent_commit: head,
        commit_tree: git(repo, ["rev-parse", "HEAD^{tree}"]),
        candidate_tree: source.snapshotTree,
        tree_matches_candidate: false,
      });
    } finally {
      source.dispose();
    }
  });

  it("invalidates a Phase review when its committed tree differs from the candidate tree", () => {
    const { root, repo, baseCommit } = repoFixture();
    writeFileSync(join(repo, "phase.mjs"), "phase committed\n");
    git(repo, ["add", "phase.mjs"]);
    git(repo, ["commit", "-qm", "phase"]);
    writeFileSync(join(repo, "phase.mjs"), "phase changed after commit\n");
    const current = captureReviewSource({ sourceRoot: repo, targetRepoRoot: repo, baselineCommit: baseCommit, reviewDataRoot: root, phaseId: "phase-a", includeDiff: false });
    try {
      const result = {
        stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "phase-a",
        base_tree: current.baseTree, candidate_tree: current.snapshotTree, snapshot_tree: current.snapshotTree,
        source: {
          target_commit: current.targetCommit, base_commit: current.baseCommit, base_tree: current.baseTree,
          captured_head: current.capturedHead, phase_commit: { ...current.phaseCommit, tree_matches_candidate: true },
        },
      };
      expect(() => verifyFinalSubject({ result, current })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
    } finally {
      current.dispose();
    }
  });

  it("T004 keeps finding dispositions on one stage row and renders the same row in the current handoff", () => {
    const { root, repo } = repoFixture();
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: "handoff-dispositions",
      created_at: "2026-09-21T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    } });
    initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
    const candidateWorkspace = prepareTaskWorkspace(task);
    const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
    const materials = {
      "decision-log.md": "# Decision\n\n## 核心需求\n- retain a single writer.\n",
      "spec.md": "# Spec\n\n## 速读卡\n- current handoff reads canonical facts.\n",
      "plan.md": "# Plan\n\n## Phase 1\n- retain the stage row.\n",
      "tasks.md": "# Tasks\n\n## Phase 1\n- T004\n",
    };
    for (const [name, value] of Object.entries(materials)) artifacts.writeAtomic(name, value);
    const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => "2026-09-21T00:00:00.000Z" });
    const dispositions = [
      { finding: "F-raw", disposition: "fixed", anchor: "quality/reviews/results/r.json#F-raw", elapsed_ms: 240 },
      { finding: "F-human", disposition: "needs_human", owner: "product-owner", deadline: "2026-09-23T00:00:00.000Z", anchor: "quality/reviews/results/r.json#F-human", elapsed_ms: 240 },
      { finding: "F-retry", disposition: "rejected_invalid", previous_cause: "missing material binding", cause: "authenticated material binding changed", retry: true, anchor: "quality/reviews/results/r.json#F-retry", elapsed_ms: 240 },
    ];
    writeStageRow(task.taskPath, {
      record_kind: "stage", stage: "build-plan", source: "phase-quality-handoff",
      review_origin: "conducted", review_result_ref: { value: "quality/reviews/results/r.json" },
      finding_dispositions: dispositions,
    });
    const snapshot = kernel.currentVNextSnapshot();
    const materialScopeRevision = kernel.currentVNextMaterialScopeRevision("build-plan");
    const handoff = publishStageHandoff({
      task, kernel, artifacts, taskId: task.identity.taskId, stage: "build-plan",
      snapshotTree: snapshot.tree, materialScopeRevision, reflectionStatus: "unavailable", materials,
    });
    const row = readTaskFacts(task.taskPath).find((value) => value.record_kind === "stage" && value.stage === "build-plan");
    expect(row.finding_dispositions).toEqual(dispositions);
    const rendered = task.readRecord(handoff.ref);
    expect(rendered).toContain("raw_finding_denominator: 3");
    expect(rendered).toContain("valid_finding_numerator: 3");
    expect(rendered).toContain("valid_anchor_numerator: 3");
    expect(rendered).toContain("elapsed_ms: 240");
    expect(rendered).toContain("F-human");
    expect(rendered).toContain("product-owner");
    expect(rendered).toContain("2026-09-23T00:00:00.000Z");
    expect(rendered).toContain("changed-cause retry");

    expect(() => writeStageRow(task.taskPath, {
      record_kind: "stage", stage: "build-plan", source: "phase-quality-handoff-invalid-retry",
      review_origin: "conducted", review_result_ref: { value: "quality/reviews/results/r.json" },
      finding_dispositions: [{ finding: "F-invalid", disposition: "fixed", previous_cause: "same", cause: "same", retry: true }],
    })).toThrow(/changed-cause retry/);
    expect(readTaskFacts(task.taskPath).find((value) => value.stage === "build-plan").finding_dispositions).toEqual(dispositions);
  });

  it("T004 projects the real build-plan handler result into the row before its handoff reads it", async () => {
    const { root, repo } = repoFixture();
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: "handoff-handler-projection",
      created_at: "2026-09-21T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    } });
    initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
    const candidateWorkspace = prepareTaskWorkspace(task);
    const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
    const materials = {
      "decision-log.md": "# Decision\n\n## 核心需求\n- retain a single writer.\n",
      "spec.md": "# Spec\n\n## 速读卡\n- current handoff reads canonical facts.\n",
      "plan.md": "# Plan\n\n## Phase 1\n- retain the stage row.\n",
      "tasks.md": "# Tasks\n\n## Phase 1\n- T004\n",
    };
    for (const [name, value] of Object.entries(materials)) artifacts.writeAtomic(name, value);
    const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => "2026-09-21T00:00:00.000Z" });
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, artifacts,
    };
    const result = await runStage("build-plan", context, async () => ({
      facts: {
        review: { status: "recorded", result_ref: "quality/reviews/results/handler-result.json" },
        finding_dispositions: {
          status: "recorded",
          items: [
            { finding_id: "F-handler-fixed", status: "fixed", anchor: "quality/reviews/results/handler-result.json#F-handler-fixed", elapsed_ms: 180 },
            { finding_id: "F-handler-human", status: "needs_human", owner: "product-owner", deadline: "2026-09-23T00:00:00.000Z", anchor: "quality/reviews/results/handler-result.json#F-handler-human", elapsed_ms: 180 },
            { finding_id: "F-handler-user", status: "user_decided", reply_ref: "quality/confirmations/handler-user-reply.json", anchor: "quality/reviews/results/handler-result.json#F-handler-user", elapsed_ms: 180 },
            { finding_id: "F-handler-retry", status: "rejected_invalid", previous_cause: "old cause", cause: "new authenticated cause", retry: true, anchor: "quality/reviews/results/handler-result.json#F-handler-retry", elapsed_ms: 180 },
          ],
        },
      },
    }), {}, { stageReflection: {} });
    expect(result.stage_reflection.stage_row_error).toBeUndefined();
    expect(result.stage_handoff).toMatchObject({ status: "published", current: true });
    const row = readTaskFacts(task.taskPath).find((value) => value.record_kind === "stage" && value.stage === "build-plan");
    expect(row).toMatchObject({
      review_origin: "conducted",
      review_result_ref: { value: "quality/reviews/results/handler-result.json" },
      finding_dispositions: [
        { finding: "F-handler-fixed", disposition: "fixed", elapsed_ms: 180 },
        { finding: "F-handler-human", disposition: "needs_human", owner: "product-owner", deadline: "2026-09-23T00:00:00.000Z" },
        { finding: "F-handler-user", disposition: "user_decided", reply_ref: "quality/confirmations/handler-user-reply.json", elapsed_ms: 180 },
        { finding: "F-handler-retry", disposition: "rejected_invalid", previous_cause: "old cause", cause: "new authenticated cause", retry: true },
      ],
    });
    const handoff = task.readRecord(result.stage_handoff.ref);
    expect(handoff).toContain("raw_finding_denominator: 4");
    expect(handoff).toContain("F-handler-human");
    expect(handoff).toContain("product-owner");
    expect(handoff).toContain("F-handler-user");
    expect(handoff).toContain("user reply=quality/confirmations/handler-user-reply.json");
    expect(handoff).toContain("changed-cause retry");
  });
});
