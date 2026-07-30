import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../core/task-handle.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { captureWorkspaceSnapshot, writeOfficialComponentReceipt } from "../../core/canonical-receipt-writer.mjs";
import {
  assertLatestBuildSpecReceipt,
  issueBuildSpecRecoveryOwnerCapability,
  validateBuildSpecBase,
  validateBuildSpecRevision,
} from "../../core/build-spec-receipt-recovery.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "../../core/git-worktree-snapshot.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../../core/workspace.mjs";
import { hashAuditSummary } from "../../core/audit-summary-carrier.mjs";
import { authenticateWriteBoundary } from "../../core/write-boundary-preflight.mjs";
import { writeFormalReviewFixture } from "../../tests/helpers/formal-review.mjs";
import { buildNonGateReviewResponseRecord } from "../../skills/wh-review/scripts/review-controller.mjs";
import { resumableBuildSpecAttempt } from "../stage-runtime.mjs";

const temporary = [];
const runnerTemporary = [];
const runnerSource = realpathSync(new URL("../../", import.meta.url).pathname);
const currentSpec = "# Current Spec\n";
let cleanRunner;

function cleanRunnerRoot() {
  if (cleanRunner) return cleanRunner;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-spec-recovery-runner-")));
  runnerTemporary.push(root);
  cleanRunner = join(root, "runner");
  execFileSync("git", ["clone", "-q", "--no-local", runnerSource, cleanRunner]);
  for (const relativePath of [
    "core/build-spec-receipt-recovery.mjs",
    "core/task-handle.mjs",
    "core/task-kernel-implementation.mjs",
    "core/stage-content-contracts.mjs",
    "core/schemas/task-material-revision.v1.json",
    "core/stage-skill-runtime.mjs",
    "core/stage-skill-invocation.mjs",
    "core/stage-handlers.mjs",
    "core/stage-runner.mjs",
    "scripts/stage-runtime.mjs",
  ]) {
    copyFileSync(join(runnerSource, relativePath), join(cleanRunner, relativePath));
  }
  symlinkSync(join(runnerSource, "node_modules"), join(cleanRunner, "node_modules"));
  execFileSync("git", ["add", "-f", "--",
    "core/build-spec-receipt-recovery.mjs",
    "core/task-handle.mjs",
    "core/task-kernel-implementation.mjs",
    "core/stage-content-contracts.mjs",
    "core/schemas/task-material-revision.v1.json",
    "core/stage-skill-runtime.mjs",
    "core/stage-skill-invocation.mjs",
    "core/stage-handlers.mjs",
    "core/stage-runner.mjs",
    "scripts/stage-runtime.mjs",
    "node_modules",
  ], { cwd: cleanRunner });
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "recovery fixture"], { cwd: cleanRunner });
  return cleanRunner;
}

function runtime() {
  return join(cleanRunnerRoot(), "scripts", "stage-runtime.mjs");
}

function createAuditedFixtureKernel(task, candidateWorkspace) {
  const kernel = createTaskKernel(task, { candidateWorkspace });
  return Object.freeze({
    ...kernel,
    publishAttempt(stage, data = {}) {
      let active;
      try { active = kernel.activeStageRun(stage); }
      catch { active = kernel.startStageRun(stage, { reason: "spec recovery fixture setup" }); }
      const snapshot = candidateWorkspace.captureSnapshot();
      const kind = `${stage}.test`;
      const content = {
        schema_version: "stage-content-evidence.v1",
        kind,
        task_id: task.identity.taskId,
        stage,
        workflow_run_id: active.run.workflow_run_id,
        snapshot_tree: snapshot.tree,
      };
      const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
      const contentHash = createHash("sha256").update(contentRaw).digest("hex");
      const contentRef = `evidence/stage-content/${contentHash}/${stage}-test.json`;
      kernel.publishCanonicalRecord(contentRef, contentRaw);
      const contentEvidenceRefs = [{ kind, ref: contentRef, hash: contentHash }];
      const unsignedSummary = {
        schema_version: "stage-audit-summary.v1",
        task_id: task.identity.taskId,
        stage_slug: stage,
        workflow_run_id: active.run.workflow_run_id,
        snapshot_tree: snapshot.tree,
        verdict: "pass",
        content_evidence_refs: contentEvidenceRefs,
      };
      const summaryHash = hashAuditSummary(unsignedSummary);
      const summary = { ...unsignedSummary, summary_hash: summaryHash };
      const summaryRaw = `${JSON.stringify(summary, null, 2)}\n`;
      const summaryRef = `evidence/audits/${stage}/${summaryHash}.json`;
      kernel.publishCanonicalRecord(summaryRef, summaryRaw);
      return kernel.publishAttempt(stage, {
        ...data,
        facts: {
          ...data.facts,
          worktree_root: candidateWorkspace.worktreeRoot,
          baseline_commit: candidateWorkspace.baselineCommit,
          snapshot_tree: snapshot.tree,
          audit_contract_version: "v1",
          audit_summary_ref: summaryRef,
          audit_summary_hash: summaryHash,
          audit_verdict: "pass",
          content_evidence_refs: contentEvidenceRefs,
        },
      });
    },
  });
}

