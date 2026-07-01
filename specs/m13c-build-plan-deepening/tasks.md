# Tasks: m13c-build-plan-deepening

**Input**: Design documents `specs/m13c-build-plan-deepening/`
**Prerequisites**: spec.md (authoritative, 3rd-reviewed), plan.md
**Tests**: Vitest (`npx vitest run`) — 针对 task_dir 解析器（core/task-dir-parser.mjs）

**Organization**: 任务按依赖排序，分 4 个 Stage。Stage 1 建基础设施，Stage 2 修订核心 SKILL.md（可并行），Stage 3 收尾配套，Stage 4 验收。

## Format: `- [ ] [TaskID] [P?] Description (stage:N, depends:<task-ids>)`

- **[P]**: 可并行（不同文件，无依赖）
- 每条任务标注至少一个 FR

---

## Stage 1

**Purpose**: 基础设施——新建 spec-research SKILL.md 和 task_dir 解析器（后续 Stage 2 依赖这两个产物）

- [x] T001 新建 `skills/spec-research/SKILL.md`：定义 Phase 0 research skill（输入 task-id + 功能描述文本，产出 `specs/{task-id}/research.md`，含跳过选项 FR-RESEARCH-003），包含 fail-loud、non-blocking 失败语义（FR-RESEARCH-002）（non-blocking 指不设自动硬停门，不代表跳过 FR-RESEARCH-002 的暂停+人工升级步骤；缺失 research.md 时仍先暂停，经人工确认/升级后才可继续） (stage:1, depends:无)
  FR: FR-RESEARCH-001, FR-RESEARCH-002, FR-RESEARCH-003

- [x] T002 [P] 新建 `core/task-dir-parser.mjs`：单一解析函数，读取 `config/workflowhub.yaml` task_dir 字段，回退默认路径 `~/Knowledge/workflowhub/`；不引入第三方依赖（FR-TASKDIR-001）。消费者接入动作由各自任务负责：T004 在 `workflows/build-plan/SKILL.md` 中写入解析器调用说明，T005 在 `skills/spec-analyze/SKILL.md` 中写入，T006 在 `skills/spec-tasks/SKILL.md` 中写入，T001 在 `skills/spec-research/SKILL.md` 中写入；接入后须可被 grep 命中（AC-16 口径）(stage:1, depends:无)
  FR: FR-TASKDIR-001

- [x] T003 [P] 新建 `core/task-dir-parser.test.mjs`：vitest 测试，覆盖"显式配置路径"和"默认回退路径"两个场景，`npx vitest run` 须绿（FR-TASKDIR-002） (stage:1, depends:T002)
  FR: FR-TASKDIR-002

---

## Stage 2

**Purpose**: 核心 SKILL.md 修订（T004/T005/T006 彼此无依赖，可并行）；依赖 Stage 1 T001（spec-research 文件须先存在）

- [x] T004 [P] 修订 `workflows/build-plan/SKILL.md`：新增 Step 0（调用 spec-research，产出 research.md）；Phase 1 新增 data-contracts 步骤（产出 data-contracts.md，失败 record+escalate non-blocking）；在 spec-plan 调用前插入 simplicity-guard 前置判断（输出 minimal-path 字段）；新增 plan-reviewer 步骤（调用 3rd-review，产出 plan-eng-review.md，失败 record+escalate non-blocking；调用前验证跨仓路径可访问性）；**接入 task_dir 解析器**：在 SKILL.md 中写入"读写任务跟踪文件前调用 `core/task-dir-parser.mjs` 取得路径，不得硬编码"（须可被 grep 命中，AC-16 口径） (stage:2, depends:T001)
  FR: FR-RESEARCH-001, FR-DATACONTRACTS-001, FR-DATACONTRACTS-002, FR-SIMPLICITY-001, FR-SIMPLICITY-002, FR-PLANREVIEW-001, FR-PLANREVIEW-002, FR-PLANREVIEW-003

- [x] T005 [P] 修订 `skills/spec-analyze/SKILL.md`：在 stage-result.facts 新增 ambiguity_items[] 数组（每项含 description、escalation_path，可选值 human_confirm/next_iteration/acceptable_ambiguity）；escalation_path 缺失时 warn 写 quality-contract，不阻断推进；**接入 task_dir 解析器**：在 SKILL.md 中写入"读写任务跟踪文件前调用 `core/task-dir-parser.mjs` 取得路径，不得硬编码"（须可被 grep 命中，AC-16 口径） (stage:2, depends:无)
  FR: FR-ANALYZE-001, FR-ANALYZE-002

