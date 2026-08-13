---
status: proposed
---

# ADR 0013 — mini-task 精简功能交付流程

WorkflowHub 保留完整五阶段作为标准交付路径，同时新增 `mini-task`：用户可直接用它交付边界清楚的小功能，普通任务也可在被必要依赖或修复阻塞时用它先完成独立前置交付。mini-task 不成为第六个 stage，不恢复历史 `scope_revision` 或 successor/reopen/rebind/continuation/recovery；它紧凑复用四材料，以 `mini_task.design` 和 `mini_task.implementation` 两次专用异源审查取代同范围普通 review，并绑定真实测试、风险接受和 Git 授权后交付。

选择精简流程是为了避免小功能承担完整五阶段成本；保留四材料、两次审查和真实交付，是为了防止“轻量”退化成聊天后直接改代码。若范围明显膨胀，必须由用户选择缩小或创建普通五阶段任务，不能自动转换。

## 冻结边界

- 每个 mini-task 使用独立 task ID、隔离 worktree 和 branch。由任务 A 触发时，A 只记录阻塞原因、mini-task ID、所需结果和最终 merge commit，不创建 predecessor/successor 关系对象。
- `/Users/Hugh/.config/workflowhub/config.json` 在 `wh_review.mini_task.design` 与 `wh_review.mini_task.implementation` 分别配置方案审查和实施审查；两者替代同范围普通 review，不能互相替代。
- design review 消费紧凑四材料；implementation review 还必须消费当前 diff/snapshot、受影响测试和 oracle、实际结果、AC trace、coverage limits、剩余风险，以及与功能类型相称的真实用户结果验证。
- mini-task 默认用于边界清楚、单一结果、影响面有限且不需要重大架构、迁移、权限或安全决定的功能；用户可明确指定使用，但 Agent 必须披露额外风险。范围明显变大时暂停，由用户选择缩小或创建普通五阶段任务。
- 创建时的 Git 预授权必须通过独立 `authorize`，绑定明确 task、branch、操作和范围；最终执行绑定真实 snapshot 并读回。对象或范围变化必须重新授权，需求确认本身不包含 Git 授权。
- A 有未提交进度时，必须先取得授权并创建只包含 A 当前改动的真实进度 commit。mini-task 合并到目标分支后，目标分支正常 merge 进 A，解决冲突并只重验受影响范围，再以 A 当前 worktree/HEAD 普通调用原 stage；不恢复 continuation/rebind/checkpoint。

## 审查失败与质量真实性

provider 恢复是通用 wh-review 能力，不是 mini-task 私有规则。每次审查在同一当前 snapshot 上最多发起三次新的公开异源请求，各自保存不可变 attempt；真实 finding 进入当前工作修复，不算失败重试。仍没有有效异源语义结果时，可使用当前 provider 的独立子代理，但必须标为 `SAME_SOURCE`，不能满足宪法 Q3，也不能把质量状态改成完成。

如果只能取得同源 fallback，任何带风险交付前必须披露三次失败、fallback 来源和未覆盖风险，并让用户针对当前 snapshot 明确接受风险。风险接受只授权该次带风险交付，不把 review 改写为异源、不把质量 `incomplete` 改成 `passed`，也不能替代独立 Git 授权。
