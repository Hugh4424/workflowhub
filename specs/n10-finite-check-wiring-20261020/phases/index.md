# Phase 索引 — 让完整有限检查真正接线生效

本件只导航实际 Phase 的权威引用与契约头字段，正文、命令与验收归各 Phase。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-检查内核与报告语义.md` | `L0 — 结果与变更` | `tools/cli/check-decision-log-chain.mjs`；`tools/cli/check-skill-consistency.mjs`；`tools/cli/run-checks.mjs`；`tests/contract/n10-check-core.test.mjs`；`tests/n2-skill-catalog-portability.test.mjs`；`core/__tests__/run-checks.test.mjs`；`tests/contract/ocr-production-cutover.test.mjs` | none | P2/P3 作者与维护者 |
| `P2` | `phases/P2-来源与目录接线.md` | `L0 — 结果与变更` | `tools/cli/check-skill-consistency.mjs`；`skills/catalog.yaml`；`THIRD_PARTY_NOTICES.md`；`skills/reuse-registry.md`；`tests/n2-skill-catalog-portability.test.mjs`；`tests/contract/n10-source-registry.test.mjs`；`docs/architecture/move-map.json` | P1 | P3/P5 作者与来源维护者 |
| `P3` | `phases/P3-材料合同与写作检查.md` | `L0 — 结果与变更` | `tools/cli/run-checks.mjs`；`tools/cli/check-skill-consistency.mjs`；`skills/spec-plan/templates/index-template.md`；`tests/n2-skill-catalog-portability.test.mjs`；`core/__tests__/run-checks.test.mjs`；`tests/contract/final-chain-runner.test.mjs`；`tests/contract/n10-material-contract.test.mjs`；`docs/architecture/move-map.json` | P1, P2 | P5/P7 作者与材料作者 |
| `P4` | `phases/P4-方法读回与变异演示.md` | `L0 — 结果与变更` | `tests/contract/n10-method-readback.test.mjs`；`tests/fixtures/n10-method-readback.json` | P1, P2, P3 | verify-code 与独立审查者 |
| `P5` | `phases/P5-有限集合与N9接口.md` | `L0 — 结果与变更` | `workflows/verify-code/SKILL.md`；`skills/stage-reflection/SKILL.md`；`tests/contract/n10-source-disposition.test.mjs`；`tests/contract/n10-n9-interface.test.mjs` | `P1, P2, P3, P4` | verify-code、后续维护者、P7/P8 |
| `P6` | `phases/P6-流程修复.md` | `L0 — 结果与变更` | `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`skills/wh-review/contracts/make-decision.md`、`specs/n10-finite-check-wiring-20261020/n8-corrections.md`、`workflows/make-decision/flows/normal/SKILL.md`、`docs/adr/0052-direction-review-before-module-convergence.md`、`tests/contract/make-decision-flows.test.mjs`、`tests/contract/n10-process-repair.test.mjs` | none | 下一张复杂任务的主会话、N8 维护者、verify-code |
| `P7` | `phases/P7-全AC验收.md` | `L0 — 结果与变更` | `tests/acceptance/n10-finite-check-acceptance.test.mjs`；`docs/research/n10-finite-check-acceptance-runbook.md` | P1, P2, P3, P4, P5, P6 | 用户、verify-code、后续维护者、P8 |
| `P8` | `phases/P8-磁盘有界性.md` | `L0 — 结果与变更` | `runtime/interface/temp-dir.mjs`；`runtime/evidence/disk-budget.mjs`；`runtime/review/review-record-route.mjs`；`tools/cli/audit-disk-usage.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`tests/contract/n10-disk-boundedness.test.mjs`；`docs/research/n10-disk-boundedness.md` | P1, P2, P3, P4, P5, P6, P7 | 用户、verify-code、后续维护者 |

P7 行指向原 36 条全 AC 验收 Phase（`phases/P7-全AC验收.md`），其「验收 Phase 固定小节」按 36 条 AC 逐条判定；P8 是追加需求 4 条 AC 的后置收口，按 4 条 AC 判定；既有红由 P1/T005 清零。
