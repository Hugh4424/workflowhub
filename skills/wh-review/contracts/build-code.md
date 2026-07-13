# Build Code 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

必需 packet 字段：`unified_diff`、`changed_files`、`acceptance_design_excerpt`、`test_evidence`、`host_verified_facts`。

## Checklist IDs

- C1: Spec：变更是否符合 packet 内设计与验收摘录。
- C2: Standards：变更是否越出允许范围、破坏边界或引入未批准依赖。
- C3: Structural Quality：状态流转、错误处理、原子性、消费者影响和测试证据是否完整。

## Hard invariants

- H1: 行为与批准的设计、验收必须一致。
- H2: 状态流转、错误处理与持久化必须保持原子性，不能半完成。
- H3: 依赖、边界、消费者与关键测试证据不得遗漏或越界。

违反任一 hard invariant 必须产生 `blocking` finding，并用对应 H ID 作为 `rule_id`。

## Pass items

每个通过的 C ID 和 H ID 都必须有一条 `pass_items`，`rule_id` 精确等于该 ID，并提供 packet 内 `artifact_anchor` 与具体 `evidence`。空泛“已检查”不算通过。

## Continuation closure

后续轮只审 `PreviousFindings`、`ClosureEvidence`、`DeltaManifest`、`AffectedMaterials`、`CurrentMaterialManifest`、`CrossStageCarryovers`、`RequiredSkillLensHashes` 与 `OutputRequirements`。每个上轮 finding 必须由同 ID 的 `closure_evidence` 关闭或保持原严重度；不得重审未变材料。

`blocking_streak >= 2` 的 blocking finding 不接受自由文本关闭：`closure_bundle` 必须给出根因、扫描范围、反例矩阵、checklist、repo-relative anchors 及其当前文件 hash，并精确回显当前 delta hash；不足或不匹配时保持 open，`escalate_to_human`，不得发布 pass。

## 分类

先关闭上轮 blocking；后续轮只检查 delta、closure evidence 与受影响 artifact。新 blocking 必须由本轮材料引入或前轮不可能发现，否则标 `late_finding:true` 且最高 `minor`。

blocking：行为错误、遗漏状态、半完成更新、竞态、越界变更、关键验证证据失败或缺失、需求消费点遗漏、结构边界破坏。

非阻断：格式、命名偏好、无关风格建议和非约束性架构意见。
