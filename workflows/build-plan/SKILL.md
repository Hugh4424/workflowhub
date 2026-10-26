---
name: build-plan
description: 把已确认方向写成产品规格和独立、可执行的 Phase 计划。
version: 4.1.0
---

# Build Plan

## 目标与边界

消费当前 `decision-log.md` 和真实需求来源，编写同一 `spec.md` 的产品规格与全局实现设计、独立 `phases/P<n>.md` 和纯指针 `phases/index.md`。索引不能替代 Phase 正文，post 不双写 plan/tasks；pre 历史材料只读。本阶段不重新进行方向 Talk/Grill，不替用户决定新方向，不实施生产代码。材料有歧义走本阶段 spec-clarify，方向变化回 make-decision；无关的安全规划可以继续。

## 方法

写spec、Phase 与 index前，先读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一正文，再调用本流程对应的材料作者；缺源如实 `unavailable`，保留原问答、确认、权限和失败边界，不复制规范。

1. 读取当前决策及已有材料，逐项提取需求、成功失败条件、非目标、约束、风险、已接受的不做事项和未决项。按 `skills/decision-log/templates/decision-log-template.md#外置事实索引` 的节级消费者定义，从当前主文取需求、写集、验收面、风险与未决项；到达条件满足时才沿原 ref 读证明或过程原件。保持需求到 FR、AC、Phase/Task、验证方法的双向可追溯；真实来源缺失就写缺口，不用旧审查或绿灯代填。
   在准备设计依据、作全局设计/测试蓝图选择前，按已确认方向和真实问题读取并执行 `skills/knowledge-graph/references/knowledge-reuse.md`：取得合法全文、比较并作四判，采用项定位到本spec设计/Phase选择及理由，未采用/待补证保范围与反例；不因确认过方向而跳过证据适用性判断。图导航按 `skills/knowledge-graph/SKILL.md` 实际进行本阶段开工调研：输入当前认证项目、已确认方向、原始需求和本次职责/允许写集，独立子代理按职责/source/consumer有界选完整ID与当前契约/历史两通道，再回origin原文核条件。主会话只收少数结论、来源与改变哪处产出或重复补强；图有界导航不自动带来收益。缺工具/坏图/无匹配/歧义保真实诊断并继续普通读源，现图查询不先更新，收费抽取仍先核精确范围/成本等真实答复。关键JSON/schema直接读原文件，不因图未覆盖自动扩图。当前已确认材料按真实范围消费，不为展示知识使用机械重写决策、规格或Phase；缺真实新规划问题就如实限定只读验证/受控草稿，不能冒已批准真实规划。
2. 按实现风险研究现有代码、真实消费者、接口和数据边界、权限、取消恢复、测试与回退方式。只调查会改变设计的问题；不必要或不可执行的研究写原因。有明确点状疑问时读取并执行 `skills/deep-research/SKILL.md` 的「轻研究 — 已收敛方向的点状问题」分支，消费它的真实内存结果或 skipped/unavailable 原因；发现母方向需改变交回 make-decision。方向研究仍沿该 owner 的深分支，不为轻问题强开深报告或复制第二研究规范。
   在本步原轻研究内再次按知识方法查模块职责/历史决定/失败教训，按source_file核当前真实消费者、接口与依赖/协作链；过期历史仅作背景，关键JSON契约直接读源。有效结论具体落到同一spec的设计边界或Phase切分及验收，注明相较原输入多知道什么/改变哪项；重复补强与无信号如实记，不另建研究账本，不让图代规格澄清、测试设计、独立审查或真实计划确认。
