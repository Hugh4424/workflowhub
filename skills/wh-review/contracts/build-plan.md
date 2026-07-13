# Build Plan 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

必需 packet 字段：`planning_artifacts`、`acceptance_design_excerpt`、`host_verified_facts`、`changed_files`。

## Checklist IDs

- C1: Traceability：每项需求都有计划项、范围说明与可判定验证证据。
- C2: Executability：阶段粒度、依赖顺序、接口边界、失败模式与回退假设可执行。
- C3: Verification：验证设计能证明行为，不依赖空洞或不可判定的声明。

必需 lens：`spec-analyze` 检查 packet 内规划材料的一致性；`plan-eng-review` 检查工程顺序与风险；`review` 独立检查范围漂移和遗漏。

## Hard invariants

- H1: 每项需求必须有计划项、范围与可判定验证证据。
- H2: 依赖顺序不得倒置或循环，阶段必须可独立执行。
- H3: 关键失败模式、接口边界与影响消费点不得遗漏。

违反任一 hard invariant 必须产生 `blocking` finding，并用对应 H ID 作为 `rule_id`。

## Pass items

每个通过的 C ID 和 H ID 都必须有一条 `pass_items`，`rule_id` 精确等于该 ID，并提供 packet 内 `artifact_anchor` 与具体 `evidence`。空泛“已检查”不算通过。

## Continuation closure

后续轮只审 `PreviousFindings`、`ClosureEvidence`、`DeltaManifest`、`AffectedMaterials`、`CurrentMaterialManifest`、`CrossStageCarryovers`、`RequiredSkillLensHashes` 与 `OutputRequirements`。每个上轮 finding 必须由同 ID 的 `closure_evidence` 关闭或保持原严重度；不得重审未变材料。

`blocking_streak >= 2` 的 blocking finding 不接受自由文本关闭：`closure_bundle` 必须给出根因、扫描范围、反例矩阵、checklist、repo-relative anchors 及其当前文件 hash，并精确回显当前 delta hash；不足或不匹配时保持 open，`escalate_to_human`，不得发布 pass。

## 分类

先关闭上轮 blocking；新 blocking 必须由本轮材料引入或前轮不可能发现，否则标 `late_finding:true` 且最高 `minor`。

blocking：需求到计划到验证链路断裂、阶段不可独立执行、依赖倒置或循环、验证不可判定、影响范围漏项、关键失败模式遗漏、治理或 UI 范围缺可验收描述。

非阻断：计划表述、排序建议、非关键风险说明。
