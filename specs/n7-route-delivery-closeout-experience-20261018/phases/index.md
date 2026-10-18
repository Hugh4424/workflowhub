# Phase 索引 — n7-route-delivery-closeout-experience-20261018

只导航实际Phase；正文、执行步骤、证据与结论归各Phase和现有task facts。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-阶段收口成为末步.md` | `L0 — 结果与变更` | `skills/stage-reflection/SKILL.md`；`skills/stage-handoff/SKILL.md`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`workflows/build-code/SKILL.md`；`workflows/build-code/steps.json`；`workflows/verify-code/SKILL.md`；`workflows/verify-code/steps.json`；`workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；`skills/catalog.yaml`；`tests/integration/main-agent-cost-closeout.node-test.mjs`；`tests/contract/build-prd-review-contract.test.mjs` | none | 五阶段执行主会话、下游续接会话、P2经验文件作者、P4交付说明作者与verify-code复核者 |
| `P2` | `phases/P2-业务仓经验文件落地.md` | `L0 — 结果与变更` | `specs/Improvements.md`；`Improvements.md`；`docs/architecture/move-map.json`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/Improvements.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/AGENTS.md` | P1 | 本仓与论文仓维护者、后继任务读者、P3登记作者与verify-code复核者 |
| `P3` | `phases/P3-五件各归一处.md` | `L0 — 结果与变更` | `docs/delivery-closeout-charter.md`；`docs/standard-workflow.md`；`AGENTS.md`；`CLAUDE.md`；`GLOSSARY.md`；`skills/grill-with-docs/SKILL.md`；`skills/grill-with-docs/GLOSSARY-FORMAT.md`；`docs/architecture/move-map.json` | P2 | 阶段执行者、外部接手者、常驻治理读者、领域词表写入者与verify-code复核者 |
| `P4` | `phases/P4-交付说明内容合同.md` | `L0 — 结果与变更` | `skills/stage-closeout/SKILL.md`；`workflows/build-code/SKILL.md` | P1 | 执行关闭的阶段主会话、PR审阅者、实施阶段读者与verify-code复核者 |
| `P5` | `phases/P5-验收矩阵引用完整性.md` | `L0 — 结果与变更` | `tests/acceptance/card-03-current.mjs`；`tests/acceptance/card-03-current.test.mjs` | P1 | 验收矩阵读者、驱动测试、原oracle维护者与verify-code复核者 |
| `P6` | `phases/P6-全AC验收.md` | `L0 — 结果与变更` | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-acceptance-green.output`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-ac-per-ac.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-six-adoptions.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-reverify.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-p6-data-readiness.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-p6-env-readiness.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-triage.md` | P1、P2、P3、P4、P5 | verify-code终末复核者与用户 |

pre cohort旧材料只读，不在本索引建立有效行。
