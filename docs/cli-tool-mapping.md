# 公共工具职责

当前 WorkflowHub 主会话按认证工作区的当前材料执行。post 材料为 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；旧四材料与旧执行记录只读保留。七类公共工具是 doctor/status/run/review/verify/confirm/authorize；run:execute 只更新导航游标，不恢复旧官方 stage pipeline。质量缺失如实 unknown/unavailable/incomplete，不锁修复，也不证明完成。

工作区与命令/记录/Git/锁/回复底座各有明确输入与实际 consumer；当前源码映射见 architecture/move-map.json。private helpers 不是额外 public 流程。确认、质量与 Git 操作授权分别解释，真实失败和 raw 不改写。
