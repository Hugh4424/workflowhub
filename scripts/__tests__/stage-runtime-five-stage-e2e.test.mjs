import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../core/task-handle.mjs";
import { captureWorkspaceSnapshot, createCanonicalReceiptWriter, writeOfficialComponentReceipt } from "../../core/canonical-receipt-writer.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { openAcceptedWorkspace } from "../../core/workspace.mjs";
import { runWorkspaceCommand } from "../../core/workspace-runner.mjs";
import { writeFormalReviewFixture } from "../../tests/helpers/formal-review.mjs";

const temporary = [];
const runtime = new URL("../stage-runtime.mjs", import.meta.url).pathname;

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-official-cli-")));
  temporary.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: repo, encoding: "utf8" }).trim();
  const task = createTask({
    storageRoot: root,
    manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "official-chain", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} },
  });
  const mainStatus = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo, encoding: "utf8" }).trim();
  return { root, repo, task, baseline, tree, mainStatus };
}

function run(root, repo, args) {
  return JSON.parse(execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" }));
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("official five-stage CLI", () => {
  it("runs repository-owned handlers and accepts the complete chain", () => {
    const { root, repo, task, baseline, mainStatus } = fixture();
    const invoke = (stage, receipts, extra = []) => {
      const input = join(root, `${stage}-input.json`);
      writeFileSync(input, `${JSON.stringify({ receipts })}\n`);
      const attempt = run(root, repo, ["run", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${input}`, ...extra]);
      if (["build-spec", "build-plan"].includes(stage)) expect(attempt.attempt.checkpoint).not.toHaveProperty("ref");
      const human = ["make-decision", "build-plan", "verify-code"].includes(stage);
      const confirmation = human ? run(root, repo, ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra]) : undefined;
      const invalidArgs = human
        ? ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--human-confirmation-ref=plain-string", ...extra]
        : ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra];
      const invalid = spawnSync(process.execPath, [runtime, ...invalidArgs], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(invalid.status).not.toBe(0);
      const acceptedArgs = ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, ...(human ? [`--human-confirmation-ref=${confirmation.ref}`] : []), ...extra];
      const accepted = run(root, repo, acceptedArgs);
      expect(accepted.acceptance_mode).toBe(human ? "human" : "automatic");
      if (!human) expect(accepted).not.toHaveProperty("human_confirmation_ref");
      if (["build-spec", "build-plan"].includes(stage)) expect(accepted.checkpoint.ref).toMatch(/^refs\/workflowhub\/checkpoints\//);
      return { attempt, accepted };
    };

    writeOfficialComponentReceipt({ task, stage: "make-decision", component: "decision", payload: { decision_log: "# Decision\n\nGo.\n" } });
    const decisionTree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: repo, encoding: "utf8" }).trim();
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: decisionTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: decisionTree, reviewTrack: "detail" });
    invoke("make-decision", { decision: "receipts/decision.json", direction_review: direction.resultRef, detail_review: detail.resultRef });
    const workspace = openAcceptedWorkspace(task, createTaskKernel(task).readAccepted("make-decision"));

    writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "# Spec\n" } });
    mkdirSync(join(workspace.worktreeRoot, "specs", "official-chain"), { recursive: true });
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "spec.md"), "# Spec\n");
    const specReview = writeFormalReviewFixture({ task, stage: "build-spec", snapshotTree: captureWorkspaceSnapshot(workspace).tree });
    invoke("build-spec", { spec: "receipts/spec.json", review: specReview.resultRef });

    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan\n" } });
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks\n" } });
    const revisedPlanInput = join(root, "revised-plan.json");
    writeFileSync(revisedPlanInput, `${JSON.stringify({ content: "# Plan, revised after review\n" })}\n`);
    const revisedPlan = run(root, repo, ["receipt", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--component=plan", `--input=${revisedPlanInput}`, "--revision=true", "--recover=receipts/plan.json"]);
    expect(revisedPlan).toMatchObject({ revision: true, previous_receipt_ref: "receipts/plan.json" });
    expect(revisedPlan.receipt_ref).toMatch(/^receipts\/revisions\/plan\/[a-f0-9]{64}\.json$/);
    expect(JSON.parse(task.readRecord("receipts/plan.json"))).toMatchObject({ content: "# Plan\n" });
    for (const args of [
      ["receipt", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--component=plan", `--input=${revisedPlanInput}`, "--revision=true"],
      ["receipt", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--component=plan", `--input=${revisedPlanInput}`, "--recover=receipts/plan.json"],
      ["run", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--revision=true"],
    ]) {
      const invalid = spawnSync(process.execPath, [runtime, ...args], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(invalid.status).not.toBe(0);
    }
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "plan.md"), "# Plan, revised after review\n");
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "tasks.md"), "# Tasks\n");
    const planReview = writeFormalReviewFixture({ task, stage: "build-plan", snapshotTree: captureWorkspaceSnapshot(workspace).tree });
    const buildPlan = invoke("build-plan", { plan: revisedPlan.receipt_ref, tasks: "receipts/tasks.json", review: planReview.resultRef });
    expect(buildPlan.accepted.checkpoint.artifacts.map((item) => item.path).sort()).toEqual([
      "specs/official-chain/plan.md",
      "specs/official-chain/tasks.md",
    ]);

    const code = "require('node:fs').mkdirSync('src',{recursive:true});require('node:fs').writeFileSync('src/feature.txt','implemented\\n')";
    expect(runWorkspaceCommand(workspace, process.execPath, ["-e", code]).status).toBe(0);

    const implementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true } });
    expect(implementation.value.changed).toContain("src/feature.txt");
    createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf fixture-output", receiptRef: "receipts/build-tests.json", outputRef: "evidence/build-output.txt" });
    const buildReview = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: implementation.value.snapshot_tree });
    invoke("build-code", { implementation: "receipts/implementation.json", tests: "receipts/build-tests.json", review: buildReview.resultRef });

    const verifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf fixture-output", receiptRef: "receipts/verify-tests.json", outputRef: "evidence/verify-output.txt" });
    const verifyReview = writeFormalReviewFixture({ task, stage: "verify-code", snapshotTree: verifyTests.snapshot_tree });
    const acceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: verifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1.json", acceptanceRaw);
    writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1.json", sha256: createHash("sha256").update(acceptanceRaw).digest("hex") }] } });
    const originalVerify = invoke("verify-code", { tests: "receipts/verify-tests.json", review: verifyReview.resultRef, evidence: "evidence/verify-evidence.json" });
    const prematurePassing = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${join(root, "verify-code-input.json")}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(prematurePassing.status).not.toBe(0);
    expect(prematurePassing.stderr).toMatch(/new active accepted build/i);
    expect(() => task.readRecord("results/verify-code/attempt-0002.json")).toThrow(/ENOENT|no such/i);
    const failureRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "WORKSPACE-LINEAGE", result: "fail", refs: [] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/workspace-lineage-failure.json", failureRaw);
    const controlledFailure = run(root, repo, ["publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    expect(controlledFailure).toMatchObject({ attempt_ref: "attempt-0002.json", attempt: { verify_failure_publication: { failure_evidence_ref: "evidence/workspace-lineage-failure.json", active_build_accepted_ref: "results/build-code/accepted.json" } } });
    const duplicate = spawnSync(process.execPath, [runtime, "publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stderr).toMatch(/already exists/i);

    const reopen = run(root, repo, ["reopen", "--stage=build-code", "--project=Demo", "--task=official-chain", `--verify-attempt=${controlledFailure.attempt_ref}`, "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    const revisedImplementation = { ref: "receipts/implementation-revised.json", value: JSON.parse(task.readRecord("receipts/implementation.json")) };
    createTaskKernel(task).publishCanonicalRecord(revisedImplementation.ref, task.readRecord("receipts/implementation.json"));
    createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf revised-build", receiptRef: "receipts/build-tests-revised.json", outputRef: "evidence/build-output-revised.txt" });
    const revisedBuildReview = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: revisedImplementation.value.snapshot_tree });
    const revisedBuildInput = join(root, "build-code-revised-input.json");
    writeFileSync(revisedBuildInput, `${JSON.stringify({ receipts: { implementation: revisedImplementation.ref, tests: "receipts/build-tests-revised.json", review: revisedBuildReview.resultRef } })}\n`);
    const revisedBuild = run(root, repo, ["run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${revisedBuildInput}`, `--reopen=${reopen.reopen_ref}`]);
    run(root, repo, ["accept", "--stage=build-code", "--project=Demo", "--task=official-chain", `--attempt=${revisedBuild.attempt_ref}`]);

    const freshVerifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf fresh-verify", receiptRef: "receipts/verify-tests-revised.json", outputRef: "evidence/verify-output-revised.txt" });
    const freshVerifyReview = writeFormalReviewFixture({ task, stage: "verify-code", snapshotTree: freshVerifyTests.snapshot_tree });
    const freshAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1-revised.json", freshAcceptanceRaw);
    const freshEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1-revised.json", sha256: createHash("sha256").update(freshAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const passingInput = join(root, "verify-code-passing-input.json");
    writeFileSync(passingInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: freshVerifyReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const copiedTestRef = "receipts/verify-tests-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedTestRef, task.readRecord(verifyTests.receipt_ref));
    const copiedTestInput = join(root, "verify-code-copied-test-input.json");
    writeFileSync(copiedTestInput, `${JSON.stringify({ receipts: { tests: copiedTestRef, review: freshVerifyReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedCopiedTest = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedTestInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedTest.status).not.toBe(0);
    expect(rejectedCopiedTest.stderr).toMatch(/fresh test receipt content/i);
    const copiedReviewRef = "reviews/results/verify-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedReviewRef, task.readRecord(verifyReview.resultRef));
    const copiedReviewInput = join(root, "verify-code-copied-review-input.json");
    writeFileSync(copiedReviewInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: copiedReviewRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedCopiedReview = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedReviewInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedReview.status).not.toBe(0);
    expect(rejectedCopiedReview.stderr).toMatch(/fresh independent review content/i);
    const copiedAcceptanceRef = "evidence/acceptance-AC-1-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedAcceptanceRef, acceptanceRaw);
    const copiedEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: copiedAcceptanceRef, sha256: createHash("sha256").update(acceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const copiedEvidenceInput = join(root, "verify-code-copied-evidence-input.json");
    writeFileSync(copiedEvidenceInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: freshVerifyReview.resultRef, evidence: copiedEvidence.ref } })}\n`);
    const rejectedCopiedEvidence = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedEvidenceInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedEvidence.status).not.toBe(0);
    expect(rejectedCopiedEvidence.stderr).toMatch(/fresh acceptance evidence content/i);
    const wrongCriterionRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-2", result: "pass", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-2-revised.json", wrongCriterionRaw);
    const wrongCriterionEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-2-revised.json", sha256: createHash("sha256").update(wrongCriterionRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const wrongCriterionInput = join(root, "verify-code-wrong-criterion-input.json");
    writeFileSync(wrongCriterionInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: freshVerifyReview.resultRef, evidence: wrongCriterionEvidence.ref } })}\n`);
    const rejectedCriterionSet = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${wrongCriterionInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCriterionSet.status).not.toBe(0);
    expect(rejectedCriterionSet.stderr).toMatch(/criterion set does not match/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const rejectedInput = join(root, "verify-code-rejected-input.json");
    writeFileSync(rejectedInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: verifyReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedBinding = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${rejectedInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBinding.status).not.toBe(0);
    expect(rejectedBinding.stderr).toMatch(/fresh independent review content/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const failedAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "fail", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1-revised-fail.json", failedAcceptanceRaw);
    const failedEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1-revised-fail.json", sha256: createHash("sha256").update(failedAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const failedInput = join(root, "verify-code-failed-input.json");
    writeFileSync(failedInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: freshVerifyReview.resultRef, evidence: failedEvidence.ref } })}\n`);
    const rejectedFailure = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${failedInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedFailure.status).not.toBe(0);
    expect(rejectedFailure.stderr).toMatch(/result=pass/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const staleTestInput = join(root, "verify-code-stale-test-input.json");
    writeFileSync(staleTestInput, `${JSON.stringify({ receipts: { tests: verifyTests.receipt_ref, review: freshVerifyReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedReceipt = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${staleTestInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedReceipt.status).not.toBe(0);
    expect(rejectedReceipt.stderr).toMatch(/fresh test receipt content/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\ndrift\n");
    const rejectedDrift = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedDrift.status).not.toBe(0);
    expect(rejectedDrift.stderr).toMatch(/Workspace snapshot must match/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\n");
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const acceptedVerifyRaw = task.readRecord("results/verify-code/accepted.json");
    const acceptedVerify = JSON.parse(acceptedVerifyRaw);
    writeFileSync(task.recordPath("results/verify-code/accepted.json"), `${JSON.stringify({ ...acceptedVerify, integrity_hash: "0".repeat(64) }, null, 2)}\n`);
    const rejectedTamper = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedTamper.status).not.toBe(0);
    expect(rejectedTamper.stderr).toMatch(/accepted integrity hash mismatch/i);
    writeFileSync(task.recordPath("results/verify-code/accepted.json"), acceptedVerifyRaw);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const activeBuildAcceptedRaw = task.readRecord("results/build-code/accepted.json");
    const activeBuildAccepted = JSON.parse(activeBuildAcceptedRaw);
    const activeBuildAttemptRef = `results/build-code/${activeBuildAccepted.attempt_ref}`;
    const activeBuildAttemptRaw = task.readRecord(activeBuildAttemptRef);
    const activeBuildAttempt = JSON.parse(activeBuildAttemptRaw);
    const tamperedBuildAttemptRaw = `${JSON.stringify({ ...activeBuildAttempt, reopen_provenance: { ...activeBuildAttempt.reopen_provenance, verify_failure_hash: "0".repeat(64) } }, null, 2)}\n`;
    writeFileSync(task.recordPath(activeBuildAttemptRef), tamperedBuildAttemptRaw);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), `${JSON.stringify({ ...activeBuildAccepted, integrity_hash: createHash("sha256").update(tamperedBuildAttemptRaw).digest("hex") }, null, 2)}\n`);
    const rejectedBuildLineage = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBuildLineage.status).not.toBe(0);
    expect(rejectedBuildLineage.stderr).toMatch(/active build reopen provenance mismatch/i);
    writeFileSync(task.recordPath(activeBuildAttemptRef), activeBuildAttemptRaw);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), activeBuildAcceptedRaw);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const freshReviewRaw = task.readRecord(freshVerifyReview.resultRef);
    const freshReviewValue = JSON.parse(freshReviewRaw);
    const freshAcceptanceHash = createHash("sha256").update(freshAcceptanceRaw).digest("hex");
    const injectedKernel = createTaskKernel(task, { workspace, attemptPublicationTestHooks: { afterOpenBeforeRename() { throw new Error("injected passing attempt write failure"); } } });
    expect(() => injectedKernel.publishVerifyPassingFromAccepted({
      facts: {
        tests: { command: freshVerifyTests.command, exit_code: freshVerifyTests.exit_code, command_hash: freshVerifyTests.command_hash, snapshot_head: freshVerifyTests.snapshot_head, snapshot_tree: freshVerifyTests.snapshot_tree, snapshot_commit: freshVerifyTests.snapshot_commit, started_at: freshVerifyTests.started_at, completed_at: freshVerifyTests.completed_at, receipt_ref: freshVerifyTests.receipt_ref, receipt_hash: freshVerifyTests.receipt_hash, output_ref: freshVerifyTests.output_ref, output_hash: freshVerifyTests.output_hash },
        review: { verdict: freshReviewValue.verdict, result_ref: freshVerifyReview.resultRef, result_hash: createHash("sha256").update(freshReviewRaw).digest("hex"), snapshot_tree: freshReviewValue.snapshot_tree },
        evidence_refs: [{ ref: "evidence/acceptance-AC-1-revised.json", sha256: freshAcceptanceHash }],
      },
      evidenceRefs: [
        { ref: freshVerifyTests.receipt_ref, sha256: freshVerifyTests.receipt_hash },
        { ref: freshVerifyReview.resultRef, sha256: createHash("sha256").update(freshReviewRaw).digest("hex") },
        { ref: freshEvidence.ref, sha256: createHash("sha256").update(task.readRecord(freshEvidence.ref)).digest("hex") },
        { ref: "evidence/acceptance-AC-1-revised.json", sha256: freshAcceptanceHash },
        { ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash },
      ],
    })).toThrow(/injected passing attempt write failure/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const passing = run(root, repo, ["publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`]);
    expect(passing).toMatchObject({ attempt_ref: "attempt-0003.json", attempt: { verify_passing_publication: { previous_accepted_ref: "results/verify-code/accepted.json", active_build_attempt_ref: revisedBuild.attempt_ref, test_receipt_ref: freshVerifyTests.receipt_ref, review_result_ref: freshVerifyReview.resultRef, workspace_head: freshVerifyTests.snapshot_head, workspace_tree: freshVerifyTests.snapshot_tree } } });
    expect(JSON.parse(task.readRecord("results/verify-code/accepted.json"))).toMatchObject({ attempt_ref: "attempt-0001.json" });
    const duplicatePassing = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicatePassing.status).not.toBe(0);
    expect(duplicatePassing.stderr).toMatch(/already exists/i);

    const failureConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${controlledFailure.attempt_ref}`, "--decision=accepted"]);
    const rejectedFailureAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${controlledFailure.attempt_ref}`, `--human-confirmation-ref=${failureConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedFailureAccept.status).not.toBe(0);
    expect(rejectedFailureAccept.stderr).toMatch(/accepted and closed/i);

    const passingConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, "--decision=accepted"]);
    const rejectedConfirmation = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${originalVerify.accepted.human_confirmation_ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedConfirmation.status).not.toBe(0);
    expect(rejectedConfirmation.stderr).toMatch(/does not bind/i);

    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\naccept drift\n");
    const rejectedAcceptDrift = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedAcceptDrift.status).not.toBe(0);
    expect(rejectedAcceptDrift.stderr).toMatch(/Workspace binding changed/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\n");

    const buildCanonicalBeforeAccept = task.readRecord("results/build-code/accepted.json");
    const buildCanonical = JSON.parse(buildCanonicalBeforeAccept);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), `${JSON.stringify({ ...buildCanonical, integrity_hash: "0".repeat(64) }, null, 2)}\n`);
    const rejectedBuildAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBuildAccept.status).not.toBe(0);
    expect(rejectedBuildAccept.stderr).toMatch(/build-code accepted integrity hash mismatch/i);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), buildCanonicalBeforeAccept);

    const verifyCanonicalBeforeAccept = task.readRecord("results/verify-code/accepted.json");
    const freshTestRaw = task.readRecord(freshVerifyTests.receipt_ref);
    writeFileSync(task.recordPath(freshVerifyTests.receipt_ref), `${freshTestRaw}drift`);
    const rejectedTestMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedTestMaterial.status).not.toBe(0);
    expect(rejectedTestMaterial.stderr).toMatch(/test receipt changed/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(freshVerifyTests.receipt_ref), freshTestRaw);

    const freshReviewMaterialRaw = task.readRecord(freshVerifyReview.resultRef);
    writeFileSync(task.recordPath(freshVerifyReview.resultRef), `${freshReviewMaterialRaw}drift`);
    const rejectedReviewMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedReviewMaterial.status).not.toBe(0);
    expect(rejectedReviewMaterial.stderr).toMatch(/review result changed/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(freshVerifyReview.resultRef), freshReviewMaterialRaw);

    const freshEvidenceRaw = task.readRecord("evidence/acceptance-AC-1-revised.json");
    writeFileSync(task.recordPath("evidence/acceptance-AC-1-revised.json"), `${freshEvidenceRaw}drift`);
    const rejectedAcceptanceMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedAcceptanceMaterial.status).not.toBe(0);
    expect(rejectedAcceptanceMaterial.stderr).toMatch(/acceptance evidence hash mismatch/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath("evidence/acceptance-AC-1-revised.json"), freshEvidenceRaw);

    writeFileSync(task.recordPath("results/verify-code/accepted-attempt-0001.json"), "occupied archive\n");
    const collisionRef = `results/verify-code/accepted-attempt-0001-canonical-${createHash("sha256").update(verifyCanonicalBeforeAccept).digest("hex")}.json`;
    writeFileSync(task.recordPath(collisionRef), "occupied collision archive\n");
    const rejectedArchiveCollision = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedArchiveCollision.status).not.toBe(0);
    expect(rejectedArchiveCollision.stderr).toMatch(/collision archive conflicts/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(collisionRef), verifyCanonicalBeforeAccept);

    const injectedAcceptKernel = createTaskKernel(task, { workspace, acceptedReplacementTestHooks: { beforeDirectoryFsync() { throw new Error("injected accepted replacement failure"); } } });
    expect(() => injectedAcceptKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/injected accepted replacement failure/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);

    const acceptedRevalidation = run(root, repo, ["accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`]);
    expect(acceptedRevalidation).toMatchObject({ attempt_ref: passing.attempt_ref, human_confirmation_ref: passingConfirmation.ref });
    expect(JSON.parse(task.readRecord("results/verify-code/accepted.json"))).toMatchObject({ attempt_ref: passing.attempt_ref });
    expect(task.readRecord(collisionRef)).toBe(verifyCanonicalBeforeAccept);
    expect(run(root, repo, ["accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`])).toEqual(acceptedRevalidation);

    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(JSON.parse(task.readRecord(`results/${stage}/accepted.json`))).toMatchObject({ schema_version: "task-accepted.v2", task_id: "official-chain", stage });
    }
    const linked = workspace.worktreeRoot;
    expect(readFileSync(join(linked, "src", "feature.txt"), "utf8")).toBe("implemented\n");
    for (const name of ["spec.md", "plan.md", "tasks.md"]) expect(existsSync(join(linked, "specs", "official-chain", name))).toBe(true);
    expect(existsSync(join(repo, "src", "feature.txt"))).toBe(false);
    expect(existsSync(join(repo, "specs", "official-chain"))).toBe(false);
    expect(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim()).toBe(baseline);
    expect(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo, encoding: "utf8" }).trim()).toBe(mainStatus);
  });
});
