# P10/T021 本批交接（2026-09-28）

## 实际完成

- 在 `runtime/stage/stage-runner.mjs#runStageEndReflection/withStageRow` 保留最终 `writeStageRow` 的原始返回 `{ref,sha256,value}`，通过非枚举的 `stage_reflection.stage_row_write` 只在本次 JS 调用内传递。成功才有该属性；`stage_row_error` 没有。公开 JSON、阶段行 schema、Task facts 均未增字段。
- 隔离 Task 的定向测试证明返回 SHA 等于当前 `facts.jsonl` 完整行字节（含换行）的 SHA；下一次官方 `run` 替换行后，两次返回 hash 不同，当前行只等于第二次返回。固定回执即使存在，在没有完整官方来源链时，仍没有 `p10_consumption_evidence`，P10 对账维持 `current_execution_unverified` 和业务 `unknown`。
- 这只是 P10/T021 的行身份前置件，**没有**发布消费原件、公开 locator 或认证逐 AC 业务效果；整体 T021 未完成。

## 定向执行原件

| 用途 | 命令 / 原件 | 结果 |
| --- | --- | --- |
| 行身份 RED | `npx vitest run tests/contract/build-code-case-reconciliation.test.mjs -t "ORACLE-P10-T021"`；`red-valid-stage-row.txt` | exit 1；1 目标失败、53 跳过；在有效 `ArtifactDir` 夹具下，最终行已写成功且无 `stage_row_error`，但 `stage_row_write` 缺失 |
| 行身份 GREEN | 同命令、同测试源码；`green-valid-stage-row.txt` | exit 0；1 目标通过、53 跳过 |
| 真正 implementation+固定 tests 输入 | 同目标临时启用当前 implementation receipt；`red-behavior-fingerprint.txt` | exit 1；官方 `run` 在证据核对处报 `test receipt and facts.behavior_fingerprint are not bound`；测试恢复到无 implementation 的局部 GREEN 版本 |

有效 RED 原件 SHA `e2ae9c204c03998530cd6bba60fb1510bdb2b208072ae4b21c5627b111d7ad71`；同源码 GREEN 原件 SHA `a1c0a4802cd5a78539978569d2550328f5658809b6875feeba7432fd808670ad`；指纹失败原件 SHA `edcebd8a85dc6129f8cd5c3c71bf04848663e832fe25393cc94a30781cab5252`。较早的 `red-stage-row.txt` 因隔离夹具没传 `ArtifactDir` 而产生 `post Phase index is missing`，**不是目标 RED**；其后 `green-stage-row.txt` 仅作调试记录，不用于同源码对照。收尾源码 SHA：`stage-runner.mjs`=`706c84a8285ca4dc88b373f8b331cce2f1a245236bc0e29ba3c50198b1d43537`，目标测试=`b26bf8b66ca2da16b0664323b54be1330d0de8be358fd972599a70da26d7cf91`。HEAD `ef920f1fbd415fe87d50930359059b661e141acd`；未提交。两文件 `node --check` exit 0。

## 两处后续材料/写面缺口

1. **官方 `run` 会误拒绝固定回执。** `stage-handlers.mjs#testFacts` 从 `worker.readReceipt` 的 JSON 对象取 `behavior_fingerprint` 放进 handler facts；`stage-runner.mjs#verifyOfficialEvidence:3951-3960` 再单独 `JSON.parse(ctx.task.readRecord(...))` 得到另一个对象，却对 `behavior_fingerprint` 等对象字段用 `!==` 比引用。相同原件、相同值也必然不是同一个对象；本批真实命令已报错。`runtime_profile`、`capability_proof` 同在该循环，需一并检查。最小下一写面须把 `verifyOfficialEvidence` 加入 P10/T021 允许符号（仍在现有 `stage-runner.mjs`），按结构和值核对对象，保留原始 receipt hash/验证器；负控：相同原件两次独立读取可通过，改嵌套值/缺键/多键/错 hash 必拒绝，不能通过复用同对象夹具求绿。本批没有改该未授权符号。
2. **逐 AC → 固定回执映射缺生产来源。** 当前官方 handler 对无 implementation 的输入走缺证据分支；有 implementation 时 `acceptanceCoverageForExecution` 只从已声明的业务场景读取 AC refs，现行 P10 Phase 没有可使固定测试回执自然成为逐 AC 证据的声明/producer。`case-reconciliation.mjs#readCurrentEffect` 要求对应 AC 原件的 `subject_fact.evidence_refs` 含实际固定 receipt ref/hash，当前默认 AC 是 `unknown` 且无该 ref。补完第 1 点后，仍需由 build-plan 界定最小 owner/写面及真正 case→AC 生产映射；不能由 T021 消费 reader 把回执塞进 AC 事实或靠自报字段造通过。

这两点解除、并取得独立审查后，才能继续一份消费原件、可选 `p10_consumption_evidence:{ref,sha256}` 和其错 locator/别次 run/坏 output/AC hash/半写/行替换负控。当前本批无法对原计划其余目标取 GREEN。

## 路线和限制

`test-routing-advisor` 对实际两文件（`runtime/stage/stage-runner.mjs`、`tests/contract/build-code-case-reconciliation.test.mjs`）给 `fullstack/pass`，原因是脚本按顶层目录数分类；实际修改只在后端阶段行返回及后端合同测试，无浏览器、API 或数据库变化。本批据此用 `backend-testing` 的定向真实 Task/固定子进程/官方 run 路线；未跑全量测试。当前测试证明行身份返回与未知口径，不能证明官方真实回执消费、逐 AC 效果或 P10 完成。

宪法对照：F2 的私有窄通路（无公开/持久字段）、F9 的真实失败与未知、F11 的单一现有行写者和 Q1 的质量不冒充完成均满足本批局部改动；Q3 所需独立审查仍由主任务安排，未把本地测试当独立质量裁决。其余条目没有被本批改动触及。
