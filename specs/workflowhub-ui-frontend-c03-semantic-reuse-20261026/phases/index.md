# Phase 索引 — C03 组件与布局语义化复用

> 指向各 Phase 独立权威的纯指针。由 Phase 标题与契约头重新生成；本文件没有实现或完成权威。
> 每个 `phases/P<n>.md` 恰好一行；字段取自实际 Phase 契约头，与本文件逐条一致。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-四类对象台账.md` | `L0 — 结果与变更` | `PB/specs/design/components.md`；`PB/specs/design/layouts.md`；`quality/evidence/P1-ledger.json`；`quality/tests/c03-evidence-check.mjs`；`quality/tests/fixtures/c03-ledger-missing-field.json` | `none` | P2、P3、P6（本卡内）；C06（跨卡，登记边） |
| `P2` | `phases/P2-两条链复用与组合.md` | `L0 — 结果与变更` | `PB/frontend/src/workbench-screen.tsx`；`PB/frontend/src/business-log-page.tsx`；`PB/frontend/src/ui/workbench-page.css`；`PB/frontend/src/ui/business-log-page.css`；`PB/frontend/src/workbench-screen.test.tsx`；`PB/frontend/src/business-log-page.test.tsx` | `P1` | P3、P4（本卡内）；C06（跨卡，登记边） |
| `P3` | `phases/P3-静态反例.md` | `L0 — 结果与变更` | `quality/evidence/P3-counterexamples.json` | `P2` | P4 |
| `P4` | `phases/P4-页面层验收.md` | `L0 — 结果与变更` | `quality/evidence/P4-page.json`；`quality/tests/c03-browser-assertions.mjs` | `P3` | P5（本卡内）；C06（跨卡） |
| `P5` | `phases/P5-交下游受影响对象.md` | `L0 — 结果与变更` | `quality/evidence/P5-handoff.json` | `P2、P4` | C08（跨卡，登记边） |
| `P6` | `phases/P6-共享资产检查段.md` | `L0 — 结果与变更` | `WH/skills/frontend-component-quality/SKILL.md`；`quality/evidence/P6-shared-segment.json` | `P1` | 实施者、C06（跨卡） |
| `P7` | `phases/P7-外部引用台账与登记.md` | `L0 — 结果与变更` | `quality/evidence/P7-external.json`；`WH/specs/workflowhub-ui-frontend-release-20261020/prd.md`；`WH/skills/catalog.yaml`；`WH/skills/reuse-registry.md`；`WH/AGENTS.md` | `P6、P5` | 实施者；C06／规范同步（G-18 承接方）；C05、C10 |
| `P8` | `phases/P8-全AC终末验收.md` | `L0 — 结果与变更` | `quality/evidence/P8-acceptance.json`；`quality/evidence/P8-readiness-data.json`；`quality/evidence/P8-readiness-env.json`；`quality/tests/fixtures/c03-acceptance-missing-ac.json` | `P5、P7` | verify-code；C06、C08 下游读者 |

末行指向唯一全 AC 验收 Phase：`P8`，覆盖 `AC-C03-1`～`AC-C03-8`。

pre cohort 的旧任务卡只读保留，在本文件中没有有效行。
