import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createServer } from "node:net";
import yaml from "js-yaml";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { authenticateCurrentBuildCodeStageOutcome, readCurrentE2eAcceptanceEvidence, runOfficialStage, runStage } from "../../runtime/stage/stage-runner.mjs";
import { STAGE_PREDICATES, stageMaterialScopeRevision } from "../../runtime/stage/completion-predicates.mjs";
import { projectAcceptanceExecutionData } from "../../runtime/stage/stage-content-contracts.mjs";
import { acceptanceExecutionFacts } from "../../runtime/stage/stage-handlers.mjs";
import { createCanonicalReceiptWriter, writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { deriveAcceptanceExecutionAssertions } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { publishCurrentWorkflowHubSession } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";
import { createQualityFact } from "../../runtime/evidence/quality-fact.mjs";
import { authenticateAcceptanceExecutionAggregate, authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { redactProviderHostPaths } from "../../skills/wh-review/scripts/review-materials.mjs";
import { authenticatedEvidenceDigest, reviewPacketMaterialId } from "../../runtime/review/review-packet-identity.mjs";
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
- **acceptance_data**：\`[{"source":"qa/browser","sample":"real page fixture","scenario":"user saves settings","tier":"browser"},{"source":"service/api","sample":"real request","scenario":"service persists settings","tier":"service","execution":{"module_ref":"tests/accept-service.mjs","export_name":"accept","input":{"sample":"real request"},"timeout_ms":5000}},{"source":"command/cli","sample":"real task store","scenario":"command verifies evidence","tier":"command","execution":{"command":"node","args":["tests/accept-command.mjs"],"timeout_ms":5000}}]\`
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

function officialBrowserFixture({ prepare, acceptanceData, recordModel = "vnext-single-write", activationCohort = "pre" } = {}) {
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
      ...(activationCohort === "post" ? { activation_cohort: "post" } : {}),
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
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

// P11/T022 v2 uses runOfficialStage's real privateAcceptanceScenario producer.
// The schema-shaped adapter is a protocol fixture; no page or service is run.
function postBrowserSourceFixture({ scenarios = [{ source: "CASE-001", sample: "protocol fixture", scenario: "save settings", tier: "browser" }],
  declareAcceptance = true, acIds = ["AC-EXE-001"], attemptId = "p11-post-browser-attempt" } = {}) {
  const state = officialBrowserFixture({ activationCohort: "post", prepare: ({ artifacts, candidate }) => {
    if (acIds.length > 1) artifacts.writeAtomic("spec.md", `# Spec\n\n## Acceptance Criteria\n\n${acIds.map((id) => `- **${id}**：browser acceptance.`).join("\n")}\n`);
    const source = { conclusion: "ui", reason: "contract fixture declares a page consumer; real consumer remains unverified" };
    artifacts.writeAtomic("decision-log.md", `${artifacts.read("decision-log.md")}\n## UI applicability\n\n\`\`\`json\n${JSON.stringify({ result: "ui", sources: {
      raw_requirement: source, project_inventory: source, planned_or_changed_frontend_fact: source,
    } })}\n\`\`\`\n`);
    artifacts.writeAtomic("phases/index.md", "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n");
    artifacts.writeAtomic("phases/P1.md", `# Phase P1\n\n## L1 — acceptance\n\n### T022 — browser consumer\n\n- **Source / FR / AC**：R-001 / FR-001 / ${acIds.join(" / ")}\n${declareAcceptance ? `- **acceptance_role**：acceptance\n- **ui_scope**：ui\n- **acceptance_data**：\`${JSON.stringify(scenarios)}\`\n` : ""}`);
    if (scenarios.some((entry) => entry.tier === "command")) {
      writeFileSync(join(candidate.worktreeRoot, "acceptance-command.mjs"),
        'process.stdout.write(JSON.stringify({entries:[{acceptance_criterion_id:"AC-EXE-001",assertions:[{id:"command-proof",expected:1,actual:1}]}]}));\n');
    }
  } });
  const sample = browserPayload({ task_id: state.task.identity.taskId, stage: "build-code", attempt_id: attemptId,
    invocation_id: "binding-only", material_revision: state.context.kernel.currentVNextMaterialRevision(),
    snapshot_tree: state.context.kernel.currentVNextSnapshot().tree, acceptance_criterion_ids: ["AC-EXE-001"] });
  const contractFacts = {
    impact: "ui", impact_inputs: { raw_requirement: "ui" },
    component_quality_map: [{ action: "reuse", component: "Settings", real_consumer: "settings-page",
      state_owner: "Settings", typed_view_model: "SettingsViewModel", css_token_owner: "Settings tokens",
      story_or_test_update: "protocol fixture only" }],
    qa_binding: {
      attempt_id: attemptId, acceptance_criterion_id: "AC-EXE-001",
      design_identity: sample.design_identity, experience_identity: sample.experience_identity,
      service_identity: sample.service_identity, api_identity: sample.api_identity,
      dto_identity: sample.dto_identity, browser_profile: sample.browser_profile,
      route: sample.route, page: sample.page, scenario: sample.scenario,
    },
  };
  return { state, attemptId, contractFacts };
}

async function runPostBrowserSource(options = {}) {
  const { state, attemptId, contractFacts } = postBrowserSourceFixture(options);
  const calls = [];
  const oldBrowser = options.browserFault === "old-receipt"
    ? publishControlledBrowserResult(state, {
      task_id: state.task.identity.taskId, stage: "build-code", attempt_id: attemptId,
      invocation_id: "previous-browser-invocation",
      material_revision: state.context.kernel.currentVNextMaterialRevision(),
      snapshot_tree: state.context.kernel.currentVNextSnapshot().tree,
      acceptance_criterion_ids: ["AC-EXE-001"],
      acceptance_scenario: { source: "CASE-001", sample: "protocol fixture", scenario: "save settings", tier: "browser" },
    }, { mutateStored: (stored) => ({ ...stored, data_identity: { ...stored.data_identity,
      source: "CASE-001", dataset_id: "protocol fixture" } }) })
    : null;
  const receipts = {};
  if (["valid", "invalid-implementation", "invalid-tests", "invalid-stale-snapshot", "invalid-semantic-tests",
    "invalid-missing-output", "invalid-output-hash", "invalid-implementation-head", "invalid-test-producer"].includes(options.receiptMode)) {
    state.context.workspace = openCurrentTaskWorkspace(state.task);
    const implementation = writeOfficialComponentReceipt({ task: state.task, workspace: state.context.workspace,
      stage: "build-code", component: "implementation", payload: {} });
    const tests = createCanonicalReceiptWriter({ task: state.task, workspace: state.context.workspace,
      stage: "build-code", component: "build-code-test-capture" }).captureTests({ command: "true",
      receiptRef: "quality/tests/p11-browser-source.json", outputRef: "quality/tests/output/p11-browser-source.txt" });
    receipts.implementation = implementation.ref;
    receipts.tests = tests.receipt_ref;
  }
  if (options.receiptMode === "invalid-implementation") receipts.implementation = "quality/evidence/implementation/missing.json";
  if (options.receiptMode === "invalid-tests") receipts.tests = "quality/tests/missing.json";
  if (options.receiptMode === "invalid-stale-snapshot") {
    writeFileSync(join(state.context.workspace.worktreeRoot, "changed-after-receipt.txt"), "new source after receipt\n");
  }
  if (options.receiptMode === "invalid-semantic-tests") {
    const stored = JSON.parse(state.task.readRecord(receipts.tests));
    receipts.tests = publishContentAddressedJson(state.context.kernel, "quality/tests", {
      ...stored, command_hash: "0".repeat(64),
    }).ref;
  }
  if (options.receiptMode === "invalid-missing-output" || options.receiptMode === "invalid-output-hash") {
    const stored = JSON.parse(state.task.readRecord(receipts.tests));
    receipts.tests = publishContentAddressedJson(state.context.kernel, "quality/tests", {
      ...stored,
      ...(options.receiptMode === "invalid-missing-output"
        ? { output_ref: "quality/tests/output/absent-original-output" }
        : { output_hash: "0".repeat(64) }),
    }).ref;
  }
  if (options.receiptMode === "invalid-implementation-head") {
    const stored = JSON.parse(state.task.readRecord(receipts.implementation));
    receipts.implementation = publishContentAddressedJson(state.context.kernel, "quality/evidence/implementation", {
      ...stored, snapshot_head: "0".repeat(40),
    }).ref;
  }
  if (options.receiptMode === "invalid-test-producer") {
    const stored = JSON.parse(state.task.readRecord(receipts.tests));
    receipts.tests = publishContentAddressedJson(state.context.kernel, "quality/tests", {
      ...stored, producer: { ...stored.producer, component: "arbitrary" },
    }).ref;
  }
  let result;
  try { result = await runOfficialStage("build-code", state.context,
    { attempt_id: attemptId, receipts, contract_facts: contractFacts }, {
      runControlledUiQa: async (input) => {
        const normalized = { ...input, acceptance_criterion_ids: input.acceptance_criterion_ids ?? [input.acceptance_criterion_id ?? "AC-EXE-001"] };
        const published = publishControlledBrowserResult(state, normalized, { mutateStored: (stored) => ({
          ...stored,
          ...(input.acceptance_scenario ? { data_identity: { ...stored.data_identity,
            source: input.acceptance_scenario.source, dataset_id: input.acceptance_scenario.sample } } : {}),
          ...(options.fixtureOnly ? { fixture: { ...stored.fixture, fixture_only: true } } : {}),
          ...(options.browserFault === "task" ? { task_id: "other-task" } : {}),
          ...(options.browserFault === "tree" ? { snapshot_tree: "0".repeat(40) } : {}),
          ...(options.browserFault === "attempt" ? { attempt_id: "older-attempt" } : {}),
          ...(options.browserFault === "blocked" || (options.browserFault === "second-blocked" && input.acceptance_scenario?.source === "CASE-002") ? { result: "blocked", failure_reason: "fixture browser was blocked",
            test: { ...stored.test, exit_code: 1 } } : {}),
        }) });
        const returned = options.browserFault === "old-receipt" ? oldBrowser
          : options.browserFault === "ref" ? { ...published, evidence_ref: `quality/evidence/browser-qa/${"0".repeat(64)}.json` }
            : options.browserFault === "hash" ? { ...published, evidence_hash: "0".repeat(64) }
              : published;
        calls.push({ input, ref: returned.evidence_ref, sha256: returned.evidence_hash });
        return returned;
      },
    }); }
  catch (error) {
    if (!String(options.receiptMode).startsWith("invalid-")) throw error;
    return { state, calls, attemptId, error };
  }
  return { state, result, calls, attemptId };
}

describe("P11/T022 v2 actual private browser producer", () => {
  it("dispatches one browser case once and lets UI QA reuse its canonical source", async () => {
    const { state, result, calls, attemptId } = await runPostBrowserSource({ receiptMode: "valid" });
    const execution = acceptanceExecutionSubjectFact(state, result);
    expect(execution.execution_items).toHaveLength(1);
    expect(execution.execution_items[0], JSON.stringify(execution.execution_items[0])).toMatchObject({ tier: "browser", status: "executed", executor: "controlled-browser-qa" });
    expect(calls).toHaveLength(1);
    expect(calls[0].input).toMatchObject({ task_id: state.task.identity.taskId,
      attempt_id: attemptId, material_revision: state.context.kernel.currentVNextMaterialRevision(),
      snapshot_tree: state.context.kernel.currentVNextSnapshot().tree,
      acceptance_scenario: { source: "CASE-001", tier: "browser" } });
    expect(execution.execution_items[0].evidence_refs).toEqual([{ ref: calls[0].ref, sha256: calls[0].sha256 }]);
    expect(result.status).not.toBe("completed");
  });

  it.each(["invalid-implementation", "invalid-tests"])("does not start a browser on %s receipt", async (receiptMode) => {
    const { calls, error } = await runPostBrowserSource({ receiptMode });
    expect(error?.code).toBe("MATERIAL_INCOMPLETE");
    expect(calls).toHaveLength(0);
  });

  it.each(["invalid-stale-snapshot", "invalid-semantic-tests"])("does not start a browser on %s receipt", async (receiptMode) => {
    const { calls, error } = await runPostBrowserSource({ receiptMode });
    expect(calls).toHaveLength(0);
    expect(error).toBeDefined();
  });

  it.each(["invalid-missing-output", "invalid-output-hash", "invalid-implementation-head"])("does not start a browser on %s receipt", async (receiptMode) => {
    const { calls, error } = await runPostBrowserSource({ receiptMode });
    expect(calls).toHaveLength(0);
    expect(error).toBeDefined();
  });

  it("does not start a browser on a self-consistent test receipt from an unrelated producer", async () => {
    const { calls, error } = await runPostBrowserSource({ receiptMode: "invalid-test-producer" });
    expect(calls).toHaveLength(0);
    expect(error).toBeDefined();
  });

  it("does not treat fixture-only browser bytes as a passing acceptance", async () => {
    const { state, result } = await runPostBrowserSource({ receiptMode: "valid", fixtureOnly: true });
    const execution = acceptanceExecutionSubjectFact(state, result);
    expect(execution.status).not.toBe("passed");
    expect(execution.execution_items[0].status).not.toBe("executed");
  });

  it("keeps two browser cases on one AC distinct without a third QA dispatch", async () => {
    const scenarios = [
      { source: "CASE-001", sample: "protocol fixture", scenario: "save settings", tier: "browser" },
      { source: "CASE-002", sample: "protocol fixture", scenario: "reject invalid settings", tier: "browser" },
    ];
    const multiple = await runPostBrowserSource({ receiptMode: "valid", scenarios });
    const execution = acceptanceExecutionSubjectFact(multiple.state, multiple.result);
    expect(execution.execution_items.map((item) => item.source)).toEqual(["CASE-001", "CASE-002"]);
    expect(execution.execution_items.every((item) => item.acceptance_criterion_ids?.join() === "AC-EXE-001")).toBe(true);
    expect(multiple.calls).toHaveLength(2);
    expect(multiple.calls.map(({ input }) => input.acceptance_scenario?.source)).toEqual(["CASE-001", "CASE-002"]);
    expect(execution.ui_qa_projection.status).toBe("passed");
    expect(execution.ui_qa_projection.items).toHaveLength(2);
    expect(execution.status).toBe("passed");
  });

  it("does not borrow a passed command leaf for a required unavailable browser case", async () => {
    const scenarios = [
      { source: "CASE-COMMAND", sample: "protocol fixture", scenario: "check settings API", tier: "command",
        execution: { command: process.execPath, args: ["acceptance-command.mjs"], timeout_ms: 5000 } },
      { source: "CASE-001", sample: "protocol fixture", scenario: "save settings", tier: "browser" },
    ];
    const { state, result, calls } = await runPostBrowserSource({ receiptMode: "valid", scenarios, browserFault: "blocked" });
    const execution = acceptanceExecutionSubjectFact(state, result);
    expect(execution.execution_items.map((item) => item.status)).toEqual(["executed", "unavailable"]);
    expect(calls).toHaveLength(1);
    const passedCommandRef = execution.execution_items[0].evidence_refs[0];
    const fact = p9Fact(state, result, "AC-EXE-001");
    expect(fact.status).toBe("missing");
    const acceptance = JSON.parse(state.task.readRecord(fact.evidence[0].ref));
    const stageValue = JSON.parse(state.task.readRecord(acceptance.refs[0].ref));
    expect(stageValue.subject_fact.evidence_refs).toContainEqual(passedCommandRef);
    expect(stageValue.subject_fact.detail).toContain("CASE-001");
    expect(p9Fresh(state, fact)).toMatchObject({ status: "current", authenticated: true });
  });

  it("uses the existing standalone QA route when no acceptance scenario is declared", async () => {
    const noScenario = await runPostBrowserSource({ declareAcceptance: false });
    expect(noScenario.calls).toHaveLength(1);
    expect(noScenario.calls[0].input.acceptance_scenario).toBeUndefined();
  });
});

describe("P11/T022 v3 acceptance browser and UI QA share one source", () => {
  it("uses the exact current browser ref and hash for one QA projection", async () => {
    const { state, result, calls } = await runPostBrowserSource({ receiptMode: "valid" });
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    const browserSource = aggregate.execution_items[0].evidence_refs[0];
    expect(calls).toHaveLength(1);
    expect(aggregate.status).toBe("passed");
    expect(aggregate.ui_qa_projection).toMatchObject({ status: "passed", items: [
      { evidence_ref: browserSource.ref, evidence_hash: browserSource.sha256, status: "passed" },
    ] });
    expect({ ref: calls[0].ref, sha256: calls[0].sha256 }).toEqual(browserSource);
    expect(JSON.parse(state.task.readRecord(browserSource.ref))).toMatchObject({
      task_id: state.task.identity.taskId, attempt_id: calls[0].input.attempt_id,
      snapshot_tree: state.context.kernel.currentVNextSnapshot().tree,
    });
  });

  it("does not assign one browser source to two acceptance requirements", async () => {
    const { state, result, calls } = await runPostBrowserSource({ receiptMode: "valid",
      acIds: ["AC-EXE-001", "AC-EXE-002"] });
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(calls).toHaveLength(1);
    expect(aggregate.execution_items[0].acceptance_criterion_ids).toEqual(["AC-EXE-001", "AC-EXE-002"]);
    expect(aggregate.ui_qa_projection).toMatchObject({ status: "unknown", items: [] });
    expect(aggregate.status).toBe("missing");
  });

  it.each(["task", "tree", "attempt", "ref", "hash", "blocked", "old-receipt"])("keeps %s browser source from a same-run QA pass", async (browserFault) => {
    const { state, result, calls } = await runPostBrowserSource({ receiptMode: "valid", browserFault });
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(calls).toHaveLength(1);
    expect(aggregate.status).not.toBe("passed");
    expect(aggregate.ui_qa_projection).toMatchObject({ status: "unknown", items: [] });
  });

  it("independent reader rejects absent or wrong projection and accepts a matching raw browser source", async () => {
    const { state, result } = await runPostBrowserSource({ receiptMode: "valid" });
    const executionFact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .find((fact) => fact.kind === "acceptance_criterion" && fact.subject === "acceptance_execution");
    const acceptance = JSON.parse(state.task.readRecord(executionFact.evidence[0].ref));
    const aggregate = JSON.parse(state.task.readRecord(acceptance.refs[0].ref));
    const item = aggregate.subject_fact.execution_items[0];
    const source = item.evidence_refs[0];
    const browser = JSON.parse(state.task.readRecord(source.ref));
    const projectionItem = {
      case: { source: item.source, sample: item.sample, scenario: item.scenario, tier: "browser" },
      acceptance_criterion_ids: item.acceptance_criterion_ids,
      task_id: browser.task_id, attempt_id: browser.attempt_id,
      material_revision: browser.material_revision, snapshot_tree: browser.snapshot_tree,
      evidence_ref: source.ref, evidence_hash: source.sha256,
      result: browser.result, status: "passed",
      service_identity: browser.service_identity, api_identity: browser.api_identity, dto_identity: browser.dto_identity,
    };
    const { ui_qa_projection: _currentProjection, ...withoutProjection } = aggregate.subject_fact;
    const base = { ...aggregate, status: "passed", subject_fact: { ...withoutProjection, status: "passed" } };
    const read = (ref) => state.task.readRecord(ref);
    expect(() => authenticateAcceptanceExecutionAggregate(base, executionFact, read)).toThrow(/projection/i);
    const matching = { ...base, subject_fact: { ...base.subject_fact,
      ui_qa_projection: { status: "passed", items: [projectionItem] } } };
    expect(() => authenticateAcceptanceExecutionAggregate(matching, executionFact, read)).not.toThrow();
    for (const broken of [
      { ...projectionItem, evidence_hash: "0".repeat(64) },
      { ...projectionItem, evidence_ref: "quality/evidence/browser-qa/missing.json" },
      { ...projectionItem, status: "failed" },
      { ...projectionItem, attempt_id: "old-attempt" },
      { ...projectionItem, service_identity: { name: "other-service" } },
    ]) {
      const altered = { ...matching, subject_fact: { ...matching.subject_fact,
        ui_qa_projection: { status: "passed", items: [broken] } } };
      expect(() => authenticateAcceptanceExecutionAggregate(altered, executionFact, read)).toThrow(/projection/i);
    }
  });
});

describe("P11/T022 browser proof reaches each acceptance requirement", () => {
  function publishAcVariant(state, original, mutateStage) {
    const acceptance = JSON.parse(state.task.readRecord(original.evidence[0].ref));
    const stage = JSON.parse(state.task.readRecord(acceptance.refs[0].ref));
    const changedStage = publishContentAddressedJson(state.context.kernel,
      "quality/evidence/stage-quality/build-code", mutateStage(stage));
    const changedAcceptance = publishContentAddressedJson(state.context.kernel,
      "quality/evidence/acceptance/build-code", {
        ...acceptance,
        refs: [changedStage],
        freshness: { ...acceptance.freshness,
          evidence_freshness: [{ ...changedStage, status: "current" }] },
      });
    const published = state.context.kernel.publishVNextQualityFact("build-code", {
      kind: "acceptance_criterion", status: "passed", subject: original.subject,
      evidence: [{ ...changedAcceptance, evidence_type: "acceptance_evidence" }],
    });
    const raw = state.task.readRecord(published.ref);
    return { ...JSON.parse(raw), ref: published.ref, sha256: p9Hash(raw) };
  }

  function readAcross(primary, alternate = null) {
    return (ref) => {
      try { return primary.task.readRecord(ref); }
      catch (error) {
        if (error?.code !== "ENOENT" || !alternate) throw error;
        return alternate.task.readRecord(ref);
      }
    };
  }

  it("binds a passed AC to this run's aggregate wrapper and its one raw browser source", async () => {
    const { state, result } = await runPostBrowserSource({ receiptMode: "valid" });
    const aggregateFact = p9Fact(state, result, "acceptance_execution");
    const aggregateWrapper = JSON.parse(state.task.readRecord(aggregateFact.evidence[0].ref));
    const aggregateRef = aggregateWrapper.refs[0];
    const aggregate = JSON.parse(state.task.readRecord(aggregateRef.ref));
    const browserRef = aggregate.subject_fact.execution_items[0].evidence_refs[0];
    const acFact = p9Fact(state, result, "AC-EXE-001");
    const acWrapper = JSON.parse(state.task.readRecord(acFact.evidence[0].ref));
    const acStage = JSON.parse(state.task.readRecord(acWrapper.refs[0].ref));
    expect(aggregate.status).toBe("passed");
    expect(acFact.status).toBe("passed");
    expect(acStage.subject_fact.evidence_refs).toEqual([
      { ref: aggregateFact.evidence[0].ref, sha256: aggregateFact.evidence[0].sha256 }, browserRef,
    ]);
    expect(p9Fresh(state, acFact)).toMatchObject({ status: "current", authenticated: true });
  });

  it("does not pass either AC when one browser source declares two ACs", async () => {
    const { state, result } = await runPostBrowserSource({ receiptMode: "valid",
      acIds: ["AC-EXE-001", "AC-EXE-002"] });
    for (const id of ["AC-EXE-001", "AC-EXE-002"]) {
      const fact = p9Fact(state, result, id);
      expect(fact.status).toBe("missing");
    }
  });

  it("does not pass an AC when one of its two browser scenarios has no unique QA projection", async () => {
    const scenarios = [
      { source: "CASE-001", sample: "protocol fixture", scenario: "save settings", tier: "browser" },
      { source: "CASE-002", sample: "protocol fixture", scenario: "reject invalid settings", tier: "browser" },
    ];
    const { state, result } = await runPostBrowserSource({ receiptMode: "valid", scenarios, browserFault: "second-blocked" });
    expect(acceptanceExecutionSubjectFact(state, result).execution_items.map((item) => item.status)).toEqual(["executed", "unavailable"]);
    expect(p9Fact(state, result, "AC-EXE-001").status).toBe("missing");
  });

  it("keeps both command and browser proof when both satisfy one AC", async () => {
    const scenarios = [
      { source: "CASE-COMMAND", sample: "protocol fixture", scenario: "check settings API", tier: "command",
        execution: { command: process.execPath, args: ["acceptance-command.mjs"], timeout_ms: 5000 } },
      { source: "CASE-001", sample: "protocol fixture", scenario: "save settings", tier: "browser" },
    ];
    const { state, result } = await runPostBrowserSource({ receiptMode: "valid", scenarios });
    const aggregateFact = p9Fact(state, result, "acceptance_execution");
    const aggregateWrapper = JSON.parse(state.task.readRecord(aggregateFact.evidence[0].ref));
    const aggregate = JSON.parse(state.task.readRecord(aggregateWrapper.refs[0].ref));
    const [commandItem, browserItem] = aggregate.subject_fact.execution_items;
    const acFact = p9Fact(state, result, "AC-EXE-001");
    const acWrapper = JSON.parse(state.task.readRecord(acFact.evidence[0].ref));
    const acStage = JSON.parse(state.task.readRecord(acWrapper.refs[0].ref));
    expect(aggregate.status).toBe("passed");
    expect(acFact.status).toBe("passed");
    expect(acStage.subject_fact.execution).toBeUndefined();
    expect(acStage.subject_fact.evidence_refs).toEqual([
      { ref: aggregateFact.evidence[0].ref, sha256: aggregateFact.evidence[0].sha256 },
      commandItem.evidence_refs[0], browserItem.evidence_refs[0],
    ]);
    expect(p9Fresh(state, acFact)).toMatchObject({ status: "current", authenticated: true });
    for (const omitted of ["acceptance_execution", "browser-qa", "/AC-EXE-001-"]) {
      const altered = publishAcVariant(state, acFact, (stage) => ({ ...stage,
        subject_fact: { ...stage.subject_fact,
          evidence_refs: stage.subject_fact.evidence_refs.filter((reference) => !reference.ref.includes(omitted)) } }));
      expect(authenticateQualityFactRecord(altered, { read: readAcross(state) }).authenticated,
        `mixed AC must reject omitted ${omitted}`).toBe(false);
    }
  });

  it("rejects a passed AC that drops its aggregate wrapper or raw browser source", async () => {
    const { state, result } = await runPostBrowserSource({ receiptMode: "valid" });
    const original = p9Fact(state, result, "AC-EXE-001");
    const repackaged = publishAcVariant(state, original, (stage) => stage);
    expect(authenticateQualityFactRecord(repackaged, { read: readAcross(state) }).authenticated).toBe(true);
    for (const kept of ["browser-qa", "acceptance_execution", "no-current-source"]) {
      const altered = publishAcVariant(state, original, (stage) => ({ ...stage,
        subject_fact: { ...stage.subject_fact,
          evidence_refs: stage.subject_fact.evidence_refs.filter((reference) => reference.ref.includes(kept)) } }));
      expect(authenticateQualityFactRecord(altered, { read: readAcross(state) }).authenticated).toBe(false);
    }
  });

  it("rejects a wrapper from another run on the same tree when the AC retains this run's browser source", async () => {
    const current = await runPostBrowserSource({ receiptMode: "valid" });
    const other = await runPostBrowserSource({ receiptMode: "valid", attemptId: "other-p11-attempt" });
    expect(current.state.context.kernel.currentVNextSnapshot().tree)
      .toBe(other.state.context.kernel.currentVNextSnapshot().tree);
    expect(current.state.context.kernel.currentVNextMaterialRevision())
      .toBe(other.state.context.kernel.currentVNextMaterialRevision());
    const original = p9Fact(current.state, current.result, "AC-EXE-001");
    const otherAggregate = p9Fact(other.state, other.result, "acceptance_execution");
    expect(readAcross(current.state, other.state)(otherAggregate.evidence[0].ref))
      .toBe(other.state.task.readRecord(otherAggregate.evidence[0].ref));
    const altered = publishAcVariant(current.state, original, (stage) => ({ ...stage,
      subject_fact: { ...stage.subject_fact,
        evidence_refs: [{ ref: otherAggregate.evidence[0].ref, sha256: otherAggregate.evidence[0].sha256 },
          stage.subject_fact.evidence_refs.find((reference) => reference.ref.includes("browser-qa"))] } }));
    expect(authenticateQualityFactRecord(altered, {
      read: readAcross(current.state, other.state),
    }).authenticated).toBe(false);
  });
});

describe("P11/T022 blocked browser missing readback", () => {
  it("authenticates the real unavailable browser item as missing while rejecting fabricated pass shapes", async () => {
    const { state, result, calls } = await runPostBrowserSource({ receiptMode: "valid", browserFault: "blocked" });
    expect(calls).toHaveLength(1);
    const blockedRaw = state.task.readRecord(calls[0].ref);
    expect(createHash("sha256").update(blockedRaw).digest("hex")).toBe(calls[0].sha256);
    expect(JSON.parse(blockedRaw).result).toBe("blocked");

    const factRef = result.quality_fact_refs.find((ref) => {
      const value = JSON.parse(state.task.readRecord(ref));
      return value.kind === "acceptance_criterion" && value.subject === "acceptance_execution";
    });
    const factRaw = state.task.readRecord(factRef);
    const fact = JSON.parse(factRaw);
    const read = (ref) => state.task.readRecord(ref);
    const wrapper = JSON.parse(read(fact.evidence[0].ref));
    const aggregate = JSON.parse(read(wrapper.refs[0].ref));
    expect(fact.status).toBe("missing");
    expect(aggregate).toMatchObject({ status: "missing", subject_fact: {
      status: "missing", execution_items: [{ tier: "browser", status: "unavailable", evidence_refs: [] }],
      ui_qa_projection: { status: "unknown", items: [], reason: expect.any(String) },
    } });

    const noBrowserItem = { ...aggregate, subject_fact: { ...aggregate.subject_fact, execution_items: [] } };
    expect(() => authenticateAcceptanceExecutionAggregate(noBrowserItem, fact, read)).toThrow(/projection/i);
    const fabricatedPass = { ...aggregate, status: "passed", subject_fact: { ...aggregate.subject_fact,
      status: "passed", execution_items: [{ ...aggregate.subject_fact.execution_items[0], status: "executed" }] } };
    expect(() => authenticateAcceptanceExecutionAggregate(fabricatedPass, fact, read)).toThrow(/invalid|evidence/i);
    const { ui_qa_projection: _projection, ...historicalFact } = aggregate.subject_fact;
    expect(() => authenticateAcceptanceExecutionAggregate({ ...aggregate, subject_fact: historicalFact }, fact, read)).not.toThrow();

    expect(() => authenticateAcceptanceExecutionAggregate(aggregate, fact, read)).not.toThrow();
    const authenticated = authenticateQualityFactRecord({ ...fact, ref: factRef,
      sha256: createHash("sha256").update(factRaw).digest("hex") }, { read });
    expect(authenticated).toMatchObject({ status: "recorded", authenticated: true });
    const acFact = p9Fact(state, result, "AC-EXE-001");
    expect(acFact.status).toBe("missing");
    expect(p9Fresh(state, acFact)).toMatchObject({ status: "current", authenticated: true });
    expect(fact.status).toBe("missing");
  });
});

describe("acceptance execution tiers", () => {
  it("keeps the pre-cohort tests producer available to the historical build-code receipt path", async () => {
    const state = officialBrowserFixture();
    const workspace = openCurrentTaskWorkspace(state.task);
    state.context.workspace = workspace;
    const implementation = writeOfficialComponentReceipt({ task: state.task, workspace,
      stage: "build-code", component: "implementation", payload: {} });
    const tests = createCanonicalReceiptWriter({ task: state.task, workspace,
      stage: "build-code", component: "tests" }).captureTests({ command: "true",
      receiptRef: "quality/tests/pre-history-component.json", outputRef: "quality/tests/output/pre-history-component.txt" });
    const result = await runOfficialStage("build-code", state.context, {
      attempt_id: "pre-history-component", receipts: { implementation: implementation.ref, tests: tests.receipt_ref },
    }, {});
    expect(result).toMatchObject({ stage: "build-code", work_status: "ready" });
  });

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

  it("keeps the current stage runnable without an upstream host outcome", async () => {
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
      cwd: state.candidate.worktreeRoot,
      services: {
        monitoring: false,
        runControlledUiQa: async (input) => {
          calls.push(input);
          throw new Error("browser capability fixture is unavailable");
        },
      },
    }));
    expect(result).toMatchObject({
      stage: "build-code",
      work_status: "ready",
      quality_status: "incomplete",
    });
    expect(result).not.toHaveProperty("stage_outcome_status");
    expect(result).not.toHaveProperty("stage_outcome_diagnostic");
    expect(calls).toHaveLength(1);
  });

  it("rejects a retired nested stage outcome before current stage execution can start", async () => {
    const state = officialBrowserFixture();
    const inputPath = join(state.root, "retired-freeze-input.json");
    writeFileSync(inputPath, JSON.stringify({
      attempt_id: "retired-freeze-attempt",
      receipts: {},
      decision_freeze: { stage_outcome_ref: `quality/evidence/stage-outcomes/build-spec/${"a".repeat(64)}.json` },
    }));

    await expect(withRuntimeEnvironment(state, () => stageRuntimeCliMain([
      "run",
      "--action=execute",
      "--stage=build-spec",
      "--project=WorkflowHub",
      "--task=browser-acceptance",
      `--input=${inputPath}`,
    ], { cwd: state.candidate.worktreeRoot }))).rejects.toThrow(/decision_freeze\.stage_outcome_ref/);
  });

  it("keeps verify-code browser execution unavailable when current canonical data identity does not bind the declared scenario", async () => {
    const { state, result } = await runOfficialBrowserAcceptance();
    publishCurrentExecutionWithMismatchedDataIdentity(state, result);
    const verify = await runOfficialStage("verify-code", {
      ...state.context,
      stage: "verify-code",
      workflowRunId: state.context.kernel.deriveStageWorkflowRunId("verify-code"),
    }, { attempt_id: "verify-data-binding", receipts: {} });

    expect(verify).not.toHaveProperty("stage_outcome_status");
    expect(verify).not.toHaveProperty("stage_outcome_diagnostic");
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

function p9Fixture({ tier = "command", rows = p9Rows(), raw = null, rawBytes = null, exitCode = 0, timeoutMs = 3000, hanging = false, missingActor = false, tamperActor = false, independent = false, executionOverride, acceptanceData, futureStageAcIds = [], futureStageAcText = "条件=机器逐 AC 测试事实与独立于实现者的 verify-code 审查均已产生；行为=在 verify-code 按风险独立语义抽查与最终授权；度量=保留完整分母并交接；失败场景=真实审查或授权未发生却宣称完成即失败。", mutateMaterialDuringExecution = false, recordModel = "vnext-single-write" } = {}) {
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
    artifacts.writeAtomic("decision-log.md", `${independent ? '# Decision\n\n### D-001 — execution requires independent review\n- **high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}`\n' : "# Decision\n"}\n## 任务身份\n\n- **任务类型**：普通任务\n`);
    artifacts.writeAtomic("decision-log.md", `${artifacts.read("decision-log.md")}\n## UI applicability\n\n\`\`\`json\n${JSON.stringify({ result: "non_ui", sources: {
      raw_requirement: { conclusion: "non_ui", reason: "fixture only runs local command/service" },
      project_inventory: { conclusion: "non_ui", reason: "fixture has no page consumer" },
      planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "fixture has no frontend changes" },
    } })}\n\`\`\`\n`);
    artifacts.writeAtomic("spec.md", `# Spec\n${independent ? "D-001 requires independent review of local service execution.\n" : ""}\n## Acceptance Criteria\n\n${p9Ids.map((id) => `- **${id}**：${futureStageAcIds.includes(id) ? futureStageAcText : "runtime JSON equality must match the declared fixture oracle."}`).join("\n")}\n`);
    const scenarios = acceptanceData?.(execution) ?? [{ source: "descriptive source; never execute this", sample: "real local data", scenario: "two AC runtime oracle", tier, execution }];
    artifacts.writeAtomic("tasks.md", `# Tasks\n\n- **Template version**：\`plan-task.v4\`\n\n#### T019 — real acceptance\n- **ID**：T019\n- **ui_scope**：non_ui\n- **acceptance_role**：acceptance\n- **e2e_scope**：${independent ? "high_risk_user_visible" : "not_required"}\n${independent ? '- **e2e_decision_refs**：`["D-001"]`\n- **e2e_risk_decision_ref**：D-001\n' : ""}- **AC**：${p9Ids.join(", ")}\n- **acceptance_data**：\`${JSON.stringify(scenarios)}\`\n`);
  } });
  state.context.workspace = openCurrentTaskWorkspace(state.task);
  const outcome = p9Actor(state, { missing: missingActor, tamper: tamperActor });
  return { ...state, marker, output, outputBytes: rawBytes ? Buffer.from(rawBytes) : Buffer.from(output), execution, outcome, tier, hanging };
}

