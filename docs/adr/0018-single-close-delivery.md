# ADR 0018：`close` 是唯一的完整交付动作

## 状态

Accepted — 2026-08-22

## 背景

把“记录任务结束”和“完成 Git 交付”拆成两个用户动作，导致用户说了 close，系统却只写状态记录，
没有 commit、归档、merge、push 或清理。这会让任务状态和真实交付事实产生语义错位。

## 决策

- `task-close.mjs close` 是唯一的用户-facing close 动作。
- 一次 `close` 自动冻结 delivery plan，并把这次用户调用绑定为人工确认；逐项不可逆授权由运行时内部
  生成，不要求用户重复输入同一意图。
- close 必须真实执行并读回 commit、spec archive、merge、push、worktree cleanup 和 branch cleanup，
  全部物理事实成立后才写 `operations/close/completed.json`。
- 质量或产品发布缺口可以作为风险事实保留，不伪造通过，也不因此把 close 改成另一种状态动作。
- 目标仓库脏、身份/分支/worktree 漂移、远端基线变化、冲突或不安全清理属于结构错误，必须 fail-loud。
- `prepare`、`confirm`、`execute`、`complete` 仅保留为内部恢复和测试接口，不是额外的用户审批流程。

## 责任与消费者

- 唯一用户入口：`tools/cli/task-close.mjs close`。
- 唯一完整交付编排：`core/task-close.mjs` 的 `closeDelivery`。
- 完成事实消费者读取 `operations/close/completed.json` 和绑定的 operation facts；质量、发布和风险仍读取
  各自的事实记录。

## 删除/保留条件

旧的双语义结束记录只读保留在历史任务中，不再被当前运行时读取或写入。内部 risk executor 仅为
已有计划的恢复和测试保留；不得新增第二个用户-facing close 命令或第二个任务结束状态机。
