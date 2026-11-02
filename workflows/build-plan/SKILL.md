---
name: build-plan
description: 把已确认方向写成产品规格和独立、可执行的 Phase 计划。
version: 4.1.0
---

# Build Plan

## 目标与边界

消费当前 `decision-log.md` 和真实需求来源，编写同一 `spec.md` 的产品规格与全局实现设计、独立 `phases/P<n>.md` 和纯指针 `phases/index.md`。索引不能替代 Phase 正文，post 不双写 plan/tasks；pre 历史材料只读。本阶段不重新进行方向 Talk/Grill，不替用户决定新方向，不实施生产代码。材料有歧义走本阶段 spec-clarify，方向变化回 make-decision；无关的安全规划可以继续。

## 六段阅读顺序

本节回答：谁先交什么、哪里可以并行、哪些问题回原 owner；原 12 个 step_id 与 slug 保持。

1. 读懂需求（步骤 1–3）：需求审读者核来源、轻研究与歧义，主会话接用户答复；缺口回原来源或决定 owner。
2. 写 spec 与 UI 准备（步骤 4–5）：spec 作者写十组叙事与唯一判据，原型作者处理适用 UI 输入；同文件由一个 writer 写，独立路径才并行。
3. 拆 Phase 与全局设计（步骤 6）：Phase 作者写九组人读内容、完整任务卡与纯指针 index；全局设计仍写同一 spec，与上一步按共享文件定序。
4. 测试与验证设计（步骤 7–8）：测试作者给真实输入、oracle、失败与证据计划；可与无共享写入的 Phase 设计并行，不能用环境失败冒目标 RED。
5. 独立审查与处置（步骤 9–10）：审查者对当前完整材料提出建议，主会话处置；严重未修风险由用户作真实选择，provider 失败保持原限制。
6. 回核与收口（步骤 11–12）：独立读者与主会话回核六类语义、实际可读/可执行及缺口，取得用户当前计划确认后交接、记成本；未答不填同意。 开工前读 `skills/spec-plan/references/authoring-contract.md` 并写下五问答案；派发 brief 必须附该契约路径，缺附件回原派发者补齐。

分组只导航下文原步骤，不新增执行节点。每份材料先回答读者的问题，再放必要字段；文档读者能复述做什么/为什么/下一步/失败怎么办，工程师能试写并执行才是效果证据，格式检查只证兼容。

## 方法

写spec、Phase 与 index前，先读取 `skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」。
再读 `skills/spec-specify/SKILL.md` 的 Q01–Q13 唯一正文，然后调用本流程对应的材料作者。
缺源如实 `unavailable`，保留原问答、确认、权限和失败边界，不复制规范。

1. <a id="step-read-current-materials"></a>读取当前决策及已有材料，逐项提取需求、成功失败条件、非目标、约束、风险、已接受的不做事项和未决项。按 `skills/decision-log/templates/decision-log-template.md#外置事实索引` 的节级消费者定义，从当前主文取需求、写集、验收面、风险与未决项；到达条件满足时才沿原 ref 读证明或过程原件。保持需求到 FR、AC、Phase/Task、验证方法的双向可追溯；真实来源缺失就写缺口，不用旧审查或绿灯代填。
   在准备设计依据、作全局设计/测试蓝图选择前，按已确认方向和真实问题读取并执行 `skills/knowledge-graph/references/knowledge-reuse.md`：取得合法全文、比较并作四判，采用项定位到本spec设计/Phase选择及理由，未采用/待补证保范围与反例；不因确认过方向而跳过证据适用性判断。图导航按 `skills/knowledge-graph/SKILL.md` 实际进行本阶段开工调研：输入当前认证项目、已确认方向、原始需求和本次职责/允许写集，独立子代理按职责/source/consumer有界选完整ID与当前契约/历史两通道，再回origin原文核条件。主会话只收少数结论、来源与改变哪处产出或重复补强；图有界导航不自动带来收益。缺工具/坏图/无匹配/歧义保真实诊断并继续普通读源，现图查询不先更新，收费抽取仍先核精确范围/成本等真实答复。关键JSON/schema直接读原文件，不因图未覆盖自动扩图。当前已确认材料按真实范围消费，不为展示知识使用机械重写决策、规格或Phase；缺真实新规划问题就如实限定只读验证/受控草稿，不能冒已批准真实规划。
