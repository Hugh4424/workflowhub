# P10/T021：阶段记录与测试回执的绑定缺口（只读设计）

**结论：现有材料不能证明某份测试回执属于当前这次官方 build-code 阶段执行。** `facts.jsonl` 的 build-code 阶段行只记 Task、材料、代码树、时间及命令/退出码；不记测试回执 ref/hash。相同 Task、树和材料可以运行多次，旧回执也可能同版，故不能用三者相同代替“同一次”。本页是设计缺口，不是实施授权或业务通过结论。

## 当前可回读事实

- 外置 Task `facts.jsonl:3` 只有一条 build-code 阶段行：`created_at=2026-09-27T13:36:23.074Z`、树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`、材料摘要 `385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`，`implementation_completion=partial`、`stage_quality=incomplete`；`evidence.value[0]` 是 `stage-handoff:build-code`、exit 0，没有测试回执地址。该树不是本页可证明的当前工作树；阶段行本身也没有完成判决。
- 阶段行固定键见 `runtime/task/task-store.mjs:221-228`；`evidence.value[]` **只允许** `command/exit_code/failure_signature`，见 `:279-296`。直接给这一行加 receipt 字段会越过冻结结构。
- 已有 AC-26 质量事实 `quality/facts/e79a6a75368ab46eaf3a4d768b7482c46e2a80df32c4fbd7765d7af93fa57a99.json` 指向 acceptance wrapper；wrapper `result=deferred`，其 `refs[0]` 指向 stage-quality 原件；该原件 `subject_fact.status=missing`、`evidence_refs=[]`。另有同树测试质量事实 `quality/facts/d2cd88b1260246a91c10e4e1d2a025adb9b7976228f56d568eb5d2163fc1271f.json` 指向一份通过的 P10 测试回执，但这两份事实同树不证明同次，也不证明 AC-26 完成。
- 当前 `workflows/build-code/case-reconciliation.mjs:305-376` 的 `readCurrentEffect` 已核质量事实→wrapper→stage-quality 原件→其 `evidence_refs` 中的指定测试 receipt ref/hash，并独立读 decision-log；`:535-568` 仍返回 `current_execution_unverified`/业务 `unknown`。已有链证明“这份 AC 原件引用了这份回执”时，也还缺“官方阶段行认证了这次执行”。

## 两种复用路径

| 路径 | 来源与最小写面 | 必要负控与边界 |
| --- | --- | --- |
| **A：优先复用 P5 同次来源和证书** | `runtime/stage/stage-runner.mjs:4633-4670` 已把阶段行 `created_at`、Task/树/材料、测试 receipt ref/hash、质量事实 refs/hash 放在现有不可变 `source` 与 `certificate` 中；`runtime/evidence/freshness.mjs:1033-1066` 已有读回核验。P5 生产者 owner 先完成真实同次发布；P10 owner 仅在 `workflows/build-code/case-reconciliation.mjs` 与其现有合同测试中复用**已认证**结果，交叉核本轮 targeted receipt 与 AC 原件。不改阶段行结构，不建第二账本。 | 缺 source/certificate、坏 hash、旧阶段行时间、旧 receipt、错 Task/树/材料、source 列出的质量事实不含该 AC、同树另一次运行，均保持 `unknown`。当前 P5 真实同次交付尚不能由本页确认；未发布前此路不能宣称效果通过。 |
| **B：复用官方测试质量事实与 AC 原件** | `runtime/evidence/freshness.mjs:733-760` 已认证 `test_receipt` 质量事实及 output；`runtime/stage/stage-runner.mjs:3880-3925` 已验证官方 `facts.tests` 的 receipt/ref/hash 与结果。P10 owner 可只读核同一 receipt 同时出现在测试事实与 AC 原件；这只能缩小缺口。若要进一步证明阶段行同次，须由 stage producer owner 审定 `runtime/stage/stage-runner.mjs` 的既有发布路径，为**现有**不可变原件提供可回读的阶段行时间和测试/AC fact 共同绑定；P10 reader 与对应定向测试随之审定写面。不得把同树两事实并列当成绑定，也不得改冻结 row schema。 | 交换同树旧测试事实、只换 AC 原件、错 receipt hash、旧阶段行时间、两个互相矛盾的事实，都必须拒绝。未形成可认证共同绑定前，只能报告“回执/AC 链分别可读”，不能报告官方同次。任何生产写面及契约变更须由对应 owner 先修材料并独立审查。 |

**推荐 A。** 它已有明确的同次不可变来源、证书和读回验证，P10 只需在既有 reader 中消费；当前若 P5 原件不存在，就保留 `missing_official_stage_binding`/`unknown`，先把 P5 真正发布补齐。无论采用哪条路径，decision-log 的结构重算仍不等于原始用户话语的语义核验，也不等于整张任务完成。本文没有修改产品或 Phase 材料，没有运行验收命令，也不声称获得新增写面许可。

## 勘误：撤回“推荐 A”（2026-09-28）

上段把 P5 同次证书推荐给 **P10 后续定向执行**，这个推荐不成立，不能照做。独立核查 `runtime/stage/stage-runner.mjs:4556-4623`：P5 source 只在阶段行游标 `phase_id=P5`、P5/T007 指定测试命令、P5 phase review、T007 实现差分和人工例外来源等条件同时满足时生成；其 source 明写 `phase_id=P5`、`phase_task_id=T008`（`:4633-4642`）。`runtime/evidence/freshness.mjs:1033-1066` 也按 P5 当前阶段行、P5 游标及该 source 的三份 receipt 读回。它只能认证**那一次 P5 运行**，不能跨运行借给 P10。

实际时间反证：当前 `facts.jsonl:3` 的 build-code 行创建于 `2026-09-27T13:36:23.074Z`，树为 `a8ba4bcc…`；后来的 P10 固定入口回执 `quality/tests/targeted/be3c2242-a877-4b1c-a5eb-e527428a2d41.json` 在 `14:09:41–14:09:47Z` 执行，树为 `870b9217…`，命令是 `targeted-capture.mjs`，也不是 P5/T007 测试。即使将来有真实 P5 证书，除非其 `receipts.tests.ref/sha256` **恰为待核 P10 回执**且其它 P5 专属条件仍真实成立（按现有命令限制做不到），也不能用来证明 P10 同次。跨运行复用会制造假绿。

**修正后的最小方向：** 先保留 `current_execution_unverified`/业务 `unknown`；P10 reader 可继续独立核当前测试质量事实与逐 AC wrapper/nested 原件均引用**同一指定 receipt ref/hash**，但不得因此宣称官方阶段同次。若业务验收确需“官方本次”证明，必须由 **build-code 官方 stage producer owner** 设计并发布 **P10 当次**的不可变来源绑定：同一调用中的新阶段行 `created_at`、Task/树/材料、P10 receipt ref/hash、测试与逐 AC quality fact refs/hash 相互可读，保存在现有 Task `quality/evidence/` 事实体系内，不新增进度账本；P10 reader 独立重读它。计划须先为 `runtime/stage/stage-runner.mjs` 的私有发布点、必要的 `runtime/evidence/freshness.mjs` 认证读路、`workflows/build-code/case-reconciliation.mjs` 与对应定向测试写明 owner、唯一 consumer、替代与删除条件，并经材料修订和独立审查后实施；当前 P10 写面不能单方覆盖 stage producer。负控至少交换同树另一次 P10 receipt、旧阶段行时间、错树/材料、缺一份 AC fact、坏 ref/hash、半写来源；任一均保持 unknown。未证明可复用现有生产者前，不创建新来源对象，也不把 P5 证书当通用机制。
