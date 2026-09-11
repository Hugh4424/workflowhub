import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, prepareTaskBoundIntegrationReviewBundle, stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";
import {
  importCanonicalReviewResult,
  recordSimpleReviewRequest,
} from "../../runtime/review/review-record-route.mjs";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fixtureRouteIdentity = () => ({ route_identity: "a".repeat(64) });
const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function makeTask() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "review-public-entrypoints-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub public review test"]);
  git(["config", "user.email", "review-public@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "public review fixture\n", "utf8");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
      created_at: "2026-08-21T00:00:00.000Z", target_repo_root: repo,
      issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n");
  artifacts.writeAtomic("spec.md", "# Spec\n");
  artifacts.writeAtomic("plan.md", "# Plan\n");
  artifacts.writeAtomic("tasks.md", "# Tasks\n");
  return { root, task, candidateWorkspace, kernel: createTaskKernel(task, { candidateWorkspace }) };
}

function resultFor(request) {
  return {
    status: "available", stage: request.stage, review_track: null, review_kind: null,
    material_id: createSimpleReviewPacket(request).material_id, runtime_id: "runtime-public-import",
    outcome: "completed",
    provider_results: [{
      provider: "codex/luna", status: "completed",
      identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "fixture-config", model: "gpt-5.6-luna" },
      error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
    findings: [],
  };
}

function importProvenance(task, attemptRef, resultRef, reportRef) {
  const attemptRaw = task.readRecord(attemptRef);
  const attempt = JSON.parse(attemptRaw);
  const resultRaw = task.readRecord(resultRef);
  const result = JSON.parse(resultRaw);
  const provider_outputs = attempt.provider_attempts.map((member) => {
    const outputRaw = member.output_ref === null ? null : task.readRecord(member.output_ref);
    return {
      provider: member.provider,
      status: member.status,
      identity: member.identity,
      output_ref: member.output_ref,
      output_sha256: outputRaw === null ? null : sha256(outputRaw),
      raw_output_ref: member.raw_output_ref ?? null,
      raw_output_sha256: member.raw_output_ref === null || member.raw_output_ref === undefined
        ? null : sha256(JSON.stringify(member.raw_output_ref)),
    };
  });
  return {
    request_key: attempt.request_key,
    attempt_ref: attemptRef, attempt_sha256: sha256(attemptRaw),
    result_ref: resultRef, result_sha256: sha256(resultRaw),
    report_ref: reportRef, report_sha256: sha256(task.readRecord(reportRef)),
    task_id: attempt.task_id, stage: attempt.stage,
    review_track: attempt.review_track ?? null, review_kind: attempt.review_kind ?? null,
    subject_kind: attempt.subject_kind, phase_id: attempt.phase_id ?? null,
    review_scope: attempt.review_scope ?? null,
    base_tree: attempt.base_tree, candidate_tree: attempt.candidate_tree,
    material_id: attempt.material_id, material_revision: attempt.material_revision,
    snapshot_tree: attempt.snapshot_tree, source: attempt.source,
    authenticated_evidence_sha256: attempt.authenticated_evidence_sha256 ?? null,
    route_identity: attempt.closure_manifest?.route_identity ?? null,
    policy_snapshot_hash: attempt.policy_snapshot_hash ?? null,
    provider_outputs,
  };
}

async function existingImportFixture() {
  const fixture = makeTask();
  const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "public import" } };
  const recorded = await recordSimpleReviewRequest({
    task: fixture.task, kernel: fixture.kernel, request,
    resolveRouteIdentity: fixtureRouteIdentity,
    runRound: async (value) => resultFor(value),
  });
  const canonical = JSON.parse(fixture.task.readRecord(recorded.result_ref));
  const provenance = importProvenance(fixture.task, recorded.attempt_ref, recorded.result_ref, recorded.report_ref);
  return { ...fixture, recorded, canonical, provenance };
}

