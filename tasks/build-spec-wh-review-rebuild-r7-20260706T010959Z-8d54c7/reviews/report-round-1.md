# 审查报告 — build-spec-wh-review-rebuild-r7-20260706T010959Z-8d54c7 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

结论：不能进 planning。发现 3 个阻断项：decision-log D4 映射失真、报告 6 章合同自相矛盾、核心 failure/boundary 场景缺失。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/spec.md:313 | 问题: `FR-INTAKE-001` 声称来源于 decision-log D4，但把 D4 的 C5/C6 改写成了“关键假设已记录 / 非目标明确声明”。原始 D4 的 C5/C6 实际是“方向与上游输入一致 / 决策产物格式可机器消费”。这会直接丢失原始要求里的 source-trace 与机器可消费约束，属于 decision-log→spec 的双向追溯断裂。 | 建议: 把 `FR-INTAKE-001` 的 C1-C6 逐条改回与 `tasks/wh-review-rebuild/decision-log.md` D4 完全一致；如果确实要新增“关键假设 / 非目标”检查，只能作为额外条目显式标注新增来源与理由，不能替换 D4 已定案判据。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:209 | 问题: 报告合同未定却被提前写死。`FR-WHREVIEW-004` 把 6 章的名称、顺序、语义都定义为不可更改，但 `Known Gaps` 又明确写明“6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实”。同一份 spec 同时把该合同写成已定案和待核实，规划阶段无法判断哪一版是权威。 | 建议: 二选一并写清：要么先把 6 章正式来源补齐后再固定章节合同；要么在当前 spec 中把章节名降为待确认项，只保留 decision-log 已批准的最小不变量（6 章、落盘、可追踪），禁止同时出现“已定死”和“待核实”两套口径。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:88 | 问题: 核心场景缺少显式失败场景和边界场景。现有 UC-1~UC-7 只覆盖主流程与升级路径，没有把 spec 已要求的 fail-loud 边界写成用户场景，例如缺失 stage 标识、未知 stage、合同缺失、result-file 缺失/不可解析、异源转同源切换。这不满足设计审查合同里“至少一个 failure scenario + 一个 boundary scenario”的硬门槛。 | 建议: 在“用户角色与场景”补至少 1 个失败场景和 1 个边界场景，并与现有 FR/AC 对齐。最小可行补法：新增“缺失 stage 标识时非零退出”和“未知 stage / 结果文件缺失时 fail-loud 或 escalate_to_human”两个 Given/When/Then 场景。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：`FR-INTAKE-001` 声称来源于 decision-log D4，但把 D4 的 C5/C6 改写成了“关键假设已记录 / 非目标明确声明”。原始 D4 的 C5/C6 实际是“方向与上游输入一致 / 决策产物格式可机器消费”。这会直接丢失原始要求里的 source-trace 与机器可消费约束，属于 decision-log→spec 的双向追溯断裂。
- 必须修复：报告合同未定却被提前写死。`FR-WHREVIEW-004` 把 6 章的名称、顺序、语义都定义为不可更改，但 `Known Gaps` 又明确写明“6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实”。同一份 spec 同时把该合同写成已定案和待核实，规划阶段无法判断哪一版是权威。
- 必须修复：核心场景缺少显式失败场景和边界场景。现有 UC-1~UC-7 只覆盖主流程与升级路径，没有把 spec 已要求的 fail-loud 边界写成用户场景，例如缺失 stage 标识、未知 stage、合同缺失、result-file 缺失/不可解析、异源转同源切换。这不满足设计审查合同里“至少一个 failure scenario + 一个 boundary scenario”的硬门槛。

