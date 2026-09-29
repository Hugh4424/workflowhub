# 功能规格：thin-core CARD-04「真实验收与有条件 TDD」兑现

- Card: CARD-04
- Slug: workflowhub-thin-core-card-04-20260919
- 日期: 2026-09-19
- 状态: D-009..D-014 六项质量方向及 D-015 补做三项旧缺口的方向已有真实用户选择；2026-09-27 对 P2/P3/P6 作了精确同任务材料修订，局部代码/测试结果与当前材料分开核。P5/T008 真实报告、P6/T012 动态夹具、P10/P11 消费者及 P13 最终交付仍未完成。新版材料的独立审查、正式 build-plan 确认及当前 build-code 阶段事实尚待办理；旧确认、历史评审、预置 RED 或局部 GREEN 均不等于相位/整卡验收通过。
- 上游: 母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（CARD-04 卡面 `:322-351`、FR-16..FR-21 `:328-333`、AC-16..AC-21 `:335-340`、SD-05/06/07/08/15/17 `:45-95`）、本卡 `specs/workflowhub-thin-core-card-04-20260919/decision-log.md`（D-001..D-008 与旧确认 `:1758-1770` 为历史；R-009..R-018、D-009..D-014 详案及方向确认 `:2159-2408`；D-015 记录用户选择补做 AC-17/18/19，具体样例和新版材料确认另核）
- 路线: post cohort（build-spec 历史只读，唯一 authoring 链 = build-plan）
- 本规格角色: 需求与行为唯一权威；`phases/index.md` 与 `phases/P*.md` 只做相位/任务编排

## 材料导航

| 章节 | 摘要 | 读取时机 |
|------|------|----------|
| 本规格（`specs/workflowhub-thin-core-card-04-20260919/spec.md`） | 需求与行为唯一权威（母 PRD 保真需求 + 本卡扩展项 + 实现设计） | spec-specify / spec-plan / spec-analyze 全程 |
| 决策日志（`specs/workflowhub-thin-core-card-04-20260919/decision-log.md`） | D-001..D-008 历史裁决；R-009..R-018 与 D-009..D-014 新增六项方向、详细机制及 `:2404-2408` 的限定确认 | read-current-materials 与全部下游步骤 |
| 母 PRD（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`） | CARD-04 卡面、FR-16..FR-21、AC-16..AC-21 与共享定义 SD-05/06/07/08/15/17 的权威原文 | 核对需求保真与验收口径时 |
| 执行索引（`specs/workflowhub-thin-core-card-04-20260919/phases/index.md`） | 相位指针表（无 oracle 细节） | spec-plan 之后、build-code 入口 |
| 相位规格（`specs/workflowhub-thin-core-card-04-20260919/phases/P1.md` .. `P13.md`） | P1..P7 旧范围保留；P5/T008 仅中途检查点，P8..P12 为新增功能相位，P13/T024 在 P11/P12 后负责 D-005 独立最终聚合与原样聊天交付。相位文件/任务已编写、有限 RED 已取得，但 P6/T012 动态夹具报告缺失 G2、P10/P11 消费者/受保护接线与最终 P13 GREEN 均未解决；仍待正式审查和新 build-plan 人工确认 | build-code 逐相位执行须先核对最新获确认材料 |
| 入口索引（`ENTRYPOINT.md`、`TASKS.md`） | 仓库级入口 | 任何阶段定位真实入口 |

## 速读卡（30 秒）

| 问题 | 答案 |
|------|------|
| 解决什么 | 旧 FR-16..FR-28 保持原貌；新增 D-009..D-014 六项质量结果：build-plan 基于原需求/变化/业务知识规划跨 feature 用例与 Task/Phase 分层 oracle，build-code 按可信实际变更与项目业务关系、独立库存自动选测实跑逐例对账并闭环修复，verify-code 独立语义/依赖/置信/风险抽样及授权者业务验收；旧 P1..P7 不足以证明新增结果 |
| 谁受影响 | 阶段编排使用者（stage-runtime / stage-runner 的读者与维护者）、后续 CARD（CARD-05/07/10）的验收呈现消费者 |
| 核心用法 | 旧范围通过 stage-runtime 阶段报告与定向 vitest 查既有事实；新增 B2 须从可信 Task 起点与代码快照自动选安全定向目标，实际 runner 逐例对账并交 verify-code 独立语义和授权者确认，绝不以 `npx vitest run` 无范围全量或旧报告代替 |
| 关键约束 | 零新依赖、无新 stage/gate/CI/第二份执行账本；旧 detail 审查 #33 的「不新增验收」限于当时 D-001..D-008 范围，新增 FR/AC-29..34 是本轮明确确认的新需求；本次只写本规格，不授权 build-code 或受保护写面；保持 `task_ids`/`review_ref` 与校验器禁写边界，必要修改另行请示 |
| 主要风险 | CARD-05 在 HEAD `35a881ac` 尚未证明落地，旧 P1..P7 阶段事实不可推出新 B2 能力；任务起点丢失、已提交改动不可见、库与独立库存同时遗漏、真实 UI 消费者/官方逐 AC 接线缺失均不能宣称全绿 |

## 来源与决策映射

| 来源 | 决策 | 结果需求 | 验收标准 |
|------|------|----------|----------|
| CARD-04-LOCAL-001（用户原话「我要的不是流程正确，而是质量合格」；见 `decision-log.md:24-26`） | D-001 只接回真实事实给人看；D-003 三样落点复用已有载体 | FR-16、FR-17（政策背景） | AC-16；AC-17 权限 oracle 仍 incomplete，本行仅支持政策语义 |
| CARD-04-LOCAL-002（验收链造假/呈现失真类反馈；本卡实现问题，非上游 R 编号） | D-003 空 `evidence_refs` 接回真实引用；D-004 没做到两分 | FR-18、FR-21 | AC-18、AC-21 |
| CARD-04-LOCAL-003（测试体系缺口反馈；本卡实现问题，非上游 R 编号） | D-002 post 材料检查收窄及两侧回归；D-007 的数字修正另记 LOCAL-006/LEGACY-BASELINE | FR-18、FR-19（遗留回归支持，不单独达成母卡验收） | AC-18、AC-19 均仍 incomplete；本地回归不满足 AC-20 路线证据要求 |
| CARD-04-LOCAL-004（流程纪律反馈；本卡旧交付安排，非上游 R 编号） | D-005 报告聊天交付 + 不对称压缩；P5/T008 中途事实与 P13/T024 最终独立叙述分开 | FR-21 | AC-21 |
| CARD-04-LOCAL-005（真实入口联通；本卡入口库存缺口，非上游 R 编号） | D-006 入口显式库存 | FR-21 | AC-21 |
| CARD-04-LOCAL-006（覆盖率/预算只诊断；本卡基线缺口，非上游 R 编号） | D-007 数字修正 + 负控 | 本地复杂度基线修正义务（无独立 FR） | 无；T004 不满足 AC-20 |
| CARD-04-LOCAL-007（流程纪律；本卡规则/ADR 落地顺序，非上游 R 编号） | D-008 落地顺序：规则落点 build-plan、ADR 随 build 入库 | FR-16、FR-19 | AC-16、AC-19 |
| CARD-04-LOCAL-008（用户 clarifications；CLARIFY-BP-001，非上游 R 编号） | CLARIFY-BP-001 甲裁定：runtime/ 就近共置（仅测试组织支持，不证明读写/隐藏权限） | 支持性策略工作，不是 AC-17 验收 oracle | AC-17 仍 incomplete；就近共置任务不得作为通过证据 |
| CARD-04-LEGACY-BASELINE（本卡旧基线事实失真：复杂度基线数字与实测不符；非上游 R 编号） | D-007 基线数字修正 + 负控 | 本地复杂度基线修正义务（无独立 FR） | 无；T004 不满足 AC-20 |
| R-009 | 本轮 U-6 六项；D-009..D-014 | FR-29..FR-34 | AC-29..AC-34 |
| R-010 | CARD-04 六项完成责任，CARD-05 不新增改动；D-009 | FR-29 | AC-29 |
| R-011、R-013、R-014 | 项目统一用例库、原位测试引用、仓库版本化及有限种子；D-010 | FR-30 | AC-30 |
| R-012 | 交付面/风险适用、同任务旧证据保留；D-012/D-013 | FR-32/FR-33 | AC-32/AC-33 |
| R-015、R-016 | 可失败自动代码检查、连接运行服务的真实浏览器（设备特性另需物理设备）；D-011/D-012 | FR-31/FR-32 | AC-31/AC-32 |
| R-017 | verify-code 现有最终确认；D-014 | FR-34 | AC-34 |
| R-018 | CARD-05 落地后仅可提出受保护写面最小方案并另行审查，非已获改码许可；D-009/D-012 | FR-29/FR-32 | AC-29/AC-32 |

> `CARD-04-LOCAL-001..008` 与 `CARD-04-LEGACY-BASELINE` 仅标记本规格的历史解读/实现缺口，**不是** `decision-log.md:62-83` 原始需求表的 R 编号，也不顶替 P6/T010 上游覆盖账本。真正的 `R-001..R-008` 仅按该原始需求表读取：依次是母 PRD CARD-04 卡面、共享定义、母 decision-log OI-004、两条用户体系化测试诉求、七层外部基准、用户工作流纪律及返工根因追问；本表本地行并非其逐条对应关系。`R-009..R-018` **只**指 `decision-log.md:74-83,2181-2190` 本轮来源；旧相位文件中的同形标签是历史文本，不应反读为本轮六项交付。

原始来源对照（按 `decision-log.md:66-73` 原表语义，而非上方本地标签推断；仅指需求落点，不宣称对应 AC 已通过）：

| 原始来源 | 原表实际内容 | 对应本规格需求/验收落点 |
|------|------|------|
| R-001 | 母 PRD CARD-04 卡面：可执行验收、oracle 分离、有效 RED、路线适用产物、真实执行 | FR/AC-16..21 |
| R-002 | 母 PRD 共享定义 SD-05/06/13/15/17；其中 SD-13 是 build-prd 两个命名可检查交付项，不是「验收五段式」（原表误引，见本卡 decision-log 末尾勘误） | SD-05 → FR/AC-21、23；SD-06 → FR/AC-18、19；SD-15 → FR/AC-20；SD-17 → FR/AC-32、§2.3；SD-13 的 CARD-10/CARD-02 执行责任不映射为本卡 AC；本卡可执行验收另据母 PRD :322-340 与母 decision-log OI-004 |
| R-003 | 母任务 OI-004：真实入口、oracle 分离、RED、机器产物与技能实跑 | FR/AC-16..21 |
| R-004 | 用户体系化验收/单测/E2E 诉求（m00006） | FR/AC-16、20、21；FR/AC-23 |
| R-005 | 用户体系化验收/单测/E2E 诉求（m00314） | FR/AC-16、20、21；FR/AC-23 |
| R-006 | 外部七层防御基准（覆盖率建议不作为本卡硬门） | FR/AC-17、20、21；§2.3 覆盖率只诊断 |
| R-007 | 用户工作流纪律：从 make-decision 开始且不跳阶段 | §2.1 四阶段顺序；§12.3 历史/新增授权边界 |
| R-008 | 用户追问验收/Task/Phase 测试缺口与返工根因 | FR/AC-16、18、19、21；新增 FR/AC-31..33 的质量目标（不将旧反馈冒充本轮授权） |

## 上游覆盖账本

本节分母取本卡 `decision-log.md` 的 `deriveDecisionLogOriginalSourceCensus` 原始条目与索引条目，再并入正文实际出现的 D/AC/OI/SD/OPEN 编号；逐行列原编号、原意与**本规格的落点或尚缺事实**。下列 FR/AC、Phase/Task 是需求及计划的定位，不是测试执行、build-plan 确认、生产写入许可或通过证明。`not_done owner=...` 说明待落实的责任及原因，不会因结构检查变绿而变成已完成。U-006 的六个 atom 保留原句对应关系，不以汇总行代替；本地 `CARD-04-LOCAL-*` 不占上游 R 空间。此账本只用于人核对，不新增推进门。

| 上游编号 | 原始含义与来源 | 规格落点 / 如实未完成项 |
| --- | --- | --- |
| U-001 | 原 U-1：项目测试体系、真实验收、避免零散堆测试；decision-log :2418-2420 | R-004 → FR-16、FR-20、FR-21；新 FR-30/AC-30 的项目 case 索引仍未交付，not_done owner=CARD-04 build-code |
| U-002 | 原 U-2：card-04 的完整单测与端到端测试诉求；:2422-2424 | R-005 → FR-16、FR-20、FR-23；FR-30/AC-30、P8/T017 是新增范围的规划而非实绩 |
| U-003 | 原 U-3：返工取证、Task/Phase 验收与测试质量；:2426-2428 | R-008 → FR-16、FR-31、AC-31；P10/T020 尚需可实施 oracle，not_done owner=CARD-04 build-plan |
| U-004 | 原 U-4：主会话仅规划、派发与交互；:2430-2432 | R-007 → §2.1 阶段纪律及 §2.3 授权边界；P13/T024 的独立叙述是计划，P5/T008 仅中途事实检查点，不声称已执行最终交付 |
| U-005 | 原 U-5：card-07 Phase 细节丢失及未获同意提前 build-code 的历史反馈；:2434-2437 | R-007 → §2.1、§12.3；P8..P13 的 authoring 不等于人工确认，not_done owner=CARD-04 build-plan 主会话 |
| U-006-01 | U-6 第 1 句：build-plan 用原始需求、变化、业务知识产复用用例和验收；:2441/:2452 | D-010/D-011 → FR-30/FR-31、AC-30/AC-31、P8/T017/P10/T020；业务库与真实 oracle 未交付 |
| U-006-02 | U-6 第 2 句：build-code 对实现代码做单元/代码/接口/UI 实机测试；:2442/:2453 | D-012 → FR-32/AC-32、P9/T018/P11/T022；真实服务/浏览器接线未证，not_done owner=CARD-04 build-code |
| U-006-03 | U-6 第 3 句：实测证据对照验收并判结构与风险；:2443/:2454 | D-013 → FR-33/AC-33、P10/T021；逐例原件与结构判断未产，not_done owner=CARD-04 build-code |
| U-006-04 | U-6 第 4 句：问题修复、重验、用例及证据更新；:2444/:2455 | D-013 → FR-33/AC-33、P10/T021；旧失败及新快照复测未产，not_done owner=CARD-04 build-code |
| U-006-05 | U-6 第 5 句：每 Task 三层/每 Phase 四层、技能/产物/通过标准；:2445/:2456 | D-011 → FR-31/AC-31、P10/T020；真实消费者及可失败目标待核，not_done owner=CARD-04 build-plan |
| U-006-06 | U-6 第 6 句：verify-code 语义/外依赖/置信/风险与人工验收；:2446/:2457 | D-014 → FR-34/AC-34、P12/T023；授权者实际答复未发生，not_done owner=CARD-04 verify-code |
| V-001 | 用户质量准绳「我要的不是流程正确，而是质量合格」；:26/:2490 | R-008 → §1.1、FR-31..FR-34/AC-31..AC-34；绿色测试不能替代业务判真 |
| R-001 | 母 PRD CARD-04 卡面；原始需求表 :66 | §5 FR-16..FR-21、Appendix A AC-16..AC-21；旧权威定义照原文保留 |
| R-002 | 原表 :67 引用母 PRD SD-05/06/13/15/17，其中 SD-13 误称「验收五段式」；按母 PRD :77-79 及本卡 decision-log 末尾勘误解读 | SD-05/06/15/17 → SD 各行所列 FR/AC、§2.3 不增推进门；SD-13 两项由 CARD-10/CARD-02 执行，本卡不冒领；AC-17..19 现按 D-015 补做且未完成，见对应行 |
| R-003 | 母 decision-log OI-004 验收可执行及真实入口；:68 | FR-16..FR-21、AC-16..AC-21；FR-23/AC-23 的真实 CLI E2E 仍待实跑 |
| R-004 | 用户体系化测试诉求（m00006）；:69 | U-001 → FR-16、FR-20、FR-23；FR-30/AC-30 尚未交付 |
| R-005 | 用户再强调测试体系化（m00314）；:70 | U-002 → FR-16、FR-20、FR-23；不能用规则文档替代项目案例库 |
| R-006 | 外部七层参考，覆盖率非本卡硬门；:71 | §2.3、DER-04/FR-20、AC-20；外部建议不冒充用户批准的 >95% 门 |
| R-007 | 工作流与不跳阶段纪律；:72 | U-004/U-005 → §2.1、§12.3；新 build-plan 人工确认尚缺 |
| R-008 | 用户追问返工根因及 Task/Phase 验收；:73 | U-003/V-001 → FR-16、FR-31..FR-33、AC-31..AC-33 |
| R-009 | 本轮六项用户原话索引；:74，atom 见 :2452-2457 | U-006-01..06 → D-009..D-014、FR-29..FR-34/AC-29..AC-34；尚未实施 |
| R-010 | CARD-04 负责六项、CARD-05 不要求新增改动；:75 | D-009 → FR-29/AC-29、§12.2；不把未落地 CARD-05 当交付 |
| R-011 | 每项目统一可复用用例库；:76 | D-010 → FR-30/AC-30、P8/T017；未建库，not_done owner=CARD-04 build-code |
| R-012 | 风险/交付面适用，旧证据保留并同任务复测；:77 | D-012/D-013 → FR-32/FR-33、AC-32/AC-33；尚无执行原件 |
| R-013 | 项目索引引用原位测试、任务质量事实留实跑结果；:78 | D-010 → FR-30/AC-30、§6.1；索引不充当第二执行账本 |
| R-014 | 仓库版本化唯一库、有限初始覆盖；:79 | D-010 → FR-30/AC-30、P8/T017；旧项目行为未盘点保持 unknown |
| R-015 | 「代码测试」指可失败自动检查，人工 review 分列；:80 | D-011/D-012 → FR-31/FR-32、AC-31/AC-32；尚无实测通过事实 |
| R-016 | 「UI 实机」指真实浏览器连真实服务，设备特性另需物理设备；:81 | D-011/D-012 → FR-32/AC-32、P11/T022；真实接线未证，not_done owner=CARD-04 build-code |
| R-017 | 既有 verify-code 最后槽位做授权业务验收；:82 | D-014 → FR-34/AC-34、P12/T023；尚无授权者接受事实 |
| R-018 | 仅可在 CARD-05 落地且负控证明必要后提出最小受保护写面方案；:83 | FR-29/FR-32、AC-29/AC-32、§12.2；非生产写入许可，not_done owner=CARD-04 提案及单独审查 |
| D-001 | 逐条链仅接真实事实，接受链仍 incomplete；§决定 :1139 | §5.1 DER-10、FR-21/AC-21、P4/T006；不伪填 task_ids/review_ref |
| D-002 | post cohort/旧生产收窄测试债；§决定 :1170 | FR-19/AC-19、P3/T005、§2.1；旧 G-2 豁免不冒充已解除 |
| D-003 | 逐 AC 真实证据接回；§决定 :1201 | FR-21/AC-21、P4/T006；已算出的引用与真实执行仍待 build-code 接线 |
| D-004 | 机器状态与声明两分、失败事实直陈；§决定 :1227 | FR-26/FR-27、AC-26/AC-27、P5/T007/P7/T015；不是新许可 |
| D-005 | 两份阶段末交付与坏消息优先；§5.1 DER-06 | FR-21/AC-21、P5/T007/T008 中途检查点、P13/T024 最终独立聚合/聊天叙述；真实交付尚待阶段执行 |
| D-006 | 真实入口清单及跨卡接口；§5.1 DER-07/08 | FR-23/AC-23、P1/T002/P6/T012；CI 接线不在本卡 |
| D-007 | 测试资产规则及数字真值，预算/覆盖率仅诊断；§5.1 DER-01..04 | P1/T001 承载规则文档；P2/T004 仅修正本地复杂度基线数字，不满足 AC-20；AC-20 的适用/N/A 路线产物仍依其专属报告事实与最终聚合核验 |
| D-008 | 规则落 build-plan、ADR 随 build 入库；§5.1 DER-01 | FR-16/AC-16、P1/T001/T003；这是顺序而非落地事实 |
| D-009 | 六项由本卡负责、保护写面条件；decision-log :2237 后详案 | FR-29/AC-29、P8/T017；未获生产写入许可 |
| D-010 | 一份项目级业务 case 索引加独立库存；:2237 后详案 | FR-30/AC-30、P8/T017/P9/T019；未盘点旧业务记 unknown |
| D-011 | Task/Phase 层级矩阵与可失败业务 oracle；:2237 后详案 | FR-31/AC-31、P10/T020；当前测试 seam 不可合法 GREEN，not_done owner=CARD-04 build-plan |
| D-012 | 可信变化自动选安全定向目标并实跑适用层；:2237 后详案 | FR-32/AC-32、P9/T018/P11/T022；P9 起点仅有本地限定验证，正式自动入口/服务未证明 |
| D-013 | runner 身份逐例/AC/结构/风险对账，旧新证据并存；:2237 后详案 | FR-33/AC-33、P10/T021；尚无真实执行原件 |
| D-014 | 独立语义抽样与既有最终人工确认；:2237 后详案 | FR-34/AC-34、P12/T023；实际抽样/授权回复未发生 |
| AC-16 | 原母卡可执行验收形式；decision-log :1415 | FR-16、Appendix A AC-16、P1/T001；本卡材料仅是样本，不是全仓验收通过 |
| AC-17 | 原母卡 oracle 与实现者权限隔离；:1416 | FR-17、Appendix A AC-17；D-015 补做的只读/隐藏真实受限实施者**窄样例**已由 P6/T025 独立复核认可；P6 与整卡仍 incomplete，verify-code 最终核验 |
| AC-18 | 原母卡有效 RED→GREEN；:1417 | FR-18、Appendix A AC-18；D-015 补做的同字节测试先红→绿→故障再红**窄样例**已由 P6/T026 独立复核认可；当前整项回归与 P6 仍 incomplete，verify-code 最终核验 |
| AC-19 | 原母卡 G-2 豁免可失败检查或披露；:1418 | FR-19、Appendix A AC-19；独立纯文档 Task 的可失败检查**样例层**经 P6/T027 独立复核成立；样例 Task 交付/关闭、P6 与整卡仍 incomplete，verify-code 最终核验 |
| AC-20 | 原母卡路线适用机器产物与真实命令证据；:1419 | FR-20、Appendix A AC-20、P5/T007；N/A 须说明理由，非实跑声明 |
| AC-21 | 原母卡测试/验收技能真正执行、真入口先于完成宣称；:1420 | FR-21、Appendix A AC-21、P5/T008/P6/T012/P13/T024；P6/T012 动态夹具报告缺失 G2，真跑及最终交付仍待核 |
| OI-001 | 返工取证充分性与单源盲区；:151-160 | D-007、§12.3；单一来源计数未复算，not_done owner=CARD-04 verify-code |
| OI-002 | 窄卡面与体系化边界；:164-174 | D-001..D-008、§2.3；六项新增边界另见 FR-29/AC-29 |
| OI-003 | 完整单测/E2E 的可度量目标；:178-188 | D-007、FR-20/AC-20；新增业务 case 覆盖另见 FR-30/AC-30，未宣称全面完整 |
| OI-004 | 可执行 AC 写法与不完整披露；:192-202 | D-003/D-008、FR-16/AC-16、DER-11 |
| OI-005 | oracle 隔离在单 worktree 的能力限制；:206-216 | FR-17/FR-24、AC-17/AC-24、§12.3；宿主级隔离未建，not_done owner=CARD-04 verify-code |
| OI-006 | 有效 RED 与 G-2 豁免；:220-229 | D-004/D-005、FR-18/FR-19、AC-18/AC-19；不可得记 unavailable |
| OI-007 | 缺适用产物是否机器阻断（原提问被取代）；:233-242 | FR-20/AC-20、§2.3；事实如实呈现，非推进失败门 |
| OI-008 | 模块/层级落点与测试资产淤积；:246-256 | D-007、DER-01、P1/T001；B2 case 索引另见 FR-30/AC-30 |
| OI-009 | 覆盖率测量及硬门取舍；:260-269 | D-007、DER-04、§2.3；仅诊断，不承诺阈值 |
| OI-010 | 防测试膨胀、命名/预算/退役；:274-284 | D-007、DER-03/14、P1/T001；预算不拦 |
| OI-011 | 验收失败是否阻断；:288-298 | D-005、§验收流程；坏消息置顶而非新门 |
| OI-012 | 本卡 AC 的异源判定与真执行；:302-311 | D-003/D-006、AC-21、§12.3；独立判定者未建立，not_done owner=CARD-04 verify-code |
| OI-013 | E2E 入口和 CARD-10 总集成分界；:315-325 | D-006、FR-23/AC-23、P6/T012；CI/总集成非本卡 |
| OI-014 | 走完整流程时可回读逐 AC 视图；:329-338 | D-005、FR-21/AC-21、P5/T008 中途视图与 P13/T024 最终逐项聚合 |
| OI-015 | 状态不能把 unverified 写成 succeeded；:342-351 | D-004、FR-26/FR-27、AC-26/AC-27、P7/T015 |
| OI-016 | 缺适用产物、伪证、只绿无红等失败清单；:355-365 | D-004/D-005、§验收流程；事实不充当新 gate |
| OI-017 | 与兄弟卡及排除项边界仍开放；:369-379 | §2.3、§9、OPEN-006；跨卡冻结待裁决，not_done owner=CARD-04 build-plan + CARD-05/07/10 |
| OI-018 | 后置 CI、存量迁移等，oracle 分离不后置；:383-392 | DER-04/09、FR-24/AC-24、§12.3；CI not_done owner=后续集成卡 |
| OI-019 | 项目跨 feature 的稳定业务回归索引；:396-405 | D-010、FR-30/AC-30、P8/T017；尚未建立，not_done owner=CARD-04 build-code |
| OI-020 | 绿色测试掩盖业务错及复测覆盖旧证据；:409-418 | D-013、FR-33/AC-33、P10/T021；尚无执行结果 |
| OI-021 | 六项质量结果责任归 CARD-04；:422-431 | D-009、FR-29/AC-29、§12.2；CARD-05 不追加改动 |
| OI-022 | 项目索引/原位测试/spec 与任务事实分工；:435-444 | D-010、FR-30/AC-30、§6.1；真实索引和反查库存未交付 |
| OI-023 | UI/API/外依赖何时适用及环境不可用；:448-457 | D-012、FR-32/AC-32、P11/T022；无法连接服务记 unknown/unavailable |
| OI-024 | 旧行为未盘点和 CARD-05 实际差量；:461-470 | FR-29/FR-30、AC-29/AC-30、§12.2；旧行为 unknown，CARD-05 落库待核 |
| OPEN-001 | 卡面窄范围与体系范围，历史已收敛；:2148 | OI-002、§2.3、FR-29/AC-29 新增范围另列 |
| OPEN-002 | 全面单测/E2E 数值与分摊，历史已收敛为仅诊断；:2149 | OI-003/OI-009、DER-03/04；非全绿声明 |
| OPEN-003 | oracle 分离可行形态，历史记录已收敛；:2150 | OI-005、FR-24/AC-24、§12.3；宿主隔离残余 not_done owner=CARD-04 verify-code |
| OPEN-004 | 覆盖率及 ADR 0027，历史已收敛；:2151 | OI-009、DER-04；覆盖率非硬门 |
| OPEN-005 | 失败事实与推进阻断点，历史已收敛；:2152 | OI-011、§验收流程；记录缺口不挡阶段推进 |
| OPEN-006 | CARD-05/07/10 接口冻结次序，原表仍开放；:2153 | OI-017、§9 DER-08 提案；跨卡确认未取得，not_done owner=CARD-04 build-plan + CARD-05/07/10 |
| OPEN-007 | UI applicability 与收敛检查的历史补写项；:2154 | D-002 之后的 `decision-log.md:1816-1860` 已据真实答复补写两节；原表「仍开放」是历史状态，不沿用为现状 |
| OPEN-008 | pre 形态缺口，原表已被 post 决定取代；:2155 | D-002、§2.1；历史保留，不重建 pre 支线 |
| SD-03 | 原始共享状态窄词表，被 OI-015 引用；decision-log :346 | FR-26/FR-27、AC-26/AC-27、§7；不把不可用写通过 |
| SD-05 | 真实入口联通实跑才可宣称整体完成；原始需求 :67 | FR-21/FR-23、AC-21/AC-23、P6/T012、P13/T024；T012 动态夹具报告缺失仍 G2，P13 不得因此宣称整体完成 |
| SD-06 | 有效 RED/G-2 豁免；原始需求 :67 | FR-18/FR-19、AC-18/AC-19、P3/T005；环境错不算 RED |
| SD-13 | 母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:77-79`：build-prd 两个命名可检查交付项——具体重构验收标准（可观察成功/失败用例、所需证据、承接负责人，CARD-10 执行）；可测量的「无重复契约」标准（一事实一权威文件、不得两文件分别宣称同一事实的权威，CARD-02 执行）。本卡原始需求 :67 的「验收五段式」系误引 | 本卡不冒领两项的执行/通过事实；FR-16/AC-16、DER-11 的可执行验收依据另见母 PRD :322-340 与母 decision-log OI-004 :258-272，非 SD-13 |
| SD-15 | 质量事实不作推进许可证；原始需求 :67 | FR-20/AC-20、§2.3、§验收流程；失败事实保留 |
| SD-17 | 零新增机器门禁、哈希/回执不作推进资格；原始需求 :67 | FR-32/AC-32、§2.3、§架构边界；可信快照只供测试真实性对账 |

