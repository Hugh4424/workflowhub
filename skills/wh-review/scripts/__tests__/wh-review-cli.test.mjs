import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTask, createTaskKernel } from "../../../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../../../core/artifact-dir.mjs";
import { reviewInstructionsFor } from "../review-materials.mjs";
import { writeCanonicalStageMaterials, writeStageOutcomeFixture } from "../../../../tests/helpers/stage-outcome.mjs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const roots = [];
const reviewTree = "a".repeat(40);
const reviewMaterialId = "b".repeat(64);
const reviewMaterialRevision = `revision-${"d".repeat(64)}`;
const reviewSource = {
  target_commit: reviewTree,
  base_commit: reviewTree,
  base_tree: reviewTree,
  captured_head: reviewTree,
};
const reviewResultRecord = {
  version: "wh-review-result.v1", task_id: "task", stage: "verify-code", review_track: null, review_kind: null,
  subject_kind: "worktree", phase_id: null, review_scope: null, source: reviewSource,
  snapshot_tree: reviewTree, material_id: reviewMaterialId, material_revision: reviewMaterialRevision,
  attempt_ref: "quality/reviews/attempts/one/attempt.json",
  provider_results: [{ provider: "codex", output: { findings: [] } }], findings: [],
  adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
};
const reviewAttemptRecord = {
  version: "wh-review-attempt.v1", attempt_id: "one", task_id: "task", stage: "verify-code", review_track: null, review_kind: null,
  subject_kind: "worktree", phase_id: null, review_scope: null, source: reviewSource,
  snapshot_tree: reviewTree, material_id: reviewMaterialId, material_revision: reviewMaterialRevision, provider_attempts: [],
  terminal_status: "unavailable", error: { code: "AUTH", message: "provider unavailable" },
};
const reviewSemanticAttemptRecord = { ...reviewAttemptRecord, terminal_status: "semantic", error: null };
function git(cwd, args) { return String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim(); }
let previousSinkRoot;
beforeEach(() => {
  previousSinkRoot = process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
  const sinkRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-test-sink-")));
  roots.push(sinkRoot);
  process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = sinkRoot;
});
afterEach(() => {
  if (previousSinkRoot === undefined) delete process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
  else process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = previousSinkRoot;
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("wh-review production CLI", () => {
  it("records current unavailable evidence when the build-code outcome is missing", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-no-execution-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    git(repo, ["init", "-q"]); git(repo, ["config", "user.name", "Test"]); git(repo, ["config", "user.email", "test@example.com"]);
    writeFileSync(join(repo, "README.md"), "base\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "base"]);
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "missing-execution", created_at: "2026-08-30T00:00:00Z",
      target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    } });
    const workspace = prepareTaskWorkspace(task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    for (const [name, value] of [["decision-log.md", "# D\n"], ["spec.md", "# S\n"], ["plan.md", "# P\n"], ["tasks.md", "# T\n"]]) artifacts.writeAtomic(name, value);
    const kernel = createTaskKernel(task, { candidateWorkspace: workspace });
    const { runTaskBoundE2eReview } = await import(cli.href);
    const result = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
    });
    expect(result).toMatchObject({ status: "unavailable", review_fact_intent: { status: "unavailable" }, error: { message: "verify-code E2E review requires one current completed build-code outcome" } });
  });

  it("rejects a content-addressed but semantically incomplete build-code outcome", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-forged-outcome-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    git(repo, ["init", "-q"]); git(repo, ["config", "user.name", "Test"]); git(repo, ["config", "user.email", "test@example.com"]);
    writeFileSync(join(repo, "README.md"), "base\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "base"]);
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "forged-outcome", created_at: "2026-08-30T00:00:00Z",
      target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    } });
    const workspace = prepareTaskWorkspace(task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    for (const [name, value] of [["decision-log.md", "# D\n"], ["spec.md", "# S\n"], ["plan.md", "# P\n"], ["tasks.md", "# T\n"]]) artifacts.writeAtomic(name, value);
    const kernel = createTaskKernel(task, { candidateWorkspace: workspace });
    const snapshot = kernel.currentVNextSnapshot();
    const materialRevision = kernel.currentVNextMaterialRevision();
    const forged = {
      schema_version: "workflowhub-stage-outcomes.v1", task_id: task.identity.taskId, stage: "build-code", status: "completed",
      attempt_id: "forged-1", snapshot_tree: snapshot.tree, material_revision: materialRevision,
      producer: { kind: "stage-agent", host: "host-machine", source_id: "fixture/executor", source_family: "fixture", agent_run_id: "forged-1" },
      step_outcomes: [], skill_outcomes: [],
    };
    const raw = `${JSON.stringify(forged)}\n`;
    const hash = createHash("sha256").update(raw).digest("hex");
    kernel.publishCanonicalRecord(`quality/evidence/stage-outcomes/build-code/${hash}.json`, raw);
    const { runTaskBoundE2eReview } = await import(cli.href);
    const result = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
    });
    expect(result).toMatchObject({ status: "unavailable", error: { message: "verify-code E2E review requires one current completed build-code outcome" } });
  });

  it("uses an explicit one-profile route, freezes implementation evidence, and reuses the current E2E review", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-e2e-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    git(repo, ["init", "-q"]); git(repo, ["config", "user.name", "Test"]); git(repo, ["config", "user.email", "test@example.com"]);
    writeFileSync(join(repo, "README.md"), "base\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "base"]);
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "e2e-review", created_at: "2026-08-30T00:00:00Z",
      target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    } });
    const workspace = prepareTaskWorkspace(task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    writeCanonicalStageMaterials(artifacts);
    const kernel = createTaskKernel(task, { candidateWorkspace: workspace });
    const snapshot = kernel.currentVNextSnapshot();
    const materialRevision = kernel.currentVNextMaterialRevision();
    const outcome = writeStageOutcomeFixture({ task, kernel, artifacts, workspace, stage: "build-code", attemptId: "build-1", workflowRunId: kernel.deriveStageWorkflowRunId("build-code") });
    const outcomeRaw = `${JSON.stringify(outcome.value, null, 2)}\n`;
    const outcomeHash = outcome.sha256;
    const testOutput = "focused test passed\n";
    const testOutputRef = "quality/tests/output/build-code-e2e";
    kernel.publishCanonicalRecord(testOutputRef, testOutput);
    const testReceipt = {
      schema_version: "workflowhub-receipt.v1", task_id: task.identity.taskId, stage: "build-code",
      producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
      command: "true", command_hash: createHash("sha256").update("true").digest("hex"), exit_code: 0,
      output_ref: testOutputRef, output_hash: createHash("sha256").update(testOutput).digest("hex"), snapshot_tree: snapshot.tree,
    };
    kernel.publishCanonicalRecord("quality/tests/build-code-e2e.json", `${JSON.stringify(testReceipt)}\n`);
    const screenshotBytes = Buffer.from("PNG-BYTES");
    const screenshotContentHash = createHash("sha256").update(screenshotBytes).digest("hex");
    const screenshotRef = `quality/evidence/browser-qa/${screenshotContentHash}.json`;
    const screenshotPublicationRaw = `${JSON.stringify({ schema_version: "workflowhub-evidence-publication.v1", source_path: "dogfood.png", content_sha256: screenshotContentHash,
      content_encoding: "base64", content_base64: screenshotBytes.toString("base64"), publisher: "build-code", recorded_at: "2026-08-30T00:00:00.000Z" })}\n`;
    const screenshotHash = createHash("sha256").update(screenshotPublicationRaw).digest("hex");
    kernel.publishCanonicalRecord(screenshotRef, screenshotPublicationRaw);
    const browserRaw = `${JSON.stringify({
      applicability: "ui", result: "pass", task_id: task.identity.taskId, stage: "build-code", attempt_id: "build-1",
      invocation_id: "acceptance-browser-1", material_revision: materialRevision, snapshot_tree: snapshot.tree,
      acceptance_criterion_id: "AC-001", acceptance_scenario: { source: "demo/source", sample: "demo/sample", scenario: "demo/scenario", tier: "browser" },
      route: "/dogfood", page: "Dogfood", scenario: "demo scenario", tool: "isolated-browser-qa", engine: "agent-browser", session: "acceptance-fixture",
      state: { name: "ready" }, viewport: { name: "desktop", width: 1440, height: 900 }, fixture: { name: "real-page", fixture_only: false },
      component: { name: "Dogfood", path: "src/Dogfood.tsx" }, design_revision: "Design.md@v1",
      design_identity: { document_kind: "design", path: "Design.md", content_sha256: "a".repeat(64), revision: "design-v1", anchor_id: "dogfood", anchor_title: "Dogfood", anchor_source: "explicit" },
      experience_identity: { document_kind: "experience", path: "Experience.md", content_sha256: "b".repeat(64), revision: "experience-v1", anchor_id: "dogfood", anchor_title: "Dogfood", anchor_source: "explicit" },
      service_identity: { name: "dogfood-web", revision: "service-v1" }, api_identity: { name: "dogfood-api", revision: "api-v1" }, dto_identity: { name: "DogfoodDto", revision: "dto-v1" },
      browser_profile: { name: "isolated", revision: "profile-v1" }, environment_identity: { kind: "local", name: "dogfood-web", revision: "service-v1", endpoint: "http://127.0.0.1:4173", runtime_id: "dogfood-runtime-1" },
      data_identity: { kind: "seeded", name: "demo-data", revision: "data-v1", source: "demo/source", dataset_id: "demo/sample", fixture_only: false },
      cancellation: { status: "not_cancelled" },
      observations: { console: { status: "clean" }, network: { status: "clean" }, focus: { status: "checked" }, overflow: { status: "none" } },
      visual: { status: "observed", screenshot_refs: [screenshotRef] }, a11y: { status: "not_checked", reason: "fixture" }, auth: { mode: "none", login_state_reused: false },
      performance: { status: "not_measured", reason: "fixture" }, screenshots: [{ ref: screenshotRef, hash: screenshotHash }],
      test: { command: "true", file: "dogfood.test.mjs", output_ref: testOutputRef, output_hash: createHash("sha256").update(testOutput).digest("hex"), exit_code: 0 },
      cleanup: { status: "completed", app_service_running: true }, engine_switch: "no",
    })}\n`;
    const browserHash = createHash("sha256").update(browserRaw).digest("hex");
    const browserRef = `quality/evidence/browser-qa/${browserHash}.json`;
    kernel.publishCanonicalRecord(browserRef, browserRaw);
    const stageEvidenceRaw = `${JSON.stringify({
      schema_version: "stage-quality-evidence.v1", task_id: task.identity.taskId, stage: "build-code", subject: "acceptance_execution", status: "passed",
      material_revision: materialRevision, snapshot_tree: snapshot.tree,
      subject_fact: { status: "passed", execution_binding: { stage_outcome_ref: outcome.ref, stage_outcome_hash: outcomeHash }, execution_items: [{
        task_id: "T002", source: "demo/source", sample: "demo/sample", scenario: "demo/scenario", tier: "browser", status: "executed",
        evidence_refs: [{ ref: browserRef, sha256: browserHash }],
      }] },
    })}\n`;
    const stageEvidenceHash = createHash("sha256").update(stageEvidenceRaw).digest("hex");
    const stageEvidenceRef = `quality/evidence/stage-quality/build-code/acceptance_execution-${stageEvidenceHash}.json`;
    kernel.publishCanonicalRecord(stageEvidenceRef, stageEvidenceRaw);
    const acceptanceValue = { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "acceptance_execution", result: "pass",
      refs: [{ ref: stageEvidenceRef, sha256: stageEvidenceHash }], snapshot_tree: snapshot.tree,
      summary: { actual_outcome: "passed", evidence_type: "stage quality fact" }, freshness: { status: "current", evaluated_at: "2026-08-30T00:00:00.000Z", snapshot_tree: snapshot.tree,
        material_revision: materialRevision, evidence_freshness: [{ ref: stageEvidenceRef, sha256: stageEvidenceHash, status: "current" }] } };
    const acceptanceRaw = `${JSON.stringify(acceptanceValue)}\n`;
    const acceptanceHash = createHash("sha256").update(acceptanceRaw).digest("hex");
    const acceptanceRef = `quality/evidence/acceptance/build-code/acceptance_execution-${acceptanceHash}.json`;
    kernel.publishCanonicalRecord(acceptanceRef, acceptanceRaw);
    kernel.publishVNextQualityFact("build-code", { kind: "acceptance_criterion", status: "passed", subject: "acceptance_execution",
      evidence: [{ ref: acceptanceRef, sha256: acceptanceHash, evidence_type: "acceptance_evidence" }] });
    const attachmentRoot = join(root, "attachments"); mkdirSync(attachmentRoot);
    const brokerConfig = join(root, "3rd-review.json");
    writeFileSync(brokerConfig, JSON.stringify({
      version: 4,
      tiers: [],
      providers: {
        "kimi/coding": { enabled: true, source_id: "kimi/coding" },
        "kimi/k3": { enabled: true, source_id: "kimi/k3" },
        "opencode/v4flash": { enabled: true, source_id: "opencode/v4flash" },
        "codex/luna": { enabled: true, source_id: "codex/luna" },
      },
    }));
    const opencodeConfigId = createHash("sha256").update(JSON.stringify({ id: "opencode/v4flash", source_id: "opencode/v4flash", model: null, effort: null, thinking: null, deadline_ms: null }), "utf8").digest("hex");
    const { runTaskBoundE2eReview } = await import(cli.href);

    let unavailableDispatches = 0;
    const firstUnavailable = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
      loadConfig: () => ({ whReview: {}, config: brokerConfig, attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ mode: "single_round", initial: ["codex/luna"], minimum_heterologous: 1 }),
      client: { async runGroup() {
        unavailableDispatches += 1;
        throw new Error("provider transport unavailable");
      } },
    });
    expect(firstUnavailable).toMatchObject({ status: "unavailable", error: { message: "provider transport unavailable" } });
    expect(firstUnavailable.reused).toBeUndefined();
    const reusedUnavailable = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
      loadConfig: () => ({ whReview: {}, config: brokerConfig, attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ mode: "single_round", initial: ["codex/luna"], minimum_heterologous: 1 }),
      client: { async runGroup() { throw new Error("same unavailable input must be reused"); } },
    });
    expect(reusedUnavailable).toMatchObject({ status: "unavailable", reused: true, attemptRef: firstUnavailable.attemptRef, resultRef: null });
    expect(unavailableDispatches).toBe(1);

    const seen = [];
    const runConcurrent = () => runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
      loadConfig: () => ({ whReview: {}, config: brokerConfig, attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({
        mode: "single_round",
        initial: ["opencode/v4flash"],
        minimum_heterologous: 1,
      }),
      client: { async runGroup(request) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        const materialFiles = readdirSync(join(request.materials.bundleRoot, "materials"));
        const readMaterial = (suffix) => readFileSync(join(request.materials.bundleRoot, "materials", materialFiles.find((name) => name.endsWith(suffix))), "utf8");
        seen.push({
          providers: request.providers, strict: request.strictProtocol, materialId: request.materials.materialId,
          decision: readMaterial("decision-log.md.md"), outcome: readMaterial("build-code-outcome.json.md"),
          diff: readMaterial("implementation-diff.patch.md"), tests: readMaterial("test-1-receipt.json.md"), testOutput: readMaterial("test-1-output.txt.md"),
          browser: readMaterial("browser-evidence-1.json.md"),
          screenshot: readMaterial("browser-1-screenshot-1.bin.md"), browserTestOutput: readMaterial("browser-1-test-output.txt.md"),
          binding: JSON.parse(readMaterial("review-subject-binding.json.json")),
        });
        return { runtimeId: "review-runtime", outcome: "completed", providers: [{
          provider: "opencode/v4flash", status: "completed", error: null, identity: { provider: "opencode/v4flash", adapter: "opencode", source_id: "opencode/v4flash", config_id: opencodeConfigId, model: "model" },
          output: JSON.stringify({ findings: [] }), timing: null, usage: null,
        }] };
      } },
    });
    const [firstConcurrent, secondConcurrent] = await Promise.all([runConcurrent(), runConcurrent()]);
    const result = firstConcurrent.reused === true ? secondConcurrent : firstConcurrent;
    expect([firstConcurrent, secondConcurrent].filter((entry) => entry.status === "available")).toHaveLength(2);
    expect([firstConcurrent, secondConcurrent].filter((entry) => entry.reused === true)).toHaveLength(1);
    expect(seen).toHaveLength(1);
    expect(seen[0].providers).toEqual(["opencode/v4flash"]);
    expect(seen[0].strict).toBe(true);
    expect(seen[0].materialId).toEqual(expect.any(String));
    expect(seen[0].decision).toContain("# Decision log");
    expect(seen[0].outcome).toContain('"attempt_id": "build-1"');
    expect(seen[0].diff).toContain("diff --git");
    expect(seen[0].tests).toContain(testOutputRef);
    expect(seen[0].testOutput).toContain("focused test passed");
    expect(seen[0].browser).toContain('"page":"Dogfood"');
    expect(seen[0].screenshot).toContain(screenshotContentHash);
    expect(seen[0].browserTestOutput).toContain("focused test passed");
    expect(seen[0].binding).toMatchObject({ execution_ref: `quality/evidence/stage-outcomes/build-code/${outcomeHash}.json`, executor_actor: { source_id: "fixture/executor", source_kind: "stage-agent", run_id: "build-1" } });
    expect(result).toMatchObject({ status: "available", review_fact_intent: { status: "recorded", subject: "independent_review" } });
    const stored = JSON.parse(task.readRecord(result.result_ref));
    expect(stored.e2e_binding).toMatchObject({
      reviewer_actor: { source_id: "opencode/v4flash" },
      reviewed_execution: { ref: `quality/evidence/stage-outcomes/build-code/${outcomeHash}.json`, actor: { source_id: "fixture/executor" } },
    });
    expect(stored.review_policy).toMatchObject({
      mode: "single_round", minimum_heterologous: 1,
      broker_identity: { provider: "opencode/v4flash", source_id: "opencode/v4flash", config_id: opencodeConfigId },
      requested_profile_specs: [{ provider: "opencode/v4flash", model: null, effort: null, thinking: null, priority: 0 }],
    });

    const reused = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
      loadConfig: () => ({ whReview: {}, config: brokerConfig, attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ mode: "single_round", initial: ["opencode/v4flash"], minimum_heterologous: 1 }),
      client: { async runGroup() { throw new Error("current bound result must be reused"); } },
    });
    expect(reused).toMatchObject({ status: "available", reused: true, resultRef: result.resultRef, attemptRef: result.attemptRef });
    expect(seen).toHaveLength(1);

    const stricterPolicy = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
      loadConfig: () => ({ whReview: {}, config: brokerConfig, attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({
        mode: "single_round",
        initial: ["opencode/v4flash", "codex/luna"],
        minimum_heterologous: 1,
      }),
      client: { async runGroup() { throw new Error("provider must not be called"); } },
    });
    expect(stricterPolicy).toMatchObject({
      status: "unavailable",
      error: { message: "verify-code E2E review requires an explicit one-profile route with minimum_heterologous=1" },
    });

    const sameSourceIdentity = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
      loadConfig: () => ({ whReview: {}, config: brokerConfig, attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ mode: "single_round", initial: ["fixture/executor"], minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["fixture/executor"], provider_identities: { "fixture/executor": { source_id: "fixture/executor", config_id: "a".repeat(64) } } }),
      client: { async runGroup() { throw new Error("same source identity must not be dispatched"); } },
    });
    expect(sameSourceIdentity).toMatchObject({
      status: "unavailable",
      error: { message: "verify-code E2E review requires one configured heterologous reviewer source identity" },
    });

    const mismatchedIdentity = await runTaskBoundE2eReview({ stage: "verify-code", host_provider: "codex" }, {
      resolveTrustedSubject: () => ({ task, taskId: task.identity.taskId, kernel, workspace }),
      loadConfig: () => ({ whReview: {}, config: "/unused", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ mode: "single_round", initial: ["review/provider"], minimum_heterologous: 1 }),
      selectProviders: () => ({
        providers: ["review/provider"],
        provider_identities: { "review/provider": { source_id: "review-host", config_id: "a".repeat(64) } },
      }),
      client: { async runGroup() {
        return { runtimeId: "review-runtime-mismatch", outcome: "completed", providers: [{
          provider: "review/provider", status: "completed", error: null,
          identity: { provider: "review/provider", adapter: "review", source_id: "broker-self-report", config_id: "config", model: "model" },
          output: JSON.stringify({ findings: [] }), timing: null, usage: null,
        }] };
      } },
    });
    expect(mismatchedIdentity).toMatchObject({
      status: "unavailable",
      review_fact_intent: { status: "unavailable", subject: "independent_review" },
    });
  }, 30000);

  it("can be imported from a stdin/eval entrypoint without argv[1]", () => {
    const script = `import(${JSON.stringify(cli.href)}).then((mod) => { if (typeof mod.runReviewRound !== "function") process.exit(1); })`;
    expect(() => execFileSync(process.execPath, ["--input-type=module", "--eval", script], { encoding: "utf8" })).not.toThrow();
  });

  it("rejects a non-object request with a clear boundary error", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound(null)).rejects.toThrow("review request must be an object");
  });

  it("validates current materials before task lookup or historical review reuse", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound({
      task_path: "/missing/task",
      project_name: "Demo",
      task_id: "task",
      stage: "make-decision",
      host_provider: "codex",
    })).rejects.toThrow("materials are required");
  });

  it("exports only current review operations and no resolution writer", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(mod.providerVisibleMaterialsForRound).toBeUndefined();
    expect(mod.adoptLegacyReviewRoot).toBeUndefined();
    expect(mod.reviewFlowIdentity).toBeUndefined();
    expect(mod.resolveReviewFlowHead).toBeUndefined();
    expect(mod.reconcileMakeDecisionReviewProgress).toBeUndefined();
    expect(mod.buildNonGateReviewResponseRecord).toBeUndefined();
    expect(mod.ensureResolutionFlowHead).toBeUndefined();
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.runReviewRecovery).toBe("function");
  });

  it("binds one verify-code review result to the vNext advisory fact", async () => {
    const { publishStageReviewFact } = await import(cli.href);
    const raw = `${JSON.stringify(reviewResultRecord)}\n`;
    const attemptRaw = `${JSON.stringify(reviewSemanticAttemptRecord)}\n`;
    const published = [];
    const ref = "quality/reviews/results/one.json";
    const attemptRef = reviewResultRecord.attempt_ref;
    const factIntent = publishStageReviewFact({
      trusted: {
        task: { readRecord: (candidate) => candidate === ref ? raw : candidate === attemptRef ? attemptRaw : (() => { throw new Error("unexpected ref"); })() },
        taskId: "task",
        kernel: { currentVNextSnapshot: () => ({ tree: reviewTree }), currentVNextMaterialRevision: () => `revision-${"d".repeat(64)}`, publishVNextQualityFact: (stage, value) => { published.push({ stage, value }); return { ref: "quality/facts/verify-code/code_review-one.json" }; } },
      },
      stage: "verify-code",
      reviewKind: null,
        result: { status: "available", stage: "verify-code", review_track: null, review_kind: null, resultRef: ref, attemptRef: reviewResultRecord.attempt_ref, snapshotTree: reviewTree, materialId: reviewMaterialId, subjectKind: "worktree", phaseId: null, reviewScope: null },
    });
    expect(factIntent).toMatchObject({
      schema_version: "workflowhub-quality-fact-intent.v1",
      stage: "verify-code",
      kind: "review", status: "recorded", subject: "independent_review",
      evidence: [{ ref, sha256: expect.any(String), evidence_type: "review_result" }],
      material_id: reviewMaterialId,
      material_revision: `revision-${"d".repeat(64)}`,
    });
    expect(published).toEqual([]);
  });

  it("keeps unavailable terminal facts honest and excludes mini-task reviews", async () => {
    const { publishStageReviewFact } = await import(cli.href);
    const ref = "quality/reviews/attempts/one/attempt.json";
    const raw = `${JSON.stringify(reviewAttemptRecord)}\n`;
    const published = [];
    const trusted = {
      task: { readRecord: (candidate) => candidate === ref ? raw : (() => { throw new Error("unexpected ref"); })() },
      taskId: "task",
      kernel: {
        currentVNextSnapshot: () => ({ tree: reviewTree }),
        currentVNextMaterialRevision: () => `revision-${"d".repeat(64)}`,
        publishVNextQualityFact: (stage, value) => { published.push({ stage, value }); return { ref: "quality/facts/verify-code/unavailable.json" }; },
      },
    };
    const intent = publishStageReviewFact({ trusted, stage: "verify-code", reviewKind: null, result: {
      status: "unavailable", stage: "verify-code", review_track: null, review_kind: null, resultRef: null, attemptRef: ref, snapshotTree: reviewTree, materialId: reviewMaterialId, subjectKind: "worktree", phaseId: null, reviewScope: null,
    } });
    expect(intent).toMatchObject({ schema_version: "workflowhub-quality-fact-intent.v1", status: "unavailable" });
    expect(published).toHaveLength(0);
    expect(publishStageReviewFact({ trusted, stage: "build-code", reviewKind: "mini_task.implementation", result: {
      status: "available", resultRef: "quality/reviews/results/mini.json", attemptRef: null,
    } })).toBeNull();
    expect(published).toHaveLength(0);
  });

  it("rejects a standard fact when its attempt is unavailable or mini-task scoped", async () => {
    const { publishStageReviewFact } = await import(cli.href);
    const ref = "quality/reviews/results/one.json";
    const attemptRef = reviewResultRecord.attempt_ref;
    const resultRaw = `${JSON.stringify(reviewResultRecord)}\n`;
    const miniAttemptRaw = `${JSON.stringify({ ...reviewSemanticAttemptRecord, review_kind: "mini_task.implementation" })}\n`;
    const trusted = {
      task: { readRecord: (candidate) => candidate === ref ? resultRaw : miniAttemptRaw },
      taskId: "task",
      kernel: { currentVNextSnapshot: () => ({ tree: reviewTree }), currentVNextMaterialRevision: () => `revision-${"d".repeat(64)}` },
    };
    expect(() => publishStageReviewFact({ trusted, stage: "verify-code", reviewKind: null, result: {
      status: "available", stage: "verify-code", review_track: null, review_kind: null, resultRef: ref, attemptRef, snapshotTree: reviewTree, materialId: reviewMaterialId, subjectKind: "worktree", phaseId: null, reviewScope: null,
    } })).toThrow(/semantic terminal attempt|current review request/);
    expect(() => publishStageReviewFact({ trusted, stage: "verify-code", reviewKind: null, result: {
      status: "available", stage: "verify-code", review_track: null, review_kind: null, resultRef: ref, attemptRef, snapshotTree: reviewTree, materialId: reviewMaterialId, subjectKind: "phase", phaseId: "P1", reviewScope: "phase",
    } })).toThrow(/worktree-scoped final review|does not use review_scope|identity aliases .*disagree/);
  });

  it("ignores retired response-ledger and round inputs", async () => {
    const { runSimpleReview } = await import(new URL("../simple-review-runner.mjs", import.meta.url));
    for (const [field, value] of [
      ["previous_result_ref", "quality/reviews/results/old.json"],
      ["review_round", "incremental"],
      ["review_delta", {}],
      ["request_id", "old-request"],
      ["prior_attempt_refs", []],
      ["dispatch_sequence", 1],
    ]) {
      const result = await runSimpleReview({
        stage: "build-code",
        host_provider: "codex",
        materials: { raw: "current" },
        [field]: value,
      }, {
        loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: realpathSync(mkdtempSync(join(tmpdir(), "wh-review-retired-"))), command: ["unused"] }),
        resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
        selectProviders: () => ({ providers: ["other"] }),
        client: {
          async runGroup() {
            return { runtimeId: "r1", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
          },
        },
      });
      expect(result.status).toBe("available");
      expect(result.findings).toHaveLength(0);
      expect(result).not.toHaveProperty("error_code");
    }
    const ledgerResult = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw: "current", response_ledger: {} },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: realpathSync(mkdtempSync(join(tmpdir(), "wh-review-ledger-"))), command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other"] }),
      client: {
        async runGroup() {
          return { runtimeId: "r2", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
        },
      },
    });
    expect(ledgerResult.status).toBe("available");
  });

  it("uses simple review path and no retired review-flow control plane", () => {
    const source = readFileSync(cli, "utf8");
    expect(source).toContain("ReviewProviderClient");
    expect(source).toContain("runSimpleReview");
    expect(source).toContain("runReviewRound");
    expect(source).not.toContain("recordMissingRouteUnavailable");
    for (const forbidden of [
      "qualityOnly",
      "withReviewFlowLock",
      "assertReviewFlowReady",
      "readReviewFlow",
      "advanceReviewFlow",
      "recordReviewAttempt",
      "adopt-legacy-root",
      "legacy_3rd_review",
      "buildNonGateReviewResponseRecord",
      "recordReviewResolution",
      "writeReviewResolution",
      "closureFailureCount",
      "structuralFullAlreadyRecorded",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("forbids caller-selected providers and review scope overrides", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["providers", "provider_allowlist", "providerAllowlist", "path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff", "review_scope", "reviewScope", "workflow_run_id", "workflowRunId"]) {
      await expect(runReviewRound({ [field]: field === "providers" ? ["claude-code"] : "forged", task_path: "/tmp/task", stage: "build-code" }))
        .rejects.toThrow(/forbidden|derived|provider|unsupported/i);
    }
  });

  it("ignores the removed scope revision public input", async () => {
    const { runSimpleReview } = await import(new URL("../simple-review-runner.mjs", import.meta.url));
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw: "x", scope_revision: {} },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: realpathSync(mkdtempSync(join(tmpdir(), "wh-review-scope-"))), command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other"] }),
      client: {
        async runGroup() {
          return { runtimeId: "r1", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
        },
      },
    });
    expect(result.status).toBe("available");
    expect(result.findings).toHaveLength(0);
    expect(result).not.toHaveProperty("error_code");
  });

  it("ignores retired runtime continuation inputs", async () => {
    const { runSimpleReview } = await import(new URL("../simple-review-runner.mjs", import.meta.url));
    for (const field of ["previous_runtime_ids", "previousRuntimeIds"]) {
      const result = await runSimpleReview({
        stage: "build-code",
        host_provider: "codex",
        materials: { raw: "current" },
        [field]: { opencode: "old-runtime" },
      }, {
        loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: realpathSync(mkdtempSync(join(tmpdir(), "wh-review-runtime-"))), command: ["unused"] }),
        resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
        selectProviders: () => ({ providers: ["other"] }),
        client: {
          async runGroup() {
            return { runtimeId: "r1", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
          },
        },
      });
      expect(result.status).toBe("available");
      expect(result.findings).toHaveLength(0);
      expect(result).not.toHaveProperty("error_code");
    }
  });

  it("blocks malformed build-prd recovery identity before runRound and sink writes", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const sinkRoot = process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
    const calls = [];
    const runRound = async () => { calls.push(true); return { status: "available" }; };
    for (const request of [
      { stage: "build-code", review_kind: "build_prd", host_provider: "codex", materials: { prd: "forged" } },
      { stage: "build-code", reviewKind: "build_prd", host_provider: "codex", materials: { prd: "camel forged" } },
      { stage: "build-prd", host_provider: "codex", materials: { prd: "missing sentinel" } },
      { stage: "build-prd", review_kind: "build_prd", reviewKind: "mini_task.design", host_provider: "codex", materials: { prd: "alias conflict" } },
      { stage: "not-a-formal-stage", host_provider: "codex", materials: { prd: "arbitrary stage" } },
      { stage: "build-code", review_kind: "arbitrary.kind", host_provider: "codex", materials: { prd: "arbitrary kind" } },
      { stage: "build-code", review_kind: "mini_task.design", reviewKind: "mini_task.implementation", host_provider: "codex", materials: { prd: "formal alias conflict" } },
    ]) {
      await expect(runReviewRecovery(request, { runRound })).rejects.toThrow(/build_prd|build-prd|identity aliases|unknown review_kind|unknown (?:recovery )?review stage/i);
    }
    expect(calls).toHaveLength(0);
    expect(readdirSync(sinkRoot)).toHaveLength(0);
  });

  it("makes one broker request and preserves terminal provider unavailability", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const calls = [];
    const result = await runReviewRecovery({
      task_path: "/tmp/task",
      stage: "build-code",
      materials: { frozen_packet: "packet-1" },
      snapshot_tree: "tree-1",
      material_id: "material-1",
    }, {
      runRound: async (input) => {
        calls.push(input);
        return { status: "unavailable", attempt_ref: `quality/reviews/attempts/a-${calls.length}.json`, error_code: "AUTH", snapshot_tree: "tree-1", material_id: "material-1" };
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].snapshot_tree).toBe("tree-1");
    expect(calls.some((input) => input.previous_result_ref || input.prior_attempt_refs || input.dispatch_sequence)).toBe(false);
    expect(result).toMatchObject({ status: "unavailable", error_code: "AUTH" });
  });

  it("turns a public round exception into one unavailable fact", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const calls = [];
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => {
        calls.push(true);
        throw Object.assign(new Error("broker process died"), { code: "PROCESS_DEAD" });
      },
    });
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({
      status: "unavailable",
      recovery: "run_round_exception",
      error_code: "PROCESS_DEAD",
      snapshot_tree: "tree-1",
      material_id: "material-1",
    });
  });

  it("review flow sink writes one non-authoritative record and reuses it concurrently", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const sink = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-sink-"))); roots.push(sink);
    const previousRoot = process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
    process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = sink;
    try {
      let calls = 0;
      const request = { stage: "build-code", host_provider: "codex", materials: { raw: "sink fixture" } };
      const runRound = async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 10)); return { status: "unavailable", authoritative: true, error_code: "MATERIAL_INCOMPLETE" }; };
      const [first, second] = await Promise.all([runReviewRecovery(request, { runRound }), runReviewRecovery(request, { runRound })]);
      expect(calls).toBe(1);
      expect(first).toMatchObject({ authoritative: false, reused: false });
      expect(first).toMatchObject({ error_code: "MATERIAL_INCOMPLETE" });
      expect(second).toMatchObject({ authoritative: false, reused: true, sink_ref: first.sink_ref, error_code: "MATERIAL_INCOMPLETE" });
      expect(readdirSync(sink)).toHaveLength(1);
      expect(JSON.parse(readFileSync(first.sink_ref, "utf8"))).toMatchObject({ authoritative: false, request_key: expect.any(String) });
      expect(JSON.parse(readFileSync(first.sink_ref, "utf8")).result.authoritative).toBe(false);
      const distinct = await runReviewRecovery({ ...request, subject: { ref: "other-subject" }, review_policy: { mode: "strict" } }, { runRound });
      expect(distinct.reused).toBe(false);
      expect(distinct.sink_ref).not.toBe(first.sink_ref);
      expect(readdirSync(sink)).toHaveLength(2);
    } finally {
      if (previousRoot === undefined) delete process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
      else process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = previousRoot;
    }
  });

  it("does not reuse a bare sink record when material bytes change", async () => {
    const { runReviewRecovery } = await import(cli.href);
    let calls = 0;
    const request = { stage: "build-code", host_provider: "codex", material_id: "caller-claimed-id" };
    const runRound = async () => {
      calls += 1;
      return { status: "unavailable", error_code: "AUTH" };
    };
    const first = await runReviewRecovery({ ...request, materials: { raw: "first" } }, { runRound });
    const second = await runReviewRecovery({ ...request, materials: { raw: "second" } }, { runRound });
    expect(calls).toBe(2);
    expect(first.reused).toBe(false);
    expect(second.reused).toBe(false);
    expect(second.sink_ref).not.toBe(first.sink_ref);
  });

  it("rejects bare sink tampering before status, identity, or reference recovery", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const route = () => ({ route_identity: "1".repeat(64) });
    const baseRequest = {
      stage: "build-code", review_scope: "phase", host_provider: "codex",
      task_id: "task-a", snapshot_tree: "tree-a", material_revision: "revision-a", material_id: "material-a",
    };
    for (const [label, mutate] of [
      ["status", (result) => { result.status = "available"; }],
      ["identity", (result) => { result.stage = "verify-code"; }],
      ["reference", (result) => { result.attempt_ref = "forged-reference"; }],
    ]) {
      const request = { ...baseRequest, subject: { ref: `tamper-${label}` } };
      const first = await runReviewRecovery(request, {
        resolveRouteIdentity: route,
        runRound: async () => ({ status: "unavailable", error_code: "AUTH" }),
      });
      const record = JSON.parse(readFileSync(first.sink_ref, "utf8"));
      expect(record.sink_sha256).toMatch(/^[a-f0-9]{64}$/);
      mutate(record.result);
      writeFileSync(first.sink_ref, `${JSON.stringify(record)}\n`);
      await expect(runReviewRecovery(request, {
        resolveRouteIdentity: route,
        runRound: async () => ({ status: "available" }),
      })).rejects.toMatchObject({ code: "REVIEW_SINK_INVALID" });
    }
  });

  it("does not reuse a material result across snapshot, revision, or task changes", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const route = () => ({ route_identity: "2".repeat(64) });
    let calls = 0;
    const runRound = async (input) => {
      calls += 1;
      return {
        status: "unavailable", error_code: "AUTH", task_id: input.task_id,
        snapshot_tree: input.snapshot_tree, material_revision: input.material_revision, material_id: input.material_id,
      };
    };
    const first = await runReviewRecovery({
      stage: "build-code", review_scope: "phase", host_provider: "codex",
      task_id: "task-a", snapshot_tree: "tree-a", material_revision: "revision-a", material_id: "same-material",
    }, { resolveRouteIdentity: route, runRound });
    const second = await runReviewRecovery({
      stage: "build-code", review_scope: "phase", host_provider: "codex",
      task_id: "task-b", snapshot_tree: "tree-b", material_revision: "revision-b", material_id: "same-material",
    }, { resolveRouteIdentity: route, runRound });
    expect(calls).toBe(2);
    expect(first.reused).toBe(false);
    expect(second.reused).toBe(false);
    expect(second.sink_ref).not.toBe(first.sink_ref);
  });

  it("returns a route-change unavailable envelope with the complete canonical request identity", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const request = {
      stage: "build-code", review_scope: "integration", host_provider: "codex",
      task_id: "task-route", snapshot_tree: "tree-route", material_revision: "revision-route", material_id: "material-route",
    };
    const first = await runReviewRecovery(request, {
      resolveRouteIdentity: () => ({ route_identity: "3".repeat(64) }),
      runRound: async (input) => ({ status: "unavailable", error_code: "AUTH", ...input }),
    });
    const changed = await runReviewRecovery(request, {
      resolveRouteIdentity: () => ({ route_identity: "4".repeat(64) }),
      runRound: async () => { throw new Error("route change must not dispatch"); },
    });
    expect(first.status).toBe("unavailable");
    expect(changed).toMatchObject({
      status: "unavailable", stage: "build-code", review_track: null, review_kind: null,
      review_scope: "integration", material_id: "material-route", task_id: "task-route",
      snapshot_tree: "tree-route", material_revision: "revision-route",
      error: { code: "REVIEW_RETRY_BUDGET_UNKNOWN" },
    });
  });

  it("preserves review refs when stage-fact publication fails", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const review = { status: "available", attemptRef: "quality/reviews/attempts/one/attempt.json", resultRef: "quality/reviews/results/one.json", reportRef: "quality/reviews/reports/one.md" };
    const result = await runReviewRecovery({}, {
      runRound: async () => { throw Object.assign(new Error("stale review"), { code: "QUALITY_FACT_PUBLISH_FAILED", reviewResult: review }); },
    });
    expect(result).toMatchObject({ status: "unavailable", attempt_ref: review.attemptRef, result_ref: review.resultRef, report_ref: review.reportRef });
  });

  it("keeps a code-less local exception out of provider failure taxonomy", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { throw new TypeError("local input is invalid"); },
    });
    expect(result).toMatchObject({ status: "unavailable", error_code: "WORKFLOWHUB_LOCAL_ERROR" });
  });

  it("rejects the retired same-source fallback callback", async () => {
    const { runReviewRecovery } = await import(cli.href);
    await expect(runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => ({ status: "unavailable", attempt_ref: "attempt", error_code: "OUTPUT_INVALID", snapshot_tree: "tree-1", material_id: "material-1" }),
      sameSourceFallback: async () => ({ source: "same_source", independent_context: true, status: "incomplete" }),
    })).rejects.toThrow(/sameSourceFallback is retired/);
  });

  it("does not retry material failures or semantic findings", async () => {
    const { runReviewRecovery } = await import(cli.href);
    for (const envelope of [
      { status: "unavailable", attempt_ref: "material", error_code: "MATERIAL_INCOMPLETE", snapshot_tree: "tree-1", material_id: "material-1" },
      { status: "available", result_ref: "semantic", findings: [{ severity: "minor" }], snapshot_tree: "tree-1", material_id: "material-1" },
    ]) {
      const calls = [];
      const result = await runReviewRecovery({ task_path: "/tmp/task", stage: "build-code", reason: envelope.error_code ?? "semantic-findings", snapshot_tree: "tree-1", material_id: "material-1", subject: { ref: envelope.error_code ?? "semantic-findings" } }, {
        runRound: async () => { calls.push(true); return envelope; },
      });
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject(envelope);
    }
  });

  it("preserves missing-route and provider identity failures after one call", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const routeCalls = [];
    const routeResult = await runReviewRecovery({ stage: "build-code", reason: "missing-route", snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { routeCalls.push(true); return { status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE", snapshot_tree: "tree-1", material_id: "material-1" }; },
    });
    expect(routeCalls).toHaveLength(1);
    expect(routeResult).toMatchObject({ status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE" });

    const identityCalls = [];
    const identityResult = await runReviewRecovery({ stage: "build-code", reason: "provider-identity", snapshot_tree: "tree-1", material_id: "material-1", subject: { ref: "provider-identity" } }, {
      runRound: async () => { identityCalls.push(true); return { status: "unavailable", error_code: "AUTH", attempt_ref: `attempt-${identityCalls.length}`, snapshot_tree: "tree-1" }; },
    });
    expect(identityCalls).toHaveLength(1);
    expect(identityResult).toMatchObject({ status: "unavailable", error_code: "AUTH" });
  });

  it("preserves output/protocol/profile failures without a second WorkflowHub retry", async () => {
    const { runReviewRecovery } = await import(cli.href);
    for (const error_code of ["PROTOCOL_INCOMPATIBLE", "PUBLIC_RESULT_INVALID", "PROFILE_MISMATCH", "OUTPUT_INVALID", "PROVIDER_OUTPUT_INVALID"]) {
      const calls = [];
      const result = await runReviewRecovery({ stage: "build-code", reason: error_code, snapshot_tree: "tree-1", material_id: "material-1", subject: { ref: error_code } }, {
        runRound: async () => {
          calls.push(true);
          return { status: "unavailable", attempt_ref: `attempt-${error_code}`, error_code, snapshot_tree: "tree-1", material_id: "material-1" };
        },
      });
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject({ status: "unavailable", error_code });
    }

    const calls = [];
    const result = await runReviewRecovery({ stage: "build-code", reason: "cancelled", snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => {
        calls.push(true);
        return { status: "unavailable", attempt_ref: "cancelled", error_code: "CANCELLED", snapshot_tree: "tree-1", material_id: "material-1" };
      },
    });
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({ status: "unavailable", error_code: "CANCELLED" });
  });

  it("rejects a caller-provided same-source fallback", async () => {
    const { runReviewRecovery } = await import(cli.href);
    await expect(runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async ({ snapshot_tree, material_id }) => ({ status: "unavailable", error_code: "AUTH", attempt_ref: "attempt", snapshot_tree, material_id }),
      sameSourceFallback: async () => ({ status: "available", source: "heterologous", independent_context: true, snapshot_tree: "tree-2", material_id: "material-2", attempt_refs: ["forged"] }),
    })).rejects.toThrow(/sameSourceFallback is retired/);
  });

  it("opens only an existing make-decision Workspace and never prepares one", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-decision-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
    const { resolveTrustedReviewSubject } = await import(cli.href);
    expect(() => resolveTrustedReviewSubject({ task_path: taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" }))
      .toThrow(/current task Workspace|registered|ENOENT/i);
    expect(git(repo, ["worktree", "list", "--porcelain"]).split("\n").filter((line) => line.startsWith("worktree "))).toHaveLength(1);
    const { prepareTaskWorkspace } = await import("../../../../runtime/task/workspace.mjs");
    prepareTaskWorkspace(task);
    const subject = resolveTrustedReviewSubject({ task_path: taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" });
    expect(subject.workspace.worktreeRoot).toBe(`${repo}-task`);
    expect(subject.candidateWorkspace).toBeUndefined();
    expect(subject).not.toHaveProperty("sourceRoot");
    // The make-decision detail track authenticates the current material
    // revision through the kernel; the subject must bind the existing
    // Workspace to the kernel instead of throwing "requires an authenticated
    // Workspace".
    expect(subject.kernel.currentVNextMaterialRevision()).toMatch(/^revision-[a-f0-9]{64}$/);
  });

  it("returns unavailable when the run route is missing without writing task state", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-route-missing-"))); roots.push(root);
    const home = join(root, "home");
    mkdirSync(home, { recursive: true });
    const inputPath = join(root, "input.json");
    writeFileSync(inputPath, JSON.stringify({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw: "fixture" },
    }));

    const result = JSON.parse(execFileSync(process.execPath, [fileURLToPath(cli), "run", inputPath], {
      encoding: "utf8",
      env: { ...process.env, HOME: home },
    }));
    expect(result).toMatchObject({ status: "unavailable", error: { code: "ROUTE_UNAVAILABLE" } });
    expect(result.attempt_ref).toBeUndefined();
    expect(result).not.toHaveProperty("error_code");
  });

  it("uses the production run entry for the paired broker requests and preserves provider failure", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-recovery-entry-"))); roots.push(root);
    const home = join(root, "home");
    const configDir = join(home, ".config", "workflowhub"); mkdirSync(configDir, { recursive: true });
    const packetRoot = join(root, "packets"); mkdirSync(packetRoot);
    const brokerConfig = join(root, "3rd-review.json");
    writeFileSync(brokerConfig, JSON.stringify({
      version: 4,
      tiers: [["kimi"]],
      providers: { kimi: { enabled: true, source_id: "fixture-kimi-source" } },
      attachment_roots: [{ root: packetRoot, sources: [".wh-review-packets"] }],
    }));
    const brokerConfigId = createHash("sha256").update(JSON.stringify({
      id: "kimi", source_id: "fixture-kimi-source", model: null, effort: null, thinking: null, deadline_ms: null,
    }), "utf8").digest("hex");
    const counter = join(root, "broker-count"); writeFileSync(counter, "0");
    const broker = join(root, "fake-broker.mjs");
    writeFileSync(broker, `import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const requestPath = process.argv.find((value) => value.startsWith("--request="))?.slice("--request=".length);
const attachmentsPath = process.argv.find((value) => value.startsWith("--attachments="))?.slice("--attachments=".length);
if (!requestPath) process.exit(2);
const countPath = process.env.FAKE_REVIEW_COUNTER;
const count = Number(readFileSync(countPath, "utf8")) + 1;
writeFileSync(countPath, String(count));
const request = JSON.parse(readFileSync(requestPath, "utf8"));
const attachments = JSON.parse(readFileSync(attachmentsPath, "utf8"));
const trustedIdentity = {
  source_id: "fixture-kimi-source",
  config_id: createHash("sha256").update(JSON.stringify({
    id: "kimi",
    source_id: "fixture-kimi-source",
    model: null,
    effort: null,
    thinking: null,
    deadline_ms: null,
  }), "utf8").digest("hex"),
};
const runtimeId = "fixture-runtime-" + count;
const requestId = process.argv.find((value) => value.startsWith("--request-id="))?.slice("--request-id=".length);
const error = { code: "AUTH", message: "fixture auth unavailable" };
const member = {
  adapter: "kimi", continuable: false, effort: null, error,
  material_id: attachments.bundle_id, model: null, output: null, provider: "kimi",
  raw_output_ref: null, result_protocol: "workflowhub-result.v2",
  retry: { count: 0, progress_events: 0 }, runtime_id: runtimeId,
  session_file_path: null, session_id: null, status: "failed", thinking: null,
  timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
  unavailable_diagnostics: error, usage: null,
};
process.stdout.write(JSON.stringify({
  version: "workflowhub-run.v1", state: "terminal", request_id: requestId,
  runtime_id: runtimeId, material_id: attachments.bundle_id,
  group: {
    version: 4, host_provider: request.host_provider, outcome: "unavailable",
    providers: [member], round: 1, runtime_id: runtimeId, selected_tier: 0,
  },
}));
`);
    writeFileSync(join(configDir, "config.json"), JSON.stringify({
      third_review: { command: [process.execPath, broker], config: brokerConfig, attachment_root: packetRoot },
      wh_review: {
        version: 2,
        stages: { "make-decision": { direction: { initial: ["kimi"], minimum_heterologous: 1, mode: "single_round" } } },
      },
    }));
    const inputPath = join(root, "input.json");
    writeFileSync(inputPath, JSON.stringify({
      stage: "make-decision",
      review_track: "direction",
      host_provider: "codex",
      direction_selection: { current_selection: "fixture choice" },
      materials: {
        raw_requirement: "A bounded review recovery fixture.", objective_facts: "The task workspace and trusted route exist.",
        convergence_outline: "The fixture review converges on the configured direction.",
        review_instructions: "Review the materials.",
      },
    }));

    const result = JSON.parse(execFileSync(process.execPath, [fileURLToPath(cli), "run", inputPath], {
      encoding: "utf8", env: { ...process.env, HOME: home, FAKE_REVIEW_COUNTER: counter },
    }));
    // make-decision direction is one logical paired review: red and blue
    // each issue one broker request and retain role provenance. The fixture
    // counter is intentionally a best-effort side effect because the two
    // child processes may update it concurrently.
    expect(Number(readFileSync(counter, "utf8"))).toBeGreaterThan(0);
    expect(result).toMatchObject({ status: "unavailable" });
    expect(result).not.toHaveProperty("error_code");
    expect(result).not.toHaveProperty("attempt_ref");
    expect(result.provider_results).toHaveLength(2);
    expect(result.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "kimi", role: "red", status: "failed", error: expect.objectContaining({ code: "AUTH" }) }),
      expect.objectContaining({ provider: "kimi", role: "blue", status: "failed", error: expect.objectContaining({ code: "AUTH" }) }),
    ]));
  });
});
