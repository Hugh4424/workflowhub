# P7 v2 单文件完整定向结果

- 命令：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs`
- 工作目录：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- HEAD：`ef920f1fbd415fe87d50930359059b661e141acd`
- UTC：`2026-09-27T15:55:28.084443+00:00` 至 `2026-09-27T16:10:45.457762+00:00`（约 15 分 17 秒）；原测试进程 PID `19139`，期间持续观察同一 PID，未重启。
- 退出码：`1`；Vitest 实际执行 84 条，83 通过、1 失败，零跳过。
- 失败身份：`P3 T009 real command and service acceptance > publishes the acceptance execution aggregate for the implementation/tests receipt branch`；错误 `runtime acceptance evidence binding mismatch`，栈指向 `runtime/stage/stage-handlers.mjs:1755`，测试调用点 `tests/contract/acceptance-execution-tier.test.mjs:1488`。
- 根因线索：该用例同时提供 implementation、tests、历史 `stage_outcomes` 三个 receipt。`runOfficialStage` 因 stage_outcomes 进入兼容分支（`runtime/stage/stage-runner.mjs:4729–4734`），每条命令 AC 叶子被绑定到 stage outcome 的 ref/hash（`runtime/stage/stage-runner.mjs:2789–2796`）；新覆盖检查却把叶子的绑定与当前会话绑定严格比较（`runtime/stage/stage-handlers.mjs:1752–1753`）。因此旧兼容分支与新检查冲突。需要主任务判断应保留兼容语义还是调整测试。
- P7、index、测试及两份生产文件在本轮运行前后 SHA-256 一致，值见 `run.json`。额外读回 `runtime/stage/stage-handlers.mjs` SHA-256：`dcc54a80e92d3d9f70719d90e1f499281d9c952bfc885f2e99460c78ba5b6b81`（只在运行结束后读取，未纳入运行前后冻结集）。
- 原始输出：`stdout.raw.txt`、`stderr.raw.txt`。

这轮单文件测试失败；不能称 P7 通过，也不能代替 P7 其他门或真实浏览器检查。
