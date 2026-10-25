# Phase 索引 — 设计源提炼与实现交接

> 指向各 Phase 独立权威的纯指针。由 Phase 标题重新生成；本文件没有实现或完成权威。

本类 P0 是 `Execution Index` 的有效 Phase 指针及其实际契约头导航字段；不承载正文，不复制判据。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | `L0 — 结果与变更` | `skills/design-source-extraction/SKILL.md`、`skills/design-source-extraction/skill-bundle.json`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`tests/contract/design-source-extraction-contract.test.mjs` | `none` | build-plan 设计源准备读者与 build-code 实施读者 |
| `P2` | `phases/P2.md` | `L0 — 结果与变更` | `skills/isolated-browser-qa/SKILL.md`、`skills/isolated-browser-qa/references/agent-browser.md`、`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-doctor.sh`、`skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh`、`skills/isolated-browser-qa/scripts/browser-qa-context.sh`、`tests/contract/browser-engine-selection.test.mjs` | `P1` | 本任务 P3 采集器与后续真实页面验证任务 |
| `P3` | `phases/P3.md` | `L0 — 结果与变更` | `skills/design-source-extraction/scripts/collect-design-source.mjs`、`tests/contract/design-source-extraction-collect.test.mjs` | `P2` | P4 规范对齐读者与 P5 对照消费者 |
| `P4` | `phases/P4.md` | `L0 — 结果与变更` | `skills/design-source-extraction/references/norm-alignment.md`、`tests/contract/design-source-extraction-norm.test.mjs` | `P3` | P5 对照与消费读者、P6 接线读者 |
| `P5` | `phases/P5.md` | `L0 — 结果与变更` | `skills/design-source-extraction/references/isolated-consumption.md`、`tests/contract/design-source-extraction-consumption.test.mjs` | `P4` | P6 接线读者与 P7 验收者 |
| `P6` | `phases/P6.md` | `L0 — 结果与变更` | `workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`docs/architecture/move-map.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`tests/contract/design-source-extraction-wiring.test.mjs` | `P5` | build-plan/build-code/verify-code 三处读者与后续任务维护者 |
| `P7` | `phases/P7.md` | `L0 — 结果与变更` | `tests/e2e/design-source-extraction-acceptance.test.mjs` | `P6` | verify-code 终末复核者与用户 |

pre cohort 的旧任务卡只读保留，在本文件中没有有效行。
