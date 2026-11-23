# Phase 索引 — 方向与需求

按各独立 Phase 的实际契约导航；写集、依赖与消费者来自其机器字段。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-question-routing.md` | `这一 Phase 交出什么？` | `skills/talk-with-zhipeng/SKILL.md`；`workflows/make-decision/SKILL.md` | none | P2、P3、P4、P6、P7 |
| `P2` | `phases/P2-commitment-source.md` | `这一 Phase 交出什么？` | `skills/decision-log/templates/decision-log-template-v2.md`；`tools/cli/check-decision-log-chain.mjs`；`tests/contract/decision-evidence-consumption.test.mjs`；`specs/delivery-quality-direction-requirements-20261122/decision-log.md` | none | P3、P4、P6、P7 |
| `P3` | `phases/P3-unanswered-coverage.md` | `这一 Phase 交出什么？` | `tests/contract/decision-evidence-consumption.test.mjs`；`tests/contract/final-chain-runner.test.mjs`；`skills/decision-log/templates/decision-log-template-v2.md`；`tools/cli/check-decision-log-chain.mjs`；`specs/delivery-quality-direction-requirements-20261122/decision-log.md`；`quality/evidence/decision-log-refs/coverage-matrix-5d.md` | P2 | P4、P6、P7 |
| `P4` | `phases/P4-invalidation.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`skills/decision-log/templates/decision-log-template-v2.md`；`tools/cli/check-stage-steps.mjs`；`tests/contract/check-stage-steps.test.mjs`；`specs/delivery-quality-direction-requirements-20261122/decision-log.md` | P1、P2、P3 | P5 同包讨论；P6 独立计划作者；P7 整链验证者 |
| `P5` | `phases/P5-package-discussion.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/step-consumer-design.md`；`tools/cli/check-stage-steps.mjs`；`tests/contract/check-stage-steps.test.mjs`；`tests/contract/decision-evidence-consumption.test.mjs` | P4 | P6 独立计划作者；P7 整链验证者 |
| `P6` | `phases/P6-first-card.md` | `这一 Phase 交出什么？` | none | P2（早期）；P1、P3、P4、P5（仅最终） | P7 整链验证者；任务三可后续读取，不是验收前提 |
| `P7` | `phases/P7-chain-readback.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`skills/stage-handoff/SKILL.md` | P1、P2、P3、P4、P5、P6 | 用户；收口主会话；后继计划与交接读者 |

## 并行与合并导航（人读指针）

- 总体顺序和共享写序见 [规格：谁先谁后](../spec.md#谁先谁后) 与 [全局写集](../spec.md#全局写集与共享写序是什么)。
- [阶段 1](P1-question-routing.md) 和 [阶段 2](P2-commitment-source.md) 仅写集互斥时并行；共享交回依次见 [阶段 3](P3-unanswered-coverage.md)、[阶段 4](P4-invalidation.md) 和 [阶段 5](P5-package-discussion.md)。
- [阶段 6](P6-first-card.md) 的早期与最终供件分别见其开工就绪表。
- [阶段 7](P7-chain-readback.md) 是唯一全部验收的最终读回位置；沿途首判指向各自独立阶段。
