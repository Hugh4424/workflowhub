import { describe, expect, it } from "vitest";

import { analyzeDecisionConvergence } from "../../runtime/stage/stage-content-contracts.mjs";

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
