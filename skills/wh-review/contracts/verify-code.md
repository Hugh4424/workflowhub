# Verify Code 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

必需 packet 字段：`acceptance_design_excerpt`、`test_evidence`、`verification_closure`、`changed_files`、`host_verified_facts`。

## 检查轴

F1 验收覆盖；F2 用户问题闭环；F3 证据来源；F4 证据新鲜度；F5 闭环状态；F6 交付边界。

1. Acceptance Coverage：每条验收标准和原始用户问题都有 packet 内客观证据。
2. Evidence Authenticity：证据有来源、时间与结果，且未与 host-verified facts 冲突。
3. Workflow Closure：当前阶段 finding、例外和交付边界在 `verification_closure` 中可追溯。

必需 lens：`qa-only` 检查用户结果；`verify-change` 使用 `light` profile 检查 packet 内闭环与证据。

## 增量与分类

先关闭上轮 blocking；后续轮只检查 delta、closure evidence 与受影响 artifact。新 blocking 必须由本轮材料引入或前轮不可能发现，否则标 `late_finding:true` 且最高 `minor`。

blocking：验收标准没有证据、关键证据失败或自相矛盾、用户问题未闭环、闭环状态伪造、host-verified facts 冲突。

非阻断：报告措辞、统计展示、已裁决历史 finding 的重复提示。
