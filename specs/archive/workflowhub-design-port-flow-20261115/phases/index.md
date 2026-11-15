# Phase 索引 — 有稿设计移植与逐包收敛流程

> 指向六个独立 Phase 的纯指针；本文件没有实现、执行状态或完成权威。
> 必要输入、判据、命令、证据和停止条件均留在所指 Phase。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-方案收敛.md` | `这一 Phase 交出什么？` | `workflows/make-decision/SKILL.md；skills/decision-log/templates/decision-log-template.md；tests/contract/convergence-card-contract.test.mjs` | `none` | 后续任务作者、阶段 2 主会话、逐包独立读者与独立测试者 |
| `P2` | `phases/P2-判断与移植.md` | `这一 Phase 交出什么？` | `workflows/build-plan/SKILL.md；workflows/build-prd/SKILL.md；workflows/build-code/SKILL.md；skills/design-source-extraction/SKILL.md；skills/design-source-extraction/references/port-method.md；skills/design-source-extraction/scripts/check-judgment.mjs；skills/design-source-extraction/scripts/check-port-manifest.mjs；tests/contract/design-port-judgment.test.mjs；tests/contract/design-port-port-manifest.test.mjs；tests/fixtures/design-port-sample/README.md；tests/fixtures/design-port-sample/prototype/index.html；tests/fixtures/design-port-sample/prototype/styles.css；tests/fixtures/design-port-sample/prototype/app.js；tests/fixtures/design-port-sample/judgment/direct/judgment.md；tests/fixtures/design-port-sample/judgment/adapt/judgment.md；tests/fixtures/design-port-sample/judgment/unusable/judgment.md；tests/fixtures/design-port-sample/judgment/no-old-page/judgment.md；tests/fixtures/design-port-sample/judgment/unusable-missing-next/judgment.md；tests/fixtures/design-port-sample/judgment/unusable-missing-owner/judgment.md；tests/fixtures/design-port-sample/port/manifest.json；tests/fixtures/design-port-sample/port/manual-overrides.css` | `P1` | 三阶段主会话、阶段 3 实施者、独立测试者与独立设计审查者 |
| `P3` | `phases/P3-数据与旧功能.md` | `这一 Phase 交出什么？` | `skills/design-source-extraction/references/data-and-state.md；skills/design-source-extraction/references/wiring.md；skills/design-source-extraction/scripts/check-data-discipline.mjs；skills/design-source-extraction/scripts/check-wiring.mjs；tests/contract/design-port-data-discipline.test.mjs；tests/contract/design-port-wiring.test.mjs；tests/fixtures/design-port-sample/data/loading.json；tests/fixtures/design-port-sample/data/success.json；tests/fixtures/design-port-sample/data/empty.json；tests/fixtures/design-port-sample/data/error.json；tests/fixtures/design-port-sample/data/timeout.json；tests/fixtures/design-port-sample/data/write-receipt.json；tests/fixtures/design-port-sample/data/sample-mode.json；tests/fixtures/design-port-sample/data/real-mode.json；tests/fixtures/design-port-sample/wiring/wiring.md` | `P2` | 阶段 4 独立审查者、数据与接线实施者、独立测试者与独立设计审查者 |
| `P4` | `phases/P4-机器与目视校验.md` | `这一 Phase 交出什么？` | `skills/design-source-extraction/references/verification.md；skills/design-source-extraction/references/visual-review.md；skills/design-source-extraction/scripts/check-geometry.mjs；skills/design-source-extraction/scripts/check-dom-parity.mjs；skills/design-source-extraction/scripts/check-port-parity.mjs；skills/design-source-extraction/scripts/check-feature-keep.mjs；skills/design-source-extraction/scripts/check-visual-review.mjs；tests/contract/design-port-verification.test.mjs；tests/contract/design-port-visual-review.test.mjs；tests/fixtures/design-port-sample/verification/geometry.json；tests/fixtures/design-port-sample/verification/dom-parity.json；tests/fixtures/design-port-sample/verification/port-parity.json；tests/fixtures/design-port-sample/verification/feature-keep.json；tests/fixtures/design-port-sample/visual/review.json` | `P2`；`P3` | 独立测试者、独立设计审查者、阶段 5 主会话与阶段 6 末验收者 |
| `P5` | `phases/P5-协作与规范.md` | `这一 Phase 交出什么？` | `skills/design-source-extraction/references/collaboration.md；skills/design-source-extraction/references/anti-patterns.md；skills/design-source-extraction/scripts/check-write-set.mjs；tests/contract/design-port-write-set.test.mjs；tests/contract/design-port-flow.test.mjs；tests/integration/design-port-write-set-lock.test.mjs；tests/fixtures/design-port-sample/write-set/write-set.json；workflows/make-decision/SKILL.md；workflows/build-plan/SKILL.md；workflows/build-prd/SKILL.md；workflows/build-code/SKILL.md；tools/cli/check-stage-steps.mjs；skills/design-source-extraction/SKILL.md；tests/contract/check-stage-steps.test.mjs；skills/catalog.yaml；skills/reuse-registry.md；docs/architecture/move-map.json；skills/design-source-extraction/skill-bundle.json；workflows/build-plan/skill-deps.yaml；workflows/build-prd/skill-deps.yaml；workflows/build-code/skill-deps.yaml；workflows/make-decision/skill-deps.yaml` | `P1`；`P2`；`P3`；`P4` | build-code 主会话、后续任务作者、独立测试者与阶段 6 末验收者 |
| `P6` | `phases/P6-整体验收.md` | `这一 Phase 交出什么？` | `N/A — 本阶段只读仓库；任务证据经 appendRecord/captureCommand 保存，不改生产文件` | `P1`；`P2`；`P3`；`P4`；`P5` | 阶段主会话、独立终末读者、实际交接读者与用户 |

## 并行与合并导航（人读指针）

分组只引用 spec 的谁先谁后、实现设计和各 Phase 的文件责任。
同路径不因改动字段不同而并行；冲突回原写者。

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末指针 |
| --- | --- | --- | --- | --- |
| 组一：P1 | 无前置；独立交付 | workflows/make-decision/SKILL.md 由 P1 先写、P5 后写 | P1 交回后进 P2 | spec.md Appendix A；phases/P1-方案收敛.md 的 Done |
| 组二：P2 | P1 已交回；本组串行 | workflows/build-code/SKILL.md 与 skills/design-source-extraction/SKILL.md 由 P2 先写、P5 后写 | P2 交回后进 P3 | spec.md Appendix A；phases/P2-判断与移植.md 的 Done |
| 组三：P3 | P2 已交回；卡内写集互斥仍按真实输入定序 | 无跨 Phase 共享写入；阶段 4 只读消费 | P3 交回后进 P4 | spec.md Appendix A；phases/P3-数据与旧功能.md 的 Done |
| 组四：P4 | P2、P3 已交回；机器与目视按 Phase 内依赖执行 | 无跨 Phase 共享写入；上游对象只读 | P4 交回后进 P5 | spec.md Appendix A；phases/P4-机器与目视校验.md 的 Done |
| 组五：P5 | P1—P4 已交回；不与前组并行 | 承接 P1/P2 的共享文件；P5 内任务 1 先于任务 2 | P5 交回后进 P6 | spec.md Appendix A；phases/P5-协作与规范.md 的 Done |
| 组六：P6 | P1—P5 已交回；唯一末验收 | 仓库只读；任务原件按 P6 原接口保存 | 最终报告与实际交接归 P6 | spec.md Appendix A；phases/P6-整体验收.md 的 Done |
