import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

import { validateSpecAnalyze, validateSpecAnalyzeCompleteness, validateStageSpecAnalyzeProfile } from "../../runtime/stage/stage-content-contracts.mjs";
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
    original_requirements: [
      { id: "R-001", summary: "第一条原始要求" },
      { id: "R-002", summary: "第二条原始要求" },
    ],
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
  it("has report-only planning and five-stage consumers without a runtime publication gate", () => {
    const runtimeCallerFiles = [
      new URL("../../runtime/stage/stage-handlers.mjs", import.meta.url),
      new URL("../../runtime/stage/stage-runner.mjs", import.meta.url),
    ];
    const callers = runtimeCallerFiles.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(callers).not.toMatch(/validateSpecAnalyzeCompleteness/);
    const planningReview = readFileSync(new URL("../../skills/wh-review/scripts/review-materials.mjs", import.meta.url), "utf8");
    expect(planningReview).toMatch(/buildPlanningArtifacts/);
    const catalog = yaml.load(readFileSync(new URL("../../skills/catalog.yaml", import.meta.url), "utf8"));
    const entry = catalog.skills.find(({ name }) => name === "spec-analyze");
    expect(entry.local_changes).toMatch(/report-only validator[\s\S]*(?:no|没有) runtime work gate/i);
    expect(entry.local_changes).toMatch(/build-plan[\s\S]*planning_artifacts[\s\S]*contract tests/i);
  });

  it("checks semantic behavior and evidence, not only identifiers or document presence", () => {
    const source = complete();
    source.coverage = [{
      requirement_id: "R-001",
      expected_behavior: "用户真实需求语义",
      actual_behavior: "文件存在",
      semantic_match: false,
      scenario_refs: ["SCN-001"],
      oracle_refs: ["ORACLE-001"],
      artifact_refs: ["spec"],
      evidence_refs: ["spec"],
      status: "covered",
    }];
    source.original_requirements = [{ id: "R-001", summary: "第一条原始要求" }];
    source.materials = { original_requirement: "原始需求", decision_log: source.decisionLog, spec: source.spec, plan: source.plan, tasks: source.tasks };
    source.evidence = [
      { ref: "decision-log", kind: "decision", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "spec", kind: "specification", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "plan", kind: "plan", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "tasks", kind: "tasks", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
    ];
    const result = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: source });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-001" }),
    ]));
  });

  it.each([
    ["文件存在并完整", "文件存在"],
    ["文档存在且可用", "文档存在"],
    ["路径存在并覆盖需求", "路径存在"],
    ["文档已检查但没有行为证据", "文档已检查"],
    ["删除", "删除文件后保留副本"],
  ])("rejects compound existence claims as semantic coverage (%s)", (actual_behavior) => {
    const source = complete();
    source.coverage = [{
      requirement_id: "R-001",
      expected_behavior: "需求文档完整",
      actual_behavior,
      semantic_match: true,
      scenario_refs: ["SCN-001"],
      oracle_refs: ["ORACLE-001"],
      artifact_refs: ["spec"],
      evidence_refs: ["spec"],
      status: "covered",
    }];
    source.original_requirements = [{ id: "R-001", summary: "第一条原始要求" }];
    source.materials = { original_requirement: "原始需求", decision_log: source.decisionLog, spec: source.spec, plan: source.plan, tasks: source.tasks };
    source.evidence = [
      { ref: "decision-log", kind: "decision", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "spec", kind: "specification", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "plan", kind: "plan", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "tasks", kind: "tasks", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
    ];
    const result = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: source });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-001" }),
    ]));
  });

  it("requires fresh evidence to bind to the current snapshot", () => {
    const source = complete();
    source.evidence = [
      { ref: "decision-log", kind: "decision", status: "fresh", hash: "a".repeat(64) },
      { ref: "spec", kind: "specification", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "plan", kind: "plan", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "tasks", kind: "tasks", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
    ];
    const result = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: source });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/stale evidence: decision-log/);
  });

  it("accepts a real behavior statement that mentions ordinary existence", () => {
    const source = complete();
    source.coverage = [{
      requirement_id: "R-001",
      expected_behavior: "支持批量提问",
      actual_behavior: "支持批量提问且存在重试机制",
      semantic_match: true,
      scenario_refs: ["SCN-001"],
      oracle_refs: ["ORACLE-001"],
      artifact_refs: ["spec"],
      evidence_refs: ["spec"],
      status: "covered",
    }];
    source.original_requirements = [{ id: "R-001", summary: "第一条原始要求" }];
    source.materials = { original_requirement: "原始需求", decision_log: source.decisionLog, spec: source.spec, plan: source.plan, tasks: source.tasks };
    source.evidence = [
      { ref: "decision-log", kind: "decision", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "spec", kind: "specification", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "plan", kind: "plan", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "tasks", kind: "tasks", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
    ];
    expect(validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: source }).ok).toBe(true);
  });

  it.each([
    ["支持批量提问", "支持批量提问，测试通过"],
    ["实现批量提问", "已实现批量提问并完成验证"],
  ])("accepts behavior that ends with a verification note (%s)", (expected_behavior, actual_behavior) => {
    const source = complete();
    source.coverage = [{
      requirement_id: "R-001",
      expected_behavior,
      actual_behavior,
      semantic_match: true,
      scenario_refs: ["SCN-001"],
      oracle_refs: ["ORACLE-001"],
      artifact_refs: ["spec"],
      evidence_refs: ["spec"],
      status: "covered",
    }];
    source.original_requirements = [{ id: "R-001", summary: "第一条原始要求" }];
    source.materials = { original_requirement: "原始需求", decision_log: source.decisionLog, spec: source.spec, plan: source.plan, tasks: source.tasks };
    source.evidence = [
      { ref: "decision-log", kind: "decision", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "spec", kind: "specification", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "plan", kind: "plan", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      { ref: "tasks", kind: "tasks", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
    ];
    expect(validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: source }).ok).toBe(true);
  });

  it.each([
    ["已检查", "减少无谓阻塞已检查"],
    ["支持批量提问", "不支持批量提问"],
    ["支持批量提问", "不再支持批量提问"],
    ["支持批量提问", "不能支持批量提问"],
    ["支持批量提问", "不能满足批量提问"],
    ["支持批量提问", "不满足批量提问"],
    ["支持批量提问", "不符合批量提问要求"],
    ["支持批量提问", "不会支持批量提问"],
    ["支持批量提问", "不要支持批量提问"],
    ["支持批量提问", "不必支持批量提问"],
    ["支持批量提问", "没法支持批量提问"],
    ["支持批量提问", "取消批量提问"],
    ["支持批量提问", "移除批量提问"],
    ["支持批量提问", "支持批量回答"],
  ])("rejects verification-only or negated semantic claims (%s)", (expected_behavior, actual_behavior) => {
    const source = complete();
    source.coverage = [{
      requirement_id: "R-001",
      expected_behavior,
      actual_behavior,
      semantic_match: true,
      scenario_refs: ["SCN-001"],
      oracle_refs: ["ORACLE-001"],
      artifact_refs: ["spec"],
      evidence_refs: ["spec"],
      status: "covered",
    }];
    source.materials = { original_requirement: "原始需求", decision_log: source.decisionLog, spec: source.spec, plan: source.plan, tasks: source.tasks };
    source.evidence = [{ ref: "spec", kind: "specification", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) }];
    const result = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: source });
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "semantic_mismatch", requirement_id: "R-001" }),
    ]));
  });

  it("rejects unknown and duplicate coverage rows instead of using order-dependent results", () => {
    const source = complete();
    const base = {
      ...source,
      materials: { original_requirement: "原始需求", decision_log: source.decisionLog, spec: source.spec, plan: source.plan, tasks: source.tasks },
      evidence: [
        { ref: "decision-log", kind: "decision", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
        { ref: "spec", kind: "specification", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
        { ref: "plan", kind: "plan", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
        { ref: "tasks", kind: "tasks", status: "fresh", hash: "a".repeat(64), snapshot_tree: "b".repeat(40) },
      ],
    };
    const coverage = {
      requirement_id: "R-001", expected_behavior: "第一条原始要求", actual_behavior: "第一条原始要求已实现",
      semantic_match: true, scenario_refs: ["SCN-001"], oracle_refs: ["ORACLE-001"], artifact_refs: ["spec"], evidence_refs: ["spec"], status: "covered",
    };
    const unknown = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: { ...base, coverage: [{ ...coverage, requirement_id: "R-999" }] } });
    expect(unknown.ok).toBe(false);
    expect(unknown.errors.join("; ")).toMatch(/unknown requirement coverage/);
    const duplicate = validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: { ...base, coverage: [coverage, { ...coverage, actual_behavior: "第一条原始要求已完成" }] } });
    expect(duplicate.ok).toBe(false);
    expect(duplicate.errors.join("; ")).toMatch(/duplicate requirement coverage/);
  });

  it("accepts a fully source-bound artifact chain and complete test strategy", () => {
    const result = validateSpecAnalyzeCompleteness(complete());
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("routes the unified entry by profile and reports a missing stage packet clearly", () => {
    expect(validateSpecAnalyze({ profile: "build-plan", packet: { original_requirements: [], coverage: [] } }).stage).toBe("build-plan");
    expect(() => validateSpecAnalyze({ profile: "build-plan" })).toThrow(/requires packet/);
    expect(validateSpecAnalyze(complete())).toMatchObject({ ok: true });
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

  it("requires every DEFER and OPEN item to have owner, trigger, handoff, and close condition downstream", () => {
    const broken = complete();
    broken.deferredItems = [{ id: "DEFER-001", owner: "build-code", trigger: "P1 ready", handoff: "T001", close_condition: "focused tests" }];
    broken.openItems = [{ id: "OPEN-001", owner: "build-plan", trigger: "plan review", handoff: "T002", close_condition: "analyzer confirms" }];
    broken.decisionLog = `${broken.decisionLog}\nDEFER-001 OPEN-001`;

    const missing = validateSpecAnalyzeCompleteness(broken);
    expect(missing.ok).toBe(false);
    expect(missing.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "deferred_open_handoff_gap", id: "DEFER-001" }),
      expect.objectContaining({ type: "deferred_open_handoff_gap", id: "OPEN-001" }),
    ]));

    const covered = complete();
    covered.deferredItems = broken.deferredItems;
    covered.openItems = broken.openItems;
    covered.decisionLog = `${covered.decisionLog}\nDEFER-001 owner build-code trigger P1 ready handoff T001 close focused tests\nOPEN-001 owner build-plan trigger plan review handoff T002 close analyzer confirms`;
    covered.spec += "\nDEFER-001 OPEN-001 owner trigger handoff close";
    covered.plan += "\nDEFER-001 OPEN-001 owner build-code build-plan trigger handoff close";
    covered.tasks += "\nDEFER-001 OPEN-001 owner build-code build-plan trigger handoff close";
    const completeResult = validateSpecAnalyzeCompleteness(covered);
    expect(completeResult.ok, completeResult.errors.join("; ")).toBe(true);
  });

  it("does not let one deferred item borrow a sibling item's field", () => {
    const source = complete();
    const itemOne = "DEFER-001 owner build-code trigger phase-one handoff T001 close focused tests";
    const itemTwo = "DEFER-002 trigger phase-two handoff T002 close integration review";
    source.deferredItems = [{ id: "DEFER-001" }, { id: "DEFER-002" }];
    source.decisionLog += "\nDEFER-001\nDEFER-002";
    source.spec = `${source.spec}\n${itemOne}\n${itemTwo}`;
    source.plan = `${source.plan}\n${itemOne}\n${itemTwo}`;
    source.tasks = `${source.tasks}\n${itemOne}\n${itemTwo}`;

    const result = validateSpecAnalyzeCompleteness(source);
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "deferred_open_handoff_gap", id: "DEFER-002" }),
    ]));
    expect(result.findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "deferred_open_handoff_gap", id: "DEFER-001" }),
    ]));
  });

  it("does not treat deferred/open table headers as populated handoff fields", () => {
    const source = complete();
    const emptyRow = [
      "| ID | owner | trigger | handoff | close_condition |",
      "| --- | --- | --- | --- | --- |",
      "| DEFER-001 |  |  |  |  |",
    ].join("\n");
    source.deferredItems = [{ id: "DEFER-001" }];
    source.decisionLog += "\nDEFER-001";
    source.spec += `\n${emptyRow}`;
    source.plan += `\n${emptyRow}`;
    source.tasks += `\n${emptyRow}`;

    const result = validateSpecAnalyzeCompleteness(source);
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "deferred_open_handoff_gap", id: "DEFER-001" }),
    ]));
  });

  it("places the strict final analyzer after findings disposition and before publish", () => {
    const steps = JSON.parse(readFileSync(new URL("../../workflows/build-plan/steps.json", import.meta.url), "utf8")).steps;
    const disposition = steps.find(({ step_slug }) => step_slug === "main-agent-disposes-findings");
    const analyze = steps.find(({ step_slug }) => step_slug === "final-spec-analyze");
    const publish = steps.find(({ step_slug }) => step_slug === "publish-plan-result");
    expect(disposition).toBeDefined();
    expect(analyze).toMatchObject({ completion_evidence: expect.arrayContaining([
      { kind: "plan", uri_or_path: "plan.md" },
      { kind: "tasks", uri_or_path: "tasks.md" },
      { kind: "quality_facts", uri_or_path: "quality/evidence/" },
    ]) });
    expect(publish).toBeDefined();
    expect(disposition.order).toBeLessThan(analyze.order);
    expect(analyze.order).toBeLessThan(publish.order);
    expect(analyze.observable_result).toMatch(/DEFER|OPEN|report-only|strict/i);
  });

  it("places a stage-end spec-analyze step before publish in every authoring stage", () => {
    for (const stage of ["make-decision", "build-spec", "build-code"]) {
      const steps = JSON.parse(readFileSync(new URL(`../../workflows/${stage}/steps.json`, import.meta.url), "utf8")).steps;
      const analyze = steps.find(({ step_slug }) => step_slug === "stage-end-spec-analyze");
      const publish = steps.find(({ step_slug }) => step_slug.startsWith("publish-") && step_slug !== "publish-verification-attempt");
      expect(analyze, stage).toBeDefined();
      expect(publish, stage).toBeDefined();
      expect(analyze.order).toBeLessThan(publish.order);
      expect(analyze.completion_evidence).toEqual(expect.arrayContaining([
        { kind: "quality_facts", uri_or_path: "quality/evidence/" },
      ]));
      expect(analyze.observable_result).toMatch(/original requirement|原始需求/i);
    }
    const verifySteps = JSON.parse(readFileSync(new URL("../../workflows/verify-code/steps.json", import.meta.url), "utf8")).steps;
    expect(verifySteps.find(({ step_slug }) => step_slug === "stage-end-spec-analyze")).toBeUndefined();
    expect(verifySteps.find(({ step_slug }) => step_slug === "code-review-closure")).toBeDefined();
  });
});
