import { describe, expect, it } from "vitest";

import * as contracts from "../../runtime/stage/stage-content-contracts.mjs";

const { analyzeDecisionConvergence } = contracts;

const OUTLINE_HASH = "a".repeat(64);

function outlineLog({
  frameworkRows = null,
  categoryRows = null,
  records = null,
  directionVersion = "v1",
  directionEntries = null,
  interactionAggregate = true,
} = {}) {
  const framework = frameworkRows ?? [
    ["background", "OI-001"], ["problem", "OI-002"], ["goal", "OI-003"],
    ["solution", "OI-004"], ["acceptance", "OI-005"], ["extension", "OI-006"],
  ];
  const categories = categoryRows ?? [
    ["complete_user_flow", "OI-001"], ["page_scope", "OI-002"], ["data_state", "OI-003"],
    ["success_failure_boundary", "OI-004"], ["non_goals", "OI-005"], ["deferred", "OI-006"],
  ];
  const oiRecords = records ?? [
    { oi_id: "OI-001", task_id: "task-1", outline_version: "v1", category: "complete_user_flow", source: "R-001", question: "目标流程的关键入口是什么？", status: "confirmed", selected_disposition: "复用当前入口", evidence: "F-001", acceptance: "入口可达", counterexample: "入口不存在", impact_dimensions: ["goal"], requires_user_decision: true, visible_group_id: "group-goal" },
    { oi_id: "OI-002", task_id: "task-1", outline_version: "v1", category: "page_scope", source: "R-002", question: "页面范围到哪里为止？", status: "confirmed", selected_disposition: "限定当前页面", evidence: "F-002", acceptance: "边界可验证", counterexample: "跨页需求", impact_dimensions: ["ordinary_detail"], requires_user_decision: false },
    { oi_id: "OI-003", task_id: "task-1", outline_version: "v1", category: "data_state", source: "R-003", question: "数据状态如何变化？", status: "confirmed", selected_disposition: "沿用现有状态", evidence: "F-003", acceptance: "状态可观察", counterexample: "状态丢失", impact_dimensions: ["ordinary_detail"], requires_user_decision: false },
    { oi_id: "OI-004", task_id: "task-1", outline_version: "v1", category: "success_failure_boundary", source: "R-004", question: "成功和失败边界是什么？", status: "confirmed", selected_disposition: "保留现有错误边界", evidence: "F-004", acceptance: "边界可验证", counterexample: "错误被吞掉", impact_dimensions: ["ordinary_detail"], requires_user_decision: false },
    { oi_id: "OI-005", task_id: "task-1", outline_version: "v1", category: "non_goals", source: "R-005", question: "哪些内容明确不做？", status: "confirmed", selected_disposition: "不扩展范围", evidence: "F-005", acceptance: "范围不扩张", counterexample: "新增产品方向", impact_dimensions: ["ordinary_detail"], requires_user_decision: false },
    { oi_id: "OI-006", task_id: "task-1", outline_version: "v1", category: "deferred", source: "R-006", question: "哪些内容延期？", status: "confirmed", selected_disposition: "延期到后续任务", evidence: "F-006", acceptance: "触发条件可检查", counterexample: "延期无 owner", impact_dimensions: ["ordinary_detail"], requires_user_decision: false },
  ];
  const rows = (items, header) => [
    header,
    "| --- | --- | --- | --- | --- |",
    ...items.map(([node, ids]) => `| N-${node} | ${node} | ${ids} | false |  |`),
  ].join("\n");
  const categoryTable = [
    "| category | oi_ids | empty | reason |",
    "| --- | --- | --- | --- |",
    ...categories.map(([category, ids]) => `| ${category} | ${ids} | false |  |`),
  ].join("\n");
  const yaml = ["```yaml", "ois:", ...oiRecords.map((record) => [
    `  - oi_id: ${record.oi_id}`,
    `    task_id: ${record.task_id}`,
    `    outline_version: ${record.outline_version}`,
    `    category: ${record.category}`,
    `    source: ${record.source}`,
    `    question: ${record.question}`,
    `    status: ${record.status}`,
    `    selected_disposition: ${record.selected_disposition}`,
    `    evidence: ${record.evidence}`,
    `    acceptance: ${record.acceptance}`,
    `    counterexample: ${record.counterexample}`,
    `    impact_dimensions: [${record.impact_dimensions.join(", ")}]`,
    `    requires_user_decision: ${record.requires_user_decision}`,
    ...(record.visible_group_id ? [`    visible_group_id: ${record.visible_group_id}`] : []),
    // Core-OI proof direction: the aggregate's own oi_dispositions binds the
    // OI, so the record must NOT embed this aggregate's ref/hash.  Embedding
    // it makes decision-log.md's bytes depend on the address of the aggregate
    // that binds those same bytes (no fixed point).  Honour an explicit
    // legacy override so the readability of old records stays covered.
    ...(record.legacy_interaction_ref ? [`    interaction_ref: ${record.legacy_interaction_ref}`, `    interaction_hash: ${record.legacy_interaction_hash}`] : []),
  ].join("\n")), "```"].join("\n");
  const entries = directionEntries ?? oiRecords.map((record) => JSON.stringify({
    oi_id: record.oi_id,
    category: record.category,
    source: record.source,
    question: record.question,
    status: "open",
  }));
  const interaction = interactionAggregate
    ? "{ ref: interaction-1, sha256: " + OUTLINE_HASH + ", value: { task_id: task-1, stage: make-decision } }"
    : "null";
  return {
    markdown: [
      "## 唯一 OI 大纲（current authority）",
      "### Framework nodes",
      rows(framework, "| node_id | framework_node | oi_ids | empty | reason |"),
      "### Fixed categories",
      categoryTable,
      yaml,
    ].join("\n\n"),
    direction: {
      task_id: "task-1",
      outline_version: directionVersion,
      convergence_outline: { entries: entries.map((entry) => typeof entry === "string" ? JSON.parse(entry) : entry) },
    },
    interaction: interactionAggregate ? {
      ref: "interaction-1",
      sha256: OUTLINE_HASH,
      value: {
        task_id: "task-1",
        stage: "make-decision",
        oi_dispositions: [{
          task_id: "task-1",
          outline_version: "v1",
          oi_id: "OI-001",
          visible_group_id: "group-goal",
          selected_disposition: "复用当前入口",
        }],
      },
    } : null,
  };
}

