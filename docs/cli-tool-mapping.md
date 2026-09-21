# CLI 工具与字段映射

本文件是 M17 的宿主接线说明。正式 stage 集合有五项，普通任务按冻结 cohort 选择 pre 五阶段或 post 四阶段路线；它们仍由同一套 WorkflowHub runtime 和仓内 `skills/catalog.yaml` 驱动。CLI 只负责提供身份、执行工具和结构化结果，不复制阶段业务流程。

## 公共工具

| 工具 | 调用方 | 权限边界 | 关键字段 | 缺失语义 |
|---|---|---|---|---|
| `stage-runtime.mjs` | Codex、DSH、人工/CI | 认证仓库、任务存储 | `--project`、`--task`、`--stage`、`outcome_ref` | 身份缺失即失败 |
| `workflowhub-stage-agent-bridge.mjs` | 历史 host 适配层 | 只读兼容旧 task outcome | 显式 task/stage identity 与原件 hash；不参与当前 public run | 旧 `session`/`unavailable` 只作历史 provenance；当前会话不调用 |
| `repo-skills-manifest.mjs` | 维护者、CI | 只读 catalog；写生成物 | 八字段 manifest；origin 数组保留多来源 | 漂移逐字段非零退出 |
| `wh-review` broker | `wh-review` 薄入口 | host-owned config 和 allowlist | provider provenance、review result | provider 不可得为 `unavailable` |

## 正式 stage 能力映射

阶段入口从 `workflows/*/skill-deps.yaml` 读取 `node`、`shell`、`git` 和按条件启用的 host/review/browser 能力。`skills/catalog.yaml` 是技能版本、来源、本地改动、归属阶段和 `metrics_enabled` 的唯一机器真相；`repo-skills.manifest.json` 只由它生成。

- `make-decision`：`node`/`shell`；按需启用 `git`、`wh-review-provider`、搜索能力；结果写 `decision-log.md` 和当前阶段事实。
- `build-spec`（仅 pre/history）：`node`/`shell`/`git`；按需启用 `wh-review-provider`；结果写 `spec.md` 和当前阶段事实。post 的 spec 作者是 build-plan。
- `build-plan`：`node`/`shell`/`git`；按需启用 `wh-review-provider`；结果写 `plan.md`、`tasks.md` 和当前阶段事实。
- `build-code`：`node`/`shell`/`process`/`git`；按真实改动启用测试命令、`wh-review-provider`；结果写代码与测试事实。
- `verify-code`：`node`/`shell`/`git`；按条件启用目标测试、browser-cli、`wh-review-provider`；结果写验证事实，不自动宣称发布。

## 身份与结果

优先显式调用：

```sh
node tools/cli/stage-runtime.mjs status \
  --action=begin --stage=build-code --project=workflowhub --task=<task-id>
```

status 同时返回认证的 `task_type`、`activation_cohort` 和 `topology`；缺 cohort 按 `pre` 路线读取。当前阶段结果由认证 WorkflowHub 会话直接发布。公共入口只需当前 task identity 和实际阶段输入；不要求 bridge、外部 Stage Agent、session、transcript 或 outcome。旧 bridge 结果仅在明确的历史兼容读取中保留原始 provenance，不参与当前 run。WorkflowHub 不扫描或反查 Claude transcript，也不使用旧 session 环境变量猜身份；bridge 不是自动 hook 或跨进程恢复器。

缺失语义固定为：无法判断是 `unknown`；来源存在但当前不可取是 `unavailable`；应有字段或材料缺失是 `missing`。三者不互换，质量缺口保留在事实记录中。
