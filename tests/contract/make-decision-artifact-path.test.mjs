import { createHash } from "node:crypto";
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
import { writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { createStageContentEvidenceWriter } from "../../runtime/evidence/stage-content-evidence.mjs";
import { bootstrapStage, prepareMakeDecisionWorkspace } from "../../runtime/stage/stage-context.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

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

function publishInteractionAggregate(state, decision) {
  const writer = createStageContentEvidenceWriter({
    task: state.task,
    workspace: state.context.candidateWorkspace,
    stage: "make-decision",
    workflowRunId: state.context.workflowRunId,
  });
  const talk = (roundNumber) => writer.publish({
    kind: "interaction-completion.v1",
    payload: {
      interaction_type: "talk",
      rounds: [{
        round_number: roundNumber,
        questions: [],
        candidate_queue: [],
        questions_already_asked: 0,
        open_direction_changing_questions: 0,
        current_total: 0,
        end_reason: "no direction-changing ambiguity remains",
        zero_question_reason: "the fixture has no unresolved direction-changing question",
      }],
      grill: null,
    },
  });
  const rounds = [talk(1), talk(2), talk(3)];
  const grill = writer.publish({
    kind: "interaction-completion.v1",
    payload: {
      interaction_type: "grill",
      rounds: [],
      grill: {
        context: { status: "no-change", reason: "fixture has no context contradiction" },
        adr: { status: "not-needed", reason: "fixture has no architecture decision" },
        conflicts: { status: "none", reason: "fixture has no conflicts" },
        file_references: [],
        no_file_reason: "fixture uses no file references",
        exit_checks: {
          context_checked: true,
          adr_checked: true,
          conflicts_checked: true,
          file_references_checked: true,
        },
      },
    },
  });
  return writer.publish({
    kind: "interaction-completion.v1",
    payload: {
      interaction_type: "aggregate",
      rounds: rounds.map(({ ref, hash }) => ({ ref, hash })),
      grill: { ref: grill.ref, hash: grill.hash },
      decision_ref: decision.value.decision_ref,
      decision_hash: decision.value.decision_hash,
    },
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

  it("rejects a current decision-log whose bytes differ from quality evidence", async () => {
    const state = fixture("p1-decision-hash");
    const qualityDecision = "# quality decision\n";
    state.artifacts.writeAtomic("decision-log.md", "# different current material\n");
    const decision = writeOfficialComponentReceipt({
      task: state.task,
      workspace: state.context.candidateWorkspace,
      stage: "make-decision",
      component: "decision",
      payload: { decision_log: qualityDecision, contract_refs: [] },
    });
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
    publishInteractionAggregate(state, decision);

    await expect(runOfficialStage("make-decision", state.context, {
      receipts: {
        decision: decision.ref,
        direction_review: direction.resultRef,
        detail_review: detail.resultRef,
      },
    })).rejects.toThrow(/decision-log.*artifact|current.*receipt|hash/i);
  });
});
