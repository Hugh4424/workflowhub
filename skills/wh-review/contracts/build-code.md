# Build Code 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

必需 packet 字段：`unified_diff`、`changed_files`、`acceptance_design_excerpt`、`test_evidence`、`host_verified_facts`。

## 检查轴

1. Spec：变更是否符合 packet 内设计与验收摘录。
2. Standards：变更是否越出允许范围、破坏边界或引入未批准依赖。
3. Structural Quality：状态流转、错误处理、原子性、消费者影响和测试证据是否完整。

## 增量与分类

先关闭上轮 blocking；后续轮只检查 delta、closure evidence 与受影响 artifact。新 blocking 必须由本轮材料引入或前轮不可能发现，否则标 `late_finding:true` 且最高 `minor`。

blocking：行为错误、遗漏状态、半完成更新、竞态、越界变更、关键验证证据失败或缺失、需求消费点遗漏、结构边界破坏。

非阻断：格式、命名偏好、无关风格建议和非约束性架构意见。
