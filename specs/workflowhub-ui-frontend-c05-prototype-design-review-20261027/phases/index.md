# Phase 索引 — C05 原型设计与设计审查

> 指向四个实际 Phase 独立权威的纯指针。每行只从 Phase 契约头取权威路径、语义锚点、写集、依赖与消费者；本文件不承载实现、命令、oracle、证据或进度，也不保存完成状态。阅读时先看 spec 第 7 节与各 Phase 的 L0，再沿本表进入具体 Phase。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-计划材料可独立执行.md` | `L0 — 结果与变更` | `workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`skills/spec-specify/SKILL.md`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-plan/templates/index-template.md`；`skills/spec-analyze/SKILL.md`；`skills/decision-log/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`；`tests/contract/plan-authoring-compatibility.test.mjs`；`tests/contract/c05-phase-navigation.test.mjs` | none | 后续 build-plan 作者、build-code 主会话与独立读者 |
| `P2` | `phases/P2-派发与审查纪律.md` | `L0 — 结果与变更` | `AGENTS.md`；`docs/standard-workflow.md`；`workflows/build-code/SKILL.md`；`skills/wh-review/SKILL.md`；`tests/contract/dispatch-quality.test.mjs` | none | build-code 主会话、独立审查者与测试执行者 |
| `P3` | `phases/P3-两路设计能力与样本验证.md` | `L0 — 结果与变更` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`workflows/build-code/SKILL.md`；`skills/frontend-prototype-render/SKILL.md`；`skills/plan-design-review/SKILL.md`；`skills/frontend-component-quality/SKILL.md`；`skills/catalog.yaml`；`skills/external/README.md`；`skills/reuse-registry.md`；`docs/architecture/move-map.json`；`tests/e2e/prototype-design-journey.sh`；`tests/e2e/fixtures/empty-baseline.html`；`tests/contract/ui-source-consumption.test.mjs`；`tests/contract/prototype-design-review.test.mjs`；`skills/ui-copy-discipline/SKILL.md`；`skills/figma-make-prompt/SKILL.md`；`skills/external/ui-designer/skill-bundle.json`；`skills/external/playbook/skill-bundle.json`；`skills/ui-copy-discipline/skill-bundle.json`；`skills/figma-make-prompt/skill-bundle.json`；`skills/external/ui-designer/design-brief/SKILL.md`；`skills/external/ui-designer/information-architecture/SKILL.md`；`skills/external/ui-designer/design-tokens/SKILL.md`；`skills/external/ui-designer/frontend-design/SKILL.md`；`skills/external/ui-designer/ui-interaction-states/SKILL.md`；`skills/external/ui-designer/ui-accessibility-review/SKILL.md`；`skills/external/ui-designer/design-review/SKILL.md`；`skills/external/playbook/00-ux-spec-skill.md`；`skills/external/playbook/02-cloudai-picker-skill.md`；`skills/external/playbook/09-variant-skill.md`；`skills/external/playbook/08-evaluator-rubric.md`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/package.json`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/package-lock.json`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/next.config.ts`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/tsconfig.json`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/app/layout.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/app/globals.css`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/app/page.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/app/simulation/page.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/app/workbench/page.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/components/SimulationBoard.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/components/SimWorkbench.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/components/PerfBlocks.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/components/RunTimeline.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/lib/fixtures.ts`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/lib/mock-state.ts`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/A/README.md`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/package.json`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/package-lock.json`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/next.config.ts`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/tsconfig.json`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/app/layout.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/app/globals.css`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/app/page.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/app/live/page.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/components/LiveCockpit.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/components/SymbolDrawer.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/components/CloseConfirmDialog.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/components/ReadbackPanel.tsx`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/lib/fixtures.ts`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/lib/permissions.ts`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/lib/mock.ts`；`specs/workflowhub-ui-frontend-c05-prototype-design-review-20261027/samples/B/README.md` | P1；P2 | 后续 UI 任务作者、独立设计审查者、实现任务（C06）与用户 |
| `P4` | `phases/P4-全需求终验与报告.md` | `L0 — 结果与变更` | `tests/contract/c05-final-coverage.test.mjs` | P1；P2；P3 | 用户、关闭 reader、C06 与 C09 |