async function p9Execute(state, signal) {
  return runOfficialStage("build-code", state.context, {
    attempt_id: state.outcome?.value?.attempt_id ?? "p9-attempt-A",
    receipts: {},
  }, {}, signal ? { signal } : {});
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
    const expectedRunId = state.context.kernel.deriveStageWorkflowRunId("build-code");
    expect(value.subject_fact.executor_actor).toEqual({ source_kind: "workflowhub-session", source_id: "workflowhub-current-session", run_id: expectedRunId });
    expect(value.subject_fact.execution_binding).toEqual({
      kind: "workflowhub-current-session",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      attempt_id: state.outcome?.value?.attempt_id ?? "p9-attempt-A",
      run_id: expectedRunId,
      snapshot_tree: state.context.kernel.currentVNextSnapshot().tree,
      material_revision: state.context.kernel.currentVNextMaterialRevision(),
    });
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
  it("CARD04 completion repair executes explicit verify-code deferred AC without claiming its business acceptance passed", async () => {
    const rows = p9Rows();
    rows[1] = { ...rows[1], outcome: "deferred", owner: "verify-code", reason: "original spec requires verify-code semantic spot-check and final authorization" };
    const state = p9Fixture({ rows, futureStageAcIds: [p9Ids[1]] });
    const result = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(aggregate).toMatchObject({ status: "passed", execution_items: [{ status: "executed" }] });
    const { records } = p9PerAc(state, result);
    expect(records).toHaveLength(2);
    expect(records.map(({ subject_fact }) => subject_fact.status)).toEqual(["passed", "deferred"]);
    expect(records[1].subject_fact).toMatchObject({ outcome: "deferred", outcome_owner: "verify-code", execution: { exit_code: 0, cleanup: { status: "completed" } } });
    expect(records.every(({ subject_fact }) => subject_fact.assertions.every(({ result: value }) => value === "passed"))).toBe(true);
    expect(p9Fact(state, result, "acceptance_criteria").status).toBe("missing");
    expect(p9Fact(state, result, p9Ids[1]).status).not.toBe("passed");
    expect(result.quality_status).toBe("incomplete");
  });

  it.each([
    ["current AC relabeled verify-code", { futureStageAcIds: [] }],
    ["wrong future owner", { owner: "CARD-10" }],
    ["false assertion in future AC", { assertion: { id: "future-check", expected: "checked", actual: "not-checked" } }],
    ["nonzero executor", { exitCode: 9 }],
    ["verify-code mentioned only in current AC failure clause", { futureStageAcText: "条件=当前 build-code 完成真实 command；行为=核对当前输出；度量=全部当前断言通过；失败场景=verify-code 阶段审查被冒充当前执行即失败。" }],
    ["verify-code is only a required output literal in a current AC", { futureStageAcText: "条件=当前 build-code 运行真实 command；行为=必须在当前输出中保留 verify-code 这个普通词；度量=全部当前断言通过；失败场景=输出遗漏该词即失败。" }],
    ["a current command must print the verify-code review result", { futureStageAcText: "verify-code 阶段审查结果必须由当前 build-code command 原样打印；度量=当前输出逐字相等；失败场景=当前输出缺失或不等即失败。" }],
  ])("CARD04 completion repair rejects %s", async (_caseName, options) => {
    const rows = p9Rows();
    rows[1] = { ...rows[1], outcome: "deferred", owner: options.owner ?? "verify-code", reason: "original spec requires future semantic spot-check", ...(options.assertion ? { assertions: [options.assertion] } : {}) };
    const state = p9Fixture({ rows, futureStageAcIds: options.futureStageAcIds ?? [p9Ids[1]], exitCode: options.exitCode ?? 0, ...(options.futureStageAcText ? { futureStageAcText: options.futureStageAcText } : {}) });
    const result = await p9Execute(state);
    expect(acceptanceExecutionSubjectFact(state, result)).toMatchObject({ status: "missing", execution_items: [{ status: "failed" }] });
    expect(p9Fact(state, result, "acceptance_criteria").status).not.toBe("passed");
  });

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

  it("does not let one failed AC assertion hide a passed sibling leaf", async () => {
    const rows = p9Rows();
    rows[1] = {
      ...rows[1],
      assertions: [{ id: "failed-sibling-only", expected: "persisted", actual: "not-persisted" }],
    };
    const state = p9Fixture({ rows });
    const result = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(aggregate).toMatchObject({ status: "missing", execution_items: [{ status: "failed" }] });
    const records = p9PerAc(state, result).records.sort((left, right) => left.subject.localeCompare(right.subject));
    expect(records.map(({ subject_fact }) => subject_fact.status)).toEqual(["passed", "failed"]);
    expect(p9Fact(state, result, p9Ids[0]).status).toBe("passed");
    expect(p9Fact(state, result, p9Ids[1]).status).toBe("failed");
  });

  it("keeps a passed AC leaf but does not cover a second required scenario with no ref", async () => {
    const state = p9Fixture({ acceptanceData: (execution) => [
      { source: "CASE-A", sample: "real local data", scenario: "run command", tier: "command", execution },
      { source: "CASE-B", sample: "real local data", scenario: "run missing service", tier: "service",
        execution: { module_ref: "missing-acceptance-service.mjs", export_name: "accept", input: {}, timeout_ms: 5000 } },
    ] });
    const result = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(aggregate.execution_items.map((item) => item.status)).toEqual(["executed", "unavailable"]);
    expect(aggregate.execution_items[1].evidence_refs).toEqual([]);
    for (const acId of p9Ids) {
      const passedRef = aggregate.execution_items[0].evidence_refs.find((entry) => entry.ref.includes(`/${acId}-`));
      expect(passedRef).toBeDefined();
      const fact = p9Fact(state, result, acId);
      expect(fact.status).toBe("missing");
      const acceptance = JSON.parse(state.task.readRecord(fact.evidence[0].ref));
      expect(acceptance.result).not.toBe("pass");
      const stageValue = JSON.parse(state.task.readRecord(acceptance.refs[0].ref));
      expect(stageValue.status).toBe("missing");
      expect(stageValue.subject_fact.evidence_refs).toContainEqual(passedRef);
      expect(stageValue.subject_fact.detail).toContain("CASE-B");
      expect(p9Fresh(state, fact)).toMatchObject({ status: "current", authenticated: true });
    }
  });

  it("rejects duplicate declared scenarios instead of counting one content-addressed leaf twice", async () => {
    const state = p9Fixture({ acceptanceData: (execution) => [
      { source: "CASE-DUP", sample: "real local data", scenario: "same command", tier: "command", execution },
      { source: "CASE-DUP", sample: "real local data", scenario: "same command", tier: "command", execution },
    ] });
    await expect(p9Execute(state)).rejects.toThrow(/duplicate acceptance scenario/i);
  });

  it("covers two required scenarios only when each has its own AC leaf", async () => {
    const state = p9Fixture({ acceptanceData: (execution) => [
      { source: "CASE-A", sample: "real local data", scenario: "run command", tier: "command", execution },
      { source: "CASE-B", sample: "real local data", scenario: "run service", tier: "service",
        execution: { module_ref: "acceptance-service.mjs", export_name: "accept", input: { value: { amount: 7, label: "fixture" } }, timeout_ms: 5000 } },
    ] });
    const result = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(aggregate.execution_items.map((item) => item.status)).toEqual(["executed", "executed"]);
    for (const acId of p9Ids) {
      const fact = p9Fact(state, result, acId);
      expect(fact.status).toBe("passed");
      const acceptance = JSON.parse(state.task.readRecord(fact.evidence[0].ref));
      const stageValue = JSON.parse(state.task.readRecord(acceptance.refs[0].ref));
      expect(stageValue.subject_fact.evidence_refs).toHaveLength(2);
      expect(p9Fresh(state, fact).status).toBe("current");
    }
  });

  it("keeps an unavailable AC outcome out of coverage while an independent review receives the executed command evidence", async () => {
    const rows = p9Rows();
    rows[1] = {
      ...rows[1],
      outcome: "unavailable",
      owner: "wh-review",
      reason: "no current semantic provider result exists",
    };
    const state = p9Fixture({ rows });
    const execution = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, execution);
    expect(aggregate).toMatchObject({ status: "passed", execution_items: [{ status: "executed" }] });
    const { records, aggregate: executionAggregate } = p9PerAc(state, execution);
    expect(records.map(({ subject_fact }) => subject_fact.status).sort()).toEqual(["passed", "unavailable"]);
    expect(records.map(({ subject_fact }) => subject_fact.outcome).sort()).toEqual(["achieved", "unavailable"]);
    expect(p9Fact(state, execution, "acceptance_criteria").status).toBe("missing");

    const trace = p9ConfigureReview(state);
    const review = await p9PublicReview(state, trace, p9ExecutionInput(state, execution));
    expect(trace.dispatches).toBe(1);
    const evidencePath = "authenticated-evidence.json";
    const report = state.task.readRecord(review.report_ref);
    const publicResult = JSON.parse(report.match(/## Public result and coverage\n\n```json\n([\s\S]*?)\n```/)?.[1] ?? "null")?.public_result;
    const manifest = publicResult?.ocr?.manifest;
    expect(Array.isArray(manifest), "canonical OCR report omitted the packet manifest").toBe(true);
    const evidenceEntry = manifest.find((entry) => entry.path === evidencePath);
    expect(evidenceEntry, `OCR packet manifest omitted ${evidencePath}: ${JSON.stringify(manifest.map((entry) => entry.path).filter((path) => !path.startsWith(".git/")))}`).toBeDefined();
    const deliveredRaw = trace.bundles[0].bytes[evidencePath];
    expect(typeof deliveredRaw, "OCR provider did not receive authenticated-evidence.json").toBe("string");
    expect(evidenceEntry).toEqual({
      path: evidencePath, bytes: Buffer.byteLength(deliveredRaw), sha256: p9Hash(deliveredRaw),
    });
    const authenticated = JSON.parse(deliveredRaw);
    const unavailableIndex = records.findIndex((record) => record.subject_fact.outcome === "unavailable");
    expect(unavailableIndex).toBeGreaterThanOrEqual(0);
    const unavailableRef = executionAggregate.execution_items.flatMap((item) => item.evidence_refs)[unavailableIndex];
    const frozenRecord = authenticated.runtime_execution_records.find((entry) => entry.ref === unavailableRef.ref);
    expect(frozenRecord).toMatchObject({ ref: unavailableRef.ref, sha256: unavailableRef.sha256 });
    expect(frozenRecord.raw).toBe(redactProviderHostPaths(state.task.readRecord(unavailableRef.ref)));
    const frozenValue = JSON.parse(frozenRecord.raw);
    expect(frozenValue.subject_fact).toMatchObject({
      outcome: "unavailable", outcome_owner: "wh-review",
      outcome_reason: "no current semantic provider result exists",
    });
    expect(review.result_ref).toMatch(/^quality\/reviews\/results\//);
  });

  it.each([["incomplete", "missing"], ["deferred", "deferred"]])(
    "does not pass the execution aggregate when an AC outcome is %s",
    async (outcome, expectedLeafStatus) => {
      const rows = p9Rows();
      rows[0] = { ...rows[0], outcome, owner: "CARD-10", reason: `AC outcome is ${outcome}` };
      const state = p9Fixture({ rows });
      const result = await p9Execute(state);
      const aggregate = acceptanceExecutionSubjectFact(state, result);

      expect(aggregate).toMatchObject({ status: "missing", execution_items: [{ status: "failed" }] });
      const { records } = p9PerAc(state, result);
      expect(records.find(({ subject }) => subject === p9Ids[0]).subject_fact.status).toBe(expectedLeafStatus);
      expect(p9Fact(state, result, "acceptance_criteria").status).toBe("missing");
    },
  );

  it("does not pass the execution aggregate when an AC assertion compares not-read placeholders", async () => {
    const rows = p9Rows();
    rows[0] = {
      ...rows[0],
      assertions: [{ id: "unread-source", expected: { status: "not-read" }, actual: { status: "not-read" } }],
    };
    const state = p9Fixture({ rows });
    const result = await p9Execute(state);
    const aggregate = acceptanceExecutionSubjectFact(state, result);

    expect(aggregate).toMatchObject({ status: "missing", execution_items: [{ status: "failed" }] });
    const { records } = p9PerAc(state, result);
    expect(records[0].subject_fact.assertions[0]).toMatchObject({
      expected: { status: "not-read" },
      actual: { status: "not-read" },
      result: "passed",
    });
    expect(p9Fact(state, result, "acceptance_criteria").status).toBe("missing");
  });

  it("executes command ACs with a runtime-owned current-session binding when no stage outcome is supplied", async () => {
    const state = p9Fixture();
    const attemptId = "p9-current-session-attempt";
    const result = await runOfficialStage("build-code", state.context, {
      attempt_id: attemptId,
      receipts: {},
    });
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    expect(aggregate).toMatchObject({ status: "passed", execution_items: [{ status: "executed" }] });
    const leafRef = aggregate.execution_items[0].evidence_refs[0];
    const leaf = JSON.parse(state.task.readRecord(leafRef.ref));
    const expectedRunId = state.context.kernel.deriveStageWorkflowRunId("build-code");
    expect(leaf.subject_fact.executor_actor).toEqual({
      source_kind: "workflowhub-session",
      source_id: "workflowhub-current-session",
      run_id: expectedRunId,
    });
    expect(leaf.subject_fact.execution_binding).toEqual(expect.objectContaining({
      kind: "workflowhub-current-session",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      attempt_id: attemptId,
      run_id: expectedRunId,
      snapshot_tree: state.context.kernel.currentVNextSnapshot().tree,
      material_revision: state.context.kernel.currentVNextMaterialRevision(),
    }));
    expect(leaf.subject_fact.execution_binding).not.toHaveProperty("stage_outcome_ref");
    expect(leaf.subject_fact.execution_binding).not.toHaveProperty("stage_outcome_hash");
  });

  it("accepts nested numeric at-least assertions without weakening strict JSON comparison", async () => {
    const strictRows = deriveAcceptanceExecutionAssertions(JSON.stringify({
      entries: [{
        acceptance_criterion_id: "AC-STRICT-001",
        assertions: [{ id: "ordered-array", expected: [1, 2], actual: [2, 1] }],
      }],
    }), ["AC-STRICT-001"]);
    expect(strictRows[0].assertions[0].result).toBe("failed");
    const rows = p9Rows();
    rows[0] = {
      ...rows[0],
      assertions: [{
        id: "nested-at-least",
        expected: { count: ">=1", ordered: [">=2", "literal"] },
        actual: { count: 3, ordered: [2, "literal"] },
      }],
    };
    const state = p9Fixture({ rows });
    const result = await runOfficialStage("build-code", state.context, {
      attempt_id: "p9-nested-at-least-attempt",
      receipts: {},
    });
    const aggregate = acceptanceExecutionSubjectFact(state, result);
    const leafRef = aggregate.execution_items[0]?.evidence_refs?.[0]?.ref;
    const leaf = typeof leafRef === "string" ? JSON.parse(state.task.readRecord(leafRef)) : null;
    expect(aggregate, JSON.stringify({ result, leaf }, null, 2)).toMatchObject({
      status: "passed",
      execution_items: [{ status: "executed" }],
    });
  });

  it("authenticates the complete current aggregate before review consumers can use it", async () => {
    const state = p9Fixture();
    const result = await runOfficialStage("build-code", state.context, {
      attempt_id: "p9-authenticator-attempt",
      receipts: {},
    });
    const executionFact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .find((fact) => fact.kind === "acceptance_criterion" && fact.subject === "acceptance_execution");
    const acceptance = JSON.parse(state.task.readRecord(executionFact.evidence[0].ref));
    const aggregateRef = acceptance.refs[0];
    const aggregate = JSON.parse(state.task.readRecord(aggregateRef.ref));
    const read = (ref) => state.task.readRecord(ref);

    expect(() => authenticateAcceptanceExecutionAggregate(
      { ...aggregate, task_id: "foreign-task" }, executionFact, read,
    )).toThrow(/invalid/);

    const missingLeaf = {
      ...aggregate,
      subject_fact: {
        ...aggregate.subject_fact,
        execution_items: aggregate.subject_fact.execution_items.map((item, index) => (
          index === 0 ? { ...item, evidence_refs: [] } : item
        )),
      },
    };
    expect(() => authenticateAcceptanceExecutionAggregate(missingLeaf, executionFact, read)).toThrow(/invalid|evidence/);

    const originalBinding = aggregate.subject_fact.execution_items[0].evidence_refs[0];
    const originalLeaf = JSON.parse(read(originalBinding.ref));
    const forgedLeaf = {
      ...originalLeaf,
      subject_fact: {
        ...originalLeaf.subject_fact,
        executor_actor: { ...originalLeaf.subject_fact.executor_actor, source_id: "forged/current-session" },
      },
    };
    const forgedRaw = `${JSON.stringify(forgedLeaf, null, 2)}\n`;
    const forgedHash = p9Hash(forgedRaw);
    const forgedRef = originalBinding.ref.replace(/-[a-f0-9]{64}\.json$/, `-${forgedHash}.json`);
    const forgedAggregate = {
      ...aggregate,
      subject_fact: {
        ...aggregate.subject_fact,
        execution_items: aggregate.subject_fact.execution_items.map((item, index) => (
          index === 0
            ? { ...item, evidence_refs: [{ ref: forgedRef, sha256: forgedHash }, ...item.evidence_refs.slice(1)] }
            : item
        )),
      },
    };
    const forgedRead = (ref) => ref === forgedRef ? forgedRaw : read(ref);
    expect(() => authenticateAcceptanceExecutionAggregate(forgedAggregate, executionFact, forgedRead)).toThrow(/actor|producer/);
  });

  it("expands only the authenticated task directory in command argv", async () => {
    const state = p9Fixture({
      executionOverride: (execution) => ({
        ...execution,
        args: ["acceptance-command.mjs", "--task-dir=$TASK_DIR", "--output=${TASK_DIR}/quality/tests/final/current-snapshot.json", "$UNSUPPORTED_VAR"],
      }),
    });
    await p9Execute(state);
    const observed = JSON.parse(readFileSync(join(state.marker, "started.json"), "utf8"));
    expect(observed.argv).toEqual([
      `--task-dir=${state.task.taskPath}`,
      `--output=${state.task.taskPath}/quality/tests/final/current-snapshot.json`,
      "$UNSUPPORTED_VAR",
    ]);
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
    const currentBinding = {
      kind: "workflowhub-current-session",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      attempt_id: "p9-attempt-A",
      run_id: state.context.kernel.deriveStageWorkflowRunId("build-code"),
      snapshot_tree: state.context.kernel.currentVNextSnapshot().tree,
      material_revision: state.context.kernel.currentVNextMaterialRevision(),
    };
    expect(aggregate.execution_binding).toEqual(currentBinding);
    expect(existsSync(join(state.marker, "started.json"))).toBe(true);
    const { records } = p9PerAc(state, result);
    expect(records).toHaveLength(2);
    for (const record of records) {
      expect(record.subject_fact.executor_actor).toEqual({
        source_kind: "workflowhub-session",
        source_id: "workflowhub-current-session",
        run_id: currentBinding.run_id,
      });
      expect(record.subject_fact.execution_binding).toEqual(currentBinding);
      expect(record.subject_fact.execution_binding).not.toHaveProperty("stage_outcome_ref");
      expect(record.subject_fact.execution_binding).not.toHaveProperty("stage_outcome_hash");
    }
    for (const acId of p9Ids) {
      const fact = p9Fact(state, result, acId);
      expect(p9Fresh(state, fact)).toMatchObject({ status: "current", authenticated: true });
    }
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
    for (const { subject_fact } of records) {
      if (subject_fact.outcome === "achieved") continue;
      expect(subject_fact).toMatchObject({
        outcome_owner: state.task.identity.taskId,
        outcome_reason: expect.stringContaining("acceptance execution"),
      });
    }
    expect(aggregate.status).not.toBe("passed");
  });

  it.each([["absent producer", { missingActor: true }], ["rehash actor with old proof", { tamperActor: true }]])("starts a command with %s because the current session is the producer", async (_label, options) => {
    const state = p9Fixture(options);
    const result = await p9Execute(state);
    expect(acceptanceExecutionSubjectFact(state, result)).toMatchObject({ status: "passed", execution_items: [{ status: "executed" }] });
    expect(existsSync(join(state.marker, "started.json"))).toBe(true);
    expect(result).not.toHaveProperty("stage_outcome_diagnostic");
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
    version: 4, engine_version: "1.2.0", tiers: [["kimi/reviewer", ...(mixedSources ? ["codex/independent"] : [])], ["codex/host"]],
    providers: {
      "codex/host": { enabled: true, source_id: sameSource ? "workflowhub-current-session" : "codex/p9-host", model: "fixture-host-model" },
      "kimi/reviewer": {
        enabled: true,
        source_id: sameSource || mixedSources ? "workflowhub-current-session" : "kimi/p9-reviewer",
        model: "fixture-reviewer-model",
      },
      ...(mixedSources ? { "codex/independent": { enabled: true, source_id: "codex/p9-independent", model: "fixture-independent-model" } } : {}),
    },
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(configDirectory, "config.json"), JSON.stringify({
    task_dir: state.root,
    third_review: { command: [process.execPath, "/fixture/no-live-broker.mjs"], config: brokerConfig, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "verify-code": { initial: ["kimi/reviewer", ...(mixedSources ? ["codex/independent"] : [])], mode: "single_round", minimum_heterologous: 1 } } },
  }));
  return { rounds: 0, dispatches: 0, providerCalls: [], bundles: [], attachmentRoot, onlySameCompletes };
}

async function p9PublicReview(state, trace, reviewedExecution, extra = {}) {
  const { providerOutput = null, resultMutation = null, materials: materialOverrides = {}, ...requestExtra } = extra;
  const request = {
    stage: "verify-code", host_provider: "codex/host",
    materials: {
      changed_files: "acceptance-service.mjs",
      implementation_assessment: "Inspect the actual acceptance service implementation and its consumers.",
      test_context: "Two JSON oracle assertions exercise the real service response.",
      open_risks: "none declared",
      acceptance_criteria: state.context.artifacts.read("spec.md"),
      ...materialOverrides,
    },
    ...(reviewedExecution ? { reviewed_execution: reviewedExecution } : {}), ...requestExtra,
  };
  const input = join(state.root, "ordinary-review-input.json");
  writeFileSync(input, JSON.stringify({ request }));
  let roundObserved = false;
  const controlledProvider = async ({ provider, cwd, promptPath }) => {
    if (!roundObserved) {
      roundObserved = true;
      trace.rounds += 1;
      trace.dispatches += 1;
    }
    trace.providerCalls.push({ provider, reviewInput: input });
    const files = (directory, prefix = "") => Object.fromEntries(readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      return entry.isDirectory() ? Object.entries(files(join(directory, entry.name), path))
        : [[path, readFileSync(join(directory, entry.name), "utf8")]];
    }));
    if (trace.bundles.length < trace.rounds) {
      const packetDirs = readdirSync(trace.attachmentRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(".ocr-code-review-"));
      expect(packetDirs, "one projected OCR packet must be live during provider dispatch").toHaveLength(1);
      const packetRoot = join(trace.attachmentRoot, packetDirs[0].name);
      const manifestRaw = readFileSync(join(packetRoot, "manifest.json"), "utf8");
      const manifest = JSON.parse(manifestRaw);
      for (const entry of manifest) {
        const bytes = readFileSync(join(packetRoot, entry.path));
        expect(bytes.length).toBe(entry.bytes);
        expect(p9Hash(bytes)).toBe(entry.sha256);
      }
      trace.bundles.push({ bytes: files(cwd), prompt: readFileSync(promptPath, "utf8"), manifest,
        materialId: p9Hash(manifestRaw) });
    }
    const failed = trace.onlySameCompletes && provider === "codex/independent";
    const findings = typeof providerOutput === "function" ? providerOutput(provider)
      : providerOutput ?? JSON.stringify({ findings: [] });
    return failed
      ? { status: "failed", error: { code: "PROCESS_FAILED", message: "controlled independent fixture member failed" } }
      : { status: "completed", output: provider.startsWith("codex/")
        ? `${JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: findings } })}\n${JSON.stringify({ type: "turn.completed" })}\n`
        : `${JSON.stringify({ role: "assistant", content: [{ type: "text", text: findings }] })}\n` };
  };
  const review = await withRuntimeEnvironment(state, () => stageRuntimeCliMain([
    "review", "--action=record", "--stage=verify-code", "--project=WorkflowHub", `--task=${state.task.identity.taskId}`, `--input=${input}`,
  ], {
    cwd: state.candidate.worktreeRoot,
    services: {
      onOcrProviderHealth: () => {},
      ...(typeof resultMutation === "function" ? {
        // This negative test mutates the OCR result at the public recorder seam;
        // all ordinary success paths use the actual OCR packet/provider boundary.
        materialIdForRequest: reviewPacketMaterialId,
        resolveRouteIdentity: () => ({ route_identity: "a".repeat(64), provider_selection: {
          providers: ["kimi/reviewer"], provider_identities: { "kimi/reviewer": { source_id: "kimi/p9-reviewer" } },
        } }),
        runOcrDelegationRound: async (prepared) => {
          trace.rounds += 1;
          trace.dispatches += 1;
          return resultMutation({
            status: "available", stage: prepared.stage, review_scope: null, material_id: reviewPacketMaterialId(prepared),
            runtime_id: "controlled-ocr-negative", outcome: "completed", findings: [],
            authenticated_evidence: prepared.authenticated_evidence,
            authenticated_evidence_sha256: authenticatedEvidenceDigest(prepared.authenticated_evidence),
            provider_results: [{ provider: "kimi/reviewer", status: "completed", error: null,
              identity: { provider: "kimi/reviewer", adapter: "kimi", source_id: "kimi/p9-reviewer", config_id: "fixture/config", model: "fixture-reviewer-model" },
              evidence_anchor_valid: [], timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null }],
          });
        },
      } : { ocrProviderExecutor: controlledProvider }),
    },
  }));
  const attempt = JSON.parse(state.task.readRecord(review.attempt_ref));
  trace.runtimeId = attempt.provider_attempts.find((item) => item.runtime_id)?.runtime_id ?? null;
  return review;
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

function p9FrozenReviewRequest(state, frozen) {
  const wrapper = JSON.parse(state.task.readRecord(frozen.ref));
  expect(wrapper).toMatchObject({ schema_version: "workflowhub-frozen-review-material.v1", content_encoding: "base64" });
  const bytes = Buffer.from(wrapper.content_base64, "base64");
  expect(p9Hash(bytes)).toBe(wrapper.content_sha256);
  expect(p9Hash(state.task.readRecord(frozen.ref))).toBe(frozen.sha256);
  return JSON.parse(bytes.toString("utf8"));
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
  const authenticated = authenticateQualityFactRecord(fact, {
    read: (ref) => ref.endsWith(".bin") ? state.task.readRecordBytes(ref) : state.task.readRecord(ref),
  });
  return {
    ...authenticated,
    status: authenticated.status === "recorded" ? "current"
      : authenticated.status === "missing" ? "missing" : "stale",
  };
}

describe("normal verify-code independently authenticated E2E sources", () => {
  it("automatically freezes actual current execution in the normal provider packet without a caller selector", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const execution = await p9Execute(state);
    const executionFact = p9Fact(state, execution, "acceptance_execution");
    expect(executionFact.status).toBe("passed");
    // Two authenticated envelopes name the same actual process aggregate.
    // Distinct wrappers do not create two execution choices.
    const copy = JSON.parse(state.task.readRecord(executionFact.evidence[0].ref));
    copy.summary = { ...copy.summary, scenario: "same actual execution through a second authenticated envelope" };
    const copyRaw = JSON.stringify(copy), copyHash = p9Hash(copyRaw);
    const copyRef = `quality/evidence/acceptance/build-code/acceptance_execution-${copyHash}.json`;
    state.context.kernel.publishCanonicalRecord(copyRef, copyRaw);
    const copiedFact = createQualityFact({ taskId: executionFact.task_id, stage: executionFact.stage, materialRevision: executionFact.material_revision,
      materialScope: executionFact.material_scope, materialScopeRevision: executionFact.material_scope_revision, snapshotTree: executionFact.snapshot_tree,
      kind: executionFact.kind, status: executionFact.status, subject: executionFact.subject,
      evidence: [{ ref: copyRef, sha256: copyHash, evidence_type: "acceptance_evidence" }] });
    state.context.kernel.publishCanonicalRecord(copiedFact.ref, JSON.stringify(copiedFact.value));
    const trace = p9ConfigureReview(state);
    const review = await p9PublicReview(state, trace, null);
    const original = state.task.readRecord(review.result_ref);
    expect(JSON.parse(readFileSync(join(state.root, "ordinary-review-input.json"), "utf8")).request).not.toHaveProperty("reviewed_execution");
    const selected = p9ExecutionInput(state, execution);
    const record = JSON.parse(original);
    expect(record.e2e_binding?.reviewed_execution).toMatchObject({ ref: selected.ref, sha256: selected.sha256 });
    expect(state.task.readRecord(review.report_ref)).not.toContain("## Host execution source diagnostic");
    expect(p9FrozenReviewRequest(state, record.e2e_binding.frozen_material).reviewed_execution).toMatchObject({ ref: selected.ref, sha256: selected.sha256 });
    const packet = JSON.parse(trace.bundles[0].bytes["authenticated-evidence.json"]);
    expect(packet.runtime_execution.raw).toBe(redactProviderHostPaths(state.task.readRecord(selected.ref)));
    const aggregate = JSON.parse(state.task.readRecord(selected.ref));
    for (const item of aggregate.subject_fact.execution_items) for (const reference of item.evidence_refs) {
      expect(packet.runtime_execution_records).toContainEqual(expect.objectContaining({ ...reference, raw: redactProviderHostPaths(state.task.readRecord(reference.ref)) }));
    }
    expect(packet.runtime_execution_outputs.some((entry) => entry.text?.includes("service-response"))).toBe(true);
    const recorded = await p9Verify(state, { quality_review: review.result_ref });
    expect(p9Fact(state, recorded, "code_review").review_status).toBe("clean");
    const evidence = readCurrentE2eAcceptanceEvidence({ ...state.context, stage: "verify-code" }, { quality_review: review.result_ref });
    expect(evidence).toMatchObject({ required: true, execution: { status: "passed", ref: expect.stringMatching(/^quality\/evidence\/acceptance\/build-code\//) }, independent_review: { status: "recorded" }, user_confirmation: { status: "missing" } });
    expect(p9Fact(state, recorded, "e2e_acceptance").status).not.toBe("passed");
    const confirmation = await p9Confirm(state, review.result_ref);
    const accepted = await p9Verify(state, { quality_review: review.result_ref, confirmation: confirmation.ref });
    const fact = p9Fact(state, accepted, "e2e_acceptance");
    expect(fact.status, JSON.stringify(accepted)).toBe("passed");
    expect(p9Fresh(state, fact)).toMatchObject({ authenticated: true, status: "current" });
    const afterConfirmation = readCurrentE2eAcceptanceEvidence({ ...state.context, stage: "verify-code" }, { quality_review: review.result_ref, confirmation: confirmation.ref });
    expect(afterConfirmation.execution.status).toBe("passed");
    expect(afterConfirmation.independent_review.status).toBe("recorded");
    expect(trace.dispatches).toBe(1);
    expect(state.task.readRecord(review.result_ref)).toBe(original);
    const sources = state.task.listCanonicalQualityFactRefs().filter((ref) => JSON.parse(state.task.readRecord(ref)).subject === "acceptance_execution")
      .map((ref) => ({ path: join(state.task.taskPath, ref), bytes: readFileSync(join(state.task.taskPath, ref)) }));
    for (const delta of [{ evidence_sha256: "f".repeat(64) }, { task_id: "foreign-task" }, { material_revision: `revision-${"f".repeat(64)}` }, { snapshot_tree: "f".repeat(40) }]) {
      try {
        for (const { path, bytes } of sources) {
          const value = JSON.parse(bytes);
          writeFileSync(path, JSON.stringify(delta.evidence_sha256
            ? { ...value, evidence: value.evidence.map((reference) => ({ ...reference, sha256: delta.evidence_sha256 })) }
            : { ...value, ...delta }));
        }
        const rejected = readCurrentE2eAcceptanceEvidence({ ...state.context, stage: "verify-code" }, { quality_review: review.result_ref, confirmation: confirmation.ref });
        expect(rejected.execution.status, JSON.stringify(delta)).toBe("missing");
        expect(rejected.independent_review.status).toBe("missing");
      } finally { for (const { path, bytes } of sources) writeFileSync(path, bytes); }
    }
  });

  it("shows a real deferred execution without treating scenario success as full business acceptance", async () => {
    const state = p9Fixture({ tier: "service", independent: true, futureStageAcIds: [p9Ids[1]] });
    const service = join(state.candidate.worktreeRoot, "acceptance-service.mjs");
    writeFileSync(service, readFileSync(service, "utf8").replace("acceptance_criterion_id:'AC-EXE-002',assertions:", "acceptance_criterion_id:'AC-EXE-002',outcome:'deferred',owner:'verify-code',reason:'requires independent semantic review and final authorization',assertions:"));
    const execution = await p9Execute(state);
    const actual = p9PerAc(state, execution);
    expect(actual.records.some((leaf) => leaf.subject_fact.status === "deferred"), JSON.stringify(actual.aggregate)).toBe(true);
    const evidence = readCurrentE2eAcceptanceEvidence({ ...state.context, stage: "verify-code" });
    expect(evidence.execution).toMatchObject({ status: "missing", ref: expect.stringMatching(/^quality\/evidence\/acceptance\/build-code\//), executor_actor: { source_id: "workflowhub-current-session" }, reason: expect.stringContaining("does not pass every active acceptance criterion") });
    expect(evidence.independent_review.status).toBe("missing");
    expect(evidence.user_confirmation.status).toBe("missing");
    const trace = p9ConfigureReview(state);
    const review = await p9PublicReview(state, trace, null);
    const record = JSON.parse(state.task.readRecord(review.result_ref));
    expect(record.e2e_binding).toBeDefined();
    const packet = JSON.parse(trace.bundles[0].bytes["authenticated-evidence.json"]);
    expect(packet.runtime_execution_records.some((entry) => JSON.parse(entry.raw).subject_fact.status === "deferred")).toBe(true);
    const confirmation = await p9Confirm(state, review.result_ref);
    const verified = await p9Verify(state, { quality_review: review.result_ref, confirmation: confirmation.ref });
    expect(p9Fact(state, verified, "e2e_acceptance").status).toBe("missing");
    expect(trace.dispatches).toBe(1);
  });

  it.each(["absent", "stale", "foreign", "corrupt", "ambiguous"])("discloses implicit %s execution without blocking the normal code review", async (condition) => {
    const state = p9Fixture({ tier: "service", independent: true });
    const variant = join(state.marker, "actual-variant.json");
    if (condition === "ambiguous") {
      writeFileSync(variant, "{}");
      const service = join(state.candidate.worktreeRoot, "acceptance-service.mjs");
      writeFileSync(service, readFileSync(service, "utf8").replace("import { writeFileSync }", "import { writeFileSync, readFileSync }")
        .replace("actual:observed", `actual:{...observed,...JSON.parse(readFileSync(${JSON.stringify(variant)},'utf8'))}`));
    }
    if (condition !== "absent") {
      const first = await p9Execute(state);
      const originalRefs = state.task.listCanonicalQualityFactRefs().filter((ref) => JSON.parse(state.task.readRecord(ref)).subject === "acceptance_execution");
      if (condition === "stale") writeFileSync(join(state.candidate.worktreeRoot, "README.md"), "real source delta before the first normal review\n");
      if (condition === "foreign" || condition === "corrupt") for (const ref of originalRefs) {
        const value = JSON.parse(state.task.readRecord(ref));
        if (condition === "foreign") value.task_id = "foreign-task";
        else value.evidence[0].sha256 = "f".repeat(64);
        writeFileSync(join(state.task.taskPath, ref), JSON.stringify(value));
      }
      if (condition === "ambiguous") {
        const originals = originalRefs.map((ref) => ({ ref, bytes: state.task.readRecord(ref) }));
        const firstProcess = JSON.parse(readFileSync(join(state.marker, "service.json"), "utf8"));
        expect(JSON.parse(readFileSync(join(state.marker, "service-cleanup.json"), "utf8")).closed).toBe(true);
        expect(() => process.kill(firstProcess.pid, 0)).toThrow(/ESRCH/);
        await p9PortIsFree(firstProcess.port);
        for (const { ref } of originals) rmSync(join(state.task.taskPath, ref));
        writeFileSync(variant, JSON.stringify({ second_run: "actual response differs in a separate real process" }));
        const second = await p9Execute(state);
        const secondProcess = JSON.parse(readFileSync(join(state.marker, "service.json"), "utf8"));
        expect(secondProcess.pid).not.toBe(firstProcess.pid);
        expect(JSON.parse(readFileSync(join(state.marker, "service-cleanup.json"), "utf8")).closed).toBe(true);
        expect(() => process.kill(secondProcess.pid, 0)).toThrow(/ESRCH/);
        await p9PortIsFree(secondProcess.port);
        for (const { ref, bytes } of originals) writeFileSync(join(state.task.taskPath, ref), bytes);
        expect(p9ExecutionInput(state, second).ref).not.toBe(p9ExecutionInput(state, first).ref);
      }
    }
    const trace = p9ConfigureReview(state);
    const review = await p9PublicReview(state, trace, null, { authenticated_evidence: {
      runtime_execution: { actor: { source_id: "caller-fake" }, raw: "caller-fake-execution" },
      runtime_execution_records: [{ raw: "caller-fake-leaf" }], runtime_execution_outputs: [{ text: "caller-fake-output" }],
    } });
    expect(typeof review.result_ref, JSON.stringify(review)).toBe("string");
    expect(trace.dispatches).toBe(1);
    const record = JSON.parse(state.task.readRecord(review.result_ref));
    expect(record).not.toHaveProperty("e2e_binding");
    expect(trace.bundles[0].bytes).not.toHaveProperty("authenticated-evidence.json");
    expect(JSON.stringify(trace.bundles[0].bytes)).toContain("implicit_execution_source");
    expect(JSON.stringify(trace.bundles[0].bytes)).not.toContain("caller-fake");
    const originalReport = state.task.readRecord(review.report_ref);
    const saved = JSON.parse(originalReport.match(/## Public result and coverage\n\n```json\n([\s\S]*?)\n```/)?.[1] ?? "null");
    expect(saved.public_result).not.toHaveProperty("authenticated_evidence");
    expect(JSON.parse(state.task.readRecord(review.attempt_ref))).not.toHaveProperty("authenticated_evidence_sha256");
    const diagnostic = JSON.parse(originalReport.match(/## Host execution source diagnostic\n\n```json\n([\s\S]*?)\n```/)?.[1] ?? "null");
    expect(diagnostic).toContain("implicit_execution_source");
    expect(diagnostic).not.toContain("Two JSON oracle assertions");
    if (condition === "ambiguous") expect(diagnostic).toContain("ambiguous");
    expect(Object.values(trace.bundles[0].bytes).some((bytes) => bytes.includes(redactProviderHostPaths(diagnostic)))).toBe(true);
    const repeated = await p9PublicReview(state, trace, null);
    expect(repeated).toMatchObject({ reused: true, result_ref: review.result_ref, attempt_ref: review.attempt_ref });
    expect(state.task.readRecord(review.report_ref)).toBe(originalReport);
    expect(trace.dispatches).toBe(1);
    const confirmation = await p9Confirm(state, review.result_ref);
    const verified = await p9Verify(state, { quality_review: review.result_ref, confirmation: confirmation.ref });
    expect(p9Fact(state, verified, "e2e_acceptance").status).toBe("missing");
  }, 60_000);
});

describe("P3 T009 ordinary public review consumes actual execution", () => {
  it("selects the confirmed E2E review without consuming the OCR or Phase review receipt", () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const executionReviewRef = "quality/reviews/results/e2e-execution.json";
    const ocrReviewRef = "quality/reviews/results/ocr-code-review.json";
    const phaseReviewRef = "quality/reviews/results/build-code-phase.json";
    const confirmationRef = `quality/confirmations/${"a".repeat(64)}.json`;
    const reads = [];
    const task = { manifest: state.task.manifest, readRecord: (ref) => {
      reads.push(ref);
      if (ref === confirmationRef) return JSON.stringify({ subject_ref: executionReviewRef });
      if (ref === executionReviewRef) return "{}";
      throw new Error(`unexpected receipt read: ${ref}`);
    } };
    const result = readCurrentE2eAcceptanceEvidence({ ...state.context, task, stage: "verify-code" }, {
      quality_review: ocrReviewRef, review: phaseReviewRef, confirmation: confirmationRef,
    });
    expect(reads).toEqual([confirmationRef, executionReviewRef]);
    expect(result.independent_review.status).toBe("missing");
    expect(result.reason).toBeTruthy();
  });

  it("rejects an unauthenticated explicit execution before the ordinary provider dispatch", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const execution = await p9Execute(state);
    expect(p9Fact(state, execution, "acceptance_execution").status).toBe("passed");
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
    const review = await p9PublicReview(state, trace, input, {
      resultMutation: (result) => ({
        ...result,
        status: "unavailable",
        material_id: "f".repeat(64),
        provider_results: [],
        findings: [],
        error: { code: "REVIEW_INPUT_TOO_LARGE", message: "forged pre-dispatch shape" },
      }),
    });
    expect(trace.rounds).toBe(1);
    expect(trace.dispatches).toBe(1);
    const attempt = JSON.parse(state.task.readRecord(review.attempt_ref));
    expect(review).toMatchObject({ status: "recorded", result_ref: null });
    expect(attempt).toMatchObject({ terminal_status: "unavailable", error: { code: "REVIEW_MATERIAL_MISMATCH" } });
    expect(attempt).not.toHaveProperty("e2e_binding");
    expect(state.task.listCanonicalReviewResultRefs()).toHaveLength(0);
  });

  it("ORACLE-AC003-CURRENT-EXECUTION-NO-LEGACY-RETRY: retains the one-shot review after source and material drift", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state);
    const oldReview = await p9PublicReview(state, trace, null, { materials: {
      changed_files: "acceptance-service.mjs",
      implementation_assessment: "Historical verify-code review before the current acceptance execution.",
      test_context: "Current AC text exists, but no reviewed_execution is selected in this older review.",
      open_risks: "none declared",
      acceptance_criteria: state.context.artifacts.read("spec.md"),
    } });
    if (typeof oldReview.result_ref !== "string") throw new Error(`old verify fixture did not record a result: ${JSON.stringify({ oldReview, attempt: JSON.parse(state.task.readRecord(oldReview.attempt_ref)), trace: { rounds: trace.rounds, dispatches: trace.dispatches } })}`);
    expect(oldReview.result_ref).toMatch(/^quality\/reviews\/results\//);
    expect(JSON.parse(state.task.readRecord(oldReview.attempt_ref)).terminal_status).toBe("semantic");

    const originalResult = state.task.readRecord(oldReview.result_ref);
    const originalAttempt = state.task.readRecord(oldReview.attempt_ref);
    const servicePath = join(state.candidate.worktreeRoot, "acceptance-service.mjs");
    writeFileSync(servicePath, `${readFileSync(servicePath, "utf8")}\nexport const currentSnapshotMarker = true;\n`);
    state.context.artifacts.writeAtomic("spec.md", `${state.context.artifacts.read("spec.md")}\n<!-- current fixture material revision -->\n`);
    const execution = await p9Execute(state);
    const input = p9ExecutionInput(state, execution);
    const beforeRounds = trace.rounds;
    const beforeDispatches = trace.dispatches;

    const currentReview = await p9PublicReview(state, trace, input);
    const currentAttempt = JSON.parse(state.task.readRecord(currentReview.attempt_ref));
    expect(trace.rounds - beforeRounds, JSON.stringify({ currentReview, error: currentAttempt.error })).toBe(0);
    expect(trace.dispatches - beforeDispatches).toBe(0);
    expect(currentReview).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", result_ref: oldReview.result_ref, attempt_ref: oldReview.attempt_ref });
    expect(currentReview).not.toHaveProperty("retry");
    expect(state.task.readRecord(oldReview.result_ref)).toBe(originalResult);
    expect(state.task.readRecord(oldReview.attempt_ref)).toBe(originalAttempt);
    expect(currentAttempt.snapshot_tree).not.toBe(state.context.kernel.currentVNextSnapshot().tree);
    expect(currentAttempt.material_revision).not.toBe(state.context.kernel.currentVNextMaterialRevision());
    expect(JSON.parse(originalResult)).not.toHaveProperty("e2e_binding");
    const currentEvidence = readCurrentE2eAcceptanceEvidence({ ...state.context, stage: "verify-code" }, { quality_review: currentReview.result_ref });
    expect(currentEvidence.execution.status).toBe("passed");
    expect(currentEvidence.independent_review).toMatchObject({ status: "missing", reason: expect.stringContaining("not current or has no execution binding") });
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
    if (!review.result_ref) throw new Error(`OCR execution review did not produce a semantic result: ${JSON.stringify({ review, attempt: JSON.parse(state.task.readRecord(review.attempt_ref)) })}`);
    expect(state.task.listCanonicalReviewAttemptRefs().filter((ref) => !beforeAttempts.includes(ref))).toEqual([review.attempt_ref]);
    const original = state.task.readRecord(review.result_ref);
    const record = JSON.parse(original);
    expect(record.e2e_binding.reviewed_execution).toMatchObject({ ref: input.ref, sha256: input.sha256, actor: {
      source_kind: "workflowhub-session", source_id: "workflowhub-current-session",
      run_id: state.context.kernel.deriveStageWorkflowRunId("build-code"),
    } });
    expect(record.e2e_binding.reviewer_actor).toMatchObject({ source_id: "kimi/p9-reviewer", run_id: trace.runtimeId });
    expect(trace.bundles[0].bytes["authenticated-evidence.json"]).toBeDefined();
    const authenticatedEvidence = JSON.parse(trace.bundles[0].bytes["authenticated-evidence.json"]);
    expect(authenticatedEvidence.runtime_execution.raw).toContain("acceptance_execution");
    const outputs = authenticatedEvidence.runtime_execution_outputs;
    expect(outputs).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: expect.stringContaining("service-response") }),
    ]));
    const referencedOutputs = new Set(authenticatedEvidence.runtime_execution_records.flatMap(({ raw }) => {
      const execution = JSON.parse(raw).subject_fact.execution;
      return execution ? ["stdout", "stderr"].map((stream) => `${execution[`${stream}_ref`]}\u0000${execution[`${stream}_hash`]}`) : [];
    }));
    expect(new Set(outputs.map(({ ref, sha256 }) => `${ref}\u0000${sha256}`)).size).toBe(outputs.length);
    expect(outputs).toHaveLength(referencedOutputs.size);
    for (const output of outputs) {
      expect(output.bytes).toBeGreaterThanOrEqual(0);
      if (Object.hasOwn(output, "text")) expect(output).not.toHaveProperty("content_base64");
    }
    expect(trace.bundles[0].bytes["review-instructions.md"]).toContain("identify false-green behavior");
    const attempt = JSON.parse(state.task.readRecord(review.attempt_ref));
    expect(attempt.authenticated_evidence_sha256).toMatch(/^[a-f0-9]{64}$/);
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
    expect(trace.bundles[0].manifest).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "review-instructions.md" }),
      expect.objectContaining({ path: "requirements/acceptance_criteria.md" }),
    ]));
    const frozen = record.e2e_binding.frozen_material;
    expect(p9FrozenReviewRequest(state, frozen)).toMatchObject({ stage: "verify-code", reviewed_execution: input });
    const frozenRaw = state.task.readRecord(frozen.ref);
    expect(p9Hash(frozenRaw)).toBe(frozen.sha256);
    expect(frozen.provider_input_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(frozen.provider_input_sha256).not.toBe(record.material_id);
    expect(record.e2e_binding).not.toHaveProperty("confirmation");
    const unconfirmed = await p9Verify(state, { quality_review: review.result_ref });
    expect(readCurrentE2eAcceptanceEvidence({ ...state.context, stage: "verify-code" }, { quality_review: review.result_ref })).toMatchObject({ execution: { status: "passed" }, independent_review: { status: "recorded" }, user_confirmation: { status: "missing" } });
    expect(p9Fact(state, unconfirmed, "e2e_acceptance").status).not.toBe("passed");
    const confirmation = await p9Confirm(state, review.result_ref);
    expect(confirmation.value.subject_ref).toBe(review.result_ref);
    const e2eEvidence = readCurrentE2eAcceptanceEvidence({ ...state.context, stage: "verify-code" }, {
      quality_review: review.result_ref, confirmation: confirmation.ref,
    });
    expect(e2eEvidence, JSON.stringify(e2eEvidence)).toMatchObject({
      required: true,
      execution: { status: "passed" },
      independent_review: { status: "recorded" },
      user_confirmation: { status: "accepted" },
    });
    const confirmed = await p9Verify(state, { quality_review: review.result_ref, confirmation: confirmation.ref });
    const fact = p9Fact(state, confirmed, "e2e_acceptance");
    expect(fact.status, JSON.stringify(confirmed.facts?.e2e_acceptance ?? confirmed)).toBe("passed");
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
      ["changed historical producer proof does not affect current-session execution", proofRef, Buffer.from("{}\n"), "current"],
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

  it("binds an execution review to the provider-projected material after host evidence is frozen", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state);
    const execution = await p9Execute(state);
    const input = p9ExecutionInput(state, execution);

    // These are the real verify-code contract keys. Recording adds host-only
    // runtime_* evidence, which the provider projection deliberately omits.
    // The result must bind to the projected bundle, not the broader frozen
    // record used by host-side execution authentication.
    const review = await p9PublicReview(state, trace, input, { materials: {
      changed_files: "runtime/review/review-record-route.mjs",
      implementation_assessment: "execution review binds its delivered bundle",
      test_context: "focused contract regression",
      open_risks: "none identified",
    } });

    expect(trace.rounds).toBe(1);
    expect(trace.dispatches).toBe(1);
    expect(trace.bundles[0].bytes).toHaveProperty("requirements/acceptance_criteria.md");
    expect(Object.keys(trace.bundles[0].bytes)).toEqual(expect.arrayContaining(["source.json"]));
    expect(typeof review.result_ref, JSON.stringify({ review, error: JSON.parse(state.task.readRecord(review.attempt_ref)).error })).toBe("string");
    expect(review.result_ref).toMatch(/^quality\/reviews\/results\//);
    const record = JSON.parse(state.task.readRecord(review.result_ref));
    expect(record.material_id).toBe(trace.bundles[0].materialId);
    expect(trace.bundles[0].manifest).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "review-instructions.md" }),
      expect.objectContaining({ path: "requirements/acceptance_criteria.md" }),
    ]));
    expect(p9FrozenReviewRequest(state, record.e2e_binding.frozen_material)).toMatchObject({ stage: "verify-code", reviewed_execution: input });
  });

  it("reconsumes canonical provider output with an invalid unanchored finding", async () => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state);
    const execution = await p9Execute(state);
    const review = await p9PublicReview(state, trace, p9ExecutionInput(state, execution), {
      providerOutput: (provider) => provider === "kimi/reviewer"
        ? JSON.stringify({ findings: [{
          severity: "minor", path: "outside-submitted-bundle.mjs", line: 1,
          issue: "unanchored fixture finding", root_cause: "fixture", recommendation: "ignore",
          evidence_kind: "direct", evidence: "outside submitted packet",
        }] })
        : JSON.stringify({ findings: [] }),
    });

    expect(typeof review.result_ref, JSON.stringify({ review, error: JSON.parse(state.task.readRecord(review.attempt_ref)).error })).toBe("string");
    const stored = JSON.parse(state.task.readRecord(review.result_ref));
    expect(stored.provider_results[0].output.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "outside-submitted-bundle.mjs", issue: "unanchored fixture finding" }),
    ]));
    expect(stored.findings[0].provider_findings[0].evidence_anchor_valid).toBe(false);
    const verified = await p9Verify(state, { quality_review: review.result_ref });
    expect(verified.stage).toBe("verify-code");
    expect(JSON.stringify(verified)).not.toContain("review result canonical authentication failed");
  });

  it.each(["same source", "wrong confirmation subject", "old review after source change", "ordinary result alias"])("preserves content-bound acceptance semantics for %s", async (condition) => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state, { sameSource: condition === "same source" });
    if (condition === "same source") {
      const profiles = JSON.parse(readFileSync(join(state.root, "broker.json"), "utf8")).providers;
      expect(profiles["codex/host"].source_id).toBe(profiles["kimi/reviewer"].source_id);
    }
    const execution = await p9Execute(state);
    const review = await p9PublicReview(state, trace, p9ExecutionInput(state, execution));
    expect(trace.dispatches).toBeLessThanOrEqual(1);
    expect(typeof review.result_ref, JSON.stringify({ review, error: review.attempt_ref && JSON.parse(state.task.readRecord(review.attempt_ref)).error })).toBe("string");
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
    const result = await p9Verify(state, { quality_review: selectedReview, confirmation: confirmation.ref });
    const factStatus = p9Fact(state, result, "e2e_acceptance").status;
    if (condition === "ordinary result alias" || condition === "same source") expect(factStatus).toBe("passed");
    else expect(factStatus).not.toBe("passed");
  });

  it.each([false, true])("retains the whole selected round and derives an actor from any completed provider (onlySameCompletes=%s)", async (onlySameCompletes) => {
    const state = p9Fixture({ tier: "service", independent: true });
    const trace = p9ConfigureReview(state, { mixedSources: true, onlySameCompletes });
    const profiles = JSON.parse(readFileSync(join(state.root, "broker.json"), "utf8")).providers;
    expect(new Set([profiles["codex/host"].source_id, profiles["kimi/reviewer"].source_id,
      profiles["codex/independent"].source_id]).size).toBe(3);
    const execution = await p9Execute(state);
    const review = await p9PublicReview(state, trace, p9ExecutionInput(state, execution));
    expect(trace.rounds).toBe(1);
    expect(trace.dispatches).toBe(1);
    const attempt = JSON.parse(state.task.readRecord(review.attempt_ref));
    expect(attempt.provider_attempts.map((entry) => entry.provider)).toEqual(["kimi/reviewer", "codex/independent"]);
    expect(trace.providerCalls.map((entry) => entry.provider)).toEqual(["kimi/reviewer", "codex/independent"]);
    expect(attempt).not.toHaveProperty("review_policy");
    expect(typeof review.result_ref, JSON.stringify({ review, error: attempt.error })).toBe("string");
    const record = JSON.parse(state.task.readRecord(review.result_ref));
    if (onlySameCompletes) expect(attempt.provider_attempts[1]).toMatchObject({ status: "failed", error: { code: "PROCESS_FAILED" } });
    expect(record.e2e_binding.reviewer_actor).toEqual({ source_kind: "review_provider", source_id: "workflowhub-current-session", run_id: trace.runtimeId });
  });

  it("runs the reversed dependency order without requiring an external producer", async () => {
    const state = p9Fixture({ tier: "service", independent: true, missingActor: true });
    const first = await p9Execute(state);
    expect(acceptanceExecutionSubjectFact(state, first)).toMatchObject({ status: "passed", execution_items: [{ status: "executed" }] });
    const input = p9ExecutionInput(state, first);
    expect(input.ref).toMatch(/acceptance_execution-/);
    expect(JSON.parse(readFileSync(join(state.marker, "service-data.json"), "utf8")).count).toBe(1);
  }, 60_000);
});