describe("public review result entrypoint", () => {
  it("builds a phase review bundle from the authenticated current source", () => {
    const fixture = makeTask();
    const attachmentRoot = join(fixture.root, "review-data");
    const bundleRoot = join(attachmentRoot, "bundle");
    mkdirSync(bundleRoot, { recursive: true });
    const calls = [];
    let sourceDisposed = false;
    const request = {
      stage: "build-code",
      subject_kind: "phase",
      phase_id: "P1-S3",
      review_scope: "phase",
      materials: {
        approved_spec: "spec",
        acceptance_criteria: "criteria",
        test_evidence: { receipt_ref: "quality/tests/current.json", receipt_hash: "a".repeat(64) },
        review_instructions: "instructions",
      },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle({ task: fixture.task, workspace: fixture.candidateWorkspace }, request, {
      loadConfig: () => ({ attachmentRoot }),
      captureSource: (input) => {
        calls.push({ type: "source", input });
        return { dispose: () => { sourceDisposed = true; } };
      },
      buildMaterials: (input) => {
        calls.push({ type: "materials", input });
        return { bundleRoot, materialId: "b".repeat(64) };
      },
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ type: "source", input: { includeDiff: true, taskId: fixture.task.identity.taskId } });
    expect(calls[1]).toMatchObject({ type: "materials", input: { phaseId: "P1-S3", reviewScope: "phase", materials: request.materials } });
    expect(sourceDisposed).toBe(true);
    expect(bundle.materialId).toBe("b".repeat(64));
    bundle.dispose();
  });

  it("keeps the integration compatibility export usable with review_kind", () => {
    const fixture = makeTask();
    const attachmentRoot = join(fixture.root, "review-data");
    const bundleRoot = join(attachmentRoot, "bundle");
    mkdirSync(bundleRoot, { recursive: true });
    const request = {
      stage: "build-code",
      subject_kind: "worktree",
      phase_id: null,
      review_scope: "integration",
      review_kind: "mini_task.design",
      materials: { implementation: "integration source" },
    };
    const bundle = prepareTaskBoundIntegrationReviewBundle({ task: fixture.task, workspace: fixture.candidateWorkspace }, request, {
      loadConfig: () => ({ attachmentRoot }),
      captureSource: () => ({ dispose() {} }),
      buildMaterials: (input) => {
        expect(input.reviewScope).toBe("integration");
        expect(input.reviewKind).toBe("mini_task.design");
        return { bundleRoot, materialId: "c".repeat(64) };
      },
    });
    expect(bundle.materialId).toBe("c".repeat(64));
    bundle.dispose();
  });

  it("imports an existing immutable chain without dispatching or writing a second attempt", async () => {
    const { task, kernel, recorded, canonical, provenance } = await existingImportFixture();
    const beforeAttempts = task.listCanonicalReviewAttemptRefs();
    const beforeResults = task.listCanonicalReviewResultRefs();
    const imported = importCanonicalReviewResult({ task, kernel, result: canonical, provenance });
    expect(imported).toMatchObject({
      status: "recorded", imported: true, authoritative: true, reused: true,
      attempt_ref: recorded.attempt_ref, result_ref: recorded.result_ref, report_ref: recorded.report_ref,
    });
    expect(task.listCanonicalReviewAttemptRefs()).toEqual(beforeAttempts);
    expect(task.listCanonicalReviewResultRefs()).toEqual(beforeResults);
  });

  it.each([
    ["attempt_ref", (value) => { value.attempt_ref = "missing"; }],
    ["attempt_sha256", (value) => { value.attempt_sha256 = "0".repeat(64); }],
    ["request_key", (value) => { value.request_key = "0".repeat(64); }],
    ["material_revision", (value) => { value.material_revision = "revision-" + "0".repeat(64); }],
    ["base_tree", (value) => { value.base_tree = "0".repeat(40); }],
    ["candidate_tree", (value) => { value.candidate_tree = "0".repeat(40); }],
    ["source", (value) => { value.source = { ...value.source, captured_head: "0".repeat(40) }; }],
    ["authenticated_evidence_sha256", (value) => { value.authenticated_evidence_sha256 = "0".repeat(64); }],
    ["route_identity", (value) => { value.route_identity = "0".repeat(64); }],
    ["policy_snapshot_hash", (value) => { value.policy_snapshot_hash = "0".repeat(64); }],
    ["provider_identity", (value) => { value.provider_outputs[0].identity = { ...value.provider_outputs[0].identity, source_id: "forged/source" }; }],
    ["provider_output_hash", (value) => { value.provider_outputs[0].output_sha256 = "0".repeat(64); }],
    ["provider_raw_output_ref", (value) => { value.provider_outputs[0].raw_output_ref = { version: "broker-output-ref.v1" }; }],
    ["provider_raw_output_hash", (value) => { value.provider_outputs[0].raw_output_sha256 = "0".repeat(64); }],
    ["report_hash", (value) => { value.report_sha256 = "0".repeat(64); }],
  ])("keeps a result-only import non-authoritative when %s is not authenticated", async (_label, mutate) => {
    const { task, kernel, canonical, provenance } = await existingImportFixture();
    const tampered = structuredClone(provenance);
    mutate(tampered);
    const imported = importCanonicalReviewResult({ task, kernel, result: canonical, provenance: tampered });
    expect(imported).toMatchObject({ status: "unavailable", imported: false, authoritative: false, attempt_ref: null, result_ref: null, report_ref: null });
  });

  it("does not accept a result-only import without an existing result reference", async () => {
    const { task, kernel, canonical, provenance } = await existingImportFixture();
    delete provenance.result_ref;
    const imported = importCanonicalReviewResult({ task, kernel, result: canonical, provenance });
    expect(imported.authoritative).toBe(false);
    expect(imported.reason.code).toBe("REVIEW_IMPORT_UNAUTHENTICATED");
    expect(task.listCanonicalReviewResultRefs()).toHaveLength(1);
  });

  it("routes public review record imports through the authenticated task runtime", async () => {
    const { root, task, kernel, candidateWorkspace, recorded, canonical, provenance } = await existingImportFixture();
    const home = join(root, "home");
    mkdirSync(home, { recursive: true });
    const inputPath = join(root, "review-import.json");
    writeFileSync(inputPath, JSON.stringify({ result: canonical, provenance }), "utf8");
    const previousHome = process.env.HOME;
    const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
    process.env.HOME = home;
    process.env.WORKFLOWHUB_TASK_DIR = root;
    try {
      const imported = await stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${task.identity.taskId}`, `--input=${inputPath}`,
      ], { cwd: candidateWorkspace.worktreeRoot });
      expect(imported).toMatchObject({ status: "recorded", imported: true, authoritative: true, reused: true,
        attempt_ref: recorded.attempt_ref, result_ref: recorded.result_ref, report_ref: recorded.report_ref });
      expect(task.listCanonicalReviewAttemptRefs()).toHaveLength(1);
      expect(task.listCanonicalReviewResultRefs()).toHaveLength(1);
      expect(kernel.currentVNextSnapshot().tree).toBe(provenance.snapshot_tree);
    } finally {
      if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
      if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
    }
  });
});
