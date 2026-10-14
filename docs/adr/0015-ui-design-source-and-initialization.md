# UI 设计源与初始化保持在五阶段内

## 状态

Superseded — 2026-10-14；当前规范分权由 [C01决定](../../specs/workflowhub-ui-frontend-c01-norm-init-20261014/decision-log.md) 的 ADR-C01-001/003/014 承接。

原状态为 Accepted — 2026-08-22。下列决定正文保留形成时历史依据，不再作为旧两源或单一 design_revision 的 active 路由；现消费者按各适用专业源读取。

WorkflowHub 把项目 `Design.md` 定为由设计 owner 维护的全局设计源，当前 `spec.md` 只记录用于 Preview 的全局 `design_revision`；它不保存 task 页面/状态，也不成为第五份当前材料。新旧项目通过一个 `ui-project-init` 分模式建立最小地基或局部迁移入口，`design-source-readiness` 只生成整份项目设计源的可扫描阅读地图与缺项事实，既不打分也不替代 owner 或 Preview 的人工确认。这样把 UI 设计前移并保留可追溯性，同时拒绝新增后台、全仓自动组件化和第二套设计合同。

## Consumer / owner / removal

Owner 是 UI 交付合同；消费者是 build-spec、现有 plan-design-review 和后续 UI phase handoff。当前退出条件：先把仍活跃的旧源读取及相应登记迁到真实专业源，并保留历史依据；本 ADR 已被取代，不把“所有 UI 任务不再需要任何设计源引用”作为旧路由或技能退役前提。实际删除仍按原 owner、真实 consumer 与授权范围处理，本次只标 superseded，不删除 ADR。
