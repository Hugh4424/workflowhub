import { appendFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskFacts, writeStageRow } from "../../runtime/task/task-store.mjs";
import { publishQualityFact, publishVerifySummary } from "../../runtime/evidence/quality-store.mjs";

function taskRoot() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-storage-")));
  const targetRepo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-target-")));
  const taskId = "minimal-task";
  const task = createTask({
    storageRoot,
    taskPath: join(storageRoot, "Projects", "legacy", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      project_name: "legacy",
      task_id: taskId,
      created_at: new Date().toISOString(),
      target_repo_root: targetRepo,
      issue_ids: [],
      inputs: {},
    },
  });
  return task.taskPath;
}

describe("minimal task storage", () => {
  it("creates only identity, the execution record, and quality paths", () => {
    const root = taskRoot();

    initializeTaskStore(root, { taskId: "minimal-task" });

    expect(existsSync(join(root, "task.json"))).toBe(true);
    expect(existsSync(join(root, "facts.jsonl"))).toBe(true);
    expect(existsSync(join(root, "quality", "reviews"))).toBe(true);
    expect(existsSync(join(root, "quality", "tests"))).toBe(true);
    expect(existsSync(join(root, "quality", "verify.json"))).toBe(true);
    expect(existsSync(join(root, "index.json"))).toBe(false);
    expect(readdirSync(root).sort()).toEqual(["facts.jsonl", "quality", "task.json"]);
  });

  it("keeps one row per stage without any lineage field", () => {
    const root = taskRoot();
    initializeTaskStore(root, { taskId: "minimal-task" });

    const row = (stage, reviewOrigin) => ({
      record_kind: "stage",
      stage,
      source: "focused-test",
      review_origin: reviewOrigin,
      finding_dispositions: [],
      evidence: { value: [{ command: "true", exit_code: 0, failure_signature: "none" }] },
    });
    const first = writeStageRow(root, row("build-code", "not_run"));
    const second = writeStageRow(root, row("build-plan", "not_run"));
    const repaired = writeStageRow(root, row("build-code", "unavailable"));

    expect(first.action).toBe("inserted");
    expect(second.action).toBe("inserted");
    expect(repaired.action).toBe("replaced");
    expect(readTaskFacts(root)).toHaveLength(2);
    expect(JSON.stringify(readTaskFacts(root))).not.toMatch(/parent|previous|generation|selector|successor/);
  });

  it("fails loudly on malformed historical monitoring rows", () => {
    const base = {
      schema_version: ["monitoring", "fact.v1"].join("-"),
      fact_id: "fact-1",
      task_id: "minimal-task",
      project_name: "legacy",
      fact_type: "stage",
      stage: "build-code",
      step_id: null,
      step_slug: null,
      skill_id: null,
      session_id: null,
      subagent_id: null,
      run_id: null,
      attempt_id: null,
      status: "present",
      value: { outcome: "completed" },
      reason: null,
      error: null,
      observed_at: "2026-08-30T00:00:00Z",
      source: { kind: "stage", ref: "ref-1", source_id: "source-1", source_version: "v1" },
      coverage: { expected: 1, observed: 1 },
      contract_version: "v1",
      collector_version: "v1",
      adapter_version: null,
      skill_version: null,
      evidence_refs: [],
    };
    const malformed = [
      Object.fromEntries(Object.entries(base).filter(([key]) => key !== "coverage")),
      { ...base, status: "bogus" },
      { ...base, value: [] },
      { ...base, coverage: { expected: 0, observed: 1 } },
    ];
    for (const value of malformed) {
      const root = taskRoot();
      initializeTaskStore(root, { taskId: "minimal-task" });
      appendFileSync(join(root, "facts.jsonl"), `${JSON.stringify(value)}\n`);
      expect(() => readTaskFacts(root)).toThrow(/historical monitoring fact is invalid/);
    }
  });

  it("stores quality facts and verify summary in separate quality paths", () => {
    const root = taskRoot();
    initializeTaskStore(root, { taskId: "minimal-task" });

    const review = publishQualityFact(root, "reviews", {
      task_id: "minimal-task",
      stage: "build-code",
      status: "unavailable",
      source: "wh-review",
      schema_version: "review-fact.v1",
      content_hash: "f".repeat(64),
    });
    const test = publishQualityFact(root, "tests", {
      task_id: "minimal-task",
      stage: "build-code",
      status: "passed",
      source: "vitest",
      schema_version: "test-fact.v1",
      content_hash: "1".repeat(64),
    });
    publishVerifySummary(root, { status: "incomplete", missing: ["review"] });

    expect(review.ref).toMatch(/^quality\/reviews\/[a-f0-9]{64}\.json$/);
    expect(test.ref).toMatch(/^quality\/tests\/[a-f0-9]{64}\.json$/);
    expect(JSON.parse(readFileSync(join(root, "quality", "verify.json"), "utf8"))).toMatchObject({ status: "incomplete" });
    expect(readdirSync(join(root, "quality", "reviews"))).toHaveLength(1);
    expect(readdirSync(join(root, "quality", "tests"))).toHaveLength(1);
    expect(readdirSync(root).some((name) => /index/i.test(name))).toBe(false);
  });

  it("T1 AC-MS-009 enforces the exact stage and close-action field contract", () => {
    const root = taskRoot();
    initializeTaskStore(root, { taskId: "minimal-task" });

    const stageRow = {
      record_kind: "stage", stage: "build-code", source: "field-contract-fixture",
      review_origin: "conducted", review_result_ref: { value: "quality/reviews/results/current.json" },
      finding_dispositions: [{ finding: "F-1", disposition: "fixed" }],
      spec_analyze: { value: "aligned" },
      evidence: { value: [{ command: "npx vitest run tests/demo.test.mjs", exit_code: 0, failure_signature: "none" }] },
      layer_states: { implementation_completion: "completed", stage_quality: "completed", delivery: "unavailable", task_closure: "unavailable" },
      serious_issue_disposition: { value: null, reason: "no serious issue in this fixture" },
      close_action: { value: null, reason: "stage rows never carry a close action" },
      handoff: { value: "HANDOFF-001", reason: "one named handoff item" },
    };
    writeStageRow(root, stageRow);
    const row = readTaskFacts(root)[0];
    // Two row types share one frozen field table.
    expect(Object.keys(row).sort()).toEqual([
      "close_action", "created_at", "evidence", "finding_dispositions", "handoff", "layer_states",
      "material_digest", "record_kind", "review_origin", "review_result_ref", "serious_issue_disposition",
      "snapshot_tree", "source", "spec_analyze", "stage", "task_id",
    ]);
    // Four independent layers, never merged into one verdict.
    expect(Object.keys(row.layer_states).sort()).toEqual(["delivery", "implementation_completion", "stage_quality", "task_closure"]);
    for (const state of Object.values(row.layer_states)) expect(["completed", "unavailable", "incomplete", "partial"]).toContain(state);
    // Nested element shapes are frozen too.
    expect(row.finding_dispositions[0]).toEqual({ finding: "F-1", disposition: "fixed" });
    expect(row.evidence.value[0]).toEqual({ command: "npx vitest run tests/demo.test.mjs", exit_code: 0, failure_signature: "none" });
    // Conditional fields use the empty-with-reason encoding, never a missing key.
    expect(row.close_action.value).toBeNull();
    expect(typeof row.close_action.reason).toBe("string");

    // A close-action row is the same key set with the close-specific values.
    writeStageRow(root, {
      record_kind: "close_action", stage: "close", source: "field-contract-fixture",
      review_origin: "not_run", finding_dispositions: [],
      evidence: { value: [{ command: "git push", exit_code: 0, failure_signature: "none" }] },
      layer_states: { implementation_completion: "completed", stage_quality: "completed", delivery: "completed", task_closure: "incomplete" },
      close_action: { action: "push", result: "pushed", ref: "origin/main" },
      handoff: { value: null, reason: "no handoff item on a close-action row" },
    });
    const closeRow = readTaskFacts(root).find((value) => value.record_kind === "close_action");
    expect(Object.keys(closeRow).sort()).toEqual(Object.keys(row).sort());
    expect(closeRow.close_action).toMatchObject({ action: "push", result: "pushed", ref: "origin/main" });
    expect(closeRow.stage).toBe("close");

    // The four finding dispositions are the only accepted machine values.
    expect(() => writeStageRow(root, { ...stageRow, stage: "build-plan", finding_dispositions: [{ finding: "F-2", disposition: "looks_fine" }] }))
      .toThrow(/disposition must be one of the four frozen values/);
    expect(() => writeStageRow(root, { ...stageRow, stage: "build-spec", review_origin: "conducted", review_result_ref: { value: null, reason: "forgot the ref" } }))
      .toThrow(/conducted reviews require a named review_result_ref/);

    // close_action is a conditional field on stage rows too, so the same
    // empty-with-reason encoding applies: an empty value needs a real reason.
    expect(() => writeStageRow(root, { ...stageRow, stage: "build-plan", close_action: { value: null } }))
      .toThrow(/close_action requires a reason when its value is empty/);
    expect(() => writeStageRow(root, { ...stageRow, stage: "build-plan", close_action: { value: null, reason: "   " } }))
      .toThrow(/close_action requires a reason when its value is empty/);
    expect(() => writeStageRow(root, { ...stageRow, stage: "build-plan", close_action: { reason: "no value position" } }))
      .toThrow(/close_action must carry only value and reason/);
    // A stage row still never carries a close action, in the frozen shape or
    // in the close-action row shape.
    expect(() => writeStageRow(root, { ...stageRow, stage: "build-plan", close_action: { value: { action: "push", result: "pushed" } } }))
      .toThrow(/stage rows must leave close_action empty with a reason/);
    expect(() => writeStageRow(root, { ...stageRow, stage: "build-plan", close_action: { action: "push", result: "pushed" } }))
      .toThrow(/close_action must carry only value and reason/);
    expect(writeStageRow(root, { ...stageRow, stage: "build-plan", close_action: { value: null, reason: "this stage row carries no close action" } }).action)
      .toBe("inserted");
    expect(readTaskFacts(root).find((value) => value.stage === "build-plan").close_action)
      .toEqual({ value: null, reason: "this stage row carries no close action" });
  });
  it("T1 AC-MS-007 writes facts without index", () => {
    const taskRootPath = taskRoot();
    initializeTaskStore(taskRootPath, { taskId: "minimal-task" });
    const row = (stage) => ({
      record_kind: "stage", stage, source: "ac007-fixture",
      review_origin: "not_run", finding_dispositions: [],
      evidence: { value: [{ command: "true", exit_code: 0, failure_signature: "none" }] },
    });
    writeStageRow(taskRootPath, row("build-code"));
    writeStageRow(taskRootPath, row("verify-code"));
    const rows = readTaskFacts(taskRootPath);
    expect(rows.map((row) => row.stage)).toEqual(["build-code", "verify-code"]);
    // The execution record file is the only non-quality execution artefact.
    expect(readdirSync(taskRootPath).sort()).toEqual(["facts.jsonl", "quality", "task.json"]);
    expect(readdirSync(taskRootPath).some((name) => /index/i.test(name))).toBe(false);
  });
});
