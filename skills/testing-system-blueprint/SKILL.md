---
name: testing-system-blueprint
description: 在 build-plan 为每个 Task/Phase 生成分层测试和证据策略。
version: 1.0.0
---

# Testing System Blueprint

这是测试设计和缺口扫描技能，不是测试通过门。它读取当前 Task、实际 changed
files、FR/AC、Phase Card 和已核实接口，输出要写入 tasks.md 的测试策略。build-code
只执行该策略并记录真实结果，不在每个 Phase 重新调用本技能。

至少检查：行为结果、状态/数据流、错误/取消/恢复、权限/安全、并发/原子性、
跨模块 seam、可观测性/来源，以及 UI 适用时的加载/空/错误/边界和可访问性。
明确哪些维度不适用以及原因；不能只写“单测通过”。按真实改动选择
`simple|feature|fullstack`，不依赖 plan 预先贴的标签。

输出至少包含：scope、风险维度、测试层级、场景、命令、预期 oracle、fixture/service、
适用执行器、证据路径、覆盖限制和 snapshot 绑定。build-code 之后补写实际结果、跳过原因
和 evidence refs。报告是质量事实；缺失写
`unknown/incomplete`，不能伪造 pass，也不重复要求无关全量回归。
