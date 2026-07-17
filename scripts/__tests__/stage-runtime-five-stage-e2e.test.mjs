import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openTask } from "../../core/task-handle.mjs";
import { createLauncherAuthority } from "../../core/launcher-authority.mjs";
import { bindTaskRepository, createRepositoryRegistry } from "../../core/repository-registry.mjs";
import { captureWorkspaceSnapshot, createCanonicalReceiptWriter, writeOfficialComponentReceipt } from "../../core/canonical-receipt-writer.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { openAcceptedWorkspace } from "../../core/workspace.mjs";
import { runWorkspaceCommand } from "../../core/workspace-runner.mjs";
import { writeFormalReviewFixture } from "../../tests/helpers/formal-review.mjs";
import { createTrustedSignatureProof } from "../../core/human-confirmation.mjs";

const temporary = [];
const runtime = new URL("../../bin/workflowhub", import.meta.url).pathname;
let confirmationSequence = 0;
const CONFIRMATION_KEY = "official-five-stage-confirmation-key";

function confirmationPayload(task, stage, attemptRef) {
  confirmationSequence += 1;
  const boundRef = `results/${stage}/${attemptRef}`;
  const proofRef = `evidence/authentication/official-${confirmationSequence}.json`;
  const proofRaw = `${JSON.stringify({ schema_version: "test-signature-proof.v1", sequence: confirmationSequence })}\n`;
  createTaskKernel(task).publishCanonicalRecord(proofRef, proofRaw);
  const now = new Date().toISOString();
  const envelope = { schema_id:"https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json",schema_version:"1.0.0",purpose:"stage",task_id:task.identity.taskId,bound_ref:boundRef,bound_hash:createHash("sha256").update(task.readRecord(boundRef)).digest("hex"),actor:{id:"official-human",type:"human"},source_event:{ref:`source-events/official-${confirmationSequence}.json`,sha256:createHash("sha256").update(`event-${confirmationSequence}`).digest("hex"),occurred_at:now},authentication:{method:"signature",verified_at:now,proof_ref:proofRef,proof_hash:"0".repeat(64)},decision:"accepted",confirmed_at:now };
  envelope.authentication.signature = createTrustedSignatureProof(CONFIRMATION_KEY, envelope);
  return envelope;
}

function operationConfirmationPayload(task, purpose, plan) {
  confirmationSequence += 1;
  const proofRef = `evidence/authentication/official-${confirmationSequence}.json`;
  const proofRaw = `${JSON.stringify({ schema_version: "test-signature-proof.v1", sequence: confirmationSequence })}\n`;
  createTaskKernel(task).publishCanonicalRecord(proofRef, proofRaw);
  const now = new Date().toISOString();
  const envelope = { schema_id:"https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json",schema_version:"1.0.0",purpose,task_id:task.identity.taskId,bound_ref:`operations/${purpose}/plan.json`,bound_hash:plan.plan_hash,actor:{id:"official-human",type:"human"},source_event:{ref:`source-events/official-${confirmationSequence}.json`,sha256:createHash("sha256").update(`event-${confirmationSequence}`).digest("hex"),occurred_at:now},authentication:{method:"signature",verified_at:now,proof_ref:proofRef,proof_hash:"0".repeat(64)},decision:"accepted",confirmed_at:now };
  envelope.authentication.signature = createTrustedSignatureProof(CONFIRMATION_KEY, envelope);
  return envelope;
}

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
  mkdirSync(join(root, ".config", "workflowhub"), { recursive: true });
  const release = { ref: "releases/test/manifest.json", sha256: "a".repeat(64) };
  writeFileSync(join(root, ".config", "workflowhub", "config.json"), `${JSON.stringify({ confirmation_signing_key: CONFIRMATION_KEY, repositories: { "repositories/product": repo }, current_release: release })}\n`);
  const createInput = JSON.stringify({ schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json", schema_version: "1.0.0", command: "task", input_source: "@-", payload: { schema_id: "https://workflowhub.dev/schemas/task-create-input.v1.schema.json", schema_version: "1.0.0", project_name: "Demo", task_id: "official-chain", source_ref: "sources/offline/official.json", target_repository_ref: "repositories/product" } });
  execFileSync(process.execPath, [runtime, "task", "create", "--input=@-"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, input: createInput });
  const task = openTask(join(root, "Projects", "Demo", "tasks", "official-chain"), "Demo", "official-chain");
  const launcher = createLauncherAuthority({ home: root, env: { WORKFLOWHUB_TASK_DIR: root } });
  bindTaskRepository(task, createRepositoryRegistry(launcher, { "repositories/product": repo }));
  const mainStatus = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo, encoding: "utf8" }).trim();
  return { root, repo, task, baseline, tree, mainStatus, release };
}

