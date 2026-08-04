import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, appendTaskFact, readTaskFacts, readTaskIndex } from "../../runtime/task/task-store.mjs";
import { publishQualityFact, publishVerifySummary } from "../../runtime/evidence/quality-store.mjs";

function taskRoot() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-storage-")));
  const targetRepo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-target-")));
  const taskId = "minimal-task";
  const task = createTask({
    storageRoot,
    taskPath: join(storageRoot, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
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
  it("creates only identity, append-only facts, quality, and index", () => {
    const root = taskRoot();

    initializeTaskStore(root, { taskId: "minimal-task" });

    expect(existsSync(join(root, "task.json"))).toBe(true);
    expect(existsSync(join(root, "facts.jsonl"))).toBe(true);
    expect(existsSync(join(root, "quality", "reviews"))).toBe(true);
    expect(existsSync(join(root, "quality", "tests"))).toBe(true);
    expect(existsSync(join(root, "quality", "verify.json"))).toBe(true);
    expect(existsSync(join(root, "index.json"))).toBe(true);
    expect(readdirSync(root).sort()).toEqual(["facts.jsonl", "index.json", "quality", "task.json"]);
  });

  it("appends facts and indexes logical references without lineage fields", () => {
    const root = taskRoot();
    initializeTaskStore(root, { taskId: "minimal-task" });

    const first = appendTaskFact(root, {
      stage: "build-code",
      material_digest: "a".repeat(64),
      source_digest: "b".repeat(64),
      invocation_id: "invocation-1",
      source: "focused-test",
      status: "passed",
      content_hash: "c".repeat(64),
      output_ref: "quality/tests/test-1.json",
    });
    const second = appendTaskFact(root, {
      stage: "build-code",
      material_digest: "a".repeat(64),
      source_digest: "d".repeat(64),
      invocation_id: "invocation-2",
      source: "review",
      status: "unavailable",
      content_hash: "e".repeat(64),
      output_ref: "quality/reviews/review-1.json",
    });

    expect(first.ref).toMatch(/^facts\.jsonl#1$/);
    expect(second.ref).toMatch(/^facts\.jsonl#2$/);
    expect(readTaskFacts(root)).toHaveLength(2);
    const index = readTaskIndex(root);
    expect(index.facts.map(({ ref }) => ref)).toEqual([first.ref, second.ref]);
    expect(JSON.stringify(index)).not.toMatch(/parent|previous|generation|selector|successor|current/);
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
    expect(readTaskIndex(root).quality.reviews).toHaveLength(1);
    expect(readTaskIndex(root).quality.tests).toHaveLength(1);
  });
});