2. <a id="step-conditional-light-research"></a>按实现风险研究现有代码、真实消费者、接口和数据边界、权限、取消恢复、测试与回退方式。只调查会改变设计的问题；不必要或不可执行的研究写原因。有明确点状疑问时读取并执行 `skills/deep-research/SKILL.md` 的「轻研究 — 已收敛方向的点状问题」分支，消费它的真实内存结果或 skipped/unavailable 原因；发现母方向需改变交回 make-decision。方向研究仍沿该 owner 的深分支，不为轻问题强开深报告或复制第二研究规范。
   在本步原轻研究内再次按知识方法查模块职责/历史决定/失败教训，按source_file核当前真实消费者、接口与依赖/协作链；过期历史仅作背景，关键JSON契约直接读源。有效结论具体落到同一spec的设计边界或Phase切分及验收，注明相较原输入多知道什么/改变哪项；重复补强与无信号如实记，不另建研究账本，不让图代规格澄清、测试设计、独立审查或真实计划确认。
3. <a id="step-spec-clarify"></a>通过 spec-clarify 澄清影响结果的规格歧义。独立问题合问，有依赖的等真实回复；主会话保存问题、真实答复和影响，未答不默认同意。不为规划另开方向 Talk 或第二决策日志。
4. <a id="step-spec-specify"></a>用 spec-specify 写产品叙事、用户旅程、状态与异常行为、FR 和唯一验收条款。明确每条验收的场景、可观察结果、通过和失败条件；保持 decision-log 的取舍与退役决定，不自动补做已经退出的需求。
5. <a id="step-conditional-ui-readiness"></a>UI 适用时沿 `skills/project-norm-init/SKILL.md` 的「规范职责」定位并读取本动作适用的专业源及实际页面/组件消费者；按类记真实路径/稳定节、version/作用域、owner/consumer、适用规则与缺源/冲突影响。读取等价实质源而非强制默认文件或旧 Design.md/Experience.md 两份 active 规范；本次业务行为仍沿当前 task spec/API、值/API事实引用原源。单类 missing/stale 不使其它类失效，缺口交该原 owner，不复制八类正文或新造 binding schema。需要时使用 project-norm-init、design-source-readiness、frontend-prototype-render 和设计审查方法。展示真实原型或标明预览缺失，不能把静态稿或截图名称当交互验证。非 UI 写原因，来源冲突保持 unknown；UI 选择在现有计划确认中呈现，不新建阶段或确认槽。 UI 适用性按三个来源的证据合并，不按调用者标签：`raw_requirement` 是用户原始页面/交互/非 UI 请求，`project_inventory` 是当前路由、前端技术与组件/消费者事实，`planned_or_changed_frontend_fact` 是已接受计划或实际前端改动；`source_reasons` 写显式事实，不新增必填字段。
   UI 适用时实际执行 `skills/frontend-component-quality/SKILL.md` 的「触发与实现前就绪」，按其参考逐项判断来源、缺口、测试数据和处置，供 Phase 作者及实施者消费；非 UI 记理由，不建空表。
   UI 两路输入、原型位置、独立设计审查、当前展示答复、证据与失败的完整方法沿 `skills/frontend-prototype-render/SKILL.md` 与 `skills/plan-design-review/SKILL.md` 消费；通用原型位于 `specs/<task>/prototype/`，受控样本按其已确认 Phase 的专属路径。两路能力及实际样本由对应方法 owner 承接，本段只指向职责，不以预览名称冒实测。
   本步原型作者实际执行上述两路方法：有稿五输入与范围/映射/缺陷先于实现，无稿需求/真实语义/许可/合成数据先于原创；必要Figma Make提示词读取 `skills/figma-make-prompt/SKILL.md`。完成可运行原型后交未参与实现者作八维独立设计审查、修复并复验，再展示当前完整范围取得用户真实答复；未答/拒绝/工具失败保对应未完成，不以静态稿或提示词代原型。C05受控样本专属位置 `specs/<task>/samples/A` 与 `samples/B`；只在本任务指定的验证Phase执行，不改通用原型位置或12个step身份。
   UI 且已有合法可读设计源时，完成 design-source-readiness 后读取 `skills/design-source-extraction/SKILL.md`，沿任务原 ref 消费单份机器产物 `design-source-extraction.json`（原件可带日期，不复制重命名）。将 `source`、`scope`、`norm_basis`、`items` 与实际证据用于本 spec 设计依据及 Phase 输入；声明、渲染值与待议规范分开。按 `references/norm-alignment.md`、`references/isolated-consumption.md` 对账与交接，不用模板占位或原型值当产品规范。核 `freshness` 与当前来源/规范/结构；unknown 补具名材料，stale 先沿已有 `node skills/design-source-extraction/scripts/collect-design-source.mjs --plan <已认证冻结plan>` 重提炼，未执行保未执行。非 UI 或无合法设计源说明适用范围与缺口，不给其它任务增加提炼门。
