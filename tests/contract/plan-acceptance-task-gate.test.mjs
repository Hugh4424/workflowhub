import { describe, expect, it } from "vitest";

import {
  projectAcceptanceExecutionData,
  validateExecutablePlanTaskMinimum,
} from "../../runtime/stage/stage-content-contracts.mjs";

const spec = `# Spec

## Functional Requirements

- **FR-PLN-001**：计划必须包含验收 task。
- **Decision Facts**：D6 是分档政策；D7 是 tier 政策；D8 记录本任务的高风险用户可见判定。

## Acceptance Criteria

- **AC-PLN-001**：验收 task 与逐场景数据可验证。
`;

const plan = `# Plan

## Test Strategy

所有 UI 任务有前端实现 task，最后一阶段有验收 task。
`;

const decisionLog = `# Decision log

### D6 — tier policy

- 这是全局分档政策。

### D7 — evidence policy

- 这是全局证据政策。

### D8 — current task high-risk decision

- **high_risk_fact**：\`{"classification":"high_risk_user_visible","basis":"user_declaration"}\`
`;

function decisionLogWithUiApplicability(result) {
  return `${decisionLog}
## UI applicability

\`\`\`json
{
  "result": "${result}",
  "sources": {
    "raw_requirement": { "conclusion": "${result}", "reason": "authoritative requirement" },
    "project_inventory": { "conclusion": "${result}", "reason": "authenticated inventory" },
    "planned_or_changed_frontend_fact": { "conclusion": "${result}", "reason": "accepted implementation plan" }
  }
}
\`\`\`
`;
}

function decisionLogWithUnknownUiApplicability() {
  return `${decisionLog}
## UI applicability

\`\`\`json
{
  "result": "unknown",
  "sources": {
    "raw_requirement": { "status": "unknown", "reason": "requirement does not settle UI scope" },
    "project_inventory": { "status": "unknown", "reason": "inventory is not frozen" },
    "planned_or_changed_frontend_fact": { "status": "unknown", "reason": "plan does not settle frontend impact" }
  },
  "source_reasons": ["all three inputs are unresolved"],
  "handoff": "ask the user",
  "user_question": "Does this task change a page, interaction, or frontend component?"
}
\`\`\`
`;
}

const scenario = JSON.stringify([{
  source: "fixture/settings.json",
  sample: "default-settings",
  scenario: "user saves settings",
  tier: "browser",
}]);

const uiImplementationRefs = JSON.stringify([
  {
    artifact_kind: "evidence",
    ref: "quality/evidence/design-authority.json",
    hash: "a".repeat(64),
    id: "design-authority",
  },
  {
    artifact_kind: "evidence",
    ref: "quality/evidence/ui-contract.json",
    hash: "b".repeat(64),
    id: "ui-contract",
  },
]);

function card({
  id, title, phase, role, pair, dependency, uiScope, acceptanceRole,
  acceptanceData = scenario, e2eScope = null, e2eDecisionRefs = null, e2eRiskDecisionRef = null,
  versionedRefs = null,
}) {
  const exit = role === "RED" ? "1" : "0";
  return `#### ${id} — ${title}
- **ID**：${id}
- **Phase**：${phase}
- **goal**：验证当前计划任务。
- **依赖**：${dependency}
- **FR**：FR-PLN-001
- **AC**：AC-PLN-001
- **动作**：执行当前任务。
- **精确文件**：\`tests/${id.toLowerCase()}.test.mjs\`
- **boundary**：files: \`tests/${id.toLowerCase()}.test.mjs\`
- **verification_role**：${role === "N/A" ? "N/A — non-behavior acceptance task" : role}
- **paired_task**：${pair}
- **gate_cmd**：\`npx vitest run tests/${id.toLowerCase()}.test.mjs\`
- **expected_exit**：${exit}
- **ui_scope**：${uiScope}
- **acceptance_role**：${acceptanceRole}
- **acceptance_data**：\`${acceptanceData}\`
${versionedRefs === null ? "" : `- **versioned_refs**：\`${versionedRefs}\`\n`}
${e2eScope === null ? "" : `- **e2e_scope**：${e2eScope}\n`}${e2eDecisionRefs === null ? "" : `- **e2e_decision_refs**：\`${e2eDecisionRefs}\`\n`}${e2eRiskDecisionRef === null ? "" : `- **e2e_risk_decision_ref**：${e2eRiskDecisionRef}\n`}
`;
}

const validTasks = `# Tasks

