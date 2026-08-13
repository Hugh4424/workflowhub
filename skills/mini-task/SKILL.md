---
name: mini-task
description: 用独立 task/worktree/branch 紧凑交付一个小功能，并在需要时恢复被它阻塞的普通任务 A。
---

# mini-task

`mini-task` 是独立的小功能交付流程，不是第六个正式 stage，也不是历史
`scope_revision`、successor、continuation 或 recovery 状态。它只在独立
TaskHandle、worktree 和 branch 中工作，复用当前四份材料和既有 quality/Git
能力。

## 适用边界

默认适用于边界清楚、单一结果、影响面有限，且不需要重大架构、迁移、权限或安全
决定的需求。用户可以明确指定使用；此时必须把额外风险写进材料。范围明显变大时
暂停，让用户选择缩小当前 mini-task 或重新创建普通五阶段任务，不自动转换。

## 固定流程

1. 创建独立 task/worktree/branch，先用精简模板一次形成 `decision-log.md`、
   `spec.md`、`plan.md`、`tasks.md`。
2. 调用 `wh-review` 的 `mini_task.design`，只审冻结的四份材料和方案风险；有效
   finding 在当前 mini-task 内修复。
3. 实现功能，执行与功能类型相称的真实用户结果和聚焦测试。
4. 调用 `wh-review` 的 `mini_task.implementation`，材料必须包含当前
   diff/snapshot、测试命令和 oracle、实际结果、逐 AC trace、coverage limits、
   跳过理由和剩余风险；有效 finding 仍在当前 mini-task 内修复。
5. 使用现有 `task-close` 完成计划内且已授权的 Git 操作，并逐项读回物理结果。
   未授权保持 `pending/incomplete`；不在计划内的操作记录 `skipped` 和理由。
6. 如果由任务 A 触发，先按授权保存 A 的真实进度；mini-task 交付后，在认证的 A
   worktree 中把冻结目标 OID 正常 merge 进 A，冲突就地 abort 并保留证据，重验受影响
   范围，再从 A 原来的 stage 普通重调。不要创建任务关系对象。

取消只停止未来动作，保留四份材料、facts、worktree、branch 和已有 Git 对象；任何
   reset、删除、回退或 cleanup 都必须另行明确授权。

## Runner

`scripts/mini-task-runner.mjs` 是薄编排层。它不启动 provider、不读取私有 session、
不写第五份材料、不发布 mini stage completion，也不改变七类公共 runtime。
