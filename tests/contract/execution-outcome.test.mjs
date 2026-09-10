import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import * as completion from "../../runtime/stage/completion-predicates.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const taskId = "execution-task";
const stage = "make-decision";
const tree = "a".repeat(40);
const materialRevision = `revision-${"b".repeat(64)}`;
const scopeRevision = `revision-${"c".repeat(64)}`;
const runId = `vnext-${sha256(`${taskId}\0${stage}`).slice(0, 32)}`;

function outcome(attemptId, overrides = {}) {
  return {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: taskId,
    stage,
    run_id: runId,
    status: "completed",
    attempt_id: attemptId,
    producer: { kind: "stage-agent", host: "fixture", source_id: "fixture/agent", source_family: "fixture", agent_run_id: attemptId },
    snapshot_tree: tree,
    material_revision: materialRevision,
    material_hashes: {},
    material_scope: ["decision-log.md"],
    material_scope_revision: scopeRevision,
    material_scope_hashes: {},
    steps_manifest_ref: "workflows/make-decision/steps.json",
    steps_manifest_hash: "d".repeat(64),
    skills_manifest_ref: "workflows/make-decision/skill-deps.yaml",
    skills_manifest_hash: "e".repeat(64),
    step_outcomes: [],
    skill_outcomes: [],
    ...overrides,
  };
}

function input(values) {
  const records = new Map(values.map((value) => {
    const raw = `${JSON.stringify(value)}\n`;
    return [`quality/evidence/stage-outcomes/${stage}/${sha256(raw)}.json`, raw];
  }));
  return {
    task_id: taskId,
    read: (ref) => records.get(ref),
    stage_outcome_refs: { [stage]: [...records.keys()] },
    snapshot_tree: tree,
    material_revision: materialRevision,
    material_scope_revisions: { [stage]: scopeRevision },
    authenticate: ({ value }) => value,
  };
}

describe("execution outcome semantic projection", () => {
  it("requires a semantic outcome projector instead of treating equivalent retries as conflict", () => {
    expect(typeof completion.deriveExecutionOutcomes).toBe("function");
    if (typeof completion.deriveExecutionOutcomes !== "function") return;
    const result = completion.deriveExecutionOutcomes(input([outcome("attempt-1"), outcome("attempt-2")]));
    expect(result[stage]).toMatchObject({ status: "completed", blocking: false, attempt_count: 2, completed_attempt_count: 2 });
  });

  it("exposes a real conflict as failed and does not choose a winner", () => {
    expect(typeof completion.deriveExecutionOutcomes).toBe("function");
    if (typeof completion.deriveExecutionOutcomes !== "function") return;
    const result = completion.deriveExecutionOutcomes(input([
      outcome("attempt-1"),
      outcome("attempt-2", { steps_manifest_hash: "f".repeat(64) }),
    ]));
    expect(result[stage]).toMatchObject({ status: "failed", blocking: false, attempt_count: 2 });
    expect(result[stage].diagnostic).toMatchObject({ code: "execution_outcome_ambiguous" });
    expect(result[stage].refs).toHaveLength(2);
  });

  it("keeps same-attempt different bytes as a replay conflict", () => {
    const result = completion.deriveExecutionOutcomes(input([
      outcome("same-attempt"),
      outcome("same-attempt", { skills_manifest_hash: "f".repeat(64) }),
    ]));
    expect(result[stage]).toMatchObject({ status: "failed", diagnostic: { code: "execution_replay_conflict" } });
  });

  it("keeps no outcome unavailable and outside quality missing semantics", () => {
    expect(typeof completion.deriveExecutionOutcomes).toBe("function");
    if (typeof completion.deriveExecutionOutcomes !== "function") return;
    const result = completion.deriveExecutionOutcomes(input([]));
    expect(result[stage]).toMatchObject({ status: "unavailable", blocking: false, attempt_count: 0, completed_attempt_count: 0 });
  });

  it("fails loud for a malformed task-local canonical outcome", () => {
    const ref = `quality/evidence/stage-outcomes/${stage}/${"f".repeat(64)}.json`;
    const result = completion.deriveExecutionOutcomes({
      ...input([]),
      read: () => "not json",
      stage_outcome_refs: { [stage]: [ref] },
    });
    expect(result[stage]).toMatchObject({
      status: "failed",
      diagnostic: { code: "execution_outcome_integrity_failed", refs: [ref] },
    });
  });

  it("ignores summaries and analyzer prose when retries have the same execution semantics", () => {
    const result = completion.deriveExecutionOutcomes(input([
      outcome("attempt-1", { result_summary: "first result", spec_analyze: { result: "first prose" } }),
      outcome("attempt-2", { result_summary: "different result", spec_analyze: { result: "different prose" } }),
    ]));
    expect(result[stage]).toMatchObject({ status: "completed", attempt_count: 2 });
  });

  it("treats different terminal step status as ambiguous", () => {
    const result = completion.deriveExecutionOutcomes(input([
      outcome("attempt-1", { step_outcomes: [{ step_id: "step-1", step_slug: "step-1", status: "completed" }] }),
      outcome("attempt-2", { step_outcomes: [{ step_id: "step-1", step_slug: "step-1", status: "failed" }] }),
    ]));
    expect(result[stage]).toMatchObject({ status: "failed", diagnostic: { code: "execution_outcome_ambiguous" } });
  });

  it("fails loud when current outcome authentication fails", () => {
    const source = input([outcome("attempt-auth")]);
    const result = completion.deriveExecutionOutcomes({
      ...source,
      authenticate: () => { throw new Error("authentication failed"); },
    });
    expect(result[stage]).toMatchObject({ status: "failed", diagnostic: { code: "execution_outcome_integrity_failed" } });
  });
});
