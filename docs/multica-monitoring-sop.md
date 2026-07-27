# Multica 监控规程：基础口径

这份规程只记录适配器、运行环境和审查结果事实，不把 Multica 的 Issue、run
或评论当成 WorkflowHub 阶段完成证明。

## 每次读取必须显式指定

```bash
multica --profile desktop-api.multica.ai \
  --workspace-id <workspace-id> issue get <issue-id>
multica --profile desktop-api.multica.ai \
  --workspace-id <workspace-id> issue runs <issue-id>
multica --profile desktop-api.multica.ai \
  --workspace-id <workspace-id> issue comment list <issue-id>
```

`<workspace-id>`、Issue、run 和评论 ID 必须写入执行记录。未显式指定
profile 或 workspace 的读取不合格；同机 localhost 连接失败只说明本地
默认配置错误，不能推断远端任务停摆。

## 一次执行记录

| 字段 | 内容 |
| --- | --- |
| 时间 | `<ISO-8601>` |
| profile | `desktop-api.multica.ai` |
| workspace | `<workspace-id>` |
| 目标 | `<project>/<issue-or-run>` |
| 命令 | 完整命令与 cwd |
| 结果 | exit code、读取到的 ID 和状态 |
| 限制 | 未完成的部署或 runner 验证 |

当前监控材料记录过固定 profile + workspace 能读取 Issue、run、评论；本次
实施不把这段历史记录冒充为新的实时回读。若没有同一环境的实际回读证据，
必须写“部署验证未完成”，不能用本地
`node --check` 或历史截图替代。

## 三层验证证据

每次修复登记都要分别在以下三处执行同一条现有官方测试，并记录命令、cwd、
`started_at`、`finished_at`、exit code、runner commit、config path 和 `NODE_PATH`：

1. 源仓库；
2. 每个 active runner 目录；
3. 新启动的 `stage-runtime` 进程。

runner 清单来自宿主 Multica 侧。三处任一缺证据，结论只能是“部署验证未完成”。
仓库中的 `config/workflowhub.yaml` 不是 profile 真相源；Multica profile
以当前宿主 CLI 的配置目录为准（通常是 `~/.multica/`）。本规程不把
WorkflowHub 的 `~/.config/workflowhub/config.json` 冒充 Multica 配置。

## 审查结果分类

attempt 层使用 `completed`、`OUTPUT_INVALID`、`PROVIDER_UNAVAILABLE`、
`TIMEOUT`、`SAME_SOURCE`；finding 层另行记录有效、`invalid_anchor`、
重复和未采纳。未知错误码归 `UNKNOWN` 并告警，不静默归类。失败耗时单列，
不计入有效审查质量分母；不自动重试。分类词汇以
`skills/wh-review/contracts/provider-protocol.md` 为唯一来源。
