import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createServer } from "node:net";
import yaml from "js-yaml";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { authenticateCurrentBuildCodeStageOutcome, runOfficialStage, runStage } from "../../runtime/stage/stage-runner.mjs";
import { STAGE_PREDICATES, stageMaterialScopeRevision } from "../../runtime/stage/completion-predicates.mjs";
import { projectAcceptanceExecutionData } from "../../runtime/stage/stage-content-contracts.mjs";
import { acceptanceExecutionFacts } from "../../runtime/stage/stage-handlers.mjs";
import { createCanonicalReceiptWriter, writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { publishCurrentWorkflowHubSession } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";
import { evaluateFactFreshness } from "../../runtime/evidence/freshness.mjs";
import { redactProviderHostPaths } from "../../skills/wh-review/scripts/review-materials.mjs";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { loadTrustedThirdReviewConfig, resolveTrustedReviewRoute, selectTrustedReviewProviderSelection } from "../../skills/wh-review/scripts/third-review-host-config.mjs";
import { writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const SNAPSHOT = "b".repeat(40);
const roots = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

const tasks = `# Tasks

- **Template version**：\`plan-task.v4\`

## Phase P6 — delivery acceptance

#### T019 — acceptance
- **ID**：T019
- **ui_scope**：ui
- **acceptance_role**：acceptance
- **e2e_scope**：ui
- **AC**：AC-EXE-001
- **acceptance_data**：\`[{"source":"qa/browser","sample":"real page fixture","scenario":"user saves settings","tier":"browser"},{"source":"service/api","sample":"real request","scenario":"service persists settings","tier":"service"},{"source":"command/cli","sample":"real task store","scenario":"command verifies evidence","tier":"command"}]\`
`;

const invalidDeclaredTasks = `# Tasks

- **Template version**：\`plan-task.v4\`

#### T019 — malformed acceptance
- **ID**：T019
- **ui_scope**：ui
- **acceptance_role**：acceptance
- **e2e_scope**：ui
- **AC**：AC-EXE-001
- **acceptance_data**：\`[]\`
`;

function evidence(suffix) {
  return [{ ref: `quality/evidence/browser-qa/${suffix.repeat(64)}.json`, sha256: suffix.repeat(64) }];
}

function officialBrowserFixture({ prepare, acceptanceData, recordModel = "vnext-single-write" } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-browser-acceptance-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "browser-acceptance",
      created_at: "2026-08-30T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: recordModel,
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n");
  artifacts.writeAtomic("spec.md", "# Spec\n\n## Acceptance Criteria\n\n- **AC-EXE-001**：browser acceptance.\n");
  artifacts.writeAtomic("plan.md", "# Plan\n");
  artifacts.writeAtomic("tasks.md", `# Tasks

- **Template version**：\`plan-task.v4\`

#### T019 — browser acceptance
- **ID**：T019
- **ui_scope**：ui
- **acceptance_role**：acceptance
- **e2e_scope**：ui
- **AC**：AC-EXE-001
- **acceptance_data**：\`${JSON.stringify(acceptanceData ?? [{ source: "qa/browser", sample: "real-page", scenario: "save settings", tier: "browser" }])}\`
`);
  prepare?.({ root, task, candidate, artifacts });
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return {
    root,
    repo,
    candidate,
    task,
    context: {
      stage: "build-code", task, kernel, identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: task.manifest,
      candidateWorkspace: candidate, artifacts,
    },
  };
}

async function withRuntimeEnvironment(state, action) {
  const previous = Object.fromEntries([
    "HOME",
    "WORKFLOWHUB_TASK_DIR",
    "CODEX_SESSION_ID",
    "CODEX_THREAD_ID",
    "CODEX_ROLLOUT_PATH",
    "WORKFLOWHUB_CODEX_ROLLOUT_PATH",
  ].map((key) => [key, process.env[key]]));
  const home = join(state.root, "home");
  mkdirSync(home, { recursive: true });
  process.env.HOME = home;
  process.env.WORKFLOWHUB_TASK_DIR = state.root;
  delete process.env.CODEX_SESSION_ID;
  delete process.env.CODEX_THREAD_ID;
  delete process.env.CODEX_ROLLOUT_PATH;
  delete process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function browserPayload(input) {
  return {
    applicability: "ui", result: "pass", task_id: input.task_id, stage: input.stage,
    attempt_id: input.attempt_id, invocation_id: input.invocation_id,
    material_revision: input.material_revision, snapshot_tree: input.snapshot_tree,
    acceptance_criterion_id: input.acceptance_criterion_ids[0],
    acceptance_scenario: input.acceptance_scenario,
    route: "/settings", page: "Settings", scenario: "save settings", tool: "isolated-browser-qa", engine: "agent-browser", session: "acceptance-fixture",
    state: { name: "saved" }, viewport: { name: "desktop", width: 1440, height: 900 }, fixture: { name: "real-page", fixture_only: false },
    component: { name: "Settings", path: "src/Settings.tsx" }, design_revision: "Design.md@v1",
    design_identity: { document_kind: "design", path: "Design.md", content_sha256: "a".repeat(64), revision: "design-v1", anchor_id: "settings", anchor_title: "Settings", anchor_source: "explicit" },
    experience_identity: { document_kind: "experience", path: "Experience.md", content_sha256: "b".repeat(64), revision: "experience-v1", anchor_id: "settings", anchor_title: "Settings", anchor_source: "explicit" },
    service_identity: { name: "settings-web", revision: "service-v1" }, api_identity: { name: "settings-api", revision: "api-v1" }, dto_identity: { name: "SettingsDto", revision: "dto-v1" }, browser_profile: { name: "isolated", revision: "profile-v1" },
    environment_identity: { kind: "local", name: "settings-web", revision: "service-v1", endpoint: "http://127.0.0.1:4173", runtime_id: "settings-runtime-1" },
    data_identity: { kind: "seeded", name: "settings-user", revision: "data-v1", source: "qa/browser", dataset_id: "real-page", fixture_only: false },
    cancellation: { status: "not_cancelled" }, observations: { console: { status: "clean" }, network: { status: "clean" }, focus: { status: "checked" }, overflow: { status: "none" } },
    visual: { status: "observed", screenshot_refs: [] }, a11y: { status: "checked", checks: ["keyboard"] }, auth: { mode: "none", login_state_reused: false }, performance: { status: "not_applicable", reason: "fixture" },
    screenshots: [], test: { command: "node --test", file: "settings.test.mjs", output_ref: "", output_hash: "0".repeat(64), exit_code: 0 }, cleanup: { status: "completed", app_service_running: true }, engine_switch: "no",
  };
}

function publishBrowserAttachments({ task, kernel, payload }) {
  const screenshotBytes = Buffer.from("real browser screenshot bytes\n", "utf8");
  const screenshotContentHash = createHash("sha256").update(screenshotBytes).digest("hex");
  const screenshotRef = `quality/evidence/browser-qa/${screenshotContentHash}.json`;
  const screenshotRaw = `${JSON.stringify({
    schema_version: "workflowhub-evidence-publication.v1",
    source_path: "qa-artifacts/settings.png",
    content_sha256: screenshotContentHash,
    content_encoding: "base64",
    content_base64: screenshotBytes.toString("base64"),
    publisher: "build-code",
    recorded_at: "2026-08-30T00:00:00.000Z",
  })}\n`;
  kernel.publishCanonicalRecord(screenshotRef, screenshotRaw);

  const output = "settings browser acceptance passed\n";
  const outputRef = `quality/tests/output/${createHash("sha256").update(output).digest("hex")}.txt`;
  kernel.publishCanonicalRecord(outputRef, output);
  return {
    ...payload,
    visual: { ...payload.visual, screenshot_refs: [screenshotRef] },
    screenshots: [{ ref: screenshotRef, hash: createHash("sha256").update(screenshotRaw).digest("hex") }],
    test: {
      ...payload.test,
      output_ref: outputRef,
      output_hash: createHash("sha256").update(output).digest("hex"),
    },
  };
}

async function seedCompletedUpstreamStages(state) {
  for (const stage of ["make-decision", "build-spec", "build-plan"]) {
    const snapshot = state.context.kernel.currentVNextSnapshot();
    const facts = Object.fromEntries(Object.entries(STAGE_PREDICATES[stage])
      .filter(([subject]) => subject !== "stage_end_spec_analyze" && subject !== "human_confirmation")
      .map(([subject]) => [subject, { status: "passed", evidence_refs: [], detail: `fixture ${subject}` }]));
    if (stage === "make-decision" || stage === "build-plan") {
      state.context.kernel.publishHumanConfirmation(stage, {
        decision: "accepted",
        subject_ref: `fixture/${stage}`,
        reply_text: `fixture confirmation for ${stage}`,
        step_slug: stage === "make-decision" ? "approve-decision" : "publish-plan-result",
      });
    }
    const result = await runStage(stage, {
      ...state.context,
      stage,
      workflowRunId: state.context.kernel.deriveStageWorkflowRunId(stage),
    }, async () => ({
      facts: stage === "make-decision"
        ? { worktree_root: state.candidate.worktreeRoot, baseline_commit: state.candidate.baselineCommit, completion_subjects: facts }
        : stage === "build-spec"
          ? { spec_ref: state.context.artifacts.reference("spec.md"), snapshot_tree: snapshot.tree, source_digest: snapshot.source_digest, completion_subjects: facts }
          : { plan_ref: state.context.artifacts.reference("plan.md"), tasks_ref: state.context.artifacts.reference("tasks.md"), snapshot_tree: snapshot.tree, source_digest: snapshot.source_digest, completion_subjects: facts },
      spec_analyze: { result: { status: "consistent" } },
      evidence_refs: [],
      verification: `fixture ${stage} completed upstream seed`,
    }));
    expect(result.status).toBe("completed");
    writeStageOutcomeFixture({
      task: state.task,
      kernel: state.context.kernel,
      artifacts: state.context.artifacts,
      candidateWorkspace: state.candidate,
      stage,
      attemptId: `upstream-${stage}-attempt`,
      skipAnalyzerValidation: true,
      workflowRunId: state.context.kernel.deriveStageWorkflowRunId(stage),
    });
  }
}

function acceptanceExecutionSubjectFact(state, result) {
  const executionFact = result.quality_fact_refs
    .map((ref) => JSON.parse(state.task.readRecord(ref)))
    .find((fact) => fact.kind === "acceptance_criterion" && fact.subject === "acceptance_execution");
  expect(executionFact).toBeDefined();
  const acceptanceEvidence = executionFact.evidence[0];
  const acceptance = JSON.parse(state.task.readRecord(acceptanceEvidence.ref));
  const stageEvidence = acceptance.refs[0];
  return JSON.parse(state.task.readRecord(stageEvidence.ref)).subject_fact;
}

function publishContentAddressedJson(kernel, prefix, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const sha256 = createHash("sha256").update(raw).digest("hex");
  const ref = `${prefix}/${sha256}.json`;
  kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256 };
}

function publishCurrentExecutionWithMismatchedDataIdentity(state, result) {
  const executionFact = result.quality_fact_refs
    .map((ref) => JSON.parse(state.task.readRecord(ref)))
    .find((fact) => fact.kind === "acceptance_criterion" && fact.subject === "acceptance_execution");
  const acceptanceBinding = executionFact.evidence[0];
  const acceptance = JSON.parse(state.task.readRecord(acceptanceBinding.ref));
  const stageBinding = acceptance.refs[0];
  const stageEvidence = JSON.parse(state.task.readRecord(stageBinding.ref));
  const browserBinding = stageEvidence.subject_fact.execution_items[0].evidence_refs[0];
  const browser = JSON.parse(state.task.readRecord(browserBinding.ref));
  const alteredBrowser = publishContentAddressedJson(state.context.kernel, "quality/evidence/browser-qa", {
    ...browser,
    data_identity: {
      ...browser.data_identity,
      source: "qa/other-browser",
      dataset_id: "other-page",
    },
  });
  const alteredStage = publishContentAddressedJson(state.context.kernel, "quality/evidence/stage-quality/build-code", {
    ...stageEvidence,
    subject_fact: {
      ...stageEvidence.subject_fact,
      execution_items: stageEvidence.subject_fact.execution_items.map((item) => ({
        ...item,
        evidence_refs: [{ ref: alteredBrowser.ref, sha256: alteredBrowser.sha256 }],
      })),
    },
  });
  const alteredAcceptance = publishContentAddressedJson(state.context.kernel, "quality/evidence/acceptance/build-code", {
    ...acceptance,
    refs: [{ ref: alteredStage.ref, sha256: alteredStage.sha256 }],
    freshness: {
      ...acceptance.freshness,
      evidence_freshness: acceptance.freshness.evidence_freshness.map((entry) => (
        entry.ref === stageBinding.ref
          ? { ...entry, ref: alteredStage.ref, sha256: alteredStage.sha256 }
          : entry
      )),
    },
  });
  state.context.kernel.publishVNextQualityFact("build-code", {
    kind: "acceptance_criterion",
    status: "passed",
    subject: "acceptance_execution",
    evidence: [{ ref: alteredAcceptance.ref, sha256: alteredAcceptance.sha256, evidence_type: "acceptance_evidence" }],
  });
  const snapshot = state.context.kernel.currentVNextSnapshot();
  const materialRevision = state.context.kernel.currentVNextMaterialRevision();
  publishContentAddressedJson(state.context.kernel, "quality/evidence/stage-outcomes/build-code", {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: state.task.identity.taskId,
    stage: "build-code",
    status: "completed",
    snapshot_tree: snapshot.tree,
    material_revision: materialRevision,
    attempt_id: "build-code-execution-record",
    producer: { kind: "stage-agent", host: "verify-read-fixture", agent_run_id: "verify-read-fixture-run" },
  });
}

function e2eAcceptanceSubjectFact(state, result) {
  const e2eFact = result.quality_fact_refs
    .map((ref) => JSON.parse(state.task.readRecord(ref)))
    .find((fact) => fact.kind === "acceptance_criterion" && fact.subject === "e2e_acceptance");
  expect(e2eFact).toBeDefined();
  const acceptance = JSON.parse(state.task.readRecord(e2eFact.evidence[0].ref));
  return JSON.parse(state.task.readRecord(acceptance.refs[0].ref)).subject_fact;
}

async function runOfficialBrowserAcceptance({
  mutateStored,
  mutatePayload,
  publish = true,
  state = officialBrowserFixture(),
  attemptId = "build-code-attempt",
} = {}) {
  const trace = { calls: 0 };
  const result = await runOfficialStage("build-code", state.context, { attempt_id: attemptId, receipts: {} }, {
    ...(publish ? {
      runControlledUiQa: async (input) => {
        trace.calls += 1;
        return publishControlledBrowserResult(state, input, { mutateStored, mutatePayload });
      },
    } : {}),
  });
  return { state, trace, result };
}

function publishControlledBrowserResult(state, input, { mutateStored, mutatePayload } = {}) {
  const initial = publishBrowserAttachments({
    task: state.task,
    kernel: state.context.kernel,
    payload: browserPayload(input),
  });
  const stored = mutateStored ? mutateStored(initial, input) : initial;
  const raw = `${JSON.stringify(stored)}\n`;
  const sha256 = createHash("sha256").update(raw).digest("hex");
  const ref = `quality/evidence/browser-qa/${sha256}.json`;
  state.context.kernel.publishCanonicalRecord(ref, raw);
  const initialPayload = { ...stored, evidence_ref: ref, evidence_hash: sha256 };
  const payload = mutatePayload ? mutatePayload(initialPayload, input) : initialPayload;
  return {
    invocation_id: input.invocation_id,
    payload,
    evidence_ref: ref,
    evidence_hash: sha256,
  };
}

describe("acceptance execution tiers", () => {
  it("projects the one strict acceptance_data source and never invents a second Markdown parser", () => {
    expect(projectAcceptanceExecutionData(tasks)).toMatchObject({
      status: "ready",
      requires_execution: true,
      requires_independent_verdict: true,
      scenarios: [
        { task_id: "T019", tier: "browser", source: "qa/browser", sample: "real page fixture", scenario: "user saves settings" },
        { task_id: "T019", tier: "service" },
        { task_id: "T019", tier: "command" },
      ],
    });
  });

  it("keeps a declared but malformed UI acceptance contract execution-bound and E2E-required", () => {
    expect(projectAcceptanceExecutionData(invalidDeclaredTasks)).toMatchObject({
      status: "unavailable",
      requires_execution: true,
      requires_independent_verdict: true,
      scenarios: [],
    });
  });

  it("keeps missing service and command adapters unavailable while browser execution is delegated only to controlled QA", async () => {
    const calls = [];
    const result = await acceptanceExecutionFacts({
      stage: "build-code",
      identity: { taskId: "acceptance-tier" },
      readArtifact: (name) => name === "tasks.md" ? tasks : "# Current materials\n",
      runAcceptanceScenario: async (scenario) => {
        calls.push(scenario);
        if (scenario.tier === "browser") {
          return { status: "executed", tier: "browser", executor: "controlled-browser-qa", evidence_refs: evidence("c") };
        }
        return { status: "unavailable", tier: scenario.tier, reason: `${scenario.tier} adapter is unavailable`, evidence_refs: [] };
      },
    }, SNAPSHOT);

    expect(calls.map(({ tier }) => tier)).toEqual(["browser", "service", "command"]);
    expect(result).toMatchObject({ status: "unavailable", requires_execution: true });
    expect(result.items).toEqual([
      expect.objectContaining({ tier: "browser", status: "executed", executor: "controlled-browser-qa", evidence_refs: evidence("c") }),
      expect.objectContaining({ tier: "service", status: "unavailable", reason: "service adapter is unavailable", evidence_refs: [] }),
      expect.objectContaining({ tier: "command", status: "unavailable", reason: "command adapter is unavailable", evidence_refs: [] }),
    ]);
  });

  it("does not turn an absent private executor into coverage or a browser substitute", async () => {
    const result = await acceptanceExecutionFacts({
      stage: "build-code",
      identity: { taskId: "acceptance-tier" },
      readArtifact: (name) => name === "tasks.md" ? tasks : "# Current materials\n",
    }, SNAPSHOT);

    expect(result).toMatchObject({ status: "unavailable", evidence_refs: [] });
    expect(result.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ tier: "browser", status: "unavailable", evidence_refs: [] }),
      expect.objectContaining({ tier: "service", status: "unavailable", evidence_refs: [] }),
      expect.objectContaining({ tier: "command", status: "unavailable", evidence_refs: [] }),
    ]));
  });

  it("executes browser acceptance only after callback and canonical bytes share the complete scenario binding", async () => {
    const { state, trace, result } = await runOfficialBrowserAcceptance();
    expect(trace.calls).toBe(1);
    expect(acceptanceExecutionSubjectFact(state, result)).toMatchObject({
      status: "passed",
      execution_items: [expect.objectContaining({
        tier: "browser",
        status: "executed",
        executor: "controlled-browser-qa",
      })],
    });
  });

  it("keeps the current stage runnable when an upstream Stage Agent outcome is not current", async () => {
    const state = officialBrowserFixture();
    await seedCompletedUpstreamStages(state);
    const inputPath = join(state.root, "run-input.json");
    writeFileSync(inputPath, JSON.stringify({ attempt_id: "runtime-browser-attempt", receipts: {} }));
    const calls = [];

    const result = await withRuntimeEnvironment(state, () => stageRuntimeCliMain([
      "run",
      "--action=execute",
      "--stage=build-code",
      "--project=WorkflowHub",
      "--task=browser-acceptance",
      `--input=${inputPath}`,
    ], {
      cwd: state.repo,
      services: {
        monitoring: false,
        runControlledUiQa: async (input) => {
          calls.push(input);
          throw new Error("browser capability must not run without a Stage Agent outcome");
        },
      },
    }));
    expect(result).toMatchObject({
      stage: "build-code",
      work_status: "ready",
      quality_status: "incomplete",
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: { status: "unavailable", reason: "stage_outcome_missing" },
    });
    expect(calls).toHaveLength(1);
  });

  it("keeps verify-code browser execution unavailable when current canonical data identity does not bind the declared scenario", async () => {
    const { state, result } = await runOfficialBrowserAcceptance();
    publishCurrentExecutionWithMismatchedDataIdentity(state, result);
    const verify = await runOfficialStage("verify-code", {
      ...state.context,
      stage: "verify-code",
      workflowRunId: state.context.kernel.deriveStageWorkflowRunId("verify-code"),
    }, { attempt_id: "verify-data-binding", receipts: {} });

    expect(verify).toMatchObject({
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: { status: "unavailable", reason: "stage_outcome_missing" },
    });
    expect(e2eAcceptanceSubjectFact(state, verify)).toMatchObject({
      status: "missing",
      evidence_refs: [],
    });
  });

  it("keeps browser acceptance unavailable for every payload-binding mutation", async () => {
    const cases = [
    ["omits the callback scenario", { mutatePayload: (payload) => {
      const { acceptance_scenario: _scenario, ...withoutScenario } = payload;
      return withoutScenario;
    } }],
    ["changes the callback material revision", { mutatePayload: (payload) => ({
      ...payload,
      material_revision: `revision-${"e".repeat(64)}`,
    }) }],
    ["changes the source in canonical bytes", { mutateStored: (stored) => ({
      ...stored,
      acceptance_scenario: { ...stored.acceptance_scenario, source: "qa/other-browser" },
    }) }],
    ["changes a scenario field in canonical bytes", { mutateStored: (stored) => ({
      ...stored,
      acceptance_scenario: { ...stored.acceptance_scenario, sample: "other page" },
    }) }],
    ["changes the scenario text in canonical bytes", { mutateStored: (stored) => ({
      ...stored,
      acceptance_scenario: { ...stored.acceptance_scenario, scenario: "delete settings" },
    }) }],
    ["changes the scenario tier in canonical bytes", { mutateStored: (stored) => ({
      ...stored,
      acceptance_scenario: { ...stored.acceptance_scenario, tier: "service" },
    }) }],
    ["changes the task identity in canonical bytes", { mutateStored: (stored) => ({ ...stored, task_id: "other-task" }) }],
    ["changes the snapshot in canonical bytes", { mutateStored: (stored) => ({ ...stored, snapshot_tree: "f".repeat(40) }) }],
    ["changes the invocation in canonical bytes", { mutateStored: (stored) => ({ ...stored, invocation_id: "other-invocation" }) }],
    ["omits the real execution environment identity", { mutateStored: (stored) => {
      const { environment_identity: _environment, ...withoutEnvironment } = stored;
      return withoutEnvironment;
    } }],
    ["omits the real data identity", { mutateStored: (stored) => {
      const { data_identity: _data, ...withoutData } = stored;
      return withoutData;
    } }],
    ["changes the payload endpoint/runtime identity", { mutatePayload: (payload) => ({
      ...payload,
      environment_identity: {
        ...payload.environment_identity,
        endpoint: "http://127.0.0.1:4174",
        runtime_id: "settings-runtime-2",
      },
    }) }],
    ["changes the payload data source/dataset identity", { mutatePayload: (payload) => ({
      ...payload,
      data_identity: {
        ...payload.data_identity,
        source: "qa/other-browser",
        dataset_id: "other page fixture",
      },
    }) }],
    ["changes a non-identity browser observation in the callback payload", { mutatePayload: (payload) => ({
      ...payload,
      route: "/other-settings",
      observations: { ...payload.observations, console: "changed" },
    }) }],
    ["binds data source/dataset identity to a different acceptance scenario", { mutateStored: (stored) => ({
      ...stored,
      data_identity: {
        ...stored.data_identity,
        source: "qa/other-browser",
        dataset_id: "other page fixture",
      },
    }) }],
    ["has a screenshot attachment hash mismatch", { mutateStored: (stored) => ({
      ...stored,
      screenshots: [{ ...stored.screenshots[0], hash: "e".repeat(64) }],
    }) }],
      ["has a test-output attachment hash mismatch", { mutateStored: (stored) => ({
        ...stored,
        test: { ...stored.test, output_hash: "e".repeat(64) },
      }) }],
    ];
    const scenarioOptions = new Map(cases.map(([caseName, options]) => [caseName, options]));
    const state = officialBrowserFixture({
      acceptanceData: cases.map(([caseName]) => ({ source: "qa/browser", sample: "real-page", scenario: caseName, tier: "browser" })),
    });
    let calls = 0;
    const result = await runOfficialStage("build-code", state.context, { attempt_id: "build-code-mutation-table", receipts: {} }, {
      runControlledUiQa: async (input) => {
        calls += 1;
        return publishControlledBrowserResult(state, input, scenarioOptions.get(input.acceptance_scenario.scenario));
      },
    });
    expect(calls).toBe(cases.length);
    expect(acceptanceExecutionSubjectFact(state, result)).toMatchObject({
      status: "missing",
      execution_items: cases.map(() => expect.objectContaining({ tier: "browser", status: "unavailable", evidence_refs: [] })),
    });
  });

  it("keeps browser acceptance unavailable without a controlled QA adapter", async () => {
    const { state, trace, result } = await runOfficialBrowserAcceptance({ publish: false });
    expect(trace.calls).toBe(0);
    expect(acceptanceExecutionSubjectFact(state, result)).toMatchObject({
      status: "missing",
      execution_items: [expect.objectContaining({ tier: "browser", status: "unavailable", evidence_refs: [] })],
    });
  });
});