function decisionLog(rows, { convergence = true } = {}) {
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
把当前用户问题处理清楚。

## 核心目标
用户确认目标已达成并可执行。

## 范围
范围覆盖当前页面、流程和功能边界。

## 验收标准
结果可验证，通过或失败都有明确边界。

## 已选方向
选择最小可执行方案。

## 风险与延期交接
风险和延期项已记录。

## UI applicability
\`\`\`json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "conclusion": "non_ui", "reason": "只改任务机制" },
    "project_inventory": { "conclusion": "non_ui", "reason": "无前端 consumer" },
    "planned_or_changed_frontend_fact": { "conclusion": "non_ui", "reason": "没有计划前端改动" }
  }
}
\`\`\`

${convergence ? `## 收敛检查
| 维度 | 用户答案或无新需求 | 事实或材料引用 | 可执行验收标准 |
| --- | --- | --- | --- |
${rows.join("\n")}` : ""}

## 大白话总结卡
用户需求、目标和选定方向已清楚说明。
`;
}

const completeRows = [
  "| 目标 | 用户确认要让设置流程可用 | R-001、D-001 | N/A |",
  "| 范围 | 用户确认只改设置页面、保存流程和失败提示 | R-002、D-001 | N/A |",
  "| 方案 | 用户选择复用现有表单；取舍是不新建第二套状态；被拒方案是重写页面；无未决项 | F-001、D-001 | N/A |",
  "| 验收 | 用户确认要验证保存 | R-004、AC-001 | 场景：编辑后保存；数据来源：现有测试账户；通过：刷新后值保留；失败：错误提示可见 |",
];

