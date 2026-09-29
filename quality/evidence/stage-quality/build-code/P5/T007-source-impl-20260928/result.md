# P5/T007 判决来源窄修（2026-09-28）

- 范围：仅 `runtime/stage/stage-end-report.mjs` 与其同名测试。材料依据为当前 `P5.md`、`spec.md` 及 `T007-advisory-material-amend-independent-review-20260928.md`。未改 T008 写侧、正式报告或 Task facts。
- 修复：每条非通过 `stage-end-spec-analyze` 的 `not_done.source` 指向本次阶段结果的 `quality_advisories[原数组下标]`；逐条披露“原始质量事实来源未核”。裸质量 ref 和相似文件名不再冒充判决来源。原判决词面、状态映射、逐条数目和通过值不入账保持不变。
- 测试窄修：旧冻结测试只修第④来源断言与“不同 advisory 的位置”期望；增加同一断言里的有路径输入检查。首项错主题、首项缺失、多条共用 ref、当前生产者单条判决的负控与正控保留。旧字节、最终字节和差分均在本目录。
- 同一最终测试字节 RED：暂时换回旧生产代码，`npx vitest run runtime/stage/stage-end-report.test.mjs`，exit 1，6 failed / 54 passed，原始输出 `final-test-red.txt`。随后恢复本次生产代码；源码 sha256 与 `after-stage-end-report.mjs` 一致。
- 同一最终测试字节 GREEN：同命令，exit 0，60 passed，原始输出 `final-test-green.txt`。
- 相邻定向检查：`npx vitest run tests/contract/p5-same-run-report-source.test.mjs`，exit 0，25 passed / 6 skipped，原始输出 `adjacent.txt`。该检查在最后新增路径断言之前运行；之后只改本文件测试断言，生产代码未变。
- 哈希：`sha256.txt` 包含前后代码、前后测试和原始测试输出的 SHA-256。
- 边界：这里只证明纯转换器的逐条呈现。底层质量事实、同次真实报告、人工例外及 P5 完成仍须后续独立核查；本实现待独立代码审查。
