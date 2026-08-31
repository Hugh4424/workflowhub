import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { writeCanonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-ui-design-gate-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub UI contract"]);
  git(repo, ["config", "user.email", "ui-contract@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    taskPath: join(storage, "Projects", "Demo", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-08-30T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  const kernel = createTaskKernel(task, { workspace, artifacts });
  return { task, artifacts, workspace, candidateWorkspace, kernel };
}

const uiSources = {
  raw_requirement: { conclusion: "ui", reason: "用户要编辑设置页面" },
  project_inventory: { conclusion: "ui", reason: "已有 /settings 路由" },
  planned_or_changed_frontend_fact: { conclusion: "ui", reason: "计划修改 SettingsForm" },
};

function decisionLog(applicability) {
  if (applicability === undefined) return "# 当前决策\n";
  return `# 当前决策

## UI applicability
\`\`\`json
${JSON.stringify(applicability, null, 2)}
\`\`\`
`;
}

function context(state, stage) {
  return {
    stage,
    task: state.task,
    kernel: state.kernel,
    identity: state.task.identity,
    workflowRunId: state.kernel.deriveStageWorkflowRunId(stage),
    manifest: state.task.manifest,
    workspace: state.workspace,
    artifacts: state.artifacts,
  };
}

async function runBuildSpec(taskId, options = {}) {
  const decision = Object.hasOwn(options, "decision") ? options.decision : { result: "ui", sources: uiSources };
  const { contractFacts } = options;
  const state = fixture(taskId);
  state.artifacts.writeAtomic("decision-log.md", decisionLog(decision));
  if (options.validOutcome !== true) {
    state.artifacts.writeAtomic("spec.md", "# Spec\n\n## 9. 验收标准\n- [ ] **AC-001**：结果可验证。\n");
  }
  const resolvedContractFacts = typeof contractFacts === "function" ? contractFacts(state) : contractFacts;
  const snapshot = state.candidateWorkspace.captureSnapshot();
  const review = writeFormalReviewFixture({ task: state.task, stage: "build-spec", snapshotTree: snapshot.tree });
  const outcome = writeStageOutcomeFixture({
    task: state.task, kernel: state.kernel, artifacts: state.artifacts, workspace: state.workspace,
    stage: "build-spec", attemptId: `${taskId}-attempt`,
    skillEvidence: resolvedContractFacts?.frontend_prototype_render
      ? { "frontend-prototype-render": resolvedContractFacts.frontend_prototype_render }
      : {},
    skipAnalyzerValidation: options.validOutcome !== true,
  });
  const result = await runOfficialStage("build-spec", context(state, "build-spec"), {
    ...(resolvedContractFacts === undefined ? {} : { contract_facts: resolvedContractFacts }),
    receipts: { review: review.resultRef, stage_outcomes: outcome.ref },
  });
  return { state, result };
}

async function runBuildCode(taskId, options = {}) {
  const decision = Object.hasOwn(options, "decision") ? options.decision : { result: "ui", sources: uiSources };
  const state = fixture(taskId);
  state.artifacts.writeAtomic("decision-log.md", decisionLog(decision));
  const result = await runOfficialStage("build-code", context(state, "build-code"), {
    ...(options.contractFacts === undefined ? {} : { contract_facts: options.contractFacts }),
    receipts: {},
  });
  return { state, result };
}

async function runBuildPlan(taskId, options = {}) {
  const decision = Object.hasOwn(options, "decision") ? options.decision : { result: "ui", sources: uiSources };
  const state = fixture(taskId);
  state.artifacts.writeAtomic("decision-log.md", decisionLog(decision));
  const snapshot = state.candidateWorkspace.captureSnapshot();
  const review = writeFormalReviewFixture({ task: state.task, stage: "build-plan", snapshotTree: snapshot.tree });
  const outcome = writeStageOutcomeFixture({
    task: state.task, kernel: state.kernel, artifacts: state.artifacts, workspace: state.workspace,
    stage: "build-plan", attemptId: `${taskId}-attempt`, skipAnalyzerValidation: true,
  });
  const result = await runOfficialStage("build-plan", context(state, "build-plan"), {
    ...(options.contractFacts === undefined ? {} : { contract_facts: options.contractFacts }),
    receipts: { review: review.resultRef, stage_outcomes: outcome.ref },
  });
  return { state, result };
}

const nonUiDecision = {
  result: "non_ui",
  sources: {
    raw_requirement: { conclusion: "non_ui", reason: "只改任务存储" },
    project_inventory: { conclusion: "non_ui", reason: "没有页面 consumer" },
    planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "只改 Node 校验" },
  },
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function publishCanonical(state, ref, raw) {
  state.kernel.publishCanonicalRecord(ref, raw);
  return { ref, hash: sha256(raw) };
}

function publishEvidence(state, name, raw) {
  return publishCanonical(state, `quality/evidence/ui-design/${name}`, raw);
}

function publishPublishedEvidence(state, name, content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  const value = {
    schema_version: "workflowhub-evidence-publication.v1",
    source_path: `qa-artifacts/${name}`,
    content_sha256: sha256(bytes),
    content_encoding: "base64",
    content_base64: bytes.toString("base64"),
    publisher: "build-spec",
    recorded_at: "2026-08-30T00:00:00.000Z",
  };
  return publishEvidence(state, name, `${JSON.stringify(value)}\n`);
}

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function publishWorkspaceSource(state, relativePath, raw) {
  const path = join(state.workspace.worktreeRoot, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, raw);
  return { ref: relativePath, hash: sha256(raw) };
}

function workspaceSnapshotTree(state) {
  return captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
}

function publishBuildSpecConfirmation(state, subjectRef, snapshotTree = workspaceSnapshotTree(state)) {
  const raw = `${JSON.stringify({
    schema_version: "human-confirmation.v2",
    task_id: state.task.identity.taskId,
    stage: "build-spec",
    decision: "accepted",
    subject_ref: subjectRef,
    material_revision: state.kernel.currentVNextMaterialRevision(),
    snapshot_tree: snapshotTree,
    confirmed_at: "2026-08-30T00:00:00.000Z",
  }, null, 2)}\n`;
  return publishCanonical(state, `quality/confirmations/${sha256(raw)}.json`, raw);
}

function validRendererContract(state) {
  const component = publishWorkspaceSource(state, "src/components/SettingsForm.tsx", "export function SettingsForm() { return null; }\n");
  const fixture = publishWorkspaceSource(state, "fixtures/settings-default.json", "{\"theme\":\"light\"}\n");
  const output = publishEvidence(state, "settings-render.output", "Rendered SettingsForm at 1440x900\n");
  const preview = publishPublishedEvidence(state, "settings-preview.html", "<main>SettingsForm preview</main>\n");
  const screenshot = publishPublishedEvidence(state, "settings-preview.png", ONE_PIXEL_PNG);
  const designContent = "# Design\n\n<!-- anchor: design-root -->\n\nShared form tokens and variants.\n";
  const experienceContent = "# Experience\n\n<!-- anchor: experience-root -->\n\nSettings page flow and recovery.\n";
  publishWorkspaceSource(state, "Design.md", designContent);
  publishWorkspaceSource(state, "Experience.md", experienceContent);
  const design = {
    document_kind: "design",
    path: "Design.md",
    content_sha256: sha256(designContent),
    revision: "design-r1",
    anchor_id: "design-root",
  };
  const experience = {
    document_kind: "experience",
    path: "Experience.md",
    content_sha256: sha256(experienceContent),
    revision: "experience-r1",
    anchor_id: "experience-root",
  };
  const materialRevision = state.kernel.currentVNextMaterialRevision();
  const snapshotTree = workspaceSnapshotTree(state);
  const confirmation = publishBuildSpecConfirmation(state, preview.ref, snapshotTree);
  return {
    ui_project_init: {
      mode: "new",
      design_path: design.path,
      design_revision: design.revision,
      experience_path: experience.path,
      experience_revision: experience.revision,
      design_identity: design,
      experience_identity: experience,
      scope: "Settings page",
      component_boundary: "src/components/settings",
      style_boundary: "tokens/forms",
      fixture: "settings-default",
      viewport: "desktop-1440x900",
      preview: preview.ref,
    },
    design_source_readiness: {
      design_path: design.path,
      design_revision: design.revision,
      expected_design_revision: design.revision,
      design_identity: design,
      experience_identity: experience,
      sections: [{
        anchor_id: "settings",
        page_or_region: "Settings page",
        goal: "edit settings",
        primary_action: "Save",
        states: ["default", "loading", "error"],
        components: "SettingsForm",
        tokens: "tokens/forms",
        fixture: "settings-default",
        viewport: "desktop-1440x900",
        responsive: "stack actions on narrow viewport",
        a11y: "label controls",
        evidence: preview.ref,
      }],
    },
    frontend_prototype_render: {
      component_inputs: [{
        component_ref: component.ref,
        component_hash: component.hash,
        export_name: "SettingsForm",
        fixture_ref: fixture.ref,
        fixture_hash: fixture.hash,
      }],
      render_command: "npm run preview -- --route /settings",
      exit_code: 0,
      output_ref: output.ref,
      output_hash: output.hash,
      viewport: "1440x900",
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
      preview_ref: preview.ref,
      preview_hash: preview.hash,
      screenshot_ref: screenshot.ref,
      screenshot_hash: screenshot.hash,
    },
    plan_design_review: {
      state: "human_approved",
      continuation_allowed: true,
      current_material_ref: "spec.md",
      material_revision: materialRevision,
      display_before_reply: true,
      design_artifact_ref: preview.ref,
      design_artifact_hash: preview.hash,
    reply_ref: confirmation.ref,
    reply_hash: confirmation.hash,
      reply_source: "user",
      displayed_at_ms: 1000,
      reply_at_ms: 2000,
      input_identities: { design, experience },
      human_confirmation: { result: "approved" },
      confirmation_ref: confirmation.ref,
      confirmation_hash: confirmation.hash,
    },
    ui_contract: {
      page_or_region: "Settings page",
      design_status: "ready",
      design_authority: { design, experience },
      missing_items: [],
      fallback_visual_basis: "existing SettingsForm component",
      constraints: ["reuse existing form"],
      assumptions: [],
      rework_risk: "none",
      human_confirmation: { result: "approved" },
      current_material_ref: "spec.md",
      design_revision: design.revision,
      visible_labels: ["Settings", "Save"],
      preview_refs: [preview.ref],
      fixture_refs: [fixture.ref],
      viewport_refs: ["1440x900"],
      screenshot_refs: [screenshot.ref],
      states: [{
        name: "default",
        interaction_flow: "edit a setting and save",
        visible_structure: "SettingsForm",
        fixture_shape: "settings-default",
        available_actions: "Save",
        disabled_actions: "none",
        trigger: "edit setting",
        recovery_or_exit: "retry or leave page",
        permission_result: "allowed",
        responsive: "stack actions on narrow viewport",
        a11y: "label controls",
        preview_browser_screenshot_assertion: "preview matches screenshot",
      }],
    },
  };
}

function selfDeclaredRendererContract(state) {
  const contract = validRendererContract(state);
  contract.frontend_prototype_render = {
    component_inputs: ["SettingsForm"],
    render_command: "npm run preview",
    material_revision: contract.plan_design_review.material_revision,
    preview_ref: contract.plan_design_review.design_artifact_ref,
    preview_hash: contract.plan_design_review.design_artifact_hash,
    screenshot_ref: publishEvidence(state, "self-declared-screenshot.txt", "not a render receipt\n").ref,
    screenshot_hash: sha256("not a render receipt\n"),
  };
  return contract;
}

function externalDesignContract(state) {
  const contract = validRendererContract(state);
  const prompt = {
    page_or_region: "Settings page",
    interactions: ["edit settings", "Save"],
    states: ["default", "error"],
    visible_labels: ["Settings", "Save"],
  };
  const promptText = [
    "页面/区域：Settings page",
    "交互：edit settings；Save",
    "状态：default；error",
    "可见 label：Settings、Save",
  ].join("\n");
  const promptEvidence = publishPublishedEvidence(state, "settings-design-prompt.txt", promptText);
  const returnedDesign = publishEvidence(state, "settings-returned-design.html", "<main>Returned Settings design</main>\n");
  const downgradeConfirmation = publishBuildSpecConfirmation(state, promptEvidence.ref);
  const finalConfirmation = publishBuildSpecConfirmation(state, returnedDesign.ref);
  const review = contract.plan_design_review;
  contract.frontend_prototype_render = { status: "not_applicable", reason: "user accepted the external-design handoff" };
  review.design_artifact_ref = returnedDesign.ref;
  review.design_artifact_hash = returnedDesign.hash;
  review.confirmation_ref = finalConfirmation.ref;
  review.confirmation_hash = finalConfirmation.hash;
  review.reply_ref = finalConfirmation.ref;
  review.reply_hash = finalConfirmation.hash;
  review.external_design = {
    prompt,
    prompt_text: promptText,
    prompt_ref: promptEvidence.ref,
    prompt_hash: promptEvidence.hash,
    downgrade_confirmation_ref: downgradeConfirmation.ref,
    downgrade_confirmation_hash: downgradeConfirmation.hash,
    returned_design_ref: returnedDesign.ref,
    returned_design_hash: returnedDesign.hash,
    expected_design_revision: "design-r1",
    returned_design_revision: "design-r1",
  };
  return contract;
}

describe("decision-log UI applicability controls downstream UI branches", () => {
  it("does not silently treat a logged UI scope as non-UI when build-spec facts are absent", async () => {
    const { result } = await runBuildSpec("ui-log-without-contract-facts");
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/ui-project-init|design-source-readiness|plan-design-review/i);
    expect(result.missing_items.join("; ")).toMatch(/frontend-prototype-render/i);
  });

  it("keeps a logged non-UI scope not applicable, and makes an absent log explicit", async () => {
    const nonUi = await runBuildSpec("non-ui-log", {
      decision: nonUiDecision,
      contractFacts: {},
    });
    expect(nonUi.result.completion.missing).not.toContain("ui_design");

    const missing = await runBuildSpec("missing-ui-log", { decision: undefined, contractFacts: {} });
    expect(missing.result.completion.missing).toContain("ui_design");
    expect(missing.result.missing_items.join("; ")).toMatch(/UI applicability.*missing|decision-log/i);
  });

  it("keeps browser QA visible for a logged UI scope even without its contract, component map, or adapter", async () => {
    const { result } = await runBuildCode("ui-log-browser-qa");
    expect(result.missing_items.join("; ")).toMatch(/component_quality_map|browser QA/i);
  });

  it("does not let a caller UI impact suppress browser QA when the decision log says non-UI", async () => {
    const { result } = await runBuildCode("non-ui-log-browser-qa-conflict", {
      decision: nonUiDecision,
      contractFacts: { impact: "ui" },
    });
    expect(result.missing_items.join("; ")).toMatch(/decision-log applicability non_ui conflicts with declared impact ui|browser QA applicability is unknown/i);
  });

  it("keeps the build-plan component-quality consumer incomplete for a logged UI scope without a map", async () => {
    const { result } = await runBuildPlan("ui-log-component-quality");
    expect(result.missing_items.join("; ")).toMatch(/component_quality_map is missing/i);
  });

  it("does not accept a self-asserted design confirmation whose task evidence is unavailable", async () => {
    const { result } = await runBuildSpec("forged-design-confirmation", {
      contractFacts: {
        plan_design_review: {
          state: "human_approved",
          current_material_ref: "spec.md",
          material_revision: "forged-revision",
          display_before_reply: true,
          design_artifact_ref: "quality/evidence/ui-design/forged.html",
          design_artifact_hash: "a".repeat(64),
          reply_ref: "host-message://forged/reply",
          reply_hash: "b".repeat(64),
          reply_source: "user",
          displayed_at_ms: 1000,
          reply_at_ms: 2000,
          human_confirmation: { result: "approved" },
          confirmation_ref: `quality/confirmations/${"c".repeat(64)}.json`,
          confirmation_hash: "c".repeat(64),
        },
      },
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/plan-design-review user confirmation.*unavailable|confirmation.*canonical/i);
  });

  it("records the renderer skill as consumed only when its authenticated preview and confirmation are bound", async () => {
    const { result } = await runBuildSpec("renderer-consumed", { contractFacts: validRendererContract, validOutcome: true });
    expect(result.stage_outcome_status, JSON.stringify(result.stage_outcome_diagnostic)).toBe("completed");
    const renderer = result.skill_consumer_bindings.find((binding) => binding.skill_id === "frontend-prototype-render");
    expect(renderer).toMatchObject({
      status: "consumed",
      consumer: "stage-handlers#officialStageHandler(\"build-spec\")",
    });
  });

  it("keeps an applicable UI build-spec incomplete when the UI Contract is absent", async () => {
    const { result } = await runBuildSpec("ui-contract-missing", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        delete contract.ui_contract;
        return contract;
      },
      validOutcome: true,
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/ui-contract.*missing|ui contract must be an object/i);
  });

  it("keeps an applicable UI build-spec incomplete when design authority cannot be re-read from the Workspace", async () => {
    const missingSource = await runBuildSpec("ui-design-authority-missing-source", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        rmSync(join(state.workspace.worktreeRoot, "Design.md"));
        const snapshotTree = workspaceSnapshotTree(state);
        contract.frontend_prototype_render.snapshot_tree = snapshotTree;
        const confirmation = publishBuildSpecConfirmation(state, contract.frontend_prototype_render.preview_ref, snapshotTree);
        contract.plan_design_review.confirmation_ref = confirmation.ref;
        contract.plan_design_review.confirmation_hash = confirmation.hash;
        return contract;
      },
      validOutcome: true,
    });
    expect(missingSource.result.completion.missing).toContain("ui_design");
    expect(missingSource.result.missing_items.join("; ")).toMatch(/Design\.md.*current Workspace|Design\.md.*unavailable/i);

    const forgedHash = await runBuildSpec("ui-design-authority-forged-hash", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        contract.ui_contract.design_authority.experience.content_sha256 = "0".repeat(64);
        return contract;
      },
      validOutcome: true,
    });
    expect(forgedHash.result.completion.missing).toContain("ui_design");
    expect(forgedHash.result.missing_items.join("; ")).toMatch(/Experience\.md.*sha256.*current Workspace/i);
  });

  it("rejects self-declared preview bytes that have no authenticated render execution receipt", async () => {
    const { result } = await runBuildSpec("renderer-raw-bytes", { contractFacts: selfDeclaredRendererContract, validOutcome: true });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/structured component_inputs|render execution|command output/i);
  });

  it("rejects renderer and confirmation facts bound to a stale Workspace snapshot", async () => {
    const { result } = await runBuildSpec("renderer-stale-snapshot", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        const staleSnapshot = "0".repeat(40);
        contract.frontend_prototype_render.snapshot_tree = staleSnapshot;
        const staleConfirmation = publishBuildSpecConfirmation(state, contract.plan_design_review.design_artifact_ref, staleSnapshot);
        contract.plan_design_review.confirmation_ref = staleConfirmation.ref;
        contract.plan_design_review.confirmation_hash = staleConfirmation.hash;
        return contract;
      },
      validOutcome: true,
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/current Workspace snapshot|not bound to the current Workspace snapshot/i);
  });

  it("rejects renderer inputs whose paths or hashes do not bind current Workspace bytes", async () => {
    const missingComponent = await runBuildSpec("renderer-missing-component-source", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        contract.frontend_prototype_render.component_inputs[0].component_ref = "src/components/Missing.tsx";
        return contract;
      },
      validOutcome: true,
    });
    expect(missingComponent.result.completion.missing).toContain("ui_design");
    expect(missingComponent.result.missing_items.join("; ")).toMatch(/component_ref.*current Workspace/i);

    const wrongFixtureHash = await runBuildSpec("renderer-wrong-fixture-hash", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        contract.frontend_prototype_render.component_inputs[0].fixture_hash = "0".repeat(64);
        return contract;
      },
      validOutcome: true,
    });
    expect(wrongFixtureHash.result.completion.missing).toContain("ui_design");
    expect(wrongFixtureHash.result.missing_items.join("; ")).toMatch(/fixture_ref sha256 does not match the current Workspace source/i);
  });

  it("rejects preview or screenshot evidence that is only hash-correct text", async () => {
    const { result } = await runBuildSpec("renderer-invalid-screenshot-content", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        const fake = publishPublishedEvidence(state, "settings-invalid-screenshot.png", "not an image\n");
        contract.frontend_prototype_render.screenshot_ref = fake.ref;
        contract.frontend_prototype_render.screenshot_hash = fake.hash;
        return contract;
      },
      validOutcome: true,
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/screenshot.*real PNG.*JPEG.*WebP/i);
  });

  it("rejects a user-labelled reply that is not a canonical accepted confirmation", async () => {
    const { result } = await runBuildSpec("renderer-forged-user-reply", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        contract.plan_design_review.reply_ref = "host-message://ui-design/reply-forged";
        contract.plan_design_review.reply_hash = "d".repeat(64);
        return contract;
      },
      validOutcome: true,
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/user reply.*canonical|reply.*namespace/i);
  });

  it("accepts an explicit prompt-to-returned-design handoff without treating it as a renderer preview", async () => {
    const { result } = await runBuildSpec("external-design-return", { contractFacts: externalDesignContract, validOutcome: true });
    expect(result.stage_outcome_status, JSON.stringify(result.stage_outcome_diagnostic)).toBe("completed");
    expect(result.completion.missing).not.toContain("ui_design");
  });

  it("rejects an external-design handoff without an authenticated downgrade confirmation", async () => {
    const { result } = await runBuildSpec("external-design-no-consent", {
      contractFacts: (state) => {
        const contract = externalDesignContract(state);
        delete contract.plan_design_review.external_design.downgrade_confirmation_ref;
        delete contract.plan_design_review.external_design.downgrade_confirmation_hash;
        return contract;
      },
      validOutcome: true,
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/downgrade confirmation/i);
  });

  it("rejects a downgrade confirmation whose prompt evidence differs from the displayed prompt text", async () => {
    const { result } = await runBuildSpec("external-design-prompt-decoy", {
      contractFacts: (state) => {
        const contract = externalDesignContract(state);
        const decoy = publishEvidence(state, "settings-design-prompt-decoy.txt", "unrelated prompt package");
        const confirmation = publishBuildSpecConfirmation(state, decoy.ref);
        contract.plan_design_review.external_design.prompt_ref = decoy.ref;
        contract.plan_design_review.external_design.prompt_hash = decoy.hash;
        contract.plan_design_review.external_design.downgrade_confirmation_ref = confirmation.ref;
        contract.plan_design_review.external_design.downgrade_confirmation_hash = confirmation.hash;
        return contract;
      },
      validOutcome: true,
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/prompt evidence does not exactly match prompt_text/i);
  });

  it("rejects a human confirmation that is bound to a decoy instead of the authenticated renderer preview", async () => {
    const { result } = await runBuildSpec("renderer-confirmation-decoy", {
      contractFacts: (state) => {
        const contract = validRendererContract(state);
        contract.plan_design_review.design_artifact_ref = contract.frontend_prototype_render.screenshot_ref;
        contract.plan_design_review.design_artifact_hash = contract.frontend_prototype_render.screenshot_hash;
        return contract;
      },
    });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.missing_items.join("; ")).toMatch(/does not match the authenticated renderer preview/i);
  });
});
