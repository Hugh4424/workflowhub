# Phase 索引 — C07 真实页面验证与定向回修

这份索引回答三件事：计划分几步、每步交给谁、按什么顺序做。
它是导航，不是规格：怎么做、怎么算对、做到什么结果，都留在各 Phase 正文里。

每一步是一个 Phase（阶段），编号 P1 到 P12，各有一份正文和一位写主。
写主指唯一有权改动这份 Phase 所列文件的人。

本文件不证明实现或完成，只放指针与顺序。

## 这份计划分几步？

分十二步，每一步是一个 Phase（阶段），编号 P1 到 P12。
十二步分三组：页面审计与流程修复 P1 到 P7，方法与材料 P9 到 P12，
全 AC 终验 P8 排最后。
十二步之间没有循环依赖；编号只作标识，不表示先后，也不表示重要程度。

## 按什么顺序做？

按依赖排先后，不看编号大小；P12 先交回，P8 是最后一棒。
顺序是 P1 → P6 → P2 → P3 → P4 → P5 → P7 → P9 → P10 → P11 → P12 → P8。
- P1 与 P6 都没有上游，可以同时开工。
- P2 与 P3 只接 P1，可以同时开工。
- P4 接 P3；P5 接 P2 与 P4；P7 接 P5。
- P9 接 P6；P10 接 P9；P11 只接 P1，任一空档可做。
- P12 接 P4、P6、P9、P10、P11 的方法交回。
- P8 排最后：读 P1 到 P7 的产物，也读 P9 到 P12 交回后的最终字节。

P8 为什么在 P12 之后：P12 会改 build-code 的接线文件，
P8 按收尾四项复核同一份文件；先判 P8 就是判完又被改，判据落到旧字节。

依赖与编号是两件事，别混着读。
- 依赖列记这个 Phase 的输入由谁交，只能填编号更小的 Phase。
- 编号不表示执行先后；执行先后只看本节列的那条链。
- 编号大的可以先做，P12 就是例子。
- 某一 Phase 先做完不必等后面的，它的下游只看它交回没有。

P8 还要读 P9 到 P12 交回后的最终字节。
它们编号更大，填不进依赖列，由执行先后保证；依赖列仍只写 P1 到 P7。
索引表仍按编号排，只为检索；排期以本节为准。

## 共享文件谁先写？

共享文件按依赖先后串行，前一位写完才轮到下一位。
前端测试技能包 skills/frontend-testing/skill-bundle.json：P1 先写，P2、P5、P7 依次追加。
目录映射 docs/architecture/move-map.json：P4 先登记，P5、P7 后补。
决策日志模板 decision-log-template.md：P6 先写，P9 后改，P12 最后再改。
P12 的改动都等原写主交回后再动：它改的八份文件各有更早的写主。
P8 另在 P2 的浏览器网关上补两处，也要等 P2 交回。
P6 的检查器与材料校验器只有它一个写主；P12 不碰这两处。

同一路径有冲突时回最近的写主，不另建第二条路径。

## 每步交给谁？

每个 Phase 只把结果交给下游；下游是谁，看文末索引表的「消费者」列。
下游读上游正文，不抄上游的判据。

页面这条链有七段交接。
P1 的判据交给 P2 的五个采集器与 P4 的报告解析。
P2 的真实页面采集（在真浏览器里取页面事实）交给 P5 编排与 P8 的最后验收。
P3 的受控页（故意埋缺陷的测试页）交给 P8 做缺陷注入与复验。
P4 的接线（把审计接进 build-code）交给 P5 读措辞、P8 按收尾四项复核。
P5 的编排入口（一次调用串起采集与报告）交给 P7 与 P8。
P7 的两条检测脚本交给 P8。
P8 把七条页面验收交给阶段收口（stage-close，阶段结束时的收尾入口）。

方法这条链有五段交接。
P6 的九条流程交给 check-stage-steps（阶段步骤检查脚本）。
P9 的写法交给下一份 build-plan 与 build-code 材料的作者与阶段读者。
P10 的审查改造交给下一次 build-plan 审查与独立读者。
P11 的测试迁移（把查字面的话改成查行为）交给后续检查与下一份材料的作者。
P12 的逐需验收交给原规划负责人、独立测试与最后一位读者。

P8 管原七条页面验收，P12 管本轮新增的方法目标（写作、审查与验收方法本身），两者不互相代替。

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
| `P12` | `phases/P12-逐需验收与真实完成.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`workflows/build-plan/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/wh-review/contracts/build-plan.md`、`workflows/build-code/SKILL.md`、`docs/standard-workflow.md` | P4、P6、P9、P10、P11 | 当前C07的原规划owner、P12独立测试与终末独立reader |
