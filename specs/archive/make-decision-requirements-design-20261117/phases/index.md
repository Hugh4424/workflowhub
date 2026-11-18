# 阶段索引 — make-decision需求设计改进

本文件只导航实际独立阶段，完整输入、步骤和判据均在所指文件。
正式阶段大纲已取得用户真实答复，完整计划最终确认仍由主会话按现方法取得。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `tools/cli/check-decision-log-chain.mjs`; `tests/contract/decision-evidence-consumption.test.mjs` | none | P2、P3、P5、P6、P8的需求作者 |
| `P2` | `phases/P2.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/decision-log/templates/decision-log-template.md` | P1 | P4、P5、P6、P8的结构与验收作者 |
| `P3` | `phases/P3.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `skills/deep-research/SKILL.md` | P1、P2 | P4、P5、P6、P8的方案与验收作者 |
| `P4` | `phases/P4.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `skills/wh-review/contracts/make-decision.md` | P2、P3 | P5、P6、P8、P9的方案与审查作者 |
| `P5` | `phases/P5.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `workflows/make-decision/steps.json`; `skills/decision-log/templates/decision-log-template.md`; `tools/cli/check-stage-steps.mjs`; `tests/contract/decision-evidence-consumption.test.mjs` | P2、P3、P4 | P6、P8、P9的验收与检查器作者 |
| `P6` | `phases/P6.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `skills/spec-specify/SKILL.md` | P5 | P7、P8、P9及后续build-plan验收作者 |
| `P7` | `phases/P7.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/decision-log/templates/decision-log-template.md` | P1、P2、P3、P4、P5、P6 | P8的形状检查作者与build-plan/build-code读者 |
| `P8` | `phases/P8.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `workflows/make-decision/steps.json`; `tools/cli/check-stage-steps.mjs`; `tools/cli/check-decision-log-chain.mjs`; `tools/cli/run-checks.mjs`; `workflows/make-decision/flows/small/SKILL.md`; `workflows/make-decision/flows/normal/SKILL.md`; `workflows/make-decision/flows/planning/SKILL.md`; `tests/contract/check-stage-steps.test.mjs`; `tests/contract/n10-check-core.test.mjs`; `tests/contract/run-checks-zero-attestation.test.mjs`; `tests/contract/decision-evidence-consumption.test.mjs` | P1、P2、P3、P4、P5、P6、P7 | P9、P10、P11及后续build-plan/build-code的报告消费者 |
| `P9` | `phases/P9.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/spec-analyze/SKILL.md`; `skills/spec-specify/SKILL.md`; `skills/wh-review/contracts/make-decision.md`; `workflows/build-plan/SKILL.md`; `workflows/build-code/SKILL.md` | P6、P8 | P11与三阶段收口、后续spec-analyze执行者 |
| `P10` | `phases/P10.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `workflows/make-decision/steps.json`; `skills/decision-log/templates/decision-log-template.md`; `workflows/build-plan/SKILL.md`; `skills/frontend-prototype-render/SKILL.md`; `tests/contract/ui-stage-make-decision.test.mjs`; `tests/contract/decision-evidence-consumption.test.mjs`; `tools/cli/check-stage-steps.mjs` | P1、P8、P9 | UI任务的make-decision、build-plan与build-code执行者 |
| `P11` | `phases/P11.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`; `skills/answer-as-page/SKILL.md`; `skills/answer-as-page/scripts/build-page-data.mjs`; `skills/answer-as-page/scripts/render-answer-page.mjs`; `skills/answer-as-page/templates/overview-template.html`; `skills/answer-as-page/scripts/check-page-content.mjs`; `skills/answer-as-page/skill-bundle.json`; `runtime/task/final-chain-runner.mjs`; `tests/contract/cockpit-autogen.test.mjs`; `tests/contract/cockpit-event.test.mjs`; `tests/contract/final-chain-runner.test.mjs`; `docs/architecture/move-map.json`; `workflows/build-code/SKILL.md`; `skills/stage-handoff/SKILL.md`; `tests/contract/decision-evidence-consumption.test.mjs`; `skills/answer-as-page/scripts/open-page.mjs`; `workflows/make-decision/steps.json`; `tools/cli/check-stage-steps.mjs` | P8、P9、P10 | make-decision驾驶舱、build-code终末与stage-close页面读者 |

## 并行与合并导航（人读指针）

共享写入顺序与实际依赖见spec“谁先谁后”和各Phase“每个文件由谁改”。
当前各Phase公共方法/模板/测试互相承接，生产写入按上表串行。
只读测试面可并行，真实互斥前提与原件汇合见对应Phase。
首判在各Phase验收节，整任务终末消费只在阶段十一的末验收检查。
