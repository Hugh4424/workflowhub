# Phase 索引 — WorkflowHub 设计／执行效率改造

本件只导航实际 Phase；正文与验收归各自 owner。本件是从各 Phase 契约头再生的纯指针，不承载命令、oracle、证据路径、任务程序或执行状态。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-入口代价进确认边界.md` | `L0 — 结果与变更` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`skills/decision-log/SKILL.md`；`skills/decision-log/templates/decision-log-template.md` | `none` | P6 实施者与 make-decision 后续任务主会话及第 8／13 步的人类读者 |
| `P2` | `phases/P2-分解依据改由交付单元决定.md` | `L0 — 结果与变更` | `skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-plan/SKILL.md`；`skills/wh-review/contracts/build-plan.md`；`skills/plan-eng-review/SKILL.md`；`workflows/make-decision/SKILL.md` | `P1` | wh-review 合并审查者与 plan-eng-review lens 及后续 build-plan 作者 |
| `P3` | `phases/P3-每Phase自带判据与提交.md` | `L0 — 结果与变更` | `workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`docs/standard-workflow.md` | none | build-code 与 verify-code 的执行者及每 Phase 独立审查者 |
| `P4` | `phases/P4-外部失败停机与升级.md` | `L0 — 结果与变更` | `AGENTS.md`；`docs/standard-workflow.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md` | P3 | 五个阶段的执行者与 verify-code 终末复核者 |
| `P5` | `phases/P5-同一事实不重复存件.md` | `L0 — 结果与变更` | `AGENTS.md`；`docs/standard-workflow.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`tools/cli/stage-runtime.mjs`；`runtime/review/review-record-route.mjs` | P4 | 证据生产者与 review 记录生产者及任务库读者 |
| `P6` | `phases/P6-决策与实现分界.md` | `L0 — 结果与变更` | `workflows/make-decision/SKILL.md`；`skills/decision-log/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-specify/templates/spec-template.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`docs/architecture/test-asset-governance-rules.md` | P2、P5 | spec 与 Phase 卡作者及 TCR 审查者 |
| `P7` | `phases/P7-审查结论可核.md` | `L0 — 结果与变更` | `skills/wh-review/SKILL.md`；`skills/wh-review/contracts/build-code.md`；`skills/wh-review/contracts/verify-code.md`；`docs/standard-workflow.md`；`skills/spec-plan/templates/phase-template.md`；`runtime/review/review-record-route.mjs` | `P6` | 每 Phase 审查的执行者与 verify-code 终末复核者 |
| `P8` | `phases/P8-终末逐AC验收.md` | `L0 — 结果与变更` | `specs/design-execution-efficiency-20261014/spec.md`；`specs/design-execution-efficiency-20261014/phases/index.md`；`specs/design-execution-efficiency-20261014/phases/P1-入口代价进确认边界.md`；`specs/design-execution-efficiency-20261014/phases/P2-分解依据改由交付单元决定.md`；`specs/design-execution-efficiency-20261014/phases/P3-每Phase自带判据与提交.md`；`specs/design-execution-efficiency-20261014/phases/P4-外部失败停机与升级.md`；`specs/design-execution-efficiency-20261014/phases/P5-同一事实不重复存件.md`；`specs/design-execution-efficiency-20261014/phases/P6-决策与实现分界.md`；`specs/design-execution-efficiency-20261014/phases/P7-审查结论可核.md` | P1、P2、P3、P4、P5、P6、P7 | verify-code 承接与整任务验收读者 |
