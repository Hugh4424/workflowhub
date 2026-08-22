# UI 设计源与初始化保持在五阶段内

## 状态

Accepted — 2026-08-22

WorkflowHub 把项目 `Design.md` 定为由设计 owner 维护的全局设计源，当前 `spec.md` 只记录用于 Preview 的全局 `design_revision`；它不保存 task 页面/状态，也不成为第五份当前材料。新旧项目通过一个 `ui-project-init` 分模式建立最小地基或局部迁移入口，`design-source-readiness` 只生成整份项目设计源的可扫描阅读地图与缺项事实，既不打分也不替代 owner 或 Preview 的人工确认。这样把 UI 设计前移并保留可追溯性，同时拒绝新增后台、全仓自动组件化和第二套设计合同。

## Consumer / owner / removal

Owner 是 UI 交付合同；消费者是 build-spec、现有 plan-design-review 和后续 UI phase handoff。若所有 UI 任务都不再需要项目设计源引用，先迁移消费者，再删除本 ADR 与对应技能登记。
