# P10/T021 单一认证读者迁移：独立审查（2026-09-28）

## 结论

**本次读者搬迁没有发现局部代码拦截问题；T021 仍未完成。** `runtime/evidence/freshness.mjs#authenticateP10RunConsumption` 现在是唯一完整的消费原件认证实现；`workflows/build-code/case-reconciliation.mjs` 在完成原有固定回执、输出、manifest 和原始 reporter 核验后，只把当前身份及显式 locator 交给它，读取选中 AC 的认证结果。未发现 `runtime/evidence/freshness.mjs` 向 `workflows/` 的反向导入，也没有残留第二份 `readRunConsumption`。

## 已核对的边界

- reader 限制 locator 为 `quality/evidence/stage-quality/build-code/p10-consumption-<sha256>.json`，核原字节 SHA、Task ID、源码树、材料版本、来源摘要、实际传入的固定测试回执和 output。它重读 output、逐份质量事实及嵌套来源，要求选中的每个 AC 恰有一份，且 `risk_tests_fresh` 的测试事实恰有一份并指向该回执。
- reader 用 `facts.jsonl#N` 的原行加换行计算 hash，要求它仍是唯一当前 build-code 行，且为 P10/T021、同 Task、同源码树和材料；读取全部原件后再次读取 `facts.jsonl`，拒绝读取期间换行。此机制不能证明相同字节的 ABA，也不能单靠 hash 证明是谁写了原件或它列的是本次 `runStage` 返回的完整事实清单。
- 显式 locator 错 hash、缺 AC、错事实 hash、错回执、半写 JSON、替换最终行均在命名测试中 fail closed。无 locator 时仍返回 `current_execution_unverified`、业务效果 `unknown`；旧固定 reporter 与逐项业务效果读取代码仍在。读取端没有把结构匹配误判为业务效果通过。

## 证据与限制

- 三份当前源文件的 SHA256 与 `T021-reader-move-20260928/final-source-sha256.txt` 一致：`freshness.mjs=bf863f5678fce78093162543fc3d4a871d8e1afb29670bd12b5c8dcb4d053e36`，`case-reconciliation.mjs=3159eb5fca996d2b26fe3eb666adc1956ba4fc59697345f6e56cd6c3f7b24481`，合同测试 `48ebab45196ebc5543e98bf9d07fe0a0255927d86dd065b625d783f7753b99a3`。`node --check` 两个生产文件、定向 `git diff --check` 均 exit 0。
- 现存原始 RED/GREEN 是同一命名命令：迁移前 `1 failed / 56 skipped / exit 1`，失败点是 runtime 函数尚未导出；迁移后 `1 passed / 56 skipped / exit 0`。我按当前相同源文件独立重跑该命名测试，仍为 `1 passed / 56 skipped / exit 0`，约 50 秒。RED 有效证明该读者接口原先缺席；它没有逐项证明后来追加的所有负控在旧代码上会失败。
- **整份 57 项合同测试在本次搬迁后未重跑**，不得写成整文件通过。上轮独立审查记录的旧整文件结果为 `54 passed / 3 failed / exit 1`，并追踪到复用 Task 夹具污染；本次局部绿色不解决或反证那三项。
- 命名正控仍由测试手工 `publishConsumptionFixture` 发布消费原件，AC 事实也是测试补写。正式 `runOfficialStage` 还未发布这种原件及 `p10_consumption_evidence`，现有生产调用也未把 locator 传入对账。因此当前 `run_consumption_status: verified` 仅在合成入口出现，**不能证明真实运行消费了指定回执**；也不能证明 AC-26/27/33 的业务效果。与上轮 `T021-consumption-reader-independent-review-20260928.md` 和 `T021-writer-reader-integration-independent-review-20260928.md` 的生产阻点一致。

## 后续完成条件

由正式写入端在同一次 `run` 中，以实际输入回执、完整当次质量事实清单和私有最终写行返回值生成、发布并重读原件，再把 locator 交给真实消费者；集成正控须从正式返回值取 locator。随后隔离旧复用 Task 夹具，重跑受影响整份合同测试，并独立核实际业务效果。此前保持 T021 和 P10 未完成。
