import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskFacts, writeStageRow } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { deriveExecutionOutcomes, deriveStageOutcomeStatuses, stageMaterialScopeRevisions } from "../../runtime/stage/completion-predicates.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const STAGE = "build-code";
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

/** A real task store with a real worktree and the current four materials. */
function fixture(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-record-row-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-09-11T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return { root, repo, task, candidate, kernel, artifacts };
}

/** The current snapshot/material bindings `status` passes to the projections. */
function currentBindings(state) {
  return {
    snapshot_tree: state.kernel.currentVNextSnapshot().tree,
    material_revision: state.kernel.currentVNextMaterialRevision(),
    material_scope_revisions: stageMaterialScopeRevisions(Object.fromEntries(MATERIALS.map((name) => [
      name,
      state.artifacts.read(name),
    ]))),
    snapshot_root: state.candidate.worktreeRoot,
  };
}

/** Write the one current stage row through the real writer. */
function writeRow(state, {
  stage = STAGE,
  layerState = "completed",
  exitCode = 0,
  materialDigest = undefined,
  snapshotTree = undefined,
  source = "stage-end:build-code",
} = {}) {
  const bindings = currentBindings(state);
  return writeStageRow(state.task.taskPath, {
    record_kind: "stage",
    stage,
    source,
    material_digest: materialDigest ?? { value: bindings.material_scope_revisions[stage].replace(/^revision-/, "") },
    snapshot_tree: snapshotTree ?? { value: bindings.snapshot_tree, reason: "handoff snapshot captured from the current workspace" },
    review_origin: "not_run",
    review_result_ref: { value: null, reason: "the stage row records the stage-end facts; reviews are recorded separately" },
    finding_dispositions: [],
    evidence: { value: [{ command: `stage-handoff:${stage}`, exit_code: exitCode, failure_signature: exitCode === 0 ? "published" : "unavailable" }] },
    layer_states: {
      implementation_completion: layerState,
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    },
  });
}

/** Publish a genuine, enumerable stage-outcome envelope through the kernel. */
function publishEnvelope(state, { status = "incomplete" } = {}) {
  const bindings = currentBindings(state);
  const value = {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: state.task.identity.taskId,
    stage: STAGE,
    run_id: state.kernel.deriveStageWorkflowRunId(STAGE),
    attempt_id: "attempt-legacy-envelope",
    status,
    snapshot_tree: bindings.snapshot_tree,
    material_revision: bindings.material_revision,
    material_scope_revision: bindings.material_scope_revisions[STAGE],
    step_outcomes: [],
    skill_outcomes: [],
  };
  const raw = `${JSON.stringify(value)}\n`;
  const ref = `quality/evidence/stage-outcomes/${STAGE}/${sha256(raw)}.json`;
  state.kernel.publishCanonicalRecord(ref, raw);
  return { ref, raw, value };
}

function projectionInput(state, { readTaskFacts = null, read = null } = {}) {
  const bindings = currentBindings(state);
  return {
    task_id: state.task.identity.taskId,
    read: read ?? state.task.readRecord,
    stage_outcome_refs: { [STAGE]: state.task.listCanonicalStageOutcomeRefs(STAGE) },
    material_scope_revisions: bindings.material_scope_revisions,
    snapshot_tree: bindings.snapshot_tree,
    material_revision: bindings.material_revision,
    snapshot_root: bindings.snapshot_root,
    authenticate: ({ value }) => value,
    ...(readTaskFacts === null ? {} : { read_task_facts: readTaskFacts }),
  };
}

function recordReader(state) {
  return () => readTaskFacts(state.task.taskPath);
}

