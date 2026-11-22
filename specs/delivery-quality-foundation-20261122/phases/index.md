# Phase 索引 — 交付质量公共底座

> 本文件只是七份独立 Phase 的纯指针，由实际契约头生成。
> 产品目标、验收、命令、oracle、证据和完成条件均不在本文件复制。
> 指针可读或结构一致不证明实施、审查、测试或验收完成。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | `这一 Phase 交出什么？` | `workflows/make-decision/steps.json`；`workflows/build-plan/steps.json`；`tools/cli/check-stage-steps.mjs`；`tools/cli/run-checks.mjs`；`tests/contract/package-material-consumption.test.mjs`；`tests/contract/check-stage-steps.test.mjs`；`tests/contract/decision-evidence-consumption.test.mjs` | none | Phase 2、3、4 及独立计划作者 |
| `P2` | `phases/P2.md` | `这一 Phase 交出什么？` | `skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/contracts/provider-protocol.md`；`skills/wh-review/SKILL.md`；`workflows/make-decision/steps.json`；`runtime/review/review-output.mjs`；`runtime/review/canonical-review-result.mjs`；`runtime/review/review-record-route.mjs`；`runtime/review/schemas/result.schema.json`；`tests/contract/review-effect-lens.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`tests/contract/review-axes-contract.test.mjs`；`tests/review/review-record-route.test.mjs` | P1 | Phase 3、6 及审查记录读者 |
| `P3` | `phases/P3.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/skill-deps.yaml`；`workflows/make-decision/flows/normal/SKILL.md`；`workflows/make-decision/flows/normal/steps.json`；`workflows/make-decision/flows/small/SKILL.md`；`workflows/make-decision/flows/small/steps.json`；`skills/decision-maker/SKILL.md`；`skills/decision-maker/templates/cold-read.md`；`skills/decision-maker/templates/adversarial.md`；`tools/cli/check-stage-steps.mjs`；`tools/cli/run-checks.mjs`；`tests/contract/convergence-defaults.test.mjs`；`tests/contract/convergence-card-contract.test.mjs`；`tests/contract/module-convergence-card.test.mjs`；`tests/contract/check-stage-steps.test.mjs`；`tests/contract/decision-evidence-consumption.test.mjs` | P1；P2 | Phase 4、6 及逐包方法读者 |
| `P4` | `phases/P4.md` | `这一 Phase 交出什么？` | `tools/cli/stage-runtime.mjs`；`workflows/build-code/change-scope.mjs`；`tools/cli/check-stage-steps.mjs`；`tools/cli/run-checks.mjs`；`runtime/task/final-chain-runner.mjs`；`workflows/make-decision/steps.json`；`workflows/make-decision/flows/small/steps.json`；`workflows/make-decision/flows/normal/steps.json`；`workflows/make-decision/flows/planning/steps.json`；`workflows/build-prd/steps.json`；`workflows/build-plan/steps.json`；`workflows/build-code/steps.json`；`specs/delivery-quality-foundation-20261122/step-consumer-design.md`；`tests/contract/stage-write-set-reconciliation.test.mjs`；`tests/contract/step-evidence-contract.test.mjs`；`tests/contract/n11-plan-quality.test.mjs`；`tests/contract/light-implementation-review.test.mjs`；`tests/contract/check-stage-steps.test.mjs`；`tests/contract/build-code-change-scope.test.mjs`；`tests/contract/build-code-readiness.test.mjs` | P1；P3 | Phase 5、6 及阶段事实读者 |
| `P5` | `phases/P5.md` | `这一 Phase 交出什么？` | `runtime/distribution/runner-release.mjs`；`tools/cli/run-checks.mjs`；`tools/cli/check-anti-host.mjs`；`tools/cli/check-stage-quality.mjs`；`tools/cli/verify-structure.mjs`；`tools/cli/stage-runtime.mjs`；`runtime/evidence/acceptance-evidence-validator.mjs`；`runtime/task/final-chain-runner.mjs`；`runtime/review/schema-validator.mjs`；`runtime/review/review-record-route.mjs`；`docs/standard-workflow.md`；`docs/release-support-matrix.md`；`README.md`；`GLOSSARY.md`；`tests/contract/terminal-risk-acceptance.test.mjs`；`tests/contract/result-schema-contract.test.mjs`；`tests/integration/runner-clean-install.test.mjs`；`tests/contract/release-tree.test.mjs`；`tests/contract/doctor-interface.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`tests/contract/status-derivation.test.mjs`；`tests/review/review-record-route.test.mjs`；`tests/contract/review-public-entrypoints.test.mjs`；`tests/contract/code-review-ocr.test.mjs`；`tests/contract/stalled-consumer-delta.test.mjs`；`tests/contract/terminal-chain.test.mjs` | P4 | Phase 6、7 及安装和收口读者 |
| `P6` | `phases/P6.md` | `这一 Phase 交出什么？` | `runtime/review/stage-review-disposition.mjs`；`docs/architecture/move-map.json`；`docs/architecture/control-plane-inventory.json`；`docs/adr/0030-mechanism-simplification-deletion-boundary.md`；`skills/catalog.yaml`；`runtime/evidence/workflow-evolution.mjs`；`tools/cli/smoke-local-skill-dispatch.mjs`；`runtime/evidence/research-report.mjs`；`runtime/review/ocr-delegation-adapter.mjs`；`tools/cli/onboard-release.mjs`；`skills/decision-maker/skill-bundle.json`；`workflows/build-code/SKILL.md`；`workflows/build-code/steps.json`；`workflows/build-plan/steps.json`；`skills/spec-plan/templates/phase-template.md`；`docs/standard-workflow.md`；`tests/contract/retirement-registry.test.mjs`；`tests/contract/stage-registry.test.mjs`；`tests/contract/lessons-jsonl.test.mjs`；`tests/contract/research-report-current.test.mjs`；`tests/contract/ocr-delegation-adapter.test.mjs`；`tests/contract/onboard-release.test.mjs`；`tests/contract/acceptance-plan.test.mjs`；`tests/contract/repository-inventory.test.mjs` | P2；P3；P4；P5 | Phase 7 及治理与历史读者 |
| `P7` | `phases/P7.md` | `这一 Phase 交出什么？` | `specs/delivery-quality-foundation-20261122/closeout-report.md` | P1；P2；P3；P4；P5；P6 | 用户、接续者、独立验收者与负责包 owner |

