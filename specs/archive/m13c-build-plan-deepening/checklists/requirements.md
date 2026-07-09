# Requirements Quality Checklist — m13c-build-plan-deepening

> 由 spec-specify 步骤产出，随 spec.md 一同落盘。
> 所有条目均为记录+浮现语义，不阻断推进（CONSTITUTION F4/F5）。

---

## 内容质量

- [x] 无实现细节泄露（无编程语言、框架、API 名称）
- [x] 聚焦用户价值与业务需求
- [x] 非技术干系人可读
- [x] 所有必填章节已完成（速读卡 / 正文 / 附录三层）

## 需求完整性

- [x] 所有 [NEEDS CLARIFICATION] 标记已解决（无残留）
- [x] 所有功能需求可测试、无歧义
- [x] 成功标准可度量（AC 逐条可 grep 验证）
- [x] 成功标准不含实现细节
- [x] 所有验收场景已定义（AC-01 至 AC-19）
- [x] 边界情况已标识（Known Gaps、OUT scope 明确列出）
- [x] 范围已明确界定（IN/OUT scope 列表）
- [x] 依赖和假设已记录（handoff required_reads、D1-D10 决策记录）

## 功能就绪

- [x] 每条功能需求有明确验收标准（FR 与 AC 一一对应）
- [x] 用户场景覆盖主要流程（场景 4.1-4.9 覆盖全部 FR 域）
- [x] 功能满足成功标准中定义的可度量目标
- [x] 无实现细节泄漏进规格书

## FR 格式检查

- [x] 所有 FR 使用 FR-{DOMAIN}-NNN 格式
- [x] DOMAIN 列表：RESEARCH / DATACONTRACTS / SIMPLICITY / PLANREVIEW / ANALYZE / TASKS / REGISTRY / TASKDIR
- [x] 每个 FR 至少有一条 Given/When/Then 场景

## Spec-Purity grep 结果

- [x] 无代码块（``` 包围块）：pass
- [x] 无具体文件路径（/Users/ 或 ./ 前缀）：pass（spec 中的路径均为相对约定路径，非绝对路径）
- [x] 无 shell 命令特征（$、&&、| ）：pass

## Decision-Log 覆盖率

- [x] D1（task_dir）→ FR-TASKDIR-001/002
- [x] D2（清理误建）→ 无需 FR，流程修正
- [x] D3（复用 3rd-review）→ FR-PLANREVIEW-003
- [x] D4（记录+升级人工）→ FR-PLANREVIEW-002, FR-DATACONTRACTS-002
- [x] D5（STOP/Knowledge 软要求）→ FR-TASKS-002
- [x] D6（Knowledge task.md 不做）→ OUT scope
- [x] D7（外部调研跳过）→ FR-RESEARCH-003
- [x] D8（stage-step-audit follow-on）→ OUT scope / Known Gaps
- [x] D8.1（grill-with-docs 大白话）→ 已在 M13b 执行，无需 FR
- [x] D9（simplicity-guard）→ FR-SIMPLICITY-001/002, AC-19
- [x] D10（大白话系统性补丁 follow-on）→ OUT scope / Known Gaps

## AC 计数

- AC 总数：19（AC-01 至 AC-19）
- FR 总数：16（FR-RESEARCH×3, FR-DATACONTRACTS×2, FR-SIMPLICITY×2, FR-PLANREVIEW×3, FR-ANALYZE×2, FR-TASKS×2, FR-REGISTRY×1, FR-TASKDIR×2）

## Known Gaps（有意留白）

- plan-reviewer 调用路径（verifiers/vibecoding/）待 build-code 核实
- task_dir 解析器实现模块接口留待 build-plan 确定
- D8/D10 follow-on 任务尚待用户批准单独立项

## 自检汇总

| # | 检查项 | 结论 |
|---|--------|------|
| 1 | spec-ladder 档位已声明且有依据 | pass |
| 2 | 所有 FR 使用 FR-{DOMAIN}-NNN 格式 | pass |
| 3 | 每个 FR 至少有一条 Given/When/Then 场景 | pass |
| 4 | 五章硬门完整 | pass |
| 5 | spec↔decision-log 覆盖率 | pass |
| 6 | 无 [NEEDS CLARIFICATION] 残留 | pass |
| 7 | Known Gaps 段存在 | pass |
| Purity | 无代码块/绝对路径/shell 命令 | pass |
