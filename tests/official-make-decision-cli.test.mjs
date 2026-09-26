import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../core/artifact-dir.mjs";
import { createTask } from "../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../runtime/task/workspace.mjs";

const runtime = fileURLToPath(new URL("../tools/cli/stage-runtime.mjs", import.meta.url));
const roots = [];

function invoke(...args) {
  const candidate = args.at(-1);
  const options = candidate && typeof candidate === "object" && !Array.isArray(candidate) && Object.hasOwn(candidate, "cwd")
    ? args.pop()
    : {};
  return spawnSync(process.execPath, [runtime, ...args], { encoding: "utf8", ...options });
}

function cliFixture({ taskId, projectName, prefix, activationCohort } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
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
      project_name: projectName,
      task_id: taskId,
      created_at: "2026-09-22T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
      ...(activationCohort === undefined ? {} : { activation_cohort: activationCohort }),
    },
  });
  initializeTaskStore(task.taskPath, { taskId });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  return { root, repo, task, candidate, artifacts };
}

function postCliFixture(taskId = "card07-post-cli-journey") {
  const { root, task, candidate, artifacts } = cliFixture({
    taskId,
    projectName: "WorkflowHub",
    prefix: "workflowhub-card07-post-cli-",
    activationCohort: "post",
  });
  artifacts.writeAtomic("decision-log.md", `# 当前决策

## 任务身份

- **任务类型**：普通任务

## 原始需求

### U-001 — 模糊目标

> 我想让导入更顺一点，但还说不清怎么做。

### U-002 — 痛点

> 用户常常不知道失败后怎么恢复。
`);
  artifacts.writeAtomic("spec.md", `# Post CLI fixture specification

- **FR-001**：官方 make-decision CLI 接受当前 post cohort 材料。
- [ ] **AC-001 — 当前材料可读**：spec 与 Phase index 指向的 Phase 文件均可读取。

## 实现设计（全局权威）

### Code Anchors

README.md is the fixture-owned implementation anchor.

### Interfaces and Failure Semantics

The fixture supplies a readable post-cohort material set; absent indexed Phase files remain an explicit error.

### Requirement-to-Task Trace

| source | FR | AC | Phase/Task | oracle | evidence |
| --- | --- | --- | --- | --- | --- |
| fixture | FR-001 | AC-001 | P1/T001 | ORACLE-POST-CLI-MATERIALS | \`quality/tests/post-cli-materials.json\` |

### Global Verification Strategy

The official CLI contract tests verify the current material set and indexed-Phase failure path.
`);
  const phases = ["P1", "P2", "P3", "P4"];
  const indexRows = phases.map((phase, index) => {
    const dependency = index === 0 ? "none" : `\`P${index}\``;
    return `| \`${phase}\` | \`phases/${phase}.md\` | \`phase-${phase.toLowerCase()}\` | \`README.md\` | ${dependency} | build-code |`;
  });
  artifacts.writeAtomic("phases/index.md", `# Phase index

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
${indexRows.join("\n")}
`);
  for (const [index, phase] of phases.entries()) {
    const dependency = index === 0 ? "none" : `\`P${index}\``;
    const taskNumber = String(index + 1).padStart(3, "0");
    const nextTaskNumber = String(index + 5).padStart(3, "0");
    artifacts.writeAtomic(`phases/${phase}.md`, `# Phase ${phase} — CLI fixture

- **Global spec**：\`spec.md\`
- **Write set**：\`README.md\`
- **Dependency**：${dependency}
- **Consumer**：build-code

## L0 — Outcome

Provide a self-contained indexed Phase material for the official CLI fixture.

## L1 — Contract

- **Tasks**：\`T${taskNumber} RED\` → \`T${nextTaskNumber} GREEN\`
- **gate_cmd**：\`node --version\`
- **oracle**：ORACLE-POST-CLI-${phase}
- **evidence_path**：\`quality/tests/post-cli-${phase}.json\`
- **STOP**：Missing indexed material remains an error.
- **Done**：The official CLI reads the current fixture material set.
- **Deletion proofs**：none.

## L2 — Removable reference

This material belongs only to the temporary CLI fixture.
`);
  }
  return { root, task, candidate, artifacts };
}