6. <a id="step-spec-plan"></a>全局设计与测试蓝图选择前，实际按 `skills/project-norm-init/SKILL.md` 的“非UI规范与索引”读取本次适用后端/接口/验收源；缺源/过期/冲突给原owner与影响，仅暂停依赖该规则的选择，其余继续，不把unknown记N/A。选择足够简单的方案：先复用，再窄扩展，确有真实收益才新机制。非平凡工作先手工完成一单元作为独立 oracle，再复用最小可重跑工具/委派方法处理同单元并逐项对照；标签须回到对应真实产物、输入与原判据，不能只比数量。worker允许写集排除自身验收契约与保留标签；实施后核这些原件未改，不能修改判据换绿，不声称仅有DO NOT TOUCH就已建立物理隔离；只冻结相关契约而非全树。简单动作直接完成，不造无消费者框架。用 spec-plan 在同一 spec 写全局接口、数据流、兼容、风险、回退和文件边界，再写独立 Phase。边界由可独立交付验收单元决定，写集是申报结果；同一并行批次须有独立输入且同路径互斥，跨批次同路径须有真实依赖边定序，在相邻 Phase 边界点名先写者、后写者与依据。共享接口变化先重排分工，不让两个代理同时改同一文件。 Phase 拆分粒度以 `spec-plan` 的 `phase-template.md`「判定规则」全集（拆与并两半）唯一为准，本 workflow 不复述、不软化。校验器报写集重复时，按 ADR-0036 消费既有治理文件豁免与已按 Dependency 串行的判定，核实际依赖与声明；原失败或缺口如实记 `open`，不为此改运行时规则或新增豁免种类。 开工前读 `skills/spec-plan/references/authoring-contract.md` 并写下五问答案；派发 brief 必须附该契约路径，缺附件回原派发者补齐。
   保存 Phase 草稿沿现公开 `run --action=draft`。先写具名 Phase，再生成索引。
   草稿与已定义任务卡的正文边界见作者契约的「发布草稿」；写入成功只说明保存成功。
   成本设计按下节「设计每个 Phase 的验收」逐条核七字段与资源来源，按 Phase 模板验收节汇总活动总账。
   同时核 make-decision 已确认的形状预检、验收→独立测试代理/判定器/数据层级映射；缺项回原阶段。