## 1. 需求解释：问题与紧迫性

### 1.1 一句话需求

母 PRD 的 FR/AC-16..21 与此前用户裁定的 FR/AC-22..28 原样保留；本轮已确认 D-009..D-014 对应的 FR/AC-29..34 另要求项目级业务 case 与独立库存、Task/Phase 分层可失败 oracle、可信变更驱动的自动安全选测及真实分层执行、逐例/AC/结构/风险对账和同任务留痕复测，并在 verify-code 独立语义抽样后由授权者作业务验收。旧范围把 oracle 分离、有效 RED/G-2、路线适用机器产物及真实执行事实落成仓库可回读材料，§5.1 收口旧 build-plan owner 未决项；旧材料/已写 P8..P13（含仅目标 RED 的最终聚合）尚不证明新增六项已实施、已确认新 build-plan 或获受保护写面许可。

### 1.2 历史本地解读（非原始需求 R 编号；原始 R 表见 `decision-log.md:62-83`）

- CARD-04-LOCAL-001：用户原话（`decision-log.md:24,26`；`:24`=纠偏引语、`:26`=准绳引语）「我要的不是流程正确，而是质量合格」——验收标准须可执行、验收走真实入口实跑、单测与端到端测试须体系化、覆盖率只诊断不作门。
- CARD-04-LOCAL-002：验收呈现层失真——`runtime/stage/stage-runner.mjs` 的 build-code 验收链行把 `source_ids`/`decision_ids`/`fr_ids`/`evidence_refs` 写死为空，而 `runtime/stage/stage-handlers.mjs:1696` 已算出真实证据引用。
- CARD-04-LOCAL-003：历史测试体系缺口——`tools/cli/stage-runtime.mjs` 材料检查收窄（post 下 make-decision/build-plan 缺 `spec.md` 不再抛错）随 make-decision 落入工作区时缺回归测试；当前 build-plan 已预置冻结的 P3 两侧回归测试，尚须未来真实 canonical 两版证据核验才可认定 G-2 豁免解除。历史 HEAD 的 `runtime/` 无就近单测，当前 build-plan 已预置 P4/P5 的两份就近测试；预置不等于生产实现或 GREEN。
- CARD-04-LEGACY-BASELINE：本卡历史基线事实缺口（曾被误绑为原始 R 编号，按独立审查 G-04 已脱钩）——published 复杂度基线 `formal_test_lines.actual=20292` 与旧时实测 76664、冻结测试目标修订后实测 76666、2026-09-26 合并 CARD-05 后当前实测 83996，均与 20292 严重不符（当前超上限约 7.0 倍），且断言口径是「与 git HEAD 不可变」而非「数字为真」。
- CARD-04-LOCAL-005：真实入口库存缺失——仓库没有一份显式列出真实入口、点名间接入口、点名未跑过入口的文档。
- CARD-04-LOCAL-006：复杂度预算只报不拦的口径需写进账本与断言，防止未来再出现「发布数字与实测脱节」。
- CARD-04-LOCAL-007：规则落点押后 build-plan（D-008），ADR-0032 为 D-008 当时拟号；合并后同号已占，本卡落库号为 ADR-0033。
- CARD-04-LOCAL-008：CLARIFY-BP-001 甲裁定——runtime/ 模块测试同目录就近共置（如 `runtime/stage/stage-runner.test.mjs`），须在 `vitest.config.mjs` include 加 `runtime/**/*.test.mjs`，不改依赖。
- R-009..R-018：本轮六项原文、项目统一用例库/真实测试与修复适用性、代码检查与真实浏览器、授权者验收时点及受保护写面限制，分别见 `decision-log.md:2163-2190`；D-009..D-014 的详细规则与失败反例见 `decision-log.md:2237-2287,2354-2408`。

### 1.3 情景示例

- U-001：维护者执行 `node tools/cli/stage-runtime.mjs run --action=execute --stage build-code`，阶段末报告逐条验收链行呈现真实的 `source_ids`/`decision_ids`/`fr_ids` 与真实 `evidence_refs`；做不到的部分在 `coverage_limits` 逐条披露，而不是静默留空。
- U-002：贡献者改坏了 post 材料检查收窄（例如又让 make-decision 缺 `spec.md` 抛错），`npx vitest run tests/contract/stage-runtime-material-check.test.mjs` 立即变红。
- U-003：读者打开 `docs/architecture/complexity-baseline.json`，看到的 `formal_test_lines.actual` 与同次冻结测试内 `buildReport()` 内存实测一致（目标断言编辑后 2026-09-23 为 76666，2026-09-26 合并 CARD-05 后当前为 83996；76664 与 76666 仅保留历史），且断言口径是「数字为真」而非「与 HEAD 不可变」；不为验证直接运行会覆写 JSON 的脚本。
- U-004：build-code 阶段末，用户拿到一份「命令/exit/output 路径 + 没做到逐条清单」的机器事实层与一段大白话叙述；每个结论都能按其来源路径回读到原始输出。

### 1.4 现有行为基线

- `runtime/stage/stage-runner.mjs:4116` `currentPostBuildCodeSpecAnalyze`（合并后锚点；合并前 :3876 已过期）内 `:4197-4214` 构建 acceptanceChain 行（合并前 :3930-3950 已过期），`source_ids: []`、`decision_ids: []`、`fr_ids: []`、`evidence_refs: []` 写死为空（合并前基线行为描述）。
- `tools/cli/stage-runtime.mjs`（工作区 +6−1）已收窄：post 下 make-decision/build-plan 缺 `spec.md` 不再抛错；post 下 build-code/verify-code 缺材料仍抛 `current task material missing or unreadable`。
- `docs/architecture/complexity-baseline.json:58-64` `formal_test_lines.actual=20292`，`tests/contract/repository-inventory.test.mjs:175` 断言 published == git HEAD bytes。
- 历史 HEAD 基线：`vitest.config.mjs`（仓库根）include 覆盖 `core/scripts/tests/specs/skills/workflows/build-code/__tests__`，原先不含 `runtime/` 且 HEAD 的 `runtime/` 下无 `.test.mjs`。当前 build-plan 工作树已把 `runtime/**/*.test.mjs` 追加进 include，并预置 `runtime/stage/stage-runner.test.mjs`、`runtime/stage/stage-end-report.test.mjs` 为只读冻结测试；这只是测试收集面，不证明生产实现或 GREEN（见 §5.1 DER-02）。

### 1.5 与母 PRD 的保真声明（SD-09 逐字双层）

- **权威层**：本规格 §5 的 FR-16..FR-21 与 Appendix A 的 AC-16..AC-21 均照母 PRD `prd.md:328-333`、`:335-340` 原样引入，不改写、不窄化、不换语义。
- **历史扩展层**：旧方向的落地选择以 `DER-01..DER-14` 列在 §5.1；当时 detail 审查 #33 的「非新验收条目」仅约束 D-001..D-008 的旧范围，不覆盖用户本轮明确确认的六项新结果。2026-09-23 另有用户裁定的 FR/AC-22..28 保持原样；本轮 FR-29..34 在 §5 顶层、AC-29..34 在 Appendix A 独立标为新增质量结果，不伪称母 PRD 原文。
- **偏离与更正（SD-09「接受但有偏离」的写明义务）**：本规格上一版本把 FR-16..FR-21 / AC-16..AC-21 重述成与本卡工作同名的条目（例如把「复杂度基线数字为真」写进 FR-20/AC-20、把「stage-runtime 收窄」写进 FR-19/AC-19），与母 PRD 原文语义不符。改了什么：§5 与 Appendix A 全部回改为母 PRD 原文；为什么：build-plan 的职责是翻译与落地，不是重定义卡片验收标准；改名后的本卡工作仍全部保留，只是重新挂到正确的 FR/AC 上（映射见 `### Requirement-to-Task Trace`）。

## 2. 背景、目标与范围

### 2.1 背景

CARD-04 仍走 thin-core 四阶段（make-decision → build-plan → build-code → verify-code）。旧 make-decision D-001..D-008 与 P1..P7 是历史范围；用户在 `decision-log.md:2404-2408` 另确认 D-009..D-014 六项质量方向，仅允许据此修订 spec/phases，尚未确认新 build-plan、授权 build-code 或受保护生产写面。本规格是需求/行为输入权威，但本轮新增的执行设计、真实消费者和相位任务尚待核查，不能称已实现。

### 2.2 用户价值与系统价值

- 用户价值（旧范围）：阶段末报告给人的事实有真实出处；没做到的事逐条点名。新增 B2 价值：不让人承担日常挑测试、运行与查漏；对已登记业务关系自动选测实跑和逐例复核，漏掉、错绑、不可用与未盘点均明确可见，最终业务语义交独立审查及授权者。
- 系统价值（旧范围）：G-2 豁免可失败检查、基线数字/断言口径一致、规则与入口/报告事实层。新增 B2：一份项目级业务索引 + 独立发现库存 + 可信快照 + canonical 原始证据构成窄接口，不新增 stage/gate/执行账本。

### 2.3 目标与非目标

目标：

- acceptanceChain 行接回真实 `source_ids`/`decision_ids`/`fr_ids`/`evidence_refs` 与逐 AC 执行事实、`coverage_limits` 必填披露（D-001/D-003/D-004）。
- stage-runtime 收窄两侧回归测试（D-002 遗留义务，G-2 豁免解除）。
- 复杂度基线数字修正 + 断言口径联动（D-007）。
- 测试资产规则文档（含命名、矩阵、provenance、路线适用、统计口径）+ 真实入口库存文档（D-006/D-007）。
- 阶段末报告事实层与交付管线定下（D-005 未决 ①②③）。
- D-008 当时决定 ADR-0032 随 build 入库；编号与 CARD-05 碰撞后，本卡以 ADR-0033 落库，方向与时机不变。
- 本轮新增 B2：由真实源码快照/业务关系/独立库存自动定向跑适用层并逐 case/AC/结构/风险对账、同任务修复复测旧新原件保留；build-plan 预设真实 oracle、Task 三层与 Phase 四层/跨任务路径，verify-code 作独立风险语义抽查与既有授权者最终验收（FR-29..34），不是仅美化阶段末报告。

非目标：

- 不碰校验器判定逻辑、不碰 CARD-05 占有的 `task_ids`/`review_ref` 字段语义（D-001）。
- 旧 detail 审查 #33 的「不新增验收条目」仅限此前 D-001..D-008 的翻译范围；后来用户确认 FR/AC-29..34 新增。AC-17/18/19 的旧「乙」选择保留历史，但 D-015 已明确改为补做真实样例；三项现有各自的窄样例或样例层独立复核原件，范围见 P6/T025–T027。P6、当前整项回归和整卡仍需分别核，不借样例抹掉其它缺口。
- 不做 CARD-10 集成验收（D-006）；不做 CI 接线（DER-09）。
- 不引入任何新依赖；不用 vitest 2.1.9 之外的测试框架（D-007）。
- 不把覆盖率/复杂度预算变成硬门（只诊断、只报不拦）。
- 不重新引入哈希绑定、回执、快照、材料身份校验类**推进机器门禁**（SD-17、OI-013）；D-012/D-013 需要既有任务事实的起点/当前快照/原始输出/receipt 对账作为测试真实性证据，不能因禁门而省去证据，也不能反向将证据升级为新许可。
- 旧 P1..P7 不重写 stage-runner 报告整体架构，也不改 `runtime/stage/stage-handoff.mjs` 的形状；新增 B2 的实际消费者须先探明，不能预断为零生产接线。本轮只修改本规格；CARD-05 在 HEAD `35a881ac` 未证明落地，受保护 `runtime/stage/**`/`runtime/review/**` 等写面须先满足 R-018 的落地核验与失败负控，再另请最小权限和独立审查；不是本次授权。
- 不新增 stage、gate、CI、依赖或第二份真相；不以新用例索引重写任务 canonical 执行记录，亦不将人工选测当永久兜底。

### 2.4 利益相关者与使用方式

- 阶段编排使用者：通过 stage-runtime CLI 读取阶段末报告。
- 后续 CARD 作者：消费规则文档与入口库存，复用 acceptanceChain 与报告事实层约定。
- 维护者：改动 post 材料检查时被 P3 回归测试保护。

### 2.5 平台与兼容性约束

- Node 22+ 是项目兼容性目标；ESM；零新依赖；vitest 2.1.9 钉住。分相位运行环境门仅为证据采集约束，不自动提高项目最低支持版本：P2 明确要求 Node `>=24.14.0 <25`/npm `>=11.9.0 <12`，P6 也检查 Node `>=24.14.0 <25`。因此当前计划不证明这些 gate 或整卡在 Node 22 上通过；Node 22 全量兼容性仍未验证，须另有获批的 22.x 验证证据或明确调整兼容目标，不能以 P2/P6 环境门替代支持政策。
- `vitest.config.mjs` 只允许加 include 条目 `runtime/**/*.test.mjs`，不改其它配置。
- 既有 `tests/**/*.test.mjs` 收集行为不变（runtime/ 现无测试，加 include 对现有套件零影响）。
- 报告事实层以新文件承载，不改 `stage-handoff` 的既有 schema（归档兼容面）。

## 3. 用户场景与状态覆盖

### 3.1 按优先级的真实用户流程

1. P0：维护者跑任意 post 阶段的 execute，阶段末报告验收链行呈现真实 ids 与证据引用，缺证据的 AC 在 `coverage_limits` 被逐条点名。
2. P0（旧计划历史表述）：只跑受影响的定向 vitest 目标（具体路径见 Global Verification Strategy）；此前写作 `npx vitest run` 无范围全量命令不符合当前 AGENTS.md 测试纪律，不能执行或视作新 B2 六项通过。
3. P1：新贡献者读 `docs/architecture/test-asset-governance-rules.md` 能回答「我的测试该放哪、叫什么、预算超了会怎样、oracle 该由谁产出、哪些机器产物这条路线不适用」。
4. P1：新贡献者读 `docs/architecture/real-entry-inventory.md` 能回答「仓库的真实入口有哪些、哪些是间接入口、哪些还没跑过」。
5. P1：build-code 阶段末，用户拿到机器事实层与独立子代理执笔的大白话叙述，坏消息逐条置顶。
6. P0（新增方向，未落地）：需求维护者登记来源与变更/业务规则、稳定 case 和真实消费者/测试入口，build-plan 为每个 Task 的单元/自动代码检查/接口与每个 Phase 的上述三层加真实浏览器 UI 写可失败 oracle、技能、环境/数据和跨 Task 旅程；没有关系的旧业务留 unknown。
7. P0（新增方向，未落地）：build-code 保有可信任务起点，已提交和暂存/脏/未跟踪产品改动都进入当前快照；由 agent 按 build-plan 逐 Task/Phase 预写的流程启动一次受控执行，再由业务关系和独立库存自动选安全定向目标，跑真实 runner 后核确切 case/AC/结构/风险与原件，失败在原任务修复并追加复测证据；空选或工具不可用不算绿。
8. P0（新增方向，未落地）：verify-code 独立按风险抽查「测试绿但业务错」与外部依赖，明确未抽样/低信心；系统事实与独立审查后用既有最终确认让获授权者据真实场景接受、拒绝或延期。

### 3.2 关键状态与异常覆盖

