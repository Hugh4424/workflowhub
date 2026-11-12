# Phase 索引 — C11 页面链路八类缺口修复

> 指向各 Phase 独立权威的纯指针。由 Phase 标题重新生成；本文件没有实现或完成权威。
> 每个 `phases/P<n>.md` 恰好一行；从实际 Phase 契约头读取引用与字段。
> 核对的是实际指针可读与职责，不以 hash/认证 readback 判完成。

本类 P0 是 `Execution Index` 的有效 Phase 指针及其实际契约头导航字段。
不得承载正文，不复制判据。
必要输入、结果、命令/oracle、原件位置及停止/回滚/完成条件均留在所指 Phase 的正文与机器字段块。

逐项状态细项写在所引用且已存在的 Phase/Task 正文。
沿该 Phase 的正文、任务卡与机器字段块回读这些说明。
index 只提供现有权威引用与语义锚点导航，不复制状态正文，不新增状态列。

引用的 Phase 文件缺失或不可读时，如实报告该具体缺口，交原材料 owner 补齐后再建立有效指针。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-c02-data-chain.md` | `这一 Phase 交出什么？` | v15 副本（外部）：`v15/2026-11-11-002-t019-v15-pending-busy-index.html`、`v15/2026-11-11-001-t019-v15-pending-busy-app.js`、新增 `v15/2026-11-12-001-c11-query-writer.mjs` 与 `v15/2026-11-12-002-c11-query-data.js`；`quality/evidence/c11-baseline/v15/`、`quality/evidence/c11-p1-*` | `none` | P3、P4、P5 |
| `P2` | `phases/P2-c03-c08-carrier.md` | `这一 Phase 交出什么？` | 载体（外部）：新增 `app/ui/{tokens-base.css,primitives.css,primitives.tsx,ui-contract.ts}`；`app/globals.css`、`app/data/view-model.ts`、`app/simulation-board/page.tsx`、`app/sim-workbench/page.tsx`、`app/components/simulation-board-panels.tsx`、`app/components/sim-workbench-panels.tsx`；`quality/evidence/c11-baseline/carrier/`、`quality/evidence/c11-p2-*` | `none` | P5 |
| `P3` | `phases/P3-c04-c05-audit.md` | `这一 Phase 交出什么？` | `quality/evidence/c11-p3-cells-index.md`、`quality/evidence/c11-p3-review-eight.md`、`quality/evidence/c11-p3-findings.md` | `P1` | P5、P6 |
| `P4` | `phases/P4-c07-perf-a11y.md` | `这一 Phase 交出什么？` | `quality/evidence/c11-p4-zoom.md`、`c11-p4-a11y.json`、`c11-p4-focus.ndjson`、`c11-p4-perf.json`、`c11-p4-perf-nav.json` | `P1` | P5、P6 |
| `P5` | `phases/P5-c06-diff-review.md` | `这一 Phase 交出什么？` | `quality/evidence/c11-p5-diff.md`、`quality/evidence/c11-p5-findings.md`、`quality/evidence/c11-p5-fix-verify.output` | `P1`、`P2` | P6 |
| `P6` | `phases/P6-closeout.md` | `这一 Phase 交出什么？` | `quality/evidence/c11-closeout-index.md`、`quality/evidence/c11-p6-readback.md` | `P1`、`P2`、`P3`、`P4`、`P5` | C12、用户与后续读者 |

## 并行与合并导航（人读指针）

同组 Phase 输入独立、写集互斥、验收独立才一起做；共享路径按依赖边定先后写主。

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末 AC 指针 |
| --- | --- | --- | --- | --- |
| 组一：P1 | 无前置 | v15 副本由 P1 独占；P3、P4 只读其最终字节 | P1 交回后进组二、组三 | `spec.md` 的 AC-C11-001；P1「Done」 |
| 组一：P2 | 无前置；与 P1 不同工作副本 | 载体由 P2 独占；P5 只读其最终字节 | P2 交回后进组三 | `spec.md` 的 AC-C11-002、AC-C11-007；P2「Done」 |
| 组二：P3 | P1 最终字节；与 P4 互斥 | 只读 v15；写自己的证据目录 | P3 交回后进组三 | `spec.md` 的 AC-C11-003、AC-C11-004；P3「Done」 |
| 组二：P4 | P1 最终字节；与 P3 互斥 | 只读 v15；写自己的证据目录 | P4 交回后进组三 | `spec.md` 的 AC-C11-006；P4「Done」 |
| 组三：P5 | P1、P2 已交回 | 只读两处；写 `c11-p5-*` | P5 交回后进组四 | `spec.md` 的 AC-C11-005；P5「Done」 |
| 组四：P6 | P1–P5 已交回 | 只写 `c11-closeout-index.md` 与 `c11-p6-readback.md` | P6「验收 Phase 才能做的检查」 | `spec.md` 的全部 AC；P6「Done」 |

P3 的采集结论因 P5 修复而失效时，在最终字节上重采后才进组四；不另建重跑 Phase。
命令、oracle、证据、Task 正文与执行状态只在各自 Phase/任务事实，不在本节另存。
