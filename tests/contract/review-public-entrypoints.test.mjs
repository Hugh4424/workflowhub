import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, prepareTaskBoundIntegrationReviewBundle, stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import {
  importCanonicalReviewResult,
  recordSimpleReviewRequest,
  recordSimpleReviewResult,
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

function resultFor(request) {
  return {
    status: "available", stage: request.stage, review_track: null, review_kind: null,
    material_id: createSimpleReviewPacket(request).material_id, runtime_id: "runtime-public-import",
    outcome: "completed",
    ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
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
  it.each([
    ["build-code", "code_review", {}],
    ["build-code", "review_scope", "phase"],
    ["build-code", "phase_id", "P1"],
    ["verify-code", "code_review", {}],
  ])("rejects %s run input field %s before publication", async (stage, field, value) => {
    const state = makeTask();
    ArtifactDir.open(state.candidateWorkspace.worktreeRoot, state.task)
      .writeAtomic("decision-log.md", "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
    const inputPath = join(state.root, "run-input.json");
    writeFileSync(inputPath, JSON.stringify({ [field]: value }), "utf8");

    await withRuntimeEnvironment(state, async () => {
      await expect(stageRuntimeMain([
        "run", "--action=execute", `--stage=${stage}`, "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
      ], { cwd: state.candidateWorkspace.worktreeRoot })).rejects.toThrow(`run input has unknown fields: ${field}`);
    });
    expect(existsSync(join(state.task.taskPath, "facts.jsonl"))).toBe(false);
  });

  it.each([
    ["phase", { review_scope: "phase", phase_id: "P2" }, "phase_review", "phase", "P2"],
    ["integration", { review_scope: "integration" }, "integration_review", "worktree", null],
  ])("run preserves OCR %s provenance without an integration completion fact", async (_label, scope, subject, subjectKind, phaseId) => {
    const state = makeTask();
    ArtifactDir.open(state.candidateWorkspace.worktreeRoot, state.task)
      .writeAtomic("decision-log.md", "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
    const inputPath = join(state.root, "build-code-run.json");
    const request = {
      stage: "build-code", host_provider: "codex/luna", materials: { implementation: "current diff" },
      review_scope: scope.review_scope, subject_kind: subjectKind, phase_id: phaseId,
    };
    const recorded = await recordSimpleReviewRequest({
      task: state.task, kernel: state.kernel, request,
      resolveRouteIdentity: fixtureRouteIdentity,
      runRound: async (value) => ({ ...resultFor(value),
        subject_kind: subjectKind, phase_id: phaseId, review_scope: scope.review_scope }),
    });
    writeFileSync(inputPath, JSON.stringify({ receipts: { review: recorded.result_ref } }), "utf8");
    const args = ["run", "--stage=build-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`, `--input=${inputPath}`];

    await withRuntimeEnvironment(state, async () => {
      const run = await stageRuntimeMain(args, { cwd: state.candidateWorkspace.worktreeRoot });
      const facts = run.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
      const reviewFact = facts.find((fact) => fact.kind === "review" && fact.subject === subject);

      if (subject === "phase_review") {
        expect(reviewFact).toMatchObject({ status: "recorded", review_status: "clean" });
        expect(reviewFact.evidence.find((item) => item.evidence_type === "review_result").ref)
          .toBe(recorded.result_ref);
      } else {
        expect(reviewFact).toBeUndefined();
      }
      expect(facts.find((fact) => fact.kind === "review" && fact.subject === "integration_review"))
        .toBeUndefined();
      const status = await stageRuntimeMain([
        "status", "--stage=build-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`,
      ], { cwd: state.candidateWorkspace.worktreeRoot });
      expect(status.quality_predicates).not.toHaveProperty("integration_review");
      expect(status.quality_missing).not.toContain("integration_review");

      const review = JSON.parse(state.task.readRecord(recorded.result_ref));
      expect(review).toMatchObject({
        task_id: state.task.identity.taskId,
        stage: "build-code",
        attempt_ref: recorded.attempt_ref,
        subject_kind: subjectKind,
        phase_id: phaseId,
        review_scope: scope.review_scope,
        findings: [],
        provider_results: [{ provider: "codex/luna" }],
      });
      const attempt = JSON.parse(state.task.readRecord(review.attempt_ref));
      expect(attempt.provider_attempts).toMatchObject([
        { provider: "codex/luna", identity: { source_id: "codex/luna" } },
      ]);
    });
  });

  it("ORACLE-P5-UNAVAILABLE: official run consumes its own blocked-before-dispatch history failure", async () => {
    const { task, kernel, candidateWorkspace } = makeTask();
    const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
    const recorded = recordSimpleReviewResult({
      task, kernel,
      result: {
        ...resultFor({ stage: "build-spec", materials: { draft_spec: "fixture" } }),
        status: "unavailable", outcome: "unavailable", dispatch_state: "blocked_before_dispatch",
        provider_results: [], findings: [],
        error: { code: "REVIEW_HISTORY_UNAVAILABLE", message: "prior pair binding is invalid" },
      },
    });
    const original = JSON.parse(task.readRecord(recorded.attempt_ref));
    expect(original).toMatchObject({
      terminal_status: "unavailable", dispatch_state: "blocked_before_dispatch",
      provider_attempts: [], error: { code: "REVIEW_HISTORY_UNAVAILABLE" },
    });
    const official = await runOfficialStage("build-spec", {
      stage: "build-spec", task, kernel, identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"),
      manifest: task.manifest, workspace: candidateWorkspace, artifacts,
    }, { receipts: { review: recorded.attempt_ref } });
    expect(official.quality_advisories).toContain("independent_review:unavailable");
    const reviewFacts = official.quality_fact_refs.map((ref) => JSON.parse(task.readRecord(ref)))
      .filter((fact) => fact.kind === "review");
    expect(reviewFacts).toContainEqual(expect.objectContaining({
      kind: "review",
      status: "unavailable",
      evidence: expect.arrayContaining([expect.objectContaining({ ref: recorded.attempt_ref })]),
    }));
    expect(reviewFacts).not.toContainEqual(expect.objectContaining({ status: "passed" }));
  });

  it("consumes sent-unparsed zero-provider executor outcomes by transport state", async () => {
    const fixture = makeTask();
    const artifacts = ArtifactDir.open(fixture.candidateWorkspace.worktreeRoot, fixture.task);
    const recorded = recordSimpleReviewResult({
      task: fixture.task,
      kernel: fixture.kernel,
      result: {
        ...resultFor({ stage: "build-spec", materials: { draft_spec: "fixture" } }),
        status: "unavailable",
        outcome: "unavailable",
        dispatch_state: "sent_unparsed",
        provider_results: [],
        findings: [],
        error: { code: "OCR_EXECUTOR_CANCEL_UNCONFIRMED", message: "executor termination was not confirmed" },
      },
    });

    const official = await runOfficialStage("build-spec", {
      stage: "build-spec", task: fixture.task, kernel: fixture.kernel, identity: fixture.task.identity,
      workflowRunId: fixture.kernel.deriveStageWorkflowRunId("build-spec"),
      manifest: fixture.task.manifest, workspace: fixture.candidateWorkspace, artifacts,
    }, { receipts: { review: recorded.attempt_ref } });

    expect(official.quality_advisories).toContain("independent_review:unavailable");
    const reviewFacts = official.quality_fact_refs.map((ref) => JSON.parse(fixture.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review");
    expect(reviewFacts).toContainEqual(expect.objectContaining({
      kind: "review",
      status: "unavailable",
      evidence: expect.arrayContaining([expect.objectContaining({ ref: recorded.attempt_ref })]),
    }));
    expect(reviewFacts).not.toContainEqual(expect.objectContaining({ status: "passed" }));
    expect(JSON.parse(fixture.task.readRecord(recorded.attempt_ref))).toMatchObject({
      terminal_status: "unavailable",
      dispatch_state: "sent_unparsed",
      provider_attempts: [],
      error: { code: "OCR_EXECUTOR_CANCEL_UNCONFIRMED" },
    });
  });

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
    expect(calls[1]).toMatchObject({
      type: "materials",
      input: {
        phaseId: "P1-S3",
        reviewScope: "phase",
        materials: {
          ...request.materials,
          // The task-bound provider packet must replace a caller-controlled
          // instruction string with the runner's fixed scope instruction.
          review_instructions: expect.stringMatching(/build-code|phase/i),
        },
      },
    });
    expect(calls[1].input.materials.review_instructions).not.toBe(request.materials.review_instructions);
    expect(sourceDisposed).toBe(true);
    expect(bundle.materialId).toBe("b".repeat(64));
    bundle.dispose();
  });

  it("builds the verify-code OCR packet with the real diff and complete AC text", () => {
    const fixture = makeTask();
    writeFileSync(join(fixture.candidateWorkspace.worktreeRoot, "README.md"), "current implementation for AC-1\n");
    const attachmentRoot = join(fixture.root, "review-data");
    mkdirSync(attachmentRoot);
    const acceptance = "AC-1: The current implementation must preserve this complete criterion and its failure path.";
    const bundle = prepareTaskBoundBuildCodeReviewBundle({ task: fixture.task, workspace: openCurrentTaskWorkspace(fixture.task) }, {
      stage: "verify-code", subject_kind: "worktree", materials: {
        changed_files: "README.md",
        implementation_assessment: "Inspect the current implementation.",
        test_context: "The focused check is pending.",
        open_risks: "No known risk has been accepted.",
        acceptance_criteria: acceptance,
      },
    }, { loadConfig: () => ({ attachmentRoot }) });
    try {
      const paths = bundle.manifest.map((entry) => entry.path);
      expect(paths).toContain("changes.diff");
      expect(paths).toContain("requirements/acceptance_criteria.md");
      expect(readFileSync(join(bundle.bundleRoot, "changes.diff"), "utf8")).toContain("current implementation for AC-1");
      expect(readFileSync(join(bundle.bundleRoot, "requirements/acceptance_criteria.md"), "utf8")).toBe(acceptance);
      expect(readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8")).toContain("Do not invoke Agent, subagent");
      expect(paths.some((path) => path.startsWith("contracts/") || path.startsWith("skills/") || path === "packet-plan.json")).toBe(false);
      expect(readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8")).not.toMatch(/wh-review|broker/i);
    } finally {
      bundle.dispose();
    }
  });

  it.each([
    ["phase", { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P2" }],
    ["integration", { stage: "build-code", review_scope: "integration", subject_kind: "worktree", phase_id: null }],
    ["verify", { stage: "verify-code", subject_kind: "worktree" }],
  ])("projects the %s OCR control packet without legacy review instructions", (_label, identity) => {
    const fixture = makeTask();
    const attachmentRoot = join(fixture.root, "review-data");
    mkdirSync(attachmentRoot);
    const bundle = prepareTaskBoundBuildCodeReviewBundle({ task: fixture.task, workspace: fixture.candidateWorkspace }, {
      ...identity, materials: { acceptance_criteria: "AC-1: preserve the complete criterion." },
    }, {
      loadConfig: () => ({ attachmentRoot }),
      captureSource: () => ({ dispose() {} }),
      buildMaterials: ({ materials, candidateExperiment }) => {
        expect(candidateExperiment).toBe(true);
        const bundleRoot = join(attachmentRoot, `legacy-${_label}`);
        mkdirSync(bundleRoot);
        const entries = [
          ["source.json", "{}"], ["changes.diff", "diff --git a/README.md b/README.md\n"],
          ["requirements/acceptance_criteria.md", "AC-1: preserve the complete criterion."],
          ["review-instructions.md", materials.review_instructions],
          ["contracts/provider-protocol.md", "old wh-review broker prompt"],
          ["skills/review/SKILL.md", "old broker reviewer skill"],
          ["packet-plan.json", "{\"legacy\":true}"],
        ];
        const manifest = entries.map(([path, contents]) => {
          const filePath = join(bundleRoot, path);
          mkdirSync(join(filePath, ".."), { recursive: true });
          writeFileSync(filePath, contents);
          return { path, bytes: Buffer.byteLength(contents), sha256: sha256(contents) };
        });
        return { bundleRoot, materialId: "b".repeat(64), manifest };
      },
    });
    try {
      const paths = bundle.manifest.map(({ path }) => path);
      expect(paths).toContain("changes.diff");
      expect(paths).toContain("requirements/acceptance_criteria.md");
      expect(paths).not.toContain("contracts/provider-protocol.md");
      expect(paths).not.toContain("skills/review/SKILL.md");
      expect(paths).not.toContain("packet-plan.json");
      const instructions = readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8");
      expect(instructions).toContain("full acceptance-criteria text");
      expect(instructions).toContain("independent LLM judgment");
      expect(instructions).toContain("findings array");
      expect(instructions).toContain("positive integer line");
      expect(instructions).toContain("blocking|major|minor");
      expect(instructions).toContain("root_cause");
      expect(instructions).toContain("evidence_kind (direct|inferred|machine)");
      expect(instructions).toContain("evidence containing a verbatim source excerpt in backticks");
      expect(instructions).toContain("cited line or the next two lines");
      expect(instructions).not.toMatch(/wh-review|broker/i);
    } finally {
      bundle.dispose();
    }
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

  it("prepares a complete task-bound provider bundle above 486777B without a local delivery cap", () => {
    const fixture = makeTask();
    const attachmentRoot = join(fixture.root, "review-data");
    const spec = "x".repeat(486778);
    let sourceDisposed = false;
    const bundle = prepareTaskBoundBuildCodeReviewBundle({ task: fixture.task, workspace: fixture.candidateWorkspace }, {
      stage: "build-code",
      host_provider: "codex/luna",
      review_scope: "integration",
      review_kind: "mini_task.design",
      materials: {
        raw_requirement: "原始需求",
        decision_log: "## 原始需求\n\n原始需求\n\n## 决定\n\n采用完整输入。\n",
        spec,
        plan: "# Plan\n",
        tasks: "# Tasks\n",
      },
    }, {
      loadConfig: () => ({ attachmentRoot }),
      captureSource: () => ({
        targetCommit: "1".repeat(40), baseCommit: "2".repeat(40), baseTree: "3".repeat(40),
        capturedHead: "4".repeat(40), snapshotTree: "5".repeat(40), changedFiles: [],
        diffBytes: 0, diffSha256: "6".repeat(64), copyDiffTo: () => ({ bytes: 0, sha256: "6".repeat(64) }),
        dispose() { sourceDisposed = true; },
      }),
    });
    const entry = bundle.deliveryManifest.find(({ path }) => path === "requirements/spec.md");
    expect(entry).toMatchObject({ bytes: Buffer.byteLength(spec), sha256: sha256(spec) });
    expect(bundle.packetPlan.delivery_bytes).toBe(bundle.deliveryManifest.reduce((total, item) => total + item.bytes, 0));
    expect(bundle.packetPlan.delivery_bytes).toBeGreaterThan(486777);
    expect(sourceDisposed).toBe(true);
    bundle.dispose();
    expect(existsSync(bundle.bundleRoot)).toBe(false);
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
