import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { publishQualityFact } from "../../runtime/evidence/quality-store.mjs";

function taskRoot() {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-quality-store-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-quality-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const task = createTask({
    storageRoot: storage,
    manifest: { schema_version: "1.0.0", project_name: "workflowhub", task_id: "quality-store", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  return task.taskPath;
}

function value(status = "passed") {
  return { task_id: "quality-store", stage: "build-code", status, source: "quality-store-test", schema_version: "test-fact.v1", content_hash: "d".repeat(64) };
}

describe("quality store EEXIST semantics", () => {
  it('quality-store:eexist-conflict treats a same-content link race as idempotent', () => {
    const root = taskRoot();
    const result = publishQualityFact(root, "tests", value(), {
      testHooks: {
        beforeRename: ({ target, raw }) => {
          writeFileSync(target, raw);
        },
      },
    });
    expect(result.idempotent).toBe(true);
  });
});
