---
name: build-plan
description: 把已确认方向写成产品规格和独立、可执行的 Phase 计划。
version: 4.1.0
---

# Build Plan

## 目标与边界

消费当前 `decision-log.md` 和真实需求来源，编写同一 `spec.md` 的产品规格与全局实现设计、独立 `phases/P<n>.md` 和纯指针 `phases/index.md`。索引不能替代 Phase 正文，post 不双写 plan/tasks；pre 历史材料只读。本阶段不重新进行方向 Talk/Grill，不替用户决定新方向，不实施生产代码。材料有歧义走本阶段 spec-clarify，方向变化回 make-decision；无关的安全规划可以继续。

## 方法

1. 读取当前决策及已有材料，逐项提取需求、成功失败条件、非目标、约束、风险、已接受的不做事项和未决项。按 `skills/decision-log/templates/decision-log-template.md#外置事实索引` 的节级消费者定义，从当前主文取需求、写集、验收面、风险与未决项；到达条件满足时才沿原 ref 读证明或过程原件。保持需求到 FR、AC、Phase/Task、验证方法的双向可追溯；真实来源缺失就写缺口，不用旧审查或绿灯代填。
2. 按实现风险研究现有代码、真实消费者、接口和数据边界、权限、取消恢复、测试与回退方式。只调查会改变设计的问题；不必要或不可执行的研究写原因。有明确点状疑问时读取并执行 `skills/deep-research/SKILL.md` 的「轻研究 — 已收敛方向的点状问题」分支，消费它的真实内存结果或 skipped/unavailable 原因；发现母方向需改变交回 make-decision。方向研究仍沿该 owner 的深分支，不为轻问题强开深报告或复制第二研究规范。
3. 通过 spec-clarify 澄清影响结果的规格歧义。独立问题合问，有依赖的等真实回复；主会话保存问题、真实答复和影响，未答不默认同意。不为规划另开方向 Talk 或第二决策日志。
4. 用 spec-specify 写产品叙事、用户旅程、状态与异常行为、FR 和唯一验收条款。明确每条验收的场景、可观察结果、通过和失败条件；保持 decision-log 的取舍与退役决定，不自动补做已经退出的需求。
5. UI 适用时读取当前 Design.md、Experience.md 和实际页面/组件消费者；需要时使用 ui-project-init、design-source-readiness、frontend-prototype-render 和设计审查方法。展示真实原型或标明预览缺失，不能把静态稿或截图名称当交互验证。非 UI 写原因，来源冲突保持 unknown；UI 选择在现有计划确认中呈现，不新建阶段或确认槽。 UI 适用性按三个来源的证据合并，不按调用者标签：`raw_requirement` 是用户原始页面/交互/非 UI 请求，`project_inventory` 是当前路由、前端技术与组件/消费者事实，`planned_or_changed_frontend_fact` 是已接受计划或实际前端改动；`source_reasons` 写显式事实，不新增必填字段。
6. 选择足够简单的方案：先复用，再窄扩展，确有真实收益才新机制。用 spec-plan 在同一 spec 写全局接口、数据流、兼容、风险、回退和文件边界，再写独立 Phase。边界由可独立交付验收单元决定，写集是申报结果；同一并行批次须有独立输入且同路径互斥，跨批次同路径须有真实依赖边定序，在相邻 Phase 边界点名先写者、后写者与依据。共享接口变化先重排分工，不让两个代理同时改同一文件。 Phase 拆分粒度以 `spec-plan` 的 `phase-template.md`「判定规则」全集（拆与并两半）唯一为准，本 workflow 不复述、不软化。校验器报写集重复时，按 ADR-0036 消费既有治理文件豁免与已按 Dependency 串行的判定，核实际依赖与声明；原失败或缺口如实记 `open`，不为此改运行时规则或新增豁免种类。
7. 为每个任务写清目标、真实输入/消费者、允许路径/符号、禁止范围、步骤、完成条件、失败信号与恢复办法、成本假设。testing-system-blueprint 设计风险、场景、oracle、证据与覆盖限制；项目在任务「测试标准」及每张 Phase/Task 自行声明测试面、逐面测或不测的理由，每个要测的面与覆盖 AC 指向该 Phase 一条可执行命令；浏览器可见面未列浏览器端到端时给具名理由。test-routing-advisor 只作技术路线预判，选择主 concrete testing skill，不替项目定义测试面。验收对象、输入、执行 owner 与时点按 `skills/spec-plan/SKILL.md` 的「Test design and quality」落进现 AC/Task 正文；可执行产物按同节规划唯一末 Phase 全 AC 验收，纯文档按该处具名豁免。独立 Phase 写完后读取并执行 `skills/spec-plan/SKILL.md` 的「## Pure pointer index」生成纯指针索引；消费它按实际附件存在与 bundle 登记选择模板的条件，不新建薄调用或在此复制索引规范。执行进度留在任务事实而非材料正文。
8. 行为改动在实施前写有意义的目标测试并实跑 RED：命名目标断言失败才算目标 RED，收集、环境或配置失败另记。冻结评分逻辑，实施使用同一 oracle 做 GREEN；改变 oracle 先提出具体 test change request 并独立审查，旧字节和失败原件保留。纯方法/文档按 G-2 做可证伪读回或说明具体不适用理由，不造仪式性 RED。
9. 在 Phase 审查前，逐 Phase/Task 自查项目声明的测试面是否适合结果与写集、oracle 是否能证伪、测或不测的理由是否有源；按 `skills/spec-plan/SKILL.md#Test design and quality` 逐条件核输入与时点，遗漏与未知逐项定位。对当前规格和 Phase 做一次 wh-review 合并审查。simplicity-guard、plan-eng-review 等 lens 看同一材料，发现由独立上下文产生，不成为额外固定审查轮。保留原始 findings、实际 provider、失败和覆盖限制，不把 unavailable 写成空 findings 或通过。组包者将第5步已核的三来源事实作为普通可选内容放入 `context_map.ui_applicability`，三项键为 `raw_requirement`、`project_inventory`、`planned_or_changed_frontend_fact`，每项用 `{ui_scope: true|false|null, source_ref: "材料key或key#/JSON-pointer", reason: "实际来源理由"}` 描述当前审查范围。库存正文放同一 `context_map.project_inventory`；原要求引用 `raw_requirement`，库存引用 `context_map#/project_inventory`，已接受计划引用 `draft_spec`（pre 为 `approved_spec`）或 `phase_authorities#/phases~1P1.md` 等实际相对成员。引用只定位本包已提交材料，不读包外路径；理由由审查者核合理性，不以字段可读认证真值。缺源或尚有范围矛盾时该项写 null 并说明未知，旧包缺这些内容仍正常审查：默认 review、simplicity-guard、plan-eng-review 三 lens，指令显出缺口而不当非 UI/N/A；三项均有效且非 null 时任一 true 才加同包 plan-design-review，全部 false 才省该 UI lens。直接调用与保存恢复沿同份材料选择，调用者标签不覆盖事实，不新增字段必填门、审查轮或用户确认。
10. 消费本次审查对测试面适用性、oracle 与理由的实际 findings；coverage unknown 保持未知，不用 Appendix 编号出现替代自查，也不新增审查轮。主会话逐条处置 fixed、rejected_invalid、accepted_risk 或 needs_human。有效设计问题回原作者修；严重问题若不修，向用户展示具体风险、影响和替代路径，取得真实选择并写负责人。未经实际处理不宣布计划已经完整。
11. 逐项核对原始需求、决策、spec、每个 Phase 与索引的语义、边界与测试充分性，六类（遗漏、矛盾、孤儿任务、越界、消费者、测试充分性）各给落点或排除理由，缺一即本步未完成；用 spec-analyze 执行同一核对。分析是质量事实，不是推进许可证；缺失与失败继续保持可见。
12. 交接重叠路径时，先写者交回该路径已核实状态；无法回读写 unknown 与原因，不阻断，后写者在自己的 Phase 边界点名先写者与依据。范围核对只读取并引用目标项目自己声明的受保护类别；待授权改动在材料中保持 pending，列具体文件/符号、授权原文位置和缺哪一条确认，已有确认按原件消费。分别核「授权是否包含该改动」与「是否超出声明写集」，各引用既有普通核对原件，不新建 scope 对象。项目声明的受保护改动未获授权或越界时只停该处；纯文档、注释、测试夹具的越界按真实来源继续登记；项目未声明类别时只查一次、记未声明，继续范围明确的规划，不等待新清单。展示将做什么、Phase 分工、验证办法、发现处置、风险与下一步，取得用户对当前计划的实际确认。拒绝或未答保持草稿，继续同任务的安全修复；确认不能被审查结果或 agent 推测代替。阶段末执行 stage-handoff，写人读交接。 有待处理缺口时，确认问题按三选一提出：①按现有材料修完缺口再推进；②指派缺口负责人后推进；③取消本次执行。未答不等于默认继续。交接逐项披露未启动、跳过、产物缺失、完成判据缺失；未确定为 unknown，工具或执行者不可用为 unavailable，`executor_absent` 只记为不可用。产物存在不能替代完成判据。

