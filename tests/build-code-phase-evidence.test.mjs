import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter, createCanonicalReviewWriter, writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../core/workspace.mjs";
import { validatePhaseGate } from "../scripts/phase-gate.mjs";
import { stageRuntimeMain } from "../scripts/stage-runtime.mjs";
import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const acceptanceCoverage = (snapshotTree, criterion = "PHASE-REPAIR") => ({ snapshot_tree: snapshotTree, accepted_criterion_ids: [criterion], items: [{ acceptance_criterion_id: criterion, status: "unknown", evidence_refs: [] }] });

function accept(kernel, stage, facts, human = false, upstream_refs = []) {
  const attempt = kernel.publishAttempt(stage, { facts, upstream_refs });
  const confirmation = human ? kernel.confirmAttempt(stage, attempt.attempt_ref, "accepted").ref : undefined;
  kernel.acceptAttempt(stage, attempt.attempt_ref, confirmation);
}

function fixture(taskId = "phase-evidence") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase-evidence-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  writeFileSync(join(repo, "AGENTS.md"), "# Host contract\n");
  git(repo, ["add", "README.md", "AGENTS.md"]);
  git(repo, ["commit", "-qm", "base"]);
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
    created_at: "2026-07-21T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task);
  accept(kernel, "make-decision", {
    worktree_root: candidate.worktreeRoot,
    baseline_commit: candidate.baselineCommit,
    snapshot_tree: candidate.captureSnapshot().tree,
  }, true);
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const bound = createTaskKernel(task, { workspace, artifacts });
  artifacts.writeAtomic("spec.md", "# Spec\n");
  accept(bound, "build-spec", { spec_ref: artifacts.reference("spec.md"), checkpoint: bound.createCheckpoint("build-spec") }, false,
    [{ task_id: taskId, stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }]);
  artifacts.writeAtomic("plan.md", "# Plan\n");
  artifacts.writeAtomic("tasks.md", "# Tasks\n");
  accept(bound, "build-plan", {
    plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: bound.createCheckpoint("build-plan"),
  }, true, [{ task_id: taskId, stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }]);
  return { root, task, workspace, kernel: bound };
}

function phaseReceipts(state, name, { revisionOf } = {}) {
  writeFileSync(join(state.workspace.worktreeRoot, `${name}.txt`), `${name}\n`);
  const implementation = writeOfficialComponentReceipt({
    task: state.task, workspace: state.workspace, stage: "build-code", component: "implementation",
    payload: { phase_completion: true }, ...(revisionOf ? { revisionOf } : {}),
  });
  const tests = createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace, stage: "build-code", component: "build-code-test-capture" })
    .captureTests({ command: "true", receiptRef: `receipts/${name}-green.json`, outputRef: `evidence/${name}-green.txt` });
  return { implementation, tests };
}

function redReceipt(state, name) {
  return createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace, stage: "build-code", component: "build-code-test-capture" })
    .captureTests({ command: "false", receiptRef: `receipts/${name}-red.json`, outputRef: `evidence/${name}-red.txt` });
}

function formalPhaseReview(state, published, verdict = "pass") {
  const writer = createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "build-code" });
  const suffix = `${published.phase_id}-${verdict}-${published.snapshot_tree.slice(0, 8)}`;
  const attemptRef = `reviews/attempts/${suffix}/attempt.json`;
  const outputRef = `reviews/attempts/${suffix}/providers/fixture.output.json`;
  const resultRef = `reviews/results/${suffix}.json`;
  const source = {
    target_commit: published.implementation_commit, base_commit: published.baseline_commit,
    base_tree: published.base_tree, captured_head: published.implementation_commit,
  };
  const subject = {
    subject_kind: "phase", phase_id: published.phase_id,
    base_tree: published.base_tree, candidate_tree: published.snapshot_tree,
  };
  const finding = { severity: "major", path: "fixture", issue: "fix", recommendation: "repair" };
  const output = { verdict, summary: "fixture", findings: verdict === "pass" ? [] : [finding] };
  writer.writeProviderOutput(outputRef, JSON.stringify(output));
  const materialId = sha256(`${suffix}:material`);
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: suffix, task_id: state.task.identity.taskId, stage: "build-code",
    review_track: null, source, snapshot_tree: published.snapshot_tree, material_id: materialId, ...subject,
    provider_attempts: [{ provider: "fixture", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: outputRef, error: null }],
    terminal_status: "semantic", error: null,
  });
  writer.writeResult(resultRef, {
    version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage: "build-code", review_track: null,
    source, snapshot_tree: published.snapshot_tree, material_id: materialId, attempt_ref: attemptRef, ...subject,
    provider_results: [{ provider: "fixture", output }], verdict,
    findings: verdict === "pass" ? [] : [{ provider: "fixture", ...finding }],
  });
  return resultRef;
}

