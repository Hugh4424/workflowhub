# ADR 0024：移除宿主会话绑定

- 状态：accepted
- 日期：2026-09-05
- 范围：WorkflowHub 五阶段运行链

## 背景

宿主会话绑定通过临时 state、hook 和 event 三个文件保存当前会话，再让
`stage-runtime` 自动猜测 task、step、skill 和阶段结果。它把执行身份与宿主
会话生命周期耦合，容易在并行任务、重试和隔离 worktree 中复用旧事实；还会让
阶段材料里的旧命令继续成为隐含前置条件。

## 决策

删除 `workflowhub-codex-session-state.mjs`、`workflowhub-codex-session-hook.mjs`
和 `workflowhub-codex-session-event.mjs`。身份只接受显式 `--project/--task`，或
当前已认证 worktree 的唯一 task manifest；缺失或冲突就 fail-closed。Stage Agent
bridge 的 `agent_run_id` 必须由调用方显式提供，缺失结果走
`unavailable`，不读取或扫描宿主会话。

step/skill 结果通过正式 `run` 输入提交。五份 workflow skill 保留
`stage-reflection`、`preflight` 和 `reflect` 约定，并在阶段末大白话总结逐项披露
未完成、失败、跳过、不适用、`unknown`、`unavailable` 和 `incomplete` 的项目。

## 后果

- 消除一套临时宿主状态和隐式 task 选择路径。
- 重试必须携带新的显式 `attempt_id` 和真实执行结果。
- 旧 task 记录、历史材料和历史测试事实只读保留，不再作为当前运行输入。
- 未提供 Stage Agent 结果时，运行结果保持 `unavailable`，不能伪造完成。

## 验证

由 `tests/contract/session-binding-removed.test.mjs` 验证三件套删除、五份 skill
文本零残留、live consumer 无旧模块引用和显式 bridge identity；对应 B5b 批次需
在授权后以单次 git 提交完成。
