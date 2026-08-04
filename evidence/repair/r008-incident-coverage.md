# 12 个故障的覆盖与边界

这张表只记录事实，不作为推进许可证，也不创建新的 workflow 状态。

| 故障 | 当前覆盖 | 证据或残留 |
| --- | --- | --- |
| LFS 快照不一致 | 已覆盖 | `runtime/task/git-worktree-snapshot.mjs`；快照隔离与切断测试 |
| vNext/旧 writer 混用 | 写面已切断 | vNext 官方阶段测试；全量 audit 仍有旧读面残留 |
| accepted 链缺失 | 边界已明确 | vNext 不写 accepted；manual close 只写 delivered/blocked |
| vNext 材料不完整 | 已覆盖 | 四份 Markdown 直接读取；缺失材料 fail-closed |
| verify 材料缺 map | 已覆盖 | `skills/wh-review/scripts/review-materials.mjs` 要求 v2 map；缺失测试存在 |
| 验收字段不完整 | 已覆盖 | acceptance validator 与 AC summary schema 要求结构化字段 |
| provider 输出不稳定 | 已覆盖 | unavailable/invalid 不升级为语义结论；review runner 回归覆盖 |
| start-run 非事务 | vNext 已切断旧 start-run | `startStageRun` 对 vNext fail-closed；官方 runner 先预检后 publication |
| 多 agent 共用 worktree | 仅覆盖写入边界 | deterministic Workspace、source digest、publication lock；执行期互斥仍未实现 |
| close 清理不完整 | 已覆盖 | ignored 物分类与未知物 fail-closed |
| CLI 路由易误用 | 已收窄 | vNext 旧命令在认证写前明确拒绝；稳定 public facade 保留 |
| 正式 close 无降级路径 | 已覆盖 | manual delivery close 是 delivered/formal blocked，不伪造 accepted |

## 当前真实残留

全量 `reference-audit` 仍报告 24 个生产消费者，集中在：

- `materials/current.json`、`requirements/current.json`、`materials/revisions/`
- `material-revision.mjs`
- `phase-review-subject.mjs`、`stage-review-disposition.mjs`、`review-flow-authority.mjs`
- `evidence/phases/`、`reviews/flows/`
- `workflows/build-code/phase-evidence.mjs` 与旧路径检查器

这些不是测试误报；本次不把它们改成 allowlist，也不宣称读面已经完全统一。
