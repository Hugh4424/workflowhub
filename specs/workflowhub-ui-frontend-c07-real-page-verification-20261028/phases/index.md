# Phase 索引 — C07 真实页面验证与定向回修

这份索引只干一件事：告诉接手的人，这活分几步、每步归谁做、先后怎么排。
它不含做法，也不含判据；怎么做、怎么算过，都在各 Phase 正文里。

编号 P1 到 P12 是十二个 Phase（阶段）。
每个 Phase 有一份正文和一个写主；写主指唯一可以改这份 Phase 所列文件的人。

本文件不证明做过什么。它只放指针、顺序和写集。

## 这份计划分几步？

十二步：页面审计与流程修复是 P1 到 P7，方法与材料是 P9 到 P12，
全 AC 终验 P8 收尾。
十二步之间没有循环依赖；编号只是标识，不代表先后，也不代表轻重。

## 按什么顺序做？

顺序按依赖排，不按编号排。实际链条是：

P1 → P6 → P2 → P3 → P4 → P5 → P7 → P9 → P10 → P11 → P12 → P8。

- P1 与 P6 没有上游，可同时开工。
- P2、P3 只接 P1，可同时开工。
- P4 接 P3；P5 接 P2 与 P4；P7 接 P5。
- P9 接 P6；P10 接 P9；P11 只接 P1，任何空档都能做。
- P12 接 P4、P6、P9、P10、P11 交回的方法。
- P8 最后：它读 P1 到 P7 的产物，也读 P9 到 P12 交回后的最终字节。

P8 为什么排在 P12 后面：P12 会改 build-code 的接线文件，
而 P8 按收尾四项复核同一份文件。先判 P8，等于判完又被人改掉，判据落在旧字节上。

依赖列与编号是两件事，别混着读。

- 依赖列只记输入由谁交，只能填编号更小的 Phase。
- 编号不表示执行先后；先后只看本节列的那条链。
- 编号大的可以先做，P12 就是现成例子。
- 某个 Phase 先做完不必等后面的；它的下游只看它交回没有。

P8 还要读 P9 到 P12 交回后的最终字节。
这几个编号更大，填不进依赖列，靠执行先后保证；依赖列仍只写 P1 到 P7。
索引表仍按编号排，只为检索；排期以本节为准。

## 共享文件谁先写？

共享文件按依赖串行：前一位写完，才轮到下一位。

- 前端测试技能包 `skills/frontend-testing/skill-bundle.json`：P1 先写，P2、P5、P7 依次追加。
- 目录映射 `docs/architecture/move-map.json`：P4 先登记，P5、P7 后补。
- 决策日志模板 `decision-log-template.md`：P6 先写，P9 后改，P12 最后再改。

阶段十二的八份方法文档等原写主交回后再动。
另有一份已声明的受影响触发测试；当前机器表九项保持不变。
P8 另在 P2 的浏览器网关上补两处，也要等 P2 交回。
P6 的检查器与材料校验器只有它一个写主；P12 不碰这两处。

同一路径出现冲突，回最近的写主，不另建第二条路径。

## 每步交给谁？

每个 Phase 只把结果交给下游；下游是谁，看文末索引表的「消费者」列。
下游读上游正文，不抄上游的判据。

页面这条链有七段交接。

- P1 的判据交给 P2 的五个采集器与 P4 的报告解析。
- P2 的真实页面采集（在真浏览器里取页面事实）交给 P5 编排与 P8 的最后验收。
- P3 的受控页（故意埋缺陷的测试页）交给 P8 做缺陷注入与复验。
- P4 的接线（把审计接进 build-code）交给 P5 读措辞、P8 按收尾四项复核。
- P5 的编排入口（一次调用串起采集与报告）交给 P7 与 P8。
- P7 的两条检测脚本交给 P8。
- P8 把七条页面验收交给阶段收口（stage-close，阶段结束时的收尾入口）。

方法这条链有五段交接。

