---
name: build-prd
description: 从已确认方向形成可展示的规划 PRD 和任务地图，经审查后取得用户确认。
version: 1.1.0
---

# Build PRD

## 内核接线

本阶段按 `skills/unit-kernel/SKILL.md` 同一版本引用共用规则，条文只在核心里改。

- 入口版本：v1.1.0（与 `skills/unit-kernel/SKILL.md` 同版）
- 消费条款：R1（一次审查周期）、R3（提问门槛）、R5（发现四态）、R8（PRD 单路终审）与决策流水线；分别用于第 3 步确认任务地图前的提问与第 5 步的一次文档审查与发现处置。第 3、5 步正文被 `tests/contract/ui-stage-build-prd.test.mjs` 锁定为基线逐字，故指针只在本节、正文不改；核条号时以本节为准。
- 阶段输出：同一 `prd.md` 的规划稿、两次内容调用产物、决策覆盖表与任务地图
- 冲突回报：与本内核冲突时以内核为准；内核缺条或条号对不上记具名缺口，回报内核 owner（`skills/unit-kernel/SKILL.md` 的维护者），不就地改写正文
- 升版顺序：先改内核正文并升版本，再同批改四处接线指针，最后逐处核四处同版与条号

方法条款：本阶段第 4 步写任务卡**必须走** `skills/task-maker/SKILL.md#expand-task-section` 的方法与产物判据；分节审查按 `:41` 的 `#sectional-review` 走（该技能「角色」节的执行者／审查者）：第 4 步开工前派执行者（**执行者即本阶段同一 PRD 作者，不另加第二作者**；做调研、设计、写任务卡）；卡节写完派审查者（审查者即两路只读读者，一路冷读、一路对抗，互不可见）。主会话只派发、落盘、核原件；**主会话不得自己写任务卡、不得自己代两路读者、不得自己处置分节发现**。本阶段正文只留步骤编号与产物，不另立第二套方法。任务拆包必须按 `skills/task-breakdown/SKILL.md#breakdown-method` 做：按一手来源定覆盖分母、逐条需求过拆包五问再切包，切完交每包人话卡；轻档同样。

## 目标与作者边界

这是一条可搬运的规划工作流，不新增正式开发 stage。消费父任务已确认方向与真实来源，展示任务地图，协调规格澄清/条件 UI 设计、文档建议和最终确认。`skills/spec-prd/SKILL.md` 是唯一 PRD 正文作者，只写同一 `prd.md`；本工作流不另写 PRD 正文，不创建 spec/plan/tasks，也不授权物理交付。规划 PRD 供后续任务消费，不是第五份当前材料。

### 全文审范围

全文审只在原五件事上增加跨卡核对，不增加第三次内容调用，不重开逐卡周期。

## 方法

写PRD前，先读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一正文，再调用本流程对应的材料作者；缺源如实 `unavailable`，保留原问答、确认、权限和失败边界，不复制规范。

1. 读取当前父决策和必需来源，逐条读父决策（本例 45 条，一条不漏）并产出决定清单；替换旧件时同时读旧件全文与旧卡清单。说明用户旅程、需求覆盖、非目标与未知项。写 PRD 前先读取 `skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」，不复述标准。来源或能力缺失写具体原因，不推断父确认或执行成功。按原 PRD 作者的完整来源与任务卡合同核旅程、表面、数据/状态、成功失败、权限、集成、取消恢复、竞态、非目标和延期证据；未观察写 unknown，不用 summary/title 填满来源。
   本步开工先读后端、接口、验收、代码改动四域的规则表（`specs/backend/README.md`、`specs/api/README.md`、`specs/acceptance/README.md`、`specs/code-changes/README.md`，见 `AGENTS.md#项目专业规范索引`），规则行用 `node <workflowhub 包根>/tools/cli/rule-tables.mjs lookup --domain <域> --root <项目根>` 取（与索引同口径，一处只留这一套，不重复执行），逐行核触发条件，把命中的规则名与正文锚点写进当前 Phase 卡的两行版本锚（「规则锚」「材料变更影响」；由独立审查者读，Phase 关闭时随卡归档）。每条命中写因此改了什么——动作、产物位置或命令；确实无可改的写「已符合」并给核对位置；写不出这条按未读处理。没有适用行时写查过的域与关键词、不适用理由与 owner；只写「已读规范」不算读。UI 任务另按 build-plan 第 5 步读设计/前端入口，本步不重复。
   按 `skills/knowledge-graph/SKILL.md` 实际进行本阶段开工调研：输入当前认证项目、已确认方向、原始需求和本次职责/允许写集，独立子代理按职责/source/consumer有界选完整ID与当前契约/历史两通道，再回origin原文核条件。主会话只收少数结论、来源与改变哪处产出或重复补强；图有界导航不自动带来收益。缺工具/坏图/无匹配/歧义保真实诊断并继续普通读源，现图查询不先更新，收费抽取仍先核精确范围/成本等真实答复。关键JSON/schema直接读原文件，不因图未覆盖自动扩图。