7. <a id="step-testing-system-blueprint"></a>每条承接 AC 按 spec 模板与 Phase 卡的证据计划落七字段，七项取真实对象与时点，缺一项不得开工；不另建验收计划。为每个任务写清目标、真实输入/消费者、允许路径/符号、禁止范围、步骤、完成条件、失败信号与恢复办法、成本假设。testing-system-blueprint 设计风险、场景、oracle、证据与覆盖限制；项目在任务「测试标准」及每张 Phase/Task 自行声明测试面、逐面测或不测的理由，每个要测的面与覆盖 AC 指向该 Phase 一条可执行命令；浏览器可见面未列浏览器端到端时给具名理由。test-routing-advisor 只作技术路线预判，选择主 concrete testing skill，不替项目定义测试面。验收对象、输入、执行 owner 与时点按 `skills/spec-plan/SKILL.md` 的「Test design and quality」落进现 AC/Task 正文；需要对象检查时，读取 `skills/spec-specify/templates/spec-template.md` 中唯一 `checkAcceptanceObject` 的完整可执行代码块，从当前 spec 的既有验收对象区块取得真实输入，沿模板「验收对象」唯一合同复用第5步三源事实并实际读取其引用材料，核角色、理由与范围冲突，将三源适用性和已读材料作为本次 context 传给同一函数；直接执行验收对象检查并保存对象输入、三源引用/读取范围/hash、返回与执行原件，不在本 workflow 定义或复制另一个 checker。模板 producer 未交付、无法提取或执行失败时，具体记 producer/source/执行失败、影响与原 owner，未运行不宣缺项行为通过；对象检查不证明环境健康或业务运行。可执行产物按同节规划唯一末 Phase 全 AC 验收，纯文档按该处具名豁免。独立 Phase 写完后读取并执行 `skills/spec-plan/SKILL.md` 的「## Pure pointer index」生成纯指针索引；消费它按实际附件存在与 bundle 登记选择模板的条件，不新建薄调用或在此复制索引规范。执行进度留在任务事实而非材料正文。 每条需求在 spec 与 Task 卡必须落成「动作＋命令＋期望」三件套，缺任一不得进入 Task 卡、不得开工；命令写成可直接执行的整条命令，期望写退出码或可观察结果。开工前按 `skills/spec-plan/SKILL.md` 的红测归因要求写清每条红测属于目标行为失败、夹具或环境失败、本来就通过哪一种；只写命令与期望退出码不算写完。 开工前读 `skills/spec-plan/references/authoring-contract.md` 并写下五问答案；派发 brief 必须附该契约路径，缺附件回原派发者补齐。
   每条验收落 Phase 前先按「设计每个 Phase 的验收」算三笔账；算不清归属与本 Phase 交付的条款不进 Phase 文件。
8. <a id="step-test-routing-advisor"></a>行为改动在实施前写有意义的目标测试并实跑 RED：命名目标断言失败才算目标 RED，收集、环境或配置失败另记。冻结评分逻辑，实施使用同一 oracle 做 GREEN；改变 oracle 先提出具体 test change request 并独立审查，旧字节和失败原件保留。纯方法/文档按 G-2 做可证伪读回或说明具体不适用理由，不造仪式性 RED。 按名改一个已先在 Phase 卡里点名的既有具名常量取值不触发 TCR（测试变更请求）；改断言表达式、期望方向、判定或评分逻辑仍须走既有 test change request 与独立审查。冻结 oracle 的单一来源是该 Phase 卡的预写测试与 `DO NOT TOUCH` 声明，按每任务声明一次；每次实际测试变更的来源是同卡「测试变更请求」字段加一份独立审查原件，变更后 oracle 身份（`ORACLE-…`）保持不变，不另立账本、不复制镜像、不按每个 oracle 另记一次账。免 TCR 只区分期望值来源与断言变更，不扩大写权限或任务授权，不降低断言强度、不取消独立审查、不改变 `DO NOT TOUCH` 的物理隔离要求。 AC 或冻结测试的改动必须取得用户真实答复并保留原件（ref 与原文），方案作者不得单方放宽；审查建议、findings 与 agent 推测都不算用户答复。
9. <a id="step-merged-review"></a>在 Phase 审查前，自查每条承接 AC 的七字段与 incomplete 记录，缺项进本轮盘点事实；incomplete 必须带真实尝试 ref、阻塞条件、提供者与恢复条件。逐 Phase/Task 自查项目声明的测试面是否适合结果与写集、oracle 是否能证伪、测或不测的理由是否有源；按 `skills/spec-plan/SKILL.md#Test design and quality` 逐条件核输入与时点，遗漏与未知逐项定位。对当前规格和 Phase 做一次 wh-review 合并审查。simplicity-guard、plan-eng-review 等 lens 看同一材料，发现由独立上下文产生，不成为额外固定审查轮。保留原始 findings、实际 provider、失败和覆盖限制，不把 unavailable 写成空 findings 或通过。组包者将第5步已核的三来源事实作为普通可选内容放入 `context_map.ui_applicability`，三项键为 `raw_requirement`、`project_inventory`、`planned_or_changed_frontend_fact`，每项用 `{ui_scope: true|false|null, source_ref: "材料key或key#/JSON-pointer", reason: "实际来源理由"}` 描述当前审查范围。库存正文放同一 `context_map.project_inventory`；原要求引用 `raw_requirement`，库存引用 `context_map#/project_inventory`，已接受计划引用 `draft_spec`（pre 为 `approved_spec`）或 `phase_authorities#/phases~1P1.md` 等实际相对成员。引用只定位本包已提交材料，不读包外路径；理由由审查者核合理性，不以字段可读认证真值。缺源或尚有范围矛盾时该项写 null 并说明未知，旧包缺这些内容仍正常审查：默认 review、simplicity-guard、plan-eng-review 三 lens，指令显出缺口而不当非 UI/N/A；三项均有效且非 null 时任一 true 才加同包 plan-design-review，全部 false 才省该 UI lens。直接调用与保存恢复沿同份材料选择，调用者标签不覆盖事实，不新增字段必填门、审查轮或用户确认。 逐 Phase/Task 核三件套是否齐、每条红测归因是否写明，缺项写进本轮盘点事实，缺项未清不算自查完成。
   post 组包先运行 `node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log <当前决策日志相对路径> --spec <当前规格相对路径>`；两个参数用本次已读取的真实文件路径替换。
   将 stdout 的完整 Markdown 正文放入 `materials.decision_baseline`，它是当前权威的有源摘要；descriptor-only 或 JSON 占位不算正文。
   按当前材料矩阵投递完整规格、验收、各独立 Phase 与索引；原始需求只取适用短摘录。实际两路沿 `skills/wh-review/contracts/build-plan.md` 分别核需求/验收与方案/可执行性。
   历史原件已有 `legacy` 或 `request_version` 时才沿原标记保留缺基线警告，不给新请求补标记。CLI 缺源、分组冲突或超限时保原错误，回当前材料作者修复；公开 ref 仍只由原入口解析，不另建 reader。
