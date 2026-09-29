# 单文件集成测试结果

- 命令：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs`
- 工作目录：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- HEAD：`ef920f1fbd415fe87d50930359059b661e141acd`
- UTC：`2026-09-27T15:03:26Z` 到 `2026-09-27T15:12:49Z`
- 退出码：`1`
- 测试结果：1 个文件；107 条测试，85 通过，22 失败；耗时 562.51 秒。
- 22 条失败身份：见 `failure-identities.txt`；完整原因见 `stderr.txt`，完整通过清单与汇总见 `stdout.txt`。
- 本次改动对应的两条 OI / 冻结行为测试均在 `stdout.txt` 中显示通过；整个文件仍失败，不能称为 P10 或整项任务通过。
- 主要失败种类：verify-code 旧试件不满足当前审查清单要求、审查来源不符、旧预期与现有处理结果不符，以及 CARD07 材料在 CARD04 worktree 中缺失。具体原因以原始 stderr 为准，不推断为本次改动引起。
- 源校验：运行前见 `source-sha256.txt`，结束后见 `source-sha256-after.txt`。两处生产文件与测试文件 SHA 相同；P10 材料 SHA 在运行期间由 `239fd8a4...` 变为 `4f8483d1...`，本次结果不能冒充绑定结束时材料版本的整卡验收。
- 原始输出及其 SHA：`stdout.txt`、`stderr.txt`、`output-sha256.txt`。
