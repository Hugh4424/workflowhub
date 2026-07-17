# Delivery Close Execute 实施计划

## 实施边界

只改现有 close seam，不新增生产文件或依赖。生产代码净增上限 350 行。默认允许文件：

- `core/task-close.mjs`
- `scripts/task-close.mjs`
- `workflows/verify-code/SKILL.md`
- `tests/task-close-delivery.test.mjs`

## Phase 1：失败测试冻结合同

在现有 delivery close fixture 上把 spec 改为多文件目录，并先写红测：

- prepare 的 target/remote baseline、target checkout、clean、目录输入、archive 已存在校验；同一事实连续 prepare 的 plan hash 必须相同。
- rejected/timeout 零写入。
- confirmed CLI 六步端到端。
- 目录无损归档与夹带/篡改拒绝。
- 每步 reconcile、两种微中断恢复。
- conflict、remote 前进、push 失败、dirty target 停止且不执行后续。

先运行 `npx vitest run tests/task-close-delivery.test.mjs`，保存真实 RED 事实。

## Phase 2：最小 core 实现

在 `core/task-close.mjs` 内完成：

1. T007：delivery plan 加入本地/远端 target baseline 与固定 merge strategy；prepare 做只读 preflight。完成判据是 T002 的 baseline、checkout、clean、目录、既存 archive 和 plan-hash 确定性断言全部 GREEN。
2. T008：archive verifier 改为目录 tree OID 相等，并要求 archive commit 的 diff 全是 source→archive 同相对路径 R100 rename。完成判据是 T004 全部 GREEN。
3. T009：在现有 governed registry 中加入仅供 delivery plan 使用的六个固定 executor，不开放任意 operation 或 shell；每个 probe 使用单调物理事实。完成判据是六步 core executor、T005 reconcile 和 T006 故障停止断言 GREEN；CLI 端到端测试继续保持 RED 到 Phase 3。
   - [ ] publish verified snapshot
   - [ ] archive whole spec directory and commit
   - [ ] no-ff merge task branch
   - [ ] non-force push target branch
   - [ ] remove task worktree
   - [ ] remove merged local task branch
4. T010：`executeClosePlan` 完成前，对 delivery plan 调用现有 `inspectDeliveryCloseState`；未 ready 不写 completed。完成判据是 core 层 delivery ready、complete 与 status 断言 GREEN；CLI 入口断言不作为 Phase 2 完成条件。
5. 复用现有 execution lock、step record、plan record、confirmation record 和 completed record。

依赖顺序固定为 `T007 → {T008, T009} → T010 → T011`；T008 与 T009 可在 T007 后独立实现，但进入 T010 前必须各自 GREEN。

Phase 2 只跑 close 的 core 测试并从 RED 到 GREEN；依赖 CLI `execute` 的端到端断言明确保留为 RED，直到 Phase 3 的 T011。

## Phase 3：薄 CLI 与 Skill

- T011：`scripts/task-close.mjs` 新增 `execute`，只加载 prepared plan，构造受控 delivery executors并调用现有 executor seam；完成判据是 T003 的 confirmed CLI 六步端到端与 rejected/timeout CLI 零写入断言 GREEN。
- `workflows/verify-code/SKILL.md` 把手工六步替换为 `prepare → confirm → execute → status`；说明只有 completed 才能报告 close 完成。
- 不增加策略参数、恢复命令或第二入口。

## Phase 4：回归与独立审查

运行：

1. `npx vitest run tests/task-close-delivery.test.mjs`
2. `npx vitest run tests/terminal-runtime-blockers.test.mjs`
3. `npx vitest run tests/task-close*.test.mjs`
4. `npm test`

为每个实现 Phase 生成冻结 diff scan；build-code 3rd-review 同时使用 OpenCode、Claude Code 与 simplicity-guard。任何 blocking/major finding 修复后重跑测试和审查。

## 失败处理

- 生产代码净增超过 350 行：停止并删除抽象，不通过追加文件解决。
- 发现必须新增 schema、通用 Git 框架或 launcher：返回 spec，不在 build-code 偷加。
- 现有 generic executor 回归失败：先修兼容性，不复制一套 delivery executor 状态机。

## 宪法检查

- F1/F2：重用现有 close core 和窄 CLI。
- F7：计划确认与 close plan-hash 确认是两个独立边界。
- F8/F10：固定动作、零依赖、零通用扩展点。
- F9：RED/GREEN、故障注入和 live Git facts 均可证伪。
- Q3：代码裁决来自两个异源 provider。
