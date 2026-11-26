# 决策记录：已跟踪历史证据关闭安全

## 目标是什么？
修复 close 把未改动的已跟踪历史证据误报为待发布 sidecar 的问题。

## 采用什么方案？
需求 1 采用已提供的精确补丁，限定在现有 close 与 workspace owner。

补丁 SHA-256 为
`3cdbe6087a5012b1856efcac9709d67093bad4e97d17e380e9daafabcc2f6172`。

补丁不新增公共命令、状态、证据 writer 或兼容路径。

在 `assertNoSidecars` 中用实际跟踪状态和工作区改动区分历史件与 sidecar。

在 workspace cleanup 中检查被 Git index flag 隐藏的变化，并安全移除。

cleanup 重试继续绑定之前失败动作记录的 source head。

## 依据与限制是什么？
C09 的旧 close 记录 259 个 `CLOSE_EXECUTION_SIDECARS` 路径。

C09 发布记录显示这些路径已被保存在任务证据中。

本轮核对的 259 个路径都由 main 与 C09 worktree 跟踪，字节相同。

C09 的后续测试记录只作历史事实，不绑定本任务。

本任务只修改当前 spec、Phase 与四个授权代码/测试路径。

不修改 C09 材料、main、远端、图或其它代码。

## 写入怎样并发与回滚？
本任务由一名开发者串行写入；独立测试者和审查者只读。

代码复用 `core/task-close.mjs` 与 `runtime/task/workspace.mjs` 的现有 owner。

TaskRoot 原件只通过已认证 TaskHandle 写入。

workspace index 在移除期间使用实际 index 文件锁保护。

若验收失败，只回退本任务四个代码/测试文件到指定 base。

回退时保留本任务 TaskHandle 原件和 C09 历史原件。

## 旧编号如何对应？
| 中文编号 | 当前编号 | 含义 |
| --- | --- | --- |
| 需求 1 | FR-CLOSE-001 | 关闭检查区分历史件与真实改动 |
| 验收 1 | AC-CLOSE-001 | 正反例与重试绑定行为 |
| 任务 1 | P1/T001 | 完成实现、测试与首次验收 |
