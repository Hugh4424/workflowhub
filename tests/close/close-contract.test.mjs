import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  closeDelivery,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  inspectDeliveryCloseState,
  prepareDeliveryClosePlan,
} from "../../core/task-close.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { initializeTaskStore, readTaskFacts, writeStageRow } from "../../runtime/task/task-store.mjs";
import { stageMaterialScopeRevisions } from "../../runtime/stage/completion-predicates.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
const TASK_CLOSE_CLI = fileURLToPath(new URL("../../tools/cli/task-close.mjs", import.meta.url));

let fixtureCounter = 0;

function git(cwd, args, options = {}) {
  try { return execFileSync("git", args, { cwd, encoding: "utf8", ...options }).trim(); }
  catch (error) { if (options.allowFailure) return ""; throw error; }
}

function runTaskCloseCli(state, args, options = {}) {
  return execFileSync(process.execPath, [TASK_CLOSE_CLI, ...args], {
    cwd: state.repo,
    encoding: "utf8",
    ...options,
  });
}

function committedMaterialHash(state, file) {
  const bytes = execFileSync("git", ["show", `main:specs/${state.taskId}/${file}`], { cwd: state.repo, encoding: null });
  return createHash("sha256").update(bytes).digest("hex");
}

function committedBlobHash(state, ref) {
  const bytes = execFileSync("git", ["show", `main:${ref}`], { cwd: state.repo, encoding: null });
  return createHash("sha256").update(bytes).digest("hex");
}

function planningDeclaration(state, replyText) {
  return {
    task_id: state.taskId,
    workflow: "build-prd",
    material_refs: [
      { ref: "decision-log.md", sha256: committedMaterialHash(state, "decision-log.md") },
      { ref: "prd.md", sha256: committedMaterialHash(state, "prd.md") },
      ...(state.requiredAttachments ?? []).map((attachment) => ({ ref: attachment.path, sha256: committedBlobHash(state, attachment.path) })),
    ],
    reply_text: replyText,
    step_results: [
      { step_slug: "load-parent-decision", status: "recorded" },
      { step_slug: "report-facts-and-handoff", status: "recorded" },
    ],
    reflection_facts: [{ conclusion: "规划步骤已完成并由用户明确下令归档。", cited_steps: ["report-facts-and-handoff"] }],
  };
}

function publishPlanningDeclaration(state, replyText) {
  const raw = `${JSON.stringify(planningDeclaration(state, replyText), null, 2)}\n`;
  const ref = `quality/evidence/portable-workflow-outcomes/build-prd/${createHash("sha256").update(raw).digest("hex")}.json`;
  state.kernel.publishCanonicalRecord(ref, raw);
  return ref;
}

function writeMaterials(worktreeRoot, taskId, taskType = null, requiredAttachments = []) {
  const specSource = `specs/${taskId}`;
  const specDir = join(worktreeRoot, specSource);
  mkdirSync(specDir, { recursive: true });
  writeFileSync(join(specDir, "decision-log.md"), [
    "# Decision log",
    "",
    ...(taskType ? ["## 任务身份", `- **任务类型**：${taskType}`, ""] : []),
    "真实需求已登记。",
    "",
  ].join("\n"));
  if (taskType) writeFileSync(join(specDir, "prd.md"), `# Planning PRD\n\n- **必要附件与版本**：${JSON.stringify(requiredAttachments.map(({ path, sha256 }) => ({ path, sha256 })))}\n`);
  for (const attachment of requiredAttachments) {
    const attachmentFile = join(worktreeRoot, attachment.path);
    mkdirSync(dirname(attachmentFile), { recursive: true });
    writeFileSync(attachmentFile, attachment.content ?? "");
  }
  writeFileSync(join(specDir, "spec.md"), "# Specification\n\n## 9. 验收标准\n- [ ] **AC-001**：正常 close 只记录物理事实。\n");
  writeFileSync(join(specDir, "plan.md"), "# Plan\n\n复用现有 close executor。\n");
  writeFileSync(join(specDir, "tasks.md"), "# Tasks\n\n#### T001\n- **ID**：T001\n");
  return specSource;
}

