import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../core/task-handle.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { captureWorkspaceSnapshot, writeOfficialComponentReceipt } from "../../core/canonical-receipt-writer.mjs";
import {
  assertLatestBuildSpecReceipt,
  validateBuildSpecBase,
  validateBuildSpecRevision,
} from "../../core/build-spec-receipt-recovery.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "../../core/git-worktree-snapshot.mjs";
import { openAcceptedWorkspace } from "../../core/workspace.mjs";
import { writeFormalReviewFixture } from "../../tests/helpers/formal-review.mjs";
import { buildNonGateReviewResponseRecord } from "../../skills/wh-review/scripts/review-controller.mjs";

const temporary = [];
const runtime = new URL("../stage-runtime.mjs", import.meta.url).pathname;

function cli(state, args, input) {
  const inputPath = input === undefined ? null : join(state.inputRoot, `input-${state.inputSequence += 1}.json`);
  if (inputPath) writeFileSync(inputPath, `${JSON.stringify(input)}\n`);
  const result = spawnSync(process.execPath, [runtime, ...args, ...(inputPath ? [`--input=${inputPath}`] : [])], {
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
    kernel: createTaskKernel(task),
  };
  writeOfficialComponentReceipt({ task, stage: "make-decision", component: "decision", payload: { decision_log: "# Decision\n\nProceed.\n" } });
  expect(cli(state, ["prepare", "--stage=make-decision", "--project=Demo", "--task=spec-recovery"]).status).toBe(0);
  const worktree = join(repo, "..", "repo-spec-recovery");
  const tree = captureGitWorktreeSnapshot(realpathSync(worktree)).tree;
  const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: tree, reviewTrack: "direction" });
  const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: tree, reviewTrack: "detail" });
  registerReview(state, direction.resultRef);
  registerReview(state, detail.resultRef);
  const run = cli(state, ["run", "--stage=make-decision", "--project=Demo", "--task=spec-recovery"], {
    receipts: { decision: "receipts/decision.json", direction_review: direction.resultRef, detail_review: detail.resultRef },
  });
  expect(run.status).toBe(0);
  const confirm = cli(state, ["confirm", "--stage=make-decision", "--project=Demo", "--task=spec-recovery", `--attempt=${run.json.attempt_ref}`, "--decision=accepted"]);
  expect(confirm.status).toBe(0);
  expect(cli(state, ["accept", "--stage=make-decision", "--project=Demo", "--task=spec-recovery", `--attempt=${run.json.attempt_ref}`, `--human-confirmation-ref=${confirm.json.ref}`]).status).toBe(0);
  state.workspace = openAcceptedWorkspace(task, createTaskKernel(task).readAccepted("make-decision"));
  state.kernel = createTaskKernel(task);
  return state;
}