/** A reader that fails the test if the projection reads any stage-outcome byte. */
function countingEnvelopeReader(state, counter) {
  return (ref) => {
    if (/^quality\/evidence\/stage-outcomes\//.test(String(ref))) counter.reads += 1;
    return state.task.readRecord(ref);
  };
}

describe("stage result reading is redirected to the frozen execution-record row", () => {
  it("derives the stage result from the row and never reads the stage-outcome bytes", () => {
    const state = fixture("ac011-row-wins");
    const envelope = publishEnvelope(state, { status: "incomplete" });
    writeRow(state, { layerState: "completed" });
    expect(state.task.listCanonicalStageOutcomeRefs(STAGE)).toEqual([envelope.ref]);

    const counter = { reads: 0 };
    const read = countingEnvelopeReader(state, counter);

    // Legacy callers (no record declaration) still read the immutable envelope.
    const legacy = projectionInput(state, { read });
    expect(deriveStageOutcomeStatuses(legacy)[STAGE]).toBe("incomplete");
    expect(deriveExecutionOutcomes(legacy)[STAGE].status).toBe("incomplete");
    expect(counter.reads).toBeGreaterThan(0);

    // The current production call declares the single execution record: the row
    // decides, and the contradicting envelope bytes are not read at all.
    counter.reads = 0;
    const redirected = projectionInput(state, { read, readTaskFacts: recordReader(state) });
    const statuses = deriveStageOutcomeStatuses(redirected);
    const execution = deriveExecutionOutcomes(redirected)[STAGE];
    expect(statuses[STAGE]).toBe("completed");
    expect(execution).toMatchObject({
      status: "completed",
      blocking: false,
      attempt_count: 1,
      completed_attempt_count: 1,
      refs: ["facts.jsonl"],
    });
    expect(execution.record).toMatchObject({ ref: "facts.jsonl", source: "stage-end:build-code" });
    expect(execution.record.layer_states).toEqual({
      implementation_completion: "completed",
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    });
    expect(counter.reads).toBe(0);
  });

  it("does not depend on the stage-outcome file: deleting it leaves the row result unchanged", () => {
    const state = fixture("ac011-row-survives-file-deletion");
    const envelope = publishEnvelope(state, { status: "incomplete" });
    writeRow(state, { layerState: "completed" });
    const redirected = projectionInput(state, { readTaskFacts: recordReader(state) });
    const before = deriveExecutionOutcomes(redirected)[STAGE];
    const beforeStatuses = deriveStageOutcomeStatuses(redirected);

    // Only the old stage-result file disappears; the row is untouched.
    rmSync(join(state.task.taskPath, envelope.ref), { force: true });
    expect(state.task.listCanonicalStageOutcomeRefs(STAGE)).toEqual([]);

    const after = deriveExecutionOutcomes(redirected)[STAGE];
    expect(after).toEqual(before);
    expect(deriveStageOutcomeStatuses(redirected)).toEqual(beforeStatuses);
    expect(after.status).toBe("completed");
  });

  it("changes with the row alone: mutating one row field moves both projections", () => {
    const state = fixture("ac011-row-mutation");
    publishEnvelope(state, { status: "completed" });
    writeRow(state, { layerState: "completed" });
    const redirected = projectionInput(state, { readTaskFacts: recordReader(state) });
    expect(deriveStageOutcomeStatuses(redirected)[STAGE]).toBe("completed");

    // Only the row changes; the immutable envelope still says completed.
    writeRow(state, { layerState: "incomplete" });
    expect(deriveStageOutcomeStatuses(redirected)[STAGE]).toBe("incomplete");
    expect(deriveExecutionOutcomes(redirected)[STAGE]).toMatchObject({ status: "incomplete", completed_attempt_count: 0 });

    // And an explicit partial layer keeps its own frozen value.
    writeRow(state, { layerState: "partial" });
    expect(deriveStageOutcomeStatuses(redirected)[STAGE]).toBe("partial");
  });

  it("never reports completed for a row that records a failed command", () => {
    const state = fixture("ac011-row-failed-command");
    publishEnvelope(state, { status: "completed" });
    writeRow(state, { layerState: "completed", exitCode: 1 });
    const redirected = projectionInput(state, { readTaskFacts: recordReader(state) });

    const execution = deriveExecutionOutcomes(redirected)[STAGE];
    expect(execution.status).toBe("incomplete");
    expect(execution.diagnostic).toMatchObject({ code: "execution_record_row_records_failed_command" });
    expect(execution.diagnostic.reason).toContain("stage-handoff:build-code");
    expect(deriveStageOutcomeStatuses(redirected)[STAGE]).toBe("incomplete");
    expect(deriveStageOutcomeStatuses(redirected).record_reasons[STAGE]).toContain("exit 1");
  });

  it("reports an honest unavailable with an observable reason when the store has no row", () => {
    const state = fixture("ac011-row-absent");
    const envelope = publishEnvelope(state, { status: "completed" });
    expect(existsSync(join(state.task.taskPath, envelope.ref))).toBe(true);
    const redirected = projectionInput(state, { readTaskFacts: recordReader(state) });

    const execution = deriveExecutionOutcomes(redirected)[STAGE];
    expect(execution).toMatchObject({ status: "unavailable", attempt_count: 0, completed_attempt_count: 0, refs: [] });
    expect(execution.diagnostic).toMatchObject({ code: "execution_record_row_missing" });
    expect(execution.diagnostic.reason).toContain(`no ${STAGE} stage row`);
    const statuses = deriveStageOutcomeStatuses(redirected);
    expect(statuses[STAGE]).toBe("unavailable");
    expect(statuses.record_reasons[STAGE]).toContain(`no ${STAGE} stage row`);

    // The envelope is still on disk and still readable as history; it is simply
    // not the current stage result any more.
    expect(existsSync(join(state.task.taskPath, envelope.ref))).toBe(true);
  });

  it("reports an unreadable or empty record as unavailable instead of failing the reader", () => {
    const state = fixture("ac011-row-record-unreadable");
    writeRow(state, { layerState: "completed" });
    const throwing = projectionInput(state, { readTaskFacts: () => { const error = new Error("ENOENT: no such file or directory, open 'facts.jsonl'"); error.code = "ENOENT"; throw error; } });
    const execution = deriveExecutionOutcomes(throwing)[STAGE];
    expect(execution.status).toBe("unavailable");
    expect(execution.diagnostic).toMatchObject({ code: "execution_record_unreadable" });
    expect(execution.diagnostic.reason).toContain("facts.jsonl");
  });

  it("treats a row outside the current snapshot or material revision as stale, never as completed", () => {
    const state = fixture("ac011-row-stale");
    writeRow(state, { layerState: "completed", snapshotTree: { value: "b".repeat(40), reason: "recorded against an older snapshot" } });
    const staleSnapshot = projectionInput(state, { readTaskFacts: recordReader(state) });
    expect(deriveStageOutcomeStatuses(staleSnapshot)[STAGE]).toBe("unavailable");
    expect(deriveExecutionOutcomes(staleSnapshot)[STAGE].diagnostic).toMatchObject({ code: "execution_record_row_snapshot_stale" });

    writeRow(state, { layerState: "completed", materialDigest: { value: "c".repeat(64) } });
    const staleMaterial = projectionInput(state, { readTaskFacts: recordReader(state) });
    expect(deriveStageOutcomeStatuses(staleMaterial)[STAGE]).toBe("unavailable");
    expect(deriveExecutionOutcomes(staleMaterial)[STAGE].diagnostic).toMatchObject({ code: "execution_record_row_material_stale" });
  });

  it("reports two rows for one stage as an explicit conflict instead of picking one", () => {
    const state = fixture("ac011-row-duplicate");
    const written = writeRow(state, { layerState: "completed" });
    appendFileSync(join(state.task.taskPath, "facts.jsonl"), `${JSON.stringify({ ...written.value, source: "duplicate-writer" })}\n`);
    expect(readTaskFacts(state.task.taskPath).filter((row) => row.record_kind === "stage")).toHaveLength(2);

    const redirected = projectionInput(state, { readTaskFacts: recordReader(state) });
    expect(deriveStageOutcomeStatuses(redirected)[STAGE]).toBe("conflict");
    const execution = deriveExecutionOutcomes(redirected)[STAGE];
    expect(execution.status).toBe("unavailable");
    expect(execution.diagnostic).toMatchObject({ code: "execution_record_row_duplicate" });
  });

  it("keeps quality-fact observations out of the decision once the record declares the row", () => {
    const state = fixture("ac011-row-ignores-observations");
    writeRow(state, { layerState: "completed" });
    // In the legacy branch this observation pair would select nothing and make
    // the stage unavailable; under the record it must not decide anything.
    const observation = {
      fact: { ref: "quality/facts/whatever.json", value: { task_id: state.task.identity.taskId, stage: STAGE, kind: "test", subject: "risk_tests_fresh", status: "present" } },
      authenticated: true,
      recorded: true,
      freshness: { status: "current" },
    };
    const redirected = { ...projectionInput(state, { readTaskFacts: recordReader(state) }), quality_fact_observations: [observation] };
    expect(deriveStageOutcomeStatuses(redirected)[STAGE]).toBe("completed");
    const withoutObservations = projectionInput(state, { readTaskFacts: recordReader(state) });
    expect(deriveStageOutcomeStatuses(redirected)[STAGE]).toBe(deriveStageOutcomeStatuses(withoutObservations)[STAGE]);
  });

  it("keeps the legacy stage-outcome branch byte-identical for callers that do not declare the record", () => {
    const state = fixture("ac011-legacy-branch");
    const envelope = publishEnvelope(state, { status: "completed" });
    writeRow(state, { layerState: "incomplete" });
    const legacy = projectionInput(state);

    expect(deriveStageOutcomeStatuses(legacy)[STAGE]).toBe("completed");
    expect(deriveStageOutcomeStatuses(legacy).record_reasons).toBeUndefined();
    expect(deriveExecutionOutcomes(legacy)[STAGE]).toMatchObject({
      status: "completed",
      refs: [envelope.ref],
    });
    expect(deriveExecutionOutcomes(legacy)[STAGE]).not.toHaveProperty("record");
  });
});

describe("the real status entry point reads the current row", () => {
  it("reports the row-derived execution outcome end to end and follows a row-only update", () => {
    const state = fixture("ac011-status-row");
    writeRow(state, { layerState: "completed" });
    // A current task publishes no stage-outcome directory at all.
    expect(existsSync(join(state.task.taskPath, "quality", "evidence", "stage-outcomes"))).toBe(false);

    const env = { ...process.env, HOME: state.root, WORKFLOWHUB_TASK_DIR: state.root };
    const runStatus = () => {
      const result = spawnSync(process.execPath, [
        join(process.cwd(), "tools", "cli", "stage-runtime.mjs"), "status", "--action=begin",
        "--stage=build-code", "--project=WorkflowHub", "--task=ac011-status-row",
      ], { cwd: process.cwd(), encoding: "utf8", env });
      expect(result.status, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    };

    const first = runStatus();
    expect(first.execution_outcome).toMatchObject({
      status: "completed",
      blocking: false,
      attempt_count: 1,
      completed_attempt_count: 1,
      refs: ["facts.jsonl"],
    });
    expect(first.execution_outcome.record.layer_states).toEqual({
      implementation_completion: "completed",
      stage_quality: "incomplete",
      delivery: "unavailable",
      task_closure: "unavailable",
    });

    // Only the record row changes: the public status output follows it.
    writeRow(state, { layerState: "incomplete", source: "stage-end:build-code-retry" });
    const second = runStatus();
    expect(second.execution_outcome).toMatchObject({ status: "incomplete", attempt_count: 1, completed_attempt_count: 0 });
    expect(second.execution_outcome.record.source).toBe("stage-end:build-code-retry");
    expect(second.quality_predicates.stage_outcome.status).toBe("missing");
    expect(second.product_release_status).toBe("not_released");
  });

  it("keeps a row-less store honest end to end instead of inventing completion", () => {
    const state = fixture("ac011-status-no-row");
    const env = { ...process.env, HOME: state.root, WORKFLOWHUB_TASK_DIR: state.root };
    const result = spawnSync(process.execPath, [
      join(process.cwd(), "tools", "cli", "stage-runtime.mjs"), "status", "--action=begin",
      "--stage=build-code", "--project=WorkflowHub", "--task=ac011-status-no-row",
    ], { cwd: process.cwd(), encoding: "utf8", env });
    expect(result.status, result.stderr).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.execution_outcome).toMatchObject({ status: "unavailable", attempt_count: 0, refs: [] });
    expect(parsed.execution_outcome.diagnostic.code).toBe("execution_record_row_missing");
    expect(parsed.quality_missing).toContain("stage_outcome");
    expect(readFileSync(join(state.task.taskPath, "facts.jsonl"), "utf8")).toBe("");
  });
});
