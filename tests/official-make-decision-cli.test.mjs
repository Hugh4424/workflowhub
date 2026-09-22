import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../core/artifact-dir.mjs";
import { createTask } from "../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../runtime/task/workspace.mjs";

const runtime = fileURLToPath(new URL("../tools/cli/stage-runtime.mjs", import.meta.url));
const taskMaterialRoot = fileURLToPath(new URL("../specs/workflowhub-thin-core-card-07-20260919/", import.meta.url));
const roots = [];

function invoke(...args) {
  const candidate = args.at(-1);
  const options = candidate && typeof candidate === "object" && !Array.isArray(candidate) && Object.hasOwn(candidate, "cwd")
    ? args.pop()
    : {};
  return spawnSync(process.execPath, [runtime, ...args], { encoding: "utf8", ...options });
}

function postCliFixture(taskId = "card07-post-cli-journey") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-card07-post-cli-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub CARD07 tests"]);
  git(["config", "user.email", "card07@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "post fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "baseline"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-09-22T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
      activation_cohort: "post",
    },
  });
  initializeTaskStore(task.taskPath, { taskId });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", `# 当前决策

## 任务身份

- **任务类型**：普通任务

## 原始需求

### U-001 — 模糊目标

> 我想让导入更顺一点，但还说不清怎么做。

### U-002 — 痛点

> 用户常常不知道失败后怎么恢复。
`);
  for (const name of ["spec.md", "phases/index.md", "phases/P1.md", "phases/P2.md", "phases/P3.md", "phases/P4.md"]) {
    artifacts.writeAtomic(name, readFileSync(join(taskMaterialRoot, name), "utf8"));
  }
  return { root, task, candidate, artifacts };
}

function cliEnv(root) {
  const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
  for (const key of ["CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH", "CODEX_CLI_VERSION"]) {
    delete env[key];
  }
  return env;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("make-decision public CLI cutover", () => {
  it("exposes high-level behaviors instead of caller-owned journal operations", () => {
    const result = invoke("help");
    expect(result.status, result.stderr).toBe(0);
    const help = JSON.parse(result.stdout);
    expect(help.behaviors).toEqual(expect.arrayContaining([
      "doctor", "status", "run", "review", "confirm", "authorize",
    ]));
    expect(help.behaviors).not.toEqual(expect.arrayContaining([
      "prepare", "record-step-entry", "record-step-exit",
    ]));
  });

  it.each([
    "prepare",
    "record-step-entry",
    "record-step-exit",
    "invoke-stage-skill",
    "publish-content-evidence",
  ])("fails loudly when deleted internal operation %s is invoked", (operation) => {
    const result = invoke(
      operation,
      "--stage=make-decision",
      "--project=Demo",
      "--task=missing",
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/unknown public runtime behavior/i);
  });

  it.each([
    ["doctor", "workspace"],
    ["status", "begin"],
    ["run", "execute"],
    ["review", "risk"],
    ["confirm", "decision"],
    ["authorize", "commit"],
  ])("recognizes public route %s:%s before task lookup", (behavior, action) => {
    const result = invoke(
      behavior,
      `--action=${action}`,
      "--stage=make-decision",
      "--project=Demo",
      "--task=missing",
    );
    expect(`${result.stdout}${result.stderr}`)
      .not.toMatch(/unknown public runtime behavior|unknown public runtime action/i);
  });

  it("CARD07 post journey: runs the official CLI from a fuzzy intake on the post material set", () => {
    const state = postCliFixture();
    const result = invoke(
      "run",
      "--action=execute",
      "--stage=make-decision",
      "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`,
      { cwd: state.candidate.worktreeRoot, env: cliEnv(state.root) },
    );

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output).toMatchObject({
      stage: "make-decision",
      quality_status: "incomplete",
    });
    const handoff = state.task.readRecord(output.stage_handoff.ref);
    expect(handoff).toContain("U-001");
  });

  it("CARD07 post journey: refuses an indexed Phase gap instead of falling back to plan/tasks", () => {
    const state = postCliFixture("card07-post-cli-missing-phase");
    rmSync(state.artifacts.path("phases/P4.md"));
    const result = invoke(
      "status",
      "--action=begin",
      "--stage=make-decision",
      "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`,
      { cwd: state.candidate.worktreeRoot, env: cliEnv(state.root) },
    );

    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/P4\.md|current task material missing|material/i);
  });
});
