# P7/T015 当前实施与测试事实

- 范围：仅修改 `runtime/evidence/acceptance-evidence-validator.mjs`、`runtime/evidence/freshness.mjs`、`runtime/evidence/quality-store.mjs`。`core/task-close.mjs`、`runtime/stage/**`、`runtime/review/**`、T016 文件和两份冻结测试均未修改。
- 行为：`acceptance.result` 接受旧 `pass/fail/inconclusive/deferred` 加新 `missing/inconsistent/incomplete/unavailable` 八值；拒绝错误会列出全部允许值。`missing` 质量事实可认证六种非终态结果，`pass/fail` 终态仍按原语义。`quality-store` 四种机器类均投影 `incomplete`，无静默 `passed`；非法 `failed` 不作为 `fail` 同义值放行。
- 测试路由：实际改动为单一后端证据功能域，`test-routing-advisor` 判 `feature`，见 `T015-route.json`。`backend-testing` 沿 P7 原 Task 卡选择真实导出/绑定读回、非法结果负控和相邻 deferred 护栏；无网络或外部服务，夹具在冻结测试内。
- 精确命令：`npx vitest run tests/contract/acceptance-result-machine-classes.test.mjs tests/deferred-acceptance-semantics.test.mjs`。当前 RED exit 1，43 collected、13 failed、30 passed；三模块改动后同命令 GREEN exit 0，43 passed（目标文件 28、既有 deferred 护栏 15）。原始身份、stdout/stderr 与冻结测试 SHA-256 见 `T015-red.txt`、`T015-green.txt`。
- 额外消费/负控：直接调用 `validateAcceptanceEvidence` 和 `validateVerifyLeaves`，确认八值与 `pass→passed`、`fail→failed`、六非终态→`incomplete`；`bogus`、`failed`、`null` 均拒绝，非法 verify leaf 亦拒绝，见 `T015-direct-consumer.txt`。三个 `node --check` 与限定 `git diff --check` 均 exit 0，见 `T015-syntax.txt`。
- 限制：本次证明校验器、freshness helper 与 quality-store helper 的消费侧可表达性；不证明 `runtime/stage/**` 生产者已在真实阶段产出机器类，也不证明 quality-store 是当前 vNext canonical writer。未收到可认证的历史 123 条验收记录快照及逐文件 SHA-256 manifest，逐字兼容保持 `unknown/G2`；`quality-fact.v1.status` 三值未改。局部目标 GREEN 不能称完整 AC-27 或 P7 全相位完成。Phase OCR review、finding 处置和正式 task facts 由主会话完成。
