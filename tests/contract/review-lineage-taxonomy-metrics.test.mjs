import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { classificationSummary, aggregateReviewMetrics, classifyAttemptTaxonomy } from "../../skills/wh-review/scripts/review-result.mjs";
import { runReviewFixture } from "../../skills/wh-review/scripts/review-runner.mjs";
import { validateSchema } from "../../skills/wh-review/scripts/schema-validator.mjs";

const materialId = createHash("sha256").update("g7-material").digest("hex");
const source = {
  targetCommit: "1".repeat(40),
  baseCommit: "2".repeat(40),
  baseTree: "3".repeat(40),
  capturedHead: "4".repeat(40),
  snapshotTree: "5".repeat(40),
};
const pass = JSON.stringify({ verdict: "pass", summary: "fixture", findings: [] });
const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-lineage-")));
  roots.push(root);
  const attachmentRoot = join(root, "attachments");
  mkdirSync(attachmentRoot);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "review-lineage",
      created_at: "2026-08-06T00:00:00.000Z",
      target_repo_root: join(root, "repo"),
      issue_ids: [],
      inputs: {},
    },
  });
  return { task, attachmentRoot };
}

function providerClient() {
  return {
    run: async () => ({
      runtimeId: "runtime-1",
      provider: {
        provider: "fixture/provider",
        status: "completed",
        session_id: "session-1",
        output: pass,
        error: null,
        execution: {
          adapter: "fixture",
          model: "provider",
          effort: null,
          thinking: null,
          timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
          usage: null,
          retry: { count: 0, progress_events: 0 },
          runtime_id: "runtime-1",
        },
      },
    }),
  };
}

describe("review lineage, failure taxonomy, and metrics", () => {
  it("writes one replayable lineage object to new attempt and result records", async () => {
    const { task, attachmentRoot } = fixture();
    const run = await runReviewFixture({
      task,
      attachmentRoot,
      taskId: "review-lineage",
      stage: "build-code",
      materials: {},
      hostProvider: "host/provider",
      providers: ["fixture/provider"],
      providerClient: providerClient(),
      captureSource: () => source,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    const attempt = JSON.parse(task.readRecord(run.attemptRef));
    const result = JSON.parse(task.readRecord(run.resultRef));
    expect(attempt.lineage).toMatchObject({
      request_id: expect.any(String),
      prompt_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      round: "initial",
      prior_attempt_refs: [],
      prior_runtime_ids: {},
      correction_ref: null,
      dispatch_sequence: 0,
    });
    expect(result.lineage).toEqual(attempt.lineage);
  });

  it("rejects new attempt and result records that omit lineage", async () => {
    const { task, attachmentRoot } = fixture();
    const run = await runReviewFixture({
      task,
      attachmentRoot,
      taskId: "review-lineage",
      stage: "build-code",
      materials: {},
      hostProvider: "host/provider",
      providers: ["fixture/provider"],
      providerClient: providerClient(),
      captureSource: () => source,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    const attempt = JSON.parse(task.readRecord(run.attemptRef));
    const result = JSON.parse(task.readRecord(run.resultRef));
    delete attempt.lineage;
    delete result.lineage;
    expect(() => validateSchema("attempt", attempt)).toThrow();
    expect(() => validateSchema("result", result)).toThrow();
  });

  it("keeps original failure codes while exposing a stable taxonomy", () => {
    const providerAttempt = { provider: "fixture", status: "failed", error: { code: "NEW_BROKER_CODE", message: "raw" } };
    expect(classifyAttemptTaxonomy(providerAttempt)).toEqual({ code: "NEW_BROKER_CODE", category: "unknown" });
    const summary = classificationSummary({ provider_attempts: [
      { provider: "fixture", status: "completed", error: null, execution: { timing: { duration_ms: 3 } } },
      { provider: "fixture", status: "failed", error: { code: "OUTPUT_INVALID", message: "raw" }, execution: { timing: { duration_ms: 5 } } },
    ] });
    expect(summary).toMatchObject({
      provider_attempt_count: 2,
      attempt: { completed: 1, OUTPUT_INVALID: 1 },
      failure_taxonomy: { OUTPUT_INVALID: { code: "OUTPUT_INVALID", category: "output_invalid", count: 1 } },
    });
  });

  it("aggregates every attempt, retry, and correction instead of only the latest provider call", () => {
    const metrics = aggregateReviewMetrics([
      {
        lineage: { correction_ref: null },
        provider_attempts: [{ provider: "fixture", status: "failed", error: { code: "TIMEOUT" }, execution: { timing: { duration_ms: 2 } } }],
      },
      {
        lineage: { correction_ref: "quality/reviews/attempts/prior/attempt.json" },
        provider_attempts: [
          { provider: "fixture", status: "failed", error: { code: "OUTPUT_INVALID" }, execution: { timing: { duration_ms: 3 } } },
          { provider: "fixture", status: "completed", error: null, execution: { timing: { duration_ms: 4 } } },
        ],
      },
    ]);
    expect(metrics).toMatchObject({
      attempt_count: 2,
      provider_attempt_count: 3,
      retry_count: 1,
      correction_count: 1,
      failure_taxonomy: {
        TIMEOUT: { count: 1 },
        OUTPUT_INVALID: { count: 1 },
        completed: { count: 1 },
      },
    });
  });
});
