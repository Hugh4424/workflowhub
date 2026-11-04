# Phase 索引 — 质量优先的规划方法改造与 PaperBuilder 规划 PRD 重写

> 指向各 Phase 独立权威的纯指针。由 Phase 标题重新生成；本文件没有实现或完成权威。
> 每个 `phases/P<n>.md` 恰好一行；从实际 Phase 契约头读取引用与字段，替换示例编号与路径。
> 核对的是实际指针可读与职责，不以 hash/认证 readback 判完成。

本类 P0 是 `Execution Index` 的有效 Phase 指针及其实际契约头导航字段。
不得承载正文，不复制判据。
必要输入、结果、命令/oracle、原件位置及停止/回滚/完成条件均留在所指 Phase 的正文与机器字段块。

逐项状态细项写在所引用且已存在的 Phase/Task 正文。
written 指向已写内容；not-applicable 写不适用理由和依据；deferred 写责任卡、触发条件、受影响结果。
沿该 Phase 的正文、任务卡与机器字段块回读这些说明，必要 P0 标题保留。
index 只提供现有权威引用与语义锚点导航，不复制状态正文，不新增状态列。

引用的 Phase 文件缺失或不可读时，如实报告该具体缺口，交原材料 owner 补齐后再建立有效指针。
不得用 not-applicable 或 deferred 掩盖缺文件。
已有正文内的状态说明也不代表执行进度或质量结论。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-写计划的方法.md` | `这一 Phase 交出什么？` | `workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`tests/contract/acceptance-plan.test.mjs`；`tests/contract/n11-acceptance-rules.test.mjs`；`tests/contract/n11-plan-quality.test.mjs` | `none` | build-code 的开发、测试、审查三个独立上下文；P4 的提交与覆盖核对 |
| `P2` | `phases/P2-写PRD的方法.md` | `这一 Phase 交出什么？` | `workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；`skills/spec-prd/SKILL.md`；`skills/spec-prd/templates/prd-template.md`；`skills/catalog.yaml`；`tests/contract/prd-card-shape.test.mjs` | `P1` | PRD 作者与 build-prd 协调者；P3 的重写者；P4 的提交与覆盖核对 |
| `P3` | `phases/P3-重写规划PRD.md` | `这一 Phase 交出什么？` | none（跨仓交付） | `P2` | 用户与 P4 |
| `P4` | `phases/P4-终末验收.md` | `这一 Phase 交出什么？` | none（只读终末验收） | `P1`、`P2`、`P3` | 用户与后续维护者 |

pre cohort 的旧任务卡只读保留，在本文件中没有有效行。

## 并行与合并导航（人读指针）

四个 Phase 严格串行：P1 → P2 → P3 → P4，不设并行批次；每步等上一步交回后开始。
从 spec 的「实现设计（全局权威）」「谁先谁后？」及各 Phase 的「每个文件由谁改，先做什么？」取得实际分组。
导航只引用这些权威。

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末 AC 指针 |
| --- | --- | --- | --- | --- |
| 组一：P1 | 无前置，先做 | 无共享路径；P1 独占 7 条 | P1 交回后进组二 | spec Appendix A 的 AC-BP-001…008 与 AC-MIG-001；P1「Done」 |
| 组二：P2 | 等 P1 交回；不并行 | 无共享路径；P2 独占 6 条 | P2 交回后进组三 | spec Appendix A 的 AC-PRD-001…004 与 AC-MIG-002；P2「Done」 |
| 组三：P3 | 等 P2 交回；不并行 | 无共享仓内路径；P3 写集为空，外部新件由 P3 独占 | P3 交回后进组四 | spec Appendix A 的 AC-PB-001…006；P3「Done」 |
| 组四：P4 | 等 P1、P2、P3 交回；串行 | 无共享路径；P4 只读，不改任何文件 | 终末验收 | spec Appendix A 的全部 28 条 AC；P4「Done」 |

真实并行组出现重叠路径时，回 spec 与原 Phase owner 改成有实际依赖的串行，再更新本导航。
冲突回原 writer。
命令、oracle、证据、Task 正文与执行状态只在各自 Phase/任务事实，不在本节另存。
