import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

import { validateSpecAnalyzeCompleteness } from "../../runtime/stage/stage-content-contracts.mjs";
import { buildPlanningArtifacts } from "../../skills/wh-review/scripts/review-materials.mjs";

const strategy = `
- **test tier / test method**：\`feature\` / \`backend-testing\`
- **scenarios / commands / expected exit / oracle**：完整、缺失和失败场景；\`npx vitest run tests/contract/demo.test.mjs\`；expected exit 0；\`ORACLE-DEMO-001\`
- **fixtures_services**：内存 fixture；不调用 provider；测试后清理临时目录。
- **evidence_path**：\`quality/tests/demo.json\`
- **coverage limits**：不覆盖真实 provider。
- **STOP**：缺输入或无法绑定事实时停止。
`;
const aggregateStrategy = `
- **tier / method**：\`fullstack\` / \`fullstack-slice-testing\`
- **scenarios**：完整回放。
- **command**: \`npm test\`
- **expected exit**：0
- **oracle**：\`ORACLE-FINAL-001\`
- **fixtures_services**：内存 fixture；不调用 provider。
- **evidence_path**：\`quality/tests/final.json\`
- **coverage limits**：不覆盖真实 provider。
- **STOP**：失败保留原始事实。
`;

function complete() {
  return {
    rawRequirementIndex: {
      schema_version: "raw-requirement-index.v1",
      source_artifact: "decision-log",
      entries: [
        { id: "R-001", decision_ids: ["D-001"], summary: "第一条原始要求" },
        { id: "R-002", decision_ids: ["D-002"], summary: "第二条原始要求" },
      ],
    },
    decisionLog: "R-001 D-001\nR-002 D-002",
    spec: "R-001 R-002\nFR-WH-004 FR-WH-006\nAC-WH-04 AC-WH-06",
    plan: `## Phase P3\nT001 R-001 D-001 FR-WH-004 FR-WH-006 AC-WH-04 AC-WH-06\n${strategy}\n## Final current-snapshot aggregate strategy\n${aggregateStrategy}`,
    tasks: `#### T001\n- **ID**：T001\n- **source_refs / decision_refs**：R-001 → D-001\n- **FR**：FR-WH-004 FR-WH-006\n- **AC**：AC-WH-04 AC-WH-06\n${strategy}\n\n## 4. Final current-snapshot aggregate strategy\n${aggregateStrategy}`,
  };
}

describe("spec-analyze completeness contract", () => {
  it("has no runtime caller that turns findings into a publication gate", () => {
    const runtimeCallerFiles = [
      new URL("../../runtime/stage/stage-handlers.mjs", import.meta.url),
      new URL("../../runtime/stage/stage-runner.mjs", import.meta.url),
    ];
    const callers = runtimeCallerFiles.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(callers).not.toMatch(/validateSpecAnalyzeCompleteness/);
    const catalog = yaml.load(readFileSync(new URL("../../skills/catalog.yaml", import.meta.url), "utf8"));
    const entry = catalog.skills.find(({ name }) => name === "spec-analyze");
    expect(entry.local_changes).toMatch(/report-only validator[\s\S]*(?:no|没有) runtime work gate/i);
    expect(entry.local_changes).toMatch(/consumer[\s\S]*contract tests/i);
  });

  it("accepts a fully source-bound artifact chain and complete test strategy", () => {
    const result = validateSpecAnalyzeCompleteness(complete());
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("uses the required decision-log source index without inventing a full decision-log excerpt", () => {
    const source = complete();
    const planningArtifacts = buildPlanningArtifacts({
      rawRequirementIndex: source.rawRequirementIndex,
      approvedSpec: source.spec,
      acceptanceCriteria: "AC-WH-04 AC-WH-06 AC-WH-07",
      draftPlan: source.plan,
      draftTasks: source.tasks,
    });
    const result = validateSpecAnalyzeCompleteness({ planningArtifacts });
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("reports concrete source, coverage, orphan-task, and strategy gaps", () => {
    const broken = complete();
    broken.decisionLog = "R-001 D-001";
    broken.plan = `${broken.plan}\nT999 orphan task`;
    broken.tasks = broken.tasks
      .replace("- **AC**：AC-WH-04", "- **AC**：AC-WH-06")
      .replace("- **coverage limits**：不覆盖真实 provider。", "");

    const result = validateSpecAnalyzeCompleteness(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/R-002|orphan task|AC-WH-04|test strategy/i);
    expect(result.findings.map(({ type }) => type)).toEqual(expect.arrayContaining([
      "source_gap",
      "orphan_task",
      "uncovered_acceptance_criterion",
      "missing_test_strategy",
    ]));
    for (const finding of result.findings) {
      expect(finding).toMatchObject({
        source_artifact: expect.any(String),
        target_artifact: expect.any(String),
        fr_or_task_id: expect.any(String),
        line_or_anchor: expect.any(String),
        disposition: "pending_main_agent_review",
      });
    }
  });

  it("checks explicit material hash headers instead of silently ignoring them", () => {
    const broken = complete();
    broken.plan = `- **Spec SHA-256**：\`${"a".repeat(64)}\`\n${broken.plan}`;
    const result = validateSpecAnalyzeCompleteness(broken);
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "material_hash_binding_gap", target_artifact: "plan" }),
    ]));
  });
});