## 并行与合并导航

本节回答：四个 Phase 谁和谁能同时开工、共享路径谁先写谁后写、在哪个点汇合、出冲突回哪里。这里只放指针，不复制命令、oracle、证据路径或执行状态；详细判据在 spec 第 7 节「并行执行策略」与各 Phase 的 L1「文件边界与共享写主」「任务顺序」。

### 组一：P1 与 P2 可并行

- **可并行条件**：两侧写集交集为空；输入独立（P1 读计划材料与模板，P2 读派发、审查与标准工作方法）；测试与审查各自独立；共享只读源不构成依赖。P1 与 P2 都不写 `docs/architecture/move-map.json`，因此没有共同可变文件。
- **共享路径与先后**：无。P1 只写计划/模板/分析/决策模板与两个测试；P2 只写 AGENTS、standard-workflow、build-code、wh-review 与一个测试。
- **合并点**：P3 开工前汇合。两侧各交回当前原件与 reader/重放回执；若出现意外同路径，回原 writer 修，并把该组改成串行。
- **首判归属**：验收 13、14 在 P1 首判；验收 15、16 的规则在 P2 首判，实际并发/派发效果在 P4 首判；验收 17 只在 P4 首判，P2 只准备事件来源。

### 组二：P3 依赖 P1 与 P2

- **可并行条件**：P3 必须等 P1/P2 交回当前状态后开工；T003 先交方法与外部采用，T004/T005 才进样本。样本 A 与样本 B 的根目录互斥，由同一 P3 开发顺序执行；每个文件只有一个写主，不允许第二样本 writer。
- **共享路径与先后**：`workflows/build-plan/SKILL.md` 与 `steps.json` 由 P1 先定结构、P3 后加 UI 分支；`workflows/build-code/SKILL.md` 由 P2 先定派发/终末、P3 后加 UI 消费；`docs/architecture/move-map.json` 由 P3 在 P1/P2 汇合后独占 append，P1/P2 不写。先写者交回已核实状态，后写者只增量，不重写上游已定结构。
- **合并点**：T003 交回后进样本；样本失败回对应样本任务；方法缺陷回 T003；P4 在全部完成后才开工。
- **首判归属**：验收 1、10、11 在 T003 首判；验收 12 首次使用在 T005 首判（T003 只准备规则）；验收 2 在 T004 首判；验收 3 在 T005 首判；验收 4 至 9 由 T004/T005 分别首判。

### 组三：P4 终末

- **可并行条件**：不并行。P4 依赖 P1、P2、P3 的全部当前原件；它的写集只有终末覆盖测试与报告/证据，上游只读。
- **共享路径与先后**：不写上游任何文件；不改 `move-map`；不写样本；只写自己的覆盖测试与证据。
- **合并点**：全 18 条 AC 终验；缺口回对应 Phase owner，不补签；final-report 是唯一不可变关闭记录。
- **首判与终末归属**：验收 17 在 P4 首判；验收 18 的完整结果在 P4 终末，计划承接只在 P1 判；其余 16 条在 P4 做终末复核，不重做首判。

### 每 Phase 内的审查与测试

每个 Phase 的开发完成并明确通知后，审查与测试才开始，两者可并行；审查与测试只读，不改代码、测试或材料；两方明确回报后开发最后确认；迟到 finding 回同一 Phase、同一开发，受影响方复验。并行组只跑针对性集成，不新增每 Phase 合并后全局审查；全局审查由 P4 终末承担。

### 指针

- 全局设计、文件边界、依赖顺序与并行条件：`spec.md#实现设计（全局权威）` 的「文件边界与依赖」「并行执行策略」。
- 18 条验收与首判/终末：`spec.md#8-验收` 的验收导航与 `spec.md#Appendix A`。
- 测试面、命令与覆盖上限：`spec.md#9-测试计划` 与各 Phase 的「测试与证据」。
- 各 Phase 的写集、任务顺序、停止与交接：对应 Phase 的契约头与 L1。
