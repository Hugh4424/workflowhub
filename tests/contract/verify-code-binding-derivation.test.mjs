import { afterEach, describe, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter, createCanonicalReviewWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { publishStageAgentOutcome } from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { deriveCurrentStatusDomains } from "../../tools/cli/stage-runtime.mjs";
import { aggregateProviderResults } from "../../skills/wh-review/scripts/review-result.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

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

function publishContentAddressedJson(state, directory, subject, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const digest = sha256(raw);
  const ref = `${directory}/${subject}-${digest}.json`;
  state.context.kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: digest };
}

function publishMissingE2eAcceptance(state, {
  mutateNested = () => {},
  mutateNestedBinding = (binding) => binding,
} = {}) {
  const snapshot = state.context.kernel.currentVNextSnapshot();
  const materialRevision = state.context.kernel.currentVNextMaterialRevision();
  const nested = {
    schema_version: "stage-quality-evidence.v1",
    task_id: state.task.identity.taskId,
    stage: "verify-code",
    subject: "e2e_acceptance",
    status: "missing",
    material_revision: materialRevision,
    snapshot_tree: snapshot.tree,
    subject_fact: { status: "missing", evidence_refs: [] },
  };
  mutateNested(nested, snapshot);
  const nestedBinding = publishContentAddressedJson(
    state,
    "quality/evidence/stage-quality/verify-code",
    "e2e_acceptance",
    nested,
  );
  const acceptance = publishContentAddressedJson(
    state,
    "quality/evidence/acceptance/verify-code",
    "e2e_acceptance",
    {
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "e2e_acceptance",
      result: "deferred",
      refs: [mutateNestedBinding(nestedBinding)],
      snapshot_tree: snapshot.tree,
      summary: { actual_outcome: "missing", evidence_type: "stage quality fact" },
    },
  );
  return state.context.kernel.publishVNextQualityFact("verify-code", {
    kind: "acceptance_criterion",
    status: "missing",
    subject: "e2e_acceptance",
    evidence: [{ ...acceptance, evidence_type: "acceptance_evidence" }],
  });
}

function readE2eAcceptanceFact(state) {
  const ref = state.task.listCanonicalQualityFactRefs().find((candidate) => {
    const fact = JSON.parse(state.task.readRecord(candidate));
    return fact.stage === "verify-code" && fact.kind === "acceptance_criterion" && fact.subject === "e2e_acceptance";
  });
  if (!ref) throw new Error("canonical e2e_acceptance quality fact was not published");
  const raw = state.task.readRecord(ref);
  return { ...JSON.parse(raw), ref, sha256: sha256(raw) };
}

function currentVerifyCodeStatus(state) {
  const currentSnapshot = state.context.kernel.currentVNextSnapshot();
  const materialRevision = state.context.kernel.currentVNextMaterialRevision();
  const materials = Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"]
    .map((name) => [name, state.context.artifacts.read(name)]));
  return deriveCurrentStatusDomains(state.context, {
    stage: "verify-code",
    currentSnapshot,
    materialRevision,
    materials,
  });
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

function formalReview(state, provider = "dsh-code-review", {
  verdict = "pass",
  findingSeverity = "major",
  materialRevision = state.context.kernel.currentVNextMaterialRevision(),
} = {}) {
  return writeFormalReviewFixture({
    task: state.task,
    stage: "verify-code",
    snapshotTree: state.candidate.captureSnapshot().tree,
    verdict,
    findingSeverity,
    materialRevision,
    provider,
  });
}

