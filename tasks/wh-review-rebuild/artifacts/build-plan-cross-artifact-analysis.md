# 跨产物一致性分析报告

**task-id**: wh-review-rebuild
**执行阶段**: build-plan Step 4（spec-analyze 方法论）
**扫描对象**: specs/wh-review-rebuild/spec.md + plan.md + tasks.md
**日期**: 2026-07-06

> 本报告为只读记录，不阻断推进（spec-analyze 契约）。

---

## 摘要

对 spec.md/plan.md/tasks.md 三份产物做交叉一致性扫描，共发现 6 条非 CRITICAL 问题（1 条 inconsistency、2 条 ambiguity、3 条 underdefined），无 duplicate。全部为 MEDIUM/LOW 严重度，不构成阻断项。**更新（2026-07-06）：6/6 已在本轮 build-plan 修复中处理完毕，详见文末"复核结果"一节。**

---

## 发现项

| type | source_artifact | target_artifact | fr_or_task_id | line_or_anchor | severity | 描述 |
|---|---|---|---|---|---|---|
| ambiguity | plan.md | tasks.md | FR-WHREVIEW（metrics 接入） | plan.md:178, tasks.md:72(T024) | MEDIUM | plan.md Step 3.1 明确注明文件位置未定："`round-state.mjs` 或新增 `metrics-bridge.mjs`（视 Step 2.1 实现粒度决定是否拆分）"；tasks.md T024 同样未点名具体文件。build-code 阶段需先决定粒度再动手，否则两个实现者可能各选一种。 |
| underdefined | plan.md | spec.md | FR-STAGE-001 / FR-D2-001 | plan.md:230（Verification Mapping "2.7 5 stage 收尾统一 + D2 门"行） | MEDIUM | 该行只列 AC8-4（重启恢复场景），未列 AC8-1/AC8-2/AC8-3（5 stage 收尾统一模板本体验收标准）及 AC-D5/AC-D6（D2 人工确认门核心验收标准）。verify-code 阶段若照此映射表核对，会漏查主验收标准。 |
| underdefined | plan.md | spec.md | FR-INTAKE-001 / FR-TESTACCEPTANCE-001 | plan.md:223（Verification Mapping "1.4 intake/test-acceptance 合同深化"行） | MEDIUM | 该行写"C1-C6 / F1-F6 判据"（spec.md 判据编号），未换算成 spec.md 实际验收标准 AC-ID（AC9-1/AC9-2 对应 FR-INTAKE-001，AC10-1/AC10-2 对应 FR-TESTACCEPTANCE-001），与表格其余行"AC-ID 直接引用"的风格不一致，核对时需额外跳转 spec.md 查判据与 AC 的对应关系。 |
| ambiguity | plan.md | skills/test-strategy/SKILL.md | FR-TEST-001 / D7 | plan.md:96, plan.md:181-182, tasks.md:73(T025) | MEDIUM | plan.md/tasks.md 新增 `specs/wh-review-rebuild/test-plan.md`（端到端冒烟测试方案），但未说明其与既有 `skills/test-strategy/SKILL.md` 产出的 `test-strategy.md`（`ac_routes` YAML front-matter，AC-ID→证据层路由）的关系——是互补、替代还是子集。FR-TESTACCEPTANCE-001 的 F2 判据引用的是 `test-strategy.md` 的 AC 路由，而非 `test-plan.md`，两份文档职责边界未在 plan.md/tasks.md 中显式澄清。 |
| underdefined | plan.md | spec.md | FR-WHREVIEW-003 | plan.md:224（Verification Mapping "2.1 round-state.mjs"行） | LOW | 该行只列 AC3-1/AC3-2/AC3-3，未列 AC3-4。spec.md 中 AC3-4 与 AC3-3 共享测试场景描述，遗漏影响较小，仍建议补全以保持映射表完整性。 |
| inconsistency | plan.md | spec.md | FR-THIRDREVIEW-001 / FR-THIRDREVIEW-002 | plan.md:226-227（Verification Mapping "2.3""2.4"行） | MEDIUM | plan.md 分别写"AC-THIRDREVIEW1 系列""AC-THIRDREVIEW2 系列（机器可检验规则）"，但 spec.md 全文搜索无 `AC-THIRDREVIEW1-x` 或 `AC-THIRDREVIEW2-x` 命名——FR-THIRDREVIEW-001 相关验收标准实际以 AC-D 系列（如 AC-D13）体现，FR-THIRDREVIEW-002 的验收标准实际命名为 AC6-1~AC6-4（spec.md:308-325）。仅 FR-THIRDREVIEW-003/004 真实存在 `AC-THIRDREVIEWn-x` 命名（spec.md:341-362）。plan.md 对 2.3/2.4 两行套用了不存在的命名模式，核对时需重新定位真实 AC-ID。 |

