---
name: fullstack-slice-testing
description: 在 build-code 看到真实跨边界改动后执行最小真实链路测试；build-plan 只记录预判的 skill，不调用本技能。
---

# Fullstack Slice Testing

build-code按changed files确认跨前端/API/后端/数据库、认证/协议/并发或边界不清时，贯通一条用户可观察slice：启动/健康→输入→真实请求→服务→持久化→返回→前端呈现及失败/恢复。保端口/进程/fixture/schema/协议/清理；mock-only不代seam，build-plan不执行。

## 行为测试方法

slice断言/替身/缺RED/证据读[backend-testing「行为测试与证伪」](../backend-testing/SKILL.md#行为测试与证伪)及「执行事实」；同一循环贯通真实链路，记适用截图/未覆盖seam。

## 写作规范

创建/编辑方法读`skills/spec-specify/SKILL.md`的WR001唯一规范，不复制。

来源权威[catalog](../catalog.yaml#skills.fullstack-slice-testing)；正文/小卡非权威，缺登记找维护者。AgentHub路径/采用及许可适用性unknown见登记。

## 同仓方法依赖

`skills/backend-testing/SKILL.md`、`skills/spec-specify/SKILL.md`；按条件读，搬运带可读原件。
