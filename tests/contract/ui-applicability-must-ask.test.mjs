import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";
import { readUiApplicabilityFromDecisionLog } from "../../runtime/stage/stage-content-contracts.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-ui-applicability-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub UI contract"]);
  git(repo, ["config", "user.email", "ui-contract@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    taskPath: join(storage, "Projects", "Demo", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-08-30T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  return {
    task,
    artifacts,
    candidateWorkspace,
    kernel,
    context: {
      stage: "make-decision",
      task,
      kernel,
      identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("make-decision"),
      manifest: task.manifest,
      candidateWorkspace,
      artifacts,
    },
  };
}

function decisionLog(uiApplicability) {
  return `# 当前决策

## 原始需求
| 需求 | 维度 | 决定 | 状态 |
| --- | --- | --- | --- |
| R-001 | goal | D-001 | covered |
| R-002 | flow_or_surface | D-001 | covered |
| R-003 | data_or_state | D-001 | covered |
| R-004 | success_failure_acceptance | D-001 | covered |
| R-005 | constraint_non_goal_defer | D-001 | covered |

## 核心需求
把当前任务的交付边界写清楚。

## 核心目标
用户确认目标已经达成且可执行。

## 范围
只处理当前用户流程和功能边界。

## 非目标
不扩大到其他项目。

## 验收标准
结果可验证，明确通过、失败和边界条件。

## 已选方向
选择最小可执行方案。

## 风险与延期交接
风险已记录，延期项交给后续任务。
${uiApplicability === undefined ? "" : `
## UI applicability
\`\`\`json
${JSON.stringify(uiApplicability, null, 2)}
\`\`\`
`}`;
}

async function runMakeDecision(taskId, applicability) {
  const state = fixture(taskId);
  state.artifacts.writeAtomic("decision-log.md", decisionLog(applicability));
  const snapshot = state.candidateWorkspace.captureSnapshot();
  const direction = writeFormalReviewFixture({
    task: state.task,
    stage: "make-decision",
    snapshotTree: snapshot.tree,
    reviewTrack: "direction",
  });
  const detail = writeFormalReviewFixture({
    task: state.task,
    stage: "make-decision",
    snapshotTree: snapshot.tree,
    reviewTrack: "detail",
  });
  const outcome = writeStageOutcomeFixture({
    task: state.task,
    kernel: state.kernel,
    artifacts: state.artifacts,
    candidateWorkspace: state.candidateWorkspace,
    stage: "make-decision",
    attemptId: `${taskId}-attempt`,
    skipAnalyzerValidation: true,
  });
  const result = await runOfficialStage("make-decision", state.context, {
    receipts: {
      direction_review: direction.resultRef,
      detail_review: detail.resultRef,
      stage_outcomes: outcome.ref,
    },
  });
  const uiFact = result.quality_fact_refs
    .map((ref) => JSON.parse(state.task.readRecord(ref)))
    .find((fact) => fact.subject === "ui_applicability");
  return { result, uiFact };
}

const uiSources = {
  raw_requirement: { conclusion: "ui", reason: "用户要求编辑设置页面" },
  project_inventory: { conclusion: "ui", reason: "已有 /settings 路由" },
  planned_or_changed_frontend_fact: { conclusion: "ui", reason: "计划修改 SettingsForm" },
};

describe("make-decision UI applicability must ask", () => {
  it("records UI and non-UI conclusions, but keeps missing, unknown, and conflicting evidence incomplete", async () => {
    const ui = await runMakeDecision("ui-conclusion", { result: "ui", sources: uiSources });
    expect(ui.uiFact).toMatchObject({ status: "passed", subject: "ui_applicability" });
    expect(ui.result.completion.missing).not.toContain("ui_applicability");

    const nonUi = await runMakeDecision("non-ui-conclusion", {
      result: "non_ui",
      sources: {
        raw_requirement: { conclusion: "non_ui", reason: "只改任务存储" },
        project_inventory: { conclusion: "non_ui", reason: "没有页面或前端 consumer" },
        planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "只改 Node 校验" },
      },
    });
    expect(nonUi.uiFact).toMatchObject({ status: "passed", subject: "ui_applicability" });

    const missing = await runMakeDecision("missing-ui-conclusion");
    expect(missing.uiFact).toMatchObject({ status: "missing", subject: "ui_applicability" });
    expect(missing.result.completion.missing).toContain("ui_applicability");
    expect(missing.result.missing_items.join("; ")).toMatch(/ui applicability/i);

    const unknown = await runMakeDecision("unknown-ui-conclusion", {
      result: "unknown",
      sources: {
        raw_requirement: { status: "unknown", reason: "原始需求没有说明页面" },
        project_inventory: { status: "unknown", reason: "项目清单还未冻结" },
        planned_or_changed_frontend_fact: { status: "unknown", reason: "计划还未说明前端影响" },
      },
      source_reasons: ["三项输入都没有可验证结论"],
      handoff: "make-decision 必须向用户提问",
      user_question: "这项任务是否会改动页面、交互或前端组件？",
    });
    expect(unknown.uiFact).toMatchObject({ status: "missing", subject: "ui_applicability" });
    expect(unknown.result.completion.missing).toContain("ui_applicability");
    expect(unknown.result.missing_items.join("; ")).toMatch(/用户|user|question/i);

    const conflict = await runMakeDecision("conflict-ui-conclusion", {
      result: "unknown",
      sources: {
        raw_requirement: { conclusion: "ui", reason: "用户提到设置页面" },
        project_inventory: { conclusion: "non_ui", reason: "旧清单认为没有前端" },
        planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "计划遗漏组件改动" },
      },
      source_reasons: ["原始需求和项目清单相互冲突"],
      handoff: "make-decision 必须向用户提问",
      user_question: "请确认是否包含设置页面改动。",
    });
    expect(conflict.uiFact).toMatchObject({ status: "missing", subject: "ui_applicability" });
    expect(conflict.result.completion.missing).toContain("ui_applicability");
  });

  it("uses the latest append-only applicability fact and tells a missing record to ask the user", () => {
    const latest = {
      result: "non_ui",
      sources: {
        raw_requirement: { conclusion: "non_ui", reason: "实际范围只改任务存储" },
        project_inventory: { conclusion: "non_ui", reason: "没有页面 consumer" },
        planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "没有前端改动" },
      },
    };
    const appended = readUiApplicabilityFromDecisionLog(`${decisionLog({ result: "ui", sources: uiSources })}
