import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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
  it("runs repository-owned handlers and accepts the complete chain", async () => {
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

    mkdirSync(join(workspace.worktreeRoot, "specs", "official-chain"), { recursive: true });
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "spec.md"), "# Spec draft\n");
    writeFormalReviewFixture({ task, stage: "build-spec", snapshotTree: captureWorkspaceSnapshot(workspace).tree, verdict: "revise_required" });
    expect(existsSync(join(task.taskPath, "receipts", "spec.json"))).toBe(false);
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "spec.md"), "# Spec\n");
    const specReview = writeFormalReviewFixture({ task, stage: "build-spec", snapshotTree: captureWorkspaceSnapshot(workspace).tree });
    writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "# Spec\n" } });
    expect(readdirSync(join(task.taskPath, "reviews", "results")).map((name) => JSON.parse(task.readRecord(`reviews/results/${name}`))).filter((result) => result.stage === "build-spec")).toHaveLength(2);
    expect(readdirSync(join(task.taskPath, "receipts")).filter((name) => name === "spec.json")).toEqual(["spec.json"]);
    expect(existsSync(join(task.taskPath, "receipts", "revisions", "spec"))).toBe(false);
    invoke("build-spec", { spec: "receipts/spec.json", review: specReview.resultRef });

    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "plan.md"), "# Plan draft\n");
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "tasks.md"), "# Tasks draft\n");
    writeFormalReviewFixture({ task, stage: "build-plan", snapshotTree: captureWorkspaceSnapshot(workspace).tree, verdict: "revise_required" });
    expect(existsSync(join(task.taskPath, "receipts", "plan.json"))).toBe(false);
    expect(existsSync(join(task.taskPath, "receipts", "tasks.json"))).toBe(false);
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "plan.md"), "# Plan, revised after review\n");
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "tasks.md"), "# Tasks\n");
    const planReview = writeFormalReviewFixture({ task, stage: "build-plan", snapshotTree: captureWorkspaceSnapshot(workspace).tree });
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan, revised after review\n" } });
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks\n" } });
    expect(readdirSync(join(task.taskPath, "reviews", "results")).map((name) => JSON.parse(task.readRecord(`reviews/results/${name}`))).filter((result) => result.stage === "build-plan")).toHaveLength(2);
    expect(readdirSync(join(task.taskPath, "receipts")).filter((name) => new Set(["plan.json", "tasks.json"]).has(name)).sort()).toEqual(["plan.json", "tasks.json"]);
    expect(existsSync(join(task.taskPath, "receipts", "revisions", "plan"))).toBe(false);
    expect(existsSync(join(task.taskPath, "receipts", "revisions", "tasks"))).toBe(false);
    const buildPlan = invoke("build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: planReview.resultRef });
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
    const firstBuild = invoke("build-code", { implementation: "receipts/implementation.json", tests: "receipts/build-tests.json", review: buildReview.resultRef });
    const firstBuildAcceptedRaw = task.readRecord("results/build-code/accepted.json");
    const firstBuildAcceptedHash = createHash("sha256").update(firstBuildAcceptedRaw).digest("hex");

    const verifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf fixture-output", receiptRef: "receipts/verify-tests.json", outputRef: "evidence/verify-output.txt" });
    const verifyReview = writeFormalReviewFixture({ task, stage: "verify-code", snapshotTree: verifyTests.snapshot_tree });
    const acceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: verifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1.json", acceptanceRaw);
    writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1.json", sha256: createHash("sha256").update(acceptanceRaw).digest("hex") }] } });
    const firstVerify = invoke("verify-code", { tests: "receipts/verify-tests.json", review: verifyReview.resultRef, evidence: "evidence/verify-evidence.json" });
    const firstVerifyAcceptedRaw = task.readRecord("results/verify-code/accepted.json");
    const firstVerifyAcceptedHash = createHash("sha256").update(firstVerifyAcceptedRaw).digest("hex");
    const { runOfficialStage } = await import("../../core/stage-runner.mjs");
    const { bootstrapStage } = await import("../../core/stage-context.mjs");
    const unauthorizedVerifyRevision = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1.json", sha256: createHash("sha256").update(acceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    expect(() => runOfficialStage("verify-code", bootstrapStage("verify-code", { mode: "sidecar", taskPath: task.taskPath, projectName: "Demo", taskId: "official-chain" }), { receipts: { tests: "receipts/verify-tests.json", review: verifyReview.resultRef, evidence: unauthorizedVerifyRevision.ref } })).toThrow(/revision receipt requires controlled fresh verify lineage/i);
    const prematureFreshVerify = spawnSync(process.execPath, [runtime, "run", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${join(root, "verify-code-input.json")}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(prematureFreshVerify.status).not.toBe(0);
    expect(prematureFreshVerify.stderr).toMatch(/revised build-code acceptance/i);
    const failureDetail = "workspace lineage changed after accepted verification\n";
    createTaskKernel(task).publishCanonicalRecord("evidence/workspace-lineage-failure.txt", failureDetail);
    const failureRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "WORKSPACE-LINEAGE", result: "fail", refs: [{ ref: "evidence/workspace-lineage-failure.txt", sha256: createHash("sha256").update(failureDetail).digest("hex") }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/workspace-lineage-failure.json", failureRaw);
    const controlledFailure = run(root, repo, ["publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    expect(controlledFailure).toMatchObject({ attempt_ref: "attempt-0002.json", attempt: { verify_failure_publication: { failure_evidence_ref: "evidence/workspace-lineage-failure.json", active_build_accepted_ref: "results/build-code/accepted.json" } } });
    const duplicate = spawnSync(process.execPath, [runtime, "publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stderr).toMatch(/already exists/i);

    const reopen = run(root, repo, ["reopen", "--stage=build-code", "--project=Demo", "--task=official-chain", `--verify-attempt=${controlledFailure.attempt_ref}`, "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    const duplicateReopen = spawnSync(process.execPath, [runtime, "reopen", "--stage=build-code", "--project=Demo", "--task=official-chain", `--verify-attempt=${controlledFailure.attempt_ref}`, "--failure-evidence=evidence/workspace-lineage-failure.json"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicateReopen.status).not.toBe(0);
    expect(duplicateReopen.stderr).toMatch(/reopen already exists/i);

    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented and verified after rework\n");
    const revisedImplementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true }, revisionOf: "receipts/implementation.json" });
    const revisedBuildTests = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf revised-build-output", receiptRef: "receipts/build-tests-rework.json", outputRef: "evidence/build-output-rework.txt" });
    const revisedBuildReview = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: revisedImplementation.value.snapshot_tree });
    expect(() => runOfficialStage("build-code", bootstrapStage("build-code", { mode: "sidecar", taskPath: task.taskPath, projectName: "Demo", taskId: "official-chain" }), { receipts: { implementation: revisedImplementation.ref, tests: revisedBuildTests.receipt_ref, review: revisedBuildReview.resultRef } })).toThrow(/revision receipt requires a controlled reopen/i);
    const revisedBuild = invoke("build-code", { implementation: revisedImplementation.ref, tests: revisedBuildTests.receipt_ref, review: revisedBuildReview.resultRef }, [`--reopen=${reopen.reopen_ref}`]);
    const activeBuildRaw = task.readRecord("results/build-code/accepted.json");
    const activeBuild = JSON.parse(activeBuildRaw);
    expect(task.readRecord(`results/build-code/accepted-${firstBuild.attempt.attempt_ref}`)).toBe(firstBuildAcceptedRaw);
    expect(createHash("sha256").update(task.readRecord(`results/build-code/accepted-${firstBuild.attempt.attempt_ref}`)).digest("hex")).toBe(firstBuildAcceptedHash);
    expect(activeBuild.attempt_ref).toBe(revisedBuild.attempt.attempt_ref);
    expect(activeBuild.integrity_hash).toBe(revisedBuild.attempt.integrity_hash);
    expect(readdirSync(join(task.taskPath, "results", "build-code")).filter((name) => name.startsWith(`accepted-${firstBuild.attempt.attempt_ref.replace(/\.json$/, "")}`))).toEqual([`accepted-${firstBuild.attempt.attempt_ref}`]);

    const replay = spawnSync(process.execPath, [runtime, "run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${join(root, "build-code-input.json")}`, `--reopen=${reopen.reopen_ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(replay.status).not.toBe(0);
    expect(replay.stderr).toMatch(/not authorized|active accepted/i);

    const staleVerify = spawnSync(process.execPath, [runtime, "run", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${join(root, "verify-code-input.json")}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(staleVerify.status).not.toBe(0);
    expect(staleVerify.stderr).toMatch(/snapshot|current Workspace/i);

    const postBuildDrift = join(workspace.worktreeRoot, "src", "post-build-drift.txt");
    writeFileSync(postBuildDrift, "drift after revised build acceptance\n");
    const driftVerifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf drift-verify-output", receiptRef: "receipts/verify-tests-drift.json", outputRef: "evidence/verify-output-drift.txt" });
    const driftVerifyReview = writeFormalReviewFixture({ task, stage: "verify-code", snapshotTree: driftVerifyTests.snapshot_tree });
    const driftAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: driftVerifyTests.output_ref, sha256: driftVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1-drift.json", driftAcceptanceRaw);
    const driftEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1-drift.json", sha256: createHash("sha256").update(driftAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    await expect(runOfficialStage("verify-code", bootstrapStage("verify-code", { mode: "sidecar", taskPath: task.taskPath, projectName: "Demo", taskId: "official-chain" }), { receipts: { tests: driftVerifyTests.receipt_ref, review: driftVerifyReview.resultRef, evidence: driftEvidence.ref } })).rejects.toThrow(/revised build acceptance.*same snapshot tree/i);
    rmSync(postBuildDrift);

    const freshVerifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf fresh-verify-output", receiptRef: "receipts/verify-tests-rework.json", outputRef: "evidence/verify-output-rework.txt" });
    const freshVerifyReview = writeFormalReviewFixture({ task, stage: "verify-code", snapshotTree: freshVerifyTests.snapshot_tree });
    const freshAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1-rework.json", freshAcceptanceRaw);
    const freshEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1-rework.json", sha256: createHash("sha256").update(freshAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const freshVerifyContext = bootstrapStage("verify-code", { mode: "sidecar", taskPath: task.taskPath, projectName: "Demo", taskId: "official-chain" });
    const freshInvocation = { receipts: { tests: freshVerifyTests.receipt_ref, review: freshVerifyReview.resultRef, evidence: freshEvidence.ref } };
    const freshAttempt = await runOfficialStage("verify-code", freshVerifyContext, freshInvocation);
    await expect(runOfficialStage("verify-code", freshVerifyContext, freshInvocation)).rejects.toThrow(/fresh verify already published as .*resume and accept/i);
    const freshConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${freshAttempt.attempt_ref}`, "--decision=accepted"]);
    const freshAccepted = run(root, repo, ["accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${freshAttempt.attempt_ref}`, `--human-confirmation-ref=${freshConfirmation.ref}`]);
    const freshVerify = { attempt: freshAttempt, accepted: freshAccepted };
    expect(freshVerify.attempt.attempt.facts.tests.receipt_ref).toBe(freshVerifyTests.receipt_ref);
    expect(freshVerify.attempt.attempt.facts.tests.snapshot_tree).toBe(freshVerifyTests.snapshot_tree);
    expect(freshVerifyTests.snapshot_tree).not.toBe(verifyTests.snapshot_tree);
    expect(freshVerify.attempt.attempt.facts.review.result_ref).toBe(freshVerifyReview.resultRef);
    expect(freshVerify.attempt.attempt.facts.review.result_ref).not.toBe(verifyReview.resultRef);
    expect(freshVerify.attempt.attempt.upstream_acceptances).toContainEqual(expect.objectContaining({ stage: "build-code", integrity_hash: String(activeBuild.integrity_hash).replace(/^sha256:/, "") }));
    const activeVerify = JSON.parse(task.readRecord("results/verify-code/accepted.json"));
    expect(activeVerify.attempt_ref).toBe(freshVerify.attempt.attempt_ref);
    expect(task.readRecord(`results/verify-code/accepted-${firstVerify.attempt.attempt_ref}`)).toBe(firstVerifyAcceptedRaw);
    expect(createHash("sha256").update(task.readRecord(`results/verify-code/accepted-${firstVerify.attempt.attempt_ref}`)).digest("hex")).toBe(firstVerifyAcceptedHash);
    expect(readdirSync(join(task.taskPath, "results", "verify-code")).filter((name) => name.startsWith(`accepted-${firstVerify.attempt.attempt_ref.replace(/\.json$/, "")}`))).toEqual([`accepted-${firstVerify.attempt.attempt_ref}`]);

    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(JSON.parse(task.readRecord(`results/${stage}/accepted.json`))).toMatchObject({ schema_version: "task-accepted.v2", task_id: "official-chain", stage });
    }
    const linked = workspace.worktreeRoot;
    expect(readFileSync(join(linked, "src", "feature.txt"), "utf8")).toBe("implemented and verified after rework\n");
    for (const name of ["spec.md", "plan.md", "tasks.md"]) expect(existsSync(join(linked, "specs", "official-chain", name))).toBe(true);
    expect(existsSync(join(repo, "src", "feature.txt"))).toBe(false);
    expect(existsSync(join(repo, "specs", "official-chain"))).toBe(false);
    expect(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim()).toBe(baseline);
    expect(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo, encoding: "utf8" }).trim()).toBe(mainStatus);
  });
});
