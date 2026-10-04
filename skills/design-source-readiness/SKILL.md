---
name: design-source-readiness
description: 从项目级 Design.md 派生可读的 Screen Read Map，并保留缺项与人工确认事实。
version: 1.0.0
---

# Design Source Readiness

在 build-plan UI 规划或 build-prd 条件设计分支，从只读 Design.md 与 Experience.md 整理 Screen Read Map，供 plan-design-review 使用。no score、no gate；不复制规范或增设设计权威。

## 方法

1. 读当前规范的实际路径、可读 version、section/page anchor 与职责。Design 只写视觉/组件规则；Experience 只写页面/交互/长期场景。缺来源、版本或冲突写 missing/unknown/stale 与影响，不能由标题 slug 编造稳定 anchor。
2. 对每个实际在范围内的页面/区块，写目标、主操作、状态、组件/token 来源、fixture、viewport、响应式/无障碍、Preview/截图路径，以及缺项和需人的决定。
3. binding_state 用 bindable（来源可读且引用适用）、not_bindable（缺文件或引用冲突）、unknown（尚不能判断）。bindable 只证明可以引用，不证明视觉质量。已有规则 bound_current；规则需调整时 update_required，说明负责作者，不改规范正文。
4. 输出 design_revision（人读版本）、binding_state、read_map、missing_items、freshness、实际 human_confirmation 或 N/A + reason。没有真实 Preview、fixture 或截图就说明 unknown/unavailable；用户决定可以推进未依赖这些事实的工作，但不能把缺失说成通过。

## 边界

来源与 Read Map 用普通文件/节路径，不要求 content_sha256、snapshot 或 runtime 认证函数。本技能只读派生材料，不写 task 状态，不让机器身份包装成为使用来源的前置条件。真实 UI 范围和未核实处保持可见，交给现有文档审查和后续实现验证。