- [x] T006 [P] 修订 `skills/spec-tasks/SKILL.md`：新增 no-placeholder 铁律（禁止 TODO/TBD/placeholder/待定/暂缺）；发现时标记 blocking_item:true，记录 friction，stage-result.human_intervention=true，但 spec-tasks 步骤本身继续完成 tasks.md 写入，不阻断 build-plan stage 推进；新增 STOP/Knowledge 标签约定（软要求，缺失 warn）和 upstream_delta 字段说明（注意：blocking_item:true 的那条具体任务本身不允许继续分解/向下派发，须先经人工解决——对应 spec 场景 4.6；"不阻断 build-plan stage 推进"指 stage 整体继续写出 tasks.md，不是允许带占位符的任务继续推进）；**接入 task_dir 解析器**：在 SKILL.md 中写入"读写任务跟踪文件前调用 `core/task-dir-parser.mjs` 取得路径，不得硬编码"（须可被 grep 命中，AC-16 口径） (stage:2, depends:无)
  FR: FR-TASKS-001, FR-TASKS-002

---

## Stage 3

**Purpose**: 收尾配套——更新 reuse-registry，确认 simplicity-guard 接入状态

- [x] T007 更新 `reuse-registry.md`：新增 upstream_delta 列，为 spec-research 添加登记行（upstream_delta 值填入来源参考） (stage:3, depends:T001)
  FR: FR-REGISTRY-001

- [x] T008 [P] 确认 `skills/simplicity-guard/SKILL.md` 存在（M13b 已落盘）；grep 确认 `workflows/build-spec/SKILL.md` 中含 simplicity-guard 引用（仅核实，不改动） (stage:3, depends:无)
  FR: FR-SIMPLICITY-001, FR-SIMPLICITY-002

---

## Stage 4

**Purpose**: 验收——运行测试，确认所有文件存在，确认 AC 覆盖

- [x] T009 运行 `npx vitest run`，确认 task_dir 解析器测试全部绿（AC-17） (stage:4, depends:T003)
  FR: FR-TASKDIR-002

- [x] T010 [P] 逐 AC 扫描确认：AC-01（spec-research SKILL.md 存在）、AC-16（task_dir 解析器被真实调用 grep 命中）、AC-19（simplicity-guard SKILL.md 存在 + build-spec 引用）；文档或注释单独存在不通过 AC-16（须代码级 grep 命中） (stage:4, depends:T004,T002,T008)
  FR: FR-RESEARCH-001, FR-TASKDIR-001, FR-SIMPLICITY-001

- [x] T011 [P] 确认 AC-02 至 AC-15 覆盖（SKILL.md 内容 grep 各新字段/步骤是否存在）；输出各 AC 通过/待定清单 (stage:4, depends:T004,T005,T006,T007)
  FR: FR-RESEARCH-001, FR-DATACONTRACTS-001, FR-DATACONTRACTS-002, FR-SIMPLICITY-001, FR-SIMPLICITY-002, FR-PLANREVIEW-001, FR-PLANREVIEW-002, FR-PLANREVIEW-003, FR-ANALYZE-001, FR-ANALYZE-002, FR-TASKS-001, FR-TASKS-002, FR-REGISTRY-001

---

## Dependencies & Execution Order

### Stage Dependencies

- **Stage 1**：无依赖，立即开始
- **Stage 2**：T004 依赖 T001（spec-research 文件须先存在）；T005/T006 无 Stage 1 依赖，可与 Stage 1 并行或随即开始
- **Stage 3**：T007 依赖 T001；T008 无依赖（可随时执行）
- **Stage 4**：T009 依赖 T003；T010 依赖 T004/T002/T008；T011 依赖 T004-T007

### Parallel Opportunities

- Stage 1：T001 和 T002 可并行（不同文件）；T003 依赖 T002 完成后立即开始
- Stage 2：T004/T005/T006 可并行（不同文件）
- Stage 3：T007/T008 可并行
- Stage 4：T009/T010/T011 可并行（T009 依赖 T003，T010/T011 依赖各自前置）

### Critical Path

T002 → T003 → T009（测试验收）
T001 → T004 → T010/T011（核心 SKILL.md 完成 → 验收扫描）

---

## Implementation Strategy

### MVP

1. 完成 Stage 1（spec-research SKILL.md + task_dir 解析器）
2. 完成 Stage 2 T006（no-placeholder 铁律，最直接影响下游 build-code 质量的改动）
3. **STOP/VALIDATE**：`npx vitest run` 绿，spec-research SKILL.md grep 命中
4. 继续 Stage 2 T004/T005，完成 Stage 3/4

### Incremental Delivery

1. Stage 1 → 基础设施就绪
2. Stage 2 → 三个 SKILL.md 并行修订
3. Stage 3 → 收尾配套
4. Stage 4 → 验收确认

---

## Notes

- AC-18（全部改动通过独立异源审查）由 codex/3rd-review 外部产物路径验证，不在本 tasks.md 任务范围内（审查由独立流程触发）
- plan-reviewer 跨仓依赖（/Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/）：T004 中须写明"调用前验证路径可访问，不可访问时 record+escalate_to_human，non-blocking"
- task_dir 解析器路径 `core/task-dir-parser.mjs` 为建议路径，build-code 阶段可调整，但须保证"真实消费者调用"可 grep 命中（AC-16 口径）
