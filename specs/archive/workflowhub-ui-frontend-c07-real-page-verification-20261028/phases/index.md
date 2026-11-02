# 阶段索引 — C07 真实页面验证与定向回修

这份索引说明十二个阶段各交什么、谁接手，以及共享文件的先后写主。
做法和判据分别留在阶段正文与规格的唯一验收附录。
索引只提供导航，不证明某阶段已经执行或通过。

## 这份计划分几步？

本任务分十二个阶段，物理文件与编号在文末唯一索引表逐行对应。
正文的“阶段 1”到“阶段 12”对应表内同号阶段。
页面能力与流程修复由阶段1到阶段7交付。
材料和方法由阶段9到阶段12交付。
阶段8最后汇合真实页面验收与上游最终材料。

## 按什么顺序做？

执行顺序由真实依赖决定，编号只供检索。
主链是阶段1、6、2、3、4、5、7、9、10、11、12，最后阶段8。
其中有独立输入的阶段可以提前或并行，不必等整条主链逐项走完。

- 阶段1与阶段6没有上游，可同时开工。
- 阶段2、3只接阶段1，可同时开工。
- 阶段4接阶段3；
  阶段5接阶段2、4；
  阶段7接阶段5。
- 阶段9接阶段4、6、7；
  阶段10接阶段9；
  阶段11接阶段1，可在空档完成。
- 阶段12接阶段4、6、9、10、11交回的方法。
- 阶段8消费阶段1到阶段7的产物，以及阶段9到阶段12的最终材料。

阶段12会改阶段8要复核的构建方法，因此必须先交回最终字节。
不能先判阶段8，再把它已核对的文件换成另一版。
机器依赖列只填编号更小的阶段，跨编号的交接由这里的实际顺序说明。
表仍按原编号排列；
本轮不改阶段顺序、依赖值或写集。

## 共享文件谁先写？

同一物理文件由前一位写主交回后，下一位才开始写。
不同字段也不能并行写同一文件。

- 前端测试技能清单由阶段1先写，阶段2、5、7依次追加。
- 目录映射由阶段4先登记，阶段5、7后补。
- 决策日志模板由阶段6先写，阶段9、12按依赖接续。
- 阶段12的方法材料等原写主交回后再改，受影响测试仍沿原声明。
- 阶段8在浏览器网关补的两处，等阶段2交回后再动。
- 阶段6独占的步骤检查器与材料校验器，不交阶段12改写。

发生路径冲突时回最近的写主核实际版本，不另造第二份权威文件。
具体路径、消费者与原写集保留在文末机器表。

## 每步交给谁？

页面能力依次交给采集、报告、编排、证据检查和最终页面验收。
方法材料交给下一位材料作者、审查者和实际执行者。

- 阶段1的判据供阶段2采集与阶段4报告解析使用。
- 阶段2的真实采集供阶段5编排与阶段8验收使用。
- 阶段3的受控缺陷页供阶段8注入、检出与复验。
- 阶段4的报告接线供阶段5读取，阶段8核对审计、修复、回归和独立复验。
- 阶段5的编排交给阶段7、8；
  阶段7的两条检测脚本交给阶段8。
- 阶段6的流程规则交给阶段步骤检查器。
- 阶段9的写法交给后续材料作者和实际读者。
- 阶段10的审查改造交给下一次规划审查与独立读者。
- 阶段11的测试迁移交给后续检查及下一份材料作者。
- 阶段12的逐需验收交给原规划负责人、独立测试者与最终读者。

页面验收由阶段8首判，方法验收按规格约定分别由阶段11、12、10首判。
阶段12只首判方法验收8、10；
验收9归阶段11，验收11归阶段10。
各自结果只覆盖其原件中的对象、时点与范围，不互相代签。
阶段8交回七项页面结论后，父会话仍须核完整任务与新稿独立读回。
本索引不宣布整个阶段已经关闭。

## Execution Index

