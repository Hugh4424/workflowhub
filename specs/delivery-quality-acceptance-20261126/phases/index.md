# Phase 索引 — 交付质量·验收域（P1–P9）

> 指向各 Phase 独立权威的纯指针：不承载正文、判据、命令、证据或执行状态。
> 每段恰一行；引用与字段取自各卡契约头及「同文件后写者与不冲突锚」表。
> 写入集列只列同仓相对路径，是本任务唯一写集权威；任务根证据与命令留在所指 Phase 的机器字段。
> 本任务无并行组，按 P1→P8 串行。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-四技能角色改造.md` | `这一 Phase 交出什么？` | `skills/decision-maker/SKILL.md`；`skills/decision-maker/scripts/dispatch.mjs`；`skills/phase-maker/SKILL.md`；`skills/task-maker/SKILL.md`；`skills/run-phase/SKILL.md`；`skills/decision-maker/templates/package-context.md` | none | P2 作者、独立审查者、四问读者 |
| `P2` | `phases/P2-入口禁令与一次审查.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-prd/SKILL.md`；`skills/decision-maker/SKILL.md`；`skills/phase-maker/SKILL.md`；`skills/task-maker/SKILL.md`；`skills/run-phase/SKILL.md`；`skills/stage-reflection/SKILL.md`；`workflows/make-decision/flows/small/SKILL.md` | `P1` | P3、P4 作者；P6／P7／P8 同文件后写者与终末重跑者；独立审查者、独立测试者 |
| `P3` | `phases/P3-拆包技能接线.md` | `这一 Phase 交出什么？` | `skills/task-breakdown/SKILL.md`；`skills/task-breakdown/references/问题陈述模板.md`；`skills/task-breakdown/references/存在性判据.md`；`skills/task-breakdown/references/根因影响验收清单.md`；`skills/task-breakdown/references/逐需求五问审查表.md`；`skills/task-breakdown/skill-bundle.json`；`tests/contract/task-breakdown-wiring.test.mjs`；`skills/catalog.yaml`；`skills/reuse-registry.md`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-prd/SKILL.md`；`workflows/make-decision/flows/small/steps.json`；`workflows/make-decision/flows/normal/steps.json`；`workflows/make-decision/flows/planning/steps.json`；`repo-skills.manifest.json`；`vitest.config.mjs`（条件项，见 P3 卡） | `P2` | P4 作者、独立审查者、AC-13 判定者 |
| `P4` | `phases/P4-计划层三问闭环.md` | `这一 Phase 交出什么？` | `skills/decision-log/templates/decision-log-template-v2.md`；`docs/standard-workflow.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-code/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/make-decision/SKILL.md`；`skills/decision-maker/SKILL.md` | `P3` | P5 作者、独立审查者、四问读者 |
| `P5` | `phases/P5-执行证据契约.md` | `这一 Phase 交出什么？` | `runtime/stage/stage-content-contracts.mjs`；`tools/cli/stage-runtime.mjs`；`tools/cli/run-checks.mjs`；`runtime/task/final-chain-runner.mjs`；`skills/run-phase/SKILL.md`；`tests/contract/evidence-path-existence.test.mjs`；`tests/contract/run-checks-evidence-summary.test.mjs`；`tests/contract/final-chain-runner.test.mjs` | `P4` | P6 作者与实现者、独立审查者、终末验收者 |
| `P6` | `phases/P6-版本对账与门覆盖.md` | `这一 Phase 交出什么？` | `runtime/stage/stage-content-contracts.mjs`；`runtime/task/delivery-claims.mjs`；`core/task-close.mjs`；`tools/cli/run-checks.mjs`；`runtime/task/final-chain-runner.mjs`；`workflows/build-code/SKILL.md`；`tests/contract/p5-ac-status-parse.test.mjs`；`tests/contract/p5-three-read-sites.test.mjs`；`tests/contract/p5-report-reconciliation.test.mjs`；`tests/contract/p5-delivery-reuse.test.mjs`；`tests/contract/p5-gate-coverage.test.mjs` | `P5` | P7 作者；P8 终末重跑者；独立审查者；四问读者 |
| `P7` | `phases/P7-问题消失验收.md` | `这一 Phase 交出什么？` | `skills/spec-specify/SKILL.md`；`skills/run-phase/SKILL.md`；`workflows/build-code/SKILL.md`；`skills/spec-plan/templates/phase-template.md` | `P6` | P8 作者、独立审查角色 |
| `P8` | `phases/P8-前置任务与全AC收口.md` | `这一 Phase 交出什么？` | `skills/stage-close/SKILL.md`；`workflows/build-code/SKILL.md` | `P7` | 整任务验收者、独立审查角色 |
| `P9` | `phases/P9-包级覆盖补齐与根治.md` | `这一 Phase 交出什么？` | `skills/phase-maker/SKILL.md`；`workflows/build-plan/SKILL.md`；`skills/wh-review/SKILL.md`；`specs/delivery-quality-acceptance-20261126/spec.md`；`phases/P1-四技能角色改造.md`；`phases/P2-入口禁令与一次审查.md`；`phases/P3-拆包技能接线.md`；`phases/P8-前置任务与全AC收口.md`；`quality/evidence/build-plan/package-coverage-ledger.md` | `P8` | P8 作者、独立审查者 |

## 并行与合并导航（人读指针）

**无并行组，按 P1→P8 串行。** 四份 `workflows/*/SKILL.md`、`skills/run-phase/SKILL.md` 与 `stage-content-contracts.mjs` 等被多段共用，后一段读的正是前一段落下的字节，因此不存在输入独立、写集互斥、验收独立可并行的组；同一文件同一时刻只有一个写主。

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末 AC 指针 |
| --- | --- | --- | --- | --- |
| 串行链：P1→P2→P3→P4→P5→P6→P7→P8→P9 | 无并行组；P1 为起点，每段等前一段交回后开工 | 共享路径与逐行写区见 [spec §5](../spec.md#5-全局写集逐路径三态) 及各卡「同文件后写者与不冲突锚」；后写者按表序接手，行区间不重叠 | 每段交回即进下一段；P8 是唯一末验收 | 各卡「覆盖 AC」与机器字段；P8「验收 Phase 才能做的检查」与 17 条 AC 结论表 |