- 空：decision-log 无 D 条目 / spec 无 FR 定义行 → acceptanceChain 行对应字段为空数组并在 `coverage_limits` 披露（不得伪造）。
- 重复：decision-log 同一 D 条目出现多次 → 去重后接回，重复事实在 `coverage_limits` 披露。
- 权限/只读：OI-005 与旧「本卡不做物理隔离」是 D-015 之前的历史处置。AC-17 的真实受限实现者窄样例已由 P6/T025 独立复核认可：只读模式可读不可改，隐藏模式读不到被测内容；它只覆盖该 Task 被测路径/网关，不证明所有绕路封死、P6 或整卡完成（§12、P6/T025）。
- 部分完成：链仍判不完整被接受（D-001），不完整原因逐条进 `coverage_limits`（DER-10）。
- 审查通道：CARD-05 落地后 canonical wh-review 派发阻断（`REVIEW_HISTORY_UNAVAILABLE`）已消解；本卡 build-plan 合并审查已走 canonical wh-review（attempt `b0d645b6`，结果 available，15 findings 已全部处置）；历史 SD-08 独立替代审查轮次仍作为有效证据保留、不作废；若未来审查不可用则记 `unverified` 并如实披露（§12）。
- 新增 B2 反例：只有 `git diff HEAD` 丢失先前 committed 变更；case 库与测试入口库存同时遗漏；零条目标/只见 shell exit 0；后端改动漏掉页面消费者；fixture 冒充真实 UI；绿测试未击中业务反例；修复后覆盖旧失败或不重算选择；外部权限/环境不可用、reviewer 绿但授权者拒绝——一律显露具体 unknown/failed/unavailable 和 owner，不写全绿。

## 4. 产品事实与假设（PFACT）

| 编号 | 事实/假设 | 状态（选一种，删另一种） | 依据 / 影响 |
|------|-----------|--------------------------|-------------|
| PFACT-001 | `currentPostBuildCodeSpecAnalyze` 是私有函数，acceptanceChain 行构建位于 `runtime/stage/stage-runner.mjs:4197-4214`（合并后；合并前 :3930-3950 已过期） | 状态：已验证 | 直接读源核实；决定 T006 须提取可导出纯函数才能就近单测 |
| PFACT-002 | 工作区 `tools/cli/stage-runtime.mjs`（+6−1）即收窄后版本，HEAD 版本为未收窄旧版 | 状态：已验证 | `git diff` 与逐行读核实；决定 P3 RED 可对 HEAD 版本采集 |
| PFACT-003 | `formal_test_lines.actual` 的历史实测为 76664（测试目标编辑前）；冻结 `tests/contract/repository-inventory.test.mjs` 目标断言后的当前 `buildReport()` 内存实测为 83996（2026-09-26 合并 CARD-05 后 HEAD ef920f1f 复测，delta_from_target=73996；合并前 2026-09-23 为 76666/delta 66666，已转历史） | 状态：已验证（按所记快照；实施期若继续漂移须重测） | 历史 76664 系当时直接运行 `node tools/architecture/complexity-report.mjs` 捕获并恢复工作区（RESTORED-IDENTICAL），不可再称当前；P2/T004 精确 gate 对旧 published 20292 得到目标 RED（2026-09-23 `expected 20292 to be 76666`；2026-09-26 合并后复核 `expected 20292 to be 83996`，证据 `quality/evidence/prewritten-red/P2-T004-exact-gate-post-merge-red.txt`），内存 `buildReport()` 无覆写 JSON 副作用。83996 ÷ limit 12000 ≈ 7.00 倍；76666、76664、76,075/76,248 和「6.3 倍」均为历史不同口径，不冒充当前。JSON/caliber 实施时与当期实测同步，勿直接运行有覆写副作用的报告脚本 |
| PFACT-004 | `runtime/` 目录下当前无任何 `.test.mjs` 文件 | 状态：已验证 | glob 核实；加 include 对现有套件零影响 |
| PFACT-005 | `node tools/architecture/complexity-report.mjs` 直接运行会覆写 `docs/architecture/complexity-baseline.json`（写副作用） | 状态：已验证 | 实测中捕获并当场 `git checkout` 恢复；T004 设计须用「先修断言再修数字」顺序，避免再被覆写干扰 |
| PFACT-006 | acceptanceChain 的 `task_ids` 已由 CARD-05 真实派生（`runtime/stage/stage-runner.mjs:4142-4214`），`review_ref` 仍属 CARD-05 占位 | 状态：已验证 | decision-log D-001 裁决原文 + 合并后读源核实；本卡纯函数对 `task_ids` 只透传不改写、不回退为占位，`coverage_limits` 只披露 `review_ref` 占位 |
| PFACT-007 | D-005 的「机器事实层 + 独立子代理执笔的聊天叙述」须区分 P5 中途快照与 P13 最终交付 | 状态：已验证（设计分工，非完成事实） | 母 PRD `:341` 要求整体完成只在真实入口联通实跑后宣称；T007 是事实层纯转换器，当前已有本地 8/8 定向结果，正式同版审查仍待补；T008 blocked/not_done/G2，`T008-delivery.txt` 仅为冻结旧结构 gate 兼容名、最多本地未认证索引，不记录已认证来源或聊天交付；P13/T024 在 P11/P12 后独立聚合 P1..P12 并委派未参与实现者叙述、主会话原样贴出，三个最终文件另写 `quality/evidence/stage-quality/build-code/P13/`，不可凭 P5 或 P13 结构 GREEN 冒称整体完成 |
| PFACT-008 | 本任务 wh-review 曾在派发前被 `REVIEW_HISTORY_UNAVAILABLE` 阻断（评审历史兼容缺陷，非本卡可改）；CARD-05 落地后阻断已消解 | 状态：已验证 | 两次真实派发尝试（attempt `a6918125`、`f1b43aee`）均 blocked_before_dispatch（历史事实）；2026-09-26 合并后 build-plan 合并审查已走 canonical wh-review（attempt `b0d645b6`，结果 available，15 findings 已全部处置）；处置见 §12 |

## 5. 功能需求（母 PRD 权威，逐字引入）

- **FR-16**：每条验收标准具备条件→行为、可度量成功标准、≥1 条失败/边界场景；写不出的标 incomplete，不伪造。
- **FR-17**：验收 oracle 与实现者分离——测试目录对实现者只读或隐藏。
- **FR-18**：TDD 通过必要条件包含「改动前是红的」（有效 RED，SD-06）；环境故障/配置缺失/无意义断言不算 RED。
- **FR-19**：G-2 豁免必须补一条可失败检查或写明理由与风险并在验收中披露；不允许直接跳过。
- **FR-20**：机器产物按测试路线适用——硬要求=真实命令+exit+output+对应 oracle 证据；trace/JUnit/跳过计数等机器产物仅在该测试路线适用时必需，不适用时记 N/A+reason；「缺不适用产物」不得判失败，「缺适用产物或伪造产物」仍判失败；真实测试失败必须修复并复验后才可宣称对应功能完成（SD-15）。
- **FR-21**：测试与验收类技能被真实执行且执行事实被记录；「phase 全做完但一次真实验收都没做过」被禁止。
  本卡实施限制（不改母 PRD 原文）：P5/T008 的三文件只记录 P5 中途真实事实，独立叙述与原样聊天交付移交 P13/T024；P13 的聚合只有在核对 P1..P12 的实际 gate/Task/canonical 原件、并如实披露 P6/T012、P10/P11 等缺口后才可交付，结构 GREEN 不等于 FR-21 全卡完成。
- **FR-22**：上游需求覆盖账本——decision-log 的原始来源普查产出的每一条来源编号（U/V）与每一条已裁决编号（R/D/AC/OI）必须在 `spec.md` 的「上游覆盖账本」中有逐条落点（FR/AC/Phase/Task/Oracle）；无法落点者如实记 `not_done` + owner + 理由，禁止静默删除、禁止用本地同名编号顶替上游编号。账本是给人核对的事实记录，不新增机器门禁（沿用 A-1「甲」裁定）。
- **FR-23**：真实入口端到端资产——必须存在以真实 CLI 入口驱动完整阶段链的 E2E 测试；断言只基于真实子进程的可观察输出；改动前 RED 已按目标条件采集；宿主能力不足时如实记 `unavailable`/`blocked`，禁止以 mock 冒充端到端、禁止把不可用写成通过。
  本卡实施限制（不改原 FR）：P6/T012 临时 fixture taskPath 的动态报告尚无真实发射者，P5/T008 工作树中途检查点不能代发；当前维持 not_done/G2，P13/T024 必须逐项揭示，不得据文件存在宣称 FR-23 已通过。
- **FR-24**：oracle 与实现者物理分离——验收期望值存放于实现者写集之外的只读镜像，并登记访问约定（谁可写、如何消费、如何覆盖）与残余限制；实现者不得读写 oracle 目录。
- **FR-25**：验收事实可读性——canonical 评审历史必须能被读取器读回，包括「成员 `unavailable` 而 pair 摘要记录当时可读字段」这类合法历史形态；不得把合法历史形态误判为记录损坏，真损坏仍须拒绝。
- **FR-26**：阶段末语义核查的诚实状态——上游来源普查的分母不得为零且诊断不得被吞；`missing`/`incomplete`/`unavailable` 不得被静默降级为 `deferred`；结果必须进入阶段末报告「没做到」清单。该要求只改事实呈现与状态诚实性，不新增门（`completion-predicates.mjs:108-116` 的 advisory 语义不变）。
- **FR-27**：验收结果机器判定类可表达性——D-004 的机器判定类取值（`missing`/`inconsistent`/`incomplete`/`unavailable`）必须能被验收事实校验器接受（白名单与拒绝消息点名全部允许值），且存储层不得把它们静默判为 `passed`（须映射为 `incomplete`）；`quality-fact.v1.status` 三值语义保持不变；既有验收事实记录字节不得变化。该要求只改**可表达性**，不改任何门禁语义，也不声称新值已在真实阶段产出。
- **FR-28**：上游来源普查的写入契约前置——decision-log 模板与相关技能文本必须要求 `## 需求变更记录`、`## 原始需求索引`、`## 逐字声明层（verbatim）` 三节及其行形态，使「按模板正确执行」即可产出分母非零的 decision-log；只对新卡生效，已发布与归档卡不回填；不新增 gating。

**本轮新增质量结果 FR-29..FR-34（D-009..D-014；以下与旧 FR-16..28 分列，不改旧权威原文；正式 §5.3 执行设计在 §5.2 后）：**

- **FR-29**（D-009，本卡结果责任）：CARD-04 对用户六项质量结果承担最终可验证的完成责任，不能以旧 P1..P7 的狭义呈现工作、CARD-05 尚未核实的交付、手工选测/查漏或仅有测试计划代替。CARD-05 无新增改动要求；先核其落地事实并仅补 CARD-04 必要差量。保留旧 D-001 的校验器、`task_ids`/`review_ref`、CARD-05 写面及 post 不双写约束；此方向不授权任何生产写入。逐项展示已实现、未实现、不可用和 owner；必要保护写面另请示，不把 B2 默降 B1。
- **FR-30**（D-010，项目用例与独立库存）：每项目**自己的仓库内唯一一份版本化业务用例索引**，持续关联原需求、变更和有来源/版本/owner 的业务规则，赋稳定 case ID、功能/受影响旧回归意图、正反/边界/恢复场景、数据/前提、可观察业务效果及反证、风险/环境、改动触发/实现接口/真实消费者/依赖、准确测试目标和预期运行身份、自动/确不可自动的人工步骤、适用与 stale/退役状态；spec/Phase/Task 引 case ID，测试实现仍在原目录，原始执行事实仍在任务质量记录。CARD-04 及受影响回归先种，其他旧行为标未盘点；需求/测试/消费者变化由项目需求与测试维护者更新，失效关系显式修订或退役保留原因。独立于本次 Task 自报的版本化测试发现与真实入口库存反查已登记目标/未关联资产；先验证可枚举性、来源/快照、owner、consumer 与退役规则。测试文件存在不证明业务依赖，两侧同步未登记和未盘点旧业务保持 unknown，不称无漏测；本库不是第二份执行账本或新门。
- **FR-31**（D-011，计划矩阵与 oracle）：build-plan 在本 spec 和唯一 Phase/Task 卡中形成原需求→业务规则/变化→复用功能/旧回归 case→FR/AC→Task/Phase→实际入口/目标/可观察 oracle 的双向关联，冲突来源和遗漏明确 unknown；每 case 给成功、失败、边界与受影响旧行为的具体业务现象、反例、运行身份、变更触发及 AC 判据。**每 Task 分别**规划单元、自动代码检查、接口三层；**每 Phase 分别**规划这三层和真实浏览器 UI 层，并独立规划跨 Task 接口/完整用户旅程，不把 Task 绿灯相加冒充 E2E。每层写适用性或有消费者证据的 N/A、拟用技能、环境/数据/精确目标与真实入口、拟留原始产物/观察、可失败的通过标准及风险；无工具/服务/可靠关系为 unavailable/unknown 而非 N/A。新行为 Task 的目标同命令有效 RED→GREEN，旧回归/非行为层不强造 RED；计划技能/预期结果绝非调用/通过事实。
- **FR-32**（D-012，可信变化驱动的安全自动执行）：build-code agent 参考 FR-31 各 Task/Phase 已写的流程和标准，启动一次固定可信的受控测试入口；这不是让人手工逐 case 选目标，也不声称任意 CLI 调用都机器强制自动分发。启动后工具必须对已实现代码以固定的**任务启动可信 commit/tree 与任务身份**为起点，对每个修复后的当前源码快照同时涵盖 committed、staged、dirty、应纳入的 untracked，记录可核序列及证据绑定；起点不可信、跨提交改动看不到或快照不匹配记 `unknown_change_scope`，干净 worktree 不等于零变化。实际差分 + FR-30 登记业务触发/消费者/依赖 + 独立测试/真实入口库存双向核对，自动选受影响 case、准确测试身份及**安全定向**目标；未映射产品差分、目标删除/改名/重复、已发现而未登记、选择空集或关系不可靠逐项未证明；双方从未登记的业务知识不能机器猜出。动态路径/标签不得直接拼 shell 字符串，须校验固定命令或安全 argv；按交付面与风险在 Task/Phase 实际运行适用的单元、可失败自动代码检查（类型/构建/静态规则/合同，人工 review 不可替代）、真实接口、业务效果和真实服务浏览器 UI（设备特性另需物理设备），记录服务/场景身份、原始截图/网络/控制台与 cleanup。后台变化若关联页面消费者亦可能触发 UI；fixture、仅前端 changed-files handler、普通 shell exit 0 或声明技能不能算 UI 实测。缺服务、browser adapter、接线或环境记 unknown/unavailable + 业务影响，不改报 N/A/pass；非适用层须有无相关消费者的依据。
- **FR-33**（D-013，逐例对账及同任务修复）：系统在每次当前快照执行中从 runner **实际报告**读取完整测试身份与状态（包括 skipped/todo/重复/0 tests），逐 case 对 FR-32 应测身份、适用层/技能、真实命令或步骤、数据/环境、预期业务正反效果与实际观察、exit、原始输出/hash、canonical receipt/快照、受影响 AC、**结构**（模块/接口/数据流/消费者/权限/恢复偏差）和残余风险对账，不能仅用命令绿色或实施者自报清单宣称业务通过；未选/未跑/失败/结果或原件缺失/陈旧/身份错绑/不可用/N/A 分清，缺适用证据不能 pass。任何行为缺陷、失败/不稳定、遗漏、失效 case/oracle、fixture/环境问题均保留旧失败原件、发现编号、归因、owner 与受影响 AC；任务关闭前修代码/用例/oracle/环境后以**新快照重算应测集**并跑受影响和邻近回归，追加新 receipt、逐例和 AC 判断及旧→新处置引用，不以最后一次绿色覆盖旧事实；未解为 failed/unknown，严重风险循现有修复/误报证明/授权接受。关闭后只记有 owner 的后续工作，不伪造 reopen；不造新推进状态机或限制同任务继续修复。
- **FR-34**（D-014，独立语义与现有人工确认）：verify-code 以原需求/痛点与规则版本→业务效果→case/AC→实际消费者与代码→系统应测/实测原件做**按风险选样的独立语义复核**：逐受影响 AC 保留机器事实，列已抽查与未抽查 ID，核 oracle 是否能识别「代码绿但业务错」、外部服务/版本/权限/真实或模拟/失败恢复、来源冲突与低置信假设、金钱/隐私/权限/不可逆/跨 Phase 高风险及残余 owner，不捏造统一置信度阈值；业务效果、测试语义充分性、代码 review 分开结论，不因 reviewer green 而给业务 pass。机器测试和独立审查后，在**既有 verify-code 最后授权确认槽位**交执行者/环境权限/数据/真实入口步骤/可观察正反及拒绝回滚标准/应回传证据/逐风险 owner 与接受或修复路径，记录授权者真实接受、拒绝或延期及证据；无回复、未测、审查不可用或环境不可用不记通过。人的职责是业务语义与确不能自动观察的剩余真实效果，不代系统日常选/跑/对账；不新增 stage、确认门或 CI。

本轮 FR-29..34 实施证据限制（不改上述需求）：P13/T024 聚合 P1..P12 的当前实际 gate/Task/canonical 来源与独立叙述，不替 P6/T012 动态 fixture E2E、P10 实际安全执行、P11 真浏览器或 P12 独立语义/授权事实背书；任何 G2、STOP、unknown/unavailable 继续明确列出，不因最终报告文件或聚合定向测试转绿而消失。

### 5.1 本卡扩展项（DER，非新验收；收口 owner=build-plan 的未决项）

| 编号 | 来源（未决项） | 处置（本卡落地方式） | 落点 |
|------|----------------|----------------------|------|
| DER-01 | D-007① 规则本身的逐条文本（MISSING — not established） | 写出逐条规则文本：验收标准可执行形式、oracle 分离、有效 RED 判据、G-2 豁免、机器产物按路线适用、真实入口联通、模块×层级矩阵、就近共置、命名规则、规模预算只报不拦、覆盖率只诊断、负控抽查、报告不对称压缩、provenance、统计口径、`coverage_limits`/`exceptions` 语义、报告事实层 | `docs/architecture/test-asset-governance-rules.md`（P1/T001） |
| DER-02 | D-007③ runtime/ 是否该有就近测试（原 owner=卡主） | 用户经 CLARIFY-BP-001 裁定「甲 就近共置」；`vitest.config.mjs` include 加 `runtime/**/*.test.mjs`；就近测试落 `runtime/stage/stage-runner.test.mjs`（P4）与 `runtime/stage/stage-end-report.test.mjs`（P5） | `vitest.config.mjs`、两个就近测试文件 |
| DER-03 | D-007② 单文件数字上限未商定 | 规则文档写「建议 500 行 target / 800 行 limit」，注明按 `tools/architecture/complexity-report.mjs:311-315` 类推；只报不拦，不设为门 | 规则文档对应节 |
| DER-04 | D-007④ runtime/ 与 tools/ 的覆盖率未知 | 覆盖率路线记 `N/A + reason`：未安装覆盖工具，且 D-007 零新依赖；如实进报告，不判失败（FR-20） | 规则文档 + 报告事实层 |
| DER-05 | D-004① `exceptions` 字段语义与允许值 | `exceptions` 属人写声明类：仅允许人事先声明并在验收中披露的非通过项，每项含理由与到期阶段；不得与机器判定类（`missing`/`inconsistent`/`incomplete`/`failed`/`unavailable`）互相顶替；`coverage_limits` 与 `exceptions` 空数组均不合法 | 规则文档对应节 + T006/T007 实现 |
| DER-06 | D-005①②③ 报告管线（能否机器渲染 / 归档兼容面 / 一台产物还是两台） | ③ 收口＝机器事实层（命令+exit+output 路径+逐 AC 路线适用+没做到清单）与独立子代理执笔、主会话原样贴出的聊天叙述两环节；① 机器只产事实/结构骨架，不执笔「简短的大白话」；② 仅在 T007 当前实现经同版独立审查、且 P5/T008 同次私有结果与独立来源认证单经核验后，P5/T008 才可于 P6 消费前落当时真实三文件中途检查点；当前 T007 已有本地 8/8 定向结果但未完成同版正式审查、T008 为 blocked/not_done/G2，`T008-delivery.txt` 旧名仅兼容冻结结构 gate、最多为本地未认证索引，绝非来源/快照收据；P13/T024 依赖 P11/P12 后从 P1..P12 canonical 原件另建最终 JSON/MD/交付 JSON 并在聊天原样贴叙述。两者不覆盖、不改 `stage-handoff` 形状，结构检查不等于业务全过 | `runtime/stage/stage-end-report.mjs`（P5/T007）、P5/T008 中途三文件、`quality/evidence/stage-quality/build-code/P13/{final-aggregate.json,final-aggregate.md,T024-delivery.json}`（P13/T024）+ 规则文档 |
| DER-07 | D-006① 入口清单文件名、结构与消费者 | 文件名 `docs/architecture/real-entry-inventory.md`；结构=三类入口（显式/间接/未跑过）×（命令/类型/证据/最后实跑）；消费者=verify-code、后续 CARD 与 CI 接线 | `docs/architecture/real-entry-inventory.md`（P1/T002） |
| DER-08 | D-006② 与 CARD-10 的接口冻结顺序（OPEN-006） | 本卡先冻结三项接口面：入口清单文件名与结构、acceptanceChain 行形状（含 `coverage_limits`）、报告事实层 schema；CARD-05/CARD-07/CARD-10 在其上对齐（先冻结方为集成责任方，SD-14） | 本规格 §9 + 三处落点 |
| DER-09 | D-006③ CI 接线（PR / stage 环境 / 生产） | 本卡不做，记 `N/A + reason`：仓库现状无 CI 配置文件；owner=后续卡 | 本规格 §12 覆盖限制清单 |
| DER-10 | D-001① `task_ids` 的最终满足方式、D-001③ 链长期判「不完整」是否可持续 | 裁定：post 无 `tasks.md`，`task_ids` 结构上无法由本卡满足（D-001 明确不改校验器）；CARD-05 合并后 `task_ids` 已由 `runtime/stage/stage-runner.mjs:4142-4214` 真实派生，本卡纯函数只透传不改写、不回退为占位；`review_ref` 仍属 CARD-05 占位，`coverage_limits` 只逐条披露 `review_ref` 占位；链在本卡之后仍判「不完整」被明确接受，可持续，本卡不追 | T006 实现 + 报告事实层 |
| DER-11 | AC-16 的全仓统计口径（make-decision 表记「待 build-plan 定」） | 统计口径=以 `specs/<task>/decision-log.md` 的验收标准表为样本集，命令 `node tools/cli/check-decision-log-chain.mjs specs/<task>/decision-log.md` 加逐条人工核对；本卡自身作为首个真实样本 | 规则文档对应节 |
| DER-12 | detail 审查 #37 / OI-005 provenance 字段（押后 build-plan） | 规则文档定义 provenance 记录字段：oracle 产出者、产出上下文、实现者可访问面（允许值 `只读` / `隐藏`）、是否建立独立判定者、未建立时如实标 `incomplete`；本卡实测形态与读写面缺口见 §12 覆盖限制 | 规则文档对应节 + 各相位卡 Boundary/DO NOT TOUCH 声明 |
| DER-13 | detail 审查 #25 / #35 per-AC 测试路线适用矩阵的承载字段 | 规则文档定义承载字段 `route_applicability`（`适用` 或 `不适用 + reason`）；报告事实层逐 AC 输出该字段 | 规则文档 + `runtime/stage/stage-end-report.mjs` |
| DER-14 | detail 审查 #29 单元测试命名规则（规则文本未成文） | 命名规则：就近共置 `<module>.test.mjs`；契约层 `tests/contract/<behavior>.test.mjs`；禁止以任务名/里程碑名命名测试文件 | 规则文档对应节 |