2. 第一次调用 spec-prd 生成大纲与结果导向任务地图，地图固定五列：任务、结果、依赖、波次、主承接需求；结果列只写用户可见结果，需求与决定的落点记在决策覆盖表；波次只排任务先后，不切作者。作者读取并执行 `skills/spec-prd/SKILL.md` 的「## User Stories — 角色、诉求与结果」，从原需求写真实角色、动机与用户结果并核完整旅程；未知来源保缺口，故事标题或技术层列表不代替完整故事。每条需求分到负责卡或给明确排除理由，展示实际稿件，未获真实答复保持草稿。
   UI 任务时，读决策记录「UI 范围与设计基准」五行卡，先写页面清单（页面、路由与组件），再排任务地图；需要设计才单列设计任务并在结果列写用户看得见的结果；前端底座只在跨多页或多任务时排，先用样例数据与统一数据接口把界面撑起来；有稿不排设计任务；单页且有设计稿不排设计任务、不排前端底座。非 UI 跳过。
   有稿任务在第 2 步记录判断前置：读 `judgment.md` 的结论、去向与负责人，把原件引用写进任务地图与决策覆盖表；判断正文由 build-plan 的 `judgment.md` 作者唯一写，本工作流不另建 PRD 权威。缺判断、结论为不能用或等待确认时，只记录缺口、负责人与恢复条件，不自行补写或绕过去向。判断只给有稿去向；后续提炼、移植、数据接线、机器校验与目视入口沿 `skills/design-source-extraction/SKILL.md` 的「新页面八步流程」，设计源变化沿「设计稿更新后怎么同步」，反复出现的坑对照 `references/anti-patterns.md`。这里只留条件指针，不复制正文，也不改本工作流步骤编号。
3. 主会话取得对已展示地图的真实答复；涉及 UI 时，使用现有 readiness/render 方法展示真实设计并说明来源与缺口，非 UI 写理由。用户针对旧稿、拒绝或未答时，不当成当前地图/设计已批准。依赖回复的后续内容先等答复；其它安全准备可以继续。
4. 地图和适用设计得到实际答复后，第二次调用同一 spec-prd 作者扩展成完整 PRD。同一作者同一批产出决策覆盖表（行按 `decision-log.md` 六节实有项逐条列，落点为空即未完成）；整理覆盖表算同批产出，不是第三次内容调用。整个 PRD 文件由一个作者写，不按波次切作者，也不增加第二作者。保持同一决策、来源和地图语义；未知或冲突仍明确列出，不增加第二作者，也不增加第三次内容调用。本 caller 只有第一次地图与第二次详情两次实际内容调用；返回后的再次内容请求也按真实调用计，不能改称同一次或隐藏第三调用。需额外调用才能修的缺口交协调者说明影响，保持 draft，不自行突破限制；同次内容调用内只修受影响部分。
   UI 任务时，按五行卡更新页面清单，并为每个 UI 任务补逐任务接线、视觉、组件三段：逐任务接线写清改哪些页面区域、哪些数据从假数据换真数据或哪些动作从假动作换真动作、后台值变化时页面是否跟着变、后台失败显示什么失败态；视觉写视觉还原验收，对照哪个设计源与视口、哪些项算还原、差异与偏差怎么记录；组件写组件复用与沉淀，复用哪些既有组件、新组件怎么沉淀到该域规则表登记的锚点（先登记表行再写正文，不改 AGENTS 指针以外位置）；build-prd 不写目标项目，缺表记 `rule_table absent` 与 init 命令；设计偏差处置写差异由谁确认、不通过时回哪一步。页面数据清单由 PRD 作者另写一张，列出页面区域、数据来源、真假状态与失败态。非 UI 跳过。 第 4 步内的分节审**必须走** `skills/task-maker/SKILL.md#sectional-review` 执行：审查者（两路只读读者）看同一版本卡节并核同一卡节摘要（摘要算法只在 task-maker 单点定义），只读返回发现后由执行者在同一次内容调用内一次处置；主会话只派发、落盘、核原件，**主会话不得自己写任务卡、不得自己代两路读者、不得自己写分节审查结论**；不拿另一路冒通过，不另立审查节点，也不新增用户答复要求。
