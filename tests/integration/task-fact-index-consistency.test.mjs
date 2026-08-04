import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { appendTaskFact, initializeTaskStore, readTaskFacts, readTaskIndex } from "../../runtime/task/task-store.mjs";

function root() {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-facts-index-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-facts-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const task = createTask({
    storageRoot: storage,
    manifest: { schema_version: "1.0.0", project_name: "workflowhub", task_id: "facts-index", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  return task.taskPath;
}

const fact = {
  stage: "build-code",
  material_digest: "a".repeat(64),
  source_digest: "b".repeat(64),
  invocation_id: "facts-index-invocation",
  source: "consistency-test",
  status: "passed",
  content_hash: "c".repeat(64),
  output_ref: "quality/tests/facts-index.json",
};

describe("task fact/index consistency", () => {
  it('facts-index:crash-window rolls back a fact when index publication fails', () => {
    const taskRoot = root();
    expect(() => appendTaskFact(taskRoot, fact, {
      indexTestHooks: { beforeIndexRename: () => { throw new Error("INJECTED_INDEX_FAILURE"); } },
    })).toThrow("INJECTED_INDEX_FAILURE");
    expect(readTaskFacts(taskRoot)).toEqual([]);
    expect(readTaskIndex(taskRoot).facts).toEqual([]);
  });
});
