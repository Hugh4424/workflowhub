# 当前材料接口

当前 WorkflowHub 主会话按认证工作区的当前材料执行。post 材料为 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；旧四材料与旧执行记录只读保留。七类公共工具是 doctor/status/run/review/verify/confirm/authorize；run:execute 只更新导航游标，不恢复旧官方 stage pipeline。质量缺失如实 unknown/unavailable/incomplete，不锁修复，也不证明完成。

材料有缺项或坏路径时明确可见，不用完整性 hash、accepted 或旧认证对象放行工作。跨 Phase 只核本 Phase 真实写集；读写保护原路径包含、单链文件与真实 identity。当前材料版本提交变化时游标 stale；普通代码变化不使游标 stale。
