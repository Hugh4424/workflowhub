import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";

// CARD-04 / P3 / T005 — post 材料检查收窄两侧回归（G-2 豁免解除，D-002 遗留义务）。
// 生产改动（post 下仅 build-code/verify-code 要求全量材料）已随 make-decision
// 落入工作区 tools/cli/stage-runtime.mjs，本文件冻结，实现者只读。
// RED 证据：对 HEAD 版（未收窄）运行本文件，用例①「不抛错」断言失败。
// GREEN 证据：对工作区收窄版运行本文件，四个调用全绿。

const roots = [];
const taskId = "stage-runtime-narrowing";
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" });

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

// 夹具：post cohort 任务，材料含 decision-log.md + phases/index.md + phases/P1.md，
// 唯独缺 spec.md（触发 post 材料守卫的最小缺失集）。
async function setupPostTaskWithoutSpec() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-post-narrowing-")));
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
      created_at: "2026-09-22T00:00:00.000Z", target_repo_root: repo,
      workspace_mode: "existing", workspace_root: worktree, activation_cohort: "post",
      issue_ids: [], inputs: {},
    },
  });
  const materialRoot = join(worktree, "specs", taskId);
  mkdirSync(join(materialRoot, "phases"), { recursive: true });
  writeFileSync(join(materialRoot, "decision-log.md"), "## 任务身份\n\n- **任务类型**：普通任务\n");
  writeFileSync(join(materialRoot, "phases", "index.md"), "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n");
  writeFileSync(join(materialRoot, "phases", "P1.md"), "# Phase P1\n");
  const environmentBefore = Object.fromEntries(
    ["HOME", "XDG_CONFIG_HOME", "WORKFLOWHUB_TASK_DIR"].map((key) => [key, process.env[key]]),
  );
  const home = join(root, "home");
  mkdirSync(home);
  process.env.HOME = home;
  process.env.XDG_CONFIG_HOME = join(home, ".config");
  process.env.WORKFLOWHUB_TASK_DIR = root;
  const restore = () => {
    for (const [key, value] of Object.entries(environmentBefore)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  const runStatus = (stage) => stageRuntimeMain(
    ["status", `--stage=${stage}`, "--project=workflowhub", `--task=${taskId}`, `--task-path=${task.taskPath}`],
    { cwd: worktree },
  );
  return { runStatus, restore, materialRoot };
}

describe("stage-runtime post material check narrowing", () => {
  it.each(["make-decision", "build-plan"])(
    "runs post %s status while spec.md is still absent",
    async (stage) => {
      const { runStatus, restore } = await setupPostTaskWithoutSpec();
      try {
        // 收窄面：make-decision/build-plan 是材料作者，缺 spec.md 不得抛错。
        const status = await runStatus(stage);
        expect(status.identity.task_id).toBe(taskId);
      } finally {
        restore();
      }
    },
  );

  it.each(["build-code", "verify-code"])(
    "still requires the full post material set for %s status",
    async (stage) => {
      const { runStatus, restore } = await setupPostTaskWithoutSpec();
      try {
        // 守卫面：build-code/verify-code 是材料消费者，缺 spec.md 必须抛错。
        await expect(runStatus(stage)).rejects.toThrow(/current task material missing or unreadable/);
      } finally {
        restore();
      }
    },
  );
});


describe("P10/F-c12c732b63f8 actual post material consumer boundaries", () => {
  it.each(["make-decision", "build-plan"])(
    "finishes the real %s status handler with both spec and Phase index absent",
    async (stage) => {
      const { runStatus, restore, materialRoot } = await setupPostTaskWithoutSpec();
      try {
        rmSync(join(materialRoot, "phases", "index.md"));
        const status = await runStatus(stage);
        expect(status.identity.task_id).toBe(taskId);
      } finally { restore(); }
    },
  );

  it.each(["build-code", "verify-code"].flatMap((stage) => [
    { stage, file: "spec.md", state: "blank" },
    { stage, file: "phases/index.md", state: "missing" },
    { stage, file: "phases/index.md", state: "blank" },
  ]))("rejects $state $file at the actual $stage status material loader",
    async ({ stage, file, state }) => {
      const { runStatus, restore, materialRoot } = await setupPostTaskWithoutSpec();
      try {
        // Keep the other required material valid so the named failure is real.
        writeFileSync(join(materialRoot, "spec.md"), "# Authored post specification\n");
        if (state === "missing") rmSync(join(materialRoot, file));
        else writeFileSync(join(materialRoot, file), " \n\t");
        await expect(runStatus(stage)).rejects.toThrow(
          file === "phases/index.md" && state === "blank"
            ? "post Phase index is missing"
            : `current task material missing or unreadable: ${file}`,
        );
      } finally { restore(); }
    },
  );
});
