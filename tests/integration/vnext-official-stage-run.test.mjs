import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { runOfficialStage, runStage } from "../../runtime/stage/stage-runner.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { buildStageCompletion } from "../../runtime/evidence/stage-completion-facts.mjs";
import { createStageContentEvidenceWriter } from "../../runtime/evidence/stage-content-evidence.mjs";
import { sha256 } from "../../runtime/evidence/freshness.mjs";

const roots = [];
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const reviewLineage = (requestId) => ({
  request_id: requestId,
  prompt_hash: "0".repeat(64),
  round: "initial",
  prior_attempt_refs: [],
  prior_runtime_ids: {},
  correction_ref: null,
  dispatch_sequence: 0,
});

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture(taskId = "vnext-stage-run") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-vnext-stage-run-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-08-02T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const name of MATERIALS) artifacts.writeAtomic(name, `# ${name}\n`);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return { task, candidate, kernel };
}

function contextFor(stage, state) {
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

function publishReviewFixture(state) {
  const snapshot = state.candidate.captureSnapshot();
  const value = {
    version: "wh-review-result.v1",
    task_id: state.task.identity.taskId,
    stage: "build-spec",
    review_track: null,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: null,
    source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
    snapshot_tree: snapshot.tree,
    material_id: "0".repeat(64),
    attempt_ref: "quality/reviews/attempts/vnext-build-spec/attempt.json",
    lineage: reviewLineage("vnext-build-spec-request"),
    provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "fixture review passed", findings: [] } }],
    verdict: "pass",
    findings: [],
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = "quality/reviews/results/vnext-build-spec.json";
  state.kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: sha256(raw) };
}