function cli(state, args, input) {
  const inputPath = input === undefined ? null : join(state.inputRoot, `input-${state.inputSequence += 1}.json`);
  if (inputPath) writeFileSync(inputPath, `${JSON.stringify(input)}\n`);
  const result = spawnSync(process.execPath, [runtime(), ...args, ...(inputPath ? [`--input=${inputPath}`] : [])], {
    cwd: state.repo,
    env: state.env,
    encoding: "utf8",
  });
  return { ...result, json: result.status === 0 ? JSON.parse(result.stdout) : null };
}

function registerReview(state, resultRef, expectedHead = null) {
  const result = JSON.parse(state.task.readRecord(resultRef));
  const identity = state.kernel.deriveReviewFlowIdentity({
    stage: result.stage,
    review_track: result.review_track ?? null,
    subject_kind: result.subject_kind,
    phase_id: result.phase_id ?? null,
    review_scope: result.review_scope ?? null,
  });
  return state.kernel.advanceReviewFlow(identity, { expected_head_ref: expectedHead, result_ref: resultRef });
}

function acceptedDecisionFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-spec-recovery-")));
  temporary.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "spec-recovery",
      created_at: new Date().toISOString(),
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const inputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-spec-recovery-input.")));
  temporary.push(inputRoot);
  const state = {
    root, repo, task, inputRoot, inputSequence: 0,
    env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root },
  };
  const candidate = prepareTaskWorkspace(task);
  const setup = createAuditedFixtureKernel(task, candidate);
  const decisionContent = "# Accepted Decision\n";
  const decisionHash = createHash("sha256").update(decisionContent).digest("hex");
  const decisionRef = `receipts/decision-log/${decisionHash}.md`;
  setup.publishCanonicalRecord(decisionRef, decisionContent);
  mkdirSync(join(candidate.worktreeRoot, "specs", "spec-recovery"), { recursive: true });
  writeFileSync(join(candidate.worktreeRoot, "specs", "spec-recovery", "decision-log.md"), decisionContent);
  const decision = setup.publishAttempt("make-decision", {
    facts: {
      worktree_root: candidate.worktreeRoot,
      baseline_commit: candidate.baselineCommit,
      decision_ref: decisionRef,
      decision_hash: decisionHash,
    },
  });
  const confirmation = setup.confirmAttempt(
    "make-decision",
    decision.attempt_ref,
    "accepted",
    "comment:spec-recovery-fixture",
  );
  setup.acceptAttempt("make-decision", decision.attempt_ref, confirmation.ref);
  state.workspace = openAcceptedWorkspace(task, setup.readAccepted("make-decision"));
  state.kernel = createTaskKernel(task);
  return state;
}

function openRecoveryFixture() {
  const state = acceptedDecisionFixture();
  writeOfficialComponentReceipt({ task: state.task, stage: "build-spec", component: "spec", payload: { content: "# Stale Spec\n" } });
  mkdirSync(join(state.workspace.worktreeRoot, "specs", "spec-recovery"), { recursive: true });
  writeFileSync(join(state.workspace.worktreeRoot, "specs", "spec-recovery", "spec.md"), currentSpec);
  const tree = captureWorkspaceSnapshot(state.workspace).tree;
  const review = writeFormalReviewFixture({ task: state.task, stage: "build-spec", snapshotTree: tree });
  const flow = registerReview(state, review.resultRef);
  const started = cli(state, [
    "start-run",
    "--stage=build-spec",
    "--project=Demo",
    "--task=spec-recovery",
    "--reason=spec-recovery-fixture",
  ]);
  if (started.status !== 0) throw new Error(started.stderr);
  state.recoveryInput = { content: currentSpec, receipts: { review: review.resultRef } };
  state.review = review;
  state.flow = flow;
  return state;
}

function recover(state, input = state.recoveryInput, extra = []) {
  return cli(state, [
    "recover-spec-receipt",
    "--stage=build-spec",
    "--project=Demo",
    "--task=spec-recovery",
    "--recover=receipts/spec.json",
    ...extra,
  ], input);
}

