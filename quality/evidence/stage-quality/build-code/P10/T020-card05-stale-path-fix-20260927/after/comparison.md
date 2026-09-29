# 同两文件修复前后精确对比

原始 RED：`quality/evidence/stage-quality/build-code/P10/T020-card05-stale-path-tests-20260927/`；本目录 `run.json` 保存修复后命令、cwd、HEAD、P10 材料及两测试 SHA-256、UTC 起止、退出码、完整输出 SHA-256；`stdout.raw.txt` 与 `stderr.raw.txt` 为完整原始输出。

| 测试身份 | 修复前 | 修复后 |
|---|---|---|
| `tests/contract/post-phase-contract.test.mjs` / `keeps CARD-05 D-044 acceptance incomplete when current canonical proof is absent` | 旧 P5 路径 `ENOENT` | 通过；该文件 16/16 通过 |
| `tests/contract/decision-freeze-current-oi.test.mjs` / `uses the current YAML OI authority instead of append-only historical prose` | 旧 decision-log 路径 `ENOENT` | 文件可读，但 coverage 断言失败：预期四项，实际缺 `data_states`；该文件 3/4 通过 |

整条命令修复前退出 1（18/20 通过、2 失败），修复后仍退出 **1**（19/20 通过、1 失败）。两个旧路径的 `ENOENT` 已消失；新的失败不是路径问题。只读定位：归档 CARD05 decision-log 含多个 YAML `category: 'data_state'`，而 `runtime/stage/stage-content-contracts.mjs:552` 的 Markdown coverage 正则只认汉字 `数据状态` 或复数 `data_states`，没有解析 YAML 的 `data_state` 单数。此处需要契约 owner 先判断应改生产解析还是改测试目标，不能改归档原件或缩小断言来伪造通过。本次未改源码或材料，未运行其他测试。
