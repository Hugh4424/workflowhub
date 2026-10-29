# Phase 索引 — C07 真实页面验证与定向回修

> 指向各 Phase 独立权威的纯指针。本文件没有实现或完成权威；命令、oracle、证据与正文留在各自 Phase。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-判据与共用契约.md` | `L0 — 结果与变更` | `skills/frontend-testing/references/page-audit.md`、`skills/frontend-testing/scripts/check-page-audit.mjs`、`skills/frontend-testing/SKILL.md`、`skills/frontend-testing/skill-bundle.json`、`skills/catalog.yaml`、`skills/plan-design-review/SKILL.md`、`tests/contract/page-audit-wiring.test.mjs` | none | Phase 2 的五个采集器、Phase 4 的报告解析。 |
| `P2` | `phases/P2-真实采集与失败语义.md` | `L0 — 结果与变更` | `skills/isolated-browser-qa/SKILL.md`、`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-tickets.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh`、`skills/isolated-browser-qa/references/agent-browser.md`、`skills/isolated-browser-qa/references/fallback.md`、`skills/isolated-browser-qa/skill-bundle.json`、`tests/contract/browser-engine-selection.test.mjs`、`skills/frontend-testing/scripts/collect-console.mjs`、`skills/frontend-testing/scripts/collect-network.mjs`、`skills/frontend-testing/scripts/collect-overflow.mjs`、`skills/frontend-testing/scripts/collect-perf.mjs`、`skills/frontend-testing/scripts/collect-a11y.mjs`、`skills/frontend-testing/skill-bundle.json`、`tests/contract/page-audit-collectors.test.mjs` | P1 | P5 与 P8 |
| `P3` | `phases/P3-受控测试页与校准负例.md` | `L0 — 结果与变更` | `tests/fixtures/page-audit/controlled-page.html`、`tests/fixtures/page-audit/defects.json`、`tests/fixtures/page-audit/calibration/font.html`、`tests/fixtures/page-audit/calibration/spacing.html`、`tests/fixtures/page-audit/calibration/color.html`、`tests/contract/page-audit-fixtures.test.mjs` | P1 | P8（末验收 Phase 的受控页注入与终验串演） |
| `P4` | `phases/P4-报告接入与回修闭环.md` | `L0 — 结果与变更` | `workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`skills/review/SKILL.md`、`tests/contract/page-audit-report-consumption.test.mjs`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/index.html`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/assets/app.js`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/assets/styles.css`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/index.html`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/app.js`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/styles.css` | P1 | P5、P8（P5 读接线措辞，P8 按终末四项复核取证） |
| `P5` | `phases/P5-审计编排入口与规范消费证明.md` | `L0 — 结果与变更` | `skills/frontend-testing/scripts/run-page-audit.mjs`、`skills/frontend-testing/scripts/check-norm-consumption.mjs`、`tests/contract/page-audit-runner.test.mjs`、`tests/contract/page-audit-consumption.test.mjs`、`tests/fixtures/page-audit/runner/judgments.json`、`skills/frontend-testing/skill-bundle.json`、`docs/architecture/move-map.json` | P1、P2、P4 | P7 与 P8。 |
| `P6` | `phases/P6-make-decision流程九条修复.md` | `L0 — 结果与变更` | `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`skills/decision-log/templates/decision-log-template.md`、`docs/standard-workflow.md`、`tests/contract/make-decision-flow.test.mjs` | none | tools/cli/check-stage-steps.mjs |
| `P7` | `phases/P7-交付证据与防假绿实现.md` | `L0 — 结果与变更` | `skills/frontend-testing/scripts/check-report-quotes.mjs`、`skills/frontend-testing/scripts/check-version-binding.mjs`、`tests/contract/page-audit-m10.test.mjs`、`tests/fixtures/page-audit/m10/quote-cases.json`、`tests/fixtures/page-audit/m10/materials-cases.json`、`skills/frontend-testing/skill-bundle.json`、`docs/architecture/move-map.json` | P1、P2、P4、P5 | P8。 |
| `P8` | `phases/P8-全AC终验.md` | `L0 — 结果与变更` | `tests/contract/page-audit-acceptance.test.mjs` | P1、P2、P3、P4、P5、P6、P7 | skills/stage-close/SKILL.md |
| `P9` | `phases/P9-材料为读者写.md` | `L0 — 结果与变更` | `runtime/stage/stage-content-contracts.mjs`、`workflows/build-plan/SKILL.md`、`skills/spec-plan/scripts/check-reader-record.mjs`、`skills/spec-plan/scripts/check-authoring-budget.mjs`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`tests/contract/reader-record.test.mjs`、`tests/contract/authoring-shape.test.mjs`、`tests/contract/authoring-budget.test.mjs`、`tests/contract/phase-contract-prose.test.mjs`、`tests/contract/phase-prose.test.mjs`、`skills/spec-plan/references/authoring-contract.md`、`skills/spec-analyze/SKILL.md`、`tests/contract/spec-analyze-classes.test.mjs`、`tests/contract/authoring-contract.test.mjs` | P6 | 下一份 build-plan/build-code 材料的作者与阶段读者 |
| `P10` | `phases/P10-让审查判方案.md` | `L0 — 结果与变更` | `runtime/review/stage-materials.json`、`runtime/review/schemas/stage-materials.schema.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/build-plan.md`、`skills/spec-plan/scripts/build-decision-baseline.mjs`、`tests/contract/review-decision-baseline.test.mjs`、`tests/contract/review-axes-contract.test.mjs` | P9 | 下一次 build-plan 审查与独立读者 |
| `P11` | `phases/P11-去字面断言.md` | `L0 — 结果与变更` | `tests/contract/page-audit-doc-contract.test.mjs`、`tests/contract/acceptance-plan.test.mjs`、`tests/contract/n11-plan-quality.test.mjs`、`tests/contract/n11-acceptance-rules.test.mjs` | P1 | 后续所有 Phase 的门禁，以及下一份材料的作者。 |

## 并行与合并导航（人读指针）

执行顺序（2026-10-29 调整：对 workflowhub 自身的改造提前，全 AC 终验排最后）：

- 批次一（可并行）：P6 make-decision 修复（无依赖）、P1 判据与契约（无依赖）。
- 批次二：P9 材料为读者写（依赖 P6）、P2 真实采集（依赖 P1）。
- 批次三：P10 审查改造（依赖 P9）、P3 受控测试页（依赖 P1）。
- 批次四：P4 报告接入（依赖 P1、P2）、P5 编排入口（依赖 P1、P2、P4）。
- 批次五：P7 防假绿（依赖 P1、P2、P4、P5）、P11 去字面断言（依赖 P1）。
- 批次六（最后）：P8 全 AC 终验（依赖 P1 到 P7 与 P9 到 P11）。

每批做完即提交 main，先做完的批次不等待后面的批次。

共享路径与先后写主：`skills/frontend-testing/skill-bundle.json` 由 P1（判据包与校验器）→ P2（五个采集器）→ P5（编排入口）→ P7（防假绿脚本）依次追加，后者依赖前者；`docs/architecture/move-map.json` 由 P5 → P7 依次登记。冲突回原 writer，不另建第二套路径。

首判与终末：各 AC 首判归承接 Phase 的 Done；AC-C07-1～7 的终末独立首判在 P8 的 Done 与 `per_ac[]`。