- P6 的九条流程交给 `check-stage-steps`（阶段步骤检查脚本）。
- P9 的写法交给下一份 build-plan 与 build-code 材料的作者与阶段读者。
- P10 的审查改造交给下一次 build-plan 审查与独立读者。
- P11 的测试迁移（把查字面的话改成查行为）交给后续检查与下一份材料的作者。
- P12 的逐需验收交给原规划负责人、独立测试与最后一位读者。

P8 管原七条页面验收；P12 管本轮新增的方法目标（写作、审查与验收方法本身）。
两者不互相代替，也不互相顶签。

## Execution Index

> 校验器用，人可跳过：本表只放指针与字段，正文在各自 Phase 文件。
> 本表按编号 P1 到 P12 排，只作检索；排期看「按什么顺序做？」。

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-判据与共用契约.md` | `这一 Phase 交出什么？` | `skills/frontend-testing/references/page-audit.md`、`skills/frontend-testing/scripts/check-page-audit.mjs`、`skills/frontend-testing/SKILL.md`、`skills/frontend-testing/skill-bundle.json`、`skills/catalog.yaml`、`skills/plan-design-review/SKILL.md`、`tests/contract/page-audit-wiring.test.mjs` | none | Phase 2 的五个采集器、Phase 4 的报告解析。 |
| `P2` | `phases/P2-真实采集与失败语义.md` | `这一 Phase 交出什么？` | `skills/isolated-browser-qa/SKILL.md`、`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-tickets.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh`、`skills/isolated-browser-qa/references/agent-browser.md`、`skills/isolated-browser-qa/references/fallback.md`、`skills/isolated-browser-qa/skill-bundle.json`、`tests/contract/browser-engine-selection.test.mjs`、`skills/frontend-testing/scripts/collect-console.mjs`、`skills/frontend-testing/scripts/collect-network.mjs`、`skills/frontend-testing/scripts/collect-overflow.mjs`、`skills/frontend-testing/scripts/collect-perf.mjs`、`skills/frontend-testing/scripts/collect-a11y.mjs`、`skills/frontend-testing/skill-bundle.json`、`tests/contract/page-audit-collectors.test.mjs` | P1 | P5 与 P8 |
| `P3` | `phases/P3-受控测试页与校准负例.md` | `这一 Phase 交出什么？` | `tests/fixtures/page-audit/controlled-page.html`、`tests/fixtures/page-audit/defects.json`、`tests/fixtures/page-audit/calibration/font.html`、`tests/fixtures/page-audit/calibration/spacing.html`、`tests/fixtures/page-audit/calibration/color.html`、`tests/fixtures/page-audit/calibration/blocker.html`、`tests/contract/page-audit-fixtures.test.mjs` | P1 | P8（末验收 Phase 的受控页注入与终验串演） |
| `P4` | `phases/P4-报告接入与回修闭环.md` | `这一 Phase 交出什么？` | `workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`skills/review/SKILL.md`、`tests/contract/page-audit-report-consumption.test.mjs`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/index.html`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/assets/app.js`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/assets/styles.css`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/index.html`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/app.js`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/B/styles.css`、`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/A/components/SimWorkbench.tsx`、`docs/architecture/move-map.json`、`tests/fixtures/page-audit/controlled-work.html`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/stage-progress-contract.test.mjs` | P1、P3 | P5、P8（P5 读接线措辞，P8 按终末四项复核取证） |
| `P5` | `phases/P5-审计编排入口与规范消费证明.md` | `这一 Phase 交出什么？` | `skills/frontend-testing/scripts/run-page-audit.mjs`、`skills/frontend-testing/scripts/check-norm-consumption.mjs`、`tests/contract/page-audit-runner.test.mjs`、`tests/contract/page-audit-consumption.test.mjs`、`tests/fixtures/page-audit/runner/judgments.json`、`skills/frontend-testing/skill-bundle.json`、`docs/architecture/move-map.json` | P1、P2、P4 | P7 与 P8。 |
| `P6` | `phases/P6-make-decision流程九条修复.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/flows/small/steps.json`、`workflows/make-decision/flows/normal/steps.json`、`workflows/make-decision/flows/planning/steps.json`、`skills/decision-log/templates/decision-log-template.md`、`docs/standard-workflow.md`、`tests/contract/make-decision-flow.test.mjs`、`tests/contract/make-decision-flows.test.mjs`、`tests/contract/check-stage-steps.test.mjs`、`tests/contract/stage-closeout-step-contract.test.mjs`、`tests/contract/n10-material-contract.test.mjs`、`tests/integration/main-agent-cost-closeout.node-test.mjs`、`tools/cli/check-stage-steps.mjs`、`tools/cli/run-checks.mjs` | none | tools/cli/check-stage-steps.mjs |
| `P7` | `phases/P7-交付证据与防假绿实现.md` | `这一 Phase 交出什么？` | `skills/frontend-testing/scripts/check-report-quotes.mjs`、`skills/frontend-testing/scripts/check-version-binding.mjs`、`tests/contract/page-audit-m10.test.mjs`、`tests/fixtures/page-audit/m10/quote-cases.json`、`tests/fixtures/page-audit/m10/materials-cases.json`、`skills/frontend-testing/skill-bundle.json`、`docs/architecture/move-map.json`、`tools/cli/run-checks.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/evidence-path-existence.test.mjs` | P1、P2、P4、P5、P6 | P8。 |
| `P8` | `phases/P8-全AC终验.md` | `这一 Phase 交出什么？` | `tests/contract/page-audit-acceptance.test.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`、`skills/isolated-browser-qa/SKILL.md` | P1、P2、P3、P4、P5、P6、P7 | skills/stage-close/SKILL.md |
| `P9` | `phases/P9-材料为读者写.md` | `这一 Phase 交出什么？` | `runtime/stage/stage-content-contracts.mjs`、`workflows/build-plan/SKILL.md`、`skills/spec-plan/scripts/check-reader-record.mjs`、`skills/spec-plan/scripts/check-authoring-budget.mjs`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`tests/contract/reader-record.test.mjs`、`tests/contract/authoring-shape.test.mjs`、`tests/contract/authoring-budget.test.mjs`、`tests/contract/phase-contract-prose.test.mjs`、`tests/contract/phase-prose.test.mjs`、`skills/spec-plan/references/authoring-contract.md`、`skills/spec-analyze/SKILL.md`、`tests/contract/spec-analyze-classes.test.mjs`、`tests/contract/authoring-contract.test.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/task/material-workspace.mjs`、`tests/contract/light-material-set.test.mjs` | P4、P6、P7 | 下一份 build-plan/build-code 材料的作者与阶段读者 |
| `P10` | `phases/P10-让审查判方案.md` | `这一 Phase 交出什么？` | `runtime/review/stage-materials.json`、`runtime/review/schemas/stage-materials.schema.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/build-plan.md`、`skills/spec-plan/scripts/build-decision-baseline.mjs`、`tests/contract/review-decision-baseline.test.mjs`、`tests/contract/review-axes-contract.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`workflows/build-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`tests/contract/n11-review-channel.test.mjs` | P9 | 下一次 build-plan 审查与独立读者 |
| `P11` | `phases/P11-去字面断言.md` | `这一 Phase 交出什么？` | `tests/contract/page-audit-doc-contract.test.mjs`、`tests/contract/acceptance-plan.test.mjs`、`tests/contract/n11-plan-quality.test.mjs`、`tests/contract/n11-acceptance-rules.test.mjs` | P1 | 后续所有 Phase 的门禁，以及下一份材料的作者。 |
| `P12` | `phases/P12-逐需验收与真实完成.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`workflows/build-plan/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/wh-review/contracts/build-plan.md`、`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`tests/contract/dispatch-quality.test.mjs`、`AGENTS.md` | P4、P6、P9、P10、P11 | 当前C07的原规划owner、P12独立测试与终末独立reader |