### 5.2 P6/P7 扩展项（用户 2026-09-23 两轮裁定，非母 PRD 新增验收）

| 编号（裁定登记 id） | 来源（用户裁定） | 处置（本卡落地方式） | 落点 |
| --- | --- | --- | --- |
| P6-A（`CARD-04-RULING-P6-FULL-EXEC`） | 「按 P6 全面执行」（根因追责答复） | 新增相位 P6：上游覆盖账本 + 普查分母修复 + 真实 E2E 落点 + 状态诚实化 + oracle 只读镜像；D-015 后另加 T025–T027 三项真实样例验收 | `phases/P6.md`（T009..T014、T025..T027） |
| P6-B | 「本卡内修复，我授权越界改 `runtime/review/**`」 | 同日第二轮曾让出给 CARD-05，属历史；CARD-05 落库后 d1 仍读不回，2026-09-27 本卡只接手 `review-record-route.mjs` 的有界历史 reader 修复，写入器不改、AC-25 仍 incomplete | `phases/P6.md`（T014 当前修订）+ §12.2/§12.3 |
| P6-C（`CARD-04-RULING-A4-E2E`） | 「真实 CLI 全链 E2E + 本卡内做只读镜像目录」 | 有界 E2E 资产（真实子进程）+ oracle 只读镜像（实现者写集之外）；覆盖范围以 T012 逐条断言为限 | `phases/P6.md`（T012/T011） |
| P6-D（`CARD-04-RULING-OVERLAP-YIELD`、`CARD-04-RULING-OVERLAP-RETRACT`） | 第二轮裁定 `overlap=甲`（让出重叠实现、只做互补部分）/ `sequence=CARD-05 先落库` / `a14=甲`（只做不冲突的面） | 当时让出大范围重叠实现，历史裁定原文保留；CARD-05 落地后遗留的 T013 零条目诊断/归档路径及 T014 d1 读回由本卡 2026-09-27 精确接手，写面限 P6 卡列出的三个文件，不接回 stage-runner/handlers 或全部 review 能力 | `phases/P6.md`（T013/T014 当前修订）+ §12.2/§12.3 |
| P6-E | `a2=乙`：保持 advisory，但结论强制入账 | `stage_end_spec_analyze` 的逐阶段判决必须作为 `not_done` 条目逐条进入阶段末报告事实层（生产者 P5/T007；消费者 T010 账本与 T013 核验），不改变 gating 语义 | `phases/P5.md`（T007）+ `phases/P6.md` |
| P6-F（`CARD-04-RULING-BP-CONFIRM-A69`） | `bp-confirm=乙` + `a-items=甲`：先补 A-6/A-9 的 owner 与修法登记，再发布 build-plan `human_confirmation`；四条增量项（A-6/A-7/A-8/A-9）全部带回 make-decision | 确认记录在 A-6/A-9 登记落盘后发布（§12.2 两行 + §12.3 ⑧⑭ 已补 owner 与实测证据）；`human-confirmation.v3` 绑定发布时的 `material_revision` 与 `snapshot_tree`，故任何后续材料编辑都会使其失效 | `spec.md` §12.2/§12.3 |
| P7-A（`CARD-04-RULING-A1-TRUTH`） | `a1=甲`：现在就升级枚举 | 新增相位 P7/T015：D-004 机器判定类取值在 `runtime/evidence/**` 与 `core/task-close.mjs`（预期零改动）内可表达且不被静默判 passed；生产者侧映射点留 CARD-05 落地后的跨卡工作 | `phases/P7.md`（T015） |
| P7-B（`CARD-04-RULING-A4-PRECONDITION`） | `a4=丙`：材料完整性要求形式前置 | 新增相位 P7/T016：decision-log 模板与两份技能文本补齐普查三节写入契约（只对新卡生效，不回填归档卡） | `phases/P7.md`（T016） |

### 5.3 新增结果与历史分界（D-009..D-014）

本轮 FR-29..34 在 §5 顶层定义，AC-29..34 在 Appendix A 单独增加；旧 §5.1/§5.2 DER 与 P6/P7 裁定仍是历史范围，不因这六项结果自动扩权。R-018 仅提供落地/负控之后另行提案的路径，不是 build-code 许可。

## 6. 模块划分

- `docs/architecture/test-asset-governance-rules.md`（NEW）：规则落点（DER-01/03/04/05/12/13/14）。
- `docs/architecture/real-entry-inventory.md`（NEW）：真实入口显式库存（DER-07）。
- `docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md`（入库）：决策记录。
- `docs/architecture/complexity-baseline.json`（MODIFY）：数字真相。
- `tests/contract/repository-inventory.test.mjs`（MODIFY）：断言口径联动。
- `tests/contract/stage-runtime-material-check.test.mjs`（NEW）：G-2 豁免解除回归（预置）。
- `runtime/stage/stage-runner.mjs`（MODIFY）：acceptanceChain 接回真实事实。
- `runtime/stage/stage-runner.test.mjs`（NEW，预置）：首个 runtime/ 就近共置单测。
- `runtime/stage/stage-end-report.mjs`（NEW）：阶段末报告事实层（DER-06/DER-13）。
- `runtime/stage/stage-end-report.test.mjs`（NEW，预置）：报告事实层就近单测。
- `vitest.config.mjs`（MODIFY）：include 加 `runtime/**/*.test.mjs`。

### 6.1 B2 增量职责/消费者登记（提案，不代表已建文件或获生产写面许可）

| 职责及逻辑接口 | 唯一 owner → 实际消费者 | 证据/替代/删除条件 |
|---|---|---|
| 每项目仓库内唯一版本化业务 case 索引（具体位置/模式由新相位裁决；不能改用多份 Task 账本） | 项目需求/测试维护者 → build-plan 关联矩阵、build-code 选择器、verify-code 语义复核 | 先登记 case 来源/版本/场景/风险/实现-消费者-依赖/精确测试目标；CARD-04 与受影响回归首批，其他旧行为未盘点；失效显式退役/替换；替代须有同等消费者及迁移核验 |
| 独立版本化测试发现 + 真实入口库存（不能只信 case 索引自身） | 测试资产维护者 → build-code 双向差分选择/零集合诊断、verify-code 未关联资产报告 | 真实 runner 枚举可行性、来源/快照、重复/零条目/退役规则先证实；已有 `docs/architecture/real-entry-inventory.md` 的旧入口文档可扩但不能冒充完整测试库存；替代须保留独立反查能力 |
| 任务起点/当前快照变更及选择-执行-逐例 reconciliation | build-code 当前 Task 会话及狭窄受信执行器 → canonical task quality facts 与 verify-code 只读消费；若需 `runtime/stage/**`，先按 R-018 单独授权 | 复用既有 task `facts.jsonl`、`quality/tests/`、`quality/evidence/`，不造第二账本/许可；起点绑定任务身份、commit/tree 与历次修复快照，记录 committed/staged/dirty/untracked 的真实产品差异；runner 身份、原始输出和旧→新证据保全；新机制只有真实消费者与负控后可实施，删除须迁移 canonical 原件 |
| 独立语义取样 + 既有 verify-code 最后人工确认消费 | 独立于实现者的 reviewer/verify-code → 获授权业务验收者 | 抽样与未抽样、外依赖、低置信、高风险及残余归属分列；人的接受/拒绝/延期回填既有槽位，不以新 UI/门/确认命令替代；如独立审查不可用则披露，不伪造通过 |

B2 是 case/库存/变更计算/执行对账/独立审查间的**窄接口**，不是「文档有索引 + 人从中挑测试」的 B1；生产代码路径、命令/schema 和删除条件须在 CARD-05 实际合并后的负控调查与后续 P8..P12 相位任务中落定。`runtime/stage/**`/`runtime/review/**` 为受保护范围，本次规格修订不触碰；老 §6 清单仅是 P1..P7 历史工作，不限制 B2 必需的新消费者。

## 7. 关键实体

- acceptanceChain 行：`{ ac, source_ids, decision_ids, fr_ids, task_ids, evidence_refs, review_ref, coverage_limits }`——本卡只填前三者与 `evidence_refs`、`coverage_limits`；`task_ids` 由 CARD-05 真实派生（`runtime/stage/stage-runner.mjs:4142-4214`），本卡纯函数只透传不改写、不回退为占位；`review_ref` 保持 CARD-05 占位，`coverage_limits` 只披露 `review_ref` 占位。
- 复杂度基线条目：`{ metric, limit, actual, 口径说明 }`。
- 真实入口条目：`{ 入口命令, 类型(显式/间接/未跑过), 证据, 最后实跑 }`。
- 报告事实层记录（`stage-end-report-facts.v1`）：`{ schema_version, not_done[], route_applicability[], executions[], coverage_limits[], exceptions[], sources[] }`；`not_done` 逐条含状态值、来源路径与一句话原因——**状态值只允许机器判定类五值**（`missing`/`inconsistent`/`incomplete`/`failed`/`unavailable`）；人写声明类（含 `deferred`、人工例外）只允许出现在 `exceptions` 与 `coverage_limits`，两处都不得借用机器判定类状态值，也不得把机器判定类写成声明（D-004/DER-05，detail 审查 #23 以此收口）。
- provenance 记录：`{ oracle_producer, producer_context, implementer_access(只读|隐藏), independent_judge_established }`。
- B2 业务 case（提案字段而非新增持久 schema）：`{ case_id, source_id, rule_version, feature, change_trigger, consumer_dependency, scenario_positive_negative_boundary_recovery, observable_oracle, test_target_identity, applicability, risk, owner, stale_retirement }`；实际命名由项目唯一版本化索引与阶段卡细化。独立库存是另一来源的测试身份/入口发现记录，不能与 case 索引互抄后自证完整。
- B2 Task 快照/逐例事实（复用现有 canonical quality 载体，不伪称字段已实现）：`{ task_id, trusted_start_commit_tree, current_snapshot, committed_staged_dirty_untracked, expected_case_ids, actual_runner_identities, case_ac_structure_risk_observation, raw_evidence_refs, prior_failure_refs, repair_and_retest_refs }`；无法可信定界即 `unknown_change_scope`。人工确认留 verify-code 既有最后槽位。
- P11/T022 同源浏览器质量投影（计划，未实现）：只扩现有 `acceptance_execution` 的 `stage-quality-evidence.v1.subject_fact`，添逐 case `ui_qa_projection`；每项绑定 Task、attempt、材料、snapshot、case/AC、browser 原件 ref/hash、真实结果与服务/API/DTO。`execution_items.status=executed` 只证执行发生，页面业务状态须从同一原始字节独立导出；缺/错原件或多 case 无唯一映射不得 pass。command/service-only 原件不强制该字段，旧原件只读。
- P13/T024 最终聚合（普通 build-code 报告、非第二账本）：`card04-final-aggregate.v1` 的 `phase_order` 恰 P1..P12、`phases[]` 逐个列原 phase `gate_cmd`/Task IDs/实际状态与来源；声称 passed 的 gate 须有当前命令、exit=0、runner 测试身份与可读原件 path/sha256，未证明者带 reason/owner，overall pass 只能由全部 Phase 和 Task 真实 pass 支持。`final-aggregate.md` 没做到置顶，`T024-delivery.json` 引最终 JSON/MD hash 并记录独立执笔者、原文和实际原样贴出；hash/自述只校对字节，不代替来源真实性、独立审查、业务判真或真人授权。

## 8. 数据和生命周期

- acceptanceChain 行：`currentPostBuildCodeSpecAnalyze` 在每次 build-code spec-analyze 中临时构建并传给分析器；当前公开 run 结果与现有质量事实不带完整链，不能事后从 status/游标拼回。P4 的本地改动让构建时从真实 spec/decision-log 提取，P5/T008 若需报告则必须在**同一次正式 run**的私有路径保留并认证该链。
- AC-26 分析器判决写入（2026-09-27 精确修订，尚未实施）：`currentPostBuildCodeSpecAnalyze` 已算出 `material_incomplete` 等原始判断；`publishStageEndSpecAnalyzeFact` 当前将它压为通用 `missing`。P6/T012 只对这条 subject 允许在 `runtime/stage/stage-runner.mjs` 传原始 `evidenceState` 并白名单映射验收结果：`material_incomplete→incomplete`、`inconsistent→inconsistent`、`unavailable→unavailable`，成功判断沿既有通过规则；`quality-fact.status="missing"` 与 advisory 非阻断语义不变。`summary.actual_outcome` 和 `subject_fact.evidence_state` 保留原判断词面；缺/伪分析值不得默认为 pass。泛用 `missing→deferred` 映射不改，旧验收记录/延期语义负控保留。独立验证见 P6 当前修订和只读根因原件，不能从 T013 局部 24/24 推断该生产修复已发生。
- 复杂度基线：历史 `node tools/architecture/complexity-report.mjs` 有覆写 published JSON 副作用。P2/T004 以测试内 `buildReport()` 当期值比较；2026-09-27 有界修订加入块外字节守卫、固定字段/target/limit 与动态 delta/within_limit/倍数。新测试自身增加 19 行后，当次实测 `actual=84015`、`delta=74015` 并取得局部目标 GREEN；更晚源码/测试变化仍须重新测量，不能把 84015 写成永恒真值或直接运行有副作用脚本。
- 报告事实层/中途检查点：P5/T007 三个纯导出已有本地 8/8，正式同版审查仍待补；其 `source_binding=unavailable` 诚实表示纯转换器不认证调用者。P5/T008 现行行为候选见下文 Interfaces 与 `phases/P5.md` 的 2026-09-27 修订：仅在真实 P5 作用域的**同一次** build-code run 成功发布阶段行和质量事实、并核当前 T007 测试/审查及任务/材料/快照后，可信 stage-runner 才可把该次 `stageResult` 确定序列化字节、临时链及原始 ref/hash 保存为内容寻址来源和独立认证单；P5 三文件只作中途索引/渲染。它们仍未生成，不能靠游标、文件存在或普通调用者声明报完成。该对象字节不是 CLI stdout；公共 CLI 的原始输出另留证据，不回写报告 ref 形成自引用。P6/T012 的 P1-only 夹具必须无 P5 报告，真实 P5 正例另核。P13/T024 仍独占全相位最终交付，不新增进度权威或推进门。
- 最终 D-005 交付：**P13/T024** 依赖 P11/P12（间接覆盖 P1..P10），独立读取当前 P1..P12 gate/Task 身份、canonical 原件与状态，写 `quality/evidence/stage-quality/build-code/P13/final-aggregate.json`、`final-aggregate.md`、`T024-delivery.json`；未通过项及 P6/T012、P10、P11 实际缺口置顶并标来源/影响/owner，不把 P5 检查点冒充最终状态。未参与实现的独立子代理按最终 JSON/MD 与原件指针写叙述，主会话原样贴出；交付 JSON 记录真实执笔身份、贴出时间、原文与未润色事实及 JSON/MD hash 引用。无法证实独立执笔/贴出则保持未交付，不伪填记录；报告结构 GREEN 不代表全卡业务、官方审查或授权者接受。
- 规则/入口文档：人写文档，随仓库演进由后续 CARD 维护。
- B2 新增生命周期（未落地）：项目 case 索引由项目维护者随原需求/变更/测试/消费者同步版本化更新，过时 case 保留 ID/退役原因与旧 evidence provenance；独立入口库存由独立发现来源更新并与索引双向校验，未知旧业务记 unknown。build-plan 仅写预期，build-code 每次修复后新快照重算并追加 runner 原件与 old→new 引用，verify-code 只读机器事实作独立语义抽样再通过现有最终槽位请求授权者确认；无新状态许可或双写账本。
- P11 浏览器同源生命周期（2026-09-27 材料计划）：现有 `acceptanceExecutionFacts → privateAcceptanceScenario` 是匹配 browser case 唯一 adapter 执行入口；build-code handler 两处分支先取同次结果，`controlledBrowserQaFacts` 从唯一 canonical 原件投影，不再重复执行。`publishVNextStage` 经现有 `publishAcceptanceQualityFact` 只把 `ui_qa_projection` 写进同份 `acceptance_execution` aggregate；`runtime/evidence/freshness.mjs#authenticateE2eExecutionStageQuality` 为 verify-code 的真实独立读者，重读原始 ref/hash 并与 `execution_items` 交叉核。`runOfficialStage` 公开返回不带 `facts.ui_qa`，不以新公共字段解决。旧 aggregate 原字节保留；当前 browser aggregate 缺投影不得认证通过，command/service-only 仍沿旧合同。真实后台→页面/API/DTO/服务链未核，页面适用性和浏览器业务效果继续 unknown。

## 9. 兼容性预留

- 后续 CARD 可在 acceptanceChain 行追加字段（如 CARD-05 填 `task_ids`/`review_ref`），本卡提取的纯函数签名保持稳定。
- 报告事实层预留字段扩展（`schema_version` 显式声明），不改变 `stage-handoff` 与既有权衡记录格式；该旧报告事实层不自动拥有 B2 的实际 runner 身份/逐例业务 oracle/同任务修复事实，新增消费者须先核对真实产物与需求再设计窄接口。
- 规则文档预留「模块×层级矩阵」扩展行；入口库存预留「未跑过入口」清零里程碑。
- 接口冻结顺序（DER-08）：本卡先冻结三处接口面——①入口清单文件名与结构（`docs/architecture/real-entry-inventory.md` 的三节结构）②acceptanceChain 行形状（`buildPostAcceptanceChainRows` 的返回字段）③报告事实层 schema（`stage-end-report-facts.v1`）；跨卡对齐方=CARD-05/CARD-07/CARD-10，其中 **CARD-10 登记为三处接口面的消费者**（在入口库存文档的消费者清单里点名），冻结顺序按 OPEN-006 交后续卡裁决。

## 10. 明确不做与默认必须成立

明确不做：见 2.3 非目标。
默认必须成立：

- 任何 acceptanceChain 行不得伪造 id 或证据；没有就空数组 + `coverage_limits` 逐条披露。
- `coverage_limits` 与 `exceptions` 空数组不合法——每个 build-code 至少写一条披露（D-004/DER-05）。
- 覆盖率/预算只诊断，永不拦流程。
- `unknown`/`unavailable`/`incomplete` 不得写成通过（SD-15）；审查不可用不得冒充已审（SD-08）。B2 索引/独立库存并非无穷业务真相；无可信任务起点、真实消费者、可枚举测试身份/可观察业务效果或宿主能力时写未证明项与归属，不可用 N/A 伪装，也不靠人为筛选冒充自动完成。

## 验收流程

1. 旧 AC-16..28 原判据不改；新增六条 AC-29..34 按 Appendix A 分别验收。真实入口实跑必须有可回读 runner 身份、适用层和业务观察；旧 stage-runtime CLI / vitest / node 断言脚本 / git 只是既有路径，不自动证明新 B2 结果。
2. 证据落 `quality/evidence/stage-quality/<stage>/`；缺适用证据的 AC 判 failed 并如实进「没做到」清单，但不阻断阶段推进（FR-20 + OPEN-005 分界）。
3. 合并审查：按 SD-07 ① 在 build-code 开工前执行一次，覆盖 spec 与 phase 文件；CARD-05 落地后 canonical wh-review 派发阻断已消解，本卡 build-plan 合并审查已走 canonical wh-review（attempt `b0d645b6`，结果 available，15 findings 已全部处置）；build-code 开工审查走 canonical wh-review（替代审查历史轮次仍作证据）；历史 SD-08 独立替代审查保留来源与缺口、不作废（§12）。
4. 分时报告（D-005）：P5/T007 纯转换器已局部实现并有 8/8 定向结果，但同版正式审查与 T008 来源接线未完成；P5/T008 当前 blocked/not_done/G2，仅在 T007 当前实现完成同版审查、P5/T008 同次私有结果及独立认证单通过审查后，才可重新定义真实中途检查点和来源记录（不生成最终叙述）；全部功能相位 P1..P12 的事实可观察后，由依赖 P11/P12 的 P13/T024 另产最终 JSON/MD/交付 JSON。最终叙述由未参与实现的独立子代理执笔、主会话原样贴出；坏消息逐条枚举置顶、好消息一行汇总。P6/T012、P10/P11 若仍 G2/STOP，不得因交付或文本合同 GREEN 冒称验收通过。

## 测试标准

- 旧 P1..P7 测试分布：契约层（`tests/contract`）为主，模块层（`runtime/` 就近）落地两例；新 B2 不继承「两例就够」：每 Task 分别规划单元、自动代码检查、接口，每 Phase 另加真实服务浏览器 UI 和跨 Task 旅程，按风险/消费者运行，明确可失败目标/技能/原始证据与适用性。
- 每个行为变化任务卡持有有效 RED 证据；文档任务卡持可失败断言脚本（FR-18/FR-19）。
- 命名：就近共置 `<module>.test.mjs`；契约层 `tests/contract/<behavior>.test.mjs`（DER-14）。
- 规模预算只报不拦；覆盖率只诊断（本卡覆盖率路线记 `N/A + reason`，DER-04）；负控抽查（植入缺陷须变红）。
- 预置测试在 build-plan 阶段写出并冻结进各卡 DO NOT TOUCH，provenance 依 DER-12 记录。

## 架构边界

- 旧 P1..P7 边界：不碰 `runtime/stage/stage-content-contracts.mjs` 校验逻辑；当时的 `tools/cli/stage-runtime.mjs` 收窄只补测试。CARD-05 持有的 `task_ids`/`review_ref` 与 review 写面、`runtime/stage/stage-handoff.mjs` 归档形状不可顺手改。
- 新方向实际需要的生产消费者不得被旧「不碰 stage-runner」文字隐性删除；**本轮无任何生产写授权**，CARD-05 在 HEAD `35a881ac` 尚未证明 landed，只有待其落地、失败负控证实受保护 `runtime/stage/**`/`runtime/review/**` 确为必要且有最小方案、owner、消费者与独立审查，才按 R-018 另行申请权限。不拿旧同日授权续用。
- SD-17 禁新增哈希/快照/回执**推进门禁**；可信任务起点、当前快照和 canonical 原始执行证据用于诚实对账，不是新 gate。

## 实现设计（全局权威）

### Code Anchors