---

## Coverage Summary

- spec.md 核心 FR 共 13 个（FR-WHREVIEW-001~004、FR-THIRDREVIEW-001~004、FR-STAGE-001、FR-D2-001、FR-INTAKE-001、FR-TESTACCEPTANCE-001、FR-TEST-001），tasks.md 27 个任务（T001-T027）均可追溯到至少一个上述 FR，覆盖率 13/13（100%）。
- plan.md Verification Mapping 表共 12 行，对应 Phase 1-3 全部 Step，逐行可定位到 tasks.md 任务与 spec.md FR，但存在上表所列 3 处 AC-ID 引用不精确/命名错误。

## Constitution Alignment Issues

无。plan.md 已完成 21 条 Constitution Check（F1-F10/Q1-Q3/S1-S8），全部标记 `[x]` 并附判据，本轮扫描未发现与宪法条款冲突的新增内容。

## Unmapped Tasks

无。tasks.md 全部 27 个任务均在描述中显式标注 FR 引用，未发现游离于 spec.md/plan.md 之外的任务。

## Metrics

- 扫描产物：3（spec.md、plan.md、tasks.md）
- 发现总数：6（inconsistency=1，duplicate=0，ambiguity=2，underdefined=3）
- Severity 分布：CRITICAL=0，HIGH=0，MEDIUM=5，LOW=1
- FR 覆盖率：13/13（100%）
- 任务映射率：27/27（100%）

## Next Actions

1. build-code 前澄清 Step 3.1 metrics 接入文件粒度（合并进 round-state.mjs 还是新建 metrics-bridge.mjs）。
2. 补全 plan.md Verification Mapping 表 2.7/1.4/2.1 三行遗漏的 AC-ID。
3. 修正 plan.md 2.3/2.4 两行的 AC-ID 命名，改用 spec.md 实际存在的编号（AC-D 系列 / AC6-1~AC6-4）。
4. 在 plan.md 或 test-plan.md 中补一句话澄清 test-plan.md 与既有 test-strategy.md 的职责边界。
5. 以上均为记录类问题，不阻断 build-plan 推进；是否在本轮修正由后续 F10/human review 判断。

## 溢出摘要

无溢出。发现总数（6）未超过 50 条上限。

---

## 复核结果（build-plan 修复轮，2026-07-06）

6 条发现均已在 plan.md/tasks.md 中修正，逐条复核如下：

1. **ambiguity（metrics 文件粒度）**：已定案——接入代码写入 `round-state.mjs` 内部，不新增 `metrics-bridge.mjs`。plan.md:177、tasks.md T024 同步更新。**状态：已解决**。
2. **underdefined（Step 2.7 遗漏主验收标准）**：Verification Mapping 行已补全为 `AC8-1, AC8-2, AC8-3, AC8-4, AC-D5, AC-D6`（plan.md:231）。**状态：已解决**。
3. **underdefined（Step 1.4 判据未换算 AC-ID）**：Verification Mapping 行已改为 `AC9-1, AC9-2（对应 C1-C6 判据）/ AC10-1, AC10-2（对应 F1-F6 判据）`（plan.md:224），保留判据编号便于对照。**状态：已解决**。
4. **ambiguity（test-plan.md 与 test-strategy.md 关系未澄清）**：plan.md Step 3.2 已补充关系说明——test-plan.md 是静态设计文档，test-strategy.md 是 verify-code 阶段运行时生成的 AC 路由清单，互补不重叠（plan.md Step 3.2 段）。**状态：已解决**。
5. **underdefined（Step 2.1 遗漏 AC3-4）**：Verification Mapping 行已补全为 `AC3-1, AC3-2, AC3-3, AC3-4`（plan.md:225）。**状态：已解决**。
6. **inconsistency（AC-THIRDREVIEW1/2 系列命名不存在）**：已改用 spec.md 实际 AC-ID——Step 2.3 行改为 `AC5-1, AC5-2`（plan.md:227），Step 2.4 行改为 `AC6-1, AC6-2, AC6-3, AC6-4`（plan.md:228）。**状态：已解决**。