10. <a id="step-main-agent-disposes-findings"></a>消费本次审查对测试面适用性、oracle 与理由的实际 findings；coverage unknown 保持未知，不用 Appendix 编号出现替代自查，也不新增审查轮。主会话逐条处置 fixed、rejected_invalid、accepted_risk 或 needs_human。有效设计问题回原作者修；严重问题若不修，向用户展示具体风险、影响和替代路径，取得真实选择并写负责人。未经实际处理不宣布计划已经完整。 findings 只作问题来源，判据或 AC 的改动仍须用户真实答复原件，不得以「审查同意」代替。
11. <a id="step-final-spec-analyze"></a>逐项核对原始需求、决策、spec、每个 Phase 与索引的语义、边界与测试充分性，六类（遗漏、矛盾、孤儿任务、越界、消费者、测试充分性）各给落点或排除理由，缺一即本步未完成；用 spec-analyze 执行同一核对。分析是质量事实，不是推进许可证；缺失与失败继续保持可见。 第七类：读者可用，沿 `skills/spec-analyze/SKILL.md` 的对应段观察句长、行宽与术语解释，读数只报告；四条子判据是编号重复率、重复重述比例、模板与材料一致、写集与真实 diff。由未参与写作的独立子代理按当前验收对象读取 `phases/index.md`、相应 Phase 与相关规格原文，范围按真实问题选择，不设字符上限；按七段记录读者身份、范围、五问原答、原始需求对照、真跑命令与退出码、缺口及结论，记录存当前任务 `quality/tests/`。五问沿作者契约给出原答；原需求超出只读范围时明写未读取，不猜对照结论。执行 `node skills/spec-plan/scripts/check-reader-record.mjs <记录路径>`，0只证形态、2点名缺段或空答、1保不可读原错；路径写入阶段交接的“已做与未做”。收口前对当前 spec 与全部 Phase 逐件运行 `node skills/spec-plan/scripts/check-authoring-budget.mjs <材料路径>`，读数不设通过阈值，可读材料退出0，不进持续集成，不以读数代独立复述。
   本次验收要求证明作者方法或模板效果时，执行作者契约的「完整作者消费」。
   交回独立作者的实际产物、原需求对照与相关命令原件；未取得保持缺口，不以样板路径代填。
   收口前按 spec-analyze 的「原始需求覆盖核对」逐条对号，出覆盖表与缺口清单。
   四段是需求、方案（FR 或设计）、AC 与 Phase 承接；任一缺失即未覆盖。
   每条原始需求要由具体 AC 判到；只被合并描述覆盖、又没有决定原文的，算缺口。
   显式退役或延期要有决定原文与 owner；延期的另写触发条件。
   有这些去向不算缺口，但单列「已声明不做」，不混进缺口清单。
   另核每条 AC 至少被一个 Phase 的「覆盖 AC」列出，不只挂在 spec 上。
   缺口清单逐条列出没有人认领的需求编号、无 Phase 承接的 AC 编号，以及回哪个 owner 补。
   它按最小充分验收算成本：静态读材料对号，不跑测试、不重跑全量验证。
   缺口清单非空时 build-plan 不许收口，补齐后只复核受影响需求。
