# CARD-02 build-plan 合并审查回溯核验（D-030）

日期：2026-09-22。只读核验 CARD-02 已有原件；未重跑 provider，未改 CARD-02。本文是 CARD-05 的研究证据，不替代 CARD-02 的正式质量事实。

## 核验口径与结果

母 PRD 的 ① 要求：`build-plan` 完成后、`build-code` 开工前**一次**合并审查，同时覆盖 `spec.md` 与 Phase 文件，并包含原 spec 审查（需求翻译完整性、验收可执行、架构合理）和原 plan 审查（依赖正确、并行声明、写集）。CARD-02 的 `task.json` 无 `activation_cohort` 字段，按当时拓扑默认 **pre**；产物是 `spec.md`、`plan.md`、`tasks.md`。其审查不能自动证明 post 的实体 `phases/P<n>.md` 交付。

| 核验项 | 结论 | 当前可核对事实与边界 |
| --- | --- | --- |
| 真实独立审查发生 | **pass** | 任务库有两条 `build-plan` canonical attempt：`6b655880-...` 绑定旧 revision `fe45e597...`；`9caff97a-...` 绑定 revision `62dde9e7...`。后一条 `dispatch_state=dispatched`、`terminal_status=semantic`，4 个异源 provider 均 `completed`，result/report 原件可读；其 result 有 12 条 finding。两条是不同材料修订，不能写成全任务只派发过一次。 |
| 送审材料与两类质量核心 | **partial** | 后一份 finding 指向 `materials/04-draft_plan.md`、`materials/05-draft_tasks.md`，实质发现依赖图、修改文件与 gate 命令不一致、RED 被既有失败污染、与已批准 spec 的 6–8 技能约束冲突。这证明计划/依赖/测试可执行性至少部分被审；原件不能证明 `spec.md` 的需求翻译完整性、AC 可执行与架构合理三项全部被独立检查。CARD-02 没有 post 实体 Phase 审查。 |
| 时机与一次性 | **partial** | 后一审 provider 首路开始约 `2026-09-20T23:23:28Z`、末路完成约 `23:31:20Z`；`build-plan` stage row 在 `23:54:58Z` 发布，故这次审查发生在 stage **收口前**。审查结果随后被更晚 material revision `1a45d208...` 的 review quality fact 引用；不等于 reviewer 看过最终字节。现有原件没有首次 `build-code` 编辑时点的独立记录，不能完整证明“build-plan 完成后、build-code 开工前”这一严格顺序。 |
| 命令、exit、output | **partial** | canonical attempt/result/report 与 4 个 provider 输出原件存在，足以证明派发和语义输出；未在这些原件中定位到发起审查的完整 CLI 命令及其进程 `exit_code`。`terminal_status=semantic` 和 provider `completed` 不能改写为 CLI `exit=0`。 |
| ① 的完整验收 | **missing** | post 合并审查须覆盖当前 `spec.md` 与每份实体 Phase。CARD-02 的 pre 审查及旧材料无法满足该条件；CARD-05 仍需核对自身 build-plan 的真实合并审查，不得因“CARD-02 提前做过”缩减验收。 |

## 原件指针

任务库：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-02-20260919/`。

- 后一审 attempt：`quality/reviews/attempts/9caff97a-b0b0-5b65-ac14-12bee4f79c24/attempt.json`；result：`quality/reviews/results/build-plan-simple-9caff97a-b0b0-5b65-ac14-12bee4f79c24.json`；报告：`quality/reviews/reports/build-plan-simple-9caff97a-b0b0-5b65-ac14-12bee4f79c24.md`。
- 前一审 attempt：`quality/reviews/attempts/6b655880-227d-5169-a255-d03e97802531/attempt.json`；它绑定不同修订，只作历史对照。
- 当前后继 quality fact：`quality/facts/e66bf48705de2e6d801649d48dab1353a737723b649c26afb965bf6b8cffb13a.json` 引用后一审 result，但绑定更新的 material revision；`quality/evidence/handoff/build-plan.md` 记 stage `completed`、reflection `degraded`，自身标 `non_authoritative`。
- CARD-02 归档决定 `specs/archive/workflowhub-thin-core-card-02-20260919/decision-log.md` 的 T-075 及 CARD-05 当前 `decision-log.md` 的 D-030/OI-032 解释本次核验义务和正式 run 未验证的限制。

结论：CARD-02 的确完成过独立 `build-plan` 语义审查，且发现了计划层真实问题；把它当作 CARD-05 ① **完整通过**的证据不成立。CARD-05 对 ① 的回溯核验完成，本项验收结论为 **partial**，其 post 实体 Phase 审查、严格时序及命令/exit 原件保持 **missing**。
