# P10/T020 case status 测试路线与范围

## test-routing-advisor 判类

{"routing_tier":"feature","routing_rationale":"本次实际改动只有 workflows/build-code/case-selection.mjs 和 tests/contract/build-code-case-selection.test.mjs；前者改变 P10 单一后端选例功能对业务 case 状态的判断及关联 case 的可运行条件，须运行目标合同测试和邻接检查；未改变前后端协议、数据库、权限或基础设施。phase_count=1（P10），命令限定为该单文件及新负控。","result":"pass","ts":"2026-09-27T17:35:35Z"}

## backend-testing 具体策略

- **输入与身份**：changed files 为上述两文件；来源为 P10/T020、FR-32/AC-32。worktree 分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。已有目标 GREEN 记录绑定 Task `workflowhub-thin-core-card-04-20260919`、材料 `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`、捕获树 `4d9183a215c19a0af0a87ac1befab95eaadd4ed5`；以后复测须记录自己的新树，不能沿用旧树结果。当前两个文件 SHA-256 分别为 `ebada9e65f73c39712e62db990bb276b0c1e111811837269a4184cf9577768c4`、`731328a04c528f51b631d91cf448557ee8485c0eac5ba07e275e6522b6c26e23`。
- **环境/fixture**：Node + Vitest；测试在临时 Git 仓库 bootstrap Task，实际读本地测试 registry、采集未提交的 `product.mjs` 变化，随后对业务 catalog 做单字段变异。无外部服务、数据库、浏览器。已有测试负责在 `afterEach` 清理临时目录；复测应确认无残留。
- **正常 oracle**：现有 `selects an affected candidate from P9's pre-run registry without claiming a test ran` 必须返回 `selected`，只含当前 active case，`test_execution_status=not_run`，不出现虚构执行 receipt/observation；早先双产品动态用例只选实际变化的产品及其 active 旧回归，不选无关 case。
- **坏状态 oracle**：三条新负控分别把直接命中的 case 状态设为缺失、`unknown`、`pending`，必须返回 `unavailable/missing_inventory_identity` 且 `cases=[]`；不能把任何一条当 active 运行，也不能以统一笼统拒绝替代指定原因。关联关系负控把直接 case 保持 active、关联 case 设为 `unknown`，要求同样拒绝且无可运行 case。
- **退役 oracle**：状态为 `retired` 的 case 即使触发路径吻合也不能进入选择，结果为 `unavailable/unmapped_changed_path`、`cases=[]`。现有重复 ID、错 registry 绑定、错任务、缺库存和未映射路径等负控应继续保持原判据。
- **命令与期望**：精准新负控：`npx vitest run tests/contract/build-code-case-selection.test.mjs -t 'rejects a business case|rejects an unknown related case|keeps a retired case'`，修复前应为目标断言 RED、修复后 exit 0 且 5 个目标测试全过。受影响单文件：`npx vitest run tests/contract/build-code-case-selection.test.mjs`，期望 exit 0 且不跳过本文件用例。语法：`node --check workflows/build-code/case-selection.mjs`，期望 exit 0。每次记录 cwd、命令、开始结束 UTC、exit、stdout/stderr 原件与 SHA-256、测试/生产文件 SHA-256、Task/材料/树身份；失败或跳过照实保留。
- **已有结果，只作局部证据**：`red/` 元数据和原始输出记录修复前 4 failed、1 passed、16 skipped、exit 1；`green-targeted/` 记录修复后 5 passed、16 skipped、exit 0。两次都仅运行精准负控；单文件完整命令和语法检查在本策略写入时未由我执行，不得写成通过。
- **coverage limits**：本补丁只保证 catalog status 的枚举值和关联状态筛选。纯对象输入无法独立认证 P9 的真实 Git/Task 来源；目标 GREEN 也未证明当前 CARD04 的 208 条未映射路径、所有业务关系、实际子进程、业务效果、UI 或完整 AC-32。权限/持久化/迁移/并发/幂等未由这两个文件改变，本次不增加对应测试；后续真实入口和 canonical 原件仍按 P10 全部合同另核。