3. 通过 spec-clarify 澄清影响结果的规格歧义。独立问题合问，有依赖的等真实回复；主会话保存问题、真实答复和影响，未答不默认同意。不为规划另开方向 Talk 或第二决策日志。
4. 用 spec-specify 写产品叙事、用户旅程、状态与异常行为、FR 和唯一验收条款。明确每条验收的场景、可观察结果、通过和失败条件；保持 decision-log 的取舍与退役决定，不自动补做已经退出的需求。
5. UI 适用时沿 `skills/project-norm-init/SKILL.md` 的「规范职责」定位并读取本动作适用的专业源及实际页面/组件消费者；按类记真实路径/稳定节、version/作用域、owner/consumer、适用规则与缺源/冲突影响。读取等价实质源而非强制默认文件或旧 Design.md/Experience.md 两份 active 规范；本次业务行为仍沿当前 task spec/API、值/API事实引用原源。单类 missing/stale 不使其它类失效，缺口交该原 owner，不复制八类正文或新造 binding schema。需要时使用 project-norm-init、design-source-readiness、frontend-prototype-render 和设计审查方法。展示真实原型或标明预览缺失，不能把静态稿或截图名称当交互验证。非 UI 写原因，来源冲突保持 unknown；UI 选择在现有计划确认中呈现，不新建阶段或确认槽。 UI 适用性按三个来源的证据合并，不按调用者标签：`raw_requirement` 是用户原始页面/交互/非 UI 请求，`project_inventory` 是当前路由、前端技术与组件/消费者事实，`planned_or_changed_frontend_fact` 是已接受计划或实际前端改动；`source_reasons` 写显式事实，不新增必填字段。
   UI 且已有合法可读设计源时，完成 design-source-readiness 后读取 `skills/design-source-extraction/SKILL.md`，沿任务原 ref 消费单份机器产物 `design-source-extraction.json`（原件可带日期，不复制重命名）。将 `source`、`scope`、`norm_basis`、`items` 与实际证据用于本 spec 设计依据及 Phase 输入；声明、渲染值与待议规范分开。按 `references/norm-alignment.md`、`references/isolated-consumption.md` 对账与交接，不用模板占位或原型值当产品规范。核 `freshness` 与当前来源/规范/结构；unknown 补具名材料，stale 先沿已有 `node skills/design-source-extraction/scripts/collect-design-source.mjs --plan <已认证冻结plan>` 重提炼，未执行保未执行。非 UI 或无合法设计源说明适用范围与缺口，不给其它任务增加提炼门。
