import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { publishStageAgentOutcome } from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function stageAgentExecution() {
  const stepsManifest = JSON.parse(readFileSync(join(process.cwd(), "workflows", "verify-code", "steps.json"), "utf8"));
  const skillsManifest = yaml.load(readFileSync(join(process.cwd(), "workflows", "verify-code", "skill-deps.yaml"), "utf8"));
  const evidence = () => ({ kind: "host-command", command: "stage-agent-test", exit_code: 0, output: "actual host result" });
  return {
    status: "completed",
    provenance: { kind: "stage-agent", host: "test-host", agent_run_id: "verify-code-run" },
    steps: stepsManifest.steps.map((step) => ({
      step_id: step.step_id,
      step_slug: step.step_slug,
      order: step.order,
      status: "completed",
      input_refs: step.entry_conditions.map(({ uri_or_path }) => uri_or_path),
      result_summary: `Stage Agent completed ${step.step_slug}`,
      evidence: [evidence()],
      cost: { duration_ms: 1, tokens: 1, status: "recorded" },
    })),
    skills: skillsManifest.skills.map(({ name }) => {
      const notApplicable = name === "frontend-component-quality" || name === "wh-review";
      const incomplete = name === "stage-reflection";
      return {
        skill_id: name,
        status: notApplicable ? "not_applicable" : incomplete ? "incomplete" : "completed",
        trigger: notApplicable ? false : true,
        executed: notApplicable ? false : true,
        version: "test-stage-agent-1.0.0",
        input_refs: [],
        result_summary: `Stage Agent completed ${name}`,
        ...(notApplicable ? { reason: "not applicable to this contract fixture" } : {}),
        ...(incomplete ? { reason: "runtime-owned reflection" } : {}),
        evidence: [evidence()],
        cost: { duration_ms: 1, tokens: 1, status: "recorded" },
      };
    }),
    code_review: {
      result: {
        status: "clean",
        findings: [],
        summary: "The current implementation passed the dsh-code-review inspection",
        focus: ["correctness", "lifecycle", "security", "consumer_fit", "test_strength"],
        repairs: [],
      },
    },
  };
}

function fixture(taskId = "verify-code-binding-derivation") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-verify-binding-")));
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
  writeCanonicalStageMaterials(artifacts);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return {
    root,
    task,
    candidate,
    context: {
      stage: "verify-code",
      task,
      kernel,
      identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("verify-code"),
      manifest: task.manifest,
      candidateWorkspace: candidate,
      artifacts,
    },
  };
}

function publishOutcome(state, review = null, attemptId = "verify-code-binding-attempt", overrides = {}) {
  const execution = stageAgentExecution();
  if (review) {
    execution.code_review.quality_review_ref = review.resultRef;
    execution.code_review.quality_review_hash = sha256(state.task.readRecord(review.resultRef));
  }
  Object.assign(execution, overrides);
  return publishStageAgentOutcome({
    task: state.task,
    kernel: state.context.kernel,
    artifacts: state.context.artifacts,
    candidateWorkspace: state.candidate,
    stage: "verify-code",
    attemptId,
    workflowRunId: state.context.workflowRunId,
    execution,
  });
}

