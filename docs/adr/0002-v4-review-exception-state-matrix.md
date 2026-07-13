# ADR 0002 — V4 审查异常状态矩阵

**状态**：已采纳（2026-07-13）

## 决策

V4 不把异常伪装成 `pass`、空 finding 或可继续的 session。每个异常都必须保留私有诊断；只有完成、材料完整且 `business_valid=true` 的 provider 输出可以进入 aggregate。重试只由下面明确的状态机拥有，不能由调用者 silent fresh。

| 异常 | retry | 私有诊断/证据 | 阻断结果 |
| --- | --- | --- | --- |
| attachment copy/hash 失败 | 不重投材料 | manifest、hash、broker error | `MATERIAL_INCOMPLETE` |
| 无可用 provider | 不调用 broker | doctor snapshot | `NO_CAPABLE_PROVIDER` |
| provider 非 JSON | 不作为 verdict | raw output hash/ref | `NON_JSON_OUTPUT` |
| raw stdout/stderr hash 或私有引用不一致 | 不作为 verdict | copied raw ref/hash、broker state | `BROKER_RAW_AUDIT_MISMATCH` |
| business-invalid 输出 | 不作为 verdict | schema/合同诊断 | `BUSINESS_INVALID` |
| flow/task lock 占用 | 不抢锁 | owner/pid identity | `review-already-running` |
| disposition 超次数 | 只到配置上限 | attempts/last_error | `DISPOSITION_ATTEMPTS_EXCEEDED` |
| runtime TTL 到期 | 不 fresh | broker `expires_at_ms` | 人工 reset/new flow |
| continuation delta 不匹配 | 不续跑 | frozen hash/baseline 诊断 | 人工 reset/new flow |
| public core/report/index/stage-result 投影中断 | 不调用 provider；仅重放 | public `projection-pending-*` guard、private receipt/flow pending、projection manifest | `PROJECTION_PENDING`；`recover` 重放或 `PROJECTION_RECOVERY_*` fail-loud |

## 实现与测试绑定

- attachment copy/hash：`skills/wh-review/scripts/review-round-facade.mjs` 的 `#attachments()` 只从 private prepare snapshot 复制；3rd-review 的 `lib/attachments.mjs` 对 source size/hash、冻结副本和 continuation 逐次验证。覆盖：`skills/wh-review/scripts/__tests__/review-round-facade.test.mjs` 的 “reads attachments only from the private prepare snapshot”；`/Users/Hugh/Hugh/Project/3rd-review/test/attachments-protocol.test.mjs`。
- 无可用 provider：`ReviewRoundFacade.run()` 生成显式 `NO_CAPABLE_PROVIDER`，不会把调用者提供的 capability 当授权。覆盖：`review-round-facade.test.mjs` 的 “reports every missing candidate...”。
- 非 JSON 与 business-invalid：`#outcome()` 分别投影 `NON_JSON_OUTPUT`、`BUSINESS_INVALID`，且 aggregate 过滤条件固定为 completed + complete + business-valid。覆盖：`review-round-facade.test.mjs` 的 “keeps fenced or business-invalid output out of semantics, aggregate, and continuation”。
- raw audit chain：`BrokerClient` 只从 3rd-review runtime private state 读取相对 raw stdout/stderr ref，复制到当前 round 的 private directory 后复算 SHA-256；`#outcome()` 只接受该私有副本，并将 parsed provider text 写入独立的 `parsed_output_ref`。复制、state hash 或副本 hash 不一致时不能进入 aggregate。覆盖：`broker-client.test.mjs` 和 `review-round-facade.test.mjs` 的 raw audit cases。
- lock：`#acquireLock()` 用 owner/pid/process-start identity；活进程不被抢占，已死或 PID reuse 才可回收。覆盖：`review-round-facade.test.mjs` 的 “records lock ownership...” 和 “takes the shared task lock...”。
- disposition 上限：`#recordDispositionFailure()` 原子写入 attempt 与最后错误；到 `intent.limits.max_disposition_attempts` 后立刻写 human block。覆盖：`review-round-facade.test.mjs` 的 “blocks a flow...” 和 “counts schema-invalid...”。
- TTL：continuation 先调用 broker `status(runtime_id)`，过期就拒绝，不得自动 first round。实现：`ReviewRoundFacade.run()`；覆盖：`review-round-facade.test.mjs` 的 continuation/flow recovery cases。
- delta mismatch：`#prepareUnderLock()` 对 frozen baseline、previous packet/receipt、base revision、contract 和 skill bundle 全部 hash-bind；`validateClosureBundle()` 再绑定 current delta hash 与文件 hash。覆盖：`review-round-facade.test.mjs` 的 closure-bundle case 与 `skills/wh-review/scripts/__tests__/finding-state.test.mjs` 的 “requires an anchored current-delta closure bundle...”。
- public projection：`#publishUnderLock()` 在任何私有 receipt/flow authority 写入前创建公开 `projection-pending-*` guard，并将同一 pending binding 写入私有 receipt/flow。所有 core/report/index/stage-result 写完才清两端 pending 和 guard。`prepare()` 取得 task lock 后首先调用 recovery；`wh-review-cli.mjs recover` 可在进程重启后只重放、绝不调用 provider。`phase-gate.mjs` 和 `ci-chain-check.mjs` 只要看见 guard 就拒绝旧 pass。私有 receipt 不存在时，只有 guard 本身完整、且同一 flow 没有任何 public artifact 的 pre-receipt orphan 可以删除并重试；任一 public artifact、损坏 guard 或私有 binding 不匹配仍分别 `PROJECTION_RECOVERY_RECEIPT_MISSING`、`PROJECTION_RECOVERY_GUARD_*` fail-loud，guard 不清除。覆盖：`review-round-facade.test.mjs` 的 “keeps a public projection guard...” 与 phase-gate/CI guard tests。

## 真实 provider 验收

`scripts/run-wh-review-provider-smoke.mjs` 是唯一显式 opt-in 的真实 provider smoke：普通 `npm test` 不调用 provider。它用当前 host config 和 V4 入口执行：

- Kimi：`wh-review-cli.mjs run`，验证 V4 aggregate 只含有效 outcome；
- OpenCode：`3rd-review.mjs run`，验证 `always_embed` 的实际 stdin/附件路径；
- 两者均从 temporary-index 捕获的未提交 R1/R2 tree 执行，并断言 HEAD 未变；R2 复用同一 runtime/session。要求 R1 `R1_DIFF_MARKER`、R2 `R2_DELTA_ONLY_MARKER`，保存 packet/hash、runtime、session、raw hash 与证据路径。

未设置 `WH_REVIEW_PROVIDER_SMOKE=1` 或原生登录态未由 `WH_REVIEW_SMOKE_ASSUME_NATIVE_AUTH=1` 显式确认时返回 `SKIP`，绝不写 `PASS`。provider 认证、解析、非 JSON、超时等真实失败返回 `FAIL` 并写 `evidence.json`，不能被跳过掩盖。
