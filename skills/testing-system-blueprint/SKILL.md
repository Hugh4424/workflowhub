---
name: testing-system-blueprint
description: 在 build-plan 为每个 Task/Phase 生成分层测试和证据策略。
---

# Testing System Blueprint

build-plan advisory设计，非通过/开始/继续/完成gate。post把风险/场景/oracle/证据/限制写spec全局策略和物理Phase逐Task卡；pre/history保plan/tasks。先读本技能再用test-routing-advisor选路线；build-code按真实changed files调用具体testing skill消费既有设计，不重跑蓝图/建第二ledger。

检查行为/状态数据流、错误取消恢复、权限安全、并发原子性、跨模块seam、可观测性/来源，UI适用时含加载/空/错误/边界/a11y；每维不适用给理由，不能只写单测通过。按真实改动选simple|feature|fullstack，不凭规划标签。

每Task设计按backend「执行事实」字段，另列scope、风险维度/层级、执行器；正常/负例、同gate_cmd目标RED/GREEN、具名失败断言、STOP/恢复属Task，Phase摘要不代。post只本Phase写集/受影响来源，旧snapshot只读，不建跨Phase绑定。实际结果/跳过原因/ref归build-code task facts，不回写作者Phase；缺失unknown/incomplete，不造pass或要求无关全量回归。

## 行为测试设计

设计oracle/替身/缺RED时，读[backend-testing「行为测试与证伪」](../backend-testing/SKILL.md#行为测试与证伪)及「执行事实」设计字段，填原Task，不提前执行build-code/造入口。

## 写作规范

创建/编辑方法读`skills/spec-specify/SKILL.md`的WR001唯一规范，不复制。

来源权威[catalog](../catalog.yaml#skills.testing-system-blueprint)；正文/小卡非权威，缺登记找维护者。AgentHub路径/采用及许可适用性unknown见登记。

## 同仓方法依赖

`skills/backend-testing/SKILL.md`、`skills/spec-specify/SKILL.md`；按条件读，搬运带可读原件。
