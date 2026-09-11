# ADR 0028：计划切片 advisory 与正式审查预算唯一裁决

- 状态：accepted
- 日期：2026-09-11
- 范围：S4-slicing、S4-review-budget

## 背景

计划卡的规模、Phase 的验证目标和跨 Phase 文件关系会影响执行成本，但它们不是
新的推进门槛。正式审查则必须有一个可认证的预算 owner；结果导入、裸跑和历史
记录都不能凭摘要或调用方自报身份成为 current。两类问题共享材料边界，却拥有
不同的 producer、consumer 和失败语义，因此不合并成一个状态或一条新 gate。

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

### 正式审查预算与导入

`recordSimpleReviewRequest` 是正式供应者派发的唯一 owner。它按固定顺序读取
canonical attempt history，执行 `validateReviewBudget`，先查完全匹配的 immutable
结果复用，再决定是否派发和写入 attempt/result/report；stage handler 只消费该
owner 的结果，不重新计算或覆盖预算。派发前材料、来源或 route 失败写入
`blocked_before_dispatch` 事实，provider 调用数和预算计数均为零；供应者失败、
坏输出或覆盖不足保持 `unavailable`/失败/不完整。

`review --action=record` 的 result-only 入口不是第二 writer。它只能导入已存在的
canonical attempt/result/report，并由 `importCanonicalReviewResult` 重新读取和
逐项认证：attempt、result、report 的 ref/hash；request key；task/stage/track/kind、
subject/phase/scope；base/candidate/snapshot/source tree；material id/revision；
authenticated evidence hash；route/policy identity；每个 provider 的 status、
adapter/source/config/model identity、canonical output ref/hash、公开 raw-output
逻辑 ref/hash；以及 report 的 semantic coverage 和 canonical provider aggregation。
全量匹配才返回 `authoritative:true` 的复用结果，绝不创建第二 attempt 或消耗新
派发回合。缺 ref、错绑、陈旧或篡改只返回 `authoritative:false`，不发布 canonical
result/current fact。

裸 `wh-review` CLI 保留诊断能力，但只写独立 sink；sink 和返回值在边界处都强制
`authoritative:false`，永不进入任务预算历史、阶段 current fact 或产品结果。没有
生产者的 `narrow_diff` 从预算 kind、计数和路由分支中删除，不保留兼容旁路。
provider 私有 session/raw 文件不被 WorkflowHub 读取；公开 raw-output ref 只作
逻辑 provenance，不是私有文件读取权限。

## 后果与边界

- 切片超限仍可见但不成为隐式 gate；风险说明修改后 status/validator 立即变化。
- 正式 dispatch、复用、preflight 和 result-only import 使用同一个 canonical history
  owner；合法复用即使预算耗尽也不增加 attempt。
- provenance 字段较多，但删除任一字段都会留下伪造或陈旧导入旁路；认证失败必须
  降格，不得用 `findings: []` 或摘要漂白。
- 本 ADR 不新增 public command、schema、store、selector、snapshot lineage 或第二
  writer；旧 attempt/result/report 只读保留。

## 登记与验证

- S4-slicing owner：`runtime/stage/stage-content-contracts.mjs`；consumer：
  `stage-handlers.mjs`、`stage-runtime status`、当前计划自检 CLI；验证：切片
  contract/status readback。
- S4-review-budget owner：`runtime/review/review-record-route.mjs` 的
  `recordSimpleReviewRequest`；consumer：stage-runtime 的正式 review action 和
  质量事实消费者；验证：唯一预算、复用、preflight、result-only provenance、
  bare sink 与 failure-honesty 矩阵，以及一次正式 request readback。
- 相关事实：`quality/tests/S4-slicing/`、`quality/tests/S4-review-budget/` 和
  `quality/evidence/S4-review-budget/formal-request-provenance.json`；这些是证据，
  不是新的推进许可证。
- 删除/替代条件：只有经过审查、保留同等三信号/三态现场派生或完整 immutable
  provenance/唯一 owner 语义的替代机制落地后，才可替代对应入口；不得以兼容双写
  或新旁路过渡。

