# S7 grill 会话记录

## 做了什么
- 3rd-review 重设计为两层架构：3rd-review 瘦身（纯异源审查引擎）+ wh-review 新建（workflowhub 专属）。
- pass 自动推进范围收窄：仅 build-spec、build-code 两个 stage 自动推进；make-decision/build-plan/verify-code 三个 stage pass 后靠人工确认后推进。
- build-code SKILL.md §7/§13 矛盾清理：采纳方向1，以 §13（双 subagent 聚合）为准，§7 改写为纯概念说明。
- intake 判据 C1-C6、verify-code 新鲜性判据 F1-F6 详细规则定案。
- 5 个 stage 收尾统一模板现状核查：已统一使用 docs/human-brief-template.md，A/B 两派收尾类型（人工确认型 vs 自动放行型）正好对应新定的自动推进范围规则，非缺陷。
- 新增验收要求 D7：需配套测试方案验证 wh-review + 瘦身后 3rd-review 组合可用，且整套方案能在 workflowhub 端到端跑通。

## 为何
现有 3rd-review 因调用时未传 stage 标识，路由匹配失败退回通用合同，11 份 stage 专属合同从未被使用；同时原 agenthub 已实现的分轮审查/降级/升级人机/报告渲染机制迁移时丢失。不修旧 bug，直接重设计解耦审查引擎与 stage 专属知识。

## 明确不做
- 本阶段（make-decision）不直接修改任何 stage 的 SKILL.md 代码，只出决策方向，实际改动留给 build-code/build-plan 阶段执行。
- 本阶段不设计/编写具体测试方案，只记录 D7 验收要求，具体测试方案设计执行留给 build-plan/verify-code 阶段。
- 不修复"checkpoint 从未路由生效"这个旧 bug 本身（已知 e96c257 已修复，用户确认不影响本次重设计方向）。

## 怎么验证
- D7 验收标准：新 wh-review 技能 + 瘦身后 3rd-review 技能组合可用，整套方案在 workflowhub 全流程中端到端跑通。
- intake 判据 C1-C6、verify-code 判据 F1-F6 均为机器可读字段校验（decision/scope.in/scope.out/open_questions 等标准字段非空）。

## 用户确认
用户 2026-07-05 对本摘要对应的口头确认（"认得，没错"）已收到，视为 grill 退出条件（用户能复述四件事）满足。