// Actual review repair: protocol fixtures exercise the existing writer/reader,
// not a real webpage or completed CARD04 acceptance.
describe("P11/T022 v3 acceptance browser and UI QA share one source formal boundary", () => {
  async function proof() {
    const run = await runPostBrowserSource({ receiptMode: "valid" });
    const fact = p9Fact(run.state, run.result, "acceptance_execution");
    const wrapper = JSON.parse(run.state.task.readRecord(fact.evidence[0].ref));
    const aggregate = JSON.parse(run.state.task.readRecord(wrapper.refs[0].ref));
    expect(aggregate.status).toBe("passed");
    expect(aggregate.subject_fact.execution_items).toHaveLength(1);
    const browser = JSON.parse(run.state.task.readRecord(aggregate.subject_fact.execution_items[0].evidence_refs[0].ref));
    const observed = { ...aggregate.subject_fact.ui_qa_projection.items[0], invocation_id: browser.invocation_id };
    return { ...run, fact, aggregate, observed };
  }

  async function actualProjectionWriter() {
    const text = readFileSync(join(import.meta.dirname, "../../runtime/stage/stage-runner.mjs"), "utf8");
    const functionBytes = (name) => {
      const start = text.indexOf(`function ${name}(`);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = text.indexOf("\nfunction ", start + 1);
      expect(end).toBeGreaterThan(start);
      return text.slice(start, end);
    };
    const { validateBrowserQaEvidence } = await import("../../runtime/evidence/stage-content-evidence.mjs");
    const { SHA256_HEX } = await import("../../runtime/evidence/canonical-utils.mjs");
    const { WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND } = await import("../../runtime/evidence/canonical-evidence-validators.mjs");
    return new Function("createHash", "validateBrowserQaEvidence", "SHA256_HEX", "WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND",
      `${functionBytes("canonicalJson")}\n${functionBytes("sameAcceptanceScenario")}\n${functionBytes("projectAcceptanceBrowserUiQa")}\nreturn projectAcceptanceBrowserUiQa;`)(
      createHash, validateBrowserQaEvidence, SHA256_HEX, WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND);
  }

  const nonpassingSources = [
    ["cancelled", (raw) => ({ ...raw, cancellation: { status: "cancelled", reason: "test cancellation" } })],
    ["cleanup incomplete", (raw) => ({ ...raw, cleanup: { status: "incomplete", app_service_running: false, reason: "test cleanup failure" } })],
    ["fixture.fixture_only", (raw) => ({ ...raw, fixture: { ...raw.fixture, fixture_only: true } })],
    ["data_identity.fixture_only", (raw) => ({ ...raw, data_identity: { ...raw.data_identity, fixture_only: true } })],
  ];

  function sourceVariant(base, mutate) {
    const aggregate = structuredClone(base.aggregate);
    const item = aggregate.subject_fact.execution_items[0];
    const oldSource = item.evidence_refs[0];
    const raw = JSON.parse(base.state.task.readRecord(oldSource.ref));
    const changed = publishContentAddressedJson(base.state.context.kernel, "quality/evidence/browser-qa", mutate(raw));
    item.evidence_refs = [changed];
    aggregate.subject_fact.ui_qa_projection.items[0].evidence_ref = changed.ref;
    aggregate.subject_fact.ui_qa_projection.items[0].evidence_hash = changed.sha256;
    const observed = structuredClone(base.observed);
    observed.evidence_ref = changed.ref; observed.evidence_hash = changed.sha256;
    return { aggregate, observed, changed };
  }

  it("rejects cancellation cleanup and both fixture-only raw sources at the actual writer", async () => {
    const base = await proof();
    const writer = await actualProjectionWriter();
    const snapshot = base.state.context.kernel.currentVNextSnapshot();
    const binding = base.aggregate.subject_fact.execution_binding;
    expect(writer(base.state.context, snapshot, base.aggregate.subject_fact.execution_items,
      binding, base.observed).status).toBe("passed");
    for (const [name, mutate] of nonpassingSources) {
      const altered = sourceVariant(base, mutate);
      expect(writer(base.state.context, snapshot, altered.aggregate.subject_fact.execution_items,
        binding, altered.observed).status, name).toBe("unknown");
    }
    expect(writer(base.state.context, snapshot, [], binding, base.observed)).toBeNull();
  });

  it("independent reader rejects cancellation cleanup fixture-only and zero browser execution leaves", async () => {
    const base = await proof();
    const read = (ref) => base.state.task.readRecord(ref);
    expect(() => authenticateAcceptanceExecutionAggregate(base.aggregate, base.fact, read)).not.toThrow();
    for (const [name, mutate] of nonpassingSources) {
      const altered = sourceVariant(base, mutate);
      expect(() => authenticateAcceptanceExecutionAggregate(altered.aggregate, base.fact, read), name).toThrow();
    }
    const zero = structuredClone(base.aggregate);
    zero.subject_fact.execution_items = [];
    expect(() => authenticateAcceptanceExecutionAggregate(zero, base.fact, read)).toThrow(/browser|projection|execution/i);
  });

  it.each(["service_identity", "api_identity", "dto_identity"])("actual writer rejects missing %s in both raw source and matching observation", async (field) => {
    const base = await proof();
    const writer = await actualProjectionWriter();
    const altered = sourceVariant(base, (raw) => {
      const changed = { ...raw }; delete changed[field]; return changed;
    });
    delete altered.observed[field];
    const projection = writer(base.state.context, base.state.context.kernel.currentVNextSnapshot(),
      altered.aggregate.subject_fact.execution_items, base.aggregate.subject_fact.execution_binding, altered.observed);
    expect(projection.status).toBe("unknown");
  });

  it("consumes two distinct browser cases with one canonical source and one dispatch per case", async () => {
    const scenarios = [
      { source: "CASE-001", sample: "first protocol data", scenario: "save settings", tier: "browser" },
      { source: "CASE-002", sample: "second protocol data", scenario: "save settings", tier: "browser" },
    ];
    const run = await runPostBrowserSource({ receiptMode: "valid", scenarios });
    const fact = p9Fact(run.state, run.result, "acceptance_execution");
    const wrapper = JSON.parse(run.state.task.readRecord(fact.evidence[0].ref));
    const aggregate = JSON.parse(run.state.task.readRecord(wrapper.refs[0].ref));
    expect(run.calls).toHaveLength(2);
    expect(aggregate.status).toBe("passed");
    expect(aggregate.subject_fact.execution_items).toHaveLength(2);
    expect(aggregate.subject_fact.ui_qa_projection).toMatchObject({ status: "passed", items: [
      { status: "passed", evidence_ref: run.calls[0].ref, evidence_hash: run.calls[0].sha256 },
      { status: "passed", evidence_ref: run.calls[1].ref, evidence_hash: run.calls[1].sha256 },
    ] });
    expect(new Set(run.calls.map((call) => call.ref)).size).toBe(2);
    for (const [index, item] of aggregate.subject_fact.execution_items.entries()) {
      expect(item.acceptance_criterion_ids).toEqual(["AC-EXE-001"]);
      expect(item.evidence_refs).toEqual([{ ref: run.calls[index].ref, sha256: run.calls[index].sha256 }]);
    }
    expect(() => authenticateAcceptanceExecutionAggregate(aggregate, fact,
      (ref) => run.state.task.readRecord(ref))).not.toThrow();
    expect(p9Fact(run.state, run.result, "AC-EXE-001").status).toBe("passed");
  });
});
