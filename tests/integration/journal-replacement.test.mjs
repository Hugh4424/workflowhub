import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { appendTaskFact, initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { publishQualityFact } from "../../runtime/evidence/quality-store.mjs";

function task() {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-journal-replacement-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-journal-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const value = createTask({ storageRoot: storage, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "journal-replacement",
    created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  initializeTaskStore(value.taskPath, { taskId: value.identity.taskId });
  return value;
}

describe("journal replacement", () => {
  it("replacement:journal records facts without a transition journal", () => {
    const value = task();
    appendTaskFact(value.taskPath, {
      stage: "build-code", material_digest: "a".repeat(64), source_digest: "b".repeat(64),
      invocation_id: "journal-replacement", source: "replacement-test", status: "passed",
      content_hash: "c".repeat(64), output_ref: "quality/tests/journal.json",
    });
    publishQualityFact(value.taskPath, "tests", {
      task_id: value.identity.taskId, stage: "build-code", status: "passed", source: "replacement-test",
      schema_version: "test-fact.v1", content_hash: "d".repeat(64),
    });
    expect(existsSync(join(value.taskPath, "journal.jsonl"))).toBe(false);
    expect(existsSync(join(value.taskPath, "results"))).toBe(false);
  });
});