- **Template version**：\`plan-task.v4\`

## Phase 1 — UI implementation

${card({
  id: "T001", title: "UI RED", phase: "Phase 1 — UI implementation", role: "RED", pair: "T002", dependency: "none",
  uiScope: "ui", acceptanceRole: "implementation", versionedRefs: uiImplementationRefs,
})}

${card({
  id: "T002", title: "UI GREEN", phase: "Phase 1 — UI implementation", role: "GREEN", pair: "T001", dependency: "T001",
  uiScope: "ui", acceptanceRole: "implementation", versionedRefs: uiImplementationRefs,
})}

## Phase 2 — E2E acceptance

${card({
  id: "T003", title: "E2E acceptance", phase: "Phase 2 — E2E acceptance", role: "N/A", pair: "N/A — non-behavior acceptance task", dependency: "T002",
  uiScope: "ui", acceptanceRole: "acceptance", e2eScope: "ui",
})}
`;

const serviceScenario = JSON.stringify([{
  source: "fixture/service-records.json",
  sample: "account-123",
  scenario: "customer changes an irreversible setting",
  tier: "service",
}]);

const highRiskNonUiTasks = `# Tasks

- **Template version**：\`plan-task.v4\`

## Phase 1 — Service implementation

${card({
  id: "T100", title: "Service RED", phase: "Phase 1 — Service implementation", role: "RED", pair: "T101", dependency: "none",
  uiScope: "non_ui", acceptanceRole: "implementation",
})}

${card({
  id: "T101", title: "Service GREEN", phase: "Phase 1 — Service implementation", role: "GREEN", pair: "T100", dependency: "T100",
  uiScope: "non_ui", acceptanceRole: "implementation",
})}

## Phase 2 — Service acceptance

${card({
  id: "T102", title: "High-risk service acceptance", phase: "Phase 2 — Service acceptance", role: "N/A", pair: "N/A — non-behavior acceptance task", dependency: "T101",
  uiScope: "non_ui", acceptanceRole: "acceptance", acceptanceData: serviceScenario,
  e2eScope: "high_risk_user_visible", e2eDecisionRefs: JSON.stringify(["D6", "D7"]), e2eRiskDecisionRef: "D8",
})}
`;

const highRiskUiTasks = validTasks.replace(
  "- **e2e_scope**：ui",
  `- **e2e_scope**：high_risk_user_visible
- **e2e_decision_refs**：\`["D6","D7"]\`
- **e2e_risk_decision_ref**：D8`,
);

const browserAndServiceScenario = JSON.stringify([
  JSON.parse(scenario)[0],
  {
    source: "fixture/service-records.json",
    sample: "account-123",
    scenario: "service persists the same user change",
    tier: "service",
  },
]);

const highRiskFullstackTasks = replaceAcceptanceData(
  highRiskUiTasks.replace(
    "- **ui_scope**：ui\n- **acceptance_role**：acceptance",
    "- **ui_scope**：fullstack\n- **acceptance_role**：acceptance",
  ),
  browserAndServiceScenario,
);

const notRequiredNonUiTasks = highRiskNonUiTasks
  .replace("- **e2e_scope**：high_risk_user_visible", "- **e2e_scope**：not_required")
  .replace('- **e2e_decision_refs**：`["D6","D7"]`\n', "")
  .replace("- **e2e_risk_decision_ref**：D8\n", "");

