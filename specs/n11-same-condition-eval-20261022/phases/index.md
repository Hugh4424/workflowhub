# Phase 索引 — 同条件评测与流程缺口修复（N11）

本件只导航实际 Phase 的权威引用与契约头字段，正文、命令与验收归各 Phase。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-验收规则与分级.md` | `L0 — 结果与变更` | `skills/test-routing-advisor/SKILL.md`；`workflows/verify-code/SKILL.md`；`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`docs/architecture/move-map.json`；`tests/contract/n11-acceptance-rules.test.mjs` | none | P2–P9 的实施者与 verify-code 复核者 |
| `P2` | `phases/P2-需求讨论质量.md` | `L0 — 结果与变更` | `skills/talk-with-zhipeng/SKILL.md`；`workflows/make-decision/SKILL.md`；`AGENTS.md`；`tools/cli/run-checks.mjs`；`tests/contract/n11-discussion-quality.test.mjs` | P1 | 下一张复杂任务的 make-decision 主会话与用户 |
| `P3` | `phases/P3-计划与执行质量.md` | `L0 — 结果与变更` | `workflows/build-plan/SKILL.md`；`runtime/stage/stage-content-contracts.mjs`；`tools/cli/check-stage-quality.mjs`；`tests/contract/n11-plan-quality.test.mjs` | P1 | build-plan 作者、build-code 实施者与独立审查者 |
| `P4` | `phases/P4-流程能力缺口.md` | `L0 — 结果与变更` | `skills/answer-as-page/SKILL.md`；`skills/answer-as-page/skill-bundle.json`；`skills/answer-as-page/scripts/render-answer-page.mjs`；`skills/deep-research/SKILL.md`；`skills/deep-research/skill-bundle.json`；`skills/deep-research/scripts/research-run.mjs`；`skills/stage-closeout/SKILL.md`；`skills/stage-reflection/SKILL.md`；`tools/cli/task-close.mjs`；`tests/contract/n11-capability-gaps.test.mjs`；`specs/Improvements.md` | P1 | 阶段主会话与后续任务执行者 |
| `P5` | `phases/P5-记录与结论缺口.md` | `L0 — 结果与变更` | `runtime/review/review-record-route.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/SKILL.md`；`runtime/task/final-chain-runner.mjs`；`skills/catalog.yaml`；`tests/contract/n11-review-channel.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`（仅 TCR 十例） | P1 | 审查派发者、verify-code 复核者与维护者 |
| `P6` | `phases/P6-评测侧适配.md` | `L0 — 结果与变更` |`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/scripts/build-us07-workflowhub-task.mjs`；`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/scripts/run-us07-workflowhub-cohort.mjs`；`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/scripts/run-us07-full-fixed-cohort.mjs`；`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/test-fixtures/us07-workflowhub/task-input-v2.json`；`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/runner/workboard-review-queue/v0.4.0/runner-config.json`；`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/test-fixtures/us07-workflowhub/fixed-upstream-n11-v2.json`；`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/tests/n11-modeltest-adaptation.test.mjs`；`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/scripts/provider-transport.mjs`；`docs/research/n11-modeltest-adaptation-runbook.md`；`runtime/distribution/skill-bundle-release.mjs`；`workflows/make-decision/skill-deps.yaml`；`docs/architecture/move-map.json`；`tests/integration/runner-clean-install.test.mjs` | P1 | P7 评测执行者与 ModelTest 维护者 |
| `P7` | `phases/P7-基线与同条件实跑.md` | `L0 — 结果与变更` | `docs/research/n11-evaluation-baseline-runbook.md`；`tests/acceptance/n11-eval-run-check.test.mjs` | P1, P2, P3, P4, P5, P6 | P8 判定者与 verify-code 复核者 |
| `P8` | `phases/P8-判定与成本.md` | `L0 — 结果与变更` | `tools/cli/n11-pairwise-judge.mjs`；`docs/research/n11-judge-and-cost.md`；`tests/contract/n11-pairwise-judge.test.mjs` | P7 | 用户与 verify-code 复核者 |
| `P9` | `phases/P9-整合端到端验收.md` | `L0 — 结果与变更` | `tests/acceptance/n11-integration-acceptance.test.mjs`；`docs/research/n11-integration-runbook.md`；`specs/n11-same-condition-eval-20261022/phases/P9-整合端到端验收.md`；`specs/n11-same-condition-eval-20261022/phases/index.md` | P1, P2, P3, P4, P5, P6, P7, P8 | 用户、verify-code 与后续维护者 |

P7 行指向唯一末验收 Phase 的上游执行 Phase；P9 是唯一全 AC 验收 Phase，逐条判定 25 条 AC。

P2–P6 写集互斥，只共享 P1 的依赖边；P7 依赖 P6 适配与 P1–P5 的流程修复；P9 消费全部上游原件。