function baseFixture({ existing = false, taskType = null, requiredAttachments } = {}) {
  fixtureCounter += 1;
  const taskId = `close-contract-${fixtureCounter}`;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-close-contract-")));
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

  const projectName = "WorkflowHub";
  let workspaceRoot;
  let manifest;
  if (existing) {
    workspaceRoot = join(root, "repo-work");
    git(repo, ["worktree", "add", "-b", `task/${projectName}/${taskId}`, workspaceRoot, "main"]);
    git(workspaceRoot, ["config", "user.name", "WorkflowHub Tests"]);
    git(workspaceRoot, ["config", "user.email", "tests@workflowhub.local"]);
    manifest = {
      schema_version: "1.0.0",
      project_name: projectName,
      task_id: taskId,
      created_at: "2026-08-21T00:00:00Z",
      target_repo_root: repo,
      workspace_mode: "existing",
      workspace_root: workspaceRoot,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    };
  } else {
    manifest = {
      schema_version: "1.0.0",
      project_name: projectName,
      task_id: taskId,
      created_at: "2026-08-21T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    };
  }

  const task = createTask({ storageRoot: root, manifest });
  // First prepare gives us the worktree; second prepare after commit captures the new baseline.
  const tempCandidate = prepareTaskWorkspace(task);
  const worktreeRoot = tempCandidate.worktreeRoot;
  const attachments = requiredAttachments ?? [];
  const specSource = writeMaterials(worktreeRoot, taskId, taskType, attachments);
  git(worktreeRoot, ["add", "--", specSource, ...attachments.map((attachment) => attachment.path)]);
  git(worktreeRoot, ["commit", "-m", "task materials"]);
  const taskCommit = git(worktreeRoot, ["rev-parse", "HEAD"]);
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = candidate.captureSnapshot();
  const delivery = {
    remote: "origin",
    task_branch: `task/${projectName}/${taskId}`,
    target_branch: "main",
    task_commit: taskCommit,
    spec_source_path: specSource,
    spec_archive_path: `specs/archive/${taskId}`,
  };
  return { task, kernel, candidate, worktreeRoot, repo, bare, delivery, existing, taskId, requiredAttachments: taskType ? attachments : undefined };
}

function authorizeBatch(state, confirmationRef, operations = ["commit", "merge", "archive", "push", "cleanup"]) {
  for (const operation of operations) {
    state.kernel.publishIrreversibleAuthorization({ operation, subject_ref: confirmationRef });
  }
}

function authorizePlanningOperation({ state, kernel, plan, confirmation, operation }) {
  const value = {
    schema_version: "irreversible-authorization.v1",
    task_id: state.taskId,
    operation,
    subject_ref: confirmation.confirmation.human_confirmation_ref,
    subject_hash: confirmation.confirmation.human_confirmation_hash,
    material_revision: plan.delivery.planning.material_revision,
    snapshot_tree: plan.delivery.planning.snapshot_tree,
    authorized_at: "2026-09-11T00:00:00.000Z",
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  kernel.publishCanonicalRecord(`quality/authorizations/${createHash("sha256").update(raw).digest("hex")}.json`, raw);
}

function authorizePostArchive(state, plan, confirmation, kernel = state.kernel) {
  for (const operation of ["archive", "commit", "push"]) {
    authorizePlanningOperation({ state, kernel, plan, confirmation, operation });
  }
}

function consumedAuthorizations(state) {
  const root = join(state.task.taskPath, "quality", "authorizations", "consumed");
  return readdirSync(root).map((name) => JSON.parse(readFileSync(join(root, name), "utf8")));
}

async function postArchiveSetup() {
  const state = baseFixture({ taskType: "规划任务" });
  const initial = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
  await closeDelivery({
    task: state.task,
    kernel: state.kernel,
    delivery: state.delivery,
    replyText: "确认四动作交付，材料保留原位。",
    stepSlug: "confirm-planning-close",
  });
  const declarationRef = publishPlanningDeclaration(state, "清单已全部完成，现在明确下令归档。");
  const archivePlan = prepareDeliveryClosePlan({
    task: state.task,
    kernel: state.kernel,
    priorPlanHash: initial.plan_hash,
    archiveDeclarationRef: declarationRef,
  });
  const kernel = createTaskKernel(state.task);
  const confirmation = confirmClosePlan({
    task: state.task,
    kernel,
    plan: archivePlan.plan,
    outcome: "confirmed",
    replyText: "确认执行展示的归档和提交。",
    stepSlug: "confirm-planning-archive",
  });
  return { state, initial, archivePlan, declarationRef, kernel, confirmation };
}

const EXPECTED_ACTIONS = ["commit-delivery", "merge-task-branch", "archive-spec", "push-target-branch", "cleanup"];
const ACTION_TO_OPERATION = {
  "commit-delivery": "commit",
  "merge-task-branch": "merge",
  "archive-spec": "archive",
  "push-target-branch": "push",
  "cleanup": "cleanup",
};
const STEP_TO_CLOSE_ACTION = {
  "commit-delivery": "delivery_committed",
  "merge-task-branch": "merge",
  "archive-spec": "archive",
  "push-target-branch": "push",
  "cleanup": "worktree_cleanup",
};
const FIXED_CLOSE_TIME = "2026-08-21T00:00:00.000Z";

/** Prepare a confirmed, authorized first-time close over the five physical actions. */
async function confirmedFirstTimeClose(state, { now = () => FIXED_CLOSE_TIME } = {}) {
  const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
  const confirmation = confirmClosePlan({
    task: state.task,
    kernel: state.kernel,
    plan: prepared.plan,
    outcome: "confirmed",
    replyText: "用户确认执行关闭。",
    stepSlug: "confirm-close-plan",
  });
  authorizeBatch(state, confirmation.confirmation.human_confirmation_ref);
  const result = await executeClosePlan({
    task: state.task,
    kernel: state.kernel,
    plan: prepared.plan,
    closeConfirmationRef: confirmation.ref,
    executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
    now,
  });
  return { prepared, confirmation, result };
}

describe("close contract (T0-RED)", () => {
  it("requires explicit user reply text and current-step provenance", () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    expect(() => confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed" }))
      .toThrow(/replyText is required/i);
    expect(() => confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "用户确认。" }))
      .toThrow(/stepSlug is required/i);
  });

  it("records timeout without inventing a human reply and blocks execution", async () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      outcome: "timeout",
    });

    expect(confirmation.confirmation).toMatchObject({
      outcome: "timeout",
      human_confirmation_ref: null,
      human_confirmation_hash: null,
    });
    await expect(executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
    })).resolves.toMatchObject({ status: "blocked", confirmationOutcome: "timeout" });
  });

  it("one-shot close returns normal mode and completed.json has only physical facts", async () => {
    const state = fixture();
    const result = await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
      now: () => "2026-08-21T00:00:00.000Z",
    });

    expect(result.close_mode).toBe("normal");
    expect(result).not.toHaveProperty("quality_status");
    expect(result).not.toHaveProperty("quality_gaps");
    expect(result).not.toHaveProperty("product_release_status");
    expect(result).not.toHaveProperty("risk_record_ref");

    const completed = JSON.parse(state.task.readRecord("operations/close/completed.json"));
    expect(completed.close_mode).toBe("normal");
    expect(completed).not.toHaveProperty("quality_status");
    expect(completed).not.toHaveProperty("quality_gaps");
    expect(completed).not.toHaveProperty("product_release_status");
    expect(completed).not.toHaveProperty("risk_record_ref");
    expect(completed.physical_state).not.toHaveProperty("verify_facts_fresh");
    expect(completed.physical_state).not.toHaveProperty("verify_facts_fresh_reason");
  });

  it("close plan has exactly five ordered actions: commit, merge, archive, push, cleanup", async () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
    });

    const stepIds = prepared.plan.steps.map((step) => step.step_id);
    expect(stepIds).toEqual(EXPECTED_ACTIONS);

    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      outcome: "confirmed",
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
    });
    authorizeBatch(state, confirmation.confirmation.human_confirmation_ref);

    await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
      now: () => "2026-08-21T00:00:00.000Z",
    });

    const stepRecords = prepared.plan.steps.map((step) =>
      JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`)));
    expect(stepRecords.map((record) => record.action ?? record.step_id)).toEqual(EXPECTED_ACTIONS);
    for (const record of stepRecords) {
      expect(record).toHaveProperty("completed_at");
      expect(record).toHaveProperty("evidence");
    }
  });

  it("records one close-action row per physical action on a first-time close", async () => {
    const state = fixture();
    // A real task owns its execution record from bootstrap onwards; the close
    // path writes the five close-action rows into that existing record file.
    initializeTaskStore(state.task.taskPath, { taskId: state.taskId });
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    expect(readTaskFacts(state.task.taskPath)).toEqual([]);
    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      outcome: "confirmed",
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
    });
    authorizeBatch(state, confirmation.confirmation.human_confirmation_ref);
    // First-time close with nothing pre-satisfied: the delivery snapshot commit
    // is still unpublished, so even the commit action has to execute instead of
    // reconciling an existing state.
    const deliveryParent = git(state.worktreeRoot, ["rev-parse", `${state.delivery.task_commit}^`]);
    git(state.worktreeRoot, ["update-ref", `refs/heads/${state.delivery.task_branch}`, deliveryParent, state.delivery.task_commit]);

    const result = await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
      now: () => FIXED_CLOSE_TIME,
    });

    expect(result).toMatchObject({ status: "completed" });
    // Every write landed: a failed row write would surface here instead of
    // being swallowed.
    expect(result).not.toHaveProperty("close_action_row_errors");
    // Nothing was pre-satisfied, so no step may report the reconcile shortcut.
    const stepRecords = prepared.plan.steps.map((step) =>
      JSON.parse(state.task.readRecord(`operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`)));
    expect(stepRecords.map((record) => record.completion_mode)).toEqual(EXPECTED_ACTIONS.map(() => "executed"));

    const rows = readTaskFacts(state.task.taskPath).filter((row) => row.record_kind === "close_action");
    expect(rows).toHaveLength(EXPECTED_ACTIONS.length);
    expect(rows.map((row) => row.close_action.action)).toEqual(EXPECTED_ACTIONS.map((step) => STEP_TO_CLOSE_ACTION[step]));
    expect(rows.map((row) => row.close_action.result)).toEqual(EXPECTED_ACTIONS.map(() => "executed"));
    expect(rows.map((row) => row.stage)).toEqual(EXPECTED_ACTIONS.map(() => "close"));
    expect(rows.map((row) => row.close_action.ref)).toEqual(prepared.plan.steps.map(
      (step) => `operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`));

    // The production reader (public close state readback) surfaces those same
    // recorded values, so the row is not only readable from a test.
    const inspected = inspectDeliveryCloseState({ task: state.task, kernel: createTaskKernel(state.task), plan: prepared.plan });
    expect(inspected.close_actions).toEqual({
      status: "recorded",
      actions: prepared.plan.steps.map((step) => ({
        action: STEP_TO_CLOSE_ACTION[step.step_id],
        recorded: true,
        result: "executed",
        ref: `operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`,
        recorded_at: FIXED_CLOSE_TIME,
      })),
    });
  });

  it("surfaces a failed close-action row write without rolling the physical action back", async () => {
    const state = fixture();
    // Make only the execution-record write fail: facts.jsonl is a directory, so
    // the atomic row write fails while every close record and every physical
    // action still succeed.
    mkdirSync(join(state.task.taskPath, "facts.jsonl"));
    initializeTaskStore(state.task.taskPath, { taskId: state.taskId });
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });

    const result = await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
      now: () => FIXED_CLOSE_TIME,
    });

    expect(result).toMatchObject({ status: "completed", close_mode: "normal" });
    expect(result.close_action_row_errors).toHaveLength(EXPECTED_ACTIONS.length);
    expect(result.close_action_row_errors.map((entry) => entry.action)).toEqual(EXPECTED_ACTIONS.map((step) => STEP_TO_CLOSE_ACTION[step]));
    expect(result.close_action_row_errors.map((entry) => entry.step_id)).toEqual(EXPECTED_ACTIONS);
    for (const entry of result.close_action_row_errors) expect(entry.error).toMatch(/EISDIR|directory/i);
    // The physical action really happened and is never rolled back; the
    // persisted completion record keeps its frozen shape and only the returned
    // close output reports the missing rows.
    const completed = JSON.parse(state.task.readRecord("operations/close/completed.json"));
    expect(completed.status).toBe("completed");
    expect(completed).not.toHaveProperty("close_action_row_errors");
    expect(() => readTaskFacts(state.task.taskPath)).toThrow();
    const inspected = inspectDeliveryCloseState({ task: state.task, kernel: createTaskKernel(state.task), plan: prepared.plan });
    expect(inspected.close_actions.status).toBe("unavailable");
    expect(inspected.close_actions.reason).toMatch(/EISDIR|directory/i);
    expect(inspected.close_actions.actions).toHaveLength(EXPECTED_ACTIONS.length);
    expect(inspected.close_actions.actions.every((entry) => entry.recorded === false)).toBe(true);
  });

  it("existing workspace mode completes without deleting the directory", async () => {
    const state = baseFixture({ existing: true });
    await expect(closeDelivery({
      task: state.task,
      kernel: state.kernel,
      replyText: "用户确认执行关闭。",
      stepSlug: "confirm-close-plan",
      now: () => "2026-08-21T00:00:00.000Z",
    })).resolves.toMatchObject({ status: "completed", close_mode: "normal" });

    expect(existsSync(state.worktreeRoot)).toBe(true);
    const completed = JSON.parse(state.task.readRecord("operations/close/completed.json"));
    expect(completed.physical_state.cleanup).toEqual({ skipped: true, reason: expect.any(String) });
  });
});

function fixture() {
  return baseFixture({ existing: false });
}

const ROW_MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];

/** The current bindings the close-path projection compares a stage row against. */
function closeRowBindings(state) {
  const artifacts = ArtifactDir.open(state.worktreeRoot, state.task);
  return {
    snapshot_tree: captureExecutionSnapshot(state.worktreeRoot, state.taskId).tree,
    material_scope_revisions: stageMaterialScopeRevisions(Object.fromEntries(
      ROW_MATERIALS.map((name) => [name, artifacts.read(name)]),
    )),
  };
}

/** Write one real stage row through the only writer of the execution record. */
function writeCloseStageRow(state, { stage = "build-code", layerState = "completed" } = {}) {
  const bindings = closeRowBindings(state);
  return writeStageRow(state.task.taskPath, {
    record_kind: "stage",
    stage,
    source: `stage-end:${stage}`,
    material_digest: { value: bindings.material_scope_revisions[stage].replace(/^revision-/, "") },
    snapshot_tree: { value: bindings.snapshot_tree, reason: "handoff snapshot captured from the current workspace" },
    review_origin: "not_run",
    review_result_ref: { value: null, reason: "the stage row records the stage-end facts; reviews are recorded separately" },
    finding_dispositions: [],
    evidence: { value: [{ command: `stage-handoff:${stage}`, exit_code: 0, failure_signature: "published" }] },
    layer_states: {
      implementation_completion: layerState,
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    },
    spec_analyze: { value: null, reason: "spec analysis is recorded by its own stage-end profile" },
    serious_issue_disposition: { value: null, reason: "no serious issue was recorded on this stage row" },
    close_action: { value: null, reason: "stage rows never carry a close action" },
    handoff: { value: null, reason: "no handoff item on this close-contract stage row" },
  });
}

/** The close-path product release still reports this stage's outcome as missing. */
function closeReportsMissingStageOutcome(plan, stage) {
  return plan.delivery.product_release.reasons.includes(`stage_predicate_missing:${stage}:stage_outcome`);
}

describe("close reads the current close stage result from the execution-record row", () => {
  it("follows the frozen row instead of the old stage-outcome envelopes", () => {
    const state = fixture();
    initializeTaskStore(state.task.taskPath, { taskId: state.taskId });

    // No row yet: every formal stage reports its missing row as an observable
    // completion gap, and the close plan is still prepared.
    const withoutRow = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    expect(withoutRow.plan.delivery.product_release.status).toBe("not_released");
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(closeReportsMissingStageOutcome(withoutRow.plan, stage)).toBe(true);
    }

    writeCloseStageRow(state, { stage: "build-code", layerState: "completed" });
    const withRow = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    // The row is the current stage result, so build-code no longer reports a
    // missing stage outcome; the stages without a row keep their honest reason.
    expect(closeReportsMissingStageOutcome(withRow.plan, "build-code")).toBe(false);
    for (const stage of ["make-decision", "build-spec", "build-plan", "verify-code"]) {
      expect(closeReportsMissingStageOutcome(withRow.plan, stage)).toBe(true);
    }

    // Only the row changes: the close projection follows its value.
    writeCloseStageRow(state, { stage: "build-code", layerState: "incomplete" });
    const afterRetry = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    expect(closeReportsMissingStageOutcome(afterRetry.plan, "build-code")).toBe(true);
  });

  it("degrades a store without the execution record honestly instead of failing the close plan", () => {
    // A store prepared before the single execution record existed carries no
    // facts.jsonl at all. The close path must keep working and report the real
    // reason instead of reading the retired stage-outcome envelopes.
    const state = fixture();
    expect(existsSync(join(state.task.taskPath, "facts.jsonl"))).toBe(false);

    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });

    expect(prepared.plan.steps.map((step) => step.step_id)).toEqual(EXPECTED_ACTIONS);
    expect(prepared.plan.delivery.product_release.status).toBe("not_released");
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(closeReportsMissingStageOutcome(prepared.plan, stage)).toBe(true);
    }
    expect(prepared.plan.delivery.quality_gaps.join("\n")).toContain("stage_predicate_missing:verify-code:stage_outcome");
  });
});

describe("planning-hardening unarchived planning close", () => {
  it("prepares a declared planning task with four actions and no archive step", () => {
    const state = baseFixture({ taskType: "规划任务" });
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });

    expect(prepared.plan.steps.map((step) => step.step_id)).toEqual([
      "commit-delivery", "merge-task-branch", "push-target-branch", "cleanup",
    ]);
    expect(prepared.plan.delivery.close_mode).toBe("ordinary");
    expect(prepared.plan.delivery.planning).toBeDefined();
  });

  it("keeps explicit legacy planning mode on the existing five-action route", () => {
    const state = baseFixture({ taskType: "规划任务" });
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      closeMode: "planning",
      delivery: state.delivery,
    });
    expect(prepared.plan.steps.map((step) => step.step_id)).toEqual(EXPECTED_ACTIONS);
  });

  it("prepares a two-action archive plan from a saved declaration after initial cleanup", async () => {
    const state = baseFixture({ taskType: "规划任务" });
    const initial = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const initialResult = await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
      replyText: "确认四动作交付，材料保留原位。",
      stepSlug: "confirm-planning-close",
    });
    expect(initialResult.status).not.toBe("completed");
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow();

    const declarationRef = publishPlanningDeclaration(state, "清单已全部完成，现在明确下令归档。");

    const archivePlan = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      priorPlanHash: initial.plan_hash,
      archiveDeclarationRef: declarationRef,
    });
    expect(archivePlan.plan.steps.map((step) => step.step_id)).toEqual(["archive-spec", "push-target-branch"]);
    expect(archivePlan.plan.delivery.spec_source_path).toBe(`specs/${state.taskId}`);
    expect(archivePlan.plan.delivery.spec_archive_path).toBe(`specs/archive/${state.taskId}`);
  });

  it("rebinds post-cleanup archive to the current pushed target after main advances", async () => {
    const state = baseFixture({ taskType: "规划任务" });
    const initial = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
      replyText: "确认四动作交付，材料保留原位。",
      stepSlug: "confirm-planning-close",
    });
    const initialTarget = git(state.repo, ["rev-parse", "refs/heads/main"]);
    writeFileSync(join(state.repo, `after-close-${state.taskId}.md`), "主仓后续无关提交。\n");
    git(state.repo, ["add", "--", `after-close-${state.taskId}.md`]);
    git(state.repo, ["commit", "-m", "advance target after planning cleanup"]);
    git(state.repo, ["push", "-q", "origin", "main"]);
    const currentTarget = git(state.repo, ["rev-parse", "refs/heads/main"]);
    const declarationRef = publishPlanningDeclaration(state, "清单已全部完成，现在明确下令归档。");

    const archivePlan = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      priorPlanHash: initial.plan_hash,
      archiveDeclarationRef: declarationRef,
    });

    expect(currentTarget).not.toBe(initialTarget);
    expect(archivePlan.plan.delivery.target_baseline).toBe(currentTarget);
    expect(archivePlan.plan.delivery.remote_target_baseline).toBe(currentTarget);
    expect(archivePlan.plan.delivery.task_commit).toBe(currentTarget);
  });

  it("accepts the real nested handoff declaration with attachment refs", async () => {
    const content = "依赖版本固定为 v1。\n";
    const attachment = {
      path: "attachments/version.md",
      content,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
    const state = baseFixture({ taskType: "规划任务", requiredAttachments: [attachment] });
    const initial = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
      replyText: "确认四动作交付，材料保留原位。",
      stepSlug: "confirm-planning-close",
    });
    const declarationRef = publishPlanningDeclaration(state, "清单已全部完成，现在明确下令归档。");

    const archivePlan = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      priorPlanHash: initial.plan_hash,
      archiveDeclarationRef: declarationRef,
    });

    expect(archivePlan.plan.delivery.planning.attachments).toEqual([expect.objectContaining({
      path: attachment.path,
      sha256: attachment.sha256,
      status: "available",
    })]);
    expect(archivePlan.plan.delivery.planning.materials[declarationRef]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not move source materials when archive authorization is missing", async () => {
    const state = baseFixture({ taskType: "规划任务" });
    const initial = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
      replyText: "确认四动作交付，材料保留原位。",
      stepSlug: "confirm-planning-close",
    });
    const declarationRef = publishPlanningDeclaration(state, "现在明确下令归档。");
    const archivePlan = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, priorPlanHash: initial.plan_hash, archiveDeclarationRef: declarationRef });
    const postKernel = createTaskKernel(state.task);
    const confirmation = confirmClosePlan({ task: state.task, kernel: postKernel, plan: archivePlan.plan, outcome: "confirmed", replyText: "确认执行归档和提交。", stepSlug: "confirm-planning-archive" });
    const authorization = {
      schema_version: "irreversible-authorization.v1",
      task_id: state.taskId,
      operation: "push",
      subject_ref: confirmation.confirmation.human_confirmation_ref,
      subject_hash: confirmation.confirmation.human_confirmation_hash,
      material_revision: archivePlan.plan.delivery.planning.material_revision,
      snapshot_tree: archivePlan.plan.delivery.planning.snapshot_tree,
      authorized_at: "2026-09-11T00:00:00.000Z",
    };
    const authorizationRaw = `${JSON.stringify(authorization, null, 2)}\n`;
    postKernel.publishCanonicalRecord(`quality/authorizations/${createHash("sha256").update(authorizationRaw).digest("hex")}.json`, authorizationRaw);

    await expect(executeClosePlan({
      task: state.task,
      kernel: postKernel,
      plan: archivePlan.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: postKernel, plan: archivePlan.plan }),
    })).rejects.toThrow(/IRREVERSIBLE_AUTHORIZATION_REQUIRED|archive/i);
    expect(git(state.repo, ["cat-file", "-e", `refs/heads/main:specs/${state.taskId}/decision-log.md`])).toBe("");

    const archiveAuthorization = { ...authorization, operation: "archive" };
    const archiveAuthorizationRaw = `${JSON.stringify(archiveAuthorization, null, 2)}\n`;
    postKernel.publishCanonicalRecord(`quality/authorizations/${createHash("sha256").update(archiveAuthorizationRaw).digest("hex")}.json`, archiveAuthorizationRaw);
    await expect(executeClosePlan({
      task: state.task,
      kernel: postKernel,
      plan: archivePlan.plan,
      archiveDeclarationRef: declarationRef,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: postKernel, plan: archivePlan.plan }),
    })).rejects.toThrow(/IRREVERSIBLE_AUTHORIZATION_REQUIRED|commit/i);
    expect(git(state.repo, ["cat-file", "-e", `refs/heads/main:specs/${state.taskId}/decision-log.md`])).toBe("");
  });

  it("rejects post-cleanup archive arguments when an ordinary close is already completed", async () => {
    const state = baseFixture();
    await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
      replyText: "确认完成普通收尾。",
      stepSlug: "confirm-close-plan",
    });

    await expect(closeDelivery({
      task: state.task,
      kernel: state.kernel,
      priorPlanHash: "a".repeat(64),
      archiveDeclarationRef: `quality/evidence/portable-workflow-outcomes/build-prd/${"b".repeat(64)}.json`,
      replyText: "再次明确归档。",
      stepSlug: "confirm-planning-archive",
    })).rejects.toThrow("post-cleanup archive cannot follow a normal close completion");
  });

  it("retries a staged archive rename after commit failure without repeating the move", async () => {
    const { state, archivePlan, declarationRef, kernel, confirmation } = await postArchiveSetup();
    authorizePostArchive(state, archivePlan.plan, confirmation, kernel);
    const hookRoot = join(dirname(state.repo), "archive-hooks");
    mkdirSync(hookRoot);
    writeFileSync(join(hookRoot, "pre-commit"), "#!/bin/sh\nexit 1\n");
    chmodSync(join(hookRoot, "pre-commit"), 0o755);
    git(state.repo, ["config", "core.hooksPath", hookRoot]);

    await expect(executeClosePlan({
      task: state.task,
      kernel,
      plan: archivePlan.plan,
      archiveDeclarationRef: declarationRef,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel, plan: archivePlan.plan }),
    })).rejects.toThrow(/commit/);

    expect(existsSync(join(state.repo, `specs/${state.taskId}`))).toBe(false);
    expect(existsSync(join(state.repo, `specs/archive/${state.taskId}`))).toBe(true);
    expect(git(state.repo, ["diff", "--cached", "--name-status", "--find-renames=100%"]).split(/\s+/)).toContain("R100");

    git(state.repo, ["config", "--unset", "core.hooksPath"]);
    const retry = await executeClosePlan({
      task: state.task,
      kernel,
      plan: archivePlan.plan,
      archiveDeclarationRef: declarationRef,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel, plan: archivePlan.plan }),
    });

    expect(retry).toMatchObject({ status: "delivered", completion_record: null });
    const archiveCommit = git(state.repo, ["rev-parse", "refs/heads/main"]);
    expect(git(state.repo, ["show", "-s", "--format=%P", archiveCommit])).toBe(archivePlan.plan.delivery.target_baseline);
    // After main's execution-acceleration baseline (b6049afa) a failed step record is
    // immutable audit history: the successful retry re-executes and reaches the declared
    // physical state, but no second state is written at the same record path. Recovery is
    // therefore recorded in a companion `.completed.json` sidecar (review finding
    // F-c213b3773792) so a successful retry stays distinguishable from a live failure.
    const archiveStepRecord = JSON.parse(state.task.readRecord(`operations/close/plans/${archivePlan.plan_hash}/steps/archive-spec.json`));
    expect(archiveStepRecord.status).toBe("failed");
    expect(archiveStepRecord.completion_mode).toBeUndefined();
    expect(archiveStepRecord.failure.message).toMatch(/commit/);
    const archiveRecovery = JSON.parse(state.task.readRecord(`operations/close/plans/${archivePlan.plan_hash}/steps/archive-spec.completed.json`));
    expect(archiveRecovery).toMatchObject({
      schema_version: "task-close-operation.v1",
      task_id: state.taskId,
      plan_hash: archivePlan.plan_hash,
      step_id: "archive-spec",
      operation: "archive-spec",
      status: "completed",
      completion_mode: "executed",
    });
    expect(git(state.repo, ["rev-parse", "refs/remotes/origin/main"])).toBe(archiveCommit);
  });

  it("confirms a post-cleanup archive plan through the CLI without reopening its worktree", async () => {
    const { state, archivePlan } = await postArchiveSetup();
    const output = runTaskCloseCli(state, [
      "confirm",
      `--task-path=${state.task.taskPath}`,
      "--project=WorkflowHub",
      `--task=${state.taskId}`,
      `--plan-hash=${archivePlan.plan_hash}`,
      "--decision=confirmed",
      "--reply-text=确认执行展示的归档和提交。",
      "--step-slug=confirm-planning-archive",
    ]);
    expect(JSON.parse(output)).toMatchObject({ ref: expect.stringContaining(`operations/close/confirmations/${archivePlan.plan_hash}/`) });
    expect(existsSync(state.worktreeRoot)).toBe(false);
  });

  it("rejects extra initial-close parameters on the post-cleanup archive CLI route", async () => {
    const state = baseFixture({ taskType: "规划任务" });
    const initial = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const declarationRef = `quality/evidence/portable-workflow-outcomes/build-prd/${"b".repeat(64)}.json`;

    expect(() => runTaskCloseCli(state, [
      "prepare",
      `--task-path=${state.task.taskPath}`,
      "--project=WorkflowHub",
      `--task=${state.taskId}`,
      `--archive=${declarationRef}`,
      `--plan-hash=${initial.plan_hash}`,
      "--mode=planning",
    ])).toThrow(/post-cleanup archive does not accept: --mode/);
  });

  it("executes the authorized two-action archive plan without recreating the task worktree", async () => {
    const state = baseFixture({ taskType: "规划任务" });
    const initial = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    await closeDelivery({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
      replyText: "确认四动作交付，材料保留原位。",
      stepSlug: "confirm-planning-close",
    });

    const declarationRef = publishPlanningDeclaration(state, "清单已结束，现在明确同意归档。");

    const archivePlan = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      priorPlanHash: initial.plan_hash,
      archiveDeclarationRef: declarationRef,
    });
    const postKernel = createTaskKernel(state.task);
    const confirmation = confirmClosePlan({
      task: state.task,
      kernel: postKernel,
      plan: archivePlan.plan,
      outcome: "confirmed",
      replyText: "确认执行展示的归档和提交。",
      stepSlug: "confirm-planning-archive",
    });
    for (const operation of ["archive", "commit", "push"]) {
      const authorization = {
        schema_version: "irreversible-authorization.v1",
        task_id: state.taskId,
        operation,
        subject_ref: confirmation.confirmation.human_confirmation_ref,
        subject_hash: confirmation.confirmation.human_confirmation_hash,
        material_revision: archivePlan.plan.delivery.planning.material_revision,
        snapshot_tree: archivePlan.plan.delivery.planning.snapshot_tree,
        authorized_at: "2026-09-11T00:00:00.000Z",
      };
      const authorizationRaw = `${JSON.stringify(authorization, null, 2)}\n`;
      postKernel.publishCanonicalRecord(`quality/authorizations/${createHash("sha256").update(authorizationRaw).digest("hex")}.json`, authorizationRaw);
    }

    const result = await executeClosePlan({
      task: state.task,
      kernel: postKernel,
      plan: archivePlan.plan,
      archiveDeclarationRef: declarationRef,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: postKernel, plan: archivePlan.plan }),
    });

    expect(result).toMatchObject({ status: "delivered", completion_record: null });
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow();
    expect(() => git(state.repo, ["cat-file", "-e", `refs/heads/main:specs/${state.taskId}/decision-log.md`])).toThrow();
    expect(git(state.repo, ["cat-file", "-e", `refs/heads/main:specs/archive/${state.taskId}/decision-log.md`])).toBe("");
    expect(git(state.repo, ["rev-parse", "refs/remotes/origin/main"])).toBe(git(state.repo, ["rev-parse", "refs/heads/main"]));
    expect(JSON.parse(state.task.readRecord(`operations/close/plans/${archivePlan.plan_hash}/steps/archive-spec.json`)).status).toBe("completed");
    expect(JSON.parse(state.task.readRecord(`operations/close/plans/${archivePlan.plan_hash}/steps/push-target-branch.json`)).status).toBe("completed");
  });
});
