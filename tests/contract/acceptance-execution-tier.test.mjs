import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { projectAcceptanceExecutionData } from "../../runtime/stage/stage-content-contracts.mjs";
import { acceptanceExecutionFacts } from "../../runtime/stage/stage-handlers.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

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

function officialBrowserFixture() {
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
      created_at: "2026-08-30T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
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
- **acceptance_data**：\`[{"source":"qa/browser","sample":"real-page","scenario":"save settings","tier":"browser"}]\`
`);
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

async function runOfficialBrowserAcceptance({ mutateStored, mutatePayload, publish = true } = {}) {
  const state = officialBrowserFixture();
  const trace = { calls: 0 };
  const result = await runOfficialStage("build-code", state.context, { attempt_id: "build-code-attempt", receipts: {} }, {
    ...(publish ? {
      runControlledUiQa: async (input) => {
        trace.calls += 1;
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
      },
    } : {}),
  });
  return { state, trace, result };
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

  it("uses the trusted browser capability during the normal public run:execute route without a browser input field", async () => {
    const state = officialBrowserFixture();
    const inputPath = join(state.candidate.worktreeRoot, "run-input.json");
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
          const stored = publishBrowserAttachments({
            task: state.task,
            kernel: state.context.kernel,
            payload: browserPayload(input),
          });
          const raw = `${JSON.stringify(stored)}\n`;
          const evidenceHash = createHash("sha256").update(raw).digest("hex");
          const evidenceRef = `quality/evidence/browser-qa/${evidenceHash}.json`;
          state.context.kernel.publishCanonicalRecord(evidenceRef, raw);
          return {
            invocation_id: input.invocation_id,
            payload: { ...stored, evidence_ref: evidenceRef, evidence_hash: evidenceHash },
            evidence_ref: evidenceRef,
            evidence_hash: evidenceHash,
          };
        },
      },
    }));

    expect(result.quality_fact_refs).toEqual(expect.any(Array));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      task_id: "browser-acceptance",
      stage: "build-code",
      attempt_id: "runtime-browser-attempt",
      project_name: "WorkflowHub",
      task_path: state.task.taskPath,
      worktree_root: state.candidate.worktreeRoot,
    });
  });

  it("keeps verify-code browser execution unavailable when current canonical data identity does not bind the declared scenario", async () => {
    const { state, result } = await runOfficialBrowserAcceptance();
    publishCurrentExecutionWithMismatchedDataIdentity(state, result);
    const verify = await runOfficialStage("verify-code", {
      ...state.context,
      stage: "verify-code",
      workflowRunId: state.context.kernel.deriveStageWorkflowRunId("verify-code"),
    }, { attempt_id: "verify-data-binding", receipts: {} });

    expect(e2eAcceptanceSubjectFact(state, verify)).toMatchObject({
      status: "missing",
      evidence_refs: [],
    });
  });

  it.each([
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
    ["has no controlled QA adapter", { publish: false }],
  ])("keeps browser acceptance unavailable when it %s", async (_caseName, options) => {
    const { state, trace, result } = await runOfficialBrowserAcceptance(options);
    expect(trace.calls).toBe(options.publish === false ? 0 : 1);
    expect(acceptanceExecutionSubjectFact(state, result)).toMatchObject({
      status: "missing",
      execution_items: [expect.objectContaining({ tier: "browser", status: "unavailable", evidence_refs: [] })],
    });
  });
});
