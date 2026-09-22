import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { validateAcceptanceCoverageShape, validateStageInvocation } from "../../runtime/stage/stage-handlers.mjs";
import { writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function lifecycle(interactionType = "talk", round = 1) {
  const cardRef = `conversation/${interactionType}/card-${round}`;
  const replyRef = `host-message://reply/${interactionType}-${round}`;
  const questionId = `${interactionType}-scope-${round}`;
  const isGrill = interactionType === "grill";
  return {
    interaction_type: interactionType,
    events: [
      {
        event: "ask", card_ref: cardRef, card_hash: hash(cardRef), round,
        questions: [{
          ...(isGrill ? { frontier_id: questionId } : { question_id: questionId }),
          axis: "scope", independent: true,
          options: [
            { number: 1, label: "保守", meaning: "先少做一点", consequence: "范围较小", risk: "收益延后" },
            { number: 2, label: "推荐", meaning: "解决当前问题", consequence: "一次完成", risk: "改动较多" },
          ],
          recommended_option: 1, recommendation_reason: "当前事实支持",
        }],
      },
      { event: "wait", card_ref: cardRef, card_hash: hash(cardRef), round, status: "waiting-for-user" },
      {
        event: "reply", card_ref: cardRef, card_hash: hash(cardRef), round,
        reply_ref: replyRef, reply_hash: hash(replyRef), source: "user",
        answers: [{ [isGrill ? "frontier_id" : "question_id"]: questionId, number: 1 }],
        ...(isGrill ? { remaining_frontier_ids: [] } : { remaining_question_ids: [] }),
        re_ranked: true,
      },
      { event: "resume", card_ref: cardRef, card_hash: hash(cardRef), round, reply_ref: replyRef, reply_hash: hash(replyRef), source: "user", status: "resumed" },
    ],
  };
}

function fixture(taskId = "acceptance-single-writer") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-acceptance-single-writer-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub contract"]);
  git(repo, ["config", "user.email", "contract@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
      created_at: "2026-08-27T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# 当前决策\n\n## 范围\n只覆盖当前任务。\n\n## 非目标\n不扩大当前范围。\n\n## 风险与延期交接\n风险已记录。\n\nD-001：保持当前入口。\n");
  artifacts.writeAtomic("spec.md", "# 当前规格\n\nFR-FIX-001：当前结果可验证。\n\n## 验收标准\n- [ ] **AC-001**：当前结果可验证。\n  场景：运行当前任务。\n  验证：结果可读。\n  失败：结果缺失。\n");
  artifacts.writeAtomic("plan.md", "# 当前计划\n");
  artifacts.writeAtomic("tasks.md", "# 当前任务\n\nT001：验证当前结果。\n");
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, now: () => "2026-08-27T00:00:01.000Z" });
  return { root, task, candidate, artifacts, kernel };
}

function contextFor(state, stage = "make-decision") {
  return {
    stage,
    task: state.task,
    kernel: state.kernel,
    identity: state.task.identity,
    workflowRunId: state.kernel.deriveStageWorkflowRunId(stage),
    manifest: state.task.manifest,
    candidateWorkspace: state.candidate,
  };
}

function interactionAggregate(state) {
  const decisionRef = state.artifacts.reference("decision-log.md");
  const decisionRaw = state.artifacts.read("decision-log.md");
  const requirement = state.kernel.publishCanonicalRecord(
    "quality/evidence/original-requirement.txt",
    "原始需求：把确认后的交互事实写成可复核记录。\n",
  );
  const confirmation = state.kernel.publishHumanConfirmation("make-decision", {
    decision: "accepted",
    subject_ref: decisionRef,
    reply_text: "fixture accepted make-decision",
    step_slug: "approve-decision",
  });
  const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
  return {
    schema_version: "workflowhub-interaction-aggregate.v1",
    task_id: state.task.identity.taskId,
    stage: "make-decision",
    snapshot_tree: snapshot.tree,
    original_requirement: { ref: requirement.ref, hash: requirement.sha256 },
    decision: {
      ref: decisionRef,
      hash: hash(decisionRaw),
      revision: state.kernel.currentVNextMaterialRevision(),
    },
    confirmation: { ref: confirmation.ref, hash: confirmation.hash, result: "accepted" },
    talk: { status: "completed", round_count: 1, lifecycle_rounds: [lifecycle("talk")] },
    grill: { status: "completed", summary: "范围冲突已处理", lifecycle_rounds: [lifecycle("grill")] },
    advice: { status: "unavailable", reason: "本次没有可用的独立建议运输" },
  };
}