- `runtime/stage/stage-runner.mjs:4116` `currentPostBuildCodeSpecAnalyze`（合并后锚点；合并前 :3876 已过期；acceptanceChain 行构建合并后 `:4197-4214`，合并前 `:3930-3950` 已过期；`boundEvidence` 合并后 `:4155-4185`；T006 提取纯函数 `buildPostAcceptanceChainRows` 并导出）。
- `runtime/stage/stage-handlers.mjs:1696`（已算好的真实证据引用，D-003 的接线来源）。
- `tools/cli/stage-runtime.mjs`（post 材料检查收窄，T005 的被测对象，DO NOT TOUCH）。
- `docs/architecture/complexity-baseline.json:58-64`（`formal_test_lines`，T004 数字修正）。
- `tests/contract/repository-inventory.test.mjs:175`（published==HEAD bytes 断言，T004 口径联动）。
- `runtime/stage/stage-end-report.mjs`（NEW，T007：`buildStageEndReportFacts` 与 `renderStageEndReport`）。
- `vitest.config.mjs`（include，T006/T007 依赖 `runtime/**/*.test.mjs`）。

### Interfaces and Failure Semantics

- `buildPostAcceptanceChainRows(输入)`：NEW 导出纯函数，入参含 spec 文本、decision-log 文本、逐 AC 执行事实、coverage 披露；返回 acceptanceChain 行数组。失败语义：任何字段无法从真实材料提取时返回空数组并往 `coverage_limits` 追加一条披露，绝不伪造；`coverage_limits` 为空时返回的行数组必须至少带一条披露（D-004）。
- `buildStageEndReportFacts({ chainRows, stageResult, evidenceIndex, declared })`：NEW 导出纯函数，入参含 acceptanceChain 行数组、stage 结果 JSON、证据索引、人写声明（`declared.routes` / `declared.limits` / `declared.exceptions`）；返回 `stage-end-report-facts.v1` 记录。失败语义：机器判定类五值（`missing`/`inconsistent`/`incomplete`/`failed`/`unavailable`）逐条枚举不清空、不总结；缺入参本身作为一条 `missing` 记录；人写声明类不得与机器判定类互相顶替；`coverage_limits` 与 `exceptions` 两数组都不允许为空（空即返回最少一条 `incomplete` 披露）。
- **P5/T007 当前审查补充（2026-09-27）**：正式 vNext `status`/`completion.missing` 与 `work_status`/`readiness.missing_materials` 的未完成原因必须逐项列入 `not_done`，`work_status=ready` 只表示材料齐备；逐 AC `evidence_refs` 的空对象/空 ref/无合法哈希不能被非空数组误作证据。旧八项测试没覆盖这些坏例，P5 当前修订允许保留旧字节后有界增测和修复。`exceptions` 空数组与真实人写声明的冲突正在等待用户选择；答复前不能制造例外、改写旧答复或称 T007 语义完成。
- `renderStageEndReport(facts)`：NEW 导出纯函数，把事实层渲染成 Markdown，三节固定顺序 `没做到` → `路线适用` → `执行事实`（节标题为冻结测试断言的字面量），每条结论挂来源路径；`facts` 为空对象或 `not_done` 非数组时抛错，不猜测。
- `collectStageEndReportFacts({ stageResultPath, evidenceDir })`：NEW 导出函数（I/O 边界，唯一含文件读取的导出），从指定路径读 stage 结果 JSON 与证据目录，产出与 `buildStageEndReportFacts` 同形的记录；失败语义：文件缺失不抛错，转为一条 `missing` 记录（缺什么写什么）。
- **P5/T008 私有来源合同（2026-09-27 计划，尚未实现）**：不新增公开导出/命令。现有 build-code stage-runner 只在同一次正式 run 认证 Task/worktree/branch、当前材料与执行快照、P5/T007 测试和独立审查 ref/hash、运行期 `acceptanceChain`，并确认质量事实与阶段行成功发布后，才把本次 `stageResult` 以确定序列化字节连同链和 refs 保存到现有 Task store `quality/evidence/` 的内容哈希路径，并写独立认证单绑定原件 ref/hash、任务/材料/快照及转换器事实 hash。它不是 CLI stdout 字节；公共 CLI 的真实输出另存证据，且 `tools/cli/stage-runtime.mjs` 不在本次写面。固定 P5 三文件首次 create-only，同源重试复用、不同源显式冲突或另起版本；部分发布、错身份/版本/hash、P1-only、只有游标或整卡 `completed` 投影时均不得生成“P5 完成”报告。T007 转换器仍无条件提示 `source_binding=unavailable`（只说明转换器自身不认证）；T008/P6/P13 若要判**外层来源已核**，必须重读独立认证单及原件，不能只信报告正文或传 `verified=true`。报告可保留这条转换器警告，但其它真实缺口逐项留在 `not_done`，不得用认证单抹除。T008 的结构存在性旧门只验文件存在，不验来源；真实完成另需 P1 负控、P5 正例及错来源/写中断负控。消费者/owner/删除条件见 `phases/P5.md` 同次来源修订。
- **P10/T021 当前回执到本次消费的来源合同（2026-09-28 澄清，尚未实现）**：FR-32/33、AC-32/33 与 D-013 的真实选测、逐例效果、失败后新快照复测要求不变。固定受控 `verify --action=execute` 和官方 `run --action=execute` 是两个命令；现有受信 canonical receipt→output→子进程 manifest→原始 reporter 链证明**指定回执曾真实执行**，本次 `run` 的实际输入、当次质量事实和阶段行写入返回共同证明它**消费了哪份回执**。不说测试在 `run` 内执行，也不要求同一源码快照下每次 `run` 都重新跑测试。现有 receipt 没有 `dispatch_state`；只有当次 `verify` 内存返回 `executed` 且非 `reused`，才能在该次调用范围内说“本次 verify 新跑”，跨独立 CLI 不新增执行观察或将旧 receipt 改称本轮新跑。官方 `run` 认证 Task、当前源码树、材料、业务 case 目录与独立测试库存版本、固定命令、回执/output/manifest/reporter ref/hash 及逐例真实身份；代码、材料、目录或库存变化后旧回执不能证明当前效果，修复后须重新选测执行。`runStageEndReflection#withStageRow` 经 `runStage` 私有返回路径把本次最终 `writeStageRow` 返回的行身份交给 `runOfficialStage`，禁止写后盲读当前行冒充本次写入。后者只在现有 Task `quality/evidence/` 写**一份**不可变内容寻址消费来源原件，绑定实际输入回执、当次选用的测试与逐 AC quality fact refs/hashes 和本次最终行完整 hash；独立 reader 重读全部原件并要求仍为当前行。两份同树有效回执按 `run` 实际输入评价，不凭时间任选其一或一概拒旧；半写、坏 ref/hash、错当前版本、`stage_row_error`、临时行及并发替换均保持 `current_execution_unverified`/业务 `unknown`。来源通过仍不等于业务效果通过；此原件不是进度对象、公开命令、第二状态权威或 P5 证书复用。窄写面、owner/consumer/删除条件和定向负控详见 `phases/P10.md`；正式执行、代码与质量裁决仍待完成。
- **P10/T021 消费原件定位补界（2026-09-28 计划，尚未实现）**：内容哈希文件名无法由 receipt 反推，TaskHandle 不提供安全列举；`quality_fact_refs`、`stage_reflection`、`handoff` 均不借作定位字段。`runOfficialStage` 在发布且重读 P10/T021 唯一消费来源原件后，在现有公开 `stage-runtime-result.vnext` **仅此路径**加可选 `p10_consumption_evidence:{ref,sha256}`；这是公开 JSON 的小幅增量，不改 schema_version、阶段行形状、七类公共命令，也不再添持久原件。调用方把这两个值显式传给私有 `reconcileCurrentTaskCases({...,consumptionEvidence})`；reader 用 TaskHandle 安全读取该 ref，验允许的内容哈希路径、原件自身 hash、当前行完整 hash、实际测试 receipt/output/manifest/reporter 及逐 AC quality fact 关系，绝不信调用者自报内容或扫描目录/可变 latest。缺 locator、坏 ref/hash、消费原件半写或当前行已替换时，P10 来源为 `current_execution_unverified`、业务 `unknown`；原件发布失败须显式报错且不返回成功 locator，已写阶段事实保留但不得冒称质量通过。非 P10/T021 结果不含该字段，旧消费者可忽略此可选字段。owner/consumer/替代删除条件及定向兼容负控见 `phases/P10.md`。
- **P10/T021 固定回执结构值比较的当前窄修订（2026-09-28，尚未实现）**：`runtime/stage/stage-runner.mjs#verifyOfficialEvidence` 对独立解析的 receipt 与 handler facts 中 `behavior_fingerprint` 等结构化字段现用对象 `!==`，会把值完全相同的真实固定回执误拒为 `test receipt and facts.behavior_fingerprint are not bound`。仅在该现有核对点将 `behavior_fingerprint`、`runtime_profile`、`capability_proof` 的对象/数组按已有 `canonicalJson` 比较结构值；命令、时间、路径、hash、树等标量仍严格相等，现有 receipt schema、output hash 和快照认证不放宽。owner=build-code 官方 stage producer；唯一 consumer=同次 `verifyOfficialEvidence` receipt/facts 认证；等价且同样可失败的公共结构值认证取代时删此特例，不留双实现。只在 `tests/integration/vnext-official-stage-run.test.mjs` 的受影响命名用例中，用两次**独立 JSON 解析**的同值对象先取得目标 RED，修后同目标 GREEN，并测错嵌套 run_id/目录 hash、旧树仍拒；保留旧失败和当前输出。此修订不写 `acceptance_role/data`，不声明 AC-26/27 三 seed 效果或 P10 完成；真实验收场景、逐场景 AC 映射和逐 AC receipt 补充来源仍为待核计划，见 `quality/evidence/stage-quality/build-code/P10/T021-ac-receipt-spec-clarify-proposal-20260928.md`。
- **P11/T022 现有 aggregate 同源接口（2026-09-27 计划，尚未实现）**：当前 `runOfficialStage` 返回的 `stage-runtime-result.vnext` 没有 `facts.ui_qa`，而 `acceptance_execution` 的 `stage-quality-evidence.v1.subject_fact` 已有 `execution_items`/`execution_binding`。P11 只在此 subject 添 `ui_qa_projection={status,reason?,items[]}`；每项把唯一 browser case、AC、Task/attempt/material/snapshot、原始 ref/hash、`result`→UI QA 状态、服务/API/DTO 绑定到同次执行行。唯一 writer 是 `runtime/stage/stage-runner.mjs#publishVNextStage` 经现有 `publishAcceptanceQualityFact`，唯一独立读者是 `runtime/evidence/freshness.mjs#authenticateE2eExecutionStageQuality`；reader 重读原始字节，错/缺投影、旧字节、重复/多配、假页面、取消、清理失败与状态冲突均不得 pass；写侧沿现有 `acceptance_execution` 的 `missing` 质量状态保留诊断，不另设 gate。无 browser item 的旧 command/service 原件沿旧读取；旧 browser aggregate 只读保留但不能作为当前通过。写面还限 `runtime/stage/stage-handlers.mjs#controlledBrowserQaFacts` 与两处 build-code handler 顺序、`tests/contract/acceptance-execution-tier.test.mjs` 的 v3 RED/错绑和缺投影负控；旧「stage-runner 禁写」只是来源落点未明时的历史限制，本修订只为这一私有发布点局部取代，不改 `privateAcceptanceScenario`、公共 CLI、`runtime/review/**`，不加 fact/gate/账本。替代/删除条件和真实页面 unknown 见 `phases/P11.md`。
- 冻结测试：`runtime/stage/stage-end-report.test.mjs`（build-plan 预置，原 8 个 it 字节留存；当前 P5 审查修订仅准有界增测与纠正冲突断言），断言上述三导出的存在、五值枚举、路线适用两例、空数组非法、渲染顺序与负控，以及 `stage_end_spec_analyze` 判决逐条入账与判决通过时不得出现该条；`runtime/stage/stage-end-report.mjs` 预置为「行为空壳」（只返回空结构），使 RED 表现为断言失败而非 import 解析失败，实现者须整体替换。
- stage-runtime 材料检查（被测，不改）：post+make-decision/build-plan 缺 `spec.md` → 不抛错；post+build-code/verify-code 缺材料 → 抛 `current task material missing or unreadable`。
- 复杂度基线断言（改口径）：published `formal_test_lines.actual` 必须等于同一测试当次 `buildReport()` 内存实测且条目含口径说明；冻结目标测试编辑后 2026-09-23 当次实测 76666、2026-09-26 合并 CARD-05 后复测当前为 83996（旧 JSON 20292 对照目标 RED），76664 与 76666 不是当前目标，未来漂移须按当期内存实测同步 JSON/delta/caliber；不再断言「与 git HEAD bytes 不可变」，也不在产品断言里硬编码任何实测值。

### Requirement-to-Task Trace

| 来源 | FR | AC | Phase/Task | Oracle |
|------|----|----|-----------|--------|
| CARD-04-LOCAL-001 | FR-16 | AC-16 | P1/T001 | ORACLE-RULES-DOC-COMPLETE |
| CARD-04-LOCAL-001 | FR-17 | AC-17（规则/政策支持，不是权限验收 oracle；AC-17 当前 incomplete） | P1/T001 | ORACLE-RULES-DOC-COMPLETE（仅核政策文本） |
| CARD-04-LOCAL-005 | FR-21 | AC-21 | P1/T002 | ORACLE-ENTRY-INVENTORY-COMPLETE |
| CARD-04-LOCAL-007 | FR-16 | AC-16 | P1/T003 | ORACLE-ADR0033-LANDED |
| CARD-04-LOCAL-006（本地复杂度基线子义务）、CARD-04-LEGACY-BASELINE | FR-20（不映射：本地基线修正义务，非 FR-20 归属） | AC-20（不满足：T004 不走 AC-20 路线） | P2/T004 | ORACLE-BASELINE-TRUTH（仅核数字真值） |
| CARD-04-LOCAL-003 | FR-18 | AC-18（旧源码 RED 为事后补采，只属行为回归支持） | P3/T005 | ORACLE-STAGE-RUNTIME-NARROWING（不单独证明先红后改） |
| CARD-04-LOCAL-003 | FR-19 | AC-19（本地豁免解除支持，不是纯文档样例） | P3/T005 | ORACLE-STAGE-RUNTIME-NARROWING（不单独证明纯文档处置） |
| CARD-04-LOCAL-002 | FR-18 | AC-18（真实先红后绿候选，须 T026 核原件） | P4/T006 | ORACLE-ACCEPTANCE-CHAIN-TRUTH |
| CARD-04-LOCAL-002 | FR-21 | AC-21 | P4/T006 | ORACLE-ACCEPTANCE-CHAIN-TRUTH |
| CARD-04-LOCAL-004 | FR-21 | AC-21 | P5/T007 | ORACLE-REPORT-FACTS-TRUTH |
| CARD-04-LEGACY-BASELINE（数字事实修复；仅为报告事实输入） | FR-20（仅计划报告事实支持，非完整归属） | AC-20（路线适用性支持，T007 不单独满足） | P5/T007（计划的报告事实支持）→ P13/T024（保留聚合事实；AC-20 路线适用性仍须原始事实核验） | ORACLE-REPORT-FACTS-TRUTH（非 AC-20 路线 oracle） |
| CARD-04-LOCAL-008 | FR-17 | AC-17（runtime 就近测试为支持性决定，不验证读写权限；AC-17 当前 incomplete） | P4/T006 | ORACLE-ACCEPTANCE-CHAIN-TRUTH（不含权限 oracle） |
| CARD-04-LOCAL-008 | FR-17 | AC-17（runtime 就近测试为支持性决定，不验证读写权限；AC-17 当前 incomplete） | P5/T007 | ORACLE-REPORT-FACTS-TRUTH（不含权限 oracle） |
| CARD-04-LOCAL-004 | FR-21 | AC-21 | P5/T008 | ORACLE-REPORT-DELIVERED（旧名称仅用于历史/冻结结构合同；当前 T008 blocked/not_done/G2，无认证来源事实） |
| CARD-04-LOCAL-004、R-004、D-005、D-009、D-010、D-011、D-012、D-013、D-014、R-009、R-011、R-012、R-013、R-014、R-015、R-016、R-017、R-018 | FR-20、FR-21、FR-29、FR-30、FR-31、FR-32、FR-33、FR-34 | AC-20、AC-21、AC-29、AC-30、AC-31、AC-32、AC-33、AC-34 | P13/T024（依赖 P11/P12；各功能 AC 判真仍归其原相位） | ORACLE-CARD04-FINAL-AGGREGATE（P1..P12 独立最终事实与原样叙述；当前仅预写目标 RED，非 GREEN） |
| CARD-04-LOCAL-008 | FR-26 | AC-26 | P6/T009 | ORACLE-DECISION-LOG-CENSUS |
| CARD-04-LOCAL-008、CARD-04-LOCAL-001 | FR-22 | AC-22 | P6/T010 | ORACLE-UPSTREAM-LEDGER |
| CARD-04-LOCAL-004、CARD-04-LOCAL-005、CARD-04-LOCAL-006 | FR-23 | AC-23 | P6/T012 | ORACLE-REAL-ENTRY-E2E（动态 fixture taskPath 报告未发射，保持 not_done/G2；P5 工作树中途检查点不能代替） |
| CARD-04-LOCAL-008 | FR-26 | AC-26 | P6/T013 | ORACLE-SPEC-ANALYZE-TRUTH |
| CARD-04-LOCAL-002 | FR-25 | AC-25 | P6/T014 | ORACLE-CROSS-CARD-POLICY-CONSUME |
| D-015 | FR-17 | AC-17（真实受限实现者窄样例经独立复核；P6 未完成） | P6/T025 | ORACLE-REAL-IMPLEMENTER-TEST-ACCESS |
| D-015 | FR-18 | AC-18（同字节先红后绿窄样例经独立复核；当前整项回归待核） | P6/T026 | ORACLE-BEHAVIOR-SAMPLE-RED-GREEN |
| D-015 | FR-19 | AC-19（独立纯文档 Task 可失败检查样例层成立；P6 未完成） | P6/T027 | ORACLE-DOCUMENT-SAMPLE-CHECK-OR-WAIVER |
| CARD-04-LOCAL-006 | FR-24 | AC-24 | P6/T011 | ORACLE-ORACLE-MIRROR-ISOLATED |
| CARD-04-RULING-A1-TRUTH | FR-27 | AC-27 | P7/T015 | ORACLE-ACCEPTANCE-MACHINE-CLASSES |
| CARD-04-RULING-A4-PRECONDITION | FR-28 | AC-28 | P7/T016 | ORACLE-CENSUS-UPSTREAM-AUTHORING |
| R-009/R-010/R-011/R-013/R-014 | FR-29、FR-30 | AC-29、AC-30 | P8/T017 | ORACLE-BUSINESS-CASE-CATALOG |
| R-009/R-010/R-012 | FR-29、FR-32 | AC-29、AC-32 | P9/T018 | ORACLE-P9-TRUSTED-CHANGE-SCOPE |
| R-009/R-011/R-013/R-014 | FR-30、FR-32 | AC-30、AC-32 | P9/T019 | ORACLE-P9-INDEPENDENT-RUNNABLE-INVENTORY（原路径清单 G2 与目标 RED 保留；当前 T019 新旧合同本地 11/11，隔离 Task 三目标实报叶 6/28/15 与独立 registry 匹配；CARD-04 官方 build-code 和 P10 消费尚无） |
| R-011/R-012/R-013/R-014/R-015/R-016/R-018 | FR-30、FR-31、FR-32 | AC-30、AC-31、AC-32 | P10/T020 | ORACLE-P10-B2-CASE-TRUTH（旧仅接口 RED 保留；现行私有实现已有定向验证，完整真实变化、效果与官方同次绑定仍未证，G2） |
| R-012 | FR-30、FR-31、FR-32、FR-33 | AC-30、AC-31、AC-32、AC-33 | P10/T021 | ORACLE-P10-B2-CASE-TRUTH（新接口断言 RED 已留，真实逐例效果/canonical 原件未有，G2） |
| R-011/R-012/R-013/R-014/R-015/R-016/R-018 | FR-30、FR-31、FR-32、FR-33 | AC-30、AC-31、AC-32、AC-33 | P11/T022 | ORACLE-P11-BROWSER-CASE-TRUTH（同一 aggregate 投影与 reader 已列精确计划；v3/真实页面/生产接线未完成） |
| R-009/R-017 | FR-34 | AC-34 | P12/T023 | ORACLE-VERIFY-BUSINESS-HANDOFF（文本合同 RED，不是业务验收） |

> P8..P13/T017..T024 现有物理 Phase 文件、预置定向测试与 index 指针；P13/T024 是 P11/P12 后 D-005 最终交付任务，目前仅目标断言 RED（3 收集/2 失败/1 通过），绝非全相位报告已生成。整体未完成正式独立审查；CARD-04 Task 只有 make-decision/build-plan 阶段行，尚无本轮官方 build-code 行。旧 P1..P7 不能证明新增 oracle；P9/T018 和 T019 原断言缺口及当时 8 项收集/6 项目标 RED/2 项旧路径正控保留为历史；当前两项功能已有本地限定 GREEN（T018 12/12、T019 11/11）及隔离 Task 三目标 canonical 回执（6/28/15 叶），独立内容对账 1,959 个路径一致，但三目标安全脚本整体 exit 1，不能改报脚本 GREEN；P9 正式同版联合审查和 CARD-04 官方 build-code 行仍缺，详见 `phases/P9.md`。P10 旧 seam RED 仍不可在其独占写集转 GREEN；用户另许可**仅建三个 `unavailable/not_implemented` 接口骨架并修订冻结测试**，三个原测试字节及旧 10 项/4 项断言 RED 保留；review2 原件记录 29 项收集/29 项断言失败，review3 最新原件 `quality/evidence/prewritten-red/P10-review3-scoped-red.txt` 记录 29 项收集/29 项失败/0 项通过、exit 1。上述 RED 仅为测试目标与未实现接口的历史/当前证据，不代表产品通过；独立窄审查的边界与当前 review3 输入须以其独立原件核对，不能从旧 review2 结论外推。旧测试拥有的 Git diff、Node TAP/账户取消夹具本身不证明 P9 起点认证；现有 P9 起点只获本地限定验证，仍不证明 P10 子进程/canonical 执行或真实业务；内层安全执行、跨项目固定启动和官方消费者仍未实施，AC-32/33 仍 G2，任何产品逻辑/CLI/保护写面须另获批准；该行旧 P11「仅获冻结测试目标修订授权、2 项收集/1 项目标 RED」是早时点记录；当前第一层本地 5/5，第二层 v2 真实 producer 协议夹具定向 6 项中 4 个目标 RED、2 个负控通过，但现有 aggregate 尚无 `ui_qa_projection`，v3 同源 reader/错绑负控与真实页面/服务均未实施。当前 P11 精确 writer/reader 范围以 `phases/P11.md` 同版修订为准；此修订不是生产接线、正式阶段事实或业务验收。P10 review3 新断言 RED 尚未找到绑定精确输入的独立 reviewer verdict/receipt；不得称其已独立审查，仍须证明真正消费面、可信起点及安全执行并另批产品写面；P11 仍须后置保护面与真实消费者负控，不能借结构 trace 冒充可实施。

