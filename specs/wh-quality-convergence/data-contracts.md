# Data Contracts — wh-quality-convergence

## 1. flow_profile 字段

| 字段 | 值 |
|---|---|
| 名称 | `flow_profile` |
| 所属结构 | stage-result JSON `facts.flow_profile` |
| 取值类型 | string |
| 可选值 | `full_vibecoding` / `fast_make_decision_to_code` |
| 校验规则 | 本轮仅占位不驱动行为，不校验格式，不阻断流程 |
| 消费方 | 下游 stage（build-plan/build-code/verify-code） |
| 兼容性 | 不存在的 stage-result 不包含此字段 |

## 2. receipt 证据契约

| 字段 | 值 |
|---|---|
| 名称 | receipt evidence |
| 输入证据 | (a) git diff SHA, (b) 测试结果的 stdout+stderr+exit code |
| 绑定规则 | `diff_sha` + `test_result_log` 写入 stage-result `facts` |
| 缺失处理 | 证据缺失时 fail-loud，不默认通过 |
| 空diff | 必须声明 `no_code_change` 否则失败 |
| 无测试 | 允许声明 `test_not_applicable`，否则失败 |

## 3. project-key manifest 索引文件

| 字段 | 值 |
|---|---|
| 文件名 | `~/.workflowhub/task-index.json` |
| 写入模式 | 追加式（append-only） |
| 记录结构 | `{task_id, project_key, repo_url, timestamp}` |
| 查询接口 | `lookupProjectKey(taskId)` 返回 project_key |
| 冲突处理 | 写坏/冲突时报错停下，不静默跳过 |
| 现有记录 | 112 条（本机已有数据文件） |

## 4. config.json 配置持久化

| 字段 | 值 |
|---|---|
| 配置文件 | `~/.workflowhub/config.json` |
| 字段名 | `task_dir`（string） |
| 优先级链 | WORKFLOWHUB_TASK_DIR env > config.json > 默认 `~` |
| 未配置默认值 | `~`（用户主目录） |
| 失败路径 | 读不出/格式错时报错，不得套用默认值 |

## 5. stage-result schema（build-plan 新增 facts）

| 字段 | 类型 | 说明 |
|---|---|---|
| `facts.plan_ref` | string | plan.md 相对路径 |
| `facts.tasks` | string | 任务数或阶段标题 |
| `facts.tasks_ref` | string | tasks.md 相对路径 |
| `facts.analysis_ref` | string | 交叉分析报告路径 |
| `facts.research_ref` | string | research.md 或 unavailable |
| `facts.data_contracts_ref` | string | data-contracts.md 或 unavailable |
| `facts.plan_review_ref` | string | plan-eng-review.md 或 unavailable |
| `facts.minimal_path` | string | simplicity-guard 结论或 unavailable |

无跨系统边界的外部 API/网络协议依赖。
