# Verify Code 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

必需 packet 字段：`acceptance_design_excerpt`、`test_evidence`、`verification_closure`、`changed_files`、`host_verified_facts`。

## 检查轴

- C1: 验收覆盖：每条验收标准都有 packet 内客观证据。
- C2: 用户问题闭环：原始用户问题有可追溯结果。
- C3: 证据来源：证据来源明确且未与 host-verified facts 冲突。
- C4: 证据新鲜度：证据时间和被审变更一致。
- C5: 闭环状态：finding 和例外在 `verification_closure` 中可追溯。
- C6: 交付边界：交付内容与批准范围一致。

必需 lens：`qa-only` 检查用户结果；`verify-change` 使用 `light` profile 检查 packet 内闭环与证据。

## 增量与分类

先关闭上轮 blocking；后续轮只检查 delta、closure evidence 与受影响 artifact。新 blocking 必须由本轮材料引入或前轮不可能发现，否则标 `late_finding:true` 且最高 `minor`。

blocking：验收标准没有证据、关键证据失败或自相矛盾、用户问题未闭环、闭环状态伪造、host-verified facts 冲突。

非阻断：报告措辞、统计展示、已裁决历史 finding 的重复提示。