// P3 uses the actual workspace argv/service path. Executable source belongs to
// the fixture snapshot; mutable process observations live outside the worktree.
const p9Hash = (raw) => createHash("sha256").update(raw).digest("hex");
const p9Ids = ["AC-EXE-001", "AC-EXE-002"];
const p9Rows = () => [
  { acceptance_criterion_id: p9Ids[0], assertions: [{ id: "nested-json", expected: { a: 1, nested: { x: [true, null], y: "2" } }, actual: { nested: { y: "2", x: [true, null] }, a: 1 } }] },
  { acceptance_criterion_id: p9Ids[1], assertions: [{ id: "literal-argv", expected: "$(not-a-shell); literal", actual: "$(not-a-shell); literal" }] },
];

function p9Actor(state, { missing = false, tamper = false, attemptId = "p9-attempt-A" } = {}) {
  if (missing) return null;
  const stage = "build-code";
  const steps = JSON.parse(readFileSync(join(process.cwd(), "workflows", stage, "steps.json"), "utf8")).steps;
  const skills = yaml.load(readFileSync(join(process.cwd(), "workflows", stage, "skill-deps.yaml"), "utf8")).skills;
  const observation = execFileSync(process.execPath, ["--version"], { encoding: "utf8" }).trim();
  const events = [
    ...steps.map((step) => ({ subject_kind: "step", subject_id: step.step_slug, input_refs: step.entry_conditions.map(({ uri_or_path }) => uri_or_path) })),
    ...skills.map(({ name }) => ({ subject_kind: "skill", subject_id: name, trigger: true, executed: true, version: "fixture-host-v1", input_refs: [] })),
  ].map((entry, index) => ({
    ...entry, task_id: state.task.identity.taskId, stage, status: "incomplete",
    reason: "current host ran the fixture; stage quality work remains incomplete",
    result_summary: `observed local Node ${observation}`,
    evidence: [{ kind: "host-command", command: `${process.execPath} --version`, exit_code: 0, output: observation }],
    started_at_ms: 1000 + index * 2, ended_at_ms: 1001 + index * 2,
  }));
  const first = { subject_kind: "step", subject_id: steps[0].step_slug };
  const request = {
    project_name: state.task.identity.projectName, task_id: state.task.identity.taskId, task_path: state.task.taskPath,
    stage, attempt_id: attemptId, agent_run_id: "p9-agent-B",
    session: {
      host: "fixture-host", source_id: "fixture/p9-executor", source_family: "fixture", source_ref: "fixture-process:p9-executor",
      task_id: state.task.identity.taskId, status: "incomplete", events,
      spec_analyze: {
        packet: {}, implementation_material: "actual local command/service fixture",
        implementation_evidence_subject: first,
        evidence_subjects: Object.fromEntries(["decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace"].map((name) => [name, first])),
      },
    },
  };
  const outcome = publishCurrentWorkflowHubSession({ context: state.context, stage, attemptId, input: request });
  expect(outcome.value.status).toBe("incomplete");
  const authenticated = authenticateCurrentBuildCodeStageOutcome(state.context, { outcomeRef: outcome.ref, outcomeHash: outcome.sha256 });
  expect(authenticated.actor).toEqual({ source_kind: "workflowhub-session", source_id: "fixture/p9-executor", run_id: "p9-agent-B" });
  if (!tamper) return outcome;
  const value = structuredClone(outcome.value);
  value.producer.agent_run_id = "forged-current-actor";
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/stage-outcomes/build-code/${p9Hash(raw)}.json`;
  state.context.kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: p9Hash(raw), value };
}

function p9Fixture({ tier = "command", rows = p9Rows(), raw = null, rawBytes = null, exitCode = 0, timeoutMs = 3000, hanging = false, missingActor = false, tamperActor = false, independent = false, executionOverride, mutateMaterialDuringExecution = false, recordModel = "vnext-single-write" } = {}) {
  let output, execution, marker;
  const state = officialBrowserFixture({ recordModel, prepare: ({ root, candidate, artifacts }) => {
    marker = join(root, "observations");
    mkdirSync(marker);
    const runtimeScript = join(candidate.worktreeRoot, "acceptance-command.mjs");
    const serviceModule = join(candidate.worktreeRoot, "acceptance-service.mjs");
    output = raw ?? JSON.stringify({ entries: rows, status: "pass", result: "pass" });
    const program = `import { appendFileSync, writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(join(marker, "started.json"))}, JSON.stringify({pid:process.pid,cwd:process.cwd(),argv:process.argv.slice(2)}));
