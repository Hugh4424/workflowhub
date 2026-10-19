# Phase 索引 — N6骨架与逐工作包收敛

本件仅导航真实Phase权威，正文/命令/执行事实留原owner。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-内外调研可消费.md` | `T001 — 内外调研可消费` | `skills/knowledge-graph/SKILL.md`；`skills/deep-research/SKILL.md`；`workflows/make-decision/SKILL.md`；`skills/reuse-registry.md` | none | 研究派发者、make-decision作者与P3实施者 |
| `P2` | `phases/P2-提问可用.md` | `T002 — 提问可用` | `skills/talk-with-zhipeng/SKILL.md`；`skills/grill-with-docs/SKILL.md`；`skills/catalog.yaml`；`THIRD_PARTY_NOTICES.md`；`skills/reuse-registry.md` | P1 | Talk/Grill调用者、独立搬运者与P3收敛实施者 |
| `P3` | `phases/P3-骨架到逐包收敛.md` | `T003 — 骨架到逐包收敛` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/skill-deps.yaml`；`tools/cli/check-decision-log-chain.mjs`；`skills/reuse-registry.md`；`skills/grill-with-docs/SKILL.md`；`skills/talk-with-zhipeng/SKILL.md` | P1, P2 | make-decision主会话、build-plan读者与P5驾驶舱作者 |
| `P4` | `phases/P4-技术分歧草图.md` | `T004 — 技术分歧草图` | `AGENTS.md`；`tests/contract/delivery-closeout-charter-contract.test.mjs`；`skills/catalog.yaml`；`THIRD_PARTY_NOTICES.md`；`skills/reuse-registry.md` | P3 | 遇技术分歧的主会话、用户与独立验收者 |
| `P5` | `phases/P5-任务驾驶舱.md` | `T005 — 任务驾驶舱` | `skills/answer-as-page/SKILL.md`；`skills/answer-as-page/skill-bundle.json`；`skills/answer-as-page/templates/overview-template.html`；`skills/catalog.yaml`；`THIRD_PARTY_NOTICES.md`；`skills/reuse-registry.md`；`docs/architecture/move-map.json`；`workflows/make-decision/SKILL.md` | P3, P4 | 查看当前任务的用户与后续阶段页面更新者 |
| `P6` | `phases/P6-全任务验收.md` | `T006 — 全任务验收` | none | P1, P2, P3, P4, P5 | verify-code主会话、用户与任务收口者 |

pre cohort 的旧任务卡只读保留，在本文件中没有有效行；它们仍按旧四材料（`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`）读取，本索引属 post 形态、不为它们提供指针，也不得据本件反推旧任务缺材料。

〔已改正（审查修正）：① **P5 行**旧写法在「写入集」格里夹了执行条件——「（其中overview-template.html为条件NEW：真实设计返回并经用户确认后才写；未满足不创建文件、不列bundle.files）」，那是 L1 执行条件、不是指针字段，且让本行不能与 `P5-任务驾驶舱.md` 的 Write set 逐字一致；该句已移回 P5 卡「文件边界」，本行只留纯指针字段（现与该卡 Write set 逐字一致）。② **语义锚点**旧六行全写 `L0 — 结果与变更`，六行不可区分；现逐行指向该 Phase 的唯一实施段标题（`T001`…`T006`），可直接定位到卡内实施合同。③ 旧缺 pre cohort 尾注，被读成「本索引覆盖全部任务形态」；现补尾注说明旧任务卡只读、仍按旧四材料读取。依据 IDX-01／IDX-02／IDX-03。④ **P3 行**旧「写入集」只列五件（`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/skill-deps.yaml`；`tools/cli/check-decision-log-chain.mjs`；`skills/reuse-registry.md`），漏了 P3 承接 D5／D6 删减所落的 `skills/grill-with-docs/SKILL.md` 与 `skills/talk-with-zhipeng/SKILL.md`；现补入并与该卡契约头「Write set」／L1「MODIFY」逐字一致（这两件在 P2 由 P2 writer 主写，P3 只做删减、不重写 P2 正文）。依据 回执 2026-10-19-054 发现 #5（pi/v4flash，blocking）。〕
