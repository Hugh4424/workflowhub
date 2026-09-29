# P10/T021 完整定向测试文件独立复核（2026-09-28）

结论：**`tests/contract/build-code-case-reconciliation.test.mjs` 可按本次记录的源码版本记为整文件全绿，限定范围无 blocker。** 这不证明 P10 生产收据写入、读取接线、真实业务效果或整个 CARD-04 完成。

## 已复核的事实

- `full-file-command.txt` 与 `full-file-run.sh` 一致：在 CARD-04 worktree 运行 `npx vitest run tests/contract/build-code-case-reconciliation.test.mjs`，没有全仓测试命令或测试名过滤。`full-file-environment.txt` 记载同一 worktree、Darwin arm64、Node v24.14.0、npm 11.9.0；原始输出由 Vitest v2.1.9 报出该 worktree 的测试文件身份。
- `full-file.exit` 为 0。`full-file-stdout.txt` 报 `Test Files 1 passed (1)`、`Tests 57 passed (57)`、无跳过或失败，耗时 525.02 秒；`full-file-stderr.txt` 为空。独立重算 stdout SHA-256 为 `407c7e1fa2efa5a12f17933aaedcaeebc4ac615636f226917d7896e68ab11a1f`，stderr 为 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`，均与 `full-file-output-sha256.txt` 相符。
- `full-file-source-sha256.before.txt` 与 `.after.txt` 字节相同；我重新计算当前测试文件、生产 reader、freshness、stage runner、Vitest 配置的五个 SHA-256，也与两表相符。测试文件哈希 `3e6508ba54014676c577943d9376ee9867a2ebade86959eef83805be824bcf5e`，reader 哈希 `d2aacd9e038063b3a2c03d8cb240d93706989e9dc0ead7bddb7e71df2bee10a2`。
- 脚本临时把 worktree 的 `node_modules` 目录移开，接入主仓依赖，退出时用 shell trap 恢复。当前实查 `node_modules` 是目录而非符号链接，与运行前记录的 `Directory node_modules` 一致。

本复核直接读取既有原始输出与当前文件，没有重复运行 525 秒测试。结论仅绑定上述命令、该测试文件及核过的源码哈希；不外推为正式 Phase 审查或业务验收。