${mutateMaterialDuringExecution ? `appendFileSync(${JSON.stringify(join(candidate.worktreeRoot, "tasks.md"))}, '\\n<!-- post-command material mutation -->\\n');` : ""}
process.stdout.write(${rawBytes ? `Buffer.from(${JSON.stringify(Buffer.from(rawBytes).toString("hex"))},'hex')` : JSON.stringify(output)});
process.stderr.write('P9 actual stderr\\n');
process.exitCode=${exitCode};\n`;
    const hang = `import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(join(marker, "child.json"))},JSON.stringify({pid:process.pid}));
const child=spawn(process.execPath,['-e',${JSON.stringify(`const net=require('node:net'),fs=require('node:fs');const server=net.createServer();server.listen(0,'127.0.0.1',()=>fs.writeFileSync(${JSON.stringify(join(marker, "grandchild.json"))},JSON.stringify({pid:process.pid,port:server.address().port})));`)}],{stdio:'ignore'});
process.stdout.write('P9 hanging child started\\n');
setInterval(()=>{},1000);\n`;
    writeFileSync(runtimeScript, hanging ? hang : program);
    const service = `import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
export async function accept(input) {
 let count=0;const server=createServer((req,res)=>{count++;res.end(JSON.stringify({saved:input.value}));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 writeFileSync(${JSON.stringify(join(marker, "service.json"))},JSON.stringify({pid:process.pid,port}));
 try { const observed=await (await fetch('http://127.0.0.1:'+port)).json();
 writeFileSync(${JSON.stringify(join(marker, "service-data.json"))},JSON.stringify({observed,count,input}));
 return {entries:[{acceptance_criterion_id:'AC-EXE-001',assertions:[{id:'service-response',expected:{saved:input.value},actual:observed}]},{acceptance_criterion_id:'AC-EXE-002',assertions:[{id:'one-request',expected:1,actual:count}]}]};
 } finally { await new Promise(resolve=>server.close(resolve));writeFileSync(${JSON.stringify(join(marker, "service-cleanup.json"))},JSON.stringify({closed:true,port})); }
}\n`;
    writeFileSync(serviceModule, hanging ? `import { spawn } from 'node:child_process';\nimport { writeFileSync } from 'node:fs';\nexport async function accept() {\n${hang.split("\n").slice(2).join("\n")}\nawait new Promise(()=>{});\n}\n` : service);
    execution = tier === "command"
      ? { command: process.execPath, args: ["acceptance-command.mjs", "$(not-a-shell); literal"], timeout_ms: timeoutMs }
      : { module_ref: "acceptance-service.mjs", export_name: "accept", input: { value: { amount: 7, label: "fixture" } }, timeout_ms: timeoutMs };
    if (executionOverride) execution = executionOverride(execution);
    artifacts.writeAtomic("decision-log.md", independent ? '# Decision\n\n### D-001 — execution requires independent review\n- **high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}`\n' : "# Decision\n");
    artifacts.writeAtomic("decision-log.md", `${artifacts.read("decision-log.md")}\n## UI applicability\n\n\`\`\`json\n${JSON.stringify({ result: "non_ui", sources: {
      raw_requirement: { conclusion: "non_ui", reason: "fixture only runs local command/service" },
      project_inventory: { conclusion: "non_ui", reason: "fixture has no page consumer" },
      planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "fixture has no frontend changes" },
    } })}\n\`\`\`\n`);
    artifacts.writeAtomic("spec.md", `# Spec\n${independent ? "D-001 requires independent review of local service execution.\n" : ""}\n## Acceptance Criteria\n\n${p9Ids.map((id) => `- **${id}**：runtime JSON equality must match the declared fixture oracle.`).join("\n")}\n`);
    artifacts.writeAtomic("tasks.md", `# Tasks\n\n- **Template version**：\`plan-task.v4\`\n\n#### T019 — real acceptance\n- **ID**：T019\n- **ui_scope**：non_ui\n- **acceptance_role**：acceptance\n- **e2e_scope**：${independent ? "high_risk_user_visible" : "not_required"}\n${independent ? '- **e2e_decision_refs**：`["D-001"]`\n- **e2e_risk_decision_ref**：D-001\n' : ""}- **AC**：${p9Ids.join(", ")}\n- **acceptance_data**：\`${JSON.stringify([{ source: "descriptive source; never execute this", sample: "real local data", scenario: "two AC runtime oracle", tier, execution }])}\`\n`);
  } });
  state.context.workspace = openCurrentTaskWorkspace(state.task);
  const outcome = p9Actor(state, { missing: missingActor, tamper: tamperActor });
  return { ...state, marker, output, outputBytes: rawBytes ? Buffer.from(rawBytes) : Buffer.from(output), execution, outcome, tier, hanging };
}

