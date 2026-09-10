import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const taskCloseCli = join(repoRoot, "tools/cli/task-close.mjs");
const temporaryRoots = [];

afterEach(() => {
  while (temporaryRoots.length > 0) rmSync(temporaryRoots.pop(), { recursive: true, force: true });
});

describe("task-close CLI task path resolution", () => {
  it("derives the task path from ~/.config/workflowhub/config.json when omitted", () => {
    const home = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-close-cli-")));
    temporaryRoots.push(home);
    const storageRoot = join(home, "Knowledge");
    const configHome = join(home, ".config");
    const repo = join(home, "repo");
    mkdirSync(storageRoot);
    mkdirSync(repo);
    mkdirSync(join(configHome, "workflowhub"), { recursive: true });
    writeFileSync(join(configHome, "workflowhub", "config.json"), `${JSON.stringify({ task_dir: storageRoot })}\n`);
    createTask({
      storageRoot,
      manifest: {
        schema_version: "1.0.0",
        project_name: "workflowhub",
        task_id: "task-close-cli-resolution",
        created_at: "2026-09-10T00:00:00.000Z",
        target_repo_root: repo,
        issue_ids: [],
        inputs: {},
      },
    });

    const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: configHome };
    delete env.WORKFLOWHUB_TASK_DIR;
    const result = spawnSync(process.execPath, [
      taskCloseCli,
      "status",
      "--project=workflowhub",
      "--task=task-close-cli-resolution",
    ], { cwd: repoRoot, env, encoding: "utf8" });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({ status: "not_completed" });
  });
});
