# Build Spec 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

必需 packet 字段：`raw_requirement`、`decision_log_excerpt`、`acceptance_design_excerpt`、`planning_artifacts`、`host_verified_facts`。

## Checklist IDs

- C1: Problem Fit：规格是否回应原始需求与已批准决策。
- C2: Spec Quality：需求、场景、验收、非目标与边界是否完整且可判定。
- C3: Boundary Safety：概念、状态、接口与 UI 范围是否有明确归属。

UI scope 时增加 `plan-design-review`，检查信息架构、状态、响应式与无障碍；非 UI scope 不得伪造该技能结果。

## Hard invariants

- H1: 原始问题、批准决策与规格必须可追溯，不能伪造来源。
- H2: 验收、边界与非目标必须可判定，不能静默扩大或缩减 scope。
- H3: 概念、状态、接口与 UI 归属不得互相冲突。

违反任一 hard invariant 必须产生 `blocking` finding，并用对应 H ID 作为 `rule_id`。

## Pass items

每个通过的 C ID 和 H ID 都必须有一条 `pass_items`，`rule_id` 精确等于该 ID，并提供 packet 内 `artifact_anchor` 与具体 `evidence`。空泛“已检查”不算通过。

## Continuation closure

后续轮只审 `PreviousFindings`、`ClosureEvidence`、`DeltaManifest`、`AffectedMaterials`、`CurrentMaterialManifest`、`CrossStageCarryovers`、`RequiredSkillLensHashes` 与 `OutputRequirements`。每个上轮 finding 必须由同 ID 的 `closure_evidence` 关闭或保持原严重度；不得重审未变材料。

## 分类

先关闭上轮 blocking；新 blocking 必须由本轮材料引入或前轮不可能发现，否则标 `late_finding:true` 且最高 `minor`。

blocking：原始问题未被规格覆盖、未经批准新增核心概念、关键来源无法追溯、验收不可判定、边界冲突、批准 scope 被悄然缩减或扩大。

非阻断：措辞、展示形式、可兼容演进或证据可增强项。
