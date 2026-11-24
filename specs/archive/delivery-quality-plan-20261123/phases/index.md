# Phase 索引 — 交付质量计划

本索引只导航下方具名阶段，不复制任务、命令、判据、证据或执行进度。
行内写集、依赖与看结果的人取自实际阶段卡的机器字段；无法回读时交原作者。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-共用规则.md` | `这一 Phase 交出什么？` | `skills/unit-kernel/SKILL.md`；`skills/unit-kernel/skill-bundle.json`；`skills/catalog.yaml`；`skills/reuse-registry.md`；`repo-skills.manifest.json`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-prd/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/skill-deps.yaml`；`workflows/build-plan/skill-deps.yaml`；`workflows/build-prd/skill-deps.yaml`；`workflows/build-code/skill-deps.yaml`；`skills/decision-maker/SKILL.md`；`tests/contract/unit-kernel-wiring.test.mjs` | none | 字段与审查方法作者 |
| `P2` | `phases/P2-卡片字段.md` | `这一 Phase 交出什么？` | `skills/unit-kernel/SKILL.md`；`skills/unit-kernel/references/unit-fields.json`；`skills/unit-kernel/skill-bundle.json`；`skills/decision-maker/templates/card.md`；`skills/spec-prd/templates/prd-template.md`；`skills/spec-plan/templates/phase-template.md`；`skills/decision-maker/scripts/validate-card.mjs`；`tools/cli/check-stage-steps.mjs`；`tools/cli/check-stage-quality.mjs`；`docs/architecture/move-map.json`；`tests/contract/unit-card-field-consumption.test.mjs` | P1 | 步骤读取与审查作者 |
| `P3` | `phases/P3-独立审查与强制读取.md` | `这一 Phase 交出什么？` | `skills/unit-kernel/SKILL.md`；`skills/unit-kernel/references/review-protocol.md`；`skills/unit-kernel/skill-bundle.json`；`skills/decision-maker/SKILL.md`；`skills/phase-maker/SKILL.md`；`skills/task-maker/SKILL.md`；`skills/run-phase/SKILL.md`；`skills/phase-maker/skill-bundle.json`；`skills/task-maker/skill-bundle.json`；`skills/run-phase/skill-bundle.json`；`workflows/make-decision/steps.json`；`workflows/build-plan/steps.json`；`workflows/build-prd/steps.json`；`workflows/build-code/steps.json`；`workflows/make-decision/skill-deps.yaml`；`workflows/build-plan/skill-deps.yaml`；`workflows/build-prd/skill-deps.yaml`；`workflows/build-code/skill-deps.yaml`；`skills/catalog.yaml`；`skills/reuse-registry.md`；`repo-skills.manifest.json`；`docs/architecture/move-map.json`；`tools/cli/check-stage-steps.mjs`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-prd/SKILL.md`；`workflows/build-code/SKILL.md`；`tests/contract/skill-usage-negative.test.mjs` | P2 | 计划试点作者 |
| `P4` | `phases/P4-计划首卡与供件.md` | `这一 Phase 交出什么？` | `skills/phase-maker/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`tools/cli/check-stage-steps.mjs`；`docs/architecture/move-map.json`；`tests/contract/phase-author-first-card.test.mjs` | P3 | 计划判据和索引作者 |
| `P5` | `phases/P5-判据期限与索引.md` | `这一 Phase 交出什么？` | `skills/phase-maker/SKILL.md`；`skills/spec-plan/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`docs/architecture/move-map.json`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-plan/templates/index-template.md`；`runtime/stage/stage-content-contracts.mjs`；`runtime/task/final-chain-runner.mjs`；`tools/cli/stage-runtime.mjs`；`tests/contract/phase-index-write-authority.test.mjs` | P4 | 任务节与代码首卡作者 |
| `P6` | `phases/P6-任务分节.md` | `这一 Phase 交出什么？` | `skills/task-maker/SKILL.md`；`skills/spec-prd/SKILL.md`；`skills/spec-prd/templates/prd-template.md`；`tests/contract/prd-task-section-consumption.test.mjs` | P5 | 任务审查作者 |
| `P7` | `phases/P7-任务分节审查.md` | `这一 Phase 交出什么？` | `skills/task-maker/SKILL.md`；`workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；`skills/spec-prd/SKILL.md`；`tests/contract/prd-sectional-review.test.mjs` | P6 | 方向交接作者及终末读者 |
| `P8` | `phases/P8-代码红测与演示.md` | `这一 Phase 交出什么？` | `skills/run-phase/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/build-code/steps.json`；`tests/contract/phase-public-demo.test.mjs` | P5 | 代码独立复验作者 |
| `P9` | `phases/P9-代码独立收敛.md` | `这一 Phase 交出什么？` | `skills/run-phase/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/build-code/steps.json`；`tests/contract/phase-independent-convergence.test.mjs` | P8 | 方向交接作者及终末读者 |
| `P10` | `phases/P10-方向交付承接.md` | `这一 Phase 交出什么？` | `skills/decision-maker/SKILL.md`；`skills/decision-maker/templates/package-context.md`；`skills/decision-log/templates/decision-log-template-v2.md`；`workflows/make-decision/SKILL.md`；`tests/contract/direction-handoff-source.test.mjs` | P7；P9 | 方向单包与全文审作者 |
| `P11` | `phases/P11-方向两路与全文.md` | `这一 Phase 交出什么？` | `skills/decision-maker/SKILL.md`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`skills/decision-maker/templates/adversarial.md`；`tests/contract/direction-package-review-scope.test.mjs` | P10 | 唯一终末独立读者 |
| `P12` | `phases/P12-末验与技能去向.md` | `这一 Phase 交出什么？` | `skills/catalog.yaml`；`skills/reuse-registry.md`；`repo-skills.manifest.json`；`workflows/make-decision/skill-deps.yaml`；`workflows/build-plan/skill-deps.yaml`；`workflows/build-prd/skill-deps.yaml`；`workflows/build-code/skill-deps.yaml`；`specs/delivery-quality-plan-20261123/closeout-report.md` | P7；P9；P11 | 主会话 |

## 并行与合并导航（人读指针）

总体顺序与共享写者见[规格](../spec.md#谁先谁后)。
同一文件即使改不同字段也算共享，前段实际交回后后段再写。
任务与代码仅写集互斥且供件独立时并行；方向等两边后接，末验只汇合实际已验与真缺项。

| 交付组 | 前置与共享责任 | 接手和首判 |
| --- | --- | --- |
| 1 | [阶段 1](P1-共用规则.md#每个文件由谁改先做什么) | [阶段 1](P1-共用规则.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 2 | [阶段 2](P2-卡片字段.md#每个文件由谁改先做什么) | [阶段 2](P2-卡片字段.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 3 | [阶段 3](P3-独立审查与强制读取.md#每个文件由谁改先做什么) | [阶段 3](P3-独立审查与强制读取.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 4 | [阶段 4](P4-计划首卡与供件.md#每个文件由谁改先做什么) | [阶段 4](P4-计划首卡与供件.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 5 | [阶段 5](P5-判据期限与索引.md#每个文件由谁改先做什么) | [阶段 5](P5-判据期限与索引.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 6、7 | [阶段 6](P6-任务分节.md#每个文件由谁改先做什么)、[阶段 7](P7-任务分节审查.md#每个文件由谁改先做什么) | [阶段 6](P6-任务分节.md#下一消费者拿什么继续)、[阶段 7](P7-任务分节审查.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 8、9 | [阶段 8](P8-代码红测与演示.md#每个文件由谁改先做什么)、[阶段 9](P9-代码独立收敛.md#每个文件由谁改先做什么) | [阶段 8](P8-代码红测与演示.md#下一消费者拿什么继续)、[阶段 9](P9-代码独立收敛.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 10 | [阶段 10](P10-方向交付承接.md#每个文件由谁改先做什么) | [阶段 10](P10-方向交付承接.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 11 | [阶段 11](P11-方向两路与全文.md#每个文件由谁改先做什么) | [阶段 11](P11-方向两路与全文.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
| 12 | [阶段 12](P12-末验与技能去向.md#每个文件由谁改先做什么) | [阶段 12](P12-末验与技能去向.md#下一消费者拿什么继续)；[唯一判据](../spec.md#appendix-a--验收判据唯一权威) |