describe("vNext official stage publication", () => {
  it("reads the four current materials directly and rejects revision pointers/writers", () => {
    const state = fixture("vnext-direct-materials");
    expect(() => state.task.readRecord("materials/current.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("requirements/current.json")).toThrow(/ENOENT/);
    expect(() => state.kernel.publishMaterialRevision({ change_summary: "forbidden", source_refs: ["task.json"] }))
      .toThrow(/material revision writer is retired/);
  });

  it('fake-pass:test-receipt refuses a non-zero test receipt as passed quality', async () => {
    const state = fixture("fake-pass-receipt");
    const receipt = {
      schema_version: "workflowhub-receipt.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      producer: { stage: "build-code", component: "tests", version: "1.0.0" },
      command: "false",
      command_hash: "a".repeat(64),
      exit_code: 1,
      snapshot_head: state.candidate.baselineCommit,
      snapshot_tree: state.candidate.captureSnapshot().tree,
      snapshot_commit: state.candidate.baselineCommit,
      started_at: "2026-08-02T00:00:00.000Z",
      completed_at: "2026-08-02T00:00:01.000Z",
      output_ref: "evidence/fake-pass.output",
      output_hash: "b".repeat(64),
    };
    const raw = `${JSON.stringify(receipt, null, 2)}\n`;
    const ref = "quality/tests/fake-pass.json";
    state.kernel.publishCanonicalRecord(ref, raw);
    const result = await runStage("build-code", contextFor("build-code", state), async () => ({
      facts: { source: "fake-pass-test" },
      evidence_refs: [{ ref, sha256: createHash("sha256").update(raw).digest("hex") }],
    }));
    const facts = result.quality_fact_refs.map((item) => JSON.parse(state.task.readRecord(item)));
    expect(facts.find((item) => item.kind === "test")).toMatchObject({ status: "failed" });
  });

  it("publishes quality facts and a derived publication without the legacy attempt writer", async () => {
    const state = fixture();
    const review = publishReviewFixture(state);
    const result = await runStage(
      "build-spec",
      contextFor("build-spec", state),
      async () => ({ facts: { source: "official-stage-fixture" }, evidence_refs: [review] }),
    );

    expect(result).toMatchObject({ stage: "build-spec", status: "completed" });
    expect(result.publication_ref).toMatch(/^publications\/build-spec\/[a-f0-9]{64}\.json$/);
    expect(result.quality_fact_refs).toHaveLength(3);
    expect(() => state.task.readRecord("results/build-spec/attempt-0001.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("results/build-spec/accepted.json")).toThrow(/ENOENT/);
  });

  it("recognizes the canonical evidence/confirmations path in stage publication", async () => {
    const state = fixture("vnext-confirmation-path");
    const snapshot = state.candidate.captureSnapshot();
    const artifacts = ArtifactDir.open(state.candidate.worktreeRoot, state.task);
    const materialRevision = `revision-${sha256(JSON.stringify(MATERIALS.map((file) => [file, artifacts.read(file)])))}`;
    const reviewRaw = `${JSON.stringify({
      version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage: "build-plan", review_track: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
      source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
      snapshot_tree: snapshot.tree, material_id: "0".repeat(64), attempt_ref: "quality/reviews/attempts/vnext-build-plan/attempt.json",
      lineage: reviewLineage("vnext-build-plan-request"),
      provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "fixture review passed", findings: [] } }],
      verdict: "pass", findings: [],
    })}\n`;
    const confirmationRaw = `${JSON.stringify({ schema_version: "human-confirmation.v2", task_id: state.task.identity.taskId, stage: "build-plan", decision: "accepted", material_revision: materialRevision, snapshot_tree: snapshot.tree, confirmed_at: "2026-08-04T00:00:00.000Z" })}\n`;
    const reviewRef = "quality/reviews/results/vnext-build-plan.json";
    const confirmationRef = "quality/confirmations/vnext-build-plan.json";
    state.kernel.publishCanonicalRecord(reviewRef, reviewRaw);
    state.kernel.publishCanonicalRecord(confirmationRef, confirmationRaw);
    const result = await runStage("build-plan", contextFor("build-plan", state), async () => ({
      facts: { source: "confirmation-path-regression" },
      evidence_refs: [
        { ref: reviewRef, sha256: createHash("sha256").update(reviewRaw).digest("hex") },
        { ref: confirmationRef, sha256: createHash("sha256").update(confirmationRaw).digest("hex") },
      ],
    }));
    expect(result.status).toBe("completed");
    expect(result.publication_ref).toMatch(/^publications\/build-plan\//);
  });

  it("lets make-decision publish interaction evidence without the retired journal writer", () => {
    const state = fixture("vnext-make-decision-content");
    const writer = createStageContentEvidenceWriter({
      task: state.task,
      workspace: state.candidate,
      stage: "make-decision",
      workflowRunId: state.kernel.deriveStageWorkflowRunId("make-decision"),
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
          zero_question_reason: "the current requirement already fixes this direction",
        }],
        grill: null,
      },
    });
    const first = talk(1);
    const second = talk(2);
    const third = talk(3);
    expect([first, second, third].map(({ value }) => value.payload.rounds[0].round_number)).toEqual([1, 2, 3]);
  });

  it("review:unavailable-not-passed routes the repository-owned official build-spec run to vNext facts", async () => {
    const state = fixture("vnext-official-run");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    const spec = writeOfficialComponentReceipt({
      task: state.task,
      stage: "build-spec",
      component: "spec",
      payload: { content: artifacts.read("spec.md") },
    });
    const snapshot = workspace.captureSnapshot?.() ?? state.candidate.captureSnapshot();
    const attemptId = "vnext-official-build-spec";
    const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
    const attempt = {
      version: "wh-review-attempt.v1",
      attempt_id: attemptId,
      task_id: state.task.identity.taskId,
      stage: "build-spec",
      review_track: null,
      source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
      snapshot_tree: snapshot.tree,
      material_id: "0".repeat(64),
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
      lineage: reviewLineage("vnext-official-build-spec-request"),
      provider_attempts: [],
      terminal_status: "unavailable",
      error: { code: "MATERIAL_INCOMPLETE", message: "fixture review unavailable" },
    };
    const attemptRaw = `${JSON.stringify(attempt, null, 2)}\n`;
    kernel.publishCanonicalRecord(attemptRef, attemptRaw);
    const result = await runOfficialStage("build-spec", {
      stage: "build-spec", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"), manifest: state.task.manifest,
      workspace, artifacts,
    }, { receipts: { spec: spec.ref, review: attemptRef } });

    expect(result.status).toBe("completed");
    expect(result.quality_status).toBe("incomplete");
    expect(result.quality_fact_refs).toHaveLength(3);
    const qualityFacts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(qualityFacts.find((fact) => fact.kind === "review")).toMatchObject({ status: "unavailable" });
    expect(() => state.task.readRecord("results/build-spec/attempt-0001.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("results/build-spec/accepted.json")).toThrow(/ENOENT/);
  });

  it("publishes acceptance predicates from canonical completion facts even when another quality item is open", async () => {
    const state = fixture("vnext-predicate-isolation");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    const completion = buildStageCompletion("verify-code", {
      result: "completed_with_open_items",
      objective: "核对当前交付",
      approach: "使用当前材料和当前测试事实",
      effect: "逐项发布质量事实",
      verification: { conclusion: "测试与 AC 已覆盖", limits: ["独立审查仍有开放 finding"] },
      artifacts: [{ label: "当前实现", ref: "quality/evidence/implementation/a.json", hash: "a".repeat(64), publication_lookup: "publications/verify-code/" }],
      review: { conclusion: "独立审查仍有开放 finding", status: "revise_required", providers: ["fixture"], findings: [], refs: [] },
      business_facts: { content: "present", code: "complete", tests: "passed", acceptance_criteria: "covered" },
      declared_components: [], invocation_facts: [], audit_gaps: [], missing_items: ["independent review remains open"],
      confirmation_summary: {
        completed: "已核对当前交付", specification: "当前材料已读取", scope: ["当前 verify-code"],
        non_goals: ["不把审查意见改写成通过"], phases: ["verify-code"], dependencies: [],
        tests: ["定向事实"], review_advice: "保留原始 finding", risks: ["独立审查仍有开放 finding"],
        deferred: ["finding 处置保留为质量事实"], next_stage_boundary: "不执行 close", expected_impact: "事实可回放",
      },
      risks: ["独立审查仍有开放 finding"], dependencies: [], recovery_conditions: ["返回 verify-code 修复"],
      downstream_read_rule: "只读当前正式事实", next_owner: "task owner", user_action: "需要处理未完成项",
    });
    const result = await runStage("verify-code", {
      stage: "verify-code", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("verify-code"), manifest: state.task.manifest,
      workspace, artifacts,
    }, async () => ({ facts: { marker: "predicate-isolation" }, evidence_refs: [], missing_items: ["independent review remains open"], completion }));
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find((fact) => fact.subject === "acceptance_criteria")).toMatchObject({ kind: "acceptance_criterion", status: "passed" });
    expect(facts.find((fact) => fact.subject === "exceptions")).toMatchObject({ kind: "acceptance_criterion", status: "passed" });
  });
});
