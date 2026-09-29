# P4/T006 当前缺口只读核查（2026-09-28）

本文件只记录读回结果，不是新的测试、审查或完成裁定。核查位置：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。本次未改源代码、材料或 Task facts，未运行测试。

## 当前代码与已有测试

- 读回 SHA-256：`runtime/stage/stage-runner.mjs` 为 `38e2a7067c5b640a3ad18266b1ff478cf257a7f6e507f0c6ccc18f34a310e0c0`；`runtime/stage/stage-runner.test.mjs` 为 `0e791e9c094aba2e2005bd1f654e3ecd535f061d869d7e9c252c962d0c9601fd`；上游 `runtime/stage/stage-handlers.mjs` 为 `dcc54a80e92d3d9f70719d90e1f499281d9c952bfc885f2e99460c78ba5b6b81`。这是本次读回时的文件字节身份，不声称整个工作树稳定。
- `runtime/stage/stage-runner.mjs:4213-4315` 导出 `buildPostAcceptanceChainRows`：从当前映射、原始来源索引和决策条目构造验收行；缺映射时留空并写明缺口；只接纳当前快照的带哈希证据。`:4399-4414` 在 `currentPostBuildCodeSpecAnalyze` 中调用它；`:4429-4444` 将链交给阶段检查。`:4935-4939` 是现有 post build-code 真正调用此检查的路径，`:4973` 把本次内存中的链交给 P5 私有报告写侧。这证明代码接线存在，不证明当前 Task 的一次真实命令已产出正确的逐项结果。
- 就近测试 `runtime/stage/stage-runner.test.mjs:70-170` 现在为 7 项，含来源编号、证据哈希、缺口、上游有效数组保留和坏数组拒绝。先失败后修复的原始记录、临时负控及修复后 7/7 见 `T006-source-and-array-revision-20260927.md:7-23`。当时同版 runner 哈希为 `9ee916e5692042df9535a1f278efce14a84ddf2dd61c87f9dadef5362337cc84`，上游 handler 为 `88760292bc8b78d6a13e848fddc5ba9ce1fa4708cd422d404045c8820c21e5c9`；两者均不同于本次读回值。测试文件哈希相同。
- 最近一张正式定向收据为 Task store `quality/tests/card04-P4-L0-current-fbcf6094-96e6-46f5-ab1f-ca622057b10a.json`，见 `T006-official-current-20260927-fbcf6094/summary.md:4-9`：当时命令退出 0、7/7 通过，绑定 source tree `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`，收据和原始输出哈希已回读相符。当前 runner 和 handler 字节已变，这张收据不能证明本次读回源码通过，更不是 Phase 完成或逐项验收。

## 独立审查与报告分界

- 唯一查到的 P4 正式独立 Phase 审查为 Task store `quality/reviews/results/build-code-simple-3d13aab6-f60e-535a-a050-12707123d310.json`：绑定更早的 tree `c4987d3e223a2861e735547658730d2bc7a33326`、材料 `revision-b377a58c54a3d4016d4f302785139ff206547e627b7e12f27a0b83e14faf750c`，共有 9 个发现。旧处置在 `finding-dispositions-20260926.json`：1 项已修、1 项证据无效、7 项当时待处理。其来源编号矛盾和数组丢失在后续代码、材料及测试中已有定向修订；旧处置不能代替对当前版本逐项复查，也不能把其它 Phase 的发现算作 P4 已解决。本次未发现绑定当前 runner 的第二次 P4 正式审查。
- P4 的边界见 `specs/workflowhub-thin-core-card-04-20260919/phases/P4.md:14-17,44-49,70`：就近测试为本 Phase 自身测试门，真实 build-code CLI/spec-analyze 消费和跨 Phase 核对留给依赖就绪后的集成检查。已有夹具 7/7 不足以证明真实 CLI 产出的每一行来源、证据和缺口正确。
- P5 是报告的 owner。`runtime/stage/stage-runner.mjs:4550-4553` 当前的人工作出例外声明读取函数固定返回 `null`，`:4620-4622` 因此不进入三文件写入；`:4648-4705` 是取得可信声明之后的同次来源、报告和完成标记写路。不能把 P4 的链接线或旧 7/7 收据算作 P5/T008 报告已交付。P5 当前材料 `phases/P5.md:99-103` 也明确要求独立读者核对真实来源与三文件。

## 下一最小动作与可失败点

1. 待共享源码稳定，运行原定向命令 `npx vitest run runtime/stage/stage-runner.test.mjs`；记录完整原始输出、退出码，以及运行前后 runner、handler、测试文件哈希与 Task 材料/快照身份。只测试该文件，不跑全量。若 7 项有失败，先修具体失败，不复用旧收据。
2. 用现有正式定向测试采集入口为同一命令生成并回读当前树的 canonical 收据；在稳定快照上做 P4 独立 Phase 复审，逐项重判旧发现及新发现。旧审查绑定旧树，不能直接搬成当前结论。
3. 依后置集成约定，核一条真实 post build-code CLI 结果从材料来源与决策，经 `acceptanceChain` 到 spec-analyze 的 ref/hash 和缺口；如取不到同次原件，记未验证。P5 的真实报告、例外声明和独立读者另按 P5 完成，不用 P4 模块绿灯代替。

主要风险是当前代码与正式收据、独立审查错版；以及夹具覆盖到 builder/handler，却尚未证明本 Task 真实命令和报告消费者。故当前 P4 可说“实现接线存在、历史定向测试通过”，不能说“当前版本已经完整通过”。
