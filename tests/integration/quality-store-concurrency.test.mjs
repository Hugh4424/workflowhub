import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { publishQualityFact } from "../../runtime/evidence/quality-store.mjs";

function taskRoot(projectName = "quality-store", recordModel = undefined) {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-quality-store-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-quality-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const task = createTask({
    storageRoot: storage,
    manifest: { schema_version: "1.0.0", project_name: projectName === "workflowhub" ? "WorkflowHub" : projectName, task_id: "quality-store", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {}, ...(recordModel === undefined ? {} : { record_model: recordModel }) },
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

  it("rejects direct writes to the WorkflowHub vNext quality namespace regardless of storage path", () => {
    const root = taskRoot("workflowhub", "vnext-single-write");
    const indexBefore = readFileSync(join(root, "index.json"), "utf8");
    expect(() => publishQualityFact(root, "tests", value())).toThrow(/stage-runtime|canonical.*writer|current quality/i);
    expect(readFileSync(join(root, "index.json"), "utf8")).toBe(indexBefore);
  });

  it("does not use a directory basename as writer authority", () => {
    const root = taskRoot("workflowhub-in-a-different-directory", "vnext-single-write");
    expect(() => publishQualityFact(root, "tests", value())).not.toThrow();
  });

  it("does not regain direct-writer access after mutable task metadata is changed", () => {
    const root = taskRoot("workflowhub", "vnext-single-write");
    const manifestPath = join(root, "task.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, project_name: "legacy", record_model: "legacy" }, null, 2)}\n`);
    expect(() => publishQualityFact(root, "tests", value())).toThrow(/stage-runtime|canonical.*writer|current quality/i);
  });

  it("rejects a symlink alias of the canonical WorkflowHub task root", () => {
    const root = taskRoot("workflowhub", "vnext-single-write");
    const alias = join(dirname(root), "workflowhub-quality-store-alias");
    symlinkSync(root, alias, "dir");
    try {
      expect(() => publishQualityFact(alias, "tests", value())).toThrow(/stage-runtime|canonical.*writer|current quality/i);
    } finally {
      rmSync(alias, { force: true });
    }
  });

  it("keeps helper skills out of the current-quality writer boundary", () => {
    for (const relative of ["skills/wh-review/scripts/wh-review-cli.mjs", "skills/mini-task/scripts/mini-task-runner.mjs"]) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source, relative).not.toMatch(/kernel\.publishVNextQualityFact|kernel\.publishHumanConfirmation/);
    }
  });
});