function validate(tasks) {
  return validateExecutablePlanTaskMinimum({ spec, plan, tasks, decisionLog });
}

function replaceAcceptanceData(tasks, value) {
  return tasks.replace(/(#### T003[\s\S]*?- \*\*acceptance_data\*\*：`)[^`]+(`)/, `$1${value}$2`);
}

function addNonFinalAcceptanceScope(tasks) {
  return tasks.replace("## Phase 2 — E2E acceptance\n\n", `## Phase 2 — E2E acceptance

${card({
  id: "T004", title: "Earlier acceptance without scope authority", phase: "Phase 2 — E2E acceptance", role: "N/A",
  pair: "N/A — non-behavior acceptance task", dependency: "T002", uiScope: "non_ui", acceptanceRole: "acceptance",
  acceptanceData: serviceScenario, e2eScope: "not_required",
})}
`);
}

describe("plan acceptance-task delivery contract", () => {
  it("requires a final acceptance task and a separate UI implementation task", () => {
    expect(validate(validTasks)).toMatchObject({ ok: true, errors: [] });
    expect(validate(validTasks.replace("- **acceptance_role**：acceptance", "- **acceptance_role**：implementation")).ok).toBe(false);
    expect(validate(validTasks.replaceAll("- **ui_scope**：ui", "- **ui_scope**：non_ui").replace(
      "- **ui_scope**：non_ui\n- **acceptance_role**：acceptance",
      "- **ui_scope**：ui\n- **acceptance_role**：acceptance",
    )).ok).toBe(false);
  });

  it("requires every UI/fullstack implementation card to bind a design authority and UI contract", () => {
    expect(validate(validTasks)).toMatchObject({ ok: true, errors: [] });
    expect(validate(validTasks.replace(uiImplementationRefs, JSON.stringify([
      {
        artifact_kind: "evidence",
        ref: "quality/evidence/ui-contract.json",
        hash: "b".repeat(64),
        id: "ui-contract",
      },
    ]))).ok).toBe(false);
    expect(validate(validTasks.replace(uiImplementationRefs, JSON.stringify([
      {
        artifact_kind: "evidence",
        ref: "quality/evidence/design-authority.json",
        hash: "a".repeat(64),
        id: "design-authority",
      },
    ]))).ok).toBe(false);
    expect(validate(validTasks
      .replace("- **ui_scope**：ui\n- **acceptance_role**：implementation", "- **ui_scope**：fullstack\n- **acceptance_role**：implementation")
      .replace(uiImplementationRefs, "[]")).ok).toBe(false);
  });

  it.each(["source", "sample", "scenario", "tier"])("rejects an acceptance scenario without %s", (field) => {
    const value = JSON.parse(scenario);
    delete value[0][field];
    const missing = JSON.stringify(value);
    expect(validate(replaceAcceptanceData(validTasks, missing)).ok).toBe(false);
  });

  it.each(["source", "sample", "scenario", "tier"])("rejects an acceptance placeholder in %s", (field) => {
    const value = JSON.parse(scenario);
    value[0][field] = "TBD";
    const placeholder = JSON.stringify(value);
    expect(validate(replaceAcceptanceData(validTasks, placeholder)).ok).toBe(false);
  });

  it("rejects an unsupported acceptance tier", () => {
    expect(validate(replaceAcceptanceData(validTasks, scenario.replace("\"tier\":\"browser\"", "\"tier\":\"manual\""))).ok).toBe(false);
  });

  it("requires typed high-risk decision refs and projects the declared service tier", () => {
    expect(validate(highRiskNonUiTasks)).toMatchObject({ ok: true, errors: [] });
    expect(projectAcceptanceExecutionData(highRiskNonUiTasks, { decisionLog, spec })).toMatchObject({
      status: "ready",
      eligible_for_pass: true,
      requires_independent_verdict: true,
      scenarios: [{ task_id: "T102", tier: "service", e2e_scope: "high_risk_user_visible", e2e_risk_decision_ref: "D8" }],
    });
    expect(validate(highRiskNonUiTasks.replace(
      '- **e2e_decision_refs**：`["D6","D7"]`',
      '- **e2e_decision_refs**：`["D6"]`',
    )).ok).toBe(false);
    expect(validate(highRiskNonUiTasks.replace('- **e2e_risk_decision_ref**：D8\n', "")).ok).toBe(false);
    expect(validate(highRiskNonUiTasks.replace('- **e2e_risk_decision_ref**：D8', '- **e2e_risk_decision_ref**：D6')).ok).toBe(false);
    expect(validate(highRiskNonUiTasks.replace('"tier":"service"', '"tier":"browser"')).ok).toBe(false);
    expect(validateExecutablePlanTaskMinimum({
      spec,
      plan,
      tasks: highRiskNonUiTasks,
      decisionLog: decisionLog.replace('"high_risk_user_visible"', '"ordinary"'),
    }).ok).toBe(false);
    expect(validateExecutablePlanTaskMinimum({
      spec,
      plan,
      tasks: highRiskNonUiTasks,
      decisionLog: decisionLog.replace(
        '`{"classification":"high_risk_user_visible","basis":"user_declaration"}`',
        '`{"classification":"high_risk_user_visible","basis":"user_declaration"}`\n- **high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"three_inputs"}`',
      ),
    }).ok).toBe(false);
    expect(projectAcceptanceExecutionData(highRiskNonUiTasks, {
      decisionLog,
      spec: spec.replace("D8", "RISK"),
    })).toMatchObject({ status: "unavailable", eligible_for_pass: false });
  });

  it("accepts only the declared ui/fullstack/high-risk/not-required scope matrix", () => {
    expect(validate(highRiskUiTasks)).toMatchObject({ ok: true, errors: [] });
    expect(validate(highRiskFullstackTasks)).toMatchObject({ ok: true, errors: [] });
    expect(validateExecutablePlanTaskMinimum({
      spec,
      plan,
      tasks: notRequiredNonUiTasks,
      decisionLog: decisionLogWithUiApplicability("non_ui"),
    })).toMatchObject({ ok: true, errors: [] });
    expect(validate(highRiskFullstackTasks.replace('"tier":"service"', '"tier":"command"')).ok).toBe(false);
    expect(validate(notRequiredNonUiTasks.replace(
      "- **ui_scope**：non_ui\n- **acceptance_role**：acceptance",
      "- **ui_scope**：ui\n- **acceptance_role**：acceptance",
    )).ok).toBe(false);
  });

  it("does not let a recorded UI decision downgrade final acceptance to non-UI not-required", () => {
    const nonUiDecisionLog = decisionLogWithUiApplicability("non_ui");
    expect(validateExecutablePlanTaskMinimum({
      spec,
      plan,
      tasks: notRequiredNonUiTasks,
      decisionLog: nonUiDecisionLog,
    })).toMatchObject({ ok: true, errors: [] });
    expect(projectAcceptanceExecutionData(notRequiredNonUiTasks, {
      decisionLog: nonUiDecisionLog,
      spec,
    })).toMatchObject({
      status: "ready",
      eligible_for_pass: true,
      requires_independent_verdict: false,
    });

    for (const [label, blockedDecisionLog] of [
      ["UI", decisionLogWithUiApplicability("ui")],
      ["missing", decisionLog],
      ["unknown", decisionLogWithUnknownUiApplicability()],
    ]) {
      expect(validateExecutablePlanTaskMinimum({
        spec,
        plan,
        tasks: notRequiredNonUiTasks,
        decisionLog: blockedDecisionLog,
      }).ok, label).toBe(false);
      expect(projectAcceptanceExecutionData(notRequiredNonUiTasks, {
        decisionLog: blockedDecisionLog,
        spec,
      }), label).toMatchObject({
        status: "unavailable",
        eligible_for_pass: false,
        requires_independent_verdict: true,
      });
    }
  });

  it("rejects a browser scenario hidden inside a non-UI not-required card", () => {
    const browser = notRequiredNonUiTasks.replace('"tier":"service"', '"tier":"browser"');
    expect(validate(browser)).toMatchObject({ ok: false });
    expect(projectAcceptanceExecutionData(browser, {
      decisionLog: decisionLogWithUiApplicability("non_ui"),
      spec,
    })).toMatchObject({
      status: "unavailable",
      eligible_for_pass: false,
    });
  });

  it("rejects e2e_scope × ui_scope conflicts instead of guessing from task prose", () => {
    expect(validate(validTasks.replace('- **e2e_scope**：ui', '- **e2e_scope**：fullstack')).ok).toBe(false);
    expect(validate(validTasks.replace('- **e2e_scope**：ui', '- **e2e_scope**：unknown')).ok).toBe(false);
    expect(projectAcceptanceExecutionData(
      validTasks.replace('- **ui_scope**：ui', '- **ui_scope**：non_ui').replace('- **e2e_scope**：ui', '- **e2e_scope**：unknown'),
      { decisionLog, spec },
    )).toMatchObject({
      status: "unavailable",
      eligible_for_pass: false,
      requires_independent_verdict: true,
    });
  });

  it("makes v4 scope mandatory, keeps v3 readable but ineligible, and forbids scope fields on implementation cards", () => {
    const v4WithoutScope = validTasks.replace("- **e2e_scope**：ui\n", "");
    expect(validate(v4WithoutScope).ok).toBe(false);
    expect(projectAcceptanceExecutionData(v4WithoutScope, { decisionLog, spec })).toMatchObject({
      status: "unavailable",
      eligible_for_pass: false,
    });

    const legacyV3 = v4WithoutScope.replace("plan-task.v4", "plan-task.v3");
    expect(validate(legacyV3)).toMatchObject({ ok: true, errors: [] });
    expect(projectAcceptanceExecutionData(legacyV3, { decisionLog, spec })).toMatchObject({
      status: "unavailable",
      eligible_for_pass: false,
      legacy_scope_missing: true,
    });

    const legacyV3WithScope = validTasks.replace("plan-task.v4", "plan-task.v3");
    expect(validate(legacyV3WithScope)).toMatchObject({ ok: true, errors: [] });
    expect(projectAcceptanceExecutionData(legacyV3WithScope, { decisionLog, spec })).toMatchObject({
      status: "unavailable",
      eligible_for_pass: false,
      legacy_template: true,
    });

    const implementationScope = validTasks.replace(
      "- **acceptance_role**：implementation\n- **acceptance_data**",
      "- **acceptance_role**：implementation\n- **e2e_scope**：ui\n- **acceptance_data**",
    );
    expect(validate(implementationScope).ok).toBe(false);
  });

  it("rejects e2e_* fields on a non-final acceptance card", () => {
    expect(validate(addNonFinalAcceptanceScope(validTasks)).ok).toBe(false);
  });

  it("does not let a v4 scope bypass the delivery contract or borrow a later appendix fact", () => {
    const scopeOnly = `# Tasks

- **Template version**：\`plan-task.v4\`

#### T900 — invalid scope-only card
- **ID**：T900
- **e2e_scope**：ui
`;
    expect(validate(scopeOnly).ok).toBe(false);
    expect(projectAcceptanceExecutionData(scopeOnly, { decisionLog, spec })).toMatchObject({
      status: "unavailable",
      requires_execution: true,
      eligible_for_pass: false,
    });

    const factInAppendix = decisionLog.replace(
      '- **high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}`',
      "",
    ) + `\n## Appendix\n\n- **high_risk_fact**：\`{"classification":"high_risk_user_visible","basis":"user_declaration"}\`\n`;
    expect(validateExecutablePlanTaskMinimum({
      spec,
      plan,
      tasks: highRiskNonUiTasks,
      decisionLog: factInAppendix,
    }).ok).toBe(false);
  });
});