5. 完整稿完成后只做一次审查：由 wh-review 执行，审拆卡、实现可行性、范围、验收、旧件保真五件事，不审文件格式；审查材料必须包含 `decision_log`、旧件（替换旧件时）、`prd`（含附录 B 决策覆盖表）与 `task_map`；缺旧件记 incomplete，不写 pass；该次审查同时消费 `skills/knowledge-graph/SKILL.md` 的三类问题：模块职责与边界、既往决定及适用条件、失败教训；按真实source_file回源，把有效知识落到同一稿的范围/任务卡/验收边界，并指出具体多知道什么、哪条建议改变，重复则标补强。不得因此增加第三次内容调用或由caller另写PRD；新发现内容缺口沿原作者同次受影响修复/协调者处理，图不越过地图/详情真实答复。审验收时，验收判据不写比例、计数或零值；只能靠数数或比例判的不是验收。
   审查发现逐条处置后，重新展示真正待确认的最终稿；保留审查来源、失败与限制。主会话用现有 confirm 取得对最终展示稿的真实答复，不以先前地图答复或 review 推断最终同意。版本指代不清、未展示、拒绝或未答保持 draft；不计算内容身份锁替用户做决定。
6. 分开报告来源、实际问答、文档审查、未知项、验收范围和交付事实。主会话按 `skills/stage-reflection/SKILL.md`「方法」「用户选择后的归口」「判断词表与完成检查」执行阶段收口，内部发布并读回交接，列材料现状、已做与未做、证据、风险及子任务下一步；没有执行过的 host/provider/发布/物理交付不能填成完成。 `report-facts-and-handoff` 的人读交接仅 task_id、workflow、material_refs、reply_text、step_results、reflection_facts 六类信息：material_refs 列当前决策/PRD/附件的具名引用，reply_text 保留实际用户答复，step_results 与 reflection_facts 只列真实步骤结果与其引用。将普通 raw 原字节按任务指定具名路径保存并回读，写入或读回失败如实 unavailable；使用现有安全写入/记录窄工具，不另造 writer。旧契约职责标记 `reportFactsAndHandoff` 表示保存并交接、`readReflectionForReport` 表示读取实际复盘事实、`publishCanonicalRecord` 表示保存原件职责；这些名字不是当前可调用的 TaskKernel 函数，不恢复旧 kernel 或 fixture，不使用 SHA 内容寻址、材料质量绑定或相等门。本次 reflection 不是正式stage 复盘，不产生 close approval 或操作确认。阶段末沿 measure-main-agent-cost 真实session/start-ref续窗执行 --stage=build-prd --record，成本标签。材料未供unavailable，无审查事实no_stage_fact；读回27列、旧前缀/until，缺报行exit1与无记录分列，未齐incomplete。

第 1–6 步全程适用：地图覆盖完整用户旅程和每条需求。子任务只接最小读取集及自身材料，父任务和兄弟材料只读；不能由子任务触发父 close、移动或删除父/兄弟材料。边界偏离记录原范围、实际偏离与原因，交原 owner 处理，不造第二套进度或许可对象。

## 当前步怎么执行？

主会话从本阶段步骤表投影当前卡，只读本步和必要前置。
调用检查器时显式给任务根、材料根、阶段和当前步；跳过使用可核当前 Phase 或真实 HEAD。

`node tools/cli/check-stage-steps.mjs --stage=build-prd --step=N --card --task-path=<任务根> --material-root=<材料根> --phase=<当前Phase>`

指定步骤（第 4 步）先取 `--card` 返回的 `skill.file#skill.anchor`；非指定步骤才用 `workflows/build-prd/SKILL.md#<method_anchor>`。本步首次实际取技能正文前，按该实值把读取 argv 写成输入文件（JSON：`{"slug":"p1-skill-read","argv":["<node>","tools/cli/check-stage-steps.mjs","--read-step-skill=<按上一句取得的技能位置>","--stage=build-prd","--step=N","--task-path=<任务根>","--material-root=<材料根>","--commit=<真实 HEAD>"]}`），再交现有 `verify --action=execute`：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-prd --project=<项目> --task=<任务> --task-path=<任务根> --input=<输入文件>`。同次返回的 `receipt_ref` 是本次读取唯一身份，正文取同次返回的原输出；步骤检查追加 `--current-read-receipt=<receipt_ref>`；缺当次回执、路径或提交不符时本步记未判定，不报完成。旧回执只在存在更晚同步骤的成功捕获时才被拒；没有更晚件时会话不可区分，按报告 limits 记为能力边界。

卡给结果、进入与停止条件、最多三个读取位置、具名证据、自查命令和答复要求。
步骤表的稳定锚直达本步正文；指定步骤的读取位置以卡上的 `skill` 对象为准，非指定步骤才用本阶段 `SKILL.md#<method_anchor>`；前置原件可读只表示留痕，完成仍按本步原判据。
检查器经现有任务句柄保存普通原件；缺字段或当前身份不可读时不记录、不前进。
Phase 沿现有当前游标、索引、物理任务和材料提交核对；提交必须等于真实工作区 HEAD。
当前原件沿 facts 的本阶段 source、step_slug、实际 ref 逐件读回；目录只作导航。
收口读同一报告的 `closeout.gaps`，逐项披露未清缺口和恢复条件，记未完成。

