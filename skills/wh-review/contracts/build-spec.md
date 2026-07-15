# Build Spec 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

## Reviewer role

审查规格是否完整、可追溯且不越出已批准范围；只基于冻结 packet 和 lens 证据下结论。

## Must Read

1. `contracts/provider-protocol.md`
2. `contracts/build-spec.md`
3. `schemas/reviewer-output.schema.json`
4. `review-packet.v1.json`
5. `changes.diff`
6. {{StageSkillPlan skill bundle}}

## Required materials

`raw_requirement`、`decision_log_excerpt`、`acceptance_design_excerpt`、`planning_artifacts`、`host_verified_facts`。

## Required skills

`plan-ceo-review`、`review`；UI scope 时加 `plan-design-review`。

## Stage output

输出必须符合 `schemas/reviewer-output.schema.json`，并给出完整 checklist、pass_items、finding 和所需 lens 的 skillResults。host 负责绑定 hash。

## Checklist IDs

- C1: Problem Fit：规格是否回应原始需求与已批准决策，并保持需求到规格、规格回到来源的双向追溯。
- C2: Spec Quality：需求、成功场景、失败与边界场景、验收、非目标是否完整且可判定。
- C3: Boundary Safety：概念、状态、接口与 UI 范围是否有明确归属。

UI scope 时 `plan-design-review` 检查信息架构、状态、响应式与无障碍；非 UI scope 不得伪造该技能结果。

## Specification quality questions

- 双向追溯：每项需求和批准决策是否都有规格落点；每个新增概念、行为和验收是否都能回指 packet 内来源。
- 场景完整性：成功、失败与边界场景是否覆盖关键状态转换，且未用实现细节代替用户可观察结果。
- 可判定验收：每条验收是否说明对象、条件与预期结果；不得只检查文件、标题或“已完成”声明。
- 范围与归属：非目标、接口责任、状态所有者和 UI scope 是否明确且相互一致。

## Hard invariants

- H1: 原始问题、批准决策与规格必须可追溯，不能伪造来源。
- H2: 验收、边界与非目标必须可判定，不能静默扩大或缩减 scope。
- H3: 概念、状态、接口与 UI 归属不得互相冲突。

违反任一 hard invariant 必须产生 `blocking` finding，并用对应 H ID 作为 `rule_id`。

## Pass items

每个通过的 C ID 和 H ID 都必须有一条 `pass_items`，`rule_id` 精确等于该 ID，并提供 packet 内 `artifact_anchor` 与具体 `evidence`。空泛“已检查”不算通过。

## Continuation closure

后续轮只审 `PreviousFindings`、`ClosureEvidence`、`DeltaManifest`、`AffectedMaterials`、`CurrentMaterialManifest`、`CrossStageCarryovers`、`RequiredSkillLensHashes` 与 `OutputRequirements`。每个上轮 finding 必须由同 ID 的 `closure_evidence` 关闭或保持原严重度；不得重审未变材料。

`blocking_streak >= 2` 的 blocking finding 不接受自由文本关闭：`closure_bundle` 必须给出根因、扫描范围、反例矩阵、checklist、repo-relative anchors 及其当前文件 hash，并精确回显当前 delta hash；不足或不匹配时保持 open，`escalate_to_human`，不得发布 pass。

## 分类

先关闭上轮 blocking；新 blocking 必须由本轮材料引入，或由冻结的结构化 host fact 证明前轮不可能发现；没有该 fact 时不得仅凭 provider 叙述使用后一条件。否则标 `late_finding:true` 且最高 `minor`。

blocking：原始问题未被规格覆盖、未经批准新增核心概念、关键来源无法追溯、验收不可判定、边界冲突、批准 scope 被悄然缩减或扩大。

非阻断：措辞、展示形式、可兼容演进或证据可增强项。
