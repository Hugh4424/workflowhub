import { describe, expect, it } from "vitest";

import { createRegisteredCodexSource, parseRegisteredCodexTranscript } from "../runtime/evidence/codex-transcript-adapter.mjs";
import { createTranscriptSourceReader } from "../runtime/evidence/fact-collector.mjs";

const source = (text) => createRegisteredCodexSource({
  source_id: "codex-desktop-1",
  source_ref: "codex-source-opaque-1",
  registration_id: "registration-1",
  required: true,
  task_id: "m15-facts",
  run_id: "run-1",
  session_id: "session-1",
  source_format: "jsonl",
  source_version: "v1",
  cli_version: "codex-desktop-test",
  adapter_version: "m15-adapter-v1",
  reader: createTranscriptSourceReader(() => text),
});

describe("M15 registered Codex transcript adapter", () => {
  it("requires explicit binding and never accepts a raw path as public source ref", () => {
    expect(() => createRegisteredCodexSource({ source_id: "x", source_ref: "/private/session.jsonl" })).toThrow(/source ref/i);
    expect(() => createRegisteredCodexSource({ source_id: "x", source_ref: "opaque", registration_id: "registration-1", task_id: "m15-facts", run_id: "run-1", session_id: "session-1", source_format: "jsonl", source_version: "v1", cli_version: "x", adapter_version: "y" })).toThrow(/required semantic/i);
    expect(() => createRegisteredCodexSource({ ...source(""), reader: () => "" })).toThrow(/capability/i);
    expect(() => createRegisteredCodexSource({ ...source(""), registration_id: "private/session" })).toThrow(/opaque identifier/i);
  });

  it("deduplicates token by message id and tool events by tool_use id", () => {
    const text = [
      JSON.stringify({ id: "m1", type: "message", run_id: "run-1", stage: "build-code", usage: { input_tokens: 2, output_tokens: 3 } }),
      JSON.stringify({ id: "m1", type: "message", run_id: "run-1", stage: "build-code", usage: { input_tokens: 2, output_tokens: 3 } }),
      JSON.stringify({ id: "t1", type: "tool_use", run_id: "run-1", stage: "build-code", tool_use: { id: "tool-1", name: "Read" } }),
      JSON.stringify({ id: "t2", type: "tool_use", run_id: "run-1", stage: "build-code", tool_use: { id: "tool-1", name: "Read" } }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text), { now: () => new Date("2026-08-12T00:00:00.000Z") });
    expect(result.status).toBe("present");
    expect(result.records.filter((item) => item.fact_type === "token")).toHaveLength(1);
    expect(result.records.filter((item) => item.fact_type === "tool_use")).toHaveLength(1);
    expect(result.records.find((item) => item.fact_type === "token").value.total_tokens).toBe(5);
    expect(result.records.find((item) => item.fact_type === "token").value.grain).toBe("message");
    expect(result.records.find((item) => item.fact_type === "tool_use").value.grain).toBe("tool_use");
    expect(result.records[0].value).toMatchObject({ source_id: "codex-desktop-1", registration_id: "registration-1", required: true });
  });

  it("accepts aggregate-only token usage from a registered transcript", () => {
    const result = parseRegisteredCodexTranscript(source(JSON.stringify({ id: "m-total", type: "message", run_id: "run-1", usage: { total_tokens: 7 } })));
    expect(result.status).toBe("present");
    expect(result.records.find((item) => item.fact_type === "token")).toMatchObject({ status: "present", value: { total_tokens: 7 } });
  });

  it("keeps transcript attribution keys on token and tool facts for cost breakdown", () => {
    const text = [
      JSON.stringify({ id: "m-attributed", type: "message", run_id: "run-1", stage: "build-code", step_id: "bc-1", skill_id: "wh-review", subagent_id: "worker-1", usage: { input_tokens: 2, output_tokens: 3 } }),
      JSON.stringify({ id: "t-attributed", type: "tool_use", run_id: "run-1", stage: "build-code", step_id: "bc-1", skill_id: "wh-review", subagent_id: "worker-1", tool_use: { id: "tool-attributed", name: "Read" } }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.records.find((item) => item.fact_type === "token")).toMatchObject({ stage: "build-code", step_id: "bc-1", skill_id: "wh-review", subagent_id: "worker-1" });
    expect(result.records.find((item) => item.fact_type === "tool_use")).toMatchObject({ stage: "build-code", step_id: "bc-1", skill_id: "wh-review", subagent_id: "worker-1" });
  });

  it("marks token and tool duplicates with changed attribution metadata as conflicts", () => {
    const text = [
      JSON.stringify({ id: "m1", type: "message", run_id: "run-1", stage: "build-code", attempt_id: "attempt-a", grain: "message", usage: { input_tokens: 2, output_tokens: 3 } }),
      JSON.stringify({ id: "m1", type: "message", run_id: "run-1", stage: "verify-code", attempt_id: "attempt-a", grain: "session", usage: { input_tokens: 2, output_tokens: 3 } }),
      JSON.stringify({ id: "t1", type: "tool_use", run_id: "run-1", stage: "build-code", attempt_id: "attempt-a", grain: "message", tool_use: { id: "tool-1", name: "Read" } }),
      JSON.stringify({ id: "t2", type: "tool_use", run_id: "run-1", stage: "verify-code", attempt_id: "attempt-a", grain: "session", tool_use: { id: "tool-1", name: "Read" } }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.status).toBe("partial");
    expect(result.records.filter((item) => item.status === "conflict")).toHaveLength(2);
    expect(result.records.filter((item) => item.fact_type === "token" && item.status === "present")).toHaveLength(1);
    expect(result.records.filter((item) => item.fact_type === "tool_use" && item.status === "present")).toHaveLength(1);
  });

  it("marks duplicate typed events with changed value or attribution as conflicts", () => {
    const text = [
      JSON.stringify({ id: "review-1", type: "review", run_id: "run-1", stage: "build-code", attempt_id: "attempt-a", value: { invoked: true, independent: true, outcome: "recorded" } }),
      JSON.stringify({ id: "review-1", type: "review", run_id: "run-1", stage: "verify-code", attempt_id: "attempt-a", value: { invoked: false, independent: true, outcome: "unavailable" } }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.status).toBe("partial");
    expect(result.records.filter((item) => item.fact_type === "review" && item.status === "present")).toHaveLength(1);
    expect(result.records.filter((item) => item.fact_type === "review" && item.status === "conflict")).toHaveLength(1);
  });

  it("isolates malformed lines and reports duplicate identity conflicts", () => {
    const text = [
      "not-json",
      JSON.stringify({ id: "m1", type: "message", run_id: "run-1", usage: { input_tokens: 1, output_tokens: 1 } }),
      JSON.stringify({ id: "m1", type: "message", run_id: "run-1", usage: { input_tokens: 4, output_tokens: 4 } }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.status).toBe("partial");
    expect(result.records.some((item) => item.reason === "malformed_line")).toBe(true);
    expect(result.records.some((item) => item.status === "conflict")).toBe(true);
  });

  it("keeps missing usage and binding mismatch explicit instead of zero or partial success", () => {
    const missingUsage = parseRegisteredCodexTranscript(source(JSON.stringify({ id: "m-missing", type: "message", run_id: "run-1", usage: {} })));
    expect(missingUsage.status).toBe("partial");
    expect(missingUsage.records.find((item) => item.fact_type === "token")).toMatchObject({ status: "partial", reason: "usage_tokens_unavailable", value: null });
    const fatal = parseRegisteredCodexTranscript(source(JSON.stringify({ id: "m-fatal", type: "message", run_id: "other-run", usage: { input_tokens: 1, output_tokens: 1 } })));
    expect(fatal.status).toBe("fatal");
    expect(fatal.records.some((item) => item.status === "fatal" && item.error === "RUN_ID_MISMATCH")).toBe(true);
  });

  it("rejects records bound to another task or session", () => {
    const result = parseRegisteredCodexTranscript(source(JSON.stringify({ id: "wrong", type: "message", task_id: "other-task", session_id: "other-session", run_id: "run-1", usage: { input_tokens: 1, output_tokens: 1 } })));
    expect(result.status).toBe("fatal");
    expect(result.records.some((item) => item.error === "TASK_ID_MISMATCH")).toBe(true);
    expect(result.records.some((item) => item.fact_type === "token")).toBe(false);
  });

  it("rejects explicitly empty binding fields instead of treating them as absent", () => {
    const result = parseRegisteredCodexTranscript(source(JSON.stringify({ id: "empty-binding", type: "message", task_id: "", run_id: "run-1", session_id: "session-1", usage: { input_tokens: 1, output_tokens: 1 } })));
    expect(result.status).toBe("fatal");
    expect(result.records.some((item) => item.error === "TASK_ID_MISMATCH")).toBe(true);
  });

  it("does not publish empty duration/retry values and deduplicates repeated event ids", () => {
    const text = [
      JSON.stringify({ id: "d1", type: "duration", run_id: "run-1" }),
      JSON.stringify({ id: "d2", type: "duration", run_id: "run-1", duration_ms: 10 }),
      JSON.stringify({ id: "d2", type: "duration", run_id: "run-1", duration_ms: 10 }),
      JSON.stringify({ id: "r1", type: "retry", run_id: "run-1" }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.status).toBe("partial");
    expect(result.records.find((item) => item.fact_id.includes(":d1"))).toMatchObject({ status: "partial", reason: "duration_unavailable", value: null });
    expect(result.records.filter((item) => item.fact_type === "duration" && item.status === "present")).toHaveLength(1);
    expect(result.records.find((item) => item.fact_id.includes(":r1"))).toMatchObject({ status: "partial", reason: "retry_count_unavailable", value: null });
  });

  it("marks duration and retry re-attribution conflicts instead of keeping the first row", () => {
    const text = [
      JSON.stringify({ id: "d-reused", type: "duration", run_id: "run-1", stage: "build-code", skill_id: "skill-a", duration_ms: 10 }),
      JSON.stringify({ id: "d-reused", type: "duration", run_id: "run-1", stage: "verify-code", skill_id: "skill-b", duration_ms: 10 }),
      JSON.stringify({ id: "r-reused", type: "retry", run_id: "run-1", stage: "build-code", skill_id: "skill-a", retry_count: 1 }),
      JSON.stringify({ id: "r-reused", type: "retry", run_id: "run-1", stage: "verify-code", skill_id: "skill-b", retry_count: 1 }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.status).toBe("partial");
    expect(result.records.filter((item) => item.status === "conflict")).toHaveLength(2);
  });

  it("isolates unsupported transcript fields and keeps later legal lines", () => {
    const text = [
      JSON.stringify({ id: "bad-stage", type: "message", run_id: "run-1", stage: "future-stage", usage: { input_tokens: 1, output_tokens: 1 } }),
      JSON.stringify({ id: "good-stage", type: "message", run_id: "run-1", stage: "build-code", usage: { input_tokens: 2, output_tokens: 2 } }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.status).toBe("partial");
    expect(result.records.some((item) => item.reason === "unsupported_record")).toBe(true);
    expect(result.records.some((item) => item.fact_type === "token" && item.value?.message_id === "good-stage")).toBe(true);
  });

  it("accepts explicit typed stage, step, skill, review, and verify events without guessing", () => {
    const text = [
      JSON.stringify({ id: "stage-1", type: "stage", run_id: "run-1", stage: "build-code", value: { outcome: "completed" } }),
      JSON.stringify({ id: "step-1", type: "step", run_id: "run-1", stage: "build-code", step_id: "bc-1", value: { outcome: "completed" } }),
      JSON.stringify({ id: "skill-1", type: "skill", run_id: "run-1", stage: "build-code", skill_id: "wh-review", value: { trigger: true, executed: true, version: "v1" } }),
      JSON.stringify({ id: "review-1", type: "review", run_id: "run-1", stage: "build-code", value: { invoked: true, independent: true, outcome: "recorded", freshness: "current", source_ref: "review-ref" } }),
      JSON.stringify({ id: "verify-1", type: "verify", run_id: "run-1", stage: "build-code", value: { invoked: true, fresh: true, outcome: "passed", source_ref: "verify-ref" } }),
    ].join("\n");
    const result = parseRegisteredCodexTranscript(source(text));
    expect(result.status).toBe("present");
    expect(result.records.filter((item) => ["stage", "step", "skill", "review", "verify"].includes(item.fact_type))).toHaveLength(5);
    expect(result.records.find((item) => item.fact_type === "skill")).toMatchObject({ skill_id: "wh-review", status: "present", value: { trigger: true, executed: true, version: "v1" } });
  });

  it("reports unsupported source versions and non-not-found read errors", () => {
    expect(() => createRegisteredCodexSource({ ...source(""), source_format: "txt" })).toThrow(/unsupported/i);
    const broken = createRegisteredCodexSource({ ...source(""), reader: createTranscriptSourceReader(() => { const error = new Error("permission"); error.code = "EACCES"; throw error; }) });
    expect(parseRegisteredCodexTranscript(broken).status).toBe("unknown");
  });

  it("keeps source unavailable as missing instead of an empty success", () => {
    const unavailable = createRegisteredCodexSource({
      source_id: "codex-desktop-1", source_ref: "codex-source-opaque-1", task_id: "m15-facts", run_id: "run-1", session_id: "session-1",
      source_format: "jsonl", source_version: "v1", cli_version: "x", adapter_version: "y", registration_id: "registration-1", required: true, reader: createTranscriptSourceReader(() => { const error = new Error("gone"); error.code = "ENOENT"; throw error; }),
    });
    const result = parseRegisteredCodexTranscript(unavailable);
    expect(result.status).toBe("missing");
    expect(result.records[0]).toMatchObject({ fact_type: "source_status", status: "missing", reason: "not_found" });
  });
});
