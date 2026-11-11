# 功能规格：已跟踪历史证据关闭安全

## 这是什么，给谁用？
给 WorkflowHub close 调用者一个不误判历史证据且保留失败保护的关闭结果。

本任务独立修复 close 工具，不并入 C09 Phase。

依据是 TaskRoot 中的 scope-authorized 确认与 C09 原件。

## 一页看懂：谁要什么结果，怎么算通过？
需求 1 要求未改动的已跟踪历史证据可以通过关闭检查。

真实改动、未跟踪或忽略的 execution sidecar 仍须被拒绝。

cleanup 也须拒绝隐藏的 index 改动和未知忽略文件。

失败重试必须继续绑定原失败动作的 source head。

最大影响面是 `core/task-close.mjs` 与 `runtime/task/workspace.mjs`。

判据只在 Appendix A 的 AC-CLOSE-001。

## 为什么做，给谁用？
C09 原 `2026-11-09-062` close 准备记录以退出码 1 结束。

输出把 259 个已跟踪的 `quality/evidence/build-code/**` 路径当作 sidecar。

C09 `2026-11-09-002` 记录已经发布这些文件的副本。

本轮只读核对这 259 个路径在 main 和 C09 worktree 中均已跟踪。

逐文件字节比较未发现差异。

C09 `2026-11-10-105` 是 `DIRTY_TARGET`，不能当成本任务的实现失败。

C09 `2026-11-10-106` 的目标测试曾通过，但结果不绑定本 TaskRoot。

## 做成什么样？
验收 1 判 close 能区分未改历史证据与真实待发布改动。

验收 1 也判 hidden index、未知忽略文件和清理重试仍然 fail-closed。

完整判据见 Appendix A；本任务只有一个 P1/T001。

## 打算怎么做？
复用 `core/task-close.mjs` 的现有 sidecar 与 close 路径。

用关闭 Git fsmonitor 的状态扫描读取实际工作区变化。

按 `git ls-files -v` 识别被 index flag 隐藏的 tracked 路径。

复用 `runtime/task/workspace.mjs` 的现有清理分类和 TaskHandle 删除能力。

清理时复制并规范化 index，持有对应 index 锁后再请求 Git 移除。

失败重试只接受与先前失败动作绑定且仍可验证的 source head。

不新增公开接口、持久状态、证据账本或清理工具。

## 谁先谁后？
P1/T001 一次完成实现、两份目标测试和 AC-CLOSE-001 的首次执行。

独立审查与测试只读 P1 交付；发现问题回同一开发者修复。

## 还有什么没定？
产品方向与写入范围已由当前 TaskRoot 确认。

独立目标测试回执为 `quality/tests/2026-11-10-002-independent-close-safety-p1-20261111.json`，exit 0，59 passed/3 skipped。

OCR 审查 003/004 均为 `unavailable`、`blocked_before_dispatch`；provider 未读取材料，审查结论尚未取得。

恢复条件：主会话确认当前 index 通过 `phaseFilesFromIndex` 后，重派同一 OCR P1 route，并保留旧失败原件。

## 实现设计（全局权威）

### 代码锚点

`core/task-close.mjs` 的 `entries`、`assertNoSidecars` 与 close retry。

`runtime/task/workspace.mjs` 的 `inspectWorktreeCleanup` 与
`createTaskWorktreeRemoval`。

真实消费者是 `tools/cli/task-close.mjs` 与既有 close/workspace tests。

### 接口与失败语义

输入仍是当前 TaskHandle、Git worktree/index 与已记录的 close 动作。

正常历史证据不生成 sidecar 错误。

脏 tracked sidecar、untracked/ignored sidecar 或隐藏 index 变化保留拒绝。

未知忽略内容继续阻止物理移除，不据名称推定可删。

无法读 Git 状态、index 或授权事实时显式失败。

清理重试的 source head 不匹配时拒绝继续。

### 需求到任务追踪
| Source | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| U-CLOSE-001：当前 TaskRoot 的 `scope-authorized` 用户决定原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-task-close-tracked-evidence-safety-20261110/quality/evidence/human-confirmations/2026-11-10-001-make-decision-scope-authorized.json`；问题依据是 C09 原始 close 失败 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-dual-path-verification-20261103/quality/tests/2026-11-09-062-2026-11-09-c09-close-prepare.json` 与已发布 sidecar 记录 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-dual-path-verification-20261103/quality/evidence/close/2026-11-09-002-c09-sidecar-publication.json` | FR-CLOSE-001 | AC-CLOSE-001 | P1/T001 | ORACLE-CLOSE-TRACKED-EVIDENCE-SAFETY |

### 全局验证策略

在真实仓库模块上运行两份具名 Vitest 测试。

测试使用本地 Git fixture，并断言输出、失败类别与保留行为。

历史 C09 106 只提供先前同命令结果，不替代本任务回执。

无浏览器面；不涉及外部服务或真实用户数据。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-CLOSE-001**：close 接受未改动的已跟踪历史证据；真实改动、忽略或隐藏变化仍被拒绝，未知忽略内容不被清除，重试仍绑定先前失败的 source head。
  关联 FR-CLOSE-001。
  判定对象：Task close 准备、workspace cleanup 与失败后重试行为。
  执行者：未参与实现的独立测试执行者；在 P1 收口时读取真实实现与回执。
  输入：两份具名测试中的 Git fixtures；由测试创建并记录。
  环境：当前认证 task worktree、仓库安装的 Node/Vitest 与本地 Git。
  `gate_cmd`：`npx vitest run tests/close/close-contract.test.mjs tests/contract/workspace-cleanup.test.mjs`
  `oracle`：ORACLE-CLOSE-TRACKED-EVIDENCE-SAFETY。
  通过：正常 tracked 历史件不触发 `CLOSE_EXECUTION_SIDECARS`；脏、untracked、ignored、fsmonitor 或 index flag 隐藏的变化拒绝；未知 ignored bytes 保留且 cleanup 不移除 worktree；重试只接受已记录且可验证的 source head。
  失败：任一正例误报，任一负例未拒绝，用户文件被删除，或重试跨过 source head 漂移。
  样本与反例：测试 fixture 分别提供原样 tracked 文件、被改 tracked 文件、untracked/ignored sidecar、hidden index 变化、未知 ignored 文件与失败清理后的重试。
  证据：TaskHandle `captureCommand` 生成的本任务测试回执和 stdout 原件；预期回执为 `quality/tests/2026-11-10-001-close-safety-targeted.json`。
  限制：fixture 不证明远端平台行为；远端授权仍由已有 close 合同处理。
  成本：目标命令估算约 6 分钟，依据 C09 同命令记录的 295.96 秒；这是估算，不是通过门槛。
  资源：本地 Node/Vitest、本地 Git fixtures；无需外部账号或真实数据。
  范围：只判本任务 close-safety 交付，不判 C09 整体验收或物理 close。

## Appendix B — 需求与编号对照
| 中文编号 | 机器编号 | 含义 |
| --- | --- | --- |
| 需求 1 | FR-CLOSE-001 | 已跟踪历史证据不应触发 sidecar 拒绝 |
| 验收 1 | AC-CLOSE-001 | 关闭安全行为与失败路径 |
| 任务 1 | P1/T001 | 实现、验证和首次验收 |

- **FR-CLOSE-001**：close 接受未改动的已跟踪历史证据；真实改动、未跟踪、忽略或隐藏变化仍拒绝；未知忽略内容保留；清理重试继续绑定先前失败的 source head。
