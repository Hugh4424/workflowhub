# 普通任务上下文

当前 WorkflowHub 主会话按认证工作区的当前材料执行。post 材料为 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；旧四材料与旧执行记录只读保留。七类公共工具是 doctor/status/run/review/verify/confirm/authorize；run:execute 只更新导航游标，不恢复旧官方 stage pipeline。质量缺失如实 unknown/unavailable/incomplete，不锁修复，也不证明完成。

上下文仅为业务 identity、受保护 metadata、认证的物理工作区与普通材料 reader/writer；post 才可使用当前 writer。历史读取不能改写旧 task/receipt/review/snapshot 或生成恢复分支。facts.jsonl 的当前 phase_progress 只有 phase_id/task_id/phases_head/recorded_at 导航字段，不额外存储历史序列。