function recoveryConsumer(state) {
  return {
    identity: state.task.identity,
    readReceipt(ref) {
      const raw = state.task.readRecord(ref);
      return {
        value: JSON.parse(raw),
        sha256: createHash("sha256").update(raw).digest("hex"),
      };
    },
    readOptionalReceipt(ref) {
      try { return this.readReceipt(ref); }
      catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
    artifactRef(name) {
      return ArtifactDir.open(state.workspace.worktreeRoot, state.task).reference(name);
    },
  };
}

function recoveryConsumerBinding(state, flow = state.flow) {
  return {
    artifactContent: currentSpec,
    snapshot: captureWorkspaceSnapshot(state.workspace),
    authentication: { flow },
  };
}

function predictedRevision(state, content = currentSpec) {
  const baseRaw = state.task.readRecord("receipts/spec.json");
  const value = {
    schema_version: "workflowhub-receipt.v1",
    task_id: state.task.identity.taskId,
    stage: "build-spec",
    producer: { stage: "build-spec", component: "spec", version: "1.0.0" },
    content,
    content_hash: createHash("sha256").update(content).digest("hex"),
  };
  const contentHash = createHash("sha256").update(`${JSON.stringify(value, null, 2)}\n`).digest("hex");
  const ref = `receipts/revisions/spec/${contentHash}.json`;
  const revised = {
    ...value,
    revision: {
      previous_ref: "receipts/spec.json",
      previous_hash: createHash("sha256").update(baseRaw).digest("hex"),
      content_hash: contentHash,
    },
  };
  return { ref, raw: `${JSON.stringify(revised, null, 2)}\n` };
}

function predictedRecoveryRecords(state) {
  const boundary = authenticateWriteBoundary({
    task: state.task,
    runnerRoot: cleanRunnerRoot(),
    stage: "build-spec",
    operation: "recover-spec-receipt",
    workspace: state.workspace,
  });
  const ownerCapability = issueBuildSpecRecoveryOwnerCapability({
    task: state.task,
    workspace: state.workspace,
    boundary,
  });
  const invocation = ownerCapability.invocation;
  state.directRecoveryOwnerCapability = ownerCapability;
  state.directRecoveryInvocation = invocation;
  state.directRecoveryBoundary = boundary;
  const revision = predictedRevision(state);
  const baseRaw = state.task.readRecord("receipts/spec.json");
  const eventRaw = state.task.readRecord(state.flow.event_ref);
  const marker = {
    schema_version: "workflowhub-build-spec-receipt-recovery.v2",
    task_id: state.task.identity.taskId,
    stage: "build-spec",
    component: "spec",
    base_receipt_ref: "receipts/spec.json",
    base_receipt_hash: createHash("sha256").update(baseRaw).digest("hex"),
    recovered_receipt_ref: revision.ref,
    recovered_receipt_hash: createHash("sha256").update(revision.raw).digest("hex"),
    artifact_ref: ArtifactDir.open(state.workspace.worktreeRoot, state.task).reference("spec.md"),
    content_hash: createHash("sha256").update(currentSpec).digest("hex"),
    snapshot_tree: captureWorkspaceSnapshot(state.workspace).tree,
    review_action: {
      event_ref: state.flow.event_ref,
      event_hash: createHash("sha256").update(eventRaw).digest("hex"),
      event_kind: "semantic_result",
      head_result_ref: state.review.resultRef,
      head_result_hash: state.flow.result_sha256,
      action_ref: state.review.resultRef,
      action_hash: state.flow.result_sha256,
    },
    invocation: { ref: invocation.ref, hash: invocation.hash },
  };
  return {
    revisionRef: revision.ref,
    revisionRaw: revision.raw,
    markerRaw: `${JSON.stringify(marker, null, 2)}\n`,
  };
}

function injectCrashAfterRevision(state, records) {
  const crashKernel = createTaskKernel(state.task, {
    workspace: state.workspace,
    artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task),
    buildSpecRecoveryTestHooks: {
      afterRevision() { throw new Error("injected crash after build-spec revision"); },
    },
  });
  expect(() => crashKernel.recoverBuildSpecReceiptRecords(records, state.directRecoveryOwnerCapability)).toThrow(/injected crash/i);
}

function injectConflictingRevision(state, records, revisionRaw) {
  const conflictKernel = createTaskKernel(state.task, {
    workspace: state.workspace,
    artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task),
    buildSpecRecoveryTestHooks: { seedRevisionRaw: revisionRaw },
  });
  expect(() => conflictKernel.recoverBuildSpecReceiptRecords(records, state.directRecoveryOwnerCapability)).toThrow(/revision conflicts/i);
}

function addVerifiedResolution(state) {
  const previousRaw = state.task.readRecord(state.review.resultRef);
  const previous = { ...JSON.parse(previousRaw), result_ref: state.review.resultRef };
  const resolution = buildNonGateReviewResponseRecord({
    taskId: state.task.identity.taskId,
    stage: "build-spec",
    previousResult: previous,
    previousResultSha256: createHash("sha256").update(previousRaw).digest("hex"),
    currentSnapshotTree: previous.snapshot_tree,
    ledger: {
      version: "wh-review-response-ledger.v1",
      previous_result_ref: state.review.resultRef,
      previous_snapshot_tree: previous.snapshot_tree,
      current_snapshot_tree: previous.snapshot_tree,
      responses: [],
    },
  });
  const identity = state.kernel.deriveReviewFlowIdentity({
    stage: "build-spec", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
  });
  const recorded = state.kernel.recordReviewResolution(identity, {
    expected_head_ref: state.review.resultRef,
    expected_event_ref: state.flow.event_ref,
    resolution,
  });
  state.flow = recorded.flow;
  state.recoveryInput = {
    ...state.recoveryInput,
    receipts: { review: state.review.resultRef, review_resolution: recorded.resolution_ref },
  };
  return recorded;
}

