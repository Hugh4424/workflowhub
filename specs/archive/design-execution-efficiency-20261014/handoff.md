# make-decision 阶段交接 · design-execution-efficiency-20261014

本件是 make-decision 阶段末的**人读交接**（step 15），是当前材料与 task facts 的派生视图。**不含质量结论、不是工作许可证、不替代任何原件**；决定权威在 decision-log。

## 1. 任务身份

| 项 | 值 |
| --- | --- |
| 任务 | `design-execution-efficiency-20261014`（WorkflowHub 自身：让设计出的任务更合理、执行更高质量更高效率） |
| 认证 worktree | `/Users/Hugh/Hugh/Project/workflowhub-design-execution-efficiency-20261014` |
| 分支 | `task/workflowhub/design-execution-efficiency-20261014`（基线 `b66c134856a3b7aa13c7115b4e9a1df04dad1914`） |
| 任务库根 | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/design-execution-efficiency-20261014` |
| 任务类型 | **普通任务**（D-029：会产出真实改动；不预先分批，实施拆分交给 build-plan 按 phase 决定） |
| 上游需求源 | 本任务库 `quality/evidence/raw-requirements/2026-10-14-design-execution-efficiency.md`（用户逐字，sha256 `dd0625840f1867f7…`） |

## 2. 背景与目标

WorkflowHub 的规则几乎只约束「诚实」（不假绿、不丢来源、不自审），**没有一条约束「规模」**。病例（PaperBuilder CARD-05，只读，仍在运行）因此出现：入口规模分诊从未执行、切分依据由文件所有权而非交付单元决定、端到端判据押在依赖链末端、证据只增不减 —— 机器满负荷 50+ 小时仍在返工。

目标：**让代价在人为边界上看得见，让不收敛有终止条件**。不加门禁、不加数字阈值、不加校验器、不加账本。

## 3. 当前阶段与状态

- 阶段：`make-decision`。**状态：决策已由用户确认**（step 13；确认原件见第 6 块；因记录性写入改变材料字节，确认件已按现行做法重录）。
- 完成情况：step 1–15 全部执行 —— 调研（5 份病例诊断 + R-A 外部调研含 R5 复核 + R-B 前作/历史对照 + V1/V2 两次补充核实）、Talk batch-01…batch-12、**方向审查与细节审查各一次**、grill（覆盖矩阵五类 + 四项退出检查全 pass）、术语表更新与两份 ADR、两轮只读一致性核对。
- **下一阶段 = `build-plan`**。

## 4. 材料与原件

| 材料 | 位置 | 说明 |
| --- | --- | --- |
| decision-log（唯一主材料） | `specs/design-execution-efficiency-20261014/decision-log.md` | 需求、决定 D-001…D-030、7 模块、23 行定序写集表、15 条 AC、未决项、风险、外置索引 |
| 术语表 | `GLOSSARY.md`（worktree） | 更新「写集与 owner」；新增「可独立交付验收单元」「带欠账完成」 |
| 两份 ADR | `docs/adr/0038-…`、`docs/adr/0039-…` | 切分依据、证据范围；各含「三项判据」节 |
| 用户逐字需求 | 任务库 `quality/evidence/raw-requirements/2026-10-14-…md` | 唯一原件 |
| Talk 批次 | 任务库 `quality/evidence/decision-log-refs/talk-batches.md` | batch-01…batch-12（逐字答复） |
| U 变更记录 | 任务库 `…/decision-log-refs/requirement-change-log.md` | U-001…U-003 |
| 审查回执与处置 | 任务库 `quality/reviews/2026-10-14-007-…direction.json`、`…-014-…detail.json`；处置 `…/decision-log-refs/review-dispositions.md` | 方向 21 条→8 问题；细节 22 条→11 问题 |
| 调研与诊断 | 任务库 `…/decision-log-refs/case-diagnosis/`（D1–D5、R-A、R-A-r5、R-B、V1、V2 + `repro/`） | 唯一原件 |
| 模块设计 | 任务库 `…/decision-log-refs/module-design/`（M1–M6） | 六份唯一原件 |
| 覆盖矩阵 | 任务库 `…/decision-log-refs/coverage-matrix-5d.md` | 13 行（R-001…R-010 + U-001…U-003） |
| canonical 调研 | 任务库 `…/decision-log-refs/research.md` | `research_id` = RES-EF-01 |

## 5. 已做 / 未做（如实）

**已做**：需求逐字固化；内外部调研；五段方向地图与修订后大纲；P1–P8 病因清单（含权重为**具名推断**）；七模块逐个收敛（D-012…D-030）；方向审查与细节审查各一次并逐条处置；grill 四项退出检查；术语表与 ADR；两轮只读一致性核对；用户确认。

**未做 / 未确认边界（具名缺口）**：
- 前作 29 条未闭合 AC 的**逐条分类清单**未产出 ⇒ 移交 build-plan（AC-013，判据与产物位置已写，owner = build-plan 主会话）。
- 两处运行时改动（`tools/cli/stage-runtime.mjs` 复用支路、`runtime/review/review-record-route.mjs` 去重与记录身份）的**针对性验证**未执行 ⇒ 属 build-code。
- 干跑重演对比本身未执行（属 build-plan/build-code 的验证载体）。
- 病例（PaperBuilder）侧数字未由本任务回读，保持 D1–D5／V1／V2 原件口径。

## 6. 用户确认

- 确认原件（生效件）：任务库 `quality/evidence/human-confirmations/`（001 号记录答复当时材料；因记录性写入改变字节，已按现行做法重录，见同目录 SUPERSEDED 说明）。
- 用户逐字答复：「**确认，可以往下走（推荐）**」；同批另一题「M7 范围」答复「**保留收窄后的三项（推荐）**」⇒ D-030。

## 7. 风险与延期

| 内容 | 触发与后果 | 处理阶段与 owner |
| --- | --- | --- |
| M5 证明范围改为「路径 + hash」后，工作树被改动即无法再核内容 | 可核性下降 | 已限定三类必须附字节的例外；无法确立内容相等时记 `unknown`（D-021／D-022） |
| M4 停机措辞被读成限并发／轮次／按时长停 | 撞用户逐字否决 | 已用**适用范围排除**钉死（D-027） |
| 前作 29 条 AC 逐条清单缺失 | 前作判定继续悬挂 | AC-013 移交 build-plan |
| 权重为具名推断而非证据 | 被当作实测结论引用 | 已在主文标注来源与口径 |

## 8. 质量边界

材料、实施、测试、独立审查与 Git 交付**分别报告**。两次审查的 6 路 provider **均未报告 read-confirmed**（覆盖全为 undetermined）⇒ 审查事实是「收到建议」，不是「证明读懂」；方向审查为 `available-with-failures`，**不得记为通过**。本轮主会话自身三处错误已纠正记档（43 个目录 vs 重试 43 次；把合同条文当现场事实；自造 `E1–E4`／`C9–C11` 编号）。

## 9. 下游下一步（build-plan）

1. 产出 `spec.md`（含 `## Appendix A` 与 15 条 AC 同号）与独立 `phases/P<n>.md` + 纯指针 `phases/index.md`。
2. 按 **M2 的 R1–R5** 分解：边界由「可独立交付验收单元」决定、写集只作申报、批次内互斥、跨批次依赖定序；补上 S1–S4 的「何时应当并」。
3. 承接 **AC-013**（前作 29 条 AC 的逐条分类清单）。
4. 每条 AC 标注判定方式（机器可判／只能人读／需真实环境+用户在场）；需真实环境的不得排在依赖链末端当 gate。
5. 不得新增门禁、数字阈值、校验器或账本；不缩减审查并发或轮次；不按任何时长停止审查。
