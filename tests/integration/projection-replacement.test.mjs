import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { appendTaskFact, initializeTaskStore, readTaskIndex } from "../../runtime/task/task-store.mjs";
import { publishQualityFact } from "../../runtime/evidence/quality-store.mjs";

function task() {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-projection-replacement-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-projection-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const value = createTask({ storageRoot: storage, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "projection-replacement",
    created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  initializeTaskStore(value.taskPath, { taskId: value.identity.taskId });
  return value;
}

describe("projection replacement", () => {
  it("replacement:projection exposes fact and quality references without lineage selectors", () => {
    const value = task();
    appendTaskFact(value.taskPath, {
      stage: "build-code", material_digest: "a".repeat(64), source_digest: "b".repeat(64),
      invocation_id: "projection-replacement", source: "replacement-test", status: "passed",
      content_hash: "c".repeat(64), output_ref: "quality/tests/projection.json",
    });
    publishQualityFact(value.taskPath, "tests", {
      task_id: value.identity.taskId, stage: "build-code", status: "passed", source: "replacement-test",
      schema_version: "test-fact.v1", content_hash: "d".repeat(64),
    });
    const index = readTaskIndex(value.taskPath);
    expect(JSON.stringify(index)).not.toMatch(/selector|successor|previous|parent|generation|current/);
    expect(index.facts[0]).toMatchObject({ logical_ref: expect.any(String), content_hash: expect.any(String), external_raw_ref: expect.any(String) });
    expect(JSON.parse(readFileSync(join(value.taskPath, "quality", "verify.json"), "utf8"))).toMatchObject({ schema_version: "quality-verify.v1" });
  });
});
