# P7 逐场景覆盖候选 v2（待独立复审）

本目录只含候选副本和补丁；**未改正式源码/材料，未运行测试，也没有 RED/GREEN 结果**。v1 目录原字节保留，v1 有两处已知问题，不能直接应用。

## 对 v1 的两项修正

1. 两条负控仍断言正式 AC 事实 `fact.status === "missing"`，但其证据若完整可核，`p9Fresh(state, fact)` 应为 `{status:"current", authenticated:true}`。v1 把证据新鲜度错写成 `missing`，会造成修后假 RED；v2 两处已改。
2. 同一验收 Task 可声明重复的 `source/sample/scenario/tier` 场景。两次相同 command 在同一次 attempt 中可能得到同一个内容寻址 passed ref；v1 按数组位置逐条计数，仍能假 `covered`。v2 在 coverage writer 拒绝重复场景四元身份、拒绝复用 leaf ref，并在真实 `runOfficialStage` 测试中声明两个完全相同 command 场景，要求拒绝，不能把一个结果算两次。

`tests-first.patch` 先加测试；`implementation-followup.patch` 再改 `stage-handlers.mjs#acceptanceCoverageForExecution` 与 `stage-runner.mjs` 单 leaf 快捷路径。`original/`、`after-tests/`、`after-impl/` 是这三步的候选文件副本。测试还没有运行，任何预期 RED/GREEN 都只是待验证假设。

静态核查：在当前工作树 `git apply --check tests-first.patch` exit 0；在 `after-tests/` 中 `git apply --check ../implementation-followup.patch` exit 0；`after-impl` 三个 `.mjs` 文件的 `node --check` 各 exit 0。此检查不证明行为正确。两条补丁 SHA-256 分别为 `e9ce93fd9164269b4e108b1a6834486b6dbbf615be51dd988f7f752a8b31460c`、`8483fc12c1d5af249784ae5e6a1f13b5c87048fe7d43bab64b57ea52ea112bd7`。

仍待独立审查：场景身份、浏览器同源证据边界、非 covered wrapper 的真实 readback、旧测试是否受影响。确认写面后才可按 tests-first 实测目标 RED、再实测实现 GREEN；不能拿语法检查替代。
