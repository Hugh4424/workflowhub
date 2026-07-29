# Progress

1. 修复起点 `a2d3e74`；继续只修真实发布门禁，模板任务起点仍为 `f98b842`。
2. 基线：retention 12/12；m12+spec 20 通过、4 失败，skip 0。
3. 失败范围：版本句号、Constitution JSON、非行为 gate 规则、两个旧花括号断言。
4. 任务 1 完成：plan/tasks 精确版本、Constitution JSON、versioned_refs JSON 和非行为 gate 已恢复并由 JSON 解析测试锁定。
5. 两项 RED 已记录：版本句号令 m12 2 个版本断言失败；自然语言 Constitution binding 令 JSON 断言失败；均已恢复。
6. 任务 2 完成：spec 断言改为产品身份、禁止 host identity、FR grammar 的等价语义；retention 基线重建为 `f98b842` 全量 H1-H3 映射。
7. 最大风险：可读说明再次替代机器合同，或 retention 映射不再对准真实起点；JSON 合同和真实 validator 负例均已覆盖。
8. 复用既有 unresolved-placeholder 门禁，在 spec 模板加入唯一发布哨兵；未改 core/schema/workflow/wh-review/依赖或发布链。
9. spec 原模板由正式 validator 从错误 `ok: true` 修为 `ok: false`；六套测试 119/119、skip 0，并直接调用 production validator。
10. 独立复审 PASS；Active blocker 仅为无合法 TaskHandle，wh-review 保持 unavailable。
