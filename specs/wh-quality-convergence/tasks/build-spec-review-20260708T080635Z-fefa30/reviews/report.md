# 审查报告 — build-spec-review-20260708T080635Z-fefa30 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

需先统一阻断语义与 task_dir 优先级，再收紧 flow_profile 和 task-index 的可验收边界。

## Findings

- [blocking] 问题: F4 与失败路径自相矛盾 | 建议: 规格多处声明“全程不引入新的阻断型质量门”“所有质量收敛机制必须是记录+浮现+人工判断”，但 FR-RECEIPT-002、FR-TASKDIR-002、隐性必达 1、AC1/AC4 又要求“报错停下”。这会让 build-code 无法判断到底应阻断流程，还是只记录并交由人工判断。必须统一质量收敛机制的执行语义。
- [blocking] 问题: task_dir 优先级描述冲突 | 建议: 速读卡称 config.json 为主路径、环境变量是可选临时覆盖；FR-TASKDIR-003 明确环境变量非空时优先于 config.json；第 5 节却写“按 config.json → 环境变量覆盖 → 默认值”的优先级链，顺序表达不一致。必须改成唯一顺序，例如 WORKFLOWHUB_TASK_DIR 非空 → config.json task_dir → 默认 ~。
- [minor] 问题: flow_profile 占位字段依据不足 | 建议: 未决 6 已承认 flow_profile 当前无特定真实威胁且不驱动行为。若保留，需明确它写入哪个实体、由哪个阶段写入、何时校验；否则建议移出本轮范围，避免为未来假设提前增加契约面。
- [minor] 问题: task-index 字段命名不够可验收 | 建议: 关键实体只约束语义，不锁定字段名，但 AC3 要求 appendTaskIndex 与 lookupProjectKey 可验证。若字段命名完全交给实现，测试与跨阶段契约会变弱。建议至少固定外部 API 入参/返回结构，内部存储格式可不锁死。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：F4 与失败路径自相矛盾
- 必须修复：task_dir 优先级描述冲突