function openRecoveryFixture() {
  const state = acceptedDecisionFixture();
  writeOfficialComponentReceipt({ task: state.task, stage: "build-spec", component: "spec", payload: { content: "# Stale Spec\n" } });
  mkdirSync(join(state.workspace.worktreeRoot, "specs", "spec-recovery"), { recursive: true });
  writeFileSync(join(state.workspace.worktreeRoot, "specs", "spec-recovery", "spec.md"), "# Current Spec\n");
  const tree = captureWorkspaceSnapshot(state.workspace).tree;
  const review = writeFormalReviewFixture({ task: state.task, stage: "build-spec", snapshotTree: tree });
  const flow = registerReview(state, review.resultRef);
  state.recoveryInput = { content: "# Current Spec\n", receipts: { review: review.resultRef } };
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

function predictedRevision(state, content = "# Current Spec\n") {
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
  const revision = predictedRevision(state);
  const baseRaw = state.task.readRecord("receipts/spec.json");
  const eventRaw = state.task.readRecord(state.flow.event_ref);
  const marker = {
    schema_version: "workflowhub-build-spec-receipt-recovery.v1",
    task_id: state.task.identity.taskId,
    stage: "build-spec",
    component: "spec",
    base_receipt_ref: "receipts/spec.json",
    base_receipt_hash: createHash("sha256").update(baseRaw).digest("hex"),
    recovered_receipt_ref: revision.ref,
    recovered_receipt_hash: createHash("sha256").update(revision.raw).digest("hex"),
    artifact_ref: ArtifactDir.open(state.workspace.worktreeRoot, state.task).reference("spec.md"),
    content_hash: createHash("sha256").update("# Current Spec\n").digest("hex"),
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
  expect(() => crashKernel.recoverBuildSpecReceiptRecords(records)).toThrow(/injected crash/i);
}

function injectConflictingRevision(state, records, revisionRaw) {
  const conflictKernel = createTaskKernel(state.task, {
    workspace: state.workspace,
    artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task),
    buildSpecRecoveryTestHooks: { seedRevisionRaw: revisionRaw },
  });
  expect(() => conflictKernel.recoverBuildSpecReceiptRecords(records)).toThrow(/revision conflicts/i);
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
      runtime, "recover-spec-receipt", "--stage=build-spec", "--project=Demo", "--task=spec-recovery",
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

describe("build-spec prepublish receipt recovery", () => {
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
    const staleRun = cli(state, ["run", "--stage=build-spec", "--project=Demo", "--task=spec-recovery"], {
      receipts: { spec: "receipts/spec.json", review: state.review.resultRef },
    });
    expect(staleRun.status).not.toBe(0);
    expect(staleRun.stderr).toMatch(/stale base receipt/i);
    expect(state.task.listStageAttemptRefs("build-spec")).toEqual([]);
    const acceptedRun = cli(state, ["run", "--stage=build-spec", "--project=Demo", "--task=spec-recovery"], {
      receipts: { spec: result.json.receipt_ref, review: state.review.resultRef },
    });
    expect(acceptedRun.status, acceptedRun.stderr).toBe(0);
    expect(JSON.parse(state.task.readRecord("results/build-spec/accepted.json")).attempt_ref).toBe("attempt-0001.json");
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
    ], { content: "# Current Spec\n" });
    expect(generic.status).not.toBe(0);
    expect(generic.stderr).toMatch(/recover-spec-receipt/i);
    expect(() => writeOfficialComponentReceipt({
      task: state.task,
      stage: "build-spec",
      component: "spec",
      payload: { content: "# Current Spec\n" },
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
        content: "# Current Spec\n",
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

    const attempted = acceptedDecisionFixture();
    writeOfficialComponentReceipt({ task: attempted.task, stage: "build-spec", component: "spec", payload: { content: "# Current Spec\n" } });
    mkdirSync(join(attempted.workspace.worktreeRoot, "specs", "spec-recovery"), { recursive: true });
    writeFileSync(join(attempted.workspace.worktreeRoot, "specs", "spec-recovery", "spec.md"), "# Current Spec\n");
    const attemptedTree = captureWorkspaceSnapshot(attempted.workspace).tree;
    const attemptedReview = writeFormalReviewFixture({ task: attempted.task, stage: "build-spec", snapshotTree: attemptedTree });
    registerReview(attempted, attemptedReview.resultRef);
    const completed = cli(attempted, ["run", "--stage=build-spec", "--project=Demo", "--task=spec-recovery"], {
      receipts: { spec: "receipts/spec.json", review: attemptedReview.resultRef },
    });
    expect(completed.status, completed.stderr).toBe(0);
    expect(attempted.task.listStageAttemptRefs("build-spec")).toEqual(["results/build-spec/attempt-0001.json"]);
    const blocked = recover(attempted, { content: "# Current Spec\n", receipts: { review: attemptedReview.resultRef } });
    expect(blocked.status).not.toBe(0);
    expect(blocked.stderr).toMatch(/no published stage attempt/i);
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
    registerReview(state, next.resultRef, state.review.resultRef);
    const stale = cli(state, ["run", "--stage=build-spec", "--project=Demo", "--task=spec-recovery"], {
      receipts: {
        spec: recovered.json.receipt_ref,
        review: state.review.resultRef,
        review_resolution: resolution.resolution_ref,
      },
    });
    expect(stale.status).not.toBe(0);
    expect(stale.stderr).toMatch(/authenticated flow|latest|head/i);
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
