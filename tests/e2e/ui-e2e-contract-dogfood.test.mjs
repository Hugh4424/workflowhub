import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  prepareDeliveryClosePlan,
} from "../../core/task-close.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { validateExecutablePlanTaskMinimum } from "../../runtime/stage/stage-content-contracts.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const TASK_ID = "ui-contract-e2e-demo-20260830";
const PAPERBUILDER_REPO_ROOT = "/Users/Hugh/Hugh/Project/PaperBuilder";
const PAPERBUILDER_TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/ui-contract-e2e-demo-20260830";
const expectedCloseSteps = ["commit-delivery", "merge-task-branch", "archive-spec", "push-target-branch", "cleanup"];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readBoundRecord(taskRoot, binding, label) {
  expect(binding, `${label} binding`).toEqual(expect.objectContaining({
    ref: expect.any(String), sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
  }));
  expect(binding.ref).toMatch(/^quality\/(?:evidence|facts|reviews|confirmations)\//);
  expect(binding.ref).not.toContain("..");
  const path = resolve(taskRoot, binding.ref);
  expect(path.startsWith(`${resolve(taskRoot)}/`), `${label} path containment`).toBe(true);
  expect(existsSync(path), `${label} record exists: ${binding.ref}`).toBe(true);
  const raw = readFileSync(path, "utf8");
  expect(sha256(raw), `${label} hash`).toBe(binding.sha256);
  return { raw, value: JSON.parse(raw) };
}

function readBoundBytes(taskRoot, binding, label) {
  expect(binding, `${label} binding`).toEqual(expect.objectContaining({
    ref: expect.any(String), sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
  }));
  expect(binding.ref).toMatch(/^quality\/evidence\//);
  const path = resolve(taskRoot, binding.ref);
  expect(path.startsWith(`${resolve(taskRoot)}/`), `${label} path containment`).toBe(true);
  expect(existsSync(path), `${label} exists: ${binding.ref}`).toBe(true);
  const raw = readFileSync(path);
  expect(sha256(raw), `${label} hash`).toBe(binding.sha256);
  return raw;
}

function readPublishedBrowserAttachment(taskRoot, binding, label) {
  expect(binding, `${label} binding`).toEqual(expect.objectContaining({
    ref: expect.stringMatching(/^quality\/evidence\/browser-qa\/[a-f0-9]{64}\.json$/),
    hash: expect.stringMatching(/^[a-f0-9]{64}$/),
  }));
  const path = resolve(taskRoot, binding.ref);
  expect(path.startsWith(`${resolve(taskRoot)}/`), `${label} path containment`).toBe(true);
  const raw = readFileSync(path, "utf8");
  const publication = JSON.parse(raw);
  expect(publication).toEqual(expect.objectContaining({
    schema_version: "workflowhub-evidence-publication.v1",
    content_encoding: "base64",
    content_sha256: binding.hash,
  }));
  const bytes = Buffer.from(publication.content_base64, "base64");
  expect(bytes.toString("base64"), `${label} base64`).toBe(publication.content_base64);
  expect(sha256(bytes), `${label} content hash`).toBe(binding.hash);
}

function latestQualityFact(taskRoot, predicate, label) {
  const factsRoot = join(taskRoot, "quality", "facts");
  expect(existsSync(factsRoot), `${label} quality facts`).toBe(true);
  const candidates = readdirSync(factsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^[a-f0-9]{64}\.json$/.test(entry.name))
    .map((entry) => {
      const ref = `quality/facts/${entry.name}`;
      const raw = readFileSync(join(factsRoot, entry.name), "utf8");
      const value = JSON.parse(raw);
      expect(value.fact_id, `${label} fact identity`).toBe(`quality-${entry.name.slice(0, -5)}`);
      return { ref, sha256: sha256(raw), value };
    })
    .filter(({ value }) => value?.schema_version === "quality-fact.v1" && predicate(value));
  expect(candidates.length, `${label} matching quality facts`).toBeGreaterThan(0);
  const dated = candidates.filter(({ value }) => Number.isFinite(Date.parse(value.recorded_at ?? "")));
  expect(dated.length, `${label} dated quality facts`).toBe(candidates.length);
  const newest = Math.max(...dated.map(({ value }) => Date.parse(value.recorded_at)));
  const latest = dated.filter(({ value }) => Date.parse(value.recorded_at) === newest);
  expect(latest.length, `${label} latest quality fact must be unique`).toBe(1);
  return latest[0];
}

function assertRendererPrototypeFacts(taskRoot, expectedMaterialRevision) {
  expect(expectedMaterialRevision, "S1 current material revision").toMatch(/^revision-[a-f0-9]{64}$/);
  const uiFact = latestQualityFact(taskRoot,
    (value) => value.task_id === readJson(join(taskRoot, "task.json")).task_id
      && value.stage === "build-spec"
      && value.kind === "acceptance_criterion"
      && value.subject === "ui_design"
      && value.status === "passed"
      && value.material_revision === expectedMaterialRevision,
    "S1 UI design");
  expect(uiFact.value.evidence).toHaveLength(1);
  const uiAcceptance = readBoundRecord(taskRoot, uiFact.value.evidence[0], "S1 UI design acceptance").value;
  expect(uiAcceptance).toEqual(expect.objectContaining({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "ui_design",
    result: "pass",
  }));
  expect(uiAcceptance.freshness).toEqual(expect.objectContaining({ material_revision: expectedMaterialRevision }));
  expect(uiAcceptance.refs).toHaveLength(1);
  const uiStageEvidence = readBoundRecord(taskRoot, uiAcceptance.refs[0], "S1 UI design stage evidence").value;
  expect(uiStageEvidence).toEqual(expect.objectContaining({
    schema_version: "stage-quality-evidence.v1",
    task_id: TASK_ID,
    stage: "build-spec",
    subject: "ui_design",
    status: "passed",
  }));
  const designConfirmationBinding = uiStageEvidence.subject_fact?.evidence_refs?.find((binding) => /^quality\/confirmations\//.test(binding?.ref ?? ""));
  expect(designConfirmationBinding, "S1 design confirmation binding").toBeDefined();
  const designConfirmation = readBoundRecord(taskRoot, designConfirmationBinding, "S1 design confirmation").value;
  expect(designConfirmation).toEqual(expect.objectContaining({
    schema_version: "human-confirmation.v2",
    task_id: TASK_ID,
    stage: "build-spec",
    decision: "accepted",
  }));
  expect(designConfirmation.material_revision).toBe(expectedMaterialRevision);
  expect(designConfirmation.snapshot_tree).toBe(uiStageEvidence.snapshot_tree);

  const rendererProofBinding = (uiStageEvidence.subject_fact?.evidence_refs ?? [])
    .map((binding) => {
      try { return { binding, value: readBoundRecord(taskRoot, binding, "S1 renderer evidence").value }; }
      catch { return null; }
    })
    .find((entry) => entry?.value?.schema_version === "workflowhub-stage-outcome-evidence.v1"
      && entry.value.subject_kind === "skill"
      && entry.value.subject_id === "frontend-prototype-render"
      && entry.value.outcome_status === "completed");
  expect(rendererProofBinding, "S1 renderer proof").toBeDefined();
  expect(rendererProofBinding.value).toEqual(expect.objectContaining({
    task_id: TASK_ID,
    stage: "build-spec",
    material_revision: expectedMaterialRevision,
    snapshot_tree: uiStageEvidence.snapshot_tree,
  }));
  const renderer = rendererProofBinding.value.host_evidence;
  expect(renderer).toEqual(expect.objectContaining({
    exit_code: 0,
    material_revision: expectedMaterialRevision,
    snapshot_tree: uiStageEvidence.snapshot_tree,
    preview_ref: expect.any(String),
    preview_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    screenshot_ref: expect.any(String),
    screenshot_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
  }));
  expect(renderer.preview_ref).not.toBe(renderer.screenshot_ref);
  expect(renderer.preview_ref).not.toMatch(/^https?:\/\/placeholder/i);
  expect(renderer.screenshot_ref).not.toMatch(/^https?:\/\/placeholder/i);
  expect(designConfirmation.subject_ref).toBe(renderer.preview_ref);
  expect(readBoundBytes(taskRoot, { ref: renderer.preview_ref, sha256: renderer.preview_hash }, "S1 prototype preview").length).toBeGreaterThan(0);
  expect(readBoundBytes(taskRoot, { ref: renderer.screenshot_ref, sha256: renderer.screenshot_hash }, "S1 prototype screenshot").length).toBeGreaterThan(0);
}

function dogfoodTaskRoot() {
  const taskRoot = process.env.WORKFLOWHUB_DOGFOOD_TASK_ROOT;
  expect(taskRoot, "S1 requires the real PaperBuilder dogfood task root in WORKFLOWHUB_DOGFOOD_TASK_ROOT").toEqual(expect.any(String));
  const root = realpathSync(taskRoot);
  expect(root, "S1 must use the declared PaperBuilder dogfood task root").toBe(realpathSync(PAPERBUILDER_TASK_ROOT));
  expect(existsSync(join(root, "task.json")), "S1 task.json").toBe(true);
  expect(existsSync(join(root, "facts.jsonl")), "S1 facts.jsonl").toBe(true);
  expect(existsSync(join(root, "quality", "verify.json")), "S1 verify-code result").toBe(true);
  const manifest = readJson(join(root, "task.json"));
  expect(manifest.task_id).toBe(TASK_ID);
  expect(manifest.project_name).toBe("PaperBuilder");
  expect(realpathSync(manifest.target_repo_root)).toBe(realpathSync(PAPERBUILDER_REPO_ROOT));
  return root;
}

function currentVerifyStatus(taskRoot) {
  const manifest = readJson(join(taskRoot, "task.json"));
  expect(manifest.project_name).toBe("PaperBuilder");
  expect(realpathSync(manifest.target_repo_root)).toBe(realpathSync(PAPERBUILDER_REPO_ROOT));
  const marker = "/Projects/";
  const markerIndex = taskRoot.indexOf(marker);
  expect(markerIndex, "S1 task storage must use the canonical <storage>/Projects/... layout").toBeGreaterThan(0);
  const storageRoot = taskRoot.slice(0, markerIndex);
  const canonicalTaskRoot = resolve(storageRoot, "Projects", manifest.project_name, "tasks", TASK_ID);
  expect(canonicalTaskRoot, "S1 task root must match the runtime-resolved project/task identity").toBe(resolve(taskRoot));
  const runtime = resolve(process.cwd(), "tools/cli/stage-runtime.mjs");
  const result = spawnSync(process.execPath, [
    runtime, "status", "--action=begin", "--stage=verify-code",
    `--project=${manifest.project_name}`, `--task=${TASK_ID}`,
  ], {
    cwd: process.cwd(),
    env: { ...process.env, WORKFLOWHUB_TASK_DIR: storageRoot },
    encoding: "utf8",
  });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  const status = JSON.parse(result.stdout);
  expect(status.quality_predicates?.e2e_acceptance).toEqual(expect.objectContaining({ status: "satisfied" }));
  const factRef = status.quality_predicates.e2e_acceptance.fact_ref;
  expect(status.quality_fact_refs).toContain(factRef);
  return { status, factRef };
}

function assertRealS1DogfoodFacts(taskRoot) {
  const verify = readJson(join(taskRoot, "quality", "verify.json"));
  expect(verify).toEqual(expect.objectContaining({
    schema_version: "quality-verify.v1", task_id: TASK_ID, stage: "verify-code", status: "passed",
  }));
  const { factRef } = currentVerifyStatus(taskRoot);
  expect(factRef).toMatch(/^quality\/facts\/[a-f0-9]{64}\.json$/);
  const factRaw = readFileSync(join(taskRoot, factRef), "utf8");
  const e2eFact = readBoundRecord(taskRoot, { ref: factRef, sha256: sha256(factRaw) }, "S1 e2e_acceptance quality fact").value;
  expect(e2eFact).toEqual(expect.objectContaining({ stage: "verify-code", kind: "acceptance_criterion", subject: "e2e_acceptance", status: "passed" }));
  assertRendererPrototypeFacts(taskRoot, e2eFact.material_revision);

  expect(e2eFact.evidence).toHaveLength(1);
  const e2eAcceptance = readBoundRecord(taskRoot, e2eFact.evidence[0], "S1 e2e_acceptance acceptance evidence").value;
  expect(e2eAcceptance).toEqual(expect.objectContaining({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "e2e_acceptance",
    result: "pass",
  }));
  expect(e2eAcceptance.refs).toHaveLength(1);
  const e2eStageEvidence = readBoundRecord(taskRoot, e2eAcceptance.refs[0], "S1 e2e_acceptance stage evidence").value;
  expect(e2eStageEvidence).toEqual(expect.objectContaining({
    schema_version: "stage-quality-evidence.v1",
    task_id: TASK_ID,
    stage: "verify-code",
    subject: "e2e_acceptance",
    status: "passed",
  }));
  const chain = e2eStageEvidence.subject_fact?.evidence_refs ?? [];
  expect(chain).toHaveLength(3);
  const executionBinding = chain.find((binding) => /^quality\/evidence\/acceptance\/build-code\//.test(binding?.ref ?? ""));
  const confirmationBinding = chain.find((binding) => /^quality\/confirmations\//.test(binding?.ref ?? ""));
  const reviewBinding = chain.find((binding) => /^quality\/reviews\/results\//.test(binding?.ref ?? ""));
  expect(executionBinding, "S1 execution binding").toBeDefined();
  expect(confirmationBinding, "S1 user acceptance binding").toBeDefined();
  expect(reviewBinding, "S1 independent review binding").toBeDefined();

  const executionAcceptance = readBoundRecord(taskRoot, executionBinding, "S1 build-code execution acceptance").value;
  expect(executionAcceptance).toEqual(expect.objectContaining({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "acceptance_execution",
    result: "pass",
  }));
  expect(executionAcceptance.refs).toHaveLength(1);
  const executionStageEvidence = readBoundRecord(taskRoot, executionAcceptance.refs[0], "S1 build-code execution stage evidence").value;
  expect(executionStageEvidence).toEqual(expect.objectContaining({
    schema_version: "stage-quality-evidence.v1",
    task_id: TASK_ID,
    stage: "build-code",
    subject: "acceptance_execution",
    status: "passed",
  }));
  const executionItems = executionStageEvidence.subject_fact?.execution_items ?? [];
  expect(executionItems.length, "S1 execution items").toBeGreaterThan(0);
  for (const item of executionItems) {
    expect(item).toEqual(expect.objectContaining({ status: "executed", tier: "browser" }));
    expect(item.evidence_refs?.length, "S1 browser evidence refs").toBeGreaterThan(0);
    for (const binding of item.evidence_refs) {
      const browser = readBoundRecord(taskRoot, binding, "S1 browser execution evidence").value;
      expect(browser).toEqual(expect.objectContaining({
        applicability: "ui",
        result: "pass",
        task_id: TASK_ID,
        stage: "build-code",
        acceptance_scenario: {
          source: item.source,
          sample: item.sample,
          scenario: item.scenario,
          tier: "browser",
        },
        visual: expect.objectContaining({ status: "observed", screenshot_refs: expect.any(Array) }),
      }));
      expect(browser.screenshots?.length, "S1 browser screenshots").toBeGreaterThan(0);
      expect(browser.visual.screenshot_refs).toHaveLength(browser.screenshots.length);
      expect(new Set(browser.visual.screenshot_refs)).toEqual(new Set(browser.screenshots.map(({ ref }) => ref)));
      for (const screenshot of browser.screenshots) readPublishedBrowserAttachment(taskRoot, screenshot, "S1 browser screenshot");
    }
  }

  const confirmation = readBoundRecord(taskRoot, confirmationBinding, "S1 user acceptance").value;
  expect(confirmation).toEqual(expect.objectContaining({
    schema_version: "human-confirmation.v2",
    task_id: TASK_ID,
    stage: "verify-code",
    decision: "accepted",
  }));

  const canonicalReview = readBoundRecord(taskRoot, reviewBinding, "S1 canonical review").value;
  expect(canonicalReview.task_id).toBe(TASK_ID);
  expect(canonicalReview.e2e_binding).toEqual(expect.objectContaining({
    frozen_material: expect.objectContaining({
      ref: expect.any(String),
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    }),
    reviewed_execution: expect.objectContaining({
      actor: expect.objectContaining({ source_id: expect.any(String) }),
    }),
    reviewer_actor: expect.objectContaining({ source_id: expect.any(String) }),
  }));
  const reviewActors = canonicalReview.e2e_binding;
  expect(reviewActors.reviewer_actor.source_id).not.toBe(reviewActors.reviewed_execution.actor.source_id);
  readBoundRecord(taskRoot, reviewActors.frozen_material, "S1 frozen material");
}

function closeFixture({ trackedSidecar = false } = {}) {
  const taskId = `dogfood-close-${roots.length + 1}`;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-ui-e2e-close-")));
  roots.push(root);
  const repo = join(root, "repo");
  const bare = join(root, "origin.git");
  mkdirSync(repo);
  mkdirSync(bare);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base"]);
  git(bare, ["init", "--bare", "-q"]);
  git(repo, ["remote", "add", "origin", bare]);
  git(repo, ["push", "-q", "origin", "main"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId,
      created_at: "2026-08-30T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const initial = prepareTaskWorkspace(task);
  const initialRoot = initial.worktreeRoot;
  const specSource = `specs/${taskId}`;
  mkdirSync(join(initialRoot, specSource), { recursive: true });
  writeFileSync(join(initialRoot, specSource, "decision-log.md"), "# Decision\n");
  writeFileSync(join(initialRoot, specSource, "spec.md"), "# Spec\n");
  writeFileSync(join(initialRoot, specSource, "plan.md"), "# Plan\n");
  writeFileSync(join(initialRoot, specSource, "tasks.md"), "# Tasks\n");
  if (trackedSidecar) {
    mkdirSync(join(initialRoot, "quality", "tests"), { recursive: true });
    writeFileSync(join(initialRoot, "quality", "tests", "dogfood.txt"), "tracked execution sidecar\n");
  }
  git(initialRoot, ["add", "--", specSource, ...(trackedSidecar ? ["quality/tests/dogfood.txt"] : [])]);
  git(initialRoot, ["commit", "-qm", "task materials"]);
  const taskCommit = git(initialRoot, ["rev-parse", "HEAD"]);
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return {
    task, kernel, candidate, worktreeRoot: candidate.worktreeRoot,
    delivery: {
      remote: "origin", task_branch: `task/WorkflowHub/${taskId}`, target_branch: "main", task_commit: taskCommit,
      spec_source_path: specSource, spec_archive_path: `specs/archive/${taskId}`,
    },
  };
}

function authorizeClose(state, confirmationRef) {
  for (const operation of ["commit", "merge", "archive", "push", "cleanup"]) {
    state.kernel.publishIrreversibleAuthorization({ operation, subject_ref: confirmationRef });
  }
}

function withNonUiAcceptanceTask(tasks) {
  const t019 = tasks.match(/#### T019[\s\S]*?(?=\n### Verify)/)?.[0];
  expect(t019, "T019 template").toEqual(expect.any(String));
  const nonUi = t019
    .replace("**ui_scope**：ui", "**ui_scope**：non_ui")
    .replace(/^- \*\*acceptance_data\*\*：.*$/m, "- **acceptance_data**：`[{\"source\":\"isolated command fixture\",\"sample\":\"non-ui acceptance sample\",\"scenario\":\"S3 explicit non-ui acceptance boundary\",\"tier\":\"command\"}]`");
  return tasks.replace(t019, nonUi);
}

function removeAcceptanceField(tasks, field) {
  return tasks.replace(/(#### T019[\s\S]*?)(?=\n### Verify)/, (block) =>
    block.replace(new RegExp(`^- \\*\\*${field}\\*\\*：.*\\n`, "m"), ""));
}

describe("UI delivery contract dogfooding (T019 local S2-S4)", () => {
  it.skip("S1 deferred: external PaperBuilder prototype, user confirmation, independent frozen review, and satisfied e2e_acceptance", () => {
    assertRealS1DogfoodFacts(dogfoodTaskRoot());
  });

  it("S2 rejects a close plan when a task worktree contains an execution sidecar, then preserves the fixed normal-close order in an isolated bare-remote fixture", async () => {
    const sidecar = closeFixture({ trackedSidecar: true });
    expect(() => prepareDeliveryClosePlan({ task: sidecar.task, kernel: sidecar.kernel, delivery: sidecar.delivery })).toThrow(/execution sidecar|sidecar/i);

    const state = closeFixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    expect(prepared.plan.steps.map((step) => step.step_id)).toEqual(expectedCloseSteps);
    const confirmation = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "确认执行 close 物理动作", stepSlug: "verify-code" });
    authorizeClose(state, confirmation.confirmation.human_confirmation_ref);
    await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
      now: () => "2026-08-30T00:00:00.000Z",
    });
    expect(prepared.plan.steps.map((step) => JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`)).action)).toEqual(expectedCloseSteps);
  });

  it("S3 rejects a non-UI acceptance task when either explicit acceptance field is removed", () => {
    const materialRoot = resolve(process.cwd(), "specs/ui-e2e-delivery-contract-20260830");
    const decisionLog = readFileSync(join(materialRoot, "decision-log.md"), "utf8");
    const spec = readFileSync(join(materialRoot, "spec.md"), "utf8");
    const plan = readFileSync(join(materialRoot, "plan.md"), "utf8");
    const completeTasks = readFileSync(join(materialRoot, "tasks.md"), "utf8");
    expect(validateExecutablePlanTaskMinimum({ decisionLog, spec, plan, tasks: completeTasks }).ok).toBe(true);
    const withNonUi = withNonUiAcceptanceTask(completeTasks);
    expect(validateExecutablePlanTaskMinimum({ decisionLog, spec, plan, tasks: withNonUi }).ok).toBe(true);
    for (const field of ["acceptance_role", "acceptance_data"]) {
      const incompleteTasks = removeAcceptanceField(withNonUi, field);
      expect(incompleteTasks).not.toBe(withNonUi);
      expect(validateExecutablePlanTaskMinimum({ decisionLog, spec, plan, tasks: incompleteTasks }).ok, `missing ${field}`).toBe(false);
    }
  });

  it("S4 runs every P1-P5 delivery-contract suite without recursively launching this dogfood test", () => {
    const result = spawnSync(process.execPath, [
      "./node_modules/vitest/vitest.mjs", "run",
      "tests/contract/decision-convergence-depth.test.mjs",
      "tests/contract/plan-acceptance-task-gate.test.mjs",
      "tests/contract/close-sidecar-and-archive.test.mjs",
      "tests/stage-review-cost-policy.test.mjs",
      "--poolOptions.forks.singleFork",
      "--no-fileParallelism",
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });
});