12. <a id="step-closeout"></a>交接重叠路径时，先写者交回该路径已核实状态；无法回读写 unknown 与原因，不阻断，后写者在自己的 Phase 边界点名先写者与依据。范围核对只读取并引用目标项目自己声明的受保护类别；待授权改动在材料中保持 pending，列具体文件/符号、授权原文位置和缺哪一条确认，已有确认按原件消费。分别核「授权是否包含该改动」与「是否超出声明写集」，各引用既有普通核对原件，不新建 scope 对象。项目声明的受保护改动未获授权或越界时只停该处；纯文档、注释、测试夹具的越界按真实来源继续登记；项目未声明类别时只查一次、记未声明，继续范围明确的规划，不等待新清单。展示将做什么、Phase 分工、验证办法、发现处置、风险与下一步，取得用户对当前计划的实际确认。拒绝或未答保持草稿，继续同任务的安全修复；确认不能被审查结果或 agent 推测代替。计划真实确认后，由当前主会话按 `skills/stage-reflection/SKILL.md`「方法」「用户选择后的归口」「判断词表与完成检查」执行阶段收口，内部发布并读回交接；未答保草稿，不发布已确认计划的交接。 有待处理缺口时，确认问题按三选一提出：①按现有材料修完缺口再推进；②指派缺口负责人后推进；③取消本次执行。未答不等于默认继续。交接逐项披露未启动、跳过、产物缺失、完成判据缺失；未确定为 unknown，工具或执行者不可用为 unavailable，`executor_absent` 只记为不可用。产物存在不能替代完成判据。 展示时逐条列出仍缺三件套或判据改动无答复原件的项，未列齐不算已确认。

阶段收口中的成本：执行 `skills/stage-reflection/SKILL.md`「方法」第 3 步的 measure-main-agent-cost 入口及完整来源、窗口、失败和删除前留账边界；本阶段只在整个 stage 末触发一次，同一计量窗口不重复，不每 Phase 触发。

## 设计每个 Phase 的验收

验收按 Phase 与工作包设计；每条原始需求是否都被覆盖，由收口时的覆盖核对判。
写条款前先算三笔账，算完再写条款。

- 成本账：复用 spec Appendix A 的七字段，按 Phase 模板汇总串行和、并行最大、共享准备与重试预留。
  超限按该模板先拆分或缩减重复验证，保留原验收覆盖；涉及方向或范围变化回原决定 owner。
- 资源账：每条需要什么外部件，含样张、真实环境、独立执行者、用户反馈；优先用仓内已有的。
  必须新造的写清怎么造、多久；造不出来的删掉，不写成通过条件。
- 范围账：这条证的是本 Phase 哪个交付；跨 Phase 的写成「供件」，不写成「承接」。

硬规则：写不出「谁做、多久、靠什么、怎么观察」的验收，不许进 Phase 文件。

### 成本在确认前怎么复核？

未参与写作的独立读者在材料成稿与发现修复后重算，再由用户确认当前展示。
读者抽至少两条当前 spec 验收，核七字段、资源来源、首判与末验时点。
同时核全部验收均有来源和判定归属，再重算一个 Phase 总账。
计算方式、等待分账、任务形状与数据层级按 Phase 模板验收节，不另造预算公式。
缺字段退回原作者，结构检查退出 0 不能代独立语义读回。

