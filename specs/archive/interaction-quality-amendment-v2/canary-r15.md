# R15 窄范围 Canary 结果

## 结论

R14 暴露的三项缺口均已通过真实 Multica Issue 验收。R15 只验证改过的 Prompt 和
build-code 公开合同，没有重复运行已经通过的五阶段流程。

## 已通过

- 项目资源没有单独映射候选工作区时，Code Builder 先做真实访问检查；路径可用便继续，
  没有向用户提出技术配置选择。
- Phase 子 Issue `ZHI-574` 只显示 **要做什么**、**完成标准**、**允许改动**、
  **怎么测试**、**完成后交给谁** 五个中文区块；没有路径、hash、内部 ID、英文卡片、
  provider 或精确命令。
- 最终完成卡使用最新 Phase 事实：明确写成“Phase 2 权限验证已真实触发失败并通过，
  跳过数为 0”，没有复用早期的“跳过”结论。
- 用户触发的重复唤醒任务完成，Agent 输出为空，没有新增 comment。
- 父 Issue `ZHI-573` 已为 `done`；临时 Phase Issue 已按验收要求取消。

## 复测中发现并修正

第一次重复唤醒时，前一个排队的系统任务仍发布了“正在检查”的进度句。该任务不是
用户重复唤醒任务，但仍违反无动作静默要求。Code Builder instructions 因此补充：

- 回读完成前不得发布进度 comment、工具前说明或“正在检查”。
- Issue 已完成且没有状态变化、新结果或下一动作时，最终输出必须为空。

补充后重新用真实 member mention 唤醒；任务状态为 `completed`，输出为空，评论数未增加。

## 边界

- 没有修改 Agent 的 model、provider、runtime、Skill ID 或绑定关系。
- 没有修改 Codex/Multica 平台代码。
- 没有新增 WorkflowHub runtime、schema、状态机或通用宿主适配。