## 并行与合并导航（人读指针）

所有 Phase 按依赖串行；本表只指向真实分工，不复制写集、命令或判据。
同文件不同字段仍属共享路径；任何冲突回原 writer，不建立第二协调账本。

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末 AC 指针 |
| --- | --- | --- | --- | --- |
| 组一：P1 | 无前置；独占本阶段写入 | P1→P2→P3→P4，见各 Phase「定序写主」 | P1「下一消费者拿什么继续？」 | spec Appendix A；P1「Done」 |
| 组二：P2 | 消费 P1 已核交接；不并行 | P1→P2→P3，见 P2「定序写主」 | P2「下一消费者拿什么继续？」 | spec Appendix A；P2「Done」 |
| 组三：P3 | 消费 P1、P2；冻结测试先批准 | P2→P3→P4，见 P3「定序写主」 | P3「下一消费者拿什么继续？」 | spec Appendix A；P3「Done」 |
| 组四：P4 | 消费 P1、P3；内部包3→包5 | P3→P4→P5，见 P4「定序写主」 | P4「下一消费者拿什么继续？」 | spec Appendix A；P4「Done」 |
| 组五：P5 | 消费 P4；三任务同 writer 顺序执行 | P4→P5→P6，见 P5「定序写主」 | P5「下一消费者拿什么继续？」 | spec Appendix A；P5「Done」 |
| 组六：P6 | 消费 P2至P5；三批顺序执行 | P5→P6，见 P6「定序写主」 | P6「下一消费者拿什么继续？」 | spec Appendix A；P6「Done」 |
| 组七：P7 | 消费 P1至P6；唯一全 AC 末验收 | 只写收口报告，见 P7「每个文件由谁改，先做什么？」 | P7「验收 Phase 才能做的检查」 | spec Appendix A 全部 AC；P7「Done」 |