describe("make-decision convergence depth", () => {
  it("only accepts a structured four-dimension record with answers, evidence references, and executable acceptance", () => {
    const complete = analyzeDecisionConvergence(decisionLog(completeRows));
    expect(complete.ok).toBe(true);
    expect(complete.facts).toMatchObject({
      goal_achievement: "passed",
      scope: "passed",
      solution_convergence: "passed",
      acceptance_clarity: "passed",
    });
  });

  it("lists the specific missing dimension instead of accepting a shallow matrix", () => {
    const withoutStructuredTable = analyzeDecisionConvergence(decisionLog(completeRows, { convergence: false }));
    expect(withoutStructuredTable.ok).toBe(false);
    expect(withoutStructuredTable.facts).toMatchObject({
      goal_achievement: "missing",
      scope: "missing",
      solution_convergence: "missing",
      acceptance_clarity: "missing",
    });

    const withoutScope = analyzeDecisionConvergence(decisionLog(completeRows.filter((row) => !row.includes("| 范围 |"))));
    expect(withoutScope.ok).toBe(false);
    expect(withoutScope.facts.scope).toBe("missing");
    expect(withoutScope.errors.join("; ")).toMatch(/scope|范围/i);

    const withoutExecutableAcceptance = analyzeDecisionConvergence(decisionLog(completeRows.map((row) => row.startsWith("| 验收")
      ? "| 验收 | 用户确认要验证保存 | R-004、AC-001 | 可验证 |"
      : row)));
    expect(withoutExecutableAcceptance.ok).toBe(false);
    expect(withoutExecutableAcceptance.facts.acceptance_clarity).toBe("missing");
    expect(withoutExecutableAcceptance.errors.join("; ")).toMatch(/acceptance|验收/i);

    const withoutTradeoffs = analyzeDecisionConvergence(decisionLog(completeRows.map((row) => row.startsWith("| 方案")
      ? "| 方案 | 用户选择复用现有表单 | F-001、D-001 | N/A |"
      : row)));
    expect(withoutTradeoffs.ok).toBe(false);
    expect(withoutTradeoffs.facts.solution_convergence).toBe("missing");
    expect(withoutTradeoffs.errors.join("; ")).toMatch(/solution|方案/i);
  });

  it("rejects append-only stale sections, empty cells, and placeholder text", () => {
    const staleThenIncomplete = `${decisionLog(completeRows)}
## 收敛检查
| 维度 | 用户答案或无新需求 | 事实或材料引用 | 可执行验收标准 |
| --- | --- | --- | --- |
| 目标 | 用户未回答 | 事实 | N/A |
`;
    const appended = analyzeDecisionConvergence(staleThenIncomplete);
    expect(appended.ok).toBe(false);
    expect(appended.facts.goal_achievement).toBe("missing");

    const emptyReference = analyzeDecisionConvergence(decisionLog(completeRows.map((row) => row.startsWith("| 目标")
      ? "| 目标 | 用户确认要让设置流程可用 |  | N/A |"
      : row)));
    expect(emptyReference.ok).toBe(false);
    expect(emptyReference.facts.goal_achievement).toBe("missing");

    const placeholderAcceptance = analyzeDecisionConvergence(decisionLog(completeRows.map((row) => row.startsWith("| 验收")
      ? "| 验收 | 用户确认要验证保存 | R-004、AC-001 | 场景：待定；数据来源：未知；通过：待确认；失败：待定 |"
      : row)));
    expect(placeholderAcceptance.ok).toBe(false);
    expect(placeholderAcceptance.facts.acceptance_clarity).toBe("missing");
  });
});

