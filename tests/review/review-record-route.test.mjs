import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function makeTask() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "review-record-")));
  roots.push(root);
  return createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
      task_id: randomUUID(),
      created_at: "2026-08-21T00:00:00.000Z",
      target_repo_root: "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-simplicity-close-repair-20260829",
      issue_ids: [],
      inputs: {},
    },
  });
}

function baseResult() {
  return {
    status: "available",
    stage: "build-code",
    review_track: null,
    review_kind: null,
    material_id: "8192849eab3a861772ed1e409e72ff43eae462b16bc6437193483fc905d8260d",
    runtime_id: "runtime-123",
    outcome: "partial",
    provider_results: [
      {
        provider: "codex/luna",
        status: "completed",
        identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "cfg", model: "gpt-5.6-luna" },
        error: null,
        timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
        usage: null,
      },
    ],
    findings: [
      {
        severity: "major",
        path: "materials/06-implementation_summary.md",
        line: 1,
        issue: "implementation material is thin",
        recommendation: "add real code",
        root_cause: "smoke test",
        evidence_kind: "direct",
        evidence: "only summary text",
        provider: "codex/luna",
      },
    ],
  };
}

function contentHash(text) {
  return createHash("sha256").update(text).digest("hex");
}

describe("review record route", () => {
  it("persists an available simple review result", async () => {
    const task = makeTask();
    const result = baseResult();
    const refs = recordSimpleReviewResult({ task, result });
    expect(refs.result_ref).toMatch(/^quality\/reviews\/results\//);
    expect(refs.attempt_ref).toMatch(/^quality\/reviews\/attempts\//);

    const attemptRaw = task.readRecord(refs.attempt_ref);
    const attempt = JSON.parse(attemptRaw);
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("semantic");

    const resultRecord = JSON.parse(task.readRecord(refs.result_ref));
    validateSchema("result", resultRecord);
    expect(resultRecord.findings).toHaveLength(1);
    expect(resultRecord.findings[0].id).toMatch(/^F-[a-f0-9]{12}$/);
    expect(resultRecord.attempt_ref).toBe(refs.attempt_ref);

    const providerOutput = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    expect(providerOutput.schema_version).toBe("wh-review-provider-output.v1");
    expect(providerOutput.content_hash).toBe(contentHash(providerOutput.content));
  });

  it("persists an unavailable simple review result", async () => {
    const task = makeTask();
    const result = {
      status: "unavailable",
      stage: "build-code",
      review_track: null,
      review_kind: null,
      material_id: "8192849eab3a861772ed1e409e72ff43eae462b16bc6437193483fc905d8260d",
      runtime_id: "runtime-456",
      outcome: "partial",
      provider_results: [],
      findings: [],
      error: { code: "ROUTE_UNAVAILABLE", message: "no route" },
    };
    const refs = recordSimpleReviewResult({ task, result });
    expect(refs.attempt_ref).toMatch(/^quality\/reviews\/attempts\//);
    expect(refs.result_ref).toBeNull();

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.error.code).toBe("ROUTE_UNAVAILABLE");
  });

  it("fails loudly on invalid input", async () => {
    const task = makeTask();
    expect(() => recordSimpleReviewResult({ task, result: {} })).toThrow();
    expect(() => recordSimpleReviewResult({ task, result: { status: "available", stage: "build-code" } })).toThrow();
  });
});
