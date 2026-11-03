# Phase 索引 — C08 规范与资产受控升级

本件只导航实际 Phase 文件；正文、判据、命令与证据都归各自 Phase。
每个 Phase 恰一行，行序即执行序；本文件不承载实现或完成权威。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-影响面与消费者.md` | `这一 Phase 交出什么？` | `quality/evidence/2026-11-02-030-c08-p1-impact-map-fixed.md` | none | P2 规范作者、P3 实现者、独立审查者 |
| `P2` | `phases/P2-五份规范回写.md` | `这一 Phase 交出什么？` | `/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/specs/design/components.md`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/specs/design/layouts.md`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/specs/design/interaction.md`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/specs/frontend/frontend.md`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/specs/frontend/ui-quality.md`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/specs/design/README.md`；`specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/phases/P2-五份规范回写.md`；`specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/phases/index.md` | P1 | P3 实现者、P4 独立复验者、C08-FU-01 |
| `P3` | `phases/P3-代码与测试同步.md` | `这一 Phase 交出什么？` | `/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/live-ledger.tsx`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/ui/live-presentation.css`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/ledger-signal-filter-state.test.tsx`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/live-ledger-warning-wrap.test.tsx`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/business-log-page.test.tsx`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/backtest-workbench.test.tsx`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/workbench-screen.lifecycle.test.tsx`；`/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/frontend/src/business-log-page.tsx`；`specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/phases/P3-代码与测试同步.md`；`specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/phases/index.md` | P2 | P4 独立复验者、P6 验收者 |
| `P4` | `phases/P4-独立定向复验.md` | `这一 Phase 交出什么？` | `quality/evidence/P4-matrix.md`；`quality/evidence/P4-page-A-1280.png`；`quality/evidence/P4-page-B-1280.png`；`quality/evidence/P4-page-C-320.png`；`quality/evidence/P4-page-D-320.png`；`quality/evidence/P4-page-E-320.png`；`quality/tests/2026-11-02-P4-browser.json`；`quality/tests/2026-11-02-P4-targeted-tests.output`；`quality/tests/2026-11-02-P4-scenario.sh` | P3 | P6 验收者 |
| `P5` | `phases/P5-后续任务与防跳步.md` | `这一 Phase 交出什么？` | `quality/evidence/P5-fu01.md`；`quality/evidence/P5-step-guard.md`；`quality/evidence/P5-receipts.md`；`quality/evidence/P5-methods.md`；`quality/tests/2026-11-02-P5-step-guard.output`；`skills/frontend-component-quality/SKILL.md`；`tests/contract/check-stage-steps.test.mjs` | P2 | P6 验收者、后续任务 owner |
| `P6` | `phases/P6-整卡验收与交接.md` | `这一 Phase 交出什么？` | `quality/evidence/P6-acceptance.md`；`quality/evidence/P6-failure-branches.md`；`quality/reviews/P6-final.json` | P5 | 主会话交接读者与后续真实任务 |

## 并行与合并导航（人读指针）

六个 Phase 全部串行，没有并行组；依赖边逐级递增，前一个 Phase 未交回时不开始下一个。

- 串行理由：P2 读 P1 的表，P3 读 P2 的规则，P4 读 P3 的差异，P5 读 P4 的回执，
  P6 读前五个 Phase 的全部原件；每条边都是真实输入依赖，不是编号相邻。
- 共享路径：六个 Phase 的写入集没有重叠，同一条路径没有两个 writer；
  任务库证据件按文件名区分。
- 合并点与首判：每个 Phase 的「Done」段是它的收口点，下一 Phase 从该段与
  「下一消费者拿什么继续？」读回输入；整卡逐条验收只在 P6。
