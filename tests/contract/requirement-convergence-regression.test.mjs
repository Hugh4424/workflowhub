import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { writeCanonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";
import {
  deriveDecisionDivergenceOutline,
  analyzeDecisionConvergence,
  validateDecisionLogStepUpdateContract,
  validateInteractionQuestionBatch,
  validateSpecClarifyAndDirectionFidelity,
} from "../../runtime/stage/stage-content-contracts.mjs";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function baseFixture(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p1-red-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub P1"]);
  git(repo, ["config", "user.email", "p1@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const taskPath = join(storage, "Projects", "Demo", "tasks", taskId);
  const task = createTask({
    storageRoot: storage,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-08-28T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  return { root, repo, storage, task, taskPath };
}

function makeDecisionFixture(taskId) {
  const state = baseFixture(taskId);
  const candidate = prepareTaskWorkspace(state.task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, state.task);
  const kernel = createTaskKernel(state.task, { candidateWorkspace: candidate, artifacts });
  const context = {
    stage: "make-decision",
    task: state.task,
    kernel,
    identity: state.task.identity,
    workflowRunId: kernel.deriveStageWorkflowRunId("make-decision"),
    manifest: state.task.manifest,
    candidateWorkspace: candidate,
    artifacts,
  };
  return { ...state, candidate, artifacts, kernel, context };
}

function buildSpecFixture(taskId) {
  const state = baseFixture(taskId);
  const candidate = prepareTaskWorkspace(state.task);
  const workspace = openCurrentTaskWorkspace(state.task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
  const kernel = createTaskKernel(state.task, { workspace, artifacts });
  const context = {
    stage: "build-spec",
    task: state.task,
    kernel,
    identity: state.task.identity,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"),
    manifest: state.task.manifest,
    workspace,
    artifacts,
  };
  return { ...state, candidate, workspace, artifacts, kernel, context };
}

function qualityFacts(result, task) {
  return result.quality_fact_refs.map((ref) => JSON.parse(task.readRecord(ref)));
}

function postHandlerWorker(decisionLog, {
  taskId = "card07-post-handler",
  readEvidence = () => { throw new Error("unexpected evidence ref"); },
} = {}) {
  const snapshotTree = "d".repeat(40);
  const materialRevision = `revision-${"c".repeat(64)}`;
  return {
    stage: "make-decision",
    identity: { taskId },
    manifest: { record_model: "vnext-single-write", activation_cohort: "post" },
    currentMaterialRevision: materialRevision,
    currentMaterialScopeRevision: () => materialRevision,
    snapshotWorkspace: () => ({ tree: snapshotTree }),
    candidateWorkspace: {
      worktreeRoot: "/fixture",
      baselineCommit: snapshotTree,
      captureSnapshot: () => ({ tree: snapshotTree }),
    },
    readArtifact: () => decisionLog,
    artifactRef: () => `specs/${taskId}/decision-log.md`,
    readEvidence,
    recordConsumerInvocation: () => {},
  };
}

function divergenceFixture() {
  const binding = {
    schema_version: "workflowhub-decision-divergence.v1",
    oi_outline_version: "outline-v1",
    intake: {
      raw_requirement: { text: "模糊需求：改善导入流程", attribution: "user_verbatim", source_id: "U-001" },
      pain_point: { text: "用户不知道失败后如何恢复", attribution: "user_verbatim", source_id: "U-002" },
    },
    angles: [
      { angle_id: "A-UX", plain_language_angle: "减少首次理解成本", source: "internal analysis", strength: "medium" },
      { angle_id: "A-RECOVERY", plain_language_angle: "让失败可恢复", source: "research R-01", strength: "high" },
    ],
    original_candidates: [
      { candidate_id: "U-1", text: "增加导入说明", source_id: "U-002", semantic_basis: { problem_axis: "understanding", mechanism: "documentation", target: "new user", outcome: "fewer questions" } },
      { candidate_id: "U-2", text: "增加失败提示", source_id: "U-002", semantic_basis: { problem_axis: "failure", mechanism: "alert", target: "import attempt", outcome: "visible error" } },
    ],
    candidates: [
      { candidate_id: "U-1", text: "增加导入说明", origin: "user", source_ids: ["U-002"], strength: "direct", semantic_basis: { problem_axis: "understanding", mechanism: "documentation", target: "new user", outcome: "fewer questions" } },
      { candidate_id: "U-2", text: "增加失败提示", origin: "user", source_ids: ["U-002"], strength: "direct", semantic_basis: { problem_axis: "failure", mechanism: "alert", target: "import attempt", outcome: "visible error" } },
      { candidate_id: "N-1", text: "保存可恢复导入草稿", origin: "internal", angle_id: "A-RECOVERY", source_ids: ["A-RECOVERY"], novelty_against: ["U-1", "U-2"], changed_dimensions: ["problem_axis", "mechanism", "target", "outcome"], strength: "medium", semantic_basis: { problem_axis: "recovery", mechanism: "draft persistence", target: "failed import", outcome: "resume instead of restart" } },
    ],
    outlines: [
      { outline_version: "r0", status: "abandoned", superseded_by: "r1", hypotheses: [
        { hypothesis_id: "H-01", statement: "说明能消除失败", status: "falsified", falsifier: "用户仍无法恢复", evidence_refs: ["R-01"] },
        { hypothesis_id: "H-02", statement: "提示能支持恢复", status: "falsified", falsifier: "错误后必须重来", evidence_refs: ["R-02"] },
        { hypothesis_id: "H-03", statement: "一次性流程足够", status: "falsified", falsifier: "网络中断会丢失进度", evidence_refs: ["R-03"] },
        { hypothesis_id: "H-04", statement: "用户会理解错误", status: "supported", falsifier: "用户无法解释错误", evidence_refs: ["R-04"] },
        { hypothesis_id: "H-05", statement: "重试成本可接受", status: "unresolved", falsifier: "重试超过两次", evidence_refs: ["R-05"] },
      ] },
      { outline_version: "r1", status: "active", redraw_of: "r0", redraw_reason_ids: ["H-01", "H-02", "H-03"], hypotheses: [
        { hypothesis_id: "H-06", statement: "草稿可恢复", status: "supported", falsifier: "草稿不可重开", evidence_refs: ["R-06"] },
        { hypothesis_id: "H-07", statement: "恢复入口可理解", status: "unresolved", falsifier: "用户找不到恢复入口", evidence_refs: ["R-07"] },
        { hypothesis_id: "H-08", statement: "失败状态可见", status: "supported", falsifier: "错误无状态说明", evidence_refs: ["R-08"] },
      ] },
    ],
  };
  const render = (value) => `# Decision

divergence_required: true

## 发散候选与可证伪大纲

| 角度 ID | 角度 | 来源 | 强度 |
| --- | --- | --- | --- |
| A-UX | 减少首次理解成本 | internal analysis | medium |
| A-RECOVERY | 让失败可恢复 | research R-01 | high |

| 候选 ID | 候选 | origin | source |
| --- | --- | --- | --- |
| U-1 | 增加导入说明 | user | U-002 |
| U-2 | 增加失败提示 | user | U-002 |
| N-1 | 保存可恢复导入草稿 | internal | A-RECOVERY |

| 假设 ID | 大纲版本 | 假设 | 状态 |
| --- | --- | --- | --- |
| H-01 | r0 | 说明能消除失败 | falsified |
| H-02 | r0 | 提示能支持恢复 | falsified |
| H-03 | r0 | 一次性流程足够 | falsified |
| H-04 | r0 | 用户会理解错误 | supported |
| H-05 | r0 | 重试成本可接受 | unresolved |
| H-06 | r1 | 草稿可恢复 | supported |
| H-07 | r1 | 恢复入口可理解 | unresolved |
| H-08 | r1 | 失败状态可见 | supported |

\`\`\`json
${JSON.stringify(value)}
\`\`\`
`;
  return { binding, render };
}

describe("P1 RED requirement-convergence regression", () => {
  describe("make-decision requirement-convergence seam", () => {
    it("marks requirement coverage missing when a disposition is invalid or a required dimension is absent", () => {
      const decisionLog = `# 当前决策

## 原始需求
| 需求 | 维度 | 决定 | 状态 |
| --- | --- | --- | --- |
| 核心目标 | goal | 保持当前范围 | maybe |

## 核心目标
目标已确认并可执行。

## 验收标准
验收结果可验证通过或失败。

## 已选方向
保持当前范围。

## 风险与延期交接
风险已记录。

## 核心需求
解决当前问题。
`;
      const result = analyzeDecisionConvergence(decisionLog, {
        originalRequirement: "必须覆盖目标、流程、状态、验收和边界。",
        requirementMessages: [
          "goal",
          "flow_or_surface",
          "data_or_state",
          "success_failure_acceptance",
          "constraint_non_goal_defer",
        ],
      });

      expect(result.ok).toBe(false);
      expect(result.errors.join("; ")).toMatch(/valid disposition|required dimension/);
      expect(result.facts.requirement_coverage).toBe("missing");

      const titleAndIdsOnly = analyzeDecisionConvergence(`## 原始需求
| 需求 | 维度 | 决定 | 状态 |
| --- | --- | --- | --- |
| R-001 | goal | D-001 | covered |

## 核心需求
R-001

## 核心目标
D-001

## 验收标准
AC-001

## 已选方向
D-001

## 风险与延期交接
RISK-001
`, { requirementMessages: ["goal"] });
      expect(titleAndIdsOnly.facts).toMatchObject({
        goal_achievement: "missing",
        acceptance_clarity: "missing",
        solution_convergence: "missing",
        plain_language_card: "missing",
      });
    });

    it("derives authenticated message classes from hash-bound coverage outputs", () => {
      const decisionLog = `## 原始需求
| 需求 | 摘要 | 决定 | 消息类别 | 状态 |
| --- | --- | --- | --- | --- |
| R-001 | 目标需求 | D-001 | goal | covered |
| R-002 | 流程需求 | D-002 | flow_or_surface | covered |

## 核心需求
R-001 与 R-002。

## 核心目标
目标已确认并可执行。

## 验收标准
验收结果可验证通过或失败，含边界条件。

## 已选方向
保持当前范围。

## 风险与延期交接
风险已记录。
`;
      const messages = [{
        id: "msg-auth-1",
        order: 1,
        content_hash: "a".repeat(64),
      }];
      const outputs = [
        { message_id: "msg-auth-1", message_hash: "a".repeat(64), message_class: "goal", axis_id: "goal", impact: "high", disposition: "represented", decision_ids: ["D-001"], requirement_ids: ["R-001"] },
        { message_id: "msg-auth-1", message_hash: "a".repeat(64), message_class: "flow_or_surface", axis_id: "flow", impact: "high", disposition: "represented", decision_ids: ["D-002"], requirement_ids: ["R-002"] },
      ];
      const bound = analyzeDecisionConvergence(decisionLog, { requirementMessages: messages, requirementCoverageOutputs: outputs });
      expect(bound.errors.filter((error) => /class is missing|required dimension|does not bind authenticated message/.test(error))).toEqual([]);
      expect(bound.facts.requirement_coverage).toBe("passed");

      // Without class-bearing coverage outputs the authenticated message
      // still fails loudly: identity alone is not a semantic classification.
      const unbound = analyzeDecisionConvergence(decisionLog, { requirementMessages: messages, requirementCoverageOutputs: [] });
      expect(unbound.facts.requirement_coverage).toBe("missing");
      expect(unbound.errors.join("; ")).toMatch(/class is missing/);
    });

    it("reports missing requirement coverage, goal achievement, acceptance clarity, solution convergence, and plain-language card", async () => {
      const state = makeDecisionFixture("p1-red-coverage");
      const decisionLog = `# 当前决策

## 原始需求
R-001 需要做一个决策。

## 目标
完成当前任务。

## 范围
范围限于当前任务。

## 非目标
不扩大范围。

## 风险与延期交接
风险已记录。
`;
      state.artifacts.writeAtomic("decision-log.md", decisionLog);
      const snapshot = state.candidate.captureSnapshot();
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
        candidateWorkspace: state.candidate,
        stage: "make-decision",
        attemptId: "p1-red-coverage-attempt",
        skipAnalyzerValidation: true,
      });

      const result = await runOfficialStage("make-decision", state.context, {
        receipts: {
          direction_review: direction.resultRef,
          detail_review: detail.resultRef,
          stage_outcomes: outcome.ref,
        },
      });

      const facts = qualityFacts(result, state.task);
      const subjects = facts.map((fact) => fact.subject);
      expect(subjects).toContain("requirement_coverage");
      expect(subjects).toContain("goal_achievement");
      expect(subjects).toContain("acceptance_clarity");
      expect(subjects).toContain("solution_convergence");
      expect(subjects).toContain("plain_language_card");
    });

    it("requires the real make-decision handler to cover every authenticated message identity and content hash", async () => {
      const state = makeDecisionFixture("p1-red-handler-dimensions");
      state.artifacts.writeAtomic("decision-log.md", `# 当前决策

## 原始需求
| 需求 | 维度 | 决定 | 状态 |
| --- | --- | --- | --- |
| 核心目标 | goal | D-001 | covered |
| 使用流程 | flow_or_surface | D-001 | covered |
| 数据状态 | data_or_state | D-001 | covered |
| 验收边界 | success_failure_acceptance | D-001 | covered |
| 范围边界 | constraint_non_goal_defer | D-001 | covered |

## 核心需求
完整处理用户需求。

## 核心目标
目标已确认并可执行。

## 验收标准
结果可验证通过或失败。

## 已选方向
保持当前范围。

## 范围
只处理当前任务。

## 非目标
不扩大范围。

## 风险与延期交接
风险已记录。
`);
      const snapshot = state.candidate.captureSnapshot();
      const direction = writeFormalReviewFixture({ task: state.task, stage: "make-decision", snapshotTree: snapshot.tree, reviewTrack: "direction" });
      const detail = writeFormalReviewFixture({ task: state.task, stage: "make-decision", snapshotTree: snapshot.tree, reviewTrack: "detail" });
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        candidateWorkspace: state.candidate,
        stage: "make-decision",
        attemptId: "p1-red-handler-dimensions-attempt",
        status: "incomplete",
      });

      const result = await runOfficialStage("make-decision", state.context, {
        receipts: { direction_review: direction.resultRef, detail_review: detail.resultRef, stage_outcomes: outcome.ref },
      });

      const coverageFact = qualityFacts(result, state.task).find((fact) => fact.subject === "requirement_coverage");
      expect(coverageFact).toMatchObject({ status: "missing" });
    });

    it("preserves facts, choices, reasons, deferred handoffs, and execution blockers in the decision-log", async () => {
      const state = makeDecisionFixture("p1-red-preserve");
      const completeDecisionLog = `# 当前决策

## 原始需求
| 需求 | 维度 | 决定 | 状态 |
| --- | --- | --- | --- |
| R-001 需要收敛 | goal | D-001 聚焦当前问题 | covered |
| R-002 覆盖用户旅程 | flow_or_surface | D-001 保持当前范围 | covered |
| R-003 状态可追踪 | data_or_state | D-001 写进决策日志 | covered |
| R-004 验收边界明确 | success_failure_acceptance | D-001 大白话结束卡 | covered |
| R-005 范围不扩大 | constraint_non_goal_defer | D-001 不扩大范围 | covered |

## 核心需求
让人类用户看到当前要解决的核心问题。

## 核心目标
阶段结束时，决定的方向被确认、被记录、可执行。

## 目标
完成当前任务。

## 范围
范围限于当前任务。

## 非目标
不扩大范围。

## 事实
- 原始需求来自用户描述。

## 选择
- D-001：按当前范围收敛。

## 理由
- 当前证据支持聚焦当前问题。

## 延期交接
- 未来端到端对抗演练延期到后续治理任务。

## 执行阻塞
- 无。

## 已选方向
保持当前范围并补齐收敛检查。

## 风险与延期交接
风险已记录。
`;
      state.artifacts.writeAtomic("decision-log.md", completeDecisionLog);
      const snapshot = state.candidate.captureSnapshot();
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
        candidateWorkspace: state.candidate,
        stage: "make-decision",
        attemptId: "p1-red-preserve-attempt",
        skipAnalyzerValidation: true,
      });

      const result = await runOfficialStage("make-decision", state.context, {
        receipts: {
          direction_review: direction.resultRef,
          detail_review: detail.resultRef,
          stage_outcomes: outcome.ref,
        },
      });

      const decisionLog = state.artifacts.read("decision-log.md");
      expect(decisionLog).toMatch(/(?:核心需求|core requirement)/i);
      expect(decisionLog).toMatch(/(?:核心目标|core goal)/i);
      expect(decisionLog).toMatch(/(?:已选方向|selected direction)/i);
      expect(decisionLog).toMatch(/(?:事实|facts)/i);
      expect(decisionLog).toMatch(/(?:选择|choices)/i);
      expect(decisionLog).toMatch(/(?:理由|reasons)/i);
      expect(decisionLog).toMatch(/(?:延期交接|deferred handoffs?)/i);
      expect(decisionLog).toMatch(/(?:执行阻塞|execution blockers?)/i);

      const facts = qualityFacts(result, state.task);
      expect(facts.map((fact) => fact.subject)).toContain("plain_language_card");
    });
  });

  describe("grill upstream round/frontier seam", () => {
    it("expects the grill skill to use the upstream round/frontier contract", () => {
      const skill = readFileSync(join(process.cwd(), "skills", "grill-with-docs", "SKILL.md"), "utf8");
      expect(skill).toMatch(/batch all independent questions/i);
      expect(skill).toMatch(/one axis per question/i);
      expect(skill).toMatch(/defer dependent questions/i);
      expect(skill).toMatch(/wait for real replies/i);
    });

    it("expects make-decision to depend on the grill skill", () => {
      const deps = readFileSync(join(process.cwd(), "workflows", "make-decision", "skill-deps.yaml"), "utf8");
      expect(deps).toMatch(/name:\s*grill-with-docs/);
      expect(deps).toMatch(/path:\s*skills\/grill-with-docs\/SKILL\.md/);
    });
  });

  describe("build-spec Clarify seam", () => {
    it("keeps Clarify missing when material ambiguity says trigger=true without a verified lifecycle receipt", async () => {
      const state = buildSpecFixture("p1-red-clarify-lifecycle");
      writeCanonicalStageMaterials(state.artifacts);
      const spec = state.artifacts.read("spec.md");
      state.artifacts.writeAtomic(
        "spec.md",
        `${spec}\n## Clarify\n当前存在歧义，仍待澄清。\nspec-clarify trigger=true reason=需要用户选择真实方向。\n`,
      );
      const snapshot = state.candidate.captureSnapshot();
      const review = writeFormalReviewFixture({
        task: state.task,
        stage: "build-spec",
        snapshotTree: snapshot.tree,
        reviewTrack: null,
      });
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        workspace: state.workspace,
        stage: "build-spec",
        attemptId: "p1-red-clarify-lifecycle-attempt",
        status: "incomplete",
      });

      const result = await runOfficialStage("build-spec", state.context, {
        receipts: { review: review.resultRef, stage_outcomes: outcome.ref },
      });

      const clarifyFact = qualityFacts(result, state.task).find((fact) => fact.subject === "clarify");
      expect(clarifyFact).toMatchObject({ status: "missing" });
      expect(result.status).not.toBe("completed");
    });

    it("requires explicit direction authorization and handles Chinese ambiguity without word boundaries", () => {
      const genericDecision = `# 当前决定\n\n## 已选方向\n保持当前范围。\n`;
      const invented = validateSpecClarifyAndDirectionFidelity(
        `# Spec\n\n## 新增产品方向\n把项目重命名为完全不同的产品。\n\n## Clarify\nspec-clarify trigger=false reason=没有歧义。\n`,
        genericDecision,
      );
      expect(invented.ok).toBe(false);
      expect(invented.errors.join("; ")).toMatch(/invents product direction/);

      const chineseAmbiguity = validateSpecClarifyAndDirectionFidelity(
        `# Spec\n\n当前存在歧义，仍待澄清。\n\n## Clarify\nspec-clarify trigger=false reason=没有歧义。\n`,
        genericDecision,
      );
      expect(chineseAmbiguity.ok).toBe(false);
      expect(chineseAmbiguity.errors.join("; ")).toMatch(/trigger=true/);
    });

    it("requires an explicit no-ambiguity skip record", () => {
      const missingSkip = validateSpecClarifyAndDirectionFidelity(
        "# Spec\n\n## 当前功能\n保持已经确认的方向。\n",
        "# 当前决定\n\n## 已选方向\n保持当前范围。\n",
      );
      expect(missingSkip.ok).toBe(false);
      expect(missingSkip.errors.join("; ")).toMatch(/trigger=false.*reason/i);

      const explicitSkip = validateSpecClarifyAndDirectionFidelity(
        "# Spec\n\n## 当前功能\n保持已经确认的方向。\n\n## Clarify\nspec-clarify trigger=false reason=没有实质材料歧义 open_direction_changing_questions=0。\n",
        "# 当前决定\n\n## 已选方向\n保持当前范围。\n",
      );
      expect(explicitSkip.ok).toBe(true);
      expect(explicitSkip.clarify).toMatchObject({
        trigger: false,
        open_direction_changing_questions: 0,
      });
    });

    it("records clarifications and refuses to invent product direction", async () => {
      const state = buildSpecFixture("p1-red-clarify");
      writeCanonicalStageMaterials(state.artifacts);
      const spec = state.artifacts.read("spec.md");
      state.artifacts.writeAtomic(
        "spec.md",
        `${spec}\n## 新增产品方向\n我们决定把项目重命名为完全不同的产品，并扩展到原始决策未授权的范围。\n`,
      );
      const snapshot = state.candidate.captureSnapshot();
      const review = writeFormalReviewFixture({
        task: state.task,
        stage: "build-spec",
        snapshotTree: snapshot.tree,
        reviewTrack: null,
      });
      const outcome = writeStageOutcomeFixture({
        task: state.task,
        kernel: state.kernel,
        artifacts: state.artifacts,
        workspace: state.workspace,
        stage: "build-spec",
        attemptId: "p1-red-clarify-attempt",
        skipAnalyzerValidation: true,
      });

      const result = await runOfficialStage("build-spec", state.context, {
        receipts: {
          review: review.resultRef,
          stage_outcomes: outcome.ref,
        },
      });

      expect(result.quality_status).not.toBe("passed");
      expect(result.status).not.toBe("completed");
      expect(result.quality_warnings ?? []).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/clarify|direction-changing ambiguity|product direction|invent/i),
        ]),
      );
      const facts = qualityFacts(result, state.task);
      expect(facts.map((fact) => fact.subject)).toContain("clarify");
    });
  });
});