function formalWorktreeReview(state, published, verdict = "revise_required") {
  const writer = createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "build-code" });
  const suffix = `worktree-${verdict}-${published.snapshot_tree.slice(0, 8)}`;
  const attemptRef = `reviews/attempts/${suffix}/attempt.json`;
  const outputRef = `reviews/attempts/${suffix}/providers/fixture.output.json`;
  const resultRef = `reviews/results/${suffix}.json`;
  const source = {
    target_commit: published.implementation_commit, base_commit: published.baseline_commit,
    base_tree: published.base_tree, captured_head: published.implementation_commit,
  };
  const subject = { subject_kind: "worktree", phase_id: null, base_tree: published.base_tree, candidate_tree: published.snapshot_tree };
  const finding = { severity: "major", path: "fixture", issue: "final review requires repair", recommendation: "repair the owning Phase" };
  const output = { verdict, summary: "fixture", findings: verdict === "pass" ? [] : [finding] };
  writer.writeProviderOutput(outputRef, JSON.stringify(output));
  const materialId = sha256(`${suffix}:material`);
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: suffix, task_id: state.task.identity.taskId, stage: "build-code",
    review_track: null, source, snapshot_tree: published.snapshot_tree, material_id: materialId, ...subject,
    provider_attempts: [{ provider: "fixture", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: outputRef, error: null }],
    terminal_status: "semantic", error: null,
  });
  writer.writeResult(resultRef, {
    version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage: "build-code", review_track: null,
    source, snapshot_tree: published.snapshot_tree, material_id: materialId, attempt_ref: attemptRef, ...subject,
    provider_results: [{ provider: "fixture", output }], verdict,
    findings: verdict === "pass" ? [] : [{ provider: "fixture", ...finding }],
  });
  return resultRef;
}

function publish(state, phaseId, receipts, extra = {}) {
  return publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
    phase_id: phaseId,
    implementation_receipt_ref: receipts.implementation.ref,
    green_test_receipt_ref: receipts.tests.receipt_ref,
    allowed_files: [`${phaseId}.txt`],
    ...extra,
  });
}