async function p9Execute(state, signal) {
  return runOfficialStage("build-code", state.context, {
    attempt_id: state.outcome?.value?.attempt_id ?? "p9-attempt-A",
    receipts: state.outcome ? { stage_outcomes: state.outcome.ref } : {},
  }, {}, signal ? { requireStageOutcome: true, signal } : { requireStageOutcome: true });
}

function p9PerAc(state, result) {
  const aggregate = acceptanceExecutionSubjectFact(state, result);
  const refs = aggregate.execution_items.flatMap((item) => item.evidence_refs ?? []);
  const records = refs.map(({ ref, sha256 }) => {
    const raw = state.task.readRecord(ref);
    expect(p9Hash(raw)).toBe(sha256);
    const value = JSON.parse(raw);
    expect(value.schema_version).toBe("stage-quality-evidence.v1");
    expect(value.task_id).toBe(state.task.identity.taskId);
    expect(value.stage).toBe("build-code");
    expect(value.material_revision).toBe(state.context.kernel.currentVNextMaterialRevision());
    expect(value.snapshot_tree).toBe(state.context.kernel.currentVNextSnapshot().tree);
    expect(value.subject_fact.executor_actor).toEqual({ source_kind: "workflowhub-session", source_id: "fixture/p9-executor", run_id: "p9-agent-B" });
    expect(value.subject_fact.execution_binding).toEqual({ stage_outcome_ref: state.outcome.ref, stage_outcome_hash: state.outcome.sha256 });
    const execution = value.subject_fact.execution;
    expect(execution).toMatchObject({ tier: state.tier, timed_out: expect.any(Boolean), cancelled: expect.any(Boolean), cleanup: { status: "completed" } });
    expect(execution.timed_out && execution.cancelled).toBe(false);
    expect(execution.exit_code === null || Number.isInteger(execution.exit_code)).toBe(true);
    expect(execution.signal === null || typeof execution.signal === "string").toBe(true);
    for (const stream of ["stdout", "stderr"]) {
      const ref = execution[`${stream}_ref`];
      const hash = execution[`${stream}_hash`];
      expect(ref).toBe(`quality/evidence/stage-quality/build-code/acceptance-${stream}-${hash}.bin`);
      const bytes = state.task.readRecordBytes(ref);
      expect(Buffer.isBuffer(bytes)).toBe(true);
      expect(p9Hash(bytes)).toBe(hash);
      if (state.tier === "command" && !state.hanging) {
        expect(bytes).toEqual(stream === "stdout" ? state.outputBytes : Buffer.from("P9 actual stderr\n"));
      }
    }
    return value;
  });
  return { aggregate, records };
}