describe("make-decision OI outline close", () => {
  const withConvergence = (markdown) => `${decisionLog(completeRows)}\n\n${markdown}`;

  it("requires the current OI authority, questions-only direction snapshot, terminal fields, no open items, and core interaction proof", () => {
    const fixture = outlineLog();
    const result = analyzeDecisionConvergence(withConvergence(fixture.markdown), {
      taskId: "task-1",
      directionReview: fixture.direction,
      interactionAggregate: fixture.interaction,
      requireOutline: true,
    });
    expect(result).toMatchObject({
      ok: true,
      facts: { outline_closed: "passed" },
      outline: { components: {
        structure: "passed",
        direction_snapshot: "passed",
        no_open_items: "passed",
        terminal_fields: "passed",
        interaction_proof: "passed",
      } },
    });
  });

  it("keeps outline_closed missing when any close conjunct is absent", () => {
    const base = outlineLog();
    const cases = [
      ["framework structure", outlineLog({ frameworkRows: [["background", "OI-001"]] }), "structure"],
      ["fixed category structure", outlineLog({ categoryRows: [["complete_user_flow", "OI-001"]] }), "structure"],
      ["questions-only direction snapshot", base, "direction_snapshot"],
      ["open item", base, "no_open_items"],
      ["terminal field", base, "terminal_fields"],
    ];
    for (const [label, fixture, component] of cases) {
      let markdown = fixture.markdown;
      let direction = base.direction;
      if (label === "questions-only direction snapshot") direction = { ...base.direction, outline_version: "v0" };
      if (label === "open item") markdown = markdown.replace("    status: confirmed\n", "    status: open\n");
      if (label === "terminal field") markdown = markdown.replace("    selected_disposition: 复用当前入口\n", "");
      const result = analyzeDecisionConvergence(withConvergence(markdown), {
        taskId: "task-1",
        directionReview: direction,
        interactionAggregate: base.interaction,
        requireOutline: true,
      });
      expect(result, label).toMatchObject({ ok: false, facts: { outline_closed: "missing" }, outline: { components: { [component]: "missing" } } });
    }
  });

  it("rejects unlisted answer-bearing fields in the questions-only direction snapshot", () => {
    const fixture = outlineLog();
    const direction = {
      ...fixture.direction,
      convergence_outline: {
        ...fixture.direction.convergence_outline,
        entries: fixture.direction.convergence_outline.entries.map((entry) => ({
          ...entry,
          selected_answer: "用户已选择某方案",
        })),
      },
    };
    const result = analyzeDecisionConvergence(withConvergence(fixture.markdown), {
      taskId: "task-1",
      directionReview: direction,
      interactionAggregate: fixture.interaction,
      requireOutline: true,
    });
    expect(result).toMatchObject({ ok: false, facts: { outline_closed: "missing" }, outline: { components: { direction_snapshot: "missing" } } });
    expect(result.errors.join("; ")).toMatch(/contains unsupported fields: selected_answer/);
  });

  it("does not accept a core OI's self-reported interaction ref without the current aggregate", () => {
    const fixture = outlineLog({ interactionAggregate: false });
    const result = analyzeDecisionConvergence(withConvergence(fixture.markdown), {
      taskId: "task-1",
      directionReview: fixture.direction,
      interactionAggregate: fixture.interaction,
      requireOutline: true,
    });
    expect(result).toMatchObject({ ok: false, facts: { outline_closed: "missing" }, outline: { components: { interaction_proof: "missing" } } });
    expect(result.errors.join("; ")).toMatch(/interaction proof is unavailable/);
  });

  it("does not accept an aggregate that omits or relabels the core OI group/disposition", () => {
    const fixture = outlineLog();
    const tampered = {
      ...fixture.interaction,
      value: {
        ...fixture.interaction.value,
        oi_dispositions: [{
          ...fixture.interaction.value.oi_dispositions[0],
          visible_group_id: "wrong-group",
        }],
      },
    };
    const result = analyzeDecisionConvergence(withConvergence(fixture.markdown), {
      taskId: "task-1",
      directionReview: fixture.direction,
      interactionAggregate: tampered,
      requireOutline: true,
    });
    expect(result).toMatchObject({ ok: false, facts: { outline_closed: "missing" }, outline: { components: { interaction_proof: "missing" } } });
    expect(result.errors.join("; ")).toMatch(/does not bind its OI\/group\/disposition/);
  });

  it("expects no interaction ref/hash inside the OI record itself", () => {
    // Contract regression (D-024): core-OI proof MUST flow one way, from the
    // content-addressed aggregate's oi_dispositions to the OI.  If the record
    // also embedded the aggregate's ref/hash, decision-log.md's bytes would
    // depend on the address of the aggregate that must bind those same bytes,
    // which has no fixed point — the OI could never be closed.
    const fixture = outlineLog();
    expect(fixture.markdown).not.toMatch(/interaction_ref|interaction_hash/);
    const result = analyzeDecisionConvergence(withConvergence(fixture.markdown), {
      taskId: "task-1",
      directionReview: fixture.direction,
      interactionAggregate: fixture.interaction,
      requireOutline: true,
    });
    expect(result).toMatchObject({
      ok: true,
      facts: { outline_closed: "passed" },
      outline: { components: { interaction_proof: "passed" } },
    });
    expect(result.errors.join("; ")).not.toMatch(/core interaction proof is missing or invalid/);
  });

  it("still reads a legacy OI record that carries interaction ref/hash", () => {
    const fixture = outlineLog({
      records: [{
        oi_id: "OI-001", task_id: "task-1", outline_version: "v1", category: "complete_user_flow",
        source: "R-001", question: "目标流程的关键入口是什么？", status: "confirmed",
        selected_disposition: "复用当前入口", evidence: "F-001", acceptance: "入口可达",
        counterexample: "入口不存在", impact_dimensions: ["goal"], requires_user_decision: true,
        visible_group_id: "group-goal",
        legacy_interaction_ref: "interaction-1", legacy_interaction_hash: OUTLINE_HASH,
      }],
      frameworkRows: [["background", "OI-001"], ["problem", "OI-001"], ["goal", "OI-001"], ["solution", "OI-001"], ["acceptance", "OI-001"], ["extension", "OI-001"]],
      categoryRows: [["complete_user_flow", "OI-001"], ["page_scope", "OI-001"], ["data_state", "OI-001"], ["success_failure_boundary", "OI-001"], ["non_goals", "OI-001"], ["deferred", "OI-001"]],
    });

    expect(fixture.markdown).toMatch(/interaction_ref: interaction-1/);
    const result = analyzeDecisionConvergence(withConvergence(fixture.markdown), {
      taskId: "task-1",
      directionReview: fixture.direction,
      interactionAggregate: fixture.interaction,
      requireOutline: true,
    });
    // The legacy fields are retained reading material, not the proof source.
    expect(result).toMatchObject({ ok: true, facts: { outline_closed: "passed" } });
  });
});