function controlledReopen(state, published, receipts, reviewRef) {
  const testReceipt = JSON.parse(state.task.readRecord(receipts.tests.receipt_ref));
  const reviewRaw = state.task.readRecord(reviewRef);
  const testFacts = {
    command: testReceipt.command, exit_code: testReceipt.exit_code,
    command_hash: testReceipt.command_hash, snapshot_head: testReceipt.snapshot_head,
    snapshot_tree: testReceipt.snapshot_tree, snapshot_commit: testReceipt.snapshot_commit,
    started_at: testReceipt.started_at, completed_at: testReceipt.completed_at,
    receipt_ref: receipts.tests.receipt_ref, receipt_hash: sha256(state.task.readRecord(receipts.tests.receipt_ref)),
    output_ref: testReceipt.output_ref, output_hash: testReceipt.output_hash,
  };
  const reviewFacts = {
    verdict: "pass", result_ref: reviewRef, result_hash: sha256(reviewRaw),
    snapshot_tree: published.snapshot_tree,
  };
  accept(state.kernel, "build-code", {
    changed: [`${published.phase_id}.txt`], tests: testFacts, review: reviewFacts, phase_completion: true,
    acceptance_coverage: acceptanceCoverage(testFacts.snapshot_tree),
  }, false, [{ task_id: state.task.identity.taskId, stage: "build-plan", accepted_ref: "results/build-plan/accepted.json" }]);

  const failureRef = "evidence/acceptance-reopened-phase.json";
  const failureRaw = `${JSON.stringify({
    schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "PHASE-REPAIR",
    result: "fail", refs: [{ ref: testReceipt.output_ref, sha256: testReceipt.output_hash }],
  }, null, 2)}\n`;
  state.kernel.publishCanonicalRecord(failureRef, failureRaw);
  const verify = state.kernel.publishAttempt("verify-code", {
    facts: { tests: testFacts, review: reviewFacts, evidence_refs: [{ ref: failureRef, sha256: sha256(failureRaw) }] },
    evidence_refs: [{ ref: failureRef, sha256: sha256(failureRaw) }],
    upstream_refs: [{ task_id: state.task.identity.taskId, stage: "build-code", accepted_ref: "results/build-code/accepted.json" }],
  });
  return state.kernel.reopenBuildCode({ verifyAttemptRef: verify.attempt_ref, failureEvidenceRef: failureRef });
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("build-code phase evidence publication", () => {
  it("reuses identical implementation diff evidence during a same-snapshot revision", () => {
    const state = fixture("same-snapshot-revision");
    const first = writeOfficialComponentReceipt({ task: state.task, workspace: state.workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true } });
    const repeated = writeOfficialComponentReceipt({ task: state.task, workspace: state.workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true }, revisionOf: first.ref });
    expect(repeated.value.diff_ref).toBe(first.value.diff_ref);
  });

  it("accepts only a complete host-managed runtime block outside the implementation snapshot", () => {
    const runtime = fixture("runtime-context");
    const runtimeAgents = join(runtime.workspace.worktreeRoot, "AGENTS.md");
    writeFileSync(runtimeAgents, [
      "# Host contract",
      "<!-- BEGIN HOST-RUNTIME (auto-managed; do not edit) -->",
      "decision-maker runtime detail",
      "<!-- END HOST-RUNTIME -->",
      "",
    ].join("\n"));
    const runtimeReceipts = phaseReceipts(runtime, "phase-1");
    writeFileSync(runtimeAgents, [
      "# Host contract",
      "<!-- BEGIN HOST-RUNTIME (auto-managed; do not edit) -->",
      "coder runtime detail",
      "<!-- END HOST-RUNTIME -->",
      "",
    ].join("\n"));
    expect(publish(runtime, "phase-1", runtimeReceipts).snapshot_tree).toBe(runtimeReceipts.implementation.value.snapshot_tree);

    const outer = fixture("runtime-context-outer");
    const outerAgents = join(outer.workspace.worktreeRoot, "AGENTS.md");
    writeFileSync(outerAgents, [
      "# Host contract",
      "<!-- BEGIN HOST-RUNTIME (auto-managed; do not edit) -->",
      "task-local runtime detail",
      "<!-- END HOST-RUNTIME -->",
      "",
    ].join("\n"));
    const outerReceipts = phaseReceipts(outer, "phase-1");
    writeFileSync(outerAgents, "# Changed host contract\n");
    expect(() => publish(outer, "phase-1", outerReceipts)).toThrow(/Workspace.*drift/i);

    const malformed = fixture("runtime-context-malformed");
    const malformedAgents = join(malformed.workspace.worktreeRoot, "AGENTS.md");
    writeFileSync(malformedAgents, [
      "# Host contract",
      "<!-- BEGIN HOST-RUNTIME (auto-managed; do not edit) -->",
      "task-local runtime detail",
      "<!-- END HOST-RUNTIME -->",
      "",
    ].join("\n"));
    const malformedReceipts = phaseReceipts(malformed, "phase-1");
    writeFileSync(malformedAgents, [
      "# Host contract",
      "<!-- BEGIN OTHER-RUNTIME (auto-managed; do not edit) -->",
      "task-local runtime detail",
      "<!-- END OTHER-RUNTIME -->",
      "",
    ].join("\n"));
    expect(() => publish(malformed, "phase-1", malformedReceipts)).toThrow(/Workspace.*drift/i);
  });

  it("derives the first baseline, publishes pre-review evidence, attaches PASS, and reuses the same identity", () => {
    const state = fixture();
    const red = redReceipt(state, "phase-1");
    const receipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", receipts, { red_evidence_ref: red.receipt_ref });
    expect(first.baseline_commit).toBe(state.kernel.readAccepted("build-plan").accepted.checkpoint.commit_oid);
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({ phase_id: "phase-1", status: "awaiting_review" });

    const reviewRef = formalPhaseReview(state, first);
    const reviewed = publish(state, "phase-1", receipts, { red_evidence_ref: red.receipt_ref, review_result_ref: reviewRef });
    expect(reviewed.diff_scan_ref).toBe(first.diff_scan_ref);
    expect(reviewed.review_result_ref).toBe(reviewRef);
    const phaseResult = JSON.parse(state.task.readRecord("phase-result.json"));
    expect(validatePhaseGate(phaseResult, state.workspace.worktreeRoot, { baseDir: state.task.taskPath, reviewDataRoot: state.task.taskPath }).ok).toBe(true);
    expect(publish(state, "phase-1", receipts, { red_evidence_ref: red.receipt_ref, review_result_ref: reviewRef }).diff_scan_ref).toBe(first.diff_scan_ref);
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({
      status: "done", declared_allowed_files: ["phase-1.txt"],
    });
    const changed = phaseReceipts(state, "after-pass", { revisionOf: receipts.implementation.ref });
    const changedInput = {
      phase_id: "phase-1", implementation_receipt_ref: changed.implementation.ref,
      green_test_receipt_ref: changed.tests.receipt_ref, allowed_files: ["after-pass.txt", "phase-1.txt"],
    };
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, changedInput))
      .toThrow(/PASS Phase.*closed/i);
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      ...changedInput, previous_phase_review_ref: reviewRef,
    })).toThrow(/PASS Phase.*closed|revise_required/i);
  });

  it("reopens only the current PASS Phase through an authenticated build-code reopen", () => {
    const state = fixture("controlled-phase-reopen");
    const receipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", receipts);
    const firstReview = formalPhaseReview(state, first);
    publish(state, "phase-1", receipts, { review_result_ref: firstReview });
    const reopen = controlledReopen(state, first, receipts, firstReview);

    const repaired = phaseReceipts(state, "phase-1-reopened", { revisionOf: receipts.implementation.ref });
    const reopened = publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-1-reopened.txt"],
      reopen_ref: reopen.reopen_ref,
    });
    expect(reopened.baseline_commit).toBe(first.baseline_commit);
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({
      phase_id: "phase-1", status: "awaiting_review", reopen_ref: reopen.reopen_ref,
    });

    const reopenedReview = formalPhaseReview(state, reopened);
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-1-reopened.txt"],
      review_result_ref: reopenedReview,
    })).toThrow(/reopen_ref/i);
    publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-1-reopened.txt"],
      review_result_ref: reopenedReview, reopen_ref: reopen.reopen_ref,
    });

    const secondRepair = phaseReceipts(state, "phase-1-reopened-again", { revisionOf: repaired.implementation.ref });
    const secondReopened = publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: secondRepair.implementation.ref,
      green_test_receipt_ref: secondRepair.tests.receipt_ref,
      allowed_files: ["phase-1.txt", "phase-1-reopened.txt", "phase-1-reopened-again.txt"],
      reopen_ref: reopen.reopen_ref,
    });
    expect(secondReopened.snapshot_tree).not.toBe(reopened.snapshot_tree);
    expect(secondReopened.baseline_commit).toBe(first.baseline_commit);
  });

  it("rejects reopen authority for an unchanged or non-current Phase", () => {
    const state = fixture("controlled-phase-scope");
    const receipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", receipts);
    const reviewRef = formalPhaseReview(state, first);
    publish(state, "phase-1", receipts, { review_result_ref: reviewRef });
    const reopen = controlledReopen(state, first, receipts, reviewRef);

    expect(() => publish(state, "phase-1", receipts, { review_result_ref: reviewRef, reopen_ref: reopen.reopen_ref }))
      .toThrow(/changed.*identity|reopen/i);
    const later = phaseReceipts(state, "phase-2", { revisionOf: receipts.implementation.ref });
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-2", implementation_receipt_ref: later.implementation.ref,
      green_test_receipt_ref: later.tests.receipt_ref, previous_phase_review_ref: reviewRef,
      allowed_files: ["phase-2.txt"], reopen_ref: reopen.reopen_ref,
    })).toThrow(/current.*Phase|phase_id/i);
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: later.implementation.ref,
      green_test_receipt_ref: later.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-2.txt"],
      reopen_ref: "results/build-code/revisions/reopen-9999.json",
    })).toThrow(/missing|reopen|ENOENT/i);
  });

  it("requires a formal PASS predecessor and derives the next baseline from it", () => {
    const state = fixture();
    const firstReceipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", firstReceipts);
    const reviewRef = formalPhaseReview(state, first);
    publish(state, "phase-1", firstReceipts, { review_result_ref: reviewRef });
    const secondReceipts = phaseReceipts(state, "phase-2", { revisionOf: firstReceipts.implementation.ref });
    const second = publish(state, "phase-2", secondReceipts, { previous_phase_review_ref: reviewRef });
    expect(second.baseline_commit).toBe(first.implementation_commit);
  });

  it("rejects non-PASS predecessors, unknown fields, drift, wrong provenance, and allowlist violations", () => {
    const nonPass = fixture("non-pass");
    const firstReceipts = phaseReceipts(nonPass, "phase-1");
    const first = publish(nonPass, "phase-1", firstReceipts);
    const reviewRef = formalPhaseReview(nonPass, first, "revise_required");
    publish(nonPass, "phase-1", firstReceipts, { review_result_ref: reviewRef });
    const secondReceipts = phaseReceipts(nonPass, "phase-2", { revisionOf: firstReceipts.implementation.ref });
    expect(() => publish(nonPass, "phase-2", secondReceipts, { previous_phase_review_ref: reviewRef })).toThrow(/PASS|pass/);

    const invalid = fixture("invalid-input");
    const invalidReceipts = phaseReceipts(invalid, "phase-1");
    expect(() => publish(invalid, "phase-1", invalidReceipts, { provider: "forbidden" })).toThrow(/unknown|only/i);
    writeFileSync(join(invalid.workspace.worktreeRoot, "drift.txt"), "drift\n");
    expect(() => publish(invalid, "phase-1", invalidReceipts)).toThrow(/Workspace|snapshot|drift/i);

    const wrong = fixture("wrong-ref");
    const wrongRaw = `${JSON.stringify({ task_id: "another-task", stage: "build-code" })}\n`;
    wrong.kernel.publishCanonicalRecord("receipts/revisions/implementation/wrong.json", wrongRaw);
    const wrongTests = phaseReceipts(wrong, "phase-1");
    expect(() => publishBuildCodePhaseEvidence({ task: wrong.task, kernel: wrong.kernel, workspace: wrong.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: "receipts/revisions/implementation/wrong.json",
      green_test_receipt_ref: wrongTests.tests.receipt_ref, allowed_files: ["phase-1.txt"],
    })).toThrow(/provenance|task|receipt/i);

    const outside = fixture("outside-scope");
    const outsideReceipts = phaseReceipts(outside, "phase-1");
    expect(() => publishBuildCodePhaseEvidence({ task: outside.task, kernel: outside.kernel, workspace: outside.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: outsideReceipts.implementation.ref,
      green_test_receipt_ref: outsideReceipts.tests.receipt_ref, allowed_files: [],
    })).toThrow(/allowlist|safe|scope/i);
  });

  it("creates a new identity only after a revise-required review of the same phase", () => {
    const state = fixture();
    const firstReceipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", firstReceipts);
    const reviseRef = formalPhaseReview(state, first, "revise_required");
    publish(state, "phase-1", firstReceipts, { review_result_ref: reviseRef });
    const repaired = phaseReceipts(state, "phase-1-repair", { revisionOf: firstReceipts.implementation.ref });
    const next = publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref,
      previous_phase_review_ref: reviseRef, allowed_files: ["phase-1.txt", "phase-1-repair.txt"],
    });
    expect(next.snapshot_tree).not.toBe(first.snapshot_tree);
    expect(next.diff_scan_ref).not.toBe(first.diff_scan_ref);
  });

  it("allows a final worktree revise-required result to repair the current Phase before build acceptance", () => {
    const state = fixture("pre-accept-final-review-repair");
    const firstReceipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", firstReceipts);
    const firstPhaseReview = formalPhaseReview(state, first);
    publish(state, "phase-1", firstReceipts, { review_result_ref: firstPhaseReview });

    const finalReview = formalWorktreeReview(state, first);
    const repaired = phaseReceipts(state, "phase-1-repair", { revisionOf: firstReceipts.implementation.ref });
    const repairedPending = publish(state, "phase-1", repaired, {
      allowed_files: ["phase-1.txt", "phase-1-repair.txt"], repair_review_result_ref: finalReview,
    });
    expect(repairedPending.snapshot_tree).not.toBe(first.snapshot_tree);
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({
      status: "awaiting_review", repair_review_result_ref: finalReview,
    });

    const repairedPhaseReview = formalPhaseReview(state, repairedPending);
    const repairedDone = publish(state, "phase-1", repaired, {
      allowed_files: ["phase-1.txt", "phase-1-repair.txt"], review_result_ref: repairedPhaseReview,
    });
    expect(repairedDone.review_verdict).toBe("pass");
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({
      status: "done", repair_review_result_ref: finalReview,
    });

    const testReceipt = JSON.parse(state.task.readRecord(repaired.tests.receipt_ref));
    accept(state.kernel, "build-code", {
      changed: ["phase-1.txt", "phase-1-repair.txt"],
      tests: {
        command: testReceipt.command, exit_code: testReceipt.exit_code, command_hash: testReceipt.command_hash,
        snapshot_head: testReceipt.snapshot_head, snapshot_tree: testReceipt.snapshot_tree, snapshot_commit: testReceipt.snapshot_commit,
        started_at: testReceipt.started_at, completed_at: testReceipt.completed_at, receipt_ref: repaired.tests.receipt_ref,
        receipt_hash: sha256(state.task.readRecord(repaired.tests.receipt_ref)), output_ref: testReceipt.output_ref, output_hash: testReceipt.output_hash,
      },
      review: { verdict: "pass", result_ref: repairedPhaseReview, result_hash: sha256(state.task.readRecord(repairedPhaseReview)), snapshot_tree: repairedDone.snapshot_tree },
      phase_completion: true,
      acceptance_coverage: acceptanceCoverage(testReceipt.snapshot_tree),
    }, false, [{ task_id: state.task.identity.taskId, stage: "build-plan", accepted_ref: "results/build-plan/accepted.json" }]);

    const late = phaseReceipts(state, "phase-1-late", { revisionOf: repaired.implementation.ref });
    const lateReview = formalWorktreeReview(state, repairedDone);
    expect(() => publish(state, "phase-1", late, {
      allowed_files: ["phase-1.txt", "phase-1-repair.txt", "phase-1-late.txt"], repair_review_result_ref: lateReview,
    })).toThrow(/unavailable after build-code acceptance/i);
  });

  it("rejects candidate-bound RED, unsafe or duplicate paths, and extra public command flags", async () => {
    const state = fixture();
    const receipts = phaseReceipts(state, "phase-1");
    const candidateRed = createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace, stage: "build-code", component: "build-code-test-capture" })
      .captureTests({ command: "false", receiptRef: "receipts/candidate-red.json", outputRef: "evidence/candidate-red.txt" });
    expect(() => publish(state, "phase-1", receipts, { red_evidence_ref: candidateRed.receipt_ref })).toThrow(/RED.*baseline/i);
    for (const allowed_files of [["bad\\path"], ["./bad"], ["bad//path"], ["same", "same"]]) {
      expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
        phase_id: "phase-1", implementation_receipt_ref: receipts.implementation.ref,
        green_test_receipt_ref: receipts.tests.receipt_ref, allowed_files,
      })).toThrow(/allowed_files|relative/i);
    }
    await expect(stageRuntimeMain([
      "publish-phase-evidence", "--stage=build-code", "--project=Demo", "--task=phase-evidence",
      "--input=/tmp/input.json", "--provider=forbidden",
    ])).rejects.toThrow(/accepts only/i);
  });

  it("recomputes test output and commit trees and restricts the official test producer", () => {
    const state = fixture();
    const receipts = phaseReceipts(state, "phase-1");
    const original = JSON.parse(state.task.readRecord(receipts.tests.receipt_ref));
    const cases = [
      ["bad-output", { ...original, output_hash: "0".repeat(64) }, /output hash/i],
      ["bad-producer", { ...original, producer: { ...original.producer, component: "forged" } }, /provenance/i],
      ["bad-tree", { ...original, snapshot_commit: state.kernel.readAccepted("build-plan").accepted.checkpoint.commit_oid }, /snapshot_commit tree/i],
    ];
    for (const [name, value, message] of cases) {
      const ref = `receipts/${name}.json`;
      state.kernel.publishCanonicalRecord(ref, `${JSON.stringify(value, null, 2)}\n`);
      expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
        phase_id: "phase-1", implementation_receipt_ref: receipts.implementation.ref,
        green_test_receipt_ref: ref, allowed_files: ["phase-1.txt"],
      })).toThrow(message);
    }
  });
});