计划包含历史成本回放时，只读调用方指定的历史 spec、Phase 和原始执行清单。
读者并列研究汇总与执行清单的命令数、非零数、时间窗及成本缺项。
双方冲突原样保留，墙钟跨度不转换为活动执行成本，估算也不冒实测。
历史末段拆便宜可证与真实环境两段，分别列现有数字、缺项、提供者与恢复条件。
活动校准只由真实 stage-end ledger row/window 恢复；缺账保持 incomplete。
回放不重跑历史业务，不用当前模板通过宣称历史通过。

第 12 步计划确认必须展示逐条成本引用、每个 Phase 总额、软硬上限及来源。
同时展示拆分、缺口、研究/实测冲突、独立重算原件与等待分账。
仍超硬上限按 Phase 模板展示总额、根因与拆分并取得真实确认；未答保草稿。
已有覆盖同一范围的真实决定直接引用，不重问；阈值未校准标 provisional。
这些读数不写进任务存储或第二预算账本，不增加公共步骤或机器预算门。

最小充分验收：能用既有样本就不新造；能抽检就不全量；能一次就不做两次；能用一条命令判就不写人工流程。
只要判真伪的能力不降，就必须选更便宜的那种。

反例清单，以下写法禁止进 Phase 文件：

- 要求新造一个别处没有的样张才能判。
- 要求同一件事跑两遍做前后对照，而一次就够判。
- 要求做完整个受影响面，而抽 1–2 处就能判。
- 要求「稳定」「长期」「全面」这类本 Phase 证不了的指标。
- 把别 Phase 的交付挂成本 Phase 的承接。

验收因标准设计不合理而长期停在 `incomplete`／`unavailable` 的，属于标准缺陷：先改标准，不许一直挂着。
档位细则见 Phase 模板的「档位使用规则」，此处不复述。

## UI 组件与真实消费者

第 5 步三来源合并且 ui_scope 为 true 时：读取 `skills/frontend-component-quality/SKILL.md` 的「## Component Quality Map」说明复用、改动或新增的真实消费者、状态 owner、typed ViewModel、单一 CSS/token owner、兼容影响及相应 story/test 更新。提取共享组件有至少两个真实消费者，删除有当前零消费证明；缺消费者、扫描、浏览器、数据、viewport 或 screenshot 记 unknown/unavailable，不当作零消费或完成。来源读取与分权沿第5步的同一记录，不再写第二份规范职责正文；必要变更只计划原专业 owner 更新，任务行为与执行事实保留各原 owner。规划设计检查，不替 build-code 执行前端或浏览器验收。

## 使用技能与人为门、审查点

按 `skill-deps.yaml` 直接读取方法；研究、Phase 草稿、RED 与独立审查依项目分工委派，主会话负责范围、用户问题和计划确认。技能缺失只记录其影响和覆盖限制，不另建调度器。

confirm 发生在 make-decision、build-plan 和 build-prd 收口，保留用户对实际展示材料的真实答复；本阶段的计划确认不授权 Git。不可逆动作前才使用 authorize，通过 `runtime/interface/git-authorize.mjs` 核动作、分支和当前 HEAD，HEAD 不一致时拒绝消费旧记录；已有用户授权覆盖动作和范围时，按当前 HEAD 重新记录并消费，仅未覆盖的新增动作或范围需用户决定。三审查点是本阶段 wh-review 合并、build-code 每 Phase OCR、build-code 终末 OCR；make-decision/build-prd 的文档建议仍由 wh-review 按分工执行，不增加全 Phase 集成审查。

## 收口与安全

执行纪律：缺失即未完成；跨包不合批；确认与推进分开问，分诊、骨架与最终确认分别问；少打扰不等于跳过步骤。步骤证据位置以本阶段 `steps.json` 为指针，研究、审查、确认、测试和问答原件仍放既有位置，不在决策日志新增步骤节；问答原件开头写明批次类型。收口前运行 `node tools/cli/check-stage-steps.mjs --stage=build-plan --task-path=<任务目录>`，逐项消费判定与缺口；检查器只报告、退出 0，不证明完成。入口推荐行使用可解析字面，如 `- 推荐级别：复杂`；既有日志不回改，未命中就报“未读到级别事实”。