6. 全局设计与测试蓝图选择前，实际按 `skills/project-norm-init/SKILL.md` 的“非UI规范与索引”读取本次适用后端/接口/验收源；缺源/过期/冲突给原owner与影响，仅暂停依赖该规则的选择，其余继续，不把unknown记N/A。选择足够简单的方案：先复用，再窄扩展，确有真实收益才新机制。非平凡工作先手工完成一单元作为独立 oracle，再复用最小可重跑工具/委派方法处理同单元并逐项对照；标签须回到对应真实产物、输入与原判据，不能只比数量。worker允许写集排除自身验收契约与保留标签；实施后核这些原件未改，不能修改判据换绿，不声称仅有DO NOT TOUCH就已建立物理隔离；只冻结相关契约而非全树。简单动作直接完成，不造无消费者框架。用 spec-plan 在同一 spec 写全局接口、数据流、兼容、风险、回退和文件边界，再写独立 Phase。边界由可独立交付验收单元决定，写集是申报结果；同一并行批次须有独立输入且同路径互斥，跨批次同路径须有真实依赖边定序，在相邻 Phase 边界点名先写者、后写者与依据。共享接口变化先重排分工，不让两个代理同时改同一文件。 Phase 拆分粒度以 `spec-plan` 的 `phase-template.md`「判定规则」全集（拆与并两半）唯一为准，本 workflow 不复述、不软化。校验器报写集重复时，按 ADR-0036 消费既有治理文件豁免与已按 Dependency 串行的判定，核实际依赖与声明；原失败或缺口如实记 `open`，不为此改运行时规则或新增豁免种类。
7. 每条承接 AC 按 spec 模板与 Phase 卡的证据计划落七字段，七项取真实对象与时点，缺一项不得开工；不另建验收计划。为每个任务写清目标、真实输入/消费者、允许路径/符号、禁止范围、步骤、完成条件、失败信号与恢复办法、成本假设。testing-system-blueprint 设计风险、场景、oracle、证据与覆盖限制；项目在任务「测试标准」及每张 Phase/Task 自行声明测试面、逐面测或不测的理由，每个要测的面与覆盖 AC 指向该 Phase 一条可执行命令；浏览器可见面未列浏览器端到端时给具名理由。test-routing-advisor 只作技术路线预判，选择主 concrete testing skill，不替项目定义测试面。验收对象、输入、执行 owner 与时点按 `skills/spec-plan/SKILL.md` 的「Test design and quality」落进现 AC/Task 正文；需要对象检查时，读取 `skills/spec-specify/templates/spec-template.md` 中唯一 `checkAcceptanceObject` 的完整可执行代码块，从当前 spec 的既有验收对象区块取得真实输入，沿模板「验收对象」唯一合同复用第5步三源事实并实际读取其引用材料，核角色、理由与范围冲突，将三源适用性和已读材料作为本次 context 传给同一函数；直接执行验收对象检查并保存对象输入、三源引用/读取范围/hash、返回与执行原件，不在本 workflow 定义或复制另一个 checker。模板 producer 未交付、无法提取或执行失败时，具体记 producer/source/执行失败、影响与原 owner，未运行不宣缺项行为通过；对象检查不证明环境健康或业务运行。可执行产物按同节规划唯一末 Phase 全 AC 验收，纯文档按该处具名豁免。独立 Phase 写完后读取并执行 `skills/spec-plan/SKILL.md` 的「## Pure pointer index」生成纯指针索引；消费它按实际附件存在与 bundle 登记选择模板的条件，不新建薄调用或在此复制索引规范。执行进度留在任务事实而非材料正文。 每条需求在 spec 与 Task 卡必须落成「动作＋命令＋期望」三件套，缺任一不得进入 Task 卡、不得开工；命令写成可直接执行的整条命令，期望写退出码或可观察结果。开工前按 `skills/spec-plan/SKILL.md` 的红测归因要求写清每条红测属于目标行为失败、夹具或环境失败、本来就通过哪一种；只写命令与期望退出码不算写完。
8. 行为改动在实施前写有意义的目标测试并实跑 RED：命名目标断言失败才算目标 RED，收集、环境或配置失败另记。冻结评分逻辑，实施使用同一 oracle 做 GREEN；改变 oracle 先提出具体 test change request 并独立审查，旧字节和失败原件保留。纯方法/文档按 G-2 做可证伪读回或说明具体不适用理由，不造仪式性 RED。 按名改一个已先在 Phase 卡里点名的既有具名常量取值不触发 TCR（测试变更请求）；改断言表达式、期望方向、判定或评分逻辑仍须走既有 test change request 与独立审查。冻结 oracle 的单一来源是该 Phase 卡的预写测试与 `DO NOT TOUCH` 声明，按每任务声明一次；每次实际测试变更的来源是同卡「测试变更请求」字段加一份独立审查原件，变更后 oracle 身份（`ORACLE-…`）保持不变，不另立账本、不复制镜像、不按每个 oracle 另记一次账。免 TCR 只区分期望值来源与断言变更，不扩大写权限或任务授权，不降低断言强度、不取消独立审查、不改变 `DO NOT TOUCH` 的物理隔离要求。 AC 或冻结测试的改动必须取得用户真实答复并保留原件（ref 与原文），方案作者不得单方放宽；审查建议、findings 与 agent 推测都不算用户答复。
9. 在 Phase 审查前，自查每条承接 AC 的七字段与 incomplete 记录，缺项进本轮盘点事实；incomplete 必须带真实尝试 ref、阻塞条件、提供者与恢复条件。逐 Phase/Task 自查项目声明的测试面是否适合结果与写集、oracle 是否能证伪、测或不测的理由是否有源；按 `skills/spec-plan/SKILL.md#Test design and quality` 逐条件核输入与时点，遗漏与未知逐项定位。对当前规格和 Phase 做一次 wh-review 合并审查。simplicity-guard、plan-eng-review 等 lens 看同一材料，发现由独立上下文产生，不成为额外固定审查轮。保留原始 findings、实际 provider、失败和覆盖限制，不把 unavailable 写成空 findings 或通过。组包者将第5步已核的三来源事实作为普通可选内容放入 `context_map.ui_applicability`，三项键为 `raw_requirement`、`project_inventory`、`planned_or_changed_frontend_fact`，每项用 `{ui_scope: true|false|null, source_ref: "材料key或key#/JSON-pointer", reason: "实际来源理由"}` 描述当前审查范围。库存正文放同一 `context_map.project_inventory`；原要求引用 `raw_requirement`，库存引用 `context_map#/project_inventory`，已接受计划引用 `draft_spec`（pre 为 `approved_spec`）或 `phase_authorities#/phases~1P1.md` 等实际相对成员。引用只定位本包已提交材料，不读包外路径；理由由审查者核合理性，不以字段可读认证真值。缺源或尚有范围矛盾时该项写 null 并说明未知，旧包缺这些内容仍正常审查：默认 review、simplicity-guard、plan-eng-review 三 lens，指令显出缺口而不当非 UI/N/A；三项均有效且非 null 时任一 true 才加同包 plan-design-review，全部 false 才省该 UI lens。直接调用与保存恢复沿同份材料选择，调用者标签不覆盖事实，不新增字段必填门、审查轮或用户确认。 逐 Phase/Task 核三件套是否齐、每条红测归因是否写明，缺项写进本轮盘点事实，缺项未清不算自查完成。
10. 消费本次审查对测试面适用性、oracle 与理由的实际 findings；coverage unknown 保持未知，不用 Appendix 编号出现替代自查，也不新增审查轮。主会话逐条处置 fixed、rejected_invalid、accepted_risk 或 needs_human。有效设计问题回原作者修；严重问题若不修，向用户展示具体风险、影响和替代路径，取得真实选择并写负责人。未经实际处理不宣布计划已经完整。 findings 只作问题来源，判据或 AC 的改动仍须用户真实答复原件，不得以「审查同意」代替。
11. 逐项核对原始需求、决策、spec、每个 Phase 与索引的语义、边界与测试充分性，六类（遗漏、矛盾、孤儿任务、越界、消费者、测试充分性）各给落点或排除理由，缺一即本步未完成；用 spec-analyze 执行同一核对。分析是质量事实，不是推进许可证；缺失与失败继续保持可见。
12. 交接重叠路径时，先写者交回该路径已核实状态；无法回读写 unknown 与原因，不阻断，后写者在自己的 Phase 边界点名先写者与依据。范围核对只读取并引用目标项目自己声明的受保护类别；待授权改动在材料中保持 pending，列具体文件/符号、授权原文位置和缺哪一条确认，已有确认按原件消费。分别核「授权是否包含该改动」与「是否超出声明写集」，各引用既有普通核对原件，不新建 scope 对象。项目声明的受保护改动未获授权或越界时只停该处；纯文档、注释、测试夹具的越界按真实来源继续登记；项目未声明类别时只查一次、记未声明，继续范围明确的规划，不等待新清单。展示将做什么、Phase 分工、验证办法、发现处置、风险与下一步，取得用户对当前计划的实际确认。拒绝或未答保持草稿，继续同任务的安全修复；确认不能被审查结果或 agent 推测代替。计划真实确认后，由当前主会话按 `skills/stage-reflection/SKILL.md`「方法」「用户选择后的归口」「判断词表与完成检查」执行阶段收口，内部发布并读回交接；未答保草稿，不发布已确认计划的交接。 有待处理缺口时，确认问题按三选一提出：①按现有材料修完缺口再推进；②指派缺口负责人后推进；③取消本次执行。未答不等于默认继续。交接逐项披露未启动、跳过、产物缺失、完成判据缺失；未确定为 unknown，工具或执行者不可用为 unavailable，`executor_absent` 只记为不可用。产物存在不能替代完成判据。 展示时逐条列出仍缺三件套或判据改动无答复原件的项，未列齐不算已确认。

