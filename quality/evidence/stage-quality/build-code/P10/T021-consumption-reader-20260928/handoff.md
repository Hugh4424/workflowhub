# P10/T021 局部读侧交接

只修改 `workflows/build-code/case-reconciliation.mjs` 与 `tests/contract/build-code-case-reconciliation.test.mjs`。新增显式 `consumptionEvidence:{ref,sha256}` 读取；原件格式和 owner/consumer/删除条件见 `phase-card.md`。reader 重读原件、测试输出、当前 `facts.jsonl` 最终行、所有列出的质量事实原字节和嵌套来源；只用原件列出的逐 AC fact，不借同树其它 run 的 fact。固定 receipt→output→manifest→raw reporter 核验仍用原链。无 locator 的旧调用只保留 `unknown` 诊断。即使来源核对成功，业务效果仍是 `unknown`。

同目标旧实现 RED：`red-verified.txt`，exit `red-verified.exit` 为 1；失败是旧读者把同树第二份 fact 算作冲突，且缺显式消费认证，不是导入或夹具错误。旧代码已由 trap 恢复为新代码，恢复后 SHA 与 `green-code.mjs` 相同。新读者同目标 GREEN：`green-target.txt`，1 passed、56 skipped。第一轮 `red.txt` 是夹具 Git exclude 配置遗漏，已修；`green-candidate.txt` 是诊断文案的预期修正前失败，均不算功能 RED/GREEN。先前全文件基线测试因并行端口竞争被主动中断，不作为通过证据。

限制：本次是两文件读侧局部实现，尚未迁到当前 P10 材料指定的 `runtime/evidence/freshness.mjs` 唯一认证点；生产 `runOfficialStage` 尚未写原件/公开 locator。新测试中的原件是隔离 Task 夹具，验证读合同，不能证明真实生产者已接通。真实 AC-26/27/33 业务来源和本次正式 Task 结果未建。P10/T021、Phase P10、整张 CARD-04 均不能因此记完成。需要独立 review，并在 freshness/producer 写面稳定后迁移和对接。

整文件定向结果：`green-all.txt`，54 passed、3 failed，exit 1，502.73 秒。三项失败均在旧 `ORACLE-P10-CURRENT-CASE` 组，预期 `missing_current_business_effect`，实际 `current_effect_receipt_mismatch`；同一组先执行的 `ORACLE-P10-OFFICIAL-FIXED` 在复用 Task 中发布了缺失 AC fact，后续无 locator 诊断全 Task 扫到它。单独运行其中一项旧失败（`adjacent-isolated.txt`）为 1 passed。再用冻结旧 reader 跑官方固定回执测试 + 该旧用例（`baseline-pair.txt`，SHA `72509094c8531d9fc308291cfca0843de81522811c92ea6dc1b8b8ddcaeff173`），仍是 1 passed、1 failed，且失败文案完全相同，证实至少这一项是原有顺序问题；另外两项与它共享同一复用 Task 和预期差异，但未逐项冻结对照，保持未证。整文件仍不通过，交独立 reviewer/主线程决定旧夹具隔离修复；本局部实现不改旧无 locator 路径。冻结旧 reader 结束后，当前代码 SHA 与 `green-code.mjs` 一致，均为 `d2aacd9e038063b3a2c03d8cb240d93706989e9dc0ead7bddb7e71df2bee10a2`。
