import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../../../core/task-handle.mjs";
import { writeAttempt, writeSemanticResult } from "../review-result.mjs";

const temporary = [];
function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-writer-")));
  temporary.push(storageRoot);
  return createTask({ storageRoot, taskPath: join(storageRoot, "Projects", "Demo", "tasks", "review-task"), manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "review-task",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: join(storageRoot, "repo"), issue_ids: [], inputs: {},
  } });
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("review writer TaskHandle boundary", () => {
  it("rejects path strings and fake handles", () => {
    expect(() => writeAttempt("/tmp/review.json", {})).toThrow(/TaskHandle|capability/i);
    expect(() => writeAttempt({}, "reviews/a.json", {})).toThrow(/TaskHandle|capability/i);
  });
  it("writes create-only review records through controlled TaskHandle I/O", () => {
    const task = fixture();
    const provenance={task_id:"review-task",stage:"build-code",source:{target_commit:"a".repeat(40)},snapshot_tree:"b".repeat(40),material_id:"material"};
    const attempt={version:"wh-review-attempt.v1",...provenance};
    const result={version:"wh-review-result.v1",...provenance};
    writeAttempt(task, "reviews/attempts/a/attempt.json", attempt);
    writeSemanticResult(task, "reviews/results/a.json", result);
    expect(JSON.parse(task.readRecord("reviews/attempts/a/attempt.json"))).toEqual(attempt);
    expect(() => writeSemanticResult(task, "reviews/results/a.json", result)).toThrow(/exist|create-only/i);
  });
});
