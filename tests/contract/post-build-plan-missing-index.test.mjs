import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

const roots = [];
const taskId = "post-plan-missing-index";
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const cliPath = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function taskWithoutPhaseIndex() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-post-plan-index-")));
  roots.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "worktree");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
  git(repo, ["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktree, "main"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
      created_at: "2026-09-27T00:00:00.000Z", target_repo_root: repo,
      workspace_mode: "existing", workspace_root: worktree, activation_cohort: "post",
      issue_ids: [], inputs: {},
    },
  });
  const materialRoot = join(worktree, "specs", taskId);
  mkdirSync(materialRoot, { recursive: true });
  writeFileSync(join(materialRoot, "decision-log.md"), "## 任务身份\n\n- **任务类型**：普通任务\n");
  writeFileSync(join(materialRoot, "spec.md"), "# Current post specification\n");
  const input = join(worktree, "run-input.json");
  writeFileSync(input, "{}\n");
  return { root, worktree, task, input };
}

function runCli(state, action, extra = []) {
  const home = join(state.root, "child-home");
  mkdirSync(home, { recursive: true });
  return spawnSync(process.execPath, [
    cliPath, "run", `--action=${action}`, "--stage=build-plan", "--project=workflowhub",
    `--task=${taskId}`, `--task-path=${state.task.taskPath}`, ...extra,
  ], {
    cwd: state.worktree,
    env: {
      ...process.env,
      HOME: home,
      XDG_CONFIG_HOME: join(home, ".config"),
      WORKFLOWHUB_TASK_DIR: state.root,
    },
    encoding: "utf8",
    timeout: 15000,
  });
}

const phaseIndex = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n";

describe("post build-plan run missing Phase index", () => {
  it("reports the missing authored material through the public run protocol", async () => {
    const state = taskWithoutPhaseIndex();
    const previous = Object.fromEntries(["HOME", "XDG_CONFIG_HOME", "WORKFLOWHUB_TASK_DIR"].map((key) => [key, process.env[key]]));
    const home = join(state.root, "home");
    mkdirSync(home);
    process.env.HOME = home;
    process.env.XDG_CONFIG_HOME = join(home, ".config");
    process.env.WORKFLOWHUB_TASK_DIR = state.root;
    try {
      await expect(stageRuntimeCliMain([
        "run", "--action=execute", "--stage=build-plan", "--project=workflowhub", `--task=${taskId}`,
        `--task-path=${state.task.taskPath}`, `--input=${state.input}`,
      ], { cwd: state.worktree })).rejects.toThrow("current task material missing or unreadable: phases/index.md");
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it("exits with a precise first-line CLI error rather than raw ENOENT", () => {
    const state = taskWithoutPhaseIndex();
    const result = runCli(state, "execute", [`--input=${state.input}`]);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr.split("\n")[0]).toBe("Error: current task material missing or unreadable: phases/index.md");
    expect(result.stderr).not.toMatch(/ENOENT/);
  });

  it("still lets the post build-plan author draft a missing Phase index", () => {
    const state = taskWithoutPhaseIndex();
    const source = join(state.worktree, "draft-index.md");
    writeFileSync(source, phaseIndex);
    const result = runCli(state, "draft", ["--name=phases/index.md", `--input=${source}`]);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).artifact_ref).toContain("phases/index.md");
    expect(existsSync(join(state.worktree, "specs", taskId, "phases", "index.md"))).toBe(true);
  });

  it("passes the material precheck after index and Phase file are present", () => {
    const state = taskWithoutPhaseIndex();
    const phaseRoot = join(state.worktree, "specs", taskId, "phases");
    mkdirSync(phaseRoot);
    writeFileSync(join(phaseRoot, "index.md"), phaseIndex);
    writeFileSync(join(phaseRoot, "P1.md"), "# Phase P1\n");
    const result = runCli(state, "execute", [`--input=${state.input}`]);
    expect(result.error).toBeUndefined();
    // This fixture deliberately lacks an executable plan. Its later contract
    // rejection proves the newly added material precheck admitted it.
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/build-plan minimum executable contract failed/);
    expect(result.stderr).not.toMatch(/current task material missing or unreadable|ENOENT/);
  });
});