function taskIdentityLog(declarations, { outsideIdentity = "" } = {}) {
  const rows = declarations.map((value) => `| 任务类型 | ${value} |`).join("\n");
  return [
    "# 当前决策",
    "## 任务身份",
    "| 标签 | 值 |",
    "| --- | --- |",
    rows,
    outsideIdentity,
  ].filter(Boolean).join("\n");
}

describe("planning-hardening task type declaration", () => {
  it("planning-hardening AC-TYPE-001 accepts exactly one controlled declaration in the task identity section", () => {
    expect(typeof contracts.readTaskTypeFromDecisionLog).toBe("function");
    const readTaskType = contracts.readTaskTypeFromDecisionLog;
    expect(readTaskType(taskIdentityLog(["规划任务"]))).toBe("规划任务");
    expect(readTaskType([
      "# 当前决策",
      "## 任务身份",
      "- **任务类型**：普通任务",
    ].join("\n"))).toBe("普通任务");
  });

  it("planning-hardening AC-TYPE-001 fails closed for missing, duplicate, conflicting, unknown, or out-of-section declarations", () => {
    expect(typeof contracts.readTaskTypeFromDecisionLog).toBe("function");
    const readTaskType = contracts.readTaskTypeFromDecisionLog;
    const cases = [
      ["missing", taskIdentityLog([])],
      ["duplicate same value", taskIdentityLog(["规划任务", "规划任务"])],
      ["conflicting values", taskIdentityLog(["规划任务", "普通任务"])],
      ["unknown value", taskIdentityLog(["调研任务"])],
      ["outside identity section", taskIdentityLog([], { outsideIdentity: "## 目标\n- **任务类型**：规划任务" })],
    ];
    for (const [label, markdown] of cases) {
      expect(readTaskType(markdown), label).toBe("unknown");
    }
  });
});