### Global Verification Strategy

- 定向（跨相位回归集合，不是任一相位的额外前置/Done 门）：`npx vitest run tests/contract/stage-runtime-material-check.test.mjs`、`npx vitest run runtime/stage/stage-runner.test.mjs`、`npx vitest run runtime/stage/stage-end-report.test.mjs`、`npx vitest run tests/contract/repository-inventory.test.mjs`。P4 自身只要求 T006 的单文件 `gate_cmd`；此四命令集合应在各自相位实现可用后单独采集，并仅按实际依赖/文件状态归因。
- 全量 `npx vitest run` 不作为本卡的验收命令：AGENTS.md「测试硬规则」禁止无范围地跑全量 vitest，例外须在执行证据中写明原因与范围；如确需全量，按例外登记，不把它写成通过前置。
- P1 文档/ADR 复合 gate：`phases/P1.md` 的同一 `gate_cmd` 先用 `node -e` 核规则文档（19 个必备节 + 9 个 DER 来源编号）、入口库存（三类入口）及 ADR 三节（背景/决策/后果），再由 `&& node -e` 内 `git ls-files --error-unmatch docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md` 核 ADR **已被跟踪**；旧文档 GREEN、未跟踪 ADR 或仅新增未提交文件不能算 phase pass。P3/T005 的定向同一测试 RED 须在隔离同提交 HEAD 基线、冻结测试字节相同且依赖就绪时取得目标断言失败；当前工作树 GREEN 另采，禁止 stash/切换共享脏文件或把 setup/import 失败充 RED。
- D-005 中途/最终分时验证：P5/T008 当前 blocked/not_done/G2（T007 局部 8/8，但未有同次私有结果及独立来源认证单）；仅在 T007 当前实现完成同版审查、P5/T008 同次私有来源和独立认证单经核验后，才可从真实 P5 范围来源生成 `quality/evidence/stage-quality/build-code/P5/report-facts.json`、`report.md`、`T008-delivery.txt`（末路径只是旧结构 gate 要求的兼容名，最多本地未认证索引，非来源快照收据；未来结构 gate 绿色也不能证明全卡或叙述）。P13/T024 在 P11/P12 后另以 `npx vitest run tests/contract/card04-final-aggregate.test.mjs` 定向检查独立的 `quality/evidence/stage-quality/build-code/P13/{final-aggregate.json,final-aggregate.md,T024-delivery.json}`，核 P1..P12 Phase 原 gate_cmd/Task IDs、实际 runner 身份、命令/exit/来源/hash 及未完成 reason/owner；独立子代理最终叙述须由主会话原样贴出并由异源核实际聊天/执笔身份。当前 P13 仅 3 项收集、2 项目标断言 RED、1 项负控正控通过，最终文件/GREEN/聊天均未发生；即使后续合同绿仍不自证业务语义/授权接受。
- 验收统计口径（DER-11）：`node tools/cli/check-decision-log-chain.mjs specs/<task>/decision-log.md` 加人工逐条核对。
- 真实入口（仅未来获授权执行时）：在已认证 CARD-04 task worktree/CWD 下，以 `node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-04-20260919` 选择目标并另核任务身份、来源与快照；`--project`/`--task` 仅选择 CLI 身份，绝不认证来源。真实 run 结果未必暴露运行期 acceptanceChain，不能凭返回行非空断言其存在；须交叉核对可回读官方阶段事实与 canonical 原件中的 AC 行、命令/exit/output/业务 oracle，缺来源则 `unknown/not_done`。此命令不自动触发 P10 的 B2 选例或证明浏览器实跑，需另核安全固定命令的真实 capture、runner 与业务观察；不得在 build-plan 期执行或从文本/报告行声称 AC 通过。
- 新增 P8/P9 分层门：`npx vitest run tests/contract/business-case-catalog.test.mjs` 验证有限业务 case 种子/关系与坏引用；`npx vitest run tests/contract/build-code-change-scope.test.mjs tests/contract/build-code-test-inventory.test.mjs` 检查可信启动起点、committed/staged/dirty/untracked 差分及独立 runner 身份/零或跳过的负控。P9 原修订目标 RED 已保留；当前执行前来源和独立库存有本地限定 GREEN 及隔离 Task 回执，正式同版联合审查和 CARD-04 官方 build-code 行仍缺，不能据此判 P9/AC-32 完成；任何来源/业务关系未登记都保持 unknown。
- 新增 P10 定向门：`npx vitest run tests/contract/build-code-case-selection.test.mjs tests/contract/build-code-targeted-runner.test.mjs tests/contract/build-code-case-reconciliation.test.mjs` 旧禁改 seam 四项断言 RED 历史保留；review2 原件记录 29 项收集/29 项断言失败，review3 最新原件 `quality/evidence/prewritten-red/P10-review3-scoped-red.txt` 记录 29 项收集/29 项失败/0 项通过、exit 1。此为未实现接口的目标 RED，不是实施 GREEN；review 结论需限于各轮确切输入，不得跨轮外推。即使未来夹具测试全绿，也不能凭硬编码正控加宽松 unavailable 负控称达标；须先证明跨项目安全固定启动命令可由当前 build-code agent 实际调用、P9 认证范围/库存可读、canonical 原件可交叉核，产品逻辑与任何扩大写面另批后再核真差分自动选集、shell-free argv、runner 实报精确 ID、正反业务效果、逐例 AC/结构/风险和旧失败→新快照复测。缺起点/关系/消费者或 receipt 复用时不得写新实跑通过。
- 新增 P6/P11/P12 条件门：P6/T012 的 `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 旧冻结 fixture taskPath 下动态报告尚无真实发射者；P6/T012 已限定修订为 P1-only 无 P5 报告的负控与真实 P5 正例，T007 纯转换器及静态文件均不能替代同次认证生产者，维持 not_done/G2，绝不从 P13 汇总中删除或洗绿。`npx vitest run tests/contract/post-business-browser-reconciliation.test.mjs` 已有经授权修订的 2 项收集/1 项 service 通过/1 项 browser 目标 RED，只测表示不证明真页面；实际 UI 要当前服务/DTO 与独立浏览器 adapter、隔离 profile、场景身份、截图/network/console/cleanup 原件，P11 当前先以 `runtime/stage/stage-content-contracts.mjs#projectPostPhaseAcceptanceExecutionData` 修正合法 browser 表示并保留 browser `execution` 禁令；只有 P8/P9/P10 的真实后台→页面/API/DTO/服务关系可认证时，才以 `runtime/stage/stage-handlers.mjs#controlledBrowserQaFacts` 和定向负控修正 backend 自动 N/A；同一 case/attempt/材料/快照的页面检查只能实际执行一次，现有两条读取路径须共用同一 canonical 原件 ref/hash，状态矛盾或错绑不得判通过。精确写面及 owner/consumer 见 `phases/P11.md`；缺真实关系或服务时仍未完成，不能判 N/A 或通过。`npx vitest run tests/contract/verify-code-business-handoff.test.mjs` 目前仅文本合同 RED，未来 GREEN 只证明技能文字；需独立按风险抽样及既有授权业务验收者真实答复，不能让 P12 的 P10 依赖绕过 P11 unknown。
- 独立 Phase 旅程必须分别核 P8 的规则→正反/旧回归 case、P9 的可信快照→独立测试发现、P10 的选例→实跑→逐例效果→失败留旧与新快照复验、P11 有条件后台→页面真实服务旅程、P12 的机器原件→独立语义抽样→现有最终授权确认；P13/T024 再取 P1..P12 逐 Phase/Task 实际 gate/原件聚合并原样贴出独立叙述，P6/T012、P10/P11 未证明则总体不得 pass。每项记录环境/源快照/测试身份/原始输出及 refs，N/A 要消费者清查支持，缺环境或未授权记 unavailable/unknown 而非 pass。精确 Task/Phase 命令与正反 oracle 以各 `phases/P8.md`…`phases/P13.md` 为准；P13 报告是普通任务不是新 gate/stage。

## Appendix A — 验收判据（母 PRD AC-16..AC-21 逐字引入 + 本卡处置；AC-22..AC-28 为旧裁定扩展；AC-29..AC-34 为 D-009..D-014 新确认质量结果，不改旧文）

- [ ] **AC-16**（对应 FR-16）条件=检查一个真实 task 的验收标准集；行为=逐条核对可执行形式；度量=100% 条目含「条件→行为 + 可度量标准 + ≥1 失败场景」，或显式标 incomplete；失败场景=任一条目缺三要素之一且未标 incomplete，即失败。
  本卡处置：取本卡自身（`workflowhub-thin-core-card-04-20260919`）作真实样本；当前完整验收标准集为本规格 Appendix A 的 AC-16…AC-34 共 19 项，决策日志 `## 本卡自身的验收标准（AC-16…AC-21）` 是其中前六项的历史来源，不另加六项到分母。T001 规则文档定义可执行形式与全仓统计口径（DER-11）。证据：本文件 Appendix A、决策日志该节、`quality/evidence/stage-quality/build-code/P1/AC16-full-acceptance-set-audit-20260927.md`。定义层四要素的局部核对不等于全部真实场景验收完成。

- [ ] **AC-17**（对应 FR-17）条件=观察一个实施 task；行为=核对实现者可访问范围；度量=实现者对测试目录无写权限；只读模式下可读不可写，隐藏模式下读不到测试内容；失败场景=实现者写/改验收测试，或在隐藏模式下读到测试内容，即失败（只读模式下读取不算失败）。
  当前处置：用户在 D-015 明确选择补做此前跳过的三项，本项恢复为本任务必须实施的真实验收。先前「乙」保留为历史答复；目前没有真正受限的实施者运行原件，只落 provenance 约定（DER-12）与冻结声明，状态仍为 **incomplete**。后续计划须指定受限实施者启动者、只读和隐藏两种模式、可读/不可写/不可改与完全不可读的实际负控，以及精确任务和证据来源；同一用户 chmod、只限制测试子进程或事后说明均不足以证明本项。

- [ ] **AC-18**（对应 FR-18）条件=一个行为变化样例 task；行为=核对 RED→GREEN 证据；度量=存在同一测试改动前失败、改动后通过的记录；失败场景=只有 GREEN 无 RED 且无 G-2 豁免披露，即失败。
  当前处置：D-015 恢复真实行为变化样例 task 的实际验收，状态 **incomplete**。候选 task 须有可认证的身份、同一目标测试在改动前后的原始字节和运行原件、真实行为断言的失败/通过、源码与材料版本及独立审查；用户并未要求样例必须有另一 Task ID。现存 CARD-02 历史候选虽有同命令 RED/GREEN，旧 Git 快照已不可读且测试数变化，不能据此证明同一断言未改；P3/T005、P4/T006、P5/T007 的局部记录也不能自动替代本项。若当前任务的真实 Task 能补齐上述证明，可作为样例；否则须另取真实 task，不得造数。

- [ ] **AC-19**（对应 FR-19）条件=一个纯文档样例 task；行为=核对豁免处置；度量=存在豁免记录，含理由+风险+验收中披露，或补了一条可失败检查；失败场景=直接跳过且无披露，即失败。
  当前处置：D-015 恢复真实纯文档样例 task 的实际验收，状态 **incomplete**。按完整工作流 Task 核验：该 Task 的认证差分须仅含文档，并有专属可失败检查，或保存对应豁免的理由、风险与验收披露。CARD-04 整体含代码，T001/T002/T003 只能提供文档检查设计的辅助证据，不能充当完整纯文档 Task。现有外部候选缺专属检查/豁免原件；后续须选或实际完成一项真实纯文档 Task，绑定来源与消费者，缺原件仍报未完成。

- [ ] **AC-20**（对应 FR-20）条件=构造两类验收场景——某测试路线适用 trace/JUnit/跳过计数，与另一路线不适用；行为=分别运行验收；度量=硬要求（真实命令、exit、output、对应 oracle 证据）缺失即判失败；适用路线缺任一适用产物即判失败；不适用路线记 N/A+reason 且不判失败；失败场景=缺适用产物仍判通过、伪造产物、缺不适用产物（已记 N/A+reason）却判失败，或 N/A 无理由，即失败。
  本卡处置：机制已存在（`e2e_scope`/`e2e_acceptance`），本卡不新增门；两类场景分别由「文档/规则路线」（trace/JUnit 不适用 → 记 N/A+reason，DER-13）与「代码/契约路线」（真实命令 + exit + output + oracle 证据）承载，逐 AC 由报告事实层输出（DER-06）。真实入口：`node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code` 的真实 stdout。P2/T004 仅核本地复杂度基线数字，不构成 AC-20 的路线场景或机器产物证据；不得计作 AC-20 满足。曾引的 `quality/evidence/stage-quality/build-code/P5/T007-green.txt` 当前未找到，P5/T007 已有局部 8/8，但旧引用原件仍不存在且未有同版正式审查，不能将该路径当现有证据。

- [ ] **AC-21**（对应 FR-21）条件=取一个完成 task 的执行事实；行为=检查测试/验收技能的真实执行记录；度量=执行事实（命令、exit、output 位置）存在且可回读；整体完成宣称发生在真实入口联通实跑之后；失败场景=只有脚本自证，或审查被当作功能验收，即失败。
  本卡处置：部分可得，三处计划落点——T002 入口库存、T006 acceptanceChain 连接、T007 报告事实层（局部 8/8，同版正式审查未完成）；T008 当前 blocked/not_done/G2，尚无认证 P5 中途检查点，只有在 T007 当前实现完成同版审查且 T008 同次私有来源与独立认证单建立后才可执行；P13/T024 在 P11/P12 后另聚合 P1..P12 并独立执笔/原样贴出。**限制**：P6/T012 动态 fixture 报告缺失 G2，P10/P11 未通过且 P13 最终产物/聊天尚未发生；本卡完成宣称只能在真实入口实跑、缺口解决和独立/人工验收后作出，不能拿 P5 检查点充数。证据待核：`docs/architecture/real-entry-inventory.md`、`quality/evidence/stage-quality/build-code/P5/` 与独立的 `quality/evidence/stage-quality/build-code/P13/`、实际聊天记录。

- [ ] **AC-22**（本卡扩展，对应 FR-22；授权＝用户 2026-09-23「按 P6 全面执行」）条件=取本卡 decision-log 的原始来源普查结果与已裁决编号全集；行为=逐条核对 spec.md「上游覆盖账本」是否有该编号的行且行内给出落点记号；度量=账本行集合 ⊇ 上游编号全集（存在者），每行含 `FR-`/`AC-`/`P<n>/T<nnn>`/`ORACLE-` 之一，或如实 `not_done`/`deferred` + owner；spec.md 中不再存在本地自创的 `R-00x` 定义行；失败场景=任一上游编号无行、行内无落点记号、或本地同名编号顶替上游编号，即失败。负控=删掉任一行必须被检查捕获。
  本卡处置：T010 交付账本与命名空间清理，预置测试 `tests/contract/upstream-coverage-ledger.test.mjs`（含删行负控）作为可失败检查；机器只查「有行 + 有落点记号」，落点是否真的交付由 D-005 报告与独立审查逐条人核。

- [ ] **AC-23**（本卡扩展，对应 FR-23；授权＝用户 2026-09-23「真实 CLI 全链 E2E」）条件=存在基于真实 CLI 子进程的端到端验收资产；行为=运行该测试并核对断言来源；度量=逐条断言真实子进程的可观察输出（stdout JSON / 落盘事实文件）及本卡明确列出的有限阶段/fixture 链路，改动前存在目标条件 RED；覆盖不等于全阶段/UI/网络/模型端到端；失败场景=无 E2E 资产、断言基于 mock、漏掉本卡列明断言、或把宿主不可用写成通过，即失败。
  本卡处置：T012 交付 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（预置冻结、RED 先采）；T011 的只读 oracle 镜像只用于存在性与 schema 键兼容核对，E2E 的谓词期望与五类断言由 E2E 自身硬编码承载，不得归因于镜像；E2E 是诊断与验收资产，不接线为阶段推进门（SD-17）。**当前限制**：临时 fixture taskPath 的动态报告仍无真实发射者；P6/T012 旧 P1-only 期待 P5 文件的断言已被限定修订为负控，P5/T008 的同次认证来源生产者尚未实现，不能拿三文件结构 RED/GREEN 替代夹具 E2E；保持 not_done/G2，未来须有获授权真实发射/消费者后重采同一目标的有效证据。

- [ ] **AC-24**（本卡扩展，对应 FR-24；授权＝用户 2026-09-23「本卡内做只读镜像目录」）条件=观察 oracle 存放位置与权限；行为=核对实现者可写集与 oracle 目录的交集、文件只读位、访问约定登记；度量=oracle 位于实现者写集之外且文件 mode 为 `0444`、仓库内无副本、消费方式（env `WH_CARD04_ORACLE_DIR`）已登记；失败场景=oracle 落在实现者写集内、可写、仓库内出现副本，即失败。
  本卡处置：T011 交付镜像与 README；残余限制（同一 OS 用户仍可改权限，非宿主级隔离）如实进 §12.3 覆盖限制清单，不声称已建立宿主级隔离。

- [ ] **AC-25**（本卡扩展，对应 FR-25；授权＝用户 2026-09-23「本卡内修复，我授权越界改 `runtime/review/**`」）条件=取 make-decision 红蓝对 `d1fd1157` 的真实历史记录；行为=调用 canonical 历史读取器读回；度量=读回成功且成员状态与记录所载一致；真损坏形态（pair 缺成员、报告引用缺失、semantic 记录与 canonical 引用不符）仍抛错；失败场景=合法历史形态被误判为损坏（当前实测即失败），或修复后真损坏不再报错，即失败。
  当前处置：原先让出读取器实现给 CARD-05 的选择保留为历史。CARD-05 落库后真实 d1 pair 仍读不回；本任务 P6/T014 于 2026-09-27 精确接手 `runtime/review/review-record-route.mjs` 的旧结构只读兼容和真损坏负控，当前真实 d1 私有探针可读、定向测试 7/7；写入器和 provider 不改。v1 缺不可变 writer epoch，私有探针也不是正式公共 receipt，故 AC-25 整体仍 incomplete。旧跨卡风险登记和来源见 §12.2/§12.3 与 `quality/evidence/stage-quality/build-code/P6/AC25-d1-reader-fix-20260927.md`。

- [ ] **AC-26**（本卡扩展，对应 FR-26；授权＝用户 2026-09-23「按 P6 全面执行」中 T009/T012 两项）条件=取本卡 decision-log 与 build-plan 阶段末语义核查事实；行为=核对普查分母、诊断可见性与状态词；度量=普查 `entries > 0` 且 `errors` 清零；普查诊断逐条出现在校验器输出中（不再被吞成一条通用错）；`stage_end_spec_analyze` 事实携带机器判定类状态（`material_incomplete`/`inconsistent`/`unavailable` 等，经既有槽位 `summary.actual_outcome` 与 `subject_fact.evidence_state` 呈现），不再只显示与 `status` 同值的通用 `"missing"`，且进入报告「没做到」清单；未新增任何 gating（advisory 断言仍绿）；失败场景=分母为零、诊断被吞、机器判决不可见被静默降级成通用 `missing`、或为此新增门，即失败。
   当前处置：T009 交付普查三节；T013 在 CARD-05 留下的 build-code post 通道上核「普查失败逐条可见」，并于 2026-09-27 精确接手 `runtime/stage/stage-content-contracts.mjs` 的零条目逐条错误投影及 `tests/contract/post-spec-analyze-original-source.test.mjs` 的归档路径。原三文件门从 5 failed/19 passed 变为 24/24，本地独立审查未见可行动问题；这只证明吞错与旧路径两处局部修复。`runtime/stage/stage-runner.mjs`、`stage-handlers.mjs` 的生产者映射及 P6/T012 报告消费者仍未交付，机器状态词/报告链不能据 T013 绿色宣称完整 AC-26。原让出历史、失败与新证据见 P6/T013 修订、§12.2/§12.3 和 `quality/evidence/stage-quality/build-code/P6/T013-targeted-repair-20260927.md`；语义级覆盖仍由独立审查与人核。

- [ ] **AC-27**（本卡扩展，对应 FR-27；授权＝用户 2026-09-23 裁定 `a1=甲`「现在就升级枚举」，并受 `a14=甲`「只做不冲突的面」约束）条件=取验收事实校验器与存储层对 D-004 机器判定类取值的处置；行为=构造携带 `missing`/`inconsistent`/`incomplete`/`unavailable` 的验收事实记录并驱动真实导出；度量=四类取值均被接受、拒绝消息点名全部允许值、存储层把机器判定类映射为 `incomplete`（不得为 `passed`）、既有 `acceptance-evidence.v1` 记录逐字复现、`quality-fact.v1.status` 仍为三值；失败场景=取值被拒、被静默判 `passed`、既有记录字节变化，即失败。
  本卡处置：P7/T015 交付，预置测试 `tests/contract/acceptance-result-machine-classes.test.mjs`（RED 实测 `13 failed | 15 passed (28)`，证据 `quality/evidence/prewritten-red/P7-T015-acceptance-enum-red.txt`）+ 护栏 `tests/deferred-acceptance-semantics.test.mjs`；只声称「可表达性」，不声称新值已在真实阶段产出（生产者侧映射点留 CARD-05，见 §12.3 第 ⑥ 条）。

- [ ] **AC-28**（本卡扩展，对应 FR-28；授权＝用户 2026-09-23 裁定 `a4=丙`：材料完整性要求形式前置）条件=取 decision-log 模板与相关技能文本；行为=按模板产出 decision-log 并送原始来源普查解析；度量=模板与技能文本齐备三节及行形态、按模板产出的 decision-log 通过普查（分母非零、`errors` 清零）、既有内容契约硬断言仍绿、归档卡零影响；失败场景=模板仍缺节、写成新 gating、或破坏既有硬断言，即失败。
  本卡处置：P7/T016 交付，预置测试 `tests/contract/census-upstream-authoring.test.mjs`（RED 实测 `5 failed | 4 passed (9)`，证据 `quality/evidence/prewritten-red/P7-T016-census-authoring-red.txt`）+ 护栏 `tests/decision-log-content-contract.test.mjs`；M2 的事实投影与 M3 的 status 可见性挂起，如实登记。