当前材料决定工作内容，测试、审查和历史不替代材料，也不是继续修复的许可证。写材料前核目标工作区与写集；原子写入失败明确报告，共享写入冲突用记录锁，原始来源与失败保留单份。阶段事实仍由现有公共流程处理，本方法不增加认证包装或永久状态。主会话执行 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径，说明材料现状、已做/未做、证据、风险及 build-code 下一步。handoff 必须实际执行并报告返回路径；缺失写清原因与影响，披露不代替完成，不要求固定机器复盘或逐步发布。

阶段末统一按收口方法执行一次；交接内容与独立读取沿 `skills/stage-handoff/SKILL.md`「信息来源」「回读结果」「结束条件与边界」，返回其实际不可变路径。局部 Phase 摘要不触发收口，原失败与缺口可见，持续授权不代候选采纳。

写完材料，按 `skills/material-writing/SKILL.md` 的「写完自检」逐条核；核不过就改，不交出去。

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；本 workflow 只保原步骤与分支调用，不复制规范。

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/to-spec/SKILL.md`、`to-tickets/SKILL.md` 与 `tdd/SKILL.md`（由 spec-specify/spec-plan 原 owner 承接）；写作来源为 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs。固定来源是方法依据，不证明本次已获得行为效果。

本地保当前材料 owner、原步骤、真实用户回复、原失败与独立审查；只吸收适用方法，拒绝外置 tracker、GitHub ticket API、宿主 setup/Skill 硬依赖和第二进度权威。旧 bridge/外部 session 只读保历史 provenance，不作 active 执行、复盘、交接或 close 的门。方法接收真实项目材料、允许路径与宿主已批准的能力，缺源或能力如实报错，不绑定任务绝对路径或账号。迭代时核上述具名子文件的更新及更优候选，说明真实源差、本地偏离与采用理由，不自动追 HEAD。

## 驾驶舱交接

开工读取已确认骨架后，由本阶段主会话按 skills/answer-as-page/SKILL.md 共同入口用 `skeleton-confirmed` 补首次生成，传认证任务根、实际报告与任务库输出路径，不手拼 pageData。plan 定稿有方向/范围/验收实变时，同入口用 `direction-scope-acceptance-changed`；只改措辞/指针不触发。环状态只取报告，本阶段不预填完成；交给 build-code 后逐 Phase 审后提交与 norm-sync 的事件由该 caller 接手。旧页/侧车、失败与未自动打开沿同一技能规则保留。

## 当前步怎么执行？

主会话从本阶段步骤表投影当前卡，只读本步和必要前置。
调用检查器时显式给任务根、材料根、阶段和当前步；跳过使用可核当前 Phase 或真实 HEAD。

`node tools/cli/check-stage-steps.mjs --stage=build-plan --step=N --card --task-path=<任务根> --material-root=<材料根> --phase=<当前Phase>`

卡给结果、进入与停止条件、最多三个读取位置、具名证据、自查命令和答复要求。
步骤表的稳定锚直达本步正文；前置原件可读只表示留痕，完成仍按本步原判据。
显式跳过用 `--skip-with-gap=N --reason=<原因> --owner=<负责人> --recovery=<恢复条件>`。
检查器经现有任务句柄保存普通原件；缺字段或当前身份不可读时不记录、不前进。
Phase 沿现有当前游标、索引、物理任务和材料提交核对；提交必须等于真实工作区 HEAD。
运行编号当前没有可认证的现役权威，写跳过时改用上述身份，不猜默认编号。
当前原件沿 facts 的本阶段 source、step_slug、实际 ref 逐件读回；目录只作导航。
收口读同一报告的 `closeout.gaps`，逐项披露未清缺口和恢复条件，记未完成。
缺口跨 Phase、提交和运行编号持续披露；只有既有完成生产者所引的本步同身份原件可解除。
解除原件还须晚于缺口，当前方向未把本步列为失效；缺证明就保留缺口。
检查器保持退出 0，只报事实，不建立步骤账本、游标或通用退出门。

阅读基线：记录路径、字节、跳步、返工、Phase 时长的前后原始读数；只建立基线，不宣称改善。

执行策略由 make-decision 与用户收敛；本阶段只消费和核对。
缺任务形状、S/M/L 数据、测试选择、事件等待、证据指针、检查点或可并行面，
回原阶段补齐；不在此重开方向，不猜默认值。
