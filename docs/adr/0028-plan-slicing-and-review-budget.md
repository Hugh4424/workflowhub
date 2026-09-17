# ADR 0028：计划切片 advisory 与 canonical 审查结果复用

- 状态：accepted
- 日期：2026-09-11
- 范围：S4-slicing、S4-review-result-deduplication

## 背景

计划卡的规模、Phase 的验证目标和跨 Phase 文件关系会影响执行成本，但它们不是
新的推进门槛。正式审查结果必须由认证的 canonical attempt/result/report 组成；
结果导入、裸跑和历史记录都不能凭摘要或调用方自报身份成为 current。两类问题
共享材料边界，却拥有不同的 producer、consumer 和失败语义，因此不合并成一个
状态或一条新 gate。

## 决策

### 计划切片

`validatePlanTaskContract` 是切片 advisory 的唯一派生入口。它只读取当前
`spec.md`、`plan.md`、`tasks.md`：精确文件集合、Phase `Verify.Target` 和跨
Phase 文件交集分别形成 `SIG-FILES`、`SIG-TARGETS`、`SIG-CROSS-PHASE`，再现场
派生 `within_budget`、`explained_overage` 或 `unexplained_overage`。完整解释只能
来自当前 `tasks.md` 的精确单行：

`slice-advisory: reason="..."; impact="..."; owner="..."; recheck="..."`

四个值必须非空；原文是唯一持久事实，状态、signals 和 diagnostics 不另存为
current。validator、stage handler 和 status 只消费同一份现场派生结果。无论三态
或 marker 解析是否异常，validator 都显示诊断并精确退出 0；`unexplained_overage`
可以提醒质量，但不能阻断同一工作范围的补充说明或实施。当前交付的最终计划
必须用同一规则自检，且不能为 `unexplained_overage`。

### 正式审查结果复用与导入

`recordSimpleReviewRequest` 是正式供应者派发与 canonical 结果复用的唯一 owner。
它读取认证的 canonical review history，先按 stage/phase/track/kind/origin 查找
immutable attempt/result/report，并以 `review_result_ref`（实现字段为 `result_ref`）
作为同轨道复用依据，再决定是否派发和写入新记录；stage handler 只消费
该 owner 的结果，不重新计算派发次数。材料或普通代码快照变化不会自动重派；只有带有
非空 reason 且 basis 属于 `material_changed`、`provider_changed` 或 `source_recovered`，
并且能与同一审查 lineage 的认证变化事实对应的显式 retry judgment 才会绕过旧结果：
前者要求当前 material id 与旧 attempt 不同，后两者分别要求可信 route identity 发生变化，
或旧 attempt 因无 route 被阻塞而当前 route 已恢复。自由文本 reason 不参与 request key，
换句话不能制造第二次派发。没有 accepted basis 或无法认证变化的 retry 仍复用既有结果并
返回解释。派发前材料、来源或 route 失败写入
`blocked_before_dispatch` 事实；供应者失败、坏输出或覆盖不足保持
`unavailable`/失败/不完整。

`review --action=record` 的 result-only 入口不是第二 writer。它只能导入已存在的
canonical attempt/result/report，并由 `importCanonicalReviewResult` 重新读取和
逐项认证：attempt、result、report 的 ref/hash；request key；task/stage/track/kind、
subject/phase/scope；base/candidate/snapshot/source tree；material id/revision；
authenticated evidence hash；route/policy identity；每个 provider 的 status、
adapter/source/config/model identity、canonical output ref/hash、公开 raw-output
逻辑 ref/hash；以及 report 的 semantic coverage 和 canonical provider aggregation。
全量匹配才返回 `authoritative:true` 的复用结果，绝不创建第二 attempt。缺 ref、
错绑、陈旧或篡改只返回 `authoritative:false`，不发布 canonical result/current fact。

裸 `wh-review` CLI 保留诊断能力，但只写独立 sink；sink 和返回值在边界处都强制
`authoritative:false`，永不进入 canonical review history、阶段 current fact 或产品
结果。没有生产者的 `narrow_diff` 从正式 review kind、计数和路由分支中删除，不
保留兼容旁路。
provider 私有 session/raw 文件不被 WorkflowHub 读取；公开 raw-output ref 只作
逻辑 provenance，不是私有文件读取权限。

## 后果与边界

- 切片超限仍可见但不成为隐式 gate；风险说明修改后 status/validator 立即变化。
- 正式 dispatch、复用、preflight 和 result-only import 使用同一个 canonical history
  owner；合法复用不增加 attempt，显式 judged retry 只对其自身 request key 幂等。
- provenance 字段较多，但删除任一字段都会留下伪造或陈旧导入旁路；认证失败必须
  降格，不得用 `findings: []` 或摘要漂白。
- 本 ADR 不新增 public command、schema、store、selector、snapshot lineage 或第二
  writer；旧 attempt/result/report 只读保留。

## 登记与验证

- S4-slicing owner：`runtime/stage/stage-content-contracts.mjs`；consumer：
  `stage-handlers.mjs`、`stage-runtime status`、当前计划自检 CLI；验证：切片
  contract/status readback。
- S4-review-result-deduplication owner：`runtime/review/review-record-route.mjs` 的
  `recordSimpleReviewRequest`；consumer：stage-runtime 的正式 review action 和
  质量事实消费者；验证：同轨道 canonical 复用、显式 retry 幂等、preflight、
  result-only provenance、bare sink 与 failure-honesty 矩阵，以及一次正式 request
  readback。
- 相关事实：`quality/tests/S4-slicing/` 与本任务 `quality/tests/` 下的 targeted
  review receipts；这些是证据，不是新的推进许可证。
- 删除/替代条件：只有经过审查、保留完整 immutable provenance/唯一 owner 语义的
  canonical review reference 替代机制落地后，才可替代对应入口；不得以兼容双写
  或新旁路过渡。