### 本轮新增验收（AC-29..AC-34；不替换 AC-16..28）

- [ ] **AC-29**（FR-29）：条件=核对 CARD-04 六项真实完成责任与 HEAD `35a881ac` 的 CARD-05 落地事实；行为=逐项核需求、现有真实消费者、可失败证据及尚缺部分，并检视受保护写面；度量=六项各有可回读结果/owner/未证明项，旧 P1..P7 证据与 CARD-05 未落地代码不冒充 B2，CARD-05 零新增改动要求，只有真实落地+失败负控+另行许可才可能触及 `runtime/stage/**`/`runtime/review/**`；失败场景=把本方向当 build-code 许可、把手工选测/计划稿/旧阶段报告称为六项全过、继承旧越界授权或让出 B2 为 B1，即失败。

- [ ] **AC-30**（FR-30）：条件=项目版本化唯一业务 case 索引及独立来源测试/入口库存存在；行为=以 CARD-04 新功能与受影响旧回归抽样做来源/业务规则版本/消费者/依赖/精确目标的双向追溯并反查独立库存；度量=稳定 case ID、正反边界恢复及业务可观察 oracle、风险/owner/stale/退役、数据/环境和预期真实身份完整，计划引用同一 case；库存真实可枚举且可指出登记目标缺席与未关联资产，其他旧行为诚实标未盘点；失败场景=每 Task 另起账本、只存测试文件路径、库/库存互抄、已删除或错绑目标仍通过、两边均未登记的业务宣称无漏测，即失败。核验含删除/改名、重复及故意遗漏关系负控，不升级为新门。

- [ ] **AC-31**（FR-31）：条件=检查真实变更的 Task/Phase 卡、需求/业务规则/case/AC 映射；行为=分别审视每 Task 的单元、自动代码检查、接口三层及每 Phase 的三层加真实浏览器 UI 四层，另取跨 Task 接口/用户旅程；度量=每个适用层均写具体目标、拟用技能（不是调用事实）、安全入口、环境/数据/服务身份、正反/边界/旧回归业务 oracle、可失败标准、将保留的原始证据与 N/A 的消费者依据，新增行为具有效 RED→GREEN 计划；失败场景=只写「跑测试」、Task 绿灯冒充跨任务 E2E、无服务/工具便写 N/A、将 fixture/无后端浏览器称真实 UI、计划当作执行通过，即失败。

- [ ] **AC-32**（FR-32）：条件=可信任务启动 commit/tree 与 Task ID 固定并产生含 committed、staged、dirty、应纳入 untracked 的实际源码快照（还包括修复后新快照）；行为=对照真实产品差分、业务 case 触发/消费者/依赖及独立测试/入口库存，自动安全定向选并执行 Task/Phase 的适用层；度量=起点/当前快照可核且已提交变更不因干净工作树丢失，应测 case 与实际目标、执行技能和服务/浏览器/设备适用性可回读；动态参数安全 argv/固定命令，真实接口/UI 连运行服务并有观察、截图/网络/console/cleanup 原件；失败场景=起点丢失却空选全绿、未映射改动或删除/重复目标被忽略、手工挑选代替系统、shell exit 0/fixture/changed-files 前端壳冒充业务/UI、自动代码检查由人工 review 顶替、环境缺失判 N/A/pass，即失败。无法识别两侧均遗漏的业务关系必须标 unknown，不声称机器万能。

- [ ] **AC-33**（FR-33）：条件=选择集、实际 runner 测试身份及一次失败→同任务修复→新快照复测存在；行为=逐 case 对照 expected 与 runner 报告（含 skip/todo/重复/零例）及适用层、命令/步骤、数据环境、正反业务效果、AC/结构/风险与原始证据；度量=每个应测 case/受影响 AC 的通过/失败/未跑/未知/不可用能对应真实身份、exit/output/hash/receipt/快照及业务观察，旧失败原件、发现 ID、owner、归因和修复后重算的选择/邻近旧回归新原件同时留存并引用处置；失败场景=只用命令绿色或自报清单标 pass、case 目标错绑/0 tests、结构偏差漏审、最后绿色覆盖旧失败、同任务修复后不重新选择或关单后伪造 reopen，即失败。严重残余循现有修复/误报证明/授权风险接收，不造新状态机。

- [ ] **AC-34**（FR-34）：条件=机器逐 AC 测试事实与独立于实现者的 verify-code 审查均已产生；行为=按风险选样从原需求/规则版追到业务效果/case/实际消费者/代码/执行证据，专测「测试绿但业务错」、外部服务版本/权限/模拟与真实/恢复、来源冲突、低置信和高风险；度量=逐受影响 AC 的机器事实、已抽/未抽 case IDs、独立语义与代码 review 分离结论、残余风险 owner 可回读，并仅在**现有 verify-code 最后授权者确认槽位**交付环境/权限/数据/真实入口正反步骤/拒绝回滚标准/应回传证据，记录真实接受/拒绝/延期；失败场景=reviewer green 冒充业务通过、全部人工筛选/执行代系统、遗漏外部依赖/未抽样、授权者未回复/不可用却宣称验收完成、另造 gate/CI/确认槽位，即失败。

## 12. 风险、未决与交接

### 12.1 build-plan owner 未决项收口表

| 未决项（decision-log 原文编号） | 处置 | 落点 |
|--------------------------------|------|------|
| D-001① `task_ids` 的最终满足方式 | CARD-05 合并后 `task_ids` 已由 `runtime/stage/stage-runner.mjs:4142-4214` 真实派生（post 无 `tasks.md`，本卡不改校验器），本卡 T006 纯函数只透传不改写、不回退为占位；`review_ref` 仍属 CARD-05 占位，`coverage_limits` 逐条披露 `review_ref` 占位 | T006、报告事实层 |
| D-001③ 链长期判「不完整」是否可持续 | 可持续：D-001 明确接受该链在本卡之后仍判「不完整」；本卡以 `coverage_limits` 逐条披露不完整原因，不追绿 | T006 |
| D-003① 三样落点中 id 数组与 `coverage_limits` 由谁在哪个阶段写 | 由 build-code 在 T006 写入（`currentPostBuildCodeSpecAnalyze` 构建期）；本卡 build-plan 只提取纯函数与定契约 | T006 |
| D-004① `exceptions` 字段语义与允许值 | 见 DER-05（人写声明类、允许值、不得顶替机器判定类、空数组不合法） | 规则文档、T006/T007 |
| D-005① 报告内容能否真由机器渲染 | 设计上事实层（命令/exit/output 路径/清单/路线适用）可机器渲染；实现仍待授权，当前 T007 局部 8/8、缺同版正式审查；「简短的大白话」叙述不由机器执笔（见 DER-06①） | T007 + 规则文档（交付环节见 †） |
| D-005② 归档形态兼容面 | 计划由报告事实层写独立新文件、不改 `stage-handoff` 形状且不写回 stage 记录；当前 T007 局部 8/8、缺同版正式审查，T008 尚无认证产物 | T007、§9（交付环节见 †） |
| D-005③ 一台产物还是两台 | 两台产物两个环节：P5/T008 仅计划为机器事实中途检查点；当前 T007 局部 8/8、缺同版正式审查、T008 blocked/not_done/G2，不能宣称已生成事实产物；P13/T024 独立最终 JSON/MD 后才由独立子代理执笔聊天叙述并由主会话原样贴出（DER-06③） | T007 + T008 + P13/T024 + 验收流程第 4 条（交付环节见 †） |
| D-006① 入口清单文件名、结构与消费者 | 见 DER-07 | T002 |
| D-006② 与 CARD-10 的接口冻结顺序（OPEN-006） | 见 DER-08：本卡先冻结三处接口面，其余卡在其上对齐 | §9 + 三处落点 |
| D-006③ CI 接线做到哪一步 | 本卡不做，记 `N/A + reason`（无 CI 配置文件），owner=后续卡（DER-09） | §12.3 覆盖限制清单 |
| D-007① 规则逐条文本 | 见 DER-01（逐条规则文本落 T001） | 规则文档 |
| D-007② 单文件数字上限 | 见 DER-03（建议 500/800，只报不拦） | 规则文档 |
| D-007③ runtime/ 是否该有就近测试 | 用户裁定「甲 就近共置」（CLARIFY-BP-001）；见 DER-02 | `vitest.config.mjs`、两个就近测试 |
| D-007④ runtime/ 与 tools/ 覆盖率未知 | 见 DER-04（覆盖率路线记 `N/A + reason`，如实披露） | 规则文档 + 报告事实层 |
| D-007⑤ 数字修正与 repository-inventory 断言联动 | 由 build-code 在 T004 完成（先改断言后改数字） | T004 |
| D-008① 规则落点的真正承接 | 由本卡 T001 承接（规则文本、命名、口径、provenance、报告事实层规则） | T001 |

† D-005 分段：**P5/T008 当前 blocked/not_done/G2**（T007 局部 8/8、缺同版正式审查，未有同次私有结果及独立来源认证单）；仅在 T007 当前实现完成同版审查、T008 同次私有结果与认证单经核验后，才可设计真实 P5 三文件中途检查点。旧名 `T008-delivery.txt` 只是冻结结构 gate 的兼容路径，最多本地未认证索引，不是来源/快照收据。真正全相位最终交付由依赖 P11/P12 的 **P13/T024** 持卡（独立 `final-aggregate.json`/`final-aggregate.md`/`T024-delivery.json`，未参与实现者执笔、主会话原样贴出）。旧收口行不代表 P5 已完成最终交付。

### 12.2 风险表

**当前口径（2026-09-27）**：下表保留 2026-09-23 决策与 2026-09-26 合并前后的失败来源；其中写着“本卡不改 runtime”“归档路径未修”“d1 读回仍阻断”的旧行是历史时点，不再是当前写面限制。P6/T013 两处修复的原三文件门现 24/24，P6/T014 d1 私有读回与 7/7 定向测试通过；它们只证明局部修复，AC-25/26 和 P6 仍 incomplete。当前精确写面、剩余缺口和原件以 P6 的 2026-09-27 修订及 `quality/evidence/stage-quality/build-code/P6/` 为准；未在该修订中认领的 stage/review 代码继续只读。

| 风险/未决 | 影响 | 缓解/归属 |
|-----------|------|-----------|
| **D-009..D-014 未交付（本轮首要风险）** | 旧 P1..P7 的报告、库存文档与若干测试可绿，但无法自动覆盖六项真实业务结果；P13 报告 GREEN 即使将来达成也不能洗绿功能相位 | FR/AC-29..34 的 P8..P12 功能与 P13/T024 最终真实事实聚合均只是待 build-plan 确认的要求；真实消费者/负控/授权/逐例原件逐项核实，P6/T012 动态夹具报告缺失 G2、P10/P11 STOP/未证明须在 P13 标 reason/owner，不得记全卡 pass |
| **CARD-05 在 HEAD `35a881ac` 未证明 landed；受保护 `runtime/stage/**` / `runtime/review/**` 写面** | B2 可信任务起点与 runner 身份可能需触及旧跨卡占有范围，若沿用历史越界授权产生政策覆盖冲突 | 先核实 CARD-05 是否真实落库、就现有 consumer 采失败负控；仅有必要且最小修法/owner/测试/替代及删除条件明确时按 R-018 提出**另行权限与独立审查**，本次规格改动零代码授权 |
| 双向库存也可能同时遗漏旧业务/测试，或 Task 起点不可信 | 空集/干净 worktree/假业务覆盖被误判全绿 | case 有版本业务规则/消费者，独立库存反查，并用 task-start commit/tree 含 committed/staged/dirty/untracked 当前快照；无可靠关系/身份记 unknown_change_scope 或未盘点，不能 pass |
| 假实际执行/绿但业务错/修复覆盖旧失败 | AC/结构/风险误判与 provenance 丢失 | runner 全量身份含 skip/0、真实服务/网络/控制台与业务 oracle 负控，失败原件和修复后新快照/邻近回归并存；verify-code 独立语义抽样和授权者最终接受/拒绝/延期分开登记 |
| T006 触及 stage-runner 报告路径 | 报告路径回归 | 就近单测 + 负控；绑定最终 review 后冻结 |
| T007 报告事实层与既有归档形状冲突 | 归档兼容面 | 新文件承载、`schema_version` 显式、不改 `stage-handoff`；就近单测覆盖缺字段失败语义 |
| 基线数字未来再漂移 | 断言口径失效 | 断言口径改为「数字为真」，漂移即红 |
| 76,075 / 76,248 / 历史 76,664 与冻结测试编辑后实测 76,666 并存（detail 审查 #24 与 P2/T004 新证据） | 时点/分母口径不清 | T004 在 caliber 字段写明当期 `buildReport()` 内存测量口径并同步 actual/delta；76,664 仅为修改测试前历史，不再冒充当前真值；未来漂移再测，不硬编码测试预期 |
| OI-001..OI-017 跨卡交接 | 本卡不关 | 阶段末报告逐条点名归属（CARD-05/06/07/10） |
| P13 聚合旧冻结合同对 P1 纯文档 gate 强制要求非空 runner `test_ids`（旧字节存 `quality/evidence/prewritten-red/P13-T024-pre-nonrunner-test.mjs`） | P1 实际是 `node -e` 文档检查 + `git ls-files`，无 runner 测试身份；旧合同无法诚实表达 P1 passed；把 P1 标为未通过而使报告结构 GREEN 也不能宣称 P1/全卡 GREEN | owner=CARD-04 build-plan 及独立测试审查者；用户已限权许可仅修订 P1 身份断言，旧测试/RED 已原字节备份，当前目标以 `kind=command_checks` 和真实 `check_ids`、命令/exit/raw output/任务快照替代假 runner ID；独立复审和重采修订 RED 未完成前仍 G2，不得用报告结构绿掩盖 |
| P5 中途检查点被误当最终报告、T008 未认证索引被误称来源收据，或 P13 原件错绑/漏报非通过状态 | 提前宣称全相位完成，P6/T012/P10/P11 旧 G2 或 STOP 被洗绿 | P5/T008 `T008-delivery.txt` 仅为兼容 gate 的本地未认证索引，不是 provenance 收据；P13/T024 独占最终三文件并对 P1..P12 当前 gate/Task/canonical 来源逐项核对，未知列 reason/owner、总体不得 pass；其 RED 仅验证合同可失败，未来 GREEN 仍需异源审查 |
| 独立子代理执笔报告做不到 | D-005 最终交付违约 | P13/T024 登记未交付/`unavailable` 与来源及 owner，`T024-delivery.json` 不虚填作者、贴出时间或原文，主会话不得自写自贴冒充；P5 的 `coverage_limits` 不冒充叙述已完成 |
| （历史基线）wh-review 派发被阻断（`REVIEW_HISTORY_UNAVAILABLE`：make-decision 红蓝对 `d1fd1157` 的 pair 摘要记 blue `semantic_status=available`，HEAD 读取器对 terminal=unavailable 的尝试算出 `unavailable`，`runtime/review/review-record-route.mjs:1180` 判定失败、`:1229` 汇总为 `canonical review pair member binding is invalid`，`dispatches=0`） | 本任务后续所有 wh-review 派发（build-plan/build-code/verify-code）都在派发前被阻断 | 运行时历史兼容缺陷：用户 2026-09-23 先授权本卡内修复（§5.2 P6-B），同日第二轮裁定 `overlap=甲`/`sequence=CARD-05 先落库` 后**改为让出给 CARD-05**；本卡 P6/T014 只做政策消费核验与跨卡风险登记（FR-25/AC-25），原始复现保全在 `quality/evidence/prewritten-red/P6-T014-reader-defect-repro.txt`，根因与最小改动集见 `quality/reviews/a5-review-writer-design-20260923.md`；修复落地前按 SD-08/FR-25 采用一次由未参与实现者完成的独立替代审查并保留来源与缺口，替代也不可用则记 `unverified` 并如实披露，不冒充已审。**2026-09-26 合并后更新**：CARD-05 已落地修复（`runtime/review/review-record-route.mjs:1124-1132` 容忍历史缺 `result_ref` 记录、`:1223-1225` foreign pair 省略不阻断、`:1257` 当前命名空间 fail-closed 保留），T014 同 gate 实测 6 passed GREEN，本任务后续 wh-review 派发（build-plan/build-code/verify-code，路由 `review --action=record`）不再被阻断 |
| （历史基线）跨卡重叠：本卡 P6 与 CARD-05 同改 `runtime/stage/**` 与 `runtime/review/**`（同 base `35a881ac` 的两个 worktree） | 双方实现互相覆盖或政策冲突（实测 CARD-05 已暂存 `runtime/review/review-record-route.mjs:1208-1211` foreign 跳过、未暂存 `:1728-1740` 覆盖规则放宽） | 用户 2026-09-23 裁定 `overlap=甲`：本卡让出实现、只做互补面；P6 写集不含任何 `runtime/**` 文件（`git status --porcelain` 佐证），T013/T014 改为消费/核验 + 风险登记；撤回项与移交对象见 §12.3。附带复刻实测（子代理 2026-09-23，在 HEAD 副本上只打 CARD-05 的两个已写 hunk）：其**未暂存** hunk2（`hasDeclaredQuorum` 覆盖规则放宽）会让 CARD-05 自己未跟踪的 `tests/review/review-foreign-pair-history.test.mjs` it1 失败（`expected 'quality/reviews/results/make-decision…' to be null`）——即其当前工作区内部尚不一致，如实登记供 CARD-05 处理，本卡不代改。**2026-09-26 合并后更新**：CARD-05 已落地（HEAD ef920f1f），上述未暂存不一致未随落库出现——合并后 `tests/review/review-history-canonical-reader.test.mjs` 实测 6 passed GREEN（合并前 RED 2F/4P） |
| （历史基线）CARD-05 把 build-plan 移出普查通道（其 `runtime/stage/stage-content-contracts.mjs:6410-6476` 提前 return、`:6502` 收窄为 `postBuildCode`） | 本卡 T013 若按 `stage="build-plan"` 入口核验，CARD-05 落库后该通道永不产出普查诊断 ⇒ 无法在不改 CARD-05 文件的前提下变绿 | T013 改为消费 CARD-05 保留的 `build-code` + `activation_cohort=post` + 非空 `task_id` 通道（逐条投影 `:6510` 在该分支仍生效）；落地形态不符则按 STOP 记 `not_done` + owner=CARD-05；是否要求 CARD-05 在 build-plan 侧保留机器可读普查账本，作为回 make-decision 的增量决策项上报（A-6）。**2026-09-26 合并后更新**：已按预期落地——build-plan 通道移出普查（final-spec-analyze report-only）、build-code 通道保留逐条投影，T013 通道假设成立；但零条目守卫未修（见下行），T013 仍按 STOP 记 `not_done` + owner=CARD-05 |
| **零条目守卫吞掉普查逐条诊断**（实测：`census.status==="present"` 且 `entries.length===0` 时，合并前 HEAD 35a881ac `runtime/stage/stage-content-contracts.mjs:6422` 进分公司分支、`:6423-6425` 推一条笼统错误并跳过 else，`:6429-6430` 的逐条投影永不执行；CARD-05 落地后同构守卫平移至 `:6497`/`:6498-6500`/`:6503+`，逐行同构**未修**，A-8 未消解） | 诊断被吞成一条通用错（D-001/D-004 诚实性缺口）；本卡 P6/T013 的核验在 CARD-05 落库后**仍会红**，其 GREEN 依赖生产侧修法 | 修法（一处）：`status==="present"` 时先逐条投影 `census.errors`，仅当零条目再补笼统错误。修法位点在 CARD-05 保留的 build-code 普查分支内 ⇒ owner=CARD-05（本卡按 `overlap=甲` 不写 `runtime/**`）；本卡保留 RED 作为真实缺口证据（`quality/evidence/prewritten-red/P6-T013-spec-analyze-red.txt` 与 `P6-T013-channel-probe.txt`），并在 T013 按 STOP 如实记 `not_done` + owner；是否授权本卡在 CARD-05 落库后补这一处修复，作为增量决策项 A-8 上报（邻接实测：材料保留 `## 逐字声明层（verbatim）` 使 entries=1 时，HEAD 与 CARD-05 都已逐条投影 4 条互异消息 ⇒ 缺口在守卫而非路由） |
| F-04：`workflows/build-plan` 步骤层缺「携带上游编号账本」要求 | 规则层无 owner，未来卡可能重现同一遗漏 | 本卡不写 `workflows/**`（新增投入须先确认）；**owner=CARD-05**（实测其工作区 `workflows/build-plan/SKILL.md` 已 staged 修改（git status porcelain 显示 modified）；本卡零 `workflows/**` 写入面）；作为增量决策项 A-6 上报（用户 2026-09-23 裁定 `a-items=甲`：四条全部带回 make-decision）并在 §12.3 如实登记 |
| F-07：两条无卡认领的真实行为（`status --action=begin --stage=make-decision` 的 `required_materials=[]`；缺 `phases/index.md` 时 `run --action=execute --stage=build-plan` 抛未处理 ENOENT，守卫在 `runtime/stage/stage-context.mjs`） | 真实缺陷无人修 | 以 `[观测/非断言]` 原文留在 T012 的 RED 证据中，如实登记；是否新增卡修复作为增量决策项 A-7 上报 |
| ADR 编号碰撞：本卡 `docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md` 与 CARD-05 `docs/adr/0032-review-chain-delegation-and-layer-contract.md` 同为 0032（**2026-09-26 合并后碰撞已成现实**：CARD-05 的 0032 已 tracked，本卡 0032 仍 untracked；P1 gate 按精确路径 `git ls-files` 机械安全，不受影响） | 编号冲突、引用歧义 | 本卡不改号（改号将影响已落材料与 ADR 引用）；如实登记，由后续卡统一改号（0032 已被两文件占用，改号须用 **0033+**）；P6/T014 的登记断言包含该行 |
| （历史基线）A-9：tracked 测试在入口发布提交上即读不到归档后的卡材料（`tests/contract/post-spec-analyze-original-source.test.mjs:59` 读 `specs/workflowhub-thin-core-card-07-20260919/spec.md`，而 `35a881ac` 本身就是 `archive specs/workflowhub-thin-core-card-07-20260919` ⇒ `ENOENT`） | `npm test` 在 HEAD 上本就带这条红；本卡 T013 的 gate 因此无法「三条命令全绿」 | 本卡不修（不在 P6 写集与架构边界内，且属归档提交遗留）：T013 归因可证「红因不变、非本卡引入」，但三文件 gate exit 0 在该红未由获授权 owner 修复前不可达，必须维持 `not_done/G2`；并作为增量决策项 A-9 上报（用户 2026-09-23 裁定 `a-items=甲`）决定归属；**owner=CARD-05**（CARD-05 已于 2026-09-26 落库：该测试被改写为以 `specs/workflowhub-thin-core-card-05-20260919` 为 root、不再引用 card-07 live 路径；但 ef920f1f 同时把 card-05 自身 specs 归档 ⇒ 该红**未消解**，转为 A-9′：同类 ENOENT、新路径，合并后实测 4 failed / 2 passed（失败点 `:10:24`/`:117:18`）；修法不变=一处路径改指 `specs/archive/…` 或改为夹具） |
| P7 生产者侧挂起：`runtime/stage/**` 的映射点（`stage-runner.mjs:1744`、`:2828`、`:2029-2038`、`:2950-2952` 与 `stage-handlers.mjs:626-628`、`:642-647`）属 CARD-05 写面 | 新枚举值在真实阶段尚不可产出 | P7/T015 只做「可表达性」（校验器 + 存储层）；生产者侧留待 CARD-05 落地后的跨卡工作，如实登记（见 §12.3 第 ⑥ 条） |

