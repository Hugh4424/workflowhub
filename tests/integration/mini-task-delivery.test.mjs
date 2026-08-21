import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import {
  authorizeMiniTaskDelivery,
  confirmMiniTaskDelivery,
  createMiniTaskRunner,
  executeMiniTaskDelivery,
  prepareMiniTaskDelivery,
  recordMiniTaskDesignReview,
  recordMiniTaskQuality,
  runMiniTaskDesignReview,
  runMiniTaskImplementationReview,
} from "../../skills/mini-task/scripts/mini-task-runner.mjs";

describe("mini-task delivery RED contract", () => {
  it("exposes capture-review-record entrypoints instead of accepting caller-supplied pass status", async () => {
    const module = await import("../../skills/mini-task/scripts/mini-task-runner.mjs");
    expect(module).toHaveProperty("runMiniTaskDesignReview");
    expect(module).toHaveProperty("runMiniTaskImplementationReview");
    expect(module.recordMiniTaskDesignReview.toString()).not.toMatch(/status \?\? \"passed\"/);
  });

  it("requires a mini-task runner boundary", async () => {
    await expect(import("../../skills/mini-task/scripts/mini-task-runner.mjs")).resolves.toBeDefined();
  });

  it("runs one configured design review and derives recorded from canonical result", async () => {
    const state = deliveryFixture();
    const calls = [];
    const outcome = await runMiniTaskDesignReview({
      task: state.task,
      kernel: state.kernel,
      hostProvider: "codex",
      reviewRunner: async (input) => {
        calls.push(input);
        const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
        const raw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.design", attemptId: "runner-design" });
        const ref = "quality/reviews/results/mini-task-design-runner.json";
        publishReviewChain(state, { ref, raw });
        return { status: "available", result_ref: ref };
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ stage: "build-code", review_kind: "mini_task.design" });
    expect(calls[0]).not.toHaveProperty("providers");
    const fact = JSON.parse(state.task.readRecord(outcome.review.ref));
    expect(fact).toMatchObject({ subject: "mini_task_design_review", status: "recorded" });
  });

  it("projects the original requirement instead of sending the full decision log twice", async () => {
    const state = deliveryFixture();
    ArtifactDir.open(state.candidate.worktreeRoot, state.task).writeAtomic("decision-log.md", [
      "# Decision Log",
      "",
      "## 原始需求",
      "",
      "用户需要一个小功能。",
      "",
      "## 决定",
      "",
      "采用当前 mini-task 方案。",
      "",
    ].join("\n"));
    let captured;
    await runMiniTaskDesignReview({
      task: state.task,
      kernel: state.kernel,
      hostProvider: "codex",
      reviewRunner: async (input) => {
        captured = input.materials;
        const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
        const raw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.design", attemptId: "runner-design-dedup" });
        const ref = "quality/reviews/results/mini-task-design-runner-dedup.json";
        publishReviewChain(state, { ref, raw });
        return { status: "available", result_ref: ref };
      },
    });
    expect(captured.raw_requirement).toBe("## 原始需求\n\n用户需要一个小功能。\n");
    expect(captured.decision_log).toContain("## 决定");
    expect(captured.raw_requirement).not.toBe(captured.decision_log);
  });

  it("rejects caller-supplied review status instead of treating it as a fact", async () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const raw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.design", attemptId: "forged-status" });
    const ref = "quality/reviews/results/mini-task-design-forged-status.json";
    state.kernel.publishCanonicalRecord(ref, raw);
    expect(() => recordMiniTaskDesignReview({ task: state.task, kernel: state.kernel, review: { ref, sha256: sha256(raw), status: "passed" } })).toThrow("status is not accepted");
  });

  it("rejects a schema-valid mini review whose provider evidence does not match its attempt", () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const sourceRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.design", attemptId: "forged-chain" });
    const sourceRef = "quality/reviews/results/mini-task-design-authenticated.json";
    publishReviewChain(state, { ref: sourceRef, raw: sourceRaw });
    const forgedValue = JSON.parse(sourceRaw);
    forgedValue.provider_results = [{ provider: "forged/provider", output: { findings: [] } }];
    const forgedRaw = `${JSON.stringify(forgedValue)}\n`;
    const forgedRef = "quality/reviews/results/mini-task-design-forged-chain.json";
    state.kernel.publishCanonicalRecord(forgedRef, forgedRaw);
    expect(() => recordMiniTaskDesignReview({
      task: state.task, kernel: state.kernel, review: { ref: forgedRef, sha256: sha256(forgedRaw) },
    })).toThrow(/canonical authentication|aggregation|provider evidence/i);
  });

  it("records review unavailability without manufacturing a pass", async () => {
    const state = deliveryFixture();
    const outcome = await runMiniTaskDesignReview({
      task: state.task,
      kernel: state.kernel,
      hostProvider: "codex",
      reviewRunner: async () => ({ status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE" }),
    });
    expect(outcome.outcome.status).toBe("unavailable");
    expect(JSON.parse(state.task.readRecord(outcome.review.ref))).toMatchObject({ subject: "mini_task_design_review", status: "unavailable" });
  });

  it("freezes implementation tests, AC trace, user result, and review in one snapshot", async () => {
    const state = deliveryFixture();
    const workspace = openCurrentTaskWorkspace(state.task);
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace, stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-implementation.json", outputRef: "quality/tests/output/mini-task-implementation.output" });
    const evidenceRaw = `${JSON.stringify({ schema_version: "workflowhub-mini-task-ac-evidence.v1", task_id: state.taskId, snapshot_tree: receipt.snapshot_tree, result: "verified" })}\n`;
    const evidenceRef = "quality/evidence/mini-task-ac-evidence.json";
    state.kernel.publishCanonicalRecord(evidenceRef, evidenceRaw);
    const acTrace = {
      schema_version: "ac-change-test-trace.v1",
      snapshot_tree: receipt.snapshot_tree,
      acceptance_ids: ["AC-020"],
      entries: [{
        acceptance_criterion_id: "AC-020",
        expected: "mini-task produces the requested result",
        actual: "mini-task produced the requested result",
        status: "passed",
        change: [{ task_id: state.taskId, summary: "mini-task implementation" }],
        test: [{ receipt_ref: receipt.receipt_ref, receipt_hash: receipt.receipt_hash }],
        evidence: [{ ref: evidenceRef, sha256: sha256(evidenceRaw) }],
        anchors: [{ id: "A-020", path: "src/feature.txt", start_line: 1, end_line: 1, role: "implementation", reason: "feature behavior" }],
      }],
    };
    let reviewCalls = 0;
    const quality = await runMiniTaskImplementationReview({
      task: state.task,
      kernel: state.kernel,
      hostProvider: "codex",
      workspace,
      testCommand: "true",
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "success", observed: "success", oracle: "exit code 0" },
      acTrace,
      coverageLimits: ["temporary Git fixture"],
      skipReasons: ["no remote push"],
      remainingRisks: ["A resume remains caller-controlled"],
      humanConfirmation: { decision: "accepted", subject_ref: "mini-task-quality" },
      reviewRunner: async (input) => {
        reviewCalls += 1;
        expect(input.review_kind).toBe("mini_task.implementation");
        expect(input.materials).toMatchObject({ coverage_limits: ["temporary Git fixture"], skip_reasons: ["no remote push"] });
        const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
        const raw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "runner-implementation" });
        const ref = "quality/reviews/results/mini-task-implementation-runner.json";
        publishReviewChain(state, { ref, raw });
        return { status: "available", result_ref: ref };
      },
    });
    expect(reviewCalls).toBe(1);
    expect(quality).toMatchObject({ status: "ready", snapshot_tree: receipt.snapshot_tree });
    const packet = JSON.parse(state.task.readRecord(quality.evidence_ref));
    expect(packet).toMatchObject({ coverage_limits: ["temporary Git fixture"], skip_reasons: ["no remote push"], remaining_risks: ["A resume remains caller-controlled"] });
    expect(packet.ac_trace.snapshot_tree).toBe(receipt.snapshot_tree);
    const userResult = JSON.parse(state.task.readRecord(packet.user_result.ref));
    expect(userResult).toMatchObject({ evidence_type: "test_receipt", evidence_ref: receipt.receipt_ref, evidence_hash: receipt.receipt_hash });
  });

  it("requires the thin skill to preserve the four-material and two-review contract", async () => {
    const module = await import("../../skills/mini-task/scripts/mini-task-runner.mjs");
    expect(module).toHaveProperty("createMiniTaskRunner");
  });

  it("delivers a real mini-task through the existing six-step close and reads back Git state", async () => {
    const state = deliveryFixture();
    publishMiniTaskQualityFixture(state);
    const candidateRoot = state.candidate.worktreeRoot;
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    const completed = await executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    expect(completed.status).toBe("completed");
    expect(git(state.repo, ["rev-parse", "refs/heads/main"])).toBe(git(state.repo, ["rev-parse", "refs/remotes/origin/main"]));
    expect(git(state.repo, ["show", `main:specs/archive/${state.taskId}/spec.md`])).toContain("mini-task");
    expect(git(state.repo, ["cat-file", "-e", `main:specs/${state.taskId}/spec.md`], true).ok).toBe(false);
    expect(git(state.repo, ["show-ref", "--verify", "--quiet", `refs/heads/task/WorkflowHub/${state.taskId}`], true).ok).toBe(false);
    expect(existsSync(candidateRoot)).toBe(false);
    expect(state.task.readRecord("operations/close/completed.json")).toContain("completed");
    expect(state.task.taskPath.includes("successor")).toBe(false);
  });

  it("does not mutate Git when the confirmed plan has no irreversible authorization", async () => {
    const state = deliveryFixture();
    publishMiniTaskQualityFixture(state);
    const candidateRoot = state.candidate.worktreeRoot;
    const before = git(state.repo, ["rev-parse", "refs/heads/main"]);
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref })).rejects.toThrow("IRREVERSIBLE_AUTHORIZATION_REQUIRED");
    expect(git(state.repo, ["rev-parse", "refs/heads/main"])).toBe(before);
    expect(existsSync(candidateRoot)).toBe(true);
  });

  it("does not prepare delivery after only the design review", async () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const raw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.design", attemptId: "cancelled" });
    const ref = "quality/reviews/results/mini-task-design-cancelled.json";
    publishReviewChain(state, { ref, raw });
    const designFact = recordMiniTaskDesignReview({ task: state.task, kernel: state.kernel, review: { ref, sha256: sha256(raw) } });
    expect(() => prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery }))
      .toThrow(/fresh verify-code facts|test receipt snapshot_commit is unavailable/);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
    expect(state.task.readRecord(designFact.ref)).toContain("mini_task_design_review");
    expect(readFileSync(join(state.candidateRoot, "specs", state.taskId, "spec.md"), "utf8")).toContain("mini-task");
  });

  it("requires the implementation review, AC trace, and verified user result before close readiness", async () => {
    const state = deliveryFixture();
    const reviewRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: captureExecutionSnapshot(state.candidate.worktreeRoot).tree, reviewKind: "mini_task.implementation", attemptId: "missing-ac" });
    const reviewRef = "quality/reviews/results/mini-task-implementation.json";
    publishReviewChain(state, { ref: reviewRef, raw: reviewRaw });
    const review = { ref: reviewRef, sha256: sha256(reviewRaw) };
    await expect(() => recordMiniTaskQuality({ task: state.task, kernel: state.kernel, testCommand: "true", implementationReview: review, userResult: { status: "verified" } })).toThrow("AC trace is required");
  });

  it("rejects unstructured AC traces and user-result objects that only claim verified", async () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "strict" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-strict.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-implementation.json", outputRef: "quality/tests/output/mini-task-implementation.output" });
    await expect(() => recordMiniTaskQuality({
      task: state.task, kernel: state.kernel, testCommand: "true", capturedReceipt: receipt,
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified" }, acTrace: captureStructuredMiniAcTrace(state, receipt, "strict"),
    })).toThrow(/userResult\.method/);
    await expect(() => recordMiniTaskQuality({
      task: state.task, kernel: state.kernel, testCommand: "true", capturedReceipt: receipt,
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "success", observed: "success", oracle: "exit code 0" },
      acTrace: { "AC-020": "verified" },
    })).toThrow(/AC trace/);
  });

  it("requires the canonical user result to bind the focused test receipt", async () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "user-evidence" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-user-evidence.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-user-evidence.json", outputRef: "quality/tests/output/mini-task-user-evidence.output" });
    const userRaw = `${JSON.stringify({
      schema_version: "workflowhub-mini-task-user-result.v1", task_id: state.taskId,
      snapshot_tree: receipt.snapshot_tree, status: "verified", method: "focused command",
      scenario: "mini-task path", expected: "success", observed: "success", oracle: "exit code 0",
    })}\n`;
    const userRef = "quality/evidence/mini-task-user-result/forged-without-evidence.json";
    state.kernel.publishCanonicalRecord(userRef, userRaw);
    expect(() => recordMiniTaskQuality({
      task: state.task, kernel: state.kernel, testCommand: "true", capturedReceipt: receipt,
      capturedUserResult: { ref: userRef, sha256: sha256(userRaw) },
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "success", observed: "success", oracle: "exit code 0" },
      acTrace: captureStructuredMiniAcTrace(state, receipt, "user-evidence"),
    })).toThrow(/evidence_ref|focused test receipt|focused test binding is invalid/);
  });

  it("requires a reason when a mini-task AC is marked not applicable", async () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "not-applicable-reason" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-not-applicable-reason.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-not-applicable.json", outputRef: "quality/tests/output/mini-task-not-applicable.output" });
    expect(() => recordMiniTaskQuality({
      task: state.task, kernel: state.kernel, testCommand: "true", capturedReceipt: receipt,
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "not applicable", observed: "not applicable", oracle: "scope" },
      acTrace: captureStructuredMiniAcTrace(state, receipt, "not-applicable", "not_applicable"),
    })).toThrow(/not.?applicable.*reason/i);
  });

  it("keeps a well-formed not_applicable AC incomplete instead of treating it as passed", () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "not-applicable-incomplete" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-not-applicable-incomplete.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-not-applicable-incomplete.json", outputRef: "quality/tests/output/mini-task-not-applicable-incomplete.output" });
    const acTrace = captureStructuredMiniAcTrace(state, receipt, "not-applicable-incomplete", "not_applicable");
    acTrace.entries[0].reason_code = "no_ui";
    acTrace.entries[0].not_applicable_reason = "本 mini-task 没有用户界面路径";
    const quality = recordMiniTaskQuality({
      task: state.task, kernel: state.kernel, testCommand: "true", capturedReceipt: receipt,
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "not applicable", observed: "not applicable", oracle: "scope" },
      acTrace,
    });
    expect(quality.status).toBe("incomplete");
  });

  it("requires an explicit reason for an unknown mini-task AC", () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "unknown-reason" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-unknown-reason.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-unknown.json", outputRef: "quality/tests/output/mini-task-unknown.output" });
    expect(() => recordMiniTaskQuality({
      task: state.task, kernel: state.kernel, testCommand: "true", capturedReceipt: receipt,
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "unknown", observed: "unknown", oracle: "not enough evidence" },
      acTrace: captureStructuredMiniAcTrace(state, receipt, "unknown-reason", "unknown"),
    })).toThrow(/unknown reason/);
  });

  it("does not silently ignore a malformed canonical quality fact", () => {
    const state = deliveryFixture();
    state.kernel.publishCanonicalRecord(`quality/facts/${"f".repeat(64)}.json`, "{malformed\n");
    expect(() => prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery }))
      .toThrow(/QUALITY_FACT_INVALID|quality fact/i);
  });

  it("derives acceptance criteria from per-AC status instead of forcing passed", async () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "ac-status" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-ac-status.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "false", receiptRef: "quality/tests/mini-task-implementation.json", outputRef: "quality/tests/output/mini-task-implementation.output" });
    const quality = recordMiniTaskQuality({
      task: state.task, kernel: state.kernel, testCommand: "false", capturedReceipt: receipt,
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task failure path", expected: "failure is reported", observed: "failure was reported", oracle: "exit code 1" },
      acTrace: captureStructuredMiniAcTrace(state, receipt, "failed", "failed"),
    });
    expect(quality.status).toBe("incomplete");
    const facts = state.task.listCanonicalQualityFactRefs().map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.filter((fact) => fact.subject === "acceptance_criteria").at(-1).status).toBe("missing");
  });

  it("keeps a failed focused test as a clear delivery blocker", () => {
    const state = deliveryFixture();
    const quality = publishMiniTaskQualityFixture(state, {
      testCommand: "false",
      acStatus: "failed",
      userResult: {
        status: "verified", method: "focused command", scenario: "mini-task failure path",
        expected: "failure is reported", observed: "failure was reported", oracle: "exit code 1",
      },
    });
    expect(quality.status).toBe("incomplete");
    expect(() => prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery }))
      .toThrow(/focused test failed; delivery remains incomplete/);
  });

  it("does not report mini-task quality ready without explicit human confirmation", () => {
    const state = deliveryFixture();
    const quality = publishMiniTaskQualityFixture(state, { humanConfirmation: null });
    expect(quality.status).toBe("incomplete");
    expect(state.task.listCanonicalQualityFactRefs()
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.subject === "human_confirmation")
      .at(-1)).toMatchObject({ status: "missing" });
  });

  it("binds design review, implementation review, focused tests, and user result to one snapshot", async () => {
    const state = deliveryFixture();
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const designRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.design", attemptId: "fixture-design" });
    const designRef = "quality/reviews/results/mini-task-design.json";
    publishReviewChain(state, { ref: designRef, raw: designRaw });
    const designFact = recordMiniTaskDesignReview({
      task: state.task,
      kernel: state.kernel,
      review: { ref: designRef, sha256: sha256(designRaw) },
    });
    expect(JSON.parse(state.task.readRecord(designFact.ref)).subject).toBe("mini_task_design_review");

    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "fixture-implementation" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-positive.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-implementation.json", outputRef: "quality/tests/output/mini-task-implementation.output" });
    const quality = recordMiniTaskQuality({
      task: state.task,
      kernel: state.kernel,
      workspace: openCurrentTaskWorkspace(state.task),
      testCommand: "true",
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "success", observed: "success", oracle: "exit code 0" },
      acTrace: captureStructuredMiniAcTrace(state, receipt, "positive"),
      capturedReceipt: receipt,
      coverageLimits: ["temporary Git fixture only"],
      skipReasons: ["no real remote push"],
      remainingRisks: ["caller must rerun the original stage after A resume"],
      humanConfirmation: { decision: "accepted", subject_ref: "mini-task-quality" },
    });
    expect(quality.status).toBe("ready");
    expect(quality.snapshot_tree).toBe(snapshot.tree);
    expect(quality.evidence_ref).toMatch(/^quality\/evidence\/mini-task-implementation\//);

    const before = git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`]);
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, outcome: "rejected" });
    const cancelled = await executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    expect(cancelled).toMatchObject({ status: "blocked", confirmationOutcome: "rejected" });
    expect(git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`])).toBe(before);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
    expect(state.task.readRecord(quality.evidence_ref)).toContain("mini-task-implementation-evidence");
  });

  it("accepts design review on the pre-implementation snapshot and implementation quality on the final snapshot", async () => {
    const state = deliveryFixture();
    const designSnapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    const designRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: designSnapshot.tree, reviewKind: "mini_task.design", attemptId: "pre-implementation-design" });
    const designRef = "quality/reviews/results/mini-task-design-before-implementation.json";
    publishReviewChain(state, { ref: designRef, raw: designRaw });
    recordMiniTaskDesignReview({
      task: state.task,
      kernel: state.kernel,
      review: { ref: designRef, sha256: sha256(designRaw) },
    });

    writeFileSync(join(state.candidate.worktreeRoot, "src", "feature.txt"), "implemented after design review\n");
    const implementationSnapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
    expect(implementationSnapshot.tree).not.toBe(designSnapshot.tree);
    const implementationRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: implementationSnapshot.tree, reviewKind: "mini_task.implementation", attemptId: "final-implementation" });
    const implementationRef = "quality/reviews/results/mini-task-implementation-after-design.json";
    publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
    const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
      .captureTests({ command: "true", receiptRef: "quality/tests/mini-task-implementation.json", outputRef: "quality/tests/output/mini-task-implementation.output" });
    const quality = recordMiniTaskQuality({
      task: state.task,
      kernel: state.kernel,
      workspace: openCurrentTaskWorkspace(state.task),
      testCommand: "true",
      implementationReview: { ref: implementationRef, sha256: sha256(implementationRaw) },
      userResult: { status: "verified", method: "focused command", scenario: "mini-task path", expected: "success", observed: "implemented mini-task result", oracle: "exit code 0" },
      acTrace: captureStructuredMiniAcTrace(state, receipt, "after-design"),
      capturedReceipt: receipt,
      coverageLimits: ["temporary Git fixture only"],
      skipReasons: ["no real remote push"],
      remainingRisks: [],
      humanConfirmation: { decision: "accepted", subject_ref: "mini-task-quality" },
    });
    expect(quality.status).toBe("ready");
    expect(quality.snapshot_tree).toBe(implementationSnapshot.tree);

    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: { ...state.delivery, task_commit: quality.snapshot_commit } });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref }))
      .resolves.toMatchObject({ status: "completed" });
  });

  it("reuses mini-task quality after execution-status writeback without another review", async () => {
    const state = deliveryFixture();
    const quality = publishMiniTaskQualityFixture(state);
    const tasksPath = join(state.candidate.worktreeRoot, "specs", state.taskId, "tasks.md");
    writeFileSync(tasksPath, `${readFileSync(tasksPath, "utf8")}\n### 执行状态填写区\n- [x] 任务完成\n- status: completed\n- 执行事实：只写回执行状态，不改变实现\n`);

    const current = captureExecutionSnapshot(state.candidate.worktreeRoot, state.taskId);
    expect(current.tree).not.toBe(quality.snapshot_tree);

    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: { ...state.delivery, task_commit: current.commit } });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref }))
      .resolves.toMatchObject({ status: "completed" });
  });

  it("re-authenticates the mini-task implementation review before delivery close", async () => {
    const state = deliveryFixture();
    const quality = publishMiniTaskQualityFixture(state);
    const packet = JSON.parse(state.task.readRecord(quality.evidence_ref));
    const originalReview = JSON.parse(state.task.readRecord(packet.implementation_review.ref));
    const forgedReview = {
      ...originalReview,
      provider_results: [{ provider: "forged/provider", output: { findings: [] } }],
    };
    const forgedReviewRaw = `${JSON.stringify(forgedReview, null, 2)}\n`;
    const forgedReviewRef = "quality/reviews/results/mini-task-implementation-forged-close.json";
    state.kernel.publishCanonicalRecord(forgedReviewRef, forgedReviewRaw);
    const forgedPacket = {
      ...packet,
      implementation_review: { ref: forgedReviewRef, sha256: sha256(forgedReviewRaw), status: "recorded" },
    };
    const forgedPacketRaw = `${JSON.stringify(forgedPacket, null, 2)}\n`;
    const forgedPacketRef = "quality/evidence/mini-task-implementation/forged-close-packet.json";
    state.kernel.publishCanonicalRecord(forgedPacketRef, forgedPacketRaw);
    state.kernel.publishVNextQualityFact("build-code", {
      kind: "review", status: "recorded", subject: "mini_task_implementation_review",
      evidence: [{ ref: forgedPacketRef, sha256: sha256(forgedPacketRaw), evidence_type: "review_result" }],
    });

    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan });
    authorizeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    await expect(executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref }))
      .rejects.toThrow(/aggregation|provider evidence|review attempt|canonical semantic review result|conflict/i);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
  });

  it("does not let ordinary verify facts bypass mini-task implementation quality", async () => {
    const state = deliveryFixture();
    expect(() => prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery }))
      .toThrow(/fresh verify-code facts|test receipt snapshot_commit is unavailable/);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
  });

  it("keeps a failed implementation review incomplete and blocks delivery", async () => {
    const state = deliveryFixture();
    const quality = publishMiniTaskQualityFixture(state, { implementationStatus: "failed" });
    expect(quality.status).toBe("incomplete");
    expect(() => prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery }))
      .toThrow(/code_review/);
    expect(existsSync(state.candidate.worktreeRoot)).toBe(true);
  });

  it("cancels after a partial Git object exists without reset, deletion, or rollback", async () => {
    const state = deliveryFixture();
    publishMiniTaskQualityFixture(state);
    const plan = prepareMiniTaskDelivery({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    git(state.candidate.worktreeRoot, ["add", "."]);
    git(state.candidate.worktreeRoot, ["commit", "-qm", "partial mini-task operation"]);
    const partialTip = git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`]);
    const confirmation = confirmMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, outcome: "rejected" });
    const cancelled = await executeMiniTaskDelivery({ task: state.task, kernel: state.kernel, plan: plan.plan, confirmationRef: confirmation.ref });
    expect(cancelled).toMatchObject({ status: "blocked", confirmationOutcome: "rejected" });
    expect(git(state.repo, ["rev-parse", `refs/heads/task/WorkflowHub/${state.taskId}`])).toBe(partialTip);
    expect(existsSync(state.candidateRoot)).toBe(true);
    expect(readFileSync(join(state.candidateRoot, "specs", state.taskId, "spec.md"), "utf8")).toContain("mini-task");
  });
});

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function reviewRawFor({ taskId, snapshotTree, reviewKind, attemptId = "fixture-attempt" }) {
  const phaseId = reviewKind.endsWith("design") ? "mini-task-design" : "mini-task-implementation";
  return `${JSON.stringify({
    version: "wh-review-result.v1", task_id: taskId, stage: "build-code", review_track: null,
    review_kind: reviewKind, subject_kind: "phase", phase_id: phaseId, review_scope: "phase",
    base_tree: snapshotTree, candidate_tree: snapshotTree,
    source: { target_commit: "a".repeat(40), base_commit: "a".repeat(40), base_tree: snapshotTree, captured_head: "a".repeat(40) },
    snapshot_tree: snapshotTree, material_id: "b".repeat(64),
    attempt_ref: `quality/reviews/attempts/${attemptId}/attempt.json`,
    provider_results: [{ provider: "fixture", output: { findings: [] } }], findings: [],
    adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
  })}\n`;
}
function verifyReviewRawFor({ taskId, snapshotTree, subject }) {
  return `${JSON.stringify({
    version: "wh-review-result.v1", task_id: taskId, stage: "verify-code", review_track: null,
    review_kind: null, subject_kind: "worktree", phase_id: null, review_scope: null,
    source: { target_commit: "a".repeat(40), base_commit: "a".repeat(40), base_tree: snapshotTree, captured_head: "a".repeat(40) },
    snapshot_tree: snapshotTree, material_id: "b".repeat(64),
    attempt_ref: `quality/reviews/attempts/${subject}/attempt.json`,
    provider_results: [{ provider: "fixture", output: { findings: [] } }], findings: [],
    adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
  })}\n`;
}
function attemptRawFor({ taskId, snapshotTree, reviewKind, attemptId = "fixture-attempt" }) {
  const phaseId = reviewKind.endsWith("design") ? "mini-task-design" : "mini-task-implementation";
  return `${JSON.stringify({
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage: "build-code", review_track: null,
    review_kind: reviewKind, subject_kind: "phase", phase_id: phaseId, review_scope: "phase",
    base_tree: snapshotTree, candidate_tree: snapshotTree,
    source: { target_commit: "a".repeat(40), base_commit: "a".repeat(40), base_tree: snapshotTree, captured_head: "a".repeat(40) },
    snapshot_tree: snapshotTree, material_id: "b".repeat(64), provider_attempts: [], terminal_status: "unavailable",
    error: { code: "REVIEW_UNAVAILABLE", message: "fixture unavailable" },
    coverage: { mode: "single_external", selected_profiles: ["fixture"], selected_count: 1, valid_provider_count: 0, minimum_required: 1 },
  })}\n`;
}

function publishReviewChain(state, { ref, raw }) {
  const result = JSON.parse(raw);
  const attemptId = result.attempt_ref.match(/^quality\/reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/)?.[1];
  if (!attemptId) throw new Error("fixture review attempt ref is invalid");
  const provider = result.provider_results?.[0]?.provider ?? "fixture";
  const identity = { provider, adapter: provider.split("/", 1)[0], source_id: `${provider}-source`, config_id: `${provider}-config`, model: null };
  const content = JSON.stringify(result.provider_results?.[0]?.output ?? { findings: [] });
  const outputRef = `quality/reviews/attempts/${attemptId}/providers/${provider}.output.json`;
  const output = {
    schema_version: "wh-review-provider-output.v1", task_id: result.task_id, stage: result.stage,
    attempt_id: attemptId, provider, content, content_hash: sha256(content),
  };
  const { version, provider_results, findings, adjudication, attempt_ref, ...scope } = result;
  const attempt = {
    version: "wh-review-attempt.v1", ...scope, attempt_id: attemptId,
    provider_attempts: [{ provider, identity, status: "completed", session_id: "fixture-session", runtime_id: "fixture-runtime", output_ref: outputRef, error: null }],
    terminal_status: "semantic", error: null,
  };
  state.kernel.publishCanonicalRecord(outputRef, `${JSON.stringify(output, null, 2)}\n`);
  state.kernel.publishCanonicalRecord(result.attempt_ref, `${JSON.stringify(attempt, null, 2)}\n`);
  state.kernel.publishCanonicalRecord(ref, raw);
  return { resultRef: ref, attemptRef: result.attempt_ref };
}
function git(cwd, args, allowFailure = false) {
  if (allowFailure) {
    const result = requireGit(cwd, args, true);
    return { ok: result.status === 0, stdout: result.stdout, stderr: result.stderr };
  }
  return requireGit(cwd, args, false).stdout;
}
function requireGit(cwd, args, allowFailure) {
  try {
    return { status: 0, stdout: String(execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(), stderr: "" };
  } catch (error) {
    if (!allowFailure) throw error;
    return { status: error.status ?? 1, stdout: String(error.stdout ?? "").trim(), stderr: String(error.stderr ?? "").trim() };
  }
}
function deliveryFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-mini-task-delivery-")));
  roots.push(root);
  const repo = join(root, "repo");
  const bare = join(root, "origin.git");
  mkdirSync(repo); mkdirSync(bare);
  git(repo, ["init", "-q", "-b", "main"]); git(repo, ["config", "user.name", "WorkflowHub Tests"]); git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n"); git(repo, ["add", "README.md"]); git(repo, ["commit", "-qm", "base"]);
  git(bare, ["init", "--bare", "-q"]); git(repo, ["remote", "add", "origin", bare]); git(repo, ["push", "-q", "origin", "main"]);
  const taskId = "mini-task-delivery";
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId, created_at: "2026-08-04T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write" } });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision Log\n\n## 原始需求\n\nmini-task\n\n## 决定\n\n采用 mini-task。\n");
  for (const name of ["spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\nmini-task\n`);
  mkdirSync(join(candidate.worktreeRoot, "src"), { recursive: true }); writeFileSync(join(candidate.worktreeRoot, "src", "feature.txt"), "mini-task\n");
  const kernel = createTaskKernel(task, { workspace: openCurrentTaskWorkspace(task), artifacts });
  const snapshot = captureExecutionSnapshot(candidate.worktreeRoot);
  const testOutput = "mini-task focused tests passed\n";
  const testRaw = `${JSON.stringify({ schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: "verify-code", producer: { stage: "verify-code", component: "mini-task-focused-tests", version: "1.0.0" }, command: "printf mini-task", command_hash: sha256("printf mini-task"), exit_code: 0, snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit, source_digest: snapshot.source_digest, started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z", output_ref: "quality/tests/output/mini-task.output", output_hash: sha256(testOutput) }, null, 2)}\n`;
  kernel.publishCanonicalRecord("quality/tests/output/mini-task.output", testOutput); kernel.publishCanonicalRecord("quality/tests/mini-task.json", testRaw);
  for (const subject of ["same_build_integration_review"]) {
    const raw = verifyReviewRawFor({ taskId, snapshotTree: snapshot.tree, subject });
    const ref = `quality/reviews/results/${subject}.json`; publishReviewChain({ kernel }, { ref, raw });
    kernel.publishVNextQualityFact("verify-code", { kind: "review", status: "recorded", subject, evidence: [{ ref, sha256: sha256(raw), evidence_type: "review_result" }] });
  }
  return { root, repo, task, kernel, candidate, candidateRoot: candidate.worktreeRoot, taskId, delivery: { remote: "origin", task_branch: `task/WorkflowHub/${taskId}`, target_branch: "main", task_commit: snapshot.commit, spec_source_path: `specs/${taskId}`, spec_archive_path: `specs/archive/${taskId}` } };
}

function captureStructuredMiniAcTrace(state, receipt, suffix = "default", status = "passed") {
  const evidenceRaw = `${JSON.stringify({ schema_version: "workflowhub-mini-task-ac-evidence.v1", task_id: state.taskId, snapshot_tree: receipt.snapshot_tree, result: status === "passed" ? "verified" : "not verified" })}\n`;
  const evidenceRef = `quality/evidence/mini-task-ac-evidence-${suffix}.json`;
  state.kernel.publishCanonicalRecord(evidenceRef, evidenceRaw);
  return {
    schema_version: "ac-change-test-trace.v1",
    snapshot_tree: receipt.snapshot_tree,
    acceptance_ids: ["AC-020"],
    entries: [{
      acceptance_criterion_id: "AC-020",
      expected: "mini-task produces the requested result",
      actual: status === "passed" ? "mini-task produced the requested result" : "mini-task result was not verified",
      status,
      change: [{ task_id: state.taskId, summary: "mini-task implementation" }],
      test: [{ receipt_ref: receipt.receipt_ref, receipt_hash: receipt.receipt_hash }],
      evidence: [{ ref: evidenceRef, sha256: sha256(evidenceRaw) }],
      anchors: [{ id: "A-020", path: "src/feature.txt", start_line: 1, end_line: 1, role: "implementation", reason: "feature behavior" }],
    }],
  };
}

function publishMiniTaskQualityFixture(state, {
  implementationStatus = "passed",
  humanConfirmation = { decision: "accepted", subject_ref: "mini-task-quality" },
  testCommand = "true",
  acStatus = "passed",
  userResult = { status: "verified", method: "focused command", scenario: "mini-task path", expected: "success", observed: "success", oracle: "exit code 0" },
} = {}) {
  const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot);
  const designRaw = reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.design", attemptId: "fixture-design" });
  const designRef = "quality/reviews/results/mini-task-design-fixture.json";
  publishReviewChain(state, { ref: designRef, raw: designRaw });
  const designFact = recordMiniTaskDesignReview({ task: state.task, kernel: state.kernel, review: { ref: designRef, sha256: sha256(designRaw) } });
  const implementationRaw = implementationStatus === "failed"
    ? attemptRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "fixture-implementation" })
    : reviewRawFor({ taskId: state.taskId, snapshotTree: snapshot.tree, reviewKind: "mini_task.implementation", attemptId: "fixture-implementation" });
  const implementationRef = "quality/reviews/results/mini-task-implementation-fixture.json";
  if (implementationStatus === "failed") state.kernel.publishCanonicalRecord(implementationRef, implementationRaw);
  else publishReviewChain(state, { ref: implementationRef, raw: implementationRaw });
  const receipt = createCanonicalReceiptWriter({ task: state.task, workspace: openCurrentTaskWorkspace(state.task), stage: "verify-code", component: "mini-task-focused-tests" })
    .captureTests({ command: testCommand, receiptRef: "quality/tests/mini-task-implementation.json", outputRef: "quality/tests/output/mini-task-implementation.output" });
  const quality = recordMiniTaskQuality({
    task: state.task,
    kernel: state.kernel,
    workspace: openCurrentTaskWorkspace(state.task),
    testCommand,
    implementationReview: implementationStatus === "failed"
      ? { attempt_ref: implementationRef, sha256: sha256(implementationRaw) }
      : { ref: implementationRef, sha256: sha256(implementationRaw) },
    userResult,
    acTrace: captureStructuredMiniAcTrace(state, receipt, "fixture", acStatus),
    capturedReceipt: receipt,
    coverageLimits: ["temporary Git fixture only"],
    skipReasons: ["no real remote review"],
    remainingRisks: ["caller must rerun the original stage after A resume"],
    humanConfirmation,
  });
  return { ...quality, designFact };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