describe("build-code composition contract", () => {
  const skill = readFileSync(new URL("../workflows/build-code/SKILL.md", import.meta.url), "utf8");

  it("is host-neutral and lets one executor run coordination then phase execution", () => {
    expect(skill).toMatch(/Stage coordination|阶段协调/);
    expect(skill).toMatch(/Phase execution|Phase执行/);
    expect(skill).toMatch(/single executor|同一执行者/i);
    for (const forbidden of ["Multica", "Code Builder", "Coder", "Issue", "mention", "provider", "model"])
      expect(skill, forbidden).not.toContain(forbidden);
  });

  it("keeps the Phase Card factual and the full repair loop inside Phase execution", () => {
    expect(skill).toMatch(/Phase Card[\s\S]*StageContext[\s\S]*accepted records/);
    expect(skill).toMatch(/RED[\s\S]*GREEN[\s\S]*capture-tests[\s\S]*publish-phase-evidence[\s\S]*wh-review/);
    expect(skill).toMatch(/revise_required[\s\S]*same Phase[\s\S]*new identity[\s\S]*PASS[\s\S]*(?:return|返回)/i);
  });

  it("keeps one-executor and split execution sequences evidence-equivalent", () => {
    const coordination = ["phase-card", "phase-gate", "final-review", "stage-run"];
    const phase = ["RED", "GREEN", "tests", "phase-evidence", "phase-review", "return"];
    const singleExecutor = [coordination[0], ...phase, ...coordination.slice(1)];
    const splitExecution = [coordination[0], ...phase, ...coordination.slice(1)];
    expect(singleExecutor).toEqual(splitExecution);
    expect(singleExecutor.filter((step) => step === "phase-review")).toHaveLength(1);
    expect(singleExecutor.filter((step) => step === "phase-evidence")).toHaveLength(1);
  });
});
