# Build-code Phase P5 Card

## Scope

- T033/T034: digest 两轴拆分。当前仍缺少可证明的 producer/consumer/历史兼容定义；材料明确要求 STOP，未新增第二套摘要或 wire 字段。
- T035/T036: 同指纹熔断。现有 `review-record-route.mjs` 的 canonical reuse/request-lock 已提供窄接入点；补契约测试后确认 blocked quorum result 不重复进入 `runRound`。
- T037/T038: 健康预检被阶段路由消费。现有 `runSimpleReview` 预检结论由 `recordSimpleReviewRequest` 消费并记录 blocked-before-dispatch；补路由测试确认零 provider attempts、零 broker dispatch。
- T039/T040: BR 对外打印超时统一为 `PROCESS_TIMEOUT`，原因保留 `cause_code=PROVIDER_PRINT_TIMEOUT`。
- T041: 以 BR live diff 相关协议测试核验候选落地，不重做既有修法。
- T042: 仅在前序 AC 真实完整时执行一次；当前 T033/T034 未完成，不能宣称 26 AC 全部满足。

## Stop boundary

T033/T034 的 digest producer/consumer/历史兼容定义仍属于 `PLAN-RISK-002`；按 `tasks.md` 与项目 AGENTS.md 停止，不凭空编造摘要、第二套 wire 字段或历史迁移机制。

## Evidence

- T039 RED：`node --test test/provider-failure.test.mjs`，exit 1，目标断言真实失败。
- T035/T036：同指纹 blocked quorum result focused Vitest 1/1 pass，exit 0；未重复调用 `runRound`。
- T037/T038：预检 quorum shortfall 路由 focused Vitest 1/1 pass，exit 0；`provider_attempts=[]`、brokerCalls=0。
- T039/T040 GREEN：同命令 3/3 pass，exit 0；managed lifecycle 19/19 pass。
- T041：`node --test test/attachments-protocol.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs`，79/79 pass，exit 0。
