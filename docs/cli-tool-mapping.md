# CLI 工具与字段映射

本文件是 M17 的宿主接线说明。五阶段仍由同一套 WorkflowHub runtime 和仓内 `skills/catalog.yaml` 驱动；CLI 只负责提供身份、执行工具和结构化结果，不复制阶段业务流程。

## 公共工具

| 工具 | 调用方 | 权限边界 | 关键字段 | 缺失语义 |
|---|---|---|---|---|
| `stage-runtime.mjs` | Codex、DSH、人工/CI | 认证仓库、任务存储 | `--project`、`--task`、`--stage`、`outcome_ref` | 身份缺失即失败 |
| `workflowhub-stage-agent-bridge.mjs` | Claude/宿主适配层 | 只写当前 task outcome | `project_name`、`task_id`、`task_path`、`stage`、`attempt_id`、`agent_run_id` | `session`/`unavailable` 二选一 |
| `repo-skills-manifest.mjs` | 维护者、CI | 只读 catalog；写生成物 | 八字段 manifest；origin 数组保留多来源 | 漂移逐字段非零退出 |
| `wh-review` broker | `wh-review` 薄入口 | host-owned config 和 allowlist | provider provenance、review result | provider 不可得为 `unavailable` |

## 五阶段能力映射

阶段入口从 `workflows/*/skill-deps.yaml` 读取 `node`、`shell`、`git` 和按条件启用的 host/review/browser 能力。`skills/catalog.yaml` 是技能版本、来源、本地改动、归属阶段和 `metrics_enabled` 的唯一机器真相；`repo-skills.manifest.json` 只由它生成。

- `make-decision`：`node`/`shell`；条件启用 `git`、host-subagent、`wh-review-provider`、搜索能力；结果写 `decision-log.md` 和当前 stage outcome。
- `build-spec`：`node`/`shell`/`git`；条件启用 host-subagent、`wh-review-provider`；结果写 `spec.md` 和当前 stage outcome。
- `build-plan`：`node`/`shell`/`git`；条件启用 host-subagent、`wh-review-provider`；结果写 `plan.md`、`tasks.md` 和当前 stage outcome。
- `build-code`：`node`/`shell`/`process`/`git`；按真实改动启用测试命令、host-subagent、`wh-review-provider`；结果写代码与测试事实。
- `verify-code`：`node`/`shell`/`git`；按条件启用目标测试、browser-cli、`wh-review-provider`；结果写验证事实，不自动宣称发布。

## 身份与结果

优先显式调用：

```sh
node tools/cli/stage-runtime.mjs status \
  --stage=build-code --project=workflowhub --task=<task-id>
```

宿主结果必须通过 bridge 提交。`session` 代表已执行结果，必须带 `agent_run_id`、宿主/source 字段、当前 task 和阶段事件；无法取得结果时提交 `unavailable` 并带原因。WorkflowHub 不读取、扫描或反查 Claude transcript，也不使用旧 session 环境变量猜身份。

缺失语义固定为：无法判断是 `unknown`；来源存在但当前不可取是 `unavailable`；应有字段或材料缺失是 `missing`。三者不互换，质量缺口保留在事实记录中。
