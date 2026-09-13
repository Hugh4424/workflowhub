import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as qualityStore from "../../runtime/evidence/quality-store.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";

function taskRoot(project = "workflowhub", recordModel = "vnext-single-write") {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "verify-publication-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "verify-publication-repo-")));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Verify publication tests"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "verify-publication@workflowhub.local"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "verify publication fixture\n");
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const task = createTask({ storageRoot: storage, manifest: {
    schema_version: "1.0.0", project_name: project, task_id: "verify-publication", created_at: new Date().toISOString(),
    target_repo_root: repo, issue_ids: [], inputs: {}, record_model: recordModel,
  } });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  return { task, storage, repo };
}

describe("retired verify summary boundary", () => {
  it("has no active writer or retired object graph", () => {
    const source = readFileSync(new URL("../../runtime/evidence/quality-store.mjs", import.meta.url), "utf8");
    expect(qualityStore.publishVerifySummary).toBeUndefined();
    expect(source).not.toMatch(/publishVerifySummary|quality\/verify\.json|quality-verify\.v1/);
  });

  it("initializes only the current execution record for a new task", () => {
    const { task, storage, repo } = taskRoot();
    try {
      expect(task.readRecord("facts.jsonl")).toBe("");
      expect(() => task.readRecord("index.json")).toThrow();
    } finally { rmSync(storage, { recursive: true, force: true }); rmSync(repo, { recursive: true, force: true }); }
  });
});
