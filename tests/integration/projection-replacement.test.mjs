import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskFacts, writeStageRow } from "../../runtime/task/task-store.mjs";
import { publishQualityFact } from "../../runtime/evidence/quality-store.mjs";

function task() {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-projection-replacement-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-projection-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const value = createTask({ storageRoot: storage, manifest: {
    schema_version: "1.0.0", project_name: "legacy", task_id: "projection-replacement",
    created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  initializeTaskStore(value.taskPath, { taskId: value.identity.taskId });
  return value;
}

describe("projection replacement", () => {
  it("replacement:projection exposes fact and quality references without lineage selectors", () => {
    const value = task();
    writeStageRow(value.taskPath, {
      record_kind: "stage", stage: "build-code", source: "replacement-test",
      review_origin: "not_run", finding_dispositions: [],
      evidence: { value: [{ command: "true", exit_code: 0, failure_signature: "none" }] },
    });
    publishQualityFact(value.taskPath, "tests", {
      task_id: value.identity.taskId, stage: "build-code", status: "passed", source: "replacement-test",
      schema_version: "test-fact.v1", content_hash: "d".repeat(64),
    });
    // The current row is the projection: no selector, lineage, or index object.
    const rows = readTaskFacts(value.taskPath);
    expect(JSON.stringify(rows)).not.toMatch(/selector|successor|previous|parent|generation/);
    expect(rows[0]).toMatchObject({ record_kind: "stage", stage: "build-code" });
    expect(JSON.parse(readFileSync(join(value.taskPath, "quality", "verify.json"), "utf8"))).toMatchObject({ schema_version: "quality-verify.v1" });
  });
});
