import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  validateTasksOnlyCompletionSeam,
  validateExecutablePlanTaskMinimum,
  validatePlanTaskContract,
  validateSpecAnalyzeCompleteness,
} from "../../runtime/stage/stage-content-contracts.mjs";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const templateFiller = "__TEMPLATE_FILL__";

const replaceLine = (text, label, value) => text.replace(
  new RegExp(`(^- \\*\\*${label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\*\\*[:：]).*$`, "gm"),
  `- **${label}**：${value}`,
);

const fillPlaceholders = (text) => text
  .replace(/\[填写：[^\]]*\]/g, templateFiller)
  .replace(/\[填写:[^\]]*\]/g, templateFiller)
  .replace(/\[填写[^\]]*\]/g, templateFiller);

const globalFiles = `### NEW

- \`tests/demo.test.mjs\`

### MODIFY

- \`core/demo.mjs\`

### DO NOT TOUCH

- \`core/authority.mjs\``;
const phaseFiles = `- **NEW**：\`tests/demo.test.mjs\`
- **MODIFY**：\`core/demo.mjs\`
- **DO NOT TOUCH**：\`core/authority.mjs\``;
const constitutionBinding = `\`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"${"a".repeat(64)}","id":"CONSTITUTION","version":"1","clause_count":22}\``;

