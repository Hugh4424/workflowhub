# P9 A1/A2 真实测试叶发现（只读）

- Task: `workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。
- Runner: Vitest `2.1.9`，Node `v24.14.0`。两次运行使用单文件 `--reporter=json`，按顺序执行。
- 运行前源码树摘要：`d6c8ffe1caa76ce0bd76e811ba697fcc3cbf17c368f75a58ee85cd27f3dc602b`；运行后：`d6c8ffe1caa76ce0bd76e811ba697fcc3cbf17c368f75a58ee85cd27f3dc602b`；相同：`True`。
- 材料文件前后 hash 变化：`[]`；Task 文件 hash 变化：`[]`。
- 选定输入文件前后 hash 变化：`[]`。

- A1: `tests/contract/build-code-preexecution-source.test.mjs`，源码 SHA-256 `e5ec0396366b1936784e2736265de74b9d4733cbe47dc6265920853d130d76af`；退出码 `0`；完整叶 `7`，通过 `7`，失败 `0`，跳过/待办/待运行 `0`，重复 `0`。
- A2: `tests/contract/build-code-test-registry.test.mjs`，源码 SHA-256 `9afc2b3bb98103f09b0e0f77053e130b6532b6c1d8131fb3dc502f0f27661d2e`；退出码 `0`；完整叶 `8`，通过 `8`，失败 `0`，跳过/待办/待运行 `0`，重复 `0`。

原始输出、错误输出、退出码、前后 hash 和每条完整身份见本目录同名文件。这里只证明这两个候选文件在当前源码上的 runner 叶身份及本地测试结果，不证明原始业务效果、全部测试资产或 P9/P10 阶段完成。