**结论**：6/6 已解决，均为引用精度/文档澄清类修正（补全遗漏 AC-ID、修正命名、锁定实现文件粒度、补充关系说明），未新增/删除任何 Step、task 或 FR/AC 覆盖范围，未变更 tasks.md 的 stage/depends 结构。**判定：本轮修复不构成对 plan.md/tasks.md 步骤或任务内容的实质性改变，不需要重新跑 Step 2-4（spec-plan/spec-tasks/spec-analyze）**；本节复核已确认三份产物（spec.md/plan.md/tasks.md）重新对齐，视为本轮 spec-analyze 方法论的等效复查。

---

## 复核结果（plan-reviewer 驱动的第二轮重写，2026-07-06）

第三方 `build-plan-reviewer` 对 spec.md+plan.md+tasks.md 组合包做异源审查后给出 5 条 blocking 发现（Phase 结构缺六段格式、验证缺 gate_cmd/display_cmd 双列、D2 门任务粒度不够、5-stage 迁移任务粒度不够、缺 Governance Sync Matrix）。修复动作包括：Implementation 章节全量改写为六段格式（Goal/Files/Tasks/Verify/Knowledge/STOP）、新增 4 个任务（T011a/T011b/T023a/T025a）、重写 T019-T023 迁移语义、新增 Governance Sync Matrix 章节、F10 走查补充第 8 项机制（`human-confirmation.mjs`）。**这轮改动新增了任务与 FR 子项覆盖，属于实质性变更**，故按 spec-analyze 四类扫描方法对三产物做手工复核：

1. **FR/AC 覆盖率**：新增任务 T011a/T011b/T023a/T025a 均映射到既有 FR（FR-D2-001、FR-STAGE-001），未引入 spec.md 中不存在的 FR/AC 编号；13 个核心 FR 覆盖率仍为 13/13。
2. **underdefined 检查**：plan.md 六段格式中新引用的任务 ID（T011a/T011b/T023a/T025a）与文件（`human-confirmation.mjs` 及其 `__tests__`、`section7-machine-checkable.test.mjs`、`test-plan-smoke.test.mjs`）均已同步写入 tasks.md 对应任务描述与 Files 清单，无引用悬空项。
3. **Governance Sync Matrix Task ID 核验**：矩阵中标注 `changed` 的 5 类分别引用 T002-T006/T008/T009/T015（Reviewer contract）与 T016/T019-T023/T023a（Workflow definitions），逐一核对均在 tasks.md 中存在且描述与矩阵备注一致；T023a 虽实现逻辑落在 `human-confirmation.mjs`（T011b）内的读取函数，但消费方是 3 个 D2 stage 的 SKILL.md 自身（workflowhub 无独立中心化 orchestrator 进程，各 stage SKILL.md 自身即恢复判断的执行体），归类 Workflow definitions 成立，非归类错误。
4. **inconsistency/duplicate 检查**：未发现新的术语漂移或任务重复；tasks.md 的 stage/depends 依赖链新增节点（T011a→T011b→T019/T020/T021→T023a）与 Dependencies & Execution Order 章节描述一致。

**结论**：本轮为实质性变更（新增 4 个任务、Phase 结构重写、Governance Sync Matrix 新增），已按 spec-analyze 四类扫描方法完成手工等效复核，**0 条新发现**（inconsistency=0/duplicate=0/ambiguity=0/underdefined=0），三份产物（spec.md/plan.md/tasks.md）重新对齐确认。