function findingReview(state, provider = "codex") {
  const snapshotTree = state.candidate.captureSnapshot().tree;
  const materialRevision = state.context.kernel.currentVNextMaterialRevision();
  const attemptId = randomUUID();
  const writer = createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "verify-code" });
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const outputRef = `quality/reviews/attempts/${attemptId}/providers/${Buffer.from(provider).toString("base64url")}-0.output.json`;
  const resultRef = `quality/reviews/results/verify-code-default-${attemptId}.json`;
  const finding = {
    severity: "major",
    path: "fixture",
    issue: "fixture finding",
    root_cause: "fixture intentionally models an anchored review finding",
    recommendation: "revise fixture",
    evidence_kind: "direct",
    evidence: "fixture evidence is intentionally anchored to the fixture path",
  };
  const providerOutput = { findings: [finding] };
  writer.writeProviderOutput(outputRef, JSON.stringify(providerOutput), {
    provider,
    evidence_anchor_valid: [true],
  });
  const materialId = sha256(`verify-code:null:${snapshotTree}:${attemptId}`);
  const source = { target_commit: snapshotTree, base_commit: snapshotTree, base_tree: snapshotTree, captured_head: snapshotTree };
  const subject = { subject_kind: "worktree", phase_id: null, review_scope: null, base_tree: snapshotTree, candidate_tree: snapshotTree };
  const adapter = provider === "dsh-code-review" ? "dsh" : provider.split("/", 1)[0];
  const identity = { provider, adapter, source_id: `${provider}-source`, config_id: `${provider}-config`, model: null };
  const reviewPolicy = {
    source: "wh_review.v2", mode: "single_round", minimum_heterologous: 1,
    requested_profiles: [provider], eligible_profiles: [provider], same_source_exclusions: [],
    effective_profiles: [{ provider, adapter, model: null, effort: null, thinking: null }],
  };
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: state.task.identity.taskId, stage: "verify-code",
    review_track: null, source, snapshot_tree: snapshotTree, material_id: materialId, material_revision: materialRevision, ...subject,
    review_policy: reviewPolicy, policy_snapshot_hash: sha256(canonicalJson(reviewPolicy)),
    provider_attempts: [{ provider, identity, status: "completed", session_id: "fixture-session", runtime_id: "fixture-runtime", output_ref: outputRef, error: null }],
    terminal_status: "semantic", error: null,
  });
  const aggregation = aggregateProviderResults([{ provider, review: providerOutput, evidenceAnchors: [true] }], 1);
  writer.writeResult(resultRef, {
    version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage: "verify-code", review_track: null,
    source, snapshot_tree: snapshotTree, material_id: materialId, material_revision: materialRevision, attempt_ref: attemptRef, ...subject,
    provider_results: [{ provider, output: providerOutput }],
    findings: aggregation.findings.map((item) => ({ provider: item.providers[0], ...item })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  });
  return Object.freeze({ resultRef, attemptRef });
}

async function ocrFindingReview(state) {
  const materialId = sha256("ocr repair fixture");
  const request = { stage: "verify-code", subject_kind: "worktree", host_provider: "codex/luna",
    materials: { implementation: "fixture before repair", acceptance_criteria: "AC-1: repair the fixture finding." } };
  const recorded = await recordSimpleReviewRequest({
    task: state.task, kernel: state.context.kernel, request,
    resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
    materialIdForRequest: () => materialId,
    runRound: async () => ({
      status: "available", stage: "verify-code", review_track: null, review_kind: null,
      subject_kind: "worktree", phase_id: null, review_scope: null, material_id: materialId,
      runtime_id: "ocr-repair-fixture", outcome: "completed",
      ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
      findings: [{ provider: "codex/luna", severity: "major", path: "fixture", line: 1,
        issue: "Fixture still contains the old value.", root_cause: "The source has not been repaired.",
        recommendation: "Replace the old value.", evidence_kind: "direct", evidence: "`before`" }],
      provider_results: [{ provider: "codex/luna", status: "completed",
        identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
        error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
        evidence_anchor_valid: [true],
      }],
    }),
  });
  return { resultRef: recorded.result_ref, attemptRef: recorded.attempt_ref };
}

function createRepairEvidence(state, review, commandLabel) {
  const sourcePath = join(state.candidate.worktreeRoot, "fixture");
  writeFileSync(sourcePath, "after\n");
  const receipt = createCanonicalReceiptWriter({
    task: state.task,
    workspace: openCurrentTaskWorkspace(state.task),
    stage: "verify-code",
    component: "verify-code-test-capture",
  }).captureTests({
    command: 'test "$(cat fixture)" = after',
    receiptRef: `quality/tests/${commandLabel}.json`,
    outputRef: `quality/tests/output/${commandLabel}.output`,
  });
  const reviewValue = JSON.parse(state.task.readRecord(review.resultRef));
  const repairs = reviewValue.findings.map(({ id }) => ({
    finding_id: id,
    status: "fixed",
    reason: "current source changes the reviewed finding and the affected check passed",
    source_refs: [{ path: "fixture", sha256: sha256(readFileSync(sourcePath)) }],
    check_refs: [{ ref: receipt.receipt_ref, sha256: receipt.receipt_hash }],
  }));
  return { reviewValue, repairs, receipt };
}

