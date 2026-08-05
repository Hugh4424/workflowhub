---
name: frontend-testing
description: 为 build-plan 的前端或用户可见 Task/Phase 设计状态和交互测试策略；build-code 执行已记录策略并留痕。
version: 1.0.0
---

# Frontend Testing

仅在 `test-routing-advisor` 选中 frontend/feature 范围时，在 build-plan 调用。除了默认态，还要
覆盖 loading、empty、error、cancel、boundary、permission 和重复操作；检查用户
可见文案、状态恢复、键盘/可访问性和与后端契约的边界。真实 UI 流程按仓库的
isolated browser QA 路由执行，截图和清理事实必须保留。

策略必须绑定 FR/AC、场景/oracle、命令和 expected exit、截图/证据路径、changed files、
snapshot、coverage limits 和不适用理由。build-code 只执行并补写实际结果；只做组件快照
不能冒充完整用户流程验收。