function renderPlanTemplate() {
  let plan = fillPlaceholders(read("skills/spec-plan/templates/plan-template.md"));
  plan = plan
    .replace(/^- \*\*Non-goals\*\*[:：].*$/m, "- **Non-goals**：不改无关运行时。来源：R-001 / D-001")
    .replace(/- \*\*Constitution binding\*\*[:：].*$/m, `- **Constitution binding**：${constitutionBinding}`)
    .replace(/## Implementation Order\n\n__TEMPLATE_FILL__/, "## Implementation Order\n\nP1：T001 RED → T002 GREEN → T003 FINAL。")
    .replace(/- \*\*Dependencies\*\*[:：].*$/m, "- **Dependencies**：T001 → T002 → T003。")
    .replace(/- \*\*Parallel work\*\*[:：].*$/m, "- **Parallel work**：无；三张卡共享一个行为边界。")
    .replace(/- \*\*External dependencies\*\*[:：].*$/m, "- **External dependencies**：无；N/A — reason。")
    .replace(
      /\| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| `__TEMPLATE_FILL__` \| `__TEMPLATE_FILL__` \|/,
      "| R-001 / D-001 | FR-DEMO-001 | AC1 | P1/T001,T002,T003 | none | `tests/demo.test.mjs` | `npx vitest run tests/demo.test.mjs` / ORACLE-FINAL |",
    )
    .replace(/## Phase P1 — __TEMPLATE_FILL__/g, "## Phase P1 — Contract")
    .replace(/### Verify\n\n__TEMPLATE_FILL__/, "### Verify\n\nORACLE-FINAL — npx vitest run tests/demo.test.mjs")
    .replace("### Tasks\n\n- `__TEMPLATE_FILL__`", "### Tasks\n\n- `T001 RED`\n- `T002 GREEN`\n- `T003 FINAL`")
    .replaceAll(templateFiller, "verified contract fact");
  return plan
    .replace("### NEW\n\n- `verified contract fact`\n\n### MODIFY\n\n- `verified contract fact`\n\n### DO NOT TOUCH\n\n- `verified contract fact`", globalFiles)
    .replace("- **NEW**：`verified contract fact`\n- **MODIFY**：`verified contract fact`\n- **DO NOT TOUCH**：`verified contract fact`", phaseFiles);
}

const taskShapes = {
  T001: { dependency: "none", role: "RED", pair: "T002", file: "tests/demo.test.mjs", expectedExit: "2" },
  T002: { dependency: "T001", role: "GREEN", pair: "T001", file: "core/demo.mjs", expectedExit: "0" },
  T003: {
    dependency: "T002",
    role: "N/A — non-behavior aggregate verification",
    pair: "N/A — aggregate has no RED/GREEN pair",
    file: "tests/demo.test.mjs",
    expectedExit: "0",
  },
};

function renderTasksTemplate() {
  let tasks = fillPlaceholders(read("skills/spec-tasks/templates/tasks-template.md"));
  tasks = tasks
    .replace(/## Phase P1 — __TEMPLATE_FILL__/g, "## Phase P1 — Contract")
    .replace("- **NEW**：`__TEMPLATE_FILL__`\n- **MODIFY**：`__TEMPLATE_FILL__`\n- **DO NOT TOUCH**：`__TEMPLATE_FILL__`", phaseFiles)
    .replace("### Tasks\n\n- `__TEMPLATE_FILL__`", "### Tasks\n\n- `T001 RED`\n- `T002 GREEN`\n- `T003 FINAL`");

  for (const [id, shape] of Object.entries(taskShapes)) {
    const cardPattern = new RegExp(`(#### ${id} \\—[\\s\\S]*?)(?=\\n#### T\\d+ \\—|\\n## 4\\.)`);
    tasks = tasks.replace(cardPattern, (card) => {
      const fields = {
        Phase: "Phase P1 — Contract",
        design_state: "ready",
        "source_refs / decision_refs": "R-001 / D-001",
        "依赖": shape.dependency,
        "并行": "否 — shared behavior boundary",
        FR: "FR-DEMO-001",
        AC: "AC1",
        "精确文件": shape.file,
        boundary: `files: \`${shape.file}\`; symbols/regions: declared symbol only.`,
        verification_role: shape.role,
        paired_task: shape.pair,
        gate_cmd: `\`${shape.role.startsWith("N/A") ? "npm test" : "npx vitest run tests/demo.test.mjs"}\``,
        expected_exit: shape.expectedExit,
        oracle: "ORACLE-FINAL — 当前 AC 的同一事实判定",
        evidence_path: `quality/tests/${id}.json`,
        "test tier / test method": "feature / backend-testing",
        "scenarios / commands / expected exit / oracle": `AC1 主路径和失败路径；同一命令；expected exit ${shape.expectedExit}；ORACLE-FINAL`,
        fixtures_services: "in-memory fixture；测试后清理。",
        "coverage limits": "覆盖 AC1；不覆盖外部 provider。",
      };
      return Object.entries(fields).reduce((current, [label, value]) => replaceLine(current, label, value), card);
    });
  }

  return tasks
    .replace(/\*\*command\*\*[:：]\s*`__TEMPLATE_FILL__`/, "**command**: `npm test`")
    .replace(/\*\*expected exit\*\*[:：]\s*__TEMPLATE_FILL__/, "**expected exit**：0")
    .replace(/\*\*oracle\*\*[:：]\s*__TEMPLATE_FILL__/, "**oracle**：ORACLE-FINAL — 当前 AC 的同一事实判定")
    .replace(/\*\*tier \/ method\*\*[:：]\s*__TEMPLATE_FILL__/, "**tier / method**：fullstack / fullstack-slice-testing")
    .replace(/\*\*execution_contract\*\*[:：]\s*__TEMPLATE_FILL__/, "**execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。")
    .replaceAll(templateFiller, "verified contract fact");
}

const spec = `
# Specification

- **R-001 / D-001**：保留一个可观察的行为合同。
- **FR-DEMO-001**：完成动作后得到可观察结果。
- **AC1**：主路径和失败路径都能被同一测试命令区分。
`;
const plan = renderPlanTemplate();
const tasks = renderTasksTemplate();

const rawRequirementIndex = {
  schema_version: "raw-requirement-index.v1",
  source_artifact: "decision-log",
  entries: [{ id: "R-001", decision_ids: ["D-001"], summary: "source-bound demo decision" }],
};

const updateTaskCard = (markdown, taskId, update) => markdown.replace(
  new RegExp(`(#### ${taskId} \\—[\\s\\S]*?)(?=\\n#### T\\d+ \\—|\\n## 4\\.)`),
  (card) => update(card),
);

const completeTaskCard = (markdown, taskId, evidenceHash = "a".repeat(64)) => updateTaskCard(markdown, taskId, (card) => card
  .replace("- [ ] **任务完成**", "- [x] **任务完成**")
  .replace("- **status**：`pending`", "- **status**：`completed`")
  .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：tests/demo.test.mjs")
  .replace("- **executed_commands**：N/A — not started", "- **executed_commands**：npm test; exit 0")
  .replace("- **evidence_refs**：N/A — not started", "- **evidence_refs**：`[{\"ref\":\"quality/tests/T003.json\",\"sha256\":\"" + evidenceHash + "\"}]`")
  .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
  .replace("- **review_fact**：N/A — final aggregate not executed", "- **review_fact**：reviews/results/phase-1.json")
  .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-08-11T12:00:00.000Z"));

describe("filled v3 planning sample", () => {
  it("renders the restored templates and passes production validators", () => {
    const analysis = validateSpecAnalyzeCompleteness({ rawRequirementIndex, decisionLog: "R-001 D-001", spec, plan, tasks });
    expect(analysis.ok, analysis.errors.join("; ")).toBe(true);
    expect(analysis.findings).toEqual([]);
    expect(plan).not.toMatch(new RegExp(templateFiller));
    expect(tasks).not.toMatch(new RegExp(templateFiller));
    expect(validatePlanTaskContract({ spec, plan, tasks })).toMatchObject({ ok: true, errors: [] });
    expect(validateExecutablePlanTaskMinimum({ spec, plan, tasks })).toMatchObject({ ok: true, errors: [] });
    expect(tasks).toMatch(/## 4\. Final current-snapshot aggregate strategy/);
    expect(tasks).toMatch(/\*\*command\*\*: `npm test`/);
    expect(tasks).toMatch(/\*\*execution_contract\*\*：当前快照运行一次/);
    const finalCard = tasks.split("#### T003")[1].split("## 4.")[0];
    expect(finalCard).toMatch(/\*\*oracle\*\*：ORACLE-FINAL/);
    expect(tasks.split("## Phase P1")[1].split("### Tasks")[0].trim()).toBe(
      plan.split("## Phase P1")[1].split("### Tasks")[0].trim(),
    );
    expect(plan).toMatch(/### Tasks\n\n- `T001 RED`\n- `T002 GREEN`\n- `T003 FINAL`/);
  });

  it("keeps the final route identical between T003 and the aggregate", () => {
    const finalCard = tasks.split("#### T003")[1].split("## 4.")[0];
    const aggregate = tasks.split("## 4. Final current-snapshot aggregate strategy")[1];
    const value = (text, label) => text.match(new RegExp(`\\*\\*${label}\\*\\*[:：]\\s*` + "`([^`]+)`"))?.[1];
    const plainValue = (text, label) => text.match(new RegExp(`\\*\\*${label}\\*\\*[:：]\\s*([^\\n]+)`))?.[1]?.trim();
    expect(value(finalCard, "gate_cmd")).toBe(value(aggregate, "command"));
    expect(plainValue(finalCard, "oracle")).toBe(plainValue(aggregate, "oracle"));
    expect(aggregate).toMatch(/\*\*oracle\*\*：ORACLE-FINAL/);
  });

  it("rejects a re-shrunken plan/task shape with field-specific errors", () => {
    const weakPlan = plan.replace(/\n## Code Anchors[\s\S]*?(?=\n## Solution Design)/, "");
    const weakTasks = tasks
      .replace(/\n- \*\*gate_cmd\*\*[:：].*/g, "")
      .replace(/\n- \*\*oracle\*\*[:：].*/g, "");
    const structural = validatePlanTaskContract({ spec, plan: weakPlan, tasks: weakTasks });
    expect(structural.ok).toBe(false);
    expect(structural.errors.join("; ")).toMatch(/Code Anchors|gate_cmd|oracle/);
    const executable = validateExecutablePlanTaskMinimum({ spec, plan: weakPlan, tasks: weakTasks });
    expect(executable.ok).toBe(false);
    expect(executable.errors.join("; ")).toMatch(/gate_cmd|task|coverage/i);
  });

  it("allows human alignment to append only to the completed FINAL execution fact", () => {
    const evidenceRaw = "final aggregate evidence\n";
    const completed = completeTaskCard(tasks, "T003", sha256(evidenceRaw));
    const aligned = updateTaskCard(completed, "T003", (card) => card.replace(
      "- **执行事实**：N/A — not started",
      "- **执行事实**：N/A — not started；human-alignment: user confirmed the handoff was understood.",
    ));
    const completionEvidence = ({ ref }) => ref === "quality/tests/T003.json" ? evidenceRaw : undefined;
    expect(validateTasksOnlyCompletionSeam({
      before: completed,
      after: aligned,
      taskId: "T003",
      completionEvidence,
    })).toMatchObject({ ok: true, changed_task_ids: ["T003"], requires_repeat_review: false });

    expect(validateTasksOnlyCompletionSeam({
      before: completed,
      after: aligned.replace("- **status**：`completed`", "- **status**：`in_progress`"),
      taskId: "T003",
      completionEvidence,
    })).toMatchObject({ ok: false });
  });
});
