# P9 T019 A1/A2 真实测试叶：独立复核

结论：**本次有限范围无 blocker**。两份候选测试文件各以单文件 `npx vitest run <target> --reporter=json` 运行，原始 Vitest 2.1.9 JSON 分别报告 7/7、8/8 通过；没有失败、跳过、待办、待运行或重复完整身份。此结论只证明当前记录时点两份目标的真实 runner 测试叶和本地结果，**不证明**三份已登记业务目标的效果、P9/P10 阶段完成或 CARD-04 官方 build-code 完成。

复核范围与结果：

- 工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；记录 HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。`before.json` 与 `after.json` 的源码树摘要同为 `d6c8ffe1caa76ce0bd76e811ba697fcc3cbf17c368f75a58ee85cd27f3dc602b`；所列源码、P9 材料、Task 文件 hash 前后相同。复核时所列仓库文件仍与记录 hash 相同；当前以后若再改动须重核。
- A1 命令为 `npx vitest run tests/contract/build-code-preexecution-source.test.mjs --reporter=json`。`A1.run.json`、`A1.exit.txt` 一致记录 exit 0；原始 `A1.stdout.json` 报 7 个叶、7 passed，suite 路径正是目标文件，源码 SHA-256 为 `e5ec0396366b1936784e2736265de74b9d4733cbe47dc6265920853d130d76af`。
- A2 命令为 `npx vitest run tests/contract/build-code-test-registry.test.mjs --reporter=json`。对应运行记录与退出码一致为 0；原始 JSON 报 8 个叶、8 passed，suite 路径正是目标文件，源码 SHA-256 为 `9afc2b3bb98103f09b0e0f77053e130b6532b6c1d8131fb3dc502f0f27661d2e`。
- 独立重算了两个 stdout/stderr SHA-256、退出码、当前目标文件 SHA-256、runner CLI SHA-256。按每条 `ancestorTitles`、`title` 和目标路径重建完整身份，与 `leaf-inventory.json` **逐项完全相同**；`fullName` 也与 suite + 测试名拼接一致。叶数等于原始汇总，身份各自唯一，状态只有 `passed`。`it.each` 展开的条目均逐叶计数，没有把文件数当测试数。
- `docs/quality/test-asset-registry.json` 当前只登记另外三份有限目标；A1/A2 是这次单独盘点的候选目标，并未因此自动成为登记库存或业务验收结果。P9 材料明确当前阶段仍 `not_done`，本复核不改变该状态。

证据：`P9/T019-A1-A2-real-leaf-discovery-20260928/` 中的 `A1/A2.stdout.json`、`A1/A2.stderr.txt`、`A1/A2.run.json`、`A1/A2.exit.txt`、`before.json`、`after.json`、`leaf-inventory.json`，以及当前两份目标测试源码、`docs/quality/test-asset-registry.json`、`specs/workflowhub-thin-core-card-04-20260919/phases/P9.md`。本复核没有重跑测试或修改 Task facts。
