---
name: make-decision
description: 通过真实问答、适量调研和独立建议澄清产品方向，形成用户确认的决策。
version: 3.2.0
---

# Make Decision

## 目标与材料

把原始需求变成用户确认的方向，写入当前任务的 `decision-log.md`。本阶段负责 Talk、必要调研、Grill 与决策正文；后续 build-plan 负责规格澄清和实施设计。读取已有材料和原始来源即可开始，历史任务与旧审查只作背景。当前 post 任务使用 decision-log、spec、独立 Phase 文件及纯指针索引；历史材料只读，不重新启用 pre 工作流。

## 方法

1. `load-context`：先记录用户原话、痛点、任务类型、事实、假设、非目标和未决问题，含范围分诊：区分用户痛点、完整旅程、页面、数据状态和成功失败边界。任务类型不明或冲突时，只暂停依赖它的问题并澄清；不靠文件名或旧记录猜答案。规划任务只问会改变方向的问题，不在这十类里问：文件路径与文件面、函数名、字段名、算法、schema 形状、命令形态、入口参数形态、行号、代码片段、测试记录与实测记录；普通任务可问影响实现的细节。
   用户中途改变任务类型声明时，停止消费旧类型下的问题与产物，直到逐项按新类型重新处理。当前决策保留旧问题引用、重处理原因、新内容位置；只换 hash 或引用不算重处理。不为此新建 schema、控制面、类型状态或记录绑定。
   新日志使用 `skills/decision-log/templates/decision-log-template.md`；照抄形状，按当前真实来源写内容。逐字原文、需求索引明细、Talk 批次、grill、调研与审查处置明细外置到任务库根 `quality/evidence/decision-log-refs/`，已保存的原件引用原路径，主文档只留指针。U 块在 `## 需求变更记录` 用独立 `### U-001` 标题说明变更、来源及 V 原件定位；`## 原始需求` 引 U/V 与 ADR。每类事实只留一份原始件，缺来源写具体诊断；历史日志保持原文。
