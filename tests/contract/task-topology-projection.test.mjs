import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  TASK_TYPES,
  TOPOLOGY_PROJECTIONS,
  assertNoTaskTypeArguments,
  classifyTaskTypeAttempt,
  inspectTaskType,
  resolveTopology,
  validateStageForTopology,
} from "../../runtime/task/task-topology.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { resolveTaskTopologyRoute, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";

const decisionLog = (value) => `# 决策日志\n\n## 任务身份\n\n- **任务类型**：${value}\n`;
const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function routeFixture(taskType) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-topology-route-")));
  roots.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "worktree");
  const taskId = `topology-${taskType === "规划任务" ? "planning" : "ordinary"}`;
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
  git(repo, ["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktree, "main"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-09-20T00:00:00.000Z",
      target_repo_root: repo,
      workspace_mode: "existing",
      workspace_root: worktree,
      issue_ids: [],
      inputs: {},
    },
  });
  const artifacts = join(worktree, "specs", taskId);
  mkdirSync(artifacts, { recursive: true });
  writeFileSync(join(artifacts, "decision-log.md"), taskType === null ? "## 任务身份\n" : decisionLog(taskType));
  return { root, repo, task, worktree, identity: { project: "workflowhub", task: taskId, taskPath: task.taskPath } };
}

