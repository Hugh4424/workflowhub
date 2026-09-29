# P10/T021 固定回执结构值核对：独立只读审查

结论：**本次局部修复范围内无阻断问题**。它修复了固定测试回执与事实由两次 JSON 解析产生、内容相同但对象引用不同而被拒绝的错误。此结论只适用于 `verifyOfficialEvidence` 的三类结构字段比较；逐场景验收来源、消费原件、业务效果及 P10/T021 完成都仍为 `unknown` / 未完成。

## 核对范围与证据

- 当前正式 P10 材料 `specs/workflowhub-thin-core-card-04-20260919/phases/P10.md:126` 将生产写面限为 `runtime/stage/stage-runner.mjs#verifyOfficialEvidence` 的回执与 facts 字段比较。当前生产差异在该函数仅增 `structuredFields`，对 `runtime_profile`、`capability_proof`、`behavior_fingerprint` 两侧均为对象/数组时使用既有 `canonicalJson`；其他字段继续严格 `!==`。未改 schema、回执 hash、输出 hash、树或命令核对。整个 `stage-runner.mjs` 另有并行 P5 改动；本结论不审查那些改动。
- `red-final.txt` 与 `green-final-all.txt` 采用相同最终目标与测试源码：旧比较 3 失败（exit 1），修后 3 通过（exit 0）。两文件 SHA-256 分别为 `9ebfd83c5d65ebe83d7931b8560a38f977aeb9a00d4259ea78afda97bda4534a`、`d2ab39270213129504450efa00e9b501226a07dfb552b4d8d77a468189209b55`，现场重算相符。
- `tests/contract/build-code-case-reconciliation.test.mjs` 的目标在隔离 Task 调用真正 `runCapture` 得固定回执，再两次读取 JSON；通过案例覆盖真实 `behavior_fingerprint`，错嵌套 `run_id`、业务目录 `catalog_sha256` 与旧树均拒。该文件另有官方 `run` 目标，检查固定回执成为 `risk_tests_fresh` 测试事实，同时逐 AC 未变为 `passed`。
- `tests/integration/vnext-official-stage-run.test.mjs` 的独立 canonical fixture 覆盖 `runtime_profile` 和 `capability_proof` 同值、不同引用的正例，以及错权限、错 proof hash 的负例。`adjacent.txt` 原始输出 4 通过（exit 0），覆盖非零回执不能报通过、嵌套回执路径、错误输出字节仍拒；SHA-256 `b46aac8748b3bd58316e6d14c1eed0c089ce4b7966c4eb73f654745d8b8e3448`，现场重算相符。
- 现场复核当前源码 SHA-256 为 `98b88655f70b371104f751c51aeae72a845add2e17b03f614e769806103fbb94`；合同测试 `508907028081589408209c8002ae0c34acfdca23a026d72d97d211d375240d9d`；集成测试 `708480fefc9f99e6bff8e804ea152758e21cb97c7d3e45adc9e90f26717e8376`，均与交接记录相符。`git diff --check` exit 0。本审查未另跑测试。

`official-fixed.txt` 中旧夹具的 `canonical test receipt provenance is invalid` 并非产品 RED：当时在固定测试执行后才改 Git ignore，导致快照失配。交接已明确剔除该次失败；修正夹具后的 `official-fixed-current.txt` 和最终三目标 GREEN 有实际通过记录。
