import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import {
  loadPortableWorkflowManifest,
  projectPortableWorkflowStatus,
  readLatestPortableTerminal,
  runPortableWorkflow,
} from "../../runtime/task/portable-workflow-run.mjs";

const ROOT = realpathSync(join(fileURLToPath(new URL("../..", import.meta.url))));
const roots = [];

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-portable-run-")));
  roots.push(root);
  const storage = join(root, "storage");
  mkdirSync(storage);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      project_name: "workflowhub",
      task_id: "portable-workflow-contract",
      created_at: "2026-09-20T00:00:00.000Z",
      target_repo_root: root,
      issue_ids: [],
      inputs: {},
    },
  });
  return { task };
}

function publishStepResultEvidence(task, stepResults) {
  const value = {
    task_id: task.identity.taskId,
    workflow: "build-prd",
    step_results: stepResults.map(({ step_id, step_slug, status }) => ({ step_id, step_slug, status })),
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const sha256 = createHash("sha256").update(raw).digest("hex");
  const ref = `quality/evidence/portable-workflow-outcomes/build-prd/${sha256}.json`;
  try {
    if (task.readRecord(ref) !== raw) throw new Error("portable step evidence content conflict");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    task.createRecordAtomic(ref, raw);
  }
  return ref;
}

function bindStepResultEvidence(task, input) {
  const resultRef = publishStepResultEvidence(task, input.step_results);
  input.step_results = input.step_results.map((result) => ({ ...result, result_ref: resultRef }));
  return input;
}

function completeInput(task, manifest, overrides = {}) {
  return bindStepResultEvidence(task, {
    task_id: task.identity.taskId,
    workflow: "build-prd",
    step_results: manifest.steps.map((step) => ({
      task_id: task.identity.taskId,
      workflow: "build-prd",
      step_id: step.step_id,
      step_slug: step.step_slug,
      status: "completed",
      result_ref: null,
    })),
    ...overrides,
  });
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("CARD-01 portable build-prd runner", () => {
  it("loads exactly the six portable steps without importing the formal-stage validator", () => {
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    expect(manifest.steps).toHaveLength(6);
    expect(manifest.steps.map(({ step_slug }) => step_slug)).toEqual([
      "load-parent-decision",
      "draft-outline-and-task-map",
      "confirm-map-and-conditional-design",
      "expand-single-prd",
      "confirm-final-displayed-draft",
      "report-facts-and-handoff",
    ]);
    expect(readFileSync("runtime/task/portable-workflow-run.mjs", "utf8")).not.toMatch(/validateStepManifest/);
    const altered = JSON.parse(JSON.stringify(manifest));
    altered.steps[2].step_slug = "unexpected-step";
    expect(() => loadPortableWorkflowManifest({ worktreeRoot: ROOT, read: () => JSON.stringify(altered) })).toThrow(/step 3 is invalid/);
  });

  it("records a succeeded terminal only when every portable step is complete", () => {
    const { task } = fixture();
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    const result = runPortableWorkflow({
      task,
      worktreeRoot: ROOT,
      input: completeInput(task, manifest),
      now: () => new Date("2026-09-20T00:00:00.000Z"),
    });
    expect(result).toMatchObject({ state: "succeeded", terminal: {
      record_kind: "portable_workflow_terminal",
      task_id: task.identity.taskId,
      workflow: "build-prd",
      failed_step: null,
      step_result_refs: expect.any(Array),
    } });
    expect(readLatestPortableTerminal({ task })).toMatchObject({ state: "succeeded" });
    expect(projectPortableWorkflowStatus({ task })).toMatchObject({ state: "succeeded" });
  });

  it("preserves missing and malformed outcomes as failed terminal facts", () => {
    const { task } = fixture();
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    const missingThird = completeInput(task, manifest, { step_results: completeInput(task, manifest).step_results.filter(({ step_id }) => step_id !== 3) });
    const failed = runPortableWorkflow({ task, worktreeRoot: ROOT, input: missingThird, now: () => new Date("2026-09-20T00:00:01.000Z") });
    expect(failed.terminal).toMatchObject({ state: "failed", failed_step: "confirm-map-and-conditional-design" });

    const malformed = runPortableWorkflow({
      task,
      worktreeRoot: ROOT,
      input: { workflow: "build-prd", step_results: [] },
      now: () => new Date("2026-09-20T00:00:02.000Z"),
    });
    expect(malformed.terminal).toMatchObject({ state: "failed", failed_step: null });
    expect(malformed.terminal.reason).toMatch(/task_id|invalid/i);

    const malformedKnownStep = completeInput(task, manifest);
    malformedKnownStep.step_results[2] = { ...malformedKnownStep.step_results[2], task_id: "wrong-task" };
    const malformedKnown = runPortableWorkflow({
      task,
      worktreeRoot: ROOT,
      input: malformedKnownStep,
      now: () => new Date("2026-09-20T00:00:02.000Z"),
    });
    expect(malformedKnown.terminal).toMatchObject({ state: "failed", failed_step: "confirm-map-and-conditional-design" });
  });

  it("refuses completed status when its result_ref has no authenticated step evidence", () => {
    const { task } = fixture();
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    const fabricated = completeInput(task, manifest);
    fabricated.step_results = fabricated.step_results.map((result) => ({
      ...result,
      result_ref: `quality/evidence/portable-workflow-outcomes/build-prd/${"f".repeat(64)}.json`,
    }));

    const result = runPortableWorkflow({ task, worktreeRoot: ROOT, input: fabricated, now: () => new Date("2026-09-20T00:00:02.500Z") });
    expect(result.terminal).toMatchObject({ state: "failed", failed_step: "load-parent-decision" });
    expect(result.terminal.reason).toMatch(/result_ref|step evidence|unavailable|missing/i);
  });

  it("refuses a self-attested outcome record with contradictory entries for one step", () => {
    const { task } = fixture();
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    const input = completeInput(task, manifest);
    const contradictory = {
      task_id: task.identity.taskId,
      workflow: "build-prd",
      step_results: [
        { step_id: 1, step_slug: "load-parent-decision", status: "completed" },
        { step_id: 1, step_slug: "load-parent-decision", status: "failed" },
        ...input.step_results.slice(1).map(({ step_id, step_slug, status }) => ({ step_id, step_slug, status })),
      ],
    };
    const raw = `${JSON.stringify(contradictory, null, 2)}\n`;
    const digest = createHash("sha256").update(raw).digest("hex");
    const ref = `quality/evidence/portable-workflow-outcomes/build-prd/${digest}.json`;
    task.createRecordAtomic(ref, raw);
    input.step_results = input.step_results.map((result) => ({ ...result, result_ref: ref }));
    const result = runPortableWorkflow({ task, worktreeRoot: ROOT, input, now: () => new Date("2026-09-20T00:00:02.750Z") });
    expect(result.terminal).toMatchObject({ state: "failed", failed_step: "load-parent-decision" });
    expect(result.terminal.reason).toMatch(/exactly once/);
  });

  it("uses the seven-value projection without making machine gaps blocked", () => {
    const { task } = fixture();
    expect(projectPortableWorkflowStatus({ task })).toMatchObject({ state: "not-started" });
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    const unverified = completeInput(task, manifest);
    unverified.step_results[4] = { ...unverified.step_results[4], status: "unverified" };
    bindStepResultEvidence(task, unverified);
    expect(runPortableWorkflow({ task, worktreeRoot: ROOT, input: unverified, now: () => new Date("2026-09-20T00:00:03.000Z") }).state).toBe("unverified");
    const blocked = completeInput(task, manifest);
    blocked.step_results[2] = { ...blocked.step_results[2], status: "blocked", dependency: "human confirmation", unblock_condition: "reply received" };
    bindStepResultEvidence(task, blocked);
    expect(runPortableWorkflow({ task, worktreeRoot: ROOT, input: blocked, now: () => new Date("2026-09-20T00:00:04.000Z") }).state).toBe("blocked");
  });

  it("appends a new terminal on re-entry and never starts a code-stage outcome", () => {
    const { task } = fixture();
    const manifest = loadPortableWorkflowManifest({ worktreeRoot: ROOT });
    const failed = runPortableWorkflow({ task, worktreeRoot: ROOT, input: { ...completeInput(task, manifest), step_results: [] }, now: () => new Date("2026-09-20T00:00:05.000Z") });
    const recovered = runPortableWorkflow({ task, worktreeRoot: ROOT, input: completeInput(task, manifest), now: () => new Date("2026-09-20T00:00:06.000Z") });
    expect(failed.ref).not.toBe(recovered.ref);
    expect(readLatestPortableTerminal({ task })).toMatchObject({ ref: recovered.ref, state: "succeeded" });
    expect(() => task.readRecord("quality/evidence/stage-outcomes/build-code/not-created.json")).toThrow();

    const sameTime = () => new Date("2026-09-20T00:00:07.000Z");
    const firstSame = runPortableWorkflow({ task, worktreeRoot: ROOT, input: { ...completeInput(task, manifest), step_results: [] }, now: sameTime });
    const secondSame = runPortableWorkflow({ task, worktreeRoot: ROOT, input: { ...completeInput(task, manifest), step_results: [] }, now: sameTime });
    expect(secondSame.ref).not.toBe(firstSame.ref);
    expect(readLatestPortableTerminal({ task })).toMatchObject({ ref: secondSame.ref, state: "failed" });
  });
});
