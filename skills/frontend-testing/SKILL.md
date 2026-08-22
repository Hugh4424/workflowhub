---
name: frontend-testing
description: 在 build-code 看到真实 UI 改动后执行状态和交互测试；build-plan 只记录预判的 skill，不调用本技能。
version: 1.0.0
---

# Frontend Testing

仅在 build-code 检查真实 changed files 后确认 frontend/UI 范围时调用。除了默认态，还要
覆盖 loading、empty、error、cancel、boundary、permission 和重复操作；检查用户
可见文案、状态恢复、键盘/可访问性和与后端契约的边界。真实 UI 流程按仓库的
isolated browser QA 路由执行，截图和清理事实必须保留。

执行事实必须绑定 FR/AC、场景/oracle、命令和 expected exit、截图/证据路径、changed files、
snapshot、coverage limits 和不适用理由。build-code 只做真实流程执行；只做组件快照
不能冒充完整用户流程验收。

## UI 交付合同

每个 UI phase/task 必须写清 component action、real consumer、state owner、typed ViewModel、
CSS/token owner、fixture、viewport/responsive、browser、keyboard/a11y、performance、
screenshot 和 coverage limits。没有可执行 route 时写 `N/A — reason`；不能用 `not_applicable`
掩盖真实的 blocked/unknown。

状态与负例（negative fixtures）至少覆盖 loading、empty、error、cancel、boundary、permission、重复操作和
恢复路径。质量检查要拒绝 duplicate component、无 real consumer（no consumer）的删除、少于 two consumers
就 extract-shared、缺 state owner、CSS 泄漏、global override 和 `!important`；这些是失败事实，
不是推进 gate。失败、blocked、unknown 均保留 failure reason 和截图数量事实。