> 校验器用，人可跳过：本表只放指针与字段，正文在各自 Phase 文件。
> 本表按编号 P1 到 P12 排，只作检索；排期看「按什么顺序做？」。

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-判据与共用契约.md` | `这一 Phase 交出什么？` | `skills/frontend-testing/references/page-audit.md`、`skills/frontend-testing/scripts/check-page-audit.mjs`、`skills/frontend-testing/SKILL.md`、`skills/frontend-testing/skill-bundle.json`、`skills/catalog.yaml`、`skills/plan-design-review/SKILL.md`、`tests/contract/page-audit-wiring.test.mjs` | none | Phase 2 的五个采集器、Phase 4 的报告解析。 |
| `P2` | `phases/P2-真实采集与失败语义.md` | `这一 Phase 交出什么？` | `skills/isolated-browser-qa/SKILL.md`、`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-tickets.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh`、`skills/isolated-browser-qa/references/agent-browser.md`、`skills/isolated-browser-qa/references/fallback.md`、`skills/isolated-browser-qa/skill-bundle.json`、`tests/contract/browser-engine-selection.test.mjs`、`skills/frontend-testing/scripts/collect-console.mjs`、`skills/frontend-testing/scripts/collect-network.mjs`、`skills/frontend-testing/scripts/collect-overflow.mjs`、`skills/frontend-testing/scripts/collect-perf.mjs`、`skills/frontend-testing/scripts/collect-a11y.mjs`、`skills/frontend-testing/skill-bundle.json`、`tests/contract/page-audit-collectors.test.mjs`、`tests/integration/n3-browser-ticket-boundary.node-test.mjs`、`tests/integration/n3-browser-session-lifecycle.node-test.mjs` | P1 | P5 与 P8 |
| `P3` | `phases/P3-受控测试页与校准负例.md` | `这一 Phase 交出什么？` | `tests/fixtures/page-audit/controlled-page.html`、`tests/fixtures/page-audit/defects.json`、`tests/fixtures/page-audit/calibration/font.html`、`tests/fixtures/page-audit/calibration/spacing.html`、`tests/fixtures/page-audit/calibration/color.html`、`tests/fixtures/page-audit/calibration/blocker.html`、`tests/contract/page-audit-fixtures.test.mjs` | P1 | P8（末验收 Phase 的受控页注入与终验串演） |
| `P4` | `phases/P4-报告接入与回修闭环.md` | `这一 Phase 交出什么？` | `workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`skills/review/SKILL.md`、`tests/contract/page-audit-report-consumption.test.mjs`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/index.html`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/assets/app.js`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/assets/styles.css`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/index.html`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/app.js`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/styles.css`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/components/SimWorkbench.tsx`、`docs/architecture/move-map.json`、`tests/fixtures/page-audit/controlled-work.html`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/stage-progress-contract.test.mjs` | P1、P3 | P5、P8（P5 读接线措辞，P8 按终末四项复核取证） |
| `P5` | `phases/P5-审计编排入口与规范消费证明.md` | `这一 Phase 交出什么？` | `skills/frontend-testing/scripts/run-page-audit.mjs`、`skills/frontend-testing/scripts/check-norm-consumption.mjs`、`tests/contract/page-audit-runner.test.mjs`、`tests/contract/page-audit-consumption.test.mjs`、`tests/fixtures/page-audit/runner/judgments.json`、`skills/frontend-testing/skill-bundle.json`、`docs/architecture/move-map.json` | P1、P2、P4 | P7 与 P8。 |
| `P6` | `phases/P6-make-decision流程九条修复.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/flows/small/steps.json`、`workflows/make-decision/flows/normal/steps.json`、`workflows/make-decision/flows/planning/steps.json`、`skills/decision-log/templates/decision-log-template.md`、`docs/standard-workflow.md`、`tests/contract/make-decision-flow.test.mjs`、`tests/contract/make-decision-flows.test.mjs`、`tests/contract/check-stage-steps.test.mjs`、`tests/contract/stage-closeout-step-contract.test.mjs`、`tests/contract/n10-material-contract.test.mjs`、`tests/integration/main-agent-cost-closeout.node-test.mjs`、`tools/cli/check-stage-steps.mjs`、`tools/cli/run-checks.mjs` | none | tools/cli/check-stage-steps.mjs |
| `P7` | `phases/P7-交付证据与防假绿实现.md` | `这一 Phase 交出什么？` | `skills/frontend-testing/scripts/check-report-quotes.mjs`、`skills/frontend-testing/scripts/check-version-binding.mjs`、`tests/contract/page-audit-m10.test.mjs`、`tests/fixtures/page-audit/m10/quote-cases.json`、`tests/fixtures/page-audit/m10/materials-cases.json`、`skills/frontend-testing/skill-bundle.json`、`docs/architecture/move-map.json`、`tools/cli/run-checks.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/evidence-path-existence.test.mjs` | P1、P2、P4、P5、P6 | P8。 |
| `P8` | `phases/P8-全AC终验.md` | `这一 Phase 交出什么？` | `tests/contract/page-audit-acceptance.test.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`、`skills/isolated-browser-qa/SKILL.md`、`skills/isolated-browser-qa/references/agent-browser.md` | P1、P2、P3、P4、P5、P6、P7 | skills/stage-close/SKILL.md |
| `P9` | `phases/P9-材料为读者写.md` | `这一 Phase 交出什么？` | `runtime/stage/stage-content-contracts.mjs`、`workflows/build-plan/SKILL.md`、`skills/spec-plan/scripts/check-reader-record.mjs`、`skills/spec-plan/scripts/check-authoring-budget.mjs`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`tests/contract/reader-record.test.mjs`、`tests/contract/authoring-shape.test.mjs`、`tests/contract/authoring-budget.test.mjs`、`tests/contract/phase-contract-prose.test.mjs`、`tests/contract/phase-prose.test.mjs`、`skills/spec-plan/references/authoring-contract.md`、`skills/spec-analyze/SKILL.md`、`tests/contract/spec-analyze-classes.test.mjs`、`tests/contract/authoring-contract.test.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/task/material-workspace.mjs`、`tests/contract/light-material-set.test.mjs` | P4、P6、P7 | 下一份 build-plan/build-code 材料的作者与阶段读者 |
| `P10` | `phases/P10-让审查判方案.md` | `这一 Phase 交出什么？` | `runtime/review/stage-materials.json`、`runtime/review/schemas/stage-materials.schema.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/build-plan.md`、`skills/spec-plan/scripts/build-decision-baseline.mjs`、`tests/contract/review-decision-baseline.test.mjs`、`tests/contract/review-axes-contract.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`workflows/build-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`tests/contract/n11-review-channel.test.mjs` | P9 | 下一次 build-plan 审查与独立读者 |
| `P11` | `phases/P11-去字面断言.md` | `这一 Phase 交出什么？` | `tests/contract/page-audit-doc-contract.test.mjs`、`tests/contract/acceptance-plan.test.mjs`、`tests/contract/n11-plan-quality.test.mjs`、`tests/contract/n11-acceptance-rules.test.mjs` | P1 | 后续所有 Phase 的门禁，以及下一份材料的作者。 |
| `P12` | `phases/P12-逐需验收与真实完成.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`workflows/build-plan/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/wh-review/contracts/build-plan.md`、`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`tests/contract/dispatch-quality.test.mjs`、`AGENTS.md` | P4、P6、P9、P10、P11 | 当前C07的原规划owner、P12独立测试与终末独立reader |
