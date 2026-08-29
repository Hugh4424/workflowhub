import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-bootstrap-integrity-")));
  roots.push(root);
  const storage = join(root, "storage");
  const repo = join(root, "workflowhub");
  const home = join(root, "home");
  mkdirSync(storage);
  mkdirSync(repo);
  mkdirSync(home);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
  return { root, storage, repo, home, env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage } };
}

function taskWithManifestOnly(state, taskId) {
  return createTask({
    storageRoot: state.storage,
    manifest: {
      schema_version: "1.0.0",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: new Date().toISOString(),
      target_repo_root: state.repo,
      issue_ids: [],
      inputs: {},
    },
  });
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("official existing task bootstrap integrity", () => {
  it("completes the official task store before returning a manifest-only task", () => {
    const state = fixture();
    const task = taskWithManifestOnly(state, "half-created-task");
    expect(existsSync(join(task.taskPath, "index.json"))).toBe(false);

    const values = { "task-path": task.taskPath, project: "workflowhub", task: "half-created-task" };
    const first = bootstrapTask(values, { env: state.env, home: state.home, cwd: state.repo });
    expect(first).toMatchObject({ task_path: task.taskPath, project: "workflowhub", task: "half-created-task" });
    for (const file of ["facts.jsonl", "index.json", "quality/verify.json"]) {
      expect(existsSync(join(task.taskPath, file)), file).toBe(true);
    }
    for (const directory of ["quality", "quality/reviews", "quality/tests"]) {
      expect(statSync(join(task.taskPath, directory)).isDirectory(), directory).toBe(true);
    }

    const before = Object.fromEntries(["facts.jsonl", "index.json", "quality/verify.json"]
      .map((file) => [file, readFileSync(join(task.taskPath, file), "utf8")]));
    const second = bootstrapTask(values, { env: state.env, home: state.home, cwd: state.repo });
    expect(second.task_path).toBe(first.task_path);
    for (const [file, raw] of Object.entries(before)) {
      expect(readFileSync(join(task.taskPath, file), "utf8"), file).toBe(raw);
    }
  });

  it("fails loudly when an existing task store contains an invalid index", () => {
    const state = fixture();
    const task = taskWithManifestOnly(state, "invalid-existing-store");
    writeFileSync(join(task.taskPath, "index.json"), "{}\n");

    expect(() => bootstrapTask(
      { "task-path": task.taskPath, project: "workflowhub", task: "invalid-existing-store" },
      { env: state.env, home: state.home, cwd: state.repo },
    )).toThrow(/task index identity is invalid/i);
  });
});
