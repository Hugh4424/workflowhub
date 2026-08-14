import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../runtime/task/task-handle.mjs";
import { appendTaskFact, appendMonitoringFacts, initializeTaskStore, readMonitoringFacts, readTaskFacts } from "../runtime/task/task-store.mjs";
import { createMonitoringFact, isHistoricalMonitoringFact, validateMonitoringFact } from "../runtime/evidence/monitoring-facts.mjs";
import { buildArtifactProjection } from "../runtime/evidence/fact-collector.mjs";

function taskRoot(taskId = "m15-facts") {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-m15-facts-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-m15-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const task = createTask({
    storageRoot: storage,
    manifest: { schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId, created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} },
  });
  initializeTaskStore(task.taskPath, { taskId });
  return task.taskPath;
}

const legacyFact = {
  stage: "build-code",
  material_digest: "a".repeat(64),
  source_digest: "b".repeat(64),
  invocation_id: "m15-legacy-invocation",
  source: "m15-test",
  status: "passed",
  content_hash: "c".repeat(64),
  output_ref: "quality/tests/m15-legacy.json",
};

function fact(overrides = {}) {
  return createMonitoringFact({
    fact_id: "fact:m15:stage:1",
    task_id: "m15-facts",
    project_name: "workflowhub",
    fact_type: "stage",
    stage: "build-code",
    run_id: "run-1",
    status: "present",
    value: { outcome: "completed" },
    source: { kind: "stage", ref: "stage-result:run-1", source_id: "stage-result", source_version: "v1" },
    coverage: { observed: 1, expected: 1 },
    ...overrides,
  });
}

