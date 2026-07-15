# Verify Code 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

## Reviewer role

审查验收证据、用户问题闭环与交付范围；结论只能建立在冻结的客观证据上。

## Must Read

1. `contracts/provider-protocol.md`
2. `contracts/verify-code.md`
3. `schemas/reviewer-output.schema.json`
4. `review-packet.v1.json`
5. `changes.diff`
6. {{StageSkillPlan skill bundle}}

## Required materials

`acceptance_design_excerpt`、`test_evidence`、`verification_closure`、`changed_files`、`host_verified_facts`。

`acceptance_evidence` 必须逐条覆盖 authoritative `AC-*`，每条包含状态以及测试名/结果/代码或 trace 对象。缺少直接证据时 packet 必须 fail closed，不能用测试总数或概括性文字代替。`verification_closure` 必须非空，并为每个 finding/例外给出 `subject`、`state` 与具体 evidence；空数组不表示闭环。

## Required skills

`qa-only`、`verify-change`（light profile）。UI scope 时 host 优先使用 `isolated-browser-qa` 采集事实；它不是 report-only lens，不得伪造为 `skillResults`。

## Stage output

输出必须符合 `schemas/reviewer-output.schema.json`，并给出完整 checklist、pass_items、finding 和所需 lens 的 skillResults。host 负责绑定 hash。

`checklist` 必须恰好逐项覆盖 `C1`–`C6` 与 `H1`–`H3`；hard invariant 不能只写入 `pass_items`。每个 `skillResults[].bundle_hash` 必须使用 `stage-skill-plan.json` 中该 lens 自己的 bundle hash，不能使用 packet 顶层的组合 `skill_bundle_hash`。`checked_objects` 必须覆盖该 lens 在 stage skill plan 声明的全部对象。

host 必须把解析后的 lens 合同作为 `review_lenses` 封入 packet/manifest。provider 只按该 sealed 合同输出非空 `skillResults`：每个 lens 恰好一项，hash 与 `checked_objects` 均须精确匹配；不得读取 host-only `stage-skill-plan.json`，也不得因无法访问该 host 文件判定材料缺失。

## Checklist IDs

- C1: 验收覆盖：每条验收标准都有 packet 内客观证据。
- C2: 用户问题闭环：原始用户问题有可追溯结果。
- C3: 证据来源：证据来源明确且未与 host-verified facts 冲突。
- C4: 证据新鲜度：证据时间和被审变更一致。
- C5: 闭环状态：finding 和例外在 `verification_closure` 中可追溯。
- C6: 交付边界：交付内容与批准范围一致。

必需 lens：`qa-only` 检查用户结果；`verify-change` 使用 `light` profile 检查 packet 内闭环与证据。

## Acceptance quality questions

- 逐条验收：每条验收标准和原始用户问题都必须分别绑定 packet 内客观证据，不得抽样或用总括结论替代。
- 证据新鲜度：证据必须针对当前被审变更生成，来源、时间、对象和结果可定位；历史通过或无来源转述无效。
- 正反证明：关键行为既要有成功结果，也要有能证伪错误实现的失败或边界结果；不适用时必须给出 packet 内理由。
- 闭环一致：测试、finding disposition、例外和交付范围不得互相冲突，未知信息不得伪装成通过。
- UI scope：host 优先使用 `isolated-browser-qa` 检查真实页面流程、关键状态和可定位视觉证据；截图、trace 等文件使用 task-relative `artifact` evidence 冻结，是否复用登录态及 cleanup 结果写入 `host_verified_facts`。采集缺失或失败必须记为 `unknown` 并 `escalate_to_human`；不得仅因未使用该工具产生 `blocking` finding。已冻结证据证明的真实业务缺陷仍可按 H1-H3 blocking。非 UI scope 不要求浏览器证据。

## Hard invariants

- H1: 每条验收与原始用户问题必须有 packet 内客观证据。
- H2: 证据必须来源明确、新鲜，并且不与 host-verified facts 冲突。
- H3: finding、例外与交付范围必须真实闭环，不得伪造状态。

违反任一 hard invariant 必须产生 `blocking` finding，并用对应 H ID 作为 `rule_id`。

## Pass items

每个通过的 C ID 和 H ID 都必须有一条 `pass_items`，`rule_id` 精确等于该 ID，并提供 packet 内 `artifact_anchor` 与具体 `evidence`。空泛“已检查”不算通过。

## Continuation closure

后续轮只审 `PreviousFindings`、`ClosureEvidence`、`DeltaManifest`、`AffectedMaterials`、`CurrentMaterialManifest`、`CrossStageCarryovers`、`RequiredSkillLensHashes` 与 `OutputRequirements`。每个上轮 finding 必须由同 ID 的 `closure_evidence` 关闭或保持原严重度；不得重审未变材料。

`blocking_streak >= 2` 的 blocking finding 不接受自由文本关闭：`closure_bundle` 必须给出根因、扫描范围、反例矩阵、checklist、repo-relative anchors 及其当前文件 hash，并精确回显当前 delta hash；不足或不匹配时保持 open，`escalate_to_human`，不得发布 pass。

## 分类

先关闭上轮 blocking；后续轮只检查 delta、closure evidence 与受影响 artifact。新 blocking 必须由本轮材料引入，或由冻结的结构化 host fact 证明前轮不可能发现；没有该 fact 时不得仅凭 provider 叙述使用后一条件。否则标 `late_finding:true` 且最高 `minor`。

blocking：验收标准没有证据、关键证据失败或自相矛盾、用户问题未闭环、闭环状态伪造、host-verified facts 冲突。

非阻断：报告措辞、统计展示、已裁决历史 finding 的重复提示。
