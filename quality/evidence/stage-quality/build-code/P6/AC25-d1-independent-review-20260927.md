# AC-25 d1 pair：独立只读复核

**结论：AC-25 `incomplete`。** 真实 `d1fd1157-3519-4258-88be-a772415f39ca` red/blue pair 的 blue 成员在当前私有 canonical history reader 中读回失败。此文复核既有一次探针及原件；未修改或重跑 production、测试、材料、Task store，也不是公共 review CLI 或正式 verify receipt。

## 原件与身份

- 原探针：[AC25-d1-real-pair-readback-probe.mjs](AC25-d1-real-pair-readback-probe.mjs)；原始 [stdout JSON](AC25-d1-real-pair-readback-20260927.stdout.json)、[stderr](AC25-d1-real-pair-readback-20260927.stderr.txt)、[exit](AC25-d1-real-pair-readback-20260927.exit.txt) 和 [metadata](AC25-d1-real-pair-readback-20260927.meta.json)；事实与来源引用见 [原始诊断](AC25-d1-real-pair-readback-20260927.md)。命令 exit `1`，stderr 空。metadata 绑定 reader SHA-256 `d6363c44b3772b3deddd3d2d7c1272edec8094f8781681e9852fa41489c8ee84`、probe SHA-256 `a8a8f08276b8e76ac909bab0136003c947f0016f303d3bff3f471478d8c850dd`、stdout SHA-256 `8cb2af6b0740707cf81f849b94e52d7e259d61b8153d94ed54a26137c67f61af`。HEAD tree 不代表 dirty worktree 文件字节；上述 hash 绑定实际读取文件。
- TaskHandle 清单含指定 red/blue attempt。blue 原件：`terminal_status=unavailable`、`result_ref=null`；其报告保存 `semantic_status=available`、`coverage=incomplete`。pair 摘要保存 blue `coverage=incomplete`、red `coverage=satisfied`、`partial=true`。blue 报告内 public result 为 `status=available`、`outcome=partial`、`minimum_heterologous=1`；两个 provider completed，Kimi `RATE_LIMITED`。原始 stdout 记录每个已读 attempt/report/provider output 的 ref、字节数和 SHA-256。

## 失败机制

- [reader `runtime/review/review-record-route.mjs:1198-1204`](../../../../../runtime/review/review-record-route.mjs) 使用当前 `prepareSimpleReviewRecord` 重建保存的 blue 报告。本 pair 以其自身 snapshotTree 读回，所以 `allowHistoricalPartialCoverage: scope !== null && attempt.snapshot_tree !== scope.snapshotTree` 为 `false`。
- 同文件 `:1764-1769` 的 `covered` 条件对 partial 使用 **`hasDeclaredQuorum || allowHistoricalPartialCoverage`**。此 blue 已声明 `minimum_heterologous=1`，即 `hasDeclaredQuorum=true`；结合两个完成的 provider 与可用聚合，当前重建给 `coverage=satisfied`。保存值却为 `incomplete`，读者在 `:1204` 抛 `canonical review report binding is invalid`。只把 `allowHistoricalPartialCoverage` 改为 true **不能修复**，因为左侧 quorum 条件已经为 true。
- `covered=true` 还会使 `prepareSimpleReviewRecord` 在 `:1795-1840` 重建 `terminal_status=semantic` 且生成 `result_ref`，而保存的 blue 是 `unavailable/null`。因此仅放宽 coverage 比较或修改一个 flag 会继续错绑终态/结果引用，也可能放过真损坏。

探针把当前 reader 的相对 import 改成同仓库模块的 file URL，仅在原 `canonical review report binding is invalid` 抛错前写入比较值，**继续抛同一个错误**；内存追加私有函数 export。插桩没有改动 `covered` 条件、输入或 TaskHandle 记录。因此它可信地定位这次私有读回失败及第一处不一致；未证明公共 review 路由、完整 pair 读回或后续检查能通过。

## 修复合同与归属

Reader 实现与必要负控归 **CARD-05**；CARD-04 P6/T014 只保留政策消费测试、现有原件与风险登记。最小合同是：对经认证、可识别的旧 pair 写入形态，按旧 producer 语义只读重构并逐字校验原有 attempt/report/provider output/pair 摘要，使此 blue 仍为 `coverage=incomplete`、`terminal_status=unavailable`、`result_ref=null`，pair 仍 `partial=true`；当前 live writer 的覆盖判定不得因历史兼容而被泛化降级。若旧形态无法可靠识别，先保留 fail-closed 并交 owner 明确边界，不凭保存的 `coverage` 字段单独放行。

所需负控：真实 d1 pair 正控；同命名空间缺 red/blue 成员、缺 report/ref/provider output、伪造 coverage 或 semantic/ref、篡改 provider 状态/身份必须 fail-closed；foreign pair 仍可按现有政策略过而不阻断当前请求。现有 T014 合成 pair 6-test GREEN 不覆盖这对真实历史原件。完成前 AC-25 保持 `incomplete`，不得把本次一次私有探针写成官方 readback 通过。