## UI 组件与真实消费者

第 5 步三来源合并且 ui_scope 为 true 时：读取 `skills/frontend-component-quality/SKILL.md` 的「## Component Quality Map」说明复用、改动或新增的真实消费者、状态 owner、typed ViewModel、单一 CSS/token owner、兼容影响及相应 story/test 更新。提取共享组件有至少两个真实消费者，删除有当前零消费证明；缺消费者、扫描、浏览器、数据、viewport 或 screenshot 记 unknown/unavailable，不当作零消费或完成。Design.md 管视觉/组件规范，Experience.md 管页面、交互和测试行为；只在跨越其职责时计划更新。规划设计检查，不替 build-code 执行前端或浏览器验收。

## 使用技能与人为门、审查点

按 `skill-deps.yaml` 直接读取方法；研究、Phase 草稿、RED 与独立审查依项目分工委派，主会话负责范围、用户问题和计划确认。技能缺失只记录其影响和覆盖限制，不另建调度器。

confirm 发生在 make-decision、build-plan 和 build-prd 收口，保留用户对实际展示材料的真实答复；本阶段的计划确认不授权 Git。不可逆动作前才使用 authorize，通过 `runtime/interface/git-authorize.mjs` 核动作、分支和当前 HEAD，HEAD 不一致时拒绝消费旧记录；已有用户授权覆盖动作和范围时，按当前 HEAD 重新记录并消费，仅未覆盖的新增动作或范围需用户决定。三审查点是本阶段 wh-review 合并、build-code 每 Phase OCR、verify-code 终末 OCR；make-decision/build-prd 的文档建议仍由 wh-review 按分工执行，不增加全 Phase 集成审查。