阶段收口中的成本：执行 `skills/stage-reflection/SKILL.md`「方法」第 3 步的 measure-main-agent-cost 入口及完整来源、窗口、失败和删除前留账边界；本阶段只在整个 stage 末触发一次，同一计量窗口不重复，不每 Phase 触发。

## UI 组件与真实消费者

第 5 步三来源合并且 ui_scope 为 true 时：读取 `skills/frontend-component-quality/SKILL.md` 的「## Component Quality Map」说明复用、改动或新增的真实消费者、状态 owner、typed ViewModel、单一 CSS/token owner、兼容影响及相应 story/test 更新。提取共享组件有至少两个真实消费者，删除有当前零消费证明；缺消费者、扫描、浏览器、数据、viewport 或 screenshot 记 unknown/unavailable，不当作零消费或完成。来源读取与分权沿第5步的同一记录，不再写第二份规范职责正文；必要变更只计划原专业 owner 更新，任务行为与执行事实保留各原 owner。规划设计检查，不替 build-code 执行前端或浏览器验收。

## 使用技能与人为门、审查点

按 `skill-deps.yaml` 直接读取方法；研究、Phase 草稿、RED 与独立审查依项目分工委派，主会话负责范围、用户问题和计划确认。技能缺失只记录其影响和覆盖限制，不另建调度器。

