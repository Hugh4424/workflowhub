import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask, migrateTaskRunnerRoot } from "../../core/task-handle.mjs";
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
  it("derives a bound runner from its own module and rejects caller injection or HEAD drift", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runtime-runner-"))); temporary.push(root);
    const projectRoot = realpathSync(join(import.meta.dirname, "../.."));
    const runner = join(root, "runner"), repo = join(root, "repo");
    execFileSync("git", ["clone", "-q", "--no-local", projectRoot, runner]);
    execFileSync("git", ["checkout", "-qb", "task/Demo/runtime-bound"], { cwd: runner });
    cpSync(join(projectRoot, "core"), join(runner, "core"), { recursive: true, force: true });
    cpSync(join(projectRoot, "scripts", "stage-runtime.mjs"), join(runner, "scripts", "stage-runtime.mjs"), { force: true });
    cpSync(join(projectRoot, "scripts", "task-recovery.mjs"), join(runner, "scripts", "task-recovery.mjs"), { force: true });
    cpSync(join(projectRoot, "workflows", "build-code", "phase-evidence.mjs"), join(runner, "workflows", "build-code", "phase-evidence.mjs"), { force: true });
    symlinkSync(realpathSync(join(projectRoot, "node_modules")), join(runner, "node_modules"));
    execFileSync("git", ["add", "core", "scripts/stage-runtime.mjs", "scripts/task-recovery.mjs", "workflows/build-code/phase-evidence.mjs"], { cwd: runner });
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "runner"], { cwd: runner });
    mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "runtime-bound", created_at: "2026-07-19T00:00:00.000Z",
      target_repo_root: repo, issue_ids: [], inputs: {},
    } });
    migrateTaskRunnerRoot({ taskPath: task.taskPath, projectName: "Demo", taskId: "runtime-bound", runnerRoot: realpathSync(runner), stage: "make-decision" });
    const boundRuntime = join(runner, "scripts", "stage-runtime.mjs");
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const unsupportedHelp = spawnSync(process.execPath, [boundRuntime, "--help"], { cwd: repo, env, encoding: "utf8" });
    expect(unsupportedHelp.status).not.toBe(0);
    expect(unsupportedHelp.stderr).toMatch(/usage: stage-runtime/i);
    const args = ["prepare", "--stage=make-decision", "--project=Demo", "--task=runtime-bound"];
    expect(spawnSync(process.execPath, [boundRuntime, ...args], { cwd: repo, env, encoding: "utf8" }).status).toBe(0);
    const injected = spawnSync(process.execPath, [boundRuntime, ...args, `--runner-root=${repo}`], { cwd: repo, env, encoding: "utf8" });
    expect(injected.status).not.toBe(0);
    expect(injected.stderr).toMatch(/runner-root is forbidden/i);
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "runner drift"], { cwd: runner });
    const drifted = spawnSync(process.execPath, [boundRuntime, ...args], { cwd: repo, env, encoding: "utf8" });
    expect(drifted.status).not.toBe(0);
    expect(drifted.stderr).toMatch(/runner identity mismatch/i);
  });

  it("runs repository-owned handlers and accepts the complete chain", () => {
    const { root, repo, task, baseline, mainStatus } = fixture();
    const inputRoots = Object.fromEntries(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].map((stage) => {
      const path = realpathSync(mkdtempSync(join(tmpdir(), `workflowhub-${stage}.`))); temporary.push(path); return [stage, path];
    }));
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const rejectBareRun = (stage, receipts) => {
      const input = join(inputRoots[stage], `${stage}-bare-input.json`);
      writeFileSync(input, `${JSON.stringify(receipts)}\n`);
      const result = spawnSync(process.execPath, [runtime, "run", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${input}`], { cwd: repo, env, encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/receipts/i);
    };
    const acceptanceCoverage = (testReceiptRef) => {
      const { snapshot_tree } = JSON.parse(task.readRecord(testReceiptRef));
      return { snapshot_tree, accepted_criterion_ids: ["AC-1"], items: [{ acceptance_criterion_id: "AC-1", status: "unknown", evidence_refs: [] }] };
    };
    const invoke = (stage, receipts, extra = []) => {
      const input = join(inputRoots[stage], `${stage}-input.json`);
      writeFileSync(input, `${JSON.stringify({ receipts, ...(stage === "build-code" ? { acceptance_coverage: acceptanceCoverage(receipts.tests) } : {}) })}\n`);
      const attempt = run(root, repo, ["run", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${input}`, ...extra]);
      if (["build-spec", "build-plan"].includes(stage)) expect(attempt.attempt.checkpoint).not.toHaveProperty("ref");
      const human = ["make-decision", "build-plan", "verify-code"].includes(stage);
      const confirmation = human ? run(root, repo, ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra]) : undefined;
      const invalidArgs = human
        ? ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--human-confirmation-ref=plain-string", ...extra]
        : ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra];
      const invalid = spawnSync(process.execPath, [runtime, ...invalidArgs], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(invalid.status).not.toBe(0);
      const accepted = human
        ? run(root, repo, ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`, ...extra])
        : JSON.parse(task.readRecord(`results/${stage}/accepted.json`));
      expect(accepted.attempt_ref).toBe(attempt.attempt_ref);
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
    const invalidSpecPrepare = spawnSync(process.execPath, [runtime, "prepare", "--stage=build-spec", "--project=Demo", "--task=official-chain"], { cwd: repo, env, encoding: "utf8" });
    expect(invalidSpecPrepare.status).not.toBe(0);
    expect(invalidSpecPrepare.stderr).toMatch(/prepare is only valid for make-decision/i);

    writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "# Spec\n" } });
    mkdirSync(join(workspace.worktreeRoot, "specs", "official-chain"), { recursive: true });
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "spec.md"), "# Spec\n");
    const specReview = writeFormalReviewFixture({ task, stage: "build-spec", snapshotTree: captureWorkspaceSnapshot(workspace).tree, verdict: "revise_required" });
    rejectBareRun("build-spec", { spec: "receipts/spec.json", review: specReview.resultRef });
    const buildSpec = invoke("build-spec", { spec: "receipts/spec.json", review: specReview.resultRef });
    expect(buildSpec.attempt.attempt.missing_items).toContain("review findings recorded; response evidence: unknown/unverified");
    const invalidPlanPrepare = spawnSync(process.execPath, [runtime, "prepare", "--stage=build-plan", "--project=Demo", "--task=official-chain"], { cwd: repo, env, encoding: "utf8" });
    expect(invalidPlanPrepare.status).not.toBe(0);
    expect(invalidPlanPrepare.stderr).toMatch(/prepare is only valid for make-decision/i);

    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan\n" } });
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks\n" } });
    const revisedPlanInput = join(inputRoots["build-plan"], "revised-plan.json");
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
    const planReview = writeFormalReviewFixture({ task, stage: "build-plan", snapshotTree: captureWorkspaceSnapshot(workspace).tree, verdict: "revise_required" });
    rejectBareRun("build-plan", { plan: revisedPlan.receipt_ref, tasks: "receipts/tasks.json", review: planReview.resultRef });
    const buildPlan = invoke("build-plan", { plan: revisedPlan.receipt_ref, tasks: "receipts/tasks.json", review: planReview.resultRef });
    expect(buildPlan.attempt.attempt.missing_items).toContain("review findings recorded; response evidence: unknown/unverified");
    expect(buildPlan.accepted.checkpoint.artifacts.map((item) => item.path).sort()).toEqual([
      "specs/official-chain/plan.md",
      "specs/official-chain/tasks.md",
    ]);

    const code = "require('node:fs').mkdirSync('src',{recursive:true});require('node:fs').writeFileSync('src/feature.txt','implemented\\n')";
    expect(runWorkspaceCommand(workspace, process.execPath, ["-e", code]).status).toBe(0);

    const implementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true } });
    expect(implementation.value.changed).toContain("src/feature.txt");
    const buildTestCaptureInput = join(inputRoots["build-code"], "build-test-capture.json");
    writeFileSync(buildTestCaptureInput, `${JSON.stringify({ command: "printf fixture-output", receipt_ref: "receipts/build-tests.json", output_ref: "evidence/build-output.txt" })}\n`);
    const capturedBuildTests = run(root, repo, ["capture-tests", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${buildTestCaptureInput}`]);
    expect(capturedBuildTests).toMatchObject({ receipt_ref: "receipts/build-tests.json", output_ref: "evidence/build-output.txt", exit_code: 0 });
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");
    const preAcceptImplementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true }, revisionOf: implementation.ref });
    const preAcceptTests = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf pre-accept-repaired-build", receiptRef: "receipts/build-tests-pre-accept-repaired.json", outputRef: "evidence/build-output-pre-accept-repaired.txt" });
    const buildReview = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: preAcceptImplementation.value.snapshot_tree });
    invoke("build-code", { implementation: preAcceptImplementation.ref, tests: preAcceptTests.receipt_ref, review: buildReview.resultRef });

    const verifyTestCaptureInput = join(inputRoots["verify-code"], "verify-test-capture.json");
    writeFileSync(verifyTestCaptureInput, `${JSON.stringify({ command: "printf fixture-output", receipt_ref: "receipts/verify-tests.json", output_ref: "evidence/verify-output.txt" })}\n`);
    const verifyTests = run(root, repo, ["capture-tests", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${verifyTestCaptureInput}`]);
    expect(verifyTests).toMatchObject({ receipt_ref: "receipts/verify-tests.json", output_ref: "evidence/verify-output.txt", exit_code: 0 });
    const acceptanceInput = join(inputRoots["verify-code"], "acceptance-AC-1.json");
    writeFileSync(acceptanceInput, `${JSON.stringify({ acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: verifyTests.output_hash }] })}\n`);
    for (const stage of ["build-code", "build-plan"]) {
      const rejectedStage = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${acceptanceInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(rejectedStage.status).not.toBe(0);
      expect(rejectedStage.stderr).toMatch(/requires --stage=verify-code/i);
    }
    const badRefInput = join(inputRoots["verify-code"], "acceptance-bad-ref.json");
    writeFileSync(badRefInput, `${JSON.stringify({ acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "../other-task/evidence/output.txt", sha256: verifyTests.output_hash }] })}\n`);
    const rejectedRef = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${badRefInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedRef.status).not.toBe(0);
    expect(rejectedRef.stderr).toMatch(/canonical ref/i);
    const badHashInput = join(inputRoots["verify-code"], "acceptance-bad-hash.json");
    writeFileSync(badHashInput, `${JSON.stringify({ acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: "0".repeat(64) }] })}\n`);
    const rejectedHash = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${badHashInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedHash.status).not.toBe(0);
    expect(rejectedHash.stderr).toMatch(/hash mismatch/i);
    const callerPathInput = join(inputRoots["verify-code"], "acceptance-caller-path.json");
    writeFileSync(callerPathInput, `${JSON.stringify({ acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: verifyTests.output_hash }], output_ref: "evidence/caller-selected.json" })}\n`);
    const rejectedCallerPath = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${callerPathInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCallerPath.status).not.toBe(0);
    expect(rejectedCallerPath.stderr).toMatch(/requires acceptance_criterion_id, result, and refs only/i);
    const acceptance = run(root, repo, ["publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${acceptanceInput}`]);
    expect(acceptance).toMatchObject({ acceptance_criterion_id: "AC-1", result: "pass" });
    expect(acceptance.evidence_ref).toMatch(/^evidence\/acceptance-[a-f0-9]{64}\.json$/);
    const duplicateAcceptance = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${acceptanceInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicateAcceptance.status).not.toBe(0);
    expect(duplicateAcceptance.stderr).toMatch(/already exists/i);
    const evidenceInput = join(inputRoots["verify-code"], "verify-evidence-refs.json");
    writeFileSync(evidenceInput, `${JSON.stringify({ refs: [{ ref: acceptance.evidence_ref, sha256: acceptance.evidence_hash }] })}\n`);
    const aggregateEvidence = run(root, repo, ["receipt", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--component=evidence", `--input=${evidenceInput}`]);
    expect(aggregateEvidence).toMatchObject({ receipt_ref: "evidence/verify-evidence.json" });
    const acceptanceRaw = task.readRecord(acceptance.evidence_ref);
    const originalVerify = invoke("verify-code", { tests: "receipts/verify-tests.json", review: buildReview.resultRef, evidence: "evidence/verify-evidence.json" });
    const prematurePassing = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${join(inputRoots["verify-code"], "verify-code-input.json")}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(prematurePassing.status).not.toBe(0);
    expect(prematurePassing.stderr).toMatch(/new active accepted build/i);
    expect(() => task.readRecord("results/verify-code/attempt-0002.json")).toThrow(/ENOENT|no such/i);
    const failureDetail = "workspace lineage failed\n";
    createTaskKernel(task).publishCanonicalRecord("evidence/workspace-lineage-failure.txt", failureDetail);
    const failureRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "WORKSPACE-LINEAGE", result: "fail", refs: [{ ref: "evidence/workspace-lineage-failure.txt", sha256: createHash("sha256").update(failureDetail).digest("hex") }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/workspace-lineage-failure.json", failureRaw);
    const controlledFailure = run(root, repo, ["publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    expect(controlledFailure).toMatchObject({ attempt_ref: "attempt-0002.json", attempt: { verify_failure_publication: { failure_evidence_ref: "evidence/workspace-lineage-failure.json", active_build_accepted_ref: "results/build-code/accepted.json" } } });
    const duplicate = spawnSync(process.execPath, [runtime, "publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stderr).toMatch(/already exists/i);

    const reopen = run(root, repo, ["reopen", "--stage=build-code", "--project=Demo", "--task=official-chain", `--verify-attempt=${controlledFailure.attempt_ref}`, "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    const revisedImplementation = { ref: "receipts/implementation-revised.json", value: JSON.parse(task.readRecord(preAcceptImplementation.ref)) };
    createTaskKernel(task).publishCanonicalRecord(revisedImplementation.ref, task.readRecord(preAcceptImplementation.ref));
    const revisedBuildTests = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf revised-build", receiptRef: "receipts/build-tests-revised.json", outputRef: "evidence/build-output-revised.txt" });
    const revisedBuildReview = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: revisedImplementation.value.snapshot_tree });
    const revisedBuildInput = join(inputRoots["build-code"], "build-code-revised-input.json");
    writeFileSync(revisedBuildInput, `${JSON.stringify({ receipts: { implementation: revisedImplementation.ref, tests: revisedBuildTests.receipt_ref, review: revisedBuildReview.resultRef }, acceptance_coverage: acceptanceCoverage(revisedBuildTests.receipt_ref) })}\n`);
    const acceptedBuild = JSON.parse(task.readRecord("results/build-code/accepted.json"));
    const acceptedBuildAttemptPath = task.recordPath(`results/build-code/${acceptedBuild.attempt_ref}`);
    const acceptedBuildAttemptRaw = readFileSync(acceptedBuildAttemptPath, "utf8");
    rmSync(acceptedBuildAttemptPath);
    const rejectedCorruptAcceptedLineage = spawnSync(process.execPath, [runtime, "run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${revisedBuildInput}`], { cwd: repo, env, encoding: "utf8" });
    writeFileSync(acceptedBuildAttemptPath, acceptedBuildAttemptRaw);
    expect(rejectedCorruptAcceptedLineage.status).not.toBe(0);
    expect(rejectedCorruptAcceptedLineage.stderr).toMatch(/ENOENT|no such|not found/i);
    const rejectedUncontrolledRevision = spawnSync(process.execPath, [runtime, "run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${revisedBuildInput}`], { cwd: repo, env, encoding: "utf8" });
    expect(rejectedUncontrolledRevision.status).not.toBe(0);
    expect(rejectedUncontrolledRevision.stderr).toMatch(/accepted build-code revision receipt requires a controlled reopen/i);
    const revisedBuild = run(root, repo, ["run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${revisedBuildInput}`, `--reopen=${reopen.reopen_ref}`]);

    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\nworkspace-b\n");
    const workspaceBTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf workspace-b-verify", receiptRef: "receipts/verify-tests-workspace-b.json", outputRef: "evidence/verify-output-workspace-b.txt" });
    const workspaceBAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: workspaceBTests.output_ref, sha256: workspaceBTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1-workspace-b.json", workspaceBAcceptanceRaw);
    const workspaceBEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1-workspace-b.json", sha256: createHash("sha256").update(workspaceBAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const workspaceBInput = join(inputRoots["verify-code"], "verify-code-workspace-b-input.json");
    writeFileSync(workspaceBInput, `${JSON.stringify({ receipts: { tests: workspaceBTests.receipt_ref, review: revisedBuildReview.resultRef, evidence: workspaceBEvidence.ref } })}\n`);
    const rejectedWorkspaceB = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${workspaceBInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedWorkspaceB.status).not.toBe(0);
    expect(rejectedWorkspaceB.stderr).toMatch(/tests, review, and current Workspace snapshot must match/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const freshVerifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf fresh-verify", receiptRef: "receipts/verify-tests-revised.json", outputRef: "evidence/verify-output-revised.txt" });
    const freshAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1-revised.json", freshAcceptanceRaw);
    const freshEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1-revised.json", sha256: createHash("sha256").update(freshAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const passingInput = join(inputRoots["verify-code"], "verify-code-passing-input.json");
    writeFileSync(passingInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const copiedTestRef = "receipts/verify-tests-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedTestRef, task.readRecord(verifyTests.receipt_ref));
    const copiedTestInput = join(inputRoots["verify-code"], "verify-code-copied-test-input.json");
    writeFileSync(copiedTestInput, `${JSON.stringify({ receipts: { tests: copiedTestRef, review: revisedBuildReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedCopiedTest = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedTestInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedTest.status).not.toBe(0);
    expect(rejectedCopiedTest.stderr).toMatch(/fresh test receipt content/i);
    const copiedReviewRef = "reviews/results/build-code-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedReviewRef, task.readRecord(revisedBuildReview.resultRef));
    const copiedReviewInput = join(inputRoots["verify-code"], "verify-code-copied-review-input.json");
    writeFileSync(copiedReviewInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: copiedReviewRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedCopiedReview = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedReviewInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedReview.status).not.toBe(0);
    expect(rejectedCopiedReview.stderr).toMatch(/reuse the active accepted build-code final review/i);
    const copiedAcceptanceRef = "evidence/acceptance-AC-1-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedAcceptanceRef, acceptanceRaw);
    const copiedEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: copiedAcceptanceRef, sha256: createHash("sha256").update(acceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const copiedEvidenceInput = join(inputRoots["verify-code"], "verify-code-copied-evidence-input.json");
    writeFileSync(copiedEvidenceInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, evidence: copiedEvidence.ref } })}\n`);
    const rejectedCopiedEvidence = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedEvidenceInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedEvidence.status).not.toBe(0);
    expect(rejectedCopiedEvidence.stderr).toMatch(/fresh acceptance evidence content/i);
    const wrongCriterionRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-2", result: "pass", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-2-revised.json", wrongCriterionRaw);
    const wrongCriterionEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-2-revised.json", sha256: createHash("sha256").update(wrongCriterionRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const wrongCriterionInput = join(inputRoots["verify-code"], "verify-code-wrong-criterion-input.json");
    writeFileSync(wrongCriterionInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, evidence: wrongCriterionEvidence.ref } })}\n`);
    const rejectedCriterionSet = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${wrongCriterionInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCriterionSet.status).not.toBe(0);
    expect(rejectedCriterionSet.stderr).toMatch(/criterion set does not match/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const rejectedInput = join(inputRoots["verify-code"], "verify-code-rejected-input.json");
    writeFileSync(rejectedInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: buildReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedBinding = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${rejectedInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBinding.status).not.toBe(0);
    expect(rejectedBinding.stderr).toMatch(/reuse the active accepted build-code final review/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const failedAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "fail", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1-revised-fail.json", failedAcceptanceRaw);
    const failedEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1-revised-fail.json", sha256: createHash("sha256").update(failedAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const failedInput = join(inputRoots["verify-code"], "verify-code-failed-input.json");
    writeFileSync(failedInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, evidence: failedEvidence.ref } })}\n`);
    const rejectedFailure = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${failedInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedFailure.status).not.toBe(0);
    expect(rejectedFailure.stderr).toMatch(/result=pass/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const staleTestInput = join(inputRoots["verify-code"], "verify-code-stale-test-input.json");
    writeFileSync(staleTestInput, `${JSON.stringify({ receipts: { tests: verifyTests.receipt_ref, review: revisedBuildReview.resultRef, evidence: freshEvidence.ref } })}\n`);
    const rejectedReceipt = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${staleTestInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedReceipt.status).not.toBe(0);
    expect(rejectedReceipt.stderr).toMatch(/fresh test receipt content/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\ndrift\n");
    const rejectedDrift = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedDrift.status).not.toBe(0);
    expect(rejectedDrift.stderr).toMatch(/Workspace snapshot must match/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");
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
    const revisedReviewRaw = task.readRecord(revisedBuildReview.resultRef);
    const revisedReviewValue = JSON.parse(revisedReviewRaw);
    const freshAcceptanceHash = createHash("sha256").update(freshAcceptanceRaw).digest("hex");
    const injectedKernel = createTaskKernel(task, { workspace, attemptPublicationTestHooks: { afterOpenBeforeRename() { throw new Error("injected passing attempt write failure"); } } });
    expect(() => injectedKernel.publishVerifyPassingFromAccepted({
      facts: {
        tests: { command: freshVerifyTests.command, exit_code: freshVerifyTests.exit_code, command_hash: freshVerifyTests.command_hash, snapshot_head: freshVerifyTests.snapshot_head, snapshot_tree: freshVerifyTests.snapshot_tree, snapshot_commit: freshVerifyTests.snapshot_commit, started_at: freshVerifyTests.started_at, completed_at: freshVerifyTests.completed_at, receipt_ref: freshVerifyTests.receipt_ref, receipt_hash: freshVerifyTests.receipt_hash, output_ref: freshVerifyTests.output_ref, output_hash: freshVerifyTests.output_hash },
        review: { verdict: revisedReviewValue.verdict, result_ref: revisedBuildReview.resultRef, result_hash: createHash("sha256").update(revisedReviewRaw).digest("hex"), snapshot_tree: revisedReviewValue.snapshot_tree, subject_kind: "worktree", phase_id: null, review_scope: "integration" },
        evidence_refs: [{ ref: "evidence/acceptance-AC-1-revised.json", sha256: freshAcceptanceHash }],
      },
      evidenceRefs: [
        { ref: freshVerifyTests.receipt_ref, sha256: freshVerifyTests.receipt_hash },
        { ref: revisedBuildReview.resultRef, sha256: createHash("sha256").update(revisedReviewRaw).digest("hex") },
        { ref: freshEvidence.ref, sha256: createHash("sha256").update(task.readRecord(freshEvidence.ref)).digest("hex") },
        { ref: "evidence/acceptance-AC-1-revised.json", sha256: freshAcceptanceHash },
        { ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash },
      ],
    })).toThrow(/injected passing attempt write failure/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    for (let sequence = 3; sequence <= 8; sequence += 1) {
      const ref = `attempt-${String(sequence).padStart(4, "0")}.json`;
      const filler = structuredClone(controlledFailure.attempt);
      filler.attempt_id = `verify-code:${ref.slice(0, -5)}`;
      delete filler.verify_failure_publication;
      writeFileSync(task.recordPath(`results/verify-code/${ref}`), `${JSON.stringify(filler, null, 2)}\n`);
    }
    const passing = run(root, repo, ["publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`]);
    expect(passing).toMatchObject({ attempt_ref: "attempt-0009.json", attempt: { verify_passing_publication: { previous_accepted_ref: "results/verify-code/accepted.json", active_build_attempt_ref: revisedBuild.attempt_ref, test_receipt_ref: freshVerifyTests.receipt_ref, review_result_ref: revisedBuildReview.resultRef, workspace_head: freshVerifyTests.snapshot_head, workspace_tree: freshVerifyTests.snapshot_tree } } });
    expect(JSON.parse(task.readRecord("results/verify-code/accepted.json"))).toMatchObject({ attempt_ref: "attempt-0001.json" });
    const duplicatePassing = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicatePassing.status).not.toBe(0);
    expect(duplicatePassing.stderr).toMatch(/already exists/i);

    const workspaceBAcceptanceHash = createHash("sha256").update(workspaceBAcceptanceRaw).digest("hex");
    const workspaceBAttempt = structuredClone(passing.attempt);
    workspaceBAttempt.attempt_id = "verify-code:attempt-0010";
    workspaceBAttempt.facts = {
      tests: { command: workspaceBTests.command, exit_code: workspaceBTests.exit_code, command_hash: workspaceBTests.command_hash, snapshot_head: workspaceBTests.snapshot_head, snapshot_tree: workspaceBTests.snapshot_tree, snapshot_commit: workspaceBTests.snapshot_commit, started_at: workspaceBTests.started_at, completed_at: workspaceBTests.completed_at, receipt_ref: workspaceBTests.receipt_ref, receipt_hash: workspaceBTests.receipt_hash, output_ref: workspaceBTests.output_ref, output_hash: workspaceBTests.output_hash },
      review: { verdict: revisedReviewValue.verdict, result_ref: revisedBuildReview.resultRef, result_hash: createHash("sha256").update(revisedReviewRaw).digest("hex"), snapshot_tree: revisedReviewValue.snapshot_tree, subject_kind: "worktree", phase_id: null, review_scope: "integration" },
      evidence_refs: [{ ref: "evidence/acceptance-AC-1-workspace-b.json", sha256: workspaceBAcceptanceHash }],
    };
    workspaceBAttempt.evidence_refs = [];
    workspaceBAttempt.verify_passing_publication = {
      ...workspaceBAttempt.verify_passing_publication,
      test_receipt_ref: workspaceBTests.receipt_ref,
      test_receipt_hash: workspaceBTests.receipt_hash,
      review_result_ref: revisedBuildReview.resultRef,
      review_result_hash: workspaceBAttempt.facts.review.result_hash,
      acceptance_evidence_refs: structuredClone(workspaceBAttempt.facts.evidence_refs),
      workspace_head: workspaceBTests.snapshot_head,
      workspace_tree: workspaceBTests.snapshot_tree,
    };
    writeFileSync(task.recordPath("results/verify-code/attempt-0010.json"), `${JSON.stringify(workspaceBAttempt, null, 2)}\n`);
    const workspaceBConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--attempt=attempt-0010.json", "--decision=accepted"]);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\nworkspace-b\n");
    const rejectedWorkspaceBAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--attempt=attempt-0010.json", `--human-confirmation-ref=${workspaceBConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedWorkspaceBAccept.status).not.toBe(0);
    expect(rejectedWorkspaceBAccept.stderr).toMatch(/Workspace binding changed/i);
    expect(JSON.parse(task.readRecord("results/verify-code/accepted.json"))).toMatchObject({ attempt_ref: "attempt-0001.json" });
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const failureConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${controlledFailure.attempt_ref}`, "--decision=accepted"]);
    const rejectedFailureAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${controlledFailure.attempt_ref}`, `--human-confirmation-ref=${failureConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedFailureAccept.status).not.toBe(0);
    expect(rejectedFailureAccept.stderr).toMatch(/accepted and closed/i);

    const passingConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, "--decision=accepted"]);
    const rejectedConfirmation = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${originalVerify.accepted.human_confirmation_ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedConfirmation.status).not.toBe(0);
    expect(rejectedConfirmation.stderr).toMatch(/does not bind/i);

    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\naccept drift\n");
    const rejectedAcceptDrift = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedAcceptDrift.status).not.toBe(0);
    expect(rejectedAcceptDrift.stderr).toMatch(/Workspace binding changed/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const buildCanonicalBeforeAccept = task.readRecord("results/build-code/accepted.json");
    const buildCanonical = JSON.parse(buildCanonicalBeforeAccept);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), `${JSON.stringify({ ...buildCanonical, integrity_hash: "0".repeat(64) }, null, 2)}\n`);
    const rejectedBuildAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBuildAccept.status).not.toBe(0);
    expect(rejectedBuildAccept.stderr).toMatch(/build-code accepted integrity hash mismatch/i);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), buildCanonicalBeforeAccept);

    const priorBuildCanonical = task.readRecord("results/build-code/accepted-attempt-0001.json");
    writeFileSync(task.recordPath("results/build-code/accepted.json"), priorBuildCanonical);
    const rejectedDifferentActiveBuild = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedDifferentActiveBuild.status).not.toBe(0);
    expect(rejectedDifferentActiveBuild.stderr).toMatch(/binding changed|active build lineage/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(acceptedVerifyRaw);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), buildCanonicalBeforeAccept);

    const verifyCanonicalBeforeAccept = task.readRecord("results/verify-code/accepted.json");
    const freshTestRaw = task.readRecord(freshVerifyTests.receipt_ref);
    writeFileSync(task.recordPath(freshVerifyTests.receipt_ref), `${freshTestRaw}drift`);
    const rejectedTestMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedTestMaterial.status).not.toBe(0);
    expect(rejectedTestMaterial.stderr).toMatch(/test receipt changed/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(freshVerifyTests.receipt_ref), freshTestRaw);

    const revisedReviewMaterialRaw = task.readRecord(revisedBuildReview.resultRef);
    writeFileSync(task.recordPath(revisedBuildReview.resultRef), `${revisedReviewMaterialRaw}drift`);
    const rejectedReviewMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedReviewMaterial.status).not.toBe(0);
    expect(rejectedReviewMaterial.stderr).toMatch(/review result changed/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(revisedBuildReview.resultRef), revisedReviewMaterialRaw);

    const freshEvidenceRaw = task.readRecord("evidence/acceptance-AC-1-revised.json");
    writeFileSync(task.recordPath("evidence/acceptance-AC-1-revised.json"), `${freshEvidenceRaw}drift`);
    const rejectedAcceptanceMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedAcceptanceMaterial.status).not.toBe(0);
    expect(rejectedAcceptanceMaterial.stderr).toMatch(/acceptance evidence hash mismatch/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath("evidence/acceptance-AC-1-revised.json"), freshEvidenceRaw);

    const verifyArchiveRef = "results/verify-code/accepted-attempt-0001.json";
    const criticalDriftKernel = createTaskKernel(task, { workspace, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\ncritical-drift\n"); } } });
    expect(() => criticalDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/Workspace binding changed|active accepted build tests\/review snapshot/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(createTaskKernel(task).readAccepted("verify-code").accepted.attempt_ref).toBe("attempt-0001.json");
    expect(() => task.readRecord(verifyArchiveRef)).toThrow(/ENOENT|no such/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const criticalBuildDriftKernel = createTaskKernel(task, { workspace, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath("results/build-code/accepted.json"), priorBuildCanonical); } } });
    expect(() => criticalBuildDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/binding changed|active build lineage/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(() => task.readRecord(verifyArchiveRef)).toThrow(/ENOENT|no such/i);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), buildCanonicalBeforeAccept);

    const criticalCanonicalDriftKernel = createTaskKernel(task, { workspace, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath("results/verify-code/accepted.json"), "critical canonical drift\n"); } } });
    expect(() => criticalCanonicalDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/compare-and-swap|canonical/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(() => task.readRecord(verifyArchiveRef)).toThrow(/ENOENT|no such/i);

    const passingAttemptPath = `results/verify-code/${passing.attempt_ref}`;
    const passingAttemptRaw = task.readRecord(passingAttemptPath);
    const criticalAttemptDriftKernel = createTaskKernel(task, { workspace, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath(passingAttemptPath), `${passingAttemptRaw}drift`); } } });
    expect(() => criticalAttemptDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/attempt changed|invalid verify-code attempt/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(() => task.readRecord(verifyArchiveRef)).toThrow(/ENOENT|no such/i);
    writeFileSync(task.recordPath(passingAttemptPath), passingAttemptRaw);

    const passingConfirmationRaw = task.readRecord(passingConfirmation.ref);
    const criticalConfirmationDriftKernel = createTaskKernel(task, { workspace, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath(passingConfirmation.ref), `${passingConfirmationRaw}drift`); } } });
    expect(() => criticalConfirmationDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/confirmation changed|invalid human confirmation/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(() => task.readRecord(verifyArchiveRef)).toThrow(/ENOENT|no such/i);
    writeFileSync(task.recordPath(passingConfirmation.ref), passingConfirmationRaw);

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
    expect(readFileSync(join(linked, "src", "feature.txt"), "utf8")).toBe("implemented after pre-review fix\n");
    for (const name of ["spec.md", "plan.md", "tasks.md"]) expect(existsSync(join(linked, "specs", "official-chain", name))).toBe(true);
    expect(existsSync(join(repo, "src", "feature.txt"))).toBe(false);
    expect(existsSync(join(repo, "specs", "official-chain"))).toBe(false);
    expect(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim()).toBe(baseline);
    expect(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo, encoding: "utf8" }).trim()).toBe(mainStatus);
  });
});