describe("M15 monitoring facts", () => {
  it("keeps legacy facts readable while appending strict monitoring facts", () => {
    const root = taskRoot();
    appendTaskFact(root, legacyFact);
    const record = fact();
    const result = appendMonitoringFacts(root, { task_id: "m15-facts", records: [record] });
    expect(result.refs).toHaveLength(1);
    expect(readTaskFacts(root)).toEqual([expect.objectContaining(legacyFact), record]);
    expect(readMonitoringFacts(root)).toEqual([record]);
  });

  it("rejects unsupported fields, raw source paths, and present values without coverage", () => {
    expect(() => validateMonitoringFact({ ...fact(), unexpected: true })).toThrow(/unsupported/i);
    expect(() => fact({ source: { ...fact().source, ref: "/private/session.jsonl" } })).toThrow(/source ref/i);
    expect(() => fact({ source: { ...fact().source, ref: "quality/evidence/source.json" } })).toThrow(/source ref/i);
    expect(() => fact({ source: { ...fact().source, source_id: "/private/session.jsonl" } })).toThrow(/source_id/i);
    expect(() => fact({ session_id: "/private/session.jsonl" })).toThrow(/session_id/i);
    expect(() => fact({ subagent_id: "~/private/agent" })).toThrow(/subagent_id/i);
    expect(() => fact({ status: "present", value: null })).toThrow(/value/i);
  });

  it("rejects path-like evidence refs while allowing opaque namespaced refs", () => {
    for (const ref of ["/Users/Hugh/private/transcript.json", "~/private/session.json", "private\\session.json", "quality/../private.json"]) {
      expect(() => fact({ evidence_refs: [ref] })).toThrow(/evidence_refs/i);
    }
    expect(fact({ evidence_refs: ["quality/evidence/opaque-ref.json"] }).evidence_refs).toEqual(["quality/evidence/opaque-ref.json"]);
  });

  it("rejects typed values whose fields have the wrong type or required field is missing", () => {
    expect(() => fact({ fact_type: "token", value: { message_id: "m1", total_tokens: "10" } })).toThrow(/non-negative integer/i);
    expect(() => fact({ fact_type: "skill", value: { trigger: "yes", executed: true } })).toThrow(/boolean/i);
    expect(() => fact({ fact_type: "duration", value: { duration_ms: "10", event_id: "e1" } })).toThrow(/non-negative integer/i);
    expect(() => fact({ fact_type: "retry", value: { retry_id: "r1", retry_count: "1" } })).toThrow(/non-negative integer/i);
    expect(() => fact({ fact_type: "review", value: { invoked: "yes" } })).toThrow(/boolean/i);
    expect(() => fact({ fact_type: "stage", value: { reason: "missing outcome" } })).toThrow(/outcome.*required/i);
  });

  it("ships field ownership, source, consumer view, and version metadata for every schema field", () => {
    const schema = JSON.parse(readFileSync(new URL("../runtime/schemas/monitoring-fact.v1.json", import.meta.url), "utf8"));
    const required = new Set(schema.required);
    const metadata = new Map(schema["x-field-contracts"].map((entry) => [entry.field, entry]));
    expect(metadata.size).toBe(required.size);
    for (const field of required) expect(metadata.get(field)).toEqual(expect.objectContaining({ owner: expect.any(String), source: expect.any(String), view: expect.any(String), version: expect.any(String) }));
    expect(schema["x-value-contracts"].token).toEqual(expect.objectContaining({ required: ["message_id", "grain"], one_of: expect.arrayContaining(["total_tokens"]) }));
    expect(schema["x-value-contracts"].skill.fields.trigger).toBe("boolean");
  });

  it("makes the public JSON schema enforce typed value variants", () => {
    const schema = JSON.parse(readFileSync(new URL("../runtime/schemas/monitoring-fact.v1.json", import.meta.url), "utf8"));
    const validate = new Ajv2020({ strict: false, $data: true, formats: { "date-time": true } }).compile(schema);
    const validStage = fact();
    expect(validate(validStage)).toBe(true);
    expect(validate({ ...validStage, value: { outcome: "completed", result_summary: "真实结果摘要" } })).toBe(true);
    expect(validate({ ...validStage, value: {} })).toBe(false);
    expect(validate({ ...validStage, coverage: { expected: 0, observed: 1 } })).toBe(false);
    expect(validate({ ...validStage, coverage: { expected: null, observed: 999 } })).toBe(true);
    expect(validate({ ...validStage, fact_type: "token", value: { message_id: "m1", total_tokens: 3, grain: "message" } })).toBe(true);
    expect(validate({ ...validStage, fact_type: "token", value: { message_id: "m1", total_tokens: "3" } })).toBe(false);
    expect(validate({ ...validStage, fact_type: "token", value: { message_id: "m1", input_tokens: 2, grain: "message" } })).toBe(false);
    expect(validate({ ...validStage, fact_type: "token", value: { message_id: "m1", total_tokens: 3, unexpected: true } })).toBe(false);
    expect(validate({ ...validStage, evidence_refs: ["/Users/Hugh/private/transcript.json"] })).toBe(false);
    expect(validate({ ...validStage, evidence_refs: ["~/private/session.json"] })).toBe(false);
    expect(validate({ ...validStage, evidence_refs: ["quality/../private.json"] })).toBe(false);
    for (const ref of ["/private/source.json", "~/private/source.json", "quality/../source.json"]) {
      expect(validate({ ...validStage, source: { ...validStage.source, ref } })).toBe(false);
    }
    expect(validate({ ...validStage, evidence_refs: ["quality/evidence/opaque-ref.json"] })).toBe(true);
  });

  it("preserves missing, unknown, and conflict without zero-filling", () => {
    for (const status of ["missing", "unknown", "conflict"]) {
      const value = fact({ fact_id: `fact:m15:${status}`, status, value: null, reason: `${status}_reason`, coverage: { observed: 0, expected: 1 } });
      expect(validateMonitoringFact(value)).toEqual(value);
      expect(value.value).toBeNull();
    }
  });

  it("uses event states for skipped, applicability, unavailable, unsupported, and incomplete facts", () => {
    for (const status of ["skipped", "not_applicable", "unavailable", "unsupported", "incomplete"]) {
      const value = fact({ fact_id: `fact:m15:${status}`, status, value: null, reason: `${status}_reason`, coverage: { observed: 0, expected: 1 } });
      expect(validateMonitoringFact(value)).toEqual(value);
      expect(value.value).toBeNull();
    }
    for (const status of ["partial", "fatal"]) {
      expect(() => fact({ fact_id: `fact:m15:derived:${status}`, status, value: null, reason: `${status}_reason`, coverage: { observed: 0, expected: 1 } })).toThrow(/status is invalid/i);
    }
  });

  it("reads old partial/fatal monitoring rows without allowing new writers to create them", () => {
    const root = taskRoot();
    const historical = { ...fact({ fact_id: "fact:m15:historical-partial" }), status: "partial", value: null, reason: "old_contract" };
    expect(() => validateMonitoringFact(historical)).toThrow(/status is invalid/i);
    expect(isHistoricalMonitoringFact(historical)).toBe(true);
    const raw = readFileSync(join(root, "facts.jsonl"), "utf8");
    writeFileSync(join(root, "facts.jsonl"), `${raw}${JSON.stringify(historical)}\n`);
    expect(readTaskFacts(root)).toEqual([historical]);
    expect(readMonitoringFacts(root)).toEqual([historical]);
  });

  it("rejects a quality fact accidentally written to facts.jsonl with a namespace error", () => {
    const root = taskRoot();
    writeFileSync(join(root, "facts.jsonl"), `${JSON.stringify({ schema_version: "quality-fact.v1" })}\n`);
    expect(() => readMonitoringFacts(root)).toThrow(/quality facts must be stored under quality\/facts/i);
  });

  it("rejects monitoring facts from another project at both write and read boundaries", () => {
    const root = taskRoot();
    const foreign = fact({ fact_id: "fact:m15:foreign-project", project_name: "other-project" });
    expect(() => appendMonitoringFacts(root, { task_id: "m15-facts", records: [foreign] })).toThrow(/project identity mismatch/i);
    writeFileSync(join(root, "facts.jsonl"), `${JSON.stringify(foreign)}\n`);
    expect(() => readMonitoringFacts(root)).toThrow(/project identity mismatch/i);
  });

  it("requires an explanation for every non-present status", () => {
    expect(() => fact({ status: "unknown", value: null, reason: null, error: null })).toThrow(/reason or error/i);
  });

  it("rejects duplicate monitoring ids inside one append batch", () => {
    const root = taskRoot();
    const first = fact({ fact_id: "fact:m15:batch" });
    expect(() => appendMonitoringFacts(root, { task_id: "m15-facts", records: [first, first] })).toThrow(/duplicate monitoring fact id in batch/i);
    expect(readTaskFacts(root)).toEqual([]);
  });

  it("treats same-content replay as idempotent and changed-content replay as conflict", () => {
    const root = taskRoot();
    const record = fact({ fact_id: "fact:m15:replay" });
    const first = appendMonitoringFacts(root, { task_id: "m15-facts", records: [record] });
    const replay = appendMonitoringFacts(root, { task_id: "m15-facts", records: [record] });
    expect(replay).toMatchObject({ idempotent: true, refs: first.refs });
    expect(readMonitoringFacts(root)).toHaveLength(1);
    expect(() => appendMonitoringFacts(root, { task_id: "m15-facts", records: [fact({ fact_id: record.fact_id, reason: "changed" })] })).toThrow(/fact id conflict/i);
  });

  it("treats same-content replay as idempotent and changed-content replay as conflict", () => {
    const root = taskRoot();
    const record = fact({ fact_id: "fact:m15:replay" });
    const first = appendMonitoringFacts(root, { task_id: "m15-facts", records: [record] });
    const replay = appendMonitoringFacts(root, { task_id: "m15-facts", records: [record] });
    expect(replay).toMatchObject({ idempotent: true, refs: first.refs });
    expect(readMonitoringFacts(root)).toHaveLength(1);
    expect(() => appendMonitoringFacts(root, { task_id: "m15-facts", records: [fact({ fact_id: record.fact_id, reason: "changed" })] })).toThrow(/fact id conflict/i);
  });

  it("rolls back the facts append when index publication fails", () => {
    const root = taskRoot();
    expect(() => appendMonitoringFacts(root, { task_id: "m15-facts", records: [fact()] }, {
      indexTestHooks: { beforeIndexRename: () => { throw new Error("INJECTED_MONITORING_INDEX_FAILURE"); } },
    })).toThrow("INJECTED_MONITORING_INDEX_FAILURE");
    expect(readTaskFacts(root)).toEqual([]);
  });

  it("emits the accepted artifact record kind for the M14b material projection", () => {
    const records = buildArtifactProjection({
      materials: { "decision-log.md": "decision", "spec.md": "spec", "plan.md": "plan", "tasks.md": "tasks" },
      task: { listCanonicalReviewResultRefs: () => [] },
    });
    expect(records).toHaveLength(4);
    expect(records.every((record) => record.record_kind === "artifact")).toBe(true);
  });
});
