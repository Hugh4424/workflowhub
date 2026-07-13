# Build Plan 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

必需 packet 字段：`planning_artifacts`、`acceptance_design_excerpt`、`host_verified_facts`、`changed_files`。

## 检查轴

- C1: Traceability：每项需求都有计划项、范围说明与可判定验证证据。
- C2: Executability：阶段粒度、依赖顺序、接口边界、失败模式与回退假设可执行。
- C3: Verification：验证设计能证明行为，不依赖空洞或不可判定的声明。

必需 lens：`spec-analyze` 检查 packet 内规划材料的一致性；`plan-eng-review` 检查工程顺序与风险；`review` 独立检查范围漂移和遗漏。

## 增量与分类

先关闭上轮 blocking；新 blocking 必须由本轮材料引入或前轮不可能发现，否则标 `late_finding:true` 且最高 `minor`。

blocking：需求到计划到验证链路断裂、阶段不可独立执行、依赖倒置或循环、验证不可判定、影响范围漏项、关键失败模式遗漏、治理或 UI 范围缺可验收描述。

非阻断：计划表述、排序建议、非关键风险说明。