function run(root, repo, args) {
  const action = args[0];
  const option = Object.fromEntries(args.slice(1).map((item) => {
    const split = item.indexOf("="); return [item.slice(2, split), item.slice(split + 1)];
  }));
  const inputIndex = args.findIndex((item) => item.startsWith("--input=") && item !== "--input=@-");
  const admitted = [...args];
  const payload = inputIndex < 0 ? undefined : JSON.parse(readFileSync(args[inputIndex].slice("--input=".length), "utf8"));
  const input = payload === undefined ? undefined : JSON.stringify({ schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json", schema_version: "1.0.0", command: "stage", input_source: "@-", payload: { stage_payload: payload } });
  if (inputIndex >= 0) admitted[inputIndex] = "--input=@-";
  const envelope = JSON.parse(execFileSync(process.execPath, [runtime, "stage", ...admitted], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8", input }));
  expect(envelope).toMatchObject({ status: "ok", exit_code: 0 });
  const taskRoot = join(root, "Projects", option.project, "tasks", option.task);
  if (action === "prepare") return { worktree_root: `${repo}-${option.task}`, baseline_commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim() };
  if (action === "receipt") return { receipt_ref: envelope.result_ref };
  if (action === "run") return { attempt_ref: envelope.result_ref.split("/").at(-1), attempt: JSON.parse(readFileSync(join(taskRoot, "results", option.stage, envelope.result_ref.split("/").at(-1)), "utf8")) };
  if (action === "confirm") return { ref: envelope.result_ref };
  return JSON.parse(readFileSync(join(taskRoot, "results", option.stage, "accepted.json"), "utf8"));
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("official five-stage CLI", () => {
  it("runs repository-owned handlers and accepts the complete chain", () => {
    const { root, repo, task, baseline, mainStatus, release } = fixture();
    const invoke = (stage, receipts, extra = []) => {
      const input = join(root, `${stage}-input.json`);
      writeFileSync(input, `${JSON.stringify({ receipts })}\n`);
      const attempt = run(root, repo, ["run", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${input}`, ...extra]);
      expect(attempt.attempt.schema_version).toBe("1.0.0");
      const human = ["make-decision", "build-plan", "verify-code"].includes(stage);
      let confirmation;
      if (human) {
        const confirmationInput = join(root, `${stage}-confirmation.json`);
        writeFileSync(confirmationInput, `${JSON.stringify(confirmationPayload(task, stage, attempt.attempt_ref))}\n`);
        confirmation = run(root, repo, ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, `--input=${confirmationInput}`, ...extra]);
      }
      const invalidArgs = human
        ? ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--human-confirmation-ref=plain-string", ...extra]
        : ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra];
      const invalid = spawnSync(process.execPath, [runtime, "stage", ...invalidArgs], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(invalid.status).not.toBe(0);
      const acceptedArgs = ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, ...(human ? [`--human-confirmation-ref=${confirmation.ref}`] : []), ...extra];
      const accepted = run(root, repo, acceptedArgs);
      expect(accepted.schema_version).toBe("1.0.0");
      expect(JSON.parse(readFileSync(join(root, "Projects", "Demo", "tasks", "official-chain", "task.json"), "utf8"))).toMatchObject({ release_manifest_ref: release.ref, release_manifest_hash: release.sha256 });
      return { attempt, accepted };
    };

    writeOfficialComponentReceipt({ task, stage: "make-decision", component: "decision", payload: { content: "go" } });
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
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "plan.md"), "# Plan\n");
    writeFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "tasks.md"), "# Tasks\n");
    const planReview = writeFormalReviewFixture({ task, stage: "build-plan", snapshotTree: captureWorkspaceSnapshot(workspace).tree });
    const buildPlan = invoke("build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: planReview.resultRef });
    expect(buildPlan.accepted.snapshot_ref).toMatch(/^snapshots\/[a-f0-9]{64}\.json$/);

    const code = "require('node:fs').mkdirSync('src',{recursive:true});require('node:fs').writeFileSync('src/feature.txt','implemented\\n')";
    expect(runWorkspaceCommand(workspace, "stage", process.execPath, ["-e", code]).status).toBe(0);

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
    invoke("verify-code", { tests: "receipts/verify-tests.json", review: verifyReview.resultRef, evidence: "evidence/verify-evidence.json" });

    const operation = (command, action, payload) => {
      const args = [runtime, command, action, "--project=Demo", "--task=official-chain"];
      const input = payload === undefined ? undefined : JSON.stringify({ schema_id:"https://workflowhub.dev/schemas/cli-input.v1.schema.json",schema_version:"1.0.0",command,input_source:"@-",payload:{operation_payload:payload} });
      if (input !== undefined) args.push("--input=@-");
      const envelope = JSON.parse(execFileSync(process.execPath, args, { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8", input }));
      expect(envelope).toMatchObject({ status: "ok", exit_code: 0 });
      return envelope;
    };
    operation("commit", "prepare");
    const commitPlan = JSON.parse(task.readRecord("operations/commit/plan.json"));
    expect(commitPlan).toMatchObject({ release_ref: release.ref, release_hash: release.sha256 });
    operation("commit", "confirm", operationConfirmationPayload(task, "commit", commitPlan));
    operation("commit", "execute");
    const commit = JSON.parse(task.readRecord("operations/commit/completed.json"));
    expect(execFileSync("git", ["rev-parse", commit.target_ref], { cwd: repo, encoding: "utf8" }).trim()).toBe(commit.commit_oid);

    operation("close", "prepare");
    const closePlan = JSON.parse(task.readRecord("operations/close/plan.json"));
    expect(closePlan).toMatchObject({ release_ref: release.ref, release_hash: release.sha256 });
    operation("close", "confirm", operationConfirmationPayload(task, "close", closePlan));

    // Crash window: the logical postcondition exists, but no step record does.
    task.createRecordAtomic("operations/close/logical-state.json", `${JSON.stringify({ schema_version:"task-logical-close.v1",task_id:"official-chain",plan_hash:closePlan.plan_hash,lineage_hash:closePlan.lineage_hash,status:"closed" }, null, 2)}\n`);
    const parent = execFileSync("git", ["show", "-s", "--format=%P", commit.commit_oid], { cwd: repo, encoding: "utf8" }).trim();
    execFileSync("git", ["update-ref", commit.target_ref, parent, commit.commit_oid], { cwd: repo });
    const failedClose = spawnSync(process.execPath, [runtime, "close", "execute", "--project=Demo", "--task=official-chain"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(failedClose.status).toBe(15);
    expect(failedClose.stderr).toMatch(/AUTHORIZATION_STALE|precondition/i);
    execFileSync("git", ["update-ref", commit.target_ref, commit.commit_oid, parent], { cwd: repo });
    operation("close", "execute");
    expect(JSON.parse(task.readRecord("operations/close/completed.json"))).toMatchObject({ status: "completed", task_id: "official-chain" });
    expect(JSON.parse(task.readRecord("operations/close/steps/logical-close.json"))).toMatchObject({ completion_mode: "reconciled" });

    const logicalPath = task.recordPath("operations/close/logical-state.json");
    const exactLogical = readFileSync(logicalPath, "utf8");
    writeFileSync(logicalPath, `${JSON.stringify({ status: "third-state" })}\n`);
    const staleRetry = spawnSync(process.execPath, [runtime, "close", "execute", "--project=Demo", "--task=official-chain"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(staleRetry.status).toBe(15);
    expect(staleRetry.stderr).toMatch(/AUTHORIZATION_STALE|postcondition/i);
    writeFileSync(logicalPath, exactLogical);
    operation("close", "execute");

    const manifestPath = join(root, "Projects", "Demo", "tasks", "official-chain", "task.json");
    const exactManifest = readFileSync(manifestPath, "utf8");
    const driftedManifest = { ...JSON.parse(exactManifest), release_manifest_hash: "b".repeat(64) };
    writeFileSync(manifestPath, `${JSON.stringify(driftedManifest, null, 2)}\n`);
    const releaseDrift = spawnSync(process.execPath, [runtime, "close", "execute", "--project=Demo", "--task=official-chain"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(releaseDrift.status).toBe(15);
    expect(releaseDrift.stderr).toMatch(/AUTHORIZATION_STALE|release pin drift/i);
    writeFileSync(manifestPath, exactManifest);
    operation("close", "execute");

    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(JSON.parse(task.readRecord(`results/${stage}/accepted.json`))).toMatchObject({ schema_version: "1.0.0", task_id: "official-chain", stage });
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