async function p9PortIsFree(port) {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

function p9KillOwnedProcesses(marker) {
  for (const name of ["grandchild.json", "child.json"]) {
    if (!existsSync(join(marker, name))) continue;
    const { pid } = JSON.parse(readFileSync(join(marker, name), "utf8"));
    try { process.kill(pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
  }
}

describe("P3 T009 real command and service acceptance", () => {
  it("projects the explicit argv and service contracts without executing source text", () => {
    for (const tier of ["command", "service"]) {
      const state = p9Fixture({ tier });
      const projection = projectAcceptanceExecutionData(state.context.artifacts.read("tasks.md"), { spec: state.context.artifacts.read("spec.md"), decisionLog: state.context.artifacts.read("decision-log.md") });
      expect(projection.status, projection.errors?.join("; ")).toBe("ready");
      expect(projection.scenarios[0].execution).toEqual(state.execution);
      expect(projection.scenarios[0].acceptance_criterion_ids).toEqual(p9Ids);
    }
  });

  it("executes two command ACs with incomplete authenticated actor and preserves literal argv plus raw output", async () => {
    const state = p9Fixture();
    const result = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(aggregate).toMatchObject({ execution_items: [{ status: "executed" }] });
    const { records } = p9PerAc(state, result);
    expect(records.map(({ subject }) => subject).sort()).toEqual(p9Ids);
    expect(records.every(({ subject_fact }) => subject_fact.status === "passed")).toBe(true);
    expect(records[0].subject_fact.assertions[0].result).toBe("passed");
    const observed = JSON.parse(readFileSync(join(state.marker, "started.json"), "utf8"));
    expect(observed.cwd).toBe(state.candidate.worktreeRoot);
    expect(observed.argv).toEqual(["$(not-a-shell); literal"]);
    expect(result.quality_status).toBe("incomplete");
    expect(JSON.stringify(records)).not.toContain('"run_id":"p9-attempt-A"');
  });

  it("rejects the cached pre-command identity when execution changes a build-code material", async () => {
    const state = p9Fixture({ mutateMaterialDuringExecution: true });
    const before = state.context.kernel.currentVNextContext({ fresh: true });

    await expect(p9Execute(state)).rejects.toMatchObject({
      code: "FORMAL_SNAPSHOT_MISMATCH",
      message: expect.stringContaining("FORMAL_SNAPSHOT_MISMATCH"),
    });

    const after = state.context.kernel.currentVNextContext({ fresh: true });
    // The fixture mutates a repository-root file, so the authenticated
    // four-material revision stays stable while the full Workspace snapshot
    // changes.  Publication must still reject the cached snapshot.
    expect(after.materialRevision).toBe(before.materialRevision);
    expect(after.snapshot.tree).not.toBe(before.snapshot.tree);
    expect(existsSync(join(state.marker, "started.json"))).toBe(true);
  });

  it("executes a real service module with one loopback request and releases its port", async () => {
    const state = p9Fixture({ tier: "service" });
    const result = await p9Execute(state);
    expect(acceptanceExecutionSubjectFact(state, result)).toMatchObject({ execution_items: [{ status: "executed" }] });
    const { records } = p9PerAc(state, result);
    expect(records).toHaveLength(2);
    expect(records.every(({ subject_fact }) => subject_fact.status === "passed")).toBe(true);
    const observed = JSON.parse(readFileSync(join(state.marker, "service-data.json"), "utf8"));
    expect(observed).toMatchObject({ count: 1, observed: { saved: { amount: 7, label: "fixture" } } });
    const cleanup = JSON.parse(readFileSync(join(state.marker, "service-cleanup.json"), "utf8"));
    expect(cleanup.closed).toBe(true);
    await p9PortIsFree(cleanup.port);
  });

  it("publishes the acceptance execution aggregate for the implementation/tests receipt branch", async () => {
    const state = p9Fixture();
    const implementation = writeOfficialComponentReceipt({
      task: state.task,
      workspace: state.context.workspace,
      stage: "build-code",
      component: "implementation",
      payload: {},
    });
    const tests = createCanonicalReceiptWriter({
      task: state.task,
      workspace: state.context.workspace,
      stage: "build-code",
      component: "build-code-test-capture",
    }).captureTests({
      command: "true",
      receiptRef: "quality/tests/normal-acceptance-execution.json",
      outputRef: "quality/tests/output/normal-acceptance-execution.output",
    });
    const result = await runOfficialStage("build-code", state.context, {
      attempt_id: "p9-attempt-A",
      receipts: {
        implementation: implementation.ref,
        tests: tests.receipt_ref,
        stage_outcomes: state.outcome.ref,
      },
    });

    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(aggregate).toMatchObject({ status: "passed", execution_items: [{ status: "executed" }] });
    expect(result.quality_fact_refs.some((ref) => {
      const fact = JSON.parse(state.task.readRecord(ref));
      return fact.kind === "acceptance_criterion" && fact.subject === "acceptance_execution" && fact.status === "passed";
    })).toBe(true);
  });

  it.each([
    ["array order", () => { const rows = p9Rows(); rows[0].assertions[0] = { id: "strict-array", expected: [1, 2], actual: [2, 1] }; return { rows }; }, "failed"],
    ["strict JSON type", () => { const rows = p9Rows(); rows[0].assertions[0] = { id: "strict-type", expected: 7, actual: "7" }; return { rows }; }, "failed"],
    ["nonzero child", () => ({ exitCode: 3 }), "failed"],
    ["empty stdout", () => ({ raw: "" }), "missing"],
    ["malformed JSON", () => ({ raw: "not-json" }), "missing"],
    ["non UTF8 stdout", () => ({ rawBytes: [0xff, 0xfe, 0x00, 0x80] }), "missing"],
    ["non-finite JSON number", () => ({ raw: '{"entries":[{"acceptance_criterion_id":"AC-EXE-001","assertions":[{"id":"finite-number","expected":1e400,"actual":null}]},{"acceptance_criterion_id":"AC-EXE-002","assertions":[{"id":"control","expected":1,"actual":1}]}]}' }), "missing"],
    ["empty entries", () => ({ rows: [] }), "missing"],
    ["empty assertions", () => { const rows = p9Rows(); rows[0].assertions = []; return { rows }; }, "missing"],
    ["missing AC", () => ({ rows: p9Rows().slice(0, 1) }), "missing"],
    ["unknown AC", () => ({ rows: [...p9Rows(), { ...p9Rows()[0], acceptance_criterion_id: "AC-UNKNOWN" }] }), "missing"],
    ["duplicate AC", () => ({ rows: [...p9Rows(), p9Rows()[0]] }), "missing"],
    ["duplicate assertion id", () => { const rows = p9Rows(); rows[0].assertions.push(rows[0].assertions[0]); return { rows }; }, "missing"],
  ])("retains actual failed/missing evidence for %s despite child self-reported pass", async (_label, options, expectedStatus) => {
    const state = p9Fixture(options());
    const result = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    // Unavailable-before-execution is not the targeted failure path.
    expect(aggregate).toMatchObject({ execution_items: [{ status: "failed" }] });
    expect(existsSync(join(state.marker, "started.json"))).toBe(true);
    const { records } = p9PerAc(state, result);
    expect(records.length).toBeGreaterThan(0);
    expect(records.some(({ subject_fact }) => subject_fact.status === expectedStatus)).toBe(true);
    expect(aggregate.status).not.toBe("passed");
  });

  it.each([["absent producer", { missingActor: true }], ["rehash actor with old proof", { tamperActor: true }]])("never starts a command with %s", async (_label, options) => {
    const state = p9Fixture(options);
    await expect(p9Execute(state)).rejects.toMatchObject({
      code: "MATERIAL_INCOMPLETE",
      message: expect.stringContaining(options.missingActor ? "stage_outcome_missing" : "stage_outcome_invalid"),
    });
    expect(existsSync(join(state.marker, "started.json"))).toBe(false);
  });

  it("timeout terminates the actual child and grandchild and releases the listening port", async () => {
    const state = p9Fixture({ hanging: true, timeoutMs: 800 });
    try {
      const result = await p9Execute(state);
      const aggregate = acceptanceExecutionSubjectFact(state, result);
      expect(aggregate).toMatchObject({ execution_items: [{ status: "failed" }] });
      expect(existsSync(join(state.marker, "grandchild.json"))).toBe(true);
      for (const name of ["child.json", "grandchild.json"]) {
        const { pid } = JSON.parse(readFileSync(join(state.marker, name), "utf8"));
        expect(() => process.kill(pid, 0)).toThrow();
      }
      const { port } = JSON.parse(readFileSync(join(state.marker, "grandchild.json"), "utf8"));
      await p9PortIsFree(port);
      const { records } = p9PerAc(state, result);
      expect(records.some(({ subject_fact }) => subject_fact.status === "missing")).toBe(true);
      expect(records[0].subject_fact.execution).toMatchObject({ timed_out: true, cancelled: false });
    } finally { p9KillOwnedProcesses(state.marker); }
  });

  it.each(["command", "service"])("private AbortSignal cancels a running %s process group after readiness", async (tier) => {
    const state = p9Fixture({ tier, hanging: true, timeoutMs: 15000 });
    const controller = new AbortController();
    let settled = false;
    const running = p9Execute(state, controller.signal).finally(() => { settled = true; });
    try {
      const deadline = Date.now() + 8000;
      while (!existsSync(join(state.marker, "grandchild.json")) && !settled && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(existsSync(join(state.marker, "grandchild.json")), "the actual child must become ready before cancellation").toBe(true);
      controller.abort(new Error("fixture active cancellation"));
      const result = await running;
      expect(acceptanceExecutionSubjectFact(state, result).status).not.toBe("passed");
      for (const name of ["child.json", "grandchild.json"]) {
        const { pid } = JSON.parse(readFileSync(join(state.marker, name), "utf8"));
        expect(() => process.kill(pid, 0)).toThrow();
      }
      const { port } = JSON.parse(readFileSync(join(state.marker, "grandchild.json"), "utf8"));
      await p9PortIsFree(port);
      const { records } = p9PerAc(state, result);
      expect(records.some(({ subject_fact }) => subject_fact.status === "missing")).toBe(true);
      expect(records[0].subject_fact.execution).toMatchObject({ timed_out: false, cancelled: true });
    } finally {
      controller.abort();
      p9KillOwnedProcesses(state.marker);
      await running;
    }
  }, 30000);

});

function p9ConfigureReview(state, { sameSource = false, mixedSources = false, onlySameCompletes = false } = {}) {
  const home = join(state.root, "home");
  const configDirectory = join(home, ".config", "workflowhub");
  const attachmentRoot = join(state.root, "packets");
  const brokerConfig = join(state.root, "broker.json");
  mkdirSync(configDirectory, { recursive: true });
  mkdirSync(attachmentRoot, { recursive: true });
  writeFileSync(brokerConfig, JSON.stringify({
    version: 4, engine_version: "1.2.0", tiers: [["opencode/reviewer", ...(mixedSources ? ["opencode/independent"] : [])], ["codex/host"]],
    providers: {
      "codex/host": { enabled: true, source_id: "codex/p9-host" },
      "opencode/reviewer": { enabled: true, source_id: sameSource || mixedSources ? "fixture/p9-executor" : "opencode/p9-reviewer" },
      ...(mixedSources ? { "opencode/independent": { enabled: true, source_id: "opencode/p9-independent" } } : {}),
    },
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(configDirectory, "config.json"), JSON.stringify({
    task_dir: state.root,
    third_review: { command: [process.execPath, "/fixture/no-live-broker.mjs"], config: brokerConfig, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "verify-code": { initial: ["opencode/reviewer", ...(mixedSources ? ["opencode/independent"] : [])], mode: "single_round", minimum_heterologous: 1 } } },
  }));
  return { rounds: 0, dispatches: 0, bundles: [], requestMaterials: [], runtimeId: "p9-one-ordinary-runtime", onlySameCompletes };
}

async function p9PublicReview(state, trace, reviewedExecution, extra = {}) {
  const { resultMutation = null, ...requestExtra } = extra;
  const request = {
    stage: "verify-code", host_provider: "codex/host",
    materials: { implementation: "inspect actual local acceptance service implementation", tests: "two JSON oracle assertions" },
    ...(reviewedExecution ? { reviewed_execution: reviewedExecution } : {}), ...requestExtra,
  };
  const input = join(state.root, "ordinary-review-input.json");
  writeFileSync(input, JSON.stringify({ request }));
  return withRuntimeEnvironment(state, () => stageRuntimeCliMain([
    "review", "--action=record", "--stage=verify-code", "--project=WorkflowHub", `--task=${state.task.identity.taskId}`, `--input=${input}`,
  ], {
    cwd: state.candidate.worktreeRoot,
    services: { runReviewRound: async (prepared) => {
      trace.rounds += 1;
      trace.requestMaterials.push(structuredClone(prepared.materials));
      const result = await runSimpleReview(prepared, { client: { async runGroup(input) {
        trace.dispatches += 1;
        const manifest = JSON.parse(readFileSync(join(input.materials.bundleRoot, "manifest.json"), "utf8"));
        const bytes = Object.fromEntries(manifest.files.map(({ path }) => [path, readFileSync(join(input.materials.bundleRoot, path), "utf8")]));
        trace.bundles.push({ materialId: input.materials.materialId, bytes });
        const trusted = loadTrustedThirdReviewConfig({ requestedStage: "verify-code" });
        const route = resolveTrustedReviewRoute(trusted.whReview, "verify-code");
        const selected = selectTrustedReviewProviderSelection(trusted.config, "codex/host", route);
        return {
          runtimeId: trace.runtimeId, material_id: input.materials.materialId, outcome: "completed",
          providers: selected.providers.map((provider) => {
            const failed = trace.onlySameCompletes && provider === "opencode/independent";
            return { provider, status: failed ? "failed" : "completed", identity: { provider, adapter: "opencode", ...selected.provider_identities[provider] },
              error: failed ? { code: "PROCESS_FAILED", message: "actual independent fixture member failed" } : null,
              output: failed ? null : JSON.stringify({ findings: [] }), timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null };
          }),
        };
      } } });
      return typeof resultMutation === "function" ? resultMutation(result) : result;
    } },
  }));
}

function p9ExecutionInput(state, result) {
  const qualityFactRef = result.quality_fact_refs.find((ref) => {
    const value = JSON.parse(state.task.readRecord(ref));
    return value.kind === "acceptance_criterion" && value.subject === "acceptance_execution";
  });
  const fact = JSON.parse(state.task.readRecord(qualityFactRef));
  expect(fact.status, "ordinary review requires the actual runtime execution result").toBe("passed");
  const wrapper = JSON.parse(state.task.readRecord(fact.evidence[0].ref));
  const aggregate = wrapper.refs[0];
  expect(aggregate.ref).toBe(`quality/evidence/stage-quality/build-code/acceptance_execution-${aggregate.sha256}.json`);
  expect(p9Hash(state.task.readRecord(aggregate.ref))).toBe(aggregate.sha256);
  return { ref: aggregate.ref, sha256: aggregate.sha256, quality_fact_ref: qualityFactRef };
}

function p9Verify(state, receipts) {
  return runOfficialStage("verify-code", {
    ...state.context, stage: "verify-code", workflowRunId: state.context.kernel.deriveStageWorkflowRunId("verify-code"),
  }, { receipts });
}

async function p9Confirm(state, reviewRef, reply = "I reviewed the actual execution and accept this result") {
  return withRuntimeEnvironment(state, () => stageRuntimeCliMain([
    "confirm", "--action=decision", "--stage=verify-code", "--project=WorkflowHub", `--task=${state.task.identity.taskId}`,
    "--decision=accepted", `--attempt=${reviewRef}`, `--reply-text=${reply}`, "--step-slug=confirm-execution-result",
  ], { cwd: state.candidate.worktreeRoot }));
}

function p9Fact(state, result, subject) {
  const ref = result.quality_fact_refs.find((entry) => JSON.parse(state.task.readRecord(entry)).subject === subject);
  const raw = state.task.readRecord(ref);
  return { ...JSON.parse(raw), ref, sha256: p9Hash(raw) };
}

function p9Fresh(state, fact) {
  return evaluateFactFreshness(fact, {
    snapshot_tree: state.context.kernel.currentVNextSnapshot().tree,
    material_revision: state.context.kernel.currentVNextMaterialRevision(),
    material_scope_revisions: { [fact.stage]: stageMaterialScopeRevision(fact.stage, Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((file) => [file, state.context.artifacts.read(file)]))) },
  }, {
    read: (ref) => ref.endsWith(".bin") ? state.task.readRecordBytes(ref) : state.task.readRecord(ref),
    workspaceRoot: state.candidate.worktreeRoot, taskId: state.task.identity.taskId,
  });
}

describe("P3 T009 ordinary public review consumes actual execution", () => {
  it("rejects an unauthenticated explicit execution before the ordinary provider dispatch", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state);
    const bogus = { ref: `quality/evidence/stage-quality/build-code/acceptance_execution-${"a".repeat(64)}.json`, sha256: "a".repeat(64), quality_fact_ref: `quality/facts/${"b".repeat(64)}.json` };
    let diagnostic;
    try { diagnostic = await p9PublicReview(state, trace, bogus); }
    catch (error) { diagnostic = { error: error.message }; }
    expect(trace.rounds, JSON.stringify(diagnostic)).toBe(0);
    expect(diagnostic?.error?.message ?? diagnostic?.error ?? "", "rejection must concern execution authentication, not CLI or provider configuration").toMatch(/reviewed_execution|acceptance_execution|quality\/facts|execution.*(?:auth|ref|binding)|(?:auth|ref|binding).*execution/i);
    expect(trace.dispatches).toBe(0);
    expect(state.task.listCanonicalReviewResultRefs()).toHaveLength(0);
  });

  it("rejects a pre-dispatch-shaped result whose material id is not the frozen provider bundle", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state);
    const execution = await p9Execute(state);
    const input = p9ExecutionInput(state, execution);
    await expect(p9PublicReview(state, trace, input, {
      resultMutation: (result) => ({
        ...result,
        status: "unavailable",
        material_id: "f".repeat(64),
        provider_results: [],
        findings: [],
        error: { code: "REVIEW_INPUT_TOO_LARGE", message: "forged pre-dispatch shape" },
      }),
    })).rejects.toThrow(/material_id does not match the authenticated request material|execution review result does not match the frozen provider bundle/);
    expect(trace.rounds).toBe(1);
    expect(trace.dispatches).toBe(1);
    expect(state.task.listCanonicalReviewResultRefs()).toHaveLength(0);
  });

  it("dispatches once, freezes the actual execution/oracle bundle and consumes post-review typed confirmation", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state);
    const execution = await p9Execute(state);
    const input = p9ExecutionInput(state, execution);
    const beforeAttempts = state.task.listCanonicalReviewAttemptRefs();
    const review = await p9PublicReview(state, trace, input);
    expect(trace.rounds).toBe(1);
    expect(trace.dispatches).toBe(1);
    expect(state.task.listCanonicalReviewAttemptRefs().filter((ref) => !beforeAttempts.includes(ref))).toEqual([review.attempt_ref]);
    const original = state.task.readRecord(review.result_ref);
    const record = JSON.parse(original);
    expect(record.e2e_binding.reviewed_execution).toMatchObject({ ref: input.ref, sha256: input.sha256, actor: { run_id: "p9-agent-B", source_id: "fixture/p9-executor" } });
    expect(record.e2e_binding.reviewer_actor).toMatchObject({ source_id: "opencode/p9-reviewer", run_id: trace.runtimeId });
    const providerBytes = Object.values(trace.bundles[0].bytes).join("\n");
    expect(providerBytes).toContain("acceptance_execution");
    expect(providerBytes).toContain("service-response");
    expect(providerBytes).toContain("one-request");
    expect(providerBytes).toContain("expected");
    expect(providerBytes).toContain("actual");
    const providerStrings = [];
    const collectProviderStrings = (value) => {
      if (typeof value === "string") {
        providerStrings.push(value);
        try { const parsed = JSON.parse(value); if (parsed && typeof parsed === "object") collectProviderStrings(parsed); } catch { /* literal source remains visible above */ }
      } else if (Array.isArray(value)) value.forEach(collectProviderStrings);
      else if (value && typeof value === "object") Object.values(value).forEach(collectProviderStrings);
    };
    Object.values(trace.bundles[0].bytes).forEach(collectProviderStrings);
    const expectProviderContains = (originalBytes, label) => {
      const redacted = redactProviderHostPaths(originalBytes);
      expect(providerStrings.some((bytes) => bytes.includes(redacted)), `actual provider bundle omitted ${label}`).toBe(true);
    };
    for (const file of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
      expectProviderContains(state.context.artifacts.read(file), file);
    }
    const serviceSource = readFileSync(join(state.candidate.worktreeRoot, "acceptance-service.mjs"), "utf8");
    for (const fragment of ["export async function accept(input)", "let count=0;const server=createServer", "const observed=await (await fetch"]) {
      expect(serviceSource).toContain(fragment);
      expectProviderContains(fragment, "real service implementation/diff");
    }
    expectProviderContains(state.task.readRecord(input.ref), "actual acceptance_execution aggregate bytes");
    const executionAggregate = JSON.parse(state.task.readRecord(input.ref));
    for (const item of executionAggregate.subject_fact.execution_items) {
      for (const { ref } of item.evidence_refs) expectProviderContains(state.task.readRecord(ref), `actual per-AC bytes ${ref}`);
    }
    expect(record.material_id).toBe(trace.bundles[0].materialId);
    const frozen = record.e2e_binding.frozen_material;
    const frozenRaw = state.task.readRecord(frozen.ref);
    expect(p9Hash(frozenRaw)).toBe(frozen.sha256);
    expect(frozen.provider_input_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(frozen.provider_input_sha256).not.toBe(record.material_id);
    expect(record.e2e_binding).not.toHaveProperty("confirmation");
    const unconfirmed = await p9Verify(state, { review: review.result_ref });
    expect(p9Fact(state, unconfirmed, "e2e_acceptance").status).not.toBe("passed");
    const confirmation = await p9Confirm(state, review.result_ref);
    expect(confirmation.value.subject_ref).toBe(review.result_ref);
    const confirmed = await p9Verify(state, { review: review.result_ref, confirmation: confirmation.ref });
    const fact = p9Fact(state, confirmed, "e2e_acceptance");
    expect(fact.status).toBe("passed");
    expect(p9Fresh(state, fact).status).toBe("current");
    expect(trace.dispatches).toBe(1);
    expect(state.task.readRecord(review.result_ref)).toBe(original);
    const repeated = await p9PublicReview(state, trace, input);
    expect(repeated).toMatchObject({ reused: true, result_ref: review.result_ref, attempt_ref: review.attempt_ref });
    expect(trace.dispatches).toBe(1);

    // Each corruption retains the outer published refs. The consumer must read
    // the actual nested original; the baseline is restored between cases.
    const aggregate = JSON.parse(state.task.readRecord(input.ref));
    const perAcRef = aggregate.subject_fact.execution_items[0].evidence_refs[0].ref;
    const perAc = JSON.parse(state.task.readRecord(perAcRef));
    const proofRef = state.outcome.value.step_outcomes[0].evidence_refs[0].ref;
    const corruptions = [
      ["deleted stdout", perAc.subject_fact.execution.stdout_ref, null, "missing"],
      ["changed stdout bytes", perAc.subject_fact.execution.stdout_ref, Buffer.from([0xff, 0x00, 0x80]), "stale"],
      ["changed actor proof", proofRef, Buffer.from("{}\n"), "stale"],
      ["changed actor", perAcRef, Buffer.from(JSON.stringify({ ...perAc, subject_fact: { ...perAc.subject_fact, executor_actor: { ...perAc.subject_fact.executor_actor, run_id: "wrong-actor" } } })), "stale"],
      ["changed revision", perAcRef, Buffer.from(JSON.stringify({ ...perAc, material_revision: `revision-${"f".repeat(64)}` })), "stale"],
      ["changed frozen material", frozen.ref, Buffer.from("{}\n"), "stale"],
      ["missing confirmation fact", confirmation.quality_fact_ref, null, "missing"],
    ];
    for (const [label, ref, replacement, expected] of corruptions) {
      const path = join(state.task.taskPath, ref);
      const originalBytes = readFileSync(path);
      try {
        if (replacement === null) rmSync(path); else writeFileSync(path, replacement);
        expect(p9Fresh(state, fact).status, label).toBe(expected);
      } finally { writeFileSync(path, originalBytes); }
    }
    expect(p9Fresh(state, fact).status).toBe("current");
    expect(trace.dispatches).toBe(1);
  });

  it.each(["same source", "wrong confirmation subject", "old review after source change", "ordinary result alias"])("keeps %s outside current independent acceptance", async (condition) => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state, { sameSource: condition === "same source" });
    const execution = await p9Execute(state);
    const review = await p9PublicReview(state, trace, p9ExecutionInput(state, execution));
    expect(trace.dispatches).toBeLessThanOrEqual(1);
    if (!review.result_ref) {
      expect(condition).toBe("same source");
      expect(trace.rounds).toBe(0);
      expect(trace.dispatches).toBe(0);
      expect(review.error?.message ?? "").toMatch(/source|independent|actor/i);
      return;
    }
    let selectedReview = review.result_ref;
    if (condition === "ordinary result alias") {
      selectedReview = `quality/reviews/results/${"c".repeat(64)}.json`;
      state.context.kernel.publishCanonicalRecord(selectedReview, state.task.readRecord(review.result_ref));
    }
    const confirmation = await p9Confirm(state, condition === "wrong confirmation subject"
      ? `quality/reviews/results/${"c".repeat(64)}.json` : selectedReview);
    if (condition === "old review after source change") {
      writeFileSync(join(state.candidate.worktreeRoot, "README.md"), "actual implementation source changed after review\n");
    }
    const result = await p9Verify(state, { review: selectedReview, confirmation: confirmation.ref });
    expect(p9Fact(state, result, "e2e_acceptance").status).not.toBe("passed");
  });

  it.each([false, true])("retains the whole selected round and derives an actor only from independent completed members (onlySameCompletes=%s)", async (onlySameCompletes) => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state, { mixedSources: true, onlySameCompletes });
    const execution = await p9Execute(state);
    const review = await p9PublicReview(state, trace, p9ExecutionInput(state, execution));
    expect(trace.rounds).toBe(1);
    expect(trace.dispatches).toBe(1);
    const attempt = JSON.parse(state.task.readRecord(review.attempt_ref));
    expect(attempt.provider_attempts.map((entry) => entry.provider)).toEqual(["opencode/reviewer", "opencode/independent"]);
    expect(attempt.review_policy.minimum_heterologous).toBe(1);
    const record = JSON.parse(state.task.readRecord(review.result_ref));
    if (onlySameCompletes) {
      expect(record).not.toHaveProperty("e2e_binding");
      expect(attempt.provider_attempts[1]).toMatchObject({ status: "failed", error: { code: "PROCESS_FAILED" } });
    } else {
      expect(record.e2e_binding.reviewer_actor).toEqual({ source_kind: "review_provider", source_id: "opencode/p9-independent", run_id: trace.runtimeId });
    }
  });

  it("runs the reversed dependency order once: missing execution remains missing, then actual execution becomes reviewable", async () => {
    const state = p9Fixture({ tier: "service", independent: true, missingActor: true });
    await expect(p9Execute(state)).rejects.toMatchObject({ code: "MATERIAL_INCOMPLETE", message: expect.stringContaining("stage_outcome_missing") });
    expect(existsSync(join(state.marker, "service-data.json"))).toBe(false);
    state.outcome = p9Actor(state, { attemptId: "p9-attempt-B" });
    const second = await p9Execute(state);
    const input = p9ExecutionInput(state, second);
    expect(input.ref).toMatch(/acceptance_execution-/);
    expect(JSON.parse(readFileSync(join(state.marker, "service-data.json"), "utf8")).count).toBe(1);
  }, 60_000);
});
