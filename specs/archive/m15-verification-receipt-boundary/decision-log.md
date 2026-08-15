# Mini-task 决策：当前 verification 收据边界

## 原始需求

M15 的当前代码已经有新的测试、浏览器和 Stage Agent 事实，但旧的
`quality/evidence/verification.json` 已经占用固定路径，导致当前验证结果无法通过官方
`run` 入口被消费。需要补一条合法的当前 verification 收据路径，不能覆盖历史事实。

## 关键事实

- 官方 writer 对固定 `quality/evidence/verification.json` 采用 create-only；旧内容绑定旧快照。
- `verify-code` 的官方 handler 需要 caller 明确提供 `receipts.verification`，并检查当前收据。
- 该消费契约已由当前 `runtime/stage/stage-handlers.mjs` 的 `receipt()` 固定：
  `receipts.verification` 只接受 `quality/evidence/` 下的显式 ref，读取后校验 receipt
  顶层 `task_id`、`stage`、`producer.component`，并从原始 canonical bytes 计算返回给
  下游的 `record.sha256`；具体嵌套证据 hash 由消费该证据的专用校验处理。它不会发现或
  回退到 `quality/evidence/verification.json`。显式传入旧 ref 不等于自动回退；旧 ref 是否
  满足当前 snapshot/verification 质量门由公共 stage handler 的其他 freshness 规则决定，
  本 mini-task 不新增或重定义该门槛。
- `writeOfficialComponentReceipt` 是唯一能走本分支的官方 writer；它内部固定生成顶层
  `stage === "verify-code"` 且 `producer.component === "verification"`。Stage Agent
  outcome 走独立 adapter，不会经由这个 writer 伪装成 verification receipt。
- 当前 M15 需要继续保留旧收据、旧 hash 和旧 provenance；不能删除、覆盖或复制改 hash。
- 这只是 WorkflowHub 收口机制的 enabling 修复；不新增 M16 需求，不改变 Multica。

## 选择

在固定收据已被占用且内容不同的时候，由同一个官方 verification 校验逻辑把新内容写入
`quality/evidence/verification/<sha256>.json`，返回这个内容寻址 ref；公共 `run` 明确消费
该 ref。固定路径仍可被同内容复用，旧内容永远只读。

## 理由与风险

这样保持 create-only，同时让同一 task 在修复后继续完成正式验证。风险是调用方必须显式传入
当前 ref，不能依赖 latest 或 selector；测试必须证明旧收据不变、错误 payload 仍 fail-loud、
新 ref 能被官方 handler 读取。

## 非目标与延期

- 不迁移或修写历史收据。
- 不新增 successor、rebind、selector、latest 指针或第二套 receipt 系统。
- 不修改 M15 页面、监控事实或 Multica；它们由任务 A 继续处理。
