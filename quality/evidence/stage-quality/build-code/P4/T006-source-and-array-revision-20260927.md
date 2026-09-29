# P4/T006 来源身份与说明数组定向修订

工作区：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`。只修来源 ID 构造、上游 `coverage_limits` 判断、P4 定向测试和当前说明。旧官方 receipt、OCR 与历史 RED/GREEN 原件保持原样；本文件不宣称 P4 或全卡完成。

## 来源编号：先红后绿

- 旧冻结测试原字节：`T006-frozen-before-source-identity-revision.test.mjs`，SHA-256 `b9e790d61bb556fec620e79678426f401b0ed98f87acf211ac469f8dda47559e`。本次限权修订要求缺 U/V 原始索引时 `source_ids=[]`，R 编号写入 `coverage_limits`。
- 命令：`npx vitest run runtime/stage/stage-runner.test.mjs`。测试 SHA-256 `e0cf4582c6cbe6a3e169d14ccfa43ec8177b189e5cec3513d9bba1fe235862c0` 固定；RED 的 runner SHA-256 `39fc0cebd187583b6d03e7af3a3154077b452948dc9b8fc83d0f5143b4a96fd2`，`T006-source-identity-revision-red.txt` exit 1、1 failed/4 passed，目标失败 `expected ['R-001'] to deeply equal []`，原始输出 SHA-256 `c7d0febeb0592e2122c05d356ed3d9d25b7452d22729524a0d5674bff0a30b54`。
- 修复后同命令、同测试 SHA：runner SHA-256 `9ee916e5692042df9535a1f278efce14a84ddf2dd61c87f9dadef5362337cc84`；`T006-source-identity-revision-green.txt` exit 0、5/5，原始输出 SHA-256 `1a38f370afff376634d4384989547aa8e2d19546ffcd3d4111d17d1acf5e835c`。

## 上游数组说明：先红后绿

- 来源修订后的测试原字节另存 `T006-source-identity-revised-before-array.test.mjs`，SHA-256 `e0cf4582c6cbe6a3e169d14ccfa43ec8177b189e5cec3513d9bba1fe235862c0`。新增两项定向检查：有效非空数组在真实 handler 投影后送入 builder，两个原说明均可读；含非文本成员的坏数组必须为 `unknown` 且说明 `coverage_limits` 缺口。
- 命令：`npx vitest run runtime/stage/stage-runner.test.mjs`。测试 SHA-256 `0e791e9c094aba2e2005bd1f654e3ecd535f061d869d7e9c252c962d0c9601fd` 固定；RED 的 handler SHA-256 `2d1ef0ddd790e9d1f9685bb4adf4a220476fb0713da3ee043a5259da5539f7e5`，`T006-array-handler-red.txt` exit 1、1 failed/6 passed，目标失败是有效数组被降为 `unknown`，原始输出 SHA-256 `c8baf631dc9d28e71af926b8c620ba24ab4f6bbdb273153664ee699aefac128c`。
- 修复后同命令、同测试 SHA：handler SHA-256 `88760292bc8b78d6a13e848fddc5ba9ce1fa4708cd422d404045c8820c21e5c9`；`T006-array-handler-green.txt` exit 0、7/7，原始输出 SHA-256 `36e28383a22e12c72c4663bcf7219835435997f0a87750b9bb137bfddfde69f8`。

## 当前材料与同版核对

- `node quality/evidence/stage-quality/build-code/P4/T006-current-material-probe.mjs` exit 0，原始输出 `T006-current-material-probe.stdout.txt` SHA-256 `552123af9d6a20abf33537e66cf2d4f9d07078036775d1dfefa67fea49dcf909`。真实 AC-29 输出 `U-006-01..06`，未能认证的 R-010/R-018 有缺口说明；AC-18 来源为空并披露。
- 最终定向命令 `npx vitest run runtime/stage/stage-runner.test.mjs` exit 0、7/7；`T006-current-final.stdout.txt` SHA-256 `659277f1a374f58319673b99e08cbfe28459de22bb6aaa51c32f8919bbe1d8e6`。同版源码：runner `9ee916e5692042df9535a1f278efce14a84ddf2dd61c87f9dadef5362337cc84`、handler `88760292bc8b78d6a13e848fddc5ba9ce1fa4708cd422d404045c8820c21e5c9`、测试 `0e791e9c094aba2e2005bd1f654e3ecd535f061d869d7e9c252c962d0c9601fd`。三文件 `node --check` 与定向 `git diff --check` 均 exit 0。
- 曾尝试把就近测试与 `tests/contract/post-phase-official-handler.test.mjs` 一起跑；后者超过 80 秒未完成，人工终止，原始 `T006-final-scoped.stdout.txt` 和 exit 143 保留。该尝试不计通过或失败；没有跑全量测试。

边界：handler→builder 定向测试调用真实函数，但没有运行完整正式 CLI。当前代码要经异源复核；修后官方 receipt/OCR 尚未产生，P4 与整卡完成状态不由本地绿灯推断。
