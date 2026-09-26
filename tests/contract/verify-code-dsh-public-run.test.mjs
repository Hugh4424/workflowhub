import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { recordDshCodeReviewResult } from "../../runtime/review/review-record-route.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "verify-code-dsh-public-run-")));
  roots.push(root);
  const repo = join(root, "repo");
  const taskId = "verify-code-dsh-publication";
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub tests"]);
  git(repo, ["config", "user.email", "workflowhub-tests@example.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "baseline"]);

  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-09-24T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const materials = writeCanonicalStageMaterials(artifacts);
  artifacts.writeAtomic("decision-log.md", `${materials["decision-log.md"]}\n\n## 任务身份\n\n- **任务类型**：普通任务\n`);
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace });
  return { root, task, workspace, kernel };
}

async function withRuntimeEnvironment(state, action) {
  const keys = ["HOME", "WORKFLOWHUB_TASK_DIR", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const home = join(state.root, "home");
  mkdirSync(home, { recursive: true });
  process.env.HOME = home;
  process.env.WORKFLOWHUB_TASK_DIR = state.root;
  for (const key of keys.slice(2)) delete process.env[key];
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

async function dispatchOcrReview(state, findings = []) {
  const inputPath = join(state.root, "verify-code-review-request.json");
  const materialId = "a".repeat(64);
  writeFileSync(inputPath, JSON.stringify({ request: {
    stage: "verify-code", subject_kind: "worktree", host_provider: "codex/luna",
    materials: { implementation: "current diff", acceptance_criteria: "AC-1: current code works." },
  } }));
  return stageRuntimeCliMain([
    "review", "--action=record", "--stage=verify-code", "--project=workflowhub",
    `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
  ], { cwd: state.workspace.worktreeRoot, services: {
    resolveRouteIdentity: () => ({ route_identity: "b".repeat(64) }),
    materialIdForRequest: () => materialId,
    runOcrDelegationRound: async (request) => ({
      status: "available", stage: request.stage, review_track: null, review_kind: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
      material_id: materialId, runtime_id: "ocr-review-fixture", outcome: "completed",
      ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
      findings: findings.map((finding) => ({ provider: "codex/luna", ...finding })),
      provider_results: [{ provider: "codex/luna", status: "completed",
        identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
        error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
        evidence_anchor_valid: findings.map(() => false),
      }],
    }),
  } });
}

async function dispatchUnavailableOcrReview(state, {
  dispatchState = "dispatched", errorCode = "OCR_ALL_PROVIDERS_FAILED", providerStatus = "failed",
  materialId = "c".repeat(64), implementation = "current diff",
} = {}) {
  const inputPath = join(state.root, "verify-code-unavailable-review.json");
  writeFileSync(inputPath, JSON.stringify({ request: {
    stage: "verify-code", subject_kind: "worktree", host_provider: "codex/luna",
    materials: { implementation, acceptance_criteria: "AC-1: current code works." },
  } }));
  return stageRuntimeCliMain([
    "review", "--action=record", "--stage=verify-code", "--project=workflowhub",
    `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
  ], { cwd: state.workspace.worktreeRoot, services: {
    resolveRouteIdentity: () => ({ route_identity: "d".repeat(64) }),
    materialIdForRequest: () => materialId,
    runOcrDelegationRound: async (request) => ({
      status: "unavailable", stage: request.stage, review_track: null, review_kind: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
      material_id: materialId, runtime_id: "ocr-unavailable-fixture", outcome: "unavailable",
      ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
      findings: [], dispatch_state: dispatchState,
      error: { code: errorCode, message: "controlled OCR route unavailable" },
      provider_results: dispatchState === "blocked_before_dispatch" ? [] : [{ provider: "codex/luna", status: providerStatus,
        identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
        error: { code: providerStatus === "cancelled" ? "PROCESS_CANCELLED" : "PROCESS_FAILED", message: "controlled OCR provider unavailable" },
        timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
        evidence_anchor_valid: [],
      }],
    }),
  } });
}

describe("verify-code OCR result through the public review and run interfaces", () => {
  it("resolves an Architect fallback finding through current code_review_repairs", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-fallback-repair.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];
    const sourcePath = join(state.workspace.worktreeRoot, "README.md");
    await withRuntimeEnvironment(state, async () => {
      const ocr = await dispatchUnavailableOcrReview(state);
      const originalAttempt = state.task.readRecord(ocr.attempt_ref);
      const fallback = recordDshCodeReviewResult({ task: state.task, kernel: state.kernel, result: { findings: [{
        severity: "major", path: "README.md", line: 1,
        issue: "The baseline does not implement the expected behavior.",
        recommendation: "Replace the baseline with the repaired behavior.",
        root_cause: "The source still contains the baseline value.",
        evidence_kind: "direct", evidence: "baseline",
      }] } });
      const review = JSON.parse(state.task.readRecord(fallback.result_ref));
      expect(review.findings).toHaveLength(1);
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: fallback.result_ref } }));
      const withFinding = await stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot });
      const findingFact = withFinding.quality_fact_refs
        .map((ref) => JSON.parse(state.task.readRecord(ref)))
        .find((fact) => fact.kind === "review" && fact.subject === "code_review");
      expect(findingFact).toMatchObject({ status: "missing", review_status: "findings" });
      expect(findingFact.evidence).toContainEqual(expect.objectContaining({ ref: fallback.result_ref }));
      writeFileSync(sourcePath, "repaired\n");
      const receipt = createCanonicalReceiptWriter({
        task: state.task, workspace: openCurrentTaskWorkspace(state.task),
        stage: "verify-code", component: "verify-code-test-capture",
      }).captureTests({
        command: 'test "$(cat README.md)" = repaired',
        receiptRef: "quality/tests/fallback-repair.json",
        outputRef: "quality/tests/output/fallback-repair.output",
      });
      const repairs = review.findings.map(({ id }) => ({
        finding_id: id, status: "fixed", reason: "source changed and the affected check passed",
        source_refs: [{ path: "README.md", sha256: createHash("sha256").update(readFileSync(sourcePath)).digest("hex") }],
        check_refs: [{ ref: receipt.receipt_ref, sha256: receipt.receipt_hash }],
      }));
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: fallback.result_ref }, code_review_repairs: repairs }));
      const run = await stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot });
      const facts = run.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
      const reviewFact = facts.find((fact) => fact.kind === "review" && fact.subject === "code_review");
      expect(reviewFact).toMatchObject({ status: "recorded", review_status: "resolved" });
      expect(reviewFact.evidence).toContainEqual(expect.objectContaining({ ref: fallback.result_ref }));
      expect(state.task.readRecord(ocr.attempt_ref)).toBe(originalAttempt);
      const status = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates.code_review.status).toBe("satisfied");
    });
  });

  it("does not consume an Architect result without an unavailable OCR attempt", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-no-ocr-fallback.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];
    await withRuntimeEnvironment(state, async () => {
      const fallback = recordDshCodeReviewResult({ task: state.task, kernel: state.kernel, result: { findings: [] } });
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: fallback.result_ref } }));
      await expect(stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot }))
        .rejects.toThrow(/not an authenticated OCR delegation result or eligible Architect fallback/);
      const status = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates.code_review.status).toBe("missing");
    });
  });

  it.each([
    ["explicitly cancelled OCR", { dispatchState: "dispatched", errorCode: "OCR_EXECUTOR_CANCELLED", providerStatus: "cancelled" }],
    ["OCR blocked before dispatch", { dispatchState: "blocked_before_dispatch", errorCode: "OCR_PROVIDER_CONFIG_INVALID" }],
  ])("does not consume an Architect result after %s", async (_name, unavailable) => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-ineligible-fallback.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];
    await withRuntimeEnvironment(state, async () => {
      const ocr = await dispatchUnavailableOcrReview(state, unavailable);
      const originalAttempt = state.task.readRecord(ocr.attempt_ref);
      expect(JSON.parse(originalAttempt)).toMatchObject({
        terminal_status: "unavailable", dispatch_state: unavailable.dispatchState,
        error: { code: unavailable.errorCode },
      });
      if (unavailable.dispatchState === "blocked_before_dispatch") {
        expect(JSON.parse(originalAttempt).provider_attempts).toHaveLength(0);
      }
      const fallback = recordDshCodeReviewResult({ task: state.task, kernel: state.kernel, result: { findings: [] } });
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: fallback.result_ref } }));
      await expect(stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot }))
        .rejects.toThrow(/not an authenticated OCR delegation result or eligible Architect fallback/);
      expect(state.task.readRecord(ocr.attempt_ref)).toBe(originalAttempt);
      const status = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates.code_review.status).toBe("missing");
    });
  });

  it("does not consume an Architect fallback after two dispatched unavailable OCR attempts", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-repeat-ocr-fallback.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];
    await withRuntimeEnvironment(state, async () => {
      const first = await dispatchUnavailableOcrReview(state);
      const second = await dispatchUnavailableOcrReview(state, {
        materialId: "e".repeat(64), implementation: "second current diff",
      });
      expect(second.attempt_ref).not.toBe(first.attempt_ref);
      const originals = [first, second].map(({ attempt_ref: ref }) => [ref, state.task.readRecord(ref)]);
      for (const [, raw] of originals) {
        expect(JSON.parse(raw)).toMatchObject({ terminal_status: "unavailable", dispatch_state: "dispatched" });
      }
      const fallback = recordDshCodeReviewResult({ task: state.task, kernel: state.kernel, result: { findings: [] } });
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: fallback.result_ref } }));
      await expect(stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot }))
        .rejects.toThrow(/not an authenticated OCR delegation result or eligible Architect fallback/);
      for (const [ref, raw] of originals) expect(state.task.readRecord(ref)).toBe(raw);
      const status = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates.code_review.status).toBe("missing");
    });
  });

  it("ignores an older blocked OCR attempt when exactly one OCR dispatch failed", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-blocked-history-fallback.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];
    await withRuntimeEnvironment(state, async () => {
      const blocked = await dispatchUnavailableOcrReview(state, {
        dispatchState: "blocked_before_dispatch", errorCode: "OCR_PROVIDER_CONFIG_INVALID",
      });
      const dispatched = await dispatchUnavailableOcrReview(state, {
        materialId: "e".repeat(64), implementation: "current diff after blocked setup",
      });
      expect(dispatched.attempt_ref).not.toBe(blocked.attempt_ref);
      expect(JSON.parse(state.task.readRecord(blocked.attempt_ref))).toMatchObject({ dispatch_state: "blocked_before_dispatch" });
      expect(JSON.parse(state.task.readRecord(dispatched.attempt_ref))).toMatchObject({ dispatch_state: "dispatched" });
      const fallback = recordDshCodeReviewResult({ task: state.task, kernel: state.kernel, result: { findings: [] } });
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: fallback.result_ref } }));
      const run = await stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot });
      const reviewFact = run.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)))
        .find((fact) => fact.kind === "review" && fact.subject === "code_review");
      expect(reviewFact).toMatchObject({ status: "recorded", review_status: "clean" });
      expect(reviewFact.evidence).toContainEqual(expect.objectContaining({ ref: fallback.result_ref }));
    });
  });

  it("records an Architect fallback after OCR unavailable without erasing its attempt", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-fallback-run.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];

    await withRuntimeEnvironment(state, async () => {
      const ocr = await dispatchUnavailableOcrReview(state);
      const originalAttempt = state.task.readRecord(ocr.attempt_ref);
      expect(ocr.result_ref).toBeNull();
      expect(JSON.parse(originalAttempt)).toMatchObject({ terminal_status: "unavailable", dispatch_state: "dispatched" });
      const fallback = recordDshCodeReviewResult({ task: state.task, kernel: state.kernel, result: { findings: [] } });
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: fallback.result_ref } }));
      const run = await stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot });
      const facts = run.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
      const reviewFact = facts.find((fact) => fact.kind === "review" && fact.subject === "code_review");
      expect(reviewFact).toMatchObject({ status: "recorded", review_status: "clean" });
      expect(reviewFact.evidence).toContainEqual(expect.objectContaining({ ref: fallback.result_ref, evidence_type: "review_result" }));
      expect(state.task.readRecord(ocr.attempt_ref)).toBe(originalAttempt);
      const status = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates.code_review.status).toBe("satisfied");
    });
  });

  it("writes and consumes the current canonical code review", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-run.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];

    await withRuntimeEnvironment(state, async () => {
      const recorded = await dispatchOcrReview(state);
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: recorded.result_ref } }));
      const run = await stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot });
      const facts = run.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
      const reviewFact = facts.find((fact) => fact.kind === "review" && fact.subject === "code_review");

      expect(reviewFact).toMatchObject({ status: "recorded", review_status: "clean" });
      const reviewRef = reviewFact.evidence.find((item) => item.evidence_type === "review_result").ref;
      const review = JSON.parse(state.task.readRecord(reviewRef));
      expect(review).toMatchObject({
        task_id: state.task.identity.taskId,
        stage: "verify-code",
        findings: [],
      });
      expect(review.provider_results).toHaveLength(1);
      expect(review.provider_results[0].provider).toBe("codex/luna");

      const status = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_missing).not.toContain("code_review");
      expect(status.quality_predicates.code_review.status).toBe("satisfied");
      expect(review.snapshot_tree).toBe(status.identity.snapshot_tree);
      expect(review.material_revision).toBe(status.identity.material_revision);
    });
  });

  it("records a minor finding without a source-line anchor", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-run.json");
    const findings = [{
      severity: "minor",
      path: "README.md",
      issue: "A minor wording improvement is available.",
      recommendation: "Use a shorter sentence.",
    }];
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];

    await withRuntimeEnvironment(state, async () => {
      const recorded = await dispatchOcrReview(state, findings);
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: recorded.result_ref } }));
      const run = await stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot });
      const facts = run.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
      const reviewFact = facts.find((fact) => fact.kind === "review" && fact.subject === "code_review");
      expect(reviewFact).toMatchObject({ status: "recorded", review_status: "clean" });

      const reviewRef = reviewFact.evidence.find((item) => item.evidence_type === "review_result").ref;
      const review = JSON.parse(state.task.readRecord(reviewRef));
      expect(review.findings).toHaveLength(1);
      expect(review.findings[0]).toMatchObject({
        provider: "codex/luna",
        severity: "minor",
        path: "README.md",
      });
      expect(review.findings[0].provider_findings).toEqual([
        expect.objectContaining({ provider: "codex/luna", evidence_anchor_valid: false }),
      ]);

      const status = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates.code_review.status).toBe("satisfied");
    });
  });

  it("does not treat a canonical review from an older code snapshot as current", async () => {
    const state = fixture();
    const inputPath = join(state.root, "verify-code-run.json");
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];

    await withRuntimeEnvironment(state, async () => {
      const recorded = await dispatchOcrReview(state);
      writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: recorded.result_ref } }));
      await stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot });
      const current = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(current.quality_predicates.code_review.status).toBe("satisfied");

      writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "changed after the code review\n");
      const stale = await stageRuntimeMain(["status", ...args], { cwd: state.workspace.worktreeRoot });
      expect(stale.quality_missing).toContain("code_review");
      expect(stale.quality_predicates.code_review.status).toBe("missing");
    });
  });

  it("rejects a non-OCR result from the canonical code-review slot", async () => {
    const state = fixture();
    const review = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.workspace.captureSnapshot().tree,
      materialRevision: state.kernel.currentVNextMaterialRevision(),
      verdict: "pass",
      provider: "codex/luna",
    });
    const inputPath = join(state.root, "verify-code-run.json");
    writeFileSync(inputPath, JSON.stringify({ receipts: { quality_review: review.resultRef } }));
    const args = ["--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`];

    await withRuntimeEnvironment(state, async () => {
      await expect(stageRuntimeMain(["run", ...args, `--input=${inputPath}`], { cwd: state.workspace.worktreeRoot }))
        .rejects.toThrow(/not an authenticated OCR delegation result/);
    });
  });
});