confirm 发生在 make-decision、build-plan 和 build-prd 收口，保留用户对实际展示材料的真实答复；本阶段的计划确认不授权 Git。不可逆动作前才使用 authorize，通过 `runtime/interface/git-authorize.mjs` 核动作、分支和当前 HEAD，HEAD 不一致时拒绝消费旧记录；已有用户授权覆盖动作和范围时，按当前 HEAD 重新记录并消费，仅未覆盖的新增动作或范围需用户决定。三审查点是本阶段 wh-review 合并、build-code 每 Phase OCR、verify-code 终末 OCR；make-decision/build-prd 的文档建议仍由 wh-review 按分工执行，不增加全 Phase 集成审查。

## 收口与安全

执行纪律：缺失即未完成；跨包不合批；确认与推进分开问，分诊、骨架与最终确认分别问；少打扰不等于跳过步骤。步骤证据位置以本阶段 `steps.json` 为指针，研究、审查、确认、测试和问答原件仍放既有位置，不在决策日志新增步骤节；问答原件开头写明批次类型。收口前运行 `node tools/cli/check-stage-steps.mjs --stage=build-plan --task-path=<任务目录>`，逐项消费判定与缺口；检查器只报告、退出 0，不证明完成。入口推荐行使用可解析字面，如 `- 推荐级别：复杂`；既有日志不回改，未命中就报“未读到级别事实”。

当前材料决定工作内容，测试、审查和历史不替代材料，也不是继续修复的许可证。写材料前核目标工作区与写集；原子写入失败明确报告，共享写入冲突用记录锁，原始来源与失败保留单份。阶段事实仍由现有公共流程处理，本方法不增加认证包装或永久状态。主会话执行 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径，说明材料现状、已做/未做、证据、风险及 build-code 下一步。handoff 必须实际执行并报告返回路径；缺失写清原因与影响，披露不代替完成，不要求固定机器复盘或逐步发布。

阶段末统一按收口方法执行一次；交接内容与独立读取沿 `skills/stage-handoff/SKILL.md`「信息来源」「回读结果」「结束条件与边界」，返回其实际不可变路径。局部 Phase 摘要不触发收口，原失败与缺口可见，持续授权不代候选采纳。

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；本 workflow 只保原步骤与分支调用，不复制规范。

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/to-spec/SKILL.md`、`to-tickets/SKILL.md` 与 `tdd/SKILL.md`（由 spec-specify/spec-plan 原 owner 承接）；写作来源为 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs。固定来源是方法依据，不证明本次已获得行为效果。

本地保当前材料 owner、原步骤、真实用户回复、原失败与独立审查；只吸收适用方法，拒绝外置 tracker、GitHub ticket API、宿主 setup/Skill 硬依赖和第二进度权威。旧 bridge/外部 session 只读保历史 provenance，不作 active 执行、复盘、交接或 close 的门。方法接收真实项目材料、允许路径与宿主已批准的能力，缺源或能力如实报错，不绑定任务绝对路径或账号。迭代时核上述具名子文件的更新及更优候选，说明真实源差、本地偏离与采用理由，不自动追 HEAD。
