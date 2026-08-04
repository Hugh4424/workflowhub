# R008 一次性 3rd-review 结果

审查入口：3rd-review 直接调用；未调用 `wh-review`。

| provider | transport | 语义结论 | 备注 |
| --- | --- | --- | --- |
| `cursor/grok` | completed | `sound_with_minimal_repairs` | 24 个生产残留是最大缺口 |
| `kimi/k3` | completed | 有条件认可方向 | 置信度 medium；只看摘要，不能替代代码验证 |

两份审查的共同结论：

- 12 个故障都是真实问题，且属于当前治理范围。
- vNext 四份材料、source digest、LFS fail-closed、事务性 publication、单个 review packet、provider unavailable 语义、manual delivery 边界方向正确。
- 不应新增 accepted projection、legacy attempt writer 回流、额外 review 轮次、新状态或 provider 许可证。
- 全量 reference-audit 的 24 个生产残留必须保持诚实可见，不能 allowlist 伪装为 clean。
- verify map、CLI 误路由、共用 worktree 的覆盖证据不能只靠聚合测试数量推断。

本次酌情处理：

1. 在 CLI 认证写入前拒绝 vNext 的旧 ledger、material revision、step journal 路由，避免错误命令留下 invocation 记录。
2. 增加对应契约测试。
3. 增加 incident → 代码/测试/残留范围映射；该文件是审计材料，不是新的运行时门槛。

本次不处理：

- 不为共用 worktree 增加新的 lease/调度层；当前 deterministic Workspace、快照绑定和 publication lock 已覆盖写入边界，但“执行期间的多 agent 互斥”仍是明确未完成项。
- 不把 24 个旧消费者批量改成新的 bridge；这会重新引入双控制面。后续只能逐项迁移或删除，并保持单一 vNext 读面。
