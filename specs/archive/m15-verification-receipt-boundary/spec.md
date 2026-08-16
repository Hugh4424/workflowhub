# Mini-task 规格：当前 verification 收据

## 用户可观察行为

当官方 verification 收据固定路径不存在时，行为保持不变：写入
`quality/evidence/verification.json`，重复相同内容幂等返回固定路径。

当固定路径已经存在且字节完全相同时，返回固定路径并幂等结束；调用方继续把固定路径
显式传给公共 `verify-code run`。

当固定路径存在但内容不同，官方 writer 必须：

1. 用同一套 verification payload 校验规则验证输入；
2. 按最终 canonical bytes 生成内容寻址路径
   `quality/evidence/verification/<sha256>.json`；
3. 只创建该新记录并返回它的 ref/hash；
4. 不修改固定路径和任何旧记录。

内容寻址目标如果已经存在：字节完全相同则直接幂等返回；字节不同、文件名哈希与内容
不一致或创建竞争无法证明同字节时必须明确失败，不能覆盖、改名或退回旧收据。写入必须
沿用官方 create-only 原子写入和 EEXIST 后读回校验。

canonical bytes 沿用当前 writer 的 `JSON.stringify(value, null, 2) + "\\n"`，不重新排序
字段、不删除尾部换行。新 ref 只能是
`quality/evidence/verification/<canonical-bytes-sha256>.json`。

官方 writer 对 verification item 的 `evidence_refs` 先读取目标记录并校验 sha256；引用
不存在或 hash 不匹配直接失败。公共 run 的消费契约是：调用方把新 ref 放进
`receipts.verification`；现有 handler 的
`receipt()` 读取该显式 ref，校验 `task_id`、`stage`、`producer.component`，并从原始
canonical bytes 计算返回给下游的 `record.sha256`；具体嵌套证据 hash 由消费该证据的
专用校验处理。它不自动发现固定旧 ref。

记录值本身不包含自指 hash 字段；路径中的 sha256 和 handler 返回的 `record.sha256`
都对同一份 canonical raw bytes 计算，所以写入前可计算且二者一致。

公共 `verify-code run` 能消费返回的当前 ref。receipt 顶层 `task_id` 必须等于当前
TaskHandle 的任务身份，`stage` 和 `producer.component` 也必须匹配；缺失 ref、错误
schema 或错误 task identity/stage/producer 仍然明确失败。显式传入旧固定 ref 不会被
自动发现或自动回退；它是否满足当前 snapshot/质量门由既有 handler freshness 规则判定。

## 成功与失败边界

- 成功：新 ref 存在、bytes 的 hash 与文件名一致、旧固定记录 bytes 不变、官方 handler 能
  读取新 ref。
- 失败：payload 不完整、证据引用失效、ref 被覆盖、当前 ref 未显式传给 run，均保持
  fail-loud；不降级成旧收据或假成功。

## 非目标

不改变 verification 项的语义、不改变 stage 质量门、不改变四份主材料、不新增页面能力，
不处理历史数据，不实现 M16。

## 验收标准

- AC-001：固定路径冲突时，新 verification 收据能通过官方 writer 创建并返回内容寻址 ref。
- AC-002：固定路径已存在且 canonical bytes 完全相同时，writer 返回固定路径、不创建
  新记录；旧固定收据保持字节不变，禁止覆盖和伪造 hash。
- AC-003：官方 verify handler 能消费新 ref；公共 `run` 校验正确、缺失、错误 schema、
  错误 task identity/stage/producer，且不会自动发现或自动回退旧 ref；writer 对失效
  evidence hash 和不完整 payload 继续 fail-loud。
- AC-004：内容寻址目标预先存在或并发创建时，同字节幂等、异字节/无法证明同字节失败且
  原文件不变；固定的非 verification receipt 仍保持原有 create-only 行为。
