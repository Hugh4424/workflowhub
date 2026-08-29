import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function talkLifecycleRounds() {
  return [1, 2, 3].map((round) => {
    const cardRef = `conversation/talk/card-${round}`;
    const replyRef = `host-message://talk/reply-${round}`;
    const question = {
      question_id: `axis-${round}`,
      axis: `axis-${round}`,
      independent: true,
      options: [
        { number: 1, label: "保守", meaning: "先少做", consequence: "范围较小", risk: "收益较慢" },
        { number: 2, label: "推荐", meaning: "直接解决", consequence: "一次完成", risk: "改动较多" },
      ],
      recommended_option: 2,
      recommendation_reason: "当前事实支持",
    };
    const card = { card_ref: cardRef, card_hash: sha256(cardRef), round };
    const reply = { ...card, source: "user", reply_ref: replyRef, reply_hash: sha256(replyRef) };
    return {
      interaction_type: "talk",
      events: [
        { event: "ask", ...card, questions: [question] },
        { event: "wait", ...card, status: "waiting-for-user" },
        { event: "reply", ...reply, answers: [{ question_id: question.question_id, number: 2 }], remaining_question_ids: [], re_ranked: true },
        { event: "resume", ...reply, status: "resumed" },
      ],
    };
  });
}

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
    skipAnalyzerValidation: true,
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
      CODEX_SESSION_ID: process.env.CODEX_SESSION_ID,
      CODEX_THREAD_ID: process.env.CODEX_THREAD_ID,
      CODEX_ROLLOUT_PATH: process.env.CODEX_ROLLOUT_PATH,
      WORKFLOWHUB_CODEX_ROLLOUT_PATH: process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH,
      CODEX_CLI_VERSION: process.env.CODEX_CLI_VERSION,
    };
    process.env.HOME = state.home;
    process.env.WORKFLOWHUB_TASK_DIR = state.storage;
    delete process.env.CODEX_SESSION_ID;
    delete process.env.CODEX_THREAD_ID;
    delete process.env.CODEX_ROLLOUT_PATH;
    delete process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
    delete process.env.CODEX_CLI_VERSION;
    try {
      const result = await stageRuntimeMain([
        "artifact",
        "--stage=make-decision",
        "--project=Demo",
        `--task=${state.task.identity.taskId}`,
        "--name=decision-log.md",
        `--input=${input}`,
      ], { cwd: state.repo });

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
      if (previous.CODEX_SESSION_ID === undefined) delete process.env.CODEX_SESSION_ID;
      else process.env.CODEX_SESSION_ID = previous.CODEX_SESSION_ID;
      if (previous.CODEX_THREAD_ID === undefined) delete process.env.CODEX_THREAD_ID;
      else process.env.CODEX_THREAD_ID = previous.CODEX_THREAD_ID;
      if (previous.CODEX_ROLLOUT_PATH === undefined) delete process.env.CODEX_ROLLOUT_PATH;
      else process.env.CODEX_ROLLOUT_PATH = previous.CODEX_ROLLOUT_PATH;
      if (previous.WORKFLOWHUB_CODEX_ROLLOUT_PATH === undefined) delete process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
      else process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH = previous.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
      if (previous.CODEX_CLI_VERSION === undefined) delete process.env.CODEX_CLI_VERSION;
      else process.env.CODEX_CLI_VERSION = previous.CODEX_CLI_VERSION;
    }
  });

  it("uses the current decision-log without a legacy decision receipt", async () => {
    const state = fixture("p1-decision-hash");
    const decisionLog = "# current decision\n\n## 范围\n\n## 目标、用户流程与边界\n继续当前任务，范围限于治理运行时。\n\n## 非目标\n不扩大范围。\n\n## 风险与延期交接\n\n## 风险、延期与交接\n质量事实缺失保持可见。\n";
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
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find((fact) => fact.subject === "scope")).toMatchObject({ status: "passed" });
    expect(facts.find((fact) => fact.subject === "risks")).toMatchObject({ status: "passed" });
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
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find((fact) => fact.subject === "scope")).toMatchObject({ status: "passed" });
    expect(facts.find((fact) => fact.subject === "risks")).toMatchObject({ status: "passed" });
  });

  it("keeps optional Talk/Clarify evidence without turning it into a completion gate", async () => {
    const state = fixture("p1-interaction-after-downstream-change");
    const decisionLog = "# current decision\n\n## 范围\n当前范围。\n\n## 非目标\n不扩大范围。\n\n## 风险与延期交接\n风险已记录。\n";
    state.artifacts.writeAtomic("decision-log.md", decisionLog);
    const decisionRef = state.artifacts.reference("decision-log.md");
    const decisionHash = sha256(decisionLog);
    const interactionSnapshot = captureGitWorktreeSnapshot(state.context.candidateWorkspace.worktreeRoot);
    const interactionValue = {
      schema_version: "workflowhub-interaction-aggregate.v1",
      task_id: state.task.identity.taskId,
      stage: "make-decision",
      snapshot_tree: interactionSnapshot.tree,
      talk: { status: "completed", round_count: 3, architecture_direction_covered: true, user_outcome_covered: true, lifecycle_rounds: talkLifecycleRounds() },
      clarify: { status: "resolved", open_direction_changing_questions: 0, resolved_by: "user_reply" },
      decision_ref: decisionRef,
      decision_hash: decisionHash,
    };
    const interactionRaw = `${JSON.stringify(interactionValue, null, 2)}\n`;
    const interactionRef = `quality/evidence/interactions/${sha256(interactionRaw)}.json`;
    state.context.kernel.publishCanonicalRecord(interactionRef, interactionRaw);

    writeFileSync(join(state.context.candidateWorkspace.worktreeRoot, "downstream-change.txt"), "implemented\n");
    const currentSnapshot = captureGitWorktreeSnapshot(state.context.candidateWorkspace.worktreeRoot);
    expect(currentSnapshot.tree).not.toBe(interactionSnapshot.tree);
    const direction = writeFormalReviewFixture({ task: state.task, stage: "make-decision", snapshotTree: currentSnapshot.tree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task: state.task, stage: "make-decision", snapshotTree: currentSnapshot.tree, reviewTrack: "detail" });

    const result = await runOfficialStage("make-decision", state.context, {
      receipts: {
        interaction: interactionRef,
        direction_review: direction.resultRef,
        detail_review: detail.resultRef,
      },
    });

    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find((fact) => fact.subject === "talk_clarify")).toBeUndefined();
    expect(result.completion).not.toHaveProperty("predicates.talk_clarify");
  });
});