## 使用技能与人为门、审查点

按 `skill-deps.yaml` 直接读 spec-prd、wh-review 及人读 handoff 方法；需要 UI 时读现有 UI 方法，而不是新建内容作者、dispatcher 或审查系统。审查素材清单固定四项：`decision_log`、旧件（替换旧件时）、`prd`（含附录 B 决策覆盖表）与 `task_map`；只给新件的审查不得称覆盖完整。问答和确认由主会话执行，内容与有边界的研究可按项目分工委派，独立文档建议不由实施者自判。

confirm 用于 make-decision/build-plan/build-prd 收口，保存用户对实际展示内容的真实答复；此处的最终稿确认不是第三次内容调用。authorize 仅在不可逆 Git/交付动作前，通过 `runtime/interface/git-authorize.mjs` 核动作、分支和当前 HEAD；HEAD 不一致时拒绝消费旧记录，已有用户授权覆盖动作和范围时按当前 HEAD 重新记录并消费，未覆盖的新增动作或范围才需用户决定；阶段确认不授权 commit/push/merge/archive/cleanup。三必留审查点为 build-plan wh-review 合并、build-code 每 Phase OCR、build-code 终末 OCR；本工作流文档建议仍由 wh-review 按分工执行。

## 安全写入与收口

最终稿实际确认后，实际读取并消费 `skills/stage-close/SKILL.md` 执行已有授权范围的共享收口，委派knowledge-graph更新后分别读回代码图/文档图和未更新理由；内容确认不授Git/归档/删除权，最终close仍展示实际结果、目标范围和具名例外取得一次真实范围确认。父决策/规划材料仍由子任务消费时具名保留，子任务不得close父/兄弟；方法缺失/失败明确unavailable交owner，不复制本地执行兜底。真实PR URL立即展示、同流继续已授权操作；质量、真实问答、正式facts与handoff仍归caller，实际结果不由CLI exit0代填。

对目标材料先核工作区和写集，写入使用现有安全原子写方法；共享记录冲突使用记录锁，失败和来源缺失如实保留，原始报告只存单份。展示稿与真实答复让人能理解“批准了什么”，不通过机器认证或内容寻址包装制造成功。主会话按 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径；交接必须实际执行并报告返回路径；缺失写清原因与影响，披露不代替完成，不当工作门或物理 close 授权。可总结经验，不要求固定机器复盘或绑定交接。正式阶段/规划事实仍由现有 owner 与公共流程负责，本方法不增加公共命令、schema 或存储对象。

阶段末统一按收口方法执行一次；交接内容与独立读取沿 `skills/stage-handoff/SKILL.md`「信息来源」「回读结果」「结束条件与边界」，返回其实际不可变路径。局部 Phase 摘要不触发收口，原失败与缺口可见，持续授权不代候选采纳。

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；本 workflow 只保原步骤与分支调用，不复制规范。

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/to-spec/SKILL.md`（叙事与故事，由 spec-prd 唯一作者承接）；写作来源为 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs。固定来源是方法依据，不证明本次已获得行为效果。

本地保当前材料 owner、原步骤、真实用户回复、原失败与独立审查；只吸收适用方法，拒绝外置 tracker、GitHub ticket API、宿主 setup/Skill 硬依赖和第二进度权威。旧 bridge/外部 session 只读保历史 provenance，不作 active 执行、复盘、交接或 close 的门。方法接收真实项目材料、允许路径与宿主已批准的能力，缺源或能力如实报错，不绑定任务绝对路径或账号。
迭代本文件的固定来源时，读取 skills/stage-reflection/SKILL.md 的「固定来源、本地偏离与更新入口」节，以本文件上列具名来源应用该节更新方法；只在核到真实上游更新或更优候选时才决定采用，不自动追 HEAD。
