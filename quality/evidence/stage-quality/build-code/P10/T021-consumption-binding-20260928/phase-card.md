# P10/T021 Phase Card — 官方 run 消费来源

- 目标：只证明指定 P10 测试回执曾由受信入口执行、且本次官方 `run` 实际消费该回执与对应质量事实。业务效果另判；不称本次 `run` 新跑测试。
- 依据：当前 `spec.md`、`phases/index.md`、`phases/P10.md`，以及 `T021-material-independent-review-20260928.md`。覆盖 FR-32/33、AC-32/33 的来源绑定部分。
- 产品写面：`runtime/stage/stage-runner.mjs#runStageEndReflection/#withStageRow/#runStage/#runOfficialStage`，`runtime/evidence/freshness.mjs` 私有认证 reader，`workflows/build-code/case-reconciliation.mjs` 显式 reader 参数；测试仅 `tests/contract/build-code-case-reconciliation.test.mjs` 与 `tests/integration/vnext-official-stage-run.test.mjs`。
- 兼容边界：只有 P10/T021 成功发布、读回一份内容寻址消费原件后，公开结果可选 `p10_consumption_evidence:{ref,sha256}`。非 P10、旧调用方无该字段或无 locator 时保留 `current_execution_unverified`；不改阶段行字段、公共命令、P5 证书、capture 执行记录或旧原件。
- 测试路线：预判 backend/feature；先在两份定向测试补正控和错 locator、错回执、坏原件、缺逐 AC、阶段行替换与写行失败等负控，取真实目标 RED；最小代码后同目标 GREEN，并检查相邻消费者。`backend-testing` 核原始回执→output→manifest→reporter 与实际写行字节。具体 fixture 以测试中现有隔离 Task 为准。
- 停止条件：需要扩大产品写面、无法从本次最终 `writeStageRow` 返回取得行身份、无法认证实际输入 receipt 或逐 AC fact，或只靠自报字段才能判真；记材料缺口，不造旁路。
- 交付状态预期：报告本项来源认证是否可用、定向测试结果、原始证据与限制；整个 P10 和业务效果仍需独立验收。
