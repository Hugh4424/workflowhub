import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { hashAuditSummary } from "../../core/audit-summary-carrier.mjs";
import { createCanonicalReviewWriter } from "../../core/canonical-receipt-writer.mjs";
import { captureGitWorktreeSnapshot } from "../../core/git-worktree-snapshot.mjs";
import { createPhaseDiffScan } from "../../workflows/build-code/diff-scanner.mjs";
import { inspectRunnerIdentity } from "../../core/runner-identity.mjs";
import { createTask, migrateTaskRunnerRoot, openTask } from "../../core/task-handle.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../../core/workspace.mjs";
import { canonical, normalizedRecoveryRecordHash, sha256, writeRecoveryCredentialForTest } from "../../core/task-recovery.mjs";
import { readPhaseMapTrace } from "../../skills/wh-review/scripts/phase-review-subject.mjs";
import { aggregateProviderResults } from "../../skills/wh-review/scripts/review-result.mjs";
import { publishBuildCodePhaseEvidence } from "../../workflows/build-code/phase-evidence.mjs";
import { publishPhaseTraceLineage, runRecovery, supersedePhaseTraceLineage } from "../task-recovery.mjs";

const SCRIPT = fileURLToPath(new URL("../task-recovery.mjs", import.meta.url));
const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function commit(cwd, message) {
  git(cwd, ["add", "."]);
  git(cwd, ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", message]);
}

function publishAuditedAttempt({ kernel, task, stage, worktreeRoot, workflowRunId, data }) {
  const snapshot = captureGitWorktreeSnapshot(worktreeRoot);
  const kind = `${stage}-recovery-fixture`;
  const content = {
    schema_version: "stage-content-evidence.v1",
    kind,
    task_id: task.identity.taskId,
    stage,
    workflow_run_id: workflowRunId,
    snapshot_tree: snapshot.tree,
  };
  const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
  const contentHash = sha256(contentRaw);
  const contentRef = `evidence/stage-content/${contentHash}/${stage}-recovery-fixture.json`;
  kernel.publishCanonicalRecord(contentRef, contentRaw);
  const contentEvidenceRefs = [{ kind, ref: contentRef, hash: contentHash }];
  const unsignedSummary = {
    schema_version: "stage-audit-summary.v1",
    task_id: task.identity.taskId,
    stage_slug: stage,
    workflow_run_id: workflowRunId,
    snapshot_tree: snapshot.tree,
    verdict: "pass",
    content_evidence_refs: contentEvidenceRefs,
  };
  const summaryHash = hashAuditSummary(unsignedSummary);
  const summaryRef = `evidence/audits/${stage}/${summaryHash}.json`;
  kernel.publishCanonicalRecord(summaryRef, `${JSON.stringify({ ...unsignedSummary, summary_hash: summaryHash }, null, 2)}\n`);
  return kernel.publishAttempt(stage, {
    ...data,
    facts: {
      ...data.facts,
      audit_contract_version: "v1",
      audit_summary_ref: summaryRef,
      audit_summary_hash: summaryHash,
      audit_verdict: "pass",
      content_evidence_refs: contentEvidenceRefs,
    },
  });
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-recovery-cli-")));
  roots.push(root);
  const storage = join(root, "storage");
  const target = join(root, "target");
  const oldRunner = join(root, "old-runner");
  mkdirSync(storage);
  mkdirSync(target);
  mkdirSync(oldRunner);
  git(target, ["init", "-q", "-b", "main"]);
  git(target, ["config", "user.name", "WorkflowHub Tests"]);
  git(target, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(target, "README.md"), "target\n");
  commit(target, "target");

  git(oldRunner, ["init", "-q", "-b", "task/workflowhub/recovery-cli"]);
  writeFileSync(join(oldRunner, "AGENTS.md"), "# Runner\n");
  mkdirSync(join(oldRunner, "workflows", "build-code"), { recursive: true });
  writeFileSync(join(oldRunner, "workflows", "build-code", "SKILL.md"), "# build-code\n");
  commit(oldRunner, "runner");

  const task = createTask({ storageRoot: storage, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "recovery-cli",
    created_at: "2026-07-25T00:00:00.000Z", target_repo_root: realpathSync(target), issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const attempt = publishAuditedAttempt({
    kernel,
    task,
    stage: "make-decision",
    worktreeRoot: candidate.worktreeRoot,
    workflowRunId: `task-created:${task.manifest.created_at}`,
    data: { facts: {
      worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit,
      snapshot_tree: git(candidate.worktreeRoot, ["rev-parse", "HEAD^{tree}"]),
    } },
  });
  kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const bound = createTaskKernel(task, { workspace, artifacts });
  artifacts.writeAtomic("spec.md", "# Recovery spec\n");
  const specCheckpoint = bound.createCheckpoint("build-spec");
  const spec = publishAuditedAttempt({
    kernel: bound,
    task,
    stage: "build-spec",
    worktreeRoot: workspace.worktreeRoot,
    workflowRunId: attempt.attempt.attempt_id,
    data: {
      facts: { spec_ref: artifacts.reference("spec.md"), checkpoint: specCheckpoint },
      upstream_refs: [{ task_id: task.identity.taskId, stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    },
  });
  bound.acceptAttempt("build-spec", spec.attempt_ref);
  artifacts.writeAtomic("plan.md", "# Recovery plan\n");
  artifacts.writeAtomic("tasks.md", "# Recovery tasks\n");
  const planCheckpoint = bound.createCheckpoint("build-plan");
  const plan = publishAuditedAttempt({
    kernel: bound,
    task,
    stage: "build-plan",
    worktreeRoot: workspace.worktreeRoot,
    workflowRunId: spec.attempt.attempt_id,
    data: {
      facts: {
        plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"),
        checkpoint: planCheckpoint,
      },
      upstream_refs: [{ task_id: task.identity.taskId, stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
    },
  });
  bound.acceptAttempt("build-plan", plan.attempt_ref, writeHumanConfirmation(bound, "build-plan", plan));
  const migrated = migrateTaskRunnerRoot({
    taskPath: task.taskPath, projectName: "workflowhub", taskId: "recovery-cli",
    runnerRoot: realpathSync(oldRunner), stage: "build-code",
  });
  const nextRunner = join(root, "new-runner");
  git(root, ["clone", "-q", realpathSync(oldRunner), nextRunner]);
  writeFileSync(join(nextRunner, "replacement.txt"), "new runner\n");
  commit(nextRunner, "replacement");
  return { root, task: migrated.task, oldRunner: realpathSync(oldRunner), nextRunner: realpathSync(nextRunner) };
}

function runCli(args) {
  return execFileSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function sameSnapshotRecoveryFixture({ reviewStatus = "pass", serious = false } = {}) {
  const f = fixture();
  const target = f.task.manifest.target_repo_root;
  const accepted = createTaskKernel(f.task).readAccepted("make-decision");
  const baselineCommit = accepted.facts.baseline_commit;
  const snapshotTree = git(target, ["rev-parse", `${baselineCommit}^{tree}`]);
  const recordKernel = createTaskKernel(f.task);
  const outputRaw = "same snapshot recovery green\n";
  const outputRef = "evidence/same-snapshot-green.output";
  recordKernel.publishCanonicalRecord(outputRef, outputRaw);
  const implementationRef = "receipts/same-snapshot-implementation.json";
  recordKernel.publishCanonicalRecord(implementationRef, `${JSON.stringify({
    schema_version: "workflowhub-receipt.v1", task_id: f.task.identity.taskId, stage: "build-code",
    producer: { stage: "build-code", component: "implementation", version: "1.0.0" },
    changed: [], snapshot_head: baselineCommit, snapshot_tree: snapshotTree,
    snapshot_commit: baselineCommit, diff_ref: "evidence/same-snapshot.diff", diff_hash: "a".repeat(64),
  }, null, 2)}\n`);
  const greenRef = "receipts/same-snapshot-green.json";
  recordKernel.publishCanonicalRecord(greenRef, `${JSON.stringify({
    schema_version: "workflowhub-receipt.v1", task_id: f.task.identity.taskId, stage: "build-code",
    producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
    command: "true", command_hash: "b".repeat(64), exit_code: 0, snapshot_head: baselineCommit,
    snapshot_tree: snapshotTree, snapshot_commit: baselineCommit,
    started_at: "2026-07-25T00:00:00.000Z", completed_at: "2026-07-25T00:00:01.000Z",
    output_ref: outputRef, output_hash: sha256(outputRaw),
  }, null, 2)}\n`);
  const baselineDiffRef = `evidence/phases/phase-0/${snapshotTree}/diff-scan-same-snapshot.json`;
  recordKernel.publishCanonicalRecord(baselineDiffRef, `${JSON.stringify({
    schema_version: "phase-diff-scan.v1", phase_id: "phase-0", baseline_commit: baselineCommit,
    implementation_commit: baselineCommit, snapshot_tree: snapshotTree,
    allowed_files: [], changed_files: [], safe: true, violations: [], c2_violations: [],
    allowlist_violations: [], runtime_controlled_changes: [],
  }, null, 2)}\n`);
  const baselineEvidenceRef = `evidence/phases/phase-0/${snapshotTree}/phase-evidence-same-snapshot.json`;
  recordKernel.publishCanonicalRecord(baselineEvidenceRef, `${JSON.stringify({
    phase_id: "phase-0", status: "done", needs_human: false, diff_scan: { path: baselineDiffRef },
    declared_allowed_files: [], tests: { green: { path: greenRef } },
    evidence: { diff: baselineDiffRef, implementation_receipt_ref: implementationRef, green_test_receipt_ref: greenRef },
  }, null, 2)}\n`);
  const reviewWriter = createCanonicalReviewWriter({ task: f.task, taskId: f.task.identity.taskId, stage: "build-code" });
  const reviewId = `phase-0-same-snapshot-${reviewStatus.replaceAll("_", "-")}`;
  const attemptRef = `reviews/attempts/${reviewId}/attempt.json`;
  const resultRef = `reviews/results/${reviewId}.json`;
  const materialId = "c".repeat(64);
  const source = { target_commit: baselineCommit, base_commit: baselineCommit, base_tree: snapshotTree, captured_head: baselineCommit };
  reviewWriter.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: reviewId, task_id: f.task.identity.taskId, stage: "build-code",
    review_track: null, subject_kind: "phase", phase_id: "phase-0", review_scope: "phase",
    base_tree: snapshotTree, candidate_tree: snapshotTree, source, snapshot_tree: snapshotTree, material_id: materialId,
    provider_attempts: reviewStatus === "unavailable"
      ? [{ provider: "fixture", status: "failed", session_id: null, runtime_id: null, output_ref: null, error: { code: "PROVIDER_UNAVAILABLE", message: "fixture unavailable" } }]
      : [{ provider: "fixture", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: null, error: null }],
    terminal_status: reviewStatus === "unavailable" ? "unavailable" : "semantic",
    error: reviewStatus === "unavailable" ? { code: "PROVIDER_UNAVAILABLE", message: "fixture unavailable" } : null,
  });
  if (reviewStatus !== "unavailable") {
    const providerFinding = {
      severity: serious ? "major" : "minor", path: "fixture",
      issue: "baseline review advice", root_cause: "fixture root cause",
      recommendation: "repair fixture", evidence_kind: "direct", evidence: "fixture anchor",
    };
    const providerOutput = {
      verdict: reviewStatus,
      summary: `${reviewStatus} baseline quality fact`,
      findings: reviewStatus === "revise_required" ? [providerFinding] : [],
    };
    const aggregation = aggregateProviderResults([{ provider: "fixture", review: providerOutput }], 1);
    reviewWriter.writeResult(resultRef, {
      version: "wh-review-result.v1", task_id: f.task.identity.taskId, stage: "build-code", review_track: null,
      subject_kind: "phase", phase_id: "phase-0", review_scope: "phase", base_tree: snapshotTree,
      candidate_tree: snapshotTree, source, snapshot_tree: snapshotTree, material_id: materialId,
      attempt_ref: attemptRef,
      provider_results: [{ provider: "fixture", output: providerOutput }],
      verdict: aggregation.verdict,
      findings: aggregation.adjudication.reportFindings.map((item) => ({ provider: item.providers[0], ...item })),
      adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
    });
  }
  const reviewActionRef = reviewStatus === "unavailable" ? attemptRef : resultRef;
  const pointerRaw = `${JSON.stringify({ phase_id: "phase-1", status: "needs_revision", snapshot_tree: snapshotTree }, null, 2)}\n`;
  f.task.writeRecordAtomic("phase-result.json", pointerRaw);
  const credential = {
    schema_version: "workflowhub-recovery-credential.v1", project_name: "workflowhub", task_id: "recovery-cli",
    recovery_kind: "phase-pointer", nonce: "same-snapshot-recovery", issued_at: "2026-07-25T00:00:00.000Z", decision: "accepted",
    accepted_business_snapshot: {
      accepted_ref: accepted.accepted_ref, accepted_hash: accepted.accepted_hash,
      baseline_commit: accepted.facts.baseline_commit, snapshot_tree: accepted.facts.snapshot_tree,
      target_repo_root: target,
    },
    phase_subject: {
      current_pointer_ref: "phase-result.json", current_pointer_hash: sha256(pointerRaw),
      baseline_phase0_evidence_ref: baselineEvidenceRef, baseline_phase0_evidence_hash: sha256(f.task.readRecord(baselineEvidenceRef)),
      baseline_phase0_review_ref: reviewActionRef, baseline_phase0_review_hash: sha256(f.task.readRecord(reviewActionRef)),
      current_phase_id: "phase-1", target_phase_id: "phase-0", baseline_commit: baselineCommit,
      snapshot_tree: snapshotTree, recovery_intent: "same-snapshot-phase0-reopen",
      implementation_receipt: { ref: implementationRef, hash: sha256(f.task.readRecord(implementationRef)) },
      green_test_receipt: { ref: greenRef, hash: sha256(f.task.readRecord(greenRef)) },
      allowed_files: [],
    },
  };
  const written = writeRecoveryCredentialForTest(f.task, credential);
  const args = [
    "phase-pointer", `--task-path=${f.task.taskPath}`, "--project=workflowhub", "--task=recovery-cli",
    `--runner-root=${f.nextRunner}`, "--stage=build-code",
    `--credential-ref=${written.ref}`, `--credential-hash=${written.hash}`,
  ];
  return { ...f, args, pointerRaw, baselineEvidenceRef, resultRef: reviewActionRef, implementationRef, greenRef, snapshotTree, baselineCommit };
}

function recoveredPhaseContext(f) {
  const workspace = openAcceptedWorkspace(f.task, createTaskKernel(f.task).readAccepted("make-decision"));
  return { task: f.task, kernel: createTaskKernel(f.task, { workspace }), workspace };
}

function recoveredPhaseReview(f, recovery, canonicalEvidenceRef, verdict = "pass") {
  const writer = createCanonicalReviewWriter({ task: f.task, taskId: f.task.identity.taskId, stage: "build-code" });
  const scanRef = JSON.parse(f.task.readRecord("phase-result.json")).diff_scan.path;
  const scan = JSON.parse(f.task.readRecord(scanRef));
  const suffix = `phase-0-recovery-${verdict}`;
  const attemptRef = `reviews/attempts/${suffix}/attempt.json`;
  const resultRef = `reviews/results/${suffix}.json`;
  const phaseEvidence = {
    ref: canonicalEvidenceRef,
    sha256: sha256(f.task.readRecord(canonicalEvidenceRef)),
    recovery_ref: recovery.recovery_ref,
    recovery_hash: recovery.recovery_hash,
  };
  const source = {
    target_commit: scan.baseline_commit, base_commit: scan.baseline_commit,
    base_tree: f.snapshotTree, captured_head: scan.implementation_commit,
  };
  const materialId = sha256(JSON.stringify(phaseEvidence));
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: suffix, task_id: f.task.identity.taskId, stage: "build-code",
    review_track: null, subject_kind: "phase", phase_id: "phase-0", review_scope: "phase",
    base_tree: f.snapshotTree, candidate_tree: f.snapshotTree, phase_evidence: phaseEvidence,
    source, snapshot_tree: f.snapshotTree, material_id: materialId,
    provider_attempts: [{ provider: "fixture", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: null, error: null }],
    terminal_status: "semantic", error: null,
  });
  const finding = { severity: "major", path: "fixture", issue: "repair", recommendation: "repair" };
  writer.writeResult(resultRef, {
    version: "wh-review-result.v1", task_id: f.task.identity.taskId, stage: "build-code", review_track: null,
    subject_kind: "phase", phase_id: "phase-0", review_scope: "phase",
    base_tree: f.snapshotTree, candidate_tree: f.snapshotTree, phase_evidence: phaseEvidence,
    source, snapshot_tree: f.snapshotTree, material_id: materialId, attempt_ref: attemptRef,
    provider_results: [{ provider: "fixture", output: {
      verdict, summary: "fresh recovery review", findings: verdict === "pass" ? [] : [finding],
    } }],
    verdict, findings: verdict === "pass" ? [] : [{ provider: "fixture", ...finding }],
  });
  return { attemptRef, resultRef, materialId, phaseEvidence };
}

function runRecoveryChild(args, readyPath, goPath) {
  const moduleUrl = new URL("../task-recovery.mjs", import.meta.url).href;
  const code = [
    'import { existsSync, writeFileSync } from "node:fs";',
    "const { runRecovery } = await import(process.env.WH_RECOVERY_MODULE);",
    "const args = JSON.parse(process.env.WH_RECOVERY_ARGS);",
    "const wait = () => { writeFileSync(process.env.WH_READY, 'ready\\n'); while (!existsSync(process.env.WH_GO)) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5); };",
    "try { const value = runRecovery(args, { beforeCommitLock: wait, beforeContinuation() { throw new Error('stop after commit'); } }); process.stdout.write(JSON.stringify({ ok: true, value })); }",
    "catch (error) { process.stdout.write(JSON.stringify({ ok: false, code: error.recovery_code, message: error.message })); }",
  ].join("\n");
  const child = spawn(process.execPath, ["--input-type=module", "-e", code], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env, WH_RECOVERY_MODULE: moduleUrl, WH_RECOVERY_ARGS: JSON.stringify(args),
      WH_READY: readyPath, WH_GO: goPath,
    },
  });
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (codeValue) => {
      if (codeValue !== 0) reject(new Error(stderr || `recovery child exited ${codeValue}`));
      else resolve(JSON.parse(stdout));
    });
  });
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("task recovery CLI integration", () => {
  it("executes runner replacement through the official CLI and preserves lineage", () => {
    const f = fixture();
    const previous = JSON.parse(f.task.readRecord(f.task.manifest.runner_root_migration.ref)).runner_identity;
    const next = inspectRunnerIdentity({ runnerRoot: f.nextRunner, projectName: "workflowhub", taskId: "recovery-cli", stage: "build-code" });
    const accepted = createTaskKernel(f.task).readAccepted("make-decision");
    const credential = {
      schema_version: "workflowhub-recovery-credential.v1", project_name: "workflowhub", task_id: "recovery-cli",
      recovery_kind: "runner-replacement", nonce: "runner-replacement-cli", issued_at: "2026-07-25T00:00:00.000Z", decision: "accepted",
    accepted_business_snapshot: {
        accepted_ref: accepted.accepted_ref, accepted_hash: accepted.accepted_hash,
        baseline_commit: accepted.facts.baseline_commit,
        snapshot_tree: git(f.task.manifest.target_repo_root, ["rev-parse", `${accepted.facts.baseline_commit}^{tree}`]),
        target_repo_root: f.task.manifest.target_repo_root,
      },
      runner_subject: {
        previous_runner: previous, new_runner: next,
        previous_manifest_hash: sha256(f.task.readRecord("task.json")), stage: "build-code",
      },
    };
    const written = writeRecoveryCredentialForTest(f.task, credential);
    const output = JSON.parse(runCli([
      "runner-replacement", `--task-path=${f.task.taskPath}`, "--project=workflowhub", "--task=recovery-cli",
      `--runner-root=${f.nextRunner}`, "--stage=build-code", `--credential-ref=${written.ref}`, `--credential-hash=${written.hash}`,
    ]));
    expect(output).toMatchObject({ recovery_ref: "identity/recoveries/runner-replacement-0001.json", next_entry: "task-bootstrap" });
    expect(output).not.toHaveProperty("task_path");
    expect(output).not.toHaveProperty("previous_runner");
    expect(output).not.toHaveProperty("new_runner");
    const recovered = openTask(f.task.taskPath, "workflowhub", "recovery-cli");
    expect(recovered.manifest.runner_root).toBe(f.nextRunner);
    expect(recovered.manifest.runner_oid).toBe(next.runner_oid);
    const generation = JSON.parse(recovered.readRecord(output.recovery_ref));
    expect(generation).toMatchObject({ recovery_kind: "runner-replacement", result: "accepted" });
    expect(generation.after.hash).toBe(normalizedRecoveryRecordHash("runner-replacement", {
      ...recovered.manifest, runner_replacement: { ref: output.recovery_ref, integrity_hash: output.recovery_hash },
    }));
  });

  it("appends a second authenticated runner generation and keeps the full history immutable", () => {
    const f = fixture();
    const original = JSON.parse(f.task.readRecord(f.task.manifest.runner_root_migration.ref)).runner_identity;
    const runner2 = inspectRunnerIdentity({
      runnerRoot: f.nextRunner,
      projectName: "workflowhub",
      taskId: "recovery-cli",
      stage: "build-code",
    });
    const accepted = createTaskKernel(f.task).readAccepted("make-decision");
    const businessSnapshot = {
      accepted_ref: accepted.accepted_ref,
      accepted_hash: accepted.accepted_hash,
      baseline_commit: accepted.facts.baseline_commit,
      snapshot_tree: git(f.task.manifest.target_repo_root, ["rev-parse", `${accepted.facts.baseline_commit}^{tree}`]),
      target_repo_root: f.task.manifest.target_repo_root,
    };
    const credential1 = {
      schema_version: "workflowhub-recovery-credential.v1",
      project_name: "workflowhub",
      task_id: "recovery-cli",
      recovery_kind: "runner-replacement",
      nonce: "runner-generation-1",
      issued_at: "2026-07-25T00:00:00.000Z",
      decision: "accepted",
      accepted_business_snapshot: businessSnapshot,
      runner_subject: {
        previous_runner: original,
        new_runner: runner2,
        previous_manifest_hash: sha256(f.task.readRecord("task.json")),
        stage: "build-code",
      },
    };
    const written1 = writeRecoveryCredentialForTest(f.task, credential1);
    const output1 = JSON.parse(runCli([
      "runner-replacement",
      `--task-path=${f.task.taskPath}`,
      "--project=workflowhub",
      "--task=recovery-cli",
      `--runner-root=${f.nextRunner}`,
      "--stage=build-code",
      `--credential-ref=${written1.ref}`,
      `--credential-hash=${written1.hash}`,
    ]));
    expect(output1.recovery_ref).toBe("identity/recoveries/runner-replacement-0001.json");

    const afterFirst = openTask(f.task.taskPath, "workflowhub", "recovery-cli");
    const generation1Raw = afterFirst.readRecord(output1.recovery_ref);
    const generation1Hash = sha256(generation1Raw);
    const manifest1Raw = afterFirst.readRecord("task.json");
    const runner3Root = join(f.root, "third-runner");
    git(f.root, ["clone", "-q", f.nextRunner, runner3Root]);
    writeFileSync(join(runner3Root, "generation-3.txt"), "third runner\n");
    commit(runner3Root, "third runner");
    const runner3 = inspectRunnerIdentity({
      runnerRoot: realpathSync(runner3Root),
      projectName: "workflowhub",
      taskId: "recovery-cli",
      stage: "build-code",
    });
    const credential2 = {
      ...credential1,
      nonce: "runner-generation-2",
      issued_at: "2026-07-25T00:01:00.000Z",
      runner_subject: {
        previous_runner: runner2,
        new_runner: runner3,
        previous_manifest_hash: sha256(manifest1Raw),
        stage: "build-code",
      },
    };
    const written2 = writeRecoveryCredentialForTest(afterFirst, credential2);
    const output2 = JSON.parse(runCli([
      "runner-replacement",
      `--task-path=${afterFirst.taskPath}`,
      "--project=workflowhub",
      "--task=recovery-cli",
      `--runner-root=${runner3.runner_root}`,
      "--stage=build-code",
      `--credential-ref=${written2.ref}`,
      `--credential-hash=${written2.hash}`,
    ]));

    expect(output2.recovery_ref).toBe("identity/recoveries/runner-replacement-0002.json");
    const recovered = openTask(afterFirst.taskPath, "workflowhub", "recovery-cli");
    expect(recovered.manifest).toMatchObject({
      runner_root: runner3.runner_root,
      runner_oid: runner3.runner_oid,
      runner_replacement: {
        ref: output2.recovery_ref,
        integrity_hash: output2.recovery_hash,
      },
    });
    const generation2 = JSON.parse(recovered.readRecord(output2.recovery_ref));
    expect(generation2).toMatchObject({
      generation: 2,
      previous_generation_ref: output1.recovery_ref,
      previous_generation_hash: generation1Hash,
      before: { identity: runner2 },
      after: { identity: runner3 },
    });
    expect(recovered.readRecord(output1.recovery_ref)).toBe(generation1Raw);

    expect(() => runCli([
      "runner-replacement",
      `--task-path=${recovered.taskPath}`,
      "--project=workflowhub",
      "--task=recovery-cli",
      `--runner-root=${runner3.runner_root}`,
      "--stage=build-code",
      `--credential-ref=${written1.ref}`,
      `--credential-hash=${written1.hash}`,
    ])).toThrow(/RECOVERY_(?:CREDENTIAL_INVALID|RUNNER_PROVENANCE_MISMATCH)/);
    expect(recovered.readRecord(output1.recovery_ref)).toBe(generation1Raw);
    expect(recovered.readRecord(output2.recovery_ref)).toBe(canonical(generation2));
  });

  it("keeps both commands strict at the process boundary", () => {
    const help = runCli(["--help"]);
    expect(help).toMatch(/runner-replacement[\s\S]*phase-pointer/);
    expect(help).toContain("phase_subject.recovery_intent=same-snapshot-phase0-reopen");
    expect(help).toContain("changed-snapshot recovery must omit it");
    expect(help).toContain("create-only gate and pointer CAS");
    expect(help).toContain("fresh wh-review PASS");
    expect(help).toContain("Never edit task.json, phase-result.json, recovery generations");
    expect(help).toContain("RECOVERY_PHASE_INTENT_REQUIRED");
    expect(help).toContain("RECOVERY_PHASE_INTENT_USAGE_MISMATCH");
    expect(() => runCli(["runner-replacement"])).toThrow(/RECOVERY_INPUT_REQUIRED/);
    expect(() => runCli(["phase-pointer", "--stage=verify-code"])).toThrow(/RECOVERY_INPUT_REQUIRED/);
    expect(() => runCli(["unknown"])).toThrow(/RECOVERY_INPUT_REQUIRED/);
  });

  it("reports a same-snapshot recovery as committed when post-commit continuation is interrupted", () => {
    const f = sameSnapshotRecoveryFixture();
    const historical = new Map([
      [f.baselineEvidenceRef, f.task.readRecord(f.baselineEvidenceRef)],
      [f.resultRef, f.task.readRecord(f.resultRef)],
    ]);
    const output = runRecovery(f.args, {
      beforeContinuation() { throw new Error("simulated continuation interruption"); },
    });
    expect(output).toMatchObject({
      recovery_ref: "identity/recoveries/phase-pointer-0001.json",
      phase_id: "phase-0", status: "awaiting_review",
      next_entry: "stage-runtime publish-phase-evidence",
    });
    expect(output).not.toHaveProperty("canonical_phase_evidence_ref");
    expect(JSON.parse(f.task.readRecord("phase-result.json"))).toMatchObject({
      phase_id: "phase-0", status: "awaiting_review",
      recovery_ref: output.recovery_ref, recovery_hash: output.recovery_hash,
    });
    expect(JSON.parse(f.task.readRecord(output.recovery_ref))).toMatchObject({ result: "accepted" });
    for (const [ref, raw] of historical) expect(f.task.readRecord(ref)).toBe(raw);
    expect(() => runRecovery(f.args)).toThrow(/RECOVERY_ALREADY_USED/);
  });

  it("keeps the canonical evidence result on a healthy same-snapshot continuation", () => {
    const f = sameSnapshotRecoveryFixture();
    const output = runRecovery(f.args);
    expect(output).toMatchObject({
      recovery_ref: "identity/recoveries/phase-pointer-0001.json",
      phase_id: "phase-0", status: "awaiting_review", next_entry: "fresh wh-review",
    });
    expect(output.canonical_phase_evidence_ref).toMatch(
      /^evidence\/phases\/phase-0\/[a-f0-9]{40,64}\/phase-evidence-[a-f0-9]{64}\.json$/,
    );
    expect(JSON.parse(f.task.readRecord(output.canonical_phase_evidence_ref))).toMatchObject({
      phase_id: "phase-0",
      recovery_ref: output.recovery_ref,
      recovery_hash: output.recovery_hash,
    });
  });

  it.each(["revise_required", "unavailable"])(
    "accepts a credentialed Phase 0 %s quality fact without rewriting it to pass",
    (reviewStatus) => {
      const f = sameSnapshotRecoveryFixture({ reviewStatus });
      const output = runRecovery(f.args);
      expect(output).toMatchObject({
        recovery_ref: "identity/recoveries/phase-pointer-0001.json",
        phase_id: "phase-0",
        status: "awaiting_review",
      });
      expect(f.task.readRecord(f.resultRef)).toContain(
        reviewStatus === "unavailable" ? '"terminal_status": "unavailable"' : '"verdict": "revise_required"',
      );
    },
  );

  it("fails closed on serious Phase 0 findings without an exact risk binding", () => {
    const rejected = sameSnapshotRecoveryFixture({ reviewStatus: "revise_required", serious: true });
    expect(() => runRecovery(rejected.args)).toThrow(/actionable serious findings require repair or exact risk acceptance/i);
    expect(rejected.task.readRecord("phase-result.json")).toBe(rejected.pointerRaw);
    expect(() => rejected.task.readRecord("identity/recoveries/phase-pointer-0001.json")).toThrow();
  });

  it("rejects the historical same-tree review and reuses only the fresh recovery-bound result", () => {
    const f = sameSnapshotRecoveryFixture();
    const output = runRecovery(f.args);
    const context = recoveredPhaseContext(f);
    const input = {
      phase_id: "phase-0", implementation_receipt_ref: f.implementationRef,
      green_test_receipt_ref: f.greenRef, allowed_files: [],
      recovery_ref: output.recovery_ref, recovery_hash: output.recovery_hash,
    };
    expect(() => publishBuildCodePhaseEvidence(context, { ...input, review_result_ref: f.resultRef }))
      .toThrow(/formal phase review identity/i);
    const fresh = recoveredPhaseReview(f, output, output.canonical_phase_evidence_ref);
    expect(fresh.materialId).not.toBe(JSON.parse(f.task.readRecord(f.resultRef)).material_id);
    const completed = publishBuildCodePhaseEvidence(context, { ...input, review_result_ref: fresh.resultRef });
    expect(completed).toMatchObject({ review_result_ref: fresh.resultRef, review_verdict: "pass" });
    const attempts = f.task.listCanonicalReviewAttemptRefs();
    expect(publishBuildCodePhaseEvidence(context, { ...input, review_result_ref: fresh.resultRef }))
      .toMatchObject({ review_result_ref: fresh.resultRef, review_verdict: "pass" });
    expect(f.task.listCanonicalReviewAttemptRefs()).toEqual(attempts);
  });

  it("keeps a fresh revise-required recovery blocked without consuming another gate", () => {
    const f = sameSnapshotRecoveryFixture();
    const output = runRecovery(f.args);
    const context = recoveredPhaseContext(f);
    const fresh = recoveredPhaseReview(f, output, output.canonical_phase_evidence_ref, "revise_required");
    publishBuildCodePhaseEvidence(context, {
      phase_id: "phase-0", implementation_receipt_ref: f.implementationRef,
      green_test_receipt_ref: f.greenRef, allowed_files: [],
      recovery_ref: output.recovery_ref, recovery_hash: output.recovery_hash,
      review_result_ref: fresh.resultRef,
    });
    expect(JSON.parse(f.task.readRecord("phase-result.json"))).toMatchObject({
      phase_id: "phase-0", status: "needs_revision",
      recovery_ref: output.recovery_ref, recovery_hash: output.recovery_hash,
    });
    expect(() => runRecovery(f.args)).toThrow(/RECOVERY_ALREADY_USED/);
    expect(() => f.task.readRecord("identity/recoveries/phase-pointer-0002.json")).toThrow();
  });

  it("allows exactly one same-snapshot recovery when two validated requests race", async () => {
    const f = sameSnapshotRecoveryFixture();
    const readyOne = join(f.root, "ready-one");
    const readyTwo = join(f.root, "ready-two");
    const go = join(f.root, "go");
    const attemptsBefore = f.task.listCanonicalReviewAttemptRefs();
    const first = runRecoveryChild(f.args, readyOne, go);
    const second = runRecoveryChild(f.args, readyTwo, go);
    const deadline = Date.now() + 10_000;
    while ((!existsSync(readyOne) || !existsSync(readyTwo)) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(existsSync(readyOne)).toBe(true);
    expect(existsSync(readyTwo)).toBe(true);
    writeFileSync(go, "go\n");
    const outcomes = await Promise.all([first, second]);
    expect(outcomes.filter((item) => item.ok)).toHaveLength(1);
    expect(outcomes.filter((item) => !item.ok).map((item) => item.code))
      .toEqual([expect.stringMatching(/RECOVERY_(ALREADY_USED|CONCURRENT_CHANGE)/)]);
    const winner = outcomes.find((item) => item.ok).value;
    expect(winner.next_entry).toBe("stage-runtime publish-phase-evidence");
    expect(JSON.parse(f.task.readRecord("phase-result.json"))).toMatchObject({
      recovery_ref: winner.recovery_ref, recovery_hash: winner.recovery_hash,
    });
    expect(JSON.parse(f.task.readRecord("identity/recoveries/phase-pointer-0001.json")).result).toBe("accepted");
    expect(() => f.task.readRecord("identity/recoveries/phase-pointer-0002.json")).toThrow();
    expect(f.task.listCanonicalReviewAttemptRefs()).toEqual(attemptsBefore);
  }, 20_000);

  it("runs phase-pointer through the CLI and fails closed before mutation when closure is incomplete", () => {
    const f = fixture();
    const pointerRaw = `${JSON.stringify({ phase_id: "phase-1", status: "needs_revision" }, null, 2)}\n`;
    f.task.writeRecordAtomic("phase-result.json", pointerRaw);
    const accepted = createTaskKernel(f.task).readAccepted("make-decision");
    const credential = {
      schema_version: "workflowhub-recovery-credential.v1", project_name: "workflowhub", task_id: "recovery-cli",
      recovery_kind: "phase-pointer", nonce: "phase-pointer-cli", issued_at: "2026-07-25T00:00:00.000Z", decision: "accepted",
      accepted_business_snapshot: {
        accepted_ref: accepted.accepted_ref, accepted_hash: accepted.accepted_hash,
        baseline_commit: accepted.facts.baseline_commit, snapshot_tree: accepted.facts.snapshot_tree,
        target_repo_root: f.task.manifest.target_repo_root,
      },
      phase_subject: {
        current_pointer_ref: "phase-result.json", current_pointer_hash: sha256(pointerRaw),
        baseline_phase0_evidence_ref: "evidence/phases/phase-0/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/phase-evidence-missing.json",
        baseline_phase0_evidence_hash: "a".repeat(64),
        baseline_phase0_review_ref: "reviews/results/phase-0-missing.json", baseline_phase0_review_hash: "b".repeat(64),
        current_phase_id: "phase-1", target_phase_id: "phase-0", baseline_commit: accepted.facts.baseline_commit,
        snapshot_tree: "c".repeat(40), implementation_receipt: { ref: "receipts/implementation.json", hash: "d".repeat(64) },
        green_test_receipt: { ref: "receipts/build-tests.json", hash: "e".repeat(64) }, allowed_files: [],
      },
    };
    const written = writeRecoveryCredentialForTest(f.task, credential);
    expect(() => runCli([
      "phase-pointer", `--task-path=${f.task.taskPath}`, "--project=workflowhub", "--task=recovery-cli",
      `--runner-root=${f.nextRunner}`, "--stage=build-code", `--credential-ref=${written.ref}`, `--credential-hash=${written.hash}`,
    ])).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);
    expect(f.task.readRecord("phase-result.json")).toBe(pointerRaw);
    expect(() => f.task.readRecord("identity/recoveries/phase-pointer-0001.json")).toThrow();
  });

  it("runs phase-pointer success with a historical runtime-only baseline entry", () => {
    const f = fixture();
    const target = f.task.manifest.target_repo_root;
    const baselineCommit = git(target, ["rev-parse", "HEAD"]);
    const baselineTree = git(target, ["rev-parse", "HEAD^{tree}"]);
    writeFileSync(join(target, "phase-0.txt"), "recovered phase\n");
    commit(target, "phase-0 implementation");
    const implementationCommit = git(target, ["rev-parse", "HEAD"]);
    const implementationTree = git(target, ["rev-parse", "HEAD^{tree}"]);

    const outputRaw = "phase pointer green\n";
    const outputRef = "evidence/phase-pointer-green.output";
    const recordKernel = createTaskKernel(f.task);
    recordKernel.publishCanonicalRecord(outputRef, outputRaw);
    const implementationRef = "receipts/phase-pointer-implementation.json";
    recordKernel.publishCanonicalRecord(implementationRef, `${JSON.stringify({
      schema_version: "workflowhub-receipt.v1", task_id: f.task.identity.taskId, stage: "build-code",
      producer: { stage: "build-code", component: "implementation", version: "1.0.0" },
      changed: ["phase-0.txt"], snapshot_head: implementationCommit, snapshot_tree: implementationTree,
      snapshot_commit: implementationCommit, diff_ref: "evidence/phase-pointer.diff", diff_hash: "a".repeat(64),
    }, null, 2)}\n`);
    const greenRef = "receipts/phase-pointer-green.json";
    recordKernel.publishCanonicalRecord(greenRef, `${JSON.stringify({
      schema_version: "workflowhub-receipt.v1", task_id: f.task.identity.taskId, stage: "build-code",
      producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
      command: "true", command_hash: "b".repeat(64), exit_code: 0, snapshot_head: implementationCommit,
      snapshot_tree: implementationTree, snapshot_commit: implementationCommit,
      started_at: "2026-07-25T00:00:00.000Z", completed_at: "2026-07-25T00:00:01.000Z",
      output_ref: outputRef, output_hash: sha256(outputRaw),
    }, null, 2)}\n`);

    const baselineDiffRef = `evidence/phases/phase-0/${baselineTree}/diff-scan-historical.json`;
    recordKernel.publishCanonicalRecord(baselineDiffRef, `${JSON.stringify({
      schema_version: "phase-diff-scan.v1", phase_id: "phase-0", baseline_commit: baselineCommit,
      implementation_commit: baselineCommit, snapshot_tree: baselineTree,
      allowed_files: ["node_modules", "phase-0.txt"], changed_files: ["node_modules"], safe: true,
      violations: [], c2_violations: [], allowlist_violations: [], runtime_controlled_changes: [],
    }, null, 2)}\n`);
    const baselineEvidenceRef = `evidence/phases/phase-0/${baselineTree}/phase-evidence-historical.json`;
    recordKernel.publishCanonicalRecord(baselineEvidenceRef, `${JSON.stringify({
      phase_id: "phase-0", status: "done", needs_human: false,
      diff_scan: { path: baselineDiffRef },
      declared_allowed_files: ["node_modules", "phase-0.txt"],
      evidence: { diff: baselineDiffRef, implementation_receipt_ref: implementationRef, green_test_receipt_ref: greenRef },
    }, null, 2)}\n`);

    const reviewWriter = createCanonicalReviewWriter({ task: f.task, taskId: f.task.identity.taskId, stage: "build-code" });
    const reviewId = "phase-0-historical-pass";
    const attemptRef = `reviews/attempts/${reviewId}/attempt.json`;
    const resultRef = `reviews/results/${reviewId}.json`;
    const materialId = "c".repeat(64);
    const source = { target_commit: baselineCommit, base_commit: baselineCommit, base_tree: baselineTree, captured_head: baselineCommit };
    reviewWriter.writeAttempt(attemptRef, {
      version: "wh-review-attempt.v1", attempt_id: reviewId, task_id: f.task.identity.taskId, stage: "build-code",
      review_track: null, subject_kind: "phase", phase_id: "phase-0", review_scope: "phase",
      base_tree: baselineTree, candidate_tree: baselineTree, source, snapshot_tree: baselineTree, material_id: materialId,
      provider_attempts: [{ provider: "fixture", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: null, error: null }],
      terminal_status: "semantic", error: null,
    });
    reviewWriter.writeResult(resultRef, {
      version: "wh-review-result.v1", task_id: f.task.identity.taskId, stage: "build-code", review_track: null,
      subject_kind: "phase", phase_id: "phase-0", review_scope: "phase", base_tree: baselineTree, candidate_tree: baselineTree,
      source, snapshot_tree: baselineTree, material_id: materialId, attempt_ref: attemptRef,
      provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "historical baseline pass", findings: [] } }],
      verdict: "pass", findings: [],
    });
    const reviewRaw = f.task.readRecord(resultRef);
    const pointerRaw = `${JSON.stringify({ phase_id: "phase-1", status: "needs_revision", snapshot_tree: baselineTree }, null, 2)}\n`;
    f.task.writeRecordAtomic("phase-result.json", pointerRaw);
    const accepted = createTaskKernel(f.task).readAccepted("make-decision");
    const credential = {
      schema_version: "workflowhub-recovery-credential.v1", project_name: "workflowhub", task_id: "recovery-cli",
      recovery_kind: "phase-pointer", nonce: "phase-pointer-success", issued_at: "2026-07-25T00:00:00.000Z", decision: "accepted",
      accepted_business_snapshot: {
        accepted_ref: accepted.accepted_ref, accepted_hash: accepted.accepted_hash,
        baseline_commit: accepted.facts.baseline_commit, snapshot_tree: accepted.facts.snapshot_tree,
        target_repo_root: target,
      },
      phase_subject: {
        current_pointer_ref: "phase-result.json", current_pointer_hash: sha256(pointerRaw),
        baseline_phase0_evidence_ref: baselineEvidenceRef, baseline_phase0_evidence_hash: sha256(f.task.readRecord(baselineEvidenceRef)),
        baseline_phase0_review_ref: resultRef, baseline_phase0_review_hash: sha256(reviewRaw),
        current_phase_id: "phase-1", target_phase_id: "phase-0", baseline_commit: baselineCommit, snapshot_tree: implementationTree,
        implementation_receipt: { ref: implementationRef, hash: sha256(f.task.readRecord(implementationRef)) },
        green_test_receipt: { ref: greenRef, hash: sha256(f.task.readRecord(greenRef)) },
        allowed_files: ["node_modules", "phase-0.txt"],
      },
    };
    const invoke = (candidate) => {
      const writtenCandidate = writeRecoveryCredentialForTest(f.task, candidate);
      return runCli([
        "phase-pointer", `--task-path=${f.task.taskPath}`, "--project=workflowhub", "--task=recovery-cli",
        `--runner-root=${f.nextRunner}`, "--stage=build-code",
        `--credential-ref=${writtenCandidate.ref}`, `--credential-hash=${writtenCandidate.hash}`,
      ]);
    };
    const pointerBeforeRejects = f.task.readRecord("phase-result.json");

    expect(() => invoke({
      ...credential, nonce: "phase-pointer-same-missing",
      phase_subject: { ...credential.phase_subject, snapshot_tree: baselineTree },
    })).toThrow(/RECOVERY_PHASE_INTENT_REQUIRED/);
    expect(() => invoke({
      ...credential, nonce: "phase-pointer-changed-exact",
      phase_subject: { ...credential.phase_subject, recovery_intent: "same-snapshot-phase0-reopen" },
    })).toThrow(/RECOVERY_PHASE_INTENT_USAGE_MISMATCH/);
    expect(() => invoke({
      ...credential, nonce: "phase-pointer-same-exact",
      phase_subject: {
        ...credential.phase_subject, snapshot_tree: baselineTree,
        recovery_intent: "same-snapshot-phase0-reopen",
      },
    })).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);

    expect(() => invoke({
      ...credential, nonce: "phase-pointer-closure-hash",
      phase_subject: { ...credential.phase_subject, baseline_phase0_evidence_hash: "0".repeat(64) },
    })).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);
    const unreadableEvidenceRef = `evidence/phases/phase-0/${baselineTree}/phase-evidence-unreadable.json`;
    recordKernel.publishCanonicalRecord(unreadableEvidenceRef, "{not-json\n");
    expect(() => invoke({
      ...credential, nonce: "phase-pointer-closure-unreadable",
      phase_subject: {
        ...credential.phase_subject,
        baseline_phase0_evidence_ref: unreadableEvidenceRef,
        baseline_phase0_evidence_hash: sha256(f.task.readRecord(unreadableEvidenceRef)),
      },
    })).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);
    expect(f.task.readRecord("phase-result.json")).toBe(pointerBeforeRejects);
    expect(() => f.task.readRecord("identity/recoveries/phase-pointer-0001.json")).toThrow();

    const written = writeRecoveryCredentialForTest(f.task, credential);
    const output = JSON.parse(runCli([
      "phase-pointer", `--task-path=${f.task.taskPath}`, "--project=workflowhub", "--task=recovery-cli",
      `--runner-root=${f.nextRunner}`, "--stage=build-code", `--credential-ref=${written.ref}`, `--credential-hash=${written.hash}`,
    ]));
    expect(output).toMatchObject({ recovery_ref: "identity/recoveries/phase-pointer-0001.json", phase_id: "phase-0", status: "awaiting_review" });
    const recoveredPointer = JSON.parse(f.task.readRecord("phase-result.json"));
    expect(recoveredPointer.phase_id).toBe("phase-0");
    expect(recoveredPointer.status).toBe("awaiting_review");
    expect(recoveredPointer.declared_allowed_files).toEqual(["phase-0.txt"]);
    expect(JSON.parse(f.task.readRecord(output.recovery_ref)).result).toBe("accepted");
  });

  it("normalizes a real historical node_modules symlink in the Phase diff scanner", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-runtime-only-baseline-")));
    roots.push(root);
    git(root, ["init", "-q", "-b", "main"]);
    git(root, ["config", "user.name", "WorkflowHub Tests"]);
    git(root, ["config", "user.email", "tests@workflowhub.local"]);
    writeFileSync(join(root, "README.md"), "baseline\n");
    symlinkSync("../runtime-node-modules", join(root, "node_modules"));
    commit(root, "historical symlink baseline");
    const baseline = git(root, ["rev-parse", "HEAD"]);
    rmSync(join(root, "node_modules"));
    writeFileSync(join(root, "phase.txt"), "phase\n");
    commit(root, "phase implementation");
    const implementation = git(root, ["rev-parse", "HEAD"]);
    const scan = createPhaseDiffScan({ sourceRoot: root, phaseId: "phase-runtime-only", baselineCommit: baseline, implementationCommit: implementation, allowedFiles: ["node_modules", "phase.txt"] });
    expect(scan.changed_files).toEqual(["phase.txt"]);
    expect(scan.allowed_files).toEqual(["phase.txt"]);
    expect(scan.allowlist_violations).toEqual([]);
    expect(scan.safe).toBe(true);
  });

  it("binds a historical PASS Phase trace append-only and rejects bad hashes and duplicate bindings", () => {
    const f = fixture();
    const target = f.task.manifest.target_repo_root;
    const baselineCommit = git(target, ["rev-parse", "HEAD"]);
    const baselineTree = git(target, ["rev-parse", "HEAD^{tree}"]);
    writeFileSync(join(target, "phase-1.txt"), "historical phase\n");
    commit(target, "historical Phase 1");
    const implementationCommit = git(target, ["rev-parse", "HEAD"]);
    const snapshotTree = git(target, ["rev-parse", "HEAD^{tree}"]);
    const phaseRef = `refs/workflowhub/phases/workflowhub/recovery-cli/build-code/phase-1/snapshot-${snapshotTree}`;
    git(target, ["update-ref", phaseRef, implementationCommit]);
    const kernel = createTaskKernel(f.task);
    const implementationDiffRaw = "historical implementation diff\n";
    const implementationDiffRef = "evidence/lineage-implementation.diff";
    kernel.publishCanonicalRecord(implementationDiffRef, implementationDiffRaw);
    const testOutputRaw = "historical green\n";
    const testOutputRef = "evidence/lineage-green.output";
    kernel.publishCanonicalRecord(testOutputRef, testOutputRaw);
    const implementationRef = "receipts/revisions/implementation/lineage-historical.json";
    const implementationRaw = `${JSON.stringify({
      schema_version: "workflowhub-receipt.v1", task_id: f.task.identity.taskId, stage: "build-code",
      producer: { stage: "build-code", component: "implementation", version: "1.0.0" },
      snapshot_head: implementationCommit, snapshot_tree: snapshotTree, snapshot_commit: implementationCommit,
      diff_ref: implementationDiffRef, diff_hash: sha256(implementationDiffRaw),
    }, null, 2)}\n`;
    kernel.publishCanonicalRecord(implementationRef, implementationRaw);
    const greenRef = "receipts/build-tests-revision-0042.json";
    const greenRaw = `${JSON.stringify({
      schema_version: "workflowhub-receipt.v1", task_id: f.task.identity.taskId, stage: "build-code",
      producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
      command: "true", command_hash: "a".repeat(64), exit_code: 0, snapshot_head: implementationCommit,
      snapshot_tree: snapshotTree, snapshot_commit: implementationCommit,
      started_at: "2026-07-25T00:00:00.000Z", completed_at: "2026-07-25T00:00:01.000Z",
      output_ref: testOutputRef, output_hash: sha256(testOutputRaw),
    }, null, 2)}\n`;
    kernel.publishCanonicalRecord(greenRef, greenRaw);
    const diffRaw = `${JSON.stringify({
      schema_version: "phase-diff-scan.v1", phase_id: "phase-1", baseline_commit: baselineCommit,
      implementation_commit: implementationCommit, snapshot_tree: snapshotTree,
      allowed_files: ["phase-1.txt"], changed_files: ["phase-1.txt"], safe: true,
      violations: [], c2_violations: [], allowlist_violations: [], runtime_controlled_changes: [],
    }, null, 2)}\n`;
    const diffRef = `evidence/phases/phase-1/${snapshotTree}/diff-scan-${sha256(diffRaw)}.json`;
    kernel.publishCanonicalRecord(diffRef, diffRaw);
    const evidenceRaw = `${JSON.stringify({
      phase_id: "phase-1", status: "awaiting_review", needs_human: false,
      tests: { green: { path: greenRef } }, diff_scan: { path: diffRef }, declared_allowed_files: ["phase-1.txt"],
      evidence: { diff: diffRef, implementation_receipt_ref: implementationRef, green_test_receipt_ref: greenRef },
    }, null, 2)}\n`;
    const evidenceRef = `evidence/phases/phase-1/${snapshotTree}/phase-evidence-${sha256(evidenceRaw)}.json`;
    kernel.publishCanonicalRecord(evidenceRef, evidenceRaw);
    const reviewWriter = createCanonicalReviewWriter({ task: f.task, taskId: f.task.identity.taskId, stage: "build-code" });
    const reviewId = "phase-1-lineage-pass";
    const attemptRef = `reviews/attempts/${reviewId}/attempt.json`;
    const resultRef = `reviews/results/${reviewId}.json`;
    const materialId = "b".repeat(64);
    const source = { target_commit: implementationCommit, base_commit: baselineCommit, base_tree: baselineTree, captured_head: implementationCommit };
    reviewWriter.writeAttempt(attemptRef, {
      version: "wh-review-attempt.v1", attempt_id: reviewId, task_id: f.task.identity.taskId, stage: "build-code",
      review_track: null, subject_kind: "phase", phase_id: "phase-1", review_scope: "phase",
      base_tree: baselineTree, candidate_tree: snapshotTree, source, snapshot_tree: snapshotTree, material_id: materialId,
      phase_ac_trace: {
        schema_version: "phase-ac-change-test-trace.v1", phase_id: "phase-1", base_tree: baselineTree, snapshot_tree: snapshotTree,
        acceptance_ids: ["AC-1"], entries: [{ acceptance_criterion_id: "AC-1", change: [{ change_id: "change-1", path: "phase-1.txt" }],
          test: [{ receipt_ref: greenRef, receipt_hash: sha256(greenRaw) }],
          anchors: [{ id: "phase-1-anchor", path: "phase-1.txt", start_line: 1, end_line: 1, role: "implementation", reason: "historical Phase change" }],
        }],
      },
      provider_attempts: [{ provider: "fixture", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: null, error: null }], terminal_status: "semantic", error: null,
    });
    reviewWriter.writeResult(resultRef, {
      version: "wh-review-result.v1", task_id: f.task.identity.taskId, stage: "build-code", review_track: null,
      subject_kind: "phase", phase_id: "phase-1", review_scope: "phase", base_tree: baselineTree, candidate_tree: snapshotTree,
      source, snapshot_tree: snapshotTree, material_id: materialId, attempt_ref: attemptRef,
      provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "historical pass", findings: [] } }], verdict: "pass", findings: [],
    });
    const pointerRaw = `${JSON.stringify({ phase_id: "phase-2", status: "awaiting_review", snapshot_tree: snapshotTree }, null, 2)}\n`;
    f.task.writeRecordAtomic("phase-result.json", pointerRaw);
    const common = [
      "phase-trace-lineage", `--task-path=${f.task.taskPath}`, "--project=workflowhub", "--task=recovery-cli",
      `--runner-root=${f.nextRunner}`, "--stage=build-code", "--phase-id=phase-1",
      `--phase-evidence-ref=${evidenceRef}`, `--review-result-ref=${resultRef}`,
    ];
    expect(() => runCli([...common, `--phase-evidence-hash=${"0".repeat(64)}`, `--review-result-hash=${sha256(f.task.readRecord(resultRef))}`])).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);
    expect(f.task.readRecord("phase-result.json")).toBe(pointerRaw);
    const output = JSON.parse(runCli([...common, `--phase-evidence-hash=${sha256(evidenceRaw)}`, `--review-result-hash=${sha256(f.task.readRecord(resultRef))}`]));
    expect(output).toMatchObject({ phase_id: "phase-1", snapshot_tree: snapshotTree });
    expect(f.task.readRecord("phase-result.json")).toBe(pointerRaw);
    expect(JSON.parse(f.task.readRecord(output.lineage_ref))).toMatchObject({ schema_version: "phase-trace-lineage-generation.v1", result: "bound" });
    const phaseTrace = readPhaseMapTrace({ task: f.task, sourceRoot: target, traceRef: output.trace_ref });
    expect(phaseTrace.traceSha256).toBe(output.trace_hash);
    const publicContext = { task: f.task, workspace: { worktreeRoot: target } };
    expect(() => publishPhaseTraceLineage(publicContext, {
      trace_ref: output.trace_ref, trace_hash: "0".repeat(64),
    })).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);
    expect(() => publishPhaseTraceLineage(publicContext, {
      trace_ref: `evidence/phases/phase-1/${snapshotTree}/phase-map-trace-${"0".repeat(64)}.json`,
      trace_hash: "0".repeat(64),
    })).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);
    rmSync(join(f.task.taskPath, output.lineage_ref));
    const published = publishPhaseTraceLineage(publicContext, {
      trace_ref: output.trace_ref, trace_hash: output.trace_hash,
    });
    const publishedLineage = JSON.parse(f.task.readRecord(published.lineage_ref));
    expect(publishedLineage).toMatchObject({ schema_version: "phase-trace-lineage-generation.v1", result: "bound" });
    for (const key of ["canonical_phase_evidence", "diff_scan", "implementation_receipt", "green_test_receipt", "review_result", "review_attempt"]) {
      const lineageKey = key === "canonical_phase_evidence" ? "phase_evidence" : key;
      expect(publishedLineage[lineageKey]).toEqual(phaseTrace.trace[key]);
    }
    const legacy = {
      ...publishedLineage,
      phase_evidence: { ref: publishedLineage.phase_evidence.ref }, diff_scan: { ref: publishedLineage.diff_scan.ref },
      implementation_receipt: { ref: publishedLineage.implementation_receipt.ref }, green_test_receipt: { ref: publishedLineage.green_test_receipt.ref },
      review_result: { ref: publishedLineage.review_result.ref }, review_attempt: { ref: publishedLineage.review_attempt.ref },
    };
    const legacyRaw = `${JSON.stringify(legacy)}\n`; const legacyHash = sha256(legacyRaw);
    writeFileSync(join(f.task.taskPath, published.lineage_ref), legacyRaw);
    expect(() => supersedePhaseTraceLineage(publicContext, {
      lineage_ref: published.lineage_ref, lineage_hash: "0".repeat(64),
    })).toThrow(/RECOVERY_PHASE_EVIDENCE_MISMATCH/);
    const superseded = supersedePhaseTraceLineage(publicContext, {
      lineage_ref: published.lineage_ref, lineage_hash: legacyHash,
    });
    expect(JSON.parse(f.task.readRecord(superseded.supersession_ref))).toMatchObject({
      schema_version: "phase-trace-lineage-supersession.v1", result: "superseded",
      supersedes: { ref: published.lineage_ref, sha256: legacyHash },
      phase_evidence: phaseTrace.trace.canonical_phase_evidence,
    });
    expect(() => supersedePhaseTraceLineage(publicContext, {
      lineage_ref: published.lineage_ref, lineage_hash: legacyHash,
    })).toThrow(/RECOVERY_ALREADY_USED/);
    expect(() => publishPhaseTraceLineage(publicContext, {
      trace_ref: output.trace_ref, trace_hash: output.trace_hash,
    })).toThrow(/RECOVERY_ALREADY_USED/);
    expect(() => runCli([...common, `--phase-evidence-hash=${sha256(evidenceRaw)}`, `--review-result-hash=${sha256(f.task.readRecord(resultRef))}`])).toThrow(/RECOVERY_ALREADY_USED/);
  });
});