function recoverConcurrent(state, inputPath) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [
      runtime(), "recover-spec-receipt", "--stage=build-spec", "--project=Demo", "--task=spec-recovery",
      "--recover=receipts/spec.json", `--input=${inputPath}`,
    ], { cwd: state.repo, env: state.env, encoding: "utf8" });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});
afterAll(() => {
  while (runnerTemporary.length) rmSync(runnerTemporary.pop(), { recursive: true, force: true });
});

describe("build-spec prepublish receipt recovery", () => {
  it("resumes only the exact unpublished attempt bound to the active workflow run", () => {
    const activeRaw = `${JSON.stringify({
      workflow_run_id: "build-spec:active",
      evidence_refs: [{ ref: "receipts/spec.json" }, { ref: "reviews/results/current.json" }],
    })}\n`;
    const historyRaw = `${JSON.stringify({
      workflow_run_id: "build-spec:history",
      evidence_refs: [{ ref: "receipts/spec.json" }, { ref: "reviews/results/current.json" }],
    })}\n`;
    const records = new Map([
      ["results/build-spec/attempt-0001.json", historyRaw],
      ["results/build-spec/attempt-0002.json", activeRaw],
    ]);
    const missing = new Error("missing");
    missing.code = "ENOENT";
    const resumed = resumableBuildSpecAttempt({
      task: {
        listStageAttemptRefs: () => [...records.keys()],
        readRecord(ref) {
          if (ref === "results/build-spec/accepted.json") throw missing;
          return records.get(ref);
        },
      },
      kernel: { activeStageRun: () => ({ run: { workflow_run_id: "build-spec:active" } }) },
    }, { receipts: { spec: "receipts/spec.json", review: "reviews/results/current.json" } });
    expect(resumed).toMatchObject({
      attempt_ref: "attempt-0002.json",
      integrity_hash: createHash("sha256").update(activeRaw).digest("hex"),
      resumed: true,
    });
  });

  it("durably discloses unavailable completion audit by accepted attempt identity", () => {
    const state = acceptedDecisionFixture();
    const artifacts = ArtifactDir.open(state.workspace.worktreeRoot, state.task);
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const kernel = createTaskKernel(state.task, { workspace: state.workspace, artifacts });
    const run = kernel.startStageRun("build-spec", { reason: "audit unavailable acceptance fixture" });
    const tree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const attempt = kernel.publishAttempt("build-spec", {
      facts: {
        spec_ref: "specs/spec-recovery/spec.md",
        checkpoint: kernel.createCheckpoint("build-spec"),
        review: {
          verdict: "pass",
          result_ref: "reviews/results/fixture.json",
          result_hash: "a".repeat(64),
          snapshot_tree: tree,
        },
      },
      evidence_refs: [],
      missing_items: ["audit unavailable/unverified/mismatch: fixture", "support:audit"],
      upstream_refs: [{
        task_id: "spec-recovery",
        stage: "make-decision",
        accepted_ref: "results/make-decision/accepted.json",
      }],
    });
    expect(attempt.attempt.workflow_run_id).toBe(run.run.workflow_run_id);
    const attemptRaw = state.task.readRecord(`results/build-spec/${attempt.attempt_ref}`);
    const attemptHash = createHash("sha256").update(attemptRaw).digest("hex");
    kernel.completeBuildSpecResultPublication({
      attempt_ref: attempt.attempt_ref,
      attempt_hash: attemptHash,
    });
    const published = kernel.publishBuildSpecCompletionAudit({
      attempt_ref: attempt.attempt_ref,
      attempt_hash: attemptHash,
      audit: { status: "unavailable", reason: "canonical audit summary could not be produced" },
    });
    const accepted = kernel.acceptAttempt("build-spec", attempt.attempt_ref);
    const read = kernel.readBuildSpecCompletionAudit(
      accepted.attempt_ref,
      accepted.integrity_hash.replace(/^sha256:/, ""),
    );
    expect(read.ref).toBe(`evidence/build-spec-completions/${attemptHash}.json`);
    expect(read.record.audit).toEqual({
      status: "unavailable",
      reason: "canonical audit summary could not be produced",
    });
    expect(published.ref).toBe(read.ref);
  });

  it("durably binds a recorded completion audit ref and raw-byte hash", () => {
    const state = acceptedDecisionFixture();
    const attemptRaw = "{}\n";
    const attemptHash = createHash("sha256").update(attemptRaw).digest("hex");
    const auditRaw = "{\"verdict\":\"fail\",\"completion_effect\":\"disclose_only\"}\n";
    const auditHash = createHash("sha256").update(auditRaw).digest("hex");
    const auditRef = `evidence/audits/build-spec/${"f".repeat(64)}.json`;
    mkdirSync(join(state.task.taskPath, "results", "build-spec"), { recursive: true });
    writeFileSync(join(state.task.taskPath, "results", "build-spec", "attempt-0001.json"), attemptRaw);
    state.kernel.publishCanonicalRecord(auditRef, auditRaw);
    state.kernel.publishBuildSpecCompletionAudit({
      attempt_ref: "attempt-0001.json",
      attempt_hash: attemptHash,
      audit: { status: "recorded", ref: auditRef, hash: auditHash },
    });
    expect(state.kernel.readBuildSpecCompletionAudit("attempt-0001.json", attemptHash).record.audit)
      .toEqual({ status: "recorded", ref: auditRef, hash: auditHash });
  });

  it("records a conditional trigger=false fact without opening the host bridge", () => {
    const state = acceptedDecisionFixture();
    const started = cli(state, [
      "start-run",
      "--stage=build-spec",
      "--project=Demo",
      "--task=spec-recovery",
      "--reason=build-spec-conditional-skip",
    ]);
    expect(started.status, started.stderr).toBe(0);

    const skipped = cli(state, [
      "invoke-stage-skill",
      "--stage=build-spec",
      "--project=Demo",
      "--task=spec-recovery",
      "--name=spec-clarify",
      "--invocation-key=default",
      "--triggered=false",
      "--reason=No material ambiguity after the six-dimension check.",
    ]);

    expect(skipped.status, skipped.stderr).toBe(0);
    expect(skipped.stdout).not.toContain("host-invocation-request.v1");
    expect(skipped.json).toMatchObject({
      status: "trigger=false",
      invocation: {
        name: "spec-clarify",
        invocation_key: "default",
        status: "not_invoked",
        reason: "No material ambiguity after the six-dimension check.",
      },
    });
    expect(state.kernel.readStageSkillInvocation("build-spec", "spec-clarify", "default").fact)
      .toMatchObject({
        status: "not_invoked",
        reason: "No material ambiguity after the six-dimension check.",
      });
  });

  it.each([
    {
      label: "missing trigger-false reason",
      name: "spec-clarify",
      extra: ["--triggered=false"],
      error: /reason/i,
    },
    {
      label: "reason supplied for a real invocation",
      name: "spec-clarify",
      extra: ["--triggered=true", "--reason=not allowed"],
      error: /reason.*triggered=true/i,
    },
    {
      label: "always component marked trigger-false",
      name: "spec-specify",
      extra: ["--triggered=false", "--reason=not applicable"],
      error: /always skill cannot be not_invoked/i,
    },
  ])("rejects $label", ({ name, extra, error }) => {
    const state = acceptedDecisionFixture();
    expect(cli(state, [
      "start-run",
      "--stage=build-spec",
      "--project=Demo",
      "--task=spec-recovery",
      "--reason=build-spec-invalid-conditional-skip",
    ]).status).toBe(0);
    const rejected = cli(state, [
      "invoke-stage-skill",
      "--stage=build-spec",
      "--project=Demo",
      "--task=spec-recovery",
      `--name=${name}`,
      "--invocation-key=default",
      ...extra,
    ]);
    expect(rejected.status).not.toBe(0);
    expect(rejected.stdout).toBe("");
    expect(rejected.stderr).toMatch(error);
  });

  it("invokes a declared build-spec skill against the authenticated stage Workspace", () => {
    const state = acceptedDecisionFixture();
    const started = cli(state, [
      "start-run",
      "--stage=build-spec",
      "--project=Demo",
      "--task=spec-recovery",
      "--reason=build-spec-host-bridge",
    ]);
    expect(started.status, started.stderr).toBe(0);
    const snapshotTree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const outcomeRaw = `${JSON.stringify({ snapshot_tree: snapshotTree, result: "specify completed" })}\n`;
    state.kernel.publishCanonicalRecord("evidence/spec-specify-outcome.json", outcomeRaw);
    const response = {
      outcome_ref: "evidence/spec-specify-outcome.json",
      outcome_hash: createHash("sha256").update(outcomeRaw).digest("hex"),
      snapshot_tree: snapshotTree,
    };

    const invoked = spawnSync(process.execPath, [
      runtime(),
      "invoke-stage-skill",
      "--stage=build-spec",
      "--project=Demo",
      "--task=spec-recovery",
      "--name=spec-specify",
      "--invocation-key=default",
    ], {
      cwd: state.repo,
      env: state.env,
      input: `${JSON.stringify(response)}\n`,
      encoding: "utf8",
    });

    expect(invoked.status, invoked.stderr).toBe(0);
    const request = JSON.parse(invoked.stdout.split("\n")[0]);
    expect(request).toMatchObject({
      schema_version: "host-invocation-request.v1",
      task_id: "spec-recovery",
      stage: "build-spec",
      workflow_run_id: started.json.run.workflow_run_id,
      name: "spec-specify",
      invocation_key: "default",
      snapshot_tree: snapshotTree,
    });
    expect(state.kernel.readStageSkillInvocation("build-spec", "spec-specify", "default").fact)
      .toMatchObject({ status: "executed", ...response });
  });

  it("continues from the current spec revision while the accepted base remains immutable history", () => {
    const state = openRecoveryFixture();
    const baseRaw = state.task.readRecord("receipts/spec.json");
    const artifacts = ArtifactDir.open(state.workspace.worktreeRoot, state.task);
    for (const [file, content] of [
      ["decision-log.md", "# Current Decision\n"],
      ["plan.md", "# Current Plan\n"],
      ["tasks.md", "# Current Tasks\n"],
    ]) {
      try { artifacts.read(file); } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        artifacts.writeAtomic(file, content);
      }
    }
    const revisionResult = cli(state, [
      "publish-material-revision",
      "--stage=build-spec",
      "--project=Demo",
      "--task=spec-recovery",
    ], {
      change_summary: "record current materials without reopening accepted history",
      source_refs: ["receipts/spec.json"],
    });
    expect(revisionResult.status, revisionResult.stderr).toBe(0);
    const publishedRevision = revisionResult.json;
    const worker = recoveryConsumer(state);
    const base = worker.readReceipt("receipts/spec.json");
    const consumed = assertLatestBuildSpecReceipt({
      worker,
      item: {
        ref: "receipts/spec.json",
        value: base.value,
        evidence: { ref: "receipts/spec.json", sha256: base.sha256 },
      },
      binding: recoveryConsumerBinding(state),
    });
    expect(consumed, "ORACLE-MAT: an old accepted hash is traceability, not a current-material Gate").toMatchObject({
      current_material_revision: {
        ref: publishedRevision.revision_ref,
        revision_id: publishedRevision.revision_id,
      },
      accepted_history: "read_only",
    });
    expect(state.task.readRecord("receipts/spec.json")).toBe(baseRaw);
  });

  it("publishes one immutable latest revision and makes the consumer reject the stale base", () => {
    const state = openRecoveryFixture();
    const baseRaw = state.task.readRecord("receipts/spec.json");
    const result = recover(state);
    expect(result.status, result.stderr).toBe(0);
    expect(result.json).toMatchObject({
      revision: true,
      previous_receipt_ref: "receipts/spec.json",
      recovery_marker_ref: "receipts/recoveries/spec.json",
    });
    expect(result.json.receipt_ref).toMatch(/^receipts\/revisions\/spec\/[a-f0-9]{64}\.json$/);
    expect(state.task.readRecord("receipts/spec.json")).toBe(baseRaw);
    const marker = JSON.parse(state.task.readRecord("receipts/recoveries/spec.json"));
    expect(marker).toMatchObject({
      recovered_receipt_ref: result.json.receipt_ref,
      snapshot_tree: captureWorkspaceSnapshot(state.workspace).tree,
      review_action: { event_ref: state.flow.event_ref, head_result_ref: state.review.resultRef },
    });
    const worker = recoveryConsumer(state);
    const base = worker.readReceipt("receipts/spec.json");
    expect(() => assertLatestBuildSpecReceipt({
      worker,
      item: {
        ref: "receipts/spec.json",
        value: base.value,
        evidence: { ref: "receipts/spec.json", sha256: base.sha256 },
      },
      binding: recoveryConsumerBinding(state),
    })).toThrow(/stale base receipt/i);
    const recovered = worker.readReceipt(result.json.receipt_ref);
    expect(() => assertLatestBuildSpecReceipt({
      worker,
      item: {
        ref: result.json.receipt_ref,
        value: recovered.value,
        evidence: { ref: result.json.receipt_ref, sha256: recovered.sha256 },
      },
      binding: recoveryConsumerBinding(state),
    })).not.toThrow();
    expect(state.task.listStageAttemptRefs("build-spec")).toEqual([]);
  });

  it("rejects generic revision APIs and replays the exact completed recovery idempotently", () => {
    const state = openRecoveryFixture();
    expect(() => assertLatestBuildSpecReceipt({
      worker: {},
      item: {},
      binding: {},
    })).toThrow(/readOptionalReceipt capability/i);
    const generic = cli(state, [
      "receipt", "--stage=build-spec", "--project=Demo", "--task=spec-recovery",
      "--component=spec", "--revision=true", "--recover=receipts/spec.json",
    ], { content: currentSpec });
    expect(generic.status).not.toBe(0);
    expect(generic.stderr).toMatch(/trusted prepublish recovery|recovery authority/i);
    expect(() => writeOfficialComponentReceipt({
      task: state.task,
      stage: "build-spec",
      component: "spec",
      payload: { content: currentSpec },
      revisionOf: "receipts/spec.json",
    })).toThrow(/trusted prepublish recovery/i);
    const reserved = predictedRevision(state);
    expect(() => state.kernel.publishCanonicalRecord(reserved.ref, reserved.raw))
      .toThrow(/build-spec recovery authority/i);
    const baseRaw = state.task.readRecord("receipts/spec.json");
    const base = JSON.parse(baseRaw);
    const invalidBases = [
      [{ ...base, content_hash: "f".repeat(64) }, null],
      [{ ...base, unexpected: true }, null],
      [base, JSON.stringify(base)],
    ];
    for (const [value, rawOverride] of invalidBases) {
      const raw = rawOverride ?? `${JSON.stringify(value, null, 2)}\n`;
      expect(() => validateBuildSpecBase(value, raw, state.task.identity.taskId)).toThrow();
      expect(() => state.task.readRecord("receipts/recoveries/spec.json")).toThrow();
    }
    const revisionValue = JSON.parse(reserved.raw);
    const invalidRevisions = [
      [{ ...revisionValue, revision: { ...revisionValue.revision, content_hash: "f".repeat(64) } }, reserved.ref, null],
      [revisionValue, `receipts/revisions/spec/${"e".repeat(64)}.json`, null],
      [revisionValue, reserved.ref, JSON.stringify(revisionValue)],
    ];
    for (const [value, ref, rawOverride] of invalidRevisions) {
      const raw = rawOverride ?? `${JSON.stringify(value, null, 2)}\n`;
      expect(() => validateBuildSpecRevision(value, raw, {
        ref,
        taskId: state.task.identity.taskId,
        baseHash: createHash("sha256").update(baseRaw).digest("hex"),
        content: currentSpec,
      })).toThrow();
      expect(() => state.task.readRecord("receipts/recoveries/spec.json")).toThrow();
    }
    const first = recover(state);
    expect(first.status).toBe(0);
    const second = recover(state);
    expect(second.status, second.stderr).toBe(0);
    expect(second.json).toEqual(first.json);
  });

  it("rejects payload, review, tree, and stage-state drift before publishing a marker", () => {
    const wrongPayload = openRecoveryFixture();
    const mismatched = recover(wrongPayload, { ...wrongPayload.recoveryInput, content: "# Other\n" });
    expect(mismatched.status).not.toBe(0);
    expect(mismatched.stderr).toMatch(/current spec\.md bytes/i);
    expect(() => wrongPayload.task.readRecord("receipts/recoveries/spec.json")).toThrow();

    const staleReview = openRecoveryFixture();
    writeFileSync(join(staleReview.workspace.worktreeRoot, "CONTEXT.md"), "tree drift\n");
    const drifted = recover(staleReview);
    expect(drifted.status).not.toBe(0);
    expect(drifted.stderr).toMatch(/final current snapshot|current snapshot/i);
    expect(() => staleReview.task.readRecord("receipts/recoveries/spec.json")).toThrow();

    const attempted = openRecoveryFixture();
    mkdirSync(join(attempted.task.taskPath, "results", "build-spec"), { recursive: true });
    writeFileSync(join(attempted.task.taskPath, "results", "build-spec", "attempt-0001.json"), "{}\n");
    expect(attempted.task.listStageAttemptRefs("build-spec")).toEqual(["results/build-spec/attempt-0001.json"]);
    const blocked = recover(attempted);
    expect(blocked.status).not.toBe(0);
    expect(blocked.stderr).toMatch(/no published stage attempt/i);
  });

  it("rejects replaying a historical invocation record as the current recovery owner capability", () => {
    const state = openRecoveryFixture();
    const records = predictedRecoveryRecords(state);
    const kernel = createTaskKernel(state.task, {
      workspace: state.workspace,
      artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task),
    });
    expect(() => kernel.recoverBuildSpecReceiptRecords(records, state.directRecoveryInvocation))
      .toThrow(/current recovery owner capability/i);
    expect(() => state.task.readRecord("receipts/recoveries/spec.json")).toThrow();
  });

  it("rejects forged, wrong-operation, and consumed recovery owner capabilities", () => {
    const state = openRecoveryFixture();
    const records = predictedRecoveryRecords(state);
    const kernel = createTaskKernel(state.task, {
      workspace: state.workspace,
      artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task),
    });
    expect(() => kernel.recoverBuildSpecReceiptRecords(records, {
      ...state.directRecoveryOwnerCapability,
    })).toThrow(/current recovery owner capability/i);
    expect(() => issueBuildSpecRecoveryOwnerCapability({
      task: state.task,
      workspace: state.workspace,
      boundary: { ...state.directRecoveryBoundary, operation: "receipt" },
    })).toThrow(/current recover-spec-receipt write boundary/i);
    expect(kernel.recoverBuildSpecReceiptRecords(records, state.directRecoveryOwnerCapability))
      .toMatchObject({ recovery_marker_ref: "receipts/recoveries/spec.json" });
    expect(() => kernel.recoverBuildSpecReceiptRecords(records, state.directRecoveryOwnerCapability))
      .toThrow(/unconsumed current recovery owner capability/i);
  });

  it("continues an exact crash orphan, rejects a conflicting orphan, extra receipts, and caller authority fields", () => {
    const state = openRecoveryFixture();
    const records = predictedRecoveryRecords(state);
    const predicted = { ref: records.revisionRef, raw: records.revisionRaw };
    // Crash injection: the narrow TaskKernel writer completed the immutable
    // revision, then the process died before it could publish the marker.
    injectCrashAfterRevision(state, records);
    const orphan = recover(state);
    expect(orphan.status, orphan.stderr).toBe(0);
    expect(orphan.json.receipt_ref).toBe(predicted.ref);
    expect(JSON.parse(state.task.readRecord("receipts/recoveries/spec.json")).recovered_receipt_ref).toBe(predicted.ref);

    const conflict = openRecoveryFixture();
    const conflictRevision = predictedRevision(conflict);
    const conflictingValue = JSON.parse(conflictRevision.raw);
    conflictingValue.revision.previous_hash = "f".repeat(64);
    injectConflictingRevision(
      conflict,
      predictedRecoveryRecords(conflict),
      `${JSON.stringify(conflictingValue, null, 2)}\n`,
    );
    const rejectedConflict = recover(conflict);
    expect(rejectedConflict.status).not.toBe(0);
    expect(rejectedConflict.stderr).toMatch(/provenance|conflict/i);
    expect(() => conflict.task.readRecord("receipts/recoveries/spec.json")).toThrow();

    const extra = openRecoveryFixture();
    const rejectedExtra = recover(extra, {
      ...extra.recoveryInput,
      receipts: { ...extra.recoveryInput.receipts, authority: "forged" },
    });
    expect(rejectedExtra.status).not.toBe(0);
    expect(rejectedExtra.stderr).toMatch(/receipts fields are invalid/i);
    expect(() => extra.task.readRecord("receipts/recoveries/spec.json")).toThrow();

    const forged = recover(state, state.recoveryInput, [`--snapshot-tree=${"f".repeat(40)}`]);
    expect(forged.status).not.toBe(0);
    expect(forged.stderr).toMatch(/accepts only/i);
  });

  it("binds a verified latest resolution and rejects a later review-flow action", () => {
    const state = openRecoveryFixture();
    const resolution = addVerifiedResolution(state);
    const recovered = recover(state);
    expect(recovered.status, recovered.stderr).toBe(0);
    expect(JSON.parse(state.task.readRecord("receipts/recoveries/spec.json"))).toMatchObject({
      review_action: { event_kind: "resolution", action_ref: resolution.resolution_ref },
    });
    const tree = captureWorkspaceSnapshot(state.workspace).tree;
    const next = writeFormalReviewFixture({
      task: state.task,
      stage: "build-spec",
      snapshotTree: tree,
      reviewChain: {
        version: "wh-review-chain.v1",
        round: "full",
        parent_result_ref: state.review.resultRef,
        root_result_ref: state.review.resultRef,
        prior_snapshot_tree: tree,
        current_snapshot_tree: tree,
        response_ledger_sha256: null,
        source_diff_sha256: "0".repeat(64),
      },
    });
    const latestFlow = registerReview(state, next.resultRef, state.review.resultRef);
    const worker = recoveryConsumer(state);
    const receipt = worker.readReceipt(recovered.json.receipt_ref);
    expect(() => assertLatestBuildSpecReceipt({
      worker,
      item: {
        ref: recovered.json.receipt_ref,
        value: receipt.value,
        evidence: { ref: recovered.json.receipt_ref, sha256: receipt.sha256 },
      },
      binding: recoveryConsumerBinding(state, latestFlow),
    })).toThrow(/marker binding|review action|latest|head/i);
    expect(state.task.listStageAttemptRefs("build-spec")).toEqual([]);
  });

  it("serializes concurrent recovery and returns the same authoritative result to both callers", async () => {
    const state = openRecoveryFixture();
    const inputPath = join(state.inputRoot, "concurrent.json");
    writeFileSync(inputPath, `${JSON.stringify(state.recoveryInput)}\n`);
    const results = await Promise.all([recoverConcurrent(state, inputPath), recoverConcurrent(state, inputPath)]);
    expect(results.filter(({ status }) => status === 0), results.map(({ stderr }) => stderr).join("\n")).toHaveLength(2);
    const outputs = results.map(({ stdout }) => JSON.parse(stdout));
    expect(outputs[1]).toEqual(outputs[0]);
    const marker = JSON.parse(state.task.readRecord("receipts/recoveries/spec.json"));
    expect(marker.recovered_receipt_ref).toMatch(/^receipts\/revisions\/spec\/[a-f0-9]{64}\.json$/);
    expect(state.task.readRecord(marker.recovered_receipt_ref)).toContain("# Current Spec");
    expect(state.task.listStageAttemptRefs("build-spec")).toEqual([]);
  });

  it("rejects a pre-existing checkpoint ref before creating recovery records", () => {
    const state = openRecoveryFixture();
    const checkpointRef = "refs/workflowhub/checkpoints/Demo/spec-recovery/build-spec/occupied";
    execFileSync("git", ["update-ref", checkpointRef, "HEAD"], { cwd: state.workspace.worktreeRoot });
    const result = recover(state);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/no published checkpoint/i);
    expect(() => state.task.readRecord("receipts/recoveries/spec.json")).toThrow();
  });
});
