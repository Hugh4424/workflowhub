import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runOcrDelegationRound } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { authenticatedEvidenceBytes, authenticatedEvidenceDigest } from "../../runtime/review/review-packet-identity.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, reviewRecordTimeoutForRunner, runConfiguredOcrHostReview, stageRuntimeCliMain, stageRuntimeMain, writeOcrProviderHealthDiagnostic } from "../../tools/cli/stage-runtime.mjs";

const roots = [];
const materialId = createHash("sha256").update("ocr-production-cutover-fixture").digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-production-cutover-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub cutover test"]);
  git(repo, ["config", "user.email", "workflowhub-cutover@test.local"]);
  writeFileSync(join(repo, "README.md"), "cutover fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `ocr-production-cutover-${Math.random().toString(16).slice(2)}`;
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", execution_mode: "per_invocation", record_model: "vnext-single-write",
      project_name: "workflowhub", task_id: taskId, created_at: "2026-09-25T00:00:00.000Z",
      target_repo_root: repo, issue_ids: [], inputs: {},
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
  for (const name of ["spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\n`);
  const home = join(root, "home");
  mkdirSync(home);
  return { root, home, task, workspace };
}

async function withRuntimeEnvironment(state, action) {
  const keys = ["HOME", "WORKFLOWHUB_TASK_DIR", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.HOME = state.home;
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

function reviewResultFor(request) {
  return {
    status: "available",
    stage: request.stage,
    review_track: null,
    review_kind: request.review_kind ?? null,
    subject_kind: request.subject_kind ?? "worktree",
    phase_id: request.phase_id ?? null,
    review_scope: request.review_scope ?? null,
    material_id: materialId,
    runtime_id: "cutover-route-spy",
    outcome: "completed",
    ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
    findings: [],
    provider_results: [{
      provider: "codex/luna", status: "completed",
      identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
      error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
  };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("OCR production cutover defaults", () => {
  it("delivers reviewed execution evidence in the OCR manifest and direct provider packet", async () => {
    const state = fixture();
    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "reviewed execution source\n");
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    const authenticatedEvidence = {
      runtime_execution_records: [{ ref: "quality/evidence/stage-quality/build-code/AC-EXE-002.json",
        raw: '{"subject_fact":{"outcome":"unavailable","outcome_reason":"review unavailable"}}' }],
    };
    const request = {
      stage: "verify-code", subject_kind: "worktree", host_provider: "codex/host",
      materials: { changed_files: "README.md", implementation_assessment: "Inspect current execution behavior.",
        test_context: "Focused execution evidence delivery check.", open_risks: "none declared",
        acceptance_criteria: "AC-EXE-002: Preserve the unavailable execution fact for review." },
      authenticated_evidence: authenticatedEvidence,
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle({ task: state.task, workspace: openCurrentTaskWorkspace(state.task) }, request,
      { loadConfig: () => ({ attachmentRoot }) });
    const expectedBytes = authenticatedEvidenceBytes(authenticatedEvidence);
    let receivedBytes = null;
    let receivedInstructions = null;
    try {
      expect(bundle.manifest).toContainEqual({ path: "authenticated-evidence.json", bytes: expectedBytes.length,
        sha256: createHash("sha256").update(expectedBytes).digest("hex") });
      const result = await runOcrDelegationRound(request, {
        buildBundle: () => bundle,
        executor: ({ request: delegated, packet }) => runConfiguredOcrHostReview({ request: delegated, packet }, {
          trustedContext: {
            trusted: { config: "unused" }, route: { minimum_heterologous: 1 },
            selection: { providers: ["kimi/reviewer"], eligibleProfiles: ["kimi/reviewer"],
              provider_identities: { "kimi/reviewer": { source_id: "kimi/independent", config_id: "fixture/config" } },
              provider_models: { "kimi/reviewer": "fixture-model" } },
            providerConfig: { providers: { "kimi/reviewer": { enabled: true, model: "fixture-model" } } },
          },
          providerExecutor: async ({ cwd }) => {
            receivedBytes = readFileSync(join(cwd, "authenticated-evidence.json"));
            receivedInstructions = readFileSync(join(cwd, "review-instructions.md"), "utf8");
            return { status: "completed", output: JSON.stringify({ role: "assistant",
              content: [{ type: "text", text: '{"findings":[]}' }] }) };
          },
        }),
      });
      expect(receivedBytes).toEqual(expectedBytes);
      expect(receivedInstructions).toContain("compare code/test claims with recorded execution");
      expect(receivedInstructions).toContain("identify false-green behavior");
      expect(result.authenticated_evidence_sha256).toBe(authenticatedEvidenceDigest(authenticatedEvidence));
    } finally {
      bundle.dispose();
    }
  });

  it("reports silent but live provider health on stderr without imposing a review deadline", () => {
    const lines = [];
    writeOcrProviderHealthDiagnostic({
      provider: "codex/luna", status: "running", liveness: true,
      last_output_at_ms: null, progress_events: 0, stdout_bytes: 0, stderr_bytes: 0,
      host_path: "/private/sensitive/path", raw_output: "secret",
    }, { stderr: { write: (line) => lines.push(line) } });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^\[ocr-review\] /);
    const diagnostic = JSON.parse(lines[0].slice("[ocr-review] ".length));
    expect(diagnostic).toEqual({
      provider: "codex/luna", status: "running", liveness: true,
      last_output_at_ms: null, progress_events: 0, stdout_bytes: 0, stderr_bytes: 0,
    });
    expect(lines[0]).not.toMatch(/sensitive|secret/);
    writeOcrProviderHealthDiagnostic({ provider: "/private/sensitive/provider", status: "running", liveness: true },
      { stderr: { write: (line) => lines.push(line) } });
    expect(JSON.parse(lines[1].slice("[ocr-review] ".length)).provider).toBe("redacted");
    expect(reviewRecordTimeoutForRunner({ managed: true })).toBeNull();
  });
  it.each([
    ["phase", "build-code", { review_scope: "phase", subject_kind: "phase", phase_id: "P3" }, "phase_review", "review"],
    ["final", "verify-code", { subject_kind: "worktree" }, "code_review", "quality_review"],
  ])("routes ordinary %s through OCR without a candidate flag or legacy dispatch", async (_scope, stage, scope, factSubject, receiptKey) => {
    const state = fixture();
    const calls = { legacy: 0, ocr: 0 };
    const healthEvents = [];
    const reviewInputPath = join(state.root, "ordinary-review.json");
    writeFileSync(reviewInputPath, JSON.stringify({ request: {
      stage, ...scope, host_provider: "codex/luna", materials: { implementation: "current diff" },
    } }), "utf8");
    await withRuntimeEnvironment(state, async () => {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", `--stage=${stage}`, "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${reviewInputPath}`,
      ], {
        cwd: state.workspace.worktreeRoot,
        services: {
          resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
          materialIdForRequest: () => materialId,
          onOcrProviderHealth: (health) => healthEvents.push(health),
          runReviewRound: async (request) => { calls.legacy += 1; return reviewResultFor(request); },
          runOcrDelegationRound: async (request, options) => {
            calls.ocr += 1;
            options.onProviderHealth({ provider: "codex/luna", status: "running", liveness: true,
              last_output_at_ms: null, progress_events: 0, stdout_bytes: 0, stderr_bytes: 0 });
            return reviewResultFor(request);
          },
        },
      });
      expect(calls).toEqual({ legacy: 0, ocr: 1 });
      expect(healthEvents).toMatchObject([{ status: "running", liveness: true, progress_events: 0 }]);
      const runInputPath = join(state.root, "ocr-run.json");
      writeFileSync(runInputPath, JSON.stringify({ receipts: { [receiptKey]: recorded.result_ref } }), "utf8");

      const run = await stageRuntimeMain([
        "run", `--stage=${stage}`, "--project=workflowhub", `--task=${state.task.identity.taskId}`, `--input=${runInputPath}`,
      ], { cwd: state.workspace.worktreeRoot });
      const facts = run.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
      const reviewFact = facts.find((fact) => fact.kind === "review" && fact.subject === factSubject);
      expect(reviewFact).toMatchObject({ status: "recorded", review_status: "clean" });
      const reviewRef = reviewFact.evidence.find((entry) => entry.evidence_type === "review_result").ref;
      const review = JSON.parse(state.task.readRecord(reviewRef));
      expect(review).toMatchObject({
        stage, review_scope: scope.review_scope ?? null,
        subject_kind: scope.subject_kind, phase_id: scope.phase_id ?? null,
        provider_results: [{ provider: "codex/luna" }],
      });
      const attempt = JSON.parse(state.task.readRecord(review.attempt_ref));
      expect(attempt.provider_attempts).toMatchObject([
        { provider: "codex/luna", identity: { source_id: "fixture/source" } },
      ]);
      const status = await stageRuntimeMain([
        "status", `--stage=${stage}`, "--project=workflowhub", `--task=${state.task.identity.taskId}`,
      ], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates).not.toHaveProperty("integration_review");
      if (stage === "verify-code") {
        expect(status.quality_predicates.code_review.status).toBe("satisfied");
        expect(status.quality_missing).not.toContain("code_review");
      }
    });
  });

  it("keeps an explicit candidate flag compatible with the same OCR route", async () => {
    const state = fixture();
    const inputPath = join(state.root, "candidate-review.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
      candidate_experiment: true, host_provider: "codex/luna", materials: { implementation: "isolated candidate" },
    } }), "utf8");
    const calls = { ocr: 0, legacy: 0 };

    await withRuntimeEnvironment(state, async () => {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
      ], {
        cwd: state.workspace.worktreeRoot,
        services: {
          resolveRouteIdentity: () => ({ route_identity: "b".repeat(64) }),
          materialIdForRequest: () => materialId,
          runOcrDelegationRound: async (request) => { calls.ocr += 1; return reviewResultFor(request); },
          runReviewRound: async (request) => { calls.legacy += 1; return reviewResultFor(request); },
        },
      });

      expect(recorded.status).toBe("recorded");
      expect(calls).toEqual({ ocr: 1, legacy: 0 });
      expect(JSON.parse(state.task.readRecord(recorded.result_ref))).toMatchObject({
        stage: "build-code", review_scope: "phase", phase_id: "P3", subject_kind: "phase",
      });
    });
  });

  it("rejects a malformed code-surface request before any review runner", async () => {
    const state = fixture();
    const inputPath = join(state.root, "malformed-review.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      stage: "build-code", review_scope: "phase", subject_kind: "worktree", phase_id: "P3",
      host_provider: "codex/luna", materials: { implementation: "current diff" },
    } }), "utf8");
    const calls = { ocr: 0, legacy: 0 };
    await withRuntimeEnvironment(state, async () => {
      await expect(stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
      ], { cwd: state.workspace.worktreeRoot, services: {
        runOcrDelegationRound: async () => { calls.ocr += 1; },
        runReviewRound: async () => { calls.legacy += 1; },
      } })).rejects.toThrow(/malformed OCR code-surface request/);
      expect(calls).toEqual({ ocr: 0, legacy: 0 });
    });
  });

  it("rejects a verify-code result without OCR provenance", async () => {
    const state = fixture();
    const reviewInputPath = join(state.root, "non-ocr-final.json");
    writeFileSync(reviewInputPath, JSON.stringify({ request: {
      stage: "verify-code", subject_kind: "worktree",
      host_provider: "codex/luna", materials: { implementation: "current diff" },
    } }));
    await withRuntimeEnvironment(state, async () => {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", "--stage=verify-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${reviewInputPath}`,
      ], { cwd: state.workspace.worktreeRoot, services: {
        resolveRouteIdentity: () => ({ route_identity: "c".repeat(64) }),
        materialIdForRequest: () => materialId,
        runOcrDelegationRound: async (request) => {
          const result = reviewResultFor(request);
          delete result.ocr;
          return result;
        },
      } });
      const runInputPath = join(state.root, "non-ocr-run.json");
      writeFileSync(runInputPath, JSON.stringify({ receipts: { quality_review: recorded.result_ref } }));
      await expect(stageRuntimeMain([
        "run", "--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`,
        `--input=${runInputPath}`,
      ], { cwd: state.workspace.worktreeRoot })).rejects.toThrow(/not an authenticated OCR delegation result/);
      const status = await stageRuntimeMain([
        "status", "--stage=verify-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`,
      ], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates.code_review.status).toBe("missing");
    });
  });

  it("keeps explicit historical integration review compatible without making it a completion predicate", async () => {
    const state = fixture();
    const reviewInputPath = join(state.root, "multi-provider-integration.json");
    writeFileSync(reviewInputPath, JSON.stringify({ request: {
      stage: "build-code", review_scope: "integration", subject_kind: "worktree", phase_id: null,
      host_provider: "codex/luna", materials: { implementation: "current diff" },
    } }));
    await withRuntimeEnvironment(state, async () => {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${reviewInputPath}`,
      ], { cwd: state.workspace.worktreeRoot, services: {
        resolveRouteIdentity: () => ({ route_identity: "d".repeat(64) }),
        materialIdForRequest: () => materialId,
        runOcrDelegationRound: async (request) => {
          const result = reviewResultFor(request);
          result.provider_results.push({
            provider: "claude/sonnet", status: "failed",
            identity: { provider: "claude/sonnet", adapter: "claude", source_id: "fixture/second-source", config_id: "fixture/second-config", model: "fixture-model" },
            error: { code: "OCR_PROVIDER_EXIT_NONZERO", message: "second member failed" },
            timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
            evidence_anchor_valid: [],
          });
          return result;
        },
      } });
      const canonical = JSON.parse(state.task.readRecord(recorded.result_ref));
      const attempt = JSON.parse(state.task.readRecord(canonical.attempt_ref));
      expect(attempt.provider_attempts).toHaveLength(2);
      expect(canonical.provider_results).toHaveLength(1);
      const runInputPath = join(state.root, "multi-provider-run.json");
      writeFileSync(runInputPath, JSON.stringify({ receipts: { review: recorded.result_ref } }));
      await stageRuntimeMain([
        "run", "--stage=build-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`,
        `--input=${runInputPath}`,
      ], { cwd: state.workspace.worktreeRoot });
      const status = await stageRuntimeMain([
        "status", "--stage=build-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`,
      ], { cwd: state.workspace.worktreeRoot });
      expect(status.quality_predicates).not.toHaveProperty("integration_review");
      expect(status.quality_missing).not.toContain("integration_review");
    });
  });
});
