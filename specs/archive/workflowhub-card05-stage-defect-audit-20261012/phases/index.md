# Phase 索引 — WorkflowHub过程根因修复

本件是从独立Phase契约头再生的纯指针；没有任务程序、执行状态或完成权威。模板已实读并在spec-plan bundle登记。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-测试方案可执行.md` | `L0 — 结果与变更` | `workflows/build-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-plan/SKILL.md`；`skills/spec-specify/SKILL.md`；`skills/spec-specify/templates/spec-template.md`；`skills/test-routing-advisor/SKILL.md`；`workflows/verify-code/SKILL.md`；`workflows/verify-code/steps.json` | none | build-code测试子代理与verify-code证据读取者 |
| `P2` | `phases/P2-同阶段授权复用.md` | `L0 — 结果与变更` | `runtime/interface/git-authorize.mjs`；`tests/contract/narrow-tool-git-authorize.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs` | none | build-code提交执行者与P3事实边界owner |
| `P3` | `phases/P3-Phase工作可核.md` | `L0 — 结果与变更` | `workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`tools/cli/stage-runtime.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`workflows/build-code/skill-deps.yaml`；`workflows/verify-code/skill-deps.yaml`；`skills/catalog.yaml`；`workflows/build-code/steps.json`；`runtime/stage/stage-content-contracts.mjs`；`runtime/task/material-workspace.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`runtime/review/provider-material-projection.mjs` | P1、P2 | Phase审查者与P4收尾执行者及P5覆盖作者 |
| `P4` | `phases/P4-收尾链接可见.md` | `L0 — 结果与变更` | `core/task-close.mjs`；`tools/cli/task-close.mjs`；`tests/close/close-contract.test.mjs` | P3 | 用户与现close重放读取者 |
| `P5` | `phases/P5-决策可消费.md` | `L0 — 结果与变更` | `skills/decision-log/templates/decision-log-template.md`；`skills/decision-log/SKILL.md`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`tools/cli/check-decision-log-chain.mjs` | P3 | make-decision材料作者与下一build-plan及wh-review读取者 |
| `P6` | `phases/P6-阶段交接可读.md` | `L0 — 结果与变更` | `skills/stage-handoff/SKILL.md`；`skills/stage-reflection/SKILL.md` | none | 当前stage主会话与下一会话的人读接手者 |
| `P7` | `phases/P7-活动检查兼容.md` | `L0 — 结果与变更` | `.markdownlint-cli2.jsonc`；`skills/plan-eng-review/SKILL.md`；`specs/workflowhub-card05-stage-defect-audit-20261012/decision-log.md` | P1、P3、P5、P6 | package.json现check链与P8独立证据读取者 |
| `P8` | `phases/P8-整任务证据核对.md` | `L0 — 结果与变更` | none（只读聚合，执行原件在外置任务根，不改材料正文） | P1、P2、P3、P4、P5、P6、P7 | verify-code独立审查者与用户 |

pre cohort 的旧任务卡只读保留，在本文件中没有有效行。

<!-- 新表头采用GFM无外侧竖线，避免现reader把重复表头误读为Phase；数据行保原可消费形状。仅此表豁免管线风格一致性。 -->
<!-- markdownlint-disable MD055 -->
阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者
--- | --- | --- | --- | --- | ---
| `P9` | `phases/P9-验收输入可执行.md` | `L0 — 结果与变更` | `skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-specify/templates/spec-template.md`；`workflows/build-plan/SKILL.md` | P8 | build-plan作者与完整材料测试读取者 |
| `P10` | `phases/P10-审查事实可定位.md` | `L0 — 结果与变更` | `workflows/verify-code/SKILL.md`；`runtime/review/ocr-delegation-adapter.mjs`；`tests/contract/card05-native-observation-target.test.mjs` | P9 | verify-code回复者与现review原件读取者 |
| `P11` | `phases/P11-关键接缝永久可验.md` | `L0 — 结果与变更` | `tests/contract/stage-evidence-contract.test.mjs`；`tests/contract/card05-author-material-consumer.test.mjs`；`docs/architecture/move-map.json` | P10 | 后续定向回归执行者与本轮独立验收者 |

<!-- markdownlint-enable MD055 -->
