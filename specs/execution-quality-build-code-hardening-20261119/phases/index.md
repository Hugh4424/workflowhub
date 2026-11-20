# Phase 索引 — WorkflowHub 开发任务质量与实施效率

各阶段文件是交付、风险、命令与验收判据的权威。索引只导航。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-skill-loading.md` | `这一 Phase 交出什么？` | `tools/cli/check-stage-steps.mjs`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`tests/contract/check-stage-steps.test.mjs` | none | P2 的交接读取者 |
| `P2` | `phases/P2-evidence-handoff.md` | `这一 Phase 交出什么？` | `tools/cli/check-stage-steps.mjs`；`tests/contract/check-stage-steps.test.mjs`；`skills/stage-handoff/SKILL.md`；`workflows/build-plan/SKILL.md`；`tools/cli/check-decision-log-chain.mjs`；`tests/contract/decision-evidence-consumption.test.mjs` | P1 | P3 的逐包决策与后续规划作者 |
| `P3` | `phases/P3-package-decisions.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`skills/decision-log/SKILL.md`；`skills/decision-log/skill-bundle.json`；`skills/decision-log/templates/decision-log-template-v2.md`；`skills/decision-maker/SKILL.md`；`skills/decision-maker/skill-bundle.json`；`skills/decision-maker/templates/package-context.md`；`skills/decision-maker/templates/card.md`；`skills/decision-maker/templates/cold-read.md`；`skills/decision-maker/templates/adversarial.md`；`skills/decision-maker/scripts/dispatch.mjs`；`skills/decision-maker/scripts/validate-card.mjs`；`skills/decision-maker/scripts/status.mjs`；`skills/catalog.yaml`；`repo-skills.manifest.json`；`tests/contract/decision-evidence-consumption.test.mjs` | P2 | P4 的数据准备与 P5 的开工检查规划作者 |
| `P4` | `phases/P4-test-data.md` | `这一 Phase 交出什么？` | `skills/testing-system-blueprint/SKILL.md`；`workflows/build-plan/SKILL.md`；`tests/fixtures/execution-quality/prepare-test-data.mjs`；`tests/contract/temp-dir.test.mjs`；`docs/architecture/move-map.json` | P3 | P5 的开工检查入口 |
| `P5` | `phases/P5-readiness.md` | `这一 Phase 交出什么？` | `runtime/stage/stage-content-contracts.mjs`；`tools/cli/run-checks.mjs`；`tools/cli/stage-runtime.mjs`；`workflows/build-code/SKILL.md`；`workflows/build-plan/SKILL.md`；`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`docs/architecture/move-map.json`；`tests/contract/build-code-readiness.test.mjs`；`tests/contract/stage-runtime-reflect-entry.test.mjs` | P4 | build-code 派发主会话、P6 修复分诊与末段验收者 |
| `P6` | `phases/P6-repair-cycle.md` | `这一 Phase 交出什么？` | `workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`skills/spec-plan/templates/phase-template.md` | P5 | P7 至 P9 的实施主会话与独立验收者、末段对账读者 |
| `P7` | `phases/P7-progress-page.md` | `这一 Phase 交出什么？` | `skills/answer-as-page/scripts/build-page-data.mjs`；`skills/answer-as-page/scripts/check-page-content.mjs`；`skills/answer-as-page/scripts/render-answer-page.mjs`；`tests/contract/cockpit-autogen.test.mjs`；`tests/contract/cockpit-event.test.mjs` | P2、P6 | 驾驶舱用户、P9 交付对账与末段验收者 |
| `P8` | `phases/P8-archive-graph.md` | `这一 Phase 交出什么？` | `tools/cli/check-specs-archive.mjs`；`core/task-close.mjs`；`tools/cli/task-close.mjs`；`runtime/stage/current-close-projection.mjs`；`skills/stage-close/SKILL.md`；`skills/stage-handoff/SKILL.md`；`skills/knowledge-graph/SKILL.md`；`workflows/build-code/SKILL.md`；`docs/architecture/move-map.json`；`tests/integration/vnext-delivery-close.test.mjs`；`tests/contract/current-close-projection-readback.test.mjs`；`tests/contract/knowledge-graph-stage-wiring.test.mjs` | P2, P4, P6 | P9 与 stage-close |
| `P9` | `phases/P9-evidence-signoff.md` | `这一 Phase 交出什么？` | `tools/cli/check-replay.mjs`；`tools/cli/check-delivery-claims.mjs`；`runtime/task/delivery-claims.mjs`；`core/task-close.mjs`；`tools/cli/stage-runtime.mjs`；`skills/stage-close/SKILL.md`；`workflows/build-code/SKILL.md`；`docs/architecture/move-map.json`；`tests/contract/final-chain-negatives.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs` | P6, P7, P8 | P10 与 stage-close |
| `P10` | `phases/P10-log-terminal.md` | `这一 Phase 交出什么？` | `skills/decision-log/SKILL.md`；`skills/material-writing/SKILL.md`；`skills/spec-analyze/SKILL.md`；`skills/spec-plan/scripts/build-decision-baseline.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`tools/cli/check-decision-log-chain.mjs`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`tests/contract/spec-analyze-classes.test.mjs`；`tests/contract/decision-evidence-consumption.test.mjs`；`tests/contract/review-decision-baseline.test.mjs`；`tests/contract/review-materials-contract.test.mjs` | P1, P2, P3, P4, P5, P6, P7, P8, P9 | 独立终末验收者、用户与下一任务 |

## 编号与落点

AC 编号沿功能需求编，落点按 Phase 排，两者有意错位：AC-P8 在阶段 4、AC-P4 在阶段 5、AC-P5 在阶段 6、AC-P6 在阶段 7、AC-P9 在阶段 8、AC-P7 在阶段 9。
本版不重编号；某条 AC 属于哪个阶段只看 `spec.md` 附录 A 的「落点」行与附录 B 的阶段列，不看编号里的数字。

## 共享写集的串行次序

同一路径跨多个 Phase 时按下列次序串行，后写者先读前写者交回的真实状态；次序与各 Phase 的 `Dependency` 边一致。

| 共享路径 | 串行次序 |
| --- | --- |
| `workflows/make-decision/SKILL.md` | P1 → P3 → P10 |
| `workflows/build-plan/SKILL.md` | P1 → P2 → P4 → P5 → P10 |
| `workflows/build-code/SKILL.md` | P1 → P5 → P6 → P8 → P9 |
| `tools/cli/check-stage-steps.mjs` | P1 → P2 |
| `tests/contract/check-stage-steps.test.mjs` | P1 → P2 |
| `tests/contract/decision-evidence-consumption.test.mjs` | P2 → P3 → P10 |
| `skills/stage-handoff/SKILL.md` | P2 → P8 |
| `skills/decision-log/SKILL.md` | P3 → P10 |
| `docs/architecture/move-map.json` | P4 → P5 → P8 → P9 |
| `skills/spec-plan/templates/phase-template.md` | P5 → P6 |
| `core/task-close.mjs` | P8 → P9 |
| `skills/stage-close/SKILL.md` | P8 → P9 |
| `tests/integration/vnext-delivery-close.test.mjs` | P8 → P9 |
| `tools/cli/stage-runtime.mjs` | P5 → P9 |

## 并行与合并导航（人读指针）

按 [规格中的依赖](../spec.md#谁先谁后) 和下列承接页执行。
准备独立夹具可以按各阶段的首判输入提前进行；阶段生产写入沿规格串行。

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末 AC 指针 |
| --- | --- | --- | --- | --- |
| [P1](P1-skill-loading.md) | [开工输入](P1-skill-loading.md#开始前读什么) | [本阶段写主](P1-skill-loading.md#每个文件由谁改先做什么) | [P2 下一段](P2-evidence-handoff.md) | [本阶段首判](P1-skill-loading.md#这一-phase-怎么验收) |
| [P2](P2-evidence-handoff.md) | [当前依赖](P2-evidence-handoff.md#开始前读什么) | [本阶段写主](P2-evidence-handoff.md#每个文件由谁改先做什么) | [P3 下一段](P3-package-decisions.md) | [本阶段首判](P2-evidence-handoff.md#这一-phase-怎么验收) |
| [P3](P3-package-decisions.md) | [当前依赖](P3-package-decisions.md#开始前读什么) | [本阶段写主](P3-package-decisions.md#每个文件由谁改先做什么) | [P4 下一段](P4-test-data.md) | [本阶段首判](P3-package-decisions.md#这一-phase-怎么验收) |
| [P4](P4-test-data.md) | [当前依赖](P4-test-data.md#开始前读什么) | [本阶段写主](P4-test-data.md#每个文件由谁改先做什么) | [P5 下一段](P5-readiness.md) | [本阶段首判](P4-test-data.md#这一-phase-怎么验收) |
| [P5](P5-readiness.md) | [当前依赖](P5-readiness.md#开始前读什么) | [本阶段写主](P5-readiness.md#每个文件由谁改先做什么) | [P6 下一段](P6-repair-cycle.md) | [本阶段首判](P5-readiness.md#这一-phase-怎么验收) |
| [P6](P6-repair-cycle.md) | [当前依赖](P6-repair-cycle.md#开始前读什么) | [本阶段写主](P6-repair-cycle.md#每个文件由谁改先做什么) | [P7 下一段](P7-progress-page.md) | [本阶段首判](P6-repair-cycle.md#这一-phase-怎么验收) |
| [P7](P7-progress-page.md) | [当前依赖](P7-progress-page.md#开始前读什么) | [本阶段写主](P7-progress-page.md#每个文件由谁改先做什么) | [P8 下一段](P8-archive-graph.md) | [本阶段首判](P7-progress-page.md#这一-phase-怎么验收) |
| [P8](P8-archive-graph.md) | [当前依赖](P8-archive-graph.md#开始前读什么) | [本阶段写主](P8-archive-graph.md#每个文件由谁改先做什么) | [P9 下一段](P9-evidence-signoff.md) | [本阶段首判](P8-archive-graph.md#这一-phase-怎么验收) |
| [P9](P9-evidence-signoff.md) | [当前依赖](P9-evidence-signoff.md#开始前读什么) | [本阶段写主](P9-evidence-signoff.md#每个文件由谁改先做什么) | [P10 下一段](P10-log-terminal.md) | [本阶段首判](P9-evidence-signoff.md#这一-phase-怎么验收) |
| [P10](P10-log-terminal.md) | [当前依赖](P10-log-terminal.md#开始前读什么) | [本阶段写主](P10-log-terminal.md#每个文件由谁改先做什么) | [终末验收](P10-log-terminal.md#验收-phase-才能做的检查) | [本阶段首判](P10-log-terminal.md#这一-phase-怎么验收) |
