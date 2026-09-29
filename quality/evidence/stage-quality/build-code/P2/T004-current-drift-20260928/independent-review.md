# P2/T004 当前测试行数记录：独立复核

结论：**本次局部修正成立。** 当前工作树的 `buildReport()` 内存实测为 84649 行；修正前 JSON 为 84399，修正后为 84649。同一条精确测试由 RED（1 失败、8 跳过、exit 1）变为 GREEN（1 通过、8 跳过、exit 0）。RED 的唯一失败是 `tests/contract/repository-inventory.test.mjs:190` 的数值失配，没有 import、收集或环境故障。本结论仅覆盖该测试目标，不判 P2 Phase 完成，也不判整份复杂度基线与当前树同版。

## 身份与改动边界

- Worktree：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支 HEAD：`ef920f1fbd415fe87d50930359059b661e141acd`。
- 修正前原字节：`baseline-before.json`，SHA-256 `12d4e7b391b209eb86dd4cce98bb7b51269697ce7593bc688d7d65cc579862d6`。当前 `docs/architecture/complexity-baseline.json`：SHA-256 `506e413bf4802a607aac90c644ca84f012ee827cde48fa5db0abe5691067ce8f`。
- 独立字节核对：before/current 各恰有一个 `budgets.formal_test_lines` 块；把该块在两份文件中替换成同一占位文本后，块外字节完全相同。块内仅把 `actual` 84399→84649、`delta_from_target` 74399→74649，以及说明中的 7.0→7.1 倍、日期和实测数字同步。`target=10000`、`limit=12000`、`within_limit=false` 未变。
- 当前测试文件 `tests/contract/repository-inventory.test.mjs` SHA-256 `6a27b37386882378d20f4e725dd3fee43918536d9be12a0381960844a49158ba`；测量源码 `tools/architecture/complexity-report.mjs` SHA-256 `053eff93e05d51ebc9917e0603aed87958770ae4edb50ff8a95e9f08fce4712e`。RED/GREEN 的测试 SHA 相同。

## 同目标复测

命令：`/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest run tests/contract/repository-inventory.test.mjs -t "complexity baseline"`；CWD 均为上述 CARD-04 worktree，使用主仓库已安装的 Vitest 2.1.9。仅选择这一目标。

| 次序 | UTC | 内存实测 | JSON 值 | 结果 | 原始记录 |
| --- | --- | ---: | ---: | --- | --- |
| RED | 2026-09-27 16:36:32–16:36:33 | 84649 | 84399 | 1 失败、8 跳过，exit 1 | `red/meta.json`、`red/stdout.raw.txt`、`red/stderr.raw.txt` |
| GREEN | 2026-09-27 16:37:29 | 84649 | 84649 | 1 通过、8 跳过，exit 0 | `green/meta.json`、`green/stdout.raw.txt`、`green/stderr.raw.txt` |

两份 `meta.json` 保存精确命令、CWD、HEAD、UTC、退出码、JSON/测试及输出 SHA；原始 stdout/stderr 保留。GREEN 的 stderr 为空，无其它测试失败。

## 限制

这次只证明 `formal_test_lines` 的当前测量值和这条防漂移测试一致。JSON 顶层 `source.git_head` 及其它字段仍是历史快照；整份文件的全报表检查仍可能报告陈旧。本复核没有运行 P2 全相位门，也没有对 P2 或整卡签完成。
