# P10/T021 测试夹具隔离独立审查（2026-09-28）

结论：**本次限定范围无 blocker**。这只证明 `ORACLE-P10-OFFICIAL-FIXED` 与后面三项测试之间的夹具串扰已被隔离；不证明 P10 生产链路、真实业务效果或整个测试文件通过。

## 核对结果

- 查阅 `P10/T021-current-case-fixture-isolation-20260928/results.json` 及 12 份原始输出，并重算这些输出的 SHA-256，均与记录一致。三项旧断言在旧 reader、当前 reader 上各自单跑均退出 0；排在 `ORACLE-P10-OFFICIAL-FIXED` 后面时，两版 reader 的三项均退出 1。六次有序对照都先通过 official 测试，再出现同一个实际值 `current_effect_receipt_mismatch` 与原预期 `missing_current_business_effect` 的差异。这支持“共享 Task 被前一个测试写入事实”的单一根因；不能把它归咎于当前 reader 的新回归。
- 对 `before-build-code-case-reconciliation.test.mjs` 与当前测试文件重新作 diff，与归档 `test-only.diff` 相同。唯一修改是 official 测试另建 `taskCaseFixture()`，在该 Task 上重新执行固定 capture 与 official stage，并在 `finally` 清理、恢复环境；另加该夹具所需的 `node_modules` Git exclude。原 official 测试对通过的测试事实、收据引用与哈希、未提供 P10 消费证据及 AC-26 未通过的断言均保留。后面三项测试的源代码和负控断言没有改动。生产 reader 的 SHA-256 前后同为 `d2aacd9e038063b3a2c03d8cb240d93706989e9dc0ead7bddb7e71df2bee10a2`。
- 第一次隔离后 `isolated-current-case.txt` 明确记录 13 通过、1 失败；失败是新夹具 Git 无法 hash `node_modules`。补夹具 exclude 后，`isolated-four-targets.txt` 记录按同序运行 official 与原三项，4/4 通过，exit 0；该输出 SHA-256 为 `2a712f35460a0a7a0c78aa81d934306135386036b37d183b39273861cc2f545a`。最早临时副本缺 Git/材料的 setup 错误也保留在 `setup-error-*`，未被计作产品失败或修复证据。

## 边界

第二次夹具修改后没有重跑整个 57 项测试文件；先前同组另外 10 项的通过结果属于第一次隔离后的版本。要宣称整文件通过，仍须在当前字节上定向运行整文件。这个限制不阻塞本次“4 项按顺序的夹具串扰修复”结论。
