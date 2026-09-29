# post build-plan 缺 Phase index 的公共执行错误收窄

- 任务 worktree：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。新增测试 seam：`tests/contract/post-build-plan-missing-index.test.mjs` 经 `stageRuntimeCliMain` 调用真实 public `run --action=execute --stage=build-plan`，临时 post task 有 decision-log/spec 而缺 `phases/index.md`；临时文件由测试结束清理。冻结 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs:429-437` 原先只作 ENOENT 观测，本次未修改或运行该 E2E。
- 根因：`stageRuntimeMain` 在真实写边界调用 `authenticateStageWriteBoundary`；`bootstrapStage` 只对 build-code/verify-code 预查全材料，post build-plan 执行直接进 `stage-handlers.mjs:3801` 读 index，经 `ArtifactDir.read` 抛原始 ENOENT。修复在 `runtime/stage/stage-context.mjs` 的写边界，仅当 `stage=build-plan`、`operation=run`、post cohort 时复用既有 `assertCurrentTaskMaterials`；`status` 和增量 `run --action=draft` 不进此分支。缺料在写成功前精确报 `current task material missing or unreadable: phases/index.md`。无新公共命令、状态或门。

| 步骤 | 精确命令（CWD 为上列 worktree） | 退出/收集 | 原始输出 SHA-256 |
| --- | --- | --- | --- |
| RED | `/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest run tests/contract/post-build-plan-missing-index.test.mjs` | exit 1；1 collected、1 目标 assertion fail。期望协议错误，实际 `ENOENT: .../phases/index.md`；原件 `post-build-plan-missing-index-red-20260927.txt`。 | `ac0b49242a0ab88ec26e9825346a0c065c422773c45eb99d3ab010ed15bd09a4` |
| GREEN | 同一命令 | exit 0；1 collected、1 pass；原件 `post-build-plan-missing-index-green-20260927.txt`。 | `a9b5f91aefe9ee99c92d24559f3ff073210d401af59bcedc080ebf3f0d7b40cc` |
| 相邻守卫 | `/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest run tests/contract/stage-runtime-material-check.test.mjs tests/contract/post-cohort-authoring-files.test.mjs` | exit 0；7 collected、7 pass（作者阶段 status 容忍未成材料、消费者 status 拒缺料、post 作者文件合同）；原件 `post-build-plan-missing-index-adjacent-20260927.txt`。 | `741c25353d88baf103a9c4fdc7cff0a02f3d28dee23c2d37237dcae81e97501c` |

当前 `stage-context.mjs` SHA-256 `60aee6dcfc18f66739f44e5467e6a4447f7386998fe3dc19dc10b8b97bfd47fd`；新测试 SHA-256 `ad54d1da1fc4b4f5d1c362a5e199fe65afc3870668799a322f1fc9d409586a74`。两文件 `node --check` 和生产 diff `git diff --check` 均 exit 0。三次 Vitest 输出均含环境 `WebSocket server error: Port is already in use`，未影响目标测试收集/断言/退出，原因未在本次定向修复范围内核实；不能把这些局部测试扩称 P6/T012 E2E 或 CARD-04 全卡通过。

宪法对照：F3/Q2 要求当前 post 材料完整性与正式写边界 fail-loud；F11 保留 build-plan 增量作者路径，缺质量辅助事实仍非工作许可证。本改动只统一核心材料缺失错误，未增新 gate/对象，也未以测试绿灯宣称阶段完成。
