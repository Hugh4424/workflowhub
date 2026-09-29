# T026 行为样例核查（未完成）

P4/T006 是真实行为变化的强候选，但不能用来宣布 AC-18 完成。

- 冻结测试 `tests/contract/post-phase-official-handler.test.mjs` SHA-256 为 `b9e790d61bb556fec620e79678426f401b0ed98f87acf211ac469f8dda47559e`。2026-09-26 11:52 UTC 的 `T006-red.txt` 收集 5 项、目标断言 5 败、exit 1；11:54 UTC 的 `T006-green.txt` 为同一测试字节、5/5 通过、exit 0。RED 首例为目标函数 `undefined`，不是导入或收集故障。
- 11:54 UTC 后把 `source_ids` 临时置空，负控出现 1 败/4 过、exit 1；恢复后复绿。Git 差分显示新函数被 `currentPostBuildCodeSpecAnalyze` 调用。
- RED/GREEN 当时只记录 HEAD，没有现场保存改动前后完整工作树快照、源码哈希和材料版本。旧独立审查对应后来的旧代码版本；之后该路径又被修改。当前 Task store 也没有正式 build-code 阶段行或逐条真实 CLI 消费原件。

结论：这组原件证明局部先红后绿及负控有效，但不足以认证完整样例。下一项尚未实施的真实行为应在修改前同时固定测试、源码、材料和工作树身份，保存目标 RED；修改后用同一测试取 GREEN、破坏负控和当前独立审查。不得把事后重建的哈希冒充现场记录。