**2026-09-27 本卡 ADR 编号当前处置**：上表“本卡不改号、留后续卡”的风险行只记录当时状态。CARD-05 的 ADR-0032 已在 HEAD 跟踪，本卡新 ADR 现改为当前空闲的 ADR-0033；D-008 原始编号和旧审查/测试输出原样保留，P1 当前写面与命令以 `docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md` 为准。迁号只消除文件编号碰撞，不证明 P1 同版审查、正式质量事实或全卡完成。

### 12.3 覆盖限制清单（交付时进「没做到」清单）

**当前覆盖更新（2026-09-27）**：下列长条目保留旧决定和失败的时点证据，不得把其中“零 runtime 改动”“T013 未修”“缺 index 原始 ENOENT”“AC17–19 选择跳过”读成当前结论。D-015 已要求补做 AC17–19，P6/T025–T027 承担真实样例；P2、P3、P6 精确修订及局部测试见各 Phase 卡。当前 build-code 可继续同任务修复，但新版材料尚无正式确认，P5/P6/P10/P11/P13 与整卡仍未完成；旧原件和风险不删除。

- 本轮新增六项 FR/AC-29..34 目前只是已确认**方向及本规格验收定义**，并非通过事实；P8..P13/T017..T024 已编写 phase/index，但 P13/T024 当前仅预置最终聚合目标 RED（无最终 JSON/MD/交付 JSON 或聊天实绩），P6/T012 动态 fixture 报告仍缺失 G2，P10/P11 可实现负控与消费者/保护接线未通过；全部仍待真实代码、正式独立审查/单独 build-plan 人工确认及后续授权验收核对；CARD-05 已于 2026-09-26 经 main 合并落地（HEAD ef920f1f），其「foreign/旧 pair 省略不阻断」政策代码（`runtime/review/review-record-route.mjs`）已读码核实、`tests/contract/review-history-canonical-reader.test.mjs` 已由合并前 RED 2 failed|4 passed 转为 6 passed GREEN，但 CARD-05 业务验收与本卡 P6/T014 的逐项投影仍属 build-code 执行事实，不在本计划冒充完成。旧 P1..P7 材料、旧 wh-review 替代、预写 RED 及原代码定位均不能抹掉此缺口；材料期“不得开始 build-code”是旧时点限制。当前可按 P2/P3/P6 的精确同任务修订继续，未认领的受保护写面仍不得擅改，局部绿不等于全卡完成。
- **P13/P1 可执行合同窄修订状态**：旧冻结 `tests/contract/card04-final-aggregate.test.mjs` 错把 P1 Node/git gate 当 runner，强制非空 `test_ids`；用户限权许可的 P1 非 runner `check_ids` 窄修订，其目标 RED 已重采，异源只读复审仅确认命令回显与矛盾 EXIT 两项指定假绿防护，并非 canonical wh-review。P1 原始 gate 后续已有同次定向重跑原件；仍须按当次材料/树认证与完整独立审查裁决，不能据旧未核原件或窄结果称全卡 GREEN。P6 L0 `gate_cmd` 标签已修为可被 P13 正确解析，但不证明 P6 八文件 gate GREEN。
- **P5/P6/P13 分时限制**：P5/T007 局部 8/8、缺同版正式审查，P5/T008 blocked/not_done/G2，且没有经认证的 P5 来源事实；当前 T007 局部 8/8 后仍需同版审查，T008 同次私有结果和独立认证单经审查后，才可重新定义 T008 并考虑生成 `report-facts.json`/`report.md`。旧名 `T008-delivery.txt` 仅是冻结旧结构 gate 的兼容路径，不是正式产物、来源/快照收据或独立执笔交付；P6/T012 临时 fixture taskPath 动态报告缺失，T007 无自动发射接线，保持 not_done/G2，不能用工作树 P5 文件替代。P13/T024 虽已有定向可失败 RED（3 collected、2 target failed、1 passed），独立最终 `quality/evidence/stage-quality/build-code/P13/{final-aggregate.json,final-aggregate.md,T024-delivery.json}` 及原样聊天尚未发生；即使未来报告合同 GREEN，也不能把 P6、P10、P11 状态写成 pass，P12 授权者真实答复仍需独立核。
- **P5 报告读取的当前补界（2026-09-27）**：上一条 T007/T008“空壳/未接线”是历史时点；当前私有 T008 hook 与隔离夹具定向原件已存在，但 CARD-04 没有真实 P5 phase review、用户人工例外声明、build-code 阶段行或三份已认证报告，P5 仍 `not_done`。P5 evidence owner 只在现有 `runtime/evidence/freshness.mjs` 实施一个私有只读认证函数，唯一消费者=P6/T012 真实 E2E 和 P13/T024 最终聚合；等价现有读路经独立审查接管且历史证据保留时删除。先读固定 `report-facts.json` 完成标记，再核 delivery/certificate/source/report/facts 原字节、Task/材料/tree/阶段行、测试 output、review、质量 ref/hash 与 T007 重算；缺标记、坏证书、半写孤儿为 `missing`，不得凭 `report.md` 或交接文件存在宣称通过。P6 只增 P5 正例和负控，P13 冻结测试仅获 P5 消费断言窄修订；不建新 gate/status/公共 CLI。P11 真实页面仍 `unknown`。此材料修订会使 P8 第一 case 的 P6 `rule.revision` 与 `effect_observation.rule_revision` 暂时过期，须待材料稳定后由 P8 owner 核语义并同版同步目录与 move-map hash，不在本材料写面机械刷新。
- **P2 数字时点限制**：修改冻结测试目标以前实测 76664 仅历史；随后 `buildReport()` 内存实测 76666、旧 JSON 20292 对比得到目标 RED；2026-09-26 合并 CARD-05 后复测当前值 83996（同构 RED `expected 20292 to be 83996`，证据 `quality/evidence/prewritten-red/P2-T004-exact-gate-post-merge-red.txt`）。2026-09-27 发现旧冻结断言把 `within_limit=false` 写死且失去块外字节守卫，现按 P2 有界修订同时更新目标断言与真实 JSON；旧字节/RED 保留并重取同一精确门的当前证据。不直接运行会覆写 JSON 的报告脚本，也不把任何实测值硬编码成永恒真值。
- **P1/P3 门及 RED 真实性限制**：P1 phase gate 同一复合命令须同时核三文件内容与 `git ls-files --error-unmatch docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md` 跟踪事实，旧文档标记 GREEN 不证明 ADR tracked；P3/T005 仅隔离同提交 HEAD 基线跑字节相同冻结测试获目标断言 RED，再在当前工作树跑 GREEN，不 stash/切换共享脏工作区或以 import/setup 失败充数。
- AC-17 / AC-18 / AC-19：旧「乙」选择作为历史保留；用户在 D-015 已改选补做三项。AC-17/18 的只读/隐藏受限实施与同字节先红后绿再注错变红由 P6/T025–T026 的独立复核认可为窄样例；它们不是官方 wh-review、当前整项回归或真实页面证明。AC-19 的独立纯文档 Task 可失败检查由 `quality/evidence/stage-quality/build-code/P6/T027-current-independent-verdict-20260928.md`（SHA-256 `144e3b617ce586fe25d1bd264322431acfbd2dfa0cad1f17326373cc89e58010`）核为**样例层成立**；该 Task 的交付/关闭未完成，不属于 AC-19 样例前置。三项均不得以旧 `MISSING` 当完成豁免，P6 整相位和 CARD-04 仍 `incomplete`。
- 覆盖率路线：`N/A + reason`（未安装覆盖工具、零新依赖），见 DER-04。
- CI 接线：`N/A + reason`（仓库无 CI 配置文件），见 DER-09。
- wh-review：CARD-05 落地后派发阻断已消解，本卡 build-plan 合并审查已走 canonical wh-review（attempt `b0d645b6-bc4c-51c2-a45b-af3841d5adc4`，3 provider codex/luna+kimi/coding+pi/v4flash，结果 available，15 findings 已全部处置）；历史 SD-08 独立替代审查轮次仍作为有效证据保留、不作废（来源与缺口随审查记录保留）。
- 非 canonical 通道：make-decision 期 detail 审查（39 条）为 advisory，不作 canonical 通过。
- 预置测试与空壳（历史 provenance，DER-12）：`tests/contract/stage-runtime-material-check.test.mjs`（T005）、`runtime/stage/stage-runner.test.mjs`（T006）、`runtime/stage/stage-end-report.test.mjs`（T007）与 T007 的「行为空壳」`runtime/stage/stage-end-report.mjs` 均由 build-plan 阶段（材料作者，即本规格撰写者）写出并冻结，产出上下文=build-plan、实现者可访问面=可读可写但受卡面 DO NOT TOUCH 约束、独立判定者=未建立（如实记 incomplete）；三份预置测试的历史 RED 文件存在性与来源须逐一按当前可回读原件核对，空壳不构成任何验收证据，实现者须整体替换。其中 `runtime/stage/stage-end-report.test.mjs` 在 build-plan 期按用户 `a2=乙` 裁定**纯追加**两个 it（spec-analyze 判决逐条入账 + 通过时不得出现的负控），既有 it 逐字未改；历史 RED 数值互相矛盾且原件不可读：本卡曾声明 `Tests 7 failed | 1 passed (8)`，而 task-store 预置 RED README 另列 `6 tests / 5 failed`；被引 `quality/evidence/prewritten-red/P5-T007-report-facts-red.txt` 在已检查仓库与 task-store 目录均未找到，故 count、测试身份、run attribution 与 provenance 均未核实，不以任一数值作证据。
- P6/P7 预置测试（provenance，同上，**编号以本节为准**——材料修订期曾整体重排，旧版 provenance 行存在编号轮转错位，已按卡面实际归属修正）：`tests/contract/decision-log-census.test.mjs`（T009）、`tests/contract/upstream-coverage-ledger.test.mjs`（T010）、`tests/contract/oracle-mirror.test.mjs`（T011）、`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（T012）、`tests/contract/spec-analyze-truthfulness.test.mjs`（T013）、`tests/contract/review-history-canonical-reader.test.mjs`（T014）、`tests/contract/acceptance-result-machine-classes.test.mjs`（P7/T015）、`tests/contract/census-upstream-authoring.test.mjs`（P7/T016）同样由 build-plan 阶段写出并冻结（产出上下文=build-plan、独立判定者=未建立）。P6 的 11 份历史 `.txt` RED/探针及 README 位于外置 task-store `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/evidence/prewritten-red/`，README `:3-5` 明示为 build-plan 预置、非 canonical runtime evidence；本卡实审的 P6 六文件聚合与 T013 三命令/A-9 记录详见 P6 卡面的外置绝对路径。限定仓库与 task-store 搜索未发现 P6 build-code GREEN 文件，不据此推断从未在别处执行。P7 的预置 RED 目前只在 task-store README `:41-47` 有历史表格记录（T015 13 failed/15 passed，T016 5 failed/4 passed，phase 18 failed/38 passed），所列 P7 `.txt` 原件未在已检查的仓库或 task-store `quality/evidence/prewritten-red/` 路径找到；这些计数/身份/归因/来源仍未经原件核实，不称为可回读实测证据，也不推断从未执行。
- **相对作者边界的历史偏离（SD-09 三档结论=「接受但有偏离」，旧独立替代审查 F-08）**：此前材料阶段曾写三份预置测试、`runtime/stage/stage-end-report.mjs` 空壳及 `vitest.config.mjs` include；旧理由为 FR-18/SD-06 的有效 RED 与 CLARIFY-BP-001。此条仅保留 provenance/历史，不授权本轮 spec/phases 编写时新增生产/测试文件；本轮六项扩展须先单独 build-plan 确认，受保护生产写面尤其须另行获许可。
- **P6 历史跨卡重叠让出与撤回登记（用户 2026-09-23 第二轮裁定 `overlap=甲` / `sequence=CARD-05 先落库` / `a14=甲`）**：`runtime/review/**` 与 `runtime/stage/**` 原属 CARD-05 写面；用户先授权本卡内修复（§5.2 P6-B），同日第二轮裁定改为**让出重叠实现、只做互补部分**。撤回项：① canonical 评审历史读取器修复（`runtime/review/review-record-route.mjs:1177` 判别式、foreign pair 豁免、写入侧覆盖规则 `hasDeclaredQuorum`）移交 CARD-05；② build-plan 普查门实现（`runtime/stage/stage-content-contracts.mjs` 的诊断逐条投影与锚点判定）与 `runtime/stage/stage-runner.mjs` 的状态映射一并让出。保留项：政策消费/核验（T013/T014）与风险登记（本节 + §12.2）。依据=用户裁定 P6-D；处置=本相位**零生产代码改动**（写集不含 `runtime/**`），撤回说明与复现证据保全在 `quality/evidence/prewritten-red/P6-T014-reader-defect-repro.txt` 与 `quality/reviews/a5-review-writer-design-20260923.md`，不声称 CARD-05 边界未被触碰。
- **P6 越界二（跨阶段材料，用户 2026-09-23 授权）**：`specs/workflowhub-thin-core-card-04-20260919/decision-log.md` 由 make-decision 阶段产出，post 的 build-plan 通常只读不改；用户裁定「按 P6 全面执行」后，P6/T009 只在该文件**末尾追加**三个普查小节（不修改既有任何一行，`git diff --numstat` 佐证只有新增行）。依据=用户裁定 P6-A；处置=追加内容全部复用既有逐字材料，不新增事实。
- **P6/P7 历史覆盖限制（如实登记，不声称通过）**：① oracle 只读镜像是**声明级 + 文件权限级**隔离（文件 `0444`、目录 `0555`），同一 OS 用户仍可 `chmod` 改回，宿主级隔离（不同用户/容器）未建立；② 真实 CLI 全链 E2E 只覆盖 CLI 子进程边界内的链路，不覆盖 UI、网络与真实模型评审；③ 评审历史读取器**修复已让出给 CARD-05**（本卡只做政策消费/核验与风险登记），因此本卡不保证评审派发最终成功——宿主 provider 与材料版本仍可能阻断，须如实登记 `unavailable`；CARD-05 的第三处 blocker（其 `runtime/review/canonical-review-result.mjs` 新增 `source_strength`/`findings=clusters`/`evidence_anchor_valid` 属无标记派生变更，会使全库 161 条历史 covered 记录在 `review-record-route.mjs:1182` 抛 `canonical review evidence is incomplete or changed`）已如实移交并登记；④ 上游覆盖账本的机器检查只判「有行 + 有落点记号」，落点是否真的交付该需求由 D-005 报告、独立审查与用户本人逐条人核；⑤ 语义级「是否真的覆盖」不自动判定，`validateStageSpecAnalyzeProfile` 对 covered 行无条件要求独立语义核验，本卡不消除该要求。
- **A-1/A-4 历史延后与增量项（用户 `a14=甲`「只做不冲突的面」）**：⑥ `runtime/stage/**` 的生产者侧映射点（`runtime/stage/stage-runner.mjs:1744`、`:2828`、`:2029-2038`、`:2950-2952` 与 `runtime/stage/stage-handlers.mjs:626-628`、`:642-647`）与 `skills/wh-review/scripts/ac-evidence-summary.mjs:181-187`/`:217-220` 的静默降级留待 CARD-05 落地后的跨卡工作；`quality-fact.v1` 层读不到机器判定类；P7/T016 的 M2 事实投影与 M3 status 可见性挂起；`runtime/stage/stage-end-report.mjs` 在 build-plan 期为空壳（实现归 P5/T007）。⑦ 两条**无卡认领**的真实行为（F-07）：`status --action=begin --stage=make-decision` 的 `required_materials=[]`；缺 `phases/index.md` 时 `run --action=execute --stage=build-plan` 抛未处理 ENOENT（守卫在 `runtime/stage/stage-context.mjs`）——以 `[观测/非断言]` 原文留在 T012 的 RED 证据中，是否新增卡修复作为增量决策项 A-7 上报。⑧ `workflows/build-plan` 步骤层缺「携带上游编号账本」要求（F-04），本卡不写 `workflows/**`，作为增量决策项 A-6 上报（**owner=CARD-05**：其工作区 `workflows/build-plan/SKILL.md` 已 staged 修改）。⑨ ADR 编号碰撞：本卡 `docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md` 与 CARD-05 `docs/adr/0032-review-chain-delegation-and-layer-contract.md` 同为 0032，本卡不改号，由后续卡统一改号。⑩ 上游编号命名空间观测：`OPEN-001..008` 的完整定义在 card-04 自己的 `decision-log.md:2056-2063`（**不是**上游编号，T010 账本按本卡本地未决项登记）；decision-log 原始 R-002（`:67`）及历史审查记录（`:1727`、`:1749`、`:1785`）曾把 SD-13 误标为「验收标准五段式」（母 PRD 的 SD-13 实为 build-prd 两个命名可检查交付项，`五段式` 在母 PRD 零命中）；此处只作为历史 provenance，现行映射已由 decision-log 末尾勘误及本 spec §5/§4 上游覆盖账本更正，不再称 `:1635`/`:1657` 为 SD-13 错引。⑪ 未接线 CI（用户 `a3=甲`）：真实 CLI E2E 已进 `npm run test:e2e` 与 `npm test` 聚合面，但仓库无 CI 配置文件（无 `.github/`、`.gitlab-ci.yml`、`.circleci/`），无人自动跑；如实登记，owner=后续卡。⑫ CARD-05 把 build-plan 移出普查通道：T013 的核验依赖其在 `build-code` 通道保留逐条投影（见 §12.2 对应风险行），落地形态不符时按 STOP 记 `not_done` + owner=CARD-05（2026-09-26 已落地：build-plan 通道确已移出普查、final-spec-analyze 为 report-only，但零条目守卫未修 ⇒ STOP 情形「落库后仍红、红因=零条目守卫」成立，T013 维持 `not_done` + owner=CARD-05）。⑬ **零条目守卫吞掉逐条诊断（增量决策项 A-8）**：实测 `census.status==="present"` 且 `entries.length===0` 时，合并前 HEAD 35a881ac `runtime/stage/stage-content-contracts.mjs:6423-6425` 推一条笼统错误并跳过 `:6429-6430` 的逐条投影；**CARD-05 已落库但未修**：合并后 HEAD ef920f1f 实测守卫平移至 `:6498-6500`、逐条投影 `:6503+` 仍被整体跳过（逐行同构，A-8 未消解）；本卡保留该 RED 作为真实缺口证据（`quality/evidence/prewritten-red/P6-T013-spec-analyze-red.txt`、`P6-T013-channel-probe.txt`），按 STOP 记 `not_done` + owner=CARD-05，是否授权本卡在 CARD-05 落库后补这一处修法（`status==="present"` 时先逐条投影 `census.errors`，零条目再补笼统错误）作为增量决策项 A-8 上报用户。⑭ **A-9：tracked 测试读归档后失效路径**——`tests/contract/post-spec-analyze-original-source.test.mjs:59` 读 live 路径 `specs/workflowhub-thin-core-card-07-20260919/spec.md`，而入口发布提交 `35a881ac` 即 `archive specs/workflowhub-thin-core-card-07-20260919`（真实文件在 `specs/archive/`）⇒ `ENOENT`：该红在 HEAD 本就存在、与本卡无关，本卡既不修也不声称其绿（T013 gate 按「红因不变」收口），修法（一处路径改指归档目录）是否在本卡或后续卡执行，作为增量决策项 A-9 上报用户（用户 2026-09-23 裁定 `a-items=甲`：全部带回 make-decision；**owner=CARD-05**——落库后此红**未消解**：CARD-05 已重写该测试且不再引用 card-07 live 路径，但新版改读 `specs/workflowhub-thin-core-card-05-20260919/` 而 card-05 自身已归档，同类 ENOENT 在新路径复现（A-9′，合并后实测 4 failed | 2 passed，失败点 `:10:24`/`:117:18`）；修法=一处路径改指 `specs/archive/…` 或改为夹具）。
- **预置测试冻结无机器痕迹（独立审查 §5 附带观测，已采纳登记）**：P6/P7 的八份预置测试与 `specs/workflowhub-thin-core-card-04-20260919/` 全部处于 untracked 状态（`git ls-files` 零命中），因此「冻结」只有各卡 DO NOT TOUCH 声明 + RED 证据头部的命令/时间/EXIT 记录，仓库层没有哈希或快照守卫（SD-17 禁止此类门禁）；实现期若有人改动预置测试，除人工逐字比对与 RED 重采外没有机器痕迹。

## 13. 业务影响与回归范围

- 旧 P1..P7 历史直接影响：`runtime/stage/stage-runner.mjs` 报告呈现、`runtime/stage/stage-end-report.mjs` 事实层、`tests/contract/repository-inventory.test.mjs` 断言口径、`vitest.config.mjs` 收集范围；旧定向测试见 Global Verification Strategy，不能从旧绿灯推出新增结果。
- 新增 B2 预期影响：每项目业务 case 索引及独立真实入口/测试身份库存、build-plan Task/Phase 计划矩阵与 build-code 可信任务起点/快照差分/安全自动选择/真实分层执行/逐例与 AC/结构/风险对账/同任务复测、verify-code 独立语义取样及既有授权者确认；真实浏览器服务、外部服务版本/权限、页面消费者及可能的设备实体均依适用性核对，故旧「无网络/外部服务影响」只适用于旧清单，不得用来排除新测试路线。
- 新增回归按实际产品/消费者/依赖差分选择影响区和邻近旧行为，只跑受影响的安全定向目标；无范围全量 vitest/npm test/test:safe 被 AGENTS.md 禁止（获用户/CI 明确要求的例外需记录原因与范围），本轮已对预写目标和来源账本运行限定测试以留 RED/校验原件，**没有**执行完整产品分层验收或 build-code；不得将限定检查结果当业务通过。零新增依赖、无新 gate/CI/stage；具体保护生产写面与授权待 CARD-05 落库、真实消费者及失败负控后单独决定。