## UI applicability
\`\`\`json
${JSON.stringify(latest, null, 2)}
\`\`\`
`);
    expect(appended).toMatchObject({ status: "recorded", applicability: "non_ui" });

    const missing = readUiApplicabilityFromDecisionLog("# 当前决策\n");
    expect(missing.status).toBe("missing");
    expect(missing.missing_items.join("; ")).toMatch(/ask the user|问用户/i);
  });

  it("rejects multiple applicability JSON facts in one section instead of consuming the first", () => {
    const first = { result: "non_ui", sources: {
      raw_requirement: { conclusion: "non_ui", reason: "只改任务存储" },
      project_inventory: { conclusion: "non_ui", reason: "没有页面 consumer" },
      planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "没有前端改动" },
    } };
    const second = { ...first, result: "ui", sources: {
      raw_requirement: { conclusion: "ui", reason: "用户要求页面" },
      project_inventory: { conclusion: "ui", reason: "存在页面" },
      planned_or_changed_frontend_fact: { conclusion: "ui", reason: "计划改组件" },
    } };
    const markdown = `# 当前决策\n\n## UI applicability\n\`\`\`json\n${JSON.stringify(first)}\n\`\`\`\n\n\`\`\`json\n${JSON.stringify(second)}\n\`\`\``;
    const result = readUiApplicabilityFromDecisionLog(markdown);
    expect(result.status).toBe("missing");
    expect(result.errors.join("; ")).toMatch(/exactly one JSON fact|one JSON fact/i);
  });
});