describe("CARD07 post journey", () => {
  it("CARD07 post journey: official handler records a novel direction and rejects a synonym rewrite", async () => {
    const { binding, render } = divergenceFixture();
    const goodLog = render(binding);
    expect(deriveDecisionDivergenceOutline(goodLog, { outlineVersion: "outline-v1" })).toMatchObject({
      status: "passed",
      novel_candidate_ids: ["N-1"],
    });
    const good = await officialStageHandler("make-decision")(postHandlerWorker(goodLog), { receipts: {} });
    expect(good.facts.divergence_outline).toMatchObject({
      status: "passed",
      novel_candidate_ids: ["N-1"],
      current_outline_version: "r1",
    });

    const rewritten = structuredClone(binding);
    rewritten.candidates[2].semantic_basis = structuredClone(binding.original_candidates[0].semantic_basis);
    const bad = await officialStageHandler("make-decision")(postHandlerWorker(render(rewritten)), { receipts: {} });
    expect(bad.facts.divergence_outline).toMatchObject({
      status: "incomplete",
      errors: expect.arrayContaining(["divergence candidate N-1 only rewrites a user direction"]),
    });
  });

  it("CARD07 post journey: research unavailable preserves the provider error and does not fabricate candidates", async () => {
    const taskId = "card07-post-research-unavailable";
    const report = {
      schema_version: "research-report.v1",
      task_id: taskId,
      stage: "make-decision",
      snapshot_tree: "d".repeat(40),
      material_scope_revision: `revision-${"c".repeat(64)}`,
      status: "unavailable",
      question: "外部研究是否能改变方向？",
      decision_axis: "方向选择",
      tool_usage: [],
      open_items: [{ question_id: "Q-RESEARCH", code: "provider_unavailable", reason: "provider unavailable", next_action: "保留失败事实并继续 Talk" }],
      review: { status: "unavailable", evidence_ref: null },
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
      reason: "provider unavailable",
      error_class: "provider_unavailable",
      pending_questions: ["Q-RESEARCH"],
    };
    const raw = `${JSON.stringify(report)}\n`;
    const ref = `quality/evidence/research/${sha256(raw)}.json`;
    const result = await officialStageHandler("make-decision")(postHandlerWorker("# Decision\n", {
      taskId,
      readEvidence: (candidateRef) => candidateRef === ref ? { bytes: raw, sha256: sha256(raw) } : (() => { throw new Error("unexpected evidence ref"); })(),
    }), { receipts: { research: ref } });

    expect(result.facts.research).toMatchObject({
      research_status: "unavailable",
      research_disclosure: {
        status: "unavailable",
        candidate_delivery: { status: "unavailable", candidates: [] },
      },
    });
    expect(JSON.stringify(result.facts.research)).toContain("provider unavailable");
  });

  it("CARD07 post journey: append-only updates bind one source and reject replacement writers", () => {
    const valid = {
      stage: "make-decision",
      step_id: 3,
      decision_log_ref: "specs/card07/decision-log.md",
      decision_log_hash: sha256("decision-log-v1"),
      writer: { owner: "make-decision", artifact: "decision-log.md", mode: "append-only" },
      coverage_disposition: "current",
      outcome: "用户回复已追加，旧原话保留",
      write_status: "written",
    };
    expect(validateDecisionLogStepUpdateContract(valid)).toMatchObject({ ok: true, facts: { step_ids: [3] } });
    const replacement = validateDecisionLogStepUpdateContract({ ...valid, writer: { ...valid.writer, mode: "replace" } });
    expect(replacement).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.stringMatching(/append-only writer/)]),
    });
  });

  it("CARD07 post journey: zero unresolved questions is legal instead of a fake fixed-round question", () => {
    const result = validateInteractionQuestionBatch([], {
      allowEmpty: true,
      emptyReason: "当前 OI 没有重要、方向变化或真实模糊的未决项",
    });
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });
});