function taskFiles(taskPath) {
  const files = {};
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile()) {
        files[relative(taskPath, absolutePath)] = createHash("sha256")
          .update(readFileSync(absolutePath)).digest("hex");
      }
    }
  };
  visit(taskPath);
  return files;
}

function artifactFiles(artifactRoot) {
  const files = {};
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile()) {
        files[relative(artifactRoot, absolutePath)] = createHash("sha256")
          .update(readFileSync(absolutePath)).digest("hex");
      }
    }
  };
  visit(artifactRoot);
  return files;
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

  it("ORACLE-P21-UNKNOWN-ARG: rejects unknown run options before any stage write", () => {
    const state = cliFixture({
      taskId: "card05-p21-unknown-run-arg",
      projectName: "workflowhub",
      prefix: "workflowhub-unknown-run-arg-",
    });
    const before = taskFiles(state.task.taskPath);
    const result = invoke(
      "run",
      "--action=execute",
      "--stage=make-decision",
      "--project=workflowhub",
      `--task=${state.task.identity.taskId}`,
      "--receipts=notaflag",
      { cwd: state.candidate.worktreeRoot, env: cliEnv(state.root) },
    );

    expect.soft(result.status).not.toBe(0);
    expect.soft(`${result.stdout}${result.stderr}`)
      .toMatch(/unknown (?:run )?(?:option|argument).*--receipts|--receipts.*(?:unknown|unsupported)/i);
    expect(taskFiles(state.task.taskPath)).toEqual(before);
  });

  it("ORACLE-P21-DRAFT-UNKNOWN-ARG: rejects unknown draft options before task or artifact writes", () => {
    const state = cliFixture({
      taskId: "card05-p21-unknown-draft-arg",
      projectName: "workflowhub",
      prefix: "workflowhub-unknown-draft-arg-",
    });
    mkdirSync(state.artifacts.root, { recursive: true });
    const beforeTask = taskFiles(state.task.taskPath);
    const beforeArtifacts = artifactFiles(state.artifacts.root);
    const result = invoke(
      "run",
      "--action=draft",
      "--stage=build-plan",
      "--project=workflowhub",
      `--task=${state.task.identity.taskId}`,
      "--name=plan.md",
      `--input=${join(state.candidate.worktreeRoot, "README.md")}`,
      "--receipts=notaflag",
      { cwd: state.candidate.worktreeRoot, env: cliEnv(state.root) },
    );

    expect.soft(result.status).not.toBe(0);
    expect.soft(`${result.stdout}${result.stderr}`)
      .toMatch(/unknown (?:run )?(?:option|argument).*--receipts|--receipts.*(?:unknown|unsupported)/i);
    expect(taskFiles(state.task.taskPath)).toEqual(beforeTask);
    expect(artifactFiles(state.artifacts.root)).toEqual(beforeArtifacts);
  });

  it("ORACLE-P21-DUPLICATE-ACTION: rejects duplicate --action before any task-store write", () => {
    const state = cliFixture({
      taskId: "card05-p21-duplicate-action",
      projectName: "workflowhub",
      prefix: "workflowhub-duplicate-action-",
    });
    const before = taskFiles(state.task.taskPath);
    const result = invoke(
      "run",
      "--action=execute",
      "--action",
      "--stage=make-decision",
      "--project=workflowhub",
      `--task=${state.task.identity.taskId}`,
      { cwd: state.candidate.worktreeRoot, env: cliEnv(state.root) },
    );

    expect.soft(result.status).not.toBe(0);
    expect.soft(`${result.stdout}${result.stderr}`)
      .toMatch(/exactly one[^\n]*--action|duplicate[^\n]*--action|--action[^\n]*(?:exactly one|duplicate)/i);
    expect(taskFiles(state.task.taskPath)).toEqual(before);
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
