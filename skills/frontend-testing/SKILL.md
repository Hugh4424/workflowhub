---
name: frontend-testing
description: 在 build-code 看到真实 UI 改动后执行状态和交互测试；build-plan 只记录预判的 skill，不调用本技能。
---

# Frontend Testing

build-code按真实changed files确认frontend/UI后覆盖默认态及loading/empty/error/cancel/boundary/permission、重复操作/恢复，核文案、键盘/a11y与后端契约；组件快照不冒完整用户流程。

## UI 交付合同

每UI phase/task声明component action、real consumer、state owner、typed ViewModel、CSS/token owner、fixture、viewport/responsive、browser、keyboard/a11y、performance、screenshot、coverage limits；无可执行route给`N/A — reason`，不以not_applicable掩blocked/unknown。

负例覆盖上述各状态/恢复；检查duplicate component、无real consumer的删除、少于two consumers就extract-shared、缺state owner、CSS泄漏、global override、!important。保failure reason及截图数量；失败/blocked/unknown是事实，不是推进gate。

## build-code 实际消费

主会话按changed files选一次路线；沿ui-project-init「规范职责」读适用规则，同份原证据关联UI适用、各源路径/稳定节、version/作用域、owner/consumer/census及AC。缺源/stale/冲突各给影响/原owner；单design_revision、旧Design.md/Experience.md不代全部来源，旧源仅有据历史/可信条款输入。业务状态/权限/取消恢复取当前spec/API，token/API引用原源；执行结果不回写规范。消费handler实件，未运行官方handler非前置；Skill声明/解析非执行，未触发/触发未执行/已执行分记。

页面经isolated-browser-qa受控链调用一次，保service instance、API/DTO contract、隔离profile/invocation、viewport、console/network/focus/overflow、视觉/a11y/performance oracle、cleanup。fixture-only仅组件；服务身份不符/取消/browser或cleanup失败保failed/blocked/unknown，不用默认值改绿。

## 行为测试方法

断言/替身与证据读[backend-testing「行为测试与证伪」](../backend-testing/SKILL.md#行为测试与证伪)及「执行事实」，再依本UI流程执行。

## 写作规范

创建/编辑方法读`skills/spec-specify/SKILL.md`的WR001唯一规范，不复制。

来源权威[catalog](../catalog.yaml#skills.frontend-testing)；正文/小卡非权威，缺登记找维护者。AgentHub路径/采用及许可适用性unknown见登记。

## 同仓方法依赖

`skills/backend-testing/SKILL.md`、`skills/isolated-browser-qa/SKILL.md`、`skills/spec-specify/SKILL.md`、`skills/ui-project-init/SKILL.md`；按条件读，搬运带可读原件。