function commitRepairSourceBaseline(state) {
  writeFileSync(join(state.candidate.worktreeRoot, "fixture"), "before\n");
  execFileSync("git", ["add", "fixture"], { cwd: state.candidate.worktreeRoot, stdio: "ignore" });
  execFileSync("git", ["commit", "-qm", "add repair fixture source"], { cwd: state.candidate.worktreeRoot, stdio: "ignore" });
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
    const outcomeReview = formalReview(state, "dsh-code-review");
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

// The existing formalReview fixture deliberately has no execution binding.
// Admission of the explicit confirmation receipt must preserve that limitation.
describe("P3 T009 explicit confirmation receipt consumer", () => {
  it("admits a post-review confirmation without upgrading a historical review into execution acceptance", async () => {
    const state = fixture("p9-explicit-confirmation-receipt");
    const review = formalReview(state);
    const before = state.task.readRecord(review.resultRef);
    const outcome = publishOutcome(state, review);
    const confirmation = state.context.kernel.publishHumanConfirmation("verify-code", {
      decision: "accepted", subject_ref: review.resultRef,
      reply_text: "fixture user accepts this existing code review only", step_slug: "confirm-code-review-result",
    });
    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-binding-attempt",
      receipts: { stage_outcomes: outcome.ref, review: review.resultRef, confirmation: confirmation.ref },
    });
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find(({ subject }) => subject === "code_review")).toMatchObject({
      status: "recorded", evidence: [{ ref: review.resultRef, sha256: sha256(before) }],
    });
    expect(facts.some(({ subject, status }) => subject === "e2e_acceptance" && status === "passed")).toBe(false);
    expect(JSON.parse(state.task.readRecord(review.resultRef))).not.toHaveProperty("e2e_binding");
    expect(state.task.readRecord(review.resultRef)).toBe(before);
  });
});

describe("verify-code review currentness and resolved-source binding", () => {
  it("rejects a legacy DSH review even when its snapshot matches", async () => {
    const state = fixture("verify-code-review-material-revision-currentness");
    const reviewedSnapshot = state.candidate.captureSnapshot();
    const reviewedMaterialRevision = `revision-${sha256("historical verify-code materials")}`;
    const review = formalReview(state, "dsh-code-review", { materialRevision: reviewedMaterialRevision });
    const currentSnapshot = state.context.kernel.currentVNextSnapshot();
    const currentMaterialRevision = state.context.kernel.currentVNextMaterialRevision();
    expect(currentSnapshot.tree).toBe(reviewedSnapshot.tree);
    expect(currentMaterialRevision).not.toBe(reviewedMaterialRevision);

    await expect(runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-review-material-revision-currentness-attempt",
      receipts: { quality_review: review.resultRef },
    })).rejects.toThrow(/not an authenticated OCR delegation result/);
    const materials = Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"]
      .map((name) => [name, state.context.artifacts.read(name)]));
    const status = deriveCurrentStatusDomains(state.context, {
      stage: "verify-code",
      currentSnapshot,
      materialRevision: currentMaterialRevision,
      materials,
    });

    expect(status.stage_quality.predicates.code_review).toMatchObject({ status: "missing" });
  });

  it("does not mark a non-OCR current-session review repair resolved", async () => {
    const state = fixture("verify-code-non-dsh-current-review-repair");
    commitRepairSourceBaseline(state);
    const review = findingReview(state);
    const { repairs } = createRepairEvidence(state, review, "non-dsh-current-review-repair");

    await expect(runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-non-dsh-current-review-repair-attempt",
      receipts: { quality_review: review.resultRef },
      code_review_repairs: repairs,
    })).rejects.toThrow(/authenticated OCR provider result/i);
  });

  it("resolves current-session repairs from one authenticated OCR provider", async () => {
    const state = fixture("verify-code-ocr-current-review-repair");
    commitRepairSourceBaseline(state);
    const review = await ocrFindingReview(state);
    const { repairs } = createRepairEvidence(state, review, "ocr-current-review-repair");
    const result = await runOfficialStage("verify-code", state.context, {
      attempt_id: "verify-code-ocr-current-review-repair-attempt",
      receipts: { quality_review: review.resultRef },
      code_review_repairs: repairs,
    });
    const codeReviewFact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .find((fact) => fact.kind === "review" && fact.subject === "code_review");

    expect(codeReviewFact).toMatchObject({ status: "recorded", review_status: "resolved" });
    expect(result.completion.predicates.code_review).toMatchObject({ status: "satisfied" });
  });

  it("does not turn a retired stage-outcome review into an OCR repair", async () => {
    const state = fixture("verify-code-non-dsh-stage-outcome-repair");
    commitRepairSourceBaseline(state);
    const review = findingReview(state);
    const { reviewValue, repairs } = createRepairEvidence(state, review, "non-dsh-stage-outcome-repair");
    const reviewHash = sha256(state.task.readRecord(review.resultRef));
    expect(() => publishOutcome(state, review, "verify-code-non-dsh-stage-outcome-repair-attempt", {
      code_review: {
        quality_review_ref: review.resultRef,
        quality_review_hash: reviewHash,
        result: {
          status: "findings",
          findings: reviewValue.findings,
          repairs,
          summary: "fixture claims the non-DSH finding was fixed",
          focus: ["correctness", "lifecycle", "security", "consumer_fit", "test_strength"],
        },
      },
    })).toThrow(/manifests must declare architect-code-review/);
  });
});

