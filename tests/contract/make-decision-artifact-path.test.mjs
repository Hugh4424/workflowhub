import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { bootstrapStage, prepareMakeDecisionWorkspace } from "../../runtime/stage/stage-context.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fixture(taskId, { prepare = true } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p1-artifact-path-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  const home = join(root, "home");
  mkdirSync(repo);
  mkdirSync(storage);
  mkdirSync(home);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub P1 Test"]);
  git(repo, ["config", "user.email", "workflowhub-p1@example.invalid"]);
  writeFileSync(join(repo, "baseline.txt"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);

  const taskPath = join(storage, "Projects", "Demo", "tasks", taskId);
  const task = createTask({
    storageRoot: storage,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-08-06T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });

  let context = bootstrapStage("make-decision", {
    mode: "sidecar",
    taskPath,
    projectName: "Demo",
    taskId,
  });
  if (prepare) context = prepareMakeDecisionWorkspace(context);
  const artifacts = prepare
    ? ArtifactDir.open(context.candidateWorkspace.worktreeRoot, task)
    : null;
  return { root, repo, storage, home, task, taskPath, context, artifacts };
}

function stageOutcome(state, attemptId) {
  return writeStageOutcomeFixture({
    task: state.task,
    kernel: state.context.kernel,
    artifacts: state.context.artifacts,
    candidateWorkspace: state.context.candidateWorkspace,
    stage: "make-decision",
    attemptId,
  });
}

describe("make-decision current artifact path contract", () => {
  it("exposes the authenticated ArtifactDir after CandidateWorkspace preparation", () => {
    const state = fixture("p1-context-artifacts");

    expect(state.context.artifacts).toBeDefined();
    expect(state.context.artifacts.reference("decision-log.md")).toBe(
      `specs/${state.task.identity.taskId}/decision-log.md`,
    );
  });

  it("writes make-decision decision-log through the public artifact route", async () => {
    const state = fixture("p1-cli-artifact");
    const input = join(state.root, "decision-log.md");
    writeFileSync(input, "# current decision\n");
    const previous = {
      HOME: process.env.HOME,
      WORKFLOWHUB_TASK_DIR: process.env.WORKFLOWHUB_TASK_DIR,
    };
    process.env.HOME = state.home;
    process.env.WORKFLOWHUB_TASK_DIR = state.storage;
    try {
      const result = await stageRuntimeMain([
        "artifact",
        "--stage=make-decision",
        "--project=Demo",
        `--task=${state.task.identity.taskId}`,
        "--name=decision-log.md",
        `--input=${input}`,
      ]);

      expect(result.artifact_ref).toBe(
        `specs/${state.task.identity.taskId}/decision-log.md`,
      );
      let current = bootstrapStage("make-decision", {
        mode: "sidecar",
        taskPath: state.taskPath,
        projectName: "Demo",
        taskId: state.task.identity.taskId,
      });
      current = prepareMakeDecisionWorkspace(current);
      expect(current.artifacts.read("decision-log.md")).toBe("# current decision\n");
    } finally {
      if (previous.HOME === undefined) delete process.env.HOME;
      else process.env.HOME = previous.HOME;
      if (previous.WORKFLOWHUB_TASK_DIR === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
      else process.env.WORKFLOWHUB_TASK_DIR = previous.WORKFLOWHUB_TASK_DIR;
    }
  });

  it("uses the current decision-log without a legacy decision receipt", async () => {
    const state = fixture("p1-decision-hash");
    const decisionLog = "# current decision\n\n## 范围\n继续当前任务。\n\n## 非目标\n不扩大范围。\n\n## 风险与延期交接\n质量事实缺失保持可见。\n";
    state.artifacts.writeAtomic("decision-log.md", decisionLog);
    const snapshot = captureGitWorktreeSnapshot(state.context.candidateWorkspace.worktreeRoot);
    const direction = writeFormalReviewFixture({
      task: state.task,
      stage: "make-decision",
      snapshotTree: snapshot.tree,
      reviewTrack: "direction",
    });
    const detail = writeFormalReviewFixture({
      task: state.task,
      stage: "make-decision",
      snapshotTree: snapshot.tree,
      reviewTrack: "detail",
    });
    const result = await runOfficialStage("make-decision", state.context, {
      receipts: { direction_review: direction.resultRef, detail_review: detail.resultRef, stage_outcomes: stageOutcome(state, "attempt-current").ref },
    });
    expect(result).toMatchObject({ stage: "make-decision", work_status: "ready" });
  });

  it("keeps direction and detail advice after a later decision-log snapshot", async () => {
    const state = fixture("p1-advice-snapshot");
    const original = "# current decision\n\n## 范围\n继续当前任务。\n\n## 非目标\n不扩大范围。\n\n## 风险与延期交接\n质量事实缺失保持可见。\n";
    state.artifacts.writeAtomic("decision-log.md", original);
    const reviewedSnapshot = captureGitWorktreeSnapshot(state.context.candidateWorkspace.worktreeRoot);
    const direction = writeFormalReviewFixture({
      task: state.task,
      stage: "make-decision",
      snapshotTree: reviewedSnapshot.tree,
      reviewTrack: "direction",
    });
    const detail = writeFormalReviewFixture({
      task: state.task,
      stage: "make-decision",
      snapshotTree: reviewedSnapshot.tree,
      reviewTrack: "detail",
    });

    state.artifacts.writeAtomic("decision-log.md", `${original}\n补充当前决策记录，不改变被审主题。\n`);
    const currentSnapshot = captureGitWorktreeSnapshot(state.context.candidateWorkspace.worktreeRoot);
    expect(currentSnapshot.tree).not.toBe(reviewedSnapshot.tree);
    const result = await runOfficialStage("make-decision", state.context, {
      receipts: { direction_review: direction.resultRef, detail_review: detail.resultRef, stage_outcomes: stageOutcome(state, "attempt-revised").ref },
    });

    expect(result).toMatchObject({ stage: "make-decision", work_status: "ready" });
    expect(result.quality_warnings ?? []).not.toContain(expect.stringContaining("review does not bind the final current snapshot"));
  });
});
