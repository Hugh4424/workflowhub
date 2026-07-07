# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 33)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 单次调用模型，再补全落盘路径规则和 D2 人工确认状态契约，之后这份规格才可执行。

## Findings

- [blocking] 问题: 3rd-review 调用契约前后自相矛盾 | 建议: 规格前部与数据流多次声明 wh-review 调用 3rd-review 的接口为 `{mode, contract, materials}`，但 FR-THIRDREVIEW-001 的方案A又要求 wh-review 先把合同与材料装配成“一份完整的纯文本审查包”，且 3rd-review 不再接收合同路由信息。两种模型在输入形态、日志验证方式、以及 `contract_path/hash` 的来源上互相冲突，开发方无法判断最终应实现哪一个接口。
- [blocking] 问题: 报告与状态落盘路径缺少可执行定义 | 建议: 多处验收要求依赖“任务目录下固定子路径”“<task-dir>/<task-id>/reviews/”“route-decision 记录文件”“轮次状态文件”，但规格没有定义 task-dir、task-id、固定子路径命名规则、文件名规则、以及首次调用时这些路径如何解析。AC1-3、AC3-1、AC4-2、AC-D4、AC-D10 都依赖该约定，没有这部分就无法稳定实现或验收。
- [blocking] 问题: D2 人工确认门只有行为要求，没有状态与接口契约 | 建议: 规格要求 make-decision/build-plan/verify-code 在 `verdict=pass` 后暂停等待人工批准，但没有定义暂停状态如何表示、由 wh-review 还是 stage 持久化、人工批准后如何恢复、以及 stage-result 需要写入哪些字段。当前裁决枚举只有 `pass/revise_required/escalate_to_human`，无法区分“已通过但待人工确认”与“已通过且可继续”，会直接影响自动推进实现和 AC8-1/AC8-2 的可测性。
- [minor] 问题: 报告 6 章结构的来源说明残留冲突 | 建议: FR-WHREVIEW-004 已把 6 章名称、顺序、语义定死，但 Known Gaps 仍写“6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实”。这会让实现者误以为章节名仍可变，需要清理为单一口径。
- [minor] 问题: 验收项对 route-decision 与合同 hash 的格式要求不完整 | 建议: 规格要求 route-decision 记录“合同源路径 + hash（或版本锚点）”，但没有规定 hash 算法、版本锚点允许的具体格式、以及记录文件的最小字段集合。实现可以各写各的，后续 grep 能过但跨实现不可比，建议补齐最小 schema。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 调用契约前后自相矛盾
- 必须修复：报告与状态落盘路径缺少可执行定义
- 必须修复：D2 人工确认门只有行为要求，没有状态与接口契约