function tamperOutcome(state, outcome, mutate) {
  const value = JSON.parse(state.task.readRecord(outcome.ref));
  mutate(value);
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/stage-outcomes/verify-code/${sha256(raw)}.json`;
  state.context.kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: sha256(raw), value };
}

function formalReview(state, provider = "dsh-canonical") {
  return writeFormalReviewFixture({
    task: state.task,
    stage: "verify-code",
    snapshotTree: state.candidate.captureSnapshot().tree,
    verdict: "pass",
    materialRevision: state.context.kernel.currentVNextMaterialRevision(),
    provider,
  });
}

describe("verify-code canonical review binding derivation", () => {
  it("derives the exact dsh-code-review pair from the authenticated outcome when host omits it", async () => {
    const state = fixture("verify-code-binding-derivation-omission");
    const review = formalReview(state);
    const outcome = publishOutcome(state, review);
    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: outcome.ref },
    });
    const reviewHash = sha256(state.task.readRecord(review.resultRef));
    const codeReviewFact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review" && fact.subject === "code_review");

    expect(codeReviewFact).toHaveLength(1);
    expect(codeReviewFact[0]).toMatchObject({
      status: "recorded",
      evidence: [{ ref: review.resultRef, sha256: reviewHash }],
    });
    expect(result.code_review).toMatchObject({
      quality_review_ref: review.resultRef,
      quality_review_hash: reviewHash,
    });
  });

  it("accepts an equal host ref without changing the authenticated binding", async () => {
    const state = fixture("verify-code-binding-derivation-equal-host");
    const review = formalReview(state);
    const outcome = publishOutcome(state, review);
    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: outcome.ref, quality_review: review.resultRef },
    });
    const codeReviewFact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .find((fact) => fact.kind === "review" && fact.subject === "code_review");

    expect(codeReviewFact.evidence[0]).toMatchObject({
      ref: review.resultRef,
      sha256: sha256(state.task.readRecord(review.resultRef)),
    });
  });

  it("keeps a malformed optional outcome unavailable without deriving code-review quality", async () => {
    const state = fixture("verify-code-binding-derivation-missing-pair");
    const outcome = publishOutcome(state);
    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: outcome.ref },
    });
    expect(result).toMatchObject({
      stage_outcome_ref: null,
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: {
        status: "unavailable",
        reason: "stage_outcome_invalid",
        error_code: "MATERIAL_INCOMPLETE",
      },
      quality_status: "incomplete",
    });
    const codeReviewFacts = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review" && fact.subject === "code_review");
    expect(codeReviewFacts).toHaveLength(1);
    expect(codeReviewFacts[0]).toMatchObject({ status: "missing" });
  });

  it("keeps a completed outcome that binds an unavailable review attempt unavailable", async () => {
    const state = fixture("verify-code-binding-derivation-attempt-ref");
    const review = formalReview(state);
    const outcome = publishOutcome(state, review);
    const tampered = tamperOutcome(state, outcome, (value) => {
      value.code_review.quality_review_ref = review.attemptRef;
      value.code_review.quality_review_hash = sha256(state.task.readRecord(review.attemptRef));
    });

    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: tampered.ref },
    });
    expect(result).toMatchObject({
      stage_outcome_ref: null,
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: {
        status: "unavailable",
        reason: "stage_outcome_invalid",
        error_code: "MATERIAL_INCOMPLETE",
      },
      quality_status: "incomplete",
    });
  });

  it("rejects non-canonical leading-dot review refs before path resolution", async () => {
    const state = fixture("verify-code-binding-derivation-noncanonical-ref");
    const review = formalReview(state);
    const outcome = publishOutcome(state, review);
    const tampered = tamperOutcome(state, outcome, (value) => {
      value.code_review.quality_review_ref = "quality/reviews/attempts/.hidden/attempt.json";
      value.code_review.quality_review_hash = "0".repeat(64);
    });

    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: tampered.ref },
    });
    expect(result).toMatchObject({
      stage_outcome_ref: null,
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: {
        status: "unavailable",
        reason: "stage_outcome_invalid",
        error_code: "MATERIAL_INCOMPLETE",
      },
      quality_status: "incomplete",
    });
  });

  it("keeps a malformed bound review hash unavailable without publishing code-review quality", async () => {
    const state = fixture("verify-code-binding-derivation-malformed-hash");
    const review = formalReview(state);
    const outcome = publishOutcome(state, review);
    const tampered = tamperOutcome(state, outcome, (value) => {
      value.code_review.quality_review_hash = "0".repeat(64);
    });

    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: tampered.ref },
    });
    expect(result).toMatchObject({
      stage_outcome_ref: null,
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: {
        status: "unavailable",
        reason: "stage_outcome_invalid",
        error_code: "MATERIAL_INCOMPLETE",
      },
      quality_status: "incomplete",
    });
  });

  it("rejects a host ref conflict with a frozen non-enumerable binding diagnostic", async () => {
    const state = fixture("verify-code-binding-derivation-host-conflict");
    const outcomeReview = formalReview(state, "dsh-canonical");
    const hostReview = formalReview(state, "host-supplied");
    const outcome = publishOutcome(state, outcomeReview);
    const error = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: outcome.ref, quality_review: hostReview.resultRef },
    }).then(() => null, (caught) => caught);

    expect(error).toBeInstanceOf(Error);
    expect(Object.keys(error)).not.toContain("diagnostic");
    expect(error.diagnostic).toEqual({
      check_id: "review_binding",
      expected: { ref: outcomeReview.resultRef, hash: sha256(state.task.readRecord(outcomeReview.resultRef)) },
      actual: { ref: hostReview.resultRef },
    });
    expect(Object.isFrozen(error.diagnostic)).toBe(true);
  });
});
