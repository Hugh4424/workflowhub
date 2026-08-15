# Mini-task 计划：当前 verification 收据

## 实现范围

只修改官方 verification receipt writer 的 ref 选择和对应聚焦测试；内容寻址分支只对
官方 `writeOfficialComponentReceipt` 生成的 `stage === "verify-code"`、
`producer.component === "verification"` 生效。evidence、implementation、test 和
Stage Agent 等其他 producer 不调用这个 writer，继续使用各自原有固定/内容寻址规则；
不修改页面、M15 事实链、Multica 或公共阶段定义。

## 顺序

1. 在 `runtime/evidence/canonical-receipt-writer.mjs` 保留现有 payload 校验，固定路径冲突
   时选择内容寻址 verification ref。
2. 增加 writer 单元/集成覆盖：冲突、幂等、旧记录不变、目标 ref 预存异字节时失败且
   不覆盖、同一目标的并发创建、hash/schema 失败，并确认其他 receipt 类型没有获得
   verification fallback。
3. 通过官方 handler 读取新 ref 做一次聚焦验证；复用 `receipt()` 的 `task_id`、`stage`、
   `producer.component` 和 raw-bytes `record.sha256` 行为，并覆盖公共 `run` 的缺失/错误
   schema/task identity/stage/producer 边界；writer 覆盖失效嵌套 evidence hash 和不完整
   payload，不新增 handler 分支。
4. 记录实现结果、覆盖限制和延期风险，交回任务 A 重新走 verify-code 公共入口。

## 删除/保留

- 保留旧固定 verification 记录及全部历史记录。
- 新路径仅作为官方 writer 的当前 immutable record；任何已发布 receipt 文件永久保留，
  只有未被消费者使用的 writer 代码分支才可能在另有明确授权时删除。
- 不添加 latest、selector、replacement 或 compatibility bridge。
- 若代码回退，已产生的 immutable receipt 和旧固定 receipt 都保留，不删除、不改写；旧
  handler 只继续消费固定路径，支持新 ref 的 handler 必须由调用方显式传入新 ref。只有
  在没有任何当前消费者且另有明确交付授权时，才可删除未使用的 writer 分支；不能以
  回退为理由清理历史 receipt。

Git 交付：本 mini-task 在 `task/workflowhub/m15-verification-receipt-boundary` 分支
提交 writer、聚焦测试和四份材料；任务 A 负责把该分支 merge 到自己的认证工作树，并
重新执行 verify-code。没有自动 push 或删除分支。
