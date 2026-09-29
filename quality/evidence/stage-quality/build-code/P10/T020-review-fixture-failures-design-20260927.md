# T020 邻近测试：四条评审原件不一致的最小修复设计

## 核查结论

本文件只读核对 `T020-adjacent-failures-audit-20260927.md`、当前测试和生产读取器；未改源码、未运行测试。四条 `REVIEW_EVIDENCE_INVALID` 共用 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs:55-130` 的 `buildSpecRoutingFixture`，不是四个不同的生产缺陷，也不是本轮 OI 改动引入。旧失败原件在 `T020-adjacent-failures-before-baseline-20260927.{stdout,stderr}.txt`；它们仍是失败，不能记作通过。

夹具 `:75` 以 `{ provider, review: providerReview }` 聚合，没有传入已校验的证据锚点，故生成的 `provider_findings[0].evidence_anchor_valid=false`，严重直接证据也成为 `invalid_evidence/invalid_anchor`。但夹具 `:112-125` 保存的同一 provider 原件写 `evidence_anchor_valid: [true]`。真实消费者 `runtime/stage/stage-handlers.mjs:2112-2168` 从 provider 原件重读 `[true]`，再由 `runtime/review/canonical-review-result.mjs:286-367` 重算 findings/adjudication 并要求与汇总逐字段相同，因此拒绝该矛盾；`safeReviewFacts` 不会把此类完整性错误变成“暂不可用”。四个失败用例位于测试 `:259-289` 和 `:612-639`。`runtime/review/review-record-route.mjs:1836-1848` 的现行写入器也是先记录原件锚点，再以相同锚点聚合；夹具应遵循这个顺序。

## 最小正确改动

唯一建议修改的仓库文件是 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs` 的夹具。先给夹具一个明确的、**仅供合成测试**的 `const evidenceAnchors = [true]`，在 `:75` 聚合输入中加 `evidenceAnchors`，在 `:112-125` 的 provider 原件使用同一值。更稳妥的写法是先造不可变 provider 原件，再从其 `evidence_anchor_valid` 投影聚合输入；这样修改原件时不容易忘记同步汇总。保留现有四条关于路由和 fallback 的断言，不改生产认证器、汇总结果或历史回执来求绿。

这里的 `[true]` 只表示该合成用例选择“有有效锚点”分支，以测试后面的路由；它不是一次真实评审，也不能成为本 Task 的评审通过证据。若无法为合成样例成立该前提，就应两边都用 `[false]` 并把该用例设计为无效证据的拒绝样例，不能把 `false` 的无效证据照旧断言为有效路由。生产评审必须用真实 provider 原件和锚点核验值。

## 必须保留的拒绝检查

1. 正例：同一份 provider 原件 `[true]` 聚合出 `provider_findings[0].evidence_anchor_valid=true`，`evidence_status=direct`；四条路由/fallback 用例仍检查原行为。仅此不能声称整个文件全绿。
2. 反例：先形成一致汇总，再只把 provider 原件锚点翻成 `[false]`，或只把汇总 findings/adjudication 改成无效锚点；`officialStageHandler("build-spec")` 必须抛 `REVIEW_EVIDENCE_INVALID`，不得产出完成事实。不要通过放宽 `authenticateCanonicalReviewResult` 或吞错使它通过。
3. 另一反例：原件与汇总都为 `[false]` 时，可以完成来源一致性认证，但必须保留 `invalid_evidence/invalid_anchor`，路由不能被当作有有效直接证据的 `implementation_defect`；不能把“来源一致”误报为“评审质量通过”。
4. 原测试文件另有两项独立失败：旧任务材料路径不存在、旧 `tasks.md` 写区文案已不在当前技能中。修好四条夹具失败后，若这两项仍失败，整文件/邻近命令仍是失败；不得只报 4/4 或改历史材料和当前政策文案凑绿。

## 归属与边界

- **精确 owner：**旧跨阶段协议测试的夹具维护者；当前 CARD04 P10 owner 可以把它作为本次 OI 改动的邻近回归修复接手，但须先在 `specs/workflowhub-thin-core-card-04-20260919/phases/P10.md` 明确增列此测试夹具的窄写面，再留旧 RED、改夹具、跑同一限定命令并交独立审查。当前 P10 卡只要求复测这个文件，未直接授权把四条旧失败算作本卡已经修复。它不是 P10 T020 自动选测或业务效果的证明。
- **不归 P6/T014：**该文件中的 `T014` 是旧“Phase 4 unified fallback protocol”用例名；CARD04 P6/T014 是 `tests/contract/review-history-canonical-reader.test.mjs` 的评审历史读取政策核验，消费者和写面均不同。不要据同名把当前夹具错误归到 P6，也不要修改 `runtime/review/canonical-review-result.mjs`、`runtime/review/review-record-route.mjs` 或归档 CARD05 来消除这四条。
- **验证边界：**夹具修复只证明测试原件/汇总自洽以及真实消费者仍拒绝矛盾。它不能补出 P10 的 206 条未映射变更、真实业务效果、正式阶段评审或整体 build-code 完成事实。