function qualityFacts(state) {
  return state.task.listCanonicalQualityFactRefs().map((ref) => JSON.parse(state.task.readRecord(ref)));
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("P6 acceptance single writer and empty-value contract", () => {
  it("rejects caller-owned build-code acceptance coverage before the official handler", () => {
    expect(() => validateStageInvocation("build-code", {
      receipts: {},
      acceptance_coverage: {
        accepted_criterion_ids: ["AC-001"],
        items: [{ acceptance_criterion_id: "AC-001", status: "unknown", evidence_refs: [] }],
      },
    }, {
      expectedCriterionIds: ["AC-001"],
      rejectCallerAcceptanceCoverage: true,
    })).toThrow(/official.*(?:derive|writer)|acceptance.*(?:retired|caller|input)/i);
  });

  it("keeps unknown empty evidence, zero review findings, and not-applicable reason distinct", () => {
    const normalized = validateAcceptanceCoverageShape({
      snapshot_tree: "a".repeat(40),
      accepted_criterion_ids: ["AC-UNKNOWN", "AC-ZERO", "AC-NA"],
      items: [
        { acceptance_criterion_id: "AC-UNKNOWN", status: "unknown", evidence_refs: [] },
        {
          acceptance_criterion_id: "AC-ZERO", status: "covered",
          evidence_refs: [{ ref: "quality/evidence/review-zero.json", sha256: "b".repeat(64) }],
          evidence_state: "zero_review_findings", review_findings: [],
        },
        {
          acceptance_criterion_id: "AC-NA", status: "not_applicable", evidence_refs: [],
          not_applicable_reason: "本夹具没有该项适用的运行路径",
        },
      ],
    }, { currentOnly: true });
    expect(normalized.items.map((item) => [item.status, item.evidence_state ?? null, item.not_applicable_reason ?? null])).toEqual([
      ["unknown", "unknown_empty_evidence", null],
      ["covered", "zero_review_findings", null],
      ["not_applicable", "not_applicable", "本夹具没有该项适用的运行路径"],
    ]);
    expect(() => validateAcceptanceCoverageShape({
      snapshot_tree: "a".repeat(40), accepted_criterion_ids: ["AC-NA"],
      items: [{ acceptance_criterion_id: "AC-NA", status: "not_applicable", evidence_refs: [] }],
    })).toThrow(/not_applicable.*reason/i);
  });

  it("does not promote Stage Agent packet coverage into the current official ledger", async () => {
    const state = fixture("host-coverage-is-advisory");
    const attemptId = "attempt-host-coverage-is-advisory";
    const outcome = writeStageOutcomeFixture({
      task: state.task,
      kernel: state.kernel,
      artifacts: state.artifacts,
      candidateWorkspace: state.candidate,
      stage: "build-code",
      attemptId,
      workflowRunId: state.kernel.deriveStageWorkflowRunId("build-code"),
    });
    const result = await runOfficialStage("build-code", contextFor(state, "build-code"), {
      attempt_id: attemptId,
      receipts: { stage_outcomes: outcome.ref },
    });
    const acFact = qualityFacts(state).find((fact) => fact.subject === "AC-001");
    expect(acFact).toMatchObject({ kind: "acceptance_criterion", status: "missing" });
    const acceptance = JSON.parse(state.task.readRecord(acFact.evidence[0].ref));
    const stageEvidence = JSON.parse(state.task.readRecord(acceptance.refs[0].ref));
    expect(stageEvidence.subject_fact).toMatchObject({
      status: "missing",
      evidence_state: "unknown_empty_evidence",
      evidence_refs: [],
    });
    expect(result.quality_status).toBe("incomplete");
  });

  it("publishes current decision facts without accepting an aggregate or publishing outline_closed", async () => {
    const state = fixture();
    const result = await runOfficialStage("make-decision", contextFor(state), { receipts: {} });
    expect(result).not.toHaveProperty("interaction_publication");
    const retiredSubjects = qualityFacts(state)
      .filter((fact) => ["talk_clarify", "outline_closed", "interaction_aggregate"].includes(fact.subject));
    expect(retiredSubjects).toEqual([]);
  });
});