2. `outline-hypothesis-talk`：主会话通过真实 Talk 产出粗粒度大纲，含每块的「问题与边界」及「方向假设」。标明可修改假设和什么证据会推翻它；不作基线，不在此承诺范围或成本。模糊需求比较至少两个角度及有差异的候选，说明证据与取舍。
3. `research-and-diverge`：围绕大纲每块会改变方向的未知开展内部与外部研究，输入保留「大纲是待验证假设」。make-decision 使用 `skills/deep-research/SKILL.md` 的 R0–R5 契约：R0 生成缺口、R1 读一手文本、R2 受限并行深读、R3 三角验证、R4 写 research-report、R5 独立审查。跳过或不可用写真实原因，研究不替用户决定。Every completed research report must explicitly declare `candidates`；每个候选写摘要、证据绑定来源 ref、推荐（含拒绝）及理由，无候选写真实原因。Talk 从唯一 canonical report 读取这些事实，不用摘要或报告引用冒充候选交付。
4. `outline-revision-check`：研究结果逐块对照大纲假设，明确工作包清单或方向假设是否改变，判断保留、回改或推翻并写理由。产出修订后大纲；大部分假设被事实推翻时重新整理方案，保留旧判断和更改理由。
5. `outline-talk`：基于修订后大纲与调研，由主会话把重要方向问题交用户。一题一个决策轴，选项说明后果与风险；独立问题可合问，有依赖的等真实答复再问。真实询问、等待、用户回复后再继续；未答、旧答或推测不当成新答复，零问题合法。
6. `adversarial-direction-check`：轻量攻击方向是否过早锁定、隐藏前提及更小可逆路径。不设否决权，只产出带事实依据的风险清单；不能替用户选方向，也不增设机器门。
7. `direction-advice`：用 wh-review 独立审查方向与修订后大纲，不审细节；保留原始发现、provider、失败及覆盖限制，未变范围不为追空 findings 重派。The direction advice receives the current convergence_outline questions-only projection (IDs, categories, questions/unknowns and sources only, with displayed status open); answers, selected disposition, evidence and conclusions must not appear in it. Kill 权限是建议停止无效目标或违反硬约束的方向，由用户作停止决定；Recycle 权限是建议把可修补的假设、来源或选择缺口送回对应调研或方向 Talk。两项权限与判据缺失，不记审查通过；不可用不伪装通过，也不冻结同任务讨论。
8. `module-breadth-confirm`：全部模块命名，各用一到三句说明范围，列风险与优先级排序；取得用户的粗粒度真实确认并决定细化顺序，此处不进入细节。
9. `module-convergence`：逐模块澄清未决项，说明方案、替代、验收、后果与风险。输入保留 red/blue 争议清单，辩论未决项，不压成泛化摘要。普通细节可公开最小合理假设；方向或验收分歧交用户，选项不足回有边界的研究。中途新增需求时，在同一决策日志新增大纲模块，补齐调研、决策、方案与验收标准，不新增步骤。默认新增下游人读决策记录；仅新模块上下文传递闭包触及的旧决策记 `requires reassessment`。`context(p) = requirements(p) ∪ ⋃_{q≻p} solution(q)` 的 `≻` 是 `leadsTo` 传递闭包，此法来自单一学术提案；工程上从触及的最高抽象层向下级联。只追加信息用 amend，改变决定用 supersede 加双向人读链接，保留旧正文；不新增 runtime 状态或许可。
10. `detail-advice`：全部模块收敛后，对整体做一次 wh-review 细节审查，检查模块间一致性及缺口，不拆成逐模块审加整体审。detail 审查逐条 OI 核对终态字段（问题/成功标准、方向/范围/取舍、盲审发现/假设、剩余风险、被拒方案与未决项）是否有真实内容。Kill 权限是建议停止整体目标或范围无法成立的任务，由用户决定；Recycle 权限是建议将可修补的模块间缺口送回对应模块收敛。两项权限与判据缺失，不记审查通过。finding 逐项处置 fixed、rejected_invalid、accepted_risk 或 needs_human；方向或验收分歧交用户，其余有效问题在同任务修。严重问题若不修，展示具体损失并取得绑定风险的真实用户选择。正式确认前用 spec-analyze 准备完整一致性分析与必要修复，不替代确认后的核对。
11. `grill-with-docs`：grill 开头产出计划草案骨架，将细节决策加计划草案骨架作为质询输入。对照当前项目事实作真实交互挑战，问答由主会话执行，子代理只提供研究或问题建议；必要更新写回原日志。Grill 是窗口，不伪作独立审查，之后仍有写草稿、确认、核对与交接。
12. `write-decision-draft`：写完整决策草稿，保留原话、派生判断、来源、已确认/待确认/退役处置、风险和延期负责人。历史正文保留，更改追加理由；逐项核对原始需求，每项有可见处置，不能用文件、索引或审查建议代替语义覆盖。
13. `approve-decision`：展示完成上述准备的最终方向、范围、非目标、验收、风险、延期与发现处置，取得用户对展示内容的实际确认。拒绝或未答保持草稿，不把审查建议当用户答复，不重复询问已覆盖授权。高风险用户可见事项按 decision-log 模板 `### 质量边界` 的 `high_risk_fact` 格式记录具名分类来源，JSON 写在反引号内，模板是该事实形状的唯一正文来源；用户确认原件指向任务库根 `quality/evidence/human-confirmations/`。
14. `stage-end-spec-analyze`：用户确认后，只读核对原始需求、当前决策、真实问答、完整 Grill/审查、本次确认和已产生证据，确认材料对应用户所见决定。缺来源、遗漏、冲突与未执行如实披露；普通修复在当前任务继续，改变已确认方向、范围或验收时，先准备可审稿再取得该决定真实答复，不增加日常审批或机器门。
15. `stage-handoff`：主会话写人读交接，列当前材料、已做与未做、原件、风险及下游下一步。遗漏逐项记未启动、跳过、产物缺失或完成判据缺失；未确定是 unknown，执行者或工具缺席是 unavailable，`executor_absent` 只记不可用。产物存在不能替代完成判据，交接缺失只披露，不作为工作门。

## 使用技能与执行分工

按 `skill-deps.yaml` 的 name/path/trigger 直接读取所需方法。Talk、Grill、方向选择与确认由主会话负责；有边界的研究、草稿与独立审查按项目分工委派，重产物保存原件后回传短摘要和路径。方向/细节建议由独立上下文产生，实施者不自判质量；研究、审查、测试的不可用都保留真实原因。

## 人为门与审查点

- confirm：本阶段、build-plan 和 build-prd 收口时，记录用户对实际展示材料的真实答复；未答不算同意。
- authorize：只在 commit、push、merge、archive、cleanup 等不可逆 Git/交付动作前，使用 `runtime/interface/git-authorize.mjs`，执行前核对授权动作、分支与当前 HEAD；HEAD 不一致时拒绝消费旧记录；已有用户授权覆盖当前动作和范围时，按当前 HEAD 重新记录并消费，未覆盖的新增动作或范围才需用户决定。方向确认不授权这些动作，不能声称尚未发生的授权已经完成。
- 三个必留审查点：build-plan 的 wh-review 合并审查、build-code 每 Phase 的 OCR 审查、verify-code 终末 OCR 审查。本阶段方向/细节及 build-prd 文档建议仍由 wh-review 执行，不另建全 Phase 集成审查。

## 安全写入与收口

改动前用工作区/范围核对工具确认目标；需要写文件时使用安全原子写入，有共享记录冲突时使用记录锁。失败明确暴露，保留原始来源，不覆盖历史原件。当前材料说明做什么，实际执行写既有任务事实与质量记录，二者不互相代填。交接使用 `skills/stage-handoff/SKILL.md`，保存并报告该方法返回的实际不可变绝对路径；执行不是门，不要求固定复盘表或每步机器认证。正式阶段事实由现有公共流程负责，本方法不增加 writer、公共命令或生命周期对象。