## 收口与安全

当前材料决定工作内容，测试、审查和历史不替代材料，也不是继续修复的许可证。写材料前核目标工作区与写集；原子写入失败明确报告，共享写入冲突用记录锁，原始来源与失败保留单份。阶段事实仍由现有公共流程处理，本方法不增加认证包装或永久状态。主会话执行 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径，说明材料现状、已做/未做、证据、风险及 build-code 下一步。handoff 必须实际执行并报告返回路径；缺失写清原因与影响，披露不代替完成，不要求固定机器复盘或逐步发布。

真实 stage 末有过程问题时，主会话可读取并调用 `skills/stage-reflection/SKILL.md` 一次，消费有源候选、真实用户选择与未解项的方法；局部 Phase 摘要不触发 stage-end。复盘可跳过并说明原因，取消、缺会话源或不可用保原事实，既有持续授权不代候选采纳。stage-handoff 独立按其方法保存一份交接并定位已决定、已完成且验证、未完成、证据位置四类 source；不以复盘或交接成为继续工作的许可证，不重复每 Phase handoff 或建立机器复盘。

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；本 workflow 只保原步骤与分支调用，不复制规范。

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/to-spec/SKILL.md`、`to-tickets/SKILL.md` 与 `tdd/SKILL.md`（由 spec-specify/spec-plan 原 owner 承接）；写作来源为 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs。固定来源是方法依据，不证明本次已获得行为效果。

本地保当前材料 owner、原步骤、真实用户回复、原失败与独立审查；只吸收适用方法，拒绝外置 tracker、GitHub ticket API、宿主 setup/Skill 硬依赖和第二进度权威。旧 bridge/外部 session 只读保历史 provenance，不作 active 执行、复盘、交接或 close 的门。方法接收真实项目材料、允许路径与宿主已批准的能力，缺源或能力如实报错，不绑定任务绝对路径或账号。迭代时核上述具名子文件的更新及更优候选，说明真实源差、本地偏离与采用理由，不自动追 HEAD。
