# Phase 索引 — UI 前端能力接入四个阶段

> 指向各 Phase 独立权威的纯指针，由各 Phase 文件末尾机器字段重新生成。
> 本文件没有实现或完成权威；命令、判定、证据与任务正文都留在所指 Phase。
> 指针缺失或与 Phase 不一致时，以 Phase 文件为准，交该 Phase 作者修正后再重生成本文件。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-能力清单.md` | `这一 Phase 交出什么？` | `docs/ui-frontend-capabilities.md`；`tests/contract/ui-frontend-capabilities.test.mjs`；`docs/architecture/move-map.json` | `none` | 第 2–9 段作者、第 8 段开发（读 move-map 登记行）、第 9 段对账 |
| `P2` | `phases/P2-方案卡收敛.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`skills/decision-log/templates/decision-log-template.md`；`tests/contract/module-convergence-card.test.mjs` | `P1` | 定方向执行者、第 3 段开发（读三件共享文件当前原件）、第 9 段演练 |
| `P3` | `phases/P3-定方向UI支路.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`skills/decision-log/templates/decision-log-template.md`；`workflows/make-decision/skill-deps.yaml`；`skills/design-source-readiness/SKILL.md`；`skills/frontend-prototype-render/SKILL.md`；`tests/contract/ui-stage-make-decision.test.mjs` | `P2` | 第 4–7 段作者、第 9 段演练 |
| `P4` | `phases/P4-写需求UI任务链.md` | `这一 Phase 交出什么？` | `workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；`workflows/build-prd/skill-deps.yaml`；`skills/spec-prd/templates/prd-template.md`；`tests/contract/ui-stage-build-prd.test.mjs` | `P3` | 第 5 段作者、第 9 段演练 |
| `P5` | `phases/P5-排阶段UI验收.md` | `这一 Phase 交出什么？` | `workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`workflows/build-plan/skill-deps.yaml`；`skills/spec-plan/templates/phase-template.md`；`tests/contract/ui-stage-build-plan.test.mjs` | `P4` | 第 6 段开发、第 7 段开发、第 9 段演练 |
| `P6` | `phases/P6-前端质量判据.md` | `这一 Phase 交出什么？` | `workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/skill-deps.yaml`、`skills/frontend-testing/references/page-audit.md`、`tests/contract/ui-stage-build-code.test.mjs` | `P5` | 写代码阶段执行者；P7 开发者；P9 演练者 |
| `P7` | `phases/P7-审查UI六问.md` | `这一 Phase 交出什么？` | `skills/wh-review/SKILL.md`、`skills/plan-design-review/SKILL.md`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/stage-skill-plan.json`、`tests/contract/ui-stage-review.test.mjs` | `P3、P6` | 各阶段独立审查者；P9 演练者 |
| `P8` | `phases/P8-C11修复入库.md` | `这一 Phase 交出什么？` | `docs/examples/c11-ui/v15/2026-11-11-001-t019-v15-pending-busy-app.js`、`docs/examples/c11-ui/v15/2026-11-11-002-t019-v15-pending-busy-index.html`、`docs/examples/c11-ui/v15/2026-11-11-003-t019-v15-pending-busy-readme.md`、`docs/examples/c11-ui/v15/2026-11-12-001-c11-query-writer.mjs`、`docs/examples/c11-ui/v15/2026-11-12-002-c11-query-data.js`、`docs/examples/c11-ui/carrier/app/ui/primitives.tsx`、`docs/examples/c11-ui/carrier/app/ui/primitives.css`、`docs/examples/c11-ui/carrier/app/ui/tokens-base.css`、`docs/examples/c11-ui/carrier/app/ui/ui-contract.ts`、`docs/examples/c11-ui/v11/2026-11-10-001-t019-wf-native-next-v11-styles.css`、`docs/examples/c11-ui/v12/2026-11-11-009-t019-v12-local-demo-styles.css`、`docs/examples/c11-ui/SOURCE.md`、`docs/examples/c11-ui/delivery.sha256` | `P1` | 维护者；P9 演练者与对账者 |
| `P9` | `phases/P9-真实演练与对账.md` | `这一 Phase 交出什么？` | `docs/ui-frontend-capabilities.md` | `P1、P2、P3、P4、P5、P6、P7、P8` | 用户；最终验收者 |

pre cohort 的旧任务卡只读保留，在本文件中没有有效行。

## 并行与合并导航（人读指针）

本节标题沿用索引模板原词，不改成读者问题。
第 1 段先做，没有前置。
第 2 段依赖第 1 段；第 3 段依赖第 2 段；第 4 段依赖第 3 段。
第 5 段依赖第 4 段；第 6 段依赖第 5 段。
第 7 段依赖第 6 段，并读第 3 段结果。
第 8 段只依赖第 1 段，与第 2、3、4、5、6、7 段并行。
第 9 段依赖第 1、2、3、4、5、6、7、8 段，最后做。
分组依据是 spec「谁先谁后？」与各 Phase「每个文件由谁改，先做什么？」，本节只做导航。

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末验收指针 |
| --- | --- | --- | --- | --- |
| 组一：P1 | 无前置 | `docs/ui-frontend-capabilities.md` 先写主 P1，后写 P9 只改状态列；`docs/architecture/move-map.json` 只有 P1 写，P8 只读登记行 | P1 交回后开组二与组三 | spec Appendix A 验收 7；P1「这一 Phase 怎么验收？」 |
| 组二：P2 | 依赖 P1 | 定方向三件 `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`skills/decision-log/templates/decision-log-template.md`：P2 先写 | P2 交回后开 P3 | 验收 9、验收 10；P2「这一 Phase 怎么验收？」 |
| 组二：P3 | 依赖 P2 | 同上三件：P3 后写，只在 P2 字节之后追加 | P3 交回后开 P4 | 验收 1；P3「这一 Phase 怎么验收？」 |
| 组二：P4 | 依赖 P3，读 P3 交回的字段名 | 无；写入集 P4 独占 | P4 交回后开 P5 | 验收 2；P4「这一 Phase 怎么验收？」 |
| 组二：P5 | 依赖 P4，读 P4 交回的字段名 | 无；写入集 P5 独占 | P5 交回后开 P6 | 验收 3；P5「这一 Phase 怎么验收？」 |
| 组二：P6 | 依赖 P5，读 P5 交回的六项字段名 | 无；写入集 P6 独占 | P6 交回后开 P7 | 验收 4；P6「这一 Phase 怎么验收？」 |
| 组二：P7 | 依赖 P6，并读 P3 结果 | 无；写入集 P7 独占 | P7 交回，组二结束 | 验收 5；P7「这一 Phase 怎么验收？」 |
| 组三：P8 | 只依赖 P1 的 move-map 登记行；与组二无共享写入集，可并行 | 无；`docs/examples/c11-ui/` 下十三件 P8 独占 | P8 交回 | 验收 6；P8「这一 Phase 怎么验收？」 |
| 组四：P9 | 依赖 P1、P2、P3、P4、P5、P6、P7、P8 | 见组一的能力清单先后；演练原件在任务库证据区，不进写入集 | 终点 | 承接验收 8、11、12，以及验收 2 的单页有稿规划读回（任务 5，编号 T017）；末验验收 1、2、3、4、5、6、7、8、9、10、11、12；P9「这一 Phase 怎么验收？」 |

并行组出现重叠路径时，回 spec 与原 Phase 作者改成有实际依赖的串行，再更新本导航。
