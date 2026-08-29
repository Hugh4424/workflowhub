# 实施计划

## 方案

1. 先冻结本 mini-task 四份材料，并进行一次 `mini_task.design` 异源审查。
2. 修改 acceptance evidence validator、quality store、freshness、verify-code handler、stage-runner 和 AC summary schema/投影，使四种结果的含义一致。
3. 添加或调整最小聚焦测试：合同枚举、verify-code 分类、stage-runner 结果映射、freshness、quality store、AC summary schema/投影、普通 close 不放行；逐项断言四种结果在每个消费点都不丢失、不变成 pass，且 `missing` 只映射为 deferred。
4. 记录当前快照、测试命令、oracle、实际结果、逐条 AC trace、coverage limits、跳过理由和剩余风险。
5. 进行一次 `mini_task.implementation` 异源审查；若有有效 finding，只修一次并重新跑受影响的聚焦测试。
6. mini-task 交付后，把父任务恢复到合并后的代码快照，重新绑定必要事实；不自动进行父任务最终 close。

## 回滚/中止

若设计审查或实施审查发现不能保证旧记录可读，立即停止合并和父任务重绑定；保留当前 branch、四份材料和已写入质量事实。若新枚举还没有写入记录，可回退代码并跑旧合同聚焦测试；若已经写入，则只允许回到仍能读取新值的兼容代码，不能删除、覆盖或重写记录。

## 风险控制

- 结果枚举扩展必须贯穿所有消费点，避免只改 validator 造成运行时不一致。
- `inconclusive` / `deferred` 永远不是 `passed`，避免质量门槛被绕过。
- 既有历史 `pass` / `fail` 数据保持可读，避免迁移和历史重写。
- 只跑已影响模块的测试，避免再次消耗约六分钟的全量测试。
