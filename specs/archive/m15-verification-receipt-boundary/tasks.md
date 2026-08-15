# Mini-task 执行任务：当前 verification 收据

## 当前范围

- 目标：让官方 writer 在固定 verification 收据冲突后仍能创建一个明确的当前内容寻址收据。
- 不做：M16、历史迁移、页面改版、Multica。
- 真实用户结果：用官方 writer 生成收据，再让 verify handler 读取同一 ref。

## AC 与验证

- AC-001：冲突路径选择新内容寻址 ref；测试覆盖 writer 返回值和文件 hash。
- AC-002：固定路径已存在且 canonical bytes 完全相同时，测试 writer 返回固定路径且不
  创建新记录；同时覆盖旧固定记录不变。
- AC-003：官方 handler 消费新 ref；公共 run 校验合法、缺失、错误 schema、错误 task
  identity/stage/producer，且不自动发现或回退旧固定 ref；writer 校验失效嵌套 evidence
  hash 和不完整 payload。
- AC-004：预先占用或并发创建内容寻址目标时，同字节幂等、异字节/无法证明同字节失败且
  原文件不变；非 verification receipt 仍不能走这个 fallback。

## 最终聚焦测试命令

`npx vitest run tests/official-component-receipts.test.mjs tests/integration/vnext-official-stage-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`

## 质量限制与延期

- 本 mini-task 不证明 M15 页面或真实宿主事件；这些由任务 A 的当前 verify-code 继续验证。
- 异源建议只记录一次；没有终态时保持 unavailable，不循环追 pass。
- 回滚限制：只允许回退代码，不删除任何已发布 receipt；旧 handler 不得把新 ref 当成
  固定 ref 自动发现，恢复时必须再次显式传 ref。
- Git 交付：本分支提交后由任务 A merge；不 push、不删分支，merge 后由任务 A 重新跑
  verify-code。
