---
name: build-prd
description: 从已确认方向形成可展示的规划 PRD 和任务地图，经审查后取得用户确认。
version: 1.0.0
---

# Build PRD

## 目标与作者边界

这是一条可搬运的规划工作流，不新增正式开发 stage。消费父任务已确认方向与真实来源，展示任务地图，协调规格澄清/条件 UI 设计、文档建议和最终确认。`skills/spec-prd/SKILL.md` 是唯一 PRD 正文作者，只写同一 `prd.md`；本工作流不另写 PRD 正文，不创建 spec/plan/tasks，也不授权物理交付。规划 PRD 供后续任务消费，不是第五份当前材料。

## 方法

1. 读取当前父决策和必需来源，说明用户旅程、需求覆盖、非目标与未知项。来源或能力缺失写具体原因，不推断父确认或执行成功。按原 PRD 作者的完整来源与任务卡合同核旅程、表面、数据/状态、成功失败、权限、集成、取消恢复、竞态、非目标和延期证据；未观察写 unknown，不用 summary/title 填满来源。
2. 第一次调用 spec-prd 生成大纲与结果导向任务地图。作者消费其「User Stories — 角色、诉求与结果」方法，从原需求写真实角色、动机与用户结果并核完整旅程；未知来源保缺口，故事标题或技术层列表不代替完整故事。每条需求分到负责卡或给明确排除理由，展示实际稿件，未获真实答复保持草稿。
3. 主会话取得对已展示地图的真实答复；涉及 UI 时，使用现有 readiness/render 方法展示真实设计并说明来源与缺口，非 UI 写理由。用户针对旧稿、拒绝或未答时，不当成当前地图/设计已批准。依赖回复的后续内容先等答复；其它安全准备可以继续。
4. 地图和适用设计得到实际答复后，第二次调用同一 spec-prd 作者扩展成完整 PRD。保持同一决策、来源和地图语义；未知或冲突仍明确列出，不增加第二作者或第三次内容调用。本 caller 只有第一次地图与第二次详情两次实际内容调用；返回后的再次内容请求也按真实调用计，不能改称同一次或隐藏第三调用。需额外调用才能修的缺口交协调者说明影响，保持 draft，不自行突破限制；同次内容调用内只修受影响部分。
5. 展示第二次内容调用后的完整稿，借 wh-review 做文档建议并逐条处理发现。改稿后重新展示真正待确认的内容；保留审查来源、失败与限制。主会话用现有 confirm 取得对最终展示稿的真实答复，不以先前地图答复或 review 推断最终同意。版本指代不清、未展示、拒绝或未答保持 draft；不计算内容身份锁替用户做决定。
6. 分开报告来源、实际问答、文档审查、未知项、验收范围和交付事实。主会话执行 stage-handoff，写材料现状、已做与未做、证据、风险及子任务下一步；没有执行过的 host/provider/发布/物理交付不能填成完成。 `report-facts-and-handoff` 的人读交接仅 task_id、workflow、material_refs、reply_text、step_results、reflection_facts 六类信息：material_refs 列当前决策/PRD/附件的具名引用，reply_text 保留实际用户答复，step_results 与 reflection_facts 只列真实步骤结果与其引用。将普通 raw 原字节按任务指定具名路径保存并回读，写入或读回失败如实 unavailable；使用现有安全写入/记录窄工具，不另造 writer。旧契约职责标记 `reportFactsAndHandoff` 表示保存并交接、`readReflectionForReport` 表示读取实际复盘事实、`publishCanonicalRecord` 表示保存原件职责；这些名字不是当前可调用的 TaskKernel 函数，不恢复旧 kernel 或 fixture，不使用 SHA 内容寻址、材料质量绑定或相等门。本次 reflection 不是正式stage 复盘，不产生 close approval 或操作确认，不增加第三次内容调用。

地图覆盖完整用户旅程和每条需求。子任务只接最小读取集及自身材料，父任务和兄弟材料只读；不能由子任务触发父 close、移动或删除父/兄弟材料。边界偏离记录原范围、实际偏离与原因，交原 owner 处理，不造第二套进度或许可对象。

## 使用技能与人为门、审查点

按 `skill-deps.yaml` 直接读 spec-prd、wh-review 及人读 handoff 方法；需要 UI 时读现有 UI 方法，而不是新建内容作者、dispatcher 或审查系统。问答和确认由主会话执行，内容与有边界的研究可按项目分工委派，独立文档建议不由实施者自判。

confirm 用于 make-decision/build-plan/build-prd 收口，保存用户对实际展示内容的真实答复；此处的最终稿确认不是第三次内容调用。authorize 仅在不可逆 Git/交付动作前，通过 `runtime/interface/git-authorize.mjs` 核动作、分支和当前 HEAD；HEAD 不一致时拒绝消费旧记录，已有用户授权覆盖动作和范围时按当前 HEAD 重新记录并消费，未覆盖的新增动作或范围才需用户决定；阶段确认不授权 commit/push/merge/archive/cleanup。三必留审查点为 build-plan wh-review 合并、build-code 每 Phase OCR、verify-code 终末 OCR；本工作流文档建议仍由 wh-review 按分工执行。

## 安全写入与收口

对目标材料先核工作区和写集，写入使用现有安全原子写方法；共享记录冲突使用记录锁，失败和来源缺失如实保留，原始报告只存单份。展示稿与真实答复让人能理解“批准了什么”，不通过机器认证或内容寻址包装制造成功。主会话按 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径；缺交接只报告，不当工作门或物理 close 授权。可总结经验，不要求固定机器复盘或绑定交接。正式阶段/规划事实仍由现有 owner 与公共流程负责，本方法不增加公共命令、schema 或存储对象。

真实 stage 末有过程问题时，主会话可读取并调用 `skills/stage-reflection/SKILL.md` 一次，消费有源候选、真实用户选择与未解项的方法；局部 Phase 摘要不触发 stage-end。复盘可跳过并说明原因，取消、缺会话源或不可用保原事实，既有持续授权不代候选采纳。stage-handoff 独立按其方法保存一份交接并定位已决定、已完成且验证、未完成、证据位置四类 source；不以复盘或交接成为继续工作的许可证，不重复每 Phase handoff 或建立机器复盘。

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；本 workflow 只保原步骤与分支调用，不复制规范。

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/to-spec/SKILL.md`（叙事与故事，由 spec-prd 唯一作者承接）；写作来源为 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs。固定来源是方法依据，不证明本次已获得行为效果。

本地保当前材料 owner、原步骤、真实用户回复、原失败与独立审查；只吸收适用方法，拒绝外置 tracker、GitHub ticket API、宿主 setup/Skill 硬依赖和第二进度权威。旧 bridge/外部 session 只读保历史 provenance，不作 active 执行、复盘、交接或 close 的门。方法接收真实项目材料、允许路径与宿主已批准的能力，缺源或能力如实报错，不绑定任务绝对路径或账号。迭代时核上述具名子文件的更新及更优候选，说明真实源差、本地偏离与采用理由，不自动追 HEAD。