async function withRuntimeEnvironment(state, action) {
  const previous = Object.fromEntries([
    "HOME",
    "WORKFLOWHUB_TASK_DIR",
    "WORKFLOWHUB_CUTOVER_EPOCH",
    "CODEX_SESSION_ID",
    "CODEX_THREAD_ID",
    "CODEX_ROLLOUT_PATH",
    "WORKFLOWHUB_CODEX_ROLLOUT_PATH",
  ].map((key) => [key, process.env[key]]));
  const home = join(state.root, "home");
  mkdirSync(home, { recursive: true });
  process.env.HOME = home;
  process.env.WORKFLOWHUB_TASK_DIR = state.root;
  delete process.env.WORKFLOWHUB_CUTOVER_EPOCH;
  delete process.env.CODEX_SESSION_ID;
  delete process.env.CODEX_THREAD_ID;
  delete process.env.CODEX_ROLLOUT_PATH;
  delete process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function portableBuildPrdInput(state) {
  const manifestRaw = readFileSync("workflows/build-prd/steps.json", "utf8");
  const manifest = JSON.parse(manifestRaw);
  const workflowRoot = join(state.worktree, "workflows", "build-prd");
  mkdirSync(workflowRoot, { recursive: true });
  writeFileSync(join(workflowRoot, "steps.json"), manifestRaw);
  const stepResults = manifest.steps.map((step) => ({
    task_id: state.identity.task,
    workflow: "build-prd",
    step_id: step.step_id,
    step_slug: step.step_slug,
    status: "completed",
  }));
  const evidenceRaw = `${JSON.stringify({
    task_id: state.identity.task,
    workflow: "build-prd",
    step_results: stepResults.map(({ step_id, step_slug, status }) => ({ step_id, step_slug, status })),
  }, null, 2)}\n`;
  const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
  const evidenceRef = `quality/evidence/portable-workflow-outcomes/build-prd/${evidenceHash}.json`;
  state.task.createRecordAtomic(evidenceRef, evidenceRaw);
  const input = {
    task_id: state.identity.task,
    workflow: "build-prd",
    step_results: stepResults.map((step) => ({ ...step, result_ref: evidenceRef })),
  };
  const inputPath = join(state.root, "build-prd-input.json");
  writeFileSync(inputPath, `${JSON.stringify(input, null, 2)}\n`);
  return inputPath;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("CARD-01 task type and topology projection", () => {
  it("keeps exactly the two human-controlled task type values", () => {
    expect(TASK_TYPES).toEqual(["规划任务", "普通任务"]);
    expect(Object.isFrozen(TASK_TYPES)).toBe(true);
  });

  it.each([
    ["规划任务", "规划任务"],
    ["普通任务", "普通任务"],
  ])("reads one valid declaration: %s", (value, expected) => {
    expect(inspectTaskType(decisionLog(value))).toMatchObject({
      status: "known",
      task_type: expected,
    });
  });

  it.each([
    ["missing", "# 决策日志\n\n## 任务身份\n"],
    ["duplicate", `${decisionLog("规划任务")}\n- **任务类型**：规划任务\n`],
    ["conflict", `${decisionLog("规划任务")}\n- **任务类型**：普通任务\n`],
    ["illegal_value", decisionLog("自动分流")],
  ])("returns unknown and classifies %s malformed declarations", (kind, source) => {
    expect(inspectTaskType(source)).toMatchObject({ status: "unknown", task_type: null });
    expect(classifyTaskTypeAttempt(source)).toBe(kind);
  });

  it("uses the same declaration normalization for table and bullet syntax", () => {
    const table = "## 任务身份\n\n| 任务类型 | **规划任务** |\n";
    expect(inspectTaskType(table)).toMatchObject({ status: "known", task_type: "规划任务" });
    expect(classifyTaskTypeAttempt(table)).toBeNull();
  });

  it("does not read a task type from a later no-space markdown section", () => {
    const source = "##任务身份\n\n##备注\n\n- **任务类型**：规划任务\n";
    expect(classifyTaskTypeAttempt(source)).toBe("missing");
  });

  it("does not treat a no-space pseudo-heading as a human-declared task identity", () => {
    const source = "##任务身份\n\n- **任务类型**：规划任务\n";
    expect(inspectTaskType(source)).toMatchObject({ status: "unknown", observed_kind: "missing" });
  });

  it("projects the frozen planning and ordinary topologies without dynamic splicing", () => {
    expect(resolveTopology({ task_type: "规划任务", activation_cohort: "pre" }))
      .toEqual(["make-decision", "build-prd"]);
    expect(resolveTopology({ task_type: "规划任务", activation_cohort: "post" }))
      .toEqual(["make-decision", "build-prd"]);
    expect(resolveTopology({ task_type: "普通任务", activation_cohort: "post" }))
      .toEqual(["make-decision", "build-plan", "build-code", "verify-code"]);
    expect(resolveTopology({ task_type: "普通任务", activation_cohort: "pre" }))
      .toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
    expect(TOPOLOGY_PROJECTIONS["普通任务"]).toBeDefined();
  });

  it("fails closed for unknown types and stages outside the selected projection", () => {
    expect(() => resolveTopology({ task_type: "unknown", activation_cohort: "pre" }))
      .toThrow(/task type|unknown/i);
    expect(validateStageForTopology({ task_type: "普通任务", activation_cohort: "post", stage: "build-prd" }))
      .toMatchObject({ ok: false, expected: ["make-decision", "build-plan", "build-code", "verify-code"] });
    expect(validateStageForTopology({ task_type: "规划任务", activation_cohort: "pre", stage: "build-prd" }))
      .toMatchObject({ ok: true });
  });

  it("rejects entry type parameters and defaults instead of treating them as a declaration", () => {
    expect(() => assertNoTaskTypeArguments({ type: "规划任务" })).toThrow(/does not accept/i);
    expect(() => assertNoTaskTypeArguments({ "default-type": "普通任务" })).toThrow(/does not accept/i);
    expect(() => assertNoTaskTypeArguments({ task: "task-01" })).not.toThrow();
  });

  it("keeps the formal five-stage list separate from the portable build-prd topology", () => {
    const manifest = readFileSync("runtime/stage/step-manifest.mjs", "utf8");
    expect(manifest).toMatch(/make-decision.*build-spec.*build-plan.*build-code.*verify-code/s);
    expect(manifest).not.toMatch(/CANONICAL_STAGE_SLUGS\s*=.*build-prd/s);
  });

  it("authenticates a planning portable route and rejects an ordinary portable request", () => {
    const planning = routeFixture("规划任务");
    expect(resolveTaskTopologyRoute({ identity: planning.identity, stage: "build-prd" }))
      .toMatchObject({ task_type: "规划任务", activation_cohort: "pre", topology: ["make-decision", "build-prd"] });

    const ordinary = routeFixture("普通任务");
    expect(() => resolveTaskTopologyRoute({ identity: ordinary.identity, stage: "build-prd" }))
      .toThrow(/不在任务类型.*拓扑/i);
  });

  it("drives planning build-prd status, doctor, and run through the public CLI entry", async () => {
    const planning = routeFixture("规划任务");
    const inputPath = portableBuildPrdInput(planning);
    await withRuntimeEnvironment(planning, async () => {
      const base = ["--stage=build-prd", "--project=workflowhub", `--task=${planning.identity.task}`];
      const statusBefore = await stageRuntimeMain(["status", ...base], { cwd: planning.worktree });
      expect(statusBefore).toMatchObject({ work_status: "not-started", workflow: "build-prd" });

      const doctor = await stageRuntimeMain(["doctor", ...base], { cwd: planning.worktree });
      expect(doctor).toMatchObject({ stage: "build-prd", task_id: planning.identity.task, worktree_root: planning.worktree });

      const run = await stageRuntimeMain(["run", ...base, `--input=${inputPath}`, "--now=2026-09-21T00:00:00.000Z"], { cwd: planning.worktree });
      expect(run).toMatchObject({ status: "succeeded", stage: "build-prd", task_type: "规划任务", terminal: { started_at: "2026-09-21T00:00:00.000Z" } });

      const statusAfter = await stageRuntimeMain(["status", ...base], { cwd: planning.worktree });
      expect(statusAfter).toMatchObject({ work_status: "succeeded", portable_workflow: { state: "succeeded" } });
    });
  });

  it("makes the authenticated ordinary cohort route visible in public status", async () => {
    const ordinary = routeFixture("普通任务");
    await withRuntimeEnvironment(ordinary, async () => {
      const status = await stageRuntimeMain([
        "status", "--stage=build-spec", "--project=workflowhub", `--task=${ordinary.identity.task}`,
      ], { cwd: ordinary.worktree });
      expect(status).toMatchObject({
        task_type: "普通任务",
        activation_cohort: "pre",
        topology: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"],
      });
    });
  });

  it("leaves parent and sibling fixture bytes untouched while a planning journey runs", async () => {
    const planning = routeFixture("规划任务");
    const parent = join(planning.root, "parent-prd.md");
    const sibling = join(planning.root, "sibling-card.md");
    writeFileSync(parent, "parent stays read-only\n");
    writeFileSync(sibling, "sibling stays read-only\n");
    const inputPath = portableBuildPrdInput(planning);
    await withRuntimeEnvironment(planning, () => stageRuntimeMain([
      "run", "--stage=build-prd", "--project=workflowhub", `--task=${planning.identity.task}`, `--input=${inputPath}`,
    ], { cwd: planning.worktree }));
    expect(readFileSync(parent, "utf8")).toBe("parent stays read-only\n");
    expect(readFileSync(sibling, "utf8")).toBe("sibling stays read-only\n");
  });

  it("authenticates public build-prd writes before an unknown type can append an attempt", async () => {
    const unknown = routeFixture(null);
    await withRuntimeEnvironment(unknown, async () => {
      await expect(stageRuntimeMain([
        "run", "--stage=build-prd", "--project=workflowhub", `--task=${unknown.identity.task}`,
      ], { cwd: unknown.repo })).rejects.toThrow(/WRITE_IDENTITY_PREFLIGHT_FAILED/);
    });
    expect(existsSync(join(unknown.task.taskPath, "quality", "evidence", "task-type-attempts"))).toBe(false);
  });

  it("rejects formal run, status, and doctor commands outside the selected topology", async () => {
    const planning = routeFixture("规划任务");
    await withRuntimeEnvironment(planning, async () => {
      const base = ["--stage=build-spec", "--project=workflowhub", `--task=${planning.identity.task}`];
      await expect(stageRuntimeMain(["run", ...base], { cwd: planning.worktree })).rejects.toThrow(/不在任务类型.*拓扑/);
      await expect(stageRuntimeMain(["status", ...base], { cwd: planning.worktree })).rejects.toThrow(/不在任务类型.*拓扑/);
      await expect(stageRuntimeMain(["doctor", ...base], { cwd: planning.worktree })).rejects.toThrow(/不在任务类型.*拓扑/);
    });
  });

  it("does not record a missing-type attempt when decision-log reading fails for another reason", () => {
    const unreadable = routeFixture(null);
    const decisionPath = join(unreadable.worktree, "specs", unreadable.identity.task, "decision-log.md");
    rmSync(decisionPath);
    mkdirSync(decisionPath);
    expect(() => resolveTaskTopologyRoute({ identity: unreadable.identity, stage: "build-prd" }))
      .toThrow(/regular file|directory/i);
    expect(existsSync(join(unreadable.task.taskPath, "quality", "evidence", "task-type-attempts"))).toBe(false);
  });

  it("records an unknown task type attempt without inventing a topology", () => {
    const unknown = routeFixture(null);
    expect(() => resolveTaskTopologyRoute({ identity: unknown.identity, stage: "build-plan" }))
      .toThrow(/任务类型无法识别/);
    const records = readdirSync(join(unknown.task.taskPath, "quality", "evidence", "task-type-attempts"));
    expect(records).toHaveLength(1);
    const attempt = JSON.parse(readFileSync(join(unknown.task.taskPath, "quality", "evidence", "task-type-attempts", records[0]), "utf8"));
    expect(attempt).toMatchObject({ record_kind: "task_type_attempt", task_id: unknown.identity.task, observed_kind: "missing" });
  });
});
