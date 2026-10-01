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

const globalFiles = `### 新增

- \`tests/demo.test.mjs\`

### 修改

- \`core/demo.mjs\`

### 禁止改动

- \`core/authority.mjs\``;
const phaseFiles = `- **新增**：\`tests/demo.test.mjs\`
- **修改**：\`core/demo.mjs\`
- **禁止改动**：\`core/authority.mjs\``;
const constitutionBinding = `\`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"${"a".repeat(64)}","id":"CONSTITUTION","version":"1","clause_count":22}\``;

function renderPlanTemplate() {
  let plan = fillPlaceholders("# 实现计划：[填写：功能名]\n\n- **输入材料**：`[填写：decision-log.md 引用]`、`[填写：spec.md 引用]`\n- **模板版本**：`plan-task.v4`\n\n## 速读卡\n\n- **目标**：[填写：完成后的可观察结果]\n- **非目标**：[填写：明确不做什么]（来源：[填写：已确认的来源/决定引用]；决定：[填写：决定编号]）\n- **改动前**：[填写：已核实的当前行为或缺口]\n- **改动后**：[填写：目标行为]\n- **主要风险**：[填写：最可能影响交付的风险]\n- **下一步**：[填写：首个可执行动作或停止条件]\n\n## 技术上下文\n\n### 全局约束\n\n- **已核实事实**：[填写：影响实现的仓库、接口、数据和运行事实]\n- **语言 / 运行时**：[填写：已核实版本]\n- **主要依赖**：[填写：已有依赖及用途；无则写 `N/A — 理由`]\n- **存储 / 状态**：[填写：数据与持久化边界；无则写 `N/A — 理由`]\n- **测试**：[填写：真实测试工具、资源和清理约束]\n- **目标环境**：[填写：目标环境与兼容范围]\n- **规模 / 范围**：[填写：文件、模块和数据范围]\n- **未决事实**：[填写：未知事实、影响、处理阶段；无则写 `N/A — 理由`]\n\n## 代码锚点\n\n- **已核实锚点**：[填写：精确路径、符号、现有消费者]\n- **既有接口**：[填写：已核实签名、schema 或事件；无则写 `N/A — 理由`]\n- **现在必读**：[填写：设计阶段必须读取的最小锚点]\n- **动手前必读**：[填写：执行前才需要读取的锚点；无则写 `N/A — 理由`]\n- **上下文模式**：[填写：Lite / Full / N/A — 工程理由]\n\n## 方案设计\n\nOne module transforms one declared input and reports explicit failures.\n\n## 总览\n\n[填写：用 2–4 个短段落讲清完整技术链路、关键数据流和最小改动方式。]\n\n## [填写：模块名称]\n\n- **职责**：[填写：单一职责]\n- **消费**：[填写：准确接口或 schema]\n- **产出**：[填写：准确接口或 schema]\n- **不得决定**：[填写：权威边界]\n\n### 接口、数据与生命周期\n\n- **接口 / schema**：[填写：签名、数据契约和兼容边界；无则写 `N/A — 理由`]\n- **数据流 / 状态**：[填写：输入、变换、输出、失败与恢复]\n- **API 契约**：[填写：method、path、request、response、error；无则写 `N/A — 理由`]\n- **UI / 外部代码**：[填写：信息层级、交互、可访问性或最小 hook；无则写 `N/A — 理由`]\n- **明确失败**：[填写：无效输入或状态如何明确失败]\n\n## 文件边界\n\n### 新增\n\n- `[填写：精确新增文件路径 / N/A — 理由]`\n\n### 修改\n\n- `[填写：精确修改文件路径]`\n\n### 禁止改动\n\n- `[填写：精确保护文件路径及理由]`\n\n## 技术决策\n\n### DEC-001 — [填写：决策名称]\n\n- **问题**：[填写：真实工程问题]\n- **候选方案**：[填写：候选方案及取舍]\n- **已选**：[填写：复用 / 扩展 / 新增 及选择]\n- **理由**：[填写：为什么是最简单的充分方案]\n- **后果 / 风险**：[填写：代价和风险]\n- **回退方式**：[填写：边界内回退方式]\n- **F10 真实威胁**：[填写：仅「已选」为新增时保留]\n- **F10 既有覆盖**：[填写：仅「已选」为新增时保留]\n- **F10 可绕过**：[填写：仅「已选」为新增时保留]\n- **F10 维护成本**：[填写：仅「已选」为新增时保留]\n- **F10 处置**：[填写：`keep` / `simplify` / `remove`]\n\n## 测试策略\n\nT001 RED and T002 GREEN share one executable command and ORACLE-FINAL.\n\n## 风险与回滚\n\n- **全局恢复规则**：[填写：只回滚当前实现，保留四份材料和既有质量事实]\n- **不可逆边界**：[填写：需要明确授权的 commit/push/merge/archive/cleanup；无则写 `N/A — 理由`]\n- **恢复负责人**：[填写：失败后由谁执行哪一步]\n\n### 工程风险交接\n\n- **PLAN-RISK-001**：[填写：风险主题]\n  - **受影响 ID**：[填写：来源/FR/AC/T-ID]\n  - **触发条件**：[填写：何时发生]\n  - **后果**：[填写：可观察后果]\n  - **缓解或停止**：[填写：最小缓解或停止条件]\n  - **处理阶段**：[填写：build-plan / build-code / verify-code]\n  - **验证**：[填写：如何证明已处理或仍存在]\n\n## 实施顺序\n\n[填写：producer-before-consumer 顺序、Phase 编号和必须串行的原因。]\n\n## 依赖与并行\n\n- **依赖**：[填写：producer → consumer 及串行原因；无则写 `N/A — 理由`]\n- **并行工作**：[填写：独立输入、依赖和文件所有权；无则写 `N/A — 理由`]\n- **外部依赖**：[填写：已核实依赖与缺失语义；无则写 `N/A — 理由`]\n\n## 需求与验证追踪\n\n| 来源 / 决定 | FR | AC | Phase / Task | 依赖 | 精确文件 | 命令 / 判据 |\n| --- | --- | --- | --- | --- | --- | --- |\n| [填写：R*/D*] | [填写：FR-ID] | [填写：AC-ID] | [填写：P1/T001] | [填写：T-ID / 无] | `[填写：精确路径]` | `[填写：命令 / ORACLE-ID]` |\n\n## 治理同步矩阵\n\n| 治理面 | 实际文件 | 变更 / 不变更 | Task 编号 | 理由 |\n| --- | --- | --- | --- | --- |\n| [填写：宪法/技能/测试/文档] | `[填写：精确路径]` | 变更 / 不变更 | [填写：T-ID] | [填写：边界理由] |\n\n## 宪法逐项检查\n\n- **宪法绑定**：[填写：binding]\n\nF1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 Q1 Q2 Q3 S1 S2 S3 S4 S5 S6 S7 S8\n\n\n## Phase P1 — [填写：Phase 名]\n\n### 目标\n\n[填写：本 Phase 的可观察结果。]\n\n### L0 — 目标\n\n[填写：本包为什么存在、用户或消费者能观察到什么。]\n\n### L1 — 契约\n\n[填写：可机检的输入/输出、不变量、失败语义和所有者。]\n\n### L2 — 可删除参考\n\n[填写：只帮助当前执行者的参考；删除它不得改变 L0/L1，写明退出条件。]\n\n### 文件\n\n- **写入集**：[填写：本 Phase 精确文件集；不得用目录或 glob]\n- **新增**：`[填写：精确路径 / N/A — 理由]`\n- **修改**：`[填写：精确路径]`\n- **禁止改动**：`[填写：精确保护路径及理由]`\n\n### 任务\n\n- `[填写：T-ID：一行结果]`\n\n### 验证\n\n[填写：命令、预期退出码、判据、证据路径；与本 Phase 任务判据对齐。]\n\n### 知识\n\n[填写：下一阶段必须知道的已核实事实。]\n\n### 停止\n\n[填写：返回哪个归属材料的具体条件。]\n\n### 完成\n\n[填写：可以诚实报告的测试、AC、审查、证据和交接事实。]\n\n### 风险与回滚\n\n[填写：受影响 ID、触发条件、后果、缓解办法、回滚。]\n");
  plan = plan
    .replace(/^- \*\*非目标\*\*[:：].*$/m, "- **非目标**：不改无关运行时。来源：R-001 / D-001")
    .replace(/- \*\*宪法绑定\*\*[:：].*$/m, `- **宪法绑定**：${constitutionBinding}`)
    .replace(/## 实施顺序\n\n__TEMPLATE_FILL__/, "## 实施顺序\n\nP1：T001 RED → T002 GREEN → T003 FINAL。")
    .replace(/- \*\*依赖\*\*[:：].*$/m, "- **依赖**：T001 → T002 → T003。")
    .replace(/- \*\*并行工作\*\*[:：].*$/m, "- **并行工作**：无；三张卡共享一个行为边界。")
    .replace(/- \*\*外部依赖\*\*[:：].*$/m, "- **外部依赖**：无；N/A — 理由。")
    .replace(
      /\| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| __TEMPLATE_FILL__ \| `__TEMPLATE_FILL__` \| `__TEMPLATE_FILL__` \|/,
      "| R-001 / D-001 | FR-DEMO-001 | AC1 | P1/T001,T002,T003 | none | `tests/demo.test.mjs` | `npx vitest run tests/demo.test.mjs` / ORACLE-FINAL |",
    )
    .replace(/## Phase P1 — __TEMPLATE_FILL__/g, "## Phase P1 — Contract")
    .replace(/### 验证\n\n__TEMPLATE_FILL__/, "### 验证\n\nORACLE-FINAL — npx vitest run tests/demo.test.mjs")
    .replace("### 任务\n\n- `__TEMPLATE_FILL__`", "### 任务\n\n- `T001 RED`\n- `T002 GREEN`\n- `T003 FINAL`")
    .replaceAll(templateFiller, "verified contract fact");
  return plan
    .replace("### 新增\n\n- `verified contract fact`\n\n### 修改\n\n- `verified contract fact`\n\n### 禁止改动\n\n- `verified contract fact`", globalFiles)
    .replace("- **新增**：`verified contract fact`\n- **修改**：`verified contract fact`\n- **禁止改动**：`verified contract fact`", phaseFiles);
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
  let tasks = fillPlaceholders("# 执行索引：[填写：功能名]\n\n> 本文件是纯指针执行索引。工程正文只在阶段权威（phase authority）；本文件不复制任务卡、\n> 命令、可执行命令、验收判据正文或执行状态。\n\n- **决定权威**：`[填写：decision-log.md]`\n- **规格权威**：`[填写：spec.md]`\n- **阶段权威**：`[填写：phase 工程正文路径]`\n\n## 执行索引\n\n| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `[填写：阶段权威引用]` | `[填写：稳定语义锚点]` | `[填写：精确文件集 / N/A — 理由]` | `[填写：P0 / 无]` | `[填写：真实下游消费者]` |\n\n## 读取规则\n\n- 要实施、测试、审查或判断完成时，先按「权威引用」与「语义锚点」读取阶段工程正文。\n- 本索引只维护稳定指针、写入集、依赖与消费者；任何正文变化只在阶段权威里修改。\n- 缺权威、锚点、写入集、依赖或消费者时标 `N/A — 理由`，并退回阶段负责人；不得补写第二份工程正文。\n\n## 历史边界\n\npre cohort 或归档中的旧任务卡只读保留。它们不成为 post cohort 的写入方、校验方或完成门。\n");
  tasks = tasks
    .replace(/## Phase P1 — __TEMPLATE_FILL__/g, "## Phase P1 — Contract")
    .replace("- **NEW**：`__TEMPLATE_FILL__`\n- **MODIFY**：`__TEMPLATE_FILL__`\n- **DO NOT TOUCH**：`__TEMPLATE_FILL__`", phaseFiles)
    .replace("### 任务\n\n- `__TEMPLATE_FILL__`", "### 任务\n\n- `T001 RED`\n- `T002 GREEN`\n- `T003 FINAL`")
    .replace(
      /\| `P1` \| `__TEMPLATE_FILL__` \| `__TEMPLATE_FILL__` \| `__TEMPLATE_FILL__` \| `__TEMPLATE_FILL__` \| `__TEMPLATE_FILL__` \|/,
      "| `P1` | `plan.md` | `phase-p1-contract` | `tests/demo.test.mjs`; `core/demo.mjs` | `none` | `build-code` |",
    );
  return tasks.replaceAll(templateFiller, "verified contract fact");
}

function legacyValidatorCards() {
  const cards = Object.entries(taskShapes).map(([id, shape]) => `#### ${id} — ${shape.role}

- **ID**：${id}
- **动作**：执行 ${id} 的 fixture 行为。
- **Phase**：Phase P1 — Contract
- **source_refs / decision_refs**：R-001 / D-001
- **输入**：当前 phase authority。
- **输出**：${id} fixture evidence。
- **依赖**：${shape.dependency}
- **并行**：否 — shared behavior boundary
- **FR**：FR-DEMO-001
- **AC**：AC1
- **精确文件**：\`${shape.file}\`
- **boundary**：files: \`${shape.file}\`; symbols/regions: declared symbol only.
- **verification_role**：${shape.role}
- **paired_task**：${shape.pair}
- **gate_cmd**：\`${shape.role.startsWith("N/A") ? "npm test" : "npx vitest run tests/demo.test.mjs"}\`
- **expected_exit**：${shape.expectedExit}
- **oracle**：ORACLE-FINAL — 当前 AC 的同一事实判定
- **evidence_path**：\`quality/tests/${id}.json\`
- **STOP**：不改未声明的生产边界。
- **test tier / test method**：feature / backend-testing
- **scenarios / commands / expected exit / oracle**：AC1 主路径和失败路径；同一命令；expected exit ${shape.expectedExit}；ORACLE-FINAL
- **fixtures_services**：in-memory fixture；测试后清理。
- **coverage limits**：覆盖 AC1；不覆盖外部 provider。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：\`pending\`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — final aggregate not executed
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started`).join("\n\n");
  return `## Phase P1 — Contract\n\n### Goal\n\nFixture contract remains executable.\n\n### Files\n\n${phaseFiles}\n\n### Tasks\n\n${cards}\n\n### Verify\n\nORACLE-FINAL — npx vitest run tests/demo.test.mjs\n\n### Knowledge\n\nCurrent fixture facts are explicit.\n\n### STOP\n\nStop on a broken command.\n\n## 4. Final current-snapshot aggregate strategy\n\n- **tier / method**：fullstack / fullstack-slice-testing\n- **scenarios**：AC1 主路径和失败路径\n- **command**: \`npm test\`\n- **expected exit**：0\n- **oracle**：ORACLE-FINAL — 当前 AC 的同一事实判定\n- **fixtures_services**：in-memory fixture；测试后清理。\n- **evidence_path**：\`quality/tests/T003.json\`\n- **coverage limits**：覆盖 AC1；不覆盖外部 provider。\n- **STOP**：命令损坏时停止。\n- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。`;
}

const spec = `
# Specification

- **R-001 / D-001**：保留一个可观察的行为合同。
- **FR-DEMO-001**：完成动作后得到可观察结果。
- **AC1**：主路径和失败路径都能被同一测试命令区分。
`;
const plan = renderPlanTemplate();
const tasks = renderTasksTemplate();
const legacyPlan = `${plan.replace(/^- \*\*模板版本\*\*[:：].*\n?/m, "")}

## Global Constraints

Current fixture stays within the declared write set.

## Modules, Interfaces, and Data Contracts

The fixture keeps one observable module contract.

## FR to AC to Step Traceability

FR-DEMO-001 → AC1 → T001/T002/T003.

## Complexity Trade-offs

No additional mechanism is introduced for the compatibility fixture.
`;
const validatorTasks = legacyValidatorCards();

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

function dualPhasePlanFixtureErrors(value) {
  const errors = [];
  if (typeof value?.global_plan_ref !== "string" || value.global_plan_ref.trim() === "") {
    errors.push("dual-phase plan requires global_plan_ref");
  }
  if (!Array.isArray(value?.execution_index) || value.execution_index.length !== 2) {
    errors.push("dual-phase plan requires a compact P1/P2 execution_index");
  }
  for (const phase of value?.phases ?? []) {
    const frozen = phase?.frozen_test;
    if (typeof frozen?.ref !== "string" || !/^[a-f0-9]{64}$/i.test(frozen?.sha256 ?? "")) {
      errors.push(`phase ${phase?.phase_id ?? "<unknown>"} requires frozen_test ref/hash`);
    }
  }
  return errors;
}

describe("filled v3 planning sample", () => {
  it("validates the pointer-only v4 plan and execution index without legacy task cards", () => {
    const structural = validatePlanTaskContract({ spec, plan, tasks });
    expect(structural.ok, structural.errors.join("; ")).toBe(true);
    expect(structural.facts).toMatchObject({
      template_version: "plan-task.v4",
      phase_count: 1,
      task_count: 3,
      dependency_validation: { valid: true },
      command_oracle_checks: { valid: true },
    });
    const executable = validateExecutablePlanTaskMinimum({ spec, plan, tasks });
    expect(executable.ok, executable.errors.join("; ")).toBe(true);
  });

  it("projects Phase risk markers into pointer-only task rows for slice advisory", () => {
    const markedPlan = plan.replace(
      "### 风险与回滚\n\nverified contract fact",
      '### 风险与回滚\n\nslice-advisory: reason="shared contract update"; impact="two files change atomically"; owner="P1"; recheck="after GREEN"',
    );
    const structural = validatePlanTaskContract({ spec, plan: markedPlan, tasks });
    expect(structural.ok, structural.errors.join("; ")).toBe(true);
    expect(structural.facts.slice_advisory).toMatchObject({
      status: "within_budget",
      marker_count: 3,
    });
  });

  it("renders the current pointer template and passes baseline validators through an explicit compatibility fixture", () => {
    const analysis = validateSpecAnalyzeCompleteness({ rawRequirementIndex, decisionLog: "R-001 D-001", spec, plan: legacyPlan, tasks: validatorTasks });
    expect(analysis.ok, analysis.errors.join("; ")).toBe(true);
    expect(analysis.findings).toEqual([]);
    expect(plan).not.toMatch(new RegExp(templateFiller));
    expect(tasks).not.toMatch(new RegExp(templateFiller));
    expect(validatePlanTaskContract({ spec, plan: legacyPlan, tasks: validatorTasks })).toMatchObject({ ok: true, errors: [] });
    expect(validateExecutablePlanTaskMinimum({ spec, plan: legacyPlan, tasks: validatorTasks })).toMatchObject({ ok: true, errors: [] });
    expect(tasks).toMatch(/## 执行索引/);
    expect(tasks).toMatch(/phase authority/);
    expect(tasks).toMatch(/\| `P1` \|/);
    expect(validatorTasks).toMatch(/## 4\. Final current-snapshot aggregate strategy/);
    expect(validatorTasks).toMatch(/\*\*command\*\*: `npm test`/);
    expect(validatorTasks).toMatch(/\*\*execution_contract\*\*：当前快照运行一次/);
    const finalCard = validatorTasks.split("#### T003")[1].split("## 4.")[0];
    expect(finalCard).toMatch(/\*\*oracle\*\*：ORACLE-FINAL/);
    expect(plan).toMatch(/### 任务\n\n- `T001 RED`\n- `T002 GREEN`\n- `T003 FINAL`/);
  });

  it("keeps the final route identical between T003 and the aggregate", () => {
    const finalCard = validatorTasks.split("#### T003")[1].split("## 4.")[0];
    const aggregate = validatorTasks.split("## 4. Final current-snapshot aggregate strategy")[1];
    const value = (text, label) => text.match(new RegExp(`\\*\\*${label}\\*\\*[:：]\\s*` + "`([^`]+)`"))?.[1];
    const plainValue = (text, label) => text.match(new RegExp(`\\*\\*${label}\\*\\*[:：]\\s*([^\\n]+)`))?.[1]?.trim();
    expect(value(finalCard, "gate_cmd")).toBe(value(aggregate, "command"));
    expect(plainValue(finalCard, "oracle")).toBe(plainValue(aggregate, "oracle"));
    expect(aggregate).toMatch(/\*\*oracle\*\*：ORACLE-FINAL/);
  });

  it("T009 RED / T010 GREEN: retains incomplete dual-phase fixture errors and accepts one global pointer/index/frozen-test handoff", () => {
    const incomplete = {
      phases: [
        { phase_id: "P1", task_ids: ["T001", "T002"] },
        { phase_id: "P2", task_ids: ["T003", "T004"] },
      ],
    };
    expect(dualPhasePlanFixtureErrors(incomplete)).toEqual([
      "dual-phase plan requires global_plan_ref",
      "dual-phase plan requires a compact P1/P2 execution_index",
      "phase P1 requires frozen_test ref/hash",
      "phase P2 requires frozen_test ref/hash",
    ]);
    const fixture = {
      global_plan_ref: "plan.md#phase-map",
      execution_index: [
        { phase_id: "P1", task_ids: ["T001", "T002"] },
        { phase_id: "P2", task_ids: ["T003", "T004"] },
      ],
      phases: [
        { phase_id: "P1", task_ids: ["T001", "T002"], frozen_test: { ref: "quality/tests/phase-p1.json", sha256: "a".repeat(64) } },
        { phase_id: "P2", task_ids: ["T003", "T004"], frozen_test: { ref: "quality/tests/phase-p2.json", sha256: "b".repeat(64) } },
      ],
      // Fixture-only handoff: production plan validation remains above.
    };
    expect(dualPhasePlanFixtureErrors(fixture)).toEqual([]);
  });

  it("rejects a re-shrunken plan/task shape with field-specific errors", () => {
    const weakPlan = legacyPlan.replace(/\n## Code Anchors[\s\S]*?(?=\n## Solution Design)/, "");
    const weakTasks = validatorTasks
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
    const completed = completeTaskCard(validatorTasks, "T003", sha256(evidenceRaw));
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
