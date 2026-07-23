# wh-review V2 代码审查闭环记录

审查范围只覆盖 wh-review V2 的路由、broker group 派发、回合策略、报告追踪与
不可用诊断实现。每次都使用冻结的单一 `review-material.md`，不含整仓文件、原始
测试日志或递归上下文。

| 轮次 | provider / 模型 | 材料 | 耗时 / token | 会话状态 | 结论 |
| --- | --- | ---: | --- | --- | --- |
| Pi R1 | `pi/deepseek` / `deepseek-v4-pro`, `max` | 68,280 B | 366,384 ms / 49,486 | `3a88bd41-021e-4bf8-a089-744f2c5349c5` | 已处理 |
| Kimi R1 | `kimi/coding` / `kimi-for-coding`, thinking | 57,007 B | 359,954 ms / unavailable | `2aef8a02-5249-47a3-8f01-1685790c3160` | 已处理 |
| Kimi R2 | `kimi/coding` / `kimi-for-coding`, thinking | 53,923 B | 210,606 ms / unavailable | `46b95ed7-5dab-4be9-a0ae-b4909cf81edd` | 已处理 |
| Kimi R3 | `kimi/coding` / `kimi-for-coding`, thinking | 54,489 B | 212,113 ms / unavailable | `b1f3e411-4f0b-4ae0-8aff-0d42ec65ea9f` | **pass** |

所有会话状态文件均为受信任 broker runtime 生成的
`/private/tmp/3rd-review/<runtime-id>/state.json`；原生 CLI session 文件保持
provider 私有，不伪造路径。Kimi CLI 未返回 token usage，报告如实标为 unavailable。

## 已采纳修改

- 默认 3rd-review tier 遇到未知 provider 现在 fail loud，避免静默跳过错误配置。
- V2 配置按 stage 强制回合模式：decision `single_round`，spec/plan/verify
  `full_on_structural_rework`，build-code `full_only`。因此非代码阶段不能重新引入
  低成本 closure 审查。
- `selectTrustedReviewProviderSelection` 的 `providers` 现在明确为完整 broker
  candidate group，`eligibleProfiles` 才是本地异源 quorum；生产 CLI 将完整 group
  传入 3rd-review，SAME_SOURCE 只由 broker 出具。
- provider attempt 和报告保留 3rd-review 的 `unavailable_diagnostics`，用于追踪
  SAME_SOURCE、认证或启动失败的根因。
- generic `opencode` 与 `opencode/glm` 都在本机 3rd-review 配置中禁用，避免 fallback
  调用当前异常的 OpenCode CLI。

## 驳回或澄清的建议

- Pi 要求 profiles 为空时拒绝 route；不采纳。用户要求未声明 WorkflowHub profile 时
  回退受信任的 3rd-review 默认配置，当前实现保持该 fallback。
- Kimi 将已声明的 `null` pin 视作通配符；不采纳。声明 pin 在派发前已经同 broker
  配置逐项校验，`null` 是精确的“该字段在 broker 也为空”，不是未声明。
- Kimi 要求 V2 必须配置全部 stage；不采纳。缺失 stage 的语义是回退 3rd-review 默认
  tier，仍会审查，不是跳过审查。

## 最终结论

Kimi R3 对最终实现返回 `pass`、无 findings。其确认完整 candidate group 会进入
3rd-review，V2 非代码审查不会走 closure，build-code 保持 fresh full review，且运行
事实、token、时长、状态文件和不可用诊断可追溯。

## 最终测试稳定化复审

全量 Vitest 的 archive/dispatch smoke 在 14 worker 资源争抢下偶发穿过默认 5 秒，
但单跑稳定在 2.40–2.68 秒；根因不是死锁。该测试的唯一改动是显式 timeout `5s → 15s`，
archive、clean-HOME、五阶段派发和 bundle-hash 断言均未改变。Kimi/coding 用 2,726-byte
冻结材料复审，runtime `a827147f-1f1a-4a54-80f7-9c113cc54cfe`，耗时 12,391 ms，返回
`pass`、0 findings。最终 WorkflowHub 全量测试为 102/102 files、956/956 tests；该测试级
timeout 不参与任何 provider 审查的继续或终止判断。
