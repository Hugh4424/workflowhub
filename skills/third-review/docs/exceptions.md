# 异常与维护约束

本技能是同步 CLI broker，不是工作流引擎。不要把 prompt 合同、业务 schema、报告、自动修复、自动重派或审查判定加回这里。

| 情况 | 行为 |
| --- | --- |
| 同源 provider | 跳过，`SAME_SOURCE` |
| 未登录、API key 缺失 | 失败，`AUTHENTICATION_FAILED` 或 `AUTH_ENV_MISSING` |
| 网络、TLS、限流 | 保留该 provider 的失败诊断；同层零成功才尝试下一层 |
| CLI 输出格式变化 | `PROVIDER_OUTPUT_INVALID`，不把半截输出当成功 |
| OpenCode 无终态 | 仅在首轮有 `PROVIDER_NO_TERMINAL_RESULT` 和有效 native session 时，同 session 做一次终态恢复；复用同一 cwd/材料，由 managed session、provider process 和 health guardian 的真实状态裁决，不使用 adapter 固定总时限或 idle 时限。恢复结果须是严格 JSON 对象且 session 不变；失败保留原错误并把两次证据留在 runtime 私有状态 |
| `workflowhub-result.v3` 恢复 | 仅 v3 按 [`workflowhub-result-v3.md`](workflowhub-result-v3.md) 恢复：指定的启动/进程死亡/可恢复传输错误最多 fresh execution 一次（`single_round`、`full_only` 不进行此类通用重试）；解析或 schema 错误最多用同一 native session 修复一次；timeout 始终终止。无可续跑 session 时不得 fresh fallback。Cursor 无附件 prompt-only 权限拒绝升级不属于这条策略，见 [`cursor-adapter.md`](cursor-adapter.md)。其他 result protocol 不继承这条策略 |
| 大型 prompt、附件、输出 | broker 不因字节数拒绝或中断审查；附件完整性仍逐项校验，stdout/stderr 流式写入 runtime 私有只读文件并记录 SHA-256，内存只保留解析所需摘要 |
| 附件不可信 | root/source allowlist、相对路径、regular-file、single-link、size、SHA-256 任一不符都明确失败 |
| 附件投递 | 同一请求按 provider 协商 `file_only`/`always_embed`；无法安全转换时 `ATTACHMENT_DELIVERY_UNSUPPORTED`，不得跳过 |
| Antigravity | 只支持单轮 `file_only`；generic `effort`、续跑、`always_embed` 均明确拒绝。AGY 会写原生 profile，默认须设置 `allow_host_state:true` 才能启动；broker 不在本地截断 prompt |
| Pi JSONL | 只接受 wrapper 输出的 session、最终 assistant text、非 retry `agent_end` 和 `agent_settled`；任何缺失、异常 stop reason 或 malformed stream 都是 `PROVIDER_OUTPUT_INVALID` |
| 静默但存活 | `process_alive_at_ms` 仅表示 PID 存活；`last_progress_at_ms` 仅由已解析的 provider 流事件更新，二者不能互相替代 |
| 长时间运行 | health runner 持续观测 provider 流和可选 session probe。probe 不可验证、cursor 静止、dead 状态或 probe 自身异常只写健康诊断，绝不终止活子进程；只有 provider 明确终态、进程实际退出或显式取消才结束审查 |
| 用户取消 | `cancel --source` 终止 provider process tree；`status=cancelled`、错误码 `CANCELLED`，来源写入 `error.source`，并保留 `cancellation_source` 兼容字段 |
| broker 退出 | CLI 信号会终止 provider process tree 并记录 `cancellation_source=broker_shutdown`；每个活跃 runtime 有 detached guardian，以 owner 的 pid、uid、启动标识确认原 broker 已死后才标记 `ORPHANED_BROKER` 并回收。PID、心跳或轮询时间本身不构成回收条件 |
| 并发 provider | 每个 provider 使用私有 workspace；Kimi 的 cwd 可写但 bundle 视图只读，OpenCode/Pi 通过 stdin 接收完整 prompt，不走会截断的 `--file`/Read 链路；provider 不接触真实 repo |
| 下一轮 | 仅续跑上一轮成功且有 session 的 provider；没有 session 明确失败 |
| 原始输出 | stdout/stderr 分别写入 runtime 私有只读文件；ref、session、output、diagnostic、绝对路径不进入 `status` |
| 临时文件 | 每次 `run`/`doctor`/`status` 清理超过 TTL 且无活跃 pid 的目录 |

配置 JSON 只保存命令、模型、推理强度、认证方式和**环境变量名**。绝不能写入 API key 值。`auth.type=native` 使用 CLI 自己的订阅登录态；`auth.type=env` 只从当前进程环境转发列出的变量。

`host_provider` 来自调用方 request，是受约束的宿主信任边界，broker 不会猜测或认证宿主进程。`run` 的 `providers` 是数组；`status` 返回经过脱敏的 runtime 投影，其中 `providers` 是按 provider id 索引的对象。调用方不得把两者当成同一 JSON schema。

每个 provider adapter 必须只做四件事：构造首轮命令、构造续跑命令、解析最终输出、提供 `--version` doctor 命令。新增 provider 不得改变 broker 的路由或 session 逻辑。

同一 provider 只能出现于一个 tier：把同一 CLI 重复列入后续 tier 会制造新的 fresh 调用，违反“失败不静默重派”。Codex 原生 `exec resume` 不接受 `-C` 或 `-s`；它只续跑首轮创建的同一 session，首轮已固定为 read-only sandbox。