describe("verify-code deferred E2E acceptance authentication", () => {
  it("authenticates a current missing fact and exposes the conditional predicate as missing", () => {
    const state = fixture("verify-code-e2e-acceptance-missing-authentication");
    publishMissingE2eAcceptance(state);

    const fact = readE2eAcceptanceFact(state);
    const authentication = authenticateQualityFactRecord(fact, { read: (ref) => state.task.readRecord(ref) });
    const status = currentVerifyCodeStatus(state);

    expect(authentication.authenticated).toBe(true);
    expect(fact.status).toBe("missing");
    expect(status.stage_quality.predicates.e2e_acceptance).toMatchObject({ status: "missing" });
  });

  it("does not project an authenticated missing fact from an older snapshot as current", () => {
    const state = fixture("verify-code-e2e-acceptance-old-snapshot");
    const recordedSnapshot = state.context.kernel.currentVNextSnapshot();
    publishMissingE2eAcceptance(state);
    const fact = readE2eAcceptanceFact(state);

    writeFileSync(join(state.candidate.worktreeRoot, "status-snapshot-advance.txt"), "new verification target\n");
    const currentSnapshot = state.context.kernel.currentVNextSnapshot();
    const authentication = authenticateQualityFactRecord(fact, { read: (ref) => state.task.readRecord(ref) });
    const status = currentVerifyCodeStatus(state);

    expect(authentication.authenticated).toBe(true);
    expect(fact.snapshot_tree).toBe(recordedSnapshot.tree);
    expect(currentSnapshot.tree).not.toBe(recordedSnapshot.tree);
    expect(status.stage_quality.predicates).not.toHaveProperty("e2e_acceptance");
    expect(status.stage_quality.fact_refs).not.toContain(fact.ref);
  });

  it.each([
    ["foreign task identity", (nested) => { nested.task_id = "another-task"; }],
    ["mismatched nested hash", () => {}, undefined, (binding) => ({ ...binding, sha256: "0".repeat(64) })],
    ["stale snapshot", (nested, snapshot) => {
      nested.snapshot_tree = snapshot.tree === "0".repeat(40) ? "1".repeat(40) : "0".repeat(40);
    }],
  ])("does not authenticate a missing fact with %s", (_label, mutateNested, _unused, mutateNestedBinding) => {
    const state = fixture(`verify-code-e2e-acceptance-invalid-${_label.replaceAll(" ", "-")}`);
    publishMissingE2eAcceptance(state, {
      mutateNested,
      ...(mutateNestedBinding ? { mutateNestedBinding } : {}),
    });

    const fact = readE2eAcceptanceFact(state);
    const authentication = authenticateQualityFactRecord(fact, { read: (ref) => state.task.readRecord(ref) });
    const status = currentVerifyCodeStatus(state);

    expect(authentication.authenticated).toBe(false);
    expect(status.stage_quality.predicates).not.toHaveProperty("e2e_acceptance");
    expect(status.stage_quality.fact_refs).not.toContain(fact.ref);
  });
});
