# Phase 索引 — C09 前期准备与步骤严格执行修复

> 指向各 Phase 独立权威的纯指针。由 Phase 标题重新生成；本文件没有实现或完成权威。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-步骤检查器报出缺口.md` | `L0 — 结果与变更` | `docs/architecture/move-map.json`（仅三项新文件职责）、`tools/cli/run-checks.mjs`、`tools/cli/check-stage-steps.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`tests/contract/check-stage-steps.test.mjs`、`tests/contract/run-checks-zero-attestation.test.mjs`、`tests/contract/n11-discussion-quality.test.mjs`、`quality/tests/P1-zero-attestation.output`、`quality/tests/P1-checker-report.output`、`quality/tests/P1-discipline-readback.output` | `none` | 五阶段主会话与阶段核对读者 |
| `P2` | `phases/P2-旧基线可独立复现.md` | `L0 — 结果与变更` | `quality/evidence/P2-old-baseline.md`、`quality/tests/2026-10-26-046-p2-baseline-install.output`、`quality/tests/2026-10-26-046-p2-baseline-install.json`、`quality/tests/2026-10-26-052-p2-baseline-bootstrap.output`、`quality/tests/2026-10-26-052-p2-baseline-bootstrap.json`、`quality/tests/2026-10-26-060-p2-baseline-doctor-created-task.output`、`quality/tests/2026-10-26-060-p2-baseline-doctor-created-task.json`、`quality/tests/2026-10-26-062-p2-baseline-draft.output`、`quality/tests/2026-10-26-062-p2-baseline-draft.json` | `none` | C09 后续基线运行与 C10 交接读者 |
| `P3` | `phases/P3-两页目标仓可运行.md` | `L0 — 结果与变更` | `quality/evidence/P3-target-repo.md`、`quality/tests/P3-target-repo-start.output` | `none` | P4 样本负责人与后续有稿对比执行者 |
| `P4` | `phases/P4-两页口径与已知差异.md` | `L0 — 结果与变更` | `quality/evidence/P4-design-source-collection-plan.json`、`quality/evidence/P4-six-dimensions.md`、`quality/evidence/P4-design-source-fingerprint.md` | `P3` | P6 指标分母与 P8 输入冻结 |
| `P5` | `phases/P5-无稿闭环改回.md` | `L0 — 结果与变更` | `quality/evidence/2026-10-26-099-p5-nodraft-loop.md`、`quality/tests/2026-10-26-044-p5-readonly-gates.json`、`quality/tests/2026-10-26-044-p5-readonly-gates.output`、`quality/tests/2026-10-26-051-p5-qualification-readback.json`、`quality/tests/2026-10-26-051-p5-qualification-readback.output`、`docs/adr/0054-c09-no-draft-loop-uses-running-real-service.md` | `none` | P6 指标走查与后续 C09 业务 E2E |
| `P6` | `phases/P6-六指标口径与走查.md` | `L0 — 结果与变更` | `quality/evidence/P6-six-metrics.md`、`quality/evidence/P6-metric-walkthrough.md` | `P4`、`P5` | P7 外部内容落位与后续 C09 报告 |
| `P7` | `phases/P7-外部内容逐项落位.md` | `L0 — 结果与变更` | `quality/evidence/P7-external-content.md` | `P2`、`P3`、`P4`、`P5`、`P6` | 执行阶段读者与 P10 完备性判定 |
| `P8` | `phases/P8-输入冻结与运行协议.md` | `L0 — 结果与变更` | `quality/evidence/P8-input-freeze.md`、`quality/evidence/P8-run-protocol.md` | `P3`、`P4`、`P5`、`P6` | 后续真实对比执行者 |
| `P9` | `phases/P9-两链证据与判定计划.md` | `L0 — 结果与变更` | `quality/evidence/P9-e2e-evidence-plan.md` | `P4`、`P5`、`P6` | 后续 C09 执行与独立判定人 |
| `P10` | `phases/P10-完备性判定与交接.md` | `L0 — 结果与变更` | `quality/evidence/P10-readiness.md`、`quality/evidence/P10-handoff.md` | `P1`、`P2`、`P3`、`P4`、`P5`、`P6`、`P7`、`P8`、`P9` | 用户与 C10 交接读者 |
| `P11` | `phases/P11-全AC终末验收.md` | `L0 — 结果与变更` | `quality/evidence/P11-final-acceptance.md`、`quality/evidence/P11-data-readiness.md`、`quality/evidence/P11-env-readiness.md` | `P1`、`P2`、`P3`、`P4`、`P5`、`P6`、`P7`、`P8`、`P9`、`P10` | verify-code 终末复核与用户 |

末行指向唯一全 AC 验收 Phase：`P11`。pre cohort 的旧任务卡只读保留，在本文件中没有有效行。
